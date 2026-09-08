/**
 * Cumulative Referral Details — new recruits only, one person once.
 * Rejoins / old guards are not counted as new recruits.
 */

import type { DrrDetailPackage, DrrRecruitRow } from './drr-detail-store.js'
import type { DeployFollowup } from './deploy-followup-store.js'
import type { JoinBackRecord } from './store.js'

export type ReferralListRow = {
  id: string
  name: string
  phone: string
  mobile: string
  empId?: string
  branchId: string
  company: string
  client: string
  location: string
  vacantPosition: string
  designation?: string
  walkInFrom: string
  referredBy: string
  regCode: string
  createdAt: string
  reportDate: string
  status: string
  source: string
  remarks?: string
  kind?: string
}

const REJOIN_HINT =
  /\bre-?join(?:ed|s)?\b|\bjoin[-\s]?backs?\b|\bold\s+guards?\b|\bexisting\s+guards?\b|\bex[-\s]?guards?\b|\balready\s+(?:working|employed|on\s+roll|onroll)\b|\bpreviously\s+worked\b|\bleft\s+and\s+join/

export function referralMobile(raw: unknown): string {
  const d = String(raw ?? '').replace(/\D/g, '')
  return d.length >= 10 ? d.slice(-10) : ''
}

const ROLE_SUFFIX =
  /\b(om|hod|am|so|aso|sg|lsg|stf|spo|spa|bm|arm|fo|ops|office manager|area manager)\b/g

