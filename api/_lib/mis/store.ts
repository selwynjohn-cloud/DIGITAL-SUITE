/**
 * Agile MIS storage (Upstash Redis). Central Data Bank + daily reports.
 *
 * Data Bank (masters, managed by HO):
 *   - Branches (name + login PIN)
 *   - Clients per branch (sanctioned A/B/C, SLA day-visit / night-check, issued items)
 *   - Operations staff per branch
 *
 * Daily reporting:
 *   - Each branch submits one Deployment (Report 1a) per date. The form pre-fills
 *     sanctioned strength from the client master and the previous day's entries,
 *     so branches only update what changed.
 */

import { createRequire } from 'node:module'
import { misBranchGroupKey } from './branch-group-key.js'
import { misWeekStartMonday } from './dates.js'
import { normalizeStarRating, suggestStarRating } from './client-rules.js'
import { suiteAdminPassword, suiteBranchPin } from '../suite-credentials.js'
import {
  clientMatchesBranch,
  filterClientsForBranch,
  sitesForBranch,
  normalizeClientBranchIds,
} from './client-branch.js'
import { normalizeToLacs } from '../inr-money.js'

export type MisBranch = { id: string; name: string; pin: string; active: boolean }

export type MisClient = {
  id: string
  branchId: string
  name: string
  location: string
  staffName: string
  sanA: number // A / Day shift
  sanG: number // General shift
  sanB: number // B shift
  sanC: number // C / Night shift
  slaDayVisit: string
  slaNightCheck: string
  uniformIssued: string
  rainGearIssued: string
  equipmentIssued: string
  /** 1–5 stars: 1–2 Valued Client · 3–4 High Value Client · 5 Strategic Client */
  starRating: number
  highValue: boolean
  active: boolean
  /** Minimum Wage compliant — branch HOD Yes/No for Client Performance. */
  mwCompliant?: 'yes' | 'no' | ''
  /** Client monthly bill (₹ lakhs) — branch manual for Client Performance. */
  monthlyBillLacs?: number
  /** Balance to be paid (₹ lakhs) — branch manual for Client Performance. */
  balanceToPayLacs?: number
}

/** Shift keys used across the daily report (A=Day, G=General, B, C=Night). */
export const SHIFTS = [
  { key: 'A', label: 'A / Day' },
  { key: 'G', label: 'General' },
  { key: 'B', label: 'B Shift' },
  { key: 'C', label: 'C / Night' },
] as const

export type MisStaff = {
  id: string
  branchId: string
  name: string
  role: string
  phone: string
  active: boolean
  /** operations = branch field team · support = HQ (Stores, HR, etc.) */
  team?: 'operations' | 'support'
  /** Stores · HR · Recruitment · Payroll — for support staff only */
  department?: string
}

export type MisGuard = {
  id: string
  branchId: string
  clientName: string
  unitName: string
  name: string
  employeeId: string
  mobile: string
}

/** Guard document / compliance status (PVC, Medical, Training) per guard. */
export type MisGuardDoc = {
  id: string
  branchId: string
  unitName: string
  incharge: string
  /** Incharge mobile number */
  inchargeMobile: string
  guardName: string
  employeeId: string
  mobile: string
  /** Date of joining (YYYY-MM-DD or DD/MM/YYYY) */
  doj: string
  /** ID card validity date */
  idCardValidity: string
  aadhar: string
  /** PVC status: Valid, Pending, Expired, etc. */
  pvc: string
  pvcValidity: string
  /** Medical fitness status */
  medical: string
  medicalValidity: string
  /** Training status */
  training: string
  remarks: string
  active: boolean
}

/** One field visit by operations staff (from the mobile Duty Visits Report). */
export type MisVisit = {
  id: string
  date: string // YYYY-MM-DD
  user: string
  personMet: string
  client: string
  unit: string
  visitTime: string
  place: string
  remarks: string
  /** D = Day visit, N = Night check, T = Training */
  visitType?: 'D' | 'N' | 'T' | ''
  fromMobile?: boolean
}

/** Late start or left post case from Agile Mobile / Work360. */
export type MisDutyIncident = {
  id: string
  date: string
  guardName: string
  employeeId: string
  client: string
  unit: string
  shift: string
  incidentTime: string
  type: 'late_start' | 'out_of_post'
  remarks: string
  fromMobile?: boolean
}

/** Branch-wise weekly collection (finance / DSO tracker). Amounts in rupees. */
export type MisCollection = {
  id: string
  branchId: string
  weekStart: string // Monday YYYY-MM-DD
  monthlyBilling: number
  budget: number
  mon: number
  tue: number
  wed: number
  thu: number
  fri: number
  sat: number
  outstanding: number
  remarks: string
}

/** Standard nature-of-complaint options (Operations Complaints Form + MIS). */
export const COMPLAINT_NATURES = [
  'Sleeping',
  'Theft',
  'Theft attempt',
  'Left the post',
  'Late reporting',
  'Record keeping',
  'Patrolling',
  'Job Knowledge',
  'Fire',
  'Accident',
  'Strike',
  'Water logging',
  'Shortage of Manpower',
  'No visit',
  'Not attending calls',
] as const

export type ComplaintNature = (typeof COMPLAINT_NATURES)[number]

export function isComplaintNature(v: string): v is ComplaintNature {
  return (COMPLAINT_NATURES as readonly string[]).includes(v)
}

/** A complaint / incident record. */
export type MisComplaint = {
  id: string
  /** Unique reference e.g. AGM-OPS-2026-00042 */
  code?: string
  branchId: string
  clientName: string
  location: string
  incidentDate: string
  type: string // Client / Guard
  description: string
  actionTaken: string
  momWithin24h: boolean
  status: string // Open / Closed
  reportedBy: string
  /** manual | inbox | web | branch */
  source?: string
  /** Phone | Mail | WhatsApp | Email | Web */
  channel?: string
  /** Nature of complaint (dropdown) */
  nature?: string
  contactEmail?: string
  contactPhone?: string
  /** What action / resolution is expected */
  expectedAction?: string
  /** Gmail message id — prevents duplicate imports */
  emailId?: string
  fromEmail?: string
  subject?: string
  importedAt?: string
  /** ISO timestamp when complaint was first registered */
  registeredAt?: string
  /** false = archived / hidden — record kept */
  active?: boolean
}

/** True if a document value means the document is present/valid. */
export function docPresent(v: string): boolean {
  const s = String(v ?? '').trim().toUpperCase()
  if (!s) return false
  if (['VALID', 'FIT', 'CERTIFIED', 'APPLIED', 'YES', 'Y', 'DONE'].includes(s)) return true
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return true
  if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(s)) return true
  return false
}

/** Guard register row counts toward PVC / Medical compliance totals. */
export function guardRecordEligible(d: { active?: boolean; guardName?: string; employeeId?: string }): boolean {
  if (d.active === false) return false
  const name = String(d.guardName ?? '').trim()
  if (name.length < 2) return false
  return true
}

