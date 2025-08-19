// بخش صوت و وضعیت پخش
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let isPlaying = false;
let stopRequested = false;



// شخصی سازی صدا
const soundPresets = {
  sine1: [523.25, 1046.50],
  sine2: [659.25, 1318.51],
  sine3: [784, 1568],
};



// بخش پخش کلیک (envelope برای جلوگیری از پاپ) — REPLACEMENT
function playClick(frequency, gain = 1, length = 0.06) {
  try {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();

    const now = audioCtx.currentTime;

    osc.type = "triangle";
    osc.frequency.value = frequency;

    // very small initial value to avoid clicks, use exponential ramps
    g.gain.setValueAtTime(0.0001, now);
    // target the requested per-click gain (this gain will be multiplied by master boost chain)
    const target = Math.max(0.001, gain);
    // quick ramp up
    g.gain.exponentialRampToValueAtTime(target, now + 0.001);
    // ramp down to avoid pop
    g.gain.exponentialRampToValueAtTime(0.0001, now + length);

    osc.connect(g);

    // connect into master boost chain if present, otherwise fallback to destination
    try {
      if (window.__masterBoost && window.__masterBoost.userBoostGain) {
        g.connect(window.__masterBoost.userBoostGain);
      } else {
        g.connect(audioCtx.destination);
      }
    } catch (e) {
      g.connect(audioCtx.destination);
    }

    osc.start(now);
    osc.stop(now + length + 0.02);
  } catch (err) {
    console.error('playClick error:', err);
  }
}





// بخش تحلیل الگو
function parsePattern(pattern) {
  return pattern.split("+").map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
}




// بخش تبدیل BPM به تاخیر
function getBpmDelay(bpm) {
  const b = parseFloat(bpm);
  if (!isFinite(b) || b <= 0) return 0.5;
  return 60 / b;
}





// بخش نمایش BPM یکپارچه
function updateBpmDisplay() {
  const bpmSlider = document.getElementById("mainBPM");
  if (!bpmSlider) return;
  const bpm = parseFloat(bpmSlider.value);
  const min = parseFloat(bpmSlider.min || 10);
  const max = parseFloat(bpmSlider.max || 600);
  const percent = ((bpm - min) / (max - min)) * 100;

  const baseSel = document.getElementById('baseNoteSelect');
  const baseVal = baseSel ? baseSel.value : "1";
  const quarter = toQuarterBpm(bpm, baseVal);
  const baseLabel = baseSel ? (baseSel.options[baseSel.selectedIndex]?.text || '') : '';

  document.getElementById("bpmDisplay").textContent = `${bpm}`;
  bpmSlider.style.background = `linear-gradient(to right, var(--x) 0%, var(--x) ${percent}%, #444 ${percent}%, #444 100%)`;
}





// بخش اجرای الگو (ریتم اصلی یا پلی‌ریتم)
// اضافه: پارامتر آخر progressCb برای گزارش وضعیت (غیرمسدود)
async function playPattern(pattern, bpm, repeats, preset, volume = 1, onlyFirst = false, progressCb = null) {
  const [lowFreq, highFreq] = soundPresets[preset] || soundPresets.sine1;

  const delay = getBpmDelay(bpm);
  let clickLength = Math.min(0.08, Math.max(0.006, delay * 0.6));
  if (clickLength > delay * 0.9) clickLength = Math.max(0.006, delay * 0.45);

  try {
    for (let r = 0; r < repeats; r++) {
      // گزارش شروع هر تکرار (میزان)
      if (progressCb && typeof progressCb === 'function') {
        try {
          progressCb({ type: 'repeatStart', repeatIndex: r, repeatNumber: r + 1, repeats });
        } catch (e) { /* ignore */ }
      }

      for (let groupIndex = 0; groupIndex < pattern.length; groupIndex++) {
        const group = pattern[groupIndex];
        if (stopRequested) return;

        for (let i = 0; i < group; i++) {
          if (stopRequested) return;

          if (onlyFirst && i > 0) {
            // گزارش هر بیت (در صورت نیاز) — غیرمسدود
            if (progressCb && typeof progressCb === 'function') {
              try {
                progressCb({
                  type: 'tick',
                  repeatIndex: r,
                  repeatNumber: r + 1,
                  groupIndex,
                  beatIndex: i,
                  groupSize: group
                });
              } catch (e) {}
            }
            await new Promise(res => setTimeout(res, delay * 1000));
            continue;
          }

          // گزارش قبل از پخش کلیک (غیرمسدود)
          if (progressCb && typeof progressCb === 'function') {
            try {
              progressCb({
                type: 'tick',
                repeatIndex: r,
                repeatNumber: r + 1,
                groupIndex,
                beatIndex: i,
                groupSize: group
              });
            } catch (e) {}
          }

          const freq = (i === 0) ? lowFreq : highFreq;
          playClick(freq, volume, clickLength);

          await new Promise(res => setTimeout(res, delay * 1000));
        }
      }
    }
  } catch (err) {
    console.error('playPattern error:', err);
  }
}






