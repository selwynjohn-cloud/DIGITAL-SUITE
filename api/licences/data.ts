/**
 * Agile Licenses — data API (Staff + Management), branch-wise.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import { isSuiteAdminEmail, normaliseEmail } from '../_lib/auth.js'
import { collectLicAlerts, refreshLicenceStatus } from '../_lib/licences/alerts.js'
import {
  getLicBranch,
  getLicLabour,
  licNid,
  licStorageOk,
  upsertLicBranch,
  upsertLicLabour,
} from '../_lib/licences/store.js'
import type {
  LicBranchKind,
  LicBranchLicence,
  LicLabourAuthority,
  LicLabourLicence,
  LicStatus,
} from '../_lib/licences/types.js'
import { LIC_BRANCH_KINDS, LIC_LABOUR_AUTH } from '../_lib/licences/types.js'
import { getBranches, getClients } from '../_lib/mis/store.js'
import { businessTierForName, businessTierLabel, resolveBusinessTiers } from '../_lib/mis/client-rules.js'
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  const body = (req.body ?? {}) as Record<string, unknown>
  const action = s(body.action, 60)

  if (action === 'status') return json(res, 200, { ok: true, storage: licStorageOk() })

  const session = await verifyAppSession(String(body.sessionToken ?? ''), 'licences')
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
    const allClients = await getClients(undefined, { skipRepair: true, branches })
    const clientsRaw = branchId
      ? allClients.filter((c) => c.branchId === branchId)
      : isMgmt
        ? allClients
        : allClients.filter((c) => c.branchId === (session.branchId || ''))
    const branchNameById = Object.fromEntries(branches.map((b) => [b.id, b.name]))
    const tierByGroup = resolveBusinessTiers(allClients, branches)
    const scopedClients = (Array.isArray(clientsRaw) ? clientsRaw : [])
      .filter((c) => c.active !== false)
      .map((c) => {
        const tierId = businessTierForName(c.name, tierByGroup)
        return {
          id: c.id,
          name: c.name,
          branchId: c.branchId,
          branchName: branchNameById[c.branchId] || '',
          starRating: Number(c.starRating) || 0,
          businessTier: tierId,
          businessTierLabel: businessTierLabel(tierId),
          tier: businessTierLabel(tierId),
        }
      })
    return json(res, 200, {
      ok: true,
      email,
      name,
      portal,
      isMgmt,
      branchId: session.branchId || '',
      storage: licStorageOk(),
      branchKinds: LIC_BRANCH_KINDS,
      labourAuth: LIC_LABOUR_AUTH,
      branches: branches.map((b) => ({ id: b.id, name: b.name })),
      clients: scopedClients.slice(0, 2000),
    })
  }

  if (action === 'dashboard') {
    let [branch, labour, alerts] = await Promise.all([
      getLicBranch(),
      getLicLabour(),
      collectLicAlerts(),
    ])
    branch = filterBranch(branch).map((r) => refreshLicenceStatus(r))
    labour = filterBranch(labour).map((r) => refreshLicenceStatus(r))
    const scopedAlerts = alerts.filter((a) => {
      if (isMgmt && !branchId) return true
      const bid = branchId || session.branchId || ''
      if (!bid) return true
      return (
        branch.some((b) => b.id === a.refId || b.branchName === a.branchName) ||
        labour.some((l) => l.id === a.refId || l.branchName === a.branchName)
      )
    })
    return json(res, 200, {
      ok: true,
      kpis: {
        branchLicences: branch.length,
        labourLicences: labour.length,
        expiring30: scopedAlerts.filter((a) => a.daysLeft >= 0 && a.daysLeft <= 30).length,
        expired: scopedAlerts.filter((a) => a.daysLeft < 0).length,
        clientsCovered: new Set(labour.map((l) => l.clientName).filter(Boolean)).size,
        sanctionedTotal: labour.reduce((sum, l) => sum + (l.sanctionedStrength || 0), 0),
      },
      alerts: scopedAlerts.slice(0, 40),
    })
  }

  if (action === 'listBranchLicences') {
    const rows = filterBranch(await getLicBranch()).map((r) => refreshLicenceStatus(r))
    return json(res, 200, { ok: true, licences: rows.slice(0, 800) })
  }

  if (action === 'saveBranchLicence') {
    const id = s(body.id, 40) || licNid('lb')
    const existing = (await getLicBranch()).find((x) => x.id === id)
    const validTo = s(body.validTo, 20)
    let status = (s(body.status, 20) as LicStatus) || 'Active'
    if (status !== 'Suspended' && status !== 'Applied') {
      status = refreshLicenceStatus({ validTo, status }).status as LicStatus
    }
    const row: LicBranchLicence = {
      id,
      kind: (s(body.kind, 40) as LicBranchKind) || 'PSARA',
      licenceNo: s(body.licenceNo, 80),
      issuingAuthority: s(body.issuingAuthority, 160),
      branchId: s(body.branchId, 40) || session.branchId || '',
      branchName: s(body.branchName, 120),
      state: s(body.state, 80),
      validFrom: s(body.validFrom, 20),
      validTo,
      sanctionedStrength: num(body.sanctionedStrength),
      holderName: s(body.holderName, 120),
      documentUrl: s(body.documentUrl, 500),
      status,
      notes: s(body.notes, 2000),
      responsibleOfficer: s(body.responsibleOfficer, 120) || name,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdByEmail: existing?.createdByEmail || email,
    }
    if (!isMgmt && session.branchId) row.branchId = session.branchId
    await upsertLicBranch(row)
    return json(res, 200, { ok: true, licence: row })
  }

  if (action === 'listLabourLicences') {
    let rows = filterBranch(await getLicLabour()).map((r) => refreshLicenceStatus(r))
    const q = s(body.q, 80).toLowerCase()
    if (q) {
      rows = rows.filter((r) =>
        [r.clientName, r.siteName, r.licenceNo, r.licenceFor, r.authority].join(' ').toLowerCase().includes(q),
      )
    }
    return json(res, 200, { ok: true, licences: rows.slice(0, 1000) })
  }

  if (action === 'saveLabourLicence') {
    const id = s(body.id, 40) || licNid('ll')
    const existing = (await getLicLabour()).find((x) => x.id === id)
    const validTo = s(body.validTo, 20)
    let status = (s(body.status, 20) as LicStatus) || 'Active'
    if (status !== 'Suspended' && status !== 'Applied') {
      status = refreshLicenceStatus({ validTo, status }).status as LicStatus
    }
    const row: LicLabourLicence = {
      id,
      authority: (s(body.authority, 20) as LicLabourAuthority) || 'State',
      clientId: s(body.clientId, 40),
      clientName: s(body.clientName, 160),
      siteName: s(body.siteName, 160),
      branchId: s(body.branchId, 40) || session.branchId || '',
      branchName: s(body.branchName, 120),
      licenceNo: s(body.licenceNo, 80),
      licenceFor: s(body.licenceFor, 240),
      sanctionedStrength: num(body.sanctionedStrength),
      validFrom: s(body.validFrom, 20),
      validTo,
      issuingAuthority: s(body.issuingAuthority, 160),
      documentUrl: s(body.documentUrl, 500),
      status,
      notes: s(body.notes, 2000),
      responsibleOfficer: s(body.responsibleOfficer, 120) || name,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdByEmail: existing?.createdByEmail || email,
    }
    if (!isMgmt && session.branchId) row.branchId = session.branchId
    await upsertLicLabour(row)
    return json(res, 200, { ok: true, licence: row })
  }

  if (action === 'clientSummary') {
    const labour = filterBranch(await getLicLabour()).map((r) => refreshLicenceStatus(r))
    const map: Record<
      string,
      { clientName: string; branchName: string; count: number; strength: number; nextExpiry: string }
    > = {}
    for (const L of labour) {
      const key = `${L.branchId}|${L.clientName}`
      if (!map[key]) {
        map[key] = {
          clientName: L.clientName,
          branchName: L.branchName,
          count: 0,
          strength: 0,
          nextExpiry: L.validTo || '',
        }
      }
      map[key].count++
      map[key].strength += L.sanctionedStrength || 0
      if (L.validTo && (!map[key].nextExpiry || L.validTo < map[key].nextExpiry)) {
        map[key].nextExpiry = L.validTo
      }
    }
    return json(res, 200, {
      ok: true,
      clients: Object.values(map).sort((a, b) => a.clientName.localeCompare(b.clientName)),
    })
  }

  if (action === 'alerts') {
    const alerts = await collectLicAlerts()
    return json(res, 200, { ok: true, alerts: alerts.slice(0, 120) })
  }

  return json(res, 400, { error: 'Unknown action.' })
}