/** One client row inside a branch's daily deployment report (4 shifts). */
export type MisDeployRow = {
  clientId: string
  clientName: string
  location: string
  staffName: string
  sanA: number; depA: number; absA: number; otA: number
  sanG: number; depG: number; absG: number; otG: number
  sanB: number; depB: number; absB: number; otB: number
  sanC: number; depC: number; absC: number; otC: number
}

export type MisSummary = {
  collectionPct: string
  /** Weekly collection achievement % (Mon–Sat ÷ weekly budget) */
  weeklyCollectionPct?: string
  /** Consolidated collection % (monthly billing vs outstanding — finance upload) */
  consolidatedCollectionPct?: string
  /** Operations day visits (from Agile Mobile or manual) */
  dayVisits?: string
  /** Night checks (from Agile Mobile or manual) */
  nightChecks?: string
  /** Training visits / trained sites (from Agile Mobile or manual) */
  trainedSites?: string
  medicalFitnessPct: string
  pvcPct: string
  psaraPct: string
  /** Guards resigned (count) — reported by HOD */
  resignation: string
  /** Recruitment open / in progress (count) — reported by HOD */
  recruitment: string
  /** @deprecated use resignation */
  mobileMentionedPct?: string
  /** @deprecated use recruitment */
  mobileActualPct?: string
  /** Open guard complaints (count) */
  guardComplaints?: string
  /** Open client complaints (count) */
  clientComplaints?: string
  /** @deprecated use clientComplaints — kept for older dashboards */
  complaints: string
  remarks: string
  /** Late start duty cases (count) */
  lateStartCases: string
  /** Out of post cases (count) */
  outOfPostCases: string
}

export type MisReport = {
  id: string
  branchId: string
  branchName: string
  dateFor: string // YYYY-MM-DD (the day the report is FOR)
  submittedAt: string
  submittedBy: string
  /** Work email of person who submitted — used for acknowledgment. */
  submitterEmail?: string
  rows: MisDeployRow[]
  summary: MisSummary
}

const misAckKey = (branchId: string, dateFor: string) => `mis:ack:${branchId}:${dateFor}`

export async function markMisAckSent(branchId: string, dateFor: string, to: string[]): Promise<void> {
  await setJson(misAckKey(branchId, dateFor), { at: new Date().toISOString(), to })
}

export async function getMisAckSent(branchId: string, dateFor: string): Promise<{ at: string; to: string[] } | null> {
  return getJson<{ at: string; to: string[] } | null>(misAckKey(branchId, dateFor), null)
}

const BRANCHES_KEY = 'mis:branches'
const CLIENTS_KEY = 'mis:clients'
const clientsKey = (branchId: string) => `mis:clients:${branchId}`
const STAFF_KEY = 'mis:staff'
/** Legacy import slug (e.g. b_tirupathi) for guard docs stored before br1… ids. */
function legacyBranchStorageId(branchId: string, branchName: string): string[] {
  const ids = new Set<string>([branchId])
  const n = String(branchName ?? '').trim()
  const lower = n.toLowerCase()
  if (/hyderabad-a|hyd zone a/i.test(n)) ids.add('b_hyderabadzonea')
  if (/hyderabad-b|hyd zone b/i.test(n)) ids.add('b_hyderabadzoneb')
  if (/tirupati/i.test(n)) ids.add('b_tirupathi')
  if (/karnataka/i.test(n)) ids.add('b_karnataka')
  if (/kerala/i.test(n)) ids.add('b_kerala')
  if (/gujarat|surat/i.test(n)) ids.add('b_maharashtra')
  if (/madhya/i.test(n)) ids.add('b_madhya')
  if (/maharashtra/i.test(n)) ids.add('b_maharashtra')
  if (/nellore/i.test(n)) ids.add('b_nellore')
  if (/puducherry|pondicherry/i.test(n)) ids.add('b_puducherry')
  if (/tamil/i.test(n)) ids.add('b_tamilnadu')
  if (/vijayawada/i.test(n)) ids.add('b_vijayawada')
  if (/visakhapatnam|vizag/i.test(n)) ids.add('b_visakhapatnam')
  if (/kakinada/i.test(n)) ids.add('b_kakinada')
  if (/hi-?tech/i.test(n)) ids.add('b_hitech')
  const slug = 'b_' + lower.replace(/[^a-z0-9]+/g, '')
  if (slug.length > 2) ids.add(slug)
  return [...ids]
}

async function readLegacyClientsBlob(): Promise<MisClient[]> {
  return getJson<MisClient[]>(CLIENTS_KEY, [])
}

function siteMergeKey(c: MisClient): string {
  const bid = String(c.branchId ?? '').trim()
  const loc = String(c.location ?? '').trim().toUpperCase()
  const name = String(c.name ?? '').trim().toUpperCase()
  if (loc) return `${bid}|${loc}`
  if (name) return `${bid}|${name}`
  return `${bid}|${String(c.id ?? '').trim()}`
}

/** Read master list + any per-branch shards (deduped by branch + site/unit). */
async function loadAllClientsMerged(branches: MisBranch[]): Promise<MisClient[]> {
  const keys = new Set<string>([CLIENTS_KEY])
  for (const b of branches) {
    keys.add(clientsKey(b.id))
    for (const id of legacyBranchStorageId(b.id, b.name)) {
      if (id !== b.id) keys.add(clientsKey(id))
    }
  }
  const keyList = [...keys]
  const raw = await redisMget(keyList)
  const bySite = new Map<string, MisClient>()
  const add = (list: MisClient[]) => {
    for (const c of list) {
      const key = siteMergeKey(c)
      const prev = bySite.get(key)
      if (!prev || (String(c.id ?? '').trim() && !String(prev.id ?? '').trim())) bySite.set(key, c)
    }
  }
  for (const s of raw) add(parseJson<MisClient[]>(s, []))
  return [...bySite.values()]
}

/** Branch-wise site counts for Master Directory (each row = one deployment site). */
export async function getClientCounts(): Promise<Record<string, number>> {
  const stats = await getSiteDirectoryStats()
  return stats.siteCounts
}

export type SiteDirectoryStats = {
  siteCounts: Record<string, number>
  clientNameCounts: Record<string, number>
  totalSites: number
  totalClientNames: number
}

