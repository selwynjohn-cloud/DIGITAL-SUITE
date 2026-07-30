import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireMisPageSession } from '../_lib/mis/session.js'
import { MIS_LAYOUT_CSS, MIS_SESSION_JS, MIS_THEME_CSS, misPageWrap } from '../_lib/mis/layout.js'
import { COMPLAINT_NATURES } from '../_lib/mis/store.js'

const MIS_ACTIVE = '/mis-complaints'
const MIS_TITLE = 'Complaints'
const NATURES_JSON = JSON.stringify([...COMPLAINT_NATURES])

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireMisPageSession(req, res)) return
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(PAGE)
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — Complaint Management</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:15px}
${MIS_THEME_CSS}
.m-kpi-dark{background:#0e1730;border:1px solid #22304f;border-radius:12px;padding:14px 16px;text-align:center}
.m-kpi-dark b{color:#c9a84c;font-size:24px;display:block}.m-kpi-dark span{font-size:12px;color:#94a3b8}
.m-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.m-tab{padding:11px 20px;border-radius:9px;border:1px solid #334155;background:#0e1730;color:#cbd5e1;font-weight:800;cursor:pointer}
.m-tab.active{background:#c9a84c;color:#14224f;border-color:#c9a84c}
${MIS_LAYOUT_CSS}
</style></head>
<body>
${misPageWrap(MIS_ACTIVE, MIS_TITLE, `
<div class="m-wrap" id="app">
  <div class="m-tabs">
    <button class="m-tab active" id="tabEntry" onclick="showTab('entry')">📝 Add Complaint</button>
    <button class="m-tab" id="tabInbox" onclick="showTab('inbox')">📧 Director Inbox</button>
    <button class="m-tab" id="tabAnalysis" onclick="showTab('analysis')">📊 Analysis</button>
  </div>
  <div id="paneEntry">
  <div class="m-card">
    <div class="hint">Branch HODs: register complaints received by <b>Phone</b>, <b>Mail</b>, or <b>WhatsApp</b>. <b>Guard complaints</b> auto-import from <b>Agile Guards</b> (received + delayed). Each gets a <b>Complaint Code</b> on save. Public form: <a href="/operations-complaints" target="_blank" style="color:#c9a84c">Operations Complaints Form</a></div>
    <label class="m-lbl" style="max-width:300px">Branch</label>
    <select class="m-inp" id="branch" style="max-width:320px" onchange="loadBranchComplaints()"></select>
  </div>
  <div class="m-kgrid" id="kpis"></div>
  <div class="m-card">
    <h4>Complaints / Incidents</h4>
    <label style="display:flex;align-items:center;gap:6px;margin:0 0 10px;font-size:13px;color:#94a3b8"><input type="checkbox" id="showArchived" onchange="render()"> Show archived complaints</label>
    <div class="mtblwrap"><table class="mtbl">
      <thead><tr><th>Code</th><th>Client</th><th>Location</th><th>Date</th><th>Via</th><th>Nature</th><th>Description</th><th>Action Taken</th><th class="c">MOM &lt;24h</th><th>Status</th><th>Reported By</th><th>Archive</th><th>Delete</th></tr></thead>
      <tbody id="rows"></tbody>
    </table></div>
    <div style="margin-top:10px"><button class="m-btn m-btn-grey" onclick="addRow()">+ Add Complaint</button></div>
  </div>
  </div>
  <div id="paneInbox" class="hidden">
    <div class="m-card">
      <div class="hint">Auto-fetch only from <b>director@agilegroup.co.in</b> (Agile Group server). Personal Gmail (e.g. selwyn.john@gmail.com) is <b>not</b> used. Assign each complaint to the correct branch.</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">
        <button class="m-btn m-btn-gold" onclick="syncInbox()">🔄 Sync Inbox Now</button>
        <span id="inboxMsg" class="hint" style="margin:0"></span>
      </div>
    </div>
    <div class="m-kgrid" id="inboxKpis"></div>
    <div class="m-card">
      <h4>From Your Inbox — assign to branch or delete junk mail</h4>
      <div class="mtblwrap"><table class="mtbl">
        <thead><tr><th class="l">Code</th><th class="l">Date</th><th class="l">From</th><th class="l">Client / Subject</th><th class="l">Description</th><th>Action</th></tr></thead>
        <tbody id="inboxRows"></tbody>
      </table></div>
    </div>
  </div>
  <div id="paneAnalysis" class="hidden">
    <div class="m-card" style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
      <div><label class="m-lbl">Month</label><input class="m-inp" id="month" type="month" onchange="loadAnalysis()"></div>
      <button class="m-btn m-btn-gold" onclick="loadAnalysis()">Refresh Analysis</button>
    </div>
    <div class="m-kgrid" id="aKpis"></div>
    <div class="m-card">
      <h4>Branch-wise Analysis <span class="hint" style="font-weight:400">— sorted by open complaints (worst first)</span></h4>
      <div class="mtblwrap"><table class="mtbl">
        <thead><tr><th class="l">Branch</th><th class="c">Total</th><th class="c">Open</th><th class="c">Closed</th><th class="c">MOM %</th><th class="c">Client</th><th class="c">Guard</th><th class="c">This Month</th></tr></thead>
        <tbody id="aBranches"></tbody>
      </table></div>
    </div>
    <div class="m-card">
      <h4>Open Incidents — Action Required</h4>
      <div class="mtblwrap"><table class="mtbl">
        <thead><tr><th class="l">Code</th><th class="l">Branch</th><th class="l">Client</th><th class="l">Location</th><th class="c">Date</th><th class="c">Via</th><th class="c">Nature</th><th class="l">Description</th><th class="c">MOM 24h</th><th class="l">Reported By</th></tr></thead>
        <tbody id="aOpen"></tbody>
      </table></div>
    </div>
  </div>
</div>
<div class="m-savebar noprint" id="saveBar"><div id="saveMsg" class="hint" style="flex-basis:100%;display:none"></div><button class="m-btn m-btn-green" onclick="save()">✅ Save &amp; Publish</button></div>
`)}
<script>
${MIS_SESSION_JS}
ROWS=[],BRANCHES=[],INBOX=[],BRANCH_LIST=[],NATURES=${NATURES_JSON};
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function a(s){return h(s).replace(/"/g,'&quot;');}
function nid(){return 'cmp'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
function api(action,extra){return fetch('/api/mis/admin-data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action},extra||{}))}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});}

function showTab(t){
  el('tabEntry').classList.toggle('active',t==='entry');
  el('tabInbox').classList.toggle('active',t==='inbox');
  el('tabAnalysis').classList.toggle('active',t==='analysis');
  el('paneEntry').classList.toggle('hidden',t!=='entry');
  el('paneInbox').classList.toggle('hidden',t!=='inbox');
  el('paneAnalysis').classList.toggle('hidden',t!=='analysis');
  el('saveBar').classList.toggle('hidden',t!=='entry');
  if(t==='analysis')loadAnalysis();
  if(t==='inbox')loadInbox();
}

(function(){el('month').value=new Date().toISOString().slice(0,7);})();

function loadBranchComplaints(){
  var bid=el('branch').value;if(!bid)return;
  api('syncGuardsComplaints').then(function(){
    return api('loadComplaints',{branchId:bid});
  }).then(function(res){
    if(res.status!==200)return;
    ROWS=(res.body.complaints||[]).map(function(c){c.active=c.active!==false;return c;});
    render();
  });
}
function initPage(){api('login').then(function(res){if(res.status!==200)return;BRANCH_LIST=(res.body.branches||[]).filter(function(b){return b.active!==false;});el('branch').innerHTML=BRANCH_LIST.map(function(b){return '<option value="'+a(b.id)+'">'+h(b.name)+'</option>';}).join('');loadBranchComplaints();});}
function addRow(){ROWS.push({id:nid(),code:'',clientName:'',location:'',incidentDate:new Date().toISOString().slice(0,10),type:'Client',nature:'',channel:'Phone',description:'',actionTaken:'',momWithin24h:false,status:'Open',reportedBy:'',source:'manual',active:true});render();}
function chOpt(cur){return ['Phone','Mail','WhatsApp','Email','Web'].map(function(o){return '<option'+(o===(cur||'Phone')?' selected':'')+'>'+o+'</option>';}).join('');}
function natureOpt(cur){var opts='<option value="">— select —</option>';NATURES.forEach(function(n){opts+='<option'+(n===(cur||'')?' selected':'')+'>'+h(n)+'</option>';});return opts;}
function fmtTs(iso){if(!iso)return '';try{return new Date(iso).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short',timeZone:'Asia/Kolkata'});}catch(e){return iso;}}
function upd(i,f,v){ROWS[i][f]=v;kpi();}
function toggleArchive(i){ROWS[i].active=ROWS[i].active===false;render();}
function deleteRow(i){if(!confirm('Delete this complaint permanently?'))return;var c=ROWS[i],bid=el('branch').value;if(!c.id||!bid){ROWS.splice(i,1);render();return;}api('deleteComplaint',{branchId:bid,complaintId:c.id}).then(function(res){if(res.status===200){ROWS.splice(i,1);render();}else alert(res.body.error||'Could not delete');});}
function render(){var tb=el('rows');var show=el('showArchived')&&el('showArchived').checked;tb.innerHTML='';ROWS.forEach(function(c,i){
  if(!show&&c.active===false)return;
  function opt(cur,arr){return arr.map(function(o){return '<option'+(o===cur?' selected':'')+'>'+o+'</option>';}).join('');}
  var stCls=c.status==='Closed'?'sc-good':'sc-poor';
  var act=c.active!==false;
  var tr=document.createElement('tr');
  if(!act)tr.className='m-row-inactive';
  tr.innerHTML='<td style="font-weight:800;color:#fde68a;white-space:nowrap">'+(c.code?h(c.code):'<span class="hint">New</span>')+'</td>'+
   '<td><input value="'+a(c.clientName)+'" oninput="upd('+i+',\\'clientName\\',this.value)"></td>'+
   '<td><input value="'+a(c.location)+'" oninput="upd('+i+',\\'location\\',this.value)"></td>'+
   '<td><input type="date" value="'+a(c.incidentDate)+'" oninput="upd('+i+',\\'incidentDate\\',this.value)"></td>'+
   '<td><select onchange="upd('+i+',\\'channel\\',this.value)">'+chOpt(c.channel)+'</select></td>'+
   '<td><select onchange="upd('+i+',\\'nature\\',this.value)">'+natureOpt(c.nature)+'</select></td>'+
   '<td><input value="'+a(c.description)+'" oninput="upd('+i+',\\'description\\',this.value)"></td>'+
   '<td><input value="'+a(c.actionTaken)+'" oninput="upd('+i+',\\'actionTaken\\',this.value)"></td>'+
   '<td class="c"><input type="checkbox" '+(c.momWithin24h?'checked':'')+' onchange="upd('+i+',\\'momWithin24h\\',this.checked)"></td>'+
   '<td><select class="'+stCls+'" onchange="upd('+i+',\\'status\\',this.value);render()">'+opt(c.status,['Open','Delayed','Closed'])+'</select></td>'+
   '<td><input value="'+a(c.reportedBy)+'" oninput="upd('+i+',\\'reportedBy\\',this.value)"></td>'+
   '<td><button type="button" class="m-toggle '+(act?'on':'off')+'" onclick="toggleArchive('+i+')">'+(act?'Active':'Archived')+'</button></td>'+
   '<td><button type="button" class="m-btn m-btn-red" style="padding:5px 9px;font-size:12px" onclick="deleteRow('+i+')">Delete</button></td>';
  tb.appendChild(tr);});kpi();}
function kpi(){var open=0,closed=0,delayed=0,mom=0,cl=0,gd=0,active=0;ROWS.forEach(function(c){if(c.active===false)return;active++;if(c.status==='Closed')closed++;else if(c.status==='Delayed')delayed++;else open++;if(c.momWithin24h)mom++;if(c.type==='Guard')gd++;else cl++;});
  var momPct=active?Math.round(mom*100/active):0;
  el('kpis').innerHTML='<div class="m-kpi-dark"><b>'+active+'</b><span>Active</span></div><div class="m-kpi-dark"><b class="sc-poor">'+open+'</b><span>Open</span></div><div class="m-kpi-dark"><b style="color:#fbbf24">'+delayed+'</b><span>Delayed (Guards)</span></div><div class="m-kpi-dark"><b class="sc-good">'+closed+'</b><span>Closed</span></div><div class="m-kpi-dark"><b>'+momPct+'%</b><span>MOM within 24h</span></div><div class="m-kpi-dark"><b>'+cl+' / '+gd+'</b><span>Client / Guard</span></div>';}
function save(){var m=el('saveMsg');m.style.display='block';m.style.color='#4ade80';m.textContent='Saving...';
  api('saveComplaints',{branchId:el('branch').value,complaints:ROWS}).then(function(res){
    if(res.status===200){m.textContent='✅ Saved & published!';if(res.body.complaints)ROWS=res.body.complaints;render();}
    else{m.style.color='#f87171';m.textContent=res.body.error||'Could not save';}
  });}

function loadAnalysis(){
  api('complaintsAnalysis',{month:el('month').value}).then(function(res){
    if(res.status!==200)return;
    var d=res.body,t=d.totals||{};
    el('aKpis').innerHTML=
      '<div class="m-kpi t"><b>'+(t.total||0)+'</b><span>All Complaints</span></div>'+
      '<div class="m-kpi p"><b>'+(t.open||0)+'</b><span>Open (action needed)</span></div>'+
      '<div class="m-kpi s"><b>'+(t.closed||0)+'</b><span>Closed</span></div>'+
      '<div class="m-kpi o"><b>'+(t.resolutionPct||0)+'%</b><span>Resolution Rate</span></div>'+
      '<div class="m-kpi t"><b>'+(t.momPct||0)+'%</b><span>MOM within 24h</span></div>'+
      '<div class="m-kpi o"><b>'+(t.thisMonth||0)+'</b><span>New this month</span></div>'+
      '<div class="m-kpi s"><b>'+(t.client||0)+' / '+(t.guard||0)+'</b><span>Client / Guard</span></div>';
    var tb=el('aBranches');tb.innerHTML='';
    (d.branches||[]).forEach(function(b){
      var tr=document.createElement('tr');
      var openCls=b.open>0?'sc-poor':'sc-good';
      tr.innerHTML='<td class="l">'+h(b.branch)+'</td><td class="c">'+b.total+'</td><td class="c '+openCls+'"><b>'+b.open+'</b></td><td class="c sc-good">'+b.closed+'</td><td class="c">'+b.momPct+'%</td><td class="c">'+b.client+'</td><td class="c">'+b.guard+'</td><td class="c">'+b.monthCount+'</td>';
      tb.appendChild(tr);
    });
    var ob=el('aOpen');ob.innerHTML='';
    (d.openIncidents||[]).forEach(function(c){
      var tr=document.createElement('tr');
      tr.innerHTML='<td class="l" style="color:#fde68a;font-weight:800">'+h(c.code||'—')+'</td><td class="l">'+h(c.branch)+'</td><td class="l">'+h(c.clientName)+'</td><td class="l">'+h(c.location)+'</td><td class="c">'+h(c.incidentDate)+'</td><td class="c">'+h(c.channel||'')+'</td><td class="c">'+h(c.nature||c.type||'')+'</td><td class="l">'+h(c.description)+'</td><td class="c">'+(c.momWithin24h?'<span class="sc-bg-good">Yes</span>':'<span class="sc-bg-poor">No</span>')+'</td><td class="l">'+h(c.reportedBy)+'</td>';
      ob.appendChild(tr);
    });
    if(!(d.openIncidents||[]).length)ob.innerHTML='<tr><td colspan="10" class="m-pending">No open complaints — well done!</td></tr>';
  });
}

function loadInbox(){
  api('loadDirectorInbox').then(function(res){
    if(res.status!==200)return;
    INBOX=res.body.inbox||[];
    if(!BRANCH_LIST.length)BRANCH_LIST=res.body.branches||[];
    renderInbox();
  });
}

function syncInbox(){
  el('inboxMsg').textContent='Syncing inbox…';
  api('syncComplaintInbox').then(function(res){
    if(res.status!==200){el('inboxMsg').textContent=res.body.error||'Sync failed — use Google Apps Script (see setup note).';return;}
    if(res.body.skipped)el('inboxMsg').textContent='Server Gmail not configured — use Google Apps Script on your inbox (auto every 30 min).';
    else el('inboxMsg').textContent='✅ Synced — imported '+(res.body.imported||0)+' email(s), scanned '+(res.body.scanned||0)+'.';
    loadInbox();
  });
}

function renderInbox(){
  var open=INBOX.filter(function(c){return c.status!=='Closed';}).length;
  el('inboxKpis').innerHTML=
    '<div class="m-kpi t"><b>'+INBOX.length+'</b><span>In inbox total</span></div>'+
    '<div class="m-kpi p"><b>'+open+'</b><span>Awaiting branch assign</span></div>';
  var tb=el('inboxRows');tb.innerHTML='';
  var branchOpts='<option value="">Select branch…</option>'+BRANCH_LIST.map(function(b){return '<option value="'+a(b.id)+'">'+h(b.name)+'</option>';}).join('');
  INBOX.forEach(function(c,i){
    var tr=document.createElement('tr');
    tr.innerHTML='<td class="l" style="color:#fde68a;font-weight:800">'+h(c.code||'—')+'</td><td class="c">'+h(c.incidentDate)+'</td><td class="l">'+h(c.fromEmail||c.reportedBy)+'</td><td class="l"><b>'+h(c.clientName)+'</b><br><small>'+h(c.subject||'')+'</small></td><td class="l">'+h((c.description||'').slice(0,120))+'</td>'+
      '<td><div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><select id="asgn'+i+'" class="m-inp" style="min-width:150px;max-width:200px">'+branchOpts+'</select><button type="button" class="m-btn m-btn-green" style="padding:6px 10px;font-size:12px" onclick="assignInbox(\\''+a(c.id)+'\\','+i+')">Assign</button><button type="button" class="m-btn m-btn-red" style="padding:6px 10px;font-size:12px" onclick="deleteInbox(\\''+a(c.id)+'\\')">Delete</button></div></td>';
    tb.appendChild(tr);
  });
  if(!INBOX.length)tb.innerHTML='<tr><td colspan="6" class="m-pending">No inbox complaints yet. Only director@agilegroup.co.in is scanned.</td></tr>';
}

function assignInbox(cid,idx){
  var bid=el('asgn'+idx).value;
  if(!bid){alert('Please select a branch first.');return;}
  api('assignInboxComplaint',{complaintId:cid,branchId:bid}).then(function(res){
    if(res.status===200)loadInbox();
    else alert(res.body.error||'Could not assign');
  });
}
function deleteInbox(cid){
  if(!confirm('Delete this email from the inbox? It will not come back.'))return;
  api('deleteInboxComplaint',{complaintId:cid}).then(function(res){
    if(res.status===200)loadInbox();
    else alert(res.body.error||'Could not delete');
  });
}
misStart();
</script>
</body></html>`
