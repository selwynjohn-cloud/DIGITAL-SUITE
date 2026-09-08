/**
 * Referral Incentives — continuing yes/no flags + monthly Director mail.
 * Redis: recruit:referral-incentive-flags
 */

import { recruitNid } from './store.js'

const KEY = 'recruit:referral-incentive-flags'

export type ReferralIncentiveFlag = {
  id: string
  continuing: 'yes' | 'no'
  updatedAt: string
  updatedBy: string
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

export async function getReferralIncentiveFlags(): Promise<Record<string, ReferralIncentiveFlag>> {
  const d = await redis(['GET', KEY])
  if (typeof d?.result !== 'string') return {}
  try {
    const list = JSON.parse(d.result) as ReferralIncentiveFlag[]
    const map: Record<string, ReferralIncentiveFlag> = {}
    for (const row of list || []) {
      if (row?.id) map[row.id] = row
    }
    return map
  } catch {
    return {}
  }
}

export async function saveReferralIncentiveFlag(
  id: string,
  continuing: 'yes' | 'no',
  updatedBy: string,
): Promise<boolean> {
  const map = await getReferralIncentiveFlags()
  map[id] = {
    id: String(id || recruitNid('ri')).slice(0, 120),
    continuing,
    updatedAt: new Date().toISOString(),
    updatedBy: String(updatedBy || '').slice(0, 120),
  }
  const list = Object.values(map).slice(0, 20000)
  const r = await redis(['SET', KEY, JSON.stringify(list)])
  return r?.result === 'OK'
}
