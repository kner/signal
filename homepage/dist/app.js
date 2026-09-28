'use strict';
const chats=window.SIGNAL_ARCHIVE||[], $=s=>document.querySelector(s);
let selected=chats.find(c=>c.name==='Family')||chats[0], limit=100, mediaOnly=false, showAllMessages=false;
const date=t=>new Date(t).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
const initials=n=>n.split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase();
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function avatar(c){const e=el('span','avatar',initials(c.name));const colors=['#dce8ff','#eee1ff','#d8f0e7','#ffe8da','#dceff5'];e.style.background=colors[Number(c.id)%colors.length];return e;}
const hiddenPrefix='signal-archive:hidden:v1:';
let storageWarning='';
function hiddenKey(chat,message){return hiddenPrefix+chat.id+':'+message.archiveId;}
function isHidden(chat,message){
 try{return localStorage.getItem(hiddenKey(chat,message))==='1';}
 catch(error){storageWarning='Der Browserspeicher ist nicht verfügbar. Beiträge können nicht dauerhaft ausgeblendet werden.';return false;}
}
function visibleMessages(chat){return showAllMessages?chat.messages:chat.messages.filter(m=>!isHidden(chat,m));}
function visibilityButton(chat,message){
 const hidden=isHidden(chat,message);
 const button=el('button','visibility-button',hidden?'Wiederherstellen':'x');
 button.type='button';
 button.setAttribute('aria-label',hidden?'Beitrag wiederherstellen':'Beitrag ausblenden');
 button.title=hidden?'Beitrag wieder in der Standardansicht anzeigen':'Beitrag ausblenden; Original bleibt erhalten';
 button.onclick=()=>{
  const pane=$('#messages'),top=pane.scrollTop;
  try{
   if(!message.archiveId)throw new Error('Missing message ID');
   if(isHidden(chat,message))localStorage.removeItem(hiddenKey(chat,message));
   else localStorage.setItem(hiddenKey(chat,message),'1');
   storageWarning='';
  }catch(error){storageWarning='Auswahl konnte nicht gespeichert werden. Der Beitrag wurde nicht geändert. Bitte Browserspeicher erlauben.';}
  renderChats();renderMessages();pane.scrollTop=top;
 };
 return button;
}
function renderVisibility(){
 $('#show-all-messages').checked=showAllMessages;
 const count=selected?selected.messages.filter(m=>isHidden(selected,m)).length:0;
 $('#hidden-message-count').textContent=count+' ausgeblendete Beiträge';
 $('#visibility-error').textContent=storageWarning;
}
function renderChats(){const query=$('#search').value.toLocaleLowerCase();$('#chats').replaceChildren();let count=0;for(const c of chats){if(!c.name.toLocaleLowerCase().includes(query))continue;count++;const b=el('button','chat'+(selected?.id===c.id?' active':''));b.setAttribute('aria-label',c.name);b.setAttribute('aria-current',selected?.id===c.id?'true':'false');b.append(avatar(c));const copy=el('div','chat-copy'),top=el('div','chat-top'),m=visibleMessages(c).at(-1);top.append(el('span','chat-name',c.name),el('span','chat-date',m?new Date(m.time).toLocaleDateString(undefined,{day:'numeric',month:'short'}):''));copy.append(top,el('div','preview',m?(m.out?'You: ':'')+(m.text||(m.attachments.length?'Attachment':'Message')):'Alle Beiträge ausgeblendet'));b.append(copy);b.onclick=()=>{selected=c;limit=100;mediaOnly=false;$('.app').classList.add('chat-open');renderChats();renderMessages();};$('#chats').append(b);}$('#count').textContent=count;if(!count)$('#chats').append(el('p','empty','No conversations found'));}
function renderAttachment(a,m){const box=el('div','attachment');if(!a.src){box.append(el('div','missing',(a.type.startsWith('image')?'Photo':a.type.startsWith('video')?'Video':a.type.startsWith('audio')?'Audio':a.name)+' unavailable'));box.firstChild.append(el('small','', 'File not included in this export'));return box;}if(a.type.startsWith('image/')){const img=el('img');img.src=a.src;img.alt=m.text?'Photo: '+m.text:'Photo from '+m.author;img.loading='lazy';img.onclick=()=>{$('#large-image').src=a.src;$('#image-caption').textContent=m.author+' · '+date(m.time)+(m.text?'\n'+m.text:'');$('#lightbox').showModal();};box.append(img);}else if(a.type.startsWith('video/')||a.type.startsWith('audio/')){const v=el(a.type.startsWith('video/')?'video':'audio');v.src=a.src;v.controls=true;v.preload='metadata';box.append(v);}else{const link=el('a','',a.name);link.href=a.src;link.download=a.name;box.append(link);}return box;}
function filterMessages(messages, pattern, field, onlyMedia){
 const regex=pattern ? new RegExp(pattern,'i') : null;
 return messages.filter(m=>{
  if(onlyMedia&&!m.attachments.some(a=>/^(image|video)\//.test(a.type)))return false;
  if(!regex)return true;
  const sender=m.system?'':(m.out?'You':m.author);
  return (field!=='text'&&regex.test(sender))||(field!=='sender'&&regex.test(m.text));
 });
}
function renderMessages(preserve=false){renderVisibility();const pane=$('#messages'),oldHeight=pane.scrollHeight,oldTop=pane.scrollTop;pane.replaceChildren();if(!selected){pane.append(el('p','empty','No messages in this archive'));return;}$('#title').textContent=selected.name;$('#standalone-link').href=selected.page||'pages.html';$('#avatar').replaceWith(Object.assign(avatar(selected),{id:'avatar'}));$('#subtitle').textContent=(selected.group?'Group conversation':'Conversation')+' · '+selected.messages.length.toLocaleString()+' messages';$('#media-toggle').setAttribute('aria-pressed',String(mediaOnly));$('#media-toggle').textContent=mediaOnly?'All messages':'Photos & videos';const pattern=$('#message-query').value, status=$('#message-search-status');let messages;
try {messages=filterMessages(visibleMessages(selected),pattern,$('#message-search-field').value,mediaOnly);$('#message-query').removeAttribute('aria-invalid');status.classList.remove('error');}
catch(error){$('#message-query').setAttribute('aria-invalid','true');status.classList.add('error');status.textContent='Invalid regular expression. Check brackets, parentheses and escapes.';pane.append(el('p','empty','Correct the search pattern to see messages.'));return;}
const filtered=Boolean(pattern)||mediaOnly;
status.textContent=filtered?messages.length.toLocaleString()+' matching messages':'';
if(!filtered&&messages.length>limit){const load=el('button','load','Load earlier messages');load.onclick=()=>{limit+=100;renderMessages(true);};pane.append(load);}let lastDay='';for(const m of (filtered?messages:messages.slice(-limit))){const day=date(m.time);if(day!==lastDay){const d=el('div','day');d.append(el('span','',day));pane.append(d);lastDay=day;}if(m.system){const system=el('div','system'+(isHidden(selected,m)?' hidden-message':''),m.text);system.append(visibilityButton(selected,m));pane.append(system);continue;}const row=el('div','row'+(m.out?' out':'')),bubble=el('article','bubble'+(isHidden(selected,m)?' hidden-message':''));bubble.dataset.messageId=m.archiveId;if(isHidden(selected,m))bubble.append(el('div','hidden-label','Ausgeblendet'));bubble.append(visibilityButton(selected,m));bubble.setAttribute('aria-label',(m.out?'You':m.author)+' · '+day);if(!m.out)bubble.append(el('div','author',m.author));if(m.quote){const q=el('div','quote');q.append(el('strong','',m.quote.author),document.createTextNode(m.quote.text));bubble.append(q);}for(const a of m.attachments)bubble.append(renderAttachment(a,m));if(m.text)bubble.append(el('div','text',m.text));bubble.append(el('div','stamp',(m.out?'You · ':'')+new Date(m.time).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})));if(m.reactions.length)bubble.append(el('div','reactions',m.reactions.join(' ')));row.append(bubble);pane.append(row);}if(!messages.length)pane.append(el('p','empty',pattern?'No messages match this search.':mediaOnly?'No photos or videos in this conversation':'Keine sichtbaren Beiträge. Mit „Alle Beiträge“ kannst du ausgeblendete Beiträge wieder anzeigen.'));pane.scrollTop=preserve?pane.scrollHeight-oldHeight+oldTop:pane.scrollHeight;}
$('#show-all-messages').checked=false;
$('#show-all-messages').onchange=()=>{showAllMessages=$('#show-all-messages').checked;renderChats();renderMessages();};
window.addEventListener('storage',event=>{if(event.key===null||event.key.startsWith(hiddenPrefix)){const pane=$('#messages'),top=pane.scrollTop;renderChats();renderMessages();pane.scrollTop=top;}});
window.addEventListener('pageshow',event=>{if(event.persisted){showAllMessages=false;renderChats();renderMessages();}});
let searchTimer;
function searchMessages(){clearTimeout(searchTimer);limit=100;renderMessages();}
$('#message-query').oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(searchMessages,180);};
$('#message-search-field').onchange=searchMessages;
$('#message-search-form').onsubmit=e=>{e.preventDefault();searchMessages();};
$('#clear-message-search').onclick=()=>{$('#message-query').value='';searchMessages();$('#message-query').focus();};
$('#search').oninput=renderChats;$('#media-toggle').onclick=()=>{mediaOnly=!mediaOnly;limit=100;renderMessages();};$('#back').onclick=()=>$('.app').classList.remove('chat-open');$('#close-lightbox').onclick=()=>$('#lightbox').close();$('#lightbox').onclick=e=>{if(e.target===$('#lightbox'))$('#lightbox').close();};if(window.SIGNAL_STANDALONE){document.body.classList.add('standalone');$('.app').classList.add('chat-open');}renderChats();renderMessages();
