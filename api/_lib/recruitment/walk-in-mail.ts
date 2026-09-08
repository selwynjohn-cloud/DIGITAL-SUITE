import { Resend } from 'resend'
import { branchEmail } from '../fleet/analysis.js'
import { withoutNoMailRecipients } from '../auth.js'
import { getHodEmailsForBranch } from '../mis/digest.js'
import { LOKESH_CC_EMAIL, misDirectorCcEmail } from '../mis/branch-mail-cc.js'
import { sendSuiteEmail } from '../suite-mail.js'
import { getBranches } from '../mis/store.js'
import { drrMailMisBranchIds } from './departments.js'
import { recruitEmailShell } from './brand.js'
import type { RegisteredCandidate } from './registration-store.js'

function esc(s: unknown): string {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function buildWalkInBranchEmail(
  row: RegisteredCandidate,
  addedBy: string,
): { subject: string; html: string } {
  const branch = row.branchId || '—'
  const subject = `Agile Recruitment — New Walk-in Candidate — ${branch} — ${row.name}`
  const bodyHtml = `
    <p>Dear <b>${esc(branch)}</b> Team,</p>
    <p>A new <b>walk-in candidate</b> has been assigned to your branch.</p>
    <table style="border-collapse:collapse;width:100%;font-size:12px;margin:12px 0" border="1" cellpadding="6">
      <tr><td><b>Name</b></td><td>${esc(row.name)}</td></tr>
      <tr><td><b>Mobile</b></td><td>${esc(row.phone)}</td></tr>
      <tr><td><b>Candidate branch</b></td><td>${esc(branch)}</td></tr>
      <tr><td><b>Walk-in from</b></td><td>${esc(row.walkInFrom || '—')}</td></tr>
      <tr><td><b>Referred by</b></td><td>${esc(row.referredBy || '—')}</td></tr>
      <tr><td><b>Reg. code</b></td><td>${esc(row.regCode)}</td></tr>
      <tr><td><b>Added by</b></td><td>${esc(addedBy || '—')}</td></tr>
      ${row.replyNotes ? `<tr><td><b>Notes</b></td><td>${esc(row.replyNotes)}</td></tr>` : ''}
    </table>
    <p style="font-size:12px;color:#64748b">Please follow up in <b>Walk-in Pipeline</b> — call, set tentative DOJ, and mark joined when deployed.</p>`
  return {
    subject,
    html: recruitEmailShell('New Walk-in Candidate', `${branch} · ${row.name}`, bodyHtml),
  }
}

export async function sendWalkInBranchNotify(
  row: RegisteredCandidate,
  addedBy: string,
): Promise<{ ok: boolean; error?: string; to?: string[]; cc?: string[] }> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }

  const branchName = String(row.branchId ?? '').trim()
  if (!branchName) return { ok: false, error: 'Candidate branch required' }

  const { subject, html } = buildWalkInBranchEmail(row, addedBy)
  const resend = new Resend(apiKey)
  const from =
    process.env.RECRUIT_FROM_EMAIL?.trim() || 'Agile Recruitment <recruitment@agilegroup.co.in>'

  const toSet = new Set<string>()
  const branchMail = branchEmail(branchName).trim().toLowerCase()
  if (branchMail.includes('@')) toSet.add(branchMail)

  const misBranches = await getBranches(true)
  for (const id of drrMailMisBranchIds(branchName, misBranches)) {
    for (const em of await getHodEmailsForBranch(id, undefined, misBranches)) {
      toSet.add(em.trim().toLowerCase())
    }
  }

  const to = withoutNoMailRecipients([...toSet])
  if (!to.length) return { ok: false, error: 'No branch recipients for walk-in mail' }

  const cc = withoutNoMailRecipients([LOKESH_CC_EMAIL, misDirectorCcEmail()])
  const result = await sendSuiteEmail(resend, { from, to, cc, subject, html })
  if (result.error) return { ok: false, error: result.error.message ?? 'Send failed' }
  return { ok: true, to, cc }
}
