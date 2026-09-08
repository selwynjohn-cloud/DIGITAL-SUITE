/**
 * 5:00 PM IST — Daily registered candidates from www.securityjob.co.in
 * To all HODs · CC Director only. Not personal Gmail. Not it@ / app@.
 */

import { Resend } from 'resend'
import { withoutNoMailRecipients } from '../auth.js'
import { getAllHodEmails } from '../mis/digest.js'
import { misAckDateDisplay } from '../mis/brand.js'
import { misTodayIst } from '../mis/dates.js'
import { getApplicants, sjStorageOk, type SjApplicant } from '../securityjob/store.js'
import { pinMailFrom, sendSuiteEmail, suiteDirectorEmail } from '../suite-mail.js'
import { withDailyPackDelivery } from '../suite-daily-delivery.js'
import {
  escHtml,
  suiteColourEmailShell,
  suiteStatRow,
  suiteTable,
} from '../suite-digest-shell.js'
import { branchFromLocation, registrationDay, registrationSortTs } from './registration-store.js'

const JOBS_SITE = 'https://www.securityjob.co.in'
const PHOTO_BASE = 'https://www.agilegroup-digital.co.in/api/securityjob/image'

function withoutPersonalGmail(emails: string[]): string[] {
  return emails.filter((e) => {
    const x = String(e || '')
      .trim()
      .toLowerCase()
    return x.includes('@') && !x.endsWith('@gmail.com')
  })
}

async function hodsToDirectorOnly() {
  const director = suiteDirectorEmail()
  const hods = withoutPersonalGmail(withoutNoMailRecipients(await getAllHodEmails())).filter(
    (e) => e !== director,
  )
  const to = hods.length ? hods : [director]
  const cc = withoutPersonalGmail(withoutNoMailRecipients([director])).filter((e) => !to.includes(e))
  return { director, to, cc }
}

function displayDob(raw: string): string {
  const s = String(raw || '').trim()
  const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (ymd) return `${ymd[3]}-${ymd[2]}-${ymd[1]}`
  return s || '—'
}

function dash(v: unknown): string {
  const s = String(v ?? '').trim()
  return s || '—'
}

export function applicantsForIstDay(list: SjApplicant[], ymd: string): SjApplicant[] {
  const day = String(ymd || '').slice(0, 10)
  return list
    .filter((a) => registrationDay(a.createdAt, a.regCode) === day)
    .sort(
      (a, b) =>
        registrationSortTs(a.createdAt, a.regCode) - registrationSortTs(b.createdAt, b.regCode),
    )
}

export function dailyRegistrationsSubject(ymd: string) {
  return `AGILE DIGITAL COMMAND CENTER , SECURITYJOB — DAILY REGISTERED CANDIDATES ${misAckDateDisplay(ymd)}-REG`
}

function photoCell(a: SjApplicant): string {
  const id = String(a.photoId || '').trim()
  if (!id) return '—'
  return `<a href="${PHOTO_BASE}?id=${encodeURIComponent(id)}" style="color:#1d4ed8;font-weight:700">Photo</a>`
}

function rowsHtml(rows: SjApplicant[]): string {
  return rows
    .map((a, i) => {
      const bg = i % 2 ? '#f8fafc' : '#fff'
      return `<tr style="background:${bg}">
      <td style="padding:7px 6px;border:1px solid #e2e8f0;text-align:center">${i + 1}</td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0;white-space:nowrap">${escHtml(dash(a.regCode))}</td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0;font-weight:700">${escHtml(dash(a.name))}</td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0;white-space:nowrap">${escHtml(dash(a.phone))}</td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0">${escHtml(dash(a.email))}</td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0;white-space:nowrap">${escHtml(displayDob(a.dob))}</td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0">${escHtml(dash(a.location))}</td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0">${escHtml(branchFromLocation(a.location))}</td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0">${escHtml(dash(a.role))}</td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0">${escHtml(dash(a.experience))}</td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0">${escHtml(dash(a.education))}</td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0">${escHtml(dash(a.language))}</td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0;white-space:nowrap">${escHtml(dash(a.createdAt))}</td>
      <td style="padding:7px 6px;border:1px solid #e2e8f0;text-align:center">${photoCell(a)}</td>
    </tr>`
    })
    .join('')
}

