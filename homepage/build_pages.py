"""Generate one fully self-contained HTML file for every conversation."""
import base64, copy, html, json, re, unicodedata, hashlib
from pathlib import Path
DIST=Path(__file__).resolve().parent/'dist'
def page_name(chat):
 slug=unicodedata.normalize('NFKD',chat['name']).encode('ascii','ignore').decode().lower()
 slug=re.sub('[^a-z0-9]+','-',slug).strip('-') or 'conversation'
 return f"{slug}-{chat['id']}.html"
def build(data):
 template=(DIST/'index.html').read_text()
 template=re.sub(r'(href="style\.css|src="(?:app|data)\.js)\?v=[^" ]+', r'\1', template)
 css=(DIST/'style.css').read_text()
 js=(DIST/'app.js').read_text()
 output=DIST/'conversations';output.mkdir(exist_ok=True)
 links=[]
 for chat in data:
  chat['page']='conversations/'+page_name(chat)
  occurrences={}
  for message in chat['messages']:
   # Stable across page embedding and rebuilding; no attachment URLs/base64.
   identity={k:message.get(k) for k in ('time','author','out','text','system','quote')}
   identity['attachments']=[{k:a.get(k) for k in ('type','name')} for a in message['attachments']]
   digest=hashlib.sha256(json.dumps(identity,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
   occurrence=occurrences.get(digest,0);occurrences[digest]=occurrence+1
   message['archiveId']=digest+'-'+str(occurrence)
 for chat in data:
  single=copy.deepcopy(chat)
  for message in single['messages']:
   for attachment in message['attachments']:
    if attachment['src']:
     path=(DIST/attachment['src']).resolve()
     attachment['src']='data:'+attachment['type']+';base64,'+base64.b64encode(path.read_bytes()).decode()
  payload=json.dumps([single],ensure_ascii=False).replace('<','\\u003c')
  page=template.replace('<title>Signal · Local archive</title>','<title>'+html.escape(chat['name'])+' · Signal</title>')
  page=page.replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>')
  page=page.replace('<script src="data.js"></script>','<script>window.SIGNAL_STANDALONE=true;window.SIGNAL_ARCHIVE='+payload+';</script>')
  page=page.replace('<script src="app.js"></script>','<script>'+js+'</script>')
  (output/page_name(chat)).write_text(page)
  links.append('<a href="'+html.escape(chat['page'],quote=True)+'"><strong>'+html.escape(chat['name'])+'</strong><span>'+str(len(chat['messages']))+' Nachrichten</span></a>')
 overview='''<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Signal · Einzelne Homepages</title><style>body{font:16px system-ui;background:#f6f7fb;color:#222833;margin:0;padding:32px}main{max-width:850px;margin:auto}h1{font-size:28px}nav{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin-top:24px}a{color:#3268cd;text-decoration:none}nav a{padding:20px;border-radius:12px;background:white;border:1px solid #e4e7ed}span{display:block;font-size:13px;color:#717b8c;margin-top:7px}p{line-height:1.5}</style><main><a href="index.html">← Gemeinsame Ansicht</a><h1>Deine Signal-Homepages</h1><p>Jede Unterhaltung als eigenständige HTML-Datei. Nachrichten, Suche und vorhandene Medien sind eingebettet und funktionieren auch offline.</p><nav>'''+''.join(links)+'</nav></main></html>'
 (DIST/'pages.html').write_text(overview)
 (DIST/'data.js').write_text('window.SIGNAL_ARCHIVE = '+json.dumps(data,ensure_ascii=False).replace('<','\\u003c')+';\n')
 for asset in ('style.css','app.js','data.js'):
  version=hashlib.sha256((DIST/asset).read_bytes()).hexdigest()[:12]
  template=template.replace('"'+asset+'"','"'+asset+'?v='+version+'"')
 (DIST/'index.html').write_text(template)
 print(f'Created {len(data)} self-contained conversation pages.')
if __name__=='__main__':
 source=(DIST/'data.js').read_text()
 build(json.loads(source.removeprefix('window.SIGNAL_ARCHIVE = ').strip().removesuffix(';')))
