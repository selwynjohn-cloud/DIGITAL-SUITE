/** Client-side HDFC Site Security Assessment (SSA) helpers (injected into periodical-survey-ui script). */

import { hdfcPagesProgressClientJs } from './hdfc-page-progress.js'

export function hdfcSurveyClientScript(): string {
  return `
${hdfcPagesProgressClientJs()}
var HDFC_TABS=[
  {id:'h1',label:'1. Location & Identification'},
  {id:'h2',label:'2. Basic Information'},
  {id:'h3',label:'3. Deployment verification'},
  {id:'h4',label:'4. Registers & Compliance'},
  {id:'h5',label:'5. Bank Physical security'},
  {id:'h6',label:'6. ATM & Lobby'},
  {id:'h7',label:'7. Generator & Utility'},
  {id:'h8',label:'8. Perimeter & Patrolling'},
  {id:'h9',label:'9. Fire safety'},
  {id:'h10',label:'10. Emergency communication'},
  {id:'h11',label:'11. Electronic Security'},
  {id:'checklist',label:'12. Risk check list'},
  {id:'report',label:'13. Professional assessment'},
  {id:'photos',label:'14. Site Photos & Documents'},
  {id:'final',label:'15. Final Report with suggestions'}
];
var YN=['Yes','No','NA'];
var ST=['Working','Not Working','Needs Repair','NA'];
var HDFC_SCORE_IX=0;
if(typeof SSA_DIR==='undefined')var SSA_DIR={operations:[],hods:[]};
function emptyHdfcForm(){
  return {branchName:'',solId:'',fullAddress:'',locationCategory:'',geoLandmark:'',surroundLeft:'',surroundRight:'',surroundFront:'',surroundBack:'',firstFloorLeft:'',firstFloorRight:'',firstFloorFront:'',firstFloorBack:'',nearestFireStation:'',nearestFireStationKm:'',nearestPoliceStation:'',nearestPoliceStationKm:'',wineShopNearby:'',barsNearby:'',shops24x7Nearby:'',busStandNearby:'',railwayStationNearby:'',politicalPartyOfficeNearby:'',airportNearby:'',publicMovement24x7:'',remoteAtNight:'',locationRiskNote:'',managerName:'',contactNumber:'',contactEmail:'',surveyDate:'',surveyedByPick:'',surveyedBy:'',branchCategory:'',workingHours:'',holidayOpenPermission:'',faKnowsProcedure:'',sanctionedGuards:'',dayShiftStart:'',afternoonShiftStart:'',eveningShiftStart:'',faOnDuty:'',actualGuardsDay:'',actualGuardsNight:'',asoPresent:'',lsgPresent:'',sgPresent:'',deploymentMatch:'',deploymentGapNotes:'',facilityAttendantsJson:'[]',attendanceRegister:'',hotoRegister:'',occurrenceRegister:'',breakRegister:'',generatorRegister:'',cashLoadingRegister:'',bankOpenCloseRegister:'',complianceFile:'',holidayRegisterKeepPlace:'',faDocPvc:'',faDocMedical:'',faDocDeploymentOrder:'',visitorRegister:'',keyRegister:'',cashVaultRegister:'',atmRegister:'',patrolRegister:'',complianceGapNotes:'',mainEntranceDoor:'',mainEntranceProcedure:'',shutterCondition:'',shutterOpenCloseProcedure:'',windowsSecure:'',windowOpenCloseProcedure:'',entryPointsToBank:'',openPosition:'',backYardDoor:'',damagedWindows:'',closingBankChecklist:'',whoLocksBank:'',whoSealsKeys:'',fireExtCount:'',fireExtValidityChecked:'',fireExtExpired:'',strongRoomDoorClass:'',strongRoomVentilator:'',emergencyExit:'',holidayOpeningPermission:'',holidayOpenCloseProcedure:'',physicalSecurityNotes:'',atmSite:'',atmCount:'',atmShiftCount:'',atmKeySets:'',atmOpenWiring:'',atmOpenPowerSocket:'',atmOpenConnection:'',faBelongingsInAtm:'',atmDrawerContents:'',atmLobbyClean:'',unauthStickers:'',atmVisibleFromRoad:'',surroundNightLighting:'',patrolBeforeTakeover:'',atmAccessCount:'',canAccessBankFromAtm:'',atmCctv:'',atmGuarding:'',atmLobbyAccess:'',atmLobbyLighting:'',atmLobbyNotes:'',generatorPresent:'',generatorLocation:'',generatorVisibleFromAtm:'',generatorCctvCoverage:'',generatorAreaLuminated:'',generatorRegisterMaintained:'',generatorBattery:'',generatorLockIntact:'',generatorWorking:'',generatorStartedBy:'',generatorDieselBy:'',generatorFuel:'',upsPresent:'',upsBackupHours:'',utilityNotes:'',perimeterFence:'',perimeterLighting:'',cctvPerimeter:'',patrolFrequency:'',patrolRouteOk:'',outdoorAcUnit:'',outdoorAcLighting:'',outdoorAcCctv:'',patrolNotes:'',feAtmCount:'',feAtmCo2:'',feAtmDcp:'',feAtmFoam:'',feAtmMixed:'',feBankCount:'',feBankCo2:'',feBankDcp:'',feBankFoam:'',feBankMixed:'',cookingHeatingAvailable:'',microwavePresent:'',recentFireAudit:'',recentFireDrill:'',smokeDetectors:'',fireAlarm:'',atmFireSafety:'',branchFireSafety:'',fireSafetyNotes:'',fireExtinguisherType:'',fireExtinguisherQty:'',fireExtinguisherRefillDue:'',fireDrillDone:'',routerInstalled:'',panicSwitchAtm:'',agileControlNumber:'',faKnowledgeAgileMobileAlarm:'',emergencyContactDisplayedFa:'',escalationKnownFa:'',emergencyContactBank:'',emergencyContactPolice:'',emergencyContactFire:'',emergencyNotes:'',panicSwitchCount:'',panicSwitchStatus:'',burglarAlarm:'',escalationKnown:'',cctvAtmCount:'',cctvBankCount:'',localDvrLocation:'',cctvCableOpen:'',cctvCameraCount:'',dvrNvrChannels:'',dvrNvrHdd:'',recordingBackupDays:'',cctvCoverageOk:'',electronicNotes:'',generalObservations:'',hdfcRecommendations:'',surveyorSign:'',branchRepSign:''};
}
function setHdfcField(si,key,val){
  var sv=SV[si];if(!sv)return;
  if(!sv.hdfcForm)sv.hdfcForm=emptyHdfcForm();
  sv.hdfcForm[key]=val||'';
  if(key==='branchName')sv.company=val||'';
  if(key==='managerName')sv.factoryManager=val||'';
  if(key==='contactNumber')sv.contactPhone=val||'';
  if(key==='contactEmail')sv.contactEmail=val||'';
  if(key==='surveyDate')sv.surveyDate=val||'';
  if(key==='surveyedBy')sv.surveyedBy=val||'';
  if(key==='fullAddress')sv.address=val||'';
  if(key==='locationCategory')sv.locationName=val||sv.locationName||'';
  if(typeof scheduleHdfcAutoSave==='function')scheduleHdfcAutoSave();
}
function harvestHdfcDom(si){
  if(si==null||si<0||!SV[si])return;
  if(!SV[si].hdfcForm)SV[si].hdfcForm=emptyHdfcForm();
  var nodes=document.querySelectorAll('[data-hdfc-key]');
  for(var i=0;i<nodes.length;i++){
    var n=nodes[i],k=n.getAttribute('data-hdfc-key');
    if(!k)continue;
    if(n.type==='checkbox'||n.disabled)continue;
    var val=n.value||'';
    SV[si].hdfcForm[k]=val;
    if(k==='branchName')SV[si].company=val;
    if(k==='managerName')SV[si].factoryManager=val;
    if(k==='contactNumber')SV[si].contactPhone=val;
    if(k==='contactEmail')SV[si].contactEmail=val;
    if(k==='surveyDate')SV[si].surveyDate=val;
    if(k==='surveyedBy')SV[si].surveyedBy=val;
    if(k==='fullAddress')SV[si].address=val;
    if(k==='locationCategory')SV[si].locationName=val||SV[si].locationName||'';
  }
}
function hdfcInp(si,key,ph){
  var v=(SV[si].hdfcForm&&SV[si].hdfcForm[key])||'';
  return '<input class="m-inp" data-hdfc-key="'+key+'" value="'+a(v)+'" placeholder="'+(ph||'')+'" oninput="setHdfcField('+si+',\\''+key+'\\',this.value)">';
}
function hdfcDate(si,key){
  var v=(SV[si].hdfcForm&&SV[si].hdfcForm[key])||'';
  return '<input class="m-inp" type="date" data-hdfc-key="'+key+'" value="'+a(v)+'" oninput="setHdfcField('+si+',\\''+key+'\\',this.value)">';
}
function hdfcDateOrUnknown(si,key){
  var v=(SV[si].hdfcForm&&SV[si].hdfcForm[key])||'';
  var isUnk=v==='Not known';
  var dateVal=(!isUnk&&/^\\d{4}-\\d{2}-\\d{2}$/.test(v))?v:'';
  return '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">'+
    '<input class="m-inp" type="date" data-hdfc-key="'+key+'" value="'+a(dateVal)+'" '+(isUnk?'disabled':'')+' oninput="setHdfcField('+si+',\\''+key+'\\',this.value)">'+
    '<label style="color:#cbd5e1;font-size:13px;display:flex;gap:6px;align-items:center;white-space:nowrap"><input type="checkbox" '+(isUnk?'checked':'')+' onchange="setHdfcField('+si+',\\''+key+'\\',this.checked?\\'Not known\\':\\'\\');render()"> Not known</label>'+
  '</div>';
}
function hdfcSel(si,key,opts){
  var cur=(SV[si].hdfcForm&&SV[si].hdfcForm[key])||'';
  return '<select class="m-inp" data-hdfc-key="'+key+'" onchange="setHdfcField('+si+',\\''+key+'\\',this.value)" oninput="setHdfcField('+si+',\\''+key+'\\',this.value)"><option value="">Select</option>'+opts.map(function(o){return '<option value="'+a(o)+'"'+(cur===o?' selected':'')+'>'+h(o)+'</option>';}).join('')+'</select>';
}
function ssaDir(){
  var d=typeof SSA_DIR==='object'&&SSA_DIR?SSA_DIR:{operations:[],hods:[]};
  return {operations:d.operations||[],hods:d.hods||[]};
}
function ssaAllPeople(){return ssaDir().operations.concat(ssaDir().hods);}
function ssaFindPerson(name){
  var n=String(name||'').trim().toLowerCase();
  if(!n)return null;
  var list=ssaAllPeople();
  for(var i=0;i<list.length;i++){if(String(list[i].name||'').trim().toLowerCase()===n)return list[i];}
  return null;
}
function ssaNameSelectHtml(id,cur,onchangeFn){
  var html='<select class="m-inp" id="'+id+'" onchange="'+onchangeFn+'"><option value="">Select operations name</option>';
  html+='<optgroup label="Operations">';
  ssaDir().operations.forEach(function(p){html+='<option value="'+a(p.name)+'"'+(cur===p.name?' selected':'')+'>'+h(p.name)+(p.email?' — '+h(p.email):'')+'</option>';});
  html+='</optgroup><optgroup label="HODs">';
  ssaDir().hods.forEach(function(p){html+='<option value="'+a(p.name)+'"'+(cur===p.name?' selected':'')+'>'+h(p.name)+(p.email?' — '+h(p.email):'')+'</option>';});
  html+='</optgroup><option value="Name not available"'+(cur==='Name not available'?' selected':'')+'>Name not in list — type (saved for this branch)</option></select>';
  return html;
}
function ssaEmailSelectHtml(id,cur,onchangeFn){
  var html='<select class="m-inp" id="'+id+'" onchange="'+onchangeFn+'"><option value="">Select email</option>';
  html+='<optgroup label="HOD emails">';
  ssaDir().hods.forEach(function(p){if(!p.email)return;html+='<option value="'+a(p.email)+'"'+(cur===p.email?' selected':'')+'>'+h(p.name?p.name+' — ':'')+h(p.email)+'</option>';});
  html+='</optgroup><optgroup label="Operations emails">';
  ssaDir().operations.forEach(function(p){if(!p.email)return;html+='<option value="'+a(p.email)+'"'+(cur===p.email?' selected':'')+'>'+h(p.name?p.name+' — ':'')+h(p.email)+'</option>';});
  html+='</optgroup><option value="__other__">Email not in list — type</option></select>';
  return html;
}
function hdfcSurveyedByPick(si){
  var cur=(SV[si].hdfcForm&&SV[si].hdfcForm.surveyedByPick)||(SV[si].surveyedBy)||'';
  var names=(OPS_TEAM||[]).slice();
  if(!ssaDir().operations.length&&!ssaDir().hods.length){
    var html='<select class="m-inp" onchange="onHdfcSurveyedByPick('+si+',this.value)"><option value="">Select operations team</option>';
    names.concat(['Name not available']).forEach(function(o){html+='<option value="'+a(o)+'"'+(cur===o?' selected':'')+'>'+h(o==='Name not available'?'Name not in list — type (saved for this branch)':o)+'</option>';});
    html+='</select>';
    return html;
  }
  return ssaNameSelectHtml('hdfcName_'+si,cur,'onHdfcSurveyedByPick('+si+',this.value)');
}
function onHdfcSurveyedByPick(si,val){
  setHdfcField(si,'surveyedByPick',val||'');
  if(val&&val!=='Name not available'){
    setHdfcField(si,'surveyedBy',val);
    SV[si].surveyedBy=val;
    var hit=ssaFindPerson(val);
    if(hit&&hit.email)SV[si].surveyorEmail=hit.email;
    if(hit&&hit.mobile)SV[si].surveyorWhatsApp=hit.mobile;
  }else if(val==='Name not available'){
    setHdfcField(si,'surveyedBy','');
    SV[si].surveyedBy='';
  }
  render();
}
function onHdfcSurveyorEmailPick(si,val){
  if(val==='__other__'){SV[si].surveyorEmail='';render();return;}
  SV[si].surveyorEmail=val||'';
  if(typeof scheduleHdfcAutoSave==='function')scheduleHdfcAutoSave();
}
function hdfcAssessorOnce(si){
  var sv=SV[si]||{};
  var name=String(sv.surveyedBy||(sv.hdfcForm&&sv.hdfcForm.surveyedBy)||'').trim();
  var email=String(sv.surveyorEmail||'').trim();
  var date=(sv.hdfcForm&&sv.hdfcForm.surveyDate)||sv.surveyDate||'';
  if(name&&email){
    return '<div class="m-card" style="margin-top:12px;border-color:#38bdf8"><b style="color:#7dd3fc">Assessor (already entered)</b><p class="hint" style="margin-top:8px">Name, email and date are taken once — not asked again.</p><div style="margin-top:8px;color:#e2e8f0;line-height:1.6"><b>'+h(name)+'</b><br>'+h(email)+(date?'<br>Date of Survey: '+h(date):'')+'</div></div>';
  }
  var pick=((sv.hdfcForm&&sv.hdfcForm.surveyedByPick)||'');
  var nameFld=pick==='Name not available'?hdfcFld('Name',hdfcInp(si,'surveyedBy','Type name')):'';
  var emailCur=email;
  var emailCtl=ssaEmailSelectHtml('hdfcEmail_'+si,emailCur,'onHdfcSurveyorEmailPick('+si+',this.value)');
  var typeEmail='<input class="m-inp" style="margin-top:8px" type="email" placeholder="Or type email if not in list" value="'+a(emailCur)+'" oninput="SV['+si+'].surveyorEmail=this.value">';
  return hdfcCard('Assessor (once only)','Pick this branch’s HOD or operations name (VP, AVP, RM, CGM, OM). A typed name is saved for the branch. Do not type the same details again on another page.',
    hdfcFld('Risk Analyst / Surveyed By',hdfcSurveyedByPick(si))+
    nameFld+
    hdfcFld('Email (HOD / Operations)',emailCtl+typeEmail)+
    hdfcFld('Date of Survey',hdfcDate(si,'surveyDate'))
  );
}
function svRemoveSlotPhoto(si,slot){
  if(typeof canEdit==='function'&&SV[si]&&!canEdit(SV[si]))return;
  if(!SV[si]||!SV[si].photos)return;
  var ix=typeof svFindSlotIndex==='function'?svFindSlotIndex(si,slot):-1;
  if(ix<0)return;
  if(!confirm('Delete this photo?'))return;
  SV[si].photos.splice(ix,1);
  if(typeof render==='function')render();
  if(typeof scheduleHdfcAutoSave==='function')scheduleHdfcAutoSave();
  if(typeof schedulePublicAutoSave==='function')schedulePublicAutoSave();
}
function getFacilityAttendants(si){
  try{var raw=(SV[si].hdfcForm&&SV[si].hdfcForm.facilityAttendantsJson)||'[]';var arr=JSON.parse(raw);return Array.isArray(arr)?arr:[];}catch(e){return [];}
}
function setFacilityAttendants(si,arr){
  setHdfcField(si,'facilityAttendantsJson',JSON.stringify(arr||[]));
}
function addFacilityAttendant(si){
  if(!canEdit(SV[si]))return;
  var arr=getFacilityAttendants(si);
  if(arr.length>=6){alert('Maximum 6 Facility Attendants.');return;}
  arr.push({id:'fa'+Date.now(),name:'',idNo:'',idCardValidity:''});
  setFacilityAttendants(si,arr);
  SV_FA_EDIT=arr.length-1;
  render({keepScroll:true});
}
function liveSaveFacilityAttendant(si,fi){
  if(typeof canEdit==='function'&&SV[si]&&!canEdit(SV[si]))return;
  var name=(el('faName_'+si+'_'+fi)&&el('faName_'+si+'_'+fi).value)||'';
  var idNo=(el('faId_'+si+'_'+fi)&&el('faId_'+si+'_'+fi).value)||'';
  var val=(el('faValid_'+si+'_'+fi)&&el('faValid_'+si+'_'+fi).value)||'';
  var arr=getFacilityAttendants(si);
  if(!arr[fi])return;
  arr[fi]={id:arr[fi].id||('fa'+Date.now()),name:String(name).trim().slice(0,120),idNo:String(idNo).trim().slice(0,80),idCardValidity:String(val).trim().slice(0,20)};
  setFacilityAttendants(si,arr);
}
function pickFaValidDate(si,fi){
  var inp=el('faValid_'+si+'_'+fi);
  var cur=inp?inp.value:'';
  function apply(v){
    if(v==null||v==='')return;
    if(inp)inp.value=v;
    liveSaveFacilityAttendant(si,fi);
  }
  if(typeof suitePickDate==='function'){suitePickDate('ID card validity',cur,apply);return;}
  if(inp){
    try{if(typeof inp.showPicker==='function')inp.showPicker();else inp.focus();}catch(e){try{inp.focus();}catch(e2){}}
  }
}
function saveFacilityAttendant(si,fi){
  if(!canEdit(SV[si]))return;
  liveSaveFacilityAttendant(si,fi);
  var arr=getFacilityAttendants(si);
  if(!arr[fi]||!String(arr[fi].name||'').trim()){alert('Enter Facility Attendant Name.');return;}
  if(!String(arr[fi].idNo||'').trim()){alert('Enter ID No.');return;}
  if(!String(arr[fi].idCardValidity||'').trim()){alert('Pick ID card validity date.');return;}
  SV_FA_EDIT=-1;
  if(typeof scheduleHdfcAutoSave==='function')scheduleHdfcAutoSave();
  if(typeof schedulePublicAutoSave==='function')schedulePublicAutoSave();
  render({keepScroll:true});
}
function removeFacilityAttendant(si,fi){
  if(!canEdit(SV[si]))return;
  if(!confirm('Remove this Facility Attendant?'))return;
  var arr=getFacilityAttendants(si);arr.splice(fi,1);setFacilityAttendants(si,arr);SV_FA_EDIT=-1;render({keepScroll:true});
  if(typeof scheduleHdfcAutoSave==='function')scheduleHdfcAutoSave();
}
function renderFacilityAttendants(si){
  var arr=getFacilityAttendants(si);var lock=!canEdit(SV[si]);
  var html='<div class="m-card" style="margin-top:12px"><b style="color:#fde68a;font-size:15px">Facility Attendants</b>';
  html+='<p class="hint" style="margin-top:6px">Name · ID No. · <b>ID card validity</b> (calendar). Tap <b>Pick date</b> if the calendar icon is small. Add one FA for each sanctioned post (1FA / 2FA / 3FA).</p>';
  if(!arr.length)html+='<div class="hint" style="margin-top:8px">No FA added yet — tap + Add FA.</div>';
  arr.forEach(function(fa,fi){
    html+='<div style="margin-top:12px;padding:10px;border:1px solid #334155;border-radius:8px">';
    html+='<div style="color:#94a3b8;font-size:12px;margin-bottom:6px">FA '+(fi+1)+'</div>';
    if(lock){
      html+='<div style="color:#e2e8f0;font-size:13px"><b>'+h(fa.name||'—')+'</b> · ID: '+h(fa.idNo||'—')+' · Validity: '+h(fa.idCardValidity||'—')+'</div>';
    }else{
      html+='<div class="fgrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px">';
      html+='<div><label class="m-lbl">Facility Attendant Name</label><input class="m-inp" id="faName_'+si+'_'+fi+'" value="'+a(fa.name||'')+'" oninput="liveSaveFacilityAttendant('+si+','+fi+')"></div>';
      html+='<div><label class="m-lbl">ID No.</label><input class="m-inp" id="faId_'+si+'_'+fi+'" value="'+a(fa.idNo||'')+'" oninput="liveSaveFacilityAttendant('+si+','+fi+')"></div>';
      html+='<div><label class="m-lbl">ID card validity</label><div class="fa-valid-row" style="display:flex;gap:8px;align-items:center;flex-wrap:nowrap">';
      html+='<input class="m-inp" type="date" id="faValid_'+si+'_'+fi+'" value="'+a(fa.idCardValidity||'')+'" oninput="liveSaveFacilityAttendant('+si+','+fi+')" style="flex:1;min-width:168px;color-scheme:dark">';
      html+='<button type="button" class="m-btn m-btn-navy" style="flex:0 0 auto;min-width:110px" onclick="pickFaValidDate('+si+','+fi+')">Pick date</button>';
      html+='</div></div></div>';
      html+='<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">';
      html+='<button type="button" class="m-btn m-btn-green" onclick="saveFacilityAttendant('+si+','+fi+')">Save</button>';
      html+='<button type="button" class="m-btn m-btn-grey" onclick="removeFacilityAttendant('+si+','+fi+')">Remove</button></div>';
    }
    html+='</div>';
  });
  if(!lock)html+='<div style="margin-top:12px"><button type="button" class="m-btn m-btn-gold" onclick="addFacilityAttendant('+si+')">+ Add FA</button></div>';
  html+='</div>';
  return html;
}
function hdfcTa(si,key,rows){
  var v=(SV[si].hdfcForm&&SV[si].hdfcForm[key])||'';
  return '<textarea class="m-inp" data-hdfc-key="'+key+'" rows="'+(rows||3)+'" oninput="setHdfcField('+si+',\\''+key+'\\',this.value)">'+h(v)+'</textarea>';
}
function hdfcFld(label,ctl){return '<div><label class="m-lbl">'+h(label)+'</label>'+ctl+'</div>';}
function hdfcCard(title,hint,inner){
  return '<div class="m-card" style="margin-top:12px"><b style="color:#fde68a;font-size:15px">'+h(title)+'</b>'+(hint?'<p class="hint" style="margin-top:6px">'+hint+'</p>':'')+'<div class="fgrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:10px">'+inner+'</div></div>';
}
function renderHdfcNav(si){
  var prog=typeof hdfcPagesProgress==='function'?hdfcPagesProgress(SV[si]||{}):{label:'0 / 15',complete:false};
  var html='<div class="hint" style="margin:8px 0 4px;font-weight:800;color:'+(prog.complete?'#86efac':'#fde68a')+'">Pages completed: '+h(prog.label)+(prog.complete?' — all 15 done':' — complete all 15 before Submit to HOD')+'</div>';
  html+='<div class="survey-tabs" style="margin-top:8px">';
  HDFC_TABS.forEach(function(t){
    html+='<div class="survey-tab '+(SV_TAB===t.id?'on':'')+'" onclick="goHdfcTab(\\''+t.id+'\\')">'+h(t.label)+'</div>';
  });
  html+='</div>';
  return html;
}
/** Works on HOD portal (auto-save flush) and public /mis-hdfc-survey (no login). */
function goHdfcTab(tabId){
  if(!tabId)return;
  if(typeof harvestHdfcDom==='function'){try{harvestHdfcDom(typeof SV_EDIT==='number'&&SV_EDIT>=0?SV_EDIT:0);}catch(e){}}
  if(tabId==='checklist'&&SV_TAB!=='checklist'&&typeof hdfcFirstOpenScoreIx==='function')HDFC_SCORE_IX=hdfcFirstOpenScoreIx();
  var go=function(){SV_TAB=tabId;if(typeof render==='function')render();};
  if(typeof flushHdfcAutoSave==='function'){
    try{
      var p=flushHdfcAutoSave();
      if(p&&typeof p.then==='function'){p.then(go).catch(go);return;}
    }catch(e){}
  }
  go();
}
function hdfcPageIndex(){
  var i=HDFC_TABS.findIndex(function(t){return t.id===SV_TAB;});
  return i<0?0:i;
}
function isHdfcLastPage(){return SV_TAB==='final'||hdfcPageIndex()>=HDFC_TABS.length-1;}
function hdfcGoPrev(){
  var i=hdfcPageIndex();
  if(i>0)goHdfcTab(HDFC_TABS[i-1].id);
}
function hdfcGoNext(){
  var i=hdfcPageIndex();
  if(i<HDFC_TABS.length-1)goHdfcTab(HDFC_TABS[i+1].id);
}
function hdfcProcessSteps(tab){
  var map={
    h1:['Stand in front of this HDFC unit. Look Left, Right, Front and Back.','Pick the HDFC client from the list. Do not type a new client name.','Pick Location / Category: Urban, Semi-Urban or Rural. Type the nearest landmark.','Type what is on Ground Left, Right, Front and Back (road, shop, house, vacant land).','Type nearest Fire station and Police station, and the km.','Answer Yes or No for wine shop, bars, 24×7 shops, bus stand, railway, Political Party office, Airport.','Pick how busy the public movement is, and whether the place is remote at night.','Type a short location risk note if something extra is seen. Then tap Next.'],
    h2:['Your name, email and survey date are asked only once (above). Do not type them again later.','Type the Bank Manager name, mobile and bank email.','Pick Branch category (Metro / Urban / Semi-Urban / Rural). Type working hours.','Holiday opening is on the file — Yes or No (this question is only here).','Whether FA knows the procedure — Yes or No. Then tap Next.'],
    h3:['Pick Sanctioned strength: 1FA, 2FA or 3FA. Do not write ASO / LSG / SG here.','Pick Day, Afternoon and Evening shift start times from the list.','FA on duty — Yes / No / NA. Deployment matches sanction — Yes / No / NA.','Add each Facility Attendant: Name, ID No., and ID card validity (use the calendar or Pick date). Tap Add FA / Save.','Type any deployment gap. Then tap Next.'],
    h4:['Open the registers at the site. Mark each one in this order: Attendance → HOTO → Occurrence → Break → Generator → Cash Loading → Bank Opening/closing → Compliance File.','For each: Maintained, Not maintained, or NA.','During bank holidays — pick where FA keeps the register: ATM under Lock & key / 3 FA Branch / in Branch.','FA documents: PVC, Medical, Deployment Order — Yes or No. Then tap Next.'],
    h5:['Walk the bank doors and windows. Fill Main door, shutter, windows, and how they open / close.','Pick how many Entry Points (1 / 2 / 3) and Normal Main door open position.','Back Yard door and Damaged windows — pick from the list.','The bank closing list is only on this page — Yes or No.','Who Lock the bank and Who will seal the keys — FA / HK / Bank Staff. Then tap Next.'],
    h6:['Say if ATM is In Branch, Offsite or None. Pick number of shifts and key sets.','Check wiring, power socket, open connection, FA belongings, and what is in the ATM drawer.','Lobby clean? Unauthorised stickers? Can ATM be seen from the road? Night lighting?','Patrol before takeover. Access to ATM. Can they enter the bank from the ATM?','ATM Guarding: 3 Shift / 2 Shift (1st & 2nd) / 1 shift (G). Then tap Next.'],
    h7:['Pick Generator Location: Front / Back / Right / Left / Basement / NA.','Answer Battery, Lock intact, working, who starts it, who gets diesel, fuel, UPS.','Visibility from the ATM, CCTV on Generator, Generator Area Luminated — Yes or No.','Last question: Generator Register Maintained — Yes or No. Then tap Next.'],
    h8:['Walk the outside wall / fence and lighting. Mark fence, lighting and perimeter CCTV.','Patrol frequency: while HOTO & Nights / Nights only / NA. Is the patrol route followed?','Outdoor A/C unit — visible or not. Lighting and CCTV on that area. Then tap Next.'],
    h9:['Count fire extinguishers in the ATM. Pick the number, then type counts for CO2, DCP, Foam, Mixed.','Do the same for fire extinguishers in the Bank.','Cooking / Heating and Microwave — Yes or No.','Recent Fire audit and Fire drill — pick the date, or tick Not known.','Smoke detectors and Fire alarm. Closing-bank checklist is not here (it is on page 5). Then tap Next.'],
    h10:['Router installed? Panic switch in the ATM? Yes or No.','Type the Agile Control Number (this page is complete only when this number is filled).','FA knowledge on Agile Mobile alarm. Emergency contact with FA. Escalation matrix known to FA.','Type Bank, Police and Fire emergency numbers if shown. Then tap Save or Next. This does not submit the survey.'],
    h11:['Count CCTV cameras in ATM and in Bank. Pick DVR location: ATM / Branch / NA.','Is the CCTV cable open? Type DVR channels, HDD and backup days. Coverage adequate — Yes or No.','Surveyor name is already your assessor name. Type Branch Representative name.','Type short General Observations and Recommendations. Then tap Next.'],
    checklist:['This is page 12. One question (serial) at a time.','Read the line. Tap a score 0 (low risk) to 5 (high risk).','After you tap a number, the next serial opens here. You stay on page 12 — do not look for the 15 heading menu.','Use Previous serial / Next serial if you need to go back. Notes are optional.','When the last serial is scored, tap Next to page 13.'],
    report:['Page 13 is written automatically from your answers. Field staff do not need to type.','Wait until the green line says Generated. Then tap Next to page 14 Photos.','Do not take photos on this page.'],
    photos:['Take a selfie on site (use Flip camera).','Photo 1 Bank & ATM from front. Photo 2 what is in front. Photo 3 AC outdoor. Photo 4 any sensitive area.','Documents: Attendance, HOTO, PVC of 3/2 FA, Closing & Opening. Take Photo or Gallery.','If a photo is wrong, tap Delete and take it again. If the phone is full, free space and try again — answers still save. Then tap Next.'],
    final:['Read the summary. Tap Review the report (opens the full letter). Tap Photos Preview if you want to check pictures.','Type your suggestions for HOD.','Submit to HOD is only on this page. It works only when Pages completed is 15 / 15.','Confirm All 15 pages are completed, then Submit. After that you see Thank you. The continue code stops.']
  };
  return map[tab]||[];
}
function hdfcProcessGuideHtml(tab){
  var steps=hdfcProcessSteps(tab);
  if(!steps.length)return '';
  var title='How to fill this page';
  for(var i=0;i<HDFC_TABS.length;i++){if(HDFC_TABS[i].id===tab){title='How to fill '+HDFC_TABS[i].label;break;}}
  var lis='';
  for(var s=0;s<steps.length;s++)lis+='<li>'+steps[s]+'</li>';
  return '<div class="hdfc-guide instruct" style="background:#0b1a33;border:1px solid #fbbf24;border-radius:12px;padding:12px 14px;margin:10px 0 14px;color:#e2e8f0;font-size:14px;line-height:1.55"><b style="color:#fde68a">'+h(title)+'</b><ol style="margin:8px 0 0;padding-left:20px">'+lis+'</ol><p style="margin:10px 0 0">The page <b>saves by itself</b>. Then tap <b>Next</b>.</p></div>';
}
function hdfcAllProcessGuideHtml(){
  var html='<details class="hdfc-guide instruct" style="background:#0b1a33;border:1px solid #fbbf24;border-radius:12px;padding:12px 14px;margin:0 0 14px;color:#e2e8f0;font-size:14px;line-height:1.55"><summary style="cursor:pointer;font-weight:800;color:#fde68a">Open — step-by-step for all 15 pages</summary>';
  for(var i=0;i<HDFC_TABS.length;i++){
    var t=HDFC_TABS[i];
    var steps=hdfcProcessSteps(t.id);
    if(!steps.length)continue;
    html+='<p style="margin:12px 0 4px"><b style="color:#7dd3fc">'+h(t.label)+'</b></p><ol style="margin:0;padding-left:20px">';
    for(var s=0;s<steps.length;s++)html+='<li>'+steps[s]+'</li>';
    html+='</ol>';
  }
  html+='<p style="margin:12px 0 0">Submit to HOD is only on page 15, and only when Pages completed is <b>15 / 15</b>.</p></details>';
  return html;
}
function renderHdfcPage(si){
  var html=hdfcProcessGuideHtml(SV_TAB);
  if(SV_TAB==='h1'){
    html+=hdfcCard('1. Location and Identification','Pick HDFC client from Master Directory (name/address come from the client list). Surroundings use Yes/No where possible.',
      hdfcFld('Client (this branch)', '<select class="m-inp" onchange="pickClient('+si+',this.value)">'+clientOptions(si)+'</select>')+
      hdfcFld('Location / Category',hdfcSel(si,'locationCategory',['Urban','Semi-Urban','Rural']))+
      hdfcFld('Landmark',hdfcInp(si,'geoLandmark',''))
    );
    html+=hdfcCard('Surroundings — Ground floor (Left / Right / Front / Back)','What is immediately around the branch.',
      hdfcFld('Ground — Left',hdfcInp(si,'surroundLeft','e.g. road / shop'))+
      hdfcFld('Ground — Right',hdfcInp(si,'surroundRight',''))+
      hdfcFld('Ground — Front',hdfcInp(si,'surroundFront',''))+
      hdfcFld('Ground — Back',hdfcInp(si,'surroundBack',''))
    );
    html+=hdfcCard('Nearest emergency services & night risk','Confirm wine shops, bars, 24×7 shops, bus / railway — for public movement and remote-night risk.',
      hdfcFld('Nearest Fire Station',hdfcInp(si,'nearestFireStation',''))+
      hdfcFld('Distance (km)',hdfcInp(si,'nearestFireStationKm',''))+
      hdfcFld('Nearest Police Station',hdfcInp(si,'nearestPoliceStation',''))+
      hdfcFld('Distance (km)',hdfcInp(si,'nearestPoliceStationKm',''))+
      hdfcFld('Wine shop nearby',hdfcSel(si,'wineShopNearby',YN))+
      hdfcFld('Bars nearby',hdfcSel(si,'barsNearby',YN))+
      hdfcFld('24×7 shops nearby',hdfcSel(si,'shops24x7Nearby',YN))+
      hdfcFld('Bus stand nearby',hdfcSel(si,'busStandNearby',YN))+
      hdfcFld('Railway station nearby',hdfcSel(si,'railwayStationNearby',YN))+
      hdfcFld('Political Party office nearby',hdfcSel(si,'politicalPartyOfficeNearby',YN))+
      hdfcFld('Airport nearby',hdfcSel(si,'airportNearby',YN))+
      hdfcFld('24×7 public movement',hdfcSel(si,'publicMovement24x7',['High 24x7','Moderate','Low / Quiet at night','Remote / Isolated at night']))+
      hdfcFld('Remote / isolated at night',hdfcSel(si,'remoteAtNight',YN))
    );
    html+='<div class="m-card" style="margin-top:12px"><label class="m-lbl">Location risk note</label>'+hdfcTa(si,'locationRiskNote',3)+'</div>';
  }else if(SV_TAB==='h2'){
    html+=hdfcAssessorOnce(si);
    html+=hdfcCard('2. Basic Information','Bank manager and branch details only. Assessor name / email / date are above — asked once.',
      hdfcFld('Name of the Manager',hdfcInp(si,'managerName',''))+
      hdfcFld('Contact Number',hdfcInp(si,'contactNumber',''))+
      hdfcFld('Bank email',hdfcInp(si,'contactEmail',''))+
      hdfcFld('Branch category',hdfcSel(si,'branchCategory',['Metro','Urban','Semi-Urban','Rural']))+
      hdfcFld('Working hours',hdfcInp(si,'workingHours','e.g. 9:30–4:30'))+
      hdfcFld('Holiday opening is on the file',hdfcSel(si,'holidayOpenPermission',['Yes','No']))+
      hdfcFld('Whether FA knows the procedure',hdfcSel(si,'faKnowsProcedure',['Yes','No']))
    );
  }else if(SV_TAB==='h3'){
    html+=hdfcCard('3. Deployment verification','Sanctioned FA and shift start times — pick from list.',
      hdfcFld('Sanctioned strength',hdfcSel(si,'sanctionedGuards',['1FA','2FA','3FA']))+
      hdfcFld('Actual Day shift start time',hdfcSel(si,'dayShiftStart',['6.00 am','7.00 am','10.00 am']))+
      hdfcFld('Actual afternoon shift start time',hdfcSel(si,'afternoonShiftStart',['2.00 pm','3.00 pm','6.00 pm']))+
      hdfcFld('Actual evening shift start time',hdfcSel(si,'eveningShiftStart',['10.00 pm','11.00 pm','2.00 am']))+
      hdfcFld('FA on duty',hdfcSel(si,'faOnDuty',YN))+
      hdfcFld('Deployment matches sanction',hdfcSel(si,'deploymentMatch',YN))
    );
    html+=renderFacilityAttendants(si);
    html+='<div class="m-card" style="margin-top:12px"><label class="m-lbl">Deployment gap notes</label>'+hdfcTa(si,'deploymentGapNotes',3)+'</div>';
  }else if(SV_TAB==='h4'){
    var REG=['Maintained','Not maintained','NA'];
    html+=hdfcCard('4. Registers and Compliance log','Mark each register in this order.',
      hdfcFld('Attendance Register',hdfcSel(si,'attendanceRegister',REG))+
      hdfcFld('HOTO',hdfcSel(si,'hotoRegister',REG))+
      hdfcFld('Occurrence Register',hdfcSel(si,'occurrenceRegister',REG))+
      hdfcFld('Break Register',hdfcSel(si,'breakRegister',REG))+
      hdfcFld('Generator Register',hdfcSel(si,'generatorRegister',REG))+
      hdfcFld('Cash Loading register',hdfcSel(si,'cashLoadingRegister',REG))+
      hdfcFld('Bank Opening and closing Register',hdfcSel(si,'bankOpenCloseRegister',REG))+
      hdfcFld('Compliance File',hdfcSel(si,'complianceFile',REG))+
      hdfcFld('During Bank Holidays — where will FA keep Register & files',hdfcSel(si,'holidayRegisterKeepPlace',['ATM under Lock & key','3 FA Branch','in Branch']))
    );
    html+=hdfcCard('Document for all FAs','Yes / No for each document.',
      hdfcFld('PVC',hdfcSel(si,'faDocPvc',['Yes','No']))+
      hdfcFld('Medical cert',hdfcSel(si,'faDocMedical',['Yes','No']))+
      hdfcFld('Deployment Order',hdfcSel(si,'faDocDeploymentOrder',['Yes','No']))
    );
    html+='<div class="m-card" style="margin-top:12px"><label class="m-lbl">Compliance gap notes</label>'+hdfcTa(si,'complianceGapNotes',3)+'</div>';
  }else if(SV_TAB==='h5'){
    html+=hdfcCard('5. Bank Physical security','Doors, windows, entry points, closing & locking.',
      hdfcFld('Main Entrance Door',hdfcInp(si,'mainEntranceDoor','Glass / Wooden / Iron'))+
      hdfcFld('Main door open / close procedure',hdfcSel(si,'mainEntranceProcedure',['Documented & followed','Partial','Not followed']))+
      hdfcFld('Shutter Condition',hdfcSel(si,'shutterCondition',ST))+
      hdfcFld('Shutter open / close procedure',hdfcSel(si,'shutterOpenCloseProcedure',['Documented & followed','Partial','Not followed']))+
      hdfcFld('Windows secured',hdfcSel(si,'windowsSecure',YN))+
      hdfcFld('Windows open / close procedure',hdfcSel(si,'windowOpenCloseProcedure',['Documented & followed','Partial','Not followed','NA']))+
      hdfcFld('Entry Points to bank',hdfcSel(si,'entryPointsToBank',['1','2','3']))+
      hdfcFld('Normal Main door open position',hdfcSel(si,'openPosition',['Fully opened','Half Opened','Chained']))+
      hdfcFld('Back Yard door',hdfcSel(si,'backYardDoor',['Yes','No','Closed always']))+
      hdfcFld('Damaged windows (could not be closed)',hdfcSel(si,'damagedWindows',YN))+
      hdfcFld('Check list for closing Bank',hdfcSel(si,'closingBankChecklist',YN))+
      hdfcFld('Who Lock the bank',hdfcSel(si,'whoLocksBank',['FA','HK','Bank Staff']))+
      hdfcFld('Who will seal the keys',hdfcSel(si,'whoSealsKeys',['FA','HK','Bank Staff']))
    );
    html+='<div class="m-card" style="margin-top:12px"><label class="m-lbl">Physical security notes</label>'+hdfcTa(si,'physicalSecurityNotes',3)+'</div>';
  }else if(SV_TAB==='h6'){
    html+=hdfcCard('6. ATM & Lobby','Shifts, keys, wiring, lobby and access.',
      hdfcFld('ATM Site',hdfcSel(si,'atmSite',['In Branch','Offsite','None']))+
      hdfcFld('No. of shift',hdfcSel(si,'atmShiftCount',['1','2','3']))+
      hdfcFld('No. of key sets',hdfcSel(si,'atmKeySets',['1','2','3']))+
      hdfcFld('Open wiring',hdfcSel(si,'atmOpenWiring',YN))+
      hdfcFld('Open Power Socket',hdfcSel(si,'atmOpenPowerSocket',YN))+
      hdfcFld('ATM has Open Connection',hdfcSel(si,'atmOpenConnection',['Yes','No','Nil']))+
      hdfcFld('FAs belonging in ATM',hdfcSel(si,'faBelongingsInAtm',['Yes','No']))+
      hdfcFld('What is in ATM drawer',hdfcSel(si,'atmDrawerContents',['Empty','old Bank document','Registers (FAs)']))+
      hdfcFld('ATM lobby is clean',hdfcSel(si,'atmLobbyClean',['Yes','No','Clean']))+
      hdfcFld('Unauthorised Stickers found',hdfcSel(si,'unauthStickers',YN))+
      hdfcFld('ATM can be seen from Road',hdfcSel(si,'atmVisibleFromRoad',YN))+
      hdfcFld('Surround Night Lightings',hdfcSel(si,'surroundNightLighting',['Good','Fair','Nil']))+
      hdfcFld('Patrolling system before takeover',hdfcSel(si,'patrolBeforeTakeover',YN))+
      hdfcFld('No. of Access to ATM',hdfcSel(si,'atmAccessCount',['1','2','3']))+
      hdfcFld('Can they Access Bank from ATM',hdfcSel(si,'canAccessBankFromAtm',['Yes','No','Locked']))+
      hdfcFld('ATM Guarding',hdfcSel(si,'atmGuarding',['3 Shift','2 Shift (1st & 2nd)','1 shift (G)']))
    );
    html+='<div class="m-card" style="margin-top:12px"><label class="m-lbl">ATM / Lobby notes</label>'+hdfcTa(si,'atmLobbyNotes',3)+'</div>';
  }else if(SV_TAB==='h7'){
    html+=hdfcCard('7. Generator & Utility Infrastructure','',
      hdfcFld('Generator Location',hdfcSel(si,'generatorLocation',['Front side','Back side','Right side','Left side','Basement','NA']))+
      hdfcFld('Generator Battery',hdfcSel(si,'generatorBattery',YN))+
      hdfcFld('Generator Lock is intact',hdfcSel(si,'generatorLockIntact',YN))+
      hdfcFld('Generator working',hdfcSel(si,'generatorWorking',YN))+
      hdfcFld('Who is starting the Generator',hdfcSel(si,'generatorStartedBy',['FA','HK','Bank Staff']))+
      hdfcFld('Who is getting Diesel for Generator',hdfcSel(si,'generatorDieselBy',['FA','HK','Bank Staff']))+
      hdfcFld('Fuel status',hdfcSel(si,'generatorFuel',['Adequate','Low','Empty','NA']))+
      hdfcFld('UPS present',hdfcSel(si,'upsPresent',YN))+
      hdfcFld('UPS backup (hours)',hdfcInp(si,'upsBackupHours',''))+
      hdfcFld('Visibility from the ATM',hdfcSel(si,'generatorVisibleFromAtm',['Yes','No']))+
      hdfcFld('CCTV coverage to Generator',hdfcSel(si,'generatorCctvCoverage',['Yes','No']))+
      hdfcFld('Generator Area Luminated',hdfcSel(si,'generatorAreaLuminated',['Yes','No']))
    );
    html+='<div class="m-card" style="margin-top:12px"><label class="m-lbl">Utility notes</label>'+hdfcTa(si,'utilityNotes',3)+'</div>';
    html+='<div class="m-card" style="margin-top:12px">'+hdfcFld('Generator Register Maintained',hdfcSel(si,'generatorRegisterMaintained',['Yes','No']))+'</div>';
  }else if(SV_TAB==='h8'){
    html+=hdfcCard('8. Perimeter surveillance & Patrolling','',
      hdfcFld('Perimeter fence / wall',hdfcSel(si,'perimeterFence',['Secure','Partial','None']))+
      hdfcFld('Perimeter lighting',hdfcSel(si,'perimeterLighting',['Adequate','Poor','None']))+
      hdfcFld('Perimeter CCTV',hdfcSel(si,'cctvPerimeter',ST))+
      hdfcFld('Patrol frequency',hdfcSel(si,'patrolFrequency',['while HOTO & Nights','Nights only','NA']))+
      hdfcFld('Patrol route followed',hdfcSel(si,'patrolRouteOk',YN))+
      hdfcFld('Outdoor A/C Unit',hdfcSel(si,'outdoorAcUnit',['visible','Not visible','NA']))+
      hdfcFld('Lightings Outdoor A/C Unit area',hdfcSel(si,'outdoorAcLighting',['adequate','poor','Nil']))+
      hdfcFld('CCTV coverage to Outdoor A/C unit',hdfcSel(si,'outdoorAcCctv',YN))
    );
    html+='<div class="m-card" style="margin-top:12px"><label class="m-lbl">Patrol notes</label>'+hdfcTa(si,'patrolNotes',3)+'</div>';
  }else if(SV_TAB==='h9'){
    var FE_N=['0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15'];
    html+=hdfcCard('Fire Safety check - ATM','No. of fire extinguishers in ATM and type counts.',
      hdfcFld('No. of FE in ATM',hdfcSel(si,'feAtmCount',FE_N))+
      hdfcFld('Types CO2',hdfcSel(si,'feAtmCo2',FE_N))+
      hdfcFld('Types DCP',hdfcSel(si,'feAtmDcp',FE_N))+
      hdfcFld('Types Foam',hdfcSel(si,'feAtmFoam',FE_N))+
      hdfcFld('Types Mixed',hdfcSel(si,'feAtmMixed',FE_N))
    );
    html+=hdfcCard('Fire Safety check - Bank','No. of fire extinguishers in Bank and type counts.',
      hdfcFld('No. of FE in Bank',hdfcSel(si,'feBankCount',FE_N))+
      hdfcFld('Types CO2',hdfcSel(si,'feBankCo2',FE_N))+
      hdfcFld('Types DCP',hdfcSel(si,'feBankDcp',FE_N))+
      hdfcFld('Types Foam',hdfcSel(si,'feBankFoam',FE_N))+
      hdfcFld('Types Mixed',hdfcSel(si,'feBankMixed',FE_N))
    );
    html+=hdfcCard('Fire Safety checks','Cooking, audit and drill. Closing-bank checklist is on page 5 only.',
      hdfcFld('Cooking / Heating available',hdfcSel(si,'cookingHeatingAvailable',YN))+
      hdfcFld('Microwave',hdfcSel(si,'microwavePresent',YN))+
      hdfcFld('Recent Fire audit',hdfcDateOrUnknown(si,'recentFireAudit'))+
      hdfcFld('Recent Fire Drill',hdfcDateOrUnknown(si,'recentFireDrill'))+
      hdfcFld('Smoke Detectors',hdfcSel(si,'smokeDetectors',ST.concat(['Not Installed'])))+
      hdfcFld('Fire Alarm',hdfcSel(si,'fireAlarm',ST))
    );
    html+='<div class="m-card" style="margin-top:12px"><label class="m-lbl">Fire safety notes</label>'+hdfcTa(si,'fireSafetyNotes',3)+'</div>';
  }else if(SV_TAB==='h10'){
    html+=hdfcCard('10. Emergency communication & reporting','Router, panic in ATM, Agile Control, FA knowledge.',
      hdfcFld('Router installed',hdfcSel(si,'routerInstalled',YN))+
      hdfcFld('Panic switch availability in ATM',hdfcSel(si,'panicSwitchAtm',YN))+
      hdfcFld('Agile Control Number',hdfcInp(si,'agileControlNumber',''))+
      hdfcFld('FA knowledge on Agile Mobile alarm',hdfcSel(si,'faKnowledgeAgileMobileAlarm',YN))+
      hdfcFld('Emergency Contact Displayed / available with FA',hdfcSel(si,'emergencyContactDisplayedFa',YN))+
      hdfcFld('Escalation matrix Known to FA',hdfcSel(si,'escalationKnownFa',YN))+
      hdfcFld('Bank emergency contact',hdfcInp(si,'emergencyContactBank',''))+
      hdfcFld('Police emergency contact',hdfcInp(si,'emergencyContactPolice',''))+
      hdfcFld('Fire emergency contact',hdfcInp(si,'emergencyContactFire',''))
    );
    html+='<div class="m-card" style="margin-top:12px"><label class="m-lbl">Emergency notes</label>'+hdfcTa(si,'emergencyNotes',3)+'</div>';
  }else if(SV_TAB==='h11'){
    var CCTV_N=['0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20'];
    html+=hdfcCard('Electronic Security Systems','CCTV in ATM and Bank, DVR location, cable.',
      hdfcFld('No. CCTV camera in ATM',hdfcSel(si,'cctvAtmCount',CCTV_N))+
      hdfcFld('No. of CCTV in Bank',hdfcSel(si,'cctvBankCount',CCTV_N))+
      hdfcFld('Location of local DVR',hdfcSel(si,'localDvrLocation',['ATM','Branch','NA']))+
      hdfcFld('CCTV cable is open',hdfcSel(si,'cctvCableOpen',YN))+
      hdfcFld('DVR / NVR — Channels',hdfcInp(si,'dvrNvrChannels',''))+
      hdfcFld('DVR / NVR — HDD capacity',hdfcInp(si,'dvrNvrHdd',''))+
      hdfcFld('Recording Backup (days)',hdfcInp(si,'recordingBackupDays','e.g. 90'))+
      hdfcFld('CCTV coverage adequate',hdfcSel(si,'cctvCoverageOk',YN))
    );
    html+='<div class="m-card" style="margin-top:12px"><label class="m-lbl">Electronic security notes</label>'+hdfcTa(si,'electronicNotes',3)+'</div>';
    var assessorName=(SV[si].surveyedBy||(SV[si].hdfcForm&&SV[si].hdfcForm.surveyedBy)||'');
    if(assessorName&&!(SV[si].hdfcForm&&SV[si].hdfcForm.surveyorSign))setHdfcField(si,'surveyorSign',assessorName);
    html+='<div class="m-card" style="margin-top:12px"><b style="color:#fde68a">Sign-off</b><div class="fgrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:10px">'+
      hdfcFld('Surveyor (same as assessor)', '<div class="m-inp" style="display:flex;align-items:center">'+h(assessorName||(SV[si].hdfcForm&&SV[si].hdfcForm.surveyorSign)||'—')+'</div>')+
      hdfcFld('Branch Representative Signature / Name',hdfcInp(si,'branchRepSign',''))+
      '</div><label class="m-lbl" style="margin-top:10px">General Observations</label>'+hdfcTa(si,'generalObservations',3)+
      '<label class="m-lbl">Recommendations</label>'+hdfcTa(si,'hdfcRecommendations',3)+'</div>';
  }
  return html;
}
function renderHdfcFinalSummary(si){
  var sv=SV[si];if(!sv||sv.surveyKind!=='hdfc')return '';
  var f=sv.hdfcForm||{};
  var rows=[
    ['Location category',f.locationCategory],['Landmark',f.geoLandmark],
    ['Public movement',f.publicMovement24x7],['Remote at night',f.remoteAtNight],
    ['Fire / Police', (f.nearestFireStation||'')+' / '+(f.nearestPoliceStation||'')],
    ['Wine / Bars / 24x7', [f.wineShopNearby,f.barsNearby,f.shops24x7Nearby].filter(Boolean).join(' · ')],
    ['Party office / Airport', [f.politicalPartyOfficeNearby,f.airportNearby].filter(Boolean).join(' · ')],
    ['Surveyed By',f.surveyedBy||f.surveyedByPick],['Holiday on file',f.holidayOpenPermission],
    ['FA knows procedure',f.faKnowsProcedure],
    ['Sanctioned',f.sanctionedGuards],['Day / Afternoon / Evening start',[f.dayShiftStart,f.afternoonShiftStart,f.eveningShiftStart].filter(Boolean).join(' · ')],
    ['FA on duty',f.faOnDuty],['Deployment match',f.deploymentMatch],
    ['Facility Attendants', (function(){try{var a=JSON.parse(f.facilityAttendantsJson||'[]');return (a||[]).map(function(x){return (x.name||'')+(x.idNo?' ('+x.idNo+')':'');}).filter(Boolean).join(' · ');}catch(e){return '';}})()],
    ['Attendance / HOTO / Occurrence',[f.attendanceRegister,f.hotoRegister,f.occurrenceRegister].filter(Boolean).join(' · ')],
    ['Break / Generator / Cash loading',[f.breakRegister,f.generatorRegister,f.cashLoadingRegister].filter(Boolean).join(' · ')],
    ['Open-close / Compliance file',[f.bankOpenCloseRegister,f.complianceFile].filter(Boolean).join(' · ')],
    ['FA docs PVC / Medical / DO',[f.faDocPvc,f.faDocMedical,f.faDocDeploymentOrder].filter(Boolean).join(' · ')],
    ['ATM guarding',f.atmGuarding],
    ['Generator Location',f.generatorLocation||f.generatorPresent],
    ['Visibility from ATM',f.generatorVisibleFromAtm],
    ['CCTV coverage to Generator',f.generatorCctvCoverage],
    ['Generator Area Luminated',f.generatorAreaLuminated],
    ['Generator Register Maintained',f.generatorRegisterMaintained],
    ['Observations',f.generalObservations],['Recommendations',f.hdfcRecommendations]
  ];
  var body='';
  rows.forEach(function(r){if((r[1]||'').toString().trim())body+='<div style="margin:4px 0"><span style="color:#94a3b8">'+h(r[0])+':</span> <span style="color:#e2e8f0;white-space:pre-wrap">'+h(r[1])+'</span></div>';});
  if(!body)body='<div style="color:#94a3b8">No HDFC answers filled yet — use headings 1–11.</div>';
  return '<div class="m-card" style="margin-bottom:12px"><b style="color:#fde68a">HDFC questionnaire summary</b><div style="margin-top:8px;font-size:13px">'+body+'</div></div>';
}
function hdfcStatusLabel(st,sv){
  if(sv&&sv.sentToClientAt)return 'Sent to client by HOD';
  if(st==='Approved')return 'Director approved — HOD can Send to client';
  if(st==='HodApproved'){
    if(sv&&sv.forwardedForApprovalAt)return 'Forwarded for Approval — Management Review';
    return 'Forwarded — awaiting Director Approval';
  }
  if(st==='Completed'){
    var pages=typeof hdfcPagesProgress==='function'?hdfcPagesProgress(sv):{complete:true};
    if(!pages.complete)return 'Incomplete — finish all 15 pages, then Forward for Approval';
    return 'Submitted — HOD: Review / Edit / Forward for Approval';
  }
  if(sv&&sv.reassessmentAt)return 'Re-assessment requested — awaiting staff re-submit';
  return 'Incomplete — Draft (not submitted)';
}
function renderHdfcFooter(si){
  var sv=SV[si];var lock=!canEdit(sv);
  var page=hdfcPageIndex();
  var html='<div class="m-savebar">';
  html+='<button type="button" class="m-btn m-btn-grey" onclick="backHdfcList()">Back to List</button>';
  html+='<button type="button" class="m-btn m-btn-grey"'+(page<=0?' disabled style="opacity:.45"':'')+' onclick="hdfcGoPrev()">Previous</button>';
  if(!isHdfcLastPage())html+='<button type="button" class="m-btn m-btn-navy" onclick="hdfcGoNext()">Next</button>';
  /* HOD: Save + Forward for Approval (no Send to HOD — ops submit; HOD only Review/Edit/Forward). */
  if(IS_STAFF && !lock)html+='<button type="button" class="m-btn m-btn-green" onclick="saveSurveys()">Save</button>';
  if(IS_STAFF && !lock && (sv.status==='Draft'||sv.status==='Completed') && !sv.forwardedForApprovalAt){
    html+='<button type="button" class="m-btn m-btn-navy" onclick="forwardHdfcForApproval('+si+')">Forward for Approval</button>';
    html+='<span class="hint" style="width:100%;text-align:center;color:#fde68a;margin-top:4px">Forward for Approval after Review / Edit — then Management Director Approval</span>';
    html+='<span id="hdfcAutoSaveTip" class="hint" style="width:100%;text-align:center;color:#86efac;margin-top:2px;opacity:.7">All 15 pages auto-save</span>';
  }else if(IS_STAFF && !lock){
    html+='<span id="hdfcAutoSaveTip" class="hint" style="width:100%;text-align:center;color:#86efac;margin-top:2px;opacity:.7">All 15 pages auto-save</span>';
  }
  if(IS_STAFF && sv.status==='Approved' && !sv.sentToClientAt)html+='<button type="button" class="m-btn m-btn-green" onclick="openSendToClient('+si+')">Send to client</button>';
  if(IS_STAFF && sv.status==='HodApproved' && !sv.sentToClientAt)html+='<span class="hint" style="color:#fde68a;align-self:center">Forwarded — waiting Director Approval</span>';
  if(sv.sentToClientAt)html+='<span class="hint" style="color:#86efac;align-self:center">Sent to client by HOD</span>';
  if(IS_MGMT){
    html+='<button type="button" class="m-btn m-btn-gold" onclick="SV_TAB=\\'mgmt1\\';render()">Review</button>';
    if(sv.status==='HodApproved'||(sv.status==='Completed'&&sv.forwardedForApprovalAt))html+='<button type="button" class="m-btn m-btn-green" style="font-size:15px;padding:10px 14px" onclick="approveSurvey('+si+')">Director Approval</button>';
    if(sv.status==='Completed' && !sv.forwardedForApprovalAt)html+='<span class="hint" style="color:#fde68a;align-self:center">Waiting HOD Forward for Approval</span>';
    if(sv.status!=='Draft')html+='<button type="button" class="m-btn m-btn-grey" onclick="reopenSurvey('+si+')">Reopen</button>';
    html+='<button type="button" class="m-btn m-btn-grey" onclick="deleteSurvey('+si+')">Delete</button>';
  }
  html+='</div>';
  return html;
}
function hodApproveSurvey(si){
  var sv=SV[si];if(!sv)return;
  if(!confirm('Confirm HOD approval for this HDFC survey?'))return;
  api('periodicalSurveyHodApprove',{surveyId:sv.id}).then(function(res){
    var s=res.s||res.status,j=res.j||res.body||{};
    if(s!==200){alert(j.error||'Could not record HOD approval.');return;}
    if(j.surveys)SV=j.surveys;else if(j.survey){var ix=SV.findIndex(function(x){return x.id===j.survey.id;});if(ix>=0)SV[ix]=j.survey;}
    alert('HOD approved. Management can now Review and give Director Approval.');
    SV_VIEW='list';SV_EDIT=-1;render();
  });
}
function forwardHdfcForApproval(si){
  var sv=SV[si];if(!sv)return;
  if(!(sv.company||'').trim()){alert('Pick HDFC client first (heading 1), then Forward for Approval.');SV_TAB='h1';render();return;}
  var block=typeof hdfcPagesIncompleteMessage==='function'?hdfcPagesIncompleteMessage(sv):'';
  if(block){alert(block);return;}
  if(!confirm('All 15 pages are completed. Forward this HDFC survey for Management approval?'))return;
  api('periodicalSurveySave',{surveys:SV,branchId:branchId()}).then(function(saveRes){
    var s=saveRes.s||saveRes.status,j=saveRes.j||saveRes.body||{};
    if(s===200&&j.surveys)SV=j.surveys;
    var cur=SV.find(function(x){return x.id===sv.id;})||sv;
    return api('periodicalSurveyForwardApproval',{surveyId:cur.id});
  }).then(function(res){
    if(!res)return;
    var s=res.s||res.status,j=res.j||res.body||{};
    if(s!==200){alert(j.error||'Could not forward for approval.');return;}
    if(j.surveys)SV=j.surveys;else if(j.survey){var ix=SV.findIndex(function(x){return x.id===j.survey.id;});if(ix>=0)SV[ix]=j.survey;}
    alert('Forwarded for approval. Management can Review and give Director Approval.');
    SV_VIEW='list';SV_EDIT=-1;render();
  });
}
function requestHdfcReassessment(si){
  var sv=SV[si];if(!sv)return;
  if(sv.surveyKind!=='hdfc'){alert('Re-assessment is for HDFC SSA only.');return;}
  if(sv.status==='Draft'){alert('This is already a Draft. Ask staff to complete and Submit again.');return;}
  var note=prompt('Optional note for the staff (or leave blank):','')||'';
  if(!confirm('Request Re-assessment?\\n\\n• Message goes to: '+(sv.surveyedBy||sv.submittedBy||'concerned staff')+'\\n• Branch progress will reduce until they re-submit\\n• Status becomes Draft again'))return;
  api('periodicalSurveyReassessment',{surveyId:sv.id,note:note}).then(function(res){
    var s=res.s||res.status,j=res.j||res.body||{};
    if(s!==200){alert(j.error||'Could not request Re-assessment.');return;}
    if(j.surveys)SV=j.surveys;else if(j.survey){var ix=SV.findIndex(function(x){return x.id===j.survey.id;});if(ix>=0)SV[ix]=j.survey;}
    alert(j.message||'Re-assessment requested. Branch progress reduced.');
    SV_VIEW='list';SV_EDIT=-1;render();
  });
}
function hdfcChecklistItems(){
  var parts=(typeof SURVEY_TPL==='object'&&SURVEY_TPL&&SURVEY_TPL.parts)?SURVEY_TPL.parts:[];
  var out=[];
  parts.forEach(function(part){(part.items||[]).forEach(function(it){out.push(it);});});
  return out;
}
function hdfcScoreItemIndex(itemId){
  var list=hdfcChecklistItems();
  for(var i=0;i<list.length;i++){if(list[i].id===itemId)return i;}
  return -1;
}
function hdfcScoreIsSet(sv,itemId){
  return !!(sv&&sv.scores&&Object.prototype.hasOwnProperty.call(sv.scores,itemId));
}
function goToScoreRow(itemId){
  var n=document.getElementById('scoreRow_'+itemId);
  if(!n)return;
  try{n.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){try{n.scrollIntoView(true);}catch(e2){}}
}
function hdfcFirstOpenScoreIx(){
  var list=hdfcChecklistItems();
  var si=typeof SV_EDIT==='number'&&SV_EDIT>=0?SV_EDIT:0;
  var sv=SV[si];
  for(var i=0;i<list.length;i++){if(!hdfcScoreIsSet(sv,list[i].id))return i;}
  return Math.max(0,list.length-1);
}
function hdfcScoreStep(delta){
  var list=hdfcChecklistItems();
  if(!list.length)return;
  HDFC_SCORE_IX=Math.max(0,Math.min(list.length-1,(HDFC_SCORE_IX||0)+delta));
  paintHdfcChecklist();
}
function renderScoreRow(si,item,serial){
  var set=hdfcScoreIsSet(SV[si],item.id);
  var sc=set?Number(SV[si].scores[item.id]):null;
  var note=(SV[si].scoreNotes||{})[item.id]||'';
  var n=serial!=null?serial:(hdfcScoreItemIndex(item.id)+1);
  var btns=[0,1,2,3,4,5].map(function(v){return '<button type="button" class="score-btn'+(sc===v?' on':'')+'" onclick="event.stopPropagation();setScore('+si+',\\''+item.id+'\\','+v+')">'+v+'</button>';}).join('');
  return '<div class="score-row" id="scoreRow_'+item.id+'" data-score-id="'+a(item.id)+'" style="margin:10px 0;padding:10px 0 12px;border-bottom:1px solid #22304f">'+
    '<div style="font-weight:700;color:#fff;font-size:14px"><span style="color:#fde68a;margin-right:8px">'+n+'.</span>'+h(item.label)+'</div>'+
    (item.hint?'<div style="font-size:12px;color:#94a3b8;margin-top:2px">'+h(item.hint)+'</div>':'')+
    '<div class="score-btns">'+btns+'</div>'+
    '<input class="m-inp" style="margin-top:6px" placeholder="Notes (optional)" value="'+a(note)+'" oninput="if(!SV['+si+'].scoreNotes)SV['+si+'].scoreNotes={};SV['+si+'].scoreNotes[\\''+item.id+'\\']=this.value">'+
    '</div>';
}
function hdfcChecklistInnerHtml(si){
  var list=hdfcChecklistItems();
  var n=list.length||1;
  if(HDFC_SCORE_IX==null||HDFC_SCORE_IX<0||HDFC_SCORE_IX>=n)HDFC_SCORE_IX=hdfcFirstOpenScoreIx();
  HDFC_SCORE_IX=Math.max(0,Math.min(n-1,HDFC_SCORE_IX||0));
  var item=list[HDFC_SCORE_IX];
  var sn=HDFC_SCORE_IX+1;
  var done=0;
  for(var i=0;i<list.length;i++){if(hdfcScoreIsSet(SV[si],list[i].id))done++;}
  if(!item)return '<div class="hint">No risk items on this list.</div>';
  return '<div class="m-card" style="margin-top:12px">'+
    '<div style="color:#fde68a;font-weight:800;margin-bottom:8px">Serial '+sn+' of '+n+' · scored '+done+' / '+n+'</div>'+
    renderScoreRow(si,item,sn)+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">'+
    '<button type="button" class="m-btn m-btn-grey"'+(HDFC_SCORE_IX<=0?' disabled style="opacity:.45"':'')+' onclick="hdfcScoreStep(-1)">Previous serial</button>'+
    '<button type="button" class="m-btn m-btn-navy"'+(HDFC_SCORE_IX>=n-1?' disabled style="opacity:.45"':'')+' onclick="hdfcScoreStep(1)">Next serial</button>'+
    '</div></div>';
}
function renderHdfcChecklist(si){
  return hdfcProcessGuideHtml('checklist')+
    '<p class="hint"><b>12. Risk check list</b> — Score 0 (low) to 5 (high). After you tap a number, the <b>next serial</b> opens here. You stay on page 12 (not the heading menu).</p>'+
    '<div id="hdfcCheckBox">'+hdfcChecklistInnerHtml(si)+'</div>';
}
function paintHdfcChecklist(){
  var box=document.getElementById('hdfcCheckBox');
  if(!box)return;
  var si=typeof SV_EDIT==='number'&&SV_EDIT>=0?SV_EDIT:0;
  box.innerHTML=hdfcChecklistInnerHtml(si);
  try{box.scrollIntoView({block:'nearest'});}catch(e){}
}
function setScore(si,itemId,val){
  if(!SV[si])return;
  if(typeof canEdit==='function'&&!canEdit(SV[si]))return;
  if(!SV[si].scores)SV[si].scores={};
  SV[si].scores[itemId]=val;
  var list=hdfcChecklistItems();
  var ix=hdfcScoreItemIndex(itemId);
  if(ix>=0&&ix<list.length-1)HDFC_SCORE_IX=ix+1;
  else if(ix>=0)HDFC_SCORE_IX=ix;
  if(typeof schedulePublicAutoSave==='function')schedulePublicAutoSave();
  else if(typeof scheduleHdfcAutoSave==='function')scheduleHdfcAutoSave();
  var box=document.getElementById('hdfcCheckBox');
  if(box){paintHdfcChecklist();return;}
  var next=list[HDFC_SCORE_IX];
  if(typeof render==='function')render({keepScroll:true,focusScore:next?next.id:itemId});
  else goToScoreRow(next?next.id:itemId);
}
`
}
