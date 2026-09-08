/**
 * Agile Ops storage (Upstash Redis) — shadow-safe masters and operational records.
 */

import type { OpsGuardJourney } from './journey.js'
import type {
  OpsAttendanceAudit,
  OpsAttendancePunch,
  OpsAuditFinding,
  OpsCorrection,
  OpsDeploymentOrder,
  OpsException,
  OpsGuard,
  OpsIdCard,
  OpsInvoiceFeedRow,
  OpsMeeting,
  OpsMonthRegister,
  OpsPost,
  OpsRosterSlot,
  OpsScorecard,
  OpsShadowDay,
  OpsStaffAppointment,
  OpsTransitionPlan,
  OpsUniformIssue,
  OpsVacancyFill,
  OpsVisitAction,
} from './types.js'
import type { OpsFlags } from './flags.js'
import { opsFlagsFromEnv } from './flags.js'

const PREFIX = 'ops:'
const IMAGE_PREFIX = `${PREFIX}img:`
const KEYS = {
  flags: `${PREFIX}flags`,
  guards: `${PREFIX}guards`,
  posts: `${PREFIX}posts`,
  appointments: `${PREFIX}appointments`,
  idCards: `${PREFIX}idcards`,
  orders: `${PREFIX}orders`,
  uniforms: `${PREFIX}uniforms`,
  roster: `${PREFIX}roster`,
  punches: `${PREFIX}punches`,
  audits: `${PREFIX}audits`,
  fills: `${PREFIX}fills`,
  exceptions: `${PREFIX}exceptions`,
  visits: `${PREFIX}visits`,
  findings: `${PREFIX}findings`,
  scorecards: `${PREFIX}scorecards`,
  meetings: `${PREFIX}meetings`,
  corrections: `${PREFIX}corrections`,
  months: `${PREFIX}months`,
  invoiceFeeds: `${PREFIX}invoicefeeds`,
  transitions: `${PREFIX}transitions`,
  shadowDays: `${PREFIX}shadowdays`,
  punchDates: `${PREFIX}punchdates`,
  journeys: `${PREFIX}journeys`,
}

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url, token } : null
}

