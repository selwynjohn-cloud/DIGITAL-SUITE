/**
 * Training Confirmation EOI → Agile Recruitment follow-up ledger.
 * Read/write only this list — does not edit Branch clients or MIS.
 */

import { getBranches } from '../mis/store.js'
import { loadGuardsResponses, type GuardsLinkResponse } from '../training/ojt-guards-link-store.js'
import { loadMonthSessions, monthOf, type OjtSession } from '../training/ojt-store.js'
import { isTrainingDepartmentBranch } from '../training/ojt-training-dept.js'

const KEY = 'recruit:training-eoi'

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

export type TrainingEoiFollowStatus = 'pending' | 'contacted' | 'rejoined' | 'closed'

export type TrainingEoiFollowRow = {
  id: string
  sessionId: string
  branchId: string
  branchName: string
  clientName: string
  location: string
  unitName: string
  trainingDate: string
  trainingTime: string
  trainerName: string
  guardName: string
  employeeId: string
  mobile: string
  eoiAt: string
  /** Absentee expected join-back date from EOI DOJ reply */
  eoiJoiningDate: string
  kind: 'attend' | 'absentee_doj'
  followStatus: TrainingEoiFollowStatus
  followNotes: string
  followUpdatedAt: string
  followUpdatedBy: string
  createdAt: string
  updatedAt: string
}

function mobile10(raw: string): string {
  const d = String(raw || '').replace(/\D/g, '')
  return d.length >= 10 ? d.slice(-10) : d
}

function rowId(sessionId: string, mobile: string, responseId?: string): string {
  const m = mobile10(mobile)
  if (m.length === 10) return `teoi:${sessionId}:${m}`
  return `teoi:${sessionId}:${String(responseId || 'x').slice(0, 40)}`
}

export function normalizeTrainingEoiRow(raw: Partial<TrainingEoiFollowRow>): TrainingEoiFollowRow {
  const status = String(raw.followStatus || 'pending')
  const followStatus: TrainingEoiFollowStatus =
    status === 'contacted' || status === 'rejoined' || status === 'closed' ? status : 'pending'
  const doj = String(raw.eoiJoiningDate || '').trim().slice(0, 20)
  return {
    id: String(raw.id || '').slice(0, 80),
    sessionId: String(raw.sessionId || '').slice(0, 40),
    branchId: String(raw.branchId || '').slice(0, 80),
    branchName: String(raw.branchName || '').slice(0, 120),
    clientName: String(raw.clientName || '').slice(0, 200),
    location: String(raw.location || '').slice(0, 300),
    unitName: String(raw.unitName || '').slice(0, 200),
    trainingDate: String(raw.trainingDate || '').slice(0, 10),
    trainingTime: String(raw.trainingTime || '').slice(0, 8),
    trainerName: String(raw.trainerName || '').slice(0, 120),
    guardName: String(raw.guardName || '').slice(0, 120),
    employeeId: String(raw.employeeId || '').slice(0, 40),
    mobile: mobile10(String(raw.mobile || '')),
    eoiAt: String(raw.eoiAt || '').slice(0, 40),
    eoiJoiningDate: doj,
    kind: doj || raw.kind === 'absentee_doj' ? 'absentee_doj' : 'attend',
    followStatus,
    followNotes: String(raw.followNotes || '').slice(0, 1000),
    followUpdatedAt: String(raw.followUpdatedAt || '').slice(0, 40),
    followUpdatedBy: String(raw.followUpdatedBy || '').slice(0, 120),
    createdAt: String(raw.createdAt || new Date().toISOString()).slice(0, 40),
    updatedAt: String(raw.updatedAt || new Date().toISOString()).slice(0, 40),
  }
}

export async function listTrainingEoiFollowUps(): Promise<TrainingEoiFollowRow[]> {
  const list = await getJson<TrainingEoiFollowRow[]>(KEY, [])
  return (Array.isArray(list) ? list : []).map(normalizeTrainingEoiRow)
}

async function saveTrainingEoiFollowUps(rows: TrainingEoiFollowRow[]): Promise<boolean> {
  const list = rows
    .map(normalizeTrainingEoiRow)
    .filter((r) => r.id && (r.mobile || r.guardName))
    .slice(0, 5000)
  return setJson(KEY, list)
}

export type UpsertTrainingEoiInput = {
  session: Pick<
    OjtSession,
    | 'id'
    | 'branchId'
    | 'clientName'
    | 'location'
    | 'trainingDate'
    | 'trainingTime'
    | 'trainerName'
  >
  branchName?: string
  response: Pick<
    GuardsLinkResponse,
    'id' | 'guardName' | 'employeeId' | 'mobile' | 'eoiAt' | 'eoiJoiningDate' | 'status'
  >
  unitName?: string
}

