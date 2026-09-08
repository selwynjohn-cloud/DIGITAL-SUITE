import { QUIZ, STARTER_QUIZ_BANK } from './config.js'
import { redisCommand } from './store.js'
import type { QuizEntry, QuizQuestion, QuizWinner, PendingQuizWinner } from './types.js'

/**
 * Security Question of the Day engine.
 * - Master pool ~130 unique questions; about 100 stay in the live bank
 * - Every calendar month, 30 live questions are changed
 * - One question per day
 * - Same question is not asked twice in the same calendar month (IST)
 * - Also no repeat for 60 days when unused questions remain
 * - Weekly prize-draw: only the current winner (name, week, coupon code) is kept
 * All stored in Upstash Redis so everything is remembered permanently.
 */

const BANK_KEY = 'pulse:quiz:bank'
const USED_KEY = 'pulse:quiz:used'
const WINNERS_KEY = 'pulse:quiz:winners'
const PENDING_WINNER_KEY = 'pulse:quiz:pending-winner'
const BANK_REFRESH_KEY = 'pulse:quiz:bank-refreshed'
const MONTH_SWAP_SEED_KEY = 'pulse:quiz:month-swap-seed'
const NO_REPEAT_DAYS = 60
const BANK_REFRESH_DAYS = 60
const ACTIVE_BANK_SIZE = 100
const MONTHLY_SWAP_COUNT = 30
const OPTION_KEYS = ['A', 'B', 'C', 'D']

