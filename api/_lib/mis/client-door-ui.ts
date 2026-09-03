import { suiteMgmtBranchOptionsJs } from '../suite-mgmt-branch-select.js'

export type ClientDoorPageOpts = {
  portal: 'mgmt' | 'staff'
  activePath: string
  title: string
}

export function clientDoorInnerHtml(opts: ClientDoorPageOpts): string {
  const isMgmt = opts.portal === 'mgmt'
  const branchPick = isMgmt
    ? '<div><label class="m-lbl">Branch</label><select class="m-inp" id="branchSel"></select></div>'
    : ''
  return `
<div class="m-wrap">
  <div class="m-card">
    <h3>Client Door</h3>
    <p class="hint">Strategic clients (Apex) only. All states stay on this list (even from Hyderabad-A). HDFC / Canara / IDBI are state-wise: <b>Telangana</b> = Hyderabad-A + Hyderabad-B · <b>Andhra Pradesh</b> = Vizag, Kakinada, Vijayawada, Nellore, Tirupati, Tada. Other Apex clients are one row. Daily MIS is not changed.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:10px">
      ${branchPick}
      <div><label class="m-lbl">Strategic client book</label><select class="m-inp" id="clientSel"></select></div>
    </div>
    <div class="m-actions" style="margin-top:14px">
      <button type="button" class="m-btn m-btn-navy" id="btnPreview">Preview</button>
      <button type="button" class="m-btn m-btn-gold" id="btnSend">Send</button>
    </div>
    <p class="hint" id="doorMsg" style="margin-top:10px"></p>
  </div>
  <div class="m-card">
    <h4>Strategic clients (Apex)</h4>
    <p class="hint">HDFC · Canara · IDBI = one row per state. Other clients = one row. Add, edit or delete emails. Opened date and time is recorded when they open Client Door.</p>
    <div class="mtblwrap"><table class="mtbl"><thead><tr><th>Client</th><th>Club</th><th>Sites</th><th>Emails</th><th>Opened</th><th></th></tr></thead><tbody id="doorRows"></tbody></table></div>
  </div>
</div>`
}

