import type { VercelRequest, VercelResponse } from '@vercel/node'
import { hodLoginHtml, otpLoginScript } from '../_lib/embedded-otp.js'
import { MIS_STAFF_CSS } from '../_lib/mis/staff-theme.js'
import { UNIT_ISSUE_ITEMS } from '../_lib/deployment/unit-issue.js'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const ITEMS_JSON = JSON.stringify(UNIT_ISSUE_ITEMS)

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile Deployment — Unit Issue Register</title>
<style>
${MIS_STAFF_CSS}
.guard-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px;margin-top:12px}
.unit-card{background:#0e1730;border:1px solid #475569;border-radius:12px;padding:14px}
.unit-card h4{color:#fde68a;font-size:15px;margin-bottom:4px}
.unit-card .sub{color:#94a3b8;font-size:13px;margin-bottom:10px}
.qgrid{display:grid;grid-template-columns:1fr 56px;gap:6px;font-size:13px;max-height:220px;overflow:auto}
.qgrid label{color:#cbd5e1;padding:4px 0}
.qgrid input{width:56px;padding:6px;text-align:center}
.search{margin:10px 0;max-width:400px}
</style></head>
<body>
<div class="top"><div style="display:flex;align-items:center;gap:12px"><img src="https://www.agilegroup-digital.co.in/agile-logo.png"><h1>Unit Issue Register<small>Agile Deployment — equipment per client unit</small></h1></div>
<a class="btn grey" href="/mis-report" style="text-decoration:none">📋 Daily Report</a></div>

<div id="login">
${hodLoginHtml('Agile Deployment', 'Unit Issue Register — branch HOD sign in')}
<div id="branchStep" class="card hidden" style="margin-top:12px">
  <label>Branch</label><select id="branch"></select>
  <div style="margin-top:12px"><button class="btn g" onclick="openReg()">Open Unit Issue Register</button></div>
</div>
</div>

<div id="app" class="hidden"><div class="wrap">
  <div class="card">
    <b style="color:#fde68a;font-size:18px" id="hdr"></b>
    <div class="hint">Record security equipment issued to each client unit — walkie talkie, HHMD, DFMD, vehicles, etc.</div>
    <input class="search" id="search" placeholder="Search client / location" oninput="render()">
    <div class="guard-grid" id="grid"></div>
    <div style="margin-top:14px"><button class="btn green" onclick="save()">✅ Save Unit Issue Register</button></div>
    <div id="saveMsg" class="msg"></div>
  </div>
</div></div>

<script>
${otpLoginScript('mis-report', 'Agile Deployment — Unit Issue Register', 'staff')}
var BR='',ROWS=[],ITEMS=${ITEMS_JSON};
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function api(action,extra){return fetch('/api/deployment/units-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,sessionToken:OTP_SESSION,branchId:BR},extra||{}))}).then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});});}
function onOtpLogin(){el('otpStepEmail').classList.add('hidden');el('otpStepPin').classList.add('hidden');el('branchStep').classList.remove('hidden');otpMsg('Signed in. Select branch.',true);}
fetch('/api/deployment/units-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'branches'})}).then(function(r){return r.json();}).then(function(j){el('branch').innerHTML=(j.branches||[]).map(function(b){return '<option value="'+b.id+'">'+h(b.name)+'</option>';}).join('');});
function openReg(){BR=el('branch').value;api('load',{seed:true}).then(function(res){if(res.s!==200){otpMsg(res.j.error||'Could not open',false);return;}ROWS=res.j.rows||[];el('login').classList.add('hidden');el('app').classList.remove('hidden');el('hdr').textContent=(res.j.branchName||'')+' — Unit Issue Register';render();});}
function render(){var q=(el('search').value||'').toLowerCase();var g=el('grid');g.innerHTML='';
  ROWS.forEach(function(r,i){var hay=(r.clientName+' '+r.location).toLowerCase();if(q&&hay.indexOf(q)<0)return;
    var card=document.createElement('div');card.className='unit-card';
    var qhtml=ITEMS.map(function(lab){var v=(r.items&&r.items[lab])||0;return '<label>'+h(lab)+'</label><input type="number" min="0" value="'+v+'" oninput="ROWS['+i+'].items=ROWS['+i+'].items||{};ROWS['+i+'].items[\\''+lab+'\\']=+this.value||0">';
    }).join('');
    card.innerHTML='<h4>'+h(r.clientName)+'</h4><div class="sub">'+h(r.location)+'</div><div class="qgrid">'+qhtml+'</div><label style="margin-top:8px">Remarks</label><input value="'+h(r.remarks||'')+'" oninput="ROWS['+i+'].remarks=this.value">';
    g.appendChild(card);
  });
  if(!g.children.length)g.innerHTML='<div class="hint">No clients — add clients in Daily Report first.</div>';
}
function save(){var m=el('saveMsg');m.style.display='block';m.style.background='#14532d';m.style.color='#86efac';m.textContent='Saving...';
  api('save',{rows:ROWS}).then(function(res){m.textContent=res.s===200?'✅ Saved successfully.':'Could not save.';if(res.s!==200){m.style.background='#450a0a';m.style.color='#fca5a5';}});}
</script></body></html>`
