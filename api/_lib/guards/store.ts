/**
 * Agile Guards (App 07) — guard welfare complaints, branch-scoped for HODs.
 */

import { redisCommand } from '../pulse/store.js'

export const GUARD_CATEGORIES: Record<string, string[]> = {
  EPF: [
    'Deducted More',
    'Deducted Less',
    'Not Deducted',
    'SMS Not Received',
    'Account Linking',
    'Want to Withdraw',
    'Other',
  ],
  ESIC: ['Deducted More', 'Deducted Less', 'Not Deducted', 'Want Treatment / ESI Hospital', 'Other'],
  'ID Card': ['Renewal', 'Lost', 'Damaged', 'Want ID Holder & Tag'],
  Uniform: ['Want Uniform', 'Want Shoe', 'Want Cap', 'Other'],
  Wage: [
    'Not Received',
    'Less Paid',
    'Excess Paid',
    'Excess Deduction',
    'Wrongly Paid',
    'Wage slip Not received',
    'Other',
  ],
  'Other Support': ['Promotion', 'Transfer', 'Counselling', 'Other'],
}

export const CATEGORY_DEPARTMENT: Record<string, string> = {
  EPF: 'HR & Finance',
  ESIC: 'HR',
  'ID Card': 'HR',
  Uniform: 'Operations',
  Wage: 'HR & Finance',
  'Other Support': 'Operations',
}

export type GuardComplaintStatus =
  | 'received'
  | 'assigned'
  | 'pending_hod'
  | 'solved'
  | 'reopened'
  | 'dept_pending'

export type GuardReferral = { name: string; phone: string; city: string }

export type GuardCommunication = {
  id: string
  complaintId: string
  code: string
  channel: 'email' | 'whatsapp'
  type: 'completion' | 'request_details' | 'delayed_escalation' | 'share_link' | 'reminder' | 'feedback_request' | 'status_client' | 'status_department' | 'status_hod' | 'feedback_received'
  subject: string
  body: string
  sentTo: string
  sentAt: string
  sentBy: string
}

export type GuardDeptStaff = {
  id: string
  branchId: string
  department: string
  name: string
  email: string
  mobile: string
  active: boolean
  createdAt: string
}

export type GuardComplaint = {
  id: string
  code: string
  branchId: string
  guardName: string
  idNo: string
  mobile: string
  clientName: string
  location: string
  category: string
  subCategory: string
  complaintNote: string
  referralJoined: boolean
  referrals: GuardReferral[]
  opsStaffId: string
  opsStaffName: string
  opsStaffEmail: string
  deptStaffId: string
  deptStaffName: string
  deptStaffEmail: string
  department: string
  assignedBy: string
  registeredAt: string
  slaDeadline: string
  isDelayed: boolean
  delayedAt: string
  delayedNotifiedAt: string
  status: GuardComplaintStatus
  opsResolution: string
  deptResolution: string
  assuranceNote: string
  hodNotes: string
  hodReplyToGuard: string
  solvedAt: string
  assignedAt: string
  opsCompletedAt: string
  deptCompletedAt: string
  active: boolean
}

export type GuardComplaintEvent = {
  id: string
  complaintId: string
  level: string
  action: string
  detail: string
  actor: string
  createdAt: string
}

export type GuardOpsStaff = {
  id: string
  branchId: string
  name: string
  mobile: string
  email: string
  whatsApp: string
  active: boolean
  createdAt: string
}

export type GuardPortalUser = {
  email: string
  name: string
  role: 'hod' | 'ops' | 'management'
  branchId: string
  active: boolean
}

const COMPLAINTS_KEY = 'guards:complaints'
const OPS_KEY = 'guards:ops'
const DEPT_KEY = 'guards:dept'
const COMMS_KEY = 'guards:comms'
const USERS_KEY = 'guards:users'
const EVENTS_KEY = 'guards:events'
const FEEDBACK_KEY = 'guards:feedback'
const SEQ_KEY = 'guards:seq'

export type GuardFeedback = {
  id: string
  complaintId: string
  code: string
  branchId: string
  guardName: string
  idNo: string
  category: string
  mobile: string
  rating: number
  comment: string
  submittedAt: string
}

export function guardsNid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function guardsStorageOk(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim())
}

