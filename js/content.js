// Single source of truth for every word on the site.
// The streaming-style home page, the OS view (os.html), the simple view and meta tags all read from here.
// Wording matches the resume. Do not add numbers, clients or skills that are not on it.
//
// Confidentiality: only "Vezapp Solutions LLP" may be named. Describe clients generically.
// Inline markup: **bold** is the only supported syntax (see rich() in stream.js / os.js).

/**
 * @typedef {{ label: string, href: string }} Link
 * @typedef {{
 *   id: string, name: string, tagline: string, featured: boolean,
 *   status: string, icon: string, gradient: string,
 *   problem?: string, did?: string, result?: string, summary?: string,
 *   tools: string[], builtWithClaudeCode?: boolean,
 *   shots: Shot[], media?: Media, links: Link[],
 * }} Project
 * Screenshots and logos: put the originals in media/, list them here, then run
 *   npm i --no-save sharp && node scripts/build-media.mjs
 * which writes small WebP copies to images/projects/<id>/ (the site only loads those).
 * The first shot is the project's cover; `poster` picks the shot used on tall cards.
 * @typedef {{ src: string, caption: string }} Shot
 * @typedef {{ logo?: string, wordmark?: string, poster?: number, note?: string }} Media
 * @typedef {{ group: string, items: string[] }} SkillGroup
 */

export const identity = {
  name: 'Pinkesh Darji',
  title: 'Data Analyst – BI & AI Solutions',
  oneLiner:
    'I turn factory and business data into clear dashboards, plans and AI assistants, and I build the software behind them with Claude Code.',
  status: 'Open to Data Analyst & Developer roles',
  statusLong: 'Open to Data Analyst and Software Developer roles · Ahmedabad / Vadodara',
  company: 'Vezapp Solutions LLP',
  companyCity: 'Vadodara',
  location: 'Borsad, Gujarat, India',
  email: 'pinkeshd29@gmail.com',
  phone: '+91 98750 34836',
  phoneHref: 'tel:+919875034836',
  github: 'https://github.com/Pinkesh2905',
  // The resume uses linkedin.com/in/pinkesh29; the old site used a different slug. One URL only.
  linkedin: 'https://www.linkedin.com/in/pinkesh29',
  resume: 'Pinkesh_Darji_Resume.pdf',
  simple: 'simple.html',
  siteUrl: 'https://pinkeshh.vercel.app',
  avatar: { webp: 'images/avatar.webp', jpg: 'images/avatar.jpg' },
  portrait: { webp: 'images/portrait.webp', jpg: 'images/portrait.jpg' },
};

export const now = {
  text: 'Testing a production planner for foundries',
  linkLabel: 'Vezapp Planner',
  projectId: 'vezapp-planner',
};

export const about = {
  paragraphs: [
    "I'm a Data Analyst at Vezapp Solutions in Vadodara, working with foundry and manufacturing clients. My day-to-day is SQL on client production databases, Looker Studio dashboards, cleaning and loading client data, and setting up shop-floor data-entry apps.",
    'I also build AI tools on top of that data, like assistants that let plant managers ask "how many moulds were rejected last week?" in plain English instead of opening a dashboard.',
    "I'm also open to software developer roles. Building working products is what interests me most, especially with AI tools like Claude Code. Vezapp Planner (Django, Next.js, PostgreSQL), the AI data assistants for clients and a live store system for a freelance client were all built that way.",
    "**How I work with AI:** I build my tools with Claude Code. My part is understanding what the client needs, giving the AI the right data structure and rules, checking every answer against the real data, and fixing what's wrong.",
  ],
  credentials: 'MCA (CHARUSAT) · Google Data Analytics certified.',
  interests: ['Data analytics', 'Software development', 'Building with AI tools'],
};

