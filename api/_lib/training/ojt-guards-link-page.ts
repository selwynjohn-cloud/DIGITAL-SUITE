/** Public mobile page — EOI → ATTENDANCE → 5 Yes/No → marks → feedback → Security News.
 * Same process as WhatsApp replies EOI / ATTENDANCE.
 */

import { CHANNEL_URL } from '../pulse/config.js'
import { TRAINING_BRAND, TRAINING_LOGO_URL } from './training-brand.js'

export function ojtGuardsLinkPageHtml(token: string): string {
  const t = JSON.stringify(String(token || ''))
  const channel = JSON.stringify(CHANNEL_URL)
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>Training Confirmation & Attendance</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:linear-gradient(160deg,#0b1220,#0f766e33 50%,#1e3a6e);color:#e2e8f0;min-height:100vh;padding:16px}
.card{max-width:440px;margin:0 auto;background:linear-gradient(180deg,#111a30,#0e1730);border:1px solid rgba(201,168,76,.4);border-radius:16px;padding:20px;box-shadow:0 12px 32px rgba(0,0,0,.35)}
h1{font-size:1.2rem;color:#fff;margin-bottom:6px}
.brand{text-align:center;margin-bottom:12px}
.brand img{height:48px;width:auto;object-fit:contain;margin-bottom:8px;background:transparent}
.brand .co{font-size:.82rem;color:#fff;font-weight:800;line-height:1.3}
.brand .dept{font-size:.75rem;color:#fde68a;font-weight:700;margin-top:4px}
.brand .tag{font-size:.75rem;color:#99f6e4;font-style:italic;margin-top:4px}
.sub{color:#94a3b8;font-size:.9rem;line-height:1.45;margin-bottom:14px}
.steps{font-size:.82rem;color:#cbd5e1;line-height:1.55;margin:0 0 14px;padding:10px 12px;border-radius:10px;border:1px solid rgba(201,168,76,.35);background:#0b1220}
.steps b{color:#fde68a}
.meta{background:#0b1220;border:1px solid #334155;border-radius:10px;padding:10px 12px;font-size:.85rem;margin-bottom:14px;color:#cbd5e1}
.meta b{color:#fde68a}
label{display:block;font-size:.78rem;font-weight:700;color:#94a3b8;margin:10px 0 4px}
input,textarea,select{width:100%;padding:12px;border-radius:10px;border:1px solid #475569;background:#0b1220;color:#fff;font-size:16px}
.btn{display:block;width:100%;margin-top:10px;padding:14px;border:none;border-radius:12px;font-weight:800;font-size:1rem;cursor:pointer;touch-action:manipulation}
.btn.gold{background:linear-gradient(135deg,#fde68a,#c9a84c);color:#14224f}
.btn.teal{background:linear-gradient(135deg,#14b8a6,#0f766e);color:#fff}
.btn.ghost{background:#16223f;color:#fde68a;border:1px solid rgba(201,168,76,.45)}
.btn:disabled{opacity:.6;cursor:wait}
.yn{display:flex;gap:8px;margin-top:8px}
.yn .opt{flex:1;padding:12px;border-radius:10px;border:1px solid #475569;background:#111a30;color:#e2e8f0;font-weight:800;cursor:pointer}
.yn .opt.on.yes{border-color:#22c55e;background:#14532d;color:#bbf7d0}
.yn .opt.on.no{border-color:#f87171;background:#7f1d1d;color:#fecaca}
.q{margin:12px 0;padding:12px;border-radius:12px;border:1px solid #334155;background:#0b1220}
.q b{display:block;margin-bottom:8px;color:#fde68a;font-size:.92rem}
.msg{margin-top:12px;padding:10px;border-radius:8px;display:none;font-size:.9rem}
.msg.ok{display:block;background:#0a2e1a;color:#4ade80}
.msg.err{display:block;background:#3a0a0a;color:#ef4444}
.hidden{display:none!important}
.score{font-size:1.8rem;font-weight:900;color:#fde68a;text-align:center;margin:12px 0}
.foot{text-align:center;margin-top:16px;font-size:.75rem;color:#64748b}
.topics{white-space:pre-wrap;margin-top:8px;color:#e2e8f0}
.channel{display:block;margin-top:12px;padding:12px;border-radius:12px;background:linear-gradient(135deg,#14532d,#0f766e);color:#fff;text-align:center;font-weight:800;text-decoration:none}
</style>
</head>
<body>
<div class="card">
  <div class="brand">
    <img src="${TRAINING_LOGO_URL}" alt="Agile">
    <div class="co">${TRAINING_BRAND.company}</div>
    <div class="dept">${TRAINING_BRAND.department}</div>
    <div class="tag">${TRAINING_BRAND.tagline}</div>
  </div>
  <h1>Training Confirmation &amp; Attendance</h1>
  <p class="steps"><b>Process</b><br>1) EOI — I will attend<br>2) ATTENDANCE — on training day<br>3) 5 Yes/No questions → marks → feedback</p>
  <div class="meta" id="metaBox">Loading…</div>
  <div id="msg" class="msg"></div>

  <div id="stepEoi">
    <p class="sub">Same as WhatsApp reply <b>EOI</b>.</p>
    <button type="button" class="btn gold" id="btnEoi">EOI — I will attend</button>
    <button type="button" class="btn ghost" id="btnCannot">Cannot attend</button>
  </div>

  <div id="stepEoiDone" class="hidden">
    <p class="sub" id="eoiDoneText">Thank you. Your EOI is recorded. On training day, open this link again and tap <b>ATTENDANCE</b>.</p>
  </div>

  <div id="stepAttend" class="hidden">
    <p class="sub">Same as WhatsApp reply <b>ATTENDANCE</b> (opens near training start time).</p>
    <label>Your full name</label>
    <input id="guardName" autocomplete="name" placeholder="As on ID card">
    <label>Employee ID (if known)</label>
    <input id="empId" autocomplete="off" placeholder="Optional">
    <button type="button" class="btn gold" id="btnAttend">ATTENDANCE — Confirm</button>
  </div>

  <div id="stepTest" class="hidden">
    <p class="sub">Attendance confirmed ✓ — answer <b>5 Yes/No questions</b>. One attempt only. You will see your marks after submit.</p>
    <div id="qList"></div>
    <button type="button" class="btn teal" id="btnTest">Submit answers &amp; see marks</button>
  </div>

  <div id="stepScore" class="hidden">
    <p class="sub" style="text-align:center">Thank you — your marks</p>
    <div class="score" id="scoreBox">—</div>
    <p class="sub" style="text-align:center">Please share short feedback on today’s training.</p>
    <button type="button" class="btn gold" id="btnGoFb">Open feedback</button>
  </div>

  <div id="stepFb" class="hidden">
    <p class="sub">Short feedback about today’s training.</p>
    <label>Rating</label>
    <select id="fbRating">
      <option value="">— select —</option>
      <option value="Excellent">Excellent</option>
      <option value="Good">Good</option>
      <option value="Average">Average</option>
      <option value="Needs improvement">Needs improvement</option>
    </select>
    <label>Comments</label>
    <textarea id="fbText" rows="3" placeholder="What went well / what to improve…"></textarea>
    <button type="button" class="btn gold" id="btnFb">Submit feedback</button>
  </div>

  <div id="stepThanks" class="hidden">
    <p class="sub" style="text-align:center;color:#bbf7d0;font-weight:700">Thank you for attending the Training session.</p>
    <p class="sub" style="text-align:center">Follow our WhatsApp channel — <b>Security News · Agile Group</b></p>
    <a class="channel" id="newsLink" href="#" target="_blank" rel="noopener">Open Security News — Agile Group</a>
  </div>
</div>
<p class="foot">${TRAINING_BRAND.company}<br>${TRAINING_BRAND.department}</p>
<script>
(function(){
  var TOKEN=${t};
  var CHANNEL=${channel};
  var API='/api/training/guards-link-data';
  var deviceKey='';
  var state={session:null,questions:[],response:null};
  try{
    deviceKey=localStorage.getItem('ojt_gl_device')||'';
    if(!deviceKey){deviceKey='d'+Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem('ojt_gl_device',deviceKey);}
  }catch(e){deviceKey='d'+Date.now();}

  function $(id){return document.getElementById(id);}
  function show(id){['stepEoi','stepEoiDone','stepAttend','stepTest','stepScore','stepFb','stepThanks'].forEach(function(x){var el=$(x);if(el)el.classList.toggle('hidden',x!==id);});}
  function msg(t,ok){var m=$('msg');m.className='msg '+(ok?'ok':'err');m.textContent=t;}
  function clearMsg(){var m=$('msg');m.className='msg';m.textContent='';}
  function esc(v){return String(v||'').replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]);});}

  function post(action, extra){
    return fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,token:TOKEN,deviceKey:deviceKey},extra||{}))})
      .then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});});
  }

  function paintMeta(){
    var s=state.session||{};
    var topics=String(s.topics||'').trim();
    $('metaBox').innerHTML='<b>'+esc(s.clientName||'Client')+'</b><br>Date: '+esc(s.trainingDate||'—')+(s.trainingTime?' · '+esc(s.trainingTime):'')+'<br>Venue: '+esc(s.location||'—')+'<br>Trainer: '+esc(s.trainerName||'—')+(topics?'<div class="topics"><b>Topics</b><br>'+esc(topics)+'</div>':'');
    if($('newsLink')) $('newsLink').href=CHANNEL||'#';
  }

  function paintQuestions(){
    var box=$('qList');
    box.innerHTML=(state.questions||[]).map(function(q,i){
      return '<div class="q" data-qid="'+esc(q.id)+'"><b>'+(i+1)+'. '+esc(q.text)+'</b>'+
        '<div class="yn">'+
          '<button type="button" class="opt yes" data-choice="Yes">Yes</button>'+
          '<button type="button" class="opt no" data-choice="No">No</button>'+
        '</div></div>';
    }).join('');
    box.querySelectorAll('.opt').forEach(function(btn){
      btn.addEventListener('click',function(){
        var q=btn.closest('.q');
        q.querySelectorAll('.opt').forEach(function(x){x.classList.remove('on');});
        btn.classList.add('on');
      });
    });
  }

  function resumeFromResponse(){
    var r=state.response||{};
    if(r.feedbackAt){ show('stepThanks'); return; }
    if(r.testDoneAt){
      $('scoreBox').textContent=(r.score!=null?r.score:'—')+' / '+(r.maxScore!=null?r.maxScore:'5');
      show('stepScore'); return;
    }
    if(r.attendedAt){ paintQuestions(); show('stepTest'); return; }
    if(r.eoiAt || r.status==='attending'){
      show('stepAttend');
      msg('EOI recorded. On training day tap ATTENDANCE.', true);
      return;
    }
    if(r.status && r.status!=='attending'){
      $('eoiDoneText').textContent='Thank you. Status recorded: cannot attend.';
      show('stepEoiDone'); return;
    }
    show('stepEoi');
  }

  $('btnEoi').onclick=function(){
    clearMsg();
    var b=$('btnEoi'); b.disabled=true;
    post('status',{status:'attending'}).then(function(res){
      b.disabled=false;
      if(res.s!==200||!res.j.ok){msg((res.j&&res.j.error)||'Could not save EOI.',false);return;}
      state.response=res.j.response;
      show('stepAttend');
      msg('EOI saved. On training day tap ATTENDANCE.',true);
    }).catch(function(){b.disabled=false;msg('Network error.',false);});
  };
  $('btnCannot').onclick=function(){
    clearMsg();
    var b=$('btnCannot'); b.disabled=true;
    post('status',{status:'not_working'}).then(function(res){
      b.disabled=false;
      if(res.s!==200||!res.j.ok){msg((res.j&&res.j.error)||'Could not save.',false);return;}
      state.response=res.j.response;
      $('eoiDoneText').textContent='Thank you. Status recorded: cannot attend.';
      show('stepEoiDone');
    }).catch(function(){b.disabled=false;msg('Network error.',false);});
  };

  $('btnAttend').onclick=function(){
    clearMsg();
    var btn=$('btnAttend'); btn.disabled=true;
    post('attendance',{guardName:$('guardName').value, employeeId:$('empId').value}).then(function(res){
      btn.disabled=false;
      if(res.s!==200||!res.j.ok){msg((res.j&&res.j.error)||'Could not confirm attendance.',false);return;}
      state.response=res.j.response;
      paintQuestions();
      show('stepTest');
      msg('ATTENDANCE confirmed. Please answer the questions.',true);
    }).catch(function(){btn.disabled=false;msg('Network error.',false);});
  };

  $('btnTest').onclick=function(){
    clearMsg();
    var answers=[];
    document.querySelectorAll('#qList .q').forEach(function(q){
      var on=q.querySelector('.opt.on');
      if(on) answers.push({qId:q.getAttribute('data-qid'), choice:on.getAttribute('data-choice')});
    });
    if(answers.length<(state.questions||[]).length){msg('Please answer all questions.',false);return;}
    var btn=$('btnTest'); btn.disabled=true;
    post('test',{answers:answers}).then(function(res){
      btn.disabled=false;
      if(res.s!==200||!res.j.ok){msg((res.j&&res.j.error)||'Could not submit.',false);return;}
      state.response=res.j.response;
      $('scoreBox').textContent=(res.j.response.score!=null?res.j.response.score:'—')+' / '+(res.j.response.maxScore!=null?res.j.response.maxScore:'5');
      show('stepScore');
    }).catch(function(){btn.disabled=false;msg('Network error.',false);});
  };

  $('btnGoFb').onclick=function(){ show('stepFb'); };
  $('btnFb').onclick=function(){
    clearMsg();
    var btn=$('btnFb'); btn.disabled=true;
    post('feedback',{rating:$('fbRating').value, text:$('fbText').value}).then(function(res){
      btn.disabled=false;
      if(res.s!==200||!res.j.ok){msg((res.j&&res.j.error)||'Could not save feedback.',false);return;}
      state.response=res.j.response;
      show('stepThanks');
      msg('Thank you for attending the Training session.',true);
    }).catch(function(){btn.disabled=false;msg('Network error.',false);});
  };

  if(!TOKEN){ $('metaBox').textContent='This confirmation link is not valid.'; show('stepEoiDone'); return; }
  post('meta').then(function(res){
    if(res.s!==200||!res.j.ok){
      $('metaBox').textContent=(res.j&&res.j.error)||'This confirmation link is not valid.';
      show('stepEoiDone');
      return;
    }
    state.session=res.j.session;
    state.questions=res.j.yesNoQuestions||res.j.questions||[];
    state.response=res.j.response;
    paintMeta();
    resumeFromResponse();
  }).catch(function(){
    $('metaBox').textContent='Could not load. Please try again.';
  });
})();
</script>
</body></html>`
}
