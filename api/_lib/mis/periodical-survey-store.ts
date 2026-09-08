/**
 * MIS Site Security Assessment (SSA) — Periodical Security Survey Format (existing Agile clients).
 * Redis key shared with the earlier Periodical Survey Format work.
 */

import type {
  CrmSecuritySurvey,
  CrmSiteInputs,
  CrmSurveyInterview,
  CrmSurveyPhoto,
} from '../crm/store.js'
import { defaultSurveyInterviews, MAX_SURVEY_PHOTOS } from '../crm/store.js'
import {
  emptyHdfcForm,
  hdfcFormSummaryLines as hdfcLinesFromForm,
  HDFC_FORM_KEYS,
  HDFC_FORM_LABELS,
  normalizeHdfcForm,
  type HdfcFormKey,
} from './hdfc-survey-sections.js'
import { nid } from './store.js'

export {
  emptyHdfcForm,
  normalizeHdfcForm,
  HDFC_FORM_KEYS,
  HDFC_FORM_LABELS,
  HDFC_TABS,
} from './hdfc-survey-sections.js'
export type { HdfcFormKey } from './hdfc-survey-sections.js'

const PERIODICAL_SURVEYS_KEY = 'mis:periodical-surveys'
const PERIODICAL_SURVEY_DOC_PREFIX = 'mis:periodical-survey:'
const PERIODICAL_SURVEY_EXTRA_IDS = 'mis:periodical-survey-extra-ids'
const PUBLIC_CODE_PREFIX = 'mis:periodical-survey-code:'
const PUBLIC_TRIPLE_PREFIX = 'mis:periodical-survey-public:'
const PUBLIC_BRANCH_PREFIX = 'mis:periodical-survey-public-branch:'
/** Upstash REST rejects oversized SET bodies; fail fast and use the per-survey key. */
const MAX_REDIS_JSON_CHARS = 7_000_000

export type MisPeriodicalSurveyStatus = 'Draft' | 'Completed' | 'HodApproved' | 'Approved'

export type MisPeriodicalSurvey = {
  id: string
  clientId: string
  branchId: string
  company: string
  locationName: string
  address: string
  factoryManager: string
  contactPhone: string
  contactEmail: string
  natureOfBusiness: string
  industry: string
  industryOther: string
  surveyDate: string
  surveyedBy: string
  surveyorEmail: string
  /** Risk Analyst WhatsApp (public HDFC SSA) */
  surveyorWhatsApp: string
  /** When Risk Analyst tapped Start (for time-taken thank-you) */
  startedAt: string
  /** GPS at Start Assessment — for HDFC India roadmap later */
  geoLat: string
  geoLng: string
  geoAccuracy: string
  geoCapturedAt: string
  geoNote: string
  confidentialAccess: string
  periodLabel: string
  previousSurveyDate: string
  changesSinceLast: string
  actualStrength: string
  clientFeedback: string
  siteInputs: CrmSiteInputs
  siteObservations: string
  interviews: CrmSurveyInterview[]
  photos: CrmSurveyPhoto[]
  deploymentPlan: string
  scores: Record<string, number>
  scoreNotes: Record<string, string>
  posts: Record<string, unknown>[]
  execHelper: string
  commonErrors: string
  executiveSummary: string
  riskAnalysis: string
  manningSuggestion: string
  uniformRequirements: string
  equipmentSuggestions: string
  securityRecommendations: string
  recommendations: string
  siteRequirements: string
  /** Kept for older saved rows; UI no longer uses Contract Start */
  contractStart: Record<string, { done: boolean; notes: string; date: string }>
  /** standard | hdfc — Add Survey vs Add HDFC survey */
  surveyKind: string
  /** HDFC Bank Security Survey questionnaire answers (Add HDFC survey only) */
  hdfcForm: Record<string, string>
  /** HOD writes after completing the survey */
  hodSuggestions: string
  /** System suggestion after reviewing survey + HOD suggestions */
  systemSuggestions: string
  /** Management Step I — Review Suggestions */
  mgmtSuggestionsReviewedAt: string
  mgmtSuggestionsReviewedBy: string
  mgmtSuggestionsNote: string
  status: MisPeriodicalSurveyStatus
  submittedAt: string
  submittedBy: string
  lastReminderAt: string
  reminderCount: number
  reopenedAt: string
  reopenedBy: string
  approvedAt: string
  approvedBy: string
  approvedByEmail: string
  /** HDFC flow — HOD approved before Director */
  hodApprovedAt: string
  hodApprovedBy: string
  /** HDFC — Forward for approval (Management portal) */
  forwardedForApprovalAt: string
  forwardedForApprovalBy: string
  /** HDFC — HOD / Management asked staff to re-do the SSA (Draft again; progress drops) */
  reassessmentAt: string
  reassessmentBy: string
  reassessmentNote: string
  /** HDFC — HOD sent final report + photos to client after Director approval */
  sentToClientAt: string
  sentToClientBy: string
  sentToClientTo: string
  sentToClientCc: string
  /** GPS at Start / Submit (public HDFC SSA) — also copied to client master */
  geoLat: number | null
  geoLng: number | null
  geoAccuracy: number | null
  geoCapturedAt: string
  geoStatus: string
  /** Short code so ops can finish the public draft on a computer */
  publicResumeCode: string
  active: boolean
  createdAt: string
  updatedAt: string
}

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url, token } : null
}

