import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireMisPageSession } from '../_lib/mis/session.js'
import { MIS_LAYOUT_CSS, MIS_SESSION_JS, MIS_THEME_CSS, misPageWrap } from '../_lib/mis/layout.js'
import { UNIT_ISSUE_ITEMS } from '../_lib/mis/unit-issue.js'

const MIS_ACTIVE = '/mis-unit-issue'
const MIS_TITLE = 'SLA Issue Analysis'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireMisPageSession(req, res)) return
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const ITEMS_JS = JSON.stringify(UNIT_ISSUE_ITEMS)

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — SLA Issue Analysis</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:15px}
${MIS_THEME_CSS}
${MIS_LAYOUT_CSS}
.m-hero{background:linear-gradient(135deg,#14224f,#1e3a8a);border-radius:14px;padding:20px;margin-bottom:16px;border:1px solid #334155}
.m-hero h2{color:#fde68a;font-size:20px}.m-hero p{color:#cbd5e1;font-size:13px;margin-top:6px;line-height:1.5}
.tblwrap{overflow-x:auto;border:1px solid #22304f;border-radius:8px;margin-top:12px}
table{border-collapse:collapse;width:100%;font-size:12px}
th,td{border:1px solid #22304f;padding:8px;color:#e2e8f0}th{background:#0e1730;color:#c9a84c;font-size:10px;text-transform:uppercase}
td.l{text-align:left}
.pend{color:#f87171;font-weight:800}.rep{color:#fbbf24;font-weight:800}
</style></head>
<body>
${misPageWrap(MIS_ACTIVE, MIS_TITLE, `
<div class="m-wrap" id="app">
  <div class="m-hero">
    <h2>Equipment Issues as per SLA — Management Analysis</h2>
    <p><b>Read-only.</b> HODs enter data on <a href="/mis-report" style="color:#fde68a">Daily Branch Report</a> → Unit Issue Register.<br>
    Pending = units with equipment issues not yet shared with stores. Repeated = same issue logged before.</p>
  </div>
  <div class="m-card">
    <button class="m-btn m-btn-grey" onclick="load()">Reload</button>
    <div class="m-kgrid" id="kpis" style="margin-top:12px"></div>
    <div class="tblwrap"><table>
      <thead><tr><th class="l">Branch</th><th>Pending Units</th><th>Pending Items</th><th>Repeated Units</th><th class="l">Details</th></tr></thead>
      <tbody id="rows"></tbody>
    </table></div>
    <div id="detail" style="margin-top:14px"></div>
    <div id="msg" class="hint" style="margin-top:10px"></div>
  </div>
</div>
`)}
<script>
${MIS_SESSION_JS}
var ITEMS=${ITEMS_JS},DATA=[];
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function api(action,extra){return fetch('/api/mis/unit-issue-data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action},extra||{}))}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});}
function load(){
  el('msg').textContent='Loading…';
  api('slaPendingAll').then(function(res){
    if(res.status!==200){el('msg').textContent=res.body.error||'Could not load.';return;}
    DATA=res.body.branches||[];
    var pend=0,rep=0,items=0;
    DATA.forEach(function(b){pend+=b.summary.pendingUnits;rep+=b.summary.repeatedUnits;items+=b.summary.pendingItems;});
    el('kpis').innerHTML=
      '<div class="m-kpi p"><b>'+pend+'</b><span>Pending Units</span></div>'+
      '<div class="m-kpi t"><b>'+items+'</b><span>Pending Items</span></div>'+
      '<div class="m-kpi o"><b>'+rep+'</b><span>Repeated Units</span></div>'+
      '<div class="m-kpi s"><b>'+DATA.length+'</b><span>Branches with Issues</span></div>';
    el('rows').innerHTML=DATA.map(function(b,i){
      return '<tr><td class="l">'+h(b.branchName)+'</td><td class="pend">'+b.summary.pendingUnits+'</td><td>'+b.summary.pendingItems+'</td><td class="rep">'+b.summary.repeatedUnits+'</td><td class="l"><button class="m-btn m-btn-grey" style="padding:4px 10px;font-size:11px" onclick="showDetail('+i+')">View</button></td></tr>';
    }).join('')||'<tr><td colspan="5" style="padding:14px;color:#94a3b8">No pending SLA equipment issues 🎉</td></tr>';
    el('msg').textContent='Updated '+new Date().toLocaleTimeString();
    el('detail').innerHTML='';
  });
}
function showDetail(i){
  var b=DATA[i];if(!b)return;
  var units=(b.units||[]).filter(function(u){return u.active!==false;});
  var html='<h4 style="color:#fff;margin-bottom:8px">'+h(b.branchName)+' — Pending Issues</h4><div class="tblwrap"><table><thead><tr><th class="l">Client</th><th class="l">Location</th>';
  ITEMS.forEach(function(it){html+='<th>'+h(it.abbr)+'</th>';});
  html+='<th>Next Date</th><th>Shared</th><th>Repeated</th></tr></thead><tbody>';
  units.forEach(function(u){
    var has=false;ITEMS.forEach(function(it){if((u.qty&&u.qty[it.key])>0)has=true;});
    if(has&&!u.sharedWithStores){
      html+='<tr><td class="l">'+h(u.clientName)+'</td><td class="l">'+h(u.location)+'</td>';
      ITEMS.forEach(function(it){var v=(u.qty&&u.qty[it.key])||0;html+='<td'+(v>0?' style="color:#f87171;font-weight:800"':'')+'>'+v+'</td>';});
      html+='<td>'+h(u.nextIssueDate||'—')+'</td><td>'+(u.sharedWithStores?'✓':'✗')+'</td><td class="rep">'+(u.repeated?'Yes':'No')+'</td></tr>';
    }
  });
  el('detail').innerHTML=html+'</tbody></table></div>';
}
misStart();load();
</script>
</body></html>`
