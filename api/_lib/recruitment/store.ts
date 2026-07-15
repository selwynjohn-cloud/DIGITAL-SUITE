/**
 * Agile Recruitment storage (Upstash Redis).
 * Daily reports, guard pipeline, requisitions, join-backs, config.
 */

import { matchesSuiteAdminPassword, matchesSuiteBranchPin, suiteAdminPassword, suiteBranchPin } from '../suite-credentials.js'

export const RECRUIT_BRANCHES = [
  'Visakhapatnam',
  'Nellore',
  'Bangalore',
  'Gulbarga',
  'Hyderabad',
  'Kakinada',
  'Vijayawada',
  'Chennai',
  'Mumbai',
  'Corporate Office',
] as const

export const SOURCING_CHANNELS = [
  'WhatsApp',
  'SecurityJob.co.in',
  'Field Agent',
  'Referral',
  'Sub-Agency',
  'Recruitment Camp',
  'News / Media',
  'Walk-in',
  'News Bulletin',
  'Other',
] as const

export type RecruitUserRole = 'admin' | 'branch'
export type RecruitUserType = 'director' | 'admin' | 'hod' | 'staff' | 'recruiter'

export type RecruitUser = {
  id: string
  name: string
  email: string
  mobile: string
  role: RecruitUserRole
  userType: RecruitUserType
  branchId: string
  password: string
  active: boolean
  deactivateReason: string
  remarks: string
  createdAt: string
}

export type GuardStage =
  | 'applied'
  | 'walk_in'
  | 'verification'
  | 'medical'
  | 'ready'
  | 'deployed'
  | 'rejected'
  | 'join_back'

export type DailyRecruitmentReport = {
  id: string
  reportCode: string
  branchId: string
  reportDate: string
  submittedBy: string
  submittedAt: string
  walkIns: number
  screened: number
  docsComplete: number
  selected: number
  deployed: number
  campsHeld: number
  whatsappLeads: number
  securityjobLeads: number
  referralLeads: number
  fieldAgentLeads: number
  mediaLeads: number
  subAgencyLeads: number
  newsBulletinLeads: number
  notes: string
  bottlenecks: string
  active: boolean
}

export type GuardApplicant = {
  id: string
  branchId: string
  name: string
  mobile: string
  source: string
  stage: GuardStage
  siteZone: string
  requisitionId: string
  policeVerification: string
  medicalStatus: string
  fitnessStatus: string
  batchNo: string
  deployedSite: string
  notes: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export type ManpowerRequisition = {
  id: string
  branchId: string
  siteZone: string
  guardsNeeded: number
  urgency: 'normal' | 'urgent' | 'critical'
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled'
  requestedBy: string
  approvedBy: string
  notes: string
  createdAt: string
  active: boolean
}

export type JoinBackRecord = {
  id: string
  branchId: string
  guardName: string
  mobile: string
  siteZone: string
  leftDate: string
  rejoinDate: string
  reason: string
  status: 'absent' | 'rejoined' | 'left_permanent'
  notes: string
  active: boolean
  createdAt: string
}

/** Daily guard attendance mark (synced from Work360). */
export type GuardAttendanceMark = {
  employeeId: string
  guardName: string
  client: string
  unit: string
  date: string
  status: 'present' | 'absent' | 'late' | 'leave' | 'unknown'
  mobile: string
}

export type RecruitmentVendor = {
  id: string
  name: string
  contactPerson: string
  mobile: string
  branchesServed: string
  contractValidTill: string
  guardsSupplied: number
  active: boolean
  remarks: string
  createdAt: string
}

export type WageHoldSite = {
  id: string
  siteZone: string
  branchId: string
  riskLevel: 'watch' | 'hold' | 'release'
  attritionPct: string
  notes: string
  updatedAt: string
}

export type RecruitmentConfig = {
  shortageCount: number
  previousShortage: number
  contractedStrength: number
  actualDeployed: number
  dailyTargetPerBranch: number
  monthlyTarget: number
  wageHoldSites: WageHoldSite[]
  updatedAt: string
}

const USERS_KEY = 'recruit:users'
const DRR_KEY = 'recruit:drr'
const GUARDS_KEY = 'recruit:guards'
const REQUISITIONS_KEY = 'recruit:requisitions'
const JOINBACKS_KEY = 'recruit:joinbacks'
const VENDORS_KEY = 'recruit:vendors'
const CONFIG_KEY = 'recruit:config'
const attendanceKey = (date: string) => `recruit:attendance:${date}`
const ATTENDANCE_DATES_KEY = 'recruit:attendancedates'

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url, token } : null
}

