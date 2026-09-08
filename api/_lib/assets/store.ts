/**
 * Agile Assets — Redis store (prefix aa:).
 */

import type { AaAsset, AaMaintTicket, AaTransfer, AaWriteOff } from './types.js'

const PREFIX = 'aa:'
const KEYS = {
  assets: `${PREFIX}assets`,
  transfers: `${PREFIX}transfers`,
  maint: `${PREFIX}maint`,
  writeoffs: `${PREFIX}writeoffs`,
}

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url, token } : null
}

export function aaStorageOk(): boolean {
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
      /* ignore */
    }
  }
  return fallback
}

async function setJson(key: string, value: unknown): Promise<boolean> {
  const r = await redis(['SET', key, JSON.stringify(value)])
  return r?.result === 'OK'
}

export function aaNid(p: string): string {
  return `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export async function nextAaAssetCode(): Promise<string> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  let n = Math.floor(Math.random() * 9000) + 1000
  if (url && token) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(['INCR', `${PREFIX}seq:asset`]),
      })
      const d = (await res.json()) as { result?: unknown }
      n = Number(d?.result) || n
    } catch {
      /* keep */
    }
  }
  return `AA-${String(n).padStart(5, '0')}`
}

export async function getAaAssets(): Promise<AaAsset[]> {
  return getJson(KEYS.assets, [])
}
export async function saveAaAssets(rows: AaAsset[]): Promise<boolean> {
  return setJson(KEYS.assets, rows.slice(0, 5000))
}
export async function upsertAaAsset(row: AaAsset): Promise<void> {
  const all = await getAaAssets()
  const i = all.findIndex((x) => x.id === row.id)
  if (i >= 0) all[i] = row
  else all.unshift(row)
  await saveAaAssets(all)
}

export async function getAaTransfers(): Promise<AaTransfer[]> {
  return getJson(KEYS.transfers, [])
}
export async function saveAaTransfers(rows: AaTransfer[]): Promise<boolean> {
  return setJson(KEYS.transfers, rows.slice(0, 3000))
}
export async function upsertAaTransfer(row: AaTransfer): Promise<void> {
  const all = await getAaTransfers()
  const i = all.findIndex((x) => x.id === row.id)
  if (i >= 0) all[i] = row
  else all.unshift(row)
  await saveAaTransfers(all)
}

export async function getAaMaint(): Promise<AaMaintTicket[]> {
  return getJson(KEYS.maint, [])
}
export async function saveAaMaint(rows: AaMaintTicket[]): Promise<boolean> {
  return setJson(KEYS.maint, rows.slice(0, 3000))
}
export async function upsertAaMaint(row: AaMaintTicket): Promise<void> {
  const all = await getAaMaint()
  const i = all.findIndex((x) => x.id === row.id)
  if (i >= 0) all[i] = row
  else all.unshift(row)
  await saveAaMaint(all)
}

export async function getAaWriteOffs(): Promise<AaWriteOff[]> {
  return getJson(KEYS.writeoffs, [])
}
export async function saveAaWriteOffs(rows: AaWriteOff[]): Promise<boolean> {
  return setJson(KEYS.writeoffs, rows.slice(0, 2000))
}
export async function upsertAaWriteOff(row: AaWriteOff): Promise<void> {
  const all = await getAaWriteOffs()
  const i = all.findIndex((x) => x.id === row.id)
  if (i >= 0) all[i] = row
  else all.unshift(row)
  await saveAaWriteOffs(all)
}
