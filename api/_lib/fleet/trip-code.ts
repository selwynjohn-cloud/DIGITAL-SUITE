import type { FleetDriver, FleetInspection } from './store.js'

export function istYmd(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(now)
  let dd = '00'
  let mo = '00'
  let yy = ''
  for (const p of parts) {
    if (p.type === 'day') dd = p.value
    if (p.type === 'month') mo = p.value
    if (p.type === 'year') yy = p.value
  }
  return `${yy}-${mo}-${dd}`
}

/** First three letters of the branch name — Chennai → CHE. */
export function branchTripLetters(branch: string): string {
  const letters = String(branch || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
  return (letters + 'XXX').slice(0, 3)
}

export function tripCodeDatePart(iso: string): string {
  const p = String(iso || '').split('-')
  if (p.length === 3 && p[0].length === 4) return `${p[2]}-${p[1]}-${p[0]}`
  return String(iso || '')
}

export function formatTripCode(branch: string, seq: number, dateIso: string): string {
  const n = Math.max(1, Math.floor(Number(seq) || 1))
  return `${branchTripLetters(branch)}/${String(n).padStart(4, '0')}/${tripCodeDatePart(dateIso)}`
}

export function tripCodeSeq(code: string, branch: string): number {
  const letters = branchTripLetters(branch)
  const raw = String(code || '').trim().toUpperCase()
  if (!raw.startsWith(letters + '/')) return 0
  const rest = raw.slice(letters.length + 1)
  const num = rest.slice(0, 4)
  const n = parseInt(num, 10)
  return Number.isFinite(n) ? n : 0
}

export function lastTripSeq(rows: { branchId?: string; tripCode?: string }[], branch: string): number {
  let max = 0
  for (const r of rows) {
    if (String(r.branchId || '').trim() !== branch) continue
    const n = tripCodeSeq(String(r.tripCode || ''), branch)
    if (n > max) max = n
  }
  return max
}

export function nextTripCode(
  rows: { branchId?: string; tripCode?: string }[],
  branch: string,
  dateIso: string,
): string {
  return formatTripCode(branch, lastTripSeq(rows, branch) + 1, dateIso)
}

export function refreshTripCodeDate(code: string, branch: string, dateIso: string): string {
  const seq = tripCodeSeq(code, branch)
  if (!seq) return nextTripCode([], branch, dateIso)
  return formatTripCode(branch, seq, dateIso)
}

function sameTripFamily(a: FleetInspection, b: Pick<FleetInspection, 'branchId' | 'date' | 'regNo'> & { tripNo?: string; shift?: string }) {
  const trip = (row: { tripNo?: string; shift?: string }) => {
    const n = String(row.tripNo || '').trim()
    if (n === '2' || n === '3' || n === '1') return n
    if (row.shift === 'Afternoon') return '2'
    if (row.shift === 'Night') return '3'
    return '1'
  }
  return (
    a.active !== false &&
    a.branchId === b.branchId &&
    a.date === b.date &&
    String(a.regNo || '').toUpperCase() === String(b.regNo || '').toUpperCase() &&
    trip(a) === trip(b)
  )
}

export function allocateTripCode(rows: FleetInspection[], rec: FleetInspection): string {
  if (rec.tripCode && tripCodeSeq(rec.tripCode, rec.branchId)) {
    return refreshTripCodeDate(rec.tripCode, rec.branchId, rec.date)
  }
  const sibling = rows.find((x) => sameTripFamily(x, rec) && x.tripCode)
  if (sibling?.tripCode) return refreshTripCodeDate(sibling.tripCode, rec.branchId, rec.date)
  return nextTripCode(rows, rec.branchId, rec.date)
}

export function licenseExpired(ymd: string, today = istYmd()): boolean {
  const t = String(ymd || '').trim()
  if (t.length < 10) return false
  return t < today
}

export function isKnownTripDriver(drivers: FleetDriver[], branchId: string, name: string): boolean {
  const want = String(name || '').trim().toLowerCase()
  if (!want) return false
  return drivers.some(
    (d) =>
      d.active !== false &&
      String(d.branchId || '').trim() === branchId &&
      String(d.name || '').trim().toLowerCase() === want,
  )
}

export function driverLicenseOnFile(drivers: FleetDriver[], branchId: string, name: string): string {
  const want = String(name || '').trim().toLowerCase()
  if (!want) return ''
  const hit = drivers.find(
    (d) =>
      d.active !== false &&
      String(d.branchId || '').trim() === branchId &&
      String(d.name || '').trim().toLowerCase() === want,
  )
  return String(hit?.licenseValid || '').trim()
}

export function resolvedTripLicense(
  drivers: FleetDriver[],
  branchId: string,
  driverName: string,
  typed: string,
): string {
  return driverLicenseOnFile(drivers, branchId, driverName) || String(typed || '').trim()
}

export function expiredLicenseMessage(driverName: string): string {
  const name = String(driverName || '').trim() || 'Driver'
  return `${name} please renew your license. You will not be permitted to drive any vehicles. Please handover the vehicle key to HOD.`
}
