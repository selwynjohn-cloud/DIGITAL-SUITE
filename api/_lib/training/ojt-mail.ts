/**
 * Agile Training OJT — advance notice, cancel, completion report, security observations.
 */

import { Resend } from 'resend'
import { escHtml } from '../suite-digest-shell.js'
import { pinMailFrom, sendSuiteEmail, suiteDirectorEmail, type SuiteEmailAttachment } from '../suite-mail.js'
import {
  prepareClientFeedbackLink,
  type OjtClientFeedbackRecord,
} from './ojt-client-feedback-store.js'
import {
  clientReplyPublicUrl,
  prepareClientReplyLink,
  type OjtClientReplyRecord,
} from './ojt-client-reply-store.js'
import {
  monthOf,
  ojtClientEmailsFromSession,
  scheduleTypeLabel,
  type OjtReport,
  type OjtSession,
} from './ojt-store.js'
import {
  trainingBrandSignOffHtml,
  trainingTrack1EmailShell,
} from './training-brand.js'

function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function row(label: string, value: string): string {
  const v = String(value ?? '').trim()
  if (!v) return ''
  return `<tr><td style="padding:8px 10px;border:1px solid #d8e0ea;background:#f7fafc;font-weight:700;width:32%;vertical-align:top;color:#0f172a">${escapeHtml(label)}</td><td style="padding:8px 10px;border:1px solid #d8e0ea;white-space:pre-wrap;color:#0f172a">${escapeHtml(v)}</td></tr>`
}