// بخش گزینه‌های نت پایه و ایجاد select مربوطه
const baseNoteOptions = [
  { value: "whole", key: "whole", label: "whole" },
  { value: "dottedWhole", key: "dottedWhole", label: "dottedWhole" },
  { value: "half", key: "half", label: "half" },
  { value: "dottedHalf", key: "dottedHalf", label: "dottedHalf" },
  { value: "quarter", key: "quarter", label: "quarter" },
  { value: "dottedQuarter", key: "dottedQuarter", label: "dottedQuarter" },
  { value: "eighth", key: "eighth", label: "eighth" },
  { value: "dottedEighth", key: "dottedEighth", label: "dottedEighth" },
  { value: "sixteenth", key: "sixteenth", label: "sixteenth" },
  { value: "dottedSixteenth", key: "dottedSixteenth", label: "dottedSixteenth" },
  { value: "thirtySecond", key: "thirtySecond", label: "thirtySecond" },
  { value: "dottedThirtySecond", key: "dottedThirtySecond", label: "dottedThirtySecond" },
  { value: "sixtyFourth", key: "sixtyFourth", label: "sixtyFourth" },
  { value: "dottedSixtyFourth", key: "dottedSixtyFourth", label: "dottedSixtyFourth" }
];


function createPolyBaseNoteSelect() {
  const sel = document.createElement('select');
  sel.className = 'polyBaseNote';
  const currentLang = (document.getElementById('langSelect') && document.getElementById('langSelect').value) || 'en';
  baseNoteOptions.forEach(opt => {
    const o = document.createElement('option');
    o.value = opt.value;
    o.setAttribute('data-i18n', opt.key);
    const txt = (translations && translations[currentLang] && translations[currentLang][opt.key]) || opt.label;
    o.textContent = txt;
    if (opt.key === 'quarter') o.selected = true;
    sel.appendChild(o);
  });
  return sel;
}