/** Sites (units) and unique client companies per branch. */
export async function getSiteDirectoryStats(): Promise<SiteDirectoryStats> {
  const branches = await getBranches()
  const normalized = normalizeClientBranchIds(await loadAllClientsMerged(branches), branches)
  const all = ensureUniqueClientIds(normalized.list).list
  const siteCounts: Record<string, number> = {}
  const clientNameCounts: Record<string, number> = {}
  const allNames = new Set<string>()
  for (const b of branches) {
    const sites = sitesForBranch(all, b.id, branches, true)
    siteCounts[b.id] = sites.length
    const names = new Set<string>()
    for (const s of sites) {
      const n = String(s.name ?? '').trim().toUpperCase()
      if (n) {
        names.add(n)
        allNames.add(n)
      }
    }
    clientNameCounts[b.id] = names.size
  }
  return {
    siteCounts,
    clientNameCounts,
    totalSites: Object.values(siteCounts).reduce((sum, n) => sum + n, 0),
    totalClientNames: allNames.size,
  }
}
const guardsKey = (branchId: string) => `mis:guards:${branchId}`
const guardDocsKey = (branchId: string) => `mis:guarddocs:${branchId}`
const visitsKey = (date: string) => `mis:visits:${date}`
const VISIT_DATES_KEY = 'mis:visitdates'
const dutyKey = (date: string) => `mis:duty:${date}`
const DUTY_DATES_KEY = 'mis:dutydates'
const collectionsKey = (weekStart: string) => `mis:collections:${weekStart}`
const complaintsKey = (branchId: string) => `mis:complaints:${branchId}`
const DIRECTOR_INBOX_KEY = 'mis:complaints:director-inbox'
const PROCESSED_COMPLAINT_EMAILS_KEY = 'mis:complaint-emails'
const COMPLAINT_SEQ_KEY = 'mis:complaint-seq'
const reportKey = (branchId: string, dateFor: string) => `mis:report:${branchId}:${dateFor}`
const reportIndexKey = (dateFor: string) => `mis:reportindex:${dateFor}`
const lastReportKey = (branchId: string) => `mis:lastreport:${branchId}`
const mdSummaryCacheKey = (key: string) => `mis:mdsummary:${key}`
const MD_SUMMARY_CACHE_MS = 600_000
const MD_SUMMARY_CACHE_HISTORICAL_MS = 3_600_000
const REPORT_DATES_KEY = 'mis:reportdates'
const USERS_KEY = 'mis:users'
const DOCS_KEY = 'mis:docs'
const FORMATS_KEY = 'mis:formats'

export type MisFormat = { id: string; title: string; category: string; body: string; active: boolean }
export const FORMAT_CATEGORIES = ['Agreement', 'Email', 'Letter', 'Notice', 'Other']

export type MisUser = {
  id: string
  name: string
  email: string
  phone: string
  role: string
  branchId: string
  active: boolean
  /** operations = branch MIS submitters · support = HQ departments */
  team?: 'operations' | 'support'
  /** Stores · HR · Recruitment · Payroll */
  department?: string
}
export type MisDoc = {
  id: string
  title: string
  category: string
  link: string
  notes: string
  addedBy: string
  date: string
  active: boolean
}
export const USER_ROLES = ['Director', 'Admin', 'CGM', 'Vice President (VP)', 'AVP', 'General Manager (GM)', 'Regional Manager (RM)', 'Branch Manager', 'Operations Manager', 'Area Manager', 'Field Officer', 'Sales Executive', 'Training Team', 'Accounts', 'HR']
export const DOC_CATEGORIES = ['Master Agreement', 'MW Notification', 'Tender Document', 'PSARA Licence', 'GST / PF / ESI', 'Client Contract', 'Policy / SOP', 'Previous Tender Data', 'Other']

export const DEFAULT_BRANCHES: MisBranch[] = [
  'Bangalore',
  'Bhopal',
  'Chennai & Pondicherry',
  'Hi-Tech City',
  'Hyderabad-A',
  'Hyderabad-B',
  'Kochi',
  'Mumbai & Surat',
  'Nellore & Tada',
  'Tirupati & Tadipatri',
  'Vijayawada',
  'Visakhapatnam & Kakinada',
].map((name, i) => ({ id: `br${i + 1}`, name, pin: suiteBranchPin(), active: true }))

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url, token } : null
}

export function misStorageOk(): boolean {
  return redisConfig() !== null
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

/** Batch Redis GET — one round-trip per chunk (dashboard speed). */
async function redisMget(keys: string[]): Promise<(string | null)[]> {
  if (!keys.length) return []
  const CHUNK = 50
  const out: (string | null)[] = []
  for (let i = 0; i < keys.length; i += CHUNK) {
    const chunk = keys.slice(i, i + CHUNK)
    const d = await redis(['MGET', ...chunk])
    const arr = Array.isArray(d?.result) ? d.result : []
    for (let j = 0; j < chunk.length; j++) {
      const v = arr[j]
      out.push(typeof v === 'string' ? v : null)
    }
  }
  return out
}

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

async function getJson<T>(key: string, fallback: T): Promise<T> {
  const d = await redis(['GET', key])
  if (d?.result && typeof d.result === 'string') {
    try {
      return JSON.parse(d.result) as T
    } catch {
      /* ignore */
    }
  }
  return fallback
}

async function setJson(key: string, value: unknown): Promise<boolean> {
  const r = await redis(['SET', key, JSON.stringify(value)])
  return r?.result === 'OK'
}

// ---- Branches ---------------------------------------------------------------
export async function getBranches(onlyActive = false): Promise<MisBranch[]> {
  const b = await getJson<MisBranch[]>(BRANCHES_KEY, [])
  const list = b.length ? b.map((x) => ({ ...x, active: x.active !== false })) : DEFAULT_BRANCHES
  const sorted = [...list].sort((a, b) =>
    String(a.name ?? '').localeCompare(String(b.name ?? ''), 'en', { sensitivity: 'base' }),
  )
  return onlyActive ? sorted.filter((x) => x.active !== false) : sorted
}

export async function getActiveBranch(branchId: string): Promise<MisBranch | null> {
  const id = String(branchId ?? '').trim()
  if (!id) return null
  return (await getBranches(true)).find((b) => b.id === id) ?? null
}

export async function isActiveBranch(branchId: string): Promise<boolean> {
  return !!(await getActiveBranch(branchId))
}
export async function saveBranches(list: MisBranch[]): Promise<boolean> {
  const normalized = list
    .filter((b) => String(b.name ?? '').trim())
    .map((b) => ({ ...b, active: b.active !== false }))
  return setJson(BRANCHES_KEY, normalized)
}

/** Apply city-only names (no state names) and keep list alphabetical. */
export async function applyCityOnlyBranchNames(): Promise<{
  ok: boolean
  renamed: { id: string; from: string; to: string }[]
  names: string[]
  error?: string
}> {
  const { cityOnlyBranchName } = await import('./branch-labels.js')
  const all = await getBranches()
  const renamed: { id: string; from: string; to: string }[] = []
  const next = all.map((b) => {
    const from = String(b.name ?? '').trim()
    const to = cityOnlyBranchName(from)
    if (to && to !== from) renamed.push({ id: b.id, from, to })
    return { ...b, name: to || from }
  })
  next.sort((a, b) =>
    String(a.name ?? '').localeCompare(String(b.name ?? ''), 'en', { sensitivity: 'base' }),
  )
  const ok = await saveBranches(next)
  if (!ok) return { ok: false, renamed, names: [], error: 'Could not save branch names' }
  return {
    ok: true,
    renamed,
    names: next.filter((b) => b.active !== false).map((b) => b.name),
  }
}

/** Rename a branch display name (keeps same id / PIN / data). */
export async function renameBranch(
  fromName: string,
  toName: string,
): Promise<{ ok: boolean; branchId?: string; from?: string; to?: string; error?: string }> {
  const from = String(fromName ?? '').trim()
  const to = String(toName ?? '').trim()
  if (!from || !to) return { ok: false, error: 'from and to names required' }
  const all = await getBranches()
  const idx = all.findIndex((b) => b.name.trim().toLowerCase() === from.toLowerCase())
  if (idx < 0) {
    const already = all.find((b) => b.name.trim().toLowerCase() === to.toLowerCase())
    if (already) return { ok: true, branchId: already.id, from: already.name, to: already.name }
    return { ok: false, error: `Branch not found: ${from}` }
  }
  const branch = all[idx]
  all[idx] = { ...branch, name: to }
  const ok = await saveBranches(all)
  if (!ok) return { ok: false, error: 'Could not save branch name' }

  /* Update today's report label if already submitted under old name */
  try {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    const report = await getReport(branch.id, today)
    if (report && String(report.branchName ?? '').trim().toLowerCase() === from.toLowerCase()) {
      await setJson(reportKey(branch.id, today), { ...report, branchName: to })
    }
  } catch {
    /* non-fatal */
  }

  return { ok: true, branchId: branch.id, from: branch.name, to }
}

/** Activate or deactivate branches whose name matches (e.g. deactivate Lucknow / Surat-GJ only). */
export async function setBranchActiveByMatch(
  matcher: (name: string) => boolean,
  active: boolean,
): Promise<{ updated: string[] }> {
  const all = await getBranches()
  const updated: string[] = []
  const next = all.map((b) => {
    if (!matcher(String(b.name ?? ''))) return b
    updated.push(b.name)
    return { ...b, active }
  })
  if (updated.length) await saveBranches(next)
  return { updated }
}

// ---- Clients ----------------------------------------------------------------
async function getLastReportFlexible(
  branchId: string,
  beforeDate: string,
  branches: MisBranch[],
): Promise<MisReport | null> {
  const direct = await getLastReport(branchId, beforeDate)
  if (direct) return direct

  const branch = branches.find((b) => b.id === branchId)
  const gk = misBranchGroupKey(branch?.name ?? branchId)
  if (!gk) return null

  const dates = (await getReportDates()).filter((d) => d < beforeDate).sort().reverse().slice(0, 90)
  for (const dateFor of dates) {
    const reports = await getReportsForDate(dateFor)
    const hits = reports.filter((r) => {
      const name = branches.find((b) => b.id === r.branchId)?.name ?? r.branchId
      return misBranchGroupKey(name) === gk
    })
    if (!hits.length) continue
    hits.sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)))
    return hits[0]
  }
  return null
}