export const experience = [
  {
    role: 'Data Analyst – BI & AI Solutions',
    company: 'Vezapp Solutions LLP, Vadodara',
    period: 'Dec 2025 – Present',
    blurb: 'Industrial analytics firm serving foundry and auto-component manufacturers.',
    bullets: [
      "Write SQL queries on foundry clients' MySQL databases (hosted on AWS RDS) to pull moulding, rejection and dispatch data for reports and dashboards.",
      'Build and maintain Looker Studio dashboards for clients covering plan vs actual, order tracking and quality/rejection.',
      'Load client data from CSV files into MySQL using Python scripts, checking for duplicates and errors before upload.',
      'Found why client dashboards were loading slowly: the same queries were running many times at once and key tables had no indexes. Suggested adding indexes and turning on Looker caching.',
      'Set up shop-floor data-entry apps and workflows in Clappia (no-code), connected to MySQL and Google Sheets.',
      'Used Claude Code to build AI assistants that let clients ask questions about their MySQL production data and TallyPrime accounts in plain English, instead of opening dashboards. These assistants are now used by several clients.',
      'Prepared client documentation: Excel field lists for each app, workflow diagrams, meeting minutes and database status reports.',
      'Screened and interviewed 10+ Data Analyst candidates for the team.',
    ],
  },
];

