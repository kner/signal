"""Serve only the viewer and attachment files on this computer."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote, urlsplit
ROOT=Path(__file__).resolve().parent.parent
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  path=unquote(urlsplit(self.path).path)
  if path in ('/', '/homepage/dist/'):
   self.send_response(302);self.send_header('Location','/homepage/dist/index.html');self.end_headers();return
  target=(ROOT/path.lstrip('/')).resolve()
  allowed=any(target.is_relative_to(p) for p in [ROOT/'homepage/dist',ROOT/'export/files'])
  if not allowed or not target.is_file():self.send_error(404);return
  self.path=path
  super().do_GET()
 def do_HEAD(self):
  self.send_error(405)
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
# Directory routes are deliberately restricted; use the explicit homepage URL.
print('Open http://127.0.0.1:8765/homepage/dist/index.html',flush=True)
ThreadingHTTPServer(('127.0.0.1',8765),Handler).serve_forever()
