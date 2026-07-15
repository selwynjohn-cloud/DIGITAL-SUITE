/**
 * Agile CRM storage (Upstash Redis) — Sales & Tender Management.
 * Collections: leads (pipeline), tenders (with competitor price-bid history),
 * activities (meetings / follow-ups with reminders).
 */

import { matchesSuiteAdminPassword, matchesSuiteBranchPin, suiteAdminPassword, suiteBranchPin } from '../suite-credentials.js'

export type CrmLead = {
  id: string
  /** Sales = direct sales pipeline; Tender = tender-origin lead */
  leadKind: 'Sales' | 'Tender'
  active: boolean
  company: string
  branch: string
  location: string
  state: string
  deploymentDate: string
  contactName: string
  designation: string
  phone: string
  email: string
  city: string
  sector: string
  source: string
  requirement: string
  manpower: string
  estValue: number // ₹ per month
  assignedTo: string
  stage: string
  nextFollowUp: string // YYYY-MM-DD
  surveyDone: boolean
  lossReason: string
  remarks: string
  // Sales intelligence
  existingRate: string
  presentAgency: string
  changeReason: string
  swot: string
  moreSites: string
  irritants: string
  competitors: CrmCompetitor[]
  /** Who recorded this lead (email). */
  recordedBy: string
  /** Client website when source is Website. */
  webAddress: string
  /** Other site cities in India. */
  otherSiteCities: string[]
  /** AI company research report. */
  aiResearch: string
  createdAt: string
}

/** Site brief captured before on-site observations. */
export type CrmSiteInputs = {
  clientBrief: string
  scopeOfWork: string
  existingSecurity: string
  proposedShifts: string
  sanctionedStrength: string
  criticalAssets: string
  accessPoints: string
  vulnerableAreas: string
  clientExpectations: string
}

export type CrmSurveyPhoto = {
  id: string
  type: 'site_photo' | 'deployment_chart' | 'perimeter' | 'entrance' | 'cctv' | 'other'
  /** Category from upload button (Perimeter, Entrance, etc.) */
  label: string
  /** User-typed location name shown as photo heading in client report */
  heading: string
  caption: string
  dataUrl: string
  takenAt: string
  active: boolean
}

export type CrmSurveyInterview = {
  personName: string
  designation: string
  notes: string
}

/** Physical security survey & risk assessment (Agile checklist 0–180). */
export type CrmSecuritySurvey = {
  id: string
  leadId: string
  company: string
  locationName: string
  address: string
  factoryManager: string
  contactPhone: string
  contactEmail: string
  natureOfBusiness: string
  surveyDate: string
  surveyedBy: string
  confidentialAccess: string
  /** Client brief & scope — placed above site observations in the report. */
  siteInputs: CrmSiteInputs
  siteObservations: string
  /** Up to 3 on-site interview records (notes use speak-to-text in CRM). */
  interviews: CrmSurveyInterview[]
  /** Site photos, deployment chart, perimeter shots (base64 JPEG). */
  photos: CrmSurveyPhoto[]
  deploymentPlan: string
  /** Checklist item id → score 0–5 */
  scores: Record<string, number>
  scoreNotes: Record<string, string>
  executiveSummary: string
  riskAnalysis: string
  manningSuggestion: string
  uniformRequirements: string
  equipmentSuggestions: string
  securityRecommendations: string
  recommendations: string
  siteRequirements: string
  /** Contract start step id → status */
  contractStart: Record<string, { done: boolean; notes: string; date: string }>
  status: 'Draft' | 'Completed'
  active: boolean
  createdAt: string
  updatedAt: string
}

export type CrmCompetitor = { name: string; quote: string }

/** L1–L4 bidder row on a tender record. */
export type CrmBidder = { rank: string; name: string; quote: string }

