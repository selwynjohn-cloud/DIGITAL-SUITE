/**
 * Pull sourcing-funnel names from Training / Work360 / Recruiters / Security News.
 * Does not change those source apps — only copies into Recruitment follow-up.
 */

import { misTodayIst } from '../mis/dates.js'
import { work360Config } from '../mis/work360-client.js'
import { listQuizPeopleForRecruitment } from '../pulse/quiz.js'
import { buildSecurityNewsWhatsApp, waUrl } from './message-formats.js'
import { loadAbsconders, sameRecruitBranch } from './absconder.js'
import {
  applyFunnelDateBook,
  loadFunnelDateBook,
  loadFunnelSnapshot,
  mergeFunnelPeople,
  normalizeFunnelPerson,
  saveFunnelSnapshot,
  type FunnelKind,
  type FunnelPerson,
  type FunnelSnapshot,
} from './funnel-followup-store.js'
import { getAttendanceDates, getAttendanceMarks, RECRUIT_BRANCHES } from './store.js'
import { getWalkIns } from './walk-in-store.js'
import { syncWork360AttendanceRange } from './work360-attendance.js'

export type FunnelExtractOpts = {
  sync?: boolean
  asOf?: string
  month?: string
}

function nowIso(): string {
  return new Date().toISOString()
}

function sortTsOf(v: string): number {
  const t = Date.parse(String(v || ''))
  return Number.isFinite(t) ? t : 0
}

async function extractEoi(sync: boolean): Promise<FunnelPerson[]> {
  const { listTrainingEoiFollowUps, syncTrainingEoiFromSessions } = await import('./training-eoi-store.js')
  if (sync) await syncTrainingEoiFromSessions({ months: 1 })
  const rows = await listTrainingEoiFollowUps()
  const extractedAt = nowIso()
  return rows.map((r) =>
    normalizeFunnelPerson({
      id: r.id,
      name: r.guardName,
      phone: r.mobile,
      branch: r.branchName || r.branchId,
      empId: r.employeeId,
      detail: r.eoiJoiningDate ? `Absentee DOJ ${r.eoiJoiningDate}` : 'Will attend',
      extra1: r.clientName,
      extra2: `${r.trainingDate || ''} ${r.trainingTime || ''}`.trim(),
      extra3: r.eoiJoiningDate ? `DOJ ${r.eoiJoiningDate}` : 'Attend',
      notes: r.followNotes,
      extractedAt,
      sortTs: sortTsOf(r.eoiAt || r.updatedAt || r.createdAt) || sortTsOf(extractedAt),
    }),
  )
}

async function extractAbsconders(asOf: string, sync: boolean): Promise<FunnelPerson[]> {
  if (sync) {
    try {
      await syncWork360AttendanceRange(asOf, 14)
    } catch {
      /* keep last attendance */
    }
  }
  const guards = await loadAbsconders(asOf, 7)
  const extractedAt = nowIso()
  return guards.map((g) =>
    normalizeFunnelPerson({
      id: g.key,
      name: g.guardName,
      phone: g.mobile,
      branch: g.branch || g.branchHint,
      empId: g.employeeId,
      detail: `${g.client || g.unit || ''}`.trim(),
      extra1: g.employeeId,
      extra2: String(g.consecutiveDays || ''),
      extra3: g.absentSince,
      notes:
        g.followStatus === 'joined'
          ? 'Joined'
          : g.terminatedAt
            ? 'Termination sent'
            : g.remindedAt
              ? 'Reminded'
              : '',
      extractedAt,
      sortTs: sortTsOf(g.absentSince) || sortTsOf(extractedAt),
    }),
  )
}

