/** HOD portal — Client-wise SLA page script (injected into staff shell). */

export const SLA_COMPLIANCE_PAGE_CSS = `
.sla-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}
.sla-sec{margin:16px 0 10px;font-size:13px;font-weight:900;color:#c9a84c;text-transform:uppercase;letter-spacing:.05em}
.sla-note{font-size:13px;color:#94a3b8;line-height:1.5;margin:8px 0 12px}
.sla-preview{max-height:220px;overflow:auto;border:1px solid #334155;border-radius:10px;padding:10px;background:#0b1220;font-size:12px;line-height:1.45;white-space:pre-wrap}
.sla-preview .sla-para{margin:0 0 8px}.sla-preview mark{background:#fde68a;color:#111;padding:0 2px;border-radius:2px}
.sla-preview .srch{outline:2px solid #c9a84c}
.sla-tbl{width:100%;border-collapse:collapse;font-size:12px}
.sla-tbl th,.sla-tbl td{border:1px solid #334155;padding:6px;color:#e2e8f0;vertical-align:middle}
.sla-tbl th{background:#0e1730;color:#c9a84c;font-size:10px;text-transform:uppercase}
.sla-tbl input,.sla-tbl select{width:100%;min-width:64px}
.sla-tbl .name-inp{min-width:140px;font-weight:700}
.sla-list button.linkish{background:none;border:none;color:#93c5fd;font-weight:700;cursor:pointer;padding:0;text-align:left}
.sla-due{color:#fb923c;font-weight:800}.sla-over{color:#f87171;font-weight:800}
.sla-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;align-items:center}
.sla-panel{border:1px solid #334155;border-radius:12px;padding:14px;margin-top:14px;background:#0e1730}
.sla-panel-h{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px}
.sla-panel-h h3{color:#fde68a;font-size:15px;margin:0}
.sla-count{display:inline-block;background:#7c3aed;color:#fff;font-size:11px;font-weight:800;padding:2px 8px;border-radius:999px;margin-left:6px}
.sla-toolbar{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 10px}
.sla-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:80;display:flex;align-items:flex-start;justify-content:center;padding:24px 12px;overflow:auto}
.sla-modal{width:min(720px,100%);background:#111a30;border:1px solid #475569;border-radius:14px;padding:16px;max-height:90vh;display:flex;flex-direction:column}
.sla-modal h3{color:#fde68a;margin:0 0 8px;font-size:16px}
.sla-pick-list{overflow:auto;flex:1;border:1px solid #334155;border-radius:10px;padding:8px;background:#0b1220;max-height:55vh}
.sla-pick-cat{margin:10px 0 6px;color:#c9a84c;font-size:12px;font-weight:800;text-transform:uppercase}
.sla-pick-row{display:flex;gap:8px;align-items:flex-start;padding:6px 4px;border-bottom:1px solid #1e293b;font-size:13px;color:#e2e8f0}
.sla-pick-row input{width:18px;height:18px;margin-top:2px;flex:0 0 auto}
.sla-add-box{display:none;margin:8px 0;padding:12px;border:1px dashed #64748b;border-radius:10px;background:#0b1220}
.sla-add-box.open{display:block}
.sla-row-btns{display:flex;flex-direction:column;gap:4px;min-width:72px}
.sla-row-btns .m-btn{padding:5px 8px;font-size:11px;width:100%}
`

