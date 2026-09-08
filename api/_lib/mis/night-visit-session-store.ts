/**
 * Night Visit (check) — calendar sessions, route, WhatsApp, client reports.
 * Redis: mis:night-sessions:{branchId}:{YYYY-MM}
 */

import { nid } from './store.js'

export type NightVisitStatus = 'Scheduled' | 'RouteReady' | 'TeamNotified' | 'Completed' | 'Cancelled'
export type WaStatus = 'not_sent' | 'sent' | 'failed'

export type NightVisitPostObs = {
  postName: string
  observation: string
  sleeping: string
  idCard: string
  turnout: string
  information: string
}

export type NightVisitClientReport = {
  clientEmail: string
  reportDate: string
  generalObservation: string
  information: string
  sleepingCases: string
  idCardValidity: string
  turnoutIssue: string
  posts: NightVisitPostObs[]
  savedAt: string
  hodApproved: boolean
  hodApprovedAt: string
  hodApprovedBy: string
  sentToClientAt: string
  sentToClientBy: string
}

export type NightVisitStop = {
  id: string
  clientId: string
  clientName: string
  location: string
  mapUrl: string
  clientEmail: string
  sequence: number
  report?: NightVisitClientReport
}

export type NightVisitSession = {
  id: string
  branchId: string
  visitDate: string
  visitTimeStart: string
  visitTimeEnd: string
  dutyOfficerName: string
  dutyOfficerPhone: string
  status: NightVisitStatus
  cancelReason: string
  driverName: string
  vehicleRegNo: string
  /** Toggle: vehicle needed — copies a new visit/case to Agile Control on save */
  vehicleRequired: boolean
  controlCaseNo: string
  stops: NightVisitStop[]
  waAutoStatus: WaStatus
  waAutoSentAt: string
  waAutoError: string
  waReminderStatus: WaStatus
  waReminderSentAt: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url, token } : null
}

