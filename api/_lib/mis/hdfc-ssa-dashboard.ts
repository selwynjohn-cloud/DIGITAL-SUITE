/**
 * HDFC SSA — visual India dashboard (public view + shared CSS / JS).
 * Political map: India → state → district → city → branch. GPS pins from each HDFC unit.
 */
import { MIS_BRAND } from './brand.js'
import { hdfcSsaBoardMapJs } from './hdfc-ssa-board-map.js'

export function hdfcSsaBoardCss(): string {
  return `
.ssa-board{font-family:Inter,system-ui,Segoe UI,sans-serif;color:#e2e8f0}
.ssa-board-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:14px 0}
@media(max-width:820px){.ssa-board-kpis{grid-template-columns:1fr 1fr}}
.ssa-kpi{background:linear-gradient(180deg,#132044,#0b1220);border:1px solid #2a3b66;border-radius:14px;padding:14px 16px;min-height:86px}
.ssa-kpi b{display:block;font-size:26px;color:#fde68a;letter-spacing:.03em;line-height:1.1}
.ssa-kpi span{display:block;margin-top:6px;color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.ssa-india{background:#0b1220;border:1px solid #2a3b66;border-radius:16px;padding:16px;margin:12px 0 16px}
.ssa-india h3{margin:0 0 10px;color:#fde68a;font-size:16px}
.ssa-states{display:flex;flex-wrap:wrap;gap:8px}
.ssa-state{border:1px solid #334155;background:#111a30;color:#cbd5e1;border-radius:999px;padding:8px 14px;font-weight:800;font-size:13px;cursor:pointer;min-height:40px}
.ssa-state.on{background:linear-gradient(135deg,#1e3a8a,#c9a84c);color:#fff;border-color:#c9a84c}
.ssa-state small{display:block;font-weight:600;opacity:.85;font-size:11px}
.ssa-letter{white-space:pre-wrap;background:#0a1220;border:1px solid #334155;border-radius:12px;padding:12px 14px;color:#e2e8f0;font-size:14px;line-height:1.45;margin:10px 0 16px}
.ssa-branches{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px}
.ssa-bcard{background:#0e1730;border:1px solid #2a3b66;border-radius:14px;padding:14px;cursor:pointer}
.ssa-bcard.on{outline:2px solid #c9a84c}
.ssa-bcard h4{margin:0 0 6px;color:#fff;font-size:17px}
.ssa-bmeta{color:#94a3b8;font-size:12px;font-weight:700}
.ssa-sites{margin-top:12px}
.ssa-site{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;background:#0b1220;border:1px solid #22304f;border-radius:12px;padding:12px;margin-bottom:8px;cursor:pointer}
.ssa-site:hover,.ssa-site.on{border-color:#c9a84c}
.ssa-site b{color:#fff;display:block}
.ssa-site span{color:#94a3b8;font-size:12px}
.ssa-score{font-weight:800;color:#fde68a;white-space:nowrap;text-align:right}
.ssa-gate{max-width:440px;margin:48px auto;background:#0e1730;border:1px solid #c9a84c;border-radius:16px;padding:22px}
.ssa-gate input{width:100%;min-height:46px;border-radius:10px;border:1px solid #334155;background:#0a1220;color:#fff;padding:10px 12px;font-size:16px;letter-spacing:.12em;text-transform:uppercase}
.ssa-jump{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
.ssa-search{width:100%;min-height:44px;border-radius:10px;border:1px solid #334155;background:#0a1220;color:#fff;padding:10px 12px;font-size:16px;margin:8px 0 4px}
.ssa-crumb{color:#94a3b8;font-size:13px;font-weight:700;margin:8px 0}
.ssa-crumb button{background:none;border:0;color:#fde68a;font-weight:800;cursor:pointer;padding:0}
.ssa-bars{margin:10px 0}
.ssa-bar-row{margin:0 0 8px}
.ssa-bar-row label{display:flex;justify-content:space-between;font-size:12px;color:#cbd5e1;font-weight:700}
.ssa-bar{height:8px;background:#1e293b;border-radius:99px;overflow:hidden;margin-top:4px}
.ssa-bar i{display:block;height:100%;background:linear-gradient(90deg,#c9a84c,#f97316);border-radius:99px}
.ssa-deep{background:#0b1220;border:1px solid #c9a84c;border-radius:14px;padding:14px;margin:12px 0 16px}
.ssa-pill{display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:800;margin:0 6px 6px 0}
.ssa-hot{margin:4px 0;color:#fed7aa;font-size:13px}
.ssa-board-head{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px}
.ssa-board-head h3{margin:0;color:#7dd3fc}
.ssa-map-wrap{background:#0b1220;border:1px solid #2a3b66;border-radius:16px;padding:12px;margin:12px 0 16px}
#ssaIndiaMap{height:420px;width:100%;border-radius:12px;background:#07101f}
@media(max-width:820px){#ssaIndiaMap{height:300px}}
.ssa-map-legend{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px;color:#94a3b8;font-size:12px;font-weight:700}
.ssa-map-legend i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px;vertical-align:middle}
.ssa-map-wrap .leaflet-container{background:#07101f;font:inherit}
.ssa-map-wrap .leaflet-control-attribution{font-size:10px}
`
}

