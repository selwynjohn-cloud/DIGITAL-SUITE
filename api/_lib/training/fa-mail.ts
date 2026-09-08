/**
 * Facility Attendant Banking Safety — certificate letter + HOD mail.
 */

import { Resend } from 'resend'
import { getHodEmailsForBranch } from '../mis/digest.js'
import { getBranches, getUsers } from '../mis/store.js'
import { SRIDHAR_M_CC_EMAIL } from '../mis/branch-mail-cc.js'
import { pinMailFrom, sendSuiteEmail, suiteDirectorEmail } from '../suite-mail.js'
import { trainingBrandSignOffHtml, trainingTrack1EmailShell } from './training-brand.js'
import type { FaAck } from './fa-store.js'

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function row(label: string, value: string): string {
  const v = String(value ?? '').trim()
  if (!v) return ''
  return `<tr><td style="padding:8px 10px;border:1px solid #d8e0ea;background:#f7fafc;font-weight:700;width:34%;vertical-align:top;color:#0f172a">${esc(label)}</td><td style="padding:8px 10px;border:1px solid #d8e0ea;color:#0f172a">${esc(v)}</td></tr>`
}

export function faCertificateHtml(rec: FaAck): string {
  const body = `
    <p style="margin:0 0 12px;color:#0f172a;font-size:15px;line-height:1.5">
      This Facility Attendant has completed <b>HDFC Bank Safety — Learn &amp; Confirm</b>
      and accepted the three compliance rules.
    </p>
    <table style="border-collapse:collapse;width:100%;max-width:720px;font-size:14px;background:#fff">
      ${row('Certificate no.', rec.code)}
      ${row('Name', rec.name)}
      ${row('Employee ID', rec.employeeId)}
      ${row('Designation', 'Facility Attendant')}
      ${row('Client', rec.client)}
      ${row('Agile Branch', rec.branchName)}
      ${row('HDFC Branch / SOL', rec.hdfcSite)}
      ${row('Mobile', rec.mobile)}
      ${row('Language', rec.langName)}
      ${row('Score', rec.score)}
      ${row('Date & time', rec.submittedAt)}
      ${row('GPS', rec.gps)}
    </table>
    <div style="margin:16px 0 0;padding:12px 14px;border-radius:10px;background:#ecfdf5;border:1px solid #86efac;color:#14532d">
      <b>Pledge accepted</b>
      <ol style="margin:8px 0 0;padding-left:18px;line-height:1.5">
        <li>I will not perform banking transactions for bank staff.</li>
        <li>I will not allow anyone to use my bank account.</li>
        <li>I will immediately report any such request to my OM / HOD.</li>
      </ol>
    </div>
    ${trainingBrandSignOffHtml()}
  `
  return trainingTrack1EmailShell({
    title: 'Facility Attendant — Banking Safety Certificate',
    subtitle: 'HDFC Bank · Learn & Confirm',
    bodyHtml: body,
    includeImportantNumbers: false,
  })
}

function uniqueEmails(list: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of list) {
    const e = String(raw || '')
      .trim()
      .toLowerCase()
    if (!e.includes('@') || seen.has(e)) continue
    seen.add(e)
    out.push(e)
  }
  return out
}

export async function sendFaAckMail(rec: FaAck): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email is not configured.' }
  const [users, branches] = await Promise.all([getUsers(), getBranches()])
  const hods = await getHodEmailsForBranch(rec.branchId, users, branches)
  const to = uniqueEmails(hods.length ? hods : [SRIDHAR_M_CC_EMAIL])
  const cc = uniqueEmails([
    SRIDHAR_M_CC_EMAIL,
    suiteDirectorEmail(),
    'director@agilegroup.co.in',
  ])
  const resend = new Resend(apiKey)
  const html = faCertificateHtml(rec)
  const sent = await sendSuiteEmail(resend, {
    from: pinMailFrom(),
    to,
    cc,
    subject: `FA Banking Safety — ${rec.name} · ${rec.branchName} · ${rec.code}`,
    html,
  })
  if (sent.error) return { ok: false, error: String(sent.error.message || 'Mail failed') }
  return { ok: true }
}