export function storageOk(): boolean {
  return redisConfig() !== null
}

async function redis(command: unknown[]): Promise<{ result?: unknown } | null> {
  const cfg = redisConfig()
  if (!cfg) return null
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(cfg.url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      })
      if (!res.ok) {
        if (attempt === 0 && res.status >= 500) continue
        return null
      }
      return (await res.json()) as { result?: unknown }
    } catch {
      if (attempt === 0) continue
      return null
    }
  }
  return null
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
  let payload = ''
  try {
    payload = JSON.stringify(value)
  } catch {
    return false
  }
  if (payload.length > MAX_REDIS_JSON_CHARS) return false
  const d = await redis(['SET', key, payload])
  return d?.result === 'OK'
}

function surveyDocKey(id: string): string {
  return PERIODICAL_SURVEY_DOC_PREFIX + String(id || '').trim()
}

async function getExtraSurveyIds(): Promise<string[]> {
  const raw = await getJson<string[]>(PERIODICAL_SURVEY_EXTRA_IDS, [])
  if (!Array.isArray(raw)) return []
  return raw.map((id) => String(id || '').trim()).filter(Boolean).slice(0, 400)
}

async function addExtraSurveyId(id: string): Promise<void> {
  const want = String(id || '').trim()
  if (!want) return
  const ids = await getExtraSurveyIds()
  if (ids.includes(want)) return
  await setJson(PERIODICAL_SURVEY_EXTRA_IDS, [want, ...ids].slice(0, 400))
}

async function setPlain(key: string, value: string): Promise<boolean> {
  const d = await redis(['SET', key, value])
  return d?.result === 'OK'
}

async function getPlain(key: string): Promise<string> {
  const d = await redis(['GET', key])
  return typeof d?.result === 'string' ? d.result : ''
}

function publicSurveyorKey(name: string): string {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .slice(0, 80)
}

function publicTripleKey(branchId: string, clientId: string, surveyedBy: string): string {
  return PUBLIC_TRIPLE_PREFIX + [branchId, clientId, publicSurveyorKey(surveyedBy)].join('|')
}

async function mgetSurveyDocs(ids: string[]): Promise<MisPeriodicalSurvey[]> {
  const keys = [...new Set(ids.map((id) => String(id || '').trim()).filter(Boolean))]
  if (!keys.length) return []
  const out: MisPeriodicalSurvey[] = []
  for (let i = 0; i < keys.length; i += 40) {
    const chunk = keys.slice(i, i + 40)
    const d = await redis(['MGET', ...chunk.map(surveyDocKey)])
    const arr = Array.isArray(d?.result) ? d.result : []
    for (const raw of arr) {
      if (typeof raw !== 'string' || !raw) continue
      try {
        const row = JSON.parse(raw) as Partial<MisPeriodicalSurvey>
        if (row && row.id) out.push(normalizePeriodicalSurvey({ ...row, id: String(row.id) }))
      } catch {
        /* skip bad row */
      }
    }
  }
  return out
}

async function addBranchPublicDraftId(branchId: string, id: string): Promise<void> {
  const bid = String(branchId || '').trim()
  const want = String(id || '').trim()
  if (!bid || !want) return
  const ids = await getJson<string[]>(PUBLIC_BRANCH_PREFIX + bid, [])
  const next = [want, ...(Array.isArray(ids) ? ids : []).filter((x) => x && x !== want)].slice(0, 250)
  await setJson(PUBLIC_BRANCH_PREFIX + bid, next)
}

async function getPeriodicalSurveysMain(): Promise<MisPeriodicalSurvey[]> {
  const raw = await getJson<Partial<MisPeriodicalSurvey>[]>(PERIODICAL_SURVEYS_KEY, [])
  if (!Array.isArray(raw)) return []
  return raw
    .filter((row) => row && typeof row === 'object' && row.id)
    .map((row) => normalizePeriodicalSurvey({ ...row, id: String(row.id) }))
}

function emptySiteInputs(): CrmSiteInputs {
  return {
    clientBrief: '',
    scopeOfWork: '',
    existingSecurity: '',
    proposedShifts: '',
    sanctionedStrength: '',
    criticalAssets: '',
    accessPoints: '',
    vulnerableAreas: '',
    clientExpectations: '',
  }
}

