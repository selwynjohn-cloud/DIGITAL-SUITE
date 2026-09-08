/**
 * Formal Incident / Inquiry Report letter (matches Agile IR Word format) + email send.
 */
import { Resend } from 'resend'
import {
  pinMailFrom,
  pinMailReplyTo,
  sendSuiteEmail,
  type SuiteEmailAttachment,
} from '../suite-mail.js'
import { LOKESH_CC_EMAIL, MIS_DIRECTOR_CC_EMAIL } from './branch-mail-cc.js'
import { suiteAppOpenPageFooterInlineHtml } from '../suite-app-footer.js'
import { branchLetterheadAddressLines } from './branch-letterhead.js'
import { MIS_BRAND, misLetterPrintFooter } from './brand.js'
import { incidentSlaForReport, INCIDENT_CLOSE_HOURS } from './incident-report-sla.js'
import {
  dataUrlToAttachment,
  getIncidentAttachmentDataUrl,
  HDFC_SPOC_CC_EMAIL,
  isHdfcClient,
  type MisIncidentReport,
} from './incident-report-store.js'

function esc(s: unknown): string {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function nl(s: unknown): string {
  return esc(s).replaceAll('\n', '<br>')
}

/** Display date like 11 Jul 2026 */
export function fmtIncidentLetterDate(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || '').trim())
  if (!m) return String(ymd || '')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const mon = months[Number(m[2]) - 1] || m[2]
  return `${Number(m[3])} ${mon} ${m[1]}`
}

function row(n: number, label: string, value: string): string {
  return (
    `<tr>` +
    `<td style="border:1px solid #cbd5e1;padding:8px;width:40px;text-align:center;font-weight:800;vertical-align:top;color:#14224f">${n}</td>` +
    `<td style="border:1px solid #cbd5e1;padding:8px;width:220px;font-weight:700;vertical-align:top;color:#14224f">${esc(label)}</td>` +
    `<td style="border:1px solid #cbd5e1;padding:8px;vertical-align:top;line-height:1.45;color:#0f172a">${nl(value) || '—'}</td>` +
    `</tr>`
  )
}

/** Suite navy + gold letterhead — address follows sending branch. */
function incidentLetterHeaderHtml(r: MisIncidentReport): string {
  const addr = branchLetterheadAddressLines(r.branchName)
    .map((line) => esc(line))
    .join('<br>')
  return (
    `<div style="background:linear-gradient(135deg,#14224f 0%,#1e3a8a 58%,#0f172a 100%);padding:18px 20px 16px;border-radius:12px 12px 0 0;border-bottom:4px solid #c9a84c">` +
    `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">` +
    `<tr>` +
    `<td width="72" style="vertical-align:middle;padding-right:14px">` +
    `<img src="${MIS_BRAND.logoUrl}" alt="Agile" width="64" height="64" style="display:block;border-radius:10px;background:#fff;padding:4px" />` +
    `</td>` +
    `<td style="vertical-align:middle">` +
    `<div style="font-size:17px;font-weight:800;color:#ffffff;line-height:1.35;letter-spacing:.2px">${esc(MIS_BRAND.company)}</div>` +
    `<div style="font-size:12px;color:#fde68a;margin-top:4px;font-weight:700">Incident / Inquiry Report · ${esc(r.branchName || 'Branch')}</div>` +
    `</td>` +
    `</tr>` +
    `</table>` +
    `<div style="margin-top:14px;padding:10px 12px;background:rgba(255,255,255,.1);border-radius:8px;border-left:4px solid #c9a84c">` +
    `<div style="font-size:12px;color:#e2e8f0;line-height:1.5">${addr}</div>` +
    `</div>` +
    `</div>`
  )
}

