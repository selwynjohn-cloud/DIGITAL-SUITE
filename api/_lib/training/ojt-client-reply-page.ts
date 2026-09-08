/** Public client reply page for OJT intimation — no login. */

import { SUITE_DATE_INPUT_CSS, suiteDateInputInitScript } from '../suite-date-input.js'
import { suiteTapFeedbackInitScript } from '../suite-tap-feedback.js'

export function ojtClientReplyPageHtml(token: string): string {
  const t = String(token || '').replace(/[^\w-]/g, '')
  const tap = suiteTapFeedbackInitScript()
  const dateInit = suiteDateInputInitScript()
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Confirm OJT training — Agile Security Force</title>
<style>
${SUITE_DATE_INPUT_CSS}
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0f172a;color:#e2e8f0}
.wrap{max-width:560px;margin:0 auto;padding:20px 16px 40px}
.card{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:18px;margin-top:14px}
h1{font-size:1.25rem;margin:0 0 6px;color:#fde68a}
.muted{color:#94a3b8;font-size:.9rem;line-height:1.45}
.row{margin:12px 0}
label{display:block;font-size:.85rem;margin-bottom:4px;color:#cbd5e1;font-weight:700}
input,textarea,select{width:100%;box-sizing:border-box;padding:10px;border-radius:8px;border:1px solid #475569;background:#0b1220;color:#e2e8f0;font:inherit;min-height:44px}
.choice{display:grid;gap:10px;margin-top:8px}
.btn{display:block;width:100%;margin:0;padding:14px 16px;border-radius:12px;border:0;font-weight:800;cursor:pointer;font:inherit;text-align:center}
.btn.ok{background:#059669;color:#fff}
.btn.warn{background:#b45309;color:#fff}
.btn.primary{background:#c9a84c;color:#0f172a}
.btn.alt{background:#334155;color:#e2e8f0}
.btn:active{transform:scale(.98)}
.stamp{font-size:.8rem;color:#86efac;margin-top:10px}
.err{color:#fca5a5;margin-top:10px}
.hidden{display:none!important}
.detail{font-size:.92rem;line-height:1.5;margin:10px 0}
.detail b{color:#fde68a}
.change-title{font-size:1rem;font-weight:800;color:#fde68a;margin:0 0 10px}
.hint{font-size:.82rem;color:#94a3b8;margin:4px 0 0;line-height:1.4}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:480px){.grid2{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="wrap">
  <h1>OJT confirmation</h1>
  <p class="muted" style="margin:0 0 4px"><b style="color:#fde68a">Agile Security Force Private Limited</b></p>
  <p class="muted" style="margin:0 0 4px">Department of Security Training &amp; Excellence</p>
  <p class="muted" style="font-style:italic;color:#99f6e4;margin:0 0 10px">Empowering Guards. Elevating Security.</p>
  <p class="muted">Please choose one option. Your reply is date-stamped.</p>
  <div id="loadMsg" class="muted">Loading schedule…</div>
  <div id="main" class="hidden">
    <div class="card">
      <div class="detail" id="summary"></div>
      <p class="muted" id="stampLine"></p>
    </div>

    <div class="card" id="formCard">
      <p class="muted" style="margin-top:0">Choose one:</p>
      <div class="choice">
        <button type="button" class="btn ok app-tap-btn" id="btnConfirm">Confirmed as Scheduled</button>
        <button type="button" class="btn warn app-tap-btn" id="btnNeedChange">Change Required</button>
      </div>

      <div id="changePanel" class="hidden" style="margin-top:18px;padding-top:14px;border-top:1px solid #334155">
        <p class="change-title">Change required</p>
        <p class="hint" style="margin-bottom:12px">Fill what you need below, then tap <b>Confirmed</b>.</p>

        <div class="row">
          <label for="removeTopic">Remove topic</label>
          <select id="removeTopic">
            <option value="">— No topic to remove —</option>
          </select>
          <p class="hint">Optional — pick a topic to remove from this training.</p>
        </div>

        <div class="row">
          <label for="topicName">Add topic</label>
          <input id="topicName" maxlength="200" placeholder="Type the new topic name"/>
          <p class="hint">Optional — leave blank if you are not adding a topic.</p>
        </div>

        <div class="row">
          <label>Change date</label>
          <div class="grid2">
            <div>
              <label for="newDate" style="font-weight:600;color:#94a3b8">Date</label>
              <input id="newDate" type="date"/>
            </div>
            <div>
              <label for="newTime" style="font-weight:600;color:#94a3b8">Time</label>
              <input id="newTime" type="time"/>
            </div>
          </div>
          <p class="hint">Optional — pick new date and time only if the schedule must change.</p>
        </div>

        <button type="button" class="btn primary app-tap-btn" id="btnChangeConfirm" style="margin-top:8px">Confirmed</button>
        <button type="button" class="btn alt app-tap-btn" id="btnChangeBack" style="margin-top:8px">Back</button>
      </div>

      <p class="err hidden" id="err"></p>
    </div>

    <div class="card hidden" id="doneCard">
      <p id="doneMsg" style="margin:0;font-weight:700;color:#86efac"></p>
      <p class="stamp" id="doneStamp"></p>
      <p class="muted">The site will be informed digitally. Thank you for your support.</p>
    </div>
  </div>
</div>
<script>
${tap}
${dateInit}
(function(){
  var TOKEN=${JSON.stringify(t)};
  var API='/api/training/client-reply-data';
  var TOPIC_LIST=[];
  var ORIG_DATE='';
  var ORIG_TIME='';
  function $(id){return document.getElementById(id);}
  function showErr(m){ var e=$('err'); e.textContent=m||''; e.classList.toggle('hidden',!m); }
  function api(action, extra){
    return fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,token:TOKEN},extra||{}))})
      .then(function(r){return r.json();})
      .then(function(j){ if(!j||j.ok===false) throw new Error((j&&j.error)||'Request failed'); return j; });
  }
  function fmtStamp(iso){
    if(!iso) return '';
    try{
      var d=new Date(iso);
      return d.toLocaleString('en-IN',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'})+' IST';
    }catch(e){ return iso; }
  }
  function parseTopics(raw){
    return String(raw||'')
      .split(/\\n|;|\\u2022|\\|/g)
      .map(function(x){return x.replace(/^\\s*\\d+[\\.\\)\\-]\\s*/,'').trim();})
      .filter(Boolean);
  }
  function fillRemoveTopics(topicsText){
    TOPIC_LIST=parseTopics(topicsText);
    var sel=$('removeTopic');
    sel.innerHTML='<option value="">— No topic to remove —</option>'+
      TOPIC_LIST.map(function(t,i){
        return '<option value="'+String(t).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')+'">'+(i+1)+'. '+String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</option>';
      }).join('');
  }
  function openChangePanel(){
    showErr('');
    $('changePanel').classList.remove('hidden');
    try{ $('changePanel').scrollIntoView({behavior:'smooth',block:'nearest'}); }catch(e){}
  }
  function closeChangePanel(){
    showErr('');
    $('changePanel').classList.add('hidden');
  }
  function render(j){
    $('loadMsg').classList.add('hidden');
    $('main').classList.remove('hidden');
    var s=j.session||{};
    $('summary').innerHTML=
      '<div><b>Client / unit:</b> '+(s.clientName||'—')+'</div>'+
      '<div><b>Date &amp; time:</b> '+(s.trainingDate||'—')+' · '+(s.trainingTime||'—')+'</div>'+
      '<div><b>Venue:</b> '+(s.location||'—')+'</div>'+
      '<div><b>Trainer:</b> '+(s.trainerName||'—')+'</div>'+
      '<div style="margin-top:8px;white-space:pre-wrap"><b>Topics:</b><br>'+(s.topics||'—')+'</div>';
    fillRemoveTopics(s.topics||'');
    if(j.lastReply && j.lastReply.repliedAt){
      $('stampLine').textContent='Last reply recorded: '+fmtStamp(j.lastReply.repliedAt);
    } else {
      $('stampLine').textContent='No reply yet — please confirm below.';
    }
    ORIG_DATE=String(s.trainingDate||'').trim();
    ORIG_TIME=String(s.trainingTime||'').trim().slice(0,5);
    if(ORIG_DATE) $('newDate').value=ORIG_DATE;
    if(ORIG_TIME) $('newTime').value=ORIG_TIME;
  }
  function done(j){
    $('formCard').classList.add('hidden');
    $('doneCard').classList.remove('hidden');
    $('doneMsg').textContent=j.message||'Thank you. Your reply is recorded.';
    $('doneStamp').textContent='Date stamp: '+fmtStamp(j.repliedAt||'');
    if(j.session) render({session:j.session, lastReply:j.reply});
  }
  api('load').then(render).catch(function(e){
    $('loadMsg').textContent=e.message||'Link not found.';
    $('loadMsg').classList.add('err');
  });
  $('btnConfirm').onclick=function(){
    showErr('');
    api('reply',{replyAction:'confirm'}).then(done).catch(function(e){showErr(e.message);});
  };
  $('btnNeedChange').onclick=function(){ openChangePanel(); };
  $('btnChangeBack').onclick=function(){ closeChangePanel(); };
  $('btnChangeConfirm').onclick=function(){
    showErr('');
    var removeTopic=($('removeTopic').value||'').trim();
    var addTopic=($('topicName').value||'').trim();
    var d=($('newDate').value||'').trim();
    var tm=($('newTime').value||'').trim().slice(0,5);
    var dateChanged=Boolean(d && tm && (d!==ORIG_DATE || tm!==ORIG_TIME));
    if((d && !tm) || (!d && tm)){
      showErr('Please pick both the new date and the new time.');
      return;
    }
    if(!removeTopic && !addTopic && !dateChanged){
      showErr('Please remove a topic, add a topic, or change the date/time — then tap Confirmed.');
      return;
    }
    api('reply',{
      replyAction:'changeRequired',
      removeTopicName:removeTopic,
      topicName:addTopic,
      newDate:dateChanged?d:'',
      newTime:dateChanged?tm:''
    }).then(done).catch(function(e){showErr(e.message);});
  };
})();
</script>
</body>
</html>`
}