function todayIst(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

export function emptyPeriodicalSurvey(clientId = '', branchId = ''): MisPeriodicalSurvey {
  const now = new Date().toISOString()
  return {
    id: nid('ps'),
    clientId,
    branchId,
    company: '',
    locationName: '',
    address: '',
    factoryManager: '',
    contactPhone: '',
    contactEmail: '',
    natureOfBusiness: '',
    industry: '',
    industryOther: '',
    surveyDate: todayIst(),
    surveyedBy: '',
    surveyorEmail: '',
    surveyorWhatsApp: '',
    startedAt: '',
    confidentialAccess: 'Director / Client / Branch HOD',
    periodLabel: '',
    previousSurveyDate: '',
    changesSinceLast: '',
    actualStrength: '',
    clientFeedback: '',
    siteInputs: emptySiteInputs(),
    siteObservations: '',
    interviews: defaultSurveyInterviews(),
    photos: [],
    deploymentPlan: '',
    scores: {},
    scoreNotes: {},
    posts: [],
    execHelper: '',
    commonErrors: '',
    executiveSummary: '',
    riskAnalysis: '',
    manningSuggestion: '',
    uniformRequirements: '',
    equipmentSuggestions: '',
    securityRecommendations: '',
    recommendations: '',
    siteRequirements: '',
    contractStart: {},
    surveyKind: 'standard',
    hdfcForm: emptyHdfcForm(),
    hodSuggestions: '',
    systemSuggestions: '',
    mgmtSuggestionsReviewedAt: '',
    mgmtSuggestionsReviewedBy: '',
    mgmtSuggestionsNote: '',
    status: 'Draft',
    submittedAt: '',
    submittedBy: '',
    lastReminderAt: '',
    reminderCount: 0,
    reopenedAt: '',
    reopenedBy: '',
    approvedAt: '',
    approvedBy: '',
    approvedByEmail: '',
    hodApprovedAt: '',
    hodApprovedBy: '',
    forwardedForApprovalAt: '',
    forwardedForApprovalBy: '',
    reassessmentAt: '',
    reassessmentBy: '',
    reassessmentNote: '',
    sentToClientAt: '',
    sentToClientBy: '',
    sentToClientTo: '',
    sentToClientCc: '',
    geoLat: null,
    geoLng: null,
    geoAccuracy: null,
    geoCapturedAt: '',
    geoStatus: '',
    publicResumeCode: '',
    active: true,
    createdAt: now,
    updatedAt: now,
  }
}

function normalizePhotos(raw: unknown): CrmSurveyPhoto[] {
  if (!Array.isArray(raw)) return []
  const photos: CrmSurveyPhoto[] = []
  for (const p of raw.slice(0, MAX_SURVEY_PHOTOS)) {
    const row = p as CrmSurveyPhoto
    const dataUrl = String(row.dataUrl ?? '').slice(0, 400_000)
    if (!dataUrl.startsWith('data:image/')) continue
    photos.push({
      id: String(row.id ?? `ph${photos.length}`).slice(0, 40),
      type: ['site_photo', 'deployment_chart', 'perimeter', 'entrance', 'cctv', 'other'].includes(
        String(row.type),
      )
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
  return photos
}

function normalizeInterviews(raw: unknown): CrmSurveyInterview[] {
  const interviews = defaultSurveyInterviews()
  if (!Array.isArray(raw)) return interviews
  for (let i = 0; i < 3; i++) {
    const row = raw[i] as CrmSurveyInterview | undefined
    if (!row) continue
    interviews[i] = {
      personName: String(row.personName ?? '').slice(0, 120),
      designation: String(row.designation ?? '').slice(0, 120),
      notes: String(row.notes ?? '').slice(0, 3000),
    }
  }
  return interviews
}

function normalizeScores(raw: unknown): Record<string, number> {
  const scores: Record<string, number> = {}
  if (!raw || typeof raw !== 'object') return scores
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(v)
    scores[String(k).slice(0, 40)] = Number.isFinite(n) ? Math.min(5, Math.max(0, Math.round(n))) : 0
  }
  return scores
}

function normalizeScoreNotes(raw: unknown): Record<string, string> {
  const notes: Record<string, string> = {}
  if (!raw || typeof raw !== 'object') return notes
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    notes[String(k).slice(0, 40)] = String(v ?? '').slice(0, 300)
  }
  return notes
}

function normalizeContractStart(
  raw: unknown,
): Record<string, { done: boolean; notes: string; date: string }> {
  const out: Record<string, { done: boolean; notes: string; date: string }> = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const row = v as { done?: boolean; notes?: string; date?: string }
    out[String(k).slice(0, 20)] = {
      done: row.done === true,
      notes: String(row.notes ?? '').slice(0, 400),
      date: String(row.date ?? '').slice(0, 20),
    }
  }
  return out
}

function normalizeSiteInputs(raw: unknown): CrmSiteInputs {
  const inp = (raw && typeof raw === 'object' ? raw : {}) as Partial<CrmSiteInputs>
  return {
    clientBrief: String(inp.clientBrief ?? '').slice(0, 2000),
    scopeOfWork: String(inp.scopeOfWork ?? '').slice(0, 2000),
    existingSecurity: String(inp.existingSecurity ?? '').slice(0, 2000),
    proposedShifts: String(inp.proposedShifts ?? '').slice(0, 1000),
    sanctionedStrength: String(inp.sanctionedStrength ?? '').slice(0, 500),
    criticalAssets: String(inp.criticalAssets ?? '').slice(0, 1500),
    accessPoints: String(inp.accessPoints ?? '').slice(0, 1500),
    vulnerableAreas: String(inp.vulnerableAreas ?? '').slice(0, 1500),
    clientExpectations: String(inp.clientExpectations ?? '').slice(0, 2000),
  }
}

export function normalizePeriodicalSurvey(
  raw: Partial<MisPeriodicalSurvey> & { id: string },
): MisPeriodicalSurvey {
  const status: MisPeriodicalSurveyStatus =
    raw.status === 'Approved'
      ? 'Approved'
      : raw.status === 'HodApproved'
        ? 'HodApproved'
        : raw.status === 'Completed'
          ? 'Completed'
          : 'Draft'
  return {
    id: String(raw.id).slice(0, 40),
    clientId: String(raw.clientId ?? '').slice(0, 40),
    branchId: String(raw.branchId ?? '').slice(0, 40),
    company: String(raw.company ?? '').slice(0, 200),
    locationName: String(raw.locationName ?? '').slice(0, 200),
    address: String(raw.address ?? '').slice(0, 400),
    factoryManager: String(raw.factoryManager ?? '').slice(0, 120),
    contactPhone: String(raw.contactPhone ?? '').slice(0, 20),
    contactEmail: String(raw.contactEmail ?? '').slice(0, 120),
    natureOfBusiness: String(raw.natureOfBusiness ?? '').slice(0, 300),
    industry: String(raw.industry ?? '').slice(0, 80),
    industryOther: String(raw.industryOther ?? '').slice(0, 200),
    surveyDate: String(raw.surveyDate ?? '').slice(0, 20),
    surveyedBy: String(raw.surveyedBy ?? '').slice(0, 120),
    surveyorEmail: String(raw.surveyorEmail ?? '').slice(0, 120),
    surveyorWhatsApp: String(raw.surveyorWhatsApp ?? '').slice(0, 20),
    startedAt: String(raw.startedAt ?? '').slice(0, 40),
    confidentialAccess: String(raw.confidentialAccess ?? 'Director / Client / Branch HOD').slice(0, 200),
    periodLabel: String(raw.periodLabel ?? '').slice(0, 80),
    previousSurveyDate: String(raw.previousSurveyDate ?? '').slice(0, 20),
    changesSinceLast: String(raw.changesSinceLast ?? '').slice(0, 2000),
    actualStrength: String(raw.actualStrength ?? '').slice(0, 500),
    clientFeedback: String(raw.clientFeedback ?? '').slice(0, 2000),
    siteInputs: normalizeSiteInputs(raw.siteInputs),
    siteObservations: String(raw.siteObservations ?? '').slice(0, 2000),
    interviews: normalizeInterviews(raw.interviews),
    photos: normalizePhotos(raw.photos),
    deploymentPlan: String(raw.deploymentPlan ?? '').slice(0, 4000),
    scores: normalizeScores(raw.scores),
    scoreNotes: normalizeScoreNotes(raw.scoreNotes),
    posts: Array.isArray(raw.posts) ? raw.posts.slice(0, 40) : [],
    execHelper: String(raw.execHelper ?? '').slice(0, 4000),
    commonErrors: String(raw.commonErrors ?? '').slice(0, 4000),
    executiveSummary: String(raw.executiveSummary ?? '').slice(0, 8000),
    riskAnalysis: String(raw.riskAnalysis ?? '').slice(0, 8000),
    manningSuggestion: String(raw.manningSuggestion ?? '').slice(0, 4000),
    uniformRequirements: String(raw.uniformRequirements ?? '').slice(0, 4000),
    equipmentSuggestions: String(raw.equipmentSuggestions ?? '').slice(0, 4000),
    securityRecommendations: String(raw.securityRecommendations ?? '').slice(0, 4000),
    recommendations: String(raw.recommendations ?? '').slice(0, 4000),
    siteRequirements: String(raw.siteRequirements ?? '').slice(0, 2000),
    contractStart: normalizeContractStart(raw.contractStart),
    surveyKind: String(raw.surveyKind ?? '').toLowerCase() === 'hdfc' ? 'hdfc' : 'standard',
    hdfcForm: normalizeHdfcForm(raw.hdfcForm),
    hodSuggestions: String(raw.hodSuggestions ?? '').slice(0, 8000),
    systemSuggestions: String(raw.systemSuggestions ?? '').slice(0, 8000),
    mgmtSuggestionsReviewedAt: String(raw.mgmtSuggestionsReviewedAt ?? '').slice(0, 40),
    mgmtSuggestionsReviewedBy: String(raw.mgmtSuggestionsReviewedBy ?? '').slice(0, 120),
    mgmtSuggestionsNote: String(raw.mgmtSuggestionsNote ?? '').slice(0, 4000),
    status,
    submittedAt: String(raw.submittedAt ?? '').slice(0, 40),
    submittedBy: String(raw.submittedBy ?? '').slice(0, 120),
    lastReminderAt: String(raw.lastReminderAt ?? '').slice(0, 40),
    reminderCount: Math.max(0, Math.min(99, Number(raw.reminderCount) || 0)),
    reopenedAt: String(raw.reopenedAt ?? '').slice(0, 40),
    reopenedBy: String(raw.reopenedBy ?? '').slice(0, 120),
    approvedAt: String(raw.approvedAt ?? '').slice(0, 40),
    approvedBy: String(raw.approvedBy ?? '').slice(0, 120),
    approvedByEmail: String(raw.approvedByEmail ?? '').slice(0, 120),
    hodApprovedAt: String(raw.hodApprovedAt ?? '').slice(0, 40),
    hodApprovedBy: String(raw.hodApprovedBy ?? '').slice(0, 120),
    forwardedForApprovalAt: String(raw.forwardedForApprovalAt ?? '').slice(0, 40),
    forwardedForApprovalBy: String(raw.forwardedForApprovalBy ?? '').slice(0, 120),
    reassessmentAt: String(raw.reassessmentAt ?? '').slice(0, 40),
    reassessmentBy: String(raw.reassessmentBy ?? '').slice(0, 120),
    reassessmentNote: String(raw.reassessmentNote ?? '').slice(0, 1000),
    sentToClientAt: String(raw.sentToClientAt ?? '').slice(0, 40),
    sentToClientBy: String(raw.sentToClientBy ?? '').slice(0, 120),
    sentToClientTo: String(raw.sentToClientTo ?? '').slice(0, 500),
    sentToClientCc: String(raw.sentToClientCc ?? '').slice(0, 800),
    geoLat: (() => {
      const n = Number(raw.geoLat)
      return Number.isFinite(n) && Math.abs(n) <= 90 ? Math.round(n * 1e6) / 1e6 : null
    })(),
    geoLng: (() => {
      const n = Number(raw.geoLng)
      return Number.isFinite(n) && Math.abs(n) <= 180 ? Math.round(n * 1e6) / 1e6 : null
    })(),
    geoAccuracy: (() => {
      const n = Number(raw.geoAccuracy)
      return Number.isFinite(n) && n >= 0 ? Math.round(n) : null
    })(),
    geoCapturedAt: String(raw.geoCapturedAt ?? '').slice(0, 40),
    geoStatus: String(raw.geoStatus ?? '').slice(0, 40),
    publicResumeCode: String(raw.publicResumeCode ?? '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 12),
    active: raw.active !== false,
    createdAt: String(raw.createdAt ?? '').slice(0, 40) || new Date().toISOString(),
    updatedAt: String(raw.updatedAt ?? '').slice(0, 40) || new Date().toISOString(),
  }
}

function mergeSurveyDocs(rows: MisPeriodicalSurvey[]): MisPeriodicalSurvey[] {
  const byId = new Map<string, MisPeriodicalSurvey>()
  for (const sv of rows) {
    if (!sv?.id) continue
    const cur = byId.get(sv.id)
    if (!cur || String(sv.updatedAt || '') >= String(cur.updatedAt || '')) {
      byId.set(sv.id, sv)
    }
  }
  return [...byId.values()]
}

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    let done = false
    const t = setTimeout(() => {
      if (done) return
      done = true
      resolve(fallback)
    }, ms)
    p.then((v) => {
      if (done) return
      done = true
      clearTimeout(t)
      resolve(v)
    }).catch(() => {
      if (done) return
      done = true
      clearTimeout(t)
      resolve(fallback)
    })
  })
}

