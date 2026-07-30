/**
 * Sample data for Agile Guards — helps HODs learn each screen.
 */

import type {
  GuardCommunication,
  GuardComplaint,
  GuardComplaintEvent,
  GuardDeptStaff,
  GuardFeedback,
  GuardOpsStaff,
} from './store.js'
import {
  computeComplaintAnalysis,
  computeGuardsDashboard,
  delayedComplaintAnalysis as analyzeDelayed,
} from './dashboard.js'
import { feedbackSummary } from './store.js'

const NOW = new Date()
const H = (n: number) => new Date(NOW.getTime() - n * 3600000).toISOString()
const D = (n: number) => new Date(NOW.getTime() - n * 86400000).toISOString()

export function demoOpsStaff(branchId: string): GuardOpsStaff[] {
  return [
    {
      id: 'demo_ops_1',
      branchId,
      name: 'Nishant Roshan S',
      mobile: '9876543210',
      email: 'nishant@agilegroup.co.in',
      whatsApp: '9876543210',
      active: true,
      createdAt: D(30),
    },
    {
      id: 'demo_ops_2',
      branchId,
      name: 'Ananth Kumar N',
      mobile: '9123456780',
      email: 'ananth@agilegroup.co.in',
      whatsApp: '9123456780',
      active: true,
      createdAt: D(20),
    },
  ]
}

export function demoDeptStaff(branchId: string): GuardDeptStaff[] {
  return [
    {
      id: 'demo_ds_1',
      branchId,
      department: 'HR & Finance',
      name: 'Priya Sharma',
      email: 'priya@agilegroup.co.in',
      mobile: '9011223344',
      active: true,
      createdAt: D(25),
    },
    {
      id: 'demo_ds_2',
      branchId,
      department: 'Operations',
      name: 'Rajesh Goud',
      email: 'rajesh@agilegroup.co.in',
      mobile: '9022334455',
      active: true,
      createdAt: D(15),
    },
  ]
}

function baseComplaint(
  partial: Partial<GuardComplaint> & Pick<GuardComplaint, 'id' | 'code' | 'guardName' | 'status'>,
): GuardComplaint {
  return {
    branchId: partial.branchId || 'demo_branch',
    idNo: partial.idNo || '10001',
    mobile: partial.mobile || '9999999999',
    clientName: partial.clientName || 'Sample Client',
    location: partial.location || 'Hyderabad',
    category: partial.category || 'Wage',
    subCategory: partial.subCategory || 'Not Received',
    complaintNote: partial.complaintNote || 'Sample complaint note.',
    referralJoined: false,
    referrals: [],
    opsStaffId: partial.opsStaffId || '',
    opsStaffName: partial.opsStaffName || '',
    opsStaffEmail: partial.opsStaffEmail || '',
    deptStaffId: partial.deptStaffId || '',
    deptStaffName: partial.deptStaffName || '',
    deptStaffEmail: partial.deptStaffEmail || '',
    department: partial.department || 'HR & Finance',
    assignedBy: partial.assignedBy || 'hod@agilegroup.co.in',
    registeredAt: partial.registeredAt || H(4),
    slaDeadline: partial.slaDeadline || H(-20),
    isDelayed: Boolean(partial.isDelayed),
    delayedAt: partial.delayedAt || '',
    delayedNotifiedAt: partial.delayedNotifiedAt || '',
    opsResolution: partial.opsResolution || '',
    deptResolution: partial.deptResolution || '',
    assuranceNote: partial.assuranceNote || '',
    hodNotes: partial.hodNotes || '',
    hodReplyToGuard: partial.hodReplyToGuard || '',
    solvedAt: partial.solvedAt || '',
    assignedAt: partial.assignedAt || '',
    opsCompletedAt: partial.opsCompletedAt || '',
    deptCompletedAt: partial.deptCompletedAt || '',
    active: true,
    ...partial,
  }
}

