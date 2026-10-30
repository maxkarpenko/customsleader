# Local preview of release-candidate/site that answers like the hosting's .htaccess does:
# /about is served from pages/about.html, a missing address gets pages/404.html with the 404 status.
# Usage: python3 scripts/serve-release.py [port]
import http.server
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'release-candidate', 'site'))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def translate_path(self, path):
        local = super().translate_path(path)
        # /about is pages/about.html, as on the hosting
        rel = os.path.relpath(local, ROOT)
        page = os.path.join(ROOT, 'pages', rel + '.html')
        if rel != '.' and not os.path.isfile(local) and os.path.isfile(page):
            return page
        return local

    def do_GET(self):
        # /index.html leads to the main page, as on the hosting
        path, _, query = self.path.partition('?')
        target = None
        if path.lower() == '/index.html':
            target = '/'
        # no slash at the end, except the main page and real folders
        elif len(path) > 1 and path.endswith('/') and not os.path.isdir(super().translate_path(path)):
            target = path.rstrip('/')
        if target:
            self.send_response(301)
            self.send_header('Location', target + ('?' + query if query else ''))
            self.send_header('Content-Length', '0')
            self.end_headers()
            return
        super().do_GET()

    def send_error(self, code, message=None, explain=None):
        page = os.path.join(ROOT, 'pages', '404.html')
        if code != 404 or not os.path.exists(page):
            return super().send_error(code, message, explain)
        with open(page, 'rb') as f:
            body = f.read()
        self.send_response(404)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(body)


port = int(sys.argv[1]) if len(sys.argv) > 1 else 4190
http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
