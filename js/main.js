import * as C from './content.js';
import { ICONS, BRAND } from './icons.js';

const { identity } = C;
const $ = (sel, root = document) => root.querySelector(sel);
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

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

/* ── status bar clock (IST, h:mm) ────────────────────────── */
const clockFmt = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true,
});
function tickClock() {
  const parts = Object.fromEntries(clockFmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
  $('#sb-time').textContent = `${parts.hour}:${parts.minute}`;
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

function renderHome() {
  const now = C.now;
  $('#home-scroll').innerHTML = `
    <section class="profile glass" aria-label="Profile">
      <div class="profile-top">
        <div class="avatar-wrap">
          ${picture(identity.avatar, 'Pinkesh Darji', '', 'width="68" height="68" fetchpriority="high"')}
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
    </section>

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
    </div>

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
      ${group(`<div class="pad chips">${C.about.interests.map((i) => `<span class="chip">${esc(i)}</span>`).join('')}</div>`)}`,
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

/* ── router + app shell ──────────────────────────────────── */
const VALID = ['about', 'experience', 'projects', 'skills', 'education', 'contact', 'terminal'];
let current = null; // { id, el, sub, trigger, closing }
let navIndex = 0;

const parseHash = () => {
  const [id, sub] = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/');
  return VALID.includes(id) ? { id, sub: sub || '' } : { id: '', sub: '' };
};

let pendingTrigger = null;

function navigate(path, trigger) {
  const from = location.hash.replace(/^#\/?/, '');
  pendingTrigger = trigger || null;
  history.pushState({ idx: ++navIndex, from }, '', `#${path}`);
  route(true);
}

/** Back = browser back when we pushed the previous screen ourselves, otherwise replace in place. */
function goBack() {
  if (!current) return;
  const target = current.sub ? 'projects' : '';
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
  document.body.classList.toggle('term-open', !!view.terminal);
  scroller.scrollTop = 0;
  app.classList.remove('scrolled');
  if (view.terminal) mountTerminal($('#term-host', scroller));
}

function buildApp(id, sub) {
  const el = document.createElement('div');
  el.className = 'app';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.tabIndex = -1;
  el.innerHTML = `
    <div class="app-nav">
      <button class="back" type="button" aria-label="Back">${icon('chevron-left', 26)}<span class="back-label">Home</span></button>
      <span class="nav-title" aria-hidden="true"></span><span></span>
    </div>
    <div class="app-scroll"></div>`;
  applyScreen(el, screens[id](sub));
  const scroller = $('.app-scroll', el);
  scroller.addEventListener('scroll', () => el.classList.toggle('scrolled', scroller.scrollTop > 36), { passive: true });
  $('.back', el).addEventListener('click', goBack);
  el.addEventListener('click', (ev) => {
    const copy = ev.target.closest('[data-copy]');
    if (copy) copyText(copy.dataset.copy);
  });
  attachSwipe(el, scroller);
  return el;
}

function attachSwipe(el, scroller) {
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

function triggerFor(id) {
  return pendingTrigger || document.querySelector(`.home [data-app="${id}"]`);
}

function openApp(id, sub, animate) {
  const layer = $('#app-layer');
  const el = buildApp(id, sub);
  const trigger = triggerFor(id);
  pendingTrigger = null;
  layer.appendChild(el);
  current = { id, el, sub, trigger, closing: false };
  document.body.classList.add('app-open');
  $('#home').inert = true;

  if (animate && !reduceMotion() && trigger) {
    const r = trigger.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    el.style.transformOrigin = `${r.left + r.width / 2 - b.left}px ${r.top + r.height / 2 - b.top}px`;
    el.animate(
      [{ transform: 'scale(0.14)', opacity: 0, borderRadius: '30px' }, { transform: 'scale(1)', opacity: 1, borderRadius: '0px' }],
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
  const finish = () => {
    el.remove();
    if (current && current.el === el) current = null;
    const back = trigger && document.contains(trigger) ? trigger : document.querySelector(`.home [data-app="${id}"]`);
    if (back) back.focus({ preventScroll: true });
  };
  if (animate && !reduceMotion() && trigger && document.contains(trigger)) {
    const r = trigger.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    el.style.transformOrigin = `${r.left + r.width / 2 - b.left}px ${r.top + r.height / 2 - b.top}px`;
    el.animate(
      [{ transform: 'scale(1)', opacity: 1, borderRadius: '0px' }, { transform: 'scale(0.14)', opacity: 0, borderRadius: '30px' }],
      { duration: 260, easing: 'cubic-bezier(0.4, 0, 0.8, 0.4)', fill: 'forwards' },
    ).onfinish = finish;
  } else if (animate) {
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: 'forwards' }).onfinish = finish;
  } else finish();
}

function route(animate) {
  const { id, sub } = parseHash();
  if (!id) {
    closeApp(animate);
    return;
  }
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

/* ── global events ───────────────────────────────────────── */
document.addEventListener('click', (ev) => {
  const a = ev.target.closest('a[data-nav], a.row[href^="#"], a.feature[href^="#"]');
  if (!a || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button) return;
  const path = a.dataset.nav || a.getAttribute('href').slice(1);
  ev.preventDefault();
  navigate(path, a.closest('.home') ? a : null);
});

document.addEventListener('keydown', (ev) => {
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

/* ── boot (no splash screen: content renders immediately) ── */
history.replaceState({ idx: 0 }, '');
renderHome();
tickClock();
route(false);
