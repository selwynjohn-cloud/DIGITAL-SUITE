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
 *     sanctioned strength from the client master (and yesterday's Sanctioned),
 *     so branches only update today's Absent and OT.
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
  isHiTechCityBranch,
  isKrcHiTechClient,
  isVisakhapatnamBranch,
  isKakinadaBookClient,
  isKakinadaBranch,
  isKakinadaLeftoverClient,
  isSrmtClient,
  isTadaBranch,
  isTadaBookClient,
} from './client-branch.js'
import { normalizeToLacs } from '../inr-money.js'
import type { MisManpowerShortage } from './manpower-shortage.js'

export type { MisManpowerShortage } from './manpower-shortage.js'

export type MisBranch = { id: string; name: string; pin: string; active: boolean }

export type MisClient = {
  id: string
  branchId: string
  name: string
  location: string
  staffName: string
  /** Client work email — Client door PIN. Not money / internal notes. */
  clientEmail?: string
  sanA: number // A / Day shift
  sanG: number // General shift
  sanB: number // B shift
  sanC: number // C / Night shift
  slaDayVisit: string
  slaNightCheck: string
  uniformIssued: string
  rainGearIssued: string
  equipmentIssued: string
  /** 1–5 stars (SLA / cadence). Business tier = Standard/Cluster/Enterprise/Apex from footprint + Apex list. */
  starRating: number
  highValue: boolean
  /** Computed on read — Standard | Cluster | Enterprise | Apex (not always persisted). */
  businessTier?: 'standard' | 'cluster' | 'enterprise' | 'apex'
  active: boolean
  /** agile = ASFPL · sparks = SSMS — for recruitment company filter */
  entity?: 'agile' | 'sparks' | ''
  /** Minimum Wage compliant — branch HOD Yes/No for Client Performance. */
  mwCompliant?: 'yes' | 'no' | ''
  /** Client monthly bill (₹ lakhs) — branch manual for Client Performance. */
  monthlyBillLacs?: number
  /** Balance to be paid (₹ lakhs) — branch manual for Client Performance. */
  balanceToPayLacs?: number
  /** GPS from HDFC SSA / field visit — for India road map later */
  geoLat?: number
  geoLng?: number
  geoCapturedAt?: string
  geoSource?: string
  /** Director freeze — Daily MIS 14-08-2026 book. Geo / restore must not move this site. */
  branchFrozen?: boolean
}

export type ClientBookFreeze = {
  date: string
  at: string
  submitted: number
  moved: number
  added: number
  deactivated: number
  /** Kakinada uses Daily MIS 12-08-2026, not the 14-08 book. */
  kakinadaDate?: string
  kakinadaSites?: string[]
  branches: Array<{ id: string; name: string; sites: number; active: number }>
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
  /** Stores · HR · RECRUITMENT · etc. — for support staff only */
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
  /** ID card issue date — validity auto-set to +1 year when saved */
  idCardIssueDate: string
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
  /** Patrol point name from mobile visit / patrol report */
  patrolPoint?: string
  /** Distance travelled on patrol (e.g. "2.4 km") */
  kmTravelled?: string
  fromMobile?: boolean
}

/** Late start or left post case from Agile Mobile / Work360. */
export type MisDutyIncident = {
  id: string
  date: string
  guardName: string
  employeeId: string
  /** Guard mobile (10 digits) — for Call / WhatsApp warning */
  mobile?: string
  client: string
  unit: string
  shift: string
  incidentTime: string
  type: 'late_start' | 'out_of_post'
  remarks: string
  /** Actual duty start / punch time (late start cases) */
  dutyStartTime?: string
  /** Scheduled shift start time (late start cases) */
  scheduledTime?: string
  /** Distance away from post (out of location cases, e.g. "0.8 km") */
  kmFromPost?: string
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
  /** Friday OST current-month collected (lakhs). Weekly Mon–Sat must never change this. */
  ostCollected?: number
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
  'Missing',
  'Incident',
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
  /** Unique reference e.g. Agile - TCS-JUL-00042 22/07/2026 */
  code?: string
  branchId: string
  clientName: string
  location: string
  incidentDate: string
  type: string // Client / Guard
  description: string
  actionTaken: string
  momWithin24h: boolean
  status: string // Open / Closed / Reopened
  reportedBy: string
  /** manual | inbox | web | branch | phone */
  source?: string
  /** Phone | Help Desk | Control | Operations | Email | Mail | WhatsApp | Web */
  channel?: string
  /** Nature of complaint (dropdown) */
  nature?: string
  contactEmail?: string
  contactPhone?: string
  /** What action / resolution is expected */
  expectedAction?: string
  /** Staff / HOD assigned to handle the case (display name) */
  assignedTo?: string
  /** Assignee email for assignment mail */
  assigneeEmail?: string
  /** Branch / department of assignee */
  assigneeDept?: string
  /** Expected date of closure (YYYY-MM-DD) */
  edc?: string
  /** Corrective action plan (assignee text — visible to all when filled) */
  correctiveActionPlan?: string
  /** How to avoid reoccurrence */
  avoidRecurrence?: string
  /** ISO date when marked resolved / closed */
  resolvedOn?: string
  /** ISO date when completion report was sent */
  completionReportSentOn?: string
  /** Gmail message id — prevents duplicate imports */
  emailId?: string
  fromEmail?: string
  subject?: string
  importedAt?: string
  /** ISO timestamp when complaint was first registered */
  registeredAt?: string
  /** ISO datetime when client mail was received in Director inbox */
  mailReceivedAt?: string
  /** false = archived / hidden — record kept */
  active?: boolean
  /** This row is a reopen copy of another complaint */
  reopenedFromId?: string
  /** ISO time when this reopen copy was created (sorts to top) */
  reopenedAt?: string
  /** Old row marked after reopen — button shows Reopened, row faded */
  reopenLabel?: 'reopened'
  /** Id of the new open copy that superseded this row */
  supersededById?: string
}

