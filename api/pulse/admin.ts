import type { VercelRequest, VercelResponse } from '@vercel/node'
import { otpLoginHtml, otpLoginScript } from '../_lib/embedded-otp.js'

/** GET /pulse/admin — manager portal (email OTP). */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Security News — Agile Group</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:'Segoe UI',Tahoma,sans-serif;background:#eef2f7;color:#0f172a}
.top{background:linear-gradient(135deg,#1d4ed8,#1e3a8a);color:#fff;padding:18px 16px;text-align:center;border-bottom:3px solid #c9a84c}
.top h1{margin:0;font-size:19px;font-weight:800}
.top p{margin:4px 0 0;font-size:12px;color:#bfdbfe}
.wrap{max-width:680px;margin:0 auto;padding:16px}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,.05)}
.sec-title{font-size:16px;font-weight:800;color:#1e3a8a;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0}
label{display:block;font-size:13px;font-weight:700;color:#334155;margin:10px 0 4px}
input[type=text],textarea{width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:15px;font-family:inherit}
textarea{min-height:90px;resize:vertical}
.item{border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:12px;background:#f8fafc}
.btn{display:inline-block;padding:11px 18px;border:none;border-radius:9px;font-size:15px;font-weight:700;cursor:pointer}
.btn-blue{background:#1d4ed8;color:#fff}
.btn-green{background:#059669;color:#fff}
.btn-red{background:#dc2626;color:#fff}
.btn-grey{background:#e2e8f0;color:#334155}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.thumb{width:90px;height:90px;object-fit:cover;border-radius:8px;border:2px solid #cbd5e1;background:#f1f5f9}
.hint{font-size:12px;color:#64748b;margin-top:4px}
.msg{padding:10px 14px;border-radius:8px;margin:10px 0;font-size:14px;font-weight:600;display:none}
.msg.ok{background:#dcfce7;color:#166534;display:block}
.msg.err{background:#fef2f2;color:#991b1b;display:block}
.savebar{position:sticky;bottom:0;background:#fff;border-top:1px solid #e2e8f0;padding:12px 16px;text-align:center;box-shadow:0 -2px 8px rgba(0,0,0,.06)}
#login{max-width:400px;margin:60px auto}
.hidden{display:none!important}
label{display:block;font-size:12px;color:#64748b;margin:8px 0 4px;font-weight:700}
input[type=email]{width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:15px}
.btn.gold{background:#c9a84c;color:#14224f;width:100%;margin-top:12px}
</style></head>
<body>
<div class="top"><h1>Security News — Agile Group</h1><p>Admin Portal — to update Security news</p></div>

${otpLoginHtml(
  'Security News',
  'Admin Portal — Sai and Director official emails only',
  false,
  undefined,
  'Only <b>sai@agilegroup.co.in</b> and <b>director@agilegroup.co.in</b> can sign in. <b>it@agilegroup.co.in</b> is no longer authorised. Other Agile emails and Gmail cannot open this portal. A 6-digit PIN is emailed — valid <strong>15 minutes</strong>. Check <strong>spam</strong> if not in inbox.',
)}

<div id="app" class="hidden">
  <div class="wrap" style="padding-bottom:0">
    <a href="/mis-admin" class="btn btn-grey" style="text-decoration:none;display:inline-block;margin-bottom:4px">🗄 Master Directory</a>
  </div>
  <div class="wrap">
    <div class="card" style="background:#eff6ff;border-color:#3b82f6">
      <div class="sec-title">📅 Daily Bulletin Schedule (India time)</div>
      <p style="font-size:14px;line-height:1.7;margin:0;color:#1e293b">
        <b>🌅 Morning</b> — 6:00 AM &nbsp;|&nbsp; <b>☀️ Afternoon</b> — 2:00 PM &nbsp;|&nbsp; <b>🌙 10:00 PM</b> — 10:00 PM<br>
        <b>Auto-published</b> to your WhatsApp Channel + all groups — no tap needed.<br>
        If news is delayed, system retries 30 minutes later.<br>
        <b>🏆 Quiz winner:</b> Every Sunday morning.
      </p>
    </div>
    <div id="banner" class="msg"></div>

    <div class="card">
      <div class="sec-title">1. Agile News &amp; Events</div>
      <div id="events"></div>
      <button class="btn btn-grey" onclick="addEvent()">+ Add News / Event</button>
    </div>

    <div class="card">
      <div class="sec-title">2. Agile Job Posting (up to 3 images)</div>
      <div id="jobImages" class="row"></div>
      <div style="margin-top:10px"><button class="btn btn-grey" id="addJobBtn" onclick="addJobImage()">+ Add Job Image</button></div>
      <div class="hint">Tip: you can upload a photo from this device.</div>
    </div>

    <div class="card">
      <div class="sec-title">3. Guards Appreciation (up to 3)</div>
      <div id="guards"></div>
      <button class="btn btn-grey" id="addGuardBtn" onclick="addGuard()">+ Add Appreciation</button>
    </div>

    <div class="card">
      <div class="sec-title">4. Security Question of the Day</div>
      <p class="hint" style="margin:0 0 10px">About 100 questions on the live list. Every month 30 questions are changed. One new question each day. The same question is not asked twice in the same month. Contest: first answer must be correct, all 7 days Sunday to Saturday. Two lucky winners from those who finish the week.</p>
      <div class="item" style="background:#f5f3ff;border-color:#ddd6fe">
        <div style="font-weight:700;color:#5b21b6">This week (<span id="qWeek">—</span>): <span id="qCount">0</span> correct days · <span id="qQualified">0</span> finished all 7 days</div>
        <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:8px">
          <button class="btn btn-grey" onclick="quizLoadEntries()">👥 View all participants</button>
          <button class="btn btn-green" onclick="quizThankYou()">🙏 Send thank you to all</button>
          <button class="btn btn-blue" onclick="quizDraw()">🏆 Pick &amp; Publish this week's Winner</button>
        </div>
        <div id="qEntries" style="margin-top:10px"></div>
        <div id="qThankMsg" style="font-size:12px;color:#64748b;margin-top:6px"></div>
        <div id="qWinners" style="margin-top:10px"></div>
      </div>

      <div style="margin:12px 0"><button class="btn btn-green" onclick="quizGen()">✨ Generate 20 new questions with AI</button>
        <span id="qGenMsg" style="font-size:12px;color:#64748b;margin-left:8px"></span></div>

      <div id="qList"></div>

      <div class="item" style="border-color:#c4b5fd">
        <div style="font-weight:800;color:#5b21b6;margin-bottom:6px">Add a question manually</div>
        <label>Question</label><input type="text" id="nqQ">
        <label>Picture (optional — for "identify the equipment")</label>
        <div class="row"><span id="nqImgWrap"></span><button class="btn btn-grey" onclick="nqPick()">Upload picture</button></div>
        <label>Option A</label><input type="text" id="nqO0">
        <label>Option B</label><input type="text" id="nqO1">
        <label>Option C</label><input type="text" id="nqO2">
        <label>Option D</label><input type="text" id="nqO3">
        <label>Correct answer</label>
        <select id="nqC" style="padding:10px;border:1px solid #cbd5e1;border-radius:8px;font-size:15px"><option>A</option><option>B</option><option>C</option><option>D</option></select>
        <label>Explanation</label><textarea id="nqE"></textarea>
        <div style="margin-top:10px"><button class="btn btn-blue" onclick="quizAdd()">+ Add this question</button></div>
      </div>
    </div>
  </div>
  <div class="savebar">
    <div id="saveMsg" class="msg"></div>
    <button class="btn btn-green" style="min-width:200px" onclick="saveAll()">Save all changes</button>
  </div>
</div>

<script>
${otpLoginScript('pulse', 'Security News', 'management')}
var data={events:[],jobImages:[],guards:[]};

function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function a(s){return h(s).replace(/"/g,'&quot;');}
function el(id){return document.getElementById(id);}
function newId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7);}

function api(action,extra){
  return fetch('/api/pulse/admin-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,sessionToken:OTP_SESSION},extra||{}))})
    .then(function(r){return r.json().then(function(j){return {status:r.status,body:j};});});
}

function onOtpLogin(j){
  api('load').then(function(res){
    if(res.status!==200){ otpMsg(res.body.error||'Could not sign in.',false); return; }
    data=res.body.editorial||{events:[],jobImages:[],guards:[]};
    if(!data.events)data.events=[]; if(!data.jobImages)data.jobImages=[]; if(!data.guards)data.guards=[];
    el('login').classList.add('hidden'); el('app').classList.remove('hidden');
    if(res.body.storage && !res.body.storage.ok){ var b=el('banner'); b.className='msg err'; b.textContent='Note: the database is not connected yet, so saving will not work until the storage keys are added in Vercel.'; }
    renderAll();
    loadQuiz();
  }).catch(function(){ otpMsg('Network error. Please try again.',false); });
}

/* ---- image upload (resize on device, then store) ---- */
function pickImage(cb){
  var inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.onchange=function(){ if(inp.files&&inp.files[0]) resizeAndUpload(inp.files[0],cb); };
  inp.click();
}
function resizeAndUpload(file,cb){
  var reader=new FileReader();
  reader.onload=function(e){
    var img=new Image();
    img.onload=function(){
      var max=1100,w=img.width,hh=img.height;
      if(w>max||hh>max){ if(w>hh){hh=Math.round(hh*max/w);w=max;} else {w=Math.round(w*max/hh);hh=max;} }
      var c=document.createElement('canvas'); c.width=w; c.height=hh;
      c.getContext('2d').drawImage(img,0,0,w,hh);
      var durl=c.toDataURL('image/jpeg',0.82);
      api('upload',{dataUrl:durl}).then(function(res){
        if(res.status===200&&res.body.url){ cb(res.body.url); }
        else { alert(res.body.error||'Could not save the photo.'); }
      });
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}

/* ---- NEWS & EVENTS ---- */
function addEvent(){ data.events.push({id:newId(),heading:'',text:'',imageUrl:'',videoUrl:''}); renderEvents(); }
function delEvent(i){ if(confirm('Delete this news item?')){ data.events.splice(i,1); renderEvents(); } }
function upEvent(i,f,v){ data.events[i][f]=v; }
function eventImg(i){ pickImage(function(url){ data.events[i].imageUrl=url; renderEvents(); }); }
function eventImgClear(i){ data.events[i].imageUrl=''; renderEvents(); }
function renderEvents(){
  var c=el('events'); c.innerHTML='';
  data.events.forEach(function(ev,i){
    var img=ev.imageUrl?('<img class="thumb" src="'+a(ev.imageUrl)+'"><button class="btn btn-grey" onclick="eventImgClear('+i+')">Remove photo</button>'):'';
    c.innerHTML+=''+
      '<div class="item">'+
      '<label>Heading</label><input type="text" value="'+a(ev.heading)+'" oninput="upEvent('+i+',\\'heading\\',this.value)">'+
      '<label>News / Event text</label><textarea oninput="upEvent('+i+',\\'text\\',this.value)">'+h(ev.text)+'</textarea>'+
      '<label>Photo</label><div class="row">'+img+'<button class="btn btn-grey" onclick="eventImg('+i+')">Upload photo</button></div>'+
      '<label>Or paste an image link (optional)</label><input type="text" value="'+a(ev.imageUrl)+'" oninput="upEvent('+i+',\\'imageUrl\\',this.value)">'+
      '<label>Video link (YouTube or Google Drive — do not upload the MP4 file here)</label><input type="text" value="'+a(ev.videoUrl)+'" oninput="upEvent('+i+',\\'videoUrl\\',this.value)" placeholder="https://youtu.be/...">'+
      '<div style="margin-top:10px"><button class="btn btn-red" onclick="delEvent('+i+')">Delete this item</button></div>'+
      '</div>';
  });
}

/* ---- JOB IMAGES ---- */
function addJobImage(){ if(data.jobImages.length>=3){alert('Maximum 3 job images.');return;} pickImage(function(url){ data.jobImages.push(url); renderJob(); }); }
function delJobImage(i){ data.jobImages.splice(i,1); renderJob(); }
function renderJob(){
  var c=el('jobImages'); c.innerHTML='';
  data.jobImages.forEach(function(url,i){
    c.innerHTML+='<div style="text-align:center"><img class="thumb" src="'+a(url)+'"><br><button class="btn btn-red" style="margin-top:4px" onclick="delJobImage('+i+')">Delete</button></div>';
  });
  el('addJobBtn').style.display=data.jobImages.length>=3?'none':'inline-block';
}

/* ---- GUARDS ---- */
function addGuard(){ if(data.guards.length>=3){alert('Maximum 3 appreciations.');return;} data.guards.push({id:newId(),name:'',guardId:'',clientName:'',location:'',photoUrl:'',citation:''}); renderGuards(); }
function delGuard(i){ if(confirm('Delete this appreciation?')){ data.guards.splice(i,1); renderGuards(); } }
function upGuard(i,f,v){ data.guards[i][f]=v; }
function guardImg(i){ pickImage(function(url){ data.guards[i].photoUrl=url; renderGuards(); }); }
function guardImgClear(i){ data.guards[i].photoUrl=''; renderGuards(); }
function renderGuards(){
  var c=el('guards'); c.innerHTML='';
  data.guards.forEach(function(g,i){
    var img=g.photoUrl?('<img class="thumb" src="'+a(g.photoUrl)+'"><button class="btn btn-grey" onclick="guardImgClear('+i+')">Remove photo</button>'):'';
    c.innerHTML+=''+
      '<div class="item">'+
      '<label>Guard Name</label><input type="text" value="'+a(g.name)+'" oninput="upGuard('+i+',\\'name\\',this.value)">'+
      '<label>ID No</label><input type="text" value="'+a(g.guardId)+'" oninput="upGuard('+i+',\\'guardId\\',this.value)">'+
      '<label>Client Name</label><input type="text" value="'+a(g.clientName)+'" oninput="upGuard('+i+',\\'clientName\\',this.value)">'+
      '<label>Location</label><input type="text" value="'+a(g.location)+'" oninput="upGuard('+i+',\\'location\\',this.value)">'+
      '<label>The great job done</label><textarea oninput="upGuard('+i+',\\'citation\\',this.value)">'+h(g.citation)+'</textarea>'+
      '<label>Guard / Award ceremony photo</label><div class="row">'+img+'<button class="btn btn-grey" onclick="guardImg('+i+')">Upload photo</button></div>'+
      '<div style="margin-top:10px"><button class="btn btn-red" onclick="delGuard('+i+')">Delete this appreciation</button></div>'+
      '</div>';
  });
  el('addGuardBtn').style.display=data.guards.length>=3?'none':'inline-block';
}

function renderAll(){ renderEvents(); renderJob(); renderGuards(); }

function saveAll(){
  var m=el('saveMsg'); m.className='msg'; m.textContent='Saving...'; m.classList.add('ok');
  api('save',{editorial:data}).then(function(res){
    if(res.status===200){ m.className='msg ok'; m.textContent='Saved! Your changes are live on the bulletin.'; if(res.body.editorial){data=res.body.editorial; renderAll();} }
    else { m.className='msg err'; m.textContent=(res.body.error||'Could not save.'); }
  }).catch(function(){ m.className='msg err'; m.textContent='Network error while saving.'; });
}

/* ---- SECURITY QUIZ ---- */
var quizBank=[]; var nqImageUrl='';
function loadQuiz(){
  api('quiz-load').then(function(res){
    if(res.status!==200) return;
    quizBank=res.body.bank||[];
    el('qWeek').textContent=res.body.week||'—';
    el('qCount').textContent=res.body.entryCount||0;
    if(el('qQualified')) el('qQualified').textContent=res.body.qualifiedCount||0;
    renderWinners(res.body.winners||[]);
    renderQuiz();
    quizLoadEntries();
  });
}
function weekNumLabel(week){
  var m=String(week||'').match(/W(\\d+)/i);
  var n=m?m[1]:'00';
  while(n.length<2)n='0'+n;
  return n;
}
function renderWinners(ws){
  var c=el('qWinners');
  var live=(ws||[]).filter(function(w){return !w.noWinner;});
  var none=(ws||[]).filter(function(w){return w.noWinner;})[0];
  var week=(live[0]&&live[0].weekKey)||(none&&none.weekKey)||'';
  var heading=(live.length>1?'Winners':'Winner')+' for the Week number-'+weekNumLabel(week);
  if(!live.length && !none){ c.innerHTML='<div style="font-size:12px;color:#64748b">No winner published this week yet.</div>'; return; }
  if(none && !live.length){ c.innerHTML='<div style="font-size:13px;color:#64748b;font-weight:600">📋 '+h(heading)+' — No winner this week</div>'; return; }
  var rows=live.map(function(w){
    var wa=w.whatsapp?' — WhatsApp <b>'+h(w.whatsapp)+'</b>':'';
    return '<div style="font-size:16px;margin-top:6px;text-align:center"><b>'+h(w.name)+'</b>'+wa+' — Week number-'+weekNumLabel(w.weekKey||week)+(w.couponCode?' — Code: <b>'+h(w.couponCode)+'</b>':'')+'</div>';
  }).join('');
  var gift=live.length>1?'Gift coupon is sent to the winners.':'Gift coupon is sent to the winner.';
  c.innerHTML='<div style="font-size:14px;color:#5b21b6;font-weight:800;text-align:center">🏅 '+h(heading)+'</div>'+rows+
    '<div style="font-size:13px;color:#166534;font-weight:700;margin-top:6px;text-align:center">'+gift+'</div>';
}
function quizLoadEntries(){
  var c=el('qEntries'); c.innerHTML='<div style="font-size:12px;color:#64748b">Loading all entries…</div>';
  api('quiz-entries',{week:'ALL'}).then(function(res){
    if(res.status!==200){ c.innerHTML='<div style="font-size:12px;color:#b91c1c">'+(res.body.error||'Could not load.')+'</div>'; return; }
    var list=res.body.entries||[];
    var prog=res.body.progress||[];
    var qual=prog.filter(function(p){return p.qualified;}).length;
    var head=prog.length?('<div style="font-size:12px;font-weight:700;color:#5b21b6;margin:0 0 8px">This week progress — '+qual+' finished 7/7</div>'+
      '<div style="overflow:auto;max-height:220px;border:1px solid #ddd6fe;border-radius:8px;background:#fff;margin-bottom:10px"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:#f5f3ff;text-align:left"><th style="padding:6px 8px">Name</th><th style="padding:6px 8px">WhatsApp</th><th style="padding:6px 8px">Days</th><th style="padding:6px 8px">Status</th></tr></thead><tbody>'+
      prog.map(function(p){
        var st=p.qualified?'Qualified':(p.failed?'Missed a day':(p.daysCorrect+'/7'));
        return '<tr><td style="padding:6px 8px;border-bottom:1px solid #ede9fe"><b>'+h(p.name)+'</b></td><td style="padding:6px 8px;border-bottom:1px solid #ede9fe">'+h(p.whatsapp||'—')+'</td><td style="padding:6px 8px;border-bottom:1px solid #ede9fe">'+(p.daysCorrect||0)+'/7</td><td style="padding:6px 8px;border-bottom:1px solid #ede9fe">'+h(st)+'</td></tr>';
      }).join('')+'</tbody></table></div>'):'';
    if(!list.length && !prog.length){ c.innerHTML='<div style="font-size:12px;color:#64748b">No participants yet.</div>'; return; }
    var rows=list.map(function(e,i){
      var d=e.date?new Date(e.date).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'';
      return '<tr><td style="padding:6px 8px;border-bottom:1px solid #ede9fe">'+(i+1)+'</td><td style="padding:6px 8px;border-bottom:1px solid #ede9fe"><b>'+h(e.name)+'</b></td><td style="padding:6px 8px;border-bottom:1px solid #ede9fe;white-space:nowrap"><b>'+h(e.whatsapp||'—')+'</b></td><td style="padding:6px 8px;border-bottom:1px solid #ede9fe">'+h(e.week||'')+'</td><td style="padding:6px 8px;border-bottom:1px solid #ede9fe">'+h(d)+'</td></tr>';
    }).join('');
    c.innerHTML=head+'<div style="font-size:12px;font-weight:700;color:#5b21b6;margin-bottom:6px">All correct-day entries — name and WhatsApp ('+list.length+' entries)</div>'+
      '<div style="overflow:auto;max-height:420px;border:1px solid #ddd6fe;border-radius:8px;background:#fff">'+
      '<table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:#f5f3ff;text-align:left">'+
      '<th style="padding:6px 8px">#</th><th style="padding:6px 8px">Name</th><th style="padding:6px 8px">WhatsApp</th><th style="padding:6px 8px">Week</th><th style="padding:6px 8px">Entered</th>'+
      '</tr></thead><tbody>'+rows+'</tbody></table></div>';
  });
}
function quizThankYou(){
  var week=el('qWeek').textContent;
  var count=parseInt(el('qCount').textContent||'0',10);
  if(!count){ alert('No participants this week yet.'); return; }
  if(!confirm('Send a thank you WhatsApp card to every unique participant this week ('+week+')?')) return;
  var m=el('qThankMsg'); m.textContent='Sending thank you messages… please wait.';
  api('quiz-thankyou',{week:week}).then(function(res){
    if(res.status===200){
      m.textContent='Done — sent '+res.body.sent+' of '+res.body.unique+' unique participants ('+res.body.total+' total entries).';
      if(res.body.failed) m.textContent+=' '+res.body.failed+' could not be sent.';
      if(res.body.capped) m.textContent+=' (More remain — tap again to send the next batch.)';
      if(res.body.alreadySent) m.textContent+=' '+res.body.alreadySent+' were already thanked earlier.';
    } else {
      m.textContent=(res.body.error||'Could not send.');
    }
  }).catch(function(){ m.textContent='Network error.'; });
}
function renderQuiz(){
  var c=el('qList');
  if(!quizBank.length){ c.innerHTML='<div style="font-size:13px;color:#64748b;margin:8px 0">No questions yet. Generate with AI or add one below.</div>'; return; }
  c.innerHTML=quizBank.map(function(q,i){
    var img=q.imageUrl?'<img class="thumb" src="'+a(q.imageUrl)+'" style="width:56px;height:56px">':'';
    return '<div class="item" style="display:flex;gap:10px;align-items:flex-start">'+img+'<div style="flex:1"><div style="font-weight:700;color:#1e293b">'+h(q.question)+'</div><div style="font-size:12px;color:#059669;margin-top:2px">Correct answer: '+h(q.correctKey)+'</div></div><button class="btn btn-red" onclick="quizDel('+i+')">Delete</button></div>';
  }).join('');
}
function quizSaveBank(cb){ api('quiz-save',{bank:quizBank}).then(function(res){ if(res.status===200){ quizBank=res.body.bank||quizBank; } if(cb) cb(res); }); }
function quizDel(i){ if(!confirm('Delete this question?')) return; quizBank.splice(i,1); renderQuiz(); quizSaveBank(); }
function quizGen(){ var m=el('qGenMsg'); m.textContent='Generating with AI, please wait…'; api('quiz-generate',{count:20}).then(function(res){ if(res.status===200){ quizBank=res.body.bank||[]; m.textContent='Added '+(res.body.added||0)+' new questions.'; renderQuiz(); } else { m.textContent=(res.body.error||'Could not generate.'); } }).catch(function(){ m.textContent='Network error.'; }); }
function nqPick(){ pickImage(function(url){ nqImageUrl=url; el('nqImgWrap').innerHTML='<img class="thumb" src="'+a(url)+'" style="width:56px;height:56px">'; }); }
function quizAdd(){
  var q=el('nqQ').value.trim();
  var opts=[el('nqO0').value,el('nqO1').value,el('nqO2').value,el('nqO3').value];
  if(!q || opts.filter(function(x){return x.trim();}).length<2){ alert('Please enter the question and at least 2 options.'); return; }
  var keys=['A','B','C','D']; var options=[];
  for(var i=0;i<4;i++){ if(opts[i].trim()) options.push({key:keys[i],text:opts[i].trim()}); }
  quizBank.push({id:newId(),type:nqImageUrl?'image':'text',question:q,imageUrl:nqImageUrl,options:options,correctKey:el('nqC').value,explanation:el('nqE').value.trim()});
  renderQuiz(); quizSaveBank();
  el('nqQ').value='';el('nqO0').value='';el('nqO1').value='';el('nqO2').value='';el('nqO3').value='';el('nqE').value='';nqImageUrl='';el('nqImgWrap').innerHTML='';
}
function quizDraw(){ if(!confirm("Pick and publish this week's winner(s)? Old winner details will be removed.")) return; api('quiz-draw',{}).then(function(res){ if(res.status===200){ var list=res.body.winners||(res.body.winner?[res.body.winner]:[]); var week=list[0]?list[0].weekKey:''; var heading=(list.length>1?'Winners':'Winner')+' for the Week number-'+weekNumLabel(week); var lines=list.map(function(w){return w.name+(w.whatsapp?' · '+w.whatsapp:'')+(w.couponCode?' · '+w.couponCode:'');}).join('\\n'); alert(heading+'\\n'+lines+'\\n\\n'+(list.length>1?'Gift coupon is sent to the winners.':'Gift coupon is sent to the winner.')); loadQuiz(); } else { alert(res.body.error||'No entries yet this week.'); } }); }

if(otpRestoreSession())onOtpLogin({});
</script>
</body></html>`
