// Static site generator: src/pages/*.html (with a small header block) + shared layout -> public/*.html
const fs = require('fs'), path = require('path');
const SITE = 'https://www.bc-compliance.co.uk';
const PAGES = path.join(__dirname, 'src/pages'), OUT = path.join(__dirname, 'public');
const forms = { appointment: require('./forms/appointment'), quote: require('./forms/quote') };

const NAV = [
  ['index.html', 'Home'], ['building-control.html', 'Building Control'], ['rbca.html', 'RBCA’s'],
  ['building-regulations.html', 'Building Regs'], ['how-it-works.html', 'How It Works'], ['appointment.html', 'Appointment'], ['contact.html', 'Contact'],
];

const icon = {
  people: '<svg class="ico" viewBox="0 0 64 64" fill="none" stroke="#89bee8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="26" cy="22" r="10"/><path d="M8 54c1-12 8-18 18-18s17 6 18 18"/><path d="M40 12a10 10 0 0 1 0 20"/><path d="M46 38c6 2 10 7 11 16"/></svg>',
  clarity: '<svg class="ico" viewBox="0 0 64 64" fill="none" stroke="#89bee8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14h44v28H30L18 52V42h-8z"/><path d="M20 24h24M20 32h14"/></svg>',
  projects: '<svg class="ico" viewBox="0 0 64 64" fill="none" stroke="#89bee8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 56V24l16-10v42"/><path d="M24 56V30l32-8v34"/><path d="M4 56h56"/><path d="M34 36h4M46 34h4M34 46h4M46 46h4"/></svg>',
  shield: '<svg class="ico" viewBox="0 0 64 64" fill="none" stroke="#89bee8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M32 6l20 8v16c0 14-9 23-20 28C21 53 12 44 12 30V14z"/><path d="M23 32l6 6 12-13"/></svg>',
  doc: '<svg class="ico" viewBox="0 0 64 64" fill="none" stroke="#89bee8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 6h22l12 12v40H16z"/><path d="M38 6v12h12"/><path d="M24 30h18M24 38h18M24 46h10"/></svg>',
  site: '<svg class="ico" viewBox="0 0 64 64" fill="none" stroke="#89bee8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 56h48"/><path d="M14 56V30l18-14 18 14v26"/><path d="M26 56V40h12v16"/></svg>',
  check: '<svg class="ico" viewBox="0 0 64 64" fill="none" stroke="#89bee8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="32" cy="32" r="24"/><path d="M20 33l8 8 16-17"/></svg>',
};

function parse(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const meta = {}; m[1].split('\n').forEach(l => { const i = l.indexOf(':'); meta[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
  return { meta, body: m[2] };
}
const expand = s => s.replace(/\{\{icon:(\w+)\}\}/g, (_, n) => icon[n] || '');

function layout(slug, meta, body) {
  const title = slug === 'index' ? meta.title : `${meta.title} | Blu Chip Compliance`;
  const url = `${SITE}/${slug === 'index' ? '' : slug + '.html'}`;
  const nav = NAV.map(([h, t]) => `<li><a href="${h}"${h === slug + '.html' ? ' aria-current="page"' : ''}>${t}</a></li>`).join('')
    + `<li><a class="cta" href="request-quote.html"${slug === 'request-quote' ? ' aria-current="page"' : ''}>Request a Quote</a></li>`;
  const ld = slug === 'index' ? `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'ProfessionalService', name: 'Blu Chip Compliance Ltd',
    description: 'Independent Registered Building Control Approver providing building control services across England & Wales.',
    url: SITE + '/', telephone: '+447775507073', email: 'info@bc-compliance.co.uk', areaServed: ['England', 'Wales'],
    logo: SITE + '/img/logo.png' })}</script>` : '';
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${meta.desc}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:title" content="${title}"><meta property="og:description" content="${meta.desc}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/img/logo.png">
<meta name="theme-color" content="#354253">
<link rel="icon" type="image/png" href="img/favicon.png">
<link rel="preload" href="fonts/montserrat-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="css/site.css">
${meta.noindex ? '<meta name="robots" content="noindex">' : ''}${ld}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header"><div class="wrap">
  <a class="brand" href="index.html" aria-label="Blu Chip Compliance – home"><img src="img/mark.png" alt="" width="46" height="34"><div><span>BLU CHIP</span><small>COMPLIANCE</small></div></a>
  <button class="menu-btn" aria-controls="nav" aria-expanded="false">MENU</button>
  <nav id="nav" aria-label="Main"><ul>${nav}</ul></nav>
</div></header>
<main id="main">
${expand(body)}
</main>
<footer class="site-footer"><div class="wrap">
  <div class="cols">
    <div><img src="img/logo.png" alt="Blu Chip Compliance – Registered Building Control Approver" width="150" style="background:#fff;padding:10px 14px;border-radius:8px">
      <p style="margin-top:16px">Independent building control services across England &amp; Wales.</p><div class="tag">INDEPENDENT. PROFESSIONAL. APPROACHABLE.</div></div>
    <div><h4>Get in touch</h4><ul>
      <li><a href="tel:+447775507073">07775 507073</a></li>
      <li><a href="mailto:info@bc-compliance.co.uk">info@bc-compliance.co.uk</a></li>
      <li>England &amp; Wales</li></ul></div>
    <div><h4>Quick links</h4><ul>
      <li><a href="request-quote.html">Request a quote</a></li><li><a href="appointment.html">Appointment form</a></li>
      <li><a href="rbca.html">What is an RBCA?</a></li><li><a href="building-regulations.html">Building regulations</a></li>
      <li><a href="how-it-works.html">How it works &amp; FAQs</a></li></ul></div>
  </div>
  <div class="fine"><span>© ${new Date().getFullYear()} Blu Chip Compliance Ltd. All rights reserved.</span>
    <span><a href="privacy.html">Privacy</a> &nbsp;|&nbsp; <a href="cookies.html">Cookies</a></span></div>
</div></footer>
<script src="js/site.js"></script>
${meta.form ? `<script src="js/cond.js"></script>
<script>window.FORM_DEF=${JSON.stringify(forms[meta.form]).replace(/</g, '\\u003c')};</script>
<script src="js/forms.js"></script>` : ''}
</body>
</html>
`;
}

const urls = [];
for (const f of fs.readdirSync(PAGES).filter(f => f.endsWith('.html'))) {
  const slug = f.replace(/\.html$/, ''); const { meta, body } = parse(path.join(PAGES, f));
  fs.writeFileSync(path.join(OUT, slug + '.html'), layout(slug, meta, body));
  if (!meta.noindex) urls.push(`${SITE}/${slug === 'index' ? '' : slug + '.html'}`);
}
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${SITE}/sitemap.xml\n`);
fs.copyFileSync(path.join(__dirname, 'forms/cond.js'), path.join(OUT, 'js/cond.js'));
console.log('Built', urls.length, 'pages');
