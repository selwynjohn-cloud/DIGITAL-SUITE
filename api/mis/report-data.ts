import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  collectGuardRenewals,
  normalizeGuardDocOnSave,
} from '../_lib/mis/guard-renewal.js'
import { normaliseEmail } from '../_lib/auth.js'
import { verifyAppSession } from '../_lib/app-session.js'
import { misBranchDisplayName } from '../_lib/mis/branch-labels.js'
import {
  getBranches,
  getMisReportBranches,
  isMisReportingBranch,
  getActiveBranch,
  getClients,
  getCollections,
  getComplaints,
  getGuardDocs,
  getLastReport,
  getReport,
  repairFalseVacancyFromCarriedAbsent,
  getUsers,
  misStorageOk,
  nid,
  num,
  repairAllBranchClients,
  saveCollections,
  saveGuardDocs,
  saveClients,
  setClientActive,
  submitReport,
  saveDraftReport,
  upsertClient,
  type MisClient,
  type MisDeployRow,
  type MisGuardDoc,
  type MisReport,
  type MisCollection,
} from '../_lib/mis/store.js'
import { supportUserBlocksMisSubmit } from '../_lib/user-team.js'
import { normalizeDeployRow, shiftDeploy, reportShiftOtTotals, reportDeployTotals } from '../_lib/mis/deploy-math.js'
import { filterDeployRowsForHiTechKrc, filterDeployRowsForVizag, filterDeployRowsForKakinada } from '../_lib/mis/client-branch.js'
import { resolveBusinessTiers, withBusinessTiers } from '../_lib/mis/client-rules.js'
import { sendBranchSubmitAck, sendMisLateConsolidatedAck } from '../_lib/mis/digest.js'
import { misTodayIst, isOnTimeMisSubmission, misWeekStartMonday } from '../_lib/mis/dates.js'
import { enrichBranchSummary, mobileSyncNote } from '../_lib/mis/branch-mobile-stats.js'
import { missingMisSummaryFields, normaliseMisSummary } from '../_lib/mis/summary-complete.js'
import { mergePreviousSummary, weeklyCollectionPct, weekCollectedSum, branchMonthCollectedLacs, consolidatedCollectionPct } from '../_lib/mis/summary-autofill.js'
import { normalizeCollectionRow } from '../_lib/mis/collection-import.js'
import { normalizeToLacs } from '../_lib/inr-money.js'
import { syncGuardsComplaintsToMis } from '../_lib/mis/guards-complaint-sync.js'
import { syncMobileVisits } from '../_lib/mis/mobile-visits.js'
import {
  normaliseManpowerShortage,
  shortageWithoutRelievers,
} from '../_lib/mis/manpower-shortage.js'

export const config = { maxDuration: 120 }

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    p.then((v) => v).catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ])
}

function weekCollected(c: MisCollection): number {
  return weekCollectedSum(c)
}

async function branchCollectionSnapshot(branchId: string, dateFor: string) {
  const weekStart = misWeekStartMonday(dateFor)
  const cols = await getCollections(weekStart)
  const raw =
    cols.find((c) => c.branchId === branchId) ||
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
  const row = normalizeCollectionRow(raw)
  const collected = weekCollected(row)
  const collectionPct = weeklyCollectionPct(row, collected)
  const mtdCollected = await branchMonthCollectedLacs(branchId, dateFor)
  const mtdExceptThisWeek = Math.max(0, Math.round((mtdCollected - collected) * 100) / 100)
  const consolidatedPct = consolidatedCollectionPct(row, collected, mtdCollected)
  return {
    weekStart,
    collection: { ...row, mtdCollected, mtdExceptThisWeek },
    collected,
    collectionPct,
    consolidatedPct,
    mtdCollected,
    mtdExceptThisWeek,
  }
}

async function authBranchReport(sessionToken: string, branchId: string) {
  const session = await verifyAppSession(sessionToken, 'mis-report')
  if (!session) {
    return { error: 'Your sign-in expired. Please enter your email and PIN again.' } as const
  }
  let id = String(branchId ?? '').trim()
  if (session.role === 'staff' && session.branchId) {
    if (id && id !== session.branchId) {
      return {
        error:
          'This sign-in is for a different branch. Sign out, pick Bangalore, and sign in again.',
      } as const
    }
    id = session.branchId
  }
  if (!id) {
    return { error: 'Please select your branch from the list, then tap Open Today\'s Report.' } as const
  }
  const b = await getActiveBranch(id)
  if (!b) {
    const exists = (await getBranches()).find((x) => x.id === id)
    if (exists && exists.active === false) {
      return {
        error:
          'This branch is deactivated. Only activated branch teams can access the portal. Contact management.',
      } as const
    }
    return { error: 'Branch not found. Please refresh the page and select your branch again.' } as const
  }
  if (!isMisReportingBranch(b)) {
    return {
      error:
        'This unit does not submit Daily MIS (operations only). Training / Recruitment use their own portals.',
    } as const
  }
  const users = await getUsers()
  const supportBlock = supportUserBlocksMisSubmit(users, session.email)
  if (supportBlock) {
    return { error: supportBlock } as const
  }
  return { branch: b, email: session.email } as const
}

