# Local preview of release-candidate/site that answers like the hosting's .htaccess does:
# /about is served from about.html, a missing address gets 404.html with the 404 status.
# Usage: python3 scripts/serve-release.py [port]
import http.server
import os
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'release-candidate', 'site')


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def translate_path(self, path):
        local = super().translate_path(path)
        # /cases is cases.html even though a cases/ folder sits next to it
        if (not os.path.exists(local) or os.path.isdir(local)) and os.path.exists(local.rstrip('/') + '.html'):
            return local.rstrip('/') + '.html'
        if not os.path.exists(local) and os.path.exists(local + '.html'):
            return local + '.html'
        return local

    def send_error(self, code, message=None, explain=None):
        page = os.path.join(ROOT, '404.html')
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
