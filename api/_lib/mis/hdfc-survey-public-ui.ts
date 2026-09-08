/**
 * Public no-login HDFC Site Security Assessment (SSA) — WhatsApp link form.
 * Branch → HDFC unit → 15 headings → Submit to HOD (Completed).
 */

import { suiteAppOpenPageFooterInlineHtml } from '../suite-app-footer.js'
import { SUITE_DATE_INPUT_CSS, suiteDateInputInitScript } from '../suite-date-input.js'
import { hdfcSurveyClientScript } from './periodical-survey-hdfc-ui.js'
import { ssaWhatWhereIntroHtml } from './ssa-brand.js'

export function hdfcPublicSurveyPageHtml(): string {
  const footer = suiteAppOpenPageFooterInlineHtml()
  const hdfcJs = hdfcSurveyClientScript()
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>HDFC Site Security Assessment (SSA) Format — Agile Security Force Private Limited</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:linear-gradient(160deg,#0b1220,#14224f 55%,#1e3a6e);color:#e2e8f0;min-height:100vh;min-height:100dvh;padding:14px 14px calc(28px + env(safe-area-inset-bottom,0px));-webkit-text-size-adjust:100%}
.wrap{max-width:820px;margin:0 auto}
@media(min-width:900px){
  .wrap{max-width:1100px}
  .m-inp,select.m-inp{min-height:52px}
  .fgrid{grid-template-columns:repeat(2,minmax(220px,1fr))!important}
}
.hdr{text-align:center;margin-bottom:16px}
.hdr img{height:56px;background:transparent}
.hdr .co{color:#fde68a;font-size:15px;font-weight:800;margin-top:10px;letter-spacing:.02em;line-height:1.35}
.hdr h1{color:#fff;font-size:20px;margin-top:8px;font-weight:800;line-height:1.35}
.hdr p{color:#94a3b8;font-size:14px;margin-top:6px;line-height:1.5}
.instruct{background:#0b1a33;border:1px solid #38bdf8;border-radius:12px;padding:12px 14px;margin:0 0 14px;color:#e2e8f0;font-size:14px;line-height:1.55}
.instruct b{color:#7dd3fc}
.hdfc-guide{background:#0b1a33;border:1px solid #fbbf24;border-radius:12px;padding:12px 14px;margin:10px 0 14px;color:#e2e8f0;font-size:14px;line-height:1.55}
.hdfc-guide b{color:#fde68a}
.hdfc-guide summary{cursor:pointer;font-weight:800;color:#fde68a}
.m-card{background:linear-gradient(180deg,#111a30,#0e1730);border:1px solid #475569;border-radius:14px;padding:16px;margin-bottom:12px;box-shadow:0 10px 28px rgba(0,0,0,.3)}
.m-lbl{display:block;font-size:13px;color:#94a3b8;margin:0 0 4px;font-weight:700}
.m-inp,select.m-inp,textarea.m-inp{width:100%;padding:12px;border:1px solid #475569;border-radius:9px;background:#0b1220;color:#fff;font-size:16px;min-height:48px;position:relative;z-index:6}
select.m-inp{-webkit-appearance:menulist;appearance:menulist;color-scheme:dark}
select.m-inp option{background:#fff;color:#111}
input[type="date"]{color-scheme:dark;min-height:48px}
input[type="date"]::-webkit-calendar-picker-indicator{opacity:1;filter:invert(1);width:22px;height:22px;cursor:pointer}
.fa-valid-row .m-inp{min-width:168px}
${SUITE_DATE_INPUT_CSS}
textarea.m-inp{min-height:88px;resize:vertical}
.hint{font-size:13px;color:#94a3b8;line-height:1.5;margin-top:4px}
.m-btn{display:inline-flex;align-items:center;justify-content:center;padding:14px 16px;border:none;border-radius:10px;font-weight:800;font-size:15px;cursor:pointer;color:#14224f;min-height:48px;-webkit-tap-highlight-color:transparent}
.m-btn-block{width:100%;display:flex}
.m-btn-green{background:linear-gradient(135deg,#15803d,#4ade80)}
.m-btn-gold{background:linear-gradient(135deg,#b45309,#f59e0b)}
.m-btn-navy{background:linear-gradient(135deg,#1e3a8a,#38bdf8);color:#fff}
.m-btn-grey{background:#334155;color:#e2e8f0}
.m-savebar{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;padding:12px 0 calc(12px + env(safe-area-inset-bottom,0px));position:sticky;bottom:0;background:linear-gradient(180deg,transparent,#0b1220 28%);z-index:5}
.m-savebar .m-btn{flex:1 1 140px}
.survey-tabs{display:flex;flex-wrap:nowrap;gap:8px;margin:10px 0;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:6px;scrollbar-width:thin}
.survey-tab{flex:0 0 auto;padding:10px 12px;border-radius:8px;background:#1e293b;border:1px solid #334155;font-size:13px;font-weight:700;color:#cbd5e1;cursor:pointer;min-height:44px;white-space:nowrap}
.survey-tab.on{background:#1e3a8a;border-color:#38bdf8;color:#fff}
.score-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.score-btn{min-width:44px;min-height:44px;padding:10px;border-radius:8px;border:1px solid #475569;background:#0b1220;color:#e2e8f0;font-weight:700;cursor:pointer;font-size:15px}
.score-btn.on{background:#c9a84c;color:#14224f;border-color:#fde68a}
.hdfc-slot{border:1px solid #22304f;border-radius:10px;padding:12px;margin-bottom:10px;background:#0b1220}
.hdfc-slot img{width:100%;max-height:220px;object-fit:cover;border-radius:8px;margin-top:8px;display:block}
.risk-pill{display:inline-block;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:800}
.msg{padding:10px;border-radius:8px;font-size:14px;margin-top:10px;display:none;background:#3a0a0a;color:#f87171}
.okbox{display:none;text-align:center;padding:20px 12px}
.okbox .thanks{font-size:24px;font-weight:800;color:#fff;margin:8px 0}
#svCamModal{position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:120;display:flex;align-items:center;justify-content:center;padding:16px;padding-bottom:calc(16px + env(safe-area-inset-bottom,0px))}
#svCamModal.hidden{display:none!important}
#svCamBox{background:#0f172a;border:1px solid #475569;border-radius:14px;padding:14px;width:min(420px,100%)}
#svCamVideo{width:100%;max-height:320px;background:#000;border-radius:10px}
.hidden{display:none!important}
@media(max-width:720px){
  body{padding:10px 10px calc(24px + env(safe-area-inset-bottom,0px))}
  .hdr h1{font-size:18px}
  .hdr img{height:48px}
  .m-card{padding:14px;border-radius:12px}
  .survey-tabs{margin:8px -4px 10px;padding-left:4px;padding-right:4px}
}
</style></head>
<body>
<div class="wrap">
  <div class="hdr">
    <img src="https://www.agilegroup-digital.co.in/agile-logo-clear.png" alt="Agile" onerror="this.src='https://www.agilegroup-digital.co.in/agile-logo.png'">
    <div class="co">Agile Security Force Private Limited</div>
    <h1>HDFC Site Security Assessment (SSA) Format</h1>
    <p>No login. Start at the <b>HDFC site</b> (Allow location). Answers <b>auto-save as Draft</b> for <b>every branch</b>. Finish on a <b>laptop</b> with the continue code, or open that branch’s SSA list. <b>Submit to HOD</b> is only on page 15.</p>
  </div>

  ${ssaWhatWhereIntroHtml()}

  <div class="instruct">
    <b>Risk Analyst — please complete all 15 pages</b> (check every heading and give answers). The screen shows <b>Pages completed: 00 / 15</b>. <b>Submit to HOD</b> works only when this is <b>15 / 15</b> (page 15).
    <ol style="margin:10px 0 0;padding-left:20px;line-height:1.6">
      <li><b>Start at the HDFC site.</b> Pick Branch, HDFC unit, your name, Email, WhatsApp and Date. Tap <b>Start Assessment</b>. When the phone asks for location, tap <b>Allow</b>.</li>
      <li><b>Write down the continue code</b> (8 letters/numbers) on the blue bar after Draft saved — or take a photo of it. WhatsApp is not needed for this code. Phone is hard? Open this same page on a computer, type the code, tap <b>Open saved assessment</b>.</li>
      <li>Fill <b>pages 1 to 12</b>. Tap <b>Next</b>. Answers auto-save as Draft. You can also tap <b>Save draft</b>.</li>
      <li><b>Page 13</b> is generated automatically. You do not type. Tap <b>Next</b> to go to photos.</li>
      <li><b>Page 14</b> — take photos and add documents.</li>
      <li><b>Page 15</b> — tap <b>Review the report</b>, then <b>Submit to HOD</b>.</li>
    </ol>
    <p style="margin:12px 0 0;line-height:1.6"><b>After page 15 / after Submit to HOD:</b> You see Thank you (with time taken). Your branch HOD sees this on <b>HDFC SSA submitted List</b>. A thank-you goes to your email and WhatsApp, and is copied to Director and the branch HOD. The continue code then stops (this assessment is finished). HOD reviews, then Forwards for Approval. Management gives Director Approval. HOD can then Send to client.</p>
  </div>
  <div id="hdfcAllGuide"></div>

  <div id="setupCard" class="m-card">
    <b style="color:#fde68a;font-size:16px">Start Assessment</b>
    <p class="hint" style="margin-top:8px">1) Branch (any branch) · 2) HDFC unit · 3) Risk Analyst details · then tap <b>Start Assessment</b> <b>at the HDFC site</b>. After Draft saved, <b>write down the continue code or take a photo</b>. The draft is saved on that branch’s SSA list. Phone is hard? Finish on a laptop with that code.</p>
    <div style="margin-top:12px"><label class="m-lbl">Branch *</label>
      <select class="m-inp" id="pubBranch"><option value="">— select branch —</option></select></div>
    <div style="margin-top:12px"><label class="m-lbl">HDFC unit *</label>
      <select class="m-inp" id="pubClient" disabled><option value="">— pick branch first —</option></select></div>
    <div style="margin-top:12px"><label class="m-lbl">Risk Analyst / Operations name *</label>
      <select class="m-inp" id="pubNamePick" onchange="onPubAssessorPick()" disabled><option value="">— pick branch first —</option></select>
      <p class="hint">This branch’s HOD and operations staff only (VP, AVP, RM, CGM, OM). IT, Control, Director and other HQ names are not listed. A typed name is saved for this branch.</p></div>
    <div style="margin-top:12px;display:none" id="pubNameWrap"><label class="m-lbl">Your Name (not in list — saved for this branch)</label>
      <input class="m-inp" id="pubName" placeholder="Type your full name" autocomplete="name"></div>
    <div style="margin-top:12px"><label class="m-lbl">Email ID (HOD / Operations) *</label>
      <select class="m-inp" id="pubEmailPick" onchange="onPubEmailPick()" disabled><option value="">— pick branch first —</option></select>
      <input class="m-inp" id="pubEmail" type="email" placeholder="Or type email if not in list" style="margin-top:8px" autocomplete="email"></div>
    <div style="margin-top:12px"><label class="m-lbl">WhatsApp Number *</label>
      <input class="m-inp" id="pubWa" type="tel" inputmode="numeric" placeholder="10-digit mobile" autocomplete="tel"></div>
    <div style="margin-top:12px"><label class="m-lbl">Date of Survey *</label>
      <input class="m-inp" id="pubSurveyDate" type="date"></div>
    <div style="margin-top:12px"><label class="m-lbl">Time now (auto)</label>
      <input class="m-inp" id="pubDateTime" readonly style="opacity:.95;color:#fde68a"></div>
    <p class="hint" style="margin-top:14px;padding:10px 12px;border:1px solid #334155;border-radius:10px;background:#0f172a;color:#e2e8f0;line-height:1.5">
      <b style="color:#86efac">Important:</b> Ensure the <b>Start Assessment</b> button is only pressed upon arrival at the site. The system logs the user's geolocation at the time of initiation. When the permission prompt appears, select <b>Allow</b> to enable HDFC Branch location.
    </p>
    <div style="margin-top:14px"><button type="button" class="m-btn m-btn-green m-btn-block" id="btnStart" onclick="startPublicSurvey()">Start Assessment</button></div>
    <div id="setupErr" class="msg"></div>
    <div class="m-card" style="margin-top:16px;border-color:#38bdf8">
      <b style="color:#7dd3fc">Continue on a computer</b>
      <p class="hint" style="margin-top:8px">Started on the phone? Type the <b>continue code you wrote down or photographed</b> (no location needed, no WhatsApp). Your draft is already on that branch’s SSA list.</p>
      <div style="margin-top:10px"><label class="m-lbl">Continue code</label>
        <input class="m-inp" id="pubResumeCode" maxlength="12" placeholder="8 letters / numbers" autocomplete="off" style="text-transform:uppercase"></div>
      <div style="margin-top:10px"><button type="button" class="m-btn m-btn-navy m-btn-block" id="btnResume" onclick="continuePublicByCode()">Open saved assessment</button></div>
    </div>
    <div style="margin-top:10px;display:none" id="pubGeoWrap"><div id="pubGeoTip" class="hint" style="color:#7dd3fc;margin:0"></div></div>
  </div>

  <div id="pubSaveBanner" class="m-card" style="display:none;position:sticky;top:0;z-index:9;border-color:#38bdf8;margin-bottom:10px">
    <b id="pubSaveBannerText" style="color:#fde68a">Draft not saved yet — tap Save draft</b>
    <p class="hint" id="pubSaveBannerCode" style="margin-top:6px;color:#7dd3fc"></p>
  </div>
  <div id="formRoot" style="display:none"></div>

  <div id="okCard" class="m-card okbox">
    <div style="font-size:48px;line-height:1">✅</div>
    <div class="thanks">Thank you!</div>
    <p style="color:#cbd5e1;line-height:1.55" id="okMsg">Submitted to HOD.</p>
    <p class="hint" style="margin-top:12px" id="okTimeHint">Your branch HOD will see this under Site Security Assessment (SSA) → HDFC SSA submitted List.</p>
    <button type="button" class="m-btn m-btn-navy" style="margin-top:16px" onclick="location.reload()">Survey another HDFC unit</button>
  </div>

  <div id="svCamModal" class="hidden">
    <div id="svCamBox">
      <b style="color:#fde68a" id="svCamTitle">Take photo</b>
      <p class="hint" id="svCamHint" style="margin-top:6px"></p>
      <video id="svCamVideo" autoplay playsinline style="margin-top:10px"></video>
      <canvas id="svCamCanvas" class="hidden"></canvas>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
        <button type="button" class="m-btn m-btn-gold" onclick="svCamSnap()">Capture / Save</button>
        <button type="button" class="m-btn m-btn-navy" onclick="svCamFlip()">Flip camera</button>
        <button type="button" class="m-btn m-btn-grey" onclick="svCamClose()">Cancel</button>
      </div>
    </div>
  </div>

  ${footer}
</div>
<script>
${suiteDateInputInitScript()}
${hdfcJs}
var API='/mis-hdfc-survey';
var IS_STAFF=true,IS_MGMT=false;
var SV=[],CLIENTS=[],BRANCHES=[],OPS_TEAM=[],SSA_DIR={operations:[],hods:[]},SURVEY_TPL={parts:[]};
var SV_VIEW='edit',SV_EDIT=0,SV_TAB='h1',SV_SHOW_INACT=false;
var BRANCH_ID='',SV_PHOTO_CTX={si:-1,type:'site_photo',slot:'',label:''},SV_CAM_STREAM=null,SV_CAM_FACING='environment',SV_MAX_PHOTOS=14;
var SV_FA_EDIT=-1;
var PHOTO_LABELS={site_photo:'Site Photo',other:'Other'};
var HDFC_PHOTO_SLOTS=[
  {id:'selfie',label:'Selfie (surveyor on site)',hint:'Use Flip camera for selfie',facing:'user'},
  {id:'bank_front',label:'Photo 1 — Bank & ATM from front',hint:'Left, right and above visible'},
  {id:'bank_approach',label:'Photo 2 — What is in front of the Bank & ATM',hint:''},
  {id:'ac_outdoor',label:'Photo 3 — AC outdoor unit area',hint:''},
  {id:'sensitive',label:'Photo 4 — Any sensitive information area',hint:''}
];
var HDFC_DOC_SLOTS=[
  {id:'doc_attendance',label:'Document 1 — Attendance Register copy'},
  {id:'doc_hoto',label:'Document 2 — HOTO register copy'},
  {id:'doc_pvc',label:'Document 3 — PVC copies of 3/2 FA'},
  {id:'doc_close_open',label:'Document 4 — Closing and Opening register'}
];
function el(id){return document.getElementById(id);}
function h(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function a(t){return h(t).replace(/'/g,'&#39;');}
function nid(p){return (p||'id')+'_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
function today(){try{return new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});}catch(e){return new Date().toISOString().slice(0,10);}}
function applySsaDirectory(dir){
  SSA_DIR=dir&&typeof dir==='object'?dir:{operations:[],hods:[]};
  if(!SSA_DIR.operations)SSA_DIR.operations=[];
  if(!SSA_DIR.hods)SSA_DIR.hods=[];
  OPS_TEAM=(SSA_DIR.operations||[]).map(function(p){return p.name;}).filter(Boolean);
  fillPubAssessorDropdowns();
}
function fillPubAssessorDropdowns(){
  var np=el('pubNamePick'),ep=el('pubEmailPick');
  if(!np||!ep)return;
  var bid=el('pubBranch')&&el('pubBranch').value;
  if(!bid){
    np.disabled=true;ep.disabled=true;
    np.innerHTML='<option value="">— pick branch first —</option>';
    ep.innerHTML='<option value="">— pick branch first —</option>';
    return;
  }
  np.disabled=false;ep.disabled=false;
  var nameCur=np.value,emailCur=ep.value;
  np.innerHTML='<option value="">— select operations / HOD name —</option>';
  if(SSA_DIR.operations.length){
    var og=document.createElement('optgroup');og.label='Operations';
    SSA_DIR.operations.forEach(function(p){var o=document.createElement('option');o.value=p.name;o.textContent=p.name+(p.email?' — '+p.email:'');og.appendChild(o);});
    np.appendChild(og);
  }
  if(SSA_DIR.hods.length){
    var hg=document.createElement('optgroup');hg.label='HODs';
    SSA_DIR.hods.forEach(function(p){var o=document.createElement('option');o.value=p.name;o.textContent=p.name+(p.email?' — '+p.email:'');hg.appendChild(o);});
    np.appendChild(hg);
  }
  var other=document.createElement('option');other.value='Name not available';other.textContent='Name not in list — type (saved for this branch)';np.appendChild(other);
  if(nameCur)np.value=nameCur;
  ep.innerHTML='<option value="">— select HOD / operations email —</option>';
  if(SSA_DIR.hods.length){
    var heg=document.createElement('optgroup');heg.label='HOD emails';
    SSA_DIR.hods.forEach(function(p){if(!p.email)return;var o=document.createElement('option');o.value=p.email;o.textContent=(p.name?p.name+' — ':'')+p.email;heg.appendChild(o);});
    ep.appendChild(heg);
  }
  if(SSA_DIR.operations.length){
    var oeg=document.createElement('optgroup');oeg.label='Operations emails';
    SSA_DIR.operations.forEach(function(p){if(!p.email)return;var o=document.createElement('option');o.value=p.email;o.textContent=(p.name?p.name+' — ':'')+p.email;oeg.appendChild(o);});
    ep.appendChild(oeg);
  }
  if(emailCur)ep.value=emailCur;
}
function onPubAssessorPick(){
  var v=String(el('pubNamePick').value||'');
  var wrap=el('pubNameWrap');
  if(v==='Name not available'){if(wrap)wrap.style.display='block';return;}
  if(wrap)wrap.style.display='none';
  el('pubName').value=v;
  var hit=typeof ssaFindPerson==='function'?ssaFindPerson(v):null;
  if(hit){
    if(hit.email){el('pubEmail').value=hit.email;if(el('pubEmailPick'))el('pubEmailPick').value=hit.email;}
    if(hit.mobile)el('pubWa').value=hit.mobile;
  }
}
function onPubEmailPick(){
  var v=String(el('pubEmailPick').value||'');
  if(v)el('pubEmail').value=v;
}
function canEdit(sv){return true;}
function branchId(){return BRANCH_ID;}
function branchNameOf(id){var b=BRANCHES.find(function(x){return x.id===id;});return b&&b.name?b.name:(id||'—');}
function clientsForBranch(){return CLIENTS.slice();}
function svEnsure(si){if(!SV[si])return;if(!SV[si].hdfcForm)SV[si].hdfcForm=emptyHdfcForm();if(!SV[si].photos)SV[si].photos=[];if(!SV[si].scores)SV[si].scores={};if(!SV[si].scoreNotes)SV[si].scoreNotes={};}
function svGrandTotal(sv){var t=0;Object.keys(sv.scores||{}).forEach(function(k){t+=Number(sv.scores[k])||0;});return t;}
function svRiskBand(total){if(total>=120)return{level:'High',colour:'#ef4444'};if(total>=70)return{level:'Medium',colour:'#f59e0b'};return{level:'Low',colour:'#22c55e'};}
function svPartTotal(sv,part){var t=0;(part.items||[]).forEach(function(it){t+=Number((sv.scores||{})[it.id])||0;});return t;}
function pickClient(si,id){
  var c=CLIENTS.find(function(x){return x.id===id;});
  if(!c){SV[si].clientId='';return;}
  SV[si].clientId=c.id;SV[si].branchId=c.branchId||SV[si].branchId;SV[si].company=c.name||'';
  SV[si].locationName=c.location||'';
  if(c.staffName)SV[si].factoryManager=c.staffName;
  if(!SV[si].hdfcForm)SV[si].hdfcForm=emptyHdfcForm();
  var f=SV[si].hdfcForm;f.branchName=c.name||f.branchName||'';f.fullAddress=(c.location||'')||f.fullAddress||'';
  if(c.staffName)f.managerName=c.staffName;
  if(c.sanctionedStrength)f.sanctionedGuards=String(c.sanctionedStrength);
  if(!f.surveyDate)f.surveyDate=SV[si].surveyDate||today();
  render();
}
function clientOptions(si){
  return '<option value="">Select HDFC client from Master Directory</option>'+CLIENTS.map(function(c){return '<option value="'+a(c.id)+'"'+(SV[si].clientId===c.id?' selected':'')+'>'+h(c.name)+(c.location?' — '+h(c.location):'')+'</option>';}).join('');
}
function svActivePhotoCount(si){svEnsure(si);return (SV[si].photos||[]).filter(function(p){return p.active!==false;}).length;}
function svFindSlotIndex(si,slot){var photos=SV[si].photos||[];for(var i=0;i<photos.length;i++){if(photos[i]&&photos[i].heading===slot)return i;}return -1;}
function svLooksLikeImage(file){if(!file)return false;if(file.type&&file.type.indexOf('image')===0)return true;return/\\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name||'');}
function svAddPhotoData(dataUrl,si,type,slot,label){
  if(si<0||!SV[si])return;
  if(!dataUrl||String(dataUrl).indexOf('data:image/')!==0){alert('Could not save photo — try again.');return;}
  if(String(dataUrl).length>900000){alert('Photo too large — retake closer / lower quality.');return;}
  svEnsure(si);
  var lab=label||PHOTO_LABELS[type]||'Site Photo';
  if(slot){
    var ix=svFindSlotIndex(si,slot);
    var row={id:ix>=0?SV[si].photos[ix].id:nid('ph'),type:type||'other',label:lab,heading:slot,caption:lab,dataUrl:dataUrl,takenAt:new Date().toISOString(),active:true};
    if(ix>=0)SV[si].photos[ix]=row;else{if(svActivePhotoCount(si)>=SV_MAX_PHOTOS){alert('Maximum '+SV_MAX_PHOTOS+' photos.');return;}SV[si].photos.push(row);}
  }else{
    if(svActivePhotoCount(si)>=SV_MAX_PHOTOS){alert('Maximum '+SV_MAX_PHOTOS+' photos.');return;}
    SV[si].photos.push({id:nid('ph'),type:type||'site_photo',label:lab,heading:'',caption:'',dataUrl:dataUrl,takenAt:new Date().toISOString(),active:true});
  }
  PUB_PHOTOS_SYNCED=false;
  render();
  schedulePublicAutoSave();
}
function svCompressPhoto(file,cb){
  if(!svLooksLikeImage(file)){alert('Please choose a photo (JPG or PNG).');return;}
  var r=new FileReader();
  r.onload=function(){
    var img=new Image();
    img.onload=function(){
      var w=img.width,hgt=img.height,mx=1200;
      if(w>mx){hgt=Math.round(hgt*mx/w);w=mx;}
      var c=document.createElement('canvas');c.width=w;c.height=hgt;c.getContext('2d').drawImage(img,0,0,w,hgt);
      cb(c.toDataURL('image/jpeg',0.78));
    };
    img.onerror=function(){alert('Could not read photo.');};
    img.src=r.result;
  };
  r.readAsDataURL(file);
}
function svPhotoBtn(si,type,mode,slot,label,facing){
  if(mode==='gallery'){
    var inp=document.createElement('input');inp.type='file';inp.accept='image/*';
    inp.onchange=function(){var f=inp.files&&inp.files[0];if(!f)return;svCompressPhoto(f,function(du){svAddPhotoData(du,si,type,slot,label);});};
    inp.click();return;
  }
  SV_PHOTO_CTX={si:si,type:type,slot:slot||'',label:label||''};SV_CAM_FACING=facing||'environment';svCamOpen();
}
function svPhotoPickBtn(si,type,text,cls,mode,slot,label,facing){
  var safe=String(label||'').replace(/\\\\/g,'').replace(/'/g,'');
  return '<button type="button" class="m-btn '+cls+'" onclick="svPhotoBtn('+si+',\\''+type+'\\',\\''+mode+'\\',\\''+(slot||'')+'\\',\\''+safe+'\\',\\''+(facing||'')+'\\')">'+text+'</button>';
}
function svCamOpen(){
  var modal=el('svCamModal'),video=el('svCamVideo'),title=el('svCamTitle'),hint=el('svCamHint');
  if(!modal||!video){alert('Camera not ready.');return;}
  modal.classList.remove('hidden');
  if(title)title.textContent=SV_PHOTO_CTX.label||'Take photo';
  if(hint)hint.textContent='Allow camera, then Capture / Save. Flip for selfie.';
  if(SV_CAM_STREAM){SV_CAM_STREAM.getTracks().forEach(function(t){t.stop();});SV_CAM_STREAM=null;}
  var constraints={video:{facingMode:SV_CAM_FACING},audio:false};
  navigator.mediaDevices.getUserMedia(constraints).then(function(stream){SV_CAM_STREAM=stream;video.srcObject=stream;}).catch(function(){alert('Allow camera permission, or use Gallery.');svCamClose();});
}
function svCamFlip(){SV_CAM_FACING=SV_CAM_FACING==='user'?'environment':'user';svCamOpen();}
function svCamClose(){
  var modal=el('svCamModal'),video=el('svCamVideo');
  if(SV_CAM_STREAM){SV_CAM_STREAM.getTracks().forEach(function(t){t.stop();});SV_CAM_STREAM=null;}
  if(video)video.srcObject=null;if(modal)modal.classList.add('hidden');
}
function svCamSnap(){
  var video=el('svCamVideo'),canvas=el('svCamCanvas');
  if(!video||!canvas){alert('Camera not ready.');return;}
  if(!video.videoWidth){alert('Wait one second, then Capture again.');return;}
  var w=video.videoWidth,hgt=video.videoHeight,mx=1200;
  if(w>mx){hgt=Math.round(hgt*mx/w);w=mx;}
  canvas.width=w;canvas.height=hgt;canvas.getContext('2d').drawImage(video,0,0,w,hgt);
  var dataUrl=canvas.toDataURL('image/jpeg',0.78);
  var ctx={si:SV_PHOTO_CTX.si,type:SV_PHOTO_CTX.type||'other',slot:SV_PHOTO_CTX.slot||'',label:SV_PHOTO_CTX.label||''};
  svCamClose();svAddPhotoData(dataUrl,ctx.si,ctx.type,ctx.slot,ctx.label);
}
function svSlotThumb(si,slot){
  var ix=svFindSlotIndex(si,slot);if(ix<0)return '';
  var p=SV[si].photos[ix];if(!p||!p.dataUrl)return '';
  return '<img src="'+p.dataUrl+'" alt="'+a(p.label||slot)+'"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:6px"><span style="font-size:11px;color:#86efac">Saved</span><button type="button" class="m-btn m-btn-grey" onclick="svRemoveSlotPhoto('+si+',\\''+slot+'\\')">Delete</button></div>';
}
function renderHdfcPhotosDocs(si){
  svEnsure(si);
  var html=(typeof hdfcProcessGuideHtml==='function'?hdfcProcessGuideHtml('photos'):'')+
    '<div class="m-card"><b style="color:#fde68a;font-size:16px">14. Site Photos &amp; Documents</b><p class="hint" style="margin-top:8px">Take Photo / Gallery. Keep photos clear but not too heavy.</p></div>';
  HDFC_PHOTO_SLOTS.forEach(function(slot){
    html+='<div class="hdfc-slot"><b style="color:#e2e8f0">'+h(slot.label)+'</b>';
    if(slot.hint)html+='<div class="hint" style="margin-top:4px">'+h(slot.hint)+'</div>';
    html+=svSlotThumb(si,slot.id);
    html+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">'+svPhotoPickBtn(si,'other','Take Photo','m-btn-gold','cam',slot.id,slot.label,slot.facing||'environment')+svPhotoPickBtn(si,'other','Gallery','m-btn-navy','gallery',slot.id,slot.label,'')+'</div></div>';
  });
  html+='<div class="m-card" style="margin-top:12px"><b style="color:#fde68a">Documents</b></div>';
  HDFC_DOC_SLOTS.forEach(function(slot){
    html+='<div class="hdfc-slot"><b style="color:#e2e8f0">'+h(slot.label)+'</b>'+svSlotThumb(si,slot.id);
    html+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">'+svPhotoPickBtn(si,'other','Take Photo','m-btn-gold','cam',slot.id,slot.label,'environment')+svPhotoPickBtn(si,'other','Gallery','m-btn-navy','gallery',slot.id,slot.label,'')+'</div></div>';
  });
  return html;
}
function renderHdfcFooter(si){
  var page=hdfcPageIndex();
  var last=isHdfcLastPage();
  var code=pubResumeCode();
  var html='<div class="m-savebar">';
  html+='<button type="button" class="m-btn m-btn-grey"'+(page<=0?' disabled style="opacity:.45"':'')+' onclick="hdfcGoPrev()">Previous</button>';
  html+='<button type="button" class="m-btn m-btn-gold" onclick="savePublicDraftNow()">Save draft</button>';
  if(!last)html+='<button type="button" class="m-btn m-btn-navy" onclick="hdfcGoNext()">Next</button>';
  else html+='<button type="button" class="m-btn m-btn-green" style="font-size:15px;padding:12px 16px" onclick="submitPublicSurvey()">Submit to HOD</button>';
  var prog=typeof hdfcPagesProgress==='function'?hdfcPagesProgress(SV[0]||{}):{label:(page+1)+' / 15',complete:false};
  html+='<span id="pubAutoSaveTip" class="hint" style="width:100%;text-align:center;color:'+(prog.complete?'#86efac':'#fde68a')+';margin-top:6px;font-weight:800">Pages completed: '+h(prog.label)+' · now on page '+(page+1)+(last?' — Submit to HOD only when 15 / 15':' — tap Next')+'</span>';
  if(code){
    html+='<p class="hint" id="pubResumeBox" style="width:100%;text-align:center;color:#7dd3fc;margin-top:8px;line-height:1.5">Saved as <b>Draft</b> on this branch SSA list. <b>Write this code down or take a photo</b> — Laptop code <b style="color:#fde68a;letter-spacing:.08em">'+h(code)+'</b><br>Open <b>www.agilegroup-digital.co.in/mis-hdfc-survey</b> and enter this code, or continue in the branch portal. After <b>Submit to HOD</b> on page 15 this code stops.</p>';
  }
  html+='<button type="button" class="m-btn m-btn-grey" style="flex:1 1 100%" onclick="backToSetup()">Change unit</button>';
  html+='</div>';
  return html;
}
function renderEdit(si){
  var sv=SV[si];if(!sv)return '<div class="m-card">Survey not found.</div>';
  svEnsure(si);
  var total=svGrandTotal(sv),band=svRiskBand(total),parts=SURVEY_TPL&&SURVEY_TPL.parts?SURVEY_TPL.parts:[];
  if(SV_TAB==='inputs'||!SV_TAB)SV_TAB='h1';
  var html='<div class="m-card"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;align-items:center"><div><b style="color:#fff;font-size:18px">'+h(sv.company||'(HDFC Survey)')+'</b><div style="font-size:12px;color:#94a3b8;margin-top:4px">'+h(branchNameOf(sv.branchId))+' · HDFC · fill headings 1–15</div></div><span class="risk-pill" style="background:'+band.colour+'22;color:'+band.colour+';border:1px solid '+band.colour+'">Score '+total+'/180 · '+band.level+'</span></div>';
  html+='<p class="hint" style="margin-top:10px">Answers <b>auto-save as Draft</b>. Use <b>Previous</b> / <b>Next</b>. <b>Submit to HOD</b> is only on page 15. If a photo fails, free phone space and try again.</p>';
  html+=renderHdfcNav(si);
  if(/^h(1[01]|[1-9])$/.test(SV_TAB))html+=renderHdfcPage(si);
  else if(SV_TAB==='checklist'){
    html+=typeof renderHdfcChecklist==='function'?renderHdfcChecklist(si):'';
  }else if(SV_TAB==='report'){
    html+=typeof hdfcProcessGuideHtml==='function'?hdfcProcessGuideHtml('report'):'';
    html+='<p class="hint"><b>13. Professional assessment</b></p>';
    html+='<p class="hint" style="color:#86efac;font-weight:800;margin-top:8px">This page is generated automatically from your answers. You do not need to type. Tap <b>Next</b> to go to 14. Site Photos.</p>';
    if(PUB_GEN_BUSY)html+='<p class="hint" style="color:#fde68a;margin-top:8px">Generating your assessment… then tap Next.</p>';
    else if(page13Filled(sv))html+='<p class="hint" style="color:#86efac;margin-top:8px">Generated. Tap Next to go to the next section.</p>';
    html+='<label class="m-lbl">Scientific Risk Analysis</label><textarea class="m-inp" rows="4" oninput="SV['+si+'].riskAnalysis=this.value;schedulePublicAutoSave()">'+h(sv.riskAnalysis||'')+'</textarea>';
    html+='<label class="m-lbl">Executive Summary</label><textarea class="m-inp" rows="4" oninput="SV['+si+'].executiveSummary=this.value;schedulePublicAutoSave()">'+h(sv.executiveSummary||'')+'</textarea>';
    html+='<label class="m-lbl">Security Professional Recommendations</label><textarea class="m-inp" rows="4" oninput="SV['+si+'].securityRecommendations=this.value;schedulePublicAutoSave()">'+h(sv.securityRecommendations||'')+'</textarea>';
    html+='<label class="m-lbl">Site observations</label><textarea class="m-inp" rows="3" oninput="SV['+si+'].siteObservations=this.value;schedulePublicAutoSave()">'+h(sv.siteObservations||'')+'</textarea>';
  }else if(SV_TAB==='photos')html+=renderHdfcPhotosDocs(si);
  if(SV_TAB==='final'){
    html+=typeof hdfcProcessGuideHtml==='function'?hdfcProcessGuideHtml('final'):'';
    html+='<p class="hint"><b>15. Final Report with suggestions</b> — tap <b>Review the report</b> to read the full report, then <b>Submit to HOD</b>.</p>';
    html+='<p class="hint" style="color:#86efac;font-weight:800;margin-top:8px">After Submit to HOD: Thank you appears. HOD sees this on HDFC SSA submitted List. Thank-you mail and WhatsApp go to you, copied to Director and branch HOD. The continue code then stops.</p>';
    html+=renderHdfcFinalSummary(si);
    html+='<div style="margin:12px 0;display:flex;gap:8px;flex-wrap:wrap">';
    html+='<button type="button" class="m-btn m-btn-navy" onclick="reviewPublicReport()">Review the report</button>';
    html+='<button type="button" class="m-btn m-btn-navy" onclick="openPhotosPreview(0)">Photos Preview</button>';
    html+='</div>';
    html+='<label class="m-lbl">Your suggestions for HOD</label><textarea class="m-inp" rows="5" oninput="SV['+si+'].hodSuggestions=this.value;schedulePublicAutoSave()">'+h(sv.hodSuggestions||'')+'</textarea>';
  }
  html+='</div>'+renderHdfcFooter(si);
  return html;
}
function render(opts){
  opts=opts||{};
  var root=el('formRoot');
  if(!root||root.style.display==='none')return;
  root.innerHTML=renderEdit(0);
  if(opts.focusScore){goToScoreRow(opts.focusScore);return;}
  if(opts.keepScroll)return;
  try{window.scrollTo(0,0);}catch(e){}
}
function showSetupErr(t){var e=el('setupErr');e.style.display='block';e.textContent=t;}
function backToSetup(){
  flushPublicAutoSave().then(function(){
    el('formRoot').style.display='none';el('formRoot').innerHTML='';
    el('setupCard').style.display='block';el('okCard').style.display='none';
    SV=[];SV_EDIT=-1;
  });
}
var PUB_AUTO_T=null,PUB_AUTO_BUSY=false,PUB_AUTO_AGAIN=false,PUB_PHOTOS_SYNCED=false,PUB_AUTO_WAIT=[],PUB_LAST_SAVE_OK=false;
function pubResumeCode(){return String((SV[0]&&SV[0].publicResumeCode)||'').toUpperCase();}
function finishPublicAutoWaits(){
  var w=PUB_AUTO_WAIT.splice(0);
  for(var i=0;i<w.length;i++){try{w[i]();}catch(e){}}
}
function newResumeCode(){
  var chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',out='';
  for(var i=0;i<8;i++)out+=chars.charAt(Math.floor(Math.random()*chars.length));
  return out;
}
function ensureResumeCode(){
  if(SV[0]&&!String(SV[0].publicResumeCode||'').trim())SV[0].publicResumeCode=newResumeCode();
  return pubResumeCode();
}
function showSaveBanner(ok,msg,code){
  var box=el('pubSaveBanner');if(!box)return;
  box.style.display='block';
  var t=el('pubSaveBannerText');
  var c=el('pubSaveBannerCode');
  if(t){t.style.color=ok?'#86efac':'#fbbf24';t.textContent=msg||(ok?'Draft saved':'Draft not saved');}
  if(c)c.textContent=code?('Write this code down or take a photo. Laptop / continue code: '+code+'  — open this same page on a computer and type this code. After Submit to HOD this code stops.'):'';
}
function page13Filled(sv){
  sv=sv||SV[0]||{};
  return !!(String(sv.riskAnalysis||'').trim()&&String(sv.executiveSummary||'').trim()&&String(sv.securityRecommendations||'').trim());
}
function applyLocalPage13Fallback(){
  var sv=SV[0];if(!sv||page13Filled(sv))return;
  var total=typeof svGrandTotal==='function'?svGrandTotal(sv):0;
  var band=typeof svRiskBand==='function'?svRiskBand(total):{level:''};
  var co=sv.company||'this HDFC unit';
  sv.riskAnalysis=sv.riskAnalysis||('HDFC SSA scientific risk assessment for '+co+'. Checklist score '+total+'/180'+(band.level?' — '+band.level+' risk.':'')+'.');
  sv.executiveSummary=sv.executiveSummary||('Site Security Assessment for '+co+(sv.locationName?' at '+sv.locationName:'')+' on '+(sv.surveyDate||'')+' by '+(sv.surveyedBy||'operations')+'.');
  sv.securityRecommendations=sv.securityRecommendations||('Close gaps scored 4–5 on the risk check list. Keep registers, CCTV, fire safety and ATM controls as recorded on headings 1–12. Review again at the next periodical SSA.');
}
var PUB_GEN_BUSY=false,PUB_GEN_Q=[];
function finishPubGenWaits(){
  var w=PUB_GEN_Q.splice(0);
  for(var i=0;i<w.length;i++){try{w[i]();}catch(e){}}
}
function generatePublicReport(done){
  if(typeof done==='function')PUB_GEN_Q.push(done);
  var sv=SV[0];
  if(!sv){finishPubGenWaits();return;}
  if(page13Filled(sv)){finishPubGenWaits();return;}
  if(PUB_GEN_BUSY)return;
  var payload=publicSurveyPayload();
  if(!payload){applyLocalPage13Fallback();finishPubGenWaits();return;}
  payload.action='generate';
  if(payload.survey)payload.survey.photos=[];
  PUB_GEN_BUSY=true;
  if(typeof render==='function'&&SV_TAB==='report')render();
  fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(r){return r.text().then(function(t){var j={};try{j=t?JSON.parse(t):{};}catch(e){j={};}return{s:r.status,j:j};});})
    .then(function(res){
      PUB_GEN_BUSY=false;
      if(res.s===200&&SV[0]){
        if(res.j.riskAnalysis)SV[0].riskAnalysis=res.j.riskAnalysis;
        if(res.j.executiveSummary)SV[0].executiveSummary=res.j.executiveSummary;
        if(res.j.securityRecommendations)SV[0].securityRecommendations=res.j.securityRecommendations;
        if(res.j.systemSuggestions)SV[0].systemSuggestions=res.j.systemSuggestions;
        if(res.j.surveyId)SV[0].id=res.j.surveyId;
        if(res.j.resumeCode)SV[0].publicResumeCode=res.j.resumeCode;
      }
      if(!page13Filled(SV[0]))applyLocalPage13Fallback();
      if(typeof render==='function'&&SV_TAB==='report')render();
      finishPubGenWaits();
    })
    .catch(function(){
      PUB_GEN_BUSY=false;
      applyLocalPage13Fallback();
      if(typeof render==='function'&&SV_TAB==='report')render();
      finishPubGenWaits();
    });
}
function goHdfcTab(tabId){
  if(!tabId)return;
  if(typeof harvestHdfcDom==='function'){try{harvestHdfcDom(0);}catch(e){}}
  if(tabId==='checklist'&&SV_TAB!=='checklist'&&typeof hdfcFirstOpenScoreIx==='function')HDFC_SCORE_IX=hdfcFirstOpenScoreIx();
  var after=function(){
    SV_TAB=tabId;
    if(typeof render==='function')render();
    schedulePublicAutoSave();
    if(tabId==='report')generatePublicReport();
  };
  if((tabId==='photos'||tabId==='final')&&!page13Filled(SV[0])){
    generatePublicReport(after);
    return;
  }
  flushPublicAutoSave().then(after).catch(after);
}
function hdfcGoNext(){
  var i=hdfcPageIndex();
  if(i>=HDFC_TABS.length-1)return;
  var next=HDFC_TABS[i+1].id;
  if(SV_TAB==='report'){
    generatePublicReport(function(){goHdfcTab(next);});
    return;
  }
  goHdfcTab(next);
}
function schedulePublicAutoSave(){
  if(PUB_AUTO_T)clearTimeout(PUB_AUTO_T);
  PUB_AUTO_T=setTimeout(function(){PUB_AUTO_T=null;quietPublicAutoSave();},400);
}
function scheduleHdfcAutoSave(){schedulePublicAutoSave();}
function flushPublicAutoSave(){
  return new Promise(function(resolve){
    if(PUB_AUTO_T){clearTimeout(PUB_AUTO_T);PUB_AUTO_T=null;}
    quietPublicAutoSave(resolve);
  });
}
function flushHdfcAutoSave(){return flushPublicAutoSave();}
function savePublicDraftNow(){
  if(typeof harvestHdfcDom==='function')harvestHdfcDom(0);
  var p=publicSurveyPayload();
  if(!p){alert('Pick Branch, HDFC unit and your name, then tap Start Assessment first.');return;}
  showSaveBanner(false,'Saving draft…',pubResumeCode());
  flushPublicAutoSave().then(function(){
    if(PUB_LAST_SAVE_OK&&pubResumeCode())showSaveBanner(true,'Draft saved on this branch list',pubResumeCode());
    else if(!PUB_LAST_SAVE_OK)showSaveBanner(false,'Draft not saved — tap Save draft again',pubResumeCode());
  });
}
function publicSurveyPayload(){
  var sv=SV[0];if(!sv)return null;
  var nameEl=el('pubName');
  var name=String(sv.surveyedBy||(sv.hdfcForm&&sv.hdfcForm.surveyedBy)||(nameEl&&nameEl.value)||'').trim();
  if(!name||!sv.clientId||!(sv.branchId||BRANCH_ID))return null;
  ensureResumeCode();
  var keep=PUB_PHOTOS_SYNCED;
  return {
    action:'draft',
    surveyId:sv.id||'',
    branchId:sv.branchId||BRANCH_ID,
    clientId:sv.clientId,
    surveyedBy:name,
    keepPhotos:keep,
    survey:{
      company:sv.company,locationName:sv.locationName,address:sv.address,
      surveyorEmail:sv.surveyorEmail||'',surveyorWhatsApp:sv.surveyorWhatsApp||'',startedAt:sv.startedAt||'',
      geoLat:sv.geoLat,geoLng:sv.geoLng,geoAccuracy:sv.geoAccuracy,geoCapturedAt:sv.geoCapturedAt||'',geoStatus:sv.geoStatus||'',
      publicResumeCode:sv.publicResumeCode||'',
      hdfcForm:sv.hdfcForm,photos:keep?[]:(sv.photos||[]),scores:sv.scores||{},scoreNotes:sv.scoreNotes||{},
      siteObservations:sv.siteObservations||'',riskAnalysis:sv.riskAnalysis||'',
      executiveSummary:sv.executiveSummary||'',securityRecommendations:sv.securityRecommendations||'',
      hodSuggestions:sv.hodSuggestions||'',systemSuggestions:sv.systemSuggestions||''
    }
  };
}
function quietPublicAutoSave(done){
  if(done)PUB_AUTO_WAIT.push(done);
  if(typeof harvestHdfcDom==='function'){try{harvestHdfcDom(0);}catch(e){}}
  var payload=publicSurveyPayload();
  if(!payload){PUB_LAST_SAVE_OK=false;finishPublicAutoWaits();return;}
  if(PUB_AUTO_BUSY){PUB_AUTO_AGAIN=true;return;}
  PUB_AUTO_BUSY=true;
  var tip=el('pubAutoSaveTip');
  if(tip){tip.style.opacity='1';tip.textContent='Saving draft…';tip.style.color='#94a3b8';}
  showSaveBanner(false,'Saving draft…',pubResumeCode());
  fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(r){return r.text().then(function(t){var j={};try{j=t?JSON.parse(t):{};}catch(e){j={error:'Save did not complete. Tap Save draft.'};}return{s:r.status,j:j};});})
    .then(function(res){
      PUB_AUTO_BUSY=false;
      PUB_LAST_SAVE_OK=res.s===200;
      if(res.s===200&&SV[0]){
        if(res.j.surveyId)SV[0].id=res.j.surveyId;
        if(res.j.resumeCode)SV[0].publicResumeCode=res.j.resumeCode;
        PUB_PHOTOS_SYNCED=true;
        try{localStorage.setItem('ssaResume',res.j.resumeCode||SV[0].publicResumeCode||'');}catch(e){}
      }
      if(PUB_AUTO_AGAIN){PUB_AUTO_AGAIN=false;quietPublicAutoSave();return;}
      tip=el('pubAutoSaveTip');
      if(res.s===200){
        if(tip){tip.style.color='#86efac';tip.textContent='Draft saved on this branch list — tap Next';tip.style.opacity='1';}
        showSaveBanner(true,res.j.photoNote?('Draft saved (photo skipped: free phone space and re-take)'):'Draft saved on this branch list',pubResumeCode());
      }else{
        var err=res.j.error||'Auto-save failed — tap Save draft';
        if(tip){tip.style.color='#fbbf24';tip.textContent=err;}
        showSaveBanner(false,err,pubResumeCode());
      }
      finishPublicAutoWaits();
    })
    .catch(function(){
      PUB_AUTO_BUSY=false;
      PUB_LAST_SAVE_OK=false;
      tip=el('pubAutoSaveTip');
      if(tip){tip.style.color='#fbbf24';tip.textContent='Auto-save failed — check internet, then tap Save draft';}
      showSaveBanner(false,'Auto-save failed — check internet, then tap Save draft',pubResumeCode());
      finishPublicAutoWaits();
    });
}
function applyPublicDraft(d,bid,c,name,email,wa){
  if(!d)return false;
  SV=[{
    id:d.id||nid('ps'),clientId:c.id,branchId:bid,active:true,
    company:d.company||c.name||'',locationName:d.locationName||c.location||'',address:d.address||c.location||'',
    factoryManager:d.factoryManager||c.staffName||'',contactPhone:d.contactPhone||'',contactEmail:d.contactEmail||'',
    natureOfBusiness:'Banking — HDFC',industry:'Banking',industryOther:'',
    surveyKind:'hdfc',hdfcForm:d.hdfcForm||emptyHdfcForm(),surveyDate:d.surveyDate||today(),surveyedBy:name,
    surveyorEmail:email||d.surveyorEmail||'',surveyorWhatsApp:wa||d.surveyorWhatsApp||'',
    publicResumeCode:d.publicResumeCode||'',
    startedAt:d.startedAt||new Date().toISOString(),
    geoLat:d.geoLat!=null?d.geoLat:null,geoLng:d.geoLng!=null?d.geoLng:null,geoAccuracy:d.geoAccuracy!=null?d.geoAccuracy:null,
    geoCapturedAt:d.geoCapturedAt||'',geoStatus:d.geoStatus||'',
    hodSuggestions:d.hodSuggestions||'',systemSuggestions:d.systemSuggestions||'',status:'Draft',
    photos:d.photos||[],scores:d.scores||{},scoreNotes:d.scoreNotes||{},
    siteObservations:d.siteObservations||'',riskAnalysis:d.riskAnalysis||'',
    executiveSummary:d.executiveSummary||'',securityRecommendations:d.securityRecommendations||'',recommendations:d.recommendations||''
  }];
  if(!SV[0].hdfcForm.surveyedBy)SV[0].hdfcForm.surveyedBy=name;
  if(!SV[0].hdfcForm.surveyDate)SV[0].hdfcForm.surveyDate=today();
  SV_EDIT=0;SV_TAB='h1';
  return true;
}
function nowIstLabel(){
  try{return new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true});}
  catch(e){return new Date().toISOString();}
}
function fillPubDateTime(){var i=el('pubDateTime');if(i)i.value=nowIstLabel();}
function normWa(v){return String(v||'').replace(/\\D/g,'');}
function setPubGeoTip(msg,ok){
  var wrap=el('pubGeoWrap');if(wrap)wrap.style.display=msg?'block':'none';
  var t=el('pubGeoTip');if(!t)return;
  t.textContent=msg||'';
  t.style.color=ok===false?'#fbbf24':(ok?'#86efac':'#7dd3fc');
}
function applyGeoToSurvey(geo){
  if(!SV[0]||!geo)return;
  SV[0].geoLat=geo.lat;SV[0].geoLng=geo.lng;SV[0].geoAccuracy=geo.accuracy;
  SV[0].geoCapturedAt=geo.at||new Date().toISOString();SV[0].geoStatus=geo.status||'ok';
}
function capturePublicGeo(){
  return new Promise(function(resolve){
    if(!navigator.geolocation){
      setPubGeoTip('Location not available on this phone — assessment can continue.',false);
      resolve({lat:null,lng:null,accuracy:null,at:'',status:'unavailable'});
      return;
    }
    setPubGeoTip('Getting site location… please allow when asked.',null);
    navigator.geolocation.getCurrentPosition(
      function(pos){
        var lat=pos.coords.latitude,lng=pos.coords.longitude,acc=pos.coords.accuracy;
        setPubGeoTip('Location saved: '+lat.toFixed(5)+', '+lng.toFixed(5)+' (±'+Math.round(acc||0)+' m)',true);
        resolve({lat:lat,lng:lng,accuracy:acc,at:new Date().toISOString(),status:'ok'});
      },
      function(err){
        var st=err&&err.code===1?'denied':'unavailable';
        setPubGeoTip(st==='denied'?'Location not shared — assessment can continue.':'Could not get location — assessment can continue.',false);
        resolve({lat:null,lng:null,accuracy:null,at:'',status:st});
      },
      {enableHighAccuracy:true,timeout:20000,maximumAge:0}
    );
  });
}
function openPublicForm(){
  el('setupCard').style.display='none';
  el('okCard').style.display='none';
  el('formRoot').style.display='block';
  ensureResumeCode();
  showSaveBanner(false,'Saving this draft to the branch list…',pubResumeCode());
  render();
}
function continuePublicByCode(codeIn){
  var code=String(codeIn||(el('pubResumeCode')&&el('pubResumeCode').value)||'').replace(/[^A-Za-z0-9]/g,'').toUpperCase();
  if(!code){showSetupErr('Type the continue code from the phone.');return;}
  var btn=el('btnResume');if(btn){btn.disabled=true;btn.textContent='Opening…';}
  fetch(API+'?draft=1&code='+encodeURIComponent(code)).then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});})
    .then(function(res){
      if(btn){btn.disabled=false;btn.textContent='Open saved assessment';}
      if(!res||res.s!==200||!res.j.draft){showSetupErr((res&&res.j&&res.j.error)||'No saved assessment for that code.');return;}
      var d=res.j.draft;
      BRANCH_ID=d.branchId||res.j.branchId||'';
      var c={id:d.clientId,name:d.company||'',location:d.locationName||'',staffName:d.factoryManager||''};
      CLIENTS=[c];
      applyPublicDraft(d,BRANCH_ID,c,d.surveyedBy||'',d.surveyorEmail||'',d.surveyorWhatsApp||'');
      PUB_PHOTOS_SYNCED=true;
      openPublicForm();
      var tip=el('pubAutoSaveTip');
      if(tip){tip.textContent='Opened on computer — continue from where you stopped. Submit to HOD is only on page 15.';tip.style.color='#7dd3fc';}
    })
    .catch(function(){
      if(btn){btn.disabled=false;btn.textContent='Open saved assessment';}
      showSetupErr('Could not open the saved assessment. Check internet and try again.');
    });
}
function startPublicSurvey(){
  el('setupErr').style.display='none';
  var bid=el('pubBranch').value;
  var cid=el('pubClient').value;
  var pick=String(el('pubNamePick').value||'').trim();
  var name=pick&&pick!=='Name not available'?pick:String(el('pubName').value||'').trim();
  var email=String(el('pubEmail').value||el('pubEmailPick').value||'').trim().toLowerCase();
  var wa=normWa(el('pubWa').value);
  var surveyDate=String(el('pubSurveyDate').value||today()).trim();
  fillPubDateTime();
  if(!bid){showSetupErr('Pick Branch first.');return;}
  if(!cid){showSetupErr('Pick the HDFC unit.');return;}
  if(!name){showSetupErr('Pick your name from the list (or Name not available).');return;}
  if(!email||email.indexOf('@')<0){showSetupErr('Pick or type a valid Email ID.');return;}
  if(wa.length<10){showSetupErr('Enter WhatsApp Number (10 digits).');return;}
  if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(surveyDate)){showSetupErr('Pick Date of Survey from the calendar.');return;}
  BRANCH_ID=bid;
  var c=CLIENTS.find(function(x){return x.id===cid;});
  if(!c){showSetupErr('Pick a valid HDFC unit.');return;}
  var btn=el('btnStart');if(btn){btn.disabled=true;btn.textContent='Getting location…';}
  var startedAt=new Date().toISOString();
  var geoHold=null;
  capturePublicGeo().then(function(geo){
    geoHold=geo;
    if(btn)btn.textContent='Opening…';
    return fetch(API+'?draft=1&branchId='+encodeURIComponent(bid)+'&clientId='+encodeURIComponent(cid)+'&surveyedBy='+encodeURIComponent(name));
  }).then(function(r){return r.json();})
    .then(function(j){
      if(btn){btn.disabled=false;btn.textContent='Start Assessment';}
      if(j&&j.draft&&applyPublicDraft(j.draft,bid,c,name,email,wa)){
        if(!SV[0].startedAt)SV[0].startedAt=startedAt;
        SV[0].surveyorEmail=email;SV[0].surveyorWhatsApp=wa;SV[0].surveyedBy=name;
        SV[0].surveyDate=surveyDate;
        if(SV[0].hdfcForm){SV[0].hdfcForm.surveyedBy=name;SV[0].hdfcForm.surveyDate=surveyDate;SV[0].hdfcForm.surveyedByPick=pick&&pick!=='Name not available'?pick:name;}
        applyGeoToSurvey(geoHold);
        PUB_PHOTOS_SYNCED=true;
        openPublicForm();
        var tip=el('pubAutoSaveTip');
        if(tip){tip.textContent='Resumed your saved draft — use Next through all 15 pages. Submit to HOD is only on page 15';tip.style.color='#7dd3fc';}
        quietPublicAutoSave();
        return;
      }
      var sv={
        id:nid('ps'),clientId:c.id,branchId:bid,active:true,company:c.name||'',locationName:c.location||'',address:c.location||'',publicResumeCode:'',
        factoryManager:c.staffName||'',contactPhone:'',contactEmail:'',natureOfBusiness:'Banking — HDFC',industry:'Banking',industryOther:'',
        surveyKind:'hdfc',hdfcForm:emptyHdfcForm(),surveyDate:surveyDate,surveyedBy:name,surveyorEmail:email,surveyorWhatsApp:wa,startedAt:startedAt,
        geoLat:geoHold&&geoHold.lat,geoLng:geoHold&&geoHold.lng,geoAccuracy:geoHold&&geoHold.accuracy,
        geoCapturedAt:(geoHold&&geoHold.at)||'',geoStatus:(geoHold&&geoHold.status)||'',
        hodSuggestions:'',systemSuggestions:'',status:'Draft',photos:[],scores:{},scoreNotes:{},
        siteObservations:'',riskAnalysis:'',executiveSummary:'',securityRecommendations:'',recommendations:''
      };
      sv.hdfcForm.branchName=c.name||'';
      sv.hdfcForm.fullAddress=c.location||'';
      sv.hdfcForm.surveyDate=surveyDate;
      sv.hdfcForm.surveyedBy=name;
      sv.hdfcForm.surveyedByPick=pick&&pick!=='Name not available'?pick:'Name not available';
      if(c.staffName)sv.hdfcForm.managerName=c.staffName;
      SV=[sv];SV_EDIT=0;SV_TAB='h1';
      PUB_PHOTOS_SYNCED=false;
      openPublicForm();
      quietPublicAutoSave();
    })
    .catch(function(){
      if(btn){btn.disabled=false;btn.textContent='Start Assessment';}
      showSetupErr('Could not open survey. Check internet and try again.');
    });
}
function openPhotosPreview(si){
  var sv=SV[si];if(!sv)return;
  var photos=(sv.photos||[]).filter(function(p){return p&&p.dataUrl&&p.active!==false;});
  var w=window.open('','_blank');
  if(!w){alert('Please allow pop-ups for Photos Preview.');return;}
  var body='<h1 style="font-family:Arial,sans-serif;color:#14224f">Photos Preview — '+h(sv.company||'HDFC Survey')+'</h1>';
  body+='<p style="font-family:Arial,sans-serif;color:#64748b">'+photos.length+' photo(s) / document(s)</p>';
  if(!photos.length)body+='<p style="font-family:Arial,sans-serif">No photos saved yet. Use heading 14 Site Photos &amp; Documents.</p>';
  photos.forEach(function(p,i){
    var lab=p.heading||p.label||('Photo '+(i+1));
    body+='<div style="margin:16px 0;padding:12px;border:1px solid #cbd5e1;border-radius:8px"><div style="font-family:Arial,sans-serif;font-weight:700;margin-bottom:8px">'+h(lab)+'</div><img src="'+p.dataUrl+'" alt="'+a(lab)+'" style="max-width:100%;height:auto;border-radius:6px"></div>';
  });
  w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Photos Preview</title></head><body style="margin:16px;background:#f8fafc">'+body+'</body></html>');
  w.document.close();
}
function reviewPublicReport(){
  var sv=SV[0];if(!sv)return;
  if(!isHdfcLastPage()){goHdfcTab('final');}
  var payload=publicSurveyPayload();
  if(!payload){alert('Pick Branch, HDFC unit and enter your name first.');return;}
  payload.action='report';
  if(payload.survey)payload.survey.photos=[];
  var btn=document.querySelector('button[onclick="reviewPublicReport()"]');
  if(btn){btn.disabled=true;btn.textContent='Opening report…';}
  flushPublicAutoSave().then(function(){
    return fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});});
  }).then(function(res){
    if(btn){btn.disabled=false;btn.textContent='Review the report';}
    if(!res||res.s!==200||!res.j.html){alert((res&&res.j&&res.j.error)||'Could not open the report. Check internet and try again.');return;}
    var w=window.open('','_blank');
    if(!w){alert('Please allow pop-ups to Review the report.');return;}
    w.document.write(res.j.html);w.document.close();
    if(typeof markHdfcPage15Reviewed==='function')markHdfcPage15Reviewed(0);
  }).catch(function(){
    if(btn){btn.disabled=false;btn.textContent='Review the report';}
    alert('Network error. Try Review the report again.');
  });
}
function submitPublicSurvey(){
  var sv=SV[0];if(!sv)return;
  if(!isHdfcLastPage()){
    alert('Please finish all 15 pages. Submit to HOD is only on page 15.');
    goHdfcTab('final');
    return;
  }
  if(!page13Filled(sv)){
    generatePublicReport(function(){submitPublicSurvey();});
    return;
  }
  var block=typeof hdfcPagesIncompleteMessage==='function'?hdfcPagesIncompleteMessage(sv):'';
  if(block){alert(block);return;}
  if(!(sv.company||'').trim()||!sv.clientId){alert('Pick HDFC client on heading 1.');SV_TAB='h1';render();return;}
  var name=String(sv.surveyedBy||(sv.hdfcForm&&sv.hdfcForm.surveyedBy)||el('pubName').value||'').trim();
  var email=String(sv.surveyorEmail||el('pubEmail').value||'').trim().toLowerCase();
  var wa=normWa(sv.surveyorWhatsApp||el('pubWa').value);
  if(!name){alert('Please type your name on the start screen.');return;}
  if(!email||email.indexOf('@')<0){alert('Email ID is required (start screen).');return;}
  if(wa.length<10){alert('WhatsApp Number is required (start screen).');return;}
  if(!confirm('All 15 pages are completed. Submit this HDFC survey to your branch HOD now?'))return;
  var btn=document.querySelector('.m-savebar .m-btn-green');
  if(btn){btn.disabled=true;btn.textContent='Submitting…';}
  var needGeo=!(sv.geoLat!=null&&sv.geoLng!=null);
  var geoReady=needGeo?capturePublicGeo():Promise.resolve(null);
  geoReady.then(function(geo){
    if(geo)applyGeoToSurvey(geo);
    return flushPublicAutoSave();
  }).then(function(){
    var payload={
      action:'submit',
      surveyId:sv.id||'',
      branchId:sv.branchId||BRANCH_ID,
      clientId:sv.clientId,
      surveyedBy:name,
      keepPhotos:PUB_PHOTOS_SYNCED,
      survey:{
        company:sv.company,locationName:sv.locationName,address:sv.address,
        surveyorEmail:email,surveyorWhatsApp:wa,startedAt:sv.startedAt||'',
        geoLat:sv.geoLat,geoLng:sv.geoLng,geoAccuracy:sv.geoAccuracy,geoCapturedAt:sv.geoCapturedAt||'',geoStatus:sv.geoStatus||'',
        hdfcForm:sv.hdfcForm,photos:PUB_PHOTOS_SYNCED?[]:(sv.photos||[]),scores:sv.scores||{},scoreNotes:sv.scoreNotes||{},
        siteObservations:sv.siteObservations||'',riskAnalysis:sv.riskAnalysis||'',
        executiveSummary:sv.executiveSummary||'',securityRecommendations:sv.securityRecommendations||'',
        hodSuggestions:sv.hodSuggestions||'',systemSuggestions:sv.systemSuggestions||''
      }
    };
    return fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});});
  }).then(function(res){
      if(!res)return;
      if(btn){btn.disabled=false;btn.textContent='Submit to HOD';}
      if(res.s!==200){alert(res.j.error||'Could not submit. Try again.');return;}
      el('formRoot').style.display='none';el('setupCard').style.display='none';
      el('okMsg').textContent=res.j.message||('Thank you! Submitted: '+(res.j.company||'')+' · '+(res.j.branchName||''));
      var hint=el('okTimeHint');
      if(hint){
        var bits=[];
        if(res.j.timeTaken)bits.push('Time taken for this assessment: '+res.j.timeTaken+'.');
        if(res.j.submittedAtLabel)bits.push('Submitted at '+res.j.submittedAtLabel+'.');
        if(res.j.geoLat!=null&&res.j.geoLng!=null)bits.push('Site GPS saved ('+Number(res.j.geoLat).toFixed(5)+', '+Number(res.j.geoLng).toFixed(5)+').');
        else if(res.j.geoStatus)bits.push('GPS: '+res.j.geoStatus+'.');
        if(res.j.clientGeo&&res.j.clientGeo.ok)bits.push('Coordinates also saved on client master.');
        bits.push('Your branch HOD will see this under Site Security Assessment (SSA) → HDFC SSA submitted List.');
        hint.textContent=bits.join(' ');
      }
      el('okCard').style.display='block';
      SV=[];SV_EDIT=-1;
      window.scrollTo(0,0);
    })
    .catch(function(){if(btn){btn.disabled=false;btn.textContent='Submit to HOD';}alert('Network error. Try again.');});
}
function loadClientsForBranch(bid){
  var sel=el('pubClient');
  sel.disabled=true;sel.innerHTML='<option value="">Loading…</option>';
  return fetch(API+'?clients=1&branchId='+encodeURIComponent(bid)).then(function(r){return r.json();}).then(function(j){
    CLIENTS=j.clients||[];
    sel.innerHTML='<option value="">— select HDFC unit —</option>';
    if(!CLIENTS.length){sel.innerHTML='<option value="">No HDFC units on this branch</option>';return;}
    CLIENTS.forEach(function(c){
      var o=document.createElement('option');o.value=c.id;o.textContent=c.name+(c.location?' — '+c.location:'');sel.appendChild(o);
    });
    sel.disabled=false;
  }).catch(function(){sel.innerHTML='<option value="">Could not load clients</option>';});
}
fetch(API+'?boot=1').then(function(r){return r.json();}).then(function(j){
  BRANCHES=j.branches||[];
  SURVEY_TPL=j.surveyTemplate||{parts:[]};
  var s=el('pubBranch');
  if(s){
    BRANCHES.forEach(function(b){var o=document.createElement('option');o.value=b.id;o.textContent=b.name;s.appendChild(o);});
    s.onchange=function(){
      var bid=s.value;
      if(!bid){
        el('pubClient').disabled=true;el('pubClient').innerHTML='<option value="">— pick branch first —</option>';CLIENTS=[];
        try{applySsaDirectory({operations:[],hods:[]});}catch(e){}
        return;
      }
      fetch(API+'?boot=1&branchId='+encodeURIComponent(bid)).then(function(r){return r.json();}).then(function(jj){
        try{applySsaDirectory(jj.ssaDirectory||{operations:[],hods:[]});OPS_TEAM=jj.opsTeam||OPS_TEAM;}catch(e){}
      }).catch(function(){});
      loadClientsForBranch(bid);
    };
  }
  try{applySsaDirectory({operations:[],hods:[]});}catch(e){}
  try{var g=el('hdfcAllGuide');if(g&&typeof hdfcAllProcessGuideHtml==='function')g.innerHTML=hdfcAllProcessGuideHtml();}catch(e){}
  if(el('pubSurveyDate')&&!el('pubSurveyDate').value)el('pubSurveyDate').value=today();
  fillPubDateTime();
  setInterval(fillPubDateTime,30000);
  var q=new URLSearchParams(location.search||'');
  var code=String(q.get('code')||q.get('resumeCode')||'').replace(/[^A-Za-z0-9]/g,'').toUpperCase();
  if(!code){try{code=String(localStorage.getItem('ssaResume')||'').replace(/[^A-Za-z0-9]/g,'').toUpperCase();}catch(e){code='';}}
  if(code&&el('pubResumeCode'))el('pubResumeCode').value=code;
  if(code&&q.get('code'))continuePublicByCode(code);
}).catch(function(){showSetupErr('Could not load branches. Refresh and try again.');});
document.addEventListener('visibilitychange',function(){
  if(document.visibilityState==='hidden')flushPublicAutoSave();
});
window.addEventListener('pagehide',function(){flushPublicAutoSave();});
</script>
</body></html>`
}