/** @type {Project[]} */
export const projects = [
  {
    id: 'vezapp-planner',
    name: 'Vezapp Planner',
    tagline: 'Production planning for foundries',
    featured: true,
    status: 'Built at Vezapp · In testing',
    icon: 'layers',
    gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    problem:
      'Foundries plan monthly dispatches in Excel and only find out an order will be late when it is already late.',
    did: "Built a web app that plans each month's dispatches against real machine capacity, shifts and holidays. Planners upload the schedule from Excel. Each order is converted into moulds, cores, metal and machine minutes using the part's rejection rate. What-if planning lets them block a machine or add overtime and see which orders move.",
    result:
      "Shows every order's expected dispatch date and the bottleneck machine. Has reports (dispatch performance, utilisation, plan vs actual) with PDF/Excel export, an AI assistant for questions about the plan, and separate logins per company with Admin/Planner/Viewer roles.",
    tools: ['Django', 'Next.js', 'PostgreSQL', 'Claude API'],
    builtWithClaudeCode: true,
    media: {
      logo: 'media/projects/vezapp-planner/vezapp-planner-icon.png',
      wordmark: 'media/projects/vezapp-planner/vezapp-planner-logo-for-dark-background.png',
      poster: 10,
      note: 'Screenshots use demo data.',
    },
    shots: [
      { src: 'media/projects/vezapp-planner/screenshots/04-plan-gantt.png', caption: 'The plan as a Gantt chart, machine by machine' },
      { src: 'media/projects/vezapp-planner/screenshots/02-home.png', caption: "Home: today's and tomorrow's plan, and the bottleneck for the next 14 days" },
      { src: 'media/projects/vezapp-planner/screenshots/03-plan-lines.png', caption: 'Plan lines checked against real capacity, with late orders flagged' },
      { src: 'media/projects/vezapp-planner/screenshots/05-machine-shop.png', caption: "Machine shop: how much of each machine's time is already planned" },
      { src: 'media/projects/vezapp-planner/screenshots/06-monthly-scheduler.png', caption: "Monthly scheduler: the month's dispatch lines, uploaded from Excel" },
      { src: 'media/projects/vezapp-planner/screenshots/08-what-if.png', caption: 'What-if: try a change on a copy of the plan' },
      { src: 'media/projects/vezapp-planner/screenshots/07-insights.png', caption: 'Insights: what needs attention, ranked' },
      { src: 'media/projects/vezapp-planner/screenshots/12-ai-chat-answer.png', caption: 'The AI assistant answering a question about the plan' },
      { src: 'media/projects/vezapp-planner/screenshots/09-reports.png', caption: 'Reports: dispatch performance, with PDF and Excel export' },
      { src: 'media/projects/vezapp-planner/screenshots/15-plan-gantt-dark.png', caption: 'Gantt view in dark mode' },
      { src: 'media/projects/vezapp-planner/screenshots/16-mobile-home.png', caption: 'Home on a phone' },
      { src: 'media/projects/vezapp-planner/screenshots/17-mobile-ai-chat.png', caption: 'Insights and the AI assistant on a phone' },
    ],
    links: [],
  },
  {
    id: 'vezapp-ai',
    name: 'Vezapp AI',
    tagline: 'Ask your factory data',
    featured: true,
    status: 'Built at Vezapp · In use by clients',
    icon: 'sparkles',
    gradient: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
    problem:
      'Plant managers wanted answers from their production data without opening dashboards or installing Claude Desktop.',
    did: "A website where each client company logs in and asks questions in plain English. The AI turns the question into a read-only SQL query on that company's data and answers in plain language. Each company can only see its own data.",
    result: 'Built and now used by real clients. Replaces the desktop-only assistants with one web login for all clients.',
    // TODO: add the tech stack of the Vezapp AI website.
    tools: [],
    builtWithClaudeCode: true,
    media: {
      logo: 'media/projects/vezapp-ai/vezapp-ai-icon.png',
      wordmark: 'media/projects/vezapp-ai/vezapp-ai-logo-for-dark-backgrounds.png',
      poster: 9,
      note: 'Screenshots use demo data.',
    },
    shots: [
      { src: 'media/projects/vezapp-ai/05-chart-bar-desktop.png', caption: 'An answer with a chart: metal tapped by grade' },
      { src: 'media/projects/vezapp-ai/02-home-ask-anything-desktop.png', caption: 'Ask anything about production, quality, rejections or dispatch' },
      { src: 'media/projects/vezapp-ai/03-answer-with-steps-desktop.png', caption: 'A plain-English answer with the table behind it' },
      { src: 'media/projects/vezapp-ai/06-trend-line-chart-desktop.png', caption: 'A six-month trend as a line chart' },
      { src: 'media/projects/vezapp-ai/07-rejection-analysis-desktop.png', caption: 'Rejections by reason' },
      { src: 'media/projects/vezapp-ai/08-report-pdf-word-excel-desktop.png', caption: 'A pending-dispatch report, ready as PDF, Word or Excel' },
      { src: 'media/projects/vezapp-ai/09-dark-mode-desktop.png', caption: 'Dark mode' },
      { src: 'media/projects/vezapp-ai/22-answer-phone.png', caption: 'An answer on a phone' },
      { src: 'media/projects/vezapp-ai/24-chart-phone.png', caption: 'Charts on a phone' },
      { src: 'media/projects/vezapp-ai/21-home-phone.png', caption: 'Home on a phone' },
    ],
    links: [],
  },
  {
    id: 'ai-data-assistants',
    name: 'AI data assistants for clients',
    tagline: 'Ask Claude about MySQL and TallyPrime data',
    featured: true,
    status: 'Vezapp · In use',
    icon: 'terminal',
    gradient: 'linear-gradient(135deg,#10b981,#0ea5e9)',
    problem: 'Clients had to open dashboards or call us to get simple numbers.',
    did: "Built assistants (MCP servers) that let Claude answer questions from a client's MySQL production database and from TallyPrime accounting data (sales, receivables, GST, stock), using read-only access.",
    result: 'In use by several clients.',
    tools: ['Python', 'MySQL', 'TallyPrime', 'Claude'],
    builtWithClaudeCode: true,
    shots: [],
    links: [],
  },
  {
    id: 'slow-dashboards',
    name: 'Fixing slow client dashboards',
    tagline: 'Why Looker Studio was loading slowly',
    featured: true,
    status: 'Vezapp · Case study',
    icon: 'chart-column',
    gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)',
    problem: 'Client Looker Studio dashboards were loading very slowly.',
    did: 'Checked what was running on the MySQL server. The same heavy queries were firing many times at once, key tables had no indexes, and Looker caching was off.',
    result: 'Recommended adding indexes, enabling Looker caching and reducing duplicate queries.',
    tools: ['MySQL (AWS RDS)', 'Looker Studio'],
    shots: [],
    links: [],
  },
  {
    id: 'ipl-win-predictor',
    name: 'IPL Win Probability Predictor',
    tagline: 'Live win chance for the chasing team',
    featured: false,
    status: 'Personal project',
    icon: 'chart-column',
    gradient: 'linear-gradient(135deg,#3b82f6,#06b6d4)',
    summary: 'Live win chance for the chasing team, built from ball-by-ball IPL data.',
    tools: ['Python', 'Pandas', 'Scikit-learn', 'Streamlit'],
    shots: [],
    links: [
      { label: 'Live', href: 'https://pinkesh-iplwinpredictor.streamlit.app' },
      { label: 'GitHub', href: 'https://github.com/Pinkesh2905/IPL-WinPredictor' },
    ],
  },
  {
    id: 'housevue',
    name: 'HouseVue',
    tagline: 'House price estimator',
    featured: false,
    status: 'Personal project',
    icon: 'layout-grid',
    gradient: 'linear-gradient(135deg,#14b8a6,#22c55e)',
    // TODO(confirm): one-line description drafted from the repo README; needs approval.
    summary:
      'Predicts house prices from property details such as area, bedrooms, bathrooms and location.',
    tools: ['Python', 'Scikit-learn', 'Streamlit'],
    shots: [],
    links: [
      { label: 'Live', href: 'https://pinkesh-housevue.streamlit.app/' },
      { label: 'GitHub', href: 'https://github.com/Pinkesh2905/Housevue' },
    ],
  },
  {
    id: 'home-art-furniture',
    name: 'Home Art Furniture',
    tagline: 'Business system for a furniture store',
    featured: false,
    status: 'Freelance client · Live',
    icon: 'briefcase',
    gradient: 'linear-gradient(135deg,#f97316,#f59e0b)',
    summary:
      'Order, inventory, payment and delivery system used daily by the store, with sales and payment reports. Built with Django using AI coding tools (Claude Code, Antigravity), and each feature was tested with the store owner before handover.',
    tools: ['Django', 'PostgreSQL'],
    shots: [],
    links: [{ label: 'GitHub', href: 'https://github.com/Pinkesh2905/HomeArtFurniture' }],
  },
  {
    id: 'elevo',
    name: 'Elevo',
    tagline: 'AI placement prep platform',
    featured: false,
    status: 'MCA final project',
    icon: 'graduation-cap',
    gradient: 'linear-gradient(135deg,#ec4899,#8b5cf6)',
    summary: 'Live placement-preparation site that generates practice questions with AI.',
    tools: ['Django', 'PostgreSQL', 'Gemini API'],
    media: {
      logo: 'media/projects/elevo/logo/elevo-icon-512.png',
      wordmark: 'media/projects/elevo/logo/elevo-logo-transparent-white.png',
    },
    shots: [
      { src: 'media/projects/elevo/screenshots/01-landing.png', caption: 'Landing page' },
      { src: 'media/projects/elevo/screenshots/06-coding-problems.png', caption: 'Coding challenges, filtered by topic, company and difficulty' },
      { src: 'media/projects/elevo/screenshots/07-code-editor.png', caption: 'The built-in code editor' },
      { src: 'media/projects/elevo/screenshots/09-coding-topics.png', caption: 'Problems by topic' },
      { src: 'media/projects/elevo/screenshots/08-aptitude-dashboard.png', caption: 'Aptitude practice' },
      { src: 'media/projects/elevo/screenshots/10-mock-interview-setup.png', caption: 'AI mock interview setup, with resume upload' },
      { src: 'media/projects/elevo/screenshots/11-interview-report.png', caption: 'Interview report: strengths and what to improve' },
      { src: 'media/projects/elevo/screenshots/12-my-interviews.png', caption: 'Past mock interviews' },
      { src: 'media/projects/elevo/screenshots/04-pricing.png', caption: 'The plan for colleges and institutions' },
    ],
    links: [
      { label: 'Live', href: 'https://elevo.life' },
      { label: 'GitHub', href: 'https://github.com/Pinkesh2905/Elevo' },
    ],
  },
];

