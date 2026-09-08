/**
 * Public no-login Site Security Visit Report — Day / Night Check.
 * Visit observations & lapses (same Night Visit family) — not an SSA assessment.
 */

import { suiteAppOpenPageFooterInlineHtml } from '../suite-app-footer.js'

export function siteVisitReportPublicPageHtml(): string {
  const footer = suiteAppOpenPageFooterInlineHtml()
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Site Security Visit Report: Day / Night Check — Agile Security Force Private Limited</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:linear-gradient(160deg,#0b1220,#14224f 55%,#1e3a6e);color:#e2e8f0;min-height:100vh;min-height:100dvh;padding:14px 14px calc(28px + env(safe-area-inset-bottom,0px));-webkit-text-size-adjust:100%}
.wrap{max-width:820px;margin:0 auto}
@media(min-width:900px){.wrap{max-width:1100px}.m-inp,select.m-inp{min-height:52px}}
.hdr{text-align:center;margin-bottom:16px}
.hdr img{height:56px;background:transparent}
.hdr .co{color:#fde68a;font-size:15px;font-weight:800;margin-top:10px;letter-spacing:.02em;line-height:1.35}
.hdr h1{color:#fff;font-size:20px;margin-top:8px;font-weight:800;line-height:1.35}
.hdr p{color:#94a3b8;font-size:14px;margin-top:6px;line-height:1.5}
.instruct{background:#0b1a33;border:1px solid #38bdf8;border-radius:12px;padding:12px 14px;margin:0 0 14px;color:#e2e8f0;font-size:14px;line-height:1.55}
.instruct b{color:#7dd3fc}
.m-card{background:linear-gradient(180deg,#111a30,#0e1730);border:1px solid #475569;border-radius:14px;padding:16px;margin-bottom:12px;box-shadow:0 10px 28px rgba(0,0,0,.3)}
.m-lbl{display:block;font-size:13px;color:#94a3b8;margin:0 0 4px;font-weight:700}
.m-inp,select.m-inp,textarea.m-inp{width:100%;padding:12px;border:1px solid #475569;border-radius:9px;background:#0b1220;color:#fff;font-size:16px;min-height:48px}
textarea.m-inp{min-height:88px;resize:vertical}
.hint{font-size:13px;color:#94a3b8;line-height:1.5;margin-top:4px}
.m-btn{display:inline-flex;align-items:center;justify-content:center;padding:14px 16px;border:none;border-radius:10px;font-weight:800;font-size:15px;cursor:pointer;color:#14224f;min-height:48px;-webkit-tap-highlight-color:transparent}
.m-btn-block{width:100%;display:flex}
.m-btn-green{background:linear-gradient(135deg,#15803d,#4ade80)}
.m-btn-gold{background:linear-gradient(135deg,#b45309,#f59e0b)}
.m-btn-navy{background:linear-gradient(135deg,#1e3a8a,#38bdf8);color:#fff}
.m-btn-grey{background:#334155;color:#e2e8f0}
.m-savebar{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;padding:12px 0 calc(12px + env(safe-area-inset-bottom,0px));position:sticky;bottom:0;background:linear-gradient(180deg,transparent,#0b1220 28%);z-index:5}
.chk{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px}
.chk label{display:inline-flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid #334155;border-radius:10px;background:#0b1220;min-height:44px;cursor:pointer;font-size:14px;font-weight:700}
.chk input{width:18px;height:18px}
.sec{display:none}.sec.on{display:block}
.tabs{display:flex;flex-wrap:nowrap;gap:8px;margin:10px 0;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:6px}
.tab{flex:0 0 auto;padding:10px 12px;border-radius:8px;background:#1e293b;border:1px solid #334155;font-size:13px;font-weight:700;color:#cbd5e1;cursor:pointer;min-height:44px;white-space:nowrap}
.tab.on{background:#14532d;border-color:#4ade80;color:#fff}
.post{border:1px solid #22304f;border-radius:10px;padding:12px;margin:10px 0;background:#0b1220}
.msg{padding:10px;border-radius:8px;font-size:14px;margin-top:10px;display:none;background:#3a0a0a;color:#f87171}
.okbox{display:none;text-align:center;padding:20px 12px}
.thanks{font-size:28px;font-weight:900;color:#86efac;margin:8px 0}
.preview{max-width:100%;max-height:180px;border-radius:8px;margin-top:8px;display:none}
.day-only,.night-only{display:none}
.day-only.on,.night-only.on{display:block}
@media(max-width:520px){.hdr img{height:48px}.m-card{padding:14px;border-radius:12px}}
</style></head>
<body>
<div class="wrap">
  <div class="hdr">
    <img src="https://www.agilegroup-digital.co.in/agile-logo-clear.png" alt="Agile" onerror="this.src='https://www.agilegroup-digital.co.in/agile-logo.png'">
    <div class="co">Agile Security Force Private Limited</div>
    <h1>Site Security Visit Report: Day / Night Check</h1>
    <p>Start at the unit (Allow location). Answers <b>auto-save</b>. If the phone is hard, finish on a <b>computer</b> with the continue code. Every branch, including Kochi. Submit to HOD when done. This is a visit report (not an assessment).</p>
  </div>

  <div class="instruct">
    <b>Inspecting Officer</b> — record attendance, turnout, post checks, lighting / day movement, client feedback, photos, and corrective actions. This is a <b>visit report</b> for observations and lapses.
  </div>

  <div id="setupCard" class="m-card">
    <b style="color:#fde68a;font-size:16px">Start Visit</b>
    <p class="hint" style="margin-top:8px">1) Branch · 2) Target Unit · 3) Day or Night · 4) Officer details · then tap <b>Start Visit</b>.</p>
    <div style="margin-top:12px"><label class="m-lbl">Branch *</label>
      <select class="m-inp" id="pubBranch"><option value="">— select branch —</option></select></div>
    <div style="margin-top:12px"><label class="m-lbl">Target Unit / Site Name *</label>
      <select class="m-inp" id="pubClient" disabled><option value="">— pick branch first —</option></select></div>
    <div style="margin-top:12px"><label class="m-lbl">Type of Visit *</label>
      <div class="chk">
        <label><input type="radio" name="visitType" value="day" checked> Day Check</label>
        <label><input type="radio" name="visitType" value="night"> Night Check</label>
      </div>
    </div>
    <div style="margin-top:12px"><label class="m-lbl">Inspecting Officer Name *</label>
      <input class="m-inp" id="pubName" placeholder="Type your full name" autocomplete="name"></div>
    <div style="margin-top:12px"><label class="m-lbl">Designation / Role *</label>
      <input class="m-inp" id="pubDesig" placeholder="e.g. Operations Manager"></div>
    <div style="margin-top:12px"><label class="m-lbl">Email ID</label>
      <input class="m-inp" id="pubEmail" type="email" placeholder="name@example.com" autocomplete="email"></div>
    <div style="margin-top:12px"><label class="m-lbl">WhatsApp Number</label>
      <input class="m-inp" id="pubWa" type="tel" inputmode="numeric" placeholder="10-digit mobile" autocomplete="tel"></div>
    <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div><label class="m-lbl">Date</label><input class="m-inp" type="date" id="pubDate"></div>
      <div><label class="m-lbl">Time</label><input class="m-inp" type="time" id="pubTime"></div>
    </div>
    <p class="hint" style="margin-top:14px;padding:10px 12px;border:1px solid #334155;border-radius:10px;background:#0f172a;color:#e2e8f0;line-height:1.5">
      <b style="color:#86efac">Important:</b> Ensure the <b>Start Visit</b> button is only pressed upon arrival at the site. The system logs the user's geolocation at the time of initiation. When the permission prompt appears, select <b>Allow</b> to enable unit location.
    </p>
    <div style="margin-top:14px"><button type="button" class="m-btn m-btn-green m-btn-block" id="btnStart" onclick="startVisit()">Start Visit</button></div>
    <div id="setupErr" class="msg"></div>
    <div class="m-card" style="margin-top:16px;border-color:#38bdf8">
      <b style="color:#7dd3fc">Continue on a computer</b>
      <p class="hint" style="margin-top:8px">Started at the unit on the phone? Type the continue code here (no location needed).</p>
      <div style="margin-top:10px"><label class="m-lbl">Continue code</label>
        <input class="m-inp" id="pubResumeCode" maxlength="12" placeholder="8 letters / numbers" autocomplete="off" style="text-transform:uppercase"></div>
      <div style="margin-top:10px"><button type="button" class="m-btn m-btn-navy m-btn-block" id="btnResume" onclick="continueVisitByCode()">Open saved visit</button></div>
    </div>
    <div style="margin-top:10px;display:none" id="pubGeoWrap"><div id="pubGeoTip" class="hint" style="color:#7dd3fc;margin:0"></div></div>
  </div>

  <div id="formRoot" style="display:none">
    <div class="tabs" id="secTabs"></div>
    <div id="secBody"></div>
    <div class="m-savebar">
      <button type="button" class="m-btn m-btn-grey" onclick="prevSec()">Previous</button>
      <button type="button" class="m-btn m-btn-gold" onclick="saveVisitDraft()">Save draft</button>
      <button type="button" class="m-btn m-btn-navy" onclick="nextSec()">Next</button>
      <button type="button" class="m-btn m-btn-green" id="btnSubmit" onclick="submitVisit()">Submit to HOD</button>
      <p class="hint" id="visitSaveTip" style="width:100%;text-align:center;margin-top:6px"></p>
      <p class="hint" id="visitResumeBox" style="width:100%;text-align:center;color:#7dd3fc;margin-top:6px"></p>
    </div>
  </div>

  <div id="okCard" class="m-card okbox">
    <div style="font-size:48px;line-height:1">✅</div>
    <div class="thanks">Thank you!</div>
    <p style="color:#cbd5e1;line-height:1.55" id="okMsg">Visit report submitted to HOD.</p>
    <p class="hint" style="margin-top:12px">HOD / Management will see this under Site Security Visit Report (Day / Night Check).</p>
    <button type="button" class="m-btn m-btn-navy" style="margin-top:16px" onclick="location.reload()">Report another unit</button>
  </div>

  ${footer}
</div>
<script>
var API='/api/mis/site-visit-report-public';
var BRANCHES=[],CLIENTS=[],R=null,SEC=1,GEO=null;
function el(id){return document.getElementById(id);}
function showErr(msg){var e=el('setupErr');e.style.display='block';e.textContent=msg;}
function visitType(){var x=document.querySelector('input[name=visitType]:checked');return x?x.value:'day';}
function todayYmd(){try{var d=new Date();var p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);return p;}catch(e){return new Date().toISOString().slice(0,10);}}
function nowHm(){try{return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());}catch(e){return '12:00';}}
function fillNow(){if(el('pubDate')&&!el('pubDate').value)el('pubDate').value=todayYmd();if(el('pubTime')&&!el('pubTime').value)el('pubTime').value=nowHm();}
function setPubGeoTip(msg,ok){var wrap=el('pubGeoWrap');if(wrap)wrap.style.display=msg?'block':'none';var t=el('pubGeoTip');if(!t)return;t.textContent=msg||'';t.style.color=ok===false?'#fbbf24':(ok?'#86efac':'#7dd3fc');}
function captureGeo(){
  return new Promise(function(resolve){
    if(!navigator.geolocation){setPubGeoTip('Location not available on this phone — visit can continue.',false);resolve({lat:null,lng:null,accuracy:null,at:'',status:'unavailable'});return;}
    setPubGeoTip('Getting site location… please Allow when asked.',null);
    navigator.geolocation.getCurrentPosition(function(pos){
      var lat=pos.coords.latitude,lng=pos.coords.longitude,acc=pos.coords.accuracy;
      setPubGeoTip('Location saved: '+lat.toFixed(5)+', '+lng.toFixed(5),true);
      resolve({lat:lat,lng:lng,accuracy:acc,at:new Date().toISOString(),status:'ok'});
    },function(err){
      var st=err&&err.code===1?'denied':'unavailable';
      setPubGeoTip(st==='denied'?'Location not shared — visit can continue.':'Could not get location — visit can continue.',false);
      resolve({lat:null,lng:null,accuracy:null,at:'',status:st});
    },{enableHighAccuracy:true,timeout:20000,maximumAge:0});
  });
}
function choice(name,opts,cur){
  var h='<div class="chk">';
  opts.forEach(function(o){h+='<label><input type="radio" name="'+name+'" value="'+o.v+'"'+(cur===o.v?' checked':'')+'> '+o.l+'</label>';});
  return h+'</div>';
}
function valRadio(name){var x=document.querySelector('input[name="'+name+'"]:checked');return x?x.value:'';}
function fld(label,html){return '<div style="margin-top:12px"><label class="m-lbl">'+label+'</label>'+html+'</div>';}
function emptyPost(){return {postName:'',guardsDeployed:'',jobKnowledge:'',registers:'',ojtConducted:''};}
function renderTabs(){
  var t=el('secTabs'),h='';
  for(var i=1;i<=10;i++)h+='<button type="button" class="tab'+(SEC===i?' on':'')+'" onclick="goSec('+i+')">'+i+'</button>';
  t.innerHTML=h;
}
function renderPosts(){
  if(!R.posts||!R.posts.length)R.posts=[emptyPost()];
  var h='';
  R.posts.forEach(function(p,i){
    h+='<div class="post"><b style="color:#fde68a">Post '+(i+1)+'</b>';
    h+=fld('Post Name / Location','<input class="m-inp" data-post="'+i+'" data-k="postName" value="'+(p.postName||'').replace(/"/g,'&quot;')+'" placeholder="e.g. Main Gate">');
    h+=fld('Guards Deployed (number and names)','<input class="m-inp" data-post="'+i+'" data-k="guardsDeployed" value="'+(p.guardsDeployed||'').replace(/"/g,'&quot;')+'">');
    h+=fld('Job Knowledge Check',choice('jobKnowledge_'+i,[{v:'Excellent',l:'Excellent'},{v:'Satisfactory',l:'Satisfactory'},{v:'Needs Improvement',l:'Needs Improvement'}],p.jobKnowledge));
    h+=fld('Records / Registers Maintained',choice('registers_'+i,[{v:'Up to Date',l:'Up to Date'},{v:'Incomplete',l:'Incomplete'}],p.registers));
    h+=fld('On-the-Job Training (OJT) Conducted',choice('ojtConducted_'+i,[{v:'Yes',l:'Yes'},{v:'No',l:'No'}],p.ojtConducted));
    if(R.posts.length>1)h+='<button type="button" class="m-btn m-btn-grey" style="margin-top:8px" onclick="removePost('+i+')">Remove post</button>';
    h+='</div>';
  });
  h+='<button type="button" class="m-btn m-btn-gold" onclick="addPost()">+ Add post</button>';
  return h;
}
function syncPostsFromDom(){
  if(!R)return;
  document.querySelectorAll('[data-post]').forEach(function(inp){
    var i=Number(inp.getAttribute('data-post'));var k=inp.getAttribute('data-k');
    if(!R.posts[i])R.posts[i]=emptyPost();R.posts[i][k]=inp.value;
  });
  R.posts.forEach(function(p,i){
    p.jobKnowledge=valRadio('jobKnowledge_'+i)||p.jobKnowledge;
    p.registers=valRadio('registers_'+i)||p.registers;
    p.ojtConducted=valRadio('ojtConducted_'+i)||p.ojtConducted;
  });
}
function addPost(){syncPostsFromDom();R.posts.push(emptyPost());renderSec();}
function removePost(i){syncPostsFromDom();R.posts.splice(i,1);if(!R.posts.length)R.posts=[emptyPost()];renderSec();}
function syncForm(){
  if(!R)return;
  syncPostsFromDom();
  R.clientRepMet=(el('f_clientRep')||{}).value||'';
  R.unitLocation=(el('f_unitLoc')||{}).value||R.unitLocation;
  R.sanctionedStrength=(el('f_san')||{}).value||'';
  R.actualStrength=(el('f_act')||{}).value||'';
  R.attendanceMode=valRadio('attendanceMode')||R.attendanceMode;
  R.verificationStatus=valRadio('verificationStatus')||R.verificationStatus;
  R.verificationNote=(el('f_verNote')||{}).value||'';
  R.turnout=valRadio('turnout')||R.turnout;
  R.idCardDisplayed=valRadio('idCardDisplayed')||R.idCardDisplayed;
  R.accessControl=valRadio('accessControl')||R.accessControl;
  R.wagesStatus=valRadio('wagesStatus')||R.wagesStatus;
  R.grievances=valRadio('grievances')||R.grievances;
  R.enRouteRisk=(el('f_enRoute')||{}).value||'';
  R.visitorMaterialLog=valRadio('visitorMaterialLog')||R.visitorMaterialLog;
  R.lighting=valRadio('lighting')||R.lighting;
  R.guardAlertness=valRadio('guardAlertness')||R.guardAlertness;
  R.qrDisplayed=valRadio('qrDisplayed')||R.qrDisplayed;
  R.emergencyNumbers=valRadio('emergencyNumbers')||R.emergencyNumbers;
  R.clientFeedback=(el('f_feedback')||{}).value||'';
  R.clientSatisfaction=valRadio('clientSatisfaction')||R.clientSatisfaction;
  R.overallStatus=valRadio('overallStatus')||R.overallStatus;
  R.keyObservations=(el('f_obs')||{}).value||'';
  R.correctiveActions=(el('f_corr')||{}).value||'';
  R.officerSignature=(el('f_sign')||{}).value||'';
  R.submittedToHodDate=(el('f_subDate')||{}).value||'';
  R.hodReviewStatus=valRadio('hodReviewStatus')||R.hodReviewStatus;
  R.forwardedToClientOn=(el('f_fwdDate')||{}).value||'';
  R.visitDate=(el('pubDate')||{}).value||R.visitDate;
  R.visitTime=(el('pubTime')||{}).value||R.visitTime;
  R.designation=(el('pubDesig')||{}).value||R.designation;
}
function photoBox(key,label){
  return fld(label,'<input class="m-inp" type="file" accept="image/*" capture="environment" onchange="onPhoto(\\''+key+'\\',this)"><img class="preview" id="prev_'+key+'" alt="">');
}
function onPhoto(key,inp){
  var f=inp.files&&inp.files[0];if(!f||!R)return;
  if(f.size>900000){alert('Photo is too large. Use a smaller image.');inp.value='';return;}
  var reader=new FileReader();
  reader.onload=function(){R[key]=String(reader.result||'');VISIT_PHOTOS_OK=false;var img=el('prev_'+key);if(img){img.src=R[key];img.style.display='block';}scheduleVisitSave();};
  reader.readAsDataURL(f);
}
function renderSec(){
  renderTabs();
  var vt=R.visitType||'day';
  var h='';
  if(SEC===1){
    h+='<div class="m-card sec on"><h3 style="color:#fde68a">1. General Visit Information</h3>';
    h+='<p class="hint">Type: <b>'+(vt==='night'?'Night Check':'Day Check')+'</b> · Date: <b>'+(R.visitDate||'—')+'</b> · Time: <b>'+(R.visitTime||'—')+'</b></p>';
    h+=fld('Inspecting Officer Name','<input class="m-inp" value="'+(R.officerName||'').replace(/"/g,'&quot;')+'" readonly>');
    h+=fld('Designation / Role','<input class="m-inp" id="pubDesig" value="'+(R.designation||'').replace(/"/g,'&quot;')+'">');
    h+=fld('Branch Office','<input class="m-inp" value="'+(R.branchOffice||'').replace(/"/g,'&quot;')+'" readonly>');
    h+=fld('Target Unit / Site Name','<input class="m-inp" value="'+(R.unitName||'').replace(/"/g,'&quot;')+'" readonly>');
    h+=fld('Unit Location / Address','<input class="m-inp" id="f_unitLoc" value="'+(R.unitLocation||'').replace(/"/g,'&quot;')+'">');
    h+=fld('Client Representative Met (Name & Designation)','<input class="m-inp" id="f_clientRep" value="'+(R.clientRepMet||'').replace(/"/g,'&quot;')+'">');
    h+='</div>';
  } else if(SEC===2){
    h+='<div class="m-card sec on"><h3 style="color:#fde68a">2. Force Strength & Attendance Verification</h3>';
    h+=fld('Sanctioned Guard Strength','<input class="m-inp" id="f_san" inputmode="numeric" value="'+(R.sanctionedStrength||'')+'">');
    h+=fld('Actual Guard Strength Present','<input class="m-inp" id="f_act" inputmode="numeric" value="'+(R.actualStrength||'')+'">');
    h+=fld('Attendance Mode',choice('attendanceMode',[{v:'Physical Register',l:'Physical Register'},{v:'Biometric',l:'Biometric'},{v:'App-Based',l:'App-Based'}],R.attendanceMode));
    h+=fld('Verification Status',choice('verificationStatus',[{v:'Verified & Correct',l:'Verified & Correct'},{v:'Discrepancy Found',l:'Discrepancy Found'}],R.verificationStatus));
    h+=fld('Discrepancy / note details','<textarea class="m-inp" id="f_verNote">'+(R.verificationNote||'')+'</textarea>');
    h+='</div>';
  } else if(SEC===3){
    h+='<div class="m-card sec on"><h3 style="color:#fde68a">3. Personnel Standard & Compliance Check</h3>';
    h+=fld('Guard Turnout & Uniform',choice('turnout',[{v:'Satisfactory',l:'Satisfactory'},{v:'Unsatisfactory',l:'Unsatisfactory'}],R.turnout));
    h+=fld('ID Card Displayed',choice('idCardDisplayed',[{v:'Yes',l:'Yes'},{v:'No',l:'No'}],R.idCardDisplayed));
    h+=fld('Access Control & Gate House Procedures',choice('accessControl',[{v:'Followed Properly',l:'Followed Properly'},{v:'Lapses Noticed',l:'Lapses Noticed'}],R.accessControl));
    h+=fld('Wages Status',choice('wagesStatus',[{v:'Confirmed Received on Time',l:'Confirmed Received on Time'},{v:'Pending / Issues Reported',l:'Pending / Issues Reported'}],R.wagesStatus));
    h+=fld('Guards Grievances Noted',choice('grievances',[{v:'Nil',l:'Nil'},{v:'Recorded',l:'Recorded (See remarks)'}],R.grievances));
    h+='</div>';
  } else if(SEC===4){
    h+='<div class="m-card sec on"><h3 style="color:#fde68a">4. Post-by-Post Inspection & Job Knowledge</h3>';
    h+='<p class="hint">Repeat for each operational post.</p>'+renderPosts()+'</div>';
  } else if(SEC===5){
    h+='<div class="m-card sec on"><h3 style="color:#fde68a">5. Specialized Security Checks (Day vs Night)</h3>';
    if(vt==='day'){
      h+='<div class="day-only on"><b style="color:#7dd3fc">Day Check</b>';
      h+=fld('En-route Risk Assessment','<textarea class="m-inp" id="f_enRoute" placeholder="Route security, traffic, access routes">'+(R.enRouteRisk||'')+'</textarea>');
      h+=fld('Visitor & Material Movement Log Check',choice('visitorMaterialLog',[{v:'Checked & Verified',l:'Checked & Verified'}],R.visitorMaterialLog||'Checked & Verified'));
      h+='</div>';
    } else {
      h+='<div class="night-only on"><b style="color:#7dd3fc">Night Check</b>';
      h+=fld('Lighting & Illumination Adequacy',choice('lighting',[{v:'Adequate',l:'Adequate'},{v:'Deficient / Blind Spots Found',l:'Deficient / Blind Spots Found'}],R.lighting));
      h+=fld('Guard Safety & Alertness Measures',choice('guardAlertness',[{v:'Ensured & Satisfactory',l:'Ensured & Satisfactory'}],R.guardAlertness||'Ensured & Satisfactory'));
      h+='</div>';
    }
    h+='</div>';
  } else if(SEC===6){
    h+='<div class="m-card sec on"><h3 style="color:#fde68a">6. Statutory & Safety Displays</h3>';
    h+=fld('QR Code & Link Displayed',choice('qrDisplayed',[{v:'Yes',l:'Yes'},{v:'No / Damaged',l:'No / Damaged'}],R.qrDisplayed));
    h+=fld('Emergency Contact Numbers Displayed',choice('emergencyNumbers',[{v:'Yes',l:'Yes'},{v:'No / Unclear',l:'No / Unclear'}],R.emergencyNumbers));
    h+='</div>';
  } else if(SEC===7){
    h+='<div class="m-card sec on"><h3 style="color:#fde68a">7. Client Feedback & Interaction</h3>';
    h+=fld('Client Feedback Summary','<textarea class="m-inp" id="f_feedback" placeholder="Security performance, team conduct, service gaps">'+(R.clientFeedback||'')+'</textarea>');
    h+=fld('Client Satisfaction Level',choice('clientSatisfaction',[{v:'High',l:'High'},{v:'Moderate',l:'Moderate'},{v:'Low',l:'Low'}],R.clientSatisfaction));
    h+='</div>';
  } else if(SEC===8){
    h+='<div class="m-card sec on"><h3 style="color:#fde68a">8. Photographic Evidence & Geolocation Log</h3>';
    if(R.geoLat!=null&&R.geoLng!=null)h+='<p class="hint"><b>GPS:</b> '+Number(R.geoLat).toFixed(5)+', '+Number(R.geoLng).toFixed(5)+'</p>';
    else h+='<p class="hint">GPS not captured (permission denied or unavailable).</p>';
    h+=photoBox('photoSelfie','Officer Selfie / Proof of Presence');
    h+=photoBox('photoSite1','Site / Post Snapshot 1 (Turnout / Post)');
    h+=photoBox('photoSite2','Site / Post Snapshot 2 (Lighting / Deficiency if any)');
    ;['photoSelfie','photoSite1','photoSite2'].forEach(function(k){/* preview after render */});
    h+='</div>';
  } else if(SEC===9){
    h+='<div class="m-card sec on"><h3 style="color:#fde68a">9. Summary Remarks & Corrective Actions</h3>';
    h+=fld('Overall Unit Security Status',choice('overallStatus',[{v:'Satisfactory',l:'Satisfactory'},{v:'Requires Immediate Attention',l:'Requires Immediate Attention'}],R.overallStatus));
    h+=fld('Key Observations / Gaps','<textarea class="m-inp" id="f_obs">'+(R.keyObservations||'')+'</textarea>');
    h+=fld('Corrective Actions Assigned','<textarea class="m-inp" id="f_corr">'+(R.correctiveActions||'')+'</textarea>');
    h+='</div>';
  } else {
    h+='<div class="m-card sec on"><h3 style="color:#fde68a">10. Report Sign-Off & Submission</h3>';
    h+=fld('Inspecting Officer Signature (type full name)','<input class="m-inp" id="f_sign" value="'+(R.officerSignature||R.officerName||'').replace(/"/g,'&quot;')+'">');
    h+=fld('Date of Submission to HOD','<input class="m-inp" type="date" id="f_subDate" value="'+(R.submittedToHodDate||todayYmd())+'">');
    h+=fld('HOD Review Status (for HOD later)',choice('hodReviewStatus',[{v:'',l:'Pending'},{v:'Approved',l:'Approved'},{v:'Returned for Revision',l:'Returned for Revision'}],R.hodReviewStatus||''));
    h+=fld('Forwarded to Client On','<input class="m-inp" type="date" id="f_fwdDate" value="'+(R.forwardedToClientOn||'')+'">');
    h+='<p class="hint" style="margin-top:12px">Tap <b>Submit to HOD</b> when the visit report is complete.</p></div>';
  }
  el('secBody').innerHTML=h;
  ;['photoSelfie','photoSite1','photoSite2'].forEach(function(k){
    if(R[k]){var img=el('prev_'+k);if(img){img.src=R[k];img.style.display='block';}}
  });
  window.scrollTo(0,0);
}
function goSec(n){syncForm();scheduleVisitSave();SEC=Math.max(1,Math.min(10,n));renderSec();showVisitCode();}
function prevSec(){goSec(SEC-1);}
function nextSec(){goSec(SEC+1);}
var VISIT_AUTO_T=null,VISIT_BUSY=false,VISIT_AGAIN=false,VISIT_PHOTOS_OK=false;
function showVisitTip(msg,ok){var t=el('visitSaveTip');if(!t)return;t.textContent=msg||'';t.style.color=ok===false?'#fbbf24':(ok?'#86efac':'#94a3b8');}
function showVisitCode(){
  var box=el('visitResumeBox');if(!box||!R)return;
  var code=String(R.publicResumeCode||'').toUpperCase();
  box.innerHTML=code?'Continue on a computer — code <b style="color:#fde68a">'+code+'</b>. Open <b>/mis-site-visit-report</b> and enter it.':'';
}
function visitPayload(action){
  if(!R)return null;
  var keep=VISIT_PHOTOS_OK;
  var p=Object.assign({},R,{action:action||'draft',keepPhotos:keep});
  if(keep){p.photoSelfie='';p.photoSite1='';p.photoSite2='';}
  return p;
}
function saveVisitDraft(done){
  syncForm();
  var payload=visitPayload('draft');
  if(!payload){if(done)done();return;}
  if(VISIT_BUSY){VISIT_AGAIN=true;if(done)done();return;}
  VISIT_BUSY=true;showVisitTip('Saving draft…',null);
  fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j};});})
    .then(function(res){
      VISIT_BUSY=false;
      if(res.ok&&R){
        if(res.j.id)R.id=res.j.id;
        if(res.j.resumeCode)R.publicResumeCode=res.j.resumeCode;
        VISIT_PHOTOS_OK=true;
        try{localStorage.setItem('visitResume',R.publicResumeCode||'');}catch(e){}
        showVisitTip('Draft auto-saved. You can finish on a computer.',true);
        showVisitCode();
      }else showVisitTip((res.j&&res.j.error)||'Auto-save failed — check internet',false);
      if(VISIT_AGAIN){VISIT_AGAIN=false;saveVisitDraft();}
      if(done)done();
    })
    .catch(function(){VISIT_BUSY=false;showVisitTip('Auto-save failed — check internet',false);if(done)done();});
}
function scheduleVisitSave(){
  if(VISIT_AUTO_T)clearTimeout(VISIT_AUTO_T);
  VISIT_AUTO_T=setTimeout(function(){VISIT_AUTO_T=null;saveVisitDraft();},1600);
}
function continueVisitByCode(codeIn){
  var code=String(codeIn||(el('pubResumeCode')&&el('pubResumeCode').value)||'').replace(/[^A-Za-z0-9]/g,'').toUpperCase();
  if(!code){showErr('Type the continue code from the phone.');return;}
  var btn=el('btnResume');if(btn){btn.disabled=true;btn.textContent='Opening…';}
  fetch(API+'?draft=1&code='+encodeURIComponent(code)).then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j};});})
    .then(function(res){
      if(btn){btn.disabled=false;btn.textContent='Open saved visit';}
      if(!res.ok||!res.j.draft){showErr((res.j&&res.j.error)||'No saved visit for that code.');return;}
      R=res.j.draft;VISIT_PHOTOS_OK=true;GEO={lat:R.geoLat,lng:R.geoLng,accuracy:R.geoAccuracy,at:R.geoCapturedAt,status:R.geoStatus};
      el('setupCard').style.display='none';el('okCard').style.display='none';el('formRoot').style.display='block';
      SEC=1;renderSec();showVisitCode();showVisitTip('Opened on computer — continue and Submit to HOD when done.',true);
    })
    .catch(function(){if(btn){btn.disabled=false;btn.textContent='Open saved visit';}showErr('Could not open the saved visit.');});
}
function startVisit(){
  el('setupErr').style.display='none';
  var bid=el('pubBranch').value,cid=el('pubClient').value;
  var name=String(el('pubName').value||'').trim();
  var desig=String(el('pubDesig').value||'').trim();
  fillNow();
  if(!bid){showErr('Pick Branch first.');return;}
  if(!cid){showErr('Pick the Target Unit / Site.');return;}
  if(!name){showErr('Enter Inspecting Officer Name.');return;}
  if(!desig){showErr('Enter Designation / Role.');return;}
  var c=CLIENTS.find(function(x){return x.id===cid;});
  if(!c){showErr('Pick a valid unit.');return;}
  var b=BRANCHES.find(function(x){return x.id===bid;});
  var btn=el('btnStart');if(btn){btn.disabled=true;btn.textContent='Getting location…';}
  captureGeo().then(function(geo){
    GEO=geo;
    if(btn){btn.disabled=false;btn.textContent='Start Visit';}
    R={
      id:'',branchId:bid,clientId:cid,visitType:visitType(),
      visitDate:el('pubDate').value||todayYmd(),visitTime:el('pubTime').value||nowHm(),
      officerName:name,designation:desig,branchOffice:b?b.name:'',unitName:c.name,unitLocation:c.location||'',
      clientRepMet:'',sanctionedStrength:c.sanctionedStrength||'',actualStrength:'',
      attendanceMode:'',verificationStatus:'',verificationNote:'',
      turnout:'',idCardDisplayed:'',accessControl:'',wagesStatus:'',grievances:'',
      posts:[emptyPost()],enRouteRisk:'',visitorMaterialLog:'',lighting:'',guardAlertness:'',
      qrDisplayed:'',emergencyNumbers:'',clientFeedback:'',clientSatisfaction:'',
      photoSelfie:'',photoSite1:'',photoSite2:'',
      overallStatus:'',keyObservations:'',correctiveActions:'',
      officerSignature:name,submittedToHodDate:todayYmd(),hodReviewStatus:'',forwardedToClientOn:'',
      officerEmail:String(el('pubEmail').value||'').trim().toLowerCase(),
      officerWhatsApp:String(el('pubWa').value||'').replace(/\\D/g,''),
      geoLat:geo&&geo.lat,geoLng:geo&&geo.lng,geoAccuracy:geo&&geo.accuracy,
      geoCapturedAt:(geo&&geo.at)||'',geoStatus:(geo&&geo.status)||'',
      startedAt:new Date().toISOString(),status:'Draft',publicResumeCode:''
    };
    VISIT_PHOTOS_OK=false;
    el('setupCard').style.display='none';
    el('okCard').style.display='none';
    el('formRoot').style.display='block';
    SEC=1;renderSec();saveVisitDraft();
  });
}
function submitVisit(){
  syncForm();
  if(!R)return;
  if(!(R.officerSignature||'').trim()){alert('Type Inspecting Officer Signature (full name) on section 10.');goSec(10);return;}
  var btn=el('btnSubmit');if(btn){btn.disabled=true;btn.textContent='Submitting…';}
  var payload=visitPayload('submit');
  fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});})
    .then(function(res){
      if(btn){btn.disabled=false;btn.textContent='Submit to HOD';}
      if(!res.ok){alert((res.j&&res.j.error)||'Could not submit.');return;}
      el('formRoot').style.display='none';
      var bits=['Visit report submitted to HOD.'];
      if(res.j.geoLat!=null&&res.j.geoLng!=null)bits.push('Site GPS saved ('+Number(res.j.geoLat).toFixed(5)+', '+Number(res.j.geoLng).toFixed(5)+').');
      el('okMsg').textContent=bits.join(' ');
      el('okCard').style.display='block';
      R=null;window.scrollTo(0,0);
    })
    .catch(function(){if(btn){btn.disabled=false;btn.textContent='Submit to HOD';}alert('Network error. Try again.');});
}
function loadClients(bid){
  var sel=el('pubClient');sel.disabled=true;sel.innerHTML='<option value="">Loading…</option>';
  return fetch(API+'?clients=1&branchId='+encodeURIComponent(bid)).then(function(r){return r.json();}).then(function(j){
    CLIENTS=j.clients||[];
    sel.innerHTML='<option value="">— select unit —</option>';
    if(!CLIENTS.length){sel.innerHTML='<option value="">No units on this branch</option>';return;}
    CLIENTS.forEach(function(c){
      var o=document.createElement('option');o.value=c.id;o.textContent=c.name+(c.location?' — '+c.location:'');sel.appendChild(o);
    });
    sel.disabled=false;
  }).catch(function(){sel.innerHTML='<option value="">Could not load units</option>';});
}
fillNow();
fetch(API+'?boot=1').then(function(r){return r.json();}).then(function(j){
  BRANCHES=j.branches||[];
  var s=el('pubBranch');
  BRANCHES.forEach(function(b){var o=document.createElement('option');o.value=b.id;o.textContent=b.name;s.appendChild(o);});
  s.onchange=function(){
    var bid=s.value;
    if(!bid){el('pubClient').disabled=true;el('pubClient').innerHTML='<option value="">— pick branch first —</option>';CLIENTS=[];return;}
    loadClients(bid);
  };
  var q=new URLSearchParams(location.search||'');
  var code=String(q.get('code')||'').replace(/[^A-Za-z0-9]/g,'').toUpperCase();
  if(code&&el('pubResumeCode'))el('pubResumeCode').value=code;
  if(code&&q.get('code'))continueVisitByCode(code);
}).catch(function(){showErr('Could not load branches. Refresh and try again.');});
</script>
</body></html>`
}
