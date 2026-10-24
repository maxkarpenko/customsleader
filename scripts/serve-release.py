# Local preview of release-candidate/site that answers like the hosting's .htaccess does:
# /moscow, /vladimir, /yaroslavl are served from moscow.html etc. Usage: python3 scripts/serve-release.py [port]
import http.server
import os
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'release-candidate', 'site')


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def translate_path(self, path):
        local = super().translate_path(path)
        if not os.path.exists(local) and os.path.exists(local + '.html'):
            return local + '.html'
        return local


port = int(sys.argv[1]) if len(sys.argv) > 1 else 4190
http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
