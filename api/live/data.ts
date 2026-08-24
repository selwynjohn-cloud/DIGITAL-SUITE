import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import { isMgmtAllBranches } from '../_lib/suite-mgmt-branch-select.js'
import { addDutyAlert, listDutyAlerts } from '../_lib/ops-mobile/duty-alerts.js'
import {
  findGuard,
  findGuardByMobile,
  findGuardByMobileInMis,
  findGuardInMis,
  getDutySessions,
  getOpsGuards,
  maskAadhaar,
  normaliseMobile,
  openDutyForGuard,
  opsNid,
  saveDutySessions,
  saveOpsGuards,
  syncOpsGuardsFromMis,
  type OpsDutySession,
  type OpsGuard,
} from '../_lib/ops-mobile/store.js'
import { liveBranchOptions, liveRoomKey, resolveLiveBranchName } from '../_lib/agile-live/branches.js'
import { liveDutyGeo, matchLiveDutyPost } from '../_lib/agile-live/duty-post.js'
import { earlyDutyHoursMessage, istMonthEnd, istMonthStart, istNow, istYmd, istYmdFromIso, lateDutyHoursMessage, liveDutyWindow } from '../_lib/agile-live/duty-window.js'
import { buildLiveAttendanceReports } from '../_lib/agile-live/attendance-reports.js'
import { liveWageSlip } from '../_lib/agile-live/wage-slip.js'
import { liveWeatherReport } from '../_lib/agile-live/weather.js'
import { buildLiveMonthCalendar } from '../_lib/agile-live/month-calendar.js'
import { LIVE_WEEKDAYS, liveMonthOffDates, livePersonWeek } from '../_lib/agile-live/weekly-roster.js'
import { notifyLiveDutyContinuation } from '../_lib/agile-live/duty-continue.js'
import { sendLiveDutyExceptionMail } from '../_lib/agile-live/exception-mail.js'
import { storeLiveChatFile } from '../_lib/agile-live/media.js'
import { LIVE_CHAT_BLOCKED, LIVE_CHAT_RULE, LIVE_CHAT_RULE_MGMT, moderateLiveChat } from '../_lib/agile-live/moderation.js'
import {
  addBlockedAttempt,
  addLiveReminder,
  addLiveStatus,
  appendLiveChat,
  deleteLiveChat,
  filterLiveChatForGuard,
  findLiveExtraMobile,
  findLiveSiteNote,
  getLiveIdCard,
  isLiveMuted,
  listLiveExtraMobiles,
  issueLiveGuardToken,
  listBlockedAttempts,
  listLiveChat,
  listLiveMutes,
  listLiveReminders,
  listLiveSoftSkills,
  listLiveStatus,
  listLiveStatusBetween,
  listLiveVacantAllots,
  liveChatRateOk,
  mapLiveUnitWeekOffs,
  muteLiveSender,
  offWeekdayFromMap,
  replyLiveReminder,
  readLiveGuardToken,
  saveLiveIdCard,
  saveLiveSiteNote,
  saveLiveSoftSkill,
  saveLiveUnitWeekOff,
  saveLiveVacantAllot,
  unmuteLiveSender,
  upsertLiveExtraMobile,
} from '../_lib/agile-live/store.js'
import { getBranches, getClients, getUsers, type MisClient } from '../_lib/mis/store.js'
import {
  LIVE_APP_ID,
  LIVE_BREAK_REASONS,
  LIVE_DUTY_REPLIES,
  LIVE_SOFT_DEFAULTS,
  LIVE_DEMO_ID,
  LIVE_DEMO_MOBILE,
  LIVE_LEAVE_POST_MSG,
  REPORT_EARLY_MIN,
  type LiveReminderKind,
  type LiveStatusKind,
} from '../_lib/agile-live/types.js'

export const maxDuration = 60

function liveDemoGuard(): OpsGuard {
  const now = new Date().toISOString()
  return {
    id: 'live-demo-1',
    branch: 'Hyderabad-A',
    clientSite: 'Agile Live Demo',
    idNo: LIVE_DEMO_ID,
    name: 'Demo',
    mobile: LIVE_DEMO_MOBILE,
    aadhaar: '',
    doj: '',
    idCardRenewal: '2027-03-31',
    designation: 'Security Staff',
    shift: '08:00-20:00',
    active: true,
    createdAt: now,
    updatedAt: now,
  }
}

function isLiveDemo(idNo: string, mobile: string): boolean {
  return String(idNo || '').trim().toUpperCase() === LIVE_DEMO_ID && normaliseMobile(mobile) === LIVE_DEMO_MOBILE
}

async function resolveGuard(idNo: string, mobile: string): Promise<OpsGuard | null> {
  if (isLiveDemo(idNo, mobile)) return liveDemoGuard()
  let guards = await getOpsGuards()
  if (!guards.length) {
    await syncOpsGuardsFromMis({ branchFilter: '*' })
    guards = await getOpsGuards()
  }
  let g = findGuard(guards, idNo, mobile)
  if (g) return applyLiveIdCard(g)
  g = await findGuardInMis(idNo, mobile)
  if (!g) return null
  const key = `${g.idNo.toLowerCase()}|${normaliseMobile(g.mobile)}`
  const byKey = new Map(guards.map((x) => [`${x.idNo.toLowerCase()}|${normaliseMobile(x.mobile)}`, x]))
  byKey.set(key, g)
  await saveOpsGuards([...byKey.values()])
  return applyLiveIdCard(g)
}

async function resolveGuardByMobile(mobile: string): Promise<OpsGuard | null> {
  const mob = normaliseMobile(mobile)
  if (mob.length !== 10) return null
  if (mob === LIVE_DEMO_MOBILE) return liveDemoGuard()
  let guards = await getOpsGuards()
  if (!guards.length) {
    await syncOpsGuardsFromMis({ branchFilter: '*' })
    guards = await getOpsGuards()
  }
  let g = findGuardByMobile(guards, mob)
  if (g) return applyLiveIdCard(g)
  g = await findGuardByMobileInMis(mob)
  if (!g) return null
  const key = `${g.idNo.toLowerCase()}|${normaliseMobile(g.mobile)}`
  const byKey = new Map(guards.map((x) => [`${x.idNo.toLowerCase()}|${normaliseMobile(x.mobile)}`, x]))
  byKey.set(key, g)
  await saveOpsGuards([...byKey.values()])
  return applyLiveIdCard(g)
}

function staffChatRule(role: string): string {
  return role === 'management' ? LIVE_CHAT_RULE_MGMT : LIVE_CHAT_RULE
}

function livePersonName(email: string): string {
  const em = String(email || '').trim().toLowerCase()
  if (em === 'director@agilegroup.co.in') return 'Selwyn John'
  const local = em.split('@')[0] || em
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || 'Staff'
}

type LiveRecipient = {
  mobile: string
  name: string
  kind: 'guard' | 'staff' | 'saved' | 'open'
  idNo?: string
  branch?: string
  clientSite?: string
}

async function resolveRecipient(mobile: string): Promise<LiveRecipient | { error: string }> {
  const mob = normaliseMobile(mobile)
  if (mob.length !== 10) return { error: 'Enter a 10-digit mobile.' }
  const extra = await findLiveExtraMobile(mob)
  if (extra) {
    return { mobile: extra.mobile, name: extra.name, kind: 'saved' }
  }
  const g = await resolveGuardByMobile(mob)
  if (g) {
    return {
      mobile: normaliseMobile(g.mobile),
      name: g.name,
      kind: 'guard',
      idNo: g.idNo,
      branch: g.branch,
      clientSite: g.clientSite,
    }
  }
  const users = await getUsers()
  const staffHit = users.find((u) => u.active !== false && normaliseMobile(u.phone || '') === mob)
  if (staffHit) {
    return {
      mobile: mob,
      name: staffHit.name || staffHit.email || 'Staff',
      kind: 'staff',
    }
  }
  return { mobile: mob, name: '', kind: 'open' }
}

async function loadLiveClients(branchName?: string): Promise<MisClient[]> {
  const branches = await getBranches(true)
  const want = String(branchName || '').trim()
  const targets = want
    ? branches.filter(
        (b) => liveRoomKey(b.name) === liveRoomKey(want) || b.id === want || b.name === want,
      )
    : branches.filter((b) => b.active !== false)
  const packs = await Promise.all(targets.map((b) => getClients(b.id, { skipRepair: true, branches })))
  return packs.flat()
}