async function getJson<T>(key: string, fallback: T): Promise<T> {
  if (!guardsStorageOk()) return fallback
  try {
    const res = await redisCommand(['GET', key])
    const raw = res?.result
    if (!raw || typeof raw !== 'string') return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

async function setJson(key: string, value: unknown): Promise<boolean> {
  if (!guardsStorageOk()) return false
  try {
    const res = await redisCommand(['SET', key, JSON.stringify(value)])
    return res?.result === 'OK'
  } catch {
    return false
  }
}

export function slaDeadlineFrom(iso: string): string {
  return new Date(new Date(iso).getTime() + 24 * 60 * 60 * 1000).toISOString()
}

export function normalizeComplaint(c: Partial<GuardComplaint> & { id?: string }): GuardComplaint {
  const registeredAt = String(c.registeredAt || new Date().toISOString())
  const status = (
    ['received', 'assigned', 'pending_hod', 'solved', 'reopened', 'dept_pending'].includes(String(c.status))
      ? c.status
      : 'received'
  ) as GuardComplaintStatus
  const slaDeadline = String(c.slaDeadline || slaDeadlineFrom(registeredAt))
  const now = Date.now()
  const overdue = now > new Date(slaDeadline).getTime() && status !== 'solved'
  return {
    id: String(c.id || guardsNid('gc')),
    code: String(c.code || ''),
    branchId: String(c.branchId || ''),
    guardName: String(c.guardName || ''),
    idNo: String(c.idNo || ''),
    mobile: String(c.mobile || ''),
    clientName: String(c.clientName || ''),
    location: String(c.location || ''),
    category: String(c.category || ''),
    subCategory: String(c.subCategory || ''),
    complaintNote: String(c.complaintNote || ''),
    referralJoined: Boolean(c.referralJoined),
    referrals: Array.isArray(c.referrals) ? c.referrals : [],
    opsStaffId: String(c.opsStaffId || ''),
    opsStaffName: String(c.opsStaffName || ''),
    opsStaffEmail: String(c.opsStaffEmail || ''),
    deptStaffId: String(c.deptStaffId || ''),
    deptStaffName: String(c.deptStaffName || ''),
    deptStaffEmail: String(c.deptStaffEmail || ''),
    department: String(c.department || CATEGORY_DEPARTMENT[String(c.category)] || 'Operations'),
    assignedBy: String(c.assignedBy || ''),
    registeredAt,
    slaDeadline,
    isDelayed: Boolean(c.isDelayed) || overdue,
    delayedAt: String(c.delayedAt || (overdue ? new Date().toISOString() : '')),
    delayedNotifiedAt: String(c.delayedNotifiedAt || ''),
    status,
    opsResolution: String(c.opsResolution || ''),
    deptResolution: String(c.deptResolution || ''),
    assuranceNote: String(c.assuranceNote || ''),
    hodNotes: String(c.hodNotes || ''),
    hodReplyToGuard: String(c.hodReplyToGuard || ''),
    solvedAt: String(c.solvedAt || ''),
    assignedAt: String(c.assignedAt || ''),
    opsCompletedAt: String(c.opsCompletedAt || ''),
    deptCompletedAt: String(c.deptCompletedAt || ''),
    active: c.active !== false,
  }
}

export function normalizeOps(o: Partial<GuardOpsStaff> & { id?: string }): GuardOpsStaff {
  return {
    id: String(o.id || guardsNid('ops')),
    branchId: String(o.branchId || ''),
    name: String(o.name || ''),
    mobile: String(o.mobile || ''),
    email: String(o.email || ''),
    whatsApp: String(o.whatsApp || o.mobile || ''),
    active: o.active !== false,
    createdAt: String(o.createdAt || new Date().toISOString()),
  }
}

export function normalizePortalUser(u: Partial<GuardPortalUser>): GuardPortalUser {
  const role = u.role === 'management' ? 'management' : u.role === 'ops' ? 'ops' : 'hod'
  return {
    email: String(u.email || '').trim().toLowerCase(),
    name: String(u.name || ''),
    role,
    branchId: String(u.branchId || ''),
    active: u.active !== false,
  }
}

export async function getComplaints(): Promise<GuardComplaint[]> {
  const list = await getJson<GuardComplaint[]>(COMPLAINTS_KEY, [])
  return list.map((c) => applySla(normalizeComplaint(c)))
}

export async function saveComplaints(list: GuardComplaint[]): Promise<boolean> {
  return setJson(COMPLAINTS_KEY, list.map((c) => normalizeComplaint(c)))
}

export function applySla(c: GuardComplaint): GuardComplaint {
  const n = normalizeComplaint(c)
  if (n.status === 'solved') return n
  const overdue = Date.now() > new Date(n.slaDeadline).getTime()
  if (overdue && !n.isDelayed) {
    n.isDelayed = true
    n.delayedAt = n.delayedAt || new Date().toISOString()
  }
  return n
}

export async function getOpsStaff(): Promise<GuardOpsStaff[]> {
  const list = await getJson<GuardOpsStaff[]>(OPS_KEY, [])
  return list.map((o) => normalizeOps(o))
}

export async function saveOpsStaff(list: GuardOpsStaff[]): Promise<boolean> {
  return setJson(OPS_KEY, list.map((o) => normalizeOps(o)))
}

export async function getPortalUsers(): Promise<GuardPortalUser[]> {
  const list = await getJson<GuardPortalUser[]>(USERS_KEY, [])
  return list.map((u) => normalizePortalUser(u))
}

export async function savePortalUsers(list: GuardPortalUser[]): Promise<boolean> {
  return setJson(USERS_KEY, list.map((u) => normalizePortalUser(u)))
}

export async function getEvents(): Promise<GuardComplaintEvent[]> {
  return getJson<GuardComplaintEvent[]>(EVENTS_KEY, [])
}

export async function saveEvents(list: GuardComplaintEvent[]): Promise<boolean> {
  return setJson(EVENTS_KEY, list)
}

export async function logEvent(
  complaintId: string,
  level: string,
  action: string,
  detail: string,
  actor: string,
): Promise<void> {
  const events = await getEvents()
  events.push({
    id: guardsNid('ev'),
    complaintId,
    level,
    action,
    detail,
    actor,
    createdAt: new Date().toISOString(),
  })
  await saveEvents(events.slice(-5000))
}

export async function nextComplaintCode(): Promise<string> {
  if (!guardsStorageOk()) return `GC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`
  try {
    const res = await redisCommand(['INCR', SEQ_KEY])
    const n = Number(res?.result ?? 0)
    const year = new Date().getFullYear()
    return `GC-${year}-${String(n || 1).padStart(4, '0')}`
  } catch {
    return `GC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`
  }
}

export function departmentForCategory(category: string): string {
  return CATEGORY_DEPARTMENT[category] || 'Operations'
}

export function normalizeDeptStaff(d: Partial<GuardDeptStaff> & { id?: string }): GuardDeptStaff {
  return {
    id: String(d.id || guardsNid('ds')),
    branchId: String(d.branchId || ''),
    department: String(d.department || 'Operations'),
    name: String(d.name || ''),
    email: String(d.email || ''),
    mobile: String(d.mobile || ''),
    active: d.active !== false,
    createdAt: String(d.createdAt || new Date().toISOString()),
  }
}

export async function getDeptStaff(): Promise<GuardDeptStaff[]> {
  const list = await getJson<GuardDeptStaff[]>(DEPT_KEY, [])
  return list.map((d) => normalizeDeptStaff(d))
}

export async function saveDeptStaff(list: GuardDeptStaff[]): Promise<boolean> {
  return setJson(DEPT_KEY, list.map((d) => normalizeDeptStaff(d)))
}

export async function getCommunications(): Promise<GuardCommunication[]> {
  return getJson<GuardCommunication[]>(COMMS_KEY, [])
}

export async function saveCommunications(list: GuardCommunication[]): Promise<boolean> {
  return setJson(COMMS_KEY, list.slice(-3000))
}

export async function logCommunication(row: Omit<GuardCommunication, 'id' | 'sentAt'> & { sentAt?: string }) {
  const list = await getCommunications()
  list.push({
    id: guardsNid('cm'),
    sentAt: row.sentAt || new Date().toISOString(),
    ...row,
  })
  await saveCommunications(list)
}

export function sortComplaintsNewestFirst(list: GuardComplaint[]): GuardComplaint[] {
  return list.slice().sort((a, b) => String(b.registeredAt).localeCompare(String(a.registeredAt)))
}

export function searchComplaints(list: GuardComplaint[], q: string): GuardComplaint[] {
  const s = String(q ?? '').replace(/\D/g, '')
  if (!s) return list
  return list.filter((c) => c.idNo.replace(/\D/g, '').includes(s) || c.mobile.replace(/\D/g, '').includes(s))
}

/** Legacy MIS branch labels → display names used in Guards. */
export function canonicalBranchName(name: string): string {
  const legacy: Record<string, string> = {
    'Hyd Zone A': 'Hyderabad-A',
    'Hyd Zone B': 'Hyderabad-B',
  }
  return legacy[name] || name
}

const BRANCH_ALIAS_NAMES: Record<string, string> = {
  'hyderabad-a': 'Hyderabad-A',
  'hyderabad-b': 'Hyderabad-B',
  'hyd-zone-a': 'Hyderabad-A',
  'hyd-zone-b': 'Hyderabad-B',
  'hyd-a': 'Hyderabad-A',
  'hyd-b': 'Hyderabad-B',
  'hyderabadzonea': 'Hyderabad-A',
  'hyderabadzoneb': 'Hyderabad-B',
  'b-hyderabadzonea': 'Hyderabad-A',
  'b-hyderabadzoneb': 'Hyderabad-B',
  'b-hyderabad-a': 'Hyderabad-A',
  'b-hyderabad-b': 'Hyderabad-B',
  'b-tirupathi': 'Tirupati',
  'b-tirupati': 'Tirupati',
  'b-karnataka': 'Bangalore',
  'b-kerala': 'Kochi',
  'b-gujarat': 'Mumbai & Surat',
  'b-madhya': 'Bhopal',
  'b-maharashtra': 'Mumbai & Surat',
  'b-nellore': 'Nellore & Tada',
  'b-puducherry': 'Chennai & Pondicherry',
  'b-tamilnadu': 'Chennai & Pondicherry',
  'b-vijayawada': 'Vijayawada',
  'b-visakhapatnam': 'Visakhapatnam & Kakinada',
  'b-vizag': 'Visakhapatnam & Kakinada',
  'b-kakinada': 'Visakhapatnam & Kakinada',
  'b-hitech': 'Hi-Tech City',
}

function branchAliasKey(input: string): string {
  return String(input ?? '').trim().toLowerCase().replace(/[_\s]+/g, '-')
}

/** Normalise branch labels so HYDERABAD-B-TG matches Hyderabad-B / Hyd Zone B. */
export function branchLookupKey(label: string): string {
  const raw = canonicalBranchName(String(label ?? '').trim())
  const n = raw
    .toUpperCase()
    .replace(/-(AP|TG|MH|GJ|UP|PY|TN|KA|KL|MP)$/i, '')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (/^HYD\s*ZONE\s*A$/i.test(n) || /^HYDERABAD[\s_-]*A$/i.test(n)) return 'HYDERABAD-A'
  if (/^HYD\s*ZONE\s*B$/i.test(n) || /^HYDERABAD[\s_-]*B$/i.test(n)) return 'HYDERABAD-B'
  if (/HI[\s-]*TECH/i.test(n)) return 'HI-TECH-CITY'
  if (/^GUJARAT$/i.test(n) || /^SURAT$/i.test(n) || /^MUMBAI[\s&]*SURAT$/i.test(n) || /^MAHARASHTRA$/i.test(n)) {
    return 'MUMBAI-SURAT'
  }
  return n
}

function findBranchByLookup(
  target: string,
  branches: { id: string; name: string }[],
): { id: string; name: string } | null {
  const key = branchLookupKey(target)
  if (!key) return null
  const hit =
    branches.find((b) => branchLookupKey(b.name) === key) ??
    branches.find((b) => branchLookupKey(b.id) === key)
  return hit ? { id: hit.id, name: canonicalBranchName(hit.name) } : null
}

export function guardsFmtIstDateTime(iso: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    })
  } catch {
    return iso.slice(0, 16).replace('T', ' ')
  }
}