/** Smaller builds. Ones with an `id` and shots get their own gallery page; the rest link out. */
export const moreBuilds = [
  {
    id: 'aura',
    name: 'Aura',
    note: 'AI music app',
    href: 'https://auramusic-plum.vercel.app/',
    media: { logo: 'media/projects/aura/logo/aura-logo-icon.png' },
    shots: [
      { src: 'media/projects/aura/screenshots/aura-home-desktop.png', caption: 'Home' },
      { src: 'media/projects/aura/screenshots/aura-discover-desktop.png', caption: 'Current Aura: your musical identity' },
      { src: 'media/projects/aura/screenshots/aura-search-desktop.png', caption: 'Discovery hub, by mood' },
      { src: 'media/projects/aura/screenshots/aura-library-desktop.png', caption: 'Curated collections' },
      { src: 'media/projects/aura/screenshots/aura-signup-desktop.png', caption: 'Create your Aura' },
      { src: 'media/projects/aura/screenshots/aura-login-desktop.png', caption: 'Sign in with Spotify or email' },
    ],
  },
  { name: 'Wearlo', note: 'Digital closet', href: 'https://wearlo.vercel.app/' },
  { name: 'EatZy', href: 'https://eatzy-eight.vercel.app/home' },
  { name: 'SRDC', href: 'https://github.com/Pinkesh2905/SRDC' },
];

