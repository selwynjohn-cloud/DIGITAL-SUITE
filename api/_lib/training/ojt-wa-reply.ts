/**
 * Training Confirmation — WhatsApp reply keywords EOI and ATTENDANCE.
 * Pending keyed by guard mobile; inbound via Fast2SMS + Whapi webhooks.
 */

import { redisCommand } from '../pulse/store.js'
import { whatsappChatId } from '../pulse/whatsapp.js'
import { guardsSendWhatsAppPing } from '../guards/whatsapp-send.js'
import { findSession, monthOf } from './ojt-store.js'
import {
  attendanceWindowCheck,
  findOrCreateResponse,
  guardsLinkPublicUrl,
  upsertGuardsResponse,
} from './ojt-guards-link-store.js'
import { pickSessionYesNoQuestions } from './ojt-attendance-quiz.js'
import {
  buildAttendanceAckWa,
  buildEoiAckWa,
  buildMarksThankYouWa,
  buildTopicQuizQuestionWa,
  parseEoiJoiningDate,
} from './ojt-wa-messages.js'
import { submitYesNoQuiz } from './ojt-guards-link-store.js'
import { trainingBrandWhatsAppHeader } from './training-brand.js'

const PENDING_PREFIX = 'training:ojt-wa-pending:'

export type PendingTrainingWa = {
  sessionId: string
  branchId: string
  trainingDate: string
  trainingTime: string
  clientName: string
  token: string
  confirmUrl: string
  guardName: string
  employeeId: string
  mobile: string
  ts: number
  /** Next topic question index (0–4). Set after ATTENDANCE. */
  quizIndex?: number
  quizAnswers?: { qId: string; choice: string }[]
}

function mobile10(raw: string): string {
  const d = String(raw || '').replace(/\D/g, '')
  if (d.length >= 10) return d.slice(-10)
  return d
}

function pendingKey(mobile: string) {
  const digits = whatsappChatId(mobile).replace(/\D/g, '')
  return `${PENDING_PREFIX}${digits.slice(-12)}`
}

export async function setPendingTrainingWa(mobile: string, row: PendingTrainingWa) {
  const m = mobile10(mobile)
  if (m.length !== 10) return
  await redisCommand(['SET', pendingKey(m), JSON.stringify({ ...row, mobile: m }), 'EX', 1209600])
}

export async function getPendingTrainingWa(mobile: string): Promise<PendingTrainingWa | null> {
  const d = await redisCommand(['GET', pendingKey(mobile)])
  if (!d?.result || typeof d.result !== 'string') return null
  try {
    return JSON.parse(d.result) as PendingTrainingWa
  } catch {
    return null
  }
}

export async function clearPendingTrainingWa(mobile: string) {
  await redisCommand(['DEL', pendingKey(mobile)])
}

