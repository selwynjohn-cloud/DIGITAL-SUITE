/**
 * Management portal branch dropdown — always include All Branches first.
 * HOD / Staff portals stay locked to their signed-in branch (no All option).
 */

export const MGMT_ALL_BRANCHES_VALUE = 'ALL'
export const MGMT_ALL_BRANCHES_LABEL = 'All Branches'

/** Plain-JS snippet for Management <select> options (id/name lists). */
export function suiteMgmtBranchOptionsJs(): string {
  return `
function suiteMgmtBranchOptionsHtml(branches, selected){
  var list=branches||[];
  var cur=selected||'ALL';
  var html='<option value="ALL"'+(cur==='ALL'?' selected':'')+'>All Branches</option>';
  list.forEach(function(b){
    var id=typeof b==='string'?b:(b.id||b.name||'');
    var name=typeof b==='string'?b:(b.name||b.id||'');
    if(!id)return;
    html+='<option value="'+String(id).replace(/"/g,'&quot;')+'"'+(String(cur)===String(id)?' selected':'')+'>'+String(name).replace(/</g,'&lt;')+'</option>';
  });
  return html;
}
function suiteIsAllBranches(id){
  var v=String(id||'').trim();
  return !v||v==='ALL'||v==='All'||v==='All Branches';
}
`
}

export function isMgmtAllBranches(branchId: unknown): boolean {
  const v = String(branchId ?? '').trim()
  return !v || v === 'ALL' || v === 'All' || v === 'All Branches'
}