function dutyView(
  g: OpsGuard,
  open: OpsDutySession | null,
  clients: MisClient[],
  hereLat?: number | null,
  hereLng?: number | null,
  offWeekday = 0,
) {
  const post = matchLiveDutyPost({
    clientSite: g.clientSite,
    branch: g.branch,
    clients,
    startLat: open?.startLat ?? null,
    startLng: open?.startLng ?? null,
  })
  let at = istNow()
  if (open?.startedAt) {
    const started = new Date(open.startedAt)
    if (!Number.isNaN(started.getTime())) {
      at = new Date(started.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    }
  }
  const week = livePersonWeek({
    idNo: g.idNo,
    clientSite: [post.clientName, post.location].filter(Boolean).join(' — ') || g.clientSite,
    designation: g.designation,
    shiftRaw: g.shift,
    at,
    offWeekday,
  })
  const win = liveDutyWindow(week.dutyStart, at)
  const here = {
    lat: hereLat ?? open?.startLat ?? null,
    lng: hereLng ?? open?.startLng ?? null,
  }
  const geo = liveDutyGeo({
    postLat: post.postLat,
    postLng: post.postLng,
    hereLat: here.lat,
    hereLng: here.lng,
  })
  const lateStart = !week.todayOff && (win.isLateForReport || win.isLateForDuty)
  const lateMinutes = win.isLateForDuty ? win.minutesAfterDuty : win.isLateForReport ? win.minutesAfterReport : 0
  const lateMessage = lateStart ? lateDutyHoursMessage(lateMinutes) : ''
  const nowMins = at.getHours() * 60 + at.getMinutes()
  const hdfcNightBlocked = Boolean(week.hdfc2fa && (nowMins >= 23 * 60 || nowMins < 6 * 60))
  return {
    today: istYmd(),
    name: g.name,
    idNo: g.idNo,
    mobile: g.mobile,
    branch: g.branch,
    clientSite: g.clientSite,
    clientName: post.clientName,
    location: post.location,
    designation: g.designation,
    shift: g.shift,
    shiftCode: week.shiftCode,
    todayShift: week.todayShift,
    tomorrowShift: week.tomorrowShift,
    shiftLabel: week.todayOff ? 'Weekly off' : week.shiftLabel,
    shiftHours: week.hours,
    rank: week.rank,
    week,
    reportBy: win.reportByLabel,
    dutyStart: win.dutyStartLabel,
    dutyEnd: week.dutyEnd,
    todayTime: week.todayTime,
    tomorrowTime: week.tomorrowTime,
    hdfc2fa: Boolean(week.hdfc2fa),
    hdfcNightBlocked,
    minutesBeforeReport: win.minutesAfterReport < 0 ? -win.minutesAfterReport : 0,
    doj: g.doj || '',
    aadhaar: maskAadhaar(g.aadhaar),
    idCardIso: isoIdCard(g.idCardRenewal),
    idCardValidity: formatIdCard(g.idCardRenewal),
    idCardMissing: !isoIdCard(g.idCardRenewal),
    earlyMinutes: REPORT_EARLY_MIN,
    onDuty: Boolean(open),
    startedAt: open?.startedAt || '',
    isLateForReport: !open && win.isLateForReport,
    lateStart,
    lateMinutes,
    lateMessage,
    leaveMessage: geo.outOfPost ? LIVE_LEAVE_POST_MSG : '',
    outOfPost: geo.outOfPost,
    metres: geo.metres,
    mapUrl: geo.mapUrl,
    postLat: post.postLat,
    postLng: post.postLng,
    hereLat: here.lat,
    hereLng: here.lng,
    fenceM: geo.fenceM,
    postSource: post.postSource,
  }
}

function publicDuty(
  g: OpsGuard,
  open: OpsDutySession | null,
  clients: MisClient[],
  hereLat?: number | null,
  hereLng?: number | null,
  offWeekday = 0,
) {
  return dutyView(g, open, clients, hereLat, hereLng, offWeekday)
}

function breakReasonOk(raw: string): string {
  const s = String(raw || '').trim()
  return (LIVE_BREAK_REASONS as readonly string[]).includes(s) ? s : ''
}

function reminderKindOk(raw: string): LiveReminderKind | '' {
  const s = String(raw || '').trim()
  return s === 'duty' || s === 'training' || s === 'vacant_post' ? s : ''
}

function reminderText(kind: LiveReminderKind, site: string, custom: string): string {
  const t = String(custom || '').replace(/\s+/g, ' ').trim()
  if (t) return t.slice(0, 240)
  if (kind === 'training') return 'Training (OJT) reminder. Please attend as informed.'
  if (kind === 'vacant_post') return `Vacant Post duty allotted — ${site}.`
  return 'Duty reminder. Reply from the list. Your Wage Slip is here.'
}

async function phoneInbox(g: OpsGuard, off: number, sessions: OpsDutySession[]) {
  const today = istYmd()
  const from = istMonthStart()
  const monthEnd = istMonthEnd()
  const mob = normaliseMobile(g.mobile)
  const [reminders, vacantAll] = await Promise.all([listLiveReminders(), listLiveVacantAllots()])
  const open = reminders.filter((r) => normaliseMobile(r.mobile) === mob && !r.reply)
  const vacant = vacantAll.find((v) => normaliseMobile(v.mobile) === mob && v.date === today) || null
  const dutyDays = new Set(
    sessions
      .filter((s) => s.guardId === g.id)
      .map((s) => istYmdFromIso(s.startedAt))
      .filter((ymd) => ymd && ymd >= from && ymd <= today),
  ).size
  const wantWage = open.some((r) => r.showWageSlip || r.kind === 'duty')
  const [siteNote, skills] = await Promise.all([findLiveSiteNote(g.branch, g.clientSite), listLiveSoftSkills()])
  return {
    monthOffs: liveMonthOffDates(off, from, monthEnd),
    vacant,
    reminders: open,
    wageSlip: wantWage ? await liveWageSlip({ person: g, month: from, dutyDays }) : null,
    replyOptions: LIVE_DUTY_REPLIES,
    calendar: buildLiveMonthCalendar({
      monthStart: from,
      monthEnd,
      today,
      offWeekday: off,
      sessions: sessions.filter((s) => s.guardId === g.id),
    }),
    siteNote,
    softSkills: softSkillPack(skills),
  }
}

function softSkillPack(extra: Awaited<ReturnType<typeof listLiveSoftSkills>>) {
  return [
    ...LIVE_SOFT_DEFAULTS.map((d, i) => ({ id: `def-${i}`, title: d.title, text: d.text, by: '', at: '' })),
    ...extra,
  ]
}

async function liveCallBook(room: string) {
  const [branches, users, extras] = await Promise.all([getBranches(true), getUsers(), listLiveExtraMobiles()])
  const rows: { name: string; mobile: string; role: string }[] = []
  const seen = new Set<string>()
  function add(name: string, mobile: string, role: string) {
    const mob = normaliseMobile(mobile)
    if (mob.length !== 10 || seen.has(mob)) return
    seen.add(mob)
    rows.push({ name: name || mob, mobile: mob, role })
  }
  for (const u of users) {
    if (u.active === false) continue
    const b = branches.find((x) => x.id === u.branchId)
    if (!b || !sameRoom(b.name, room)) continue
    add(u.name || u.email, u.phone, /manag/i.test(u.role) ? 'Management' : 'Staff')
  }
  for (const e of extras) add(e.name, e.mobile, 'Staff')
  return rows
}

async function findRoomPerson(room: string, mobile: string): Promise<OpsGuard | { error: string }> {
  const mob = normaliseMobile(mobile)
  if (mob.length !== 10) return { error: 'Pick the person.' }
  if (!(await getOpsGuards()).length) await syncOpsGuardsFromMis({ branchFilter: '*' })
  const person = (await getOpsGuards()).find(
    (x) => x.active !== false && sameRoom(x.branch, room) && normaliseMobile(x.mobile) === mob,
  )
  if (!person) return { error: 'This mobile is not on this branch list.' }
  return person
}

async function flagDutyException(opts: {
  today: string
  kind: 'late_start' | 'out_of_post' | 'break_duty' | 'early_end' | 'duty_continue'
  g: OpsGuard
  remark: string
  detail: string
  severity: 'mild' | 'medium' | 'severe'
  clientName: string
  location: string
  shiftLabel?: string
  metres?: number | null
  mapUrl?: string
}) {
  const already =
    opts.kind === 'break_duty' || opts.kind === 'early_end'
      ? false
      : (await listLiveStatus(opts.today)).some((s) => s.guardId === opts.g.id && s.kind === opts.kind)
  await addLiveStatus({
    date: opts.today,
    kind: opts.kind,
    guardId: opts.g.id,
    idNo: opts.g.idNo,
    name: opts.g.name,
    mobile: opts.g.mobile,
    branch: opts.g.branch,
    clientSite: opts.g.clientSite,
    remark: opts.remark,
  })
  await addDutyAlert({
    date: opts.today,
    type: opts.kind,
    severity: opts.severity,
    guardId: opts.g.id,
    idNo: opts.g.idNo,
    name: opts.g.name,
    mobile: opts.g.mobile,
    branch: opts.g.branch,
    clientSite: opts.g.clientSite,
    detail: opts.detail,
  })
  if (already) return
  void sendLiveDutyExceptionMail({
    kind: opts.kind,
    name: opts.g.name,
    idNo: opts.g.idNo,
    branch: opts.g.branch,
    clientName: opts.clientName,
    location: opts.location,
    shiftLabel: opts.shiftLabel,
    metres: opts.metres,
    mapUrl: opts.mapUrl,
    detail: opts.detail,
  }).catch(() => {})
}

function monthDutyRows(opts: {
  sessions: OpsDutySession[]
  statuses: Awaited<ReturnType<typeof listLiveStatusBetween>>
  from: string
  to: string
  clients: MisClient[]
  guardId?: string
  room?: string
}) {
  const sess = opts.sessions.filter((s) => {
    const ymd = istYmdFromIso(s.startedAt)
    if (!ymd || ymd < opts.from || ymd > opts.to) return false
    if (opts.guardId && s.guardId !== opts.guardId) return false
    if (opts.room && opts.room !== 'ALL' && !sameRoom(s.branch, opts.room)) return false
    return true
  })
  const rows = sess.map((s) => {
    const ymd = istYmdFromIso(s.startedAt)
    const flags = opts.statuses.filter((st) => st.guardId === s.guardId && st.date === ymd)
    const post = matchLiveDutyPost({
      clientSite: s.clientSite,
      branch: s.branch,
      clients: opts.clients,
      startLat: s.startLat,
      startLng: s.startLng,
    })
    const geo = liveDutyGeo({
      postLat: post.postLat,
      postLng: post.postLng,
      hereLat: s.startLat,
      hereLng: s.startLng,
    })
    let at = istNow()
    const started = new Date(s.startedAt)
    if (!Number.isNaN(started.getTime())) {
      at = new Date(started.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    }
    const week = livePersonWeek({
      idNo: s.idNo,
      clientSite: [post.clientName, post.location].filter(Boolean).join(' — ') || s.clientSite,
      shiftRaw: '',
      at,
    })
    return {
      date: ymd,
      startedAt: s.startedAt,
      endedAt: s.endedAt || '',
      name: s.name,
      idNo: s.idNo,
      mobile: s.mobile,
      branch: s.branch,
      clientSite: s.clientSite,
      clientName: post.clientName,
      location: post.location,
      shiftLabel: week.shiftLabel,
      lateStart: flags.some((f) => f.kind === 'late_start' || f.kind === 'late'),
      outOfPost: flags.some((f) => f.kind === 'out_of_post') || geo.outOfPost,
      metres: geo.metres,
      mapUrl: geo.mapUrl,
    }
  })
  const seen = new Set(rows.map((r) => `${r.idNo}|${r.date}`))
  for (const st of opts.statuses) {
    if (st.kind !== 'late_start' && st.kind !== 'late' && st.kind !== 'out_of_post') continue
    if (opts.guardId && st.guardId !== opts.guardId) continue
    if (opts.room && opts.room !== 'ALL' && !sameRoom(st.branch, opts.room)) continue
    const key = `${st.idNo}|${st.date}`
    if (seen.has(key)) continue
    seen.add(key)
    const post = matchLiveDutyPost({ clientSite: st.clientSite, branch: st.branch, clients: opts.clients })
    const stAt = new Date(st.at)
    const week = livePersonWeek({
      idNo: st.idNo,
      clientSite: [post.clientName, post.location].filter(Boolean).join(' — ') || st.clientSite,
      shiftRaw: '',
      at: Number.isNaN(stAt.getTime())
        ? istNow()
        : new Date(stAt.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })),
    })
    rows.push({
      date: st.date,
      startedAt: st.at,
      endedAt: '',
      name: st.name,
      idNo: st.idNo,
      mobile: st.mobile,
      branch: st.branch,
      clientSite: st.clientSite,
      clientName: post.clientName,
      location: post.location,
      shiftLabel: week.shiftLabel,
      lateStart: st.kind === 'late_start' || st.kind === 'late',
      outOfPost: st.kind === 'out_of_post',
      metres: null,
      mapUrl: '',
    })
  }
  return rows.sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.startedAt).localeCompare(String(a.startedAt)))
}

