/**
 * Agile Control — Redis store (prefix ac:) separate from Ops manpower (ops:).
 */

import type {
  AcCase,
  AcClientCheck,
  AcHotoRecord,
  AcIncidentReceived,
  AcLogEntry,
  AcNightCall,
  AcPortalUser,
  AcStrategicSite,
  AcTimelineEvent,
  AcUserRole,
} from './types.js'
import { AC_USER_ROLES, acYn } from './types.js'

const PREFIX = 'ac:'
const KEYS = {
  cases: `${PREFIX}cases`,
  log: `${PREFIX}log`,
  hoto: `${PREFIX}hoto`,
  sites: `${PREFIX}strategic-sites`,
  checks: `${PREFIX}client-checks`,
  incidents: `${PREFIX}incidents-received`,
  nightCalls: `${PREFIX}night-calls`,
  users: `${PREFIX}users`,
}

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url, token } : null
}

export function acStorageOk(): boolean {
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

export function acNid(p: string): string {
  return `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function emptyTimeline(
  byEmail: string,
  byName: string,
  kind: string,
  note: string,
): AcTimelineEvent {
  return {
    id: acNid('ev'),
    at: new Date().toISOString(),
    byEmail,
    byName,
    kind,
    note,
  }
}

export async function getAcCases(): Promise<AcCase[]> {
  const list = await getJson<AcCase[]>(KEYS.cases, [])
  return Array.isArray(list) ? list : []
}

export async function saveAcCases(list: AcCase[]): Promise<boolean> {
  return setJson(KEYS.cases, list.slice(0, 5000))
}

export async function upsertAcCase(row: AcCase): Promise<AcCase> {
  const all = await getAcCases()
  const i = all.findIndex((c) => c.id === row.id || c.caseNo === row.caseNo)
  if (i >= 0) all[i] = row
  else all.unshift(row)
  await saveAcCases(all)
  return row
}

export async function findAcCase(idOrNo: string): Promise<AcCase | null> {
  const key = String(idOrNo || '').trim()
  if (!key) return null
  const all = await getAcCases()
  return all.find((c) => c.id === key || c.caseNo === key) || null
}

export async function getAcLog(limit = 500): Promise<AcLogEntry[]> {
  const list = await getJson<AcLogEntry[]>(KEYS.log, [])
  return (Array.isArray(list) ? list : []).slice(0, limit)
}

export async function appendAcLog(entry: Omit<AcLogEntry, 'id' | 'at'> & { at?: string }): Promise<AcLogEntry> {
  const row: AcLogEntry = {
    id: acNid('lg'),
    at: entry.at || new Date().toISOString(),
    byEmail: entry.byEmail || '',
    byName: entry.byName || '',
    kind: entry.kind || 'note',
    text: entry.text || '',
    caseNo: entry.caseNo || '',
    branchId: entry.branchId || '',
  }
  const list = await getAcLog(2000)
  list.unshift(row)
  await setJson(KEYS.log, list.slice(0, 2000))
  return row
}

export async function getAcHoto(): Promise<AcHotoRecord[]> {
  const list = await getJson<AcHotoRecord[]>(KEYS.hoto, [])
  return Array.isArray(list) ? list : []
}

export async function saveAcHoto(list: AcHotoRecord[]): Promise<boolean> {
  return setJson(KEYS.hoto, list.slice(0, 500))
}

export async function getAcStrategicSites(): Promise<AcStrategicSite[]> {
  const list = await getJson<AcStrategicSite[]>(KEYS.sites, [])
  return Array.isArray(list) ? list : []
}

export async function saveAcStrategicSites(list: AcStrategicSite[]): Promise<boolean> {
  return setJson(KEYS.sites, list.slice(0, 2000))
}

export async function getAcClientChecks(): Promise<AcClientCheck[]> {
  const list = await getJson<AcClientCheck[]>(KEYS.checks, [])
  return Array.isArray(list) ? list : []
}

export async function saveAcClientChecks(list: AcClientCheck[]): Promise<boolean> {
  return setJson(KEYS.checks, list.slice(0, 3000))
}

export async function upsertAcClientCheck(row: AcClientCheck): Promise<AcClientCheck> {
  const all = await getAcClientChecks()
  const i = all.findIndex((c) => c.id === row.id)
  if (i >= 0) all[i] = row
  else all.unshift(row)
  await saveAcClientChecks(all)
  return row
}

export async function getAcIncidents(): Promise<AcIncidentReceived[]> {
  const list = await getJson<AcIncidentReceived[]>(KEYS.incidents, [])
  return Array.isArray(list) ? list : []
}

export async function saveAcIncidents(list: AcIncidentReceived[]): Promise<boolean> {
  return setJson(KEYS.incidents, list.slice(0, 4000))
}

export async function upsertAcIncident(row: AcIncidentReceived): Promise<AcIncidentReceived> {
  const all = await getAcIncidents()
  const i = all.findIndex((c) => c.id === row.id)
  if (i >= 0) all[i] = row
  else all.unshift(row)
  await saveAcIncidents(all)
  return row
}

export async function getAcNightCalls(): Promise<AcNightCall[]> {
  const list = await getJson<AcNightCall[]>(KEYS.nightCalls, [])
  return Array.isArray(list) ? list : []
}

export async function saveAcNightCalls(list: AcNightCall[]): Promise<boolean> {
  return setJson(KEYS.nightCalls, list.slice(0, 4000))
}

export async function upsertAcNightCall(row: AcNightCall): Promise<AcNightCall> {
  const all = await getAcNightCalls()
  const i = all.findIndex((c) => c.id === row.id)
  if (i >= 0) all[i] = row
  else all.unshift(row)
  await saveAcNightCalls(all)
  return row
}

export function emptyIncidentReceived(partial: Partial<AcIncidentReceived> = {}): AcIncidentReceived {
  const now = new Date().toISOString()
  const informed = acYn(partial.informedHod)
  return {
    id: String(partial.id || acNid('inc')),
    dateYmd: String(partial.dateYmd || '').slice(0, 10),
    occurredAt: String(partial.occurredAt || now).slice(0, 40),
    clientName: String(partial.clientName || '').slice(0, 160),
    location: String(partial.location || '').slice(0, 200),
    receivedFrom: String(partial.receivedFrom || '').slice(0, 160),
    details: String(partial.details || '').slice(0, 4000),
    branchId: String(partial.branchId || '').slice(0, 40),
    branchName: String(partial.branchName || '').slice(0, 120),
    informedHod: informed,
    informedHodAt: informed === 'Yes' ? String(partial.informedHodAt || now).slice(0, 40) : '',
    createdAt: String(partial.createdAt || now).slice(0, 40),
    createdByEmail: String(partial.createdByEmail || '').slice(0, 120),
    createdByName: String(partial.createdByName || '').slice(0, 120),
    updatedAt: now,
  }
}

export function emptyNightCall(partial: Partial<AcNightCall> = {}): AcNightCall {
  const now = new Date().toISOString()
  return {
    id: String(partial.id || acNid('nc')),
    dateYmd: String(partial.dateYmd || '').slice(0, 10),
    callTime: String(partial.callTime || '').slice(0, 8),
    clientName: String(partial.clientName || '').slice(0, 160),
    location: String(partial.location || '').slice(0, 200),
    guardName: String(partial.guardName || '').slice(0, 120),
    guardMobile: String(partial.guardMobile || '').slice(0, 20),
    pickedUp: acYn(partial.pickedUp),
    calledBack: acYn(partial.calledBack),
    informedHod: acYn(partial.informedHod),
    branchId: String(partial.branchId || '').slice(0, 40),
    branchName: String(partial.branchName || '').slice(0, 120),
    notes: String(partial.notes || '').slice(0, 2000),
    createdAt: String(partial.createdAt || now).slice(0, 40),
    createdByEmail: String(partial.createdByEmail || '').slice(0, 120),
    createdByName: String(partial.createdByName || '').slice(0, 120),
    updatedAt: now,
  }
}

function normaliseAcRole(v: unknown): AcUserRole {
  const raw = String(v ?? '').trim()
  if (!raw) return 'Field Officer'
  const lower = raw.toLowerCase()
  // Migrate old short codes from first Control User management build
  if (lower === 'management' || lower === 'mgmt' || lower === 'director') return 'Director'
  if (lower === 'hod' || lower === 'rm' || lower === 'branch') return 'Regional Manager (RM)'
  if (lower === 'operator' || lower === 'ops' || lower === 'staff') return 'Control Operator'
  const hit = AC_USER_ROLES.find((r) => r.toLowerCase() === lower)
  if (hit) return hit
  // Keep custom label if already saved (max length)
  return raw.slice(0, 80)
}

export function normalizeAcPortalUser(u: Partial<AcPortalUser> & { email?: string }): AcPortalUser {
  const now = new Date().toISOString()
  const email = String(u.email || '')
    .trim()
    .toLowerCase()
    .slice(0, 120)
  return {
    id: String(u.id || acNid('acu')),
    name: String(u.name || '').trim().slice(0, 120),
    email,
    phone: String(u.phone || '').trim().slice(0, 20),
    role: normaliseAcRole(u.role),
    branchId: String(u.branchId || '').trim().slice(0, 40),
    branchName: String(u.branchName || '').trim().slice(0, 120),
    active: u.active !== false,
    createdAt: String(u.createdAt || now).slice(0, 40),
    updatedAt: now,
  }
}

export function defaultAcPortalUsers(): AcPortalUser[] {
  const seeds: Array<{ email: string; name: string; role: AcUserRole }> = [
    { email: 'director@agilegroup.co.in', name: 'Director', role: 'Director' },
    { email: 'selwyn.john@gmail.com', name: 'Selwyn John', role: 'Director' },
    { email: 'control@agilegroup.co.in', name: 'Control Desk', role: 'Control Operator' },
    { email: 'aap@agilegroup.co.in', name: 'Abhishek', role: 'Operations Manager' },
  ]
  return seeds.map((s) => normalizeAcPortalUser(s))
}

export async function getAcUsers(): Promise<AcPortalUser[]> {
  const list = await getJson<AcPortalUser[]>(KEYS.users, [])
  if (!list.length) {
    const seeded = defaultAcPortalUsers()
    await setJson(KEYS.users, seeded)
    return seeded
  }
  const mapped = list.map((u) => normalizeAcPortalUser(u))
  if (!mapped.some((u) => u.email === 'aap@agilegroup.co.in')) {
    mapped.push(
      normalizeAcPortalUser({
        email: 'aap@agilegroup.co.in',
        name: 'Abhishek',
        role: 'Operations Manager',
        active: true,
      }),
    )
    await setJson(KEYS.users, mapped)
  }
  return mapped
}

export async function saveAcUsers(list: AcPortalUser[]): Promise<boolean> {
  const cleaned = list.map((u) => normalizeAcPortalUser(u)).filter((u) => u.email.includes('@'))
  return setJson(KEYS.users, cleaned)
}

export async function findAcUserByEmail(email: string): Promise<AcPortalUser | null> {
  const em = String(email || '')
    .trim()
    .toLowerCase()
  if (!em) return null
  const all = await getAcUsers()
  return all.find((u) => u.email === em) || null
}