/** AI-extracted fields from a tender notice PDF / pasted text. */
export type CrmTenderExtract = {
  summary?: string
  portal?: string
  submissionMode?: string
  bidType?: string
  emdMode?: string
  openingDate?: string
  eligibility?: string
  documentsRequired?: string
  importantDates?: string
  evaluationMethod?: string
  contractPeriod?: string
  estimatedBidValue?: string
  extractedAt?: string
}

export type CrmTender = {
  id: string
  /** Live = current tender; Historical = old tender archive (one record per past tender). */
  recordKind: 'Live' | 'Historical'
  active: boolean
  tenderNo: string
  tenderName: string
  clientDept: string
  location: string
  state: string
  branch: string
  portal: string
  typeOfServices: string
  contractPeriod: string
  minTurnover3yr: string
  experienceYears: string
  estimatedBidValue: string
  evaluationMethod: string
  requiredManpower: string
  publishedDate: string
  prebidMeetingDate: string
  prebidMeetingVenue: string
  emdPreparationDate: string
  submissionDate: string // last date / submission deadline
  bidEndDateTime: string
  bidValidityFromEnd: string
  emd: string
  epbgPercent: string
  tenderFee: string
  scoreMatrix: string
  serviceCharge: string
  l1TieBreak: string
  msePreference: string
  ourQuote: string
  ourPosition: string // L1, L2, L3, L4, etc.
  winningQuote: string
  contractAwardedRate: string
  contractAwardedDate: string
  awardedTo: string
  allotmentDetails: string
  bidders: CrmBidder[]
  /** @deprecated use bidders — kept for older saved rows */
  competitors: CrmCompetitor[]
  loiDate: string
  nextProbableDate: string // tentative next tender release
  status: string
  remarks: string
  tenderExtract?: CrmTenderExtract
  createdAt: string
}

export type CrmContract = {
  id: string
  client: string
  state: string
  masterAgreementDate: string
  renewalDate: string
  existingRate: string
  revisedRate: string
  mwNotificationDate: string
  piStatus: string // Pending / Achieved
  piAchievedDate: string
  nextPiDate: string
  remarks: string
  active: boolean
  createdAt: string
}

export type CrmActivity = {
  id: string
  leadId: string
  tenderId: string
  company: string
  type: string
  date: string // YYYY-MM-DD scheduled/reminder date
  /** Full meeting / visit address for map & directions. */
  location: string
  notes: string
  done: boolean
  active: boolean
  createdAt: string
}

/** Secure document links (agreements, licences, tender data). */
export type CrmDoc = {
  id: string
  title: string
  category: string
  link: string
  notes: string
  addedBy: string
  date: string
  active: boolean
}

/** Client-site follow-ups — contract renewal, uniform, security equipment. */
export type CrmClientFollowUp = {
  id: string
  client: string
  branch: string
  location: string
  contractRenewalDate: string
  contractFollowUp: string
  uniformStatus: string
  uniformIssued: string
  uniformFollowUp: string
  equipmentStatus: string
  equipmentIssued: string
  equipmentFollowUp: string
  notes: string
  active: boolean
  createdAt: string
}

export const DOC_CATEGORIES = ['Master Agreement', 'MW Notification', 'Tender Document', 'PSARA Licence', 'GST / PF / ESI', 'Client Contract', 'Policy / SOP', 'Previous Tender Data', 'Other']
export const ISSUE_STATUS = ['Pending', 'Issued', 'Partial', 'Due', 'Not Applicable']

export type CrmLostArchive = {
  id: string
  kind: 'sales' | 'tender'
  branch: string
  client: string
  title: string
  ourQuote: string
  ourPosition: string
  competitorSummary: string
  detailJson: string
  closedDate: string
  /** Saved Root Cause Analysis report (plain text / markdown). */
  rcaAnalysis?: string
  rcaAnalyzedAt?: string
  active: boolean
  createdAt: string
}

