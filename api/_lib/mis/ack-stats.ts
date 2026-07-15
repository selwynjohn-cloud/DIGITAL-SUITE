import { misAckRowDivider } from './brand.js'
import {
  docPresent,
  getBranches,
  getClients,
  getCollections,
  getComplaints,
  getGuardDocs,
  getVisits,
  guardRecordEligible,
  type MisComplaint,
  type MisGuardDoc,
} from './store.js'
import { getJoinBacks, getRequisitions } from '../recruitment/store.js'

export type BranchAckStats = {
  guardsTotal: number
  pvcValid: number
  medicalValid: number
  dayVisits: number
  nightChecks: number
  srMgmtVisits: number
  resigned: number
  recruitmentOpen: number
  weeklyCollected: number
  weeklyBudget: number
  guardComplaints: { received: number; solved: number; avgResponseHrs: number | null }
  clientComplaints: { received: number; solved: number; avgResponseHrs: number | null }
}

function weekStartMonday(dateFor: string): string {
  const d = new Date(`${dateFor}T12:00:00`)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

function branchNameLoose(a: string, b: string): boolean {
  const x = a.trim().toLowerCase()
  const y = b.trim().toLowerCase()
  if (!x || !y) return false
  return x === y || x.includes(y) || y.includes(x)
}

function isSrMgmtVisit(user: string, remarks: string): boolean {
  const t = `${user} ${remarks}`.toUpperCase()
  return /SR\.?\s*M|SR\s*MANAGEMENT|SENIOR\s*MANAGEMENT|MANAGING\s*DIRECTOR|\bMD\b|DIRECTOR\s*VISIT/.test(t)
}

function isSolvedComplaint(c: MisComplaint): boolean {
  const st = String(c.status ?? '').trim().toLowerCase()
  return st === 'closed' || st === 'solved' || st === 'resolved' || Boolean(c.actionTaken?.trim())
}

function complaintAgeHours(c: MisComplaint): number | null {
  const startRaw = c.registeredAt || c.importedAt || c.incidentDate
  if (!startRaw) return null
  const start = new Date(startRaw).getTime()
  if (!Number.isFinite(start)) return null
  return Math.max(0, Math.round((Date.now() - start) / 3600000))
}

function avgHours(list: number[]): number | null {
  if (!list.length) return null
  return Math.round(list.reduce((a, b) => a + b, 0) / list.length)
}

function tallyComplaints(list: MisComplaint[], kind: 'guard' | 'client') {
  const filtered = list.filter((c) => c.active !== false).filter((c) => {
    const t = String(c.type ?? '').toLowerCase()
    return kind === 'guard' ? t.includes('guard') : t.includes('client') || (!t.includes('guard') && t.length > 0)
  })
  const solved = filtered.filter(isSolvedComplaint)
  const hrs = filtered.map(complaintAgeHours).filter((h): h is number => h != null)
  return {
    received: filtered.length,
    solved: solved.length,
    avgResponseHrs: avgHours(hrs),
  }
}

function guardCompliance(docs: MisGuardDoc[]) {
  const active = docs.filter(guardRecordEligible)
  let pvc = 0
  let medical = 0
  for (const d of active) {
    if (docPresent(d.pvc)) pvc++
    if (docPresent(d.medical)) medical++
  }
  const resigned = docs.filter((d) => d.active === false).length
  return { total: active.length, pvc, medical, resigned }
}

export async function buildBranchAckStats(
  branchId: string,
  branchName: string,
  dateFor: string,
): Promise<BranchAckStats> {
  const [guardDocs, complaints, clients, visits, collections, requisitions, joinBacks] =
    await Promise.all([
      getGuardDocs(branchId),
      getComplaints(branchId),
      getClients(branchId),
      getVisits(dateFor),
      getCollections(weekStartMonday(dateFor)),
      getRequisitions(),
      getJoinBacks(),
    ])

  const comp = guardCompliance(guardDocs)
  const clientNames = new Set(
    clients.filter((c) => c.active !== false).map((c) => c.name.trim().toLowerCase()),
  )

  let dayVisits = 0
  let nightChecks = 0
  let srMgmtVisits = 0
  for (const v of visits) {
    const cl = v.client.trim().toLowerCase()
    const unit = v.unit.trim().toLowerCase()
    const inBranch =
      clientNames.has(cl) ||
      [...clientNames].some((n) => cl.includes(n) || n.includes(cl)) ||
      branchNameLoose(v.unit, branchName) ||
      branchNameLoose(v.client, branchName)
    if (!inBranch && clientNames.size > 0) continue
    if (v.visitType === 'N') nightChecks++
    else dayVisits++
    if (isSrMgmtVisit(v.user, v.remarks)) srMgmtVisits++
  }

  const colRow = collections.find((c) => c.branchId === branchId)
  const weeklyCollected = colRow
    ? (Number(colRow.mon) || 0) +
      (Number(colRow.tue) || 0) +
      (Number(colRow.wed) || 0) +
      (Number(colRow.thu) || 0) +
      (Number(colRow.fri) || 0) +
      (Number(colRow.sat) || 0)
    : 0
  const weeklyBudget = colRow ? Number(colRow.budget) || 0 : 0

  const recruitmentOpen = requisitions.filter(
    (r) =>
      r.active !== false &&
      r.status !== 'fulfilled' &&
      r.status !== 'rejected' &&
      branchNameLoose(String(r.branchId ?? ''), branchName),
  ).length

  const resignedJoinBack = joinBacks.filter(
    (j) =>
      j.status === 'left_permanent' &&
      branchNameLoose(String(j.branchId ?? ''), branchName),
  ).length

  return {
    guardsTotal: comp.total,
    pvcValid: comp.pvc,
    medicalValid: comp.medical,
    dayVisits,
    nightChecks,
    srMgmtVisits,
    resigned: comp.resigned + resignedJoinBack,
    recruitmentOpen,
    weeklyCollected,
    weeklyBudget,
    guardComplaints: tallyComplaints(complaints, 'guard'),
    clientComplaints: tallyComplaints(complaints, 'client'),
  }
}

function mergeComplaintSide(
  a: BranchAckStats['guardComplaints'],
  b: BranchAckStats['guardComplaints'],
): BranchAckStats['guardComplaints'] {
  const received = a.received + b.received
  const solved = a.solved + b.solved
  let avgResponseHrs: number | null = null
  if (received > 0) {
    const parts: number[] = []
    if (a.avgResponseHrs != null && a.received) parts.push(a.avgResponseHrs * a.received)
    if (b.avgResponseHrs != null && b.received) parts.push(b.avgResponseHrs * b.received)
    if (parts.length) avgResponseHrs = Math.round(parts.reduce((x, y) => x + y, 0) / received)
  }
  return { received, solved, avgResponseHrs }
}

/** Sum branch acknowledgment metrics into one company-wide dashboard. */
export function aggregateBranchAckStats(list: BranchAckStats[]): BranchAckStats {
  const out: BranchAckStats = {
    guardsTotal: 0,
    pvcValid: 0,
    medicalValid: 0,
    dayVisits: 0,
    nightChecks: 0,
    srMgmtVisits: 0,
    resigned: 0,
    recruitmentOpen: 0,
    weeklyCollected: 0,
    weeklyBudget: 0,
    guardComplaints: { received: 0, solved: 0, avgResponseHrs: null },
    clientComplaints: { received: 0, solved: 0, avgResponseHrs: null },
  }
  for (const s of list) {
    out.guardsTotal += s.guardsTotal
    out.pvcValid += s.pvcValid
    out.medicalValid += s.medicalValid
    out.dayVisits += s.dayVisits
    out.nightChecks += s.nightChecks
    out.srMgmtVisits += s.srMgmtVisits
    out.resigned += s.resigned
    out.recruitmentOpen += s.recruitmentOpen
    out.weeklyCollected += s.weeklyCollected
    out.weeklyBudget += s.weeklyBudget
    out.guardComplaints = mergeComplaintSide(out.guardComplaints, s.guardComplaints)
    out.clientComplaints = mergeComplaintSide(out.clientComplaints, s.clientComplaints)
  }
  return out
}

/** Build combined status dashboard from every active branch. */
export async function buildConsolidatedAckStats(dateFor: string): Promise<BranchAckStats> {
  const branches = await getBranches()
  const perBranch = await Promise.all(
    branches.map((b) => buildBranchAckStats(b.id, b.name, dateFor).catch(() => null)),
  )
  return aggregateBranchAckStats(perBranch.filter((s): s is BranchAckStats => s !== null))
}

export function fmtRatio(n: number, total: number): string {
  return `${n}/${total || '—'}`
}

export function fmtLakhs(n: number): string {
  if (!n) return '0'
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

export function fmtResponseHrs(hrs: number | null): string {
  if (hrs == null) return '—'
  if (hrs < 24) return `${hrs}h`
  return `${Math.round(hrs / 24)}d`
}

export function ackStatsTableHtml(stats: BranchAckStats): string {
  const tile = (value: string, label: string, bg: string, color: string, width = '20%') =>
    `<td width="${width}" style="padding:14px 8px;background:${bg};border-radius:8px;text-align:center;vertical-align:middle">
      <div style="font-size:22px;font-weight:700;color:${color};line-height:1.2">${value}</div>
      <div style="font-size:11px;color:#64748b;margin-top:6px;line-height:1.35">${label}</div>
    </td>`

  const gc = stats.guardComplaints
  const cc = stats.clientComplaints
  const guardCmp = `${gc.solved} / ${gc.received}`
  const clientCmp = `${cc.solved} / ${cc.received}`
  const guardLabel = `Guard complaints solved${gc.avgResponseHrs != null ? ' · ' + fmtResponseHrs(gc.avgResponseHrs) : ''}`
  const clientLabel = `Client complaints solved${cc.avgResponseHrs != null ? ' · ' + fmtResponseHrs(cc.avgResponseHrs) : ''}`

  return `<div style="margin:0 0 18px">
    <div style="padding:10px 0 4px;font-weight:700;color:#14224f;font-size:14px">Branch Status Dashboard</div>
    ${misAckRowDivider()}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:8px 10px">
      <tr>
        ${tile(fmtRatio(stats.pvcValid, stats.guardsTotal), 'PVC (valid / total)', '#eff6ff', '#1d4ed8', '25%')}
        ${tile(fmtRatio(stats.medicalValid, stats.guardsTotal), 'Medical (valid / total)', '#f0fdf4', '#16a34a', '25%')}
        ${tile(String(stats.dayVisits), 'Day visits', '#fefce8', '#ca8a04', '25%')}
        ${tile(String(stats.srMgmtVisits), 'Sr. Management visits', '#f5f3ff', '#7c3aed', '25%')}
      </tr>
    </table>
    ${misAckRowDivider()}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:8px 10px">
      <tr>
        ${tile(String(stats.resigned), 'Resigned', '#fef2f2', '#dc2626')}
        ${tile(String(stats.recruitmentOpen), 'Recruitment (open)', '#ecfdf5', '#059669')}
        ${tile(`${fmtLakhs(stats.weeklyCollected)} / ${fmtLakhs(stats.weeklyBudget)}`, 'Weekly collection (₹ Lakhs)', '#eff6ff', '#1d4ed8')}
        ${tile(guardCmp, guardLabel, '#fff7ed', '#ea580c')}
        ${tile(clientCmp, clientLabel, '#fdf4ff', '#9333ea')}
      </tr>
    </table>
  </div>`
}
