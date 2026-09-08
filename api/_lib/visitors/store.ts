/**
 * Agile Visitors Management — Redis store.
 * Gate sees name / company / mobile only.
 * Officer holds ID photos. Client chooses same-night wipe or 30-day officer delete.
 * Aadhaar / licence numbers are redacted from text. Visiting cards are not accepted.
 */

export const VISIT_TTL_SEC = 36 * 60 * 60
export const OFFICER_DOC_TTL_SEC = 32 * 24 * 60 * 60
export const MATERIAL_CATEGORIES = ['Laptop', 'Phone', 'Files', 'Samples', 'Other'] as const
export const SEED_TENANT_ID = 'tenant-agile'

export type AvmRetention = 'night' | 'officer30'
export type AvmUserRole = 'gate' | 'officer' | 'admin'
export type AvmGovIdType = 'aadhaar' | 'dl' | ''

export type AvmTenant = {
  id: string
  companyName: string
  logo: string
  retention: AvmRetention
  active: boolean
  createdAt: string
}

export type AvmClientUser = {
  id: string
  tenantId: string
  name: string
  email: string
  mobile: string
  role: AvmUserRole
  active: boolean
}

export type VisitStatus =
  | 'invited'
  | 'registered'
  | 'approved'
  | 'arrived'
  | 'closed'
  | 'rejected'
  | 'expired'

export type AvmMaterial = {
  category: string
  serial: string
  outOk: boolean
}

export type AvmVisit = {
  id: string
  token: string
  passCode: string
  cardCode: string
  status: VisitStatus
  tenantId: string
  visitorCompany: string
  govIdType: AvmGovIdType
  govIdPhoto: string
  companyIdPhoto: string
  ocrName: string
  ocrText: string
  docsDeletedAt: string
  branchId: string
  branchName: string
  buildingId: string
  buildingName: string
  hostId: string
  hostName: string
  hostEmail: string
  hostMobile: string
  hostDept: string
  escortRequired: boolean
  escortMobile: string
  visitDate: string
  windowFrom: string
  windowTo: string
  visitorMobile: string
  visitorName: string
  facePhoto: string
  materials: AvmMaterial[]
  createdAt: string
  registeredAt: string
  approvedAt: string
  arrivedAt: string
  closedAt: string
  createdBy: string
}

export type AvmBuilding = {
  id: string
  tenantId: string
  branchId: string
  branchName: string
  name: string
  active: boolean
}

export type AvmHost = {
  id: string
  tenantId: string
  branchId: string
  branchName: string
  buildingId: string
  name: string
  mobile: string
  email: string
  department: string
  active: boolean
}

export type AvmAggregate = {
  ymd: string
  tenantId: string
  branchId: string
  branchName: string
  buildingId: string
  buildingName: string
  visitorCount: number
  closedCount: number
  notClosedCount: number
  peakHours: Record<string, number>
  hostDepts: Record<string, number>
  materialsIn: Record<string, number>
  materialsOut: Record<string, number>
}

const BUILDINGS_KEY = 'avm:buildings'
const HOSTS_KEY = 'avm:hosts'
const OPEN_KEY = 'avm:open'
const TENANTS_KEY = 'avm:tenants'
const USERS_KEY = 'avm:users'

const SEED_TENANT: AvmTenant = {
  id: SEED_TENANT_ID,
  companyName: 'Agile Security Force Private Limited',
  logo: '',
  retention: 'officer30',
  active: true,
  createdAt: '2026-08-30T00:00:00.000Z',
}

const SEED_CORPORATE: AvmBuilding = {
  id: 'bldg-co',
  tenantId: SEED_TENANT_ID,
  branchId: 'Corporate Office',
  branchName: 'Corporate Office',
  name: 'Corporate Office',
  active: true,
}

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url, token } : null
}