export const LEAD_STAGES = [
  'New/RFQ',
  'Initial Meeting',
  'Follow-up Meeting',
  'Site Survey',
  'Quote Submitted',
  'Negotiation',
  'Awaiting Decision',
  'Closed-Won',
  'Closed - Lost',
]
export const LEAD_SOURCES = ['Referral', 'Website', 'Cold Call', 'Tender Portal', 'Existing Client', 'Walk-in', 'Other']
export const INDIAN_CITIES = ['Hyderabad', 'Secunderabad', 'Bangalore', 'Chennai', 'Mumbai', 'Pune', 'Kochi', 'Surat', 'Ahmedabad', 'Vijayawada', 'Visakhapatnam', 'Kakinada', 'Nellore', 'Tirupati', 'Tadipatri', 'Bhopal', 'Delhi', 'Noida', 'Gurgaon', 'Kolkata', 'Pondicherry', 'Other']
export const SECTORS = ['Banking', 'Hospital', 'Manufacturing / Factory', 'IT / Corporate', 'Government / PSU', 'Education', 'Retail / Mall', 'Residential', 'Warehouse / Logistics', 'Other']
export const TENDER_STATUS = [
  'Identified / Under Review',
  'Bid Preparation',
  'Check Corrigendum',
  'Submitted',
  'Technical Bid Opened',
  'Evaluation Stage',
  'Price Bid Opened',
  'Result Awaiting',
  'Closed-Won',
  'Closed - Lost',
]
export const BIDDER_RANKS = ['L1', 'L2', 'L3', 'L4']
export const OUR_POSITIONS = ['L1', 'L2', 'L3', 'L4', 'Not Qualified', 'Did Not Bid', '—']
export const REMINDER_TYPES = [
  'Sales Meeting',
  'Tender Submission',
  'Prebid Meeting',
  'EMD Preparation',
  'Last Date',
  'Call',
  'Site Survey',
  'Follow-up',
]
export const SERVICE_LINES = ['Manned Guarding / Security', 'Facility Management Services', 'Outsourcing Services', 'Housekeeping', 'Electrical / Technical', 'Payroll / Manpower Supply', 'Other']
export const CRM_BRANCHES = ['Hyderabad - A', 'Hyderabad - B', 'Hi-Tech Branch', 'Bangalore', 'Chennai & Pondicherry', 'Kochi', 'Mumbai', 'Surat', 'Bhopal', 'Visakhapatnam', 'Vijayawada', 'Kakinada', 'Nellore & Tada', 'Tirupati & Tadipatri', 'Corporate Office']

const LEADS_KEY = 'crm:leads'
const TENDERS_KEY = 'crm:tenders'
const ACT_KEY = 'crm:activities'
const CONTRACTS_KEY = 'crm:contracts'
const DOCS_KEY = 'crm:docs'
const FOLLOWUPS_KEY = 'crm:followups'
const ARCHIVES_KEY = 'crm:lostArchives'
const SURVEYS_KEY = 'crm:surveys'
const LEGACY_MIS_DOCS_KEY = 'mis:docs'

export const PI_STATUS = ['Pending', 'Achieved']

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url, token } : null
}
export function crmStorageOk(): boolean {
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
    try { return JSON.parse(d.result) as T } catch { /* ignore */ }
  }
  return fallback
}
async function setJson(key: string, value: unknown): Promise<boolean> {
  const r = await redis(['SET', key, JSON.stringify(value)])
  return r?.result === 'OK'
}

export const getLeads = () => getJson<CrmLead[]>(LEADS_KEY, [])
export const saveLeads = (l: CrmLead[]) => setJson(LEADS_KEY, l)
export const getTenders = () => getJson<CrmTender[]>(TENDERS_KEY, [])
export const saveTenders = (l: CrmTender[]) => setJson(TENDERS_KEY, l)
export const getActivities = () => getJson<CrmActivity[]>(ACT_KEY, [])
export const saveActivities = (l: CrmActivity[]) => setJson(ACT_KEY, l)
export const getContracts = () => getJson<CrmContract[]>(CONTRACTS_KEY, [])
export const saveContracts = (l: CrmContract[]) => setJson(CONTRACTS_KEY, l)

