/**
 * Resolve client guards (MIS) and send Training Confirmation WhatsApp via Fast2SMS / Whapi.
 *
 * Guard invite scope lives in ojt-guard-scope.ts (Training only).
 * Never edits Branch clients / Master Directory.
 */

import { guardsSendWhatsAppPing, guardsWhatsAppReady } from '../guards/whatsapp-send.js'
import {
  buildAttendanceRequestWa,
  buildTrainingConfirmIntimationWa,
} from './ojt-wa-messages.js'
import {
  collapsePremierTrainingPicks,
  displaySiteLocation,
  listGuardsForOjtSession,
  type ClientGuardPhone,
} from './ojt-guard-scope.js'
import {
  getTokenForSession,
  guardsLinkPublicUrl,
  loadGuardsResponses,
  prepareGuardsLink,
} from './ojt-guards-link-store.js'
import { setPendingTrainingWa, startTopicQuizForGuard } from './ojt-wa-reply.js'
import type { OjtSession } from './ojt-store.js'

export type { ClientGuardPhone }
export { displaySiteLocation, listGuardsForOjtSession, collapsePremierTrainingPicks }

function digits10(mobile: string): string {
  const d = String(mobile || '').replace(/\D/g, '')
  if (d.length >= 10) return d.slice(-10)
  return d
}

export async function previewTrainingConfirmWa(
  session: OjtSession,
  origin: string,
  createdBy: string,
): Promise<{ ok: true; text: string; url: string; guards: ClientGuardPhone[] } | { ok: false; error: string }> {
  const prepared = await prepareGuardsLink(session, createdBy)
  if (!prepared.ok) return prepared
  const url = guardsLinkPublicUrl(prepared.meta.token, origin)
  const text = buildTrainingConfirmIntimationWa(session, url)
  const guards = await listGuardsForOjtSession(session)
  return { ok: true, text, url, guards }
}

export type SendConfirmResult = {
  ok: boolean
  sent: number
  failed: number
  skipped: number
  waReady: boolean
  url: string
  text: string
  guards: ClientGuardPhone[]
  errors: string[]
  results: { mobile: string; name: string; ok: boolean; error?: string }[]
}

/** Send Training schedule Intimation to selected / all client guards. */
export async function sendTrainingConfirmToGuards(opts: {
  session: OjtSession
  origin: string
  createdBy: string
  mobiles?: string[]
}): Promise<SendConfirmResult> {
  const preview = await previewTrainingConfirmWa(opts.session, opts.origin, opts.createdBy)
  if (!preview.ok) {
    return {
      ok: false,
      sent: 0,
      failed: 0,
      skipped: 0,
      waReady: guardsWhatsAppReady(),
      url: '',
      text: '',
      guards: [],
      errors: [preview.error],
      results: [],
    }
  }
  const waReady = guardsWhatsAppReady()
  const want = new Set((opts.mobiles || []).map(digits10).filter((m) => m.length === 10))
  const withWa = preview.guards.filter((g) => g.canWhatsApp !== false && digits10(g.mobile).length === 10)
  const targets = want.size
    ? withWa.filter((g) => want.has(digits10(g.mobile)))
    : withWa.filter((g) => g.selectedForTraining !== false)

  if (!targets.length) {
    return {
      ok: false,
      sent: 0,
      failed: 0,
      skipped: 0,
      waReady,
      url: preview.url,
      text: preview.text,
      guards: preview.guards,
      errors: [
        preview.guards.length
          ? 'Guards are listed, but none have a valid 10-digit mobile for WhatsApp. Tick sites, or update mobiles on the MIS guards list (Training does not edit Branch clients).'
          : 'No guards listed yet. Tick the site(s) below and tap Save sites & show guards.',
      ],
      results: [],
    }
  }

  if (!waReady) {
    return {
      ok: false,
      sent: 0,
      failed: targets.length,
      skipped: 0,
      waReady: false,
      url: preview.url,
      text: preview.text,
      guards: preview.guards,
      errors: ['WhatsApp not configured (Fast2SMS / Whapi). You can still copy the message and link.'],
      results: targets.map((g) => ({ mobile: g.mobile, name: g.name, ok: false, error: 'WA not configured' })),
    }
  }

  const results: SendConfirmResult['results'] = []
  let sent = 0
  let failed = 0
  const errors: string[] = []
  let token = await getTokenForSession(opts.session.id)
  if (!token) {
    try {
      token = new URL(preview.url).searchParams.get('t') || ''
    } catch {
      token = ''
    }
  }
  for (const g of targets) {
    const r = await guardsSendWhatsAppPing(g.mobile, preview.text)
    if (r.ok) {
      sent += 1
      results.push({ mobile: g.mobile, name: g.name, ok: true })
      try {
        await setPendingTrainingWa(g.mobile, {
          sessionId: opts.session.id,
          branchId: opts.session.branchId,
          trainingDate: opts.session.trainingDate || '',
          trainingTime: opts.session.trainingTime || '',
          clientName: opts.session.clientName || '',
          token,
          confirmUrl: preview.url,
          guardName: g.name || 'Guard',
          employeeId: g.employeeId || '',
          mobile: g.mobile,
          ts: Date.now(),
        })
      } catch {
        /* keep send counted */
      }
    } else {
      failed += 1
      const err = r.error || 'Send failed'
      errors.push(`${g.name} (${g.mobile}): ${err}`)
      results.push({ mobile: g.mobile, name: g.name, ok: false, error: err })
    }
    await new Promise((res) => setTimeout(res, 350))
  }

  return {
    ok: sent > 0,
    sent,
    failed,
    skipped: 0,
    waReady,
    url: preview.url,
    text: preview.text,
    guards: preview.guards,
    errors: errors.slice(0, 20),
    results,
  }
}

