/**
 * Agile Control — data API for Command Centre console.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import { isSuiteAdminEmail, normaliseEmail } from '../_lib/auth.js'
import { acPortalForEmail, canAcAccessPortal, isAcAuthorisedEmail, isAcDirector } from '../_lib/control/auth.js'
import { createAcCase } from '../_lib/control/cases.js'
import {
  completeClientCheckAsCase,
  ensureSampleStrategicSites,
  generateAcClientChecks,
  runAcEscalations,
} from '../_lib/control/escalation.js'
import { formatAge, incidentAgeMs, isSlaBreached } from '../_lib/control/sla.js'
import {
  acNid,
  acStorageOk,
  appendAcLog,
  emptyTimeline,
  findAcCase,
  getAcCases,
  getAcClientChecks,
  getAcHoto,
  getAcIncidents,
  getAcLog,
  getAcNightCalls,
  getAcStrategicSites,
  emptyIncidentReceived,
  emptyNightCall,
  findAcUserByEmail,
  getAcUsers,
  normalizeAcPortalUser,
  saveAcHoto,
  saveAcStrategicSites,
  saveAcUsers,
  upsertAcCase,
  upsertAcClientCheck,
  upsertAcIncident,
  upsertAcNightCall,
} from '../_lib/control/store.js'
import type {
  AcCase,
  AcCaseStatus,
  AcCategory,
  AcHotoRecord,
  AcPortalUser,
  AcPriority,
  AcStrategicSite,
} from '../_lib/control/types.js'
import { AC_CATEGORIES, AC_USER_ROLES, acRoleCanDelete, acYn, isIncidentCategory } from '../_lib/control/types.js'
import { getBranches } from '../_lib/mis/store.js'
import { misTodayIst } from '../_lib/mis/dates.js'
import { resolveSuiteUserName } from '../_lib/suite-mail.js'
import {
  branchDisplayName as guardsBranchDisplayName,
  departmentForCategory,
  getComplaints as getGuardComplaints,
  guardsNid,
  logEvent as logGuardEvent,
  nextComplaintCode,
  normalizeComplaint,
  saveComplaints as saveGuardComplaints,
  sortComplaintsNewestFirst,
} from '../_lib/guards/store.js'
import { realComplaintsOnly } from '../_lib/guards/practice.js'
import { notifyNewGuardComplaint } from '../_lib/guards/notify.js'

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

  if (action === 'status') {
    return json(res, 200, { ok: true, storage: acStorageOk() })
  }

  const session = await verifyAppSession(String(body.sessionToken ?? ''), 'control')
  if (!session) {
    return json(res, 401, { error: 'Please sign in with your @agilegroup.co.in email OTP.' })
  }
  const email = normaliseEmail(session.email)
  if (!(await isAcAuthorisedEmail(email)) && !isSuiteAdminEmail(email)) {
    return json(res, 403, { error: 'Your email is not authorised for Agile Control yet.' })
  }

  const name = await resolveSuiteUserName(email)
  const portal = acPortalForEmail(email, String(body.portal || session.role || ''))
  if (!(await canAcAccessPortal(email, portal))) {
    return json(res, 403, {
      error:
        portal === 'management'
          ? 'Open the Staff portal. Management is for Director and assigned management users.'
          : 'Your email is not authorised for Agile Control yet.',
    })
  }
  const director = isAcDirector(email) || portal === 'management'
  const acUser = await findAcUserByEmail(email)
  /** Management-grade roles / Management portal may delete. HOD/Staff cannot delete any data. */
  const canDelete =
    director ||
    acRoleCanDelete(String(acUser?.role || '')) ||
    isSuiteAdminEmail(email)

  if (action === 'bootstrap') {
    await ensureSampleStrategicSites()
    const branches = await getBranches(true)
    return json(res, 200, {
      ok: true,
      email,
      name,
      portal,
      director,
      canDelete,
      role: acUser?.role || (director ? 'management' : 'operator'),
      storage: acStorageOk(),
      categories: AC_CATEGORIES,
      todayIst: misTodayIst(),
      branches: branches.map((b) => ({ id: b.id, name: b.name })),
      canOpenManagement: await canAcAccessPortal(email, 'management'),
    })
  }

  if (action === 'loadUsers') {
    const users = await getAcUsers()
    const branches = await getBranches(true)
    return json(res, 200, {
      ok: true,
      users,
      roles: [...AC_USER_ROLES],
      branches: branches.map((b) => ({ id: b.id, name: b.name })),
      canDelete,
      canAssign: true,
      version: '2026-08-17-roles',
    })
  }

  if (action === 'saveUsers') {
    const raw = Array.isArray(body.users) ? (body.users as Partial<AcPortalUser>[]) : []
    if (!raw.length) return json(res, 400, { error: 'Add at least one user.' })
    const incoming = raw.map((u) => normalizeAcPortalUser(u)).filter((u) => u.email.includes('@'))
    for (const u of incoming) {
      if (!u.name.trim()) return json(res, 400, { error: 'Please enter a name for every user.' })
    }
    const existing = await getAcUsers()
    if (!canDelete) {
      // HOD/Staff may assign (add/edit) but cannot remove rows
      const keep = new Map(incoming.map((u) => [u.email, u]))
      for (const old of existing) {
        if (!keep.has(old.email)) {
          return json(res, 403, {
            error: 'HOD / Staff cannot delete users. Ask Management to remove someone, or turn Active off.',
          })
        }
      }
    }
    await saveAcUsers(incoming)
    return json(res, 200, { ok: true, count: incoming.length })
  }

  if (action === 'deleteUser') {
    if (!canDelete) {
      return json(res, 403, { error: 'HOD / Staff cannot delete any data. Only Management can delete users.' })
    }
    const id = s(body.id, 60)
    const emailDel = s(body.email, 120).toLowerCase()
    if (!id && !emailDel) return json(res, 400, { error: 'User id or email required.' })
    const all = await getAcUsers()
    const next = all.filter((u) => (id ? u.id !== id : u.email !== emailDel))
    if (next.length === all.length) return json(res, 404, { error: 'User not found.' })
    await saveAcUsers(next)
    return json(res, 200, { ok: true, count: next.length })
  }

  if (action === 'listCombinedComplaints') {
    const [incidents, guardComplaints, branches] = await Promise.all([
      getAcIncidents(),
      getGuardComplaints(),
      getBranches(true),
    ])
    const incidentRows = incidents
      .slice()
      .sort((a, b) => String(b.occurredAt || b.createdAt).localeCompare(String(a.occurredAt || a.createdAt)))
      .slice(0, 200)
      .map((c) => ({
        source: 'incident' as const,
        heading: 'Incident Received',
        id: c.id,
        code: c.id,
        branchId: c.branchId,
        branchName: c.branchName,
        name: c.receivedFrom || c.clientName,
        subject: c.details || `${c.clientName} · ${c.location}`,
        status: c.informedHod === 'Yes' ? 'HOD informed' : 'HOD pending',
        receivedAt: c.occurredAt || c.createdAt,
        link: `/control/?portal=${encodeURIComponent(portal)}`,
      }))
    const guards = sortComplaintsNewestFirst(realComplaintsOnly(guardComplaints))
      .filter((c) => c.active)
      .slice(0, 200)
      .map((c) => ({
        source: 'guards' as const,
        heading: 'Guards Complaint',
        id: c.id,
        code: c.code,
        branchId: c.branchId,
        branchName: guardsBranchDisplayName(c.branchId, branches),
        name: c.guardName,
        subject: `${c.category} — ${c.subCategory}${c.complaintNote ? ` · ${c.complaintNote.slice(0, 80)}` : ''}`,
        status: c.status,
        receivedAt: c.registeredAt,
        link: `https://www.agilegroup-digital.co.in/guards?portal=management&case=${encodeURIComponent(c.id)}`,
      }))
    return json(res, 200, {
      ok: true,
      incidents: incidentRows,
      guards,
      complaints: [...incidentRows, ...guards]
        .sort((a, b) => String(b.receivedAt).localeCompare(String(a.receivedAt)))
        .slice(0, 300),
    })
  }

  if (action === 'createGuardComplaint') {
    const branchId = s(body.branchId, 40)
    const branches = await getBranches(true)
    const branch = branches.find((b) => b.id === branchId)
    const guardName = s(body.guardName, 120)
    const idNo = s(body.idNo, 40)
    const mobile = s(body.mobile, 20)
    const category = s(body.category, 80)
    const subCategory = s(body.subCategory, 120)
    const complaintNote = s(body.complaintNote, 4000)
    if (!branch) return json(res, 400, { error: 'Please select the branch.' })
    if (!guardName || !idNo || !mobile) {
      return json(res, 400, { error: 'Guard name, ID number and mobile are required.' })
    }
    if (!category && !subCategory && !complaintNote) {
      return json(res, 400, { error: 'Select a complaint category or describe the issue.' })
    }
    const code = await nextComplaintCode()
    const now = new Date().toISOString()
    const cat = category || 'Other Support'
    const complaint = normalizeComplaint({
      id: guardsNid('gc'),
      code,
      branchId: branch.id,
      guardName,
      idNo,
      mobile,
      clientName: s(body.clientName, 120),
      location: s(body.location, 120),
      category: cat,
      subCategory: subCategory || 'General',
      complaintNote,
      department: departmentForCategory(cat),
      registeredAt: now,
      status: 'received',
    })
    const list = await getGuardComplaints()
    list.push(complaint)
    await saveGuardComplaints(list)
    await logGuardEvent(
      complaint.id,
      'Control',
      'Complaint registered',
      `Guard ${complaint.guardName} registered through Agile Control ${portal === 'management' ? 'Management' : 'Staff'} portal.`,
      email,
    )
    const branchName = guardsBranchDisplayName(branch.id, branches)
    const notify = await notifyNewGuardComplaint(complaint, branchName)
    return json(res, 200, {
      ok: true,
      complaint: {
        id: complaint.id,
        code: complaint.code,
        url: `https://www.agilegroup-digital.co.in/guards?portal=management&case=${encodeURIComponent(complaint.id)}`,
        registerUrl: `https://www.agilegroup-digital.co.in/guards/register?branch=${encodeURIComponent(branchName)}`,
      },
      notify,
    })
  }

  if (action === 'dashboard') {
    const cases = await getAcCases()
    const checks = await getAcClientChecks()
    const incidents = await getAcIncidents()
    const nightCalls = await getAcNightCalls()
    const open = cases.filter((c) => c.status !== 'Closed' && c.status !== 'ClientConfirmed')
    const today = misTodayIst()
    const complaintsToday = cases.filter(
      (c) => c.category === 'ClientComplaint' && String(c.createdAt).slice(0, 10) === today,
    ).length
    const incidentsToday = incidents.filter((c) => c.dateYmd === today).length
    const nightToday = nightCalls.filter((c) => c.dateYmd === today)
    const pendingChecks = checks.filter((c) => c.status === 'Pending')
    const doneChecksToday = checks.filter(
      (c) => c.status === 'Done' && String(c.completedAt || '').slice(0, 10) === today,
    ).length
    return json(res, 200, {
      ok: true,
      kpis: {
        openP1: open.filter((c) => c.priority === 'P1').length,
        openP2: open.filter((c) => c.priority === 'P2').length,
        openAll: open.length,
        complaintsToday,
        incidentsToday,
        incidentsHodNo: incidents.filter((c) => c.dateYmd === today && c.informedHod !== 'Yes').length,
        nightCallsToday: nightToday.length,
        nightNotPicked: nightToday.filter((c) => c.pickedUp !== 'Yes').length,
        nightNoCallback: nightToday.filter((c) => c.pickedUp !== 'Yes' && c.calledBack !== 'Yes').length,
        slaBreaches: open.filter((c) => isSlaBreached(c)).length,
        checksPending: pendingChecks.length,
        checksDoneToday: doneChecksToday,
        criticalInstructionsPending: 0,
      },
      openCases: open.slice(0, 80),
      pendingChecks: pendingChecks.slice(0, 40),
      incidentsToday: incidents.filter((c) => c.dateYmd === today).slice(0, 80),
      nightCallsToday: nightToday.slice(0, 80),
    })
  }

  if (action === 'listCases') {
    let cases = await getAcCases()
    const status = s(body.status, 40)
    const priority = s(body.priority, 10) as AcPriority | ''
    const q = s(body.q, 80).toLowerCase()
    if (status) cases = cases.filter((c) => c.status === status)
    if (priority) cases = cases.filter((c) => c.priority === priority)
    if (q) {
      cases = cases.filter((c) =>
        [c.caseNo, c.summary, c.clientName, c.siteName, c.branchName, c.ownerName]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    }
    if (!director && session.branchId) {
      cases = cases.filter((c) => !c.branchId || c.branchId === session.branchId)
    }
    return json(res, 200, { ok: true, cases: cases.slice(0, 200) })
  }

  if (action === 'getCase') {
    const row = await findAcCase(s(body.caseId || body.caseNo, 40))
    if (!row) return json(res, 404, { error: 'Case not found.' })
    return json(res, 200, {
      ok: true,
      case: row,
      age: formatAge(incidentAgeMs(row)),
      slaBreached: isSlaBreached(row),
      isIncident: isIncidentCategory(row.category),
    })
  }

  if (action === 'createCase') {
    const category = s(body.category, 40) as AcCategory
    const priority = (s(body.priority, 4) || 'P3') as AcPriority
    const summary = s(body.summary, 240)
    if (!summary) return json(res, 400, { error: 'Summary is required.' })
    if (!AC_CATEGORIES.some((c) => c.id === category)) {
      return json(res, 400, { error: 'Invalid category.' })
    }
    const row = await createAcCase({
      category,
      priority: ['P1', 'P2', 'P3', 'P4'].includes(priority) ? priority : 'P3',
      summary,
      detail: s(body.detail, 4000),
      callerName: s(body.callerName, 120),
      callerPhone: s(body.callerPhone, 40),
      source: s(body.source, 80) || 'Command Centre',
      branchId: s(body.branchId, 40),
      branchName: s(body.branchName, 120),
      clientName: s(body.clientName, 160),
      siteName: s(body.siteName, 160),
      byEmail: email,
      byName: name,
    })
    return json(res, 200, { ok: true, case: row })
  }

  if (action === 'ackCase' || action === 'claimCase') {
    const row = await findAcCase(s(body.caseId || body.caseNo, 40))
    if (!row) return json(res, 404, { error: 'Case not found.' })
    if (row.status === 'Closed') return json(res, 400, { error: 'Case already closed.' })
    const now = new Date().toISOString()
    if (!row.acknowledgedAt) {
      row.acknowledgedAt = now
      row.acknowledgedBy = email
      row.status = 'Acknowledged'
    } else if (row.status === 'Acknowledged') {
      row.status = 'InProgress'
    }
    row.ownerEmail = email
    row.ownerName = name
    row.updatedAt = now
    row.timeline = [
      emptyTimeline(email, name, 'acknowledged', 'Case acknowledged / claimed'),
      ...(row.timeline || []),
    ].slice(0, 200)
    await upsertAcCase(row)
    await appendAcLog({
      byEmail: email,
      byName: name,
      kind: 'acknowledged',
      text: `${row.caseNo} acknowledged by ${name}`,
      caseNo: row.caseNo,
      branchId: row.branchId,
    })
    return json(res, 200, { ok: true, case: row })
  }

  if (action === 'updateCase') {
    const row = await findAcCase(s(body.caseId || body.caseNo, 40))
    if (!row) return json(res, 404, { error: 'Case not found.' })
    const now = new Date().toISOString()
    if (body.detail != null) row.detail = s(body.detail, 4000)
    if (body.evidenceNotes != null) row.evidenceNotes = s(body.evidenceNotes, 4000)
    if (body.nextActionNote != null) row.nextActionNote = s(body.nextActionNote, 400)
    if (body.nextActionDueAt != null) row.nextActionDueAt = s(body.nextActionDueAt, 40)
    if (body.clientInformed === true && !row.clientInformedAt) row.clientInformedAt = now
    if (body.policeInformed === true && !row.policeInformedAt) row.policeInformedAt = now
    if (body.managementInformed === true && !row.managementInformedAt) row.managementInformedAt = now
    if (Array.isArray(body.checklist)) {
      row.checklist = body.checklist.map((x) => s(x, 200)).filter(Boolean).slice(0, 30)
    }
    const note = s(body.note, 500)
    if (note) {
      row.timeline = [emptyTimeline(email, name, 'note', note), ...(row.timeline || [])].slice(0, 200)
    }
    row.updatedAt = now
    await upsertAcCase(row)
    return json(res, 200, { ok: true, case: row })
  }

  if (action === 'resolveCase') {
    const row = await findAcCase(s(body.caseId || body.caseNo, 40))
    if (!row) return json(res, 404, { error: 'Case not found.' })
    const now = new Date().toISOString()
    row.status = 'Resolved'
    row.resolvedAt = now
    row.resolvedBy = email
    row.updatedAt = now
    row.timeline = [
      emptyTimeline(email, name, 'resolved', s(body.note, 500) || 'Marked resolved'),
      ...(row.timeline || []),
    ].slice(0, 200)
    await upsertAcCase(row)
    await appendAcLog({
      byEmail: email,
      byName: name,
      kind: 'resolved',
      text: `${row.caseNo} resolved`,
      caseNo: row.caseNo,
      branchId: row.branchId,
    })
    return json(res, 200, { ok: true, case: row })
  }

  if (action === 'confirmClient' || action === 'closeCase') {
    const row = await findAcCase(s(body.caseId || body.caseNo, 40))
    if (!row) return json(res, 404, { error: 'Case not found.' })
    const now = new Date().toISOString()
    if (action === 'confirmClient') {
      row.clientConfirmedAt = now
      row.status = 'ClientConfirmed'
      row.timeline = [
        emptyTimeline(email, name, 'client_confirmed', 'Client confirmed closure'),
        ...(row.timeline || []),
      ].slice(0, 200)
    }
    if (action === 'closeCase') {
      if ((row.priority === 'P1' || row.priority === 'P2') && !director && row.status !== 'ClientConfirmed' && row.status !== 'Resolved') {
        return json(res, 400, {
          error: 'P1/P2 cases need resolve (and preferably client confirm) before close — or Director close.',
        })
      }
      row.status = 'Closed' as AcCaseStatus
      row.closedAt = now
      row.closedBy = email
      row.timeline = [
        emptyTimeline(email, name, 'closed', s(body.note, 500) || 'Case closed'),
        ...(row.timeline || []),
      ].slice(0, 200)
    }
    row.updatedAt = now
    await upsertAcCase(row)
    await appendAcLog({
      byEmail: email,
      byName: name,
      kind: action,
      text: `${row.caseNo} ${action}`,
      caseNo: row.caseNo,
      branchId: row.branchId,
    })
    return json(res, 200, { ok: true, case: row })
  }

  if (action === 'logbook') {
    const q = s(body.q, 80).toLowerCase()
    let log = await getAcLog(400)
    if (q) {
      log = log.filter((e) =>
        [e.text, e.caseNo, e.byName, e.kind].join(' ').toLowerCase().includes(q),
      )
    }
    return json(res, 200, { ok: true, log })
  }

  if (action === 'addLog') {
    const text = s(body.text, 1000)
    if (!text) return json(res, 400, { error: 'Log text required.' })
    const entry = await appendAcLog({
      byEmail: email,
      byName: name,
      kind: 'manual',
      text,
      caseNo: s(body.caseNo, 40),
      branchId: s(body.branchId, 40),
    })
    return json(res, 200, { ok: true, entry })
  }

  if (action === 'hotoPreview') {
    const cases = await getAcCases()
    const open = cases.filter((c) => c.status !== 'Closed' && c.status !== 'ClientConfirmed')
    const checks = (await getAcClientChecks()).filter((c) => c.status === 'Pending')
    return json(res, 200, {
      ok: true,
      summary: {
        openCases: open.length,
        p1: open.filter((c) => c.priority === 'P1').length,
        p2: open.filter((c) => c.priority === 'P2').length,
        callbacksPending: open.filter((c) => c.category === 'ClientComplaint' || c.category === 'ClientInstruction').length,
        criticalInstructions: open.filter((c) => c.category === 'ClientInstruction').length,
        incidentsMonitoring: open.filter((c) => isIncidentCategory(c.category)).length,
        pendingChecks: checks.length,
      },
      openCases: open.slice(0, 100),
      pendingChecks: checks.slice(0, 40),
    })
  }

  if (action === 'hotoAccept') {
    const incomingEmail = s(body.incomingEmail, 120) || email
    const incomingName = s(body.incomingName, 120) || (incomingEmail === email ? name : incomingEmail)
    const checklist = (body.checklist && typeof body.checklist === 'object'
      ? body.checklist
      : {}) as Record<string, boolean>
    const required = [
      'openIncidents',
      'openComplaints',
      'pendingCallbacks',
      'guardEmergencies',
      'deploymentShortages',
      'managementInstructions',
      'sensitiveSites',
      'criticalClientCalls',
      'technicalProblems',
      'salesLeads',
      'specialEvents',
    ]
    for (const k of required) {
      if (!checklist[k]) {
        return json(res, 400, {
          error: 'All mandatory HOTO checklist items must be confirmed before accept.',
        })
      }
    }
    const previewCases = (await getAcCases()).filter(
      (c) => c.status !== 'Closed' && c.status !== 'ClientConfirmed',
    )
    const now = new Date().toISOString()
    const rec: AcHotoRecord = {
      id: acNid('ho'),
      createdAt: now,
      outgoingEmail: email,
      outgoingName: name,
      incomingEmail,
      incomingName,
      acceptedAt: now,
      openCasesP1: previewCases.filter((c) => c.priority === 'P1').length,
      openCasesP2: previewCases.filter((c) => c.priority === 'P2').length,
      callbacksPending: previewCases.filter(
        (c) => c.category === 'ClientComplaint' || c.category === 'ClientInstruction',
      ).length,
      criticalInstructions: previewCases.filter((c) => c.category === 'ClientInstruction').length,
      incidentsMonitoring: previewCases.filter((c) => isIncidentCategory(c.category)).length,
      notes: s(body.notes, 2000),
      checklist,
      caseNos: previewCases.slice(0, 80).map((c) => c.caseNo),
    }
    const list = await getAcHoto()
    list.unshift(rec)
    await saveAcHoto(list)
    await appendAcLog({
      byEmail: email,
      byName: name,
      kind: 'hoto',
      text: `HOTO accepted — out ${name} → in ${incomingName} · P1 ${rec.openCasesP1} · P2 ${rec.openCasesP2}`,
      caseNo: '',
      branchId: '',
    })
    return json(res, 200, { ok: true, hoto: rec })
  }

  if (action === 'listHoto') {
    return json(res, 200, { ok: true, hoto: (await getAcHoto()).slice(0, 50) })
  }

  if (action === 'listSites') {
    await ensureSampleStrategicSites()
    return json(res, 200, { ok: true, sites: await getAcStrategicSites() })
  }

  if (action === 'saveSite' && director) {
    const sites = await getAcStrategicSites()
    const id = s(body.id, 40) || acNid('st')
    const row: AcStrategicSite = {
      id,
      branchId: s(body.branchId, 40),
      branchName: s(body.branchName, 120),
      clientName: s(body.clientName, 160),
      siteName: s(body.siteName, 160),
      contactName: s(body.contactName, 120),
      contactPhone: s(body.contactPhone, 40),
      tier: (s(body.tier, 20) as AcStrategicSite['tier']) || 'Gold',
      frequencyPerWeek: Math.max(1, Number(body.frequencyPerWeek) || 3),
      active: body.active !== false,
      lastCheckAt: s(body.lastCheckAt, 40),
    }
    const i = sites.findIndex((x) => x.id === id)
    if (i >= 0) sites[i] = row
    else sites.unshift(row)
    await saveAcStrategicSites(sites)
    return json(res, 200, { ok: true, site: row })
  }

  if (action === 'listChecks') {
    return json(res, 200, { ok: true, checks: (await getAcClientChecks()).slice(0, 200) })
  }

  if (action === 'generateChecks' && director) {
    const result = await generateAcClientChecks({ force: body.force === true })
    return json(res, 200, { ok: true, ...result })
  }

  if (action === 'completeCheck') {
    const id = s(body.checkId, 40)
    const checks = await getAcClientChecks()
    const row = checks.find((c) => c.id === id)
    if (!row) return json(res, 404, { error: 'Check not found.' })
    row.status = 'Done'
    row.completedAt = new Date().toISOString()
    row.completedByEmail = email
    row.completedByName = name
    row.guardAttendance = s(body.guardAttendance, 120)
    row.alertness = s(body.alertness, 120)
    row.supervisorVisit = s(body.supervisorVisit, 120)
    row.anyIncident = s(body.anyIncident, 120)
    row.clientSatisfaction = s(body.clientSatisfaction, 120)
    row.immediateAttention = s(body.immediateAttention, 200)
    row.notes = s(body.notes, 1000)
    const linked = await completeClientCheckAsCase(row, email, name)
    if (linked) row.caseNo = linked.caseNo
    await upsertAcClientCheck(row)
    const sites = await getAcStrategicSites()
    const si = sites.findIndex((x) => x.id === row.siteId)
    if (si >= 0) {
      sites[si] = { ...sites[si], lastCheckAt: row.completedAt }
      await saveAcStrategicSites(sites)
    }
    await appendAcLog({
      byEmail: email,
      byName: name,
      kind: 'client_check',
      text: `CONTROL CHECK done — ${row.clientName} / ${row.siteName}${row.caseNo ? ` · ${row.caseNo}` : ''}`,
      caseNo: row.caseNo,
      branchId: row.branchId,
    })
    return json(res, 200, { ok: true, check: row, case: linked })
  }

  if (action === 'listIncidents') {
    const date = s(body.date, 10) || misTodayIst()
    const all = await getAcIncidents()
    const rows = all.filter((r) => !date || r.dateYmd === date)
    return json(res, 200, { ok: true, date, incidents: rows.slice(0, 300) })
  }

  if (action === 'saveIncident') {
    const occurredAt = s(body.occurredAt, 40)
    const dateYmd = s(body.dateYmd, 10) || occurredAt.slice(0, 10) || misTodayIst()
    const informedHod = acYn(body.informedHod)
    const informedHodAt = informedHod === 'Yes' ? s(body.informedHodAt, 40) || occurredAt : ''
    if (!s(body.clientName, 160)) return json(res, 400, { error: 'Client name is required.' })
    if (!s(body.location, 200)) return json(res, 400, { error: 'Location is required.' })
    if (!s(body.details, 4000)) return json(res, 400, { error: 'Incident details are required.' })
    if (!informedHod) return json(res, 400, { error: 'Mark Informed to HOD as Yes or No.' })
    const existing = s(body.id, 40)
      ? (await getAcIncidents()).find((r) => r.id === s(body.id, 40))
      : undefined
    const row = emptyIncidentReceived({
      ...existing,
      id: existing?.id,
      dateYmd,
      occurredAt: occurredAt || existing?.occurredAt,
      clientName: s(body.clientName, 160),
      location: s(body.location, 200),
      receivedFrom: s(body.receivedFrom, 160),
      details: s(body.details, 4000),
      branchId: s(body.branchId, 40),
      branchName: s(body.branchName, 120),
      informedHod,
      informedHodAt,
      createdAt: existing?.createdAt,
      createdByEmail: existing?.createdByEmail || email,
      createdByName: existing?.createdByName || name,
    })
    await upsertAcIncident(row)
    await appendAcLog({
      byEmail: email,
      byName: name,
      kind: 'incident_received',
      text: `Incident received — ${row.clientName} / ${row.location} · HOD ${row.informedHod || '—'}`,
      caseNo: '',
      branchId: row.branchId,
    })
    return json(res, 200, { ok: true, incident: row })
  }

  if (action === 'listNightCalls') {
    const date = s(body.date, 10) || misTodayIst()
    const all = await getAcNightCalls()
    const rows = all.filter((r) => !date || r.dateYmd === date)
    return json(res, 200, { ok: true, date, nightCalls: rows.slice(0, 400) })
  }

  if (action === 'saveNightCall') {
    const dateYmd = s(body.dateYmd, 10) || misTodayIst()
    if (!s(body.callTime, 8)) return json(res, 400, { error: 'Call time is required.' })
    if (!s(body.clientName, 160)) return json(res, 400, { error: 'Client name is required.' })
    if (!s(body.location, 200)) return json(res, 400, { error: 'Location is required.' })
    if (!s(body.guardName, 120)) return json(res, 400, { error: 'Guard name is required.' })
    if (!s(body.guardMobile, 20)) return json(res, 400, { error: 'Guard mobile is required.' })
    const pickedUp = acYn(body.pickedUp)
    const calledBack = acYn(body.calledBack)
    const informedHod = acYn(body.informedHod)
    if (!pickedUp || !calledBack || !informedHod) {
      return json(res, 400, { error: 'Mark Picked Up, Called Back and Inform HODs as Yes or No.' })
    }
    const existing = s(body.id, 40)
      ? (await getAcNightCalls()).find((r) => r.id === s(body.id, 40))
      : undefined
    const row = emptyNightCall({
      ...existing,
      id: existing?.id,
      dateYmd,
      callTime: s(body.callTime, 8),
      clientName: s(body.clientName, 160),
      location: s(body.location, 200),
      guardName: s(body.guardName, 120),
      guardMobile: s(body.guardMobile, 20),
      pickedUp,
      calledBack,
      informedHod,
      branchId: s(body.branchId, 40),
      branchName: s(body.branchName, 120),
      notes: s(body.notes, 2000),
      createdAt: existing?.createdAt,
      createdByEmail: existing?.createdByEmail || email,
      createdByName: existing?.createdByName || name,
    })
    await upsertAcNightCall(row)
    await appendAcLog({
      byEmail: email,
      byName: name,
      kind: 'night_call',
      text: `Night call — ${row.guardName} ${row.guardMobile} · ${row.clientName} · picked ${row.pickedUp} · back ${row.calledBack} · HOD ${row.informedHod}`,
      caseNo: '',
      branchId: row.branchId,
    })
    return json(res, 200, { ok: true, nightCall: row })
  }

  if (action === 'runEscalations' && director) {
    const result = await runAcEscalations()
    return json(res, 200, { ok: true, ...result })
  }

  if (action === 'listNightVisitVehicles') {
    const all = await getAcCases()
    const rows = all
      .filter((c) => {
        const src = String(c.source || '')
        return (
          c.misSourceKind === 'night' ||
          c.misSourceKind === 'client' ||
          c.misSourceKind === 'training' ||
          src.startsWith('MIS Night Visit') ||
          src.startsWith('MIS Client Visit') ||
          src.startsWith('Training OJT')
        )
      })
      .filter((c) => c.status !== 'Closed')
      .slice(0, 300)
    return json(res, 200, { ok: true, cases: rows })
  }

  if (action === 'acceptVehicleAllotment') {
    const row = await findAcCase(s(body.caseId || body.caseNo, 40))
    if (!row) return json(res, 404, { error: 'Case not found.' })
    const driverName = s(body.driverName, 120)
    const vehicleRegNo = s(body.vehicleRegNo, 40)
    if (!driverName) return json(res, 400, { error: 'Enter driver name.' })
    const { applyVehicleAllotmentFromControl } = await import(
      '../_lib/mis/apply-vehicle-allotment-from-control.js'
    )
    const applied = await applyVehicleAllotmentFromControl({
      caseNo: row.caseNo,
      driverName,
      vehicleRegNo,
      kind:
        row.misSourceKind === 'client'
          ? 'client'
          : row.misSourceKind === 'night'
            ? 'night'
            : row.misSourceKind === 'training'
              ? 'training'
              : undefined,
      branchId: row.branchId,
      month: row.misVisitMonth,
      sourceId: row.misSourceId,
    })
    if (!applied.ok) return json(res, 400, { error: applied.error })
    const now = new Date().toISOString()
    row.vehicleDriverName = driverName
    row.vehicleRegNo = vehicleRegNo
    row.vehicleAcceptedAt = now
    row.misSourceKind = applied.kind
    row.misSourceId = applied.sourceId || row.misSourceId
    row.updatedAt = now
    if (!row.acknowledgedAt) {
      row.acknowledgedAt = now
      row.acknowledgedBy = email
      row.status = 'Acknowledged'
    } else if (row.status === 'Open' || row.status === 'Acknowledged') {
      row.status = 'InProgress'
    }
    row.ownerEmail = email
    row.ownerName = name
    row.timeline = [
      emptyTimeline(
        email,
        name,
        'vehicle_accepted',
        `Vehicle accepted — Driver: ${driverName}${vehicleRegNo ? ` · ${vehicleRegNo}` : ''} → MIS ${applied.kind}`,
      ),
      ...(row.timeline || []),
    ].slice(0, 200)
    await upsertAcCase(row)
    await appendAcLog({
      byEmail: email,
      byName: name,
      kind: 'vehicle_accepted',
      text: `${row.caseNo} vehicle accepted — ${driverName}${vehicleRegNo ? ` / ${vehicleRegNo}` : ''}`,
      caseNo: row.caseNo,
      branchId: row.branchId,
    })
    return json(res, 200, { ok: true, case: row, mis: applied })
  }

  return json(res, 400, { error: 'Unknown action.' })
}
