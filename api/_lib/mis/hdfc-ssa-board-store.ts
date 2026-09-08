/**
 * HDFC SSA State dashboard — Redis: AI pack + public view code (not in git).
 */
import { randomBytes } from 'node:crypto'

const AI_KEY = 'mis:hdfc-ssa-board-ai'
const VIEW_KEY = 'mis:hdfc-ssa-board-view'

export type HdfcSsaBoardAiPack = {
  updatedAt: string
  letters: Record<string, string>
  conclusions: Record<string, string>
}

export type HdfcSsaBoardView = {
  code: string
  createdAt: string
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

async function getJson<T>(key: string, fallback: T): Promise<T> {
  const d = await redis(['GET', key])
  if (d?.result && typeof d.result === 'string') {
    try {
      return JSON.parse(d.result) as T
    } catch {
      return fallback
    }
  }
  return fallback
}

async function setJson(key: string, value: unknown): Promise<boolean> {
  const d = await redis(['SET', key, JSON.stringify(value)])
  return d?.result === 'OK'
}

export function emptyHdfcSsaBoardAi(): HdfcSsaBoardAiPack {
  return { updatedAt: '', letters: {}, conclusions: {} }
}

export async function getHdfcSsaBoardAi(): Promise<HdfcSsaBoardAiPack> {
  const raw = await getJson<Partial<HdfcSsaBoardAiPack>>(AI_KEY, {})
  return {
    updatedAt: String(raw.updatedAt || ''),
    letters: raw.letters && typeof raw.letters === 'object' ? raw.letters : {},
    conclusions: raw.conclusions && typeof raw.conclusions === 'object' ? raw.conclusions : {},
  }
}

export async function saveHdfcSsaBoardAi(pack: HdfcSsaBoardAiPack): Promise<boolean> {
  return setJson(AI_KEY, pack)
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function newHdfcSsaBoardViewCode(): string {
  const bytes = randomBytes(8)
  return [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
}

export function normHdfcSsaBoardViewCode(v: string): string {
  return String(v || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 16)
}

export async function getHdfcSsaBoardView(): Promise<HdfcSsaBoardView | null> {
  const raw = await getJson<Partial<HdfcSsaBoardView>>(VIEW_KEY, {})
  const code = normHdfcSsaBoardViewCode(String(raw.code || ''))
  if (code.length < 6) return null
  return { code, createdAt: String(raw.createdAt || '') }
}

export async function ensureHdfcSsaBoardViewCode(): Promise<HdfcSsaBoardView> {
  const existing = await getHdfcSsaBoardView()
  if (existing) return existing
  const next: HdfcSsaBoardView = {
    code: newHdfcSsaBoardViewCode(),
    createdAt: new Date().toISOString(),
  }
  await setJson(VIEW_KEY, next)
  return next
}

export function viewCodesMatch(given: string, stored: string): boolean {
  const a = normHdfcSsaBoardViewCode(given)
  const b = normHdfcSsaBoardViewCode(stored)
  if (!a || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
