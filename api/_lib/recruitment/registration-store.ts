/**
 * Registered candidates — Agile Recruitment form + SecurityJob.co.in registrations.
 * Redis: recruit:registrations · recruit:regimg:{id} · sj:applicants (SecurityJob)
 */

import { getApplicants, parseRegCodeDate, type SjApplicant } from '../securityjob/store.js'
import {
  applySjFollowupDateBook,
  hydrateSjDatesFromPersonKeys,
  loadSjFollowupDateBook,
} from './sj-followup-dates.js'
import { RECRUIT_BRANCHES, recruitNid } from './store.js'

export type RegisteredCandidateStatus =
  | 'new'
  | 'contacted'
  | 'auto_reply'
  | 'replied'
  | 'joined'
  | 'rejected'
  | 'not_willing'

export type RegisteredCandidate = {
  id: string
  regCode: string
  branchId: string
  name: string
  phone: string
  email: string
  location: string
  role: string
  experience: string
  education: string
  language: string
  photoId: string
  status: RegisteredCandidateStatus
  noticeSentAt?: string
  replyAt?: string
  replyNotes?: string
  /** Date of call (YYYY-MM-DD) */
  calledAt?: string
  tentativeJoinDate?: string
  /** When they joined (YYYY-MM-DD or ISO) */
  joinedAt?: string
  autoReplyAt?: string
  rejectedAt?: string
  notWillingAt?: string
  /** Walk-in only — department or branch that added the entry */
  walkInFrom?: string
  /** Walk-in only — employee or contact who referred this candidate */
  referredBy?: string
  /** Pipeline channel: walkin · referral · academy · recruiters */
  funnelChannel?: string
  /**
   * Who must call within 24h — `Recruitment Department` (Hyderabad RC / HQ)
   * or a physical branch name (Nellore, Visakhapatnam, …).
   */
  ownerTeam?: string
  /** ISO deadline = registration time + 24 clock hours */
  callDueAt?: string
  /** First call / WhatsApp touch (ISO or YYYY-MM-DD) — SLA met when set */
  firstCalledAt?: string
  /** Put on the Security Job waiting list (YYYY-MM-DD) */
  waitingListAt?: string
  /** App team — first call date */
  call1At?: string
  /** App team — second call date */
  call2At?: string
  /** Recruitment team — third call date */
  call3At?: string
  /** When WhatsApp invitation draft was opened */
  whatsappInviteAt?: string
  /** Hold on — remind on this future date */
  holdRemindOn?: string
  /** Recruitment Team closed this name as Recruited */
  recruitClosed?: boolean
  reopenedAt?: string
  source: 'registration_form' | 'securityjob' | 'walk_in'
  createdAt: string
  active: boolean
}

export const CALL_SLA_HOURS = 24
export const HYDERABAD_OWNER_TEAM = 'Recruitment Department'

/** Cities / branches owned by Hyderabad Recruitment Department (not zone HODs). */
const HYDERABAD_RC_OWNER_BRANCHES = new Set([
  'Hyderabad',
  'Hyderabad - A',
  'Hyderabad - B',
  'Hi-Tech City',
  'Corporate Office',
])

/**
 * Resolve who owns follow-up for a Security Job / registration location.
 * Hyd-A / Hyd-B / Hi-Tech / Warangal / etc. → Recruitment Department.
 * Other centres → that branch HOD.
 */
export function resolveRegistrationOwner(location: string, branchId?: string): string {
  const branch = String(branchId || '').trim() || branchFromLocation(location)
  if (HYDERABAD_RC_OWNER_BRANCHES.has(branch)) return HYDERABAD_OWNER_TEAM
  if (/hyderabad|hi-?tech|hitech|secunderabad|warangal|karimnagar|zone[\s-]*a|zone[\s-]*b/i.test(
    `${location} ${branch}`,
  )) {
    return HYDERABAD_OWNER_TEAM
  }
  if (branch && !/^Hyderabad/i.test(branch) && branch !== 'Hi-Tech City' && (RECRUIT_BRANCHES as readonly string[]).includes(branch as (typeof RECRUIT_BRANCHES)[number])) {
    return branch
  }
  return HYDERABAD_OWNER_TEAM
}

