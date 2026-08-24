/** Agile Live — individual week (Sunday change, 8/12 hrs, weekly off). */

import { liveRoomKey } from './branches.js'
import { foldLiveSite } from './duty-post.js'
import { addHoursHm, formatIstHm, istNow, istYmd, shiftCode } from './duty-window.js'

export const LIVE_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const DOW = LIVE_WEEKDAYS

/** Sunday is the normal weekly off unless the OM sets another day for that unit. */
export const LIVE_DEFAULT_WEEKLY_OFF = 0
const SHIFT_8 = ['A', 'G', 'B', 'C'] as const

export function liveWeekStart(at = istNow()): Date {
  const d = new Date(at.getFullYear(), at.getMonth(), at.getDate())
  d.setDate(d.getDate() - d.getDay())
  return d
}

export function liveWeekIndex(at = istNow()): number {
  const sun = liveWeekStart(at)
  const epoch = new Date(2026, 0, 4)
  return Math.round((sun.getTime() - epoch.getTime()) / (7 * 86400000))
}

export function liveMonthOffDates(offWeekday: number, monthStart: string, monthEnd: string): string[] {
  const off = liveWeeklyOffWeekday(offWeekday)
  const out: string[] = []
  const [ys, ms, ds] = monthStart.split('-').map(Number)
  const [ye, me, de] = monthEnd.split('-').map(Number)
  const cur = new Date(ys || 2026, (ms || 1) - 1, ds || 1)
  const end = new Date(ye || 2026, (me || 1) - 1, de || 1)
  while (cur.getTime() <= end.getTime()) {
    if (cur.getDay() === off) out.push(istYmd(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

export function liveUnitWoKey(branch: string, clientSite: string): string {
  return `${liveRoomKey(branch)}|${foldLiveSite(clientSite)}`
}

export function liveDutyHours(shiftRaw: string): 8 | 12 {
  const s = String(shiftRaw || '').trim()
  if (/^[ABGC]$/i.test(s) || /\bshift\s*[ABGC]\b/i.test(s)) return 8
  if (/\b8\s*(h|hr|hrs|hour)/i.test(s) || s === '8') return 8
  if (/\b12\s*(h|hr|hrs|hour)/i.test(s) || s === '12') return 12
  const clock = /(\d{1,2}):(\d{2})\s*[-–to]+\s*(\d{1,2}):(\d{2})/i.exec(s)
  if (clock) {
    const a = Number(clock[1]) * 60 + Number(clock[2])
    const b = Number(clock[3]) * 60 + Number(clock[4])
    let dur = b - a
    if (dur <= 0) dur += 24 * 60
    return dur >= 10 * 60 ? 12 : 8
  }
  return 12
}

/** Screen rank. HDFC sites are Facility Attendant. Do not say Guard except Armed Guard / Lady Guard. */
export function liveRankLabel(opts: { designation?: string; clientSite?: string }): string {
  const des = String(opts.designation || '')
  const site = String(opts.clientSite || '')
  const blob = `${des} ${site}`
  if (/armed/i.test(blob)) return 'Armed Guard'
  if (/lady|ladies|women.?guard|female.?guard/i.test(blob)) return 'Lady Guard'
  if (/hdfc/i.test(site) || /facility.?attendant/i.test(des)) return 'Facility Attendant'
  return 'Security Staff'
}

export function liveWeeklyOffWeekday(offWeekday?: number): number {
  const n = Number(offWeekday)
  if (Number.isInteger(n) && n >= 0 && n <= 6) return n
  return LIVE_DEFAULT_WEEKLY_OFF
}

/** HDFC 2FA: 7:00 AM–3:00 PM and 3:00 PM–11:00 PM. No night Facility Attendant. */
export function isLiveHdfc2fa(site: string, designation?: string): boolean {
  const blob = `${site} ${designation || ''}`
  return /hdfc/i.test(blob) || /facility.?attendant/i.test(designation || '')
}

export function liveWeekShift(opts: { shiftRaw: string; at?: Date; clientSite?: string; designation?: string }): {
  hours: 8 | 12
  code: string
  label: string
  startHm: string
  endHm: string
  hdfc2fa: boolean
} {
  const at = opts.at ?? istNow()
  const w = Math.abs(liveWeekIndex(at))
  if (isLiveHdfc2fa(opts.clientSite || '', opts.designation)) {
    const afternoon = w % 2 === 1
    const startHm = afternoon ? '15:00' : '07:00'
    const endHm = afternoon ? '23:00' : '15:00'
    return {
      hours: 8,
      code: afternoon ? 'P' : 'M',
      label: afternoon ? '3:00 PM – 11:00 PM' : '7:00 AM – 3:00 PM',
      startHm,
      endHm,
      hdfc2fa: true,
    }
  }
  const hours = liveDutyHours(opts.shiftRaw)
  if (hours === 8) {
    const rawCode = shiftCode(opts.shiftRaw)
    const start = SHIFT_8.includes(rawCode as (typeof SHIFT_8)[number])
      ? SHIFT_8.indexOf(rawCode as (typeof SHIFT_8)[number])
      : 0
    const code = SHIFT_8[(start + w) % 4] || 'A'
    const startHm = code === 'A' ? '06:00' : code === 'G' ? '14:00' : '22:00'
    return { hours, code, label: `Shift ${code}`, startHm, endHm: addHoursHm(startHm, 8), hdfc2fa: false }
  }
  const night = w % 2 === 1
  const startHm = night ? '20:00' : '08:00'
  return {
    hours: 12,
    code: night ? 'N' : 'D',
    label: night ? '12 hrs Night' : '12 hrs Day',
    startHm,
    endHm: addHoursHm(startHm, 12),
    hdfc2fa: false,
  }
}

/** Screen letter for the header: A / B / C / G (or Off). */
export function liveShiftLetter(code: string): string {
  const c = String(code || '').trim().toUpperCase()
  if (c === 'D' || c === 'M') return 'A'
  if (c === 'N') return 'B'
  if (c === 'P') return 'G'
  if (/^[ABCG]$/.test(c)) return c
  return 'A'
}

export function liveDutyTimeLine(opts: {
  off: boolean
  startHm?: string
  endHm?: string
  label?: string
}): string {
  if (opts.off) return 'Off Duty'
  if (opts.startHm && opts.endHm) return `${formatIstHm(opts.startHm)} – ${formatIstHm(opts.endHm)}`
  return opts.label || 'Duty'
}

export type LiveWeekDay = {
  ymd: string
  dow: string
  isToday: boolean
  isOff: boolean
}

export function livePersonWeek(opts: {
  idNo: string
  clientSite: string
  designation?: string
  shiftRaw: string
  at?: Date
  offWeekday?: number
}) {
  const at = opts.at ?? istNow()
  const sun = liveWeekStart(at)
  const todayYmd = istYmd(at)
  const offDow = liveWeeklyOffWeekday(opts.offWeekday)
  const shift = liveWeekShift({
    shiftRaw: opts.shiftRaw,
    at,
    clientSite: opts.clientSite,
    designation: opts.designation,
  })
  const rank = liveRankLabel({ designation: opts.designation, clientSite: opts.clientSite })
  const days: LiveWeekDay[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(sun)
    d.setDate(sun.getDate() + i)
    const ymd = istYmd(d)
    days.push({
      ymd,
      dow: DOW[i] || '',
      isToday: ymd === todayYmd,
      isOff: i === offDow,
    })
  }
  const today = days.find((d) => d.isToday) || days[0]
  const tomAt = new Date(at)
  tomAt.setDate(tomAt.getDate() + 1)
  const tom = liveWeekShift({
    shiftRaw: opts.shiftRaw,
    at: tomAt,
    clientSite: opts.clientSite,
    designation: opts.designation,
  })
  const tomOff = tomAt.getDay() === offDow
  const site = String(opts.clientSite || '').trim()
  const todayOff = Boolean(today?.isOff)
  return {
    weekStart: istYmd(sun),
    weekEnd: days[6]?.ymd || '',
    weekLabel: 'This week · duty changes every Sunday · Weekly off Sunday unless the unit sets another day',
    rank,
    hours: shift.hours,
    shiftCode: shift.code,
    shiftLabel: todayOff ? 'Off Duty' : shift.label,
    dutyStart: shift.startHm,
    dutyEnd: shift.endHm,
    hdfc2fa: shift.hdfc2fa,
    clientSite: site,
    todayOff,
    tomorrowOff: tomOff,
    todayShift: todayOff ? 'Off' : liveShiftLetter(shift.code),
    tomorrowShift: tomOff ? 'Off' : liveShiftLetter(tom.code),
    todayTime: liveDutyTimeLine({ off: todayOff, startHm: shift.startHm, endHm: shift.endHm, label: shift.label }),
    tomorrowTime: liveDutyTimeLine({ off: tomOff, startHm: tom.startHm, endHm: tom.endHm, label: tom.label }),
    todayLine: todayOff
      ? 'Off Duty'
      : [site, rank, shift.label, `${shift.hours} hrs`].filter(Boolean).join(' · '),
    days,
  }
}
