/**
 * Agile Training — OJT sessions, completion reports, Redis storage.
 */

import { nid } from '../mis/store.js'

const SCHEDULE_KEY = 'training:ojt-schedule:'
const REPORT_KEY = 'training:ojt-report:'

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

async function delJson(key: string): Promise<boolean> {
  const d = await redis(['DEL', key])
  return Number(d?.result ?? 0) >= 0
}

export type OjtSessionStatus = 'Draft' | 'Scheduled' | 'ClientNotified' | 'Completed' | 'Cancelled'
export type OjtScheduleType =
  | 'RegularSchedule'
  | 'SLA'
  | 'ClientRequest'
  | 'ManagementInstruction'
  | 'PostIncident'
  /** @deprecated legacy */
  | 'Routine'

export const OJT_SCHEDULE_TYPE_LABELS: Record<string, string> = {
  RegularSchedule: 'Regular schedule',
  SLA: 'SLA',
  ClientRequest: 'Client Request',
  ManagementInstruction: 'Management Instruction',
  PostIncident: 'Post Incident',
  Routine: 'Regular schedule',
}

export type OjtSession = {
  id: string
  branchId: string
  clientId: string
  clientName: string
  clientEmail: string
  /** Extra client inboxes (up to 3 total with clientEmail). */
  clientEmail2: string
  clientEmail3: string
  location: string
  trainingDate: string
  trainingTime: string
  trainerName: string
  trainerEmail: string
  /** Joined topics 1–5 for mail / legacy */
  topics: string
  topic1: string
  topic2: string
  topic3: string
  topic4: string
  topic5: string
  tableTop: 'Yes' | 'No' | ''
  tableTopNotes: string
  postTrainingTest: 'Yes' | 'No' | ''
  equipmentIdentify: string
  sampleQuestions: string
  /** Guard feedback planned — compulsory Yes on save */
  feedbackGuard: 'Yes' | 'No' | ''
  /** Client feedback planned — compulsory Yes on save */
  feedbackClient: 'Yes' | 'No' | ''
  feedbackPlanned: 'Yes' | 'No' | ''
  slaTag: OjtScheduleType | ''
  status: OjtSessionStatus
  branchHeadEmail: string
  notifySentAt: string
  notifySentBy: string
  notifyMessageId: string
  /** Client confirmation / reply link token */
  clientReplyToken: string
  clientReplyAt: string
  clientReplyAction: 'confirm' | 'addTopic' | 'changeSchedule' | 'removeTopic' | 'changeRequired' | ''
  clientReplyTopic: string
  clientReplyRemoveTopic: string
  clientReplyNewDate: string
  clientReplyNewTime: string
  clientReplyNote: string
  cancelReason: string
  cancelSentAt: string
  cancelSentBy: string
  cancelMessageId: string
  /**
   * Training-only invite units + editable roster snapshot (never writes Master Directory).
   */
  trainingInviteUnits: string[]
  trainingInviteUnitsBy: string
  trainingInviteUnitsAt: string
  /** Unit-wise guards for this session after trainer saves unit selection. */
  trainingGuardRows: TrainingGuardRosterRow[]
  /** Optional — trainer asks Control for a vehicle. Existing schedules stay untouched. */
  vehicleRequired: boolean
  vehicleAskedAt: string
  controlCaseNo: string
  vehicleDriverName: string
  vehicleRegNo: string
  vehicleAcceptedAt: string
  createdAt: string
  updatedAt: string
}

/** One row on Training Confirmation list (session-only; not Branch clients). */
export type TrainingGuardRosterRow = {
  id: string
  unitName: string
  name: string
  employeeId: string
  /** Rank / designation — editable by trainer (MIS guards list has no rank field). */
  rank: string
  mobile: string
  selectedForTraining: boolean
  deleted: boolean
}

export type OjtRating = 'Excellent' | 'ToBeImproved' | ''
export type OjtIdValidity = 'AllValid' | 'ToBeCorrected' | ''

/** Training completion selfie / site photo (max 3 on report). */
export type OjtCompletionPhoto = {
  id: string
  name: string
  type: string
  /** Raw base64 (no data: prefix). Light API responses use `__stored__`. */
  base64: string
}

/** Branch Security Observation closure evidence (PDF, image, Word, Excel). */
export type OjtEvidenceFile = {
  id: string
  name: string
  type: string
  base64: string
}