export function registrationCreatedMs(createdAt: string, regCode?: string): number {
  const fromCode = regCode ? parseRegCodeDate(regCode) : null
  if (fromCode) return fromCode.getTime()
  const t = Date.parse(String(createdAt ?? ''))
  if (!Number.isNaN(t)) return t
  const day = registrationDay(createdAt, regCode)
  if (day) {
    const d = Date.parse(`${day}T12:00:00+05:30`)
    if (!Number.isNaN(d)) return d
  }
  return Date.now()
}

export function callDueAtFromCreated(createdAt: string, regCode?: string): string {
  const ms = registrationCreatedMs(createdAt, regCode)
  return new Date(ms + CALL_SLA_HOURS * 60 * 60 * 1000).toISOString()
}

/** Fill ownerTeam / callDueAt when missing (legacy rows + live SJ merge). */
export function ensureRegistrationOwnership(c: RegisteredCandidate): RegisteredCandidate {
  const ownerTeam = String(c.ownerTeam || '').trim() || resolveRegistrationOwner(c.location, c.branchId)
  const callDueAt =
    String(c.callDueAt || '').trim() || callDueAtFromCreated(c.createdAt, c.regCode)
  return { ...c, ownerTeam, callDueAt }
}

export type CallSlaInfo = {
  ownerTeam: string
  callDueAt: string
  /** 0–100 progress of 24h window */
  slaPct: number
  remainingMs: number
  overdue: boolean
  met: boolean
  label: string
}

export function callSlaMet(c: RegisteredCandidate): boolean {
  if (c.status === 'joined' || c.status === 'rejected' || c.status === 'not_willing') return true
  if (String(c.firstCalledAt || '').trim()) return true
  if (String(c.calledAt || '').trim()) return true
  if (String(c.autoReplyAt || '').trim()) return true
  if (c.status === 'contacted' || c.status === 'replied' || c.status === 'auto_reply') return true
  return false
}

export function computeCallSla(c: RegisteredCandidate, nowMs = Date.now()): CallSlaInfo {
  const withOwn = ensureRegistrationOwnership(c)
  const dueMs = Date.parse(String(withOwn.callDueAt || '')) || nowMs + CALL_SLA_HOURS * 3600_000
  const startMs = dueMs - CALL_SLA_HOURS * 3600_000
  const met = callSlaMet(withOwn)
  const remainingMs = dueMs - nowMs
  const overdue = !met && remainingMs <= 0
  const elapsed = Math.max(0, nowMs - startMs)
  const slaPct = met ? 100 : Math.min(100, Math.max(0, Math.round((elapsed / (CALL_SLA_HOURS * 3600_000)) * 100)))
  let label = 'Call within 24h'
  if (met) label = 'Called (SLA met)'
  else if (overdue) {
    const lateH = Math.floor(Math.abs(remainingMs) / 3600_000)
    const lateM = Math.floor((Math.abs(remainingMs) % 3600_000) / 60_000)
    label = lateH > 0 ? `Overdue by ${lateH}h ${lateM}m` : `Overdue by ${lateM}m`
  } else {
    const leftH = Math.floor(remainingMs / 3600_000)
    const leftM = Math.floor((remainingMs % 3600_000) / 60_000)
    label = leftH > 0 ? `${leftH}h ${leftM}m left` : `${leftM}m left`
  }
  return {
    ownerTeam: withOwn.ownerTeam || HYDERABAD_OWNER_TEAM,
    callDueAt: withOwn.callDueAt || callDueAtFromCreated(c.createdAt, c.regCode),
    slaPct,
    remainingMs,
    overdue,
    met,
    label,
  }
}

const LIST_KEY = 'recruit:registrations'
const COUNTER_KEY = 'recruit:reg-counter'
const IMG_PREFIX = 'recruit:regimg:'

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

export function registrationStorageOk(): boolean {
  return Boolean(redisConfig())
}