export function demoComplaints(branchId: string, branchName: string): GuardComplaint[] {
  return [
    baseComplaint({
      id: 'demo_gc_1',
      code: 'GC-2026-S001',
      branchId,
      guardName: 'Ramesh Kumar',
      idNo: '45821',
      mobile: '9988776655',
      clientName: 'IDBI Bank — Hitech City',
      location: 'Hyderabad',
      category: 'Wage',
      subCategory: 'Not Received',
      complaintNote: 'June 2026 salary not credited. Last received in May.',
      opsStaffId: 'demo_ops_1',
      opsStaffName: 'Nishant Roshan S',
      opsStaffEmail: 'nishant@agilegroup.co.in',
      deptStaffId: 'demo_ds_1',
      deptStaffName: 'Priya Sharma',
      deptStaffEmail: 'priya@agilegroup.co.in',
      department: 'HR & Finance',
      registeredAt: H(4),
      slaDeadline: H(-20),
      isDelayed: false,
      status: 'assigned',
      assignedAt: H(3),
    }),
    baseComplaint({
      id: 'demo_gc_2',
      code: 'GC-2026-S002',
      branchId,
      guardName: 'Lakshmi Devi',
      idNo: '33102',
      mobile: '9876512345',
      clientName: 'HDFC Bank — Gachibowli',
      location: branchName,
      category: 'EPF',
      subCategory: 'SMS Not Received',
      complaintNote: 'EPF SMS not received for 3 months. UAN linked.',
      referralJoined: true,
      referrals: [{ name: 'Suresh', phone: '9012345678', city: 'Hyderabad' }],
      opsStaffId: 'demo_ops_2',
      opsStaffName: 'Ananth Kumar N',
      opsStaffEmail: 'ananth@agilegroup.co.in',
      deptStaffId: 'demo_ds_1',
      deptStaffName: 'Priya Sharma',
      deptStaffEmail: 'priya@agilegroup.co.in',
      registeredAt: H(30),
      slaDeadline: H(-6),
      isDelayed: true,
      delayedAt: H(6),
      delayedNotifiedAt: H(5),
      status: 'pending_hod',
      opsResolution: 'Contacted HR. EPF SMS re-triggered. Guard to check in 48 hours.',
      opsCompletedAt: H(8),
      assignedAt: H(28),
    }),
    baseComplaint({
      id: 'demo_gc_3',
      code: 'GC-2026-S003',
      branchId,
      guardName: 'Venkat Rao',
      idNo: '28945',
      mobile: '9123456789',
      category: 'Uniform',
      subCategory: 'Want Uniform',
      complaintNote: 'Uniform size L required. Current uniform torn.',
      registeredAt: D(2),
      slaDeadline: D(1),
      isDelayed: true,
      delayedAt: D(1),
      status: 'received',
      assignedAt: '',
    }),
    baseComplaint({
      id: 'demo_gc_4',
      code: 'GC-2026-S004',
      branchId,
      guardName: 'Mohammed Farooq',
      idNo: '51203',
      mobile: '9988001122',
      category: 'ESIC',
      subCategory: 'Want Treatment / ESI Hospital',
      complaintNote: 'Need ESIC card for wife hospital visit.',
      opsStaffId: 'demo_ops_2',
      opsStaffName: 'Ananth Kumar N',
      opsStaffEmail: 'ananth@agilegroup.co.in',
      deptStaffId: 'demo_ds_2',
      deptStaffName: 'Rajesh Goud',
      deptStaffEmail: 'rajesh@agilegroup.co.in',
      department: 'HR',
      registeredAt: D(5),
      slaDeadline: D(4),
      status: 'solved',
      opsResolution: 'ESIC card copy given at branch office.',
      deptResolution: 'HR verified ESIC records.',
      assuranceNote: 'We will ensure ESIC cards are issued on time in future.',
      hodNotes: 'Approved. Guard satisfied.',
      hodReplyToGuard: 'Your ESIC matter is closed. Collect card from branch office.',
      solvedAt: D(3),
      assignedAt: D(5),
      opsCompletedAt: D(4),
      deptCompletedAt: D(3),
    }),
  ]
}

