import {readFileSync} from 'node:fs';
import {defineConfig} from 'vite';
import {viteSingleFile} from 'vite-plugin-singlefile';

// Self-contained build: the landing page with all code, styles, fonts, images and the 3D
// scenes inlined into docs/index.html. GitHub Pages can serve it straight from the branch
// (Settings → Pages → Deploy from a branch → main /docs), and it also opens from disk.
// Site icons from public/ become data URIs so the single file needs nothing next to it.
const ICONS={'favicon-32x32.png':'image/png','favicon-16x16.png':'image/png','apple-touch-icon.png':'image/png','safari-pinned-tab.svg':'image/svg+xml'};
const inlineIcons=html=>Object.entries(ICONS).reduce((out,[file,type])=>out.replace(`%BASE_URL%${file}`,`data:${type};base64,${readFileSync(`public/${file}`).toString('base64')}`),html);

export default defineConfig({
  base:'./',
  publicDir:false,
  plugins:[
    viteSingleFile({removeViteModuleLoader:true}),
    {
      name:'single-file-head',
      transformIndexHtml:{order:'pre',handler:html=>inlineIcons(html.replace(/\s*<link rel="preload"[^>]*as="font"[^>]*>/g,''))},
    },
  ],
  build:{outDir:'docs',emptyOutDir:true,assetsInlineLimit:100_000_000,rollupOptions:{input:'index.html'}},
});