export function opsStorageOk(): boolean {
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

export function opsNid(p: string): string {
  return `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export async function getOpsFlags(): Promise<OpsFlags> {
  const stored = await getJson<Partial<OpsFlags> | null>(KEYS.flags, null)
  const env = opsFlagsFromEnv()
  if (!stored) return env
  return {
    shadow: stored.shadow ?? env.shadow,
    invoiceFeed: stored.invoiceFeed ?? env.invoiceFeed,
    attendanceSource: stored.attendanceSource ?? env.attendanceSource,
    misPrefill: stored.misPrefill ?? env.misPrefill,
    photoRequiredForDuty: stored.photoRequiredForDuty ?? env.photoRequiredForDuty,
    cutoverApprovedAt: stored.cutoverApprovedAt ?? env.cutoverApprovedAt,
    cutoverApprovedBy: stored.cutoverApprovedBy ?? env.cutoverApprovedBy,
  }
}

/** True when Employee ID (or journey photoId) has a face photo on file. */
export async function personHasPhoto(employeeId: string, fallbackPhotoId = ''): Promise<boolean> {
  if (fallbackPhotoId && fallbackPhotoId.replace(/[^a-z0-9]/gi, '')) return true
  const map = await getPhotoMap()
  return Boolean(photoIdForEmployee(map, employeeId, ''))
}

export async function saveOpsFlags(flags: OpsFlags): Promise<boolean> {
  return setJson(KEYS.flags, flags)
}

export const getGuards = () => getJson<OpsGuard[]>(KEYS.guards, [])
export const saveGuards = (v: OpsGuard[]) => setJson(KEYS.guards, v)

const PHOTO_MAP_KEY = `${PREFIX}photomap`

function normEmp(employeeId: string) {
  return employeeId.trim().toLowerCase().replace(/\s+/g, '')
}

/** Save a guard face photo (data URL). Returns image id, or null. */
export async function saveOpsImage(dataUrl: string): Promise<string | null> {
  if (!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(dataUrl)) return null
  // Cap ~700KB data-URL to keep Redis healthy (client also resizes).
  if (dataUrl.length > 950_000) return null
  if (!redisConfig()) return null
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  const result = await redis(['SET', `${IMAGE_PREFIX}${id}`, dataUrl])
  return result?.result === 'OK' ? id : null
}

export async function getOpsImage(id: string): Promise<string | null> {
  const safe = id.replace(/[^a-z0-9]/gi, '')
  if (!safe) return null
  const data = await redis(['GET', `${IMAGE_PREFIX}${safe}`])
  return data?.result && typeof data.result === 'string' ? data.result : null
}

export function opsPhotoUrl(photoId: string): string {
  const id = String(photoId || '').replace(/[^a-z0-9]/gi, '')
  return id ? `/api/ops/image?id=${id}` : ''
}

/** Employee-ID → photoId map (avoids rewriting the huge guards list on every upload). */
export async function getPhotoMap(): Promise<Record<string, string>> {
  return getJson<Record<string, string>>(PHOTO_MAP_KEY, {})
}

export async function linkPhotoToEmployee(employeeId: string, photoId: string): Promise<boolean> {
  const emp = normEmp(employeeId)
  const id = photoId.replace(/[^a-z0-9]/gi, '')
  if (!emp || !id) return false
  const map = await getPhotoMap()
  map[emp] = id
  return setJson(PHOTO_MAP_KEY, map)
}

export function photoIdForEmployee(
  map: Record<string, string>,
  employeeId: string,
  fallback = '',
): string {
  const emp = normEmp(employeeId)
  if (!emp) return fallback || ''
  return map[emp] || fallback || ''
}

export function enrichWithPhotos<T extends { employeeId?: string; photoId?: string }>(
  rows: T[],
  map: Record<string, string>,
): T[] {
  return rows.map((r) => {
    const linked = photoIdForEmployee(map, r.employeeId || '', r.photoId || '')
    return { ...r, photoId: linked || '' }
  })
}

export const getPosts = () => getJson<OpsPost[]>(KEYS.posts, [])
export const savePosts = (v: OpsPost[]) => setJson(KEYS.posts, v)
export const getAppointments = () => getJson<OpsStaffAppointment[]>(KEYS.appointments, [])
export const saveAppointments = (v: OpsStaffAppointment[]) => setJson(KEYS.appointments, v)
export const getIdCards = () => getJson<OpsIdCard[]>(KEYS.idCards, [])
export const saveIdCards = (v: OpsIdCard[]) => setJson(KEYS.idCards, v)
export const getOrders = () => getJson<OpsDeploymentOrder[]>(KEYS.orders, [])
export const saveOrders = (v: OpsDeploymentOrder[]) => setJson(KEYS.orders, v)
export const getUniforms = () => getJson<OpsUniformIssue[]>(KEYS.uniforms, [])
export const saveUniforms = (v: OpsUniformIssue[]) => setJson(KEYS.uniforms, v)
export const getRoster = () => getJson<OpsRosterSlot[]>(KEYS.roster, [])
export const saveRoster = (v: OpsRosterSlot[]) => setJson(KEYS.roster, v)
export const getPunches = () => getJson<OpsAttendancePunch[]>(KEYS.punches, [])
export const savePunches = (v: OpsAttendancePunch[]) => setJson(KEYS.punches, v)
export const getAudits = () => getJson<OpsAttendanceAudit[]>(KEYS.audits, [])
export const saveAudits = (v: OpsAttendanceAudit[]) => setJson(KEYS.audits, v)
export const getFills = () => getJson<OpsVacancyFill[]>(KEYS.fills, [])
export const saveFills = (v: OpsVacancyFill[]) => setJson(KEYS.fills, v)
export const getExceptions = () => getJson<OpsException[]>(KEYS.exceptions, [])
export const saveExceptions = (v: OpsException[]) => setJson(KEYS.exceptions, v)
export const getVisits = () => getJson<OpsVisitAction[]>(KEYS.visits, [])
export const saveVisits = (v: OpsVisitAction[]) => setJson(KEYS.visits, v)
export const getFindings = () => getJson<OpsAuditFinding[]>(KEYS.findings, [])
export const saveFindings = (v: OpsAuditFinding[]) => setJson(KEYS.findings, v)
export const getScorecards = () => getJson<OpsScorecard[]>(KEYS.scorecards, [])
export const saveScorecards = (v: OpsScorecard[]) => setJson(KEYS.scorecards, v)
export const getMeetings = () => getJson<OpsMeeting[]>(KEYS.meetings, [])
export const saveMeetings = (v: OpsMeeting[]) => setJson(KEYS.meetings, v)
export const getCorrections = () => getJson<OpsCorrection[]>(KEYS.corrections, [])
export const saveCorrections = (v: OpsCorrection[]) => setJson(KEYS.corrections, v)
export const getMonthRegisters = () => getJson<OpsMonthRegister[]>(KEYS.months, [])
export const saveMonthRegisters = (v: OpsMonthRegister[]) => setJson(KEYS.months, v)
export const getInvoiceFeeds = () => getJson<OpsInvoiceFeedRow[]>(KEYS.invoiceFeeds, [])
export const saveInvoiceFeeds = (v: OpsInvoiceFeedRow[]) => setJson(KEYS.invoiceFeeds, v)
export const getTransitions = () => getJson<OpsTransitionPlan[]>(KEYS.transitions, [])
export const saveTransitions = (v: OpsTransitionPlan[]) => setJson(KEYS.transitions, v)
export const getShadowDays = () => getJson<OpsShadowDay[]>(KEYS.shadowDays, [])
export const saveShadowDays = (v: OpsShadowDay[]) => setJson(KEYS.shadowDays, v)
export const getJourneys = () => getJson<OpsGuardJourney[]>(KEYS.journeys, [])
export const saveJourneys = (v: OpsGuardJourney[]) => setJson(KEYS.journeys, v)

export async function appendPunches(newPunches: OpsAttendancePunch[]): Promise<number> {
  if (!newPunches.length) return 0
  const all = await getPunches()
  const key = (p: OpsAttendancePunch) =>
    `${p.source}|${p.employeeId}|${p.guardName}|${p.date}|${p.status}|${p.postName}`
  const seen = new Set(all.map(key))
  let added = 0
  for (const p of newPunches) {
    const k = key(p)
    if (seen.has(k)) continue
    seen.add(k)
    all.push(p)
    added++
  }
  // Cap growth — keep last 40k punches
  const trimmed = all.length > 40_000 ? all.slice(all.length - 40_000) : all
  await savePunches(trimmed)
  const dates = await getJson<string[]>(KEYS.punchDates, [])
  for (const p of newPunches) {
    if (p.date && !dates.includes(p.date)) dates.push(p.date)
  }
  dates.sort()
  await setJson(KEYS.punchDates, dates.slice(-120))
  return added
}

export async function punchesForDate(date: string, branchId?: string): Promise<OpsAttendancePunch[]> {
  const all = await getPunches()
  return all.filter((p) => p.date === date && (!branchId || p.branchId === branchId || !p.branchId))
}

export async function rosterForDate(date: string, branchId?: string): Promise<OpsRosterSlot[]> {
  const all = await getRoster()
  return all.filter((r) => r.date === date && (!branchId || r.branchId === branchId))
}
