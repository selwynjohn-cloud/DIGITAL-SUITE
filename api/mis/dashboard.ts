import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireMisPageSession } from '../_lib/mis/session.js'
import { MIS_LAYOUT_CSS, MIS_SESSION_JS, MIS_THEME_CSS, misPageWrap } from '../_lib/mis/layout.js'

const MIS_ACTIVE = '/mis-board'
const MIS_TITLE = 'Consolidated MIS'
const ACTIONS = `<button class="m-btn m-btn-grey" onclick="window.print()">⬇ Download PDF</button><button class="m-btn m-btn-navy" onclick="shareMail()">✉ Share by Email</button>`

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireMisPageSession(req, res)) return
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — Consolidated Dashboard</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:15px}
${MIS_THEME_CSS}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:14px}
.kpi{border-radius:16px;padding:16px 18px;color:#fff;box-shadow:0 8px 20px rgba(0,0,0,.25)}.kpi b{color:#fff;font-size:26px;display:block}.kpi span{font-size:12px;color:rgba(255,255,255,.88)}
.kpi.pu{background:linear-gradient(135deg,#7c3aed,#a855f7)}.kpi.bl{background:linear-gradient(135deg,#1d4ed8,#3b82f6)}.kpi.gr{background:linear-gradient(135deg,#15803d,#22c55e)}.kpi.am{background:linear-gradient(135deg,#b45309,#f59e0b)}.kpi.rd{background:linear-gradient(135deg,#b91c1c,#ef4444)}
.no{background:rgba(239,68,68,.2);color:#f87171;font-weight:800}
.yes{color:#4ade80;font-weight:800}
.vac{color:#fbbf24;font-weight:800}.hl{background:rgba(201,168,76,.1)}
#app .mtblwrap{border:2px solid #64748b;border-radius:10px;background:#0b1220;overflow-x:auto}
#app .mtbl{width:100%;border-collapse:collapse;table-layout:fixed;font-size:13px;min-width:1280px}
#app .mtbl th,#app .mtbl td{border:1px solid #64748b!important;padding:0 6px;vertical-align:middle;line-height:1.25}
#app .mtbl tbody tr,#app .mtbl tfoot tr{height:44px}
#app .mtbl tbody td,#app .mtbl tfoot td{height:44px;max-height:44px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
#app .mtbl th{background:#14224f;color:#c9a84c;border-bottom:2px solid #c9a84c!important;font-size:11px;text-align:center;white-space:normal;height:52px;padding:6px}
#app .mtbl th.br,#app .mtbl td.br{text-align:left;width:240px;min-width:240px;max-width:240px;white-space:normal;overflow:visible;text-overflow:clip;word-wrap:break-word;line-height:1.3;padding:6px 10px;height:auto;max-height:none}
#app .mtbl tbody tr:has(td.br){height:auto;min-height:44px}
#app .mtbl th.rem,#app .mtbl td.rem{text-align:left;min-width:140px}
#app .mtbl td.c{text-align:center}
#app .mtbl td.na{color:#94a3b8;text-align:center}
#app .mtbl tbody tr:nth-child(even) td{background:rgba(15,23,42,.45)}
#app .mtbl tfoot td{border-top:2px solid #c9a84c!important}
.kpi{border:1px solid rgba(255,255,255,.28)}
tfoot td{background:#14224f;color:#c9a84c;font-weight:800}
${MIS_LAYOUT_CSS}
</style></head>
<body>
${misPageWrap(MIS_ACTIVE, MIS_TITLE, `
<div class="m-wrap" id="app">
  <div class="m-card">
    <div style="display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap">
      <div><label class="m-lbl">View</label><select class="m-inp" id="period" onchange="togglePeriod()"><option value="day">Single day</option><option value="week">This week</option><option value="month">Pick month</option></select></div>
      <div><label class="m-lbl">Date</label><input class="m-inp" id="dateFor" type="date"></div>
      <div id="monthWrap" style="display:none"><label class="m-lbl">Month</label><input class="m-inp" id="month" type="month"></div>
      <button class="m-btn m-btn-gold" onclick="load()">Show</button>
      <button class="m-btn m-btn-grey" onclick="csv()">Download CSV</button>
      <span id="loadMsg" style="font-size:13px;color:#94a3b8;margin-left:8px"></span>
    </div>
  </div>
  <div class="cards" id="kpis"></div>
  <div class="m-card">
    <h3 id="title">Consolidated MIS Report</h3>
    <p class="hint">All-branch summary — to be sent to Director and MD Sir</p>
    <div class="mtblwrap"><table class="mtbl">
      <thead><tr>
        <th class="br">Branch</th><th>MIS<br>Received</th><th>Sanctioned</th><th>Absent</th><th>OT</th><th>Deployed</th><th>Vacant</th>
        <th>Collection %</th><th>Medical %</th><th>PVC %</th><th>PSARA %</th><th>Resignation</th><th>Recruitment</th><th>Complaints</th><th class="rem">Remarks</th>
      </tr></thead>
      <tbody id="rows"></tbody>
      <tfoot id="foot"></tfoot>
    </table></div>
  </div>
</div>
`, ACTIONS)}
<script>
${MIS_SESSION_JS}
DATA=null;
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function api(action,extra){return fetch('/api/mis/admin-data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action},extra||{}))}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});}
(function(){el('dateFor').value=misTodayIst();el('month').value=el('dateFor').value.slice(0,7);load();})();
function togglePeriod(){el('monthWrap').style.display=el('period').value==='month'?'block':'none';}
function periodBody(){var p=el('period').value;var body={dateFor:el('dateFor').value,period:p};if(p==='month')body.month=el('month').value||el('dateFor').value.slice(0,7);return body;}
function load(){el('loadMsg').textContent='Loading… please wait';api('reports',periodBody()).then(function(res){el('loadMsg').textContent='';if(res.status===200)render(res.body);else alert(res.body.error||'Could not load consolidated MIS — please try again.');}).catch(function(){alert('Could not load consolidated MIS — check your connection and try again.');});}

function branchT(data,bid){var t=(data.branchTotals||{})[bid]||{san:0,dep:0,abs:0,ot:0,vac:0};t.vac=Math.max(0,(t.abs||0)-(t.ot||0));t.dep=Math.min(t.san||0,Math.max(0,(t.san||0)-t.vac));return t;}
function hrField(s,k,legacy){var v=s[k];if(v==null||v==='')v=s[legacy];return v==null?'':v;}
function pendingCells(){
  return '<td class="na">—</td><td class="na">—</td><td class="na">—</td><td class="na">—</td><td class="na">—</td><td class="na">—</td><td class="na">—</td><td class="na">—</td><td class="na">—</td><td class="na">—</td><td class="na">—</td><td class="na">—</td><td class="na">—</td>';
}
function render(data){
  DATA=data;var title=data.periodLabel||data.dateFor;
  el('title').textContent='Consolidated MIS — '+title;
  var byBranch={};(data.reports||[]).forEach(function(r){byBranch[r.branchId]=r;});
  var pstats=data.periodStats||{};
  var isPeriod=data.period&&data.period!=='day';
  var periodDays=data.periodDays||1;
  var tb=el('rows');tb.innerHTML='';
  var T={san:0,dep:0,abs:0,ot:0,vac:0,comp:0,res:0,rec:0},received=0;
  var branchList=(data.branches||[]).slice().sort(function(a,b){
    var ar=byBranch[a.id]?1:0,br=byBranch[b.id]?1:0;
    if(ar!==br)return br-ar;
    return a.name.localeCompare(b.name);
  });
  branchList.forEach(function(b){
    var r=byBranch[b.id];var tr=document.createElement('tr');
    if(!r){
      tr.innerHTML='<td class="br" style="font-weight:700;color:#fff">'+h(b.name)+'</td><td class="c no">NO</td>'+pendingCells()+'<td class="rem na">Not submitted</td>';
      tb.appendChild(tr);return;
    }
    received++;
    var days=pstats[b.id]?pstats[b.id].daysSubmitted:1;
    var misCell=isPeriod?('<span class="yes">'+days+'/'+periodDays+'</span>'):'<span class="yes">YES</span>';var t=branchT(data,b.id);var s=r.summary||{};
    T.san+=t.san;T.dep+=t.dep;T.abs+=t.abs;T.ot+=t.ot;T.vac+=t.vac;T.comp+=Number(s.complaints)||0;
    T.res+=Number(hrField(s,'resignation','mobileMentionedPct'))||0;
    T.rec+=Number(hrField(s,'recruitment','mobileActualPct'))||0;
    tr.innerHTML='<td class="br" style="font-weight:700;color:#fff" title="'+h(b.name)+'">'+h(b.name)+'</td><td class="c">'+misCell+'</td>'+
      '<td class="c">'+t.san+'</td><td class="c">'+t.abs+'</td><td class="c">'+t.ot+'</td><td class="c">'+t.dep+'</td><td class="c vac hl">'+t.vac+'</td>'+
      '<td class="c hl">'+h(s.collectionPct)+'</td><td class="c hl">'+h(s.medicalFitnessPct)+'</td><td class="c">'+h(s.pvcPct)+'</td><td class="c">'+h(s.psaraPct)+'</td>'+
      '<td class="c hl">'+h(hrField(s,'resignation','mobileMentionedPct'))+'</td><td class="c hl">'+h(hrField(s,'recruitment','mobileActualPct'))+'</td><td class="c">'+h(s.complaints)+'</td><td class="rem" title="'+h(s.remarks)+'">'+h(s.remarks)+'</td>';
    tb.appendChild(tr);
  });
  var total=(data.branches||[]).length;
  T.vac=Math.max(0,T.abs-T.ot);T.dep=Math.min(T.san,Math.max(0,T.san-T.vac));
  el('foot').innerHTML='<tr><td class="br">TOTAL ('+received+'/'+total+' submitted)</td><td class="c"></td><td class="c">'+T.san+'</td><td class="c">'+T.abs+'</td><td class="c">'+T.ot+'</td><td class="c">'+T.dep+'</td><td class="c">'+T.vac+'</td><td class="c na">—</td><td class="c na">—</td><td class="c na">—</td><td class="c na">—</td><td class="c">'+T.res+'</td><td class="c">'+T.rec+'</td><td class="c">'+T.comp+'</td><td class="rem"></td></tr>';
  el('kpis').innerHTML=
    '<div class="kpi pu"><b>'+received+'/'+total+'</b><span>Branches Reported</span></div>'+
    '<div class="kpi bl"><b>'+T.san+'</b><span>Total Sanctioned</span></div>'+
    '<div class="kpi rd"><b>'+T.abs+'</b><span>Total Absent</span></div>'+
    '<div class="kpi am"><b>'+T.ot+'</b><span>Total OT</span></div>'+
    '<div class="kpi gr"><b>'+T.dep+'</b><span>Total Deployed</span></div>'+
    '<div class="kpi am"><b>'+T.vac+'</b><span>Total Vacant</span></div>';
}

function csv(){
  if(!DATA)return;var byBranch={};(DATA.reports||[]).forEach(function(r){byBranch[r.branchId]=r;});
  var rows=[['Branch','MIS Received','Sanctioned','Absent','OT','Deployed','Vacant','Collection %','Medical %','PVC %','PSARA %','Resignation','Recruitment','Complaints','Remarks']];
  (DATA.branches||[]).slice().sort(function(a,b){var ar=byBranch[a.id]?1:0,br=byBranch[b.id]?1:0;if(ar!==br)return br-ar;return a.name.localeCompare(b.name);}).forEach(function(b){var r=byBranch[b.id];if(!r){rows.push([b.name,'NO','','','','','','','','','','','','','Not submitted']);return;}var t=branchT(DATA,b.id);var s=r.summary||{};rows.push([b.name,'YES',t.san,t.abs,t.ot,t.dep,t.vac,s.collectionPct,s.medicalFitnessPct,s.pvcPct,s.psaraPct,s.resignation||s.mobileMentionedPct,s.recruitment||s.mobileActualPct,s.complaints,s.remarks]);});
  var csv=rows.map(function(r){return r.map(function(c){return '"'+String(c==null?'':c).replace(/"/g,'""')+'"';}).join(',');}).join('\\n');
  var blob=new Blob([csv],{type:'text/csv'});var url=URL.createObjectURL(blob);var link=document.createElement('a');link.href=url;link.download='Consolidated-MIS-'+DATA.dateFor+'.csv';link.click();
}
function shareMail(){var to=prompt('Send consolidated MIS to (email):','director@agilegroup.co.in');if(!to)return;api('sendConsolidatedMail',{date:el('dateFor').value,to:to}).then(function(res){alert(res.status===200?'Email sent ✓':(res.body.error||'Could not send'));});}
misStart();
</script>
</body></html>`
