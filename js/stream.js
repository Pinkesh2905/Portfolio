// Streaming-style home page: red P opening, profile picker, poster-style hero, rows of
// project "titles", hover previews and a detail dialog. All words come from content.js.
import * as C from './content.js';
import { ICONS, BRAND } from './icons.js';
import { tudum, swoosh, soundOn, setSound } from './sound.js';
import { playIntro, pMark } from './intro.js';
import { heroHTML, wireHero, heroCounters } from './hero.js';
import { initMotion, refreshMotion, scrollToTarget, stopScroll, startScroll } from './motion.js';

const { identity } = C;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ── helpers ─────────────────────────────────────────────── */
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
/** Escapes text, then turns **bold** into <strong>. */
const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

function icon(name, size = 24, sw = 1.9) {
  const inner = ICONS[name];
  if (!inner) return '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}
const brand = (name, size = 20) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${BRAND[name]}</svg>`;
const picture = (src, alt, attrs = '') =>
  `<picture><source srcset="${src.webp}" type="image/webp"><img src="${src.jpg}" alt="${esc(alt)}" ${attrs}></picture>`;
const ext = 'target="_blank" rel="noopener noreferrer"';
const store = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* private mode */ } },
};

/* ── profiles: who is viewing decides what comes first ───── */
const PROFILES = [
  { id: 'recruiter', label: 'Recruiter', icon: 'briefcase', g: 'linear-gradient(140deg,#ff6a7f,#b3123f)', picks: 'Top picks for recruiters',
    rows: ['featured', 'experience', 'skills', 'projects', 'education', 'builds'] },
  { id: 'developer', label: 'Developer', icon: 'terminal', g: 'linear-gradient(140deg,#4cc3ff,#4338ca)', picks: 'Top picks for developers',
    rows: ['featured', 'projects', 'builds', 'skills', 'experience', 'education'] },
  { id: 'guest', label: 'Just browsing', icon: 'user', g: 'linear-gradient(140deg,#fbbf24,#ea580c)', picks: 'Featured work',
    rows: ['featured', 'projects', 'experience', 'skills', 'education', 'builds'] },
];
let profile = PROFILES.find((p) => p.id === store.get('pd-profile')) || null;
const prof = () => profile || PROFILES[2];

const featured = C.projects.filter((p) => p.featured);
const others = C.projects.filter((p) => !p.featured);
const shortStatus = (p) => p.status.split(' · ').pop();

/* ── toast ───────────────────────────────────────────────── */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch { /* ignore */ }
    ta.remove();
  }
  toast('Email copied');
}

/* ── poster art: a real screenshot and logo when the project has them, otherwise generated ── */
const pdir = (id) => `images/projects/${id}`;
const shotUrl = (id, i, small) => `${pdir(id)}/${i + 1}${small ? '-sm' : ''}.webp`;
const isPhone = (s) => /phone|mobile/i.test(s.src);
const hasShots = (p) => (p.shots || []).length > 0;

function art(p, cls = '') {
  if (!hasShots(p)) {
    return `<span class="art ${cls}" style="--g:${p.gradient}">
      <span class="art-big" aria-hidden="true">${icon(p.icon, 96, 1.4)}</span>
      <span class="badge">${esc(shortStatus(p))}</span>
      <span class="art-title">${esc(p.name)}</span>
    </span>`;
  }
  const tall = cls.includes('tall');
  const i = tall ? p.media?.poster ?? 0 : 0;
  return `<span class="art has-img ${cls}" style="--g:${p.gradient}">
    <img class="art-img${isPhone(p.shots[i]) ? ' phone' : ''}" src="${shotUrl(p.id, i, true)}" alt="" loading="lazy" decoding="async">
    <span class="badge">${esc(shortStatus(p))}</span>
    <span class="art-foot">
      ${p.media?.logo ? `<img class="art-logo" src="${pdir(p.id)}/logo.webp" alt="" loading="lazy" decoding="async">` : ''}
      <span class="art-title">${esc(p.name)}</span>
    </span>
  </span>`;
}
const card = (p, cls = '') =>
  `<a class="card ${cls}" href="#projects/${p.id}" data-id="${p.id}" aria-label="${esc(p.name)}: ${esc(p.tagline)}">${art(p, cls.includes('poster') ? 'tall' : '')}</a>`;

/* ── header ──────────────────────────────────────────────── */
const NAV = [['projects', 'Projects'], ['experience', 'Experience'], ['skills', 'Skills'], ['education', 'Education'], ['contact', 'Contact']];

function renderHeader() {
  const p = prof();
  $('#top').innerHTML = `
    <a class="logo" href="./" data-home aria-label="${esc(identity.name)}, home">${pMark('logo-mark', 'lg')}<span>PINKESH</span></a>
    <nav class="nav" aria-label="Sections">${NAV.map(([id, l]) => `<a href="#${id}">${l}</a>`).join('')}</nav>
    <span class="grow"></span>
    <button class="ib" type="button" data-spotlight aria-label="Search (Ctrl or Command K)">${icon('search', 20)}</button>
    <button class="ib" type="button" id="snd" aria-label="Sound" aria-pressed="${soundOn()}">${icon(soundOn() ? 'volume-2' : 'volume-x', 20)}</button>
    <div class="who">
      <button class="who-btn" type="button" id="who-btn" aria-haspopup="true" aria-expanded="false" aria-label="Viewing as ${esc(p.label)}. Switch profile">
        <span class="tile sm" style="background:${p.g}">${icon(p.icon, 16)}</span>${icon('chevron-down', 16)}
      </button>
      <div class="menu" id="who-menu" hidden>
        <p class="menu-h">Viewing as</p>
        ${PROFILES.map((x) => `<button type="button" data-profile="${x.id}" aria-current="${x.id === p.id}"><span class="tile sm" style="background:${x.g}">${icon(x.icon, 16)}</span>${esc(x.label)}</button>`).join('')}
        <hr>
        <a href="os.html">${icon('layout-grid', 16)} Classic OS view</a>
        <a href="${identity.simple}">${icon('list', 16)} Simple view</a>
      </div>
    </div>`;
}

/* ── rows ────────────────────────────────────────────────── */
const track = (inner) => `
  <div class="track-wrap">
    <button class="arrow prev" type="button" data-dir="-1" aria-label="Scroll back" tabindex="-1" disabled>${icon('chevron-left', 28)}</button>
    <ul class="track">${inner}</ul>
    <button class="arrow next" type="button" data-dir="1" aria-label="Scroll forward" tabindex="-1">${icon('chevron-right', 28)}</button>
  </div>`;

const BUILD_ART = [
  'linear-gradient(135deg,#be185d,#7c3aed)', 'linear-gradient(135deg,#0f766e,#2563eb)',
  'linear-gradient(135deg,#c2410c,#be123c)', 'linear-gradient(135deg,#334155,#0f172a)',
];

/** Gives a small build the fields the poster art expects. */
const asProject = (b, i) => ({ ...b, gradient: BUILD_ART[i % BUILD_ART.length], icon: 'arrow-up-right', status: b.note || 'Build' });

const ROWS = {
  featured: () => `
    <section class="row rv" id="projects" aria-labelledby="t-featured">
      <h2 class="row-title" data-split id="t-featured">${esc(prof().picks)}</h2>
      ${track(featured.map((p, i) => `<li class="rank"><span class="num" aria-hidden="true">${i + 1}</span>${card(p, 'poster')}</li>`).join(''))}
    </section>`,

  projects: () => `
    <section class="row rv" id="more-projects" aria-labelledby="t-projects">
      <h2 class="row-title" data-split id="t-projects">Personal and freelance projects</h2>
      ${track(others.map((p) => `<li>${card(p)}</li>`).join(''))}
    </section>`,

  builds: () => `
    <section class="row rv" id="builds" aria-labelledby="t-builds">
      <h2 class="row-title" data-split id="t-builds">More builds</h2>
      ${track(C.moreBuilds.map((b, i) => hasShots(b)
        ? `<li><a class="card build" href="#builds/${b.id}" aria-label="${esc(b.name)}${b.note ? `, ${esc(b.note)}` : ''}">${art(asProject(b, i))}</a></li>`
        : `<li><a class="card build" href="${b.href}" ${ext} aria-label="${esc(b.name)}${b.note ? `, ${esc(b.note)}` : ''} (opens in a new tab)">
          <span class="art" style="--g:${BUILD_ART[i % BUILD_ART.length]}">
            <span class="art-big" aria-hidden="true">${icon('arrow-up-right', 96, 1.4)}</span>
            ${b.note ? `<span class="badge">${esc(b.note)}</span>` : ''}
            <span class="art-title">${esc(b.name)}</span>
          </span></a></li>`).join(''))}
    </section>`,

  experience: () => `
    <section class="sec rv" id="experience" aria-labelledby="t-exp">
      <h2 class="row-title" data-split id="t-exp">Experience</h2>
      ${C.experience.map((e) => `
        <div class="exp">
          <div class="exp-head">
            <h3 data-split>${esc(e.role)}</h3>
            <p class="exp-meta"><span class="now">${esc(e.period)}</span><span>${esc(e.company)}</span></p>
            <p class="exp-blurb">${esc(e.blurb)}</p>
          </div>
          <ol class="eps">${e.bullets.map((b, i) => `<li><span class="ep-n" aria-hidden="true">${i + 1}</span><p>${rich(b)}</p></li>`).join('')}</ol>
        </div>`).join('')}
    </section>`,

  skills: () => `
    <section class="sec rv" id="skills" aria-labelledby="t-skills">
      <h2 class="row-title" data-split id="t-skills">Skills</h2>
      <div class="genres">${C.skills.map((g) => `
        <div class="genre"><h3>${esc(g.group)}</h3>
          <ul class="chips">${g.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}</div>
    </section>`,

  education: () => {
    const e = C.education;
    return `
    <section class="sec rv" id="education" aria-labelledby="t-edu">
      <h2 class="row-title" data-split id="t-edu">Education</h2>
      <div class="edu">
        ${e.degrees.map((d) => `<div class="edu-card"><p class="edu-y">${esc(d.years)}</p><h3>${esc(d.name)}</h3><p>${esc(d.school)}</p><p class="edu-g">${esc(d.cgpa)}</p></div>`).join('')}
        <a class="edu-card link" href="${e.certification.href}" ${ext}><p class="edu-y">Certification</p><h3>${esc(e.certification.name)}</h3><p class="edu-g">View certificate ${icon('arrow-up-right', 16)}</p></a>
      </div>
    </section>`;
  },
};

function contact() {
  return `
    <section class="sec contact rv" id="contact" aria-labelledby="t-contact">
      <p class="kicker"><span class="live" aria-hidden="true"></span>${esc(identity.statusLong)}</p>
      <h2 class="cta" id="t-contact" data-split>Get in touch</h2>
      <div class="contact-actions">
        <a class="btn primary" href="mailto:${identity.email}">${icon('mail', 20)} ${esc(identity.email)}</a>
        <button class="btn" type="button" data-copy="${esc(identity.email)}">${icon('copy', 20)} Copy email</button>
        <a class="btn" href="${identity.phoneHref}">${icon('phone', 20)} ${esc(identity.phone)}</a>
        <a class="btn" href="${identity.linkedin}" ${ext}>${brand('linkedin')} LinkedIn</a>
        <a class="btn" href="${identity.github}" ${ext}>${brand('github')} GitHub</a>
        <a class="btn" href="${identity.resume}" ${ext}>${icon('file-text', 20)} Resume (PDF)</a>
      </div>
      <p class="loc">${icon('map-pin', 16)} ${esc(identity.location)}</p>
    </section>`;
}

/* ── marquee bands ───────────────────────────────────────── */
function marquee(items, dir, cls = '') {
  const run = items.map((t) => `<span>${esc(t)}</span><b aria-hidden="true">✦</b>`).join('');
  return `<div class="marquee ${cls}" data-dir="${dir}" aria-hidden="true"><div class="mq-inner"><div>${run}</div><div>${run}</div></div></div>`;
}
const skillWords = () => {
  const all = [...C.skillsWidget, ...C.skills.flatMap((g) => g.items)].filter((t) => t.length <= 18);
  return [...new Set(all)];
};

function render() {
  renderHeader();
  if (!$('.hero')) {
    $('#main').innerHTML = `${heroHTML({ icon, brand, ext })}<div id="rows"></div>`;
    wireHero();
  }
  $('#rows').innerHTML =
    marquee(skillWords(), -1, 'band-red') +
    prof().rows.map((r) => ROWS[r]()).join('') +
    marquee([identity.statusLong], 1, 'band-outline') +
    contact();
  $('#foot').innerHTML = `
    <span class="logo sm" aria-hidden="true">${pMark('logo-mark', 'lf')}<span>PINKESH</span></span>
    <nav aria-label="Other views"><a href="#about">About</a><a href="os.html">Classic OS view</a><a href="${identity.simple}">Simple view</a></nav>
    <p>${esc(identity.name)} · ${esc(identity.title)}</p>`;
  wireTracks();
  refreshMotion();
}

/* ── row scrolling ───────────────────────────────────────── */
function wireTracks() {
  $$('.track-wrap').forEach((wrap) => {
    const t = $('.track', wrap);
    const sync = () => {
      const max = t.scrollWidth - t.clientWidth - 4;
      $('.prev', wrap).disabled = t.scrollLeft <= 4;
      $('.next', wrap).disabled = t.scrollLeft >= max;
      wrap.classList.toggle('scrollable', max > 4);
    };
    t.addEventListener('scroll', () => { sync(); if (peek) hidePeek(true); }, { passive: true });
    sync();
  });
}

/* ── hover preview (mouse only): the card grows into a small info panel ── */
let peek = null; // { el, card }
let peekTimer = 0;

function showPeek(cardEl) {
  const p = C.projects.find((x) => x.id === cardEl.dataset.id);
  if (!p || modal || !document.contains(cardEl)) return;
  hidePeek(true);
  const r = cardEl.getBoundingClientRect();
  const W = Math.max(330, Math.min(420, r.width * 1.45));
  const tools = [...p.tools, ...(p.builtWithClaudeCode ? ['Claude Code'] : [])].slice(0, 4);
  const el = document.createElement('div');
  el.className = 'peek';
  el.style.width = `${W}px`;
  el.innerHTML = `
    <a class="peek-art" href="#projects/${p.id}" tabindex="-1" aria-hidden="true">${art(p)}</a>
    <div class="peek-body">
      <div class="peek-actions">
        <a class="round primary" href="#projects/${p.id}" tabindex="-1" aria-label="Open ${esc(p.name)}">${icon('play', 18)}</a>
        ${p.links.map((l) => `<a class="round" href="${l.href}" ${ext} tabindex="-1" aria-label="${esc(l.label)} (opens in a new tab)" title="${esc(l.label)}">${icon('arrow-up-right', 18)}</a>`).join('')}
        <span class="grow"></span>
        <a class="round" href="#projects/${p.id}" tabindex="-1" aria-label="More about ${esc(p.name)}">${icon('chevron-down', 18)}</a>
      </div>
      <p class="peek-status">${esc(p.status)}</p>
      <p class="peek-tag">${esc(p.tagline)}</p>
      ${tools.length ? `<p class="peek-tools">${tools.map((t) => `<span>${esc(t)}</span>`).join('')}</p>` : ''}
    </div>`;
  document.body.appendChild(el);
  const H = el.offsetHeight;
  const left = Math.min(Math.max(r.left + r.width / 2 - W / 2, 12), document.documentElement.clientWidth - W - 12);
  const top = Math.max(r.top + r.height / 2 - H / 2, 70);
  el.style.left = `${left + scrollX}px`;
  el.style.top = `${top + scrollY}px`;
  peek = { el, card: cardEl };
  if (!reduceMotion()) {
    const ox = r.left + r.width / 2 - left;
    const oy = r.top + r.height / 2 - top;
    el.style.transformOrigin = `${ox}px ${oy}px`;
    el.animate(
      [{ transform: `scale(${(r.width / W).toFixed(3)})`, opacity: 0.4 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );
  }
  el.addEventListener('pointerleave', () => hidePeek());
}

function hidePeek(now) {
  clearTimeout(peekTimer);
  if (!peek) return;
  const { el } = peek;
  peek = null;
  if (now || reduceMotion()) return el.remove();
  el.style.pointerEvents = 'none';
  el.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.94)' }], { duration: 160, easing: 'ease-in', fill: 'forwards' }).onfinish = () => el.remove();
}

function wirePeek() {
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse' || !finePointer() || innerWidth < 900) return;
    const c = e.target.closest?.('.card[data-id]');
    if (!c || c.closest('.modal')) return;
    if (peek && peek.card === c) return;
    clearTimeout(peekTimer);
    peekTimer = setTimeout(() => { if (c.matches(':hover')) showPeek(c); }, 420);
  });
  document.addEventListener('pointerout', (e) => {
    const c = e.target.closest?.('.card[data-id]');
    if (c && !c.contains(e.relatedTarget)) clearTimeout(peekTimer);
  });
  addEventListener('scroll', () => { if (peek) hidePeek(true); }, { passive: true });
}

/* ── detail dialog ───────────────────────────────────────── */
function cover(p) {
  return hasShots(p)
    ? `<img class="m-cover" src="${shotUrl(p.id, 0)}" alt="" decoding="async">`
    : `<span class="m-icon" aria-hidden="true">${icon(p.icon, 220, 1.1)}</span>`;
}
const logoTag = (p) => (p.media?.logo ? `<img class="m-logo" src="${pdir(p.id)}/logo.webp" alt="" width="56" height="56">` : '');

function gallery(p) {
  if (!hasShots(p)) return '';
  return `<section class="m-gallery" aria-labelledby="g-${p.id}">
    <div class="mg-head"><h3 id="g-${p.id}">Screenshots</h3>${p.media?.note ? `<p>${esc(p.media.note)}</p>` : ''}</div>
    <div class="mg-strip">${p.shots.map((s, i) => `
      <button class="mg-shot${isPhone(s) ? ' phone' : ''}" type="button" data-shot="${i}" data-of="${p.id}" aria-label="View screenshot ${i + 1} of ${p.shots.length}: ${esc(s.caption)}">
        <span class="mg-frame"><img src="${shotUrl(p.id, i, true)}" alt="" loading="lazy" decoding="async"></span>
        <span class="mg-cap">${esc(s.caption)}</span>
      </button>`).join('')}
    </div>
  </section>`;
}

/** Page for a small build that has screenshots: cover, live link and gallery. */
function buildView(b) {
  const i = C.moreBuilds.indexOf(b);
  const p = asProject(b, i);
  return {
    label: b.name,
    html: `
      <div class="m-art has-cover" style="--g:${p.gradient}">
        ${cover(p)}
        <div class="m-head">
          ${logoTag(p)}${b.note ? `<span class="badge">${esc(b.note)}</span>` : ''}
          <h2 id="m-title">${esc(b.name)}</h2>
          <div class="m-actions"><a class="btn primary" href="${b.href}" ${ext}>${icon('play', 18)} Open live</a></div>
        </div>
      </div>
      ${gallery(p)}`,
  };
}

function projectView(p) {
  const section = (title, text) => (text ? `<h3>${title}</h3><p>${esc(text)}</p>` : '');
  const tools = p.tools;
  const more = C.projects.filter((x) => x.id !== p.id).slice(0, 6);
  return {
    label: p.name,
    html: `
      <div class="m-art${hasShots(p) ? ' has-cover' : ''}" style="--g:${p.gradient}">
        ${cover(p)}
        <div class="m-head">
          ${logoTag(p)}<span class="badge">${esc(p.status)}</span>
          <h2 id="m-title">${esc(p.name)}</h2>
          <p class="m-tag">${esc(p.tagline)}</p>
          <div class="m-actions">
            ${p.links.map((l, i) => `<a class="btn ${i ? '' : 'primary'}" href="${l.href}" ${ext}>${icon(i ? 'arrow-up-right' : 'play', 18)} ${esc(l.label)}</a>`).join('')}
            ${p.id === 'vezapp-planner' && !p.shots.length ? `<span class="m-note">${icon('layers', 16)} Company product, so no public demo. Screenshots on request.</span>` : ''}
          </div>
        </div>
      </div>
      <div class="m-body">
        <div class="m-main">
          ${section('Problem', p.problem)}${section('What I did', p.did)}${section('Result', p.result)}${section('About', p.summary)}
        </div>
        <aside class="m-side">
          <p><span>Status</span>${esc(p.status)}</p>
          ${tools.length ? `<p><span>Tools</span>${tools.map(esc).join(', ')}</p>` : ''}
          ${p.builtWithClaudeCode ? '<p><span>Built with</span>Claude Code</p>' : ''}
        </aside>
      </div>
      ${gallery(p)}
      <div class="m-more"><h3>More projects</h3><div class="m-grid">${more.map((x) => card(x)).join('')}</div></div>`,
  };
}

function aboutView() {
  return {
    label: `About ${identity.name}`,
    html: `
      <div class="m-art about">
        ${picture(identity.portrait, `Portrait of ${identity.name}`, 'width="1093" height="1439"')}
        <div class="m-head">
          <span class="badge">${esc(identity.status)}</span>
          <h2 id="m-title">${esc(identity.name)}</h2>
          <p class="m-tag">${esc(identity.title)}</p>
          <div class="m-actions">
            <a class="btn primary" href="${identity.resume}" ${ext}>${icon('play', 18)} Resume</a>
            <a class="btn" href="#contact">${icon('mail', 18)} Contact</a>
          </div>
        </div>
      </div>
      <div class="m-body">
        <div class="m-main">${C.about.paragraphs.map((t) => `<p>${rich(t)}</p>`).join('')}</div>
        <aside class="m-side">
          <p><span>Now at</span>${esc(identity.company)}, ${esc(identity.companyCity)}</p>
          <p><span>Based in</span>${esc(identity.location)}</p>
          <p><span>Credentials</span>${esc(C.about.credentials)}</p>
          <p><span>Interests</span>${C.about.interests.map(esc).join(', ')}</p>
        </aside>
      </div>`,
  };
}

let modal = null; // { el, opener }
const background = () => [$('#top'), $('#main'), $('#foot')];

function showModal(view, origin) {
  hidePeek(true);
  if (modal) {
    // already open: swap the content in place (e.g. "More projects")
    const box = $('.modal', modal.el);
    $('.m-content', box).innerHTML = view.html;
    box.setAttribute('aria-label', view.label);
    modal.el.scrollTop = 0;
    if (!reduceMotion()) $('.m-content', box).animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    box.focus({ preventScroll: true });
    return;
  }
  const el = document.createElement('div');
  el.className = 'modal-wrap';
  el.setAttribute('data-lenis-prevent', '');
  el.innerHTML = `<div class="scrim"></div>
    <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(view.label)}" tabindex="-1">
      <button class="m-close" type="button" aria-label="Close">${icon('x', 22)}</button>
      <div class="m-content">${view.html}</div>
    </div>`;
  $('#layer').appendChild(el);
  modal = { el, opener: document.activeElement };
  document.body.classList.add('locked');
  stopScroll();
  background().forEach((n) => { n.inert = true; });
  const box = $('.modal', el);
  if (!reduceMotion()) {
    const m = box.getBoundingClientRect();
    const from = origin
      ? `translate(${origin.left + origin.width / 2 - (m.left + m.width / 2)}px, ${origin.top - m.top}px) scale(${Math.max(0.2, origin.width / m.width).toFixed(3)})`
      : 'translateY(40px) scale(0.94)';
    box.style.transformOrigin = 'top center';
    box.animate([{ transform: from, opacity: 0 }, { opacity: 1, offset: 0.4 }, { transform: 'none', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    $('.scrim', el).animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
  }
  box.focus({ preventScroll: true });
}

function hideModal() {
  closeLightbox();
  if (!modal) return;
  const { el, opener } = modal;
  modal = null;
  document.body.classList.remove('locked');
  startScroll();
  background().forEach((n) => { n.inert = false; });
  if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
  if (reduceMotion()) return el.remove();
  el.style.pointerEvents = 'none';
  $('.modal', el).animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(24px) scale(0.96)', opacity: 0 }], { duration: 220, easing: 'ease-in', fill: 'forwards' });
  $('.scrim', el).animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: 'forwards' }).onfinish = () => el.remove();
}

/* ── screenshot viewer: full screen, arrows / swipe / Esc ── */
let lb = null; // { el, item, i, opener }

function findShots(id) {
  return C.projects.find((x) => x.id === id) || C.moreBuilds.find((x) => x.id === id);
}

function showShot(i, dir = 0) {
  const { el, item } = lb;
  const n = item.shots.length;
  lb.i = (i + n) % n;
  const s = item.shots[lb.i];
  const img = $('.lb-img', el);
  img.src = shotUrl(item.id, lb.i);
  img.alt = s.caption;
  img.classList.toggle('phone', isPhone(s));
  $('.lb-cap', el).textContent = s.caption;
  $('.lb-count', el).textContent = `${lb.i + 1} / ${n}`;
  if (dir && !reduceMotion()) {
    img.animate([{ opacity: 0, transform: `translateX(${dir * 40}px) scale(0.98)` }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
  }
  // warm the next and previous images
  [lb.i + 1, lb.i - 1].forEach((k) => { const im = new Image(); im.src = shotUrl(item.id, (k + n) % n); });
}

function openLightbox(id, i, opener) {
  const item = findShots(id);
  if (!item || lb) return;
  const el = document.createElement('div');
  el.className = 'lb';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', `${item.name} screenshots`);
  el.setAttribute('data-lenis-prevent', '');
  el.innerHTML = `
    <figure class="lb-fig"><img class="lb-img" alt="" decoding="async">
      <figcaption><span class="lb-count"></span><span class="lb-cap"></span></figcaption></figure>
    <button class="round lb-prev" type="button" aria-label="Previous screenshot">${icon('chevron-left', 22)}</button>
    <button class="round lb-next" type="button" aria-label="Next screenshot">${icon('chevron-right', 22)}</button>
    <button class="round lb-close" type="button" aria-label="Close screenshots">${icon('x', 20)}</button>`;
  document.body.appendChild(el);
  lb = { el, item, i, opener };
  if (modal) modal.el.inert = true;
  showShot(i);
  $('.lb-close', el).focus({ preventScroll: true });
  if (!reduceMotion() && opener) {
    const r = opener.getBoundingClientRect();
    const img = $('.lb-img', el);
    const go = () => {
      const m = img.getBoundingClientRect();
      if (!m.width) return;
      img.animate([
        { transform: `translate(${r.left + r.width / 2 - (m.left + m.width / 2)}px, ${r.top + r.height / 2 - (m.top + m.height / 2)}px) scale(${(r.width / m.width).toFixed(3)})`, opacity: 0.6 },
        { transform: 'none', opacity: 1 },
      ], { duration: 460, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    };
    if (img.complete && img.naturalWidth) go();
    else img.addEventListener('load', go, { once: true });
    el.animate([{ backgroundColor: 'rgba(0,0,0,0)' }, { backgroundColor: 'rgba(0,0,0,0.92)' }], { duration: 300 });
  }
  el.addEventListener('click', (ev) => {
    if (ev.target.closest('.lb-prev')) return showShot(lb.i - 1, -1);
    if (ev.target.closest('.lb-next')) return showShot(lb.i + 1, 1);
    if (ev.target.closest('.lb-close') || !ev.target.closest('.lb-fig')) closeLightbox();
  });
  let sx = null;
  el.addEventListener('pointerdown', (ev) => { sx = ev.clientX; });
  el.addEventListener('pointerup', (ev) => {
    if (sx === null) return;
    const dx = ev.clientX - sx;
    sx = null;
    if (Math.abs(dx) > 50) showShot(lb.i + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  });
}

function closeLightbox() {
  if (!lb) return;
  const { el, opener } = lb;
  lb = null;
  if (modal) modal.el.inert = false;
  if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
  if (reduceMotion()) {
    el.remove();
    return;
  }
  el.style.pointerEvents = 'none';
  el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }).onfinish = () => el.remove();
}

/* ── routing: #projects/<id> and #about open the dialog, other hashes are page sections ── */
const isModalHash = (h) => /^#((projects|builds)\/.+|about)$/.test(h);

function route(origin) {
  const [a, b] = decodeURIComponent(location.hash.slice(1)).split('/');
  const p = a === 'projects' && b ? C.projects.find((x) => x.id === b) : null;
  if (p) return showModal(projectView(p), origin);
  const bld = a === 'builds' && b ? C.moreBuilds.find((x) => x.id === b && hasShots(x)) : null;
  if (bld) return showModal(buildView(bld), origin);
  if (a === 'about') return showModal(aboutView(), origin);
  hideModal();
}

function openHash(href, originEl) {
  const origin = originEl ? originEl.getBoundingClientRect() : null;
  if (modal) history.replaceState(history.state, '', href);
  else history.pushState({ modal: true }, '', href);
  route(origin);
}

function closeModal() {
  if (!modal) return;
  if (history.state && history.state.modal) history.back();
  else {
    history.replaceState(null, '', location.pathname + location.search);
    route();
  }
}

/* ── spotlight search (Ctrl/⌘ K, or "/") ─────────────────── */
let spot = null;

function spotlightItems() {
  const tile = (g, inner) => `<span class="tile sm" style="background:${g}">${inner}</span>`;
  const grey = 'linear-gradient(160deg,#52525b,#27272a)';
  const go = (hash) => () => {
    if (isModalHash(hash)) return openHash(hash);
    goSection(hash);
  };
  return [
    ...C.projects.map((p) => ({ label: p.name, hint: `Project · ${p.tagline}`, words: p.tools.join(' '), glyph: tile(p.gradient, icon(p.icon, 16)), run: go(`#projects/${p.id}`) })),
    { label: 'About', hint: 'Who I am and how I work', glyph: tile(grey, icon('user', 16)), run: go('#about') },
    ...NAV.map(([id, l]) => ({ label: l, hint: 'Section', glyph: tile(grey, icon('chevron-right', 16)), run: go(`#${id}`) })),
    { label: 'Resume (PDF)', hint: 'Opens in a new tab', glyph: tile(grey, icon('file-text', 16)), run: () => window.open(identity.resume, '_blank', 'noopener') },
    { label: 'Copy email address', hint: identity.email, glyph: tile(grey, icon('copy', 16)), run: () => copyText(identity.email) },
    { label: 'LinkedIn', hint: 'Opens in a new tab', glyph: tile(grey, brand('linkedin', 16)), run: () => window.open(identity.linkedin, '_blank', 'noopener') },
    { label: 'GitHub', hint: 'Opens in a new tab', glyph: tile(grey, brand('github', 16)), run: () => window.open(identity.github, '_blank', 'noopener') },
    { label: 'Classic OS view', hint: 'The phone and desktop style site', glyph: tile(grey, icon('layout-grid', 16)), run: () => { location.href = 'os.html'; } },
    { label: 'Simple view', hint: 'Plain, fast, print-friendly page', glyph: tile(grey, icon('list', 16)), run: () => { location.href = identity.simple; } },
  ];
}

function paintSpotlight() {
  const q = $('input', spot.el).value.trim().toLowerCase();
  spot.shown = spot.items.filter((it) => !q || `${it.label} ${it.hint} ${it.words || ''}`.toLowerCase().includes(q));
  spot.index = Math.min(spot.index, Math.max(0, spot.shown.length - 1));
  const list = $('.spot-list', spot.el);
  list.innerHTML = spot.shown.length
    ? spot.shown.map((it, i) => `<li class="spot-item" id="spot-${i}" role="option" data-i="${i}" aria-selected="${i === spot.index}">
        ${it.glyph}<span class="grow"><span class="t">${esc(it.label)}</span><span class="s">${esc(it.hint)}</span></span><span class="ret" aria-hidden="true">↵</span></li>`).join('')
    : '<li class="spot-empty">No matches. Try “planner”, “SQL” or “resume”.</li>';
  $('input', spot.el).setAttribute('aria-activedescendant', spot.shown.length ? `spot-${spot.index}` : '');
  $('[aria-selected="true"]', list)?.scrollIntoView({ block: 'nearest' });
}

function openSpotlight() {
  if (spot || $('.gate')) return;
  hidePeek(true);
  const el = document.createElement('div');
  el.className = 'spot';
  el.setAttribute('data-lenis-prevent', '');
  el.innerHTML = `
    <div class="spot-box" role="dialog" aria-modal="true" aria-label="Search">
      <label class="spot-field">${icon('search', 20)}
        <input type="text" role="combobox" aria-expanded="true" aria-controls="spot-list" aria-autocomplete="list"
          autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Search projects, sections and actions" aria-label="Search">
        <kbd>esc</kbd></label>
      <ul class="spot-list" id="spot-list" role="listbox" aria-label="Results"></ul>
    </div>`;
  document.body.appendChild(el);
  spot = { el, items: spotlightItems(), shown: [], index: 0, opener: document.activeElement };
  paintSpotlight();
  const input = $('input', el);
  input.focus();
  input.addEventListener('input', () => { spot.index = 0; paintSpotlight(); });
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
      ev.preventDefault();
      const n = spot.shown.length;
      if (n) spot.index = (spot.index + (ev.key === 'ArrowDown' ? 1 : n - 1)) % n;
      paintSpotlight();
    } else if (ev.key === 'Enter') {
      ev.preventDefault();
      runSpotlight(spot.index);
    } else if (ev.key === 'Tab') ev.preventDefault();
  });
  el.addEventListener('pointermove', (ev) => {
    const li = ev.target.closest('.spot-item');
    if (li && +li.dataset.i !== spot.index) {
      $('[aria-selected="true"]', el)?.setAttribute('aria-selected', 'false');
      spot.index = +li.dataset.i;
      li.setAttribute('aria-selected', 'true');
    }
  });
  el.addEventListener('click', (ev) => {
    const li = ev.target.closest('.spot-item');
    if (li) runSpotlight(+li.dataset.i);
    else if (!ev.target.closest('.spot-box')) closeSpotlight(true);
  });
}
function closeSpotlight(refocus) {
  if (!spot) return;
  const { el, opener } = spot;
  spot = null;
  el.classList.add('out');
  setTimeout(() => el.remove(), reduceMotion() ? 0 : 160);
  if (refocus && opener && document.contains(opener)) opener.focus({ preventScroll: true });
}
function runSpotlight(i) {
  const it = spot && spot.shown[i];
  if (!it) return;
  closeSpotlight(false);
  it.run();
}

/* ── profile picker and opening ──────────────────────────── */
function setProfile(id, { rerender = true } = {}) {
  profile = PROFILES.find((p) => p.id === id) || PROFILES[2];
  store.set('pd-profile', profile.id);
  if (rerender) {
    render();
    scrollToTarget(0, { immediate: true });
  }
}

/** Hides the page behind an overlay (intro or picker) and stops scrolling. */
function lockPage() {
  document.body.classList.add('locked');
  background().forEach((n) => { n.inert = true; });
  stopScroll();
}

/** The page is ready to be seen: unlock it and play the hero entrance. */
function reveal() {
  document.body.classList.remove('locked');
  background().forEach((n) => { n.inert = false; });
  startScroll();
  document.body.classList.add('ready');
  heroCounters();
}

function showGate(afterShown) {
  const el = document.createElement('div');
  el.className = 'gate';
  el.setAttribute('data-lenis-prevent', '');
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'gate-t');
  el.innerHTML = `
    <span class="logo" aria-hidden="true">${pMark('logo-mark', 'gl')}<span>PINKESH</span></span>
    <div class="gate-in">
      <h2 id="gate-t">Who’s viewing?</h2>
      <div class="gate-tiles">
        ${PROFILES.map((p, i) => `<button class="gate-btn" type="button" data-pick="${p.id}" style="--i:${i}">
          <span class="tile" style="background:${p.g}">${icon(p.icon, 54, 1.6)}</span><span>${esc(p.label)}</span></button>`).join('')}
      </div>
      <button class="gate-snd" type="button" aria-pressed="${soundOn()}">${icon(soundOn() ? 'volume-2' : 'volume-x', 18)} <span>Sound ${soundOn() ? 'on' : 'off'}</span></button>
    </div>`;
  document.body.appendChild(el);
  lockPage();
  el.tabIndex = -1;
  el.focus({ preventScroll: true });
  afterShown?.();

  el.addEventListener('click', (ev) => {
    const snd = ev.target.closest('.gate-snd');
    if (snd) {
      const on = !soundOn();
      setSound(on);
      snd.setAttribute('aria-pressed', String(on));
      snd.innerHTML = `${icon(on ? 'volume-2' : 'volume-x', 18)} <span>Sound ${on ? 'on' : 'off'}</span>`;
      return;
    }
    const b = ev.target.closest('[data-pick]');
    if (b) enter(b.dataset.pick, el);
  });
  el.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') enter('guest', el);
    if (ev.key === 'Tab') {
      const f = $$('button', el);
      const first = f[0], last = f[f.length - 1];
      if (ev.shiftKey && (document.activeElement === first || document.activeElement === el)) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    }
  });
}

