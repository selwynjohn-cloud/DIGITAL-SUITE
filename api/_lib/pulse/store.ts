import { DEFAULT_EDITORIAL } from './config.js'
import type { EditorialContent } from './types.js'

/**
 * Persistent storage for the Agile Pulse admin content, using Upstash Redis
 * (the same database the login system uses). Content and uploaded photos are
 * saved here so they are remembered permanently and shown back in the admin
 * portal for editing.
 */

const EDITORIAL_KEY = 'pulse:editorial'
const IMAGE_PREFIX = 'pulse:img:'

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url, token } : null
}

export function storageStatus(): { ok: boolean; missing: string[] } {
  const missing: string[] = []
  if (!process.env.UPSTASH_REDIS_REST_URL?.trim()) missing.push('UPSTASH_REDIS_REST_URL')
  if (!process.env.UPSTASH_REDIS_REST_TOKEN?.trim()) missing.push('UPSTASH_REDIS_REST_TOKEN')
  return { ok: missing.length === 0, missing }
}

export async function redisCommand(command: unknown[]): Promise<{ result?: unknown } | null> {
  const cfg = redisConfig()
  if (!cfg) return null
  try {
    const res = await fetch(cfg.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
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

/** Local alias kept for readability inside this module. */
const redis = redisCommand

function normalise(raw: unknown): EditorialContent {
  const data = (raw ?? {}) as Partial<EditorialContent>
  return {
    events: Array.isArray(data.events) ? data.events : [],
    jobImages: Array.isArray(data.jobImages) ? data.jobImages.slice(0, 3) : [],
    guards: Array.isArray(data.guards) ? data.guards.slice(0, 3) : [],
  }
}

/** Read saved editorial content. Falls back to defaults if nothing saved yet. */
export async function getEditorial(): Promise<EditorialContent> {
  const data = await redis(['GET', EDITORIAL_KEY])
  if (data?.result && typeof data.result === 'string') {
    try {
      return normalise(JSON.parse(data.result))
    } catch {
      return DEFAULT_EDITORIAL
    }
  }
  return DEFAULT_EDITORIAL
}

/** Save editorial content permanently. Returns false if storage unavailable. */
export async function saveEditorial(content: EditorialContent): Promise<boolean> {
  const payload = JSON.stringify(normalise(content))
  const result = await redis(['SET', EDITORIAL_KEY, payload])
  return result?.result === 'OK'
}

/** Save an uploaded image (data URL). Returns the image id, or null on failure. */
export async function saveImage(dataUrl: string): Promise<string | null> {
  if (!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(dataUrl)) return null
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  const result = await redis(['SET', `${IMAGE_PREFIX}${id}`, dataUrl])
  return result?.result === 'OK' ? id : null
}

/** Fetch a stored image data URL by id. */
export async function getImage(id: string): Promise<string | null> {
  const safe = id.replace(/[^a-z0-9]/gi, '')
  if (!safe) return null
  const data = await redis(['GET', `${IMAGE_PREFIX}${safe}`])
  return data?.result && typeof data.result === 'string' ? data.result : null
}