function sameRoom(branchName: string, roomKey: string): boolean {
  return liveRoomKey(branchName) === roomKey
}

async function staffSession(body: Record<string, unknown>, req: VercelRequest) {
  const token = String(body.sessionToken ?? req.query.sessionToken ?? '').trim()
  return verifyAppSession(token, LIVE_APP_ID)
}

async function guardFromBody(body: Record<string, unknown>): Promise<OpsGuard | { error: string }> {
  const token = String(body.guardToken ?? '').trim()
  if (token) {
    const sess = await readLiveGuardToken(token)
    if (!sess) return { error: 'Session expired. Enter ID No. and mobile again.' }
    const g = await resolveGuard(sess.idNo, sess.mobile)
    if (!g) return { error: 'ID No. not found.' }
    return g
  }
  const g = await resolveGuard(String(body.idNo ?? ''), String(body.mobile ?? ''))
  if (!g) return { error: 'ID No. not found. Check ID No. and Mobile.' }
  return g
}

function numOrNull(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function photoOk(raw: unknown): boolean {
  const s = String(raw ?? '')
  return s.startsWith('data:image/') && s.length > 40 && s.length < 180_000
}

function isoIdCard(raw: string): string {
  const s = String(raw || '').trim()
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const dmy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(s)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  return ''
}

function formatIdCard(raw: string): string {
  const iso = isoIdCard(raw)
  if (iso) return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
  const s = String(raw || '').trim()
  return s || 'Not on file'
}

async function applyLiveIdCard(g: OpsGuard): Promise<OpsGuard> {
  if (isoIdCard(g.idCardRenewal)) return g
  const overlay = await getLiveIdCard(g.id)
  return overlay ? { ...g, idCardRenewal: overlay } : g
}

function relieverOk(body: Record<string, unknown>): boolean {
  const v = body.reliever ?? body.relieverOk
  if (v === true || v === 1 || v === '1' || String(v || '').toLowerCase() === 'yes') return true
  return !!liveDutyAction(body, 'out')
}

function liveDutyAction(body: Record<string, unknown>, kind: 'in' | 'out'): string {
  const raw = String(body.dutyAction ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (kind === 'in') {
    if (raw === 'start_both' || (raw.includes('patrolling') && raw.includes('taken'))) {
      return 'Patrolling completed · Taken over'
    }
    return ''
  }
  if (raw === 'end_both' || (raw.includes('reliever') && raw.includes('handed'))) {
    return 'Reliever Reported · Handed over'
  }
  return ''
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>
  const action = String(body.action ?? '').trim()

  try {
    if (action === 'guardLookup') {
      const g = await resolveGuard(String(body.idNo ?? ''), String(body.mobile ?? ''))
      if (!g) return res.status(404).json({ error: 'ID No. not found. Check ID No. and Mobile.' })
      const sessions = await getDutySessions()
      const open = openDutyForGuard(sessions, g.id)
      const clients = await loadLiveClients(g.branch)
      const woMap = await mapLiveUnitWeekOffs()
      const off = offWeekdayFromMap(woMap, g.branch, g.clientSite)
      const guardToken = await issueLiveGuardToken({
        guardId: g.id,
        idNo: g.idNo,
        name: g.name,
        mobile: g.mobile,
        branch: g.branch,
        clientSite: g.clientSite,
        shift: g.shift,
        designation: g.designation,
      })
      return res.status(200).json({
        ok: true,
        guardToken,
        duty: publicDuty(g, open, clients, null, null, off),
        roomKey: liveRoomKey(g.branch),
        chatRule: LIVE_CHAT_RULE,
        ...(await phoneInbox(g, off, sessions)),
      })
    }

    const guardTok = String(body.guardToken ?? '').trim()
    const guardOnly =
      action === 'guardHome' ||
      action === 'punch' ||
      action === 'duty' ||
      action === 'status' ||
      action === 'dutyMonth' ||
      action === 'dutyWatch' ||
      action === 'remindReply' ||
      action === 'weather' ||
      action === 'callBook' ||
      action === 'siteNote' ||
      action === 'softSkills' ||
      action === 'saveIdCard' ||
      action === 'staffAlarm'
    const sharedChat = action === 'chatList' || action === 'chatSend'
    if (guardOnly || (sharedChat && guardTok)) {
      const g = await guardFromBody(body)
      if ('error' in g) return res.status(401).json({ error: g.error })
      const roomKey = liveRoomKey(g.branch)
      const sessions = await getDutySessions()
      const open = openDutyForGuard(sessions, g.id)
      const today = istYmd()
      const clients = action === 'chatList' ? [] : await loadLiveClients(g.branch)
      const woMap = await mapLiveUnitWeekOffs()
      const off = offWeekdayFromMap(woMap, g.branch, g.clientSite)

      if (action === 'guardHome') {
        const mine = (await listLiveStatus(today)).filter((s) => s.guardId === g.id)
        return res.status(200).json({
          ok: true,
          duty: publicDuty(g, open, clients, null, null, off),
          roomKey,
          chatRule: LIVE_CHAT_RULE,
          myStatus: mine[0] || null,
          ...(await phoneInbox(g, off, sessions)),
        })
      }

      if (action === 'dutyWatch') {
        if (!open) return res.status(400).json({ error: 'Start Duty first.' })
        const lat = numOrNull(body.lat)
        const lng = numOrNull(body.lng)
        const view = publicDuty(g, open, clients, lat, lng, off)
        if (view.outOfPost) {
          await flagDutyException({
            today,
            kind: 'out_of_post',
            g,
            remark: `${LIVE_LEAVE_POST_MSG} — ${view.metres} m`,
            detail: `${LIVE_LEAVE_POST_MSG} ${view.metres} metres from duty post.`,
            severity: (view.metres || 0) >= 250 ? 'severe' : 'medium',
            clientName: view.clientName,
            location: view.location,
            shiftLabel: view.shiftLabel,
            metres: view.metres,
            mapUrl: view.mapUrl,
          })
        }
        if (open) {
          void notifyLiveDutyContinuation({
            session: open,
            person: g,
            clientName: view.clientName,
            location: view.location,
            shiftLabel: view.shiftLabel,
          }).catch(() => {})
        }
        return res.status(200).json({
          ok: true,
          duty: view,
          alarm: view.outOfPost,
          message: view.outOfPost ? LIVE_LEAVE_POST_MSG : '',
        })
      }

      if (action === 'dutyMonth') {
        const from = istMonthStart()
        const to = today
        const statuses = await listLiveStatusBetween(from, to)
        return res.status(200).json({
          ok: true,
          from,
          to,
          rows: monthDutyRows({
            sessions,
            statuses,
            from,
            to,
            clients,
            guardId: g.id,
          }),
          calendar: buildLiveMonthCalendar({
            monthStart: from,
            monthEnd: istMonthEnd(),
            today,
            offWeekday: off,
            sessions: sessions.filter((s) => s.guardId === g.id),
          }),
        })
      }

      if (action === 'weather') {
        const view = publicDuty(g, open, clients, numOrNull(body.lat), numOrNull(body.lng), off)
        const wx = await liveWeatherReport({
          branch: g.branch,
          lat: view.postLat ?? view.hereLat,
          lng: view.postLng ?? view.hereLng,
        })
        if (!wx.ok) return res.status(200).json({ ok: true, error: wx.error })
        return res.status(200).json({ ok: true, weather: wx })
      }

      if (action === 'callBook') {
        return res.status(200).json({ ok: true, calls: await liveCallBook(roomKey) })
      }

      if (action === 'siteNote') {
        const note = await findLiveSiteNote(g.branch, g.clientSite)
        return res.status(200).json({ ok: true, siteNote: note, site: g.clientSite })
      }

      if (action === 'softSkills') {
        return res.status(200).json({ ok: true, softSkills: softSkillPack(await listLiveSoftSkills()) })
      }

      if (action === 'saveIdCard') {
        const saved = await saveLiveIdCard(g.id, String(body.idCard ?? body.idCardValidity ?? ''))
        if (typeof saved !== 'string') return res.status(400).json({ error: saved.error })
        const next = { ...g, idCardRenewal: saved }
        return res.status(200).json({
          ok: true,
          message: 'ID card validity saved.',
          duty: publicDuty(next, open, clients, null, null, off),
        })
      }

      if (action === 'staffAlarm') {
        const raw = String(body.level ?? '').toLowerCase()
        const level = raw === 'high' ? 'High' : raw === 'medium' ? 'Medium' : raw === 'low' ? 'Low' : ''
        if (!level) return res.status(400).json({ error: 'Pick Low, Medium, or High.' })
        const lat = numOrNull(body.lat)
        const lng = numOrNull(body.lng)
        const view = publicDuty(g, open, clients, lat, lng, off)
        const siteLine = [view.clientName, view.location, view.shiftLabel].filter(Boolean).join(' · ')
        await addLiveStatus({
          date: today,
          kind: 'staff_alarm',
          guardId: g.id,
          idNo: g.idNo,
          name: g.name,
          mobile: g.mobile,
          branch: g.branch,
          clientSite: g.clientSite,
          remark: `Alarm — ${level}`,
        })
        void sendLiveDutyExceptionMail({
          kind: 'staff_alarm',
          name: g.name,
          idNo: g.idNo,
          branch: g.branch,
          clientName: view.clientName,
          location: view.location,
          shiftLabel: view.shiftLabel,
          metres: view.metres,
          mapUrl: view.mapUrl,
          detail: `Alarm — ${level}. ${siteLine || g.clientSite || g.branch}. Control, OM, HOD and Director are informed.`,
        }).catch(() => {})
        return res.status(200).json({
          ok: true,
          message: `Alarm sent — ${level}. Control, OM, HOD and Director have been informed.`,
          duty: view,
        })
      }

      if (action === 'punch' || action === 'duty') {
        const kind = String(body.kind ?? '') === 'out' || String(body.kind ?? '') === 'end' ? 'out' : 'in'
        if (!photoOk(body.photo)) {
          return res.status(400).json({ error: 'Take a selfie to Start Duty / End Duty.' })
        }
        const lat = numOrNull(body.lat)
        const lng = numOrNull(body.lng)
        if (lat == null || lng == null) {
          return res.status(400).json({ error: 'Turn on location to start duty.' })
        }
        const nowIso = new Date().toISOString()
        const dutyAct = liveDutyAction(body, kind)
        if (!dutyAct) {
          return res.status(400).json({
            error:
              kind === 'in'
                ? 'Tick both Patrolling completed and Taken over.'
                : 'Tick both Reliever Reported and Handed over.',
          })
        }
        if (kind === 'in') {
          if (open) return res.status(400).json({ error: 'Already on duty. End Duty first.' })
          const check = publicDuty(g, null, clients, lat, lng, off)
          const vacantToday = (await listLiveVacantAllots()).some(
            (v) => v.date === today && normaliseMobile(v.mobile) === normaliseMobile(g.mobile),
          )
          if (check.week?.todayOff && !vacantToday) {
            return res.status(400).json({ error: 'Today is Off Duty. Start Duty is only on a scheduled duty day (or a Vacant Post allotment).', duty: check })
          }
          if (check.hdfcNightBlocked) {
            return res.status(400).json({
              error: 'HDFC 2FA has no night Facility Attendant duty (7:00 AM–3:00 PM and 3:00 PM–11:00 PM only).',
              duty: check,
            })
          }
          if (!vacantToday && check.minutesBeforeReport > 90) {
            return res.status(400).json({
              error: `This is not your scheduled duty time. Today: ${check.todayTime || check.shiftLabel}. Report 30 minutes early.`,
              duty: check,
            })
          }
          if (check.postSource === 'client' && check.outOfPost) {
            return res.status(400).json({
              error: `Your location is not at the assigned duty post (${check.metres} metres away). Stand at the site and try Start Duty again.`,
              duty: check,
            })
          }
          const siteLine = [check.clientName, check.location, check.shiftLabel].filter(Boolean).join(' · ')
          const row: OpsDutySession = {
            id: opsNid('duty'),
            guardId: g.id,
            idNo: g.idNo,
            name: g.name,
            mobile: g.mobile,
            branch: g.branch,
            clientSite: g.clientSite,
            shiftHours: check.shiftHours === 8 ? 8 : 12,
            startedAt: nowIso,
            endedAt: '',
            startLat: lat,
            startLng: lng,
            endLat: null,
            endLng: null,
            status: 'on_duty',
            startPhotoAt: nowIso,
            startAction: dutyAct,
          }
          sessions.unshift(row)
          const saved = await saveDutySessions(sessions.slice(0, 5000))
          if (!saved) return res.status(503).json({ error: 'Could not save Start Duty. Try again.' })
          const view = publicDuty(g, row, clients, lat, lng, off)
          if (view.lateStart) {
            await flagDutyException({
              today,
              kind: 'late_start',
              g,
              remark: view.lateMessage || `Late Start — report by ${view.reportBy}`,
              detail: `${view.lateMessage || 'Late Start'} — ${siteLine}.`,
              severity: view.lateMinutes > 45 ? 'severe' : 'medium',
              clientName: view.clientName,
              location: view.location,
              shiftLabel: view.shiftLabel,
              metres: view.metres,
              mapUrl: view.mapUrl,
            })
          }
          if (view.outOfPost) {
            await flagDutyException({
              today,
              kind: 'out_of_post',
              g,
              remark: `${LIVE_LEAVE_POST_MSG} — ${view.metres} m`,
              detail: `${LIVE_LEAVE_POST_MSG} ${view.metres} metres from duty post. ${siteLine}.`,
              severity: (view.metres || 0) >= 250 ? 'severe' : 'medium',
              clientName: view.clientName,
              location: view.location,
              shiftLabel: view.shiftLabel,
              metres: view.metres,
              mapUrl: view.mapUrl,
            })
          }
          const onDutyLine = `On duty at ${view.clientName}${view.location ? `, ${view.location}` : ''} — ${view.shiftLabel}. Work360 stays the official attendance book.`
          return res.status(200).json({
            ok: true,
            message: view.lateMessage
              ? `${view.lateMessage} ${view.clientName} · ${view.location} · ${view.shiftLabel}.`
              : view.outOfPost
                ? LIVE_LEAVE_POST_MSG
                : onDutyLine,
            alarm: view.outOfPost,
            duty: view,
          })
        }
        if (!open) return res.status(400).json({ error: 'No open duty. Start Duty first.' })
        if (!relieverOk(body)) {
          return res.status(400).json({ error: 'Tick both Reliever Reported and Handed over before End Duty.' })
        }
        open.status = 'ended'
        open.relieverOk = true
        open.endAction = dutyAct
        open.endedAt = nowIso
        open.endLat = lat
        open.endLng = lng
        open.endPhotoAt = nowIso
        const saved = await saveDutySessions(sessions)
        if (!saved) return res.status(503).json({ error: 'Could not save End Duty. Try again.' })
        const endView = publicDuty(g, open, clients, lat, lng, off)
        if (endView.outOfPost) {
          await flagDutyException({
            today,
            kind: 'out_of_post',
            g,
            remark: `Out of Post — ${endView.metres} m from duty post`,
            detail: `Out of Post — ${endView.metres} metres from duty post (100 m fence).`,
            severity: (endView.metres || 0) >= 250 ? 'severe' : 'medium',
            clientName: endView.clientName,
            location: endView.location,
            shiftLabel: endView.shiftLabel,
            metres: endView.metres,
            mapUrl: endView.mapUrl,
          })
        }
        const started = new Date(open.startedAt).getTime()
        const doneMin = Math.round((Date.now() - started) / 60000)
        const expectMin = (open.shiftHours || 12) * 60
        const earlyMin = expectMin - doneMin
        const earlyMessage = earlyMin > 15 ? earlyDutyHoursMessage(earlyMin) : ''
        if (earlyMessage) {
          await flagDutyException({
            today,
            kind: 'early_end',
            g,
            remark: earlyMessage,
            detail: earlyMessage,
            severity: earlyMin >= 180 ? 'severe' : 'medium',
            clientName: endView.clientName,
            location: endView.location,
            shiftLabel: endView.shiftLabel,
            metres: endView.metres,
            mapUrl: endView.mapUrl,
          })
        }
        return res.status(200).json({
          ok: true,
          message: earlyMessage || 'End Duty saved. Thank you.',
          duty: publicDuty(g, null, clients, lat, lng, off),
        })
      }

      if (action === 'status') {
        const raw = String(body.kind ?? '')
        const kind: LiveStatusKind | '' =
          raw === 'late_start' || raw === 'late'
            ? 'late_start'
            : raw === 'out_of_post'
              ? 'out_of_post'
              : raw === 'break_duty'
                ? 'break_duty'
                : ''
        if (!kind) return res.status(400).json({ error: 'Choose Late Start, Out of Post, or Break Duty.' })
        const reason = kind === 'break_duty' ? breakReasonOk(String(body.reason ?? body.remark ?? '')) : ''
        if (kind === 'break_duty' && !reason) {
          return res.status(400).json({ error: 'Pick a reason for Break Duty.' })
        }
        const remark = (reason || String(body.remark ?? '').trim()).slice(0, 200)
        const view = publicDuty(g, open, clients, null, null, off)
        if (kind === 'break_duty') {
          await flagDutyException({
            today,
            kind: 'break_duty',
            g,
            remark: `Break Duty — ${reason}`,
            detail: `Break Duty — ${reason}. ${[view.clientName, view.location, view.shiftLabel].filter(Boolean).join(' · ')}.`,
            severity: 'medium',
            clientName: view.clientName,
            location: view.location,
            shiftLabel: view.shiftLabel,
            metres: view.metres,
            mapUrl: view.mapUrl,
          })
          return res.status(200).json({
            ok: true,
            message: `Break Duty sent — ${reason}. Control, OM, HOD and Director have been informed.`,
            duty: view,
          })
        }
        const already = (await listLiveStatus(today)).some((s) => s.guardId === g.id && s.kind === kind)
        const rec = await addLiveStatus({
          date: today,
          kind,
          guardId: g.id,
          idNo: g.idNo,
          name: g.name,
          mobile: g.mobile,
          branch: g.branch,
          clientSite: g.clientSite,
          remark,
        })
        await addDutyAlert({
          date: today,
          type: kind === 'late_start' ? 'late_start' : 'out_of_post',
          severity: kind === 'out_of_post' ? 'medium' : 'mild',
          guardId: g.id,
          idNo: g.idNo,
          name: g.name,
          mobile: g.mobile,
          branch: g.branch,
          clientSite: g.clientSite,
          detail: remark || kind,
        })
        if (!already) {
          void sendLiveDutyExceptionMail({
            kind,
            name: g.name,
            idNo: g.idNo,
            branch: g.branch,
            clientName: view.clientName,
            location: view.location,
            shiftLabel: view.shiftLabel,
            metres: view.metres,
            mapUrl: view.mapUrl,
            detail:
              remark ||
              (kind === 'late_start' ? view.lateMessage || 'Late Start' : LIVE_LEAVE_POST_MSG),
          }).catch(() => {})
        }
        const label = kind === 'late_start' ? view.lateMessage || 'Late Start' : LIVE_LEAVE_POST_MSG
        return res.status(200).json({
          ok: true,
          message: label,
          alarm: kind === 'out_of_post',
          status: rec,
          duty: view,
        })
      }

      if (action === 'remindReply') {
        const reply = String(body.reply ?? '').trim()
        if (!(LIVE_DUTY_REPLIES as readonly string[]).includes(reply)) {
          return res.status(400).json({ error: 'Pick a reply: On the way, Will report, Leave informed, or Traffic delay.' })
        }
        const rec = await replyLiveReminder(String(body.reminderId ?? body.id ?? ''), reply, g.mobile)
        if ('error' in rec) return res.status(400).json({ error: rec.error })
        return res.status(200).json({
          ok: true,
          message: `Reply sent — ${reply}.`,
          reminder: rec,
          ...(await phoneInbox(g, off, sessions)),
        })
      }

      if (action === 'chatList') {
        const raw = await listLiveChat(roomKey, String(body.afterId ?? ''))
        const messages = filterLiveChatForGuard(raw, g.mobile)
        return res.status(200).json({
          ok: true,
          roomKey,
          messages,
          chatRule: LIVE_CHAT_RULE,
          ...(await phoneInbox(g, off, sessions)),
        })
      }

      if (action === 'chatSend') {
        const lat = numOrNull(body.lat)
        const lng = numOrNull(body.lng)
        if (open && lat != null && lng != null) {
          const chatView = publicDuty(g, open, clients, lat, lng, off)
          if (chatView.outOfPost) {
            await flagDutyException({
              today,
              kind: 'out_of_post',
              g,
              remark: `Out of Post while chatting — ${chatView.metres} m`,
              detail: `Out of Post while chatting — ${chatView.metres} metres from duty post.`,
              severity: (chatView.metres || 0) >= 250 ? 'severe' : 'medium',
            clientName: chatView.clientName,
            location: chatView.location,
            shiftLabel: chatView.shiftLabel,
              metres: chatView.metres,
              mapUrl: chatView.mapUrl,
            })
          }
        }
        const out = await sendChat({
          roomKey,
          fromRole: 'guard',
          fromKind: 'guard',
          fromName: g.name,
          fromId: `g:${normaliseMobile(g.mobile)}`,
          text: String(body.text ?? ''),
          today,
          fileName: String(body.fileName ?? ''),
          fileMime: String(body.fileMime ?? ''),
          fileData: String(body.fileData ?? ''),
        })
        if (!out.ok) return res.status(out.status).json({ error: out.error, blocked: out.blocked })
        return res.status(200).json({ ok: true, message: out.message })
      }
    }

    const staff = await staffSession(body, req)
    if (!staff) return res.status(401).json({ error: 'Please sign in to Agile Live.' })

    const allBranches = await liveBranchOptions()
    const hodName =
      staff.role === 'staff' ? await resolveLiveBranchName(staff.branchId || '') : ''

    const pickRoom = async (): Promise<string | 'ALL'> => {
      if (staff.role === 'staff') return liveRoomKey(hodName)
      const want = String(body.branchId ?? body.branch ?? '').trim()
      if (isMgmtAllBranches(want)) return 'ALL'
      const hit = allBranches.find((b) => b.id === want || liveRoomKey(b.name) === liveRoomKey(want))
      return hit ? liveRoomKey(hit.name) : 'ALL'
    }

    if (action === 'bootstrap') {
      return res.status(200).json({
        ok: true,
        email: staff.email,
        name: livePersonName(staff.email),
        role: staff.role,
        roleLabel: staff.role === 'management' ? 'Management' : 'Staff',
        branchId: staff.role === 'staff' ? staff.branchId || '' : 'ALL',
        branchName: staff.role === 'staff' ? hodName : 'All Branches',
        branches: allBranches,
        extras: await listLiveExtraMobiles(),
        chatRule: staffChatRule(staff.role),
        earlyMinutes: REPORT_EARLY_MIN,
      })
    }

    if (action === 'weekRoster') {
      const room = await pickRoom()
      if (room === 'ALL') {
        return res.status(400).json({ error: 'Pick one branch to open this week’s schedule.' })
      }
      if (!(await getOpsGuards()).length) await syncOpsGuardsFromMis({ branchFilter: '*' })
      const people = (await getOpsGuards()).filter((g) => g.active !== false && sameRoom(g.branch, room))
      const clients = await loadLiveClients(room)
      const woMap = await mapLiveUnitWeekOffs()
      const rows = people
        .map((g) => {
          const view = publicDuty(g, null, clients, null, null, offWeekdayFromMap(woMap, g.branch, g.clientSite))
          const week = view.week
          return {
            name: g.name,
            idNo: g.idNo,
            mobile: g.mobile,
            branch: g.branch,
            clientSite: view.clientName || g.clientSite,
            location: view.location,
            rank: view.rank,
            hours: week?.hours || view.shiftHours,
            shiftLabel: week?.todayOff ? 'Weekly off' : view.shiftLabel,
            todayOff: Boolean(week?.todayOff),
            todayLine: week?.todayLine || '',
            days: week?.days || [],
            weekLabel: week?.weekLabel || '',
          }
        })
        .sort((a, b) =>
          String(a.clientSite).localeCompare(String(b.clientSite)) || String(a.name).localeCompare(String(b.name)),
        )
      return res.status(200).json({
        ok: true,
        room,
        weekLabel: rows[0]?.weekLabel || 'This week · duty changes every Sunday',
        weekdays: LIVE_WEEKDAYS,
        units: [...new Map(rows.map((r) => [r.clientSite, { clientSite: r.clientSite, weekday: offWeekdayFromMap(woMap, r.branch, r.clientSite) }])).values()],
        rows,
      })
    }

    if (action === 'setUnitWeekOff') {
      const room = await pickRoom()
      if (room === 'ALL') return res.status(400).json({ error: 'Pick one branch first.' })
      const branchName =
        staff.role === 'staff'
          ? hodName || room
          : allBranches.find((b) => liveRoomKey(b.name) === room)?.name || room
      const saved = await saveLiveUnitWeekOff({
        branch: branchName,
        clientSite: String(body.clientSite ?? body.site ?? ''),
        weekday: Number(body.weekday),
        setBy: staff.email,
      })
      if ('error' in saved) return res.status(400).json({ error: saved.error })
      return res.status(200).json({
        ok: true,
        message: `Weekly off for this unit is now ${LIVE_WEEKDAYS[saved.weekday] || 'Sunday'}.`,
        row: saved,
      })
    }

    if (action === 'portalAttend') {
      const room = await pickRoom()
      if (room === 'ALL') return res.status(400).json({ error: 'Pick one branch first.' })
      const mob = normaliseMobile(String(body.mobile ?? ''))
      if (mob.length !== 10) return res.status(400).json({ error: 'Pick the person to mark present.' })
      const people = (await getOpsGuards()).filter((x) => x.active !== false && sameRoom(x.branch, room))
      const person = people.find((x) => normaliseMobile(x.mobile) === mob)
      if (!person) return res.status(404).json({ error: 'This mobile is not on this branch list.' })
      const today = istYmd()
      const sessions = await getDutySessions()
      const already = sessions.some(
        (s) => s.guardId === person.id && istYmdFromIso(s.startedAt) === today,
      )
      if (already) {
        return res.status(200).json({ ok: true, message: 'Already marked present today (phone or portal).' })
      }
      const nowIso = new Date().toISOString()
      const woMap = await mapLiveUnitWeekOffs()
      const view = publicDuty(
        person,
        null,
        await loadLiveClients(room),
        null,
        null,
        offWeekdayFromMap(woMap, person.branch, person.clientSite),
      )
      const row: OpsDutySession = {
        id: opsNid('duty'),
        guardId: person.id,
        idNo: person.idNo,
        name: person.name,
        mobile: person.mobile,
        branch: person.branch,
        clientSite: person.clientSite,
        shiftHours: view.shiftHours === 8 ? 8 : 12,
        startedAt: nowIso,
        endedAt: nowIso,
        startLat: null,
        startLng: null,
        endLat: null,
        endLng: null,
        status: 'ended',
        portalBy: staff.email,
      }
      sessions.unshift(row)
      const saved = await saveDutySessions(sessions.slice(0, 5000))
      if (!saved) return res.status(503).json({ error: 'Could not save portal attendance.' })
      return res.status(200).json({
        ok: true,
        message: `Portal attendance saved for ${person.name} — signal / mobile issue.`,
      })
    }

    if (action === 'sendReminder') {
      const room = await pickRoom()
      if (room === 'ALL') return res.status(400).json({ error: 'Pick one branch first.' })
      const kind = reminderKindOk(String(body.kind ?? ''))
      if (kind !== 'duty' && kind !== 'training') {
        return res.status(400).json({ error: 'Send a duty reminder or a training (OJT) reminder.' })
      }
      const person = await findRoomPerson(room, String(body.mobile ?? ''))
      if ('error' in person) return res.status(400).json({ error: person.error })
      const today = istYmd()
      const open = (await listLiveReminders()).find(
        (r) =>
          r.date === today &&
          r.kind === kind &&
          !r.reply &&
          normaliseMobile(r.mobile) === normaliseMobile(person.mobile),
      )
      if (open) {
        return res.status(200).json({
          ok: true,
          message: 'Already sent — they have not replied yet.',
          reminder: open,
        })
      }
      const site = person.clientSite
      const rec = await addLiveReminder({
        date: today,
        kind,
        guardId: person.id,
        idNo: person.idNo,
        name: person.name,
        mobile: normaliseMobile(person.mobile),
        branch: person.branch,
        clientSite: site,
        text: reminderText(kind, site, String(body.text ?? '')),
        showWageSlip: kind === 'duty',
        by: staff.email,
      })
      return res.status(200).json({
        ok: true,
        message:
          kind === 'training'
            ? `Training (OJT) reminder sent to ${person.name}.`
            : `Duty reminder sent to ${person.name}. Wage Slip opens on their phone.`,
        reminder: rec,
      })
    }

    if (action === 'allotVacant') {
      const room = await pickRoom()
      if (room === 'ALL') return res.status(400).json({ error: 'Pick one branch first.' })
      const person = await findRoomPerson(room, String(body.mobile ?? ''))
      if ('error' in person) return res.status(400).json({ error: person.error })
      const site = String(body.clientSite ?? body.site ?? person.clientSite)
        .replace(/\s+/g, ' ')
        .trim()
      if (!site) return res.status(400).json({ error: 'Pick the vacant unit (site).' })
      const today = String(body.date ?? '').trim() || istYmd()
      const rec = await saveLiveVacantAllot({
        date: today,
        branch: person.branch,
        clientSite: site,
        guardId: person.id,
        idNo: person.idNo,
        name: person.name,
        mobile: normaliseMobile(person.mobile),
        setBy: staff.email,
      })
      const already = (await listLiveReminders()).find(
        (r) =>
          r.date === today &&
          r.kind === 'vacant_post' &&
          !r.reply &&
          normaliseMobile(r.mobile) === normaliseMobile(person.mobile),
      )
      const reminder =
        already ||
        (await addLiveReminder({
          date: today,
          kind: 'vacant_post',
          guardId: person.id,
          idNo: person.idNo,
          name: person.name,
          mobile: normaliseMobile(person.mobile),
          branch: person.branch,
          clientSite: site,
          text: reminderText('vacant_post', site, String(body.text ?? '')),
          showWageSlip: false,
          by: staff.email,
        }))
      return res.status(200).json({
        ok: true,
        message: `Vacant Post duty allotted to ${person.name} — ${site}.`,
        vacant: rec,
        reminder,
      })
    }

    if (action === 'weather') {
      const room = await pickRoom()
      if (room === 'ALL') return res.status(400).json({ error: 'Pick one branch first.' })
      const branchName =
        staff.role === 'staff' ? hodName || room : allBranches.find((b) => liveRoomKey(b.name) === room)?.name || room
      const wx = await liveWeatherReport({
        branch: branchName,
        lat: numOrNull(body.lat),
        lng: numOrNull(body.lng),
      })
      if (!wx.ok) return res.status(200).json({ ok: true, error: wx.error })
      return res.status(200).json({ ok: true, weather: wx })
    }

    if (action === 'callBook') {
      const room = await pickRoom()
      if (room === 'ALL') return res.status(400).json({ error: 'Pick one branch first.' })
      if (!(await getOpsGuards()).length) await syncOpsGuardsFromMis({ branchFilter: '*' })
      const people = (await getOpsGuards()).filter((x) => x.active !== false && sameRoom(x.branch, room))
      const staffCalls = await liveCallBook(room)
      const seen = new Set(staffCalls.map((c) => c.mobile))
      for (const p of people) {
        const mob = normaliseMobile(p.mobile)
        if (mob.length !== 10 || seen.has(mob)) continue
        seen.add(mob)
        staffCalls.push({ name: p.name, mobile: mob, role: 'Security Staff' })
      }
      return res.status(200).json({ ok: true, calls: staffCalls })
    }

    if (action === 'siteNote') {
      const room = await pickRoom()
      if (room === 'ALL') return res.status(400).json({ error: 'Pick one branch first.' })
      const branchName =
        staff.role === 'staff' ? hodName || room : allBranches.find((b) => liveRoomKey(b.name) === room)?.name || room
      const site = String(body.clientSite ?? body.site ?? '').trim()
      const note = site ? await findLiveSiteNote(branchName, site) : null
      return res.status(200).json({ ok: true, siteNote: note, site })
    }

    if (action === 'saveSiteNote') {
      const room = await pickRoom()
      if (room === 'ALL') return res.status(400).json({ error: 'Pick one branch first.' })
      const branchName =
        staff.role === 'staff' ? hodName || room : allBranches.find((b) => liveRoomKey(b.name) === room)?.name || room
      const saved = await saveLiveSiteNote({
        branch: branchName,
        clientSite: String(body.clientSite ?? body.site ?? ''),
        text: String(body.text ?? ''),
        by: staff.email,
      })
      if ('error' in saved) return res.status(400).json({ error: saved.error })
      return res.status(200).json({ ok: true, message: 'Site instruction saved.', siteNote: saved })
    }

    if (action === 'softSkills') {
      return res.status(200).json({ ok: true, softSkills: softSkillPack(await listLiveSoftSkills()) })
    }

    if (action === 'saveSoftSkill') {
      const saved = await saveLiveSoftSkill({
        title: String(body.title ?? ''),
        text: String(body.text ?? ''),
        by: staff.email,
      })
      if ('error' in saved) return res.status(400).json({ error: saved.error })
      return res.status(200).json({ ok: true, message: 'Soft skill saved.', softSkills: softSkillPack(await listLiveSoftSkills()) })
    }

    if (action === 'attReports') {
      const room = await pickRoom()
      if (room === 'ALL') return res.status(400).json({ error: 'Pick one branch to open attendance reports.' })
      if (!(await getOpsGuards()).length) await syncOpsGuardsFromMis({ branchFilter: '*' })
      const people = (await getOpsGuards()).filter((g) => g.active !== false && sameRoom(g.branch, room))
      const from = istMonthStart()
      const to = istYmd()
      const [sessions, woMap] = await Promise.all([getDutySessions(), mapLiveUnitWeekOffs()])
      const reports = buildLiveAttendanceReports({
        people,
        sessions: sessions.filter((s) => sameRoom(s.branch, room)),
        from,
        to,
        woMap,
      })
      return res.status(200).json({
        ok: true,
        note: 'Agile Live attendance book. Work360 stays until this move is finished.',
        ...reports,
      })
    }

    if (action === 'board') {
      const room = await pickRoom()
      const today = istYmd()
      if (!(await getOpsGuards()).length) await syncOpsGuardsFromMis({ branchFilter: '*' })
      const guards = (await getOpsGuards()).filter(
        (g) => g.active !== false && (room === 'ALL' || sameRoom(g.branch, room)),
      )
      const sessions = (await getDutySessions()).filter((s) => s.status === 'on_duty')
      const onByGuard = new Map(sessions.map((s) => [s.guardId, s]))
      const statuses = (await listLiveStatus(today)).filter(
        (s) => room === 'ALL' || sameRoom(s.branch, room),
      )
      const latestStatus = new Map<string, (typeof statuses)[0]>()
      for (const s of statuses) {
        if (!latestStatus.has(s.guardId)) latestStatus.set(s.guardId, s)
      }
      const clients = await loadLiveClients(room === 'ALL' ? '' : room)
      const woMap = await mapLiveUnitWeekOffs()
      const allRows = guards.map((g) => {
        const duty = onByGuard.get(g.id) || null
        const st = latestStatus.get(g.id) || null
        const view = publicDuty(g, duty, clients, null, null, offWeekdayFromMap(woMap, g.branch, g.clientSite))
        let flag = 'ok'
        if (st?.kind === 'out_of_post' || view.outOfPost) flag = 'out_of_post'
        else if (st?.kind === 'break_duty' || st?.kind === 'early_end') flag = st.kind
        else if (st?.kind === 'late_start' || st?.kind === 'late' || (duty && view.lateStart)) flag = 'late_start'
        return {
          id: g.id,
          name: g.name,
          idNo: g.idNo,
          mobile: g.mobile,
          branch: g.branch,
          clientSite: g.clientSite,
          clientName: view.clientName,
          location: view.location,
          shiftLabel: view.shiftLabel,
          rank: view.rank,
          todayOff: Boolean(view.week?.todayOff),
          reportBy: view.reportBy,
          dutyStart: view.dutyStart,
          onDuty: Boolean(duty),
          startedAt: duty?.startedAt || '',
          statusKind: st?.kind || '',
          flag,
          metres: view.metres,
          mapUrl: view.mapUrl,
          outOfPost: view.outOfPost,
          lateMessage: view.lateMessage,
          leaveMessage: view.leaveMessage,
        }
      })
      /** Today only — do not dump the full HDFC / Master Directory book. */
      const rows = allRows
        .filter((r) => r.onDuty || r.statusKind)
        .sort((a, b) => a.name.localeCompare(b.name))
      const blocked = (await listBlockedAttempts(today)).filter((b) => room === 'ALL' || b.roomKey === room)
      const alerts = (await listDutyAlerts(today, 80)).filter(
        (a) => room === 'ALL' || sameRoom(a.branch, room),
      )
      const reminders = (await listLiveReminders())
        .filter((r) => room === 'ALL' || sameRoom(r.branch, room))
        .slice(0, 40)
      return res.status(200).json({
        ok: true,
        room,
        earlyMinutes: REPORT_EARLY_MIN,
        bookCount: guards.length,
        counts: {
          book: guards.length,
          guards: rows.length,
          onDuty: rows.filter((r) => r.onDuty).length,
          missing: 0,
          late: rows.filter((r) => r.flag === 'late_start').length,
          lateStart: rows.filter((r) => r.flag === 'late_start').length,
          outOfPost: rows.filter((r) => r.flag === 'out_of_post').length,
          breakDuty: rows.filter((r) => r.flag === 'break_duty').length,
          sick: 0,
          onTheWay: 0,
        },
        rows,
        blocked,
        alerts,
        reminders,
        mutes: await listLiveMutes(),
      })
    }

    if (action === 'monthDuties') {
      const room = await pickRoom()
      if (room === 'ALL') return res.status(400).json({ error: 'Pick one branch to open a person’s month.' })
      const from = istMonthStart()
      const to = istYmd()
      const [sessions, statuses, clients] = await Promise.all([
        getDutySessions(),
        listLiveStatusBetween(from, to),
        loadLiveClients(room === 'ALL' ? '' : room),
      ])
      const want = normaliseMobile(String(body.mobile ?? ''))
      const rows = monthDutyRows({
        sessions,
        statuses,
        from,
        to,
        clients,
        room,
      }).filter((r) => !want || normaliseMobile(r.mobile) === want)
      const woMap = await mapLiveUnitWeekOffs()
      const people = (await getOpsGuards()).filter((g) => g.active !== false && sameRoom(g.branch, room))
      const person = want ? people.find((g) => normaliseMobile(g.mobile) === want) : people[0]
      const calendar = person
        ? buildLiveMonthCalendar({
            monthStart: from,
            monthEnd: istMonthEnd(),
            today: to,
            offWeekday: offWeekdayFromMap(woMap, person.branch, person.clientSite),
            sessions: sessions.filter((s) => s.guardId === person.id),
          })
        : null
      return res.status(200).json({
        ok: true,
        from,
        to,
        rows,
        calendar,
        calendarName: person ? `${person.name} · ${person.idNo}` : '',
      })
    }

    if (action === 'lookupMobile') {
      const room = await pickRoom()
      if (room === 'ALL') return res.status(400).json({ error: 'Pick one branch first.' })
      const hit = await resolveRecipient(String(body.toMobile ?? body.mobile ?? ''))
      if ('error' in hit) return res.status(400).json({ error: hit.error })
      if (hit.kind === 'guard') {
        if (hit.branch && !sameRoom(hit.branch, room)) {
          return res.status(400).json({ error: 'This mobile belongs to another branch. Pick that branch first.' })
        }
      }
      return res.status(200).json({
        ok: true,
        name: hit.name,
        mobile: hit.mobile,
        kind: hit.kind,
        idNo: hit.idNo || '',
        branch: hit.branch || '',
        clientSite: hit.clientSite || '',
      })
    }

    if (action === 'saveMobile') {
      const room = await pickRoom()
      if (room === 'ALL') return res.status(400).json({ error: 'Pick one branch first.' })
      const saved = await upsertLiveExtraMobile({
        mobile: String(body.toMobile ?? body.mobile ?? ''),
        name: String(body.toName ?? body.name ?? ''),
        addedBy: staff.email,
      })
      if ('error' in saved) return res.status(400).json({ error: saved.error })
      return res.status(200).json({ ok: true, name: saved.name, mobile: saved.mobile, kind: 'saved' })
    }

    if (action === 'chatList') {
      const room = await pickRoom()
      if (room === 'ALL') {
        return res.status(400).json({ error: 'Pick one branch to open chat.' })
      }
      const messages = await listLiveChat(room, String(body.afterId ?? ''))
      return res.status(200).json({ ok: true, roomKey: room, messages, chatRule: staffChatRule(staff.role) })
    }

    if (action === 'chatSend') {
      const room = await pickRoom()
      if (room === 'ALL') return res.status(400).json({ error: 'Pick one branch to send chat.' })
      const today = istYmd()
      const toMob = normaliseMobile(String(body.toMobile ?? ''))
      let toName = String(body.toName ?? '').replace(/\s+/g, ' ').trim().slice(0, 80)
      if (toMob) {
        if (toMob.length !== 10) return res.status(400).json({ error: 'Enter a 10-digit mobile, or leave it blank for the branch group.' })
        const hit = await resolveRecipient(toMob)
        if ('error' in hit) return res.status(400).json({ error: hit.error })
        if (hit.kind === 'guard') {
          if (hit.branch && !sameRoom(hit.branch, room)) {
            return res.status(400).json({ error: 'This mobile belongs to another branch. Pick that branch first.' })
          }
        }
        toName = hit.name || toName || toMob
      }
      const out = await sendChat({
        roomKey: room,
        fromRole: 'staff',
        fromKind: staff.role === 'management' ? 'management' : 'staff',
        fromName: livePersonName(staff.email),
        fromId: `s:${staff.email}`,
        text: String(body.text ?? ''),
        today,
        fileName: String(body.fileName ?? ''),
        fileMime: String(body.fileMime ?? ''),
        fileData: String(body.fileData ?? ''),
        toMobile: toMob || undefined,
        toName: toName || undefined,
      })
      if (!out.ok) return res.status(out.status).json({ error: out.error, blocked: out.blocked })
      return res.status(200).json({ ok: true, message: out.message })
    }

    if (action === 'chatDelete') {
      const room = await pickRoom()
      if (room === 'ALL') return res.status(400).json({ error: 'Pick one branch.' })
      const ok = await deleteLiveChat(room, String(body.messageId ?? ''))
      return res.status(ok ? 200 : 404).json(ok ? { ok: true } : { error: 'Message not found.' })
    }

    if (action === 'mute') {
      const key = String(body.key ?? '').trim()
      if (!key) return res.status(400).json({ error: 'Who to mute?' })
      const row = await muteLiveSender({
        key,
        name: String(body.name ?? key),
        by: staff.email,
        hours: Number(body.hours) || 24,
        reason: String(body.reason ?? 'Company chat rule'),
      })
      return res.status(200).json({ ok: true, mute: row })
    }

    if (action === 'unmute') {
      const ok = await unmuteLiveSender(String(body.key ?? ''))
      return res.status(200).json({ ok, message: ok ? 'Unmuted.' : 'Not muted.' })
    }

    return res.status(400).json({ error: 'Unknown action' })
  } catch (err) {
    console.error('[live/data]', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Server error' })
  }
}

async function sendChat(opts: {
  roomKey: string
  fromRole: 'guard' | 'staff'
  fromKind?: 'guard' | 'staff' | 'management'
  fromName: string
  fromId: string
  text: string
  today: string
  fileName?: string
  fileMime?: string
  fileData?: string
  toMobile?: string
  toName?: string
}): Promise<
  | { ok: true; message: Awaited<ReturnType<typeof appendLiveChat>> }
  | { ok: false; status: number; error: string; blocked?: boolean }
> {
  const muted = await isLiveMuted(opts.fromId)
  if (muted) {
    return { ok: false, status: 403, error: 'You cannot send messages until the mute ends.' }
  }
  if (!(await liveChatRateOk(opts.fromId))) {
    return { ok: false, status: 429, error: 'Please wait a minute before sending again.' }
  }
  const hasFile = Boolean(String(opts.fileData || '').startsWith('data:'))
  const rawText = String(opts.text || '').trim()
  if (!hasFile && !rawText) return { ok: false, status: 400, error: 'Type a message or attach a file.' }
  let text = ''
  if (rawText) {
    const checked = moderateLiveChat(rawText)
    if (!checked.ok) {
      if (checked.hit === 'too-long') return { ok: false, status: 400, error: 'Message is too long.' }
      if (checked.hit !== 'empty') {
        await addBlockedAttempt({
          date: opts.today,
          roomKey: opts.roomKey,
          fromName: opts.fromName,
          fromId: opts.fromId,
          hit: checked.hit,
          snippet: rawText,
        })
        await addDutyAlert({
          date: opts.today,
          type: 'chat_blocked',
          severity: 'severe',
          guardId: opts.fromId,
          idNo: '',
          name: opts.fromName,
          mobile: '',
          branch: opts.roomKey,
          clientSite: '',
          detail: `Blocked (${checked.hit}).`,
        })
        return { ok: false, status: 400, error: LIVE_CHAT_BLOCKED, blocked: true }
      }
    } else text = checked.text
  }
  let fileKind: import('../_lib/agile-live/types.js').LiveFileKind | undefined
  let fileUrl = ''
  let fileName = ''
  let fileMime = ''
  if (hasFile) {
    const stored = await storeLiveChatFile({
      roomKey: opts.roomKey,
      fileName: String(opts.fileName || 'file'),
      mime: String(opts.fileMime || ''),
      dataUrl: String(opts.fileData || ''),
    })
    if (!stored.ok) return { ok: false, status: 400, error: stored.error }
    fileKind = stored.kind
    fileUrl = stored.url
    fileName = stored.name
    fileMime = stored.mime
  }
  const message = await appendLiveChat({
    roomKey: opts.roomKey,
    fromRole: opts.fromRole,
    fromKind: opts.fromKind,
    fromName: opts.fromName,
    fromId: opts.fromId,
    text: text || fileName,
    fileKind,
    fileUrl,
    fileName,
    fileMime,
    toMobile: opts.toMobile,
    toName: opts.toName,
  })
  return { ok: true, message }
}
