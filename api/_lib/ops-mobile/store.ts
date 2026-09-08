/**
 * Agile Ops Mobile — Phase A/B
 * Guard master + duty sessions (Hyderabad first, then all branches).
 * Primary source: MIS Master Directory (Guard Docs) — sync into ops-mobile Redis.
 */
import { getBranches, getGuardDocs, type MisGuardDoc } from '../mis/store.js'
import { redisCommand } from '../pulse/store.js'

const GUARDS_KEY = 'ops-mobile:guards:v1'
const DUTY_KEY = 'ops-mobile:duty:v1'

export type OpsGuard = {
  id: string
  branch: string
  clientSite: string
  idNo: string
  name: string
  mobile: string
  aadhaar: string
  doj: string
  idCardRenewal: string
  designation: string
  shift: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export type OpsDutySession = {
  id: string
  guardId: string
  idNo: string
  name: string
  mobile: string
  branch: string
  clientSite: string
  shiftHours: 8 | 12
  startedAt: string
  endedAt: string
  startLat: number | null
  startLng: number | null
  endLat: number | null
  endLng: number | null
  status: 'on_duty' | 'ended'
  /** Agile Live company check-in photo time (Work360 stays official attendance). */
  startPhotoAt?: string
  endPhotoAt?: string
  /** Staff / OM marked present on the portal (signal / mobile failed). */
  portalBy?: string
  /** End Duty: reliever took over. */
  relieverOk?: boolean
  /** Start: Patrolling completed / Taken over. End: Reliever Reported / Handed over. */
  startAction?: string
  endAction?: string
  /** Duty-continuation mail already sent (30 minutes after scheduled end). */
  continueMailedAt?: string
}

export function opsNid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function digits(raw: string): string {
  return String(raw ?? '').replace(/\D/g, '')
}

export function normaliseMobile(raw: string): string {
  let d = digits(raw)
  if (d.startsWith('91') && d.length === 12) d = d.slice(2)
  if (d.length > 10) d = d.slice(-10)
  return d
}

export function maskAadhaar(raw: string): string {
  const d = digits(raw)
  if (d.length < 4) return ''
  return `XXXX XXXX ${d.slice(-4)}`
}

async function getJson<T>(key: string, fallback: T): Promise<T> {
  const d = await redisCommand(['GET', key])
  if (!d?.result || typeof d.result !== 'string') return fallback
  try {
    return JSON.parse(d.result) as T
  } catch {
    return fallback
  }
}

async function setJson(key: string, value: unknown): Promise<boolean> {
  const r = await redisCommand(['SET', key, JSON.stringify(value)])
  return r?.result === 'OK' || r?.result === true
}

export async function getOpsGuards(): Promise<OpsGuard[]> {
  const list = await getJson<OpsGuard[]>(GUARDS_KEY, [])
  return Array.isArray(list) ? list : []
}

export async function saveOpsGuards(list: OpsGuard[]): Promise<boolean> {
  return setJson(GUARDS_KEY, list)
}

export async function getDutySessions(): Promise<OpsDutySession[]> {
  const list = await getJson<OpsDutySession[]>(DUTY_KEY, [])
  return Array.isArray(list) ? list : []
}

export async function saveDutySessions(list: OpsDutySession[]): Promise<boolean> {
  return setJson(DUTY_KEY, list)
}

export function findGuard(list: OpsGuard[], idNo: string, mobile: string): OpsGuard | null {
  const id = String(idNo ?? '').trim().toLowerCase()
  const mob = normaliseMobile(mobile)
  if (!id || mob.length !== 10) return null
  return (
    list.find(
      (g) =>
        g.active !== false &&
        String(g.idNo).trim().toLowerCase() === id &&
        normaliseMobile(g.mobile) === mob,
    ) ?? null
  )
}

export function findGuardByMobile(list: OpsGuard[], mobile: string): OpsGuard | null {
  const mob = normaliseMobile(mobile)
  if (mob.length !== 10) return null
  return list.find((g) => g.active !== false && normaliseMobile(g.mobile) === mob) ?? null
}

export function openDutyForGuard(sessions: OpsDutySession[], guardId: string): OpsDutySession | null {
  return sessions.find((s) => s.guardId === guardId && s.status === 'on_duty') ?? null
}

/** Parse CSV / TSV paste. Header row required. */
export function parseGuardCsv(text: string): { rows: Partial<OpsGuard>[]; error?: string } {
  const raw = String(text ?? '').replace(/^\uFEFF/, '').trim()
  if (!raw) return { rows: [], error: 'Empty file' }
  const lines = raw.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return { rows: [], error: 'Need header row + at least one guard' }

  const delim = lines[0]!.includes('\t') ? '\t' : ','
  const split = (line: string) => {
    // simple CSV (quoted fields supported lightly)
    const out: string[] = []
    let cur = ''
    let q = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]!
      if (ch === '"') {
        q = !q
        continue
      }
      if (!q && ch === delim) {
        out.push(cur.trim())
        cur = ''
        continue
      }
      cur += ch
    }
    out.push(cur.trim())
    return out
  }

  const headers = split(lines[0]!).map((h) => h.toLowerCase().replace(/\s+/g, ' ').trim())
  const idx = (names: string[]) => {
    for (const n of names) {
      const i = headers.findIndex((h) => h === n || h.includes(n))
      if (i >= 0) return i
    }
    return -1
  }

  const iBranch = idx(['branch'])
  const iClient = idx(['client', 'site', 'client / site', 'client/site'])
  const iId = idx(['guard id', 'id no', 'id no.', 'employee id', 'emp id', 'id number'])
  const iName = idx(['guard name', 'name'])
  const iMobile = idx(['mobile', 'phone', 'mobile number'])
  const iAadhaar = idx(['aadhaar', 'aadhar'])
  const iDoj = idx(['date of joining', 'doj', 'joining'])
  const iRenew = idx(['id card renewal', 'id renewal', 'renewal'])
  const iDesig = idx(['designation', 'rank'])
  const iShift = idx(['shift'])

  if (iId < 0 || iName < 0 || iMobile < 0) {
    return {
      rows: [],
      error: 'Header must include: Guard ID No., Name, Mobile (plus Branch, Client recommended)',
    }
  }

  const rows: Partial<OpsGuard>[] = []
  for (const line of lines.slice(1)) {
    const cols = split(line)
    if (!cols.some((c) => c)) continue
    const idNo = String(cols[iId] ?? '').trim()
    const name = String(cols[iName] ?? '').trim()
    const mobile = normaliseMobile(String(cols[iMobile] ?? ''))
    if (!idNo || !name || mobile.length !== 10) continue
    rows.push({
      branch: iBranch >= 0 ? String(cols[iBranch] ?? '').trim() || 'Hyderabad-A' : 'Hyderabad-A',
      clientSite: iClient >= 0 ? String(cols[iClient] ?? '').trim() : '',
      idNo,
      name,
      mobile,
      aadhaar: iAadhaar >= 0 ? digits(String(cols[iAadhaar] ?? '')) : '',
      doj: iDoj >= 0 ? String(cols[iDoj] ?? '').trim() : '',
      idCardRenewal: iRenew >= 0 ? String(cols[iRenew] ?? '').trim() : '',
      designation: iDesig >= 0 ? String(cols[iDesig] ?? '').trim() || 'Security Guard' : 'Security Guard',
      shift: iShift >= 0 ? String(cols[iShift] ?? '').trim() : '',
      active: true,
    })
  }
  if (!rows.length) return { rows: [], error: 'No valid guard rows found' }
  return { rows }
}