export function demoEvents(): GuardComplaintEvent[] {
  return [
    {
      id: 'demo_ev_1',
      complaintId: 'demo_gc_2',
      level: 'System',
      action: 'Complaint registered',
      detail: 'Guard Lakshmi Devi registered via QR code.',
      actor: 'Guard',
      createdAt: H(30),
    },
    {
      id: 'demo_ev_2',
      complaintId: 'demo_gc_2',
      level: 'HOD',
      action: 'Assigned',
      detail: 'Ops: Ananth Kumar N · Dept: Priya Sharma',
      actor: 'hod@agilegroup.co.in',
      createdAt: H(28),
    },
    {
      id: 'demo_ev_3',
      complaintId: 'demo_gc_2',
      level: 'Operations',
      action: 'Completion report',
      detail: 'EPF SMS re-triggered via HR.',
      actor: 'ananth@agilegroup.co.in',
      createdAt: H(8),
    },
    {
      id: 'demo_ev_4',
      complaintId: 'demo_gc_2',
      level: 'SLA',
      action: 'Delayed escalation',
      detail: '24-hour clock expired — email to Director & HODs.',
      actor: 'System',
      createdAt: H(6),
    },
  ]
}

export function demoCommunications(): GuardCommunication[] {
  return [
    {
      id: 'demo_cm_1',
      complaintId: 'demo_gc_4',
      code: 'GC-2026-S004',
      channel: 'whatsapp',
      type: 'completion',
      subject: 'Update on your issue : Resolved GC-2026-S004',
      body: 'Hi Mohammed Farooq, your ESIC matter is resolved…',
      sentTo: '9988001122',
      sentAt: D(3),
      sentBy: 'hod@agilegroup.co.in',
    },
    {
      id: 'demo_cm_2',
      complaintId: 'demo_gc_2',
      code: 'GC-2026-S002',
      channel: 'email',
      type: 'delayed_escalation',
      subject: 'DELAYED — GC-2026-S002',
      body: 'Delayed complaint escalation email',
      sentTo: 'director@agilegroup.co.in',
      sentAt: H(5),
      sentBy: 'System',
    },
  ]
}

export function buildDemoPayload(branchId: string, branchName: string) {
  const complaints = demoComplaints(branchId || 'demo_branch', branchName || 'Sample Branch')
  const opsStaff = demoOpsStaff(branchId || 'demo_branch')
  const deptStaff = demoDeptStaff(branchId || 'demo_branch')
  const branchNames = { [branchId || 'demo_branch']: branchName || 'Sample Branch' }
  const dashboard = computeGuardsDashboard(complaints, opsStaff, branchNames)
  const delayedAnalysis = analyzeDelayed(complaints)
  const complaintAnalysis = computeComplaintAnalysis(complaints)
  const events = hodDemoEvents(complaints)
  const communications = hodDemoCommunications(complaints, branchName)
  const feedback = demoFeedback(complaints, branchNames)
  return {
    branchId: branchId || 'demo_branch',
    branchName: branchName || 'Sample Branch',
    complaints,
    opsStaff,
    deptStaff,
    dashboard,
    delayedAnalysis,
    complaintAnalysis,
    communications,
    events,
    feedback,
    feedbackSummary: feedbackSummary(feedback),
    shareUrl: `https://www.agilegroup-digital.co.in/guards/register?branch=${encodeURIComponent(branchName || 'Hi-Tech City')}`,
    isDemo: true,
  }
}

/** Full HOD portal sample — one branch, all menus filled. */
export function buildHodDemoPayload(branchId: string, branchName: string) {
  return buildDemoPayload(branchId, branchName)
}

