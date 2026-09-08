/**
 * HDFC Facility Attendant compliance advisory acknowledgements — Redis.
 * One person (mobile) once. This list is what we submit to HDFC Bank.
 */

import { cityOnlyBranchName } from '../mis/branch-labels.js'
import { getBranches, nid } from '../mis/store.js'
import { faDigitsMobile, faIstYmd, listFaPublicBranches } from './fa-store.js'
import { advCopy, isAdvLang } from './fa-advisory-i18n.js'

const KEY = 'training:fa-advisory-ack:'
const INDEX_KEY = `${KEY}index`

export type FaAdvisoryAck = {
  id: string
  code: string
  name: string
  employeeId: string
  client: string
  branchId: string
  branchName: string
  hdfcSite: string
  mobile: string
  lang: string
  langName: string
  answers: Array<'yes' | 'no'>
  score: string
  gps: string
  accepted: boolean
  ymd: string
  submittedAt: string
  submittedAtIso: string
  device: string
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

export function faAdvisoryStorageOk(): boolean {
  return Boolean(redisConfig())
}

function monthOf(ymd: string): string {
  return String(ymd || '').slice(0, 7)
}

function bucketKey(branchId: string, month: string) {
  return `${KEY}${branchId}:${month}`
}

function branchLetters(branch: string): string {
  const letters = String(branch || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
  return (letters + 'XXX').slice(0, 3)
}

function datePart(ymd: string): string {
  const p = String(ymd || '').split('-')
  if (p.length === 3 && p[0].length === 4) return `${p[2]}-${p[1]}-${p[0]}`
  return String(ymd || '')
}

export function formatFaAdvCode(branch: string, seq: number, ymd: string): string {
  const n = Math.max(1, Math.floor(Number(seq) || 1))
  return `FA-ADV/${branchLetters(branch)}/${String(n).padStart(4, '0')}/${datePart(ymd)}`
}

async function loadIndex(): Promise<string[]> {
  const raw = await getJson<string[]>(INDEX_KEY, [])
  return Array.isArray(raw) ? raw.map((x) => String(x || '').trim()).filter(Boolean) : []
}

async function addToIndex(branchId: string): Promise<void> {
  const id = String(branchId || '').trim()
  if (!id) return
  const cur = await loadIndex()
  if (cur.includes(id)) return
  await setJson(INDEX_KEY, [...cur, id])
}

export async function loadFaAdvisoryAcks(branchId: string, month: string): Promise<FaAdvisoryAck[]> {
  const bid = String(branchId || '').trim()
  const mo = monthOf(month)
  if (!bid || !mo) return []
  const raw = await getJson<FaAdvisoryAck[]>(bucketKey(bid, mo), [])
  return Array.isArray(raw) ? raw : []
}

export async function listFaAdvisoryIndexBranchIds(): Promise<string[]> {
  return loadIndex()
}

export async function loadFaAdvisoryAcksRange(opts: {
  branchIds: string[]
  fromYmd: string
  toYmd: string
}): Promise<FaAdvisoryAck[]> {
  const from = String(opts.fromYmd || '').slice(0, 10)
  const to = String(opts.toYmd || '').slice(0, 10)
  const months = new Set<string>()
  if (from && to && from <= to) {
    let cur = from.slice(0, 7)
    const end = to.slice(0, 7)
    while (cur <= end) {
      months.add(cur)
      const [y, m] = cur.split('-').map(Number)
      cur = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
    }
  } else {
    months.add(monthOf(faIstYmd()))
  }
  const ids = [...new Set(opts.branchIds.map((x) => String(x || '').trim()).filter(Boolean))]
  const packs = await Promise.all(ids.flatMap((id) => [...months].map((mo) => loadFaAdvisoryAcks(id, mo))))
  return packs
    .flat()
    .filter((r) => {
      const d = String(r.ymd || '').slice(0, 10)
      if (from && d && d < from) return false
      if (to && d && d > to) return false
      return true
    })
    .sort((a, b) => String(b.submittedAtIso || '').localeCompare(String(a.submittedAtIso || '')))
}

export async function findFaAdvisoryByMobile(mobile: string): Promise<FaAdvisoryAck | null> {
  const mob = faDigitsMobile(mobile)
  if (mob.length !== 10) return null
  const ids = await loadIndex()
  const ymd = faIstYmd()
  const month = monthOf(ymd)
  const [y, m] = month.split('-').map(Number)
  const months = [
    month,
    m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`,
    m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`,
  ]
  for (const bid of ids) {
    for (const mo of months) {
      const rows = await loadFaAdvisoryAcks(bid, mo)
      const hit = rows.find((r) => faDigitsMobile(r.mobile) === mob)
      if (hit) return hit
    }
  }
  return null
}

export async function findFaAdvisoryById(
  id: string,
  hint?: { branchId?: string; ymd?: string },
): Promise<FaAdvisoryAck | null> {
  const want = String(id || '').trim()
  if (!want) return null
  const hintBid = String(hint?.branchId || '').trim()
  const hintYmd = String(hint?.ymd || '').slice(0, 10)
  if (hintBid && hintYmd) {
    const rows = await loadFaAdvisoryAcks(hintBid, monthOf(hintYmd))
    const hit = rows.find((r) => r.id === want)
    if (hit) return hit
  }
  const ids = hintBid ? [hintBid, ...(await loadIndex())] : await loadIndex()
  const month = monthOf(hintYmd || faIstYmd())
  const [y, m] = month.split('-').map(Number)
  const months = [
    month,
    m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`,
    m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`,
  ]
  for (const bid of [...new Set(ids)]) {
    for (const mo of months) {
      const rows = await loadFaAdvisoryAcks(bid, mo)
      const hit = rows.find((r) => r.id === want)
      if (hit) return hit
    }
  }
  return null
}

export async function saveFaAdvisoryAck(
  input: Omit<FaAdvisoryAck, 'id' | 'code'> & { id?: string; code?: string },
): Promise<FaAdvisoryAck> {
  const existing = await findFaAdvisoryByMobile(input.mobile)
  if (existing) return existing
  const ymd = String(input.ymd || faIstYmd()).slice(0, 10)
  const month = monthOf(ymd)
  const branchId = String(input.branchId || '').trim()
  const rows = await loadFaAdvisoryAcks(branchId, month)
  const seq = rows.length + 1
  const lang = isAdvLang(input.lang) ? input.lang : 'en'
  const rec: FaAdvisoryAck = {
    id: String(input.id || nid('fadv')).slice(0, 40),
    code: String(input.code || formatFaAdvCode(input.branchName || branchId, seq, ymd)),
    name: String(input.name || '').trim().slice(0, 80),
    employeeId: String(input.employeeId || '').trim().slice(0, 40),
    client: 'HDFC Bank',
    branchId,
    branchName: String(input.branchName || '').trim().slice(0, 80),
    hdfcSite: String(input.hdfcSite || '').trim().slice(0, 80),
    mobile: faDigitsMobile(input.mobile),
    lang,
    langName: String(input.langName || advCopy(lang).native).slice(0, 40),
    answers: Array.isArray(input.answers) ? input.answers.slice(0, 3) : [],
    score: String(input.score || '3/3').slice(0, 12),
    gps: String(input.gps || '').trim().slice(0, 80),
    accepted: true,
    ymd,
    submittedAt: String(input.submittedAt || '').slice(0, 80),
    submittedAtIso: String(input.submittedAtIso || new Date().toISOString()),
    device: String(input.device || '').slice(0, 240),
  }
  await setJson(bucketKey(branchId, month), [rec, ...rows])
  await addToIndex(branchId)
  return rec
}

export async function listFaAdvisoryPublicBranches() {
  return listFaPublicBranches()
}

export async function branchNameForFaAdvisory(branchId: string): Promise<string> {
  const branches = await getBranches(true)
  const hit = branches.find((b) => b.id === branchId)
  return hit ? cityOnlyBranchName(hit.name) || hit.name : ''
}