function table(rows: string): string {
  return `<table style="border-collapse:collapse;width:100%;max-width:720px;font-family:Arial,sans-serif;font-size:14px;color:#0f172a;background:#fff">${rows}</table>`
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

function ratingLabel(v: string): string {
  if (v === 'Excellent') return 'Excellent'
  if (v === 'ToBeImproved') return 'To be improved'
  return v || '—'
}

function idLabel(v: string): string {
  if (v === 'AllValid') return 'All valid'
  if (v === 'ToBeCorrected') return 'To be corrected'
  return v || '—'
}

/** Client To · CC Branch HOD, Director (+ trainer when sharing completion). */
export function ojtClientNotifyCc(session: OjtSession, extra: string[] = []): string[] {
  return uniqueEmails([
    session.branchHeadEmail,
    session.trainerEmail,
    suiteDirectorEmail(),
    'director@agilegroup.co.in',
    ...extra,
  ])
}

/** Completion / intimation: To client(s) · CC trainer, HOD of the training site, Director. */
export function ojtCompletionCc(session: OjtSession): string[] {
  return uniqueEmails([
    session.trainerEmail,
    session.branchHeadEmail,
    suiteDirectorEmail(),
    'director@agilegroup.co.in',
    trainingDeptCcEmail(),
  ])
}

export function ojtClientToEmails(session: OjtSession): string[] {
  return ojtClientEmailsFromSession(session)
}

/** Training Department inbox — CC on Observation closing chase / share. */
export function trainingDeptCcEmail(): string {
  return (
    process.env.TRAINING_DEPT_EMAIL?.trim() ||
    process.env.OJT_TRAINING_EMAIL?.trim() ||
    'training@agilegroup.co.in'
  )
    .trim()
    .toLowerCase()
}

/** Security Observations: To HOD · CC Training, Director (+ trainer; never client). */
export function ojtSecurityObsRecipients(session: OjtSession): { to: string; cc: string[] } | { error: string } {
  const to = String(session.branchHeadEmail || '').trim()
  if (!to || !to.includes('@')) return { error: 'Branch HOD email is required to send Security Observations to HOD.' }
  const cc = uniqueEmails([
    trainingDeptCcEmail(),
    session.trainerEmail,
    suiteDirectorEmail(),
    'director@agilegroup.co.in',
  ]).filter((e) => e !== to.toLowerCase())
  return { to, cc }
}

/** Printable monthly Training schedule sheet (actual format for HOD + Management). */
export function buildMonthScheduleFormatHtml(
  month: string,
  sessions: OjtSession[],
  opts?: { branchLabel?: string; viewerLabel?: string },
): string {
  const ym = String(month || '').trim().slice(0, 7)
  const [y, m] = ym.split('-')
  const monthLabel = (() => {
    try {
      const d = new Date(Date.UTC(Number(y), Number(m) - 1, 1))
      return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    } catch {
      return ym || 'Month'
    }
  })()
  const rows = [...sessions]
    .filter((s) => s && s.status !== 'Cancelled')
    .sort((a, b) => {
      const da = `${a.trainingDate || ''} ${a.trainingTime || ''}`
      const db = `${b.trainingDate || ''} ${b.trainingTime || ''}`
      return da.localeCompare(db)
    })
  const bodyRows = rows.length
    ? rows
        .map((s, i) => {
          const topics = String(s.topics || '')
            .split(/\n|;/)
            .map((t) => t.trim())
            .filter(Boolean)
            .join('; ')
          return `<tr>
            <td style="padding:8px 10px;border:1px solid #d8e0ea;text-align:center">${i + 1}</td>
            <td style="padding:8px 10px;border:1px solid #d8e0ea;white-space:nowrap">${escHtml(s.trainingDate || '—')}</td>
            <td style="padding:8px 10px;border:1px solid #d8e0ea;white-space:nowrap">${escHtml(s.trainingTime || '—')}</td>
            <td style="padding:8px 10px;border:1px solid #d8e0ea">${escHtml(s.clientName || '—')}</td>
            <td style="padding:8px 10px;border:1px solid #d8e0ea">${escHtml(s.location || '—')}</td>
            <td style="padding:8px 10px;border:1px solid #d8e0ea">${escHtml(s.trainerName || '—')}</td>
            <td style="padding:8px 10px;border:1px solid #d8e0ea;font-size:13px">${escHtml(topics || '—')}</td>
            <td style="padding:8px 10px;border:1px solid #d8e0ea">${escHtml(scheduleTypeLabel(s.slaTag))}</td>
            <td style="padding:8px 10px;border:1px solid #d8e0ea">${escHtml(s.status || '—')}</td>
          </tr>`
        })
        .join('')
    : `<tr><td colspan="9" style="padding:16px;border:1px solid #d8e0ea;text-align:center;color:#64748b">No training sessions scheduled for this month yet.</td></tr>`

  const branchLine = String(opts?.branchLabel || '').trim()
  const viewerLine = String(opts?.viewerLabel || '').trim()
  const bodyHtml = `
    <p style="margin:0 0 10px;line-height:1.55">Dear Sir / Madam,</p>
    <p style="margin:0 0 14px;line-height:1.55">Please find the <strong>On Site Tactical Training (OJT)</strong> schedule for
    <strong>${escHtml(monthLabel)}</strong>${branchLine ? ` — <strong>${escHtml(branchLine)}</strong>` : ''}.</p>
    <table style="border-collapse:collapse;width:100%;max-width:960px;font-family:Arial,sans-serif;font-size:14px;color:#0f172a">
      <thead>
        <tr style="background:linear-gradient(135deg,#0f766e,#0369a1);color:#fff">
          <th style="padding:10px;border:1px solid #0e7490;text-align:center">#</th>
          <th style="padding:10px;border:1px solid #0e7490;text-align:left">Date</th>
          <th style="padding:10px;border:1px solid #0e7490;text-align:left">Time</th>
          <th style="padding:10px;border:1px solid #0e7490;text-align:left">Branch / unit</th>
          <th style="padding:10px;border:1px solid #0e7490;text-align:left">Venue</th>
          <th style="padding:10px;border:1px solid #0e7490;text-align:left">Trainer</th>
          <th style="padding:10px;border:1px solid #0e7490;text-align:left">Training topics</th>
          <th style="padding:10px;border:1px solid #0e7490;text-align:left">Type</th>
          <th style="padding:10px;border:1px solid #0e7490;text-align:left">Status</th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>
    <p style="margin:16px 0 0;line-height:1.6;font-size:13px;color:#334155">
      Client intimation is sent separately for each session (with confirmation link).
      ${viewerLine ? `<br/>Prepared for: ${escHtml(viewerLine)}.` : ''}
    </p>
    ${trainingBrandSignOffHtml()}
  `

  return trainingTrack1EmailShell({
    title: 'OJT monthly training schedule',
    subtitle: `${escHtml(monthLabel)}${branchLine ? ` · ${escHtml(branchLine)}` : ''}`,
    accentFrom: '#0f766e',
    accentTo: '#0369a1',
    bodyHtml,
  })
}

export function buildAdvanceNoticeHtml(
  session: OjtSession,
  opts?: { replyUrl?: string; revised?: boolean },
): string {
  const when = [session.trainingDate, session.trainingTime].filter(Boolean).join(' · ')
  const trainer = [session.trainerName, session.trainerEmail].filter(Boolean).join(' · ')
  const feedback =
    session.feedbackGuard === 'Yes' || session.feedbackClient === 'Yes'
      ? [
          session.feedbackGuard === 'Yes' ? 'Guard feedback' : '',
          session.feedbackClient === 'Yes' ? 'Client feedback' : '',
        ]
          .filter(Boolean)
          .join(' + ')
      : session.feedbackPlanned === 'Yes'
        ? 'Yes — feedback will be collected'
        : session.feedbackPlanned
  const body =
    row('Date & time', when) +
    row('Branch / unit', session.clientName) +
    row('Venue / location', session.location) +
    row('Trainer', trainer) +
    row('Training topics', session.topics) +
    row('Table Top Exercise', session.tableTop) +
    row('Table-top notes', session.tableTopNotes) +
    row('Security equipment to identify', session.equipmentIdentify) +
    row('Sample questions for guards', session.sampleQuestions) +
    row('Feedback (compulsory)', feedback) +
    row('Type', scheduleTypeLabel(session.slaTag))

  const replyUrl = String(opts?.replyUrl || '').trim()
  const revised = Boolean(opts?.revised)
  const intro = revised
    ? `<p style="margin:0 0 12px;color:#0f172a">Dear Sir / Madam,</p>
    <p style="margin:0 0 12px;color:#0f172a">This is a <strong>modified / updated intimation</strong> for
    <strong>On Site Tactical Training (OJT)</strong> at your site. Please review the latest details below.</p>`
    : `<p style="margin:0 0 12px;color:#0f172a">Dear Sir / Madam,</p>
    <p style="margin:0 0 12px;color:#0f172a">This is intimation of <strong>On Site Tactical Training (OJT)</strong>
    scheduled at your site. Details are below.</p>`

  const confirmBlock = replyUrl
    ? `<div style="margin:18px 0;padding:16px;border-radius:12px;background:linear-gradient(135deg,#ecfdf5,#eff6ff);border:1px solid #86efac;text-align:center">
      <div style="font-weight:900;color:#065f46;margin-bottom:8px">Kindly confirm the training in the link</div>
      <a href="${escHtml(replyUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#059669;color:#fff;font-weight:800;text-decoration:none">Open confirmation link</a>
    </div>`
    : ''

  const bodyHtml = `
    ${intro}
    ${table(body)}
    ${confirmBlock}
    <p style="margin:16px 0 0;line-height:1.6;color:#0f172a">On your confirmation the site will be informed digitally.</p>
    <p style="margin:10px 0 0;line-height:1.6;color:#0f172a">The Training completion report will be sent for your kind information along with Post Training test marks.</p>
    <p style="margin:10px 0 0;line-height:1.6;color:#0f172a">Thank you for all your support in this regard.</p>
    ${trainingBrandSignOffHtml()}
  `

  return trainingTrack1EmailShell({
    title: revised ? 'OJT intimation (updated)' : 'OJT training intimation',
    subtitle: `${escHtml(session.clientName || 'Site')} · ${escHtml(when || 'Schedule')}`,
    accentFrom: '#0f766e',
    accentTo: '#0369a1',
    bodyHtml,
  })
}

export function buildCancelNoticeHtml(session: OjtSession): string {
  const when = [session.trainingDate, session.trainingTime].filter(Boolean).join(' · ')
  const body =
    row('Date & time (cancelled)', when) +
    row('Branch / unit', session.clientName) +
    row('Venue / location', session.location) +
    row('Trainer', [session.trainerName, session.trainerEmail].filter(Boolean).join(' · ')) +
    row('Type', scheduleTypeLabel(session.slaTag)) +
    row('Reason for cancellation', session.cancelReason)

  return trainingTrack1EmailShell({
    title: 'OJT training cancelled',
    subtitle: `${escHtml(session.clientName || 'Site')} · ${escHtml(when || 'Schedule')}`,
    accentFrom: '#b91c1c',
    accentTo: '#dc2626',
    bodyHtml: `
    <p style="margin:0 0 12px;color:#0f172a">Dear Client,</p>
    <p style="margin:0 0 12px;color:#0f172a">Please note that the <strong>On Site Tactical Training (OJT)</strong> previously scheduled at your site has been <strong>cancelled</strong>.</p>
    ${table(body)}
    <p style="margin-top:16px;color:#0f172a">We will inform you when a new date is fixed. Thank you for your understanding.</p>
    ${trainingBrandSignOffHtml()}
  `,
  })
}

export type GuardsLinkMailSummary = {
  attended: number
  tested: number
  avgScore: string
  feedbackCount: number
  feedbackNotes: string
  attendanceNames: string
  statusLine: string
}

export function buildCompletionReportHtml(
  session: OjtSession,
  report: OjtReport,
  guardsLink?: GuardsLinkMailSummary | null,
  feedbackUrl?: string,
): string {
  const when = [report.reportDate || session.trainingDate, session.trainingTime].filter(Boolean).join(' · ')
  const photoCount = (report.completionPhotos || []).length
  const hasPhotos = photoCount > 0
  const hasAttendance = Boolean(
    String(report.attendanceNames || '').trim() ||
      String(report.attendanceCount || '').trim() ||
      (guardsLink && Number(guardsLink.attended) > 0) ||
      String(guardsLink?.attendanceNames || '').trim(),
  )
  const hasMarks = Boolean(
    String(report.marksFileName || '').trim() ||
      String(report.marksStatement || '').trim() ||
      (guardsLink && (Number(guardsLink.tested) > 0 || String(guardsLink.avgScore || '').trim())),
  )
  const omReported =
    String(report.operationsStaffNames || '').trim() ||
    String(session.trainerName || '').trim() ||
    '—'

  const body =
    row('Date', when) +
    row('Branch / unit', session.clientName) +
    row('Venue / location', session.location) +
    row('Trainer', [session.trainerName, session.trainerEmail].filter(Boolean).join(' · ')) +
    row('Topics covered', report.topicsCovered || session.topics) +
    row('Sanctioned strength', report.sanctionedStrength) +
    row('Attended count', report.attendanceCount) +
    row('Attended list', report.attendanceNames) +
    (guardsLink
      ? row('Digitally collected attendance', guardsLink.attendanceNames || String(guardsLink.attended || '—')) +
        row('Post Training Test — average marks', guardsLink.avgScore) +
        row('Guards who took the test', String(guardsLink.tested))
      : '') +
    (report.clientOjtBenefitRating
      ? row(
          'Client feedback (our record)',
          [
            'Overall, how was the OJT beneficial to our security operations?',
            report.clientOjtBenefitRating,
            report.clientOjtBenefitBy ? `By: ${report.clientOjtBenefitBy}` : '',
            report.clientOjtBenefitAt
              ? `Date stamp: ${String(report.clientOjtBenefitAt).slice(0, 16).replace('T', ' ')}`
              : '',
          ]
            .filter(Boolean)
            .join('\n'),
        )
      : '') +
    (String(report.feedback || report.guardFeedback || report.clientFeedback || '').trim()
      ? row(
          'Feedback notes',
          report.feedback || [report.guardFeedback, report.clientFeedback].filter(Boolean).join('\n\n'),
        )
      : '')

  const attachStatus =
    row('Training photo', hasPhotos ? `Attached (${photoCount})` : '—') +
    row('Guards attendance', hasAttendance ? 'Attached' : '—') +
    row(
      'Post Training marks',
      hasMarks ? (report.marksFileName ? `Attached — ${report.marksFileName}` : 'Attached') : '—',
    ) +
    row('OM reported', omReported)

  const photos = (report.completionPhotos || []).slice(0, 3).filter((p) => p.base64 && p.base64 !== '__stored__')
  const photoHtml = photos.length
    ? `<div style="margin:16px 0 8px;font-weight:700;color:#14224f">Training photos</div>
      <div style="display:flex;flex-wrap:wrap;gap:10px">
        ${photos
          .map(
            (p, i) =>
              `<div style="text-align:center"><img src="data:${escHtml(p.type || 'image/jpeg')};base64,${p.base64}" alt="Photo ${i + 1}" style="max-width:180px;max-height:180px;border-radius:8px;border:1px solid #cbd5e1;object-fit:cover;display:block"/><div style="font-size:11px;color:#64748b;margin-top:4px">Photo ${i + 1}</div></div>`,
          )
          .join('')}
      </div>`
    : ''

  return trainingTrack1EmailShell({
    title: 'OJT completion report',
    subtitle: `${escHtml(session.clientName || 'Site')} · ${escHtml(when || 'Schedule')}`,
    accentFrom: '#0f766e',
    accentTo: '#0369a1',
    bodyHtml: `
    <p style="margin:0 0 12px;color:#0f172a">Dear Sir / Madam,</p>
    <p style="margin:0 0 12px;color:#0f172a">Please find the <strong>OJT completion report</strong> for the training conducted at your site.</p>
    ${table(body)}
    <div style="margin:18px 0 8px;font-weight:800;color:#0f766e">Enclosures</div>
    ${table(attachStatus)}
    ${photoHtml}
    <p style="margin-top:16px;line-height:1.6;color:#0f172a">Guard attendance records, Post-Training Test scores, training photographs, and digitally collected attendance records are attached for your kind information.</p>
    <p style="margin-top:12px;line-height:1.6;color:#0f172a">As our valued business partner, your suggestions and feedback are most welcome. We highly value your input, which will help us further improve our training and service standards for our mutual benefit.</p>
    ${
      feedbackUrl
        ? `<div style="margin:20px 0;padding:18px 16px;border-radius:14px;background:linear-gradient(135deg,#ecfdf5,#eff6ff);border:1px solid #86efac;text-align:center">
      <a href="${escHtml(feedbackUrl.split('&r=')[0])}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;border-radius:12px;background:#059669;color:#fff;font-weight:800;font-size:16px;text-decoration:none">Feedback</a>
    </div>`
        : ''
    }
    ${
      report.clientOjtBenefitRating
        ? `<p style="margin-top:12px;color:#0f766e;font-weight:700">Client feedback already received: ${escHtml(report.clientOjtBenefitRating)}${report.clientOjtBenefitBy ? ` — ${escHtml(report.clientOjtBenefitBy)}` : ''}</p>`
        : ''
    }
    ${trainingBrandSignOffHtml()}
  `,
  })
}

export function buildSecurityObservationsHtml(session: OjtSession, report: OjtReport): string {
  const when = [report.reportDate || session.trainingDate, session.trainingTime].filter(Boolean).join(' · ')
  const turnout =
    report.turnoutRating === 'ToBeImproved'
      ? `${ratingLabel(report.turnoutRating)}\nReason: ${report.turnoutReason || '—'}`
      : ratingLabel(report.turnoutRating)
  const idCard =
    report.idCardValidity === 'ToBeCorrected'
      ? `${idLabel(report.idCardValidity)}\nReason: ${report.idCardReason || '—'}`
      : idLabel(report.idCardValidity)
  const records =
    report.recordKeeping === 'ToBeImproved'
      ? `${ratingLabel(report.recordKeeping)}\nReason: ${report.recordKeepingReason || '—'}`
      : ratingLabel(report.recordKeeping)
  const body =
    row('Training date', when) +
    row('Branch / unit', session.clientName) +
    row('Venue / location', session.location) +
    row('Trainer', [session.trainerName, session.trainerEmail].filter(Boolean).join(' · ')) +
    row('1. Turnout of guards', turnout) +
    row('2. ID card validity', idCard) +
    row('3. Record keeping', records) +
    row('4. OM previous visit date', report.omPreviousVisitDate) +
    row('5. Previous night check date', report.previousNightCheckDate) +
    row('6. Any other abnormality observed', report.otherAbnormality) +
    row('7. Information gathering', report.informationGathering)

  return trainingTrack1EmailShell({
    title: 'Security Observations — OJT',
    subtitle: `${escHtml(session.clientName || 'Site')} · ${escHtml(when || 'Schedule')}`,
    accentFrom: '#14224f',
    accentTo: '#0f766e',
    bodyHtml: `
    <p style="margin:0 0 12px;color:#0f172a">Dear HOD,</p>
    <p style="margin:0 0 12px;color:#0f172a"><strong>Security Observations</strong> from On Site Tactical Training (OJT) — for internal use only (not shared with the client).</p>
    ${table(body)}
    ${trainingBrandSignOffHtml()}
  `,
  })
}

function completionAttachments(report: OjtReport): SuiteEmailAttachment[] {
  const out: SuiteEmailAttachment[] = []
  const b64 = String(report.marksFileBase64 || '').trim()
  const name = String(report.marksFileName || '').trim()
  if (b64 && name && b64 !== '__stored__') {
    out.push({
      filename: name,
      content: b64,
      contentType: report.marksFileType || undefined,
    })
  }
  for (const [i, p] of (report.completionPhotos || []).slice(0, 3).entries()) {
    const pb = String(p.base64 || '').trim()
    if (!pb || pb === '__stored__') continue
    const fname = String(p.name || `training-photo-${i + 1}.jpg`).replace(/[^\w.\-()+ ]+/g, '_')
    out.push({
      filename: fname,
      content: pb,
      contentType: p.type || 'image/jpeg',
    })
  }
  return out
}

async function send(
  to: string | string[],
  cc: string | string[] | undefined,
  subject: string,
  html: string,
  attachments?: SuiteEmailAttachment[],
): Promise<{ ok: true; messageId?: string } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email is not configured (RESEND_API_KEY).' }
  const resend = new Resend(apiKey)
  try {
    const result = await sendSuiteEmail(resend, {
      from: pinMailFrom(),
      to,
      cc: cc || undefined,
      subject,
      html,
      attachments: attachments?.length ? attachments : undefined,
    })
    if (result.error) return { ok: false, error: result.error.message || 'Mail failed' }
    const messageId = String((result.data as { id?: string } | null)?.id ?? '').trim() || undefined
    return { ok: true, messageId }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Mail failed' }
  }
}

