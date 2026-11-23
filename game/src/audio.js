// SOLANO HEAT — all sound is synthesized with WebAudio. No audio files.
// Engine hum, two-tone siren, rotor chop, per-weapon gunshots, chimes,
// and the radio sequencer (driven by radio.js through playNote).

let ctx = null;
let master = null;
let engineOsc = null;
let engineGain = null;
let sirenTimer = null;
let rotorTimer = null;
let muted = false;

export function ensureAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
    engineOsc = ctx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 55;
    engineGain = ctx.createGain();
    engineGain.gain.value = 0;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 420;
    engineOsc.connect(lp); lp.connect(engineGain); engineGain.connect(master);
    engineOsc.start();
  } catch (e) { ctx = null; return false; }
  return true;
}

export function setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.5; }

export function setEngine(rpm, on) {
  if (!ctx || !engineOsc) return;
  const t = ctx.currentTime;
  engineOsc.frequency.setTargetAtTime(48 + rpm * 130, t, 0.08);
  engineGain.gain.setTargetAtTime(on ? 0.05 + rpm * 0.05 : 0, t, 0.1);
}

function noiseBurst(dur, freq, gainVal, type = 'bandpass') {
  if (!ctx) return;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.value = gainVal;
  src.connect(f); f.connect(g); g.connect(master);
  src.start();
}

export function playShot(kind) {
  if (!ctx) return;
  if (kind === 'SHOTGUN') { noiseBurst(0.28, 700, 0.5, 'lowpass'); noiseBurst(0.12, 2400, 0.35); }
  else if (kind === 'RIFLE') { noiseBurst(0.16, 1600, 0.42); }
  else if (kind === 'SMG') { noiseBurst(0.08, 1900, 0.3); }
  else if (kind === 'PISTOL') { noiseBurst(0.12, 1300, 0.38); }
  else { noiseBurst(0.06, 900, 0.2); }
}

export function playTone(freq, dur, type = 'sine', vol = 0.2, when = 0) {
  if (!ctx) return;
  const t0 = ctx.currentTime + when;
  const o = ctx.createOscillator();
  o.type = type; o.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g); g.connect(master);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

// Radio sequencer note: a short synth voice, bass or lead.
export function playNote(midi, dur, type, vol) {
  if (!ctx) return;
  const freq = 440 * Math.pow(2, (midi - 69) / 12);
  playTone(freq, dur, type, vol);
}

export function playChime() {
  playTone(880, 0.12, 'sine', 0.22);
  playTone(1318, 0.22, 'sine', 0.18, 0.1);
}

export function playCash() {
  playTone(988, 0.09, 'triangle', 0.2);
  playTone(1319, 0.09, 'triangle', 0.2, 0.08);
  playTone(1760, 0.18, 'triangle', 0.2, 0.16);
}

export function playCrash() { noiseBurst(0.35, 300, 0.5, 'lowpass'); }

export function playExplosion() {
  noiseBurst(0.9, 180, 0.8, 'lowpass');
  playTone(55, 0.7, 'sine', 0.5);
}

export function startSiren() {
  if (!ctx || sirenTimer) return;
  let hi = false;
  sirenTimer = setInterval(() => {
    if (!ctx) return;
    hi = !hi;
    playTone(hi ? 960 : 720, 0.32, 'triangle', 0.05);
  }, 340);
}

export function stopSiren() {
  if (sirenTimer) { clearInterval(sirenTimer); sirenTimer = null; }
}

export function startRotor() {
  if (!ctx || rotorTimer) return;
  rotorTimer = setInterval(() => noiseBurst(0.09, 220, 0.12, 'lowpass'), 130);
}

export function stopRotor() {
  if (rotorTimer) { clearInterval(rotorTimer); rotorTimer = null; }
}
