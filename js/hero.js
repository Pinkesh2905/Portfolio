// Hero, styled like a film poster: a giant name behind a cut-out portrait, red smoke and
// light behind, HUD lines, callout lines pointing to featured work, and small poster details.
// All words come from content.js.

import * as C from './content.js';
import { startHeroBg } from './herobg.js';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Where the callout line starts on the portrait, as a fraction of the image (right collar). */
const ANCHOR = { x: 0.8, y: 0.8 };

function barcode(seed, n = 34) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  let bars = '';
  for (let i = 0; i < n; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const w = 1 + (h % 4);
    bars += `<i style="height:${w}px;margin-bottom:${1 + ((h >> 4) % 3)}px"></i>`;
  }
  return bars;
}

export function heroHTML({ icon, brand, ext }) {
  const id = C.identity;
  const job = C.experience[0];
  const featured = C.projects.filter((p) => p.featured);
  const mca = C.education.degrees[0];
  const letters = 'PINKESH'.split('').map((l, i) => `<span class="hl" style="--i:${i}">${l}</span>`).join('');
  const plus = [[8, 22], [31, 64], [64, 18], [92, 40], [47, 88], [76, 74]]
    .map(([x, y], i) => `<span class="plus" style="left:${x}%;top:${y}%;--i:${i}">+</span>`).join('');

  return `
  <section class="hero" id="hero" aria-labelledby="hero-name">
    <div class="hero-bg" aria-hidden="true"><canvas id="hero-canvas"></canvas></div>
    <div class="hero-hud layer" style="--d:6" aria-hidden="true">
      <div class="hud-floor"></div>
      <svg class="hud-lines" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <path pathLength="1" d="M0 610 L520 120 L1440 120"/>
        <path pathLength="1" d="M1440 700 L980 260 L0 260"/>
        <path pathLength="1" d="M180 900 L720 360 L1260 900"/>
        <circle pathLength="1" cx="720" cy="300" r="250"/>
        <circle pathLength="1" cx="720" cy="300" r="330" class="dash"/>
        <path pathLength="1" d="M60 120 H160 M60 120 V200 M1380 780 H1280 M1380 780 V700"/>
      </svg>
      ${plus}
      <div class="scan"></div>
    </div>

    <div class="layer title-layer" style="--d:-14">
      <p class="hero-badge"><span>Portfolio</span></p>
      <h1 class="hero-title" id="hero-name"><span class="ht-1" aria-hidden="true">${letters}</span><span class="sr">${esc(id.name)}</span><span class="ht-2" aria-hidden="true">Darji</span></h1>
      <p class="hero-intro">${esc(id.oneLiner)}</p>
    </div>

    <p class="hero-brush layer" style="--d:-30" aria-hidden="true"><span>Data × AI</span></p>

    <div class="layer me-layer" style="--d:10">
      <div class="hero-me">
        <span class="me-glow" aria-hidden="true"></span>
        <picture><source type="image/webp" srcset="images/cutout.webp"><img src="images/cutout.png" alt="Portrait of ${esc(id.name)}" width="1093" height="1439" fetchpriority="high" decoding="async"></picture>
        <span class="me-rim" aria-hidden="true"></span>
      </div>
      <svg class="callout-svg" aria-hidden="true"><path class="callout-path" pathLength="1"/><circle class="callout-dot" r="5"/><circle class="callout-ring" r="13"/></svg>
      <nav class="callouts" aria-label="Featured work">
        <p class="co-h">Featured work</p>
        <ul>${featured.map((p, i) => `<li style="--i:${i}"><a href="#projects/${p.id}">${esc(p.name)} <span>(${esc(p.tagline)})</span></a></li>`).join('')}</ul>
      </nav>
    </div>

    <div class="hero-left">
      <p class="hl-status">${esc(id.status)}</p>
      <p class="hl-row"><span class="date-pill">${esc(job.period)}</span><span class="hl-role">${esc(id.title)}<br>${esc(id.company)}, ${esc(id.companyCity)}</span></p>
      <div class="resume-card">
        <a class="rc-doc" href="${id.resume}" ${ext} tabindex="-1" aria-hidden="true">
          <span class="rc-sheet rc-back"></span>
          <span class="rc-sheet rc-front"><img src="images/resume-page.webp" alt="" width="360" height="466" loading="lazy" decoding="async"></span>
        </a>
        <div class="rc-info">
          <p class="rc-k">Resume</p>
          <p class="rc-t">${esc(id.title)} · PDF</p>
          <div class="rc-actions">
            <a class="rc-btn primary" href="${id.resume}" ${ext} aria-label="View resume (PDF, opens in a new tab)">${icon('eye', 16)} View</a>
            <a class="rc-btn" href="${id.resume}" download="Pinkesh_Darji_Resume.pdf" aria-label="Download resume (PDF)">${icon('download', 16)} Download</a>
          </div>
        </div>
      </div>
      <div class="hl-actions">
        <a class="btn primary" href="#contact">${icon('mail', 18)} Get in touch</a>
        <a class="btn" href="#about">${icon('info', 18)} About me</a>
      </div>
    </div>

    <div class="hero-right">
      <p class="hr-co">${icon('briefcase', 16)} ${esc(id.company)}</p>
      <div class="socials">
        <a class="round" href="${id.linkedin}" ${ext} aria-label="LinkedIn">${brand('linkedin', 18)}</a>
        <a class="round" href="${id.github}" ${ext} aria-label="GitHub">${brand('github', 18)}</a>
      </div>
    </div>

    <div class="hero-side" aria-hidden="true">
      <span class="bc">${barcode(id.name)}</span>
      <span class="side-t">${esc(mca.name)} · ${esc(mca.cgpa)} · ${esc(mca.years)}</span>
    </div>

    <a class="scroll-cue" href="#projects" aria-label="Scroll to projects"><span></span>Scroll</a>
  </section>`;
}