export async function sendOjtAdvanceMail(
  session: OjtSession,
  opts?: { origin?: string; revised?: boolean },
): Promise<{ ok: boolean; error?: string; messageId?: string; replyUrl?: string; revised?: boolean }> {
  const to = ojtClientToEmails(session)
  if (!to.length) return { ok: false, error: 'Client email is missing or invalid. Enter up to 3 client emails on the schedule.' }
  const revised = Boolean(opts?.revised ?? Boolean(session.notifySentAt))
  const month = monthOf(session.trainingDate) || monthOf(new Date().toISOString().slice(0, 10))
  const prepared = await prepareClientReplyLink(session, month)
  if (!prepared.ok) return { ok: false, error: prepared.error }
  const replyUrl = opts?.origin
    ? clientReplyPublicUrl(prepared.meta.token, opts.origin)
    : prepared.url
  const cc = ojtClientNotifyCc(session)
  const subject = revised
    ? `OJT intimation (updated) — ${session.clientName || 'site'} — ${session.trainingDate || ''}`.trim()
    : `OJT training intimation — ${session.clientName || 'site'} — ${session.trainingDate || ''}`.trim()
  const mailed = await send(to, cc, subject, buildAdvanceNoticeHtml(session, { replyUrl, revised }))
  return { ...mailed, replyUrl, revised }
}

