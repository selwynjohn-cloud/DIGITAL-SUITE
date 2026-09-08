import { put } from '@vercel/blob'
import type { LiveFileKind } from './types.js'

const ALLOW: { mime: string; kind: LiveFileKind; max: number; ext: string[] }[] = [
  { mime: 'image/jpeg', kind: 'image', max: 2_500_000, ext: ['.jpg', '.jpeg'] },
  { mime: 'image/png', kind: 'image', max: 2_500_000, ext: ['.png'] },
  { mime: 'image/webp', kind: 'image', max: 2_500_000, ext: ['.webp'] },
  { mime: 'application/pdf', kind: 'pdf', max: 6_000_000, ext: ['.pdf'] },
  { mime: 'application/msword', kind: 'word', max: 6_000_000, ext: ['.doc'] },
  {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    kind: 'word',
    max: 6_000_000,
    ext: ['.docx'],
  },
  { mime: 'application/vnd.ms-excel', kind: 'excel', max: 6_000_000, ext: ['.xls'] },
  {
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    kind: 'excel',
    max: 6_000_000,
    ext: ['.xlsx'],
  },
  { mime: 'application/vnd.ms-powerpoint', kind: 'ppt', max: 6_000_000, ext: ['.ppt'] },
  {
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    kind: 'ppt',
    max: 6_000_000,
    ext: ['.pptx'],
  },
  { mime: 'audio/mpeg', kind: 'audio', max: 6_000_000, ext: ['.mp3'] },
  { mime: 'audio/mp3', kind: 'audio', max: 6_000_000, ext: ['.mp3'] },
  { mime: 'audio/webm', kind: 'audio', max: 6_000_000, ext: ['.webm'] },
  { mime: 'audio/ogg', kind: 'audio', max: 6_000_000, ext: ['.ogg', '.oga'] },
  { mime: 'audio/mp4', kind: 'audio', max: 6_000_000, ext: ['.m4a', '.mp4'] },
  { mime: 'audio/aac', kind: 'audio', max: 6_000_000, ext: ['.aac'] },
  { mime: 'audio/wav', kind: 'audio', max: 6_000_000, ext: ['.wav'] },
  { mime: 'video/mp4', kind: 'video', max: 8_000_000, ext: ['.mp4'] },
]

export const LIVE_CHAT_ACCEPT =
  'image/jpeg,image/png,image/webp,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,audio/mpeg,.mp3,audio/webm,audio/ogg,audio/mp4,.m4a,video/mp4'

function extOf(name: string): string {
  const n = String(name || '').toLowerCase()
  const i = n.lastIndexOf('.')
  return i >= 0 ? n.slice(i) : ''
}

export function classifyLiveFile(name: string, mime: string): { kind: LiveFileKind; max: number } | null {
  const ext = extOf(name)
  const raw = String(mime || '').toLowerCase().split(';')[0].trim()
  const hit =
    ALLOW.find((a) => a.mime === raw) ||
    ALLOW.find((a) => a.ext.includes(ext))
  return hit ? { kind: hit.kind, max: hit.max } : null
}

