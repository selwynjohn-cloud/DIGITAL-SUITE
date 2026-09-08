/**
 * Security Job follow-up dates — stored only in this Redis book.
 * Keys: m:9876543210 · id:sj:… · rc:REGCODE
 * Empty values are ignored. Dates are never deleted.
 */

export const SJ_FOLLOWUP_DATE_FIELDS = [
  'call1At',
  'call2At',
  'call3At',
  'tentativeJoinDate',
  'joinedAt',
  'holdRemindOn',
] as const

export type SjFollowupDateField = (typeof SJ_FOLLOWUP_DATE_FIELDS)[number]
export type SjFollowupDates = Partial<Record<SjFollowupDateField, string>>
export type SjFollowupDateBook = Record<string, SjFollowupDates>
export type SjDateRefs = { phone?: string; id?: string; regCode?: string }

const BOOK_KEY = 'recruit:sj-followup-dates'
const PEOPLE_KEY = 'recruit:sj-date-people'

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

export function sjFollowupPhoneKey(phone: string): string {
  return String(phone || '').replace(/\D/g, '').slice(-10)
}

export function ymdFollowup(v: unknown): string {
  const s = String(v || '').trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  return ''
}

export function isSjFollowupDateField(field: string): field is SjFollowupDateField {
  return (SJ_FOLLOWUP_DATE_FIELDS as readonly string[]).includes(field)
}

