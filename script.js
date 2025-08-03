// Audio context and sound setup
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playClick(isDownBeat) {
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc.type = 'square';
  osc.frequency.value = isDownBeat ? 1000 : 700;

  gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.1);
}

// 🔁 ✅ محاسبه دقیق با در نظر گرفتن ارزش زمانی نت (مخرج کسر)
function calculatePolyrhythmBPM(BPM1, top1, bottom1, measures1, top2, bottom2, measures2) {
  const duration1 = (60 / BPM1) * (4 / bottom1); // مدت یک ضرب اصلی
  const totalTime = top1 * measures1 * duration1; // کل زمان ریتم اصلی

  const duration2 = totalTime / (top2 * measures2); // مدت یک ضرب پلی‌ریتم
  const BPM2 = 60 / duration2 * (4 / bottom2); // محاسبه BPM متناسب با نت دوم

  return BPM2;
}

// UI Elements
const mainTopInput = document.getElementById('mainTop');
const mainBottomInput = document.getElementById('mainBottom');
const mainMeasuresInput = document.getElementById('mainMeasures');
const mainBPMInput = document.getElementById('mainBPM');

const polyTopInput = document.getElementById('polyTop');
const polyBottomInput = document.getElementById('polyBottom');
const polyMeasuresInput = document.getElementById('polyMeasures');
const polyBPMInput = document.getElementById('polyBPM');

const startStopBtn = document.getElementById('startStopBtn');
const resultBPMDiv = document.getElementById('resultBPM');

let isRunning = false;
let timerID = null;
let currentBeat = 0;
let currentMeasure = 0;
let inPolyrhythm = false;

function updatePolyBPM() {
  const BPM1 = parseFloat(mainBPMInput.value);
  const top1 = parseFloat(mainTopInput.value);
  const bottom1 = parseFloat(mainBottomInput.value);
  const measures1 = parseFloat(mainMeasuresInput.value);

  const top2 = parseFloat(polyTopInput.value);
  const bottom2 = parseFloat(polyBottomInput.value);
  const measures2 = parseFloat(polyMeasuresInput.value);

  if ([BPM1, top1, bottom1, measures1, top2, bottom2, measures2].some(isNaN)) return;

  const bpm2 = calculatePolyrhythmBPM(BPM1, top1, bottom1, measures1, top2, bottom2, measures2);
  polyBPMInput.value = bpm2.toFixed(2);
}

// Call initially
updatePolyBPM();

// Update poly BPM on input changes
[
  mainTopInput, mainBottomInput, mainMeasuresInput, mainBPMInput,
  polyTopInput, polyBottomInput, polyMeasuresInput
].forEach(inp => {
  inp.addEventListener('input', updatePolyBPM);
});

// Metronome scheduling
function startMetronome() {
  if (audioCtx.state === 'suspended') audioCtx.resume();

  isRunning = true;
  startStopBtn.textContent = 'Stop';

  currentBeat = 0;
  currentMeasure = 0;
  inPolyrhythm = false;

  scheduleNext();
}

function stopMetronome() {
  isRunning = false;
  startStopBtn.textContent = 'Start';
  clearTimeout(timerID);
}

function scheduleNext() {
  const BPM1 = parseFloat(mainBPMInput.value);
  const top1 = parseFloat(mainTopInput.value);
  const bottom1 = parseFloat(mainBottomInput.value);
  const measures1 = parseFloat(mainMeasuresInput.value);

  const BPM2 = parseFloat(polyBPMInput.value);
  const top2 = parseFloat(polyTopInput.value);
  const bottom2 = parseFloat(polyBottomInput.value);
  const measures2 = parseFloat(polyMeasuresInput.value);

  let interval;

  if (!inPolyrhythm) {
    const duration1 = (60 / BPM1) * (4 / bottom1); // مدت ضرب اصلی
    interval = duration1 * 1000;
    playClick(currentBeat === 0);

    currentBeat++;
    if (currentBeat >= top1) {
      currentBeat = 0;
      currentMeasure++;
      if (currentMeasure >= measures1) {
        inPolyrhythm = true;
        currentBeat = 0;
        currentMeasure = 0;
      }
    }
  } else {
    const duration2 = (60 / BPM2) * (4 / bottom2); // مدت ضرب پلی‌ریتم
    interval = duration2 * 1000;
    playClick(currentBeat === 0);

I.B, [03.08.2025 16:11]
currentBeat++;
    if (currentBeat >= top2) {
      currentBeat = 0;
      currentMeasure++;
      if (currentMeasure >= measures2) {
        inPolyrhythm = false;
        currentBeat = 0;
        currentMeasure = 0;
      }
    }
  }

  if (isRunning) timerID = setTimeout(scheduleNext, interval);
}

startStopBtn.addEventListener('click', () => {
  isRunning ? stopMetronome() : startMetronome();
});
