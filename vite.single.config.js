import {readFileSync} from 'node:fs';
import {defineConfig} from 'vite';
import {viteSingleFile} from 'vite-plugin-singlefile';

// Self-contained build: the landing page with all code, styles, fonts, images and the 3D
// scenes inlined into docs/index.html. GitHub Pages can serve it straight from the branch
// (Settings → Pages → Deploy from a branch → main /docs), and it also opens from disk.
const favicon=`data:image/svg+xml;base64,${readFileSync('public/favicon.svg').toString('base64')}`;

export default defineConfig({
  base:'./',
  publicDir:false,
  plugins:[
    viteSingleFile({removeViteModuleLoader:true}),
    {
      name:'single-file-head',
      transformIndexHtml:{order:'pre',handler:html=>html
        .replace(/\s*<link rel="preload"[^>]*as="font"[^>]*>/g,'')
        .replace('%BASE_URL%favicon.svg',favicon)},
    },
  ],
  build:{outDir:'docs',emptyOutDir:true,assetsInlineLimit:100_000_000,rollupOptions:{input:'index.html'}},
});