/** Digital site notice when client replies on the confirmation link. */
export async function sendOjtClientReplySiteMail(
  session: OjtSession,
  reply: OjtClientReplyRecord,
): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  const to =
    String(session.branchHeadEmail || '').trim() ||
    String(session.trainerEmail || '').trim() ||
    trainingDeptCcEmail()
  if (!to.includes('@')) return { ok: false, error: 'No site / HOD email to inform.' }

  const stamp = (() => {
    try {
      return new Date(reply.repliedAt).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' IST'
    } catch {
      return reply.repliedAt
    }
  })()

  const actionLabel =
    reply.action === 'confirm'
      ? 'Confirmed as Scheduled'
      : reply.note ||
        [
          reply.removeTopicName ? `Remove topic — ${reply.removeTopicName}` : '',
          reply.topicName ? `Add topic — ${reply.topicName}` : '',
          reply.newDate || reply.newTime
            ? `Change date / time — ${reply.newDate} ${reply.newTime}`.trim()
            : '',
        ]
          .filter(Boolean)
          .join(' · ') ||
        'Change Required'

  const bodyHtml = `
    <p style="margin:0 0 12px">Dear HOD / Site Team,</p>
    <p style="margin:0 0 12px">The client has replied on the <strong>OJT confirmation link</strong>. Please note and act.</p>
    ${table(
      row('Client / unit', session.clientName) +
        row('Scheduled date & time', [session.trainingDate, session.trainingTime].filter(Boolean).join(' · ')) +
        row('Venue', session.location) +
        row('Client reply', actionLabel) +
        row('Date stamp', stamp) +
        row('Client email', ojtClientToEmails(session).join(', ') || session.clientEmail) +
        row('Trainer', [session.trainerName, session.trainerEmail].filter(Boolean).join(' · ')),
    )}
    <p style="margin:14px 0 0;color:#0f172a">Please inform the site digitally / on duty as required.</p>
    ${trainingBrandSignOffHtml()}
  `

  const html = trainingTrack1EmailShell({
    title: 'Client confirmed / replied — OJT',
    subtitle: `${escHtml(session.clientName || 'Site')} · ${escHtml(stamp)}`,
    accentFrom: '#b45309',
    accentTo: '#c2410c',
    bodyHtml,
  })

  const cc = uniqueEmails([
    session.trainerEmail,
    trainingDeptCcEmail(),
    suiteDirectorEmail(),
    'director@agilegroup.co.in',
  ]).filter((e) => e !== to.toLowerCase())

  const subject = `OJT client reply — ${session.clientName || 'site'} — ${actionLabel}`.slice(0, 180)
  return send(to, cc, subject, html)
}