export function clientDoorScript(opts: ClientDoorPageOpts): string {
  const apiUrl = opts.portal === 'mgmt' ? '/api/mis/admin-data' : '/api/mis/staff-data'
  const isMgmt = opts.portal === 'mgmt'
  return `
${suiteMgmtBranchOptionsJs()}
var DOOR_SITES=[];
var DOOR_BRANCHES=[];
function doorEl(id){return document.getElementById(id);}
function doorApi(action,extra){
  var payload=Object.assign({action:action},extra||{});
  ${
    isMgmt
      ? `return fetch('${apiUrl}',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(function(r){return r.json().then(function(j){return{status:r.status,body:j};});});`
      : `return staffApi(action,extra);`
  }
}
function doorMsg(t){var m=doorEl('doorMsg');if(m)m.textContent=t||'';}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');}
function siteEmails(s){return (s&&s.emails&&s.emails.length)?s.emails:String(s&&s.clientEmail||'').split(/[,;\\s]+/).filter(Boolean);}
function fillClients(){
  var list=DOOR_SITES.slice();
  var sel=doorEl('clientSel');
  if(!sel)return;
  sel.innerHTML='<option value="">Select client book</option>'+list.map(function(s){
    return '<option value="'+s.id+'">'+esc(s.name||s.groupLabel)+(s.location?' ('+esc(s.location)+')':'')+'</option>';
  }).join('');
  doorEl('doorRows').innerHTML=list.map(function(s){
    var mails=siteEmails(s);
    var mailHtml=mails.map(function(e){
      return '<div style="margin:4px 0">'+esc(e)+
        ' <button type="button" class="m-btn" data-door="edit" data-id="'+esc(s.id)+'" data-email="'+esc(e)+'">Edit</button>'+
        ' <button type="button" class="m-btn" data-door="del" data-id="'+esc(s.id)+'" data-email="'+esc(e)+'">Delete</button></div>';
    }).join('')||'<span class="hint">No email</span>';
    mailHtml+='<div style="margin-top:6px"><button type="button" class="m-btn m-btn-navy" data-door="add" data-id="'+esc(s.id)+'">Add email</button></div>';
    return '<tr><td>'+esc(s.groupLabel)+'</td><td>'+esc(s.branchName||'All sites')+'</td><td>'+esc(s.location||'—')+
      '</td><td>'+mailHtml+'</td><td>'+esc(s.lastOpenedLabel||'—')+
      '</td><td><button type="button" class="m-btn m-btn-navy" data-door="preview" data-id="'+esc(s.id)+'">Preview</button> '+
      '<button type="button" class="m-btn m-btn-gold" data-door="send" data-id="'+esc(s.id)+'">Send</button></td></tr>';
  }).join('')||'<tr><td colspan="6" class="hint">No strategic client books on this list.</td></tr>';
}
function selectedId(){return doorEl('clientSel')?doorEl('clientSel').value:'';}
function siteById(id){return DOOR_SITES.filter(function(x){return x.id===id;})[0];}
function firstEmail(s){var m=siteEmails(s);return m[0]||'';}
function bootDoor(){
  doorMsg('Loading…');
  doorApi('clientDoorBoot'${isMgmt ? `,{branchId:(doorEl('branchSel')&&doorEl('branchSel').value)||'ALL'}` : ''}).then(function(res){
    if(res.status===401){doorMsg(res.body.error||'Please sign in.');return;}
    if(res.status!==200){doorMsg(res.body.error||'Could not load.');return;}
    DOOR_SITES=res.body.sites||[];
    DOOR_BRANCHES=res.body.branches||[];
    ${
      isMgmt
        ? `var sel=doorEl('branchSel');if(sel&&!sel.getAttribute('data-ready')){sel.innerHTML=suiteMgmtBranchOptionsHtml(DOOR_BRANCHES,'ALL');sel.setAttribute('data-ready','1');sel.onchange=function(){bootDoor();};}`
        : ''
    }
    fillClients();
    doorMsg('');
  }).catch(function(){doorMsg('Network error.');});
}
function previewDoor(id){
  id=id||selectedId();
  var s=siteById(id);
  var email=firstEmail(s);
  if(!id){doorMsg('Pick a strategic client.');return;}
  if(!email){doorMsg('Add a client email first.');return;}
  doorMsg('Preparing preview…');
  doorApi('clientDoorPreview',{clientId:id,email:email}).then(function(res){
    if(res.status!==200){doorMsg(res.body.error||'Preview failed.');return;}
    var w=window.open('','_blank');
    if(w){w.document.write(res.body.html||'');w.document.close();}
    doorMsg('Preview opened.');
  });
}
function sendDoor(id){
  id=id||selectedId();
  var s=siteById(id);
  var email=firstEmail(s);
  if(!id){doorMsg('Pick a strategic client.');return;}
  if(!email){doorMsg('Add a client email first.');return;}
  if(!confirm('Send Client Door to '+siteEmails(s).join(', ')+'?'))return;
  doorMsg('Sending…');
  doorApi('clientDoorSend',{clientId:id,email:siteEmails(s).join(', ')}).then(function(res){
    if(res.status===200){doorMsg('Sent ✓');bootDoor();}
    else doorMsg(res.body.error||'Could not send.');
  });
}
function addEmail(id){
  var email=prompt('Client work email');
  if(!email)return;
  doorApi('clientDoorAddEmail',{clientId:id,email:email}).then(function(res){
    if(res.status===200){doorMsg('Email added.');bootDoor();}
    else doorMsg(res.body.error||'Could not add email.');
  });
}
function editEmail(id,from){
  var to=prompt('New email',from);
  if(!to||to===from)return;
  doorApi('clientDoorEditEmail',{clientId:id,from:from,to:to}).then(function(res){
    if(res.status===200){doorMsg('Email updated.');bootDoor();}
    else doorMsg(res.body.error||'Could not edit email.');
  });
}
function delEmail(id,email){
  if(!confirm('Delete '+email+'?'))return;
  doorApi('clientDoorDeleteEmail',{clientId:id,email:email}).then(function(res){
    if(res.status===200){doorMsg('Email deleted.');bootDoor();}
    else doorMsg(res.body.error||'Could not delete email.');
  });
}
function onDoorClick(ev){
  var t=ev.target;
  if(!t||!t.dataset)return;
  var act=t.dataset.door;
  if(!act)return;
  var id=t.dataset.id||'';
  var email=t.dataset.email||'';
  if(act==='preview')previewDoor(id);
  else if(act==='send')sendDoor(id);
  else if(act==='add')addEmail(id);
  else if(act==='edit')editEmail(id,email);
  else if(act==='del')delEmail(id,email);
}
function initClientDoor(){
  var p=doorEl('btnPreview');if(p)p.onclick=function(){previewDoor('');};
  var s=doorEl('btnSend');if(s)s.onclick=function(){sendDoor('');};
  var rows=doorEl('doorRows');
  if(rows)rows.addEventListener('click',onDoorClick);
  bootDoor();
}
`
}