async function syncSanctionedPostsToMaster(branchId: string, rows: MisDeployRow[]): Promise<number> {
  const all = await getClients(undefined, { skipRepair: true })
  let updated = 0
  let changed = false
  for (const row of rows) {
    const id = String(row.clientId ?? '').trim()
    if (!id) continue
    const idx = all.findIndex((x) => x.id === id && x.branchId === branchId)
    if (idx < 0) continue
    const c = all[idx]
    const sanA = num(row.sanA)
    const sanG = num(row.sanG)
    const sanB = num(row.sanB)
    const sanC = num(row.sanC)
    if (num(c.sanA) === sanA && num(c.sanG) === sanG && num(c.sanB) === sanB && num(c.sanC) === sanC) continue
    all[idx] = { ...c, sanA, sanG, sanB, sanC }
    changed = true
    updated++
  }
  if (changed) {
    const branchRows = all.filter((c) => c.branchId === branchId)
    await saveClients(branchRows, { branchOnly: branchId, force: true })
  }
  return updated
}

function deploySiteKey(row: { clientName?: string; location?: string }): string {
  return `${String(row.clientName ?? '').trim()}|${String(row.location ?? '').trim()}`.toUpperCase()
}

/** Keep every Master Directory site; overlay today's draft Absent/OT (never drop sites). */
function mergeDeployDraftOntoMaster(masterRows: MisDeployRow[], draftRows: MisDeployRow[]): MisDeployRow[] {
  if (!draftRows.length) return masterRows
  const byId = new Map(draftRows.map((r) => [String(r.clientId || ''), r]))
  const bySite = new Map(draftRows.map((r) => [deploySiteKey(r), r]))
  const used = new Set<string>()
  const merged = masterRows.map((m) => {
    const d = (m.clientId && byId.get(m.clientId)) || bySite.get(deploySiteKey(m))
    if (!d) return m
    used.add(String(d.clientId || '') || deploySiteKey(d))
    const sanA = num(d.sanA)
    const sanG = num(d.sanG)
    const sanB = num(d.sanB)
    const sanC = num(d.sanC)
    const absA = num(d.absA)
    const otA = num(d.otA)
    const absG = num(d.absG)
    const otG = num(d.otG)
    const absB = num(d.absB)
    const otB = num(d.otB)
    const absC = num(d.absC)
    const otC = num(d.otC)
    return {
      ...m,
      staffName: String(d.staffName || m.staffName || '').slice(0, 120),
      sanA,
      depA: shiftDeploy(sanA, absA, otA).dep,
      absA,
      otA,
      sanG,
      depG: shiftDeploy(sanG, absG, otG).dep,
      absG,
      otG,
      sanB,
      depB: shiftDeploy(sanB, absB, otB).dep,
      absB,
      otB,
      sanC,
      depC: shiftDeploy(sanC, absC, otC).dep,
      absC,
      otC,
    }
  })
  for (const d of draftRows) {
    const id = String(d.clientId || '')
    const already = merged.some(
      (m) => (id && m.clientId === id) || deploySiteKey(m) === deploySiteKey(d),
    )
    if (already) continue
    merged.push(normalizeDeployRow({ ...d }) as MisDeployRow)
  }
  return merged
}

function rowHasDeployEntry(row: MisDeployRow | undefined): boolean {
  if (!row) return false
  return (
    num(row.absA) > 0 ||
    num(row.otA) > 0 ||
    num(row.absG) > 0 ||
    num(row.otG) > 0 ||
    num(row.absB) > 0 ||
    num(row.otB) > 0 ||
    num(row.absC) > 0 ||
    num(row.otC) > 0
  )
}

function pickPrevDeployRow(
  clientId: string,
  clientName: string,
  location: string,
  existing: MisReport | null,
  last: MisReport | null,
): { row: MisDeployRow | null; fromLast: boolean } {
  const siteKey = deploySiteKey({ clientName, location })
  const existingRow =
    existing?.rows?.find((r) => r.clientId === clientId) ??
    existing?.rows?.find((r) => deploySiteKey(r) === siteKey) ??
    null
  if (existing?.submittedAt && existingRow) return { row: existingRow, fromLast: false }
  if (existingRow && rowHasDeployEntry(existingRow)) return { row: existingRow, fromLast: false }

  if (last) {
    const lastRow =
      last.rows?.find((r) => r.clientId === clientId) ??
      last.rows?.find((r) => deploySiteKey(r) === siteKey) ??
      null
    if (lastRow) return { row: lastRow, fromLast: true }
  }

  return { row: null, fromLast: false }
}

function deploySanFromPrevious(masterSan: number, prev: MisDeployRow | null, shift: 'A' | 'G' | 'B' | 'C'): number {
  // Prefer last day's sanctioned when HOD changed it (remember previous data).
  if (prev) {
    const key = `san${shift}` as keyof MisDeployRow
    if (Object.prototype.hasOwnProperty.call(prev, key)) {
      return num(prev[key])
    }
  }
  return masterSan
}

function deployCarryNoteText(
  existing: MisReport | null,
  last: MisReport | null,
  deployCarriedFromLast: boolean,
): string {
  if (existing?.submittedAt) {
    return 'Today\'s report is already submitted — showing saved data.'
  }
  if (existing && !existing.submittedAt && existing.rows?.some(rowHasDeployEntry)) {
    return 'Today\'s saved draft loaded — update Absent/OT and continue.'
  }
  if (deployCarriedFromLast && last?.dateFor) {
    return `Step 1 pre-filled from your last entry (${last.dateFor}) — Sanctioned remembered. Absent and OT start at zero — enter today's figures only.`
  }
  if (last?.dateFor) {
    return `Summary and your name remember your last entry (${last.dateFor}). Step 1 deployment loads below.`
  }
  return 'Enter Absent and OT for each site.'
}

