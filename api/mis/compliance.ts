import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireMisPageSession } from '../_lib/mis/session.js'
import { MIS_LAYOUT_CSS, MIS_SESSION_JS, MIS_THEME_CSS, misPageWrap } from '../_lib/mis/layout.js'

const MIS_ACTIVE = '/mis-compliance'
const MIS_TITLE = 'Compliance (PVC/MC)'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireMisPageSession(req, res)) return
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — Guard Compliance</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:#0b1220;color:#e2e8f0;font-size:15px}
.top{background:#14224f;color:#fff;padding:16px;display:flex;align-items:center;gap:12px;border-bottom:4px solid #c9a84c;flex-wrap:wrap;justify-content:space-between}
.top img{height:40px}.top h1{font-size:19px}
.wrap{max-width:1200px;margin:0 auto;padding:16px}
.card{background:#111a30;border:1px solid #22304f;border-radius:12px;padding:18px;margin-bottom:16px}
.btn{padding:11px 18px;border:none;border-radius:8px;font-weight:800;cursor:pointer;font-size:15px;text-decoration:none;display:inline-block}
.g{background:#c9a84c;color:#14224f}.grey{background:#334155;color:#e2e8f0}
label{display:block;font-size:13px;font-weight:700;color:#94a3b8;margin:8px 0 3px}
input,select{padding:9px 10px;border:1px solid #334155;border-radius:7px;font-size:15px;background:#0b1220;color:#e2e8f0}
#login{max-width:360px;margin:60px auto}.hidden{display:none}
.msg{padding:10px 13px;border-radius:8px;font-size:14px;font-weight:600;margin:10px 0;display:none}
.tblwrap{overflow-x:auto;border:1px solid #22304f;border-radius:8px}table{border-collapse:collapse;width:100%;font-size:13px;min-width:700px}
th,td{border:1px solid #22304f;padding:8px;text-align:center;color:#e2e8f0}th{background:#0e1730;color:#c9a84c;font-size:11px;text-transform:uppercase}
td.br{text-align:left;font-weight:700;cursor:pointer;color:#93c5fd}
.bar{height:18px;border-radius:9px;background:#22304f;overflow:hidden;min-width:80px}
.bar>i{display:block;height:100%}
.pct{font-weight:800}.low{color:#f87171}.mid{color:#fbbf24}.hi{color:#4ade80}
.miss{background:rgba(239,68,68,.15);color:#f87171;font-weight:700}.ok{color:#4ade80;font-weight:700}
.gname{font-size:17px;font-weight:900;color:#fff;text-align:left}
.geid{font-size:15px;font-weight:800;color:#fde68a}
.toolbar{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;margin-bottom:14px}
${MIS_THEME_CSS}
${MIS_LAYOUT_CSS}
</style></head>
<body>
${misPageWrap(MIS_ACTIVE, MIS_TITLE, `
<div class="top"><div style="display:flex;align-items:center;gap:12px"><img src="https://www.agilegroup-digital.co.in/agile-logo.png"><h1>Agile MIS — Guard Compliance (PVC / Medical / Training)</h1></div><a class="btn grey" href="/mis-board" target="_blank" style="text-decoration:none">📊 Consolidated MIS</a></div>

<div id="app"><div class="wrap">
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px">
      <h3 style="color:#fff;margin:0">Branch-wise Compliance Summary</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn g" type="button" onclick="shareCompliance()">✉ Share</button>
        <button class="btn grey" type="button" onclick="downloadCompliancePdf()">⬇ Download PDF</button>
      </div>
    </div>
    <div class="toolbar">
      <div><label>Branch</label><select id="branch" style="min-width:260px" onchange="onBranchChange()"><option value="">All Branches</option></select></div>
      <button class="btn grey" type="button" onclick="loadSummary()">Show</button>
    </div>
    <div class="tblwrap"><table>
      <thead><tr><th style="text-align:left">Branch</th><th>Guards</th><th>PVC</th><th>PVC %</th><th>Medical Fit</th><th>Med %</th><th>Training Cert</th><th>Trn %</th></tr></thead>
      <tbody id="sum"></tbody>
    </table></div>
    <div style="font-size:13px;color:#94a3b8;margin-top:8px">Choose <b>All Branches</b> or a branch name. Tap a branch name in the table for guard-by-guard status. Share / Download uses the selected branch (or all).</div>
  </div>
  <div class="card hidden" id="detailCard">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
      <h3 style="color:#fff" id="detailTitle">Guard Details</h3>
      <input id="search" placeholder="Search name / unit / emp id" oninput="renderDetail()" style="min-width:220px">
    </div>
    <div class="tblwrap" style="margin-top:10px"><table>
      <thead><tr><th>#</th><th style="text-align:left">Guard</th><th>Emp ID</th><th style="text-align:left">Unit</th><th>PVC</th><th>Medical</th><th>Training</th><th style="text-align:left">Remarks</th></tr></thead>
      <tbody id="detail"></tbody>
    </table></div>
  </div>
</div></div>

`)}
<script>
${MIS_SESSION_JS}
DOCS=[];ALL_COMP=[];DETAIL_BRANCH_ID='';
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function a(s){return h(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function api(action,extra){return fetch('/api/mis/admin-data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action},extra||{}))}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});}
function selectedBranchId(){return String(el('branch').value||'').trim();}
function present(v){var s=String(v==null?'':v).trim().toUpperCase();if(!s)return false;if(/PENDING|TO BE COLLECTED|UNDER PROCESS|RENEWAL UNDER|NO CERTIFICATE|NOT APPLIED|EXPIRED|UNFIT|N\/A|^NA$|^NIL$|^NILL$|^-$|^#$|^#N\/A$|^0$/.test(s))return false;if(['VALID','FIT','CERTIFIED','APPLIED','YES','Y','DONE','ACTIVE','OK'].indexOf(s)>=0)return true;if(/^\d{4}[-/.]\d{2}[-/.]\d{2}$/.test(s)||/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(s))return true;return false;}
function pctClass(p){return p>=90?'hi':(p>=70?'mid':'low');}
function pctVal(n,t){if(!t)return 0;return Math.min(100,Math.round(Math.min(n,t)*100/t));}
function bar(n,t){var p=pctVal(n,t);var c=p>=90?'#16a34a':(p>=70?'#d97706':'#dc2626');return '<div class="bar"><i style="width:'+p+'%;background:'+c+'"></i></div>';}
function pc(n,t){var p=pctVal(n,t);return '<span class="pct '+pctClass(p)+'">'+p+'%</span>';}
function cell(v,v2){var ok=present(v)||present(v2);return ok?'<td class="ok">'+h(v||v2||'OK')+'</td>':'<td class="miss">Missing</td>';}
function fillBranchSelect(list){
  var cur=selectedBranchId();
  var opts=(list||[]).slice().sort(function(x,y){return String(x.branch||'').localeCompare(String(y.branch||''));});
  el('branch').innerHTML='<option value="">All Branches</option>'+opts.map(function(r){return '<option value="'+a(r.branchId)+'">'+h(r.branch)+'</option>';}).join('');
  if(cur)el('branch').value=cur;
}
function filteredList(){
  var bid=selectedBranchId();
  if(!bid)return ALL_COMP;
  return ALL_COMP.filter(function(r){return r.branchId===bid;});
}
function renderSummary(){
  var list=filteredList();
  var tb=el('sum');tb.innerHTML='';
  (list||[]).forEach(function(r){
    var den=r.registered||r.strength||r.total||0;
    var tr=document.createElement('tr');
    tr.innerHTML='<td class="br" onclick="showBranch(\\''+a(r.branchId)+'\\',\\''+a(r.branch)+'\\')">'+h(r.branch)+'</td><td>'+den+'</td><td>'+r.pvc+'</td><td>'+pc(r.pvc,den)+' '+bar(r.pvc,den)+'</td><td>'+r.medical+'</td><td>'+pc(r.medical,den)+' '+bar(r.medical,den)+'</td><td>'+r.training+'</td><td>'+pc(r.training,den)+' '+bar(r.training,den)+'</td>';
    tb.appendChild(tr);
  });
  if(!list.length)tb.innerHTML='<tr><td colspan="8" style="padding:14px;color:#94a3b8">No compliance data for this selection.</td></tr>';
}
function showBranch(bid,bname){
  el('branch').value=bid||'';
  DETAIL_BRANCH_ID=bid||'';
  el('detailTitle').textContent=bname+' — Guard Details';
  el('detailCard').classList.remove('hidden');
  renderSummary();
  api('guardDocs',{branchId:bid}).then(function(res){DOCS=res.status===200?(res.body.docs||[]):[];renderDetail();});
}
function onBranchChange(){
  var bid=selectedBranchId();
  DETAIL_BRANCH_ID=bid;
  renderSummary();
  if(!bid){el('detailCard').classList.add('hidden');DOCS=[];return;}
  var row=ALL_COMP.find(function(r){return r.branchId===bid;});
  showBranch(bid,row?row.branch:'Branch');
}
function loadSummary(){
  api('compliance').then(function(res){
    if(res.status!==200)return;
    ALL_COMP=res.body.compliance||[];
    fillBranchSelect(ALL_COMP);
    var bid=selectedBranchId();
    DETAIL_BRANCH_ID=bid;
    renderSummary();
    if(bid){
      var row=ALL_COMP.find(function(r){return r.branchId===bid;});
      showBranch(bid,row?row.branch:'Branch');
    }else{
      el('detailCard').classList.add('hidden');
      DOCS=[];
    }
  });
}
function initPage(){loadSummary();}
function openReportHtml(html,fileName){
  try{
    var blob=new Blob([html],{type:'text/html;charset=utf-8'});
    var url=URL.createObjectURL(blob);
    var w=window.open(url,'_blank');
    if(w){
      setTimeout(function(){try{w.focus();w.print();}catch(e){}},600);
      setTimeout(function(){URL.revokeObjectURL(url);},60000);
      return;
    }
    var a=document.createElement('a');
    a.href=url;a.download=fileName||'PVC-MC-Report.html';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},5000);
    alert('Report downloaded as HTML. Open the file and choose Print → Save as PDF.');
  }catch(e){
    alert('Could not open the report. Please allow pop-ups for this site and try again.');
  }
}
function shareCompliance(){
  var to=prompt('Enter client email ID to share this PVC & MC report (Director will be copied):');
  if(to==null)return;to=String(to||'').trim();if(!to||to.indexOf('@')<0){alert('Please enter a valid email ID.');return;}
  var payload={to:to};var bid=selectedBranchId();if(bid)payload.branchId=bid;
  api('sendComplianceReportMail',payload).then(function(res){
    alert(res.status===200?'✅ Report shared by email (CC: Director).':(res.body.error||'Could not send'));
  });
}
function downloadCompliancePdf(){
  var payload={};var bid=selectedBranchId();if(bid)payload.branchId=bid;
  var btn=document.querySelector('button[onclick="downloadCompliancePdf()"]');
  if(btn){btn.disabled=true;btn.textContent='Preparing PDF…';}
  api('complianceReportHtml',payload).then(function(res){
    if(btn){btn.disabled=false;btn.textContent='⬇ Download PDF';}
    if(res.status!==200){alert(res.body.error||'Could not build PDF');return;}
    if(!res.body.html){alert('Report was empty — please try again.');return;}
    var name='PVC-MC-'+(bid?'Branch':'All-Branches')+'.html';
    openReportHtml(res.body.html,name);
  }).catch(function(){
    if(btn){btn.disabled=false;btn.textContent='⬇ Download PDF';}
    alert('Network error — could not build PDF. Please try again.');
  });
}
function renderDetail(){var q=(el('search').value||'').toLowerCase();var tb=el('detail');tb.innerHTML='';var n=0;
  DOCS.forEach(function(d){if(d.active===false)return;var hay=(d.guardName+' '+d.unitName+' '+d.employeeId).toLowerCase();if(q&&hay.indexOf(q)<0)return;n++;var tr=document.createElement('tr');
    tr.innerHTML='<td>'+n+'</td><td class="gname">'+h(d.guardName)+'</td><td class="geid">'+h(d.employeeId)+'</td><td style="text-align:left">'+h(d.unitName)+'</td>'+cell(d.pvc,d.pvcValidity)+cell(d.medical,d.medicalValidity)+cell(d.training)+'<td style="text-align:left">'+h(d.remarks)+'</td>';
    tb.appendChild(tr);});
  if(!n)tb.innerHTML='<tr><td colspan="8" style="padding:14px;color:#94a3b8">No guards.</td></tr>';}
misStart();
</script>
</body></html>`
