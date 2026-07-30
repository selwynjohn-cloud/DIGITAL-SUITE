import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendSuiteEmail } from '../_lib/suite-mail.js'
import {
  docPresent,
  ensureComplaintCodes,
  getBranches,
  getClientCounts,
  getSiteDirectoryStats,
  restoreMasterDirectoryIfNeeded,
  getClients,
  guardRecordEligible,
  getCollections,
  getComplaints,
  getGuardDocs,
  getGuards,
  getDocs,
  getFormats,
  saveFormats,
  getReportDates,
  getReportsForDate,
  getReportsForDates,
  getCachedMdSummary,
  getVisitsMany,
  getGuardDocsMany,
  getComplaintsMany,
  getDirectorInboxComplaints,
  getDutyDates,
  getDutyIncidents,
  saveDirectorInboxComplaints,
  getStaff,
  getUsers,
  saveDocs,
  saveUsers,
  defaultMisUsers,
  misUserCanManage,
  getVisitDates,
  getVisits,
  misStorageOk,
  nid,
  num,
  saveBranches,
  saveClients,
  saveCollections,
  saveComplaints,
  saveGuardDocs,
  saveGuards,
  saveStaff,
  getReminderTimes,
  saveVisits,
  type MisBranch,
  type MisClient,
  type MisCollection,
  type MisComplaint,
  type MisGuard,
  type MisGuardDoc,
  type MisStaff,
  type MisVisit,
  type MisUser,
  type MisDoc,
  type MisFormat,
  type MisReport,
} from '../_lib/mis/store.js'
import { normalizeMisUserTeamFields } from '../_lib/user-team.js'
import { filterClientsForBranch } from '../_lib/mis/client-branch.js'
import { misRequestAuthed, misRequestEmail } from '../_lib/mis/session.js'
import { isSuperAdminEmail, normaliseEmail } from '../_lib/auth.js'
import {
  sendClientPerformanceMail,
  sendConsolidatedMisMail,
  sendMdSirReportMail,
  sendMisHodReminders,
  sendMisSubmissionReminders,
  type ClientPerfPayload,
} from '../_lib/mis/digest.js'
import { buildClientPerfReportEmailHtml } from '../_lib/mis/client-perf-report.js'
import {
  buildVacantSummary,
  deployPct,
  filterActiveReportRows,
  reportDeployTotals,
  rowDeployTotals,
} from '../_lib/mis/deploy-math.js'
import { buildDashboardExtras } from '../_lib/mis/dashboard-stats.js'
import {
  aggregateBranchPeriodStats,
  mondaysInMonth,
  pickLatestBranchReports,
  resolveDashboardPeriod,
} from '../_lib/mis/dashboard-period.js'
import { misBranchDisplayName } from '../_lib/mis/branch-labels.js'
import { normalizeStarRating, suggestStarRating } from '../_lib/mis/client-rules.js'
import { buildVisitAnalysis, syncMobileVisits } from '../_lib/mis/mobile-visits.js'
import { dutyCounts } from '../_lib/mis/work360-duty.js'
import {
  assignInboxComplaintToBranch,
  deleteBranchComplaint,
  deleteInboxComplaint,
  syncComplaintsFromGmail,
} from '../_lib/mis/complaint-inbox.js'
import {
  misTodayIst,
  misYesterdayIst,
  isSubmittedTodayIst,
  isOnTimeMisSubmission,
  isExcusedLateMisSubmission,
  countsForMisDailyPerformance,
  misDeadlineUtc,
} from '../_lib/mis/dates.js'
import { summaryResignationNum, summaryRecruitmentNum } from '../_lib/mis/summary-fields.js'
import { buildBranchReportMap } from '../_lib/mis/branch-match.js'
import { normalizeToLacs } from '../_lib/inr-money.js'
import { ensureTelanganaHodUsers } from '../_lib/mis/hod-directory.js'

export const config = { maxDuration: 60 }

function guardComplianceCounts(docs: MisGuardDoc[]) {
  const active = docs.filter(guardRecordEligible)
  let pvc = 0
  let medical = 0
  let training = 0
  for (const d of active) {
    if (docPresent(d.pvc)) pvc++
    if (docPresent(d.medical)) medical++
    if (docPresent(d.training)) training++
  }
  return { registered: active.length, pvc, medical, training }
}

function weekCollected(c: { mon?: number; tue?: number; wed?: number; thu?: number; fri?: number; sat?: number }) {
  return num(c.mon) + num(c.tue) + num(c.wed) + num(c.thu) + num(c.fri) + num(c.sat)
}

/** Sum weekly collection rows per branch for month dashboard view. */
function mergeMonthCollections(rows: MisCollection[]): MisCollection[] {
  const byBranch = new Map<string, MisCollection>()
  for (const c of rows) {
    const bid = String(c.branchId ?? c.branch ?? '').trim()
    if (!bid) continue
    const prev = byBranch.get(bid)
    if (!prev) {
      byBranch.set(bid, { ...c, branchId: bid })
      continue
    }
    byBranch.set(bid, {
      ...prev,
      budget: num(prev.budget) + num(c.budget),
      mon: num(prev.mon) + num(c.mon),
      tue: num(prev.tue) + num(c.tue),
      wed: num(prev.wed) + num(c.wed),
      thu: num(prev.thu) + num(c.thu),
      fri: num(prev.fri) + num(c.fri),
      sat: num(prev.sat) + num(c.sat),
      outstanding: num(c.outstanding) || num(prev.outstanding),
      monthlyBilling: num(c.monthlyBilling) || num(prev.monthlyBilling),
    })
  }
  return [...byBranch.values()]
}

function collectionDso(outstanding: number, monthlyBilling: number) {
  return monthlyBilling > 0 ? Math.round((outstanding / monthlyBilling) * 30) : 0
}

function clientPerfSharePayload(body: Record<string, unknown>): ClientPerfPayload {
  return {
    clientName: String(body.clientName ?? ''),
    month: String(body.month ?? body.rangeLabel ?? ''),
    from: String(body.from ?? ''),
    to: String(body.to ?? ''),
    rangeLabel: String(body.rangeLabel ?? body.month ?? ''),
    san: num(body.san),
    dep: num(body.dep),
    vac: num(body.vac),
    avgDeploy: num(body.avgDeploy),
    daysWithData: num(body.daysWithData),
    visits: num(body.visits),
    dayVisits: num(body.dayVisits),
    nightChecks: num(body.nightChecks),
    training: num(body.training),
    lateStart: num(body.lateStart),
    outOfPost: num(body.outOfPost),
    mwCompliant: String(body.mwCompliant ?? ''),
    mwCompliantLabel: String(body.mwCompliantLabel ?? ''),
    monthlyBillLacs:
      body.monthlyBillLacs == null || body.monthlyBillLacs === ''
        ? null
        : (normalizeToLacs(body.monthlyBillLacs) ?? num(body.monthlyBillLacs)),
    balanceToPayLacs:
      body.balanceToPayLacs == null || body.balanceToPayLacs === ''
        ? null
        : (normalizeToLacs(body.balanceToPayLacs) ?? num(body.balanceToPayLacs)),
    collectedLacs:
      body.collectedLacs == null || body.collectedLacs === ''
        ? null
        : (normalizeToLacs(body.collectedLacs) ?? num(body.collectedLacs)),
    slaDayVisit: String(body.slaDayVisit ?? ''),
    slaNightCheck: String(body.slaNightCheck ?? ''),
  }
}

async function canManageMisUsers(loginEmail: string): Promise<{ ok: boolean; error?: string }> {
  const email = normaliseEmail(loginEmail)
  if (!email) return { ok: false, error: 'Please sign in again with your @agilegroup.co.in email OTP.' }
  if (isSuperAdminEmail(email)) return { ok: true }
  let users = await getUsers()
  if (users.length === 0 && misStorageOk()) {
    users = defaultMisUsers()
    await saveUsers(users)
  }
  const u = users.find((x) => normaliseEmail(x.email) === email && x.active !== false)
  if (!u) {
    return {
      ok: false,
      error: 'Your email is not in User Management yet. Ask the Director to add you as Director or Admin.',
    }
  }
  if (!misUserCanManage(u.role)) {
    return { ok: false, error: 'Only Director and Admin can add or edit users.' }
  }
  return { ok: true }
}