export type OjtReport = {
  sessionId: string
  /** Completion report date (usually training date from schedule) */
  reportDate: string
  topicsCovered: string
  sanctionedStrength: string
  attendanceCount: string
  /** Attended list */
  attendanceNames: string
  /** OM reported (name) — shown on client completion letter */
  operationsStaffNames: string
  /** Legacy text marks (optional) */
  marksStatement: string
  marksFileName: string
  marksFileBase64: string
  marksFileType: string
  /** Training photos / selfies — maximum 3 */
  completionPhotos: OjtCompletionPhoto[]
  /** Single feedback box for client-facing completion report */
  feedback: string
  /** @deprecated mapped into feedback */
  guardFeedback: string
  /** @deprecated mapped into feedback */
  clientFeedback: string
  /** Public completion-report feedback link token */
  clientFeedbackToken: string
  /** Client answer: Highly Beneficial | Beneficial | Needs Improvement */
  clientOjtBenefitRating: string
  clientOjtBenefitAt: string
  clientOjtBenefitBy: string
  tableTopDone: 'Yes' | 'No' | ''
  tableTopResult: string
  equipmentResult: string
  completionSavedAt: string
  reportSentToClient: 'Yes' | 'No' | ''
  reportSentAt: string
  reportSentBy: string
  reportMessageId: string
  /** Security Observations (not sent to client) */
  turnoutRating: OjtRating
  turnoutReason: string
  idCardValidity: OjtIdValidity
  idCardReason: string
  recordKeeping: OjtRating
  recordKeepingReason: string
  omPreviousVisitDate: string
  previousNightCheckDate: string
  otherAbnormality: string
  informationGathering: string
  securityObsSavedAt: string
  securityObsSentAt: string
  securityObsSentBy: string
  securityObsMessageId: string
  /** Branch closes the observation — Completion report from the list. */
  securityObsClosureDate: string
  securityObsClosureText: string
  securityObsClosureFiles: OjtEvidenceFile[]
  securityObsClosureSubmittedAt: string
  securityObsClosureSubmittedBy: string
  /** HOD assigns observation closure duty to Operations Manager. */
  securityObsAssignedOmName: string
  securityObsAssignedOmEmail: string
  securityObsAssignedAt: string
  securityObsAssignedBy: string
  /** Management reminder / WhatsApp chase on Branch Security Observation List. */
  securityObsReminderAt: string
  securityObsReminderBy: string
  securityObsReminderCount: number
  securityObsWaSentAt: string
  securityObsWaSentBy: string
  /** @deprecated */
  securityObservation: string
  /** @deprecated */
  uniform: string
  /** @deprecated */
  idCard: string
  /** @deprecated */
  turnout: string
  /** @deprecated */
  otherInfo: string
  /** @deprecated use omPreviousVisitDate */
  lastOmVisit: string
  lastManagementVisit: string
  /** @deprecated use previousNightCheckDate */
  lastNightCheck: string
  pmAttended: 'Yes' | 'No' | ''
  pmName: string
  updatedAt: string
}

export function storageOk(): boolean {
  return Boolean(redisConfig())
}

function scheduleKey(branchId: string, month: string) {
  return `${SCHEDULE_KEY}${branchId}:${month.slice(0, 7)}`
}

function reportKey(sessionId: string) {
  return `${REPORT_KEY}${sessionId}`
}

function yn(v: unknown): 'Yes' | 'No' | '' {
  const s = String(v ?? '').trim()
  return s === 'Yes' || s === 'No' ? s : ''
}

function scheduleType(v: unknown): OjtScheduleType | '' {
  const s = String(v ?? '').trim()
  if (s === 'Routine') return 'RegularSchedule'
  if (
    s === 'RegularSchedule' ||
    s === 'SLA' ||
    s === 'ClientRequest' ||
    s === 'ManagementInstruction' ||
    s === 'PostIncident'
  ) {
    return s
  }
  return ''
}

function statusOf(v: unknown): OjtSessionStatus {
  const s = String(v ?? '').trim()
  if (s === 'Draft' || s === 'Scheduled' || s === 'ClientNotified' || s === 'Completed' || s === 'Cancelled') return s
  if (s === 'Schedule') return 'Scheduled'
  return 'Draft'
}

export function joinTopics(s: Pick<OjtSession, 'topic1' | 'topic2' | 'topic3' | 'topic4' | 'topic5' | 'topics'>): string {
  const numbered = [s.topic1, s.topic2, s.topic3, s.topic4, s.topic5]
    .map((t, i) => {
      const v = String(t ?? '').trim()
      return v ? `${i + 1}. ${v}` : ''
    })
    .filter(Boolean)
  if (numbered.length) return numbered.join('\n')
  return String(s.topics ?? '').trim()
}