export async function getPeriodicalSurveys(): Promise<MisPeriodicalSurvey[]> {
  const extraIds = await getExtraSurveyIds()
  const [main, extras] = await Promise.all([
    getPeriodicalSurveysMain().catch(() => [] as MisPeriodicalSurvey[]),
    extraIds.length ? mgetSurveyDocs(extraIds) : Promise.resolve([] as MisPeriodicalSurvey[]),
  ])
  if (!extras.length) return main
  return mergeSurveyDocs([...main, ...extras])
}

/** One-branch HOD list: that branch’s phone index first. Shared book is optional. */
export async function getPeriodicalSurveysForBranch(
  branchId: string,
  siblingIds: string[] = [],
): Promise<MisPeriodicalSurvey[]> {
  const bids = [...new Set([branchId, ...siblingIds].map((id) => String(id || '').trim()).filter(Boolean))]
  if (!bids.length) return []
  const indexLists = await Promise.all(bids.map((id) => getJson<string[]>(PUBLIC_BRANCH_PREFIX + id, [])))
  const indexIds = [
    ...new Set(indexLists.flatMap((ids) => (Array.isArray(ids) ? ids : [])).map((id) => String(id || '').trim()).filter(Boolean)),
  ]
  const extraIds = await getExtraSurveyIds()
  const [fromIndex, extras, main] = await Promise.all([
    mgetSurveyDocs(indexIds),
    withTimeout(extraIds.length ? mgetSurveyDocs(extraIds) : Promise.resolve([] as MisPeriodicalSurvey[]), 4000, []),
    withTimeout(getPeriodicalSurveysMain().catch(() => [] as MisPeriodicalSurvey[]), 5000, []),
  ])
  return mergeSurveyDocs([...main, ...extras, ...fromIndex]).filter((sv) => bids.includes(String(sv.branchId || '')))
}