/** Docs — migrates from legacy MIS key on first read. */
export async function getCrmDocs(): Promise<CrmDoc[]> {
  const docs = await getJson<CrmDoc[]>(DOCS_KEY, [])
  if (docs.length) return docs
  const legacy = await getJson<CrmDoc[]>(LEGACY_MIS_DOCS_KEY, [])
  if (legacy.length) {
    await setJson(DOCS_KEY, legacy)
    return legacy
  }
  return []
}
export const saveCrmDocs = (l: CrmDoc[]) => setJson(DOCS_KEY, l)
export const getClientFollowUps = () => getJson<CrmClientFollowUp[]>(FOLLOWUPS_KEY, [])
export const saveClientFollowUps = (l: CrmClientFollowUp[]) => setJson(FOLLOWUPS_KEY, l)
export const getLostArchives = () => getJson<CrmLostArchive[]>(ARCHIVES_KEY, [])
export const saveLostArchives = (l: CrmLostArchive[]) => setJson(ARCHIVES_KEY, l)
export const getSecuritySurveys = () => getJson<CrmSecuritySurvey[]>(SURVEYS_KEY, [])
export const MAX_SURVEY_PHOTOS = 10

export function defaultSurveyInterviews(): CrmSurveyInterview[] {
  return [
    { personName: '', designation: '', notes: '' },
    { personName: '', designation: '', notes: '' },
    { personName: '', designation: '', notes: '' },
  ]
}
export const saveSecuritySurveys = (l: CrmSecuritySurvey[]) => setJson(SURVEYS_KEY, l)