export const GUARD_CSV_TEMPLATE = [
  'Branch,Client / Site,Guard ID No.,Guard Name,Mobile,Aadhaar No.,Date of Joining,ID Card Renewal Date,Designation,Shift',
  'Hyderabad-A,Sample Client Site,AG10001,Ramesh Kumar,9876543210,123456789012,15/03/2024,15/03/2027,Security Guard,12',
].join('\n')

/** Hyderabad Phase A/B + Hi-Tech (same city ops). Match by MIS branch name. */
const HYD_OPS_BRANCH_RE =
  /hyderabad[\s\-–]*a\b|hyd[\s\-]*zone[\s\-]*a|hyderabad[\s\-–]*b\b|hyd[\s\-]*zone[\s\-]*b|hi-?tech/i

function mapMisDocToOps(doc: MisGuardDoc, branchName: string, now: string, prev?: OpsGuard): OpsGuard | null {
  const idNo = String(doc.employeeId ?? '').trim()
  const name = String(doc.guardName ?? '').trim()
  const mobile = normaliseMobile(String(doc.mobile ?? ''))
  if (!idNo || !name || mobile.length !== 10) return null
  if (doc.active === false) return null
  return {
    id: prev?.id || opsNid('og'),
    branch: branchName,
    clientSite: String(doc.unitName ?? '').trim(),
    idNo,
    name,
    mobile,
    aadhaar: digits(String(doc.aadhar ?? '')),
    doj: String(doc.doj ?? '').trim(),
    idCardRenewal: String(doc.idCardValidity ?? '').trim(),
    designation: prev?.designation || 'Security Guard',
    shift: prev?.shift || '',
    active: true,
    createdAt: prev?.createdAt || now,
    updatedAt: now,
  }
}

