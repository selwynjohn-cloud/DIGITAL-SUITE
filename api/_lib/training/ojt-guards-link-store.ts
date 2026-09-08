/**
 * Guards Training Link — token + per-session responses (status / attendance / test / feedback).
 */

import { nid } from '../mis/store.js'
import { findSession, type OjtSession } from './ojt-store.js'
import {
  ATTENDANCE_YES_NO_QUESTIONS,
  pickSessionYesNoQuestions,
  scoreAttendanceYesNo,
} from './ojt-attendance-quiz.js'
import {
  DEFAULT_GUARDS_LINK_QUESTIONS,
  scoreGuardsAnswers,
  type GuardsLinkQuestion,
} from './ojt-guards-link-questions.js'
import { buildTrainingConfirmIntimationWa } from './ojt-wa-messages.js'

const LINK_KEY = 'training:ojt-guards-link:'
const RESP_KEY = 'training:ojt-guards-resp:'
const SESSION_TOKEN_KEY = 'training:ojt-guards-session-token:'

export type GuardDutyStatus = 'on_duty' | 'on_leave' | 'attending' | 'not_working'

export type GuardsLinkMeta = {
  token: string
  sessionId: string
  branchId: string
  trainingDate: string
  clientName: string
  createdAt: string
  createdBy: string
}

export type GuardsLinkResponse = {
  id: string
  sessionId: string
  deviceKey: string
  status: GuardDutyStatus
  guardName: string
  employeeId: string
  /** WhatsApp mobile (10 digits) when confirmed by EOI / ATTENDANCE reply */
  mobile: string
  /** Expression of Interest via WhatsApp reply EOI */
  eoiAt: string
  /** If absentee replied EOI DOJ dd/mm/yyyy — expected join-back date */
  eoiJoiningDate: string
  attendedAt: string
  /** Training Manager manually confirmed attendance */
  attendanceConfirmedAt: string
  attendanceConfirmedBy: string
  answers: { qId: string; choice: string }[]
  score: number | null
  maxScore: number | null
  testDoneAt: string
  feedbackRating: string
  feedbackText: string
  feedbackAt: string
  createdAt: string
  updatedAt: string
}

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url, token } : null
}

async function redis(command: unknown[]): Promise<{ result?: unknown } | null> {
  const cfg = redisConfig()
  if (!cfg) return null
  try {
    const res = await fetch(cfg.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    })
    if (!res.ok) return null
    return (await res.json()) as { result?: unknown }
  } catch {
    return null
  }
}

async function getJson<T>(key: string, fallback: T): Promise<T> {
  const d = await redis(['GET', key])
  if (d?.result && typeof d.result === 'string') {
    try {
      return JSON.parse(d.result) as T
    } catch {
      return fallback
    }
  }
  return fallback
}

async function setJson(key: string, value: unknown): Promise<boolean> {
  const d = await redis(['SET', key, JSON.stringify(value)])
  return d?.result === 'OK'
}

function newToken(): string {
  const a = Math.random().toString(36).slice(2, 10)
  const b = Math.random().toString(36).slice(2, 10)
  const c = Date.now().toString(36)
  return `${a}${b}${c}`.slice(0, 28)
}

export function guardsLinkPublicUrl(token: string, origin = 'https://www.agilegroup-digital.co.in'): string {
  const base = String(origin || '').replace(/\/$/, '') || 'https://www.agilegroup-digital.co.in'
  return `${base}/training/guards-link?t=${encodeURIComponent(token)}`
}

export async function getGuardsLinkMeta(token: string): Promise<GuardsLinkMeta | null> {
  const t = String(token || '').trim()
  if (!t) return null
  const meta = await getJson<GuardsLinkMeta | null>(LINK_KEY + t, null)
  return meta?.token ? meta : null
}

export async function getTokenForSession(sessionId: string): Promise<string> {
  return String((await getJson<string>(SESSION_TOKEN_KEY + sessionId, '')) || '').trim()
}

