import * as C from './content.js';
import { ICONS, BRAND } from './icons.js';

const { identity } = C;
const $ = (sel, root = document) => root.querySelector(sel);
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const mqDesktop = matchMedia('(min-width: 1024px)');
const isDesktop = () => mqDesktop.matches;

/* ── helpers ─────────────────────────────────────────────── */
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
/** Escapes text, then turns **bold** into <strong>. */
const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const plain = (s) => String(s).replace(/\*\*/g, '');

function icon(name, size = 24, extra = '') {
  const inner = ICONS[name];
  if (!inner) return '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${inner}</svg>`;
}
function brand(name, size = 28) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${BRAND[name]}</svg>`;
}
const glyph = (a, size) => (a.brand ? brand(a.brand, size) : icon(a.icon, size));

function picture(src, alt, cls = '', attrs = '') {
  return `<picture><source srcset="${src.webp}" type="image/webp"><img class="${cls}" src="${src.jpg}" alt="${esc(alt)}" ${attrs}></picture>`;
}
const ext = 'target="_blank" rel="noopener noreferrer"';

/* ── clock (IST): status bar h:mm on phones, date + time in the desktop menu bar ── */
const clockFmt = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true,
});
const dateFmt = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short',
});
function paintClock() {
  const now = new Date();
  const p = Object.fromEntries(clockFmt.formatToParts(now).map((x) => [x.type, x.value]));
  $('#sb-time').textContent = `${p.hour}:${p.minute}`;
  const mb = $('#mb-time');
  if (mb) mb.textContent = `${dateFmt.format(now).replace(',', '')}  ${p.hour}:${p.minute} ${String(p.dayPeriod || '').toUpperCase()}`;
}
function tickClock() {
  paintClock();
  setTimeout(tickClock, 60000 - (Date.now() % 60000) + 50);
}

/* ── toast ───────────────────────────────────────────────── */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

/* ── home screen ─────────────────────────────────────────── */
function squircle(a, size = 30) {
  return `<span class="squircle" style="background:${a.gradient}">${glyph(a, size)}</span>`;
}

function profileWidget(avatarPx) {
  return `
    <section class="profile glass" aria-label="Profile">
      <button class="more-btn" id="more-btn" type="button" aria-label="More options" aria-haspopup="true" aria-expanded="false">${icon('more-horizontal', 20)}</button>
      <div class="more-menu glass" id="more-menu" hidden>
        <a href="${identity.simple}">${icon('list', 16)} Simple view</a>
      </div>
      <div class="profile-top">
        <div class="avatar-wrap">
          ${picture(identity.avatar, 'Pinkesh Darji', '', `width="${avatarPx}" height="${avatarPx}" fetchpriority="high"`)}
          <span class="avail-dot" aria-hidden="true"></span>
        </div>
        <div>
          <h1>${esc(identity.name)}</h1>
          <p class="role">${esc(identity.title)}</p>
          <p class="co">${esc(identity.company)} · ${esc(identity.companyCity)}</p>
        </div>
      </div>
      <span class="pill">${esc(identity.status)}</span>
      <div class="btn-row">
        <a class="wbtn primary" href="${identity.resume}" ${ext}>${icon('file-text', 18)} Resume</a>
        <a class="wbtn secondary" href="#contact" data-nav="contact">${icon('mail', 18)} Contact</a>
      </div>
    </section>`;
}

function smallWidgets() {
  const now = C.now;
  return `
    <div class="widgets">
      <section class="widget glass" aria-label="Now">
        <h2>Now</h2>
        <p>${esc(now.text)}</p>
        <a class="wlink" href="#projects/${now.projectId}" data-nav="projects/${now.projectId}">${esc(now.linkLabel)} →</a>
      </section>
      <section class="widget glass" aria-label="Skills">
        <h2>Skills</h2>
        <ul>${C.skillsWidget.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      </section>
    </div>`;
}

function renderMenubar() {
  const mb = $('#menubar');
  mb.innerHTML = `
    <a class="mb-brand" href="#about" data-nav="about">${picture(identity.avatar, 'Pinkesh Darji', '', 'width="20" height="20"')}<strong>${esc(identity.name)}</strong></a>
    <nav class="mb-menus" aria-label="Menu">
      ${['about', 'experience', 'projects', 'contact'].map((id) => `<a href="#${id}" data-nav="${id}">${id[0].toUpperCase() + id.slice(1)}</a>`).join('')}
    </nav>
    <span class="mb-spacer"></span>
    <a class="mb-simple" href="${identity.simple}">Simple view</a>
    <span class="mb-time" id="mb-time"></span>`;
}

function renderHome() {
  const desktop = isDesktop();
  $('#menubar').hidden = !desktop;

  if (desktop) {
    renderMenubar();
    $('#home-scroll').innerHTML = `${profileWidget(84)}${smallWidgets()}`;
    $('#dock').className = 'dock glass';
    $('#dock').setAttribute('aria-label', 'Apps');
    $('#dock').innerHTML = C.apps
      .map((a) => {
        const inner = `${squircle(a, 28)}<span class="tip" aria-hidden="true">${esc(a.label)}</span>`;
        return a.type === 'app'
          ? `<a class="dock-item" href="#${a.id}" data-nav="${a.id}" data-app="${a.id}" aria-label="${esc(a.label)}">${inner}</a>`
          : `<a class="dock-item" href="${a.href}" ${ext} data-app="${a.id}" aria-label="${esc(a.label)} (opens in a new tab)">${inner}</a>`;
      })
      .join('');
    return;
  }

  $('#home-scroll').innerHTML = `
    ${profileWidget(68)}
    ${smallWidgets()}
    <nav class="grid" aria-label="Apps">
      ${C.apps
        .map((a) =>
          a.type === 'app'
            ? `<a class="icon-btn" href="#${a.id}" data-nav="${a.id}" data-app="${a.id}">${squircle(a)}<span class="lbl">${esc(a.label)}</span></a>`
            : `<a class="icon-btn" href="${a.href}" ${ext} data-app="${a.id}">${squircle(a)}<span class="lbl">${esc(a.label)}</span></a>`,
        )
        .join('')}
    </nav>`;

  $('#dock').className = 'dock glass';
  $('#dock').setAttribute('aria-label', 'Quick contact');
  $('#dock').innerHTML = C.dock
    .map(
      (d) =>
        `<a class="icon-btn" style="width:60px" href="${d.href}" ${d.external ? ext : ''} aria-label="${esc(d.label)}"><span class="squircle" style="background:${d.gradient}">${glyph(d, 30)}</span></a>`,
    )
    .join('');
}

/* ── app screens ─────────────────────────────────────────── */
const group = (inner) => `<div class="group">${inner}</div>`;
const groupTitle = (t) => `<h2 class="group-title">${esc(t)}</h2>`;

function linkRow({ icon: ic, brand: br, gradient, title, sub, href, external }) {
  const g = br ? brand(br, 18) : icon(ic, 18);
  return `<a class="row" href="${href}" ${external ? ext : ''}>
    <span class="mini sm" style="background:${gradient}">${g}</span>
    <span class="grow"><span class="t">${esc(title)}</span>${sub ? `<div class="s">${esc(sub)}</div>` : ''}</span>
    <span class="chev">${icon(external ? 'arrow-up-right' : 'chevron-right', 18)}</span>
  </a>`;
}

const screens = {
  about: () => ({
    title: 'About',
    html: `
      <div class="hero-photo-wrap">${picture(identity.portrait, 'Portrait of Pinkesh Darji', 'hero-photo', 'width="1200" height="1200" loading="lazy"')}</div>
      <div class="who"><h2>${esc(identity.name)}</h2><p>${esc(identity.title)}</p></div>
      ${groupTitle('Hello')}
      ${group(`<div class="pad">${C.about.paragraphs.map((p) => `<p class="body-text">${rich(p)}</p>`).join('')}
        <p class="body-text muted">${esc(C.about.credentials)}</p></div>`)}
      ${groupTitle('Interests')}
      ${group(`<div class="pad chips">${C.about.interests.map((i) => `<span class="chip">${esc(i)}</span>`).join('')}</div>`)}
      ${groupTitle('More')}
      ${group(linkRow({ icon: 'list', gradient: 'linear-gradient(160deg,#94a3b8,#334155)', title: 'Simple view', sub: 'Plain, fast, print-friendly page', href: identity.simple }))}`,
  }),

  experience: () => ({
    title: 'Experience',
    html: C.experience
      .map(
        (e) => `${group(`<div class="pad">
          <h2 class="role-title">${esc(e.role)}</h2>
          <p class="role-meta">${esc(e.company)} · ${esc(e.period)}</p>
          <p class="role-blurb">${esc(e.blurb)}</p>
          <ul class="bullets">${e.bullets.map((b) => `<li>${rich(b)}</li>`).join('')}</ul>
        </div>`)}`,
      )
      .join(''),
  }),

  projects: (sub) => {
    if (sub) return projectDetail(sub);
    const featured = C.projects.filter((p) => p.featured);
    const other = C.projects.filter((p) => !p.featured);
    return {
      title: 'Projects',
      html: `
        ${groupTitle('Featured')}
        ${featured
          .map(
            (p) => `<a class="feature" href="#projects/${p.id}" data-nav="projects/${p.id}">
              <div class="cover" style="background:${p.gradient}">${icon(p.icon, 54)}<span class="tag">${esc(p.status)}</span></div>
              <div class="fb"><h3>${esc(p.name)}</h3><p>${esc(p.tagline)}</p></div>
            </a>`,
          )
          .join('')}
        ${groupTitle('Other projects')}
        ${group(
          other
            .map(
              (p) => `<a class="row" href="#projects/${p.id}" data-nav="projects/${p.id}">
                <span class="mini" style="background:${p.gradient}">${icon(p.icon, 22)}</span>
                <span class="grow"><span class="t">${esc(p.name)}</span><div class="s">${esc(p.tagline)}</div></span>
                <span class="chev">${icon('chevron-right', 18)}</span>
              </a>`,
            )
            .join(''),
        )}
        ${groupTitle('More builds')}
        <div class="chips">${C.moreBuilds
          .map((b) => `<a class="chip" href="${b.href}" ${ext}>${esc(b.name)}${b.note ? ` <span class="muted small">${esc(b.note)}</span>` : ''} ${icon('arrow-up-right', 14)}</a>`)
          .join('')}</div>`,
    };
  },

  skills: () => ({
    title: 'Skills',
    html: C.skills
      .map((g) => `${groupTitle(g.group)}${group(g.items.map((i) => `<div class="row"><span class="t">${esc(i)}</span></div>`).join(''))}`)
      .join(''),
  }),

  education: () => {
    const e = C.education;
    return {
      title: 'Education',
      html: `${groupTitle('Degrees')}${group(
        e.degrees
          .map(
            (d) => `<div class="row"><span class="grow"><span class="t"><strong>${esc(d.name)}</strong></span>
              <div class="s">${esc(d.school)}</div><div class="s">${esc(d.years)} · ${esc(d.cgpa)}</div></span></div>`,
          )
          .join(''),
      )}
      ${groupTitle('Certification')}
      ${group(linkRow({ icon: 'award', gradient: 'linear-gradient(160deg,#fbbf24,#ea580c)', title: e.certification.name, sub: 'View certificate', href: e.certification.href, external: true }))}`,
    };
  },

  contact: () => ({
    title: 'Contact',
    html: `
      <div class="card-top">
        ${picture(identity.avatar, 'Pinkesh Darji', '', 'width="112" height="112"')}
        <h2>${esc(identity.name)}</h2><p>${esc(identity.title)}</p>
      </div>
      <button class="copy-btn" type="button" data-copy="${esc(identity.email)}">${icon('copy', 20)} Copy email</button>
      ${groupTitle('Reach me')}
      ${group(
        linkRow({ icon: 'mail', gradient: 'linear-gradient(160deg,#38bdf8,#2563eb)', title: 'Email', sub: identity.email, href: `mailto:${identity.email}` }) +
          linkRow({ icon: 'phone', gradient: 'linear-gradient(160deg,#4ade80,#16a34a)', title: 'Phone', sub: identity.phone, href: identity.phoneHref }) +
          linkRow({ brand: 'linkedin', gradient: 'linear-gradient(160deg,#38a3f5,#0a66c2)', title: 'LinkedIn', sub: 'linkedin.com/in/pinkesh29', href: identity.linkedin, external: true }) +
          linkRow({ brand: 'github', gradient: 'linear-gradient(160deg,#3f3f46,#18181b)', title: 'GitHub', sub: 'github.com/Pinkesh2905', href: identity.github, external: true }) +
          `<div class="row"><span class="mini sm" style="background:linear-gradient(160deg,#fb7185,#e11d48)">${icon('map-pin', 18)}</span><span class="grow"><span class="t">Location</span><div class="s">${esc(identity.location)}</div></span></div>` +
          linkRow({ icon: 'file-text', gradient: 'linear-gradient(160deg,#94a3b8,#334155)', title: 'Resume', sub: 'PDF', href: identity.resume, external: true }),
      )}`,
  }),

  terminal: () => ({ title: 'Terminal', html: '<div id="term-host"></div>', terminal: true }),
};

function projectDetail(id) {
  const p = C.projects.find((x) => x.id === id);
  if (!p) return { title: 'Projects', html: '<p class="body-text">Project not found.</p>', back: 'Home', backTo: '' };
  const section = (title, text) => (text ? `${groupTitle(title)}${group(`<div class="pad"><p class="body-text">${esc(text)}</p></div>`)}` : '');
  const tools = [...p.tools, ...(p.builtWithClaudeCode ? ['Built with Claude Code'] : [])];
  return {
    title: p.name,
    back: 'Projects',
    backTo: 'projects',
    largeTitle: false,
    html: `
      <div class="detail-head"><span class="mini" style="background:${p.gradient}">${icon(p.icon, 28)}</span>
        <div><h2>${esc(p.name)}</h2><p>${esc(p.status)}</p></div></div>
      ${p.id === 'vezapp-planner' && !p.shots.length ? `<div class="shots-note" style="margin-top:14px">${icon('layers', 26)}<strong>Screenshots on request</strong><span>Company product, so no public demo.</span></div>` : ''}
      ${section('Problem', p.problem)}
      ${section('What I did', p.did)}
      ${section('Result', p.result)}
      ${section('About', p.summary)}
      ${tools.length ? `${groupTitle('Tools')}<div class="chips">${tools.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : ''}
      ${p.links.length ? `<div class="linkbtns">${p.links.map((l, i) => `<a class="linkbtn ${i ? 'alt' : ''}" href="${l.href}" ${ext}>${esc(l.label)} ${icon('arrow-up-right', 18)}</a>`).join('')}</div>` : ''}`,
  };
}