function hodDemoEvents(complaints: GuardComplaint[]): GuardComplaintEvent[] {
  const events: GuardComplaintEvent[] = []
  complaints.forEach((c, i) => {
    events.push({
      id: `demo_ev_${i}_reg`,
      complaintId: c.id,
      level: 'System',
      action: 'Complaint registered',
      detail: `Guard ${c.guardName} registered — ${c.category}.`,
      actor: 'Guard',
      createdAt: c.registeredAt,
    })
    if (c.assignedAt) {
      events.push({
        id: `demo_ev_${i}_as`,
        complaintId: c.id,
        level: 'HOD',
        action: 'Assigned',
        detail: `Ops: ${c.opsStaffName || '—'} · Dept: ${c.deptStaffName || '—'}`,
        actor: 'hod@agilegroup.co.in',
        createdAt: c.assignedAt,
      })
    }
    if (c.opsCompletedAt) {
      events.push({
        id: `demo_ev_${i}_ops`,
        complaintId: c.id,
        level: 'Operations',
        action: 'Completion report',
        detail: (c.opsResolution || 'Ops report filed.').slice(0, 120),
        actor: c.opsStaffEmail || 'ops@agilegroup.co.in',
        createdAt: c.opsCompletedAt,
      })
    }
    if (c.isDelayed && c.delayedAt) {
      events.push({
        id: `demo_ev_${i}_sla`,
        complaintId: c.id,
        level: 'SLA',
        action: 'Delayed escalation',
        detail: '24-hour clock expired — email to Director & HODs.',
        actor: 'System',
        createdAt: c.delayedAt,
      })
    }
    if (c.solvedAt) {
      events.push({
        id: `demo_ev_${i}_done`,
        complaintId: c.id,
        level: 'HOD',
        action: 'Approved & closed',
        detail: c.hodNotes || 'Case closed. Completion letter sent.',
        actor: 'hod@agilegroup.co.in',
        createdAt: c.solvedAt,
      })
    }
  })
  return events
}

function hodDemoCommunications(complaints: GuardComplaint[], branchName: string): GuardCommunication[] {
  const comms: GuardCommunication[] = [
    {
      id: 'demo_cm_share',
      complaintId: '',
      code: 'SHARE',
      channel: 'whatsapp',
      type: 'share_link',
      subject: `Share link — ${branchName}`,
      body: `https://www.agilegroup-digital.co.in/guards/register?branch=${encodeURIComponent(branchName)}`,
      sentTo: '9876543210',
      sentAt: D(1),
      sentBy: 'hod@agilegroup.co.in',
    },
  ]
  for (const c of complaints) {
    if (c.status === 'solved') {
      comms.push({
        id: `demo_cm_done_${c.id}`,
        complaintId: c.id,
        code: c.code,
        channel: 'whatsapp',
        type: 'completion',
        subject: `Update on your issue : Resolved ${c.code}`,
        body: `Hi ${c.guardName}, your ${c.category} matter is resolved.`,
        sentTo: c.mobile,
        sentAt: c.solvedAt || D(1),
        sentBy: 'hod@agilegroup.co.in',
      })
      comms.push({
        id: `demo_cm_fb_${c.id}`,
        complaintId: c.id,
        code: c.code,
        channel: 'whatsapp',
        type: 'feedback_request',
        subject: `Feedback — ${c.code}`,
        body: `https://www.agilegroup-digital.co.in/guards/feedback?code=${c.code}`,
        sentTo: c.mobile,
        sentAt: D(2),
        sentBy: 'hod@agilegroup.co.in',
      })
    }
    if (c.isDelayed && c.status !== 'solved') {
      comms.push({
        id: `demo_cm_del_${c.id}`,
        complaintId: c.id,
        code: c.code,
        channel: 'email',
        type: 'delayed_escalation',
        subject: `DELAYED — ${c.code}`,
        body: `Delayed complaint — ${branchName}`,
        sentTo: 'director@agilegroup.co.in',
        sentAt: c.delayedNotifiedAt || c.delayedAt || H(2),
        sentBy: 'System',
      })
    }
  }
  return comms
}

const MGMT_BRANCH_PICK = ['Hi-Tech City', 'Visakhapatnam', 'Vijayawada', 'Tamil Nadu', 'Hyd Zone A']

