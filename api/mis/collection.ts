import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireMisPageSession } from '../_lib/mis/session.js'
import { MIS_LAYOUT_CSS, MIS_SESSION_JS, misPageWrap } from '../_lib/mis/layout.js'

const MIS_ACTIVE = '/mis-collection'
const MIS_TITLE = 'Collection (DSO)'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireMisPageSession(req, res)) return
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — Collection Monitor (DSO)</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:#0b1220;color:#e2e8f0;font-size:15px}
.top{background:#14224f;color:#fff;padding:16px;display:flex;align-items:center;gap:12px;border-bottom:4px solid #c9a84c;flex-wrap:wrap;justify-content:space-between}
.top img{height:40px}.top h1{font-size:19px}
.wrap{max-width:1250px;margin:0 auto;padding:16px}
.card{background:#111a30;border:1px solid #22304f;border-radius:12px;padding:18px;margin-bottom:16px}
.btn{padding:11px 18px;border:none;border-radius:8px;font-weight:800;cursor:pointer;font-size:15px;text-decoration:none;display:inline-block}
.g{background:#c9a84c;color:#14224f}.grey{background:#334155;color:#e2e8f0}
label{display:block;font-size:13px;font-weight:700;color:#94a3b8;margin:8px 0 3px}
input{padding:9px 10px;border:1px solid #334155;border-radius:7px;font-size:15px;background:#0b1220;color:#e2e8f0}
#login{max-width:360px;margin:60px auto}.hidden{display:none}
.msg{padding:10px 13px;border-radius:8px;font-size:14px;font-weight:600;margin:10px 0;display:none}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:14px}
.kpi{border-radius:12px;padding:16px 18px;border:1px solid #22304f;background:#111a30}.kpi b{font-size:26px;display:block;color:#fff}.kpi span{font-size:12px;color:#94a3b8}
.kpi.gold{border-left:5px solid #c9a84c}.kpi.red{border-left:5px solid #dc2626}.kpi.amber{border-left:5px solid #d97706}.kpi.green{border-left:5px solid #16a34a}
.mile{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}
.mile>div{background:#0b1220;border:1px solid #22304f;border-radius:10px;padding:12px;text-align:center}.mile b{color:#c9a84c;font-size:16px;display:block}.mile small{color:#94a3b8}
.tblwrap{overflow-x:auto;border:1px solid #22304f;border-radius:8px}table{border-collapse:collapse;width:100%;font-size:13px;min-width:1000px}
th,td{border:1px solid #22304f;padding:7px;text-align:center}th{background:#0b1220;color:#94a3b8;font-size:11px;text-transform:uppercase;position:sticky;top:0}
td.br{text-align:left;font-weight:700;color:#fff;white-space:nowrap}
td input{width:64px;background:#0b1220;border:1px solid #334155;color:#e2e8f0;border-radius:6px;padding:5px;text-align:center;font-size:13px}
.dso-g{color:#22c55e;font-weight:800}.dso-a{color:#f59e0b;font-weight:800}.dso-r{color:#ef4444;font-weight:800}
.pill{padding:2px 8px;border-radius:999px;font-size:11px;font-weight:800}.pg{background:#052e16;color:#22c55e}.pa{background:#3a2606;color:#f59e0b}.pr{background:#3a0a0a;color:#ef4444}.pn{background:#1e293b;color:#94a3b8}
tfoot td{background:#14224f;color:#c9a84c;font-weight:800}
.tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.tab{padding:11px 20px;border-radius:9px;border:1px solid #334155;background:#0e1730;color:#cbd5e1;font-weight:800;cursor:pointer}
.tab.active{background:#c9a84c;color:#14224f;border-color:#c9a84c}
.bar-row{display:flex;align-items:center;gap:10px;margin:6px 0;font-size:13px}
.bar-row .lbl{min-width:120px;color:#94a3b8}
.bar-row .track{flex:1;height:12px;background:#22304f;border-radius:6px;overflow:hidden}
.bar-row .track i{display:block;height:100%;border-radius:6px}
.rank-bad{color:#f87171;font-weight:800}.rank-good{color:#4ade80;font-weight:800}
${MIS_LAYOUT_CSS}
</style></head>
<body>
${misPageWrap(MIS_ACTIVE, MIS_TITLE, `
<div class="top"><div style="display:flex;align-items:center;gap:12px"><img src="https://www.agilegroup-digital.co.in/agile-logo.png"><h1>Collection Monitor — DSO Tracker</h1></div><a class="btn grey" href="/mis-board" target="_blank" style="text-decoration:none">📊 Consolidated MIS</a></div>

<div id="app"><div class="wrap">
  <div class="tabs">
    <button class="tab active" id="tabEntry" onclick="showTab('entry')">📝 Weekly Entry</button>
    <button class="tab" id="tabAnalysis" onclick="showTab('analysis')">📊 Collection Analysis</button>
  </div>
  <div id="paneEntry">
  <div class="card">
    <div style="display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap">
      <div><label>Week Starting (Monday)</label><input id="week" type="date" onchange="load()"></div>
      <button class="btn g" onclick="save()">💾 Save Weekly Collection</button>
      <div id="rangeHint" style="font-size:13px;color:#94a3b8"></div>
    </div>
    <div style="font-size:12px;color:#64748b;margin-top:8px">All amounts in ₹ Lakhs (two decimals). Type lakhs or full ₹ — long numbers auto-convert. DSO = (Outstanding ÷ Monthly Billing) × 30 · Green ≤30 · Amber 31–45 · Red &gt;45</div>
  </div>
  <div class="cards" id="kpis"></div>
  <div class="card">
    <div style="font-weight:800;color:#fff;margin-bottom:6px">Monthly Collection Milestone</div>
    <div class="mile">
      <div><b>15th</b><small>50%</small></div><div><b>20th</b><small>75%</small></div><div><b>30th</b><small>80%</small></div><div><b>5th (next)</b><small>100%</small></div>
    </div>
  </div>
  <div class="card">
    <div style="font-weight:800;color:#fff;margin-bottom:6px">Saturday Upload — after 3 PM</div>
    <div class="hint" style="font-size:12px;color:#94a3b8;margin-bottom:12px">Every <b>Saturday after 3 PM</b>, upload two files from your finance team:<br>
      ① <b>CC BEFORE [date].xlsx</b> — weekly budget + Mon–Sat collected + branch overdue total<br>
      ② <b>OST BILLS [date].xls</b> — outstanding statement (updates branch overdue + June billing)</div>
    <div style="margin-bottom:14px">
      <label style="display:block;font-size:13px;color:#cbd5e1;margin-bottom:6px">① Collection Commitment (CC BEFORE xlsx)</label>
      <input id="ccFile" type="file" accept=".xlsx,.xls" style="color:#e2e8f0;font-size:13px">
      <button class="btn g" style="margin-top:8px" onclick="uploadCc()">📤 Upload CC File</button>
    </div>
    <div style="margin-bottom:14px">
      <label style="display:block;font-size:13px;color:#cbd5e1;margin-bottom:6px">② Outstanding Statement (OST BILLS xls)</label>
      <input id="ostFile" type="file" accept=".xlsx,.xls" style="color:#e2e8f0;font-size:13px">
      <button class="btn g" style="margin-top:8px" onclick="uploadOst()">📤 Upload OST BILLS</button>
    </div>
    <div id="bulkMsg" style="font-size:13px;color:#94a3b8;margin-top:8px"></div>
  </div>
  <div class="card">
    <div style="font-weight:800;color:#fff;margin-bottom:10px">Branch-wise DSO &amp; Collection Performance</div>
    <div class="tblwrap"><table>
      <thead><tr><th class="br" style="text-align:left">Branch</th><th>Monthly Billing</th><th>Budget</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th><th>Total</th><th>Achv %</th><th>Outstanding</th><th>DSO</th><th>Status</th></tr></thead>
      <tbody id="rows"></tbody>
      <tfoot id="foot"></tfoot>
    </table></div>
  </div>
  </div>
  <div id="paneAnalysis" class="hidden">
    <div class="card">
      <div style="display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap">
        <div><label>Week (Monday)</label><input id="weekA" type="date" onchange="loadAnalysis()"></div>
        <button class="btn g" onclick="loadAnalysis()">Refresh Analysis</button>
      </div>
    </div>
    <div class="cards" id="aKpis"></div>
    <div class="card">
      <div style="font-weight:800;color:#fff;margin-bottom:8px">Monthly Milestone Progress</div>
      <div id="aMilestone" class="hint"></div>
      <div class="bar-row"><span class="lbl">MTD collected vs billing</span><div class="track"><i id="aMileBar" style="width:0%;background:linear-gradient(90deg,#c9a84c,#22c55e)"></i></div><span id="aMilePct" style="min-width:48px;color:#fde68a;font-weight:800">0%</span></div>
    </div>
    <div class="card">
      <div style="font-weight:800;color:#fff;margin-bottom:8px">DSO Status — All Branches</div>
      <div id="aDsoBands" style="display:flex;gap:12px;flex-wrap:wrap"></div>
    </div>
    <div class="card">
      <div style="font-weight:800;color:#fff;margin-bottom:10px">Branch Ranking — Weekly Achievement % <span style="color:#94a3b8;font-size:12px">(best first)</span></div>
      <div class="tblwrap"><table>
        <thead><tr><th class="br" style="text-align:left">#</th><th class="br" style="text-align:left">Branch</th><th>Budget</th><th>Collected</th><th>Achv %</th><th>Outstanding</th><th>DSO</th><th>MTD %</th><th>MIS Coll %</th><th>Status</th></tr></thead>
        <tbody id="aRank"></tbody>
      </table></div>
    </div>
    <div class="card">
      <div style="font-weight:800;color:#fff;margin-bottom:10px">Highest Outstanding <span style="color:#ef4444;font-size:12px">(attention needed)</span></div>
      <div class="tblwrap"><table>
        <thead><tr><th class="br" style="text-align:left">Branch</th><th>Outstanding (L)</th><th>Monthly Billing</th><th>DSO</th></tr></thead>
        <tbody id="aWorst"></tbody>
      </table></div>
    </div>
  </div>
</div></div>

`)}
<script>
${MIS_SESSION_JS}
ROWS=[],BRANCHES=[];
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function api(action,extra){return fetch('/api/mis/admin-data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action},extra||{}))}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});}
function monday(d){var x=new Date(d);var day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return x.toISOString().slice(0,10);}
(function(){var w=monday(new Date());el('week').value=w;el('weekA').value=w;})();

function showTab(t){
  el('tabEntry').classList.toggle('active',t==='entry');
  el('tabAnalysis').classList.toggle('active',t==='analysis');
  el('paneEntry').classList.toggle('hidden',t!=='entry');
  el('paneAnalysis').classList.toggle('hidden',t!=='analysis');
  if(t==='analysis')loadAnalysis();
}

function load(){api('loadCollections',{weekStart:el('week').value}).then(function(res){if(res.status===200)init(res.body);});}

function init(data){
  BRANCHES=data.branches||[];
  var byB={};(data.collections||[]).forEach(function(c){byB[c.branchId]=c;});
  ROWS=BRANCHES.map(function(b){var c=byB[b.id]||{};return {branchId:b.id,name:b.name,monthlyBilling:c.monthlyBilling||0,budget:c.budget||0,mon:c.mon||0,tue:c.tue||0,wed:c.wed||0,thu:c.thu||0,fri:c.fri||0,sat:c.sat||0,outstanding:c.outstanding||0};});
  var ws=new Date(el('week').value);var we=new Date(ws);we.setDate(we.getDate()+6);
  el('rangeHint').textContent='Week: '+ws.toDateString().slice(4)+' → '+we.toDateString().slice(4);
  render();
}
function total(r){return (r.mon||0)+(r.tue||0)+(r.wed||0)+(r.thu||0)+(r.fri||0)+(r.sat||0);}
function dso(r){return r.monthlyBilling>0?Math.round((r.outstanding/r.monthlyBilling)*30):0;}
function moneyL(v){var n=normalizeToLacs(v);return n==null?0:n;}
function upd(i,f,v){ROWS[i][f]=moneyL(v);render();}
function render(){
  var tb=el('rows');tb.innerHTML='';var TB=0,TC=0,TO=0,dsos=[];
  ROWS.forEach(function(r,i){
    var tot=total(r);var ach=r.budget>0?Math.round(tot*100/r.budget):0;var ds=dso(r);
    var cls=ds===0?'dso-g':(ds<=30?'dso-g':(ds<=45?'dso-a':'dso-r'));
    var pill=r.monthlyBilling===0&&r.outstanding===0&&tot===0?'<span class="pill pn">No Data</span>':(ds<=30?'<span class="pill pg">Green</span>':(ds<=45?'<span class="pill pa">Amber</span>':'<span class="pill pr">Red</span>'));
    function ic(f){return '<input type="number" step="0.01" title="₹ Lakhs — long ₹ auto-converts" value="'+(Number(r[f]||0).toFixed(2))+'" oninput="upd('+i+',\\''+f+'\\',this.value)">';}
    TB+=r.budget;TC+=tot;TO+=r.outstanding;if(r.monthlyBilling>0)dsos.push(ds);
    var tr=document.createElement('tr');
    tr.innerHTML='<td class="br">'+h(r.name)+'</td><td>'+ic('monthlyBilling')+'</td><td>'+ic('budget')+'</td><td>'+ic('mon')+'</td><td>'+ic('tue')+'</td><td>'+ic('wed')+'</td><td>'+ic('thu')+'</td><td>'+ic('fri')+'</td><td>'+ic('sat')+'</td><td style="font-weight:800;color:#fff">'+fmtInrLacs(tot)+'</td><td>'+ach+'%</td><td>'+ic('outstanding')+'</td><td class="'+cls+'">'+(r.monthlyBilling>0?ds:'—')+'</td><td>'+pill+'</td>';
    tb.appendChild(tr);
  });
  var achAll=TB>0?Math.round(TC*100/TB):0;var avgDso=dsos.length?Math.round(dsos.reduce(function(a,b){return a+b;},0)/dsos.length):0;
  el('foot').innerHTML='<tr><td style="text-align:left">TOTAL</td><td>—</td><td>'+fmtInrLacs(TB)+'</td><td colspan="6"></td><td>'+fmtInrLacs(TC)+'</td><td>'+achAll+'%</td><td>'+fmtInrLacs(TO)+'</td><td colspan="2"></td></tr>';
  el('kpis').innerHTML=
    '<div class="kpi gold"><b>'+fmtInrLacs(TB)+'</b><span>Total Budget</span></div>'+
    '<div class="kpi red"><b>'+fmtInrLacs(TC)+'</b><span>Collected ('+achAll+'% of budget)</span></div>'+
    '<div class="kpi amber"><b>'+fmtInrLacs(TO)+'</b><span>Total Outstanding</span></div>'+
    '<div class="kpi green"><b>'+(avgDso||'—')+'</b><span>Average DSO (target 30)</span></div>';
}
function save(){var m=el('loginMsg');var payload=ROWS.filter(function(r){return r.monthlyBilling||r.budget||total(r)||r.outstanding;});
  api('saveCollections',{weekStart:el('week').value,collections:payload}).then(function(res){alert(res.status===200?'Saved weekly collection ✓':(res.body.error||'Could not save'));});}
function readFileB64(inputId,cb){
  var f=el(inputId).files&&el(inputId).files[0];
  if(!f){alert('Please choose a file first.');return;}
  var r=new FileReader();
  r.onload=function(){cb(f.name,r.result);};
  r.readAsDataURL(f);
}
function uploadCc(){
  readFileB64('ccFile',function(name,data){
    api('importCollectionSheet',{weekStart:el('week').value,fileName:name,data:data}).then(function(res){
      if(res.status!==200){alert(res.body.error||'CC upload failed');return;}
      el('bulkMsg').textContent='✅ CC file: updated '+res.body.updated+' branch(es).'+(res.body.unmatched&&res.body.unmatched.length?' Not matched: '+res.body.unmatched.join(', '):'');
      load();
    });
  });
}
function uploadOst(){
  readFileB64('ostFile',function(name,data){
    api('importOutstandingFile',{weekStart:el('week').value,fileName:name,data:data}).then(function(res){
      if(res.status!==200){alert(res.body.error||'OST upload failed');return;}
      el('bulkMsg').textContent='✅ OST BILLS: updated '+res.body.updated+' branch(es).'+(res.body.unmatched&&res.body.unmatched.length?' Not matched: '+res.body.unmatched.join(', '):'');
      load();
    });
  });
}
function loadAnalysis(){
  api('collectionAnalysis',{weekStart:el('weekA').value}).then(function(res){
    if(res.status!==200)return;
    var d=res.body,t=d.totals||{},m=d.milestone||{},b=d.dsoBands||{};
    el('aKpis').innerHTML=
      '<div class="kpi gold"><b>'+fmtInrLacs(t.budget||0)+'</b><span>Weekly Budget</span></div>'+
      '<div class="kpi red"><b>'+fmtInrLacs(t.collected||0)+'</b><span>Collected ('+(t.achievement||0)+'%)</span></div>'+
      '<div class="kpi amber"><b>'+fmtInrLacs(t.outstanding||0)+'</b><span>Total Outstanding</span></div>'+
      '<div class="kpi green"><b>'+fmtInrLacs(t.mtd||0)+'</b><span>Month-to-Date Collected</span></div>';
    var ach=m.achievedPct||0,tgt=m.targetPct||0;
    el('aMilestone').textContent=(m.label||'')+' · Achieved '+ach+'% vs target '+tgt+'% · '+(m.onTrack?'✅ On track':'⚠ Below target');
    el('aMileBar').style.width=Math.min(100,ach)+'%';
    el('aMilePct').textContent=ach+'%';
    el('aDsoBands').innerHTML=
      '<div class="kpi green" style="flex:1;min-width:120px"><b>'+(b.green||0)+'</b><span>Green DSO ≤30</span></div>'+
      '<div class="kpi amber" style="flex:1;min-width:120px"><b>'+(b.amber||0)+'</b><span>Amber 31–45</span></div>'+
      '<div class="kpi red" style="flex:1;min-width:120px"><b>'+(b.red||0)+'</b><span>Red &gt;45</span></div>';
    var tb=el('aRank');tb.innerHTML='';
    (d.rows||[]).forEach(function(r,i){
      var pill=r.status==='green'?'<span class="pill pg">Green</span>':(r.status==='amber'?'<span class="pill pa">Amber</span>':(r.status==='red'?'<span class="pill pr">Red</span>':'<span class="pill pn">—</span>'));
      var achCls=r.achievement>=80?'rank-good':(r.achievement>=50?'':'rank-bad');
      var tr=document.createElement('tr');
      tr.innerHTML='<td class="br">'+(i+1)+'</td><td class="br">'+h(r.branch)+'</td><td>'+(r.budget||0).toFixed(1)+'</td><td>'+(r.collected||0).toFixed(1)+'</td><td class="'+achCls+'">'+(r.achievement||0)+'%</td><td>'+(r.outstanding||0).toFixed(1)+'</td><td>'+(r.dso||'—')+'</td><td>'+(r.mtdPct||0)+'%</td><td>'+(r.misCollectionPct!=null?r.misCollectionPct+'%':'—')+'</td><td>'+pill+'</td>';
      tb.appendChild(tr);
    });
    var wb=el('aWorst');wb.innerHTML='';
    (d.worstOutstanding||[]).forEach(function(r){
      var tr=document.createElement('tr');
      tr.innerHTML='<td class="br">'+h(r.branch)+'</td><td class="rank-bad">'+(r.outstanding||0).toFixed(1)+'</td><td>'+(r.billing||0).toFixed(1)+'</td><td>'+(r.dso||'—')+'</td>';
      wb.appendChild(tr);
    });
    if(!(d.worstOutstanding||[]).length)wb.innerHTML='<tr><td colspan="4" style="color:#94a3b8;padding:12px">No outstanding recorded.</td></tr>';
  });
}
misStart();
</script>
</body></html>`
