import { Resend } from 'resend'
import { withoutNoMailRecipients } from '../auth.js'
import { CONTROL_EMAIL } from '../mis/branch-mail-cc.js'
import { getHodEmailsForBranch } from '../mis/digest.js'
import { getBranches as getMisBranches, getUsers as getMisUsers } from '../mis/store.js'
import { sendSuiteEmail, suiteDirectorEmail } from '../suite-mail.js'
import { branchEmail } from './analysis.js'
import { fleetEmailShell } from './brand.js'
import { claimFleetLicenseAlert, claimFleetNotice, type FleetInspection } from './store.js'
import { expiredLicenseMessage, istYmd } from './trip-code.js'

function esc(s: unknown) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function tripTitle(formType: string): string {
  if (formType === 'post-trip-4w') return 'Daily Post-Trip Report'
  return 'Daily Pre-Trip Report'
}

function dateLabel(iso: string): string {
  const p = String(iso || '').split('-')
  if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`
  return iso || '—'
}

export async function hodToEmails(branchName: string): Promise<string[]> {
  const [users, branches] = await Promise.all([getMisUsers(), getMisBranches()])
  const want = branchName.trim().toLowerCase().replace(/\s+/g, '')
  const mis = branches.find((b) => {
    const n = String(b.name || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')
    return n === want || b.id === branchName || String(b.name || '').trim() === branchName
  })
  const hods = await getHodEmailsForBranch(mis?.id || branchName, users, branches)
  return withoutNoMailRecipients(
    [...hods, branchEmail(branchName)].map((e) => e.trim().toLowerCase()).filter((e) => e.includes('@')),
  )
}

export function buildDailyTripEmail(rec: FleetInspection): { subject: string; html: string } {
  const kind = tripTitle(rec.formType)
  const items = rec.items
  const rows = (items || [])
    .map(
      (it) =>
        `<tr><td>${esc(it.item)}</td><td>${esc(it.status || '—')}</td><td>${esc(it.remarks || '—')}</td></tr>`,
    )
    .join('')
  const notOk = (items || []).filter((it) => String(it.status || '').toUpperCase() === 'NOT OK')
  const bodyHtml = `
      <p>Dear HOD,</p>
      <p>A <b>${esc(kind)}</b> was saved for <b>${esc(rec.branchId)}</b> on <b>${esc(dateLabel(rec.date))}</b>.</p>
      <table style="border-collapse:collapse;width:100%;font-size:13px;margin:12px 0" border="1" cellpadding="6">
        <tr><td><b>Branch</b></td><td>${esc(rec.branchId)}</td><td><b>Trip report code</b></td><td>${esc(rec.tripCode || '—')}</td></tr>
        <tr><td><b>Date</b></td><td>${esc(dateLabel(rec.date))}</td><td><b>Trip no.</b></td><td>Trip ${esc(rec.tripNo || '1')} · ${esc(rec.shift || '—')}</td></tr>
        <tr><td><b>Vehicle</b></td><td>${esc(rec.regNo)}</td><td><b>Driver</b></td><td>${esc(rec.riderName)}</td></tr>
        <tr><td><b>Mobile</b></td><td>${esc(rec.driverMobile || '—')}</td><td><b>License Expiry</b></td><td>${esc(rec.licenseValid || '—')}</td></tr>
        <tr><td><b>Checked By</b></td><td colspan="3">${esc(rec.checkedBy)}</td></tr>
        <tr><td><b>From</b></td><td>${esc(rec.location || '—')}</td><td><b>To / Return</b></td><td>${esc(rec.destination || '—')}</td></tr>
        <tr><td><b>Start / End</b></td><td>${esc(rec.startTime || '—')} / ${esc(rec.endTime || '—')}</td><td><b>Diesel Level</b></td><td>${esc(rec.dieselLevel || '—')}</td></tr>
        <tr><td><b>Purpose</b></td><td colspan="3">${esc(rec.purpose || '—')}</td></tr>
        <tr><td><b>Opening KM</b></td><td>${esc(rec.odoStart || '—')}</td><td><b>Closing KM</b></td><td>${esc(rec.odoEnd || '—')}</td></tr>
        <tr><td><b>Total KM</b></td><td>${esc(rec.kmRun || '—')}</td><td><b>Fuel</b></td><td>${esc(rec.fuelQty || '—')} L · ₹${esc(rec.fuelAmount || '—')}</td></tr>
        <tr><td><b>Incident</b></td><td colspan="3">${esc(rec.incident || rec.tripRemarks || '—')}</td></tr>
      </table>
      ${
        notOk.length
          ? `<p style="color:#b45309;font-weight:700">${notOk.length} item(s) marked NOT OK — please follow up.</p>`
          : '<p style="color:#15803d;font-weight:700">All checklist items are OK or NA.</p>'
      }
      <h3 style="color:#0C1B33;border-left:4px solid #F0A500;padding-left:8px">Checklist</h3>
      <table style="border-collapse:collapse;width:100%;font-size:12px;margin-top:8px" border="1" cellpadding="6">
        <thead style="background:#0C1B33;color:#fff"><tr><th>Check Item</th><th>Status</th><th>Remarks</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="3">No checklist</td></tr>'}</tbody>
      </table>
      <p style="color:#888;font-size:11px;margin-top:16px">Pre-Trip is saved first. Post-Trip can be filled later for the same Trip no. A vehicle may have Trip 1, 2 and 3 on the same day. Director and Control are copied.</p>`
  return {
    subject: `Agile Fleet — ${kind} — ${rec.branchId} — ${dateLabel(rec.date)} — ${rec.regNo}`,
    html: fleetEmailShell(kind, `${esc(rec.branchId)} · ${esc(dateLabel(rec.date))} · ${esc(rec.regNo)}`, bodyHtml),
  }
}

export async function sendDailyTripMail(rec: FleetInspection): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }
  const to = await hodToEmails(rec.branchId)
  if (!to.length) return { ok: false, error: 'No HOD mailbox for this branch' }
  const { subject, html } = buildDailyTripEmail(rec)
  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile Fleet <noreply@agilegroup.co.in>'
  const director = suiteDirectorEmail()
  const cc = withoutNoMailRecipients([CONTROL_EMAIL, director, 'director@agilegroup.co.in'])
  const result = await sendSuiteEmail(resend, { from, to, cc, subject, html })
  if (result.error) return { ok: false, error: result.error.message ?? 'Send failed' }
  return { ok: true }
}

export async function sendExpiredLicenseMail(opts: {
  branchId: string
  driverName: string
  licenseValid: string
  regNo?: string
}): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  const today = istYmd()
  const first = await claimFleetLicenseAlert(opts.branchId, opts.driverName, today)
  if (!first) return { ok: true, skipped: true }
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }
  const to = await hodToEmails(opts.branchId)
  if (!to.length) return { ok: false, error: 'No HOD mailbox for this branch' }
  const msg = expiredLicenseMessage(opts.driverName)
  const bodyHtml = `
      <p>Dear HOD,</p>
      <p>A driver tried to fill a Daily Pre / Post Trip report with an <b>expired driving license</b>.</p>
      <table style="border-collapse:collapse;width:100%;font-size:13px;margin:12px 0" border="1" cellpadding="6">
        <tr><td><b>Branch</b></td><td>${esc(opts.branchId)}</td></tr>
        <tr><td><b>Driver</b></td><td>${esc(opts.driverName)}</td></tr>
        <tr><td><b>License expiry</b></td><td>${esc(opts.licenseValid || '—')}</td></tr>
        <tr><td><b>Vehicle</b></td><td>${esc(opts.regNo || '—')}</td></tr>
      </table>
      <p><b>${esc(msg)}</b></p>
      <p>The trip form is blocked until the license is renewed.</p>`
  const subject = `Agile Fleet — Expired license — ${opts.driverName} — ${opts.branchId}`
  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile Fleet <noreply@agilegroup.co.in>'
  const director = suiteDirectorEmail()
  const cc = withoutNoMailRecipients([director, 'director@agilegroup.co.in'])
  const result = await sendSuiteEmail(resend, {
    from,
    to,
    cc,
    subject,
    html: fleetEmailShell('Expired driving license', `${esc(opts.branchId)} · ${esc(opts.driverName)}`, bodyHtml),
  })
  if (result.error) return { ok: false, error: result.error.message ?? 'Send failed' }
  return { ok: true }
}

export async function sendNewDriverMail(opts: {
  branchId: string
  driverName: string
  licenseValid: string
  regNo?: string
}): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  const today = istYmd()
  const first = await claimFleetNotice('new-drv', opts.branchId, opts.driverName, today)
  if (!first) return { ok: true, skipped: true }
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }
  const to = await hodToEmails(opts.branchId)
  if (!to.length) return { ok: false, error: 'No HOD mailbox for this branch' }
  const bodyHtml = `
      <p>Dear HOD,</p>
      <p>A <b>New Driver</b> was entered on the Daily Pre / Post Trip form. Please add this name in Drivers Data if the person will keep driving.</p>
      <table style="border-collapse:collapse;width:100%;font-size:13px;margin:12px 0" border="1" cellpadding="6">
        <tr><td><b>Branch</b></td><td>${esc(opts.branchId)}</td></tr>
        <tr><td><b>New driver name</b></td><td>${esc(opts.driverName)}</td></tr>
        <tr><td><b>License expiry date</b></td><td>${esc(opts.licenseValid || '—')}</td></tr>
        <tr><td><b>Vehicle</b></td><td>${esc(opts.regNo || '—')}</td></tr>
      </table>`
  const subject = `Agile Fleet — New Driver — ${opts.driverName} — ${opts.branchId}`
  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile Fleet <noreply@agilegroup.co.in>'
  const director = suiteDirectorEmail()
  const cc = withoutNoMailRecipients([director, 'director@agilegroup.co.in'])
  const result = await sendSuiteEmail(resend, {
    from,
    to,
    cc,
    subject,
    html: fleetEmailShell('New Driver', `${esc(opts.branchId)} · ${esc(opts.driverName)}`, bodyHtml),
  })
  if (result.error) return { ok: false, error: result.error.message ?? 'Send failed' }
  return { ok: true }
}