export function avmStorageOk(): boolean {
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

async function setJson(key: string, value: unknown, ttlSec?: number): Promise<boolean> {
  const payload = JSON.stringify(value)
  const r = ttlSec
    ? await redis(['SET', key, payload, 'EX', ttlSec])
    : await redis(['SET', key, payload])
  return r?.result === 'OK'
}

export function avmNid(p = 'avm'): string {
  return `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

/** Strip government ID-shaped digit runs so they never land in Redis or mail. */
export function redactSensitiveDigits(raw: string, max = 400): string {
  return String(raw ?? '')
    .replace(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, '[redacted]')
    .replace(/\b\d{12,}\b/g, '[redacted]')
    .replace(/\b[A-Z][0-9]{7}\b/gi, '[redacted]')
    .trim()
    .slice(0, max)
}

export function normalizeMobile10(raw: string): string {
  const d = String(raw || '').replace(/\D/g, '')
  if (d.length === 10) return d
  if (d.length === 12 && d.startsWith('91')) return d.slice(2)
  if (d.length === 11 && d.startsWith('0')) return d.slice(1)
  return ''
}

export function istYmd(d = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(d)
  const pick = (t: string) => parts.find((p) => p.type === t)?.value || ''
  return `${pick('year')}-${pick('month')}-${pick('day')}`
}

export function istHour(d = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(d)
  return parts.find((p) => p.type === 'hour')?.value?.padStart(2, '0') || '00'
}

export function istNow(): Date {
  const utcMs = Date.now() + new Date().getTimezoneOffset() * 60_000
  return new Date(utcMs + (5 * 60 + 30) * 60_000)
}

export function cardDatePart(ymd: string): string {
  const p = String(ymd || '').split('-')
  if (p.length === 3 && p[0].length === 4) return `${p[2]}-${p[1]}-${p[0]}`
  return String(ymd || '')
}

export function buildingLetters(name: string): string {
  const s = String(name || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
  return (s + 'XXX').slice(0, 3)
}

export function formatPassCard(letters: string, seq: number, ymd: string): string {
  return `${buildingLetters(letters)}/${String(Math.max(1, seq || 1)).padStart(4, '0')}/${cardDatePart(ymd)}`
}

function visitKey(id: string) {
  return `avm:visit:${id}`
}
function tokenKey(token: string) {
  return `avm:token:${token}`
}
function passKey(pass: string) {
  return `avm:pass:${pass}`
}
function dayKey(ymd: string) {
  return `avm:day:${ymd}`
}
function aggKey(ymd: string, branchId: string, buildingId: string) {
  return `avm:agg:${ymd}:${String(branchId || '').trim()}:${String(buildingId || '').trim()}`
}

export function emptyAggregate(
  ymd: string,
  branchId: string,
  branchName: string,
  buildingId: string,
  buildingName: string,
  tenantId = SEED_TENANT_ID,
): AvmAggregate {
  return {
    ymd,
    tenantId,
    branchId,
    branchName,
    buildingId,
    buildingName,
    visitorCount: 0,
    closedCount: 0,
    notClosedCount: 0,
    peakHours: {},
    hostDepts: {},
    materialsIn: {},
    materialsOut: {},
  }
}

function sanitizeMaterials(list: unknown): AvmMaterial[] {
  if (!Array.isArray(list)) return []
  return list.slice(0, 12).map((row) => {
    const r = (row || {}) as Record<string, unknown>
    const cat = MATERIAL_CATEGORIES.includes(String(r.category) as (typeof MATERIAL_CATEGORIES)[number])
      ? String(r.category)
      : 'Other'
    return {
      category: cat,
      serial: redactSensitiveDigits(String(r.serial ?? ''), 40),
      outOk: r.outOk === true,
    }
  })
}

export function companyIdRequired(visitorCompany: string): boolean {
  return String(visitorCompany || '').trim().length > 0
}

export function gateVisit(v: AvmVisit): Record<string, unknown> {
  return {
    id: v.id,
    status: v.status,
    visitorName: v.visitorName,
    visitorCompany: v.visitorCompany,
    visitorMobile: v.visitorMobile,
    passCode: v.passCode,
    cardCode: v.cardCode,
    buildingName: v.buildingName,
    visitDate: v.visitDate,
    windowFrom: v.windowFrom,
    windowTo: v.windowTo,
  }
}

export function publicVisit(v: AvmVisit): Record<string, unknown> {
  return {
    id: v.id,
    token: v.token,
    passCode: v.status === 'approved' || v.status === 'arrived' ? v.passCode : '',
    cardCode: v.cardCode,
    status: v.status,
    tenantId: v.tenantId,
    visitorCompany: v.visitorCompany,
    companyIdRequired: companyIdRequired(v.visitorCompany),
    govIdType: v.govIdType,
    ocrName: v.ocrName,
    branchName: v.branchName,
    buildingName: v.buildingName,
    hostName: v.hostName,
    hostDept: v.hostDept,
    escortRequired: v.escortRequired,
    visitDate: v.visitDate,
    windowFrom: v.windowFrom,
    windowTo: v.windowTo,
    visitorMobile: v.visitorMobile,
    visitorName: v.visitorName,
    facePhoto: v.facePhoto,
    materials: v.materials,
  }
}

export function officerVisit(v: AvmVisit): Record<string, unknown> {
  return {
    ...publicVisit(v),
    passCode: v.passCode,
    cardCode: v.cardCode,
    govIdPhoto: v.govIdPhoto,
    companyIdPhoto: v.companyIdPhoto,
    ocrText: v.ocrText,
    docsDeletedAt: v.docsDeletedAt,
    branchId: v.branchId,
    buildingId: v.buildingId,
    hostId: v.hostId,
    hostEmail: v.hostEmail,
    hostMobile: v.hostMobile,
    escortMobile: v.escortRequired ? v.escortMobile : '',
    createdBy: v.createdBy,
    createdAt: v.createdAt,
    registeredAt: v.registeredAt,
    approvedAt: v.approvedAt,
    arrivedAt: v.arrivedAt,
    closedAt: v.closedAt,
  }
}

export function staffVisit(v: AvmVisit): Record<string, unknown> {
  return officerVisit(v)
}

export async function getTenants(): Promise<AvmTenant[]> {
  const rows = await getJson<AvmTenant[]>(TENANTS_KEY, [])
  if (!rows.some((t) => t.id === SEED_TENANT.id && t.active !== false)) {
    const next = [SEED_TENANT, ...rows.filter((t) => t.id !== SEED_TENANT.id)]
    await setJson(TENANTS_KEY, next)
    return next
  }
  return rows
}

export async function saveTenants(rows: AvmTenant[]): Promise<boolean> {
  return setJson(TENANTS_KEY, rows.filter((t) => t.id))
}

export async function getTenant(id: string): Promise<AvmTenant | null> {
  const rows = await getTenants()
  return rows.find((t) => t.id === id && t.active !== false) || null
}

export async function getClientUsers(): Promise<AvmClientUser[]> {
  return getJson<AvmClientUser[]>(USERS_KEY, [])
}

export async function saveClientUsers(rows: AvmClientUser[]): Promise<boolean> {
  return setJson(USERS_KEY, rows.filter((u) => u.id))
}

export async function visitTtlForTenant(tenantId: string): Promise<number> {
  const t = await getTenant(tenantId)
  return t?.retention === 'officer30' ? OFFICER_DOC_TTL_SEC : VISIT_TTL_SEC
}

export async function getBuildings(): Promise<AvmBuilding[]> {
  const rows = await getJson<AvmBuilding[]>(BUILDINGS_KEY, [])
  const normalised = rows.map((b) => ({ ...b, tenantId: b.tenantId || SEED_TENANT_ID }))
  if (!normalised.some((b) => b.id === SEED_CORPORATE.id && b.active !== false)) {
    const next = [SEED_CORPORATE, ...normalised.filter((b) => b.id !== SEED_CORPORATE.id)]
    await setJson(BUILDINGS_KEY, next)
    return next
  }
  return normalised
}

export async function saveBuildings(rows: AvmBuilding[]): Promise<boolean> {
  const list = rows.filter((b) => b.id)
  if (!list.some((b) => b.id === SEED_CORPORATE.id)) list.unshift(SEED_CORPORATE)
  return setJson(BUILDINGS_KEY, list)
}

export async function getHosts(): Promise<AvmHost[]> {
  return getJson<AvmHost[]>(HOSTS_KEY, [])
}

export async function saveHosts(rows: AvmHost[]): Promise<boolean> {
  return setJson(HOSTS_KEY, rows.filter((h) => h.id))
}

async function rememberOpen(id: string, ymd: string) {
  await redis(['SADD', OPEN_KEY, id])
  await redis(['SADD', dayKey(ymd), id])
  await redis(['EXPIRE', dayKey(ymd), String(VISIT_TTL_SEC)])
}

async function forgetOpen(id: string, ymd: string) {
  await redis(['SREM', OPEN_KEY, id])
  if (ymd) await redis(['SREM', dayKey(ymd), id])
}

export async function saveVisit(visit: AvmVisit): Promise<boolean> {
  const ttl = await visitTtlForTenant(visit.tenantId || SEED_TENANT_ID)
  const ok = await setJson(visitKey(visit.id), visit, ttl)
  if (!ok) return false
  await redis(['SET', tokenKey(visit.token), visit.id, 'EX', ttl])
  if (visit.passCode) await redis(['SET', passKey(visit.passCode), visit.id, 'EX', ttl])
  await rememberOpen(visit.id, visit.visitDate)
  return true
}

export async function getVisit(id: string): Promise<AvmVisit | null> {
  const v = await getJson<AvmVisit | null>(visitKey(id), null)
  return v?.id ? v : null
}

export async function getVisitByToken(token: string): Promise<AvmVisit | null> {
  const d = await redis(['GET', tokenKey(String(token || '').trim())])
  const id = typeof d?.result === 'string' ? d.result : ''
  return id ? getVisit(id) : null
}

export async function getVisitByPass(passCode: string): Promise<AvmVisit | null> {
  const d = await redis(['GET', passKey(String(passCode || '').trim().toUpperCase())])
  const id = typeof d?.result === 'string' ? d.result : ''
  return id ? getVisit(id) : null
}

async function listIds(key: string): Promise<string[]> {
  const d = await redis(['SMEMBERS', key])
  const raw = d?.result
  if (!Array.isArray(raw)) return []
  return raw.map((x) => String(x)).filter(Boolean)
}

export async function listOpenVisits(): Promise<AvmVisit[]> {
  const ids = await listIds(OPEN_KEY)
  const rows: AvmVisit[] = []
  for (const id of ids) {
    const v = await getVisit(id)
    if (v) rows.push(v)
    else await redis(['SREM', OPEN_KEY, id])
  }
  return rows
}

export async function listVisitsForDay(ymd: string): Promise<AvmVisit[]> {
  const ids = await listIds(dayKey(ymd))
  const rows: AvmVisit[] = []
  for (const id of ids) {
    const v = await getVisit(id)
    if (v) rows.push(v)
  }
  return rows
}

export function listIstYmds(days: number): string[] {
  const out: string[] = []
  const now = Date.now()
  for (let i = 0; i < days; i++) out.push(istYmd(new Date(now - i * 86400000)))
  return [...new Set(out)]
}

export async function listRecentVisits(days = 30): Promise<AvmVisit[]> {
  const seen = new Set<string>()
  const rows: AvmVisit[] = []
  for (const ymd of listIstYmds(days)) {
    for (const v of await listVisitsForDay(ymd)) {
      if (!seen.has(v.id)) {
        seen.add(v.id)
        rows.push(v)
      }
    }
  }
  for (const v of await listOpenVisits()) {
    if (!seen.has(v.id)) {
      seen.add(v.id)
      rows.push(v)
    }
  }
  return rows
}

export function istDateTimeLabel(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const pick = (t: string) => parts.find((p) => p.type === t)?.value || ''
  return `${pick('day')}/${pick('month')}/${pick('year')} ${pick('hour')}.${pick('minute')}hrs`
}

export function istShiftLabel(iso: string): string {
  if (!iso) return 'Shift A (Morning)'
  const h = Number(istHour(new Date(iso)))
  if (h >= 6 && h < 14) return 'Shift A (Morning)'
  if (h >= 14 && h < 22) return 'Shift B (Afternoon)'
  return 'Shift C (Night)'
}

export function hoursSpentLabel(fromIso: string, toIso: string): string {
  if (!fromIso) return '—'
  if (!toIso) return 'In premises'
  const a = new Date(fromIso).getTime()
  const b = new Date(toIso).getTime()
  if (!a || !b || b < a) return '—'
  const mins = Math.round((b - a) / 60000)
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`
}

export function branchMatches(visit: AvmVisit, branchId: string, branchName: string): boolean {
  const id = String(branchId || '').trim()
  const name = String(branchName || '').trim()
  if (!id && !name) return true
  if (id && (visit.branchId === id || visit.branchName === id)) return true
  if (name && (visit.branchName === name || visit.branchId === name)) return true
  return false
}

export async function nextCardCode(buildingName: string, ymd: string): Promise<string> {
  const letters = buildingLetters(buildingName)
  const key = `avm:cardseq:${letters}:${ymd}`
  const r = await redis(['INCR', key])
  const n = Number(r?.result || 1) || 1
  await redis(['EXPIRE', key, String(VISIT_TTL_SEC)])
  return formatPassCard(letters, n, ymd)
}

export function newPassCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = 'AVM-'
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
  return s
}

