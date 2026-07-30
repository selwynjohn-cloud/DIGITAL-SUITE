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
<title>Agile Pulse — Manager Portal</title>
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
<div class="top"><h1>Agile Pulse — Manager Portal</h1><p>Update the News Bulletin content</p></div>

${otpLoginHtml('Agile Pulse', 'Sign in with your @agilegroup.co.in email')}

<div id="app" class="hidden">
  <div class="wrap" style="padding-bottom:0">
    <a href="/mis-admin" class="btn btn-grey" style="text-decoration:none;display:inline-block;margin-bottom:4px">🗄 Master Directory</a>
  </div>
  <div class="wrap">
    <div class="card" style="background:#eff6ff;border-color:#3b82f6">
      <div class="sec-title">📅 Daily Bulletin Schedule (India time)</div>
      <p style="font-size:14px;line-height:1.7;margin:0;color:#1e293b">
        <b>🌅 Morning</b> — 6:00 AM &nbsp;|&nbsp; <b>☀️ Afternoon</b> — 2:00 PM &nbsp;|&nbsp; <b>🌙 Evening</b> — 6:00 PM<br>
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
      <div class="item" style="background:#f5f3ff;border-color:#ddd6fe">
        <div style="font-weight:700;color:#5b21b6">This week (<span id="qWeek">—</span>): <span id="qCount">0</span> entries in the prize draw</div>
        <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:8px">
          <button class="btn btn-grey" onclick="quizLoadEntries()">👥 View participants</button>
          <button class="btn btn-green" onclick="quizThankYou()">🙏 Send thank you to all</button>
          <button class="btn btn-blue" onclick="quizDraw()">🏆 Pick &amp; Publish this week's Winner</button>
        </div>
        <div id="qEntries" style="margin-top:10px"></div>
        <div id="qThankMsg" style="font-size:12px;color:#64748b;margin-top:6px"></div>
        <div id="qWinners" style="margin-top:10px"></div>
      </div>

      <div style="margin:12px 0"><button class="btn btn-green" onclick="quizGen()">✨ Generate 5 questions with AI</button>
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
${otpLoginScript('pulse', 'Agile Pulse', 'management')}
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
      '<label>Video link (optional)</label><input type="text" value="'+a(ev.videoUrl)+'" oninput="upEvent('+i+',\\'videoUrl\\',this.value)">'+
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
    renderWinners(res.body.winners||[]);
    renderQuiz();
  });
}
function renderWinners(ws){
  var c=el('qWinners');
  if(!ws.length){ c.innerHTML='<div style="font-size:12px;color:#64748b">No winners published yet.</div>'; return; }
  c.innerHTML=ws.map(function(w){
    if(w.noWinner) return '<div style="font-size:13px;color:#64748b;font-weight:600">📋 '+h(w.weekKey)+' — No winner this week</div>';
    return '<div style="font-size:13px;color:#5b21b6;font-weight:700">🏅 '+h(w.weekKey)+' — '+h(w.name)+'</div>';
  }).join('');
}
function quizLoadEntries(){
  var week=el('qWeek').textContent;
  var c=el('qEntries'); c.innerHTML='<div style="font-size:12px;color:#64748b">Loading…</div>';
  api('quiz-entries',{week:week}).then(function(res){
    if(res.status!==200){ c.innerHTML='<div style="font-size:12px;color:#b91c1c">'+(res.body.error||'Could not load.')+'</div>'; return; }
    var list=res.body.entries||[];
    if(!list.length){ c.innerHTML='<div style="font-size:12px;color:#64748b">No participants yet this week.</div>'; return; }
    c.innerHTML='<div style="font-size:12px;font-weight:700;color:#5b21b6;margin-bottom:6px">Participants ('+list.length+' correct entries)</div>'+
      list.map(function(e,i){
        var d=e.date?new Date(e.date).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'';
        return '<div style="font-size:13px;padding:6px 8px;background:#fff;border-radius:6px;border:1px solid #e9d5ff;margin-bottom:4px">'+(i+1)+'. <b>'+h(e.name)+'</b>'+(d?' · '+h(d):'')+'</div>';
      }).join('');
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
function quizGen(){ var m=el('qGenMsg'); m.textContent='Generating with AI, please wait…'; api('quiz-generate',{count:5}).then(function(res){ if(res.status===200){ quizBank=res.body.bank||[]; m.textContent='Added '+(res.body.added||0)+' new questions.'; renderQuiz(); } else { m.textContent=(res.body.error||'Could not generate.'); } }).catch(function(){ m.textContent='Network error.'; }); }
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
function quizDraw(){ if(!confirm('Pick and publish a winner for this week?')) return; api('quiz-draw',{}).then(function(res){ if(res.status===200){ alert('Winner: '+res.body.winner.name); loadQuiz(); } else { alert(res.body.error||'No entries yet this week.'); } }); }

if(otpRestoreSession())onOtpLogin({});
</script>
</body></html>`
