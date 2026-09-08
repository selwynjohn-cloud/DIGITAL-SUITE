import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import { isSuiteAdminEmail } from '../_lib/auth.js'
import { noteItSuiteChange } from '../_lib/it-activity-alert.js'
import { isHodUser } from '../_lib/mis/digest.js'
import { getUsers as getMisUsers, getBranches as getMisBranches, getActiveBranch } from '../_lib/mis/store.js'
import { buildConsolidatedDirectorReport, buildWeeklyAnalysisEmail, sendPendingReminder, sendWeeklyAnalysis } from '../_lib/fleet/analysis.js'
import { dailyTripKey, extraTripFields, PRE_TRIP_LOCKED_MSG } from '../_lib/fleet/daily-trip-save.js'
import { sendDailyTripMail, sendExpiredLicenseMail, sendNewDriverMail } from '../_lib/fleet/daily-trip-mail.js'
import {
  allocateTripCode,
  expiredLicenseMessage,
  isKnownTripDriver,
  licenseExpired,
  resolvedTripLicense,
} from '../_lib/fleet/trip-code.js'
import { FLEET_DRIVER_TRIP_URL } from '../_lib/fleet/trip-fields.js'
import { fleetSendWhatsApp } from '../_lib/fleet/whatsapp-send.js'
import { sendSuiteEmail } from '../_lib/suite-mail.js'
import { Resend } from 'resend'
import { normalizeWeeklyEntry } from '../_lib/fleet/stats.js'
import {
  branchesWithActiveVehicles,
  currentWeekLabel,
  FLEET_BRANCHES,
  isHyderabadFleetBranch,
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
  const name = String(hit?.name || misBranchId || '').trim()
  if (!name) return null
  // Prefer exact Master Directory / MIS name so User Management shows every branch.
  if (FLEET_BRANCHES.includes(name as (typeof FLEET_BRANCHES)[number])) return name
  const exact = FLEET_BRANCHES.find((f) => f.toLowerCase() === name.toLowerCase())
  if (exact) return exact
  if (/hi-?tech/i.test(name)) return 'Hi-Tech City'
  if (/hyderabad-?a/i.test(name)) return 'Hyderabad-A'
  if (/hyderabad-?b/i.test(name)) return 'Hyderabad-B'
  if (/hyderabad/i.test(name)) return name
  if (/kakinada/i.test(name) && !/visakhapatnam|vizag/i.test(name)) return 'Kakinada'
  if (/visakhapatnam|vizag/i.test(name)) return 'Visakhapatnam'
  if (/tada/i.test(name) && !/nellore/i.test(name)) return 'Tada'
  if (/nellore/i.test(name)) return 'Nellore'
  if (/tadipatri/i.test(name) && !/tirupati|tirupathi/i.test(name)) return 'Tadipatri'
  if (/tirupati|tirupathi/i.test(name)) return 'Tirupati'
  if (/bangalore|bengaluru|karnataka/i.test(name)) return 'Bangalore'
  if (/gulbarga|kalaburagi/i.test(name)) return 'Gulbarga'
  if (/bhopal|madhya/i.test(name)) return 'Bhopal'
  if (/kochi|cochin|kerala/i.test(name)) return 'Kochi'
  if (/surat|gujarat/i.test(name) && !/mumbai/i.test(name)) return 'Surat'
  if (/mumbai|maharashtra/i.test(name)) return 'Mumbai'
  if (/pondicherry|puducherry/i.test(name) && !/chennai/i.test(name)) return 'Puducherry'
  if (/chennai|tamil/i.test(name)) return 'Chennai'
  if (/vijayawada/i.test(name)) return 'Vijayawada'
  if (/training\s*academy/i.test(name)) return 'Training Academy'
  if (/corporate/i.test(name)) return 'Corporate Office'
  // Always keep unknown active MIS names in dropdowns rather than dropping them.
  return name
}

function normalizeFleetBranchId(
  raw: string,
  misBranches: { id: string; name: string }[],
): string | null {
  const v = String(raw ?? '').trim()
  if (!v) return null
  // Already a Fleet label (e.g. Chennai)
  if (FLEET_BRANCHES.includes(v as (typeof FLEET_BRANCHES)[number])) return v
  // MIS id or display name (e.g. br10 / Chennai & Pondicherry)
  return fleetBranchFromMis(v, misBranches)
}