/* ── terminal ────────────────────────────────────────────── */
const TERM_COMMANDS = ['help', 'about', 'experience', 'projects', 'skills', 'contact', 'resume', 'clear'];

function termRun(cmd) {
  const e = identity;
  const bullets = (arr) => arr.map((b) => `  • ${plain(b)}`).join('\n');
  switch (cmd) {
    case 'help':
      return `Commands: ${TERM_COMMANDS.join(', ')}`;
    case 'about':
      return `${e.name} — ${e.title}\n\n${e.oneLiner}\n\n${C.about.paragraphs.map(plain).join('\n\n')}\n\n${C.about.credentials}`;
    case 'experience':
      return C.experience.map((x) => `${x.role}\n${x.company} · ${x.period}\n${x.blurb}\n${bullets(x.bullets)}`).join('\n\n');
    case 'projects':
      return C.projects.map((p) => `• ${p.name} — ${p.tagline}`).join('\n') + `\n\nMore builds: ${C.moreBuilds.map((b) => b.name).join(', ')}`;
    case 'skills':
      return C.skills.map((g) => `${g.group}: ${g.items.join(', ')}`).join('\n');
    case 'contact':
      return `Email:    ${e.email}\nPhone:    ${e.phone}\nLinkedIn: ${e.linkedin}\nGitHub:   ${e.github}\nLocation: ${e.location}`;
    case 'resume':
      window.open(e.resume, '_blank', 'noopener');
      return 'Opening resume (PDF)…';
    default:
      return `command not found: ${cmd}. Try "help".`;
  }
}

