/**
 * Guards Data — branch-wise people roster for iCloud / daily backup.
 * Folders: by-branch/<Branch>/roster.csv
 * Columns: Sl.No | Name | Contact Mobile | Email | Date of Birth | Age
 * Sources: SecurityJob interest + Recruitment pipeline adds.
 * Independent ops branches kept separate (Nellore ≠ Tada, Vizag ≠ Kakinada, etc.).
 */

import { CITY_OPTIONS, getApplicants, type SjApplicant } from '../securityjob/store.js'
import { getGuards, type GuardApplicant } from '../recruitment/store.js'
import { redisCommand } from '../pulse/store.js'

/** Map messy free-text locations → one clean city folder name. */
const CITY_ALIASES: Record<string, string> = {
  bangalore: 'Bengaluru',
  bengaluru: 'Bengaluru',
  'bangalore karnataka': 'Bengaluru',
  hyd: 'Hyderabad',
  hyderabad: 'Hyderabad',
  'hyderabad telangana': 'Hyderabad',
  mumbai: 'Mumbai',
  'mumbai maharashtra': 'Mumbai',
  bombay: 'Mumbai',
  ahmedabad: 'Ahmedabad',
  'ahmedabad gujarat': 'Ahmedabad',
  guwahati: 'Guwahati',
  'guwahati assam': 'Guwahati',
  lucknow: 'Lucknow',
  'lucknow up': 'Lucknow',
  'lucknow uttar pradesh': 'Lucknow',
  visakhapatnam: 'Visakhapatnam',
  vizag: 'Visakhapatnam',
  'visakhapatnam ap': 'Visakhapatnam',
  'visakhapatnam andhra pradesh': 'Visakhapatnam',
  pune: 'Pune',
  'pune maharashtra': 'Pune',
  delhi: 'Delhi',
  'new delhi': 'Delhi',
  'delhi ncr': 'Delhi',
  guntur: 'Guntur',
  vijayawada: 'Vijayawada',
  warangal: 'Warangal',
  bhopal: 'Bhopal',
  chandigarh: 'Chandigarh',
  kochi: 'Kochi',
  cochin: 'Kochi',
  madurai: 'Madurai',
  patna: 'Patna',
  other: 'Other',
  'any location': 'Other',
  'any location flexible': 'Other',
  flexible: 'Other',
  अन्य: 'Other',
  katihar: 'Patna', // nearest Bihar ops hub for roster grouping
}

