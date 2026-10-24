import {readFileSync, rmSync} from 'node:fs';
import {defineConfig} from 'vite';

// Production release: the landing only (no settings page), 3D and per-browser options compiled out
// (__HOSTING__), regular separate files with hashed names so the server can cache them for long.
// Relative base: the folder works at a domain root or in a subfolder.

// Forms post to the PHP handler that ships next to the page (api/lead.php → Bitrix24); set another address to override
process.env.VITE_LEAD_ENDPOINT ||= '/api/lead.php';
// Cookie-notice choices are recorded by api/consent.php (consent journal)
process.env.VITE_CONSENT_ENDPOINT ||= '/api/consent.php';

export const SITE_URL = 'https://customsleader.ru/';

// Clean-param: Yandex treats addresses that differ only in ad tags as one page
const ROBOTS = `User-agent: *
Allow: /
Disallow: /api/

User-agent: Yandex
Allow: /
Disallow: /api/
Clean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term&yclid&gclid&ysclid

Sitemap: ${SITE_URL}sitemap.xml
`;

// Apache: hashed files in assets/ never change, so they are cached for a year; the page itself is always revalidated
const HTACCESS = `Options -Indexes
DirectorySlash Off

AddType application/manifest+json .webmanifest
AddType image/webp .webp
AddType font/woff2 .woff2

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/plain application/javascript image/svg+xml
</IfModule>

<IfModule mod_rewrite.c>
  RewriteEngine On
  # One address for the site: https://customsleader.ru, without www and http
  RewriteCond %{HTTP_HOST} ^www\\.customsleader\\.ru$ [NC]
  RewriteRule ^ https://customsleader.ru%{REQUEST_URI} [R=301,L]
  RewriteCond %{HTTP_HOST} ^customsleader\\.ru$ [NC]
  RewriteCond %{HTTPS} off
  RewriteCond %{HTTP:X-Forwarded-Proto} !https
  RewriteRule ^ https://customsleader.ru%{REQUEST_URI} [R=301,L]
  # Pages of the old site live on at their old addresses (src/oldPages.json), so their search weight stays.
  # Old office pages written in another letter case lead to the one address that is kept
  RewriteCond %{REQUEST_URI} !^/contacts/Moscow/?$
  RewriteRule ^contacts/moscow/?$ https://%{HTTP_HOST}/contacts/Moscow [R=301,L,NC]
  RewriteCond %{REQUEST_URI} !^/contacts/Vladimir/?$
  RewriteRule ^contacts/vladimir/?$ https://%{HTTP_HOST}/contacts/Vladimir [R=301,L,NC]
  # Short office addresses and service pages of the old site that have no page of their own
  RewriteRule ^(moscow)/?$ https://%{HTTP_HOST}/contacts/Moscow [R=301,L,NC]
  RewriteRule ^(vladimir)/?$ https://%{HTTP_HOST}/contacts/Vladimir [R=301,L,NC]
  RewriteRule ^(yaroslavl)/?$ https://%{HTTP_HOST}/contacts/yaroslavl [R=301,L,NC]
  RewriteRule ^form/?$ https://%{HTTP_HOST}/#request [R=301,L,NE]
  # Folders of the old structure have no page of their own: the matching block of the main page
  RewriteRule ^contacts/?$ https://%{HTTP_HOST}/#contacts [R=301,L,NE]
  RewriteRule ^(ekspedirovanie|category)/?$ https://%{HTTP_HOST}/#services [R=301,L,NE]
  RewriteRule ^front/ https://%{HTTP_HOST}/ [R=301,L]
  # Clean addresses: /about is served from about.html; /about/ and /about.html lead to /about
  RewriteCond %{ENV:REDIRECT_STATUS} ^$
  RewriteCond %{DOCUMENT_ROOT}/$1.html -f
  RewriteRule ^(.+?)(/|\\.html)$ https://%{HTTP_HOST}/$1 [R=301,L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{DOCUMENT_ROOT}/$1.html -f
  RewriteRule ^(.+)$ $1.html [L]
</IfModule>

<IfModule mod_headers.c>
  # Only customsleader.ru is indexed: the test domain and any other address carry noindex
  <If "%{HTTP_HOST} !~ /^(www\\.)?customsleader\\.ru$/i">
    Header always set X-Robots-Tag "noindex, nofollow"
  </If>
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
      // Share preview and logo for search engines: fixed names, the page and its markup point to them
      for(const name of ['og-image.jpg', 'logo.png']) this.emitFile({type:'asset', fileName:name, source:readFileSync(`seo/${name}`)});
      // config.php with the webhook is created on the server from the example and never shipped
      for(const [from, to] of [['lead.php', 'lead.php'], ['consent.php', 'consent.php'], ['config.example.php', 'config.example.php'], ['htaccess-api', '.htaccess']])
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

// Two passes: the browser build, then (--ssr) a Node build of src/entry-server.jsx that scripts/prerender.mjs
// uses to write the page's static HTML, markup and sitemap into release-candidate/site
export default defineConfig(({isSsrBuild}) => isSsrBuild ? {
  base:'./',
  define:{__HOSTING__:'true'},
  build:{outDir:'.prerender', emptyOutDir:true, rollupOptions:{input:'src/entry-server.jsx', output:{entryFileNames:'entry-server.js'}}},
} : {
  base:'./',
  define:{__HOSTING__:'true'},
  plugins:[releaseFiles()],
  build:{outDir:'release-candidate/site', emptyOutDir:true, modulePreload:false, cssCodeSplit:false,
    rollupOptions:{input:'index.html', output:{format:'iife', inlineDynamicImports:true}}},
});
