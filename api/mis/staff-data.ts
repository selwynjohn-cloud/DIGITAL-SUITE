import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import {
  docPresent,
  ensureComplaintCodes,
  getActiveBranch,
  getBranches,
  getClients,
  getCollections,
  getComplaints,
  getDutyDates,
  getDutyIncidents,
  getGuardDocs,
  getReport,
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
import { supportUserBlocksMisSubmit } from '../_lib/user-team.js'
import {
  buildBranchMobileStats,
  clientNamesForBranch,
  guardCompliancePct,
  incidentMatchesBranch,
  visitMatchesBranch,
} from '../_lib/mis/branch-mobile-stats.js'
import { buildVisitAnalysis, syncMobileVisits } from '../_lib/mis/mobile-visits.js'
import { dutyCounts } from '../_lib/mis/work360-duty.js'
import { deployPct, filterActiveReportRows, reportDeployTotals, rowDeployTotals } from '../_lib/mis/deploy-math.js'
import { misTodayIst, misWeekStartMonday, misDeadlineUtc } from '../_lib/mis/dates.js'
import { buildBranchAckStats } from '../_lib/mis/ack-stats.js'
import { getSlaIssueRegister, summarizeSlaPending } from '../_lib/mis/sla-issue.js'

async function authStaff(sessionToken: string, branchId: string) {
  const session = await verifyAppSession(sessionToken, 'mis-report')
  if (!session) {
    return { error: 'Your sign-in expired. Please enter your branch password again.' } as const
  }
  let id = String(branchId ?? '').trim()
  if (session.role === 'staff' && session.branchId) {
    if (id && id !== session.branchId) {
      return {
        error:
          'This sign-in is for a different branch. Sign out, pick your branch, and sign in again.',
      } as const
    }
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
  const users = await getUsers()
  const supportBlock = supportUserBlocksMisSubmit(users, session.email)
  if (supportBlock) return { error: supportBlock } as const
  return { branch: b, email: session.email } as const
}

function weekCollected(c: MisCollection): number {
  return num(c.mon) + num(c.tue) + num(c.wed) + num(c.thu) + num(c.fri) + num(c.sat)
}

function collectionDso(outstanding: number, monthlyBilling: number) {
  return monthlyBilling > 0 ? Math.round((outstanding / monthlyBilling) * 30) : 0
}

async function branchClients(branchId: string): Promise<MisClient[]> {
  return getClients(branchId)
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
    return res.status(200).json({ ok: true, branch: branch.name, email: auth.email })
  }

  if (action === 'dashboard') {
    const dateFor = String(body.date ?? misTodayIst())
    const weekStart = misWeekStartMonday(dateFor)
    const [clients, report, mobile, compliance, hr, complaints, cols, guardDocs, slaRows] = await Promise.all([
      branchClients(branchId),
      getReport(branchId, dateFor),
      buildBranchMobileStats(branchId, branch.name, dateFor),
      guardCompliancePct(branchId),
      buildBranchAckStats(branchId, branch.name, dateFor),
      getComplaints(branchId),
      getCollections(weekStart),
      getGuardDocs(branchId),
      getSlaIssueRegister(branchId),
    ])
    const col = cols.find((c) => c.branchId === branchId)
    const collected = col ? weekCollected(col) : 0
    const openComplaints = complaints.filter((c) => c.active !== false && c.status !== 'Closed').length
    const closedComplaints = complaints.filter((c) => c.active !== false && c.status === 'Closed').length
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
    if (report) {
      for (const row of filterActiveReportRows(branchId, report.rows as Record<string, unknown>[], clients)) {
        const rt = rowDeployTotals(row)
        if (rt.vac > 0) {
          vacantRows.push({
            client: String(row.clientName ?? ''),
            unit: String(row.location ?? ''),
            vac: rt.vac,
            fill: deployPct(rt.dep, rt.san),
          })
        }
      }
      vacantRows.sort((a, b) => b.vac - a.vac)
    }
    const activeGuards = guardDocs.filter(guardRecordEligible).length
    let pvc = 0,
      medical = 0,
      training = 0
    for (const d of guardDocs.filter(guardRecordEligible)) {
      if (docPresent(d.pvc)) pvc++
      if (docPresent(d.medical)) medical++
      if (docPresent(d.training)) training++
    }
    const sla = summarizeSlaPending(branchId, branch.name, slaRows)
    const lateCases = Number(report?.summary?.lateStartCases) || mobile.lateStartCases
    const outCases = Number(report?.summary?.outOfPostCases) || mobile.outOfPostCases
    const timelyPct = totals.san ? Math.max(0, 100 - Math.round((lateCases * 100) / totals.san) - Math.round((outCases * 100) / totals.san)) : 0
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
        pvcCount: pvc,
        medicalCount: medical,
        trainingCount: training,
        pvcPct: activeGuards ? Math.round((pvc * 100) / activeGuards) : 0,
        medicalPct: activeGuards ? Math.round((medical * 100) / activeGuards) : 0,
        trainingPct: activeGuards ? Math.round((training * 100) / activeGuards) : 0,
      },
      hr: { resignation: hr.resigned, recruitment: hr.recruitmentOpen },
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
      summary: report?.summary ?? null,
      vacantRows: vacantRows.slice(0, 15),
      sla,
      dutyStart: { timelyPct, lateCases, outCases },
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
    const clients = await branchClients(branchId)
    const names = Array.from(new Set(clients.filter((c) => c.active !== false).map((c) => c.name).filter(Boolean))).sort()
    return res.status(200).json({ ok: true, clients: names, branchName: branch.name })
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
    if (action === 'syncVisits') {
      sync = await syncMobileVisits(date, { includeVisits: true, includeDuty: false, includeAttendance: false })
      if (!sync.ok) return res.status(502).json({ error: sync.error || 'Sync failed', sync })
    }
    const clients = await branchClients(branchId)
    const allVisits = await getVisits(date)
    const visits = filterVisits(allVisits, branch.name, clients)
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
    const incidents = typeFilter ? filtered.filter((i) => i.type === typeFilter) : filtered
    const counts = dutyCounts(incidents)
    const dates = await getDutyDates()
    return res.status(200).json({
      ok: true,
      date,
      branchName: branch.name,
      incidents,
      counts,
      dates,
      sync,
    })
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
    } = await import('../_lib/mis/collection-import.js')
    let buf: Buffer
    try {
      buf = decodeUploadBase64(String(body.data ?? ''))
    } catch {
      return res.status(400).json({ error: 'Could not read the uploaded file.' })
    }
    const branches = await getBranches(true)
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

  if (action === 'sites') {
    const clients = await branchClients(branchId)
    const showInactive = body.showInactive === true
    const active = clients.filter((c) => c.active !== false)
    const list = showInactive ? clients : active
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

  if (action === 'addSite' || action === 'saveSite') {
    if (!misStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
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
      sanA: num(raw.sanA),
      sanG: num(raw.sanG),
      sanB: num(raw.sanB),
      sanC: num(raw.sanC),
      active: raw.active !== false,
    })
    if (!saved) return res.status(400).json({ error: existingId ? 'Could not save site.' : 'Could not add site.' })
    return res.status(200).json({ ok: true, site: saved })
  }

  if (action === 'toggleSite') {
    if (!misStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
    const clientId = String(body.clientId ?? '').trim()
    const active = body.active === true
    const ok = await setClientActive(branchId, clientId, active)
    if (!ok) return res.status(404).json({ error: 'Site not found.' })
    return res.status(200).json({ ok: true, active })
  }

  return res.status(400).json({ error: 'Unknown action.' })
}
