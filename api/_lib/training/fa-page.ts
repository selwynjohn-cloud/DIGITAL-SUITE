/**
 * Public phone page — Facility Attendant HDFC Banking Safety.
 * Usual Training header + suite footer. Back / Start sit above the footer.
 */

import { suiteAppOpenPageFooterHtml } from '../suite-app-footer.js'
import { SUITE_TAP_FEEDBACK_CSS, suiteTapFeedbackInitScript } from '../suite-tap-feedback.js'
import { FA_LANGS, copies, faCopy, type Lang } from './fa-i18n.js'
import { TRAINING_BRAND, TRAINING_LOGO_URL } from './training-brand.js'

export type FaBranchOpt = { id: string; name: string }

function copiesJson(): string {
  const pack: Record<string, ReturnType<typeof faCopy>> = {}
  for (const code of FA_LANGS) pack[code] = faCopy(code)
  return JSON.stringify(pack)
}

function langsJson(): string {
  return JSON.stringify(
    FA_LANGS.map((code) => ({
      code,
      name: copies[code as Lang].name,
      native: copies[code as Lang].native,
    })),
  )
}

export function faTrainingPageHtml(branches: FaBranchOpt[]): string {
  const branchesJson = JSON.stringify(branches)
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Facility Attendant Training — HDFC Bank Safety</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{
  font-family:'Segoe UI',system-ui,sans-serif;color:#e2e8f0;min-height:100vh;
  background:
    radial-gradient(1200px 500px at 10% -10%,rgba(201,168,76,.28),transparent 55%),
    radial-gradient(900px 420px at 90% 0%,rgba(15,118,110,.35),transparent 50%),
    linear-gradient(165deg,#070d1a 0%,#0b1220 40%,#12203a 100%);
}
${SUITE_TAP_FEEDBACK_CSS}
.tr-hero{
  position:relative;overflow:hidden;padding:22px 16px 18px;
  background:linear-gradient(135deg,#0e1730 0%,#14224f 45%,#0f766e 120%);
  border-bottom:3px solid #c9a84c;box-shadow:0 12px 36px rgba(0,0,0,.35);
}
.tr-hero-inner{max-width:720px;margin:0 auto;display:flex;align-items:center;gap:14px}
.tr-logo{height:72px;width:auto;max-width:110px;object-fit:contain;background:transparent!important;filter:drop-shadow(0 4px 12px rgba(0,0,0,.35))}
.tr-co{font-size:.95rem;font-weight:800;color:#fff;line-height:1.25}
.tr-dept{margin-top:4px;font-size:.78rem;font-weight:700;color:#fde68a;letter-spacing:.04em;text-transform:uppercase}
.tr-tag{margin-top:6px;font-size:1.02rem;font-weight:800;color:#99f6e4;font-style:italic}
.progress{max-width:720px;margin:10px auto 0;display:flex;align-items:center;gap:8px;font-size:.78rem;font-weight:800;color:#cbd5e1}
.bar{flex:1;height:8px;background:#1e293b;border-radius:99px;overflow:hidden}
.bar i{display:block;height:100%;background:linear-gradient(90deg,#fde68a,#c9a84c);width:0}
.wrap{max-width:720px;margin:0 auto;padding:16px 16px 28px}
.card{
  background:linear-gradient(160deg,rgba(17,26,48,.96),rgba(14,23,48,.92));
  border:1px solid rgba(201,168,76,.4);border-radius:18px;padding:22px 18px;
  box-shadow:0 14px 40px rgba(0,0,0,.35);
}
.kicker{font-size:.78rem;font-weight:900;letter-spacing:.14em;color:#fde68a;text-transform:uppercase}
h1{font-size:1.7rem;line-height:1.22;margin:8px 0 10px;color:#fff;letter-spacing:-.02em}
.lede{color:#cbd5e1;font-size:1.12rem;line-height:1.5;font-weight:600}
.badge{display:inline-block;margin:0 0 10px;padding:6px 10px;border-radius:999px;background:#14224f;border:1px solid #c9a84c;color:#fde68a;font-weight:800;font-size:.78rem}
label{display:block;font-size:.92rem;font-weight:800;color:#fde68a;margin:14px 0 6px}
input,select{
  width:100%;min-height:52px;padding:12px 14px;border:1px solid #64748b;border-radius:12px;
  font-size:18px;background:#0b1220;color:#fff;
}
.langs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:16px 0}
.langs button{min-height:58px;border:1px solid rgba(201,168,76,.35);border-radius:12px;background:#0e1730;color:#e2e8f0;cursor:pointer}
.langs button.on{border:2px solid #c9a84c;background:#16223f}
.langs b{display:block;font-size:.95rem;color:#fff}
.langs small{display:block;font-size:.7rem;color:#94a3b8}
.pic{margin:14px 0 18px;padding:18px 12px 22px;border-radius:18px;border:2px solid #38bdf8;background:linear-gradient(165deg,#0f2744,#123a5c);min-height:280px}
.pic.amber{border-color:#fbbf24;background:linear-gradient(165deg,#3b2a08,#5b3d0c)}
.pic-row{display:flex;flex-wrap:wrap;align-items:stretch;justify-content:center;gap:12px}
.fig{
  flex:1 1 140px;min-height:168px;padding:16px 10px;border-radius:16px;background:#fff;
  color:#0f172a;text-align:center;font-weight:900;font-size:1.05rem;line-height:1.25;
  box-shadow:0 10px 24px rgba(0,0,0,.25);
}
.fig .ico{font-size:3.2rem;line-height:1;margin-bottom:8px}
.bubble{
  flex:1 1 160px;align-self:center;padding:16px 14px;border-radius:16px;
  background:#fde68a;color:#14224f;font-weight:900;font-size:1.15rem;line-height:1.3;text-align:center;
}
.ban{
  margin:16px auto 0;max-width:280px;padding:10px 14px;border-radius:12px;
  background:#dc2626;color:#fff;font-weight:900;font-size:1.25rem;letter-spacing:.08em;text-align:center;
}
.punish{
  margin:12px 0 16px;padding:18px 14px;border-radius:16px;border:5px solid #dc2626;
  background:linear-gradient(180deg,#2a0b0b,#450a0a);box-shadow:0 0 0 4px rgba(220,38,38,.25);
}
.punish h2{margin:0 0 8px;color:#fecaca;font-size:1.8rem;letter-spacing:.12em;text-align:center}
.victim{margin:0 0 16px;color:#fff;font-size:1.35rem;font-weight:900;text-align:center;line-height:1.3}
.cons{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cons div{padding:16px 10px;border-radius:12px;background:#7f1d1d;border:2px solid #f87171;color:#fff;font-weight:900;font-size:1.05rem;text-align:center}
.do{margin-top:14px;padding:14px;border-radius:12px;background:#052e16;border:1px solid #86efac;color:#bbf7d0;font-size:1.08rem;line-height:1.45;font-weight:700}
.listen{
  display:inline-flex;align-items:center;gap:8px;margin-top:14px;padding:12px 16px;
  border:0;border-radius:999px;background:#14532d;color:#fde68a;font-weight:900;font-size:1rem;cursor:pointer;
}
.yn{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}
.yn button{min-height:96px;border:3px solid #475569;border-radius:16px;background:#0e1730;font-size:1.4rem;font-weight:900;cursor:pointer;color:#fff}
.yn button.ok{border-color:#22c55e;background:#14532d}
.yn button.bad{border-color:#ef4444;background:#7f1d1d}
.fb{margin-top:14px;padding:14px;border-radius:12px;font-size:1.05rem;line-height:1.4;font-weight:700}
.fb.good{background:#052e16;color:#bbf7d0}
.fb.bad{background:#450a0a;color:#fecaca}
.pledge{margin:8px 0;padding:12px;border-radius:10px;background:#052e16;color:#bbf7d0;font-weight:800;font-size:1.02rem}
.legal{margin:12px 0;padding:12px;border-left:4px solid #c9a84c;background:#0e1730;color:#cbd5e1;font-size:.95rem;line-height:1.5}
.accept{width:100%;display:flex;gap:12px;align-items:flex-start;text-align:left;padding:16px;border:2px solid #475569;border-radius:14px;background:#0e1730;cursor:pointer;color:#fff}
.accept.on{border-color:#c9a84c;background:#16223f}
.meta2{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}
.meta2 div,.meta2 button{padding:12px;border-radius:10px;background:#0e1730;border:1px solid #334155;font-size:.78rem;color:#94a3b8;text-align:left}
.meta2 b{display:block;margin-top:4px;color:#fde68a;font-size:.95rem}
.actions{display:flex;gap:10px;margin:16px 0 8px}
.btn{flex:1;min-height:54px;border:0;border-radius:14px;font-weight:900;font-size:1.08rem;cursor:pointer}
.btn.gold{background:linear-gradient(135deg,#fde68a,#c9a84c);color:#14224f}
.btn.ghost{background:#16223f;color:#fde68a;border:1px solid rgba(201,168,76,.45)}
.btn:disabled{opacity:.5}
.okcard{text-align:center}
.okcard .tick{width:80px;height:80px;margin:0 auto 12px;border-radius:50%;background:#14532d;color:#bbf7d0;display:grid;place-items:center;font-size:2.2rem;font-weight:900}
.rec{display:grid;grid-template-columns:1fr 1fr;gap:8px;text-align:left;margin:16px 0}
.rec span{padding:12px;background:#0e1730;border-radius:10px;font-size:.72rem;color:#94a3b8;text-transform:uppercase;font-weight:800}
.rec b{display:block;margin-top:4px;color:#fff;font-size:.95rem;text-transform:none}
.note{margin-top:10px;font-size:.9rem;color:#94a3b8}
@media(max-width:420px){
  h1{font-size:1.45rem}
  .fig{min-height:150px;font-size:.95rem}
  .fig .ico{font-size:2.7rem}
  .cons{grid-template-columns:1fr}
  .yn,.meta2,.rec{grid-template-columns:1fr}
}
</style>
</head>
<body>
<header class="tr-hero">
  <div class="tr-hero-inner">
    <img class="tr-logo" src="${TRAINING_LOGO_URL}" alt="Agile Security Force" width="110" height="72">
    <div>
      <div class="tr-co">${TRAINING_BRAND.company}</div>
      <div class="tr-dept">${TRAINING_BRAND.department}</div>
      <div class="tr-tag">${TRAINING_BRAND.tagline}</div>
    </div>
  </div>
  <div class="progress">
    <span id="progLabel">Language</span>
    <div class="bar"><i id="progBar"></i></div>
    <b id="progNum">1/8</b>
  </div>
</header>
<main class="wrap">
  <section class="card" id="view"></section>
  <div class="actions" id="nav"></div>
  ${suiteAppOpenPageFooterHtml()}
</main>
<script>
${suiteTapFeedbackInitScript()}
(function(){
  var COPIES=${copiesJson()};
  var LANGS=${langsJson()};
  var BRANCHES=${branchesJson};
  var KEY='agile-fa-training-v3';
  var step=-1, started=false, accepted=false, submitted=false, locBusy=false, ladyVoice=null;
  var lang='en', locationTxt='Not captured', rec=null;
  var form={name:'',employeeId:'',client:'HDFC Bank',branchId:'',branchName:'',hdfcSite:'',mobile:''};
  var answers={};
  function c(){ return COPIES[lang]||COPIES.en; }
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function branchName(id){
    for(var i=0;i<BRANCHES.length;i++){ if(BRANCHES[i].id===id) return BRANCHES[i].name; }
    return form.branchName||'';
  }
  function pickLadyVoice(){
    if(!window.speechSynthesis) return null;
    var want=(c().speech||'en-IN').toLowerCase();
    var want2=want.slice(0,2);
    var wantEn=/^en/.test(want);
    var voices=window.speechSynthesis.getVoices()||[];
    function sameLang(v){
      var vlang=String(v.lang||'').toLowerCase();
      return vlang===want || vlang.indexOf(want2+'-')===0 || vlang===want2;
    }
    var pool=voices.filter(sameLang);
    if(!pool.length && wantEn) pool=voices.filter(function(v){ return /^en/i.test(v.lang||''); });
    if(!pool.length) pool=voices.slice();
    function score(v){
      var n=(v.name||'').toLowerCase();
      var vlang=String(v.lang||'').toLowerCase();
      var s=0;
      if(!sameLang(v) && !wantEn) s-=40;
      if(vlang===want) s+=16;
      else if(sameLang(v)) s+=12;
      if(/google/.test(n) && sameLang(v)) s+=8;
      if(/natural|online|premium|neural/.test(n) && sameLang(v)) s+=5;
      if(/female|woman|swara|neerja|lekha/.test(n)) s+=3;
      if(wantEn && /veena|heera|raveena|compact|eloquent/.test(n)) s-=24;
      if(wantEn && /samantha|karen|moira|tessa|zira/.test(n)) s+=4;
      return s;
    }
    return pool.slice().sort(function(a,b){ return score(b)-score(a); })[0]||null;
  }
  function readyVoices(){
    ladyVoice=pickLadyVoice();
    if(window.speechSynthesis) window.speechSynthesis.onvoiceschanged=function(){ ladyVoice=pickLadyVoice(); };
  }
  readyVoices();
  function squeeze(t){
    var out='', prev=false, i;
    t=String(t||'');
    for(i=0;i<t.length;i++){
      var ch=t.charAt(i);
      if(ch===' '||ch.charCodeAt(0)===10||ch.charCodeAt(0)===9){ if(!prev){ out+=' '; prev=true; } }
      else { out+=ch; prev=false; }
    }
    return out.trim();
  }
  function forSpeech(s){
    var t=' '+squeeze(s)+' ';
    t=t.split('—').join('. ').split('–').join('. ');
    t=t.split('"').join('').split('“').join('').split('”').join('');
    return squeeze(t);
  }
  function splitTalk(clean){
    var out=[], cur='', i;
    clean=String(clean||'');
    for(i=0;i<clean.length;i++){
      cur+=clean.charAt(i);
      var ch=clean.charAt(i);
      if((ch==='.'||ch==='?'||ch==='!'||ch==='।') && (clean.charAt(i+1)===' '||i===clean.length-1)){
        if(cur.trim()) out.push(cur.trim());
        cur='';
        if(clean.charAt(i+1)===' ') i++;
      }
    }
    if(cur.trim()) out.push(cur.trim());
    return out;
  }
  function talkRate(v){
    var n=((v&&v.name)||'').toLowerCase();
    var want=(c().speech||'en-IN').toLowerCase();
    if(/google/.test(n)) return /^en/.test(want) ? 1.06 : 1.0;
    if(!/^en/.test(want)) return 1.0;
    if(/samantha|karen|moira|tessa/.test(n)) return 1.04;
    return 1.05;
  }
  function talkGap(kind, text){
    if(kind==='break') return 700;
    if(kind==='title') return 420;
    var last=String(text||'').slice(-1);
    if(last==='?'||last==='!') return 500;
    if(kind==='example') return 480;
    return 380;
  }
  function talkShape(v, kind, idx){
    var base=talkRate(v);
    if(kind==='title') return {pitch:1.04, rate:base*0.98};
    if(kind==='example') return {pitch:1.02, rate:base};
    return {pitch:1.0, rate:base};
  }
  function pushTalk(chunks, text, kind){
    splitTalk(forSpeech(text)).forEach(function(bit){
      if(bit) chunks.push({text:bit, kind:kind||'body'});
    });
  }
  var talkTimer=null;
  function speakChunks(parts){
    if(!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if(talkTimer){ clearTimeout(talkTimer); talkTimer=null; }
    var chunks=[];
    (parts||[]).forEach(function(part){
      if(!part) return;
      if(typeof part==='string') pushTalk(chunks, part, 'body');
      else if(part.kind==='break') chunks.push({text:'', kind:'break'});
      else pushTalk(chunks, part.text, part.kind||'body');
    });
    if(!chunks.length) return;
    var i=0;
    function next(){
      if(i>=chunks.length) return;
      var item=chunks[i++];
      if(item.kind==='break'){ talkTimer=setTimeout(next, talkGap('break')); return; }
      var v=ladyVoice||pickLadyVoice();
      var shape=talkShape(v, item.kind, i);
      var u=new SpeechSynthesisUtterance(item.text);
      u.lang=(v&&v.lang)||c().speech||'en-IN';
      u.rate=shape.rate;
      u.pitch=shape.pitch;
      if(v) u.voice=v;
      u.onend=function(){ talkTimer=setTimeout(next, talkGap(item.kind, item.text)); };
      window.speechSynthesis.speak(u);
    }
    next();
  }
  function speak(text){ speakChunks([text]); }
  try{
    var saved=JSON.parse(localStorage.getItem(KEY)||'null');
    if(saved){
      if(typeof saved.step==='number') step=saved.step;
      if(typeof saved.started==='boolean') started=saved.started;
      if(typeof saved.accepted==='boolean') accepted=saved.accepted;
      if(saved.lang&&COPIES[saved.lang]) lang=saved.lang;
      if(saved.form) form=Object.assign(form,saved.form,{client:'HDFC Bank'});
      if(saved.answers) answers=saved.answers;
      if(typeof saved.locationTxt==='string') locationTxt=saved.locationTxt;
      if(saved.rec){ rec=saved.rec; submitted=true; }
    }
  }catch(e){}
  function persist(){
    try{ localStorage.setItem(KEY, JSON.stringify({step:step,started:started,accepted:accepted,lang:lang,form:form,answers:answers,locationTxt:locationTxt,rec:rec})); }catch(e){}
  }
  function captureGps(cb){
    locBusy=true; render();
    if(!navigator.geolocation){ locationTxt='Unavailable'; locBusy=false; if(cb)cb(); render(); return; }
    navigator.geolocation.getCurrentPosition(function(p){
      locationTxt=p.coords.latitude.toFixed(5)+', '+p.coords.longitude.toFixed(5);
      locBusy=false; persist(); if(cb)cb(); render();
    }, function(){
      locationTxt='Permission not granted'; locBusy=false; if(cb)cb(); render();
    }, {enableHighAccuracy:true,timeout:9000});
  }
  function profileOk(){
    var mob=String(form.mobile||'').replace(/\\D/g,'');
    if(mob.length===12 && mob.indexOf('91')===0) mob=mob.slice(2);
    return form.name.trim() && form.employeeId.trim() && form.branchId && mob.length===10;
  }
  function qCorrect(i){ return answers[i]===c().questions[i].correct; }
  function quizOk(){ return qCorrect(0)&&qCorrect(1)&&qCorrect(2); }
  function gpsOk(){ return /^-?\\d+\\.\\d+,\\s*-?\\d+\\.\\d+$/.test(locationTxt); }
  function setLang(code){ lang=code; ladyVoice=pickLadyVoice(); persist(); render(); }
  function scene(i){
    if(i===0) return '<div class="pic"><div class="pic-row"><div class="fig"><div class="ico">🏦</div>BANK STAFF</div><div class="bubble">“Please do this bank transaction”</div><div class="fig"><div class="ico">🛡️</div>FACILITY ATTENDANT</div></div><div class="ban">NOT ALLOWED</div></div>';
    if(i===1) return '<div class="pic amber"><div class="pic-row"><div class="fig"><div class="ico">👤</div>OTHER PERSON</div><div class="bubble">Money into YOUR account</div><div class="fig"><div class="ico">📱</div>YOUR BANK ACCOUNT</div></div><div class="ban">MULE ACCOUNT — NO</div></div>';
    return '<div class="punish"><h2>'+esc(c().punishBanner)+'</h2><p class="victim">'+esc(c().victimLine)+'</p><div class="cons"><div>Removal from duty</div><div>Contract action</div><div>Blacklisted</div><div>Legal action</div></div></div>';
  }
  function langGrid(){
    return '<div class="langs">'+LANGS.map(function(L){
      return '<button type="button" class="app-tap-btn'+(lang===L.code?' on':'')+'" data-lang="'+L.code+'"><b>'+esc(L.native)+'</b><small>'+esc(L.name)+'</small></button>';
    }).join('')+'</div>';
  }
  function viewHtml(){
    var copy=c();
    if(!started){
      return '<p class="kicker">FACILITY ATTENDANT TRAINING</p><h1>'+esc(copy.title)+'</h1><p class="lede">'+esc(copy.subtitle)+'</p>'+
        '<p class="lede" style="margin-top:10px">3 rules · 3 checks · Company certificate</p>'+
        '<h2 style="margin-top:16px;font-size:1.2rem;color:#fff">'+esc(copy.choose)+'</h2><p class="lede">'+esc(copy.chooseHelp)+'</p>'+langGrid();
    }
    if(submitted && rec){
      return '<div class="okcard"><div class="tick">✓</div><p class="kicker">'+esc(copy.recorded)+'</p><h1>'+esc(copy.thanks)+', '+esc(rec.name)+'.</h1><p class="lede">'+esc(copy.completed)+'</p>'+
        '<div class="rec"><span>'+esc(copy.certCode)+'<b>'+esc(rec.code)+'</b></span><span>'+esc(copy.employeeId)+'<b>'+esc(rec.employeeId)+'</b></span><span>'+esc(copy.score)+'<b>'+esc(rec.score)+'</b></span><span>'+esc(copy.date)+'<b>'+esc(rec.submittedAt)+'</b></span><span>'+esc(copy.agileBranch)+'<b>'+esc(rec.branchName)+'</b></span><span>'+esc(copy.gps)+'<b>'+esc(rec.gps)+'</b></span></div>'+
        '<button type="button" class="btn gold" id="btnPrint">'+esc(copy.printCert)+'</button>'+
        '<p class="note">WhatsApp is sent to you and your Branch HOD. Mail copies go to Sridhar and Director.</p></div>';
    }
    if(step===0){
      var opts='<option value="">Select Agile Branch Name</option>'+BRANCHES.map(function(b){
        return '<option value="'+esc(b.id)+'"'+(form.branchId===b.id?' selected':'')+'>'+esc(b.name)+'</option>';
      }).join('');
      return '<p class="kicker">'+esc(copy.before)+'</p><h1>'+esc(copy.details)+'</h1>'+
        '<span class="badge">HDFC Bank</span><p class="lede">'+esc(copy.detailsHelp)+'</p>'+
        '<label>'+esc(copy.agileBranch)+'</label><select id="fBranch">'+opts+'</select>'+
        '<label>'+esc(copy.fullName)+'</label><input id="fName" value="'+esc(form.name)+'" autocomplete="name">'+
        '<label>'+esc(copy.employeeId)+'</label><input id="fId" value="'+esc(form.employeeId)+'">'+
        '<label>'+esc(copy.mobile)+'</label><input id="fMobile" inputmode="tel" value="'+esc(form.mobile)+'" placeholder="10-digit mobile">';
    }
    if(step>=1 && step<=3){
      var r=copy.rules[step-1];
      var kick=step===3?copy.punishBanner:'RULE 0'+step;
      return '<p class="kicker">'+esc(kick)+'</p>'+scene(step-1)+'<h1>'+esc(r.title)+'</h1><p class="lede">'+esc(r.body)+'</p>'+
        (r.example?'<p class="lede" style="margin-top:8px"><b>'+esc(copy.exampleWord||'Example.')+'</b> '+esc(r.example)+'</p>':'')+
        '<div class="do"><b>'+esc(copy.doRight)+'</b><br>'+esc(r.doInstead||'')+'</div>'+
        '<button type="button" class="listen app-tap-btn" id="btnListen">🔊 '+esc(copy.listenAll)+'</button>';
    }
    if(step>=4 && step<=6){
      var qi=step-4, q=copy.questions[qi], a=answers[qi];
      var fb='';
      if(a){
        var good=a===q.correct;
        fb='<div class="fb '+(good?'good':'bad')+'"><b>'+(good?esc(copy.correct):esc(copy.retry))+'</b><p>'+esc(q.help)+'</p></div>';
      }
      var extra='';
      if(step===6 && quizOk()){
        extra='<p class="kicker" style="margin-top:18px">'+esc(copy.formal)+'</p><h1>'+esc(copy.watched)+'</h1>'+
          copy.pledges.map(function(p){ return '<p class="pledge">✓ '+esc(p)+'</p>'; }).join('')+
          '<p class="legal">'+esc(copy.legal)+'</p>'+
          '<button type="button" class="accept'+(accepted?' on':'')+'" id="btnAccept"><span style="font-size:1.4rem">'+(accepted?'☑':'☐')+'</span><span><b>'+esc(copy.accept)+'</b></span></button>'+
          '<div class="meta2"><div>Mobile<b>'+esc(form.mobile)+'</b></div><div>Score<b>3/3</b></div>'+
          '<button type="button" id="btnGps">GPS<b>'+(locBusy?'Capturing…':esc(locationTxt))+'</b></button>'+
          '<div>'+esc(copy.agileBranch)+'<b>'+esc(branchName(form.branchId))+'</b></div></div>';
      }
      return '<p class="kicker">CHECK '+(qi+1)+' OF 3</p><h1>'+esc(q.title)+'</h1>'+
        '<button type="button" class="listen app-tap-btn" id="btnHear">🔊 '+esc(copy.hear)+'</button>'+
        '<div class="yn"><button type="button" class="app-tap-btn'+(a==='yes'?(a===q.correct?' ok':' bad'):'')+'" data-ans="yes">'+esc(copy.yes)+'</button>'+
        '<button type="button" class="app-tap-btn'+(a==='no'?(a===q.correct?' ok':' bad'):'')+'" data-ans="no">'+esc(copy.no)+'</button></div>'+fb+extra;
    }
    return '';
  }
  function navHtml(){
    var copy=c();
    if(!started) return '<button type="button" class="btn gold" id="btnStart">'+esc(copy.continue)+'</button>';
    if(submitted) return '<button type="button" class="btn ghost" id="btnNew">'+esc(copy.newRecord)+'</button>';
    var nextDis='';
    if(step===0 && !profileOk()) nextDis=' disabled';
    if(step>=4 && step<=6 && !qCorrect(step-4)) nextDis=' disabled';
    if(step===6 && quizOk()){
      var can=accepted && gpsOk();
      return '<button type="button" class="btn ghost" id="btnBack">'+esc(copy.back)+'</button>'+
        '<button type="button" class="btn gold" id="btnSubmit"'+(can?'':' disabled')+'>'+esc(copy.submit)+'</button>';
    }
    var nextLabel=step===0?copy.start: step<=3?copy.understand:copy.next;
    return '<button type="button" class="btn ghost" id="btnBack"'+(step===0?' disabled':'')+'>'+esc(copy.back)+'</button>'+
      '<button type="button" class="btn gold" id="btnNext"'+nextDis+'>'+esc(nextLabel)+'</button>';
  }
  function lessonTalk(){
    if(step>=1 && step<=3){
      var r=c().rules[step-1];
      var parts=[{text:r.title, kind:'title'}, {kind:'break'}, {text:r.body, kind:'body'}];
      if(r.example){ parts.push({kind:'break'}); parts.push({text:(c().exampleWord||'Example.')+' '+r.example, kind:'example'}); }
      if(r.doInstead){ parts.push({kind:'break'}); parts.push({text:r.doInstead, kind:'body'}); }
      if(step===3){
        parts.push({kind:'break'});
        parts.push({text:c().punishBanner, kind:'title'});
        parts.push({text:c().victimLine, kind:'body'});
      }
      speakChunks(parts);
    }
  }
  function bind(){
    document.querySelectorAll('[data-lang]').forEach(function(btn){
      btn.addEventListener('click', function(){ setLang(btn.getAttribute('data-lang')); });
    });
    if($('btnStart')) $('btnStart').onclick=function(){ started=true; step=0; persist(); render(); };
    function refreshNext(){
      var btn=$('btnNext');
      if(btn && step===0) btn.disabled=!profileOk();
      var sub=$('btnSubmit');
      if(sub) sub.disabled=!(accepted && quizOk() && gpsOk());
    }
    if($('fName')) $('fName').oninput=function(){ form.name=this.value; persist(); refreshNext(); };
    if($('fId')) $('fId').oninput=function(){ form.employeeId=this.value; persist(); refreshNext(); };
    if($('fMobile')) $('fMobile').oninput=function(){ form.mobile=this.value; persist(); refreshNext(); };
    if($('fBranch')) $('fBranch').onchange=function(){ form.branchId=this.value; form.branchName=branchName(this.value); persist(); refreshNext(); };
    if($('btnListen')) $('btnListen').onclick=function(){ lessonTalk(); };
    if($('btnHear')) $('btnHear').onclick=function(){ speak(c().questions[step-4].title); };
    document.querySelectorAll('[data-ans]').forEach(function(btn){
      btn.addEventListener('click', function(){
        answers[step-4]=btn.getAttribute('data-ans'); persist(); render();
        if(step===6 && quizOk() && !gpsOk()) captureGps();
      });
    });
    if($('btnAccept')) $('btnAccept').onclick=function(){ accepted=!accepted; persist(); render(); };
    if($('btnGps')) $('btnGps').onclick=function(){ captureGps(); };
    if($('btnBack')) $('btnBack').onclick=function(){ if(step>0) step--; persist(); render(); };
    if($('btnNext')) $('btnNext').onclick=function(){
      if(step===0 && !profileOk()) return;
      if(step>=4 && step<=6 && !qCorrect(step-4)) return;
      step++;
      persist(); render();
      if(step>=1 && step<=3) setTimeout(lessonTalk, 250);
    };
    if($('btnSubmit')) $('btnSubmit').onclick=submitNow;
    if($('btnPrint')) $('btnPrint').onclick=function(){
      if(!rec) return;
      fetch('/api/training/fa-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'certificate',id:rec.id,branchId:rec.branchId,ymd:rec.ymd})})
        .then(function(r){ return r.json(); })
        .then(function(j){
          if(!j.html) return;
          var w=window.open('','_blank');
          if(w){ w.document.write(j.html); w.document.close(); }
        });
    };
    if($('btnNew')) $('btnNew').onclick=function(){
      localStorage.removeItem(KEY);
      step=-1; started=false; accepted=false; submitted=false; rec=null; answers={};
      locationTxt='Not captured'; form={name:'',employeeId:'',client:'HDFC Bank',branchId:'',branchName:'',hdfcSite:'',mobile:''};
      render();
    };
  }
  function submitNow(){
    if(!accepted || !quizOk()) return;
    if(!gpsOk()){ alert(c().locNeed); captureGps(); return; }
    var btn=$('btnSubmit'); if(btn){ btn.disabled=true; btn.textContent='Saving…'; }
    fetch('/api/training/fa-data',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        action:'submit', lang:lang, name:form.name, employeeId:form.employeeId,
        branchId:form.branchId, hdfcSite:form.hdfcSite||'HDFC Bank', mobile:form.mobile,
        answers:[answers[0],answers[1],answers[2]], gps:locationTxt, accepted:true,
        device:navigator.userAgent||''
      })
    }).then(function(r){ return r.json(); }).then(function(j){
      if(!j.ok || !j.record){ alert(j.error||'Could not save. Try again.'); render(); return; }
      rec=j.record; submitted=true; persist(); render();
    }).catch(function(){ alert('Could not save. Check the phone signal and try again.'); render(); });
  }
  function render(){
    var copy=c();
    var n=!started?1: submitted?8: step+2;
    if(n>8) n=8;
    var label=!started?copy.choose: submitted?copy.recorded: step===0?copy.details: step<=2?copy.learn: step===3?(copy.punishBanner||'Punishment'): step<6?copy.check:copy.acknowledgement;
    $('progLabel').textContent=label;
    $('progNum').textContent=n+'/8';
    $('progBar').style.width=Math.round((n/8)*100)+'%';
    $('view').innerHTML=viewHtml();
    $('nav').innerHTML=navHtml();
    bind();
  }
  render();
})();
</script>
</body></html>`
}
