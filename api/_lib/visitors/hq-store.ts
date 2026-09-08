/**
 * Agile Visitors — Management (HQ) lists.
 * Clients, complaints, users, guard logs, dummy link verification.
 * Visit / Gate / Officer store stays in store.ts for the later client portal.
 */
import { createHash, randomInt } from 'node:crypto'
import {
  avmNid,
  avmStorageOk,
  getBuildings,
  getTenants,
  istYmd,
  normalizeMobile10,
  saveBuildings,
  saveTenants,
  type AvmTenant,
} from './store.js'

export type AvmLinkStatus = 'pending' | 'sent' | 'registered' | 'verified' | 'inactive'

export type AvmHqClient = {
  id: string
  branchId: string
  branchName: string
  misClientId: string
  clientLocation: string
  companyName: string
  sanctionedPosts: string
  staffName: string
  designation: string
  email: string
  mobile: string
  linkToken: string
  linkUrl: string
  linkSentAt: string
  verified: boolean
  verifiedAt: string
  status: AvmLinkStatus
  registeredYmd: string
  createdAt: string
}

export type AvmComplaintStatus = 'under-process' | 'review-draft' | 'completed'

export type AvmComplaint = {
  id: string
  ticketNo: string
  clientId: string
  clientName: string
  branchId: string
  branchName: string
  ymd: string
  time: string
  receivedFrom: string
  email: string
  mobile: string
  issue: string
  status: AvmComplaintStatus
  respondTime: string
  source: 'client' | 'hq'
  closedYmd: string
  closedTime: string
  createdAt: string
  updatedAt: string
}

export type AvmStaffRole = 'guard' | 'officer' | 'manager'

export type AvmHqUser = {
  id: string
  clientId: string
  clientName: string
  staffName: string
  idNo: string
  email: string
  mobile: string
  department: string
  workAs: string
  role: AvmStaffRole
  active: boolean
  canManageUsers: boolean
  gatePinHash: string
  pinIssuedAt: string
  linkSentOn: string
  createdAt: string
}

export type AvmGate = {
  id: string
  clientId: string
  clientName: string
  gateName: string
  shift: string
  mobile: string
  pinHash: string
  pinIssuedAt: string
  pinShift: string
  createdAt: string
}

export type AvmGuardLog = {
  id: string
  clientId: string
  clientName: string
  ymd: string
  loginTime: string
  logoutTime: string
  visitorsHandled: number
  createdAt: string
}

const CLIENTS_KEY = 'avm:hq:clients'
const COMPLAINTS_KEY = 'avm:hq:complaints'
const HQ_USERS_KEY = 'avm:hq:users'
const GUARD_LOGS_KEY = 'avm:hq:guard-logs'
const GATES_KEY = 'avm:hq:gates'
const PUBLIC_BASE = 'https://www.agilegroup-digital.co.in'

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

export function hqStorageOk(): boolean {
  return avmStorageOk()
}

export function clientLinkUrl(token: string): string {
  return `${PUBLIC_BASE}/avm-check/${encodeURIComponent(token)}`
}

export function istHm(d = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const pick = (t: string) => parts.find((p) => p.type === t)?.value || '00'
  return `${pick('hour')}:${pick('minute')}`
}

export function cardDatePart(ymd: string): string {
  const p = String(ymd || '').split('-')
  if (p.length === 3 && p[0].length === 4) return `${p[2]}-${p[1]}-${p[0]}`
  return String(ymd || '')
}

function slugPart(s: string, n: number) {
  return (
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, n) || 'x'
  )
}

/** Unique token per Agile branch + client location. */
export function newClientLinkToken(branchName: string, clientName: string, location: string) {
  return `cl-${slugPart(branchName, 8)}-${slugPart(clientName, 10)}-${slugPart(location, 10)}-${avmNid('x').slice(-8)}`
}

