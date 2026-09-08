/**
 * Agile Licenses — renewal windows + Director digest.
 */

import { Resend } from 'resend'
import { LOKESH_CC_EMAIL } from '../mis/branch-mail-cc.js'
import { pinMailFrom, sendSuiteEmail, suiteDirectorEmail } from '../suite-mail.js'
import { getLicBranch, getLicLabour } from './store.js'
import { branchKindLabel, type LicAlert, type LicBranchLicence, type LicLabourLicence } from './types.js'

const WINDOWS = [90, 60, 30, 15, 7]

function daysUntil(isoDate: string, now = Date.now()): number {
  const t = new Date(String(isoDate || '').slice(0, 10) + 'T12:00:00+05:30').getTime()
  if (!Number.isFinite(t)) return 9999
  return Math.ceil((t - now) / 86_400_000)
}

function statusFromDates(validTo: string, current: string): string {
  const d = daysUntil(validTo)
  if (d < 0) return 'Expired'
  return current || 'Active'
}

export function refreshLicenceStatus<T extends { validTo: string; status: string }>(row: T): T {
  if (row.status === 'Suspended' || row.status === 'Applied') return row
  const d = daysUntil(row.validTo)
  if (d < 0) return { ...row, status: 'Expired' }
  return { ...row, status: 'Active' }
}

function branchAlerts(rows: LicBranchLicence[], now = Date.now()): LicAlert[] {
  const out: LicAlert[] = []
  for (const L of rows) {
    if (L.status === 'Suspended') continue
    const d = daysUntil(L.validTo, now)
    if (d > 90 && L.status !== 'Expired') continue
    const sev = d < 0 || d <= 15 ? 'critical' : d <= 30 ? 'warn' : 'info'
    out.push({
      id: `br-${L.id}-${d}`,
      kind: 'branch',
      severity: sev,
      title: branchKindLabel(L.kind),
      branchName: L.branchName,
      clientName: '',
      licenceNo: L.licenceNo,
      dueDate: L.validTo,
      actionRequired:
        d < 0
          ? `${branchKindLabel(L.kind)} expired — renew urgently`
          : `Renew ${branchKindLabel(L.kind)} in ${d} days`,
      daysLeft: d,
      refId: L.id,
    })
  }
  return out
}

function labourAlerts(rows: LicLabourLicence[], now = Date.now()): LicAlert[] {
  const out: LicAlert[] = []
  for (const L of rows) {
    if (L.status === 'Suspended') continue
    const d = daysUntil(L.validTo, now)
    if (d > 90 && L.status !== 'Expired') continue
    const sev = d < 0 || d <= 15 ? 'critical' : d <= 30 ? 'warn' : 'info'
    out.push({
      id: `lb-${L.id}-${d}`,
      kind: 'labour',
      severity: sev,
      title: `${L.authority} Labour — ${L.clientName}`,
      branchName: L.branchName,
      clientName: L.clientName,
      licenceNo: L.licenceNo,
      dueDate: L.validTo,
      actionRequired:
        d < 0
          ? `Labour licence expired for ${L.clientName}`
          : `Renew labour licence (${L.authority}) in ${d} days — ${L.clientName}`,
      daysLeft: d,
      refId: L.id,
    })
  }
  return out
}

export async function collectLicAlerts(): Promise<LicAlert[]> {
  const [branch, labour] = await Promise.all([getLicBranch(), getLicLabour()])
  return [...branchAlerts(branch), ...labourAlerts(labour)]
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 150)
}

export async function sendLicencesAlertDigest(): Promise<{ ok: boolean; count: number }> {
  const alerts = await collectLicAlerts()
  const hot = alerts.filter((a) => a.severity === 'critical' || WINDOWS.includes(a.daysLeft) || a.daysLeft <= 30)
  if (!hot.length) return { ok: true, count: 0 }
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, count: hot.length }
  try {
    const resend = new Resend(apiKey)
    const to = suiteDirectorEmail() || 'director@agilegroup.co.in'
    const cc = [LOKESH_CC_EMAIL].filter((e) => e && e !== to)
    const rows = hot
      .slice(0, 50)
      .map(
        (a) =>
          `<tr><td>${a.kind}</td><td>${a.title}</td><td>${a.branchName}</td><td>${a.clientName || '—'}</td><td>${a.licenceNo}</td><td>${a.dueDate}</td><td>${a.actionRequired}</td></tr>`,
      )
      .join('')
    await sendSuiteEmail(resend, {
      from: pinMailFrom(),
      to,
      cc: cc.length ? cc : undefined,
      subject: `Agile Licenses renewals — ${hot.length} action(s)`,
      html: `<div style="font-family:Arial,sans-serif;max-width:760px">
        <h2>Agile Licenses — renewal reminders</h2>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:13px;width:100%">
          <thead><tr><th>Type</th><th>Licence</th><th>Branch</th><th>Client</th><th>No.</th><th>Valid to</th><th>Action</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="font-size:12px;color:#64748b">Agile Licenses · Director only (IT not copied)</p>
      </div>`,
      skipDirectorCc: true,
    })
    return { ok: true, count: hot.length }
  } catch {
    return { ok: false, count: hot.length }
  }
}

export { statusFromDates }
