/**
 * Public phone page — HDFC FA compliance advisory + 3-quiz + undertaking.
 */

import { suiteAppOpenPageFooterHtml } from '../suite-app-footer.js'
import { SUITE_TAP_FEEDBACK_CSS, suiteTapFeedbackInitScript } from '../suite-tap-feedback.js'
import { TRAINING_LOGO_URL } from './training-brand.js'
import { ADV_COPIES, EN_ADV, FA_ADVISORY_INFOGRAPHIC_FILE, FA_ADVISORY_INFOGRAPHIC_PATH, FA_ADVISORY_INFOGRAPHIC_URL, FA_LANGS, advCopy, faAdvIssueStamp, type Lang } from './fa-advisory-i18n.js'

export type FaAdvBranchOpt = { id: string; name: string }

function copiesJson(): string {
  const pack: Record<string, ReturnType<typeof advCopy>> = {}
  for (const code of FA_LANGS) pack[code] = advCopy(code)
  return JSON.stringify(pack)
}

function langsJson(): string {
  return JSON.stringify(
    FA_LANGS.map((code) => ({
      code,
      name: ADV_COPIES[code as Lang].name,
      native: ADV_COPIES[code as Lang].native,
    })),
  )
}

function headerInnerHtml(copy: ReturnType<typeof advCopy>, issue: string): string {
  const e = (s: string) =>
    String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  return `<div class="adv-series"><div class="poster-hero"><div class="kicker-row"><p class="hdfc-kicker">${e(copy.seriesClient)}</p></div><div class="head"><img src="${TRAINING_LOGO_URL}" alt="Agile Security Force" width="88" height="64"><div><div class="co">${e(copy.company)}</div><div class="dept">${e(copy.department)}</div></div></div><div class="series-name">${e(copy.seriesName)}</div></div><div class="issue-bar"><span>${e(copy.issueDate)} <b>${e(issue)}</b></span><span>${e(copy.audience)}</span></div></div>`
}

