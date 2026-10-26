// Release build, last step: puts the page's full text, Schema.org markup, share tags and the sitemap into
// release-candidate/site, so search engines and AI crawlers that do not run JavaScript still read the page.
// Visitors see no difference: the prerendered copy stays hidden until React draws the live page over it.
import {readFileSync, writeFileSync, rmSync, cpSync, readdirSync, mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {SITE_URL as SITE} from '../vite.release.config.js';

const OUT = 'release-candidate/site';
const page = readFileSync(`${OUT}/index.html`, 'utf8');

// Browser APIs the page reads while rendering. A saved cookie choice keeps the cookie notice out of the copy.
const consentVersion = readFileSync('src/siteConfig.js', 'utf8').match(/COOKIE_CONSENT_VERSION='([^']+)'/)[1];
const saved = {'cookie-consent': JSON.stringify({v: consentVersion, analytics: false})};
Object.defineProperty(globalThis, 'localStorage', {configurable: true, value: {getItem: k => saved[k] ?? null, setItem(){}, removeItem(){}}});
globalThis.matchMedia = () => ({matches: false, addEventListener(){}, removeEventListener(){}});

const {render, ROUTES} = await import(new URL('../.prerender/entry-server.js', import.meta.url));
// The Node build writes asset addresses from the root (/assets/…); the site uses relative ones so it also works in a subfolder
const renderPage = (office, path) => {
  const html = render(office, path).replace(/(src|href|srcset)="\/assets\//g, '$1="./assets/');
  if(!html.includes('<h1')) throw new Error(`Prerender: ${path || 'main'} page rendered without its heading`);
  return html;
};
const body = renderPage();
// Every other page: the old site's pages at their old addresses, the articles contents and the articles
const routes = ROUTES;
const ARTICLES_PUBLISHED = readFileSync('src/articles.js', 'utf8').match(/ARTICLES_PUBLISHED = '([^']+)'/)[1];

// Offices from the site config (plain data, read without running the browser bundle)
const {OFFICES, HEAD_OFFICE} = await import(new URL('../src/siteConfig.js', import.meta.url));
const branches = Object.keys(OFFICES).filter(k => k !== HEAD_OFFICE);

// Schema.org: the company, its founder, services and FAQ, taken from the same content the page shows
const content = JSON.parse(readFileSync('src/content.json', 'utf8'));
const text = s => String(s || '').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').trim();
const title = page.match(/<title>([^<]*)<\/title>/)[1];
const description = page.match(/<meta name="description" content="([^"]*)"/)[1];
const ORG = `${SITE}#organization`;
const postal = o => ({'@type': 'PostalAddress', streetAddress: o.street, addressLocality: o.city, addressRegion: o.region, ...(o.postalCode ? {postalCode: o.postalCode} : {}), addressCountry: 'RU'});

const graph = [
  {
    '@type': 'LocalBusiness',
    '@id': ORG,
    name: 'КАСТОМС ЛИДЕР',
    legalName: 'ООО «КАСТОМС ЛИДЕР»',
    url: SITE,
    logo: `${SITE}logo.png`,
    image: `${SITE}og-image.jpg`,
    description,
    telephone: '+7 903 879-20-20',
    email: 'info@customsleader.ru',
    taxID: '3702195282',
    foundingDate: '2018',
    address: postal(OFFICES[HEAD_OFFICE]),
    areaServed: {'@type': 'Country', name: 'Россия'},
    // the offices in other cities, as branches of the company
    department: branches.map(k => ({
      '@type': 'LocalBusiness',
      '@id': `${SITE}#office-${k}`,
      name: `КАСТОМС ЛИДЕР — ${OFFICES[k].city}`,
      image: `${SITE}og-image.jpg`,
      telephone: '+7 903 879-20-20',
      email: 'info@customsleader.ru',
      address: postal(OFFICES[k]),
      parentOrganization: {'@id': ORG},
    })),
    contactPoint: {'@type': 'ContactPoint', telephone: '+7 903 879-20-20', email: 'info@customsleader.ru', contactType: 'customer service', availableLanguage: 'ru'},
    founder: {'@id': `${SITE}#founder`},
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Логистика и таможенное оформление',
      itemListElement: content.services.map(s => ({'@type': 'Offer', itemOffered: {'@type': 'Service', name: text(s.title), description: text(s.text), provider: {'@id': ORG}}})),
    },
  },
  {
    '@type': 'Person',
    '@id': `${SITE}#founder`,
    name: 'Хасанов Эдуард Ряфхатович',
    jobTitle: 'Основатель и руководитель компании',
    description: '13 лет в таможенных органах',
    worksFor: {'@id': ORG},
  },
  {'@type': 'WebSite', '@id': `${SITE}#website`, url: SITE, name: 'КАСТОМС ЛИДЕР', inLanguage: 'ru-RU', publisher: {'@id': ORG}},
  {'@type': 'WebPage', '@id': `${SITE}#webpage`, url: SITE, name: title, description, inLanguage: 'ru-RU', isPartOf: {'@id': `${SITE}#website`}, about: {'@id': ORG}, primaryImageOfPage: `${SITE}og-image.jpg`},
  {
    '@type': 'FAQPage',
    '@id': `${SITE}#faq`,
    mainEntity: content.faq.map(f => ({'@type': 'Question', name: text(f.question), acceptedAnswer: {'@type': 'Answer', text: text(f.answer)}})),
  },
];
const ld = g => JSON.stringify({'@context': 'https://schema.org', '@graph': g}).replace(/</g, '\\u003c');