export async function getAggregate(
  ymd: string,
  branchId: string,
  buildingId: string,
): Promise<AvmAggregate | null> {
  const row = await getJson<AvmAggregate | null>(aggKey(ymd, branchId, buildingId), null)
  return row?.ymd ? row : null
}

export async function listAggregates(ymd: string): Promise<AvmAggregate[]> {
  const buildings = await getBuildings()
  const rows: AvmAggregate[] = []
  for (const b of buildings) {
    const a = await getAggregate(ymd, b.branchId, b.id)
    if (a) rows.push(a)
  }
  return rows
}

function bumpMap(map: Record<string, number>, key: string, n = 1) {
  const k = String(key || '—').trim() || '—'
  map[k] = (map[k] || 0) + n
}

export async function incrementAggregate(visit: AvmVisit, kind: 'closed' | 'not-closed'): Promise<void> {
  const ymd = visit.visitDate || istYmd()
  const key = aggKey(ymd, visit.branchId, visit.buildingId)
  const cur =
    (await getAggregate(ymd, visit.branchId, visit.buildingId)) ||
    emptyAggregate(
      ymd,
      visit.branchId,
      visit.branchName,
      visit.buildingId,
      visit.buildingName,
      visit.tenantId || SEED_TENANT_ID,
    )
  cur.tenantId = visit.tenantId || cur.tenantId || SEED_TENANT_ID
  cur.visitorCount += 1
  if (kind === 'closed') cur.closedCount += 1
  else cur.notClosedCount += 1
  bumpMap(cur.peakHours, visit.arrivedAt ? istHour(new Date(visit.arrivedAt)) : istHour())
  bumpMap(cur.hostDepts, visit.hostDept || '—')
  for (const m of visit.materials || []) {
    bumpMap(cur.materialsIn, m.category)
    if (m.outOk) bumpMap(cur.materialsOut, m.category)
  }
  await setJson(key, cur)
}