export function emptyOjtSession(branchId: string): OjtSession {
  const now = new Date().toISOString()
  return {
    id: nid('ojt'),
    branchId,
    clientId: '',
    clientName: '',
    clientEmail: '',
    clientEmail2: '',
    clientEmail3: '',
    location: '',
    trainingDate: '',
    trainingTime: '10:00',
    trainerName: '',
    trainerEmail: '',
    topics: '',
    topic1: '',
    topic2: '',
    topic3: '',
    topic4: '',
    topic5: '',
    tableTop: '',
    tableTopNotes: '',
    postTrainingTest: 'Yes',
    equipmentIdentify: '',
    sampleQuestions: '',
    feedbackGuard: 'Yes',
    feedbackClient: 'Yes',
    feedbackPlanned: 'Yes',
    slaTag: 'RegularSchedule',
    status: 'Scheduled',
    branchHeadEmail: '',
    notifySentAt: '',
    notifySentBy: '',
    notifyMessageId: '',
    clientReplyToken: '',
    clientReplyAt: '',
    clientReplyAction: '',
    clientReplyTopic: '',
    clientReplyRemoveTopic: '',
    clientReplyNewDate: '',
    clientReplyNewTime: '',
    clientReplyNote: '',
    cancelReason: '',
    cancelSentAt: '',
    cancelSentBy: '',
    cancelMessageId: '',
    trainingInviteUnits: [],
    trainingInviteUnitsBy: '',
    trainingInviteUnitsAt: '',
    trainingGuardRows: [],
    vehicleRequired: false,
    vehicleAskedAt: '',
    controlCaseNo: '',
    vehicleDriverName: '',
    vehicleRegNo: '',
    vehicleAcceptedAt: '',
    createdAt: now,
    updatedAt: now,
  }
}

function clientReplyActionOf(v: unknown): OjtSession['clientReplyAction'] {
  const s = String(v ?? '').trim()
  if (
    s === 'confirm' ||
    s === 'addTopic' ||
    s === 'changeSchedule' ||
    s === 'removeTopic' ||
    s === 'changeRequired'
  ) {
    return s
  }
  return ''
}

function ratingOf(v: unknown): OjtRating {
  const s = String(v ?? '').trim()
  if (s === 'Excellent' || s === 'ToBeImproved') return s
  if (/excellent/i.test(s)) return 'Excellent'
  if (/improv/i.test(s)) return 'ToBeImproved'
  return ''
}

function idValidityOf(v: unknown): OjtIdValidity {
  const s = String(v ?? '').trim()
  if (s === 'AllValid' || s === 'ToBeCorrected') return s
  if (/all\s*valid|valid/i.test(s) && !/correct/i.test(s)) return 'AllValid'
  if (/correct/i.test(s)) return 'ToBeCorrected'
  return ''
}

export function emptyOjtReport(sessionId: string): OjtReport {
  return {
    sessionId,
    reportDate: '',
    topicsCovered: '',
    sanctionedStrength: '',
    attendanceCount: '',
    attendanceNames: '',
    operationsStaffNames: '',
    marksStatement: '',
    marksFileName: '',
    marksFileBase64: '',
    marksFileType: '',
    completionPhotos: [],
    feedback: '',
    guardFeedback: '',
    clientFeedback: '',
    clientFeedbackToken: '',
    clientOjtBenefitRating: '',
    clientOjtBenefitAt: '',
    clientOjtBenefitBy: '',
    tableTopDone: '',
    tableTopResult: '',
    equipmentResult: '',
    completionSavedAt: '',
    reportSentToClient: '',
    reportSentAt: '',
    reportSentBy: '',
    reportMessageId: '',
    turnoutRating: '',
    turnoutReason: '',
    idCardValidity: '',
    idCardReason: '',
    recordKeeping: '',
    recordKeepingReason: '',
    omPreviousVisitDate: '',
    previousNightCheckDate: '',
    otherAbnormality: '',
    informationGathering: '',
    securityObsSavedAt: '',
    securityObsSentAt: '',
    securityObsSentBy: '',
    securityObsMessageId: '',
    securityObsClosureDate: '',
    securityObsClosureText: '',
    securityObsClosureFiles: [],
    securityObsClosureSubmittedAt: '',
    securityObsClosureSubmittedBy: '',
    securityObsAssignedOmName: '',
    securityObsAssignedOmEmail: '',
    securityObsAssignedAt: '',
    securityObsAssignedBy: '',
    securityObsReminderAt: '',
    securityObsReminderBy: '',
    securityObsReminderCount: 0,
    securityObsWaSentAt: '',
    securityObsWaSentBy: '',
    securityObservation: '',
    uniform: '',
    idCard: '',
    turnout: '',
    otherInfo: '',
    lastOmVisit: '',
    lastManagementVisit: '',
    lastNightCheck: '',
    pmAttended: '',
    pmName: '',
    updatedAt: new Date().toISOString(),
  }
}

