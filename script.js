const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playClick(isDownBeat) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = 'square';
  osc.frequency.value = isDownBeat ? 1000 : 700;
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.1);
}

function calculatePolyrhythmBPM(BPM1, top1, bottom1, measures1, top2, bottom2, measures2) {
  const beatDur1 = (60 / BPM1) * (4 / bottom1);
  const totalTime = top1 * measures1 * beatDur1;
  const totalBeats2 = top2 * measures2;
  const beatDur2 = totalTime / totalBeats2;
  return 60 / beatDur2 * (4 / bottom2);
}

const $ = id => document.getElementById(id);
let isRunning = false, timerID, currentBeat = 0, currentMeasure = 0, inPoly = false;

function updateBPM() {
  const b1 = parseFloat($("mainBottom").value);
  const t1 = parseFloat($("mainTop").value);
  const m1 = parseFloat($("mainMeasures").value);
  const bpm1 = parseFloat($("mainBPM").value);
  const b2 = parseFloat($("polyBottom").value);
  const t2 = parseFloat($("polyTop").value);
  const m2 = parseFloat($("polyMeasures").value);

  if ([b1, t1, m1, bpm1, b2, t2, m2].some(isNaN)) return;
  $("polyBPM").value = calculatePolyrhythmBPM(bpm1, t1, b1, m1, t2, b2, m2).toFixed(2);
}

["mainTop", "mainBottom", "mainMeasures", "mainBPM", "polyTop", "polyBottom", "polyMeasures"]
  .forEach(id => $(id).addEventListener("input", updateBPM));

updateBPM();

function start() {
  if (audioCtx.state === "suspended") audioCtx.resume();
  isRunning = true;
  $("startStopBtn").textContent = "Stop";
  currentBeat = currentMeasure = 0;
  inPoly = false;
  schedule();
}

function stop() {
  isRunning = false;
  $("startStopBtn").textContent = "Start";
  clearTimeout(timerID);
}

function schedule() {
  const bpm1 = parseFloat($("mainBPM").value);
  const b1 = parseFloat($("mainBottom").value);
  const t1 = parseFloat($("mainTop").value);
  const m1 = parseFloat($("mainMeasures").value);

  const bpm2 = parseFloat($("polyBPM").value);
  const b2 = parseFloat($("polyBottom").value);
  const t2 = parseFloat($("polyTop").value);
  const m2 = parseFloat($("polyMeasures").value);

  let dur;
  if (!inPoly) {
    dur = (60 / bpm1) * (4 / b1);
    playClick(currentBeat === 0);
    currentBeat++;
    if (currentBeat >= t1) {
      currentBeat = 0;
      currentMeasure++;
      if (currentMeasure >= m1) {
        inPoly = true;
        currentMeasure = 0;
      }
    }
  } else {
    dur = (60 / bpm2) * (4 / b2);
    playClick(currentBeat === 0);
    currentBeat++;
    if (currentBeat >= t2) {
      currentBeat = 0;
      currentMeasure++;
      if (currentMeasure >= m2) {
        inPoly = false;
        currentMeasure = 0;
      }
    }
  }

  if (isRunning) timerID = setTimeout(schedule, dur * 1000);
}

$("startStopBtn").addEventListener("click", () => {
  isRunning ? stop() : start();
});
