let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let isPlaying = false;
let stopRequested = false;

// فرکانس‌های مختلف برای نوع صداها
const soundPresets = {
  sine1: [440, 880],
  sine2: [750, 1200],
  sine3: [1000, 1800],
};

function playClick(frequency, gain = 1) {
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  g.gain.value = gain;
  osc.connect(g).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}

function parsePattern(pattern) {
  return pattern.split("+").map(n => parseInt(n.trim())).filter(n => !isNaN(n));
}

function getBpmDelay(bpm) {
  return 60 / bpm;
}

// 🔧 تابع اصلاح‌شده: تغییر رنگ نوار اسلایدر با توجه به مقدار
function updateBpmDisplay() {
  const bpmSlider = document.getElementById("mainBPM");
  const bpm = parseInt(bpmSlider.value);
  const min = parseInt(bpmSlider.min);
  const max = parseInt(bpmSlider.max);
  const percent = ((bpm - min) / (max - min)) * 100;

  document.getElementById("bpmDisplay").textContent = `${bpm} BPM`;
  bpmSlider.style.background = `linear-gradient(to right, var(--x) 0%, var(--x) ${percent}%, #444 ${percent}%, #444 100%)`;
}



//اجرای الگوی ریتم خاص
async function playPattern(pattern, bpm, repeats, preset, volume = 1) {
  const [lowFreq, highFreq] = soundPresets[preset] || soundPresets.sine1;
  const delay = getBpmDelay(bpm);
  const onlyFirst = document.getElementById("onlyFirstTick").checked;

  for (let r = 0; r < repeats; r++) {
    for (let group of pattern) {
      if (stopRequested) return;

      for (let i = 0; i < group; i++) {
        if (onlyFirst && i > 0) {
          // فقط ضرب اول رو اجرا کن و بقیه رو skip کن
          await new Promise(res => setTimeout(res, delay * 1000));
          continue;
        }

        let freq = i === 0 ? lowFreq : highFreq;
        playClick(freq, volume);
        await new Promise(res => setTimeout(res, delay * 1000));
      }
    }
  }
}


