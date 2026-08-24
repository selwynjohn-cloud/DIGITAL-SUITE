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
  'image/jpeg,image/png,image/webp,application/pdf,.doc,.docx,audio/mpeg,.mp3,audio/webm,audio/ogg,audio/mp4,.m4a,video/mp4'

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
    return { ok: false, error: 'Send only image, Word, PDF, MP3, or MP4.' }
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

/** Tap mic to record, tap again to send. Needs page `PENDING`, `sendChat()`, `banner()`. */
export function liveVoiceBindScript(): string {
  return `
var LIVE_REC=null,LIVE_REC_CHUNKS=[],LIVE_REC_STREAM=null;
function liveVoiceMime(){
  try{
    if(window.MediaRecorder&&MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
    if(window.MediaRecorder&&MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
    if(window.MediaRecorder&&MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
  }catch(e){}
  return '';
}
function liveVoiceStopTracks(){
  try{if(LIVE_REC_STREAM)LIVE_REC_STREAM.getTracks().forEach(function(t){t.stop();});}catch(e){}
  LIVE_REC_STREAM=null;
}
function liveVoiceSetBtn(on){
  var b=document.getElementById('btnVoice'); if(!b)return;
  b.classList.toggle('on',!!on);
  b.setAttribute('aria-pressed',on?'true':'false');
}
function liveVoiceStart(){
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){banner('This phone must allow the microphone for a voice message.',false);return;}
  if(!window.MediaRecorder){banner('This phone cannot record voice. Use + to attach an MP3.',false);return;}
  navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
    LIVE_REC_STREAM=stream;
    LIVE_REC_CHUNKS=[];
    var mime=liveVoiceMime();
    LIVE_REC=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream);
    LIVE_REC.ondataavailable=function(e){if(e.data&&e.data.size)LIVE_REC_CHUNKS.push(e.data);};
    LIVE_REC.onstop=function(){
      liveVoiceStopTracks();
      var type=((LIVE_REC&&LIVE_REC.mimeType)||'audio/webm').split(';')[0];
      LIVE_REC=null;
      liveVoiceSetBtn(false);
      var blob=new Blob(LIVE_REC_CHUNKS,{type:type});
      if(!blob.size){banner('Could not record. Try again.',false);return;}
      var ext=type.indexOf('mp4')>=0||type.indexOf('m4a')>=0?'.m4a':(type.indexOf('ogg')>=0?'.ogg':'.webm');
      var r=new FileReader();
      r.onload=function(){
        PENDING={name:'voice'+ext,mime:type||'audio/webm',data:String(r.result||'')};
        banner('Sending voice…',true);
        sendChat();
      };
      r.readAsDataURL(blob);
    };
    LIVE_REC.start();
    liveVoiceSetBtn(true);
    banner('Recording… tap the mic to send.',true);
  }).catch(function(){banner('Allow the microphone, then tap the mic again.',false);});
}
function liveVoiceToggle(){
  if(LIVE_REC&&LIVE_REC.state==='recording'){LIVE_REC.stop();return;}
  liveVoiceStart();
}
`
}
