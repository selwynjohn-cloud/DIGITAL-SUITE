/** Agile Live — composer extras (emoji, sent popup, message menu). */

const MIC_SVG =
  '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2z"/></svg>'

const EMOJI_SVG =
  '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-3.2 8.2a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4zm6.4 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4zM12 17.4c-2.2 0-4.1-1.3-5-3.2l1.8-.8c.6 1.3 1.8 2.1 3.2 2.1s2.6-.8 3.2-2.1l1.8.8c-.9 1.9-2.8 3.2-5 3.2z"/></svg>'

export function liveComposerInnerHtml(accept: string, opts?: { textI18n?: boolean }): string {
  const ph = opts?.textI18n
    ? 'placeholder="Type a message" data-i18n="typeMsg" data-i18n-placeholder="1"'
    : 'placeholder="Type a message"'
  const sendI18n = opts?.textI18n ? ' data-i18n="send"' : ''
  return `
        <div class="composer-wrap">
          <div id="voiceRec" class="live-rec hidden" aria-live="polite">
            <div class="live-rec-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="30" height="30"><path fill="#fff" d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zm7 9a7 7 0 0 1-14 0H3a9 9 0 0 0 8 8.9V23h2v-2.1A9 9 0 0 0 21 12h-2z"/></svg>
            </div>
            <div class="live-rec-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
            <p>Tap the mic to start. Tap again to send.</p>
            <button type="button" class="btn green" id="btnVoiceSend">Send voice</button>
          </div>
          <div id="emojiDock" class="live-emoji hidden"></div>
          <div class="composer">
            <input id="chatFile" type="file" class="hidden" accept="${accept}">
            <button type="button" class="btn grey" id="btnAttach">+</button>
            <input id="chatText" type="text" maxlength="400" ${ph}>
            <button type="button" class="btn grey emoji" id="btnEmoji" aria-label="Emoji" title="Emoji">${EMOJI_SVG}</button>
            <button type="button" class="btn grey voice" id="btnVoice" aria-label="Voice" title="Voice">${MIC_SVG}</button>
            <button type="button" class="btn green" id="btnSend"${sendI18n}>Send</button>
          </div>
        </div>
        <div id="liveSentPop" class="live-pop hidden">
          <div class="live-pop-card">
            <h2 id="liveSentTitle">Your message is sent.</h2>
            <p id="liveSentSub"></p>
            <button type="button" class="btn green wide" id="btnSentOk">OK</button>
          </div>
        </div>
        <div id="liveMsgMenu" class="live-msg-menu hidden" role="menu">
          <button type="button" data-act="copy">Copy</button>
          <button type="button" data-act="forward">Forward</button>
          <button type="button" data-act="save">Save</button>
          <button type="button" data-act="delete">Delete</button>
        </div>`
}