async function restoreClientsFromLastReport(
  branchId: string,
  branches: MisBranch[],
  all: MisClient[],
): Promise<MisClient[]> {
  const has = filterClientsForBranch(all, branchId, branches).filter((c) => c.active !== false)
  if (has.length) return all

  const last = await getLastReportFlexible(branchId, '9999-12-31', branches)
  if (!last?.rows?.length) return all

  const out = [...all]
  let added = false
  for (const row of last.rows) {
    const name = String(row.clientName ?? '').trim()
    if (!name) continue
    const exists = out.some(
      (c) =>
        c.active !== false &&
        clientMatchesBranch(c.branchId, branchId, branches) &&
        c.name.trim().toUpperCase() === name.toUpperCase(),
    )
    if (exists) continue
    out.push({
      id: nid('cl'),
      branchId,
      name,
      location: String(row.location ?? '').slice(0, 120),
      staffName: String(row.staffName ?? '').slice(0, 120),
      sanA: num(row.sanA),
      sanG: num(row.sanG),
      sanB: num(row.sanB),
      sanC: num(row.sanC),
      slaDayVisit: '',
      slaNightCheck: '',
      uniformIssued: '',
      rainGearIssued: '',
      equipmentIssued: '',
      starRating: 2,
      highValue: false,
      active: true,
    })
    added = true
  }
  if (added) {
    const branches = await getBranches()
    await saveClients(ensureUniqueClientIds(out).list)
  }
  return added ? ensureUniqueClientIds(out).list : all
}

/** Normalize branch ids and rebuild missing clients from the latest saved report per branch. */
export type SaveClientsOptions = {
  /** Replace only this branch's rows in the master list (safe partial save). */
  branchOnly?: string
  /** Skip wipe protection — used only for seed restore. */
  force?: boolean
}

let clientsSeedCache: MisClient[] | null = null
const requireJson = createRequire(import.meta.url)

function loadClientsSeed(): MisClient[] {
  if (clientsSeedCache) return clientsSeedCache
  try {
    clientsSeedCache = requireJson('./clients-seed.json') as MisClient[]
  } catch {
    clientsSeedCache = []
  }
  return clientsSeedCache
}

/** Re-import sites from SHIFTWISE DEPLOYMENT Excel when Redis was accidentally wiped. */
export async function restoreClientsFromSeedIfNeeded(): Promise<{ restored: boolean; count: number }> {
  const branches = await getBranches()
  const existing = await loadAllClientsMerged(branches)
  if (existing.length >= 500) return { restored: false, count: existing.length }
  const seed = loadClientsSeed()
  if (seed.length < 500) return { restored: false, count: existing.length }
  const ok = await saveClients(seed, { force: true })
  return { restored: ok, count: ok ? seed.length : existing.length }
}

let staffSeedCache: MisStaff[] | null = null

function loadStaffSeed(): MisStaff[] {
  if (staffSeedCache) return staffSeedCache
  try {
    staffSeedCache = requireJson('./staff-seed.json') as MisStaff[]
  } catch {
    staffSeedCache = []
  }
  return staffSeedCache
}

export type SaveStaffOptions = { force?: boolean }

/** Re-import operations + support staff from OM WISE Client Master Sheet. */
export async function restoreStaffFromSeedIfNeeded(): Promise<{ restored: boolean; count: number }> {
  const existing = await getStaff()
  const ops = existing.filter((s) => s.team !== 'support' && s.active !== false)
  if (ops.length >= 20) return { restored: false, count: existing.length }
  const seed = loadStaffSeed()
  if (seed.length < 10) return { restored: false, count: existing.length }
  const ok = await saveStaff(seed, { force: true })
  return { restored: ok, count: ok ? seed.length : existing.length }
}

/** Restore sites and staff when Master Directory looks incomplete. */
export async function restoreMasterDirectoryIfNeeded(): Promise<{
  sites: { restored: boolean; count: number }
  staff: { restored: boolean; count: number }
  compacted?: boolean
  branchesMerged?: boolean
}> {
  const [sites, staff] = await Promise.all([restoreClientsFromSeedIfNeeded(), restoreStaffFromSeedIfNeeded()])
  const branches = await getBranches()
  const merged = await loadAllClientsMerged(branches)
  let compacted = false
  if (merged.length > 1200) {
    await saveClients(merged, { force: true })
    compacted = true
  }
  let branchesMerged = false
  const active = branches.filter((b) => b.active !== false)
  const hasPair = active.some((b) => /kakinada/i.test(b.name)) && active.some((b) => /visakhapatnam|vizag/i.test(b.name))
  if (hasPair || active.length > 12) {
    try {
      const { dedupeMisBranches } = await import('./branch-dedupe.js')
      const deduped = await dedupeMisBranches()
      branchesMerged = deduped.ok && (deduped.removed?.length ?? 0) > 0
    } catch {
      /* non-fatal */
    }
  }
  return { sites, staff, compacted, branchesMerged }
}