function mountTerminal(host) {
  host.innerHTML = `<div class="term-out" id="term-out" aria-live="polite"></div>
    <form class="term-form" id="term-form" autocomplete="off"><span class="ps" aria-hidden="true">$</span>
      <input id="term-in" type="text" inputmode="text" autocapitalize="none" autocorrect="off" spellcheck="false" aria-label="Terminal command" placeholder="type help"></form>
    <div class="term-chips">${TERM_COMMANDS.map((c) => `<button type="button" data-cmd="${c}">${c}</button>`).join('')}</div>`;
  const out = $('#term-out', host);
  const input = $('#term-in', host);
  const print = (text, cls = '') => {
    const d = document.createElement('div');
    d.className = `ln ${cls}`;
    d.textContent = text;
    out.appendChild(d);
  };
  print('PinkeshOS 1.0', 'hd');
  print('Type "help" or tap a command below.', 'dim');
  const run = (raw) => {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;
    print(`$ ${cmd}`, 'cmd');
    if (cmd === 'clear') out.innerHTML = '';
    else print(termRun(cmd));
    host.closest('.app-scroll').scrollTo({ top: 1e6 });
  };
  $('#term-form', host).addEventListener('submit', (ev) => {
    ev.preventDefault();
    run(input.value);
    input.value = '';
  });
  host.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-cmd]');
    if (b) run(b.dataset.cmd);
  });
}

