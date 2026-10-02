"""Serve the site locally the way GitHub Pages does.

    python3 tools/serve.py          # http://127.0.0.1:8765/

Clean URLs resolve to their file (/about -> about.html), and unknown paths get
404.html with a 404 status. Plain `python3 -m http.server` does neither, so the
site's /about-style links would 404 under it.
"""
import http.server, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def send_head(self):
        path = self.path.split('?', 1)[0].split('#', 1)[0]
        local = self.translate_path(path)
        if not os.path.exists(local) and os.path.exists(local + '.html'):
            self.path = path + '.html'
        elif not os.path.exists(local):
            self.send_response(404)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            body = open(os.path.join(ROOT, '404.html'), 'rb').read()
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return None
        return super().send_head()

    def log_message(self, *a):
        pass


if __name__ == '__main__':
    http.server.ThreadingHTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
