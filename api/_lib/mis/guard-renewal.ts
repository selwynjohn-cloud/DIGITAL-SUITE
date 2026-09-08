/**
 * Guard ID Card / PVC / Medical renewal reminders — popup data + weekly HOD emails.
 */

import { Resend } from 'resend'
import { withoutNoMailRecipients } from '../auth.js'
import { misReminderMailWrap } from './brand.js'
import { getAllHodEmails } from './digest.js'
import { istNow, misTodayIst } from './dates.js'
import { pinMailFrom, pinMailReplyTo, sendSuiteEmail, suiteDirectorEmail } from '../suite-mail.js'
import { getBranches, getMisReportBranches, getGuardDocs, getUsers, guardRecordEligible, type MisGuardDoc } from './store.js'

export const GUARD_RECRUITMENT_CC = 'recruitment@agilegroup.co.in'

export type GuardRenewalKind = 'ID Card' | 'PVC' | 'Medical'

export type GuardRenewalRow = {
  guardName: string
  employeeId: string
  unitName: string
  docType: GuardRenewalKind
  renewalDate: string
  renewalIso: string
  daysLeft: number
  expired: boolean
}

/** Parse guard date strings (YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY). */
export function parseGuardDate(v: string): Date | null {
  const s = String(v ?? '').trim()
  if (!s) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(`${s}T12:00:00+05:30`)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (m) {
    const dd = m[1].padStart(2, '0')
    const mo = m[2].padStart(2, '0')
    let y = m[3]
    if (y.length === 2) y = `20${y}`
    const d = new Date(`${y}-${mo}-${dd}T12:00:00+05:30`)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

/** Display as DD-MM-YYYY. */
export function formatGuardDateDisplay(v: string): string {
  const d = parseGuardDate(v)
  if (!d) return String(v ?? '').trim()
  const dd = String(d.getDate()).padStart(2, '0')
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}-${mo}-${d.getFullYear()}`
}

function toIsoDate(v: string): string {
  const d = parseGuardDate(v)
  if (!d) return ''
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

/** Issue date + 1 calendar year → DD-MM-YYYY validity. */
export function addOneYearFromIssue(issueDate: string): string {
  const iso = toIsoDate(issueDate)
  if (!iso) return ''
  const p = iso.split('-')
  const d = new Date(`${Number(p[0]) + 1}-${p[1]}-${p[2]}T12:00:00+05:30`)
  if (Number.isNaN(d.getTime())) return ''
  return formatGuardDateDisplay(d.toISOString().slice(0, 10))
}

export function effectiveIdCardValidity(doc: MisGuardDoc): string {
  const v = String(doc.idCardValidity ?? '').trim()
  if (v) return v
  const issue = String(doc.idCardIssueDate ?? '').trim()
  if (issue) return addOneYearFromIssue(issue)
  return ''
}

export function normalizeGuardDocOnSave(doc: MisGuardDoc): MisGuardDoc {
  const out = { ...doc }
  const issue = String(out.idCardIssueDate ?? '').trim()
  const validity = String(out.idCardValidity ?? '').trim()
  if (issue && !validity) out.idCardValidity = addOneYearFromIssue(issue)
  return out
}

function daysUntil(expiry: Date, today: Date): number {
  const ms = expiry.getTime() - today.getTime()
  return Math.round(ms / 86400000)
}

/** Renewal rows for popup (30 days) or weekly mail (60 days + expired). */
export function collectGuardRenewals(
  docs: MisGuardDoc[],
  opts?: { withinDays?: number; mailMode?: boolean },
): GuardRenewalRow[] {
  const withinDays = opts?.withinDays ?? (opts?.mailMode ? 60 : 30)
  const today = istNow()
  today.setHours(0, 0, 0, 0)
  const rows: GuardRenewalRow[] = []

  for (const d of docs) {
    if (!guardRecordEligible(d)) continue
    const base = {
      guardName: String(d.guardName ?? '').trim(),
      employeeId: String(d.employeeId ?? '').trim(),
      unitName: String(d.unitName ?? '').trim(),
    }

    const checks: { kind: GuardRenewalKind; dateStr: string }[] = [
      { kind: 'ID Card', dateStr: effectiveIdCardValidity(d) },
      { kind: 'PVC', dateStr: String(d.pvcValidity ?? '').trim() },
      { kind: 'Medical', dateStr: String(d.medicalValidity ?? '').trim() },
    ]

    for (const c of checks) {
      if (!c.dateStr) continue
      const exp = parseGuardDate(c.dateStr)
      if (!exp) continue
      exp.setHours(0, 0, 0, 0)
      const left = daysUntil(exp, today)
      const expired = left < 0
      if (!expired && left > withinDays) continue
      rows.push({
        ...base,
        docType: c.kind,
        renewalDate: formatGuardDateDisplay(c.dateStr),
        renewalIso: toIsoDate(c.dateStr),
        daysLeft: left,
        expired,
      })
    }
  }

  rows.sort((a, b) => {
    if (a.expired !== b.expired) return a.expired ? -1 : 1
    return a.daysLeft - b.daysLeft
  })
  return rows
}

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function buildGuardRenewalEmailHtml(branchName: string, rows: GuardRenewalRow[], asOf: string): string {
  const expired = rows.filter((r) => r.expired).length
  const dueSoon = rows.length - expired
  const tableRows = rows.length
    ? rows
        .map((r) => {
          const status = r.expired
            ? '<span style="color:#ef4444;font-weight:800">EXPIRED</span>'
            : `<span style="color:#d97706;font-weight:800">Due in ${r.daysLeft} day${r.daysLeft === 1 ? '' : 's'}</span>`
          return `<tr>
            <td style="padding:8px;border:1px solid #334155">${esc(r.guardName)}</td>
            <td style="padding:8px;border:1px solid #334155">${esc(r.employeeId || '—')}</td>
            <td style="padding:8px;border:1px solid #334155">${esc(r.unitName || '—')}</td>
            <td style="padding:8px;border:1px solid #334155">${esc(r.docType)}</td>
            <td style="padding:8px;border:1px solid #334155">${esc(r.renewalDate)}</td>
            <td style="padding:8px;border:1px solid #334155">${status}</td>
          </tr>`
        })
        .join('')
    : `<tr><td colspan="6" style="padding:14px;border:1px solid #334155;text-align:center;color:#94a3b8">No renewals due in the next 60 days.</td></tr>`

  const inner = `
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6">Dear Branch HOD,</p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6">Weekly guard compliance renewal reminder for <b>${esc(branchName)}</b> as on <b>${esc(asOf)}</b>.</p>
    <p style="margin:0 0 14px;font-size:14px;line-height:1.6">
      <b style="color:#ef4444">${expired}</b> expired ·
      <b style="color:#d97706">${dueSoon}</b> due within 60 days.
      Please arrange ID Card / PVC / Medical renewals and update the Guard Compliance register after completion.
    </p>
    <table style="border-collapse:collapse;width:100%;font-size:13px;margin:12px 0">
      <thead><tr style="background:#0e1730;color:#c9a84c">
        <th style="padding:8px;border:1px solid #334155;text-align:left">Guard Name</th>
        <th style="padding:8px;border:1px solid #334155">Emp ID</th>
        <th style="padding:8px;border:1px solid #334155;text-align:left">Unit</th>
        <th style="padding:8px;border:1px solid #334155">Document</th>
        <th style="padding:8px;border:1px solid #334155">Renewal Date</th>
        <th style="padding:8px;border:1px solid #334155">Status</th>
      </tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
    <p style="margin:14px 0 0;font-size:13px;color:#64748b">Open Guard Compliance in the HOD portal → Compliance (PVC/MC) to update records.</p>`

  return misReminderMailWrap('Guard Compliance — Renewal Reminder', inner)
}

export async function sendGuardRenewalWeeklyReminders(opts?: { asOf?: string; force?: boolean }) {
  const asOf = opts?.asOf ?? misTodayIst()
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not configured' }

  const resend = new Resend(apiKey)
  const from = pinMailFrom()
  const replyTo = pinMailReplyTo()
  const director = suiteDirectorEmail()
  const recruitment = GUARD_RECRUITMENT_CC
  const ccBase = withoutNoMailRecipients(
    Array.from(new Set([recruitment, director].map((e) => e.trim().toLowerCase()).filter((e) => e.includes('@')))),
  )

  const [branches, users] = await Promise.all([getMisReportBranches(true), getUsers()])
  const sent: { branch: string; to: string[]; count: number }[] = []
  const skipped: string[] = []

  for (const b of branches) {
    const docs = await getGuardDocs(b.id)
    const rows = collectGuardRenewals(docs, { mailMode: true })
    const hodTo = withoutNoMailRecipients(await getHodEmailsForBranch(b.id, users, branches))
    const to = hodTo.length ? hodTo : []
    if (!to.length && !rows.length) {
      skipped.push(b.name)
      continue
    }
    if (!to.length) {
      skipped.push(`${b.name} (no HOD email)`)
      continue
    }
    if (!rows.length && !opts?.force) {
      skipped.push(`${b.name} (no renewals due)`)
      continue
    }

    const subject = `Agile MIS — ${b.name} — Guard Renewal Reminder (${asOf})`
    const html = buildGuardRenewalEmailHtml(b.name, rows, asOf)
    const result = await sendSuiteEmail(resend, {
      from,
      to,
      cc: ccBase,
      replyTo,
      subject,
      html,
      skipDirectorCc: true,
    })
    if (result.error) {
      return { ok: false, error: result.error.message ?? 'Send failed', branch: b.name, sent, skipped }
    }
    sent.push({ branch: b.name, to, count: rows.length })
  }

  return { ok: true, asOf, sent, skipped, cc: ccBase }
}