export async function sendOjtCancelMail(
  session: OjtSession,
): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  const to = ojtClientToEmails(session)
  if (!to.length) return { ok: false, error: 'Client email is missing or invalid. Enter up to 3 client emails on the schedule.' }
  const reason = String(session.cancelReason || '').trim()
  if (!reason) return { ok: false, error: 'Cancellation reason is required.' }
  const cc = ojtClientNotifyCc(session)
  const subject = `OJT cancelled — ${session.clientName || 'site'} — ${session.trainingDate || ''}`.trim()
  return send(to, cc, subject, buildCancelNoticeHtml(session))
}

export async function sendOjtCompletionMail(
  session: OjtSession,
  report: OjtReport,
  guardsLink?: GuardsLinkMailSummary | null,
  opts?: { origin?: string },
): Promise<{ ok: boolean; error?: string; messageId?: string; feedbackUrl?: string }> {
  const to = ojtClientToEmails(session)
  if (!to.length) return { ok: false, error: 'Client email is missing or invalid. Enter up to 3 client emails on the schedule.' }
  const cc = ojtCompletionCc(session)
  const subject = `OJT completion report — ${session.clientName || 'site'} — ${report.reportDate || session.trainingDate || ''}`.trim()
  const prepared = await prepareClientFeedbackLink(
    session,
    monthOf(session.trainingDate) || monthOf(report.reportDate),
    opts?.origin,
  )
  const feedbackUrl = prepared.ok ? prepared.url : ''
  if (prepared.ok && prepared.meta.token) {
    report.clientFeedbackToken = prepared.meta.token
  }
  const mailed = await send(
    to,
    cc,
    subject,
    buildCompletionReportHtml(session, report, guardsLink, feedbackUrl),
    completionAttachments(report),
  )
  return { ...mailed, feedbackUrl: feedbackUrl || undefined }
}

