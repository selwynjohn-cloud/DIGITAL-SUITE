import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireMisPageSession } from '../_lib/mis/session.js'
import { MIS_LAYOUT_CSS, MIS_SESSION_JS, MIS_THEME_CSS, misPageWrap } from '../_lib/mis/layout.js'

const MIS_ACTIVE = '/mis-duty'
const MIS_TITLE = 'Late Start & Left Post'
const ACTIONS = `<button class="m-btn m-btn-gold" onclick="syncNow()">📱 Sync from Mobile App</button>`

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireMisPageSession(req, res)) return
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — Late Start & Left Post</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:15px}
${MIS_THEME_CSS}
.tag-late{background:rgba(245,158,11,.2);color:#fcd34d;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:800}
.tag-out{background:rgba(239,68,68,.2);color:#fca5a5;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:800}
${MIS_LAYOUT_CSS}
</style></head>
<body>
${misPageWrap(MIS_ACTIVE, MIS_TITLE, `
<div class="m-wrap">
  <div class="m-card">
    <div class="hint" style="margin-top:0">Pulled from <b>Agile Mobile (Work360)</b> — late duty start and left post / out-of-location cases. Also feeds the Management Dashboard duty-start panel.</div>
    <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;align-items:flex-end">
      <div><label class="m-lbl">Date</label><input class="m-inp" id="date" type="date"></div>
      <button class="m-btn m-btn-gold" onclick="load()">Show</button>
      <span id="syncMsg" class="hint" style="margin:0"></span>
    </div>
  </div>
  <div class="m-kgrid" id="kpis"></div>
  <div class="m-card">
    <h4>All Cases</h4>
    <div class="mtblwrap"><table class="mtbl"><thead><tr><th class="c">Type</th><th class="l">Guard</th><th class="l">Client</th><th class="l">Unit</th><th class="c">Time</th><th class="l">Remarks</th></tr></thead><tbody id="rows"></tbody></table></div>
  </div>
</div>
`, ACTIONS)}
<script>
${MIS_SESSION_JS}
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function api(action,extra){return fetch('/api/mis/admin-data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action},extra||{}))}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});}
(function(){el('date').value=new Date().toISOString().slice(0,10);})();
function load(){api('dutyIncidents',{date:el('date').value,autoSync:false}).then(function(res){if(res.status===200)render(res.body);});}
function syncNow(){el('syncMsg').textContent='Syncing…';api('syncDuty',{date:el('date').value}).then(function(res){if(res.status===200){render(res.body);el('syncMsg').textContent='Done';}else el('syncMsg').textContent=res.body.error||'Failed';});}
function render(d){
  var c=d.counts||{late:0,out:0};
  el('kpis').innerHTML=
    '<div class="m-kpi t"><b>'+c.late+'</b><span>Late Start Cases</span></div>'+
    '<div class="m-kpi p"><b>'+c.out+'</b><span>Left Post Cases</span></div>';
  var rows=(d.incidents||[]).map(function(i){
    var tag=i.type==='late_start'?'<span class="tag-late">LATE START</span>':(i.type==='out_of_post'?'<span class="tag-out">LEFT POST</span>':'<span class="tag-out">OTHER</span>');
    return '<tr><td class="c">'+tag+'</td><td>'+h(i.guardName)+'</td><td>'+h(i.client)+'</td><td>'+h(i.unit)+'</td><td class="c">'+h(i.incidentTime)+'</td><td>'+h(i.remarks)+'</td></tr>';
  }).join('');
  el('rows').innerHTML=rows||'<tr><td colspan="6" class="m-pending">No cases for this date — sync from mobile or check Work360 env on server.</td></tr>';
}
load();
</script>
</body></html>`
