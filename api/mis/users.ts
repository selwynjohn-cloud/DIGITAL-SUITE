import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireMisPageSession } from '../_lib/mis/session.js'
import { MIS_LAYOUT_CSS, MIS_SESSION_JS, misPageWrap } from '../_lib/mis/layout.js'

const MIS_ACTIVE = '/mis-users'
const MIS_TITLE = 'User Management'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireMisPageSession(req, res)) return
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — User Management</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:#0b1220;color:#e2e8f0;font-size:15px}
.top{background:#14224f;color:#fff;padding:16px;display:flex;align-items:center;gap:12px;border-bottom:4px solid #c9a84c;flex-wrap:wrap;justify-content:space-between}
.top img{height:40px}.top h1{font-size:19px}
.wrap{max-width:1050px;margin:0 auto;padding:16px}
.card{background:#111a30;border:1px solid #22304f;border-radius:12px;padding:18px;margin-bottom:16px}
.btn{padding:10px 16px;border:none;border-radius:8px;font-weight:800;cursor:pointer;font-size:14px}
.g{background:#c9a84c;color:#14224f}.green{background:#16a34a;color:#fff}.grey{background:#334155;color:#e2e8f0}
input,select{padding:9px 10px;border:1px solid #334155;border-radius:7px;background:#0b1220;color:#e2e8f0;font-size:14px;width:100%}
label{display:block;font-size:12px;color:#94a3b8;margin:8px 0 3px}
#login{max-width:360px;margin:60px auto}.hidden{display:none}
.msg{padding:10px;border-radius:8px;font-size:14px;margin-top:10px;display:none;background:#3a0a0a;color:#ef4444}
.kgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:14px}
.kpi{border-radius:14px;padding:16px;color:#fff}.kpi b{font-size:26px;display:block}.kpi span{font-size:12px;color:rgba(255,255,255,.85)}
.kpi.a{background:linear-gradient(135deg,#7c3aed,#a855f7)}.kpi.b{background:linear-gradient(135deg,#1d4ed8,#3b82f6)}.kpi.c{background:linear-gradient(135deg,#15803d,#22c55e)}
.tblwrap{overflow-x:auto;border:1px solid #22304f;border-radius:8px}table.users-tbl{border-collapse:collapse;width:100%;font-size:13px;min-width:1180px;table-layout:fixed}
.users-tbl th,.users-tbl td{border:1px solid #22304f;padding:7px 8px;text-align:left;vertical-align:middle}
.users-tbl th{background:#0b1220;color:#94a3b8;font-size:11px;text-transform:uppercase}
.users-tbl td input,.users-tbl td select{width:100%;min-width:0;box-sizing:border-box}
.users-tbl th:nth-child(1),.users-tbl td:nth-child(1){width:190px;min-width:190px}
.users-tbl th:nth-child(2),.users-tbl td:nth-child(2){width:290px;min-width:290px}
.users-tbl th:nth-child(3),.users-tbl td:nth-child(3){width:120px;min-width:120px}
.users-tbl th:nth-child(4),.users-tbl td:nth-child(4){width:170px;min-width:170px}
.users-tbl th:nth-child(5),.users-tbl td:nth-child(5){width:145px;min-width:145px}
.users-tbl th:nth-child(6),.users-tbl td:nth-child(6){width:155px;min-width:155px}
.users-tbl th:nth-child(7),.users-tbl td:nth-child(7){width:200px;min-width:200px}
.users-tbl th:nth-child(8),.users-tbl td:nth-child(8){width:72px;min-width:72px;text-align:center}
.users-tbl th:nth-child(9),.users-tbl td:nth-child(9){width:88px;min-width:88px}
.inact{opacity:.5}
.savebar{position:sticky;bottom:0;background:#111a30;border-top:1px solid #22304f;padding:12px;display:flex;gap:10px;justify-content:center}
.switch{position:relative;display:inline-block;width:46px;height:26px;vertical-align:middle}
.switch input{opacity:0;width:0;height:0;position:absolute}
.slider{position:absolute;cursor:pointer;inset:0;background:#334155;transition:.2s;border-radius:26px;border:1px solid #475569}
.slider:before{position:absolute;content:"";height:20px;width:20px;left:2px;bottom:2px;background:#94a3b8;transition:.2s;border-radius:50%}
.switch input:checked+.slider{background:#16a34a;border-color:#15803d}
.switch input:checked+.slider:before{transform:translateX(20px);background:#fff}
${MIS_LAYOUT_CSS}
</style></head>
<body>
${misPageWrap(MIS_ACTIVE, MIS_TITLE, `
<div class="top"><div style="display:flex;align-items:center;gap:12px"><img src="https://www.agilegroup-digital.co.in/agile-logo.png"><h1>User Management</h1></div><a class="btn grey" href="/mis-dashboard" style="text-decoration:none">📊 Dashboard</a></div>

<div id="app"><div class="wrap">
  <div class="kgrid" id="kpis"></div>
  <div class="card"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px"><b style="color:#fff">Registered Users</b><button class="btn grey" onclick="addU()">+ Add User</button></div>
  <div style="font-size:12px;color:#94a3b8;margin-bottom:8px">Director and Admin only. Users are never deleted — use the <b>Active</b> switch to deactivate. <b>Operations</b> = branch MIS submitters. <b>Support</b> (Stores, HR, Recruitment, Payroll) cannot submit MIS.</div>
  <div class="tblwrap"><table class="users-tbl"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Team</th><th>Dept</th><th>Branch</th><th>Active</th><th></th></tr></thead><tbody id="rows"></tbody></table></div></div>
</div>
  <div class="savebar"><button class="btn green" onclick="save()">✅ Save &amp; Publish</button></div>
</div>
`)}
<script>
${MIS_SESSION_JS}
U=[],B=[];
var ROLES=['Director','Admin','CGM','Vice President (VP)','AVP','General Manager (GM)','Regional Manager (RM)','Branch Manager','Operations Manager','Area Manager','Field Officer','Sales Executive','Training Team','Accounts','HR'];
var TEAMS=['operations','support'];
var DEPTS=['','Stores','HR','Recruitment','Payroll'];
function teamLbl(t){return t==='support'?'Support':'Operations';}
function setTeam(i,v){U[i].team=v;if(v==='support'&&!U[i].department)U[i].department='HR';if(v==='operations')U[i].department='';render();}
function addU(){U.push({id:nid(),name:'',email:'',phone:'',role:'Field Officer',branchId:'',team:'operations',department:'',active:true});render();}
function delU(i){if(!confirm('Remove '+((U[i]&&U[i].name)||'this user')+' from the list?'))return;U.splice(i,1);render();}
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function a(s){return h(s).replace(/"/g,'&quot;');}
function nid(){return 'us'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
function api(action,extra){return fetch('/api/mis/admin-data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action},extra||{}))}).then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});});}
function opt(cur,arr){return arr.map(function(o){return '<option'+(o===cur?' selected':'')+'>'+h(o)+'</option>';}).join('');}
function bopt(cur){return '<option value="">—</option>'+B.map(function(b){return '<option value="'+a(b.id)+'"'+(b.id===cur?' selected':'')+'>'+h(b.name)+'</option>';}).join('');}
function render(){
  var act=U.filter(function(x){return x.active!==false;}).length;
  el('kpis').innerHTML='<div class="kpi a"><b>'+U.length+'</b><span>Total Users</span></div><div class="kpi c"><b>'+act+'</b><span>Active</span></div><div class="kpi b"><b>'+(U.length-act)+'</b><span>Deactivated</span></div>';
  el('rows').innerHTML=U.map(function(u,i){var tm=u.team||'operations';
    return '<tr class="'+(u.active===false?'inact':'')+'">'+
    '<td><input value="'+a(u.name)+'" oninput="U['+i+'].name=this.value"></td>'+
    '<td><input value="'+a(u.email)+'" oninput="U['+i+'].email=this.value"></td>'+
    '<td><input value="'+a(u.phone)+'" oninput="U['+i+'].phone=this.value"></td>'+
    '<td><select onchange="U['+i+'].role=this.value">'+opt(u.role,ROLES)+'</select></td>'+
    '<td><select onchange="setTeam('+i+',this.value)">'+TEAMS.map(function(t){return '<option value="'+t+'"'+(tm===t?' selected':'')+'>'+teamLbl(t)+'</option>';}).join('')+'</select></td>'+
    '<td>'+(tm==='support'?'<select onchange="U['+i+'].department=this.value">'+DEPTS.filter(function(d){return d;}).map(function(d){return '<option'+(u.department===d?' selected':'')+'>'+h(d)+'</option>';}).join('')+'</select>':'<span style="color:#64748b">—</span>')+'</td>'+
    '<td><select onchange="U['+i+'].branchId=this.value">'+bopt(u.branchId)+'</select></td>'+
    '<td style="white-space:nowrap"><label class="switch"><input type="checkbox" '+(u.active!==false?'checked':'')+' onchange="U['+i+'].active=this.checked;render()"><span class="slider"></span></label></td>'+
    '<td><button class="btn grey" style="padding:4px 10px" onclick="delU('+i+')">Remove</button></td></tr>';}).join('');
}
function save(){
  for(var i=0;i<U.length;i++){
    var em=(U[i].email||'').trim().toLowerCase();
    if(!U[i].name.trim()){alert('Please enter a name for every user.');return;}
    if(em&&em.indexOf('@agilegroup.co.in')<0){alert('Email must be @agilegroup.co.in for: '+U[i].name);return;}
  }
  api('saveUsers',{users:U}).then(function(r){
    if(r.s===200){alert('Saved ✓ — '+((r.j&&r.j.count)||U.length)+' users');return;}
    alert((r.j&&r.j.error)||'Could not save — please sign in again at /mis and retry.');
  }).catch(function(){alert('Network error — check internet and try again.');});
}
function initPage(){
  api('loadUsers').then(function(res){
    if(res.s===403){alert(res.j.error||'Only Director and Admin can open User Management.');location.href='/mis-dashboard';return;}
    if(res.s===401){alert('Session expired — please sign in again.');location.href='/mis';return;}
    if(res.s!==200){alert((res.j&&res.j.error)||'Could not load users.');return;}
    U=res.j.users||[];B=res.j.branches||[];render();
  }).catch(function(){alert('Network error loading users.');});
}
misStart();
</script>
</body></html>`