function normalizeKeyword(text: string): string {
  return String(text || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
}

export function isEoiReply(text: string): boolean {
  const t = normalizeKeyword(text)
  return t === 'EOI' || t.startsWith('EOI')
}

export function isAttendanceReply(text: string): boolean {
  const t = normalizeKeyword(text)
  return t === 'ATTENDANCE' || t.startsWith('ATTENDANCE')
}

export function parseYesNoReply(text: string): 'Yes' | 'No' | null {
  const t = normalizeKeyword(text)
  if (t === 'YES' || t === 'Y') return 'Yes'
  if (t === 'NO' || t === 'N') return 'No'
  return null
}

async function reply(mobile: string, text: string) {
  try {
    await guardsSendWhatsAppPing(mobile10(mobile), text)
  } catch {
    /* ignore ack failure */
  }
}

/** Record Expression of Interest (will attend, or absentee with DOJ). */
async function recordEoi(pending: PendingTrainingWa, text = ''): Promise<boolean> {
  const deviceKey = `wa:${pending.mobile}`
  const row = await findOrCreateResponse(pending.sessionId, deviceKey)
  row.status = 'attending'
  if (!row.guardName && pending.guardName) row.guardName = pending.guardName.slice(0, 120)
  if (!row.employeeId && pending.employeeId) row.employeeId = pending.employeeId.slice(0, 40)
  row.eoiAt = new Date().toISOString()
  row.mobile = pending.mobile
  const doj = parseEoiJoiningDate(text)
  if (doj) row.eoiJoiningDate = doj
  await upsertGuardsResponse(row)
  try {
    const { upsertTrainingEoiFromResponse } = await import('../recruitment/training-eoi-store.js')
    const { getBranches } = await import('../mis/store.js')
    const branches = await getBranches(false)
    const br = branches.find((b) => b.id === pending.branchId)
    await upsertTrainingEoiFromResponse({
      session: {
        id: pending.sessionId,
        branchId: pending.branchId,
        clientName: pending.clientName,
        location: '',
        trainingDate: pending.trainingDate,
        trainingTime: pending.trainingTime,
        trainerName: '',
      },
      branchName: br?.name || '',
      response: row,
    })
  } catch {
    /* Recruitment ledger is best-effort */
  }
  await reply(
    pending.mobile,
    buildEoiAckWa({
      guardName: row.guardName || pending.guardName || 'Guard',
      clientName: pending.clientName,
      trainingDate: pending.trainingDate,
      trainingTime: pending.trainingTime,
      joiningDate: doj || row.eoiJoiningDate || '',
    }),
  )
  return true
}

/** Record day-of attendance → quiz link. */
async function recordAttendance(pending: PendingTrainingWa): Promise<boolean> {
  const found = await findSession(pending.branchId, pending.sessionId, [
    pending.trainingDate,
    monthOf(pending.trainingDate),
  ])
  const session = found?.session
  const trainingDate = session?.trainingDate || pending.trainingDate
  const trainingTime = session?.trainingTime || pending.trainingTime

  const window = attendanceWindowCheck(trainingDate, trainingTime)
  if (window.ok === false) {
    await reply(
      pending.mobile,
      [
        trainingBrandWhatsAppHeader(),
        window.error,
        '',
        'For schedule interest, reply: EOI',
        'On training day, reply: ATTENDANCE',
        '',
        pending.confirmUrl || guardsLinkPublicUrl(pending.token),
      ].join('\n'),
    )
    return true
  }

  const deviceKey = `wa:${pending.mobile}`
  const row = await findOrCreateResponse(pending.sessionId, deviceKey)
  const ackOpts = {
    guardName: row.guardName || pending.guardName || 'Guard',
    clientName: pending.clientName,
    trainingDate,
    trainingTime,
  }
  const url = pending.confirmUrl || guardsLinkPublicUrl(pending.token)

  if (row.attendedAt) {
    await reply(pending.mobile, buildAttendanceAckWa(ackOpts, url))
    await startTopicQuizForGuard(pending)
    return true
  }

  row.status = 'attending'
  row.guardName = ackOpts.guardName.slice(0, 120)
  row.employeeId = (row.employeeId || pending.employeeId || '').slice(0, 40)
  row.mobile = pending.mobile
  if (!row.eoiAt) row.eoiAt = new Date().toISOString()
  row.attendedAt = new Date().toISOString()
  if (!row.attendanceConfirmedAt) {
    row.attendanceConfirmedAt = row.attendedAt
    row.attendanceConfirmedBy = 'whatsapp-attendance'
  }
  await upsertGuardsResponse(row)
  await reply(pending.mobile, buildAttendanceAckWa(ackOpts, url))
  await startTopicQuizForGuard(pending)
  return true
}

async function loadPendingSession(pending: PendingTrainingWa) {
  const found = await findSession(pending.branchId, pending.sessionId, [
    pending.trainingDate,
    monthOf(pending.trainingDate),
  ])
  return found?.session || null
}

/** Send / continue the 5 topic Yes/No questions after attendance. */
export async function startTopicQuizForGuard(pending: PendingTrainingWa): Promise<boolean> {
  const session = await loadPendingSession(pending)
  if (!session) return false
  const questions = pickSessionYesNoQuestions(session)
  const row = await findOrCreateResponse(pending.sessionId, `wa:${pending.mobile}`)
  if (row.testDoneAt && row.score != null) {
    await reply(
      pending.mobile,
      buildMarksThankYouWa({
        guardName: row.guardName || pending.guardName || 'Guard',
        score: Number(row.score || 0),
        maxScore: Number(row.maxScore || questions.length),
        feedbackUrl: pending.confirmUrl || guardsLinkPublicUrl(pending.token),
      }),
    )
    return true
  }
  const next: PendingTrainingWa = {
    ...pending,
    quizIndex: 0,
    quizAnswers: [],
  }
  await setPendingTrainingWa(pending.mobile, next)
  const q = questions[0]
  if (!q) return false
  await reply(
    pending.mobile,
    buildTopicQuizQuestionWa({
      guardName: row.guardName || pending.guardName || 'Guard',
      index: 1,
      total: questions.length,
      text: q.text,
      quizUrl: pending.confirmUrl || guardsLinkPublicUrl(pending.token),
    }),
  )
  return true
}

async function recordQuizAnswer(pending: PendingTrainingWa, choice: 'Yes' | 'No'): Promise<boolean> {
  const session = await loadPendingSession(pending)
  if (!session) return false
  const questions = pickSessionYesNoQuestions(session)
  const idx = typeof pending.quizIndex === 'number' ? pending.quizIndex : 0
  const q = questions[idx]
  if (!q) return false
  const answers = [...(pending.quizAnswers || []), { qId: q.id, choice }]
  if (answers.length < questions.length) {
    const nextIdx = idx + 1
    await setPendingTrainingWa(pending.mobile, {
      ...pending,
      quizIndex: nextIdx,
      quizAnswers: answers,
    })
    const nq = questions[nextIdx]
    await reply(
      pending.mobile,
      buildTopicQuizQuestionWa({
        guardName: pending.guardName || 'Guard',
        index: nextIdx + 1,
        total: questions.length,
        text: nq?.text || '',
      }),
    )
    return true
  }

  const saved = await submitYesNoQuiz({
    sessionId: pending.sessionId,
    deviceKey: `wa:${pending.mobile}`,
    answers,
  })
  await setPendingTrainingWa(pending.mobile, {
    ...pending,
    quizIndex: questions.length,
    quizAnswers: answers,
  })
  if (saved.ok === false) {
    await reply(pending.mobile, saved.error || 'Could not save answers. Open the training link.')
    return true
  }
  await reply(
    pending.mobile,
    buildMarksThankYouWa({
      guardName: saved.row.guardName || pending.guardName || 'Guard',
      score: Number(saved.row.score || 0),
      maxScore: Number(saved.row.maxScore || questions.length),
      feedbackUrl: pending.confirmUrl || guardsLinkPublicUrl(pending.token),
    }),
  )
  return true
}

/**
 * Inbound WhatsApp — guard replies EOI, ATTENDANCE, or YES/NO on the topic quiz.
 * Returns true when handled (so other reply handlers can skip).
 */
export async function handleTrainingConfirmWaReply(from: string, text: string): Promise<boolean> {
  if (!from || !text) return false
  const eoi = isEoiReply(text)
  const att = isAttendanceReply(text)
  const yn = parseYesNoReply(text)

  if (!eoi && !att && !yn) return false

  const pending = await getPendingTrainingWa(from)
  if (yn && pending && typeof pending.quizIndex === 'number' && pending.quizIndex < 5) {
    return recordQuizAnswer(pending, yn)
  }
  if (yn && !eoi && !att) return false

  if (!pending?.sessionId || !pending.branchId) {
    await reply(
      from,
      [
        trainingBrandWhatsAppHeader(),
        'No open training intimation found for this number.',
        'Ask your Training Manager to send the Training schedule Intimation again.',
      ].join('\n'),
    )
    return true
  }

  if (eoi) return recordEoi(pending, text)
  return recordAttendance(pending)
}