/* ── router + app shells ─────────────────────────────────── */
// Phone/tablet: one app at a time (full-screen / centered sheet). Desktop: draggable windows.
const VALID = ['about', 'experience', 'projects', 'skills', 'education', 'contact', 'terminal'];
let current = null; // phone/tablet: { id, el, sub, trigger, closing }
const wins = new Map(); // desktop: id -> { id, el, sub, minimized, z }
let frontId = null;
let zTop = 100;
let cascade = 0;
let navIndex = 0;
let pendingTrigger = null;
const MENU_H = 28;

const parseHash = () => {
  const [id, sub] = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/');
  return VALID.includes(id) ? { id, sub: sub || '' } : { id: '', sub: '' };
};
const pathOf = (a) => a.id + (a.sub ? `/${a.sub}` : '');
const setHash = (path) =>
  history.replaceState(history.state, '', path ? `#${path}` : location.pathname + location.search);

function navigate(path, trigger) {
  if (location.hash === `#${path}`) {
    pendingTrigger = trigger || null;
    route(true);
    return;
  }
  const from = location.hash.replace(/^#\/?/, '');
  pendingTrigger = trigger || null;
  history.pushState({ idx: ++navIndex, from }, '', `#${path}`);
  route(true);
}

const activeApp = () => (isDesktop() ? (frontId && wins.get(frontId)) || null : current);

/** Back = browser back when we pushed the previous screen ourselves, otherwise replace in place. */
function goBack() {
  const a = activeApp();
  if (!a) return;
  if (!a.sub && isDesktop()) return closeWindow(a.id, true);
  const target = a.sub ? 'projects' : '';
  const st = history.state || {};
  if (st.idx > 0 && st.from === target) history.back();
  else {
    history.replaceState({ idx: st.idx || 0, from: st.from }, '', target ? `#${target}` : location.pathname + location.search);
    route(true);
  }
}

function applyScreen(app, view) {
  const scroller = $('.app-scroll', app);
  $('.nav-title', app).textContent = view.title;
  $('.back-label', app).textContent = view.back || 'Home';
  const showLarge = view.largeTitle !== false;
  scroller.innerHTML = `${showLarge ? `<h1 class="large-title" id="app-title">${esc(view.title)}</h1>` : ''}<div class="app-body">${view.html}</div>`;
  app.setAttribute('aria-label', view.title);
  app.classList.toggle('term', !!view.terminal);
  app.classList.toggle('compact', !showLarge);
  app.classList.toggle('has-back', !!view.back);
  scroller.scrollTop = 0;
  app.classList.remove('scrolled');
  if (view.terminal) mountTerminal($('#term-host', scroller));
  syncTermBar();
}
/** Terminal is dark in both schemes, so the phone status bar must stay white over it. */
function syncTermBar() {
  const front = activeApp();
  document.body.classList.toggle('term-open', !isDesktop() && !!front && front.el.classList.contains('term'));
}

function shell(id, sub, kind) {
  const el = document.createElement('div');
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', kind === 'win' ? 'false' : 'true');
  el.tabIndex = -1;
  if (kind === 'win') {
    el.className = 'win';
    el.innerHTML = `
      <div class="titlebar">
        <div class="lights">
          <button class="tl tl-close" type="button" aria-label="Close window"></button>
          <button class="tl tl-min" type="button" aria-label="Minimise window"></button>
          <button class="tl tl-zoom" type="button" aria-label="Zoom window"></button>
        </div>
        <button class="back" type="button" aria-label="Back">${icon('chevron-left', 18)}<span class="back-label">Home</span></button>
        <span class="nav-title"></span>
      </div>
      <div class="app-scroll"></div>`;
  } else {
    el.className = 'app';
    el.innerHTML = `
      <div class="app-nav">
        <button class="back" type="button" aria-label="Back">${icon('chevron-left', 26)}<span class="back-label">Home</span></button>
        <span class="nav-title" aria-hidden="true"></span><span></span>
      </div>
      <div class="app-scroll"></div>`;
  }
  applyScreen(el, screens[id](sub));
  const scroller = $('.app-scroll', el);
  scroller.addEventListener('scroll', () => el.classList.toggle('scrolled', scroller.scrollTop > 36), { passive: true });
  $('.back', el).addEventListener('click', goBack);
  return el;
}

function attachSwipe(el) {
  const scroller = $('.app-scroll', el);
  let start = null;
  el.addEventListener('touchstart', (ev) => {
    const t = ev.touches[0];
    const topZone = t.clientY < el.getBoundingClientRect().top + 130;
    start = topZone && scroller.scrollTop <= 0 ? { x: t.clientX, y: t.clientY } : null;
  }, { passive: true });
  el.addEventListener('touchend', (ev) => {
    if (!start) return;
    const t = ev.changedTouches[0];
    const dy = t.clientY - start.y, dx = Math.abs(t.clientX - start.x);
    start = null;
    if (dy > 90 && dx < 60) goBack();
  }, { passive: true });
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
  toast('Copied');
}

const iconFor = (id) => document.querySelector(`[data-app="${id}"]`);
const originOf = (el, trigger) => {
  const r = trigger.getBoundingClientRect();
  const b = el.getBoundingClientRect();
  return `${r.left + r.width / 2 - b.left}px ${r.top + r.height / 2 - b.top}px`;
};

/* phone / tablet ------------------------------------------- */
function openApp(id, sub, animate) {
  const el = shell(id, sub, 'app');
  attachSwipe(el);
  const trigger = pendingTrigger || iconFor(id);
  pendingTrigger = null;
  $('#app-layer').appendChild(el);
  current = { id, el, sub, trigger, closing: false };
  document.body.classList.add('app-open');
  syncTermBar();
  $('#home').inert = true;
  $('#dock').inert = true;

  if (animate && !reduceMotion() && trigger) {
    el.style.transformOrigin = originOf(el, trigger);
    el.animate(
      [{ transform: 'scale(0.14)', opacity: 0, borderRadius: '30px' }, { transform: 'scale(1)', opacity: 1, borderRadius: getComputedStyle(el).borderRadius }],
      { duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );
  } else if (animate) {
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160 });
  }
  el.focus({ preventScroll: true });
}

