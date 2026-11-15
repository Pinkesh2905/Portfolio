import * as C from './content.js';
import { ICONS, BRAND } from './icons.js';
import { startWallpaper } from './wallpaper.js';

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
    <section class="profile glass" data-glow aria-label="Profile">
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
      <section class="widget glass" data-glow aria-label="Now">
        <h2><span class="live" aria-hidden="true"></span>Now</h2>
        <p>${esc(now.text)}</p>
        <a class="wlink" href="#projects/${now.projectId}" data-nav="projects/${now.projectId}">${esc(now.linkLabel)} →</a>
      </section>
      <section class="widget glass" data-glow aria-label="Skills">
        <h2>Skills</h2>
        <ul>${C.skillsWidget.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      </section>
    </div>`;
}

function renderMenubar() {
  const mb = $('#menubar');
  mb.innerHTML = `
    <a class="mb-brand" href="#about" data-nav="about">${picture(identity.avatar, '', '', 'width="20" height="20"')}<strong>${esc(identity.name)}</strong></a>
    <nav class="mb-menus" aria-label="Menu">
      ${['about', 'experience', 'projects', 'contact'].map((id) => `<a href="#${id}" data-nav="${id}">${id[0].toUpperCase() + id.slice(1)}</a>`).join('')}
    </nav>
    <span class="mb-spacer"></span>
    <button class="mb-search" type="button" data-spotlight aria-label="Search (Ctrl or Command K)">${icon('search', 14)}<span>Search</span><kbd>${modKey}K</kbd></button>
    <a class="mb-simple" href="${identity.simple}">Simple view</a>
    <span class="mb-time" id="mb-time"></span>`;
}

const modKey = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘' : 'Ctrl ';

/** Desktop only: the headline and featured work, so the desktop is never an empty wallpaper. */
function heroBlock() {
  const [head, tail] = identity.oneLiner.split(', and ');
  let i = 0;
  const words = `${head}.`
    .split(' ')
    .map((w) => `<span class="w${/^(dashboards|plans|AI|assistants)\b/.test(w) ? ' hl' : ''}" style="--i:${i++}">${esc(w)}</span>`)
    .join(' ');
  const featured = C.projects.filter((p) => p.featured);
  return `
    <section class="hero" aria-label="Introduction">
      <p class="eyebrow"><span class="live" aria-hidden="true"></span>${esc(identity.statusLong)}</p>
      <h2 class="headline">${words}</h2>
      ${tail ? `<p class="hero-sub">And ${esc(tail)}</p>` : ''}
      <div class="hero-cta">
        <a class="hbtn primary" href="#projects" data-nav="projects">See my work ${icon('arrow-right', 18)}</a>
        <a class="hbtn" href="#terminal" data-nav="terminal">${icon('terminal', 18)} Open terminal</a>
      </div>
      <div class="hero-cards">
        ${featured
          .map(
            (p, n) => `<a class="hcard glass" data-glow data-tilt style="--i:${n}" href="#projects/${p.id}" data-nav="projects/${p.id}">
              <span class="hcard-ic" style="background:${p.gradient}">${icon(p.icon, 20)}</span>
              <strong>${esc(p.name)}</strong>
              <span class="hcard-t">${esc(p.tagline)}</span>
            </a>`,
          )
          .join('')}
      </div>
    </section>`;
}

function renderHome() {
  const desktop = isDesktop();
  $('#menubar').hidden = !desktop;
  $('#hero-host').innerHTML = desktop ? heroBlock() : '';

  if (desktop) {
    renderMenubar();
    $('#home-scroll').innerHTML = `${profileWidget(84)}${smallWidgets()}`;
    $('#dock').className = 'dock glass';
    $('#dock').setAttribute('aria-label', 'Apps');
    $('#dock').innerHTML = C.apps
      .map((a, n) => {
        const inner = `${squircle(a, 28)}<span class="tip" aria-hidden="true">${esc(a.label)}</span>`;
        return a.type === 'app'
          ? `<a class="dock-item" style="--i:${n}" href="#${a.id}" data-nav="${a.id}" data-app="${a.id}" aria-label="${esc(a.label)}">${inner}</a>`
          : `<a class="dock-item" style="--i:${n}" href="${a.href}" ${ext} data-app="${a.id}" aria-label="${esc(a.label)} (opens in a new tab)">${inner}</a>`;
      })
      .join('');
    return;
  }

  $('#home-scroll').innerHTML = `
    ${profileWidget(68)}
    ${smallWidgets()}
    <nav class="grid" aria-label="Apps">
      ${C.apps
        .map((a, n) =>
          a.type === 'app'
            ? `<a class="icon-btn" style="--i:${n}" href="#${a.id}" data-nav="${a.id}" data-app="${a.id}">${squircle(a)}<span class="lbl">${esc(a.label)}</span></a>`
            : `<a class="icon-btn" style="--i:${n}" href="${a.href}" ${ext} data-app="${a.id}">${squircle(a)}<span class="lbl">${esc(a.label)}</span></a>`,
        )
        .join('')}
    </nav>`;

  $('#dock').className = 'dock glass';
  $('#dock').setAttribute('aria-label', 'Quick contact');
  $('#dock').innerHTML = C.dock
    .map(
      (d) =>
        `<a class="icon-btn" href="${d.href}" ${d.external ? ext : ''} aria-label="${esc(d.label)}"><span class="squircle" style="background:${d.gradient}">${glyph(d, 30)}</span></a>`,
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
      <div class="hero-photo-wrap">${picture(identity.portrait, 'Portrait of Pinkesh Darji', 'hero-photo', 'width="1121" height="1403"')}</div>
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
        <div class="features">${featured
          .map(
            (p) => `<a class="feature" href="#projects/${p.id}" data-nav="projects/${p.id}">
              <div class="cover" style="background:${p.gradient}"><span class="cover-ic">${icon(p.icon, 54)}</span><span class="tag">${esc(p.status)}</span></div>
              <div class="fb"><h3>${esc(p.name)}</h3><p>${esc(p.tagline)}</p></div>
            </a>`,
          )
          .join('')}</div>
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
      .map((g) => `${groupTitle(g.group)}${group(`<div class="pad chips">${g.items.map((i) => `<span class="chip">${esc(i)}</span>`).join('')}</div>`)}`)
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

/** Content rises into place as it enters the scroller: staggered on open, one by one on scroll. */
function reveal(scroller, dir) {
  if (reduceMotion() || !('IntersectionObserver' in window)) return;
  scroller.style.setProperty('--dx', `${dir * 26}px`);
  const io = new IntersectionObserver(
    (entries) => {
      let n = 0;
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.style.setProperty('--d', `${Math.min(n++, 9) * 45}ms`);
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    },
    { root: scroller, rootMargin: '0px 0px -4% 0px' },
  );
  scroller.querySelectorAll('.large-title, .app-body > *, .features > *').forEach((k) => {
    if (k.classList.contains('features')) return;
    k.classList.add('rv');
    io.observe(k);
  });
}

function applyScreen(app, view, dir = 0) {
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
  else reveal(scroller, dir);
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

const SPRING = 'cubic-bezier(0.22, 1.12, 0.36, 1)';
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
      [{ transform: 'scale(0.12)', opacity: 0, borderRadius: '60px' }, { opacity: 1, offset: 0.35 }, { transform: 'scale(1)', opacity: 1, borderRadius: getComputedStyle(el).borderRadius }],
      { duration: 460, easing: SPRING },
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
      [{ transform: 'scale(1)', opacity: 1, borderRadius: getComputedStyle(el).borderRadius }, { opacity: 1, offset: 0.55 }, { transform: 'scale(0.12)', opacity: 0, borderRadius: '60px' }],
      { duration: 340, easing: 'cubic-bezier(0.5, 0, 0.75, 0.3)', fill: 'forwards' },
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
      applyScreen(current.el, screens[id](sub), sub ? 1 : -1);
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

/** The hero steps back while any window is on screen, so text never fights text. */
function syncDesk() {
  document.body.classList.toggle('has-win', [...wins.values()].some((w) => !w.minimized));
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
    if (e.target.closest('button') || w.maxed) return;
    d = { x: e.clientX - w.el.offsetLeft, y: e.clientY - w.el.offsetTop };
    bar.setPointerCapture(e.pointerId);
    w.el.classList.add('dragging');
  });
  bar.addEventListener('pointermove', (e) => {
    if (!d) return;
    const left = Math.min(Math.max(e.clientX - d.x, 120 - w.el.offsetWidth), innerWidth - 120);
    const top = Math.min(Math.max(e.clientY - d.y, MENU_H), innerHeight - 60);
    w.el.style.left = `${left}px`;
    w.el.style.top = `${top}px`;
  });
  const end = () => { d = null; w.el.classList.remove('dragging'); };
  bar.addEventListener('pointerup', end);
  bar.addEventListener('pointercancel', end);
  bar.addEventListener('dblclick', (e) => { if (!e.target.closest('button')) toggleZoom(w); });
}

const maxRect = () => ({ left: 8, top: MENU_H + 8, width: innerWidth - 16, height: innerHeight - MENU_H - 8 - 104 });
function setRect(el, r) {
  el.style.left = `${Math.round(r.left)}px`;
  el.style.top = `${Math.round(r.top)}px`;
  el.style.width = `${Math.round(r.width)}px`;
  el.style.height = `${Math.round(r.height)}px`;
}
/** Zoom fills the desktop between menu bar and dock; a second press restores the old frame. */
function toggleZoom(w) {
  const el = w.el;
  if (!reduceMotion()) {
    el.classList.add('zooming');
    clearTimeout(w.zoomTimer);
    w.zoomTimer = setTimeout(() => el.classList.remove('zooming'), 420);
  }
  if (w.maxed) {
    setRect(el, w.restore);
    w.maxed = false;
  } else {
    w.restore = { left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight };
    setRect(el, maxRect());
    w.maxed = true;
  }
  el.classList.toggle('maxed', w.maxed);
}

/** Transform that shrinks a window into its dock icon (used by minimise and restore). */
function toDock(w) {
  const icon = iconFor(w.id);
  const b = w.el.getBoundingClientRect();
  if (!icon || !b.width) return 'translateY(40px) scale(0.6)';
  const r = icon.getBoundingClientRect();
  const dx = r.left + r.width / 2 - (b.left + b.width / 2);
  const dy = r.top + r.height / 2 - (b.top + b.height / 2);
  return `translate(${dx}px, ${dy}px) scale(${(r.width / b.width).toFixed(3)}, ${(r.height / b.height).toFixed(3)})`;
}

function bounce(el) {
  const sq = el && el.querySelector('.squircle');
  if (!sq || reduceMotion()) return;
  sq.animate(
    [{ translate: '0 0' }, { translate: '0 -16px' }, { translate: '0 0' }, { translate: '0 -6px' }, { translate: '0 0' }],
    { duration: 620, easing: 'cubic-bezier(0.3, 0, 0.3, 1)' },
  );
}

function openWindow(id, sub, animate) {
  const el = shell(id, sub, 'win');
  const w = { id, el, sub, minimized: false, maxed: false, z: 0 };
  const W = Math.min(900, innerWidth - 120);
  const H = Math.min(680, innerHeight - MENU_H - 120);
  const off = (cascade++ % 5) * 26;
  setRect(el, {
    width: W,
    height: H,
    left: (innerWidth - W) / 2 + off,
    top: MENU_H + Math.max(14, (innerHeight - MENU_H - 110 - H) / 2) + off,
  });
  wins.set(id, w);
  $('#app-layer').appendChild(el);
  dockDot(id, true);
  focusWindow(id);
  syncDesk();
  enableDrag(w);

  el.addEventListener('pointerdown', () => {
    if (frontId !== id) { focusWindow(id); setHash(pathOf(w)); }
  });
  $('.tl-close', el).addEventListener('click', () => closeWindow(id, true));
  $('.tl-min', el).addEventListener('click', () => minimizeWindow(id));
  $('.tl-zoom', el).addEventListener('click', () => toggleZoom(w));

  const trigger = pendingTrigger && document.contains(pendingTrigger) ? pendingTrigger : iconFor(id);
  pendingTrigger = null;
  if (animate && !reduceMotion() && trigger) {
    bounce(iconFor(id));
    el.style.transformOrigin = originOf(el, trigger);
    el.animate(
      [{ transform: 'scale(0.2)', opacity: 0 }, { opacity: 1, offset: 0.4 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: 420, easing: SPRING },
    ).onfinish = () => { el.style.transformOrigin = ''; };
  } else if (animate) {
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140 });
  }
  el.focus({ preventScroll: true });
}

function minimizeWindow(id) {
  const w = wins.get(id);
  if (!w || w.minimized) return;
  w.minimized = true;
  syncDesk();
  w.el.classList.remove('focused');
  const hide = () => { if (w.minimized) w.el.classList.add('minimized'); };
  if (reduceMotion()) hide();
  else {
    w.el.animate(
      [{ transform: 'none', opacity: 1 }, { opacity: 0.9, offset: 0.6 }, { transform: toDock(w), opacity: 0 }],
      { duration: 380, easing: 'cubic-bezier(0.5, 0, 0.6, 0.6)', fill: 'forwards' },
    ).onfinish = hide;
    w.el.style.pointerEvents = 'none';
  }
  if (frontId === id) {
    frontId = null;
    const next = [...wins.values()].filter((x) => !x.minimized).sort((a, b) => b.z - a.z)[0];
    if (next) { focusWindow(next.id); setHash(pathOf(next)); } else setHash('');
  }
}

function restoreWindow(w) {
  w.minimized = false;
  syncDesk();
  w.el.getAnimations().forEach((a) => a.cancel());
  w.el.classList.remove('minimized');
  w.el.style.pointerEvents = '';
  if (reduceMotion()) return;
  bounce(iconFor(w.id));
  w.el.animate([{ transform: toDock(w), opacity: 0 }, { opacity: 1, offset: 0.4 }, { transform: 'none', opacity: 1 }], { duration: 400, easing: SPRING });
}

function closeWindow(id, userAction, syncHash = true) {
  const w = wins.get(id);
  if (!w) return;
  wins.delete(id);
  syncDesk();
  dockDot(id, false);
  const remove = () => w.el.remove();
  if (userAction && !reduceMotion() && !w.minimized) {
    w.el.style.pointerEvents = 'none';
    w.el.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.92)' }], { duration: 180, easing: 'ease-in', fill: 'forwards' }).onfinish = remove;
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

/** Keep windows reachable when the browser window is resized. */
function reflowWindows() {
  wins.forEach((w) => {
    if (w.maxed) return setRect(w.el, maxRect());
    const left = Math.min(Math.max(w.el.offsetLeft, 120 - w.el.offsetWidth), innerWidth - 120);
    const top = Math.min(Math.max(w.el.offsetTop, MENU_H), innerHeight - 60);
    w.el.style.left = `${left}px`;
    w.el.style.top = `${top}px`;
  });
}

function desktopRoute(animate) {
  const { id, sub } = parseHash();
  if (!id) {
    [...wins.keys()].forEach((k) => closeWindow(k, false, false));
    return;
  }
  const w = wins.get(id);
  if (!w) return openWindow(id, sub, animate);
  if (w.minimized) restoreWindow(w);
  if (w.sub !== sub) {
    w.sub = sub;
    applyScreen(w.el, screens[id](sub), sub ? 1 : -1);
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
  closeSpotlight(false);
  current = null;
  wins.clear();
  frontId = null;
  $('#app-layer').innerHTML = '';
  document.body.classList.remove('app-open', 'term-open', 'has-win');
  $('#home').inert = false;
  $('#dock').inert = false;
}

/* ── spotlight search (Ctrl/⌘ K, or "/") ─────────────────── */
let spot = null; // { el, items, shown, index, opener }

function spotlightItems() {
  const open = (href) => () => window.open(href, '_blank', 'noopener');
  return [
    ...C.apps.map((a) => ({
      label: a.label,
      hint: a.type === 'app' ? 'App' : 'Opens in a new tab',
      glyph: `<span class="mini sm" style="background:${a.gradient}">${glyph(a, 16)}</span>`,
      run: a.type === 'app' ? () => navigate(a.id) : open(a.href),
    })),
    ...C.projects.map((p) => ({
      label: p.name,
      hint: `Project · ${p.tagline}`,
      words: p.tools.join(' '),
      glyph: `<span class="mini sm" style="background:${p.gradient}">${icon(p.icon, 16)}</span>`,
      run: () => navigate(`projects/${p.id}`),
    })),
    {
      label: 'Copy email address',
      hint: identity.email,
      glyph: `<span class="mini sm" style="background:linear-gradient(160deg,#38bdf8,#2563eb)">${icon('copy', 16)}</span>`,
      run: () => copyText(identity.email),
    },
    {
      label: 'Simple view',
      hint: 'Plain, fast, print-friendly page',
      glyph: `<span class="mini sm" style="background:linear-gradient(160deg,#94a3b8,#334155)">${icon('list', 16)}</span>`,
      run: () => { location.href = identity.simple; },
    },
  ];
}

function paintSpotlight() {
  const q = $('input', spot.el).value.trim().toLowerCase();
  spot.shown = spot.items.filter((it) => !q || `${it.label} ${it.hint} ${it.words || ''}`.toLowerCase().includes(q));
  spot.index = Math.min(spot.index, Math.max(0, spot.shown.length - 1));
  const list = $('.spot-list', spot.el);
  list.innerHTML = spot.shown.length
    ? spot.shown
        .map(
          (it, i) => `<li class="spot-item" id="spot-${i}" role="option" data-i="${i}" aria-selected="${i === spot.index}">
            ${it.glyph}<span class="grow"><span class="t">${esc(it.label)}</span><span class="s">${esc(it.hint)}</span></span>
            <span class="ret" aria-hidden="true">↵</span></li>`,
        )
        .join('')
    : '<li class="spot-empty">No matches. Try “projects”, “SQL” or “resume”.</li>';
  $('input', spot.el).setAttribute('aria-activedescendant', spot.shown.length ? `spot-${spot.index}` : '');
  $('[aria-selected="true"]', list)?.scrollIntoView({ block: 'nearest' });
}

function openSpotlight() {
  if (spot) return;
  const el = document.createElement('div');
  el.className = 'spot';
  el.innerHTML = `
    <div class="spot-box" role="dialog" aria-modal="true" aria-label="Search">
      <label class="spot-field">${icon('search', 20)}
        <input type="text" role="combobox" aria-expanded="true" aria-controls="spot-list" aria-autocomplete="list"
          autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Search apps, projects and actions" aria-label="Search">
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
    } else if (ev.key === 'Tab') ev.preventDefault(); // focus stays in the field; arrows move the selection
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

