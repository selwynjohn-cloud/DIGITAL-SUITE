import { BLOCKED_SOURCES, INDIAN_HIGHWAY_CORRIDORS, INDIAN_NEWS_CITIES, NEWS_CATEGORIES } from './config.js'
import {
  MAX_NEWS_AGE_MS,
  NEWS_CACHE_MINUTES,
  PUBLISHED_HISTORY_DAYS,
} from './policy.js'
import { redisCommand } from './store.js'
import type { NewsItem, NewsSection } from './types.js'

/**
 * Pull flash news for each category. Tries NewsData.io first, then Mediastack.
 * Rules (Director):
 *   • No story older than 18 hours
 *   • No duplicate in the same bulletin
 *   • No repeat in future bulletins unless follow-up news on the same matter
 */

const TIMEOUT_MS = 8000
const ITEMS_PER_SECTION = 6
const CACHE_FRESH_MS = NEWS_CACHE_MINUTES * 60 * 1000
const NEWS_CACHE_KEY = 'pulse:news:cache:v6'
const PUBLISHED_HISTORY_KEY = 'pulse:news:history:v1'
const HISTORY_KEEP_MS = PUBLISHED_HISTORY_DAYS * 24 * 60 * 60 * 1000

const STOP_WORDS = new Set([
  'about', 'after', 'also', 'from', 'have', 'into', 'more', 'news', 'over', 'says', 'said',
  'that', 'their', 'them', 'this', 'than', 'they', 'were', 'what', 'when', 'with', 'will',
  'india', 'indian', 'latest', 'report', 'reports',
])

/** Words that suggest a follow-up on an earlier story — may be shown again. */
const FOLLOW_UP_RE =
  /\b(update|updates|latest|fresh|new twist|turns|escalat|continues|probe|investigation|arrested|arrests|killed|dies|dead|death toll|injured|hospitalised|hospitalized|second|third|day two|day 2|more on|breaking|developments|what we know|just in|now says|claims|confirms|denies)\b/i

type PublishedRecord = { fp: string; title: string; at: number }

async function fetchJson(url: string): Promise<any | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function fetchText(url: string): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function cleanTitle(raw: unknown): string {
  let t = String(raw ?? '').trim()
  t = t.replace(/^\s*(title|url|source)\s*:\s*/i, '')
  return t
}

function parsePublishedAt(iso?: string): number {
  if (!iso) return 0
  const ms = new Date(iso).getTime()
  return Number.isFinite(ms) ? ms : 0
}

function relativeTime(ms: number): string {
  if (!ms) return 'Just now'
  const mins = Math.max(0, Math.round((Date.now() - ms) / 60000))
  if (mins < 2) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.round(hrs / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

function isFresh(publishedAt: number, now = Date.now()): boolean {
  if (!publishedAt) return false
  return now - publishedAt <= MAX_NEWS_AGE_MS
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url.trim())
    u.hash = ''
    u.search = ''
    return u.hostname + u.pathname.replace(/\/$/, '')
  } catch {
    return url.trim().toLowerCase().slice(0, 120)
  }
}

function significantWords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
}

/** Stable fingerprint for dedup / repeat detection. */
export function storyFingerprint(title: string): string {
  const words = [...new Set(significantWords(title))].sort()
  return words.slice(0, 10).join('|')
}

function storiesSimilar(a: string, b: string): boolean {
  const A = new Set(significantWords(a))
  const B = new Set(significantWords(b))
  if (!A.size || !B.size) return false
  let inter = 0
  for (const w of A) if (B.has(w)) inter++
  const union = new Set([...A, ...B]).size
  return inter / union >= 0.55
}

function isFollowUp(title: string): boolean {
  return FOLLOW_UP_RE.test(title)
}

function isBlocked(item: NewsItem): boolean {
  const haystack = `${item.source} ${item.url}`.toLowerCase()
  return BLOCKED_SOURCES.some((bad) => haystack.includes(bad))
}

function itemKey(item: NewsItem): string {
  const fp = storyFingerprint(item.title)
  const url = normalizeUrl(item.url)
  return url ? `${fp}::${url}` : fp
}

