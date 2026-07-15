import bcrypt from 'bcryptjs'

export type PinRecord = {
  hash: string
  role: 'staff' | 'management'
  appId: string
  attempts: number
}

const TTL_SECONDS = 900 // 15 minutes
const MAX_ATTEMPTS = 5

type DevEntry = PinRecord & { exp: number }

const devStore = () => {
  const g = globalThis as unknown as { __agilPinStore?: Map<string, DevEntry> }
  if (!g.__agilPinStore) g.__agilPinStore = new Map()
  return g.__agilPinStore
}

function pinKey(identifier: string, appId: string) {
  return `agil:pin:${identifier.toLowerCase()}:${appId}`
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
  const key = pinKey(identifier, appId)
  const payload = JSON.stringify(record)

  const result = await redisCommand(['SET', key, payload, 'EX', TTL_SECONDS])
  if (result?.result === 'OK') return

  const store = devStore()
  store.set(key, { ...record, exp: Date.now() + TTL_SECONDS * 1000 })
}

export async function deletePin(identifier: string, appId: string) {
  const key = pinKey(identifier, appId)
  await redisCommand(['DEL', key])
  devStore().delete(key)
}

export async function pinExists(identifier: string, appId: string): Promise<boolean> {
  const key = pinKey(identifier, appId)
  const data = await redisCommand(['GET', key])
  if (data?.result && typeof data.result === 'string') return true
  const entry = devStore().get(key)
  return !!(entry && entry.exp > Date.now())
}

export async function verifyPin(
  identifier: string,
  pin: string,
  appId: string,
): Promise<PinRecord | null> {
  return (await verifyPinDetailed(identifier, pin, appId)).record
}

export type PinVerifyFailure = 'missing' | 'wrong' | 'locked'

export async function verifyPinDetailed(
  identifier: string,
  pin: string,
  appId: string,
): Promise<{ record: PinRecord | null; failure?: PinVerifyFailure }> {
  const key = pinKey(identifier, appId)
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

  if (!record) return { record: null, failure: 'missing' }

  const valid = await bcrypt.compare(pin, record.hash)
  if (!valid) {
    record.attempts += 1
    if (record.attempts >= MAX_ATTEMPTS) {
      await deletePin(identifier, appId)
      return { record: null, failure: 'locked' }
    }
    await redisCommand(['SET', key, JSON.stringify(record), 'EX', TTL_SECONDS])
    return { record: null, failure: 'wrong' }
  }

  await deletePin(identifier, appId)
  return { record }
}

const PIN_COOLDOWN_SEC = 90

function pinSentKey(identifier: string, appId: string) {
  return `agil:pin:sent:${identifier.toLowerCase()}:${appId}`
}

/** True if a PIN was emailed recently — avoids duplicate mails from repeat clicks. */
export async function pinRecentlySent(identifier: string, appId: string): Promise<boolean> {
  const key = pinSentKey(identifier, appId)
  const data = await redisCommand(['GET', key])
  if (data?.result) return true
  const g = globalThis as unknown as { __agilPinSent?: Map<string, number> }
  if (!g.__agilPinSent) return false
  const exp = g.__agilPinSent.get(key)
  return !!(exp && exp > Date.now())
}

export async function markPinSent(identifier: string, appId: string) {
  const key = pinSentKey(identifier, appId)
  const result = await redisCommand(['SET', key, '1', 'EX', PIN_COOLDOWN_SEC])
  if (result?.result === 'OK') return
  const g = globalThis as unknown as { __agilPinSent?: Map<string, number> }
  if (!g.__agilPinSent) g.__agilPinSent = new Map()
  g.__agilPinSent.set(key, Date.now() + PIN_COOLDOWN_SEC * 1000)
}

export async function clearPinSent(identifier: string, appId: string) {
  const key = pinSentKey(identifier, appId)
  await redisCommand(['DEL', key])
  const g = globalThis as unknown as { __agilPinSent?: Map<string, number> }
  g.__agilPinSent?.delete(key)
}

function pinSendLockKey(identifier: string, appId: string) {
  return `agil:pin:lock:${identifier.toLowerCase()}:${appId}`
}

/** Prevents two parallel PIN requests from sending duplicate emails. */
export async function tryAcquirePinSendLock(identifier: string, appId: string): Promise<boolean> {
  const key = pinSendLockKey(identifier, appId)
  const result = await redisCommand(['SET', key, '1', 'NX', 'EX', 20])
  if (result?.result === 'OK') return true
  const g = globalThis as unknown as { __agilPinLocks?: Map<string, number> }
  if (!g.__agilPinLocks) g.__agilPinLocks = new Map()
  const exp = g.__agilPinLocks.get(key)
  if (exp && exp > Date.now()) return false
  g.__agilPinLocks.set(key, Date.now() + 20_000)
  return true
}

export async function releasePinSendLock(identifier: string, appId: string) {
  const key = pinSendLockKey(identifier, appId)
  await redisCommand(['DEL', key])
  const g = globalThis as unknown as { __agilPinLocks?: Map<string, number> }
  g.__agilPinLocks?.delete(key)
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
