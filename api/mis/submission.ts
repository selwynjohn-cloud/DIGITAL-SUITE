import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireMisPageSession } from '../_lib/mis/session.js'
import { MIS_LAYOUT_CSS, MIS_SESSION_JS, MIS_THEME_CSS, misPageWrap } from '../_lib/mis/layout.js'

const MIS_ACTIVE = '/mis-submission'
const MIS_TITLE = 'Daily MIS Submission'
const ACTIONS = `<button class="m-btn m-btn-grey" onclick="window.print()">⬇ Download PDF</button><button class="m-btn m-btn-navy" onclick="shareMail()">✉ Share by Email</button>`

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireMisPageSession(req, res)) return
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — Daily Submission Status</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:15px}
${MIS_THEME_CSS}
.m-branch-list{display:flex;flex-direction:column;gap:8px}
.m-branch-item{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 16px;background:#0e1730;border:1px solid #334155;border-radius:10px}
.m-branch-left{display:flex;align-items:flex-start;gap:12px;min-width:0;flex:1}
.m-branch-dot{width:11px;height:11px;border-radius:50%;flex-shrink:0;margin-top:5px}
.m-branch-dot.ok{background:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.25)}
.m-branch-dot.no{background:#ef4444;box-shadow:0 0 0 3px rgba(239,68,68,.25)}
.m-branch-dot.warn{background:#f59e0b;box-shadow:0 0 0 3px rgba(245,158,11,.25)}
.m-branch-name{color:#f8fafc;font-size:16px;font-weight:700;line-height:1.35;display:block}
.m-branch-meta{color:#cbd5e1;font-size:13px;margin-top:4px;line-height:1.4}
.m-branch-meta.warn{color:#fbbf24}
.m-branch-meta.rem{color:#c9a84c}
.m-branch-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;flex-shrink:0}
${MIS_LAYOUT_CSS}
</style></head>
<body>
${misPageWrap(MIS_ACTIVE, MIS_TITLE, `
<div class="m-wrap" id="app">
  <div class="m-card">
    <p class="hint" style="margin-top:0">Auto reminders: <b style="color:#c9a84c">11:00 AM</b> and <b style="color:#c9a84c">2:00 PM</b> to HOD + branch staff (not submitted) — submit before <b>4:00 PM</b>. Director gets pending summary at 11 AM &amp; 2 PM. <b>5:00 PM</b> full consolidated dashboard to Director only. Non-submission by 4 PM = zero performance.</p>
    <div style="display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap;margin-top:12px">
      <div><label class="m-lbl">Date</label><input class="m-inp" id="date" type="date"></div>
      <button class="m-btn m-btn-gold" onclick="load()">Show</button>
      <button class="m-btn m-btn-navy" onclick="remindAll()">🔔 Send All Reminders (<span id="pendCount">0</span>)</button>
    </div>
  </div>
  <div class="m-kgrid" id="kpis"></div>
  <div class="m-card">
    <h4>Overall Submission Progress</h4>
    <div class="m-bar"><i id="prog" style="width:0%"></i></div>
    <div id="progText" class="hint" style="margin-top:6px"></div>
  </div>
  <div id="noClients" class="m-card" style="display:none;border-color:#f59e0b;background:rgba(245,158,11,.08)"></div>
  <div id="wrongDate" class="m-card" style="display:none;border-color:#f59e0b;background:rgba(245,158,11,.08)"></div>
  <div class="m-card">
    <h4>Branch-wise Status</h4>
    <div class="m-branch-list" id="allRows"></div>
  </div>
</div>
`, ACTIONS)}
<script>
${MIS_SESSION_JS}
ROWS=[];
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function api(action,extra){return fetch('/api/mis/admin-data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action},extra||{}))}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});}
(function(){el('date').value=misTodayIst();load();setInterval(load,180000);})();
function load(){api('submission',{date:el('date').value}).then(function(res){if(res.status===200)render(res.body);});}
function fmt(iso){if(!iso)return '';var d=new Date(iso);return d.toLocaleString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true,timeZone:'Asia/Kolkata'});}
function rowHtml(r){
  var dot=r.submitted?'ok':(r.wrongDate?'warn':'no');
  var meta='';
  if(r.submitted){meta='Submitted at '+fmt(r.at)+(r.onTime?'':(r.graceOnTime?' · <span style="color:#fbbf24">Late (excused before 4 PM)</span>':' · <span style="color:#f87171">Late after 4 PM — zero performance</span>'));if(r.submittedBy)meta+='<br>By: '+h(r.submittedBy);}
  else if(r.wrongDate){meta='<span class="warn">⚠ Submitted today but for wrong date: <b>'+h(r.wrongDateFor)+'</b></span><br>Sent at '+fmt(r.at);if(r.submittedBy)meta+='<br>By: '+h(r.submittedBy);}
  else{meta='Pending — not received yet · <span style="color:#f87171">zero performance if not submitted by 4 PM</span>';if(r.remindedAt)meta+='<br><span class="rem">Reminded at '+fmt(r.remindedAt)+'</span>';}
  if(r.noClients)meta+='<br><span class="warn">⚠ No clients in Data Bank</span>';
  var actions='';
  if(r.submitted){
    actions='<span class="m-tag m-tag-ok">Submitted</span>';
  }else if(r.wrongDate){
    actions='<span class="m-tag m-tag-warn">Wrong Date</span>';
  }else{
    actions='<span class="m-tag m-tag-no">Pending</span><button type="button" class="m-btn m-btn-gold noprint" style="padding:6px 12px;font-size:12px" data-remind="'+h(r.branchId)+'">🔔 Re-Remind</button>';
  }
  return '<div class="m-branch-item"><div class="m-branch-left"><span class="m-branch-dot '+dot+'"></span><div><span class="m-branch-name">'+h(r.branch)+'</span><div class="m-branch-meta">'+meta+'</div></div></div><div class="m-branch-actions">'+actions+'</div></div>';
}
function render(d){
  ROWS=d.rows||[];
  if(typeof misPaintSubBadge==='function'){
    misPaintSubBadge(el('misSubBadge'),d.submitted,d.total);
    misPaintSubBadge(el('misMenuSubBadge'),d.submitted,d.total);
  }
  el('kpis').innerHTML=
    '<div class="m-kpi s"><b>'+d.submitted+'</b><span>Submitted</span></div>'+
    '<div class="m-kpi p"><b>'+d.pending+'</b><span>Pending</span></div>'+
    '<div class="m-kpi t"><b>'+d.total+'</b><span>Total Branches</span></div>'+
    '<div class="m-kpi o"><b>'+d.onTime+'</b><span>On-Time (before 2 PM)</span></div>'+
    (d.wrongDate?'<div class="m-kpi" style="border-color:#f59e0b"><b style="color:#fbbf24">'+d.wrongDate+'</b><span>Wrong Date Today</span></div>':'');
  el('pendCount').textContent=d.pending;
  var pc=d.total?Math.round(d.submitted*100/d.total):0;
  el('prog').style.width=pc+'%';
  el('progText').textContent=d.submitted+'/'+d.total+' submitted · '+d.pending+' pending · '+(d.wrongDate||0)+' wrong date · '+(d.submitted-d.onTime)+' late · refreshes every 3 min';
  var sorted=ROWS.slice().sort(function(a,b){if(a.submitted!==b.submitted)return a.submitted?-1:1;return a.branch.localeCompare(b.branch);});
  el('allRows').innerHTML=sorted.length?sorted.map(rowHtml).join(''):'<div class="hint">No branches configured.</div>';
  el('allRows').querySelectorAll('[data-remind]').forEach(function(btn){btn.addEventListener('click',function(){remindOne(btn.getAttribute('data-remind'));});});
  var nc=el('noClients');
  if(d.noClientBranches&&d.noClientBranches.length){nc.style.display='block';nc.innerHTML='<b style="color:#fbbf24">Data Bank alert:</b> These branches have no clients — HODs cannot submit until clients are added: '+d.noClientBranches.map(h).join(', ');}
  else nc.style.display='none';
  var wd=el('wrongDate');
  if(d.wrongDate){wd.style.display='block';wd.innerHTML='<b style="color:#fbbf24">Wrong date alert:</b> '+d.wrongDate+' branch(es) submitted today but left <b>yesterday\\'s date</b> on the form. Ask them to re-submit with <b>today\\'s date</b>.';}
  else wd.style.display='none';
}
function remindAll(){if(!confirm('Send reminder email to Branch HODs of all pending branches? Director will be copied on each email.'))return;api('remindPending',{date:el('date').value}).then(function(res){if(res.status===200){var s=res.body.sent||[];var sk=res.body.skipped||[];alert('Reminders sent to '+s.length+' branch(es).'+(sk.length?'\\nNo HOD email on file for: '+sk.join(', '):'')+(res.body.directorCc?'\\nDirector copied: '+res.body.directorCc:''));load();}else alert(res.body.error||'Could not send.');});}
function remindOne(bid){if(!bid)return;api('remindBranchHod',{date:el('date').value,branchId:bid}).then(function(res){if(res.status===200){var s=res.body.sent||[];if(s.length){var msg='Reminder sent for '+s[0]+'.';if(res.body.emailed&&res.body.emailed[0])msg+='\\nTo: '+res.body.emailed[0].to.join(', ');if(res.body.directorCc)msg+='\\nDirector copied: '+res.body.directorCc;alert(msg);}else alert('No HOD email found for this branch — contact IT to register HOD in User Management.');load();}else alert(res.body.error||'Could not send.');});}
function shareMail(){var to=prompt('Send submission status to (email):', 'director@agilegroup.co.in');if(!to)return;api('sendConsolidatedMail',{date:el('date').value,to:to}).then(function(res){alert(res.status===200?'Email sent ✓':(res.body.error||'Could not send'));});}
misStart();
</script>
</body></html>`
