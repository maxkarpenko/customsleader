// SEO articles from articles/seo/*.md, parsed at build time (src/articleSource.js via vite.pages.js): the browser
// gets the list right away and an article's text only on that article's page
export {ARTICLES} from 'virtual:page-index';

// First published on the site; shown on each article and used in its Schema.org markup
export const ARTICLES_PUBLISHED = '2026-10-26';

export const ARTICLES_INDEX = {
  kind: 'articles',
  path: '/articles',
  title: 'Статьи о доставке и таможенном оформлении оборудования — КАСТОМС ЛИДЕР',
  description: 'Как подготовить импорт оборудования из Китая: документы, код ТН ВЭД, бюджет поставки, перевозка негабарита, доставка на удалённый объект и страхование груза.',
  h1: 'Статьи о доставке и растаможке оборудования',
  lead: 'Разбираем, что подготовить до заявки: документы, код ТН ВЭД, бюджет, способ перевозки и страхование груза.',
  blocks: [],
};
