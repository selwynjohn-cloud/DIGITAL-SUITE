/**
 * Agile Facilities — data API (Staff + Management).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import { isSuiteAdminEmail, normaliseEmail } from '../_lib/auth.js'
import { collectFacAlerts } from '../_lib/facilities/alerts.js'
import {
  facNid,
  facStorageOk,
  getFacLeases,
  getFacProperties,
  getFacTaxes,
  getFacWorkOrders,
  nextFacPropertyCode,
  upsertFacLease,
  upsertFacProperty,
  upsertFacTax,
  upsertFacWorkOrder,
} from '../_lib/facilities/store.js'
import type {
  FacLease,
  FacMaintKind,
  FacProperty,
  FacPropertyStatus,
  FacTaxItem,
  FacTaxKind,
  FacTenure,
  FacUsage,
  FacWorkOrder,
} from '../_lib/facilities/types.js'
import { FAC_MAINT_KINDS, FAC_TAX_KINDS, FAC_USAGES } from '../_lib/facilities/types.js'
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  const body = (req.body ?? {}) as Record<string, unknown>
  const action = s(body.action, 60)

  if (action === 'status') {
    return json(res, 200, { ok: true, storage: facStorageOk() })
  }

  const session = await verifyAppSession(String(body.sessionToken ?? ''), 'facilities')
  if (!session) {
    return json(res, 401, { error: 'Please sign in with your work email / branch login.' })
  }
  const email = normaliseEmail(session.email)
  const name = await resolveSuiteUserName(email)
  const portal = String(body.portal || session.role || 'staff') === 'management' ? 'management' : 'staff'
  const isMgmt = portal === 'management' || isSuiteAdminEmail(email)
  const branchId = isMgmt ? s(body.branchId, 40) : session.branchId || s(body.branchId, 40)

  if (action === 'bootstrap') {
    const branches = await getBranches(true)
    return json(res, 200, {
      ok: true,
      email,
      name,
      portal,
      isMgmt,
      branchId: session.branchId || '',
      storage: facStorageOk(),
      usages: FAC_USAGES,
      taxKinds: FAC_TAX_KINDS,
      maintKinds: FAC_MAINT_KINDS,
      branches: branches.map((b) => ({ id: b.id, name: b.name })),
    })
  }

  const filterBranch = <T extends { branchId?: string }>(rows: T[]) => {
    if (isMgmt && !branchId) return rows
    const bid = branchId || session.branchId || ''
    if (!bid) return rows
    return rows.filter((r) => !r.branchId || r.branchId === bid)
  }

  if (action === 'dashboard') {
    const [props, leases, taxes, orders, alerts] = await Promise.all([
      getFacProperties(),
      getFacLeases(),
      getFacTaxes(),
      getFacWorkOrders(),
      collectFacAlerts(),
    ])
    const P = filterBranch(props)
    const L = filterBranch(leases)
    const T = filterBranch(taxes)
    const W = filterBranch(orders)
    const A = filterBranch(alerts.map((a) => ({ ...a, branchId: '' }))).length
      ? alerts.filter((a) => {
          if (isMgmt && !branchId) return true
          const bid = branchId || session.branchId || ''
          if (!bid) return true
          return a.branchName && P.some((p) => p.name === a.propertyName || p.branchId === bid)
        })
      : alerts
    const activeLeases = L.filter((x) => x.status === 'Active')
    const monthlyOutflow = activeLeases.reduce((sum, x) => sum + (x.monthlyRent || 0), 0)
    return json(res, 200, {
      ok: true,
      kpis: {
        properties: P.length,
        activeLeases: activeLeases.length,
        monthlyOutflow,
        pendingTaxes: T.filter((x) => x.status !== 'Paid').length,
        openWorkOrders: W.filter((x) => x.status !== 'Closed').length,
        alerts: A.length,
      },
      alerts: A.slice(0, 40),
      renewals: A.filter((a) => a.kind === 'lease').slice(0, 20),
      pendingTaxes: A.filter((a) => a.kind === 'tax').slice(0, 20),
      openMaint: A.filter((a) => a.kind === 'maintenance').slice(0, 20),
    })
  }

  if (action === 'listProperties') {
    return json(res, 200, { ok: true, properties: filterBranch(await getFacProperties()).slice(0, 500) })
  }

  if (action === 'saveProperty') {
    const id = s(body.id, 40) || facNid('fp')
    const existing = (await getFacProperties()).find((x) => x.id === id)
    const code = existing?.propertyCode || (await nextFacPropertyCode())
    const row: FacProperty = {
      id,
      propertyCode: code,
      name: s(body.name, 160) || 'Unnamed property',
      address: s(body.address, 400),
      city: s(body.city, 80),
      areaSqFt: num(body.areaSqFt),
      tenure: (s(body.tenure, 20) as FacTenure) || 'Leased',
      usage: (s(body.usage, 40) as FacUsage) || 'BranchOffice',
      status: (s(body.status, 40) as FacPropertyStatus) || 'Active',
      landlordName: s(body.landlordName, 120),
      landlordPhone: s(body.landlordPhone, 40),
      landlordEmail: s(body.landlordEmail, 120),
      ownerName: s(body.ownerName, 120),
      branchId: s(body.branchId, 40) || session.branchId || '',
      branchName: s(body.branchName, 120),
      notes: s(body.notes, 2000),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdByEmail: existing?.createdByEmail || email,
    }
    if (!isMgmt && session.branchId) {
      row.branchId = session.branchId
    }
    await upsertFacProperty(row)
    return json(res, 200, { ok: true, property: row })
  }

  if (action === 'listLeases') {
    return json(res, 200, { ok: true, leases: filterBranch(await getFacLeases()).slice(0, 500) })
  }

  if (action === 'saveLease') {
    const id = s(body.id, 40) || facNid('fl')
    const existing = (await getFacLeases()).find((x) => x.id === id)
    const row: FacLease = {
      id,
      propertyId: s(body.propertyId, 40),
      propertyName: s(body.propertyName, 160),
      branchId: s(body.branchId, 40) || session.branchId || '',
      branchName: s(body.branchName, 120),
      startDate: s(body.startDate, 20),
      expiryDate: s(body.expiryDate, 20),
      monthlyRent: num(body.monthlyRent),
      securityDeposit: num(body.securityDeposit),
      escalationPct: num(body.escalationPct),
      noticePeriodDays: num(body.noticePeriodDays) || 30,
      landlordName: s(body.landlordName, 120),
      landlordPhone: s(body.landlordPhone, 40),
      landlordEmail: s(body.landlordEmail, 120),
      documentUrl: s(body.documentUrl, 500),
      documentNote: s(body.documentNote, 400),
      status: (s(body.status, 20) as FacLease['status']) || 'Active',
      responsibleOfficer: s(body.responsibleOfficer, 120) || name,
      responsibleEmail: s(body.responsibleEmail, 120) || email,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await upsertFacLease(row)
    return json(res, 200, { ok: true, lease: row })
  }

  if (action === 'listTaxes') {
    return json(res, 200, { ok: true, taxes: filterBranch(await getFacTaxes()).slice(0, 500) })
  }

  if (action === 'saveTax') {
    const id = s(body.id, 40) || facNid('ft')
    const existing = (await getFacTaxes()).find((x) => x.id === id)
    const due = s(body.dueDate, 20)
    const paidAt = s(body.paidAt, 40)
    let status = (s(body.status, 20) as FacTaxItem['status']) || 'Pending'
    if (paidAt) status = 'Paid'
    else if (due && new Date(due).getTime() < Date.now()) status = 'Overdue'
    const row: FacTaxItem = {
      id,
      propertyId: s(body.propertyId, 40),
      propertyName: s(body.propertyName, 160),
      branchId: s(body.branchId, 40) || session.branchId || '',
      branchName: s(body.branchName, 120),
      kind: (s(body.kind, 40) as FacTaxKind) || 'PropertyTax',
      authority: s(body.authority, 160),
      amountDue: num(body.amountDue),
      dueDate: due,
      paidAt,
      status,
      responsibleOfficer: s(body.responsibleOfficer, 120) || name,
      notes: s(body.notes, 1000),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await upsertFacTax(row)
    return json(res, 200, { ok: true, tax: row })
  }

  if (action === 'listWorkOrders') {
    return json(res, 200, { ok: true, workOrders: filterBranch(await getFacWorkOrders()).slice(0, 500) })
  }

  if (action === 'saveWorkOrder') {
    const id = s(body.id, 40) || facNid('fw')
    const existing = (await getFacWorkOrders()).find((x) => x.id === id)
    const row: FacWorkOrder = {
      id,
      propertyId: s(body.propertyId, 40),
      propertyName: s(body.propertyName, 160),
      branchId: s(body.branchId, 40) || session.branchId || '',
      branchName: s(body.branchName, 120),
      kind: (s(body.kind, 40) as FacMaintKind) || 'Other',
      title: s(body.title, 200) || 'Work order',
      detail: s(body.detail, 2000),
      vendorName: s(body.vendorName, 160),
      vendorBillRef: s(body.vendorBillRef, 120),
      cost: num(body.cost),
      scheduledDate: s(body.scheduledDate, 20),
      completedDate: s(body.completedDate, 20),
      recurring: (s(body.recurring, 20) as FacWorkOrder['recurring']) || '',
      nextServiceDate: s(body.nextServiceDate, 20),
      status: (s(body.status, 20) as FacWorkOrder['status']) || 'Open',
      responsibleOfficer: s(body.responsibleOfficer, 120) || name,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await upsertFacWorkOrder(row)
    return json(res, 200, { ok: true, workOrder: row })
  }

  if (action === 'reports') {
    const [props, leases, orders] = await Promise.all([
      getFacProperties(),
      getFacLeases(),
      getFacWorkOrders(),
    ])
    const L = filterBranch(leases).filter((x) => x.status === 'Active')
    const monthlyOutflow = L.reduce((sum, x) => sum + (x.monthlyRent || 0), 0)
    return json(res, 200, {
      ok: true,
      activeLeases: L,
      monthlyOutflow,
      properties: filterBranch(props),
      maintenanceLogs: filterBranch(orders).slice(0, 200),
    })
  }

  if (action === 'alerts') {
    const alerts = await collectFacAlerts()
    const filtered =
      isMgmt && !branchId
        ? alerts
        : alerts.filter((a) => {
            const bid = branchId || session.branchId || ''
            if (!bid) return true
            return !a.branchName || a.branchName.length > 0
          })
    return json(res, 200, { ok: true, alerts: filtered.slice(0, 100) })
  }

  return json(res, 400, { error: 'Unknown action.' })
}
