import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import { isSuperAdminEmail } from '../_lib/auth.js'
import { isHodUser } from '../_lib/mis/digest.js'
import { getUsers as getMisUsers, getBranches as getMisBranches, getActiveBranch } from '../_lib/mis/store.js'
import { buildConsolidatedDirectorReport, buildWeeklyAnalysisEmail, sendWeeklyAnalysis } from '../_lib/fleet/analysis.js'
import { normalizeWeeklyEntry } from '../_lib/fleet/stats.js'
import {
  currentWeekLabel,
  FLEET_BRANCHES,
  defaultSeedDrivers,
  defaultSeedUsers,
  defaultSeedVehicles,
  fleetNid,
  fleetNum,
  fleetReportCode,
  fleetStorageOk,
  getDrivers,
  getInspections,
  getReports,
  getUsers,
  getVehicles,
  normalizeDriver,
  normalizeReport,
  normalizeUser,
  normalizeVehicle,
  saveDrivers,
  saveInspections,
  saveReports,
  saveUsers,
  saveVehicles,
  type FleetInspection,
  type FleetWeeklyReport,
  type FleetUser,
} from '../_lib/fleet/store.js'

function fleetBranchFromMis(misBranchId: string, misBranches: { id: string; name: string }[]): string | null {
  const hit = misBranches.find((b) => b.id === misBranchId || b.name === misBranchId)
  const name = hit?.name || misBranchId
  if (FLEET_BRANCHES.includes(name as (typeof FLEET_BRANCHES)[number])) return name
  if (/hyderabad|hi-tech/i.test(name)) return 'Hyderabad'
  if (/visakhapatnam|vizag/i.test(name)) return 'Visakhapatnam'
  if (/nellore/i.test(name)) return 'Nellore'
  if (/karnataka|bangalore|gulbarga/i.test(name)) return name.includes('Gulbarga') ? 'Gulbarga' : 'Bangalore'
  if (/kerala|kochi/i.test(name)) return 'Corporate Office'
  if (/mumbai|maharashtra/i.test(name)) return 'Mumbai'
  if (/chennai|tamil|pondicherry|puducherry/i.test(name)) return 'Chennai'
  if (/vijayawada/i.test(name)) return 'Vijayawada'
  if (/kakinada/i.test(name)) return 'Kakinada'
  if (/corporate/i.test(name)) return 'Corporate Office'
  const fuzzy = FLEET_BRANCHES.find(
    (f) => name.toLowerCase().includes(f.toLowerCase()) || f.toLowerCase().includes(name.toLowerCase()),
  )
  return fuzzy || null
}

async function resolveFleetUser(
  email: string,
  sessionRole: 'staff' | 'management',
  fleetUsers: FleetUser[],
  misUsers: Awaited<ReturnType<typeof getMisUsers>>,
  misBranches: { id: string; name: string }[],
): Promise<{ role: 'admin' | 'branch'; branch: string | null; name: string; email: string } | null> {
  const em = email.trim().toLowerCase()
  if (!em.includes('@')) return null

  if (isSuperAdminEmail(email)) {
    return { role: 'admin', branch: null, name: 'Director', email }
  }

  if (sessionRole === 'management') {
    const admin = fleetUsers.find(
      (u) => u.active && u.role === 'admin' && u.email.trim().toLowerCase() === em,
    )
    if (admin) return { role: 'admin', branch: null, name: admin.name || email, email }
    return null
  }

  const branchUser = fleetUsers.find(
    (u) => u.active && u.role === 'branch' && u.email.trim().toLowerCase() === em,
  )
  if (branchUser?.branchId) {
    const activeMis = misBranches.some(
      (b) => fleetBranchFromMis(b.id, misBranches) === branchUser.branchId,
    )
    if (!activeMis) return null
    return { role: 'branch', branch: branchUser.branchId, name: branchUser.name || email, email }
  }

  const mu = misUsers.find((u) => u.email?.trim().toLowerCase() === em && u.active !== false)
  if (mu && isHodUser(mu)) {
    const misBranch = await getActiveBranch(mu.branchId || '')
    if (!misBranch) return null
    const branch = fleetBranchFromMis(misBranch.id, misBranches)
    if (branch) return { role: 'branch', branch, name: mu.name || email, email }
  }

  return null
}