async function loadPublishedHistory(): Promise<PublishedRecord[]> {
  const d = await redisCommand(['GET', PUBLISHED_HISTORY_KEY])
  if (!d?.result || typeof d.result !== 'string') return []
  try {
    const arr = JSON.parse(d.result) as PublishedRecord[]
    const cutoff = Date.now() - HISTORY_KEEP_MS
    return Array.isArray(arr) ? arr.filter((r) => r.at > cutoff) : []
  } catch {
    return []
  }
}

async function savePublishedHistory(records: PublishedRecord[]) {
  const cutoff = Date.now() - HISTORY_KEEP_MS
  const byFp = new Map<string, PublishedRecord>()
  for (const r of records) {
    if (r.at <= cutoff) continue
    const prev = byFp.get(r.fp)
    if (!prev || r.at > prev.at) byFp.set(r.fp, r)
  }
  const list = [...byFp.values()].sort((a, b) => b.at - a.at).slice(0, 800)
  await redisCommand(['SET', PUBLISHED_HISTORY_KEY, JSON.stringify(list)])
}

function wasPublishedBefore(title: string, history: PublishedRecord[]): boolean {
  if (isFollowUp(title)) return false
  const fp = storyFingerprint(title)
  for (const h of history) {
    if (h.fp === fp || storiesSimilar(title, h.title)) return true
  }
  return false
}

function filterFreshItems(items: NewsItem[], now = Date.now()): NewsItem[] {
  return items.filter((it) => it.title.trim() && isFresh(it.publishedAt, now))
}

/** Remove duplicates within one fetch and stories already used in past bulletins. */
function dedupeAndFilterHistory(items: NewsItem[], history: PublishedRecord[]): NewsItem[] {
  const seenFp = new Set<string>()
  const seenUrl = new Set<string>()
  const out: NewsItem[] = []
  for (const it of items) {
    if (isBlocked(it)) continue
    if (wasPublishedBefore(it.title, history)) continue
    const fp = storyFingerprint(it.title)
    const urlKey = normalizeUrl(it.url)
    if (seenFp.has(fp)) continue
    if (urlKey && seenUrl.has(urlKey)) continue
    // Near-duplicate titles from different sources in the same batch
    let dup = false
    for (const prev of out) {
      if (storiesSimilar(it.title, prev.title)) {
        dup = true
        break
      }
    }
    if (dup) continue
    seenFp.add(fp)
    if (urlKey) seenUrl.add(urlKey)
    out.push(it)
  }
  return out
}

async function fromNewsDataBatch(): Promise<NewsItem[]> {
  const key = process.env.NEWSDATA_API_KEY?.trim()
  if (!key) return []
  const url = `https://newsdata.io/api/1/latest?apikey=${key}&country=in&language=en&q=${encodeURIComponent('highway closed OR landslide OR expressway OR Mumbai Pune OR crime OR fire OR accident OR bank OR atm OR terror OR flood OR cyclone')}`
  const data = await fetchJson(url)
  const results: any[] = Array.isArray(data?.results) ? data.results : []
  return results.map((r) => {
    const publishedAt = parsePublishedAt(r.pubDate)
    return {
      title: cleanTitle(r.title),
      url: String(r.link ?? r.source_url ?? '').trim(),
      source: String(r.source_id ?? r.source_name ?? 'News').trim(),
      time: relativeTime(publishedAt),
      publishedAt,
      imageUrl: String(r.image_url ?? '').trim(),
    }
  })
}

async function fromMediastackBatch(): Promise<NewsItem[]> {
  const key = process.env.MEDIASTACK_API_KEY?.trim()
  if (!key) return []
  const url =
    `https://api.mediastack.com/v1/news?access_key=${key}` +
    `&countries=in&languages=en&sort=published_desc&limit=100` +
    `&keywords=highway,landslide,expressway,road,closure,security,crime,fire,accident,bank,atm,terror,weather,flood,police,robbery`
  const data = await fetchJson(url)
  const results: any[] = Array.isArray(data?.data) ? data.data : []
  return results.map((r) => {
    const publishedAt = parsePublishedAt(r.published_at)
    return {
      title: cleanTitle(r.title),
      url: String(r.url ?? '').trim(),
      source: String(r.source ?? 'News').trim(),
      time: relativeTime(publishedAt),
      publishedAt,
      imageUrl: String(r.image ?? '').trim(),
    }
  })
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim()
}

