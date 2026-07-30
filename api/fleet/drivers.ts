import type { VercelRequest, VercelResponse } from '@vercel/node'
import { hodLoginHtml, otpLoginScript } from '../_lib/embedded-otp.js'
import { FLEET_REPORT_CSS, fleetFooterBlock } from '../_lib/fleet/brand.js'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile Fleet — Driver Register</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:#0b1220;color:#e2e8f0;font-size:14px}
#login{max-width:400px;margin:0 auto;padding-top:10vh}
.card{background:#111a30;border:1px solid #22304f;border-radius:14px;padding:24px;margin-bottom:16px}
.card h2{color:#fff;margin-bottom:4px}
input,select,textarea{width:100%;padding:9px 11px;border:1px solid #334155;border-radius:8px;background:#0b1220;color:#e2e8f0;font-size:14px}
label{display:block;font-size:12px;color:#94a3b8;margin:8px 0 3px;font-weight:700}
.btn{padding:11px 18px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:14px;background:#0d9488;color:#fff}
.green{background:#16a34a;color:#fff}.grey{background:#334155;color:#e2e8f0}
.msg{padding:10px;border-radius:8px;font-size:14px;margin-top:10px;display:none;background:#3a0a0a;color:#ef4444}
#app{display:none;max-width:960px;margin:0 auto;padding:16px}
.hdr{text-align:center;margin-bottom:16px}.hdr img{height:52px}.hdr h1{color:#fff;font-size:20px;margin-top:8px}
.hdr p{color:#0d9488;font-size:13px}
.tblwrap{overflow-x:auto;border:1px solid #22304f;border-radius:8px}table{border-collapse:collapse;width:100%;font-size:13px}
th,td{border:1px solid #22304f;padding:8px;text-align:left}th{background:#0b1220;color:#94a3b8;font-size:11px}
.inactive{opacity:.45}
.note{background:#451a03;border:1px solid #92400e;border-radius:8px;padding:12px;margin-bottom:14px;font-size:13px;color:#fcd34d}
.hidden{display:none!important}
${FLEET_REPORT_CSS}
</style></head>
<body>
<div id="login">
${hodLoginHtml('Agile Fleet', 'Driver Register — branch HOD sign in')}
<div id="branchStep" class="card hidden" style="margin-top:12px">
  <label>Your branch</label><select id="branch"></select>
  <button class="btn" style="width:100%;margin-top:12px" onclick="doLogin()">Open Driver Register</button>
  <div style="text-align:center;margin-top:12px;font-size:12px;color:#64748b"><a href="/fleet-report" style="color:#0d9488">Weekly Report</a> · <a href="/fleets" style="color:#0d9488">Management</a></div>
</div>
</div>

<div id="app">
  <div class="hdr"><img src="https://www.agilegroup-digital.co.in/agile-logo.png"><h1>Driver Register</h1><p id="branchLbl"></p></div>
  <div class="note">Drivers belong to the <b>branch pool</b> — not fixed to any vehicle. Pick the driver each week on the Weekly Vehicle Report. Add / Edit / Deactivate only — never delete.</div>
  <div class="card">
    <div style="display:flex;justify-content:space-between;margin-bottom:10px"><b style="color:#fff">Branch Drivers &amp; License Details</b><button class="btn grey" onclick="addDr()">+ Add Driver</button></div>
    <div class="tblwrap"><table><thead><tr><th>Name</th><th>Mobile</th><th>License No.</th><th>Valid Upto</th><th>Type</th><th>Active</th><th>Remarks</th><th></th></tr></thead><tbody id="rows"></tbody></table></div>
    <div style="text-align:center;margin-top:14px"><button class="btn green" onclick="saveDr()">💾 Save Driver Register</button></div>
  </div>
  ${fleetFooterBlock()}
</div>

<script>
${otpLoginScript('fleet', 'Agile Fleet — Driver Register', 'staff')}
var BRANCH='',D=[],BRANCHES=['Visakhapatnam','Nellore','Bangalore','Gulbarga','Hyderabad','Kakinada','Vijayawada','Chennai','Mumbai','Corporate Office'];
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function a(s){return h(s).replace(/"/g,'&quot;');}
function nid(p){return p+Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
function api(action,extra){return fetch('/api/fleet/data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,sessionToken:OTP_SESSION,branchId:BRANCH},extra||{}))}).then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});});}
function onOtpLogin(j){
  api('login').then(function(res){
    if(res.s===403||res.s===401){otpMsg(res.j.error||'Not authorized for Fleet.',false);return;}
    if(res.s!==200){otpMsg(res.j.error||'Could not sign in.',false);return;}
    if(res.j.role==='branch'&&res.j.lockedBranch){
      BRANCH=res.j.lockedBranch;
      doLogin();
      return;
    }
    if(res.j.role==='admin'){
      el('otpStepEmail').classList.add('hidden');el('otpStepPin').classList.add('hidden');
      el('branchStep').classList.remove('hidden');
      otpMsg('Signed in. Select branch to open register.',true);
      return;
    }
    otpMsg(res.j.error||'Branch access not set up for your email.',false);
  }).catch(function(){otpMsg('Network error.',false);});
}
el('branch').innerHTML=BRANCHES.map(function(b){return '<option>'+b+'</option>';}).join('');
function doLogin(){BRANCH=el('branch').value;api('login').then(function(res){if(res.s!==200){otpMsg(res.j.error||'Could not open register',false);return;}
  D=(res.j.drivers||[]).filter(function(x){return x.active!==false;});el('branchLbl').textContent=BRANCH+' Branch — Driver Register';el('login').style.display='none';el('app').style.display='block';render();});}
function drTpl(){return {id:nid('dr'),branchId:BRANCH,name:'',mobile:'',licenseNo:'',licenseValid:'',licenseType:'LMV',badgeNo:'',active:true,deactivateReason:'',remarks:'',createdAt:new Date().toISOString()};}
function addDr(){D.push(drTpl());render();}
function render(){el('rows').innerHTML=D.map(function(d,i){return '<tr class="'+(d.active?'':'inactive')+'">'+
  '<td><input value="'+a(d.name)+'" oninput="D['+i+'].name=this.value"></td>'+
  '<td><input value="'+a(d.mobile)+'" oninput="D['+i+'].mobile=this.value"></td>'+
  '<td><input value="'+a(d.licenseNo)+'" oninput="D['+i+'].licenseNo=this.value"></td>'+
  '<td><input type="date" value="'+a(d.licenseValid)+'" oninput="D['+i+'].licenseValid=this.value"></td>'+
  '<td><input value="'+a(d.licenseType||'LMV')+'" oninput="D['+i+'].licenseType=this.value"></td>'+
  '<td style="text-align:center"><input type="checkbox" '+(d.active?'checked':'')+' onchange="D['+i+'].active=this.checked;render()"></td>'+
  '<td><input value="'+a(d.remarks)+'" oninput="D['+i+'].remarks=this.value"></td>'+
  '<td><button class="btn grey" style="padding:4px 8px" onclick="D.splice('+i+',1);render()">✕</button></td></tr>';}).join('')||'<tr><td colspan="8" style="color:#64748b">No drivers yet — click Add Driver.</td></tr>';}
function saveDr(){D.forEach(function(d){d.branchId=BRANCH;});api('saveDrivers',{drivers:D}).then(function(res){alert(res.s===200?'Saved ('+res.j.count+' drivers)':(res.j.error||'Error'));});}
</script></body></html>`