/** Attendance request WhatsApp to guards who already replied EOI. */
export async function sendAttendanceRequestToResponded(opts: {
  session: OjtSession
  origin: string
  createdBy: string
}): Promise<SendConfirmResult> {
  const preview = await previewTrainingConfirmWa(opts.session, opts.origin, opts.createdBy)
  if (!preview.ok) {
    return {
      ok: false,
      sent: 0,
      failed: 0,
      skipped: 0,
      waReady: guardsWhatsAppReady(),
      url: '',
      text: '',
      guards: [],
      errors: [preview.error],
      results: [],
    }
  }
  const text = buildAttendanceRequestWa(opts.session, preview.url)
  const responses = await loadGuardsResponses(opts.session.id)
  const eoiMobiles = new Set(
    responses
      .filter((r) => r.eoiAt || r.status === 'attending')
      .map((r) => digits10(r.mobile))
      .filter((m) => m.length === 10),
  )
  const targets = preview.guards.filter((g) => {
    const m = digits10(g.mobile)
    if (g.canWhatsApp === false || m.length !== 10) return false
    return eoiMobiles.has(m) || g.selectedForTraining !== false
  })
  const waReady = guardsWhatsAppReady()
  if (!targets.length) {
    return {
      ok: false,
      sent: 0,
      failed: 0,
      skipped: 0,
      waReady,
      url: preview.url,
      text,
      guards: preview.guards,
      errors: [
        'No guards to ask for attendance. Send intimation first, or select guards for Training, then tap Attendance request.',
      ],
      results: [],
    }
  }
  if (!waReady) {
    return {
      ok: false,
      sent: 0,
      failed: targets.length,
      skipped: 0,
      waReady: false,
      url: preview.url,
      text,
      guards: preview.guards,
      errors: ['WhatsApp not configured.'],
      results: targets.map((g) => ({ mobile: g.mobile, name: g.name, ok: false, error: 'WA not configured' })),
    }
  }
  const results: SendConfirmResult['results'] = []
  let sent = 0
  let failed = 0
  const errors: string[] = []
  let token = await getTokenForSession(opts.session.id)
  if (!token) {
    try {
      token = new URL(preview.url).searchParams.get('t') || ''
    } catch {
      token = ''
    }
  }
  for (const g of targets) {
    const r = await guardsSendWhatsAppPing(g.mobile, text)
    if (r.ok) {
      sent += 1
      results.push({ mobile: g.mobile, name: g.name, ok: true })
      try {
        await setPendingTrainingWa(g.mobile, {
          sessionId: opts.session.id,
          branchId: opts.session.branchId,
          trainingDate: opts.session.trainingDate || '',
          trainingTime: opts.session.trainingTime || '',
          clientName: opts.session.clientName || '',
          token,
          confirmUrl: preview.url,
          guardName: g.name || 'Guard',
          employeeId: g.employeeId || '',
          mobile: g.mobile,
          ts: Date.now(),
        })
      } catch {
        /* keep send counted */
      }
    } else {
      failed += 1
      const err = r.error || 'Send failed'
      errors.push(`${g.name} (${g.mobile}): ${err}`)
      results.push({ mobile: g.mobile, name: g.name, ok: false, error: err })
    }
    await new Promise((res) => setTimeout(res, 350))
  }
  return {
    ok: sent > 0,
    sent,
    failed,
    skipped: 0,
    waReady,
    url: preview.url,
    text,
    guards: preview.guards,
    errors: errors.slice(0, 20),
    results,
  }
}

