/**
 * Agile Visitors Management — one Management portal (Agile email PIN).
 * Client portal comes next. Do not rewrite otpLoginScript.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import { isSuiteAdminEmail, normaliseEmail } from '../_lib/auth.js'
import { resolveSuiteUserName } from '../_lib/suite-mail.js'
import { sendAvmGateShiftPinWhatsApp, sendAvmUserPinWhatsApp, sendClientPortalLinkMail, sendComplaintCompletionMail, sendGuardShareMail, sendVisitorAnalysisMail, sendVisitorShareMail, serviceComplaintMailHtml, welcomeClientMailHtml } from '../_lib/visitors/notify.js'
import { getClients as getMisBookClients, getMisReportBranches } from '../_lib/mis/store.js'
import {
  type AvmComplaint,
  type AvmGuardLog,
  type AvmHqClient,
  type AvmGate,
  type AvmHqUser,
  type AvmShiftDuty,
  deleteComplaint,
  deleteHqClient,
  deleteHqGate,
  deleteHqUser,
  deleteShiftDuty,
  ensureHqClientTenant,
  getComplaints,
  getGuardLogs,
  getHqClient,
  getHqClients,
  getHqGates,
  getHqUsers,
  getShiftDuties,
  hqStorageOk,
  publicDuty,
  publicGate,
  publicStaff,
  setDutyPin,
  setGatePin,
  setUserPin,
  istHm,
  nextTicketNo,
  normalizeMobile10,
  respondTimeLabel,
  sameIssuedClient,
  upsertComplaint,
  upsertGuardLog,
  upsertHqClient,
  ensureDefaultGate,
  upsertHqGate,
  upsertHqUser,
  upsertShiftDuty,
} from '../_lib/visitors/hq-store.js'
import { avmNid, avmStorageOk, getVisit, hoursSpentLabel, istDateTimeLabel, istShiftLabel, istYmd, listRecentVisits } from '../_lib/visitors/store.js'

function sanctionedFromMis(c: { sanA?: number; sanG?: number; sanB?: number; sanC?: number }) {
  const n = (Number(c.sanA) || 0) + (Number(c.sanG) || 0) + (Number(c.sanB) || 0) + (Number(c.sanC) || 0)
  return n > 0 ? String(n) : ''
}

function json(res: VercelResponse, status: number, body: Record<string, unknown>) {
  return res.status(status).json(body)
}
function s(v: unknown, n = 200) {
  return String(v ?? '').trim().slice(0, n)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  const body = (req.body ?? {}) as Record<string, unknown>
  const action = s(body.action, 60)
  if (action === 'status') return json(res, 200, { ok: true, storage: avmStorageOk() || hqStorageOk() })

  const session = await verifyAppSession(String(body.sessionToken ?? ''), 'visitors')
  if (!session) return json(res, 401, { error: 'Please sign in with your Agile work email.' })

  const email = normaliseEmail(session.email)
  if (!email.endsWith('@agilegroup.co.in') && !isSuiteAdminEmail(email)) {
    return json(res, 403, { error: 'Use an Agile work email for this Management portal.' })
  }
  const name = await resolveSuiteUserName(email)

  if (action === 'login' || action === 'boot') {
    const [clients, complaints, users, guardLogs, gates, duties, misBranches, recentVisits] = await Promise.all([
      getHqClients(),
      getComplaints(),
      getHqUsers(),
      getGuardLogs(),
      getHqGates(),
      getShiftDuties(),
      getMisReportBranches(true),
      listRecentVisits(30),
    ])
    const staffUsers = users.filter((u) => u.role !== 'guard')
    const hqVisits = recentVisits.map((v) => {
      const client = clients.find((c) => c.id === v.tenantId)
      const previousVisits = recentVisits.filter(
        (x) => x.id !== v.id && x.tenantId === v.tenantId && x.visitorMobile && x.visitorMobile === v.visitorMobile,
      ).length
      return {
        id: v.id,
        clientId: client?.id || v.tenantId,
        clientName: client?.companyName || v.branchName || '',
        visitorName: v.visitorName || '—',
        visitorCompany: v.visitorCompany || '',
        visitorMobile: v.visitorMobile || '',
        hostName: v.hostName || '',
        hostDept: v.hostDept || '',
        inTime: istDateTimeLabel(v.arrivedAt),
        outTime: istDateTimeLabel(v.closedAt),
        hoursSpent: hoursSpentLabel(v.arrivedAt, v.closedAt),
        previousVisits,
        visitDate: v.visitDate,
        shift: istShiftLabel(v.arrivedAt || v.createdAt),
        status: v.status,
        clientEmail: client?.email || '',
      }
    })
    const logVisitors = guardLogs.reduce((n, g) => n + (Number(g.visitorsHandled) || 0), 0)
    return json(res, 200, {
      ok: true,
      email,
      name,
      portal: 'management',
      role: 'admin',
      companyTitle: 'Agile Security Force Private Limited',
      storage: avmStorageOk() || hqStorageOk(),
      today: istYmd(),
      clients,
      complaints,
      users: staffUsers.map(publicStaff),
      gates: gates.map(publicGate),
      duties: duties.map(publicDuty),
      guardLogs,
      visits: hqVisits,
      usage: {
        clients: clients.length,
        users: staffUsers.filter((u) => u.active !== false).length + duties.length,
        visitors: hqVisits.length + logVisitors,
        requests: complaints.length,
        solved: complaints.filter((c) => c.status === 'completed').length,
        balance: complaints.filter((c) => c.status !== 'completed').length,
      },
      misBranches: misBranches.map((b) => ({ id: b.id, name: b.name })),
    })
  }

  if (action === 'misClients') {
    const branchId = s(body.branchId, 40)
    if (!branchId) return json(res, 400, { error: 'Pick Branch Name first.' })
    const rows = await getMisBookClients(branchId, { skipRepair: true })
    return json(res, 200, {
      ok: true,
      clients: rows
        .filter((c) => c.active !== false)
        .map((c) => ({
          id: c.id,
          name: c.name,
          location: c.location || '',
          sanctionedPosts: sanctionedFromMis(c),
        })),
    })
  }

  if (action === 'saveClient') {
    const id = s(body.id, 40)
    const prev = id ? (await getHqClient(id)) || undefined : undefined
    const branchId = s(body.branchId, 40)
    const branches = await getMisReportBranches(true)
    const branch = branches.find((b) => b.id === branchId)
    if (!branch) return json(res, 400, { error: 'Pick Branch Name from the Agile MIS list.' })
    const misClientId = s(body.misClientId, 80)
    const book = await getMisBookClients(branchId, { skipRepair: true })
    const site = book.find((c) => c.id === misClientId && c.active !== false)
    if (!site) return json(res, 400, { error: 'Pick Name Of the Client from the MIS list for this branch.' })
    const list = await getHqClients()
    const issued = list.find((c) => c.id !== (prev?.id || '') && sameIssuedClient(c, branch.id, site.id, site.name))
    if (issued) return json(res, 409, { error: 'already issued' })
    const row: AvmHqClient = {
      id: prev?.id || avmNid('cli'),
      branchId: branch.id,
      branchName: branch.name,
      misClientId: site.id,
      clientLocation: site.location || '',
      companyName: site.name,
      sanctionedPosts: s(body.sanctionedPosts, 20) || sanctionedFromMis(site),
      staffName: s(body.staffName, 80),
      designation: s(body.designation, 80),
      email: s(body.email, 80).toLowerCase(),
      mobile: normalizeMobile10(s(body.mobile, 20)),
      linkToken: prev?.linkToken || '',
      linkUrl: prev?.linkUrl || '',
      linkSentAt: prev?.linkSentAt || '',
      verified: prev?.verified || false,
      verifiedAt: prev?.verifiedAt || '',
      status: prev?.status || 'pending',
      registeredYmd: prev?.registeredYmd || istYmd(),
      createdAt: prev?.createdAt || new Date().toISOString(),
    }
    if (!row.staffName) return json(res, 400, { error: 'Name Of the Staff (client) is required.' })
    if (!row.mobile || row.mobile.length !== 10) return json(res, 400, { error: 'Phone must be 10 digits.' })
    if (!row.email.includes('@')) return json(res, 400, { error: 'Email ID is required.' })
    const saved = await upsertHqClient(row)
    await ensureHqClientTenant(saved)
    return json(res, 200, { ok: true, client: saved })
  }

  if (action === 'generateLink') {
    const id = s(body.id, 40)
    const prev = id ? await getHqClient(id) : null
    if (!prev) return json(res, 404, { error: 'Save the client first.' })
    if (prev.linkToken) return json(res, 409, { error: 'already issued' })
    const saved = await upsertHqClient(prev)
    await ensureHqClientTenant(saved)
    return json(res, 200, { ok: true, client: saved })
  }

  if (action === 'previewWelcomeMail') {
    const id = s(body.id, 40)
    const saved = id ? await getHqClient(id) : null
    return json(res, 200, {
      ok: true,
      html: welcomeClientMailHtml({
        staffName: s(body.staffName, 80) || saved?.staffName || '',
        clientName: s(body.clientName, 120) || saved?.companyName || '',
        link: s(body.link, 240) || saved?.linkUrl || '',
      }),
    })
  }

  if (action === 'sendClientLink') {
    const id = s(body.id, 40)
    const prev = id ? await getHqClient(id) : null
    if (!prev) return json(res, 404, { error: 'Save the client first.' })
    if (prev.linkSentAt) return json(res, 409, { error: 'already issued' })
    const withLink = await upsertHqClient(prev)
    await ensureHqClientTenant(withLink)
    const saved = await upsertHqClient({
      ...withLink,
      linkSentAt: withLink.linkSentAt || new Date().toISOString(),
      status: withLink.verified ? 'verified' : 'registered',
    })
    const users = await getHqUsers()
    const already = users.find((u) => u.clientId === saved.id && u.email === saved.email)
    let staffRow = await upsertHqUser({
      id: already?.id || avmNid('usr'),
      clientId: saved.id,
      clientName: saved.companyName,
      staffName: saved.staffName,
      idNo: already?.idNo || '',
      email: saved.email,
      mobile: saved.mobile,
      department: already?.department || '',
      workAs: already?.workAs || 'Security Head',
      role: already?.role || 'manager',
      active: already?.active !== false,
      canManageUsers: already ? already.canManageUsers : true,
      gatePinHash: already?.gatePinHash || '',
      pinIssuedAt: already?.pinIssuedAt || '',
      linkSentOn: istYmd(),
      createdAt: already?.createdAt || new Date().toISOString(),
    })
    if (!staffRow.gatePinHash && staffRow.mobile) {
      const issued = await setUserPin(staffRow)
      staffRow = issued.user
      await sendAvmUserPinWhatsApp({
        mobile: staffRow.mobile,
        name: staffRow.staffName,
        pin: issued.pin,
        clientName: saved.companyName,
        kind: 'staff',
      })
    }
    const sent = await sendClientPortalLinkMail({
      to: saved.email,
      clientName: saved.companyName,
      staffName: saved.staffName,
      link: saved.linkUrl,
    })
    return json(res, 200, {
      ok: true,
      client: saved,
      registered: true,
      mailed: sent.ok,
      mailError: sent.ok ? '' : sent.error || 'Mail could not go. The link is still on Registered client List.',
    })
  }

  if (action === 'deleteClient') {
    const id = s(body.id, 40)
    if (!id) return json(res, 400, { error: 'Select the client row.' })
    await deleteHqClient(id)
    return json(res, 200, { ok: true })
  }

  if (action === 'saveComplaint') {
    const id = s(body.id, 40) || avmNid('tkt')
    const list = await getComplaints()
    const prev = list.find((r) => r.id === id)
    const clientId = s(body.clientId, 40)
    const client = clientId ? await getHqClient(clientId) : null
    if (!client) return json(res, 400, { error: 'Pick Client Name from the registered client list.' })
    const ymd = prev?.ymd || istYmd()
    const time = prev?.time || istHm()
    const row: AvmComplaint = {
      id,
      ticketNo: prev?.ticketNo || (await nextTicketNo(ymd, client.branchName || client.companyName)),
      clientId: client.id,
      clientName: client.companyName,
      branchId: client.branchId || prev?.branchId || '',
      branchName: client.branchName || prev?.branchName || '',
      ymd,
      time,
      receivedFrom: s(body.receivedFrom, 80),
      email: s(body.email, 80).toLowerCase(),
      mobile: normalizeMobile10(s(body.mobile, 20)),
      issue: s(body.issue, 800),
      status: prev?.status || 'under-process',
      respondTime: prev?.respondTime || '',
      source: prev?.source || 'hq',
      closedYmd: prev?.closedYmd || '',
      closedTime: prev?.closedTime || '',
      createdAt: prev?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    if (!row.receivedFrom) return json(res, 400, { error: 'Complaint by (Name of the staff) is required.' })
    if (!row.email.includes('@')) return json(res, 400, { error: 'email Id is required.' })
    if (!row.issue) return json(res, 400, { error: 'Nature of complaint is required.' })
    const saved = await upsertComplaint(row)
    return json(res, 200, { ok: true, complaint: saved })
  }

  if (action === 'deleteComplaint') {
    const id = s(body.id, 40)
    if (!id) return json(res, 400, { error: 'Select the complaint.' })
    await deleteComplaint(id)
    return json(res, 200, { ok: true })
  }

  if (action === 'previewComplaintMail') {
    const id = s(body.id, 40)
    const row = (await getComplaints()).find((r) => r.id === id)
    if (!row) return json(res, 404, { error: 'Token No. not found.' })
    return json(res, 200, {
      ok: true,
      complaint: row,
      html: serviceComplaintMailHtml({
        ticketNo: row.ticketNo,
        clientName: row.clientName,
        receivedFrom: row.receivedFrom,
        issue: row.issue,
        ymd: row.ymd,
        time: row.time,
        closedYmd: row.closedYmd || istYmd(),
        closedTime: row.closedTime || istHm(),
        respondTime: row.respondTime || respondTimeLabel(row.createdAt),
      }),
    })
  }

  if (action === 'markComplaintDone') {
    const id = s(body.id, 40)
    const row = (await getComplaints()).find((r) => r.id === id)
    if (!row) return json(res, 404, { error: 'Token No. not found.' })
    const saved = await upsertComplaint({
      ...row,
      status: 'completed',
      closedYmd: istYmd(),
      closedTime: istHm(),
      respondTime: respondTimeLabel(row.createdAt),
      updatedAt: new Date().toISOString(),
    })
    return json(res, 200, { ok: true, complaint: saved })
  }

  if (action === 'sendComplaintMail' || action === 'sendComplaintDone') {
    const id = s(body.id, 40)
    const row = (await getComplaints()).find((r) => r.id === id)
    if (!row) return json(res, 404, { error: 'Token No. not found.' })
    const closedYmd = row.closedYmd || istYmd()
    const closedTime = row.closedTime || istHm()
    const respondTime = row.respondTime || respondTimeLabel(row.createdAt)
    const sent = await sendComplaintCompletionMail({
      to: row.email,
      ticketNo: row.ticketNo,
      clientName: row.clientName,
      receivedFrom: row.receivedFrom,
      issue: row.issue,
      ymd: row.ymd,
      time: row.time,
      closedYmd,
      closedTime,
      respondTime,
    })
    if (!sent.ok) return json(res, 500, { error: sent.error || 'Could not send.' })
    return json(res, 200, { ok: true, mailed: true })
  }

  if (action === 'saveUser') {
    const id = s(body.id, 40) || avmNid('usr')
    const client = await getHqClient(s(body.clientId, 40))
    if (!client) return json(res, 400, { error: 'Pick the Name of Client.' })
    const prev = (await getHqUsers()).find((u) => u.id === id)
    const kind = s(body.kind, 12) === 'guard' || s(body.role, 20) === 'guard' ? 'guard' : 'staff'
    const workAs = s(body.workAs, 40)
    const roleRaw = s(body.role, 20)
    const role =
      kind === 'guard'
        ? 'guard'
        : workAs === 'Security Head' || workAs === 'HOD' || roleRaw === 'manager'
          ? 'manager'
          : 'officer'
    const row: AvmHqUser = {
      id,
      clientId: client.id,
      clientName: client.companyName,
      staffName: s(body.staffName, 80),
      idNo: s(body.idNo, 40),
      email: s(body.email, 80).toLowerCase(),
      mobile: normalizeMobile10(s(body.mobile, 20)),
      department: s(body.department, 80),
      workAs: workAs || (kind === 'guard' ? 'Security Guards' : 'Staff'),
      role,
      active: body.active === false ? false : true,
      canManageUsers: kind === 'guard' ? false : body.canManageUsers === true || role === 'manager',
      gatePinHash: prev?.gatePinHash || '',
      pinIssuedAt: prev?.pinIssuedAt || '',
      linkSentOn: s(body.linkSentOn, 12) || prev?.linkSentOn || '',
      createdAt: prev?.createdAt || new Date().toISOString(),
    }
    if (!row.staffName) return json(res, 400, { error: 'Name of the Staff is required. ID number is not mandatory.' })
    if (!row.department) return json(res, 400, { error: 'Department is required.' })
    if (!row.workAs) return json(res, 400, { error: 'Work as is required.' })
    if (!row.mobile || row.mobile.length !== 10) return json(res, 400, { error: 'mobile must be 10 digits — PIN goes on WhatsApp.' })
    let saved = await upsertHqUser(row)
    let pin = ''
    let pinSent = false
    let pinError = ''
    if (!prev) {
      const issued = await setUserPin(saved)
      saved = issued.user
      pin = issued.pin
      const wa = await sendAvmUserPinWhatsApp({
        mobile: saved.mobile,
        name: saved.staffName,
        pin,
        clientName: saved.clientName,
        kind,
      })
      pinSent = wa.ok
      pinError = wa.ok ? '' : wa.error || 'WhatsApp could not go.'
    }
    return json(res, 200, { ok: true, user: publicStaff(saved), pinSent, pin: pinSent ? '' : pin, pinError })
  }

  if (action === 'refreshPin') {
    const id = s(body.id, 40)
    const prev = (await getHqUsers()).find((u) => u.id === id)
    if (!prev) return json(res, 404, { error: 'Name not found.' })
    if (!prev.mobile || prev.mobile.length !== 10) return json(res, 400, { error: 'Add a 10-digit mobile first. PIN goes on WhatsApp.' })
    const issued = await setUserPin(prev)
    const kind = issued.user.role === 'guard' ? 'guard' : 'staff'
    const wa = await sendAvmUserPinWhatsApp({
      mobile: issued.user.mobile,
      name: issued.user.staffName,
      pin: issued.pin,
      clientName: issued.user.clientName,
      kind,
    })
    return json(res, 200, {
      ok: true,
      user: publicStaff(issued.user),
      pinSent: wa.ok,
      pin: wa.ok ? '' : issued.pin,
      pinError: wa.ok ? '' : wa.error || 'WhatsApp could not go.',
    })
  }

  if (action === 'deactivateUser') {
    const id = s(body.id, 40)
    const prev = (await getHqUsers()).find((u) => u.id === id)
    if (!prev) return json(res, 404, { error: 'Staff not found.' })
    const saved = await upsertHqUser({ ...prev, active: false, gatePinHash: '' })
    return json(res, 200, { ok: true, user: publicStaff(saved) })
  }

  if (action === 'deleteUser') {
    const id = s(body.id, 40)
    if (!id) return json(res, 400, { error: 'Select the staff row.' })
    await deleteHqUser(id)
    return json(res, 200, { ok: true })
  }

  if (action === 'saveGate') {
    const id = s(body.id, 40) || avmNid('gate')
    const client = await getHqClient(s(body.clientId, 40))
    if (!client) return json(res, 400, { error: 'Pick the registered client first. Client Name is fetched from the link.' })
    const prev = (await getHqGates()).find((g) => g.id === id)
    const row: AvmGate = {
      id,
      clientId: client.id,
      clientName: client.companyName,
      gateName: s(body.gateName, 80),
      shift: prev?.shift || '',
      mobile: prev?.mobile || '',
      pinHash: prev?.pinHash || '',
      pinIssuedAt: prev?.pinIssuedAt || '',
      pinShift: prev?.pinShift || '',
      createdAt: prev?.createdAt || new Date().toISOString(),
    }
    if (!row.gateName) return json(res, 400, { error: 'Gate name is required.' })
    const saved = await upsertHqGate(row)
    return json(res, 200, { ok: true, gate: publicGate(saved) })
  }

  if (action === 'deleteGate') {
    const id = s(body.id, 40)
    if (!id) return json(res, 400, { error: 'Select the Gate.' })
    await deleteHqGate(id)
    return json(res, 200, { ok: true })
  }

  if (action === 'saveShiftDuty') {
    const id = s(body.id, 40) || avmNid('duty')
    const client = await getHqClient(s(body.clientId, 40))
    if (!client) return json(res, 400, { error: 'Pick the registered client. Client Name is fetched from the link.' })
    const gate = await ensureDefaultGate(client.id, client.companyName)
    const prev = (await getShiftDuties()).find((d) => d.id === id)
    const ymd = s(body.ymd, 12) || prev?.ymd || istYmd()
    const shift = s(body.shift, 40) || 'Shift A (Morning)'
    const row: AvmShiftDuty = {
      id,
      clientId: client.id,
      clientName: client.companyName,
      gateId: gate.id,
      gateName: gate.gateName,
      ymd,
      shift,
      guardName: s(body.guardName, 80),
      idNo: s(body.idNo, 40),
      mobile: normalizeMobile10(s(body.mobile, 20)),
      pinHash: prev?.pinHash || '',
      pinIssuedAt: prev?.pinIssuedAt || '',
      createdAt: prev?.createdAt || new Date().toISOString(),
    }
    if (!row.guardName || !row.idNo) return json(res, 400, { error: 'Guard name and ID are required.' })
    if (!row.mobile || row.mobile.length !== 10) return json(res, 400, { error: 'Phone must be 10 digits — PIN goes on WhatsApp.' })
    let saved = await upsertShiftDuty(row)
    const shiftChanged = !prev || prev.shift !== shift || prev.ymd !== ymd
    let pin = ''
    let pinSent = false
    let pinError = ''
    if (!prev || shiftChanged || !saved.pinHash) {
      const issued = await setDutyPin(saved)
      saved = issued.duty
      pin = issued.pin
      const wa = await sendAvmGateShiftPinWhatsApp({
        mobile: saved.mobile,
        gateName: saved.gateName,
        shift: saved.shift,
        pin,
        clientName: saved.clientName,
      })
      pinSent = wa.ok
      pinError = wa.ok ? '' : wa.error || 'WhatsApp could not go.'
    }
    return json(res, 200, { ok: true, duty: publicDuty(saved), pinSent, pin: pinSent ? '' : pin, pinError })
  }

  if (action === 'refreshDutyPin') {
    const prev = (await getShiftDuties()).find((d) => d.id === s(body.id, 40))
    if (!prev) return json(res, 404, { error: 'Shift register not found.' })
    if (!prev.mobile || prev.mobile.length !== 10) return json(res, 400, { error: 'Add a 10-digit phone first.' })
    const issued = await setDutyPin(prev)
    const wa = await sendAvmGateShiftPinWhatsApp({
      mobile: issued.duty.mobile,
      gateName: issued.duty.gateName,
      shift: issued.duty.shift,
      pin: issued.pin,
      clientName: issued.duty.clientName,
    })
    return json(res, 200, {
      ok: true,
      duty: publicDuty(issued.duty),
      pinSent: wa.ok,
      pin: wa.ok ? '' : issued.pin,
      pinError: wa.ok ? '' : wa.error || 'WhatsApp could not go.',
    })
  }

  if (action === 'deleteShiftDuty') {
    const id = s(body.id, 40)
    if (!id) return json(res, 400, { error: 'Select the shift row.' })
    await deleteShiftDuty(id)
    return json(res, 200, { ok: true })
  }

  if (action === 'saveGuardLog') {
    const client = await getHqClient(s(body.clientId, 40))
    if (!client) return json(res, 400, { error: 'Select Client Name.' })
    const id = s(body.id, 40) || avmNid('glog')
    const prev = (await getGuardLogs()).find((g) => g.id === id)
    const row: AvmGuardLog = {
      id,
      clientId: client.id,
      clientName: client.companyName,
      ymd: s(body.ymd, 12) || istYmd(),
      loginTime: s(body.loginTime, 12),
      logoutTime: s(body.logoutTime, 12),
      visitorsHandled: Math.max(0, Number(body.visitorsHandled) || 0),
      createdAt: prev?.createdAt || new Date().toISOString(),
    }
    const saved = await upsertGuardLog(row)
    return json(res, 200, { ok: true, log: saved })
  }

  if (action === 'shareVisitor') {
    const visit = await getVisit(s(body.visitId, 40))
    if (!visit) return json(res, 404, { error: 'Visitor row not found.' })
    const client = await getHqClient(visit.tenantId)
    const recent = await listRecentVisits(30)
    const previousVisits = recent.filter(
      (x) => x.id !== visit.id && x.tenantId === visit.tenantId && x.visitorMobile && x.visitorMobile === visit.visitorMobile,
    ).length
    const sent = await sendVisitorShareMail({
      to: s(body.email, 80) || client?.email || '',
      clientName: client?.companyName || visit.branchName || '',
      visitorName: visit.visitorName || 'Visitor',
      visitorCompany: visit.visitorCompany || '',
      visitorMobile: visit.visitorMobile || '',
      inTime: istDateTimeLabel(visit.arrivedAt),
      outTime: istDateTimeLabel(visit.closedAt),
      hoursSpent: hoursSpentLabel(visit.arrivedAt, visit.closedAt),
      previousVisits,
    })
    if (!sent.ok) return json(res, 500, { error: sent.error || 'Could not share.' })
    return json(res, 200, { ok: true })
  }

  if (action === 'shareVisitorAnalysis') {
    const client = await getHqClient(s(body.clientId, 40))
    if (!client) return json(res, 400, { error: 'Pick one client to share.' })
    const recent = await listRecentVisits(30)
    const mine = recent.filter((v) => v.tenantId === client.id)
    const rows = mine
      .slice()
      .sort((a, b) => String(b.visitDate || '').localeCompare(String(a.visitDate || '')))
      .map((v) => {
        const previousVisits = recent.filter(
          (x) => x.id !== v.id && x.tenantId === v.tenantId && x.visitorMobile && x.visitorMobile === v.visitorMobile,
        ).length
        const letter = (() => {
          const t = istShiftLabel(v.arrivedAt || v.createdAt)
          if (t.includes('Shift B') || t.includes('Afternoon')) return 'B'
          if (t.includes('Shift C') || t.includes('Night')) return 'C'
          return 'A'
        })()
        return {
          visitorName: v.visitorName || '—',
          metWhom: v.hostName || '—',
          timeSpend: hoursSpentLabel(v.arrivedAt, v.closedAt),
          repeated: previousVisits,
          shiftA: letter === 'A' ? 1 : 0,
          shiftB: letter === 'B' ? 1 : 0,
          shiftC: letter === 'C' ? 1 : 0,
          total: previousVisits + 1,
        }
      })
    const sent = await sendVisitorAnalysisMail({
      to: s(body.email, 80) || client.email || '',
      clientName: client.companyName,
      rows,
    })
    if (!sent.ok) return json(res, 500, { error: sent.error || 'Could not share.' })
    return json(res, 200, { ok: true })
  }

  if (action === 'shareGuardLog') {
    const id = s(body.id, 40)
    const log = (await getGuardLogs()).find((g) => g.id === id)
    if (!log) return json(res, 404, { error: 'Row not found.' })
    const client = await getHqClient(log.clientId)
    const sent = await sendGuardShareMail({
      to: client?.email || '',
      clientName: log.clientName,
      ymd: log.ymd,
      loginTime: log.loginTime,
      logoutTime: log.logoutTime,
      visitorsHandled: log.visitorsHandled,
    })
    if (!sent.ok) return json(res, 500, { error: sent.error || 'Could not share.' })
    return json(res, 200, { ok: true })
  }

  return json(res, 400, { error: 'Unknown action' })
}
