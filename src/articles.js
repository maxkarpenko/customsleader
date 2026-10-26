// SEO articles: Markdown sources in articles/seo (front matter: slug, title, description) become pages at
// /articles/<slug>, plus the /articles contents page. Links between the .md files turn into site addresses,
// and "Читайте также" follows the material map in articles/seo/README.md.
const FILES = import.meta.glob('../articles/seo/[0-9]*.md', {query: '?raw', import: 'default', eager: true});
const README = Object.values(import.meta.glob('../articles/seo/README.md', {query: '?raw', import: 'default', eager: true}))[0] || '';

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fileName = path => path.split('/').pop();

const parsed = Object.entries(FILES).sort(([a], [b]) => a.localeCompare(b)).map(([path, raw]) => {
  const [, front = '', body = raw] = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) || [];
  const meta = Object.fromEntries(front.split('\n').map(l => l.match(/^(\w+):\s*(.*)$/)).filter(Boolean).map(([, k, v]) => [k, v.replace(/^"(.*)"$/, '$1')]));
  return {file: fileName(path), num: parseInt(fileName(path), 10), meta, body};
});
const slugOf = Object.fromEntries(parsed.map(a => [a.file, a.meta.slug]));

const href = u => slugOf[u] ? `/articles/${slugOf[u]}` : u === '/#hero-request' ? '#hero-request' : u;
const inline = s => esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => {
    const to = href(u.replace(/&amp;/g, '&'));
    return /^https?:/.test(to) ? `<a href="${esc(to)}" target="_blank" rel="noopener">${t}</a>` : `<a href="${esc(to)}">${t}</a>`;
  });

// Markdown blocks → the same block shapes the old-site pages use (h2, h3, p, ul, ol)
function blocks(md){
  const out = [];
  for(const chunk of md.trim().split(/\n{2,}/)){
    const lines = chunk.split('\n');
    if(chunk.startsWith('# ')) continue;
    if(chunk.startsWith('### ')) out.push({t: 'h3', text: chunk.slice(4).trim()});
    else if(chunk.startsWith('## ')) out.push({t: 'h2', text: chunk.slice(3).trim()});
    else if(lines.every(l => /^- /.test(l))) out.push({t: 'ul', items: lines.map(l => inline(l.slice(2)))});
    else if(lines.every(l => /^\d+\. /.test(l))) out.push({t: 'ol', items: lines.map(l => inline(l.replace(/^\d+\. /, '')))});
    else out.push({t: 'p', html: inline(lines.join(' '))});
  }
  return out;
}

// "Внутренние переходы" column of the README table: article number → related article numbers
const related = Object.fromEntries([...README.matchAll(/^\|\s*(\d+)\s*\|.*\|\s*([\d,\s]+)\s*\|\s*$/gm)].map(([, n, list]) => [+n, list.split(',').map(x => +x.trim()).filter(Boolean)]));

// First published on the site; shown on each article and used in its Schema.org markup
export const ARTICLES_PUBLISHED = '2026-10-26';

export const ARTICLES = parsed.map(a => ({
  kind: 'article',
  path: `/articles/${a.meta.slug}`,
  title: a.meta.title,
  description: a.meta.description,
  h1: (a.body.match(/^# (.+)$/m) || [, a.meta.title])[1].trim(),
  blocks: blocks(a.body),
  related: (related[a.num] || []).map(n => parsed.find(p => p.num === n)).filter(Boolean).map(p => ({path: `/articles/${p.meta.slug}`, title: p.meta.title})),
}));

export const ARTICLES_INDEX = {
  kind: 'articles',
  path: '/articles',
  title: 'Статьи о доставке и таможенном оформлении оборудования — КАСТОМС ЛИДЕР',
  description: 'Как подготовить импорт оборудования из Китая: документы, код ТН ВЭД, бюджет поставки, перевозка негабарита, доставка на удалённый объект и страхование груза.',
  h1: 'Статьи о доставке и растаможке оборудования',
  lead: 'Разбираем, что подготовить до заявки: документы, код ТН ВЭД, бюджет, способ перевозки и страхование груза.',
  blocks: [],
};
