/**
 * Agile Control — 8:00 AM IST daily report.
 * To Control · CC HODs, Director.
 * Covers 08:00 yesterday IST → 08:00 today IST.
 */

import { Resend } from 'resend'
import { withoutNoMailRecipients } from '../auth.js'
import { pinMailFrom, sendSuiteEmail, isItBlockedEmail } from '../suite-mail.js'
import { withDailyPackDelivery } from '../suite-daily-delivery.js'
import {
  CONTROL_EMAIL,
  MIS_DIRECTOR_CC_EMAIL,
  misSelwynGmailCopy,
} from '../mis/branch-mail-cc.js'
import { MIS_BRAND, misAckDateDisplay, misAckFooterHtml } from '../mis/brand.js'
import { getAllHodEmails } from '../mis/digest.js'
import { misDayBeforeIst, misTodayIst } from '../mis/dates.js'
import { formatAge, incidentAgeMs, isSlaBreached } from './sla.js'
import { getAcCases, getAcClientChecks, getAcIncidents, getAcNightCalls } from './store.js'
import {
  CONTROL_TRACK1_LABEL,
  CONTROL_TRACK2_LABEL,
  type AcIncidentReceived,
  type AcNightCall,
} from './types.js'

function esc(s: unknown) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function uniqueEmails(list: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of list) {
    const e = String(raw || '')
      .trim()
      .toLowerCase()
    if (!e.includes('@') || seen.has(e) || isItBlockedEmail(e)) continue
    seen.add(e)
    out.push(e)
  }
  return withoutNoMailRecipients(out)
}

export function controlDailySubject(dateYmd: string) {
  return `AGILE DIGITAL COMMAND CENTER , AGILE CONTROL- DAILY CONTROL REPORT ${misAckDateDisplay(dateYmd)}-REG`
}

function hmOf(value: string) {
  const v = String(value || '')
  const m = v.match(/T(\d{2}:\d{2})/)
  if (m) return m[1]
  if (/^\d{1,2}:\d{2}/.test(v)) return v.slice(0, 5).padStart(5, '0')
  return ''
}

function stampOf(ymd: string, timeish: string) {
  const hm = hmOf(timeish) || '00:00'
  return `${String(ymd || '').slice(0, 10)}T${hm}`
}

/** Inclusive from 08:00 yesterday IST, exclusive 08:00 today IST. */
export function inControlReportWindow(
  dateYmd: string,
  timeish: string,
  fromYmd: string,
  toYmd: string,
) {
  const stamp = stampOf(dateYmd, timeish)
  return stamp >= `${fromYmd}T08:00` && stamp < `${toYmd}T08:00`
}

function yn(v: unknown) {
  const s = String(v || '').trim()
  if (s === 'Yes' || s === 'No') return s
  return '—'
}

function sectionTitle(n: number, title: string) {
  return `<div style="margin:22px 0 10px;padding:10px 12px;background:#14224f;color:#fff;font-size:14px;font-weight:800;border-radius:8px">${n}. ${esc(title)}</div>`
}

function rankTable(headers: string[], rows: string[][], empty: string) {
  const th = headers
    .map(
      (h, i) =>
        `<th style="padding:7px 6px;font-size:10px;color:#fff;background:#14224f;border:1px solid #0f1a3d;text-align:${i <= 1 ? 'left' : 'center'}">${esc(h)}</th>`,
    )
    .join('')
  const body = rows.length
    ? rows
        .map(
          (r, ri) =>
            `<tr style="background:${ri % 2 ? '#f8fafc' : '#fff'}">${r
              .map(
                (c, i) =>
                  `<td style="padding:6px;border:1px solid #e2e8f0;font-size:11px;text-align:${i <= 1 ? 'left' : 'center'};vertical-align:top">${c}</td>`,
              )
              .join('')}</tr>`,
        )
        .join('')
    : `<tr><td colspan="${headers.length}" style="padding:10px;border:1px solid #e2e8f0;text-align:center;color:#64748b;font-size:12px">${esc(empty)}</td></tr>`
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 8px"><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>`
}

function dashTile(val: string, label: string) {
  return `<td style="padding:10px 8px;background:#f8fafc;border-radius:8px;text-align:center;vertical-align:top">
    <div style="font-size:18px;font-weight:800;color:#14224f;line-height:1.2">${esc(val)}</div>
    <div style="font-size:10px;color:#64748b;margin-top:4px">${esc(label)}</div>
  </td>`
}

function fmtDt(ymd: string, timeish: string) {
  const hm = hmOf(timeish)
  const d = misAckDateDisplay(ymd)
  return hm ? `${esc(d)} ${esc(hm)}` : esc(d)
}

