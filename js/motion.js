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
// measured once per render / resize, not every frame
const geo = { hero: null, heroH: 1, eps: [], contact: null, docMax: 1, vh: 1 };

function measure() {
  geo.vh = innerHeight;
  geo.docMax = Math.max(1, document.documentElement.scrollHeight - geo.vh);
  geo.hero = document.querySelector('.hero');
  geo.heroH = geo.hero?.offsetHeight || 1;
  const top = (el) => { let y = 0; for (let n = el; n; n = n.offsetParent) y += n.offsetTop; return y; };
  geo.eps = $$('.eps').map((list) => ({
    list,
    top: top(list),
    h: list.offsetHeight,
    items: $$('li', list).map((li) => ({ li, mid: top(li) + li.offsetHeight / 2, lit: false })),
  }));
  geo.contact = document.querySelector('.contact');
  geo.contactTop = geo.contact ? top(geo.contact) : 0;
  marquees.forEach((m) => { m.w = m.inner ? m.inner.scrollWidth / 2 : 0; });
  last.y = -1; // repaint scroll effects with the new numbers
}

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
  $$('.marquee').forEach((m) => {
    const entry = { el: m, inner: m.querySelector('.mq-inner'), x: 0, dir: +m.dataset.dir || -1, w: 0, on: true };
    marquees.push(entry);
    if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { entry.on = en.isIntersecting; }).observe(m);
  });
  requestAnimationFrame(measure);
  document.fonts?.ready.then(measure);
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
let topBar = null;
function tick() {
  const y = lenis ? lenis.animatedScroll : scrollY;
  const raw = lenis ? lenis.velocity : y - (last.y < 0 ? y : last.y);
  vel += (raw - vel) * 0.12;
  const moved = Math.abs(y - last.y) > 0.5;
  if (moved) last.y = y;
  const vh = geo.vh;
  const top = topBar || (topBar = document.querySelector('.top'));

  if (moved) {
    document.documentElement.style.setProperty('--sp', clamp(y / geo.docMax, 0, 1).toFixed(4));
    top?.classList.toggle('solid', y > 24);

    if (geo.hero && !reduce() && y < geo.heroH * 1.2) geo.hero.style.setProperty('--p', clamp(y / geo.heroH, 0, 1).toFixed(4));

    geo.eps.forEach((e) => {
      if (y + vh < e.top - 200 || y > e.top + e.h + 200) return; // off screen: skip
      e.list.style.setProperty('--fill', clamp((y + vh * 0.6 - e.top) / e.h, 0, 1).toFixed(4));
      e.items.forEach((it) => {
        const lit = it.mid < y + vh * 0.62;
        if (lit !== it.lit) { it.lit = lit; it.li.classList.toggle('lit', lit); }
      });
    });

    if (geo.contact && y + vh > geo.contactTop - 100) {
      geo.contact.style.setProperty('--cp', clamp(1 - (geo.contactTop - y - vh * 0.15) / (vh * 0.85), 0, 1).toFixed(4));
    }
  }

  if (!reduce()) {
    const skew = clamp(vel * 0.35, -9, 9);
    marquees.forEach((m) => {
      if (!m.inner || !m.on) return;
      const w = m.w;
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
    if (Math.abs(pos.x - cur.x) > 0.1 || Math.abs(pos.y - cur.y) > 0.1) {
      cur.x += (pos.x - cur.x) * 0.2;
      cur.y += (pos.y - cur.y) * 0.2;
      ring.style.transform = `translate3d(${cur.x.toFixed(1)}px, ${cur.y.toFixed(1)}px, 0)`;
    }
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
    const dx = (target.x - cur.x) * 0.06;
    const dy = (target.y - cur.y) * 0.06;
    if (Math.abs(dx) > 0.0004 || Math.abs(dy) > 0.0004) {
      cur.x += dx;
      cur.y += dy;
      const hero = geo.hero;
      if (hero && !reduce() && scrollY < geo.heroH) {
        hero.style.setProperty('--mx', cur.x.toFixed(4));
        hero.style.setProperty('--my', cur.y.toFixed(4));
      }
    }
    requestAnimationFrame(loop);
  };
  loop();
}

export function initMotion() {
  addEventListener('resize', () => requestAnimationFrame(measure));
  addEventListener('load', measure);
  if (!reduce()) {
    lenis = new Lenis({ autoRaf: true, lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95, anchors: false });
  }
  requestAnimationFrame(tick);
  wirePointer();
  wireHeroParallax();
}
