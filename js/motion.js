// Motion layer for the streaming-style page: smooth scrolling (Lenis), word-by-word title
// reveals, sections and posters revealing as they enter, scroll-speed marquees, scroll-linked
// hero/experience/contact effects, a cursor ring and magnetic buttons.
// Everything here is decoration: with reduced motion it switches off and the page is static.

import Lenis from './vendor/lenis.mjs';

const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

let lenis = null;
let io = null;
let last = { y: -1 };
let vel = 0;
const marquees = [];

/** Page y of an element's resting position (offsetTop ignores the reveal animation's offset). */
function restingTop(el) {
  let y = 0;
  for (let n = el; n; n = n.offsetParent) y += n.offsetTop;
  return y;
}

/** Smooth scroll to an element (below the fixed header) or to a y position. */
export function scrollToTarget(target, { immediate = false } = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : typeof target === 'number' ? null : target;
  const header = document.querySelector('.top')?.offsetHeight || 0;
  const y = el ? Math.max(0, restingTop(el) - header - 12) : target;
  if (lenis && !reduce()) {
    lenis.resize(); // content may have been rendered since Lenis last measured the page
    lenis.scrollTo(y, { immediate, force: true, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
    return;
  }
  scrollTo({ top: y, behavior: 'auto' });
}
export const stopScroll = () => lenis?.stop();
export const startScroll = () => lenis?.start();

/* ── text splitting: each word slides up from behind a mask ── */
function split(el) {
  if (el.dataset.split === 'done') return;
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute('aria-label', el.textContent.trim());
  el.innerHTML = words.map((w, i) => `<span class="sw" aria-hidden="true"><span class="si" style="--i:${i}">${w.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])}</span></span>`).join(' ');
  el.dataset.split = 'done';
}

/** Wires reveals and marquees on freshly rendered content. Call after each render. */
export function refreshMotion() {
  $$('[data-split]').forEach(split);
  marquees.length = 0;
  $$('.marquee').forEach((m) => marquees.push({ el: m, inner: m.querySelector('.mq-inner'), x: 0, dir: +m.dataset.dir || -1 }));
  if (reduce() || !('IntersectionObserver' in window)) {
    $$('.rv').forEach((el) => el.classList.add('in'));
    return;
  }
  io?.disconnect();
  io = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      io.unobserve(en.target);
    }),
    { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
  );
  $$('.rv:not(.in)').forEach((el) => io.observe(el));
}

/* ── per-frame scroll effects ── */
function tick() {
  const y = lenis ? lenis.animatedScroll : scrollY;
  const raw = lenis ? lenis.velocity : y - (last.y < 0 ? y : last.y);
  vel += (raw - vel) * 0.12;
  const moved = y !== last.y;
  last.y = y;
  const vh = innerHeight;

  if (moved) {
    const max = document.documentElement.scrollHeight - vh;
    document.documentElement.style.setProperty('--sp', max > 0 ? (y / max).toFixed(4) : '0');
    document.querySelector('.top')?.classList.toggle('solid', y > 24);

    const hero = document.querySelector('.hero');
    if (hero && !reduce()) hero.style.setProperty('--p', clamp(y / hero.offsetHeight, 0, 1).toFixed(4));

    $$('.eps').forEach((list) => {
      const r = list.getBoundingClientRect();
      const f = clamp((vh * 0.6 - r.top) / r.height, 0, 1);
      list.style.setProperty('--fill', f.toFixed(4));
      $$('li', list).forEach((li) => {
        const b = li.getBoundingClientRect();
        li.classList.toggle('lit', b.top + b.height / 2 < vh * 0.62);
      });
    });

    const c = document.querySelector('.contact');
    if (c) {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--cp', clamp(1 - (r.top - vh * 0.15) / (vh * 0.85), 0, 1).toFixed(4));
    }
  }

  if (!reduce()) {
    const skew = clamp(vel * 0.35, -9, 9);
    marquees.forEach((m) => {
      if (!m.inner) return;
      const w = m.inner.scrollWidth / 2;
      m.x += (0.55 + Math.min(Math.abs(vel) * 0.6, 18)) * m.dir;
      if (w) m.x = ((m.x % w) + w) % w - w;
      m.inner.style.transform = `translate3d(${m.x.toFixed(1)}px,0,0) skewX(${(skew * m.dir * -1).toFixed(2)}deg)`;
    });
  }
  requestAnimationFrame(tick);
}

/* ── cursor ring and magnetic buttons (mouse only) ── */
function wirePointer() {
  if (!fine()) return;
  const ring = document.createElement('div');
  ring.className = 'cursor';
  ring.setAttribute('aria-hidden', 'true');
  ring.innerHTML = '<span class="cursor-label"></span>';
  document.body.appendChild(ring);
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const cur = { x: pos.x, y: pos.y };
  let mag = null;

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    pos.x = e.clientX;
    pos.y = e.clientY;
    ring.classList.add('on');
    const t = e.target.closest?.('a, button, [role="option"], .card');
    ring.classList.toggle('hover', !!t);
    const label = t?.closest('.card') ? 'View' : '';
    ring.classList.toggle('label', !!label);
    ring.firstChild.textContent = label;

    const m = reduce() ? null : e.target.closest?.('.btn, .round, .ib, .mag');
    if (mag && mag !== m) mag.style.transform = '';
    mag = m;
    if (m) {
      const r = m.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      m.style.transform = `translate(${(dx * 0.22).toFixed(1)}px, ${(dy * 0.3).toFixed(1)}px)`;
    }
  }, { passive: true });
  document.addEventListener('pointerleave', () => ring.classList.remove('on'));
  addEventListener('pointerdown', () => ring.classList.add('down'));
  addEventListener('pointerup', () => ring.classList.remove('down'));

  const loop = () => {
    cur.x += (pos.x - cur.x) * 0.2;
    cur.y += (pos.y - cur.y) * 0.2;
    ring.style.transform = `translate3d(${cur.x.toFixed(1)}px, ${cur.y.toFixed(1)}px, 0)`;
    requestAnimationFrame(loop);
  };
  loop();
}

/* ── hero: the layers follow the pointer at different depths ── */
function wireHeroParallax() {
  if (!fine()) return;
  const target = { x: 0, y: 0 };
  const cur = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => {
    target.x = (e.clientX / innerWidth) * 2 - 1;
    target.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
  const loop = () => {
    cur.x += (target.x - cur.x) * 0.06;
    cur.y += (target.y - cur.y) * 0.06;
    const hero = document.querySelector('.hero');
    if (hero && !reduce()) {
      hero.style.setProperty('--mx', cur.x.toFixed(4));
      hero.style.setProperty('--my', cur.y.toFixed(4));
    }
    requestAnimationFrame(loop);
  };
  loop();
}

export function initMotion() {
  if (!reduce()) {
    lenis = new Lenis({ autoRaf: true, lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95, anchors: false });
  }
  requestAnimationFrame(tick);
  wirePointer();
  wireHeroParallax();
}