/** Draws the callout line from the portrait's shoulder to the featured-work list. */
function layoutCallout(hero) {
  const svg = hero.querySelector('.callout-svg');
  const img = hero.querySelector('.hero-me img');
  const list = hero.querySelector('.callouts');
  if (!svg || !img || !list || getComputedStyle(list).display === 'none') return;
  const layer = svg.parentElement.getBoundingClientRect();
  const ir = img.getBoundingClientRect();
  const lr = list.getBoundingClientRect();
  const ax = ir.left + ir.width * ANCHOR.x - layer.left;
  const ay = ir.top + ir.height * ANCHOR.y - layer.top;
  const ex = lr.left - layer.left - 14;
  const ey = lr.top - layer.top + 10;
  const kx = ex - Math.min(60, Math.abs(ey - ay) * 0.5);
  svg.setAttribute('viewBox', `0 0 ${layer.width} ${layer.height}`);
  svg.querySelector('.callout-path').setAttribute('d', `M${ax.toFixed(1)} ${ay.toFixed(1)} L${kx.toFixed(1)} ${ey.toFixed(1)} L${ex.toFixed(1)} ${ey.toFixed(1)}`);
  ['.callout-dot', '.callout-ring'].forEach((s) => {
    const c = svg.querySelector(s);
    c.setAttribute('cx', ax.toFixed(1));
    c.setAttribute('cy', ay.toFixed(1));
  });
}

/** Starts the hero's background and layout. Call once, after the hero is in the DOM. */
export function wireHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const img = hero.querySelector('.hero-me img');
  const setLight = startHeroBg(hero.querySelector('#hero-canvas'));
  const layout = () => {
    const hr = hero.getBoundingClientRect();
    const ir = img.getBoundingClientRect();
    if (hr.height && ir.height) {
      // the light sits just behind the head
      setLight((ir.left + ir.width * 0.55 - hr.left) / hr.width, 1 - (ir.top + ir.height * 0.24 - hr.top) / hr.height);
    }
    layoutCallout(hero);
  };
  addEventListener('resize', layout);
  img.addEventListener('load', layout);
  document.fonts?.ready.then(layout);
  requestAnimationFrame(layout);
  setTimeout(layout, 400);
}

/** Re-measures the callout once the hero entrance starts. */
export function heroCounters() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  layoutCallout(hero);
}
