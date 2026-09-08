/**
 * Strip test / practice / demo complaints so only live cases show in Agile Guards.
 */

import type { GuardDeptStaff, GuardFeedback, GuardOpsStaff } from './store.js'
import {
  getComplaints,
  getDeptStaff,
  getFeedback,
  getOpsStaff,
  saveComplaints,
  saveDeptStaff,
  saveFeedback,
  saveOpsStaff,
} from './store.js'

const FAKE_MOBILES = new Set(['9999999999', '0000000000', '1234567890'])

function looksLikePracticeWord(s: string): boolean {
  return /^(test|testing|tester|practice|demo|dummy|sample|fake|trial)(\s|$|[-_.])/i.test(s.trim())
}

export function isPracticeComplaint(c: {
  id?: string
  code?: string
  guardName?: string
  idNo?: string
  mobile?: string
  complaintNote?: string
  clientName?: string
}): boolean {
  const id = String(c.id || '')
  if (/^demo_/i.test(id)) return true

  const code = String(c.code || '').trim()
  if (/^(GC-)?(DEMO|TEST|PRACTICE|SAMPLE|FAKE)[-_]/i.test(code)) return true

  const name = String(c.guardName || '').trim()
  if (looksLikePracticeWord(name)) return true
  if (/\b(test complaint|practice complaint|dummy guard|fake guard)\b/i.test(name)) return true

  const note = String(c.complaintNote || '').trim()
  if (note && note.length < 48 && /^(test|testing|practice|demo|dummy|sample|fake|trial)([.\s!,-]*)?$/i.test(note)) {
    return true
  }

  const idNo = String(c.idNo || '').trim()
  if (idNo && idNo.length <= 12 && /^(test|demo|practice|dummy|0000+|9999+)$/i.test(idNo)) return true

  const client = String(c.clientName || '').trim()
  if (looksLikePracticeWord(client) || /^(test client|sample client|demo client)$/i.test(client)) return true

  const mobile = String(c.mobile || '').replace(/\D/g, '').slice(-10)
  if (mobile && FAKE_MOBILES.has(mobile) && /test|practice|demo|dummy|sample|fake/i.test(`${name} ${note} ${idNo}`)) {
    return true
  }

  return false
}

export function isDemoStaffId(id: string): boolean {
  return /^demo_/i.test(String(id || ''))
}

export function realComplaintsOnly<T extends { id?: string; code?: string; guardName?: string }>(list: T[]): T[] {
  return list.filter((c) => !isPracticeComplaint(c))
}

export async function purgePracticeRecords(): Promise<{
  complaints: number
  feedback: number
  ops: number
  dept: number
  codes: string[]
}> {
  const [complaints, feedback, ops, dept] = await Promise.all([
    getComplaints(),
    getFeedback(),
    getOpsStaff(),
    getDeptStaff(),
  ])

  const dropIds = new Set(complaints.filter((c) => isPracticeComplaint(c)).map((c) => c.id))
  const keptComplaints = complaints.filter((c) => !dropIds.has(c.id))
  const keptFeedback = feedback.filter((f) => !dropIds.has(f.complaintId) && !isPracticeComplaint(f))
  const keptOps = ops.filter((o) => !isDemoStaffId(o.id))
  const keptDept = dept.filter((d) => !isDemoStaffId(d.id))

  const codes = complaints.filter((c) => dropIds.has(c.id)).map((c) => c.code || c.id)

  if (keptComplaints.length !== complaints.length) await saveComplaints(keptComplaints)
  if (keptFeedback.length !== feedback.length) await saveFeedback(keptFeedback)
  if (keptOps.length !== ops.length) await saveOpsStaff(keptOps as GuardOpsStaff[])
  if (keptDept.length !== dept.length) await saveDeptStaff(keptDept as GuardDeptStaff[])

  return {
    complaints: complaints.length - keptComplaints.length,
    feedback: feedback.length - keptFeedback.length,
    ops: ops.length - keptOps.length,
    dept: dept.length - keptDept.length,
    codes,
  }
}

export function liveFeedbackOnly(list: GuardFeedback[], liveComplaintIds: Set<string>): GuardFeedback[] {
  return list.filter((f) => liveComplaintIds.has(f.complaintId) && !isPracticeComplaint(f))
}