function pickMgmtBranches(branches: { id: string; name: string }[]): { id: string; name: string }[] {
  const picked: { id: string; name: string }[] = []
  for (const name of MGMT_BRANCH_PICK) {
    const b = branches.find((x) => x.name === name)
    if (b) picked.push(b)
  }
  if (picked.length < 4) {
    for (const b of branches) {
      if (!picked.find((x) => x.id === b.id)) picked.push(b)
      if (picked.length >= 5) break
    }
  }
  return picked.slice(0, 5)
}

function mgmtOpsStaff(branchId: string, branchName: string): GuardOpsStaff[] {
  const tag = branchId.replace(/\W/g, '').slice(0, 8)
  return [
    {
      id: `demo_mops_${tag}_1`,
      branchId,
      name: branchName.includes('Visakhapatnam') ? 'Nishant Roshan S' : 'Ananth Kumar N',
      mobile: '9876543210',
      email: 'nishant@agilegroup.co.in',
      whatsApp: '9876543210',
      active: true,
      createdAt: D(30),
    },
    {
      id: `demo_mops_${tag}_2`,
      branchId,
      name: branchName.includes('Tamil') ? 'Rajesh Goud' : 'Priya Sharma',
      mobile: '9123456780',
      email: 'ananth@agilegroup.co.in',
      whatsApp: '9123456780',
      active: true,
      createdAt: D(20),
    },
  ]
}

function mgmtDeptStaff(branchId: string): GuardDeptStaff[] {
  const tag = branchId.replace(/\W/g, '').slice(0, 8)
  return [
    {
      id: `demo_mds_${tag}_1`,
      branchId,
      department: 'HR & Finance',
      name: 'Priya Sharma',
      email: 'priya@agilegroup.co.in',
      mobile: '9011223344',
      active: true,
      createdAt: D(25),
    },
    {
      id: `demo_mds_${tag}_2`,
      branchId,
      department: 'Operations',
      name: 'Rajesh Goud',
      email: 'rajesh@agilegroup.co.in',
      mobile: '9022334455',
      active: true,
      createdAt: D(15),
    },
  ]
}