export async function savePeriodicalSurveys(list: MisPeriodicalSurvey[]): Promise<boolean> {
  const normalized = list.slice(0, 400).map((sv) => normalizePeriodicalSurvey(sv))
  return setJson(PERIODICAL_SURVEYS_KEY, normalized)
}

/** Save one SSA row even when the big shared list is too large to write back. */
export async function upsertPeriodicalSurvey(
  row: MisPeriodicalSurvey,
  existingList?: MisPeriodicalSurvey[],
): Promise<boolean> {
  const n = normalizePeriodicalSurvey(row)
  if (!n.id) return false
  const docOk = await setJson(surveyDocKey(n.id), n)
  const list = existingList ?? (await getPeriodicalSurveysMain())
  const merged = list.some((sv) => sv.id === n.id)
    ? list.map((sv) => (sv.id === n.id ? n : sv))
    : [n, ...list].slice(0, 400)
  const listOk = await savePeriodicalSurveys(merged)
  await Promise.all([
    addExtraSurveyId(n.id),
    n.branchId ? addBranchPublicDraftId(n.branchId, n.id) : Promise.resolve(),
  ])
  return listOk || docOk
}

export async function getPeriodicalSurveyById(id: string): Promise<MisPeriodicalSurvey | null> {
  const want = String(id || '').trim()
  if (!want) return null
  const docs = await mgetSurveyDocs([want])
  if (docs[0]) return docs[0]
  const main = await getPeriodicalSurveysMain()
  return main.find((sv) => sv.id === want) || null
}