export async function prepareGuardsLink(
  session: OjtSession,
  createdBy: string,
): Promise<{ ok: true; meta: GuardsLinkMeta; url: string } | { ok: false; error: string }> {
  if (!redisConfig()) return { ok: false, error: 'Storage not ready.' }
  if (!session?.id || !session.branchId) return { ok: false, error: 'Session missing.' }
  if (session.status === 'Cancelled') return { ok: false, error: 'Cancelled sessions cannot use a Guards Link.' }

  let token = await getTokenForSession(session.id)
  let meta = token ? await getGuardsLinkMeta(token) : null
  if (!meta || meta.sessionId !== session.id) {
    token = newToken()
    meta = {
      token,
      sessionId: session.id,
      branchId: session.branchId,
      trainingDate: session.trainingDate || '',
      clientName: session.clientName || '',
      createdAt: new Date().toISOString(),
      createdBy: String(createdBy || '').slice(0, 120),
    }
    const ok1 = await setJson(LINK_KEY + token, meta)
    const ok2 = await setJson(SESSION_TOKEN_KEY + session.id, token)
    if (!ok1 || !ok2) return { ok: false, error: 'Could not save Guards Link.' }
  } else {
    meta = {
      ...meta,
      clientName: session.clientName || meta.clientName,
      trainingDate: session.trainingDate || meta.trainingDate,
    }
    await setJson(LINK_KEY + token, meta)
  }
  return { ok: true, meta, url: guardsLinkPublicUrl(token) }
}

export async function loadSessionForGuardsLink(meta: GuardsLinkMeta): Promise<OjtSession | null> {
  const month = String(meta.trainingDate || '').slice(0, 7)
  const found = await findSession(meta.branchId, meta.sessionId, month ? [month] : [])
  return found?.session || null
}

export async function loadGuardsResponses(sessionId: string): Promise<GuardsLinkResponse[]> {
  return getJson<GuardsLinkResponse[]>(RESP_KEY + sessionId, [])
}

async function saveGuardsResponses(sessionId: string, rows: GuardsLinkResponse[]): Promise<boolean> {
  return setJson(RESP_KEY + sessionId, rows)
}

function emptyResponse(sessionId: string, deviceKey: string): GuardsLinkResponse {
  const now = new Date().toISOString()
  return {
    id: nid('glr'),
    sessionId,
    deviceKey: String(deviceKey || '').slice(0, 80),
    status: 'not_working',
    guardName: '',
    employeeId: '',
    mobile: '',
    eoiAt: '',
    eoiJoiningDate: '',
    attendedAt: '',
    attendanceConfirmedAt: '',
    attendanceConfirmedBy: '',
    answers: [],
    score: null,
    maxScore: null,
    testDoneAt: '',
    feedbackRating: '',
    feedbackText: '',
    feedbackAt: '',
    createdAt: now,
    updatedAt: now,
  }
}

/** India calendar date YYYY-MM-DD */
export function todayYmdIst(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

/** Current minutes from midnight IST. */
function nowMinutesIst(): number {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date())
    const h = Number(parts.find((p) => p.type === 'hour')?.value || 0)
    const m = Number(parts.find((p) => p.type === 'minute')?.value || 0)
    return h * 60 + m
  } catch {
    const d = new Date()
    return d.getUTCHours() * 60 + d.getUTCMinutes() + 330
  }
}

function parseTrainingMinutes(trainingTime: string): number | null {
  const t = String(trainingTime || '').trim()
  const m = t.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  const hh = Number(m[1])
  const mm = Number(m[2])
  if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh > 23 || mm > 59) return null
  return hh * 60 + mm
}

/**
 * Attendance only on training date, from 15 minutes before start until 3 hours after start.
 */
export function attendanceWindowCheck(
  trainingDate: string,
  trainingTime: string,
): { ok: true } | { ok: false; error: string } {
  const trainDay = String(trainingDate || '').slice(0, 10)
  const today = todayYmdIst()
  if (!trainDay || !/^\d{4}-\d{2}-\d{2}$/.test(trainDay)) {
    return { ok: false, error: 'Training date is missing. Ask Training Manager.' }
  }
  if (trainDay !== today) {
    return {
      ok: false,
      error: `Attendance only on training date ${trainDay} at the scheduled time. Today is ${today}.`,
    }
  }
  const startMin = parseTrainingMinutes(trainingTime)
  if (startMin == null) {
    return { ok: false, error: 'Training time is missing. Ask Training Manager.' }
  }
  const nowMin = nowMinutesIst()
  const openFrom = startMin - 15
  const openUntil = startMin + 3 * 60
  if (nowMin < openFrom) {
    const hh = String(Math.floor(startMin / 60)).padStart(2, '0')
    const mm = String(startMin % 60).padStart(2, '0')
    return {
      ok: false,
      error: `Attendance opens 15 minutes before training time (${hh}:${mm}). Please wait.`,
    }
  }
  if (nowMin > openUntil) {
    return {
      ok: false,
      error: 'Attendance window for this training time is closed. See Training Manager in the hall.',
    }
  }
  return { ok: true }
}