function collapseName(raw: unknown): string {
  return String(raw ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\u2010-\u2015\u2212\u00a0\u200b-\u200d\ufeff]/g, ' ')
    .replace(/\b(mr|mrs|ms|sri|smt)\b\.?/g, ' ')
    .replace(/[-_/(),.]+/g, ' ')
    .replace(ROLE_SUFFIX, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function referralNameKey(raw: unknown): string {
  return collapseName(raw)
}

/** No-space key so ASTMANGAL / AST MANGAL / SARKAR-OM / SARKAROM become one Staff / SG. */
export function compactStaffKey(raw: unknown): string {
  let s = collapseName(raw).replace(/\s+/g, '')
  s = s.replace(/(officemanager|areamanager|office|manager)+$/g, '')
  s = s.replace(/(om|hod|aso|lsg|stf|spo|spa)$/g, '')
  if (s.length > 8) s = s.replace(/sg$/g, '')
  return s
}

/** Staff / SG grouping key — ASTMANGAL SARKAR-OM and ASTMANGAL SARKAR OM are the same person. */
export function referralStaffKey(raw: unknown): string {
  return compactStaffKey(raw)
}

export function nicerStaffName(names: string[]): string {
  const cleaned = names.map((n) => String(n || '').replace(/\s+/g, ' ').trim()).filter(Boolean)
  if (!cleaned.length) return '—'
  cleaned.sort((a, b) => {
    const aom = /om/i.test(a) ? 1 : 0
    const bom = /om/i.test(b) ? 1 : 0
    return bom - aom || b.length - a.length || a.localeCompare(b)
  })
  return cleaned[0]
}

export function referralEmpKey(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
}

/** Stable identity: mobile, then employee id, then branch+name. */
export function referralPersonKey(r: {
  name?: string
  mobile?: string
  phone?: string
  empId?: string
  regCode?: string
  branchId?: string
  id?: string
}): string {
  const mobile = referralMobile(r.mobile || r.phone)
  if (mobile) return `m:${mobile}`
  const emp = referralEmpKey(r.empId || r.regCode)
  if (emp && emp.length >= 4) return `e:${emp}`
  const name = referralNameKey(r.name)
  const branch = String(r.branchId || '')
    .trim()
    .toLowerCase()
  if (name && name.length >= 4 && branch) return `n:${branch}:${name}`
  if (name && name.length >= 6) return `n:${name}`
  return `id:${String(r.id || '')}`
}

export function looksLikeRejoinOrOldGuard(kind?: string, ...texts: unknown[]): boolean {
  if (String(kind || '').toLowerCase() === 'rejoin') return true
  const blob = texts.map((t) => String(t || '')).join(' ')
  return REJOIN_HINT.test(blob.toLowerCase())
}

export type KnownGuardIndex = {
  keys: Set<string>
  firstRecruitDate: Map<string, string>
}

function addKeys(set: Set<string>, r: { name?: string; mobile?: string; phone?: string; empId?: string; regCode?: string; branchId?: string; id?: string }) {
  const key = referralPersonKey(r)
  if (key && !key.startsWith('id:')) set.add(key)
  const mobile = referralMobile(r.mobile || r.phone)
  if (mobile) set.add(`m:${mobile}`)
  const emp = referralEmpKey(r.empId || r.regCode)
  if (emp && emp.length >= 4) set.add(`e:${emp}`)
}

export function buildKnownGuardIndex(
  packs: DrrDetailPackage[],
  joinbacks: JoinBackRecord[],
  followups: DeployFollowup[],
): KnownGuardIndex {
  const keys = new Set<string>()
  const firstRecruitDate = new Map<string, string>()

  for (const p of packs) {
    if (p.active === false) continue
    const day = String(p.reportDate || '').slice(0, 10)
    for (const t of p.transfers || []) {
      addKeys(keys, { name: t.name, empId: t.empId, branchId: p.branchId, id: t.id })
    }
    for (const s of p.resignations || []) {
      addKeys(keys, { name: s.name, empId: s.empId, branchId: p.branchId, id: s.id })
    }
    for (const r of p.recruits || []) {
      const row = {
        name: r.name,
        mobile: r.mobile,
        empId: r.empId,
        branchId: p.branchId,
        id: r.id,
      }
      const k = referralPersonKey(row)
      const doj = String(r.doj || day).slice(0, 10)
      if (k && doj) {
        const prev = firstRecruitDate.get(k)
        if (!prev || doj < prev) firstRecruitDate.set(k, doj)
      }
      if (r.kind === 'rejoin' || looksLikeRejoinOrOldGuard(r.kind, r.remarks, r.referredBy)) {
        addKeys(keys, row)
      }
    }
  }

  for (const j of joinbacks) {
    if (j.active === false) continue
    addKeys(keys, { name: j.guardName, mobile: j.mobile, branchId: j.branchId, id: j.id })
  }
  for (const f of followups) {
    if (f.active === false) continue
    if (f.kind !== 'rejoin') continue
    addKeys(keys, { name: f.name, mobile: f.mobile, empId: f.empId, branchId: f.branch, id: f.id })
  }

  return { keys, firstRecruitDate }
}

export function isRejoinOrOldGuardRow(
  r: Pick<DrrRecruitRow, 'kind' | 'remarks' | 'referredBy' | 'name' | 'mobile' | 'empId' | 'id'> & {
    doj?: string
  },
  pack: { reportDate?: string; branchId?: string },
  index: KnownGuardIndex,
): boolean {
  if (looksLikeRejoinOrOldGuard(r.kind, r.remarks, r.referredBy, r.name)) return true
  const row = {
    name: r.name,
    mobile: r.mobile,
    empId: r.empId,
    branchId: pack.branchId,
    id: r.id,
  }
  const key = referralPersonKey(row)
  if (index.keys.has(key)) return true
  const mobile = referralMobile(r.mobile)
  if (mobile && index.keys.has(`m:${mobile}`)) return true
  const emp = referralEmpKey(r.empId)
  if (emp && emp.length >= 4 && index.keys.has(`e:${emp}`)) return true
  const day = String(r.doj || pack.reportDate || '').slice(0, 10)
  const first = index.firstRecruitDate.get(key)
  if (first && day && first < day) return true
  return false
}

function rowScore(r: ReferralListRow): number {
  const src = String(r.source || '')
  let n = 0
  if (src.includes('Daily Recruitment')) n += 4
  if (String(r.status || '').toLowerCase() === 'joined') n += 2
  if (referralMobile(r.mobile || r.phone)) n += 1
  if (referralEmpKey(r.empId || r.regCode).length >= 4) n += 1
  if (String(r.client || '').trim()) n += 1
  if (String(r.location || r.walkInFrom || '').trim()) n += 1
  if (String(r.designation || '').trim()) n += 1
  return n
}

function mergeReferralRow(keep: ReferralListRow, extra: ReferralListRow): ReferralListRow {
  const pick = (a: unknown, b: unknown) => {
    const as = String(a ?? '').trim()
    const bs = String(b ?? '').trim()
    if (as && as !== '—') return as
    return bs
  }
  const winner = rowScore(extra) > rowScore(keep) ? extra : keep
  const other = winner === extra ? keep : extra
  return {
    ...winner,
    name: pick(winner.name, other.name),
    phone: pick(winner.phone, other.phone),
    mobile: pick(winner.mobile, other.mobile),
    empId: pick(winner.empId, other.empId),
    branchId: pick(winner.branchId, other.branchId),
    company: pick(winner.company, other.company),
    client: pick(winner.client, other.client),
    location: pick(winner.location, other.location),
    vacantPosition: pick(winner.vacantPosition, other.vacantPosition),
    designation: pick(winner.designation, other.designation),
    walkInFrom: pick(winner.walkInFrom, other.walkInFrom),
    referredBy: nicerStaffName([winner.referredBy, other.referredBy]),
    regCode: pick(winner.regCode, other.regCode),
    createdAt: pick(winner.createdAt, other.createdAt),
    reportDate: pick(winner.reportDate, other.reportDate),
    status: pick(winner.status, other.status),
    source: pick(winner.source, other.source),
    remarks: pick(winner.remarks, other.remarks),
    kind: winner.kind || other.kind,
  }
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let last = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const next = a[i - 1] === b[j - 1] ? last : Math.min(last, prev[j], prev[j - 1]) + 1
      last = prev[j]
      prev[j] = next
    }
  }
  return prev[b.length]
}