export function branchFromLocation(location: string): string {
  const loc = String(location ?? '').trim().toLowerCase()
  if (!loc) return 'Hyderabad - A'
  if (/gulbarga|kalaburagi|bangalore|bengaluru|mysuru|mysore|mangaluru|mangalore/.test(loc)) return 'Bangalore'
  if (/hi-?tech|hitech/.test(loc)) return 'Hi-Tech City'
  if (/hyderabad[\s\-–]*b|zone[\s-]*b/.test(loc)) return 'Hyderabad - B'
  if (/hyderabad[\s\-–]*a|zone[\s-]*a/.test(loc)) return 'Hyderabad - A'
  if (/hyderabad|secunderabad|warangal|karimnagar|hyd\b/.test(loc)) return 'Hyderabad - A'
  if (/vizag|visakhapatnam/.test(loc)) return 'Visakhapatnam'
  if (/vijayawada/.test(loc)) return 'Vijayawada'
  if (/kakinada/.test(loc)) return 'Kakinada'
  if (/tadipatri/.test(loc)) return 'Tadipatri'
  if (/tirupati/.test(loc)) return 'Tirupati'
  if (/\btada\b/.test(loc)) return 'Tada'
  if (/nellore/.test(loc)) return 'Nellore'
  if (/puducherry|pondicherry/.test(loc)) return 'Puducherry'
  if (/chennai|coimbatore|madurai/.test(loc)) return 'Chennai'
  if (/surat/.test(loc)) return 'Surat'
  if (/mumbai|pune|nagpur/.test(loc)) return 'Mumbai'
  if (/bhopal|indore/.test(loc)) return 'Bhopal'
  if (/kochi|cochin|kerala/.test(loc)) return 'Kochi'
  if (/corporate|head.?office|ho\b/.test(loc)) return 'Hyderabad - A'
  const hit = RECRUIT_BRANCHES.find(
    (b) => loc.includes(b.toLowerCase()) || b.toLowerCase().includes(loc),
  )
  return hit || 'Hyderabad - A'
}

function regCodeFor(branchId: string, serial: number): string {
  const ab = branchId.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X') || 'RC'
  const now = new Date()
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yyyy = now.getFullYear()
  const hh = String(now.getHours()).padStart(2, '0')
  const mi = String(now.getMinutes()).padStart(2, '0')
  return `RC/${ab}/${String(serial).padStart(5, '0')}/${dd}${mm}${yyyy}-${hh}${mi}`
}

async function nextSerial(): Promise<number> {
  const d = await redis(['INCR', COUNTER_KEY])
  const n = Number(d?.result)
  return Number.isFinite(n) ? n : Date.now() % 100000
}

export async function getRegistrations(): Promise<RegisteredCandidate[]> {
  const d = await redis(['GET', LIST_KEY])
  if (d?.result && typeof d.result === 'string') {
    try {
      return JSON.parse(d.result) as RegisteredCandidate[]
    } catch {
      return []
    }
  }
  return []
}

export async function saveRegistrations(list: RegisteredCandidate[]) {
  await redis(['SET', LIST_KEY, JSON.stringify(list.slice(0, 10000))])
}

export async function saveRegistrationImage(dataUrl: string): Promise<string | null> {
  if (!dataUrl.startsWith('data:image/')) return null
  const id = recruitNid('ri')
  const ok = await redis(['SET', IMG_PREFIX + id, dataUrl])
  return ok ? id : null
}

function ymd(v: unknown): string {
  const s = String(v || '').trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  return ''
}