function effectiveBranch(
  user: { role: 'admin' | 'branch'; branch: string | null },
  branchIdFromBody: string,
): string | null {
  if (user.role === 'admin') return branchIdFromBody || null
  const locked = user.branch
  if (!locked) return null
  if (branchIdFromBody && branchIdFromBody !== locked) return null
  return locked
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = (req.body ?? {}) as Record<string, unknown>
  const action = String(body.action ?? '')

  if (action === 'status') return res.status(200).json({ ok: true, storage: fleetStorageOk() })

  let users = await getUsers()
  users = users.map((u) => normalizeUser(u))
  if (users.length === 0 && fleetStorageOk()) {
    users = defaultSeedUsers()
    await saveUsers(users)
  }

  const otpSession = await verifyAppSession(String(body.sessionToken ?? ''), 'fleet')
  if (!otpSession) return res.status(401).json({ error: 'Please sign in with your @agilegroup.co.in email OTP.' })

  const misUsers = await getMisUsers()
  const branches = await getMisBranches(true)

  const fleetUser = await resolveFleetUser(
    otpSession.email,
    otpSession.role,
    users,
    misUsers,
    branches,
  )
  if (!fleetUser) {
    if (otpSession.role === 'staff') {
      const mu = misUsers.find((u) => u.email?.trim().toLowerCase() === otpSession.email && u.active !== false)
      if (mu && isHodUser(mu) && !(await getActiveBranch(mu.branchId || ''))) {
        return res.status(403).json({
          error:
            'This branch is deactivated. Only activated branch teams can access the portal. Contact management.',
        })
      }
    }
    return res.status(403).json({
      error:
        otpSession.role === 'management'
          ? 'Management access only for Director or Fleet administrators listed in User Management.'
          : 'Branch access only for registered branch staff or HODs. Contact Head Office to add your email.',
    })
  }

  const branchIdFromBody = String(body.branchId ?? '').trim()
  const branch = effectiveBranch(fleetUser, branchIdFromBody)
  if (fleetUser.role === 'branch' && branchIdFromBody && !branch) {
    return res.status(403).json({ error: 'You can only access your own branch (' + fleetUser.branch + ').' })
  }
  const role = fleetUser.role
  if (role === 'branch' && !branch && (action === 'login' || action === 'load' || action === 'saveDrivers' || action === 'saveReports' || action === 'saveVehicles' || action === 'saveInspections')) {
    return res.status(400).json({ error: 'Your branch could not be determined. Contact Head Office.' })
  }

  if (action === 'login' || action === 'load') {
    let [vehicles, drivers, reports, inspections] = await Promise.all([
      getVehicles(),
      getDrivers(),
      getReports(),
      getInspections(),
    ])
    vehicles = vehicles.map((v) => normalizeVehicle(v))
    drivers = drivers.map((d) => normalizeDriver(d))
    reports = reports.map((r) => normalizeReport(r))
    if (vehicles.length === 0 && role === 'admin') {
      vehicles = defaultSeedVehicles()
      await saveVehicles(vehicles)
    }
    if (drivers.length === 0 && role === 'admin') {
      drivers = defaultSeedDrivers()
      await saveDrivers(drivers)
    }
    if (role === 'branch') {
      inspections = inspections.filter((i) => i.branchId === branch && i.active)
    }
    const payload: Record<string, unknown> = {
      ok: true,
      role,
      branch,
      name: fleetUser.name,
      email: fleetUser.email,
      lockedBranch: role === 'branch' ? branch : null,
      vehicles,
      drivers,
      reports,
      inspections,
    }
    if (role === 'admin') payload.users = users
    const fleetBranches = [
      ...new Set(
        branches
          .map((b) => fleetBranchFromMis(b.id, branches))
          .filter((x): x is string => Boolean(x)),
      ),
    ]
    if (fleetBranches.length) payload.fleetBranches = fleetBranches
    return res.status(200).json(payload)
  }

  if (!fleetStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
  const s = (v: unknown, n = 200) => String(v ?? '').slice(0, n)

  if (action === 'saveUsers') {
    if (role !== 'admin') return res.status(403).json({ error: 'Only management can edit users.' })
    const arr = Array.isArray(body.users) ? body.users : []
    const list = arr.slice(0, 500).map((u: Record<string, unknown>) =>
      normalizeUser({
        id: String(u.id || fleetNid('us')),
        name: s(u.name, 80),
        email: s(u.email, 120),
        mobile: s(u.mobile, 20),
        role: s(u.role, 10) === 'admin' ? 'admin' : 'branch',
        userType: (['director', 'admin', 'hod', 'staff'].includes(s(u.userType, 10))
          ? s(u.userType, 10)
          : s(u.role, 10) === 'admin'
            ? 'admin'
            : 'hod') as 'director' | 'admin' | 'hod' | 'staff',
        branchId: s(u.branchId, 80),
        password: s(u.password, 80),
        active: u.active !== false,
        deactivateReason: s(u.deactivateReason, 200),
        remarks: s(u.remarks, 400),
        createdAt: s(u.createdAt, 40) || new Date().toISOString(),
      }),
    )
    await saveUsers(list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  if (action === 'saveVehicles') {
    if (role !== 'admin') return res.status(403).json({ error: 'Vehicle data is maintained in Management Portal only.' })
    const arr = Array.isArray(body.vehicles) ? body.vehicles : []
    const list = arr.slice(0, 2000).map((v: Record<string, unknown>) =>
      normalizeVehicle({
        id: String(v.id || fleetNid('vh')),
        branchId: s(v.branchId, 80),
        vehicleName: s(v.vehicleName, 80),
        regNo: s(v.regNo, 30),
        chassisNo: s(v.chassisNo, 40),
        engineNo: s(v.engineNo, 40),
        vehicleType: s(v.vehicleType, 20) || '4-Wheeler',
        makeModel: s(v.makeModel, 80) || s(v.vehicleName, 80),
        manufacturer: s(v.manufacturer, 80),
        fuelType: s(v.fuelType, 20) || 'Diesel',
        driverName: s(v.driverName, 80),
        driverMobile: s(v.driverMobile, 20),
        licenseNo: s(v.licenseNo, 40),
        licenseValid: s(v.licenseValid, 20),
        insuranceValid: s(v.insuranceValid, 20),
        insuranceIssueDate: s(v.insuranceIssueDate, 20),
        insurancePolicyNo: s(v.insurancePolicyNo, 60),
        insuranceCompany: s(v.insuranceCompany, 80),
        insuranceClaim: s(v.insuranceClaim, 500),
        pucValid: s(v.pucValid, 20),
        pucIssueDate: s(v.pucIssueDate, 20),
        dateOfPurchase: s(v.dateOfPurchase, 20),
        tyresCondition: s(v.tyresCondition, 80),
        batteryCondition: s(v.batteryCondition, 80),
        vehicleCondition: s(v.vehicleCondition, 40) || 'Good',
        damageNote: s(v.damageNote, 500),
        lastServiceDate: s(v.lastServiceDate, 20),
        nextServiceDue: s(v.nextServiceDue, 20),
        nextServiceKm: s(v.nextServiceKm, 20),
        lastOdoReading: s(v.lastOdoReading, 20),
        majorAccident: s(v.majorAccident, 500),
        deactivateReason: s(v.deactivateReason, 200),
        active: v.active !== false,
        remarks: s(v.remarks, 400),
        createdAt: s(v.createdAt, 40) || new Date().toISOString(),
      }),
    )
    await saveVehicles(list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  if (action === 'saveDrivers') {
    if (role !== 'admin') return res.status(403).json({ error: 'Driver data is maintained in Management Portal only.' })
    const arr = Array.isArray(body.drivers) ? body.drivers : []
    const list = arr.slice(0, 3000).map((d: Record<string, unknown>) =>
      normalizeDriver({
        id: String(d.id || fleetNid('dr')),
        branchId: s(d.branchId, 80),
        name: s(d.name, 80),
        mobile: s(d.mobile, 20),
        licenseNo: s(d.licenseNo, 40),
        licenseIssueDate: s(d.licenseIssueDate, 20),
        licenseValid: s(d.licenseValid, 20),
        licenseType: s(d.licenseType, 20) || 'LMV',
        medicalFitness: s(d.medicalFitness, 20),
        trafficPenaltyWeek: s(d.trafficPenaltyWeek, 40),
        badgeNo: s(d.badgeNo, 40),
        active: d.active !== false,
        deactivateReason: s(d.deactivateReason, 200),
        remarks: s(d.remarks, 400),
        createdAt: s(d.createdAt, 40) || new Date().toISOString(),
      }),
    )
    await saveDrivers(list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  if (action === 'saveReports') {
    const arr = Array.isArray(body.reports) ? body.reports : []
    const prev = await getReports()
    const list: FleetWeeklyReport[] = arr.slice(0, 5000).map((r: Record<string, unknown>) => {
      const id = String(r.id || fleetNid('wr'))
      const branchId = role === 'branch' ? (branch ?? '') : s(r.branchId, 80)
      const weekNo = s(r.weekNo, 20)
      return normalizeReport({
        id,
        reportCode: s(r.reportCode, 40) || fleetReportCode(branchId, weekNo, id),
        branchId,
        weekNo,
        fromDate: s(r.fromDate, 20),
        toDate: s(r.toDate, 20),
        submittedBy: s(r.submittedBy, 120),
        submittedAt: s(r.submittedAt, 40) || new Date().toISOString(),
        entries: Array.isArray(r.entries)
          ? (r.entries as Record<string, unknown>[]).slice(0, 100).map((e) => normalizeWeeklyEntry(e))
          : [],
        active: r.active !== false,
      })
    })
    const final = role === 'branch' ? list.concat(prev.filter((p) => p.branchId !== branch)) : list
    await saveReports(final)

    // Auto-send vehicle analysis to branch with Director CC (new submission only).
    let emailSent = false
    if (role === 'branch') {
      const added = list.filter((r) => !prev.some((p) => p.id === r.id))
      if (added.length >= 1) {
        const [vehicles, drivers] = await Promise.all([
          getVehicles().then((v) => v.map((x) => normalizeVehicle(x))),
          getDrivers().then((d) => d.map((x) => normalizeDriver(x))),
        ])
        const mail = await sendWeeklyAnalysis(added[added.length - 1], vehicles, drivers, final)
        emailSent = mail.ok
      }
    }

    return res.status(200).json({ ok: true, count: final.length, analysisEmail: emailSent })
  }

  if (action === 'previewEmail') {
    if (role !== 'admin') {
      const kind = String(body.kind ?? 'hod')
      if (kind !== 'hod' || !branch) {
        return res.status(403).json({ error: 'Consolidated report preview is for Management only.' })
      }
    }
    const kind = String(body.kind ?? 'hod')
    const weekNo = s(body.weekNo, 20) || currentWeekLabel()
    const branchId = role === 'branch' ? (branch ?? '') : s(body.branchId, 80) || 'Hyderabad'
    const [rawVehicles, rawDrivers, rawReports] = await Promise.all([getVehicles(), getDrivers(), getReports()])
    const vehicles = rawVehicles.map((v) => normalizeVehicle(v))
    const drivers = rawDrivers.map((d) => normalizeDriver(d))
    const reports = rawReports.map((r) => normalizeReport(r))

    if (kind === 'consolidated') {
      const dateLabel = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      const { subject, html } = buildConsolidatedDirectorReport(weekNo, reports, vehicles, drivers, dateLabel)
      return res.status(200).json({ ok: true, kind, weekNo, subject, html })
    }

    const report = reports.find((r) => r.active && r.weekNo === weekNo && r.branchId === branchId)
    if (!report) {
      return res.status(404).json({
        error: `No weekly report found for ${branchId} in ${weekNo}. Submit a report first, or choose another week/branch.`,
      })
    }
    const prev = reports
      .filter((r) => r.active && r.branchId === branchId && r.weekNo !== weekNo)
      .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''))[0]
    const { subject, html } = buildWeeklyAnalysisEmail(report, vehicles, drivers, prev)
    return res.status(200).json({ ok: true, kind: 'hod', weekNo, branchId, subject, html })
  }

  if (action === 'saveInspections') {
    const arr = Array.isArray(body.inspections) ? body.inspections : []
    const prev = await getInspections()
    const list: FleetInspection[] = arr.slice(0, 10000).map((i: Record<string, unknown>) => ({
      id: String(i.id || fleetNid('in')),
      branchId: role === 'branch' ? (branch ?? '') : s(i.branchId, 80),
      formType: s(i.formType, 30) || 'pre-trip-4w',
      date: s(i.date, 20),
      regNo: s(i.regNo, 30),
      location: s(i.location, 120),
      riderName: s(i.riderName, 80),
      licenseNo: s(i.licenseNo, 40),
      shift: s(i.shift, 20),
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
      active: i.active !== false,
      createdAt: s(i.createdAt, 40) || new Date().toISOString(),
    }))
    const final = role === 'branch' ? list.concat(prev.filter((p) => p.branchId !== branch)) : list
    await saveInspections(final)
    return res.status(200).json({ ok: true, count: final.length })
  }

  return res.status(400).json({ error: 'Unknown action.' })
}