/** Full letter HTML for preview / email (client-facing) — suite header + branch address. */
export function buildIncidentReportLetterHtml(r: MisIncidentReport): string {
  const when =
    `${fmtIncidentLetterDate(r.incidentDate)}` +
    (r.incidentTime ? ` at about ${esc(r.incidentTime)}` : '')
  const informedWhen =
    r.informedToClientDate
      ? `${fmtIncidentLetterDate(r.informedToClientDate)}` +
        (r.informedToClientTime ? ` at about ${esc(r.informedToClientTime)}` : '')
      : '—'
  const dated = fmtIncidentLetterDate(r.reportDate)
  const humanSuggestion = String(r.suggestion || '').trim()
  const aiSuggestion = String(r.aiSuggestion || '').trim()
  const atts = Array.isArray(r.attachments) ? r.attachments : []
  const attLines = atts.length
    ? atts
        .map(
          (a, i) =>
            `${i + 1}. ${a.kind === 'photo' ? 'Photo' : 'Document'}: ${a.label || a.filename}`,
        )
        .join('\n')
    : ''

  const body =
    `<div style="max-width:780px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">` +
    incidentLetterHeaderHtml(r) +
    `<div style="padding:18px 20px 20px">` +
    `<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:13px;font-weight:700;margin-bottom:14px;color:#14224f">` +
    `<div>REF: ${esc(r.refNo)}</div><div>Dated: ${esc(dated)}</div>` +
    `</div>` +
    `<h2 style="text-align:center;color:#14224f;font-size:18px;margin:0 0 14px;letter-spacing:.04em">INCIDENT / INQUIRY REPORT</h2>` +
    `<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px">` +
    `<thead><tr>` +
    `<th style="border:1px solid #14224f;padding:8px;background:#14224f;color:#c9a84c;width:40px">Sl.No</th>` +
    `<th style="border:1px solid #14224f;padding:8px;background:#14224f;color:#c9a84c;width:220px">PARTICULARS</th>` +
    `<th style="border:1px solid #14224f;padding:8px;background:#14224f;color:#c9a84c">BRIEF NOTE</th>` +
    `</tr></thead><tbody>` +
    row(1, 'Date & Time of Incident', when) +
    row(2, 'Informed to client (date & time)', informedWhen) +
    row(3, 'Place of Incident', r.placeOfIncident || r.clientName) +
    row(4, 'Type of incident', r.typeOfIncident) +
    row(5, 'Loss of Property & approximate cost', r.lossOfProperty || 'Nil') +
    row(6, 'Sources of Information received', r.sourceOfInfo) +
    row(7, 'Personnel involved in incident', r.personnelInvolved) +
    row(8, 'Name of Inquiry Officer/Manager', r.inquiryOfficer) +
    row(9, 'Brief description of the incident/Inquiry', r.briefDescription) +
    row(10, 'Suspected persons if any', r.suspectedPersons || '') +
    row(11, 'Findings', r.findings) +
    row(12, 'Action Taken', r.actionTaken) +
    row(13, 'Suggestion (Branch / Inquiry Officer)', humanSuggestion) +
    `</tbody></table>` +
    (aiSuggestion
      ? `<div style="margin:0 0 16px;padding:12px 14px;border:1px solid #c9a84c;border-radius:10px;background:#fffbeb">` +
        `<div style="font-size:13px;font-weight:800;color:#14224f;margin-bottom:8px">Alerts &amp; suggestions (after human reporting)</div>` +
        `<div style="font-size:13px;line-height:1.5;color:#0f172a">${nl(aiSuggestion)}</div>` +
        `</div>`
      : '') +
    (attLines
      ? `<p style="font-size:13px;line-height:1.5;margin:0 0 12px"><b>Enclosures / attachments:</b><br>${nl(attLines)}</p>`
      : '') +
    (r.photosNote
      ? `<p style="font-size:13px;line-height:1.5;margin:0 0 12px">${nl(r.photosNote)}</p>`
      : '') +
    `<p style="font-size:13px;margin:16px 0 20px">Kindly contact the Undersigned for further Clarification.</p>` +
    `<div style="font-size:13px;line-height:1.6">` +
    `<div><b>Name:</b> ${esc(r.signName)}</div>` +
    `<div><b>Designation:</b> ${esc(r.signDesignation)}</div>` +
    `<div><b>Email:</b> ${esc(r.signEmail)}</div>` +
    `<div><b>Branch:</b> ${esc(r.branchName)}</div>` +
    `</div>` +
    `<div style="margin-top:22px">${misLetterPrintFooter()}</div>` +
    `</div></div>`

  return (
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>Incident Report ${esc(r.refNo)}</title></head><body style="margin:0;background:#f1f5f9;padding:12px">${body}</body></html>`
  )
}

export function buildIncidentCcList(opts: {
  clientName: string
  place: string
  senderEmail: string
}): string[] {
  const cc = new Set<string>()
  const add = (e: string) => {
    const x = String(e || '')
      .trim()
      .toLowerCase()
    if (x.includes('@')) cc.add(x)
  }
  add(opts.senderEmail)
  add(LOKESH_CC_EMAIL)
  add(MIS_DIRECTOR_CC_EMAIL)
  if (isHdfcClient(opts.clientName, opts.place)) add(HDFC_SPOC_CC_EMAIL)
  return [...cc]
}

export async function buildIncidentMailAttachments(
  r: MisIncidentReport,
): Promise<SuiteEmailAttachment[]> {
  const out: SuiteEmailAttachment[] = []
  for (const meta of r.attachments || []) {
    const dataUrl = await getIncidentAttachmentDataUrl(meta.id)
    if (!dataUrl) continue
    const att = dataUrlToAttachment(dataUrl, meta.filename || meta.label || 'attachment', meta.contentType)
    if (att) out.push(att)
  }
  return out
}

export async function sendIncidentReportToClient(r: MisIncidentReport): Promise<{
  ok: boolean
  error?: string
  to?: string[]
  cc?: string[]
}> {
  const to = String(r.clientEmail || '')
    .trim()
    .toLowerCase()
  if (!to.includes('@')) return { ok: false, error: 'Client email is required to submit.' }

  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) return { ok: false, error: 'Email service not configured.' }

  const sender = String(r.signEmail || r.createdBy || '')
    .trim()
    .toLowerCase()
  const cc = buildIncidentCcList({
    clientName: r.clientName,
    place: r.placeOfIncident,
    senderEmail: sender,
  }).filter((e) => e !== to)

  const subject = `Incident / Inquiry Report — ${r.clientName || r.placeOfIncident} — ${r.refNo}`
  const html = buildIncidentReportLetterHtml(r)
  const attachments = await buildIncidentMailAttachments(r)
  const resend = new Resend(key)

  try {
    const result = await sendSuiteEmail(resend, {
      from: pinMailFrom(),
      to,
      cc,
      subject,
      html,
      replyTo: pinMailReplyTo(),
      attachments,
      skipDirectorCc: true,
    })
    if (result.error) {
      return { ok: false, error: result.error.message || 'Could not send email.' }
    }
    return { ok: true, to: [to], cc }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not send email.' }
  }
}

/** Dedicated copy to Director when HOD submits incident report to client. */
export async function sendIncidentReportSubmissionToDirector(
  r: MisIncidentReport,
  opts?: { clientTo?: string[]; clientCc?: string[] },
): Promise<{ ok: boolean; error?: string; to?: string }> {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) return { ok: false, error: 'Email service not configured.' }
  const to = MIS_DIRECTOR_CC_EMAIL
  const html = buildIncidentReportLetterHtml(r)
  const attachments = await buildIncidentMailAttachments(r)
  const resend = new Resend(key)
  const clientLine =
    opts?.clientTo?.length
      ? `<p style="font-size:13px;color:#64748b;margin:0 0 12px">Client copy sent to: <b>${esc(opts.clientTo.join(', '))}</b>${opts.clientCc?.length ? ` · CC: ${esc(opts.clientCc.join(', '))}` : ''}</p>`
      : ''
  try {
    const result = await sendSuiteEmail(resend, {
      from: pinMailFrom(),
      to,
      cc: [LOKESH_CC_EMAIL].filter((e) => e !== to),
      subject: `Incident Report submitted — ${r.branchName || 'Branch'} — ${r.refNo}`,
      html:
        `<div style="font-family:Segoe UI,Arial,sans-serif;padding:12px;background:#ecfdf5;border:1px solid #22c55e;margin-bottom:12px;border-radius:8px">` +
        `<b>Incident / Inquiry Report submitted</b> by ${esc(r.branchName)} — ${esc(r.signName || r.createdBy || 'HOD')}.` +
        `</div>` +
        clientLine +
        html +
        suiteAppOpenPageFooterInlineHtml(),
      replyTo: pinMailReplyTo(),
      attachments,
      skipDirectorCc: true,
    })
    if (result.error) {
      return { ok: false, error: result.error.message || 'Could not send email to Director.' }
    }
    return { ok: true, to }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not send email to Director.' }
  }
}

/** Internal test / review copy to Director (does not mark report submitted). */
export async function sendIncidentDraftToDirector(r: MisIncidentReport): Promise<{
  ok: boolean
  error?: string
  to?: string
}> {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) return { ok: false, error: 'Email service not configured.' }
  const to = MIS_DIRECTOR_CC_EMAIL
  const html = buildIncidentReportLetterHtml(r)
  const attachments = await buildIncidentMailAttachments(r)
  const resend = new Resend(key)
  try {
    const result = await sendSuiteEmail(resend, {
      from: pinMailFrom(),
      to,
      subject: `[TEST DRAFT] Incident / Inquiry Report — ${r.clientName || r.placeOfIncident} — ${r.refNo}`,
      html:
        `<div style="font-family:Segoe UI,Arial,sans-serif;padding:12px;background:#fef3c7;border:1px solid #f59e0b;margin-bottom:12px;border-radius:8px">` +
        `<b>TEST DRAFT</b> — for Director review only. Not yet submitted to the client.` +
        `</div>` +
        html,
      replyTo: pinMailReplyTo(),
      attachments,
      skipDirectorCc: true,
    })
    if (result.error) {
      return { ok: false, error: result.error.message || 'Could not send email.' }
    }
    return { ok: true, to }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not send email.' }
  }
}

/** Remind branch HOD to close open incident (submit report to client). */
export async function sendIncidentCloseReminder(
  r: MisIncidentReport,
  opts: { to: string[]; cc: string[]; sentBy: string },
): Promise<{ ok: boolean; error?: string; to?: string[] }> {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) return { ok: false, error: 'Email service not configured.' }
  const to = opts.to.filter((e) => e.includes('@'))
  if (!to.length) return { ok: false, error: 'No HOD email on file for this branch.' }

  const sla = incidentSlaForReport(r)
  const barPct = Math.min(100, sla.pct)
  const barColor =
    sla.level === 'overdue'
      ? '#f87171'
      : sla.level === 'urgent'
        ? '#fb923c'
        : sla.level === 'warn'
          ? '#fbbf24'
          : '#4ade80'

  const html =
    `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:640px;color:#0f172a">` +
    `<div style="background:linear-gradient(135deg,#14224f,#1e3a8a);color:#fff;padding:16px 18px;border-radius:10px 10px 0 0;border-bottom:4px solid #c9a84c">` +
    `<div style="font-size:18px;font-weight:800">Incident report — please close</div>` +
    `<div style="font-size:13px;color:#fde68a;margin-top:4px">${esc(r.branchName)} · ${esc(r.refNo || 'Draft')}</div>` +
    `</div>` +
    `<div style="padding:16px 18px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">` +
    `<p style="line-height:1.55">Dear Team,</p>` +
    `<p style="line-height:1.55">Management reminder: please <b>complete and submit the Incident / Inquiry Report</b> to the client within <b>${INCIDENT_CLOSE_HOURS} hours</b> of the incident (client must be informed immediately).</p>` +
    `<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:14px">` +
    `<tr><td style="padding:6px 0;color:#64748b;width:140px">Client / Site</td><td style="padding:6px 0"><b>${esc(r.clientName || r.placeOfIncident)}</b></td></tr>` +
    `<tr><td style="padding:6px 0;color:#64748b">Incident</td><td style="padding:6px 0">${esc(r.typeOfIncident || '—')}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#64748b">Informed to client</td><td style="padding:6px 0">${esc(r.informedToClientDate || '—')} ${esc(r.informedToClientTime || '')}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#64748b">Close by</td><td style="padding:6px 0"><b>${esc(sla.dueLabel)}</b></td></tr>` +
    `<tr><td style="padding:6px 0;color:#64748b">Status</td><td style="padding:6px 0"><b>${esc(sla.label)}</b></td></tr>` +
    `</table>` +
    `<div style="margin:14px 0">` +
    `<div style="font-size:12px;color:#64748b;margin-bottom:4px">Time to close (${INCIDENT_CLOSE_HOURS}h window)</div>` +
    `<div style="height:12px;background:#e2e8f0;border-radius:999px;overflow:hidden">` +
    `<div style="height:100%;width:${barPct}%;background:${barColor};border-radius:999px"></div>` +
    `</div>` +
    `</div>` +
    `<p style="line-height:1.55">Open <b>MIS Staff portal → Incident Reporting</b>, finish findings / action taken, preview the letter, and tap <b>Submit to client</b>.</p>` +
    `<p style="font-size:12px;color:#64748b;margin-top:16px">Reminder sent by ${esc(opts.sentBy)} · Agile MIS</p>` +
    `</div></div>`

  const resend = new Resend(key)
  try {
    const result = await sendSuiteEmail(resend, {
      from: pinMailFrom(),
      to,
      cc: opts.cc,
      subject: `[Reminder] Close incident report — ${r.refNo || r.clientName} — ${sla.level === 'overdue' ? 'OVERDUE' : 'due soon'}`,
      html,
      replyTo: pinMailReplyTo(),
      skipDirectorCc: true,
    })
    if (result.error) {
      return { ok: false, error: result.error.message || 'Could not send reminder.' }
    }
    return { ok: true, to }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not send reminder.' }
  }
}