export function branchDisplayName(
  branchId: string,
  branches: { id: string; name: string }[],
): string {
  const resolved = resolveBranchId(branchId, branches)
  if (resolved) return resolved.name
  const alias = BRANCH_ALIAS_NAMES[branchAliasKey(branchId)]
  if (alias) return alias
  const zone = String(branchId).match(/hyderabad[\s_-]*([ab])\b/i)
  if (zone) return zone[1].toUpperCase() === 'A' ? 'Hyderabad-A' : 'Hyderabad-B'
  return canonicalBranchName(branchId) || branchId || '—'
}

/** Resolve branch name or id to canonical MIS branch id. */
export function resolveBranchId(
  input: string,
  branches: { id: string; name: string }[],
): { id: string; name: string } | null {
  const q = String(input ?? '').trim()
  if (!q) return null

  if (/^b[_-]/i.test(q)) {
    const stripped = q.replace(/^b[_-]/i, '')
    const fromPrefix = resolveBranchId(stripped, branches)
    if (fromPrefix) return fromPrefix
  }

  const exact = branches.find((b) => b.id === q || b.name === q)
  if (exact) return { id: exact.id, name: canonicalBranchName(exact.name) }

  const aliasName = BRANCH_ALIAS_NAMES[branchAliasKey(q)]
  if (aliasName) {
    const hit = findBranchByLookup(aliasName, branches)
    if (hit) return hit
  }

  const zoneMatch = q.match(/hyderabad[\s_-]*([ab])\b/i)
  if (zoneMatch) {
    const target = zoneMatch[1].toUpperCase() === 'A' ? 'Hyderabad-A' : 'Hyderabad-B'
    const hit = findBranchByLookup(target, branches)
    if (hit) return hit
  }

  const lookupHit = findBranchByLookup(q, branches)
  if (lookupHit) return lookupHit

  const lower = q.toLowerCase()
  const exactLower = branches.find(
    (b) => b.name.toLowerCase() === lower || b.id.toLowerCase() === lower,
  )
  if (exactLower) return { id: exactLower.id, name: canonicalBranchName(exactLower.name) }

  // Do not map HYDERABAD-B to a plain "Hyderabad" branch — zone must match.
  if (!/[ab]\b/i.test(q) && !/zone\s*[ab]/i.test(q)) {
    const fuzzy =
      branches.find((b) => b.name.toLowerCase() === lower) ??
      branches.find(
        (b) =>
          b.name.toLowerCase().includes(lower) ||
          lower.includes(b.name.toLowerCase()),
      )
    if (fuzzy) return { id: fuzzy.id, name: canonicalBranchName(fuzzy.name) }
  }

  return null
}

