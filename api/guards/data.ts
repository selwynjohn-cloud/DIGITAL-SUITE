import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import { isSuperAdminEmail } from '../_lib/auth.js'
import { getBranches, getUsers as getMisUsers, getActiveBranch } from '../_lib/mis/store.js'
import { isHodUser } from '../_lib/mis/digest.js'
import { listAllHodContacts } from '../_lib/guards/hod-contacts.js'
import {
  computeComplaintAnalysis,
  computeGuardsDashboard,
  delayedComplaintAnalysis,
  weeklyManagementReport,
} from '../_lib/guards/dashboard.js'
import { displayStatus } from '../_lib/guards/completion.js'
import { PAGE_HELP, MANAGEMENT_PAGE_HELP } from '../_lib/guards/page-help.js'
import {
  notifyNewGuardComplaint,
  sendCompletionLetter,
  sendDelayedEscalationMail,
  sendDelayedReminderMail,
  sendDeptAppreciationMail,
  sendComplaintStatusMail,
  sendDashboardShareMail,
  sendFeedbackRequest,
  sendFeedbackSubmittedMail,
  sendShareLinkEmail,
  sendShareLinkWhatsApp,
  sendWeeklyManagementReport,
} from '../_lib/guards/notify.js'
import {
  applySla,
  complaintMatchesBranch,
  departmentForCategory,
  feedbackSummary,
  filterByBranch,
  getCommunications,
  getComplaints,
  getDeptStaff,
  getEvents,
  getFeedback,
  getOpsStaff,
  getPortalUsers,
  guardsNid,
  guardsStorageOk,
  logCommunication,
  logEvent,
  nextComplaintCode,
  normalizeComplaint,
  normalizeDeptStaff,
  normalizeOps,
  normalizePortalUser,
  canonicalBranchStorageId,
  guardsBranchList,
  healGuardsStaffBranches,
  healComplaintBranches,
  healComplaintAssignments,
  branchDisplayName,
  guardsFmtIstDateTime,
  resolveBranchId,
  saveComplaints,
  saveDeptStaff,
  saveFeedback,
  saveOpsStaff,
  savePortalUsers,
  searchComplaints,
  sortComplaintsNewestFirst,
  type GuardComplaint,
} from '../_lib/guards/store.js'

async function resolveUser(
  email: string,
  sessionRole: 'staff' | 'management',
  cache?: {
    portalUsers?: Awaited<ReturnType<typeof getPortalUsers>>
    misUsers?: Awaited<ReturnType<typeof getMisUsers>>
    branches?: Awaited<ReturnType<typeof getBranches>>
  },
): Promise<{ role: 'management' | 'hod'; branchId: string | null; name: string; canAssign: boolean }> {
  if (sessionRole === 'management' || isSuperAdminEmail(email)) {
    return { role: 'management', branchId: null, name: 'Management', canAssign: true }
  }
  const portalUsers = cache?.portalUsers ?? (await getPortalUsers())
  const pu = portalUsers.find((u) => u.email === email && u.active)
  if (pu) {
    const role = pu.role === 'management' ? 'management' : 'hod'
    if (role === 'hod' && pu.branchId) {
      const active = await getActiveBranch(pu.branchId)
      if (!active) {
        return { role: 'hod', branchId: null, name: pu.name, canAssign: false }
      }
    }
    return { role, branchId: pu.branchId || null, name: pu.name, canAssign: role === 'hod' || role === 'management' }
  }

  const misUsers = cache?.misUsers ?? (await getMisUsers())
  const mu = misUsers.find((u) => u.email?.toLowerCase() === email.toLowerCase() && u.active !== false)
  if (mu && isHodUser(mu)) {
    const misBranch = await getActiveBranch(mu.branchId || '')
    if (!misBranch) {
      return { role: 'hod', branchId: null, name: mu.name || email, canAssign: false }
    }
    const branches = cache?.branches ?? (await getBranches(true))
    const resolved = resolveBranchId(misBranch.id, branches)
    return { role: 'hod', branchId: resolved?.id || misBranch.id, name: mu.name || email, canAssign: true }
  }
  return { role: 'hod', branchId: null, name: email, canAssign: false }
}

function branchScope(
  user: { role: 'management' | 'hod'; branchId: string | null },
  branchIdFromBody: string,
) {
  if (user.role === 'management') return branchIdFromBody.trim() || null
  return user.branchId
}