export function storageOk(): boolean {
  return redisConfig() !== null
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

function sessionKey(branchId: string, month: string): string {
  return `mis:night-sessions:${branchId}:${month.slice(0, 7)}`
}

function ymd(v: unknown): string {
  const d = String(v ?? '').slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : ''
}

function hm(v: unknown, fallback: string): string {
  const t = String(v ?? '').slice(0, 5)
  return /^\d{2}:\d{2}$/.test(t) ? t : fallback
}

function waOf(v: unknown): WaStatus {
  const s = String(v ?? '')
  if (s === 'sent' || s === 'failed') return s
  return 'not_sent'
}

function statusOf(v: unknown): NightVisitStatus {
  const s = String(v ?? '')
  if (s === 'RouteReady' || s === 'TeamNotified' || s === 'Completed' || s === 'Cancelled') return s
  return 'Scheduled'
}

function normalizePosts(raw: unknown): NightVisitPostObs[] {
  if (!Array.isArray(raw)) return []
  return raw.map((row) => {
    const p = (row && typeof row === 'object' ? row : {}) as Partial<NightVisitPostObs>
    return {
      postName: String(p.postName ?? '').slice(0, 120),
      observation: String(p.observation ?? '').slice(0, 2000),
      sleeping: String(p.sleeping ?? '').slice(0, 400),
      idCard: String(p.idCard ?? '').slice(0, 400),
      turnout: String(p.turnout ?? '').slice(0, 400),
      information: String(p.information ?? '').slice(0, 800),
    }
  })
}

export function normalizeReport(raw: unknown): NightVisitClientReport {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<NightVisitClientReport>
  return {
    clientEmail: String(r.clientEmail ?? '').slice(0, 200),
    reportDate: ymd(r.reportDate) || '',
    generalObservation: String(r.generalObservation ?? '').slice(0, 4000),
    information: String(r.information ?? '').slice(0, 2000),
    sleepingCases: String(r.sleepingCases ?? '').slice(0, 2000),
    idCardValidity: String(r.idCardValidity ?? '').slice(0, 1000),
    turnoutIssue: String(r.turnoutIssue ?? '').slice(0, 1000),
    posts: normalizePosts(r.posts),
    savedAt: String(r.savedAt ?? '').slice(0, 40),
    hodApproved: r.hodApproved === true,
    hodApprovedAt: String(r.hodApprovedAt ?? '').slice(0, 40),
    hodApprovedBy: String(r.hodApprovedBy ?? '').slice(0, 120),
    sentToClientAt: String(r.sentToClientAt ?? '').slice(0, 40),
    sentToClientBy: String(r.sentToClientBy ?? '').slice(0, 120),
  }
}

export function normalizeStop(raw: Partial<NightVisitStop> | null | undefined, i = 0): NightVisitStop {
  const row = raw && typeof raw === 'object' ? raw : {}
  const id = String(row.id ?? '').trim()
  return {
    id: id && id.length <= 40 ? id : nid('nvst'),
    clientId: String(row.clientId ?? '').slice(0, 80),
    clientName: String(row.clientName ?? '').slice(0, 200),
    location: String(row.location ?? '').slice(0, 200),
    mapUrl: String(row.mapUrl ?? '').slice(0, 400),
    clientEmail: String(row.clientEmail ?? '').slice(0, 200),
    sequence: Number(row.sequence) || i + 1,
    report: row.report ? normalizeReport(row.report) : undefined,
  }
}

export function emptySession(branchId: string): NightVisitSession {
  const now = new Date().toISOString()
  return {
    id: nid('nvs'),
    branchId,
    visitDate: '',
    visitTimeStart: '22:00',
    visitTimeEnd: '05:00',
    dutyOfficerName: '',
    dutyOfficerPhone: '',
    status: 'Scheduled',
    cancelReason: '',
    driverName: '',
    vehicleRegNo: '',
    vehicleRequired: false,
    controlCaseNo: '',
    stops: [],
    waAutoStatus: 'not_sent',
    waAutoSentAt: '',
    waAutoError: '',
    waReminderStatus: 'not_sent',
    waReminderSentAt: '',
    createdAt: now,
    updatedAt: now,
    createdBy: '',
  }
}

export function normalizeSession(raw: Partial<NightVisitSession> | null | undefined): NightVisitSession {
  const base = emptySession('')
  const row = raw && typeof raw === 'object' ? raw : {}
  const id = String(row.id ?? '').trim()
  const stops = Array.isArray(row.stops) ? row.stops.map((st, i) => normalizeStop(st, i)) : []
  return {
    ...base,
    ...row,
    id: id && id.length <= 40 ? id : base.id,
    branchId: String(row.branchId ?? '').slice(0, 80),
    visitDate: ymd(row.visitDate),
    visitTimeStart: hm(row.visitTimeStart, '22:00'),
    visitTimeEnd: hm(row.visitTimeEnd, '05:00'),
    dutyOfficerName: String(row.dutyOfficerName ?? '').slice(0, 120),
    dutyOfficerPhone: String(row.dutyOfficerPhone ?? '').slice(0, 20),
    status: statusOf(row.status),
    cancelReason: String(row.cancelReason ?? '').slice(0, 400),
    driverName: String(row.driverName ?? '').slice(0, 120),
    vehicleRegNo: String(row.vehicleRegNo ?? '').slice(0, 40),
    vehicleRequired: row.vehicleRequired === true,
    controlCaseNo: String(row.controlCaseNo ?? '').slice(0, 40),
    stops,
    waAutoStatus: waOf(row.waAutoStatus),
    waAutoSentAt: String(row.waAutoSentAt ?? '').slice(0, 40),
    waAutoError: String(row.waAutoError ?? '').slice(0, 200),
    waReminderStatus: waOf(row.waReminderStatus),
    waReminderSentAt: String(row.waReminderSentAt ?? '').slice(0, 40),
    createdAt: String(row.createdAt ?? base.createdAt).slice(0, 40),
    updatedAt: String(row.updatedAt ?? base.updatedAt).slice(0, 40),
    createdBy: String(row.createdBy ?? '').slice(0, 120),
  }
}

export async function loadNightSessions(branchId: string, month: string): Promise<NightVisitSession[]> {
  const raw = await getJson<unknown[]>(sessionKey(branchId, month), [])
  if (!Array.isArray(raw)) return []
  return raw.map((row) => normalizeSession(row as Partial<NightVisitSession>))
}

export async function saveNightSessions(
  branchId: string,
  month: string,
  list: NightVisitSession[],
): Promise<boolean> {
  return setJson(
    sessionKey(branchId, month),
    list.map((s) => normalizeSession(s)),
  )
}