export async function buildControlDailyPack(reportDateYmd?: string) {
  const today = String(reportDateYmd || misTodayIst()).slice(0, 10)
  const fromYmd = misDayBeforeIst(today)
  const [cases, checks, incidentsAll, nightAll] = await Promise.all([
    getAcCases(),
    getAcClientChecks(),
    getAcIncidents(),
    getAcNightCalls(),
  ])
  const open = cases.filter((c) => c.status !== 'Closed' && c.status !== 'ClientConfirmed')
  const incidents = incidentsAll
    .filter((r) => inControlReportWindow(r.dateYmd, r.occurredAt, fromYmd, today))
    .sort((a, b) => stampOf(a.dateYmd, a.occurredAt).localeCompare(stampOf(b.dateYmd, b.occurredAt)))
  const nightCalls = nightAll
    .filter((r) => inControlReportWindow(r.dateYmd, r.callTime || r.createdAt, fromYmd, today))
    .sort((a, b) => stampOf(a.dateYmd, a.callTime).localeCompare(stampOf(b.dateYmd, b.callTime)))
  const pendingChecks = checks.filter((c) => c.status === 'Pending')
  return {
    today,
    fromYmd,
    open,
    incidents,
    nightCalls,
    kpis: {
      openP1: open.filter((c) => c.priority === 'P1').length,
      openP2: open.filter((c) => c.priority === 'P2').length,
      openAll: open.length,
      slaBreaches: open.filter((c) => isSlaBreached(c)).length,
      checksPending: pendingChecks.length,
      incidents: incidents.length,
      incidentsHodNo: incidents.filter((c) => c.informedHod !== 'Yes').length,
      nightCalls: nightCalls.length,
      nightNotPicked: nightCalls.filter((c) => c.pickedUp !== 'Yes').length,
      nightNoCallback: nightCalls.filter((c) => c.calledBack !== 'Yes').length,
      nightHodNo: nightCalls.filter((c) => c.informedHod !== 'Yes').length,
    },
  }
}

function incidentRows(list: AcIncidentReceived[]) {
  return list.map((r) => [
    fmtDt(r.dateYmd, r.occurredAt),
    esc(r.clientName),
    esc(r.location),
    esc(r.receivedFrom || '—'),
    esc(r.details),
    esc(r.branchName || '—'),
    `${esc(yn(r.informedHod))}${r.informedHod === 'Yes' && r.informedHodAt ? `<br><span style="color:#64748b">${esc(hmOf(r.informedHodAt) || r.informedHodAt)}</span>` : ''}`,
  ])
}

function nightRows(list: AcNightCall[]) {
  return list.map((r) => [
    esc(hmOf(r.callTime) || r.callTime || '—'),
    esc(r.clientName),
    esc(r.location),
    esc(r.guardName),
    esc(r.guardMobile),
    esc(yn(r.pickedUp)),
    esc(yn(r.calledBack)),
    esc(yn(r.informedHod)),
  ])
}