export async function repairAllBranchClients(): Promise<{
  normalized: boolean
  branchesSeeded: number
  clientsAdded: number
}> {
  const branches = await getBranches(true)
  let all = await loadAllClientsMerged(branches)
  const normalized = normalizeClientBranchIds(all, branches)
  const fixed = ensureUniqueClientIds(normalized.list)
  all = fixed.list
  let clientsAdded = 0
  let branchesSeeded = 0
  for (const b of branches) {
    if (b.active === false) continue
    const before = filterClientsForBranch(all, b.id, branches).filter((c) => c.active !== false).length
    all = await restoreClientsFromLastReport(b.id, branches, all)
    const after = filterClientsForBranch(all, b.id, branches).filter((c) => c.active !== false).length
    if (before === 0 && after > 0) branchesSeeded++
    clientsAdded += Math.max(0, after - before)
  }
  if (normalized.changed || fixed.changed) await saveClients(all)
  return { normalized: normalized.changed || fixed.changed, branchesSeeded, clientsAdded }
}

export async function getClients(
  branchId?: string,
  opts?: { skipRepair?: boolean; branches?: MisBranch[] },
): Promise<MisClient[]> {
  const branches = opts?.branches ?? (await getBranches())
  let all = await loadAllClientsMerged(branches)
  const normalized = normalizeClientBranchIds(all, branches)
  const fixed = ensureUniqueClientIds(normalized.list)
  all = fixed.list
  if (!opts?.skipRepair && (normalized.changed || fixed.changed)) {
    await saveClients(all)
  }
  if (branchId) {
    all = await restoreClientsFromLastReport(branchId, branches, all)
    return sitesForBranch(all, branchId, branches, false)
  }
  return all
}
export async function saveClients(list: MisClient[], options?: SaveClientsOptions): Promise<boolean> {
  const branches = await getBranches()
  let toSave = list
  if (options?.branchOnly) {
    const bid = options.branchOnly
    const existing = await loadAllClientsMerged(branches)
    const others = existing.filter((c) => !clientMatchesBranch(c.branchId, bid, branches))
    toSave = [...others, ...list]
  } else if (!options?.force) {
    const existing = await loadAllClientsMerged(branches)
    if (list.length === 0 && existing.length > 0) return false
    const activeExisting = existing.filter((c) => c.active !== false).length
    const activeNew = list.filter((c) => c.active !== false).length
    if (activeExisting >= 100 && activeNew < Math.min(50, Math.floor(activeExisting * 0.1))) return false
  }
  const normalized = normalizeClientBranchIds(toSave, branches)
  const fixed = ensureUniqueClientIds(normalized.list)
  const ok = await setJson(CLIENTS_KEY, fixed.list)
  const buckets = new Map<string, MisClient[]>()
  for (const c of fixed.list) {
    const bid = String(c.branchId ?? '').trim()
    if (!bid) continue
    if (!buckets.has(bid)) buckets.set(bid, [])
    buckets.get(bid)!.push(c)
  }
  for (const [bid, part] of buckets) {
    await setJson(clientsKey(bid), part)
  }
  return ok
}

/** Every client must have a stable unique id (fixes wrong-row deactivate). */
function ensureUniqueClientIds(list: MisClient[]): { list: MisClient[]; changed: boolean } {
  const seen = new Set<string>()
  let changed = false
  const out = list.map((c) => {
    let id = String(c.id ?? '').trim()
    if (!id || seen.has(id)) {
      id = nid('cl')
      changed = true
    }
    seen.add(id)
    const san = num(c.sanA) + num(c.sanG) + num(c.sanB) + num(c.sanC)
    const starRating = normalizeStarRating(c.starRating, suggestStarRating(c.name, san, c.highValue === true))
    const patched = { ...c, id, starRating, highValue: starRating >= 3 }
    return id === c.id && starRating === c.starRating ? c : patched
  })
  return { list: out, changed }
}

function normalizeMwCompliant(v: unknown): 'yes' | 'no' | '' {
  const s = String(v ?? '')
    .trim()
    .toLowerCase()
  if (s === 'yes' || s === 'y' || s === 'true' || s === '1') return 'yes'
  if (s === 'no' || s === 'n' || s === 'false' || s === '0') return 'no'
  return ''
}

/** Add or update one client in the Data Bank (HOD branch report). */
export async function upsertClient(client: MisClient): Promise<MisClient | null> {
  if (!client.branchId) return null
  const all = await getClients()
  const id = String(client.id ?? '').trim() || nid('cl')
  const prev = all.find((c) => c.id === id)
  const sanTotal = num(client.sanA) + num(client.sanG) + num(client.sanB) + num(client.sanC)
  const stars = normalizeStarRating(
    client.starRating ?? prev?.starRating,
    suggestStarRating(String(client.name ?? prev?.name ?? ''), sanTotal, client.highValue === true),
  )
  const row: MisClient = {
    id,
    branchId: client.branchId,
    name: String(client.name ?? prev?.name ?? '').slice(0, 120),
    location: String(client.location ?? prev?.location ?? '').slice(0, 120),
    staffName: String(client.staffName ?? prev?.staffName ?? '').slice(0, 120),
    sanA: num(client.sanA ?? prev?.sanA),
    sanG: num(client.sanG ?? prev?.sanG),
    sanB: num(client.sanB ?? prev?.sanB),
    sanC: num(client.sanC ?? prev?.sanC),
    slaDayVisit: String(client.slaDayVisit ?? prev?.slaDayVisit ?? '').slice(0, 60),
    slaNightCheck: String(client.slaNightCheck ?? prev?.slaNightCheck ?? '').slice(0, 60),
    uniformIssued: String(client.uniformIssued ?? prev?.uniformIssued ?? '').slice(0, 120),
    rainGearIssued: String(client.rainGearIssued ?? prev?.rainGearIssued ?? '').slice(0, 120),
    equipmentIssued: String(client.equipmentIssued ?? prev?.equipmentIssued ?? '').slice(0, 200),
    starRating: stars,
    highValue: stars >= 3,
    active: client.active !== undefined ? client.active !== false : prev?.active !== false,
    mwCompliant: normalizeMwCompliant(
      client.mwCompliant !== undefined ? client.mwCompliant : prev?.mwCompliant,
    ),
    monthlyBillLacs:
      client.monthlyBillLacs !== undefined ? num(client.monthlyBillLacs) : num(prev?.monthlyBillLacs),
    balanceToPayLacs:
      client.balanceToPayLacs !== undefined ? num(client.balanceToPayLacs) : num(prev?.balanceToPayLacs),
  }
  const idx = all.findIndex((c) => c.id === id)
  if (idx >= 0) all[idx] = row
  else all.push(row)
  const ok = await saveClients(all)
  return ok ? row : null
}

