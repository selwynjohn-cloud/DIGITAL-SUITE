/**
 * Client company link — two doors: Officer (register / start) and Gate (Officer PIN).
 * Token from /avm-check/{token} scopes every action to that company only.
 * No Agile email PIN on this page.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendAvmGateShiftPinWhatsApp, sendEscortSms, sendHostApproveMail, sendInviteSms, sendPassSms } from '../_lib/visitors/notify.js'
import {
  type AvmHqUser,
  type AvmStaffRole,
  ensureDefaultGate,
  ensureHqClientTenant,
  getComplaints,
  getHqClientByToken,
  getHqGates,
  getHqUsers,
  getShiftDuties,
  istHm,
  nextTicketNo,
  publicDuty,
  publicGate,
  publicStaff,
  setDutyPin,
  upsertComplaint,
  upsertHqUser,
  upsertShiftDuty,
  verifyDutyPin,
  verifyUserPin,
} from '../_lib/visitors/hq-store.js'
import {
  avmNid,
  closeVisitAndWipe,
  companyIdRequired,
  deleteOfficerDocs,
  gateVisit,
  getBuildings,
  getHosts,
  getVisit,
  getVisitByPass,
  istYmd,
  listOpenVisits,
  newPassCode,
  nextCardCode,
  normalizeMobile10,
  officerVisit,
  saveBuildings,
  saveHosts,
  saveVisit,
  type AvmBuilding,
  type AvmHost,
  type AvmMaterial,
  type AvmVisit,
} from '../_lib/visitors/store.js'

function json(res: VercelResponse, status: number, body: Record<string, unknown>) {
  return res.status(status).json(body)
}
function s(v: unknown, n = 200) {
  return String(v ?? '').trim().slice(0, n)
}

async function companyFromToken(raw: string) {
  const token = s(raw, 80)
  if (!token) return null
  const client = await getHqClientByToken(token)
  if (!client) return null
  const tenant = await ensureHqClientTenant(client)
  return { client, tenant }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  const body = (req.body ?? {}) as Record<string, unknown>
  const action = s(body.action, 60)
  const scoped = await companyFromToken(String(body.token || req.query.token || ''))
  if (!scoped) return json(res, 401, { error: 'This company link is not valid. Ask Agile to send it again.' })
  const { client, tenant } = scoped
  const tenantId = tenant.id
  const mine = (rows: AvmVisit[]) => rows.filter((v) => v.tenantId === tenantId)
  const staffHere = async () => (await getHqUsers()).filter((u) => u.clientId === tenantId)
  const findStaff = async (id: string) => (await staffHere()).find((u) => u.id === id && u.active !== false) || null
  const asOfficer = async () => {
    const u = await findStaff(s(body.staffId, 40))
    if (!u || u.role === 'guard') return null
    return u
  }
  const asManager = async () => {
    const u = await asOfficer()
    if (!u || (!u.canManageUsers && u.role !== 'manager')) return null
    return u
  }
  const asGuard = async () => {
    const u = await findStaff(s(body.staffId, 40))
    if (!u || u.role !== 'guard') return null
    return u
  }
  const dutiesHere = async () => (await getShiftDuties()).filter((d) => d.clientId === tenantId)
  const asDuty = async () => {
    const d = (await dutiesHere()).find((x) => x.id === s(body.dutyId, 40))
    return d || null
  }

  if (action === 'boot') {
    const [buildings, hosts, visits, staff, complaints, gates, duties] = await Promise.all([
      getBuildings(),
      getHosts(),
      listOpenVisits(),
      staffHere(),
      getComplaints(),
      getHqGates(),
      getShiftDuties(),
    ])
    const list = mine(visits)
    const ymd = istYmd()
    return json(res, 200, {
      ok: true,
      companyName: client.companyName,
      tenantId,
      today: ymd,
      staff: staff.map(publicStaff),
      officers: staff.filter((u) => u.active !== false && u.role !== 'guard').map(publicStaff),
      gates: gates.filter((g) => g.clientId === tenantId).map(publicGate),
      duties: duties.filter((d) => d.clientId === tenantId && d.ymd === ymd).map(publicDuty),
      buildings: buildings.filter((b) => b.tenantId === tenantId),
      hosts: hosts.filter((h) => h.tenantId === tenantId),
      visits: list.map(officerVisit),
      gateVisits: list.map(gateVisit),
      complaints: complaints.filter((c) => c.clientId === tenantId),
    })
  }

  if (action === 'addComplaint') {
    if (!(await asOfficer())) return json(res, 403, { error: 'Register as Officer first.' })
    const receivedFrom = s(body.receivedFrom, 80)
    const email = s(body.email, 80).toLowerCase()
    const issue = s(body.issue, 800)
    const mobile = normalizeMobile10(s(body.mobile, 20))
    if (!receivedFrom || !issue) return json(res, 400, { error: 'Complaint by and Nature of complaint are required.' })
    if (!email.includes('@')) return json(res, 400, { error: 'email Id is required.' })
    const ymd = istYmd()
    const saved = await upsertComplaint({
      id: avmNid('tkt'),
      ticketNo: await nextTicketNo(ymd, client.branchName || client.companyName),
      clientId: tenantId,
      clientName: client.companyName,
      branchId: client.branchId || tenantId,
      branchName: client.branchName || '',
      ymd,
      time: istHm(),
      receivedFrom,
      email,
      mobile,
      issue,
      status: 'under-process',
      respondTime: '',
      source: 'client',
      closedYmd: '',
      closedTime: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    return json(res, 200, { ok: true, complaint: saved })
  }

  if (action === 'registerStaff') {
    return json(res, 403, { error: 'Ask Agile Management to add your name. Your PIN will come on WhatsApp.' })
  }

  if (action === 'staffLogin' || action === 'officerStart') {
    const pin = s(body.pin, 8)
    const u = (await staffHere()).find((x) => x.id === s(body.staffId, 40) && x.active !== false && x.role !== 'guard')
    if (!u || !verifyUserPin(u, pin)) {
      return json(res, 403, { error: 'Use your registered name and the PIN sent on WhatsApp.' })
    }
    return json(res, 200, { ok: true, staff: publicStaff(u) })
  }

  if (action === 'registerShiftDuty') {
    const gate = await ensureDefaultGate(tenantId, client.companyName)
    const ymd = istYmd()
    const shift = s(body.shift, 40) || 'Shift A (Morning)'
    const guardName = s(body.guardName, 80)
    const idNo = s(body.idNo, 40)
    const mobile = normalizeMobile10(s(body.mobile, 20))
    if (!guardName || !idNo) return json(res, 400, { error: 'Enter your name and ID.' })
    if (!mobile || mobile.length !== 10) return json(res, 400, { error: 'Enter your 10-digit phone. PIN goes on WhatsApp.' })
    const existing = (await dutiesHere()).find(
      (d) => d.ymd === ymd && d.shift === shift && d.gateId === gate.id && d.idNo.toLowerCase() === idNo.toLowerCase(),
    )
    let saved = existing
      ? await upsertShiftDuty({ ...existing, guardName, mobile })
      : await upsertShiftDuty({
          id: avmNid('duty'),
          clientId: tenantId,
          clientName: client.companyName,
          gateId: gate.id,
          gateName: gate.gateName,
          ymd,
          shift,
          guardName,
          idNo,
          mobile,
          pinHash: '',
          pinIssuedAt: '',
          createdAt: new Date().toISOString(),
        })
    const issued = await setDutyPin(saved)
    saved = issued.duty
    const wa = await sendAvmGateShiftPinWhatsApp({
      mobile: saved.mobile,
      gateName: saved.gateName,
      shift: saved.shift,
      pin: issued.pin,
      clientName: saved.clientName,
    })
    return json(res, 200, {
      ok: true,
      duty: publicDuty(saved),
      pin: issued.pin,
      pinSent: wa.ok,
      pinError: wa.ok ? '' : wa.error || '',
    })
  }

  if (action === 'guardLogin' || action === 'gateLogin' || action === 'shiftLogin') {
    const pin = s(body.pin, 8)
    const id = s(body.dutyId, 40) || s(body.staffId, 40)
    const d = (await dutiesHere()).find((x) => x.id === id && x.ymd === istYmd())
    if (!d || !verifyDutyPin(d, pin)) {
      return json(res, 403, { error: 'Use today’s shift register and the PIN for this shift.' })
    }
    return json(res, 200, { ok: true, duty: publicDuty(d) })
  }

  if (action === 'saveStaff') {
    return json(res, 403, { error: 'Ask Agile Management to add or edit a name. PIN goes on WhatsApp.' })
  }
  if (action === 'issueGatePin') {
    return json(res, 403, { error: 'Ask Agile Management to tap Refresh PIN. The new PIN goes on WhatsApp.' })
  }
  if (action === 'saveStaffBlocked') {
    if (!(await asManager())) return json(res, 403, { error: 'Only the Security Manager can add or edit staff.' })
    const id = s(body.id, 40) || avmNid('usr')
    const prev = (await staffHere()).find((u) => u.id === id)
    const roleRaw = s(body.role, 20)
    const role: AvmStaffRole = roleRaw === 'guard' || roleRaw === 'manager' ? roleRaw : 'officer'
    const row: AvmHqUser = {
      id,
      clientId: tenantId,
      clientName: client.companyName,
      staffName: s(body.staffName, 80),
      idNo: s(body.idNo, 40),
      email: s(body.email, 80).toLowerCase(),
      mobile: normalizeMobile10(s(body.mobile, 20)),
      department: s(body.department, 80) || prev?.department || '',
      workAs: s(body.workAs, 40) || prev?.workAs || (role === 'guard' ? 'Security Guards' : 'Staff'),
      role,
      active: body.active === false ? false : true,
      canManageUsers: body.canManageUsers === true || role === 'manager',
      gatePinHash: prev?.gatePinHash || '',
      pinIssuedAt: prev?.pinIssuedAt || '',
      linkSentOn: prev?.linkSentOn || '',
      createdAt: prev?.createdAt || new Date().toISOString(),
    }
    if (!row.staffName || !row.idNo) return json(res, 400, { error: 'Name and ID no. are required.' })
    const saved = await upsertHqUser(row)
    return json(res, 200, { ok: true, staff: publicStaff(saved) })
  }

  if (action === 'deactivateStaff') {
    if (!(await asManager())) return json(res, 403, { error: 'Only the Security Manager can deactivate staff.' })
    const prev = (await staffHere()).find((u) => u.id === s(body.id, 40))
    if (!prev) return json(res, 404, { error: 'Staff not found.' })
    const saved = await upsertHqUser({ ...prev, active: false, gatePinHash: '' })
    return json(res, 200, { ok: true, staff: publicStaff(saved) })
  }

  if (action === 'saveBuilding' || action === 'saveHost' || action === 'sendInvite' || action === 'approve' || action === 'reject' || action === 'deleteOfficerDocs') {
    if (!(await asOfficer())) return json(res, 403, { error: 'Register your name and start work as Officer first.' })
  }
  if (action === 'checkIn' || action === 'issueCard' || action === 'closeVisit' || action === 'findPass') {
    if (!(await asDuty()) && !(await asGuard())) return json(res, 403, { error: 'Register today’s shift and login with your PIN first.' })
  }

  if (action === 'saveBuilding') {
    const bname = s(body.name, 80)
    if (!bname) return json(res, 400, { error: 'Building name is required.' })
    const rows = await getBuildings()
    const id = s(body.id, 40) || avmNid('bldg')
    const next: AvmBuilding = {
      id,
      tenantId,
      branchId: tenantId,
      branchName: client.companyName,
      name: bname,
      active: true,
    }
    const i = rows.findIndex((b) => b.id === id)
    if (i >= 0) rows[i] = next
    else rows.push(next)
    await saveBuildings(rows)
    return json(res, 200, { ok: true, building: next })
  }

  if (action === 'saveHost') {
    const rows = await getHosts()
    const id = s(body.id, 40) || avmNid('host')
    const next: AvmHost = {
      id,
      tenantId,
      branchId: tenantId,
      branchName: client.companyName,
      buildingId: s(body.buildingId, 40),
      name: s(body.name, 80),
      mobile: normalizeMobile10(s(body.mobile, 20)),
      email: s(body.email, 80).toLowerCase(),
      department: s(body.department, 60),
      active: true,
    }
    if (!next.name || !next.mobile) return json(res, 400, { error: 'Host name and 10-digit mobile are required.' })
    const i = rows.findIndex((h) => h.id === id)
    if (i >= 0) rows[i] = next
    else rows.push(next)
    await saveHosts(rows)
    return json(res, 200, { ok: true, host: next })
  }

  if (action === 'sendInvite') {
    const visitorMobile = normalizeMobile10(s(body.visitorMobile, 20))
    if (!visitorMobile) return json(res, 400, { error: 'Visitor mobile must be 10 digits.' })
    const buildings = await getBuildings()
    const hosts = await getHosts()
    const building = buildings.find((b) => b.id === s(body.buildingId, 40) && b.tenantId === tenantId && b.active !== false)
    const host = hosts.find((h) => h.id === s(body.hostId, 40) && h.tenantId === tenantId && h.active !== false)
    if (!building) return json(res, 400, { error: 'Select a building.' })
    if (!host) return json(res, 400, { error: 'Select the officer this visitor will meet.' })
    const escortRequired = String(body.escortRequired || '') === 'yes' || body.escortRequired === true
    const escortMobile = normalizeMobile10(s(body.escortMobile, 20))
    if (escortRequired && !escortMobile) return json(res, 400, { error: 'Escort mobile is required when escort is Yes.' })
    const visitorCompany = s(body.visitorCompany, 80)
    const visit: AvmVisit = {
      id: avmNid('v'),
      token: avmNid('t'),
      passCode: '',
      cardCode: '',
      status: 'invited',
      tenantId,
      visitorCompany,
      govIdType: '',
      govIdPhoto: '',
      companyIdPhoto: '',
      ocrName: '',
      ocrText: '',
      docsDeletedAt: '',
      branchId: tenantId,
      branchName: client.companyName,
      buildingId: building.id,
      buildingName: building.name,
      hostId: host.id,
      hostName: host.name,
      hostEmail: host.email,
      hostMobile: host.mobile,
      hostDept: host.department,
      escortRequired,
      escortMobile,
      visitDate: s(body.visitDate, 12) || istYmd(),
      windowFrom: s(body.windowFrom, 12),
      windowTo: s(body.windowTo, 12),
      visitorMobile,
      visitorName: '',
      facePhoto: '',
      materials: [],
      createdAt: new Date().toISOString(),
      registeredAt: '',
      approvedAt: '',
      arrivedAt: '',
      closedAt: '',
      createdBy: client.staffName || client.companyName,
    }
    const ok = await saveVisit(visit)
    if (!ok) return json(res, 503, { error: 'Could not save the invite.' })
    const sms = await sendInviteSms(visit)
    return json(res, 200, { ok: true, visit: officerVisit(visit), companyIdRequired: companyIdRequired(visitorCompany), sms: sms.ok })
  }

  if (action === 'approve' || action === 'reject') {
    const visit = await getVisit(s(body.visitId, 40))
    if (!visit || visit.tenantId !== tenantId) return json(res, 404, { error: 'Visit not found.' })
    if (action === 'reject') {
      visit.status = 'rejected'
      await saveVisit(visit)
      return json(res, 200, { ok: true, visit: officerVisit(visit) })
    }
    if (visit.status !== 'registered') return json(res, 400, { error: 'Visitor must complete the form first.' })
    visit.status = 'approved'
    visit.passCode = visit.passCode || newPassCode()
    visit.approvedAt = new Date().toISOString()
    await saveVisit(visit)
    const [sms, mail] = await Promise.all([sendPassSms(visit), sendHostApproveMail(visit)])
    return json(res, 200, { ok: true, visit: officerVisit(visit), sms: sms.ok, mail: mail.ok })
  }

  if (action === 'findPass') {
    const visit = await getVisitByPass(s(body.passCode, 20).toUpperCase())
    if (!visit || visit.tenantId !== tenantId) return json(res, 404, { error: 'Pass not found.' })
    return json(res, 200, { ok: true, visit: gateVisit(visit) })
  }

  if (action === 'checkIn' || action === 'issueCard') {
    if (action === 'issueCard') {
      const duty = await asDuty()
      if (!duty || !verifyDutyPin(duty, s(body.pin, 8))) {
        return json(res, 403, { error: 'Enter your shift PIN to issue a Gate pass.' })
      }
    }
    const visit = (await getVisit(s(body.visitId, 40))) || (await getVisitByPass(s(body.passCode, 20).toUpperCase()))
    if (!visit || visit.tenantId !== tenantId) return json(res, 404, { error: 'Visit not found.' })
    if (visit.status !== 'approved' && visit.status !== 'arrived') {
      return json(res, 400, { error: 'Approve the visitor before gate check-in.' })
    }
    if (action === 'checkIn' || !visit.arrivedAt) {
      visit.status = 'arrived'
      visit.arrivedAt = visit.arrivedAt || new Date().toISOString()
    }
    let escort = { ok: true as boolean }
    if (action === 'checkIn') escort = await sendEscortSms(visit)
    if (action === 'issueCard' || (!visit.cardCode && action === 'checkIn')) {
      visit.cardCode = visit.cardCode || (await nextCardCode(visit.buildingName, visit.visitDate || istYmd()))
    }
    await saveVisit(visit)
    return json(res, 200, { ok: true, visit: gateVisit(visit), escort: escort.ok })
  }

  if (action === 'closeVisit') {
    const visit = await getVisit(s(body.visitId, 40))
    if (!visit || visit.tenantId !== tenantId) return json(res, 404, { error: 'Visit not found.' })
    if (visit.status !== 'arrived') return json(res, 400, { error: 'Check In first, then Close Visit.' })
    const materials = Array.isArray(body.materials) ? (body.materials as AvmMaterial[]) : visit.materials
    await closeVisitAndWipe(visit, materials)
    return json(res, 200, { ok: true })
  }

  if (action === 'deleteOfficerDocs') {
    const visit = await getVisit(s(body.visitId, 40))
    if (!visit || visit.tenantId !== tenantId) return json(res, 404, { error: 'Visit not found.' })
    const next = await deleteOfficerDocs(visit)
    return json(res, 200, { ok: true, visit: officerVisit(next) })
  }

  return json(res, 400, { error: 'Unknown action' })
}
