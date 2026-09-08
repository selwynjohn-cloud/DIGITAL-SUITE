/**
 * Agile Assets — data API (Staff + Management).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import { isSuiteAdminEmail, normaliseEmail } from '../_lib/auth.js'
import { collectAaAlerts } from '../_lib/assets/alerts.js'
import {
  aaNid,
  aaStorageOk,
  getAaAssets,
  getAaMaint,
  getAaTransfers,
  getAaWriteOffs,
  nextAaAssetCode,
  upsertAaAsset,
  upsertAaMaint,
  upsertAaTransfer,
  upsertAaWriteOff,
} from '../_lib/assets/store.js'
import type {
  AaAsset,
  AaCategory,
  AaMaintKind,
  AaMaintTicket,
  AaOrgTier,
  AaStatus,
  AaTransfer,
  AaWriteOff,
} from '../_lib/assets/types.js'
import { AA_CATEGORIES, AA_TIERS } from '../_lib/assets/types.js'
import { getBranches } from '../_lib/mis/store.js'
import { resolveSuiteUserName } from '../_lib/suite-mail.js'

function json(res: VercelResponse, status: number, body: Record<string, unknown>) {
  return res.status(status).json(body)
}
function s(v: unknown, n = 200) {
  return String(v ?? '').trim().slice(0, n)
}
function num(v: unknown) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/** Simple declining book value: 10% per year from purchase. */
function estimateBookValue(cost: number, purchaseDate: string): number {
  if (!cost) return 0
  const y = purchaseDate ? (Date.now() - new Date(purchaseDate).getTime()) / (365.25 * 86_400_000) : 0
  const years = Math.max(0, Math.floor(y))
  return Math.max(0, Math.round(cost * Math.pow(0.9, years)))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  const body = (req.body ?? {}) as Record<string, unknown>
  const action = s(body.action, 60)

  if (action === 'status') return json(res, 200, { ok: true, storage: aaStorageOk() })

  const session = await verifyAppSession(String(body.sessionToken ?? ''), 'assets')
  if (!session) return json(res, 401, { error: 'Please sign in with your work email / branch login.' })

  const email = normaliseEmail(session.email)
  const name = await resolveSuiteUserName(email)
  const portal = String(body.portal || session.role || 'staff') === 'management' ? 'management' : 'staff'
  const isMgmt = portal === 'management' || isSuiteAdminEmail(email)
  const branchId = isMgmt ? s(body.branchId, 40) : session.branchId || s(body.branchId, 40)

  const filterBranch = <T extends { branchId?: string }>(rows: T[]) => {
    if (isMgmt && !branchId) return rows
    const bid = branchId || session.branchId || ''
    if (!bid) return rows
    return rows.filter((r) => !r.branchId || r.branchId === bid)
  }

  if (action === 'bootstrap') {
    const branches = await getBranches(true)
    return json(res, 200, {
      ok: true,
      email,
      name,
      portal,
      isMgmt,
      branchId: session.branchId || '',
      storage: aaStorageOk(),
      categories: AA_CATEGORIES,
      tiers: AA_TIERS,
      branches: branches.map((b) => ({ id: b.id, name: b.name })),
    })
  }

  if (action === 'dashboard') {
    const [assets, transfers, maint, writeoffs, alerts] = await Promise.all([
      getAaAssets(),
      getAaTransfers(),
      getAaMaint(),
      getAaWriteOffs(),
      collectAaAlerts(),
    ])
    const A = filterBranch(assets)
    const inService = A.filter((x) => x.status === 'InService').length
    const underRepair = A.filter((x) => x.status === 'UnderRepair').length
    const pendingHoto = filterBranch(
      transfers.map((t) => ({ ...t, branchId: t.toBranchId || t.fromBranchId })),
    ).filter((t) => t.status === 'PendingHOTO').length
    const openMaint = filterBranch(maint).filter((m) => m.status === 'Raised' || m.status === 'InProgress')
      .length
    const pendingWo = filterBranch(writeoffs).filter((w) => w.status === 'Pending').length
    const bookTotal = A.reduce((sum, x) => sum + (x.bookValue || 0), 0)
    return json(res, 200, {
      ok: true,
      kpis: {
        assets: A.length,
        inService,
        underRepair,
        pendingHoto,
        openMaint,
        pendingWo,
        bookTotal,
      },
      alerts: alerts.slice(0, 40),
      byCategory: AA_CATEGORIES.map((c) => ({
        id: c.id,
        label: c.label,
        count: A.filter((x) => x.category === c.id && x.status !== 'Disposed').length,
      })),
    })
  }

  if (action === 'listAssets') {
    let rows = filterBranch(await getAaAssets())
    const q = s(body.q, 80).toLowerCase()
    const status = s(body.status, 40)
    const category = s(body.category, 40)
    if (status) rows = rows.filter((x) => x.status === status)
    if (category) rows = rows.filter((x) => x.category === category)
    if (q) {
      rows = rows.filter((x) =>
        [x.assetCode, x.name, x.serialNo, x.brand, x.branchName, x.custodianName, x.roomFloor]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    }
    return json(res, 200, { ok: true, assets: rows.slice(0, 800) })
  }

  if (action === 'saveAsset') {
    const id = s(body.id, 40) || aaNid('as')
    const existing = (await getAaAssets()).find((x) => x.id === id)
    const code = existing?.assetCode || (await nextAaAssetCode())
    const cost = num(body.originalCost)
    const purchaseDate = s(body.purchaseDate, 20)
    const row: AaAsset = {
      id,
      assetCode: code,
      name: s(body.name, 160) || 'Unnamed asset',
      category: (s(body.category, 40) as AaCategory) || 'Other',
      subCategory: s(body.subCategory, 80),
      brand: s(body.brand, 80),
      serialNo: s(body.serialNo, 80),
      purchaseDate,
      invoiceRef: s(body.invoiceRef, 80),
      supplier: s(body.supplier, 120),
      warrantyExpiry: s(body.warrantyExpiry, 20),
      originalCost: cost,
      bookValue: num(body.bookValue) || estimateBookValue(cost, purchaseDate),
      orgTier: (s(body.orgTier, 40) as AaOrgTier) || 'Branch',
      branchId: s(body.branchId, 40) || session.branchId || '',
      branchName: s(body.branchName, 120),
      roomFloor: s(body.roomFloor, 120),
      custodianName: s(body.custodianName, 120) || name,
      custodianEmail: s(body.custodianEmail, 120) || email,
      status: (s(body.status, 40) as AaStatus) || 'InService',
      notes: s(body.notes, 2000),
      qrPayload: `AGILE-ASSET|${code}`,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdByEmail: existing?.createdByEmail || email,
    }
    if (!isMgmt && session.branchId) row.branchId = session.branchId
    await upsertAaAsset(row)
    return json(res, 200, { ok: true, asset: row })
  }

  if (action === 'listTransfers') {
    const rows = await getAaTransfers()
    const filtered = isMgmt && !branchId
      ? rows
      : rows.filter((t) => {
          const bid = branchId || session.branchId || ''
          if (!bid) return true
          return t.fromBranchId === bid || t.toBranchId === bid
        })
    return json(res, 200, { ok: true, transfers: filtered.slice(0, 400) })
  }

  if (action === 'createTransfer') {
    const asset = (await getAaAssets()).find((x) => x.id === s(body.assetId, 40))
    if (!asset) return json(res, 404, { error: 'Asset not found.' })
    if (asset.status === 'WrittenOff' || asset.status === 'Disposed') {
      return json(res, 400, { error: 'Cannot transfer written-off / disposed asset.' })
    }
    const toBranchId = s(body.toBranchId, 40)
    const toBranchName = s(body.toBranchName, 120)
    if (!toBranchId) return json(res, 400, { error: 'Destination branch required.' })
    const now = new Date().toISOString()
    const row: AaTransfer = {
      id: aaNid('tr'),
      assetId: asset.id,
      assetCode: asset.assetCode,
      assetName: asset.name,
      fromBranchId: asset.branchId,
      fromBranchName: asset.branchName,
      toBranchId,
      toBranchName,
      fromCustodian: asset.custodianName || name,
      toCustodian: s(body.toCustodian, 120),
      handedOverAt: now,
      handedOverBy: name,
      takenOverAt: '',
      takenOverBy: '',
      status: 'PendingHOTO',
      notes: s(body.notes, 1000),
      createdAt: now,
    }
    asset.status = 'InTransit'
    asset.updatedAt = now
    await upsertAaAsset(asset)
    await upsertAaTransfer(row)
    return json(res, 200, { ok: true, transfer: row })
  }

  if (action === 'acceptTransfer') {
    const id = s(body.transferId, 40)
    const all = await getAaTransfers()
    const row = all.find((x) => x.id === id)
    if (!row) return json(res, 404, { error: 'Transfer not found.' })
    if (row.status !== 'PendingHOTO') return json(res, 400, { error: 'Transfer already closed.' })
    const now = new Date().toISOString()
    row.takenOverAt = now
    row.takenOverBy = name
    row.toCustodian = s(body.toCustodian, 120) || row.toCustodian || name
    row.status = 'Completed'
    const asset = (await getAaAssets()).find((x) => x.id === row.assetId)
    if (asset) {
      asset.branchId = row.toBranchId
      asset.branchName = row.toBranchName
      asset.custodianName = row.toCustodian
      asset.status = 'InService'
      asset.updatedAt = now
      await upsertAaAsset(asset)
    }
    await upsertAaTransfer(row)
    return json(res, 200, { ok: true, transfer: row, asset })
  }

  if (action === 'listMaint') {
    return json(res, 200, { ok: true, tickets: filterBranch(await getAaMaint()).slice(0, 500) })
  }

  if (action === 'saveMaint') {
    const id = s(body.id, 40) || aaNid('mt')
    const existing = (await getAaMaint()).find((x) => x.id === id)
    const asset = (await getAaAssets()).find((x) => x.id === s(body.assetId, 40))
    const row: AaMaintTicket = {
      id,
      assetId: asset?.id || s(body.assetId, 40),
      assetCode: asset?.assetCode || s(body.assetCode, 40),
      assetName: asset?.name || s(body.assetName, 160),
      branchId: asset?.branchId || s(body.branchId, 40) || session.branchId || '',
      branchName: asset?.branchName || s(body.branchName, 120),
      kind: (s(body.kind, 40) as AaMaintKind) || 'Breakdown',
      title: s(body.title, 200) || 'Maintenance',
      detail: s(body.detail, 2000),
      vendorName: s(body.vendorName, 160),
      cost: num(body.cost),
      amcRef: s(body.amcRef, 120),
      scheduledDate: s(body.scheduledDate, 20),
      completedDate: s(body.completedDate, 20),
      nextServiceDate: s(body.nextServiceDate, 20),
      status: (s(body.status, 20) as AaMaintTicket['status']) || 'Raised',
      raisedBy: existing?.raisedBy || name,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    if (asset && (row.status === 'Raised' || row.status === 'InProgress') && row.kind === 'Breakdown') {
      asset.status = 'UnderRepair'
      asset.updatedAt = row.updatedAt
      await upsertAaAsset(asset)
    }
    if (asset && (row.status === 'Resolved' || row.status === 'Closed') && asset.status === 'UnderRepair') {
      asset.status = 'InService'
      asset.updatedAt = row.updatedAt
      await upsertAaAsset(asset)
    }
    await upsertAaMaint(row)
    return json(res, 200, { ok: true, ticket: row })
  }

  if (action === 'listWriteOffs') {
    return json(res, 200, { ok: true, writeoffs: filterBranch(await getAaWriteOffs()).slice(0, 300) })
  }

  if (action === 'requestWriteOff') {
    const asset = (await getAaAssets()).find((x) => x.id === s(body.assetId, 40))
    if (!asset) return json(res, 404, { error: 'Asset not found.' })
    const row: AaWriteOff = {
      id: aaNid('wo'),
      assetId: asset.id,
      assetCode: asset.assetCode,
      assetName: asset.name,
      branchId: asset.branchId,
      branchName: asset.branchName,
      reason: s(body.reason, 1000),
      method: (s(body.method, 40) as AaWriteOff['method']) || 'Condemn',
      requestedBy: name,
      requestedAt: new Date().toISOString(),
      approvedBy: '',
      approvedAt: '',
      status: 'Pending',
      notes: s(body.notes, 1000),
    }
    await upsertAaWriteOff(row)
    return json(res, 200, { ok: true, writeoff: row })
  }

  if (action === 'decideWriteOff') {
    if (!isMgmt && !isSuiteAdminEmail(email)) {
      return json(res, 403, { error: 'Only Management can approve write-offs.' })
    }
    const id = s(body.writeOffId, 40)
    const all = await getAaWriteOffs()
    const row = all.find((x) => x.id === id)
    if (!row) return json(res, 404, { error: 'Write-off not found.' })
    const approve = body.approve !== false && s(body.decision, 20) !== 'reject'
    row.status = approve ? 'Approved' : 'Rejected'
    row.approvedBy = name
    row.approvedAt = new Date().toISOString()
    row.notes = s(body.notes, 1000) || row.notes
    if (approve) {
      const asset = (await getAaAssets()).find((x) => x.id === row.assetId)
      if (asset) {
        asset.status = row.method === 'Auction' || row.method === 'Donate' ? 'Disposed' : 'WrittenOff'
        asset.bookValue = 0
        asset.updatedAt = row.approvedAt
        await upsertAaAsset(asset)
      }
    }
    await upsertAaWriteOff(row)
    return json(res, 200, { ok: true, writeoff: row })
  }

  if (action === 'stockByBranch') {
    const assets = filterBranch(await getAaAssets()).filter(
      (x) => x.status !== 'Disposed' && x.status !== 'WrittenOff',
    )
    const map: Record<string, { branchId: string; branchName: string; count: number; bookValue: number }> = {}
    for (const a of assets) {
      const key = a.branchId || a.branchName || 'unknown'
      if (!map[key]) map[key] = { branchId: a.branchId, branchName: a.branchName || 'Unassigned', count: 0, bookValue: 0 }
      map[key].count++
      map[key].bookValue += a.bookValue || 0
    }
    return json(res, 200, { ok: true, stock: Object.values(map).sort((a, b) => b.count - a.count) })
  }

  if (action === 'alerts') {
    return json(res, 200, { ok: true, alerts: (await collectAaAlerts()).slice(0, 100) })
  }

  return json(res, 400, { error: 'Unknown action.' })
}
