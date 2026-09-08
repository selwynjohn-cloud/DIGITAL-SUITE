/**
 * Training Add schedule — vehicle ask / confirm mails.
 * Does not change monthly schedule or client intimation formats.
 */

import { Resend } from 'resend'
import { CONTROL_EMAIL } from '../mis/branch-mail-cc.js'
import { pinMailFrom, sendSuiteEmail, suiteDirectorEmail } from '../suite-mail.js'
import { trainingTrack1EmailShell } from './training-brand.js'
import type { OjtSession } from './ojt-store.js'

function esc(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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

function detailsTable(session: OjtSession, extra: Array<[string, string]>): string {
  const rows = [
    ['Client', session.clientName],
    ['Date', session.trainingDate],
    ['Time', session.trainingTime],
    ['Venue', session.location],
    ['Trainer', [session.trainerName, session.trainerEmail].filter(Boolean).join(' · ')],
    ['Control case', session.controlCaseNo],
    ...extra,
  ]
    .filter(([, v]) => String(v || '').trim())
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 10px;border:1px solid #d8e0ea;background:#f7fafc;font-weight:700;width:32%">${esc(k)}</td><td style="padding:8px 10px;border:1px solid #d8e0ea">${esc(v)}</td></tr>`,
    )
    .join('')
  return `<table style="border-collapse:collapse;width:100%;max-width:720px;font-size:14px">${rows}</table>`
}

async function send(
  to: string[],
  cc: string[],
  subject: string,
  html: string,
): Promise<{ ok: true; messageId?: string } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email is not configured (RESEND_API_KEY).' }
  const resend = new Resend(apiKey)
  try {
    const result = await sendSuiteEmail(resend, {
      from: pinMailFrom(),
      to,
      cc: cc.length ? cc : undefined,
      subject,
      html,
    })
    if (result.error) return { ok: false, error: result.error.message || 'Mail failed' }
    const messageId = String((result.data as { id?: string } | null)?.id ?? '').trim() || undefined
    return { ok: true, messageId }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Mail failed' }
  }
}

/** Trainer asked for a vehicle — Control inbox. */
export async function sendTrainingVehicleAskMail(session: OjtSession) {
  const to = uniqueEmails([CONTROL_EMAIL])
  if (!to.length) return { ok: false as const, error: 'Control email missing.' }
  const cc = uniqueEmails([
    session.trainerEmail,
    'training@agilegroup.co.in',
    suiteDirectorEmail(),
    'director@agilegroup.co.in',
  ])
  const html = trainingTrack1EmailShell({
    title: 'Vehicle required — Training',
    subtitle: 'Please confirm driver and vehicle',
    bodyHtml: `<p>The trainer has asked for a <b>vehicle</b> for this On Site Tactical Training.</p>
      ${detailsTable(session, [])}
      <p style="margin-top:14px">Open <b>Agile Control → Night Visit Vehicles</b>, open this case, enter <b>Driver name</b> and <b>Vehicle number</b>, then tap <b>Accept vehicle</b>.</p>`,
  })
  return send(
    to,
    cc,
    `Vehicle required — Training — ${session.clientName || 'session'} — ${session.trainingDate || ''}`.trim(),
    html,
  )
}

/** Control confirmed — trainer inbox. */
export async function sendTrainingVehicleConfirmedMail(session: OjtSession) {
  const to = uniqueEmails([session.trainerEmail, 'training@agilegroup.co.in'])
  if (!to.length) return { ok: false as const, error: 'Trainer email missing.' }
  const cc = uniqueEmails([CONTROL_EMAIL, suiteDirectorEmail(), 'director@agilegroup.co.in'])
  const html = trainingTrack1EmailShell({
    title: 'Vehicle confirmed — Training',
    subtitle: 'Control has allotted the vehicle',
    bodyHtml: `<p>Control has confirmed the vehicle for this training.</p>
      ${detailsTable(session, [
        ['Driver', session.vehicleDriverName],
        ['Vehicle number', session.vehicleRegNo],
      ])}
      <p style="margin-top:14px">This also shows on <b>Add schedule</b> when you open the same session.</p>`,
  })
  return send(
    to,
    cc,
    `Vehicle confirmed — Training — ${session.clientName || 'session'} — ${session.vehicleRegNo || session.vehicleDriverName}`.trim(),
    html,
  )
}
