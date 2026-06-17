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

function pinKey(identifier: string) {
  return `agil:pin:${identifier.toLowerCase()}`
}

export function normalizeMobile(mobile: string) {
  const d = String(mobile || '').replace(/\D/g, '')
  if (d.length === 10) return d
  if (d.length === 12 && d.startsWith('91')) return d.slice(2)
  return ''
}

async function redisCommand(command: unknown[]) {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return null

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    })
    if (!res.ok) return null
    return (await res.json()) as { result?: unknown }
  } catch {
    return null
  }
}

export async function savePin(
  identifier: string,
  pin: string,
  role: 'staff' | 'management',
  appId: string,
) {
  const hash = await bcrypt.hash(pin, 10)
  const record: PinRecord = { hash, role, appId, attempts: 0 }
  const key = pinKey(identifier)
  const payload = JSON.stringify(record)

  const result = await redisCommand(['SET', key, payload, 'EX', TTL_SECONDS])
  if (result?.result === 'OK') return

  const store = devStore()
  store.set(key, { ...record, exp: Date.now() + TTL_SECONDS * 1000 })
}

export async function verifyPin(identifier: string, pin: string): Promise<PinRecord | null> {
  const key = pinKey(identifier)
  let record: PinRecord | null = null

  const data = await redisCommand(['GET', key])
  if (data?.result && typeof data.result === 'string') {
    record = JSON.parse(data.result) as PinRecord
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
      await deletePin(identifier)
    } else {
      await redisCommand(['SET', key, JSON.stringify(record), 'EX', TTL_SECONDS])
    }
    return null
  }

  await deletePin(identifier)
  return record
}

async function deletePin(identifier: string) {
  const key = pinKey(identifier)
  await redisCommand(['DEL', key])
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
