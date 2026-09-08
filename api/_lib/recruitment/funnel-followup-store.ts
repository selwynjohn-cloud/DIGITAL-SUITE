/**
 * Sourcing-funnel follow-up — last extracted list + Call 1–3 dates.
 * Dates are never deleted. Snapshot remembers the last Extract.
 */

import {
  datesFromBook,
  isSjFollowupDateField,
  mergeSjFollowupDates,
  pickSjFollowupDates,
  sjDateBookKeys,
  sjFollowupPhoneKey,
  type SjDateRefs,
  type SjFollowupDateBook,
  type SjFollowupDates,
} from './sj-followup-dates.js'

export const FUNNEL_KINDS = ['eoi', 'absconder', 'irregular', 'recruiters', 'news'] as const
export type FunnelKind = (typeof FUNNEL_KINDS)[number]

export type FunnelPerson = {
  id: string
  name: string
  phone: string
  branch: string
  empId: string
  detail: string
  extra1: string
  extra2: string
  extra3: string
  notes: string
  extractedAt: string
  sortTs: number
  call1At?: string
  tentativeJoinDate?: string
  call2At?: string
  call3At?: string
  joinedAt?: string
  holdRemindOn?: string
}

export type FunnelSnapshot = {
  kind: FunnelKind
  extractedAt: string
  asOf?: string
  month?: string
  hint?: string
  people: FunnelPerson[]
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

function parseJson<T>(raw: unknown, fallback: T): T {
  if (!raw) return fallback
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as T
  if (typeof raw !== 'string') return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function isFunnelKind(v: string): v is FunnelKind {
  return (FUNNEL_KINDS as readonly string[]).includes(v)
}

export function funnelDateBookKey(kind: FunnelKind): string {
  return `recruit:funnel-dates:${kind}`
}

export function funnelSnapKey(kind: FunnelKind): string {
  return `recruit:funnel-snap:${kind}`
}

export function normalizeFunnelPerson(raw: Partial<FunnelPerson> | null | undefined): FunnelPerson {
  const phone = sjFollowupPhoneKey(String(raw?.phone || ''))
  const dates = pickSjFollowupDates(raw as Record<string, unknown>)
  const extractedAt = String(raw?.extractedAt || new Date().toISOString()).slice(0, 40)
  const sortTs = Number(raw?.sortTs)
  return {
    id: String(raw?.id || '').slice(0, 80) || (phone ? `ff:${phone}` : ''),
    name: String(raw?.name || '').trim().slice(0, 120) || '—',
    phone,
    branch: String(raw?.branch || '').trim().slice(0, 80),
    empId: String(raw?.empId || '').trim().slice(0, 40),
    detail: String(raw?.detail || '').trim().slice(0, 240),
    extra1: String(raw?.extra1 || '').trim().slice(0, 80),
    extra2: String(raw?.extra2 || '').trim().slice(0, 80),
    extra3: String(raw?.extra3 || '').trim().slice(0, 80),
    notes: String(raw?.notes || '').trim().slice(0, 500),
    extractedAt,
    sortTs: Number.isFinite(sortTs) ? sortTs : Date.parse(extractedAt) || 0,
    ...dates,
  }
}

export function funnelPersonKey(p: { id?: string; phone?: string; empId?: string; name?: string }): string {
  const phone = sjFollowupPhoneKey(String(p.phone || ''))
  if (phone.length === 10) return `m:${phone}`
  const id = String(p.id || '').trim()
  if (id) return `id:${id}`
  const emp = String(p.empId || '').trim().toLowerCase()
  if (emp) return `emp:${emp}`
  return `n:${String(p.name || '').trim().toLowerCase()}`
}

export function hasFunnelDates(p: FunnelPerson): boolean {
  return !!(p.call1At || p.tentativeJoinDate || p.call2At || p.call3At || p.joinedAt || p.holdRemindOn)
}

export function funnelFollowBucket(p: FunnelPerson, todayYmd: string): 'call1' | 'call2' | 'call3' | 'hold' | 'joined' {
  if (p.joinedAt) return 'joined'
  const hold = p.holdRemindOn || ''
  if (hold && hold >= todayYmd && !p.joinedAt) return 'hold'
  if (!p.call1At || !p.tentativeJoinDate) return 'call1'
  if (!p.call2At) return 'call2'
  return 'call3'
}

export function countFunnelBuckets(people: FunnelPerson[], todayYmd: string) {
  const counts = { call1: 0, call2: 0, call3: 0, hold: 0, joined: 0, holdToday: 0 }
  for (const p of people) {
    const b = funnelFollowBucket(p, todayYmd)
    counts[b] += 1
    if (b === 'hold' && p.holdRemindOn === todayYmd) counts.holdToday += 1
  }
  return counts
}

export async function loadFunnelDateBook(kind: FunnelKind): Promise<SjFollowupDateBook> {
  const d = await redis(['GET', funnelDateBookKey(kind)])
  const book = parseJson<SjFollowupDateBook>(d?.result, {})
  const out: SjFollowupDateBook = {}
  for (const [rawKey, dates] of Object.entries(book || {})) {
    const picked = pickSjFollowupDates(dates as Record<string, unknown>)
    if (!Object.keys(picked).length) continue
    out[rawKey] = picked
    const mob = sjFollowupPhoneKey(rawKey.startsWith('m:') ? rawKey.slice(2) : rawKey)
    if (mob.length >= 10) out[`m:${mob}`] = mergeSjFollowupDates(out[`m:${mob}`], picked)
  }
  return out
}

export async function rememberFunnelDates(
  kind: FunnelKind,
  refs: SjDateRefs,
  patch: SjFollowupDates | Record<string, unknown>,
): Promise<{ ok: boolean; dates: SjFollowupDates; error?: string }> {
  const picked = pickSjFollowupDates(patch)
  const keys = sjDateBookKeys(refs)
  if (!keys.length) {
    const fallback = String(refs.id || refs.phone || '').trim()
    if (fallback) keys.push(`id:${fallback}`)
  }
  if (!keys.length) {
    return { ok: false, dates: picked, error: 'Name row missing — cannot save this date.' }
  }
  if (!Object.keys(picked).length) {
    const book = await loadFunnelDateBook(kind)
    return { ok: true, dates: datesFromBook(refs, book) }
  }
  if (!redisConfig()) {
    return { ok: false, dates: picked, error: 'Date store is not connected.' }
  }
  const book = await loadFunnelDateBook(kind)
  const cur = mergeSjFollowupDates(datesFromBook(refs, book), picked)
  for (const key of keys) book[key] = cur
  const saved = await redis(['SET', funnelDateBookKey(kind), JSON.stringify(book)])
  if (!saved) return { ok: false, dates: cur, error: 'Date could not be saved. Try again.' }
  return { ok: true, dates: cur }
}

export function applyFunnelDateBook(row: FunnelPerson, book: SjFollowupDateBook): FunnelPerson {
  const saved = datesFromBook({ phone: row.phone, id: row.id }, book)
  if (!Object.keys(saved).length) return row
  return { ...row, ...saved }
}

export async function loadFunnelSnapshot(kind: FunnelKind): Promise<FunnelSnapshot | null> {
  const d = await redis(['GET', funnelSnapKey(kind)])
  const snap = parseJson<FunnelSnapshot | null>(d?.result, null)
  if (!snap || !Array.isArray(snap.people)) return null
  return {
    kind,
    extractedAt: String(snap.extractedAt || ''),
    asOf: snap.asOf,
    month: snap.month,
    hint: snap.hint,
    people: snap.people.map(normalizeFunnelPerson).filter((p) => p.id || p.phone || p.name !== '—'),
  }
}

export function mergeFunnelPeople(oldList: FunnelPerson[], nextList: FunnelPerson[]): FunnelPerson[] {
  const map = new Map<string, FunnelPerson>()
  for (const p of nextList) map.set(funnelPersonKey(p), normalizeFunnelPerson(p))
  for (const prev of oldList) {
    const k = funnelPersonKey(prev)
    if (map.has(k)) {
      const cur = map.get(k)!
      map.set(k, normalizeFunnelPerson({ ...prev, ...cur, ...mergeSjFollowupDates(prev, cur) }))
      continue
    }
    if (hasFunnelDates(prev)) {
      map.set(k, normalizeFunnelPerson({ ...prev, detail: prev.detail || 'Kept from last list' }))
    }
  }
  return [...map.values()]
}

export async function saveFunnelSnapshot(snap: FunnelSnapshot): Promise<boolean> {
  if (!redisConfig()) return false
  const clean: FunnelSnapshot = {
    kind: snap.kind,
    extractedAt: snap.extractedAt || new Date().toISOString(),
    asOf: snap.asOf,
    month: snap.month,
    hint: snap.hint,
    people: snap.people.map(normalizeFunnelPerson),
  }
  const saved = await redis(['SET', funnelSnapKey(snap.kind), JSON.stringify(clean)])
  return !!saved
}

export { isSjFollowupDateField, datesFromBook }