/** Profile chosen: the picked tile zooms toward the viewer and the page comes up behind it. */
function enter(id, gate) {
  if (gate.classList.contains('leaving')) return;
  setProfile(id, { rerender: false });
  render();
  scrollToTarget(0, { immediate: true });
  swoosh();
  if (reduceMotion()) {
    gate.remove();
    reveal();
    return $('#main').focus({ preventScroll: true });
  }
  gate.classList.add('leaving');
  gate.querySelector(`[data-pick="${id}"]`)?.classList.add('chosen');
  setTimeout(() => {
    reveal();
    $('#main').focus({ preventScroll: true });
  }, 520);
  setTimeout(() => gate.remove(), 1100);
}

/* ── global events ───────────────────────────────────────── */
function closeMenu(refocus) {
  const menu = $('#who-menu');
  if (!menu || menu.hidden) return false;
  menu.hidden = true;
  $('#who-btn').setAttribute('aria-expanded', 'false');
  if (refocus) $('#who-btn').focus();
  return true;
}

document.addEventListener('click', (ev) => {
  const t = ev.target;
  const copy = t.closest('[data-copy]');
  if (copy) return copyText(copy.dataset.copy);
  if (t.closest('[data-spotlight]')) return openSpotlight();

  if (t.closest('#snd')) {
    const on = !soundOn();
    setSound(on);
    renderHeader();
    $('#snd').focus();
    if (on) tudum();
    return;
  }
  if (t.closest('#who-btn')) {
    const menu = $('#who-menu');
    menu.hidden = !menu.hidden;
    $('#who-btn').setAttribute('aria-expanded', String(!menu.hidden));
    return;
  }
  const pick = t.closest('[data-profile]');
  if (pick) return setProfile(pick.dataset.profile);
  if (!t.closest('#who-menu')) closeMenu(false);

  const arrow = t.closest('.arrow');
  if (arrow) {
    const tr = $('.track', arrow.parentElement);
    return tr.scrollBy({ left: +arrow.dataset.dir * tr.clientWidth * 0.85, behavior: reduceMotion() ? 'auto' : 'smooth' });
  }

  const shot = t.closest('[data-shot]');
  if (shot) return openLightbox(shot.dataset.of, +shot.dataset.shot, shot);

  if (t.closest('.m-close') || t.classList.contains('scrim') || t.classList.contains('modal-wrap')) return closeModal();

  const a = t.closest('a[href]');
  if (!a || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button) return;
  const href = a.getAttribute('href');
  if (a.hasAttribute('data-home')) {
    ev.preventDefault();
    history.replaceState(null, '', location.pathname + location.search);
    return scrollToTarget(0);
  }
  if (!href.startsWith('#')) return;
  ev.preventDefault();
  if (isModalHash(href)) return openHash(href, a.closest('.card, .peek, .callouts') || null);
  goSection(href);
});