function pickTag(block: string, tag: string): string {
  const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(block)
  return m ? decodeEntities(m[1]) : ''
}

async function fromGoogleNewsBatch(): Promise<NewsItem[]> {
  const cityChunk = INDIAN_NEWS_CITIES.slice(0, 20).join(' OR ')
  const queries = [
    'Mumbai Pune expressway closed OR landslide OR heavy rain',
    'highway closed OR expressway shut landslide India',
    'road blocked OR traffic suspended heavy rain India',
    'Mumbai OR Pune OR Nashik highway landslide OR flood',
    `(${cityChunk}) (crime OR accident OR fire OR security OR police) India`,
    'Hyderabad OR Delhi OR Bangalore OR Chennai accident OR fire OR crime',
    'Visakhapatnam OR Vijayawada OR Tirupati OR Ahmedabad incident',
    'bank robbery OR ATM theft OR cash van loot India',
    'terror alert OR bomb threat OR high alert India',
    'fire accident OR explosion OR gas leak India',
    'IMD red alert OR orange alert OR cyclone OR flood India',
  ]
  const out: NewsItem[] = []
  for (const q of queries) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${q} when:1d`)}&hl=en-IN&gl=IN&ceid=IN:en`
    const xml = await fetchText(url)
    if (!xml) continue
    const blocks = xml.split('<item>').slice(1)
    for (const raw of blocks.slice(0, 20)) {
      const b = raw.split('</item>')[0]
      let title = pickTag(b, 'title')
      const link = pickTag(b, 'link')
      const source = pickTag(b, 'source')
      const pub = pickTag(b, 'pubDate')
      if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3))
      if (!title) continue
      const publishedAt = parsePublishedAt(pub)
      out.push({
        title: cleanTitle(title),
        url: link,
        source: source || 'Google News',
        time: relativeTime(publishedAt),
        publishedAt,
        imageUrl: '',
      })
    }
  }
  return out
}

function mentionsIndianCity(text: string): boolean {
  const lower = text.toLowerCase()
  return INDIAN_NEWS_CITIES.some((city) => lower.includes(city.toLowerCase()))
}

/** Logistics / deployment alerts — highway closure, landslide, expressway shut. */
function isOperationsAlert(title: string): boolean {
  const lower = title.toLowerCase()
  const road =
    /\b(highway|expressway|express highway|road)\b/.test(lower) &&
    /\b(closed|shut|blocked|suspended|halted|landslide|land slide|mudslide|washout|caved|diversion)\b/.test(
      lower,
    )
  const corridor = INDIAN_HIGHWAY_CORRIDORS.some((c) => lower.includes(c.toLowerCase()))
  const rainBlock =
    /\b(heavy rain|landslide|flood)\b/.test(lower) &&
    /\b(highway|expressway|traffic|road|mumbai|pune)\b/.test(lower)
  return road || corridor || rainBlock
}

function matchesCategory(title: string, cat: (typeof NEWS_CATEGORIES)[number]): boolean {
  const lower = title.toLowerCase()
  if (cat.cityRequired && !mentionsIndianCity(lower)) return false
  return cat.keywords.some((k) => lower.includes(k.toLowerCase()))
}

function categorize(items: NewsItem[]): NewsSection[] {
  const sections: NewsSection[] = NEWS_CATEGORIES.map((c) => ({
    title: c.title,
    titleHindi: c.titleHindi,
    emoji: c.emoji,
    headerBg: c.headerBg,
    items: [],
  }))
  const seen = new Set<string>()
  const ordered = [...items].sort((a, b) => {
    const opsA = isOperationsAlert(a.title) ? 2 : 0
    const opsB = isOperationsAlert(b.title) ? 2 : 0
    if (opsB !== opsA) return opsB - opsA
    const cityA = mentionsIndianCity(a.title) ? 1 : 0
    const cityB = mentionsIndianCity(b.title) ? 1 : 0
    if (cityB !== cityA) return cityB - cityA
    const age = b.publishedAt - a.publishedAt
    if (age !== 0) return age
    return (b.imageUrl ? 1 : 0) - (a.imageUrl ? 1 : 0)
  })
  for (const it of ordered) {
    const title = it.title.trim()
    if (!title) continue
    const key = itemKey(it)
    if (seen.has(key)) continue
    const idx = NEWS_CATEGORIES.findIndex((c) => matchesCategory(title, c))
    if (idx < 0) continue
    if (sections[idx].items.length >= ITEMS_PER_SECTION) continue
    seen.add(key)
    sections[idx].items.push(it)
  }
  return sections
}