export function normalizeRegistration(raw: Partial<RegisteredCandidate>): RegisteredCandidate {
  const status = (
    ['new', 'contacted', 'auto_reply', 'replied', 'joined', 'rejected', 'not_willing'].includes(
      String(raw.status),
    )
      ? raw.status
      : 'new'
  ) as RegisteredCandidateStatus
  const location = String(raw.location ?? '')
  const branchId = String(raw.branchId ?? '').trim() || branchFromLocation(location)
  const calledAt = String(raw.calledAt || '').trim().slice(0, 10)
  const joinedAt = String(raw.joinedAt || '').trim().slice(0, 40)
  const createdAt = String(raw.createdAt ?? new Date().toISOString())
  const regCode = String(raw.regCode ?? '')
  const ownerTeam =
    String(raw.ownerTeam || '').trim() || resolveRegistrationOwner(location, branchId)
  const callDueAt =
    String(raw.callDueAt || '').trim() || callDueAtFromCreated(createdAt, regCode)
  const firstCalledAt = String(raw.firstCalledAt || calledAt || '').trim().slice(0, 40)
  return {
    id: String(raw.id || recruitNid('rg')),
    regCode,
    branchId,
    name: String(raw.name ?? '').slice(0, 120),
    phone: String(raw.phone ?? '').slice(0, 20),
    email: String(raw.email ?? '').slice(0, 120),
    location: location.slice(0, 120),
    role: String(raw.role ?? 'Security Guard').slice(0, 80),
    experience: String(raw.experience ?? '').slice(0, 80),
    education: String(raw.education ?? '').slice(0, 80),
    language: String(raw.language ?? '').slice(0, 80),
    photoId: String(raw.photoId ?? ''),
    status,
    noticeSentAt: raw.noticeSentAt || undefined,
    replyAt: raw.replyAt || undefined,
    replyNotes: raw.replyNotes || undefined,
    ...(calledAt ? { calledAt } : {}),
    tentativeJoinDate: raw.tentativeJoinDate || undefined,
    ...(joinedAt ? { joinedAt } : {}),
    autoReplyAt: raw.autoReplyAt || undefined,
    rejectedAt: raw.rejectedAt || undefined,
    notWillingAt: raw.notWillingAt || undefined,
    walkInFrom: raw.walkInFrom ? String(raw.walkInFrom).slice(0, 80) : undefined,
    referredBy: raw.referredBy ? String(raw.referredBy).slice(0, 120) : undefined,
    funnelChannel: raw.funnelChannel
      ? String(raw.funnelChannel).slice(0, 40).toLowerCase()
      : undefined,
    ownerTeam,
    callDueAt,
    ...(firstCalledAt ? { firstCalledAt } : {}),
    ...(String(raw.waitingListAt || '').trim()
      ? { waitingListAt: String(raw.waitingListAt).trim().slice(0, 10) }
      : {}),
    ...(ymd(raw.call1At) ? { call1At: ymd(raw.call1At) } : {}),
    ...(ymd(raw.call2At) ? { call2At: ymd(raw.call2At) } : {}),
    ...(ymd(raw.call3At) ? { call3At: ymd(raw.call3At) } : {}),
    ...(ymd(raw.whatsappInviteAt) ? { whatsappInviteAt: ymd(raw.whatsappInviteAt) } : {}),
    ...(ymd(raw.holdRemindOn) ? { holdRemindOn: ymd(raw.holdRemindOn) } : {}),
    recruitClosed: raw.recruitClosed === true,
    ...(raw.reopenedAt ? { reopenedAt: String(raw.reopenedAt).slice(0, 40) } : {}),
    source: raw.source === 'securityjob' ? 'securityjob' : raw.source === 'walk_in' ? 'walk_in' : 'registration_form',
    createdAt,
    active: raw.active !== false,
  }
}

/** Copy a SecurityJob row into recruit:registrations so pipeline fields can be saved (one list). */
export async function materializeSjRegistration(
  hit: RegisteredCandidate,
): Promise<RegisteredCandidate> {
  if (!hit.id.startsWith('sj:')) return hit
  const all = await getRegistrations()
  const dig = hit.phone.replace(/\D/g, '').slice(-10)
  const existing = dig.length >= 10
    ? all.find((r) => r.active !== false && r.phone.replace(/\D/g, '').slice(-10) === dig)
    : undefined
  const book = await loadSjFollowupDateBook()
  if (existing) return applySjFollowupDateBook(existing, book)
  const serial = await nextSerial()
  const row = applySjFollowupDateBook(
    normalizeRegistration({
      ...hit,
      id: recruitNid('rg'),
      regCode: hit.regCode || regCodeFor(hit.branchId, serial),
      source: 'securityjob',
      status: hit.status === 'new' ? 'new' : hit.status,
    }),
    book,
  )
  await saveRegistrations([row, ...all])
  return row
}