/** Internal notice when client submits completion-report feedback. */
export async function sendOjtClientFeedbackAckMail(
  session: OjtSession,
  reply: OjtClientFeedbackRecord,
): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  const to = uniqueEmails([
    session.trainerEmail,
    trainingDeptCcEmail(),
    suiteDirectorEmail(),
  ])
  if (!to.length) return { ok: false, error: 'No internal recipient.' }
  const stamp = String(reply.repliedAt || '').slice(0, 19).replace('T', ' ')
  const html = trainingTrack1EmailShell({
    title: 'Client OJT feedback received',
    subtitle: `${escHtml(session.clientName || 'Site')} · ${escHtml(stamp)}`,
    accentFrom: '#0f766e',
    accentTo: '#0369a1',
    bodyHtml: `
    <p style="margin:0 0 12px;color:#0f172a">Client feedback from the completion report link:</p>
    ${table(
      row('Client / site', session.clientName) +
        row('Training date', [session.trainingDate, session.trainingTime].filter(Boolean).join(' · ')) +
        row('Overall, how was the OJT beneficial to our security operations?', reply.rating) +
        row('Client person', reply.personName || '—') +
        row('Date stamp', stamp),
    )}
    ${trainingBrandSignOffHtml()}
  `,
  })
  const subject = `OJT client feedback — ${session.clientName || 'site'} — ${reply.rating}`.slice(0, 180)
  return send(to[0], to.slice(1), subject, html)
}

