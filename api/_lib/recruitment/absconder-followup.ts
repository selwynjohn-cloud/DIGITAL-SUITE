/**
 * Absconder follow-up — Pending / Joined / last reminder.
 */
import { recruitNid } from './store.js'

const KEY = 'recruit:absconder-followups'

export type AbsconderFollow = {
  key: string
  status: 'pending' | 'joined'
  remindedAt: string
  terminatedAt?: string
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

export function absconderFollowKey(row: {
  employeeId?: string
  guardName?: string
  mobile?: string
}): string {
  return `${String(row.employeeId || '').trim().toLowerCase()}|${String(row.guardName || '').trim().toLowerCase()}|${String(row.mobile || '').replace(/\D/g, '').slice(-10)}`
}

export async function getAbsconderFollows(): Promise<AbsconderFollow[]> {
  const d = await redis(['GET', KEY])
  if (typeof d?.result !== 'string') return []
  try {
    const list = JSON.parse(d.result) as AbsconderFollow[]
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export async function saveAbsconderFollows(list: AbsconderFollow[]): Promise<boolean> {
  const r = await redis(['SET', KEY, JSON.stringify(list.slice(-4000))])
  return r?.result === 'OK'
}

export async function upsertAbsconderFollow(
  key: string,
  patch: Partial<Pick<AbsconderFollow, 'status' | 'remindedAt' | 'terminatedAt'>>,
): Promise<AbsconderFollow> {
  const list = await getAbsconderFollows()
  const now = new Date().toISOString()
  const i = list.findIndex((x) => x.key === key)
  const row: AbsconderFollow = {
    key: key || recruitNid('af'),
    status: patch.status || list[i]?.status || 'pending',
    remindedAt: patch.remindedAt ?? list[i]?.remindedAt ?? '',
    terminatedAt: patch.terminatedAt ?? list[i]?.terminatedAt ?? '',
    updatedAt: now,
  }
  if (i >= 0) list[i] = { ...list[i], ...row }
  else list.push(row)
  await saveAbsconderFollows(list)
  return row
}
