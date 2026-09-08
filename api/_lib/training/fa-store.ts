/**
 * Facility Attendant Banking Safety acknowledgements — Redis.
 */

import { cityOnlyBranchName } from '../mis/branch-labels.js'
import { getBranches, nid, type MisBranch } from '../mis/store.js'
import { isTrainingDepartmentBranch } from './ojt-training-dept.js'

const KEY = 'training:fa-ack:'
const INDEX_KEY = `${KEY}index`

export type FaAck = {
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

export function faStorageOk(): boolean {
  return Boolean(redisConfig())
}

export function faIstYmd(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(now)
  let dd = '00'
  let mo = '00'
  let yy = ''
  for (const p of parts) {
    if (p.type === 'day') dd = p.value
    if (p.type === 'month') mo = p.value
    if (p.type === 'year') yy = p.value
  }
  return `${yy}-${mo}-${dd}`
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

export function formatFaCode(branch: string, seq: number, ymd: string): string {
  const n = Math.max(1, Math.floor(Number(seq) || 1))
  return `FA/${branchLetters(branch)}/${String(n).padStart(4, '0')}/${datePart(ymd)}`
}

function digitsMobile(v: string): string {
  const d = String(v || '').replace(/\D/g, '')
  return d.length === 12 && d.startsWith('91') ? d.slice(2) : d.slice(-10)
}

function leftoverCombinedHyderabad(name: string): boolean {
  const n = cityOnlyBranchName(name)
  return /^hyderabad$/i.test(n) && !/hyderabad-[ab]/i.test(name)
}

export async function listFaPublicBranches(): Promise<Array<{ id: string; name: string }>> {
  const all = await getBranches(true)
  return all
    .filter((b) => b.active !== false)
    .filter((b) => !isTrainingDepartmentBranch(b))
    .filter((b) => !leftoverCombinedHyderabad(b.name))
    .map((b) => ({ id: b.id, name: cityOnlyBranchName(b.name) || b.name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function isFaPublicBranch(b: Pick<MisBranch, 'id' | 'name'>): boolean {
  if (isTrainingDepartmentBranch(b)) return false
  if (leftoverCombinedHyderabad(b.name)) return false
  return true
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

export async function loadFaAcks(branchId: string, month: string): Promise<FaAck[]> {
  const bid = String(branchId || '').trim()
  const mo = monthOf(month)
  if (!bid || !mo) return []
  const raw = await getJson<FaAck[]>(bucketKey(bid, mo), [])
  return Array.isArray(raw) ? raw : []
}

export async function loadFaAcksRange(opts: {
  branchIds: string[]
  fromYmd: string
  toYmd: string
}): Promise<FaAck[]> {
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
  const packs = await Promise.all(ids.flatMap((id) => [...months].map((mo) => loadFaAcks(id, mo))))
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

export async function findFaAckToday(mobile: string, ymd = faIstYmd()): Promise<FaAck | null> {
  const mob = digitsMobile(mobile)
  if (mob.length !== 10) return null
  const month = monthOf(ymd)
  const ids = await loadIndex()
  for (const id of ids) {
    const rows = await loadFaAcks(id, month)
    const hit = rows.find((r) => digitsMobile(r.mobile) === mob && r.ymd === ymd)
    if (hit) return hit
  }
  return null
}

export async function findFaAckById(
  id: string,
  hint?: { branchId?: string; ymd?: string },
): Promise<FaAck | null> {
  const want = String(id || '').trim()
  if (!want) return null
  const hintBid = String(hint?.branchId || '').trim()
  const hintYmd = String(hint?.ymd || '').slice(0, 10)
  if (hintBid && hintYmd) {
    const rows = await loadFaAcks(hintBid, monthOf(hintYmd))
    const hit = rows.find((r) => r.id === want)
    if (hit) return hit
  }
  const ids = hintBid ? [hintBid, ...(await loadIndex())] : await loadIndex()
  const month = monthOf(hintYmd || faIstYmd())
  const months = [month]
  const [y, m] = month.split('-').map(Number)
  months.push(m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`)
  months.push(m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`)
  for (const bid of [...new Set(ids)]) {
    for (const mo of months) {
      const rows = await loadFaAcks(bid, mo)
      const hit = rows.find((r) => r.id === want)
      if (hit) return hit
    }
  }
  return null
}

export async function saveFaAck(input: Omit<FaAck, 'id' | 'code'> & { id?: string; code?: string }): Promise<FaAck> {
  const ymd = String(input.ymd || faIstYmd()).slice(0, 10)
  const month = monthOf(ymd)
  const branchId = String(input.branchId || '').trim()
  const rows = await loadFaAcks(branchId, month)
  const existing = rows.find((r) => digitsMobile(r.mobile) === digitsMobile(input.mobile) && r.ymd === ymd)
  if (existing) return existing
  const seq = rows.length + 1
  const rec: FaAck = {
    id: String(input.id || nid('fa')).slice(0, 40),
    code: String(input.code || formatFaCode(input.branchName || branchId, seq, ymd)),
    name: String(input.name || '').trim().slice(0, 80),
    employeeId: String(input.employeeId || '').trim().slice(0, 40),
    client: 'HDFC Bank',
    branchId,
    branchName: String(input.branchName || '').trim().slice(0, 80),
    hdfcSite: String(input.hdfcSite || '').trim().slice(0, 80),
    mobile: digitsMobile(input.mobile),
    lang: String(input.lang || 'en').slice(0, 8),
    langName: String(input.langName || 'English').slice(0, 40),
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

export async function listFaIndexBranchIds(): Promise<string[]> {
  return loadIndex()
}

export function faDigitsMobile(v: string): string {
  return digitsMobile(v)
}