const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const headFor = ({url, title, description, graph}) => `
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="КАСТОМС ЛИДЕР" />
    <meta property="og:locale" content="ru_RU" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:image" content="${SITE}og-image.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Горнопроходческий комплекс NORDA в цехе завода перед отгрузкой" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${SITE}og-image.jpg" />
    <script type="application/ld+json">${ld(graph)}</script>
  </head>`;

// Hidden for visitors with JavaScript until React has drawn the page (or after 5 s, should the script be slow);
// crawlers that do not run scripts never get the class, so the text is plain and visible to them
const boot = `<meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>.prerender-wait #root[data-prerendered]{display:none}</style>
    <script>document.documentElement.classList.add('prerender-wait');setTimeout(function(){document.documentElement.classList.remove('prerender-wait')},5000)</script>`;

// One HTML file per address. A page at /a/b is served from a/b.html (see .htaccess), so its relative paths
// climb back to the site root: ./assets/… becomes ../assets/…
const write = ({path, title: t, description: d, content: c, graph: g}) => {
  const url = path === '/' ? SITE : SITE + path.slice(1);
  const depth = path === '/' ? 0 : path.split('/').length - 2;
  let html = page
    .replace('<meta name="viewport" content="width=device-width, initial-scale=1.0" />', boot)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(t).replace(/&quot;/g, '"')}</title>`)
    .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${esc(d)}"`)
    .replace('</head>', headFor({url, title: t, description: d, graph: g}))
    .replace('<div id="root"></div>', `<div id="root" data-prerendered>${c}</div>`);
  if(!html.includes('data-prerendered>') || !html.includes('prerender-wait')) throw new Error(`Prerender: ${path} did not get the expected shape`);
  if(depth) html = html.replace(/(src|href)="\.\//g, `$1="${'../'.repeat(depth)}`);
  const file = path === '/' ? `${OUT}/index.html` : `${OUT}${path}.html`;
  mkdirSync(dirname(file), {recursive: true});
  writeFileSync(file, html);
  return url;
};
const urls = [write({path: '/', title, description, content: body, graph})];
for(const p of routes){
  const url = SITE + p.path.slice(1);
  const office = p.path.toLowerCase().startsWith('/contacts/') ? p.path.split('/').pop().toLowerCase() : undefined;
  const content = renderPage(office, p.path);
  if(!content.includes(p.h1.replace(/&/g, '&amp;').slice(0, 20))) throw new Error(`Prerender: ${p.path} is missing its heading`);
  const d = p.description && p.description.length > 40 ? p.description : `${p.h1} — КАСТОМС ЛИДЕР: таможенное оформление и доставка грузов из Китая и других стран.`;
  const crumbs = [{name: 'Главная', item: SITE}];
  if(p.kind === 'article') crumbs.push({name: 'Статьи', item: `${SITE}articles`});
  crumbs.push({name: p.kind === 'articles' ? 'Статьи' : p.h1, item: url});
  const page = p.kind === 'article'
    ? {'@type': 'Article', '@id': `${url}#article`, mainEntityOfPage: url, url, headline: p.h1, name: p.title, description: d, inLanguage: 'ru-RU',
       datePublished: ARTICLES_PUBLISHED, dateModified: ARTICLES_PUBLISHED, author: {'@id': ORG}, publisher: {'@id': ORG}, image: `${SITE}og-image.jpg`, isPartOf: {'@id': `${SITE}#website`}}
    : {'@type': p.kind === 'articles' ? 'CollectionPage' : 'WebPage', '@id': `${url}#webpage`, url, name: p.title, description: d, inLanguage: 'ru-RU', isPartOf: {'@id': `${SITE}#website`}, about: {'@id': ORG}};
  urls.push(write({path: p.path, title: p.title, description: d, content, graph: [
    graph[0], graph[2], page,
    {'@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({'@type': 'ListItem', position: i + 1, ...c}))},
  ]}));
}

const today = new Date().toISOString().slice(0, 10);
writeFileSync(`${OUT}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u, i) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod><priority>${i ? '0.6' : '1.0'}</priority></url>`).join('\n')}
</urlset>
`);

// Test stand copy (release-candidate/staging): the same site with noindex in every page. The tag sits in the HTML
// itself because the hosting's nginx serves pages without applying .htaccess headers. Never upload it to customsleader.ru.
const STAGING = 'release-candidate/staging';
rmSync(STAGING, {recursive: true, force: true});
cpSync(OUT, STAGING, {recursive: true});
for(const f of readdirSync(STAGING, {recursive: true}).filter(f => f.endsWith('.html'))){
  const file = `${STAGING}/${f}`;
  writeFileSync(file, readFileSync(file, 'utf8').replace('<meta charset="UTF-8" />', '<meta charset="UTF-8" />\n    <meta name="robots" content="noindex, nofollow" />'));
}
writeFileSync(`${STAGING}/robots.txt`, 'User-agent: *\nAllow: /\n');

rmSync('.prerender', {recursive: true, force: true});
console.log(`prerendered ${urls.length} pages (main: ${Math.round(body.length / 1024)} KB of HTML), sitemap ${today}`);
