/**
 * Night Visit (check) + Training (OJT) — monthly schedules & date-wise reports.
 */

import { nid } from './store.js'

const SCHEDULE_NIGHT = 'mis:night-schedule:'
const SCHEDULE_TRAINING = 'mis:training-schedule:'
const REPORT_NIGHT = 'mis:night-report:'
const REPORT_TRAINING = 'mis:training-report:'

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

async function redisMget(keys: string[]): Promise<(string | null)[]> {
  if (!keys.length) return []
  const d = await redis(['MGET', ...keys])
  const result = d?.result
  if (!Array.isArray(result)) return keys.map(() => null)
  return result.map((v) => (typeof v === 'string' ? v : null))
}

async function setJson(key: string, value: unknown): Promise<boolean> {
  const d = await redis(['SET', key, JSON.stringify(value)])
  return d?.result === 'OK'
}

export type MisScheduleUpload = {
  month: string
  branchId: string
  fileName: string
  mimeType: string
  dataBase64: string
  uploadedAt: string
  uploadedBy?: string
}

export type MisNightVisitReport = {
  id: string
  branchId: string
  reportDate: string
  dutyOfficerName: string
  driverName: string
  unitsVisited: string
  observation: string
  information: string
  sleepingCases: string
  idCardValidity: string
  turnoutIssue: string
  reportSentToClient: 'Yes' | 'No' | ''
  sentByName: string
  updatedAt: string
  updatedBy?: string
}

export type MisTrainingUnitRow = {
  unitName: string
  sanctionedPosts: string
  trainingAttended: string
  trainingTopics: string
  observation: string
  information: string
  clientComplaintSuggestion: string
  idCardValidity: string
  turnoutIssue: string
}

export type MisTrainingDayReport = {
  id: string
  branchId: string
  reportDate: string
  trainingByName: string
  reportSentToClient: 'Yes' | 'No' | ''
  sentByName: string
  rows: MisTrainingUnitRow[]
  updatedAt: string
  updatedBy?: string
}

export type NightOjtKind = 'night' | 'training'

function scheduleKey(kind: NightOjtKind, branchId: string, month: string): string {
  const prefix = kind === 'night' ? SCHEDULE_NIGHT : SCHEDULE_TRAINING
  return `${prefix}${branchId}:${month.slice(0, 7)}`
}

function reportKey(kind: NightOjtKind, branchId: string, date: string): string {
  const prefix = kind === 'night' ? REPORT_NIGHT : REPORT_TRAINING
  return `${prefix}${branchId}:${date.slice(0, 10)}`
}

export async function loadSchedule(
  kind: NightOjtKind,
  branchId: string,
  month: string,
): Promise<MisScheduleUpload | null> {
  return getJson<MisScheduleUpload | null>(scheduleKey(kind, branchId, month), null)
}

export async function saveScheduleForBranch(
  kind: NightOjtKind,
  branchId: string,
  upload: Omit<MisScheduleUpload, 'branchId'> & { month: string },
): Promise<boolean> {
  const row: MisScheduleUpload = {
    ...upload,
    branchId,
    month: upload.month.slice(0, 7),
  }
  return setJson(scheduleKey(kind, branchId, row.month), row)
}

export async function loadNightReport(branchId: string, date: string): Promise<MisNightVisitReport | null> {
  return getJson<MisNightVisitReport | null>(reportKey('night', branchId, date), null)
}

/** Count distinct units listed in Night Visit (check) free text — used by Daily MIS Step 3 autofill. */
export function countNightVisitUnits(report: MisNightVisitReport | null | undefined): number {
  if (!report) return 0
  const raw = String(report.unitsVisited ?? '').trim()
  if (!raw) return 0
  const parts = raw
    .split(/[\n,;/|]+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length >= 2)
  if (!parts.length) return 0
  return new Set(parts.map((s) => s.toLowerCase())).size
}

/** Batch-load night visit reports for many branch × date pairs (one MGET). */
export async function loadNightReportsBatch(
  branchIds: string[],
  dates: string[],
): Promise<Map<string, MisNightVisitReport>> {
  const keys: string[] = []
  const meta: { branchId: string; date: string }[] = []
  for (const branchId of branchIds) {
    for (const date of dates) {
      keys.push(reportKey('night', branchId, date))
      meta.push({ branchId, date: date.slice(0, 10) })
    }
  }
  const raw = await redisMget(keys)
  const out = new Map<string, MisNightVisitReport>()
  raw.forEach((value, i) => {
    if (!value) return
    try {
      const parsed = JSON.parse(value) as MisNightVisitReport
      const { branchId, date } = meta[i]
      out.set(`${branchId}:${date}`, parsed)
    } catch {
      /* skip bad row */
    }
  })
  return out
}

