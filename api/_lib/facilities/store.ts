/**
 * Agile Facilities — Redis store (prefix fac:).
 */

import type { FacLease, FacProperty, FacTaxItem, FacWorkOrder } from './types.js'

const PREFIX = 'fac:'
const KEYS = {
  properties: `${PREFIX}properties`,
  leases: `${PREFIX}leases`,
  taxes: `${PREFIX}taxes`,
  workOrders: `${PREFIX}work-orders`,
}

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url, token } : null
}

export function facStorageOk(): boolean {
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

export function facNid(p: string): string {
  return `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export async function getFacProperties(): Promise<FacProperty[]> {
  return getJson(KEYS.properties, [])
}
export async function saveFacProperties(rows: FacProperty[]): Promise<boolean> {
  return setJson(KEYS.properties, rows.slice(0, 2000))
}
export async function upsertFacProperty(row: FacProperty): Promise<void> {
  const all = await getFacProperties()
  const i = all.findIndex((x) => x.id === row.id)
  if (i >= 0) all[i] = row
  else all.unshift(row)
  await saveFacProperties(all)
}

export async function getFacLeases(): Promise<FacLease[]> {
  return getJson(KEYS.leases, [])
}
export async function saveFacLeases(rows: FacLease[]): Promise<boolean> {
  return setJson(KEYS.leases, rows.slice(0, 2000))
}
export async function upsertFacLease(row: FacLease): Promise<void> {
  const all = await getFacLeases()
  const i = all.findIndex((x) => x.id === row.id)
  if (i >= 0) all[i] = row
  else all.unshift(row)
  await saveFacLeases(all)
}

export async function getFacTaxes(): Promise<FacTaxItem[]> {
  return getJson(KEYS.taxes, [])
}
export async function saveFacTaxes(rows: FacTaxItem[]): Promise<boolean> {
  return setJson(KEYS.taxes, rows.slice(0, 2000))
}
export async function upsertFacTax(row: FacTaxItem): Promise<void> {
  const all = await getFacTaxes()
  const i = all.findIndex((x) => x.id === row.id)
  if (i >= 0) all[i] = row
  else all.unshift(row)
  await saveFacTaxes(all)
}

export async function getFacWorkOrders(): Promise<FacWorkOrder[]> {
  return getJson(KEYS.workOrders, [])
}
export async function saveFacWorkOrders(rows: FacWorkOrder[]): Promise<boolean> {
  return setJson(KEYS.workOrders, rows.slice(0, 2000))
}
export async function upsertFacWorkOrder(row: FacWorkOrder): Promise<void> {
  const all = await getFacWorkOrders()
  const i = all.findIndex((x) => x.id === row.id)
  if (i >= 0) all[i] = row
  else all.unshift(row)
  await saveFacWorkOrders(all)
}

/** Next property code FAC-#### */
export async function nextFacPropertyCode(): Promise<string> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  let n = Math.floor(Math.random() * 900) + 100
  if (url && token) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(['INCR', `${PREFIX}seq:property`]),
      })
      const d = (await res.json()) as { result?: unknown }
      n = Number(d?.result) || n
    } catch {
      /* keep random */
    }
  }
  return `FAC-${String(n).padStart(4, '0')}`
}
