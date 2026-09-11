import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  extraTripFields,
  findSavedDailyTrip,
  lastClosingKm,
  saveOneDailyTrip,
} from '../_lib/fleet/daily-trip-save.js'
import { sendExpiredLicenseMail } from '../_lib/fleet/daily-trip-mail.js'
import { POST_TRIP_CHECKS, PRE_TRIP_CHECKS } from '../_lib/fleet/trip-fields.js'
import {
  expiredLicenseMessage,
  istYmd,
  licenseExpired,
  nextTripCode,
  resolvedTripLicense,
} from '../_lib/fleet/trip-code.js'
import {
  FLEET_BRANCHES,
  fleetNid,
  getDrivers,
  getInspections,
  getVehicles,
  type FleetInspection,
} from '../_lib/fleet/store.js'

function s(v: unknown, max: number) {
  return String(v ?? '').trim().slice(0, max)
}

function okBranch(name: string) {
  return FLEET_BRANCHES.some((b) => b.toLowerCase() === name.toLowerCase()) ? name : ''
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })

  const body = (req.method === 'POST' && req.body && typeof req.body === 'object' ? req.body : {}) as Record<
    string,
    unknown
  >
  const action = s(body.action || req.query?.action, 20) || 'boot'
  const branchId = okBranch(s(body.branchId || req.query?.branchId, 80))

  if (action === 'boot') {
    return res.status(200).json({
      ok: true,
      branches: FLEET_BRANCHES.slice(),
      preChecks: PRE_TRIP_CHECKS,
      postChecks: POST_TRIP_CHECKS,
    })
  }

  if (action === 'options') {
    if (!branchId) return res.status(400).json({ error: 'Pick a branch first.' })
    const date = s(body.date || req.query?.date, 20) || istYmd()
    const [vehicles, drivers, inspections] = await Promise.all([getVehicles(), getDrivers(), getInspections()])
    return res.status(200).json({
      ok: true,
      branchId,
      nextTripCode: nextTripCode(inspections, branchId, date),
      vehicles: vehicles
        .filter((v) => v.active !== false && v.branchId === branchId)
        .map((v) => ({
          regNo: v.regNo,
          vehicleName: v.vehicleName || v.makeModel || '',
          lastOdoReading: v.lastOdoReading || '',
          driverName: v.driverName || '',
        })),
      drivers: drivers
        .filter((d) => d.active !== false && d.branchId === branchId)
        .map((d) => ({ name: d.name, mobile: d.mobile, licenseValid: d.licenseValid || '' })),
    })
  }

  if (action === 'licenseAlert') {
    if (!branchId) return res.status(400).json({ error: 'Pick a branch first.' })
    const driverName = s(body.driverName, 80)
    const drivers = await getDrivers()
    const licenseValid = resolvedTripLicense(drivers, branchId, driverName, s(body.licenseValid, 20))
    if (!licenseExpired(licenseValid)) return res.status(200).json({ ok: true, blocked: false })
    await sendExpiredLicenseMail({
      branchId,
      driverName,
      licenseValid,
      regNo: s(body.regNo, 30),
    })
    return res.status(200).json({ ok: true, blocked: true, error: expiredLicenseMessage(driverName) })
  }

  if (action === 'save') {
    if (!branchId) return res.status(400).json({ error: 'Pick a branch first.' })
    const i = (body.inspection && typeof body.inspection === 'object' ? body.inspection : {}) as Record<string, unknown>
    const formType = s(i.formType, 30)
    if (formType !== 'pre-trip-4w' && formType !== 'post-trip-4w') {
      return res.status(400).json({ error: 'Save Pre-Trip or Post-Trip only.' })
    }
    const rec: FleetInspection = {
      id: String(i.id || fleetNid('in')),
      branchId,
      formType,
      date: s(i.date, 20),
      regNo: s(i.regNo, 30),
      location: s(i.location, 120),
      riderName: s(i.riderName, 80),
      licenseNo: s(i.licenseNo, 40),
      shift: s(i.shift, 20) || 'Morning',
      odoStart: s(i.odoStart, 20),
      odoEnd: s(i.odoEnd, 20),
      battery: s(i.battery, 20),
      items: Array.isArray(i.items)
        ? (i.items as Record<string, unknown>[]).slice(0, 60).map((x) => ({
            item: s(x.item, 120),
            status: s(x.status, 10) || 'OK',
            remarks: s(x.remarks, 200),
          }))
        : [],
      checkedBy: s(i.checkedBy, 80),
      ...extraTripFields(i),
      active: true,
      createdAt: s(i.createdAt, 40) || new Date().toISOString(),
    }
    if (!rec.date) return res.status(400).json({ error: 'Enter the date.' })
    if (!rec.regNo) return res.status(400).json({ error: 'Enter the vehicle number.' })
    if (!rec.riderName) return res.status(400).json({ error: 'Enter the driver name.' })
    if (!rec.checkedBy) return res.status(400).json({ error: 'Enter Checked By.' })
    const out = await saveOneDailyTrip(rec)
    if (!out.ok) {
      return res.status(400).json({ error: out.error, licenseBlocked: !!out.licenseBlocked })
    }
    return res.status(200).json({
      ok: true,
      emailSent: out.emailSent,
      id: out.rec.id,
      tripCode: out.rec.tripCode || '',
    })
  }

  if (action === 'recall') {
    if (!branchId) return res.status(400).json({ error: 'Pick a branch first.' })
    const regNo = s(body.regNo, 30)
    const date = s(body.date, 20)
    const tripNo = s(body.tripNo, 8) || s(body.shift, 20) || '1'
    if (!regNo || !date) return res.status(400).json({ error: 'Pick date and vehicle.' })
    const rows = await getInspections()
    const found = findSavedDailyTrip(rows, branchId, date, regNo, tripNo)
    return res.status(200).json({
      ok: true,
      pre: found.pre || null,
      post: found.post || null,
      lastCloseKm: lastClosingKm(rows, branchId, regNo, date, tripNo),
    })
  }

  return res.status(400).json({ error: 'Unknown action.' })
}
