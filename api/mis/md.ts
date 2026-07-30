import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireMisPageSession } from '../_lib/mis/session.js'
import { MIS_LAYOUT_CSS, MIS_SESSION_JS, MIS_THEME_CSS, misPageWrap } from '../_lib/mis/layout.js'

const MIS_ACTIVE = '/mis-md'
const MIS_TITLE = 'MD Sir Report'
const ACTIONS = `<button class="m-btn m-btn-grey" onclick="window.print()">⬇ Download PDF</button><button class="m-btn m-btn-navy" onclick="shareMail()">✉ Share by Email</button><button class="m-btn m-btn-gold" onclick="sendMd()">✈ Send to MD Sir</button>`

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireMisPageSession(req, res)) return
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — MD Sir Report</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:15px}
${MIS_THEME_CSS}
.mtbl td.l,.mtbl th.l{text-align:left}
.mtbl tfoot td{background:#14224f;color:#c9a84c;font-weight:800}
${MIS_LAYOUT_CSS}
</style></head>
<body>
${misPageWrap(MIS_ACTIVE, MIS_TITLE, `
<div class="m-wrap" id="app">
  <div class="m-card noprint" style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
    <div><label class="m-lbl">Report Date</label><input class="m-inp" id="date" type="date"></div>
    <button class="m-btn m-btn-gold" onclick="load()">Show</button>
  </div>
  <div id="report"></div>
</div>
`, ACTIONS)}
<script>
${MIS_SESSION_JS}

function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function api(action,extra){return fetch('/api/mis/admin-data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action},extra||{}))}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});}
function pct(a,b){return b>0?Math.round(a*100/b):0;}
function sc(v){return v>=80?'sc-good':(v>=60?'sc-fair':'sc-poor');}
function scBg(v){return v>=80?'sc-bg-good':(v>=60?'sc-bg-fair':'sc-bg-poor');}
var _mdData=null;
(function(){el('date').value=misTodayIst();})();
function load(){api('mdsummary',{date:el('date').value}).then(function(res){if(res.status===200){_mdData=res.body;render(res.body);}});}

function vacantTableHtml(d,branchFilter){
  var rows='';
  if(!branchFilter){
    (d.vacantGrouped||[]).slice(0,15).forEach(function(v,i){
      rows+='<tr><td class="c"><span class="m-rank m-rank-'+(i<3?(i+1):'n')+'">'+(i+1)+'</span></td><td class="l">'+h(v.client)+'</td><td class="l">'+h(v.branches)+'</td><td class="l">'+h(v.locations||'—')+'</td><td class="c">'+v.san+'</td><td class="c">'+(v.abs||0)+'</td><td class="c">'+(v.ot||0)+'</td><td class="c">'+v.dep+'</td><td class="c sc-poor">'+v.vac+'</td><td class="c"><span class="'+scBg(v.fill)+'">'+v.fill+'%</span></td></tr>';
    });
    if(!(d.vacantGrouped||[]).length)rows+='<tr><td colspan="10" class="m-pending">No vacant posts reported.</td></tr>';
    return {head:'<tr><th class="c">#</th><th class="l">Client</th><th class="l">Branches</th><th class="l">Locations</th><th class="c">San.</th><th class="c">Abs.</th><th class="c">OT</th><th class="c">Dep.</th><th class="c">Vacant</th><th class="c">Fill %</th></tr>',body:rows};
  }
  var list=(d.vacantRows||[]).filter(function(v){return v.branch===branchFilter;}).sort(function(a,b){return b.vac-a.vac;}).slice(0,15);
  list.forEach(function(v,i){
    rows+='<tr><td class="c"><span class="m-rank m-rank-'+(i<3?(i+1):'n')+'">'+(i+1)+'</span></td><td class="l">'+h(v.client)+'</td><td class="l">'+h(v.unit||'—')+'</td><td class="c">'+v.san+'</td><td class="c">'+(v.abs||0)+'</td><td class="c">'+(v.ot||0)+'</td><td class="c">'+v.dep+'</td><td class="c sc-poor">'+v.vac+'</td><td class="c"><span class="'+scBg(v.fill)+'">'+v.fill+'%</span></td></tr>';
  });
  if(!list.length)rows+='<tr><td colspan="9" class="m-pending">No vacant posts for this branch.</td></tr>';
  return {head:'<tr><th class="c">#</th><th class="l">Client</th><th class="l">Location</th><th class="c">San.</th><th class="c">Abs.</th><th class="c">OT</th><th class="c">Dep.</th><th class="c">Vacant</th><th class="c">Fill %</th></tr>',body:rows};
}
function vacBranchChange(){
  if(!_mdData)return;
  var sel=el('vacBranch');var branch=sel?sel.value:'';
  var tbl=vacantTableHtml(_mdData,branch);
  var head=el('vacHead');var body=el('vacBody');
  if(head)head.innerHTML=tbl.head;
  if(body)body.innerHTML=tbl.body;
}

function render(d){
  _mdData=d;
  var t=d.totals;var depPct=pct(t.dep,t.san);var ct=d.complianceTotals;
  var strength=ct.strength||ct.total||t.san||0;
  var html='';
  html+='<div class="m-hdr"><b>Agile Security Force Pvt. Ltd. — Daily Operations Report</b><div class="badges">'+d.date+' &nbsp;·&nbsp; '+d.branchCount+' Branches &nbsp;·&nbsp; 30,000+ Staff &nbsp;·&nbsp; 14 States<br>Overall Deployment <b style="color:#c9a84c">'+depPct+'%</b> &nbsp;·&nbsp; <span style="color:'+(d.submitted<d.branchCount?'#f87171':'#4ade80')+'">'+d.submitted+'/'+d.branchCount+' submitted</span></div></div>';

  html+='<div class="m-card"><h4>1. Deployment</h4><div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">'+kb(t.san,'Sanctioned')+kb(t.abs,'Absent','#fbbf24')+kb(t.ot,'OT','#a78bfa')+kb(t.dep,'Deployed','#4ade80')+kb(t.vac,'Vacant','#f87171')+kb(depPct+'%','Deploy %','#4ade80')+kb(t.resignation||0,'Resignation','#f87171')+kb(t.recruitment||0,'Recruitment','#a78bfa')+'</div>';
  html+='<div class="mtblwrap"><table class="mtbl"><thead><tr><th class="l">Branch</th><th class="c">MIS</th><th class="c">Sanctioned</th><th class="c">Absent</th><th class="c">OT</th><th class="c">Deployed</th><th class="c">Vacant</th><th class="c">Deploy %</th><th class="c">Resignation</th><th class="c">Recruitment</th></tr></thead><tbody>';
  d.deployment.forEach(function(b){var dp=pct(b.dep,b.san);html+='<tr><td class="l">'+h(b.branch)+'</td><td class="c">'+(b.submitted?'<span class="sc-good">✓</span>':'<span class="sc-poor">✗</span>')+'</td><td class="c">'+(b.submitted?b.san:'—')+'</td><td class="c">'+(b.submitted?b.abs:'—')+'</td><td class="c">'+(b.submitted?b.ot:'—')+'</td><td class="c">'+(b.submitted?b.dep:'—')+'</td><td class="c '+(b.vac>0?'sc-poor':'')+'">'+(b.submitted?b.vac:'—')+'</td><td class="c">'+(b.submitted?('<span class="'+scBg(dp)+'">'+dp+'%</span>'):'—')+'</td><td class="c">'+(b.submitted?(b.resignation||0):'—')+'</td><td class="c">'+(b.submitted?(b.recruitment||0):'—')+'</td></tr>';});
  html+='</tbody><tfoot><tr><td class="l">TOTAL</td><td></td><td class="c">'+t.san+'</td><td class="c">'+t.abs+'</td><td class="c">'+t.ot+'</td><td class="c">'+t.dep+'</td><td class="c">'+t.vac+'</td><td class="c">'+depPct+'%</td><td class="c">'+(t.resignation||0)+'</td><td class="c">'+(t.recruitment||0)+'</td></tr></tfoot></table></div></div>';

  html+='<div class="m-card"><h4>2. Vacant Posts (worst first)</h4>';
  html+='<div class="noprint" style="margin-bottom:10px"><label class="m-lbl">Branch</label> <select class="m-inp" id="vacBranch" onchange="vacBranchChange()"><option value="">All — same client clubbed</option>';
  (d.vacantBranches||[]).forEach(function(b){html+='<option value="'+h(b)+'">'+h(b)+'</option>';});
  html+='</select></div>';
  var vacTbl=vacantTableHtml(d,'');
  html+='<div class="mtblwrap"><table class="mtbl"><thead id="vacHead">'+vacTbl.head+'</thead><tbody id="vacBody">'+vacTbl.body+'</tbody></table></div></div>';

  var compBy={};d.compliance.forEach(function(c){var den=c.strength||c.total||0;compBy[c.branch]=den?Math.round(c.pvc*100/den):0;});
  html+='<div class="m-card"><h4>3. Branch Performance Index</h4><div class="mtblwrap"><table class="mtbl"><thead><tr><th class="l">Branch</th><th class="c">Deploy %</th><th class="c">Compliance %</th><th class="c">BPI</th></tr></thead><tbody>';
  var bp=d.deployment.filter(function(x){return x.submitted;}).map(function(x){var dp=pct(x.dep,x.san);var cp=compBy[x.branch]||0;return {name:x.branch,dp:dp,cp:cp,bpi:Math.round(dp*0.5+cp*0.5)};});
  bp.sort(function(a,b){return b.bpi-a.bpi;});
  bp.forEach(function(b){html+='<tr><td class="l">'+h(b.name)+'</td><td class="c">'+b.dp+'%</td><td class="c">'+b.cp+'%</td><td class="c"><span class="'+scBg(b.bpi)+'">'+b.bpi+'</span></td></tr>';});
  if(!bp.length)html+='<tr><td colspan="4" class="m-pending">Awaiting submissions.</td></tr>';
  html+='</tbody></table></div></div>';

  html+='<div class="m-card"><h4>4. Complaints</h4><div style="display:flex;gap:10px;flex-wrap:wrap">'+kb(d.complaints.total,'Total')+kb(d.complaints.open,'Open','#f87171')+kb(d.complaints.closed,'Closed','#4ade80')+'</div></div>';
  html+='<div class="m-card"><h4>5. Collections (this week)</h4><div style="display:flex;gap:10px;flex-wrap:wrap">'+kb('₹'+d.collection.budget.toFixed(1)+'L','Budget')+kb('₹'+d.collection.collected.toFixed(1)+'L','Collected','#4ade80')+kb(pct(d.collection.collected,d.collection.budget)+'%','Achievement')+kb('₹'+d.collection.outstanding.toFixed(1)+'L','Outstanding','#fbbf24')+'</div></div>';
  html+='<div class="m-card"><h4>6. Compliance (PVC / Medical / Training)</h4><div style="display:flex;gap:10px;flex-wrap:wrap">'+kb(pct(ct.pvc,strength)+'%','PVC ('+ct.pvc+'/'+strength+')')+kb(pct(ct.medical,strength)+'%','Medical Fit ('+ct.medical+'/'+strength+')')+kb(pct(ct.training,strength)+'%','Training Cert ('+ct.training+'/'+strength+')')+kb(strength,'Total Strength')+'</div></div>';
  html+='<div class="m-card"><h4>7. Client Visits / MOM</h4><div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">'+kb(d.visits.total,'Visits ('+d.date+')')+kb(d.visits.staff,'Ops Staff Active')+'</div>';
  var vs=d.visits.byStaff||{};var keys=Object.keys(vs);
  if(keys.length){html+='<div class="mtblwrap"><table class="mtbl"><thead><tr><th class="l">Operations Staff</th><th class="c">Visits</th><th class="c">vs 5/day</th></tr></thead><tbody>';keys.sort(function(a,b){return vs[b]-vs[a];}).forEach(function(k){html+='<tr><td class="l">'+h(k)+'</td><td class="c">'+vs[k]+'</td><td class="c"><span class="'+(vs[k]>=5?'sc-bg-good':'sc-bg-poor')+'">'+(vs[k]>=5?'✓ OK':'Short')+'</span></td></tr>';});html+='</tbody></table></div>';}
  else html+='<p class="m-pending">No visit data for this date.</p>';
  html+='</div>';

  el('report').innerHTML=html;
}
function kb(v,l,col){return '<div class="m-kb"><b'+(col?' style="color:'+col+'"':'')+'>'+v+'</b><span>'+l+'</span></div>';}
function shareMail(){var to=prompt('Share MD report to (email):','director@agilegroup.co.in');if(!to)return;api('sendMdReportMail',{date:el('date').value,to:to}).then(function(res){alert(res.status===200?'Email sent ✓':(res.body.error||'Could not send'));});}
function sendMd(){if(!confirm('Send this report to MD Sir by email?'))return;api('sendMdReportMail',{date:el('date').value,toMd:true}).then(function(res){alert(res.status===200?'Sent to MD Sir ✓':(res.body.error||'Could not send — set MIS_MD_EMAIL on server'));});}
misStart();
</script>
</body></html>`
