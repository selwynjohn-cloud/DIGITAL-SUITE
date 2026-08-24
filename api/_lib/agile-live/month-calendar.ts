/** Agile Live — month calendar marks (duty / weekly off / OT / absent). */

import type { OpsDutySession } from '../ops-mobile/store.js'
import { istYmdFromIso } from './duty-window.js'
import { liveWeeklyOffWeekday } from './weekly-roster.js'

export type LiveCalKind = 'duty' | 'off' | 'ot' | 'absent' | 'future' | ''

export type LiveCalDay = {
  date: string
  day: number
  kind: LiveCalKind
  isToday: boolean
}

function ymdAdd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y || 2026, (m || 1) - 1, (d || 1) + days)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

function weekdayOfYmd(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y || 2026, (m || 1) - 1, d || 1).getDay()
}

export function sessionWasOt(s: OpsDutySession): boolean {
  if (!s.startedAt || !s.endedAt) return false
  const start = Date.parse(s.startedAt)
  const end = Date.parse(s.endedAt)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return false
  const expect = (s.shiftHours === 8 ? 8 : 12) * 60
  return (end - start) / 60000 > expect + 15
}

export function buildLiveMonthCalendar(opts: {
  monthStart: string
  monthEnd: string
  today: string
  offWeekday?: number
  sessions: OpsDutySession[]
}): { month: string; days: LiveCalDay[]; counts: Record<string, number> } {
  const off = liveWeeklyOffWeekday(opts.offWeekday)
  const byDate = new Map<string, OpsDutySession[]>()
  for (const s of opts.sessions) {
    const ymd = istYmdFromIso(s.startedAt)
    if (!ymd || ymd < opts.monthStart || ymd > opts.monthEnd) continue
    const list = byDate.get(ymd) || []
    list.push(s)
    byDate.set(ymd, list)
  }
  const [ys, ms] = opts.monthStart.split('-').map(Number)
  const firstDow = new Date(ys || 2026, (ms || 1) - 1, 1).getDay()
  const days: LiveCalDay[] = []
  for (let i = 0; i < firstDow; i++) {
    days.push({ date: '', day: 0, kind: '', isToday: false })
  }
  const counts = { duty: 0, off: 0, ot: 0, absent: 0 }
  for (let ymd = opts.monthStart; ymd <= opts.monthEnd; ymd = ymdAdd(ymd, 1)) {
    const hits = byDate.get(ymd) || []
    const isOff = weekdayOfYmd(ymd) === off
    const isOt = hits.some(sessionWasOt)
    let kind: LiveCalKind = ''
    if (ymd > opts.today) kind = isOff ? 'off' : 'future'
    else if (isOt) kind = 'ot'
    else if (hits.length) kind = 'duty'
    else if (isOff) kind = 'off'
    else kind = 'absent'
    if (kind === 'duty' || kind === 'off' || kind === 'ot' || kind === 'absent') counts[kind]++
    days.push({
      date: ymd,
      day: Number(ymd.slice(-2)),
      kind,
      isToday: ymd === opts.today,
    })
  }
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  return {
    month: opts.monthStart.slice(0, 7),
    monthLabel: `${monthNames[(ms || 1) - 1] || ''} ${ys || ''}`.trim(),
    days,
    counts,
  }
}