/** Keep one row per id, and one active row per branch+week (latest submittedAt wins). */
function dedupeFleetReports(rows: FleetWeeklyReport[]): FleetWeeklyReport[] {
  const byId = new Map<string, FleetWeeklyReport>()
  for (const r of rows) {
    if (!r?.id) continue
    const prev = byId.get(r.id)
    if (!prev || String(r.submittedAt || '') >= String(prev.submittedAt || '')) byId.set(r.id, r)
  }
  const byBranchWeek = new Map<string, FleetWeeklyReport>()
  for (const r of byId.values()) {
    const key = `${r.branchId}::${r.weekNo}`
    const prev = byBranchWeek.get(key)
    if (!prev || String(r.submittedAt || '') >= String(prev.submittedAt || '')) byBranchWeek.set(key, r)
  }
  return [...byBranchWeek.values()].sort((a, b) =>
    String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')),
  )
}

async function resolveFleetUser(
  email: string,
  sessionRole: 'staff' | 'management',
  fleetUsers: FleetUser[],
  misUsers: Awaited<ReturnType<typeof getMisUsers>>,
  misBranches: { id: string; name: string }[],
  sessionBranchId?: string,
  requestedBranch?: string,
): Promise<{ role: 'admin' | 'branch'; branch: string | null; name: string; email: string } | null> {
  const em = email.trim().toLowerCase()
  if (!em.includes('@')) return null

  if (isSuiteAdminEmail(email)) {
    const adminName = em === 'sai@agilegroup.co.in' ? 'Sai' : 'Director'
    if (sessionRole === 'staff') {
      const raw = String(sessionBranchId || requestedBranch || '').trim()
      if (raw) {
        const misBranch = await getActiveBranch(raw)
        const branch = misBranch
          ? fleetBranchFromMis(misBranch.id, misBranches)
          : normalizeFleetBranchId(raw, misBranches)
        if (branch) return { role: 'branch', branch, name: adminName, email }
      }
    }
    return { role: 'admin', branch: null, name: adminName, email }
  }

  if (sessionRole === 'management') {
    // Same as CRM: Management portal OTP session = management access.
    // Prefer named Fleet admin/director row when present.
    const admin = fleetUsers.find(
      (u) => u.active && u.role === 'admin' && u.email.trim().toLowerCase() === em,
    )
    if (admin) return { role: 'admin', branch: null, name: admin.name || email, email }
    return { role: 'admin', branch: null, name: email, email }
  }

  // Branch-password login puts MIS branch id on the session — trust that first.
  if (sessionBranchId) {
    const misBranch = await getActiveBranch(sessionBranchId)
    if (misBranch) {
      const branch = fleetBranchFromMis(misBranch.id, misBranches)
      if (branch) return { role: 'branch', branch, name: email, email }
    }
  }

  const branchUser = fleetUsers.find(
    (u) => u.active && u.role === 'branch' && u.email.trim().toLowerCase() === em,
  )
  if (branchUser?.branchId) {
    const fleetBranch = normalizeFleetBranchId(branchUser.branchId, misBranches)
    if (!fleetBranch) return null
    const activeMis = misBranches.some((b) => fleetBranchFromMis(b.id, misBranches) === fleetBranch)
    if (!activeMis) return null
    return { role: 'branch', branch: fleetBranch, name: branchUser.name || email, email }
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

  const requestedBranch = String(body.branchId ?? '').trim()
  const fleetUser = await resolveFleetUser(
    otpSession.email,
    otpSession.role,
    users,
    misUsers,
    branches,
    otpSession.branchId,
    requestedBranch,
  )
  if (!fleetUser) {
    if (otpSession.role === 'staff') {
      const lockedId = String(otpSession.branchId || '').trim()
      if (lockedId && !(await getActiveBranch(lockedId))) {
        return res.status(403).json({
          error:
            'This branch is deactivated. Only activated branch teams can access the portal. Contact management.',
        })
      }
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
          ? 'Management sign-in failed. Use the dark Management button, your @agilegroup.co.in email, and the PIN from your email.'
          : 'Branch access only for registered branch staff or HODs. Contact Head Office to add your email.',
    })
  }

  const branchIdFromBody = String(body.branchId ?? '').trim()
  const branch = effectiveBranch(fleetUser, branchIdFromBody)
  if (fleetUser.role === 'branch' && branchIdFromBody && !branch) {
    return res.status(403).json({ error: 'You can only access your own branch (' + fleetUser.branch + ').' })
  }
  const role = fleetUser.role
  if (/^(save|approve|sync)/i.test(action)) {
    const sendJson = res.json.bind(res)
    res.json = ((payload: unknown) => {
      const code = res.statusCode || 200
      if (code >= 200 && code < 300) {
        noteItSuiteChange(otpSession.email, 'Fleet Management', 'fleet', action)
      }
      return sendJson(payload)
    }) as typeof res.json
  }
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
    const cleaned = dedupeFleetReports(reports)
    if (cleaned.length < reports.length) {
      try {
        await saveReports(cleaned)
        reports = cleaned
        console.log('[fleet/load] deduped weekly reports', reports.length, '→', cleaned.length)
      } catch (err) {
        console.error('[fleet/load/dedupe]', err)
      }
    } else {
      reports = cleaned
    }
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
    else if (role === 'branch' && branch) {
      // HOD may assign branch users (same branch only)
      payload.users = users.filter((u) => u.role === 'branch' && u.branchId === branch)
    }
    payload.fleetUsersVersion = '2026-08-17-roles'
    payload.fleetDesignations = [
      'Director',
      'President',
      'Admin',
      'CGM',
      'Vice President (VP)',
      'AVP',
      'General Manager (GM)',
      'Regional Manager (RM)',
      'Branch Manager',
      'Operations Manager',
      'Area Manager',
      'Field Officer',
      'Sales Executive',
      'Training Team',
      'Accounts',
      'HR',
      'Control Operator',
    ]
    const fromMis = branches
      .map((b) => String(b.name || '').trim())
      .filter(Boolean)
    const mapped = branches
      .map((b) => fleetBranchFromMis(b.id, branches))
      .filter((x): x is string => Boolean(x))
    const fleetBranches = [
      ...new Set<string>([...FLEET_BRANCHES, ...fromMis, ...mapped]),
    ].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
    if (fleetBranches.length) {
      payload.fleetBranches = fleetBranches
      payload.allBranches = fleetBranches
    }
    return res.status(200).json(payload)
  }

  if (!fleetStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
  const s = (v: unknown, n = 200) => String(v ?? '').slice(0, n)

  if (action === 'saveUsers') {
    // Management + HOD may assign; only Management may delete rows
    if (role !== 'admin' && role !== 'branch') {
      return res.status(403).json({ error: 'Not authorised to edit users.' })
    }
    const arr = Array.isArray(body.users) ? body.users : []
    const existing = await getUsers()
    let list = arr.slice(0, 500).map((u: Record<string, unknown>) =>
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
        designation: s(u.designation, 80),
        branchId: s(u.branchId, 80),
        password: s(u.password, 80),
        active: u.active !== false,
        deactivateReason: s(u.deactivateReason, 200),
        remarks: s(u.remarks, 400),
        createdAt: s(u.createdAt, 40) || new Date().toISOString(),
      }),
    )
    if (role === 'branch') {
      // HOD: only own-branch HOD/Staff rows; cannot create Management users; cannot delete
      const scope = String(branch || '')
      if (!scope) return res.status(400).json({ error: 'Branch required.' })
      const scopedIncoming = list.map((u) => {
        const next = { ...u }
        if (next.role === 'admin' || next.userType === 'director' || next.userType === 'admin') {
          next.role = 'branch'
          next.userType = 'hod'
          next.designation = next.designation || 'Regional Manager (RM)'
        }
        next.role = 'branch'
        next.branchId = scope
        if (next.userType !== 'hod' && next.userType !== 'staff') next.userType = 'hod'
        return next
      })
      const incomingIds = new Set(scopedIncoming.map((u) => u.id).filter(Boolean))
      for (const old of existing) {
        if (old.role === 'branch' && old.branchId === scope && old.id && !incomingIds.has(old.id)) {
          return res.status(403).json({
            error: 'HOD cannot delete users. Turn Active off, or ask Management to delete.',
          })
        }
      }
      const others = existing.filter((u) => !(u.role === 'branch' && u.branchId === scope))
      list = [...others, ...scopedIncoming]
    }
    await saveUsers(list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  if (action === 'saveVehicles') {
    const arr = Array.isArray(body.vehicles) ? body.vehicles : []
    const incoming = arr.slice(0, 2000).map((v: Record<string, unknown>) =>
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
    if (role === 'branch') {
      if (!branch) return res.status(400).json({ error: 'Your branch could not be determined. Contact Head Office.' })
      const prev = await getVehicles()
      const others = prev.filter((v) => v.branchId !== branch)
      const mine = incoming
        .filter((v) => !v.branchId || v.branchId === branch)
        .map((v) => ({ ...v, branchId: branch }))
      await saveVehicles(others.concat(mine))
      return res.status(200).json({ ok: true, count: mine.length })
    }
    await saveVehicles(incoming)
    return res.status(200).json({ ok: true, count: incoming.length })
  }

  if (action === 'saveDrivers') {
    const arr = Array.isArray(body.drivers) ? body.drivers : []
    const incoming = arr.slice(0, 3000).map((d: Record<string, unknown>) =>
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
    if (role === 'branch') {
      if (!branch) return res.status(400).json({ error: 'Your branch could not be determined. Contact Head Office.' })
      const prev = await getDrivers()
      const others = prev.filter((d) => d.branchId !== branch)
      const mine = incoming
        .filter((d) => !d.branchId || d.branchId === branch)
        .map((d) => ({ ...d, branchId: branch }))
      await saveDrivers(others.concat(mine))
      return res.status(200).json({ ok: true, count: mine.length })
    }
    await saveDrivers(incoming)
    return res.status(200).json({ ok: true, count: incoming.length })
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

    // Branch HOD must only upsert their own branch rows. Never re-append every other
    // branch from Redis (that duplicated reports and eventually blocked Save).
    let final: FleetWeeklyReport[]
    if (role === 'branch') {
      if (!branch) return res.status(400).json({ error: 'Your branch could not be determined. Contact Head Office.' })
      const mineIncoming = list
        .filter((r) => r.branchId === branch)
        .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''))
      if (!mineIncoming.length) {
        return res.status(400).json({ error: 'No weekly report data received for your branch. Please try again.' })
      }
      // Keep latest row per week for this submission batch
      const byWeek = new Map<string, FleetWeeklyReport>()
      for (const r of mineIncoming) {
        if (!byWeek.has(r.weekNo)) byWeek.set(r.weekNo, r)
      }
      const incomingWeeks = new Set(byWeek.keys())
      const others = prev.filter((p) => p.branchId !== branch)
      const mineKeep = prev.filter((p) => p.branchId === branch && !incomingWeeks.has(p.weekNo))
      final = dedupeFleetReports(others.concat(mineKeep, [...byWeek.values()]))
    } else {
      final = dedupeFleetReports(list.length ? list : prev)
    }

    try {
      await saveReports(final)
    } catch (err) {
      console.error('[fleet/saveReports]', err)
      return res.status(500).json({
        error: 'Could not save the weekly report (storage). Please try once more. If it fails again, tell Head Office.',
      })
    }

    // Auto-send vehicle analysis — never block the save if mail is slow/down.
    let emailSent = false
    if (role === 'branch' && branch) {
      const mineNew = list
        .filter((r) => r.branchId === branch)
        .filter((r) => !prev.some((p) => p.id === r.id))
        .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''))
      if (mineNew.length >= 1) {
        try {
          const [vehicles, drivers] = await Promise.all([
            getVehicles().then((v) => v.map((x) => normalizeVehicle(x))),
            getDrivers().then((d) => d.map((x) => normalizeDriver(x))),
          ])
          const mail = await Promise.race([
            sendWeeklyAnalysis(mineNew[0], vehicles, drivers, final),
            new Promise<{ ok: false; error: string }>((resolve) =>
              setTimeout(() => resolve({ ok: false, error: 'Email timed out' }), 12000),
            ),
          ])
          emailSent = !!mail.ok
        } catch (err) {
          console.error('[fleet/saveReports/email]', err)
        }
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
    const branchId = role === 'branch' ? (branch ?? '') : s(body.branchId, 80) || 'Corporate Office'
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

  if (action === 'licenseAlert') {
    const branchId = role === 'branch' ? (branch ?? '') : s(body.branchId, 80)
    if (!branchId) return res.status(400).json({ error: 'Pick a branch first.' })
    const driverName = s(body.driverName, 80)
    const drivers = (await getDrivers()).map((d) => normalizeDriver(d))
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
      postItems: Array.isArray(i.postItems)
        ? (i.postItems as Record<string, unknown>[]).slice(0, 60).map((x) => ({
            item: s(x.item, 120),
            status: s(x.status, 10) || 'OK',
            remarks: s(x.remarks, 200),
          }))
        : undefined,
      checkedBy: s(i.checkedBy, 80),
      ...extraTripFields(i),
      active: i.active !== false,
      createdAt: s(i.createdAt, 40) || new Date().toISOString(),
    }))
    const notifyId = s(body.notifyId, 80)
    const hodEdit = body.hodEdit === true
    if (notifyId) {
      const incoming = list.find((x) => x.id === notifyId)
      if (incoming && incoming.formType === 'pre-trip-4w' && !hodEdit) {
        const already = prev.find((x) => x.active !== false && dailyTripKey(x) === dailyTripKey(incoming))
        if (already) return res.status(400).json({ error: PRE_TRIP_LOCKED_MSG })
      }
      if (incoming && (incoming.formType === 'pre-trip-4w' || incoming.formType === 'post-trip-4w')) {
        const drivers = (await getDrivers()).map((d) => normalizeDriver(d))
        incoming.licenseValid = resolvedTripLicense(
          drivers,
          incoming.branchId,
          incoming.riderName,
          incoming.licenseValid || '',
        )
        const isNew = !isKnownTripDriver(drivers, incoming.branchId, incoming.riderName)
        if (isNew && !String(incoming.licenseValid || '').trim()) {
          return res.status(400).json({ error: 'Enter the new driver name and license expiry date.' })
        }
        if (isNew) {
          try {
            await sendNewDriverMail({
              branchId: incoming.branchId,
              driverName: incoming.riderName,
              licenseValid: incoming.licenseValid || '',
              regNo: incoming.regNo,
            })
          } catch {
            /* still check expiry */
          }
        }
        if (licenseExpired(incoming.licenseValid || '')) {
          try {
            await sendExpiredLicenseMail({
              branchId: incoming.branchId,
              driverName: incoming.riderName,
              licenseValid: incoming.licenseValid || '',
              regNo: incoming.regNo,
            })
          } catch {
            /* still block */
          }
          return res.status(400).json({
            error: expiredLicenseMessage(incoming.riderName),
            licenseBlocked: true,
          })
        }
        incoming.tripCode = allocateTripCode(prev.concat(list), incoming)
      }
    }
    if (!hodEdit) {
      const lockedPre = new Map(
        prev.filter((p) => p.formType === 'pre-trip-4w' && p.active !== false).map((p) => [dailyTripKey(p), p]),
      )
      for (let i = 0; i < list.length; i++) {
        const row = list[i]
        if (row.formType !== 'pre-trip-4w' || row.active === false) continue
        const keep = lockedPre.get(dailyTripKey(row))
        if (keep) list[i] = { ...keep }
      }
    }
    const merged = role === 'branch' ? list.concat(prev.filter((p) => p.branchId !== branch)) : list
    const seen = new Map<string, number>()
    const final: FleetInspection[] = []
    for (const row of merged) {
      const daily = row.formType === 'pre-trip-4w' || row.formType === 'post-trip-4w'
      if (!daily || !row.active) {
        final.push(row)
        continue
      }
      const key = dailyTripKey(row)
      const idx = seen.get(key)
      if (idx == null) {
        seen.set(key, final.length)
        final.push(row)
      } else {
        final[idx] = { ...row, id: final[idx].id, createdAt: final[idx].createdAt }
      }
    }
    await saveInspections(final)
    let emailSent = false
    if (notifyId) {
      const rec = final.find(
        (x) => x.id === notifyId && (x.formType === 'pre-trip-4w' || x.formType === 'post-trip-4w'),
      )
      if (rec) {
        try {
          const mail = await sendDailyTripMail(rec)
          emailSent = mail.ok
        } catch {
          emailSent = false
        }
      }
    }
    return res.status(200).json({ ok: true, count: final.length, emailSent })
  }

  if (action === 'deleteInspection') {
    const id = s(body.id, 80)
    if (!id) return res.status(400).json({ error: 'Pick the report to delete.' })
    const prev = await getInspections()
    const row = prev.find((x) => x.id === id)
    if (!row) return res.status(404).json({ error: 'Report not found.' })
    if (role === 'branch' && row.branchId !== branch) {
      return res.status(403).json({ error: 'You can only delete reports for your own branch.' })
    }
    await saveInspections(prev.map((x) => (x.id === id ? { ...x, active: false } : x)))
    return res.status(200).json({ ok: true })
  }

  if (action === 'sendWeeklyReminder') {
    const wk = currentWeekLabel()
    const want = s(body.branchId, 80)
    const [reports, vehicles] = await Promise.all([getReports(), getVehicles()])
    const reported = new Set(reports.filter((r) => r.active && r.weekNo === wk).map((r) => r.branchId))
    let targets = branchesWithActiveVehicles(vehicles.map((v) => normalizeVehicle(v))).filter((b) => !reported.has(b))
    if (role === 'branch') {
      if (!branch) return res.status(400).json({ error: 'Your branch could not be determined.' })
      if (isHyderabadFleetBranch(branch)) {
        return res.status(200).json({ ok: true, week: wk, sent: 0, message: 'Hyderabad weekly vehicle report is not required.' })
      }
      if (reported.has(branch)) {
        return res.status(200).json({ ok: true, week: wk, sent: 0, message: 'Weekly vehicle report already submitted.' })
      }
      if (!targets.includes(branch)) {
        return res.status(200).json({ ok: true, week: wk, sent: 0, message: 'No vehicles allotted — reminder is not required.' })
      }
      targets = [branch]
    } else if (want && want !== 'ALL') {
      targets = targets.filter((b) => b === want)
      if (!targets.length) {
        const why = isHyderabadFleetBranch(want)
          ? 'Hyderabad weekly vehicle report is not required.'
          : reported.has(want)
            ? 'Weekly vehicle report already submitted.'
            : 'No reminder needed for this branch.'
        return res.status(200).json({ ok: true, week: wk, sent: 0, message: why })
      }
    }
    const sent: string[] = []
    for (const b of targets) {
      const r = await sendPendingReminder(b, wk, false)
      if (r.ok) sent.push(b)
    }
    return res.status(200).json({
      ok: true,
      week: wk,
      sent: sent.length,
      branches: sent,
      message: sent.length
        ? `Reminder mailed to ${sent.length} HOD(s). Director and Control are copied.`
        : 'Could not send the reminder. Try again.',
    })
  }

  if (action === 'shareDriverLink') {
    const channel = s(body.channel, 12)
    const branchName = s(body.branchId, 80) || branch || ''
    const url = FLEET_DRIVER_TRIP_URL
    const text =
      `Agile Fleet — Daily Pre & Post Trip\n\n` +
      `Open this on your phone (no password).\n` +
      `Pick your branch from the dropdown.\n` +
      `Saved Pre-Trip comes back so you can see it. You cannot change it.\n` +
      `Fill Pre-Trip before you start and Post-Trip after you finish.\n` +
      `You do not type the trip code — pick the same Branch, Date, Vehicle and Trip no.\n` +
      `\n${url}\n\n` +
      `If the vehicle or driver is not on the list, pick Other Vehicle or New Driver and type the number / name and licence expiry date.`
    if (channel === 'whatsapp') {
      const r = await fleetSendWhatsApp(s(body.whatsapp, 20), text)
      return res.status(r.ok ? 200 : 400).json({ ok: r.ok, error: r.error })
    }
    if (channel === 'email') {
      const email = s(body.email, 80)
      if (!email.includes('@')) return res.status(400).json({ error: 'Enter a mail id.' })
      const apiKey = process.env.RESEND_API_KEY?.trim()
      if (!apiKey) return res.status(400).json({ error: 'Email is not configured.' })
      const resend = new Resend(apiKey)
      const from = process.env.EMAIL_FROM ?? 'Agile Fleet <noreply@agilegroup.co.in>'
      const r = await sendSuiteEmail(resend, {
        from,
        to: [email],
        subject: `Agile Fleet — Daily Pre & Post Trip${branchName ? ` — ${branchName}` : ''}`,
        html: `<p>Open this on your phone (no password). Pick your branch from the dropdown. Saved Pre-Trip comes back so you can see it. You cannot change it. Fill <b>Pre-Trip</b> before you start and <b>Post-Trip</b> after you finish. You do not type the trip code — pick the same Branch, Date, Vehicle and Trip no.</p><p><a href="${url}">${url}</a></p><p>If the vehicle or driver is not on the list, pick Other Vehicle or New Driver and type the number / name and licence expiry date.</p>`,
        skipDirectorCc: true,
      })
      return res.status(r.error ? 400 : 200).json({ ok: !r.error, error: r.error?.message })
    }
    return res.status(400).json({ error: 'Choose WhatsApp or Mail.' })
  }

  return res.status(400).json({ error: 'Unknown action.' })
}
