/**
 * MIS Client Visits — HOD schedule + visit report (day visits).
 * Redis key: mis:client-visits
 */

import { nid } from './store.js'

const CLIENT_VISITS_KEY = 'mis:client-visits'

export type MisClientVisitStatus = 'Draft' | 'Reviewed' | 'Sent'

export type MisClientVisit = {
  id: string
  branchId: string
  clientId: string
  clientName: string
  location: string
  clientEmail: string
  visitDate: string
  visitTime: string
  officerName: string
  officerPhone: string
  personMet: string
  purpose: string
  observation: string
  issues: string
  actionTaken: string
  followUp: string
  slaNote: string
  status: MisClientVisitStatus
  submittedAt: string
  submittedBy: string
  reviewedAt: string
  reviewedBy: string
  sentToClientAt: string
  sentToClientBy: string
  lastReminderAt: string
  reminderCount: number
  reopenedAt: string
  reopenedBy: string
  createdAt: string
  updatedAt: string
  createdBy: string
  active: boolean
  fromMobile: boolean
  mobileId: string
  /** Toggle: vehicle needed — copies a new visit/case to Agile Control on save */
  vehicleRequired: boolean
  controlCaseNo: string
  /** Filled when Control accepts vehicle + driver */
  driverName: string
  vehicleRegNo: string
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

function todayIst(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

function ymd(v: unknown): string {
  const d = String(v ?? '').slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : ''
}

function statusOf(v: unknown): MisClientVisitStatus {
  const s = String(v ?? '')
  if (s === 'Reviewed' || s === 'Sent') return s
  return 'Draft'
}

export function emptyClientVisit(branchId = ''): MisClientVisit {
  const now = new Date().toISOString()
  return {
    id: nid('cv'),
    branchId,
    clientId: '',
    clientName: '',
    location: '',
    clientEmail: '',
    visitDate: todayIst(),
    visitTime: '10:00',
    officerName: '',
    officerPhone: '',
    personMet: '',
    purpose: 'Routine client visit',
    observation: '',
    issues: '',
    actionTaken: '',
    followUp: '',
    slaNote: '',
    status: 'Draft',
    submittedAt: '',
    submittedBy: '',
    reviewedAt: '',
    reviewedBy: '',
    sentToClientAt: '',
    sentToClientBy: '',
    lastReminderAt: '',
    reminderCount: 0,
    reopenedAt: '',
    reopenedBy: '',
    createdAt: now,
    updatedAt: now,
    createdBy: '',
    active: true,
    fromMobile: false,
    mobileId: '',
    vehicleRequired: false,
    controlCaseNo: '',
    driverName: '',
    vehicleRegNo: '',
  }
}

export function normalizeClientVisit(raw: Partial<MisClientVisit> | null | undefined): MisClientVisit {
  const base = emptyClientVisit()
  const row = raw && typeof raw === 'object' ? raw : {}
  const id = String(row.id ?? '').trim()
  return {
    ...base,
    ...row,
    id: id && id.length <= 40 ? id : base.id,
    branchId: String(row.branchId ?? '').slice(0, 80),
    clientId: String(row.clientId ?? '').slice(0, 80),
    clientName: String(row.clientName ?? '').slice(0, 200),
    location: String(row.location ?? '').slice(0, 200),
    clientEmail: String(row.clientEmail ?? '').slice(0, 200),
    visitDate: ymd(row.visitDate) || todayIst(),
    visitTime: String(row.visitTime ?? '10:00').slice(0, 8) || '10:00',
    officerName: String(row.officerName ?? '').slice(0, 120),
    officerPhone: String(row.officerPhone ?? '').slice(0, 20),
    personMet: String(row.personMet ?? '').slice(0, 160),
    purpose: String(row.purpose ?? '').slice(0, 400),
    observation: String(row.observation ?? '').slice(0, 4000),
    issues: String(row.issues ?? '').slice(0, 2000),
    actionTaken: String(row.actionTaken ?? '').slice(0, 2000),
    followUp: String(row.followUp ?? '').slice(0, 2000),
    slaNote: String(row.slaNote ?? '').slice(0, 200),
    status: statusOf(row.status),
    submittedAt: String(row.submittedAt ?? '').slice(0, 40),
    submittedBy: String(row.submittedBy ?? '').slice(0, 120),
    reviewedAt: String(row.reviewedAt ?? '').slice(0, 40),
    reviewedBy: String(row.reviewedBy ?? '').slice(0, 120),
    sentToClientAt: String(row.sentToClientAt ?? '').slice(0, 40),
    sentToClientBy: String(row.sentToClientBy ?? '').slice(0, 120),
    lastReminderAt: String(row.lastReminderAt ?? '').slice(0, 40),
    reminderCount: Math.max(0, Number(row.reminderCount) || 0),
    reopenedAt: String(row.reopenedAt ?? '').slice(0, 40),
    reopenedBy: String(row.reopenedBy ?? '').slice(0, 120),
    createdAt: String(row.createdAt ?? base.createdAt).slice(0, 40),
    updatedAt: String(row.updatedAt ?? base.updatedAt).slice(0, 40),
    createdBy: String(row.createdBy ?? '').slice(0, 120),
    active: row.active !== false,
    fromMobile: row.fromMobile === true,
    mobileId: String(row.mobileId ?? '').slice(0, 80),
    vehicleRequired: row.vehicleRequired === true,
    controlCaseNo: String(row.controlCaseNo ?? '').slice(0, 40),
    driverName: String(row.driverName ?? '').slice(0, 120),
    vehicleRegNo: String(row.vehicleRegNo ?? '').slice(0, 40),
  }
}

export async function getClientVisits(): Promise<MisClientVisit[]> {
  const raw = await getJson<unknown[]>(CLIENT_VISITS_KEY, [])
  if (!Array.isArray(raw)) return []
  return raw.map((row) => normalizeClientVisit(row as Partial<MisClientVisit>)).filter((v) => v.active)
}

export async function saveClientVisits(list: MisClientVisit[]): Promise<boolean> {
  return setJson(CLIENT_VISITS_KEY, list.map((v) => normalizeClientVisit(v)))
}

/** One-time wipe of mixed schedules (Director 16 Aug 2026). */
const PURGE_MARK = 'mis:client-visits:purged-20260816'

export async function purgeAllClientVisitsOnce(): Promise<{ purged: boolean; removed: number }> {
  const marked = await redis(['GET', PURGE_MARK])
  if (typeof marked?.result === 'string' && marked.result) {
    return { purged: false, removed: 0 }
  }
  const before = await getClientVisits()
  const ok = await saveClientVisits([])
  if (!ok) return { purged: false, removed: 0 }
  await redis(['SET', PURGE_MARK, new Date().toISOString()])
  return { purged: true, removed: before.length }
}

/** Management may clear again if schedules get mixed. */
export async function clearAllClientVisitsNow(): Promise<number> {
  const before = await getClientVisits()
  await saveClientVisits([])
  await redis(['SET', PURGE_MARK, new Date().toISOString()])
  return before.length
}