/** WhatsApp training schedule intimation (ASF Training Department header). */
export function buildGuardsScheduleWhatsAppText(session: OjtSession, url: string): string {
  return buildTrainingConfirmIntimationWa(session, url)
}

export async function findOrCreateResponse(
  sessionId: string,
  deviceKey: string,
): Promise<GuardsLinkResponse> {
  const key = String(deviceKey || '').trim() || nid('dev')
  const list = await loadGuardsResponses(sessionId)
  const hit = list.find((r) => r.deviceKey === key)
  if (hit) return hit
  const row = emptyResponse(sessionId, key)
  list.push(row)
  await saveGuardsResponses(sessionId, list)
  return row
}

export async function upsertGuardsResponse(row: GuardsLinkResponse): Promise<GuardsLinkResponse> {
  const list = await loadGuardsResponses(row.sessionId)
  const i = list.findIndex((r) => r.id === row.id || (r.deviceKey && r.deviceKey === row.deviceKey))
  row.mobile = String(row.mobile || '').slice(0, 20)
  row.eoiAt = String(row.eoiAt || '').slice(0, 40)
  row.eoiJoiningDate = String(row.eoiJoiningDate || '').slice(0, 20)
  row.updatedAt = new Date().toISOString()
  if (i >= 0) list[i] = row
  else list.push(row)
  await saveGuardsResponses(row.sessionId, list)
  return row
}

export async function submitDutyStatus(opts: {
  sessionId: string
  deviceKey: string
  status: GuardDutyStatus
}): Promise<GuardsLinkResponse> {
  const row = await findOrCreateResponse(opts.sessionId, opts.deviceKey)
  row.status = opts.status
  /** Web EOI = same as WhatsApp reply EOI (will attend). */
  if (opts.status === 'attending') {
    if (!row.eoiAt) row.eoiAt = new Date().toISOString()
  } else {
    /* stop here — no attendance */
  }
  const saved = await upsertGuardsResponse(row)
  if (opts.status === 'attending') {
    try {
      const token = await getTokenForSession(opts.sessionId)
      const meta = token ? await getGuardsLinkMeta(token) : null
      const session = meta ? await loadSessionForGuardsLink(meta) : null
      if (session) {
        const { upsertTrainingEoiFromResponse } = await import('../recruitment/training-eoi-store.js')
        const { getBranches } = await import('../mis/store.js')
        const branches = await getBranches(false)
        const br = branches.find((b) => b.id === session.branchId)
        await upsertTrainingEoiFromResponse({
          session,
          branchName: br?.name || '',
          response: saved,
        })
      }
    } catch {
      /* Recruitment ledger best-effort */
    }
  }
  return saved
}

export async function submitAttendance(opts: {
  sessionId: string
  deviceKey: string
  guardName: string
  employeeId: string
  trainingDate: string
  trainingTime: string
}): Promise<{ ok: true; row: GuardsLinkResponse } | { ok: false; error: string }> {
  const row = await findOrCreateResponse(opts.sessionId, opts.deviceKey)
  if (row.status !== 'attending') {
    return { ok: false, error: 'Select “Attending training” before marking attendance.' }
  }
  if (row.attendedAt) {
    return { ok: false, error: 'Attendance already marked on this phone.' }
  }
  const window = attendanceWindowCheck(opts.trainingDate, opts.trainingTime)
  if (!window.ok) return { ok: false, error: window.error }
  const name = String(opts.guardName || '').trim()
  if (name.length < 2) return { ok: false, error: 'Enter your name.' }
  row.guardName = name.slice(0, 120)
  row.employeeId = String(opts.employeeId || '').trim().slice(0, 40)
  row.attendedAt = new Date().toISOString()
  /** Guard attendance confirmation = ready for 5 Yes/No questions (hall can still mark final). */
  if (!row.attendanceConfirmedAt) {
    row.attendanceConfirmedAt = row.attendedAt
    row.attendanceConfirmedBy = 'guard-confirm'
  }
  return { ok: true, row: await upsertGuardsResponse(row) }
}

