// Opening sound and small UI sounds, synthesised with Web Audio (no audio files).
// The opening is an original "ta-DUM" style sting: a quick low drum hit, a heavier
// second hit an octave up, then a wide chord that blooms and rings out in a big room.
// It is in A, not a copy of any existing sound logo.
// Browsers only allow audio after a click or key press, so the intro waits for one.

const KEY = 'pd-sound';
let ctx = null;

export const soundOn = () => {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
};
export function setSound(on) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* private mode */ }
  if (!on && ctx) ctx.suspend();
}

function audio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** True when this browser will let the page play sound before any click. */
export function canAutoplay() {
  try {
    if (navigator.getAutoplayPolicy) return navigator.getAutoplayPolicy('audiocontext') === 'allowed';
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    if (!ctx) ctx = new AC();
    return ctx.state === 'running';
  } catch {
    return false;
  }
}

const cache = new WeakMap(); // audio context -> { room, noise08, noise06 }
function buffers(ac) {
  let b = cache.get(ac);
  if (!b) {
    b = { room: room(ac), click: noiseBuffer(ac, 0.08), whoosh: noiseBuffer(ac, 0.6) };
    cache.set(ac, b);
  }
  return b;
}

/**
 * Creates the audio context (silent until a tap) and builds the heavy buffers ahead of time,
 * so the opening's first frames are not held up when the visitor taps.
 */
export function prepareSound() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC || !soundOn()) return;
    if (!ctx) ctx = new AC();
    const go = () => buffers(ctx);
    (window.requestIdleCallback || ((f) => setTimeout(f, 30)))(go);
  } catch { /* sound is optional */ }
}

/** A stereo impulse response for a large, dark room, generated from decaying noise. */
function room(ac, seconds = 2.8) {
  const len = Math.floor(ac.sampleRate * seconds);
  const ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const k = i / len;
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - k, 3.2) * (k < 0.004 ? k / 0.004 : 1);
    }
  }
  return ir;
}

function noiseBuffer(ac, seconds) {
  const len = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/** One deep drum hit: pitched body that drops, an inharmonic overtone, a felt-mallet click and a sub thump. */
function hit(ac, out, t, freq, vel, length) {
  const env = (node, peak, attack, decay) => {
    node.gain.setValueAtTime(0.0001, t);
    node.gain.exponentialRampToValueAtTime(peak, t + attack);
    node.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  };
  const body = ac.createOscillator();
  const bodyG = ac.createGain();
  body.type = 'sine';
  body.frequency.setValueAtTime(freq * 1.6, t);
  body.frequency.exponentialRampToValueAtTime(freq, t + 0.06);
  env(bodyG, vel, 0.004, length);
  body.connect(bodyG).connect(out);

  const over = ac.createOscillator();
  const overG = ac.createGain();
  over.type = 'sine';
  over.frequency.setValueAtTime(freq * 2.9, t);
  over.frequency.exponentialRampToValueAtTime(freq * 2.7, t + 0.1);
  env(overG, vel * 0.32, 0.003, length * 0.35);
  over.connect(overG).connect(out);

  const sub = ac.createOscillator();
  const subG = ac.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(70, t);
  sub.frequency.exponentialRampToValueAtTime(38, t + 0.3);
  env(subG, vel * 0.9, 0.003, 0.5);
  sub.connect(subG).connect(out);

  const click = ac.createBufferSource();
  click.buffer = buffers(ac).click;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2200;
  const clickG = ac.createGain();
  env(clickG, vel * 0.5, 0.001, 0.07);
  click.connect(lp).connect(clickG).connect(out);

  [body, over, sub].forEach((o) => { o.start(t); o.stop(t + length + 0.1); });
  click.start(t);
}

/**
 * Builds the sting on any audio context (a live one, or an OfflineAudioContext for testing)
 * and returns its length in seconds.
 */
export function buildTudum(ac, t0) {
  // master chain: glue compressor, then a limiter-style compressor so it is loud but never clips
  const master = ac.createGain();
  master.gain.value = 1.0;
  const glue = ac.createDynamicsCompressor();
  glue.threshold.value = -18; glue.knee.value = 8; glue.ratio.value = 3.5; glue.attack.value = 0.004; glue.release.value = 0.3;
  const makeup = ac.createGain();
  makeup.gain.value = 1.7;
  const limit = ac.createDynamicsCompressor();
  limit.threshold.value = -3; limit.knee.value = 0; limit.ratio.value = 20; limit.attack.value = 0.001; limit.release.value = 0.12;
  master.connect(glue).connect(makeup).connect(limit).connect(ac.destination);

  const verb = ac.createConvolver();
  verb.buffer = buffers(ac).room;
  const wet = ac.createGain();
  wet.gain.value = 0.42;
  verb.connect(wet).connect(master);
  const dry = ac.createGain();
  dry.gain.value = 1;
  dry.connect(master);
  dry.connect(verb);

  // "ta" — short and lighter; "DUM" — heavier, an octave up, with the low note doubled underneath
  hit(ac, dry, t0, 55, 0.7, 0.3);
  hit(ac, dry, t0 + 0.17, 110, 1.0, 1.6);
  hit(ac, dry, t0 + 0.17, 55, 0.55, 1.2);

  // the bloom: an A add9 chord that opens up like a swelling string section, then rings out
  const tb = t0 + 0.24;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 1.1;
  lp.frequency.setValueAtTime(380, tb);
  lp.frequency.exponentialRampToValueAtTime(5200, tb + 0.55);
  lp.frequency.exponentialRampToValueAtTime(1400, tb + 3);
  const bloom = ac.createGain();
  bloom.gain.setValueAtTime(0.0001, tb);
  bloom.gain.exponentialRampToValueAtTime(0.4, tb + 0.38);
  bloom.gain.setValueAtTime(0.4, tb + 0.6);
  bloom.gain.exponentialRampToValueAtTime(0.0001, tb + 3.2);
  lp.connect(bloom);
  bloom.connect(dry);
  [55, 110, 164.81, 220, 246.94, 277.18, 329.63, 440].forEach((f, i) => {
    [-9, 0, 8].forEach((cents) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = i < 2 ? 'triangle' : 'sawtooth';
      o.frequency.value = f;
      o.detune.value = cents;
      g.gain.value = i < 2 ? 0.16 : 0.055;
      o.connect(g).connect(lp);
      o.start(tb);
      o.stop(tb + 3.3);
    });
  });

  // airy shimmer on top
  const shimmer = ac.createGain();
  shimmer.gain.setValueAtTime(0.0001, tb + 0.1);
  shimmer.gain.exponentialRampToValueAtTime(0.05, tb + 0.6);
  shimmer.gain.exponentialRampToValueAtTime(0.0001, tb + 2.8);
  shimmer.connect(verb);
  [880, 1318.5].forEach((f) => {
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    o.connect(shimmer);
    o.start(tb + 0.1);
    o.stop(tb + 2.9);
  });
  return 3.6;
}

/** Plays the opening sting. Call from a click or key press. */
export function tudum() {
  if (!soundOn()) return;
  const ac = audio();
  if (!ac) return;
  buildTudum(ac, ac.currentTime + 0.04);
}

/** A short airy swoosh, used when a profile is picked. */
export function swoosh() {
  if (!soundOn()) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + 0.02;
  const src = ac.createBufferSource();
  src.buffer = buffers(ac).whoosh;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.9;
  bp.frequency.setValueAtTime(400, t);
  bp.frequency.exponentialRampToValueAtTime(3800, t + 0.42);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.35, t + 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
  src.connect(bp).connect(g).connect(ac.destination);
  src.start(t);
}