export async function saveNightReport(report: MisNightVisitReport): Promise<boolean> {
  return setJson(reportKey('night', report.branchId, report.reportDate), report)
}

export async function loadTrainingReport(branchId: string, date: string): Promise<MisTrainingDayReport | null> {
  return getJson<MisTrainingDayReport | null>(reportKey('training', branchId, date), null)
}

export async function saveTrainingReport(report: MisTrainingDayReport): Promise<boolean> {
  return setJson(reportKey('training', report.branchId, report.reportDate), report)
}

export function emptyNightReport(branchId: string, date: string): MisNightVisitReport {
  return {
    id: nid('nv'),
    branchId,
    reportDate: date.slice(0, 10),
    dutyOfficerName: '',
    driverName: '',
    unitsVisited: '',
    observation: '',
    information: '',
    sleepingCases: '',
    idCardValidity: '',
    turnoutIssue: '',
    reportSentToClient: '',
    sentByName: '',
    updatedAt: new Date().toISOString(),
  }
}

export function emptyTrainingReport(branchId: string, date: string): MisTrainingDayReport {
  return {
    id: nid('tr'),
    branchId,
    reportDate: date.slice(0, 10),
    trainingByName: '',
    reportSentToClient: '',
    sentByName: '',
    rows: [emptyTrainingRow()],
    updatedAt: new Date().toISOString(),
  }
}

export function emptyTrainingRow(): MisTrainingUnitRow {
  return {
    unitName: '',
    sanctionedPosts: '',
    trainingAttended: '',
    trainingTopics: '',
    observation: '',
    information: '',
    clientComplaintSuggestion: '',
    idCardValidity: '',
    turnoutIssue: '',
  }
}

export function normalizeNightReport(raw: Partial<MisNightVisitReport>, branchId: string, date: string): MisNightVisitReport {
  const sent = String(raw.reportSentToClient ?? '').trim()
  return {
    id: String(raw.id || nid('nv')),
    branchId,
    reportDate: date.slice(0, 10),
    dutyOfficerName: String(raw.dutyOfficerName ?? '').slice(0, 120),
    driverName: String(raw.driverName ?? '').slice(0, 120),
    unitsVisited: String(raw.unitsVisited ?? '').slice(0, 4000),
    observation: String(raw.observation ?? '').slice(0, 4000),
    information: String(raw.information ?? '').slice(0, 4000),
    sleepingCases: String(raw.sleepingCases ?? '').slice(0, 2000),
    idCardValidity: String(raw.idCardValidity ?? '').slice(0, 2000),
    turnoutIssue: String(raw.turnoutIssue ?? '').slice(0, 2000),
    reportSentToClient: sent === 'Yes' || sent === 'No' ? sent : '',
    sentByName: String(raw.sentByName ?? '').slice(0, 120),
    updatedAt: String(raw.updatedAt || new Date().toISOString()),
    updatedBy: raw.updatedBy ? String(raw.updatedBy).slice(0, 120) : undefined,
  }
}

export function normalizeTrainingReport(
  raw: Partial<MisTrainingDayReport>,
  branchId: string,
  date: string,
): MisTrainingDayReport {
  const sent = String(raw.reportSentToClient ?? '').trim()
  const rows = Array.isArray(raw.rows) ? raw.rows : []
  return {
    id: String(raw.id || nid('tr')),
    branchId,
    reportDate: date.slice(0, 10),
    trainingByName: String(raw.trainingByName ?? '').slice(0, 120),
    reportSentToClient: sent === 'Yes' || sent === 'No' ? sent : '',
    sentByName: String(raw.sentByName ?? '').slice(0, 120),
    rows: (rows.length ? rows : [emptyTrainingRow()]).slice(0, 80).map((r) => ({
      unitName: String(r.unitName ?? '').slice(0, 200),
      sanctionedPosts: String(r.sanctionedPosts ?? '').slice(0, 40),
      trainingAttended: String(r.trainingAttended ?? '').slice(0, 40),
      trainingTopics: String(r.trainingTopics ?? '').slice(0, 2000),
      observation: String(r.observation ?? '').slice(0, 2000),
      information: String(r.information ?? '').slice(0, 2000),
      clientComplaintSuggestion: String(r.clientComplaintSuggestion ?? '').slice(0, 2000),
      idCardValidity: String(r.idCardValidity ?? '').slice(0, 2000),
      turnoutIssue: String(r.turnoutIssue ?? '').slice(0, 2000),
    })),
    updatedAt: String(raw.updatedAt || new Date().toISOString()),
    updatedBy: raw.updatedBy ? String(raw.updatedBy).slice(0, 120) : undefined,
  }
}

export function storageOk(): boolean {
  return Boolean(redisConfig())
}
