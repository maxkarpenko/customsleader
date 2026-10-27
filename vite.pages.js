import {readFileSync, readdirSync, statSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseArticles} from './src/articleSource.js';

// Page texts split by page. `virtual:page-index` lists the content pages (old-site pages, service pages, articles)
// with their address, titles and description; the text of each page is a module of its own, loaded by loadBody()
// on that page only. The server render (prerender) gets everything at once, so the static HTML stays complete.
const INDEX = 'virtual:page-index';
const BODY = 'virtual:page-body/';
// legal documents for the server render (policy pages); the browser loads them on demand instead
const LEGAL = 'virtual:legal-texts';
const LEGAL_FILES = {privacy: 'privacy-policy', 'personal-data': 'personal-data-policy', consent: 'consent', cookies: 'cookie-policy', analytics: 'analytics-consent'};
const SOURCES = ['src/oldPages.json', 'src/servicePages.js', 'articles/seo'];
// /contacts/moscow → contacts--moscow: the name of the page's text file in the build
const slug = path => path.slice(1).replace(/\//g, '--');

async function collectPages(root){
  const oldPages = JSON.parse(readFileSync(resolve(root, 'src/oldPages.json'), 'utf8'));
  // servicePages.js is a plain module: read it fresh (by modification time) so edits show up in dev
  const servicePath = resolve(root, 'src/servicePages.js');
  const {SERVICE_PAGES} = await import(`${pathToFileURL(servicePath).href}?v=${statSync(servicePath).mtimeMs}`);
  const dir = resolve(root, 'articles/seo');
  const files = readdirSync(dir).filter(f => /^\d.*\.md$/.test(f)).map(f => [f, readFileSync(resolve(dir, f), 'utf8')]);
  const articles = parseArticles(files, readFileSync(resolve(dir, 'README.md'), 'utf8'));
  return {OLD_PAGES: oldPages, SERVICE_PAGES, ARTICLES: articles};
}

export default function pagesPlugin(){
  let root = process.cwd();
  return {
    name: 'page-texts',
    configResolved(config){ root = config.root; },
    resolveId(id){ if(id === INDEX || id === LEGAL || id.startsWith(BODY)) return '\0' + id; },
    async load(id, options){
      if(id === '\0' + LEGAL) return `export default ${options?.ssr ? JSON.stringify(Object.fromEntries(Object.entries(LEGAL_FILES).map(([type, name]) => [type, readFileSync(resolve(root, `src/legal/${name}.md`), 'utf8')]))) : '{}'};`;
      if(!id.startsWith('\0virtual:page-')) return;
      // files only (a folder would be taken for a module): the page sources and every article
      const articleDir = resolve(root, 'articles/seo');
      for(const f of ['src/oldPages.json', 'src/servicePages.js'].map(f => resolve(root, f)).concat(readdirSync(articleDir).filter(f => f.endsWith('.md')).map(f => resolve(articleDir, f))))
        this.addWatchFile(f);
      const groups = await collectPages(root);
      const all = Object.values(groups).flat();
      if(id === '\0' + INDEX){
        // server render: the full pages, nothing to load later
        if(options?.ssr) return Object.entries(groups).map(([name, list]) => `export const ${name} = ${JSON.stringify(list)};`).join('\n') + '\nexport const loadBody = async () => {};';
        const meta = list => JSON.stringify(list.map(({blocks, ...page}) => page));
        const loaders = all.map(page => `${JSON.stringify(page.path)}: () => import(${JSON.stringify(BODY + slug(page.path))})`).join(',\n  ');
        return `${Object.entries(groups).map(([name, list]) => `export const ${name} = ${meta(list)};`).join('\n')}
const loaders = {
  ${loaders}
};
// fills page.blocks with the page's text (a separate file in the build)
export const loadBody = async page => { if(page && !page.blocks && loaders[page.path]) page.blocks = (await loaders[page.path]()).default; };`;
      }
      const page = all.find(p => slug(p.path) === id.slice(('\0' + BODY).length));
      return `export default ${JSON.stringify(page ? page.blocks : [])};`;
    },
    // dev: a change in a page source reloads the page with fresh texts
    handleHotUpdate({file, server}){
      if(!SOURCES.some(s => file.startsWith(resolve(root, s)))) return;
      for(const mod of server.moduleGraph.idToModuleMap.values()) if(mod.id?.startsWith('\0virtual:page-')) server.moduleGraph.invalidateModule(mod);
      server.ws.send({type: 'full-reload'});
      return [];
    },
  };
}
