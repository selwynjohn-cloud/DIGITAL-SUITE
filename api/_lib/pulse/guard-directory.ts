import { CARD_IMAGE_URL } from './config.js'
import { redisCommand } from './store.js'

const DIRECTORY_KEY = 'pulse:guards:directory'
const SITE_BASE = 'https://www.agilegroup-digital.co.in'
const LOOKUP_CACHE_MS = 6 * 60 * 60 * 1000

export type GuardProfile = {
  guardId: string
  name: string
  photoUrl: string
  source: 'mobile-api' | 'directory' | 'default'
}

export type GuardDirectoryEntry = {
  guardId: string
  name: string
  photoUrl: string
}

export function normaliseGuardId(raw: string): string {
  return String(raw ?? '').replace(/\D/g, '').slice(0, 20)
}

export function absoluteMediaUrl(url: string): string {
  const u = String(url ?? '').trim()
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  return u.startsWith('/') ? `${SITE_BASE}${u}` : `${SITE_BASE}/${u}`
}

function cacheKey(id: string): string {
  return `pulse:guards:lookup:${id}`
}

async function readLookupCache(id: string): Promise<GuardProfile | null> {
  const d = await redisCommand(['GET', cacheKey(id)])
  if (!d?.result || typeof d.result !== 'string') return null
  try {
    const p = JSON.parse(d.result) as GuardProfile & { ts?: number }
    if (!p?.guardId || !p.ts || Date.now() - p.ts > LOOKUP_CACHE_MS) return null
    return { guardId: p.guardId, name: p.name, photoUrl: p.photoUrl, source: p.source }
  } catch {
    return null
  }
}

async function writeLookupCache(profile: GuardProfile): Promise<void> {
  await redisCommand(['SET', cacheKey(profile.guardId), JSON.stringify({ ...profile, ts: Date.now() }), 'EX', 21600])
}

function pickPhoto(obj: Record<string, unknown>): string {
  const keys = ['photoUrl', 'photo_url', 'photo', 'image', 'imageUrl', 'profilePhoto', 'profile_photo', 'picture', 'avatar']
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  const data = obj.data
  if (data && typeof data === 'object') return pickPhoto(data as Record<string, unknown>)
  const guard = obj.guard
  if (guard && typeof guard === 'object') return pickPhoto(guard as Record<string, unknown>)
  return ''
}

function pickName(obj: Record<string, unknown>, fallback = ''): string {
  const keys = ['name', 'guardName', 'guard_name', 'fullName', 'full_name']
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  const data = obj.data
  if (data && typeof data === 'object') return pickName(data as Record<string, unknown>, fallback)
  const guard = obj.guard
  if (guard && typeof guard === 'object') return pickName(guard as Record<string, unknown>, fallback)
  return fallback
}

/**
 * Look up Agile guard from your mobile app API.
 * Set in Vercel when API is ready:
 *   MOBILE_GUARD_API_URL = https://your-api/guard/{id}   ({id} replaced with guard ID)
 *   MOBILE_GUARD_API_KEY = optional bearer token
 */
async function fetchFromMobileApi(id: string): Promise<GuardProfile | null> {
  const template = process.env.MOBILE_GUARD_API_URL?.trim()
  if (!template) return null

  const url = template.includes('{id}')
    ? template.replace(/\{id\}/g, encodeURIComponent(id))
    : `${template.replace(/\/$/, '')}/${encodeURIComponent(id)}`

  const headers: Record<string, string> = { Accept: 'application/json' }
  const key = process.env.MOBILE_GUARD_API_KEY?.trim()
  if (key) headers.Authorization = `Bearer ${key}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(url, { headers, signal: controller.signal })
    if (!res.ok) return null
    const data = (await res.json().catch(() => null)) as Record<string, unknown> | null
    if (!data || typeof data !== 'object') return null
    const photo = pickPhoto(data)
    if (!photo) return null
    return {
      guardId: id,
      name: pickName(data),
      photoUrl: absoluteMediaUrl(photo),
      source: 'mobile-api',
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function loadDirectory(): Promise<Record<string, GuardDirectoryEntry>> {
  const d = await redisCommand(['GET', DIRECTORY_KEY])
  if (!d?.result || typeof d.result !== 'string') return {}
  try {
    const obj = JSON.parse(d.result) as Record<string, GuardDirectoryEntry>
    return obj && typeof obj === 'object' ? obj : {}
  } catch {
    return {}
  }
}

async function fromDirectory(id: string): Promise<GuardProfile | null> {
  const map = await loadDirectory()
  const row = map[id]
  if (!row?.photoUrl?.trim()) return null
  return {
    guardId: id,
    name: row.name,
    photoUrl: absoluteMediaUrl(row.photoUrl),
    source: 'directory',
  }
}

export async function lookupGuard(rawId: string): Promise<GuardProfile | null> {
  const id = normaliseGuardId(rawId)
  if (!id) return null

  const cached = await readLookupCache(id)
  if (cached?.photoUrl) return cached

  const fromApi = await fetchFromMobileApi(id)
  if (fromApi?.photoUrl) {
    await writeLookupCache(fromApi)
    return fromApi
  }

  const fromDir = await fromDirectory(id)
  if (fromDir?.photoUrl) {
    await writeLookupCache(fromDir)
    return fromDir
  }

  return null
}

/** WhatsApp card image — Agile Guard photo only when ID is verified via mobile API / directory. */
export async function cardImageForGuardId(rawId?: string): Promise<{ url: string; agileGuard: boolean }> {
  if (!rawId?.trim()) return { url: CARD_IMAGE_URL, agileGuard: false }
  const g = await lookupGuard(rawId)
  if (g?.photoUrl) return { url: g.photoUrl, agileGuard: true }
  return { url: CARD_IMAGE_URL, agileGuard: false }
}

export async function upsertDirectoryEntry(entry: GuardDirectoryEntry): Promise<boolean> {
  const id = normaliseGuardId(entry.guardId)
  if (!id) return false
  const map = await loadDirectory()
  map[id] = { guardId: id, name: String(entry.name ?? '').slice(0, 80), photoUrl: String(entry.photoUrl ?? '').trim() }
  const r = await redisCommand(['SET', DIRECTORY_KEY, JSON.stringify(map)])
  return r?.result === 'OK'
}

export async function listDirectory(): Promise<GuardDirectoryEntry[]> {
  const map = await loadDirectory()
  return Object.values(map).sort((a, b) => a.guardId.localeCompare(b.guardId))
}

export function mobileGuardApiConfigured(): boolean {
  return Boolean(process.env.MOBILE_GUARD_API_URL?.trim())
}
