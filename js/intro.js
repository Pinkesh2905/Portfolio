// Opening: a red ribbon "P" builds itself, then (on the sound) punches twice and the camera
// flies into its stem, which splits into streaks of red light. Then the profile picker appears.
// Browsers block sound until the visitor clicks or presses a key, so after the P is built
// the intro waits for one, unless this browser already allows sound (or sound is off).

import { tudum, soundOn, canAutoplay, prepareSound } from './sound.js';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The P mark: a stem and a bowl drawn as two overlapping ribbons. Reused in the header and hero. */
export function pMark(cls = '', id = 'p') {
  return `<svg class="pmark ${cls}" viewBox="0 0 230 300" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="${id}-stem" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#8f0618"/><stop offset=".32" stop-color="#e3112b"/><stop offset="1" stop-color="#ff2a3f"/>
      </linearGradient>
      <linearGradient id="${id}-bowl" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#b80a22"/><stop offset=".5" stop-color="#ff2340"/><stop offset="1" stop-color="#d40d29"/>
      </linearGradient>
      <filter id="${id}-shade" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="-6" dy="0" stdDeviation="5" flood-color="#000" flood-opacity=".55"/>
      </filter>
    </defs>
    <rect class="pm-stem" x="40" y="26" width="58" height="248" fill="url(#${id}-stem)"/>
    <path class="pm-bowl" d="M69 55 H134 A63 63 0 0 1 134 181 H69" fill="none" stroke="url(#${id}-bowl)" stroke-width="58" filter="url(#${id}-shade)" pathLength="100"/>
  </svg>`;
}

/**
 * The name as a red wordmark in the same ribbon red as the P: heavy condensed letters,
 * taller at the ends than in the middle so the word bows slightly, like a film title card.
 */
export function wordmark(cls = '') {
  const scale = [1.16, 1.07, 1.01, 0.97, 1.01, 1.07, 1.16];
  return `<span class="wm ${cls}" aria-hidden="true">${'PINKESH'.split('').map((l, i) => `<span style="--s:${scale[i]}">${l}</span>`).join('')}</span>`;
}

const STREAK_COLORS = ['#ff1f3d', '#e0102c', '#ff4d6d', '#b3001e', '#ff7a8a', '#ffffff', '#ff2a00', '#7a0014', '#ff3355', '#ffb3c0'];

function streaks(n = 110) {
  let html = '';
  for (let i = 0; i < n; i++) {
    const c = STREAK_COLORS[(Math.random() * STREAK_COLORS.length) | 0];
    const w = (Math.random() ** 2 * 2.2 + 0.15).toFixed(2);
    const x = (Math.random() * 100).toFixed(2);
    const d = (Math.random() * 0.5).toFixed(2);
    const o = (0.35 + Math.random() * 0.65).toFixed(2);
    html += `<i style="left:${x}%;width:${w}%;background:${c};opacity:${o};animation-delay:${d}s"></i>`;
  }
  return html;
}

/**
 * Runs the opening. Resolves when the screen is clear and the picker can show.
 * The element stays mounted as a black backdrop until `cleanup` is called.
 */
export function playIntro() {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'opening';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Opening');
    el.tabIndex = -1;
    el.innerHTML = `
      <div class="op-stage">
        <div class="op-p">${pMark('', 'op')}</div>
        <div class="op-streaks" aria-hidden="true">${streaks(matchMedia('(pointer: coarse)').matches ? 48 : 90)}</div>
      </div>
      <div class="op-flash" aria-hidden="true"></div>
      <button class="op-enter" type="button" hidden>
        <span class="op-enter-k">Click or press any key to enter</span>
        <span class="op-enter-s">${soundOn() ? 'Sound on · turn your volume up' : 'Sound off'}</span>
      </button>
      <button class="op-skip" type="button">Skip intro</button>`;
    document.body.appendChild(el);
    el.focus({ preventScroll: true });
    prepareSound();

    let stage = 'build';
    let done = false;
    const timers = [];
    const later = (ms, fn) => timers.push(setTimeout(fn, ms));

    const finish = () => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      removeEventListener('keydown', onKey, true);
      el.classList.add('gone');
      resolve(() => {
        el.classList.add('out');
        setTimeout(() => el.remove(), 600);
      });
    };

    const go = () => {
      if (stage !== 'wait' && stage !== 'build') return;
      stage = 'play';
      $enter.hidden = true;
      el.classList.add('built', 'play');
      tudum();
      // the visuals follow the sound: "ta" at 0s, "DUM" at 0.17s, bloom from 0.24s
      later(170, () => el.classList.add('dum'));
      later(330, () => el.classList.add('fly'));
      later(1900, () => el.classList.add('fade'));
      later(2450, finish);
    };

    const $enter = el.querySelector('.op-enter');
    const onKey = (ev) => {
      if (ev.key === 'Tab') return;
      if (ev.key === 'Escape') { ev.preventDefault(); return finish(); }
      if (stage === 'wait') { ev.preventDefault(); go(); }
    };
    addEventListener('keydown', onKey, true);

    el.addEventListener('click', (ev) => {
      if (ev.target.closest('.op-skip')) return finish();
      if (stage === 'wait' || stage === 'build') go();
    });

    if (reduce()) return finish();

    // the P builds itself (silent), then either plays straight on or waits for a click
    later(1250, () => {
      if (stage !== 'build') return;
      el.classList.add('built');
      if (!soundOn() || canAutoplay()) go();
      else {
        stage = 'wait';
        $enter.hidden = false;
        $enter.focus({ preventScroll: true });
      }
    });
  });
}
