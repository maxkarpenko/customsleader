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
// Every other page: the old site's pages at their old addresses, the cases, the articles contents and the articles
const routes = ROUTES;
const ARTICLES_PUBLISHED = readFileSync('src/articles.js', 'utf8').match(/ARTICLES_PUBLISHED = '([^']+)'/)[1];

// Offices from the site config (plain data, read without running the browser bundle)
const {OFFICES, HEAD_OFFICE, OFFICE_HOURS} = await import(new URL('../src/siteConfig.js', import.meta.url));
// every office works daily on the same hours
const hours = {'@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: OFFICE_HOURS.opens, closes: OFFICE_HOURS.closes};
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
    logo: `${SITE}media/logo.png`,
    image: `${SITE}media/og-image.jpg`,
    description,
    telephone: '+7 903 879-20-20',
    email: 'info@customsleader.ru',
    taxID: '3702195282',
    foundingDate: '2018',
    address: postal(OFFICES[HEAD_OFFICE]),
    openingHoursSpecification: hours,
    areaServed: {'@type': 'Country', name: 'Россия'},
    // the offices in other cities, as branches of the company
    department: branches.map(k => ({
      '@type': 'LocalBusiness',
      '@id': `${SITE}#office-${k}`,
      name: `КАСТОМС ЛИДЕР — ${OFFICES[k].city}`,
      image: `${SITE}media/og-image.jpg`,
      telephone: '+7 903 879-20-20',
      email: 'info@customsleader.ru',
      address: postal(OFFICES[k]),
      openingHoursSpecification: hours,
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
  {'@type': 'WebPage', '@id': `${SITE}#webpage`, url: SITE, name: title, description, inLanguage: 'ru-RU', isPartOf: {'@id': `${SITE}#website`}, about: {'@id': ORG}, primaryImageOfPage: `${SITE}media/og-image.jpg`},
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
    <meta property="og:image" content="${SITE}media/og-image.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Горнопроходческий комплекс NORDA в цехе завода перед отгрузкой" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${SITE}media/og-image.jpg" />
    <script type="application/ld+json">${ld(graph)}</script>
  </head>`;

// Hidden for visitors with JavaScript until React has drawn the page (or after 5 s, should the script be slow);
// crawlers that do not run scripts never get the class, so the text is plain and visible to them
const boot = `<meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>.prerender-wait #root[data-prerendered]{display:none}</style>
    <script>document.documentElement.classList.add('prerender-wait');setTimeout(function(){document.documentElement.classList.remove('prerender-wait')},5000)</script>`;

// One HTML file per address. The main page is index.html; every other page lives in pages/ (a page at /a/b is
// pages/a/b.html, see .htaccess) but is opened at its own address, so its relative paths climb back from the
// address, not from the file: ./assets/… becomes ../assets/…
// A page's own text (and a policy page's document) is a separate script: the page asks for it together with the
// shared code (modulepreload) instead of after it
const jsFiles = dir => { try { return readdirSync(`${OUT}/assets/js/${dir}`); } catch { return []; } };
const chunkOf = (dir, name) => jsFiles(dir).find(f => f.startsWith(`${name}-`) && f.slice(name.length + 1).length === 11 && f.endsWith('.js'));
const preloadsFor = path => {
  const files = [];
  const own = path !== '/' && chunkOf('pages', path.slice(1).replace(/\//g, '--'));
  if(own) files.push(`pages/${own}`);
  const legal = {'/policy/privacy': 'privacy-policy', '/policy/personal-data': 'personal-data-policy'}[path];
  if(legal && chunkOf('', legal)) files.push(chunkOf('', legal));
  return files.map(f => `    <link rel="modulepreload" href="./assets/js/${f}" />\n`).join('');
};
const write = ({path, title: t, description: d, content: c, graph: g, notFound = false}) => {
  const url = path === '/' ? SITE : SITE + path.slice(1);
  const depth = path === '/' ? 0 : path.split('/').length - 2;
  let html = page
    .replace('<meta name="viewport" content="width=device-width, initial-scale=1.0" />', boot)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(t).replace(/&quot;/g, '"')}</title>`)
    .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${esc(d)}"`)
    .replace('</head>', headFor({url, title: t, description: d, graph: g}).replace('  </head>', preloadsFor(path) + '  </head>'))
    .replace('<div id="root"></div>', `<div id="root" data-prerendered>${c}</div>`);
  if(!html.includes('data-prerendered>') || !html.includes('prerender-wait')) throw new Error(`Prerender: ${path} did not get the expected shape`);
  if(depth) html = html.replace(/(src|href)="\.\//g, `$1="${'../'.repeat(depth)}`);
  // 404.html is served at whatever address was missing, so its files are linked from the site root,
  // it is kept out of the index, and it tells the script which page it is
  if(notFound) html = html.replace(/(src|href)="\.\//g, '$1="/')
    .replace('<meta charset="UTF-8" />', '<meta charset="UTF-8" />\n    <meta name="robots" content="noindex" />')
    .replace('<div id="root" data-prerendered>', '<div id="root" data-prerendered data-route="/404">')
    .replace(/\n    <link rel="canonical"[^\n]*/, '');
  // Yandex Webmaster checks the main page of customsleader.ru: the verification tag goes there only
  if(path === '/') html = html.replace('<meta charset="UTF-8" />', '<meta charset="UTF-8" />\n    <meta name="yandex-verification" content="f191c030827b730e" />');
  const file = path === '/' ? `${OUT}/index.html` : `${OUT}/pages${path}.html`;
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
  if(p.kind === 'case') crumbs.push({name: 'Наши проекты', item: `${SITE}cases`});
  crumbs.push({name: p.kind === 'articles' ? 'Статьи' : p.crumb || p.h1, item: url});
  const page = p.kind === 'article' || p.kind === 'case'
    ? {'@type': 'Article', '@id': `${url}#article`, mainEntityOfPage: url, url, headline: p.h1, name: p.title, description: d, inLanguage: 'ru-RU',
       datePublished: ARTICLES_PUBLISHED, dateModified: ARTICLES_PUBLISHED, author: {'@id': ORG}, publisher: {'@id': ORG}, image: `${SITE}media/og-image.jpg`, isPartOf: {'@id': `${SITE}#website`}}
    : {'@type': p.kind === 'articles' ? 'CollectionPage' : 'WebPage', '@id': `${url}#webpage`, url, name: p.title, description: d, inLanguage: 'ru-RU', isPartOf: {'@id': `${SITE}#website`}, about: {'@id': ORG}};
  // An office page describes that office as a place of its own: address, map, page; the company stays its parent
  const officeKey = office && OFFICES[office] ? office : null;
  const officeId = officeKey && `${SITE}#office-${officeKey}`;
  const mapUrl = o => o.map || `https://yandex.ru/maps/?text=${encodeURIComponent(o.address.replace(/\u00a0/g, ' ').replace(/,\s*офис\s*\S+$/, ''))}`;
  const officeNode = officeKey ? [{
    '@type': 'LocalBusiness', '@id': officeId, name: `КАСТОМС ЛИДЕР — ${OFFICES[officeKey].city}${officeKey === HEAD_OFFICE ? ', головной офис' : ''}`,
    url, image: `${SITE}media/og-image.jpg`, telephone: '+7 903 879-20-20', email: 'info@customsleader.ru',
    address: postal(OFFICES[officeKey]), openingHoursSpecification: hours, hasMap: mapUrl(OFFICES[officeKey]), parentOrganization: {'@id': ORG},
  }] : [];
  // on an office page the company lists its offices by reference, the full node is the office's own
  const company = officeKey ? {...graph[0], department: graph[0].department.map(d => ({'@id': d['@id']}))} : graph[0];
  if(officeKey) page.about = {'@id': officeId};
  // a questions section on the page (H2 with "вопрос", H3 questions, paragraph answers) goes into FAQPage markup
  const qa = [];
  const faqAt = (p.blocks || []).findIndex(b => b.t === 'h2' && /вопрос/i.test(b.text));
  if(faqAt > -1) for(let i = faqAt + 1; i < p.blocks.length && p.blocks[i].t !== 'h2'; i++){
    if(p.blocks[i].t !== 'h3') continue;
    // the answer is every paragraph up to the next question
    const answer = [];
    for(let j = i + 1; j < p.blocks.length && p.blocks[j].t === 'p'; j++) answer.push(text(p.blocks[j].html));
    if(answer.length) qa.push({'@type': 'Question', name: p.blocks[i].text, acceptedAnswer: {'@type': 'Answer', text: answer.join(' ')}});
  }
  const faq = qa.length ? [{'@type': 'FAQPage', '@id': `${url}#faq`, mainEntity: qa}] : [];
  // service pages also describe the service itself
  const service = p.kind === 'service' ? [{'@type': 'Service', '@id': `${url}#service`, name: p.h1, description: d, provider: {'@id': ORG}, areaServed: {'@type': 'Country', name: 'Россия'}, url}] : [];
  if(p.kind === 'notfound'){ write({path: p.path, title: p.title, description: d, content, graph: [graph[0], graph[2]], notFound: true}); continue; }
  urls.push(write({path: p.path, title: p.title, description: d, content, graph: [
    company, graph[2], page, ...officeNode, ...service, ...faq,
    {'@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({'@type': 'ListItem', position: i + 1, ...c}))},
  ]}));
}

// llms.txt: a short plain description of the company for AI search, with links to the pages that answer most questions
const pageList = kinds => routes.filter(r => kinds.includes(r.kind || 'page') && r.kind !== 'notfound' && r.kind !== 'legal' && !['/policy/privacy'].includes(r.path))
  .map(r => `- [${r.h1.trim()}](${SITE}${r.path.slice(1)}): ${(r.description || '').trim()}`).join('\n');
const officeLines = Object.entries(OFFICES).map(([k, o]) => `- ${o.city}${k === HEAD_OFFICE ? ' (головной офис)' : ''}: ${o.address.replace(/\u00a0/g, ' ')} — ${SITE}contacts/${k}`).join('\n');
writeFileSync(`${OUT}/llms.txt`, `# КАСТОМС ЛИДЕР

> Таможенный брокер (таможенный представитель) и логистическая компания: таможенное оформление импорта и экспорта, доставка промышленного оборудования, станков, производственных линий и негабарита из Китая и других стран по России, в том числе на Крайний Север и по зимникам. ООО «КАСТОМС ЛИДЕР», ИНН 3702195282, работает с 2018 года.

- Основатель — Эдуард Хасанов, 13 лет в таможенных органах.
- Ответственность экспедитора застрахована на 16 млн руб. (СПАО «Ингосстрах»).
- Таможенное оформление — от 2 000 ₽ за декларацию; расчёт поставки — от 1 рабочего дня.
- Не работаем с военными грузами, продуктами питания, табаком и алкоголем, с физическими лицами.
- Телефон, WhatsApp, Telegram: +7 903 879-20-20. Почта: info@customsleader.ru. Офисы работают ежедневно, ${OFFICE_HOURS.opens}–${OFFICE_HOURS.closes}.

## Офисы

${officeLines}

## Услуги

- [Главная: доставка и растаможка оборудования из Китая](${SITE}): услуги, кейсы, команда, частые вопросы.
${pageList(['service', 'request'])}
${pageList(['page']).split('\n').filter(l => /tamozhennoe-oformlenie|i-logistika|ekspedirovanie|izgotovlenie-ecp|dostavka-dlya-sellerov/.test(l)).join('\n')}

## Кейсы

${pageList(['case'])}

## Статьи

${pageList(['article'])}

## О компании

${pageList(['page']).split('\n').filter(l => /\/(about|clients|reviews|documents|cases)\)/.test(l)).join('\n')}
`);

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
  // the test stand copy does not carry the production verification tag
  writeFileSync(file, readFileSync(file, 'utf8').replace(/\n    <meta name="yandex-verification"[^>]*>/, '').replace('<meta charset="UTF-8" />', '<meta charset="UTF-8" />\n    <meta name="robots" content="noindex, nofollow" />'));
}
writeFileSync(`${STAGING}/robots.txt`, 'User-agent: *\nAllow: /\n');

rmSync('.prerender', {recursive: true, force: true});
console.log(`prerendered ${urls.length} pages (main: ${Math.round(body.length / 1024)} KB of HTML), sitemap ${today}`);