export function normalizeHqClient(c: AvmHqClient): AvmHqClient {
  return {
    ...c,
    branchId: c.branchId || '',
    branchName: c.branchName || '',
    misClientId: c.misClientId || '',
    clientLocation: c.clientLocation || '',
    sanctionedPosts: c.sanctionedPosts || '',
    registeredYmd: c.registeredYmd || (c.createdAt ? String(c.createdAt).slice(0, 10) : istYmd()),
  }
}

export function sameIssuedClient(a: AvmHqClient, branchId: string, misClientId: string, companyName = '') {
  if (a.branchId && branchId && a.misClientId && misClientId) {
    return a.branchId === branchId && a.misClientId === misClientId
  }
  return !!(
    a.branchId &&
    branchId &&
    a.branchId === branchId &&
    companyName &&
    String(a.companyName || '').toLowerCase() === companyName.toLowerCase()
  )
}

export async function getHqClients(): Promise<AvmHqClient[]> {
  const rows = await getJson<AvmHqClient[]>(CLIENTS_KEY, [])
  return rows.filter((c) => c?.id).map(normalizeHqClient)
}

export async function saveHqClients(rows: AvmHqClient[]): Promise<boolean> {
  return setJson(CLIENTS_KEY, rows.filter((c) => c.id))
}

export async function getHqClient(id: string): Promise<AvmHqClient | null> {
  const rows = await getHqClients()
  return rows.find((c) => c.id === id) || null
}

export async function getHqClientByToken(token: string): Promise<AvmHqClient | null> {
  const t = String(token || '').trim()
  if (!t) return null
  const rows = await getHqClients()
  return rows.find((c) => c.linkToken === t) || null
}

export function ensureClientLink(row: AvmHqClient): AvmHqClient {
  const next = normalizeHqClient(row)
  const token = next.linkToken || newClientLinkToken(next.branchName, next.companyName, next.clientLocation)
  return {
    ...next,
    linkToken: token,
    linkUrl: clientLinkUrl(token),
    status: next.status === 'verified' ? 'verified' : next.linkSentAt ? 'registered' : next.status || 'pending',
  }
}

export async function deleteHqClient(id: string): Promise<boolean> {
  const list = (await getHqClients()).filter((c) => c.id !== id)
  return saveHqClients(list)
}

export async function upsertHqClient(row: AvmHqClient): Promise<AvmHqClient> {
  const next = ensureClientLink(row)
  const list = await getHqClients()
  const i = list.findIndex((c) => c.id === next.id)
  if (i >= 0) list[i] = next
  else list.push(next)
  await saveHqClients(list)
  return next
}

export async function markClientLinkVerified(token: string): Promise<AvmHqClient | null> {
  const row = await getHqClientByToken(token)
  if (!row) return null
  const now = new Date().toISOString()
  const next: AvmHqClient = {
    ...row,
    verified: true,
    verifiedAt: now,
    status: 'verified',
  }
  await upsertHqClient(next)
  return next
}