function mgmtComplaintsForBranch(
  branch: { id: string; name: string },
  idx: number,
): GuardComplaint[] {
  const { id: branchId, name: branchName } = branch
  const tag = branchId.replace(/\W/g, '').slice(0, 8)
  const ops1 = `demo_mops_${tag}_1`
  const ops2 = `demo_mops_${tag}_2`
  const ds1 = `demo_mds_${tag}_1`
  const ds2 = `demo_mds_${tag}_2`
  const codeBase = `GC-2026-M${String(idx + 1).padStart(2, '0')}`

  const list: GuardComplaint[] = [
    baseComplaint({
      id: `demo_mgc_${tag}_1`,
      code: `${codeBase}A`,
      branchId,
      guardName: ['Ramesh Kumar', 'Lakshmi Devi', 'Venkat Rao', 'Mohammed Farooq', 'Suresh Babu'][idx % 5],
      idNo: String(45800 + idx * 11),
      mobile: `99887${String(76600 + idx).slice(-5)}`,
      clientName: `${branchName} — IDBI Bank`,
      location: branchName,
      category: ['Wage', 'EPF', 'Uniform', 'ESIC', 'Rain Gear'][idx % 5],
      subCategory: ['Not Received', 'SMS Not Received', 'Want Uniform', 'Want Treatment / ESI Hospital', 'Want Rain Gear'][idx % 5],
      complaintNote: `Sample complaint at ${branchName} — for Management portal learning.`,
      opsStaffId: ops1,
      opsStaffName: idx % 2 ? 'Nishant Roshan S' : 'Ananth Kumar N',
      opsStaffEmail: 'nishant@agilegroup.co.in',
      deptStaffId: ds1,
      deptStaffName: 'Priya Sharma',
      deptStaffEmail: 'priya@agilegroup.co.in',
      registeredAt: H(4 + idx),
      slaDeadline: H(-20 + idx),
      isDelayed: false,
      status: 'assigned',
      assignedAt: H(3 + idx),
    }),
    baseComplaint({
      id: `demo_mgc_${tag}_2`,
      code: `${codeBase}B`,
      branchId,
      guardName: ['Lakshmi Devi', 'Kiran Reddy', 'Sita Devi', 'Ravi Shankar', 'Gopal Rao'][idx % 5],
      idNo: String(33100 + idx * 7),
      mobile: `98765${String(12300 + idx).slice(-5)}`,
      clientName: `${branchName} — HDFC Bank`,
      location: branchName,
      category: 'EPF',
      subCategory: 'SMS Not Received',
      complaintNote: `EPF SMS not received — ${branchName} branch sample.`,
      opsStaffId: ops2,
      opsStaffName: 'Ananth Kumar N',
      opsStaffEmail: 'ananth@agilegroup.co.in',
      deptStaffId: ds1,
      deptStaffName: 'Priya Sharma',
      deptStaffEmail: 'priya@agilegroup.co.in',
      registeredAt: H(28 + idx * 2),
      slaDeadline: H(-4),
      isDelayed: true,
      delayedAt: H(4),
      delayedNotifiedAt: H(3),
      status: 'pending_hod',
      opsResolution: 'Contacted HR. EPF SMS re-triggered.',
      opsCompletedAt: H(10),
      assignedAt: H(26),
    }),
  ]

  if (idx % 2 === 0) {
    list.push(
      baseComplaint({
        id: `demo_mgc_${tag}_3`,
        code: `${codeBase}C`,
        branchId,
        guardName: 'Venkat Rao',
        idNo: String(28900 + idx),
        mobile: `91234${String(56700 + idx).slice(-5)}`,
        category: 'Uniform',
        subCategory: 'Want Uniform',
        complaintNote: `Uniform required at ${branchName} — unassigned sample.`,
        registeredAt: D(2),
        slaDeadline: D(1),
        isDelayed: true,
        delayedAt: D(1),
        status: 'received',
      }),
    )
  }

  if (idx === 0) {
    list.push(
      baseComplaint({
        id: `demo_mgc_${tag}_4`,
        code: `${codeBase}D`,
        branchId,
        guardName: 'Mohammed Farooq',
        idNo: '51203',
        mobile: '9988001122',
        category: 'ESIC',
        subCategory: 'Want Treatment / ESI Hospital',
        complaintNote: 'ESIC card for family hospital visit — solved sample.',
        opsStaffId: ops2,
        opsStaffName: 'Ananth Kumar N',
        opsStaffEmail: 'ananth@agilegroup.co.in',
        deptStaffId: ds2,
        deptStaffName: 'Rajesh Goud',
        deptStaffEmail: 'rajesh@agilegroup.co.in',
        department: 'HR',
        registeredAt: D(5),
        slaDeadline: D(4),
        status: 'solved',
        opsResolution: 'ESIC card copy given at branch office.',
        deptResolution: 'HR verified ESIC records.',
        assuranceNote: 'We will ensure ESIC cards are issued on time.',
        hodNotes: 'Approved. Guard satisfied.',
        hodReplyToGuard: 'Your ESIC matter is closed.',
        solvedAt: D(3),
        assignedAt: D(5),
        opsCompletedAt: D(4),
        deptCompletedAt: D(3),
      }),
    )
  }

  return list
}

