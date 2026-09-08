/**
 * Recruitment-specific DRR — Excel-style daily details.
 * Sections: New recruits · Transfers · Resignations.
 */

import { recruitNid } from './store.js'

export type RecruitCompany = 'agile' | 'sparks'

export type DrrRecruitRow = {
  id: string
  empId: string
  name: string
  designation: string
  mobile: string
  parentName: string
  doj: string
  dob: string
  unit: string
  location: string
  dateOfReport: string
  aadhar: string
  educationCert: string
  policeVerification: string
  medicalCertificate: string
  bankAccount: string
  uniformCost: string
  amountPaid: string
  instalments: string
  referredBy: string
  remarks: string
  informedTo: string
  mobileAppInstalled: string
  /** New joiner or returning guard (rejoin). */
  kind?: 'new' | 'rejoin'
  /** Vacant post this recruit is filling (client @ location). */
  vacantPosition?: string
  /** Dashboard source: web · walkin · referral · recruiters · academy · others */
  sourceChannel?: 'web' | 'walkin' | 'referral' | 'recruiters' | 'academy' | 'others'
  /** Received Ladies Undertaking — Yes when taken. */
  ladyGuardUndertaking?: boolean
  /** Female recruit (lady guard / supervisor / any lady). */
  ladyRecruit?: boolean
  gender?: 'male' | 'female'
}

export type DrrTransferRow = {
  id: string
  empId: string
  name: string
  fromUnit: string
  fromLocation: string
  toUnit: string
  toLocation: string
  remarks: string
}

export type DrrResignationRow = {
  id: string
  empId: string
  name: string
  unit: string
  location: string
  resignationDate: string
  remarks: string
}

export type DrrDetailPackage = {
  id: string
  branchId: string
  company: RecruitCompany
  reportDate: string
  recruits: DrrRecruitRow[]
  transfers: DrrTransferRow[]
  resignations: DrrResignationRow[]
  submittedBy: string
  submittedAt: string
  active: boolean
  /** True when the branch saved today's DRR with no recruits / transfers / resignations. */
  nilRecruitment?: boolean
}

const KEY = 'recruit:drr-detail'

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

export async function getDrrDetails(): Promise<DrrDetailPackage[]> {
  const d = await redis(['GET', KEY])
  if (typeof d?.result !== 'string') return []
  try {
    return (JSON.parse(d.result) as DrrDetailPackage[]).map(normalizeDrrDetail)
  } catch {
    return []
  }
}

export async function saveDrrDetails(list: DrrDetailPackage[]): Promise<boolean> {
  const d = await redis(['SET', KEY, JSON.stringify(list.slice(0, 5000))])
  return d?.result === 'OK'
}

function recruitRow(raw: Partial<DrrRecruitRow>): DrrRecruitRow {
  return {
    id: String(raw.id || recruitNid('rc')),
    empId: String(raw.empId || ''),
    name: String(raw.name || ''),
    designation: String(raw.designation || 'SECURITY GUARD'),
    mobile: String(raw.mobile || ''),
    parentName: String(raw.parentName || ''),
    doj: String(raw.doj || '').slice(0, 10),
    dob: String(raw.dob || '').slice(0, 10),
    unit: String(raw.unit || ''),
    location: String(raw.location || ''),
    dateOfReport: String(raw.dateOfReport || '').slice(0, 10),
    aadhar: String(raw.aadhar || ''),
    educationCert: String(raw.educationCert || ''),
    policeVerification: String(raw.policeVerification || 'UNDER TAKING'),
    medicalCertificate: String(raw.medicalCertificate || 'UNDER TAKING'),
    bankAccount: String(raw.bankAccount || ''),
    uniformCost: String(raw.uniformCost || ''),
    amountPaid: String(raw.amountPaid || ''),
    instalments: String(raw.instalments || ''),
    referredBy: String(raw.referredBy || ''),
    remarks: String(raw.remarks || ''),
    informedTo: String(raw.informedTo || ''),
    mobileAppInstalled: String(raw.mobileAppInstalled || ''),
    kind: raw.kind === 'rejoin' ? 'rejoin' : 'new',
    vacantPosition: String(raw.vacantPosition || ''),
    sourceChannel: normaliseSourceChannel(raw.sourceChannel, raw.referredBy, raw.remarks),
    ladyGuardUndertaking: raw.ladyGuardUndertaking === true || String(raw.ladyGuardUndertaking) === 'true',
    ladyRecruit: raw.ladyRecruit === true || String(raw.ladyRecruit) === 'true' || raw.gender === 'female',
    gender: raw.gender === 'female' ? 'female' : raw.gender === 'male' ? 'male' : undefined,
  }
}

