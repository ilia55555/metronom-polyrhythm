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
