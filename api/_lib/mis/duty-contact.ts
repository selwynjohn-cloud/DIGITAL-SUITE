/**
 * Late Duty / Out of Location — guard mobile, Call, WhatsApp warning.
 * Shared by HOD Dashboard, HOD Late Start page, and Management Late Start page.
 */
import {
  getBranches,
  getGuardDocsMany,
  getGuards,
  type MisDutyIncident,
  type MisGuard,
  type MisGuardDoc,
} from './store.js'

export function dutyMobileDigits(raw: string): string {
  const d = String(raw ?? '').replace(/\D/g, '')
  if (d.length >= 10) return d.slice(-10)
  return ''
}

function normName(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function lookupMobile(inc: MisDutyIncident, docs: MisGuardDoc[], guards: MisGuard[]): string {
  const emp = String(inc.employeeId || '').trim().toLowerCase()
  const name = normName(inc.guardName)
  const unit = normName(inc.unit)

  if (emp) {
    const d = docs.find((x) => String(x.employeeId || '').trim().toLowerCase() === emp)
    const fromDoc = dutyMobileDigits(d?.mobile || '')
    if (fromDoc) return fromDoc
    const g = guards.find((x) => String(x.employeeId || '').trim().toLowerCase() === emp)
    const fromGuard = dutyMobileDigits(g?.mobile || '')
    if (fromGuard) return fromGuard
  }

  if (name && (name.length >= 6 || (name.length >= 4 && unit))) {
    const namedDocs = docs.filter((x) => normName(x.guardName) === name)
    const docHit = (unit && namedDocs.find((x) => normName(x.unitName) === unit)) || namedDocs[0]
    const fromDoc = dutyMobileDigits(docHit?.mobile || '')
    if (fromDoc) return fromDoc
    const namedGuards = guards.filter((x) => normName(x.name) === name)
    const gHit = (unit && namedGuards.find((x) => normName(x.unitName) === unit)) || namedGuards[0]
    const fromGuard = dutyMobileDigits(gHit?.mobile || '')
    if (fromGuard) return fromGuard
  }
  return ''
}

/** Fill missing mobiles from MIS guard book (no Work360 call). */
export async function enrichDutyIncidentsWithMobile(
  incidents: MisDutyIncident[],
  opts?: { branchId?: string },
): Promise<MisDutyIncident[]> {
  if (!incidents.length) return incidents
  const already = incidents.map((i) => dutyMobileDigits(i.mobile || ''))
  if (already.every(Boolean)) {
    return incidents.map((i, n) => (already[n] === i.mobile ? i : { ...i, mobile: already[n] }))
  }

  const branches = await getBranches()
  const ids = opts?.branchId
    ? [opts.branchId]
    : branches.map((b) => b.id).filter(Boolean)
  const docsMap = ids.length ? await getGuardDocsMany(ids) : new Map<string, MisGuardDoc[]>()
  const docs: MisGuardDoc[] = []
  for (const list of docsMap.values()) docs.push(...list)
  const guards = opts?.branchId ? await getGuards(opts.branchId) : []

  return incidents.map((inc) => {
    const existing = dutyMobileDigits(inc.mobile || '')
    if (existing) return { ...inc, mobile: existing }
    const found = lookupMobile(inc, docs, guards)
    return found ? { ...inc, mobile: found } : inc
  })
}

export const DUTY_CONTACT_CSS = `
.duty-mini{padding:5px 10px!important;font-size:11px!important;font-weight:800;text-decoration:none;display:inline-block;white-space:nowrap;border-radius:8px}
.duty-mini.m-btn{margin:0}
`

/** Browser helpers — pages must already define h(). */
export const DUTY_CONTACT_JS = `
function dutyPhone(m){
  var d=String(m==null?'':m).replace(/\\D/g,'');
  return d.length>=10?d.slice(-10):'';
}
function dutyWarnLate(r){
  return [
    'AGILE SECURITY — LATE DUTY WARNING',
    'Guard: '+(r.guardName||''),
    'Client: '+(r.client||''),
    'Site: '+(r.unit||''),
    'Late start time: '+(r.dutyStartTime||r.incidentTime||''),
    '',
    'A delayed start is a critical security lapse that can result in significant risk and financial loss to the client. Appropriate disciplinary action will be initiated in accordance with the existing Terms & Conditions.',
    '',
    '— Automated Warning Letter, Agile Digital Operations Command Center'
  ].join('\\n');
}
function dutyWarnOut(r){
  return [
    'AGILE SECURITY — OUT OF DUTY POST - WARNING',
    'Guard: '+(r.guardName||''),
    'Client: '+(r.client||''),
    'Site: '+(r.unit||''),
    'Left time: '+(r.incidentTime||''),
    'Away detail: '+(r.kmFromPost||'Left / Not Returned'),
    '',
    'Unattended Post Notice:',
    'Leaving a security post unattended is a severe security violation that significantly compromises client property and safety. Any losses incurred during your absence, along with any client-imposed penalties, will be recovered from you. Further disciplinary measures will be taken as per the existing Terms & Conditions.',
    '',
    '— Automated Warning Letter, Agile Digital Operations Command Center'
  ].join('\\n');
}
function dutyCallCell(mobile){
  var ph=dutyPhone(mobile);
  return ph?'<a class="m-btn m-btn-navy duty-mini" href="tel:+91'+ph+'">Call</a>':'—';
}
function dutyWaCell(mobile,text){
  var ph=dutyPhone(mobile);
  if(!ph)return '—';
  return '<a class="m-btn m-btn-green duty-mini" href="https://wa.me/91'+ph+'?text='+encodeURIComponent(text)+'" target="_blank" rel="noopener">WhatsApp Warning</a>';
}
function dutyLateRowHtml(r){
  var start=r.dutyStartTime||r.incidentTime||'—';
  return '<tr><td>'+h(r.guardName)+'</td><td class="c">'+h(dutyPhone(r.mobile)||'—')+'</td><td>'+h(r.client)+'</td><td>'+h(r.unit)+'</td><td class="c">'+h(start)+'</td><td class="c">'+dutyCallCell(r.mobile)+'</td><td class="c">'+dutyWaCell(r.mobile,dutyWarnLate(r))+'</td><td>'+h(r.remarks||'')+'</td></tr>';
}
function dutyOutRowHtml(r){
  return '<tr><td>'+h(r.guardName)+'</td><td class="c">'+h(dutyPhone(r.mobile)||'—')+'</td><td>'+h(r.client)+'</td><td>'+h(r.unit)+'</td><td class="c">'+h(r.incidentTime||'—')+'</td><td class="c" style="color:#fca5a5;font-weight:800">'+h(r.kmFromPost||'—')+'</td><td class="c">'+dutyCallCell(r.mobile)+'</td><td class="c">'+dutyWaCell(r.mobile,dutyWarnOut(r))+'</td><td>'+h(r.remarks||'')+'</td></tr>';
}
function dutyLateRowsHtml(list){
  var rows=(list||[]).map(dutyLateRowHtml).join('');
  return rows||'<tr><td colspan="8" class="m-pending hint">No late duty cases for this date.</td></tr>';
}
function dutyOutRowsHtml(list){
  var rows=(list||[]).map(dutyOutRowHtml).join('');
  return rows||'<tr><td colspan="9" class="m-pending hint">No out of location cases for this date.</td></tr>';
}
`