export function normalizeTrainingGuardRows(raw: unknown): TrainingGuardRosterRow[] {
  if (!Array.isArray(raw)) return []
  const out: TrainingGuardRosterRow[] = []
  const seen = new Set<string>()
  for (const item of raw.slice(0, 800)) {
    const r = (item || {}) as Partial<TrainingGuardRosterRow>
    const id = String(r.id || '').slice(0, 80)
    const mobile = String(r.mobile || '')
      .replace(/\D/g, '')
      .slice(-10)
    const key = id || (mobile.length === 10 ? `m:${mobile}` : '')
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push({
      id: id || key,
      unitName: String(r.unitName ?? '').slice(0, 200),
      name: String(r.name ?? 'Guard').slice(0, 120),
      employeeId: String(r.employeeId ?? '').slice(0, 80),
      rank: String(r.rank ?? '').slice(0, 80),
      mobile: mobile.length === 10 ? mobile : String(r.mobile ?? '').slice(0, 20),
      selectedForTraining: r.selectedForTraining !== false,
      deleted: r.deleted === true,
    })
  }
  return out
}

export function normalizeOjtSession(raw: Partial<OjtSession>, branchId?: string): OjtSession {
  const base = emptyOjtSession(branchId || String(raw.branchId ?? ''))
  const topic1 = String(raw.topic1 ?? '').slice(0, 500)
  const topic2 = String(raw.topic2 ?? '').slice(0, 500)
  const topic3 = String(raw.topic3 ?? '').slice(0, 500)
  const topic4 = String(raw.topic4 ?? '').slice(0, 500)
  const topic5 = String(raw.topic5 ?? '').slice(0, 500)
  const feedbackGuard = yn(raw.feedbackGuard) || yn(raw.feedbackPlanned) || 'Yes'
  const feedbackClient = yn(raw.feedbackClient) || 'Yes'
  const row: OjtSession = {
    ...base,
    id: String(raw.id || base.id).slice(0, 40),
    branchId: String(raw.branchId || base.branchId).slice(0, 80),
    clientId: String(raw.clientId ?? '').slice(0, 80),
    clientName: String(raw.clientName ?? '').slice(0, 200),
    clientEmail: String(raw.clientEmail ?? '').slice(0, 120),
    clientEmail2: String(raw.clientEmail2 ?? '').slice(0, 120),
    clientEmail3: String(raw.clientEmail3 ?? '').slice(0, 120),
    location: String(raw.location ?? '').slice(0, 300),
    trainingDate: String(raw.trainingDate ?? '').slice(0, 10),
    trainingTime: String(raw.trainingTime ?? '').slice(0, 8),
    trainerName: String(raw.trainerName ?? '').slice(0, 120),
    trainerEmail: String(raw.trainerEmail ?? '').slice(0, 120),
    topic1,
    topic2,
    topic3,
    topic4,
    topic5,
    topics: '',
    tableTop: yn(raw.tableTop),
    tableTopNotes: String(raw.tableTopNotes ?? '').slice(0, 2000),
    postTrainingTest: yn(raw.postTrainingTest) || 'Yes',
    equipmentIdentify: String(raw.equipmentIdentify ?? '').slice(0, 2000),
    sampleQuestions: String(raw.sampleQuestions ?? '').slice(0, 4000),
    feedbackGuard,
    feedbackClient,
    feedbackPlanned: feedbackGuard === 'Yes' || feedbackClient === 'Yes' ? 'Yes' : yn(raw.feedbackPlanned),
    slaTag: scheduleType(raw.slaTag) || 'RegularSchedule',
    status: statusOf(raw.status),
    branchHeadEmail: String(raw.branchHeadEmail ?? '').slice(0, 120),
    notifySentAt: String(raw.notifySentAt ?? '').slice(0, 40),
    notifySentBy: String(raw.notifySentBy ?? '').slice(0, 120),
    notifyMessageId: String(raw.notifyMessageId ?? '').slice(0, 120),
    clientReplyToken: String(raw.clientReplyToken ?? '').slice(0, 80),
    clientReplyAt: String(raw.clientReplyAt ?? '').slice(0, 40),
    clientReplyAction: clientReplyActionOf(raw.clientReplyAction),
    clientReplyTopic: String(raw.clientReplyTopic ?? '').slice(0, 200),
    clientReplyRemoveTopic: String(raw.clientReplyRemoveTopic ?? '').slice(0, 200),
    clientReplyNewDate: String(raw.clientReplyNewDate ?? '').slice(0, 10),
    clientReplyNewTime: String(raw.clientReplyNewTime ?? '').slice(0, 8),
    clientReplyNote: String(raw.clientReplyNote ?? '').slice(0, 500),
    cancelReason: String(raw.cancelReason ?? '').slice(0, 2000),
    cancelSentAt: String(raw.cancelSentAt ?? '').slice(0, 40),
    cancelSentBy: String(raw.cancelSentBy ?? '').slice(0, 120),
    cancelMessageId: String(raw.cancelMessageId ?? '').slice(0, 120),
    trainingInviteUnits: Array.isArray(raw.trainingInviteUnits)
      ? [...new Set(raw.trainingInviteUnits.map((u) => String(u || '').trim()).filter(Boolean))].slice(0, 80)
      : [],
    trainingInviteUnitsBy: String(raw.trainingInviteUnitsBy ?? '').slice(0, 120),
    trainingInviteUnitsAt: String(raw.trainingInviteUnitsAt ?? '').slice(0, 40),
    trainingGuardRows: normalizeTrainingGuardRows(raw.trainingGuardRows),
    vehicleRequired: raw.vehicleRequired === true,
    vehicleAskedAt: String(raw.vehicleAskedAt ?? '').slice(0, 40),
    controlCaseNo: String(raw.controlCaseNo ?? '').slice(0, 40),
    vehicleDriverName: String(raw.vehicleDriverName ?? '').slice(0, 120),
    vehicleRegNo: String(raw.vehicleRegNo ?? '').slice(0, 40),
    vehicleAcceptedAt: String(raw.vehicleAcceptedAt ?? '').slice(0, 40),
    createdAt: String(raw.createdAt || base.createdAt).slice(0, 40),
    updatedAt: new Date().toISOString(),
  }
  // Legacy single topics field → topic1 if numbered empty
  const legacy = String(raw.topics ?? '').trim()
  if (!topic1 && !topic2 && !topic3 && !topic4 && !topic5 && legacy) {
    row.topic1 = legacy.slice(0, 500)
  }
  row.topics = joinTopics(row).slice(0, 4000)
  return row
}

