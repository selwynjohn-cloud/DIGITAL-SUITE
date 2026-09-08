/**
 * Notify Director when anyone changes User Management or Master Directory.
 * Includes who made the change — never includes branch passwords / PINs.
 */
import { Resend } from 'resend'
import { normaliseEmail } from '../auth.js'
import { pinMailFrom, pinMailReplyTo, resolveSuiteUserName, sendSuiteEmail } from '../suite-mail.js'

function directorAlertInbox(): string {
  return (
    process.env.DIRECTOR_ALERT_EMAIL?.trim() ||
    process.env.MIS_DIRECTOR_EMAIL?.trim() ||
    process.env.FLEET_DIRECTOR_EMAIL?.trim() ||
    'director@agilegroup.co.in'
  )
    .trim()
    .toLowerCase()
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

const AREA_LABEL: Record<string, string> = {
  saveUsers: 'User Management — Save & Publish',
  saveBranches: 'Master Directory — Branches',
  saveClients: 'Master Directory — Clients / Sites',
  saveStaff: 'Master Directory — Operations Staff',
  generateBranchPasswords: 'Master Directory — Regenerate all branch passwords',
  regenerateBranchPassword: 'Master Directory — Regenerate one branch password',
  dedupeBranches: 'Master Directory — Deduplicate branches',
  addSite: 'HOD Master Directory — Add site',
  saveSite: 'HOD Master Directory — Edit site / sanctioned strength',
  toggleSite: 'HOD Master Directory — Activate / Deactivate',
  addFromMaster: 'HOD Master Directory — Add from company search',
}

export function isDirectoryWatchAction(action: string): boolean {
  return Boolean(AREA_LABEL[action])
}

export async function notifyDirectorOfDirectoryChange(opts: {
  email: string
  action: string
  detail?: string
}): Promise<{ ok: boolean; skipped?: boolean }> {
  const em = normaliseEmail(opts.email)
  if (!em.includes('@')) return { ok: false, skipped: true }

  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, skipped: true }

  const to = directorAlertInbox()
  if (!to.includes('@')) return { ok: false, skipped: true }

  const area = AREA_LABEL[opts.action] || `MIS change — ${opts.action}`
  const when = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  const name = await resolveSuiteUserName(em)
  const detailRow = opts.detail
    ? `<tr><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#64748b;width:160px">What changed</td><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${esc(opts.detail)}</td></tr>`
    : ''

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:580px;color:#111">
      <div style="background:#1e3a5f;color:#fff;padding:14px 18px;border-radius:8px 8px 0 0">
        <b>Directory change — ${esc(area)}</b>
      </div>
      <div style="padding:18px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px">
        <p>Someone added, changed, or removed records in User Management or Master Directory.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#64748b">Changed by (name)</td><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-weight:700">${esc(name)}</td></tr>
          <tr><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#64748b">Changed by (email)</td><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${esc(em)}</td></tr>
          <tr><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#64748b">Area</td><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${esc(area)}</td></tr>
          ${detailRow}
          <tr><td style="padding:8px 10px;color:#64748b">Time (IST)</td><td style="padding:8px 10px">${esc(when)}</td></tr>
        </table>
        <p style="font-size:12px;color:#64748b;margin-top:16px">Agile MIS — Director only (not copied to IT)</p>
      </div>
    </div>`

  try {
    const resend = new Resend(apiKey)
    const result = await sendSuiteEmail(resend, {
      from: pinMailFrom(),
      to,
      replyTo: pinMailReplyTo(),
      subject: `Directory change — ${name} — ${area}`,
      html,
      skipDirectorCc: true,
    })
    return { ok: !result.error }
  } catch {
    return { ok: false }
  }
}

/** Fire-and-forget after a successful User Management / Master Directory save. */
export function noteDirectoryChange(
  email: string | undefined | null,
  action: string,
  detail?: string,
) {
  const em = normaliseEmail(email || '')
  if (!em || !isDirectoryWatchAction(action)) return
  void notifyDirectorOfDirectoryChange({ email: em, action, detail }).catch(() => {})
}