async function extractIrregular(month: string, sync: boolean): Promise<FunnelPerson[]> {
  const minDuties = 13
  if (sync && work360Config()) {
    const end = misTodayIst().startsWith(month) ? misTodayIst() : `${month}-28`
    const days = Math.max(7, Number(end.slice(8)) || 28)
    try {
      await syncWork360AttendanceRange(end, days)
    } catch {
      /* saved marks */
    }
  }
  const dates = (await getAttendanceDates()).filter((d) => d.startsWith(month))
  const duty = new Map<
    string,
    { guardName: string; employeeId: string; unit: string; mobile: string; branch: string; duties: number }
  >()
  const guessBranch = (client: string, unit: string) => {
    const hay = `${client} ${unit}`.toLowerCase()
    for (const c of RECRUIT_BRANCHES) {
      if (hay.includes(String(c).toLowerCase())) return c
    }
    return 'Unassigned'
  }
  for (const d of dates) {
    const marks = await getAttendanceMarks(d)
    for (const m of marks) {
      if (m.status !== 'present' && m.status !== 'late') continue
      const key = `${m.employeeId || m.guardName}|${m.unit || ''}`.toLowerCase()
      const cur = duty.get(key) || {
        guardName: m.guardName,
        employeeId: m.employeeId,
        unit: m.unit || m.client || '',
        mobile: m.mobile || '',
        branch: guessBranch(m.client || '', m.unit || ''),
        duties: 0,
      }
      cur.duties += 1
      duty.set(key, cur)
    }
  }
  const extractedAt = nowIso()
  return [...duty.values()]
    .filter((r) => r.duties < minDuties)
    .map((r) =>
      normalizeFunnelPerson({
        id: `ia:${month}:${r.employeeId || r.guardName}:${r.unit}`.slice(0, 80),
        name: r.guardName,
        phone: r.mobile,
        branch: r.branch,
        empId: r.employeeId,
        detail: r.unit,
        extra1: r.employeeId,
        extra2: String(r.duties),
        extra3: r.unit,
        extractedAt,
        sortTs: r.duties,
      }),
    )
}

async function extractRecruiters(): Promise<FunnelPerson[]> {
  const extractedAt = nowIso()
  return (await getWalkIns())
    .filter((r) => r.active !== false && String(r.funnelChannel || '').toLowerCase() === 'recruiters')
    .map((r) =>
      normalizeFunnelPerson({
        id: r.id,
        name: r.name,
        phone: r.phone,
        branch: r.branchId,
        detail: r.referredBy ? `Referred by ${r.referredBy}` : r.walkInFrom || '',
        extra1: r.referredBy || '—',
        extra2: r.walkInFrom || '',
        extra3: r.regCode || '',
        notes: r.replyNotes || '',
        extractedAt,
        sortTs: sortTsOf(r.createdAt) || sortTsOf(extractedAt),
        call1At: r.call1At,
        tentativeJoinDate: r.tentativeJoinDate,
        call2At: r.call2At,
        call3At: r.call3At,
        joinedAt: r.joinedAt,
        holdRemindOn: r.holdRemindOn,
      }),
    )
}

async function extractNews(): Promise<FunnelPerson[]> {
  const pack = await listQuizPeopleForRecruitment()
  const extractedAt = nowIso()
  return pack.people.map((p, i) =>
    normalizeFunnelPerson({
      id: `news:${p.mobile}`,
      name: p.name,
      phone: p.mobile,
      branch: '',
      detail: p.lastDateDmy ? `Last answered ${p.lastDateDmy}` : '',
      extra1: p.lastDateDmy || '—',
      extra2: p.lastWeek || '—',
      extra3: String(p.answers || 1),
      extractedAt,
      sortTs: p.sortTs || Date.now() - i,
    }),
  )
}

export async function extractFunnelPeople(
  kind: FunnelKind,
  opts: FunnelExtractOpts = {},
): Promise<FunnelPerson[]> {
  const asOf = String(opts.asOf || misTodayIst()).slice(0, 10)
  const month = String(opts.month || asOf.slice(0, 7)).slice(0, 7)
  const sync = opts.sync === true
  if (kind === 'eoi') return extractEoi(sync)
  if (kind === 'absconder') return extractAbsconders(asOf, sync)
  if (kind === 'irregular') return extractIrregular(month, sync)
  if (kind === 'recruiters') return extractRecruiters()
  return extractNews()
}

