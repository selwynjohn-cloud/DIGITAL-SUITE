import type { VercelRequest, VercelResponse } from '@vercel/node'
import { normalizeGuardDocOnSave } from '../_lib/mis/guard-renewal.js'
import { sendSuiteEmail } from '../_lib/suite-mail.js'
import {
  docPresent,
  ensureComplaintCodes,
  getBranches,
  getMisReportBranches,
  isMisReportingBranch,
  getClientCounts,
  getSiteDirectoryStats,
  getClientBookFreeze,
  restoreMasterDirectoryIfNeeded,
  getClients,
  guardRecordEligible,
  getCollections,
  getCollectionBaseline,
  getLatestOstBaseline,
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
  reopenSubmittedMisReport,
  repairSubmittedMisReportOt,
  deleteMisReport,
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
import { normalizeMisUserTeamFields, canonicalSupportDepartment, SUPPORT_DEPARTMENTS } from '../_lib/user-team.js'
import { filterClientsForBranch } from '../_lib/mis/client-branch.js'
import { misRequestAuthed, misRequestEmail, misSessionSetCookie } from '../_lib/mis/session.js'
import { verifyManagementSuiteSession } from '../_lib/management-suite.js'
import { isSuiteAdminEmail, normaliseEmail } from '../_lib/auth.js'
import { noteItSuiteChange } from '../_lib/it-activity-alert.js'
import { isDirectoryWatchAction, noteDirectoryChange } from '../_lib/mis/directory-change-alert.js'
import {
  getMisReportBranchesForViewer,
  resolveMisViewer,
  PRESIDENT_COVERED_NAMES,
} from '../_lib/mis/president-scope.js'
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
  buildOtSummary,
  deployPct,
  filterActiveReportRows,
  reportDeployTotals,
  rowDeployTotals,
  rowOtTotal,
} from '../_lib/mis/deploy-math.js'
import { buildDashboardExtras } from '../_lib/mis/dashboard-stats.js'
import {
  aggregateBranchPeriodStats,
  mondaysInMonth,
  pickLatestBranchReports,
  resolveDashboardPeriod,
} from '../_lib/mis/dashboard-period.js'
import { misBranchDisplayName } from '../_lib/mis/branch-labels.js'
import {
  countBusinessTiers,
  normalizeStarRating,
  resolveBusinessTiers,
  suggestStarRating,
  withBusinessTiers,
} from '../_lib/mis/client-rules.js'
import { buildVisitAnalysis, dayVisitsOnly, syncMobileVisits } from '../_lib/mis/mobile-visits.js'
import { enrichDutyIncidentsWithMobile } from '../_lib/mis/duty-contact.js'
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
import { applyDailyRecruitsToDeployment, listDailyRecruits } from '../_lib/mis/daily-recruits.js'
import { buildBranchReportMap, isSubmitted } from '../_lib/mis/branch-match.js'
import { normalizeToLacs } from '../_lib/inr-money.js'
import { guardComplianceCounts as branchGuardComplianceCounts, branchSanctionedPosts } from '../_lib/mis/guard-compliance-math.js'
import {
  weekCollectedSum,
  collectionAchievementPct,
  consolidatedCollectionPct,
  companyConsolidatedTotals,
  companyConsolidatedRecoveryPct,
  bankingSliceFromBaseline,
  isGuardServiceCollectionBranch,
} from '../_lib/mis/summary-autofill.js'

export const maxDuration = 60