/** Shared board body — public page and HOD/Management portal. */
export function hdfcSsaBoardSharedJs(): string {
  return `
function ssaSafe(s){return String(s==null?'':s).replace(/'/g,'');}
function ssaBoardKpisHtml(k, days){
  k=k||{};
  days=days||21;
  return '<div class="ssa-board-kpis">'+
    '<div class="ssa-kpi"><b>'+h(k.avgRiskRate||0)+'%</b><span>Risk rate (4 bars)</span></div>'+
    '<div class="ssa-kpi"><b>'+h(k.lateStart2fa!=null?k.lateStart2fa:k.lateStart||0)+'</b><span>Late start (2FA Branch)</span></div>'+
    '<div class="ssa-kpi"><b>'+h(k.outOfPost||0)+'</b><span>Out of post · '+h(days)+' days</span></div>'+
    '<div class="ssa-kpi"><b>'+h(k.vacantPosts||0)+'</b><span>Vacant post</span></div>'+
    '<div class="ssa-kpi"><b>'+h(k.approved||0)+'</b><span>Approved sites</span></div>'+
    '<div class="ssa-kpi"><b>'+h(k.highRisk||0)+'</b><span>High / Critical SSA</span></div>'+
    '</div>';
}
function ssaAllCities(data){
  var out=[];
  (data.states||[]).forEach(function(st){
    (st.branches||[]).forEach(function(b){out.push({state:st.state,city:b});});
  });
  return out.sort(function(a,b){return String(a.city.branchName).localeCompare(String(b.city.branchName));});
}
function ssaAllSites(data){
  var out=[];
  (data.states||[]).forEach(function(st){
    (st.branches||[]).forEach(function(b){
      (b.sites||[]).forEach(function(s){out.push({state:st.state,city:b,site:s});});
    });
  });
  return out;
}
function ssaFindState(data, name){
  if(!name) return null;
  var list=data.states||[];
  for(var i=0;i<list.length;i++) if(list[i].state===name) return list[i];
  return null;
}
function ssaRiskBars(parts){
  if(!parts||!parts.length)return '';
  return '<div class="ssa-bars">'+(parts.map(function(p){
    return '<div class="ssa-bar-row"><label><span>'+h(p.title)+'</span><span>'+h(p.score)+'/'+h(p.max)+' · '+h(p.pct)+'%</span></label><div class="ssa-bar"><i style="width:'+Math.min(100,Number(p.pct)||0)+'%"></i></div></div>';
  }).join(''))+'</div>';
}
function ssaSiteDeepHtml(s, days){
  if(!s)return '';
  var hot=(s.hotItems||[]).map(function(x){return '<div class="ssa-hot">'+h(x.score)+'/5 · '+h(x.label)+'</div>';}).join('');
  var flags=(s.formFlags||[]).map(function(x){return '<span class="ssa-pill" style="background:#7c2d12;color:#fed7aa">'+h(x)+'</span>';}).join('');
  return '<div class="ssa-deep"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><b style="color:#fff;font-size:16px">'+h(s.location)+'</b><div class="ssa-bmeta">Bank code '+h(s.bankCode||'—')+' · '+h(s.branchName)+' · '+h(s.state)+(s.is2Fa?' · 2FA Branch':'')+'</div></div><div class="ssa-score">Risk rate '+h(s.riskRate||0)+'%<div style="font-size:12px;color:#94a3b8">Four bars · SSA '+h(s.score)+'/180</div></div></div>'+
    '<p class="hint" style="margin:10px 0">'+h(s.riskNote||'Risk rate is the average of Deployment, Late start (2FA Branch), Out of post, and Vacant post.')+'</p>'+
    ssaRiskBars(s.parts)+
    (hot?'<div style="margin-top:8px"><b style="color:#fde68a">Priority items from the assessment</b>'+hot+'</div>':'')+
    (flags?'<div style="margin-top:8px">'+flags+'</div>':'')+
    '<div class="ssa-bmeta" style="margin-top:10px">Late start '+h(s.lateStart||0)+' · Out of post '+h(s.outOfPost||0)+' · last '+h(days||21)+' days (location-wise)</div>'+
    '<div style="margin-top:12px"><button type="button" class="m-btn m-btn-gold btn" onclick="openBoardSite(\\''+ssaSafe(s.id)+'\\')">Open this HDFC location report</button></div></div>';
}
function ssaDistrictMatch(row, district){
  if(!district) return true;
  var want=String(district).toLowerCase();
  if(String(row.city.district||'').toLowerCase()===want) return true;
  return (row.city.sites||[]).some(function(s){return String(s.district||'').toLowerCase()===want;});
}
function ssaBoardShellHtml(data, ui, isPublic){
  data=data||{}; ui=ui||{};
  var days=data.dutyWindowDays||21;
  var k=data.kpis||{};
  var jump=ui.jump||'map';
  var q=String(ui.q||'').trim().toLowerCase();
  var st=ssaFindState(data, ui.state);
  var city=null;
  if(st){for(var i=0;i<(st.branches||[]).length;i++) if(st.branches[i].branchKey===ui.city) city=st.branches[i];}
  var site=null;
  if(city){for(var j=0;j<(city.sites||[]).length;j++) if(city.sites[j].id===ui.site) site=city.sites[j];}
  if(!site && ui.site){
    var hit=ssaAllSites(data).filter(function(x){return x.site.id===ui.site;})[0];
    if(hit){st=ssaFindState(data, hit.state);city=hit.city;site=hit.site;}
  }
  var crumbs='<div class="ssa-crumb"><button type="button" onclick="pickBoardState(\\'\\')">India</button>';
  if(st) crumbs+=' · <button type="button" onclick="pickBoardState(\\''+ssaSafe(st.state)+'\\')">'+h(st.state)+'</button>';
  if(ui.district) crumbs+=' · <button type="button" onclick="pickBoardDistrict(\\''+ssaSafe(st&&st.state||'')+'\\',\\''+ssaSafe(ui.district)+'\\')">'+h(ui.district)+'</button>';
  if(city) crumbs+=' · <button type="button" onclick="pickBoardCity(\\''+ssaSafe(st&&st.state||'')+'\\',\\''+ssaSafe(city.branchKey)+'\\')">'+h(city.branchName)+'</button>';
  if(site) crumbs+=' · Bank code '+h(site.bankCode||'—');
  crumbs+='</div>';
  var jumps='<div class="ssa-jump">'+
    '<button type="button" class="ssa-state'+(jump==='map'?' on':'')+'" onclick="setBoardJump(\\'map\\')">Pick from map</button>'+
    '<button type="button" class="ssa-state'+(jump==='state'?' on':'')+'" onclick="setBoardJump(\\'state\\')">Go by State</button>'+
    '<button type="button" class="ssa-state'+(jump==='city'?' on':'')+'" onclick="setBoardJump(\\'city\\')">Go by City</button>'+
    '<button type="button" class="ssa-state'+(jump==='code'?' on':'')+'" onclick="setBoardJump(\\'code\\')">Go by Bank code</button>'+
    '</div>';
  var search='<input class="ssa-search" id="ssaBoardQ" value="'+h(ui.q||'')+'" placeholder="Type city, bank code, or HDFC location" oninput="filterBoardQ(this.value)">';
  var stateChips='';
  (data.states||[]).forEach(function(s){
    stateChips+='<button type="button" class="ssa-state'+(st&&s.state===st.state?' on':'')+'" onclick="pickBoardState(\\''+ssaSafe(s.state)+'\\')">'+h(s.state)+
      '<small>Risk '+h(s.avgRiskRate||0)+'% · 2FA late '+h(s.lateStart2fa||0)+' · OOP '+h(s.outOfPost||0)+' · vacant '+h(s.vacantPosts||0)+'</small></button>';
  });
  var cityChips='';
  var citySrc=jump==='city'?ssaAllCities(data):(st? (st.branches||[]).map(function(b){return {state:st.state,city:b};}):[]);
  citySrc.forEach(function(row){
    var b=row.city;
    if(!ssaDistrictMatch(row, ui.district)) return;
    if(q && (String(b.branchName)+' '+String(row.state)+' '+String(b.district||'')).toLowerCase().indexOf(q)<0) return;
    cityChips+='<button type="button" class="ssa-state'+(city&&b.branchKey===city.branchKey?' on':'')+'" onclick="pickBoardCity(\\''+ssaSafe(row.state)+'\\',\\''+ssaSafe(b.branchKey)+'\\')">'+h(b.branchName)+
      '<small>'+h(row.state)+(b.district?' · '+h(b.district):'')+' · risk '+h(b.avgRiskRate||0)+'% · 2FA late '+h(b.lateStart2fa||0)+' · vacant '+h(b.vacantPosts||0)+'</small></button>';
  });
  var distChips='';
  if(st){
    var seenD={};
    (st.branches||[]).forEach(function(b){
      var names=[b.district].concat((b.sites||[]).map(function(s){return s.district;}));
      names.forEach(function(d){
        d=String(d||'').trim();
        if(!d||seenD[d]) return;
        seenD[d]=1;
        distChips+='<button type="button" class="ssa-state'+(ui.district===d?' on':'')+'" onclick="pickBoardDistrict(\\''+ssaSafe(st.state)+'\\',\\''+ssaSafe(d)+'\\')">'+h(d)+
          '<small>District · tap on the map or here</small></button>';
      });
    });
  }
  var codeChips='';
  if(jump==='code' || q){
    ssaAllSites(data).forEach(function(row){
      var s=row.site;
      var blob=(String(s.bankCode||'')+' '+String(s.location||'')+' '+String(s.branchName||'')+' '+String(row.state)).toLowerCase();
      if(q && blob.indexOf(q)<0) return;
      codeChips+='<button type="button" class="ssa-state'+(site&&s.id===site.id?' on':'')+'" onclick="pickBoardSite(\\''+ssaSafe(s.id)+'\\')">'+h(s.bankCode||'No code')+
        '<small>'+h(s.location)+' · '+h(s.branchName)+' · risk '+h(s.riskRate||0)+'%</small></button>';
    });
  }
  var cards='';
  (st&&st.branches||[]).forEach(function(b){
    if(!ssaDistrictMatch({city:b}, ui.district)) return;
    if(q && (String(b.branchName)+' '+String(st.state)+' '+String(b.district||'')).toLowerCase().indexOf(q)<0 && !((b.sites||[]).some(function(s){return (String(s.bankCode)+' '+s.location).toLowerCase().indexOf(q)>=0;}))) return;
    var open=city&&city.branchKey===b.branchKey;
    cards+='<div class="ssa-bcard'+(open?' on':'')+'" onclick="pickBoardCity(\\''+ssaSafe(st.state)+'\\',\\''+ssaSafe(b.branchKey)+'\\')"><h4>'+h(b.branchName)+'</h4>'+
      '<div class="ssa-bmeta">Risk rate '+h(b.avgRiskRate||0)+'% · 2FA late '+h(b.lateStart2fa||0)+' · OOP '+h(b.outOfPost||0)+' · vacant '+h(b.vacantPosts||0)+'</div>'+
      (b.parts&&b.parts.length?ssaRiskBars(b.parts):'')+
      (b.letter&&open?'<div class="ssa-letter" style="margin-top:10px">'+h(b.letter)+'</div>':'')+
      '</div>';
  });
  var sites='';
  if(city){
    sites='<h3 style="color:#fde68a;margin:18px 0 8px">'+h(city.branchName)+' — HDFC locations (bank code wise)</h3>';
    (city.sites||[]).forEach(function(s){
      if(q && (String(s.bankCode)+' '+s.location).toLowerCase().indexOf(q)<0 && String(city.branchName).toLowerCase().indexOf(q)<0) return;
      sites+='<div class="ssa-site'+(site&&site.id===s.id?' on':'')+'" onclick="pickBoardSite(\\''+ssaSafe(s.id)+'\\')">'+
        '<div><b>'+h(s.location)+'</b><span>Bank code '+h(s.bankCode||'—')+(s.is2Fa?' · 2FA':'')+' · late '+h(s.lateStart2fa||s.lateStart||0)+' · OOP '+h(s.outOfPost||0)+' · vacant '+h(s.vacantPosts||0)+'</span></div>'+
        '<div class="ssa-score">'+h(s.riskRate||0)+'%<div style="font-size:11px;color:#94a3b8">'+h(s.score)+'/180</div></div></div>';
    });
  }
  var pickBox='';
  if(jump==='map'){
    pickBox='<div class="ssa-india"><h3>Or tap a District / City here</h3><p class="hint" style="margin:0 0 8px">Same as the map. Independent cities stay separate — Nellore is not Tada; Chennai is not Puducherry; Vizag is not Kakinada.</p>'+
      (st?(distChips?'<div class="ssa-states" style="margin-bottom:10px">'+distChips+'</div>':'')+'<div class="ssa-states">'+cityChips+'</div>':'<div class="ssa-states">'+stateChips+'</div>')+'</div>';
  }
  else if(jump==='state') pickBox='<div class="ssa-india"><h3>Pick a State</h3><div class="ssa-states">'+stateChips+'</div></div>';
  else if(jump==='city') pickBox='<div class="ssa-india"><h3>Pick a City</h3><p class="hint" style="margin:0 0 8px">Independent cities stay separate — Nellore is not Tada; Chennai is not Puducherry; Vizag is not Kakinada.</p><div class="ssa-states">'+cityChips+'</div></div>';
  else pickBox='<div class="ssa-india"><h3>Pick a Bank code</h3><div class="ssa-states">'+(codeChips||'<p class="hint">Type a bank code or location above.</p>')+'</div></div>';
  if(q && jump!=='code') pickBox += (codeChips?'<div class="ssa-india"><h3>Matching locations</h3><div class="ssa-states">'+codeChips+'</div></div>':'');
  var showState=(st && (jump==='state'||jump==='map') && !city);
  var letter=st&&st.conclusion&&showState?'<div class="ssa-letter">'+h(st.conclusion)+'</div>':'';
  var hint=isPublic
    ? 'HDFC sees Director-approved sites only. Tap the political map: India → State → District → City → Branch. Risk rate is four bars: Deployment risk · Late start (2FA Branch) · Out of post · Vacant post.'
    : 'Tap the political map: State → District → City → Branch. Risk rate = four bars (Deployment · Late start 2FA · Out of post · Vacant). '+(typeof IS_STAFF!=='undefined'&&IS_STAFF?'Your city only.':'Management sees Draft / Submitted / Approved.');
  return '<p class="hint">'+hint+'</p>'+jumps+search+crumbs+ssaBoardKpisHtml(k,days)+pickBox+
    (showState?'<h3 style="color:#fff;margin:0 0 6px">'+h(st.state)+(ui.district?' · '+h(ui.district):'')+'</h3>'+(st.parts&&st.parts.length?ssaRiskBars(st.parts):'')+letter+'<div class="ssa-branches">'+cards+'</div>':'')+
    (city?sites:'')+
    (site?ssaSiteDeepHtml(site,days):'')+
    (!st&&!q&&jump!=='map'?'<p class="hint">No HDFC SSAs in this view yet.</p>':'');
}
${hdfcSsaBoardMapJs()}
`
}

