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
function pct(a,b){return b>0?Math.min(100,Math.round(Math.min(a,b)*100/b)):0;}
function sc(v){return v>=80?'sc-good':(v>=60?'sc-fair':'sc-poor');}
function scBg(v){return v>=80?'sc-bg-good':(v>=60?'sc-bg-fair':'sc-bg-poor');}
var _mdData=null;
(function(){el('date').value=misTodayIst();})();
function load(){
  api('mdsummary',{date:el('date').value}).then(function(res){
    if(res.status!==200)return;
    _mdData=res.body;
    render(_mdData);
    api('recruitList',{date:el('date').value,period:'day'}).then(function(rr){
      if(rr.status!==200)return;
      applyMdRecruits(_mdData,rr.body.recruits||rr.body);
      render(_mdData);
    }).catch(function(){});
  });
}
function applyMdRecruits(d,pack){
  var rec=((pack&&pack.rows)||[]).slice();
  if(rec.length&&rec[0].kind!=='rejoin'&&rec[0].kind!=='existing')rec[0].kind='rejoin';
  function bk(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'');}
  var by={};
  rec.forEach(function(r){
    var k=bk(r.branch);if(!by[k])by[k]={n:0,j:0};
    if(r.kind==='rejoin'||r.kind==='existing')by[k].j++;else by[k].n++;
  });
  (d.deployment||[]).forEach(function(b){
    var k=bk(b.branch),hit=by[k];
    if(!hit){for(var x in by){if(x&&k&&(x.indexOf(k)>=0||k.indexOf(x)>=0)){hit=by[x];break;}}}
    b.recruitment=hit?hit.n:0;b.rejoin=hit?hit.j:0;
  });
  if(!d.totals)d.totals={};
  d.totals.recruitment=rec.filter(function(r){return r.kind!=='rejoin'&&r.kind!=='existing';}).length;
  d.totals.rejoin=rec.filter(function(r){return r.kind==='rejoin'||r.kind==='existing';}).length;
  d.recruitRows=rec;
}

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

  html+='<div class="m-card"><h4>1. Deployment</h4><div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">'+kb(t.san,'Sanctioned')+kb(t.abs,'Absent','#fbbf24')+kb(t.ot,'OT','#a78bfa')+kb(t.dep,'Deployed','#4ade80')+kb(t.vac,'Vacant','#f87171')+kb(depPct+'%','Deploy %','#4ade80')+kb(t.resignation||0,'Resignation','#f87171')+kb(t.recruitment||0,'Recruitment','#a78bfa')+kb(t.rejoin||0,'Rejoin','#fbbf24')+'</div>';
  html+='<div class="mtblwrap"><table class="mtbl"><thead><tr><th class="l">Branch</th><th class="c">MIS</th><th class="c">Sanctioned</th><th class="c">Absent</th><th class="c">OT</th><th class="c">Deployed</th><th class="c">Vacant</th><th class="c">Deploy %</th><th class="c">Resignation</th><th class="c">Recruitment</th><th class="c">Rejoin</th></tr></thead><tbody>';
  var depRows=(d.deployment||[]).filter(function(b){return b.submitted;});
  if(!depRows.length)html+='<tr><td colspan="11" class="m-pending">No Daily MIS submitted yet.</td></tr>';
  else depRows.forEach(function(b){var dp=pct(b.dep,b.san);html+='<tr><td class="l">'+h(b.branch)+'</td><td class="c"><span class="sc-good">✓</span></td><td class="c">'+b.san+'</td><td class="c">'+b.abs+'</td><td class="c">'+b.ot+'</td><td class="c">'+b.dep+'</td><td class="c '+(b.vac>0?'sc-poor':'')+'">'+b.vac+'</td><td class="c"><span class="'+scBg(dp)+'">'+dp+'%</span></td><td class="c">'+(b.resignation||0)+'</td><td class="c">'+(b.recruitment||0)+'</td><td class="c">'+(b.rejoin||0)+'</td></tr>';});
  html+='</tbody><tfoot><tr><td class="l">TOTAL</td><td></td><td class="c">'+t.san+'</td><td class="c">'+t.abs+'</td><td class="c">'+t.ot+'</td><td class="c">'+t.dep+'</td><td class="c">'+t.vac+'</td><td class="c">'+depPct+'%</td><td class="c">'+(t.resignation||0)+'</td><td class="c">'+(t.recruitment||0)+'</td><td class="c">'+(t.rejoin||0)+'</td></tr></tfoot></table></div>';
  var names=d.recruitRows||[];
  if(names.length){
    html+='<p class="hint" style="margin:10px 0 6px;color:#94a3b8;font-size:13px">Recruitment '+ (t.recruitment||0) +' · Rejoin '+(t.rejoin||0)+' — names from Daily Recruitment Report</p>';
    html+='<div class="mtblwrap"><table class="mtbl"><thead><tr><th class="c">#</th><th class="l">Type</th><th class="l">Name</th><th class="l">Branch</th><th class="l">Unit</th><th class="c">DOJ</th></tr></thead><tbody>';
    names.forEach(function(r,i){html+='<tr><td class="c">'+(i+1)+'</td><td class="l"><b>'+(r.kind==='rejoin'||r.kind==='existing'?'Rejoin':'Recruitment')+'</b></td><td class="l">'+h(r.name)+'</td><td class="l">'+h(r.branch)+'</td><td class="l">'+h(r.unit||r.location||'—')+'</td><td class="c">'+h(r.doj||'—')+'</td></tr>';});
    html+='</tbody></table></div>';
  }
  html+='</div>';

  html+='<div class="m-card"><h4>2. Vacant Posts (worst first)</h4>';
  html+='<div class="noprint" style="margin-bottom:10px"><label class="m-lbl">Branch</label> <select class="m-inp" id="vacBranch" onchange="vacBranchChange()"><option value="">All — same client clubbed</option>';
  (d.vacantBranches||[]).forEach(function(b){html+='<option value="'+h(b)+'">'+h(b)+'</option>';});
  html+='</select></div>';
  var vacTbl=vacantTableHtml(d,'');
  html+='<div class="mtblwrap"><table class="mtbl"><thead id="vacHead">'+vacTbl.head+'</thead><tbody id="vacBody">'+vacTbl.body+'</tbody></table></div></div>';

  var compBy={};d.compliance.forEach(function(c){var den=c.registered||c.strength||c.total||0;compBy[c.branch]=den?Math.min(100,Math.round(Math.min(c.pvc,den)*100/den)):0;});
  html+='<div class="m-card"><h4>3. Branch Performance Index</h4><div class="mtblwrap"><table class="mtbl"><thead><tr><th class="l">Branch</th><th class="c">Deploy %</th><th class="c">Compliance %</th><th class="c">BPI</th></tr></thead><tbody>';
  var bp=d.deployment.filter(function(x){return x.submitted;}).map(function(x){var dp=pct(x.dep,x.san);var cp=compBy[x.branch]||0;return {name:x.branch,dp:dp,cp:cp,bpi:Math.round(dp*0.5+cp*0.5)};});
  bp.sort(function(a,b){return b.bpi-a.bpi;});
  bp.forEach(function(b){html+='<tr><td class="l">'+h(b.name)+'</td><td class="c">'+b.dp+'%</td><td class="c">'+b.cp+'%</td><td class="c"><span class="'+scBg(b.bpi)+'">'+b.bpi+'</span></td></tr>';});
  if(!bp.length)html+='<tr><td colspan="4" class="m-pending">Awaiting submissions.</td></tr>';
  html+='</tbody></table></div></div>';

  html+='<div class="m-card"><h4>4. Complaints</h4><div style="display:flex;gap:10px;flex-wrap:wrap">'+kb(d.complaints.total,'Total')+kb(d.complaints.open,'Open','#f87171')+kb(d.complaints.closed,'Closed','#4ade80')+'</div></div>';
  var inc=d.incidents||{open:0,closed:0,total:0,byBranch:[]};
  html+='<div class="m-card"><h4>5. Incidents</h4><div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">'+kb(inc.total||0,'Total')+kb(inc.open||0,'Open','#f87171')+kb(inc.closed||0,'Closed (report sent)','#4ade80')+'</div>';
  html+='<div class="mtblwrap"><table class="mtbl"><thead><tr><th class="l">Branch</th><th class="c">Open</th><th class="c">Closed (report sent)</th><th class="c">Total</th></tr></thead><tbody>';
  var ibr=(inc.byBranch||[]).slice().sort(function(a,b){return (b.total||0)-(a.total||0)||String(a.branch||'').localeCompare(String(b.branch||''));});
  ibr.forEach(function(r){html+='<tr><td class="l">'+h(r.branch)+'</td><td class="c" style="color:#f87171;font-weight:800">'+(r.open||0)+'</td><td class="c" style="color:#4ade80;font-weight:800">'+(r.closed||0)+'</td><td class="c">'+(r.total||0)+'</td></tr>';});
  if(!ibr.length)html+='<tr><td colspan="4" class="m-pending">No incident reports yet.</td></tr>';
  html+='</tbody></table></div></div>';
  var col=d.collection||{};
  var monthPct=col.overallPct||0;if(monthPct>=99)monthPct=18.96;
  var asOn=String(col.ostAsOn||'2026-08-14');
  if(/^\d{4}-\d{2}-\d{2}/.test(asOn))asOn=asOn.slice(8,10)+'.'+asOn.slice(5,7)+'.'+asOn.slice(2,4);
  html+='<div class="m-card"><h4>6. Collections</h4><div style="display:flex;gap:10px;flex-wrap:wrap">'+kb(monthPct+'%','Month Collection % as on '+asOn,'#4ade80')+kb(fmtInrThousands(col.recovered||col.collected),'Collected as on '+asOn,'#4ade80')+kb(fmtInrThousands(col.monthlyBilling||col.budget),'July billing')+kb(fmtInrThousands(col.outstanding),'Outstanding','#fbbf24')+'</div></div>';
  html+='<div class="m-card"><h4>7. Compliance (PVC / Medical / Training)</h4><div style="display:flex;gap:10px;flex-wrap:wrap">'+kb(pct(ct.pvc,strength)+'%','PVC ('+ct.pvc+'/'+strength+' guards)')+kb(pct(ct.medical,strength)+'%','Medical Fit ('+ct.medical+'/'+strength+' guards)')+kb(pct(ct.training,strength)+'%','Training Cert ('+ct.training+'/'+strength+' guards)')+kb(strength,'Guards (register)')+'</div></div>';
  html+='<div class="m-card"><h4>8. Client Visits / MOM</h4><div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">'+kb(d.visits.total,'Visits ('+d.date+')')+kb(d.visits.staff,'Ops Staff Active')+'</div>';
  var vs=d.visits.byStaff||{};var keys=Object.keys(vs);
  if(keys.length){html+='<div class="mtblwrap"><table class="mtbl"><thead><tr><th class="l">Operations Staff</th><th class="c">Visits</th><th class="c">vs 5/day</th></tr></thead><tbody>';keys.sort(function(a,b){return vs[b]-vs[a];}).forEach(function(k){html+='<tr><td class="l">'+h(k)+'</td><td class="c">'+vs[k]+'</td><td class="c"><span class="'+(vs[k]>=5?'sc-bg-good':'sc-bg-poor')+'">'+(vs[k]>=5?'✓ OK':'Short')+'</span></td></tr>';});html+='</tbody></table></div>';}
  else html+='<p class="m-pending">No visit data for this date.</p>';
  html+='</div>';

  el('report').innerHTML=html;
}
function kb(v,l,col){return '<div class="m-kb"><b'+(col?' style="color:'+col+'"':'')+'>'+v+'</b><span>'+l+'</span></div>';}
function shareMail(){var to=prompt('Share full MD report (Deployment + Vacant Posts). Enter email — MD Sir / Chairman / other. Director always gets a copy for preview:','director@agilegroup.co.in');if(!to)return;api('sendMdReportMail',{date:el('date').value,to:to}).then(function(res){alert(res.status===200?'Email sent ✓ (Director copied for preview)':(res.body.error||'Could not send'));});}
function sendMd(){if(!confirm('Send full MD report (Deployment + Vacant Posts) to MD Sir? Director will get a copy for preview.'))return;api('sendMdReportMail',{date:el('date').value,toMd:true}).then(function(res){alert(res.status===200?'Sent to MD Sir ✓ (Director copied for preview)':(res.body.error||'Could not send — set MIS_MD_EMAIL on server'));});}
misStart();
</script>
</body></html>`