export async function storeLiveChatFile(opts: {
  roomKey: string
  fileName: string
  mime: string
  dataUrl: string
}): Promise<{ ok: true; url: string; kind: LiveFileKind; name: string; mime: string; size: number } | { ok: false; error: string }> {
  const raw = String(opts.dataUrl || '')
  const m = /^data:([^;]+);base64,(.+)$/.exec(raw)
  if (!m) return { ok: false, error: 'Choose a file first.' }
  const mime = String(opts.mime || m[1] || '').toLowerCase()
  const classified = classifyLiveFile(opts.fileName, mime)
  if (!classified) {
    return { ok: false, error: 'Send only image, Word, PDF, Excel, PowerPoint, MP3, or MP4.' }
  }
  let buf: Buffer
  try {
    buf = Buffer.from(m[2], 'base64')
  } catch {
    return { ok: false, error: 'Could not read that file.' }
  }
  if (!buf.length) return { ok: false, error: 'Empty file.' }
  if (buf.length > classified.max) {
    const mb = Math.round(classified.max / 100000) / 10
    return { ok: false, error: `That file is too large (keep under ${mb} MB).` }
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return { ok: false, error: 'File store is not ready. Ask IT to set BLOB_READ_WRITE_TOKEN.' }
  }
  const safe = String(opts.fileName || 'file')
    .replace(/[^\w.\-]+/g, '_')
    .slice(0, 80)
  try {
    const blob = await put(`agile-live/${opts.roomKey}/${Date.now()}-${safe}`, buf, {
      access: 'public',
      contentType: mime || 'application/octet-stream',
    })
    return {
      ok: true,
      url: blob.url,
      kind: classified.kind,
      name: safe,
      mime,
      size: buf.length,
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not save file.' }
  }
}

/** Tap mic to start, tap again to send. Needs page `PENDING`, `sendChat()`, `banner()`. */
export function liveVoiceBindScript(): string {
  return `
var LIVE_REC=null,LIVE_REC_CHUNKS=[],LIVE_REC_STREAM=null,LIVE_VOICE_BUSY=false,LIVE_VOICE_T=0,LIVE_VOICE_PHASE='off',LIVE_VOICE_HOLD=false,LIVE_VOICE_DOWN=false,LIVE_VOICE_TICK=0,LIVE_PCM=[],LIVE_AC=null,LIVE_PROC=null,LIVE_SRC=null,LIVE_SR=16000,LIVE_PCM_STREAM=null;
var LIVE_REC_HINT='Tap the mic to start. Tap again to send.';
function liveVoiceIsApple(){
  var ua=navigator.userAgent||'';
  return /iP(hone|ad|od)/.test(ua) || (/Safari/.test(ua) && !/Chrome|Chromium|Android|Edg|OPR/.test(ua));
}
function liveVoiceMime(){
  try{
    var apple=liveVoiceIsApple();
    var order=apple
      ? ['audio/mp4','audio/mp4;codecs=mp4a.40.2','audio/aac']
      : ['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'];
    for(var i=0;i<order.length;i++){
      if(window.MediaRecorder&&MediaRecorder.isTypeSupported(order[i])) return order[i];
    }
  }catch(e){}
  return '';
}
function liveVoiceUnlock(){
  try{
    var AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return;
    if(!LIVE_AC) LIVE_AC=new AC();
    if(LIVE_AC.state==='suspended'&&LIVE_AC.resume) LIVE_AC.resume();
  }catch(e){}
}
function liveVoiceStopTracks(){
  try{if(LIVE_PROC) LIVE_PROC.disconnect();}catch(e){}
  try{if(LIVE_SRC) LIVE_SRC.disconnect();}catch(e){}
  try{if(LIVE_AC&&LIVE_AC.close) LIVE_AC.close();}catch(e){}
  LIVE_PROC=LIVE_SRC=LIVE_AC=null;
  try{if(LIVE_PCM_STREAM)LIVE_PCM_STREAM.getTracks().forEach(function(t){t.stop();});}catch(e){}
  LIVE_PCM_STREAM=null;
  try{if(LIVE_REC_STREAM)LIVE_REC_STREAM.getTracks().forEach(function(t){t.stop();});}catch(e){}
  LIVE_REC_STREAM=null;
  clearInterval(LIVE_VOICE_TICK); LIVE_VOICE_TICK=0;
}
function liveVoiceSetBtn(on){
  if(!on){ LIVE_VOICE_BUSY=false; LIVE_VOICE_PHASE='off'; LIVE_VOICE_HOLD=false; LIVE_VOICE_DOWN=false; }
  var b=document.getElementById('btnVoice');
  if(b){
    b.classList.toggle('on',!!on);
    b.setAttribute('aria-pressed',on?'true':'false');
  }
  var rec=document.getElementById('voiceRec');
  if(rec){
    rec.classList.toggle('hidden',!on);
    if(on) rec.classList.remove('sending');
    else rec.classList.remove('sending');
    var p=rec.querySelector('p');
    if(p && !rec.classList.contains('sending')) p.textContent=LIVE_REC_HINT;
    var send=document.getElementById('btnVoiceSend');
    if(send) send.classList.toggle('hidden',!on);
  }
  var dock=document.getElementById('emojiDock');
  if(on&&dock) dock.classList.add('hidden');
}
function liveVoiceMarkSending(){
  LIVE_VOICE_BUSY=true;
  LIVE_VOICE_PHASE='send';
  var rec=document.getElementById('voiceRec');
  if(rec){
    rec.classList.remove('hidden');
    rec.classList.add('sending');
    var p=rec.querySelector('p');
    if(p) p.textContent='Sending voice…';
    var send=document.getElementById('btnVoiceSend');
    if(send) send.classList.add('hidden');
  }
  var b=document.getElementById('btnVoice');
  if(b) b.classList.add('on');
}
function liveVoiceFail(msg){
  liveVoiceStopTracks();
  LIVE_REC=null;
  LIVE_REC_CHUNKS=[];
  LIVE_PCM=[];
  liveVoiceSetBtn(false);
  if(typeof banner==='function') banner(msg||'Could not record. Try again.',false);
}
function liveVoiceTick(){
  var rec=document.getElementById('voiceRec');
  var p=rec&&rec.querySelector('p');
  if(!p||!LIVE_VOICE_T)return;
  var sec=Math.max(0,Math.floor((Date.now()-LIVE_VOICE_T)/1000));
  p.textContent='Recording '+sec+'s — tap the mic to send';
  if(sec>=45) liveVoiceFinish(false);
}
function liveVoiceArmPcm(stream){
  try{
    liveVoiceUnlock();
    if(!LIVE_AC)return;
    var src=null;
    try{ if(stream&&stream.clone) src=stream.clone(); }catch(e){ src=null; }
    if(!src){
      if(window.MediaRecorder) return;
      src=stream;
    }
    LIVE_PCM_STREAM=src;
    LIVE_SR=LIVE_AC.sampleRate||16000;
    LIVE_SRC=LIVE_AC.createMediaStreamSource(src);
    LIVE_PROC=LIVE_AC.createScriptProcessor(4096,1,1);
    LIVE_PCM=[];
    LIVE_PROC.onaudioprocess=function(ev){
      LIVE_PCM.push(new Float32Array(ev.inputBuffer.getChannelData(0)));
    };
    var g=LIVE_AC.createGain(); g.gain.value=0;
    LIVE_SRC.connect(LIVE_PROC); LIVE_PROC.connect(g); g.connect(LIVE_AC.destination);
  }catch(e){}
}
function liveVoiceWav(){
  if(!LIVE_PCM.length) return null;
  var n=0,i=0;
  for(i=0;i<LIVE_PCM.length;i++) n+=LIVE_PCM[i].length;
  if(n<800) return null;
  var pcm=new Float32Array(n),o=0;
  for(i=0;i<LIVE_PCM.length;i++){pcm.set(LIVE_PCM[i],o);o+=LIVE_PCM[i].length;}
  var buf=new ArrayBuffer(44+n*2),v=new DataView(buf);
  function ws(s,off){for(var k=0;k<s.length;k++) v.setUint8(off+k,s.charCodeAt(k));}
  ws('RIFF',0); v.setUint32(4,36+n*2,true); ws('WAVE',8); ws('fmt ',12);
  v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true);
  v.setUint32(24,LIVE_SR,true); v.setUint32(28,LIVE_SR*2,true);
  v.setUint16(32,2,true); v.setUint16(34,16,true); ws('data',36); v.setUint32(40,n*2,true);
  var p=44;
  for(i=0;i<n;i++){
    var s=Math.max(-1,Math.min(1,pcm[i]));
    v.setInt16(p,s<0?s*0x8000:s*0x7fff,true); p+=2;
  }
  return new Blob([buf],{type:'audio/wav'});
}
function liveVoicePost(blob,type,ext){
  liveVoiceMarkSending();
  var r=new FileReader();
  r.onerror=function(){liveVoiceFail('Could not read the voice note.');};
  r.onload=function(){
    PENDING={name:'voice'+ext,mime:type||'audio/wav',data:String(r.result||''),kind:'audio'};
    if(typeof sendChat==='function') sendChat();
    else liveVoiceFail('Could not send. Try again.');
  };
  r.readAsDataURL(blob);
}
function liveVoiceOnStop(mime){
  var rec=LIVE_REC;
  liveVoiceStopTracks();
  var type=((rec&&rec.mimeType)||mime||'').split(';')[0];
  LIVE_REC=null;
  var blob=new Blob(LIVE_REC_CHUNKS,{type:type||'audio/webm'});
  if(!blob.size){ var wav=liveVoiceWav(); if(wav){ liveVoicePost(wav,'audio/wav','.wav'); return; } }
  LIVE_PCM=[];
  if(Date.now()-LIVE_VOICE_T<400){ liveVoiceFail('Speak for a moment, then tap the mic again to send.'); return; }
  if(!blob.size){ liveVoiceFail('Could not record. Allow the microphone, then tap the mic.'); return; }
  var ext=type.indexOf('mp4')>=0||type.indexOf('m4a')>=0||type.indexOf('aac')>=0?'.m4a':(type.indexOf('ogg')>=0?'.ogg':(type.indexOf('wav')>=0?'.wav':'.webm'));
  liveVoicePost(blob,type||'audio/webm',ext);
}
function liveVoiceFinish(){
  if(LIVE_VOICE_PHASE!=='on'&&LIVE_VOICE_PHASE!=='ask') return;
  if(LIVE_VOICE_PHASE==='ask'){
    LIVE_VOICE_PHASE='off';
    liveVoiceFail('Allow the microphone, then tap the mic and speak.');
    return;
  }
  LIVE_VOICE_PHASE='send';
  if(LIVE_REC&&LIVE_REC.state==='recording'){
    try{if(LIVE_REC.requestData) LIVE_REC.requestData();}catch(e){}
    setTimeout(function(){ try{if(LIVE_REC&&LIVE_REC.state==='recording') LIVE_REC.stop();}catch(e){liveVoiceFail('Could not finish the voice note.');} },80);
    return;
  }
  if(!LIVE_REC && LIVE_PCM.length){
    liveVoiceStopTracks();
    var wav=liveVoiceWav();
    LIVE_PCM=[];
    if(!wav){ liveVoiceFail('Speak for a moment, then tap the mic again to send.'); return; }
    liveVoicePost(wav,'audio/wav','.wav');
    return;
  }
  liveVoiceFail('Could not record. Tap the mic, speak, then tap again.');
}
function liveVoiceStart(){
  if(LIVE_VOICE_PHASE==='on'){ liveVoiceFinish(); return; }
  if(LIVE_VOICE_PHASE==='ask'||LIVE_VOICE_PHASE==='send'||LIVE_VOICE_BUSY) return;
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){banner('This phone must allow the microphone for a voice message.',false);return;}
  LIVE_VOICE_PHASE='ask';
  LIVE_VOICE_BUSY=true;
  liveVoiceUnlock();
  if(typeof banner==='function') banner('Allow the microphone if the phone asks.',true);
  var ask=navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,channelCount:1}});
  ask=ask.catch(function(){ return navigator.mediaDevices.getUserMedia({audio:true}); });
  ask.then(function(stream){
    if(LIVE_VOICE_PHASE!=='ask'){ try{stream.getTracks().forEach(function(t){t.stop();});}catch(e){} return; }
    LIVE_REC_STREAM=stream;
    LIVE_REC_CHUNKS=[];
    LIVE_PCM=[];
    LIVE_VOICE_T=Date.now();
    LIVE_VOICE_PHASE='on';
    liveVoiceSetBtn(true);
    var send=document.getElementById('btnVoiceSend');
    if(send) send.classList.remove('hidden');
    liveVoiceArmPcm(stream);
    clearInterval(LIVE_VOICE_TICK);
    LIVE_VOICE_TICK=setInterval(liveVoiceTick,400);
    liveVoiceTick();
    var mime=liveVoiceMime();
    if(window.MediaRecorder){
      try{ LIVE_REC=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream); }
      catch(e){ try{LIVE_REC=new MediaRecorder(stream);}catch(e2){ LIVE_REC=null; } }
    }
    if(LIVE_REC){
      LIVE_REC.onerror=function(){liveVoiceFail('Voice stopped. Tap the mic and try again.');};
      LIVE_REC.ondataavailable=function(e){if(e.data&&e.data.size)LIVE_REC_CHUNKS.push(e.data);};
      LIVE_REC.onstop=function(){ liveVoiceOnStop(mime); };
      try{ if(liveVoiceIsApple()) LIVE_REC.start(); else LIVE_REC.start(250); }
      catch(e){ try{LIVE_REC.start();}catch(e2){ LIVE_REC=null; } }
    }
    if(!LIVE_REC && !LIVE_PCM.length && !LIVE_PROC){
      liveVoiceArmPcm(stream);
      if(!LIVE_PROC) liveVoiceFail('This phone cannot record a voice note. Try Chrome.');
    }
  }).catch(function(){liveVoiceFail('Allow the microphone, then tap the mic.');});
}
function liveVoiceBindMic(){
  var b=document.getElementById('btnVoice');
  if(!b||b.getAttribute('data-voice')) return;
  b.setAttribute('data-voice','1');
  b.addEventListener('pointerdown',function(e){
    if(e.pointerType==='mouse'&&e.button!==0)return;
    e.preventDefault();
    LIVE_VOICE_DOWN=true;
    LIVE_VOICE_HOLD=false;
    liveVoiceUnlock();
    if(LIVE_VOICE_PHASE==='on'){ liveVoiceFinish(); return; }
    liveVoiceStart();
  });
  b.addEventListener('pointerup',function(){
    LIVE_VOICE_DOWN=false;
    if(LIVE_VOICE_HOLD && LIVE_VOICE_PHASE==='on') liveVoiceFinish();
  });
  b.addEventListener('pointercancel',function(){ LIVE_VOICE_DOWN=false; });
  b.addEventListener('contextmenu',function(e){e.preventDefault();});
  setInterval(function(){
    if(LIVE_VOICE_DOWN && LIVE_VOICE_PHASE==='on' && (Date.now()-LIVE_VOICE_T)>500) LIVE_VOICE_HOLD=true;
  },200);
  var send=document.getElementById('btnVoiceSend');
  if(send && !send.getAttribute('data-voice')){
    send.setAttribute('data-voice','1');
    send.addEventListener('click',function(e){ e.preventDefault(); liveVoiceFinish(); });
  }
}
liveVoiceBindMic();
`
}