/** Phone auto-save: one draft key + branch index. Never rewrite the giant shared list. */
export async function savePublicHdfcDraft(row: MisPeriodicalSurvey): Promise<boolean> {
  const n = normalizePeriodicalSurvey(row)
  if (!n.id) return false
  const docOk = await setJson(surveyDocKey(n.id), n)
  if (!docOk) return false
  await Promise.all([
    addExtraSurveyId(n.id),
    n.publicResumeCode ? setPlain(PUBLIC_CODE_PREFIX + n.publicResumeCode, n.id) : Promise.resolve(true),
    n.branchId && n.clientId && n.surveyedBy
      ? setPlain(publicTripleKey(n.branchId, n.clientId, n.surveyedBy), n.id)
      : Promise.resolve(true),
    n.branchId ? addBranchPublicDraftId(n.branchId, n.id) : Promise.resolve(),
  ])
  return true
}

export async function loadPublicHdfcDraftByCode(code: string): Promise<MisPeriodicalSurvey | null> {
  const want = String(code || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12)
  if (!want) return null
  const id = await getPlain(PUBLIC_CODE_PREFIX + want)
  if (id) {
    const doc = await getPeriodicalSurveyById(id)
    if (doc && doc.active !== false) return doc
  }
  const all = await getPeriodicalSurveys()
  return (
    all.find(
      (sv) =>
        sv.surveyKind === 'hdfc' &&
        sv.status === 'Draft' &&
        sv.periodLabel === 'PUBLIC_HDFC_LINK' &&
        sv.publicResumeCode === want &&
        sv.active !== false,
    ) || null
  )
}

export async function loadPublicHdfcDraftByTriple(
  branchId: string,
  clientId: string,
  surveyedBy: string,
  surveyId?: string,
): Promise<MisPeriodicalSurvey | null> {
  if (surveyId) {
    const byId = await getPeriodicalSurveyById(surveyId)
    if (byId && byId.surveyKind === 'hdfc' && byId.active !== false) return byId
  }
  const bid = String(branchId || '').trim()
  const cid = String(clientId || '').trim()
  const name = String(surveyedBy || '').trim()
  if (bid && cid && name) {
    const id = await getPlain(publicTripleKey(bid, cid, name))
    if (id) {
      const doc = await getPeriodicalSurveyById(id)
      if (doc && doc.surveyKind === 'hdfc' && doc.status === 'Draft' && doc.active !== false) return doc
    }
  }
  const branchRows = await listPublicHdfcDraftsForBranch(bid)
  const key = publicSurveyorKey(name)
  return (
    branchRows.find(
      (sv) =>
        sv.surveyKind === 'hdfc' &&
        sv.status === 'Draft' &&
        sv.periodLabel === 'PUBLIC_HDFC_LINK' &&
        sv.clientId === cid &&
        publicSurveyorKey(sv.surveyedBy) === key &&
        sv.active !== false,
    ) || null
  )
}

