import type { VercelRequest, VercelResponse } from '@vercel/node'
import { hodLoginHtml, otpLoginScript } from '../_lib/embedded-otp.js'
import { RECRUIT_REPORT_CSS } from '../_lib/recruitment/brand.js'
import { MASTER_DIRECTORY_MGMT_MENU_ITEM, OPEN_MASTER_DIRECTORY_JS } from '../_lib/master-directory.js'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const SOURCES = ['WhatsApp', 'SecurityJob.co.in', 'Field Agent', 'Referral', 'Sub-Agency', 'Recruitment Camp', 'News / Media', 'Walk-in', 'News Bulletin', 'Other']
const PIPE_STAGES = [
  { id: 'applied', label: 'Applied' },
  { id: 'walk_in', label: 'Walk-in' },
  { id: 'verification', label: 'Verification' },
  { id: 'medical', label: 'Medicals' },
  { id: 'ready', label: 'Ready to Deploy' },
  { id: 'deployed', label: 'Deployed' },
  { id: 'join_back', label: 'Join-Back' },
]

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile Recruitment — Guard Manpower</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}body{font-family:'Segoe UI',Arial,sans-serif;background:#0b1220;color:#e2e8f0;font-size:14px}
#login{max-width:400px;margin:0 auto;padding-top:10vh}
.card{background:#111a30;border:1px solid #22304f;border-radius:14px;padding:20px;margin-bottom:14px}
input,select,textarea{width:100%;padding:9px 11px;border:1px solid #334155;border-radius:8px;background:#0b1220;color:#e2e8f0;font-size:14px}
label{display:block;font-size:12px;color:#94a3b8;margin:8px 0 3px;font-weight:700}
.btn{padding:10px 16px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:13px;background:#7c3aed;color:#fff}
.btn.sky{background:#0ea5e9}.grey{background:#334155;color:#e2e8f0}.green{background:#16a34a;color:#fff}.r{background:#dc2626;color:#fff}.amb{background:#d97706;color:#fff}.gold{background:#c9a84c;color:#14224f}
.msg{padding:10px;border-radius:8px;font-size:14px;margin-top:10px;display:none}
#shell{display:none;height:100vh}
.side{position:fixed;top:0;left:0;bottom:0;width:230px;background:#0e1730;border-right:1px solid #22304f;display:flex;flex-direction:column;overflow-y:auto;z-index:40}
.brand{padding:16px;text-align:center;border-bottom:1px solid #22304f}.brand img{height:46px}.brand b{display:block;color:#fff;font-size:13px;margin-top:6px}.brand small{color:#a78bfa;font-size:11px}
.menu{padding:6px;flex:1}.mi{display:flex;align-items:center;gap:8px;padding:10px 11px;border-radius:9px;color:#cbd5e1;cursor:pointer;font-weight:600;font-size:13px}.mi:hover{background:#16223f}.mi.active{background:#7c3aed;color:#fff}
.logout{padding:12px 16px;border-top:1px solid #22304f;color:#94a3b8;cursor:pointer;font-size:12px}
.main{margin-left:230px;min-height:100vh}
.bar{background:#111a30;border-bottom:1px solid #22304f;padding:12px 18px;display:flex;justify-content:space-between;align-items:center}
.bar b{color:#fff;font-size:16px}.content{padding:16px}
.burger{display:none;background:#7c3aed;color:#fff;border:none;border-radius:8px;padding:8px 12px;font-weight:800}
@media(max-width:900px){.side{transform:translateX(-100%);transition:.2s}.side.open{transform:none}.main{margin-left:0}.burger{display:inline-block}}
.kgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px}
.kpi{border-radius:12px;padding:14px;border:1px solid #22304f}.kpi b{font-size:24px;color:#fff;display:block}.kpi span{font-size:11px;color:#94a3b8}
.kpi.purple{background:linear-gradient(135deg,#4c1d95,#7c3aed)}.kpi.sky{background:linear-gradient(135deg,#0369a1,#0ea5e9)}.kpi.red{background:linear-gradient(135deg,#7f1d1d,#dc2626)}
.kpi.green{background:linear-gradient(135deg,#14532d,#16a34a)}.kpi.amber{background:linear-gradient(135deg,#92400e,#d97706)}
.tblwrap{overflow-x:auto;border:1px solid #22304f;border-radius:8px}table{border-collapse:collapse;width:100%;font-size:12px}
th,td{border:1px solid #22304f;padding:6px;text-align:left}th{background:#0b1220;color:#94a3b8;font-size:10px;text-transform:uppercase}
.savebar{position:sticky;bottom:0;background:#111a30;border-top:1px solid #22304f;padding:12px;text-align:center}
.inactive{opacity:.45}
.vedit{background:#111a30;border:1px solid #7c3aed;border-radius:12px;padding:16px;margin-top:12px}
.vedit h4{color:#a78bfa;margin-bottom:10px}
.switch{position:relative;display:inline-block;width:46px;height:26px;vertical-align:middle}
.switch input{opacity:0;width:0;height:0;position:absolute}
.slider{position:absolute;cursor:pointer;inset:0;background:#334155;transition:.2s;border-radius:26px;border:1px solid #475569}
.slider:before{position:absolute;content:"";height:20px;width:20px;left:2px;bottom:2px;background:#94a3b8;transition:.2s;border-radius:50%}
.switch input:checked+.slider{background:#16a34a;border-color:#15803d}
.switch input:checked+.slider:before{transform:translateX(20px);background:#fff}
.switch-lbl{font-size:11px;color:#94a3b8;margin-left:6px;vertical-align:middle}
.badge-role{display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700}
.badge-admin{background:#312e81;color:#c4b5fd}.badge-branch{background:#0369a1;color:#7dd3fc}
.fgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px}
.hidden{display:none!important}
${RECRUIT_REPORT_CSS}
</style></head>
<body>
${hodLoginHtml('Agile Recruitment', 'HOD / Staff — branch sign in')}

<div id="shell">
  <div class="side" id="side">
    <div class="brand"><img src="https://www.agilegroup-digital.co.in/agile-logo.png"><b>Agile Recruitment</b><small id="portalTag">Building Teams That Win</small></div>
    <div class="menu" id="menu"></div>
    <div class="logout" onclick="logout()">⎋ Logout</div>
  </div>
  <div class="main">
    <div class="bar"><div style="display:flex;align-items:center;gap:10px"><button class="burger" onclick="document.getElementById('side').classList.toggle('open')">☰</button><b id="ttl">Dashboard</b></div><span id="userLine" style="color:#94a3b8;font-size:12px"></span></div>
    <div class="content" id="content"></div>
  </div>
</div>

<script>
${otpLoginScript('recruitment', 'Agile Recruitment', 'staff')}
var PORTAL='staff';
if(new URLSearchParams(location.search).get('portal')==='management'){OTP_ROLE='management';PORTAL='management';}
var DRR=[],GUARDS=[],REQS=[],JOINS=[],VENDORS=[],USERS=[],CFG={shortageCount:13,previousShortage:15,dailyTargetPerBranch:5,monthlyTarget:100,contractedStrength:0,actualDeployed:0,wageHoldSites:[]};
var RECRUIT_ROLE='admin',RECRUIT_BRANCH='',RECRUIT_DASH='ALL',PIPE_STAGE='applied',CUR=0,GUARD_EDIT=-1,USR=-1;
var BRANCHES=['Visakhapatnam','Nellore','Bangalore','Gulbarga','Hyderabad','Kakinada','Vijayawada','Chennai','Mumbai','Corporate Office'];
var STAFF_MENU=[{n:'Dashboard',fn:'staffDash',icon:'📊'},{n:'Daily Recruitment Report',fn:'drrForm',icon:'📋'},{n:'DRR History',fn:'drrLogs',icon:'📁'},{n:'Post Requirement',fn:'reqForm',icon:'📌'},{n:'Sourcing Channels',fn:'sourcing',icon:'📣'},{n:'Guard Pipeline',fn:'pipeline',icon:'👥'},{n:'Roster & Join-Backs',fn:'joinbacks',icon:'🔄'},{n:'Publicity & Camps',fn:'publicity',icon:'📢'}];
var BRANCH_STAFF_MENU=[{n:'Dashboard',fn:'staffDash',icon:'📊'},{n:'Daily Recruitment Report',fn:'drrForm',icon:'📋'},{n:'DRR History',fn:'drrLogs',icon:'📁'},{n:'Absconder List (7+ days)',fn:'absconders',icon:'🚨'}];
var MGMT_MENU=[{n:'Executive Dashboard',fn:'mgmtDash',icon:'📊'},{n:'Daily Summary',fn:'drrSummary',icon:'📅'},{n:'Absconder List (7+ days)',fn:'absconders',icon:'🚨'},{n:'DRR Thank You Email',fn:'drrEmailPreview',icon:'✉'},{n:'Manpower Gap',fn:'gapAnalysis',icon:'📉'},{n:'Sourcing Funnel',fn:'funnelView',icon:'🔽'},{n:'Operations & Retention',fn:'retention',icon:'🛡'},{n:'Notes & Bottlenecks',fn:'bottlenecks',icon:'⚠'},{n:'Risk & Wage Controls',fn:'wageRisk',icon:'💰'},{n:'Approvals',fn:'approvals',icon:'✅'},{n:'Vendor Management',fn:'vendors',icon:'🤝'},{n:'Configuration',fn:'settings',icon:'⚙'},${JSON.stringify(MASTER_DIRECTORY_MGMT_MENU_ITEM)},{n:'User Management',fn:'users',icon:'👤'}];
var PUBLIC_FORM='https://agile-recruitment.codewords.run/',SECURITYJOB='https://www.securityjob.co.in',HELPLINE='18005995599';
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function a(s){return h(s).replace(/"/g,'&quot;');}
function nid(p){return p+Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
function today(){return new Date().toISOString().slice(0,10);}
function api(action,extra){return fetch('/api/recruitment/data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,sessionToken:OTP_SESSION,branchId:RECRUIT_BRANCH||''},extra||{}))}).then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});});}
${OPEN_MASTER_DIRECTORY_JS}
function reportHdr(t,sub,b){return '<div class="rpt-sheet"><div class="rpt-hdr"><div class="rpt-gold-bar"></div><img src="https://www.agilegroup-digital.co.in/agile-logo.png"><div class="rpt-co">AGILE SECURITY FORCE PRIVATE LIMITED</div><h2 class="rpt-title">'+h(t)+'</h2>'+(sub?'<p class="rpt-sub">'+sub+'</p>':'')+(b?'<div class="rpt-badge">'+b+'</div>':'')+'</div>';}
function reportFtr(){return '<div class="rpt-ftr"><div class="rpt-gold-bar"></div><p><b>Agile Recruitment</b> — Guard Recruitment &amp; Manpower</p><p><a href="https://www.agilegroup.co.in" style="color:#7dd3fc;text-decoration:none">www.agilegroup.co.in</a> Created by Cursor.AI</p><p class="rpt-copy">© Agile Security Force Private Limited · Confidential</p></div>';}
function reportSec(l){return '<div class="rpt-sec"><span>'+h(l)+'</span></div>';}
function reportWrap(t,sub,b,body){return reportHdr(t,sub,b)+'<div class="rpt-body">'+body+'</div>'+reportFtr()+'</div>';}
function portalBadge(){return PORTAL==='staff'?(RECRUIT_BRANCH?h(RECRUIT_BRANCH)+' · Branch':'Branch Portal'):'Management Portal';}
function activeMenu(){if(PORTAL==='staff'&&RECRUIT_ROLE==='branch')return BRANCH_STAFF_MENU;return PORTAL==='staff'?STAFF_MENU:MGMT_MENU;}
function buildMenu(){var m=activeMenu();el('menu').innerHTML=m.map(function(x,i){return '<div class="mi'+(CUR===i?' active':'')+'" onclick="tab('+i+')">'+x.icon+' '+h(x.n)+'</div>';}).join('');if(el('portalTag'))el('portalTag').textContent=PORTAL==='staff'?'Branch Portal':'Management';}
function tab(i){CUR=i;var m=activeMenu();buildMenu();el('ttl').textContent=m[i].n;el('side').classList.remove('open');window[m[i].fn]();}
function branchList(){return PORTAL==='staff'&&RECRUIT_BRANCH?[RECRUIT_BRANCH]:BRANCHES;}
function filterBranch(list,fb){return list.filter(function(x){return x.active!==false&&(!fb||fb==='ALL'||x.branchId===fb);});}
function shortageBanner(){var s=CFG.shortageCount||0,prev=CFG.previousShortage||s,delta=s-prev;var cls=s>=15?'critical':s>=8?'warn':'ok';var trend=delta<0?'↓ Improved by '+Math.abs(delta):delta>0?'↑ Increased by '+delta:'— Stable';return '<div class="shortage-banner '+cls+'"><span>🚨 MANPOWER SHORTAGE</span><b>'+s+' guards</b><span style="font-size:12px;opacity:.9">'+trend+' · Target: fill via DRR + camps + SecurityJob + WhatsApp</span></div>';}
function kpi(v,l,c){return '<div class="kpi '+c+'"><b>'+v+'</b><span>'+l+'</span></div>';}
function drrToday(b){return DRR.find(function(r){return r.active&&r.reportDate===today()&&r.branchId===(b||RECRUIT_BRANCH);});}
function sumDrr(fb){var list=filterBranch(DRR,fb||RECRUIT_DASH);return list.reduce(function(a,r){return {walkIns:a.walkIns+(r.walkIns||0),screened:a.screened+(r.screened||0),selected:a.selected+(r.selected||0),deployed:a.deployed+(r.deployed||0),wa:a.wa+(r.whatsappLeads||0),sj:a.sj+(r.securityjobLeads||0)};},{walkIns:0,screened:0,selected:0,deployed:0,wa:0,sj:0});}
function stageCount(st,fb){return filterBranch(GUARDS,fb).filter(function(g){return g.stage===st;}).length;}
function applyLogin(res){RECRUIT_ROLE=res.j.role||'admin';RECRUIT_BRANCH=res.j.branch||res.j.lockedBranch||'';if(res.j.recruitBranches&&res.j.recruitBranches.length) BRANCHES=res.j.recruitBranches.slice();el('userLine').textContent=(res.j.name||'')+' · '+(RECRUIT_BRANCH||'Management');if(RECRUIT_ROLE==='branch'&&PORTAL==='management'){el('login').style.display='none';el('shell').style.display='block';el('content').innerHTML='<div class="card"><h2 style="color:#fff">Management portal only</h2><p style="color:#94a3b8;margin:12px 0">Use Staff button on Command Centre for branch access.</p><a class="btn" href="/recruitment?portal=staff">Open Branch Portal</a></div>';return;}if(RECRUIT_ROLE==='admin'&&PORTAL==='staff'){PORTAL='management';OTP_ROLE='management';}DRR=res.j.drr||[];GUARDS=res.j.guards||[];REQS=res.j.requisitions||[];JOINS=res.j.joinbacks||[];VENDORS=res.j.vendors||[];USERS=res.j.users||[];CFG=res.j.config||CFG;if(RECRUIT_ROLE==='branch'&&RECRUIT_BRANCH)RECRUIT_DASH=RECRUIT_BRANCH;el('login').style.display='none';el('shell').style.display='block';buildMenu();tab(0);}
function onOtpLogin(j){api('login').then(function(res){if(res.s!==200){otpMsg(res.j.error||'Sign in failed',false);return;}applyLogin(res);});}
function logout(){otpLogout();}

function staffDash(){var fb=RECRUIT_DASH,tod=drrToday(RECRUIT_BRANCH),s=sumDrr(RECRUIT_BRANCH),tgt=CFG.dailyTargetPerBranch||5,isBranch=RECRUIT_ROLE==='branch';var picker=RECRUIT_ROLE==='admin'?'<div class="card"><label>View Branch</label><select onchange="RECRUIT_DASH=this.value;staffDash()">'+['ALL'].concat(BRANCHES).map(function(b){return '<option'+(b===fb?' selected':'')+'>'+b+'</option>';}).join('')+'</select></div>':'';var note=isBranch?'<div class="card"><p class="rpt-note"><b>Your job:</b> Recruit <b>walk-in guards</b> and submit <b>Daily Recruitment Report</b> every working day. After you submit, you receive a <b>thank you email</b> with your branch dashboard — shortage, absconders, and vacant posts. HQ handles WhatsApp, SecurityJob, camps, and media.</p></div>':'<div class="card"><p class="rpt-note">Submit <b>Daily Recruitment Report</b> every working day. Use <b>Publicity &amp; Camps</b> for WhatsApp, SecurityJob.co.in, and camp drives.</p></div>';var body=shortageBanner()+picker+'<div class="kgrid">'+kpi(tod?'✓':'⚠',tod?'DRR Submitted Today':'DRR Pending','green')+kpi((tod?tod.walkIns:0)+' walk-ins',tod?'Today Walk-ins':'No report yet','purple')+kpi((tod?tod.deployed:0)+'/'+tgt,'Deployed / Daily Target','sky')+kpi(CFG.shortageCount||0,'Company Shortage','red')+'</div>'+reportSec('Today — '+today())+note;el('content').innerHTML=reportWrap('Branch Recruitment Dashboard',h(RECRUIT_BRANCH||fb)+' · '+today(),portalBadge(),body);}

function mgmtDash(){var s=sumDrr('ALL'),pend=REQS.filter(function(r){return r.status==='pending';}).length;var body=shortageBanner()+'<div class="kgrid">'+kpi(CFG.shortageCount||0,'Total Shortage','red')+kpi(s.deployed,'Deployed (all DRR today)','green')+kpi(stageCount('ready','ALL'),'Ready to Deploy','purple')+kpi(pend,'Pending Approvals','amber')+kpi(VENDORS.filter(function(v){return v.active;}).length,'Active Vendors','sky')+kpi(s.wa+s.sj,'WhatsApp + SecurityJob Leads','green')+'</div>'+reportSec('Branch Submission Today')+'<div class="subgrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px">'+BRANCHES.map(function(b){var ok=drrToday(b);return '<div class="card" style="padding:10px;border-color:'+(ok?'#166534':'#92400e')+'"><b style="color:'+(ok?'#4ade80':'#fb923c')+'">'+(ok?'✓':'⚠')+' '+h(b)+'</b><small style="color:#94a3b8">'+(ok?'DRR received':'Pending DRR')+'</small></div>';}).join('')+'</div>';el('content').innerHTML=reportWrap('Executive Dashboard','All India · '+today(),portalBadge(),body);}

function drrForm(){var ex=drrToday(RECRUIT_BRANCH)||{branchId:RECRUIT_BRANCH,reportDate:today(),submittedBy:'',walkIns:0,screened:0,docsComplete:0,selected:0,deployed:0,notes:'',bottlenecks:''};var isBranch=RECRUIT_ROLE==='branch';var f=function(l,k,t){return '<div><label>'+l+'</label><input type="'+(t||'number')+'" id="d_'+k+'" value="'+a(ex[k])+'"></div>';};var walkSec=reportSec('Section B — Walk-in Recruitment (Today)')+'<div class="card fgrid">'+f('Walk-ins','walkIns')+f('Screened','screened')+f('Documentation Complete','docsComplete')+f('Selected','selected')+f('Deployed Today','deployed')+'</div>';var hqSec=isBranch?'':reportSec('Section C — HQ Sourcing (Management only)')+'<div class="card fgrid">'+f('Camps Held','campsHeld')+f('WhatsApp Leads','whatsappLeads')+f('SecurityJob.co.in','securityjobLeads')+f('Referrals','referralLeads')+f('Field Agents','fieldAgentLeads')+f('News / Media','mediaLeads')+f('Sub-Agencies','subAgencyLeads')+f('News Bulletin','newsBulletinLeads')+'</div>';var body=shortageBanner()+reportSec('Section A — Branch & Date')+'<div class="card fgrid"><div><label>Branch</label><input id="d_branchId" readonly value="'+a(RECRUIT_BRANCH)+'"></div>'+f('Report Date','reportDate','date')+f('Submitted By','submittedBy','text')+'</div>'+walkSec+hqSec+reportSec('Section '+(isBranch?'C':'D')+' — Notes')+'<div class="card"><label>Notes</label><textarea id="d_notes" rows="2">'+h(ex.notes)+'</textarea><label>Bottlenecks</label><textarea id="d_bottlenecks" rows="2">'+h(ex.bottlenecks)+'</textarea></div>'+(isBranch?'<p class="rpt-note">Branches report <b>walk-ins only</b>. A thank you email with shortage, absconders, and vacant posts is sent automatically when you submit.</p>':'')+'<div class="savebar"><button class="btn green" onclick="saveDrr()">✓ Submit Daily Recruitment Report</button></div>';el('content').innerHTML=reportWrap('Daily Recruitment Report (DRR)',h(RECRUIT_BRANCH)+' · '+today(),portalBadge(),body);if(el('d_branchId'))el('d_branchId').value=RECRUIT_BRANCH;if(el('d_reportDate'))el('d_reportDate').value=today();}
function saveDrr(){var isBranch=RECRUIT_ROLE==='branch';var rep={id:(drrToday(RECRUIT_BRANCH)||{}).id||nid('dr'),branchId:RECRUIT_BRANCH,reportDate:el('d_reportDate').value,submittedBy:el('d_submittedBy')?el('d_submittedBy').value:'',submittedAt:new Date().toISOString(),walkIns:+el('d_walkIns').value,screened:+el('d_screened').value,docsComplete:+el('d_docsComplete').value,selected:+el('d_selected').value,deployed:+el('d_deployed').value,campsHeld:isBranch?0:+(el('d_campsHeld')?el('d_campsHeld').value:0),whatsappLeads:isBranch?0:+(el('d_whatsappLeads')?el('d_whatsappLeads').value:0),securityjobLeads:isBranch?0:+(el('d_securityjobLeads')?el('d_securityjobLeads').value:0),referralLeads:isBranch?0:+(el('d_referralLeads')?el('d_referralLeads').value:0),fieldAgentLeads:isBranch?0:+(el('d_fieldAgentLeads')?el('d_fieldAgentLeads').value:0),mediaLeads:isBranch?0:+(el('d_mediaLeads')?el('d_mediaLeads').value:0),subAgencyLeads:isBranch?0:+(el('d_subAgencyLeads')?el('d_subAgencyLeads').value:0),newsBulletinLeads:isBranch?0:+(el('d_newsBulletinLeads')?el('d_newsBulletinLeads').value:0),notes:el('d_notes').value,bottlenecks:el('d_bottlenecks').value,active:true};api('load').then(function(res){var prev=(res.j.drr||[]).filter(function(r){return !(r.branchId===RECRUIT_BRANCH&&r.reportDate===rep.reportDate);});return api('saveDrr',{drr:prev.concat([rep])});}).then(function(res){if(res.s===200){var msg=res.j.thankYouEmail?'DRR saved. Thank you email sent to your branch with shortage + vacant posts dashboard.':'DRR saved.';alert(msg);DRR=DRR.filter(function(r){return !(r.branchId===RECRUIT_BRANCH&&r.reportDate===rep.reportDate);});DRR.push(rep);drrForm();}else alert(res.j.error||'Error');});}

function drrLogs(){var list=filterBranch(DRR,RECRUIT_BRANCH).slice().sort(function(a,b){return (b.reportDate||'').localeCompare(a.reportDate||'');});var rows=list.map(function(r){return '<tr><td><b style="color:#a78bfa">'+h(r.reportCode||r.id)+'</b></td><td>'+h(r.reportDate)+'</td><td>'+h(r.branchId)+'</td><td>'+h(r.submittedBy)+'</td><td>'+r.walkIns+'</td><td>'+r.selected+'</td><td>'+r.deployed+'</td><td>'+h((r.bottlenecks||'').slice(0,40))+'</td></tr>';}).join('');el('content').innerHTML=reportWrap('DRR History','Submitted daily reports',portalBadge(),'<div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>Code</th><th>Date</th><th>Branch</th><th>By</th><th>Walk-ins</th><th>Selected</th><th>Deployed</th><th>Bottleneck</th></tr></thead><tbody>'+(rows||'<tr><td colspan="8">No reports yet.</td></tr>')+'</tbody></table></div>');}

function reqForm(){el('content').innerHTML=reportWrap('Post Manpower Requirement',h(RECRUIT_BRANCH),portalBadge(),'<div class="card fgrid"><div><label>Site / Zone</label><input id="rq_site"></div><div><label>Guards Needed</label><input type="number" id="rq_need" value="1"></div><div><label>Urgency</label><select id="rq_urg"><option>normal</option><option>urgent</option><option>critical</option></select></div></div><div class="card"><label>Notes</label><textarea id="rq_notes" rows="3"></textarea></div><div class="savebar"><button class="btn green" onclick="saveReq()">Submit Requisition</button></div>');}
function saveReq(){var r={id:nid('rq'),branchId:RECRUIT_BRANCH,siteZone:el('rq_site').value,guardsNeeded:+el('rq_need').value,urgency:el('rq_urg').value,status:'pending',requestedBy:RECRUIT_BRANCH,notes:el('rq_notes').value,active:true,createdAt:new Date().toISOString()};api('saveRequisitions',{requisitions:REQS.concat([r])}).then(function(res){if(res.s===200){REQS.push(r);alert('Requisition submitted for management approval.');reqForm();}else alert(res.j.error);});}

function sourcing(){var s=sumDrr(RECRUIT_BRANCH);var rows=[['WhatsApp',s.wa],['SecurityJob.co.in',s.sj],['Referral',DRR.reduce(function(a,r){return a+(r.referralLeads||0);},0)],['Field Agent',DRR.reduce(function(a,r){return a+(r.fieldAgentLeads||0);},0)],['News Bulletin',DRR.reduce(function(a,r){return a+(r.newsBulletinLeads||0);},0)]].map(function(x){return '<tr><td><b>'+x[0]+'</b></td><td>'+x[1]+' leads</td><td>Track in DRR daily</td></tr>';}).join('');el('content').innerHTML=reportWrap('Sourcing Channels','WhatsApp · SecurityJob · Camps · Media',portalBadge(),'<p class="rpt-note">Log every lead source in your <b>Daily Recruitment Report</b>. Management sees consolidated sourcing performance.</p><div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>Channel</th><th>Leads (period)</th><th>Action</th></tr></thead><tbody>'+rows+'</tbody></table></div>');}

function pipeline(){var tabs=PIPE_STAGES.map(function(s){return '<div class="pipe-tab'+(PIPE_STAGE===s.id?' active':'')+'" onclick="PIPE_STAGE=\\''+s.id+'\\';pipeline()">'+s.label+' ('+stageCount(s.id,RECRUIT_BRANCH)+')</div>';}).join('');var list=filterBranch(GUARDS,RECRUIT_BRANCH).filter(function(g){return g.stage===PIPE_STAGE;});var rows=list.map(function(g){var gi=GUARDS.indexOf(g);return '<tr><td><b>'+h(g.name)+'</b></td><td>'+h(g.mobile)+'</td><td>'+h(g.source)+'</td><td>'+h(g.siteZone)+'</td><td><select onchange="GUARDS['+gi+'].stage=this.value;saveGuards()">'+PIPE_STAGES.map(function(s){return '<option value="'+s.id+'"'+(g.stage===s.id?' selected':'')+'>'+s.label+'</option>';}).join('')+'</select></td><td>'+h(g.policeVerification)+'</td><td>'+h(g.medicalStatus)+'</td></tr>';}).join('');var add='<div class="card fgrid" style="margin-top:10px"><input id="gn" placeholder="Name"><input id="gm" placeholder="Mobile"><select id="gs">'+SOURCES.map(function(s){return '<option>'+s+'</option>';}).join('')+'</select><input id="gz" placeholder="Site/Zone"><button class="btn" onclick="addGuard()">+ Add</button></div>';el('content').innerHTML=reportWrap('Guard Pipeline (CRM)','Track applicants through deployment',portalBadge(),'<div class="pipe-tabs">'+tabs+'</div><div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>Name</th><th>Mobile</th><th>Source</th><th>Site</th><th>Stage</th><th>Police</th><th>Medical</th></tr></thead><tbody>'+(rows||'<tr><td colspan="7">No guards in this stage.</td></tr>')+'</tbody></table></div>'+add);}

function addGuard(){var g={id:nid('gd'),branchId:RECRUIT_BRANCH,name:el('gn').value,mobile:el('gm').value,source:el('gs').value,siteZone:el('gz').value,stage:PIPE_STAGE,policeVerification:'Pending',medicalStatus:'Pending',fitnessStatus:'Pending',active:true,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};if(!g.name)return;GUARDS.push(g);saveGuards();}
function saveGuards(){api('saveGuards',{guards:GUARDS}).then(function(res){if(res.s===200)pipeline();else alert(res.j.error);});}

function joinbacks(){var list=filterBranch(JOINS,RECRUIT_BRANCH);var rows=list.map(function(j,i){return '<tr><td>'+h(j.guardName)+'</td><td>'+h(j.mobile)+'</td><td>'+h(j.siteZone)+'</td><td>'+h(j.leftDate)+'</td><td>'+h(j.rejoinDate)+'</td><td>'+h(j.status)+'</td><td>'+h(j.reason)+'</td></tr>';}).join('');var add='<div class="card fgrid"><input id="jn" placeholder="Guard name"><input id="jm" placeholder="Mobile"><input id="jz" placeholder="Site"><input type="date" id="jl" placeholder="Left"><select id="js"><option>absent</option><option>rejoined</option><option>left_permanent</option></select><button class="btn" onclick="addJoin()">+ Log</button></div>';el('content').innerHTML=reportWrap('Roster & Join-Backs','Absentees and rejoins — keeps shortage accurate',portalBadge(),'<div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>Name</th><th>Mobile</th><th>Site</th><th>Left</th><th>Rejoined</th><th>Status</th><th>Reason</th></tr></thead><tbody>'+(rows||'<tr><td colspan="7">No records.</td></tr>')+'</tbody></table></div>'+add);}
function addJoin(){var j={id:nid('jb'),branchId:RECRUIT_BRANCH,guardName:el('jn').value,mobile:el('jm').value,siteZone:el('jz').value,leftDate:el('jl').value,status:el('js').value,active:true,createdAt:new Date().toISOString()};if(!j.guardName)return;JOINS.push(j);api('saveJoinbacks',{joinbacks:JOINS}).then(function(){joinbacks();});}

function publicity(){var wa='Agile Security Force — Register Your Interest%0A'+PUBLIC_FORM+'%0AHelpline: '+HELPLINE;var body='<div class="card"><b style="color:#fff">Public Apply Link</b><p style="margin:8px 0"><a class="btn sky" href="'+PUBLIC_FORM+'" target="_blank">'+PUBLIC_FORM+'</a></p></div><div class="card"><b style="color:#fff">SecurityJob.co.in</b><p style="margin:8px 0"><a class="btn" href="'+SECURITYJOB+'" target="_blank">'+SECURITYJOB+'</a></p></div><div class="card"><b style="color:#fff">WhatsApp Share</b><p style="margin:8px 0"><a class="btn green" href="https://wa.me/?text='+wa+'" target="_blank">Share on WhatsApp</a></p></div><div class="card"><b style="color:#fff">Recruitment Camps</b><p class="rpt-note">Plan camps in potential areas. Log <b>Camps Held</b> and walk-in numbers in your DRR. Coordinate with News Bulletin / Pulse for publicity.</p></div>';el('content').innerHTML=reportWrap('Publicity & Camps','Media · WhatsApp · SecurityJob · Field camps',portalBadge(),body);}

function drrSummary(){var rows=BRANCHES.map(function(b){var r=drrToday(b),s=DRR.filter(function(x){return x.branchId===b&&x.reportDate===today();})[0];return '<tr><td>'+h(b)+'</td><td>'+(r?'✓':'⚠')+'</td><td>'+(s?s.walkIns:'—')+'</td><td>'+(s?s.selected:'—')+'</td><td>'+(s?s.deployed:'—')+'</td><td>'+(s?s.whatsappLeads:'—')+'</td><td>'+(s?s.securityjobLeads:'—')+'</td><td style="font-size:11px">'+h(s?(s.bottlenecks||'').slice(0,50):'')+'</td></tr>';}).join('');el('content').innerHTML=reportWrap('Daily Recruitment Summary','All branches · '+today(),portalBadge(),shortageBanner()+'<div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>Branch</th><th>DRR</th><th>Walk-ins</th><th>Selected</th><th>Deployed</th><th>WhatsApp</th><th>SecurityJob</th><th>Bottleneck</th></tr></thead><tbody>'+rows+'</tbody></table></div>');}

function absconders(){var asOf=today();var body='<div class="card"><p class="rpt-note">Guards <b>absent 7+ consecutive days</b> — from Agile Mobile attendance, or from <b>Roster &amp; Join-Backs</b> if mobile sync is not ready.</p><div class="fgrid" style="margin-top:10px"><div><label>As of date</label><input type="date" id="ab_date" value="'+asOf+'"></div><button type="button" class="btn sky" id="ab_sync_btn" onclick="loadAbsconders(true)">Sync &amp; Refresh</button><button type="button" class="btn grey" onclick="loadAbsconders(false)">Show saved</button></div><p id="ab_msg" class="rpt-note" style="margin-top:8px">Tap <b>Sync &amp; Refresh</b> or <b>Show saved</b>.</p></div><div id="ab_tbl"></div>';el('content').innerHTML=reportWrap('Absconder List (7+ days)','From Agile Mobile attendance',portalBadge(),body);}
function loadAbsconders(sync){
  var asOfEl=el('ab_date'),msgEl=el('ab_msg'),tblEl=el('ab_tbl'),btnEl=el('ab_sync_btn');
  if(!asOfEl||!msgEl){alert('Page not ready — open Absconder List from the left menu again.');return;}
  var asOf=asOfEl.value;
  msgEl.textContent=sync?'Syncing attendance only (about 20 seconds)…':'Loading saved list…';
  if(btnEl&&sync){btnEl.disabled=true;btnEl.textContent='Syncing…';}
  api('absconders',{asOf:asOf,minDays:7,syncFirst:!!sync}).then(function(res){
    if(btnEl){btnEl.disabled=false;btnEl.textContent='Sync & Refresh';}
    if(res.s!==200){msgEl.textContent=res.j.error||'Request failed — sign in again from Command Centre.';return;}
    var gs=res.j.guards||[];
    var note=gs.length?(gs.length+' absconder(s) as of '+asOf+'.'):(res.j.hint||'No 7+ day absconders found.');
    if(res.j.sync&&res.j.sync.saved)note+=' Mobile rows synced: '+res.j.sync.saved+'.';
    else if(res.j.sync&&res.j.sync.error){
      note+=' Sync note: '+res.j.sync.error;
      if(res.j.sync.attempts&&res.j.sync.attempts.length)note+=' ['+res.j.sync.attempts.slice(0,2).join('; ')+']';
    }
    else if(!res.j.work360Configured)note+=' Work360 not on server yet — showing join-back log only.';
    msgEl.textContent=note;
    var rows=gs.map(function(g){
      var src=g.source==='joinback'?' <small>(join-back)</small>':'';
      return '<tr><td><b>'+h(g.guardName)+'</b>'+src+'</td><td>'+h(g.employeeId)+'</td><td>'+h(g.mobile)+'</td><td>'+h(g.client)+'</td><td>'+h(g.unit)+'</td><td>'+g.consecutiveDays+'</td><td>'+h(g.absentSince)+'</td></tr>';
    }).join('');
    if(tblEl)tblEl.innerHTML='<div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>Guard</th><th>Emp ID</th><th>Mobile</th><th>Client</th><th>Unit / Site</th><th>Days</th><th>Absent since</th></tr></thead><tbody>'+(rows||'<tr><td colspan="7">No records yet.</td></tr>')+'</tbody></table></div>';
  }).catch(function(err){
    if(btnEl){btnEl.disabled=false;btnEl.textContent='Sync & Refresh';}
    msgEl.textContent='Could not reach server. Check internet and try again. ('+(err&&err.message?err.message:'error')+')';
  });
}

function drrEmailPreview(){var b=RECRUIT_BRANCH||'Hyderabad';var dt=today();var pick='<div class="card fgrid"><div><label>Branch</label><select id="em_branch" onchange="drrEmailPreview()">'+BRANCHES.map(function(x){return '<option'+(x===b?' selected':'')+'>'+x+'</option>';}).join('')+'</select></div><div><label>Report Date</label><input type="date" id="em_date" value="'+dt+'" onchange="drrEmailPreview()"></div><button class="btn sky" onclick="loadDrrEmail()">Preview Thank You Email</button></div><div id="em_out"><p class="rpt-note">Select branch and date, then preview the thank you email sent after DRR submission.</p></div>';el('content').innerHTML=reportWrap('DRR Thank You Email','Branch dashboard email preview',portalBadge(),pick);}
function loadDrrEmail(){var b=el('em_branch').value;var dt=el('em_date').value;api('previewDrrEmail',{branchId:b,reportDate:dt}).then(function(res){if(res.s!==200){el('em_out').innerHTML='<p class="rpt-note" style="color:#fb923c">'+(res.j.error||'Not found')+'</p>';return;}el('em_out').innerHTML='<p class="rpt-note"><b>'+h(res.j.subject)+'</b></p><div style="background:#fff;color:#1e293b;border:1px solid #334155;border-radius:8px;padding:8px;overflow:auto">'+res.j.html+'</div>';});}

function gapAnalysis(){var gap=CFG.shortageCount||0,con=CFG.contractedStrength||0,dep=CFG.actualDeployed||0;el('content').innerHTML=reportWrap('Manpower Gap Analysis','Contracted vs deployed vs shortage',portalBadge(),shortageBanner()+'<div class="kgrid">'+kpi(con||'—','Contracted Strength','sky')+kpi(dep||'—','Actually Deployed','green')+kpi(gap,'Current Shortage','red')+kpi(Math.max(0,con-dep),'Gap (calc)','amber')+'</div><p class="rpt-note">Update contracted strength and deployed count in <b>Configuration</b>. Shortage alert banner updates when you change shortage count.</p>');}

function funnelView(){var steps=PIPE_STAGES.map(function(s){return '<div class="funnel-step"><b>'+stageCount(s.id,'ALL')+'</b><span>'+s.label+'</span></div>';}).join('');var ch={};DRR.forEach(function(r){ch.wa=(ch.wa||0)+(r.whatsappLeads||0);ch.sj=(ch.sj||0)+(r.securityjobLeads||0);ch.ref=(ch.ref||0)+(r.referralLeads||0);ch.fa=(ch.fa||0)+(r.fieldAgentLeads||0);ch.nb=(ch.nb||0)+(r.newsBulletinLeads||0);ch.wi=(ch.wi||0)+(r.walkIns||0);});var dep=GUARDS.filter(function(g){return g.stage==='deployed';}).length;var chRows=[['Walk-in (Branches)',ch.wi],['WhatsApp',ch.wa],['SecurityJob.co.in',ch.sj],['Referral',ch.ref],['Field Agent',ch.fa],['News Bulletin',ch.nb]].map(function(x){var roi=dep&&x[1]?Math.round(dep/x[1]*100)+'%':'—';return '<tr><td><b>'+x[0]+'</b></td><td>'+x[1]+'</td><td>'+roi+'</td></tr>';}).join('');el('content').innerHTML=reportWrap('Sourcing Funnel','Pipeline stages + channel leads — all branches',portalBadge(),shortageBanner()+reportSec('Guard Pipeline Stages')+'<div class="funnel">'+steps+'</div>'+reportSec('Sourcing Channels (HQ + Branches)')+'<div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>Channel</th><th>Total Leads</th><th>Deploy ROI</th></tr></thead><tbody>'+chRows+'</tbody></table></div>');}

function retention(){var abs=JOINS.filter(function(j){return j.status==='absent';}).length,rej=JOINS.filter(function(j){return j.status==='rejoined';}).length;el('content').innerHTML=reportWrap('Operations & Retention','Join-backs and attrition',portalBadge(),'<div class="kgrid">'+kpi(abs,'Currently Absent','red')+kpi(rej,'Rejoined','green')+kpi(JOINS.length,'Total Join-Back Records','purple')+'</div><p class="rpt-note">Track why guards leave in Join-Back log. High attrition sites flagged in Risk &amp; Wage Controls.</p>');}

function bottlenecks(){var items=DRR.filter(function(r){return r.bottlenecks;}).map(function(r){return '<div class="alert amber"><b>'+h(r.branchId)+' · '+h(r.reportDate)+'</b><br>'+h(r.bottlenecks)+'</div>';}).join('');el('content').innerHTML=reportWrap('Notes & Bottlenecks','From all DRR submissions',portalBadge(),items||'<p class="rpt-note">No bottlenecks logged yet.</p>');}

function wageRisk(){var sites=CFG.wageHoldSites||[];var rows=sites.map(function(w,i){return '<tr><td>'+h(w.branchId)+'</td><td>'+h(w.siteZone)+'</td><td>'+h(w.riskLevel)+'</td><td>'+h(w.attritionPct)+'</td><td>'+h(w.notes)+'</td></tr>';}).join('');el('content').innerHTML=reportWrap('Risk & Wage Controls','Hold/Release wage monitor',portalBadge(),'<p class="rpt-note">Flag sites with high attrition where wage release needs careful approval.</p><div class="tblwrap"><table><thead><tr><th>Branch</th><th>Site</th><th>Risk</th><th>Attrition %</th><th>Notes</th></tr></thead><tbody>'+(rows||'<tr><td colspan="5">No sites flagged — add in Configuration.</td></tr>')+'</tbody></table></div>');}

function approvals(){var pend=REQS.filter(function(r){return r.status==='pending';});var rows=pend.map(function(r){return '<tr><td>'+h(r.branchId)+'</td><td>'+h(r.siteZone)+'</td><td>'+r.guardsNeeded+'</td><td>'+h(r.urgency)+'</td><td>'+h(r.requestedBy)+'</td><td><button class="btn green" onclick="approveReq(\\''+r.id+'\\',\\'approved\\')">Approve</button> <button class="btn r" onclick="approveReq(\\''+r.id+'\\',\\'rejected\\')">Reject</button></td></tr>';}).join('');el('content').innerHTML=reportWrap('Manpower Approvals','Pending requisitions from branches',portalBadge(),'<div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>Branch</th><th>Site</th><th>Needed</th><th>Urgency</th><th>Requested</th><th></th></tr></thead><tbody>'+(rows||'<tr><td colspan="6">No pending approvals.</td></tr>')+'</tbody></table></div>');}
function approveReq(id,st){api('approveRequisition',{id:id,status:st}).then(function(res){if(res.s===200){REQS=REQS.map(function(r){return r.id===id?Object.assign({},r,{status:st}):r;});approvals();}});}

function vendors(){var rows=VENDORS.map(function(v,i){return '<tr><td>'+h(v.name)+'</td><td>'+h(v.contactPerson)+'</td><td>'+h(v.mobile)+'</td><td>'+h(v.branchesServed)+'</td><td>'+h(v.contractValidTill)+'</td><td>'+v.guardsSupplied+'</td></tr>';}).join('');var add='<div class="card fgrid"><input id="vn" placeholder="Agency name"><input id="vc" placeholder="Contact"><input id="vm" placeholder="Mobile"><button class="btn" onclick="addVendor()">+ Add Vendor</button></div>';el('content').innerHTML=reportWrap('Vendor / Agency Management','Third-party recruitment partners',portalBadge(),'<div class="tblwrap"><table><thead><tr><th>Agency</th><th>Contact</th><th>Mobile</th><th>Branches</th><th>Contract Till</th><th>Supplied</th></tr></thead><tbody>'+(rows||'<tr><td colspan="6">No vendors.</td></tr>')+'</tbody></table></div>'+add+'<div class="savebar"><button class="btn green" onclick="api(\\'saveVendors\\',{vendors:VENDORS}).then(function(){alert(\\'Saved\\');})">Save Vendors</button></div>');}
function addVendor(){VENDORS.push({id:nid('vn'),name:el('vn').value,contactPerson:el('vc').value,mobile:el('vm').value,branchesServed:'',contractValidTill:'',guardsSupplied:0,active:true,remarks:'',createdAt:new Date().toISOString()});vendors();}

function settings(){el('content').innerHTML=reportWrap('Configuration','Targets and shortage',portalBadge(),'<div class="card fgrid"><div><label>Shortage Count</label><input type="number" id="cf_short" value="'+(CFG.shortageCount||0)+'"></div><div><label>Daily Target / Branch</label><input type="number" id="cf_daily" value="'+(CFG.dailyTargetPerBranch||5)+'"></div><div><label>Monthly Target</label><input type="number" id="cf_month" value="'+(CFG.monthlyTarget||100)+'"></div><div><label>Contracted Strength</label><input type="number" id="cf_con" value="'+(CFG.contractedStrength||0)+'"></div><div><label>Actually Deployed</label><input type="number" id="cf_dep" value="'+(CFG.actualDeployed||0)+'"></div></div><div class="savebar"><button class="btn green" onclick="saveCfg()">Save Configuration</button></div>');}
function saveCfg(){var c={shortageCount:+el('cf_short').value,dailyTargetPerBranch:+el('cf_daily').value,monthlyTarget:+el('cf_month').value,contractedStrength:+el('cf_con').value,actualDeployed:+el('cf_dep').value,wageHoldSites:CFG.wageHoldSites||[]};api('saveConfig',{config:c}).then(function(res){if(res.s===200){CFG=res.j.config||c;alert('Saved.');settings();}});}

function userTemplate(){return {id:nid('us'),name:'',email:'',mobile:'',role:'branch',userType:'hod',branchId:'Hyderabad',active:true,deactivateReason:'',remarks:'',createdAt:new Date().toISOString()};}
function userTypeLabel(t){return {director:'Director',admin:'Admin',hod:'HOD',staff:'Staff',recruiter:'Recruiter'}[t]||t;}
function setUserType(i,t){USERS[i].userType=t;if(t==='director'||t==='admin'){USERS[i].role='admin';USERS[i].branchId='';}else{USERS[i].role='branch';}users();}
function toggleUser(i,on){USERS[i].active=on;if(!on&&!USERS[i].deactivateReason)USERS[i].deactivateReason='Deactivated';users();}
function delUser(i){if(!confirm('Remove '+((USERS[i]&&USERS[i].name)||'this user')+' from the list?'))return;USERS.splice(i,1);USR=-1;users();}
function users(){
  if(RECRUIT_ROLE!=='admin'){el('content').innerHTML=reportWrap('User Management','Management only',portalBadge(),'<p class="rpt-note">Only Director / Admin can manage users.</p>');return;}
  var rows=USERS.map(function(u,i){
    var ut=u.userType||(u.role==='admin'?'admin':'hod');
    var roleBadge='<span class="badge-role badge-'+(u.role==='admin'?'admin':'branch')+'">'+h(userTypeLabel(ut))+'</span>';
    var sw='<label class="switch" title="'+(u.active?'Active':'Inactive')+'"><input type="checkbox" '+(u.active?'checked':'')+' onchange="toggleUser('+i+',this.checked)"><span class="slider"></span></label><span class="switch-lbl">'+(u.active?'Active':'Off')+'</span>';
    return '<tr class="'+(u.active?'':'inactive')+'"><td><b>'+h(u.name||'—')+'</b></td><td>'+h(u.email||'—')+'</td><td>'+h(u.mobile||'—')+'</td><td>'+roleBadge+'</td><td>'+(u.role==='branch'?h(u.branchId):'Management')+'</td><td style="white-space:nowrap">'+sw+'</td><td><button class="btn grey" style="padding:4px 10px" onclick="USR='+i+';users()">Edit</button> <button class="btn r" style="padding:4px 10px" onclick="delUser('+i+')">Remove</button></td></tr>';
  }).join('');
  var ed='';
  if(USR>=0&&USERS[USR]){
    var u=USERS[USR],i=USR,ut=u.userType||(u.role==='admin'?'admin':'hod');
    ed='<div class="vedit"><h4>Edit User — '+h(u.name||'New')+'</h4><div class="fgrid">'+
      '<div><label>Full Name *</label><input value="'+a(u.name)+'" oninput="USERS['+i+'].name=this.value"></div>'+
      '<div><label>Work email</label><input value="'+a(u.email)+'" oninput="USERS['+i+'].email=this.value" placeholder="name@agilegroup.co.in"></div>'+
      '<div><label>Mobile</label><input value="'+a(u.mobile)+'" oninput="USERS['+i+'].mobile=this.value"></div>'+
      '<div><label>Role *</label><select onchange="setUserType('+i+',this.value)"><option value="director"'+(ut==='director'?' selected':'')+'>Director</option><option value="admin"'+(ut==='admin'?' selected':'')+'>Admin</option><option value="hod"'+(ut==='hod'?' selected':'')+'>HOD (Branch)</option><option value="recruiter"'+(ut==='recruiter'?' selected':'')+'>Recruiter (Branch)</option><option value="staff"'+(ut==='staff'?' selected':'')+'>Staff (Branch)</option></select></div>'+
      (u.role==='branch'?'<div><label>Branch *</label><select onchange="USERS['+i+'].branchId=this.value">'+BRANCHES.map(function(b){return '<option'+(b===u.branchId?' selected':'')+'>'+h(b)+'</option>';}).join('')+'</select></div>':'')+
      '</div><div style="margin-top:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">'+
      '<label class="switch"><input type="checkbox" '+(u.active?'checked':'')+' onchange="USERS['+i+'].active=this.checked;toggleUser('+i+',this.checked)"><span class="slider"></span></label>'+
      '<span style="color:#94a3b8;font-size:13px">'+(u.active?'User is <b style="color:#4ade80">Active</b>':'User is <b style="color:#fb923c">Inactive</b> — login blocked')+'</span>'+
      (u.active?'':'<input placeholder="Deactivate reason" value="'+a(u.deactivateReason)+'" oninput="USERS['+i+'].deactivateReason=this.value" style="flex:1;min-width:180px">')+
      '</div><div style="margin-top:8px"><label>Remarks</label><textarea rows="2" oninput="USERS['+i+'].remarks=this.value">'+h(u.remarks)+'</textarea></div>'+
      '<div style="margin-top:10px"><button class="btn grey" onclick="USR=-1;users()">Close</button></div></div>';
  }
  el('content').innerHTML=reportWrap('User Management','Add · Edit · Activate / Deactivate · Remove',portalBadge(),
    '<div class="card"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px"><b style="color:#fff">Recruitment Users</b><button class="btn grey" onclick="USERS.push(userTemplate());USR=USERS.length-1;users()">+ Add User</button></div>'+
    '<p class="rpt-note">Same format as Fleet &amp; MIS User Management. Use the <b>green switch</b> to activate or deactivate. Support departments are managed in <b>Master Directory</b>.</p>'+
    '<div class="tblwrap"><table><thead><tr><th>Name</th><th>Email</th><th>Mobile</th><th>Role</th><th>Branch</th><th>Active</th><th>Actions</th></tr></thead><tbody>'+(rows||'<tr><td colspan="7">No users — click Add User.</td></tr>')+'</tbody></table></div>'+ed+'</div>'+
    '<div class="savebar"><button class="btn green" onclick="saveUsr()">💾 Save Users</button></div>');
}
function saveUsr(){api('saveUsers',{users:USERS}).then(function(res){alert(res.s===200?'Saved ('+(res.j.count||USERS.length)+' users)':(res.j.error||'Error'));});}

if(otpRestoreSession())onOtpLogin({});
</script></body></html>`