function closeApp(animate) {
  if (!current || current.closing) return;
  const { el, id, trigger } = current;
  current.closing = true;
  document.body.classList.remove('app-open', 'term-open');
  $('#home').inert = false;
  $('#dock').inert = false;
  const finish = () => {
    el.remove();
    if (current && current.el === el) current = null;
    const back = trigger && document.contains(trigger) ? trigger : iconFor(id);
    if (back) back.focus({ preventScroll: true });
  };
  if (animate && !reduceMotion() && trigger && document.contains(trigger)) {
    el.style.transformOrigin = originOf(el, trigger);
    el.animate(
      [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0.14)', opacity: 0 }],
      { duration: 260, easing: 'cubic-bezier(0.4, 0, 0.8, 0.4)', fill: 'forwards' },
    ).onfinish = finish;
  } else if (animate) {
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: 'forwards' }).onfinish = finish;
  } else finish();
}

function phoneRoute(animate) {
  const { id, sub } = parseHash();
  if (!id) return closeApp(animate);
  if (current && !current.closing && current.id === id) {
    if (current.sub !== sub) {
      current.sub = sub;
      applyScreen(current.el, screens[id](sub));
    }
    return;
  }
  if (current) {
    current.el.remove();
    current = null;
  }
  openApp(id, sub, animate);
}