function buildHtml(pack: Awaited<ReturnType<typeof buildControlDailyPack>>) {
  const k = pack.kpis
  const oldestP1 = pack.open
    .filter((c) => c.priority === 'P1')
    .slice()
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))[0]
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#eef2f7;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:760px;margin:0 auto;padding:16px">
  <div style="background:#14224f;color:#fff;padding:18px 20px;border-radius:12px 12px 0 0">
    <img src="${esc(MIS_BRAND.logoUrl)}" alt="Agile" height="42" style="display:block;margin-bottom:10px">
    <div style="font-size:11px;letter-spacing:.08em;color:#fde68a;font-weight:800">AGILE DIGITAL COMMAND CENTER</div>
    <div style="font-size:18px;font-weight:800;margin-top:4px">Agile Control — Daily Control Report</div>
    <div style="font-size:13px;color:#cbd5e1;margin-top:4px">${esc(misAckDateDisplay(pack.today))} · 08:00 ${esc(misAckDateDisplay(pack.fromYmd))} to 08:00 ${esc(misAckDateDisplay(pack.today))} IST</div>
  </div>
  <div style="background:#fff;padding:18px 16px 8px;border-radius:0 0 12px 12px">
    ${sectionTitle(1, 'Dashboard')}
    <table width="100%" cellpadding="0" cellspacing="8" style="margin-bottom:8px"><tr>
      ${dashTile(String(k.openP1), 'Open P1')}
      ${dashTile(String(k.openP2), 'Open P2')}
      ${dashTile(String(k.slaBreaches), 'SLA breaches')}
      ${dashTile(String(k.openAll), 'Open cases')}
    </tr><tr>
      ${dashTile(String(k.incidents), 'Incidents received')}
      ${dashTile(String(k.incidentsHodNo), 'Incident — HOD not informed')}
      ${dashTile(String(k.nightCalls), 'Night calls')}
      ${dashTile(String(k.nightNotPicked), 'Night — not picked')}
    </tr><tr>
      ${dashTile(String(k.nightNoCallback), 'Night — no call back')}
      ${dashTile(String(k.nightHodNo), 'Night — HOD not informed')}
      ${dashTile(String(k.checksPending), 'Client checks due')}
      ${dashTile(oldestP1 ? formatAge(incidentAgeMs(oldestP1)) : '—', 'Oldest open P1 age')}
    </tr></table>
    <p style="font-size:12px;color:#64748b;margin:0 0 8px">${esc(CONTROL_TRACK1_LABEL)} logs incidents. ${esc(CONTROL_TRACK2_LABEL)} logs night calls to guards.</p>

    ${sectionTitle(2, `Incident Received — ${CONTROL_TRACK1_LABEL}`)}
    ${rankTable(
      ['Date / time', 'Client', 'Location', 'Received from', 'Details', 'Branch', 'Informed HOD / time'],
      incidentRows(pack.incidents),
      'No incidents received in this window.',
    )}

    ${sectionTitle(3, `Night Calls report — ${CONTROL_TRACK2_LABEL}`)}
    ${rankTable(
      ['Time', 'Client', 'Location', 'Guard', 'Mobile', 'Picked up', 'Called back', 'Inform HODs'],
      nightRows(pack.nightCalls),
      'No night calls logged in this window.',
    )}

    <p style="margin:18px 0 0;font-size:12px;color:#64748b">
      <a href="https://www.agilegroup-digital.co.in/control?portal=staff" style="color:#1d4ed8">Open Control Staff portal</a>
      &nbsp;·&nbsp;
      <a href="https://www.agilegroup-digital.co.in/control?portal=management" style="color:#1d4ed8">Open Management portal</a>
    </p>
    ${misAckFooterHtml()}
  </div>
</div>
</body></html>`
}

export async function sendControlDailyReport(opts?: {
  date?: string
  preview?: boolean
  sampleOnly?: boolean
  force?: boolean
  _direct?: boolean
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false as const, error: 'Email not configured' }
  if (!opts?.preview && !opts?.sampleOnly && !opts?._direct) {
    return withDailyPackDelivery('control', () => sendControlDailyReport({ ...opts, _direct: true }), {
      force: opts?.force,
      ymd: opts?.date,
    })
  }

  const pack = await buildControlDailyPack(opts?.date)
  const html = buildHtml(pack)
  const subject = controlDailySubject(pack.today)
  const director = MIS_DIRECTOR_CC_EMAIL
  const gmail = misSelwynGmailCopy()
  const hods = uniqueEmails(await getAllHodEmails())

  let to = uniqueEmails([CONTROL_EMAIL])
  if (!to.length) to = [director]
  let cc = uniqueEmails([...hods, director]).filter((e) => !to.includes(e))

  if (opts?.sampleOnly) {
    to = uniqueEmails([gmail].filter((e) => e.includes('@')))
    if (!to.length) to = [director]
    cc = []
  }

  if (opts?.preview) {
    return {
      ok: true as const,
      preview: true,
      subject,
      to,
      cc,
      date: pack.today,
      fromYmd: pack.fromYmd,
      incidents: pack.incidents.length,
      nightCalls: pack.nightCalls.length,
      kpis: pack.kpis,
    }
  }

  const resend = new Resend(apiKey)
  const from = pinMailFrom() || 'Agile Control <noreply@agilegroup.co.in>'
  const result = await sendSuiteEmail(resend, {
    from,
    to,
    cc: cc.length ? cc : undefined,
    replyTo: CONTROL_EMAIL,
    subject,
    html,
    skipDirectorCc: true,
  })
  if (result.error) {
    return { ok: false as const, error: result.error.message ?? 'Send failed', to, cc, subject }
  }

  let gmailCopy: { to: string; error?: string } | undefined
  if (!opts?.sampleOnly && gmail.includes('@') && !to.includes(gmail) && !cc.includes(gmail)) {
    const copy = await sendSuiteEmail(resend, {
      from,
      to: gmail,
      replyTo: CONTROL_EMAIL,
      subject: `[Your copy] ${subject}`,
      html,
      skipDirectorCc: true,
    })
    gmailCopy = { to: gmail, error: copy.error?.message }
  }

  return {
    ok: true as const,
    subject,
    to,
    cc,
    date: pack.today,
    incidents: pack.incidents.length,
    nightCalls: pack.nightCalls.length,
    gmailCopy,
  }
}
