/**
 * OJT extras — feedback forms, training notes, post-training tests.
 */

import { nid } from '../mis/store.js'

const KEY = 'training:ojt-extra:'

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

export type OjtExtraKind =
  | 'feedbackGuard'
  | 'feedbackStaff'
  | 'feedbackClient'
  | 'notes'
  | 'notesPpt'
  | 'postTest'
  | 'questionBank'
  | 'subjectGuide'

export type OjtExtraEntry = {
  id: string
  branchId: string
  kind: OjtExtraKind
  sessionId: string
  clientName: string
  trainingDate: string
  title: string
  body: string
  score: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

function bucketKey(branchId: string, month: string) {
  return `${KEY}${branchId}:${String(month).slice(0, 7)}`
}

export function emptyExtra(branchId: string, kind: OjtExtraKind): OjtExtraEntry {
  const now = new Date().toISOString()
  return {
    id: nid('ox'),
    branchId,
    kind,
    sessionId: '',
    clientName: '',
    trainingDate: '',
    title: '',
    body: '',
    score: '',
    createdBy: '',
    createdAt: now,
    updatedAt: now,
  }
}

export function normalizeExtra(raw: Partial<OjtExtraEntry>, branchId: string): OjtExtraEntry {
  const base = emptyExtra(branchId, (raw.kind as OjtExtraKind) || 'notes')
  return {
    ...base,
    id: String(raw.id || base.id).slice(0, 40),
    branchId,
    kind: ([
      'feedbackGuard',
      'feedbackStaff',
      'feedbackClient',
      'notes',
      'notesPpt',
      'postTest',
      'questionBank',
      'subjectGuide',
    ].includes(String(raw.kind))
      ? raw.kind
      : 'notes') as OjtExtraKind,
    sessionId: String(raw.sessionId ?? '').slice(0, 40),
    clientName: String(raw.clientName ?? '').slice(0, 200),
    trainingDate: String(raw.trainingDate ?? '').slice(0, 10),
    title: String(raw.title ?? '').slice(0, 300),
    body: String(raw.body ?? '').slice(0, 12000),
    score: String(raw.score ?? '').slice(0, 40),
    createdBy: String(raw.createdBy ?? '').slice(0, 120),
    createdAt: String(raw.createdAt || base.createdAt).slice(0, 40),
    updatedAt: new Date().toISOString(),
  }
}

export async function loadExtras(branchId: string, month: string): Promise<OjtExtraEntry[]> {
  const list = await getJson<OjtExtraEntry[]>(bucketKey(branchId, month), [])
  return (Array.isArray(list) ? list : []).map((e) => normalizeExtra(e, branchId))
}

export async function saveExtra(entry: OjtExtraEntry, month: string): Promise<OjtExtraEntry | null> {
  const row = normalizeExtra(entry, entry.branchId)
  const m = String(month || row.trainingDate || '').slice(0, 7)
  if (!m) return null
  const list = await loadExtras(row.branchId, m)
  const idx = list.findIndex((x) => x.id === row.id)
  if (idx >= 0) list[idx] = row
  else list.unshift(row)
  const ok = await setJson(bucketKey(row.branchId, m), list.slice(0, 500))
  return ok ? row : null
}
