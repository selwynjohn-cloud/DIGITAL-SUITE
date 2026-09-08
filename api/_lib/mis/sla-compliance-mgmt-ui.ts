/** Shared Management SLA overview UI (MIS + Deployment management portals). */

export const SLA_COMPLIANCE_MGMT_CSS = `
.sla-note{font-size:13px;color:#94a3b8;line-height:1.5;margin:8px 0 12px}
.sla-over{color:#f87171;font-weight:800}.sla-due{color:#fb923c;font-weight:800}
.sla-link{background:none;border:none;color:#93c5fd;font-weight:700;cursor:pointer;padding:0;text-align:left}
.sla-detail{margin-top:14px;padding:14px;border:1px solid #334155;border-radius:12px;background:#0e1730;display:none}
.sla-detail.open{display:block}
.sla-detail h4{color:#fde68a;margin:0 0 8px}
.sla-pre{white-space:pre-wrap;background:#0b1220;border:1px solid #334155;border-radius:8px;padding:10px;font-size:12px;color:#e2e8f0;min-height:48px}
table.sla-mt{border-collapse:collapse;width:100%;font-size:12px}
table.sla-mt th,table.sla-mt td{border:1px solid #22304f;padding:8px;color:#e2e8f0;vertical-align:top}
table.sla-mt th{background:#0e1730;color:#c9a84c;font-size:10px;text-transform:uppercase}
.sla-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;align-items:center}
`

export function slaComplianceMgmtInnerHtml(opts?: { hodEditUrl?: string; brandNote?: string }): string {
  const hod = opts?.hodEditUrl || '/mis-staff-unit-issue'
  const note =
    opts?.brandNote ||
    'Management sees all branches. HODs add <b>Client-wise SLA</b> in the Branch portal. Open any client to view payment / penalty / lists, and share by mail (CC Director).'
  return `
<div class="m-wrap" id="app">
  <div class="m-card">
    <p class="sla-note"><b>Management view</b> — ${note}</p>
    <p class="sla-note">HOD edit page: <a href="${hod}" style="color:#fde68a">${hod}</a></p>
    <div class="sla-actions">
      <button type="button" class="m-btn m-btn-gold" onclick="slaMgmtLoad()">Reload</button>
      <input id="slaMgmtFilter" class="m-inp" style="max-width:240px" placeholder="Filter client / branch…" oninput="slaMgmtPaint()">
    </div>
    <div id="kpis" class="m-kgrid" style="margin-top:12px"></div>
  </div>
  <div class="m-card">
    <h3 style="color:#fde68a;margin-bottom:8px">Due soon / overdue (all branches)</h3>
    <div class="tblwrap"><table class="sla-mt"><thead><tr><th>When</th><th>Branch</th><th>Client</th><th>Type</th><th>Item</th><th>Due</th></tr></thead><tbody id="dueRows"></tbody></table></div>
  </div>
  <div class="m-card">
    <h3 style="color:#fde68a;margin-bottom:8px">Client-wise SLA records</h3>
    <div class="tblwrap"><table class="sla-mt"><thead><tr><th>Branch</th><th>Client</th><th>Location</th><th>Agreement</th><th>Equipment</th><th>Ops</th><th>Payment</th><th>Penalty</th><th></th></tr></thead><tbody id="recRows"></tbody></table></div>
    <div id="slaDetail" class="sla-detail"></div>
  </div>
</div>`
}