export function normalizeCrmSurvey(raw: Partial<CrmSecuritySurvey> & { id: string }): CrmSecuritySurvey {
  const scores: Record<string, number> = {}
  if (raw.scores && typeof raw.scores === 'object') {
    for (const [k, v] of Object.entries(raw.scores)) {
      const n = Number(v)
      scores[String(k).slice(0, 40)] = Number.isFinite(n) ? Math.min(5, Math.max(0, Math.round(n))) : 0
    }
  }
  const scoreNotes: Record<string, string> = {}
  if (raw.scoreNotes && typeof raw.scoreNotes === 'object') {
    for (const [k, v] of Object.entries(raw.scoreNotes)) scoreNotes[String(k).slice(0, 40)] = String(v ?? '').slice(0, 300)
  }
  const contractStart: CrmSecuritySurvey['contractStart'] = {}
  if (raw.contractStart && typeof raw.contractStart === 'object') {
    for (const [k, v] of Object.entries(raw.contractStart)) {
      const row = v as { done?: boolean; notes?: string; date?: string }
      contractStart[String(k).slice(0, 20)] = {
        done: row.done === true,
        notes: String(row.notes ?? '').slice(0, 400),
        date: String(row.date ?? '').slice(0, 20),
      }
    }
  }
  const status = raw.status === 'Completed' ? 'Completed' : 'Draft'
  const siteInputs = {
    clientBrief: String(raw.siteInputs?.clientBrief ?? '').slice(0, 2000),
    scopeOfWork: String(raw.siteInputs?.scopeOfWork ?? '').slice(0, 2000),
    existingSecurity: String(raw.siteInputs?.existingSecurity ?? '').slice(0, 2000),
    proposedShifts: String(raw.siteInputs?.proposedShifts ?? '').slice(0, 1000),
    sanctionedStrength: String(raw.siteInputs?.sanctionedStrength ?? '').slice(0, 500),
    criticalAssets: String(raw.siteInputs?.criticalAssets ?? '').slice(0, 1500),
    accessPoints: String(raw.siteInputs?.accessPoints ?? '').slice(0, 1500),
    vulnerableAreas: String(raw.siteInputs?.vulnerableAreas ?? '').slice(0, 1500),
    clientExpectations: String(raw.siteInputs?.clientExpectations ?? '').slice(0, 2000),
  }
  const photos: CrmSecuritySurvey['photos'] = []
  if (Array.isArray(raw.photos)) {
    for (const p of raw.photos.slice(0, MAX_SURVEY_PHOTOS)) {
      const row = p as CrmSurveyPhoto
      const dataUrl = String(row.dataUrl ?? '').slice(0, 400_000)
      if (!dataUrl.startsWith('data:image/')) continue
      photos.push({
        id: String(row.id ?? `ph${photos.length}`).slice(0, 40),
        type: ['site_photo', 'deployment_chart', 'perimeter', 'entrance', 'cctv', 'other'].includes(String(row.type))
          ? (row.type as CrmSurveyPhoto['type'])
          : 'site_photo',
        label: String(row.label ?? '').slice(0, 120),
        heading: String(row.heading ?? row.label ?? '').slice(0, 200),
        caption: String(row.caption ?? '').slice(0, 300),
        dataUrl,
        takenAt: String(row.takenAt ?? '').slice(0, 30),
        active: row.active !== false,
      })
    }
  }
  const interviews = defaultSurveyInterviews()
  if (Array.isArray(raw.interviews)) {
    for (let i = 0; i < 3; i++) {
      const row = raw.interviews[i] as CrmSurveyInterview | undefined
      if (!row) continue
      interviews[i] = {
        personName: String(row.personName ?? '').slice(0, 120),
        designation: String(row.designation ?? '').slice(0, 120),
        notes: String(row.notes ?? '').slice(0, 3000),
      }
    }
  }
  return {
    id: raw.id,
    leadId: String(raw.leadId ?? '').slice(0, 40),
    company: String(raw.company ?? '').slice(0, 200),
    locationName: String(raw.locationName ?? '').slice(0, 200),
    address: String(raw.address ?? '').slice(0, 400),
    factoryManager: String(raw.factoryManager ?? '').slice(0, 120),
    contactPhone: String(raw.contactPhone ?? '').slice(0, 20),
    contactEmail: String(raw.contactEmail ?? '').slice(0, 120),
    natureOfBusiness: String(raw.natureOfBusiness ?? '').slice(0, 300),
    surveyDate: String(raw.surveyDate ?? '').slice(0, 20),
    surveyedBy: String(raw.surveyedBy ?? '').slice(0, 120),
    confidentialAccess: String(raw.confidentialAccess ?? '').slice(0, 200),
    siteInputs,
    siteObservations: String(raw.siteObservations ?? '').slice(0, 2000),
    interviews,
    photos,
    deploymentPlan: String(raw.deploymentPlan ?? '').slice(0, 4000),
    scores,
    scoreNotes,
    executiveSummary: String(raw.executiveSummary ?? '').slice(0, 8000),
    riskAnalysis: String(raw.riskAnalysis ?? '').slice(0, 8000),
    manningSuggestion: String(raw.manningSuggestion ?? '').slice(0, 4000),
    uniformRequirements: String(raw.uniformRequirements ?? '').slice(0, 4000),
    equipmentSuggestions: String(raw.equipmentSuggestions ?? '').slice(0, 4000),
    securityRecommendations: String(raw.securityRecommendations ?? '').slice(0, 4000),
    recommendations: String(raw.recommendations ?? '').slice(0, 4000),
    siteRequirements: String(raw.siteRequirements ?? '').slice(0, 2000),
    contractStart,
    status,
    active: raw.active !== false,
    createdAt: String(raw.createdAt ?? '').slice(0, 40) || new Date().toISOString(),
    updatedAt: String(raw.updatedAt ?? '').slice(0, 40) || new Date().toISOString(),
  }
}

export async function getSecuritySurveysNormalized(): Promise<CrmSecuritySurvey[]> {
  return (await getSecuritySurveys()).map((s) => normalizeCrmSurvey(s))
}