/** Store staff/complaints under one canonical branch id (br1, br2, …). */
export function canonicalBranchStorageId(
  input: string,
  branches: { id: string; name: string }[],
): string {
  const resolved = resolveBranchId(input, branches)
  return resolved?.id || String(input ?? '').trim()
}

export function guardsBranchList(branches: { id: string; name: string }[]) {
  return dedupeGuardsBranches(
    branches.map((b) => ({ id: b.id, name: canonicalBranchName(b.name) })),
  )
}

/** One entry per branch name — fixes Hyderabad-A / Hyd Zone A appearing 3× in dropdowns. */
export function dedupeGuardsBranches(
  branches: { id: string; name: string }[],
): { id: string; name: string }[] {
  const pick = new Map<string, { id: string; name: string }>()
  for (const b of branches) {
    const resolved = resolveBranchId(b.id, branches) || resolveBranchId(b.name, branches)
    const name = canonicalBranchName(resolved?.name || b.name)
    const id = resolved?.id || b.id
    const key = branchAliasKey(name)
    const existing = pick.get(key)
    if (!existing) {
      pick.set(key, { id, name })
      continue
    }
    // Prefer exact Hyderabad-A style name over legacy "Hyd Zone A"
    if (name.match(/^Hyderabad-[AB]$/i) && !existing.name.match(/^Hyderabad-[AB]$/i)) {
      pick.set(key, { id, name })
    }
  }
  return Array.from(pick.values()).sort((a, b) => a.name.localeCompare(b.name))
}