/* desktop windows ------------------------------------------ */
function dockDot(id, open) {
  const d = document.querySelector(`.dock [data-app="${id}"]`);
  if (d) d.classList.toggle('open', open);
}

function focusWindow(id) {
  const w = wins.get(id);
  if (!w) return;
  w.z = ++zTop;
  w.el.style.zIndex = w.z;
  frontId = id;
  wins.forEach((x) => x.el.classList.toggle('focused', x === w));
}

function enableDrag(w) {
  const bar = $('.titlebar', w.el);
  let d = null;
  bar.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button') || w.el.classList.contains('maxed')) return;
    d = { x: e.clientX - w.el.offsetLeft, y: e.clientY - w.el.offsetTop };
    bar.setPointerCapture(e.pointerId);
  });
  bar.addEventListener('pointermove', (e) => {
    if (!d) return;
    const left = Math.min(Math.max(e.clientX - d.x, 120 - w.el.offsetWidth), innerWidth - 120);
    const top = Math.min(Math.max(e.clientY - d.y, MENU_H), innerHeight - 60);
    w.el.style.left = `${left}px`;
    w.el.style.top = `${top}px`;
  });
  const end = () => { d = null; };
  bar.addEventListener('pointerup', end);
  bar.addEventListener('pointercancel', end);
  bar.addEventListener('dblclick', (e) => { if (!e.target.closest('button')) w.el.classList.toggle('maxed'); });
}

