import { REPORT_EARLY_MIN } from './types.js'

const DEFAULT_SHIFT_START: Record<string, string> = {
  A: '06:00',
  G: '14:00',
  B: '22:00',
  C: '22:00',
}

export function istNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
}

export function istYmd(at = istNow()): string {
  const y = at.getFullYear()
  const m = String(at.getMonth() + 1).padStart(2, '0')
  const d = String(at.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function istYmdFromIso(iso: string): string {
  const raw = String(iso || '').trim()
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ''
  return istYmd(new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })))
}

export function istMonthStart(at = istNow()): string {
  return `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-01`
}

export function istMonthEnd(at = istNow()): string {
  return istYmd(new Date(at.getFullYear(), at.getMonth() + 1, 0))
}

function parseHm(hm: string): { h: number; m: number } | null {
  const x = /^(\d{1,2}):(\d{2})$/.exec(String(hm || '').trim())
  if (!x) return null
  return { h: Number(x[1]), m: Number(x[2]) }
}

export function shiftCode(raw: string): string {
  const s = String(raw || '').trim().toUpperCase()
  if (/^[ABGC]$/.test(s)) return s
  if (/morning|^a\b|day/i.test(s)) return 'A'
  if (/general|^g\b|afternoon/i.test(s)) return 'G'
  if (/night|^b\b/i.test(s)) return 'B'
  return 'A'
}

/** Duty start clock (HH:MM IST) from roster text. */
export function shiftStartHm(shiftRaw: string): string {
  const clock = /(\d{1,2}):(\d{2})/.exec(String(shiftRaw || ''))
  if (clock) {
    const h = Math.min(23, Math.max(0, Number(clock[1])))
    const m = Math.min(59, Math.max(0, Number(clock[2])))
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  return DEFAULT_SHIFT_START[shiftCode(shiftRaw)] || '06:00'
}

export function addHoursHm(hm: string, hours: number): string {
  const p = parseHm(hm)
  if (!p) return hm
  let total = p.h * 60 + p.m + Math.round(hours * 60)
  while (total < 0) total += 24 * 60
  total %= 24 * 60
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function subtractMinutesHm(hm: string, minutes: number): string {
  const p = parseHm(hm)
  if (!p) return hm
  let total = p.h * 60 + p.m - minutes
  while (total < 0) total += 24 * 60
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function reportByHm(shiftRaw: string): string {
  return subtractMinutesHm(shiftStartHm(shiftRaw), REPORT_EARLY_MIN)
}

export type LiveShiftCode = 'A' | 'B' | 'C' | 'G'

/** Clock + client sanctioned A / G / B / C (MIS book). Night C is 22:00. */
export function autoLiveShift(opts?: {
  at?: Date
  sanA?: number
  sanG?: number
  sanB?: number
  sanC?: number
}): { code: LiveShiftCode; label: string; startHm: string; hours: 8 } {
  const at = opts?.at ?? istNow()
  const mins = at.getHours() * 60 + at.getMinutes()
  const a = Number(opts?.sanA) > 0
  const g = Number(opts?.sanG) > 0
  const b = Number(opts?.sanB) > 0
  const c = Number(opts?.sanC) > 0
  const morning = mins >= 6 * 60 && mins < 14 * 60
  const afternoon = mins >= 14 * 60 && mins < 22 * 60
  if (morning) {
    if (a || !g) return { code: 'A', label: 'Shift A', startHm: '06:00', hours: 8 }
    return { code: 'G', label: 'Shift G', startHm: '14:00', hours: 8 }
  }
  if (afternoon) {
    if (g || !b) return { code: 'G', label: 'Shift G', startHm: '14:00', hours: 8 }
    return { code: 'B', label: 'Shift B', startHm: '22:00', hours: 8 }
  }
  if (c) return { code: 'C', label: 'Shift C', startHm: '22:00', hours: 8 }
  if (b) return { code: 'B', label: 'Shift B', startHm: '22:00', hours: 8 }
  return { code: 'C', label: 'Shift C', startHm: '22:00', hours: 8 }
}

export function minutesAfterHm(hm: string, at: Date): number {
  const p = parseHm(hm)
  if (!p) return 0
  const sched = new Date(at)
  sched.setHours(p.h, p.m, 0, 0)
  let mins = Math.round((at.getTime() - sched.getTime()) / 60000)
  if (p.h >= 18 && at.getHours() < 12 && mins < -6 * 60) {
    sched.setDate(sched.getDate() - 1)
    mins = Math.round((at.getTime() - sched.getTime()) / 60000)
  }
  return mins
}

export function formatIstHm(hm: string): string {
  const p = parseHm(hm)
  if (!p) return hm
  const ampm = p.h >= 12 ? 'PM' : 'AM'
  const h12 = p.h % 12 || 12
  return `${h12}:${String(p.m).padStart(2, '0')} ${ampm}`
}

export function kmBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function liveDutyWindow(shiftRaw: string, at = istNow()) {
  const dutyStart = shiftStartHm(shiftRaw)
  const reportBy = reportByHm(shiftRaw)
  const lateMin = minutesAfterHm(reportBy, at)
  const minutesAfterDuty = minutesAfterHm(dutyStart, at)
  return {
    dutyStart,
    reportBy,
    dutyStartLabel: formatIstHm(dutyStart),
    reportByLabel: formatIstHm(reportBy),
    minutesAfterReport: lateMin,
    minutesAfterDuty,
    isLateForReport: lateMin > 0,
    isLateForDuty: minutesAfterDuty > 0,
    earlyMinutes: REPORT_EARLY_MIN,
  }
}

/** Director: End Duty before the shift is finished. */
export function earlyDutyHoursMessage(minutesEarly: number): string {
  if (minutesEarly <= 0) return ''
  const hrs = Math.round((minutesEarly / 60) * 10) / 10
  const shown = hrs < 0.1 ? 0.1 : hrs
  return `You have ended duty early — ${shown} hrs.`
}

/** Director: message only — no Late Start button. */
export function lateDutyHoursMessage(minutesLate: number): string {
  const base = 'You have started the duty late today and it is reported late for the duty.'
  if (minutesLate <= 0) return base
  const hrs = Math.round((minutesLate / 60) * 10) / 10
  const shown = hrs < 0.1 ? 0.1 : hrs
  return `${base} — ${shown} hrs late.`
}
