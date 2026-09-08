import { sendDailyTripMail, sendExpiredLicenseMail, sendNewDriverMail } from './daily-trip-mail.js'
import { fleetNid, getDrivers, getInspections, saveInspections, type FleetInspection } from './store.js'
import {
  allocateTripCode,
  expiredLicenseMessage,
  isKnownTripDriver,
  licenseExpired,
  resolvedTripLicense,
} from './trip-code.js'

function s(v: unknown, max: number) {
  return String(v ?? '').trim().slice(0, max)
}

export function tripNoOf(row: { tripNo?: string; shift?: string } | null | undefined): '1' | '2' | '3' {
  const n = String(row?.tripNo || '').trim()
  if (n === '2' || n === '3') return n
  if (n === '1') return '1'
  if (row?.shift === 'Afternoon') return '2'
  if (row?.shift === 'Night') return '3'
  return '1'
}

export function dailyTripKey(
  row: Pick<FleetInspection, 'branchId' | 'date' | 'formType' | 'regNo'> & { tripNo?: string; shift?: string },
) {
  return [row.branchId, row.date, row.formType, String(row.regNo || '').toUpperCase(), 'T' + tripNoOf(row)].join('|')
}

export function findSavedDailyTrip(
  rows: FleetInspection[],
  branchId: string,
  date: string,
  regNo: string,
  tripNo: string,
) {
  const slot = tripNoOf({ tripNo })
  const preKey = dailyTripKey({ branchId, date, formType: 'pre-trip-4w', regNo, tripNo: slot })
  const postKey = dailyTripKey({ branchId, date, formType: 'post-trip-4w', regNo, tripNo: slot })
  return {
    pre: rows.find((x) => x.active !== false && dailyTripKey(x) === preKey),
    post: rows.find((x) => x.active !== false && dailyTripKey(x) === postKey),
  }
}

export function lastClosingKm(
  rows: FleetInspection[],
  branchId: string,
  regNo: string,
  date: string,
  tripNo: string,
): string {
  const want = String(regNo || '').toUpperCase()
  const rank = Number(tripNoOf({ tripNo }))
  const hits = rows
    .filter((x) => {
      if (x.active === false) return false
      if (x.branchId !== branchId) return false
      if (String(x.regNo || '').toUpperCase() !== want) return false
      if (!String(x.odoEnd || '').trim()) return false
      if (x.date < date) return true
      if (x.date === date && Number(tripNoOf(x)) < rank) return true
      return false
    })
    .sort((a, b) => {
      const byDate = String(b.date || '').localeCompare(String(a.date || ''))
      if (byDate) return byDate
      const byTrip = Number(tripNoOf(b)) - Number(tripNoOf(a))
      if (byTrip) return byTrip
      const postFirst = (b.formType === 'post-trip-4w' ? 1 : 0) - (a.formType === 'post-trip-4w' ? 1 : 0)
      if (postFirst) return postFirst
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
    })
  return String(hits[0]?.odoEnd || '').trim()
}

export const PRE_TRIP_LOCKED_MSG =
  'Pre-Trip already saved. You can see it, but you cannot change it. Fill Post-Trip only.'

export function extraTripFields(i: Record<string, unknown>) {
  return {
    tripNo: tripNoOf({ tripNo: s(i.tripNo, 8), shift: s(i.shift, 20) }),
    driverMobile: s(i.driverMobile, 20),
    startTime: s(i.startTime, 16),
    endTime: s(i.endTime, 40),
    licenseValid: s(i.licenseValid, 20),
    tripCode: s(i.tripCode, 40),
    dieselLevel: s(i.dieselLevel, 40),
    destination: s(i.destination, 120),
    purpose: s(i.purpose, 120),
    kmRun: s(i.kmRun, 20),
    fuelQty: s(i.fuelQty, 20),
    fuelAmount: s(i.fuelAmount, 20),
    incident: s(i.incident, 400),
    tripRemarks: s(i.tripRemarks, 400),
  }
}

export async function saveOneDailyTrip(rec: FleetInspection): Promise<
  | { ok: true; rec: FleetInspection; emailSent: boolean }
  | { ok: false; error: string; licenseBlocked?: boolean }
> {
  const drivers = await getDrivers()
  rec.licenseValid = resolvedTripLicense(drivers, rec.branchId, rec.riderName, rec.licenseValid || '')
  const isNew = !isKnownTripDriver(drivers, rec.branchId, rec.riderName)
  if (isNew && !String(rec.licenseValid || '').trim()) {
    return { ok: false, error: 'Enter the new driver name and license expiry date.' }
  }
  if (isNew) {
    try {
      await sendNewDriverMail({
        branchId: rec.branchId,
        driverName: rec.riderName,
        licenseValid: rec.licenseValid || '',
        regNo: rec.regNo,
      })
    } catch {
      /* still save / still check expiry */
    }
  }
  if (licenseExpired(rec.licenseValid || '')) {
    try {
      await sendExpiredLicenseMail({
        branchId: rec.branchId,
        driverName: rec.riderName,
        licenseValid: rec.licenseValid || '',
        regNo: rec.regNo,
      })
    } catch {
      /* still block */
    }
    return { ok: false, error: expiredLicenseMessage(rec.riderName), licenseBlocked: true }
  }
  const prev = await getInspections()
  const key = dailyTripKey(rec)
  const existing = prev.find((x) => x.active !== false && dailyTripKey(x) === key)
  if (existing && rec.formType === 'pre-trip-4w') {
    return { ok: false, error: PRE_TRIP_LOCKED_MSG }
  }
  rec.tripCode = allocateTripCode(prev, { ...rec, tripCode: rec.tripCode || existing?.tripCode || '' })
  const saved: FleetInspection = existing
    ? { ...rec, id: existing.id || rec.id || fleetNid('in'), createdAt: existing.createdAt || rec.createdAt }
    : { ...rec, id: rec.id || fleetNid('in') }
  const next = existing ? prev.map((x) => (x.id === saved.id ? saved : x)) : prev.concat([saved])
  await saveInspections(next)
  let emailSent = false
  try {
    emailSent = (await sendDailyTripMail(saved)).ok
  } catch {
    emailSent = false
  }
  return { ok: true, rec: saved, emailSent }
}