export function buildDailyRegistrationsHtml(opts: {
  ymd: string
  rows: SjApplicant[]
}): string {
  const display = misAckDateDisplay(opts.ymd)
  const n = opts.rows.length
  const nil = n === 0
  const headers = [
    'Sl.',
    'Reg code',
    'Name',
    'Mobile',
    'Email',
    'Date of Birth',
    'City',
    'Branch',
    'Rank / Role',
    'Experience',
    'Education',
    'Language',
    'Registered on',
    'Photo',
  ]
  const body = `
    <p style="margin:0 0 12px;font-size:14px">Dear HOD,</p>
    <p style="margin:0 0 14px;font-size:14px;line-height:1.55;color:#475569">
      Please find the <b>Daily registered candidates list</b> from
      <a href="${JOBS_SITE}" style="color:#1d4ed8;font-weight:700">${JOBS_SITE.replace('https://', '')}</a>
      for <b>${escHtml(display)}</b>. This copy goes to <b>all HODs</b>, with <b>Director on copy</b>.
    </p>
    ${suiteStatRow([
      {
        label: 'Registered today',
        value: n,
        color: nil ? '#047857' : '#1d4ed8',
        bg: nil ? '#ecfdf5' : '#eff6ff',
      },
    ])}
    ${
      nil
        ? `<div style="padding:16px 14px;border-radius:12px;background:#ecfdf5;border:1px solid #bbf7d0;color:#065f46;font-size:15px;font-weight:700">
            Nil registrations on www.securityjob.co.in for ${escHtml(display)}.
          </div>`
        : `<div style="overflow-x:auto">${suiteTable(headers, rowsHtml(opts.rows), headers.length)}</div>`
    }
    <p style="margin:18px 0 6px;font-size:14px">Regards,</p>
    <p style="margin:0;font-size:14px"><b>Agile Digital Command Centre</b></p>`

  return suiteColourEmailShell({
    appName: 'SecurityJob',
    title: 'Daily registered candidates',
    subtitle: `For Internal Circulation Only · All HODs · CC Director · 5:00 PM IST · ${escHtml(display)}`,
    accentFrom: '#14224f',
    accentTo: '#0ea5e9',
    bodyHtml: body,
  })
}

export async function sendDailySecurityJobRegistrationsMail(opts?: {
  preview?: boolean
  force?: boolean
  ymd?: string
  _direct?: boolean
}) {
  const ymd = String(opts?.ymd || misTodayIst()).slice(0, 10)
  if (!opts?.preview && !opts?._direct) {
    return withDailyPackDelivery(
      'securityjob-regs',
      () => sendDailySecurityJobRegistrationsMail({ ...opts, ymd, _direct: true }),
      { force: opts?.force, ymd },
    )
  }

  if (!sjStorageOk() && !opts?.preview) {
    return { ok: false as const, error: 'Storage not connected', date: ymd }
  }

  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey && !opts?.preview) return { ok: false as const, error: 'Email not configured', date: ymd }

  const list = await getApplicants()
  const rows = applicantsForIstDay(list, ymd)
  const { director, to, cc } = await hodsToDirectorOnly()
  const subject = dailyRegistrationsSubject(ymd)
  const html = buildDailyRegistrationsHtml({ ymd, rows })

  if (opts?.preview) {
    return {
      ok: true as const,
      preview: true,
      subject,
      to,
      cc,
      date: ymd,
      count: rows.length,
      html,
    }
  }

  const result = await sendSuiteEmail(new Resend(apiKey!), {
    from: pinMailFrom(),
    to,
    cc: cc.length ? cc : undefined,
    replyTo: director,
    subject,
    html,
    skipDirectorCc: true,
  })
  if (result.error) {
    return { ok: false as const, error: result.error.message ?? 'Send failed', to, cc, subject, date: ymd }
  }
  return { ok: true as const, subject, to, cc, date: ymd, count: rows.length, hodTo: true }
}
