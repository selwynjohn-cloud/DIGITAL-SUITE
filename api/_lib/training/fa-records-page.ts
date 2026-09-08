import { suiteMgmtBranchOptionsJs } from '../suite-mgmt-branch-select.js'
import { FA_ADVISORY_URL } from './fa-advisory-i18n.js'
import { FA_PUBLIC_URL } from './fa-i18n.js'
import { trainingPageHtml } from './training-shell.js'

export function faRecordsPageHtml(): string {
  const publicUrl = JSON.stringify(FA_PUBLIC_URL)
  const advisoryUrl = JSON.stringify(FA_ADVISORY_URL)
  const body = `
<div class="panel">
  <h1>Facility Attendant Training</h1>
  <p class="muted">HDFC Bank Safety — Learn &amp; Confirm. Share the phone link with Facility Attendants. Completed acknowledgements are saved here and mailed to Branch HOD (Training + Director on copy).</p>

  <h2 class="sec">HDFC Bank — Strategic Client · Compliance Advisory Series</h2>
  <div style="margin:0 0 14px;padding:12px 14px;border-left:4px solid #c8102e;background:#fff8f8;border-radius:0 8px 8px 0">
    <p style="margin:0 0 6px;font-weight:800;color:#14224f">Standing send — use this same page whenever HDFC shares an advisory.</p>
    <p class="muted" style="margin:0">HDFC is a strategic client and they share such notes often (every other day). Save the Name + mobile list once. Send the common advisory link to FAs. After they save: OM Review → HOD Approve → Send report link to HDFC (email IDs). The Bank opens a Training report — quiz answers and training acknowledgements are shown openly. CC Sridhar + Director. This is not Client Door.</p>
  </div>
  <div class="row">
    <label class="wide">Phone list for this branch — Name, Mobile (ID and HDFC site optional)
      <textarea id="advRosterText" placeholder="Ramesh Kumar, 9876543210&#10;Suresh, 9876501234" style="min-height:110px"></textarea>
    </label>
  </div>
  <div class="row">
    <label>Upload CSV / text
      <input type="file" id="advRosterFile" accept=".txt,.csv,.tsv,text/plain">
    </label>
    <button type="button" class="btn primary" id="btnAdvSaveRoster">Save list</button>
  </div>
  <p class="muted" id="advRosterNote">Saved phone list: —</p>
  <div class="row">
    <label>Language
      <select id="advLang"></select>
    </label>
    <label class="wide">HDFC Admin / RSO emails (up to 5)
      <input id="advClientEmails" placeholder="admin@hdfcbank.com, rso@hdfcbank.com">
    </label>
  </div>
  <div class="form-actions">
    <button type="button" class="btn" id="btnAdvPreview">Preview banner</button>
    <button type="button" class="btn primary" id="btnAdvSendWa">Send WhatsApp to all HDFC FAs</button>
  </div>
  <p class="muted" id="advCounts">HDFC Facility Attendants on this branch: —</p>
  <div style="margin:12px 0 14px;padding:12px 14px;border:1px solid #c9a84c;border-radius:10px;background:#fffdf6">
    <p style="margin:0 0 8px;font-weight:800;color:#14224f">Branch pack for HDFC — <span id="packStatus">Collecting</span></p>
    <p class="muted" id="packNote">OM reviews the branch list. HOD approves. Then send the Training report link.</p>
    <div class="row">
      <label>OM name
        <input id="omName" placeholder="Operations Manager name">
      </label>
      <label>HOD name
        <input id="hodName" placeholder="Branch HOD name">
      </label>
    </div>
    <div class="form-actions">
      <button type="button" class="btn" id="btnOmReview">OM Review</button>
      <button type="button" class="btn" id="btnHodApprove">HOD Approve</button>
      <button type="button" class="btn" id="btnAdvPreviewList">Preview HDFC report</button>
      <button type="button" class="btn primary" id="btnAdvSendClient">Send report link to HDFC</button>
    </div>
  </div>
  <div style="overflow:auto;margin-bottom:18px">
    <table>
      <thead><tr>
        <th>Date</th><th>Ack. no.</th><th>Name</th><th>ID</th><th>Branch</th>
        <th>HDFC / SOL</th><th>Mobile</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Score</th>
      </tr></thead>
      <tbody id="advBody"><tr><td colspan="11">Loading…</td></tr></tbody>
    </table>
  </div>

  <div class="row" style="margin-top:12px">
    <label class="wide">Common advisory link for Facility Attendants (quiz + acknowledgement)
      <input id="advShareUrl" value="${FA_ADVISORY_URL.replace(/"/g, '&quot;')}" readonly>
    </label>
  </div>
  <div class="form-actions">
    <button type="button" class="btn primary" id="btnCopyAdvLink">Copy advisory link</button>
    <a class="btn" id="btnWaAdvShare" href="#" target="_blank" rel="noopener">WhatsApp advisory link</a>
    <a class="btn" href="/training/fa-advisory" target="_blank" rel="noopener">Open advisory</a>
  </div>
  <div class="row" style="margin-top:12px">
    <label class="wide">Learn &amp; Confirm training link (3 lessons)
      <input id="faShareUrl" value="${FA_PUBLIC_URL.replace(/"/g, '&quot;')}" readonly>
    </label>
  </div>
  <div class="form-actions">
    <button type="button" class="btn primary" id="btnCopyLink">Copy training link</button>
    <a class="btn" id="btnWaShare" href="#" target="_blank" rel="noopener">WhatsApp this link</a>
    <a class="btn" href="/training/fa" target="_blank" rel="noopener">Open phone page</a>
  </div>

  <h2 class="sec">Completed training acknowledgements</h2>
  <div class="row">
    <label id="faBranchWrap" class="hidden">Branch
      <select id="faBranch"></select>
    </label>
    <label>From <input type="date" id="faFrom"></label>
    <label>To <input type="date" id="faTo"></label>
    <button type="button" class="btn primary" id="btnFaReload">Refresh</button>
    <button type="button" class="btn" id="btnTrainPreviewList">Preview HDFC report</button>
  </div>
  <div class="kpi-grid" id="faKpis"></div>
  <div style="overflow:auto">
    <table>
      <thead><tr>
        <th>Date</th><th>Certificate</th><th>Name</th><th>ID</th><th>Branch</th>
        <th>HDFC / SOL</th><th>Mobile</th><th>Language</th><th>GPS</th><th></th>
      </tr></thead>
      <tbody id="faBody"><tr><td colspan="10">Loading…</td></tr></tbody>
    </table>
  </div>
</div>
`
  const script = `
${suiteMgmtBranchOptionsJs()}
(function(){
  var PUBLIC=${publicUrl};
  var ADVISORY=${advisoryUrl};
  var a=trainingRequireLogin();
  if(!a) return;
  var isMgmt=String(a.role||'').toLowerCase()==='management';
  /** Management branch picker: All Branches first (HOD stays on their branch). */
  function $(id){ return document.getElementById(id); }
  function ymd(d){ var z=function(n){ return n<10?'0'+n:String(n); }; return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate()); }
  var now=new Date();
  var first=new Date(now.getFullYear(), now.getMonth(), 1);
  if($('faFrom') && !$('faFrom').value) $('faFrom').value=ymd(first);
  if($('faTo') && !$('faTo').value) $('faTo').value=ymd(now);
  var wa=$('btnWaShare');
  if(wa){
    var msg=['Agile Training — Facility Attendant Banking Safety','Open this link on your phone. Finish 3 lessons, answer 3 questions, and submit your acknowledgement.',PUBLIC].join(String.fromCharCode(10));
    wa.href='https://wa.me/?text='+encodeURIComponent(msg);
  }
  var waAdv=$('btnWaAdvShare');
  if(waAdv){
    var advMsg=['HDFC Bank Compliance Advisory — Facility Attendants','Open this common link. Read the three points, answer 3 questions, and give your undertaking.',ADVISORY].join(String.fromCharCode(10));
    waAdv.href='https://wa.me/?text='+encodeURIComponent(advMsg);
  }
  function copyUrl(url, label){
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(function(){ trainingToast((label||'Link')+' copied.'); }).catch(function(){ prompt('Copy this link', url); });
    } else prompt('Copy this link', url);
  }
  if($('btnCopyLink')) $('btnCopyLink').onclick=function(){
    copyUrl($('faShareUrl') && $('faShareUrl').value || PUBLIC, 'Training link');
  };
  if($('btnCopyAdvLink')) $('btnCopyAdvLink').onclick=function(){
    copyUrl($('advShareUrl') && $('advShareUrl').value || ADVISORY, 'Advisory link');
  };
  function loadBranches(then){
    fetch('/api/training/fa-records-data',{method:'POST',headers:trainingAuthHeaders(),body:JSON.stringify({action:'boot'})})
      .then(function(r){ return r.json(); })
      .then(function(j){
        if(!j.ok){ trainingToast(j.error||'Could not load.'); return; }
        var wrap=$('faBranchWrap');
        var sel=$('faBranch');
        if(j.showBranchPick && wrap && sel){
          wrap.classList.remove('hidden');
          sel.innerHTML=suiteMgmtBranchOptionsHtml(j.branches||[], sel.value||'ALL');
        }
        var langSel=$('advLang');
        if(langSel && j.langs){
          langSel.innerHTML=(j.langs||[]).map(function(L){
            return '<option value="'+String(L.code||'')+'">'+String(L.native||L.name||'')+'</option>';
          }).join('');
        }
        if(then) then();
      }).catch(function(){ trainingToast('Could not load.'); });
  }
  function loadList(){
    var branchId='';
    var sel=$('faBranch');
    if(sel && !$('faBranchWrap').classList.contains('hidden')) branchId=sel.value||'ALL';
    fetch('/api/training/fa-records-data',{method:'POST',headers:trainingAuthHeaders(),body:JSON.stringify({
      action:'list',
      branchId:branchId,
      from:$('faFrom') && $('faFrom').value,
      to:$('faTo') && $('faTo').value
    })}).then(function(r){ return r.json(); }).then(function(j){
      if(!j.ok){ $('faBody').innerHTML='<tr><td colspan="10">'+(j.error||'Could not load')+'</td></tr>'; return; }
      var rows=j.rows||[];
      $('faKpis').innerHTML='<div class="stat"><b>'+rows.length+'</b><span>Completed</span></div>';
      if(!rows.length){
        $('faBody').innerHTML='<tr><td colspan="10">No acknowledgements in this period.</td></tr>';
        return;
      }
      $('faBody').innerHTML=rows.map(function(r){
        return '<tr><td>'+String(r.submittedAt||r.ymd||'')+'</td><td>'+String(r.code||'')+'</td><td>'+String(r.name||'')+'</td><td>'+String(r.employeeId||'')+'</td><td>'+String(r.branchName||'')+'</td><td>'+String(r.hdfcSite||'')+'</td><td>'+String(r.mobile||'')+'</td><td>'+String(r.langName||'')+'</td><td>'+String(r.gps||'')+'</td><td><button type="button" class="btn fa-cert" data-id="'+String(r.id||'')+'" data-branch="'+String(r.branchId||'')+'" data-ymd="'+String(r.ymd||'')+'">Certificate</button></td></tr>';
      }).join('');
      document.querySelectorAll('.fa-cert').forEach(function(btn){
        btn.addEventListener('click', function(){
          fetch('/api/training/fa-records-data',{method:'POST',headers:trainingAuthHeaders(),body:JSON.stringify({
            action:'certificate',
            id:btn.getAttribute('data-id'),
            branchId:btn.getAttribute('data-branch'),
            ymd:btn.getAttribute('data-ymd')
          })}).then(function(r){ return r.json(); }).then(function(j){
            if(!j.html){ trainingToast(j.error||'Certificate not found.'); return; }
            var w=window.open('','_blank');
            if(w){ w.document.write(j.html); w.document.close(); }
          });
        });
      });
    }).catch(function(){ $('faBody').innerHTML='<tr><td colspan="10">Could not load.</td></tr>'; });
  }
  function branchId(){
    var sel=$('faBranch');
    if(sel && $('faBranchWrap') && !$('faBranchWrap').classList.contains('hidden')) return sel.value||'ALL';
    return '';
  }
  function period(){
    return { from:$('faFrom') && $('faFrom').value, to:$('faTo') && $('faTo').value };
  }
  function openHtml(html){
    var w=window.open('','_blank');
    if(w){ w.document.write(html); w.document.close(); }
  }
  function yn(v){
    var s=String(v||'').toLowerCase();
    return s==='yes'?'YES':s==='no'?'NO':'—';
  }
  function loadRoster(){
    fetch('/api/training/fa-records-data',{method:'POST',headers:trainingAuthHeaders(),body:JSON.stringify({
      action:'advisoryLoadRoster', branchId:branchId()
    })}).then(function(r){ return r.json(); }).then(function(j){
      if(!j.ok){ if($('advRosterNote')) $('advRosterNote').textContent=j.error||'Could not load list.'; return; }
      if($('advRosterText') && !j.pickBranch) $('advRosterText').value=j.text||'';
      if($('advRosterText') && j.pickBranch) $('advRosterText').value='';
      if($('advRosterNote')){
        $('advRosterNote').textContent=j.pickBranch
          ? 'All Branches: '+((j.count||0))+' names saved. Pick one branch to paste or change a list.'
          : 'Saved phone list: '+(j.count||0)+' names.';
      }
    }).catch(function(){ if($('advRosterNote')) $('advRosterNote').textContent='Could not load list.'; });
  }
  function saveRoster(){
    var bid=branchId();
    if(isMgmt && (!bid || bid==='ALL')){ trainingToast('Pick one branch first, then save the phone list.'); return; }
    var text=$('advRosterText') && $('advRosterText').value || '';
    if(!String(text).trim()){ trainingToast('Paste Name and mobile — one person per line.'); return; }
    fetch('/api/training/fa-records-data',{method:'POST',headers:trainingAuthHeaders(),body:JSON.stringify({
      action:'advisorySaveRoster', branchId:bid, text:text
    })}).then(function(r){ return r.json(); }).then(function(j){
      if(!j.ok){ trainingToast(j.error||'Could not save list.'); return; }
      if($('advRosterText')) $('advRosterText').value=j.text||text;
      if($('advRosterNote')) $('advRosterNote').textContent='Saved phone list: '+(j.count||0)+' names.';
      trainingToast('Saved '+(j.count||0)+' names for this branch.');
      loadAdv();
    }).catch(function(){ trainingToast('Could not save list.'); });
  }
  function loadAdv(){
    var p=period();
    fetch('/api/training/fa-records-data',{method:'POST',headers:trainingAuthHeaders(),body:JSON.stringify({
      action:'advisoryList', branchId:branchId(), from:p.from, to:p.to
    })}).then(function(r){ return r.json(); }).then(function(j){
      if(!j.ok){ $('advBody').innerHTML='<tr><td colspan="11">'+(j.error||'Could not load')+'</td></tr>'; return; }
      var rows=j.rows||[];
      if($('advCounts')) $('advCounts').textContent='On the send list: '+(j.recipientCount||0)+' · Saved names: '+(j.rosterCount||0)+' · Pending WhatsApp '+(j.pendingCount||0)+' · Advisory acknowledged '+(j.ackCount||0)+' · Training acknowledged '+(j.trainCount||0);
      showPack(j);
      if(!rows.length){ $('advBody').innerHTML='<tr><td colspan="11">No advisory acknowledgements in this period.</td></tr>'; return; }
      var groups={};
      rows.forEach(function(r){
        var k=String(r.branchName||'Branch');
        (groups[k]=groups[k]||[]).push(r);
      });
      var html='';
      Object.keys(groups).sort().forEach(function(k){
        html+='<tr><td colspan="11"><b>'+k+' · '+groups[k].length+'</b></td></tr>';
        html+=groups[k].map(function(r){
          var a=r.answers||[];
          return '<tr><td>'+String(r.submittedAt||r.ymd||'')+'</td><td>'+String(r.code||'')+'</td><td>'+String(r.name||'')+'</td><td>'+String(r.employeeId||'')+'</td><td>'+String(r.branchName||'')+'</td><td>'+String(r.hdfcSite||'')+'</td><td>'+String(r.mobile||'')+'</td><td>'+yn(a[0])+'</td><td>'+yn(a[1])+'</td><td>'+yn(a[2])+'</td><td>'+String(r.score||'')+'</td></tr>';
        }).join('');
      });
      $('advBody').innerHTML=html;
    }).catch(function(){ $('advBody').innerHTML='<tr><td colspan="11">Could not load.</td></tr>'; });
  }
  function showPack(j){
    var st=$('packStatus');
    var note=$('packNote');
    if(!st || !note) return;
    if(j.pickBranch){
      st.textContent='Pick one branch';
      note.textContent='All Branches is view only. Pick one branch to review, approve, or send the HDFC report link.';
      return;
    }
    var p=j.pack||{};
    st.textContent=p.statusLabel||'Collecting';
    if(p.grew){
      note.textContent='The list grew after the last review. OM must review again, then HOD approve, then send.';
      return;
    }
    var bits=[];
    if(p.omName) bits.push('OM '+p.omName+(p.omAt?' · '+p.omAt:''));
    if(p.hodName) bits.push('HOD '+p.hodName+(p.hodAt?' · '+p.hodAt:''));
    if(p.sentAt) bits.push('Sent '+p.sentAt);
    if(p.reportUrl) bits.push('Report link is ready');
    note.textContent=bits.length?bits.join(' · '):'OM reviews the branch list. HOD approves. Then send the Training report link.';
  }
  function packAction(actionName, extra){
    var bid=branchId();
    if(isMgmt && (!bid || bid==='ALL')){ trainingToast('Pick one branch first.'); return; }
    var p=period();
    var body={action:actionName, branchId:bid, from:p.from, to:p.to};
    if(extra) Object.keys(extra).forEach(function(k){ body[k]=extra[k]; });
    fetch('/api/training/fa-records-data',{method:'POST',headers:trainingAuthHeaders(),body:JSON.stringify(body)})
      .then(function(r){ return r.json(); }).then(function(j){
        if(!j.ok){ trainingToast(j.error||'Could not save.'); return; }
        trainingToast(j.statusLabel||'Saved.');
        loadAdv();
      }).catch(function(){ trainingToast('Could not save.'); });
  }
  if($('btnAdvPreview')) $('btnAdvPreview').onclick=function(){
    var lang=$('advLang') && $('advLang').value || 'en';
    window.open(ADVISORY+'?lang='+encodeURIComponent(lang),'_blank','noopener');
  };
  if($('btnAdvSaveRoster')) $('btnAdvSaveRoster').onclick=saveRoster;
  if($('advRosterFile')) $('advRosterFile').onchange=function(){
    var f=this.files && this.files[0];
    if(!f) return;
    var reader=new FileReader();
    reader.onload=function(){
      var cur=$('advRosterText') && $('advRosterText').value || '';
      var extra=String(reader.result||'');
      if($('advRosterText')) $('advRosterText').value=cur && extra ? cur.replace(/\s+$/,'')+'\n'+extra : (extra||cur);
    };
    reader.readAsText(f);
    this.value='';
  };
  if($('btnAdvSendWa')) $('btnAdvSendWa').onclick=function(){
    if(!confirm('Send this advisory WhatsApp (three points + 3 questions + undertaking link) to the saved phone list who have not yet acknowledged?')) return;
    if(!confirm('Send now?')) return;
    var lang=$('advLang') && $('advLang').value || 'en';
    fetch('/api/training/fa-records-data',{method:'POST',headers:trainingAuthHeaders(),body:JSON.stringify({
      action:'advisorySendWa', branchId:branchId(), lang:lang
    })}).then(function(r){ return r.json(); }).then(function(j){
      if(!j.ok){ trainingToast(j.error||'Could not send.'); return; }
      trainingToast('Sent '+(j.sent||0)+'. Already acknowledged '+(j.skipped||0)+'. Failed '+(j.failed||0)+'.');
      loadAdv();
    }).catch(function(){ trainingToast('Could not send.'); });
  };
  function previewList(){
    var bid=branchId();
    if(isMgmt && (!bid || bid==='ALL')){ trainingToast('Pick one branch first, then preview the HDFC report.'); return; }
    var p=period();
    fetch('/api/training/fa-records-data',{method:'POST',headers:trainingAuthHeaders(),body:JSON.stringify({
      action:'hdfcPreviewReport', branchId:bid, from:p.from, to:p.to
    })}).then(function(r){ return r.json(); }).then(function(j){
      if(!j.html){ trainingToast(j.error||'No report to preview.'); return; }
      openHtml(j.html);
    }).catch(function(){ trainingToast('Could not preview.'); });
  }
  function sendClient(){
    var bid=branchId();
    if(isMgmt && (!bid || bid==='ALL')){ trainingToast('Pick one branch first, then send the HDFC report link.'); return; }
    var emails=$('advClientEmails') && $('advClientEmails').value || '';
    if(!String(emails).trim()){ trainingToast('Type the HDFC Admin / RSO email IDs first.'); return; }
    if(!confirm('Send the Training report link to HDFC?')) return;
    if(!confirm('Send now? To HDFC · CC Sridhar + Director.')) return;
    var p=period();
    fetch('/api/training/fa-records-data',{method:'POST',headers:trainingAuthHeaders(),body:JSON.stringify({
      action:'hdfcSendReport', branchId:bid, from:p.from, to:p.to, clientEmails:emails,
      hodName:$('hodName') && $('hodName').value || ''
    })}).then(function(r){ return r.json(); }).then(function(j){
      if(!j.ok){ trainingToast(j.error||'Could not send.'); return; }
      trainingToast('Report link sent to HDFC ('+(j.sent||0)+' names).');
      loadAdv();
    }).catch(function(){ trainingToast('Could not send.'); });
  }
  if($('btnOmReview')) $('btnOmReview').onclick=function(){
    var name=$('omName') && $('omName').value || '';
    if(!String(name).trim()){ trainingToast('Type the OM name first.'); return; }
    if(!confirm('Mark this branch list as reviewed by OM '+name+'?')) return;
    packAction('packReviewOm', {omName:name});
  };
  if($('btnHodApprove')) $('btnHodApprove').onclick=function(){
    var name=$('hodName') && $('hodName').value || '';
    if(!String(name).trim()){ trainingToast('Type the HOD name first.'); return; }
    if(!confirm('Approve this branch list as HOD '+name+'?')) return;
    packAction('packApproveHod', {hodName:name});
  };
  if($('btnAdvPreviewList')) $('btnAdvPreviewList').onclick=previewList;
  if($('btnAdvSendClient')) $('btnAdvSendClient').onclick=sendClient;
  if($('btnTrainPreviewList')) $('btnTrainPreviewList').onclick=previewList;
  if($('btnFaReload')) $('btnFaReload').onclick=function(){ loadList(); loadAdv(); loadRoster(); };
  if($('faBranch')) $('faBranch').onchange=function(){ loadList(); loadAdv(); loadRoster(); };
  if($('faFrom')) $('faFrom').onchange=function(){ loadList(); loadAdv(); };
  if($('faTo')) $('faTo').onchange=function(){ loadList(); loadAdv(); };
  loadBranches(function(){ loadList(); loadAdv(); loadRoster(); });
})();
`
  return trainingPageHtml({
    title: 'Facility Attendant Training — Agile Training',
    body,
    script,
    activeNav: 'ojt',
    hideNav: false,
  })
}
