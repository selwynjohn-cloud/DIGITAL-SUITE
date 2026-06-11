import bcrypt from 'bcryptjs'

export type PinRecord = {
  hash: string
  role: 'staff' | 'management'
  appId: string
  attempts: number
}

const TTL_SECONDS = 600 // 10 minutes
const MAX_ATTEMPTS = 5

type DevEntry = PinRecord & { exp: number }

const devStore = () => {
  const g = globalThis as unknown as { __agilPinStore?: Map<string, DevEntry> }
  if (!g.__agilPinStore) g.__agilPinStore = new Map()
  return g.__agilPinStore
}

function pinKey(email: string) {
  return `agil:pin:${email.toLowerCase()}`
}

async function redisFetch(path: string, init?: RequestInit) {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  const res = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })
  return res
}

export async function savePin(
  email: string,
  pin: string,
  role: 'staff' | 'management',
  appId: string,
) {
  const hash = await bcrypt.hash(pin, 10)
  const record: PinRecord = { hash, role, appId, attempts: 0 }
  const key = pinKey(email)

  const res = await redisFetch(`/set/${encodeURIComponent(key)}/${TTL_SECONDS}`, {
    method: 'POST',
    body: JSON.stringify(record),
  })

  if (res?.ok) return

  const store = devStore()
  store.set(key, { ...record, exp: Date.now() + TTL_SECONDS * 1000 })
}

export async function verifyPin(email: string, pin: string): Promise<PinRecord | null> {
  const key = pinKey(email)
  let record: PinRecord | null = null

  const res = await redisFetch(`/get/${encodeURIComponent(key)}`)
  if (res?.ok) {
    const data = (await res.json()) as { result?: string | null }
    if (data.result) record = JSON.parse(data.result) as PinRecord
  } else {
    const entry = devStore().get(key)
    if (entry && entry.exp > Date.now()) {
      record = entry
    }
  }

  if (!record) return null

  const valid = await bcrypt.compare(pin, record.hash)
  if (!valid) {
    record.attempts += 1
    if (record.attempts >= MAX_ATTEMPTS) {
      await deletePin(email)
    } else if (process.env.UPSTASH_REDIS_REST_URL) {
      await redisFetch(`/set/${encodeURIComponent(key)}/${TTL_SECONDS}`, {
        method: 'POST',
        body: JSON.stringify(record),
      })
    }
    return null
  }

  await deletePin(email)
  return record
}

async function deletePin(email: string) {
  const key = pinKey(email)
  await redisFetch(`/del/${encodeURIComponent(key)}`, { method: 'POST' })
  devStore().delete(key)
}

export function pinStorageStatus() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (url && token) return { ok: true as const }
  if (process.env.NODE_ENV !== 'production') return { ok: true as const, dev: true as const }
  const missing: string[] = []
  if (!url) missing.push('UPSTASH_REDIS_REST_URL')
  if (!token) missing.push('UPSTASH_REDIS_REST_TOKEN')
  return { ok: false as const, missing }
}

export function hasPinStorage() {
  return pinStorageStatus().ok
}
