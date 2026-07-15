import type { VercelRequest, VercelResponse } from '@vercel/node'
import { normaliseEmail } from '../_lib/auth.js'
import { verifyAppSession } from '../_lib/app-session.js'
import { misBranchDisplayName } from '../_lib/mis/branch-labels.js'
import {
  getBranches,
  getActiveBranch,
  getClients,
  getCollections,
  getComplaints,
  getGuardDocs,
  getLastReport,
  getReport,
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
import { sendBranchSubmitAck, sendMisLateConsolidatedAck } from '../_lib/mis/digest.js'
import { misTodayIst, isOnTimeMisSubmission, misWeekStartMonday } from '../_lib/mis/dates.js'
import { enrichBranchSummary, mobileSyncNote } from '../_lib/mis/branch-mobile-stats.js'
import { missingMisSummaryFields, normaliseMisSummary } from '../_lib/mis/summary-complete.js'
import { mergePreviousSummary } from '../_lib/mis/summary-autofill.js'
import { syncGuardsComplaintsToMis } from '../_lib/mis/guards-complaint-sync.js'
import { syncMobileVisits } from '../_lib/mis/mobile-visits.js'

export const config = { maxDuration: 60 }

function weekCollected(c: MisCollection): number {
  return num(c.mon) + num(c.tue) + num(c.wed) + num(c.thu) + num(c.fri) + num(c.sat)
}

async function branchCollectionSnapshot(branchId: string, dateFor: string) {
  const weekStart = misWeekStartMonday(dateFor)
  const cols = await getCollections(weekStart)
  const row =
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
  const collected = weekCollected(row)
  const collectionPct = row.budget > 0 ? String(Math.round((collected * 100) / row.budget)) : ''
  return { weekStart, collection: row, collected, collectionPct }
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
  const users = await getUsers()
  const supportBlock = supportUserBlocksMisSubmit(users, session.email)
  if (supportBlock) {
    return { error: supportBlock } as const
  }
  return { branch: b, email: session.email } as const
}

async function syncSanctionedPostsToMaster(branchId: string, rows: MisDeployRow[]): Promise<number> {
  const all = await getClients()
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
  if (changed) await saveClients(all)
  return updated
}

function deploySiteKey(row: { clientName?: string; location?: string }): string {
  return `${String(row.clientName ?? '').trim()}|${String(row.location ?? '').trim()}`.toUpperCase()
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
): MisDeployRow | null {
  const siteKey = deploySiteKey({ clientName, location })
  const existingRow =
    existing?.rows?.find((r) => r.clientId === clientId) ??
    existing?.rows?.find((r) => deploySiteKey(r) === siteKey) ??
    null
  const lastRow =
    last?.rows?.find((r) => r.clientId === clientId) ??
    last?.rows?.find((r) => deploySiteKey(r) === siteKey) ??
    null

  if (existing?.submittedAt && existingRow) return existingRow
  if (existingRow && rowHasDeployEntry(existingRow)) return existingRow

  if (existingRow && lastRow) {
    const merged = { ...existingRow }
    const pairs: [keyof MisDeployRow, keyof MisDeployRow, keyof MisDeployRow][] = [
      ['absA', 'otA', 'sanA'],
      ['absG', 'otG', 'sanG'],
      ['absB', 'otB', 'sanB'],
      ['absC', 'otC', 'sanC'],
    ]
    for (const [absK, otK, sanK] of pairs) {
      if (!num(merged[absK] as number) && !num(merged[otK] as number)) {
        const abs = num(lastRow[absK] as number)
        const san = num(merged[sanK] as number) || num(lastRow[sanK] as number)
        const ot = Math.min(num(lastRow[otK] as number), abs, san > 0 ? san : num(lastRow[otK] as number))
        merged[absK] = abs as never
        merged[otK] = ot as never
      } else {
        const abs = num(merged[absK] as number)
        const san = num(merged[sanK] as number)
        const ot = Math.min(num(merged[otK] as number), abs, san > 0 ? san : num(merged[otK] as number))
        merged[otK] = ot as never
      }
    }
    return merged
  }

  const base = existingRow ?? lastRow
  if (!base) return null
  const clamped = { ...base }
  for (const s of ['A', 'G', 'B', 'C'] as const) {
    const abs = num(clamped[`abs${s}` as keyof MisDeployRow] as number)
    const san = num(clamped[`san${s}` as keyof MisDeployRow] as number)
    const ot = num(clamped[`ot${s}` as keyof MisDeployRow] as number)
    ;(clamped as Record<string, number>)[`ot${s}`] = Math.min(ot, abs, san > 0 ? san : ot)
  }
  return clamped
}

async function buildReportRowsContext(branchId: string, dateFor: string, quick: boolean) {
  let clients = await getClients(branchId)
  if (!quick && !clients.filter((c) => c.active !== false).length) {
    await Promise.race([
      repairAllBranchClients().catch(() => null),
      new Promise<void>((resolve) => setTimeout(resolve, 2500)),
    ])
    clients = await getClients(branchId)
  }
  const existing = await getReport(branchId, dateFor)
  const last = await getLastReport(branchId, dateFor)
  const mergedBase = mergePreviousSummary(existing?.summary ?? null, last?.summary ?? null)
  const carriedKeys: string[] = []
  if (last?.summary && !existing?.summary) {
    for (const [k, v] of Object.entries(mergedBase)) {
      if (String(v ?? '').trim()) carriedKeys.push(k)
    }
  }
  const rows: MisDeployRow[] = clients
    .filter((c) => c.active !== false)
    .map((c) => {
      const p = pickPrevDeployRow(c.id, c.name, c.location, existing, last)
      const absA = p ? p.absA : 0
      const otA = p ? p.otA : 0
      const absG = p ? p.absG : 0
      const otG = p ? p.otG : 0
      const absB = p ? p.absB : 0
      const otB = p ? p.otB : 0
      const absC = p ? p.absC : 0
      const otC = p ? p.otC : 0
      return {
        clientId: c.id,
        clientName: c.name,
        location: c.location,
        staffName: c.staffName,
        sanA: num(c.sanA), depA: shiftDeploy(num(c.sanA), absA, otA).dep, absA, otA,
        sanG: num(c.sanG), depG: shiftDeploy(num(c.sanG), absG, otG).dep, absG, otG,
        sanB: num(c.sanB), depB: shiftDeploy(num(c.sanB), absB, otB).dep, absB, otB,
        sanC: num(c.sanC), depC: shiftDeploy(num(c.sanC), absC, otC).dep, absC, otC,
      }
    })
  return { clients, existing, last, mergedBase, carriedKeys, rows }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = (req.body ?? {}) as Record<string, unknown>
  const action = String(body.action ?? '')

  if (action === 'branches') {
    const branches = await getBranches(true)
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

  if (action === 'saveGuardDocs') {
    if (!misStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
    const arr = Array.isArray(body.docs) ? body.docs : []
    const list: MisGuardDoc[] = arr.slice(0, 20000).map((g: Record<string, unknown>) => ({
      id: String(g.id || `gd${Date.now()}`),
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

  if (action === 'clientsList') {
    const list = await getClients(branchId)
    return res.status(200).json({ ok: true, clients: list })
  }

  if (action === 'saveClient') {
    if (!misStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
    const raw = (body.client ?? {}) as Record<string, unknown>
    const existingId = String(raw.id ?? '').trim()
    if (existingId) {
      const branchClients = await getClients(branchId)
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
    return res.status(200).json({ ok: true, client: saved })
  }

  if (action === 'toggleClient') {
    if (!misStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
    const clientId = String(body.clientId ?? '').trim()
    const active = body.active === true
    const ok = await setClientActive(branchId, clientId, active)
    if (!ok) return res.status(404).json({ error: 'Client not found.' })
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
      const hadLastDeploy = (ctx.last?.rows ?? []).some((r) => rowHasDeployEntry(r))
      return res.status(200).json({
        ok: true,
        quick: true,
        branch: { id: branch.id, name: branch.name },
        dateFor,
        rows: ctx.rows,
        summary: ctx.mergedBase,
        mobileStats: { lateStartCases: 0, outOfPostCases: 0, dayVisits: 0, nightChecks: 0, trainedSites: 0, visitTotal: 0 },
        mobileFilled: false,
        mobileNote: 'Form opened — auto-fill data loading in background…',
        autoFilled: [],
        fieldMeta: {},
        alreadySubmitted: Boolean(ctx.existing?.submittedAt),
        submittedBy: ctx.existing?.submittedBy ?? '',
        hasDraft: Boolean(ctx.existing && !ctx.existing.submittedAt),
        carriedFromDate: ctx.last?.dateFor ?? '',
        deployCarryNote: ctx.last && hadLastDeploy
          ? `Absent & OT pre-filled from ${ctx.last.dateFor} where not entered today — edit as needed.`
          : '',
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

    const enriched = await enrichBranchSummary(branchId, branch.name, dateFor, ctx.mergedBase, {
      // Full enrich by default so PVC / Medical / Training / HR can fill; pass lite:true to skip HR only.
      lite: body.lite === true,
      carriedKeys: ctx.carriedKeys,
    })
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
      masterClients: ctx.clients.length,
      weekStart: collSnap.weekStart,
      collection: collSnap.collection,
      collectionCollected: collSnap.collected,
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
    }
    const ok = await saveDraftReport(report)
    if (!ok) return res.status(503).json({ error: 'Could not save draft.' })
    return res.status(200).json({ ok: true, saved: true, dateFor })
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
      remarks: prev?.remarks ?? '',
    }
    const next = all.filter((c) => c.branchId !== branchId).concat(row)
    await saveCollections(weekStart, next)
    const collected = weekCollected(row)
    const collectionPct = row.budget > 0 ? String(Math.round((collected * 100) / row.budget)) : ''
    return res.status(200).json({ ok: true, weekStart, collection: row, collected, collectionPct })
  }

  if (action === 'submit') {
    if (!misStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
    const dateFor = String(body.dateFor ?? misTodayIst())
    const today = misTodayIst()
    if (dateFor === today && process.env.WORK360_API_BASE_URL?.trim()) {
      await Promise.race([
        syncMobileVisits(dateFor, { includeVisits: true, includeDuty: true }).catch(() => null),
        new Promise<void>((resolve) => setTimeout(resolve, 4000)),
      ])
    }

    const rawCol = (body.collection ?? {}) as Record<string, unknown>
    const weekStart = misWeekStartMonday(dateFor)
    const allCols = await getCollections(weekStart)
    const prevCol = allCols.find((c) => c.branchId === branchId)
    const colRow: MisCollection = {
      id: String(rawCol.id || prevCol?.id || `${branchId}:${weekStart}`),
      branchId,
      weekStart,
      monthlyBilling: prevCol?.monthlyBilling ?? 0,
      budget: num(rawCol.budget) || prevCol?.budget || 0,
      mon: num(rawCol.mon),
      tue: num(rawCol.tue),
      wed: num(rawCol.wed),
      thu: num(rawCol.thu),
      fri: num(rawCol.fri),
      sat: num(rawCol.sat),
      outstanding: prevCol?.outstanding ?? 0,
      remarks: prevCol?.remarks ?? '',
    }
    if (colRow.budget > 0 || colRow.mon || colRow.tue || colRow.wed || colRow.thu || colRow.fri || colRow.sat) {
      const nextCols = allCols.filter((c) => c.branchId !== branchId).concat(colRow)
      await saveCollections(weekStart, nextCols)
    }

    const rawRows = Array.isArray(body.rows) ? body.rows : []
    const rows: MisDeployRow[] = rawRows.map((r: Record<string, unknown>) => {
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
    const s = normaliseMisSummary((body.summary ?? {}) as Record<string, unknown>)
    const collected = weekCollected(colRow)
    let collectionPct = s.collectionPct
    if (!collectionPct && colRow.budget > 0) {
      collectionPct = String(Math.round((collected * 100) / colRow.budget))
    }
    const summary: MisReport['summary'] = {
      ...s,
      collectionPct,
      remarks: String(s.remarks ?? '').slice(0, 2000),
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

    const report: MisReport = {
      id: `${branchId}:${dateFor}`,
      branchId,
      branchName: branch.name,
      dateFor,
      submittedAt: new Date().toISOString(),
      submittedBy: String(body.submittedBy ?? '').slice(0, 80),
      submitterEmail: normaliseEmail(
        String(body.submitterEmail ?? auth.email ?? ''),
      ),
      rows,
      summary,
    }
    const ok = await submitReport(report)
    if (!ok) return res.status(503).json({ error: 'Could not save. Please try again.' })

    const otBreakdown = reportShiftOtTotals(rows as Record<string, unknown>[])
    const totals = reportDeployTotals(rows as Record<string, unknown>[], branchId)
    const vac = Math.max(0, totals.abs - totals.ot)
    const dep = Math.min(totals.san, Math.max(0, totals.san - vac))

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

    /* Send acknowledgment BEFORE responding — Vercel freezes work after res.json() */
    const masterSanUpdated = await syncSanctionedPostsToMaster(branchId, rows).catch(() => 0)
    const notifyEmails = [auth.email, String(body.submitterEmail ?? ''), report.submitterEmail].filter(
      (e) => String(e).includes('@'),
    )
    let ack: Awaited<ReturnType<typeof sendBranchSubmitAck>>
    try {
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
      if (!ack.ok && !ack.skipped) {
        await new Promise((r) => setTimeout(r, 1500))
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
    } catch (err) {
      console.error('sendBranchSubmitAck error', err)
      ack = {
        ok: false,
        error: err instanceof Error ? err.message : 'Thank-you email could not be sent',
        directorEmail: 'director@agilegroup.co.in',
        to: [],
        from: '',
        submitterTo: notifyEmails,
        directorCc: [],
        aiAlerts: [],
      }
    }

    console.log('mis submit ack', {
      branchId,
      dateFor,
      masterSanUpdated,
      ackOk: ack?.ok,
      ackTo: ack && 'to' in ack ? ack.to : [],
      ackError: ack && 'error' in ack ? ack.error : undefined,
    })

    /* Respond as soon as branch acknowledgment is done — late consolidated runs after */
    const late = !isOnTimeMisSubmission(dateFor, report.submittedAt)
    const payload = {
      ok: true,
      masterSanUpdated,
      acknowledgment: {
        ok: Boolean(ack?.ok),
        skipped: Boolean(ack && 'skipped' in ack && ack.skipped),
        error: ack && 'error' in ack ? ack.error : undefined,
        to: ack && 'to' in ack ? ack.to : [],
        note: ack?.ok
          ? 'Acknowledgment email sent immediately to submitter and Director.'
          : ack && 'skipped' in ack && ack.skipped
            ? 'Acknowledgment skipped — email not configured.'
            : 'Report saved — acknowledgment email may have failed; Director copy will retry if needed.',
      },
      lateSubmission: late,
      share: sharePayload,
      otBreakdown,
    }
    res.status(200).json(payload)

    if (late) {
      try {
        await sendMisLateConsolidatedAck(dateFor)
      } catch (err) {
        console.error('sendMisLateConsolidatedAck error', err)
      }
    }
    return
  }

  return res.status(400).json({ error: 'Unknown action.' })
}