export function recruitStorageOk(): boolean {
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

export const getUsers = () => getJson<RecruitUser[]>(USERS_KEY, [])
export const saveUsers = (v: RecruitUser[]) => setJson(USERS_KEY, v)
export const getDrr = () => getJson<DailyRecruitmentReport[]>(DRR_KEY, [])
export const saveDrr = (v: DailyRecruitmentReport[]) => setJson(DRR_KEY, v)
export const getGuards = () => getJson<GuardApplicant[]>(GUARDS_KEY, [])
export const saveGuards = (v: GuardApplicant[]) => setJson(GUARDS_KEY, v)
export const getRequisitions = () => getJson<ManpowerRequisition[]>(REQUISITIONS_KEY, [])
export const saveRequisitions = (v: ManpowerRequisition[]) => setJson(REQUISITIONS_KEY, v)
export const getJoinBacks = () => getJson<JoinBackRecord[]>(JOINBACKS_KEY, [])
export const saveJoinBacks = (v: JoinBackRecord[]) => setJson(JOINBACKS_KEY, v)
export const getVendors = () => getJson<RecruitmentVendor[]>(VENDORS_KEY, [])
export const saveVendors = (v: RecruitmentVendor[]) => setJson(VENDORS_KEY, v)
export const getConfig = () =>
  getJson<RecruitmentConfig>(CONFIG_KEY, {
    shortageCount: 13,
    previousShortage: 15,
    contractedStrength: 0,
    actualDeployed: 0,
    dailyTargetPerBranch: 5,
    monthlyTarget: 100,
    wageHoldSites: [],
    updatedAt: new Date().toISOString(),
  })
export const saveConfig = (v: RecruitmentConfig) => setJson(CONFIG_KEY, v)

export const getAttendanceMarks = (date: string) => getJson<GuardAttendanceMark[]>(attendanceKey(date), [])
export async function saveAttendanceMarks(date: string, list: GuardAttendanceMark[]): Promise<boolean> {
  const ok = await setJson(attendanceKey(date), list)
  const dates = await getJson<string[]>(ATTENDANCE_DATES_KEY, [])
  if (!dates.includes(date)) {
    dates.push(date)
    dates.sort()
    await setJson(ATTENDANCE_DATES_KEY, dates)
  }
  return ok
}

export function recruitNid(p = ''): string {
  return `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function recruitNum(v: unknown): number {
  const n = Number(String(v ?? '').replace(/,/g, ''))
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

const BR_ABBR: Record<string, string> = {
  Visakhapatnam: 'VSK',
  Nellore: 'NEL',
  Bangalore: 'BLR',
  Gulbarga: 'GLB',
  Hyderabad: 'HYD',
  Kakinada: 'KKD',
  Vijayawada: 'VJA',
  Chennai: 'CHN',
  Mumbai: 'MUM',
  'Corporate Office': 'CO',
}

export function drrReportCode(branchId: string, reportDate: string, id?: string): string {
  const abbr = BR_ABBR[branchId] || branchId.slice(0, 3).toUpperCase()
  const d = (reportDate || '').replace(/-/g, '')
  const tail = (id || recruitNid('')).slice(-4).toUpperCase()
  return `DRR-${abbr}-${d}-${tail}`
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function normalizeUser(u: Partial<RecruitUser> & { id?: string }): RecruitUser {
  return {
    id: String(u.id || recruitNid('us')),
    name: String(u.name || ''),
    email: String(u.email || ''),
    mobile: String(u.mobile || ''),
    role: u.role === 'admin' ? 'admin' : 'branch',
    userType: (['director', 'admin', 'hod', 'staff', 'recruiter'].includes(String(u.userType))
      ? u.userType
      : u.role === 'admin'
        ? 'admin'
        : 'hod') as RecruitUserType,
    branchId: String(u.branchId || ''),
    password: String(u.password || ''),
    active: u.active !== false,
    deactivateReason: String(u.deactivateReason || ''),
    remarks: String(u.remarks || ''),
    createdAt: String(u.createdAt || new Date().toISOString()),
  }
}

export function normalizeDrr(r: Partial<DailyRecruitmentReport> & { id?: string }): DailyRecruitmentReport {
  const id = String(r.id || recruitNid('dr'))
  const branchId = String(r.branchId || '')
  const reportDate = String(r.reportDate || todayIso())
  return {
    id,
    reportCode: String(r.reportCode || drrReportCode(branchId, reportDate, id)),
    branchId,
    reportDate,
    submittedBy: String(r.submittedBy || ''),
    submittedAt: String(r.submittedAt || new Date().toISOString()),
    walkIns: recruitNum(r.walkIns),
    screened: recruitNum(r.screened),
    docsComplete: recruitNum(r.docsComplete),
    selected: recruitNum(r.selected),
    deployed: recruitNum(r.deployed),
    campsHeld: recruitNum(r.campsHeld),
    whatsappLeads: recruitNum(r.whatsappLeads),
    securityjobLeads: recruitNum(r.securityjobLeads),
    referralLeads: recruitNum(r.referralLeads),
    fieldAgentLeads: recruitNum(r.fieldAgentLeads),
    mediaLeads: recruitNum(r.mediaLeads),
    subAgencyLeads: recruitNum(r.subAgencyLeads),
    newsBulletinLeads: recruitNum(r.newsBulletinLeads),
    notes: String(r.notes || ''),
    bottlenecks: String(r.bottlenecks || ''),
    active: r.active !== false,
  }
}

export function normalizeGuard(g: Partial<GuardApplicant> & { id?: string }): GuardApplicant {
  const now = new Date().toISOString()
  return {
    id: String(g.id || recruitNid('gd')),
    branchId: String(g.branchId || ''),
    name: String(g.name || ''),
    mobile: String(g.mobile || ''),
    source: String(g.source || 'Walk-in'),
    stage: (['applied', 'walk_in', 'verification', 'medical', 'ready', 'deployed', 'rejected', 'join_back'].includes(
      String(g.stage),
    )
      ? g.stage
      : 'applied') as GuardStage,
    siteZone: String(g.siteZone || ''),
    requisitionId: String(g.requisitionId || ''),
    policeVerification: String(g.policeVerification || 'Pending'),
    medicalStatus: String(g.medicalStatus || 'Pending'),
    fitnessStatus: String(g.fitnessStatus || 'Pending'),
    batchNo: String(g.batchNo || ''),
    deployedSite: String(g.deployedSite || ''),
    notes: String(g.notes || ''),
    active: g.active !== false,
    createdAt: String(g.createdAt || now),
    updatedAt: String(g.updatedAt || now),
  }
}

export function normalizeRequisition(r: Partial<ManpowerRequisition> & { id?: string }): ManpowerRequisition {
  return {
    id: String(r.id || recruitNid('rq')),
    branchId: String(r.branchId || ''),
    siteZone: String(r.siteZone || ''),
    guardsNeeded: recruitNum(r.guardsNeeded) || 1,
    urgency: (['normal', 'urgent', 'critical'].includes(String(r.urgency)) ? r.urgency : 'normal') as ManpowerRequisition['urgency'],
    status: (['pending', 'approved', 'rejected', 'fulfilled'].includes(String(r.status))
      ? r.status
      : 'pending') as ManpowerRequisition['status'],
    requestedBy: String(r.requestedBy || ''),
    approvedBy: String(r.approvedBy || ''),
    notes: String(r.notes || ''),
    createdAt: String(r.createdAt || new Date().toISOString()),
    active: r.active !== false,
  }
}

export function normalizeJoinBack(j: Partial<JoinBackRecord> & { id?: string }): JoinBackRecord {
  return {
    id: String(j.id || recruitNid('jb')),
    branchId: String(j.branchId || ''),
    guardName: String(j.guardName || ''),
    mobile: String(j.mobile || ''),
    siteZone: String(j.siteZone || ''),
    leftDate: String(j.leftDate || ''),
    rejoinDate: String(j.rejoinDate || ''),
    reason: String(j.reason || ''),
    status: (['absent', 'rejoined', 'left_permanent'].includes(String(j.status))
      ? j.status
      : 'absent') as JoinBackRecord['status'],
    notes: String(j.notes || ''),
    active: j.active !== false,
    createdAt: String(j.createdAt || new Date().toISOString()),
  }
}

export function defaultSeedUsers(): RecruitUser[] {
  const pin = suiteBranchPin()
  const adminPw = suiteAdminPassword()
  return [
    normalizeUser({
      id: 'us-director',
      name: 'Director',
      email: 'director@agilegroup.co.in',
      role: 'admin',
      userType: 'director',
      password: adminPw,
      active: true,
    }),
    normalizeUser({
      id: 'us-hyd',
      name: 'Hyderabad HOD',
      email: 'hyderabad@agilegroup.co.in',
      role: 'branch',
      userType: 'hod',
      branchId: 'Hyderabad',
      password: pin,
      active: true,
    }),
  ]
}

export function recruitAdminPassword(): string {
  return suiteAdminPassword()
}

export function recruitBranchPin(): string {
  return suiteBranchPin()
}
