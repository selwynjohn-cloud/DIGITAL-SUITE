/** Agile Live attendance books — start of the Work360 move. */

import type { OpsDutySession, OpsGuard } from '../ops-mobile/store.js'
import { istYmd, istYmdFromIso } from './duty-window.js'
import { liveUnitWoKey, liveWeeklyOffWeekday } from './weekly-roster.js'

function ymdAdd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y || 2026, (m || 1) - 1, (d || 1) + days)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function weekdayOfYmd(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y || 2026, (m || 1) - 1, d || 1).getDay()
}

export function dutyDatesFromSessions(sessions: OpsDutySession[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  for (const s of sessions) {
    const ymd = istYmdFromIso(s.startedAt)
    if (!ymd) continue
    const key = s.guardId || s.idNo
    if (!map.has(key)) map.set(key, new Set())
    map.get(key)!.add(ymd)
  }
  return map
}

export function buildLiveAttendanceReports(opts: {
  people: OpsGuard[]
  sessions: OpsDutySession[]
  from: string
  to: string
  woMap: Map<string, number>
}) {
  const present = dutyDatesFromSessions(opts.sessions)
  const monthDays: string[] = []
  for (let ymd = opts.from; ymd <= opts.to; ymd = ymdAdd(ymd, 1)) monthDays.push(ymd)

  const monthly = opts.people.map((g) => {
    const days = present.get(g.id) || present.get(g.idNo) || new Set<string>()
    const offDow = liveWeeklyOffWeekday(opts.woMap.get(liveUnitWoKey(g.branch, g.clientSite)))
    let presentN = 0
    let weeklyOff = 0
    let absent = 0
    let portal = 0
    let streak = 0
    let maxStreak = 0
    let lastDuty = ''
    for (const ymd of monthDays) {
      const isOff = weekdayOfYmd(ymd) === offDow
      const hit = days.has(ymd)
      if (hit) {
        presentN++
        lastDuty = ymd
        streak = 0
        if (
          opts.sessions.some(
            (s) =>
              (s.guardId === g.id || s.idNo === g.idNo) &&
              istYmdFromIso(s.startedAt) === ymd &&
              s.portalBy,
          )
        ) {
          portal++
        }
      } else if (isOff) {
        weeklyOff++
        streak = 0
      } else {
        absent++
        streak++
        if (streak > maxStreak) maxStreak = streak
      }
    }
    return {
      name: g.name,
      idNo: g.idNo,
      mobile: g.mobile,
      branch: g.branch,
      clientSite: g.clientSite,
      present: presentN,
      weeklyOff,
      absent,
      portal,
      lastDuty,
      maxAbsentStreak: maxStreak,
    }
  })

  const absent7 = monthly
    .filter((r) => r.maxAbsentStreak > 7)
    .sort((a, b) => b.maxAbsentStreak - a.maxAbsentStreak)
  const dayNum = Number(String(opts.to).slice(-2))
  const irregular = monthly
    .filter((r) => r.present < 13 && dayNum >= 13)
    .sort((a, b) => a.present - b.present)

  const unitMap = new Map<
    string,
    { clientSite: string; people: number; presentDays: number; portalDays: number; weeklyOffDays: number }
  >()
  for (const r of monthly) {
    const key = r.clientSite || r.branch
    const cur = unitMap.get(key) || {
      clientSite: r.clientSite || r.branch,
      people: 0,
      presentDays: 0,
      portalDays: 0,
      weeklyOffDays: 0,
    }
    cur.people++
    cur.presentDays += r.present
    cur.portalDays += r.portal
    cur.weeklyOffDays += r.weeklyOff
    unitMap.set(key, cur)
  }
  const units = [...unitMap.values()].sort((a, b) => a.clientSite.localeCompare(b.clientSite))

  return {
    from: opts.from,
    to: opts.to,
    asOf: istYmd(),
    absent7,
    irregular,
    monthly,
    units,
  }
}