export async function confirmGuardAttendance(opts: {
  sessionId: string
  responseId: string
  confirmedBy: string
}): Promise<{ ok: true; row: GuardsLinkResponse } | { ok: false; error: string }> {
  const list = await loadGuardsResponses(opts.sessionId)
  const row = list.find((r) => r.id === opts.responseId)
  if (!row) return { ok: false, error: 'Guard attendance not found.' }
  if (!row.attendedAt) return { ok: false, error: 'Guard has not marked attendance yet.' }
  if (row.attendanceConfirmedAt) return { ok: true, row }
  row.attendanceConfirmedAt = new Date().toISOString()
  row.attendanceConfirmedBy = String(opts.confirmedBy || '').slice(0, 120)
  return { ok: true, row: await upsertGuardsResponse(row) }
}

export async function submitFeedback(opts: {
  sessionId: string
  deviceKey: string
  rating: string
  text: string
}): Promise<{ ok: true; row: GuardsLinkResponse } | { ok: false; error: string }> {
  const row = await findOrCreateResponse(opts.sessionId, opts.deviceKey)
  if (!row.attendedAt) return { ok: false, error: 'Mark attendance first.' }
  if (!row.testDoneAt) {
    return { ok: false, error: 'Please complete the 5 Yes/No questions first. Then feedback will open.' }
  }
  if (row.feedbackAt) return { ok: false, error: 'Feedback already submitted.' }
  row.feedbackRating = String(opts.rating || '').trim().slice(0, 40)
  row.feedbackText = String(opts.text || '').trim().slice(0, 2000)
  if (!row.feedbackRating && !row.feedbackText) {
    return { ok: false, error: 'Please give a rating or a short comment.' }
  }
  row.feedbackAt = new Date().toISOString()
  return { ok: true, row: await upsertGuardsResponse(row) }
}

async function yesNoQuestionsForSession(sessionId: string) {
  const token = await getTokenForSession(sessionId)
  if (!token) return ATTENDANCE_YES_NO_QUESTIONS
  const meta = await getGuardsLinkMeta(token)
  if (!meta) return ATTENDANCE_YES_NO_QUESTIONS
  const session = await loadSessionForGuardsLink(meta)
  if (!session) return ATTENDANCE_YES_NO_QUESTIONS
  return pickSessionYesNoQuestions(session)
}

/** 5 Yes/No questions after attendance confirmation (primary post-training check). */
export async function submitYesNoQuiz(opts: {
  sessionId: string
  deviceKey: string
  answers: { qId: string; choice: string }[]
}): Promise<{ ok: true; row: GuardsLinkResponse } | { ok: false; error: string }> {
  const row = await findOrCreateResponse(opts.sessionId, opts.deviceKey)
  if (!row.attendedAt) return { ok: false, error: 'Confirm attendance first.' }
  if (row.testDoneAt) return { ok: false, error: 'Questions already submitted (one attempt only).' }
  const questions = await yesNoQuestionsForSession(opts.sessionId)
  const answers = (opts.answers || [])
    .map((a) => ({
      qId: String(a.qId || '').slice(0, 40),
      choice: String(a.choice || '').trim(),
    }))
    .filter((a) => a.qId && a.choice)
  if (answers.length < questions.length) {
    return { ok: false, error: 'Please answer all 5 Yes/No questions.' }
  }
  const scored = scoreAttendanceYesNo(answers, questions)
  row.answers = answers.map((a) => ({
    qId: a.qId,
    choice: /^(yes|y)$/i.test(a.choice) ? 'Y' : /^(no|n)$/i.test(a.choice) ? 'N' : a.choice.slice(0, 1),
  }))
  row.score = scored.score
  row.maxScore = scored.maxScore
  row.testDoneAt = new Date().toISOString()
  if (!row.attendanceConfirmedAt) {
    row.attendanceConfirmedAt = row.testDoneAt
    row.attendanceConfirmedBy = 'guard-confirm'
  }
  return { ok: true, row: await upsertGuardsResponse(row) }
}