/** Update MW / billing fields on all sites matching client name in a branch. */
export async function saveClientPerfFinance(
  branchId: string,
  clientName: string,
  fields: { mwCompliant?: string; monthlyBillLacs?: number | string; balanceToPayLacs?: number | string },
): Promise<{ ok: boolean; updated: number }> {
  const target = String(clientName ?? '')
    .trim()
    .toUpperCase()
  if (!branchId || !target) return { ok: false, updated: 0 }
  const all = await getClients()
  let updated = 0
  for (const c of all) {
    if (c.branchId !== branchId) continue
    if (String(c.name ?? '').trim().toUpperCase() !== target) continue
    if (fields.mwCompliant !== undefined) c.mwCompliant = normalizeMwCompliant(fields.mwCompliant)
    if (fields.monthlyBillLacs !== undefined) {
      c.monthlyBillLacs = normalizeToLacs(fields.monthlyBillLacs) ?? num(fields.monthlyBillLacs)
    }
    if (fields.balanceToPayLacs !== undefined) {
      c.balanceToPayLacs = normalizeToLacs(fields.balanceToPayLacs) ?? num(fields.balanceToPayLacs)
    }
    updated++
  }
  if (!updated) return { ok: false, updated: 0 }
  const ok = await saveClients(all)
  return { ok, updated }
}

export async function setClientActive(branchId: string, clientId: string, active: boolean): Promise<boolean> {
  const all = await getClients()
  const id = String(clientId ?? '').trim()
  if (!id) return false
  const matches = all.filter((x) => x.id === id && x.branchId === branchId)
  if (!matches.length) return false
  let changed = false
  for (const c of matches) {
    if (c.active !== active) {
      c.active = active
      changed = true
    }
  }
  return changed ? saveClients(all) : true
}

// ---- Staff ------------------------------------------------------------------
export async function getStaff(branchId?: string, onlyActive = false): Promise<MisStaff[]> {
  const all = await getJson<MisStaff[]>(STAFF_KEY, [])
  let list = all.map((s) => ({ ...s, active: s.active !== false }))
  if (onlyActive) list = list.filter((s) => s.active !== false)
  return branchId ? list.filter((s) => s.branchId === branchId) : list
}
export async function saveStaff(list: MisStaff[], options?: SaveStaffOptions): Promise<boolean> {
  const existing = await getJson<MisStaff[]>(STAFF_KEY, [])
  if (!options?.force) {
    if (list.length === 0 && existing.length > 0) return false
    if (existing.length >= 30 && list.length < Math.min(10, Math.floor(existing.length * 0.2))) return false
  }
  return setJson(STAFF_KEY, list)
}

// ---- Guards (stored per-branch to stay within value-size limits) ------------
export async function getGuards(branchId: string): Promise<MisGuard[]> {
  return getJson<MisGuard[]>(guardsKey(branchId), [])
}
export async function saveGuards(branchId: string, list: MisGuard[]): Promise<boolean> {
  return setJson(guardsKey(branchId), list)
}

export async function getGuardDocs(branchId: string): Promise<MisGuardDoc[]> {
  const branches = await getBranches()
  const branch = branches.find((b) => b.id === branchId)
  const ids = branch
    ? legacyBranchStorageId(branchId, branch.name)
    : [branchId]
  for (const id of ids) {
    const docs = await getJson<MisGuardDoc[]>(guardDocsKey(id), [])
    if (docs.length) return docs
  }
  return []
}
export async function saveGuardDocs(branchId: string, list: MisGuardDoc[]): Promise<boolean> {
  return setJson(guardDocsKey(branchId), list)
}

export async function getVisits(date: string): Promise<MisVisit[]> {
  return getJson<MisVisit[]>(visitsKey(date), [])
}
export async function saveVisits(date: string, list: MisVisit[]): Promise<boolean> {
  const ok = await setJson(visitsKey(date), list)
  const dates = await getJson<string[]>(VISIT_DATES_KEY, [])
  if (!dates.includes(date)) {
    dates.push(date)
    dates.sort()
    await setJson(VISIT_DATES_KEY, dates)
  }
  return ok
}
export async function getVisitDates(): Promise<string[]> {
  return getJson<string[]>(VISIT_DATES_KEY, [])
}

export async function getDutyIncidents(date: string): Promise<MisDutyIncident[]> {
  return getJson<MisDutyIncident[]>(dutyKey(date), [])
}
export async function saveDutyIncidents(date: string, list: MisDutyIncident[]): Promise<boolean> {
  const ok = await setJson(dutyKey(date), list)
  const dates = await getJson<string[]>(DUTY_DATES_KEY, [])
  if (!dates.includes(date)) {
    dates.push(date)
    dates.sort()
    await setJson(DUTY_DATES_KEY, dates)
  }
  return ok
}
export async function getDutyDates(): Promise<string[]> {
  return getJson<string[]>(DUTY_DATES_KEY, [])
}

export async function getCollections(weekStart: string): Promise<MisCollection[]> {
  return getJson<MisCollection[]>(collectionsKey(weekStart), [])
}
export async function saveCollections(weekStart: string, list: MisCollection[]): Promise<boolean> {
  return setJson(collectionsKey(weekStart), list)
}
export async function getComplaints(branchId: string): Promise<MisComplaint[]> {
  return getJson<MisComplaint[]>(complaintsKey(branchId), [])
}
export async function saveComplaints(branchId: string, list: MisComplaint[]): Promise<boolean> {
  return setJson(complaintsKey(branchId), list)
}

/** Next global complaint reference number. */
export async function nextComplaintCode(): Promise<string> {
  const d = await redis(['INCR', COMPLAINT_SEQ_KEY])
  const seq = typeof d?.result === 'number' ? d.result : Math.floor(Date.now() / 1000) % 100000
  const year = new Date().getFullYear()
  return `AGM-OPS-${year}-${String(seq).padStart(5, '0')}`
}

export async function ensureComplaintCodes(list: MisComplaint[]): Promise<MisComplaint[]> {
  const out: MisComplaint[] = []
  for (const c of list) {
    const code = String(c.code ?? '').trim() || (await nextComplaintCode())
    const registeredAt = String(c.registeredAt ?? '').trim() || new Date().toISOString()
    out.push({ ...c, code, registeredAt })
  }
  return out
}

export async function getDirectorInboxComplaints(): Promise<MisComplaint[]> {
  return getJson<MisComplaint[]>(DIRECTOR_INBOX_KEY, [])
}
export async function saveDirectorInboxComplaints(list: MisComplaint[]): Promise<boolean> {
  return setJson(DIRECTOR_INBOX_KEY, list)
}

