/**
 * SecurityJob registration — must have completed 18 years (IST).
 */

import { misTodayIst } from '../mis/dates.js'

export const MIN_REGISTER_AGE = 18

export function dobToYmd(raw: string): string {
  const s = String(raw || '').trim()
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (dmy) return `${dmy[3]}-${String(dmy[2]).padStart(2, '0')}-${String(dmy[1]).padStart(2, '0')}`
  return ''
}

export function ageYearsFromDob(dob: string, todayYmd = misTodayIst()): number | null {
  const iso = dobToYmd(dob)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || !/^\d{4}-\d{2}-\d{2}$/.test(todayYmd)) return null
  const [y, m, d] = iso.split('-').map(Number)
  const [ty, tm, td] = todayYmd.split('-').map(Number)
  if (!y || !m || !d) return null
  let age = ty - y
  if (tm < m || (tm === m && td < d)) age -= 1
  return age
}

export function isAdultDob(dob: string, todayYmd = misTodayIst()): boolean {
  const age = ageYearsFromDob(dob, todayYmd)
  return age != null && age >= MIN_REGISTER_AGE
}

/** Latest DOB the form may accept (exactly 18 years ago today, IST). */
export function adultDobMaxYmd(todayYmd = misTodayIst()): string {
  const [y, m, d] = todayYmd.split('-').map(Number)
  return `${y - MIN_REGISTER_AGE}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
