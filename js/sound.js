// Opening sting, synthesised in the browser with Web Audio. No audio files.
// It is an original sound: a low sub drop, a rising breath of noise, then an
// open A add9 chord that blooms and fades. Browsers only allow audio after a
// click or key press, so it is played from the profile picker.

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

/** Plays the ~2 second opening sting. Call from a user gesture. */
export function sting() {
  if (!soundOn()) return;
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + 0.03;

  const master = ac.createGain();
  master.gain.value = 0.32;
  const comp = ac.createDynamicsCompressor();
  master.connect(comp).connect(ac.destination);

  // a short feedback echo gives the chord a tail without loading a reverb sample
  const delay = ac.createDelay(1);
  delay.delayTime.value = 0.19;
  const fb = ac.createGain();
  fb.gain.value = 0.34;
  const wet = ac.createGain();
  wet.gain.value = 0.4;
  delay.connect(fb).connect(delay);
  delay.connect(wet).connect(master);

  // 1. sub drop
  const sub = ac.createOscillator();
  const subGain = ac.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(92, t0);
  sub.frequency.exponentialRampToValueAtTime(36, t0 + 0.7);
  subGain.gain.setValueAtTime(0.0001, t0);
  subGain.gain.exponentialRampToValueAtTime(1, t0 + 0.02);
  subGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.1);
  sub.connect(subGain).connect(master);
  sub.start(t0);
  sub.stop(t0 + 1.2);

  // 2. rising breath of filtered noise
  const len = Math.floor(ac.sampleRate * 0.7);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const noise = ac.createBufferSource();
  noise.buffer = buf;
  const band = ac.createBiquadFilter();
  band.type = 'bandpass';
  band.Q.value = 1.2;
  band.frequency.setValueAtTime(250, t0);
  band.frequency.exponentialRampToValueAtTime(5200, t0 + 0.6);
  const noiseGain = ac.createGain();
  noiseGain.gain.setValueAtTime(0.0001, t0);
  noiseGain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.55);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.68);
  noise.connect(band).connect(noiseGain).connect(master);
  noise.start(t0);

  // 3. chord bloom: A2 E3 A3 C#4 E4 B4
  const tc = t0 + 0.6;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 0.8;
  lp.frequency.setValueAtTime(500, tc);
  lp.frequency.exponentialRampToValueAtTime(6200, tc + 0.35);
  lp.frequency.exponentialRampToValueAtTime(900, tc + 1.9);
  lp.connect(master);
  lp.connect(delay);
  [110, 164.81, 220, 277.18, 329.63, 493.88].forEach((f, i) => {
    [-5, 6].forEach((cents) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = i < 2 ? 'triangle' : 'sawtooth';
      o.frequency.value = f;
      o.detune.value = cents;
      const start = tc + i * 0.018;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(i < 2 ? 0.2 : 0.075, start + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 1.9);
      o.connect(g).connect(lp);
      o.start(start);
      o.stop(start + 2);
    });
  });
}