function sameStaffKey(a: string, b: string): boolean {
  if (!a || !b) return false
  if (a === b) return true
  if (a.length >= 10 && b.length >= 10 && (a.includes(b) || b.includes(a))) return true
  return a.length >= 12 && b.length >= 12 && editDistance(a, b) <= 1
}

export function foldReferralStaffNames(rows: ReferralListRow[]): ReferralListRow[] {
  const names = new Map<string, string[]>()
  for (const r of rows) {
    const k = referralStaffKey(r.referredBy) || '—'
    const list = names.get(k) || []
    list.push(String(r.referredBy || '').trim())
    names.set(k, list)
  }
  const keys = [...names.keys()]
  const parent = new Map<string, string>()
  const rootOf = (k: string): string => {
    let cur = k
    while (parent.has(cur) && parent.get(cur) !== cur) cur = parent.get(cur) || cur
    return cur
  }
  for (const k of keys) parent.set(k, k)
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      if (!sameStaffKey(keys[i], keys[j])) continue
      const ri = rootOf(keys[i])
      const rj = rootOf(keys[j])
      if (ri !== rj) parent.set(rj, ri)
    }
  }
  const merged = new Map<string, string[]>()
  for (const k of keys) {
    const root = rootOf(k)
    merged.set(root, [...(merged.get(root) || []), ...(names.get(k) || [])])
  }
  const canon = new Map<string, string>()
  for (const [root, list] of merged) canon.set(root, nicerStaffName(list))
  return rows.map((r) => {
    const root = rootOf(referralStaffKey(r.referredBy) || '—')
    return { ...r, referredBy: canon.get(root) || r.referredBy }
  })
}

function clusterKey(r: ReferralListRow): string {
  const mobile = referralMobile(r.mobile || r.phone)
  if (mobile) return `m:${mobile}`
  const emp = referralEmpKey(r.empId || r.regCode)
  if (emp && emp.length >= 4 && !emp.startsWith('wi/')) return `e:${emp}`
  const staff = referralStaffKey(r.referredBy)
  const name = referralNameKey(r.name)
  if (staff && name && name.length >= 8) return `sn:${staff}:${name}`
  return referralPersonKey(r)
}

/** Keep one row per person. Same Staff/SG name (even with -OM) is one group. Double new-recruit entries are combined. */
export function dedupeReferralRows(rows: ReferralListRow[]): ReferralListRow[] {
  const folded = foldReferralStaffNames(rows)
  const best = new Map<string, ReferralListRow>()
  for (const r of folded) {
    const key = clusterKey(r)
    const prev = best.get(key)
    best.set(key, prev ? mergeReferralRow(prev, r) : r)
  }
  return [...best.values()].sort(
    (a, b) =>
      a.referredBy.localeCompare(b.referredBy) ||
      String(a.name || '').localeCompare(String(b.name || '')) ||
      String(a.reportDate || '').localeCompare(String(b.reportDate || '')),
  )
}

export function referralLeaderTotals(rows: ReferralListRow[]): Array<{ name: string; count: number }> {
  const map = new Map<string, { name: string; count: number }>()
  for (const r of rows) {
    const key = referralStaffKey(r.referredBy) || '—'
    const hit = map.get(key)
    if (!hit) map.set(key, { name: nicerStaffName([r.referredBy]), count: 1 })
    else {
      hit.count += 1
      hit.name = nicerStaffName([hit.name, r.referredBy])
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Sunday is not a working day. Saturday is. */
export function lastWorkingDayOfMonth(ymd: string): string {
  const p = String(ymd || '').slice(0, 10).split('-')
  const y = Number(p[0])
  const m = Number(p[1])
  if (!y || !m) return String(ymd || '').slice(0, 10)
  let d = new Date(y, m, 0).getDate()
  while (d >= 1) {
    const cur = `${y}-${pad2(m)}-${pad2(d)}`
    const wd = new Date(`${cur}T12:00:00+05:30`).getDay()
    if (wd !== 0) return cur
    d -= 1
  }
  return `${y}-${pad2(m)}-01`
}

/** Default Cumulative Referral period: 1st of the month to last working day (or today if the month is still open). */
export function monthReferralRange(todayYmd: string): { from: string; to: string } {
  const t = String(todayYmd || '').slice(0, 10)
  const p = t.split('-')
  const from = p.length === 3 ? `${p[0]}-${p[1]}-01` : t
  const lwd = lastWorkingDayOfMonth(t)
  const to = t && t < lwd ? t : lwd
  return { from, to }
}