// اضافه‌کردن پلی‌ریتم جدید
document.getElementById("addPolyrhythm").addEventListener("click", () => {
  const container = document.createElement("div");
  container.className = "polyBox";
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
    <button class="removePoly">–</button>
  `;
  container.querySelector(".removePoly").addEventListener("click", () => container.remove());
  document.getElementById("polyrhythmList").appendChild(container);

  // اگه زبان فارسی فعاله، متن‌ها ترجمه بشن
  if (document.getElementById("langSelect").value === "fa") {
    document.getElementById("langSelect").dispatchEvent(new Event("change"));
  }
});

// رویداد کشیدن توپک اسلایدر
document.getElementById("mainBPM").addEventListener("input", updateBpmDisplay);

// دکمه افزایش BPM
document.getElementById("bpmIncrease").addEventListener("click", () => {
  const bpmSlider = document.getElementById("mainBPM");
  bpmSlider.value = Math.min(600, parseInt(bpmSlider.value) + 1);
  updateBpmDisplay();
});

// دکمه کاهش BPM
document.getElementById("bpmDecrease").addEventListener("click", () => {
  const bpmSlider = document.getElementById("mainBPM");
  bpmSlider.value = Math.max(10, parseInt(bpmSlider.value) - 1);
  updateBpmDisplay();
});

// دکمه شروع پخش
document.getElementById("startBtn").addEventListener("click", async () => {
  if (isPlaying) return;
  isPlaying = true;
  stopRequested = false;

  const loopCount = parseInt(document.getElementById("loopCount").value) || 1;

  for (let loop = 0; loop < loopCount; loop++) {
    if (stopRequested) break;

    // اجرای ریتم اصلی
    const mainPattern = parsePattern(document.getElementById("mainPattern").value);
    const mainRepeats = parseInt(document.getElementById("mainRepeats").value);
    const mainBPM = parseInt(document.getElementById("mainBPM").value);
    await playPattern(mainPattern, mainBPM, mainRepeats, "sine1");

    // اجرای پلی‌ریتم‌ها
    const polyBoxes = document.querySelectorAll(".polyBox");
    for (let box of polyBoxes) {
      if (stopRequested) break;
      const pattern = parsePattern(box.querySelector(".polyPattern").value);
      const repeats = parseInt(box.querySelector(".polyRepeats").value);
      const bpm = parseInt(box.querySelector(".polyBPM").value);
      const preset = box.querySelector(".polySound").value;
      await playPattern(pattern, bpm, repeats, preset);
    }
  }

  isPlaying = false;
});

// دکمه توقف
document.getElementById("stopBtn").addEventListener("click", () => {
  stopRequested = true;
  isPlaying = false;
});

// 🔹 ترجمه‌های رابط کاربری
const translations = {
  en: {
    "Main Rhythm": "Main Rhythm",
    "Pattern (e.g. 2+3+2):": "Pattern (e.g. 2+3+2):",
    "Repeat Count (before polyrhythms):": "Repeat Count (before polyMeter):",
    "Main BPM:": "Main BPM:",
    "Polyrhythms": "PolyMeter",
    "+ Add Polyrhythm": "+ Add PolyMeter",
    "Loop Count (number of full cycles):": "Loop Count :",
    "Start": "Start",
    "Stop": "Stop",
    "Language:": "Language:",
    "Theme:": "Theme:",
    "Yellow": "Yellow",
    "Blue": "Blue",
    "Red": "Red",
    "Green": "Green",
    "Purple": "Purple",
    "Only First Tick": "Only First Tick",
    "loopCountLabel": "loopCountLabel",
    "Pattern:": "Pattern:",
    "Repeats:": "Repeats:",
    "BPM:": "BPM:",
    "Sound:": "Sound:",
    "Polyrhythm Time Calculator": "Polyrhythm Time Calculator",
    "First Rhythm:": "First Rhythm:",
    "Second Rhythm:": "Second Rhythm:",
    "BPM 1:": "BPM 1:",
    "Measures of Rhythm 1:": "Measures of Rhythm 1:",
    "Measures of Rhythm 2 (optional):": "Measures of Rhythm 2 (optional):",
    "BPM 2 (optional):": "BPM 2 (optional):",
    "Calculate": "Calculate",
    "Auto": "Auto Replace",
    "Result:": "Result:",
  },
  fa: {
    "Main Rhythm": "ریتم اصلی",
    "Pattern (e.g. 2+3+2):": "الگو (مثلاً ۲+۳+۲):",
    "Repeat Count (before polyrhythms):": "تعداد تکرار ریتم اصلی:",
    "Main BPM:": "سرعت (BPM):",
    "Polyrhythms": "پلی‌مترها",
    "+ Add Polyrhythm": "+ افزودن پلی‌متر",
    "Loop Count (number of full cycles):": "تعداد تکرار:",
    "Start": "شروع",
    "Stop": "توقف",
    "Language:": "زبان:",
    "Theme:": "تم:",
    "Yellow": "زرد",
    "Blue": "آبی",
    "Red": "قرمز",
    "Green": "سبز",
    "Purple": "بنفش",
    "Only First Tick": "فقط ضرب اول",
    "loopCountLabel": "تکرار کل ریتم",
    "Pattern:": "الگو:",
    "Repeats:": "تکرار:",
    "BPM:": "سرعت:",
    "Sound:": "صدا:",
    "Polyrhythm Time Calculator": "ماشین‌حساب زمان پلی‌ریتم",
    "First Rhythm:": "ریتم اول:",
    "Second Rhythm:": "ریتم دوم:",
    "BPM 1:": "سرعت ۱ (BPM):",
    "Measures of Rhythm 1:": "تعداد میزان‌های ریتم اول:",
    "Measures of Rhythm 2 (optional):": "تعداد میزان‌های ریتم دوم (اختیاری):",
    "BPM 2 (optional):": "سرعت ۲ (BPM) (اختیاری):",
    "Calculate": "محاسبه",
    "Auto": "جایگزاری خودکار",
    "Result:": "پاسخ:",
  }
};

// 🔹 تابع برای اعمال ترجمه بر اساس زبان انتخاب‌شده
function applyTranslation(lang) {
  const dict = translations[lang];

  // ترجمه‌ی متن‌های ثابت داخل تگ‌ها (همان کد شما)
  for (const [enText, transText] of Object.entries(dict)) {
    const elements = Array.from(document.querySelectorAll("*")).filter(
      el => el.childNodes.length === 1 && (
        el.textContent.trim() === translations.en[enText] ||
        el.textContent.trim() === translations.fa[enText] ||
        el.textContent.trim() === enText
      )
    );
    for (let el of elements) {
      el.textContent = transText;
    }
  }

  // ترجمه گزینه‌های select (مثل تم و زبان)
  const selectOptions = document.querySelectorAll("select option");
  selectOptions.forEach(option => {
    const original = option.value.trim();
    if (dict[original]) {
      option.textContent = dict[original];
    }
  });

  // ترجمه بر اساس id اگر لازم بود
  for (const key in dict) {
    const el = document.getElementById(key);
    if (el) {
      el.textContent = dict[key];
    }
  }

  // *** ترجمه placeholder های input ها ***
  const placeholders = [
    {id: "num1", key: "Beats (e.g., 5)"},
    {id: "den1", key: "Unit (e.g., 4)"},
    {id: "num2", key: "Beats (e.g., 3)"},
    {id: "den2", key: "Unit (e.g., 8)"},
    {id: "bpm1", key: "e.g., 80"},
    {id: "measures1", key: "e.g., 10"},
    {id: "measures2", key: "leave blank to calculate"},
    {id: "bpm2", key: "leave blank to calculate"},
  ];

  placeholders.forEach(({id, key}) => {
    const el = document.getElementById(id);
    if (el && dict[key]) {
      el.placeholder = dict[key];
    }
  });

  // تغییر جهت متن صفحه
  document.body.dir = lang === "fa" ? "rtl" : "ltr";
}


// 🔹 رویداد تغییر زبان
document.getElementById("langSelect").addEventListener("change", () => {
  const selectedLang = document.getElementById("langSelect").value;
  applyTranslation(selectedLang);
});

// 🔹 اعمال ترجمه پیش‌فرض بر اساس مقدار اولیه
window.addEventListener("DOMContentLoaded", () => {
  const defaultLang = document.getElementById("langSelect").value;
  applyTranslation(defaultLang);
});                   


// راهنمای علامت سؤال
const helpIcon = document.getElementById("helpIcon");
const tooltip = document.getElementById("helpTooltip");

helpIcon.addEventListener("mouseenter", () => {
  tooltip.style.display = "block";
});
helpIcon.addEventListener("mouseleave", () => {
  tooltip.style.display = "none";
});
// اجرای اولیه
updateBpmDisplay();



document.body.className = "blue-theme";



const themeSelect = document.getElementById("themeSelect");

themeSelect.addEventListener("change", () => {
  const theme = themeSelect.value;

  // پاک‌کردن کلاس‌های قبلی
  document.body.classList.remove("theme-dark-yellow", "theme-dark-blue", "theme-light-green");

  // اضافه‌کردن کلاس جدید
  document.body.classList.add(`theme-${theme}`);
});





const themes = {
  yellow: '#ffcc00',
  blue: '#00f4fc',
  red: '#de1b1b',
  green: '#00cc44',
  purple: '#e502fa'
};

function applyTheme(color) {
  document.documentElement.style.setProperty('--x', color);

  const borderColor = shadeColor(color, -30); 
  document.documentElement.style.setProperty('--x-border', borderColor);

  const hoverColor = shadeColor(color, -15);
  document.documentElement.style.setProperty('--x-hover', hoverColor);

  document.querySelectorAll('.container').forEach(box => {
    box.style.boxShadow = `0 0 30px ${color}80`;
  });

  const helpIcon = document.getElementById('helpIcon');
  if (helpIcon) helpIcon.style.color = color;
}

// مقدار اولیه تم زرد
applyTheme(themes.yellow);

document.getElementById('themeSelect').addEventListener('change', e => {
  const selected = e.target.value;
  if (themes[selected]) {
    applyTheme(themes[selected]);
  }
});






function shadeColor(color, percent) {
  const num = parseInt(color.replace("#", ""), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt,
        G = (num >> 8 & 0x00FF) + amt,
        B = (num & 0x0000FF) + amt;

  return "#" + (
    0x1000000 +
    (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 0 ? 0 : B) : 255)
  ).toString(16).slice(1);
}




//ماشین حساب
function calculate() {
  const num1 = parseFloat(document.getElementById("num1").value);
  const den1 = parseFloat(document.getElementById("den1").value);
  const num2 = parseFloat(document.getElementById("num2").value);
  const den2 = parseFloat(document.getElementById("den2").value);
  const bpm1 = parseFloat(document.getElementById("bpm1").value);
  const m1 = parseFloat(document.getElementById("measures1").value);
  const m2 = parseFloat(document.getElementById("measures2").value);
  const bpm2_input = parseFloat(document.getElementById("bpm2").value);

  if (isNaN(num1) || isNaN(den1) || isNaN(num2) || isNaN(den2) || isNaN(bpm1) || isNaN(m1)) {
    document.getElementById("calcResult").innerText = "Please fill in all required fields";
    return null;
  }

  const beats1 = num1 * m1;
  const time1 = (beats1 * 60) / bpm1; // ثانیه

  let bpm2, measures2;
  let resultText = "";

  if (!isNaN(m2)) {
    const beats2 = num2 * m2;
    bpm2 = (beats2 * 60) / time1;
    measures2 = m2;
    resultText = `BPM2: ${bpm2.toFixed(2)}`;
  } else if (!isNaN(bpm2_input)) {
    bpm2 = bpm2_input;
    const beatLength2 = 60 / bpm2_input;
    const totalBeats2 = time1 / beatLength2;
    measures2 = totalBeats2 / num2;
    resultText = `Measures 2: ${measures2.toFixed(2)}`;
  } else {
    resultText = "Please enter either the second rate or the second speed";
    document.getElementById("calcResult").innerText = resultText;
    return null;
  }

  // نمایش نتیجه
  document.getElementById("calcResult").innerText = resultText;

  // بازگشت داده‌ها برای استفاده در دکمه اتو
  return { bpm1, m1, num1, bpm2, measures2, num2 };
}

// رویداد دکمه Calculate
document.getElementById("calcRunBtn").addEventListener("click", () => {
  calculate();
});

// رویداد دکمه Auto
document.getElementById("calcAutoBtn").addEventListener("click", () => {
  const calcValues = calculate();
  if (!calcValues) return;

  const { bpm1, m1, num1, bpm2, measures2, num2 } = calcValues;

  const mainBpmSlider = document.getElementById("mainBPM");
  if (mainBpmSlider) {
    mainBpmSlider.value = bpm1;
    mainBpmSlider.dispatchEvent(new Event('input'));
  }

  if (document.getElementById("mainRepeats")) {
    document.getElementById("mainRepeats").value = m1;
  }

  if (document.getElementById("mainPattern")) {
    document.getElementById("mainPattern").value = num1.toString();
  }

  const firstPoly = document.querySelector(".polyBox");
  if (firstPoly) {
    const polyBpm = firstPoly.querySelector(".polyBPM");
    const polyRepeats = firstPoly.querySelector(".polyRepeats");
    const polyPattern = firstPoly.querySelector(".polyPattern");

    if (polyBpm) polyBpm.value = bpm2;
    if (polyRepeats) polyRepeats.value = measures2.toFixed(2);
    if (polyPattern) polyPattern.value = num2.toString();
  }
});


























// === Minimal Rhythm Display (Popup) ===
(function () {
  // Remove any previous display UI from older snippet if present
  const oldOverlay = document.getElementById('settingsDisplayOverlay');
  if (oldOverlay) oldOverlay.remove();
  const oldStyles = document.getElementById('settingsDisplayStyles');
  if (oldStyles) oldStyles.remove();
  const oldBtn = document.getElementById('displayBtn');
  if (oldBtn) oldBtn.remove();

  function injectStyles() {
    if (document.getElementById('rhythmDisplayStyles')) return;
    const style = document.createElement('style');
    style.id = 'rhythmDisplayStyles';
    style.textContent = `
      #rhythmDisplayOverlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.45);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }
      #rhythmDisplayModal {
        background: #141414;
        color: #fff;
        max-width: 680px;
        width: 92vw;
        max-height: 85vh;
        overflow: auto;
        border: 1px solid var(--x);
        box-shadow: 0 0 30px var(--x);
        border-radius: 12px;
        padding: 16px;
      }
      #rhythmDisplayTable {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 10px 40px;
        justify-items: center;
        align-items: center;
        text-align: center;
        margin: 0 auto;
      }
      .rd-header {
        font-weight: 700;
        color: var(--x);
      }
      .rd-cell {
        white-space: pre;
      }
      #displayBtn {
        border: 1px solid var(--x);
        color: var(--x);
        background: transparent;
        border-radius: 8px;
        padding: 6px 12px;
        cursor: pointer;
        margin-left: 8px;
      }
      #displayBtn:hover { background: var(--x); color: #000; }
    `;
    document.head.appendChild(style);
  }

  function createUI() {
    if (!document.getElementById('rhythmDisplayOverlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'rhythmDisplayOverlay';
      const modal = document.createElement('div');
      modal.id = 'rhythmDisplayModal';
      const table = document.createElement('div');
      table.id = 'rhythmDisplayTable';
      modal.appendChild(table);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.style.display = 'none';
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') overlay.style.display = 'none';
      });
    }

    let button = document.getElementById('displayBtn');
    if (!button) {
      button = document.createElement('button');
      button.id = 'displayBtn';
      button.type = 'button';
      button.textContent = 'Display';
    } else {
      button.remove();
    }

    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');

    if (stopBtn && stopBtn.parentNode) {
      stopBtn.parentNode.insertBefore(button, stopBtn.nextSibling);
    } else if (startBtn && startBtn.parentNode) {
      startBtn.parentNode.insertBefore(button, startBtn.nextSibling);
    } else {
      document.body.appendChild(button);
    }

    button.addEventListener('click', () => {
      renderRhythmDisplay();
      document.getElementById('rhythmDisplayOverlay').style.display = 'flex';
    });
  }

  function getRows() {
    const rows = [];

    const mainPatternInput = document.getElementById('mainPattern');
    const mainRepeatsInput = document.getElementById('mainRepeats');
    const mainBpmInput = document.getElementById('mainBPM');

    const mainPatternStr = mainPatternInput ? String(mainPatternInput.value || '') : '';
    const mainPatternArr = typeof parsePattern === 'function' ? parsePattern(mainPatternStr) : [];
    const mainPatternDisplay = mainPatternArr.length ? mainPatternArr.join('+') : mainPatternStr.replace(/\s+/g, '');
    const mainBpm = mainBpmInput ? String(mainBpmInput.value || '') : '';
    const mainRepeats = mainRepeatsInput ? String(mainRepeatsInput.value || '') : '';
    if (mainPatternDisplay || mainBpm || mainRepeats) {
      rows.push([mainPatternDisplay, mainBpm, mainRepeats]);
    }

    const polyBoxes = document.querySelectorAll('.polyBox');
    polyBoxes.forEach(box => {
      const p = box.querySelector('.polyPattern');
      const r = box.querySelector('.polyRepeats');
      const b = box.querySelector('.polyBPM');

      const pStr = p ? String(p.value || '') : '';
      const arr = typeof parsePattern === 'function' ? parsePattern(pStr) : [];
      const pat = arr.length ? arr.join('+') : pStr.replace(/\s+/g, '');
      const bpm = b ? String(b.value || '') : '';
      const rep = r ? String(r.value || '') : '';
      rows.push([pat, bpm, rep]);
    });

    return rows;
  }

  function renderRhythmDisplay() {
    const table = document.getElementById('rhythmDisplayTable');
    if (!table) return;
    table.innerHTML = '';

    // Header (only these three words)
    ['پترن', 'سرعت', 'میزان'].forEach(text => {
      const cell = document.createElement('div');
      cell.className = 'rd-cell rd-header';
      cell.textContent = text;
      table.appendChild(cell);
    });

    // Rows
    const rows = getRows();
    rows.forEach(([pat, bpm, rep]) => {
      const c1 = document.createElement('div');
      c1.className = 'rd-cell';
      c1.textContent = pat || '';
      const c2 = document.createElement('div');
      c2.className = 'rd-cell';
      c2.textContent = bpm || '';
      const c3 = document.createElement('div');
      c3.className = 'rd-cell';
      c3.textContent = rep || '';
      table.appendChild(c1);
      table.appendChild(c2);
      table.appendChild(c3);
    });
  }

  function init() {
    injectStyles();
    createUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