export function buildManagementDemoPayload(branches: { id: string; name: string }[]) {
  const picked = pickMgmtBranches(branches.length ? branches : [{ id: 'br1', name: 'Hi-Tech City' }])
  const branchNames = Object.fromEntries(picked.map((b) => [b.id, b.name]))

  const complaints: GuardComplaint[] = []
  const opsStaff: GuardOpsStaff[] = []
  const deptStaff: GuardDeptStaff[] = []

  picked.forEach((b, i) => {
    complaints.push(...mgmtComplaintsForBranch(b, i))
    opsStaff.push(...mgmtOpsStaff(b.id, b.name))
    deptStaff.push(...mgmtDeptStaff(b.id))
  })

  const events: GuardComplaintEvent[] = []
  const communications: GuardCommunication[] = []

  complaints.forEach((c, i) => {
    events.push({
      id: `demo_mev_${i}_1`,
      complaintId: c.id,
      level: 'System',
      action: 'Complaint registered',
      detail: `Guard ${c.guardName} registered at ${branchNames[c.branchId] || c.branchId}.`,
      actor: 'Guard',
      createdAt: c.registeredAt,
    })
    if (c.assignedAt) {
      events.push({
        id: `demo_mev_${i}_2`,
        complaintId: c.id,
        level: 'HOD',
        action: 'Assigned',
        detail: `Ops: ${c.opsStaffName || '—'} · Dept: ${c.deptStaffName || '—'}`,
        actor: 'hod@agilegroup.co.in',
        createdAt: c.assignedAt,
      })
    }
    if (c.isDelayed && c.delayedAt) {
      events.push({
        id: `demo_mev_${i}_3`,
        complaintId: c.id,
        level: 'SLA',
        action: 'Delayed escalation',
        detail: '24-hour clock expired — email to Director & HODs.',
        actor: 'System',
        createdAt: c.delayedAt,
      })
    }
    if (c.status === 'solved') {
      communications.push({
        id: `demo_mcm_${i}`,
        complaintId: c.id,
        code: c.code,
        channel: 'whatsapp',
        type: 'completion',
        subject: `Update on your issue : Resolved ${c.code}`,
        body: `Hi ${c.guardName}, your matter is resolved…`,
        sentTo: c.mobile,
        sentAt: c.solvedAt || D(1),
        sentBy: 'director@agilegroup.co.in',
      })
    }
    if (c.isDelayed && c.status !== 'solved') {
      communications.push({
        id: `demo_mcm_d_${i}`,
        complaintId: c.id,
        code: c.code,
        channel: 'email',
        type: 'delayed_escalation',
        subject: `DELAYED — ${c.code}`,
        body: `Delayed complaint — ${branchNames[c.branchId] || c.branchId}`,
        sentTo: 'director@agilegroup.co.in',
        sentAt: c.delayedNotifiedAt || c.delayedAt || H(2),
        sentBy: 'System',
      })
    }
  })

  communications.push({
    id: 'demo_mcm_share',
    complaintId: '',
    code: 'SHARE',
    channel: 'whatsapp',
    type: 'share_link',
    subject: 'Share link — All branches',
    body: 'https://www.agilegroup-digital.co.in/guards/register',
    sentTo: '9876543210',
    sentAt: D(1),
    sentBy: 'director@agilegroup.co.in',
  })

  const dashboard = computeGuardsDashboard(complaints, opsStaff, branchNames)
  const delayedAnalysis = analyzeDelayed(complaints)
  const complaintAnalysis = computeComplaintAnalysis(complaints)

  const feedback = demoFeedback(complaints, branchNames)

  return {
    complaints,
    opsStaff,
    deptStaff,
    dashboard,
    delayedAnalysis,
    complaintAnalysis,
    communications,
    events,
    branches,
    branchNames,
    feedback,
    feedbackSummary: feedbackSummary(feedback),
    isDemo: true,
  }
}

function demoFeedback(
  complaints: GuardComplaint[],
  branchNames: Record<string, string>,
): GuardFeedback[] {
  const solved = complaints.filter((c) => c.status === 'solved')
  return solved.map((c, i) => ({
    id: `demo_fb_${i}`,
    complaintId: c.id,
    code: c.code,
    branchId: c.branchId,
    guardName: c.guardName,
    idNo: c.idNo,
    category: c.category,
    mobile: c.mobile,
    rating: [5, 4, 3, 5, 4][i % 5],
    comment: ['Very good response', 'Satisfied', 'Took time but resolved', 'Excellent', 'OK'][i % 5],
    submittedAt: c.solvedAt || new Date().toISOString(),
  }))
}