function weekCollected(c: { mon?: number; tue?: number; wed?: number; thu?: number; fri?: number; sat?: number }) {
  return weekCollectedSum(c)
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
    pvcPct: body.pvcPct == null || body.pvcPct === '' ? null : num(body.pvcPct),
    medicalPct: body.medicalPct == null || body.medicalPct === '' ? null : num(body.medicalPct),
    pvcCount: num(body.pvcCount),
    medicalCount: num(body.medicalCount),
    complianceSan: num(body.complianceSan),
    pvcLabel: String(body.pvcLabel ?? ''),
    medicalLabel: String(body.medicalLabel ?? ''),
    accuracyNote: String(body.accuracyNote ?? body.financeNote ?? ''),
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
  if (isSuiteAdminEmail(email)) return { ok: true }
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

/** Report branches for this Management viewer (President = covered set only). */
async function reportBranchesForReq(req: VercelRequest): Promise<MisBranch[]> {
  return getMisReportBranchesForViewer(misRequestEmail(req) || '')
}

async function denyPresidentMasterEdit(
  req: VercelRequest,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const viewer = await resolveMisViewer(misRequestEmail(req) || '')
  if (viewer.isPresident) {
    return {
      ok: false,
      error: 'President access is view-only for covered branch reports. Master Directory and User Management stay with Director / Admin.',
    }
  }
  return { ok: true }
}

function milestoneExpectation(day: number): { label: string; targetPct: number } {
  if (day <= 15) return { label: '15th — target 50% of latest billing', targetPct: 50 }
  if (day <= 20) return { label: '20th — target 75% of latest billing', targetPct: 75 }
  if (day <= 30) return { label: '30th — target 80% of latest billing', targetPct: 80 }
  return { label: '5th next month — target 100% of latest billing', targetPct: 100 }
}

/** Milestone ₹ targets (lakhs) from latest monthly billing. */
function milestoneAmounts(billingLacs: number) {
  const bill = Number(billingLacs) || 0
  const amt = (pct: number) => Math.round(((bill * pct) / 100) * 100) / 100
  return {
    targets: [
      { day: '15th', pct: 50, amount: amt(50) },
      { day: '20th', pct: 75, amount: amt(75) },
      { day: '30th', pct: 80, amount: amt(80) },
      { day: '5th (next)', pct: 100, amount: amt(100) },
    ],
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = (req.body ?? {}) as Record<string, unknown>
  const action = String(body.action ?? '')

  if (action === 'status') return res.status(200).json({ ok: true, storage: misStorageOk() })

  if (!misRequestAuthed(req)) {
    const suite = await verifyManagementSuiteSession(String(body.sessionToken ?? ''))
    if (!suite || suite.role !== 'management') {
      return res.status(401).json({ error: 'Please sign in with your @agilegroup.co.in email OTP.' })
    }
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '')
    res.setHeader('Set-Cookie', misSessionSetCookie(host, suite.email))
  }

  // Directory changes use noteDirectoryChange (Director gets who + summary).
  // Other IT saves still email Director about IT activity.
  const actorEmail = misRequestEmail(req) || ''
  if (!isDirectoryWatchAction(action) && /^(save|delete|generate|regenerate|import|sync|reopen|repair|assign|bulk|dedupe)/i.test(action)) {
    const sendJson = res.json.bind(res)
    res.json = ((payload: unknown) => {
      const code = res.statusCode || 200
      if (code >= 200 && code < 300) {
        noteItSuiteChange(actorEmail, 'Agile MIS', 'mis', action)
      }
      return sendJson(payload)
    }) as typeof res.json
  }

  if (action === 'viewerScope') {
    const viewer = await resolveMisViewer(misRequestEmail(req) || '')
    return res.status(200).json({
      ok: true,
      role: viewer.role,
      isPresident: viewer.isPresident,
      fullAccess: viewer.fullAccess,
      coveredNames: viewer.coveredNames,
      hideMenus: viewer.isPresident ? ['/mis-admin', '/mis-users'] : [],
      banner: viewer.isPresident
        ? 'President view — branch reports limited to: ' + PRESIDENT_COVERED_NAMES.join(', ')
        : '',
    })
  }

  if (action === 'login' || action === 'loadMasters') {
    const masterGate = await denyPresidentMasterEdit(req)
    if (!masterGate.ok) return res.status(403).json({ error: masterGate.error })
    const { ensureBranchPasswords } = await import('../_lib/branch-auth.js')
    await restoreMasterDirectoryIfNeeded()
    const [branches, staffRaw, stats, clientBookFreeze] = await Promise.all([
      ensureBranchPasswords(),
      getStaff(),
      getSiteDirectoryStats(),
      getClientBookFreeze(),
    ])
    const staff = staffRaw.map((s) =>
      s.team === 'support' ? { ...s, department: canonicalSupportDepartment(s.department ?? '') } : s,
    )
    return res.status(200).json({
      ok: true,
      branches,
      staff,
      supportDepartments: [...SUPPORT_DEPARTMENTS],
      siteCounts: stats.siteCounts,
      clientNameCounts: stats.clientNameCounts,
      totalSites: stats.totalSites,
      totalClientNames: stats.totalClientNames,
      clientCounts: stats.siteCounts,
      totalClients: stats.totalSites,
      storageOk: misStorageOk(),
      clientBookFreeze,
    })
  }

  if (action === 'freezeClientBooks') {
    const masterGate = await denyPresidentMasterEdit(req)
    if (!masterGate.ok) return res.status(403).json({ error: masterGate.error })
    const { freezeClientBooksFromReport, CLIENT_BOOK_FREEZE_DATE } = await import(
      '../_lib/mis/client-book-freeze.js'
    )
    const date = String(body.date ?? CLIENT_BOOK_FREEZE_DATE).slice(0, 10)
    const result = await freezeClientBooksFromReport(date)
    noteDirectoryChange(
      actorEmail,
      'freezeClientBooks',
      `Client lists frozen from Daily MIS ${result.date}: ${result.submitted} branches, ${result.moved} moved, ${result.deactivated} extra sites closed.`,
    )
    return res.status(200).json(result)
  }

  if (action === 'loadClients') {
    const branchId = String(body.branchId ?? '').trim()
    if (!branchId) return res.status(400).json({ error: 'Select a branch first.' })
    const viewer = await resolveMisViewer(misRequestEmail(req) || '')
    if (viewer.isPresident) {
      const allowed = await reportBranchesForReq(req)
      if (!allowed.some((b) => b.id === branchId)) {
        return res.status(403).json({ error: 'President view is limited to covered branches only.' })
      }
    }
    const [branches, allClients, clients] = await Promise.all([
      getBranches(true),
      getClients(undefined, { skipRepair: true }),
      getClients(branchId),
    ])
    const tierByGroup = resolveBusinessTiers(allClients, branches)
    const enriched = withBusinessTiers(clients, branches, tierByGroup)
    const names = new Set<string>()
    for (const c of enriched) {
      const n = String(c.name ?? '').trim().toUpperCase()
      if (n) names.add(n)
    }
    return res.status(200).json({
      ok: true,
      clients: enriched,
      count: enriched.length,
      siteCount: enriched.length,
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
    noteDirectoryChange(actorEmail, 'dedupeBranches', 'Branch list deduplicated.')
    return res.status(200).json(result)
  }

  if (action === 'saveBranches') {
    const masterGate = await denyPresidentMasterEdit(req)
    if (!masterGate.ok) return res.status(403).json({ error: masterGate.error })
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
    const summary = list
      .slice(0, 50)
      .map((b) => `${b.name} (${b.active === false ? 'inactive' : 'active'})`)
      .join('; ')
    noteDirectoryChange(
      actorEmail,
      'saveBranches',
      `Branches saved: ${list.length}. ${summary}${list.length > 50 ? '…' : ''}`,
    )
    return res.status(200).json({ ok: true, branches: list })
  }

  if (action === 'generateBranchPasswords') {
    const perm = await canManageMisUsers(misRequestEmail(req) || '')
    if (!perm.ok) return res.status(403).json({ error: perm.error })
    const { regenerateAllBranchPasswords } = await import('../_lib/branch-auth.js')
    const branches = await regenerateAllBranchPasswords()
    noteDirectoryChange(
      actorEmail,
      'generateBranchPasswords',
      `All branch passwords regenerated (${branches.length} branches). Passwords not shown in this mail.`,
    )
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
    noteDirectoryChange(
      actorEmail,
      'regenerateBranchPassword',
      `Branch password regenerated for: ${branches[i].name}. Password not shown in this mail.`,
    )
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
        clientEmail: String(c.clientEmail ?? '').trim().toLowerCase().slice(0, 200),
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
    noteDirectoryChange(
      actorEmail,
      'saveClients',
      `Clients / sites saved: ${list.length} record(s)${branchId ? ` (branch ${branchId})` : ''}.`,
    )
    return res.status(200).json({ ok: true, clients: list })
  }

  if (action === 'saveStaff') {
    const masterGate = await denyPresidentMasterEdit(req)
    if (!masterGate.ok) return res.status(403).json({ error: masterGate.error })
    const arr = Array.isArray(body.staff) ? body.staff : []
    const list: MisStaff[] = arr.slice(0, 5000).map((s: any) => ({
      id: String(s.id || nid('st')),
      branchId: String(s.branchId ?? ''),
      name: String(s.name ?? '').slice(0, 120),
      role: String(s.role ?? '').slice(0, 80),
      phone: String(s.phone ?? '').slice(0, 20),
      active: s.active !== false,
      team: s.team === 'support' ? 'support' : 'operations',
      department:
        s.team === 'support'
          ? canonicalSupportDepartment(String(s.department ?? '')).slice(0, 40)
          : String(s.department ?? '').slice(0, 40),
    }))
    const ok = await saveStaff(list)
    if (!ok) {
      return res.status(400).json({
        error: 'Save blocked — staff list looks incomplete. Reload Master Directory and try again.',
      })
    }
    const staffSummary = list
      .slice(0, 40)
      .map((s) => `${s.name} (${s.role || '—'}; ${s.active === false ? 'inactive' : 'active'})`)
      .join('; ')
    noteDirectoryChange(
      actorEmail,
      'saveStaff',
      `Operations staff saved: ${list.length}. ${staffSummary}${list.length > 40 ? '…' : ''}`,
    )
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
    const list: MisGuardDoc[] = arr.slice(0, 20000).map((g: any) =>
      normalizeGuardDocOnSave({
      id: String(g.id || nid('gd')),
      branchId,
      unitName: String(g.unitName ?? '').slice(0, 120),
      incharge: String(g.incharge ?? '').slice(0, 120),
      inchargeMobile: String(g.inchargeMobile ?? '').slice(0, 20),
      guardName: String(g.guardName ?? '').slice(0, 120),
      employeeId: String(g.employeeId ?? '').slice(0, 40),
      mobile: String(g.mobile ?? '').slice(0, 20),
      doj: String(g.doj ?? '').slice(0, 40),
      idCardIssueDate: String(g.idCardIssueDate ?? '').slice(0, 40),
      idCardValidity: String(g.idCardValidity ?? '').slice(0, 40),
      aadhar: String(g.aadhar ?? '').slice(0, 40),
      pvc: String(g.pvc ?? '').slice(0, 40),
      pvcValidity: String(g.pvcValidity ?? '').slice(0, 40),
      medical: String(g.medical ?? '').slice(0, 40),
      medicalValidity: String(g.medicalValidity ?? '').slice(0, 40),
      training: String(g.training ?? '').slice(0, 40),
      remarks: String(g.remarks ?? '').slice(0, 200),
      active: g.active !== false,
    }),
    )
    await saveGuardDocs(branchId, list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  if (action === 'guardDocs') {
    const branchId = String(body.branchId ?? '')
    const docs = await getGuardDocs(branchId)
    return res.status(200).json({ ok: true, docs })
  }

  if (action === 'importGuardDocsExcel') {
    const branchId = String(body.branchId ?? '').trim()
    const fileBase64 = String(body.fileBase64 ?? '').trim()
    if (!branchId) return res.status(400).json({ error: 'Select a branch first.' })
    if (!fileBase64) return res.status(400).json({ error: 'Excel file is required.' })
    const { parseGuardDocsExcelBuffer } = await import('../_lib/mis/guard-docs-excel-import.js')
    let docs: MisGuardDoc[]
    try {
      docs = parseGuardDocsExcelBuffer(Buffer.from(fileBase64, 'base64'), branchId)
    } catch (e) {
      return res.status(400).json({ error: 'Could not read Excel file — use .xlsx format.' })
    }
    if (!docs.length) return res.status(400).json({ error: 'No guard rows found in this file.' })
    const ok = await saveGuardDocs(branchId, docs)
    if (!ok) return res.status(503).json({ error: 'Could not save guard records.' })
    return res.status(200).json({ ok: true, branchId, count: docs.length, fileName: String(body.fileName ?? '').slice(0, 120) })
  }

  if (action === 'compliance') {
    const date = String(body.date ?? new Date().toISOString().slice(0, 10))
    const [branches, reports, clients] = await Promise.all([reportBranchesForReq(req), getReportsForDate(date), getClients()])
    const repBy: Record<string, (typeof reports)[number]> = {}
    for (const r of reports) repBy[r.branchId] = r
    const out = [] as any[]
    let strength = 0
    let pvc = 0
    let medical = 0
    let training = 0
    for (const b of branches) {
      const docs = await getGuardDocs(b.id)
      const branchPosts = branchSanctionedPosts(b.id, repBy[b.id], clients)
      const counts = branchGuardComplianceCounts(docs, branchPosts)
      // % base = unique guards (not posts) — PVC cannot exceed 100% of guard strength
      const branchStrength = counts.registered || branchPosts
      strength += branchStrength
      pvc += counts.pvc
      medical += counts.medical
      training += counts.training
      out.push({
        branchId: b.id,
        branch: b.name,
        strength: branchStrength,
        sanctionedPosts: branchPosts,
        registered: counts.registered,
        total: branchStrength,
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
    const [allVisits, dates] = await Promise.all([getVisits(date), getVisitDates()])
    const visits = dayVisitsOnly(allVisits)
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
    const [allVisits, dates] = await Promise.all([getVisits(date), getVisitDates()])
    const visits = dayVisitsOnly(allVisits)
    const analysis = await buildVisitAnalysis(date, visits)
    return res.status(200).json({ ok: true, date, visits, dates, sync, analysis })
  }

  if (action === 'dutyIncidents' || action === 'syncDuty') {
    const date = String(body.date ?? new Date().toISOString().slice(0, 10))
    const branchId = String(body.branchId ?? '').trim()
    let sync = null
    if (action === 'syncDuty' || body.autoSync === true) {
      sync = await syncMobileVisits(date, { includeVisits: false, includeDuty: true, includeAttendance: false })
    }
    const [allIncidents, dates, branches] = await Promise.all([
      getDutyIncidents(date),
      getDutyDates(),
      reportBranchesForReq(req),
    ])
    let incidents = allIncidents
    let branchName = ''
    if (branchId) {
      const b = branches.find((x) => x.id === branchId)
      if (b) {
        branchName = b.name
        const { clientNamesForBranch, incidentMatchesBranch } = await import('../_lib/mis/branch-mobile-stats.js')
        const clients = await getClients(branchId)
        const names = clientNamesForBranch(clients)
        incidents = allIncidents.filter((i) => incidentMatchesBranch(i, b.name, names))
      } else {
        incidents = []
      }
    }
    incidents = await enrichDutyIncidentsWithMobile(incidents, { branchId: branchId || undefined })
    const counts = dutyCounts(incidents)
    return res.status(200).json({
      ok: true,
      date,
      branchId: branchId || '',
      branchName: branchName || undefined,
      incidents,
      dates,
      counts,
      sync,
      branches: branches.map((b) => ({ id: b.id, name: b.name })),
    })
  }

  if (action === 'loadCollections') {
    const weekStart = String(body.weekStart ?? '')
    const { normalizeCollectionRow, daysInBillingMonth, collectionDso } = await import(
      '../_lib/mis/collection-import.js'
    )
    const [raw, branches, baseline] = await Promise.all([
      getCollections(weekStart),
      reportBranchesForReq(req),
      getLatestOstBaseline(weekStart),
    ])
    const collections = raw.map(normalizeCollectionRow)
    return res.status(200).json({
      ok: true,
      weekStart,
      collections,
      branches,
      baseline,
      dsoDays: daysInBillingMonth(),
      companyDso:
        baseline && Number(baseline.billingK) > 0 && Number(baseline.outstandingK) > 0
          ? collectionDso(Number(baseline.outstandingK) / 100, Number(baseline.billingK) / 100)
          : null,
    })
  }
  if (action === 'saveCollections') {
    const weekStart = String(body.weekStart ?? '')
    const arr = Array.isArray(body.collections) ? body.collections : []
    const { normalizeCollectionRow, ensureAllBranchCollectionRows } = await import('../_lib/mis/collection-import.js')
    const existing = await getCollections(weekStart)
    const prevByBranch: Record<string, MisCollection> = {}
    for (const c of existing) prevByBranch[c.branchId] = c
    const list: MisCollection[] = arr.slice(0, 500).map((c: any) => {
      const prev = prevByBranch[String(c.branchId ?? '')]
      return normalizeCollectionRow({
        id: String(c.id || prev?.id || nid('col')),
        branchId: String(c.branchId ?? ''),
        weekStart,
        // Monthly billing + outstanding come from OST import only — never overwrite from the grid save.
        monthlyBilling: prev?.monthlyBilling ?? 0,
        outstanding: prev?.outstanding ?? 0,
        ostCollected: prev?.ostCollected,
        budget: c.budget,
        mon: c.mon,
        tue: c.tue,
        wed: c.wed,
        thu: c.thu,
        fri: c.fri,
        sat: c.sat,
        remarks: String(c.remarks ?? prev?.remarks ?? '').slice(0, 200),
      })
    })
    const branches = await reportBranchesForReq(req)
    const full = ensureAllBranchCollectionRows(weekStart, branches, list)
    await saveCollections(weekStart, full)
    return res.status(200).json({ ok: true, count: full.length })
  }

  if (action === 'collectionAnalysis') {
    const weekStart = String(body.weekStart ?? '')
    const month = weekStart.slice(0, 7) || new Date().toISOString().slice(0, 7)
    const branches = await reportBranchesForReq(req)
    const { normalizeCollectionRow, collectionDso, daysInBillingMonth } = await import(
      '../_lib/mis/collection-import.js'
    )
    const weekCols = (await getCollections(weekStart)).map(normalizeCollectionRow)
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
      const budget = (normalizeToLacs(c?.budget) ?? num(c?.budget)) || 0
      const billing = (normalizeToLacs(c?.monthlyBilling) ?? num(c?.monthlyBilling)) || 0
      const outstanding = (normalizeToLacs(c?.outstanding) ?? num(c?.outstanding)) || 0
      const achievement = budget > 0 ? collectionAchievementPct(collected, budget) : 0
      const ds = collectionDso(outstanding, billing)
      const mtd = mtdByBranch[b.id] || 0
      const mtdPct = billing > 0 ? Math.round((mtd * 100) / billing) : 0
      const misN = misCollByBranch[b.id]
      const misCollectionPct = misN?.n ? Math.round(misN.sum / misN.n) : null
      const guardService = isGuardServiceCollectionBranch(b.name)
      const colRow =
        c ||
        ({
          id: `${b.id}:${weekStart}`,
          branchId: b.id,
          weekStart,
          monthlyBilling: billing,
          budget,
          mon: 0,
          tue: 0,
          wed: 0,
          thu: 0,
          fri: 0,
          sat: 0,
          outstanding,
          remarks: '',
        } satisfies MisCollection)
      const consolidatedPct =
        guardService && billing > 0
          ? parseFloat(consolidatedCollectionPct(colRow, collected) || '0') || 0
          : null
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
        consolidatedPct,
        status,
      }
    })

    const ranked = [...rows].sort((a, b) => b.achievement - a.achievement)
    const worstDso = [...rows].filter((r) => r.status === 'red').sort((a, b) => b.dso - a.dso)
    const worstOutstanding = [...rows].filter((r) => r.outstanding > 0).sort((a, b) => b.outstanding - a.outstanding)

    const guardRows = rows.filter((r) => isGuardServiceCollectionBranch(r.branch))

    const baseline = (await getLatestOstBaseline(weekStart)) || (await getCollectionBaseline(weekStart))
    const banking = bankingSliceFromBaseline(baseline)
    const ostCollectedLacs = (Number(baseline?.collectedK) || 0) / 100
    const company = companyConsolidatedTotals(
      rows.map((r) => ({
        billing: r.billing,
        outstanding: r.outstanding,
        collected: r.collected,
        guardService: isGuardServiceCollectionBranch(r.branch),
      })),
      banking,
      { ostCollectedLacs },
    )
    const totalBilling =
      (Number(baseline?.billingK) || 0) > 0 ? (Number(baseline?.billingK) || 0) / 100 : company.totalBilling
    const totalBudget = rows.reduce((s, r) => s + r.budget, 0)
    const totalCollected = rows.reduce((s, r) => s + r.collected, 0)
    const totalOutstanding =
      (Number(baseline?.outstandingK) || 0) > 0
        ? (Number(baseline?.outstandingK) || 0) / 100
        : company.totalOutstanding
    const totalMtd = rows.reduce((s, r) => s + r.mtd, 0)
    const recoveryPct = companyConsolidatedRecoveryPct(
      company.recoveryPct,
      baseline?.recoveryPct ?? null,
    )
    const companyDso = collectionDso(totalOutstanding, totalBilling)
    const day = new Date().getDate()
    const ms = milestoneExpectation(day)
    const milestoneAch = totalBilling > 0 ? Math.round((totalMtd * 100) / totalBilling) : 0
    const targetAmount = Math.round(((totalBilling * ms.targetPct) / 100) * 100) / 100
    const achievedAmount = Math.round(totalMtd * 100) / 100
    const { targets } = milestoneAmounts(totalBilling)
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
        branchBilling: company.branchBilling,
        bankingBilling: company.bankingBilling,
        totalRecovered: company.totalRecovered,
        collected: totalCollected,
        outstanding: totalOutstanding,
        mtd: totalMtd,
        recoveryPct,
        computedRecoveryPct: company.recoveryPct,
        ostBaselinePct: baseline?.recoveryPct ?? null,
        /** Weekly collection % = (collected during week ÷ week budget) × 100 */
        achievement: totalBudget > 0 ? collectionAchievementPct(totalCollected, totalBudget) : 0,
        /** Company DSO = (Total Outstanding ÷ June billing) × days in billing month */
        dso: companyDso,
        dsoDays: daysInBillingMonth(),
      },
      baseline,
      milestone: {
        ...ms,
        achievedPct: milestoneAch,
        targetAmount,
        achievedAmount,
        billing: totalBilling,
        targets,
        onTrack: milestoneAch >= ms.targetPct,
      },
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
    const branches = await reportBranchesForReq(req)
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
      saveOstCollectionBaseline,
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
    const branches = await reportBranchesForReq(req)
    const existing = await getCollections(weekStart)
    const result = applyOutstandingImport(weekStart, branches, existing, parsed, fileName)
    await saveCollections(weekStart, result.list)
    const baseline = await saveOstCollectionBaseline(weekStart, buf, fileName, parsed)
    return res.status(200).json({
      ok: true,
      updated: result.updated,
      unmatched: result.unmatched,
      baseline,
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
    const branches = await reportBranchesForReq(req)
    const existing = await getCollections(weekStart)
    const byName: Record<string, MisBranch> = {}
    for (const b of branches) byName[b.name.trim().toUpperCase()] = b
    const {
      collectionZoneGroupKey,
      findBranchForGroupKey,
      ensureAllBranchCollectionRows,
    } = await import('../_lib/mis/collection-import.js')

    const byId: Record<string, MisCollection> = {}
    for (const c of existing) byId[c.branchId] = c

    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    let updated = 0
    const unmatched: string[] = []

    for (const line of lines) {
      if (/^branch/i.test(line) && /outstanding/i.test(line)) continue
      const parts = line.split(/[,\t]/).map((p) => p.trim())
      if (parts.length < 2) continue
      const bname = parts[0]
      const groupKey = collectionZoneGroupKey(bname)
      const br = findBranchForGroupKey(branches, groupKey) || byName[bname.toUpperCase()]
      if (!br) { unmatched.push(parts[0]); continue }
      const outstanding = normalizeToLacs(parts[1].replace(/[^\d.]/g, '')) ?? num(parts[1].replace(/[^\d.]/g, ''))
      const monthlyBilling = parts[2] ? (normalizeToLacs(parts[2].replace(/[^\d.]/g, '')) ?? num(parts[2].replace(/[^\d.]/g, ''))) : 0
      const budget = parts[3] ? (normalizeToLacs(parts[3].replace(/[^\d.]/g, '')) ?? num(parts[3].replace(/[^\d.]/g, ''))) : 0
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

    const list = ensureAllBranchCollectionRows(weekStart, branches, Object.values(byId))
    await saveCollections(weekStart, list)
    return res.status(200).json({ ok: true, updated, unmatched, count: list.length })
  }

  if (action === 'syncGuardsComplaints') {
    const { syncGuardsComplaintsToMis } = await import('../_lib/mis/guards-complaint-sync.js')
    const result = await syncGuardsComplaintsToMis()
    return res.status(200).json({ ok: true, ...result })
  }

  if (action === 'loadGuardsComplaintDashboard') {
    const branchId = String(body.branchId ?? 'all').trim()
    if (body.sync !== false) {
      const { syncGuardsComplaintsToMis } = await import('../_lib/mis/guards-complaint-sync.js')
      await syncGuardsComplaintsToMis().catch(() => null)
    }
    const {
      getComplaints: getGuardComplaints,
      getOpsStaff,
      getDeptStaff,
      getPortalUsers,
      filterByBranch,
      complaintMatchesBranch,
      branchDisplayName,
      guardsFmtIstDateTime,
      guardsBranchList,
      healGuardsStaffBranches,
      healComplaintBranches,
      healComplaintAssignments,
      applySla,
      sortComplaintsNewestFirst,
    } = await import('../_lib/guards/store.js')
    const { computeGuardsDashboard } = await import('../_lib/guards/dashboard.js')
    const { listAllHodContacts } = await import('../_lib/guards/hod-contacts.js')
    const misBranches = await reportBranchesForReq(req)
    const branches = guardsBranchList(misBranches)
    const healedStaff = await healGuardsStaffBranches(branches)
    let opsStaff = healedStaff.ops
    let deptStaff = healedStaff.dept
    const complaintsRaw = await getGuardComplaints()
    const healedAssignments = await healComplaintAssignments(branches, complaintsRaw, opsStaff, deptStaff)
    const healedBranches = await healComplaintBranches(branches, healedAssignments.complaints)
    let complaints = sortComplaintsNewestFirst(healedBranches.complaints.map((c) => applySla(c)))
    const scopeBranch = branchId && branchId !== 'all' ? branchId : ''
    if (scopeBranch) {
      complaints = filterByBranch(complaints, scopeBranch, branches)
      opsStaff = filterByBranch(opsStaff, scopeBranch, branches)
      deptStaff = filterByBranch(deptStaff, scopeBranch, branches)
    }
    const [portalUsers, misUsers] = await Promise.all([getPortalUsers(), getUsers()])
    const enriched = complaints.map((c) => {
      const ops = opsStaff.find((o) => o.id === c.opsStaffId)
      const dept = deptStaff.find((d) => d.id === c.deptStaffId)
      const opsBranchOk = !ops || complaintMatchesBranch(ops.branchId, c.branchId, branches)
      const deptBranchOk = !dept || complaintMatchesBranch(dept.branchId, c.branchId, branches)
      return {
        ...c,
        branchName: branchDisplayName(c.branchId, branches),
        registeredAtLabel: guardsFmtIstDateTime(c.registeredAt),
        opsStaffBranchName: ops ? branchDisplayName(ops.branchId, branches) : '',
        deptStaffBranchName: dept ? branchDisplayName(dept.branchId, branches) : '',
        assignmentMismatch: Boolean((ops && !opsBranchOk) || (dept && !deptBranchOk)),
      }
    })
    const open = enriched.filter((c) => c.active !== false && c.status !== 'solved')
    const delayed = open.filter((c) => c.isDelayed)
    const branchNameMap = Object.fromEntries(branches.map((b) => [b.id, b.name]))
    const dashboard = computeGuardsDashboard(complaints, opsStaff, branchNameMap)
    return res.status(200).json({
      ok: true,
      dashboard,
      open,
      delayed,
      complaints: enriched,
      opsStaff: opsStaff.map((o) => ({ ...o, branchName: branchDisplayName(o.branchId, branches) })),
      deptStaff: deptStaff.map((d) => ({ ...d, branchName: branchDisplayName(d.branchId, branches) })),
      hodContacts: listAllHodContacts(branches, misUsers, portalUsers),
      branches: misBranches,
    })
  }

  if (action === 'deleteGuardsComplaint') {
    const id = String(body.complaintId ?? '').trim()
    if (!id) return res.status(400).json({ error: 'Complaint id required.' })
    const {
      getComplaints: getGuardComplaints,
      saveComplaints: saveGuardComplaints,
      getFeedback,
      saveFeedback,
      logEvent,
    } = await import('../_lib/guards/store.js')
    const all = await getGuardComplaints()
    const c = all.find((x) => x.id === id)
    if (!c) return res.status(404).json({ error: 'Complaint not found.' })
    await saveGuardComplaints(all.filter((x) => x.id !== id))
    const feedback = await getFeedback()
    await saveFeedback(feedback.filter((f) => f.complaintId !== id))
    await logEvent(id, 'Director', 'Complaint deleted', `${c.code} — ${c.guardName}`, misRequestEmail(req) || 'mis')
    return res.status(200).json({ ok: true, code: c.code })
  }

  if (action === 'sendGuardsReminder') {
    const id = String(body.complaintId ?? '').trim()
    const target = body.target === 'department' ? 'department' : 'hod'
    const {
      getComplaints: getGuardComplaints,
      getPortalUsers,
      branchDisplayName,
      guardsBranchList,
      logCommunication,
      logEvent,
    } = await import('../_lib/guards/store.js')
    const { sendDelayedReminderMail } = await import('../_lib/guards/notify.js')
    const misBranches = await reportBranchesForReq(req)
    const branches = guardsBranchList(misBranches)
    const all = await getGuardComplaints()
    const c = all.find((x) => x.id === id)
    if (!c) return res.status(404).json({ error: 'Not found.' })
    const branchName = branchDisplayName(c.branchId, branches)
    const result = await sendDelayedReminderMail(c, branchName, target, misRequestEmail(req) || 'mis', {
      hodEmail: target === 'department' ? undefined : String(body.hodEmail ?? '').trim(),
      opsStaffId: target === 'hod' ? undefined : String(body.opsStaffId ?? '').trim(),
      deptStaffId: target === 'hod' ? undefined : String(body.deptStaffId ?? '').trim(),
      branches,
      misUsers: await getUsers(),
      portalUsers: await getPortalUsers(),
    })
    if (!result.ok) {
      return res.status(400).json({ error: (result as { error?: string }).error || 'Could not send reminder.' })
    }
    await logCommunication({
      complaintId: c.id,
      code: c.code,
      channel: 'email',
      type: 'reminder',
      sentTo: String(body.hodEmail || body.opsStaffId || body.deptStaffId || ''),
      subject: `Reminder — ${c.code}`,
      body: '',
      sentBy: misRequestEmail(req) || 'mis',
    })
    await logEvent(c.id, 'Director', 'Reminder sent', target, misRequestEmail(req) || 'mis')
    return res.status(200).json({ ok: true })
  }

  if (action === 'loadComplaints') {
    const branchId = String(body.branchId ?? '')
    if (body.syncGuards !== false) {
      const { syncGuardsComplaintsToMis } = await import('../_lib/mis/guards-complaint-sync.js')
      await syncGuardsComplaintsToMis().catch(() => null)
    }
    if (branchId === 'all') {
      const { isFromClientSender, syncNatureWithMailSubject } = await import('../_lib/mis/complaint-inbox.js')
      const branches = await reportBranchesForReq(req)
      const map = await getComplaintsMany(branches.map((b) => b.id))
      const complaints: (MisComplaint & { branchName?: string })[] = []
      const keepRow = (c: MisComplaint) => {
        const from = c.fromEmail || c.reportedBy || ''
        if (!from.includes('@')) return true
        return isFromClientSender(from)
      }
      for (const b of branches) {
        for (const c of map.get(b.id) || []) {
          if (!keepRow(c)) continue
          const fixed = syncNatureWithMailSubject({ ...c, branchId: b.id })
          complaints.push({ ...fixed, branchId: b.id, branchName: b.name })
        }
      }
      const inbox = await getDirectorInboxComplaints()
      for (const c of inbox) {
        if (c.active === false) continue
        if (!keepRow(c)) continue
        const fixed = syncNatureWithMailSubject(c)
        const bn = fixed.branchId ? branches.find((x) => x.id === fixed.branchId)?.name : 'Unassigned'
        complaints.push({ ...fixed, branchName: bn || 'Unassigned' })
      }
      return res.status(200).json({ ok: true, complaints, branches, allBranches: true })
    }
    const { syncNatureWithMailSubject } = await import('../_lib/mis/complaint-inbox.js')
    const [rawComplaints, clients] = await Promise.all([getComplaints(branchId), getClients(branchId)])
    const complaints = rawComplaints.map((c) => syncNatureWithMailSubject(c))
    return res.status(200).json({ ok: true, complaints, clients })
  }
  if (action === 'saveComplaints') {
    const branchId = String(body.branchId ?? '')
    const arr = Array.isArray(body.complaints) ? body.complaints : []
    const mapped: MisComplaint[] = arr.slice(0, 10000).map((c: any) => ({
      id: String(c.id || nid('cmp')),
      code: String(c.code ?? '').slice(0, 30),
      branchId: branchId === 'all' ? String(c.branchId ?? '').trim() : branchId,
      clientName: String(c.clientName ?? '').slice(0, 160),
      location: String(c.location ?? '').slice(0, 160),
      incidentDate: String(c.incidentDate ?? '').slice(0, 20),
      type: String(c.type ?? 'Client').slice(0, 20),
      description: String(c.description ?? '').slice(0, 2000),
      actionTaken: String(c.actionTaken ?? '').slice(0, 1000),
      assignedTo: String(c.assignedTo ?? '').slice(0, 120),
      assigneeEmail: String(c.assigneeEmail ?? '').slice(0, 120),
      assigneeDept: String(c.assigneeDept ?? '').slice(0, 120),
      edc: String(c.edc ?? '').slice(0, 20),
      correctiveActionPlan: String(c.correctiveActionPlan ?? '').slice(0, 2000),
      avoidRecurrence: String(c.avoidRecurrence ?? '').slice(0, 2000),
      resolvedOn: String(c.resolvedOn ?? '').slice(0, 30),
      completionReportSentOn: String(c.completionReportSentOn ?? '').slice(0, 30),
      momWithin24h: c.momWithin24h === true,
      status: String(c.status ?? 'Open').slice(0, 20),
      reportedBy: String(c.reportedBy ?? '').slice(0, 120),
      source: String(c.source ?? 'manual').slice(0, 20),
      channel: String(c.channel ?? '').slice(0, 20),
      nature: String(c.nature ?? '').slice(0, 300),
      emailId: String(c.emailId ?? '').slice(0, 80),
      fromEmail: String(c.fromEmail ?? '').slice(0, 120),
      subject: String(c.subject ?? '').slice(0, 300),
      importedAt: String(c.importedAt ?? '').slice(0, 30),
      registeredAt: String(c.registeredAt ?? '').slice(0, 40),
      mailReceivedAt: String(c.mailReceivedAt ?? c.registeredAt ?? '').slice(0, 40),
      active: c.active !== false,
      reopenedFromId: String(c.reopenedFromId ?? '').slice(0, 40) || undefined,
      reopenedAt: String(c.reopenedAt ?? '').slice(0, 40) || undefined,
      reopenLabel: c.reopenLabel === 'reopened' ? 'reopened' : undefined,
      supersededById: String(c.supersededById ?? '').slice(0, 40) || undefined,
    }))
    if (branchId === 'all') {
      const byBranch = new Map<string, MisComplaint[]>()
      const unassigned: MisComplaint[] = []
      for (const c of mapped) {
        if (!c.branchId) {
          unassigned.push(c)
          continue
        }
        const list = byBranch.get(c.branchId) || []
        list.push(c)
        byBranch.set(c.branchId, list)
      }
      let total = 0
      const saved: MisComplaint[] = []
      for (const [bid, rows] of byBranch) {
        const list = await ensureComplaintCodes(rows)
        await saveComplaints(bid, list)
        total += list.length
        saved.push(...list)
      }
      if (unassigned.length) {
        await saveDirectorInboxComplaints(await ensureComplaintCodes(unassigned))
        total += unassigned.length
        saved.push(...unassigned)
      }
      return res.status(200).json({ ok: true, count: total, complaints: saved, allBranches: true })
    }
    const list = await ensureComplaintCodes(mapped)
    await saveComplaints(branchId, list)
    return res.status(200).json({ ok: true, count: list.length, complaints: list })
  }

  if (action === 'complaintsAnalysis') {
    const month = String(body.month ?? new Date().toISOString().slice(0, 7))
    const branches = await reportBranchesForReq(req)
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
    const [inbox, branches] = await Promise.all([getDirectorInboxComplaints(), reportBranchesForReq(req)])
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
    if (!complaintId) return res.status(400).json({ error: 'Complaint required' })
    if (!branchId || branchId === 'all' || branchId === 'inbox') {
      const ok = await deleteInboxComplaint(complaintId)
      if (ok) return res.status(200).json({ ok: true })
      if (!branchId || branchId === 'inbox') return res.status(404).json({ error: 'Complaint not found' })
    }
    const ok = await deleteBranchComplaint(branchId, complaintId)
    if (!ok) return res.status(404).json({ error: 'Complaint not found' })
    return res.status(200).json({ ok: true })
  }

  if (action === 'syncComplaintInbox' || action === 'syncClientComplaintMail') {
    const { refreshClientComplaintInbox } = await import('../_lib/mis/complaint-inbox.js')
    const sync = await refreshClientComplaintInbox()
    if (!sync.ok && sync.skipped) {
      return res.status(200).json({ ok: true, ...sync, inboxCount: (await getDirectorInboxComplaints()).length })
    }
    if (!sync.ok) return res.status(502).json({ error: sync.error || 'Sync failed' })
    const inbox = await getDirectorInboxComplaints()
    return res.status(200).json({ ok: true, ...sync, inboxCount: inbox.length })
  }

  if (action === 'assignComplaintCase') {
    const complaintId = String(body.complaintId ?? '').trim()
    const branchId = String(body.branchId ?? '').trim()
    const assigneeName = String(body.assigneeName ?? '').trim()
    let assigneeEmail = String(body.assigneeEmail ?? '').trim().toLowerCase()
    const assigneeDept = String(body.assigneeDept ?? '').trim()
    const edc = String(body.edc ?? '').trim().slice(0, 20)
    if (!complaintId) return res.status(400).json({ error: 'Complaint required.' })
    if (!assigneeName) return res.status(400).json({ error: 'Please enter assignee name.' })
    if (!assigneeEmail || !assigneeEmail.includes('@')) {
      return res.status(400).json({ error: 'Please enter assignee email address.' })
    }
    if (!edc) return res.status(400).json({ error: 'Please select EDC (expected date of closure).' })
    if (!branchId || branchId === 'all' || branchId === 'inbox') {
      return res.status(400).json({ error: 'Please select a branch.' })
    }

    const branches = await reportBranchesForReq(req)
    const branch = branches.find((b) => b.id === branchId)
    if (!branch) return res.status(400).json({ error: 'Branch not found.' })

    let found: MisComplaint | null = null
    let source: 'inbox' | 'branch' = 'inbox'
    let sourceBranchId = ''

    const inboxList = await getDirectorInboxComplaints()
    const inboxIdx = inboxList.findIndex((c) => c.id === complaintId)
    if (inboxIdx >= 0) {
      found = { ...inboxList[inboxIdx] }
      source = 'inbox'
    } else {
      const map = await getComplaintsMany(branches.map((b) => b.id))
      for (const b of branches) {
        const rows = map.get(b.id) || []
        const i = rows.findIndex((c) => c.id === complaintId)
        if (i >= 0) {
          found = { ...rows[i] }
          source = 'branch'
          sourceBranchId = b.id
          break
        }
      }
    }
    if (!found) return res.status(404).json({ error: 'Complaint not found.' })

    const c: MisComplaint = {
      ...found,
      branchId,
      assignedTo: assigneeName.slice(0, 120),
      assigneeEmail: assigneeEmail.slice(0, 120),
      assigneeDept: (assigneeDept || branch.name).slice(0, 120),
      edc,
      status: found.status === 'Closed' ? found.status : 'Open',
    }

    if (source === 'inbox') {
      await saveDirectorInboxComplaints(inboxList.filter((x) => x.id !== complaintId))
      const dest = await getComplaints(branchId)
      const di = dest.findIndex((x) => x.id === complaintId)
      if (di >= 0) dest[di] = c
      else dest.unshift(c)
      await saveComplaints(branchId, dest)
    } else if (sourceBranchId === branchId) {
      const dest = await getComplaints(branchId)
      const di = dest.findIndex((x) => x.id === complaintId)
      if (di < 0) return res.status(404).json({ error: 'Complaint not found.' })
      dest[di] = c
      await saveComplaints(branchId, dest)
    } else {
      const fromList = await getComplaints(sourceBranchId)
      await saveComplaints(
        sourceBranchId,
        fromList.filter((x) => x.id !== complaintId),
      )
      const dest = await getComplaints(branchId)
      const di = dest.findIndex((x) => x.id === complaintId)
      if (di >= 0) dest[di] = c
      else dest.unshift(c)
      await saveComplaints(branchId, dest)
    }

    const { LOKESH_CC_EMAIL, MIS_DIRECTOR_CC_EMAIL } = await import('../_lib/mis/branch-mail-cc.js')
    const { pinMailFrom, pinMailReplyTo, sendSuiteEmail } = await import('../_lib/suite-mail.js')
    const Resend = (await import('resend')).Resend
    const key = process.env.RESEND_API_KEY?.trim()
    if (!key) return res.status(503).json({ error: 'Email not configured (RESEND_API_KEY).' })
    const resend = new Resend(key)
    const mailWhen = c.mailReceivedAt || c.registeredAt || c.incidentDate || ''
    const subject = `Complaint assigned — ${c.code || ''} — ${c.clientName || 'Client'}`.slice(0, 180)
    const html = `
      <div style="font-family:Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.55;color:#0f172a">
        <p><b>Complaint assigned to:</b> ${assigneeName}</p>
        <p><b>Branch:</b> ${branch.name}</p>
        <p><b>Department:</b> ${c.assigneeDept || '—'}</p>
        <p><b>Client name:</b> ${c.clientName || '—'}</p>
        <p><b>Nature of complaint:</b> ${c.nature || c.subject || '—'}</p>
        <p><b>Date &amp; time of mail:</b> ${mailWhen}</p>
        <p><b>EDC (expected date of closure):</b> ${edc}</p>
        <p><b>Code:</b> ${c.code || '—'}</p>
        <hr/>
        <p><b>Mail / incident details:</b></p>
        <pre style="white-space:pre-wrap;background:#f8fafc;padding:12px;border-radius:8px">${String(c.description || c.subject || '').replace(/</g, '&lt;')}</pre>
        <p style="color:#64748b;font-size:13px">Please update Corrective action plan and close by EDC.</p>
      </div>`
    const result = await sendSuiteEmail(resend, {
      from: pinMailFrom(),
      replyTo: pinMailReplyTo(),
      to: assigneeEmail,
      cc: [LOKESH_CC_EMAIL, MIS_DIRECTOR_CC_EMAIL],
      subject,
      html,
      skipDirectorCc: true,
    })
    const outComplaint = { ...c, branchName: branch.name }
    if (result.error) {
      return res.status(502).json({
        ok: false,
        error: 'Assigned saved, but email failed: ' + String((result.error as { message?: string }).message || result.error),
        complaint: outComplaint,
      })
    }
    return res.status(200).json({ ok: true, complaint: outComplaint })
  }

  if (action === 'reports') {
    const range = resolveDashboardPeriod({ ...body, date: body.dateFor })
    const payload = await getCachedMdSummary(
      `reports:${range.cacheKey}`,
      async () => {
        const branches = await reportBranchesForReq(req)
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
          if (!isSubmitted(r)) continue
          const agg = aggregateBranchPeriodStats(b.id, reportsByDate, range.dates, branches)
          periodStats[b.id] = agg
          const summary =
            range.period === 'day'
              ? r.summary
              : {
                  ...(r.summary ?? {}),
                  resignation: agg.resignation,
                  recruitment: summaryRecruitmentNum(r.summary),
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
        const { countIncidentsByBranches } = await import('../_lib/mis/incident-report-store.js')
        const incidentStats = await countIncidentsByBranches(branches.map((b) => ({ id: b.id, name: b.name })))
        const incidentByBranch: Record<string, { open: number; closed: number; total: number }> = {}
        for (const row of incidentStats.byBranch) {
          incidentByBranch[row.branchId] = {
            open: row.open,
            closed: row.closed,
            total: row.total,
          }
        }
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
          incidentByBranch,
          incidents: {
            open: incidentStats.open,
            closed: incidentStats.closed,
            total: incidentStats.total,
          },
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
        const branches = await reportBranchesForReq(req)
        const branchIds = branches.map((b) => b.id)
        const [reportsByDate, clients, cols, visits, guardDocsMap, complaintsMap, dutyIncidents] = await Promise.all([
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
          getDutyIncidents(range.anchorDate),
        ])

        const repByMap = pickLatestBranchReports(branches, reportsByDate, range.dates)
        const repBy: Record<string, MisReport> = {}
        for (const [id, r] of repByMap) repBy[id] = r

        const snapshotDate =
          range.period === 'day'
            ? range.anchorDate
            : [...repByMap.values()].sort((a, b) => String(b.dateFor).localeCompare(String(a.dateFor)))[0]?.dateFor ?? range.anchorDate

        const allReports = [...reportsByDate.values()].flat()
        const colByBranch: Record<string, MisCollection> = {}
        for (const c of cols) colByBranch[c.branchId] = c

        const deployment: any[] = []
        const vacantRows: any[] = []
        const otDetailRows: any[] = []
        let TS = 0, TD = 0, TA = 0, TO = 0, TV = 0, TRes = 0, TRec = 0
        for (const b of branches) {
          const r = repBy[b.id]
          const agg = aggregateBranchPeriodStats(b.id, reportsByDate, range.dates, branches)
          if (!isSubmitted(r)) {
            // Today: only branches that tapped Submit appear. Week/month keep a pending row.
            if (range.period !== 'day') {
              deployment.push({ branch: b.name, submitted: false, daysSubmitted: agg.daysSubmitted, san: 0, dep: 0, abs: 0, ot: 0, vac: 0 })
            }
            continue
          }
          const t = reportDeployTotals(r.rows as Record<string, unknown>[], b.id, clients)
          let siteRows = filterActiveReportRows(b.id, r.rows as Record<string, unknown>[], clients)
          if (!siteRows.length && (r.rows as Record<string, unknown>[]).length) {
            siteRows = r.rows as Record<string, unknown>[]
          }
          for (const row of siteRows) {
            const rt = rowDeployTotals(row)
            const siteOt = rowOtTotal(row)
            const siteRow = {
              branchId: b.id,
              branch: b.name,
              client: String(row.clientName ?? ''),
              unit: String(row.location ?? ''),
              san: rt.san,
              abs: rt.abs,
              ot: siteOt,
              dep: rt.dep,
              vac: rt.vac,
              fill: deployPct(rt.dep, rt.san),
            }
            if (rt.vac > 0) vacantRows.push(siteRow)
            if (siteOt > 0) otDetailRows.push(siteRow)
          }
          const resignation = range.period === 'day' ? summaryResignationNum(r.summary) : agg.resignation
          const recruitment = summaryRecruitmentNum(r.summary)
          const colRow = colByBranch[b.id]
          let collectionPct = colRow ? consolidatedCollectionPct(colRow) : ''
          if (!collectionPct) {
            const raw = parseFloat(String(r.summary?.consolidatedCollectionPct ?? '').replace(/[^\d.]/g, ''))
            collectionPct = Number.isFinite(raw) && raw > 0 && raw < 99 ? String(Math.round(raw * 100) / 100) : ''
          }
          deployment.push({
            branch: b.name,
            submitted: Boolean(r.submittedAt),
            daysSubmitted: agg.daysSubmitted,
            san: t.san,
            dep: t.dep,
            abs: t.abs,
            ot: t.ot,
            vac: t.vac,
            collectionPct,
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
        const otSummary = buildOtSummary(otDetailRows)

        const compliance: any[] = []
        let cPvc = 0, cMed = 0, cTrn = 0, cStrength = 0
        for (const b of branches) {
          const docs = guardDocsMap.get(b.id) ?? []
          const branchPosts = branchSanctionedPosts(b.id, repBy[b.id], clients)
          const counts = branchGuardComplianceCounts(docs, branchPosts)
          const branchStrength = counts.registered || branchPosts
          compliance.push({
            branch: b.name,
            strength: branchStrength,
            sanctionedPosts: branchPosts,
            registered: counts.registered,
            total: branchStrength,
            pvc: counts.pvc,
            medical: counts.medical,
            training: counts.training,
          })
          cStrength += branchStrength
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

        const { countIncidentsByBranches } = await import('../_lib/mis/incident-report-store.js')
        const incidentStats = await countIncidentsByBranches(branches.map((b) => ({ id: b.id, name: b.name })))

        const visitStaff: Record<string, number> = {}
        for (const v of visits) visitStaff[v.user] = (visitStaff[v.user] || 0) + 1

        const tierByGroup = resolveBusinessTiers(clients, branches)
        const counted = countBusinessTiers(tierByGroup)
        const starClients = {
          apex: counted.apex,
          enterprise: counted.enterprise,
          cluster: counted.cluster,
          standard: counted.standard,
          strategic: counted.apex,
          highValue: counted.enterprise + counted.cluster,
          valued: counted.standard,
        }

        const dashboard = await buildDashboardExtras(snapshotDate, range.weekStart, {
          branches,
          reports: (range.period === 'day' ? allReports.filter((r) => r.dateFor === range.anchorDate) : allReports).filter(isSubmitted),
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
          submitted: [...repByMap.values()].filter(isSubmitted).length,
          vacantRows: vacantSummary.vacantRows,
          vacantGrouped: vacantSummary.vacantGrouped,
          vacantBranches: vacantSummary.vacantBranches,
          otRows: otSummary.otRows,
          otGrouped: otSummary.otGrouped,
          otBranches: otSummary.otBranches,
          otListTotal: otSummary.otRows.reduce((s, r) => s + r.ot, 0),
          compliance,
          complianceTotals: { strength: cStrength, total: cStrength, pvc: cPvc, medical: cMed, training: cTrn },
          collection: {
            budget: colBudget,
            collected: colCollected,
            outstanding: colOutstanding,
            monthlyBilling: dashboard.collection.monthlyBilling,
            recovered: dashboard.collection.recovered,
            branches: cols.length,
            pct: dashboard.collection.overallPct,
            overallPct: dashboard.collection.overallPct,
            ostAsOn: dashboard.collection.ostAsOn,
            ostSource: dashboard.collection.ostSource,
            dsoOver90Receivable: dashboard.collection.dsoOver90Receivable,
            dsoOver90Branches: dashboard.collection.dsoOver90Branches,
            avgDso: dashboard.collection.avgDso,
          },
          complaints: { total: cmpTotal, open: cmpOpen, closed: cmpClosed },
          incidents: {
            open: incidentStats.open,
            closed: incidentStats.closed,
            total: incidentStats.total,
            byBranch: incidentStats.byBranch,
          },
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

  if (action === 'recruitList') {
    const range = resolveDashboardPeriod(body)
    const pack = await listDailyRecruits(range.dates).catch(() => ({ count: 0, rows: [] }))
    return res.status(200).json({ ok: true, recruits: pack, count: pack.count })
  }

  if (action === 'submission') {
    const date = String(body.date ?? misTodayIst())
    const today = misTodayIst()
    const yesterday = misYesterdayIst()
    const [branches, reports, clients, yesterdayReports] = await Promise.all([
      reportBranchesForReq(req),
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
      if (!isSubmitted(r)) {
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

  if (action === 'reopenReport' || action === 'deleteReport' || action === 'repairReportOt') {
    const gate = await canManageMisUsers(misRequestEmail(req) ?? '')
    if (!gate.ok) return res.status(403).json({ error: gate.error })
    const dateFor = String(body.dateFor ?? body.date ?? misTodayIst()).trim()
    let branchId = String(body.branchId ?? '').trim()
    const branchName = String(body.branchName ?? '').trim()
    if (!branchId && branchName) {
      const branches = await reportBranchesForReq(req)
      const match = branches.find((b) => b.name.toLowerCase() === branchName.toLowerCase())
      if (!match) return res.status(404).json({ error: `Branch "${branchName}" not found.` })
      branchId = match.id
    }
    if (!branchId || !dateFor) return res.status(400).json({ error: 'Branch and date are required.' })
    if (action === 'repairReportOt') {
      const repaired = await repairSubmittedMisReportOt(branchId, dateFor)
      if (!repaired.ok) return res.status(400).json({ error: repaired.error })
      return res.status(200).json({
        ok: true,
        branchId,
        branchName: repaired.branchName,
        dateFor,
        otBefore: repaired.otBefore,
        otAfter: repaired.otAfter,
        message: `${repaired.branchName} OT corrected: ${repaired.otBefore} → ${repaired.otAfter}`,
      })
    }
    if (action === 'deleteReport') {
      const ok = await deleteMisReport(branchId, dateFor)
      if (!ok) return res.status(404).json({ error: 'No report found to delete.' })
      return res.status(200).json({ ok: true, branchId, dateFor, deleted: true })
    }
    const reopened = await reopenSubmittedMisReport(branchId, dateFor)
    if (!reopened.ok) return res.status(400).json({ error: reopened.error })
    return res.status(200).json({
      ok: true,
      branchId,
      branchName: reopened.branchName,
      dateFor,
      reopened: true,
      message: `${reopened.branchName} can now edit and resubmit the MIS for ${dateFor}.`,
    })
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
    // Dedicated mail cache key — Deployment + Vacant + OT (not the thin KPI stub).
    const summary = await getCachedMdSummary(
      `mdmail-v2:${date}`,
      async () => {
        const branches = await reportBranchesForReq(req)
        const [reports, clients] = await Promise.all([
          getReportsForDate(date, branches),
          getClients(undefined, { skipRepair: true, branches }),
        ])
        const reportMap = buildBranchReportMap(branches, reports)
        const deployment: Array<Record<string, unknown>> = []
        const vacantDetail: Array<{
          branchId: string
          branch: string
          client: string
          unit: string
          san: number
          abs: number
          ot: number
          dep: number
          vac: number
          fill: number
        }> = []
        const otDetail: typeof vacantDetail = []
        let TS = 0,
          TD = 0,
          TA = 0,
          TO = 0,
          TV = 0,
          TRes = 0,
          TRec = 0
        let submitted = 0
        for (const b of branches) {
          const r = reportMap.get(b.id)
          if (!isSubmitted(r)) continue
          submitted++
          const t = reportDeployTotals(r.rows as Record<string, unknown>[], b.id, clients)
          let siteRows = filterActiveReportRows(b.id, r.rows as Record<string, unknown>[], clients)
          if (!siteRows.length && (r.rows as Record<string, unknown>[]).length) {
            siteRows = r.rows as Record<string, unknown>[]
          }
          for (const row of siteRows) {
            const rt = rowDeployTotals(row)
            const siteOt = rowOtTotal(row)
            const siteRow = {
              branchId: b.id,
              branch: b.name,
              client: String(row.clientName ?? ''),
              unit: String(row.location ?? ''),
              san: rt.san,
              abs: rt.abs,
              ot: siteOt,
              dep: rt.dep,
              vac: rt.vac,
              fill: deployPct(rt.dep, rt.san),
            }
            if (rt.vac > 0) vacantDetail.push(siteRow)
            if (siteOt > 0) otDetail.push(siteRow)
          }
          const resignation = summaryResignationNum(r.summary)
          const recruitment = summaryRecruitmentNum(r.summary)
          deployment.push({
            branch: b.name,
            submitted: Boolean(r.submittedAt),
            san: t.san,
            dep: t.dep,
            abs: t.abs,
            ot: t.ot,
            vac: t.vac,
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
        const vacantSummary = buildVacantSummary(vacantDetail, { maxGrouped: null })
        const otSummary = buildOtSummary(otDetail)
        return {
          date,
          branchCount: branches.length,
          submitted,
          deployment,
          totals: { san: TS, dep: TD, abs: TA, ot: TO, vac: TV, resignation: TRes, recruitment: TRec },
          vacantRows: vacantSummary.vacantRows,
          vacantGrouped: vacantSummary.vacantGrouped,
          vacantBranches: vacantSummary.vacantBranches,
          otRows: otSummary.otRows,
          otGrouped: otSummary.otGrouped,
        }
      },
      date,
    )
    const pack = await listDailyRecruits([date]).catch(() => ({ count: 0, rejoinCount: 0, existingCount: 0, rows: [] }))
    const recTotals = applyDailyRecruitsToDeployment(
      ((summary as { deployment?: Array<{ branch?: string; recruitment?: number; rejoin?: number }> }).deployment || []),
      pack,
    )
    const totals = ((summary as { totals?: Record<string, number> }).totals ||= {})
    totals.recruitment = recTotals.recruitment
    totals.rejoin = recTotals.rejoin
    const mail = await sendMdSirReportMail(date, to, summary as Record<string, unknown>)
    if (!mail.ok) return res.status(502).json({ error: mail.error })
    return res.status(200).json({ ok: true, to: mail.to, cc: mail.cc })
  }

  if (action === 'bpi') {
    const date = String(body.date ?? new Date().toISOString().slice(0, 10))
    const [branches, reports, clients] = await Promise.all([reportBranchesForReq(req), getReportsForDate(date), getClients()])
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
          submitted: isSubmitted(r),
          performanceZero: true,
          zeroReason: !isSubmitted(r) ? 'Not submitted' : 'Submitted after 4:00 PM IST',
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
    const [branches, clients] = await Promise.all([getBranches(true), getClients()])
    const active = clients.filter((c) => c.active !== false)
    const tierByGroup = resolveBusinessTiers(active, branches)
    const byName = new Map<string, { name: string; businessTier: string; businessTierLabel: string }>()
    for (const c of withBusinessTiers(active, branches, tierByGroup)) {
      const name = String(c.name || '').trim()
      if (!name) continue
      if (!byName.has(name)) {
        byName.set(name, {
          name,
          businessTier: c.businessTier,
          businessTierLabel: c.businessTierLabel,
        })
      }
    }
    const rows = Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name))
    return res.status(200).json({
      ok: true,
      clients: rows,
      /** Plain names for older screens */
      names: rows.map((r) => r.name),
    })
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

  if (action === 'dutyReportHtml' || action === 'sendDutyReportMail') {
    const {
      buildDutyExceptionReportHtml,
      parseShareEmails,
      sendDutyExceptionReportMail,
    } = await import('../_lib/mis/client-facing-reports.js')
    const date = String(body.date ?? new Date().toISOString().slice(0, 10))
    const branchId = String(body.branchId ?? '').trim()
    let incidents = await getDutyIncidents(date)
    let branchName: string | undefined
    if (branchId) {
      const branches = await reportBranchesForReq(req)
      const b = branches.find((x) => x.id === branchId)
      if (!b) {
        incidents = []
        branchName = ''
      } else {
        branchName = b.name
        const { clientNamesForBranch, incidentMatchesBranch } = await import('../_lib/mis/branch-mobile-stats.js')
        const clients = await getClients(branchId)
        const names = clientNamesForBranch(clients)
        incidents = incidents.filter((i) => incidentMatchesBranch(i, b.name, names))
      }
    }
    incidents = await enrichDutyIncidentsWithMobile(incidents, { branchId: branchId || undefined })
    const counts = dutyCounts(incidents)
    const payload = {
      date,
      branchName,
      late: counts.late,
      out: counts.out,
      incidents,
    }
    if (action === 'dutyReportHtml') {
      return res.status(200).json({ ok: true, html: buildDutyExceptionReportHtml(payload) })
    }
    const to = parseShareEmails(body.to)
    const mail = await sendDutyExceptionReportMail(to, payload)
    if (!mail.ok) return res.status(502).json({ error: mail.error })
    return res.status(200).json({ ok: true, to: mail.to })
  }

  if (action === 'complianceReportHtml' || action === 'sendComplianceReportMail') {
    const {
      buildPvcMcReportHtml,
      guardsForComplianceReport,
      parseShareEmails,
      sendPvcMcReportMail,
    } = await import('../_lib/mis/client-facing-reports.js')
    const date = String(body.date ?? new Date().toISOString().slice(0, 10))
    const onlyBranchId = String(body.branchId ?? '').trim()
    const [branches, reports, clients] = await Promise.all([
      reportBranchesForReq(req),
      getReportsForDate(date),
      getClients(),
    ])
    const repBy: Record<string, (typeof reports)[number]> = {}
    for (const r of reports) repBy[r.branchId] = r
    const branchList = onlyBranchId
      ? branches.filter((b) => b.id === onlyBranchId)
      : branches
    const docsMap = await getGuardDocsMany(branchList.map((b) => b.id))
    const rows: {
      branch: string
      strength: number
      pvc: number
      medical: number
      training: number
    }[] = []
    let strength = 0
    let pvc = 0
    let medical = 0
    let training = 0
    let branchName = ''
    let guards: ReturnType<typeof guardsForComplianceReport> | undefined
    for (const b of branchList) {
      const docs = docsMap.get(b.id) ?? []
      const branchPosts = branchSanctionedPosts(b.id, repBy[b.id], clients)
      const counts = branchGuardComplianceCounts(docs, branchPosts)
      const branchStrength = counts.registered || branchPosts
      strength += branchStrength
      pvc += counts.pvc
      medical += counts.medical
      training += counts.training
      rows.push({
        branch: b.name,
        strength: branchStrength,
        pvc: counts.pvc,
        medical: counts.medical,
        training: counts.training,
      })
      if (onlyBranchId) {
        branchName = b.name
        // Cap detail rows so print window stays reliable on large branches
        guards = guardsForComplianceReport(docs).slice(0, 2000)
      }
    }
    const payload = {
      date,
      branchName: branchName || (onlyBranchId ? undefined : 'All Branches'),
      rows,
      totals: { strength, pvc, medical, training },
      guards,
    }
    if (action === 'complianceReportHtml') {
      const html = buildPvcMcReportHtml(payload)
      return res.status(200).json({ ok: true, html, bytes: html.length })
    }
    const to = parseShareEmails(body.to)
    const mail = await sendPvcMcReportMail(to, payload)
    if (!mail.ok) return res.status(502).json({ error: mail.error })
    return res.status(200).json({ ok: true, to: mail.to })
  }

  if (action === 'loadUsers') {
    const gate = await canManageMisUsers(misRequestEmail(req))
    if (!gate.ok) return res.status(403).json({ error: gate.error })
    let users = await getUsers()
    if (users.length === 0) {
      users = defaultMisUsers()
      await saveUsers(users)
    }
    const [branches] = await Promise.all([getMisReportBranches(true)])
    return res.status(200).json({ ok: true, users, branches, supportDepartments: [...SUPPORT_DEPARTMENTS] })
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
    const userSummary = list
      .slice(0, 60)
      .map(
        (u) =>
          `${u.name} <${u.email}> (${u.role || '—'}; ${u.active === false ? 'inactive' : 'active'})`,
      )
      .join('; ')
    noteDirectoryChange(
      actorEmail,
      'saveUsers',
      `Users saved: ${list.length}. ${userSummary}${list.length > 60 ? '…' : ''}`,
    )
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

  if (String(action).startsWith('nightVisit')) {
    const { handleNightVisitAction } = await import('../_lib/mis/night-visit-handlers.js')
    const userName = String(body.userName ?? 'Management')
    const r = await handleNightVisitAction(action, body as Record<string, unknown>, {
      userName,
      email: misRequestEmail(req) || userName,
      portal: 'mgmt',
    })
    if (!r) return res.status(400).json({ error: 'Unknown action.' })
    return res.status(r.status).json(r.json)
  }

  if (
    action === 'nightOjtLoad' ||
    action === 'nightOjtUploadSchedule' ||
    action === 'nightOjtSaveReport' ||
    action === 'nightOjtBranches' ||
    action === 'nightOjtListReports'
  ) {
    const {
      handleNightOjtBranches,
      handleNightOjtLoad,
      handleNightOjtListReports,
      handleNightOjtSaveReport,
      handleNightOjtUploadSchedule,
    } = await import('../_lib/mis/night-ojt-handlers.js')
    const userName = String(body.userName ?? 'Management')
    if (action === 'nightOjtBranches') {
      const r = await handleNightOjtBranches()
      return res.status(r.status).json(r.json)
    }
    if (action === 'nightOjtListReports') {
      const r = await handleNightOjtListReports(body as Record<string, unknown>)
      return res.status(r.status).json(r.json)
    }
    if (action === 'nightOjtLoad') {
      const r = await handleNightOjtLoad(body as Record<string, unknown>)
      return res.status(r.status).json(r.json)
    }
    if (action === 'nightOjtUploadSchedule') {
      const r = await handleNightOjtUploadSchedule(body as Record<string, unknown>, userName)
      return res.status(r.status).json(r.json)
    }
    const r = await handleNightOjtSaveReport(body as Record<string, unknown>, userName)
    return res.status(r.status).json(r.json)
  }

  if (
    action === 'clientVisitBoot' ||
    action === 'clientVisitFetchMobile' ||
    action === 'clientVisitSave' ||
    action === 'clientVisitReview' ||
    action === 'clientVisitRemind' ||
    action === 'clientVisitReopen' ||
    action === 'clientVisitPreview' ||
    action === 'clientVisitSend' ||
    action === 'clientVisitClearAll'
  ) {
    const {
      handleClientVisitBoot,
      handleClientVisitFetchMobile,
      handleClientVisitPreview,
      handleClientVisitRemind,
      handleClientVisitReopen,
      handleClientVisitReview,
      handleClientVisitSave,
      handleClientVisitSend,
      handleClientVisitClearAll,
    } = await import('../_lib/mis/client-visit-handlers.js')
    const userName = String(body.userName ?? 'Management')
    const actorEmail = misRequestEmail(req) || userName
    if (action === 'clientVisitBoot') {
      const r = await handleClientVisitBoot(body as Record<string, unknown>)
      return res.status(r.status).json(r.json)
    }
    if (action === 'clientVisitFetchMobile') {
      const r = await handleClientVisitFetchMobile(body as Record<string, unknown>)
      return res.status(r.status).json(r.json)
    }
    if (action === 'clientVisitClearAll') {
      const r = await handleClientVisitClearAll(body as Record<string, unknown>)
      return res.status(r.status).json(r.json)
    }
    if (action === 'clientVisitSave') {
      const r = await handleClientVisitSave(body as Record<string, unknown>, userName)
      return res.status(r.status).json(r.json)
    }
    if (action === 'clientVisitReview') {
      const r = await handleClientVisitReview(body as Record<string, unknown>, userName)
      return res.status(r.status).json(r.json)
    }
    if (action === 'clientVisitRemind') {
      const r = await handleClientVisitRemind(body as Record<string, unknown>, actorEmail)
      return res.status(r.status).json(r.json)
    }
    if (action === 'clientVisitReopen') {
      const r = await handleClientVisitReopen(body as Record<string, unknown>, actorEmail)
      return res.status(r.status).json(r.json)
    }
    if (action === 'clientVisitPreview') {
      const r = await handleClientVisitPreview(body as Record<string, unknown>)
      return res.status(r.status).json(r.json)
    }
    const r = await handleClientVisitSend(body as Record<string, unknown>, userName)
    return res.status(r.status).json(r.json)
  }

  if (
    action === 'clientDoorBoot' ||
    action === 'clientDoorPreview' ||
    action === 'clientDoorSend' ||
    action === 'clientDoorAddEmail' ||
    action === 'clientDoorEditEmail' ||
    action === 'clientDoorDeleteEmail'
  ) {
    const {
      handleClientDoorBoot,
      handleClientDoorPreview,
      handleClientDoorSend,
      handleClientDoorAddEmail,
      handleClientDoorEditEmail,
      handleClientDoorDeleteEmail,
    } = await import('../_lib/mis/client-door-handlers.js')
    const userName = String(body.userName ?? misRequestEmail(req) ?? 'Management')
    if (action === 'clientDoorBoot') {
      const r = await handleClientDoorBoot(body as Record<string, unknown>)
      return res.status(r.status).json(r.json)
    }
    if (action === 'clientDoorPreview') {
      const r = await handleClientDoorPreview(body as Record<string, unknown>)
      return res.status(r.status).json(r.json)
    }
    if (action === 'clientDoorAddEmail') {
      const r = await handleClientDoorAddEmail(body as Record<string, unknown>)
      return res.status(r.status).json(r.json)
    }
    if (action === 'clientDoorEditEmail') {
      const r = await handleClientDoorEditEmail(body as Record<string, unknown>)
      return res.status(r.status).json(r.json)
    }
    if (action === 'clientDoorDeleteEmail') {
      const r = await handleClientDoorDeleteEmail(body as Record<string, unknown>)
      return res.status(r.status).json(r.json)
    }
    const r = await handleClientDoorSend(body as Record<string, unknown>, userName)
    return res.status(r.status).json(r.json)
  }

  if (
    action === 'periodicalSurveyBoot' ||
    action === 'periodicalSurveySave' ||
    action === 'periodicalSurveyGenerateAi' ||
    action === 'periodicalSurveyClientReport' ||
    action === 'periodicalSurveySendMail' ||
    action === 'periodicalSurveyApprove' ||
    action === 'periodicalSurveyReviewSuggestions' ||
    action === 'periodicalSurveyRemind' ||
    action === 'periodicalSurveyReopen' ||
    action === 'periodicalSurveyReassessment' ||
    action === 'periodicalSurveyDelete' ||
    action === 'hdfcSsaBoardBoot' ||
    action === 'hdfcSsaBoardRefreshAi' ||
    action === 'hdfcSsaBoardLink'
  ) {
    const {
      handlePeriodicalSurveyApprove,
      handlePeriodicalSurveyBoot,
      handlePeriodicalSurveyClientReport,
      handlePeriodicalSurveyDelete,
      handlePeriodicalSurveyGenerateAi,
      handlePeriodicalSurveyRemind,
      handlePeriodicalSurveyReopen,
      handlePeriodicalSurveyReassessment,
      handlePeriodicalSurveyReviewSuggestions,
      handlePeriodicalSurveySave,
      handlePeriodicalSurveySendMail,
      handleHdfcSsaBoardBoot,
      handleHdfcSsaBoardRefreshAi,
      handleHdfcSsaBoardLink,
    } = await import('../_lib/mis/periodical-survey-handlers.js')
    const userName = String(body.userName ?? 'Management')
    const actorEmail = misRequestEmail(req) || userName
    if (action === 'periodicalSurveyBoot') {
      const r = await handlePeriodicalSurveyBoot(body as Record<string, unknown>)
      return res.status(r.status).json(r.json)
    }
    if (action === 'periodicalSurveySave') {
      return res.status(403).json({ error: 'Management reviews surveys. HOD / Staff submit them.' })
    }
    if (action === 'periodicalSurveyGenerateAi') {
      const r = await handlePeriodicalSurveyGenerateAi(body as Record<string, unknown>)
      return res.status(r.status).json(r.json)
    }
    if (action === 'periodicalSurveyClientReport') {
      const r = await handlePeriodicalSurveyClientReport(body as Record<string, unknown>)
      return res.status(r.status).json(r.json)
    }
    if (action === 'periodicalSurveyReviewSuggestions') {
      const r = await handlePeriodicalSurveyReviewSuggestions(
        body as Record<string, unknown>,
        actorEmail,
        userName,
      )
      return res.status(r.status).json(r.json)
    }
    if (action === 'periodicalSurveyApprove') {
      const r = await handlePeriodicalSurveyApprove(body as Record<string, unknown>, actorEmail, userName)
      return res.status(r.status).json(r.json)
    }
    if (action === 'periodicalSurveyRemind') {
      const r = await handlePeriodicalSurveyRemind(body as Record<string, unknown>, actorEmail)
      return res.status(r.status).json(r.json)
    }
    if (action === 'periodicalSurveyReopen') {
      const r = await handlePeriodicalSurveyReopen(body as Record<string, unknown>, actorEmail)
      return res.status(r.status).json(r.json)
    }
    if (action === 'periodicalSurveyReassessment') {
      const r = await handlePeriodicalSurveyReassessment(body as Record<string, unknown>, userName, actorEmail)
      return res.status(r.status).json(r.json)
    }
    if (action === 'periodicalSurveyDelete') {
      const r = await handlePeriodicalSurveyDelete(body as Record<string, unknown>, actorEmail)
      return res.status(r.status).json(r.json)
    }
    if (action === 'hdfcSsaBoardBoot') {
      const r = await handleHdfcSsaBoardBoot(body as Record<string, unknown>)
      return res.status(r.status).json(r.json)
    }
    if (action === 'hdfcSsaBoardRefreshAi') {
      const r = await handleHdfcSsaBoardRefreshAi(body as Record<string, unknown>)
      return res.status(r.status).json(r.json)
    }
    if (action === 'hdfcSsaBoardLink') {
      const r = await handleHdfcSsaBoardLink()
      return res.status(r.status).json(r.json)
    }
    const r = await handlePeriodicalSurveySendMail(body as Record<string, unknown>)
    return res.status(r.status).json(r.json)
  }

  /** Management — view-only incident list (Open / Closed). Creating/sending stays on HOD portal. */
  if (action === 'incidentReportsOverview') {
    const branches = await reportBranchesForReq(req)
    const branchList = branches
      .map((b) => ({ id: b.id, name: b.name }))
      .sort((a, b) => a.name.localeCompare(b.name))
    const filterId = String(body.branchId ?? 'all').trim()
    const scope =
      filterId && filterId !== 'all' ? branchList.filter((b) => b.id === filterId) : branchList
    const { listIncidentReports } = await import('../_lib/mis/incident-report-store.js')
    const reports: Record<string, unknown>[] = []
    let open = 0
    let closed = 0
    for (const b of scope) {
      const list = await listIncidentReports(b.id)
      for (const r of list) {
        if (r.status === 'submitted') closed++
        else open++
        reports.push({
          id: r.id,
          branchId: b.id,
          branchName: b.name,
          refNo: r.refNo,
          reportDate: r.reportDate,
          incidentDate: r.incidentDate,
          clientName: r.clientName,
          placeOfIncident: r.placeOfIncident,
          typeOfIncident: r.typeOfIncident,
          status: r.status,
          submittedAt: r.submittedAt || '',
          updatedAt: r.updatedAt,
        })
      }
    }
    reports.sort((a, b) =>
      String(b.updatedAt || b.incidentDate || '').localeCompare(
        String(a.updatedAt || a.incidentDate || ''),
      ),
    )
    return res.status(200).json({
      ok: true,
      branches: branchList,
      reports,
      open,
      closed,
      total: open + closed,
    })
  }

  if (action === 'getIncidentReport') {
    const branchId = String(body.branchId ?? '').trim()
    if (!branchId) return res.status(400).json({ error: 'Branch required.' })
    const branches = await reportBranchesForReq(req)
    const branch = branches.find((b) => b.id === branchId)
    if (!branch) return res.status(404).json({ error: 'Branch not found.' })
    const email = misRequestEmail(req) || 'management'
    const { handleIncidentReportAction } = await import('../_lib/mis/incident-report-handlers.js')
    const r = await handleIncidentReportAction(action, body as Record<string, unknown>, {
      branchId: branch.id,
      branchName: branch.name,
      email,
    })
    if (!r) return res.status(400).json({ error: 'Unknown action.' })
    return res.status(r.status).json(r.json)
  }

  return res.status(400).json({ error: 'Unknown action.' })
}
