/**
 * Work360 gzadmin API client (token + Excel report blobs).
 */

const TIMEOUT_MS = 20_000

export type Work360Config = {
  apiBaseUrl: string
  tenantId: string
  username: string
  password: string
}

export function work360Config(): Work360Config | null {
  const apiBaseUrl = process.env.WORK360_API_BASE_URL?.trim()
  const tenantId = process.env.WORK360_TENANT_ID?.trim()
  const username = process.env.WORK360_USERNAME?.trim()
  const password = process.env.WORK360_PASSWORD?.trim()
  if (!apiBaseUrl || !tenantId || !username || !password) return null
  return { apiBaseUrl: apiBaseUrl.replace(/\/$/, ''), tenantId, username, password }
}

let cachedToken: { token: string; at: number } | null = null

export async function work360Token(cfg: Work360Config, force = false): Promise<string> {
  if (!force && cachedToken && Date.now() - cachedToken.at < 25 * 60_000) return cachedToken.token

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${cfg.apiBaseUrl}/v1/token/generate-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tenantid': cfg.tenantId },
      body: JSON.stringify({ username: cfg.username, password: cfg.password }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Work360 login failed (${res.status})`)
    const data = (await res.json()) as { token?: string }
    if (!data.token) throw new Error('Work360 login did not return a token')
    cachedToken = { token: data.token, at: Date.now() }
    return data.token
  } finally {
    clearTimeout(timer)
  }
}

export async function work360FetchBlob(
  cfg: Work360Config,
  path: string,
  params: Record<string, string>,
): Promise<ArrayBuffer> {
  const token = await work360Token(cfg)
  const qs = new URLSearchParams(params).toString()
  const url = `${cfg.apiBaseUrl}${path}${qs ? `?${qs}` : ''}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'x-tenantid': cfg.tenantId },
      signal: controller.signal,
    })
    if (res.status === 401) {
      const token2 = await work360Token(cfg, true)
      const res2 = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token2}`, 'x-tenantid': cfg.tenantId },
        signal: controller.signal,
      })
      if (!res2.ok) throw new Error(`Work360 report ${path} returned ${res2.status}`)
      return res2.arrayBuffer()
    }
    if (!res.ok) throw new Error(`Work360 report ${path} returned ${res.status}`)
    return res.arrayBuffer()
  } finally {
    clearTimeout(timer)
  }
}

/** Single calendar day — ISO YYYY-MM-DD for both from and to (Report Portal format). */
export function work360DateParams(date: string): Record<string, string> {
  const d = date.trim().slice(0, 10)
  return { fromDateStr: d, toDateStr: d }
}

/** Work360 report portal date inputs often use DD-MM-YYYY. */
export function isoToWork360Date(iso: string): string {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`
}

export async function work360FetchJson<T>(
  cfg: Work360Config,
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const token = await work360Token(cfg)
  const qs = params ? `?${new URLSearchParams(params).toString()}` : ''
  const url = `${cfg.apiBaseUrl}${path}${qs}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'x-tenantid': cfg.tenantId, Accept: 'application/json' },
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Work360 API ${path} returned ${res.status}`)
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

export type Work360Client = { id: number | string; name?: string }

export async function work360ListClients(cfg: Work360Config): Promise<Work360Client[]> {
  const data = await work360FetchJson<Work360Client[] | { data?: Work360Client[] }>(cfg, '/v1/clients')
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.data)) return data.data
  return []
}

export async function work360ListUnits(cfg: Work360Config, clientId: string): Promise<Work360Client[]> {
  const data = await work360FetchJson<Work360Client[] | { data?: Work360Client[] }>(cfg, '/v1/units', {
    parentId: clientId,
  })
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.data)) return data.data
  return []
}