/** True if a document value means the document is present/valid (not pending / to-collect). */
export function docPresent(v: string): boolean {
  const s = String(v ?? '').trim().toUpperCase()
  if (!s) return false
  if (
    /PENDING|TO BE COLLECTED|UNDER PROCESS|RENEWAL UNDER|NO CERTIFICATE|NOT APPLIED|EXPIRED|UNFIT|N\/A|^NA$|^NIL$|^-$/.test(
      s,
    )
  ) {
    return false
  }
  if (['VALID', 'FIT', 'CERTIFIED', 'APPLIED', 'YES', 'Y', 'DONE', 'ACTIVE', 'OK'].includes(s)) return true
  // ISO / common Indian date forms (incl. DD.MM.YYYY)
  if (/^\d{4}[-/.]\d{2}[-/.]\d{2}$/.test(s)) return true
  if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(s)) return true
  return false
}

/** True if status or validity date shows a real PVC / Medical / Training document. */
export function guardDocPresent(status: string, validity = ''): boolean {
  return docPresent(status) || docPresent(validity)
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
  /** Consolidated collection % — Friday OST current-month billing collected only (10th–10th). Weekly must not change this. */
  consolidatedCollectionPct?: string
  /** Operations day visits (from Agile Mobile or manual) */
  dayVisits?: string
  /** Night checks — Night Visit (check) report, else Agile Mobile */
  nightChecks?: string
  /** Training visits / trained sites (from Agile Mobile or Night Visit / OJT) */
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
  /** HOD certified figures verified before final submit. */
  certified?: boolean
  certifiedAt?: string
  rows: MisDeployRow[]
  summary: MisSummary
  /** Step 2 — role-wise manpower shortage (branch entry). */
  manpowerShortage?: MisManpowerShortage
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
const CLIENT_BOOK_FREEZE_KEY = 'mis:client-books:frozen'
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
  if (/gujarat|surat/i.test(n) && !/mumbai|maharashtra/i.test(n)) ids.add('b_surat')
  if (/madhya/i.test(n)) ids.add('b_madhya')
  if (/maharashtra|mumbai/i.test(n) && !/surat|gujarat/i.test(n)) ids.add('b_maharashtra')
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
const collectionBaselineKey = (weekStart: string) => `mis:collection-baseline:${weekStart}`

/** June'26 OST footer baseline — branches + banking consolidated totals. */
export type MisCollectionBaseline = {
  weekStart: string
  /** Footer totals in ₹ thousands (K) — all branches + banking */
  billingK: number
  collectedK: number
  /** Total Amount column (multi-month outstanding) in ₹ thousands */
  outstandingK?: number
  recoveryPct: number
  /** Banking slice from OST (₹ lakhs) — included in company % but not branch grid */
  bankingBillingL?: number
  bankingOutstandingL?: number
  source: string
  importedAt: string
}
const complaintsKey = (branchId: string) => `mis:complaints:${branchId}`
const DIRECTOR_INBOX_KEY = 'mis:complaints:director-inbox'
const PROCESSED_COMPLAINT_EMAILS_KEY = 'mis:complaint-emails'
const COMPLAINT_SEQ_KEY = 'mis:complaint-seq'
const reportKey = (branchId: string, dateFor: string) => `mis:report:${branchId}:${dateFor}`
const reportIndexKey = (dateFor: string) => `mis:reportindex:${dateFor}`
const lastReportKey = (branchId: string) => `mis:lastreport:${branchId}`
const MD_SUMMARY_CACHE_MS = 600_000
const MD_SUMMARY_CACHE_HISTORICAL_MS = 3_600_000
/** Bump when dashboard payload shape changes (forces Redis cache refresh). */
const MD_SUMMARY_CACHE_VERSION = 15
const mdSummaryCacheKey = (key: string) => `mis:mdsummary:v${MD_SUMMARY_CACHE_VERSION}:${key}`
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
export const USER_ROLES = [
  'Director',
  'President',
  'Admin',
  'CGM',
  'Vice President (VP)',
  'AVP',
  'General Manager (GM)',
  'Regional Manager (RM)',
  'Branch Manager',
  'Operations Manager',
  'Area Manager',
  'Field Officer',
  'Sales Executive',
  'Training Team',
  'Accounts',
  'HR',
]
export const DOC_CATEGORIES = ['Master Agreement', 'MW Notification', 'Tender Document', 'PSARA Licence', 'GST / PF / ESI', 'Client Contract', 'Policy / SOP', 'Previous Tender Data', 'Other']

export const DEFAULT_BRANCHES: MisBranch[] = [
  'Bangalore',
  'Bhopal',
  'Chennai',
  'Corporate Office',
  'Hi-Tech City',
  'Hyderabad-A',
  'Hyderabad-B',
  'Kakinada',
  'Kochi',
  'Mumbai',
  'Nellore',
  'Puducherry',
  'Surat',
  'Tada',
  'Tadipatri',
  'Tirupati',
  'Training Academy',
  'Vijayawada',
  'Visakhapatnam',
].map((name, i) => ({ id: `br${i + 1}`, name, pin: suiteBranchPin(), active: true }))

/** Ensure Corporate Office exists for Fleet / branch login (idempotent). */
export async function ensureCorporateOfficeBranch(): Promise<MisBranch | null> {
  const all = await getBranches(false)
  const existing = all.find((b) => /corporate\s*office/i.test(String(b.name || '')))
  if (existing) {
    if (existing.active === false) {
      const next = all.map((b) => (b.id === existing.id ? { ...b, active: true, name: 'Corporate Office' } : b))
      await saveBranches(next)
      return { ...existing, active: true, name: 'Corporate Office' }
    }
    return existing
  }
  const row: MisBranch = {
    id: 'br-corporate-office',
    name: 'Corporate Office',
    pin: suiteBranchPin(),
    active: true,
  }
  await saveBranches([...all, row])
  return row
}

/** Ensure Training Academy exists for Fleet weekly report login (not daily MIS). */
export async function ensureTrainingAcademyBranch(): Promise<MisBranch | null> {
  const all = await getBranches(false)
  const existing = all.find((b) => /training\s*academy/i.test(String(b.name || '')))
  if (existing) {
    if (existing.active === false) {
      const next = all.map((b) =>
        b.id === existing.id ? { ...b, active: true, name: 'Training Academy' } : b,
      )
      await saveBranches(next)
      return { ...existing, active: true, name: 'Training Academy' }
    }
    if (existing.name !== 'Training Academy') {
      const next = all.map((b) => (b.id === existing.id ? { ...b, name: 'Training Academy' } : b))
      await saveBranches(next)
      return { ...existing, name: 'Training Academy' }
    }
    return existing
  }
  const row: MisBranch = {
    id: 'br-training-academy',
    name: 'Training Academy',
    pin: suiteBranchPin(),
    active: true,
  }
  await saveBranches([...all, row])
  return row
}

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

export async function getClientBookFreeze(): Promise<ClientBookFreeze | null> {
  return getJson<ClientBookFreeze | null>(CLIENT_BOOK_FREEZE_KEY, null)
}

export async function saveClientBookFreeze(stamp: ClientBookFreeze): Promise<boolean> {
  return setJson(CLIENT_BOOK_FREEZE_KEY, stamp)
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

/**
 * Non-operations units — not Daily MIS reporting.
 * Training / Recruitment / IT / Corporate keep their own apps (OJT, DRR, Fleet, etc.).
 */
const NON_MIS_REPORTING_NAME =
  /corporate\s*office|training\s*(academy|department|dept)|recruitment\s*(department|dept)|it\s*department|^lucknow$/i

export function isMisReportingBranch(branch: Pick<MisBranch, 'id' | 'name'> | string): boolean {
  if (typeof branch === 'string') {
    return !NON_MIS_REPORTING_NAME.test(branch.trim())
  }
  const name = String(branch.name ?? '').trim()
  const id = String(branch.id ?? '').trim()
  if (NON_MIS_REPORTING_NAME.test(name)) return false
  if (
    id === 'br-corporate-office' ||
    id === 'br-training-academy' ||
    id === 'br-training-department' ||
    id === 'br-lucknow' ||
    id.startsWith('recruit-dept:') ||
    id.startsWith('recruit-centre:')
  ) {
    return false
  }
  return true
}

/** Active operations branches that submit Daily MIS (excludes Training / Recruitment / HQ). */
export async function getMisReportBranches(onlyActive = true): Promise<MisBranch[]> {
  return (await getBranches(onlyActive)).filter(isMisReportingBranch)
}

export async function getActiveBranch(branchId: string): Promise<MisBranch | null> {
  const id = String(branchId ?? '').trim()
  if (!id) return null
  const list = await getBranches(true)
  const byId = list.find((b) => b.id === id)
  if (byId) return byId
  const lower = id.toLowerCase()
  const byName = list.find((b) => String(b.name ?? '').trim().toLowerCase() === lower)
  if (byName) return byName
  const hyd = id.match(/hyd(?:erabad)?[\s_-]*(?:zone[\s_-]*)?([ab])\b/i)
  if (hyd) {
    const want = hyd[1].toUpperCase() === 'A' ? 'hyderabad-a' : 'hyderabad-b'
    return (
      list.find((b) =>
        String(b.name ?? '')
          .trim()
          .toLowerCase()
          .replace(/[\s_]+/g, '-') === want,
      ) ?? null
    )
  }
  return null
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

function clientSiteKey(name: string, location: string): string {
  return `${String(name ?? '')
    .trim()
    .toUpperCase()}|${String(location ?? '')
    .trim()
    .toUpperCase()}`
}

function deployRowsSanTotal(rows: { sanA?: number; sanG?: number; sanB?: number; sanC?: number }[]): number {
  return rows.reduce(
    (sum, r) => sum + num(r.sanA) + num(r.sanG) + num(r.sanB) + num(r.sanC),
    0,
  )
}

function clientsSanTotal(list: MisClient[]): number {
  return list.reduce((sum, c) => sum + num(c.sanA) + num(c.sanG) + num(c.sanB) + num(c.sanC), 0)
}

/** Director 18 Aug 2026: every branch Master Directory stays A–Z by client name, then site. */
export function sortClientsAlpha(list: MisClient[]): MisClient[] {
  return [...list].sort((a, b) => {
    const an = String(a.name || '')
      .trim()
      .toUpperCase()
    const bn = String(b.name || '')
      .trim()
      .toUpperCase()
    if (an < bn) return -1
    if (an > bn) return 1
    const al = String(a.location || '')
      .trim()
      .toUpperCase()
    const bl = String(b.location || '')
      .trim()
      .toUpperCase()
    if (al < bl) return -1
    if (al > bl) return 1
    return String(a.id || '').localeCompare(String(b.id || ''))
  })
}

/**
 * Fill missing Master Directory sites from the strongest recent Daily MIS report.
 * Must merge even when some sites already exist — a partial shard (e.g. Hyd-B 591 of 862)
 * used to stop restore early and leave clients permanently missing from Step 1.
 */
async function restoreClientsFromLastReport(
  branchId: string,
  branches: MisBranch[],
  all: MisClient[],
): Promise<MisClient[]> {
  const frozenBook = await getClientBookFreeze()
  // 12-08 Kakinada file is NRI/SRMT only — do not rebuild the plant/bank book from it.
  if (isKakinadaBranch(branchId, branches) && frozenBook?.date) return all
  let last = frozenBook?.date
    ? await getReport(branchId, frozenBook.date)
    : await getLastReportFlexible(branchId, '9999-12-31', branches)
  if (frozenBook?.date && (!last?.rows?.length || !String(last.submittedAt || '').trim())) {
    last = await getLastReportFlexible(branchId, '9999-12-31', branches)
  }
  if (!frozenBook?.date) {
    try {
      const base = new Date()
      const dates: string[] = []
      for (let i = 0; i <= 21; i++) {
        const d = new Date(base)
        d.setDate(d.getDate() - i)
        dates.push(d.toISOString().slice(0, 10))
      }
      const reports = await Promise.all(dates.map((key) => getReport(branchId, key)))
      let bestSan = last ? deployRowsSanTotal(last.rows || []) : -1
      let bestRows = last?.rows?.length || 0
      for (const r of reports) {
        if (!r?.rows?.length) continue
        const san = deployRowsSanTotal(r.rows)
        if (san > bestSan || (san === bestSan && r.rows.length > bestRows)) {
          last = r
          bestSan = san
          bestRows = r.rows.length
        }
      }
    } catch {
      /* keep flexible last */
    }
  }
  if (!last?.rows?.length) return all

  const freezeKeys = new Set(
    (last.rows || []).map((row) =>
      clientSiteKey(String(row.clientName ?? ''), String(row.location ?? '')),
    ),
  )
  /**
   * Director 18 Aug 2026: HODs may add / edit / deactivate their branch Master Directory.
   * Do NOT auto-deactivate sites missing from the freeze-date report — that wiped HOD work.
   * Freeze date remains the heal source only. Hyd-A still excludes Hyd-B contested keys below.
   */
  const scopeBranch = branches.find((b) => b.id === branchId || b.name === branchId)
  if (
    frozenBook?.date &&
    scopeBranch &&
    /hyderabad\s*-?\s*a/i.test(scopeBranch.name)
  ) {
    const hydB = branches.find((b) => /hyderabad\s*-?\s*b/i.test(String(b.name || '')))
    if (hydB) {
      const bReport = await getReport(hydB.id, frozenBook.date)
      if (bReport?.rows?.length && String(bReport.submittedAt || '').trim()) {
        for (const row of bReport.rows) {
          freezeKeys.delete(
            clientSiteKey(String(row.clientName ?? ''), String(row.location ?? '')),
          )
        }
      }
    }
  }

  const existing = filterClientsForBranch(all, branchId, branches).filter((c) => c.active !== false)
  const keys = new Set(existing.map((c) => clientSiteKey(c.name, c.location)))
  const existingSan = clientsSanTotal(existing)
  /** When frozen, expected book = freezeKeys (Hyd-A already excludes Hyd-B contested sites). */
  const expectedRows =
    frozenBook?.date && freezeKeys.size > 0
      ? (last.rows || []).filter((row) =>
          freezeKeys.has(clientSiteKey(String(row.clientName ?? ''), String(row.location ?? ''))),
        )
      : last.rows || []
  const lastSan = deployRowsSanTotal(expectedRows)
  // Nothing missing and strength already at/above best report — leave alone.
  if (existing.length >= expectedRows.length && existingSan >= lastSan) return all

  const out = [...all]
  let added = false
  for (const row of expectedRows) {
    const name = String(row.clientName ?? '').trim()
    if (!name) continue
    const location = String(row.location ?? '').slice(0, 120)
    // Never re-import non-KRC sites onto Hi-Tech City from an old fat report.
    if (
      isHiTechCityBranch(branchId, branches) &&
      !isKrcHiTechClient({ name, location })
    ) {
      continue
    }
    if (isVisakhapatnamBranch(branchId, branches) && isKakinadaBookClient({ name, location })) {
      continue
    }
    if (isKakinadaBranch(branchId, branches) && isKakinadaLeftoverClient({ name, location })) {
      continue
    }
    if (isKakinadaBranch(branchId, branches) && isSrmtClient({ name, location })) {
      continue
    }
    if (isTadaBranch(branchId, branches) && !isTadaBookClient({ name, location })) {
      continue
    }
    const key = clientSiteKey(name, location)
    /** Frozen books: never re-add contested / pruned keys (Hyd-A must not regain Hyd-B sites). */
    if (frozenBook?.date && freezeKeys.size > 0 && !freezeKeys.has(key)) continue
    if (keys.has(key)) continue
    keys.add(key)
    out.push({
      id: nid('cl'),
      branchId,
      name,
      location,
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
      branchFrozen: Boolean(frozenBook?.date),
    })
    added = true
  }
  if (added) {
    const fixed = ensureUniqueClientIds(out).list
    const branchOnlyRows = fixed.filter((c) => clientMatchesBranch(c.branchId, branchId, branches))
    await saveClients(branchOnlyRows, { branchOnly: branchId })
    return fixed
  }
  return all
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
  // LOCK 13 Aug 2026: never call dedupeMisBranches here — that re-joined Nellore+Tada etc.
  try {
    const { splitLegacyCombinedBranchNames, ensureIndependentOpsBranches } = await import('./branch-dedupe.js')
    await ensureIndependentOpsBranches()
    const split = await splitLegacyCombinedBranchNames()
    branchesMerged = (split.renamed?.length ?? 0) + (split.deactivated?.length ?? 0) > 0
  } catch {
    /* non-fatal */
  }
  try {
    const { freezeClientBooksFromReport, CLIENT_BOOK_FREEZE_DATE } = await import('./client-book-freeze.js')
    const frozen = await getClientBookFreeze()
    if (!frozen?.date) {
      await freezeClientBooksFromReport(CLIENT_BOOK_FREEZE_DATE)
    }
  } catch {
    /* non-fatal */
  }
  try {
    const frozen = await getClientBookFreeze()
    if (frozen?.date) return { sites, staff, compacted, branchesMerged }
    const fresh = await getBranches()
    const { reassignClientsBySiteGeo } = await import('./client-branch-geo-resolve.js')
    const allClients = await loadAllClientsMerged(fresh)
    const moved = reassignClientsBySiteGeo(allClients, fresh)
    if (moved.moved > 0) await saveClients(moved.clients, { force: true })
  } catch {
    /* non-fatal */
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

/** Fast read: one branch shard (+ legacy keys) — no full-directory rewrite. */
async function loadBranchClientShard(
  branchId: string,
  branches: MisBranch[],
): Promise<MisClient[]> {
  const branch = branches.find((b) => b.id === branchId)
  const keys = new Set<string>([clientsKey(branchId)])
  if (branch) {
    for (const id of legacyBranchStorageId(branchId, branch.name)) {
      keys.add(clientsKey(id))
    }
  }
  const raw = await redisMget([...keys])
  const byId = new Map<string, MisClient>()
  for (const s of raw) {
    for (const c of parseJson<MisClient[]>(s, [])) {
      const id = String(c.id ?? '').trim()
      if (id) byId.set(id, c)
      else byId.set(`${c.name}|${c.location}|${byId.size}`, c)
    }
  }
  return [...byId.values()]
}

export async function getClients(
  branchId?: string,
  opts?: { skipRepair?: boolean; allowRestore?: boolean; branches?: MisBranch[] },
): Promise<MisClient[]> {
  const branches = opts?.branches ?? (await getBranches())

  /**
   * Director 18 Aug 2026: Daily MIS / skipRepair must NEVER auto-heal or reshape the client list.
   * Incomplete-vs-report fall-through used to re-add freeze sites mid-submit and break HODs.
   */
  if (branchId && opts?.skipRepair) {
    const shard = await loadBranchClientShard(branchId, branches)
    const forBranch = sortClientsAlpha(sitesForBranch(shard, branchId, branches, false))
    if (forBranch.filter((c) => c.active !== false).length > 0) return forBranch
    // Empty shard only — fall through to merged load (still no restore unless allowRestore).
  }

  let all = await loadAllClientsMerged(branches)
  const normalized = normalizeClientBranchIds(all, branches)
  const fixed = ensureUniqueClientIds(normalized.list)
  all = fixed.list
  if (!opts?.skipRepair && (normalized.changed || fixed.changed)) {
    await saveClients(all)
  }
  if (branchId) {
    /** Auto-restore only when explicitly requested (repair jobs) — never on Daily MIS / portal reads. */
    if (opts?.allowRestore === true) {
      all = await restoreClientsFromLastReport(branchId, branches, all)
    }
    return sortClientsAlpha(sitesForBranch(all, branchId, branches, false))
  }
  return sortClientsAlpha(all)
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
  const freezeOn = await getClientBookFreeze()
  const stamped = freezeOn?.date
    ? fixed.list.map((c) => (c.branchFrozen ? c : { ...c, branchFrozen: true }))
    : fixed.list
  /** Persist each branch bucket in alphabetical order (stable Daily MIS + Master Directory). */
  const ok = await setJson(CLIENTS_KEY, sortClientsAlpha(stamped))
  const buckets = new Map<string, MisClient[]>()
  for (const c of stamped) {
    const bid = String(c.branchId ?? '').trim()
    if (!bid) continue
    if (!buckets.has(bid)) buckets.set(bid, [])
    buckets.get(bid)!.push(c)
  }
  for (const [bid, part] of buckets) {
    await setJson(clientsKey(bid), sortClientsAlpha(part))
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

/** Add or update one client in the Data Bank (HOD branch Master Directory). Never deletes history. */
export async function upsertClient(client: MisClient): Promise<MisClient | null> {
  if (!client.branchId) return null
  const branches = await getBranches()
  const all = await getClients(undefined, { skipRepair: true, branches })
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
    clientEmail: String(client.clientEmail ?? prev?.clientEmail ?? '').trim().toLowerCase().slice(0, 200),
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
    geoLat:
      client.geoLat !== undefined && Number.isFinite(Number(client.geoLat))
        ? Number(client.geoLat)
        : prev?.geoLat !== undefined && Number.isFinite(Number(prev.geoLat))
          ? Number(prev.geoLat)
          : undefined,
    geoLng:
      client.geoLng !== undefined && Number.isFinite(Number(client.geoLng))
        ? Number(client.geoLng)
        : prev?.geoLng !== undefined && Number.isFinite(Number(prev.geoLng))
          ? Number(prev.geoLng)
          : undefined,
    geoCapturedAt: String(client.geoCapturedAt ?? prev?.geoCapturedAt ?? '').slice(0, 40) || undefined,
    geoSource: String(client.geoSource ?? prev?.geoSource ?? '').slice(0, 40) || undefined,
    branchFrozen: prev?.branchFrozen === true || client.branchFrozen === true,
  }
  const idx = all.findIndex((c) => c.id === id)
  if (idx >= 0) {
    if (prev && prev.branchId !== client.branchId) {
      /** Do not silently move another branch’s row — HOD edits stay on their branch. */
      return null
    }
    all[idx] = row
  } else {
    all.push(row)
  }
  const branchOnly = all.filter((c) => clientMatchesBranch(c.branchId, client.branchId, branches))
  const ok = await saveClients(branchOnly, { branchOnly: client.branchId, force: true })
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

/** Save GPS from HDFC SSA onto Master Directory client (for India road map). Does not move branch. */
export async function saveClientGeoFromAssessment(opts: {
  clientId: string
  branchId: string
  lat: number
  lng: number
  capturedAt?: string
  source?: string
}): Promise<{ ok: boolean; error?: string }> {
  const clientId = String(opts.clientId || '').trim()
  const branchId = String(opts.branchId || '').trim()
  const lat = Number(opts.lat)
  const lng = Number(opts.lng)
  if (!clientId || !branchId) return { ok: false, error: 'Missing client or branch.' }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { ok: false, error: 'Invalid coordinates.' }
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return { ok: false, error: 'Coordinates out of range.' }
  const branches = await getBranches()
  const all = await getClients(undefined, { skipRepair: true, branches })
  const idx = all.findIndex((c) => c.id === clientId && c.branchId === branchId)
  if (idx < 0) return { ok: false, error: 'Client not found on this branch.' }
  const now = opts.capturedAt || new Date().toISOString()
  all[idx] = {
    ...all[idx],
    geoLat: Math.round(lat * 1e6) / 1e6,
    geoLng: Math.round(lng * 1e6) / 1e6,
    geoCapturedAt: now.slice(0, 40),
    geoSource: String(opts.source || 'hdfc-ssa').slice(0, 40),
  }
  const branchRows = all.filter((c) => c.branchId === branchId)
  const ok = await saveClients(branchRows, { branchOnly: branchId, force: true })
  return ok ? { ok: true } : { ok: false, error: 'Could not save client geo.' }
}

export async function setClientActive(branchId: string, clientId: string, active: boolean): Promise<boolean> {
  const branches = await getBranches()
  const all = await getClients(undefined, { skipRepair: true, branches })
  const id = String(clientId ?? '').trim()
  if (!id) return false
  const matches = all.filter((x) => x.id === id && clientMatchesBranch(x.branchId, branchId, branches))
  if (!matches.length) return false
  let changed = false
  for (const c of matches) {
    if (c.active !== active) {
      c.active = active
      changed = true
    }
  }
  if (!changed) return true
  const branchRows = all.filter((c) => clientMatchesBranch(c.branchId, branchId, branches))
  return saveClients(branchRows, { branchOnly: branchId, force: true })
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
  const branches = await getBranches()
  const branch = branches.find((b) => b.id === branchId)
  const ids = branch ? legacyBranchStorageId(branchId, branch.name) : [branchId]
  let best: MisGuard[] = []
  for (const id of ids) {
    const list = await getJson<MisGuard[]>(guardsKey(id), [])
    if (list.length > best.length) best = list
  }
  return best
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
export async function getCollectionBaseline(weekStart: string): Promise<MisCollectionBaseline | null> {
  return getJson<MisCollectionBaseline | null>(collectionBaselineKey(weekStart), null)
}

/**
 * Latest Friday OST footer — this week, then previous weeks.
 * Weekly collection rows must not be used as a stand-in.
 */
export async function getLatestOstBaseline(weekStart?: string): Promise<MisCollectionBaseline | null> {
  const weeks: string[] = []
  let w = String(weekStart || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(w)) {
    const { misTodayIst, misWeekStartMonday } = await import('./dates.js')
    w = misWeekStartMonday(misTodayIst())
  }
  weeks.push(w)
  for (let i = 0; i < 4; i++) {
    const prev = weeks[weeks.length - 1]
    const [yy, mm, dd] = prev.split('-').map(Number)
    const d = new Date(yy, mm - 1, dd)
    d.setDate(d.getDate() - 7)
    weeks.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    )
  }
  let best: MisCollectionBaseline | null = null
  for (const key of weeks) {
    const b = await getCollectionBaseline(key)
    const pct = Number(b?.recoveryPct) || 0
    if (!b || !(pct > 0) || pct >= 99) continue
    if (!best || String(b.importedAt || '') > String(best.importedAt || '')) best = b
  }
  if (best) return best
  const { LATEST_OST_FOOTER } = await import('./collection-import.js')
  return {
    weekStart: w,
    billingK: LATEST_OST_FOOTER.billingK,
    collectedK: LATEST_OST_FOOTER.collectedK,
    outstandingK: LATEST_OST_FOOTER.outstandingK,
    recoveryPct: LATEST_OST_FOOTER.recoveryPct,
    source: LATEST_OST_FOOTER.source,
    importedAt: LATEST_OST_FOOTER.asOn,
  }
}
export async function saveCollectionBaseline(baseline: MisCollectionBaseline): Promise<boolean> {
  return setJson(collectionBaselineKey(baseline.weekStart), baseline)
}
export async function saveCollections(weekStart: string, list: MisCollection[]): Promise<boolean> {
  const existing = await getCollections(weekStart)
  const byId: Record<string, MisCollection> = {}
  for (const c of existing) byId[c.branchId] = c
  for (const c of list) byId[c.branchId] = c
  const merged = Object.values(byId)
  const ok = await setJson(collectionsKey(weekStart), merged)
  if (ok) await invalidateMdSummaryCache(weekStart)
  return ok
}
export async function getComplaints(branchId: string): Promise<MisComplaint[]> {
  return getJson<MisComplaint[]>(complaintsKey(branchId), [])
}
export async function saveComplaints(branchId: string, list: MisComplaint[]): Promise<boolean> {
  return setJson(complaintsKey(branchId), list)
}

const MONTH_CODES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] as const

/** First 3 letters of client name (A–Z), padded with X if short. */
export function clientCodeLetters(clientName: string): string {
  const letters = String(clientName ?? '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
  return (letters + 'XXX').slice(0, 3)
}

function parseComplaintWhen(iso?: string): Date {
  const raw = String(iso ?? '').trim()
  if (!raw) return new Date()
  const d = new Date(raw.includes('T') || raw.includes(' ') ? raw : `${raw}T12:00:00`)
  return Number.isNaN(d.getTime()) ? new Date() : d
}

/** DD/MM/YYYY in Asia/Kolkata for the mail / phone received moment. */
export function complaintCodeDatePart(iso?: string): string {
  const d = parseComplaintWhen(iso)
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).formatToParts(d)
    const day = parts.find((p) => p.type === 'day')?.value || '01'
    const month = parts.find((p) => p.type === 'month')?.value || '01'
    const year = parts.find((p) => p.type === 'year')?.value || String(d.getFullYear())
    return `${day}/${month}/${year}`
  } catch {
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return `${day}/${month}/${d.getFullYear()}`
  }
}

/** 3-letter month code when mail was received (Asia/Kolkata). */
export function complaintCodeMonthPart(iso?: string): string {
  const d = parseComplaintWhen(iso)
  try {
    const m = Number(
      new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', month: 'numeric' }).format(d),
    )
    return MONTH_CODES[(m || 1) - 1] || 'XXX'
  } catch {
    return MONTH_CODES[d.getMonth()] || 'XXX'
  }
}

/**
 * Agile - &lt;3 client letters&gt;-&lt;MMM&gt;-&lt;00000&gt; &lt;DD/MM/YYYY&gt;
 * Example: Agile - TCS-JUL-00042 22/07/2026
 */
export function formatAgileComplaintCode(clientName: string, mailReceivedAt: string | undefined, seq: number): string {
  const client = clientCodeLetters(clientName)
  const mon = complaintCodeMonthPart(mailReceivedAt)
  const n = String(Math.max(0, seq)).padStart(5, '0')
  const datePart = complaintCodeDatePart(mailReceivedAt)
  return `Agile - ${client}-${mon}-${n} ${datePart}`
}

/** Next global complaint reference — Agile - ABC-JUL-00042 22/07/2026 */
export async function nextComplaintCode(clientName?: string, mailReceivedAt?: string): Promise<string> {
  const d = await redis(['INCR', COMPLAINT_SEQ_KEY])
  const seq = typeof d?.result === 'number' ? d.result : Math.floor(Date.now() / 1000) % 100000
  return formatAgileComplaintCode(clientName || 'XXX', mailReceivedAt || new Date().toISOString(), seq)
}

export async function ensureComplaintCodes(list: MisComplaint[]): Promise<MisComplaint[]> {
  const out: MisComplaint[] = []
  for (const c of list) {
    const when = String(c.mailReceivedAt || c.registeredAt || c.incidentDate || '').trim() || new Date().toISOString()
    const code =
      String(c.code ?? '').trim() || (await nextComplaintCode(c.clientName || 'XXX', when))
    const registeredAt = String(c.registeredAt ?? '').trim() || when
    out.push({ ...c, code, registeredAt, mailReceivedAt: c.mailReceivedAt || when })
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

/** Director/Admin: unlock a submitted report so the branch can edit and resubmit (keeps saved data). */
export async function reopenSubmittedMisReport(
  branchId: string,
  dateFor: string,
): Promise<{ ok: true; branchName: string } | { ok: false; error: string }> {
  const report = await getReport(branchId, dateFor)
  if (!report) return { ok: false, error: 'No report found for this branch and date.' }
  if (!String(report.submittedAt ?? '').trim()) {
    return { ok: false, error: 'Report is already open as a draft — branch can edit and submit.' }
  }
  const { normalizeDeployRow } = await import('./deploy-math.js')
  const rows = (report.rows || []).map((r) => normalizeDeployRow({ ...r }) as typeof r)
  const draft: MisReport = { ...report, rows, submittedAt: '' }
  const ok = await saveDraftReport(draft)
  if (!ok) return { ok: false, error: 'Could not reopen report. Please try again.' }
  await invalidateMdSummaryCache(dateFor)
  return { ok: true, branchName: report.branchName || branchId }
}

const VACANCY_CARRY_LOOKBACK_DAYS = 7

function ymdDaysBefore(beforeDate: string, days: number): string[] {
  const base = new Date(beforeDate + 'T00:00:00')
  const dates: string[] = []
  for (let i = 1; i <= days; i++) {
    const d = new Date(base)
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

/** Recent Daily MIS rows before a date (nearest first). Used to unwrap copied Absent. */
export async function getReportsBefore(
  branchId: string,
  beforeDate: string,
  days = VACANCY_CARRY_LOOKBACK_DAYS,
): Promise<MisReport[]> {
  const dates = ymdDaysBefore(beforeDate, days)
  const raw = await redisMget(dates.map((d) => reportKey(branchId, d)))
  const out: MisReport[] = []
  for (const s of raw) {
    const r = parseJson<MisReport | null>(s, null)
    if (r) out.push(r)
  }
  return out
}

async function persistRepairedReport(report: MisReport): Promise<boolean> {
  const ok = await setJson(reportKey(report.branchId, report.dateFor), report)
  if (ok) await invalidateMdSummaryCache(report.dateFor)
  return ok
}

function applyCarriedAbsentRepair(
  report: MisReport,
  priorReports: MisReport[],
  helpers: {
    reportDeployTotals: (rows: Record<string, unknown>[], branchId?: string) => { vac: number }
    undoCarriedAbsentWithoutOt: (
      todayRows: Record<string, unknown>[],
      priorDaysRows: Record<string, unknown>[][] | Record<string, unknown>[],
    ) => { rows: Record<string, unknown>[]; changed: boolean }
    emptyManpowerShortage: (total?: number) => MisReport['manpowerShortage']
    normaliseManpowerShortage: (
      raw: MisReport['manpowerShortage'],
      opts: { defaultTotal: number },
    ) => NonNullable<MisReport['manpowerShortage']>
    reconcileManpowerShortageToTotal: (
      shortage: NonNullable<MisReport['manpowerShortage']>,
      total: number,
    ) => NonNullable<MisReport['manpowerShortage']>
  },
): MisReport | null {
  const today = helpers.reportDeployTotals((report.rows || []) as Record<string, unknown>[], report.branchId)
  if (today.vac <= 0) return null
  const priorDays = priorReports
    .filter((r) => r.dateFor < report.dateFor && r.rows?.length)
    .sort((a, b) => (a.dateFor < b.dateFor ? 1 : a.dateFor > b.dateFor ? -1 : 0))
    .map((r) => r.rows as Record<string, unknown>[])
  if (!priorDays.length) return null
  const undone = helpers.undoCarriedAbsentWithoutOt(
    (report.rows || []) as Record<string, unknown>[],
    priorDays,
  )
  if (!undone.changed) return null
  const rows = undone.rows as MisReport['rows']
  const after = helpers.reportDeployTotals(rows as Record<string, unknown>[], report.branchId)
  const manpowerShortage =
    after.vac <= 0
      ? helpers.emptyManpowerShortage(0)
      : helpers.reconcileManpowerShortageToTotal(
          helpers.normaliseManpowerShortage(report.manpowerShortage, { defaultTotal: after.vac }),
          after.vac,
        )
  return { ...report, rows, manpowerShortage }
}

/**
 * Every branch: copied Absent + wiped OT = false vacant.
 * Keep only the last real vacant (Absent − OT). Real vacant posts stay.
 */
export async function repairFalseVacancyFromCarriedAbsent(
  report: MisReport,
  priorReports?: MisReport[],
): Promise<MisReport> {
  const { reportDeployTotals, undoCarriedAbsentWithoutOt } = await import('./deploy-math.js')
  const { emptyManpowerShortage, normaliseManpowerShortage, reconcileManpowerShortageToTotal } =
    await import('./manpower-shortage.js')
  const priors = priorReports ?? (await getReportsBefore(report.branchId, report.dateFor))
  const fixed = applyCarriedAbsentRepair(report, priors, {
    reportDeployTotals,
    undoCarriedAbsentWithoutOt,
    emptyManpowerShortage,
    normaliseManpowerShortage,
    reconcileManpowerShortageToTotal,
  })
  if (!fixed) return report
  const ok = await persistRepairedReport(fixed)
  return ok ? fixed : report
}

async function repairReportMap(byDate: Map<string, MisReport[]>): Promise<Map<string, MisReport[]>> {
  const lists = [...byDate.values()]
  const all = lists.flat()
  if (!all.length) return byDate
  const branchIds = [...new Set(all.map((r) => r.branchId).filter(Boolean))]
  const minDate = [...byDate.keys()].reduce((a, b) => (a && a < b ? a : b))
  const extraDates = ymdDaysBefore(minDate, VACANCY_CARRY_LOOKBACK_DAYS)
  const extraKeys: string[] = []
  const extraMeta: { branchId: string; date: string }[] = []
  for (const d of extraDates) {
    for (const branchId of branchIds) {
      extraKeys.push(reportKey(branchId, d))
      extraMeta.push({ branchId, date: d })
    }
  }
  const extraRaw = extraKeys.length ? await redisMget(extraKeys) : []
  const index = new Map<string, MisReport>()
  for (let i = 0; i < extraMeta.length; i++) {
    const r = parseJson<MisReport | null>(extraRaw[i], null)
    if (r) index.set(`${r.branchId}|${r.dateFor}`, r)
  }
  for (const r of all) index.set(`${r.branchId}|${r.dateFor}`, r)

  const { reportDeployTotals, undoCarriedAbsentWithoutOt } = await import('./deploy-math.js')
  const { emptyManpowerShortage, normaliseManpowerShortage, reconcileManpowerShortageToTotal } =
    await import('./manpower-shortage.js')
  const helpers = {
    reportDeployTotals,
    undoCarriedAbsentWithoutOt,
    emptyManpowerShortage,
    normaliseManpowerShortage,
    reconcileManpowerShortageToTotal,
  }
  const saves: Promise<boolean>[] = []
  const out = new Map<string, MisReport[]>()
  for (const d of [...byDate.keys()].sort()) {
    const list = byDate.get(d) || []
    const next: MisReport[] = []
    for (const report of list) {
      const priors: MisReport[] = []
      for (const day of ymdDaysBefore(report.dateFor, VACANCY_CARRY_LOOKBACK_DAYS)) {
        const prev = index.get(`${report.branchId}|${day}`)
        if (prev) priors.push(prev)
      }
      const fixed = applyCarriedAbsentRepair(report, priors, helpers)
      if (!fixed) {
        next.push(report)
        continue
      }
      index.set(`${fixed.branchId}|${fixed.dateFor}`, fixed)
      next.push(fixed)
      saves.push(persistRepairedReport(fixed))
    }
    out.set(d, next)
  }
  if (saves.length) await Promise.all(saves)
  return out
}

/** Director/Admin: recalculate OT on a submitted report (clamp rules) without reopening. */
export async function repairSubmittedMisReportOt(
  branchId: string,
  dateFor: string,
): Promise<
  | { ok: true; branchName: string; otBefore: number; otAfter: number }
  | { ok: false; error: string }
> {
  const report = await getReport(branchId, dateFor)
  if (!report) return { ok: false, error: 'No report found for this branch and date.' }
  const { normalizeDeployRow, reportDeployTotals } = await import('./deploy-math.js')
  const before = reportDeployTotals((report.rows || []) as Record<string, unknown>[], branchId)
  const rows = (report.rows || []).map((r) => normalizeDeployRow({ ...r }) as typeof r)
  const after = reportDeployTotals(rows as Record<string, unknown>[], branchId)
  const fixed: MisReport = { ...report, rows }
  const ok = report.submittedAt ? await submitReport(fixed) : await saveDraftReport(fixed)
  if (!ok) return { ok: false, error: 'Could not save corrected OT.' }
  await invalidateMdSummaryCache(dateFor)
  return {
    ok: true,
    branchName: report.branchName || branchId,
    otBefore: before.ot,
    otAfter: after.ot,
  }
}

/** Director/Admin: remove a report completely so the branch starts fresh. */
export async function deleteMisReport(branchId: string, dateFor: string): Promise<boolean> {
  const report = await getReport(branchId, dateFor)
  if (!report) return false
  const del = await redis(['DEL', reportKey(branchId, dateFor)])
  if (!del) return false
  const idx = await getJson<string[]>(reportIndexKey(dateFor), [])
  const next = idx.filter((id) => id !== branchId)
  if (next.length !== idx.length) await setJson(reportIndexKey(dateFor), next)
  await invalidateMdSummaryCache(dateFor)
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
  const scanIds = [...new Set([...idx, ...branches.map((b) => b.id)].filter(Boolean))]
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
  const named = found.map((r) => ({
    ...r,
    branchName: nameById.get(r.branchId) ?? r.branchName,
  }))
  const repaired = await repairReportMap(new Map([[dateFor, named]]))
  return repaired.get(dateFor) ?? named
}

export async function invalidateMdSummaryCache(dateFor: string): Promise<void> {
  const prefix = `mis:mdsummary:v${MD_SUMMARY_CACHE_VERSION}:`
  const week = misWeekStartMonday(dateFor)
  const month = dateFor.slice(0, 7)
  await redis([
    'DEL',
    `${prefix}day:${dateFor}`,
    `${prefix}week:${week}`,
    `${prefix}month:${month}`,
    `${prefix}reports:day:${dateFor}`,
    `${prefix}reports:week:${week}`,
    `${prefix}reports:month:${month}`,
    `${prefix}mdmail-v2:${dateFor}`,
  ])
  await redis(['DEL', `mis:mdsummary:day:${dateFor}`, `mis:mdsummary:week:${week}`, `mis:mdsummary:month:${month}`])
}

export async function getCachedMdSummary<T>(cacheKey: string, build: () => Promise<T>, anchorDate?: string): Promise<T> {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const ttl = anchorDate && anchorDate < today ? MD_SUMMARY_CACHE_HISTORICAL_MS : MD_SUMMARY_CACHE_MS
  const cached = await getJson<{ ts: number; data: T } | null>(mdSummaryCacheKey(cacheKey), null)
  if (cached && Date.now() - cached.ts < ttl) return cached.data
  try {
    const data = await build()
    await setJson(mdSummaryCacheKey(cacheKey), { ts: Date.now(), data })
    return data
  } catch (err) {
    if (cached?.data) return cached.data
    throw err
  }
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
    const ids = [...new Set([...(indexes[i] || []), ...branches.map((b) => b.id)].filter(Boolean))]
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
  return repairReportMap(byDate)
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