export async function addRegistration(input: {
  name: string
  phone: string
  email?: string
  location: string
  branchId?: string
  role?: string
  experience?: string
  education?: string
  language?: string
  photoId?: string
  walkInFrom?: string
  referredBy?: string
  source?: RegisteredCandidate['source']
}): Promise<RegisteredCandidate | null> {
  const serial = await nextSerial()
  const branchId = input.branchId?.trim() || branchFromLocation(input.location)
  const row = normalizeRegistration({
    id: recruitNid('rg'),
    regCode: regCodeFor(branchId, serial),
    branchId,
    name: input.name,
    phone: input.phone,
    email: input.email || '',
    location: input.location,
    role: input.role || 'Security Guard',
    experience: input.experience || '',
    education: input.education || '',
    language: input.language || '',
    photoId: input.photoId || '',
    walkInFrom: input.walkInFrom || undefined,
    referredBy: input.referredBy || undefined,
    source: input.source || 'registration_form',
    status: 'new',
    active: true,
    createdAt: new Date().toISOString(),
  })
  const all = await getRegistrations()
  await saveRegistrations([row, ...all])
  return row
}

export async function deleteRegistration(id: string): Promise<RegisteredCandidate[]> {
  const all = await getRegistrations()
  const next = all.filter((r) => r.id !== id)
  await saveRegistrations(next)
  return next
}

/** Normalise createdAt / reg code to YYYY-MM-DD for date filters. */
export function registrationDay(createdAt: string, regCode?: string): string {
  const raw = String(createdAt ?? '').trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)
  const dmy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  }
  const parsed = Date.parse(raw.replace(',', ''))
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  }
  const fromCode = regCode ? parseRegCodeDate(regCode) : null
  if (fromCode) return fromCode.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  return ''
}

export function registrationSortTs(createdAt: string, regCode?: string, registeredOn?: string): number {
  const t = Date.parse(String(createdAt ?? ''))
  if (!Number.isNaN(t)) return t
  const fromCode = regCode ? parseRegCodeDate(regCode) : null
  if (fromCode) return fromCode.getTime()
  const day = registeredOn || registrationDay(createdAt, regCode)
  if (day) {
    const d = Date.parse(`${day}T12:00:00+05:30`)
    if (!Number.isNaN(d)) return d
  }
  return 0
}
export function matchesRecruitBranch(candidateBranchId: string, recruitBranch: string): boolean {
  const c = String(candidateBranchId ?? '').trim().toLowerCase()
  const r = String(recruitBranch ?? '').trim().toLowerCase()
  if (!r || r === 'all') return true
  if (!c) return false
  if (c === r) return true
  const hyd = /hyderabad|hi-?tech|hitech|hyd\b|zone[\s-]*a|zone[\s-]*b/
  if (r === 'hyderabad' && hyd.test(c)) return true
  if (hyd.test(c) && hyd.test(r)) return true
  if (/visakhapatnam|vizag|kakinada/.test(c) && /visakhapatnam|vizag|kakinada/.test(r)) return true
  if (/mumbai|surat|gujarat|maharashtra/.test(c) && /mumbai|surat/.test(r)) return true
  if (/chennai|pondicherry|puducherry|tamil/.test(c) && /chennai|pondicherry/.test(r)) return true
  if (/nellore|tada/.test(c) && /nellore|tada/.test(r)) return true
  if (/tirupati|tadipatri/.test(c) && /tirupati|tadipatri/.test(r)) return true
  if (/bhopal|madhya/.test(c) && /bhopal/.test(r)) return true
  if (/kochi|kerala|cochin/.test(c) && /kochi/.test(r)) return true
  if (/bangalore|bengaluru|gulbarga|kalaburagi/.test(c) && /bangalore|gulbarga/.test(r)) return true
  if (c.includes(r) || r.includes(c)) return true
  return false
}

export function sjToRegisteredCandidate(a: SjApplicant): RegisteredCandidate {
  const day = registrationDay(a.createdAt, a.regCode)
  return normalizeRegistration({
    id: `sj:${a.id}`,
    regCode: a.regCode,
    branchId: branchFromLocation(a.location),
    name: a.name,
    phone: a.phone,
    email: a.email || '',
    location: a.location,
    role: a.role,
    experience: a.experience,
    education: a.education,
    language: a.language,
    photoId: a.photoId,
    status: 'new',
    source: 'securityjob',
    createdAt: day ? `${day}T12:00:00.000Z` : a.createdAt,
    active: true,
  })
}

