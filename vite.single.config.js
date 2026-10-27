import {readFileSync} from 'node:fs';
import {defineConfig} from 'vite';
import {viteSingleFile} from 'vite-plugin-singlefile';
import pages from './vite.pages.js';

// Self-contained build: the landing page with all code, styles, fonts, images and the 3D
// scenes inlined into docs/index.html. GitHub Pages can serve it straight from the branch
// (Settings → Pages → Deploy from a branch → main /docs), and it also opens from disk.
// Site icons from public/ become data URIs so the single file needs nothing next to it.
const ICONS={'favicon.ico':'image/x-icon','icons/favicon-32x32.png':'image/png','icons/favicon-16x16.png':'image/png','icons/apple-touch-icon.png':'image/png'};
const inlineIcons=html=>Object.entries(ICONS).reduce((out,[file,type])=>out.replace(`%BASE_URL%${file}`,`data:${type};base64,${readFileSync(`public/${file}`).toString('base64')}`),html);

export default defineConfig({
  base:'./',
  publicDir:false,
  plugins:[
    pages(),
    viteSingleFile({removeViteModuleLoader:true}),
    {
      name:'single-file-head',
      transformIndexHtml:{order:'pre',handler:html=>inlineIcons(html.replace(/\s*<link rel="preload"[^>]*as="font"[^>]*>/g,''))
        // a copy for previews and presentations: search engines index only https://customsleader.ru
        .replace('</title>','</title>\n    <meta name="robots" content="noindex, nofollow" />')},
    },
  ],
  // published build: no settings page, so 3D and per-browser options are compiled out (see __HOSTING__ in App.jsx)
  define:{__HOSTING__:'true'},
  build:{outDir:'docs',emptyOutDir:true,assetsInlineLimit:100_000_000,rollupOptions:{input:'index.html'}},
});
