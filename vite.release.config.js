import {readFileSync, rmSync} from 'node:fs';
import {defineConfig} from 'vite';

// Production release: the landing only (no settings page), 3D and per-browser options compiled out
// (__HOSTING__), regular separate files with hashed names so the server can cache them for long.
// Relative base: the folder works at a domain root or in a subfolder.

// Forms post to the PHP handler that ships next to the page (api/lead.php → Bitrix24); set another address to override
process.env.VITE_LEAD_ENDPOINT ||= 'api/lead.php';

const ROBOTS = 'User-agent: *\nAllow: /\n';

// Apache: hashed files in assets/ never change, so they are cached for a year; the page itself is always revalidated
const HTACCESS = `AddType application/manifest+json .webmanifest
AddType image/webp .webp
AddType font/woff2 .woff2

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/plain application/javascript image/svg+xml
</IfModule>

<IfModule mod_headers.c>
  <FilesMatch "\\.html$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
  <If "%{REQUEST_URI} =~ m#/assets/#">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </If>
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
`;

// Assets that only the 3D scene used: the scene code is compiled out, but its ?url imports are still emitted
function releaseFiles(){
  return {
    name:'release-files',
    generateBundle(_, bundle){
      const code = Object.values(bundle).filter(f => f.type === 'chunk').map(f => f.code).join('\n');
      for(const [name, file] of Object.entries(bundle))
        if(file.type === 'asset' && name.endsWith('.geojson') && !code.includes(name.split('/').pop())) delete bundle[name];
      this.emitFile({type:'asset', fileName:'robots.txt', source:ROBOTS});
      this.emitFile({type:'asset', fileName:'.htaccess', source:HTACCESS});
      // config.php with the webhook is created on the server from the example and never shipped
      for(const [from, to] of [['lead.php', 'lead.php'], ['config.example.php', 'config.example.php'], ['htaccess-api', '.htaccess']])
        this.emitFile({type:'asset', fileName:`api/${to}`, source:readFileSync(`server/${from}`, 'utf8')});
    },
    // A module script is blocked when index.html is opened straight from disk (file://), so the page ships
    // a classic deferred script instead: it works from disk as well as from any server
    transformIndexHtml:{order:'post', handler:html => html
      .replace(/<script type="module" crossorigin src=/g, '<script defer src=')
      .replace(/<link rel="stylesheet" crossorigin href=/g, '<link rel="stylesheet" href=')},
    // public/ is copied as is, Finder's .DS_Store included
    closeBundle(){ rmSync('release-candidate/site/.DS_Store', {force:true}); },
  };
}

export default defineConfig({
  base:'./',
  define:{__HOSTING__:'true'},
  plugins:[releaseFiles()],
  build:{outDir:'release-candidate/site', emptyOutDir:true, modulePreload:false, cssCodeSplit:false,
    rollupOptions:{input:'index.html', output:{format:'iife', inlineDynamicImports:true}}},
});