/** Normalize complaint branch ids (HYDERABAD-A, Hyd Zone A, br2 → one canonical id). */
export async function healComplaintBranches(
  branches: { id: string; name: string }[],
  complaints: GuardComplaint[],
): Promise<{ complaints: GuardComplaint[]; fixed: number }> {
  let fixed = 0
  const next = complaints.map((c) => {
    const id = canonicalBranchStorageId(c.branchId, branches)
    if (!id || id === c.branchId) return c
    fixed++
    return normalizeComplaint({ ...c, branchId: id })
  })
  if (fixed) await saveComplaints(next)
  return { complaints: next, fixed }
}

/** Fix ops/dept saved with branch names instead of ids (e.g. HYDERABAD-B vs br3). */
export async function healGuardsStaffBranches(branches: { id: string; name: string }[]) {
  const ops = await getOpsStaff()
  const dept = await getDeptStaff()
  let changed = false
  const nextOps = ops.map((o) => {
    const id = canonicalBranchStorageId(o.branchId, branches)
    if (id && id !== o.branchId) changed = true
    return normalizeOps({ ...o, branchId: id || o.branchId })
  })
  const nextDept = dept.map((d) => {
    const id = canonicalBranchStorageId(d.branchId, branches)
    if (id && id !== d.branchId) changed = true
    return normalizeDeptStaff({ ...d, branchId: id || d.branchId })
  })
  if (changed) {
    await saveOpsStaff(nextOps)
    await saveDeptStaff(nextDept)
  }
  return { ops: nextOps, dept: nextDept }
}

