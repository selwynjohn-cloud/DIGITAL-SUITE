/**
 * Agile Facilities — renewal / tax / maintenance alert windows + digest mail.
 */

import { Resend } from 'resend'
import { LOKESH_CC_EMAIL } from '../mis/branch-mail-cc.js'
import { pinMailFrom, sendSuiteEmail, suiteDirectorEmail } from '../suite-mail.js'
import { getFacLeases, getFacTaxes, getFacWorkOrders } from './store.js'
import type { FacAlert, FacLease, FacTaxItem, FacWorkOrder } from './types.js'

function daysUntil(isoDate: string, now = Date.now()): number {
  const t = new Date(String(isoDate || '').slice(0, 10) + 'T12:00:00+05:30').getTime()
  if (!Number.isFinite(t)) return 9999
  return Math.ceil((t - now) / 86_400_000)
}

const LEASE_WINDOWS = [90, 60, 30, 15]
const TAX_WINDOWS = [30, 7]

export function leaseAlerts(leases: FacLease[], now = Date.now()): FacAlert[] {
  const out: FacAlert[] = []
  for (const L of leases) {
    if (L.status !== 'Active') continue
    const d = daysUntil(L.expiryDate, now)
    const hit = LEASE_WINDOWS.find((w) => d === w) || (d < 0 ? -1 : d <= 15 ? 15 : null)
    if (hit == null && d > 90) continue
    if (d > 90) continue
    const sev = d <= 15 ? 'critical' : d <= 30 ? 'warn' : 'info'
    out.push({
      id: `lease-${L.id}-${d}`,
      kind: 'lease',
      severity: sev,
      propertyName: L.propertyName,
      branchName: L.branchName,
      dueDate: L.expiryDate,
      actionRequired: d < 0 ? 'Lease expired — renew or terminate' : `Lease renewal due in ${d} days`,
      responsibleOfficer: L.responsibleOfficer || 'Facility Manager',
      refId: L.id,
      daysLeft: d,
    })
  }
  return out.sort((a, b) => a.daysLeft - b.daysLeft)
}

export function taxAlerts(taxes: FacTaxItem[], now = Date.now()): FacAlert[] {
  const out: FacAlert[] = []
  for (const T of taxes) {
    if (T.status === 'Paid') continue
    const d = daysUntil(T.dueDate, now)
    const overdue = d < 0
    const inWindow = TAX_WINDOWS.includes(d) || d <= 7
    if (!overdue && !inWindow && d > 30) continue
    out.push({
      id: `tax-${T.id}-${d}`,
      kind: 'tax',
      severity: overdue || d <= 7 ? 'critical' : 'warn',
      propertyName: T.propertyName,
      branchName: T.branchName,
      dueDate: T.dueDate,
      actionRequired: overdue
        ? `Overdue ${T.kind} payment — avoid penalty`
        : `Pay ${T.kind} in ${d} days (₹${T.amountDue || 0})`,
      responsibleOfficer: T.responsibleOfficer || 'Finance',
      refId: T.id,
      daysLeft: d,
    })
  }
  return out.sort((a, b) => a.daysLeft - b.daysLeft)
}

export function maintAlerts(orders: FacWorkOrder[], now = Date.now()): FacAlert[] {
  const out: FacAlert[] = []
  for (const W of orders) {
    if (W.status === 'Closed') continue
    const due = W.nextServiceDate || W.scheduledDate
    const d = daysUntil(due, now)
    if (W.status === 'Open' || W.status === 'InProgress') {
      out.push({
        id: `wo-${W.id}`,
        kind: 'maintenance',
        severity: W.status === 'Open' && d <= 3 ? 'critical' : 'warn',
        propertyName: W.propertyName,
        branchName: W.branchName,
        dueDate: due,
        actionRequired: `${W.title || W.kind} — ${W.status}`,
        responsibleOfficer: W.responsibleOfficer || 'Facility Manager',
        refId: W.id,
        daysLeft: d,
      })
    }
  }
  return out.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 80)
}

export async function collectFacAlerts(): Promise<FacAlert[]> {
  const [leases, taxes, orders] = await Promise.all([getFacLeases(), getFacTaxes(), getFacWorkOrders()])
  return [...leaseAlerts(leases), ...taxAlerts(taxes), ...maintAlerts(orders)].slice(0, 120)
}

/** Daily digest to Director + Lokesh (IT never copied). */
export async function sendFacilitiesAlertDigest(): Promise<{ ok: boolean; count: number }> {
  const alerts = await collectFacAlerts()
  const hot = alerts.filter((a) => a.severity === 'critical' || a.daysLeft <= 30)
  if (!hot.length) return { ok: true, count: 0 }
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, count: hot.length }
  try {
    const resend = new Resend(apiKey)
    const to = suiteDirectorEmail() || 'director@agilegroup.co.in'
    const cc = [LOKESH_CC_EMAIL].filter((e) => e && e !== to)
    const rows = hot
      .slice(0, 40)
      .map(
        (a) =>
          `<tr><td>${a.kind}</td><td>${a.propertyName}</td><td>${a.branchName}</td><td>${a.dueDate}</td><td>${a.actionRequired}</td><td>${a.responsibleOfficer}</td></tr>`,
      )
      .join('')
    await sendSuiteEmail(resend, {
      from: pinMailFrom(),
      to,
      cc: cc.length ? cc : undefined,
      subject: `Agile Facilities alerts — ${hot.length} action(s)`,
      html: `<div style="font-family:Arial,sans-serif;max-width:720px">
        <h2>Agile Facilities — upcoming actions</h2>
        <p>${hot.length} lease / tax / maintenance item(s) need attention.</p>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:13px;width:100%">
          <thead><tr><th>Kind</th><th>Property</th><th>Branch</th><th>Due</th><th>Action</th><th>Officer</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="font-size:12px;color:#64748b">Agile Facilities · Director only (IT not copied)</p>
      </div>`,
      skipDirectorCc: true,
    })
    return { ok: true, count: hot.length }
  } catch {
    return { ok: false, count: hot.length }
  }
}
