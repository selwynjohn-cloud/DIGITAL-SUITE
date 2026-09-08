/** Recruitment DRR — detailed Excel-style form and history. */

export const DRR_DETAIL_PAGES_JS = `
var DRR_DETAILS=[],DRR_DETAIL_DATE='',DRR_DETAIL_COMPANY='agile',DRR_DETAIL_BRANCH='',DRR_DETAIL_PKG=null,DRR_VACANT=null,DRR_CLIENTS=[];
function ddBlank(branch,date,company){
  return {id:nid('dp'),branchId:branch||'',company:company||'agile',reportDate:date||today(),recruits:[],transfers:[],resignations:[],submittedBy:'',submittedAt:'',active:true,nilRecruitment:false};
}
function ddBranch(){
  return RECRUIT_ROLE==='branch'?(RECRUIT_BRANCH||''):(DRR_DETAIL_BRANCH||RECRUIT_BRANCH||BRANCHES[0]||'');
}
function ddBranchField(){
  if(RECRUIT_ROLE==='branch')return '<div><label>Branch</label><input value="'+a(RECRUIT_BRANCH||'')+'" disabled></div>';
  var b=ddBranch();
  return '<div><label>Branch</label><select id="dd_branch" onchange="DRR_DETAIL_BRANCH=this.value;loadDrrDetail()">'+
    (BRANCHES||[]).map(function(x){return '<option value="'+a(x)+'"'+(x===b?' selected':'')+'>'+h(x)+'</option>';}).join('')+
    '</select></div>';
}
function ddDate(v){
  var s=String(v||'').slice(0,10);if(!s)return '—';var p=s.split('-');
  return p.length===3?String(+p[2]).padStart(2,'0')+'/'+String(+p[1]).padStart(2,'0')+'/'+p[0]:s;
}
function ddJs(v){return JSON.stringify(String(v||''));}
function drrDetailFor(branch,date){
  var d=date||today();
  return (DRR_DETAILS||[]).filter(function(p){
    return p.active!==false&&p.reportDate===d&&drrPackageMatchesCentre(p,branch);
  }).map(function(p){return (!branch||branch==='ALL')?p:drrFilterPackageToCentre(p,branch);});
}
function isHydZoneCentre(b){
  return b==='Hyderabad - A'||b==='Hyderabad - B'||b==='Hi-Tech City';
}
function hydZoneFromText(t){
  var s=String(t||'').toLowerCase();
  if(/hi-?tech|hitech/.test(s))return 'Hi-Tech City';
  if(/hyderabad[\\s\\-–]*b\\b|hyd[\\s\\-]*zone[\\s\\-]*b|zone[\\s\\-–]*b\\b/.test(s))return 'Hyderabad - B';
  if(/hyderabad[\\s\\-–]*a\\b|hyd[\\s\\-]*zone[\\s\\-]*a|zone[\\s\\-–]*a\\b/.test(s))return 'Hyderabad - A';
  if(/hyderabad[\\s\\-–]*b/.test(s))return 'Hyderabad - B';
  if(/hyderabad[\\s\\-–]*a/.test(s))return 'Hyderabad - A';
  return '';
}
function drrPackageMatchesCentre(p,centre){
  if(!centre||centre==='ALL')return true;
  var bid=String(p.branchId||'');
  if(bid===centre)return true;
  if(centre==='Bangalore'&&/gulbarga|kalaburagi/i.test(bid))return true;
  if(isHydZoneCentre(centre)){
    if(bid===centre)return true;
    if(hydZoneFromText(bid)===centre)return true;
    if(/^(Hyderabad|Recruitment Department|Training Department|Training Academy)$/i.test(bid))return true;
  }
  return false;
}
function drrRowZone(r){
  return hydZoneFromText(((r&&r.unit)||'')+' '+((r&&r.location)||'')+' '+((r&&r.vacantPosition)||'')+' '+((r&&r.fromUnit)||'')+' '+((r&&r.toUnit)||'')+' '+((r&&r.fromLocation)||'')+' '+((r&&r.toLocation)||'')+' '+((r&&r.remarks)||''));
}
function drrFilterPackageToCentre(p,centre){
  if(!isHydZoneCentre(centre))return p;
  if(String(p.branchId||'')===centre||hydZoneFromText(p.branchId)===centre)return p;
  return Object.assign({},p,{
    recruits:(p.recruits||[]).filter(function(r){return drrRowZone(r)===centre;}),
    transfers:(p.transfers||[]).filter(function(r){return drrRowZone(r)===centre||drrRowZone({unit:r.fromUnit,location:r.fromLocation})===centre||drrRowZone({unit:r.toUnit,location:r.toLocation})===centre;}),
    resignations:(p.resignations||[]).filter(function(r){return drrRowZone(r)===centre;})
  });
}
function drrDetailCounts(list){
  return (list||[]).reduce(function(a,p){
    (p.recruits||[]).forEach(function(r){
      if(r.kind==='rejoin') a.rejoins++;
      else a.recruits++;
      var ch=classifyRecruitSource(r);
      a.sources[ch]=(a.sources[ch]||0)+1;
    });
    a.transfers+=(p.transfers||[]).length;
    a.resignations+=(p.resignations||[]).length;
    return a;
  },{recruits:0,rejoins:0,transfers:0,resignations:0,sources:{web:0,walkin:0,referral:0,recruiters:0,academy:0,others:0}});
}
function classifyRecruitSource(r){
  var v=String(r&&r.sourceChannel||'').toLowerCase();
  if(v==='web'||v==='walkin'||v==='referral'||v==='recruiters'||v==='academy'||v==='others')return v;
  var t=((r&&r.referredBy||'')+' '+(r&&r.remarks||'')).toLowerCase();
  if(/security.?job|website|web\\b|online|www\\.|internet|whatsapp/.test(t))return 'web';
  if(/walk.?in|walkin/.test(t))return 'walkin';
  if(/referr|referral|friend|relative|known/.test(t))return 'referral';
  if(/recruiter|field.?agent|sourcing|camp|vendor/.test(t))return 'recruiters';
  if(/academy|training|ojt|lecturer/.test(t))return 'academy';
  return 'others';
}
function drrDetailHasRows(p){
  return (p.recruits||[]).length+(p.transfers||[]).length+(p.resignations||[]).length>0;
}
function drrDetailIsNil(p){
  return !!(p&&p.nilRecruitment)&&!drrDetailHasRows(p);
}
function drrDetailIsSubmitted(p){
  return drrDetailHasRows(p)||drrDetailIsNil(p);
}
function upsertDrrDetail(pkg){
  if(!pkg)return;
  DRR_DETAILS=DRR_DETAILS||[];
  var i=-1;
  for(var k=0;k<DRR_DETAILS.length;k++){
    if(DRR_DETAILS[k].branchId===pkg.branchId&&DRR_DETAILS[k].reportDate===pkg.reportDate&&DRR_DETAILS[k].company===pkg.company){i=k;break;}
  }
  if(i>=0)DRR_DETAILS[i]=pkg;else DRR_DETAILS.push(pkg);
}
function ddCompanyLabel(co){
  if(co==='sparks')return 'Sparks';
  if(co==='agile')return 'Agile';
  return 'All';
}
function ddCompanySelect(id,val,onchange){
  var v=val||'agile';
  return '<select id="'+id+'" onchange="'+onchange+'">'+
    '<option value="all"'+(v==='all'?' selected':'')+'>All</option>'+
    '<option value="agile"'+(v==='agile'?' selected':'')+'>Agile</option>'+
    '<option value="sparks"'+(v==='sparks'?' selected':'')+'>Sparks</option>'+
    '</select>';
}
function drrDetailForm(){
  if(el('ttl'))el('ttl').textContent='Daily Recruitment Report (DRR)';
  DRR_DETAIL_DATE=DRR_DETAIL_DATE||today();
  DRR_DETAIL_BRANCH=ddBranch();
  el('content').innerHTML=reportWrap('Daily Recruitment Report (DRR)','Recruitment-specific detailed format',portalBadge(),
    '<div class="card"><p class="rpt-note"><b>ASFPL / SSMS Daily Recruitment Details</b> — same form for every branch and Recruitment Department. Fill <b>client-wise</b>. Company <b>Agile</b> or <b>Sparks</b>, then <b>Review &amp; Save</b>. If there is no recruitment today, tap <b>Submit nil recruitment</b>.</p>'+
    '<div class="fgrid">'+ddBranchField()+
    '<div><label>Report date</label><input type="date" id="dd_date" value="'+a(DRR_DETAIL_DATE)+'" onchange="DRR_DETAIL_DATE=this.value;loadDrrDetail()"></div>'+
    '<div><label>Company</label>'+ddCompanySelect('dd_company',DRR_DETAIL_COMPANY,'DRR_DETAIL_COMPANY=this.value;loadDrrDetail()')+'</div></div>'+
    '<p id="dd_msg" class="rpt-note">Loading…</p></div><div id="dd_body"></div>');
  loadDrrDetail();
}
function loadDrrDetail(){
  var b=ddBranch(),d=(el('dd_date')&&el('dd_date').value)||DRR_DETAIL_DATE||today(),co=(el('dd_company')&&el('dd_company').value)||DRR_DETAIL_COMPANY||'agile';
  DRR_DETAIL_BRANCH=b;DRR_DETAIL_DATE=d;DRR_DETAIL_COMPANY=co;
  var msg=el('dd_msg');if(msg)msg.textContent='Loading detailed DRR…';
  api('loadDrrDetail',{detailBranchId:b,reportDate:d,company:co}).then(function(res){
    if(res.s!==200){if(msg)msg.textContent=res.j.error||'Could not load report.';return;}
    DRR_DETAIL_PKG=res.j.package||ddBlank(b,d,co==='all'?'agile':co);
    DRR_DETAIL_PKG.company=co;
    DRR_VACANT=res.j.vacant||null;
    DRR_CLIENTS=res.j.clients||(DRR_VACANT&&DRR_VACANT.clients)||[];
    if(msg)msg.textContent=(co==='all'?'Company All shows Agile + Sparks. Pick Agile or Sparks to save. ':'')+(drrDetailIsNil(DRR_DETAIL_PKG)?'Saved as Nil recruitment'+(DRR_DETAIL_PKG.submittedAt?' · '+new Date(DRR_DETAIL_PKG.submittedAt).toLocaleString('en-IN'):''):(DRR_DETAIL_PKG.submittedAt?'Saved '+new Date(DRR_DETAIL_PKG.submittedAt).toLocaleString('en-IN'):'New report'));
    renderDrrDetail();
  }).catch(function(){if(msg)msg.textContent='Could not load report — check internet.';});
}
function ddInput(id,label,type,placeholder,value,required){
  return '<div><label>'+label+(required?' *':'')+'</label><input type="'+(type||'text')+'" id="'+id+'" value="'+a(value||'')+'" placeholder="'+a(placeholder||'')+'"></div>';
}
function ddVacantOptions(){
  var posts=(DRR_VACANT&&DRR_VACANT.posts)||[];
  return '<option value="">— Select vacant position —</option>'+posts.map(function(v){
    var label=String(v.client||'')+(v.unit?' @ '+v.unit:'')+' ('+v.vac+' vacant)';
    return '<option value="'+a(label)+'">'+h(label)+'</option>';
  }).join('')+'<option value="Other">Other / not on list</option>';
}
function ddDesigOptions(){
  return ['SG','LSG','SO','ASO','Supervisor','Driver','HK','HK-Supervisor','Escorts','SPO','SPA','Pantry Boy','STF','FA','Care Taker','CCTV operator','Duty Officer','Assignment Manager','Security Officer','Assistant Security Officer','Lady Security Guard','Other'].map(function(x){
    return '<option value="'+a(x)+'"'+(x==='SG'?' selected':'')+'>'+h(x)+'</option>';
  }).join('');
}
function ddClientOptions(){
  var list=DRR_CLIENTS||[];
  return '<option value="">— Select client —</option>'+list.map(function(c){
    var name=typeof c==='string'?c:(c.name||'');
    return '<option value="'+a(name)+'">'+h(name)+'</option>';
  }).join('')+'<option value="Other">Other</option>';
}
function ddToggleOther(selId,boxId){
  var s=el(selId),b=el(boxId);
  if(b)b.style.display=(s&&s.value==='Other')?'block':'none';
}
function ddOnClientChange(){
  ddToggleOther('nr_unit','nr_unit_other_wrap');
  var s=el('nr_unit');if(!s||s.value==='Other'||!s.value)return;
  var hit=(DRR_CLIENTS||[]).find(function(c){return (typeof c==='string'?c:c.name)===s.value;});
  var loc=hit&&typeof hit!=='string'?hit.location:'';
  if(loc&&el('nr_location')&&!el('nr_location').value)el('nr_location').value=loc;
}
function ddPick(selId,otherId){
  var s=el(selId);if(!s)return '';
  if(s.value==='Other')return ((el(otherId)&&el(otherId).value)||'').trim();
  return String(s.value||'').trim();
}
function ddVacantBlock(){
  var v=DRR_VACANT||{};
  var posts=v.posts||[];
  var rows=posts.map(function(p,i){return '<tr><td>'+(i+1)+'</td><td><b>'+h(p.client)+'</b></td><td>'+h(p.unit||'—')+'</td><td>'+p.vac+'</td></tr>';}).join('');
  var note=!v.misSubmitted
    ? 'Today\\'s Daily MIS is not submitted yet. Vacant posts shown as 0 — not yesterday leftover.'
    : ((v.vac||0)===0
      ? 'No vacant posts on today\\'s Daily MIS.'
      : 'From today\\'s Daily MIS'+(v.date?' · '+ddDate(v.date):'')+'. Total vacant: <b>'+(v.vac||0)+'</b>.');
  return reportSec('Vacant positions')+'<div class="card"><p class="rpt-note">'+note+'</p></div>'+
    '<div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>#</th><th>Client</th><th>Location</th><th>Vacant</th></tr></thead><tbody>'+(rows||'<tr><td colspan="4">No vacant posts on today\\'s Daily MIS.</td></tr>')+'</tbody></table></div>';
}
function renderDrrDetail(){
  var p=DRR_DETAIL_PKG||ddBlank(ddBranch(),DRR_DETAIL_DATE,DRR_DETAIL_COMPANY);
  var rr=(p.recruits||[]).map(function(r,i){return '<tr><td>'+(i+1)+'</td><td><b>'+h(r.name)+'</b><br><small>'+h(r.empId)+' · '+(r.kind==='rejoin'?'Rejoin':'New')+' · '+h(classifyRecruitSource(r))+(r.gender==='female'?' · Female':r.gender==='male'?' · Male':'')+(r.ladyGuardUndertaking?' · ✓ Received Ladies Undertaking':'')+'</small></td><td>'+h(r.designation)+'</td><td>'+h(r.mobile)+'</td><td>'+ddDate(r.doj)+'</td><td>'+h(r.unit)+'</td><td>'+h(r.location)+'</td><td>'+h(r.vacantPosition||'—')+'</td><td><b>'+h(r.referredBy)+'</b></td><td>'+h(r.remarks||'')+'</td><td><button class="btn r" style="padding:4px 8px" onclick="ddDelete(\\'recruit\\','+i+')">Delete</button></td></tr>';}).join('');
  var tr=(p.transfers||[]).map(function(r,i){return '<tr><td>'+(i+1)+'</td><td>'+h(r.empId)+'</td><td>'+h(r.name)+'</td><td>'+h(r.fromUnit)+' · '+h(r.fromLocation)+'</td><td>'+h(r.toUnit)+' · '+h(r.toLocation)+'</td><td>'+h(r.remarks||'')+'</td><td><button class="btn r" style="padding:4px 8px" onclick="ddDelete(\\'transfer\\','+i+')">Delete</button></td></tr>';}).join('');
  var rs=(p.resignations||[]).map(function(r,i){return '<tr><td>'+(i+1)+'</td><td>'+h(r.empId)+'</td><td>'+h(r.name)+'</td><td>'+h(r.unit)+'</td><td>'+h(r.location)+'</td><td>'+ddDate(r.resignationDate)+'</td><td>'+h(r.remarks||'')+'</td><td><button class="btn r" style="padding:4px 8px" onclick="ddDelete(\\'resignation\\','+i+')">Delete</button></td></tr>';}).join('');
  var recForm='<div class="card"><div class="fgrid">'+
    ddInput('nr_name','Name','text','Full name','',true)+ddInput('nr_emp','Emp ID','text','Employee ID','',true)+
    '<div><label>Designation *</label><select id="nr_desig" onchange="ddToggleOther(\\'nr_desig\\',\\'nr_desig_other_wrap\\')">'+ddDesigOptions()+'</select></div>'+
    '<div id="nr_desig_other_wrap" class="drr-other-box">'+ddInput('nr_desig_other','Other designation','text','Type designation','',false)+'</div>'+
    '<div><label>Male / Female *</label><select id="nr_gender"><option value="">— Select —</option><option value="male">Male</option><option value="female">Female</option></select></div>'+
    ddInput('nr_mobile','Mobile','tel','10-digit mobile','',true)+
    ddInput('nr_doj','DOJ','date','','',true)+ddInput('nr_dob','DOB','date','','',false)+
    ddInput('nr_parent','S/O, W/O or D/O','text','Parent / spouse name','',false)+
    '<div><label>Client Name *</label><select id="nr_unit" onchange="ddOnClientChange()">'+ddClientOptions()+'</select></div>'+
    '<div id="nr_unit_other_wrap" class="drr-other-box">'+ddInput('nr_unit_other','Other client name','text','Type client name','',false)+'</div>'+
    ddInput('nr_location','Location','text','Site location','',true)+
    '<div><label>Vacant position</label><select id="nr_vacant">'+ddVacantOptions()+'</select></div>'+
    ddInput('nr_ref','Referred by','text','Referral person name','',true)+
    ddInput('nr_aadhar','Aadhaar','text','12 digits','',false)+ddInput('nr_edu','Education','text','Qualification','',false)+
    '<div><label>PVC status</label><select id="nr_pvc"><option>UNDER TAKING</option><option>SUBMITTED</option><option>PENDING</option><option>NA</option></select></div>'+
    '<div><label>Medical status</label><select id="nr_med"><option>UNDER TAKING</option><option>SUBMITTED</option><option>PENDING</option><option>NA</option></select></div>'+
    '<div><label>Received Ladies Undertaking</label><select id="nr_lady_ss"><option value="">—</option><option value="yes">Yes</option><option value="no">No</option></select></div>'+
    ddInput('nr_bank','Bank account','text','Bank / account','',false)+ddInput('nr_uniform','Uniform cost','text','Amount','',false)+
    ddInput('nr_paid','Amount paid','text','Amount','',false)+ddInput('nr_instal','Instalments','text','Number / details','',false)+
    ddInput('nr_informed','Informed to (OM)','text','OM name','',true)+
    '<div><label>Mobile app installed</label><select id="nr_app"><option value="">—</option><option>YES</option><option>NO</option></select></div>'+
    '<div><label>Type</label><select id="nr_kind"><option value="new">New recruitment</option><option value="rejoin">Rejoin (existing guard)</option></select></div>'+
    '<div><label>Source</label><select id="nr_source"><option value="walkin">Walk-in</option><option value="web">Web Source</option><option value="referral">Referral</option><option value="recruiters">Recruiters</option><option value="academy">Academy</option><option value="others">Others</option></select></div>'+
    '<div style="grid-column:1/-1">'+ddInput('nr_remarks','Remarks','text','Remarks','',false)+'</div></div>'+
    '<button class="btn" style="margin-top:10px" onclick="ddAddRecruit()">+ Add recruitment</button></div>';
  var transferForm='<div class="card fgrid">'+ddInput('tr_emp','Emp ID','text','Employee ID','',true)+ddInput('tr_name','Name','text','Name','',true)+ddInput('tr_from','From unit','text','From client','',true)+ddInput('tr_fromloc','From location','text','From location','',false)+ddInput('tr_to','To unit','text','To client','',true)+ddInput('tr_toloc','To location','text','To location','',false)+ddInput('tr_remarks','Remarks','text','Remarks','',false)+'<div style="align-self:end"><button class="btn grey" onclick="ddAddTransfer()">+ Add transfer</button></div></div>';
  var resignationForm='<div class="card fgrid">'+ddInput('rs_emp','Emp ID','text','Employee ID','',true)+ddInput('rs_name','Name','text','Name','',true)+ddInput('rs_unit','Unit','text','Client / unit','',true)+ddInput('rs_location','Location','text','Location','',false)+ddInput('rs_date','Resignation date','date','','',true)+ddInput('rs_remarks','Remarks','text','Reason / remarks','',false)+'<div style="align-self:end"><button class="btn grey" onclick="ddAddResignation()">+ Add resignation</button></div></div>';
  el('dd_body').innerHTML=
    ddVacantBlock()+
    reportSec('1. New recruits — full details')+recForm+
    '<div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>#</th><th>Name / ID</th><th>Designation</th><th>Mobile</th><th>DOJ</th><th>Client</th><th>Location</th><th>Vacant position</th><th>Referred by</th><th>Remarks</th><th></th></tr></thead><tbody>'+(rr||'<tr><td colspan="11">No new recruits entered.</td></tr>')+'</tbody></table></div>'+
    reportSec('2. Transfers')+transferForm+
    '<div class="tblwrap"><table><thead><tr><th>#</th><th>ID</th><th>Name</th><th>From</th><th>To</th><th>Remarks</th><th></th></tr></thead><tbody>'+(tr||'<tr><td colspan="7">No transfers entered.</td></tr>')+'</tbody></table></div>'+
    reportSec('3. Resignations')+resignationForm+
    '<div class="tblwrap"><table><thead><tr><th>#</th><th>ID</th><th>Name</th><th>Unit</th><th>Location</th><th>Date</th><th>Remarks</th><th></th></tr></thead><tbody>'+(rs||'<tr><td colspan="8">No resignations entered.</td></tr>')+'</tbody></table></div>'+
    '<div class="card" style="margin-top:14px"><label>Submitted by</label><input id="dd_by" value="'+a(p.submittedBy||'')+'" placeholder="Your name"></div>'+
    '<div class="savebar"><button class="btn green" onclick="saveDrrDetail()">✓ Review &amp; Save Detailed DRR</button> <button class="btn grey" onclick="saveNilDrr()">Submit nil recruitment</button>'+(RECRUIT_ROLE==='branch'?'':' <button class="btn grey" onclick="drrDetailHistory()">DRR History</button>')+'</div>';
}
function ddRequired(ids,msg){for(var i=0;i<ids.length;i++){var x=el(ids[i]);if(!x||!String(x.value||'').trim()){alert(msg);if(x)x.focus();return false;}}return true;}
function ddNeedCompany(){
  if(DRR_DETAIL_COMPANY==='all'){alert('Pick Agile or Sparks at the top, then add names.');return false;}
  return true;
}
function ddRowLooksLady(r){
  if(!r)return false;
  if(r.gender==='female'||r.ladyRecruit)return true;
  if(r.gender==='male')return false;
  return /\\blady\\b|\\bfemale\\b|\\blsg\\b|lady security/.test(String((r.designation||'')+' '+(r.name||'')).toLowerCase());
}
function ddAddRecruit(){
  if(!ddNeedCompany())return;
  if(!ddRequired(['nr_name','nr_emp','nr_mobile','nr_doj','nr_location','nr_ref','nr_informed'],'Fill all required new-recruit fields, including Referred by and Informed to.'))return;
  var desig=ddPick('nr_desig','nr_desig_other');
  var unit=ddPick('nr_unit','nr_unit_other');
  var gender=el('nr_gender')&&el('nr_gender').value;
  if(!desig){alert('Select Designation.');el('nr_desig').focus();return;}
  if(!gender){alert('Select Male or Female after Designation.');el('nr_gender').focus();return;}
  if(!unit){alert('Select Client Name.');el('nr_unit').focus();return;}
  var lady=gender==='female';
  var undert=el('nr_lady_ss')&&el('nr_lady_ss').value==='yes';
  if(lady&&!undert){
    alert('Received Ladies Undertaking is compulsory when Female is selected. Choose Yes.');
    if(el('nr_lady_ss'))el('nr_lady_ss').focus();
    return;
  }
  var p=DRR_DETAIL_PKG;p.recruits=p.recruits||[];p.nilRecruitment=false;
  p.recruits.push({id:nid('rc'),empId:el('nr_emp').value,name:el('nr_name').value,designation:desig,mobile:el('nr_mobile').value,parentName:el('nr_parent').value,doj:el('nr_doj').value,dob:el('nr_dob').value,unit:unit,location:el('nr_location').value,vacantPosition:(el('nr_vacant')&&el('nr_vacant').value)||'',dateOfReport:DRR_DETAIL_DATE,aadhar:el('nr_aadhar').value,educationCert:el('nr_edu').value,policeVerification:el('nr_pvc').value,medicalCertificate:el('nr_med').value,bankAccount:el('nr_bank').value,uniformCost:el('nr_uniform').value,amountPaid:el('nr_paid').value,instalments:el('nr_instal').value,referredBy:el('nr_ref').value,remarks:el('nr_remarks').value,informedTo:el('nr_informed').value,mobileAppInstalled:el('nr_app').value,kind:el('nr_kind')&&el('nr_kind').value==='rejoin'?'rejoin':'new',sourceChannel:(el('nr_source')&&el('nr_source').value)||'walkin',gender:gender,ladyGuardUndertaking:undert,ladyRecruit:lady});
  renderDrrDetail();
}
function ddAddTransfer(){
  if(!ddNeedCompany())return;
  if(!ddRequired(['tr_emp','tr_name','tr_from','tr_to'],'Fill Emp ID, name, From unit and To unit.'))return;
  DRR_DETAIL_PKG.nilRecruitment=false;DRR_DETAIL_PKG.transfers.push({id:nid('tr'),empId:el('tr_emp').value,name:el('tr_name').value,fromUnit:el('tr_from').value,fromLocation:el('tr_fromloc').value,toUnit:el('tr_to').value,toLocation:el('tr_toloc').value,remarks:el('tr_remarks').value});renderDrrDetail();
}
function ddAddResignation(){
  if(!ddNeedCompany())return;
  if(!ddRequired(['rs_emp','rs_name','rs_unit','rs_date'],'Fill Emp ID, name, unit and resignation date.'))return;
  DRR_DETAIL_PKG.nilRecruitment=false;DRR_DETAIL_PKG.resignations.push({id:nid('rs'),empId:el('rs_emp').value,name:el('rs_name').value,unit:el('rs_unit').value,location:el('rs_location').value,resignationDate:el('rs_date').value,remarks:el('rs_remarks').value});renderDrrDetail();
}
function ddDelete(type,i){
  if(!DRR_DETAIL_PKG)return;
  if(type==='recruit')DRR_DETAIL_PKG.recruits.splice(i,1);
  if(type==='transfer')DRR_DETAIL_PKG.transfers.splice(i,1);
  if(type==='resignation')DRR_DETAIL_PKG.resignations.splice(i,1);
  renderDrrDetail();
}
function saveNilDrr(){saveDrrDetail(true);}
function saveDrrDetail(asNil){
  var p=DRR_DETAIL_PKG||ddBlank(ddBranch(),DRR_DETAIL_DATE,DRR_DETAIL_COMPANY);
  p.branchId=ddBranch();p.reportDate=DRR_DETAIL_DATE;p.company=DRR_DETAIL_COMPANY;p.submittedBy=(el('dd_by')&&el('dd_by').value)||p.submittedBy||'';
  if(DRR_DETAIL_COMPANY==='all'||p.company==='all'){alert('Choose Agile or Sparks, then save. All is only for viewing both together.');return;}
  if(!p.branchId||!p.reportDate){alert('Branch and report date are required.');return;}
  if(!p.submittedBy){alert('Enter Submitted by.');return;}
  var empty=!drrDetailHasRows(p);
  if(asNil||empty){
    if(!empty){alert('This report has names. Delete them first, or use Review & Save.');return;}
    if(!confirm('No new recruits, transfers or resignations today. Save as Nil recruitment?'))return;
    p.nilRecruitment=true;p.recruits=[];p.transfers=[];p.resignations=[];
  }else{
    p.nilRecruitment=false;
  }
  var missingLady=(p.recruits||[]).filter(function(r){return ddRowLooksLady(r)&&!r.ladyGuardUndertaking;});
  if(missingLady.length){alert('Received Ladies Undertaking is compulsory for Female recruits. Missing for: '+missingLady.map(function(r){return r.name;}).join(', '));return;}
  api('saveDrrDetail',{detailBranchId:p.branchId,package:p}).then(function(res){
    if(res.s!==200){alert(res.j.error||'Could not save detailed DRR.');return;}
    DRR_DETAIL_PKG=res.j.package||p;
    upsertDrrDetail(DRR_DETAIL_PKG);
    if(DRR_DETAIL_PKG.nilRecruitment){
      alert('Nil recruitment saved. Dashboard will show Nil for this branch today.');
      loadDrrDetail();
      return;
    }
    if(RECRUIT_ROLE==='branch'){
      var send=confirm('Detailed Recruitment DRR saved.\\n\\nReminder: send the Thank You WhatsApp message to the candidate / OM now?\\n\\nOK = open WhatsApp review · Cancel = later');
      if(send){
        DRR_DETAIL_BRANCH=p.branchId;DRR_DETAIL_DATE=p.reportDate;
        if(typeof drrThankYouWhatsApp==='function'){
          drrThankYouWhatsApp();
          setTimeout(function(){
            if(el('wa_branch'))el('wa_branch').value=p.branchId;
            if(el('wa_date'))el('wa_date').value=p.reportDate;
            if(typeof previewDrrThankYouWa==='function')previewDrrThankYouWa();
          },200);
        }
        return;
      }
    }else{
      alert('Detailed Recruitment DRR saved. Use DRR Thank You WhatsApp to review and send.');
    }
    loadDrrDetail();
  }).catch(function(){alert('Network error — report may not have saved. Try again.');});
}
function drrDetailHistory(){
  if(el('ttl'))el('ttl').textContent='DRR History';
  var b=RECRUIT_ROLE==='branch'?(RECRUIT_BRANCH||''):(DRR_DETAIL_BRANCH||'ALL');
  var pick=RECRUIT_ROLE==='branch'?'':'<div class="card"><label>Branch filter</label><select id="dh_branch" onchange="DRR_DETAIL_BRANCH=this.value;drrDetailHistory()"><option value="ALL"'+(b==='ALL'?' selected':'')+'>All Branches</option>'+(BRANCHES||[]).map(function(x){return '<option value="'+a(x)+'"'+(x===b?' selected':'')+'>'+h(x)+'</option>';}).join('')+'</select></div>';
  el('content').innerHTML=reportWrap('DRR History','Detailed Recruitment reports',portalBadge(),pick+'<p id="dh_msg" class="rpt-note">Loading…</p><div id="dh_tbl"></div>');
  api('listDrrDetails',{detailBranchId:b,allBranches:b==='ALL'}).then(function(res){
    var msg=el('dh_msg'),tbl=el('dh_tbl');if(res.s!==200){msg.textContent=res.j.error||'Could not load history.';return;}
    var list=(res.j.packages||[]).filter(drrDetailIsSubmitted);msg.textContent=list.length+' detailed report(s)';
    var rows=list.map(function(p){return '<tr><td>'+ddDate(p.reportDate)+'</td><td><b>'+h(p.branchId)+'</b></td><td>'+h(ddCompanyLabel(p.company))+'</td><td>'+(drrDetailIsNil(p)?'Nil':'Submitted')+'</td><td>'+(p.recruits||[]).length+'</td><td>'+(p.transfers||[]).length+'</td><td>'+(p.resignations||[]).length+'</td><td>'+h(p.submittedBy||'')+'</td><td><button class="btn grey" style="padding:4px 8px" onclick="DRR_DETAIL_BRANCH='+ddJs(p.branchId)+';DRR_DETAIL_DATE='+ddJs(p.reportDate)+';DRR_DETAIL_COMPANY='+ddJs(p.company)+';drrDetailForm()">Open</button></td></tr>';}).join('');
    tbl.innerHTML='<div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>Date</th><th>Branch</th><th>Company</th><th>Status</th><th>New recruits</th><th>Transfers</th><th>Resignations</th><th>Submitted by</th><th></th></tr></thead><tbody>'+(rows||'<tr><td colspan="9">No detailed DRR reports yet.</td></tr>')+'</tbody></table></div>';
  });
}
`