function openWindow(id, sub, animate) {
  const el = shell(id, sub, 'win');
  const w = { id, el, sub, minimized: false, z: 0 };
  const W = Math.min(880, innerWidth - 120);
  const H = Math.min(660, innerHeight - MENU_H - 120);
  const off = (cascade++ % 5) * 26;
  el.style.width = `${W}px`;
  el.style.height = `${H}px`;
  el.style.left = `${Math.round((innerWidth - W) / 2 + off)}px`;
  el.style.top = `${Math.round(MENU_H + Math.max(14, (innerHeight - MENU_H - 110 - H) / 2) + off)}px`;
  wins.set(id, w);
  $('#app-layer').appendChild(el);
  dockDot(id, true);
  focusWindow(id);
  enableDrag(w);

  el.addEventListener('pointerdown', () => {
    if (frontId !== id) { focusWindow(id); setHash(pathOf(w)); }
  });
  $('.tl-close', el).addEventListener('click', () => closeWindow(id, true));
  $('.tl-min', el).addEventListener('click', () => minimizeWindow(id));
  $('.tl-zoom', el).addEventListener('click', () => el.classList.toggle('maxed'));

  const trigger = pendingTrigger && document.contains(pendingTrigger) ? pendingTrigger : iconFor(id);
  pendingTrigger = null;
  if (animate && !reduceMotion() && trigger) {
    el.style.transformOrigin = originOf(el, trigger);
    el.animate([{ transform: 'scale(0.5)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 240, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
  } else if (animate) {
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140 });
  }
  el.focus({ preventScroll: true });
}

function minimizeWindow(id) {
  const w = wins.get(id);
  if (!w) return;
  w.minimized = true;
  w.el.classList.add('minimized');
  w.el.classList.remove('focused');
  if (frontId === id) {
    frontId = null;
    const next = [...wins.values()].filter((x) => !x.minimized).sort((a, b) => b.z - a.z)[0];
    if (next) { focusWindow(next.id); setHash(pathOf(next)); } else setHash('');
  }
}

function closeWindow(id, userAction, syncHash = true) {
  const w = wins.get(id);
  if (!w) return;
  wins.delete(id);
  dockDot(id, false);
  const remove = () => w.el.remove();
  if (userAction && !reduceMotion()) {
    w.el.style.pointerEvents = 'none';
    w.el.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.94)' }], { duration: 140, fill: 'forwards' }).onfinish = remove;
  } else remove();
  if (frontId === id) {
    frontId = null;
    if (syncHash) {
      const next = [...wins.values()].filter((x) => !x.minimized).sort((a, b) => b.z - a.z)[0];
      if (next) { focusWindow(next.id); setHash(pathOf(next)); next.el.focus({ preventScroll: true }); }
      else setHash('');
    }
    if (userAction) iconFor(id)?.focus({ preventScroll: true });
  }
}