export async function sendOjtSecurityObsMail(
  session: OjtSession,
  report: OjtReport,
): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  const rec = ojtSecurityObsRecipients(session)
  if ('error' in rec) return { ok: false, error: rec.error }
  const subject = `OJT Security Observations — ${session.clientName || 'site'} — ${report.reportDate || session.trainingDate || ''}`.trim()
  return send(rec.to, rec.cc, subject, buildSecurityObservationsHtml(session, report))
}

export type OjtSecObsWeeklyDigestRow = {
  trainingDate: string
  clientName: string
  assignedTo: string
  assignedEmail: string
  pendingDays: number | null
  formSaved: boolean
}

/** Weekly chase: open (not closed/shared) Branch Security Observation reports. */
export function buildSecObsWeeklyDigestHtml(opts: {
  branchName: string
  fromYmd: string
  toYmd: string
  rows: OjtSecObsWeeklyDigestRow[]
}): string {
  const rowsHtml = opts.rows
    .map((r, i) => {
      const pending =
        r.pendingDays == null ? '—' : r.pendingDays === 0 ? 'Due' : `${r.pendingDays} day(s)`
      const form = r.formSaved ? 'Saved — not shared' : 'Not filled'
      const assigned = [r.assignedTo, r.assignedEmail].filter(Boolean).join(' · ') || '—'
      return `<tr>
        <td style="padding:8px 10px;border:1px solid #d8e0ea">${i + 1}</td>
        <td style="padding:8px 10px;border:1px solid #d8e0ea">${escapeHtml(r.trainingDate || '—')}</td>
        <td style="padding:8px 10px;border:1px solid #d8e0ea">${escapeHtml(r.clientName || '—')}</td>
        <td style="padding:8px 10px;border:1px solid #d8e0ea">${escapeHtml(assigned)}</td>
        <td style="padding:8px 10px;border:1px solid #d8e0ea;font-weight:700;color:#b45309">${escapeHtml(pending)}</td>
        <td style="padding:8px 10px;border:1px solid #d8e0ea">${escapeHtml(form)}</td>
        <td style="padding:8px 10px;border:1px solid #d8e0ea;color:#b91c1c;font-weight:700">Open</td>
      </tr>`
    })
    .join('')

  return trainingTrack1EmailShell({
    title: 'Weekly Security Observation chase',
    subtitle: `${escapeHtml(opts.branchName)} · ${escapeHtml(opts.fromYmd)} to ${escapeHtml(opts.toYmd)}`,
    accentFrom: '#b45309',
    accentTo: '#c2410c',
    bodyHtml: `
  <p style="margin:0 0 12px;color:#0f172a">Dear HOD,</p>
  <p style="margin:0 0 12px;color:#0f172a">This is the <strong>weekly Branch Security Observation closing chase</strong> for
  <strong>${escapeHtml(opts.branchName)}</strong>.</p>
  <p style="margin:0 0 12px;color:#0f172a">The following observation reports are still <strong>not completed / not shared</strong>
  (period ${escapeHtml(opts.fromYmd)} to ${escapeHtml(opts.toYmd)}). Please arrange closing in
  Agile Training → On Site Tactical Training (OJT) → Branch Security Observation List.</p>
  <table style="border-collapse:collapse;width:100%;max-width:860px;font-family:Arial,sans-serif;font-size:13px;color:#0f172a;margin-top:12px">
    <thead>
      <tr style="background:#0f172a;color:#fde68a">
        <th style="padding:8px 10px;border:1px solid #334155;text-align:left">#</th>
        <th style="padding:8px 10px;border:1px solid #334155;text-align:left">Date</th>
        <th style="padding:8px 10px;border:1px solid #334155;text-align:left">Client / unit</th>
        <th style="padding:8px 10px;border:1px solid #334155;text-align:left">Assigned to</th>
        <th style="padding:8px 10px;border:1px solid #334155;text-align:left">Pending</th>
        <th style="padding:8px 10px;border:1px solid #334155;text-align:left">Form</th>
        <th style="padding:8px 10px;border:1px solid #334155;text-align:left">Status</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <p style="margin-top:14px;font-size:13px;color:#475569">
    Total open: <strong>${opts.rows.length}</strong>. This mail is a reminder only — it does not close the observation.
    Closing is done when the Security Observations form is Shared to HOD from the OJT app.
  </p>
  ${trainingBrandSignOffHtml()}
  `,
  })
}