// بخش تایمر کوچک با رزولوشن بالا (SmallTimer)
// تغییر: تلاش برای قرارگیری امن کنار تیک ریتم اصلی (mainOnlyFirstTick) به‌جای تیک سراسری قبلی
(function registerSmallTimerSafe() {
  if (window.SmallTimer && document.getElementById('smallTimer')) return;

  let smallTimerEl = document.getElementById('smallTimer');
  try {
    if (!smallTimerEl) {
      smallTimerEl = document.createElement('div');
      smallTimerEl.id = 'smallTimer';
      smallTimerEl.style.cssText = 'font-size:0.75rem; color:var(--small-timer-color,#dcdcdc); margin-top:6px; text-align:right; min-width:72px; line-height:1;';
      smallTimerEl.setAttribute('aria-hidden', 'true');
      smallTimerEl.textContent = '00:00.00';

      // تلاش برای پیدا کردن تیکِ ریتم اصلی (mainOnlyFirstTick) یا fallback
      const mainOnlyElem = document.getElementById('mainOnlyFirstTick') || document.getElementById('onlyFirstTick');
      if (mainOnlyElem) {
        const parentLabel = mainOnlyElem.closest('label');
        if (parentLabel && parentLabel.parentNode) parentLabel.parentNode.insertBefore(smallTimerEl, parentLabel.nextSibling);
        else if (mainOnlyElem.parentNode) mainOnlyElem.parentNode.insertBefore(smallTimerEl, mainOnlyElem.nextSibling);
        else (document.getElementById('mainContainer') || document.body).appendChild(smallTimerEl);
      } else {
        (document.getElementById('mainContainer') || document.body).appendChild(smallTimerEl);
      }
    }
  } catch (e) {
    try { document.body.appendChild(smallTimerEl); } catch (e2) {}
  }

  function formatMsToMMSSCS(ms) {
    const totalCentis = Math.floor(ms / 10);
    const cs = totalCentis % 100;
    const totalSecs = Math.floor(ms / 1000);
    const secs = totalSecs % 60;
    const mins = Math.floor(totalSecs / 60);
    return `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
  }

  let _raf = null;
  let _start = 0;
  let _running = false;

  function _tick() {
    if (!_running) return;
    const elapsed = performance.now() - _start;
    try { smallTimerEl.textContent = formatMsToMMSSCS(elapsed); } catch (e) {}
    _raf = requestAnimationFrame(_tick);
  }

  const API = {
    start() {
      if (_running) return;
      _start = performance.now();
      _running = true;
      try { smallTimerEl.textContent = '00:00.00'; smallTimerEl.style.display = ''; smallTimerEl.classList.remove('paused'); } catch (e) {}
      _raf = requestAnimationFrame(_tick);
    },
    stop() {
      if (!_running) return;
      _running = false;
      if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
      try { smallTimerEl.classList.add('paused'); } catch (e) {}
    },
    reset() {
      _start = performance.now();
      try { smallTimerEl.textContent = '00:00.00'; } catch (e) {}
    },
    isRunning() { return !!_running; }
  };

  window.SmallTimer = API;
  window.__poly_smallTimerEl = smallTimerEl;
})();





// بخش افزودن پلی‌ریتم جدید
document.getElementById("addPolyrhythm").addEventListener("click", (e) => {
  e.preventDefault();

  const container = document.createElement("div");
  container.className = "polyBox";

 // بخش درج تیک محلی فقط ضرب اول در polyBox (قابل ترجمه)
container.innerHTML = `
  <label>Pattern:</label>
  <input type="text" class="polyPattern" value="3+2+2" />
  <label>Repeats:</label>
  <input type="number" class="polyRepeats" value="3" min="1" />
  <label>BPM:</label>
  <input type="number" class="polyBPM" value="120" min="10" max="600" />
  <label>Sound:</label>
  <select class="polySound">
    <option value="sine1">sine1</option>
    <option value="sine2">sine2</option>
    <option value="sine3">sine3</option>
  </select>
  <label><span data-i18n="Only First Tick">Only First Tick</span>: <input type="checkbox" class="polyOnlyFirst" /></label>
  <button class="removePoly">–</button>
`;

  const baseSelect = createPolyBaseNoteSelect();
  const bpmField = container.querySelector('.polyBPM');
  const soundField = container.querySelector('.polySound');

  if (soundField && soundField.parentNode) {
    let soundLabel = soundField.previousElementSibling;
    while (soundLabel && soundLabel.tagName !== 'LABEL') {
      soundLabel = soundLabel.previousElementSibling;
    }

const baseLabelEl = document.createElement('label');
baseLabelEl.setAttribute('data-i18n', 'baseNoteLabel');
const curLang = (document.getElementById('langSelect') && document.getElementById('langSelect').value) || 'en';
baseLabelEl.textContent = (translations && translations[curLang] && translations[curLang]['baseNoteLabel']) || 'Base Note:';


    if (soundLabel && soundLabel.parentNode) {
      soundLabel.parentNode.insertBefore(baseLabelEl, soundLabel);
      soundLabel.parentNode.insertBefore(baseSelect, soundLabel);
    } else if (bpmField && bpmField.parentNode) {
      bpmField.parentNode.insertBefore(baseLabelEl, bpmField.nextSibling);
      bpmField.parentNode.insertBefore(baseSelect, baseLabelEl.nextSibling);
    } else {
      container.appendChild(baseLabelEl);
      container.appendChild(baseSelect);
    }
  } else if (bpmField && bpmField.parentNode) {
    bpmField.parentNode.insertBefore(baseSelect, bpmField.nextSibling);
  } else {
    container.appendChild(baseSelect);
  }

  container.querySelector(".removePoly").addEventListener("click", () => container.remove());

  document.getElementById("polyrhythmList").appendChild(container);

  const langSel = document.getElementById("langSelect");
  if (langSel && langSel.value === "fa") {
    langSel.dispatchEvent(new Event("change"));
  }
});





// بخش کنترل اسلایدر و دکمه‌های افزایش/کاهش
document.getElementById("mainBPM").addEventListener("input", updateBpmDisplay);

document.getElementById("bpmIncrease").addEventListener("click", () => {
  const bpmSlider = document.getElementById("mainBPM");
  bpmSlider.value = Math.min(600, parseInt(bpmSlider.value, 10) + 1);
  updateBpmDisplay();
});

document.getElementById("bpmDecrease").addEventListener("click", () => {
  const bpmSlider = document.getElementById("mainBPM");
  bpmSlider.value = Math.max(10, parseInt(bpmSlider.value, 10) - 1);
  updateBpmDisplay();
});












