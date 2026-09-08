/**
 * Walk-in Pipeline — manual entries (Agile Recruitment only).
 * Redis: recruit:walkins
 */

import {
  normalizeRegistration,
  registrationDay,
  type RegisteredCandidate,
  type RegisteredCandidateStatus,
} from './registration-store.js'
import { recruitNid } from './store.js'

const LIST_KEY = 'recruit:walkins'
const COUNTER_KEY = 'recruit:walkin-counter'

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

async function nextSerial(): Promise<number> {
  const d = await redis(['INCR', COUNTER_KEY])
  const n = Number(d?.result)
  return Number.isFinite(n) ? n : Date.now() % 100000
}

function walkInRegCode(branchId: string, serial: number): string {
  const ab = branchId.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X') || 'WI'
  const now = new Date()
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yyyy = now.getFullYear()
  const hh = String(now.getHours()).padStart(2, '0')
  const mi = String(now.getMinutes()).padStart(2, '0')
  return `WI/${ab}/${String(serial).padStart(5, '0')}/${dd}${mm}${yyyy}-${hh}${mi}`
}

export async function getWalkIns(): Promise<RegisteredCandidate[]> {
  const d = await redis(['GET', LIST_KEY])
  if (d?.result && typeof d.result === 'string') {
    try {
      return (JSON.parse(d.result) as RegisteredCandidate[]).map((r) =>
        normalizeWalkIn(r),
      )
    } catch {
      return []
    }
  }
  return []
}

export async function saveWalkIns(list: RegisteredCandidate[]): Promise<boolean> {
  const d = await redis(['SET', LIST_KEY, JSON.stringify(list.slice(0, 10000))])
  return d?.result === 'OK'
}

export function normalizeWalkIn(raw: Partial<RegisteredCandidate>): RegisteredCandidate {
  const cleaned: Partial<RegisteredCandidate> = { ...raw }
  const joinedAt = String(cleaned.joinedAt || '').trim()
  if (cleaned.status === 'joined' && !joinedAt) cleaned.status = 'new'
  if (cleaned.status === 'new') {
    delete cleaned.joinedAt
    delete cleaned.rejectedAt
    delete cleaned.notWillingAt
  }
  const row = normalizeRegistration({
    ...cleaned,
    source: 'walk_in',
    location: cleaned.location || cleaned.branchId || '',
  })
  return {
    ...row,
    source: 'walk_in' as const,
    funnelChannel: String(cleaned.funnelChannel || row.funnelChannel || 'walkin').toLowerCase(),
  }
}

function walkInPhoneDigits(phone: string): string {
  return String(phone ?? '').replace(/\D/g, '').slice(-10)
}

export async function addWalkIn(input: {
  name: string
  phone: string
  branchId: string
  walkInFrom?: string
  referredBy?: string
  replyNotes?: string
  addedBy?: string
  funnelChannel?: string
}): Promise<RegisteredCandidate | null> {
  const serial = await nextSerial()
  const branchId = String(input.branchId ?? '').trim() || 'Hyderabad'
  const walkInFrom = String(input.walkInFrom ?? input.branchId ?? '').trim() || branchId
  const funnelChannel = String(input.funnelChannel || 'walkin').toLowerCase()
  const now = new Date().toISOString()
  const phoneDig = walkInPhoneDigits(input.phone)
  const all = await getWalkIns()
  const dupIdx =
    phoneDig.length >= 10
      ? all.findIndex((r) => r.active !== false && walkInPhoneDigits(r.phone) === phoneDig)
      : -1
  const row = normalizeWalkIn({
    id: dupIdx >= 0 ? all[dupIdx].id : recruitNid('wi'),
    regCode: walkInRegCode(branchId, serial),
    branchId,
    walkInFrom,
    referredBy: String(input.referredBy ?? '').trim() || undefined,
    funnelChannel,
    name: input.name,
    phone: input.phone,
    email: '',
    location: branchId,
    role: 'Security Guard',
    status: 'new' as RegisteredCandidateStatus,
    replyNotes: input.replyNotes || undefined,
    active: true,
    createdAt: now,
    calledAt: undefined,
    tentativeJoinDate: undefined,
    joinedAt: undefined,
    rejectedAt: undefined,
    notWillingAt: undefined,
  })
  const next =
    dupIdx >= 0
      ? all.map((r, i) => (i === dupIdx ? row : r))
      : [row, ...all]
  const ok = await saveWalkIns(next)
  return ok ? row : null
}

export { registrationDay }
