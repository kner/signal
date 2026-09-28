"""Create a display-only archive without copying account keys or credentials."""
import json, base64, hashlib
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
rows = [json.loads(line) for line in (ROOT/'export/main.jsonl').open()]
recipients = {r['recipient']['id']: r['recipient'] for r in rows if 'recipient' in r}
files = {hashlib.sha256(p.read_bytes()).hexdigest(): '../../'+p.relative_to(ROOT).as_posix() for p in (ROOT/'export/files').glob('*/*')}
def name(id):
 r = recipients.get(str(id), {})
 if 'self' in r: return 'You'
 if 'group' in r: return r['group'].get('snapshot',{}).get('title',{}).get('title','Group')
 c=r.get('contact',{})
 return (' '.join(filter(None,[c.get('systemGivenName'),c.get('systemFamilyName')])) or ' '.join(filter(None,[c.get('profileGivenName'),c.get('profileFamilyName')])) or c.get('e164') or ('Signal' if 'releaseNotes' in r else 'Unknown contact'))
def attachment(p):
 locator=p.get('locatorInfo',{})
 h=locator.get('plaintextHash','')
 try: key=base64.b64decode(h).hex()
 except Exception: key=''
 return {'type':p.get('contentType','application/octet-stream'),'name':p.get('fileName','Attachment'),'src':files.get(key)}
chats={}
for row in rows:
 if 'chat' not in row:continue
 c=row['chat'];r=recipients.get(c['recipientId'],{})
 chats[c['id']]={'id':c['id'],'name':name(c['recipientId']),'group':'group' in r,'messages':[]}
for row in rows:
 if 'chatItem' not in row:continue
 c=row['chatItem']; s=c.get('standardMessage',{}); text=s.get('text',{}).get('body',''); attachments=[attachment(a.get('pointer',{})) for a in s.get('attachments',[])]
 system=False
 if 'remoteDeletedMessage' in c:text='Message deleted'
 elif 'updateMessage' in c:text='Conversation updated';system=True
 elif 'stickerMessage' in c:
  st=c['stickerMessage']['sticker'];text=st.get('emoji','')+' Sticker';attachments=[attachment(st.get('data',{}))]
 elif 'contactMessage' in c:text='Shared contact'
 q=s.get('quote'); quote={'author':name(q.get('authorId')),'text':q.get('text',{}).get('body','Attachment')} if q else None
 m={'time':int(c['dateSent']),'author':name(c['authorId']),'out':'outgoing' in c,'text':text,'attachments':attachments,'system':system,'quote':quote,'reactions':[x.get('emoji','') for x in s.get('reactions',[])]}
 if c['chatId'] in chats:chats[c['chatId']]['messages'].append(m)
for c in chats.values():c['messages'].sort(key=lambda m:m['time'])
data=sorted([c for c in chats.values() if c['messages']],key=lambda c:c['messages'][-1]['time'],reverse=True)
(ROOT/'homepage/dist/data.js').write_text('window.SIGNAL_ARCHIVE = '+json.dumps(data,ensure_ascii=False).replace('<','\\u003c')+';\n')
print(f'Imported {len(data)} conversations, {sum(len(c["messages"]) for c in data)} messages; {sum(bool(a["src"]) for c in data for m in c["messages"] for a in m["attachments"])} matched attachments.')

from build_pages import build
build(data)