/* ── pointer light: glass cards glow under the cursor, hero cards tilt toward it ── */
function wirePointerFx() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let tilted = null;
  document.addEventListener('pointermove', (e) => {
    const g = e.target.closest?.('[data-glow]');
    if (g) {
      const r = g.getBoundingClientRect();
      g.style.setProperty('--mx', `${e.clientX - r.left}px`);
      g.style.setProperty('--my', `${e.clientY - r.top}px`);
    }
    const t = reduceMotion() ? null : e.target.closest?.('[data-tilt]');
    if (tilted && tilted !== t) {
      tilted.style.removeProperty('--rx');
      tilted.style.removeProperty('--ry');
    }
    tilted = t || null;
    if (t) {
      const r = t.getBoundingClientRect();
      t.style.setProperty('--ry', `${(((e.clientX - r.left) / r.width - 0.5) * 12).toFixed(2)}deg`);
      t.style.setProperty('--rx', `${((0.5 - (e.clientY - r.top) / r.height) * 12).toFixed(2)}deg`);
    }
  }, { passive: true });
}

/* ── global events ───────────────────────────────────────── */
document.addEventListener('click', (ev) => {
  const copy = ev.target.closest('[data-copy]');
  if (copy) return copyText(copy.dataset.copy);
  if (ev.target.closest('[data-spotlight]')) return openSpotlight();

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
addEventListener('resize', () => { if (isDesktop()) reflowWindows(); });
wirePointerFx();
startWallpaper($('#bg'));