async function buildReportRowsContext(branchId: string, dateFor: string, quick: boolean) {
  // skipRepair: daily MIS must not rewrite the full client master on every step (Hyd-B timeout).
  let clients = await getClients(branchId, { skipRepair: true })
  if (!quick && !clients.filter((c) => c.active !== false).length) {
    await Promise.race([
      repairAllBranchClients().catch(() => null),
      new Promise<void>((resolve) => setTimeout(resolve, 2500)),
    ])
    clients = await getClients(branchId, { skipRepair: true })
  }
  let existing = await getReport(branchId, dateFor)
  if (existing) existing = await repairFalseVacancyFromCarriedAbsent(existing)
  const last = await getLastReport(branchId, dateFor)
  const mergedBase = mergePreviousSummary(existing?.summary ?? null, last?.summary ?? null)
  const carriedKeys: string[] = []
  if (last?.summary && !existing?.summary) {
    for (const [k, v] of Object.entries(mergedBase)) {
      if (String(v ?? '').trim()) carriedKeys.push(k)
    }
  }
  let deployCarriedFromLast = false
  const rows: MisDeployRow[] = clients
    .filter((c) => c.active !== false)
    .map((c) => {
      const picked = pickPrevDeployRow(c.id, c.name, c.location, existing, last)
      const p = picked.row
      if (picked.fromLast) deployCarriedFromLast = true
      const absA = picked.fromLast ? 0 : p ? p.absA : 0
      const otA = picked.fromLast ? 0 : p ? p.otA : 0
      const absG = picked.fromLast ? 0 : p ? p.absG : 0
      const otG = picked.fromLast ? 0 : p ? p.otG : 0
      const absB = picked.fromLast ? 0 : p ? p.absB : 0
      const otB = picked.fromLast ? 0 : p ? p.otB : 0
      const absC = picked.fromLast ? 0 : p ? p.absC : 0
      const otC = picked.fromLast ? 0 : p ? p.otC : 0
      const sanA = deploySanFromPrevious(num(c.sanA), picked.fromLast ? p : null, 'A')
      const sanG = deploySanFromPrevious(num(c.sanG), picked.fromLast ? p : null, 'G')
      const sanB = deploySanFromPrevious(num(c.sanB), picked.fromLast ? p : null, 'B')
      const sanC = deploySanFromPrevious(num(c.sanC), picked.fromLast ? p : null, 'C')
      return {
        clientId: c.id,
        clientName: c.name,
        location: c.location,
        staffName: p?.staffName || c.staffName,
        sanA, depA: shiftDeploy(sanA, absA, otA).dep, absA, otA,
        sanG, depG: shiftDeploy(sanG, absG, otG).dep, absG, otG,
        sanB, depB: shiftDeploy(sanB, absB, otB).dep, absB, otB,
        sanC, depC: shiftDeploy(sanC, absC, otC).dep, absC, otC,
      }
    })
  return { clients, existing, last, mergedBase, carriedKeys, rows, deployCarriedFromLast }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = (req.body ?? {}) as Record<string, unknown>
  const action = String(body.action ?? '')

  if (action === 'branches') {
    const branches = await getMisReportBranches(true)
    return res.status(200).json({
      ok: true,
      branches: branches.map((b) => ({
        id: b.id,
        name: b.name,
        displayName: misBranchDisplayName(b.id, b.name),
      })),
    })
  }

  const branchId = String(body.branchId ?? '')
  const sessionToken = String(body.sessionToken ?? '')
  const auth = await authBranchReport(sessionToken, branchId)
  if ('error' in auth) return res.status(401).json({ error: auth.error })
  const branch = auth.branch

  if (action === 'guardDocs') {
    const docs = await getGuardDocs(branchId)
    return res.status(200).json({ ok: true, branchName: branch.name, docs })
  }

  if (action === 'complianceReportHtml' || action === 'sendComplianceReportMail') {
    const {
      buildPvcMcReportHtml,
      guardsForComplianceReport,
      parseShareEmails,
      sendPvcMcReportMail,
    } = await import('../_lib/mis/client-facing-reports.js')
    const {
      branchSanctionedPosts,
      guardComplianceCounts,
    } = await import('../_lib/mis/guard-compliance-math.js')
    const { misTodayIst } = await import('../_lib/mis/dates.js')
    const date = String(body.date ?? misTodayIst())
    const [docs, clients, report] = await Promise.all([
      getGuardDocs(branchId),
      getClients(branchId),
      getReport(branchId, date),
    ])
    const posts = branchSanctionedPosts(branchId, report, clients)
    const counts = guardComplianceCounts(docs, posts)
    const strength = counts.registered || posts
    const payload = {
      date,
      branchName: branch.name,
      rows: [
        {
          branch: branch.name,
          strength,
          pvc: counts.pvc,
          medical: counts.medical,
          training: counts.training,
        },
      ],
      totals: {
        strength,
        pvc: counts.pvc,
        medical: counts.medical,
        training: counts.training,
      },
      guards: guardsForComplianceReport(docs),
    }
    if (action === 'complianceReportHtml') {
      return res.status(200).json({ ok: true, html: buildPvcMcReportHtml(payload) })
    }
    const to = parseShareEmails(body.to)
    const mail = await sendPvcMcReportMail(to, payload)
    if (!mail.ok) return res.status(502).json({ error: mail.error })
    return res.status(200).json({ ok: true, to: mail.to })
  }

  if (action === 'guardRenewals') {
    const docs = await getGuardDocs(branchId)
    const renewals = collectGuardRenewals(docs, { withinDays: 30 })
    return res.status(200).json({ ok: true, branchName: branch.name, renewals })
  }

  if (action === 'saveGuardDocs') {
    if (!misStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
    const arr = Array.isArray(body.docs) ? body.docs : []
    const list: MisGuardDoc[] = arr.slice(0, 20000).map((g: Record<string, unknown>) =>
      normalizeGuardDocOnSave({
      id: String(g.id || `gd${Date.now()}`),
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

  if (action === 'clientsList') {
    const [branches, allClients, list] = await Promise.all([
      getBranches(true),
      getClients(undefined, { skipRepair: true }),
      getClients(branchId, { skipRepair: true }),
    ])
    const tierByGroup = resolveBusinessTiers(allClients, branches)
    return res.status(200).json({ ok: true, clients: withBusinessTiers(list, branches, tierByGroup) })
  }

  if (action === 'saveClient') {
    if (!misStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
    if (body.confirmed !== true) {
      return res.status(400).json({
        error: 'Please confirm you intentionally want to change the Master Directory client list.',
        needConfirm: true,
      })
    }
    const raw = (body.client ?? {}) as Record<string, unknown>
    const existingId = String(raw.id ?? '').trim()
    if (existingId) {
      const branchClients = await getClients(branchId, { skipRepair: true })
      if (!branchClients.some((c) => c.id === existingId)) {
        return res.status(404).json({ error: 'Site not found for your branch.' })
      }
    }
    const saved = await upsertClient({
      id: existingId,
      branchId,
      name: String(raw.name ?? ''),
      location: String(raw.location ?? ''),
      staffName: String(raw.staffName ?? ''),
      sanA: num(raw.sanA),
      sanG: num(raw.sanG),
      sanB: num(raw.sanB),
      sanC: num(raw.sanC),
      slaDayVisit: String(raw.slaDayVisit ?? ''),
      slaNightCheck: String(raw.slaNightCheck ?? ''),
      uniformIssued: String(raw.uniformIssued ?? ''),
      rainGearIssued: String(raw.rainGearIssued ?? ''),
      equipmentIssued: String(raw.equipmentIssued ?? ''),
      starRating: num(raw.starRating),
      highValue: raw.highValue === true,
      active: raw.active !== false,
    })
    if (!saved) return res.status(400).json({ error: 'Could not save client.' })
    const { noteDirectoryChange } = await import('../_lib/mis/directory-change-alert.js')
    noteDirectoryChange(
      auth.email,
      existingId ? 'saveSite' : 'addSite',
      `Daily MIS / portal: ${existingId ? 'updated' : 'added'} “${saved.name}” @ ${saved.location || '—'} (confirmed).`,
    )
    return res.status(200).json({ ok: true, client: saved })
  }

  if (action === 'toggleClient') {
    if (!misStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
    if (body.confirmed !== true) {
      return res.status(400).json({
        error: 'Please confirm you intentionally want to change the Master Directory client list.',
        needConfirm: true,
      })
    }
    const clientId = String(body.clientId ?? '').trim()
    const active = body.active === true
    const ok = await setClientActive(branchId, clientId, active)
    if (!ok) return res.status(404).json({ error: 'Client not found.' })
    const { noteDirectoryChange } = await import('../_lib/mis/directory-change-alert.js')
    noteDirectoryChange(
      auth.email,
      'toggleSite',
      `Daily MIS / portal: ${active ? 'activated' : 'deactivated'} client ${clientId} (confirmed).`,
    )
    return res.status(200).json({ ok: true, active })
  }

  if (action === 'quickOpen' || action === 'enrichSummary' || action === 'login') {
    const dateFor = String(body.dateFor ?? misTodayIst())
    const today = misTodayIst()
    const quick = action === 'quickOpen'
    const enrichOnly = action === 'enrichSummary'

    if (quick) {
      const ctx = await buildReportRowsContext(branchId, dateFor, true)
      let collSnap = await branchCollectionSnapshot(branchId, dateFor).catch(() => ({
        weekStart: misWeekStartMonday(dateFor),
        collection: null,
        collected: 0,
        collectionPct: '',
      }))
      if (!ctx.mergedBase.weeklyCollectionPct && collSnap.collectionPct) {
        ctx.mergedBase.weeklyCollectionPct = collSnap.collectionPct
        ctx.mergedBase.collectionPct = collSnap.collectionPct
      }
      let hasDraft = Boolean(ctx.existing && !ctx.existing.submittedAt)
      // Never replace the full Master Directory with a shorter draft (Hyd-B 591 vs 862).
      // Hi-Tech City: strip non-KRC sites that were wrongly saved on old drafts.
      const reportBranches = await getBranches(true)
      const draftOnly =
        hasDraft && ctx.existing?.rows?.length
          ? filterDeployRowsForKakinada(
              filterDeployRowsForVizag(
                filterDeployRowsForHiTechKrc(
                  ctx.existing.rows.map((r) => normalizeDeployRow({ ...r }) as MisDeployRow),
                  branchId,
                  reportBranches,
                ),
                branchId,
                reportBranches,
              ),
              branchId,
              reportBranches,
            )
          : []
      const draftRows =
        draftOnly.length > 0 ? mergeDeployDraftOntoMaster(ctx.rows, draftOnly) : ctx.rows
      if (draftOnly.length > 0 && draftOnly.length < ctx.rows.length) {
        // Rewrite incomplete draft so later steps also see the full site list.
        void saveDraftReport({
          id: `${branchId}:${dateFor}`,
          branchId,
          branchName: branch.name,
          dateFor,
          submittedAt: '',
          submittedBy: String(ctx.existing?.submittedBy ?? ctx.last?.submittedBy ?? '').trim(),
          submitterEmail: normaliseEmail(auth.email),
          rows: draftRows,
          summary: normaliseMisSummary(
            ctx.existing?.summary
              ? { ...ctx.mergedBase, ...normaliseMisSummary(ctx.existing.summary) }
              : ctx.mergedBase,
          ),
          manpowerShortage: ctx.existing?.manpowerShortage,
        })
        hasDraft = true
      }
      const draftSummary =
        hasDraft && ctx.existing?.summary
          ? { ...ctx.mergedBase, ...normaliseMisSummary(ctx.existing.summary) }
          : ctx.mergedBase
      if (
        ctx.deployCarriedFromLast &&
        !ctx.existing?.submittedAt &&
        !(ctx.existing?.rows?.length && ctx.existing.rows.some(rowHasDeployEntry))
      ) {
        // Large branches (e.g. Hyderabad-B ~170 sites): don't block page open on Redis write.
        const draftPayload = {
          id: `${branchId}:${dateFor}`,
          branchId,
          branchName: branch.name,
          dateFor,
          submittedAt: '',
          submittedBy: String(ctx.existing?.submittedBy ?? ctx.last?.submittedBy ?? '').trim(),
          submitterEmail: normaliseEmail(auth.email),
          rows: ctx.rows,
          summary: normaliseMisSummary(ctx.mergedBase),
        }
        // Never wait on Redis draft write — Kochi / other branches were stuck on Step 4 loading.
        void saveDraftReport(draftPayload)
        hasDraft = true
      }
      const includeRows = body.includeRows !== false
      const deployTot = reportDeployTotals(draftRows as Record<string, unknown>[], branchId)
      const defaultShortage = shortageWithoutRelievers(deployTot.abs, deployTot.ot)
      const manpowerShortage = normaliseManpowerShortage(
        ctx.existing?.manpowerShortage ??
          (defaultShortage > 0 ? ctx.last?.manpowerShortage : undefined),
        { defaultTotal: defaultShortage },
      )
      return res.status(200).json({
        ok: true,
        quick: true,
        branch: { id: branch.id, name: branch.name },
        dateFor,
        rows: includeRows ? draftRows : [],
        rowCount: draftRows.length,
        summary: draftSummary,
        manpowerShortage,
        shortageWithoutRelievers: defaultShortage,
        deployAbs: deployTot.abs,
        deployOt: deployTot.ot,
        mobileStats: { lateStartCases: 0, outOfPostCases: 0, dayVisits: 0, nightChecks: 0, trainedSites: 0, visitTotal: 0 },
        mobileFilled: false,
        mobileNote: 'Form opened — auto-fill data loading in background…',
        autoFilled: [],
        fieldMeta: {},
        alreadySubmitted: Boolean(ctx.existing?.submittedAt),
        submittedBy: String(ctx.existing?.submittedBy ?? ctx.last?.submittedBy ?? '').trim(),
        hasDraft,
        carriedFromDate: ctx.last?.dateFor ?? '',
        deployCarryNote: deployCarryNoteText(ctx.existing, ctx.last, ctx.deployCarriedFromLast),
        summaryCarryNote: ctx.last
          ? `Summary fields pre-filled from ${ctx.last.dateFor} where blank today — edit as needed.`
          : '',
        masterClients: ctx.clients.length,
        weekStart: collSnap.weekStart,
        collection: collSnap.collection,
        collectionCollected: collSnap.collected,
      })
    }

    // Login auto-syncs Work360 unless autoSync:false. enrichSummary syncs only when autoSync:true (Refresh button).
    const autoSync =
      dateFor === today &&
      Boolean(process.env.WORK360_API_BASE_URL?.trim()) &&
      (enrichOnly ? body.autoSync === true : body.autoSync !== false)

    let mobileSynced = false
    if (autoSync) {
      const syncPromise = Promise.all([
        syncMobileVisits(dateFor, { includeVisits: true, includeDuty: true }).catch(() => null),
        syncGuardsComplaintsToMis().catch(() => null),
      ]).then(([sync]) => {
        mobileSynced = Boolean(sync?.ok)
        return sync
      })
      await Promise.race([syncPromise, new Promise<void>((resolve) => setTimeout(resolve, 5000))])
    }

    const ctx = await buildReportRowsContext(branchId, dateFor, enrichOnly)

    const enriched = await withTimeout(
      enrichBranchSummary(branchId, branch.name, dateFor, ctx.mergedBase, {
        // Skip recruitment HR pull on Step 4 — it timed out large branches (Kochi / Kerala).
        lite: body.lite !== false,
        carriedKeys: ctx.carriedKeys,
        forceSystem: body.forceSystem === true,
      }),
      18_000,
    )
    if (!enriched) {
      const collSnapFast = await branchCollectionSnapshot(branchId, dateFor).catch(() => ({
        weekStart: misWeekStartMonday(dateFor),
        collection: null,
        collected: 0,
        collectionPct: '',
      }))
      return res.status(200).json({
        ok: true,
        slow: true,
        branch: { id: branch.id, name: branch.name },
        dateFor,
        rows: enrichOnly ? undefined : ctx.rows,
        summary: ctx.mergedBase,
        mobileStats: {
          lateStartCases: 0,
          outOfPostCases: 0,
          dayVisits: 0,
          nightChecks: 0,
          trainedSites: 0,
          visitTotal: 0,
        },
        mobileFilled: false,
        mobileNote:
          'System refresh is slow — figures from Step 3 are shown. You can submit now.',
        autoFilled: [],
        fieldMeta: {},
        alreadySubmitted: Boolean(ctx.existing?.submittedAt),
        submittedBy: String(ctx.existing?.submittedBy ?? ctx.last?.submittedBy ?? '').trim(),
        hasDraft: Boolean(ctx.existing && !ctx.existing.submittedAt),
        weekStart: collSnapFast.weekStart,
        collection: collSnapFast.collection,
        collectionCollected: collSnapFast.collected,
        collectionPct: collSnapFast.collectionPct,
        consolidatedPct: (collSnapFast as { consolidatedPct?: string }).consolidatedPct || '',
      })
    }
    const collSnap = await branchCollectionSnapshot(branchId, dateFor)
    if (!enriched.summary.weeklyCollectionPct && collSnap.collectionPct) {
      enriched.summary.weeklyCollectionPct = collSnap.collectionPct
      enriched.summary.collectionPct = collSnap.collectionPct
    }
    const mobileNote = mobileSyncNote(
      enriched.mobileConfigured,
      enriched.mobile,
      autoSync ? mobileSynced : true,
    )

    const payload = {
      ok: true,
      branch: { id: branch.id, name: branch.name },
      dateFor,
      rows: enrichOnly ? undefined : ctx.rows,
      summary: enriched.summary,
      mobileStats: enriched.mobile,
      mobileFilled: enriched.fromMobile,
      mobileNote,
      autoFilled: enriched.autoFilled,
      fieldMeta: enriched.fieldMeta,
      alreadySubmitted: Boolean(ctx.existing?.submittedAt),
      submittedBy: String(ctx.existing?.submittedBy ?? ctx.last?.submittedBy ?? '').trim(),
      hasDraft: Boolean(ctx.existing && !ctx.existing.submittedAt),
      carriedFromDate: ctx.last?.dateFor ?? '',
      deployCarryNote: deployCarryNoteText(ctx.existing, ctx.last, ctx.deployCarriedFromLast),
      summaryCarryNote: ctx.last
        ? `Summary fields pre-filled from ${ctx.last.dateFor} where blank today — edit as needed.`
        : '',
      masterClients: ctx.clients.length,
      weekStart: collSnap.weekStart,
      collection: collSnap.collection,
      collectionCollected: collSnap.collected,
      collectionPct: collSnap.collectionPct,
      consolidatedPct: collSnap.consolidatedPct,
      mtdCollected: collSnap.mtdCollected,
    }

    if (enrichOnly) {
      const { rows: _rows, ...enrichPayload } = payload
      return res.status(200).json(enrichPayload)
    }
    return res.status(200).json(payload)
  }

  if (action === 'saveDraft') {
    if (!misStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
    const dateFor = String(body.dateFor ?? misTodayIst())
    const existing = await getReport(branchId, dateFor)
    const rawRows = Array.isArray(body.rows) && body.rows.length
      ? body.rows
      : (existing?.rows ?? [])
    const rows: MisDeployRow[] = rawRows.map((r: Record<string, unknown>) =>
      normalizeDeployRow({
        clientId: String(r.clientId ?? ''),
        clientName: String(r.clientName ?? '').slice(0, 120),
        location: String(r.location ?? '').slice(0, 120),
        staffName: String(r.staffName ?? '').slice(0, 120),
        sanA: num(r.sanA), depA: num(r.depA), absA: num(r.absA), otA: num(r.otA),
        sanG: num(r.sanG), depG: num(r.depG), absG: num(r.absG), otG: num(r.otG),
        sanB: num(r.sanB), depB: num(r.depB), absB: num(r.absB), otB: num(r.otB),
        sanC: num(r.sanC), depC: num(r.depC), absC: num(r.absC), otC: num(r.otC),
      }) as MisDeployRow,
    )
    const summary = normaliseMisSummary(
      (body.summary ?? existing?.summary ?? {}) as Record<string, unknown>,
    )
    const deployTot = reportDeployTotals(rows as Record<string, unknown>[], branchId)
    const defaultShortage = shortageWithoutRelievers(deployTot.abs, deployTot.ot)
    const manpowerShortage =
      body.manpowerShortage != null
        ? normaliseManpowerShortage(body.manpowerShortage, { defaultTotal: defaultShortage })
        : existing?.manpowerShortage
          ? normaliseManpowerShortage(existing.manpowerShortage, { defaultTotal: defaultShortage })
          : undefined
    if (manpowerShortage && body.manpowerShortage != null) {
      manpowerShortage.savedAt = new Date().toISOString()
      manpowerShortage.savedBy = String(body.submittedBy ?? existing?.submittedBy ?? '').slice(0, 80)
    }
    const report: MisReport = {
      id: `${branchId}:${dateFor}`,
      branchId,
      branchName: branch.name,
      dateFor,
      submittedAt: existing?.submittedAt ?? '',
      submittedBy: String(body.submittedBy ?? existing?.submittedBy ?? '').slice(0, 80),
      submitterEmail: existing?.submitterEmail ?? normaliseEmail(auth.email),
      rows,
      summary,
      manpowerShortage,
    }
    const ok = await saveDraftReport(report)
    if (!ok) return res.status(503).json({ error: 'Could not save draft.' })
    // HOD may edit Sanctioned on Step 1 — remember on Master Directory for next days
    let masterSanUpdated = 0
    if (rows.length > 0 && body.syncSanctioned !== false) {
      masterSanUpdated = await syncSanctionedPostsToMaster(branchId, rows).catch(() => 0)
    }
    return res.status(200).json({
      ok: true,
      saved: true,
      dateFor,
      masterSanUpdated,
      manpowerShortage: report.manpowerShortage,
      shortageWithoutRelievers: defaultShortage,
    })
  }

  if (action === 'saveCollection') {
    if (!misStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
    const dateFor = String(body.dateFor ?? misTodayIst())
    const weekStart = misWeekStartMonday(dateFor)
    const raw = (body.collection ?? {}) as Record<string, unknown>
    const all = await getCollections(weekStart)
    const prev = all.find((c) => c.branchId === branchId)
    const row: MisCollection = {
      id: String(raw.id || prev?.id || `${branchId}:${weekStart}`),
      branchId,
      weekStart,
      monthlyBilling: prev?.monthlyBilling ?? 0,
      budget: num(raw.budget),
      mon: num(raw.mon),
      tue: num(raw.tue),
      wed: num(raw.wed),
      thu: num(raw.thu),
      fri: num(raw.fri),
      sat: num(raw.sat),
      outstanding: prev?.outstanding ?? 0,
      ostCollected: prev?.ostCollected,
      remarks: prev?.remarks ?? '',
    }
    const next = all.filter((c) => c.branchId !== branchId).concat(row)
    await saveCollections(weekStart, next)
    const collected = weekCollected(row)
    const collectionPct = weeklyCollectionPct(row, collected)
    const mtdCollected = await branchMonthCollectedLacs(branchId, dateFor)
    const consolidatedPct = consolidatedCollectionPct(row, collected, mtdCollected)
    return res.status(200).json({
      ok: true,
      weekStart,
      collection: {
        ...row,
        mtdCollected,
        mtdExceptThisWeek: Math.max(0, Math.round((mtdCollected - collected) * 100) / 100),
      },
      collected,
      collectionPct,
      consolidatedPct,
    })
  }

  if (action === 'submit') {
    try {
    if (!misStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
    const certified =
      body.certified === true || body.certified === 'true' || body.certified === 1 || body.certified === '1'
    if (!certified) {
      return res.status(400).json({
        error:
          'Please certify that today’s Daily MIS is verified and found correct before submitting.',
      })
    }
    const dateFor = String(body.dateFor ?? misTodayIst())
    const today = misTodayIst()
    const existingBefore = await getReport(branchId, dateFor)
    const isResubmit = Boolean(existingBefore && !existingBefore.submittedAt && existingBefore.rows?.length)
    if (dateFor === today && process.env.WORK360_API_BASE_URL?.trim() && !isResubmit) {
      await Promise.race([
        syncMobileVisits(dateFor, { includeVisits: true, includeDuty: true }).catch(() => null),
        new Promise<void>((resolve) => setTimeout(resolve, 2000)),
      ])
    }

    const rawCol = (body.collection ?? {}) as Record<string, unknown>
    const weekStart = misWeekStartMonday(dateFor)
    const allCols = await getCollections(weekStart)
    const prevCol = allCols.find((c) => c.branchId === branchId)
    const colRow: MisCollection = normalizeCollectionRow({
      id: String(rawCol.id || prevCol?.id || `${branchId}:${weekStart}`),
      branchId,
      weekStart,
      monthlyBilling: prevCol?.monthlyBilling ?? 0,
      budget: (normalizeToLacs(rawCol.budget) ?? num(rawCol.budget)) || prevCol?.budget || 0,
      mon: normalizeToLacs(rawCol.mon) ?? num(rawCol.mon),
      tue: normalizeToLacs(rawCol.tue) ?? num(rawCol.tue),
      wed: normalizeToLacs(rawCol.wed) ?? num(rawCol.wed),
      thu: normalizeToLacs(rawCol.thu) ?? num(rawCol.thu),
      fri: normalizeToLacs(rawCol.fri) ?? num(rawCol.fri),
      sat: normalizeToLacs(rawCol.sat) ?? num(rawCol.sat),
      outstanding: prevCol?.outstanding ?? 0,
      remarks: prevCol?.remarks ?? '',
    })
    if (colRow.budget > 0 || colRow.mon || colRow.tue || colRow.wed || colRow.thu || colRow.fri || colRow.sat) {
      const nextCols = allCols.filter((c) => c.branchId !== branchId).concat(colRow)
      await saveCollections(weekStart, nextCols)
    }

    const rawRows = Array.isArray(body.rows) ? body.rows : []
    const useServerDraft =
      body.useServerDraft === true || rawRows.length === 0
    let rowSource: Record<string, unknown>[] = rawRows as Record<string, unknown>[]
    if (useServerDraft) {
      const draft = existingBefore ?? (await getReport(branchId, dateFor))
      if (!draft?.rows?.length) {
        return res.status(400).json({
          error: 'Complete Step 1 (deployment) and tap Save before submitting.',
        })
      }
      rowSource = draft.rows as Record<string, unknown>[]
    }
    const rows: MisDeployRow[] = rowSource.map((r: Record<string, unknown>) => {
      const row = {
        clientId: String(r.clientId ?? ''),
        clientName: String(r.clientName ?? '').slice(0, 120),
        location: String(r.location ?? '').slice(0, 120),
        staffName: String(r.staffName ?? '').slice(0, 120),
        sanA: num(r.sanA), depA: num(r.depA), absA: num(r.absA), otA: num(r.otA),
        sanG: num(r.sanG), depG: num(r.depG), absG: num(r.absG), otG: num(r.otG),
        sanB: num(r.sanB), depB: num(r.depB), absB: num(r.absB), otB: num(r.otB),
        sanC: num(r.sanC), depC: num(r.depC), absC: num(r.absC), otC: num(r.otC),
      }
      return normalizeDeployRow(row) as MisDeployRow
    })
    const s = normaliseMisSummary({
      ...(existingBefore?.summary ?? {}),
      ...(body.summary ?? {}),
    } as Record<string, unknown>)
    // Final submit: keep HOD-reviewed Step 3/4 figures. Fill blanks from system, but
    // never block Kochi / other large branches on a slow Work360 / HR pull.
    const live = await withTimeout(
      enrichBranchSummary(branchId, branch.name, dateFor, s, {
        lite: true,
        forceSystem: false,
      }),
      12_000,
    )
    const collected = weekCollected(colRow)
    const liveSummary = live?.summary
    const collectionPct =
      weeklyCollectionPct(colRow, collected) || liveSummary?.weeklyCollectionPct || s.weeklyCollectionPct
    const summary: MisReport['summary'] = {
      ...(liveSummary ?? s),
      collectionPct,
      weeklyCollectionPct: collectionPct || liveSummary?.weeklyCollectionPct || s.weeklyCollectionPct,
      remarks: String(s.remarks ?? liveSummary?.remarks ?? '').slice(0, 2000),
    }

    const totalsPre = reportDeployTotals(rows as Record<string, unknown>[], branchId)
    const missing = missingMisSummaryFields({
      summary,
      submittedBy: String(body.submittedBy ?? ''),
      deploySan: totalsPre.san,
      colBudget: colRow.budget,
      weekCollected: collected,
    })
    if (missing.length) {
      return res.status(400).json({
        error: 'Please complete all Daily Summary fields before submitting.',
        missing,
      })
    }

    const totalsForShortage = reportDeployTotals(rows as Record<string, unknown>[], branchId)
    const manpowerShortage = normaliseManpowerShortage(
      body.manpowerShortage ?? existingBefore?.manpowerShortage,
      { defaultTotal: shortageWithoutRelievers(totalsForShortage.abs, totalsForShortage.ot) },
    )
    const submittedAt = new Date().toISOString()
    const report: MisReport = {
      id: `${branchId}:${dateFor}`,
      branchId,
      branchName: branch.name,
      dateFor,
      submittedAt,
      submittedBy: String(body.submittedBy ?? '').slice(0, 80),
      submitterEmail: normaliseEmail(
        String(body.submitterEmail ?? auth.email ?? ''),
      ),
      certified: true,
      certifiedAt: submittedAt,
      rows,
      summary,
      manpowerShortage,
    }
    const ok = await submitReport(report)
    if (!ok) return res.status(503).json({ error: 'Could not save. Please try again.' })

    const otBreakdown = reportShiftOtTotals(rows as Record<string, unknown>[])
    const totals = reportDeployTotals(rows as Record<string, unknown>[], branchId)
    const vac = Math.max(0, totals.abs - totals.ot)
    const dep = Math.min(totals.san, Math.max(0, totals.san - vac))
    const late = !isOnTimeMisSubmission(dateFor, report.submittedAt)

    const sharePayload = {
      branch: branch.name,
      dateFor,
      sanctioned: totals.san,
      absent: totals.abs,
      vacant: vac,
      deployed: dep,
      ot: totals.ot,
      depPct: totals.san ? Math.round((dep / totals.san) * 100) : 0,
      collectionPct: report.summary.collectionPct || '',
    }

    res.status(200).json({
      ok: true,
      masterSanUpdated: 0,
      acknowledgment: {
        ok: true,
        note: 'Report saved. Acknowledgment email is being sent.',
      },
      lateSubmission: late,
      share: sharePayload,
      otBreakdown,
    })

    void (async () => {
      try {
        await syncSanctionedPostsToMaster(branchId, rows).catch(() => 0)
        const notifyEmails = [auth.email, String(body.submitterEmail ?? ''), report.submitterEmail].filter(
          (e) => String(e).includes('@'),
        )
        let ack = await sendBranchSubmitAck(
          {
            branchId,
            branchName: branch.name,
            dateFor,
            submittedBy: report.submittedBy,
            submitterEmail: report.submitterEmail,
            rows: rows as Record<string, unknown>[],
            summary: report.summary as Record<string, string>,
          },
          notifyEmails,
        )
        if (!ack.ok && !ack.skipped) {
          await new Promise((r) => setTimeout(r, 1200))
          ack = await sendBranchSubmitAck(
            {
              branchId,
              branchName: branch.name,
              dateFor,
              submittedBy: report.submittedBy,
              submitterEmail: report.submitterEmail,
              rows: rows as Record<string, unknown>[],
              summary: report.summary as Record<string, string>,
            },
            notifyEmails,
          )
        }
        if (late) await sendMisLateConsolidatedAck(dateFor).catch(() => null)
        console.log('mis submit ack background', { branchId, dateFor, ackOk: ack?.ok })
      } catch (err) {
        console.error('mis submit background error', err)
      }
    })()
    return
    } catch (err) {
      console.error('mis submit error', err)
      return res.status(500).json({
        error: err instanceof Error ? err.message : 'Submit failed — please try again.',
      })
    }
  }

  return res.status(400).json({ error: 'Unknown action.' })
}