const IST_OFFSET_MIN = 5 * 60 + 30
function istNow(): Date {
  const utcMs = Date.now() + new Date().getTimezoneOffset() * 60000
  return new Date(utcMs + IST_OFFSET_MIN * 60000)
}
function istDateKey(): string {
  const d = istNow()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function isoWeekKeyFromParts(y: number, monthIndex: number, day: number): string {
  const target = new Date(Date.UTC(y, monthIndex, day))
  const dayNr = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNr + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const week =
    1 +
    Math.round(
      ((target.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7,
    )
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function ymdOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Prize week is Sunday–Saturday. Key uses the Saturday (so Sunday starts a new week). */
export function weekKey(base?: Date): string {
  const d = base ?? istNow()
  const start = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const sat = new Date(start)
  sat.setUTCDate(sat.getUTCDate() + (6 - sat.getUTCDay()))
  return isoWeekKeyFromParts(sat.getUTCFullYear(), sat.getUTCMonth(), sat.getUTCDate())
}

export function datesInWeek(week: string): string[] {
  const out: string[] = []
  const start = istNow()
  for (let i = -40; i <= 20; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    if (weekKey(d) === week) out.push(ymdOf(d))
  }
  return [...new Set(out)].sort()
}

function fallbackQuestion(): QuizQuestion {
  return {
    id: 'default',
    type: 'text',
    question: QUIZ.question,
    imageUrl: '',
    options: QUIZ.options,
    correctKey: QUIZ.correctKey,
    explanation: QUIZ.explanation,
  }
}

/** Normalised question text so the same wording cannot return under a new id. */
export function questionFingerprint(text: string): string {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .slice(0, 180)
}

export function dedupeQuizBank(list: QuizQuestion[]): QuizQuestion[] {
  const seen = new Set<string>()
  const out: QuizQuestion[] = []
  for (const q of list) {
    const fp = questionFingerprint(q.question)
    if (!fp || seen.has(fp)) continue
    seen.add(fp)
    out.push(q)
  }
  return out
}

function previousIstMonthKey(): string {
  const d = istNow()
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1)
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
}

function monthSwapKey(month: string): string {
  return `pulse:quiz:month-swap:${month}`
}

function splitActiveAndBench(saved: QuizQuestion[]): { active: QuizQuestion[]; bench: QuizQuestion[] } {
  const uniqueSaved = dedupeQuizBank(saved)
  const master = dedupeQuizBank([...uniqueSaved, ...STARTER_QUIZ_BANK])
  const active =
    uniqueSaved.length >= ACTIVE_BANK_SIZE
      ? uniqueSaved.slice(0, ACTIVE_BANK_SIZE)
      : (() => {
          const have = new Set(uniqueSaved.map((q) => questionFingerprint(q.question)))
          const fill = master.filter((q) => !have.has(questionFingerprint(q.question)))
          return dedupeQuizBank([...uniqueSaved, ...fill]).slice(0, ACTIVE_BANK_SIZE)
        })()
  const activeFp = new Set(active.map((q) => questionFingerprint(q.question)))
  const bench = master.filter((q) => !activeFp.has(questionFingerprint(q.question)))
  return { active, bench }
}

async function maybeMonthlySwap(active: QuizQuestion[], bench: QuizQuestion[]): Promise<QuizQuestion[]> {
  const month = istMonthKey()
  const key = monthSwapKey(month)
  const already = await redisCommand(['GET', key])
  if (already?.result) return active

  const seeded = await redisCommand(['GET', MONTH_SWAP_SEED_KEY])
  if (!seeded?.result) {
    await redisCommand(['SET', key, JSON.stringify({ skipped: 'seed-month', ts: Date.now() }), 'EX', 45 * 86400])
    await redisCommand(['SET', MONTH_SWAP_SEED_KEY, month])
    return active
  }

  const used = await getUsedMap()
  const prevMonth = previousIstMonthKey()
  const scored = active.map((q) => {
    const u = lastUsedAt(used, q)
    return {
      q,
      inThis: usedMonthKey(u) === month,
      inPrev: usedMonthKey(u) === prevMonth,
      usedMs: Date.parse(u || '0') || 0,
    }
  })
  const retire = scored
    .filter((s) => !s.inThis)
    .sort((a, b) => {
      if (a.inPrev !== b.inPrev) return a.inPrev ? -1 : 1
      return b.usedMs - a.usedMs
    })
    .slice(0, MONTHLY_SWAP_COUNT)
    .map((s) => s.q)

  if (retire.length < MONTHLY_SWAP_COUNT || bench.length < MONTHLY_SWAP_COUNT) {
    await redisCommand(['SET', key, JSON.stringify({ skipped: 'not-enough', ts: Date.now() }), 'EX', 45 * 86400])
    return active
  }

  const retireFp = new Set(retire.map((q) => questionFingerprint(q.question)))
  const keep = active.filter((q) => !retireFp.has(questionFingerprint(q.question)))
  const incoming = bench.slice(0, MONTHLY_SWAP_COUNT)
  return dedupeQuizBank([...keep, ...incoming])
}

function istMonthKey(d = istNow()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function usedMonthKey(iso: string): string {
  const t = Date.parse(iso)
  if (!Number.isFinite(t) || t <= 0) return ''
  const utcMs = t + new Date(t).getTimezoneOffset() * 60000
  const ist = new Date(utcMs + IST_OFFSET_MIN * 60000)
  return `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, '0')}`
}

function usedKeysForQuestion(q: QuizQuestion): string[] {
  const fp = questionFingerprint(q.question)
  return [q.id, fp ? `fp:${fp}` : ''].filter(Boolean)
}

function lastUsedAt(used: Record<string, string>, q: QuizQuestion): string {
  let latest = ''
  let latestMs = 0
  for (const k of usedKeysForQuestion(q)) {
    const v = used[k]
    const ms = v ? Date.parse(v) : 0
    if (ms > latestMs) {
      latestMs = ms
      latest = v
    }
  }
  return latest
}

function isUsedThisMonth(used: Record<string, string>, q: QuizQuestion, month: string): boolean {
  const u = lastUsedAt(used, q)
  return !!u && usedMonthKey(u) === month
}

function isUsedWithinDays(used: Record<string, string>, q: QuizQuestion, days: number): boolean {
  const u = lastUsedAt(used, q)
  if (!u) return false
  return Date.now() - new Date(u).getTime() <= days * 86400000
}

async function maybeRefreshBankCycle(): Promise<void> {
  const data = await redisCommand(['GET', BANK_REFRESH_KEY])
  const last = data?.result ? Date.parse(String(data.result)) : 0
  if (last && Date.now() - last < BANK_REFRESH_DAYS * 86400000) return
  const used = await getUsedMap()
  const cutoff = Date.now() - NO_REPEAT_DAYS * 86400000
  const pruned: Record<string, string> = {}
  for (const [k, v] of Object.entries(used)) {
    if (Date.parse(v) >= cutoff) pruned[k] = v
  }
  await redisCommand(['SET', USED_KEY, JSON.stringify(pruned)])
  await redisCommand(['SET', BANK_REFRESH_KEY, new Date().toISOString()])
}

export async function getBank(): Promise<QuizQuestion[]> {
  let bank: QuizQuestion[] = STARTER_QUIZ_BANK
  const data = await redisCommand(['GET', BANK_KEY])
  if (data?.result && typeof data.result === 'string') {
    try {
      const arr = JSON.parse(data.result)
      if (Array.isArray(arr) && arr.length > 0) bank = arr as QuizQuestion[]
    } catch {
      /* ignore */
    }
  }
  const { active, bench } = splitActiveAndBench(bank)
  const next = await maybeMonthlySwap(active, bench)
  if (JSON.stringify(next.map((q) => q.id)) !== JSON.stringify(bank.map((q) => q.id))) {
    await redisCommand(['SET', BANK_KEY, JSON.stringify(next)])
  }
  await maybeRefreshBankCycle()
  return next
}

/** Gift coupon code published with the current winner (week + 4 digits). */
export function giftCouponCode(week: string): string {
  const compact = String(week || '').replace(/[^0-9A-Za-z]/g, '').toUpperCase() || 'WEEK'
  const n = String(1000 + Math.floor(Math.random() * 9000))
  return `AG-${compact}-${n}`
}

export async function saveBank(bank: QuizQuestion[]): Promise<boolean> {
  const result = await redisCommand(['SET', BANK_KEY, JSON.stringify(bank)])
  return result?.result === 'OK'
}

async function getUsedMap(): Promise<Record<string, string>> {
  const data = await redisCommand(['GET', USED_KEY])
  if (data?.result && typeof data.result === 'string') {
    try {
      return JSON.parse(data.result) as Record<string, string>
    } catch {
      /* ignore */
    }
  }
  return {}
}

export async function getQuestionById(id: string): Promise<QuizQuestion | null> {
  if (id === 'default') return fallbackQuestion()
  const bank = await getBank()
  return bank.find((q) => q.id === id) ?? null
}

/** Pick (and remember) today's question — one per day, no repeat in the same month. */
export async function getTodayQuestion(): Promise<QuizQuestion> {
  const dkey = istDateKey()
  const todayKey = `pulse:quiz:today:${dkey}`

  const existing = await redisCommand(['GET', todayKey])
  const bank = await getBank()
  if (existing?.result && typeof existing.result === 'string') {
    const q = bank.find((b) => b.id === existing.result)
    if (q) return q
    if (existing.result === 'default') return fallbackQuestion()
  }

  if (bank.length === 0) return fallbackQuestion()

  const used = await getUsedMap()
  const month = istMonthKey()
  const unusedThisMonth = bank.filter((b) => !isUsedThisMonth(used, b, month))
  const eligible = unusedThisMonth.filter((b) => !isUsedWithinDays(used, b, NO_REPEAT_DAYS))
  let pick: QuizQuestion
  if (eligible.length > 0) {
    pick = eligible[Math.floor(Math.random() * eligible.length)]
  } else if (unusedThisMonth.length > 0) {
    pick = unusedThisMonth[Math.floor(Math.random() * unusedThisMonth.length)]
  } else {
    pick = [...bank].sort(
      (a, b) => Date.parse(lastUsedAt(used, a) || '0') - Date.parse(lastUsedAt(used, b) || '0'),
    )[0]
  }

  await redisCommand(['SET', todayKey, pick.id, 'EX', 172800])
  const nowIso = new Date().toISOString()
  used[pick.id] = nowIso
  const fp = questionFingerprint(pick.question)
  if (fp) used[`fp:${fp}`] = nowIso
  await redisCommand(['SET', USED_KEY, JSON.stringify(used)])
  return pick
}

/* ---------- weekly prize-draw entries ---------- */

export type QuizDayAttempt = {
  name: string
  mobile: string
  ymd: string
  week: string
  correct: boolean
  ts: string
  guardId?: string
}

function attemptKey(ymd: string): string {
  return `pulse:quiz:day:${ymd}`
}

function mobileKey(mobile: string): string {
  return String(mobile || '').replace(/\D/g, '').slice(0, 15)
}

async function getDayAttempts(ymd: string): Promise<Record<string, QuizDayAttempt>> {
  const data = await redisCommand(['GET', attemptKey(ymd)])
  if (data?.result && typeof data.result === 'string') {
    try {
      const parsed = JSON.parse(data.result) as Record<string, QuizDayAttempt>
      if (parsed && typeof parsed === 'object') return parsed
    } catch {
      /* ignore */
    }
  }
  return {}
}

async function saveDayAttempts(ymd: string, map: Record<string, QuizDayAttempt>): Promise<boolean> {
  const result = await redisCommand(['SET', attemptKey(ymd), JSON.stringify(map), 'EX', 120 * 86400])
  return result?.result === 'OK'
}

export type QuizDayDot = { label: string; ymd: string; state: 'ok' | 'fail' | 'open' }

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export async function weekProgress(mobile: string, week = weekKey()): Promise<{
  daysCorrect: number
  failed: boolean
  qualified: boolean
  board: QuizDayDot[]
}> {
  const key = mobileKey(mobile)
  const days = datesInWeek(week)
  let daysCorrect = 0
  let failed = false
  const board: QuizDayDot[] = []
  for (let i = 0; i < days.length; i++) {
    const ymd = days[i]
    const hit = key ? (await getDayAttempts(ymd))[key] : undefined
    let state: QuizDayDot['state'] = 'open'
    if (hit?.correct) {
      state = 'ok'
      daysCorrect += 1
    } else if (hit) {
      state = 'fail'
      failed = true
    }
    board.push({ label: WEEKDAY_LABELS[i] || ymd.slice(8), ymd, state })
  }
  return { daysCorrect, failed, qualified: !failed && daysCorrect >= 7, board }
}

export async function listWeekPlayers(week: string): Promise<
  Array<{ name: string; mobile: string; daysCorrect: number; failed: boolean; qualified: boolean }>
> {
  const days = datesInWeek(week)
  const byMobile = new Map<string, { name: string; mobile: string; good: Set<string>; fail: boolean }>()
  for (const ymd of days) {
    const map = await getDayAttempts(ymd)
    for (const a of Object.values(map)) {
      const k = mobileKey(a.mobile)
      if (!k) continue
      const cur = byMobile.get(k) || { name: a.name, mobile: k, good: new Set<string>(), fail: false }
      cur.name = a.name || cur.name
      if (a.correct) cur.good.add(ymd)
      else cur.fail = true
      byMobile.set(k, cur)
    }
  }
  return [...byMobile.values()].map((v) => ({
    name: v.name,
    mobile: v.mobile,
    daysCorrect: v.good.size,
    failed: v.fail,
    qualified: !v.fail && v.good.size >= 7,
  }))
}

export async function listQualifiedForWeek(week: string): Promise<QuizDayAttempt[]> {
  const days = datesInWeek(week)
  const byMobile = new Map<string, { row: QuizDayAttempt; good: Set<string>; fail: boolean }>()
  for (const ymd of days) {
    const map = await getDayAttempts(ymd)
    for (const a of Object.values(map)) {
      const k = mobileKey(a.mobile)
      if (!k) continue
      const cur = byMobile.get(k) || { row: a, good: new Set<string>(), fail: false }
      cur.row = a
      if (a.correct) cur.good.add(ymd)
      else cur.fail = true
      byMobile.set(k, cur)
    }
  }
  return [...byMobile.values()]
    .filter((v) => !v.fail && v.good.size >= 7)
    .map((v) => v.row)
}

export async function addEntry(name: string, mobile: string, guardId?: string): Promise<boolean> {
  const gid = guardId ? guardId.replace(/\D/g, '').slice(0, 20) : ''
  const now = istNow()
  const entry: QuizEntry = {
    name: name.slice(0, 80),
    mobile: mobile.replace(/\D/g, '').slice(0, 15),
    date: new Date().toISOString(),
    dateYmd: ymdOf(now),
    ...(gid ? { guardId: gid } : {}),
  }
  const result = await redisCommand(['RPUSH', `pulse:quiz:entries:${weekKey()}`, JSON.stringify(entry)])
  return typeof result?.result === 'number'
}

export async function recordQuizAnswer(opts: {
  name: string
  mobile: string
  key: string
  correctKey: string
  guardId?: string
}): Promise<{
  alreadyAttempted: boolean
  correct: boolean
  entered: boolean
  daysCorrect: number
  qualified: boolean
  failed: boolean
  board: QuizDayDot[]
}> {
  const name = String(opts.name || '').trim().slice(0, 80)
  const mobile = mobileKey(opts.mobile)
  const ymd = istDateKey()
  const week = weekKey()
  const existing = (await getDayAttempts(ymd))[mobile]
  if (existing) {
    const prog = await weekProgress(mobile, week)
    return {
      alreadyAttempted: true,
      correct: existing.correct,
      entered: existing.correct,
      daysCorrect: prog.daysCorrect,
      qualified: prog.qualified,
      failed: prog.failed || !existing.correct,
      board: prog.board,
    }
  }
  const correct = opts.key === opts.correctKey
  const gid = opts.guardId ? opts.guardId.replace(/\D/g, '').slice(0, 20) : ''
  const map = await getDayAttempts(ymd)
  map[mobile] = {
    name,
    mobile,
    ymd,
    week,
    correct,
    ts: new Date().toISOString(),
    ...(gid ? { guardId: gid } : {}),
  }
  await saveDayAttempts(ymd, map)
  let entered = false
  if (correct) entered = await addEntry(name, mobile, gid || undefined)
  const prog = await weekProgress(mobile, week)
  return {
    alreadyAttempted: false,
    correct,
    entered,
    daysCorrect: prog.daysCorrect,
    qualified: prog.qualified,
    failed: prog.failed || !correct,
    board: prog.board,
  }
}

export async function getEntries(week: string): Promise<QuizEntry[]> {
  const data = await redisCommand(['LRANGE', `pulse:quiz:entries:${week}`, 0, -1])
  const arr = Array.isArray(data?.result) ? (data!.result as string[]) : []
  return arr
    .map((s) => {
      try {
        return JSON.parse(s) as QuizEntry
      } catch {
        return null
      }
    })
    .filter((e): e is QuizEntry => e !== null)
}

function recentWeekKeys(count = 26): string[] {
  const keys: string[] = []
  const start = istNow()
  for (let i = 0; i < count; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() - i * 7)
    const key = weekKey(d)
    if (!keys.includes(key)) keys.push(key)
  }
  return keys
}

export async function listEntryWeekKeys(): Promise<string[]> {
  const scanned = await redisCommand(['KEYS', 'pulse:quiz:entries:*'])
  const raw = Array.isArray(scanned?.result) ? (scanned!.result as string[]) : []
  const fromKeys = raw
    .map((k) => String(k).replace(/^pulse:quiz:entries:/, ''))
    .filter((k) => /^20\d{2}-W\d{2}$/.test(k))
  const weeks = [...new Set([...fromKeys, ...recentWeekKeys(26)])]
  weeks.sort()
  return weeks.reverse()
}

export type QuizEntryRow = QuizEntry & { week: string }

export type QuizPersonRow = {
  name: string
  mobile: string
  lastDate: string
  lastDateDmy: string
  lastWeek: string
  answers: number
  sortTs: number
}

function quizDateDmy(iso: string): string {
  const t = Date.parse(String(iso || ''))
  if (Number.isNaN(t)) return '—'
  return new Date(t).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })
}

/** One row per mobile — last answer first. For Recruitment follow-up. */
export function quizPeopleFromEntries(rows: QuizEntryRow[]): QuizPersonRow[] {
  const map = new Map<string, QuizPersonRow>()
  for (const e of rows) {
    const mobile = String(e.mobile || '').replace(/\D/g, '').slice(-10)
    if (mobile.length < 10) continue
    const sortTs = Date.parse(String(e.date || '')) || 0
    const prev = map.get(mobile)
    if (!prev) {
      map.set(mobile, {
        name: String(e.name || '').trim() || '—',
        mobile,
        lastDate: e.date || '',
        lastDateDmy: quizDateDmy(e.date),
        lastWeek: e.week || '',
        answers: 1,
        sortTs,
      })
      continue
    }
    prev.answers += 1
    if (sortTs >= prev.sortTs) {
      prev.name = String(e.name || '').trim() || prev.name
      prev.lastDate = e.date || prev.lastDate
      prev.lastDateDmy = quizDateDmy(e.date || prev.lastDate)
      prev.lastWeek = e.week || prev.lastWeek
      prev.sortTs = sortTs
    }
  }
  return [...map.values()].sort((a, b) => b.sortTs - a.sortTs || b.mobile.localeCompare(a.mobile))
}

export async function listQuizPeopleForRecruitment(): Promise<{
  people: QuizPersonRow[]
  answers: number
}> {
  const rows = await getAllEntries()
  return { people: quizPeopleFromEntries(rows), answers: rows.length }
}

/** Every stored correct entry, newest week first. Admin only. */
export async function getAllEntries(): Promise<QuizEntryRow[]> {
  const weeks = await listEntryWeekKeys()
  const out: QuizEntryRow[] = []
  for (const week of weeks) {
    const rows = await getEntries(week)
    for (const e of rows) out.push({ ...e, week })
  }
  return out
}

/** Admin display only — never send this to the public bulletin. */
export function formatQuizWhatsApp(raw: string): string {
  let d = String(raw || '').replace(/\D/g, '')
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  if (d.length === 10) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`
  return d
}

export function findEntryMobile(
  entries: QuizEntry[],
  winner: { name?: string; mobileLast4?: string },
): string {
  const last4 = String(winner.mobileLast4 || '').replace(/\D/g, '').slice(-4)
  const name = String(winner.name || '')
    .replace(/^(mr|mrs|ms|miss)\.?\s+/i, '')
    .trim()
    .toLowerCase()
  const byLast4 = last4
    ? entries.filter((e) => e.mobile.replace(/\D/g, '').slice(-4) === last4)
    : []
  if (byLast4.length === 1) return byLast4[0].mobile
  const byName = entries.find(
    (e) =>
      e.name
        .replace(/^(mr|mrs|ms|miss)\.?\s+/i, '')
        .trim()
        .toLowerCase() === name,
  )
  if (byName) return byName.mobile
  return byLast4[0]?.mobile || ''
}

/* ---------- winners board ---------- */

/** ISO week number from a key like 2026-W34 → 34 */
export function weekNumberFromKey(week: string): number {
  const m = String(week || '').match(/W(\d+)/i)
  return m ? parseInt(m[1], 10) : 0
}

export function weekNumberLabel(week: string): string {
  return String(weekNumberFromKey(week) || 0).padStart(2, '0')
}

/** Week 34 onwards: two lucky winners (Rs 250 each). */
export function winnersNeededForWeek(week: string): number {
  return weekNumberFromKey(week) >= 34 ? 2 : 1
}

export function weekWinnerHeading(week: string, count = 1): string {
  const n = weekNumberLabel(week)
  return `${count > 1 ? 'Winners' : 'Winner'} for the Week number-${n}`
}

function parseWinnerList(raw: string): QuizWinner[] {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter((w): w is QuizWinner => w && typeof w === 'object' && typeof w.name === 'string')
    }
    if (parsed && typeof parsed === 'object' && typeof parsed.name === 'string') {
      return [parsed as QuizWinner]
    }
  } catch {
    /* ignore */
  }
  return []
}

function isRemovedWinnerName(name: string): boolean {
  return /abdul\s*jameel/i.test(String(name || ''))
}

const FEMALE_FIRST_NAMES = new Set([
  'anita', 'anjali', 'asha', 'ayesha', 'aisha', 'bhavani', 'deepa', 'devi', 'divya',
  'fatima', 'geeta', 'gita', 'harini', 'indira', 'jyoti', 'kalpana', 'kamala', 'kavita',
  'kavya', 'keerthi', 'keerthy', 'kumari', 'lakshmi', 'laxmi', 'lalita', 'lalitha',
  'lata', 'madhavi', 'manju', 'meena', 'neha', 'nisha', 'padma', 'parvati', 'parvathi',
  'pooja', 'priya', 'puja', 'radha', 'rani', 'rekha', 'renuka', 'ritu', 'sangita',
  'sangeeta', 'saraswati', 'saraswathi', 'savita', 'seema', 'shanti', 'shanthi',
  'shweta', 'sita', 'sneha', 'soumya', 'sowmya', 'sumathi', 'sumitra', 'sunita',
  'sushma', 'swati', 'usha', 'vani', 'vanitha', 'vidya', 'yamini', 'anitha', 'begum',
])

/** Winner names on the board always start with Mr. or Mrs. */
export function winnerCourtesyName(raw: string): string {
  const name = String(raw || '').replace(/\s+/g, ' ').trim()
  if (!name || /^no winner/i.test(name)) return name
  const titled = name.match(/^(mr|mrs|ms|miss|shri|sri|smt)\.?\s+(.+)$/i)
  if (titled) {
    const key = titled[1].toLowerCase()
    const prefix = key === 'mrs' || key === 'smt' ? 'Mrs.' : key === 'ms' || key === 'miss' ? 'Mrs.' : 'Mr.'
    return `${prefix} ${titled[2].trim()}`
  }
  const first = name.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '')
  const prefix = FEMALE_FIRST_NAMES.has(first) ? 'Mrs.' : 'Mr.'
  return `${prefix} ${name}`
}

function tidyWinners(list: QuizWinner[]): QuizWinner[] {
  const cleaned = list.filter((w) => w && !w.noWinner && !isRemovedWinnerName(w.name))
  const week = cleaned[0]?.weekKey || list[0]?.weekKey || ''
  const cap = week ? winnersNeededForWeek(week) : 1
  return cleaned.slice(0, cap).map((w) => ({
    ...w,
    name: winnerCourtesyName(w.name),
    couponCode: w.couponCode || giftCouponCode(w.weekKey),
  }))
}

export async function getWinners(): Promise<QuizWinner[]> {
  let raw: QuizWinner[] = []
  const data = await redisCommand(['GET', WINNERS_KEY])
  if (data?.result && typeof data.result === 'string') {
    raw = parseWinnerList(data.result)
  }
  if (!raw.length) {
    const list = await redisCommand(['LRANGE', WINNERS_KEY, 0, 1])
    const arr = Array.isArray(list?.result) ? (list!.result as string[]) : []
    raw = arr
      .map((s) => {
        try {
          return JSON.parse(s) as QuizWinner
        } catch {
          return null
        }
      })
      .filter((w): w is QuizWinner => w !== null)
  }
  const none = raw.find((w) => w.noWinner)
  const tidied = tidyWinners(raw)
  const liveRaw = raw.filter((w) => !w.noWinner)
  const changed =
    tidied.length !== liveRaw.length ||
    tidied.some((w, i) => w.couponCode !== liveRaw[i]?.couponCode || w.name !== liveRaw[i]?.name) ||
    raw.some((w) => isRemovedWinnerName(w.name))
  if (changed && (tidied.length || none)) {
    await replaceWinners(tidied.length ? tidied : none ? [none] : [])
  }
  if (tidied.length) return tidied
  return none ? [none] : []
}

/** Keep only this week's winner(s) — old winner details are removed. */
export async function replaceWinners(winners: QuizWinner[]): Promise<boolean> {
  await redisCommand(['DEL', WINNERS_KEY])
  const result = await redisCommand(['SET', WINNERS_KEY, JSON.stringify(winners.slice(0, 2))])
  return result?.result === 'OK'
}

export async function addWinner(winner: QuizWinner): Promise<boolean> {
  return replaceWinners([winner])
}

export async function winnerPublishedForWeek(week: string): Promise<boolean> {
  const winners = await getWinners()
  return winners.some((w) => w.weekKey === week)
}

type PendingDraw = { candidates: PendingQuizWinner[] }

function parsePending(raw: string): PendingQuizWinner[] {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed?.candidates)) return parsed.candidates as PendingQuizWinner[]
    if (parsed && typeof parsed.name === 'string') return [parsed as PendingQuizWinner]
  } catch {
    /* ignore */
  }
  return []
}

export async function getPendingCandidates(): Promise<PendingQuizWinner[]> {
  const data = await redisCommand(['GET', PENDING_WINNER_KEY])
  if (data?.result && typeof data.result === 'string') return parsePending(data.result)
  return []
}

export async function getPendingWinner(): Promise<PendingQuizWinner | null> {
  const list = await getPendingCandidates()
  return list[0] ?? null
}

export async function setPendingWinner(p: PendingQuizWinner): Promise<boolean> {
  return setPendingCandidates([p])
}

export async function setPendingCandidates(list: PendingQuizWinner[]): Promise<boolean> {
  const payload: PendingDraw = { candidates: list }
  const result = await redisCommand(['SET', PENDING_WINNER_KEY, JSON.stringify(payload), 'EX', 604800])
  return result?.result === 'OK'
}

export async function clearPendingWinner(): Promise<void> {
  await redisCommand(['DEL', PENDING_WINNER_KEY])
}

/** Week to draw on Sunday morning (Mon–Sat entries of the week just ending). */
export function drawTargetWeekKey(): string {
  const d = istNow()
  const dow = d.getUTCDay()
  if (dow === 0) {
    const sat = new Date(d.getTime() - 86400000)
    return weekKey(sat)
  }
  return weekKey(d)
}

/** Pick unique people who finished all 7 days (Sunday–Saturday) with a first-time correct answer. */
export async function pickWinnerCandidates(week: string, count = 1): Promise<PendingQuizWinner[]> {
  const qualified = await listQualifiedForWeek(week)
  if (qualified.length === 0) return []
  const shuffled = [...qualified].sort(() => Math.random() - 0.5)
  const seen = new Set<string>()
  const out: PendingQuizWinner[] = []
  for (const pick of shuffled) {
    const mobile = mobileKey(pick.mobile)
    if (!mobile || seen.has(mobile)) continue
    seen.add(mobile)
    out.push({
      weekKey: week,
      name: pick.name || 'Participant',
      mobile,
      mobileLast4: mobile.slice(-4),
      entryCount: qualified.length,
      ts: Date.now(),
      ...(pick.guardId ? { guardId: pick.guardId } : {}),
    })
    if (out.length >= count) break
  }
  return out
}

export async function pickWinnerCandidate(week: string): Promise<PendingQuizWinner | null> {
  const list = await pickWinnerCandidates(week, 1)
  return list[0] ?? null
}

/** Publish "no winner" for a week (automatic — no Director approval). */
export async function publishNoWinner(week: string): Promise<QuizWinner> {
  const record: QuizWinner = {
    weekKey: week,
    name: 'No winner this week',
    mobileLast4: '',
    date: new Date().toISOString(),
    noWinner: true,
  }
  await addWinner(record)
  return record
}

/** Prepare weekly draw — stores pending winner(s) for Director approval. */
export async function prepareWeeklyDraw(week: string): Promise<
  | { ok: true; pending: PendingQuizWinner; candidates: PendingQuizWinner[] }
  | { ok: false; reason: 'no-entries' | 'already-published' | 'already-pending' }
> {
  if (await winnerPublishedForWeek(week)) return { ok: false, reason: 'already-published' }
  if (await getPendingWinner()) return { ok: false, reason: 'already-pending' }
  const candidates = await pickWinnerCandidates(week, winnersNeededForWeek(week))
  if (!candidates.length) return { ok: false, reason: 'no-entries' }
  await setPendingCandidates(candidates)
  return { ok: true, pending: candidates[0], candidates }
}

function toPublishedWinner(pending: PendingQuizWinner): QuizWinner {
  return {
    weekKey: pending.weekKey,
    name: winnerCourtesyName(pending.name),
    mobileLast4: pending.mobileLast4,
    date: new Date().toISOString(),
    couponCode: giftCouponCode(pending.weekKey),
  }
}

/** Publish pending winner(s) to the bulletin winners board. */
export async function publishPendingWinner(pending: PendingQuizWinner): Promise<QuizWinner> {
  const stored = await getPendingCandidates()
  const list = stored.length ? stored : [pending]
  const winners = list.map(toPublishedWinner)
  await replaceWinners(winners)
  await clearPendingWinner()
  return winners[0]
}

export async function publishPendingWinners(): Promise<QuizWinner[]> {
  const stored = await getPendingCandidates()
  if (!stored.length) return []
  const winners = stored.map(toPublishedWinner)
  await replaceWinners(winners)
  await clearPendingWinner()
  return winners
}

/** Pick this week's winner(s) and publish. Week 34+ = two unique names. */
export async function drawWinners(week: string): Promise<QuizWinner[]> {
  const candidates = await pickWinnerCandidates(week, winnersNeededForWeek(week))
  if (!candidates.length) return []
  const winners = candidates.map(toPublishedWinner)
  await replaceWinners(winners)
  return winners
}

/** Pick a random winner from a given week's correct entries and publish it. */
export async function drawWinner(week: string): Promise<QuizWinner | null> {
  const winners = await drawWinners(week)
  return winners[0] ?? null
}

/* ---------- AI question generation ---------- */

function keyId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

function extractJsonArray(text: string): any[] {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim()
  const start = cleaned.indexOf('[')
  const end = cleaned.lastIndexOf(']')
  if (start === -1 || end === -1) return []
  try {
    const arr = JSON.parse(cleaned.slice(start, end + 1))
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function filterNewQuestions(qs: QuizQuestion[], avoid: string[]): QuizQuestion[] {
  const seen = new Set(avoid.map(questionFingerprint).filter(Boolean))
  return qs.filter((q) => {
    const fp = questionFingerprint(q.question)
    if (!fp || seen.has(fp)) return false
    seen.add(fp)
    return true
  })
}

function toQuestions(raw: any[]): QuizQuestion[] {
  const out: QuizQuestion[] = []
  for (const r of raw) {
    const q = String(r?.question ?? '').trim()
    const opts = Array.isArray(r?.options) ? r.options.map((o: unknown) => String(o ?? '').trim()) : []
    let idx = Number(r?.correctIndex)
    if (!q || opts.length < 2) continue
    if (isNaN(idx) || idx < 0 || idx >= opts.length) idx = 0
    const options = opts.slice(0, 4).map((text: string, i: number) => ({ key: OPTION_KEYS[i], text }))
    out.push({
      id: keyId(),
      type: 'text',
      question: q,
      imageUrl: '',
      options,
      correctKey: OPTION_KEYS[Math.min(idx, options.length - 1)],
      explanation: String(r?.explanation ?? '').trim(),
    })
  }
  return out
}

const AI_PROMPT = (count: number, avoid: string[]) =>
  `Generate ${count} NEW multiple-choice quiz questions to train private security guards in India on security duties AND fire-safety/first-aid awareness. ` +
  `Each question must be unique — different situation, not a rephrase of another. ` +
  `Keep them clear and practical. Each must have exactly 4 options, one correct answer, and a one-sentence explanation. ` +
  (avoid.length
    ? `Do NOT repeat or lightly rephrase any of these existing questions:\n${avoid
        .slice(0, 80)
        .map((q, i) => `${i + 1}. ${q.slice(0, 140)}`)
        .join('\n')}\n`
    : '') +
  `Return ONLY a JSON array, no other text, in this exact form: ` +
  `[{"question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}]`

async function fetchJson(url: string, init: RequestInit, timeoutMs = 25000): Promise<any | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function generateQuestions(
  count: number,
  avoid: string[] = [],
): Promise<{ questions: QuizQuestion[]; error?: string }> {
  const n = Math.max(1, Math.min(20, count || 20))
  const perplexity = process.env.PERPLEXITY_API_KEY?.trim()
  const openai = process.env.OPENAI_API_KEY?.trim()

  if (perplexity) {
    const data = await fetchJson(
      'https://api.perplexity.ai/chat/completions',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${perplexity}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            { role: 'system', content: 'You are a security-training question writer. Reply with JSON only. Never repeat an existing question.' },
            { role: 'user', content: AI_PROMPT(n, avoid) },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      },
      45000,
    )
    const text = data?.choices?.[0]?.message?.content
    if (typeof text === 'string') {
      const qs = toQuestions(extractJsonArray(text))
      if (qs.length > 0) return { questions: filterNewQuestions(qs, avoid) }
    }
  }

  if (openai) {
    const data = await fetchJson(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${openai}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a security-training question writer. Reply with JSON only. Never repeat an existing question.' },
            { role: 'user', content: AI_PROMPT(n, avoid) },
          ],
          temperature: 0.7,
        }),
      },
      45000,
    )
    const text = data?.choices?.[0]?.message?.content
    if (typeof text === 'string') {
      const qs = toQuestions(extractJsonArray(text))
      if (qs.length > 0) return { questions: filterNewQuestions(qs, avoid) }
    }
  }

  if (!perplexity && !openai) {
    return { questions: [], error: 'No AI key set. Add PERPLEXITY_API_KEY (or OPENAI_API_KEY) in Vercel.' }
  }
  return { questions: [], error: 'AI did not return questions. Please try again.' }
}