/** @type {SkillGroup[]} */
export const skills = [
  { group: 'SQL', items: ['MySQL on AWS RDS (joins, GROUP BY, subqueries, indexes)'] },
  { group: 'Dashboards & reporting', items: ['Looker Studio', 'Power BI (basic)', 'Excel', 'Google Sheets'] },
  { group: 'Python', items: ['Pandas', 'NumPy', 'Matplotlib'] },
  { group: 'Software development', items: ['Django', 'Next.js', 'PostgreSQL', 'Git/GitHub'] },
  { group: 'AI tools', items: ['Claude Code (building apps and data tools)', 'Claude API and MCP servers', 'Claude', 'ChatGPT', 'Gemini'] },
  { group: 'Tools', items: ['Clappia (no-code apps)'] },
];

/** Four short lines for the home-screen "Skills" widget. */
export const skillsWidget = ['SQL', 'Looker Studio', 'Python · Django', 'Claude Code'];

export const education = {
  degrees: [
    {
      name: 'MCA',
      school: 'CMPICA, CHARUSAT University',
      years: '2024–2026',
      cgpa: 'CGPA 8.08',
    },
    {
      name: 'B.Sc. Computer Applications & IT',
      school: 'Shri D.N. Institute of Computer Applications, Anand (Sardar Patel University)',
      years: '2021–2024',
      cgpa: 'CGPA 8.95',
    },
  ],
  certification: {
    name: 'Google Data Analytics Professional Certificate',
    href: 'https://drive.google.com/file/d/1iCb_WYSOHj95oBcwHdvLXbSy4W3SVazw/view?usp=sharing',
  },
};

/** Home-screen app grid, in display order. `type: 'app'` opens a screen; `link` opens a URL. */
export const apps = [
  { id: 'about', label: 'About', type: 'app', icon: 'user', gradient: 'linear-gradient(160deg,#fb7185,#e11d48)' },
  { id: 'experience', label: 'Experience', type: 'app', icon: 'briefcase', gradient: 'linear-gradient(160deg,#38bdf8,#2563eb)' },
  { id: 'projects', label: 'Projects', type: 'app', icon: 'folder-kanban', gradient: 'linear-gradient(160deg,#a78bfa,#6d28d9)' },
  { id: 'skills', label: 'Skills', type: 'app', icon: 'wrench', gradient: 'linear-gradient(160deg,#fbbf24,#ea580c)' },
  { id: 'education', label: 'Education', type: 'app', icon: 'graduation-cap', gradient: 'linear-gradient(160deg,#34d399,#047857)' },
  { id: 'resume', label: 'Resume', type: 'link', icon: 'file-text', gradient: 'linear-gradient(160deg,#94a3b8,#334155)', href: identity.resume },
  { id: 'contact', label: 'Contact', type: 'app', icon: 'mail', gradient: 'linear-gradient(160deg,#4ade80,#16a34a)' },
  { id: 'terminal', label: 'Terminal', type: 'app', icon: 'terminal', gradient: 'linear-gradient(160deg,#52525b,#09090b)' },
  { id: 'github', label: 'GitHub', type: 'link', brand: 'github', gradient: 'linear-gradient(160deg,#3f3f46,#18181b)', href: identity.github },
  { id: 'linkedin', label: 'LinkedIn', type: 'link', brand: 'linkedin', gradient: 'linear-gradient(160deg,#38a3f5,#0a66c2)', href: identity.linkedin },
];

export const dock = [
  { id: 'phone', label: 'Call Pinkesh', icon: 'phone', gradient: 'linear-gradient(160deg,#4ade80,#16a34a)', href: identity.phoneHref },
  { id: 'mail', label: 'Email Pinkesh', icon: 'mail', gradient: 'linear-gradient(160deg,#38bdf8,#2563eb)', href: `mailto:${identity.email}` },
  { id: 'linkedin', label: 'LinkedIn', brand: 'linkedin', gradient: 'linear-gradient(160deg,#38a3f5,#0a66c2)', href: identity.linkedin, external: true },
  { id: 'resume', label: 'Resume (PDF)', icon: 'file-text', gradient: 'linear-gradient(160deg,#94a3b8,#334155)', href: identity.resume, external: true },
];