export const SLA_COMPLIANCE_PAGE_JS = `
var SLA_CAT={equipment:[],operations:[]};
var SLA_CLIENTS=[];
var SLA_RECORDS=[];
var SLA_CUR=null;
var SLA_PREVIEW={paras:[],hits:[],idx:0};
var SLA_PICK_KIND='';
function slaApi(action,extra){
  var bid=(typeof staffResolveBranchId==='function'?staffResolveBranchId():'')||(typeof OTP_BRANCH_ID!=='undefined'?OTP_BRANCH_ID:'')||'';
  return fetch('/api/mis/sla-compliance-data',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(Object.assign({action:action,sessionToken:typeof OTP_SESSION!=='undefined'?OTP_SESSION:'',branchId:bid},extra||{}))
  }).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});
}
function slaMsg(t,ok){
  var m=el('slaMsg');if(!m)return;
  m.textContent=t||'';
  m.style.color=ok===false?'#fb923c':(ok?'#4ade80':'#94a3b8');
}
function slaEmptyRecord(){
  return {id:'',clientId:'',clientName:'',location:'',agreementFrom:'',agreementTo:'',agreementFileName:'',agreementText:'',paymentTerms:'',penaltyConditions:'',remindersOn:true,equipment:[],operations:[]};
}
function initStaffPage(){slaBoot();}
function slaBoot(){
  Promise.all([slaApi('catalogs'),slaApi('clients'),slaApi('list')]).then(function(arr){
    var c=arr[0],cl=arr[1],ls=arr[2];
    if(c.status===401||cl.status===401||ls.status===401){if(typeof staffShowLogin==='function')staffShowLogin((c.body&&c.body.error)||'Sign in again');return;}
    if(c.status===200)SLA_CAT={equipment:c.body.equipment||[],operations:c.body.operations||[]};
    if(cl.status===200)SLA_CLIENTS=cl.body.clients||[];
    if(ls.status===200)SLA_RECORDS=ls.body.records||[];
    slaRenderShell();
  }).catch(function(e){slaMsg('Could not load: '+(e&&e.message?e.message:e),false);});
}
function slaRenderShell(){
  var dueHtml='';
  slaApi('list').then(function(res){
    if(res.status===200){SLA_RECORDS=res.body.records||[];dueHtml=slaDueHtml(res.body.due||[]);}
    el('slaRoot').innerHTML=
      '<div class="m-card">'+
      '<p class="sla-note"><b>Client-wise SLA (HOD):</b> Pick a client → Add → upload/paste agreement → Analyse → set equipment &amp; ops → <b>Save Client-wise SLA</b>. Unanswered due items remind HOD (CC Director).</p>'+
      '<div class="sla-sec">Add Client-wise SLA</div>'+
      '<div class="sla-grid" style="align-items:end">'+
      '<div style="grid-column:span 2"><label>Select client from your branch</label>'+
      '<select id="slaQuickClient" class="m-inp"><option value="">— Choose client —</option>'+slaClientOptions()+'</select></div>'+
      '<div><button type="button" class="m-btn m-btn-gold" style="width:100%;min-height:44px" onclick="slaQuickAdd()">+ Add Client-wise SLA</button></div>'+
      '<div><button type="button" class="m-btn m-btn-grey" style="width:100%;min-height:44px" onclick="slaBoot()">Reload list</button></div>'+
      '</div>'+
      '<div class="sla-sec" style="margin-top:18px">Clients with SLA on this branch</div>'+
      '<div class="mtblwrap"><table class="mtbl sla-list"><thead><tr><th>Client</th><th>Location</th><th>Agreement</th><th>Equipment</th><th>Ops</th><th></th></tr></thead><tbody id="slaListBody"></tbody></table></div>'+
      '<div id="slaDueBox" style="margin-top:14px">'+dueHtml+'</div>'+
      '</div>'+
      '<div id="slaEditor"></div>'+
      '<div id="slaModalHost"></div>';
    slaPaintList();
  });
}
function slaDueHtml(due){
  if(!due||!due.length)return '<p class="sla-note">No equipment / ops items due in the next 14 days.</p>';
  return '<div class="sla-sec">Due soon / overdue</div><div class="mtblwrap"><table class="mtbl"><thead><tr><th>When</th><th>Client</th><th>Type</th><th>Item</th><th>Due</th></tr></thead><tbody>'+
    due.map(function(d){
      var when=d.days<0?'<span class="sla-over">OVERDUE</span>':(d.days===0?'<span class="sla-due">TODAY</span>':'In '+d.days+'d');
      return '<tr><td>'+when+'</td><td>'+h(d.clientName)+'<br><small>'+h(d.location)+'</small></td><td>'+(d.kind==='equipment'?'Equipment':'Ops')+'</td><td><b>'+h(d.label)+'</b><br><small>'+h(d.detail)+'</small></td><td>'+h(d.nextDueDate||'—')+'</td></tr>';
    }).join('')+'</tbody></table></div>';
}
function slaPaintList(){
  var body=el('slaListBody');if(!body)return;
  body.innerHTML=SLA_RECORDS.map(function(r){
    return '<tr><td><button type="button" class="linkish" onclick="slaEdit(\\''+h(r.id)+'\\')">'+h(r.clientName)+'</button></td><td>'+h(r.location)+'</td><td>'+h((r.agreementFrom||'—')+' → '+(r.agreementTo||'—'))+'</td><td class="c">'+(r.equipment||[]).length+'</td><td class="c">'+(r.operations||[]).length+'</td><td><button type="button" class="m-btn m-btn-grey" style="padding:4px 8px;font-size:11px" onclick="slaEdit(\\''+h(r.id)+'\\')">Open</button></td></tr>';
  }).join('')||'<tr><td colspan="6" class="hint">No Client-wise SLA yet — choose a client above and tap <b>+ Add Client-wise SLA</b>.</td></tr>';
}
function slaNew(){SLA_CUR=slaEmptyRecord();slaRenderEditor();}
function slaQuickAdd(){
  var sel=el('slaQuickClient');
  if(!sel||!sel.value){alert('Please choose a client first, then tap Add Client-wise SLA.');return;}
  var opt=sel.options[sel.selectedIndex];
  var cid=sel.value;
  var existing=SLA_RECORDS.find(function(x){return String(x.clientId||'')===String(cid);});
  if(existing){
    if(!confirm(String(opt.getAttribute('data-name')||'This client')+' already has an SLA. Open it to edit?'))return;
    slaEdit(existing.id);
    return;
  }
  SLA_CUR=slaEmptyRecord();
  SLA_CUR.clientId=cid;
  SLA_CUR.clientName=opt?opt.getAttribute('data-name')||'':'';
  SLA_CUR.location=opt?opt.getAttribute('data-loc')||'':'';
  slaRenderEditor();
  var sc=el('slaClient');if(sc){sc.value=cid;slaOnClient();}
  try{el('slaEditor').scrollIntoView({behavior:'smooth',block:'start'});}catch(e){}
}
function slaEdit(id){
  var r=SLA_RECORDS.find(function(x){return x.id===id;});
  if(!r){slaMsg('Record not found',false);return;}
  SLA_CUR=JSON.parse(JSON.stringify(r));
  slaRenderEditor();
}
function slaClientOptions(){
  return SLA_CLIENTS.map(function(c){return '<option value="'+h(c.id)+'" data-loc="'+h(c.location)+'" data-name="'+h(c.name)+'">'+h(c.name)+' — '+h(c.location||'')+'</option>';}).join('');
}
function slaOnClient(){
  var sel=el('slaClient');if(!sel||!SLA_CUR)return;
  var opt=sel.options[sel.selectedIndex];
  SLA_CUR.clientId=sel.value;
  SLA_CUR.clientName=opt?opt.getAttribute('data-name')||opt.textContent:'';
  var loc=opt?opt.getAttribute('data-loc')||'':'';
  if(el('slaLoc')&&loc)el('slaLoc').value=loc;
  SLA_CUR.location=el('slaLoc')?el('slaLoc').value:loc;
}
function slaRenderEditor(){
  var r=SLA_CUR;if(!r)return;
  var root=el('slaEditor');if(!root)return;
  var eqN=(r.equipment||[]).length, opN=(r.operations||[]).length;
  root.innerHTML=
    '<div class="m-card" style="margin-top:14px">'+
    '<div class="sla-sec">1 · Client &amp; agreement</div>'+
    '<div class="sla-grid">'+
    '<div><label>Branch</label><input class="m-inp" value="'+h((typeof staffBranchLabel==='function'?staffBranchLabel():'')||(typeof OTP_BRANCH_NAME!=='undefined'?OTP_BRANCH_NAME:''))+'" readonly></div>'+
    '<div><label>Client</label><select id="slaClient" class="m-inp" onchange="slaOnClient()"><option value="">— Select client —</option>'+slaClientOptions()+'</select></div>'+
    '<div><label>Location / Site</label><input id="slaLoc" class="m-inp" value="'+h(r.location||'')+'" oninput="SLA_CUR.location=this.value"></div>'+
    '<div><label>Agreement valid from</label><input id="slaFrom" type="date" class="m-inp" value="'+h(r.agreementFrom||'')+'" onchange="SLA_CUR.agreementFrom=this.value"></div>'+
    '<div><label>Agreement valid to</label><input id="slaTo" type="date" class="m-inp" value="'+h(r.agreementTo||'')+'" onchange="SLA_CUR.agreementTo=this.value"></div>'+
    '<div><label>Reminders</label><select id="slaRem" class="m-inp" onchange="SLA_CUR.remindersOn=this.value===\\'1\\'"><option value="1"'+(r.remindersOn!==false?' selected':'')+'>On — HOD + CC Director</option><option value="0"'+(r.remindersOn===false?' selected':'')+'>Off</option></select></div>'+
    '</div>'+
    '<div class="sla-sec">2 · Upload / copy agreement (PDF · Word · PNG)</div>'+
    '<div class="sla-grid"><div style="grid-column:1/-1"><label>Upload agreement</label><input id="slaFile" type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt,application/pdf,image/*" class="m-inp"></div></div>'+
    '<div class="sla-actions">'+
    '<button type="button" class="m-btn m-btn-gold" onclick="slaReadFile()">Read document</button>'+
    '<button type="button" class="m-btn m-btn-gold" onclick="slaAnalyse()">Analyse SLA → fill lists</button>'+
    '</div>'+
    '<label style="margin-top:10px;display:block">Agreement text (paste or after Read)</label>'+
    '<textarea id="slaText" class="m-inp" rows="5" style="width:100%" oninput="SLA_CUR.agreementText=this.value">'+h(r.agreementText||'')+'</textarea>'+
    '<div class="sla-actions" style="align-items:center">'+
    '<input id="slaSearch" class="m-inp" style="max-width:280px" placeholder="Word search in agreement…" onkeydown="if(event.key===\\'Enter\\'){slaDocSearch();event.preventDefault();}">'+
    '<button type="button" class="m-btn m-btn-grey" onclick="slaDocSearch()">Find</button>'+
    '<button type="button" class="m-btn m-btn-grey" onclick="slaDocSearchNext(-1)">◀ Prev</button>'+
    '<button type="button" class="m-btn m-btn-grey" onclick="slaDocSearchNext(1)">Next ▶</button>'+
    '<span id="slaSearchMeta" class="sla-note" style="margin:0"></span>'+
    '</div>'+
    '<div id="slaPreview" class="sla-preview" style="margin-top:8px"></div>'+

    '<div class="sla-panel" id="slaEqPanel">'+
    '<div class="sla-panel-h"><h3>3 · Security equipment (as per SLA)<span class="sla-count" id="slaEqCount">'+eqN+'</span></h3></div>'+
    '<p class="sla-note">Pick items from the master list, add a new item, edit quantities / due dates, or delete a line. Only items in this client list are tracked &amp; reminded.</p>'+
    '<div class="sla-toolbar">'+
    '<button type="button" class="m-btn m-btn-gold" onclick="slaOpenPicker(\\''+'equip'+'\\')">📦 Pick from master list</button>'+
    '<button type="button" class="m-btn m-btn-grey" onclick="slaToggleAddBox(\\''+'equip'+'\\')">+ Add new equipment</button>'+
    '<button type="button" class="m-btn m-btn-grey" onclick="slaClearEquip()">Clear all equipment</button>'+
    '</div>'+
    '<div id="slaAddEqBox" class="sla-add-box">'+
    '<div class="sla-grid">'+
    '<div><label>Equipment name</label><input id="slaNewEqName" class="m-inp" placeholder="e.g. Walkie-talkies"></div>'+
    '<div><label>Required qty</label><input id="slaNewEqQty" type="number" min="1" value="1" class="m-inp"></div>'+
    '<div><label>Next due</label><input id="slaNewEqDue" type="date" class="m-inp"></div>'+
    '</div>'+
    '<div class="sla-actions">'+
    '<button type="button" class="m-btn m-btn-gold" onclick="slaCommitNewEquip()">Add to this client</button>'+
    '<button type="button" class="m-btn m-btn-grey" onclick="slaToggleAddBox(\\''+'equip'+'\\',false)">Cancel</button>'+
    '</div></div>'+
    '<div class="mtblwrap"><table class="sla-tbl"><thead><tr><th>Equipment (edit name)</th><th>Req</th><th>Issued</th><th>Next due</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead><tbody id="slaEqBody"></tbody></table></div>'+
    '</div>'+

    '<div class="sla-panel" id="slaOpPanel">'+
    '<div class="sla-panel-h"><h3>4 · Operational compliance<span class="sla-count" id="slaOpCount">'+opN+'</span></h3></div>'+
    '<p class="sla-note">Same idea: pick standard SLA compliances (visits, training, survey, fire drill…), add your own, edit, or delete.</p>'+
    '<div class="sla-toolbar">'+
    '<button type="button" class="m-btn m-btn-gold" onclick="slaOpenPicker(\\''+'ops'+'\\')">📋 Pick from SLA list</button>'+
    '<button type="button" class="m-btn m-btn-grey" onclick="slaToggleAddBox(\\''+'ops'+'\\')">+ Add new compliance</button>'+
    '<button type="button" class="m-btn m-btn-grey" onclick="slaClearOps()">Clear all compliances</button>'+
    '</div>'+
    '<div id="slaAddOpBox" class="sla-add-box">'+
    '<div class="sla-grid">'+
    '<div><label>Compliance name</label><input id="slaNewOpName" class="m-inp" placeholder="e.g. Monthly management meeting"></div>'+
    '<div><label>Required / period</label><input id="slaNewOpReq" type="number" min="1" value="1" class="m-inp"></div>'+
    '<div><label>Every (months)</label><input id="slaNewOpEvery" type="number" min="1" value="1" class="m-inp"></div>'+
    '<div><label>Next due</label><input id="slaNewOpDue" type="date" class="m-inp"></div>'+
    '</div>'+
    '<div class="sla-actions">'+
    '<button type="button" class="m-btn m-btn-gold" onclick="slaCommitNewOps()">Add to this client</button>'+
    '<button type="button" class="m-btn m-btn-grey" onclick="slaToggleAddBox(\\''+'ops'+'\\',false)">Cancel</button>'+
    '</div></div>'+
    '<div class="mtblwrap"><table class="sla-tbl"><thead><tr><th>Compliance (edit name)</th><th>Req</th><th>Done</th><th>Next due</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead><tbody id="slaOpBody"></tbody></table></div>'+
    '</div>'+

    '<div class="sla-panel">'+
    '<div class="sla-panel-h"><h3>5 · Payment terms &amp; penalty conditions</h3></div>'+
    '<p class="sla-note">Note from the agreement (or filled by Analyse). Edit freely.</p>'+
    '<label>Payment terms</label>'+
    '<textarea id="slaPay" class="m-inp" rows="4" style="width:100%" oninput="SLA_CUR.paymentTerms=this.value" placeholder="e.g. Invoice within 7 days · Payment in 30 days · TDS / GST notes…">'+h(r.paymentTerms||'')+'</textarea>'+
    '<label style="margin-top:10px;display:block">Penalty conditions</label>'+
    '<textarea id="slaPen" class="m-inp" rows="4" style="width:100%" oninput="SLA_CUR.penaltyConditions=this.value" placeholder="e.g. LD / deductions for absenteeism, late deployment, missed visits…">'+h(r.penaltyConditions||'')+'</textarea>'+
    '</div>'+

    '<div class="sla-panel">'+
    '<div class="sla-panel-h"><h3>6 · Share by mail</h3></div>'+
    '<p class="sla-note">Enter the recipient email. <b>Lokesh</b> and <b>Director</b> are always copied.</p>'+
    '<div class="sla-grid">'+
    '<div style="grid-column:1/-1"><label>To email</label><input id="slaShareTo" class="m-inp" type="email" placeholder="name@company.com" autocomplete="email"></div>'+
    '</div>'+
    '<div class="sla-actions">'+
    '<button type="button" class="m-btn m-btn-gold" onclick="slaShareMail()">✉ Share SLA by mail</button>'+
    '</div>'+
    '</div>'+

    '<div class="sla-actions" style="margin-top:16px">'+
    '<button type="button" class="m-btn m-btn-gold" onclick="slaSave()">💾 Save Client-wise SLA</button>'+
    '<button type="button" class="m-btn m-btn-grey" onclick="slaCancelEdit()">Cancel</button>'+
    (r.id?'<button type="button" class="m-btn" style="background:#dc2626" onclick="slaDelete()">Delete client SLA</button>':'')+
    '</div>'+
    '<div id="slaMsg" class="sla-note"></div>'+
    '</div>';
  if(el('slaClient')&&r.clientId)el('slaClient').value=r.clientId;
  else if(el('slaClient')&&r.clientName){
    for(var i=0;i<el('slaClient').options.length;i++){
      if(el('slaClient').options[i].getAttribute('data-name')===r.clientName){el('slaClient').selectedIndex=i;break;}
    }
  }
  if(el('slaNewEqDue')&&r.agreementFrom)el('slaNewEqDue').value=r.agreementFrom;
  if(el('slaNewOpDue')&&r.agreementFrom)el('slaNewOpDue').value=r.agreementFrom;
  slaPaintEquip();
  slaPaintOps();
  slaPaintPreview(r.agreementText||'');
  try{if(typeof suiteDateInputInit==='function')suiteDateInputInit();}catch(e){}
  try{root.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){}
}
function slaUpdateCounts(){
  if(el('slaEqCount'))el('slaEqCount').textContent=String((SLA_CUR&&SLA_CUR.equipment||[]).length);
  if(el('slaOpCount'))el('slaOpCount').textContent=String((SLA_CUR&&SLA_CUR.operations||[]).length);
}
function slaPaintEquip(){
  var body=el('slaEqBody');if(!body||!SLA_CUR)return;
  body.innerHTML=(SLA_CUR.equipment||[]).map(function(e,i){
    return '<tr id="slaEqRow_'+i+'">'+
      '<td><input class="m-inp name-inp" value="'+h(e.name||'')+'" oninput="SLA_CUR.equipment['+i+'].name=this.value" placeholder="Equipment name"><br><small style="color:#64748b">'+h(e.category||'Custom')+'</small></td>'+
      '<td><input type="number" min="0" value="'+(e.requiredQty||0)+'" oninput="SLA_CUR.equipment['+i+'].requiredQty=Number(this.value)||0"></td>'+
      '<td><input type="number" min="0" value="'+(e.issuedQty||0)+'" oninput="SLA_CUR.equipment['+i+'].issuedQty=Number(this.value)||0"></td>'+
      '<td><input type="date" value="'+h(e.nextDueDate||'')+'" onchange="SLA_CUR.equipment['+i+'].nextDueDate=this.value"></td>'+
      '<td><select onchange="SLA_CUR.equipment['+i+'].status=this.value">'+
      [['pending','Pending'],['partial','Partial'],['issued','Issued'],['na','N/A']].map(function(s){return '<option value="'+s[0]+'"'+(e.status===s[0]?' selected':'')+'>'+s[1]+'</option>';}).join('')+
      '</select></td>'+
      '<td><input value="'+h(e.notes||'')+'" oninput="SLA_CUR.equipment['+i+'].notes=this.value" placeholder="Notes"></td>'+
      '<td><div class="sla-row-btns">'+
      '<button type="button" class="m-btn m-btn-grey" onclick="slaFocusEquip('+i+')">Edit</button>'+
      '<button type="button" class="m-btn" style="background:#dc2626" onclick="slaRmEquip('+i+')">Delete</button>'+
      '</div></td></tr>';
  }).join('')||'<tr><td colspan="7" class="hint">No equipment yet — use <b>Pick from master list</b> or <b>Add new equipment</b>.</td></tr>';
  slaUpdateCounts();
}
function slaPaintOps(){
  var body=el('slaOpBody');if(!body||!SLA_CUR)return;
  body.innerHTML=(SLA_CUR.operations||[]).map(function(o,i){
    return '<tr id="slaOpRow_'+i+'">'+
      '<td><input class="m-inp name-inp" value="'+h(o.label||'')+'" oninput="SLA_CUR.operations['+i+'].label=this.value" placeholder="Compliance name"></td>'+
      '<td><input type="number" min="0" value="'+(o.requiredCount||0)+'" oninput="SLA_CUR.operations['+i+'].requiredCount=Number(this.value)||0"></td>'+
      '<td><input type="number" min="0" value="'+(o.doneCount||0)+'" oninput="SLA_CUR.operations['+i+'].doneCount=Number(this.value)||0"></td>'+
      '<td><input type="date" value="'+h(o.nextDueDate||'')+'" onchange="SLA_CUR.operations['+i+'].nextDueDate=this.value"></td>'+
      '<td><select onchange="SLA_CUR.operations['+i+'].status=this.value">'+
      [['pending','Pending'],['done','Done'],['overdue','Overdue'],['na','N/A']].map(function(s){return '<option value="'+s[0]+'"'+(o.status===s[0]?' selected':'')+'>'+s[1]+'</option>';}).join('')+
      '</select></td>'+
      '<td><input value="'+h(o.notes||'')+'" oninput="SLA_CUR.operations['+i+'].notes=this.value" placeholder="Notes"></td>'+
      '<td><div class="sla-row-btns">'+
      '<button type="button" class="m-btn m-btn-grey" onclick="slaFocusOps('+i+')">Edit</button>'+
      '<button type="button" class="m-btn" style="background:#dc2626" onclick="slaRmOps('+i+')">Delete</button>'+
      '</div></td></tr>';
  }).join('')||'<tr><td colspan="7" class="hint">No compliances yet — use <b>Pick from SLA list</b> or <b>Add new compliance</b>.</td></tr>';
  slaUpdateCounts();
}
function slaFocusEquip(i){
  var row=el('slaEqRow_'+i);if(!row)return;
  var inp=row.querySelector('.name-inp');
  if(inp){inp.focus();inp.select();}
  try{row.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){}
}
function slaFocusOps(i){
  var row=el('slaOpRow_'+i);if(!row)return;
  var inp=row.querySelector('.name-inp');
  if(inp){inp.focus();inp.select();}
  try{row.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){}
}
function slaToggleAddBox(kind,force){
  var box=el(kind==='ops'?'slaAddOpBox':'slaAddEqBox');
  if(!box)return;
  var open=force===true?true:force===false?false:!box.classList.contains('open');
  box.classList.toggle('open',open);
  if(open){
    var inp=el(kind==='ops'?'slaNewOpName':'slaNewEqName');
    if(inp)inp.focus();
  }
}
function slaCommitNewEquip(){
  if(!SLA_CUR)return;
  var name=(el('slaNewEqName')&&el('slaNewEqName').value||'').trim();
  if(!name){slaMsg('Enter equipment name',false);return;}
  var qty=Number(el('slaNewEqQty')&&el('slaNewEqQty').value)||1;
  var due=(el('slaNewEqDue')&&el('slaNewEqDue').value)||SLA_CUR.agreementFrom||'';
  SLA_CUR.equipment=SLA_CUR.equipment||[];
  SLA_CUR.equipment.push({key:'custom-'+Date.now(),name:name,category:'Custom',requiredQty:qty,issuedQty:0,nextDueDate:due,status:'pending',notes:''});
  if(el('slaNewEqName'))el('slaNewEqName').value='';
  slaToggleAddBox('equip',false);
  slaPaintEquip();
  slaMsg('Equipment added — edit numbers if needed, then Save.',true);
}
function slaCommitNewOps(){
  if(!SLA_CUR)return;
  var name=(el('slaNewOpName')&&el('slaNewOpName').value||'').trim();
  if(!name){slaMsg('Enter compliance name',false);return;}
  var req=Number(el('slaNewOpReq')&&el('slaNewOpReq').value)||1;
  var every=Number(el('slaNewOpEvery')&&el('slaNewOpEvery').value)||1;
  var due=(el('slaNewOpDue')&&el('slaNewOpDue').value)||SLA_CUR.agreementFrom||'';
  SLA_CUR.operations=SLA_CUR.operations||[];
  SLA_CUR.operations.push({key:'custom-op-'+Date.now(),label:name,frequency:'monthly',everyMonths:every,requiredCount:req,doneCount:0,lastDoneDate:'',nextDueDate:due,status:'pending',notes:''});
  if(el('slaNewOpName'))el('slaNewOpName').value='';
  slaToggleAddBox('ops',false);
  slaPaintOps();
  slaMsg('Compliance added — edit if needed, then Save.',true);
}
function slaRmEquip(i){
  if(!SLA_CUR)return;
  var name=(SLA_CUR.equipment[i]&&SLA_CUR.equipment[i].name)||'this item';
  if(!confirm('Delete equipment: '+name+' ?'))return;
  SLA_CUR.equipment.splice(i,1);
  slaPaintEquip();
}
function slaRmOps(i){
  if(!SLA_CUR)return;
  var name=(SLA_CUR.operations[i]&&SLA_CUR.operations[i].label)||'this item';
  if(!confirm('Delete compliance: '+name+' ?'))return;
  SLA_CUR.operations.splice(i,1);
  slaPaintOps();
}
function slaClearEquip(){
  if(!SLA_CUR||!(SLA_CUR.equipment||[]).length)return;
  if(!confirm('Clear ALL equipment lines for this client?'))return;
  SLA_CUR.equipment=[];
  slaPaintEquip();
}
function slaClearOps(){
  if(!SLA_CUR||!(SLA_CUR.operations||[]).length)return;
  if(!confirm('Clear ALL operational compliances for this client?'))return;
  SLA_CUR.operations=[];
  slaPaintOps();
}
function slaOpenPicker(kind){
  SLA_PICK_KIND=kind;
  var host=el('slaModalHost');if(!host||!SLA_CUR)return;
  var title=kind==='ops'?'Pick operational compliances':'Pick security equipment';
  var selected={};
  if(kind==='ops')(SLA_CUR.operations||[]).forEach(function(o){selected[o.key]=true;});
  else (SLA_CUR.equipment||[]).forEach(function(e){selected[e.key]=true;});
  host.innerHTML=
    '<div class="sla-modal-bg" onclick="if(event.target===this)slaClosePicker()">'+
    '<div class="sla-modal" onclick="event.stopPropagation()">'+
    '<h3>'+h(title)+'</h3>'+
    '<p class="sla-note" style="margin-top:0">Tick items mentioned in the agreement. Already on this client are pre-ticked. Search to find faster.</p>'+
    '<input id="slaPickSearch" class="m-inp" placeholder="Search…" oninput="slaFilterPicker()" style="margin-bottom:8px">'+
    '<div class="sla-pick-list" id="slaPickList"></div>'+
    '<div class="sla-actions">'+
    '<button type="button" class="m-btn m-btn-gold" onclick="slaApplyPicker()">Apply to this client</button>'+
    '<button type="button" class="m-btn m-btn-grey" onclick="slaClosePicker()">Cancel</button>'+
    '<span id="slaPickMeta" class="sla-note" style="margin:0"></span>'+
    '</div></div></div>';
  slaRenderPickerRows(selected);
  if(el('slaPickSearch'))el('slaPickSearch').focus();
}
function slaClosePicker(){var host=el('slaModalHost');if(host)host.innerHTML='';SLA_PICK_KIND='';}
function slaRenderPickerRows(selected){
  var list=el('slaPickList');if(!list)return;
  selected=selected||{};
  var q=((el('slaPickSearch')&&el('slaPickSearch').value)||'').trim().toLowerCase();
  var html='';
  if(SLA_PICK_KIND==='ops'){
    var ops=(SLA_CAT.operations||[]).filter(function(it){return !q||String(it.label).toLowerCase().indexOf(q)>=0;});
    html=ops.map(function(it){
      return '<label class="sla-pick-row"><input type="checkbox" data-key="'+h(it.key)+'"'+(selected[it.key]?' checked':'')+'> <span><b>'+h(it.label)+'</b><br><small style="color:#94a3b8">'+h(it.hint||it.frequency||'')+'</small></span></label>';
    }).join('')||'<p class="sla-note">No match.</p>';
  }else{
    var g={},order=[];
    (SLA_CAT.equipment||[]).forEach(function(it){
      if(q&&String(it.name).toLowerCase().indexOf(q)<0&&String(it.category).toLowerCase().indexOf(q)<0)return;
      if(!g[it.category]){g[it.category]=[];order.push(it.category);}
      g[it.category].push(it);
    });
    html=order.map(function(cat){
      return '<div class="sla-pick-cat">'+h(cat)+'</div>'+g[cat].map(function(it){
        return '<label class="sla-pick-row"><input type="checkbox" data-key="'+h(it.key)+'"'+(selected[it.key]?' checked':'')+'> <span>'+h(it.name)+'</span></label>';
      }).join('');
    }).join('')||'<p class="sla-note">No match.</p>';
  }
  list.innerHTML=html;
  slaPickerCount();
  list.querySelectorAll('input[type=checkbox]').forEach(function(cb){cb.addEventListener('change',slaPickerCount);});
}
function slaFilterPicker(){
  var selected={};
  document.querySelectorAll('#slaPickList input[type=checkbox]').forEach(function(cb){if(cb.checked)selected[cb.getAttribute('data-key')]=true;});
  slaRenderPickerRows(selected);
}
function slaPickerCount(){
  var n=document.querySelectorAll('#slaPickList input[type=checkbox]:checked').length;
  if(el('slaPickMeta'))el('slaPickMeta').textContent=n+' selected';
}
function slaApplyPicker(){
  if(!SLA_CUR)return;
  var keys=[];
  document.querySelectorAll('#slaPickList input[type=checkbox]:checked').forEach(function(cb){keys.push(cb.getAttribute('data-key'));});
  if(SLA_PICK_KIND==='ops'){
    var keep={};(SLA_CUR.operations||[]).forEach(function(o){keep[o.key]=o;});
    var next=[];
    keys.forEach(function(k){
      if(keep[k]){next.push(keep[k]);return;}
      var it=(SLA_CAT.operations||[]).find(function(x){return x.key===k;});
      if(!it)return;
      next.push({key:it.key,label:it.label,frequency:it.frequency,everyMonths:it.everyMonths,requiredCount:1,doneCount:0,lastDoneDate:'',nextDueDate:SLA_CUR.agreementFrom||'',status:'pending',notes:''});
    });
    // keep custom items not in catalog even if unchecked? User unchecked = remove from list for catalog keys only; keep customs always
    (SLA_CUR.operations||[]).forEach(function(o){
      if(String(o.key||'').indexOf('custom-')===0&&!next.some(function(x){return x.key===o.key;}))next.push(o);
    });
    SLA_CUR.operations=next;
    slaPaintOps();
  }else{
    var keepE={};(SLA_CUR.equipment||[]).forEach(function(e){keepE[e.key]=e;});
    var nextE=[];
    keys.forEach(function(k){
      if(keepE[k]){nextE.push(keepE[k]);return;}
      var it=(SLA_CAT.equipment||[]).find(function(x){return x.key===k;});
      if(!it)return;
      nextE.push({key:it.key,name:it.name,category:it.category,requiredQty:1,issuedQty:0,nextDueDate:SLA_CUR.agreementFrom||'',status:'pending',notes:''});
    });
    (SLA_CUR.equipment||[]).forEach(function(e){
      if(String(e.key||'').indexOf('custom-')===0&&!nextE.some(function(x){return x.key===e.key;}))nextE.push(e);
    });
    SLA_CUR.equipment=nextE;
    slaPaintEquip();
  }
  slaClosePicker();
  slaMsg('List updated — edit numbers, then Save.',true);
}
function slaFileToBase64(file,cb){
  var reader=new FileReader();
  reader.onload=function(){
    var s=String(reader.result||'');
    var i=s.indexOf('base64,');
    cb(i>=0?s.slice(i+7):s);
  };
  reader.onerror=function(){slaMsg('Could not read file',false);};
  reader.readAsDataURL(file);
}
function slaMimeGuess(name){
  var n=String(name||'').toLowerCase();
  if(n.endsWith('.pdf'))return 'application/pdf';
  if(n.endsWith('.docx'))return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if(n.endsWith('.doc'))return 'application/msword';
  if(n.endsWith('.png'))return 'image/png';
  if(n.endsWith('.jpg')||n.endsWith('.jpeg'))return 'image/jpeg';
  if(n.endsWith('.webp'))return 'image/webp';
  if(n.endsWith('.txt'))return 'text/plain';
  return '';
}
function slaReadFile(){
  var f=el('slaFile')&&el('slaFile').files&&el('slaFile').files[0];
  if(!f){slaMsg('Choose a PDF, Word or image file first',false);return;}
  if(f.size>4*1024*1024){slaMsg('File too large (max 4 MB). Paste text instead.',false);return;}
  slaMsg('Reading document…');
  slaFileToBase64(f,function(b64){
    slaApi('readAgreement',{fileName:f.name,mimeType:f.type||slaMimeGuess(f.name),base64:b64}).then(function(res){
      if(res.status!==200){slaMsg((res.body&&res.body.error)||'Could not read',false);return;}
      SLA_CUR.agreementText=res.body.text||'';
      SLA_CUR.agreementFileName=f.name;
      if(el('slaText'))el('slaText').value=SLA_CUR.agreementText;
      slaPaintPreview(SLA_CUR.agreementText);
      slaMsg('Document read ('+(res.body.method||'')+'). Use Find, then Analyse SLA.',true);
    });
  });
}
function slaAnalyse(){
  if(!SLA_CUR)return;
  var text=(el('slaText')&&el('slaText').value)||SLA_CUR.agreementText||'';
  SLA_CUR.agreementText=text;
  SLA_CUR.agreementFrom=el('slaFrom')?el('slaFrom').value:SLA_CUR.agreementFrom;
  if(text.trim().length<40){slaMsg('Paste agreement text or Read a file first',false);return;}
  slaMsg('Analysing SLA…');
  slaApi('analyseAgreement',{text:text,agreementFrom:SLA_CUR.agreementFrom}).then(function(res){
    if(res.status!==200){slaMsg((res.body&&res.body.error)||'Analyse failed',false);return;}
    var eq=res.body.equipment||[],op=res.body.operations||[];
    var eqMap={};(SLA_CUR.equipment||[]).forEach(function(e){eqMap[e.key]=e;});
    eq.forEach(function(e){if(!eqMap[e.key])eqMap[e.key]=e;});
    SLA_CUR.equipment=Object.keys(eqMap).map(function(k){return eqMap[k];});
    var opMap={};(SLA_CUR.operations||[]).forEach(function(o){opMap[o.key]=o;});
    op.forEach(function(o){if(!opMap[o.key])opMap[o.key]=o;});
    SLA_CUR.operations=Object.keys(opMap).map(function(k){return opMap[k];});
    if(res.body.paymentTerms){
      SLA_CUR.paymentTerms=SLA_CUR.paymentTerms?SLA_CUR.paymentTerms+'\\n'+res.body.paymentTerms:res.body.paymentTerms;
      if(el('slaPay'))el('slaPay').value=SLA_CUR.paymentTerms;
    }
    if(res.body.penaltyConditions){
      SLA_CUR.penaltyConditions=SLA_CUR.penaltyConditions?SLA_CUR.penaltyConditions+'\\n'+res.body.penaltyConditions:res.body.penaltyConditions;
      if(el('slaPen'))el('slaPen').value=SLA_CUR.penaltyConditions;
    }
    slaPaintEquip();slaPaintOps();
    slaMsg('Filled from agreement ('+(res.body.method||'')+'). Review lists, payment &amp; penalty, then Save. '+(res.body.notes||''),true);
  });
}
function slaPaintPreview(text){
  var box=el('slaPreview');if(!box)return;
  var paras=String(text||'').split(/\\n+/).map(function(p){return p.trim();}).filter(Boolean);
  if(!paras.length&&text)paras=[String(text)];
  SLA_PREVIEW={paras:paras,hits:[],idx:0};
  box.innerHTML=paras.map(function(p,i){return '<div class="sla-para" id="slaPara_'+i+'">'+h(p)+'</div>';}).join('')||'<span class="sla-note">No text yet</span>';
}
function slaDocSearch(){
  var q=(el('slaSearch')&&el('slaSearch').value||'').trim();
  var meta=el('slaSearchMeta');
  if(!q){if(meta)meta.textContent='';return;}
  if(!SLA_PREVIEW.paras.length){
    var t=(el('slaText')&&el('slaText').value)||'';
    slaPaintPreview(t);
  }
  if(!SLA_PREVIEW.paras.length){if(meta)meta.textContent='Read or paste text first';return;}
  var qlow=q.toLowerCase(),hits=[];
  SLA_PREVIEW.paras.forEach(function(p,i){
    var plow=p.toLowerCase(),pos=0;
    while((pos=plow.indexOf(qlow,pos))>=0){hits.push({para:i,start:pos,end:pos+q.length});pos+=q.length||1;}
  });
  SLA_PREVIEW.hits=hits;SLA_PREVIEW.idx=0;
  SLA_PREVIEW.paras.forEach(function(p,i){
    var node=el('slaPara_'+i);if(!node)return;
    var marked=p;
    var phits=hits.filter(function(hh){return hh.para===i;}).sort(function(a,b){return b.start-a.start;});
    phits.forEach(function(hh){
      marked=marked.slice(0,hh.start)+'<mark>'+h(marked.slice(hh.start,hh.end))+'</mark>'+marked.slice(hh.end);
    });
    node.innerHTML=marked;node.classList.remove('srch');
  });
  if(hits.length){
    var n0=el('slaPara_'+hits[0].para);if(n0){n0.classList.add('srch');try{n0.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){}}
    if(meta)meta.textContent='1 / '+hits.length;
  }else if(meta)meta.textContent='Not found';
}
function slaDocSearchNext(dir){
  var hits=SLA_PREVIEW.hits||[];if(!hits.length)return;
  SLA_PREVIEW.idx=(SLA_PREVIEW.idx+(dir||1)+hits.length)%hits.length;
  document.querySelectorAll('#slaPreview .sla-para').forEach(function(n){n.classList.remove('srch');});
  var hit=hits[SLA_PREVIEW.idx],n=el('slaPara_'+hit.para),meta=el('slaSearchMeta');
  if(n){n.classList.add('srch');try{n.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){}}
  if(meta)meta.textContent=(SLA_PREVIEW.idx+1)+' / '+hits.length;
}
function slaGather(){
  if(!SLA_CUR)return null;
  slaOnClient();
  SLA_CUR.location=el('slaLoc')?el('slaLoc').value:SLA_CUR.location;
  SLA_CUR.agreementFrom=el('slaFrom')?el('slaFrom').value:SLA_CUR.agreementFrom;
  SLA_CUR.agreementTo=el('slaTo')?el('slaTo').value:SLA_CUR.agreementTo;
  SLA_CUR.agreementText=el('slaText')?el('slaText').value:SLA_CUR.agreementText;
  SLA_CUR.paymentTerms=el('slaPay')?el('slaPay').value:SLA_CUR.paymentTerms;
  SLA_CUR.penaltyConditions=el('slaPen')?el('slaPen').value:SLA_CUR.penaltyConditions;
  SLA_CUR.remindersOn=el('slaRem')?el('slaRem').value==='1':true;
  return SLA_CUR;
}
function slaShareMail(){
  var rec=slaGather();if(!rec)return;
  var to=(el('slaShareTo')&&el('slaShareTo').value||'').trim();
  if(!to||to.indexOf('@')<0){slaMsg('Enter the To email address',false);return;}
  if(!rec.clientId&&!rec.clientName){slaMsg('Select client first',false);return;}
  if(!rec.location){slaMsg('Enter location first',false);return;}
  slaMsg('Saving, then sending mail…');
  slaApi('save',{record:rec}).then(function(res){
    if(res.status!==200){slaMsg((res.body&&res.body.error)||'Save failed — mail not sent',false);return;}
    SLA_CUR=res.body.record;
    return slaApi('shareMail',{id:SLA_CUR.id,to:to,record:SLA_CUR}).then(function(m){
      if(m.status!==200){slaMsg((m.body&&m.body.error)||'Could not send mail',false);return;}
      slaMsg('Mail sent to '+to+' · CC Director ✓',true);
    });
  });
}
function slaSave(){
  var rec=slaGather();if(!rec)return;
  if(!rec.clientId&&!rec.clientName){slaMsg('Select client',false);return;}
  if(!rec.location){slaMsg('Enter location',false);return;}
  slaMsg('Saving…');
  slaApi('save',{record:rec}).then(function(res){
    if(res.status!==200){slaMsg((res.body&&res.body.error)||'Save failed',false);return;}
    SLA_CUR=res.body.record;
    slaMsg('Saved ✓',true);
    slaBoot();
  });
}
function slaDelete(){
  if(!SLA_CUR||!SLA_CUR.id)return;
  if(!confirm('Delete this client SLA record?'))return;
  slaApi('delete',{id:SLA_CUR.id}).then(function(res){
    if(res.status!==200){slaMsg((res.body&&res.body.error)||'Delete failed',false);return;}
    SLA_CUR=null;slaMsg('Deleted',true);slaBoot();
  });
}
function slaCancelEdit(){SLA_CUR=null;var ed=el('slaEditor');if(ed)ed.innerHTML='';slaClosePicker();}
`
