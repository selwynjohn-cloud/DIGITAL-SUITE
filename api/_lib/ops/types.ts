/** Agile Ops Core — shared domain types (Phases 0–8). */

export type OpsShiftCode = 'A' | 'G' | 'B' | 'C'

export type OpsGuard = {
  id: string
  /** guard = security force · staff = Agile Group office / ops staff */
  kind: 'guard' | 'staff'
  employeeId: string
  name: string
  mobile: string
  email: string
  branchId: string
  branchName: string
  rank: string
  department: string
  team: 'operations' | 'support' | ''
  skills: string
  /** Approximate post geo for nearby W.Off (optional). */
  lat: number | null
  lng: number | null
  status: 'active' | 'exited' | 'training' | 'suspended'
  doj: string
  /** Stored face photo id → /api/ops/image?id=… */
  photoId: string
  createdAt: string
  updatedAt: string
}

export type OpsPost = {
  id: string
  branchId: string
  branchName: string
  clientId: string
  clientName: string
  postName: string
  location: string
  lat: number | null
  lng: number | null
  sanA: number
  sanG: number
  sanB: number
  sanC: number
  active: boolean
  createdAt: string
}

export type OpsStaffAppointment = {
  id: string
  kind: 'guard' | 'staff'
  name: string
  employeeId: string
  branchId: string
  branchName: string
  designation: string
  doj: string
  letterNo: string
  remarks: string
  createdBy: string
  createdAt: string
}

export type OpsIdCard = {
  id: string
  guardId: string
  employeeId: string
  guardName: string
  branchId: string
  issueDate: string
  validUpto: string
  status: 'active' | 'reprint' | 'stopped' | 'expired'
  stopReason: string
  createdBy: string
  createdAt: string
}

export type OpsDeploymentOrder = {
  id: string
  orderNo: string
  guardId: string
  employeeId: string
  guardName: string
  branchId: string
  branchName: string
  clientName: string
  postId: string
  postName: string
  rank: string
  shift: OpsShiftCode
  joiningDate: string
  status: 'draft' | 'issued' | 'cancelled'
  createdBy: string
  createdAt: string
}

export type OpsUniformIssue = {
  id: string
  guardId: string
  employeeId: string
  guardName: string
  branchId: string
  items: string
  sizes: string
  issueDate: string
  returnDate: string
  recoveryNote: string
  status: 'issued' | 'partial_return' | 'returned' | 'recovered'
  createdBy: string
  createdAt: string
}

export type OpsRosterSlot = {
  id: string
  date: string
  branchId: string
  postId: string
  postName: string
  clientName: string
  shift: OpsShiftCode
  guardId: string
  employeeId: string
  guardName: string
  isWOff: boolean
  createdAt: string
}

export type OpsAttendancePunch = {
  id: string
  source: 'work360' | 'agile_mobile' | 'manual'
  employeeId: string
  guardName: string
  branchId: string
  clientName: string
  postName: string
  date: string
  status: 'present' | 'absent' | 'late' | 'leave' | 'woff' | 'unknown'
  punchedAt: string
  lat: number | null
  lng: number | null
  photoUrl: string
  raw: string
  createdAt: string
}

export type OpsAttendanceAudit = {
  id: string
  punchId: string
  before: string
  after: string
  reason: string
  by: string
  at: string
}

export type OpsVacancyFill = {
  id: string
  date: string
  branchId: string
  postId: string
  postName: string
  shift: OpsShiftCode
  absentGuardId: string
  absentGuardName: string
  fillGuardId: string
  fillGuardName: string
  fillEmployeeId: string
  note: string
  createdBy: string
  createdAt: string
}

export type OpsException = {
  id: string
  date: string
  branchId: string
  kind: 'late_start' | 'out_of_post'
  employeeId: string
  guardName: string
  clientName: string
  postName: string
  detail: string
  source: 'work360' | 'agile_mobile' | 'manual'
  createdAt: string
}

export type OpsVisitAction = {
  id: string
  date: string
  branchId: string
  kind: 'day' | 'night' | 'training'
  clientName: string
  postName: string
  assignee: string
  status: 'open' | 'in_progress' | 'closed' | 'escalated'
  notes: string
  closedAt: string
  createdBy: string
  createdAt: string
}

export type OpsAuditFinding = {
  id: string
  date: string
  branchId: string
  clientName: string
  postName: string
  finding: string
  severity: 'low' | 'medium' | 'high'
  correctionPlan: string
  owner: string
  dueDate: string
  status: 'open' | 'closed'
  createdBy: string
  createdAt: string
}

export type OpsScorecard = {
  id: string
  month: string
  branchId: string
  clientName: string
  postName: string
  score: number
  notes: string
  updatedAt: string
}

export type OpsMeeting = {
  id: string
  kind: 'weekly' | 'monthly'
  date: string
  branchId: string
  title: string
  agenda: string
  mom: string
  createdBy: string
  createdAt: string
  status: 'draft' | 'published'
}

export type OpsCorrection = {
  id: string
  meetingId: string
  action: string
  owner: string
  dueDate: string
  status: 'open' | 'done'
  evidence: string
  createdAt: string
}

export type OpsMonthRegister = {
  id: string
  month: string
  branchId: string
  branchName: string
  status: 'draft' | 'submitted' | 'approved' | 'locked'
  rows: OpsMonthRow[]
  submittedBy: string
  submittedAt: string
  approvedBy: string
  approvedAt: string
  lockedAt: string
  trusted: boolean
}

export type OpsMonthRow = {
  employeeId: string
  guardName: string
  clientName: string
  postName: string
  presentDays: number
  absentDays: number
  leaveDays: number
  woffDays: number
  lateDays: number
  otHours: number
  billableDays: number
}

export type OpsInvoiceFeedRow = {
  month: string
  branchId: string
  branchName: string
  clientName: string
  postName: string
  billableStrength: number
  billableDays: number
  registerId: string
  exportedAt: string
}

export type OpsTransitionPlan = {
  id: string
  branchId: string
  clientName: string
  startDate: string
  goLiveDate: string
  rankStrength: string
  manpowerSchedule: string
  trainingPlan: string
  logisticsNotes: string
  status: 'planning' | 'in_progress' | 'live' | 'closed'
  createdBy: string
  createdAt: string
}

export type OpsShadowDay = {
  date: string
  branchId: string
  branchName: string
  misSanctioned: number
  misDeployed: number
  misAbsent: number
  misVacant: number
  misOt: number
  misLate: number
  misOutOfPost: number
  opsPresent: number
  opsAbsent: number
  opsVacant: number
  opsLate: number
  opsOutOfPost: number
  match: boolean
  mismatches: string[]
  computedAt: string
}