/** Smooth-scrolls to a page section, closing the dialog first if one is open. */
function goSection(hash) {
  if (modal) {
    history.replaceState(null, '', location.pathname + location.search);
    route();
  }
  history.replaceState(history.state, '', hash);
  setTimeout(() => scrollToTarget(hash), modal ? 260 : 0);
}

document.addEventListener('keydown', (ev) => {
  if ($('.gate') || $('.opening')) return;
  if (lb) {
    if (ev.key === 'Escape') { ev.preventDefault(); closeLightbox(); }
    else if (ev.key === 'ArrowRight') { ev.preventDefault(); showShot(lb.i + 1, 1); }
    else if (ev.key === 'ArrowLeft') { ev.preventDefault(); showShot(lb.i - 1, -1); }
    else if (ev.key === 'Tab') {
      const f = $$('button', lb.el);
      const k = f.indexOf(document.activeElement);
      ev.preventDefault();
      f[(k + (ev.shiftKey ? f.length - 1 : 1)) % f.length].focus();
    }
    return;
  }
  if ((ev.key === 'k' || ev.key === 'K') && (ev.metaKey || ev.ctrlKey)) {
    ev.preventDefault();
    return spot ? closeSpotlight(true) : openSpotlight();
  }
  if (spot) {
    if (ev.key === 'Escape') { ev.preventDefault(); closeSpotlight(true); }
    return;
  }
  if (ev.key === '/' && !ev.target.closest('input, textarea')) {
    ev.preventDefault();
    return openSpotlight();
  }
  if (ev.key === 'Escape') {
    if (closeMenu(true)) return;
    if (modal) { ev.preventDefault(); closeModal(); }
    return;
  }
  if (modal && ev.key === 'Tab') {
    const box = $('.modal', modal.el);
    const f = $$('a[href], button', box).filter((n) => n.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (ev.shiftKey && (document.activeElement === first || document.activeElement === box)) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
  }
});

addEventListener('popstate', () => route());
addEventListener('hashchange', () => route());


/* ── boot ────────────────────────────────────────────────── */
// Fresh visit: red P intro (with sound) → "Who's viewing?" → hero.
// Same session, or a link straight to a section or project: no intro, no picker.
$('#main').tabIndex = -1;
initMotion();
render();
wirePeek();

const deepLink = !!location.hash;
if (deepLink || store.get('pd-intro')) {
  if (!profile && !deepLink) showGate();
  else {
    if (!profile) setProfile('guest', { rerender: false });
    reveal();
    route();
    if (location.hash && !isModalHash(location.hash)) {
      const go = () => scrollToTarget(location.hash, { immediate: true });
      requestAnimationFrame(go);
      document.fonts?.ready.then(go);
    }
  }
} else {
  lockPage();
  playIntro().then((clearIntro) => {
    store.set('pd-intro', '1');
    if (profile) {
      clearIntro();
      reveal();
    } else showGate(clearIntro);
  });
}