function parseJson<T>(raw: unknown, fallback: T): T {
  if (!raw) return fallback
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as T
  if (typeof raw !== 'string') return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function sjPersonStoreKey(bookKey: string): string {
  if (bookKey.startsWith('m:')) return `recruit:sj-dates:${bookKey.slice(2)}`
  return `recruit:sj-dates:${bookKey}`
}

export function sjDateBookKeys(refs: SjDateRefs | null | undefined): string[] {
  const keys: string[] = []
  const mob = sjFollowupPhoneKey(String(refs?.phone || ''))
  if (mob.length >= 10) keys.push(`m:${mob}`)
  const id = String(refs?.id || '').trim()
  if (id) keys.push(`id:${id}`)
  const rc = String(refs?.regCode || '').trim()
  if (rc) keys.push(`rc:${rc}`)
  if (!keys.length) {
    const fallback = String(refs?.id || refs?.phone || refs?.regCode || '').trim()
    if (fallback) keys.push(`id:${fallback}`)
  }
  return [...new Set(keys)]
}

export function pickSjFollowupDates(row: Record<string, unknown> | null | undefined): SjFollowupDates {
  const out: SjFollowupDates = {}
  if (!row) return out
  for (const field of SJ_FOLLOWUP_DATE_FIELDS) {
    const iso = ymdFollowup(row[field])
    if (iso) out[field] = iso
  }
  return out
}

export function mergeSjFollowupDates(
  ...parts: Array<SjFollowupDates | Record<string, unknown> | null | undefined>
): SjFollowupDates {
  const out: SjFollowupDates = {}
  for (const part of parts) {
    const picked = pickSjFollowupDates(part as Record<string, unknown> | undefined)
    for (const field of SJ_FOLLOWUP_DATE_FIELDS) {
      const next = picked[field]
      if (next) out[field] = next
    }
  }
  return out
}

export function datesFromBook(refs: SjDateRefs, book: SjFollowupDateBook): SjFollowupDates {
  let out: SjFollowupDates = {}
  for (const key of sjDateBookKeys(refs)) {
    out = mergeSjFollowupDates(out, book[key])
  }
  return out
}

export async function loadSjFollowupDateBook(): Promise<SjFollowupDateBook> {
  const d = await redis(['GET', BOOK_KEY])
  const book = parseJson<SjFollowupDateBook>(d?.result, {})
  const out: SjFollowupDateBook = {}
  for (const [rawKey, dates] of Object.entries(book || {})) {
    const picked = pickSjFollowupDates(dates as Record<string, unknown>)
    if (!Object.keys(picked).length) continue
    out[rawKey] = picked
    const mob = sjFollowupPhoneKey(rawKey.startsWith('m:') ? rawKey.slice(2) : rawKey)
    if (mob.length >= 10) out[`m:${mob}`] = mergeSjFollowupDates(out[`m:${mob}`], picked)
  }
  return out
}

async function loadPersonDates(refs: SjDateRefs): Promise<SjFollowupDates> {
  const keys = sjDateBookKeys(refs)
  if (!keys.length) return {}
  const stores = keys.map(sjPersonStoreKey)
  const d = await redis(['MGET', ...stores])
  const arr = Array.isArray(d?.result) ? d.result : []
  let out: SjFollowupDates = {}
  for (const raw of arr) {
    out = mergeSjFollowupDates(out, parseJson<Record<string, unknown>>(raw, {}))
  }
  return out
}

export async function hydrateSjDatesFromPersonKeys(
  book: SjFollowupDateBook,
  refsList?: SjDateRefs[],
): Promise<SjFollowupDateBook> {
  const listed = await redis(['SMEMBERS', PEOPLE_KEY])
  const fromIndex = Array.isArray(listed?.result) ? listed.result.map((k) => String(k || '')) : []
  const scoped = new Set<string>()
  if (refsList) {
    for (const refs of refsList) {
      for (const k of sjDateBookKeys(refs)) scoped.add(k)
    }
  }
  const need: string[] = []
  const bookKeys: string[] = []
  const seen = new Set<string>()
  for (const k of fromIndex) {
    if (!k) continue
    if (scoped.size && !scoped.has(k)) continue
    if (book[k] && Object.keys(book[k]).length) continue
    const store = sjPersonStoreKey(k)
    if (seen.has(store)) continue
    seen.add(store)
    need.push(store)
    bookKeys.push(k)
  }
  if (!need.length) return book
  const out: SjFollowupDateBook = { ...book }
  for (let i = 0; i < need.length; i += 200) {
    const chunk = need.slice(i, i + 200)
    const chunkKeys = bookKeys.slice(i, i + 200)
    const d = await redis(['MGET', ...chunk])
    const arr = Array.isArray(d?.result) ? d.result : []
    for (let n = 0; n < chunkKeys.length; n++) {
      const picked = pickSjFollowupDates(parseJson<Record<string, unknown>>(arr[n], {}))
      if (!Object.keys(picked).length) continue
      const k = chunkKeys[n]
      out[k] = mergeSjFollowupDates(out[k], picked)
      const mob = sjFollowupPhoneKey(k.startsWith('m:') ? k.slice(2) : k)
      if (mob.length >= 10) out[`m:${mob}`] = mergeSjFollowupDates(out[`m:${mob}`], picked)
    }
  }
  return out
}

export async function rememberSjFollowupDates(
  refs: SjDateRefs,
  patch: SjFollowupDates | Record<string, unknown>,
): Promise<{ ok: boolean; dates: SjFollowupDates; error?: string }> {
  const picked = pickSjFollowupDates(patch)
  const keys = sjDateBookKeys(refs)
  if (!keys.length) {
    return { ok: false, dates: picked, error: 'Mobile number missing — cannot save this date.' }
  }
  if (!Object.keys(picked).length) {
    return { ok: true, dates: await loadPersonDates(refs) }
  }
  if (!redisConfig()) {
    return { ok: false, dates: picked, error: 'Date store is not connected.' }
  }
  const cur = mergeSjFollowupDates(await loadPersonDates(refs), picked)
  const payload = JSON.stringify(cur)
  let wrote = 0
  for (const key of keys) {
    const ok = await redis(['SET', sjPersonStoreKey(key), payload])
    if (ok) wrote += 1
  }
  if (wrote) await redis(['SADD', PEOPLE_KEY, ...keys])
  if (wrote) {
    try {
      const book = await loadSjFollowupDateBook()
      for (const key of keys) book[key] = mergeSjFollowupDates(book[key], cur)
      await redis(['SET', BOOK_KEY, JSON.stringify(book)])
    } catch {
      /* person key already keeps the date */
    }
    return { ok: true, dates: cur }
  }
  return { ok: false, dates: cur, error: 'Date could not be saved. Try again.' }
}

export function applySjFollowupDateBook<T extends SjDateRefs>(row: T, book: SjFollowupDateBook): T {
  const saved = datesFromBook(row, book)
  if (!Object.keys(saved).length) return row
  return { ...row, ...saved }
}

export function preserveSjFollowupDates<T extends Record<string, unknown>>(
  prev: Record<string, unknown> | null | undefined,
  next: T,
): T {
  return { ...next, ...mergeSjFollowupDates(prev, next) }
}
