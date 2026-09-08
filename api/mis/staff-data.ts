import type { VercelRequest, VercelResponse } from '@vercel/node'

export const maxDuration = 60
import { verifyAppSession } from '../_lib/app-session.js'
import {
  docPresent,
  ensureComplaintCodes,
  getActiveBranch,
  getBranches,
  getMisReportBranches,
  isMisReportingBranch,
  getClients,
  getCollections,
  getComplaints,
  getDutyDates,
  getDutyIncidents,
  getGuardDocs,
  getReport,
  repairFalseVacancyFromCarriedAbsent,
  getReportDates,
  getVisitDates,
  getVisits,
  guardRecordEligible,
  misStorageOk,
  nid,
  num,
  saveCollections,
  saveComplaints,
  upsertClient,
  saveClientPerfFinance,
  setClientActive,
  getUsers,
  type MisClient,
  type MisCollection,
  type MisComplaint,
  type MisDutyIncident,
  type MisVisit,
} from '../_lib/mis/store.js'
import { resolveBusinessTiers, withBusinessTiers } from '../_lib/mis/client-rules.js'
import { guardCompliancePcts } from '../_lib/mis/guard-compliance-math.js'
import {
  buildBranchMobileStats,
  buildPatrolDutyReport,
  clientNamesForBranch,
  guardCompliancePct,
  incidentMatchesBranch,
  visitMatchesBranch,
} from '../_lib/mis/branch-mobile-stats.js'
import { buildVisitAnalysis, dayVisitsOnly, syncMobileVisits } from '../_lib/mis/mobile-visits.js'
import { enrichDutyIncidentsWithMobile } from '../_lib/mis/duty-contact.js'
import { dutyCounts } from '../_lib/mis/work360-duty.js'
import { parseKmNumber } from '../_lib/mis/work360-km.js'
import { deployPct, filterActiveReportRows, reportDeployTotals, rowDeployTotals, rowOtTotal } from '../_lib/mis/deploy-math.js'
import { misTodayIst, misWeekStartMonday, misDeadlineUtc } from '../_lib/mis/dates.js'
import { buildBranchAckStats } from '../_lib/mis/ack-stats.js'
import { getSlaIssueRegister, summarizeSlaPending } from '../_lib/mis/sla-issue.js'
import { supportUserBlocksMisSubmit } from '../_lib/user-team.js'
import { collectionDso } from '../_lib/mis/collection-import.js'
import { listDailyRecruits } from '../_lib/mis/daily-recruits.js'

async function authStaff(sessionToken: string, branchId: string) {
  const session = await verifyAppSession(sessionToken, 'mis-report')
  if (!session) {
    return { error: 'Your sign-in expired. Please enter your branch password again.' } as const
  }
  let id = String(branchId ?? '').trim()
  if (session.role === 'staff' && session.branchId) {
    /** Trust the PIN session branch — stale sessionStorage from another city must not bounce HODs. */
    id = session.branchId
  }
  if (!id) return { error: 'Please sign in with your branch.' } as const
  const b = await getActiveBranch(id)
  if (!b) {
    const exists = (await getBranches()).find((x) => x.id === id)
    if (exists && exists.active === false) {
      return { error: 'This branch is deactivated. Contact management.' } as const
    }
    return { error: 'Branch not found. Please sign in again.' } as const
  }
  if (!isMisReportingBranch(b)) {
    return {
      error:
        'This unit does not submit Daily MIS (operations only). Training / Recruitment use their own portals.',
    } as const
  }
  const users = await getUsers()
  const supportBlock = supportUserBlocksMisSubmit(users, session.email)
  if (supportBlock) return { error: supportBlock } as const
  return { branch: b, email: session.email } as const
}

function weekCollected(c: MisCollection): number {
  return num(c.mon) + num(c.tue) + num(c.wed) + num(c.thu) + num(c.fri) + num(c.sat)
}

async function branchClients(branchId: string): Promise<MisClient[]> {
  return getClients(branchId, { skipRepair: true })
}

function filterVisits(visits: MisVisit[], branchName: string, clients: MisClient[]): MisVisit[] {
  const names = clientNamesForBranch(clients)
  return visits.filter((v) => visitMatchesBranch(v.client, v.unit, branchName, names))
}

