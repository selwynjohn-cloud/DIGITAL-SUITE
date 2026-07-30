import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireMisPageSession } from '../_lib/mis/session.js'
import { MIS_LAYOUT_CSS, MIS_SESSION_JS, MIS_THEME_CSS, misPageWrap } from '../_lib/mis/layout.js'

const MIS_ACTIVE = '/mis-visits'
const MIS_TITLE = 'Patrol & Visit Report'
const ACTIONS = `<button class="m-btn m-btn-gold" onclick="syncNow()">📱 Sync from Mobile App</button><button class="m-btn m-btn-grey" onclick="window.print()">⬇ Download PDF</button><button class="m-btn m-btn-navy" onclick="shareMail()">✉ Share by Email</button>`

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireMisPageSession(req, res)) return
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — Client Visit Report</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:15px}
${MIS_THEME_CSS}
.m-kpi-dark{background:linear-gradient(135deg,#1e3a6e,#2563eb);border:1px solid #3b82f6;border-radius:12px;padding:14px 16px;text-align:center;box-shadow:0 6px 16px rgba(37,99,235,.2)}
.m-kpi-dark:nth-child(2){background:linear-gradient(135deg,#14532d,#16a34a);border-color:#22c55e}
.m-kpi-dark:nth-child(3){background:linear-gradient(135deg,#713f12,#d97706);border-color:#f59e0b}
.m-kpi-dark:nth-child(4){background:linear-gradient(135deg,#581c87,#7c3aed);border-color:#a855f7}
.m-kpi-dark b{color:#fff;font-size:24px;display:block}.m-kpi-dark span{font-size:12px;color:rgba(255,255,255,.85)}
.mtbl td.l,.mtbl th.l{text-align:left}
.cnt{font-weight:800;text-align:center}
.vt{display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:800}
.vt-d{background:rgba(59,130,246,.25);color:#93c5fd}.vt-n{background:rgba(139,92,246,.25);color:#c4b5fd}.vt-t{background:rgba(34,197,94,.25);color:#86efac}
#syncMsg{font-size:13px;color:#94a3b8;margin-left:8px}
${MIS_LAYOUT_CSS}
</style></head>
<body>
${misPageWrap(MIS_ACTIVE, MIS_TITLE, `
<div class="m-wrap" id="app">
  <div class="m-card">
    <div class="hint" style="margin-top:0"><b>Patrolling &amp; duty visits</b> from <b>Agile Mobile (Work360)</b>. Types: <span class="vt vt-d">D</span> Day / Patrol · <span class="vt vt-n">N</span> Night · <span class="vt vt-t">T</span> Training. Target: <b>5 day-visits</b> per operations staff. For <b>Late Start</b> and <b>Left Post</b> see <a href="/mis-duty" style="color:#fde68a">Patrol &amp; Duty Exceptions</a>.</div>
    <div style="display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap;margin-top:10px">
      <div><label class="m-lbl">Visit Date</label><input class="m-inp" id="date" type="date"></div>
      <button class="m-btn m-btn-gold" onclick="load()">Show</button>
      <span id="syncMsg"></span>
      <div class="hint" style="margin:0" id="dateHint"></div>
    </div>
  </div>
  <div class="m-kgrid" id="kpis"></div>
  <div class="m-card">
    <h4>Operations Staff — Visit Analysis <span class="hint" style="display:inline">(D / N / T breakdown)</span></h4>
    <div class="mtblwrap"><table class="mtbl"><thead><tr><th class="l">Staff</th><th class="c">Day (D)</th><th class="c">Night (N)</th><th class="c">Training (T)</th><th class="c">Total</th><th class="c">Clients</th><th class="c">5/day?</th></tr></thead><tbody id="byStaff"></tbody></table></div>
  </div>
  <div class="m-card">
    <h4>Client Site Coverage</h4>
    <div class="mtblwrap"><table class="mtbl"><thead><tr><th class="l">Client</th><th class="c">Day</th><th class="c">Night</th><th class="c">Training</th><th class="c">Total</th></tr></thead><tbody id="byClient"></tbody></table></div>
  </div>
  <div class="m-card">
    <h4>All Visits — Detail</h4>
    <input class="m-inp" id="search" placeholder="Search staff / client / place" oninput="renderAll()" style="width:100%;max-width:360px;margin-bottom:10px">
    <div class="mtblwrap"><table class="mtbl"><thead><tr><th class="c">#</th><th class="c">Type</th><th class="l">Staff</th><th class="l">Client</th><th class="l">Unit</th><th class="c">Time</th><th class="l">Place</th><th class="l">Person Met</th><th class="l">Remarks</th></tr></thead><tbody id="all"></tbody></table></div>
  </div>
</div>
`, ACTIONS)}
<script>
${MIS_SESSION_JS}
VIS=[],ANALYSIS=null,SYNC=null;
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function api(action,extra){return fetch('/api/mis/admin-data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action},extra||{}))}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});}
(function(){el('date').value=new Date().toISOString().slice(0,10);})();
function vtBadge(t){t=(t||'D').toUpperCase();var cls=t==='N'?'vt-n':(t==='T'?'vt-t':'vt-d');return '<span class="vt '+cls+'">'+t+'</span>';}
function load(){api('visits',{date:el('date').value,autoSync:false}).then(function(res){if(res.status===200)render(res.body);});}
function syncNow(){el('syncMsg').textContent='Syncing visits (a few seconds)…';api('syncVisits',{date:el('date').value}).then(function(res){if(res.status===200){render(res.body);el('syncMsg').textContent=res.body.sync&&res.body.sync.saved?'✓ '+res.body.sync.saved+' visits synced':(res.body.sync&&res.body.sync.error?res.body.sync.error:'Done');}else el('syncMsg').textContent=res.body.error||'Sync failed';});}
function render(data){
  VIS=data.visits||[];ANALYSIS=data.analysis||null;SYNC=data.sync||null;
  var hint='';
  if(SYNC&&SYNC.saved)hint='Mobile sync: '+SYNC.saved+' visits · ';
  if(data.dates&&data.dates.length)hint+='Dates with data: '+data.dates.slice(-5).join(', ');
  else hint+='No visits for this date — pick a day staff visited sites, then tap Sync.';
  el('dateHint').textContent=hint;
  var a=ANALYSIS||{staffRows:[],clientRows:[],metFiveTarget:0,staffCount:0};
  el('kpis').innerHTML=
    '<div class="m-kpi-dark"><b>'+VIS.length+'</b><span>Total Visits</span></div>'+
    '<div class="m-kpi-dark"><b>'+a.staffCount+'</b><span>Ops Staff Active</span></div>'+
    '<div class="m-kpi-dark"><b>'+(a.clientRows?a.clientRows.length:0)+'</b><span>Clients Visited</span></div>'+
    '<div class="m-kpi-dark"><b>'+a.metFiveTarget+'/'+a.staffCount+'</b><span>Met 5 Day-Visits</span></div>';
  var tb=el('byStaff');tb.innerHTML='';
  (a.staffRows||[]).forEach(function(s){
    var tr=document.createElement('tr');
    tr.innerHTML='<td class="l">'+h(s.name)+'</td><td class="c">'+s.day+'</td><td class="c">'+s.night+'</td><td class="c">'+s.training+'</td><td class="c"><b>'+s.total+'</b></td><td class="c">'+s.clients+'</td><td class="c"><span class="'+(s.metTarget?'sc-bg-good':'sc-bg-poor')+'">'+(s.metTarget?'Yes':'No')+'</span></td>';
    tb.appendChild(tr);
  });
  if(!a.staffRows||!a.staffRows.length)tb.innerHTML='<tr><td colspan="7" class="hint">No visits on this date.</td></tr>';
  var tc=el('byClient');tc.innerHTML='';
  (a.clientRows||[]).slice(0,50).forEach(function(c){
    var tr=document.createElement('tr');
    tr.innerHTML='<td class="l">'+h(c.client)+'</td><td class="c">'+c.D+'</td><td class="c">'+c.N+'</td><td class="c">'+c.T+'</td><td class="c"><b>'+c.total+'</b></td>';
    tc.appendChild(tr);
  });
  if(!a.clientRows||!a.clientRows.length)tc.innerHTML='<tr><td colspan="5" class="hint">No client visits.</td></tr>';
  renderAll();
}
function renderAll(){var q=(el('search').value||'').toLowerCase();var tb=el('all');tb.innerHTML='';var n=0;
  VIS.forEach(function(v){var hay=(v.user+' '+v.client+' '+v.unit+' '+v.place).toLowerCase();if(q&&hay.indexOf(q)<0)return;n++;var tr=document.createElement('tr');
    tr.innerHTML='<td class="c">'+n+'</td><td class="c">'+vtBadge(v.visitType)+'</td><td class="l">'+h(v.user)+'</td><td class="l">'+h(v.client)+'</td><td class="l">'+h(v.unit)+'</td><td class="c">'+h(v.visitTime)+'</td><td class="l">'+h(v.place)+'</td><td class="l">'+h(v.personMet)+'</td><td class="l">'+h(v.remarks)+'</td>';
    tb.appendChild(tr);});
  if(!n)tb.innerHTML='<tr><td colspan="9" class="hint">No visits match.</td></tr>';}
function shareMail(){var to=prompt('Share visit report to (email):','director@agilegroup.co.in');if(!to)return;api('sendConsolidatedMail',{date:el('date').value,to:to}).then(function(res){alert(res.status===200?'Email sent ✓':(res.body.error||'Could not send'));});}
misStart();
</script>
</body></html>`
