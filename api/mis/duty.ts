import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireMisPageSession } from '../_lib/mis/session.js'
import { DUTY_CONTACT_CSS, DUTY_CONTACT_JS } from '../_lib/mis/duty-contact.js'
import { MIS_LAYOUT_CSS, MIS_SESSION_JS, MIS_THEME_CSS, misPageWrap } from '../_lib/mis/layout.js'

const MIS_ACTIVE = '/mis-duty'
const MIS_TITLE = 'Late Start & Out of Post'
const ACTIONS = `<button class="m-btn m-btn-gold" onclick="syncNow()">📱 Sync from Mobile App</button>
<button class="m-btn m-btn-green" onclick="shareDutyReport()">✉ Share</button>
<button class="m-btn m-btn-navy" onclick="downloadDutyPdf()">⬇ Download PDF</button>`

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireMisPageSession(req, res)) return
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — Late Start & Out of Post</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:15px}
${MIS_THEME_CSS}
.tag-late{background:rgba(245,158,11,.2);color:#fcd34d;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:800}
.tag-out{background:rgba(239,68,68,.2);color:#fca5a5;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:800}
${DUTY_CONTACT_CSS}
${MIS_LAYOUT_CSS}
</style></head>
<body>
${misPageWrap(MIS_ACTIVE, MIS_TITLE, `
<div class="m-wrap">
  <div class="m-card">
    <div class="hint" style="margin-top:0">Pulled from <b>Agile Mobile (Work360)</b> — late duty and out of location, with the <b>guard mobile</b>. Use <b>Call</b> or <b>WhatsApp Warning</b> from the row. Away Detail shows Left / Not Returned + time away (not kilometres).</div>
    <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;align-items:flex-end">
      <div><label class="m-lbl">Date</label><input class="m-inp" id="date" type="date"></div>
      <div><label class="m-lbl">Branch</label><select class="m-inp" id="branch" style="min-width:240px" onchange="load()"><option value="">All Branches</option></select></div>
      <button class="m-btn m-btn-gold" onclick="load()">Show</button>
      <span id="syncMsg" class="hint" style="margin:0"></span>
    </div>
  </div>
  <div class="m-kgrid" id="kpis"></div>
  <div class="m-card">
    <h4 id="lateTitle">Late Duty</h4>
    <div class="mtblwrap"><table class="mtbl"><thead><tr><th class="l">Guard</th><th class="c">Mobile</th><th class="l">Client</th><th class="l">Site</th><th class="c">Start Time</th><th class="c">Call</th><th class="c">WhatsApp Warning</th><th class="l">Remarks</th></tr></thead><tbody id="lateRows"></tbody></table></div>
  </div>
  <div class="m-card">
    <h4 id="outTitle">Out of Location</h4>
    <div class="mtblwrap"><table class="mtbl"><thead><tr><th class="l">Guard</th><th class="c">Mobile</th><th class="l">Client</th><th class="l">Site</th><th class="c">Left Time</th><th class="c">Away Detail</th><th class="c">Call</th><th class="c">WhatsApp Warning</th><th class="l">Remarks</th></tr></thead><tbody id="outRows"></tbody></table></div>
  </div>
</div>
`, ACTIONS)}
<script>
${MIS_SESSION_JS}
${DUTY_CONTACT_JS}
var BRANCHES=[];
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function a(s){return h(s).replace(/"/g,'&quot;');}
function api(action,extra){return fetch('/api/mis/admin-data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action},extra||{}))}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});}
function selectedBranchId(){return String(el('branch').value||'').trim();}
function fillBranches(list){
  if(!list||!list.length)return;
  BRANCHES=list.slice().sort(function(x,y){return String(x.name||'').localeCompare(String(y.name||''));});
  var cur=selectedBranchId();
  el('branch').innerHTML='<option value="">All Branches</option>'+BRANCHES.map(function(b){return '<option value="'+a(b.id)+'">'+h(b.name)+'</option>';}).join('');
  if(cur)el('branch').value=cur;
}
(function(){el('date').value=new Date().toISOString().slice(0,10);})();
function load(){
  var bid=selectedBranchId();
  api('dutyIncidents',{date:el('date').value,branchId:bid,autoSync:false}).then(function(res){
    if(res.status!==200)return;
    fillBranches(res.body.branches||[]);
    render(res.body);
  });
}
function syncNow(){
  el('syncMsg').textContent='Syncing…';
  var bid=selectedBranchId();
  api('syncDuty',{date:el('date').value,branchId:bid}).then(function(res){
    if(res.status===200){fillBranches(res.body.branches||[]);render(res.body);el('syncMsg').textContent='Done';}
    else el('syncMsg').textContent=res.body.error||'Failed';
  });
}
function shareDutyReport(){
  var to=prompt('Enter client email ID to share this report (Director will be copied):');
  if(to==null)return;to=String(to||'').trim();if(!to||to.indexOf('@')<0){alert('Please enter a valid email ID.');return;}
  api('sendDutyReportMail',{date:el('date').value,branchId:selectedBranchId(),to:to}).then(function(res){
    alert(res.status===200?'✅ Report shared by email (CC: Director).':(res.body.error||'Could not send'));
  });
}
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
    a.href=url;a.download=fileName||'Late-Start-Report.html';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},5000);
    alert('Report downloaded as HTML. Open the file and choose Print → Save as PDF.');
  }catch(e){
    alert('Could not open the report. Please allow pop-ups for this site and try again.');
  }
}
function downloadDutyPdf(){
  api('dutyReportHtml',{date:el('date').value,branchId:selectedBranchId()}).then(function(res){
    if(res.status!==200){alert(res.body.error||'Could not build PDF');return;}
    if(!res.body.html){alert('Report was empty — please try again.');return;}
    openReportHtml(res.body.html,'Late-Start-Out-of-Post.html');
  }).catch(function(){alert('Network error — could not build PDF.');});
}
function render(d){
  var c=d.counts||{late:0,out:0};
  var bid=selectedBranchId();
  var label=bid?(d.branchName||'Branch'):'All Branches';
  el('lateTitle').textContent='Late Duty — '+label;
  el('outTitle').textContent='Out of Location — '+label;
  el('kpis').innerHTML=
    '<div class="m-kpi t"><b>'+c.late+'</b><span>Late Duty Cases</span></div>'+
    '<div class="m-kpi p"><b>'+c.out+'</b><span>Out of Location Cases</span></div>';
  var list=d.incidents||[];
  el('lateRows').innerHTML=dutyLateRowsHtml(list.filter(function(i){return i.type==='late_start';}));
  el('outRows').innerHTML=dutyOutRowsHtml(list.filter(function(i){return i.type==='out_of_post';}));
}
load();
</script>
</body></html>`
