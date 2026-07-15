const IST_OFFSET_MIN = 5 * 60 + 30

/** Current clock in India (IST). */
export function istNow(): Date {
  const utcMs = Date.now() + new Date().getTimezoneOffset() * 60000
  return new Date(utcMs + IST_OFFSET_MIN * 60000)
}

/** Today's MIS report date in YYYY-MM-DD (India time). */
export function misTodayIst(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

/** Yesterday's MIS report date in YYYY-MM-DD (India time). */
export function misYesterdayIst(): string {
  return new Date(Date.now() - 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

/** Monday of the week containing `dateFor` (YYYY-MM-DD). */
export function misWeekStartMonday(dateFor: string): string {
  const d = new Date(`${dateFor}T12:00:00`)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

/** True if an ISO timestamp falls on today's calendar date in India. */
export function isSubmittedTodayIst(iso: string): boolean {
  if (!iso) return false
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) === misTodayIst()
}

/** 4:00 PM IST on the report date — late submissions before this still count for daily performance. */
export function misGraceDeadlineUtc(dateFor: string): number {
  return new Date(`${dateFor}T10:30:00.000Z`).getTime()
}

/** True when submitted same calendar day by 4:00 PM IST (includes on-time by 2 PM). */
export function isExcusedLateMisSubmission(dateFor: string, submittedAtIso: string): boolean {
  if (!dateFor || !submittedAtIso) return false
  const submittedDay = new Date(submittedAtIso).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  if (submittedDay !== dateFor) return false
  return new Date(submittedAtIso).getTime() <= misGraceDeadlineUtc(dateFor)
}

/** Daily branch performance counts only when MIS is submitted by 4:00 PM IST on the report date. */
export function countsForMisDailyPerformance(dateFor: string, submittedAtIso: string | undefined): boolean {
  if (!submittedAtIso) return false
  return isExcusedLateMisSubmission(dateFor, submittedAtIso)
}

/** 2:00 PM IST on the report date (stored as UTC instant for comparisons). */
export function misDeadlineUtc(dateFor: string): number {
  return new Date(`${dateFor}T08:30:00.000Z`).getTime()
}

/** True when submitted on time for `dateFor` — same day by 2:00 PM IST, not a later calendar day. */
export function isOnTimeMisSubmission(dateFor: string, submittedAtIso: string): boolean {
  if (!dateFor || !submittedAtIso) return false
  const submittedDay = new Date(submittedAtIso).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  if (submittedDay > dateFor) return false
  if (submittedDay < dateFor) return true
  return new Date(submittedAtIso).getTime() <= misDeadlineUtc(dateFor)
}