export async function getProcessedComplaintEmailIds(): Promise<string[]> {
  return getJson<string[]>(PROCESSED_COMPLAINT_EMAILS_KEY, [])
}
export async function markComplaintEmailProcessed(emailId: string): Promise<void> {
  const ids = await getProcessedComplaintEmailIds()
  if (!ids.includes(emailId)) {
    ids.push(emailId)
    if (ids.length > 5000) ids.splice(0, ids.length - 5000)
    await setJson(PROCESSED_COMPLAINT_EMAILS_KEY, ids)
  }
}
export async function isComplaintEmailProcessed(emailId: string): Promise<boolean> {
  const ids = await getProcessedComplaintEmailIds()
  return ids.includes(emailId)
}

// ---- Reports ----------------------------------------------------------------
export async function getReport(branchId: string, dateFor: string): Promise<MisReport | null> {
  return getJson<MisReport | null>(reportKey(branchId, dateFor), null)
}

/** Most recent report for a branch strictly before `beforeDate` (for pre-fill). */
export async function getLastReport(branchId: string, beforeDate: string): Promise<MisReport | null> {
  const ptr = await getJson<{ dateFor: string } | null>(lastReportKey(branchId), null)
  if (ptr?.dateFor && ptr.dateFor < beforeDate) {
    const recent = await getReport(branchId, ptr.dateFor)
    if (recent) return recent
  }
  const base = new Date(beforeDate + 'T00:00:00')
  const dates: string[] = []
  for (let i = 1; i <= 14; i++) {
    const d = new Date(base)
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }
  const reports = await Promise.all(dates.map((key) => getReport(branchId, key)))
  return reports.find((r) => r) ?? null
}

/** Save in-progress daily report (steps 1–2) without final submit emails. */
export async function saveDraftReport(report: MisReport): Promise<boolean> {
  return setJson(reportKey(report.branchId, report.dateFor), report)
}

export async function submitReport(report: MisReport): Promise<boolean> {
  const ok = await setJson(reportKey(report.branchId, report.dateFor), report)
  if (!ok) return false
  const idx = await getJson<string[]>(reportIndexKey(report.dateFor), [])
  if (!idx.includes(report.branchId)) {
    idx.push(report.branchId)
    const idxOk = await setJson(reportIndexKey(report.dateFor), idx)
    if (!idxOk) return false
  }
  const dates = await getJson<string[]>(REPORT_DATES_KEY, [])
  if (!dates.includes(report.dateFor)) {
    dates.push(report.dateFor)
    dates.sort()
    await setJson(REPORT_DATES_KEY, dates)
  }
  await setJson(lastReportKey(report.branchId), { dateFor: report.dateFor, at: report.submittedAt })
  await invalidateMdSummaryCache(report.dateFor)
  return true
}

export async function getReportDates(): Promise<string[]> {
  return getJson<string[]>(REPORT_DATES_KEY, [])
}

export const getUsers = () => getJson<MisUser[]>(USERS_KEY, [])
export const saveUsers = (l: MisUser[]) => setJson(USERS_KEY, l)

export function defaultMisUsers(): MisUser[] {
  return [
    {
      id: nid('us'),
      name: 'Selwyn John',
      email: 'director@agilegroup.co.in',
      phone: '',
      role: 'Director',
      branchId: '',
      active: true,
    },
  ]
}

export function misUserCanManage(role: string): boolean {
  return role === 'Director' || role === 'Admin'
}
export const getDocs = () => getJson<MisDoc[]>(DOCS_KEY, [])
export const saveDocs = (l: MisDoc[]) => setJson(DOCS_KEY, l)
export async function getFormats(): Promise<MisFormat[]> {
  const f = await getJson<MisFormat[]>(FORMATS_KEY, [])
  return f.length ? f : DEFAULT_FORMATS
}
export const saveFormats = (l: MisFormat[]) => setJson(FORMATS_KEY, l)

export const DEFAULT_FORMATS: MisFormat[] = [
  {
    id: 'fmt-agreement', category: 'Agreement', active: true,
    title: 'Agile Standard Service Agreement',
    body: `SERVICE AGREEMENT

This Agreement is made on {DATE} between:
Agile Security Force Private Limited ("Service Provider")
and {CLIENT_NAME}, {CLIENT_ADDRESS} ("Client").

1. SCOPE: The Service Provider shall deploy {NO_OF_GUARDS} security personnel at {SITE/LOCATION} on {SHIFT_DETAILS}.
2. CHARGES: Rs. {RATE_PER_GUARD} per guard per month + applicable GST. Wages as per prevailing State Minimum Wage.
3. STATUTORY: EPF, ESI and all statutory dues borne as per applicable law.
4. PRICE REVISION: Charges shall be revised on every Minimum Wage notification by the State Government, effective from the date of notification.
5. TERM: Valid for 12 months from {START_DATE}, renewable by mutual consent.
6. PAYMENT: Invoices payable within {CREDIT_DAYS} days.

For Agile Security Force Pvt. Ltd.        For {CLIENT_NAME}
Authorised Signatory                       Authorised Signatory`,
  },
  {
    id: 'fmt-thankyou', category: 'Email', active: true,
    title: 'Thank You Mail — PO / WO / LOI',
    body: `Subject: Thank You — Receipt of {PO/WO/LOI} — {CLIENT_NAME}

Dear {CONTACT_NAME},

We sincerely thank you for entrusting Agile Security Force Private Limited with your security requirements and for issuing {PO/WO/LOI No.} dated {DATE}.

We assure you of prompt deployment, disciplined & well-trained personnel, and dedicated supervision. Our operations team will contact you shortly to finalise the mobilisation plan on {DATE}.

We look forward to a long and successful association.

Warm regards,
{YOUR_NAME}
Agile Security Force Private Limited`,
  },
  {
    id: 'fmt-priceincrease', category: 'Letter', active: true,
    title: 'Price Increase Mail — Minimum Wage Revision',
    body: `Subject: Revision in Service Charges — Minimum Wage Notification dated {MW_DATE}

Dear {CONTACT_NAME},

As you are aware, the Government of {STATE} has revised the Minimum Wages vide notification dated {MW_DATE}, effective {EFFECTIVE_DATE}.

Accordingly, our service charges for {SITE/LOCATION} stand revised from Rs. {EXISTING_RATE} to Rs. {REVISED_RATE} per guard per month (plus applicable GST), with effect from {EFFECTIVE_DATE}, as per the price-revision clause of our agreement.

We request you to kindly take the revised rate on record and issue the amended PO/WO. We remain committed to serving you with the highest standards.

Warm regards,
{YOUR_NAME}
Agile Security Force Private Limited`,
  },
  {
    id: 'fmt-renewal', category: 'Letter', active: true,
    title: 'Contract Renewal Format',
    body: `Subject: Renewal of Security Services Agreement — {CLIENT_NAME}

Dear {CONTACT_NAME},

Our current Security Services Agreement for {SITE/LOCATION} is due for renewal on {RENEWAL_DATE}.

It has been our privilege to serve you. We propose to renew the agreement for a further period of 12 months on the existing terms, with charges aligned to the prevailing State Minimum Wage.

Kindly confirm your acceptance so we may issue the renewed agreement. We thank you for your continued trust in Agile Security Force.

Warm regards,
{YOUR_NAME}
Agile Security Force Private Limited`,
  },
]