function desktopRoute(animate) {
  const { id, sub } = parseHash();
  if (!id) {
    [...wins.keys()].forEach((k) => closeWindow(k, false, false));
    return;
  }
  const w = wins.get(id);
  if (!w) return openWindow(id, sub, animate);
  if (w.minimized) {
    w.minimized = false;
    w.el.classList.remove('minimized');
  }
  if (w.sub !== sub) {
    w.sub = sub;
    applyScreen(w.el, screens[id](sub));
  }
  focusWindow(id);
  w.el.focus({ preventScroll: true });
}

function route(animate) {
  if (isDesktop()) desktopRoute(animate);
  else phoneRoute(animate);
}

/** Drop every open app/window (used when the layout mode changes). */
function teardown() {
  current = null;
  wins.clear();
  frontId = null;
  $('#app-layer').innerHTML = '';
  document.body.classList.remove('app-open', 'term-open');
  $('#home').inert = false;
  $('#dock').inert = false;
}

/* ── global events ───────────────────────────────────────── */
document.addEventListener('click', (ev) => {
  const copy = ev.target.closest('[data-copy]');
  if (copy) return copyText(copy.dataset.copy);

  const more = ev.target.closest('#more-btn');
  const menu = $('#more-menu');
  if (menu) {
    if (more) {
      const open = menu.hidden;
      menu.hidden = !open;
      more.setAttribute('aria-expanded', String(open));
      return;
    }
    if (!menu.hidden && !ev.target.closest('#more-menu')) {
      menu.hidden = true;
      $('#more-btn').setAttribute('aria-expanded', 'false');
    }
  }

  const a = ev.target.closest('a[data-nav], a.row[href^="#"], a.feature[href^="#"]');
  if (!a || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button) return;
  const path = a.dataset.nav || a.getAttribute('href').slice(1);
  ev.preventDefault();
  navigate(path, a.closest('.home, .dock') ? a : null);
});

document.addEventListener('keydown', (ev) => {
  const menu = $('#more-menu');
  if (ev.key === 'Escape' && menu && !menu.hidden) {
    menu.hidden = true;
    $('#more-btn').setAttribute('aria-expanded', 'false');
    $('#more-btn').focus();
    return;
  }
  if (isDesktop()) {
    if (ev.key === 'Escape' && frontId) {
      ev.preventDefault();
      closeWindow(frontId, true);
    }
    return;
  }
  if (!current) return;
  if (ev.key === 'Escape') {
    ev.preventDefault();
    goBack();
  } else if (ev.key === 'Tab') {
    const f = [...current.el.querySelectorAll('a[href], button, input, [tabindex]:not([tabindex="-1"])')].filter((n) => !n.disabled && n.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (ev.shiftKey && (document.activeElement === first || document.activeElement === current.el)) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
  }
});

addEventListener('popstate', (ev) => {
  navIndex = (ev.state && ev.state.idx) || 0;
  route(true);
});

/* dock magnification (desktop, mouse only) */
function wireDock() {
  const dock = $('#dock');
  const items = () => [...dock.querySelectorAll('.dock-item')];
  dock.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || reduceMotion()) return;
    items().forEach((it) => {
      const r = it.getBoundingClientRect();
      const d = Math.abs(e.clientX - (r.left + r.width / 2));
      const k = Math.max(0, 1 - d / 120);
      it.style.setProperty('--s', (1 + 0.55 * k * k).toFixed(3));
    });
  });
  dock.addEventListener('pointerleave', () => items().forEach((it) => it.style.removeProperty('--s')));
}

/* ── boot (no splash screen: content renders immediately) ── */
let clockStarted = false;
function mount() {
  teardown();
  renderHome();
  if (isDesktop()) wireDock();
  if (!clockStarted) { clockStarted = true; tickClock(); } else paintClock();
  route(false);
}
history.replaceState({ idx: 0 }, '');
mount();
mqDesktop.addEventListener('change', mount);