/** Clear ops/dept assignment when staff belong to a different branch than the complaint. */
export async function healComplaintAssignments(
  branches: { id: string; name: string }[],
  complaints: GuardComplaint[],
  opsStaff: GuardOpsStaff[],
  deptStaff: GuardDeptStaff[],
): Promise<{ complaints: GuardComplaint[]; fixed: number }> {
  let fixed = 0
  const next = complaints.map((c) => {
    const ops = opsStaff.find((o) => o.id === c.opsStaffId)
    const dept = deptStaff.find((d) => d.id === c.deptStaffId)
    let changed = false
    const patch: Partial<GuardComplaint> = {}
    if (ops && !complaintMatchesBranch(ops.branchId, c.branchId, branches)) {
      patch.opsStaffId = ''
      patch.opsStaffName = ''
      patch.opsStaffEmail = ''
      changed = true
    }
    if (dept && !complaintMatchesBranch(dept.branchId, c.branchId, branches)) {
      patch.deptStaffId = ''
      patch.deptStaffName = ''
      patch.deptStaffEmail = ''
      changed = true
    }
    if (!changed) return c
    fixed++
    const merged = normalizeComplaint({ ...c, ...patch })
    const hasAssignee = Boolean(merged.opsStaffId || merged.deptStaffId || merged.deptStaffEmail)
    if (merged.status === 'assigned' && !hasAssignee) merged.status = 'received'
    return merged
  })
  if (fixed) await saveComplaints(next)
  return { complaints: next, fixed }
}

export function complaintMatchesBranch(
  complaintBranchId: string,
  scopeBranch: string | null,
  branches: { id: string; name: string }[],
): boolean {
  if (!scopeBranch) return true
  const scope = resolveBranchId(scopeBranch, branches)
  const row = resolveBranchId(complaintBranchId, branches)
  if (scope && row) return scope.id === row.id
  if (scope) {
    return (
      complaintBranchId === scope.id ||
      complaintBranchId.toLowerCase() === scope.name.toLowerCase()
    )
  }
  return complaintBranchId === scopeBranch
}

export function filterByBranch<T extends { branchId: string }>(
  list: T[],
  branchId: string | null,
  branches: { id: string; name: string }[] = [],
): T[] {
  if (!branchId) return list
  return list.filter((x) => complaintMatchesBranch(x.branchId, branchId, branches))
}

export async function getFeedback(): Promise<GuardFeedback[]> {
  return getJson<GuardFeedback[]>(FEEDBACK_KEY, [])
}

export async function saveFeedback(list: GuardFeedback[]): Promise<boolean> {
  return setJson(FEEDBACK_KEY, list.slice(-5000))
}

export function feedbackSummary(list: GuardFeedback[]) {
  const rated = list.filter((f) => f.rating >= 1 && f.rating <= 5)
  const avg = rated.length
    ? Math.round((rated.reduce((s, f) => s + f.rating, 0) / rated.length) * 10) / 10
    : 0
  const byRating: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const f of rated) byRating[f.rating] = (byRating[f.rating] || 0) + 1
  const byBranch: Record<string, { count: number; sum: number }> = {}
  for (const f of rated) {
    const k = f.branchId || 'unknown'
    if (!byBranch[k]) byBranch[k] = { count: 0, sum: 0 }
    byBranch[k].count++
    byBranch[k].sum += f.rating
  }
  return {
    total: rated.length,
    avgRating: avg,
    byRating,
    byBranch: Object.entries(byBranch)
      .map(([branchId, v]) => ({
        branchId,
        branchName: branchId,
        count: v.count,
        avgRating: Math.round((v.sum / v.count) * 10) / 10,
      }))
      .sort((a, b) => b.count - a.count),
  }
}