/** After attendance list — send 5 topic Yes/No questions to attended guards. */
export async function sendTopicQuizToAttended(opts: {
  session: OjtSession
  origin: string
  createdBy: string
}): Promise<SendConfirmResult> {
  const preview = await previewTrainingConfirmWa(opts.session, opts.origin, opts.createdBy)
  if (!preview.ok) {
    return {
      ok: false,
      sent: 0,
      failed: 0,
      skipped: 0,
      waReady: guardsWhatsAppReady(),
      url: '',
      text: '',
      guards: [],
      errors: [preview.error],
      results: [],
    }
  }
  const responses = await loadGuardsResponses(opts.session.id)
  const attended = new Set(
    responses
      .filter((r) => r.attendedAt || r.attendanceConfirmedAt)
      .map((r) => digits10(r.mobile))
      .filter((m) => m.length === 10),
  )
  const alreadyQuiz = new Set(
    responses
      .filter((r) => r.testDoneAt)
      .map((r) => digits10(r.mobile))
      .filter((m) => m.length === 10),
  )
  const targets = preview.guards.filter((g) => {
    const m = digits10(g.mobile)
    return g.canWhatsApp !== false && attended.has(m) && !alreadyQuiz.has(m)
  })
  const waReady = guardsWhatsAppReady()
  const text = 'Please answer 5 Yes/No questions from today’s training topics. Reply YES or NO.'
  if (!targets.length) {
    return {
      ok: false,
      sent: 0,
      failed: 0,
      skipped: 0,
      waReady,
      url: preview.url,
      text,
      guards: preview.guards,
      errors: [
        attended.size
          ? 'Attended guards have already answered the 5 questions.'
          : 'No attendance list yet. After you reach the site, send Attendance request. When guards reply ATTENDANCE, use this button.',
      ],
      results: [],
    }
  }
  if (!waReady) {
    return {
      ok: false,
      sent: 0,
      failed: targets.length,
      skipped: 0,
      waReady: false,
      url: preview.url,
      text,
      guards: preview.guards,
      errors: ['WhatsApp not configured.'],
      results: targets.map((g) => ({ mobile: g.mobile, name: g.name, ok: false, error: 'WA not configured' })),
    }
  }
  let token = await getTokenForSession(opts.session.id)
  if (!token) {
    try {
      token = new URL(preview.url).searchParams.get('t') || ''
    } catch {
      token = ''
    }
  }
  const results: SendConfirmResult['results'] = []
  let sent = 0
  let failed = 0
  const errors: string[] = []
  for (const g of targets) {
    try {
      await setPendingTrainingWa(g.mobile, {
        sessionId: opts.session.id,
        branchId: opts.session.branchId,
        trainingDate: opts.session.trainingDate || '',
        trainingTime: opts.session.trainingTime || '',
        clientName: opts.session.clientName || '',
        token,
        confirmUrl: preview.url,
        guardName: g.name || 'Guard',
        employeeId: g.employeeId || '',
        mobile: g.mobile,
        ts: Date.now(),
      })
      const ok = await startTopicQuizForGuard({
        sessionId: opts.session.id,
        branchId: opts.session.branchId,
        trainingDate: opts.session.trainingDate || '',
        trainingTime: opts.session.trainingTime || '',
        clientName: opts.session.clientName || '',
        token,
        confirmUrl: preview.url,
        guardName: g.name || 'Guard',
        employeeId: g.employeeId || '',
        mobile: digits10(g.mobile),
        ts: Date.now(),
      })
      if (ok) {
        sent += 1
        results.push({ mobile: g.mobile, name: g.name, ok: true })
      } else {
        failed += 1
        errors.push(`${g.name} (${g.mobile}): Could not start questions`)
        results.push({ mobile: g.mobile, name: g.name, ok: false, error: 'Could not start questions' })
      }
    } catch (e) {
      failed += 1
      const err = e instanceof Error ? e.message : 'Send failed'
      errors.push(`${g.name} (${g.mobile}): ${err}`)
      results.push({ mobile: g.mobile, name: g.name, ok: false, error: err })
    }
    await new Promise((res) => setTimeout(res, 350))
  }
  return {
    ok: sent > 0,
    sent,
    failed,
    skipped: 0,
    waReady,
    url: preview.url,
    text,
    guards: preview.guards,
    errors: errors.slice(0, 20),
    results,
  }
}