async function processDelayedEscalations(
  all: GuardComplaint[],
  branches: { id: string; name: string }[],
  opts?: { sendEmails?: boolean },
): Promise<GuardComplaint[]> {
  const sendEmails = opts?.sendEmails !== false
  let changed = false
  for (const c of all) {
    const n = applySla(c)
    if (sendEmails && n.isDelayed && n.status !== 'solved' && !n.delayedNotifiedAt) {
      const branchName = branchDisplayName(n.branchId, branches)
      const mail = await sendDelayedEscalationMail(n, branchName)
      n.delayedNotifiedAt = new Date().toISOString()
      changed = true
      await logEvent(n.id, 'SLA', 'Delayed escalation', `Email sent to Director & HODs.`, 'System')
      if (mail.ok) {
        await logCommunication({
          complaintId: n.id,
          code: n.code,
          channel: 'email',
          type: 'delayed_escalation',
          subject: `DELAYED — ${n.code}`,
          body: `Delayed complaint escalation — ${branchName}`,
          sentTo: (mail.to || []).join(', '),
          sentBy: 'System',
        })
      }
    }
    Object.assign(c, n)
  }
  if (changed) await saveComplaints(all)
  return all
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = (req.body ?? {}) as Record<string, unknown>
  const action = String(body.action ?? '')

  if (action === 'status') return res.status(200).json({ ok: true, storage: guardsStorageOk() })

  if (action === 'register') {
    if (!guardsStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
    const branches = await getBranches()
    const branchName = String(body.branch ?? '').trim()
    const branch = resolveBranchId(branchName, branches)
    const branchId = branch?.id || canonicalBranchStorageId(branchName, branches) || branchName
    const category = String(body.category ?? '').trim()
    const subCategory = String(body.subCategory ?? '').trim()
    const note = String(body.complaintNote ?? '').trim()
    if (!String(body.guardName ?? '').trim() || !String(body.idNo ?? '').trim()) {
      return res.status(400).json({ error: 'Guard name and ID number are required.' })
    }
    if (!category && !subCategory && !note) {
      return res.status(400).json({ error: 'Please select a complaint category or describe the issue.' })
    }

    const code = await nextComplaintCode()
    const now = new Date().toISOString()
    const cat = category || 'Other Support'
    const complaint = normalizeComplaint({
      id: guardsNid('gc'),
      code,
      branchId,
      guardName: String(body.guardName ?? '').slice(0, 120),
      idNo: String(body.idNo ?? '').slice(0, 40),
      mobile: String(body.mobile ?? '').slice(0, 20),
      clientName: String(body.clientName ?? '').slice(0, 120),
      location: String(body.location ?? '').slice(0, 120),
      category: cat,
      subCategory: subCategory || 'General',
      complaintNote: note,
      referralJoined: Boolean(body.referralJoined),
      referrals: Array.isArray(body.referrals) ? body.referrals : [],
      department: departmentForCategory(cat),
      registeredAt: now,
      status: 'received',
    })

    const list = await getComplaints()
    list.push(complaint)
    await saveComplaints(list)
    await logEvent(
      complaint.id,
      'System',
      'Complaint registered',
      `Guard ${complaint.guardName} registered via QR/form.`,
      'Guard',
    )

    const branchLabel = branchDisplayName(branchId, branches)
    const notify = await notifyNewGuardComplaint(complaint, branchLabel)

    return res.status(200).json({
      ok: true,
      code: complaint.code,
      complaintId: complaint.id,
      message: `Thank you. Your complaint code is ${complaint.code}. You will receive a response within 24 hours.`,
      notify,
    })
  }

  if (action === 'submitFeedback') {
    if (!guardsStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
    const code = String(body.code ?? '').trim()
    const rating = Number(body.rating)
    const comment = String(body.comment ?? '').trim()
    if (!code) return res.status(400).json({ error: 'Complaint code required.' })
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Please choose a rating from 1 to 5.' })
    }
    const branches = await getBranches()
    const all = await getComplaints()
    const c = all.find((x) => x.code === code)
    if (!c) return res.status(404).json({ error: 'Complaint not found.' })
    const list = await getFeedback()
    if (list.some((f) => f.complaintId === c.id)) {
      return res.status(400).json({ error: 'Feedback already submitted for this complaint.' })
    }
    const branchName = branchDisplayName(c.branchId, branches)
    const submittedAt = new Date().toISOString()
    list.push({
      id: guardsNid('fb'),
      complaintId: c.id,
      code: c.code,
      branchId: c.branchId,
      guardName: c.guardName,
      idNo: c.idNo,
      category: c.category,
      mobile: c.mobile,
      rating: Math.round(rating),
      comment: comment.slice(0, 500),
      submittedAt,
    })
    await saveFeedback(list)
    const mail = await sendFeedbackSubmittedMail(c, branchName, Math.round(rating), comment)
    if (mail.ok) {
      await logCommunication({
        complaintId: c.id,
        code: c.code,
        channel: 'email',
        type: 'feedback_received',
        subject: `Guard Feedback — ${c.code} — ${rating}/5`,
        body: comment || `${rating} stars`,
        sentTo: (mail.to || []).join(', '),
        sentBy: 'Guard',
      })
      await logEvent(c.id, 'Guard', 'Feedback submitted', `${rating}/5 stars`, c.guardName)
    }
    return res.status(200).json({ ok: true, message: 'Thank you for your feedback!' })
  }

  const session = await verifyAppSession(String(body.sessionToken ?? ''), 'guards')
  if (!session) return res.status(401).json({ error: 'Please sign in with your @agilegroup.co.in email OTP.' })

  const isLoad = action === 'login' || action === 'load'

  const [branches, complaintsRaw, portalUsers, misUsers, events, communications] =
    await Promise.all([
      getBranches(),
      getComplaints(),
      getPortalUsers(),
      getMisUsers(),
      isLoad ? Promise.resolve([]) : getEvents(),
      isLoad ? Promise.resolve([]) : getCommunications(),
    ])

  const healedStaff = await healGuardsStaffBranches(branches)
  const opsStaff = healedStaff.ops
  const deptStaff = healedStaff.dept
  const branchList = guardsBranchList(branches)

  const user = await resolveUser(session.email, session.role, { branches, portalUsers, misUsers })
  if (session.role === 'staff' && user.role === 'hod' && !user.branchId && !user.canAssign) {
    const mu = misUsers.find((u) => u.email?.toLowerCase() === session.email.toLowerCase() && u.active !== false)
    if (mu?.branchId && !(await getActiveBranch(mu.branchId))) {
      return res.status(403).json({
        error:
          'This branch is deactivated. Only activated branch teams can access the portal. Contact management.',
      })
    }
  }
  const scopeBranch = branchScope(user, String(body.branchId ?? ''))

  if (user.role === 'hod' && !scopeBranch && action !== 'login') {
    return res.status(400).json({ error: 'Your account is not linked to a branch. Contact Head Office.' })
  }

  if (action === 'loadComms') {
    const allComms = await getCommunications()
    const scopedComplaints = scopeBranch
      ? filterByBranch(await getComplaints(), scopeBranch, branches)
      : await getComplaints()
    const comms = scopeBranch
      ? allComms.filter((c) => scopedComplaints.some((x) => x.id === c.complaintId))
      : allComms
    return res.status(200).json({
      ok: true,
      communications: comms.slice().sort((a, b) => String(b.sentAt).localeCompare(String(a.sentAt))),
    })
  }

  const healedAssignments = await healComplaintAssignments(
    branches,
    complaintsRaw,
    opsStaff,
    deptStaff,
  )
  const healedBranches = await healComplaintBranches(branches, healedAssignments.complaints)

  let allComplaints = await processDelayedEscalations(healedBranches.complaints, branches, {
    sendEmails: !isLoad,
  })

  let complaints = allComplaints.map((c) => applySla(c))
  const dirty = !isLoad && complaints.some((c, i) => c.isDelayed !== complaintsRaw[i]?.isDelayed)
  if (dirty) await saveComplaints(complaints)

  if (scopeBranch) {
    complaints = filterByBranch(complaints, scopeBranch, branches)
  }

  const ops = scopeBranch ? filterByBranch(opsStaff, scopeBranch, branches) : opsStaff
  const dept = scopeBranch ? filterByBranch(deptStaff, scopeBranch, branches) : deptStaff
  const comms = scopeBranch
    ? communications.filter((c) => {
        const row = complaints.find((x) => x.id === c.complaintId)
        return Boolean(row)
      })
    : communications

  const searchQ = String(body.search ?? '').trim()
  if (searchQ) complaints = searchComplaints(complaints, searchQ)
  complaints = sortComplaintsNewestFirst(complaints)

  if (action === 'login' || action === 'load') {
    const branchNameMap = Object.fromEntries(
      branchList.map((b) => [b.id, b.name]),
    )
    const enrichStaff = <T extends { branchId: string }>(row: T) => ({
      ...row,
      branchName: branchDisplayName(row.branchId, branches),
    })
    const enrichedComplaints = complaints.map((c) => {
      const ops = opsStaff.find((o) => o.id === c.opsStaffId)
      const dept = deptStaff.find((d) => d.id === c.deptStaffId)
      const opsBranchOk = !ops || complaintMatchesBranch(ops.branchId, c.branchId, branches)
      const deptBranchOk = !dept || complaintMatchesBranch(dept.branchId, c.branchId, branches)
      return {
        ...c,
        branchName: branchDisplayName(c.branchId, branches),
        registeredAtLabel: guardsFmtIstDateTime(c.registeredAt),
        opsStaffBranchName: ops ? branchDisplayName(ops.branchId, branches) : '',
        deptStaffBranchName: dept ? branchDisplayName(dept.branchId, branches) : '',
        assignmentMismatch: Boolean((ops && !opsBranchOk) || (dept && !deptBranchOk)),
      }
    })
    const dash = computeGuardsDashboard(complaints, ops, branchNameMap)
    const delayed = delayedComplaintAnalysis(complaints)
    const analysis = computeComplaintAnalysis(complaints)
    const branchName = scopeBranch
      ? branches.find((b) => b.id === scopeBranch)?.name || scopeBranch
      : 'All branches'
    const weekly = weeklyManagementReport(complaints, branchName)
    const feedbackRaw = await getFeedback()
    const feedback = scopeBranch ? filterByBranch(feedbackRaw, scopeBranch, branches) : feedbackRaw

    return res.status(200).json({
      ok: true,
      role: user.role,
      branchId: scopeBranch,
      branchName,
      email: session.email,
      name: user.name,
      canAssign: user.canAssign,
      branches: user.role === 'management' ? branchList : [],
      complaints: enrichedComplaints,
      opsStaff: ops.map(enrichStaff),
      deptStaff: dept.map(enrichStaff),
      communications: comms
        .slice()
        .sort((a, b) => String(b.sentAt).localeCompare(String(a.sentAt))),
      events: isLoad ? [] : events,
      dashboard: dash,
      delayedAnalysis: delayed,
      complaintAnalysis: analysis,
      weeklyReport: weekly,
      portalUsers: isLoad ? [] : user.role === 'management' ? portalUsers : [],
      shareUrl: `https://www.agilegroup-digital.co.in/guards/register?branch=${encodeURIComponent(branchName)}`,
      pageHelp: user.role === 'management' ? MANAGEMENT_PAGE_HELP : PAGE_HELP,
      feedback,
      feedbackSummary: feedbackSummary(feedback),
      hodContacts: listAllHodContacts(branchList, misUsers, portalUsers),
    })
  }

  if (action === 'escalateDelayed') {
    const all = await getComplaints()
    await processDelayedEscalations(all, branches, { sendEmails: true })
    return res.status(200).json({ ok: true })
  }

  if (!guardsStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })

  if (action === 'saveOps') {
    const rawBranch = scopeBranch || String(body.branchId ?? '')
    const branchId = canonicalBranchStorageId(rawBranch, branches)
    const row = normalizeOps({
      id: String(body.id ?? ''),
      branchId,
      name: String(body.name ?? ''),
      mobile: String(body.mobile ?? ''),
      email: String(body.email ?? ''),
      whatsApp: String(body.whatsApp ?? body.mobile ?? ''),
      active: body.active !== false,
    })
    if (!row.branchId) return res.status(400).json({ error: 'Branch required.' })
    if (!row.name.trim()) return res.status(400).json({ error: 'Name required.' })
    const all = await getOpsStaff()
    const idx = all.findIndex((o) => o.id === row.id)
    if (idx >= 0) all[idx] = row
    else all.push(row)
    await saveOpsStaff(all)
    return res.status(200).json({ ok: true })
  }

  if (action === 'saveDept') {
    const rawBranch = scopeBranch || String(body.branchId ?? '')
    const branchId = canonicalBranchStorageId(rawBranch, branches)
    const row = normalizeDeptStaff({
      id: String(body.id ?? ''),
      branchId,
      department: String(body.department ?? ''),
      name: String(body.name ?? ''),
      email: String(body.email ?? ''),
      mobile: String(body.mobile ?? ''),
      active: body.active !== false,
    })
    if (!row.branchId) return res.status(400).json({ error: 'Branch required.' })
    if (!row.name.trim()) return res.status(400).json({ error: 'Name required.' })
    const all = await getDeptStaff()
    const idx = all.findIndex((d) => d.id === row.id)
    if (idx >= 0) all[idx] = row
    else all.push(row)
    await saveDeptStaff(all)
    return res.status(200).json({ ok: true })
  }

  if (action === 'assignComplaint') {
    if (!user.canAssign) return res.status(403).json({ error: 'Only HOD / RM can assign complaints.' })
    const id = String(body.complaintId ?? '')
    const opsId = String(body.opsStaffId ?? '')
    const deptId = String(body.deptStaffId ?? '')
    const deptEmailManual = String(body.deptStaffEmail ?? '').trim()
    const all = await getComplaints()
    const c = all.find((x) => x.id === id)
    if (!c) return res.status(404).json({ error: 'Complaint not found.' })
    if (scopeBranch && !complaintMatchesBranch(c.branchId, scopeBranch, branches))
      return res.status(403).json({ error: 'Branch access only.' })

    const staffList = await getOpsStaff()
    const deptList = await getDeptStaff()
    const staff = staffList.find((o) => o.id === opsId)
    const ds = deptList.find((d) => d.id === deptId)

    if (staff && !complaintMatchesBranch(staff.branchId, c.branchId, branches)) {
      return res.status(400).json({
        error: `Operations staff (${staff.name}) is for ${branchDisplayName(staff.branchId, branches)} — this complaint is ${branchDisplayName(c.branchId, branches)}. Pick staff from the same branch.`,
      })
    }
    if (ds && !complaintMatchesBranch(ds.branchId, c.branchId, branches)) {
      return res.status(400).json({
        error: `Department staff (${ds.name}) is for ${branchDisplayName(ds.branchId, branches)} — this complaint is ${branchDisplayName(c.branchId, branches)}. Pick staff from the same branch.`,
      })
    }

    if (staff) {
      c.opsStaffId = staff.id
      c.opsStaffName = staff.name
      c.opsStaffEmail = staff.email
    }
    if (ds) {
      c.deptStaffId = ds.id
      c.deptStaffName = ds.name
      c.deptStaffEmail = ds.email
      c.department = ds.department
    } else if (deptEmailManual.includes('@')) {
      c.deptStaffEmail = deptEmailManual
      c.deptStaffName = String(body.deptStaffName ?? 'Department staff')
    }

    c.status = 'assigned'
    c.assignedAt = new Date().toISOString()
    c.assignedBy = session.email
    if (!c.department) c.department = departmentForCategory(c.category)

    await saveComplaints(all)
    await logEvent(
      c.id,
      'HOD',
      'Assigned',
      `Ops: ${c.opsStaffName || '—'} · Dept: ${c.deptStaffName || c.deptStaffEmail || '—'}`,
      session.email,
    )
    return res.status(200).json({ ok: true })
  }

  if (action === 'opsResolve') {
    const id = String(body.complaintId ?? '')
    const resolution = String(body.opsResolution ?? '').trim()
    const assurance = String(body.assuranceNote ?? '').trim()
    if (!resolution) return res.status(400).json({ error: 'Resolution notes required.' })
    const all = await getComplaints()
    const c = all.find((x) => x.id === id)
    if (!c) return res.status(404).json({ error: 'Not found.' })
    if (scopeBranch && !complaintMatchesBranch(c.branchId, scopeBranch, branches))
      return res.status(403).json({ error: 'Branch access only.' })
    c.opsResolution = resolution
    if (assurance) c.assuranceNote = assurance
    c.opsCompletedAt = new Date().toISOString()
    c.status = c.deptStaffId || c.deptStaffEmail ? 'dept_pending' : 'pending_hod'
    await saveComplaints(all)
    await logEvent(c.id, 'Operations', 'Completion report', resolution.slice(0, 500), session.email)
    return res.status(200).json({ ok: true })
  }

  if (action === 'deptResolve') {
    const id = String(body.complaintId ?? '')
    const resolution = String(body.deptResolution ?? '').trim()
    const assurance = String(body.assuranceNote ?? '').trim()
    if (!resolution) return res.status(400).json({ error: 'Department completion report required.' })
    const all = await getComplaints()
    const c = all.find((x) => x.id === id)
    if (!c) return res.status(404).json({ error: 'Not found.' })
    if (scopeBranch && !complaintMatchesBranch(c.branchId, scopeBranch, branches))
      return res.status(403).json({ error: 'Branch access only.' })
    c.deptResolution = resolution
    if (assurance) c.assuranceNote = assurance
    c.deptCompletedAt = new Date().toISOString()
    c.status = 'pending_hod'
    await saveComplaints(all)
    await logEvent(c.id, 'Department', 'Completion report', resolution.slice(0, 500), session.email)
    return res.status(200).json({ ok: true })
  }

  if (action === 'sendCompletion') {
    const id = String(body.complaintId ?? '')
    const channel = body.channel === 'whatsapp' ? 'whatsapp' : 'email'
    const assurance = String(body.assuranceNote ?? '').trim()
    const all = await getComplaints()
    const c = all.find((x) => x.id === id)
    if (!c) return res.status(404).json({ error: 'Not found.' })
    if (scopeBranch && !complaintMatchesBranch(c.branchId, scopeBranch, branches))
      return res.status(403).json({ error: 'Branch access only.' })

    const wasDelayed = c.isDelayed
    const branch = resolveBranchId(c.branchId, branches)
    const branchName = branchDisplayName(c.branchId, branches)

    if (assurance) c.assuranceNote = assurance
    c.status = 'solved'
    c.solvedAt = new Date().toISOString()
    await saveComplaints(all)

    const result = await sendCompletionLetter(c, channel, c.assuranceNote, session.email)
    if (result.ok) {
      await logCommunication({
        complaintId: c.id,
        code: c.code,
        channel,
        type: 'completion',
        subject: result.subject || '',
        body: result.body || '',
        sentTo: result.sentTo || c.mobile,
        sentBy: session.email,
      })
    }

    if (wasDelayed) await sendDeptAppreciationMail(c, branchName)
    await logEvent(c.id, 'HOD', 'Completion letter sent', `Via ${channel}`, session.email)

    return res.status(200).json({ ok: result.ok, result, displayStatus: displayStatus(c) })
  }

  if (action === 'shareLink') {
    const channel = body.channel === 'whatsapp' ? 'whatsapp' : 'email'
    const to = String(body.to ?? '').trim()
    const branchName = scopeBranch
      ? branches.find((b) => b.id === scopeBranch)?.name || scopeBranch
      : String(body.branchName ?? '')
    const url =
      String(body.url ?? '') ||
      `https://www.agilegroup-digital.co.in/guards/register?branch=${encodeURIComponent(branchName)}`

    const result =
      channel === 'whatsapp'
        ? await sendShareLinkWhatsApp(to, branchName, url)
        : await sendShareLinkEmail(to, branchName, url)

    if (result.ok) {
      await logCommunication({
        complaintId: '',
        code: 'SHARE',
        channel,
        type: 'share_link',
        subject: `Share link — ${branchName}`,
        body: url,
        sentTo: to,
        sentBy: session.email,
      })
    }
    return res.status(200).json({ ok: result.ok, result })
  }

  if (action === 'sendWeeklyReport') {
    const branchName = scopeBranch
      ? branches.find((b) => b.id === scopeBranch)?.name || scopeBranch
      : String(body.branchName ?? 'All branches')
    const scoped = scopeBranch ? filterByBranch(allComplaints, scopeBranch, branches) : allComplaints
    const report = weeklyManagementReport(scoped, branchName)
    const result = await sendWeeklyManagementReport(branchName, report, scopeBranch || undefined)
    return res.status(200).json({ ok: result.ok, report, result })
  }

  if (action === 'hodApprove') {
    const id = String(body.complaintId ?? '')
    const notes = String(body.hodNotes ?? '').trim()
    const reply = String(body.hodReplyToGuard ?? '').trim()
    const channel = body.channel === 'whatsapp' ? 'whatsapp' : body.channel === 'email' ? 'email' : ''
    const all = await getComplaints()
    const c = all.find((x) => x.id === id)
    if (!c) return res.status(404).json({ error: 'Not found.' })
    if (scopeBranch && !complaintMatchesBranch(c.branchId, scopeBranch, branches))
      return res.status(403).json({ error: 'Branch access only.' })
    c.hodNotes = notes
    c.hodReplyToGuard = reply
    if (reply) c.assuranceNote = reply
    c.status = 'solved'
    c.solvedAt = new Date().toISOString()
    await saveComplaints(all)

    if (channel) {
      const branch = resolveBranchId(c.branchId, branches)
      const branchName = branchDisplayName(c.branchId, branches)
      const wasDelayed = c.isDelayed
      const result = await sendCompletionLetter(c, channel, c.assuranceNote || reply, session.email)
      if (result.ok) {
        await logCommunication({
          complaintId: c.id,
          code: c.code,
          channel,
          type: 'completion',
          subject: result.subject || '',
          body: result.body || '',
          sentTo: result.sentTo || c.mobile,
          sentBy: session.email,
        })
      }
      if (wasDelayed) await sendDeptAppreciationMail(c, branchName)
    }

    await logEvent(c.id, 'HOD', 'Approved & closed', notes || 'Case closed.', session.email)
    return res.status(200).json({ ok: true })
  }

  if (action === 'savePortalUser') {
    if (user.role !== 'management') return res.status(403).json({ error: 'Management only.' })
    const row = normalizePortalUser({
      email: String(body.email ?? ''),
      name: String(body.name ?? ''),
      role: body.role === 'management' ? 'management' : 'hod',
      branchId: String(body.branchId ?? ''),
      active: body.active !== false,
    })
    const all = await getPortalUsers()
    const idx = all.findIndex((u) => u.email === row.email)
    if (idx >= 0) all[idx] = row
    else all.push(row)
    await savePortalUsers(all)
    return res.status(200).json({ ok: true })
  }

  if (action === 'deleteComplaint') {
    if (user.role !== 'management' && !isSuperAdminEmail(session.email)) {
      return res.status(403).json({ error: 'Director / Management only.' })
    }
    const id = String(body.complaintId ?? '').trim()
    if (!id) return res.status(400).json({ error: 'Complaint id required.' })
    const all = await getComplaints()
    const c = all.find((x) => x.id === id)
    if (!c) return res.status(404).json({ error: 'Complaint not found.' })
    await saveComplaints(all.filter((x) => x.id !== id))
    const feedback = await getFeedback()
    await saveFeedback(feedback.filter((f) => f.complaintId !== id))
    await logEvent(id, 'Director', 'Complaint deleted', `${c.code} — ${c.guardName}`, session.email)
    return res.status(200).json({ ok: true, code: c.code })
  }

  if (action === 'sendReminder') {
    if (user.role !== 'management' && !isSuperAdminEmail(session.email)) {
      return res.status(403).json({ error: 'Director / Management only.' })
    }
    const id = String(body.complaintId ?? '')
    const target =
      body.target === 'hod' ? 'hod' : body.target === 'department' ? 'department' : 'both'
    const hodEmail = String(body.hodEmail ?? '').trim()
    const opsStaffId = String(body.opsStaffId ?? '').trim()
    const deptStaffId = String(body.deptStaffId ?? '').trim()
    const all = await getComplaints()
    const c = all.find((x) => x.id === id)
    if (!c) return res.status(404).json({ error: 'Not found.' })
    const branchName = branchDisplayName(c.branchId, branches)
    const result = await sendDelayedReminderMail(c, branchName, target, session.email, {
      hodEmail: target === 'department' ? undefined : hodEmail,
      opsStaffId: target === 'hod' ? undefined : opsStaffId,
      deptStaffId: target === 'hod' ? undefined : deptStaffId,
      branches,
      misUsers,
      portalUsers,
    })
    if (result.ok) {
      await logCommunication({
        complaintId: c.id,
        code: c.code,
        channel: 'email',
        type: 'reminder',
        subject: `REMINDER — ${c.code}`,
        body: `Director reminder — ${target}`,
        sentTo: (result.to || []).join(', '),
        sentBy: session.email,
      })
      await logEvent(c.id, 'Director', 'Reminder sent', `To ${target}`, session.email)
    }
    return res.status(200).json({ ok: result.ok, result })
  }

  if (action === 'sendFeedbackRequest') {
    const id = String(body.complaintId ?? '')
    const channel = body.channel === 'whatsapp' ? 'whatsapp' : 'email'
    const all = await getComplaints()
    const c = all.find((x) => x.id === id)
    if (!c) return res.status(404).json({ error: 'Not found.' })
    if (scopeBranch && !complaintMatchesBranch(c.branchId, scopeBranch, branches))
      return res.status(403).json({ error: 'Branch access only.' })
    const result = await sendFeedbackRequest(c, channel, session.email)
    if (result.ok) {
      await logCommunication({
        complaintId: c.id,
        code: c.code,
        channel,
        type: 'feedback_request',
        subject: result.subject || `Feedback — ${c.code}`,
        body: result.body || '',
        sentTo: result.sentTo || c.mobile,
        sentBy: session.email,
      })
    }
    return res.status(200).json({ ok: result.ok, result })
  }

  if (action === 'sendFeedbackBulk') {
    const channel = body.channel === 'whatsapp' ? 'whatsapp' : 'email'
    const scoped = scopeBranch ? filterByBranch(allComplaints, scopeBranch, branches) : allComplaints
    const solved = scoped.filter((c) => c.status === 'solved')
    const existing = await getFeedback()
    let sent = 0
    for (const c of solved) {
      if (existing.some((f) => f.complaintId === c.id)) continue
      const result = await sendFeedbackRequest(c, channel, session.email)
      if (result.ok) {
        sent++
        await logCommunication({
          complaintId: c.id,
          code: c.code,
          channel,
          type: 'feedback_request',
          subject: result.subject || `Feedback — ${c.code}`,
          body: result.body || '',
          sentTo: result.sentTo || c.mobile,
          sentBy: session.email,
        })
      }
    }
    return res.status(200).json({ ok: true, sent, total: solved.length })
  }

  if (action === 'sendStatusUpdate') {
    if (user.role !== 'management' && !isSuperAdminEmail(session.email)) {
      return res.status(403).json({ error: 'Director / Management only.' })
    }
    const id = String(body.complaintId ?? '')
    const target =
      body.target === 'hod' ? 'hod' : body.target === 'department' ? 'department' : 'client'
    let toEmail = String(body.toEmail ?? '').trim()
    const deptStaffId = String(body.deptStaffId ?? '').trim()
    const opsStaffId = String(body.opsStaffId ?? '').trim()
    const all = await getComplaints()
    const c = all.find((x) => x.id === id)
    if (!c) return res.status(404).json({ error: 'Not found.' })
    const branch = resolveBranchId(c.branchId, branches)
    const branchName = branchDisplayName(c.branchId, branches)
    if (target === 'department') {
      if (opsStaffId) {
        const staff = (await getOpsStaff()).find((s) => s.id === opsStaffId)
        if (staff?.email?.includes('@')) toEmail = staff.email.trim()
      }
      if (!toEmail.includes('@') && deptStaffId) {
        const staff = (await getDeptStaff()).find((s) => s.id === deptStaffId)
        if (staff?.email?.includes('@')) toEmail = staff.email.trim()
      }
      if (!toEmail.includes('@') && c.deptStaffEmail?.includes('@')) {
        toEmail = c.deptStaffEmail.trim()
      }
      if (!toEmail.includes('@') && c.opsStaffEmail?.includes('@')) {
        toEmail = c.opsStaffEmail.trim()
      }
    }
    if (!toEmail.includes('@')) {
      return res.status(400).json({
        error:
          target === 'client'
            ? 'Please enter client email.'
            : target === 'hod'
              ? 'Please select HOD.'
              : 'Please select Operations or Department staff.',
      })
    }
    const result = await sendComplaintStatusMail(
      c,
      branchName,
      toEmail,
      session.email,
      target === 'client' ? 'client' : 'department',
    )
    if (result.ok) {
      await logCommunication({
        complaintId: c.id,
        code: c.code,
        channel: 'email',
        type:
          target === 'client'
            ? 'status_client'
            : target === 'hod'
              ? 'status_hod'
              : 'status_department',
        subject: result.subject || `Status — ${c.code}`,
        body: `Status update — ${displayStatus(c)}`,
        sentTo: toEmail,
        sentBy: session.email,
      })
      await logEvent(
        c.id,
        'Director',
        target === 'client'
          ? 'Status sent to client'
          : target === 'hod'
            ? 'Status sent to HOD'
            : 'Status sent to department',
        toEmail,
        session.email,
      )
    }
    return res.status(200).json({ ok: result.ok, result })
  }

  if (action === 'shareDashboard') {
    const to = String(body.to ?? '').trim()
    if (!to.includes('@')) return res.status(400).json({ error: 'Please enter a valid email address.' })
    const branchName = scopeBranch
      ? branches.find((b) => b.id === scopeBranch)?.name || scopeBranch
      : 'All branches'
    const scoped = scopeBranch ? filterByBranch(allComplaints, scopeBranch, branches) : allComplaints
    const dash = computeGuardsDashboard(scoped, opsStaff, Object.fromEntries(branches.map((b) => [b.id, b.name])))
    const result = await sendDashboardShareMail(branchName, {
      total: dash.total,
      open: dash.received,
      delayed: dash.delayed,
      solved: dash.solved,
      avgResponseHours: dash.avgResponseHours,
      slaCompliancePct: dash.slaCompliancePct,
    }, to)
    return res.status(200).json({ ok: result.ok, result })
  }

  if (action === 'caseDetail') {
    const id = String(body.complaintId ?? '')
    const c = complaints.find((x) => x.id === id) || allComplaints.find((x) => x.id === id)
    if (!c) return res.status(404).json({ error: 'Not found.' })
    const ev = events.filter((e) => e.complaintId === id)
    const caseComms = communications.filter((cm) => cm.complaintId === id)
    return res.status(200).json({
      ok: true,
      complaint: {
        ...c,
        branchName: branchDisplayName(c.branchId, branches),
        registeredAtLabel: guardsFmtIstDateTime(c.registeredAt),
      },
      events: ev,
      communications: caseComms,
    })
  }

  return res.status(400).json({ error: 'Unknown action' })
}
