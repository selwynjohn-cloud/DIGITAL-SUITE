/**
 * Site Security Visit Report — Day / Night Check (same Night Visit family).
 * Visit observations & lapses — not an SSA assessment.
 * Redis: mis:site-visit-reports
 */

import { nid } from './store.js'

const KEY = 'mis:site-visit-reports'
const DOC_PREFIX = 'mis:site-visit-report:'
const EXTRA_IDS = 'mis:site-visit-report-extra-ids'
const MAX_REDIS_JSON_CHARS = 7_000_000

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

export type SiteVisitType = 'day' | 'night'

export type SiteVisitPostRow = {
  postName: string
  guardsDeployed: string
  jobKnowledge: string
  registers: string
  ojtConducted: string
}

export type SiteVisitReport = {
  id: string
  branchId: string
  clientId: string
  visitType: SiteVisitType
  visitDate: string
  visitTime: string
  officerName: string
  designation: string
  branchOffice: string
  unitName: string
  unitLocation: string
  clientRepMet: string
  sanctionedStrength: string
  actualStrength: string
  attendanceMode: string
  verificationStatus: string
  verificationNote: string
  turnout: string
  idCardDisplayed: string
  accessControl: string
  wagesStatus: string
  grievances: string
  posts: SiteVisitPostRow[]
  enRouteRisk: string
  visitorMaterialLog: string
  lighting: string
  guardAlertness: string
  qrDisplayed: string
  emergencyNumbers: string
  clientFeedback: string
  clientSatisfaction: string
  photoSelfie: string
  photoSite1: string
  photoSite2: string
  overallStatus: string
  keyObservations: string
  correctiveActions: string
  officerSignature: string
  submittedToHodDate: string
  hodReviewStatus: string
  forwardedToClientOn: string
  officerEmail: string
  officerWhatsApp: string
  geoLat: number | null
  geoLng: number | null
  geoAccuracy: number | null
  geoCapturedAt: string
  geoStatus: string
  publicResumeCode: string
  status: 'Draft' | 'Completed'
  startedAt: string
  submittedAt: string
  createdAt: string
  updatedAt: string
  active: boolean
}

function s(v: unknown, n = 4000): string {
  return String(v ?? '').slice(0, n)
}

export function emptyPost(): SiteVisitPostRow {
  return { postName: '', guardsDeployed: '', jobKnowledge: '', registers: '', ojtConducted: '' }
}

export function emptySiteVisitReport(partial?: Partial<SiteVisitReport>): SiteVisitReport {
  const now = new Date().toISOString()
  return {
    id: nid('svr'),
    branchId: '',
    clientId: '',
    visitType: 'day',
    visitDate: '',
    visitTime: '',
    officerName: '',
    designation: '',
    branchOffice: '',
    unitName: '',
    unitLocation: '',
    clientRepMet: '',
    sanctionedStrength: '',
    actualStrength: '',
    attendanceMode: '',
    verificationStatus: '',
    verificationNote: '',
    turnout: '',
    idCardDisplayed: '',
    accessControl: '',
    wagesStatus: '',
    grievances: '',
    posts: [emptyPost()],
    enRouteRisk: '',
    visitorMaterialLog: '',
    lighting: '',
    guardAlertness: '',
    qrDisplayed: '',
    emergencyNumbers: '',
    clientFeedback: '',
    clientSatisfaction: '',
    photoSelfie: '',
    photoSite1: '',
    photoSite2: '',
    overallStatus: '',
    keyObservations: '',
    correctiveActions: '',
    officerSignature: '',
    submittedToHodDate: '',
    hodReviewStatus: '',
    forwardedToClientOn: '',
    officerEmail: '',
    officerWhatsApp: '',
    geoLat: null,
    geoLng: null,
    geoAccuracy: null,
    geoCapturedAt: '',
    geoStatus: '',
    publicResumeCode: '',
    status: 'Draft',
    startedAt: '',
    submittedAt: '',
    createdAt: now,
    updatedAt: now,
    active: true,
    ...partial,
  }
}

function parsePosts(raw: unknown): SiteVisitPostRow[] {
  if (!Array.isArray(raw) || !raw.length) return [emptyPost()]
  return raw.slice(0, 20).map((p) => {
    const row = (p && typeof p === 'object' ? p : {}) as Record<string, unknown>
    return {
      postName: s(row.postName, 200),
      guardsDeployed: s(row.guardsDeployed, 400),
      jobKnowledge: s(row.jobKnowledge, 80),
      registers: s(row.registers, 80),
      ojtConducted: s(row.ojtConducted, 40),
    }
  })
}