export function filterFunnelByBranch(
  people: FunnelPerson[],
  branch: string,
  allBranches: boolean,
  kind?: FunnelKind,
): FunnelPerson[] {
  if (kind === 'news') return people
  if (allBranches || !branch || branch === 'ALL') return people
  return people.filter((p) => sameRecruitBranch(p.branch, branch))
}

export async function loadFunnelFollowup(
  kind: FunnelKind,
  opts: FunnelExtractOpts & { persist?: boolean } = {},
): Promise<FunnelSnapshot> {
  const asOf = String(opts.asOf || misTodayIst()).slice(0, 10)
  const month = String(opts.month || asOf.slice(0, 7)).slice(0, 7)
  const prev = await loadFunnelSnapshot(kind)
  const book = await loadFunnelDateBook(kind)
  if (!opts.sync && prev?.people?.length && opts.persist !== true) {
    return {
      ...prev,
      people: prev.people.map((p) => applyFunnelDateBook(p, book)),
    }
  }
  const fresh = await extractFunnelPeople(kind, opts)
  const merged = mergeFunnelPeople(prev?.people || [], fresh).map((p) => applyFunnelDateBook(p, book))
  const snap: FunnelSnapshot = {
    kind,
    extractedAt: nowIso(),
    asOf: kind === 'absconder' ? asOf : prev?.asOf,
    month: kind === 'irregular' ? month : prev?.month,
    hint:
      kind === 'eoi'
        ? 'Last list from Training EOI. Tap Sync from Training to pull new replies.'
        : kind === 'absconder'
          ? `Last list as of ${asOf}. Tap Sync & Refresh to pull new absconders.`
          : kind === 'irregular'
            ? `Last list for ${month}. Tap Sync & Refresh for a new month.`
            : kind === 'recruiters'
              ? 'Last Recruiter list. Add a name or tap Extract to refresh.'
              : 'Last Security News list. Tap Extract to pull new answers.',
    people: merged,
  }
  await saveFunnelSnapshot(snap)
  return snap
}

export function funnelWhatsAppText(kind: FunnelKind, name: string): string {
  const who = String(name || 'Candidate').trim() || 'Candidate'
  if (kind === 'news') return buildSecurityNewsWhatsApp({ name: who })
  if (kind === 'eoi') {
    return [
      `Namaste ${who},`,
      'Agile Security Force — Training EOI follow-up.',
      'You replied that you will attend training, or you sent a join-back date.',
      'Please reply YES if you can join / attend, and the date.',
      '',
      'Help Desk: 18005995599',
      'Agile Recruitment',
    ].join('\n')
  }
  if (kind === 'absconder') {
    return [
      `Namaste ${who},`,
      'Agile Security Force — please call us. You have been away from duty.',
      'Reply YES if you can return, and the date.',
      '',
      'Help Desk: 18005995599',
      'Agile Recruitment',
    ].join('\n')
  }
  if (kind === 'irregular') {
    return [
      `Namaste ${who},`,
      'Agile Security Force — your attendance this month is below 13 duties.',
      'Please speak with us. Reply YES if you can continue duty.',
      '',
      'Help Desk: 18005995599',
      'Agile Recruitment',
    ].join('\n')
  }
  return [
    `Namaste ${who},`,
    'Agile Security Force has security job openings.',
    'A recruiter shared your name. Reply YES if you want to join. We will call you.',
    '',
    'Help Desk: 18005995599',
    'Apply also at www.securityjob.co.in',
    'Agile Recruitment',
  ].join('\n')
}

export function funnelWaUrl(kind: FunnelKind, mobile: string, name: string): string {
  return waUrl(mobile, funnelWhatsAppText(kind, name))
}
