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


























// === Settings Display (Popup) ===
(function () {
  // ---- Add missing translations (EN/FA) for new UI texts ----
  if (typeof translations === "object" && translations.en && translations.fa) {
    Object.assign(translations.en, {
      "Display": "Display",
      "Settings Summary": "Settings Summary",
      "Close": "Close",
      "Loop Count:": "Loop Count:",
      "Polyrhythm": "Polyrhythm",
      "No polyrhythms added.": "No polyrhythms added.",
      "Yes": "Yes",
      "No": "No"
    });
    Object.assign(translations.fa, {
      "Display": "نمایش",
      "Settings Summary": "خلاصه تنظیمات",
      "Close": "بستن",
      "Loop Count:": "تعداد تکرار:",
      "Polyrhythm": "پلی‌متر",
      "No polyrhythms added.": "هیچ پلی‌متری اضافه نشده است.",
      "Yes": "بله",
      "No": "خیر"
    });
  }

  // ---- Styles ----
  function injectStyles() {
    if (document.getElementById("settingsDisplayStyles")) return;
    const style = document.createElement("style");
    style.id = "settingsDisplayStyles";
    style.textContent = `
      #settingsDisplayOverlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.45);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }
      #settingsDisplayModal {
        background: #141414;
        color: #fff;
        max-width: 720px;
        width: 92vw;
        max-height: 85vh;
        overflow: auto;
        border: 1px solid var(--x);
        box-shadow: 0 0 30px var(--x);
        border-radius: 12px;
        padding: 14px 18px;
      }
      #settingsDisplayHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      #settingsDisplayTitle {
        font-size: 18px;
        font-weight: 700;
        color: var(--x);
        margin: 0;
      }
      #settingsDisplayClose {
        background: transparent;
        border: 1px solid var(--x);
        color: var(--x);
        padding: 6px 10px;
        border-radius: 8px;
        cursor: pointer;
      }
      #settingsDisplayClose:hover { background: var(--x); color: #000; }
      .sd-section {
        border-top: 1px solid #2a2a2a;
        padding-top: 10px;
        margin-top: 10px;
      }
      .sd-section:first-of-type {
        border-top: none;
        padding-top: 0;
        margin-top: 0;
      }
      .sd-section-title {
        font-weight: 700;
        color: var(--x);
        margin: 6px 0 8px 0;
      }
      .sd-item {
        margin: 6px 0;
        line-height: 1.5;
      }
      .sd-item strong {
        color: var(--x);
        font-weight: 700;
      }
      .sd-subtitle {
        margin: 10px 0 4px 0;
        font-weight: 700;
        color: var(--x);
      }
      #displayBtn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: transparent;
        border: 1px solid var(--x);
        color: var(--x);
        padding: 8px 14px;
        border-radius: 10px;
        cursor: pointer;
        z-index: 9998;
      }
      #displayBtn:hover { background: var(--x); color: #000; }
    `;
    document.head.appendChild(style);
  }

  // ---- UI: Overlay + Modal + Button ----
  function createUI() {
    if (document.getElementById("settingsDisplayOverlay")) return;

    // Overlay
    const overlay = document.createElement("div");
    overlay.id = "settingsDisplayOverlay";

    // Modal
    const modal = document.createElement("div");
    modal.id = "settingsDisplayModal";

    // Header
    const header = document.createElement("div");
    header.id = "settingsDisplayHeader";

    const title = document.createElement("h2");
    title.id = "settingsDisplayTitle";
    title.textContent = "Settings Summary";

    const closeBtn = document.createElement("button");
    closeBtn.id = "settingsDisplayClose";
    closeBtn.type = "button";
    closeBtn.textContent = "Close";

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Content
    const content = document.createElement("div");
    content.id = "settingsDisplayContent";

    modal.appendChild(header);
    modal.appendChild(content);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Button
    if (!document.getElementById("displayBtn")) {
      const btn = document.createElement("button");
      btn.id = "displayBtn";
      btn.type = "button";
      btn.textContent = "Display";
      document.body.appendChild(btn);

      btn.addEventListener("click", () => {
        renderSettingsSummary();
        overlay.style.display = "flex";
      });
    }

    // Close events
    closeBtn.addEventListener("click", () => overlay.style.display = "none");
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.style.display = "none";
    });
  }

  // ---- Helpers to build rows ----
  function makeItem(labelText, valueText) {
    const row = document.createElement("div");
    row.className = "sd-item";
    const label = document.createElement("strong");
    label.textContent = labelText;
    const value = document.createElement("span");
    value.textContent = " " + (valueText != null && valueText !== "" ? valueText : "—");
    row.appendChild(label);
    row.appendChild(value);
    return row;
  }

  function makeSectionTitle(text) {
    const el = document.createElement("div");
    el.className = "sd-section-title";
    el.textContent = text;
    return el;
  }

  // ---- Read current settings and render into modal ----
  function renderSettingsSummary() {
    const content = document.getElementById("settingsDisplayContent");
    if (!content) return;
    content.innerHTML = "";

    // Get main controls
    const mainPatternInput = document.getElementById("mainPattern");
    const mainRepeatsInput = document.getElementById("mainRepeats");
    const mainBpmInput = document.getElementById("mainBPM");
    const loopCountInput = document.getElementById("loopCount");
    const onlyFirstTickInput = document.getElementById("onlyFirstTick");

    const mainPatternStr = mainPatternInput ? String(mainPatternInput.value || "") : "";
    const normalizedPattern = (parsePattern ? parsePattern(mainPatternStr).join(" + ") : mainPatternStr);

    const mainSection = document.createElement("div");
    mainSection.className = "sd-section";
    mainSection.appendChild(makeSectionTitle("Main Rhythm"));
    mainSection.appendChild(makeItem("Pattern:", normalizedPattern || "—"));
    mainSection.appendChild(makeItem("BPM:", mainBpmInput ? String(mainBpmInput.value || "—") : "—"));
    mainSection.appendChild(makeItem("Repeats:", mainRepeatsInput ? String(mainRepeatsInput.value || "—") : "—"));
    mainSection.appendChild(makeItem("Loop Count:", loopCountInput ? String(loopCountInput.value || "—") : "—"));

    if (onlyFirstTickInput) {
      // Put raw "Yes"/"No" so applyTranslation can replace
      const yesNo = onlyFirstTickInput.checked ? "Yes" : "No";
      const row = makeItem("Only First Tick", yesNo);
      mainSection.appendChild(row);
    }

    content.appendChild(mainSection);

    // Polyrhythms
    const polySection = document.createElement("div");
    polySection.className = "sd-section";
    polySection.appendChild(makeSectionTitle("Polyrhythms"));

    const polyBoxes = document.querySelectorAll(".polyBox");
    if (!polyBoxes || polyBoxes.length === 0) {
      const none = document.createElement("div");
      none.className = "sd-item";
      none.textContent = "No polyrhythms added.";
      polySection.appendChild(none);
    } else {
      let idx = 0;
      polyBoxes.forEach((box) => {
        idx += 1;
        const subtitle = document.createElement("div");
        subtitle.className = "sd-subtitle";

        const labelSpan = document.createElement("span");
        labelSpan.textContent = "Polyrhythm";

        const numSpan = document.createElement("span");
        numSpan.textContent = " #" + idx;

        subtitle.appendChild(labelSpan);
        subtitle.appendChild(numSpan);
        polySection.appendChild(subtitle);

        const patternInput = box.querySelector(".polyPattern");
        const repeatsInput = box.querySelector(".polyRepeats");
        const bpmInput = box.querySelector(".polyBPM");
        const soundSelect = box.querySelector(".polySound");

        const patStr = patternInput ? String(patternInput.value || "") : "";
        const patNormalized = (parsePattern ? parsePattern(patStr).join(" + ") : patStr);

        polySection.appendChild(makeItem("Pattern:", patNormalized || "—"));
        polySection.appendChild(makeItem("BPM:", bpmInput ? String(bpmInput.value || "—") : "—"));
        polySection.appendChild(makeItem("Repeats:", repeatsInput ? String(repeatsInput.value || "—") : "—"));
        polySection.appendChild(makeItem("Sound:", soundSelect ? String(soundSelect.value || "—") : "—"));
      });
    }

    content.appendChild(polySection);

    // Translate dynamic content to current language (if available)
    try {
      const langSelect = document.getElementById("langSelect");
      if (langSelect && typeof applyTranslation === "function") {
        applyTranslation(langSelect.value);
      }
    } catch (_) {}
  }

  // ---- Init ----
  function initSettingsDisplay() {
    injectStyles();
    createUI();
    // Ensure initial translation applies to newly created elements
    try {
      const langSelect = document.getElementById("langSelect");
      if (langSelect && typeof applyTranslation === "function") {
        applyTranslation(langSelect.value);
      }
    } catch (_) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSettingsDisplay);
  } else {
    initSettingsDisplay();
  }
})();