export function faAdvisoryPageHtml(branches: FaAdvBranchOpt[]): string {
  const branchesJson = JSON.stringify(branches)
  const issue = faAdvIssueStamp()
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>HDFC Bank Compliance Advisory — Facility Attendants</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{
  font-family:'Segoe UI',system-ui,sans-serif;color:#14224f;min-height:100vh;
  background:linear-gradient(180deg,#eef2f8 0%,#f7f4ea 100%);
}
${SUITE_TAP_FEEDBACK_CSS}
.wrap{max-width:720px;margin:0 auto;padding:12px 12px 28px}
.kicker-row{width:100%;text-align:center;margin-bottom:10px}
.hdfc-kicker{
  display:block;width:100%;text-align:center;background:#c8102e;color:#fff;
  font-size:.78rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;
  padding:7px 10px;border-radius:4px;line-height:1.35;white-space:normal;
}
.page-head{margin-bottom:10px}
.control-mobile{
  display:block;text-align:center;margin:0 0 12px;padding:10px 12px;
  background:#14224f;color:#fde68a;border-radius:10px;font-weight:800;font-size:.95rem;
  text-decoration:none;
}
.langbar{
  background:#fff;border:1px solid #d7deea;
  border-radius:12px;padding:16px;margin-bottom:12px;
  box-shadow:0 8px 22px rgba(20,34,79,.08);
}
.langbar h2{font-size:1.08rem;margin-bottom:6px;color:#14224f}
.langbar .help{color:#475569;font-size:.9rem;margin-bottom:12px}
.langs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.langs button{
  min-height:54px;border:1.5px solid #c5d0e6;border-radius:10px;background:#fff;
  color:#14224f;cursor:pointer;font-weight:700;
}
.langs button.on{background:#14224f;color:#fff;border-color:#c9a84c;box-shadow:0 0 0 2px #c9a84c}
.langs button.on small{color:#fde68a}
.langs b{display:block;font-size:.92rem}
.langs small{display:block;font-size:.66rem;color:#64748b}
.poster{
  background:#fff;border:1px solid #d7deea;border-radius:12px;padding:0 0 16px;
  box-shadow:0 10px 26px rgba(20,34,79,.1);overflow:hidden;
}
.poster-hero{display:flex;flex-direction:column;align-items:stretch;background:linear-gradient(135deg,#14224f 0%,#1e3a6e 70%,#0f2942 100%);padding:16px 14px 14px;color:#fff}
.head{display:flex;align-items:center;gap:12px}
.head img{height:58px;width:auto;background:transparent!important}
.co{font-weight:800;font-size:.98rem;line-height:1.25;color:#fff}
.dept{font-size:.74rem;color:#fde68a;margin-top:3px;font-weight:700;letter-spacing:.03em}
.series-name{margin-top:12px;font-size:1.05rem;font-weight:800;color:#fff;letter-spacing:.02em}
.issue-bar{
  display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;
  margin:0;padding:10px 14px;background:#f4efe0;border-bottom:1px solid #e4d7a8;
  color:#14224f;font-size:.82rem;font-weight:700;
}
.issue-bar b{color:#c8102e}
.poster-body{padding:14px 14px 0}
h1{font-size:1.28rem;line-height:1.3;margin:0 0 4px;color:#14224f}
.subhead{font-size:1.02rem;font-weight:800;color:#1e3a6e;margin:0 0 10px;line-height:1.35}
.intro{font-size:.96rem;line-height:1.5;color:#1e293b;margin-bottom:14px;background:#f8fafc;border-left:4px solid #c9a84c;padding:12px}
.info-btn{display:block;width:100%;text-align:center;margin:12px 0 4px;padding:12px 14px;background:#c9a84c;color:#14224f;border:0;border-radius:8px;font-weight:800;text-decoration:none;cursor:pointer;font-size:1rem}
.listen{display:block;width:100%;margin:8px 0 12px;padding:11px 12px;border:0;border-radius:8px;background:#14224f;color:#fde68a;font-weight:800;cursor:pointer;font-size:.95rem}
.info-view{display:none;position:fixed;inset:0;z-index:80;background:rgba(15,23,42,.82);padding:16px;overflow:auto}
.info-view.on{display:block}
.info-view-card{max-width:920px;margin:8px auto 24px;background:#fff;border-radius:12px;padding:12px}
.info-view-card img{display:block;width:100%;height:auto;border-radius:8px;background:#f8fafc}
.info-view-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.info-view-actions .btn,.info-view-actions a.btn{flex:1;min-width:110px;min-height:48px;display:grid;place-items:center;text-decoration:none}
.sec{color:#fff;font-weight:800;letter-spacing:.05em;padding:9px 12px;border-radius:6px;margin:14px 0 10px;font-size:.82rem}
.sec.blue{background:#14224f}
.sec.red{background:#c8102e}
.item{display:grid;grid-template-columns:56px 1fr;gap:10px;align-items:start;border-radius:10px;padding:12px;margin-bottom:8px;border:1px solid #e2e8f0;background:#fff}
.item.p0{border-left:4px solid #c8102e}
.item.p1{border-left:4px solid #14224f}
.item.p2{border-left:4px solid #0f766e}
.item.c0,.item.c1,.item.c2{border-left:4px solid #c9a84c;background:#fffdf6}
.ico{width:56px;height:56px;border-radius:8px;display:grid;place-items:center;font-size:.78rem;font-weight:900;letter-spacing:.04em;background:#14224f;color:#fde68a}
.item.p0 .ico{background:#c8102e;color:#fff}
.item.p1 .ico{background:#14224f;color:#fff}
.item.p2 .ico{background:#0f766e;color:#fff}
.item.c0 .ico,.item.c1 .ico,.item.c2 .ico{background:#c9a84c;color:#14224f}
h3{font-size:.98rem;margin-bottom:4px;color:#0f172a}
.item p{font-size:.9rem;line-height:1.45;color:#334155}
.item .ex{margin-top:8px;padding:8px 10px;background:#f8fafc;border-left:3px solid #c9a84c;font-size:.88rem;color:#1e293b;border-radius:0 6px 6px 0}
.item .ex b{color:#14224f}
.card{background:#fff;border:1px solid #d7deea;border-radius:12px;padding:16px;margin-top:12px}
#quizCard{border-top:4px solid #14224f}
#quizCard h2{color:#14224f}
.qbox{margin:10px 0;padding:12px;border-radius:10px;border:1px solid #e2e8f0;background:#f8fafc}
.qbox.q0,.qbox.q1,.qbox.q2,.qbox.q3,.qbox.q4{border-left:4px solid #c9a84c}
.qbox b{color:#14224f}
.yn{display:flex;gap:10px;margin-top:10px}
.yn button{flex:1;min-height:48px;border:1.5px solid #94a3b8;border-radius:8px;background:#fff;font-weight:800;cursor:pointer}
.yn button[data-ans="yes"]{border-color:#16a34a;color:#14532d}
.yn button[data-ans="no"]{border-color:#c8102e;color:#9f1239}
.yn button.onok{border-color:#14532d;background:#16a34a;color:#fff}
.yn button.onbad{border-color:#991b1b;background:#c8102e;color:#fff}
.fb{margin-top:8px;font-weight:800}
.fb.good{color:#14532d}
.fb.bad{color:#9f1239}
label{display:block;font-size:.88rem;font-weight:800;color:#14224f;margin:12px 0 6px}
input,select{width:100%;min-height:48px;padding:11px 12px;border:1.5px solid #c5d0e6;border-radius:8px;font-size:16px;background:#fff}
.accept{width:100%;display:flex;gap:10px;align-items:flex-start;text-align:left;padding:14px;border:2px solid #c9a84c;border-radius:10px;background:#fffdf6;cursor:pointer;margin-top:14px}
.accept.on{border-color:#14224f;background:#eef2ff}
.actions{display:flex;gap:10px;margin:14px 0 8px}
.btn{flex:1;min-height:50px;border:0;border-radius:8px;font-weight:800;font-size:1rem;cursor:pointer}
.btn.gold{background:#c9a84c;color:#14224f}
.btn.ghost{background:#14224f;color:#fff}
.ok{text-align:center;padding:18px 8px}
.ok .tick{width:64px;height:64px;margin:0 auto 10px;border-radius:50%;background:#14224f;color:#fde68a;display:grid;place-items:center;font-size:1.8rem;font-weight:900}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;text-align:left;margin-top:14px}
.meta span{padding:10px;background:#f1f5f9;border-radius:8px;font-size:.7rem;color:#475569;text-transform:uppercase;font-weight:800}
.meta b{display:block;margin-top:4px;color:#0f172a;font-size:.92rem;text-transform:none}
.note{margin-top:10px;color:#475569;font-size:.86rem}
.scoreok{margin-top:12px;padding:10px;border-radius:8px;background:#ecfdf5;color:#14532d;font-weight:800;text-align:center}
@media(max-width:420px){.item{grid-template-columns:1fr}.ico{width:48px;height:40px}.meta{grid-template-columns:1fr}}
</style>
</head>
<body>
<main class="wrap">
  <header class="poster page-head" id="pageHead">${headerInnerHtml(EN_ADV, issue)}</header>
  <a class="control-mobile" id="controlMobile" href="tel:+919248707070">Control Mobile - +91 9248707070</a>
  <section class="langbar">
    <h2 id="chooseTitle">Choose your language</h2>
    <p class="help" id="chooseHelp">The advisory and your acknowledgement will appear in this language.</p>
    <div class="langs" id="langs"></div>
  </section>
  <article class="poster" id="poster"></article>
  <section class="card" id="quizCard"></section>
  <section class="card" id="formCard"></section>
  ${suiteAppOpenPageFooterHtml()}
</main>
<div class="info-view" id="infoView">
  <div class="info-view-card">
    <img src="${FA_ADVISORY_INFOGRAPHIC_PATH}?v=logo" alt="Integrity at Work — HDFC Bank Compliance Advisory">
    <div class="info-view-actions">
      <button type="button" class="btn gold app-tap-btn" id="infoShare">Share</button>
      <a class="btn gold app-tap-btn" id="infoDl" href="${FA_ADVISORY_INFOGRAPHIC_PATH}?v=logo" download="${FA_ADVISORY_INFOGRAPHIC_FILE}">Download</a>
      <button type="button" class="btn ghost app-tap-btn" id="infoClose">Close</button>
    </div>
  </div>
</div>
<script>
${suiteTapFeedbackInitScript()}
(function(){
  var COPIES=${copiesJson()};
  var LANGS=${langsJson()};
  var BRANCHES=${branchesJson};
  var INFO_URL=${JSON.stringify(FA_ADVISORY_INFOGRAPHIC_URL)};
  var INFO_FILE=${JSON.stringify(FA_ADVISORY_INFOGRAPHIC_FILE)};
  var KEY='agile-fa-advisory-v3';
  var ISSUE=${JSON.stringify(issue)};
  var lang='en', accepted=false, submitted=false, locBusy=false, rec=null, locationTxt='Not captured';
  var form={name:'',employeeId:'',branchId:'',branchName:'',hdfcSite:'HDFC Bank',mobile:''};
  var answers=['','',''];
  var bootLookup=false;
  function c(){ return COPIES[lang]||COPIES.en; }
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function digits(v){
    var mob=String(v||'').replace(/\\D/g,'');
    if(mob.length===12 && mob.indexOf('91')===0) mob=mob.slice(2);
    if(mob.length===11 && mob.indexOf('0')===0) mob=mob.slice(1);
    return mob.slice(0,10);
  }
  function branchName(id){
    for(var i=0;i<BRANCHES.length;i++){ if(BRANCHES[i].id===id) return BRANCHES[i].name; }
    return form.branchName||'';
  }
  var ladyVoice=null, talkTimer=null;
  function speechLang(){ return (lang||'en')+'-IN'; }
  function pickLadyVoice(){
    if(!window.speechSynthesis) return null;
    var want=speechLang().toLowerCase();
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
  if(window.speechSynthesis) window.speechSynthesis.onvoiceschanged=function(){ ladyVoice=pickLadyVoice(); };
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
    var want=speechLang().toLowerCase();
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
      u.lang=(v&&v.lang)||speechLang();
      u.rate=shape.rate;
      u.pitch=shape.pitch;
      if(v) u.voice=v;
      u.onend=function(){ talkTimer=setTimeout(next, talkGap(item.kind, item.text)); };
      window.speechSynthesis.speak(u);
    }
    next();
  }
  function listenPoints(){
    var items=c().itemsP||[];
    var parts=[];
    items.forEach(function(it,i){
      if(i) parts.push({kind:'break'});
      parts.push({text:(c().pointWord||'Point')+' '+(i+1)+'. '+it.title, kind:'title'});
      parts.push({kind:'break'});
      parts.push({text:it.body, kind:'body'});
      if(it.example){
        parts.push({kind:'break'});
        parts.push({text:(c().exampleWord||'Example.')+' '+it.example, kind:'example'});
      }
    });
    speakChunks(parts);
  }
  try{
    var q=new URLSearchParams(location.search);
    if(q.get('lang')&&COPIES[q.get('lang')]) lang=q.get('lang');
    var saved=JSON.parse(localStorage.getItem(KEY)||'null');
    if(saved){
      if(saved.lang&&COPIES[saved.lang]&&!q.get('lang')) lang=saved.lang;
      if(saved.form) form=Object.assign(form,saved.form);
      if(saved.answers&&saved.answers.length) answers=saved.answers.concat(['','','']).slice(0,3);
      if(typeof saved.accepted==='boolean') accepted=saved.accepted;
      if(saved.rec){ rec=saved.rec; submitted=true; }
      if(typeof saved.locationTxt==='string') locationTxt=saved.locationTxt;
    }
    if(q.get('m')) form.mobile=digits(q.get('m'));
  }catch(e){}
  function persist(){
    try{ localStorage.setItem(KEY, JSON.stringify({lang:lang,form:form,answers:answers,accepted:accepted,rec:rec,locationTxt:locationTxt})); }catch(e){}
  }
  function profileOk(){
    return form.name.trim() && form.branchId && digits(form.mobile).length===10;
  }
  function qCorrect(i){ return answers[i]===((c().questions[i]&&c().questions[i].correct)||''); }
  function quizOk(){ return qCorrect(0)&&qCorrect(1)&&qCorrect(2); }
  function gpsOk(){ return /^-?\\d+\\.\\d+,\\s*-?\\d+\\.\\d+$/.test(locationTxt); }
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
  function setLang(code){
    lang=code;
    ladyVoice=pickLadyVoice();
    try{ history.replaceState({},'',location.pathname+'?lang='+encodeURIComponent(code)+(digits(form.mobile).length===10?'&m='+encodeURIComponent(digits(form.mobile)):'')); }catch(e){}
    persist(); render();
  }
  function headerHtml(){
    var copy=c();
    return '<div class="adv-series"><div class="poster-hero"><div class="kicker-row"><p class="hdfc-kicker">'+esc(copy.seriesClient)+'</p></div><div class="head"><img src="${TRAINING_LOGO_URL}" alt="Agile Security Force" width="88" height="64"><div><div class="co">'+esc(copy.company)+'</div><div class="dept">'+esc(copy.department)+'</div></div></div><div class="series-name">'+esc(copy.seriesName)+'</div></div>'+
      '<div class="issue-bar"><span>'+esc(copy.issueDate)+' <b>'+esc(ISSUE)+'</b></span><span>'+esc(copy.audience)+'</span></div></div>';
  }
  function openInfoView(){
    var box=$('infoView');
    if(!box) return;
    box.classList.add('on');
    document.body.style.overflow='hidden';
  }
  function closeInfoView(){
    var box=$('infoView');
    if(!box) return;
    box.classList.remove('on');
    document.body.style.overflow='';
  }
  function shareInfoView(){
    fetch(INFO_URL+'?v=logo').then(function(r){ return r.blob(); }).then(function(blob){
      var file=new File([blob], INFO_FILE, {type:'image/jpeg'});
      var payload={title:'Integrity at Work', text:'HDFC Bank Compliance Advisory for Facility Attendants', files:[file]};
      if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})) return navigator.share(payload);
      if(navigator.share) return navigator.share({title:'Integrity at Work', text:'HDFC Bank Compliance Advisory for Facility Attendants', url:INFO_URL});
      var go=$('infoDl'); if(go) go.click();
    }).catch(function(){
      var go=$('infoDl'); if(go) go.click();
    });
  }
  function bindInfoView(){
    var open=$('infoOpen');
    if(open && !open.getAttribute('data-bound')){
      open.setAttribute('data-bound','1');
      open.addEventListener('click', openInfoView);
    }
    var share=$('infoShare');
    if(share && !share.getAttribute('data-bound')){
      share.setAttribute('data-bound','1');
      share.addEventListener('click', shareInfoView);
    }
    var close=$('infoClose');
    if(close && !close.getAttribute('data-bound')){
      close.setAttribute('data-bound','1');
      close.addEventListener('click', closeInfoView);
    }
    var box=$('infoView');
    if(box && !box.getAttribute('data-bound')){
      box.setAttribute('data-bound','1');
      box.addEventListener('click', function(ev){ if(ev.target===box) closeInfoView(); });
    }
  }
  function posterHtml(){
    var copy=c();
    var p=copy.itemsP.map(function(it,i){
      return '<div class="item p'+i+'"><div class="ico">0'+(i+1)+'</div><div><h3>'+esc(it.title)+'</h3><p>'+esc(it.body)+'</p>'+(it.example?'<p class="ex"><b>'+esc(copy.exampleWord||'Example.')+'</b> '+esc(it.example)+'</p>':'')+'</div></div>';
    }).join('');
    var cons=copy.itemsC.map(function(it,i){
      return '<div class="item c'+i+'"><div class="ico">0'+(i+1)+'</div><div><h3>'+esc(it.title)+'</h3><p>'+esc(it.body)+'</p></div></div>';
    }).join('');
    return '<div class="poster-body"><h1>'+esc(copy.title)+'</h1>'+(copy.subtitle?'<p class="subhead">'+esc(copy.subtitle)+'</p>':'')+
      '<p class="intro">'+esc(copy.intro)+'</p>'+
      '<div class="sec blue">'+esc(copy.prohibited)+'</div>'+p+
      '<button type="button" class="listen app-tap-btn" id="btnListenPts">🔊 '+esc(copy.listenPts||'Listen to the 3 points')+'</button>'+
      '<div class="sec red">'+esc(copy.consequences)+'</div>'+cons+
      '<button type="button" class="info-btn app-tap-btn" id="infoOpen">'+esc(copy.infographic||'Open Infographic')+'</button></div>';
  }
  function quizHtml(){
    var copy=c();
    if(submitted && rec) return '';
    var qs=copy.questions||[];
    var html='<h2>'+esc(copy.quiz)+'</h2><p class="note">'+esc(copy.quizHelp)+'</p>';
    for(var i=0;i<qs.length;i++){
      var q=qs[i], a=answers[i];
      var fb='';
      if(a){
        var good=a===q.correct;
        fb='<div class="fb '+(good?'good':'bad')+'">'+(good?esc(copy.correct):esc(copy.retry))+'</div>';
      }
      html+='<div class="qbox q'+i+'"><b>Q'+(i+1)+'.</b> '+esc(q.title)+
        '<div class="yn">'+
        '<button type="button" class="app-tap-btn'+(a==='yes'?(a===q.correct?' onok':' onbad'):'')+'" data-qi="'+i+'" data-ans="yes">'+esc(copy.yes)+'</button>'+
        '<button type="button" class="app-tap-btn'+(a==='no'?(a===q.correct?' onok':' onbad'):'')+'" data-qi="'+i+'" data-ans="no">'+esc(copy.no)+'</button>'+
        '</div>'+fb+'</div>';
    }
    if(quizOk()) html+='<p class="scoreok"><b>3/3</b> — '+esc(copy.correct)+'</p>';
    return html;
  }
  function formHtml(){
    var copy=c();
    if(submitted && rec){
      return '<div class="ok"><div class="tick">✓</div><p>'+esc(copy.recorded)+'</p><h1>'+esc(copy.thanks)+', '+esc(rec.name)+'.</h1>'+
        '<div class="meta"><span>'+esc(copy.ackNo)+'<b>'+esc(rec.code)+'</b></span><span>'+esc(copy.employeeId)+'<b>'+esc(rec.employeeId)+'</b></span>'+
        '<span>'+esc(copy.date)+'<b>'+esc(rec.submittedAt)+'</b></span><span>'+esc(copy.agileBranch)+'<b>'+esc(rec.branchName)+'</b></span>'+
        '<span>Score<b>'+esc(rec.score||'3/3')+'</b></span><span>'+esc(copy.mobile)+'<b>'+esc(rec.mobile)+'</b></span></div>'+
        '<p class="note">Your acknowledgement is on the branch list for HDFC Admin / RSO.</p></div>';
    }
    if(!quizOk()){
      return '<p class="note">'+esc(copy.quizHelp)+'</p>';
    }
    var opts='<option value="">Select Agile Branch Name</option>'+BRANCHES.map(function(b){
      return '<option value="'+esc(b.id)+'"'+(form.branchId===b.id?' selected':'')+'>'+esc(b.name)+'</option>';
    }).join('');
    return '<h2>'+esc(copy.details)+'</h2><p class="note">'+esc(copy.detailsHelp)+'</p>'+
      '<label>'+esc(copy.agileBranch)+'</label><select id="fBranch">'+opts+'</select>'+
      '<label>'+esc(copy.fullName)+'</label><input id="fName" value="'+esc(form.name)+'" autocomplete="name">'+
      '<label>'+esc(copy.employeeId)+' <small>(optional)</small></label><input id="fId" value="'+esc(form.employeeId)+'">'+
      '<label>'+esc(copy.hdfcSite)+'</label><input id="fSite" value="'+esc(form.hdfcSite||'HDFC Bank')+'" placeholder="HDFC Bank">'+
      '<label>'+esc(copy.mobile)+'</label><input id="fMobile" inputmode="tel" value="'+esc(form.mobile)+'" placeholder="10-digit mobile">'+
      '<button type="button" class="accept'+(accepted?' on':'')+'" id="btnAccept"><span style="font-size:1.3rem">'+(accepted?'☑':'☐')+'</span><span><b>'+esc(copy.accept)+'</b><br>'+esc(copy.pledge)+'</span></button>'+
      '<p class="note">GPS: '+(locBusy?'Capturing…':esc(locationTxt))+'</p>'+
      '<div class="actions"><button type="button" class="btn gold" id="btnSubmit">'+esc(copy.submit)+'</button></div>';
  }
  function render(){
    var copy=c();
    if($('pageHead')) $('pageHead').innerHTML=headerHtml();
    $('chooseTitle').textContent=copy.choose;
    $('chooseHelp').textContent=copy.chooseHelp;
    $('langs').innerHTML=LANGS.map(function(L){
      return '<button type="button" class="app-tap-btn'+(lang===L.code?' on':'')+'" data-lang="'+L.code+'"><b>'+esc(L.native)+'</b><small>'+esc(L.name)+'</small></button>';
    }).join('');
    $('poster').innerHTML=posterHtml();
    if($('infoShare')) $('infoShare').textContent=copy.infographicShare||'Share';
    if($('infoDl')) $('infoDl').textContent=copy.infographicDownload||'Download';
    if($('infoClose')) $('infoClose').textContent=copy.infographicClose||'Close';
    bindInfoView();
    if($('btnListenPts')) $('btnListenPts').onclick=function(){ listenPoints(); };
    $('quizCard').innerHTML=quizHtml();
    $('quizCard').style.display=(submitted&&rec)?'none':'block';
    $('formCard').innerHTML=formHtml();
    document.querySelectorAll('[data-lang]').forEach(function(btn){
      btn.addEventListener('click', function(){ setLang(btn.getAttribute('data-lang')); });
    });
    document.querySelectorAll('[data-ans]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var i=Number(btn.getAttribute('data-qi'));
        answers[i]=btn.getAttribute('data-ans');
        persist(); render();
      });
    });
    if($('fName')) $('fName').oninput=function(){ form.name=this.value; persist(); };
    if($('fId')) $('fId').oninput=function(){ form.employeeId=this.value; persist(); };
    if($('fSite')) $('fSite').oninput=function(){ form.hdfcSite=this.value; persist(); };
    if($('fMobile')){
      $('fMobile').oninput=function(){ form.mobile=this.value; persist(); };
      $('fMobile').onblur=function(){ lookupMobile(false); };
    }
    if($('fBranch')) $('fBranch').onchange=function(){ form.branchId=this.value; form.branchName=branchName(this.value); persist(); };
    if($('btnAccept')) $('btnAccept').onclick=function(){ accepted=!accepted; persist(); render(); if(accepted && !gpsOk()) captureGps(); };
    if($('btnSubmit')) $('btnSubmit').onclick=submitNow;
  }
  function lookupMobile(force){
    var mob=digits(form.mobile);
    if(mob.length!==10 || submitted) return;
    fetch('/api/training/fa-advisory-data',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'lookup', mobile:mob})
    }).then(function(r){ return r.json(); }).then(function(j){
      if(!j || !j.ok) return;
      if(j.record){ rec=j.record; submitted=true; persist(); render(); return; }
      if(j.found){
        if(force || !form.name) form.name=j.name||form.name;
        if(force || !form.employeeId) form.employeeId=j.employeeId||form.employeeId;
        if(force || !form.branchId){ form.branchId=j.branchId||form.branchId; form.branchName=j.branchName||branchName(form.branchId); }
        if(force || !form.hdfcSite || form.hdfcSite==='HDFC Bank') form.hdfcSite=j.hdfcSite||form.hdfcSite||'HDFC Bank';
        persist();
      }
    }).catch(function(){});
  }
  function submitNow(){
    if(!quizOk()){ alert(c().quizHelp); return; }
    if(!profileOk()){ alert(c().detailsHelp); return; }
    if(!accepted){ alert(c().accept); return; }
    if(!gpsOk()){ alert(c().locNeed); captureGps(); return; }
    var btn=$('btnSubmit'); if(btn){ btn.disabled=true; btn.textContent='Saving…'; }
    fetch('/api/training/fa-advisory-data',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        action:'submit', lang:lang, name:form.name, employeeId:form.employeeId,
        branchId:form.branchId, hdfcSite:form.hdfcSite||'HDFC Bank', mobile:form.mobile,
        answers:answers, gps:locationTxt, accepted:true, device:navigator.userAgent||''
      })
    }).then(function(r){ return r.json(); }).then(function(j){
      if(!j.ok || !j.record){ alert(j.error||'Could not save.'); if(btn){ btn.disabled=false; btn.textContent=c().submit; } return; }
      rec=j.record; submitted=true; persist(); render();
    }).catch(function(){ alert('Could not save.'); if(btn){ btn.disabled=false; btn.textContent=c().submit; } });
  }
  render();
  if(!bootLookup){ bootLookup=true; lookupMobile(true); }
})();
</script>
</body></html>`
}