const LADY_HINT =
  /\blady\b|\bfemale\b|\bwoman\b|\bwomen\b|\blsg\b|\bmrs\.?\b|\bkumari\b|\bw\/o\b|\bd\/o\b|wife of|daughter of|lady\s*guard|lady\s*supervisor|lady\s*recruit/i

export function looksLikeLadyRecruit(
  row: Pick<DrrRecruitRow, 'name' | 'designation' | 'parentName' | 'ladyRecruit' | 'gender'>,
): boolean {
  if (row.gender === 'female' || row.ladyRecruit) return true
  if (row.gender === 'male') return false
  return LADY_HINT.test(`${row.designation || ''} ${row.parentName || ''} ${row.name || ''}`)
}

export function ladyRecruitMissingUndertaking(row: DrrRecruitRow): boolean {
  return looksLikeLadyRecruit(row) && !row.ladyGuardUndertaking
}

function normaliseSourceChannel(
  raw: unknown,
  referredBy?: string,
  remarks?: string,
): DrrRecruitRow['sourceChannel'] {
  const v = String(raw || '')
    .trim()
    .toLowerCase()
  if (v === 'web' || v === 'walkin' || v === 'referral' || v === 'recruiters' || v === 'academy' || v === 'others') {
    return v
  }
  const t = `${referredBy || ''} ${remarks || ''}`.toLowerCase()
  if (/security.?job|website|web\b|online|www\.|internet|whatsapp/.test(t)) return 'web'
  if (/walk.?in|walkin/.test(t)) return 'walkin'
  if (/referr|referral|friend|relative|known/.test(t)) return 'referral'
  if (/recruiter|field.?agent|sourcing|camp|vendor/.test(t)) return 'recruiters'
  if (/academy|training|ojt|lecturer/.test(t)) return 'academy'
  return 'others'
}

function transferRow(raw: Partial<DrrTransferRow>): DrrTransferRow {
  return {
    id: String(raw.id || recruitNid('tr')),
    empId: String(raw.empId || ''),
    name: String(raw.name || ''),
    fromUnit: String(raw.fromUnit || ''),
    fromLocation: String(raw.fromLocation || ''),
    toUnit: String(raw.toUnit || ''),
    toLocation: String(raw.toLocation || ''),
    remarks: String(raw.remarks || ''),
  }
}

function resignationRow(raw: Partial<DrrResignationRow>): DrrResignationRow {
  return {
    id: String(raw.id || recruitNid('rs')),
    empId: String(raw.empId || ''),
    name: String(raw.name || ''),
    unit: String(raw.unit || ''),
    location: String(raw.location || ''),
    resignationDate: String(raw.resignationDate || '').slice(0, 10),
    remarks: String(raw.remarks || ''),
  }
}

export function drrDetailHasRows(
  p: Pick<DrrDetailPackage, 'recruits' | 'transfers' | 'resignations'> | null | undefined,
): boolean {
  if (!p) return false
  return (p.recruits?.length || 0) + (p.transfers?.length || 0) + (p.resignations?.length || 0) > 0
}

export function drrDetailIsNil(
  p: Pick<DrrDetailPackage, 'nilRecruitment' | 'recruits' | 'transfers' | 'resignations'> | null | undefined,
): boolean {
  return Boolean(p?.nilRecruitment) && !drrDetailHasRows(p)
}

export function drrDetailIsSubmitted(
  p: Pick<DrrDetailPackage, 'nilRecruitment' | 'recruits' | 'transfers' | 'resignations'> | null | undefined,
): boolean {
  return drrDetailHasRows(p) || drrDetailIsNil(p)
}

export function normalizeDrrDetail(raw: Partial<DrrDetailPackage>): DrrDetailPackage {
  const recruits = Array.isArray(raw.recruits) ? raw.recruits.map(recruitRow) : []
  const transfers = Array.isArray(raw.transfers) ? raw.transfers.map(transferRow) : []
  const resignations = Array.isArray(raw.resignations) ? raw.resignations.map(resignationRow) : []
  const hasRows = recruits.length + transfers.length + resignations.length > 0
  return {
    id: String(raw.id || recruitNid('dp')),
    branchId: String(raw.branchId || ''),
    company: raw.company === 'sparks' ? 'sparks' : 'agile',
    reportDate: String(raw.reportDate || '').slice(0, 10),
    recruits,
    transfers,
    resignations,
    submittedBy: String(raw.submittedBy || ''),
    submittedAt: String(raw.submittedAt || new Date().toISOString()),
    active: raw.active !== false,
    nilRecruitment: Boolean(raw.nilRecruitment) && !hasRows,
  }
}