function mondaysInMonth(ym: string): string[] {
  const parts = ym.split('-').map(Number)
  const y = parts[0]
  const m = parts[1]
  if (!y || !m) return []
  const out: string[] = []
  const d = new Date(y, m - 1, 1)
  const endMonth = m - 1
  while (d.getMonth() === endMonth) {
    if (d.getDay() === 1) out.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 1)
  }
  return out
}

function milestoneExpectation(day: number): { label: string; targetPct: number } {
  if (day <= 15) return { label: '15th — target 50%', targetPct: 50 }
  if (day <= 20) return { label: '20th — target 75%', targetPct: 75 }
  if (day <= 30) return { label: '30th — target 80%', targetPct: 80 }
  return { label: '5th next month — target 100%', targetPct: 100 }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = (req.body ?? {}) as Record<string, unknown>
  const action = String(body.action ?? '')

  if (action === 'status') return res.status(200).json({ ok: true, storage: misStorageOk() })

  if (!misRequestAuthed(req)) {
    return res.status(401).json({ error: 'Please sign in with your @agilegroup.co.in email OTP.' })
  }

  if (action === 'login' || action === 'loadMasters') {
    const { ensureBranchPasswords } = await import('../_lib/branch-auth.js')
    await restoreMasterDirectoryIfNeeded()
    const [branches, staff, stats] = await Promise.all([
      ensureBranchPasswords(),
      getStaff(),
      getSiteDirectoryStats(),
    ])
    return res.status(200).json({
      ok: true,
      branches,
      staff,
      siteCounts: stats.siteCounts,
      clientNameCounts: stats.clientNameCounts,
      totalSites: stats.totalSites,
      totalClientNames: stats.totalClientNames,
      clientCounts: stats.siteCounts,
      totalClients: stats.totalSites,
      storageOk: misStorageOk(),
    })
  }

  if (action === 'loadClients') {
    const branchId = String(body.branchId ?? '').trim()
    if (!branchId) return res.status(400).json({ error: 'Select a branch first.' })
    const clients = await getClients(branchId)
    const names = new Set<string>()
    for (const c of clients) {
      const n = String(c.name ?? '').trim().toUpperCase()
      if (n) names.add(n)
    }
    return res.status(200).json({
      ok: true,
      clients,
      count: clients.length,
      siteCount: clients.length,
      clientNameCount: names.size,
    })
  }

  if (!misStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })

  if (action === 'dedupeBranches') {
    const perm = await canManageMisUsers(misRequestEmail(req) || '')
    if (!perm.ok) return res.status(403).json({ error: perm.error })
    const { dedupeMisBranches } = await import('../_lib/mis/branch-dedupe.js')
    const result = await dedupeMisBranches()
    if (!result.ok) return res.status(500).json(result)
    return res.status(200).json(result)
  }

  if (action === 'saveBranches') {
    const { generateBranchPassword, isLegacyBranchPin } = await import('../_lib/branch-auth.js')
    const arr = Array.isArray(body.branches) ? body.branches : []
    const list: MisBranch[] = arr.slice(0, 200).map((b: any) => {
      let pin = String(b.pin ?? '').slice(0, 12)
      if (isLegacyBranchPin(pin)) pin = generateBranchPassword()
      return {
        id: String(b.id || nid('br')),
        name: String(b.name ?? '').trim().slice(0, 80),
        pin,
        active: b.active !== false,
      }
    })
    await saveBranches(list)
    return res.status(200).json({ ok: true, branches: list })
  }

  if (action === 'generateBranchPasswords') {
    const perm = await canManageMisUsers(misRequestEmail(req) || '')
    if (!perm.ok) return res.status(403).json({ error: perm.error })
    const { regenerateAllBranchPasswords } = await import('../_lib/branch-auth.js')
    const branches = await regenerateAllBranchPasswords()
    return res.status(200).json({
      ok: true,
      branches: branches.map((b) => ({ id: b.id, name: b.name, pin: b.pin })),
    })
  }

  if (action === 'regenerateBranchPassword') {
    const perm = await canManageMisUsers(misRequestEmail(req) || '')
    if (!perm.ok) return res.status(403).json({ error: perm.error })
    const branchId = String(body.branchId ?? '').trim()
    if (!branchId) return res.status(400).json({ error: 'Branch id required.' })
    const { generateBranchPassword } = await import('../_lib/branch-auth.js')
    const branches = await getBranches()
    const i = branches.findIndex((b) => b.id === branchId)
    if (i < 0) return res.status(404).json({ error: 'Branch not found.' })
    const pin = generateBranchPassword()
    branches[i] = { ...branches[i], pin }
    await saveBranches(branches)
    return res.status(200).json({
      ok: true,
      branchId,
      name: branches[i].name,
      pin,
    })
  }

  if (action === 'saveClients') {
    const branchId = String(body.branchId ?? '').trim()
    const mergeBranch = body.mergeBranch === true || !!branchId
    const arr = Array.isArray(body.clients) ? body.clients : []
    const list: MisClient[] = arr.slice(0, 5000).map((c: any) => {
      const san = num(c.sanA) + num(c.sanG) + num(c.sanB) + num(c.sanC)
      const starRating = normalizeStarRating(c.starRating, suggestStarRating(String(c.name ?? ''), san, c.highValue === true))
      return {
        id: String(c.id || nid('cl')),
        branchId: String(c.branchId ?? ''),
        name: String(c.name ?? '').slice(0, 120),
        location: String(c.location ?? '').slice(0, 120),
        staffName: String(c.staffName ?? '').slice(0, 120),
        sanA: num(c.sanA), sanG: num(c.sanG), sanB: num(c.sanB), sanC: num(c.sanC),
        slaDayVisit: String(c.slaDayVisit ?? '').slice(0, 60),
        slaNightCheck: String(c.slaNightCheck ?? '').slice(0, 60),
        uniformIssued: String(c.uniformIssued ?? '').slice(0, 120),
        rainGearIssued: String(c.rainGearIssued ?? '').slice(0, 120),
        equipmentIssued: String(c.equipmentIssued ?? '').slice(0, 200),
        starRating,
        highValue: starRating >= 3,
        active: c.active !== false,
        mwCompliant:
          String(c.mwCompliant ?? '').toLowerCase() === 'yes'
            ? 'yes'
            : String(c.mwCompliant ?? '').toLowerCase() === 'no'
              ? 'no'
              : '',
        monthlyBillLacs: num(c.monthlyBillLacs),
        balanceToPayLacs: num(c.balanceToPayLacs),
      }
    })
    const ok = await saveClients(list, mergeBranch && branchId ? { branchOnly: branchId } : undefined)
    if (!ok) {
      return res.status(400).json({
        error: 'Save blocked — client list looks incomplete. Pick a branch, wait for clients to load, then save again.',
      })
    }
    return res.status(200).json({ ok: true, clients: list })
  }

  if (action === 'saveStaff') {
    const arr = Array.isArray(body.staff) ? body.staff : []
    const list: MisStaff[] = arr.slice(0, 5000).map((s: any) => ({
      id: String(s.id || nid('st')),
      branchId: String(s.branchId ?? ''),
      name: String(s.name ?? '').slice(0, 120),
      role: String(s.role ?? '').slice(0, 80),
      phone: String(s.phone ?? '').slice(0, 20),
      active: s.active !== false,
      team: s.team === 'support' ? 'support' : 'operations',
      department: String(s.department ?? '').slice(0, 40),
    }))
    const ok = await saveStaff(list)
    if (!ok) {
      return res.status(400).json({
        error: 'Save blocked — staff list looks incomplete. Reload Master Directory and try again.',
      })
    }
    return res.status(200).json({ ok: true, staff: list })
  }

  if (action === 'saveGuards') {
    const branchId = String(body.branchId ?? '')
    const arr = Array.isArray(body.guards) ? body.guards : []
    const list: MisGuard[] = arr.slice(0, 20000).map((g: any) => ({
      id: String(g.id || nid('gd')),
      branchId,
      clientName: String(g.clientName ?? '').slice(0, 120),
      unitName: String(g.unitName ?? '').slice(0, 120),
      name: String(g.name ?? '').slice(0, 120),
      employeeId: String(g.employeeId ?? '').slice(0, 40),
      mobile: String(g.mobile ?? '').slice(0, 20),
    }))
    await saveGuards(branchId, list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  if (action === 'guards') {
    const branchId = String(body.branchId ?? '')
    const guards = await getGuards(branchId)
    return res.status(200).json({ ok: true, guards })
  }

  if (action === 'saveGuardDocs') {
    const branchId = String(body.branchId ?? '')
    const arr = Array.isArray(body.docs) ? body.docs : []
    const list: MisGuardDoc[] = arr.slice(0, 20000).map((g: any) => ({
      id: String(g.id || nid('gd')),
      branchId,
      unitName: String(g.unitName ?? '').slice(0, 120),
      incharge: String(g.incharge ?? '').slice(0, 120),
      inchargeMobile: String(g.inchargeMobile ?? '').slice(0, 20),
      guardName: String(g.guardName ?? '').slice(0, 120),
      employeeId: String(g.employeeId ?? '').slice(0, 40),
      mobile: String(g.mobile ?? '').slice(0, 20),
      doj: String(g.doj ?? '').slice(0, 40),
      idCardValidity: String(g.idCardValidity ?? '').slice(0, 40),
      aadhar: String(g.aadhar ?? '').slice(0, 40),
      pvc: String(g.pvc ?? '').slice(0, 40),
      pvcValidity: String(g.pvcValidity ?? '').slice(0, 40),
      medical: String(g.medical ?? '').slice(0, 40),
      medicalValidity: String(g.medicalValidity ?? '').slice(0, 40),
      training: String(g.training ?? '').slice(0, 40),
      remarks: String(g.remarks ?? '').slice(0, 200),
      active: g.active !== false,
    }))
    await saveGuardDocs(branchId, list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  if (action === 'guardDocs') {
    const branchId = String(body.branchId ?? '')
    const docs = await getGuardDocs(branchId)
    return res.status(200).json({ ok: true, docs })
  }

  if (action === 'compliance') {
    const date = String(body.date ?? new Date().toISOString().slice(0, 10))
    const [branches, reports, clients] = await Promise.all([getBranches(true), getReportsForDate(date), getClients()])
    const repBy: Record<string, (typeof reports)[number]> = {}
    for (const r of reports) repBy[r.branchId] = r
    const out = [] as any[]
    let strength = 0
    let pvc = 0
    let medical = 0
    let training = 0
    for (const b of branches) {
      const docs = await getGuardDocs(b.id)
      const counts = guardComplianceCounts(docs)
      const branchStrength = repBy[b.id]
        ? reportDeployTotals(repBy[b.id].rows as Record<string, unknown>[], b.id, clients).san
        : 0
      strength += branchStrength
      pvc += counts.pvc
      medical += counts.medical
      training += counts.training
      out.push({
        branchId: b.id,
        branch: b.name,
        strength: branchStrength,
        registered: counts.registered,
        total: branchStrength || counts.registered,
        pvc: counts.pvc,
        medical: counts.medical,
        training: counts.training,
      })
    }
    return res.status(200).json({
      ok: true,
      date,
      compliance: out,
      totals: { strength, pvc, medical, training },
    })
  }

  if (action === 'importVisits') {
    const date = String(body.date ?? '')
    const arr = Array.isArray(body.visits) ? body.visits : []
    const list: MisVisit[] = arr.slice(0, 10000).map((v: any) => ({
      id: String(v.id || nid('vs')),
      date,
      user: String(v.user ?? '').slice(0, 120),
      personMet: String(v.personMet ?? '').slice(0, 120),
      client: String(v.client ?? '').slice(0, 160),
      unit: String(v.unit ?? '').slice(0, 160),
      visitTime: String(v.visitTime ?? '').slice(0, 40),
      place: String(v.place ?? '').slice(0, 120),
      remarks: String(v.remarks ?? '').slice(0, 300),
      visitType: (['D', 'N', 'T'].includes(String(v.visitType ?? '').toUpperCase()) ? String(v.visitType).toUpperCase() : '') as MisVisit['visitType'],
      fromMobile: v.fromMobile === true,
    }))
    await saveVisits(date, list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  if (action === 'syncVisits') {
    const date = String(body.date ?? new Date().toISOString().slice(0, 10))
    const sync = await syncMobileVisits(date, { includeVisits: true, includeDuty: false, includeAttendance: false })
    if (!sync.ok) return res.status(502).json({ error: sync.error || 'Sync failed', ...sync })
    const [visits, dates] = await Promise.all([getVisits(date), getVisitDates()])
    const analysis = await buildVisitAnalysis(date, visits)
    return res.status(200).json({ ok: true, date, visits, dates, sync, analysis })
  }

  if (action === 'visits') {
    const date = String(body.date ?? new Date().toISOString().slice(0, 10))
    const autoSync = body.autoSync === true
    let sync: Awaited<ReturnType<typeof syncMobileVisits>> | null = null
    if (autoSync) {
      sync = await syncMobileVisits(date, { includeVisits: true, includeDuty: false, includeAttendance: false })
    }
    const [visits, dates] = await Promise.all([getVisits(date), getVisitDates()])
    const analysis = await buildVisitAnalysis(date, visits)
    return res.status(200).json({ ok: true, date, visits, dates, sync, analysis })
  }

  if (action === 'dutyIncidents' || action === 'syncDuty') {
    const date = String(body.date ?? new Date().toISOString().slice(0, 10))
    let sync = null
    if (action === 'syncDuty' || body.autoSync === true) {
      sync = await syncMobileVisits(date, { includeVisits: false, includeDuty: true, includeAttendance: false })
    }
    const [incidents, dates] = await Promise.all([getDutyIncidents(date), getDutyDates()])
    const counts = dutyCounts(incidents)
    return res.status(200).json({ ok: true, date, incidents, dates, counts, sync })
  }

  if (action === 'loadCollections') {
    const weekStart = String(body.weekStart ?? '')
    const [collections, branches] = await Promise.all([getCollections(weekStart), getBranches(true)])
    return res.status(200).json({ ok: true, weekStart, collections, branches })
  }
  if (action === 'saveCollections') {
    const weekStart = String(body.weekStart ?? '')
    const arr = Array.isArray(body.collections) ? body.collections : []
    const list: MisCollection[] = arr.slice(0, 500).map((c: any) => ({
      id: String(c.id || nid('col')),
      branchId: String(c.branchId ?? ''),
      weekStart,
      monthlyBilling: normalizeToLacs(c.monthlyBilling) ?? num(c.monthlyBilling),
      budget: normalizeToLacs(c.budget) ?? num(c.budget),
      mon: normalizeToLacs(c.mon) ?? num(c.mon),
      tue: normalizeToLacs(c.tue) ?? num(c.tue),
      wed: normalizeToLacs(c.wed) ?? num(c.wed),
      thu: normalizeToLacs(c.thu) ?? num(c.thu),
      fri: normalizeToLacs(c.fri) ?? num(c.fri),
      sat: normalizeToLacs(c.sat) ?? num(c.sat),
      outstanding: normalizeToLacs(c.outstanding) ?? num(c.outstanding),
      remarks: String(c.remarks ?? '').slice(0, 200),
    }))
    await saveCollections(weekStart, list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  if (action === 'collectionAnalysis') {
    const weekStart = String(body.weekStart ?? '')
    const month = weekStart.slice(0, 7) || new Date().toISOString().slice(0, 7)
    const branches = await getBranches(true)
    const weekCols = await getCollections(weekStart)
    const byB: Record<string, MisCollection> = {}
    for (const c of weekCols) byB[c.branchId] = c

    const mtdByBranch: Record<string, number> = {}
    for (const mon of mondaysInMonth(month)) {
      if (weekStart && mon > weekStart) continue
      const cols = mon === weekStart ? weekCols : await getCollections(mon)
      for (const c of cols) {
        mtdByBranch[c.branchId] = (mtdByBranch[c.branchId] || 0) + weekCollected(c)
      }
    }

    const weekEnd = new Date((weekStart || new Date().toISOString().slice(0, 10)) + 'T00:00:00')
    weekEnd.setDate(weekEnd.getDate() + 6)
    const weekEndStr = weekEnd.toISOString().slice(0, 10)
    const misCollByBranch: Record<string, { sum: number; n: number }> = {}
    for (const d of (await getReportDates()).filter((x) => !weekStart || (x >= weekStart && x <= weekEndStr))) {
      const reps = await getReportsForDate(d)
      for (const r of reps) {
        const p = parseFloat(String(r.summary?.collectionPct ?? '').replace('%', '')) || 0
        if (!p) continue
        const cur = misCollByBranch[r.branchId] || { sum: 0, n: 0 }
        cur.sum += p
        cur.n++
        misCollByBranch[r.branchId] = cur
      }
    }

    const rows = branches.map((b) => {
      const c = byB[b.id]
      const collected = c ? weekCollected(c) : 0
      const budget = c?.budget || 0
      const billing = c?.monthlyBilling || 0
      const outstanding = c?.outstanding || 0
      const achievement = budget > 0 ? Math.round((collected * 100) / budget) : 0
      const ds = collectionDso(outstanding, billing)
      const mtd = mtdByBranch[b.id] || 0
      const mtdPct = billing > 0 ? Math.round((mtd * 100) / billing) : 0
      const misN = misCollByBranch[b.id]
      const misCollectionPct = misN?.n ? Math.round(misN.sum / misN.n) : null
      let status: 'green' | 'amber' | 'red' | 'none' = 'none'
      if (billing > 0 || outstanding > 0 || collected > 0) {
        status = ds <= 30 ? 'green' : ds <= 45 ? 'amber' : 'red'
      }
      return {
        branchId: b.id,
        branch: b.name,
        budget,
        billing,
        collected,
        outstanding,
        achievement,
        dso: ds,
        mtd,
        mtdPct,
        misCollectionPct,
        status,
      }
    })

    const ranked = [...rows].sort((a, b) => b.achievement - a.achievement)
    const worstDso = [...rows].filter((r) => r.status === 'red').sort((a, b) => b.dso - a.dso)
    const worstOutstanding = [...rows].filter((r) => r.outstanding > 0).sort((a, b) => b.outstanding - a.outstanding)

    const totalBilling = rows.reduce((s, r) => s + r.billing, 0)
    const totalBudget = rows.reduce((s, r) => s + r.budget, 0)
    const totalCollected = rows.reduce((s, r) => s + r.collected, 0)
    const totalOutstanding = rows.reduce((s, r) => s + r.outstanding, 0)
    const totalMtd = rows.reduce((s, r) => s + r.mtd, 0)
    const day = new Date().getDate()
    const ms = milestoneExpectation(day)
    const milestoneAch = totalBilling > 0 ? Math.round((totalMtd * 100) / totalBilling) : 0
    const dsoBands = { green: 0, amber: 0, red: 0, none: 0 }
    for (const r of rows) dsoBands[r.status]++

    return res.status(200).json({
      ok: true,
      weekStart,
      month,
      rows: ranked,
      totals: {
        budget: totalBudget,
        billing: totalBilling,
        collected: totalCollected,
        outstanding: totalOutstanding,
        mtd: totalMtd,
        achievement: totalBudget > 0 ? Math.round((totalCollected * 100) / totalBudget) : 0,
      },
      milestone: { ...ms, achievedPct: milestoneAch, onTrack: milestoneAch >= ms.targetPct },
      dsoBands,
      worstDso: worstDso.slice(0, 8),
      worstOutstanding: worstOutstanding.slice(0, 8),
    })
  }

  /** Saturday CC BEFORE xlsx — weekly budget, Mon–Sat collected, branch overdue total */
  if (action === 'importCollectionSheet') {
    const weekStart = String(body.weekStart ?? '')
    const fileName = String(body.fileName ?? 'collection.xlsx').slice(0, 120)
    const {
      decodeUploadBase64,
      parseCollectionCommitmentSheet,
      applyCollectionSheetImport,
    } = await import('../_lib/mis/collection-import.js')
    let buf: Buffer
    try {
      buf = decodeUploadBase64(String(body.data ?? ''))
    } catch {
      return res.status(400).json({ error: 'Could not read the uploaded file. Please try again.' })
    }
    const parsed = parseCollectionCommitmentSheet(buf)
    if (!parsed.length) {
      return res.status(400).json({ error: 'No branch rows found. Use your CC BEFORE Saturday file.' })
    }
    const branches = await getBranches(true)
    const existing = await getCollections(weekStart)
    const result = applyCollectionSheetImport(weekStart, branches, existing, parsed, fileName)
    await saveCollections(weekStart, result.list)
    return res.status(200).json({
      ok: true,
      updated: result.updated,
      unmatched: result.unmatched,
      branches: result.merged.map((r) => ({
        zone: r.zone,
        budget: r.budget,
        outstanding: r.outstanding,
        collected: num(r.mon) + num(r.tue) + num(r.wed) + num(r.thu) + num(r.fri) + num(r.sat),
      })),
      count: result.list.length,
    })
  }

  /** OST BILLS xls/xlsx — branch outstanding + June billing (lakhs) */
  if (action === 'importOutstandingFile') {
    const weekStart = String(body.weekStart ?? '')
    const fileName = String(body.fileName ?? 'outstanding.xls').slice(0, 120)
    const {
      decodeUploadBase64,
      parseOutstandingStatement,
      applyOutstandingImport,
    } = await import('../_lib/mis/collection-import.js')
    let buf: Buffer
    try {
      buf = decodeUploadBase64(String(body.data ?? ''))
    } catch {
      return res.status(400).json({ error: 'Could not read the uploaded file. Please try again.' })
    }
    const parsed = parseOutstandingStatement(buf)
    if (!parsed.length) {
      return res.status(400).json({ error: 'No outstanding data found in file.' })
    }
    const branches = await getBranches(true)
    const existing = await getCollections(weekStart)
    const result = applyOutstandingImport(weekStart, branches, existing, parsed, fileName)
    await saveCollections(weekStart, result.list)
    return res.status(200).json({
      ok: true,
      updated: result.updated,
      unmatched: result.unmatched,
      branches: parsed.map((r) => ({
        zone: r.zone,
        outstanding: Math.round(r.outstanding * 100) / 100,
        monthlyBilling: Math.round(r.monthlyBilling * 100) / 100,
        clients: r.clients,
      })),
      count: result.list.length,
    })
  }

  /** Saturday outstanding statement paste — Branch, Outstanding, optional Monthly Billing & Budget */
  if (action === 'bulkOutstanding') {
    const weekStart = String(body.weekStart ?? '')
    const text = String(body.text ?? '')
    const branches = await getBranches(true)
    const byName: Record<string, MisBranch> = {}
    for (const b of branches) byName[b.name.trim().toUpperCase()] = b

    const existing = await getCollections(weekStart)
    const byId: Record<string, MisCollection> = {}
    for (const c of existing) byId[c.branchId] = c

    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    let updated = 0
    const unmatched: string[] = []

    for (const line of lines) {
      if (/^branch/i.test(line) && /outstanding/i.test(line)) continue
      const parts = line.split(/[,\t]/).map((p) => p.trim())
      if (parts.length < 2) continue
      const bname = parts[0].toUpperCase()
      const br = byName[bname]
      if (!br) { unmatched.push(parts[0]); continue }
      const outstanding = num(parts[1].replace(/[^\d.]/g, ''))
      const monthlyBilling = parts[2] ? num(parts[2].replace(/[^\d.]/g, '')) : 0
      const budget = parts[3] ? num(parts[3].replace(/[^\d.]/g, '')) : 0
      const cur = byId[br.id] || {
        id: nid('col'), branchId: br.id, weekStart,
        monthlyBilling: 0, budget: 0, mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, outstanding: 0, remarks: '',
      }
      cur.outstanding = outstanding
      if (monthlyBilling) cur.monthlyBilling = monthlyBilling
      if (budget) cur.budget = budget
      cur.remarks = 'Updated from Saturday outstanding upload'
      byId[br.id] = cur
      updated++
    }

    const list = Object.values(byId)
    await saveCollections(weekStart, list)
    return res.status(200).json({ ok: true, updated, unmatched, count: list.length })
  }

  if (action === 'syncGuardsComplaints') {
    const { syncGuardsComplaintsToMis } = await import('../_lib/mis/guards-complaint-sync.js')
    const result = await syncGuardsComplaintsToMis()
    return res.status(200).json({ ok: true, ...result })
  }

  if (action === 'loadComplaints') {
    const branchId = String(body.branchId ?? '')
    if (body.syncGuards !== false) {
      const { syncGuardsComplaintsToMis } = await import('../_lib/mis/guards-complaint-sync.js')
      await syncGuardsComplaintsToMis().catch(() => null)
    }
    const [complaints, clients] = await Promise.all([getComplaints(branchId), getClients(branchId)])
    return res.status(200).json({ ok: true, complaints, clients })
  }
  if (action === 'saveComplaints') {
    const branchId = String(body.branchId ?? '')
    const arr = Array.isArray(body.complaints) ? body.complaints : []
    const mapped: MisComplaint[] = arr.slice(0, 10000).map((c: any) => ({
      id: String(c.id || nid('cmp')),
      code: String(c.code ?? '').slice(0, 30),
      branchId,
      clientName: String(c.clientName ?? '').slice(0, 160),
      location: String(c.location ?? '').slice(0, 160),
      incidentDate: String(c.incidentDate ?? '').slice(0, 20),
      type: String(c.type ?? 'Client').slice(0, 20),
      description: String(c.description ?? '').slice(0, 500),
      actionTaken: String(c.actionTaken ?? '').slice(0, 500),
      momWithin24h: c.momWithin24h === true,
      status: String(c.status ?? 'Open').slice(0, 20),
      reportedBy: String(c.reportedBy ?? '').slice(0, 80),
      source: String(c.source ?? 'manual').slice(0, 20),
      channel: String(c.channel ?? '').slice(0, 20),
      emailId: String(c.emailId ?? '').slice(0, 80),
      fromEmail: String(c.fromEmail ?? '').slice(0, 120),
      subject: String(c.subject ?? '').slice(0, 200),
      importedAt: String(c.importedAt ?? '').slice(0, 30),
      registeredAt: String(c.registeredAt ?? '').slice(0, 30),
      active: c.active !== false,
    }))
    const list = await ensureComplaintCodes(mapped)
    await saveComplaints(branchId, list)
    return res.status(200).json({ ok: true, count: list.length, complaints: list })
  }

  if (action === 'complaintsAnalysis') {
    const month = String(body.month ?? new Date().toISOString().slice(0, 7))
    const branches = await getBranches(true)
    const complaintsMap = await getComplaintsMany(branches.map((b) => b.id))
    const inbox = await getDirectorInboxComplaints()
    const branchRows: any[] = []
    const openIncidents: any[] = []
    const totals = { total: 0, open: 0, closed: 0, momOk: 0, client: 0, guard: 0, thisMonth: 0 }

    for (const b of branches) {
      const cs = complaintsMap.get(b.id) ?? []
      let open = 0
      let closed = 0
      let mom = 0
      let cl = 0
      let gd = 0
      let monthCount = 0
      for (const c of cs) {
        if (c.active === false) continue
        totals.total++
        if (c.status === 'Closed') closed++
        else open++
        if (c.momWithin24h) {
          mom++
          totals.momOk++
        }
        if (c.type === 'Guard') {
          gd++
          totals.guard++
        } else {
          cl++
          totals.client++
        }
        if (c.incidentDate?.startsWith(month)) {
          monthCount++
          totals.thisMonth++
        }
        if (c.status !== 'Closed') {
          openIncidents.push({
            code: c.code || '',
            branch: b.name,
            branchId: b.id,
            clientName: c.clientName,
            location: c.location,
            incidentDate: c.incidentDate,
            type: c.type,
            channel: c.channel || '',
            description: c.description,
            momWithin24h: c.momWithin24h,
            reportedBy: c.reportedBy,
          })
        }
      }
      totals.open += open
      totals.closed += closed
      const activeCount = cs.filter((c) => c.active !== false).length
      branchRows.push({
        branch: b.name,
        branchId: b.id,
        total: activeCount,
        open,
        closed,
        momPct: activeCount ? Math.round((mom * 100) / activeCount) : 0,
        client: cl,
        guard: gd,
        monthCount,
      })
    }

    branchRows.sort((a, b) => b.open - a.open || b.total - a.total)
    openIncidents.sort((a, b) => String(b.incidentDate).localeCompare(String(a.incidentDate)))

    for (const c of inbox) {
      totals.total++
      if (c.status === 'Closed') totals.closed++
      else totals.open++
      if (c.momWithin24h) totals.momOk++
      totals.client++
      if (c.incidentDate?.startsWith(month)) totals.thisMonth++
      if (c.status !== 'Closed') {
        openIncidents.push({
          code: c.code || '',
          branch: 'Director Inbox (unassigned)',
          branchId: '',
          clientName: c.clientName,
          location: c.location,
          incidentDate: c.incidentDate,
          type: c.type,
          channel: c.channel || 'Email',
          description: c.description,
          momWithin24h: c.momWithin24h,
          reportedBy: c.reportedBy || c.fromEmail,
          source: 'inbox',
        })
      }
    }

    return res.status(200).json({
      ok: true,
      month,
      branches: branchRows,
      totals: {
        ...totals,
        momPct: totals.total ? Math.round((totals.momOk * 100) / totals.total) : 0,
        resolutionPct: totals.total ? Math.round((totals.closed * 100) / totals.total) : 0,
        inboxPending: inbox.filter((c) => c.status !== 'Closed').length,
      },
      openIncidents: openIncidents.slice(0, 40),
      directorInbox: inbox.slice(0, 50),
    })
  }

  if (action === 'loadDirectorInbox') {
    const [inbox, branches] = await Promise.all([getDirectorInboxComplaints(), getBranches(true)])
    return res.status(200).json({ ok: true, inbox, branches })
  }

  if (action === 'saveDirectorInbox') {
    const arr = Array.isArray(body.inbox) ? body.inbox : []
    const list: MisComplaint[] = arr.slice(0, 500).map((c: any) => ({
      id: String(c.id || nid('cmp')),
      branchId: '',
      clientName: String(c.clientName ?? '').slice(0, 160),
      location: String(c.location ?? '').slice(0, 160),
      incidentDate: String(c.incidentDate ?? '').slice(0, 20),
      type: String(c.type ?? 'Client').slice(0, 20),
      description: String(c.description ?? '').slice(0, 500),
      actionTaken: String(c.actionTaken ?? '').slice(0, 500),
      momWithin24h: c.momWithin24h === true,
      status: String(c.status ?? 'Open').slice(0, 20),
      reportedBy: String(c.reportedBy ?? '').slice(0, 80),
      source: String(c.source ?? 'inbox').slice(0, 20),
      emailId: String(c.emailId ?? '').slice(0, 80),
      fromEmail: String(c.fromEmail ?? '').slice(0, 120),
      subject: String(c.subject ?? '').slice(0, 200),
      importedAt: String(c.importedAt ?? '').slice(0, 30),
      active: c.active !== false,
    }))
    await saveDirectorInboxComplaints(list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  if (action === 'assignInboxComplaint') {
    const complaintId = String(body.complaintId ?? '')
    const branchId = String(body.branchId ?? '')
    if (!complaintId || !branchId) return res.status(400).json({ error: 'Complaint and branch required' })
    const ok = await assignInboxComplaintToBranch(complaintId, branchId)
    if (!ok) return res.status(404).json({ error: 'Complaint not found in inbox' })
    return res.status(200).json({ ok: true })
  }

  if (action === 'deleteInboxComplaint') {
    const complaintId = String(body.complaintId ?? '')
    if (!complaintId) return res.status(400).json({ error: 'Complaint id required' })
    const ok = await deleteInboxComplaint(complaintId)
    if (!ok) return res.status(404).json({ error: 'Complaint not found in inbox' })
    return res.status(200).json({ ok: true })
  }

  if (action === 'deleteComplaint') {
    const branchId = String(body.branchId ?? '')
    const complaintId = String(body.complaintId ?? '')
    if (!branchId || !complaintId) return res.status(400).json({ error: 'Branch and complaint required' })
    const ok = await deleteBranchComplaint(branchId, complaintId)
    if (!ok) return res.status(404).json({ error: 'Complaint not found' })
    return res.status(200).json({ ok: true })
  }

  if (action === 'syncComplaintInbox') {
    const sync = await syncComplaintsFromGmail()
    if (!sync.ok && !sync.skipped) return res.status(502).json({ error: sync.error || 'Sync failed' })
    const inbox = await getDirectorInboxComplaints()
    return res.status(200).json({ ok: true, ...sync, inboxCount: inbox.length })
  }

  if (action === 'reports') {
    const range = resolveDashboardPeriod({ ...body, date: body.dateFor })
    const payload = await getCachedMdSummary(
      `reports:${range.cacheKey}`,
      async () => {
        const branches = await getBranches(true)
        const [clients, reportsByDate] = await Promise.all([
          getClients(undefined, { skipRepair: true, branches }),
          getReportsForDates(range.dates, branches),
        ])
        const latestMap = pickLatestBranchReports(branches, reportsByDate, range.dates)
        const normalizedReports: MisReport[] = []
        const branchTotals: Record<string, ReturnType<typeof reportDeployTotals>> = {}
        const periodStats: Record<string, ReturnType<typeof aggregateBranchPeriodStats>> = {}
        for (const b of branches) {
          const r = latestMap.get(b.id)
          if (!r) continue
          const agg = aggregateBranchPeriodStats(b.id, reportsByDate, range.dates)
          periodStats[b.id] = agg
          const summary =
            range.period === 'day'
              ? r.summary
              : {
                  ...(r.summary ?? {}),
                  resignation: agg.resignation,
                  recruitment: agg.recruitment,
                  complaints: agg.complaints,
                }
          normalizedReports.push({
            ...(r.branchId === b.id ? r : { ...r, branchId: b.id, branchName: b.name, id: `${b.id}:${r.dateFor}` }),
            summary,
          })
          branchTotals[b.id] = reportDeployTotals(r.rows as Record<string, unknown>[], b.id, clients)
        }
        const snapshotDate =
          range.period === 'day' ? range.anchorDate : [...latestMap.values()].sort((a, b) => String(b.dateFor).localeCompare(String(a.dateFor)))[0]?.dateFor ?? range.anchorDate
        return {
          ok: true,
          period: range.period,
          periodLabel: range.label,
          dateFor: snapshotDate,
          rangeStart: range.dates[0],
          rangeEnd: range.dates[range.dates.length - 1],
          periodDays: range.dates.length,
          branches,
          reports: normalizedReports,
          branchTotals,
          periodStats,
          submitted: normalizedReports.length,
          total: branches.length,
        }
      },
      range.anchorDate,
    )
    return res.status(200).json(payload)
  }

  if (action === 'mdsummary') {
    const range = resolveDashboardPeriod(body)
    const payload = await getCachedMdSummary(
      range.cacheKey,
      async () => {
        const branches = await getBranches(true)
        const branchIds = branches.map((b) => b.id)
        const [reportsByDate, clients, cols, visits, guardDocsMap, complaintsMap] = await Promise.all([
          getReportsForDates(range.dates, branches),
          getClients(undefined, { skipRepair: true, branches }),
          range.period === 'month'
            ? Promise.all(mondaysInMonth(range.monthKey).map((w) => getCollections(w))).then((weekRows) =>
                mergeMonthCollections(weekRows.flat()),
              )
            : getCollections(range.weekStart),
          range.period === 'day' ? getVisits(range.anchorDate) : getVisitsMany(range.dates),
          getGuardDocsMany(branchIds),
          getComplaintsMany(branchIds),
        ])
        const dutyIncidents =
          range.period === 'day' ? await getDutyIncidents(range.anchorDate) : []

        const repByMap = pickLatestBranchReports(branches, reportsByDate, range.dates)
        const repBy: Record<string, MisReport> = {}
        for (const [id, r] of repByMap) repBy[id] = r

        const snapshotDate =
          range.period === 'day'
            ? range.anchorDate
            : [...repByMap.values()].sort((a, b) => String(b.dateFor).localeCompare(String(a.dateFor)))[0]?.dateFor ?? range.anchorDate

        const allReports = [...reportsByDate.values()].flat()

        const deployment: any[] = []
        const vacantRows: any[] = []
        let TS = 0, TD = 0, TA = 0, TO = 0, TV = 0, TRes = 0, TRec = 0
        for (const b of branches) {
          const r = repBy[b.id]
          const agg = aggregateBranchPeriodStats(b.id, reportsByDate, range.dates)
          if (!r) {
            deployment.push({ branch: b.name, submitted: false, daysSubmitted: 0, san: 0, dep: 0, abs: 0, ot: 0, vac: 0 })
            continue
          }
          const t = reportDeployTotals(r.rows as Record<string, unknown>[], b.id, clients)
          for (const row of filterActiveReportRows(b.id, r.rows as Record<string, unknown>[], clients)) {
            const rt = rowDeployTotals(row)
            if (rt.vac > 0) {
              vacantRows.push({
                branchId: b.id,
                branch: b.name,
                client: String(row.clientName ?? ''),
                unit: String(row.location ?? ''),
                san: rt.san,
                abs: rt.abs,
                ot: rt.ot,
                dep: rt.dep,
                vac: rt.vac,
                fill: deployPct(rt.dep, rt.san),
              })
            }
          }
          const resignation = range.period === 'day' ? summaryResignationNum(r.summary) : agg.resignation
          const recruitment = range.period === 'day' ? summaryRecruitmentNum(r.summary) : agg.recruitment
          deployment.push({
            branch: b.name,
            submitted: true,
            daysSubmitted: agg.daysSubmitted,
            san: t.san,
            dep: t.dep,
            abs: t.abs,
            ot: t.ot,
            vac: t.vac,
            collectionPct: r.summary?.collectionPct || '',
            resignation,
            recruitment,
            depPct: deployPct(t.dep, t.san),
          })
          TS += t.san
          TD += t.dep
          TA += t.abs
          TO += t.ot
          TV += t.vac
          TRes += resignation
          TRec += recruitment
        }
        TV = Math.max(0, TA - TO)
        TD = Math.min(TS, Math.max(0, TS - TV))
        const vacantSummary = buildVacantSummary(vacantRows)

        const compliance: any[] = []
        let cPvc = 0, cMed = 0, cTrn = 0
        for (const b of branches) {
          const docs = guardDocsMap.get(b.id) ?? []
          const counts = guardComplianceCounts(docs)
          const branchStrength = repBy[b.id]
            ? reportDeployTotals(repBy[b.id].rows as Record<string, unknown>[], b.id, clients).san
            : 0
          compliance.push({
            branch: b.name,
            strength: branchStrength,
            registered: counts.registered,
            total: branchStrength || counts.registered,
            pvc: counts.pvc,
            medical: counts.medical,
            training: counts.training,
          })
          cPvc += counts.pvc
          cMed += counts.medical
          cTrn += counts.training
        }

        let colBudget = 0, colCollected = 0, colOutstanding = 0
        for (const c of cols) {
          colBudget += Number(c.budget) || 0
          colCollected += weekCollected(c)
          colOutstanding += Number(c.outstanding) || 0
        }

        let cmpOpen = 0, cmpClosed = 0, cmpTotal = 0
        for (const b of branches) {
          const cs = complaintsMap.get(b.id) ?? []
          for (const c of cs) {
            cmpTotal++
            if (c.status === 'Closed') cmpClosed++
            else cmpOpen++
          }
        }

        const visitStaff: Record<string, number> = {}
        for (const v of visits) visitStaff[v.user] = (visitStaff[v.user] || 0) + 1

        const starClients = { strategic: 0, highValue: 0, valued: 0 }
        for (const c of clients) {
          if (c.active === false) continue
          const s = normalizeStarRating(c.starRating)
          if (s >= 5) starClients.strategic++
          else if (s >= 3) starClients.highValue++
          else starClients.valued++
        }

        const dashboard = await buildDashboardExtras(snapshotDate, range.weekStart, {
          branches,
          reports: range.period === 'day' ? allReports.filter((r) => r.dateFor === range.anchorDate) : allReports,
          visits,
          guardDocsMap,
          complaintsMap,
          clients,
          cols,
          dutyIncidents,
        }, { includeSla: body.sla === true })

        return {
          ok: true,
          period: range.period,
          periodLabel: range.label,
          date: snapshotDate,
          weekStart: range.weekStart,
          rangeStart: range.dates[0],
          rangeEnd: range.dates[range.dates.length - 1],
          periodDays: range.dates.length,
          branchCount: branches.length,
          deployment,
          totals: { san: TS, dep: TD, abs: TA, ot: TO, vac: TV, resignation: TRes, recruitment: TRec },
          submitted: repByMap.size,
          vacantRows: vacantSummary.vacantRows,
          vacantGrouped: vacantSummary.vacantGrouped,
          vacantBranches: vacantSummary.vacantBranches,
          compliance,
          complianceTotals: { strength: TS, total: TS, pvc: cPvc, medical: cMed, training: cTrn },
          collection: {
            budget: colBudget,
            collected: colCollected,
            outstanding: colOutstanding,
            branches: cols.length,
            pct: dashboard.collection.weeklyPct,
            overallPct: dashboard.collection.overallPct,
            dsoOver90Receivable: dashboard.collection.dsoOver90Receivable,
            dsoOver90Branches: dashboard.collection.dsoOver90Branches,
            avgDso: dashboard.collection.avgDso,
          },
          complaints: { total: cmpTotal, open: cmpOpen, closed: cmpClosed },
          visits: { total: visits.length, staff: Object.keys(visitStaff).length, byStaff: visitStaff },
          starClients,
          clientTiers: dashboard.clientTiers,
          opsVisits: dashboard.opsVisits,
          dutyStart: dashboard.dutyStart,
          complaintsByTier: dashboard.complaintsByTier,
          slaPending: dashboard.slaPending,
        }
      },
      range.anchorDate,
    )
    return res.status(200).json(payload)
  }

  if (action === 'submission') {
    const date = String(body.date ?? misTodayIst())
    const today = misTodayIst()
    const yesterday = misYesterdayIst()
    const [branches, reports, clients, yesterdayReports] = await Promise.all([
      getBranches(true),
      getReportsForDate(date),
      getClients(),
      date === today ? getReportsForDate(yesterday) : Promise.resolve([]),
    ])
    const clientCount: Record<string, number> = {}
    const activeClients = clients.filter((c) => c.active !== false)
    for (const b of branches) {
      clientCount[b.id] = filterClientsForBranch(activeClients, b.id, branches).length
    }
    const reportMap = buildBranchReportMap(branches, reports)
    const wrongDateMap = buildBranchReportMap(branches, yesterdayReports)
    const cutoff = misDeadlineUtc(date)
    const reminders = await getReminderTimes(
      date,
      branches.map((b) => b.id),
    )
    const rows = branches.map((b) => {
      const r = reportMap.get(b.id)
      const wd = date === today && !r ? wrongDateMap.get(b.id) : null
      const wdMeta =
        wd && isSubmittedTodayIst(wd.submittedAt)
          ? { reportDate: wd.dateFor || yesterday, at: wd.submittedAt, submittedBy: wd.submittedBy || '' }
          : null
      const cc = clientCount[b.id] || 0
      const remindedAt = reminders[b.id] || ''
      if (!r) {
        if (wdMeta) {
          return {
            branchId: b.id,
            branch: b.name,
            submitted: false,
            wrongDate: true,
            wrongDateFor: wdMeta.reportDate,
            at: wdMeta.at,
            onTime: false,
            submittedBy: wdMeta.submittedBy,
            clientCount: cc,
            noClients: cc === 0,
            remindedAt,
          }
        }
        return { branchId: b.id, branch: b.name, submitted: false, at: '', onTime: false, graceOnTime: false, performanceZero: true, submittedBy: '', clientCount: cc, noClients: cc === 0, remindedAt }
      }
      const at = new Date(r.submittedAt).getTime()
      const onTime = at <= cutoff
      const graceOnTime = isExcusedLateMisSubmission(date, r.submittedAt)
      return {
        branchId: b.id,
        branch: b.name,
        submitted: true,
        at: r.submittedAt,
        onTime,
        graceOnTime,
        performanceZero: !graceOnTime,
        submittedBy: r.submittedBy || '',
        clientCount: cc,
        noClients: cc === 0,
        remindedAt,
      }
    })
    rows.sort((a, b) => {
      if (a.submitted !== b.submitted) return a.submitted ? 1 : -1
      if (Boolean(a.wrongDate) !== Boolean(b.wrongDate)) return a.wrongDate ? -1 : 1
      return a.branch.localeCompare(b.branch)
    })
    const submitted = rows.filter((r) => r.submitted).length
    const onTime = rows.filter((r) => r.onTime).length
    const wrongDate = rows.filter((r) => r.wrongDate).length
    const noClientBranches = rows.filter((r) => r.noClients).map((r) => r.branch)
    return res.status(200).json({ ok: true, date, total: branches.length, submitted, pending: branches.length - submitted, onTime, wrongDate, rows, noClientBranches })
  }

  if (action === 'remindPending') {
    const date = String(body.date ?? new Date().toISOString().slice(0, 10))
    await ensureTelanganaHodUsers()
    const mail = await sendMisSubmissionReminders(date, 'midday', undefined, { ccDirector: true })
    if (!mail.ok && !mail.skipped) return res.status(502).json({ error: mail.error || 'Could not send reminders' })
    return res.status(200).json({ ok: true, pendingCount: mail.sent?.length ?? 0, sent: mail.sent, skipped: mail.skipped, directorCc: mail.directorCc })
  }

  if (action === 'remindBranchHod') {
    const date = String(body.date ?? new Date().toISOString().slice(0, 10))
    const branchId = String(body.branchId ?? '')
    if (!branchId) return res.status(400).json({ error: 'Branch required' })
    await ensureTelanganaHodUsers()
    const mail = await sendMisSubmissionReminders(date, 'midday', [branchId], { force: true, ccDirector: true })
    if (!mail.ok && !mail.skipped) return res.status(502).json({ error: mail.error || 'Could not send reminder' })
    return res.status(200).json({ ok: true, sent: mail.sent, skipped: mail.skipped, emailed: mail.emailed, directorCc: mail.directorCc })
  }

  if (action === 'sendConsolidatedMail') {
    const date = String(body.date ?? new Date().toISOString().slice(0, 10))
    const toRaw = String(body.to ?? process.env.MIS_DIRECTOR_EMAIL ?? process.env.FLEET_DIRECTOR_EMAIL ?? 'director@agilegroup.co.in')
    const to = toRaw.split(/[,;\s]+/).map((e) => e.trim()).filter((e) => e.includes('@'))
    const mail = await sendConsolidatedMisMail(date, to)
    if (!mail.ok) return res.status(502).json({ error: mail.error })
    return res.status(200).json({ ok: true, to: mail.to })
  }

  if (action === 'sendMdReportMail') {
    const date = String(body.date ?? new Date().toISOString().slice(0, 10))
    const toMd = body.toMd === true
    const toRaw = toMd
      ? (process.env.MIS_MD_EMAIL?.trim() || process.env.MIS_MD_SIR_EMAIL?.trim() || 'md@agilegroup.co.in')
      : String(body.to ?? process.env.MIS_DIRECTOR_EMAIL ?? 'director@agilegroup.co.in')
    const to = toRaw.split(/[,;\s]+/).map((e) => e.trim()).filter((e) => e.includes('@'))
    const summary = await getCachedMdSummary(date, async () => {
      const payload = await (async () => {
        const d0 = new Date(date + 'T00:00:00')
        const wd = (d0.getDay() + 6) % 7
        const wk = new Date(d0)
        wk.setDate(wk.getDate() - wd)
        const weekStart = wk.toISOString().slice(0, 10)
        const branches = await getBranches(true)
        const [reports, clients] = await Promise.all([getReportsForDate(date), getClients()])
        let TS = 0, TD = 0, TV = 0
        for (const r of reports) {
          const t = reportDeployTotals(r.rows as Record<string, unknown>[], r.branchId, clients)
          TS += t.san; TD += t.dep; TV += t.vac
        }
        return { date, branchCount: branches.length, submitted: reports.length, totals: { san: TS, dep: TD, vac: TV } }
      })()
      return payload
    })
    const mail = await sendMdSirReportMail(date, to, summary as Record<string, unknown>)
    if (!mail.ok) return res.status(502).json({ error: mail.error })
    return res.status(200).json({ ok: true, to: mail.to })
  }

  if (action === 'bpi') {
    const date = String(body.date ?? new Date().toISOString().slice(0, 10))
    const [branches, reports, clients] = await Promise.all([getBranches(true), getReportsForDate(date), getClients()])
    const repBy: Record<string, (typeof reports)[number]> = {}
    for (const r of reports) repBy[r.branchId] = r
    const scores: any[] = []
    for (const b of branches) {
      const r = repBy[b.id]
      if (!r || !countsForMisDailyPerformance(date, r.submittedAt)) {
        scores.push({
          branchId: b.id,
          branch: b.name,
          displayName: misBranchDisplayName(b.id, b.name),
          deployment: 0,
          compliance: 0,
          client: 0,
          admin: 0,
          bpi: 0,
          submitted: Boolean(r),
          performanceZero: true,
          zeroReason: !r ? 'Not submitted' : 'Submitted after 4:00 PM IST',
        })
        continue
      }
      const t = reportDeployTotals(r.rows as Record<string, unknown>[], b.id, clients)
      const dep = deployPct(t.dep, t.san)
      const docs = await getGuardDocs(b.id)
      let comp = 0
      if (docs.length) {
        let p = 0, m = 0, tr = 0
        for (const dc of docs) {
          if (docPresent(dc.pvc)) p++
          if (docPresent(dc.medical)) m++
          if (docPresent(dc.training)) tr++
        }
        comp = Math.round(((p + m + tr) / (docs.length * 3)) * 100)
      }
      const cs = await getComplaints(b.id)
      const open = cs.filter((c) => c.status !== 'Closed').length
      const sat = Math.max(0, 100 - open * 10)
      const admin = 100
      const bpi = Math.round(dep * 0.4 + comp * 0.3 + sat * 0.2 + admin * 0.1)
      scores.push({
        branchId: b.id,
        branch: b.name,
        displayName: misBranchDisplayName(b.id, b.name),
        deployment: dep,
        compliance: comp,
        client: sat,
        admin,
        bpi,
        submitted: true,
        performanceZero: false,
      })
    }
    scores.sort((a, b) => b.bpi - a.bpi)
    return res.status(200).json({ ok: true, date, scores })
  }

  if (action === 'clientList') {
    const clients = await getClients()
    const names = Array.from(new Set(clients.map((c) => c.name).filter(Boolean))).sort()
    return res.status(200).json({ ok: true, clients: names })
  }

  if (action === 'clientPerf') {
    const { resolveClientPerfRange, buildClientPerformance } = await import('../_lib/mis/client-performance.js')
    const range = resolveClientPerfRange(body)
    const result = await buildClientPerformance({
      clientName: String(body.clientName ?? ''),
      from: range.from,
      to: range.to,
    })
    if (result.ok === false) return res.status(400).json({ error: result.error })
    return res.status(200).json(result)
  }

  if (action === 'sendClientPerfMail') {
    const toRaw = String(body.to ?? '')
    const to = toRaw.split(/[,;\s]+/).map((e) => e.trim()).filter((e) => e.includes('@'))
    const mail = await sendClientPerformanceMail(to, clientPerfSharePayload(body))
    if (!mail.ok) return res.status(502).json({ error: mail.error })
    return res.status(200).json({ ok: true, to: mail.to })
  }

  if (action === 'clientPerfLetterHtml' || action === 'clientPerfReportHtml') {
    const html = buildClientPerfReportEmailHtml(clientPerfSharePayload(body))
    return res.status(200).json({ ok: true, html })
  }

  if (action === 'loadUsers') {
    const gate = await canManageMisUsers(misRequestEmail(req))
    if (!gate.ok) return res.status(403).json({ error: gate.error })
    let users = await getUsers()
    if (users.length === 0) {
      users = defaultMisUsers()
      await saveUsers(users)
    }
    const [branches] = await Promise.all([getBranches(true)])
    return res.status(200).json({ ok: true, users, branches })
  }
  if (action === 'saveUsers') {
    const gate = await canManageMisUsers(misRequestEmail(req))
    if (!gate.ok) return res.status(403).json({ error: gate.error })
    const arr = Array.isArray(body.users) ? body.users : []
    const list: MisUser[] = arr.slice(0, 5000).map((u: any) =>
      normalizeMisUserTeamFields({
        id: String(u.id || nid('us')),
        name: String(u.name ?? '').slice(0, 120),
        email: normaliseEmail(String(u.email ?? '')).slice(0, 120),
        phone: String(u.phone ?? '').slice(0, 20),
        role: String(u.role ?? '').slice(0, 60),
        branchId: String(u.branchId ?? '').slice(0, 40),
        active: u.active !== false,
        team: u.team === 'support' ? 'support' : 'operations',
        department: String(u.department ?? '').slice(0, 40),
      }),
    )
    for (const u of list) {
      if (u.email && !u.email.endsWith('@agilegroup.co.in')) {
        return res.status(400).json({ error: `Email must be @agilegroup.co.in — check: ${u.email || u.name}` })
      }
      if (!u.name.trim()) {
        return res.status(400).json({ error: 'Every user needs a name.' })
      }
    }
    await saveUsers(list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  if (action === 'loadDocs') {
    const docs = await getDocs()
    return res.status(200).json({ ok: true, docs })
  }
  if (action === 'saveDocs') {
    const arr = Array.isArray(body.docs) ? body.docs : []
    const list: MisDoc[] = arr.slice(0, 5000).map((d: any) => ({
      id: String(d.id || nid('dc')),
      title: String(d.title ?? '').slice(0, 200),
      category: String(d.category ?? '').slice(0, 60),
      link: String(d.link ?? '').slice(0, 600),
      notes: String(d.notes ?? '').slice(0, 500),
      addedBy: String(d.addedBy ?? '').slice(0, 80),
      date: String(d.date ?? '').slice(0, 20),
      active: d.active !== false,
    }))
    await saveDocs(list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  if (action === 'sendFormatMail') {
    const emails = (v: unknown) => String(v ?? '').split(/[,;\s]+/).map((e) => e.trim()).filter((e) => e.includes('@'))
    const to = emails(body.to)
    const cc = emails(body.cc)
    const subject = String(body.subject ?? 'Agile Security Force').slice(0, 200)
    const text = String(body.body ?? '')
    if (!to.length) return res.status(400).json({ error: 'Please enter at least one valid TO email.' })
    const apiKey = process.env.RESEND_API_KEY?.trim()
    if (!apiKey) return res.status(503).json({ error: 'Email service not configured.' })
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(apiKey)
      const from = process.env.EMAIL_FROM ?? 'Agile Security Force <noreply@agilegroup.co.in>'
      const result = await sendSuiteEmail(resend, {
        from, to, cc,
        subject,
        text,
        html: `<div style="font-family:Arial,sans-serif;white-space:pre-wrap;font-size:14px;color:#111">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`,
      })
      if ((result as any).error) return res.status(502).json({ error: (result as any).error.message || 'Send failed' })
      return res.status(200).json({ ok: true })
    } catch (e) {
      return res.status(502).json({ error: e instanceof Error ? e.message : 'Send failed' })
    }
  }

  if (action === 'loadFormats') {
    const formats = await getFormats()
    return res.status(200).json({ ok: true, formats })
  }
  if (action === 'saveFormats') {
    const arr = Array.isArray(body.formats) ? body.formats : []
    const list: MisFormat[] = arr.slice(0, 500).map((f: any) => ({
      id: String(f.id || nid('fmt')),
      title: String(f.title ?? '').slice(0, 160),
      category: String(f.category ?? 'Other').slice(0, 40),
      body: String(f.body ?? '').slice(0, 20000),
      active: f.active !== false,
    }))
    await saveFormats(list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  return res.status(400).json({ error: 'Unknown action.' })
}