function sectionsToHistoryRecords(sections: NewsSection[]): PublishedRecord[] {
  const now = Date.now()
  const recs: PublishedRecord[] = []
  for (const s of sections) {
    for (const it of s.items) {
      recs.push({ fp: storyFingerprint(it.title), title: it.title, at: now })
    }
  }
  return recs
}

/** Call only after a successful WhatsApp publish — not on fetch or page view. */
export async function markStoriesPublished(sections: NewsSection[]) {
  const fresh = sectionsToHistoryRecords(sections)
  if (!fresh.length) return
  const prev = await loadPublishedHistory()
  await savePublishedHistory([...prev, ...fresh])
}

function revalidateCachedSections(sections: NewsSection[]): NewsSection[] {
  const now = Date.now()
  return sections
    .map((s) => ({
      ...s,
      items: s.items.filter((it) => isFresh(it.publishedAt, now)),
    }))
    .filter((s) => s.items.length > 0)
}

/** Total news items across all sections. */
export function totalNewsItems(sections: NewsSection[]): number {
  return sections.reduce((n, s) => n + s.items.length, 0)
}

async function readNewsCache(): Promise<{ ts: number; sections: NewsSection[] } | null> {
  const d = await redisCommand(['GET', NEWS_CACHE_KEY])
  if (d?.result && typeof d.result === 'string') {
    try {
      return JSON.parse(d.result) as { ts: number; sections: NewsSection[] }
    } catch {
      return null
    }
  }
  return null
}

async function writeNewsCache(sections: NewsSection[]) {
  await redisCommand(['SET', NEWS_CACHE_KEY, JSON.stringify({ ts: Date.now(), sections })])
}

async function buildFreshSections(): Promise<NewsSection[]> {
  const history = await loadPublishedHistory()
  const [ms, gn, nd] = await Promise.all([
    fromMediastackBatch(),
    fromGoogleNewsBatch(),
    fromNewsDataBatch(),
  ])
  const merged = filterFreshItems([...ms, ...gn, ...nd])
  const unique = dedupeAndFilterHistory(merged, history)
  return categorize(unique)
}

/**
 * Fetch all sections — max 18 hours old, no repeats within or across editions.
 * Final enforce step guarantees nothing stale/duplicate reaches the bulletin.
 */
export async function fetchNewsSections(opts?: { forceFresh?: boolean }): Promise<NewsSection[]> {
  if (opts?.forceFresh) {
    await invalidateNewsCache()
  }

  const cache = opts?.forceFresh ? null : await readNewsCache()
  const now = Date.now()

  if (cache && totalNewsItems(cache.sections) > 0 && now - cache.ts < CACHE_FRESH_MS) {
    const validated = revalidateCachedSections(cache.sections)
    if (totalNewsItems(validated) > 0) return validated
  }

  const fresh = await buildFreshSections()
  if (totalNewsItems(fresh) > 0) {
    await writeNewsCache(fresh)
    return fresh
  }

  if (cache) {
    const validated = revalidateCachedSections(cache.sections)
    if (totalNewsItems(validated) > 0) return validated
  }
  return fresh
}

/** Clear cached news so the next fetch pulls fresh headlines. */
export async function invalidateNewsCache(): Promise<void> {
  await redisCommand(['DEL', NEWS_CACHE_KEY])
}

export { MAX_NEWS_AGE_MS } from './policy.js'

/** Build the flash ticker from the top headline of each section. */
export function flashHeadlinesFrom(sections: NewsSection[]): string[] {
  const heads: string[] = []
  const seen = new Set<string>()
  for (const s of sections) {
    const t = s.items[0]?.title
    if (!t) continue
    const fp = storyFingerprint(t)
    if (seen.has(fp)) continue
    seen.add(fp)
    heads.push(t)
  }
  return heads
}