export async function deleteVisitPii(visit: AvmVisit): Promise<void> {
  await redis(['DEL', visitKey(visit.id)])
  await redis(['DEL', tokenKey(visit.token)])
  if (visit.passCode) await redis(['DEL', passKey(visit.passCode)])
  await forgetOpen(visit.id, visit.visitDate)
}

export async function closeVisitAndWipe(visit: AvmVisit, materials: AvmMaterial[]): Promise<AvmVisit> {
  const tenant = await getTenant(visit.tenantId || SEED_TENANT_ID)
  const closed: AvmVisit = {
    ...visit,
    status: 'closed',
    materials: sanitizeMaterials(materials),
    closedAt: new Date().toISOString(),
  }
  await incrementAggregate(closed, 'closed')
  if (tenant?.retention === 'night') {
    await deleteVisitPii(closed)
    return closed
  }
  await saveVisit(closed)
  return closed
}

export async function deleteOfficerDocs(visit: AvmVisit): Promise<AvmVisit> {
  const next: AvmVisit = {
    ...visit,
    govIdPhoto: '',
    companyIdPhoto: '',
    facePhoto: '',
    ocrText: '',
    docsDeletedAt: new Date().toISOString(),
  }
  await saveVisit(next)
  return next
}

export async function purgeDayVisits(ymd: string): Promise<{ purged: number; notClosed: number }> {
  const open = await listOpenVisits()
  const tenants = await getTenants()
  const night = new Set(tenants.filter((t) => t.retention === 'night').map((t) => t.id))
  let purged = 0
  let notClosed = 0
  for (const v of open) {
    const tid = v.tenantId || SEED_TENANT_ID
    if (!night.has(tid)) continue
    const sameDay = v.visitDate === ymd
    if (!sameDay && v.visitDate > ymd) continue
    if (v.status !== 'closed') {
      await incrementAggregate(v, 'not-closed')
      notClosed += 1
    }
    await deleteVisitPii(v)
    purged += 1
  }
  return { purged, notClosed }
}