/** Hyderabad-A → HYD-A · Chennai → CHE */
export function avmBranchTokenPrefix(branchName: string): string {
  const n = String(branchName || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
  if (/hyd(?:erabad)?[\s_-]*a\b/.test(n) || /hyderabad\s*-?\s*a\b/.test(n)) return 'HYD-A'
  if (/hyd(?:erabad)?[\s_-]*b\b/.test(n) || /hyderabad\s*-?\s*b\b/.test(n)) return 'HYD-B'
  if (/hi[-\s]?tech/.test(n)) return 'HIT'
  const letters = String(branchName || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
  return (letters + 'XXX').slice(0, 3)
}

export function respondTimeLabel(fromIso: string, to = new Date()): string {
  const a = Date.parse(fromIso)
  if (!Number.isFinite(a)) return '—'
  const mins = Math.max(0, Math.round((to.getTime() - a) / 60000))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h <= 0) return `${m} min`
  return `${h} hr ${m} min`
}

export function normalizeComplaint(c: AvmComplaint): AvmComplaint {
  const status: AvmComplaintStatus =
    c.status === 'completed' || c.status === 'review-draft' ? c.status : 'under-process'
  return {
    ...c,
    branchId: c.branchId || '',
    branchName: c.branchName || '',
    mobile: c.mobile || '',
    status,
    respondTime: c.respondTime || '',
    source: c.source === 'client' ? 'client' : 'hq',
  }
}

export async function getComplaints(): Promise<AvmComplaint[]> {
  return (await getJson<AvmComplaint[]>(COMPLAINTS_KEY, [])).filter((r) => r?.id).map(normalizeComplaint)
}

export async function saveComplaints(rows: AvmComplaint[]): Promise<boolean> {
  return setJson(COMPLAINTS_KEY, rows.filter((r) => r.id))
}

export async function nextTicketNo(ymd = istYmd(), branchName = ''): Promise<string> {
  const prefix = avmBranchTokenPrefix(branchName)
  const rows = await getComplaints()
  let max = 0
  for (const r of rows) {
    const m = String(r.ticketNo || '').match(/\/AVM\/(\d+)\//)
    if (!m) continue
    if (prefix && !String(r.ticketNo).startsWith(`${prefix}/`)) continue
    const n = parseInt(m[1], 10)
    if (Number.isFinite(n) && n > max) max = n
  }
  return `${prefix}/AVM/${String(max + 1).padStart(3, '0')}/${cardDatePart(ymd)}`
}

export async function upsertComplaint(row: AvmComplaint): Promise<AvmComplaint> {
  const next = normalizeComplaint(row)
  const list = await getComplaints()
  const i = list.findIndex((r) => r.id === next.id)
  if (i >= 0) list[i] = next
  else list.push(next)
  await saveComplaints(list)
  return next
}

export async function deleteComplaint(id: string): Promise<boolean> {
  const list = (await getComplaints()).filter((r) => r.id !== id)
  return saveComplaints(list)
}

export function hashGatePin(pin: string): string {
  return createHash('sha256').update(`avm-gate-pin:${String(pin || '').trim()}`).digest('hex')
}

export function newGatePin(): string {
  return String(randomInt(100000, 999999))
}

export function normalizeStaff(u: AvmHqUser): AvmHqUser {
  const role: AvmStaffRole = u.role === 'guard' || u.role === 'manager' ? u.role : 'officer'
  return {
    ...u,
    idNo: u.idNo || '',
    department: u.department || '',
    workAs: u.workAs || (role === 'guard' ? 'Security Guards' : role === 'manager' ? 'Security Head' : 'Staff'),
    role,
    active: u.active !== false,
    canManageUsers: u.canManageUsers === true || role === 'manager',
    gatePinHash: u.gatePinHash || '',
    pinIssuedAt: u.pinIssuedAt || '',
  }
}

export function publicStaff(u: AvmHqUser) {
  const n = normalizeStaff(u)
  return {
    id: n.id,
    clientId: n.clientId,
    clientName: n.clientName,
    staffName: n.staffName,
    idNo: n.idNo,
    email: n.email,
    mobile: n.mobile,
    department: n.department,
    workAs: n.workAs,
    role: n.role,
    active: n.active,
    canManageUsers: n.canManageUsers,
    hasPin: !!n.gatePinHash,
    pinIssuedAt: n.pinIssuedAt,
    linkSentOn: n.linkSentOn,
  }
}

export async function getHqUsers(): Promise<AvmHqUser[]> {
  return (await getJson<AvmHqUser[]>(HQ_USERS_KEY, [])).filter((u) => u?.id).map(normalizeStaff)
}

export async function saveHqUsers(rows: AvmHqUser[]): Promise<boolean> {
  return setJson(HQ_USERS_KEY, rows.filter((u) => u.id))
}

export async function upsertHqUser(row: AvmHqUser): Promise<AvmHqUser> {
  const next = normalizeStaff(row)
  const list = await getHqUsers()
  const i = list.findIndex((u) => u.id === next.id)
  if (i >= 0) list[i] = next
  else list.push(next)
  await saveHqUsers(list)
  return list.find((u) => u.id === next.id) || next
}

export async function setUserPin(user: AvmHqUser): Promise<{ user: AvmHqUser; pin: string }> {
  const pin = newGatePin()
  const saved = await upsertHqUser({
    ...normalizeStaff(user),
    gatePinHash: hashGatePin(pin),
    pinIssuedAt: new Date().toISOString(),
  })
  return { user: saved, pin }
}

export function verifyUserPin(user: AvmHqUser, pin: string): boolean {
  const p = String(pin || '').trim()
  if (!/^\d{6}$/.test(p) || !user.gatePinHash || user.active === false) return false
  return user.gatePinHash === hashGatePin(p)
}

export async function deleteHqUser(id: string): Promise<boolean> {
  const list = (await getHqUsers()).filter((u) => u.id !== id)
  return saveHqUsers(list)
}

export function normalizeGate(g: AvmGate): AvmGate {
  return {
    ...g,
    gateName: String(g.gateName || '').trim(),
    shift: g.shift || 'Shift A (Morning)',
    mobile: g.mobile || '',
    pinHash: g.pinHash || '',
    pinIssuedAt: g.pinIssuedAt || '',
    pinShift: g.pinShift || g.shift || '',
  }
}

export function publicGate(g: AvmGate) {
  const n = normalizeGate(g)
  return {
    id: n.id,
    clientId: n.clientId,
    clientName: n.clientName,
    gateName: n.gateName,
    shift: n.shift,
    mobile: n.mobile,
    hasPin: !!n.pinHash,
    pinIssuedAt: n.pinIssuedAt,
    pinShift: n.pinShift,
  }
}

export async function getHqGates(): Promise<AvmGate[]> {
  return (await getJson<AvmGate[]>(GATES_KEY, [])).filter((g) => g?.id).map(normalizeGate)
}

export async function saveHqGates(rows: AvmGate[]): Promise<boolean> {
  return setJson(GATES_KEY, rows.filter((g) => g.id))
}

export async function ensureDefaultGate(clientId: string, clientName: string): Promise<AvmGate> {
  const existing = (await getHqGates()).find((g) => g.clientId === clientId)
  if (existing) return existing
  return upsertHqGate({
    id: avmNid('gate'),
    clientId,
    clientName,
    gateName: 'Gate',
    shift: '',
    mobile: '',
    pinHash: '',
    pinIssuedAt: '',
    pinShift: '',
    createdAt: new Date().toISOString(),
  })
}

export async function upsertHqGate(row: AvmGate): Promise<AvmGate> {
  const next = normalizeGate(row)
  const list = await getHqGates()
  const i = list.findIndex((g) => g.id === next.id)
  if (i >= 0) list[i] = next
  else list.push(next)
  await saveHqGates(list)
  return list.find((g) => g.id === next.id) || next
}

export async function deleteHqGate(id: string): Promise<boolean> {
  return saveHqGates((await getHqGates()).filter((g) => g.id !== id))
}

export async function setGatePin(gate: AvmGate): Promise<{ gate: AvmGate; pin: string }> {
  const pin = newGatePin()
  const saved = await upsertHqGate({
    ...normalizeGate(gate),
    pinHash: hashGatePin(pin),
    pinIssuedAt: new Date().toISOString(),
    pinShift: gate.shift || 'Shift A (Morning)',
  })
  return { gate: saved, pin }
}

export function verifyGatePin(gate: AvmGate, pin: string): boolean {
  const p = String(pin || '').trim()
  if (!/^\d{6}$/.test(p) || !gate.pinHash) return false
  return gate.pinHash === hashGatePin(p)
}

export type AvmShiftDuty = {
  id: string
  clientId: string
  clientName: string
  gateId: string
  gateName: string
  ymd: string
  shift: string
  guardName: string
  idNo: string
  mobile: string
  pinHash: string
  pinIssuedAt: string
  createdAt: string
}

const DUTIES_KEY = 'avm:hq:shift-duties'

export function normalizeDuty(d: AvmShiftDuty): AvmShiftDuty {
  return {
    ...d,
    gateName: String(d.gateName || '').trim(),
    shift: d.shift || 'Shift A (Morning)',
    guardName: String(d.guardName || '').trim(),
    idNo: d.idNo || '',
    mobile: d.mobile || '',
    pinHash: d.pinHash || '',
    pinIssuedAt: d.pinIssuedAt || '',
    ymd: d.ymd || '',
  }
}

export function publicDuty(d: AvmShiftDuty) {
  const n = normalizeDuty(d)
  return {
    id: n.id,
    clientId: n.clientId,
    clientName: n.clientName,
    gateId: n.gateId,
    gateName: n.gateName,
    ymd: n.ymd,
    shift: n.shift,
    guardName: n.guardName,
    idNo: n.idNo,
    mobile: n.mobile,
    hasPin: !!n.pinHash,
    pinIssuedAt: n.pinIssuedAt,
  }
}

export async function getShiftDuties(): Promise<AvmShiftDuty[]> {
  return (await getJson<AvmShiftDuty[]>(DUTIES_KEY, [])).filter((d) => d?.id).map(normalizeDuty)
}

export async function saveShiftDuties(rows: AvmShiftDuty[]): Promise<boolean> {
  return setJson(DUTIES_KEY, rows.filter((d) => d.id))
}

export async function upsertShiftDuty(row: AvmShiftDuty): Promise<AvmShiftDuty> {
  const next = normalizeDuty(row)
  const list = await getShiftDuties()
  const i = list.findIndex((d) => d.id === next.id)
  if (i >= 0) list[i] = next
  else list.push(next)
  await saveShiftDuties(list)
  return list.find((d) => d.id === next.id) || next
}

export async function deleteShiftDuty(id: string): Promise<boolean> {
  return saveShiftDuties((await getShiftDuties()).filter((d) => d.id !== id))
}

export async function setDutyPin(duty: AvmShiftDuty): Promise<{ duty: AvmShiftDuty; pin: string }> {
  const pin = newGatePin()
  const saved = await upsertShiftDuty({
    ...normalizeDuty(duty),
    pinHash: hashGatePin(pin),
    pinIssuedAt: new Date().toISOString(),
  })
  return { duty: saved, pin }
}

export function verifyDutyPin(duty: AvmShiftDuty, pin: string): boolean {
  const p = String(pin || '').trim()
  if (!/^\d{6}$/.test(p) || !duty.pinHash) return false
  return duty.pinHash === hashGatePin(p)
}

export async function getGuardLogs(): Promise<AvmGuardLog[]> {
  return (await getJson<AvmGuardLog[]>(GUARD_LOGS_KEY, [])).filter((g) => g?.id)
}

export async function saveGuardLogs(rows: AvmGuardLog[]): Promise<boolean> {
  return setJson(GUARD_LOGS_KEY, rows.filter((g) => g.id))
}

export async function upsertGuardLog(row: AvmGuardLog): Promise<AvmGuardLog> {
  const list = await getGuardLogs()
  const i = list.findIndex((g) => g.id === row.id)
  if (i >= 0) list[i] = row
  else list.push(row)
  await saveGuardLogs(list)
  return row
}

/** Tie the Management client row to visit/Gate/Officer data for this company. */
export async function ensureHqClientTenant(client: AvmHqClient): Promise<AvmTenant> {
  const tenants = await getTenants()
  const existing = tenants.find((t) => t.id === client.id)
  const row: AvmTenant = {
    id: client.id,
    companyName: client.companyName,
    logo: existing?.logo || '',
    retention: existing?.retention || 'officer30',
    active: true,
    createdAt: existing?.createdAt || client.createdAt || new Date().toISOString(),
  }
  const i = tenants.findIndex((t) => t.id === client.id)
  if (i >= 0) tenants[i] = { ...tenants[i], ...row }
  else tenants.push(row)
  await saveTenants(tenants)
  const buildings = await getBuildings()
  if (!buildings.some((b) => b.tenantId === client.id && b.active !== false)) {
    buildings.push({
      id: avmNid('bldg'),
      tenantId: client.id,
      branchId: client.id,
      branchName: client.companyName,
      name: 'Main Gate',
      active: true,
    })
    await saveBuildings(buildings)
  }
  return row
}

export { normalizeMobile10 }