export async function sendOjtSecObsWeeklyDigestMail(opts: {
  branchName: string
  hodEmail: string
  fromYmd: string
  toYmd: string
  rows: OjtSecObsWeeklyDigestRow[]
  sampleOnly?: boolean
}): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  if (!opts.rows.length) return { ok: true }
  const { suiteSampleEmail } = await import('../suite-digest-shell.js')
  const to = opts.sampleOnly ? suiteSampleEmail() : String(opts.hodEmail || '').trim()
  if (!to.includes('@')) return { ok: false, error: 'Branch HOD email is missing.' }
  const cc = opts.sampleOnly
    ? []
    : uniqueEmails([
        trainingDeptCcEmail(),
        suiteDirectorEmail(),
        'director@agilegroup.co.in',
      ]).filter((e) => e !== to.toLowerCase())
  const sampleTag = opts.sampleOnly ? ' [SAMPLE]' : ''
  const subject =
    `OJT weekly — open Security Observations (${opts.rows.length}) — ${opts.branchName}${sampleTag}`.trim()
  const html = buildSecObsWeeklyDigestHtml({
    branchName: opts.branchName,
    fromYmd: opts.fromYmd,
    toYmd: opts.toYmd,
    rows: opts.rows,
  })
  return send(to, cc, subject, html)
}