export function liveChatExtrasScript(): string {
  return `
var LIVE_EMOJIS=[128512,128515,128516,128513,128518,128522,128521,128525,128536,128578,128077,128076,128079,128591,128170,9989,10060,11088,128293,128175,128165,128640,128161,127881,9728,127783,9888,128680,127968,128663,128241,128196,128247,127909,127908,128172,128149,128153,128154,128155,128156,128513,128517,128519,128526,128527,128528,128533,128580,129303];
var LIVE_SENT={message:'Your message is sent.',voice:'Your voice is sent.',video:'Your video is sent.',image:'Your image including selfie is sent.',document:'Your document (Word, PDF, Excel, PPT) is sent.'};
var LIVE_SENT_SUB={message:'',voice:'',video:'',image:'Photo or selfie.',document:'Word, PDF, Excel or PowerPoint.'};
var LIVE_HIDE={};
try{LIVE_HIDE=JSON.parse(localStorage.getItem('live_hide')||'{}')||{};}catch(e){LIVE_HIDE={};}
var LIVE_MENU_MSG=null,LIVE_LP=0,LIVE_SENT_T=0,LIVE_MENU_AT=0,LIVE_LP_X=0,LIVE_LP_Y=0,LIVE_LP_OPEN=false;
function liveIsHidden(id){return !!(id&&LIVE_HIDE[id]);}
function liveHideLocal(id){
  if(!id)return;
  LIVE_HIDE[id]=1;
  try{localStorage.setItem('live_hide',JSON.stringify(LIVE_HIDE));}catch(e){}
}
function liveSentKind(pending,text){
  var mime=String(pending&&pending.mime||'').toLowerCase();
  var name=String(pending&&pending.name||'').toLowerCase();
  var kind=String(pending&&pending.kind||'');
  if(kind==='audio'||mime.indexOf('audio')===0||name.indexOf('voice')===0) return 'voice';
  if(kind==='video'||mime.indexOf('video')===0) return 'video';
  if(kind==='image'||mime.indexOf('image')===0) return 'image';
  if(kind==='pdf'||kind==='word'||kind==='excel'||kind==='ppt'||pending) return 'document';
  return String(text||'').trim()?'message':'message';
}
function liveShowSent(kind){
  var k=LIVE_SENT[kind]?kind:'message';
  var pop=document.getElementById('liveSentPop');
  var title=document.getElementById('liveSentTitle');
  var sub=document.getElementById('liveSentSub');
  var dock=document.getElementById('emojiDock');
  if(dock) dock.classList.add('hidden');
  if(title) title.textContent=LIVE_SENT[k];
  if(sub){ sub.textContent=LIVE_SENT_SUB[k]||''; sub.style.display=LIVE_SENT_SUB[k]?'block':'none'; }
  if(pop) pop.classList.remove('hidden');
  clearTimeout(LIVE_SENT_T);
  LIVE_SENT_T=setTimeout(function(){if(pop)pop.classList.add('hidden');},2800);
}
function liveCloseSent(){
  var pop=document.getElementById('liveSentPop');
  if(pop) pop.classList.add('hidden');
}
function liveInsertEmoji(ch){
  var inp=document.getElementById('chatText'); if(!inp)return;
  var start=typeof inp.selectionStart==='number'?inp.selectionStart:inp.value.length;
  var end=typeof inp.selectionEnd==='number'?inp.selectionEnd:start;
  var next=inp.value.slice(0,start)+ch+inp.value.slice(end);
  if(next.length>400)return;
  inp.value=next;
  try{inp.focus();inp.setSelectionRange(start+ch.length,start+ch.length);}catch(e){}
}
function liveEmojiBind(){
  var dock=document.getElementById('emojiDock'); if(!dock||dock.getAttribute('data-ready'))return;
  dock.setAttribute('data-ready','1');
  LIVE_EMOJIS.forEach(function(cp){
    var b=document.createElement('button');
    b.type='button';
    try{b.textContent=String.fromCodePoint(cp);}catch(e){return;}
    b.addEventListener('click',function(){liveInsertEmoji(b.textContent||'');});
    dock.appendChild(b);
  });
  var tog=document.getElementById('btnEmoji');
  if(tog) tog.addEventListener('click',function(){dock.classList.toggle('hidden');});
}
function livePaintBubble(div,m){
  div.setAttribute('data-id',m.id||'');
  div.setAttribute('data-text',m.text||'');
  div.setAttribute('data-file-url',m.fileUrl||'');
  div.setAttribute('data-file-name',m.fileName||'');
  div.setAttribute('data-file-kind',m.fileKind||'');
  div.setAttribute('data-file-mime',m.fileMime||'');
  if(m.fileUrl&&m.fileKind==='image'){var im=document.createElement('img');im.src=m.fileUrl;im.alt=m.fileName||'photo';div.appendChild(im);}
  else if(m.fileUrl&&m.fileKind==='audio'){var au=document.createElement('audio');au.controls=true;au.preload='metadata';au.setAttribute('playsinline','');if(m.fileMime) au.setAttribute('type',m.fileMime);au.src=m.fileUrl;div.appendChild(au);}
  else if(m.fileUrl&&m.fileKind==='video'){var vd=document.createElement('video');vd.controls=true;vd.preload='metadata';vd.setAttribute('playsinline','');vd.src=m.fileUrl;div.appendChild(vd);}
  else if(m.fileUrl){var a=document.createElement('a');a.className='file';a.href=m.fileUrl;a.target='_blank';a.rel='noopener';a.textContent=m.fileName||'Open file';div.appendChild(a);}
  if(m.text)div.appendChild(document.createTextNode(m.text));
}
function liveFindBub(box,id){
  id=String(id||'');
  if(!box||!id)return null;
  var nodes=box.querySelectorAll('.bub');
  for(var i=0;i<nodes.length;i++){ if(nodes[i].getAttribute('data-id')===id) return nodes[i]; }
  return null;
}
function liveAddBubMore(div){
  if(!div||div.querySelector('.bub-more'))return;
  var more=document.createElement('button');
  more.type='button'; more.className='bub-more'; more.setAttribute('aria-label','Message options'); more.textContent=String.fromCharCode(8942);
  more.addEventListener('click',function(e){
    e.preventDefault(); e.stopPropagation();
    liveOpenMsgMenu(div,e.clientX||24,e.clientY||80);
  });
  div.appendChild(more);
}
function liveSyncThread(box,rows,mineFn,labelFn){
  if(!box)return;
  var keep={};
  var pin= (box.scrollHeight-box.scrollTop-box.clientHeight)<90;
  var playing=false;
  try{
    var avs=box.querySelectorAll('audio,video');
    for(var a=0;a<avs.length;a++){ if(!avs[a].paused && !avs[a].ended){ playing=true; break; } }
  }catch(e){}
  (rows||[]).forEach(function(m){
    if(typeof liveIsHidden==='function'&&liveIsHidden(m.id))return;
    var id=String(m.id||'');
    if(id) keep[id]=1;
    var existing=liveFindBub(box,id);
    if(existing){
      existing.className='bub '+(mineFn(m)?'me':'them');
      liveAddBubMore(existing);
      return;
    }
    var div=document.createElement('div');
    div.className='bub '+(mineFn(m)?'me':'them');
    var sm=document.createElement('small');
    sm.textContent=labelFn?labelFn(m):((m.fromName||'')+'');
    div.appendChild(sm);
    liveAddBubMore(div);
    livePaintBubble(div,m);
    box.appendChild(div);
  });
  var nodes=box.querySelectorAll('.bub');
  for(var i=0;i<nodes.length;i++){
    var nid=nodes[i].getAttribute('data-id')||'';
    if(nid && !keep[nid]) nodes[i].remove();
  }
  if(pin && !playing) box.scrollTop=box.scrollHeight;
}
function liveMsgFromBub(bub){
  if(!bub)return null;
  return {
    id:bub.getAttribute('data-id')||'',
    text:bub.getAttribute('data-text')||'',
    fileUrl:bub.getAttribute('data-file-url')||'',
    fileName:bub.getAttribute('data-file-name')||'',
    fileKind:bub.getAttribute('data-file-kind')||'',
    fileMime:bub.getAttribute('data-file-mime')||''
  };
}
function liveCloseMenu(){
  var menu=document.getElementById('liveMsgMenu');
  if(menu) menu.classList.add('hidden');
  LIVE_MENU_MSG=null;
}
function liveOpenMsgMenu(bub,x,y){
  var menu=document.getElementById('liveMsgMenu'); if(!menu||!bub)return;
  LIVE_MENU_AT=Date.now();
  LIVE_MENU_MSG=liveMsgFromBub(bub);
  menu.classList.remove('hidden');
  var w=menu.offsetWidth||180, h=menu.offsetHeight||200;
  var left=Math.max(8,Math.min((x||20),window.innerWidth-w-8));
  var top=Math.max(8,Math.min((y||20),window.innerHeight-h-8));
  menu.style.left=left+'px';
  menu.style.top=top+'px';
}
function liveCopyText(t){
  t=String(t||'');
  if(!t){if(typeof banner==='function')banner('Nothing to copy.',false);return;}
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(t).then(function(){if(typeof banner==='function')banner('Copied.',true);}).catch(function(){liveCopyFallback(t);});
  }else liveCopyFallback(t);
}
function liveCopyFallback(t){
  var ta=document.createElement('textarea'); ta.value=t; document.body.appendChild(ta); ta.select();
  try{document.execCommand('copy'); if(typeof banner==='function')banner('Copied.',true);}catch(e){if(typeof banner==='function')banner('Could not copy.',false);}
  ta.remove();
}
function liveSaveMsg(data){
  if(!data)return;
  if(data.fileUrl){
    var a=document.createElement('a');
    a.href=data.fileUrl; a.download=data.fileName||'file'; a.target='_blank'; a.rel='noopener';
    document.body.appendChild(a); a.click(); a.remove();
    if(typeof banner==='function')banner('Open the file, then Save.',true);
    return;
  }
  if(data.text){
    var blob=new Blob([data.text],{type:'text/plain'});
    var url=URL.createObjectURL(blob);
    var a2=document.createElement('a'); a2.href=url; a2.download='message.txt';
    document.body.appendChild(a2); a2.click(); a2.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},800);
    if(typeof banner==='function')banner('Saved.',true);
    return;
  }
  if(typeof banner==='function')banner('Nothing to save.',false);
}
function liveDoDelete(id){
  if(!id)return;
  liveHideLocal(id);
  if(typeof ALL!=='undefined'&&ALL&&ALL.filter) ALL=ALL.filter(function(m){return m.id!==id;});
  if(typeof paintThread==='function')paintThread();
  if(typeof api!=='function')return;
  api('chatDelete',{messageId:id}).then(function(res){
    if(res.s===200){ if(typeof banner==='function')banner('Deleted.',true); return; }
    if(typeof banner==='function')banner((res.j&&res.j.error)||'Removed on this phone.',false);
  });
}
function liveDoForward(data){
  if(!data)return;
  var inp=document.getElementById('chatText');
  if(inp) inp.value=data.text||'';
  var dock=document.getElementById('emojiDock');
  if(dock) dock.classList.add('hidden');
  if(!data.fileUrl){
    if(typeof banner==='function')banner('Ready to forward. Tap Send.',true);
    if(inp) try{inp.focus();}catch(e){}
    return;
  }
  fetch(data.fileUrl).then(function(r){if(!r.ok)throw new Error('no');return r.blob();}).then(function(blob){
    var r=new FileReader();
    r.onload=function(){
      PENDING={name:data.fileName||'forwarded',mime:data.fileMime||blob.type||'',data:String(r.result||''),kind:data.fileKind||''};
      if(typeof banner==='function')banner('Ready to forward. Tap Send.',true);
    };
    r.readAsDataURL(blob);
  }).catch(function(){
    if(inp){
      var extra=(inp.value?inp.value+' ':'')+(data.fileName||'file');
      if(extra.length<=400) inp.value=extra;
    }
    if(typeof banner==='function')banner('Text ready. Attach the file again if needed, then Send.',true);
  });
}
function liveMenuAct(act){
  var data=LIVE_MENU_MSG; liveCloseMenu();
  if(!data)return;
  if(act==='copy'){ liveCopyText(data.text||data.fileName||''); return; }
  if(act==='save'){ liveSaveMsg(data); return; }
  if(act==='delete'){ liveDoDelete(data.id); return; }
  if(act==='forward'){ liveDoForward(data); }
}
function liveHoldBub(el){
  if(!el||!el.closest)return null;
  if(el.closest('#liveMsgMenu')||el.closest('.composer')||el.closest('.bub-more'))return null;
  return el.closest('.bub');
}
function liveChatExtrasBind(){
  liveEmojiBind();
  var ok=document.getElementById('btnSentOk');
  if(ok) ok.addEventListener('click',liveCloseSent);
  var menu=document.getElementById('liveMsgMenu');
  if(menu){
    menu.addEventListener('click',function(e){
      var b=e.target&&e.target.closest?e.target.closest('button[data-act]'):null;
      if(b) liveMenuAct(b.getAttribute('data-act'));
    });
  }
  document.addEventListener('contextmenu',function(e){
    var bub=liveHoldBub(e.target);
    if(!bub)return;
    e.preventDefault();
    e.stopPropagation();
    liveOpenMsgMenu(bub,e.clientX,e.clientY);
  },true);
  document.addEventListener('pointerdown',function(e){
    var bub=liveHoldBub(e.target);
    if(!bub)return;
    LIVE_LP_OPEN=false;
    LIVE_LP_X=e.clientX; LIVE_LP_Y=e.clientY;
    clearTimeout(LIVE_LP);
    LIVE_LP=setTimeout(function(){
      LIVE_LP_OPEN=true;
      liveOpenMsgMenu(bub,LIVE_LP_X,LIVE_LP_Y);
    },380);
  },{passive:true});
  document.addEventListener('pointermove',function(e){
    if(Math.abs((e.clientX||0)-LIVE_LP_X)>16||Math.abs((e.clientY||0)-LIVE_LP_Y)>16) clearTimeout(LIVE_LP);
  },{passive:true});
  document.addEventListener('pointerup',function(){clearTimeout(LIVE_LP);});
  document.addEventListener('pointercancel',function(){clearTimeout(LIVE_LP);});
  document.addEventListener('click',function(e){
    if(LIVE_LP_OPEN){ LIVE_LP_OPEN=false; e.preventDefault(); e.stopPropagation(); return; }
    var menu=document.getElementById('liveMsgMenu');
    if(!menu||menu.classList.contains('hidden'))return;
    if(Date.now()-LIVE_MENU_AT<900)return;
    if(menu.contains(e.target))return;
    liveCloseMenu();
  },true);
}
liveChatExtrasBind();
`
}