/**
 * Pull Guard Docs from MIS Master Directory into ops-mobile Redis.
 * Default: Hyderabad-A, Hyderabad-B, Hi-Tech City.
 */
export async function syncOpsGuardsFromMis(opts?: {
  /** If empty, sync Hyderabad ops branches only. Pass ['*'] for all branches. */
  branchFilter?: string
}): Promise<{
  ok: boolean
  error?: string
  added: number
  updated: number
  total: number
  fromBranches: { name: string; count: number }[]
}> {
  const branches = await getBranches(true)
  const filter = String(opts?.branchFilter ?? '').trim().toLowerCase()
  const targets =
    filter === '*'
      ? branches
      : filter
        ? branches.filter((b) => b.name.toLowerCase().includes(filter) || b.id.toLowerCase() === filter)
        : branches.filter((b) => HYD_OPS_BRANCH_RE.test(b.name))

  if (!targets.length) {
    return { ok: false, error: 'No matching MIS branches found.', added: 0, updated: 0, total: 0, fromBranches: [] }
  }

  const now = new Date().toISOString()
  const existing = await getOpsGuards()
  const byKey = new Map(existing.map((g) => [`${g.idNo.toLowerCase()}|${normaliseMobile(g.mobile)}`, g]))
  let added = 0
  let updated = 0
  const fromBranches: { name: string; count: number }[] = []

  for (const br of targets) {
    const docs = await getGuardDocs(br.id)
    let n = 0
    for (const doc of docs) {
      const prevKey = `${String(doc.employeeId ?? '')
        .trim()
        .toLowerCase()}|${normaliseMobile(doc.mobile)}`
      const mapped = mapMisDocToOps(doc, br.name, now, byKey.get(prevKey))
      if (!mapped) continue
      const key = `${mapped.idNo.toLowerCase()}|${mapped.mobile}`
      if (byKey.has(key)) updated++
      else added++
      byKey.set(key, mapped)
      n++
    }
    fromBranches.push({ name: br.name, count: n })
  }

  const list = [...byKey.values()]
  const saved = await saveOpsGuards(list)
  if (!saved) {
    return { ok: false, error: 'Could not save synced guards.', added: 0, updated: 0, total: 0, fromBranches }
  }
  return { ok: true, added, updated, total: list.length, fromBranches }
}

/** Live lookup in MIS Guard Docs (Hyderabad ops) when ops Redis miss. */
export async function findGuardInMis(idNo: string, mobile: string): Promise<OpsGuard | null> {
  const id = String(idNo ?? '').trim().toLowerCase()
  const mob = normaliseMobile(mobile)
  if (!id || mob.length !== 10) return null
  const branches = await getBranches(true)
  const targets = branches.filter((b) => b.active !== false)
  const now = new Date().toISOString()
  const packs = await Promise.all(targets.map(async (br) => ({ br, docs: await getGuardDocs(br.id) })))
  for (const { br, docs } of packs) {
    const hit = docs.find(
      (d) =>
        d.active !== false &&
        String(d.employeeId ?? '')
          .trim()
          .toLowerCase() === id &&
        normaliseMobile(d.mobile) === mob,
    )
    if (hit) return mapMisDocToOps(hit, br.name, now)
  }
  return null
}

export async function findGuardByMobileInMis(mobile: string): Promise<OpsGuard | null> {
  const mob = normaliseMobile(mobile)
  if (mob.length !== 10) return null
  const branches = await getBranches(true)
  const targets = branches.filter((b) => b.active !== false)
  const now = new Date().toISOString()
  const packs = await Promise.all(targets.map(async (br) => ({ br, docs: await getGuardDocs(br.id) })))
  for (const { br, docs } of packs) {
    const hit = docs.find((d) => d.active !== false && normaliseMobile(d.mobile) === mob)
    if (hit) return mapMisDocToOps(hit, br.name, now)
  }
  return null
}
