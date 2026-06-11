#!/usr/bin/env python3
"""Dev static server for the Bangali Sweets frontend.

Same as `python3 -m http.server` but sends `Cache-Control: no-store` so the
browser never serves a stale HTML/JS copy during development. Run:

    python3 serve.py [port]   # default port 5500
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5500
    print(f"Serving (no-cache) on http://localhost:{port}")
    ThreadingHTTPServer(("", port), NoCacheHandler).serve_forever()
