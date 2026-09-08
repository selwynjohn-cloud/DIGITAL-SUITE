/**
 * Agile HR Audit — reminders for SLA dates, pending docs, open issues.
 */

import { Resend } from 'resend'
import { LOKESH_CC_EMAIL } from '../mis/branch-mail-cc.js'
import { pinMailFrom, sendSuiteEmail, suiteDirectorEmail } from '../suite-mail.js'
import { getHraAudits, getHraIssues, getHraProfiles } from './store.js'
import type { HraAlert, HraAudit, HraClientProfile, HraIssue } from './types.js'

const WINDOWS = [14, 7, 3, 1]

function daysUntil(isoDate: string, now = Date.now()): number {
  const t = new Date(String(isoDate || '').slice(0, 10) + 'T12:00:00+05:30').getTime()
  if (!Number.isFinite(t)) return 9999
  return Math.ceil((t - now) / 86_400_000)
}

function profileAlerts(rows: HraClientProfile[], now = Date.now()): HraAlert[] {
  const out: HraAlert[] = []
  for (const p of rows) {
    if (!p.active) continue
    const due = p.nextAuditDate
    if (!due) continue
    const d = daysUntil(due, now)
    if (d > 14) continue
    const sev = d < 0 || d <= 3 ? 'critical' : d <= 7 ? 'warn' : 'info'
    out.push({
      id: `pr-${p.id}-${d}`,
      kind: 'audit',
      severity: sev,
      title: `${p.cadence} HR audit — ${p.clientCode || p.clientName}`,
      branchName: p.branchName,
      clientName: p.clientName,
      dueDate: due,
      actionRequired:
        d < 0
          ? `SLA / HR audit overdue by ${Math.abs(d)} day(s) — schedule & submit pack`
          : `Prepare statutory pack (PF, ESIC, wages…) — audit in ${d} day(s)`,
      daysLeft: d,
      refId: p.id,
    })
  }
  return out
}

function documentAlerts(rows: HraAudit[], now = Date.now()): HraAlert[] {
  const out: HraAlert[] = []
  for (const a of rows) {
    if (a.status === 'Closed' || a.status === 'Submitted') continue
    const pending = (a.documents || []).filter((d) => d.status === 'Pending' || d.status === 'Rejected')
    if (!pending.length) continue
    const d = daysUntil(a.auditDate, now)
    if (d > 14 && a.status === 'Planned') continue
    const sev = d < 0 || d <= 3 ? 'critical' : 'warn'
    out.push({
      id: `doc-${a.id}`,
      kind: 'document',
      severity: sev,
      title: `${pending.length} document(s) pending — ${a.clientName}`,
      branchName: a.branchName,
      clientName: a.clientName,
      dueDate: a.auditDate,
      actionRequired: `Submit: ${pending
        .slice(0, 4)
        .map((x) => x.label)
        .join(', ')}${pending.length > 4 ? '…' : ''}`,
      daysLeft: d,
      refId: a.id,
    })
  }
  return out
}

function issueAlerts(rows: HraIssue[], now = Date.now()): HraAlert[] {
  const out: HraAlert[] = []
  for (const i of rows) {
    if (i.status === 'Closed') continue
    const d = daysUntil(i.dueDate, now)
    if (d > 14) continue
    const sev = d < 0 || i.severity === 'High' ? 'critical' : d <= 3 ? 'warn' : 'info'
    out.push({
      id: `is-${i.id}-${d}`,
      kind: 'issue',
      severity: sev,
      title: i.title,
      branchName: i.branchName,
      clientName: i.clientName,
      dueDate: i.dueDate,
      actionRequired:
        d < 0
          ? `Close pending issue (overdue ${Math.abs(d)} day(s)) — ${i.severity}`
          : `Close pending issue in ${d} day(s) — ${i.severity}`,
      daysLeft: d,
      refId: i.id,
    })
  }
  return out
}

export async function collectHraAlerts(): Promise<HraAlert[]> {
  const [profiles, audits, issues] = await Promise.all([
    getHraProfiles(),
    getHraAudits(),
    getHraIssues(),
  ])
  return [...profileAlerts(profiles), ...documentAlerts(audits), ...issueAlerts(issues)]
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 200)
}

export async function sendHraAlertDigest(): Promise<{ ok: boolean; count: number }> {
  const alerts = await collectHraAlerts()
  const hot = alerts.filter(
    (a) => a.severity === 'critical' || WINDOWS.includes(a.daysLeft) || a.daysLeft <= 7,
  )
  if (!hot.length) return { ok: true, count: 0 }
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, count: hot.length }
  try {
    const resend = new Resend(apiKey)
    const to = suiteDirectorEmail() || 'director@agilegroup.co.in'
    const cc = [LOKESH_CC_EMAIL].filter((e) => e && e !== to)
    const rows = hot
      .slice(0, 60)
      .map(
        (a) =>
          `<tr><td>${a.kind}</td><td>${a.title}</td><td>${a.branchName}</td><td>${a.clientName}</td><td>${a.dueDate}</td><td>${a.actionRequired}</td></tr>`,
      )
      .join('')
    await sendSuiteEmail(resend, {
      from: pinMailFrom(),
      to,
      cc: cc.length ? cc : undefined,
      subject: `Agile HR Audit reminders — ${hot.length} action(s)`,
      html: `<div style="font-family:Arial,sans-serif;max-width:760px">
        <h2>Agile HR Audit — reminders</h2>
        <p>Strategic clients · Monthly (e.g. KRC defined date) / Quarterly (e.g. HDFC) · PF, ESIC, wages &amp; statutory pack</p>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:13px;width:100%">
          <thead><tr><th>Type</th><th>Item</th><th>Branch</th><th>Client</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="font-size:12px;color:#64748b">Agile HR Audit · Director only (IT not copied)</p>
      </div>`,
      skipDirectorCc: true,
    })
    return { ok: true, count: hot.length }
  } catch {
    return { ok: false, count: hot.length }
  }
}

export { daysUntil }
