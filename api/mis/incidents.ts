import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireMisPageSession } from '../_lib/mis/session.js'
import { MIS_LAYOUT_CSS, MIS_SESSION_JS, MIS_THEME_CSS, misPageWrap } from '../_lib/mis/layout.js'

const MIS_ACTIVE = '/mis-incidents'
const MIS_TITLE = 'Incident Reporting'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireMisPageSession(req, res)) return
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — Incident Reporting</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:15px}
${MIS_THEME_CSS}
.hidden{display:none!important}
.ir-link{background:none;border:none;color:#93c5fd;font-weight:800;cursor:pointer;padding:0;text-align:left}
.ir-link:hover{color:#fde68a}
${MIS_LAYOUT_CSS}
</style></head>
<body>
${misPageWrap(MIS_ACTIVE, MIS_TITLE, `
<div class="m-wrap" id="app">
  <div class="m-card">
    <div class="hint">Management view of formal <b>Incident / Inquiry Reports</b>. Open / Closed for every branch. HODs write and send the client letter from the Branch portal.</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;margin-top:12px">
      <div><label class="m-lbl">Branch</label>
        <select class="m-inp" id="branch" style="min-width:260px" onchange="load()"><option value="all">All Branches</option></select>
      </div>
      <button type="button" class="m-btn m-btn-gold" onclick="load()">Show</button>
      <span id="msg" class="hint"></span>
    </div>
    <p class="hint" style="margin-top:10px">HOD entry page: <a href="/mis-staff-incidents" style="color:#fde68a">/mis-staff-incidents</a></p>
  </div>
  <div class="m-kgrid" id="kpis"></div>
  <div class="m-card">
    <h4 style="color:#fde68a;margin:0 0 10px">Saved reports</h4>
    <div class="mtblwrap"><table class="mtbl"><thead><tr><th>REF</th><th>Date</th><th>Branch</th><th>Client / Place</th><th>Type</th><th>Status</th><th></th></tr></thead><tbody id="rows"></tbody></table></div>
  </div>
  <div id="detail" class="m-card hidden">
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px">
      <h4 style="color:#fde68a;margin:0" id="detailTitle">Report</h4>
      <button type="button" class="m-btn m-btn-grey" onclick="closeDetail()">Close</button>
    </div>
    <div id="detailMeta" class="hint" style="margin-bottom:10px"></div>
    <iframe id="letter" title="Incident letter" sandbox="allow-same-origin" style="display:block;width:100%;min-height:70vh;height:70vh;border:0;background:#f1f5f9;border-radius:8px"></iframe>
  </div>
</div>
`)}
<script>
${MIS_SESSION_JS}
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function a(s){return h(s).replace(/"/g,'&quot;');}
function api(action,extra){return fetch('/api/mis/admin-data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action},extra||{}))}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});}
function msg(t,ok){var m=el('msg');if(!m)return;m.textContent=t||'';m.style.color=ok===false?'#f87171':(ok===true?'#4ade80':'#94a3b8');}
function fillBranches(list){
  var sel=el('branch');if(!sel)return;
  var cur=sel.value||'all';
  sel.innerHTML='<option value="all">All Branches</option>'+(list||[]).map(function(b){return '<option value="'+a(b.id)+'">'+h(b.name)+'</option>';}).join('');
  if(cur)sel.value=cur;
}
function load(){
  msg('Loading…');
  api('incidentReportsOverview',{branchId:el('branch').value||'all'}).then(function(res){
    if(res.status===401){alert(res.body.error||'Please sign in again');location.href='/mis';return;}
    if(res.status!==200){msg(res.body.error||'Could not load',false);return;}
    fillBranches(res.body.branches||[]);
    var open=res.body.open||0,closed=res.body.closed||0,total=res.body.total||0;
    el('kpis').innerHTML='<div class="m-kpi p"><b>'+open+'</b><span>Open</span></div><div class="m-kpi s"><b>'+closed+'</b><span>Closed (report sent)</span></div><div class="m-kpi o"><b>'+total+'</b><span>Total</span></div>';
    var rows=res.body.reports||[];
    el('rows').innerHTML=rows.length?rows.map(function(r){
      var st=r.status==='submitted'?'<span style="color:#4ade80;font-weight:800">Closed (report sent)</span>':'<span style="color:#fbbf24;font-weight:800">Open</span>';
      return '<tr><td>'+h(r.refNo||'—')+'</td><td>'+h(r.incidentDate||r.reportDate||'')+'</td><td>'+h(r.branchName||'')+'</td><td>'+h(r.clientName||r.placeOfIncident||'—')+'</td><td>'+h((r.typeOfIncident||'').slice(0,70))+'</td><td>'+st+'</td><td><button type="button" class="m-btn m-btn-navy" style="padding:4px 10px;font-size:12px" onclick="openReport(\\''+a(r.branchId)+'\\',\\''+a(r.id)+'\\')">Open</button></td></tr>';
    }).join(''):'<tr><td colspan="7" class="hint">No incident reports yet. Branch HODs enter them in Incident Reporting on the staff portal.</td></tr>';
    msg('Ready.',true);
  }).catch(function(){msg('Network error',false);});
}
function paintLetter(html){
  var frame=el('letter');if(!frame)return;
  var doc='<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Letter</title><style>html,body{margin:0;background:#f1f5f9;color:#0f172a;font-family:Arial,Helvetica,sans-serif}</style></head><body style="margin:0;padding:12px;background:#f1f5f9;color:#0f172a">'+(html||'<p style="color:#64748b">No letter yet.</p>')+'</body></html>';
  try{frame.srcdoc=doc;}catch(e){try{frame.src='data:text/html;charset=utf-8,'+encodeURIComponent(doc);}catch(e2){}}
}
function openReport(branchId,id){
  msg('Opening…');
  api('getIncidentReport',{branchId:branchId,id:id}).then(function(res){
    if(res.status!==200){msg(res.body.error||'Could not open',false);return;}
    var r=res.body.report||{};
    el('detail').classList.remove('hidden');
    el('detailTitle').textContent=(r.refNo||'Report')+' — '+(r.status==='submitted'?'Closed':'Open');
    el('detailMeta').textContent=(r.branchName||'')+' · '+(r.clientName||r.placeOfIncident||'')+' · '+(r.incidentDate||'');
    paintLetter(res.body.html||'');
    try{el('detail').scrollIntoView({behavior:'smooth',block:'start'});}catch(e){}
    msg('Ready.',true);
  }).catch(function(){msg('Network error',false);});
}
function closeDetail(){el('detail').classList.add('hidden');}
function initPage(){load();}
misStart();
</script>
</body></html>`