/** PDF, images, Word, Excel — for Security Observation closure evidence. */
export function isAllowedSecObsEvidence(name: string, type: string): boolean {
  const n = String(name || '').toLowerCase()
  const t = String(type || '').toLowerCase()
  if (/^image\//.test(t) || /\.(jpe?g|png|webp|gif|bmp)$/i.test(n)) return true
  if (t === 'application/pdf' || /\.pdf$/i.test(n)) return true
  if (
    t.includes('word') ||
    t.includes('msword') ||
    t.includes('officedocument.wordprocessing') ||
    /\.(docx?|rtf)$/i.test(n)
  ) {
    return true
  }
  if (
    t.includes('excel') ||
    t.includes('spreadsheet') ||
    t.includes('ms-excel') ||
    /\.(xlsx?|csv)$/i.test(n)
  ) {
    return true
  }
  return false
}

export function normalizeOjtReport(raw: Partial<OjtReport>, sessionId: string): OjtReport {
  const base = emptyOjtReport(sessionId)
  const feedback =
    String(raw.feedback ?? '').trim() ||
    [String(raw.guardFeedback ?? '').trim(), String(raw.clientFeedback ?? '').trim()].filter(Boolean).join('\n\n')
  const omDate =
    String(raw.omPreviousVisitDate ?? '').slice(0, 10) ||
    String(raw.lastOmVisit ?? '').slice(0, 10)
  const nightDate =
    String(raw.previousNightCheckDate ?? '').slice(0, 10) ||
    (/^\d{4}-\d{2}-\d{2}/.test(String(raw.lastNightCheck ?? ''))
      ? String(raw.lastNightCheck).slice(0, 10)
      : '')
  const marksB64 = String(raw.marksFileBase64 ?? '')
    .replace(/^data:[^;]+;base64,/, '')
    .replace(/\s/g, '')
    .slice(0, 2_500_000)
  const completionPhotos: OjtCompletionPhoto[] = []
  if (Array.isArray(raw.completionPhotos)) {
    for (const p of raw.completionPhotos.slice(0, 3)) {
      if (!p || typeof p !== 'object') continue
      const row = p as Partial<OjtCompletionPhoto>
      const b64 = String(row.base64 ?? '')
        .replace(/^data:[^;]+;base64,/, '')
        .replace(/\s/g, '')
        .slice(0, 900_000)
      if (!b64 || b64 === '__stored__') continue
      const type = String(row.type ?? '').slice(0, 120)
      completionPhotos.push({
        id: String(row.id || `ph${completionPhotos.length + 1}`).slice(0, 40),
        name: String(row.name || `photo-${completionPhotos.length + 1}.jpg`).slice(0, 200),
        type: /^image\//i.test(type) ? type : 'image/jpeg',
        base64: b64,
      })
    }
  }
  const closureFiles: OjtEvidenceFile[] = []
  if (Array.isArray(raw.securityObsClosureFiles)) {
    for (const f of raw.securityObsClosureFiles.slice(0, 5)) {
      if (!f || typeof f !== 'object') continue
      const row = f as Partial<OjtEvidenceFile>
      const name = String(row.name || '').slice(0, 200)
      const type = String(row.type ?? '').slice(0, 120)
      const b64 = String(row.base64 ?? '')
        .replace(/^data:[^;]+;base64,/, '')
        .replace(/\s/g, '')
        .slice(0, 2_000_000)
      if (!b64 || b64 === '__stored__') continue
      if (!isAllowedSecObsEvidence(name, type)) continue
      closureFiles.push({
        id: String(row.id || `ev${closureFiles.length + 1}`).slice(0, 40),
        name: name || `evidence-${closureFiles.length + 1}`,
        type: type || 'application/octet-stream',
        base64: b64,
      })
    }
  }
  return {
    ...base,
    sessionId,
    reportDate: String(raw.reportDate ?? '').slice(0, 10),
    topicsCovered: String(raw.topicsCovered ?? '').slice(0, 4000),
    sanctionedStrength: String(raw.sanctionedStrength ?? '').slice(0, 40),
    attendanceCount: String(raw.attendanceCount ?? '').slice(0, 40),
    attendanceNames: String(raw.attendanceNames ?? '').slice(0, 8000),
    operationsStaffNames: String(raw.operationsStaffNames ?? '').slice(0, 8000),
    marksStatement: String(raw.marksStatement ?? '').slice(0, 8000),
    marksFileName: String(raw.marksFileName ?? '').slice(0, 200),
    marksFileBase64: marksB64,
    marksFileType: String(raw.marksFileType ?? '').slice(0, 120),
    completionPhotos,
    feedback: feedback.slice(0, 8000),
    guardFeedback: String(raw.guardFeedback ?? '').slice(0, 4000),
    clientFeedback: String(raw.clientFeedback ?? '').slice(0, 4000),
    clientFeedbackToken: String(raw.clientFeedbackToken ?? '').slice(0, 80),
    clientOjtBenefitRating: String(raw.clientOjtBenefitRating ?? '').slice(0, 40),
    clientOjtBenefitAt: String(raw.clientOjtBenefitAt ?? '').slice(0, 40),
    clientOjtBenefitBy: String(raw.clientOjtBenefitBy ?? '').slice(0, 120),
    tableTopDone: yn(raw.tableTopDone),
    tableTopResult: String(raw.tableTopResult ?? '').slice(0, 2000),
    equipmentResult: String(raw.equipmentResult ?? '').slice(0, 2000),
    completionSavedAt: String(raw.completionSavedAt ?? '').slice(0, 40),
    reportSentToClient: yn(raw.reportSentToClient),
    reportSentAt: String(raw.reportSentAt ?? '').slice(0, 40),
    reportSentBy: String(raw.reportSentBy ?? '').slice(0, 120),
    reportMessageId: String(raw.reportMessageId ?? '').slice(0, 120),
    turnoutRating: ratingOf(raw.turnoutRating) || ratingOf(raw.turnout),
    turnoutReason: String(raw.turnoutReason ?? '').slice(0, 4000),
    idCardValidity: idValidityOf(raw.idCardValidity) || idValidityOf(raw.idCard),
    idCardReason: String(raw.idCardReason ?? '').slice(0, 4000),
    recordKeeping: ratingOf(raw.recordKeeping) || ratingOf(raw.uniform),
    recordKeepingReason: String(raw.recordKeepingReason ?? '').slice(0, 4000),
    omPreviousVisitDate: omDate,
    previousNightCheckDate: nightDate,
    otherAbnormality: String(raw.otherAbnormality ?? raw.otherInfo ?? '').slice(0, 4000),
    informationGathering: String(raw.informationGathering ?? raw.securityObservation ?? '').slice(0, 4000),
    securityObsSavedAt: String(raw.securityObsSavedAt ?? '').slice(0, 40),
    securityObsSentAt: String(raw.securityObsSentAt ?? '').slice(0, 40),
    securityObsSentBy: String(raw.securityObsSentBy ?? '').slice(0, 120),
    securityObsMessageId: String(raw.securityObsMessageId ?? '').slice(0, 120),
    securityObsClosureDate: String(raw.securityObsClosureDate ?? '').slice(0, 10),
    securityObsClosureText: String(raw.securityObsClosureText ?? '').slice(0, 8000),
    securityObsClosureFiles: closureFiles,
    securityObsClosureSubmittedAt: String(raw.securityObsClosureSubmittedAt ?? '').slice(0, 40),
    securityObsClosureSubmittedBy: String(raw.securityObsClosureSubmittedBy ?? '').slice(0, 120),
    securityObsAssignedOmName: String(raw.securityObsAssignedOmName ?? '').slice(0, 120),
    securityObsAssignedOmEmail: String(raw.securityObsAssignedOmEmail ?? '').slice(0, 120),
    securityObsAssignedAt: String(raw.securityObsAssignedAt ?? '').slice(0, 40),
    securityObsAssignedBy: String(raw.securityObsAssignedBy ?? '').slice(0, 120),
    securityObsReminderAt: String(raw.securityObsReminderAt ?? '').slice(0, 40),
    securityObsReminderBy: String(raw.securityObsReminderBy ?? '').slice(0, 120),
    securityObsReminderCount: Math.max(0, Math.min(99, Number(raw.securityObsReminderCount) || 0)),
    securityObsWaSentAt: String(raw.securityObsWaSentAt ?? '').slice(0, 40),
    securityObsWaSentBy: String(raw.securityObsWaSentBy ?? '').slice(0, 120),
    securityObservation: String(raw.securityObservation ?? '').slice(0, 4000),
    uniform: String(raw.uniform ?? '').slice(0, 2000),
    idCard: String(raw.idCard ?? '').slice(0, 2000),
    turnout: String(raw.turnout ?? '').slice(0, 2000),
    otherInfo: String(raw.otherInfo ?? '').slice(0, 4000),
    lastOmVisit: omDate || String(raw.lastOmVisit ?? '').slice(0, 500),
    lastManagementVisit: String(raw.lastManagementVisit ?? '').slice(0, 500),
    lastNightCheck: nightDate || String(raw.lastNightCheck ?? '').slice(0, 500),
    pmAttended: yn(raw.pmAttended),
    pmName: String(raw.pmName ?? '').slice(0, 120),
    updatedAt: new Date().toISOString(),
  }
}

export async function loadMonthSessions(branchId: string, month: string): Promise<OjtSession[]> {
  const list = await getJson<OjtSession[]>(scheduleKey(branchId, month), [])
  return (Array.isArray(list) ? list : []).map((s) => normalizeOjtSession(s, branchId))
}

export async function saveMonthSessions(branchId: string, month: string, sessions: OjtSession[]): Promise<boolean> {
  const list = sessions.slice(0, 400).map((s) => normalizeOjtSession(s, branchId))
  return setJson(scheduleKey(branchId, month), list)
}

export async function loadOjtReport(sessionId: string): Promise<OjtReport | null> {
  const id = String(sessionId ?? '').trim()
  if (!id) return null
  const raw = await getJson<OjtReport | null>(reportKey(id), null)
  return raw ? normalizeOjtReport(raw, id) : null
}

export async function saveOjtReport(report: OjtReport): Promise<boolean> {
  const row = normalizeOjtReport(report, report.sessionId)
  return setJson(reportKey(row.sessionId), row)
}

export function daysUntilTraining(trainingDate: string, todayYmd: string): number | null {
  const t = String(trainingDate ?? '').slice(0, 10)
  const d = String(todayYmd ?? '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t) || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return null
  const a = Date.parse(`${t}T00:00:00+05:30`)
  const b = Date.parse(`${d}T00:00:00+05:30`)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  return Math.round((a - b) / (24 * 60 * 60 * 1000))
}

export function monthOf(dateYmd: string): string {
  return String(dateYmd ?? '').slice(0, 7)
}

export async function findSession(
  branchId: string,
  sessionId: string,
  monthHints: string[] = [],
): Promise<{ session: OjtSession; month: string } | null> {
  const id = String(sessionId ?? '').trim()
  if (!id || !branchId) return null
  const tried = new Set<string>()
  for (const m of monthHints) {
    const month = monthOf(m)
    if (!month || tried.has(month)) continue
    tried.add(month)
    const list = await loadMonthSessions(branchId, month)
    const session = list.find((s) => s.id === id)
    if (session) return { session, month }
  }
  return null
}

export async function upsertSession(session: OjtSession): Promise<{ ok: boolean; session: OjtSession }> {
  const row = normalizeOjtSession(session, session.branchId)
  const month = monthOf(row.trainingDate) || monthOf(new Date().toISOString())
  if (!month) return { ok: false, session: row }
  const list = await loadMonthSessions(row.branchId, month)
  const idx = list.findIndex((s) => s.id === row.id)
  if (idx >= 0) list[idx] = row
  else list.push(row)
  const ok = await saveMonthSessions(row.branchId, month, list)
  return { ok, session: row }
}

export async function deleteSession(branchId: string, sessionId: string, month: string): Promise<boolean> {
  const list = await loadMonthSessions(branchId, month)
  const next = list.filter((s) => s.id !== sessionId)
  if (next.length === list.length) return false
  return saveMonthSessions(branchId, month, next)
}

/** Permanently remove the completion / security observation report for a session. */
export async function deleteOjtReport(sessionId: string): Promise<boolean> {
  const id = String(sessionId ?? '').trim()
  if (!id) return false
  return delJson(reportKey(id))
}

/**
 * Management wipe of a test schedule: removes the calendar session and its report.
 * Does not mail the client (unlike Cancel & Share).
 * Report is always removed even if the schedule row was already gone.
 */
export async function deleteSessionAndReport(
  branchId: string,
  sessionId: string,
  month: string,
): Promise<{ ok: boolean; scheduleRemoved: boolean; reportRemoved: boolean }> {
  const scheduleRemoved = await deleteSession(branchId, sessionId, month)
  const reportRemoved = await deleteOjtReport(sessionId)
  return {
    ok: scheduleRemoved || reportRemoved,
    scheduleRemoved,
    reportRemoved,
  }
}

/** Wider month hints so Management delete finds test rows outside the open calendar month. */
export function purgeMonthHints(trainingDateOrMonth?: string): string[] {
  const out: string[] = []
  const add = (m: string) => {
    const v = String(m || '').slice(0, 7)
    if (/^\d{4}-\d{2}$/.test(v) && !out.includes(v)) out.push(v)
  }
  add(trainingDateOrMonth || '')
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    add(monthOf(d.toISOString()))
  }
  return out
}

/** Find a session by id across several branches and months (Management purge). */
export async function findSessionAcrossBranches(
  sessionId: string,
  branchIds: string[],
  trainingDateOrMonth?: string,
): Promise<{ session: OjtSession; month: string; branchId: string } | null> {
  const id = String(sessionId || '').trim()
  if (!id) return null
  const hints = purgeMonthHints(trainingDateOrMonth)
  const tried = new Set<string>()
  for (const bid of branchIds) {
    const branchId = String(bid || '').trim()
    if (!branchId || tried.has(branchId)) continue
    tried.add(branchId)
    const found = await findSession(branchId, id, hints)
    if (found) return { session: found.session, month: found.month, branchId: found.session.branchId || branchId }
  }
  return null
}

export function scheduleTypeLabel(tag: string): string {
  return OJT_SCHEDULE_TYPE_LABELS[tag] || tag || '—'
}

/** Up to 3 unique client inboxes from the schedule form (comma / semicolon also accepted). */
export function ojtClientEmailsFromSession(
  raw: Pick<OjtSession, 'clientEmail' | 'clientEmail2' | 'clientEmail3'> | Partial<OjtSession>,
): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const part of [raw.clientEmail, raw.clientEmail2, raw.clientEmail3]) {
    for (const piece of String(part || '').split(/[,;]+/)) {
      const e = piece.trim().toLowerCase()
      if (!e.includes('@') || seen.has(e)) continue
      seen.add(e)
      out.push(e)
      if (out.length >= 3) return out
    }
  }
  return out
}

/** Columns the trainer must fill before Review / Send of a completion report. */
export function completionReportMissingColumns(report: OjtReport): string[] {
  const missing: string[] = []
  if (!String(report.reportDate || '').trim()) missing.push('Date')
  if (!String(report.sanctionedStrength || '').trim()) missing.push('Sanctioned strength')
  if (!String(report.attendanceCount || '').trim()) missing.push('Attended count')
  if (!String(report.topicsCovered || '').trim()) missing.push('Topics covered')
  if (!String(report.attendanceNames || '').trim()) missing.push('Attended list')
  if (!String(report.operationsStaffNames || '').trim()) missing.push('OM reported')
  const hasMarks = Boolean(
    String(report.marksFileName || '').trim() ||
      (String(report.marksFileBase64 || '').trim() && report.marksFileBase64 !== '__stored__'),
  )
  if (!hasMarks) missing.push('Marks statement')
  if (!(report.completionPhotos || []).length) missing.push('Training photos')
  if (!String(report.feedback || '').trim()) missing.push('Feedback')
  return missing
}
