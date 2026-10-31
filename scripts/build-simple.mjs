// Generates simple.html (plain, fast, print-friendly, no JavaScript) from js/content.js.
// Run after editing content:  npm run build:simple
import { writeFileSync } from 'node:fs';
import * as C from '../js/content.js';

const { identity: id } = C;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const link = (l) => `<a href="${l.href}" rel="noopener">${esc(l.label)}</a>`;

const projectHtml = (p) => {
  const tools = [...p.tools, ...(p.builtWithClaudeCode ? ['built with Claude Code'] : [])];
  const part = (h, t) => (t ? `<p><strong>${h}:</strong> ${esc(t)}</p>` : '');
  return `
  <article class="project" id="${p.id}">
    <h3>${esc(p.name)} <span class="tag">${esc(p.status)}</span></h3>
    <p class="muted">${esc(p.tagline)}</p>
    ${part('Problem', p.problem)}${part('What I did', p.did)}${part('Result', p.result)}${p.summary ? `<p>${esc(p.summary)}</p>` : ''}
    ${tools.length ? `<p><strong>Tools:</strong> ${esc(tools.join(' · '))}</p>` : ''}
    ${p.links.length ? `<p>${p.links.map(link).join(' · ')}</p>` : ''}
  </article>`;
};

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pinkesh Darji — Data Analyst (BI &amp; AI Solutions) · Simple view</title>
<meta name="description" content="${esc(id.oneLiner)}">
<meta name="color-scheme" content="light dark">
<link rel="canonical" href="${id.siteUrl}/simple.html">
<link rel="icon" type="image/png" sizes="32x32" href="images/favicon-32.png">
<meta property="og:title" content="Pinkesh Darji — Data Analyst (BI &amp; AI Solutions)">
<meta property="og:description" content="${esc(id.oneLiner)}">
<meta property="og:image" content="${id.siteUrl}/images/og.png">
<meta name="twitter:card" content="summary_large_image">
<style>
  :root { --bg:#fff; --fg:#17171a; --muted:#55555d; --line:#e4e4ea; --link:#0b57d0; --chip:#f1f1f5; }
  @media (prefers-color-scheme: dark) { :root { --bg:#111114; --fg:#f2f2f5; --muted:#a9a9b3; --line:#2a2a31; --link:#8ab4ff; --chip:#22222a; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--fg); font: 17px/1.55 -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif; }
  main { max-width: 760px; margin: 0 auto; padding: 32px 20px 64px; }
  a { color: var(--link); }
  h1 { margin: 0; font-size: 2.1rem; line-height: 1.15; }
  h2 { margin: 2.2rem 0 .6rem; padding-bottom: .3rem; border-bottom: 1px solid var(--line); font-size: 1.3rem; }
  h3 { margin: 0 0 .1rem; font-size: 1.1rem; }
  p { margin: .5rem 0; }
  ul { padding-left: 1.2rem; }
  li { margin: .45rem 0; }
  .muted { color: var(--muted); }
  .lead { font-size: 1.15rem; margin-top: .8rem; }
  .top { display: flex; gap: 18px; align-items: center; }
  .top img { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; flex: none; }
  .tag { display: inline-block; margin-left: .4rem; padding: 1px 9px; border-radius: 999px; background: var(--chip); color: var(--muted); font-size: .78rem; font-weight: 600; vertical-align: middle; }
  .project { margin: 1.4rem 0; padding-bottom: 1.2rem; border-bottom: 1px solid var(--line); }
  .links a { margin-right: 1rem; }
  nav.jump { margin: 1rem 0 0; }
  nav.jump a { margin-right: .9rem; }
  footer { margin-top: 3rem; color: var(--muted); font-size: .95rem; }
  @media print {
    :root { --bg:#fff; --fg:#000; --muted:#333; --line:#bbb; --link:#000; --chip:#eee; }
    main { max-width: none; padding: 0; }
    nav.jump, footer a.back { display: none; }
    a { text-decoration: none; }
    a[href^="http"]::after { content: " (" attr(href) ")"; font-size: .8em; }
    h2, .project { break-inside: avoid; }
  }
</style>
<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: id.name,
  jobTitle: id.title,
  description: id.oneLiner,
  url: `${id.siteUrl}/`,
  image: `${id.siteUrl}/images/avatar.jpg`,
  email: `mailto:${id.email}`,
  worksFor: { '@type': 'Organization', name: id.company },
  sameAs: [id.linkedin, id.github],
}, null, 2)}
</script>
</head>
<body>
<main>
  <header>
    <div class="top">
      <img src="${id.avatar.jpg}" alt="Pinkesh Darji" width="96" height="96">
      <div>
        <h1>${esc(id.name)}</h1>
        <p class="muted" style="margin:.2rem 0 0">${esc(id.title)} · ${esc(id.company)}, ${esc(id.companyCity)}</p>
        <p class="muted" style="margin:.2rem 0 0">${esc(id.statusLong)}</p>
      </div>
    </div>
    <p class="lead">${esc(id.oneLiner)}</p>
    <p class="links"><a href="${id.resume}">Resume (PDF)</a><a href="mailto:${id.email}">${esc(id.email)}</a><a href="${id.linkedin}" rel="noopener">LinkedIn</a><a href="${id.github}" rel="noopener">GitHub</a></p>
    <nav class="jump" aria-label="Sections"><a href="#about">About</a><a href="#experience">Experience</a><a href="#projects">Projects</a><a href="#skills">Skills</a><a href="#education">Education</a><a href="#contact">Contact</a></nav>
  </header>

  <section id="about">
    <h2>About</h2>
    ${C.about.paragraphs.map((p) => `<p>${rich(p)}</p>`).join('\n    ')}
    <p class="muted">${esc(C.about.credentials)}</p>
    <p class="muted">Interests: ${esc(C.about.interests.join(' · '))}.</p>
  </section>

  <section id="experience">
    <h2>Experience</h2>
    ${C.experience.map((e) => `<h3>${esc(e.role)}</h3>
    <p class="muted">${esc(e.company)} · ${esc(e.period)}</p>
    <p><em>${esc(e.blurb)}</em></p>
    <ul>
      ${e.bullets.map((b) => `<li>${rich(b)}</li>`).join('\n      ')}
    </ul>`).join('\n')}
  </section>

  <section id="projects">
    <h2>Projects</h2>
    ${C.projects.filter((p) => p.featured).map(projectHtml).join('')}
    <h3 style="margin-top:2rem">Other projects</h3>
    ${C.projects.filter((p) => !p.featured).map(projectHtml).join('')}
    <p><strong>More builds:</strong> ${C.moreBuilds.map((b) => `<a href="${b.href}" rel="noopener">${esc(b.name)}</a>${b.note ? ` (${esc(b.note)})` : ''}`).join(' · ')}</p>
  </section>

  <section id="skills">
    <h2>Skills</h2>
    <ul>
      ${C.skills.map((g) => `<li><strong>${esc(g.group)}:</strong> ${esc(g.items.join(', '))}</li>`).join('\n      ')}
    </ul>
  </section>

  <section id="education">
    <h2>Education</h2>
    <ul>
      ${C.education.degrees.map((d) => `<li><strong>${esc(d.name)}</strong>, ${esc(d.school)} · ${esc(d.years)} · ${esc(d.cgpa)}</li>`).join('\n      ')}
      <li><strong>Certification:</strong> <a href="${C.education.certification.href}" rel="noopener">${esc(C.education.certification.name)}</a></li>
    </ul>
  </section>

  <section id="contact">
    <h2>Contact</h2>
    <ul>
      <li>Email: <a href="mailto:${id.email}">${esc(id.email)}</a></li>
      <li>Phone: <a href="${id.phoneHref}">${esc(id.phone)}</a></li>
      <li>LinkedIn: <a href="${id.linkedin}" rel="noopener">${esc(id.linkedin.replace('https://www.', ''))}</a></li>
      <li>GitHub: <a href="${id.github}" rel="noopener">${esc(id.github.replace('https://', ''))}</a></li>
      <li>Location: ${esc(id.location)}</li>
      <li>Resume: <a href="${id.resume}">PDF</a></li>
    </ul>
  </section>

  <footer><a class="back" href="./">← Back to the interactive version</a></footer>
</main>
</body>
</html>
`;

writeFileSync(new URL('../simple.html', import.meta.url), html);
console.log('simple.html written', html.length, 'bytes');