export function canonicalizeCity(raw: string): string {
  let s = String(raw || '')
    .trim()
    .replace(/[\/\\?%*:|"<>]/g, ' ')
    .replace(/\s+/g, ' ')
  if (!s) return 'Other'
  // strip state after comma: "Hyderabad, Telangana" → "Hyderabad"
  const beforeComma = s.split(',')[0].trim()
  const key = beforeComma
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097f\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (CITY_ALIASES[key]) return CITY_ALIASES[key]
  // match official city list
  const hit = CITY_OPTIONS.find((c) => c.city.toLowerCase() === key || c.city.toLowerCase() === s.toLowerCase())
  if (hit) return hit.city
  // partial: city name contained in text
  const partial = CITY_OPTIONS.find((c) => key.includes(c.city.toLowerCase()) || c.city.toLowerCase().includes(key))
  if (partial && key.length >= 3) return partial.city
  if (/flexible|any location|other|अन्य/i.test(s)) return 'Other'
  // keep unknown but tidy first segment
  return beforeComma
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ')
    .trim() || 'Other'
}

/** Clean person name for roster (drop junk like "8"). */
export function cleanPersonName(raw: string): string {
  let s = String(raw || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!s) return ''
  if (/^\d+$/.test(s)) return ''
  if (s.length < 2) return ''
  // Title-case Latin words; leave mixed scripts as trimmed
  if (/^[a-zA-Z\s.'.-]+$/.test(s)) {
    s = s
      .toLowerCase()
      .split(' ')
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
      .join(' ')
      .trim()
  }
  return s.slice(0, 80)
}

/** Ops branches used for Guards Data folders (kept independent — no A&B combining). */
export const GUARDS_OPS_BRANCHES = [
  'Visakhapatnam',
  'Kakinada',
  'Nellore',
  'Tada',
  'Tirupati',
  'Tadipatri',
  'Bangalore',
  'Gulbarga',
  'Hyderabad',
  'Hyderabad-A',
  'Hyderabad-B',
  'Hi-Tech City',
  'Vijayawada',
  'Chennai',
  'Puducherry',
  'Mumbai',
  'Surat',
  'Kochi',
  'Bhopal',
  'Corporate Office',
  'Other',
] as const

/** Map city / free-text / recruit branchId → one ops branch folder. */
const BRANCH_ALIASES: Record<string, string> = {
  visakhapatnam: 'Visakhapatnam',
  vizag: 'Visakhapatnam',
  'visakhapatnam ap': 'Visakhapatnam',
  'visakhapatnam andhra pradesh': 'Visakhapatnam',
  'visakhapatnam kakinada': 'Visakhapatnam', // do not auto-merge; prefer Vizag label only when both named
  kakinada: 'Kakinada',
  nellore: 'Nellore',
  'nellore tada': 'Nellore',
  tada: 'Tada',
  tirupati: 'Tirupati',
  'tirupati tadipatri': 'Tirupati',
  tadipatri: 'Tadipatri',
  bangalore: 'Bangalore',
  bengaluru: 'Bangalore',
  'bangalore karnataka': 'Bangalore',
  gulbarga: 'Gulbarga',
  kalaburagi: 'Gulbarga',
  hyderabad: 'Hyderabad',
  'hyderabad telangana': 'Hyderabad',
  'hyderabad a': 'Hyderabad-A',
  'hyderabad-a': 'Hyderabad-A',
  'hyderabad b': 'Hyderabad-B',
  'hyderabad-b': 'Hyderabad-B',
  'hi tech city': 'Hi-Tech City',
  'hi-tech city': 'Hi-Tech City',
  hitech: 'Hi-Tech City',
  vijayawada: 'Vijayawada',
  guntur: 'Vijayawada',
  warangal: 'Hyderabad',
  chennai: 'Chennai',
  'chennai pondicherry': 'Chennai',
  'chennai puducherry': 'Chennai',
  puducherry: 'Puducherry',
  pondicherry: 'Puducherry',
  mumbai: 'Mumbai',
  'mumbai maharashtra': 'Mumbai',
  bombay: 'Mumbai',
  'mumbai surat': 'Mumbai',
  surat: 'Surat',
  kochi: 'Kochi',
  cochin: 'Kochi',
  bhopal: 'Bhopal',
  'corporate office': 'Corporate Office',
  corporate: 'Corporate Office',
  other: 'Other',
  'any location': 'Other',
  'any location flexible': 'Other',
  flexible: 'Other',
  अन्य: 'Other',
  // remote SJ cities → Other (no local Agile ops branch folder)
  ahmedabad: 'Other',
  delhi: 'Other',
  'new delhi': 'Other',
  lucknow: 'Other',
  guwahati: 'Other',
  chandigarh: 'Other',
  madurai: 'Chennai',
  pune: 'Mumbai',
  patna: 'Other',
  katihar: 'Other',
}

export function canonicalizeBranch(raw: string): string {
  let s = String(raw || '')
    .trim()
    .replace(/[\/\\?%*:|"<>]/g, ' ')
    .replace(/\s+/g, ' ')
  if (!s) return 'Other'
  const beforeComma = s.split(',')[0].trim()
  const key = beforeComma
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9\u0900-\u097f\s-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (BRANCH_ALIASES[key]) return BRANCH_ALIASES[key]
  const exact = GUARDS_OPS_BRANCHES.find((b) => b.toLowerCase() === key || b.toLowerCase() === s.toLowerCase())
  if (exact) return exact
  // city first, then map city → branch
  const city = canonicalizeCity(s)
  const cityKey = city.toLowerCase()
  if (BRANCH_ALIASES[cityKey]) return BRANCH_ALIASES[cityKey]
  if (/flexible|any location|other|अन्य/i.test(s)) return 'Other'
  return 'Other'
}

export type GuardsDataRow = {
  slNo: number
  branch: string
  city: string
  name: string
  mobile: string
  email: string
  dob: string
  age: number | ''
  source: 'securityjob' | 'recruitment'
  sourceId: string
  registeredAt: string
}

export type GuardsDataSnapshot = {
  updatedAt: string
  total: number
  branches: string[]
  byBranch: Record<string, GuardsDataRow[]>
  /** @deprecated alias of branches — kept for older callers */
  cities: string[]
  /** @deprecated alias of byBranch */
  byCity: Record<string, GuardsDataRow[]>
  all: GuardsDataRow[]
}

const SNAPSHOT_KEY = 'guards-data:roster'
const LEDGER_KEY_PREFIX = 'guards-data:daily:'

export const GUARDS_DATA_COLUMNS = [
  'Sl.No',
  'Name',
  'Contact Mobile',
  'Email',
  'Date of Birth',
  'Age',
] as const

/** Age in completed years from YYYY-MM-DD (IST calendar day). */
export function ageFromDob(dob: string, asOf = new Date()): number | '' {
  const m = String(dob || '')
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return ''
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return ''
  const ist = new Date(asOf.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  let age = ist.getFullYear() - y
  const hadBirthday = ist.getMonth() + 1 > mo || (ist.getMonth() + 1 === mo && ist.getDate() >= d)
  if (!hadBirthday) age -= 1
  if (age < 0 || age > 120) return ''
  return age
}

export function normalizeDobInput(raw: string): string {
  const s = String(raw || '').trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/)
  if (dmy) {
    const dd = dmy[1].padStart(2, '0')
    const mm = dmy[2].padStart(2, '0')
    return `${dmy[3]}-${mm}-${dd}`
  }
  return ''
}

export function normalizeMobile(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '')
  if (digits.length >= 10) return digits.slice(-10)
  return digits
}

export function cityFolderName(city: string): string {
  return canonicalizeBranch(city)
}

export function branchFolderName(branch: string): string {
  return canonicalizeBranch(branch)
}

function scoreRow(r: Omit<GuardsDataRow, 'slNo'>): number {
  let n = 0
  if (r.email) n += 2
  if (r.dob) n += 2
  if (r.name) n += 1
  if (r.branch && r.branch !== 'Other') n += 1
  return n
}

function fromSecurityJob(a: SjApplicant): Omit<GuardsDataRow, 'slNo'> {
  const dob = normalizeDobInput(String((a as SjApplicant & { dob?: string }).dob || ''))
  const city = canonicalizeCity(a.location || 'Other')
  return {
    branch: canonicalizeBranch(a.location || city),
    city,
    name: cleanPersonName(a.name),
    mobile: normalizeMobile(a.phone),
    email: String((a as SjApplicant & { email?: string }).email || '')
      .trim()
      .toLowerCase(),
    dob,
    age: ageFromDob(dob),
    source: 'securityjob',
    sourceId: a.id,
    registeredAt: String(a.createdAt || ''),
  }
}

function fromRecruitment(g: GuardApplicant): Omit<GuardsDataRow, 'slNo'> {
  const dob = normalizeDobInput(String((g as GuardApplicant & { dob?: string }).dob || ''))
  const branch = canonicalizeBranch(g.branchId || 'Other')
  return {
    branch,
    city: branch,
    name: cleanPersonName(g.name),
    mobile: normalizeMobile(g.mobile),
    email: String((g as GuardApplicant & { email?: string }).email || '')
      .trim()
      .toLowerCase(),
    dob,
    age: ageFromDob(dob),
    source: 'recruitment',
    sourceId: g.id,
    registeredAt: String(g.createdAt || ''),
  }
}

/** Merge SecurityJob + Recruitment; one row per mobile (keep richest). */
export function mergeGuardsDataPeople(
  applicants: SjApplicant[],
  guards: GuardApplicant[],
): Omit<GuardsDataRow, 'slNo'>[] {
  const map = new Map<string, Omit<GuardsDataRow, 'slNo'>>()
  const put = (row: Omit<GuardsDataRow, 'slNo'>) => {
    if (!row.name || !row.mobile) return
    const key = row.mobile
    const prev = map.get(key)
    if (!prev || scoreRow(row) >= scoreRow(prev)) map.set(key, row)
  }
  for (const a of applicants) put(fromSecurityJob(a))
  for (const g of guards) {
    if (g.active === false) continue
    put(fromRecruitment(g))
  }
  return Array.from(map.values()).sort((a, b) => {
    const c = a.branch.localeCompare(b.branch, undefined, { sensitivity: 'base' })
    if (c) return c
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  })
}

export function buildGuardsDataSnapshot(
  applicants: SjApplicant[],
  guards: GuardApplicant[],
): GuardsDataSnapshot {
  const merged = mergeGuardsDataPeople(applicants, guards)
  const byBranch: Record<string, GuardsDataRow[]> = {}
  for (const row of merged) {
    const branch = branchFolderName(row.branch || row.city)
    if (!byBranch[branch]) byBranch[branch] = []
    byBranch[branch].push({ ...row, branch, slNo: byBranch[branch].length + 1 })
  }
  const branches = Object.keys(byBranch).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  const all: GuardsDataRow[] = []
  let n = 0
  for (const branch of branches) {
    for (const row of byBranch[branch]) {
      n += 1
      all.push({ ...row, slNo: n })
    }
  }
  return {
    updatedAt: new Date().toISOString(),
    total: all.length,
    branches,
    byBranch,
    cities: branches,
    byCity: byBranch,
    all,
  }
}

export function csvEscape(v: unknown): string {
  return `"${String(v ?? '').replace(/"/g, '""')}"`
}

/** Branch file columns only (Sl.No local to that branch). */
export function cityRosterToCsv(rows: GuardsDataRow[]): string {
  return branchRosterToCsv(rows)
}

export function branchRosterToCsv(rows: GuardsDataRow[]): string {
  const header = GUARDS_DATA_COLUMNS.map(csvEscape).join(',')
  const body = rows
    .map((r) =>
      [r.slNo, r.name, r.mobile, r.email, r.dob, r.age === '' ? '' : r.age].map(csvEscape).join(','),
    )
    .join('\n')
  return `${header}\n${body}\n`
}

/** Master file includes Branch column after Sl.No. */
export function allRosterToCsv(rows: GuardsDataRow[]): string {
  const header = ['Sl.No', 'Branch', 'Name', 'Contact Mobile', 'Email', 'Date of Birth', 'Age']
    .map(csvEscape)
    .join(',')
  const body = rows
    .map((r) =>
      [r.slNo, r.branch || r.city, r.name, r.mobile, r.email, r.dob, r.age === '' ? '' : r.age]
        .map(csvEscape)
        .join(','),
    )
    .join('\n')
  return `${header}\n${body}\n`
}

export async function rebuildGuardsDataRoster(): Promise<GuardsDataSnapshot> {
  const [applicants, guards] = await Promise.all([getApplicants(), getGuards()])
  const snap = buildGuardsDataSnapshot(applicants, guards)
  try {
    await redisCommand(['SET', SNAPSHOT_KEY, JSON.stringify(snap)])
  } catch {
    /* best-effort */
  }
  return snap
}

export async function getGuardsDataSnapshot(): Promise<GuardsDataSnapshot | null> {
  try {
    const res = await redisCommand(['GET', SNAPSHOT_KEY])
    const raw = res?.result
    if (!raw || typeof raw !== 'string') return null
    return JSON.parse(raw) as GuardsDataSnapshot
  } catch {
    return null
  }
}

export function istYmd(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

export async function markGuardsDataDailyDone(ymd: string): Promise<void> {
  try {
    await redisCommand(['SET', `${LEDGER_KEY_PREFIX}${ymd}`, '1', 'EX', String(60 * 60 * 48)])
  } catch {
    /* ignore */
  }
}

export async function guardsDataDailyAlreadyDone(ymd: string): Promise<boolean> {
  try {
    const res = await redisCommand(['GET', `${LEDGER_KEY_PREFIX}${ymd}`])
    return Boolean(res?.result)
  } catch {
    return false
  }
}

/** Rebuild once per IST day (idempotent). force=true always rebuilds. */
export async function ensureGuardsDataDaily(force = false): Promise<{
  ran: boolean
  ymd: string
  total: number
  cities: number
}> {
  const ymd = istYmd()
  if (!force && (await guardsDataDailyAlreadyDone(ymd))) {
    const existing = await getGuardsDataSnapshot()
    return {
      ran: false,
      ymd,
      total: existing?.total ?? 0,
      cities: existing?.cities.length ?? 0,
    }
  }
  const snap = await rebuildGuardsDataRoster()
  await markGuardsDataDailyDone(ymd)
  return { ran: true, ymd, total: snap.total, cities: snap.cities.length }
}