export function dailySentKey(ymd: string) {
  return `avm:daily-sent:${ymd}`
}

export async function wasDailySent(ymd: string): Promise<boolean> {
  const d = await redis(['GET', dailySentKey(ymd)])
  return d?.result === '1'
}

export async function markDailySent(ymd: string): Promise<void> {
  await redis(['SET', dailySentKey(ymd), '1', 'EX', 172800])
}

function asPhoto(raw: unknown): string {
  const s = String(raw || '')
  return s.startsWith('data:image/') ? s.slice(0, 220_000) : ''
}

export function sanitizeVisitInput(partial: Partial<AvmVisit>): Partial<AvmVisit> {
  return {
    ...partial,
    visitorName: redactSensitiveDigits(String(partial.visitorName || ''), 80),
    visitorCompany: redactSensitiveDigits(String(partial.visitorCompany || ''), 80),
    visitorMobile: normalizeMobile10(String(partial.visitorMobile || '')),
    hostName: redactSensitiveDigits(String(partial.hostName || ''), 80),
    hostDept: redactSensitiveDigits(String(partial.hostDept || ''), 60),
    buildingName: redactSensitiveDigits(String(partial.buildingName || ''), 80),
    escortMobile: normalizeMobile10(String(partial.escortMobile || '')),
    ocrName: redactSensitiveDigits(String(partial.ocrName || ''), 80),
    ocrText: redactSensitiveDigits(String(partial.ocrText || ''), 800),
    facePhoto: asPhoto(partial.facePhoto),
    govIdPhoto: asPhoto(partial.govIdPhoto),
    companyIdPhoto: asPhoto(partial.companyIdPhoto),
    materials: sanitizeMaterials(partial.materials),
  }
}
