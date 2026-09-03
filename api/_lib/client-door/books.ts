/**
 * Client Door books only — does not change Master Directory / Daily MIS.
 * HDFC · Canara · IDBI = one book per state. Other Apex clients = one book each.
 */
import { stateForMisBranch } from '../mis/hdfc-ssa-state.js'
import type { ClientDoorSite } from './lookup.js'

export const CLIENT_DOOR_STATEWISE_KEYS = ['hdfc', 'canara', 'idbi'] as const

export type ClientDoorBook = {
  id: string
  groupKey: string
  groupLabel: string
  name: string
  stateLabel: string
  siteCount: number
  sites: ClientDoorSite[]
  emails: string[]
  clientEmail: string
  lastOpenedAt?: string
  lastOpenedLabel?: string
}

const BOOK_EMAILS_KEY = 'agil:client-door:book-emails'

function slug(s: string): string {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'other'
}

export function isClientDoorStatewise(groupKey: string): boolean {
  return (CLIENT_DOOR_STATEWISE_KEYS as readonly string[]).includes(groupKey)
}

/**
 * Client Door only. Does not change Daily MIS or SSA.
 * Telangana = Hyderabad-A + Hyderabad-B (+ Hi-Tech City).
 * Andhra Pradesh = Vizag, Kakinada, Vijayawada, Nellore, Tirupati, Tada.
 */
export function clientDoorStateForBranch(branchName: string, branchId?: string): string {
  const hay = `${branchName || ''} ${branchId || ''}`
    .trim()
    .toLowerCase()
    .replace(/[_–]+/g, '-')
  if (/tadipatri/.test(hay)) return 'Andhra Pradesh'
  if (/\btada\b/.test(hay)) return 'Andhra Pradesh'
  if (/visakhapatnam|\bvizag\b/.test(hay)) return 'Andhra Pradesh'
  if (/kakinada/.test(hay)) return 'Andhra Pradesh'
  if (/vijayawada/.test(hay)) return 'Andhra Pradesh'
  if (/nellore/.test(hay)) return 'Andhra Pradesh'
  if (/tirupati|tirupathi/.test(hay)) return 'Andhra Pradesh'
  if (/hi-?tech|\bhitech\b/.test(hay)) return 'Telangana'
  if (/hyderabad/.test(hay)) return 'Telangana'
  return stateForMisBranch(branchName, branchId)
}

export function clientDoorBookId(site: ClientDoorSite): string {
  if (isClientDoorStatewise(site.groupKey)) {
    return `${site.groupKey}:${slug(clientDoorStateForBranch(site.branchName, site.branchId))}`
  }
  return site.groupKey
}

export function clientDoorBookName(site: ClientDoorSite): { name: string; stateLabel: string } {
  if (isClientDoorStatewise(site.groupKey)) {
    const state = clientDoorStateForBranch(site.branchName, site.branchId)
    return { name: `${site.groupLabel} — ${state}`, stateLabel: state }
  }
  return { name: site.groupLabel, stateLabel: 'All sites' }
}

export function clubSitesToBooks(sites: ClientDoorSite[]): ClientDoorBook[] {
  const map = new Map<string, ClientDoorBook>()
  for (const site of sites) {
    const id = clientDoorBookId(site)
    const { name, stateLabel } = clientDoorBookName(site)
    const prev = map.get(id)
    if (prev) {
      prev.sites.push(site)
      prev.siteCount = prev.sites.length
      continue
    }
    map.set(id, {
      id,
      groupKey: site.groupKey,
      groupLabel: site.groupLabel,
      name,
      stateLabel,
      siteCount: 1,
      sites: [site],
      emails: [],
      clientEmail: '',
    })
  }
  const out = [...map.values()]
  out.sort((a, b) => {
    const g = a.groupLabel.localeCompare(b.groupLabel)
    if (g) return g
    return a.stateLabel.localeCompare(b.stateLabel)
  })
  return out
}

/** Any matched site opens the full state / company book. */
export function expandMatchedSitesToBooks(
  matched: ClientDoorSite[],
  all: ClientDoorSite[],
): ClientDoorBook[] {
  if (!matched.length) return []
  const wanted = new Set(matched.map((s) => clientDoorBookId(s)))
  return clubSitesToBooks(all).filter((b) => wanted.has(b.id))
}

export function bookAsLetterSite(book: ClientDoorBook): ClientDoorSite {
  const first = book.sites[0]
  return {
    id: book.id,
    branchId: first?.branchId || '',
    branchName: book.stateLabel || first?.branchName || '',
    name: book.name,
    location: `${book.siteCount} site(s)`,
    clientEmail: book.emails.join(', '),
    emails: book.emails,
    groupKey: book.groupKey,
    groupLabel: book.groupLabel,
    lastOpenedAt: book.lastOpenedAt,
    lastOpenedLabel: book.lastOpenedLabel,
  }
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

const mem = () => {
  const g = globalThis as unknown as { __clientDoorBookEmails?: Record<string, string[]> }
  if (!g.__clientDoorBookEmails) g.__clientDoorBookEmails = {}
  return g.__clientDoorBookEmails
}

export async function loadBookEmailMap(): Promise<Record<string, string[]>> {
  const data = await redisCommand(['GET', BOOK_EMAILS_KEY])
  if (typeof data?.result === 'string' && data.result) {
    try {
      const parsed = JSON.parse(data.result) as Record<string, string[]>
      Object.assign(mem(), parsed)
      return parsed
    } catch {
      /* fall through */
    }
  }
  return { ...mem() }
}

export async function saveBookEmails(bookId: string, emails: string[]): Promise<string[]> {
  const id = String(bookId || '').trim()
  const unique = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter((e) => e.includes('@')))]
  if (!id) return unique
  const map = await loadBookEmailMap()
  map[id] = unique
  Object.assign(mem(), map)
  await redisCommand(['SET', BOOK_EMAILS_KEY, JSON.stringify(map)])
  return unique
}

export function siteIdsForBookEmail(all: ClientDoorSite[], email: string, bookEmails: Record<string, string[]>): string[] {
  const em = email.trim().toLowerCase()
  if (!em) return []
  const ids: string[] = []
  for (const site of all) {
    const bid = clientDoorBookId(site)
    if ((bookEmails[bid] || []).includes(em)) ids.push(site.id)
  }
  return ids
}