export function normalizeSiteVisitReport(raw: unknown): SiteVisitReport | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const id = s(r.id, 80)
  if (!id) return null
  const visitType = s(r.visitType, 10) === 'night' ? 'night' : 'day'
  const status = s(r.status, 20) === 'Completed' ? 'Completed' : 'Draft'
  const geoLat = Number(r.geoLat)
  const geoLng = Number(r.geoLng)
  const geoAccuracy = Number(r.geoAccuracy)
  return emptySiteVisitReport({
    id,
    branchId: s(r.branchId, 80),
    clientId: s(r.clientId, 80),
    visitType,
    visitDate: s(r.visitDate, 20),
    visitTime: s(r.visitTime, 20),
    officerName: s(r.officerName, 120),
    designation: s(r.designation, 120),
    branchOffice: s(r.branchOffice, 120),
    unitName: s(r.unitName, 200),
    unitLocation: s(r.unitLocation, 400),
    clientRepMet: s(r.clientRepMet, 200),
    sanctionedStrength: s(r.sanctionedStrength, 40),
    actualStrength: s(r.actualStrength, 40),
    attendanceMode: s(r.attendanceMode, 40),
    verificationStatus: s(r.verificationStatus, 80),
    verificationNote: s(r.verificationNote, 2000),
    turnout: s(r.turnout, 40),
    idCardDisplayed: s(r.idCardDisplayed, 40),
    accessControl: s(r.accessControl, 80),
    wagesStatus: s(r.wagesStatus, 80),
    grievances: s(r.grievances, 80),
    posts: parsePosts(r.posts),
    enRouteRisk: s(r.enRouteRisk, 4000),
    visitorMaterialLog: s(r.visitorMaterialLog, 80),
    lighting: s(r.lighting, 80),
    guardAlertness: s(r.guardAlertness, 80),
    qrDisplayed: s(r.qrDisplayed, 40),
    emergencyNumbers: s(r.emergencyNumbers, 40),
    clientFeedback: s(r.clientFeedback, 4000),
    clientSatisfaction: s(r.clientSatisfaction, 40),
    photoSelfie: s(r.photoSelfie, 900_000),
    photoSite1: s(r.photoSite1, 900_000),
    photoSite2: s(r.photoSite2, 900_000),
    overallStatus: s(r.overallStatus, 80),
    keyObservations: s(r.keyObservations, 8000),
    correctiveActions: s(r.correctiveActions, 8000),
    officerSignature: s(r.officerSignature, 200),
    submittedToHodDate: s(r.submittedToHodDate, 20),
    hodReviewStatus: s(r.hodReviewStatus, 40),
    forwardedToClientOn: s(r.forwardedToClientOn, 20),
    officerEmail: s(r.officerEmail, 160),
    officerWhatsApp: s(r.officerWhatsApp, 20),
    geoLat: Number.isFinite(geoLat) ? geoLat : null,
    geoLng: Number.isFinite(geoLng) ? geoLng : null,
    geoAccuracy: Number.isFinite(geoAccuracy) ? geoAccuracy : null,
    geoCapturedAt: s(r.geoCapturedAt, 40),
    geoStatus: s(r.geoStatus, 40),
    publicResumeCode: s(r.publicResumeCode, 12).toUpperCase().replace(/[^A-Z0-9]/g, ''),
    status,
    startedAt: s(r.startedAt, 40),
    submittedAt: s(r.submittedAt, 40),
    createdAt: s(r.createdAt, 40) || new Date().toISOString(),
    updatedAt: s(r.updatedAt, 40) || new Date().toISOString(),
    active: r.active !== false,
  })
}

async function getSiteVisitReportsMain(): Promise<SiteVisitReport[]> {
  const raw = await getJson<unknown[]>(KEY, [])
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeSiteVisitReport).filter(Boolean) as SiteVisitReport[]
}

async function getExtraVisitIds(): Promise<string[]> {
  const raw = await getJson<string[]>(EXTRA_IDS, [])
  if (!Array.isArray(raw)) return []
  return raw.map((id) => String(id || '').trim()).filter(Boolean).slice(0, 400)
}

export async function getSiteVisitReports(): Promise<SiteVisitReport[]> {
  const main = await getSiteVisitReportsMain()
  const extraIds = await getExtraVisitIds()
  if (!extraIds.length) return main
  const d = await redis(['MGET', ...extraIds.slice(0, 80).map((id) => DOC_PREFIX + id)])
  const arr = Array.isArray(d?.result) ? d.result : []
  const byId = new Map(main.map((r) => [r.id, r]))
  for (const raw of arr) {
    if (typeof raw !== 'string' || !raw) continue
    try {
      const row = normalizeSiteVisitReport(JSON.parse(raw))
      if (!row) continue
      const cur = byId.get(row.id)
      if (!cur || String(row.updatedAt || '') >= String(cur.updatedAt || '')) byId.set(row.id, row)
    } catch {
      /* skip */
    }
  }
  return [...byId.values()]
}

export async function saveSiteVisitReports(rows: SiteVisitReport[]): Promise<boolean> {
  const cleaned = rows
    .map(normalizeSiteVisitReport)
    .filter(Boolean)
    .slice(0, 4000) as SiteVisitReport[]
  return setJson(KEY, cleaned)
}

export async function upsertSiteVisitReport(row: SiteVisitReport): Promise<boolean> {
  const n = normalizeSiteVisitReport(row)
  if (!n) return false
  n.updatedAt = new Date().toISOString()
  const docOk = await setJson(DOC_PREFIX + n.id, n)
  const all = await getSiteVisitReportsMain()
  const idx = all.findIndex((x) => x.id === n.id)
  if (idx >= 0) all[idx] = n
  else all.unshift(n)
  const listOk = await saveSiteVisitReports(all)
  if (listOk) return true
  if (docOk) {
    const ids = await getExtraVisitIds()
    if (!ids.includes(n.id)) await setJson(EXTRA_IDS, [n.id, ...ids].slice(0, 400))
    return true
  }
  return false
}
