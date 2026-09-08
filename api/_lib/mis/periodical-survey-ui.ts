/** Site Security Assessment (SSA) — Periodical Survey Format (MIS dual-portal, matched to Agile CRM). */

import { hdfcSsaBoardCss, hdfcSsaBoardSharedJs } from './hdfc-ssa-dashboard.js'
import { hdfcSurveyClientScript } from './periodical-survey-hdfc-ui.js'
import { ssaWhatWhereIntroHtml } from './ssa-brand.js'

export type PeriodicalSurveyPageOpts = {
  portal: 'mgmt' | 'staff'
  activePath: string
  title: string
}

export function periodicalSurveyCss(): string {
  return `
.score-btns{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px}
.score-btn{width:32px;height:32px;padding:0;border-radius:8px;border:1px solid #334155;background:#0a1220;color:#94a3b8;cursor:pointer;font-weight:700;font-size:12px}
.score-btn.on{background:#c9a84c;color:#1a1200;border-color:#c9a84c}
input[type="date"]{color-scheme:dark;min-height:44px}
input[type="date"]::-webkit-calendar-picker-indicator{opacity:1;filter:invert(1);width:20px;height:20px;cursor:pointer}
.fa-valid-row .m-inp{min-width:168px}
.survey-tabs{display:flex;gap:8px;margin:14px 0;flex-wrap:wrap}
.survey-tab{padding:8px 16px;border-radius:10px;border:1px solid #334155;cursor:pointer;font-weight:700;font-size:13px;color:#94a3b8;background:#0e1730}
.survey-tab.on{background:#c9a84c;color:#1a1200;border-color:#c9a84c}
.survey-cols{display:grid;grid-template-columns:1fr 300px;gap:16px;align-items:start}
@media(max-width:960px){.survey-cols{grid-template-columns:1fr}}
.photo-panel{background:#0e1730;border:1px solid #22304f;border-radius:10px;padding:12px}
.photo-thumb{width:100%;height:120px;object-fit:cover;border-radius:8px;display:block}
.photo-slot{margin-bottom:10px}
.risk-pill{display:inline-block;padding:6px 12px;border-radius:999px;font-weight:800;font-size:13px}
.lead-card{background:#0e1730;border:1px solid #22304f;border-radius:12px;padding:14px;margin-bottom:10px}
.lead-card.inact{opacity:.5}
.lc-name{color:#fff;font-weight:800;font-size:16px}
.lc-loc{color:#94a3b8;font-size:12px;margin-top:4px}
.interview-card{border:1px solid #22304f;border-radius:10px;padding:12px;margin-bottom:10px;background:#0b1220}
.mic-btn{margin-left:8px;padding:4px 10px;border-radius:8px;border:1px solid #334155;background:#1e3a8a;color:#fff;font-weight:700;cursor:pointer;font-size:12px}
#voiceBanner{display:none;background:#7c2d12;color:#fed7aa;padding:8px 12px;border-radius:8px;margin-bottom:10px;font-weight:700}
#svCamModal{position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:120;display:flex;align-items:center;justify-content:center;padding:16px}
#svCamModal.hidden{display:none!important}
#svCamBox{background:#0e1730;border:1px solid #c9a84c;border-radius:12px;padding:14px;max-width:520px;width:100%}
#svCamVideo{width:100%;border-radius:8px;background:#000;max-height:55vh;object-fit:cover}
.hdfc-slot{border:1px solid #22304f;border-radius:10px;padding:12px;margin-bottom:10px;background:#0b1220}
.hdfc-slot img{width:100%;max-height:180px;object-fit:cover;border-radius:8px;margin-top:8px;display:block}
#psIndustryModal{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:85;display:flex;align-items:center;justify-content:center;padding:16px}
#psIndustryModal.hidden{display:none!important}
#psIndustryBox{background:#111a30;border:1px solid #c9a84c;border-radius:12px;padding:18px;width:min(440px,100%);max-height:90vh;overflow:auto}
#psMailPanel{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:90;display:flex;align-items:center;justify-content:center;padding:16px}
#psMailPanel.hidden{display:none!important}
#psMailBox{background:#111a30;border:1px solid #c9a84c;border-radius:12px;padding:16px;max-width:640px;width:100%;max-height:90vh;overflow:auto}
.ssa-mode-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
@media(max-width:720px){.ssa-mode-row{grid-template-columns:1fr}}
.ssa-mode-btn{display:flex;flex-direction:column;align-items:flex-start;gap:6px;text-align:left;padding:16px 18px;border:none;border-radius:12px;cursor:pointer;font-weight:800;font-size:16px;line-height:1.35;min-height:88px}
.ssa-mode-btn span{font-size:13px;font-weight:600;opacity:.92}
.ssa-mode-btn.general{background:linear-gradient(135deg,#b45309,#f59e0b);color:#1a1200}
.ssa-mode-btn.hdfc{background:linear-gradient(135deg,#1e3a8a,#38bdf8);color:#fff}
.ssa-mode-btn.on{outline:3px solid #fff;outline-offset:2px}
.ssa-panel.hidden{display:none!important}
.ssa-link-box{background:#0b1220;border:1px solid #334155;border-radius:10px;padding:12px;margin-top:10px;word-break:break-all}
.ssa-preview-frame{width:100%;min-height:420px;border:1px solid #334155;border-radius:10px;background:#0b1220;margin-top:10px}
.ssa-track{display:grid;grid-template-columns:minmax(220px,1fr) 130px 130px;gap:12px;align-items:end;margin:12px 0 6px}
@media(max-width:720px){.ssa-track{grid-template-columns:1fr 1fr}}
@media(max-width:520px){.ssa-track{grid-template-columns:1fr}}
.ssa-track-count{background:#0b1220;border:1px solid #334155;border-radius:10px;padding:10px 12px;font-weight:800;font-size:20px;color:#fde68a;letter-spacing:.06em;text-align:center}
` + hdfcSsaBoardCss()
}

export function periodicalSurveyInnerHtml(opts: PeriodicalSurveyPageOpts): string {
  const branchPick =
    opts.portal === 'mgmt'
      ? '<div><label class="m-lbl">Branch</label><select class="m-inp" id="branchSel" onchange="onBranchChange()"></select></div>'
      : ''
  const note =
    opts.portal === 'staff'
      ? '<p class="hint">Choose <b>General</b> or <b>HDFC SSA</b> below. Fill and submit for your branch clients. Management reviews and shares the report.</p>'
      : '<p class="hint">Choose <b>General</b> or <b>HDFC SSA</b>. HOD submits; Management <b>Reviews</b>, <b>Reminds</b>, <b>Reopens</b>, and <b>Shares</b>.</p>'
  const generalAdd =
    opts.portal === 'staff'
      ? `<div style="margin-top:12px"><button type="button" class="m-btn m-btn-green" style="min-width:200px;min-height:48px;font-size:15px" onclick="addSurvey()">Start Assessment</button>
         <p class="hint" style="margin-top:8px">Desktop / tablet: tap <b>Start Assessment</b> to begin the General SSA (Industry → all form pages).</p></div>`
      : ''
  const hdfcAdd =
    opts.portal === 'staff'
      ? `<div style="margin-top:12px;display:flex;flex-direction:column;gap:8px;align-items:flex-start">
           <button type="button" class="m-btn m-btn-green" style="min-width:200px;min-height:48px;font-size:15px" onclick="addHdfcSurvey()">Start Assessment</button>
           <p class="hint" style="margin:0">Desktop / tablet: tap <b>Start Assessment</b> to fill HDFC SSA in this portal. Ops on phone use the public link below (Android &amp; iPhone).</p>
         </div>`
      : ''
  return `
<div class="m-wrap" id="psApp">
  <div id="ssaHomeBlock">
  ${ssaWhatWhereIntroHtml()}
  <div class="m-card">
    <h3>Periodical Site Security Assessment (SSA) Format</h3>
    ${note}
    <div class="fgrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:10px">
      ${branchPick}
    </div>
    <div class="ssa-mode-row">
      <button type="button" class="ssa-mode-btn general" id="btnSsaGeneral" onclick="setSsaMode('general')">Site Security Assessment (General)</button>
      <button type="button" class="ssa-mode-btn hdfc" id="btnSsaHdfc" onclick="setSsaMode('hdfc')">HDFC SSA</button>
    </div>
    <div class="m-kgrid" id="psKpis" style="margin-top:14px"></div>
    <p class="hint" id="psDraftHint" style="margin:8px 0 0">Phone HDFC saves show under <b>Not submitted (Draft)</b>. Tap <b>HDFC SSA</b> (blue) to open them.</p>
  </div>
  </div>
  <div id="ssaGeneralPanel" class="ssa-panel hidden">
    <div class="m-card">
      <h4 style="color:#fde68a;margin:0 0 8px">Site Security Assessment (General)</h4>
      <p class="hint" style="margin:0">Industry Type → Site Inputs → Risk Checklist → Professional Report → HOD suggestions → Final report → Send for approval.</p>
      ${generalAdd}
    </div>
    <div id="ssaGeneralList"></div>
  </div>
  <div id="ssaHdfcPanel" class="ssa-panel hidden">
    <div class="m-card">
      <h4 style="color:#7dd3fc;margin:0 0 8px">HDFC SSA</h4>
      <p class="hint" style="margin:0">Public link for ops on <b>mobile</b> (Android &amp; iPhone). Risk Analyst must complete <b>all 15 pages</b> (check and give answers), then Submit to HOD.</p>
      <div class="ssa-link-box">
        <div style="color:#94a3b8;font-size:12px;font-weight:700;margin-bottom:4px">HDFC SSA link (mobile)</div>
        <a id="hdfcSsaLink" href="https://www.agilegroup-digital.co.in/mis-hdfc-survey" target="_blank" rel="noopener" style="color:#fde68a;font-weight:700">https://www.agilegroup-digital.co.in/mis-hdfc-survey</a>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
          <button type="button" class="m-btn m-btn-navy" onclick="previewHdfcSsaLink()">Preview</button>
          <button type="button" class="m-btn m-btn-grey" onclick="copyHdfcSsaLink()">Copy link</button>
          <a class="m-btn m-btn-gold" href="https://www.agilegroup-digital.co.in/mis-hdfc-survey" target="_blank" rel="noopener">Open in new tab</a>
        </div>
      </div>
      <p class="hint" style="margin-top:14px">HDFC sees this State Dashboard — HOD does not send unit-by-unit as the HDFC delivery path. After Director Approval, Management builds one AI pack. HDFC opens one India link and picks the State.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <button type="button" class="m-btn m-btn-navy" onclick="openHdfcStateDashboard()">HDFC State Dashboard</button>
        ${opts.portal === 'mgmt' ? '<button type="button" class="m-btn m-btn-gold" onclick="refreshHdfcSsaAi()">Build / Refresh AI pack</button>' : ''}
        <button type="button" class="m-btn m-btn-grey" onclick="copyHdfcViewLink()">Copy HDFC view link</button>
      </div>
      <div id="hdfcSsaPreviewWrap" class="hidden">
        <iframe class="ssa-preview-frame" id="hdfcSsaPreview" title="HDFC SSA preview" src="about:blank"></iframe>
      </div>
      ${hdfcAdd}
    </div>
    <div id="ssaHdfcList"></div>
  </div>
  <div id="voiceBanner"></div>
  <div id="psContent"></div>
  <input type="file" id="svPhotoCam" accept="image/*" capture="environment" class="hidden" onchange="svPhotoFromInput(this)">
  <input type="file" id="svPhotoGallery" accept="image/*" class="hidden" onchange="svPhotoFromInput(this)">
</div>
<div id="psIndustryModal" class="hidden">
  <div id="psIndustryBox">
    <b style="color:#fde68a;font-size:16px">Select Industry Type</b>
    <p class="hint" style="margin-top:8px">Choose the industry for this Site Security Assessment (SSA) (same list as Agile CRM, plus Hospitality, Pharmaceutical, University Campus).</p>
    <label class="m-lbl">Industry Type *</label>
    <select class="m-inp" id="psIndustryPick" style="width:100%;margin-bottom:8px"></select>
    <div id="psIndustryOtherWrap" class="hidden">
      <label class="m-lbl">Other industry (specify)</label>
      <input class="m-inp" id="psIndustryOther" style="width:100%;margin-bottom:8px" placeholder="Type industry name">
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
      <button type="button" class="m-btn m-btn-gold" onclick="confirmAddSurveyIndustry()">Continue</button>
      <button type="button" class="m-btn m-btn-grey" onclick="closeIndustryModal()">Cancel</button>
    </div>
  </div>
</div>
<div id="svCamModal" class="hidden">
  <div id="svCamBox">
    <b style="color:#fde68a" id="svCamTitle">Take photo</b>
    <p class="hint" id="svCamHint" style="margin-top:6px"></p>
    <video id="svCamVideo" autoplay playsinline style="margin-top:10px"></video>
    <canvas id="svCamCanvas" class="hidden"></canvas>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
      <button type="button" class="m-btn m-btn-gold" onclick="svCamSnap()">Capture / Save</button>
      <button type="button" class="m-btn m-btn-navy" onclick="svCamFlip()">Flip camera (selfie)</button>
      <button type="button" class="m-btn m-btn-grey" onclick="svCamClose()">Close</button>
    </div>
  </div>
</div>
<div id="psMailPanel" class="hidden">
  <div id="psMailBox">
    <b style="color:#fde68a;font-size:16px" id="shareTitle">Share Site Security Assessment (SSA) by Email</b>
    <p class="hint" id="shareHint">Type the client email in TO. Attachments: colourful report + Site Inputs &amp; Photos + Risk Assessment. Surveyor and Director are copied.</p>
    <label class="m-lbl">TO (client email)</label><input class="m-inp" id="shareTo" placeholder="client@company.com" style="width:100%;margin-bottom:8px">
    <label class="m-lbl" id="shareCcLbl">CC (client emails / optional extra)</label><input class="m-inp" id="shareCc" placeholder="email1@…, email2@…" style="width:100%;margin-bottom:8px">
    <label class="m-lbl">Subject</label><input class="m-inp" id="shareSub" style="width:100%;margin-bottom:8px">
    <label class="m-lbl">Message</label><textarea class="m-inp" id="shareBody" rows="8" style="width:100%;margin-bottom:10px"></textarea>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button type="button" class="m-btn m-btn-green" id="shareSendBtn" onclick="sendShareMail()">📨 Send Email</button>
      <button type="button" class="m-btn m-btn-grey" onclick="closeShare()">Close</button>
    </div>
  </div>
</div>`
}

