/**
 * SSA assessor dropdowns — branch HOD + operations staff only.
 * VP / AVP / RM / CGM / OM and field operations may survey.
 * IT, Control, MD, Director, Lokesh and other HQ roles stay out.
 * A typed name is stored for that branch and shown next time.
 */
import { misBranchGroupKey } from './branch-group-key.js'
import { getBranches, getStaff, getUsers, type MisStaff, type MisUser } from './store.js'

export type SsaDirectoryPerson = {
  kind: 'hod' | 'operations'
  name: string
  email: string
  mobile: string
}

export type SsaDirectory = {
  operations: SsaDirectoryPerson[]
  hods: SsaDirectoryPerson[]
  opsTeam: string[]
}

export type SsaSavedAssessor = {
  branchId: string
  name: string
  email: string
  mobile: string
  savedAt: string
}

const SSA_ASSESSORS_KEY = 'mis:ssa-branch-assessors'

const BLOCKED_EMAILS = new Set([
  'lokesh@agilegroup.co.in',
  'director@agilegroup.co.in',
  'it@agilegroup.co.in',
  'sai@agilegroup.co.in',
  'control@agilegroup.co.in',
  'md@agilegroup.co.in',
])

const BLOCKED_DEPTS = ['it', 'control', 'accounts', 'hr', 'training', 'stores', 'payroll', 'recruitment']

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
      return fallback
    }
  }
  return fallback
}

async function setJson(key: string, value: unknown): Promise<boolean> {
  const d = await redis(['SET', key, JSON.stringify(value)])
  return d?.result === 'OK'
}

function mobileDigits(raw: string): string {
  const d = String(raw ?? '').replace(/\D/g, '')
  return d.length >= 10 ? d.slice(-10) : ''
}

function normName(raw: string): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function roleText(raw: string): string {
  return String(raw ?? '').trim().toLowerCase()
}

export function isSsaAssessorBlocked(input: {
  name?: string
  email?: string
  role?: string
  department?: string
  team?: string
}): boolean {
  const email = String(input.email || '').trim().toLowerCase()
  if (email && BLOCKED_EMAILS.has(email)) return true
  if (email.startsWith('it@') || email.startsWith('control@') || email.startsWith('director@')) return true
  const dept = String(input.department || '').trim().toLowerCase()
  if (BLOCKED_DEPTS.some((d) => dept === d || dept.includes(d))) return true
  const role = roleText(input.role)
  if (
    role === 'director' ||
    role === 'president' ||
    role === 'admin' ||
    role === 'md' ||
    role.includes('managing director') ||
    role.includes('control operator') ||
    role === 'control' ||
    role.includes('control room') ||
    role === 'it' ||
    role.includes('information technology') ||
    role === 'accounts' ||
    role === 'hr' ||
    role === 'training team' ||
    role === 'sales executive'
  ) {
    return true
  }
  const name = normName(input.name || '')
  if (!name) return false
  if (name.includes('lokesh')) return true
  if (name.includes('managing director')) return true
  if (/\bmd\b/.test(name) || name === 'md sir' || name.includes('md sir')) return true
  if (name.includes('director') && !name.includes('directory')) return true
  if (name.includes('control room') || name === 'control') return true
  if (name === 'it' || name.startsWith('it ')) return true
  if (name.includes('president') && !name.includes('vice')) return true
  return false
}

export function isSsaHodRole(role: string): boolean {
  const r = roleText(role)
  if (!r) return false
  if (r.includes('hod')) return true
  if (r === 'branch manager' || r.includes('branch manager')) return true
  return false
}

/** Operations team / staff, VP, AVP, RM, CGM, OM — the people who do SSA. */
export function isSsaAssessorRoleAllowed(role: string, team?: string): boolean {
  const r = roleText(role)
  if (r === 'cgm' || r.includes('chief general')) return true
  if (r === 'vp' || r.includes('vice president') || r.includes('(vp)')) return true
  if (r === 'avp' || r.includes('assistant vice') || r.includes('(avp)')) return true
  if (r === 'rm' || r.includes('regional manager') || r.includes('(rm)')) return true
  if (r === 'om' || r.includes('operations manager') || r.includes('(om)')) return true
  if (r === 'area manager' || r.includes('area manager')) return true
  if (r === 'field officer' || r.includes('field officer')) return true
  if (r.includes('operations') && !r.includes('control')) return true
  if (isSsaHodRole(role)) return true
  if (team === 'operations') return true
  return false
}

function userOnThisBranch(u: MisUser, branchId: string): boolean {
  return String(u.branchId || '').trim() === branchId
}

/** Director 25 Aug 2026 — one HOD row per operations branch (not a city group). */
export const SSA_FIXED_HODS: { branch: string; name: string; email: string }[] = [
  { branch: 'BANGALORE', name: 'Prathap Kumar', email: 'vp.blr@agilegroup.co.in' },
  { branch: 'KOCHI', name: 'Prathap Kumar', email: 'vp.blr@agilegroup.co.in' },
  { branch: 'BHOPAL', name: 'Ahmad Salman', email: 'ahmad.salman@agilegroup.co.in' },
  { branch: 'CHENNAI', name: 'Col. Selvam', email: 'selvam.k@agilegroup.co.in' },
  { branch: 'PUDUCHERRY', name: 'Col. Selvam', email: 'selvam.k@agilegroup.co.in' },
  { branch: 'KAKINADA', name: 'Siddharth', email: 'sid@agilegroup.co.in' },
  { branch: 'NELLORE', name: 'Siddharth', email: 'sid@agilegroup.co.in' },
  { branch: 'TADA', name: 'Siddharth', email: 'sid@agilegroup.co.in' },
  { branch: 'TADIPATRI', name: 'Siddharth', email: 'sid@agilegroup.co.in' },
  { branch: 'TIRUPATI', name: 'Siddharth', email: 'sid@agilegroup.co.in' },
  { branch: 'VIJAYAWADA', name: 'Siddharth', email: 'sid@agilegroup.co.in' },
  { branch: 'SURAT', name: 'Sanjay Singh', email: 'sanjay.singh@agilegroup.co.in' },
  { branch: 'VISAKHAPATNAM', name: 'Raghu Ram Raju', email: 'cgm.vizag@agilegroup.co.in' },
]