export function crmNum(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}
export function crmNid(p = ''): string {
  return `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}
export function crmPassword(): string {
  return suiteAdminPassword()
}
export function crmStaffPassword(): string {
  return suiteAdminPassword()
}
export function crmCoordinatorPassword(): string {
  return suiteAdminPassword()
}
export function crmBranchPin(): string {
  return suiteBranchPin()
}

const EMPTY_BIDDERS = (): CrmBidder[] => BIDDER_RANKS.map((rank) => ({ rank, name: '', quote: '' }))

const LEGACY_LEAD_STAGE: Record<string, string> = {
  New: 'New/RFQ',
  Contacted: 'Initial Meeting',
  'Quotation Sent': 'Quote Submitted',
  Won: 'Closed-Won',
  Lost: 'Closed - Lost',
}

const LEGACY_TENDER_STATUS: Record<string, string> = {
  Identified: 'Identified / Under Review',
  'In Progress': 'Bid Preparation',
  'Result Awaited': 'Result Awaiting',
  Won: 'Closed-Won',
  Lost: 'Closed - Lost',
}

export function mapLeadStage(stage: string): string {
  const s = String(stage ?? '').trim()
  return LEGACY_LEAD_STAGE[s] || s || 'New/RFQ'
}

export function mapTenderStatus(status: string): string {
  const s = String(status ?? '').trim()
  return LEGACY_TENDER_STATUS[s] || s || 'Identified / Under Review'
}

export function isClosedWonStatus(status: string): boolean {
  return status === 'Closed-Won' || status === 'Won'
}

export function isClosedLostStatus(status: string): boolean {
  return status === 'Closed - Lost' || status === 'Lost'
}

/** Normalize tender rows from storage (backward compatible). */
export function normalizeCrmTender(raw: Partial<CrmTender> & { id: string }): CrmTender {
  const status = mapTenderStatus(String(raw.status ?? 'Identified').slice(0, 40))
  const recordKind =
    raw.recordKind === 'Historical' || raw.recordKind === 'Live'
      ? raw.recordKind
      : isClosedWonStatus(status) || isClosedLostStatus(status)
        ? 'Historical'
        : 'Live'
  let bidders = Array.isArray(raw.bidders)
    ? raw.bidders.slice(0, 8).map((b) => ({
        rank: String(b.rank ?? '').slice(0, 8) || 'L1',
        name: String(b.name ?? '').slice(0, 120),
        quote: String(b.quote ?? '').slice(0, 60),
      }))
    : []
  if (!bidders.length) {
    bidders = EMPTY_BIDDERS()
    const legacy = Array.isArray(raw.competitors) ? raw.competitors : []
    legacy.slice(0, 4).forEach((c, i) => {
      if (bidders[i]) {
        bidders[i].name = String(c.name ?? '').slice(0, 120)
        bidders[i].quote = String(c.quote ?? '').slice(0, 60)
      }
    })
  }
  while (bidders.length < 4) bidders.push({ rank: `L${bidders.length + 1}`, name: '', quote: '' })
  return {
    id: raw.id,
    recordKind,
    active: raw.active !== false,
    tenderNo: String(raw.tenderNo ?? '').slice(0, 80),
    tenderName: String(raw.tenderName ?? '').slice(0, 200),
    clientDept: String(raw.clientDept ?? '').slice(0, 200),
    location: String(raw.location ?? '').slice(0, 120),
    state: String(raw.state ?? '').slice(0, 80),
    branch: String(raw.branch ?? '').slice(0, 80),
    portal: String(raw.portal ?? '').slice(0, 120),
    typeOfServices: String(raw.typeOfServices ?? '').slice(0, 200),
    contractPeriod: String(raw.contractPeriod ?? '').slice(0, 120),
    minTurnover3yr: String(raw.minTurnover3yr ?? '').slice(0, 80),
    experienceYears: String(raw.experienceYears ?? '').slice(0, 40),
    estimatedBidValue: String(raw.estimatedBidValue ?? '').slice(0, 60),
    evaluationMethod: String(raw.evaluationMethod ?? '').slice(0, 120),
    requiredManpower: String(raw.requiredManpower ?? '').slice(0, 80),
    publishedDate: String(raw.publishedDate ?? '').slice(0, 20),
    prebidMeetingDate: String(raw.prebidMeetingDate ?? '').slice(0, 40),
    prebidMeetingVenue: String(raw.prebidMeetingVenue ?? '').slice(0, 200),
    emdPreparationDate: String(raw.emdPreparationDate ?? '').slice(0, 20),
    submissionDate: String(raw.submissionDate ?? '').slice(0, 20),
    bidEndDateTime: String(raw.bidEndDateTime ?? '').slice(0, 40),
    bidValidityFromEnd: String(raw.bidValidityFromEnd ?? '').slice(0, 80),
    emd: String(raw.emd ?? '').slice(0, 40),
    epbgPercent: String(raw.epbgPercent ?? '').slice(0, 20),
    tenderFee: String(raw.tenderFee ?? '').slice(0, 40),
    scoreMatrix: String(raw.scoreMatrix ?? '').slice(0, 200),
    serviceCharge: String(raw.serviceCharge ?? '').slice(0, 80),
    l1TieBreak: String(raw.l1TieBreak ?? '').slice(0, 200),
    msePreference: String(raw.msePreference ?? '').slice(0, 120),
    ourQuote: String(raw.ourQuote ?? '').slice(0, 60),
    ourPosition: String(raw.ourPosition ?? '').slice(0, 30),
    winningQuote: String(raw.winningQuote ?? raw.contractAwardedRate ?? '').slice(0, 60),
    contractAwardedRate: String(raw.contractAwardedRate ?? raw.winningQuote ?? '').slice(0, 60),
    contractAwardedDate: String(raw.contractAwardedDate ?? raw.loiDate ?? '').slice(0, 20),
    awardedTo: String(raw.awardedTo ?? '').slice(0, 120),
    allotmentDetails: String(raw.allotmentDetails ?? '').slice(0, 500),
    bidders,
    competitors: Array.isArray(raw.competitors)
      ? raw.competitors.slice(0, 20).map((c) => ({ name: String(c.name ?? '').slice(0, 120), quote: String(c.quote ?? '').slice(0, 60) }))
      : bidders.filter((b) => b.name).map((b) => ({ name: b.name, quote: b.quote })),
    loiDate: String(raw.loiDate ?? '').slice(0, 20),
    nextProbableDate: String(raw.nextProbableDate ?? '').slice(0, 20),
    status,
    remarks: String(raw.remarks ?? '').slice(0, 500),
    tenderExtract:
      raw.tenderExtract && typeof raw.tenderExtract === 'object'
        ? {
            summary: String(raw.tenderExtract.summary ?? '').slice(0, 800),
            portal: String(raw.tenderExtract.portal ?? '').slice(0, 120),
            submissionMode: String(raw.tenderExtract.submissionMode ?? '').slice(0, 40),
            bidType: String(raw.tenderExtract.bidType ?? '').slice(0, 80),
            emdMode: String(raw.tenderExtract.emdMode ?? '').slice(0, 200),
            openingDate: String(raw.tenderExtract.openingDate ?? '').slice(0, 20),
            eligibility: String(raw.tenderExtract.eligibility ?? '').slice(0, 2000),
            documentsRequired: String(raw.tenderExtract.documentsRequired ?? '').slice(0, 2000),
            importantDates: String(raw.tenderExtract.importantDates ?? '').slice(0, 2000),
            extractedAt: String(raw.tenderExtract.extractedAt ?? '').slice(0, 40),
          }
        : undefined,
    createdAt: String(raw.createdAt ?? '').slice(0, 40) || new Date().toISOString(),
  }
}

export async function getTendersNormalized(): Promise<CrmTender[]> {
  const list = await getTenders()
  return list.map((t) => normalizeCrmTender(t))
}

/** Normalize lead rows from storage (backward compatible). */
export function normalizeCrmLead(raw: Partial<CrmLead> & { id: string }): CrmLead {
  const source = String(raw.source ?? '')
  const leadKind =
    raw.leadKind === 'Tender' || raw.leadKind === 'Sales'
      ? raw.leadKind
      : source === 'Tender Portal'
        ? 'Tender'
        : 'Sales'
  return {
    id: raw.id,
    leadKind,
    active: raw.active !== false,
    company: String(raw.company ?? '').slice(0, 200),
    branch: String(raw.branch ?? '').slice(0, 80),
    location: String(raw.location ?? '').slice(0, 500),
    state: String(raw.state ?? '').slice(0, 80),
    deploymentDate: String(raw.deploymentDate ?? '').slice(0, 20),
    contactName: String(raw.contactName ?? '').slice(0, 120),
    designation: String(raw.designation ?? '').slice(0, 80),
    phone: String(raw.phone ?? '').slice(0, 20),
    email: String(raw.email ?? '').slice(0, 120),
    city: String(raw.city ?? '').slice(0, 80),
    sector: String(raw.sector ?? '').slice(0, 80),
    source: source.slice(0, 60),
    requirement: String(raw.requirement ?? '').slice(0, 300),
    manpower: String(raw.manpower ?? '').slice(0, 60),
    estValue: crmNum(raw.estValue),
    assignedTo: String(raw.assignedTo ?? '').slice(0, 80),
    stage: mapLeadStage(String(raw.stage ?? 'New/RFQ').slice(0, 40)),
    nextFollowUp: String(raw.nextFollowUp ?? '').slice(0, 20),
    surveyDone: raw.surveyDone === true,
    lossReason: String(raw.lossReason ?? '').slice(0, 200),
    remarks: String(raw.remarks ?? '').slice(0, 500),
    existingRate: String(raw.existingRate ?? '').slice(0, 120),
    presentAgency: String(raw.presentAgency ?? '').slice(0, 120),
    changeReason: String(raw.changeReason ?? '').slice(0, 500),
    swot: String(raw.swot ?? '').slice(0, 800),
    moreSites: String(raw.moreSites ?? '').slice(0, 400),
    irritants: String(raw.irritants ?? '').slice(0, 500),
    competitors: Array.isArray(raw.competitors)
      ? raw.competitors.slice(0, 8).map((c) => ({
          name: String(c.name ?? '').slice(0, 120),
          quote: String(c.quote ?? '').slice(0, 60),
        }))
      : [],
    recordedBy: String(raw.recordedBy ?? '').slice(0, 120),
    webAddress: String(raw.webAddress ?? '').slice(0, 300),
    otherSiteCities: Array.isArray(raw.otherSiteCities)
      ? raw.otherSiteCities.slice(0, 12).map((c) => String(c ?? '').slice(0, 80))
      : String(raw.moreSites ?? '')
          .split(/[,;|]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 12),
    aiResearch: String(raw.aiResearch ?? '').slice(0, 6000),
    createdAt: String(raw.createdAt ?? '').slice(0, 40) || new Date().toISOString(),
  }
}

export async function getLeadsNormalized(): Promise<CrmLead[]> {
  const list = await getLeads()
  return list.map((l) => normalizeCrmLead(l))
}

export type CrmAuth = { role: 'admin' | 'coordinator' | 'staff' | 'branch' | null; branch: string | null }
/**
 * admin        — Director/Admin, full access (all branches + sensitive).
 * coordinator  — Sales Coordinator, all-India (all branches), no sensitive.
 * branch       — Sales Team / Branch HOD, own branch only (login: branch + PIN).
 */
export function crmAuth(password: string, branchId: string, pin: string): CrmAuth {
  if (password && matchesSuiteAdminPassword(password)) return { role: 'admin', branch: null }
  if (branchId && pin && matchesSuiteBranchPin(pin)) return { role: 'branch', branch: branchId }
  return { role: null, branch: null }
}