/** Called when a guard sends EOI / EOI DOJ from Training WhatsApp or link. */
export async function upsertTrainingEoiFromResponse(input: UpsertTrainingEoiInput): Promise<TrainingEoiFollowRow | null> {
  const sessionId = String(input.session.id || '').trim()
  const mobile = mobile10(input.response.mobile || '')
  if (!sessionId) return null
  if (!input.response.eoiAt && input.response.status !== 'attending') return null
  if (!mobile && !input.response.guardName) return null

  const id = rowId(sessionId, mobile, input.response.id)
  const list = await listTrainingEoiFollowUps()
  const prev = list.find((r) => r.id === id)
  const doj = String(input.response.eoiJoiningDate || prev?.eoiJoiningDate || '').trim()
  const now = new Date().toISOString()
  const next = normalizeTrainingEoiRow({
    ...prev,
    id,
    sessionId,
    branchId: input.session.branchId || prev?.branchId || '',
    branchName: input.branchName || prev?.branchName || '',
    clientName: input.session.clientName || prev?.clientName || '',
    location: input.session.location || prev?.location || '',
    unitName: input.unitName || prev?.unitName || '',
    trainingDate: input.session.trainingDate || prev?.trainingDate || '',
    trainingTime: input.session.trainingTime || prev?.trainingTime || '',
    trainerName: input.session.trainerName || prev?.trainerName || '',
    guardName: input.response.guardName || prev?.guardName || '',
    employeeId: input.response.employeeId || prev?.employeeId || '',
    mobile: mobile || prev?.mobile || '',
    eoiAt: input.response.eoiAt || prev?.eoiAt || now,
    eoiJoiningDate: doj,
    kind: doj ? 'absentee_doj' : 'attend',
    followStatus: prev?.followStatus || 'pending',
    followNotes: prev?.followNotes || '',
    followUpdatedAt: prev?.followUpdatedAt || '',
    followUpdatedBy: prev?.followUpdatedBy || '',
    createdAt: prev?.createdAt || now,
    updatedAt: now,
  })
  const i = list.findIndex((r) => r.id === id)
  if (i >= 0) list[i] = next
  else list.unshift(next)
  await saveTrainingEoiFollowUps(list)
  return next
}

export async function updateTrainingEoiFollowUp(opts: {
  id: string
  followStatus?: TrainingEoiFollowStatus
  followNotes?: string
  by?: string
}): Promise<{ ok: true; row: TrainingEoiFollowRow } | { ok: false; error: string }> {
  const id = String(opts.id || '').trim()
  if (!id) return { ok: false, error: 'Missing row.' }
  const list = await listTrainingEoiFollowUps()
  const i = list.findIndex((r) => r.id === id)
  if (i < 0) return { ok: false, error: 'EOI row not found.' }
  const now = new Date().toISOString()
  list[i] = normalizeTrainingEoiRow({
    ...list[i],
    followStatus: opts.followStatus || list[i].followStatus,
    followNotes: opts.followNotes != null ? opts.followNotes : list[i].followNotes,
    followUpdatedAt: now,
    followUpdatedBy: String(opts.by || '').slice(0, 120),
    updatedAt: now,
  })
  await saveTrainingEoiFollowUps(list)
  return { ok: true, row: list[i] }
}

function recentMonths(count = 3): string[] {
  const out: string[] = []
  const d = new Date()
  for (let i = 0; i < count; i++) {
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    d.setMonth(d.getMonth() - 1)
  }
  return out
}

/** Pull EOI rows from Training sessions into Recruitment ledger. */
export async function syncTrainingEoiFromSessions(opts?: {
  months?: number
}): Promise<{ ok: true; upserted: number; scannedSessions: number }> {
  const branches = (await getBranches(false)).filter((b) => !isTrainingDepartmentBranch(b))
  const months = recentMonths(Math.min(3, Math.max(1, opts?.months || 1)))
  let upserted = 0
  let scannedSessions = 0
  const started = Date.now()
  for (const b of branches) {
    if (Date.now() - started > 25000) break
    for (const month of months) {
      if (Date.now() - started > 25000) break
      const sessions = await loadMonthSessions(b.id, month)
      for (const s of sessions) {
        if (Date.now() - started > 25000) break
        scannedSessions += 1
        const responses = await loadGuardsResponses(s.id)
        if (!responses.length) continue
        for (const r of responses) {
          if (!r.eoiAt && r.status !== 'attending') continue
          const saved = await upsertTrainingEoiFromResponse({
            session: s,
            branchName: b.name,
            response: r,
            unitName: '',
          })
          if (saved) upserted += 1
        }
      }
    }
  }
  return { ok: true, upserted, scannedSessions }
}

export function filterTrainingEoiRows(
  rows: TrainingEoiFollowRow[],
  opts: {
    branchName?: string
    kind?: 'all' | 'absentee_doj' | 'attend'
    followStatus?: 'all' | TrainingEoiFollowStatus
  },
): TrainingEoiFollowRow[] {
  let list = rows.slice()
  const branch = String(opts.branchName || '').trim()
  if (branch && branch !== 'ALL') {
    const n = branch.toLowerCase()
    list = list.filter(
      (r) =>
        r.branchName.toLowerCase().includes(n) ||
        n.includes(r.branchName.toLowerCase()) ||
        (/hyderabad|hi-?tech/i.test(branch) && /hyderabad|hi-?tech/i.test(r.branchName)),
    )
  }
  if (opts.kind === 'absentee_doj') list = list.filter((r) => r.kind === 'absentee_doj' || r.eoiJoiningDate)
  if (opts.kind === 'attend') list = list.filter((r) => r.kind === 'attend' && !r.eoiJoiningDate)
  if (opts.followStatus && opts.followStatus !== 'all') {
    list = list.filter((r) => r.followStatus === opts.followStatus)
  }
  list.sort((a, b) => {
    const aDoj = a.eoiJoiningDate ? 0 : 1
    const bDoj = b.eoiJoiningDate ? 0 : 1
    if (aDoj !== bDoj) return aDoj - bDoj
    return String(b.eoiAt || b.updatedAt).localeCompare(String(a.eoiAt || a.updatedAt))
  })
  return list
}

export { monthOf }