function toPerson(kind: 'hod' | 'operations', name: string, email: string, mobile: string): SsaDirectoryPerson {
  return {
    kind,
    name: String(name || '').trim(),
    email: String(email || '').trim().toLowerCase(),
    mobile: mobileDigits(mobile),
  }
}

export function ssaFixedHodsForGroup(groupKey: string): SsaDirectoryPerson[] {
  const key = String(groupKey || '').trim().toUpperCase()
  if (!key) return []
  return SSA_FIXED_HODS.filter((h) => h.branch === key).map((h) =>
    toPerson('hod', h.name, h.email, ''),
  )
}

export function ssaFixedHodEmailsForGroup(groupKey: string): string[] {
  return ssaFixedHodsForGroup(groupKey)
    .map((p) => p.email)
    .filter((e) => e.includes('@'))
}

function dedupePeople(list: SsaDirectoryPerson[]): SsaDirectoryPerson[] {
  const seen = new Set<string>()
  const out: SsaDirectoryPerson[] = []
  for (const p of list) {
    const key = `${p.kind}|${p.email || p.name}`.toLowerCase()
    if (!p.name && !p.email) continue
    if (seen.has(key)) continue
    seen.add(key)
    out.push(p)
  }
  return out.sort((a, b) => a.name.localeCompare(b.name) || a.email.localeCompare(b.email))
}

export async function listSsaBranchAssessors(branchId?: string): Promise<SsaSavedAssessor[]> {
  const all = await getJson<SsaSavedAssessor[]>(SSA_ASSESSORS_KEY, [])
  if (!Array.isArray(all)) return []
  if (!branchId) return all
  return all.filter((r) => r && r.branchId === branchId)
}

export async function rememberSsaBranchAssessor(input: {
  branchId?: string
  name?: string
  email?: string
  mobile?: string
}): Promise<boolean> {
  const branchId = String(input.branchId || '').trim()
  const name = String(input.name || '').trim().slice(0, 120)
  if (!branchId || !name) return false
  if (name === 'Name not available') return false
  if (
    isSsaAssessorBlocked({
      name,
      email: input.email,
    })
  ) {
    return false
  }
  const email = String(input.email || '').trim().toLowerCase().slice(0, 120)
  const mobile = mobileDigits(input.mobile || '')
  const all = await listSsaBranchAssessors()
  const nameKey = normName(name)
  const ix = all.findIndex(
    (r) =>
      r.branchId === branchId &&
      (normName(r.name) === nameKey || (email && r.email && r.email === email)),
  )
  const row: SsaSavedAssessor = {
    branchId,
    name,
    email,
    mobile,
    savedAt: new Date().toISOString(),
  }
  if (ix >= 0) all[ix] = { ...all[ix], ...row, email: email || all[ix].email, mobile: mobile || all[ix].mobile }
  else all.push(row)
  return setJson(SSA_ASSESSORS_KEY, all.slice(-400))
}

function staffLooksOps(s: MisStaff): boolean {
  if (s.active === false || !String(s.name || '').trim()) return false
  if (s.team === 'support') return false
  if (isSsaAssessorBlocked({ name: s.name, role: s.role, department: s.department, team: s.team })) {
    return false
  }
  if (s.team === 'operations') return true
  if (!s.team) return isSsaAssessorRoleAllowed(s.role, 'operations') || !s.role
  return isSsaAssessorRoleAllowed(s.role, s.team)
}

export async function buildSsaDirectory(branchId?: string): Promise<SsaDirectory> {
  const empty: SsaDirectory = { operations: [], hods: [], opsTeam: [] }
  const bid = String(branchId || '').trim()
  if (!bid || bid === 'ALL') return empty

  const [users, staff, saved, branches] = await Promise.all([
    getUsers(),
    getStaff(bid, true),
    listSsaBranchAssessors(bid),
    getBranches(true),
  ])
  const branch = branches.find((b) => b.id === bid)
  const groupKey = branch ? misBranchGroupKey(branch.name) : ''

  const operations: SsaDirectoryPerson[] = []
  const hods: SsaDirectoryPerson[] = [...ssaFixedHodsForGroup(groupKey)]

  for (const u of users) {
    if (u.active === false || !userOnThisBranch(u, bid)) continue
    if (isSsaAssessorBlocked(u)) continue
    if (!isSsaAssessorRoleAllowed(u.role, u.team)) continue
    const row = toPerson(
      isSsaHodRole(u.role) ? 'hod' : 'operations',
      u.name,
      u.email,
      u.phone,
    )
    if (!row.name) continue
    if (row.kind === 'hod') hods.push(row)
    else operations.push(row)
  }

  for (const s of staff) {
    if (!staffLooksOps(s)) continue
    operations.push(toPerson('operations', s.name, '', s.phone))
  }

  for (const a of saved) {
    if (isSsaAssessorBlocked(a)) continue
    operations.push(toPerson('operations', a.name, a.email, a.mobile))
  }

  const ops = dedupePeople(operations)
  const hodList = dedupePeople(hods)
  return {
    operations: ops,
    hods: hodList,
    opsTeam: ops.map((p) => p.name).filter((n, i, arr) => arr.indexOf(n) === i),
  }
}
