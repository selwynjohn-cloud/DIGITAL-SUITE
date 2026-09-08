/**
 * Branch Security Observation List — WhatsApp, management Reminder, Reopen.
 */

import { Resend } from 'resend'
import { getUsers } from '../mis/store.js'
import { CONTROL_EMAIL } from '../mis/branch-mail-cc.js'
import { guardsSendWhatsAppPing, guardsWhatsAppReady } from '../guards/whatsapp-send.js'
import { pinMailFrom, sendSuiteEmail } from '../suite-mail.js'
import { suiteAppFooterPlainText } from '../suite-app-footer.js'
import {
  emptyOjtReport,
  findSession,
  loadOjtReport,
  monthOf,
  saveOjtReport,
  type OjtSession,
} from './ojt-store.js'
import { trainingBrandWhatsAppHeader, trainingTrack1EmailShell } from './training-brand.js'

function digits10(raw: string): string {
  const d = String(raw || '').replace(/\D/g, '')
  return d.length >= 10 ? d.slice(-10) : d
}

function monthHints(extra?: string): string[] {
  const out: string[] = []
  const add = (m: string) => {
    const v = String(m || '').slice(0, 7)
    if (/^\d{4}-\d{2}$/.test(v) && !out.includes(v)) out.push(v)
  }
  add(extra || '')
  const now = new Date()
  add(monthOf(now.toISOString()))
  const prev = new Date(now)
  prev.setMonth(prev.getMonth() - 1)
  add(monthOf(prev.toISOString()))
  const prev2 = new Date(now)
  prev2.setMonth(prev2.getMonth() - 2)
  add(monthOf(prev2.toISOString()))
  return out
}

async function locate(branchId: string, sessionId: string, monthHint?: string) {
  return findSession(branchId, sessionId, monthHints(monthHint))
}

async function phoneForEmail(email: string): Promise<string> {
  const em = String(email || '')
    .trim()
    .toLowerCase()
  if (!em) return ''
  const users = await getUsers()
  const u = users.find((x) => x.email?.trim().toLowerCase() === em && x.active !== false)
  return digits10(u?.phone || '')
}

function assignedOf(
  session: OjtSession,
  report: { securityObsAssignedOmName?: string; securityObsAssignedOmEmail?: string },
) {
  const omName = String(report.securityObsAssignedOmName || '').trim()
  const omEmail = String(report.securityObsAssignedOmEmail || '').trim()
  if (omName || omEmail) {
    return { name: omName || 'Assigned staff', email: omEmail }
  }
  return {
    name: session.trainerName || 'Trainer',
    email: session.trainerEmail || '',
  }
}

function actionText(session: OjtSession, assignedName: string, origin: string): string {
  const link = `${String(origin || 'https://www.agilegroup-digital.co.in').replace(/\/$/, '')}/training/ojt`
  return [
    trainingBrandWhatsAppHeader('Security Observation — action required'),
    '',
    `Dear ${assignedName || 'Team'},`,
    '',
    `Unit / Client: ${session.clientName || '—'}`,
    `Training date: ${session.trainingDate || '—'}`,
    `Venue: ${session.location || '—'}`,
    '',
    'Please complete the Security Observation Closing / Completion report in Agile Training (Track 1).',
    '',
    'Open Track 1 → Branch Security Observation List:',
    link,
    '',
    suiteAppFooterPlainText(),
  ].join('\n')
}

async function sendReminderEmail(to: string, subject: string, text: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey || !to.includes('@')) return false
  const resend = new Resend(apiKey)
  const html = trainingTrack1EmailShell({
    title: 'Security Observation — management reminder',
    subtitle: 'On Site Tactical Training (OJT)',
    bodyHtml: `<pre style="white-space:pre-wrap;font:inherit;margin:0;color:#0f172a">${text.replace(/</g, '&lt;')}</pre>`,
    includeImportantNumbers: false,
  })
  try {
    const result = await sendSuiteEmail(resend, {
      from: pinMailFrom(),
      to,
      cc: [CONTROL_EMAIL, 'training@agilegroup.co.in'],
      subject,
      html,
    })
    return !result.error
  } catch {
    return false
  }
}

