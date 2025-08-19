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


























// === Rhythm Display Countdown Add-on (keeps previous display code intact) ===
(function () {
  let rddcTimers = [];
  let rddcRunning = false;
  let rddcStartMs = null;
  let rddcSeq = null;

  function rddcClearTimers() {
    rddcTimers.forEach(t => clearTimeout(t));
    rddcTimers = [];
  }

  function rddcSumPattern(arr) {
    if (!Array.isArray(arr)) return 0;
    return arr.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
  }

  function rddcGetRepeatSteps(raw) {
    const n = parseFloat(raw);
    if (!isFinite(n) || n <= 0) return 0;
    return Math.max(0, Math.round(n));
  }

  function rddcGetItemsFromInputs() {
    const items = [];

    // Main
    const mainPatternInput = document.getElementById('mainPattern');
    const mainRepeatsInput = document.getElementById('mainRepeats');
    const mainBpmInput = document.getElementById('mainBPM');
    const mainPatternArr = typeof parsePattern === 'function' ? parsePattern(mainPatternInput ? mainPatternInput.value : '') : [];
    const mainRepeatsRaw = mainRepeatsInput ? mainRepeatsInput.value : '0';
    const mainBpm = parseFloat(mainBpmInput ? mainBpmInput.value : '0') || 0;
    items.push({
      pattern: mainPatternArr,
      repeatsRaw: mainRepeatsRaw,
      bpm: mainBpm
    });

    // Polys
    const polyBoxes = document.querySelectorAll('.polyBox');
    polyBoxes.forEach(box => {
      const patt = (box.querySelector('.polyPattern') || {}).value || '';
      const arr = typeof parsePattern === 'function' ? parsePattern(patt) : [];
      const repeatsRaw = (box.querySelector('.polyRepeats') || {}).value || '0';
      const bpm = parseFloat((box.querySelector('.polyBPM') || {}).value || '0') || 0;
      items.push({
        pattern: arr,
        repeatsRaw,
        bpm
      });
    });

    return items;
  }

  function rddcBuildSequence() {
    const items = rddcGetItemsFromInputs();
    const durationsMs = [];
    const repeatSteps = [];
    const originalRepeatsText = [];

    for (const it of items) {
      const ticksPerRepeat = rddcSumPattern(it.pattern);
      const repeatsNum = parseFloat(it.repeatsRaw) || 0;
      const beatLen = it.bpm > 0 ? (60 / it.bpm) : 0;
      const totalTicks = ticksPerRepeat * (repeatsNum > 0 ? repeatsNum : 0);
      const ms = totalTicks * beatLen * 1000;
      durationsMs.push(Math.max(0, Math.round(ms)));
      repeatSteps.push(rddcGetRepeatSteps(it.repeatsRaw));
      originalRepeatsText.push(String(it.repeatsRaw || ''));
    }

    const loopCount = parseInt((document.getElementById('loopCount') || {}).value || '1', 10) || 1;
    const totalOneLoopMs = durationsMs.reduce((a, b) => a + b, 0);
    const totalAllMs = totalOneLoopMs * loopCount;

    return { items, durationsMs, repeatSteps, originalRepeatsText, loopCount, totalOneLoopMs, totalAllMs };
  }

  function rddcGetTableRows() {
    const table = document.getElementById('rhythmDisplayTable');
    if (!table) return [];
    const nodes = Array.from(table.children || []);
    if (nodes.length < 3) return []; // header only or empty
    const data = nodes.slice(3);
    const rows = [];
    for (let i = 0; i < data.length; i += 3) {
      rows.push({
        patternCell: data[i] || null,
        bpmCell: data[i + 1] || null,
        repeatsCell: data[i + 2] || null
      });
    }
    return rows;
  }

  function rddcSetRowRepeats(rowIndex, value) {
    const rows = rddcGetTableRows();
    if (rowIndex < 0 || rowIndex >= rows.length) return;
    const cell = rows[rowIndex].repeatsCell;
    if (!cell) return;
    cell.textContent = String(value);
  }

  function rddcResetAllRepeatsToOriginal() {
    const rows = rddcGetTableRows();
    if (!rows.length) return;
    const items = rddcGetItemsFromInputs();
    rows.forEach((_, i) => {
      const text = items[i] ? String(items[i].repeatsRaw || '') : '';
      rddcSetRowRepeats(i, text);
    });
  }

  function rddcScheduleCountdown() {
    rddcClearTimers();
    rddcSeq = rddcBuildSequence();

    const { durationsMs, repeatSteps, loopCount, totalOneLoopMs, totalAllMs } = rddcSeq;

    if (!durationsMs.length || totalOneLoopMs === 0 || loopCount <= 0) {
      rddcRunning = false;
      return;
    }

    rddcRunning = true;
    rddcStartMs = Date.now();

    // For each loop and each row, schedule: reset to full, then decrement step by step
    let loopOffset = 0;
    for (let loop = 0; loop < loopCount; loop++) {
      let rowStartInLoop = 0;
      for (let i = 0; i < durationsMs.length; i++) {
        const tStart = loopOffset + rowStartInLoop;
        const dur = durationsMs[i];
        const steps = repeatSteps[i];
        const stepMs = steps > 0 ? (dur / steps) : 0;

        // At row start: set repeats to full steps (or 0 if steps==0)
        rddcTimers.push(setTimeout(() => {
          rddcSetRowRepeats(i, steps > 0 ? steps : 0);
        }, tStart));

        // Decrement steps
        if (steps > 0 && stepMs > 0) {
          for (let s = 1; s <= steps; s++) {
            rddcTimers.push(setTimeout(() => {
              rddcSetRowRepeats(i, Math.max(0, steps - s));
            }, Math.round(tStart + s * stepMs)));
          }
        }

        rowStartInLoop += dur;
      }
      loopOffset += totalOneLoopMs;
    }

    // After all, mark not running and optionally reset
    rddcTimers.push(setTimeout(() => {
      rddcRunning = false;
      // Keep at 0 where finished; do not auto-reset here.
    }, rddcSeq.totalAllMs));
  }

  function rddcUpdateCountsByElapsed() {
    if (!rddcRunning || !rddcSeq) return;

    const rows = rddcGetTableRows();
    if (!rows.length) return;

    const now = Date.now();
    const elapsed = now - (rddcStartMs || now);
    const { durationsMs, repeatSteps, totalOneLoopMs, totalAllMs } = rddcSeq;

    if (elapsed < 0) return;
    if (elapsed >= totalAllMs) {
      // Finished: show zeros
      repeatSteps.forEach((_, i) => rddcSetRowRepeats(i, 0));
      return;
    }

    const posInCycle = totalOneLoopMs > 0 ? (elapsed % totalOneLoopMs) : 0;

    // Compute prefix sums to find row windows
    const starts = [];
    let acc = 0;
    for (let i = 0; i < durationsMs.length; i++) {
      starts.push(acc);
      acc += durationsMs[i];
    }

    for (let i = 0; i < durationsMs.length; i++) {
      const start = starts[i];
      const end = start + durationsMs[i];
      const steps = repeatSteps[i];

      if (posInCycle < start) {
        // Not started yet in this cycle: show full
        rddcSetRowRepeats(i, steps);
      } else if (posInCycle >= end) {
        // Already finished in this cycle
        rddcSetRowRepeats(i, 0);
      } else {
        // In progress
        if (steps <= 0 || durationsMs[i] === 0) {
          rddcSetRowRepeats(i, 0);
        } else {
          const stepMs = durationsMs[i] / steps;
          const progressed = posInCycle - start;
          const doneSteps = Math.floor(progressed / stepMs);
          const left = Math.max(0, steps - doneSteps);
          rddcSetRowRepeats(i, left);
        }
      }
    }
  }

  function init() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');

    if (startBtn && !startBtn.__rddcHooked) {
      startBtn.__rddcHooked = true;
      startBtn.addEventListener('click', () => {
        // Start our countdown schedule just after main logic flips isPlaying
        setTimeout(() => {
          if (typeof isPlaying !== 'undefined' && isPlaying) {
            rddcScheduleCountdown();
          }
        }, 0);
      });
    }

    if (stopBtn && !stopBtn.__rddcHooked) {
      stopBtn.__rddcHooked = true;
      stopBtn.addEventListener('click', () => {
        rddcClearTimers();
        rddcRunning = false;
        rddcStartMs = null;
        rddcSeq = null;
        // Reset repeats to original inputs on complete stop
        rddcResetAllRepeatsToOriginal();
      });
    }

    // When opening Display, bring counts to current elapsed position
    const displayBtn = document.getElementById('displayBtn');
    if (displayBtn && !displayBtn.__rddcHooked) {
      displayBtn.__rddcHooked = true;
      displayBtn.addEventListener('click', () => {
        // Run after the previous display render code
        setTimeout(() => {
          if (rddcRunning) {
            rddcUpdateCountsByElapsed();
          } else {
            // Not running: ensure visible numbers match inputs
            rddcResetAllRepeatsToOriginal();
          }
        }, 0);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
