// Hero: just the portrait, the name and a short introduction, on red light that fades to black.
// Role, resume and links live in the "At a glance" section right below (see glanceHTML).
// All words come from content.js.

import * as C from './content.js';
import { startHeroBg } from './herobg.js';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function heroHTML({ icon }) {
  const id = C.identity;
  const letters = 'PINKESH'.split('').map((l, i) => `<span class="hl" style="--i:${i}">${l}</span>`).join('');

  return `
  <section class="hero" id="hero" aria-labelledby="hero-name">
    <div class="hero-bg" aria-hidden="true"><canvas id="hero-canvas"></canvas></div>
    <div class="hero-hud layer" style="--d:6" aria-hidden="true">
      <div class="hud-floor"></div>
      <div class="scan"></div>
    </div>

    <div class="layer title-layer" style="--d:-14">
      <h1 class="hero-title" id="hero-name"><span class="ht-1" aria-hidden="true">${letters}</span><span class="sr">${esc(id.name)}</span></h1>
    </div>

    <div class="layer me-layer" style="--d:10">
      <div class="hero-me">
        <span class="me-glow" aria-hidden="true"></span>
        <picture><source type="image/webp" srcset="images/cutout.webp"><img src="images/cutout.png" alt="Portrait of ${esc(id.name)}" width="1093" height="1439" fetchpriority="high" decoding="async"></picture>
        <span class="me-rim" aria-hidden="true"></span>
      </div>
    </div>

    <div class="layer sig-layer" style="--d:-22" aria-hidden="true"><span class="sig">Darji</span></div>

    <div class="hero-copy">
      <p class="hc-role">${esc(id.title)}</p>
      <p class="hc-intro">${esc(id.oneLiner)}</p>
      <div class="hc-actions">
        <a class="btn primary" href="#projects">See my work ${icon('arrow-right', 18)}</a>
        <a class="btn" href="#contact">${icon('mail', 18)} Get in touch</a>
      </div>
    </div>

    <a class="scroll-cue" href="#glance" aria-label="Scroll down"><span aria-hidden="true"></span>Scroll</a>
  </section>`;
}

/** Right below the hero: what I'm doing now, the resume, and where to find me. */
export function glanceHTML({ icon, brand, ext }) {
  const id = C.identity;
  const job = C.experience[0];
  return `
  <section class="sec glance rv" id="glance" aria-labelledby="t-glance">
    <h2 class="row-title" data-split id="t-glance">At a glance</h2>
    <div class="gl-grid">
      <div class="gl-card gl-now">
        <p class="gl-k">Now</p>
        <p class="gl-status">${esc(id.statusLong)}</p>
        <div class="gl-role">
          <span class="date-pill">${esc(job.period)}</span>
          <p>${esc(id.title)}<br><span>${esc(id.company)}, ${esc(id.companyCity)}</span></p>
        </div>
        <div class="gl-links">
          <a class="round" href="${id.linkedin}" ${ext} aria-label="LinkedIn">${brand('linkedin', 18)}</a>
          <a class="round" href="${id.github}" ${ext} aria-label="GitHub">${brand('github', 18)}</a>
          <a class="round" href="mailto:${id.email}" aria-label="Email">${icon('mail', 18)}</a>
          <p class="gl-cred">${esc(C.about.credentials)}</p>
        </div>
      </div>
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
    </div>
  </section>`;
}

let bg = { light() {}, run() {} };
/** Animates (true) or pauses (false) the hero background, e.g. while a full-screen overlay covers it. */
export const heroBackground = (on) => bg.run(on);

/** Starts the hero's background and layout. Call once, after the hero is in the DOM. */
export function wireHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const img = hero.querySelector('.hero-me img');
  bg = startHeroBg(hero.querySelector('#hero-canvas'));
  const name = hero.querySelector('.ht-1');
  const layout = () => {
    const hr = hero.getBoundingClientRect();
    const ir = img.getBoundingClientRect();
    if (hr.height && ir.height) {
      // the light sits just behind the head
      bg.light((ir.left + ir.width * 0.55 - hr.left) / hr.width, 1 - (ir.top + ir.height * 0.24 - hr.top) / hr.height);
    }
    // the name must never run off the edge: if this font renders wider than planned, shrink it
    name.style.fontSize = '';
    const room = hero.clientWidth * 0.94;
    if (name.offsetWidth > room) name.style.fontSize = `${(parseFloat(getComputedStyle(name).fontSize) * room / name.offsetWidth).toFixed(2)}px`;
  };
  addEventListener('resize', layout);
  img.addEventListener('load', layout);
  document.fonts?.ready.then(layout);
  requestAnimationFrame(layout);
  setTimeout(layout, 400);
}
