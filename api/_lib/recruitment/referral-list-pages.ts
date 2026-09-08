/** Cumulative Referral Details — staff / SG name-wise, month 1st to last working day */

export const REFERRAL_LIST_PAGES_JS = `
var REF_LIST=[],REF_LEADERS=[],REF_FILTER_BRANCH='ALL',REF_FILTER_COMPANY='all',REF_FROM='',REF_TO='';
function refPad2(n){return String(n).padStart(2,'0');}
function refMonthStart(ymd){
  var p=String(ymd||today()).slice(0,10).split('-');
  return p[0]+'-'+p[1]+'-01';
}
function refLastWorkingDay(ymd){
  var p=String(ymd||today()).slice(0,10).split('-');
  var y=+p[0],m=+p[1],d=new Date(y,m,0).getDate();
  while(d>=1){
    var s=y+'-'+refPad2(m)+'-'+refPad2(d);
    if(new Date(s+'T12:00:00+05:30').getDay()!==0)return s;
    d--;
  }
  return y+'-'+refPad2(m)+'-01';
}
function refMonthRange(){
  var t=today();
  var from=refMonthStart(t);
  var lwd=refLastWorkingDay(t);
  return {from:from,to:(t<lwd?t:lwd)};
}
function applyReferralMonth(){
  var r=refMonthRange();
  REF_FROM=r.from;REF_TO=r.to;
  if(el('ref_from'))el('ref_from').value=r.from;
  if(el('ref_to'))el('ref_to').value=r.to;
  loadReferralList();
}
function referralListPage(){
  if(el('ttl'))el('ttl').textContent='Cumulative Referral Details';
  if(RECRUIT_ROLE==='branch')REF_FILTER_BRANCH=RECRUIT_BRANCH||'ALL';
  var month=refMonthRange();
  REF_FROM=month.from;REF_TO=month.to;
  var branchPick='';
  if(RECRUIT_ROLE!=='branch'){
    var cur=REF_FILTER_BRANCH||'ALL';
    var opts=['ALL'].concat((BRANCHES||[]).slice());
    branchPick='<div><label>Branch filter</label><select id="ref_branch" onchange="REF_FILTER_BRANCH=this.value;loadReferralList()">'+
      opts.map(function(b){return '<option value="'+a(b)+'"'+(b===cur?' selected':'')+'>'+h(b==='ALL'?'All Branches':b)+'</option>';}).join('')+
      '</select></div>';
  }else{
    branchPick='<div><label>Branch</label><input value="'+a(RECRUIT_BRANCH||'')+'" disabled></div>';
  }
  var body='<div class="card"><p class="rpt-note"><b>Cumulative Referral Details</b> — listed <b>Staff / SG name-wise</b> with full details. <b>New recruits only</b> (rejoin / old guards are not counted). Each person appears once. The list <b>updates every day</b>. Normal period: <b>1st of the month to the last working day</b>.</p>'+
    '<div class="fgrid" style="margin-top:10px">'+branchPick+
    '<div><label>From</label><input type="date" id="ref_from" value="'+a(REF_FROM)+'" onchange="REF_FROM=this.value"></div>'+
    '<div><label>To</label><input type="date" id="ref_to" value="'+a(REF_TO)+'" onchange="REF_TO=this.value"></div>'+
    '<div><label>Company</label><select id="ref_company" onchange="REF_FILTER_COMPANY=this.value;loadReferralList()">'+
      '<option value="all"'+(REF_FILTER_COMPANY==='all'?' selected':'')+'>All</option>'+
      '<option value="agile"'+(REF_FILTER_COMPANY==='agile'?' selected':'')+'>Agile</option>'+
      '<option value="sparks"'+(REF_FILTER_COMPANY==='sparks'?' selected':'')+'>Sparks</option>'+
    '</select></div>'+
    '<div style="align-self:end"><button type="button" class="btn sky" onclick="loadReferralList()">Refresh</button> <button type="button" class="btn grey" onclick="applyReferralMonth()">This month</button></div></div>'+
    '<div id="ref_leaders" style="margin-top:12px"></div>'+
    '<p id="ref_msg" class="rpt-note">Loading…</p></div><div id="ref_tbl"></div>';
  el('content').innerHTML=reportWrap('Cumulative Referral Details','Staff / SG name-wise · 1st to last working day',portalBadge(),body);
  loadReferralList();
}
function loadReferralList(){
  var msgEl=el('ref_msg'),tblEl=el('ref_tbl'),leadEl=el('ref_leaders');
  if(!msgEl){alert('Open Cumulative Referral Details from the menu again.');return;}
  var branchId=RECRUIT_ROLE==='branch'?(RECRUIT_BRANCH||''):(REF_FILTER_BRANCH||'ALL');
  var allBranch=RECRUIT_ROLE!=='branch'&&(branchId==='ALL'||!branchId);
  var company=(el('ref_company')&&el('ref_company').value)||REF_FILTER_COMPANY||'all';
  REF_FILTER_COMPANY=company;
  REF_FROM=(el('ref_from')&&el('ref_from').value)||REF_FROM||refMonthRange().from;
  REF_TO=(el('ref_to')&&el('ref_to').value)||REF_TO||refMonthRange().to;
  msgEl.textContent='Loading staff / SG referral list…';
  api('referralList',{branchId:allBranch?'ALL':branchId,allBranches:allBranch,company:company,from:REF_FROM,to:REF_TO}).then(function(res){
    if(res.s!==200){msgEl.textContent=res.j.error||'Could not load list.';return;}
    REF_LIST=res.j.rows||[];
    REF_LEADERS=res.j.leaders||[];
    var fromShow=res.j.from||REF_FROM,toShow=res.j.to||REF_TO;
    msgEl.textContent=REF_LIST.length+' new referral recruit(s) · Staff / SG name-wise · '+h(fromShow)+' to '+h(toShow)+' · updates every day';
    if(leadEl){
      if(!REF_LEADERS.length)leadEl.innerHTML='';
      else{
        leadEl.innerHTML=reportSec('Staff / SG totals (this period)')+
          '<div class="tblwrap wr-tbl-wrap"><table class="wr-tbl"><thead><tr><th>Sl.No.</th><th>Staff / SG name</th><th>New recruits</th></tr></thead><tbody>'+
          REF_LEADERS.map(function(L,i){return '<tr><td>'+(i+1)+'</td><td><b>'+h(L.name)+'</b></td><td>'+L.count+'</td></tr>';}).join('')+
          '</tbody></table></div>';
      }
    }
    if(!tblEl)return;
    if(!REF_LIST.length){
      tblEl.innerHTML='<div class="card"><p class="rpt-note">No new referral recruits from the 1st to the last working day in this range. Add a <b>new recruit</b> on Daily Recruitment Report and fill <b>Referred by</b> (Staff / SG name).</p></div>';
      return;
    }
    function refStaffKey(s){
      var t=String(s||'').toLowerCase().replace(/[\u2010-\u2015\u2212]/g,' ').replace(/\b(mr|mrs|ms|sri|smt)\b\.?/g,' ').replace(/[-_/(),.]+/g,' ').replace(/\b(om|hod|am|so|aso|sg|lsg|stf|spo|spa|bm|arm)\b/g,' ').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
      t=t.replace(/\s+/g,'');
      t=t.replace(/(om|hod|aso|lsg|stf|spo|spa)$/,'');
      if(t.length>8)t=t.replace(/sg$/,'');
      return t||'—';
    }
    var by={},label={};
    REF_LIST.forEach(function(r){
      var key=refStaffKey(r.referredBy);
      if(!by[key])by[key]=[];
      by[key].push(r);
      var shown=String(r.referredBy||'').replace(/\s+/g,' ').trim();
      if(!label[key]||shown.length>label[key].length)label[key]=shown||key;
    });
    var names=Object.keys(by).sort(function(a,b){return by[b].length-by[a].length||String(label[a]||a).localeCompare(String(label[b]||b));});
    var blocks=names.map(function(key,ri){
      var ref=label[key]||key;
      var list=by[key];
      var rows=list.map(function(r,i){
        var doj=typeof ddDate==='function'?ddDate(r.createdAt||r.reportDate):String(r.createdAt||r.reportDate||'').slice(0,10);
        var rpt=typeof ddDate==='function'?ddDate(r.reportDate):String(r.reportDate||'').slice(0,10);
        return '<tr><td>'+(i+1)+'</td><td><b>'+h(r.name)+'</b></td><td>'+h(r.empId||r.regCode||'—')+'</td><td>'+h(r.designation||'—')+'</td><td>'+h(r.mobile||r.phone||'')+'</td><td>'+h(r.branchId||'')+'</td><td>'+h(r.company||'—')+'</td><td>'+h(r.client||'—')+'</td><td>'+h(r.location||r.walkInFrom||'—')+'</td><td>'+h(r.vacantPosition||'—')+'</td><td>'+h(doj||'—')+'</td><td>'+h(rpt||'—')+'</td><td>'+h(r.remarks||'—')+'</td></tr>';
      }).join('');
      return reportSec((ri+1)+'. '+ref+' — Staff / SG · '+list.length+' new recruit'+(list.length===1?'':'s'))+
        '<div class="tblwrap wr-tbl-wrap" style="margin-bottom:16px"><table class="wr-tbl"><thead><tr><th>Sl.No.</th><th>Guard name</th><th>ID</th><th>Rank</th><th>Mobile</th><th>Branch</th><th>Company</th><th>Client</th><th>Location</th><th>Vacant post</th><th>Date of joining</th><th>Report date</th><th>Remarks</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
    }).join('');
    tblEl.innerHTML=blocks;
  }).catch(function(){msgEl.textContent='Could not load list — check internet and try again.';});
}
`
