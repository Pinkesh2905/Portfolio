// Hero: introduction on the left, portrait on the right in a ring of red light that fades to black.
// Role, resume and links live in the "At a glance" section right below (see glanceHTML).
// All words come from content.js.

import * as C from './content.js';
import { startHeroBg } from './herobg.js';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function heroHTML({ icon }) {
  const id = C.identity;
  // the key phrases of the one-liner stand out; the rest stays quiet
  const intro = esc(id.oneLiner)
    .replace('clear dashboards, plans and AI assistants', '<strong>clear dashboards, plans and AI assistants</strong>')
    .replace(/Claude Code\.?$/, (m) => `<mark>${m.replace('.', '')}</mark>.`);

  return `
  <section class="hero" id="hero" aria-labelledby="hero-name">
    <div class="hero-bg" aria-hidden="true"><canvas id="hero-canvas"></canvas></div>
    <div class="hero-hud layer" style="--d:6" aria-hidden="true">
      <div class="hud-floor"></div>
      <div class="scan"></div>
    </div>

    <div class="layer me-layer" style="--d:10">
      <div class="hero-me">
        <span class="me-glow" aria-hidden="true"></span>
        <svg class="me-ring" viewBox="0 0 200 200" aria-hidden="true">
          <defs><linearGradient id="ring-g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#ff2340" stop-opacity="0"/><stop offset=".45" stop-color="#ff2340"/><stop offset="1" stop-color="#ff8a9a" stop-opacity=".9"/></linearGradient></defs>
          <circle cx="100" cy="100" r="96" pathLength="1"/>
        </svg>
        <picture><source type="image/webp" srcset="images/cutout.webp"><img src="images/cutout.png" alt="Portrait of ${esc(id.name)}" width="1093" height="1439" fetchpriority="high" decoding="async"></picture>
        <span class="me-rim" aria-hidden="true"></span>
      </div>
    </div>

    <div class="hero-copy">
      <h1 class="hc-name" id="hero-name"><span class="hc-first">Pinkesh</span> <span class="hc-sig">Darji<svg class="hc-swash" viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M4 30 C 70 18, 150 10, 296 6"/></svg></span></h1>
      <p class="hc-roles">${id.roles.map((r) => `<span>${esc(r)}</span>`).join('<i aria-hidden="true"></i>')}</p>
      <p class="hc-intro">${intro}</p>
      <div class="hc-actions">
        <a class="btn primary" href="#projects">See my work ${icon('arrow-right', 18)}</a>
        <a class="btn" href="#glance">${icon('file-text', 18)} Resume</a>
      </div>
      <ul class="hc-tools" aria-label="Tools I use most">${id.tools.map((t, n) => `<li style="--i:${n}">${esc(t)}</li>`).join('')}</ul>
    </div>

    <a class="scroll-cue" href="#glance" aria-label="Scroll down">${icon('chevron-down', 22)}</a>
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
  const layout = () => {
    const hr = hero.getBoundingClientRect();
    const ir = img.getBoundingClientRect();
    if (hr.height && ir.height) {
      // the light sits just behind the head
      bg.light((ir.left + ir.width * 0.55 - hr.left) / hr.width, 1 - (ir.top + ir.height * 0.24 - hr.top) / hr.height);
    }
  };
  addEventListener('resize', layout);
  img.addEventListener('load', layout);
  document.fonts?.ready.then(layout);
  requestAnimationFrame(layout);
  setTimeout(layout, 400);
}