function filterDuty(incidents: MisDutyIncident[], branchName: string, clients: MisClient[]): MisDutyIncident[] {
  const names = clientNamesForBranch(clients)
  return incidents.filter((d) => incidentMatchesBranch(d, branchName, names))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = (req.body ?? {}) as Record<string, unknown>
  const action = String(body.action ?? '')
  const sessionToken = String(body.sessionToken ?? '')
  const branchId = String(body.branchId ?? '')
  const auth = await authStaff(sessionToken, branchId)
  if ('error' in auth) return res.status(401).json({ error: auth.error })
  const branch = auth.branch

  if (action === 'ping') {
    return res.status(200).json({
      ok: true,
      branch: branch.name,
      branchId: branch.id,
      email: auth.email,
    })
  }

  if (action === 'dashboard') {
    const dateFor = String(body.date ?? misTodayIst())
    const weekStart = misWeekStartMonday(dateFor)
    const [clients, reportRaw, mobile, hr, complaints, cols, guardDocs, slaRows, patrolDuty, dailyRecruits] = await Promise.all([
      branchClients(branchId),
      getReport(branchId, dateFor),
      buildBranchMobileStats(branchId, branch.name, dateFor),
      buildBranchAckStats(branchId, branch.name, dateFor),
      getComplaints(branchId),
      getCollections(weekStart),
      getGuardDocs(branchId),
      getSlaIssueRegister(branchId),
      buildPatrolDutyReport(branchId, branch.name, dateFor),
      listDailyRecruits([dateFor], { id: branch.id, name: branch.name }),
    ])
    const report = reportRaw ? await repairFalseVacancyFromCarriedAbsent(reportRaw) : reportRaw
    const col = cols.find((c) => c.branchId === branchId)
    const collected = col ? weekCollected(col) : 0
    const openComplaints = complaints.filter((c) => c.active !== false && c.status !== 'Closed').length
    const closedComplaints = complaints.filter((c) => c.active !== false && c.status === 'Closed').length
    const { countIncidentsForBranch } = await import('../_lib/mis/incident-report-store.js')
    const incidentCounts = await countIncidentsForBranch(branchId)
    let totals = { san: 0, dep: 0, abs: 0, ot: 0, vac: 0 }
    if (report) totals = reportDeployTotals(report.rows as Record<string, unknown>[], branchId, clients)
    totals.vac = Math.max(0, totals.abs - totals.ot)
    totals.dep = Math.min(totals.san, Math.max(0, totals.san - totals.vac))
    const deployPctVal = deployPct(totals.dep, totals.san)
    const cutoff = misDeadlineUtc(dateFor)
    const submitted = Boolean(report?.submittedAt)
    const hasDraft = Boolean(report && !report.submittedAt)
    const onTime = submitted ? new Date(report!.submittedAt).getTime() <= cutoff : false
    const vacantRows: { client: string; unit: string; vac: number; fill: number }[] = []
    const otRows: { client: string; unit: string; ot: number; abs: number }[] = []
    if (report) {
      for (const row of filterActiveReportRows(branchId, report.rows as Record<string, unknown>[], clients)) {
        const rt = rowDeployTotals(row)
        const siteOt = rowOtTotal(row)
        if (rt.vac > 0) {
          vacantRows.push({
            client: String(row.clientName ?? ''),
            unit: String(row.location ?? ''),
            vac: rt.vac,
            fill: deployPct(rt.dep, rt.san),
          })
        }
        if (siteOt > 0) {
          otRows.push({
            client: String(row.clientName ?? ''),
            unit: String(row.location ?? ''),
            ot: siteOt,
            abs: rt.abs,
          })
        }
      }
      vacantRows.sort((a, b) => b.vac - a.vac)
      otRows.sort((a, b) => b.ot - a.ot)
    }
    const activeGuards = guardDocs.filter(guardRecordEligible).length
    const compP = guardCompliancePcts(guardDocs, totals.san)
    const compliance = {
      medicalFitnessPct: String(compP.medicalPct),
      pvcPct: String(compP.pvcPct),
      psaraPct: String(compP.trainingPct),
    }
    const sla = summarizeSlaPending(branchId, branch.name, slaRows)
    const lateCases = Number(report?.summary?.lateStartCases) || mobile.lateStartCases
    const notStartedCases = totals.vac
    let latePct = totals.san ? Math.round((lateCases * 100) / totals.san) : 0
    let notStartedPct = totals.san ? Math.round((notStartedCases * 100) / totals.san) : 0
    if (latePct + notStartedPct > 100) notStartedPct = Math.max(0, 100 - latePct)
    const timelyPct = Math.max(0, 100 - latePct - notStartedPct)
    return res.status(200).json({
      ok: true,
      branch: { id: branch.id, name: branch.name },
      dateFor,
      submitted,
      hasDraft,
      onTime,
      submittedBy: report?.submittedBy ?? '',
      deployPct: deployPctVal,
      totals,
      sites: clients.filter((c) => c.active !== false).length,
      mobile,
      compliance: {
        ...compliance,
        registered: activeGuards,
        sanctioned: totals.san,
        pvcCount: compP.pvc,
        medicalCount: compP.medical,
        trainingCount: compP.training,
        pvcPct: compP.pvcPct,
        medicalPct: compP.medicalPct,
        trainingPct: compP.trainingPct,
      },
      hr: { resignation: hr.resigned, recruitment: dailyRecruits.count, rejoin: dailyRecruits.rejoinCount, recruitmentOpen: hr.recruitmentOpen },
      recruits: dailyRecruits,
      collection: col
        ? {
            weekStart,
            budget: col.budget,
            collected,
            outstanding: col.outstanding,
            monthlyBilling: col.monthlyBilling,
            dso: collectionDso(col.outstanding, col.monthlyBilling),
            achievement: col.budget > 0 ? Math.round((collected * 100) / col.budget) : 0,
          }
        : null,
      complaints: { open: openComplaints, closed: closedComplaints, total: openComplaints + closedComplaints },
      incidents: {
        open: incidentCounts.open,
        closed: incidentCounts.closed,
        total: incidentCounts.total,
      },
      summary: report?.summary ?? null,
      vacantRows: vacantRows.slice(0, 15),
      otRows: otRows.slice(0, 15),
      sla,
      dutyStart: {
        timelyPct,
        latePct,
        notStartedPct,
        lateCases,
        notStartedCases,
        outCases: notStartedCases,
      },
      patrolDuty,
    })
  }

  if (action === 'consolidated') {
    const dateFor = String(body.dateFor ?? misTodayIst())
    const [clients, report] = await Promise.all([branchClients(branchId), getReport(branchId, dateFor)])
    const branchTotals = report
      ? reportDeployTotals(report.rows as Record<string, unknown>[], branchId, clients)
      : { san: 0, dep: 0, abs: 0, ot: 0, vac: 0 }
    branchTotals.vac = Math.max(0, branchTotals.abs - branchTotals.ot)
    branchTotals.dep = Math.min(branchTotals.san, Math.max(0, branchTotals.san - branchTotals.vac))
    return res.status(200).json({
      ok: true,
      dateFor,
      branch: { id: branch.id, name: branch.name },
      submitted: Boolean(report?.submittedAt),
      hasDraft: Boolean(report && !report.submittedAt),
      report: report || null,
      branchTotals,
    })
  }

  if (action === 'clientList') {
    const [branches, allClients, clients] = await Promise.all([
      getBranches(true),
      getClients(undefined, { skipRepair: true }),
      branchClients(branchId),
    ])
    const tierByGroup = resolveBusinessTiers(allClients, branches)
    const active = clients.filter((c) => c.active !== false)
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
      names: rows.map((r) => r.name),
      branchName: branch.name,
    })
  }

  if (action === 'clientPerf') {
    const { resolveClientPerfRange, buildClientPerformance } = await import('../_lib/mis/client-performance.js')
    const clients = await branchClients(branchId)
    const range = resolveClientPerfRange(body)
    const result = await buildClientPerformance({
      clientName: String(body.clientName ?? ''),
      from: range.from,
      to: range.to,
      branchId,
      branchName: branch.name,
      branchClients: clients,
    })
    if (result.ok === false) return res.status(400).json({ error: result.error })
    return res.status(200).json(result)
  }

  if (action === 'saveClientPerfFinance') {
    if (!misStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
    const clientName = String(body.clientName ?? '').trim()
    if (!clientName) return res.status(400).json({ error: 'Select a client.' })
    const saved = await saveClientPerfFinance(branchId, clientName, {
      mwCompliant: String(body.mwCompliant ?? ''),
      monthlyBillLacs: String(body.monthlyBillLacs ?? ''),
      balanceToPayLacs: String(body.balanceToPayLacs ?? ''),
    })
    if (!saved.ok) return res.status(400).json({ error: 'Could not save — check client name.' })
    return res.status(200).json({ ok: true, updated: saved.updated })
  }

  if (action === 'unitIssue') {
    const rows = await getSlaIssueRegister(branchId)
    const summary = summarizeSlaPending(branchId, branch.name, rows)
    const pending = rows.filter((r) => r.active !== false && Object.values(r.qty || {}).some((n) => num(n) > 0) && !r.sharedWithStores)
    return res.status(200).json({ ok: true, branchName: branch.name, summary, rows: pending.slice(0, 50) })
  }

  if (action === 'visits' || action === 'syncVisits') {
    const date = String(body.date ?? misTodayIst())
    let sync = null
    if (action === 'syncVisits' || body.autoSync === true) {
      sync = await syncMobileVisits(date, { includeVisits: true, includeDuty: false, includeAttendance: false })
      if (action === 'syncVisits' && !sync.ok) return res.status(502).json({ error: sync.error || 'Sync failed', sync })
    }
    const clients = await branchClients(branchId)
    const allVisits = await getVisits(date)
    const visits = dayVisitsOnly(filterVisits(allVisits, branch.name, clients))
    const analysis = await buildVisitAnalysis(date, visits)
    const dates = await getVisitDates()
    return res.status(200).json({
      ok: true,
      date,
      branchName: branch.name,
      visits,
      dates,
      sync,
      analysis,
    })
  }

  if (action === 'duty' || action === 'dutyLate' || action === 'dutyOut' || action === 'syncDuty') {
    const date = String(body.date ?? misTodayIst())
    let sync = null
    if (action === 'syncDuty') {
      sync = await syncMobileVisits(date, { includeVisits: false, includeDuty: true, includeAttendance: false })
      if (!sync.ok) return res.status(502).json({ error: sync.error || 'Sync failed', sync })
    }
    const clients = await branchClients(branchId)
    const all = await getDutyIncidents(date)
    const filtered = filterDuty(all, branch.name, clients)
    const typeFilter = action === 'dutyLate' ? 'late_start' : action === 'dutyOut' ? 'out_of_post' : null
    const typed = typeFilter ? filtered.filter((i) => i.type === typeFilter) : filtered
    const incidents = await enrichDutyIncidentsWithMobile(typed, { branchId })
    const counts = dutyCounts(incidents)
    const dates = await getDutyDates()
    const allVisits = await getVisits(date)
    const patrolVisits = filterVisits(allVisits, branch.name, clients)
    let totalPatrolKm = 0
    for (const v of patrolVisits) totalPatrolKm += parseKmNumber(v.kmTravelled)
    return res.status(200).json({
      ok: true,
      date,
      branchName: branch.name,
      incidents,
      counts,
      dates,
      sync,
      patrolVisits,
      totalPatrolKm: Math.round(totalPatrolKm * 100) / 100,
    })
  }

  if (action === 'dutyReportHtml' || action === 'sendDutyReportMail') {
    const {
      buildDutyExceptionReportHtml,
      parseShareEmails,
      sendDutyExceptionReportMail,
    } = await import('../_lib/mis/client-facing-reports.js')
    const date = String(body.date ?? misTodayIst())
    const clients = await branchClients(branchId)
    const all = await getDutyIncidents(date)
    const incidents = await enrichDutyIncidentsWithMobile(filterDuty(all, branch.name, clients), { branchId })
    const counts = dutyCounts(incidents)
    const payload = {
      date,
      branchName: branch.name,
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

  if (action === 'loadCollection') {
    const weekStart = String(body.weekStart ?? misWeekStartMonday(misTodayIst()))
    const cols = await getCollections(weekStart)
    const saved = cols.find((c) => c.branchId === branchId)
    const row: MisCollection =
      saved ||
      ({
        id: `${branchId}:${weekStart}`,
        branchId,
        weekStart,
        monthlyBilling: 0,
        budget: 0,
        mon: 0,
        tue: 0,
        wed: 0,
        thu: 0,
        fri: 0,
        sat: 0,
        outstanding: 0,
        remarks: '',
      } satisfies MisCollection)
    let carryNote = ''
    const hasSavedWeek = Boolean(saved && (saved.budget > 0 || weekCollected(saved) > 0))
    if (!hasSavedWeek) {
      const base = new Date(weekStart + 'T12:00:00')
      for (let i = 1; i <= 12; i++) {
        const prev = new Date(base)
        prev.setDate(prev.getDate() - 7 * i)
        const prevWeek = prev.toISOString().slice(0, 10)
        const prevCols = await getCollections(prevWeek)
        const prevRow = prevCols.find((c) => c.branchId === branchId)
        if (prevRow && prevRow.budget > 0) {
          row.budget = prevRow.budget
          carryNote = `Weekly budget carried from week of ${prevWeek} — change if needed.`
          break
        }
      }
    }
    const collected = weekCollected(row)
    return res.status(200).json({
      ok: true,
      weekStart,
      collection: row,
      collected,
      achievement: row.budget > 0 ? Math.round((collected * 100) / row.budget) : 0,
      dso: collectionDso(row.outstanding, row.monthlyBilling),
      carryNote,
    })
  }

  if (action === 'saveCollection') {
    if (!misStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
    const weekStart = String(body.weekStart ?? misWeekStartMonday(misTodayIst()))
    const raw = (body.collection ?? {}) as Record<string, unknown>
    const all = await getCollections(weekStart)
    const prev = all.find((c) => c.branchId === branchId)
    const row: MisCollection = {
      id: String(raw.id || prev?.id || `${branchId}:${weekStart}`),
      branchId,
      weekStart,
      monthlyBilling: prev?.monthlyBilling ?? num(raw.monthlyBilling),
      budget: num(raw.budget) || prev?.budget || 0,
      mon: num(raw.mon),
      tue: num(raw.tue),
      wed: num(raw.wed),
      thu: num(raw.thu),
      fri: num(raw.fri),
      sat: num(raw.sat),
      outstanding: prev?.outstanding ?? num(raw.outstanding),
      ostCollected: prev?.ostCollected,
      remarks: String(raw.remarks ?? prev?.remarks ?? '').slice(0, 200),
    }
    const next = all.filter((c) => c.branchId !== branchId).concat(row)
    await saveCollections(weekStart, next)
    const collected = weekCollected(row)
    return res.status(200).json({
      ok: true,
      collection: row,
      collected,
      achievement: row.budget > 0 ? Math.round((collected * 100) / row.budget) : 0,
      dso: collectionDso(row.outstanding, row.monthlyBilling),
    })
  }

  if (action === 'importCollectionSheet' || action === 'importOutstandingFile') {
    const weekStart = String(body.weekStart ?? misWeekStartMonday(misTodayIst()))
    const fileName = String(body.fileName ?? 'upload.xlsx').slice(0, 120)
    const {
      decodeUploadBase64,
      parseCollectionCommitmentSheet,
      applyCollectionSheetImport,
      parseOutstandingStatement,
      applyOutstandingImport,
      saveOstCollectionBaseline,
    } = await import('../_lib/mis/collection-import.js')
    let buf: Buffer
    try {
      buf = decodeUploadBase64(String(body.data ?? ''))
    } catch {
      return res.status(400).json({ error: 'Could not read the uploaded file.' })
    }
    const branches = await getMisReportBranches(true)
    const existing = await getCollections(weekStart)
    if (action === 'importCollectionSheet') {
      const parsed = parseCollectionCommitmentSheet(buf)
      if (!parsed.length) return res.status(400).json({ error: 'No branch rows found in CC file.' })
      const result = applyCollectionSheetImport(weekStart, branches, existing, parsed, fileName)
      await saveCollections(weekStart, result.list)
      const row = result.list.find((c) => c.branchId === branchId)
      return res.status(200).json({
        ok: true,
        updated: result.updated,
        unmatched: result.unmatched,
        collection: row,
        message: row ? 'Your branch row was updated from the file.' : 'File saved — your branch name may not have matched a row.',
      })
    }
    const parsed = parseOutstandingStatement(buf)
    if (!parsed.length) return res.status(400).json({ error: 'No outstanding data found in OST file.' })
    const result = applyOutstandingImport(weekStart, branches, existing, parsed, fileName)
    await saveCollections(weekStart, result.list)
    await saveOstCollectionBaseline(weekStart, buf, fileName, parsed)
    const row = result.list.find((c) => c.branchId === branchId)
    return res.status(200).json({
      ok: true,
      updated: result.updated,
      unmatched: result.unmatched,
      collection: row,
      message: row ? 'Outstanding statement applied to your branch.' : 'File saved — check branch name matches finance file.',
    })
  }

  if (action === 'bpi') {
    const date = String(body.date ?? misTodayIst())
    const [report, clients] = await Promise.all([getReport(branchId, date), branchClients(branchId)])
    let dep = 0
    if (report) {
      const t = reportDeployTotals(report.rows as Record<string, unknown>[], branchId, clients)
      dep = deployPct(t.dep, t.san)
    }
    const docs = await getGuardDocs(branchId)
    let comp = 0
    if (docs.length) {
      let p = 0,
        m = 0,
        t = 0
      for (const dc of docs) {
        if (docPresent(dc.pvc)) p++
        if (docPresent(dc.medical)) m++
        if (docPresent(dc.training)) t++
      }
      comp = Math.round(((p + m + t) / (docs.length * 3)) * 100)
    }
    const cs = await getComplaints(branchId)
    const open = cs.filter((c) => c.status !== 'Closed').length
    const sat = Math.max(0, 100 - open * 10)
    const cutoff = misDeadlineUtc(date)
    const admin = report ? (new Date(report.submittedAt).getTime() <= cutoff ? 100 : 60) : 0
    const bpi = Math.round(dep * 0.4 + comp * 0.3 + sat * 0.2 + admin * 0.1)
    return res.status(200).json({
      ok: true,
      date,
      score: { branch: branch.name, deployment: dep, compliance: comp, client: sat, admin, bpi, submitted: Boolean(report?.submittedAt) },
    })
  }

  if (action === 'hr') {
    const month = String(body.month ?? misTodayIst().slice(0, 7))
    const dates = (await getReportDates()).filter((d) => d.startsWith(month)).sort().reverse()
    const rows: { date: string; resignation: string; recruitment: string; submittedBy: string }[] = []
    for (const d of dates.slice(0, 31)) {
      const r = await getReport(branchId, d)
      if (!r) continue
      rows.push({
        date: d,
        resignation: String(r.summary?.resignation ?? ''),
        recruitment: String(r.summary?.recruitment ?? ''),
        submittedBy: r.submittedBy || '',
      })
    }
    const hr = await buildBranchAckStats(branchId, branch.name, misTodayIst())
    return res.status(200).json({
      ok: true,
      month,
      branchName: branch.name,
      today: { resignation: hr.resigned, recruitment: hr.recruitmentOpen },
      history: rows,
    })
  }

  if (action === 'loadComplaints') {
    const type = String(body.type ?? '')
    if (body.syncGuards !== false && (type === 'Guard' || !type)) {
      const { syncGuardsComplaintsToMis } = await import('../_lib/mis/guards-complaint-sync.js')
      await syncGuardsComplaintsToMis().catch(() => null)
    }
    if (body.syncMail !== false && (!type || type === 'Client')) {
      const { syncComplaintsFromGmail } = await import('../_lib/mis/complaint-inbox.js')
      await syncComplaintsFromGmail().catch(() => null)
    }
    const [complaints, clients] = await Promise.all([getComplaints(branchId), branchClients(branchId)])
    const list = type ? complaints.filter((c) => c.type === type) : complaints
    return res.status(200).json({ ok: true, complaints: list, clients, branchName: branch.name })
  }

  if (action === 'saveComplaints') {
    if (!misStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
    const arr = Array.isArray(body.complaints) ? body.complaints : []
    const mapped: MisComplaint[] = arr.slice(0, 5000).map((c: Record<string, unknown>) => ({
      id: String(c.id || nid('cmp')),
      code: String(c.code ?? '').slice(0, 30),
      branchId,
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
      nature: String(c.nature ?? '').slice(0, 80),
      emailId: String(c.emailId ?? '').slice(0, 80),
      fromEmail: String(c.fromEmail ?? '').slice(0, 120),
      subject: String(c.subject ?? '').slice(0, 200),
      importedAt: String(c.importedAt ?? '').slice(0, 30),
      registeredAt: String(c.registeredAt ?? '').slice(0, 40),
      mailReceivedAt: String(c.mailReceivedAt ?? c.registeredAt ?? '').slice(0, 40),
      active: c.active !== false,
    }))
    const list = await ensureComplaintCodes(mapped)
    await saveComplaints(branchId, list)
    return res.status(200).json({ ok: true, count: list.length, complaints: list })
  }

  if (action === 'sites') {
    const [branches, allClients, clients] = await Promise.all([
      getBranches(true),
      getClients(undefined, { skipRepair: true }),
      branchClients(branchId),
    ])
    const tierByGroup = resolveBusinessTiers(allClients, branches)
    const showInactive = body.showInactive === true
    const active = clients.filter((c) => c.active !== false)
    const list = withBusinessTiers(showInactive ? clients : active, branches, tierByGroup)
    const names = new Set(active.map((c) => c.name.trim().toUpperCase()).filter(Boolean))
    return res.status(200).json({
      ok: true,
      branchName: branch.name,
      sites: list,
      siteCount: active.length,
      inactiveCount: clients.length - active.length,
      clientNameCount: names.size,
    })
  }

  /** Search every branch Master Directory — HOD may copy a hit into their own book. */
  if (action === 'searchCompanyClients') {
    const q = String(body.q ?? body.query ?? '')
      .trim()
      .toLowerCase()
    if (q.length < 2) {
      return res.status(400).json({ error: 'Type at least 2 letters to search.' })
    }
    const branches = await getBranches(true)
    const all = await getClients(undefined, { skipRepair: true, branches })
    const nameOf = (id: string) => branches.find((b) => b.id === id)?.name || id
    const hits = all
      .filter((c) => c.active !== false)
      .filter((c) => {
        const hay = `${c.name || ''} ${c.location || ''} ${c.staffName || ''}`.toLowerCase()
        return hay.includes(q)
      })
      .slice(0, 80)
      .map((c) => ({
        id: c.id,
        name: c.name,
        location: c.location,
        staffName: c.staffName,
        clientEmail: c.clientEmail || '',
        sanA: c.sanA,
        sanG: c.sanG,
        sanB: c.sanB,
        sanC: c.sanC,
        branchId: c.branchId,
        branchName: nameOf(c.branchId),
        alreadyOnMyBranch: false,
      }))
    const myKeys = new Set(
      (await branchClients(branchId))
        .filter((c) => c.active !== false)
        .map(
          (c) =>
            `${String(c.name || '').trim().toUpperCase()}|${String(c.location || '').trim().toUpperCase()}`,
        ),
    )
    for (const h of hits) {
      const key = `${String(h.name || '').trim().toUpperCase()}|${String(h.location || '').trim().toUpperCase()}`
      h.alreadyOnMyBranch = h.branchId === branchId || myKeys.has(key)
    }
    return res.status(200).json({ ok: true, query: q, count: hits.length, results: hits })
  }

  if (action === 'addFromMaster') {
    if (!misStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
    if (body.confirmed !== true) {
      return res.status(400).json({
        error: 'Please reconfirm — this will change your branch Master Directory.',
        needConfirm: true,
      })
    }
    const sourceId = String(body.sourceId ?? body.clientId ?? '').trim()
    if (!sourceId) return res.status(400).json({ error: 'Pick a client from the search list.' })
    const branches = await getBranches(true)
    const all = await getClients(undefined, { skipRepair: true, branches })
    const src = all.find((c) => c.id === sourceId)
    if (!src) return res.status(404).json({ error: 'Client not found in company masters.' })
    const raw = (body.site ?? {}) as Record<string, unknown>
    const name = String(raw.name ?? src.name ?? '').trim()
    const location = String(raw.location ?? src.location ?? '').slice(0, 120)
    if (!name) return res.status(400).json({ error: 'Please enter client name.' })
    const my = await branchClients(branchId)
    const key = `${name.toUpperCase()}|${location.toUpperCase()}`
    const dup = my.find(
      (c) =>
        c.active !== false &&
        `${String(c.name || '').trim().toUpperCase()}|${String(c.location || '').trim().toUpperCase()}` ===
          key,
    )
    if (dup) {
      return res.status(400).json({
        error: 'This site is already on your branch Master Directory.',
        site: dup,
      })
    }
    const saved = await upsertClient({
      id: '',
      branchId,
      name,
      location,
      staffName: String(raw.staffName ?? src.staffName ?? '').slice(0, 120),
      clientEmail: String(raw.clientEmail ?? src.clientEmail ?? '').trim().toLowerCase().slice(0, 200),
      sanA: raw.sanA !== undefined && raw.sanA !== '' ? num(raw.sanA) : num(src.sanA),
      sanG: raw.sanG !== undefined && raw.sanG !== '' ? num(raw.sanG) : num(src.sanG),
      sanB: raw.sanB !== undefined && raw.sanB !== '' ? num(raw.sanB) : num(src.sanB),
      sanC: raw.sanC !== undefined && raw.sanC !== '' ? num(raw.sanC) : num(src.sanC),
      active: true,
    })
    if (!saved) return res.status(400).json({ error: 'Could not add site to your branch.' })
    const { noteDirectoryChange } = await import('../_lib/mis/directory-change-alert.js')
    noteDirectoryChange(
      auth.email,
      'addFromMaster',
      `${branch.name}: added “${saved.name}” @ ${saved.location || '—'} from ${
        branches.find((b) => b.id === src.branchId)?.name || src.branchId
      } (SAN A${saved.sanA}/G${saved.sanG}/B${saved.sanB}/C${saved.sanC}).`,
    )
    return res.status(200).json({ ok: true, site: saved })
  }

  if (action === 'addSite' || action === 'saveSite') {
    if (!misStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
    if (body.confirmed !== true) {
      return res.status(400).json({
        error: 'Please reconfirm — this will change your branch Master Directory.',
        needConfirm: true,
      })
    }
    const raw = (body.site ?? body.client ?? {}) as Record<string, unknown>
    const name = String(raw.name ?? '').trim()
    if (!name) return res.status(400).json({ error: 'Please enter client name.' })
    const existingId = String(raw.id ?? '').trim()
    if (existingId) {
      const branchList = await branchClients(branchId)
      if (!branchList.some((c) => c.id === existingId)) {
        return res.status(404).json({ error: 'Site not found for your branch.' })
      }
    }
    const saved = await upsertClient({
      id: existingId,
      branchId,
      name,
      location: String(raw.location ?? '').slice(0, 120),
      staffName: String(raw.staffName ?? '').slice(0, 120),
      clientEmail: String(raw.clientEmail ?? '').trim().toLowerCase().slice(0, 200),
      sanA: num(raw.sanA),
      sanG: num(raw.sanG),
      sanB: num(raw.sanB),
      sanC: num(raw.sanC),
      active: raw.active !== false,
    })
    if (!saved) return res.status(400).json({ error: existingId ? 'Could not save site.' : 'Could not add site.' })
    const { noteDirectoryChange } = await import('../_lib/mis/directory-change-alert.js')
    noteDirectoryChange(
      auth.email,
      existingId ? 'saveSite' : 'addSite',
      `${branch.name}: ${existingId ? 'updated' : 'added'} “${saved.name}” @ ${saved.location || '—'} (SAN A${saved.sanA}/G${saved.sanG}/B${saved.sanB}/C${saved.sanC}).`,
    )
    return res.status(200).json({ ok: true, site: saved })
  }

  if (action === 'toggleSite') {
    if (!misStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
    if (body.confirmed !== true) {
      return res.status(400).json({
        error: 'Please reconfirm — this will change your branch Master Directory.',
        needConfirm: true,
      })
    }
    const clientId = String(body.clientId ?? '').trim()
    const active = body.active === true
    const before = (await branchClients(branchId)).find((c) => c.id === clientId)
    const ok = await setClientActive(branchId, clientId, active)
    if (!ok) return res.status(404).json({ error: 'Site not found.' })
    const { noteDirectoryChange } = await import('../_lib/mis/directory-change-alert.js')
    noteDirectoryChange(
      auth.email,
      'toggleSite',
      `${branch.name}: ${active ? 'activated' : 'deactivated'} “${before?.name || clientId}” @ ${before?.location || '—'} (row kept in history).`,
    )
    return res.status(200).json({ ok: true, active })
  }

  if (String(action).startsWith('nightVisit')) {
    const { handleNightVisitAction } = await import('../_lib/mis/night-visit-handlers.js')
    const r = await handleNightVisitAction(action, body as Record<string, unknown>, {
      branchId: branch.id,
      userName: auth.email.split('@')[0] || auth.email,
      email: auth.email,
      portal: 'staff',
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
    const userName = auth.email.split('@')[0] || auth.email
    const bid = branch.id
    if (action === 'nightOjtBranches') {
      const r = await handleNightOjtBranches()
      return res.status(r.status).json(r.json)
    }
    if (action === 'nightOjtListReports') {
      const r = await handleNightOjtListReports(body as Record<string, unknown>, bid)
      return res.status(r.status).json(r.json)
    }
    if (action === 'nightOjtLoad') {
      const r = await handleNightOjtLoad(body as Record<string, unknown>, bid)
      return res.status(r.status).json(r.json)
    }
    if (action === 'nightOjtUploadSchedule') {
      const r = await handleNightOjtUploadSchedule(body as Record<string, unknown>, userName, bid)
      return res.status(r.status).json(r.json)
    }
    const r = await handleNightOjtSaveReport(body as Record<string, unknown>, userName, bid)
    return res.status(r.status).json(r.json)
  }

  if (
    action === 'clientVisitBoot' ||
    action === 'clientVisitFetchMobile' ||
    action === 'clientVisitSave' ||
    action === 'clientVisitReview' ||
    action === 'clientVisitPreview' ||
    action === 'clientVisitSend'
  ) {
    const {
      handleClientVisitBoot,
      handleClientVisitFetchMobile,
      handleClientVisitPreview,
      handleClientVisitReview,
      handleClientVisitSave,
      handleClientVisitSend,
    } = await import('../_lib/mis/client-visit-handlers.js')
    const userName = auth.email.split('@')[0] || auth.email
    const bid = branch.id
    if (action === 'clientVisitBoot') {
      const r = await handleClientVisitBoot(body as Record<string, unknown>, bid)
      return res.status(r.status).json(r.json)
    }
    if (action === 'clientVisitFetchMobile') {
      const r = await handleClientVisitFetchMobile(body as Record<string, unknown>, bid)
      return res.status(r.status).json(r.json)
    }
    if (action === 'clientVisitSave') {
      const r = await handleClientVisitSave(body as Record<string, unknown>, userName, bid)
      return res.status(r.status).json(r.json)
    }
    if (action === 'clientVisitReview') {
      const r = await handleClientVisitReview(body as Record<string, unknown>, userName, bid)
      return res.status(r.status).json(r.json)
    }
    if (action === 'clientVisitPreview') {
      const r = await handleClientVisitPreview(body as Record<string, unknown>, bid)
      return res.status(r.status).json(r.json)
    }
    const r = await handleClientVisitSend(body as Record<string, unknown>, userName, bid)
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
    const userName = auth.email.split('@')[0] || auth.email
    const bid = branch.id
    if (action === 'clientDoorBoot') {
      const r = await handleClientDoorBoot(body as Record<string, unknown>, bid)
      return res.status(r.status).json(r.json)
    }
    if (action === 'clientDoorPreview') {
      const r = await handleClientDoorPreview(body as Record<string, unknown>, bid)
      return res.status(r.status).json(r.json)
    }
    if (action === 'clientDoorAddEmail') {
      const r = await handleClientDoorAddEmail(body as Record<string, unknown>, bid)
      return res.status(r.status).json(r.json)
    }
    if (action === 'clientDoorEditEmail') {
      const r = await handleClientDoorEditEmail(body as Record<string, unknown>, bid)
      return res.status(r.status).json(r.json)
    }
    if (action === 'clientDoorDeleteEmail') {
      const r = await handleClientDoorDeleteEmail(body as Record<string, unknown>, bid)
      return res.status(r.status).json(r.json)
    }
    const r = await handleClientDoorSend(body as Record<string, unknown>, userName, bid)
    return res.status(r.status).json(r.json)
  }

  if (
    action === 'periodicalSurveyBoot' ||
    action === 'periodicalSurveySave' ||
    action === 'periodicalSurveySubmit' ||
    action === 'periodicalSurveyHodApprove' ||
    action === 'periodicalSurveyForwardApproval' ||
    action === 'periodicalSurveyReassessment' ||
    action === 'periodicalSurveySendToClient' ||
    action === 'periodicalSurveyGenerateAi' ||
    action === 'periodicalSurveyClientReport' ||
    action === 'periodicalSurveySendMail' ||
    action === 'hdfcSsaBoardBoot' ||
    action === 'hdfcSsaBoardRefreshAi' ||
    action === 'hdfcSsaBoardLink'
  ) {
    const {
      handlePeriodicalSurveyBoot,
      handlePeriodicalSurveyClientReport,
      handlePeriodicalSurveyGenerateAi,
      handlePeriodicalSurveyHodApprove,
      handlePeriodicalSurveyForwardApproval,
      handlePeriodicalSurveyReassessment,
      handlePeriodicalSurveySendToClient,
      handlePeriodicalSurveySave,
      handlePeriodicalSurveySendMail,
      handlePeriodicalSurveySubmit,
      handleHdfcSsaBoardBoot,
      handleHdfcSsaBoardRefreshAi,
      handleHdfcSsaBoardLink,
    } = await import('../_lib/mis/periodical-survey-handlers.js')
    const userName = auth.email.split('@')[0] || auth.email
    const bid = branch.id
    if (action === 'periodicalSurveyBoot') {
      const r = await handlePeriodicalSurveyBoot(body as Record<string, unknown>, bid)
      return res.status(r.status).json(r.json)
    }
    if (action === 'periodicalSurveySave') {
      const r = await handlePeriodicalSurveySave(body as Record<string, unknown>, userName, bid)
      return res.status(r.status).json(r.json)
    }
    if (action === 'periodicalSurveySubmit') {
      const r = await handlePeriodicalSurveySubmit(body as Record<string, unknown>, userName, auth.email, bid)
      return res.status(r.status).json(r.json)
    }
    if (action === 'periodicalSurveyHodApprove') {
      const r = await handlePeriodicalSurveyHodApprove(body as Record<string, unknown>, userName, auth.email, bid)
      return res.status(r.status).json(r.json)
    }
    if (action === 'periodicalSurveyForwardApproval') {
      const r = await handlePeriodicalSurveyForwardApproval(body as Record<string, unknown>, userName, auth.email, bid)
      return res.status(r.status).json(r.json)
    }
    if (action === 'periodicalSurveyReassessment') {
      const r = await handlePeriodicalSurveyReassessment(body as Record<string, unknown>, userName, auth.email, bid)
      return res.status(r.status).json(r.json)
    }
    if (action === 'periodicalSurveySendToClient') {
      const r = await handlePeriodicalSurveySendToClient(body as Record<string, unknown>, userName, auth.email, bid)
      return res.status(r.status).json(r.json)
    }
    if (action === 'periodicalSurveyGenerateAi') {
      const r = await handlePeriodicalSurveyGenerateAi(body as Record<string, unknown>)
      return res.status(r.status).json(r.json)
    }
    if (action === 'periodicalSurveyClientReport') {
      const r = await handlePeriodicalSurveyClientReport(body as Record<string, unknown>)
      return res.status(r.status).json(r.json)
    }
    if (action === 'hdfcSsaBoardBoot') {
      const r = await handleHdfcSsaBoardBoot(body as Record<string, unknown>, bid)
      return res.status(r.status).json(r.json)
    }
    if (action === 'hdfcSsaBoardRefreshAi') {
      const r = await handleHdfcSsaBoardRefreshAi(body as Record<string, unknown>, bid)
      return res.status(r.status).json(r.json)
    }
    if (action === 'hdfcSsaBoardLink') {
      const r = await handleHdfcSsaBoardLink()
      return res.status(r.status).json(r.json)
    }
    const r = await handlePeriodicalSurveySendMail(body as Record<string, unknown>)
    return res.status(r.status).json(r.json)
  }

  if (
    action === 'listIncidentReports' ||
    action === 'getIncidentReport' ||
    action === 'saveIncidentReport' ||
    action === 'previewIncidentReport' ||
    action === 'submitIncidentReport' ||
    action === 'uploadIncidentAttachment' ||
    action === 'removeIncidentAttachment' ||
    action === 'suggestIncidentRecurrence' ||
    action === 'sendIncidentTestDraft'
  ) {
    const { handleIncidentReportAction } = await import('../_lib/mis/incident-report-handlers.js')
    const r = await handleIncidentReportAction(action, body as Record<string, unknown>, {
      branchId: branch.id,
      branchName: branch.name,
      email: auth.email,
    })
    if (!r) return res.status(400).json({ error: 'Unknown action.' })
    return res.status(r.status).json(r.json)
  }

  return res.status(400).json({ error: 'Unknown action.' })
}
