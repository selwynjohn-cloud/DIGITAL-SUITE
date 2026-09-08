/**
 * Security News - Registered List
 * Quiz players (name + mobile) from the daily Security News question.
 */

export const SECURITY_NEWS_REGISTERED_JS = `
var SN_LIST=[],SN_TAB='people';
function snPhoneDigits(p){return String(p||'').replace(/\\D/g,'').slice(-10);}
function snShowMobile(p){
  var d=snPhoneDigits(p);
  if(d.length===10)return d.slice(0,5)+' '+d.slice(5);
  var raw=String(p||'').trim();
  return raw||'—';
}
function snRegisteredList(){ funnelFollowUp('news'); }
function loadSnRegisteredList(){
  var msgEl=el('sn_msg'),tblEl=el('sn_tbl'),btnsEl=el('sn_btns');
  if(!msgEl){alert('Open Security News - Registered List from the menu again.');return;}
  msgEl.textContent='Loading Security News list…';
  api('securityNewsRegisteredList',{}).then(function(res){
    if(res.s!==200){msgEl.textContent=res.j.error||'Could not load list.';return;}
    SN_LIST=res.j.people||[];
    var peopleN=SN_LIST.length,answersN=Number(res.j.answers||0);
    if(btnsEl){
      btnsEl.innerHTML=
        '<button type="button" class="btn '+(SN_TAB==='people'?'green':'sky')+'" style="font-size:14px;padding:11px 16px" onclick="SN_TAB=\\'people\\';renderSnRegisteredList()">People ('+peopleN+')</button>'+
        '<span class="rpt-note" style="margin:0;padding:8px 0">'+answersN+' correct answer(s) in total</span>';
    }
    renderSnRegisteredList();
  }).catch(function(){msgEl.textContent='Could not load list — check internet and try again.';});
}
function renderSnRegisteredList(){
  var msgEl=el('sn_msg'),tblEl=el('sn_tbl');
  if(!msgEl||!tblEl)return;
  msgEl.textContent=SN_LIST.length+' person(s) · last come first · dates dd/mm/yyyy';
  var rows=SN_LIST.map(function(c,i){
    var mob=snPhoneDigits(c.mobile);
    var call=mob?('<a class="btn grey" style="padding:3px 6px;font-size:11px;margin:2px" href="tel:+91'+mob+'">Call</a> '):'';
    var wa=mob?('<button class="btn sky" style="padding:3px 6px;font-size:11px;margin:2px" onclick="snWhatsApp('+JSON.stringify(String(c.mobile||''))+','+JSON.stringify(String(c.name||''))+')">WhatsApp</button>'):'';
    return '<tr>'+
      '<td class="sj-sl">'+(i+1)+'</td>'+
      '<td class="sj-name"><b>'+(i+1)+'. '+h(c.name)+'</b></td>'+
      '<td class="sj-mob">'+h(snShowMobile(c.mobile))+'</td>'+
      '<td>'+h(c.lastDateDmy||'—')+'</td>'+
      '<td>'+h(c.lastWeek||'—')+'</td>'+
      '<td>'+h(c.answers||1)+'</td>'+
      '<td class="sj-act">'+call+wa+'</td></tr>';
  }).join('');
  tblEl.innerHTML='<div class="tblwrap sj-freeze-wrap"><table><thead><tr>'+
    '<th class="sj-sl">Sl.</th><th class="sj-name">Name</th><th class="sj-mob">Mobile</th><th>Last answered</th><th>Week</th><th>Answers</th><th class="sj-act">Actions</th></tr></thead><tbody>'+
    (rows||'<tr><td colspan="7">No Security News answers yet.</td></tr>')+'</tbody></table></div>';
}
function snSaveExcelFile(base64,filename){
  var bin=atob(base64),bytes=new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  var blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  var url=URL.createObjectURL(blob);var link=document.createElement('a');link.href=url;link.download=filename||'Security News - Registered List.xlsx';link.click();
}
function snDownloadExcel(){
  api('securityNewsListExcel',{}).then(function(res){
    if(res.s!==200||!res.j.base64){alert((res.j&&res.j.error)||'Could not make Excel.');return;}
    snSaveExcelFile(res.j.base64,res.j.filename||'Security News - Registered List.xlsx');
  });
}
function snWhatsApp(mobile,name){
  api('securityNewsWhatsApp',{mobile:mobile,name:name}).then(function(res){
    if(res.s!==200||!res.j.waUrl){alert((res.j&&res.j.error)||'Could not open WhatsApp.');return;}
    window.open(res.j.waUrl,'_blank');
  });
}
`