/** Merge recruitment form + SecurityJob.co.in (dedupe by mobile). */
export async function loadAllRegisteredCandidates(): Promise<RegisteredCandidate[]> {
  const [recruit, sj, dateBook0] = await Promise.all([
    getRegistrations(),
    getApplicants(),
    loadSjFollowupDateBook(),
  ])
  const seen = new Set(
    recruit.map((r) => r.phone.replace(/\D/g, '').slice(-10)).filter((p) => p.length >= 10),
  )
  const merged = [...recruit]
  for (const row of sj.map(sjToRegisteredCandidate)) {
    const mob = row.phone.replace(/\D/g, '').slice(-10)
    if (mob.length >= 10 && seen.has(mob)) continue
    if (mob.length >= 10) seen.add(mob)
    merged.push(row)
  }
  const dateBook = await hydrateSjDatesFromPersonKeys(dateBook0, merged)
  return merged
    .map((row) => applySjFollowupDateBook(row, dateBook))
    .sort((a, b) => {
      const da = registrationSortTs(a.createdAt, a.regCode, registrationDay(a.createdAt, a.regCode))
      const db = registrationSortTs(b.createdAt, b.regCode, registrationDay(b.createdAt, b.regCode))
      return db - da || String(b.id).localeCompare(String(a.id))
    })
}

export function filterRegistrations(
  all: RegisteredCandidate[],
  branchId: string,
  dateFrom?: string,
  dateTo?: string,
): RegisteredCandidate[] {
  return all
    .filter((r) => r.active && matchesRecruitBranch(r.branchId, branchId))
    .filter((r) => {
      if (!dateFrom && !dateTo) return true
      const day = registrationDay(r.createdAt, r.regCode)
      if (!day) return true
      if (dateFrom && day < dateFrom) return false
      if (dateTo && day > dateTo) return false
      return true
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function statusLabel(status: RegisteredCandidateStatus): string {
  if (status === 'joined') return 'Joined'
  if (status === 'new') return 'Call 1 due'
  return 'Follow-up'
}

export function sjCall1At(c: RegisteredCandidate): string {
  return ymd(c.call1At)
}

export function sjHoldOn(c: RegisteredCandidate): string {
  return ymd(c.holdRemindOn) || ymd(c.waitingListAt)
}

export type SjFollowTab = 'call1' | 'call2' | 'call3' | 'hold' | 'joined'

export function candidatePipelineBucket(
  c: RegisteredCandidate,
  todayYmd: string,
): 'registered' | 'responded' | 'follow_up' | 'joined' | 'closed' {
  if (c.status === 'joined' && String(c.joinedAt || '').trim()) return 'joined'
  if (c.status === 'rejected' || c.status === 'not_willing') return 'closed'
  const doj = String(c.tentativeJoinDate || '').slice(0, 10)
  if (doj && doj <= todayYmd) return 'follow_up'
  if ((c.status === 'new' || c.status === 'joined') && !c.calledAt && !c.tentativeJoinDate) return 'registered'
  return 'responded'
}

export function sjFollowBucket(c: RegisteredCandidate, todayYmd = ''): SjFollowTab {
  if (c.recruitClosed && c.status === 'joined' && ymd(c.joinedAt) && !c.reopenedAt) return 'joined'
  if (c.status === 'joined' && ymd(c.joinedAt) && !c.reopenedAt) return 'joined'
  const hold = sjHoldOn(c)
  if (hold && (!todayYmd || hold >= todayYmd) && !(ymd(c.joinedAt) && !c.reopenedAt)) return 'hold'
  if (!ymd(c.call1At) || !ymd(c.tentativeJoinDate)) return 'call1'
  if (!ymd(c.call2At)) return 'call2'
  return 'call3'
}

export function sjFollowTabLabel(tab: SjFollowTab): string {
  if (tab === 'call1') return 'Call 1 due'
  if (tab === 'call2') return 'Call 2 due'
  if (tab === 'call3') return 'Call 3 due'
  if (tab === 'hold') return 'Hold on'
  return 'Joined'
}