export function periodicalSurveyScript(opts: PeriodicalSurveyPageOpts): string {
  const apiUrl = opts.portal === 'mgmt' ? '/api/mis/admin-data' : '/api/mis/staff-data'
  const isStaff = opts.portal === 'staff'
  return hdfcSurveyClientScript() + hdfcSsaBoardSharedJs() + `
var API='${apiUrl}',IS_STAFF=${isStaff ? 'true' : 'false'},IS_MGMT=${isStaff ? 'false' : 'true'};
var SV=[],CLIENTS=[],BRANCHES=[],OPS_TEAM=[],SSA_DIR={operations:[],hods:[]},SURVEY_TPL={parts:[],contractStart:[],industries:[]},INDUSTRIES=[];
var SV_VIEW='list',SV_EDIT=-1,SV_TAB='inputs',SV_SHOW_INACT=false,SV_MODE='';
var BOARD_CACHE=null,BOARD_STATE='',BOARD_DISTRICT='',BOARD_BRANCH='',BOARD_SITE='',BOARD_JUMP='map',BOARD_Q='';
var SV_AUTO_T=null,SV_AUTO_BUSY=false,SV_AUTO_AGAIN=false,SV_AUTO_WAIT=[];
var HDFC_SSA_URL='https://www.agilegroup-digital.co.in/mis-hdfc-survey';
var BRANCH_ID='',STAFF_BRANCH_NAME='',SV_PHOTO_CTX={si:-1,type:'site_photo',slot:'',label:''},SV_CAM_STREAM=null,SV_CAM_FACING='environment',SV_MAX_PHOTOS=20;
var SV_FA_EDIT=-1,SHARE_MODE='share';
var VOICE_REC=null,VOICE_TARGET=null,SPEECH_OK=!!(window.SpeechRecognition||window.webkitSpeechRecognition);
var PHOTO_LABELS={site_photo:'Site Photo',deployment_chart:'Deployment Chart',perimeter:'Perimeter',entrance:'Entrance',cctv:'CCTV',other:'Other'};
var HDFC_PHOTO_SLOTS=[
  {id:'selfie',label:'Selfie (surveyor on site)',hint:'Take Photo — use Flip camera for selfie — then Capture / Save',facing:'user'},
  {id:'bank_front',label:'Photo 1 — Bank & ATM from front',hint:'Left, right side and above should be visible'},
  {id:'bank_approach',label:'Photo 2 — What is in front of the Bank & ATM',hint:'Approach / front view'},
  {id:'ac_outdoor',label:'Photo 3 — AC outdoor unit area',hint:''},
  {id:'sensitive',label:'Photo 4 — Any sensitive information area',hint:'Do not show customer data clearly if avoidable'}
];
var HDFC_DOC_SLOTS=[
  {id:'doc_attendance',label:'Document 1 — Attendance Register copy'},
  {id:'doc_hoto',label:'Document 2 — HOTO register copy'},
  {id:'doc_pvc',label:'Document 3 — PVC copies of 3/2 FA'},
  {id:'doc_close_open',label:'Document 4 — Closing and Opening register'}
];
var SHARE_SI=-1;
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function a(s){return h(s).replace(/"/g,'&quot;');}
function today(){return new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});}
function fmtDate(d){if(!d)return '—';try{var x=new Date(d+'T00:00:00');return x.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});}catch(e){return d;}}
function nid(p){return p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function api(action,extra){
  var payload=Object.assign({action:action},extra||{});
  if(IS_STAFF && typeof staffApi==='function'){
    return staffApi(action,extra||{}).then(function(res){return {s:res.status,j:res.body,status:res.status,body:res.body};});
  }
  return fetch(API,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(function(r){return r.json().then(function(j){return{s:r.status,j:j,status:r.status,body:j};});});
}
function branchId(){
  if(IS_STAFF)return BRANCH_ID||(typeof staffResolveBranchId==='function'?staffResolveBranchId():'');
  var sel=el('branchSel');
  return sel&&sel.value&&sel.value!=='ALL'?sel.value:'';
}
function svPartTotal(sv,part){if(!part||!part.items)return 0;return part.items.reduce(function(s,it){return s+(Number((sv.scores||{})[it.id])||0);},0);}
function svGrandTotal(sv){if(!SURVEY_TPL||!SURVEY_TPL.parts)return 0;return SURVEY_TPL.parts.reduce(function(s,p){return s+svPartTotal(sv,p);},0);}
function svRiskBand(t){if(t<=60)return {level:'Low',colour:'#22c55e'};if(t<=100)return {level:'Moderate',colour:'#f59e0b'};if(t<=140)return {level:'High',colour:'#f97316'};return {level:'Critical',colour:'#ef4444'};}
function svDefaultInterviews(){return [{personName:'',designation:'',notes:''},{personName:'',designation:'',notes:''},{personName:'',designation:'',notes:''}];}
function emptySurvey(){
  return {id:nid('ps'),clientId:'',branchId:branchId(),active:true,company:'',locationName:'',address:'',factoryManager:'',contactPhone:'',contactEmail:'',natureOfBusiness:'',industry:'',industryOther:'',surveyKind:'standard',hdfcForm:emptyHdfcForm(),surveyDate:today(),surveyedBy:'',surveyorEmail:'',confidentialAccess:'Director / Client / Branch HOD',periodLabel:'',previousSurveyDate:'',changesSinceLast:'',actualStrength:'',clientFeedback:'',siteInputs:{clientBrief:'',scopeOfWork:'',existingSecurity:'',proposedShifts:'',sanctionedStrength:'',criticalAssets:'',accessPoints:'',vulnerableAreas:'',clientExpectations:''},siteObservations:'',interviews:svDefaultInterviews(),photos:[],deploymentPlan:'',scores:{},scoreNotes:{},posts:[],execHelper:'',commonErrors:'',executiveSummary:'',riskAnalysis:'',manningSuggestion:'',uniformRequirements:'',equipmentSuggestions:'',securityRecommendations:'',recommendations:'',siteRequirements:'',contractStart:{},hodSuggestions:'',systemSuggestions:'',status:'Draft',hodApprovedAt:'',hodApprovedBy:'',forwardedForApprovalAt:'',forwardedForApprovalBy:'',sentToClientAt:'',sentToClientBy:'',sentToClientTo:'',sentToClientCc:'',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
}
function svEnsure(si){
  var sv=SV[si];if(!sv)return;
  if(!sv.siteInputs)sv.siteInputs={clientBrief:'',scopeOfWork:'',existingSecurity:'',proposedShifts:'',sanctionedStrength:'',criticalAssets:'',accessPoints:'',vulnerableAreas:'',clientExpectations:''};
  if(!sv.photos)sv.photos=[];
  if(!sv.interviews||sv.interviews.length<3)sv.interviews=svDefaultInterviews();
  if(!sv.scores)sv.scores={};
  if(!sv.scoreNotes)sv.scoreNotes={};
  if(!sv.contractStart)sv.contractStart={};
  if(sv.hodSuggestions==null)sv.hodSuggestions='';
  if(sv.systemSuggestions==null)sv.systemSuggestions='';
  if(sv.mgmtSuggestionsNote==null)sv.mgmtSuggestionsNote='';
  if(!sv.surveyKind)sv.surveyKind='standard';
  if(!sv.hdfcForm)sv.hdfcForm=emptyHdfcForm();
  var blank=emptyHdfcForm();
  Object.keys(blank).forEach(function(k){if(sv.hdfcForm[k]==null)sv.hdfcForm[k]='';});
}
function fillBranches(){
  var sel=el('branchSel');if(!sel)return;
  var cur=sel.value||'ALL';
  sel.innerHTML='<option value="ALL">All Branches</option>'+BRANCHES.map(function(b){return '<option value="'+a(b.id)+'">'+h(b.name)+'</option>';}).join('');
  sel.value=cur;
}
function onBranchChange(){
  var top=el('branchSel');
  var track=el('hdfcTrackBranch');
  if(top&&track)track.value=top.value||'ALL';
  SV_VIEW='list';SV_EDIT=-1;render();
}
function canEdit(sv){return IS_STAFF && (!sv || sv.status==='Draft' || (sv.surveyKind==='hdfc' && sv.status==='Completed'));}
function statusLabel(st){
  if(st==='Approved')return 'Director approved';
  if(st==='HodApproved')return 'HOD approved — awaiting Director Approval';
  if(st==='Completed')return 'Submitted — awaiting HOD Forward for Approval';
  return 'Draft — saved';
}
function mgmtStepLabel(sv){
  if(!sv)return '';
  if(sv.surveyKind==='hdfc'){
    if(sv.sentToClientAt)return 'Sent to client by HOD';
    if(sv.status==='Approved')return 'Director approved — HOD can Send to client';
    if(sv.status==='HodApproved'){
      if(sv.forwardedForApprovalAt)return 'Forwarded for approval — Review / Director Approval';
      return 'HOD approved — Review / Director Approval';
    }
    if(sv.status==='Completed')return 'Submitted — HOD to Review / Forward for Approval';
    return 'Draft — listed under HDFC SSA submitted List';
  }
  if(sv.status==='Approved')return 'Approved';
  if(sv.status==='Completed'&&sv.mgmtSuggestionsReviewedAt)return 'Review saved — ready for Approved';
  if(sv.status==='Completed')return 'Review — pending Save review';
  if(sv.status==='Draft')return 'Draft — Reminder to HOD if needed';
  return statusLabel(sv.status);
}
function industryList(){
  return INDUSTRIES.length?INDUSTRIES:(SURVEY_TPL.industries||[]);
}
function industryOptions(si){
  var list=industryList();
  var cur=SV[si].industry||'';
  return '<option value="">Select Industry Type</option>'+list.map(function(x){return '<option value="'+a(x)+'"'+(cur===x?' selected':'')+'>'+h(x)+'</option>';}).join('');
}
function onIndustryChange(si,val){
  SV[si].industry=val||'';
  if(val!=='Other')SV[si].industryOther='';
  if(val && val!=='Other')SV_TAB='checklist';
  render();
  scrollSsaForm();
}
function fillIndustryModal(){
  var sel=el('psIndustryPick');if(!sel)return;
  var list=industryList();
  sel.innerHTML='<option value="">Select Industry Type</option>'+list.map(function(x){return '<option value="'+a(x)+'">'+h(x)+'</option>';}).join('');
  sel.onchange=function(){
    var w=el('psIndustryOtherWrap');
    if(w){if(sel.value==='Other')w.classList.remove('hidden');else w.classList.add('hidden');}
    if(sel.value && sel.value!=='Other')confirmAddSurveyIndustry();
  };
  var ow=el('psIndustryOtherWrap');if(ow)ow.classList.add('hidden');
  var oi=el('psIndustryOther');if(oi)oi.value='';
}
function openIndustryModal(){
  fillIndustryModal();
  var m=el('psIndustryModal');if(m)m.classList.remove('hidden');
}
function closeIndustryModal(){
  var m=el('psIndustryModal');if(m)m.classList.add('hidden');
}
function confirmAddSurveyIndustry(){
  var sel=el('psIndustryPick');
  var ind=sel?sel.value:'';
  if(!ind){alert('Select Industry Type first.');return;}
  var other='';
  if(ind==='Other'){
    other=(el('psIndustryOther')&&el('psIndustryOther').value||'').trim();
    if(!other){alert('Specify the Other industry.');return;}
  }
  closeIndustryModal();
  startNewSurvey({surveyKind:'standard',industry:ind,industryOther:other});
}
function startNewSurvey(opts){
  opts=opts||{};
  var sv=emptySurvey();
  sv.surveyKind=opts.surveyKind||'standard';
  sv.industry=opts.industry||'';
  sv.industryOther=opts.industryOther||'';
  if(opts.natureOfBusiness)sv.natureOfBusiness=opts.natureOfBusiness;
  if(opts.company)sv.company=opts.company;
  if(opts.purposeHint)sv.siteInputs.clientBrief=opts.purposeHint;
  if(sv.surveyKind==='hdfc'){
    sv.hdfcForm=emptyHdfcForm();
    sv.hdfcForm.surveyDate=sv.surveyDate||today();
  }
  SV.push(sv);
  SV_EDIT=SV.length-1;SV_VIEW='edit';SV_TAB=sv.surveyKind==='hdfc'?'h1':'checklist';
  render();
  scrollSsaForm();
}
function addSurvey(){
  if(!IS_STAFF){alert('HOD / Staff submit Site Security Assessments (SSA). Management reviews them.');return;}
  setSsaMode('general');
  openIndustryModal();
}
function addHdfcSurvey(){
  if(!IS_STAFF){alert('HOD / Staff submit Site Security Assessments (SSA). Management reviews them.');return;}
  setSsaMode('hdfc');
  startNewSurvey({
    surveyKind:'hdfc',
    industry:'Banking',
    industryOther:'',
    natureOfBusiness:'Banking — HDFC',
    purposeHint:'HDFC Bank Site Security Assessment (SSA)'
  });
}
function setSsaMode(mode){
  SV_MODE=mode==='hdfc'?'hdfc':(mode==='general'?'general':'');
  if(SV_VIEW==='edit'||SV_VIEW==='board'){SV_VIEW='list';SV_EDIT=-1;}
  var g=el('btnSsaGeneral'),hbtn=el('btnSsaHdfc');
  if(g)g.classList.toggle('on',SV_MODE==='general');
  if(hbtn)hbtn.classList.toggle('on',SV_MODE==='hdfc');
  var gp=el('ssaGeneralPanel'),hp=el('ssaHdfcPanel');
  if(gp)gp.classList.toggle('hidden',SV_MODE!=='general');
  if(hp)hp.classList.toggle('hidden',SV_MODE!=='hdfc');
  render();
}
function previewHdfcSsaLink(){
  var wrap=el('hdfcSsaPreviewWrap'),fr=el('hdfcSsaPreview');
  if(!wrap||!fr)return;
  wrap.classList.remove('hidden');
  if(!fr.getAttribute('src')||fr.getAttribute('src')==='about:blank')fr.setAttribute('src',HDFC_SSA_URL);
  try{wrap.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){}
}
function copyHdfcSsaLink(){
  var url=HDFC_SSA_URL;
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(function(){alert('HDFC SSA link copied.');}).catch(function(){prompt('Copy this link:',url);});
  }else prompt('Copy this link:',url);
}
function copyText(url,okMsg){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(function(){alert(okMsg);}).catch(function(){prompt('Copy this link:',url);});
  }else prompt('Copy this link:',url);
}
function openHdfcStateDashboard(){
  SV_MODE='hdfc';
  SV_VIEW='board';
  BOARD_CACHE=null;
  BOARD_STATE='';
  BOARD_DISTRICT='';
  BOARD_BRANCH='';
  BOARD_SITE='';
  BOARD_JUMP='map';
  BOARD_Q='';
  var g=el('btnSsaGeneral'),hbtn=el('btnSsaHdfc');
  if(g)g.classList.toggle('on',false);
  if(hbtn)hbtn.classList.toggle('on',true);
  render();
}
function loadHdfcBoard(){
  var box=el('ssaHdfcList');
  api('hdfcSsaBoardBoot',{branchId:branchId()}).then(function(res){
    var s=res.s||res.status,j=res.j||res.body||{};
    if(s!==200||!j.ok){if(box)box.innerHTML='<div class="m-card"><p class="hint">'+(h(j.error)||'Could not open the dashboard.')+'</p></div>';return;}
    BOARD_CACHE=j;
    if(SV_VIEW==='board')render();
  }).catch(function(){if(box)box.innerHTML='<div class="m-card"><p class="hint">Could not open the dashboard.</p></div>';});
}
function refreshHdfcSsaAi(){
  if(!IS_MGMT){alert('Management builds the AI pack.');return;}
  if(!confirm('Build / Refresh the AI pack for all branches? Letters are stored once — the dashboard will not call AI every time it opens.'))return;
  api('hdfcSsaBoardRefreshAi',{}).then(function(res){
    var s=res.s||res.status,j=res.j||res.body||{};
    if(s!==200||!j.ok){alert(j.error||'AI pack failed.');return;}
    BOARD_CACHE=j;
    SV_VIEW='board';
    SV_MODE='hdfc';
    alert('AI pack saved. Open a branch card to read the letter.');
    render();
  });
}
function copyHdfcViewLink(){
  api('hdfcSsaBoardLink',{}).then(function(res){
    var j=res.j||res.body||{};
    if((res.s||res.status)!==200||!j.url){alert(j.error||'Could not make the HDFC view link.');return;}
    copyText(j.url,'HDFC view link copied. Send this one India link — they pick State, District, City and Branch from the map.');
  });
}
function boardUi(){return {state:BOARD_STATE,district:BOARD_DISTRICT,city:BOARD_BRANCH,site:BOARD_SITE,jump:BOARD_JUMP,q:BOARD_Q};}
function pickBoardState(name){BOARD_STATE=name||'';BOARD_DISTRICT='';BOARD_BRANCH='';BOARD_SITE='';BOARD_JUMP='map';render();}
function pickBoardDistrict(state,district){BOARD_STATE=state||BOARD_STATE;BOARD_DISTRICT=district||'';BOARD_BRANCH='';BOARD_SITE='';BOARD_JUMP='map';render();}
function pickBoardCity(state,key){
  BOARD_STATE=state||BOARD_STATE;BOARD_BRANCH=key||'';BOARD_SITE='';BOARD_JUMP='map';
  var hit=typeof ssaAllCities==='function'?ssaAllCities(BOARD_CACHE||{}).filter(function(x){return x.city.branchKey===key;})[0]:null;
  if(hit && hit.city.district) BOARD_DISTRICT=hit.city.district;
  render();
}
function pickBoardBranch(key){pickBoardCity(BOARD_STATE, BOARD_BRANCH===key?'':key);}
function pickBoardSite(id){
  if(!id){BOARD_SITE='';render();return;}
  var hit=typeof ssaAllSites==='function'?ssaAllSites(BOARD_CACHE||{}).filter(function(x){return x.site.id===id;})[0]:null;
  if(hit){BOARD_STATE=hit.state;BOARD_BRANCH=hit.city.branchKey;BOARD_DISTRICT=hit.site.district||hit.city.district||BOARD_DISTRICT;}
  BOARD_SITE=id;
  BOARD_JUMP='map';
  render();
}
function setBoardJump(mode){BOARD_JUMP=mode||'map';if(mode==='state'){BOARD_BRANCH='';BOARD_SITE='';BOARD_DISTRICT='';}render();}
function filterBoardQ(val){BOARD_Q=val||'';render();var box=el('ssaBoardQ');if(box){box.focus();var n=box.value.length;try{box.setSelectionRange(n,n);}catch(e){}}}
function openBoardSite(id){
  api('periodicalSurveyClientReport',{surveyId:id}).then(function(res){
    var j=res.j||res.body||{};
    if(!j.html){alert(j.error||'Report is not available.');return;}
    var w=window.open('','_blank');
    if(!w){alert('Allow pop-ups to read the site report.');return;}
    w.document.write(j.html);
    w.document.close();
  });
}
function clientsForBranch(){
  var bid=branchId();
  var list=CLIENTS.filter(function(c){return !bid||c.branchId===bid;});
  var sv=SV_EDIT>=0?SV[SV_EDIT]:null;
  if(sv&&sv.surveyKind==='hdfc'){
    var hdfc=list.filter(function(c){return isHdfcMasterClient(c);});
    if(hdfc.length)return hdfc;
  }
  return list;
}
function branchNameOf(id){
  var b=BRANCHES.find(function(x){return x.id===id;});
  if(b&&b.name)return b.name;
  if(typeof STAFF_BRANCH_NAME!=='undefined'&&STAFF_BRANCH_NAME&&(!id||id===STAFF_BRANCH_ID||id===BRANCH_ID))return STAFF_BRANCH_NAME;
  /* Never show raw ids like br5 on the list */
  return '—';
}
function pad2(n){n=Number(n)||0;return (n<10?'0':'')+String(n);}
function pad3(n){n=Number(n)||0;var s=String(n);while(s.length<3)s='0'+s;return s;}
function fmtDateTime(iso){
  if(!iso)return '—';
  try{
    var d=new Date(iso);
    if(isNaN(d.getTime()))return String(iso);
    return d.toLocaleString('en-IN',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true});
  }catch(e){return String(iso);}
}
function isHdfcMasterClient(c){
  if(!c)return false;
  return /hdfc/i.test(String(c.name||'')+' '+String(c.location||''));
}
function extractBrCode(text){
  var m=String(text||'').match(/Br\.?\s*Code\s*[:\s]*([0-9A-Za-z]+)/i);
  return m?m[1]:'';
}
function hdfcBranchCodeOf(sv){
  var f=sv.hdfcForm||{};
  if(String(f.solId||'').trim())return String(f.solId).trim();
  var fromLoc=extractBrCode(sv.locationName)||extractBrCode(sv.address)||extractBrCode(f.fullAddress);
  if(fromLoc)return fromLoc;
  var c=CLIENTS.find(function(x){return x.id===sv.clientId;});
  if(c)return extractBrCode(c.location)||extractBrCode(c.name)||'—';
  return '—';
}
function hdfcLocationOf(sv){
  var f=sv.hdfcForm||{};
  var loc=String(sv.locationName||f.fullAddress||sv.address||'').trim();
  if(loc)return loc.replace(/\s*\|\s*Br\.?\s*Code[^|]*/i,'').trim()||loc;
  var c=CLIENTS.find(function(x){return x.id===sv.clientId;});
  if(c&&c.location)return String(c.location).replace(/\s*\|\s*Br\.?\s*Code[^|]*/i,'').trim();
  return '—';
}
function hdfcSubmittedByOf(sv){
  return String(sv.surveyedBy||sv.submittedBy||sv.hdfcForm&&sv.hdfcForm.surveyedBy||'—').trim()||'—';
}
function hdfcSubmittedAtOf(sv){
  return sv.submittedAt||sv.updatedAt||sv.createdAt||(sv.surveyDate?sv.surveyDate+'T00:00:00':'');
}
/** Submitted (non-draft) HDFC SSA vs active HDFC sites on that branch. */
function hdfcProgressParts(branchId){
  var bid=String(branchId||'').trim();
  if(bid==='ALL')bid='';
  var total=(CLIENTS||[]).filter(function(c){
    if(c.active===false)return false;
    if(bid&&c.branchId!==bid)return false;
    return isHdfcMasterClient(c);
  }).length;
  var doneIds={};
  (SV||[]).forEach(function(s){
    if(s.surveyKind!=='hdfc'||s.active===false)return;
    if(bid&&s.branchId!==bid)return;
    if(s.status==='Draft')return;
    var key=String(s.clientId||'')||(String(s.company||'').toUpperCase()+'|'+String(s.locationName||'').toUpperCase());
    if(key)doneIds[key]=true;
  });
  var done=Object.keys(doneIds).length;
  if(!total&&done)total=done;
  return {done:done,total:total,label:pad2(done)+'/'+pad2(total),track:pad3(done)+'/'+pad3(total)};
}
function hdfcBranchProgress(branchId){
  return hdfcProgressParts(branchId).label;
}
function hdfcTrackOptionLabel(name, parts){
  var d=parts&&parts.done!=null?pad3(parts.done):'000';
  var t=parts&&parts.total!=null?pad3(parts.total):'000';
  return String(name||'Branch')+' — Submitted '+d+' / Total HDFC '+t;
}
function fillHdfcTrack(){
  var sel=el('hdfcTrackBranch');
  if(!sel)return;
  var cur=branchId()||'ALL';
  if(IS_STAFF){
    var id=BRANCH_ID||cur;
    var name=STAFF_BRANCH_NAME||branchNameOf(id);
    var p=hdfcProgressParts(id);
    sel.innerHTML='<option value="'+a(id)+'">'+h(hdfcTrackOptionLabel(name,p))+'</option>';
    sel.value=id;
    sel.disabled=true;
  }else{
    var all=hdfcProgressParts('');
    var html='<option value="ALL">'+h(hdfcTrackOptionLabel('All Branches',all))+'</option>';
    (BRANCHES||[]).forEach(function(b){
      html+='<option value="'+a(b.id)+'">'+h(hdfcTrackOptionLabel(b.name,hdfcProgressParts(b.id)))+'</option>';
    });
    sel.innerHTML=html;
    sel.value=cur||'ALL';
    sel.disabled=false;
  }
  var parts=hdfcProgressParts(IS_STAFF?(BRANCH_ID||cur):cur);
  var sub=el('hdfcTrackSubmitted');
  var tot=el('hdfcTrackTotal');
  if(sub)sub.textContent=pad3(parts.done);
  if(tot)tot.textContent=pad3(parts.total);
}
function onHdfcTrackBranch(){
  var t=el('hdfcTrackBranch');
  var top=el('branchSel');
  if(t&&top)top.value=t.value||'ALL';
  SV_VIEW='list';SV_EDIT=-1;render();
}
function hdfcTrackBarHtml(){
  return '<div class="ssa-track" id="hdfcTrackBar"><div><label class="m-lbl">Branch Name</label><select class="m-inp" id="hdfcTrackBranch" onchange="onHdfcTrackBranch()"></select></div><div><label class="m-lbl">Submitted</label><div class="ssa-track-count" id="hdfcTrackSubmitted">000</div></div><div><label class="m-lbl">Total HDFC</label><div class="ssa-track-count" id="hdfcTrackTotal">000</div></div></div>';
}
function applySurvey(sv){
  if(!sv||!sv.id)return;
  var i=SV.findIndex(function(x){return x.id===sv.id;});
  if(i>=0)SV[i]=sv; else SV.unshift(sv);
}
function pickClient(si,id){
  var c=CLIENTS.find(function(x){return x.id===id;});
  if(!c){SV[si].clientId='';return;}
  SV[si].clientId=c.id;
  SV[si].branchId=c.branchId||SV[si].branchId;
  SV[si].company=c.name||'';
  SV[si].locationName=c.location||'';
  if(c.staffName)SV[si].factoryManager=c.staffName;
  if(c.sanctionedStrength)SV[si].siteInputs.sanctionedStrength=c.sanctionedStrength;
  if(SV[si].surveyKind==='hdfc'){
    if(!SV[si].hdfcForm)SV[si].hdfcForm=emptyHdfcForm();
    var f=SV[si].hdfcForm;
    f.branchName=c.name||f.branchName||'';
    f.fullAddress=(c.location||'')||f.fullAddress||'';
    if(c.staffName)f.managerName=c.staffName;
    if(c.sanctionedStrength)f.sanctionedGuards=String(c.sanctionedStrength);
    if(!f.surveyDate)f.surveyDate=SV[si].surveyDate||today();
  }
  render();
  if(SV[si].surveyKind==='hdfc'&&typeof scheduleHdfcAutoSave==='function')scheduleHdfcAutoSave();
}
function voiceShow(msg){var b=el('voiceBanner');if(!b)return;if(msg){b.textContent=msg;b.style.display='block';}else b.style.display='none';}
function voiceStop(){if(VOICE_REC){try{VOICE_REC.stop();}catch(e){}VOICE_REC=null;}VOICE_TARGET=null;voiceShow('');}
function voiceStart(target){
  if(!SPEECH_OK){alert('Speak works in Google Chrome on your phone.');return;}
  voiceStop();
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  VOICE_REC=new SR();VOICE_REC.lang='en-IN';VOICE_REC.interimResults=false;VOICE_REC.continuous=true;VOICE_TARGET=target;
  voiceShow('Listening — speak interview notes. Tap Stop when finished.');
  VOICE_REC.onresult=function(ev){
    if(!VOICE_TARGET)return;
    var txt='';
    for(var i=ev.resultIndex;i<ev.results.length;i++){if(ev.results[i].isFinal)txt+=ev.results[i][0].transcript;}
    txt=txt.trim();if(!txt)return;
    var cur=VOICE_TARGET.value||'';
    VOICE_TARGET.value=(cur?cur+' ':'')+txt;
    VOICE_TARGET.dispatchEvent(new Event('input',{bubbles:true}));
  };
  VOICE_REC.onerror=function(e){voiceStop();if(e.error!=='aborted')alert('Could not hear you — move closer to the phone mic.');};
  VOICE_REC.onend=function(){voiceStop();};
  try{VOICE_REC.start();}catch(err){voiceStop();alert('Allow microphone permission, then try Speak again.');}
}
function voiceInterview(si,idx){var ta=el('svInt'+si+'_'+idx);if(!ta){alert('Interview box not found — refresh page.');return;}voiceStart(ta);}
function svActivePhotoCount(si){svEnsure(si);return (SV[si].photos||[]).filter(function(p){return p.active!==false;}).length;}
function svFindSlotIndex(si,slot){
  var photos=SV[si].photos||[];
  for(var i=0;i<photos.length;i++){if(photos[i]&&photos[i].heading===slot)return i;}
  return -1;
}
function svLooksLikeImage(file){if(!file)return false;if(file.type&&file.type.indexOf('image')===0)return true;return/\\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name||'');}
function svAddPhotoData(dataUrl,si,type,slot,label){
  if(si<0||!SV[si])return;
  if(!dataUrl||String(dataUrl).indexOf('data:image/')!==0){alert('Could not save photo — try again or use Gallery.');return;}
  svEnsure(si);
  var lab=label||PHOTO_LABELS[type]||'Site Photo';
  if(slot){
    var ix=svFindSlotIndex(si,slot);
    var row={id:ix>=0?SV[si].photos[ix].id:nid('ph'),type:type||'other',label:lab,heading:slot,caption:lab,dataUrl:dataUrl,takenAt:new Date().toISOString(),active:true};
    if(ix>=0)SV[si].photos[ix]=row;else{
      if(svActivePhotoCount(si)>=SV_MAX_PHOTOS){alert('Maximum '+SV_MAX_PHOTOS+' photos / documents.');return;}
      SV[si].photos.push(row);
    }
  }else{
    if(svActivePhotoCount(si)>=SV_MAX_PHOTOS){alert('Maximum '+SV_MAX_PHOTOS+' photos.');return;}
    SV[si].photos.push({id:nid('ph'),type:type||'site_photo',label:lab,heading:'',caption:'',dataUrl:dataUrl,takenAt:new Date().toISOString(),active:true});
  }
  render();
  if(SV[si].surveyKind==='hdfc'&&typeof scheduleHdfcAutoSave==='function')scheduleHdfcAutoSave();
}
function svCompressPhoto(file,cb){
  if(!svLooksLikeImage(file)){alert('Please choose a photo (JPG or PNG).');return;}
  var r=new FileReader();
  r.onerror=function(){alert('Could not read photo — try Choose from Gallery.');};
  r.onload=function(e){
    var dataUrl=e.target.result,img=new Image();
    img.onerror=function(){if(dataUrl&&String(dataUrl).indexOf('data:image/')===0){cb(dataUrl);return;}alert('Photo format not supported.');};
    img.onload=function(){
      var c=document.createElement('canvas'),w=img.width,h=img.height,mx=1200;
      if(w>mx){h=Math.round(h*mx/w);w=mx;}
      c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);
      cb(c.toDataURL('image/jpeg',0.72));
    };
    img.src=dataUrl;
  };
  r.readAsDataURL(file);
}
function svPhotoBtn(si,type,mode,slot,label,facing){
  if(si<0||!SV[si]||!canEdit(SV[si])){alert('This survey is locked. Reopen as Draft to add photos.');return;}
  if(!slot&&svActivePhotoCount(si)>=SV_MAX_PHOTOS){alert('Maximum '+SV_MAX_PHOTOS+' photos.');return;}
  SV_PHOTO_CTX={si:si,type:type||'other',slot:slot||'',label:label||''};
  if(facing==='user'||facing==='environment')SV_CAM_FACING=facing;
  if(mode==='cam'){
    if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){svCamOpen();return;}
    var inp=el('svPhotoCam');if(inp){inp.value='';inp.click();return;}
    alert('Camera not available — use Gallery.');return;
  }
  var gal=el('svPhotoGallery');if(gal){gal.value='';gal.click();return;}
  alert('Gallery not available on this phone.');
}
function svPhotoFromInput(inp){
  if(!inp||!inp.files||!inp.files[0])return;
  var si=SV_PHOTO_CTX.si,type=SV_PHOTO_CTX.type||'other',slot=SV_PHOTO_CTX.slot||'',label=SV_PHOTO_CTX.label||'';
  if(si<0||!SV[si])return;
  var f=inp.files[0];inp.value='';
  if(f.size>15000000){alert('Photo too large (max 15 MB).');return;}
  voiceShow('Processing photo…');
  svCompressPhoto(f,function(dataUrl){voiceShow('');svAddPhotoData(dataUrl,si,type,slot,label);});
}
function svCamOpen(){
  var modal=el('svCamModal'),video=el('svCamVideo'),title=el('svCamTitle'),hint=el('svCamHint');
  if(!modal||!video){var inp=el('svPhotoCam');if(inp){inp.value='';inp.click();}return;}
  if(SV_CAM_STREAM){SV_CAM_STREAM.getTracks().forEach(function(t){t.stop();});SV_CAM_STREAM=null;}
  video.srcObject=null;modal.classList.remove('hidden');
  if(title)title.textContent=SV_PHOTO_CTX.label||'Take photo';
  if(hint)hint.textContent=SV_CAM_FACING==='user'?'Front camera (selfie) — tap Flip for back camera.':'Back camera — tap Flip for selfie.';
  voiceShow('Opening camera…');
  var constraints={video:{facingMode:{ideal:SV_CAM_FACING},width:{ideal:1280},height:{ideal:720}},audio:false};
  navigator.mediaDevices.getUserMedia(constraints).then(function(stream){
    SV_CAM_STREAM=stream;video.srcObject=stream;
    var p=video.play();if(p&&p.catch)p.catch(function(){});
    voiceShow('');
  }).catch(function(){
    voiceShow('');
    navigator.mediaDevices.getUserMedia({video:true,audio:false}).then(function(stream){
      SV_CAM_STREAM=stream;video.srcObject=stream;video.play().catch(function(){});voiceShow('');
    }).catch(function(){
      svCamClose();
      var inp=el('svPhotoCam');if(inp){inp.value='';inp.click();}else alert('Could not open camera. Allow camera permission, or use Gallery.');
    });
  });
}
function svCamFlip(){
  SV_CAM_FACING=SV_CAM_FACING==='user'?'environment':'user';
  svCamOpen();
}
function svCamClose(){
  var modal=el('svCamModal'),video=el('svCamVideo');
  if(SV_CAM_STREAM){SV_CAM_STREAM.getTracks().forEach(function(t){t.stop();});SV_CAM_STREAM=null;}
  if(video)video.srcObject=null;if(modal)modal.classList.add('hidden');voiceShow('');
}
function svCamSnap(){
  var video=el('svCamVideo'),canvas=el('svCamCanvas');
  if(!video||!canvas){alert('Camera not ready.');return;}
  if(!video.videoWidth){alert('Camera not ready — wait one second, then tap Capture / Save again.');return;}
  var w=video.videoWidth,h=video.videoHeight,mx=1200;
  if(w>mx){h=Math.round(h*mx/w);w=mx;}
  canvas.width=w;canvas.height=h;canvas.getContext('2d').drawImage(video,0,0,w,h);
  var dataUrl=canvas.toDataURL('image/jpeg',0.78);
  var ctx={si:SV_PHOTO_CTX.si,type:SV_PHOTO_CTX.type||'other',slot:SV_PHOTO_CTX.slot||'',label:SV_PHOTO_CTX.label||''};
  svCamClose();
  svAddPhotoData(dataUrl,ctx.si,ctx.type,ctx.slot,ctx.label);
}
function svPhotoPickBtn(si,type,text,cls,mode,slot,label,facing){
  var safe=String(label||'').replace(/\\\\/g,'').replace(/'/g,'');
  return '<button type="button" class="m-btn '+cls+'" onclick="svPhotoBtn('+si+',\\''+type+'\\',\\''+mode+'\\',\\''+(slot||'')+'\\',\\''+safe+'\\',\\''+(facing||'')+'\\')">'+text+'</button>';
}
function svRemovePhoto(si,pi){if(!SV[si]||!SV[si].photos||!canEdit(SV[si]))return;if(!confirm('Delete this photo permanently?'))return;SV[si].photos.splice(pi,1);render();if(SV[si].surveyKind==='hdfc'&&typeof scheduleHdfcAutoSave==='function')scheduleHdfcAutoSave();}
function svTogglePhoto(si,pi){if(!canEdit(SV[si]))return;if(!SV[si]||!SV[si].photos||!SV[si].photos[pi])return;SV[si].photos[pi].active=SV[si].photos[pi].active===false;render();if(SV[si].surveyKind==='hdfc'&&typeof scheduleHdfcAutoSave==='function')scheduleHdfcAutoSave();}
function svSlotThumb(si,slot){
  var ix=svFindSlotIndex(si,slot);if(ix<0)return '';
  var p=SV[si].photos[ix];if(!p||!p.dataUrl)return '';
  var lock=!canEdit(SV[si]);
  var del=lock?'':'<button type="button" class="m-btn m-btn-grey" onclick="svRemoveSlotPhoto('+si+',\\''+slot+'\\')">Delete</button>';
  return '<img src="'+p.dataUrl+'" alt="'+a(p.label||slot)+'"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:6px"><span style="font-size:11px;color:#86efac">Saved</span>'+del+'</div>';
}
function renderHdfcPhotosDocs(si){
  svEnsure(si);var lock=!canEdit(SV[si]);
  var html=(typeof hdfcProcessGuideHtml==='function'?hdfcProcessGuideHtml('photos'):'')+
    '<div class="m-card"><b style="color:#fde68a;font-size:16px">14. Site Photos &amp; Documents</b>';
  html+='<p class="hint" style="margin-top:8px">Use <b>Take Photo</b> (Flip camera for selfie) then <b>Capture / Save</b>. Or use Gallery. Documents: photograph the register page.</p></div>';
  HDFC_PHOTO_SLOTS.forEach(function(slot){
    html+='<div class="hdfc-slot"><b style="color:#e2e8f0">'+h(slot.label)+'</b>';
    if(slot.hint)html+='<div class="hint" style="margin-top:4px">'+h(slot.hint)+'</div>';
    html+=svSlotThumb(si,slot.id);
    if(!lock)html+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">'+svPhotoPickBtn(si,'other','Take Photo','m-btn-gold','cam',slot.id,slot.label,slot.facing||'environment')+svPhotoPickBtn(si,'other','Gallery','m-btn-navy','gallery',slot.id,slot.label,'')+'</div>';
    html+='</div>';
  });
  html+='<div class="hdfc-slot"><b style="color:#e2e8f0">Add Photo</b><div class="hint" style="margin-top:4px">Extra site photo if needed</div>';
  if(!lock)html+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">'+svPhotoPickBtn(si,'site_photo','Take Photo','m-btn-gold','cam','','Extra site photo','environment')+svPhotoPickBtn(si,'site_photo','Gallery','m-btn-navy','gallery','','Extra site photo','')+'</div>';
  html+='</div>';
  html+='<div class="m-card" style="margin-top:12px"><b style="color:#fde68a">Documents</b><p class="hint" style="margin-top:6px">Photograph each register / PVC copy clearly.</p></div>';
  HDFC_DOC_SLOTS.forEach(function(slot){
    html+='<div class="hdfc-slot"><b style="color:#e2e8f0">'+h(slot.label)+'</b>';
    html+=svSlotThumb(si,slot.id);
    if(!lock)html+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">'+svPhotoPickBtn(si,'other','Take Photo','m-btn-gold','cam',slot.id,slot.label,'environment')+svPhotoPickBtn(si,'other','Gallery / Files','m-btn-navy','gallery',slot.id,slot.label,'')+'</div>';
    html+='</div>';
  });
  return html;
}
function renderPhotoPanel(si){
  svEnsure(si);var photos=SV[si].photos||[],activeN=svActivePhotoCount(si),lock=!canEdit(SV[si]);
  var html='<div class="photo-panel"><h4 style="color:#fde68a;margin:0 0 8px">Site Photos <span style="color:#94a3b8;font-weight:400">('+activeN+'/'+SV_MAX_PHOTOS+')</span></h4>';
  if(!lock){
    html+='<div class="photo-slot">'+svPhotoPickBtn(si,'site_photo','Take Photo','m-btn-gold','cam','','Site Photo','environment')+'</div>';
    html+='<div class="photo-slot">'+svPhotoPickBtn(si,'site_photo','Choose from Gallery','m-btn-navy','gallery','','Site Photo','')+'</div>';
    html+='<div class="photo-slot">'+svPhotoPickBtn(si,'deployment_chart','Upload Deployment Chart','m-btn-navy','gallery','','Deployment Chart','')+'</div>';
  }
  if(photos.length){
    photos.forEach(function(p,pi){
      var off=p.active===false,cat=p.label||PHOTO_LABELS[p.type]||p.type||'Photo';
      html+='<div class="photo-slot'+(off?' style="opacity:.45"':'')+'"><img class="photo-thumb" src="'+p.dataUrl+'" alt=""><div style="font-size:11px;color:#94a3b8;margin-top:4px">'+h(cat)+(p.heading&&p.heading!==cat?' · '+h(p.heading):'')+'</div>';
      if(!lock)html+='<div style="display:flex;gap:6px;margin-top:6px"><button type="button" class="m-btn m-btn-grey" onclick="svTogglePhoto('+si+','+pi+')">'+(off?'Restore':'Hide')+'</button><button type="button" class="m-btn m-btn-grey" onclick="svRemovePhoto('+si+','+pi+')">Delete</button></div>';
      html+='</div>';
    });
  }else html+='<div style="font-size:12px;color:#94a3b8">No photos yet — tap Take Photo (max '+SV_MAX_PHOTOS+').</div>';
  html+='</div>';
  return html;
}
function clientOptions(si){
  var list=clientsForBranch();
  var hdfc=SV[si]&&SV[si].surveyKind==='hdfc';
  return '<option value="">'+(hdfc?'Select HDFC client from Master Directory':'Select client from Master Directory')+'</option>'+list.map(function(c){return '<option value="'+a(c.id)+'"'+(SV[si].clientId===c.id?' selected':'')+'>'+h(c.name)+(c.location?' — '+h(c.location):'')+'</option>';}).join('');
}
function renderEdit(si){
  var sv=SV[si];if(!sv)return '<div class="m-card">Survey not found.</div>';
  svEnsure(si);
  var lock=!canEdit(sv);
  var total=svGrandTotal(sv),band=svRiskBand(total),parts=SURVEY_TPL&&SURVEY_TPL.parts?SURVEY_TPL.parts:[];
  var isHdfc=sv.surveyKind==='hdfc';
  if(isHdfc && (SV_TAB==='inputs'||!SV_TAB))SV_TAB='h1';
  var html='<div class="m-card"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;align-items:center"><div><b style="color:#fff;font-size:18px">'+h(sv.company||(isHdfc?'(New HDFC Survey)':'(New Survey)'))+'</b><div style="font-size:12px;color:#94a3b8;margin-top:4px">'+h(branchNameOf(sv.branchId))+' · '+(isHdfc?'HDFC survey · ':'')+h(sv.industry||'Industry TBD')+' · '+h(isHdfc?hdfcStatusLabel(sv.status,sv):statusLabel(sv.status))+(lock?' · View only':'')+'</div></div><span class="risk-pill" style="background:'+band.colour+'22;color:'+band.colour+';border:1px solid '+band.colour+'">Score '+total+'/180 · '+band.level+'</span></div>';
  if(isHdfc){
    html+='<p class="hint" style="margin-top:10px">HDFC format — 15 headings. Prefer Yes/No. All <b>15 pages auto-save</b>. List buttons: <b>Review</b> → <b>Edit</b> → <b>Forward for Approval</b> → Management <b>Director Approval</b>. Ops submit via public link; HOD does not “Send to HOD”.</p>';
    if(IS_MGMT)html+='<div class="survey-tabs"><div class="survey-tab '+(SV_TAB==='mgmt1'?'on':'')+'" onclick="SV_TAB=\\'mgmt1\\';render()">Review</div></div>';
    html+=renderHdfcNav(si);
    if(SV_TAB==='mgmt1'&&IS_MGMT){
      html+='<p class="hint">HDFC Management Review — then tap <b>Director Approval</b> so HOD can Send to client.</p>';
      html+=renderHdfcFinalSummary(si);
      html+='<label class="m-lbl">HOD\\'s suggestions</label><div class="m-card" style="white-space:pre-wrap;color:#fde68a;font-size:13px">'+(h(sv.hodSuggestions)||'—')+'</div>';
      html+='<label class="m-lbl">System / AI suggestion</label><div class="m-card" style="white-space:pre-wrap;color:#86efac;font-size:13px">'+(h(sv.systemSuggestions)||'—')+'</div>';
      html+='<label class="m-lbl">Management review notes</label><textarea class="m-inp" rows="4" id="mgmtSugNote" oninput="SV['+si+'].mgmtSuggestionsNote=this.value">'+h(sv.mgmtSuggestionsNote||'')+'</textarea>';
      if(sv.hodApprovedAt)html+='<p class="hint" style="color:#86efac;margin-top:8px">HOD approved — '+h(sv.hodApprovedBy||'')+' · '+h(String(sv.hodApprovedAt).replace('T',' ').slice(0,16))+'</p>';
      if(sv.forwardedForApprovalAt)html+='<p class="hint" style="color:#7dd3fc;margin-top:8px">Forwarded for approval — '+h(sv.forwardedForApprovalBy||'')+' · '+h(String(sv.forwardedForApprovalAt).replace('T',' ').slice(0,16))+'</p>';
      if(sv.status==='Approved')html+='<p class="hint" style="color:#86efac;margin-top:8px">Director approved — '+h(sv.approvedBy||'')+'</p>';
      if(sv.status==='Draft')html+='<p class="hint" style="color:#fca5a5;margin-top:8px">Still Draft — ask HOD to <b>Review / Edit</b> then <b>Forward for Approval</b>.</p>';
      if(sv.status==='Completed' && !sv.forwardedForApprovalAt)html+='<p class="hint" style="color:#fde68a;margin-top:8px">Submitted — waiting HOD <b>Forward for Approval</b>.</p>';
      html+='<div class="m-savebar" style="margin-top:14px;justify-content:flex-start">';
      if(sv.status==='HodApproved'||(sv.status==='Completed'&&sv.forwardedForApprovalAt))html+='<button type="button" class="m-btn m-btn-green" style="font-size:16px;padding:12px 18px" onclick="approveSurvey('+si+')">Director Approval</button>';
      if(sv.status!=='Draft')html+='<button type="button" class="m-btn m-btn-grey" onclick="reopenSurvey('+si+')">Reopen</button>';
      html+='<button type="button" class="m-btn m-btn-navy" onclick="openPhotosPreview('+si+')">Photos Preview</button>';
      html+='</div>';
      html+='</div>'+renderHdfcFooter(si);
      return html;
    }
    if(/^h(1[01]|[1-9])$/.test(SV_TAB)){
      html+=renderHdfcPage(si);
    }else if(SV_TAB==='checklist'){
      html+=typeof renderHdfcChecklist==='function'?renderHdfcChecklist(si):'';
    }else if(SV_TAB==='report'){
      html+=typeof hdfcProcessGuideHtml==='function'?hdfcProcessGuideHtml('report'):'';
      html+='<p class="hint"><b>13. Professional assessment</b> — write or generate the report. Photos are on heading 14.</p>';
      html+='<div style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap">';
      if(!lock)html+='<button type="button" class="m-btn m-btn-gold" onclick="generateSurveyAi('+si+')">Generate Professional Report</button>';
      html+='<button type="button" class="m-btn m-btn-navy" onclick="openClientReport('+si+')">Client Report (Print / PDF)</button></div>';
      html+='<label class="m-lbl">Scientific Risk Analysis</label><textarea class="m-inp" rows="5" oninput="SV['+si+'].riskAnalysis=this.value;scheduleHdfcAutoSave()">'+h(sv.riskAnalysis)+'</textarea>';
      html+='<label class="m-lbl">Executive Summary</label><textarea class="m-inp" rows="5" oninput="SV['+si+'].executiveSummary=this.value;scheduleHdfcAutoSave()">'+h(sv.executiveSummary)+'</textarea>';
      html+='<label class="m-lbl">Security Professional Recommendations</label><textarea class="m-inp" rows="5" oninput="SV['+si+'].securityRecommendations=this.value;scheduleHdfcAutoSave()">'+h(sv.securityRecommendations)+'</textarea>';
      html+='<label class="m-lbl" style="margin-top:10px">Site observations</label><textarea class="m-inp" rows="4" oninput="SV['+si+'].siteObservations=this.value;scheduleHdfcAutoSave()">'+h(sv.siteObservations)+'</textarea>';
    }else if(SV_TAB==='photos'){
      html+=renderHdfcPhotosDocs(si);
    }else if(SV_TAB==='hod'){
      SV_TAB='final';
    }
    if(SV_TAB==='final'){
      html+=typeof hdfcProcessGuideHtml==='function'?hdfcProcessGuideHtml('final'):'';
      html+='<p class="hint"><b>15. Final Report with suggestions</b> — includes HOD &amp; AI assessment.</p>';
      html+=renderHdfcFinalSummary(si);
      html+='<label class="m-lbl">HOD\\'s suggestions</label><textarea class="m-inp" rows="6" oninput="SV['+si+'].hodSuggestions=this.value;scheduleHdfcAutoSave()">'+h(sv.hodSuggestions||'')+'</textarea>';
      if(!lock)html+='<div style="margin:12px 0"><button type="button" class="m-btn m-btn-gold" onclick="generateSystemSuggestion('+si+')">Generate system / AI suggestion</button></div>';
      html+='<label class="m-lbl">System / AI suggestion</label><textarea class="m-inp" rows="6" oninput="SV['+si+'].systemSuggestions=this.value;scheduleHdfcAutoSave()">'+h(sv.systemSuggestions||'')+'</textarea>';
      html+='<label class="m-lbl">Executive Summary</label><div class="m-card" style="white-space:pre-wrap;color:#cbd5e1;font-size:13px">'+(h(sv.executiveSummary)||'—')+'</div>';
      html+='<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">';
      if(IS_STAFF && !lock)html+='<button type="button" class="m-btn m-btn-green" onclick="saveSurveys()">Save</button>';
      html+='<button type="button" class="m-btn m-btn-navy" onclick="openPhotosPreview('+si+')">Photos Preview</button>';
      html+='<button type="button" class="m-btn m-btn-navy" onclick="openClientReport('+si+')">Review the report</button>';
      if(IS_STAFF && sv.status==='Approved' && !sv.sentToClientAt)html+='<button type="button" class="m-btn m-btn-green" onclick="openSendToClient('+si+')">Send to client</button>';
      html+='</div>';
      if(sv.sentToClientAt)html+='<p class="hint" style="color:#86efac;margin-top:10px">Sent to client by HOD — '+h(sv.sentToClientBy||'')+' · '+h(String(sv.sentToClientAt).replace('T',' ').slice(0,16))+' · TO: '+h(sv.sentToClientTo||'')+'</p>';
    }
    html+='</div>'+renderHdfcFooter(si);
    return html;
  }
  html+='<div class="survey-tabs">';
  if(IS_MGMT)html+='<div class="survey-tab '+(SV_TAB==='mgmt1'?'on':'')+'" onclick="SV_TAB=\\'mgmt1\\';render()">Review</div>';
  html+='<div class="survey-tab '+(SV_TAB==='inputs'?'on':'')+'" onclick="SV_TAB=\\'inputs\\';render()">Site Inputs &amp; Photos</div>';
  html+='<div class="survey-tab '+(SV_TAB==='checklist'?'on':'')+'" onclick="SV_TAB=\\'checklist\\';render()">Risk Checklist (0–5)</div>';
  html+='<div class="survey-tab '+(SV_TAB==='report'?'on':'')+'" onclick="SV_TAB=\\'report\\';render()">Professional Report</div>';
  html+='<div class="survey-tab '+(SV_TAB==='hod'?'on':'')+'" onclick="SV_TAB=\\'hod\\';render()">HOD\\'s suggestions</div>';
  html+='<div class="survey-tab '+(SV_TAB==='final'?'on':'')+'" onclick="SV_TAB=\\'final\\';render()">Final report with suggestion</div></div>';
  if(SV_TAB==='mgmt1'&&IS_MGMT){
    html+='<p class="hint"><b>Review</b> this audit. '+(sv.surveyKind==='hdfc'?'HDFC: Review notes optional → <b>Director Approval</b> → HOD <b>Send to client</b>.':'Order: Save review → Reminder to HOD with suggestion → Approved.')+'</p>';
    html+='<div class="m-card" style="margin-bottom:12px"><b style="color:#fde68a">Audit</b><div style="margin-top:6px;color:#e2e8f0">'+h(sv.company||'—')+' · '+h(sv.industry||'—')+' · Score '+total+'/180 · '+band.level+'</div><div class="hint" style="margin-top:6px">'+h(mgmtStepLabel(sv))+'</div></div>';
    html+='<label class="m-lbl">HOD\\'s suggestions</label><div class="m-card" style="white-space:pre-wrap;color:#fde68a;font-size:13px">'+(h(sv.hodSuggestions)||'—')+'</div>';
    html+='<label class="m-lbl">System suggestion</label><div class="m-card" style="white-space:pre-wrap;color:#86efac;font-size:13px">'+(h(sv.systemSuggestions)||'—')+'</div>';
    html+='<label class="m-lbl">Management review notes</label><textarea class="m-inp" rows="4" id="mgmtSugNote" oninput="SV['+si+'].mgmtSuggestionsNote=this.value">'+h(sv.mgmtSuggestionsNote||'')+'</textarea>';
    html+='<div class="m-savebar" style="margin-top:14px;justify-content:flex-start">';
    if(sv.status!=='Approved')html+='<button type="button" class="m-btn m-btn-green" onclick="saveReview('+si+')">Save review</button>';
    if(sv.status!=='Approved')html+='<button type="button" class="m-btn m-btn-gold" onclick="remindSurvey('+si+')">Reminder to HOD with suggestion</button>';
    if(sv.surveyKind==='hdfc' && (sv.status==='HodApproved'||sv.status==='Completed'))html+='<button type="button" class="m-btn m-btn-green" style="font-size:16px;padding:12px 18px" onclick="approveSurvey('+si+')">Director Approval</button>';
    if(sv.surveyKind!=='hdfc' && sv.status==='Completed')html+='<button type="button" class="m-btn m-btn-navy" onclick="approveSurvey('+si+')">Approved</button>';
    if(sv.status==='Completed'||sv.status==='HodApproved'||sv.status==='Approved')html+='<button type="button" class="m-btn m-btn-grey" onclick="reopenSurvey('+si+')">Reopen</button>';
    html+='</div>';
  }else if(SV_TAB==='inputs'){
    html+='<div class="fgrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">';
    html+='<div><label class="m-lbl">Client (this branch)</label><select class="m-inp" onchange="pickClient('+si+',this.value)">'+clientOptions(si)+'</select></div>';
    html+='<div><label class="m-lbl">Industry Type *</label><select class="m-inp" onchange="onIndustryChange('+si+',this.value)">'+industryOptions(si)+'</select></div>';
    if(sv.industry==='Other')html+='<div><label class="m-lbl">Other industry (specify)</label><input class="m-inp" value="'+a(sv.industryOther)+'" oninput="SV['+si+'].industryOther=this.value"></div>';
    html+='<div><label class="m-lbl">Company</label><input class="m-inp" value="'+a(sv.company)+'" oninput="SV['+si+'].company=this.value"></div>';
    html+='<div><label class="m-lbl">Location Name</label><input class="m-inp" value="'+a(sv.locationName)+'" oninput="SV['+si+'].locationName=this.value"></div>';
    html+='<div><label class="m-lbl">Survey Date</label><input class="m-inp" type="date" value="'+a(sv.surveyDate)+'" oninput="SV['+si+'].surveyDate=this.value"></div>';
    html+='<div><label class="m-lbl">Period (e.g. Q2 2026)</label><input class="m-inp" value="'+a(sv.periodLabel)+'" oninput="SV['+si+'].periodLabel=this.value"></div>';
    html+='<div><label class="m-lbl">Previous survey date</label><input class="m-inp" type="date" value="'+a(sv.previousSurveyDate)+'" oninput="SV['+si+'].previousSurveyDate=this.value"></div>';
    html+='<div><label class="m-lbl">Address</label><input class="m-inp" value="'+a(sv.address)+'" oninput="SV['+si+'].address=this.value"></div>';
    html+='<div><label class="m-lbl">Factory Manager</label><input class="m-inp" value="'+a(sv.factoryManager)+'" oninput="SV['+si+'].factoryManager=this.value"></div>';
    html+='<div><label class="m-lbl">Contact Phone</label><input class="m-inp" value="'+a(sv.contactPhone)+'" oninput="SV['+si+'].contactPhone=this.value"></div>';
    html+='<div><label class="m-lbl">Email</label><input class="m-inp" value="'+a(sv.contactEmail)+'" oninput="SV['+si+'].contactEmail=this.value"></div>';
    html+='<div><label class="m-lbl">Nature of Business</label><input class="m-inp" value="'+a(sv.natureOfBusiness)+'" oninput="SV['+si+'].natureOfBusiness=this.value"></div>';
    html+='<div><label class="m-lbl">Surveyed By (operations / HOD)</label>'+(typeof ssaNameSelectHtml==='function'?ssaNameSelectHtml('stdName_'+si,sv.surveyedBy||'','onStdSurveyedBy('+si+',this.value)'):'<input class="m-inp" value="'+a(sv.surveyedBy)+'" oninput="SV['+si+'].surveyedBy=this.value">')+'</div>';
    html+='<div><label class="m-lbl">Surveyor email (HOD / Operations)</label>'+(typeof ssaEmailSelectHtml==='function'?ssaEmailSelectHtml('stdEmail_'+si,sv.surveyorEmail||'','onStdSurveyorEmail('+si+',this.value)')+'<input class="m-inp" style="margin-top:8px" type="email" placeholder="Or type email" value="'+a(sv.surveyorEmail||'')+'" oninput="SV['+si+'].surveyorEmail=this.value">':'<input class="m-inp" type="email" value="'+a(sv.surveyorEmail)+'" oninput="SV['+si+'].surveyorEmail=this.value">')+'</div>';
    html+='<div><label class="m-lbl">Actual strength</label><input class="m-inp" value="'+a(sv.actualStrength)+'" oninput="SV['+si+'].actualStrength=this.value"></div></div>';
    html+='<label class="m-lbl" style="margin-top:10px">Changes since last survey</label><textarea class="m-inp" rows="2" oninput="SV['+si+'].changesSinceLast=this.value">'+h(sv.changesSinceLast)+'</textarea>';
    html+='<label class="m-lbl">Client feedback</label><textarea class="m-inp" rows="2" oninput="SV['+si+'].clientFeedback=this.value">'+h(sv.clientFeedback)+'</textarea>';
    html+='<div class="survey-cols" style="margin-top:14px"><div>'+renderSiteInputs(si)+renderInterviews(si)+'<label class="m-lbl">Site observations (day &amp; evening visit)</label><textarea class="m-inp" rows="4" oninput="SV['+si+'].siteObservations=this.value">'+h(sv.siteObservations)+'</textarea></div>'+renderPhotoPanel(si)+'</div>';
  }else if(SV_TAB==='checklist'){
    html+='<p class="hint" style="color:#fde68a"><b>Assessment questionnaire</b> for '+h(sv.industry||'this industry')+' — score each item 0 (low risk) to 5 (high risk). Same 180-point checklist as Agile CRM.</p>';
    html+='<div class="fgrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:12px">';
    html+='<div><label class="m-lbl">Client (this branch)</label><select class="m-inp" onchange="pickClient('+si+',this.value)">'+clientOptions(si)+'</select></div>';
    html+='<div><label class="m-lbl">Industry Type *</label><select class="m-inp" onchange="onIndustryChange('+si+',this.value)">'+industryOptions(si)+'</select></div>';
    html+='<div><label class="m-lbl">Company</label><input class="m-inp" value="'+a(sv.company)+'" oninput="SV['+si+'].company=this.value"></div>';
    html+='<div><label class="m-lbl">Location Name</label><input class="m-inp" value="'+a(sv.locationName)+'" oninput="SV['+si+'].locationName=this.value"></div></div>';
    if(!parts.length)html+='<div class="m-card" style="border-color:#f59e0b;color:#fde68a">Questionnaire did not load. Tap Back to list, then Start Assessment again. If it is still empty, refresh the page.</div>';
    html+='<div class="survey-cols"><div>';
    var gsn=0;parts.forEach(function(part){var pt=svPartTotal(sv,part);html+='<div class="m-card" style="margin-top:12px"><b style="color:#fde68a">'+h(part.title)+'</b> <span style="color:#94a3b8;font-size:12px">('+pt+' / '+part.maxTotal+')</span>';part.items.forEach(function(it){gsn++;html+=renderScoreRow(si,it,gsn);});html+='</div>';});
    html+='</div>'+renderPhotoPanel(si)+'</div>';
  }else if(SV_TAB==='report'){
    html+='<div style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap">';
    if(!lock)html+='<button type="button" class="m-btn m-btn-gold" onclick="generateSurveyAi('+si+')">Generate Professional Report</button>';
    html+='<button type="button" class="m-btn m-btn-navy" onclick="openClientReport('+si+')">Client Report (Print / PDF)</button>';
    if(IS_MGMT || sv.status==='Approved')html+='<button type="button" class="m-btn m-btn-navy" onclick="openShare('+si+')">Share by Email</button></div>';
    html+='<label class="m-lbl">Scientific Risk Analysis</label><textarea class="m-inp" rows="5" oninput="SV['+si+'].riskAnalysis=this.value">'+h(sv.riskAnalysis)+'</textarea>';
    html+='<label class="m-lbl">Executive Summary (for client)</label><textarea class="m-inp" rows="5" oninput="SV['+si+'].executiveSummary=this.value">'+h(sv.executiveSummary)+'</textarea>';
    html+='<label class="m-lbl">Recommended Manning (ASO / LSG / SG — shifts A, B, C)</label><textarea class="m-inp" rows="5" oninput="SV['+si+'].manningSuggestion=this.value">'+h(sv.manningSuggestion)+'</textarea>';
    html+='<label class="m-lbl">Uniform &amp; Grooming Requirements</label><textarea class="m-inp" rows="5" oninput="SV['+si+'].uniformRequirements=this.value">'+h(sv.uniformRequirements)+'</textarea>';
    html+='<label class="m-lbl">Equipment &amp; Security Infrastructure</label><textarea class="m-inp" rows="4" oninput="SV['+si+'].equipmentSuggestions=this.value">'+h(sv.equipmentSuggestions)+'</textarea>';
    html+='<label class="m-lbl">Security Professional Recommendations</label><textarea class="m-inp" rows="5" oninput="SV['+si+'].securityRecommendations=this.value">'+h(sv.securityRecommendations)+'</textarea>';
    html+='<label class="m-lbl">Additional Recommendations</label><textarea class="m-inp" rows="3" oninput="SV['+si+'].recommendations=this.value">'+h(sv.recommendations)+'</textarea>';
    html+='<label class="m-lbl">Client-Specific Requirements</label><textarea class="m-inp" rows="3" oninput="SV['+si+'].siteRequirements=this.value">'+h(sv.siteRequirements)+'</textarea>';
  }else if(SV_TAB==='hod'){
    html+='<p class="hint">After completing the survey, write your suggestions. Then tap <b>Generate system suggestion</b>.</p>';
    html+='<label class="m-lbl">HOD\\'s suggestions *</label><textarea class="m-inp" rows="8" oninput="SV['+si+'].hodSuggestions=this.value">'+h(sv.hodSuggestions||'')+'</textarea>';
    if(!lock)html+='<div style="margin:12px 0"><button type="button" class="m-btn m-btn-gold" onclick="generateSystemSuggestion('+si+')">Generate system suggestion</button></div>';
    html+='<label class="m-lbl">System suggestion (after review of survey + HOD)</label><textarea class="m-inp" rows="8" oninput="SV['+si+'].systemSuggestions=this.value">'+h(sv.systemSuggestions||'')+'</textarea>';
  }else{
    html+='<p class="hint">Review the final report with HOD and system suggestions before <b>Send for approval</b>.</p>';
    html+='<div class="m-card" style="margin-bottom:12px"><b style="color:#fde68a">Industry</b><div style="margin-top:6px;color:#e2e8f0">'+h(sv.industry||'—')+'</div></div>';
    html+='<div class="m-card" style="margin-bottom:12px"><b style="color:#fde68a">Risk score</b><div style="margin-top:6px;color:#e2e8f0">'+total+'/180 · '+band.level+'</div></div>';
    html+='<label class="m-lbl">Executive Summary</label><div class="m-card" style="white-space:pre-wrap;color:#cbd5e1;font-size:13px">'+(h(sv.executiveSummary)||'—')+'</div>';
    html+='<label class="m-lbl">HOD\\'s suggestions</label><div class="m-card" style="white-space:pre-wrap;color:#fde68a;font-size:13px">'+(h(sv.hodSuggestions)||'—')+'</div>';
    html+='<label class="m-lbl">System suggestion</label><div class="m-card" style="white-space:pre-wrap;color:#86efac;font-size:13px">'+(h(sv.systemSuggestions)||'—')+'</div>';
  }
  html+='<div class="m-savebar">';
  html+='<button type="button" class="m-btn m-btn-grey" onclick="SV_VIEW=\\'list\\';SV_EDIT=-1;render()">Back to list</button>';
  if(IS_STAFF && !lock)html+='<button type="button" class="m-btn m-btn-green" onclick="saveSurveys()">Save draft</button><button type="button" class="m-btn m-btn-gold" onclick="submitSurvey('+si+')">Send for approval</button>';
  if(IS_MGMT && SV_TAB!=='mgmt1'){
    if(sv.status!=='Approved')html+='<button type="button" class="m-btn m-btn-navy" onclick="SV_TAB=\\'mgmt1\\';render()">Review</button>';
    if(sv.status==='Completed')html+='<button type="button" class="m-btn m-btn-green" onclick="approveSurvey('+si+')">Approved</button>';
    if(sv.status==='Completed'||sv.status==='Approved')html+='<button type="button" class="m-btn m-btn-grey" onclick="reopenSurvey('+si+')">Reopen</button>';
  }
  html+='</div></div>';
  return html;
}

function renderList(){
  var bid=branchId();
  var list=SV.map(function(s,i){return {s:s,i:i};}).filter(function(x){
    if(!SV_SHOW_INACT&&x.s.active===false)return false;
    if(bid&&x.s.branchId&&x.s.branchId!==bid)return false;
    return true;
  });
  var std=list.filter(function(x){return x.s.surveyKind!=='hdfc';});
  var hdfc=list.filter(function(x){return x.s.surveyKind==='hdfc';});
  var scoped=SV_MODE==='hdfc'?hdfc:(SV_MODE==='general'?std:list);
  var draft=0,wait=0,hodA=0,ok=0;
  scoped.forEach(function(x){
    if(x.s.status==='Approved')ok++;
    else if(x.s.status==='HodApproved')hodA++;
    else if(x.s.status==='Completed')wait++;
    else draft++;
  });
  function hdfcIncomplete(sv){
    if(!sv||sv.surveyKind!=='hdfc')return false;
    var pages=typeof hdfcPagesProgress==='function'?hdfcPagesProgress(sv):{complete:sv.status!=='Draft'};
    if(sv.status==='Draft')return true;
    return !pages.complete;
  }
  var hdfcDraftRows=hdfc.filter(function(x){return hdfcIncomplete(x.s);});
  var hdfcSentRows=hdfc.filter(function(x){return !hdfcIncomplete(x.s);});
  hdfcDraftRows.sort(function(a,b){return String(b.s.updatedAt||b.s.submittedAt||'').localeCompare(String(a.s.updatedAt||a.s.submittedAt||''));});
  hdfcSentRows.sort(function(a,b){return String(b.s.submittedAt||b.s.updatedAt||'').localeCompare(String(a.s.submittedAt||a.s.updatedAt||''));});
  var hdfcDraftCount=hdfcDraftRows.length;
  var hdfcTotHome=hdfcProgressParts(bid);
  var k=el('psKpis');
  if(k){
    if(!SV_MODE){
      k.innerHTML='<div class="m-kpi t"><b>'+hdfcDraftCount+'</b><span>Not submitted (Draft)</span></div><div class="m-kpi o"><b>'+pad3(hdfcTotHome.done)+'</b><span>Submitted</span></div><div class="m-kpi s"><b>'+pad3(hdfcTotHome.total)+'</b><span>Total HDFC</span></div>';
    }
    else if(SV_MODE==='hdfc'){
      k.innerHTML='<div class="m-kpi t"><b>'+hdfcDraftCount+'</b><span>Not submitted (Draft)</span></div><div class="m-kpi o"><b>'+pad3(hdfcTotHome.done)+'</b><span>Submitted</span></div><div class="m-kpi s"><b>'+pad3(hdfcTotHome.total)+'</b><span>Total HDFC</span></div><div class="m-kpi o"><b>'+hodA+'</b><span>Forwarded / HOD OK</span></div><div class="m-kpi s"><b>'+ok+'</b><span>Director approved</span></div>';
    }
    else k.innerHTML='<div class="m-kpi t"><b>'+draft+'</b><span>Draft</span></div><div class="m-kpi o"><b>'+wait+'</b><span>Sent for approval</span></div><div class="m-kpi o"><b>'+hodA+'</b><span>HOD approved</span></div><div class="m-kpi s"><b>'+ok+'</b><span>Director approved</span></div>';
  }
  function card(x){
    var sv=x.s,i=x.i,total=svGrandTotal(sv),band=svRiskBand(total);
    var isH=sv.surveyKind==='hdfc';
    if(isH){
      var brCode=hdfcBranchCodeOf(sv);
      var loc=hdfcLocationOf(sv);
      var by=hdfcSubmittedByOf(sv);
      var when=fmtDateTime(hdfcSubmittedAtOf(sv));
      var prog=hdfcBranchProgress(sv.branchId);
      var out='<div class="lead-card'+(sv.active===false?' inact':'')+'">';
      out+='<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div>';
      var title=loc&&loc!=='—'?loc:(sv.company||'(unnamed)');
      out+='<div class="lc-name"><span style="color:#7dd3fc">HDFC</span> — '+h(title)+(hdfcIncomplete(sv)?' <span style="color:#fde68a">· Incomplete</span>':'')+'</div>';
      out+='<div class="lc-loc" style="margin-top:6px;line-height:1.55">';
      out+='<b>Branch code:</b> '+h(brCode)+'<br>';
      out+='<b>Location:</b> '+h(loc)+'<br>';
      out+='<b>Submitted By:</b> '+h(by)+'<br>';
      if(sv.surveyorEmail)out+='<b>Email:</b> '+h(sv.surveyorEmail)+'<br>';
      if(sv.surveyorWhatsApp)out+='<b>WhatsApp:</b> '+h(sv.surveyorWhatsApp)+'<br>';
      out+='<b>Date &amp; time:</b> '+h(when)+'<br>';
      var pages=typeof hdfcPagesProgress==='function'?hdfcPagesProgress(sv):{label:'— / 15',complete:false};
      out+='<b>Pages completed:</b> <span style="color:'+(pages.complete?'#86efac':'#fde68a')+';font-weight:800">'+h(pages.label)+'</span>';
      if(!pages.complete)out+=' <span style="color:#fca5a5">(all 15 required before Send to HOD)</span>';
      out+='<br>';
      if(sv.geoLat!=null&&sv.geoLng!=null){
        out+='<b>GPS:</b> '+h(Number(sv.geoLat).toFixed(5)+', '+Number(sv.geoLng).toFixed(5));
        if(sv.geoAccuracy!=null)out+=' <span style="color:#64748b">(±'+h(String(Math.round(sv.geoAccuracy)))+' m)</span>';
        out+=' <a href="https://maps.google.com/?q='+encodeURIComponent(String(sv.geoLat)+','+String(sv.geoLng))+'" target="_blank" rel="noopener" style="color:#7dd3fc">Map</a><br>';
      }else if(sv.geoStatus){
        out+='<b>GPS:</b> <span style="color:#fbbf24">'+h(sv.geoStatus)+'</span><br>';
      }
      out+='<b>Branch progress:</b> <span style="color:#fde68a;font-weight:800">'+h(prog)+'</span> <span style="color:#64748b">(submitted / HDFC sites)</span>';
      out+='</div></div>';
      out+='<div style="text-align:right"><div style="font-size:12px;color:#94a3b8;margin-bottom:6px">'+h(branchNameOf(sv.branchId))+'</div>';
      out+='<span class="risk-pill" style="background:'+band.colour+'22;color:'+band.colour+'">'+total+'/180 · '+band.level+'</span>';
      out+='<div style="font-size:12px;color:#94a3b8;margin-top:8px">'+h(hdfcStatusLabel(sv.status,sv))+'</div></div></div>';
      out+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">';
      /* Order: Review → Edit → Re-assessment → Forward for Approval (HOD). Management: Review → Re-assessment → Director Approval. */
      out+='<button type="button" class="m-btn m-btn-gold" onclick="openAudit('+i+',\\''+(IS_MGMT?'mgmt1':'h1')+'\\')">Review</button>';
      if(IS_STAFF && (sv.status==='Draft'||sv.status==='Completed')){
        out+='<button type="button" class="m-btn m-btn-navy" onclick="openAudit('+i+',\\'h1\\')">Edit</button>';
      }
      if((IS_STAFF||IS_MGMT) && (sv.status==='Completed'||sv.status==='HodApproved'||sv.status==='Approved')){
        out+='<button type="button" class="m-btn m-btn-navy" onclick="requestHdfcReassessment('+i+')">Re-assessment</button>';
      }
      if(IS_STAFF && (sv.status==='Draft'||sv.status==='Completed') && !sv.forwardedForApprovalAt){
        out+='<button type="button" class="m-btn m-btn-green" onclick="forwardHdfcForApproval('+i+')">Forward for Approval</button>';
      }
      if(IS_STAFF && sv.status==='Approved' && !sv.sentToClientAt){
        out+='<button type="button" class="m-btn m-btn-green" onclick="openSendToClient('+i+')">Send to client</button>';
      }
      if(IS_STAFF && sv.status==='HodApproved' && !sv.sentToClientAt){
        out+='<span class="hint" style="color:#fde68a;align-self:center">Forwarded — waiting Director Approval</span>';
      }
      if(IS_MGMT && (sv.status==='HodApproved'||(sv.status==='Completed'&&sv.forwardedForApprovalAt))){
        out+='<button type="button" class="m-btn m-btn-green" style="font-size:15px;padding:10px 14px" onclick="approveSurvey('+i+')">Director Approval</button>';
      }
      if(IS_MGMT && sv.status==='Draft')out+='<span class="hint" style="color:#fca5a5;align-self:center">Ask HOD to Forward for Approval first</span>';
      if(IS_MGMT && sv.status==='Completed' && !sv.forwardedForApprovalAt)out+='<span class="hint" style="color:#fde68a;align-self:center">Submitted — HOD to Forward for Approval</span>';
      if(IS_MGMT && sv.status==='Approved' && !sv.sentToClientAt)out+='<span class="hint" style="color:#86efac;align-self:center">Director approved — waiting HOD Send to client</span>';
      if(IS_MGMT)out+='<button type="button" class="m-btn m-btn-grey" onclick="deleteSurvey('+i+')">Delete</button>';
      if(IS_MGMT && sv.status!=='Draft')out+='<button type="button" class="m-btn m-btn-grey" onclick="reopenSurvey('+i+')">Reopen</button>';
      if(IS_MGMT || sv.status==='Approved' || sv.sentToClientAt)out+='<button type="button" class="m-btn m-btn-navy" onclick="openPhotosPreview('+i+')">Photos Preview</button>';
      out+='</div></div>';
      return out;
    }
    var out='<div class="lead-card'+(sv.active===false?' inact':'')+'"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><div class="lc-name">'+h(sv.company||'(unnamed)')+'</div><div class="lc-loc">'+h(branchNameOf(sv.branchId))+' · '+h(sv.industry||'Industry TBD')+' · '+fmtDate(sv.surveyDate)+'</div></div><span class="risk-pill" style="background:'+band.colour+'22;color:'+band.colour+'">'+total+'/180 · '+band.level+'</span></div>';
    out+='<div style="font-size:12px;color:#94a3b8;margin-top:8px">'+h(statusLabel(sv.status))+' · Surveyed by: '+h(sv.surveyedBy||'—')+'</div>';
    out+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">';
    out+='<button type="button" class="m-btn m-btn-gold" onclick="openAudit('+i+')">'+(IS_MGMT?'Review':'Open')+'</button>';
    if(IS_STAFF && sv.status==='Draft')out+='<button type="button" class="m-btn m-btn-green" onclick="submitSurvey('+i+')">Send for approval</button>';
    if(IS_MGMT && sv.status==='Completed')out+='<button type="button" class="m-btn m-btn-green" onclick="openAudit('+i+',\\'mgmt1\\')">Save review / Approved</button>';
    if(IS_MGMT)out+='<button type="button" class="m-btn m-btn-grey" onclick="deleteSurvey('+i+')">Delete</button>';
    if(IS_MGMT && (sv.status==='Completed'||sv.status==='Approved'))out+='<button type="button" class="m-btn m-btn-grey" onclick="reopenSurvey('+i+')">Reopen</button>';
    out+='</div></div>';
    return out;
  }
  var showInact='<div class="m-card"><label style="color:#cbd5e1;font-size:13px"><input type="checkbox" '+(SV_SHOW_INACT?'checked':'')+' onchange="SV_SHOW_INACT=this.checked;render()"> Show inactive</label></div>';
  var gHtml=showInact+'<div class="m-card" style="margin-top:12px"><h3 style="color:#fde68a;margin:0 0 10px">General SSA list</h3>';
  if(!std.length)gHtml+='<div style="color:#94a3b8;padding:16px;text-align:center">'+(IS_STAFF?'No general assessments yet. Tap <b>Start Assessment</b>.':'No general assessments yet.')+'</div>';
  else std.forEach(function(x){gHtml+=card(x);});
  gHtml+='</div>';
  if(IS_STAFF)gHtml+='<div class="m-savebar"><button type="button" class="m-btn m-btn-green" onclick="saveSurveys()">Save drafts</button></div>';
  var hHtml=showInact;
  hHtml+='<div class="m-kgrid" id="psHdfcKpis" style="margin-top:12px"><div class="m-kpi t"><b>'+hdfcDraftCount+'</b><span>Not submitted (Draft)</span></div><div class="m-kpi o"><b>'+pad3(hdfcTotHome.done)+'</b><span>Submitted</span></div><div class="m-kpi s"><b>'+pad3(hdfcTotHome.total)+'</b><span>Total HDFC</span></div></div>';
  hHtml+='<div class="m-card" id="ssaHdfcDraftBox" style="margin-top:12px;border:2px solid #fde68a">';
  hHtml+='<h3 style="color:#fde68a;margin:0 0 10px">Incomplete — not submitted (Draft)</h3>';
  hHtml+='<p class="hint" style="margin:0 0 10px">Phone / laptop saves that are not finished (not all 15 pages), including Hyderabad-B. Tap <b>Edit</b> to finish.</p>';
  if(!hdfcDraftRows.length)hHtml+='<div style="color:#94a3b8;padding:16px;text-align:center">No incomplete HDFC for this branch.</div>';
  else hdfcDraftRows.forEach(function(x){hHtml+=card(x);});
  hHtml+='</div>';
  hHtml+='<div class="m-card" style="margin-top:12px"><h3 style="color:#7dd3fc;margin:0 0 10px">HDFC SSA submitted List</h3>';
  hHtml+=hdfcTrackBarHtml();
  if(IS_STAFF)hHtml+='<p class="hint"><b>Draft</b> = started on the phone / portal, not yet sent to HOD (does not count as Submitted). <b>Submitted</b> vs <b>Total HDFC</b> = completed SSA vs HDFC sites on this branch. Each card shows <b>Pages completed</b> (must be <b>15 / 15</b> before Send to HOD). Buttons: <b>Review</b> → <b>Edit</b> → <b>Re-assessment</b> → <b>Forward for Approval</b>.</p>';
  else hHtml+='<p class="hint"><b>Draft</b> = started, not yet sent to HOD. Pick <b>Branch Name</b>. <b>Submitted</b> vs <b>Total HDFC</b> = completed SSA vs HDFC sites. Each card shows <b>Pages completed</b> (15 / 15). Management: <b>Review</b> → <b>Re-assessment</b> → <b>Director Approval</b>.</p>';
  if(!hdfcSentRows.length)hHtml+='<div style="color:#94a3b8;padding:16px;text-align:center">No HDFC SSA submitted yet. Use the public mobile link or tap <b>Start Assessment</b>.</div>';
  else hdfcSentRows.forEach(function(x){hHtml+=card(x);});
  hHtml+='</div>';
  if(IS_STAFF)hHtml+='<div class="m-savebar"><button type="button" class="m-btn m-btn-green" onclick="saveSurveys()">Save drafts</button></div>';
  return {general:gHtml,hdfc:hHtml};
}

function setSsaHomeVisible(on){
  var home=el('ssaHomeBlock');
  if(home)home.classList.toggle('hidden',!on);
}
function scrollSsaForm(){
  var box=el('psContent');
  if(box){
    try{box.scrollIntoView({behavior:'auto',block:'start'});}catch(e){}
  }
  var sc=document.querySelector('.staff-content');
  if(sc)sc.scrollTop=0;
  try{window.scrollTo(0,0);}catch(e){}
}
function render(opts){
  opts=opts||{};
  var box=el('psContent');if(!box)return;
  if(SV_VIEW==='edit'&&SV_EDIT>=0&&SV[SV_EDIT]){
    var gp=el('ssaGeneralPanel'),hp=el('ssaHdfcPanel');
    if(gp)gp.classList.add('hidden');
    if(hp)hp.classList.add('hidden');
    setSsaHomeVisible(false);
    box.classList.remove('hidden');
    box.innerHTML=renderEdit(SV_EDIT);
    if(!canEdit(SV[SV_EDIT])){
      box.querySelectorAll('input,textarea,select').forEach(function(n){
        if(IS_MGMT && (n.id==='mgmtSugNote' || (n.getAttribute('oninput')||'').indexOf('mgmtSuggestionsNote')>=0))return;
        n.disabled=true;
      });
    }
    if(opts.focusScore){goToScoreRow(opts.focusScore);return;}
    if(!opts.keepScroll)scrollSsaForm();
    return;
  }
  if(SV_VIEW==='board'){
    setSsaHomeVisible(true);
    box.innerHTML='';
    box.classList.add('hidden');
    var gListB=el('ssaGeneralList'),hListB=el('ssaHdfcList');
    if(gListB)gListB.innerHTML='';
    var gpB=el('ssaGeneralPanel'),hpB=el('ssaHdfcPanel');
    if(gpB)gpB.classList.add('hidden');
    if(hpB)hpB.classList.remove('hidden');
    if(hListB){
      if(!BOARD_CACHE){hListB.innerHTML='<div class="m-card ssa-board"><p class="hint">Opening HDFC State Dashboard…</p></div>';loadHdfcBoard();}
      else {
        if(!el('ssaBoardHost')||!hListB.contains(el('ssaBoardHost'))) hListB.innerHTML='<div class="m-card" id="ssaBoardHost"></div>';
        ssaPaintBoard(el('ssaBoardHost'), BOARD_CACHE, boardUi(), false);
      }
    }
    return;
  }
  if(typeof ssaDestroyMap==='function')ssaDestroyMap();
  setSsaHomeVisible(true);
  box.innerHTML='';
  box.classList.add('hidden');
  var lists=renderList();
  var gList=el('ssaGeneralList'),hList=el('ssaHdfcList');
  if(gList)gList.innerHTML=SV_MODE==='general'?lists.general:'';
  if(hList)hList.innerHTML=SV_MODE==='hdfc'?lists.hdfc:'';
  if(SV_MODE==='hdfc')fillHdfcTrack();
  var gp2=el('ssaGeneralPanel'),hp2=el('ssaHdfcPanel');
  if(gp2)gp2.classList.toggle('hidden',SV_MODE!=='general');
  if(hp2)hp2.classList.toggle('hidden',SV_MODE!=='hdfc');
}
function scheduleHdfcAutoSave(){
  if(!IS_STAFF)return;
  if(SV_EDIT<0||!SV[SV_EDIT]||SV[SV_EDIT].surveyKind!=='hdfc')return;
  if(!canEdit(SV[SV_EDIT]))return;
  if(SV_AUTO_T)clearTimeout(SV_AUTO_T);
  SV_AUTO_T=setTimeout(function(){SV_AUTO_T=null;hdfcAutoSaveQuiet();},1200);
}
function finishSvAutoWaits(){
  var w=SV_AUTO_WAIT.splice(0);
  for(var i=0;i<w.length;i++)try{w[i]();}catch(e){}
}
function keepLocalHdfcEdit(keepId,localForm,localScores,localNotes){
  if(!keepId)return;
  var ix=SV.findIndex(function(x){return x.id===keepId;});
  if(ix<0)return;
  SV_EDIT=ix;
  if(localForm)SV[ix].hdfcForm=localForm;
  if(localScores)SV[ix].scores=localScores;
  if(localNotes)SV[ix].scoreNotes=localNotes;
}
function hdfcAutoSaveQuiet(done){
  if(done)SV_AUTO_WAIT.push(done);
  if(!IS_STAFF){finishSvAutoWaits();return;}
  if(SV_EDIT<0||!SV[SV_EDIT]||SV[SV_EDIT].surveyKind!=='hdfc'||!canEdit(SV[SV_EDIT])){finishSvAutoWaits();return;}
  if(SV_AUTO_BUSY){SV_AUTO_AGAIN=true;return;}
  if(typeof harvestHdfcDom==='function')harvestHdfcDom(SV_EDIT);
  SV_AUTO_BUSY=true;
  var keepId=SV[SV_EDIT].id;
  var localForm=SV[SV_EDIT].hdfcForm;
  var localScores=SV[SV_EDIT].scores;
  var localNotes=SV[SV_EDIT].scoreNotes;
  var tip=el('hdfcAutoSaveTip');
  if(tip){tip.textContent='Saving…';tip.style.opacity='1';}
  api('periodicalSurveySave',{surveys:SV,branchId:branchId()}).then(function(res){
    var s=res.s||res.status,j=res.j||res.body||{};
    if(s===200&&j.surveys){
      SV=j.surveys;
      keepLocalHdfcEdit(keepId,localForm,localScores,localNotes);
      tip=el('hdfcAutoSaveTip');
      if(tip){tip.textContent='Auto-saved';tip.style.opacity='1';setTimeout(function(){var t=el('hdfcAutoSaveTip');if(t)t.style.opacity='0.7';},1800);}
    }else if(tip){tip.textContent='Auto-save failed — tap Save';tip.style.opacity='1';}
    SV_AUTO_BUSY=false;
    if(SV_AUTO_AGAIN){SV_AUTO_AGAIN=false;hdfcAutoSaveQuiet();return;}
    finishSvAutoWaits();
  }).catch(function(){
    SV_AUTO_BUSY=false;
    tip=el('hdfcAutoSaveTip');
    if(tip){tip.textContent='Auto-save failed — tap Save';tip.style.opacity='1';}
    if(SV_AUTO_AGAIN){SV_AUTO_AGAIN=false;hdfcAutoSaveQuiet();return;}
    finishSvAutoWaits();
  });
}
function flushHdfcAutoSave(){
  return new Promise(function(resolve){
    if(SV_AUTO_T){clearTimeout(SV_AUTO_T);SV_AUTO_T=null;}
    if(!IS_STAFF||SV_EDIT<0||!SV[SV_EDIT]||SV[SV_EDIT].surveyKind!=='hdfc'||!canEdit(SV[SV_EDIT])){resolve();return;}
    hdfcAutoSaveQuiet(resolve);
  });
}
function backHdfcList(){
  flushHdfcAutoSave().then(function(){
    var kind=(SV_EDIT>=0&&SV[SV_EDIT]&&SV[SV_EDIT].surveyKind==='hdfc')?'hdfc':'general';
    SV_VIEW='list';SV_EDIT=-1;
    setSsaMode(kind);
  });
}
function saveSurveys(){
  if(!IS_STAFF){alert('Management reviews surveys. HOD / Staff save and submit them.');return;}
  if(SV_AUTO_T){clearTimeout(SV_AUTO_T);SV_AUTO_T=null;}
  if(typeof harvestHdfcDom==='function'&&SV_EDIT>=0)harvestHdfcDom(SV_EDIT);
  var keepId=SV_EDIT>=0&&SV[SV_EDIT]?SV[SV_EDIT].id:'';
  var keepTab=SV_TAB;
  var keepView=SV_VIEW;
  var localForm=SV_EDIT>=0&&SV[SV_EDIT]?SV[SV_EDIT].hdfcForm:null;
  var localScores=SV_EDIT>=0&&SV[SV_EDIT]?SV[SV_EDIT].scores:null;
  var localNotes=SV_EDIT>=0&&SV[SV_EDIT]?SV[SV_EDIT].scoreNotes:null;
  api('periodicalSurveySave',{surveys:SV,branchId:branchId()}).then(function(res){
    var s=res.s||res.status,j=res.j||res.body||{};
    if(s!==200){alert(j.error||'Could not save.');return;}
    SV=j.surveys||SV;
    keepLocalHdfcEdit(keepId,localForm,localScores,localNotes);
    if(keepView==='edit'&&keepId){
      var ix=SV.findIndex(function(x){return x.id===keepId;});
      if(ix>=0){SV_EDIT=ix;SV_VIEW='edit';SV_TAB=keepTab;}
      alert('Draft saved. Stay on this page and continue. It is not submitted until all 15 pages and Forward / Submit to HOD.');
      render({keepScroll:true});
      return;
    }
    alert('Drafts saved. Incomplete HDFC stays under Incomplete — not submitted.');
    render();
  });
}
function submitSurvey(si){
  var sv=SV[si];if(!sv)return;
  if(!sv.company){alert('Pick a client from your branch list first.');return;}
  if(!sv.industry){alert('Select Industry Type (same list as CRM survey).');SV_TAB=sv.surveyKind==='hdfc'?'h2':'inputs';render();return;}
  if(sv.industry==='Other'&&!(sv.industryOther||'').trim()){alert('Specify the Other industry.');SV_TAB='inputs';render();return;}
  if(sv.surveyKind!=='hdfc' && !(sv.hodSuggestions||'').trim()){alert('Enter HOD suggestions, then generate system suggestion if needed.');SV_TAB='hod';render();return;}
  if(sv.surveyKind==='hdfc' && !(sv.company||'').trim()){alert('Pick HDFC client / Branch Name first (heading 1).');SV_TAB='h1';render();return;}
  if(!confirm(sv.surveyKind==='hdfc'?'Send this HDFC survey to HOD for approval?':'Send this Site Security Assessment (SSA) for Director approval?'))return;
  api('periodicalSurveySave',{surveys:SV,branchId:branchId()}).then(function(saveRes){
    var s=saveRes.s||saveRes.status,j=saveRes.j||saveRes.body||{};
    if(s===200&&j.surveys)SV=j.surveys;
    var cur=SV.find(function(x){return x.id===sv.id;})||sv;
    return api('periodicalSurveySubmit',{survey:cur,branchId:branchId()});
  }).then(function(res){
    if(!res)return;
    var s=res.s||res.status,j=res.j||res.body||{};
    if(s!==200){alert(j.error||'Could not send for approval.');return;}
    if(j.surveys)SV=j.surveys; else applySurvey(j.survey);
    alert(sv.surveyKind==='hdfc'?'Sent to HOD.':'Sent for Director approval.');
    SV_VIEW='list';SV_EDIT=-1;
    setSsaMode(sv.surveyKind==='hdfc'?'hdfc':'general');
  });
}
function openAudit(i,tab){
  SV_EDIT=i;SV_VIEW='edit';
  var sv=SV[i];
  if(sv&&sv.surveyKind==='hdfc')SV_MODE='hdfc';
  else SV_MODE='general';
  if(IS_MGMT){
    if(tab)SV_TAB=tab;
    else SV_TAB='mgmt1';
  }else SV_TAB=tab||'inputs';
  render();
}
function saveReview(si){
  var sv=SV[si];if(!sv)return;
  if(sv.status==='Approved'){alert('Already approved. Reopen to edit again.');return;}
  var note=(el('mgmtSugNote')&&el('mgmtSugNote').value)||sv.mgmtSuggestionsNote||'';
  SV[si].mgmtSuggestionsNote=note;
  if(sv.status==='Draft'){
    alert('Review notes kept on screen. For Draft audits, tap Reminder to HOD with suggestion. After HOD Sends for approval, tap Save review again.');
    return;
  }
  if(!confirm('Save review for this audit?'))return;
  api('periodicalSurveyReviewSuggestions',{surveyId:sv.id,mgmtSuggestionsNote:note}).then(function(res){
    var s=res.s||res.status,j=res.j||res.body||{};
    if(s!==200){alert(j.error||'Could not Save review.');return;}
    if(j.surveys)SV=j.surveys; else applySurvey(j.survey);
    alert('Review saved. You can Reminder to HOD with suggestion, then Approved.');
    render();
  });
}
function approveSurvey(si){
  var sv=SV[si];if(!sv)return;
  if(sv.surveyKind!=='hdfc' && !sv.mgmtSuggestionsReviewedAt){
    alert('Tap Save review first, then Approved.');
    SV_TAB='mgmt1';render();
    return;
  }
  if(sv.surveyKind==='hdfc' && sv.status!=='HodApproved' && sv.status!=='Completed'){
    alert('HDFC survey must be Sent to HOD or Forwarded for approval first. Then Director Approval.');
    return;
  }
  if(!confirm(sv.surveyKind==='hdfc'?'Director Approval for this HDFC survey? HOD can then Send to client.':'Mark this audit Approved? HOD will be informed by email.'))return;
  api('periodicalSurveyApprove',{surveyId:sv.id}).then(function(res){
    var s=res.s||res.status,j=res.j||res.body||{};
    if(s!==200){alert(j.error||'Could not approve.');return;}
    applySurvey(j.survey);alert(sv.surveyKind==='hdfc'?'Director approved. HOD can now Send to client.':'Approved. HOD has been informed.');render();
  });
}
function remindSurvey(si){
  var sv=SV[si];if(!sv)return;
  if(sv.status==='Approved'){alert('Already approved.');return;}
  var note=(el('mgmtSugNote')&&el('mgmtSugNote').value)||sv.mgmtSuggestionsNote||'';
  if(!confirm('Send Reminder to HOD with suggestion (HOD + system + Management notes)?'))return;
  api('periodicalSurveyRemind',{surveyId:sv.id,mgmtSuggestionsNote:note}).then(function(res){
    var s=res.s||res.status,j=res.j||res.body||{};
    if(s!==200){alert(j.error||'Could not send reminder.');return;}
    applySurvey(j.survey);alert('Reminder to HOD with suggestion sent.');render();
  });
}
function reopenSurvey(si){
  var sv=SV[si];if(!sv)return;
  if(!confirm('Reopen this case so the HOD can edit and submit again?'))return;
  api('periodicalSurveyReopen',{surveyId:sv.id}).then(function(res){
    var s=res.s||res.status,j=res.j||res.body||{};
    if(s!==200){alert(j.error||'Could not reopen.');return;}
    if(j.surveys)SV=j.surveys; else applySurvey(j.survey);
    alert('Reopened — HOD can edit and submit again.');
    render();
  });
}
function deleteSurvey(si){
  var sv=SV[si];if(!sv)return;
  if(!IS_MGMT){alert('Only Management can delete surveys.');return;}
  var name=sv.company||'(unnamed)';
  if(!confirm('Permanently delete this survey?\\n\\n'+name+'\\n\\nUse this for test surveys. This cannot be undone.'))return;
  if(!confirm('Delete forever: '+name+' ?'))return;
  api('periodicalSurveyDelete',{surveyId:sv.id}).then(function(res){
    var s=res.s||res.status,j=res.j||res.body||{};
    if(s!==200){alert(j.error||'Could not delete.');return;}
    if(j.surveys)SV=j.surveys;
    else SV=SV.filter(function(x){return x.id!==sv.id;});
    SV_VIEW='list';SV_EDIT=-1;
    alert('Survey deleted.');
    render();
  });
}
function generateSurveyAi(si){
  var sv=SV[si];if(!sv)return;
  if(!confirm('Generate professional report from checklist and site inputs?'))return;
  api('periodicalSurveyGenerateAi',{survey:sv}).then(function(res){
    var s=res.s||res.status,j=res.j||res.body||{};
    if(s!==200){alert(j.error||'Could not generate report.');return;}
    sv.executiveSummary=j.executiveSummary||'';sv.riskAnalysis=j.riskAnalysis||'';sv.manningSuggestion=j.manning||'';sv.equipmentSuggestions=j.equipment||'';sv.uniformRequirements=j.uniformRequirements||'';sv.securityRecommendations=j.securityRecommendations||'';sv.recommendations=j.recommendations||'';
    if(j.systemSuggestions)sv.systemSuggestions=j.systemSuggestions;
    SV_TAB='report';render();
    alert(j.aiUsed?'Professional report generated.':'Report generated (built-in rules).');
  });
}
function generateSystemSuggestion(si){
  var sv=SV[si];if(!sv)return;
  if(!(sv.hodSuggestions||'').trim()){alert('Write HOD suggestions first.');return;}
  if(!confirm('Generate system suggestion after reviewing the survey and HOD suggestions?'))return;
  api('periodicalSurveyGenerateAi',{survey:sv}).then(function(res){
    var s=res.s||res.status,j=res.j||res.body||{};
    if(s!==200){alert(j.error||'Could not generate system suggestion.');return;}
    sv.systemSuggestions=j.systemSuggestions||'';
    if(j.executiveSummary&&!sv.executiveSummary)sv.executiveSummary=j.executiveSummary;
    if(j.riskAnalysis&&!sv.riskAnalysis)sv.riskAnalysis=j.riskAnalysis;
    if(j.manning&&!sv.manningSuggestion)sv.manningSuggestion=j.manning;
    if(j.equipment&&!sv.equipmentSuggestions)sv.equipmentSuggestions=j.equipment;
    if(j.uniformRequirements&&!sv.uniformRequirements)sv.uniformRequirements=j.uniformRequirements;
    if(j.securityRecommendations&&!sv.securityRecommendations)sv.securityRecommendations=j.securityRecommendations;
    SV_TAB='hod';render();
    alert(j.aiUsed?'System suggestion added.':'System suggestion added (built-in rules). Review Final report with suggestion, then Send for approval.');
  });
}
function openClientReport(si){
  var sv=SV[si];if(!sv)return;
  var ready=IS_STAFF
    ? api('periodicalSurveySave',{surveys:SV,branchId:branchId()}).then(function(saveRes){
        var s=saveRes.s||saveRes.status,j=saveRes.j||saveRes.body||{};
        if(s!==200){alert(j.error||'Please save survey first.');return null;}
        if(j.surveys)SV=j.surveys;
        return true;
      })
    : Promise.resolve(true);
  ready.then(function(ok){
    if(!ok)return null;
    return api('periodicalSurveyClientReport',{surveyId:sv.id,survey:sv});
  }).then(function(res){
    if(!res)return;
    var s=res.s||res.status,j=res.j||res.body||{};
    if(s!==200){alert(j.error||'Could not build report.');return;}
    var w=window.open('','_blank');if(!w){alert('Please allow pop-ups to open the client report.');return;}
    w.document.write(j.html);w.document.close();
    if(typeof markHdfcPage15Reviewed==='function')markHdfcPage15Reviewed(si);
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
function surveyShareText(sv){
  var total=svGrandTotal(sv),band=svRiskBand(total);
  return 'Dear Sir / Madam,\\n\\nPlease find attached the Periodical Security Survey Report for '+(sv.company||'your site')+'.\\n'+(sv.periodLabel?('Period: '+sv.periodLabel+'\\n'):'')+'\\nRisk Score: '+total+'/180 ('+band.level+')\\nSurvey Date: '+(sv.surveyDate||'—')+'\\nSurveyed By: '+(sv.surveyedBy||'—')+'\\n\\nAttachments:\\n1. Periodical Security Survey Report\\n2. Site Inputs & Photos\\n3. Risk Assessment\\n\\nWe seek your kind support and input on this report for implementation.\\n\\nRegards,\\nAgile Security Force';
}
function openShare(si){
  var sv=SV[si];if(!sv)return;
  SHARE_SI=si;SHARE_MODE='share';
  if(el('shareTitle'))el('shareTitle').textContent='Share Site Security Assessment (SSA) by Email';
  if(el('shareHint'))el('shareHint').textContent='Type the client email in TO. Attachments: colourful report + Site Inputs & Photos + Risk Assessment. Surveyor and Director are copied.';
  el('shareTo').value=sv.contactEmail||'';
  el('shareCc').value='';
  el('shareSub').value='Periodical Security Survey Report — '+(sv.company||'Site');
  el('shareBody').value=surveyShareText(sv);
  el('psMailPanel').classList.remove('hidden');
}
function openSendToClient(si){
  var sv=SV[si];if(!sv)return;
  if(sv.status!=='Approved'){alert('Director must Approve first. Then HOD can Send to client.');return;}
  if(sv.sentToClientAt){alert('Already sent to client.');return;}
  SHARE_SI=si;SHARE_MODE='client';
  if(el('shareTitle'))el('shareTitle').textContent='Send to client — Final report + Photos';
  if(el('shareHint'))el('shareHint').textContent='Enter client TO email and CC emails. Report with suggestions goes as mail; photos as attachments. Automatically copied to HOD, sridhar.m@agilegroup.co.in and Director.';
  el('shareTo').value=sv.contactEmail||'';
  el('shareCc').value='';
  el('shareSub').value='HDFC Site Security Assessment (SSA) Report — '+(sv.company||'Site');
  el('shareBody').value='Dear Sir / Madam,\\n\\nPlease find attached the HDFC Site Security Assessment (SSA) final report with suggestions for '+(sv.company||'your branch')+'.\\n\\nRegards,\\nAgile Security Force';
  el('psMailPanel').classList.remove('hidden');
}
function closeShare(){el('psMailPanel').classList.add('hidden');SHARE_SI=-1;SHARE_MODE='share';}
function sendShareMail(){
  var si=SHARE_SI,sv=SV[si];if(!sv)return;
  var to=(el('shareTo').value||'').trim();
  if(!to||to.indexOf('@')<0){alert('Please type the client email in TO first.');return;}
  var btn=el('shareSendBtn');if(btn){btn.disabled=true;btn.textContent='Sending…';}
  var action=SHARE_MODE==='client'?'periodicalSurveySendToClient':'periodicalSurveySendMail';
  var payload=SHARE_MODE==='client'
    ? {surveyId:sv.id,to:to,cc:el('shareCc').value,subject:el('shareSub').value}
    : {surveyId:sv.id,survey:sv,to:to,cc:el('shareCc').value,subject:el('shareSub').value,body:el('shareBody').value,surveyorEmail:sv.surveyorEmail};
  var ready=IS_STAFF?api('periodicalSurveySave',{surveys:SV,branchId:branchId()}):Promise.resolve({s:200,j:{}});
  ready.then(function(){
    return api(action,payload);
  }).then(function(res){
    if(btn){btn.disabled=false;btn.textContent='Send Email';}
    var s=res.s||res.status,j=res.j||res.body||{};
    if(s===200){
      if(j.surveys)SV=j.surveys; else if(j.survey){var ix=SV.findIndex(function(x){return x.id===j.survey.id;});if(ix>=0)SV[ix]=j.survey;}
      alert(SHARE_MODE==='client'?('Sent to client. Photos attached: '+(j.photos||0)+'. Management list will show Sent to client by HOD.'):'Email sent.');
      closeShare();render();
    }
    else alert(j.error||'Could not send email.');
  }).catch(function(){
    if(btn){btn.disabled=false;btn.textContent='Send Email';}
    alert('Network error. Please check your internet.');
  });
}
function onStdSurveyedBy(si,val){
  if(!SV[si])return;
  SV[si].surveyedBy=val==='Name not available'?'':(val||'');
  var hit=typeof ssaFindPerson==='function'?ssaFindPerson(val):null;
  if(hit&&hit.email)SV[si].surveyorEmail=hit.email;
  render();
}
function onStdSurveyorEmail(si,val){
  if(!SV[si])return;
  if(val==='__other__')return;
  SV[si].surveyorEmail=val||'';
}
function applyBoot(j){
  SV=j.surveys||[];
  CLIENTS=j.clients||[];
  BRANCHES=j.branches||[];
  OPS_TEAM=j.opsTeam||[];
  SSA_DIR=j.ssaDirectory||{operations:[],hods:[]};
  SURVEY_TPL=j.surveyTemplate||{parts:[],contractStart:[],industries:[]};
  INDUSTRIES=j.industries||SURVEY_TPL.industries||[];
  if(!IS_STAFF)fillBranches();
  setSsaMode('hdfc');
}
function bootPeriodicalSurvey(){
  api('periodicalSurveyBoot',{branchId:branchId()}).then(function(res){
    var s=res.s||res.status,j=res.j||res.body||{};
    if(s!==200){var box=el('psContent');if(box)box.innerHTML='<div class="m-card">'+(j.error||'Could not load surveys.')+'</div>';return;}
    applyBoot(j);
  }).catch(function(){
    var box=el('psContent');if(box)box.innerHTML='<div class="m-card">Could not load surveys — check your internet and refresh.</div>';
  });
}
`
}

export function periodicalSurveyStaffBootScript(): string {
  return `
function initStaffPage(j){
  STAFF_BRANCH_ID=(j&&j.branchId)||(typeof staffResolveBranchId==='function'?staffResolveBranchId():'');
  STAFF_BRANCH_NAME=(j&&j.branchName)||(typeof staffBranchLabel==='function'?staffBranchLabel():'');
  BRANCH_ID=STAFF_BRANCH_ID;
  bootPeriodicalSurvey();
}
`
}