export async function listPublicHdfcDraftsForBranch(
  branchId: string,
  opts?: { includeExtras?: boolean },
): Promise<MisPeriodicalSurvey[]> {
  const bid = String(branchId || '').trim()
  if (!bid) return []
  const ids = await getJson<string[]>(PUBLIC_BRANCH_PREFIX + bid, [])
  const includeExtras = opts?.includeExtras !== false
  const extraIds = includeExtras ? await getExtraSurveyIds() : []
  const [fromIndex, extras] = await Promise.all([
    mgetSurveyDocs(Array.isArray(ids) ? ids : []),
    extraIds.length ? mgetSurveyDocs(extraIds) : Promise.resolve([] as MisPeriodicalSurvey[]),
  ])
  return mergeSurveyDocs([...fromIndex, ...extras]).filter(
    (sv) => String(sv.branchId || '') === bid && sv.surveyKind === 'hdfc',
  )
}

export function hdfcFormSummaryLines(sv: MisPeriodicalSurvey): string[] {
  if (sv.surveyKind !== 'hdfc') return []
  return hdfcLinesFromForm(normalizeHdfcForm(sv.hdfcForm))
}

/** Colourful HTML block for HDFC Bank questionnaire (client report / email). */
export function buildHdfcQuestionnaireHtml(sv: MisPeriodicalSurvey): string {
  if (sv.surveyKind !== 'hdfc') return ''
  const form = normalizeHdfcForm(sv.hdfcForm)
  const esc = (t: string) =>
    String(t || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  const sections: { title: string; keys: HdfcFormKey[] }[] = [
    {
      title: '1. Location and Identification',
      keys: [
        'locationCategory', 'geoLandmark',
        'surroundLeft', 'surroundRight', 'surroundFront', 'surroundBack',
        'nearestFireStation', 'nearestFireStationKm', 'nearestPoliceStation', 'nearestPoliceStationKm',
        'wineShopNearby', 'barsNearby', 'shops24x7Nearby', 'busStandNearby', 'railwayStationNearby',
        'politicalPartyOfficeNearby', 'airportNearby',
        'publicMovement24x7', 'remoteAtNight', 'locationRiskNote',
      ],
    },
    {
      title: '2. Basic Information',
      keys: [
        'managerName', 'contactNumber', 'contactEmail', 'surveyDate', 'surveyedByPick', 'surveyedBy',
        'branchCategory', 'workingHours', 'holidayOpenPermission', 'faKnowsProcedure',
      ],
    },
    {
      title: '3. Deployment verification',
      keys: [
        'sanctionedGuards', 'dayShiftStart', 'afternoonShiftStart', 'eveningShiftStart',
        'faOnDuty', 'deploymentMatch', 'facilityAttendantsJson', 'deploymentGapNotes',
      ],
    },
    {
      title: '4. Registers and Compliance log',
      keys: [
        'attendanceRegister', 'hotoRegister', 'occurrenceRegister', 'breakRegister',
        'generatorRegister', 'cashLoadingRegister', 'bankOpenCloseRegister', 'complianceFile',
        'holidayRegisterKeepPlace', 'faDocPvc', 'faDocMedical', 'faDocDeploymentOrder', 'complianceGapNotes',
      ],
    },
    {
      title: '5. Bank Physical security',
      keys: [
        'mainEntranceDoor', 'mainEntranceProcedure', 'shutterCondition', 'shutterOpenCloseProcedure',
        'windowsSecure', 'windowOpenCloseProcedure', 'entryPointsToBank', 'openPosition', 'backYardDoor',
        'damagedWindows', 'closingBankChecklist', 'whoLocksBank', 'whoSealsKeys',
        'holidayOpeningPermission', 'holidayOpenCloseProcedure', 'physicalSecurityNotes',
      ],
    },
    {
      title: '6. ATM & Lobby',
      keys: [
        'atmSite', 'atmShiftCount', 'atmKeySets', 'atmOpenWiring', 'atmOpenPowerSocket', 'atmOpenConnection',
        'faBelongingsInAtm', 'atmDrawerContents', 'atmLobbyClean', 'unauthStickers', 'atmVisibleFromRoad',
        'surroundNightLighting', 'patrolBeforeTakeover', 'atmAccessCount', 'canAccessBankFromAtm',
        'atmGuarding', 'atmLobbyNotes',
      ],
    },
    {
      title: '7. Generator & Utility Infrastructure',
      keys: [
        'generatorLocation', 'generatorPresent', 'generatorBattery', 'generatorLockIntact', 'generatorWorking',
        'generatorStartedBy', 'generatorDieselBy', 'generatorFuel', 'upsPresent', 'upsBackupHours',
        'generatorVisibleFromAtm', 'generatorCctvCoverage', 'generatorAreaLuminated', 'utilityNotes',
        'generatorRegisterMaintained',
      ],
    },
    {
      title: '8. Perimeter surveillance & Patrolling',
      keys: [
        'perimeterFence', 'perimeterLighting', 'cctvPerimeter', 'patrolFrequency', 'patrolRouteOk',
        'outdoorAcUnit', 'outdoorAcLighting', 'outdoorAcCctv', 'patrolNotes',
      ],
    },
    {
      title: '9. Fire safety (ATM & Branch)',
      keys: [
        'feAtmCount', 'feAtmCo2', 'feAtmDcp', 'feAtmFoam', 'feAtmMixed',
        'feBankCount', 'feBankCo2', 'feBankDcp', 'feBankFoam', 'feBankMixed',
        'cookingHeatingAvailable', 'microwavePresent', 'recentFireAudit', 'recentFireDrill',
        'closingBankChecklist', 'smokeDetectors', 'fireAlarm', 'fireSafetyNotes',
      ],
    },
    {
      title: '10. Emergency communication & reporting',
      keys: [
        'routerInstalled', 'panicSwitchAtm', 'agileControlNumber', 'faKnowledgeAgileMobileAlarm',
        'emergencyContactDisplayedFa', 'escalationKnownFa', 'emergencyContactBank',
        'emergencyContactPolice', 'emergencyContactFire', 'emergencyNotes',
      ],
    },
    {
      title: '11. Electronic Security Systems',
      keys: [
        'cctvAtmCount', 'cctvBankCount', 'localDvrLocation', 'cctvCableOpen',
        'dvrNvrChannels', 'dvrNvrHdd', 'recordingBackupDays', 'cctvCoverageOk', 'electronicNotes',
      ],
    },
    {
      title: 'Remarks & Sign-off',
      keys: ['generalObservations', 'hdfcRecommendations', 'surveyorSign', 'branchRepSign'],
    },
  ]
  let body = ''
  for (const sec of sections) {
    body += `<h3 style="margin:18px 0 8px;color:#1e3a8a;font-size:15px">${esc(sec.title)}</h3><table style="width:100%;border-collapse:collapse;font-size:13px">`
    for (const k of sec.keys) {
      const label = HDFC_FORM_LABELS[k] || k
      const val = (form[k] || '').trim() || '—'
      body += `<tr><td style="border:1px solid #cbd5e1;padding:8px;width:38%;background:#f8fafc;font-weight:700;color:#334155">${esc(label)}</td><td style="border:1px solid #cbd5e1;padding:8px;color:#0f172a;white-space:pre-wrap">${esc(val)}</td></tr>`
    }
    body += '</table>'
  }
  return `<div style="margin:24px 0;padding:16px;border:2px solid #1e3a8a;border-radius:8px;background:#fff">
<h2 style="margin:0 0 6px;color:#1e3a8a;font-size:18px">HDFC Bank Limited — Security Survey Report</h2>
<p style="margin:0 0 12px;color:#64748b;font-size:12px">15-section Agile Site Security Assessment (SSA) — HDFC</p>
${body}
</div>`
}

export function toCrmSurveyShape(sv: MisPeriodicalSurvey): CrmSecuritySurvey {
  return {
    id: sv.id,
    leadId: '',
    company: sv.company,
    locationName: sv.locationName,
    address: sv.address,
    factoryManager: sv.factoryManager,
    contactPhone: sv.contactPhone,
    contactEmail: sv.contactEmail,
    natureOfBusiness: sv.natureOfBusiness,
    surveyDate: sv.surveyDate,
    surveyedBy: sv.surveyedBy,
    confidentialAccess: sv.confidentialAccess,
    siteInputs: sv.siteInputs,
    siteObservations: sv.siteObservations,
    interviews: sv.interviews,
    photos: sv.photos,
    deploymentPlan: sv.deploymentPlan,
    scores: sv.scores,
    scoreNotes: sv.scoreNotes,
    executiveSummary: sv.executiveSummary,
    riskAnalysis: sv.riskAnalysis,
    manningSuggestion: sv.manningSuggestion,
    uniformRequirements: sv.uniformRequirements,
    equipmentSuggestions: sv.equipmentSuggestions,
    securityRecommendations: sv.securityRecommendations,
    recommendations: sv.recommendations,
    siteRequirements: sv.siteRequirements,
    contractStart: sv.contractStart,
    status: sv.status === 'Draft' ? 'Draft' : 'Completed',
    active: sv.active,
    createdAt: sv.createdAt,
    updatedAt: sv.updatedAt,
  }
}