export const SLA_COMPLIANCE_MGMT_JS = `
var SLA_MGMT_RECS=[];
var SLA_MGMT_DUE=[];
function slaMgmtApi(action,extra){
  return fetch('/api/mis/sla-compliance-data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(Object.assign({action:action,sessionToken:typeof OTP_SESSION!=='undefined'?OTP_SESSION:''},extra||{}))
  }).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});
}
function slaMgmtLoad(){
  slaMgmtApi('listAll').then(function(res){
    if(res.status===401){
      if(location.pathname.indexOf('/deployment')===0)location.href='/deployment?portal=management&fresh=1';
      else location.href='/mis';
      return;
    }
    if(res.status!==200){
      el('dueRows').innerHTML='<tr><td colspan="6">'+(res.body&&res.body.error||'Could not load')+'</td></tr>';
      return;
    }
    SLA_MGMT_DUE=res.body.due||[];
    SLA_MGMT_RECS=res.body.records||[];
    slaMgmtPaint();
  });
}
function slaMgmtPaint(){
  var q=((el('slaMgmtFilter')&&el('slaMgmtFilter').value)||'').trim().toLowerCase();
  var due=SLA_MGMT_DUE.filter(function(d){
    if(!q)return true;
    return (d.branchName+' '+d.clientName+' '+d.location+' '+d.label).toLowerCase().indexOf(q)>=0;
  });
  var recs=SLA_MGMT_RECS.filter(function(r){
    if(!q)return true;
    return (r.branchName+' '+r.clientName+' '+r.location).toLowerCase().indexOf(q)>=0;
  });
  var eq=0,op=0;recs.forEach(function(r){eq+=(r.equipment||[]).length;op+=(r.operations||[]).length;});
  el('kpis').innerHTML=
    '<div class="m-kpi p"><b>'+recs.length+'</b><span>Client SLAs</span></div>'+
    '<div class="m-kpi t"><b>'+eq+'</b><span>Equipment lines</span></div>'+
    '<div class="m-kpi o"><b>'+op+'</b><span>Ops lines</span></div>'+
    '<div class="m-kpi s"><b>'+due.length+'</b><span>Due in 14 days</span></div>';
  el('dueRows').innerHTML=due.map(function(d){
    var when=d.days<0?'<span class="sla-over">OVERDUE</span>':(d.days===0?'<span class="sla-due">TODAY</span>':'In '+d.days+'d');
    return '<tr><td>'+when+'</td><td>'+h(d.branchName)+'</td><td>'+h(d.clientName)+'<br><small>'+h(d.location)+'</small></td><td>'+(d.kind==='equipment'?'Equipment':'Ops')+'</td><td><b>'+h(d.label)+'</b><br><small>'+h(d.detail)+'</small></td><td>'+h(d.nextDueDate||'—')+'</td></tr>';
  }).join('')||'<tr><td colspan="6" style="color:#94a3b8">Nothing due in the next 14 days.</td></tr>';
  el('recRows').innerHTML=recs.map(function(r,i){
    var idx=SLA_MGMT_RECS.indexOf(r);
    return '<tr><td>'+h(r.branchName)+'</td><td><button type="button" class="sla-link" onclick="slaMgmtOpen('+idx+')">'+h(r.clientName)+'</button></td><td>'+h(r.location)+'</td><td>'+h((r.agreementFrom||'—')+' → '+(r.agreementTo||'—'))+'</td><td class="c">'+(r.equipment||[]).length+'</td><td class="c">'+(r.operations||[]).length+'</td><td class="c">'+(r.paymentTerms?'Yes':'—')+'</td><td class="c">'+(r.penaltyConditions?'Yes':'—')+'</td><td><button type="button" class="m-btn m-btn-grey" style="padding:4px 8px;font-size:11px" onclick="slaMgmtOpen('+idx+')">Open</button></td></tr>';
  }).join('')||'<tr><td colspan="9" style="color:#94a3b8">No client SLA records yet.</td></tr>';
}
function slaMgmtOpen(i){
  var r=SLA_MGMT_RECS[i];if(!r)return;
  var box=el('slaDetail');if(!box)return;
  var eq=(r.equipment||[]).map(function(e){
    return '<tr><td>'+h(e.name)+'</td><td class="c">'+(e.requiredQty||0)+'</td><td class="c">'+(e.issuedQty||0)+'</td><td>'+h(e.status||'')+'</td><td>'+h(e.nextDueDate||'—')+'</td></tr>';
  }).join('')||'<tr><td colspan="5" style="color:#94a3b8">None</td></tr>';
  var op=(r.operations||[]).map(function(o){
    return '<tr><td>'+h(o.label)+'</td><td class="c">'+(o.requiredCount||0)+'</td><td class="c">'+(o.doneCount||0)+'</td><td>'+h(o.status||'')+'</td><td>'+h(o.nextDueDate||'—')+'</td></tr>';
  }).join('')||'<tr><td colspan="5" style="color:#94a3b8">None</td></tr>';
  box.className='sla-detail open';
  box.innerHTML=
    '<h4>'+h(r.clientName)+' · '+h(r.location)+'</h4>'+
    '<p class="sla-note">'+h(r.branchName)+' · Agreement '+h((r.agreementFrom||'—')+' → '+(r.agreementTo||'—'))+'</p>'+
    '<label style="color:#94a3b8;font-size:12px;font-weight:700">Payment terms</label><div class="sla-pre">'+(r.paymentTerms?h(r.paymentTerms):'<i style="color:#64748b">Not noted</i>')+'</div>'+
    '<label style="color:#94a3b8;font-size:12px;font-weight:700;margin-top:10px;display:block">Penalty conditions</label><div class="sla-pre">'+(r.penaltyConditions?h(r.penaltyConditions):'<i style="color:#64748b">Not noted</i>')+'</div>'+
    '<h4 style="margin-top:14px">Security equipment</h4>'+
    '<div class="tblwrap"><table class="sla-mt"><thead><tr><th>Item</th><th>Req</th><th>Issued</th><th>Status</th><th>Due</th></tr></thead><tbody>'+eq+'</tbody></table></div>'+
    '<h4 style="margin-top:14px">Operational compliance</h4>'+
    '<div class="tblwrap"><table class="sla-mt"><thead><tr><th>Item</th><th>Req</th><th>Done</th><th>Status</th><th>Due</th></tr></thead><tbody>'+op+'</tbody></table></div>'+
    '<div class="sla-actions" style="margin-top:14px">'+
    '<input id="slaMgmtShareTo" class="m-inp" style="max-width:280px" type="email" placeholder="Share To email…">'+
    '<button type="button" class="m-btn m-btn-gold" onclick="slaMgmtShare('+i+')">✉ Share by mail (CC Director)</button>'+
    '<button type="button" class="m-btn m-btn-grey" onclick="el(\\'slaDetail\\').className=\\'sla-detail\\'">Close</button>'+
    '</div>'+
    '<div id="slaMgmtShareMsg" class="sla-note"></div>';
  try{box.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){}
}
function slaMgmtShare(i){
  var r=SLA_MGMT_RECS[i];if(!r)return;
  var to=(el('slaMgmtShareTo')&&el('slaMgmtShareTo').value||'').trim();
  var msg=el('slaMgmtShareMsg');
  if(!to||to.indexOf('@')<0){if(msg){msg.style.color='#fb923c';msg.textContent='Enter To email';}return;}
  if(msg){msg.style.color='#94a3b8';msg.textContent='Sending…';}
  slaMgmtApi('shareMail',{id:r.id,branchId:r.branchId,to:to,record:r}).then(function(res){
    if(!msg)return;
    if(res.status!==200){msg.style.color='#fb923c';msg.textContent=(res.body&&res.body.error)||'Could not send';return;}
    msg.style.color='#4ade80';msg.textContent='Mail sent to '+to+' · CC Director ✓';
  });
}
`