export async function sendSecObsWhatsApp(opts: {
  sessionId: string
  branchId: string
  sentBy: string
  origin?: string
  monthHint?: string
}): Promise<{ ok: true; mobile: string; name: string } | { ok: false; error: string }> {
  const found = await locate(opts.branchId, opts.sessionId, opts.monthHint)
  if (!found) return { ok: false, error: 'Session not found.' }
  const report = (await loadOjtReport(found.session.id)) || emptyOjtReport(found.session.id)
  if (report.securityObsClosureSubmittedAt) {
    return { ok: false, error: 'Already completed — no WhatsApp needed.' }
  }
  const assigned = assignedOf(found.session, report)
  if (!assigned.email) {
    return { ok: false, error: 'No email on assigned staff / trainer. Add trainer email on the schedule.' }
  }
  const mobile = await phoneForEmail(assigned.email)
  if (mobile.length !== 10) {
    return {
      ok: false,
      error: `No mobile on User Management for ${assigned.email}. Add phone, then try again.`,
    }
  }
  if (!guardsWhatsAppReady()) {
    return { ok: false, error: 'WhatsApp not configured (Fast2SMS / Whapi).' }
  }
  const text = actionText(found.session, assigned.name, opts.origin || '')
  const sent = await guardsSendWhatsAppPing(mobile, text)
  if (!sent.ok) return { ok: false, error: sent.error || 'WhatsApp send failed.' }
  report.securityObsWaSentAt = new Date().toISOString()
  report.securityObsWaSentBy = opts.sentBy
  if (!report.securityObsAssignedOmEmail && assigned.email) {
    report.securityObsAssignedOmName = assigned.name
    report.securityObsAssignedOmEmail = assigned.email
    report.securityObsAssignedAt = report.securityObsAssignedAt || new Date().toISOString()
    report.securityObsAssignedBy = opts.sentBy
  }
  await saveOjtReport(report)
  return { ok: true, mobile, name: assigned.name }
}

export async function sendSecObsReminder(opts: {
  sessionId: string
  branchId: string
  sentBy: string
  origin?: string
  monthHint?: string
}): Promise<{ ok: true; channels: string[] } | { ok: false; error: string }> {
  const found = await locate(opts.branchId, opts.sessionId, opts.monthHint)
  if (!found) return { ok: false, error: 'Session not found.' }
  const report = (await loadOjtReport(found.session.id)) || emptyOjtReport(found.session.id)
  if (report.securityObsClosureSubmittedAt) {
    return { ok: false, error: 'Already completed — reminder not needed.' }
  }
  const assigned = assignedOf(found.session, report)
  if (!assigned.email) return { ok: false, error: 'No assigned staff / trainer email.' }

  const channels: string[] = []
  const subject = `Reminder — Security Observation closing · ${found.session.clientName || 'Unit'} · ${found.session.trainingDate || ''}`
  const bodyText = actionText(found.session, assigned.name, opts.origin || '')
  if (await sendReminderEmail(assigned.email, subject, bodyText)) channels.push('email')

  const wa = await sendSecObsWhatsApp({
    sessionId: opts.sessionId,
    branchId: opts.branchId,
    sentBy: opts.sentBy,
    origin: opts.origin,
    monthHint: opts.monthHint || found.session.trainingDate,
  })
  if (wa.ok) channels.push('whatsapp')

  if (!channels.length) {
    return { ok: false, error: (!wa.ok && wa.error) || 'Reminder failed.' }
  }

  const latest = (await loadOjtReport(found.session.id)) || report
  latest.securityObsReminderAt = new Date().toISOString()
  latest.securityObsReminderBy = opts.sentBy
  latest.securityObsReminderCount = (latest.securityObsReminderCount || 0) + 1
  await saveOjtReport(latest)
  return { ok: true, channels }
}

export async function reopenSecObsClosure(opts: {
  sessionId: string
  branchId: string
  reopenedBy: string
  monthHint?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const found = await locate(opts.branchId, opts.sessionId, opts.monthHint)
  if (!found) return { ok: false, error: 'Session not found.' }
  const report = await loadOjtReport(found.session.id)
  if (!report) return { ok: false, error: 'Observation report not found.' }
  if (!report.securityObsClosureSubmittedAt) {
    return { ok: false, error: 'This observation is already open.' }
  }
  report.securityObsClosureDate = ''
  report.securityObsClosureText = ''
  report.securityObsClosureFiles = []
  report.securityObsClosureSubmittedAt = ''
  report.securityObsClosureSubmittedBy = ''
  await saveOjtReport(report)
  return { ok: true }
}
