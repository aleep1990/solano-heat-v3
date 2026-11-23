// SOLANO HEAT — radio: 4 stations, switched with R, each a tiny
// WebAudio sequencer (bass + lead + hats) in its own key and tempo.
// No audio files anywhere.

import { STATIONS } from './config.js';
import { playNote, ensureAudio } from './audio.js';

export function createRadioState() {
  return { station: 0, on: true, step: 0, nextAt: 0, timer: null };
}

// Minor-pentatonic walk per station, 16 steps a bar.
const SCALES = [
  [0, 3, 5, 7, 10, 12, 15],
  [0, 2, 3, 7, 9, 12, 14],
  [0, 3, 5, 6, 7, 10, 12],
  [0, 2, 5, 7, 10, 12, 14],
];
const BASS_LINES = [
  [0, 0, 7, 0, 5, 0, 7, 10],
  [0, 0, 3, 0, 5, 3, 0, 7],
  [0, 5, 0, 7, 0, 3, 5, 7],
  [0, 0, 0, 10, 0, 0, 7, 5],
];

export function startRadio(S) {
  if (S.radio.timer) return;
  S.radio.timer = setInterval(() => radioTick(S), 90);
}

export function stopRadio(S) {
  if (S.radio.timer) { clearInterval(S.radio.timer); S.radio.timer = null; }
}

function radioTick(S) {
  if (!S.radio.on || S.mode !== 'play' || document.hidden) return;
  if (!ensureAudio()) return;
  const st = STATIONS[S.radio.station];
  const stepDur = 60 / st.bpm / 2; // eighth notes
  const now = performance.now() / 1000;
  if (S.radio.nextAt === 0) S.radio.nextAt = now;
  if (now < S.radio.nextAt) return;
  S.radio.nextAt = now + stepDur;
  const step = S.radio.step % 16;
  const bar = Math.floor(S.radio.step / 16);
  const scale = SCALES[S.radio.station];
  const bassLine = BASS_LINES[S.radio.station];
  if (step % 2 === 0) {
    const bassNote = st.root + bassLine[(step / 2) % 8] - 12;
    playNote(bassNote, stepDur * 1.8, 'triangle', 0.16);
  }
  if (step % 4 === 2) {
    const lead = st.root + 12 + scale[(bar * 3 + step) % scale.length];
    playNote(lead, stepDur * 1.4, 'square', 0.05);
  }
  if (step % 2 === 1) playNote(72 + 24, 0.03, 'sine', 0.03); // hat tick
  S.radio.step++;
}

export function cycleStation(S) {
  S.radio.station = (S.radio.station + 1) % STATIONS.length;
  S.radio.step = 0;
  S.events.push({ type: 'radio', line: STATIONS[S.radio.station].name + ' — ' + STATIONS[S.radio.station].genre });
}

export function currentStation(S) {
  return STATIONS[S.radio.station];
}