export function hdfcSsaDashboardPageHtml(): string {
  const css = hdfcSsaBoardCss()
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>HDFC SSA — State Dashboard</title>
<link rel="icon" href="/favicon.ico">
<style>
*{box-sizing:border-box}
body{margin:0;background:#07101f;color:#e2e8f0;font-family:Inter,system-ui,Segoe UI,sans-serif}
.top{background:linear-gradient(135deg,#0b1a3a,#14224f 55%,#1e3a8a);border-bottom:3px solid #c9a84c;padding:16px 20px}
.top img{height:46px;width:auto;background:transparent;display:block}
.top h1{margin:10px 0 0;font-size:22px;color:#fff}
.top p{margin:4px 0 0;color:#fde68a;font-weight:700;font-size:13px}
.wrap{max-width:1200px;margin:0 auto;padding:16px 16px 40px}
.hint{color:#94a3b8;font-size:13px;line-height:1.45}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:8px 14px;border-radius:10px;border:0;font-weight:800;cursor:pointer;background:#c9a84c;color:#1a1200}
.btn.grey{background:#334155;color:#fff}
${css}
.foot{margin-top:28px;padding-top:14px;border-top:1px solid #22304f;color:#64748b;font-size:12px;text-align:center}
</style>
</head>
<body>
<div class="top">
  <img src="/agile-logo-clear.png" alt="Agile Security Force">
  <h1>HDFC Site Security Assessment</h1>
  <p>India political map — State, District, City, Branch</p>
</div>
<div class="wrap ssa-board" id="app"></div>
<script>
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
${hdfcSsaBoardSharedJs()}
(function(){
var API='/mis-hdfc-ssa-board';
var DATA=null, STATE='', DISTRICT='', BRANCH='', SITE='', JUMP='map', Q='', CODE='';
function qs(n){try{return new URLSearchParams(location.search).get(n)||'';}catch(e){return '';}}
function el(id){return document.getElementById(id);}
function codeFromUrl(){return String(qs('code')||'').replace(/[^A-Za-z0-9]/g,'').toUpperCase();}
function bootUrl(code){return API+'?boot=1&code='+encodeURIComponent(code);}
function ui(){return {state:STATE,district:DISTRICT,city:BRANCH,site:SITE,jump:JUMP,q:Q};}
function renderGate(err){
  el('app').innerHTML='<div class="ssa-gate"><h2 style="margin:0 0 8px;color:#fde68a">HDFC view</h2>'+
    '<p class="hint">Enter the view code shared by Agile Management. Random visitors cannot open this board.</p>'+
    (err?'<p style="color:#fca5a5;font-weight:700">'+h(err)+'</p>':'')+
    '<label class="hint">View code</label><input id="viewCode" maxlength="16" autocomplete="off">'+
    '<div style="margin-top:12px"><button class="btn" type="button" onclick="window.ssaBoardEnter()">Open dashboard</button></div></div>';
}
function renderBoard(){
  ssaPaintBoard(el('app'), DATA, ui(), true);
  if(!el('ssaBoardFoot') && el('app')){
    var f=document.createElement('div');
    f.id='ssaBoardFoot';
    f.className='foot';
    f.textContent='${MIS_BRAND.shortName} · ${MIS_BRAND.siteLabel} · For HDFC circulation with view code';
    el('app').appendChild(f);
  }
}
window.pickBoardState=function(name){STATE=name||'';DISTRICT='';BRANCH='';SITE='';JUMP=name?'map':'map';renderBoard();};
window.pickBoardDistrict=function(state,district){STATE=state||STATE;DISTRICT=district||'';BRANCH='';SITE='';JUMP='map';renderBoard();};
window.pickBoardCity=function(state,key){
  STATE=state||STATE;BRANCH=key||'';SITE='';JUMP='map';
  var hit=ssaAllCities(DATA).filter(function(x){return x.city.branchKey===key;})[0];
  if(hit && hit.city.district) DISTRICT=hit.city.district;
  renderBoard();
};
window.pickBoardSite=function(id){
  var hit=ssaAllSites(DATA).filter(function(x){return x.site.id===id;})[0];
  if(hit){STATE=hit.state;BRANCH=hit.city.branchKey;SITE=id;DISTRICT=hit.site.district||hit.city.district||DISTRICT;JUMP='map';}
  renderBoard();
};
window.setBoardJump=function(mode){JUMP=mode||'map';if(mode==='state'){BRANCH='';SITE='';DISTRICT='';}renderBoard();};
window.filterBoardQ=function(val){Q=val||'';renderBoard(); var box=el('ssaBoardQ'); if(box){box.focus(); var n=box.value.length; try{box.setSelectionRange(n,n);}catch(e){}}};
window.openBoardSite=function(id){
  var url=API+'?report=1&code='+encodeURIComponent(CODE)+'&surveyId='+encodeURIComponent(id);
  fetch(url).then(function(r){return r.json();}).then(function(j){
    if(!j||!j.html){alert((j&&j.error)||'Report is not available.');return;}
    var w=window.open('','_blank');
    if(!w){alert('Allow pop-ups to read the site report.');return;}
    w.document.write(j.html);
    w.document.close();
  }).catch(function(){alert('Could not open the site report.');});
};
function load(code){
  CODE=code;
  el('app').innerHTML='<p class="hint">Opening dashboard…</p>';
  fetch(bootUrl(code),{credentials:'omit'}).then(function(r){return r.json().then(function(j){return {s:r.status,j:j};});}).then(function(res){
    if(res.s!==200||!res.j||!res.j.ok){renderGate((res.j&&res.j.error)||'View code is not valid.');return;}
    DATA=res.j;
    STATE=qs('state')||'';
    DISTRICT=qs('district')||'';
    BRANCH=qs('city')||'';
    SITE='';
    JUMP=qs('jump')||'map';
    Q=qs('bank')||qs('q')||'';
    try{history.replaceState({},'',API+'?code='+encodeURIComponent(CODE));}catch(e){}
    renderBoard();
  }).catch(function(){renderGate('Could not open the dashboard. Try again.');});
}
window.ssaBoardEnter=function(){
  var v=String((el('viewCode')||{}).value||'').replace(/[^A-Za-z0-9]/g,'').toUpperCase();
  if(v.length<6){alert('Enter the full view code.');return;}
  load(v);
};
var start=codeFromUrl();
if(start) load(start);
else renderGate('');
})();
</script>
</body>
</html>`
}