export async function submitTest(opts: {
  sessionId: string
  deviceKey: string
  answers: { qId: string; choice: string }[]
  questions?: GuardsLinkQuestion[]
}): Promise<{ ok: true; row: GuardsLinkResponse } | { ok: false; error: string }> {
  /** Prefer Yes/No quiz when answers look like Yes/No. */
  const raw = opts.answers || []
  const ynLike = raw.some((a) => /^(yes|no|y|n)$/i.test(String(a.choice || '').trim()))
  if (ynLike || !opts.questions) {
    return submitYesNoQuiz({
      sessionId: opts.sessionId,
      deviceKey: opts.deviceKey,
      answers: raw,
    })
  }
  const row = await findOrCreateResponse(opts.sessionId, opts.deviceKey)
  if (!row.attendedAt) return { ok: false, error: 'Mark attendance first.' }
  if (row.testDoneAt) return { ok: false, error: 'Test already submitted (one attempt only).' }
  const questions = opts.questions || DEFAULT_GUARDS_LINK_QUESTIONS
  const answers = raw
    .map((a) => ({
      qId: String(a.qId || '').slice(0, 20),
      choice: String(a.choice || '').toUpperCase().slice(0, 1),
    }))
    .filter((a) => a.qId && 'ABCD'.includes(a.choice))
  const scored = scoreGuardsAnswers(answers, questions)
  row.answers = answers
  row.score = scored.score
  row.maxScore = scored.maxScore
  row.testDoneAt = new Date().toISOString()
  return { ok: true, row: await upsertGuardsResponse(row) }
}

export type GuardsMarksRow = {
  responseId: string
  name: string
  employeeId: string
  mobile: string
  eoi: boolean
  score: number | null
  maxScore: number | null
  confirmed: boolean
  feedback: boolean
  tested: boolean
  attendedAt: string
  attendanceConfirmedAt: string
}

export function marksListRows(rows: GuardsLinkResponse[]): GuardsMarksRow[] {
  return rows
    .filter((r) => r.attendedAt || r.eoiAt || r.status === 'attending')
    .map((r) => ({
      responseId: r.id,
      name: r.guardName || 'Guard',
      employeeId: r.employeeId || '',
      mobile: r.mobile || '',
      eoi: Boolean(r.eoiAt || r.status === 'attending'),
      score: r.score,
      maxScore: r.maxScore,
      confirmed: Boolean(r.attendanceConfirmedAt || r.attendedAt),
      feedback: Boolean(r.feedbackAt),
      tested: Boolean(r.testDoneAt),
      attendedAt: r.attendedAt,
      attendanceConfirmedAt: r.attendanceConfirmedAt || '',
    }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'en', { sensitivity: 'base' }))
}

export function summarizeGuardsLink(rows: GuardsLinkResponse[]): {
  statusCounts: Record<GuardDutyStatus, number>
  eoiCount: number
  attended: number
  tested: number
  avgScore: string
  feedbackCount: number
  feedbackNotes: string
  attendanceNames: string
} {
  const statusCounts: Record<GuardDutyStatus, number> = {
    on_duty: 0,
    on_leave: 0,
    attending: 0,
    not_working: 0,
  }
  let eoiCount = 0
  let attended = 0
  let tested = 0
  let scoreSum = 0
  let scoreN = 0
  let feedbackCount = 0
  const notes: string[] = []
  const names: string[] = []
  for (const r of rows) {
    if (statusCounts[r.status] != null) statusCounts[r.status] += 1
    if (r.eoiAt || r.status === 'attending') eoiCount += 1
    if (r.attendedAt) {
      attended += 1
      if (r.guardName) names.push(r.guardName + (r.employeeId ? ` (${r.employeeId})` : ''))
    }
    if (r.testDoneAt && r.score != null && r.maxScore != null) {
      tested += 1
      scoreSum += r.score
      scoreN += 1
    }
    if (r.feedbackAt) {
      feedbackCount += 1
      const line = [r.guardName || 'Guard', r.feedbackRating, r.feedbackText].filter(Boolean).join(' — ')
      if (line) notes.push(line)
    }
  }
  const avgScore = scoreN ? `${Math.round((scoreSum / scoreN) * 10) / 10}/${rows.find((r) => r.maxScore)?.maxScore || 10}` : '—'
  return {
    statusCounts,
    eoiCount,
    attended,
    tested,
    avgScore,
    feedbackCount,
    feedbackNotes: notes.slice(0, 40).join('\n'),
    attendanceNames: names.slice(0, 200).join(', '),
  }
}