export async function getReportsForDate(dateFor: string, branchesCached?: MisBranch[]): Promise<MisReport[]> {
  const branches = branchesCached ?? (await getBranches())
  const idx = await getJson<string[]>(reportIndexKey(dateFor), [])
  const scanIds = idx.length ? idx : branches.map((b) => b.id)
  const keys = scanIds.map((branchId) => reportKey(branchId, dateFor))
  const raw = await redisMget(keys)

  const found: MisReport[] = []
  const seen = new Set<string>()
  for (let i = 0; i < scanIds.length; i++) {
    const r = parseJson<MisReport | null>(raw[i], null)
    if (!r || seen.has(r.id)) continue
    seen.add(r.id)
    found.push(r)
  }

  const foundIds = [...found.map((r) => r.branchId)].sort().join(',')
  const idxSorted = [...idx].sort().join(',')
  if (foundIds !== idxSorted) {
    await setJson(reportIndexKey(dateFor), found.map((r) => r.branchId))
  }

  const nameById = new Map(branches.map((b) => [b.id, b.name]))
  return found.map((r) => ({
    ...r,
    branchName: nameById.get(r.branchId) ?? r.branchName,
  }))
}

export async function invalidateMdSummaryCache(dateFor: string): Promise<void> {
  const prefix = `mis:mdsummary:`
  await redis(['DEL', `${prefix}day:${dateFor}`, `${prefix}week:${misWeekStartMonday(dateFor)}`, `${prefix}month:${dateFor.slice(0, 7)}`])
}

export async function getCachedMdSummary<T>(cacheKey: string, build: () => Promise<T>, anchorDate?: string): Promise<T> {
  const cached = await getJson<{ ts: number; data: T } | null>(mdSummaryCacheKey(cacheKey), null)
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const ttl = anchorDate && anchorDate < today ? MD_SUMMARY_CACHE_HISTORICAL_MS : MD_SUMMARY_CACHE_MS
  if (cached && Date.now() - cached.ts < ttl) return cached.data
  const data = await build()
  await setJson(mdSummaryCacheKey(cacheKey), { ts: Date.now(), data })
  return data
}

/** Parallel fetch visits for multiple dates (dashboard week/month). */
export async function getVisitsMany(dates: string[]): Promise<MisVisit[]> {
  if (dates.length <= 1) return getVisits(dates[0] ?? '')
  const raw = await redisMget(dates.map((d) => visitsKey(d)))
  const out: MisVisit[] = []
  for (const s of raw) out.push(...parseJson<MisVisit[]>(s, []))
  return out
}

/** Fetch reports for many dates — uses report index (no full branch scan per day). */
export async function getReportsForDates(
  dates: string[],
  branchesCached?: MisBranch[],
): Promise<Map<string, MisReport[]>> {
  if (dates.length <= 1) {
    const d = dates[0] ?? new Date().toISOString().slice(0, 10)
    return new Map([[d, await getReportsForDate(d, branchesCached)]])
  }

  const branches = branchesCached ?? (await getBranches())
  const nameById = new Map(branches.map((b) => [b.id, b.name]))
  const want = new Set(dates)
  const known = (await getReportDates()).filter((d) => want.has(d))
  const scanDates = known.length ? known : dates.length <= 6 ? dates : known

  const indexes = await Promise.all(scanDates.map((d) => getJson<string[]>(reportIndexKey(d), [])))
  const keys: string[] = []
  const meta: { date: string; branchId: string }[] = []
  for (let i = 0; i < scanDates.length; i++) {
    const d = scanDates[i]
    const ids = indexes[i].length ? indexes[i] : dates.length <= 6 ? branches.map((b) => b.id) : []
    for (const branchId of ids) {
      keys.push(reportKey(branchId, d))
      meta.push({ date: d, branchId })
    }
  }

  const byDate = new Map<string, MisReport[]>()
  for (const d of dates) byDate.set(d, [])

  if (!keys.length) return byDate

  const raw = await redisMget(keys)
  const seen = new Set<string>()
  for (let i = 0; i < meta.length; i++) {
    const r = parseJson<MisReport | null>(raw[i], null)
    if (!r || seen.has(r.id)) continue
    seen.add(r.id)
    const list = byDate.get(meta[i].date) ?? []
    list.push({ ...r, branchName: nameById.get(r.branchId) ?? r.branchName })
    byDate.set(meta[i].date, list)
  }
  return byDate
}

/** Parallel fetch guard docs — single MGET batch. */
export async function getGuardDocsMany(branchIds: string[]): Promise<Map<string, MisGuardDoc[]>> {
  const branches = await getBranches()
  const keyOwners: { key: string; ownerId: string }[] = []
  for (const id of branchIds) {
    const branch = branches.find((b) => b.id === id)
    const ids = branch ? legacyBranchStorageId(id, branch.name) : [id]
    for (const sid of ids) keyOwners.push({ key: guardDocsKey(sid), ownerId: id })
  }
  const raw = await redisMget(keyOwners.map((k) => k.key))
  const out = new Map<string, MisGuardDoc[]>()
  for (const id of branchIds) out.set(id, [])
  for (let i = 0; i < keyOwners.length; i++) {
    const docs = parseJson<MisGuardDoc[]>(raw[i], [])
    if (!docs.length) continue
    const owner = keyOwners[i].ownerId
    if (!out.get(owner)?.length) out.set(owner, docs)
  }
  return out
}

/** Parallel fetch complaints — single MGET batch. */
export async function getComplaintsMany(branchIds: string[]): Promise<Map<string, MisComplaint[]>> {
  const keys = branchIds.map((id) => complaintsKey(id))
  const raw = await redisMget(keys)
  const out = new Map<string, MisComplaint[]>()
  branchIds.forEach((id, i) => out.set(id, parseJson<MisComplaint[]>(raw[i], [])))
  return out
}

// ---- Reminder log (HOD emails) --------------------------------------------
const reminderKey = (date: string, branchId: string) => `mis:reminder:${date}:${branchId}`

export async function getReminderTime(date: string, branchId: string): Promise<string | null> {
  const d = await redis(['GET', reminderKey(date, branchId)])
  return typeof d?.result === 'string' ? d.result : null
}

export async function setReminderTime(date: string, branchId: string, at: string): Promise<void> {
  await redis(['SET', reminderKey(date, branchId), at, 'EX', String(86400 * 3)])
}

export async function getReminderTimes(date: string, branchIds: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  await Promise.all(
    branchIds.map(async (id) => {
      const t = await getReminderTime(date, id)
      if (t) out[id] = t
    }),
  )
  return out
}

// ---- helpers ----------------------------------------------------------------
export function num(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}
export function nid(prefix = ''): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}
export function adminPassword(): string {
  return suiteAdminPassword()
}
