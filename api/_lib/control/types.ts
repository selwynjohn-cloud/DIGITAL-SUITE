/**
 * Agile Control — Phase 1 domain types (Command Centre cases).
 */

export type AcPriority = 'P1' | 'P2' | 'P3' | 'P4'

export type AcCategory =
  | 'ClientComplaint'
  | 'GuardSupport'
  | 'Deployment'
  | 'Incident'
  | 'Emergency'
  | 'ClientInstruction'
  | 'HOTO'
  | 'CriticalClientCheck'
  | 'SalesLead'
  | 'Technical'

export type AcCaseStatus =
  | 'Open'
  | 'Acknowledged'
  | 'InProgress'
  | 'Resolved'
  | 'ClientConfirmed'
  | 'Closed'

export type AcEscalationLevel = 'None' | 'Branch' | 'Regional' | 'Director' | 'Leadership'

export type AcTimelineEvent = {
  id: string
  at: string
  byEmail: string
  byName: string
  kind: string
  note: string
}

export type AcCase = {
  id: string
  caseNo: string
  createdAt: string
  updatedAt: string
  createdByEmail: string
  createdByName: string
  category: AcCategory
  priority: AcPriority
  status: AcCaseStatus
  summary: string
  detail: string
  callerName: string
  callerPhone: string
  source: string
  branchId: string
  branchName: string
  clientName: string
  siteName: string
  ownerEmail: string
  ownerName: string
  slaAckDueAt: string
  slaResolveDueAt: string
  acknowledgedAt: string
  acknowledgedBy: string
  resolvedAt: string
  resolvedBy: string
  clientConfirmedAt: string
  closedAt: string
  closedBy: string
  escalationLevel: AcEscalationLevel
  lastEscalatedAt: string
  /** Incident room fields */
  clientInformedAt: string
  policeInformedAt: string
  managementInformedAt: string
  nextActionDueAt: string
  nextActionNote: string
  checklist: string[]
  evidenceNotes: string
  timeline: AcTimelineEvent[]
  /** Vehicle Requirement allotment (Night / Client Visit / Training) */
  vehicleDriverName: string
  vehicleRegNo: string
  vehicleAcceptedAt: string
  misSourceKind: '' | 'night' | 'client' | 'training'
  misSourceId: string
  misVisitMonth: string
}

export type AcLogEntry = {
  id: string
  at: string
  byEmail: string
  byName: string
  kind: string
  text: string
  caseNo: string
  branchId: string
}

export type AcHotoRecord = {
  id: string
  createdAt: string
  outgoingEmail: string
  outgoingName: string
  incomingEmail: string
  incomingName: string
  acceptedAt: string
  openCasesP1: number
  openCasesP2: number
  callbacksPending: number
  criticalInstructions: number
  incidentsMonitoring: number
  notes: string
  checklist: Record<string, boolean>
  caseNos: string[]
}

export type AcSiteTier = 'Platinum' | 'Gold' | 'Silver'

export type AcStrategicSite = {
  id: string
  branchId: string
  branchName: string
  clientName: string
  siteName: string
  contactName: string
  contactPhone: string
  tier: AcSiteTier
  /** Checks per week target */
  frequencyPerWeek: number
  active: boolean
  lastCheckAt: string
}

export type AcClientCheck = {
  id: string
  siteId: string
  branchId: string
  branchName: string
  clientName: string
  siteName: string
  contactName: string
  windowStart: string
  windowEnd: string
  status: 'Pending' | 'Done' | 'Missed'
  assignedAt: string
  completedAt: string
  completedByEmail: string
  completedByName: string
  guardAttendance: string
  alertness: string
  supervisorVisit: string
  anyIncident: string
  clientSatisfaction: string
  immediateAttention: string
  notes: string
  caseNo: string
}

export const AC_CATEGORIES: { id: AcCategory; label: string }[] = [
  { id: 'ClientComplaint', label: 'Client Complaint' },
  { id: 'GuardSupport', label: 'Guard Support' },
  { id: 'Deployment', label: 'Deployment' },
  { id: 'Incident', label: 'Incident' },
  { id: 'Emergency', label: 'Emergency' },
  { id: 'ClientInstruction', label: 'Client Instruction' },
  { id: 'HOTO', label: 'HOTO' },
  { id: 'CriticalClientCheck', label: 'Critical Client Check' },
  { id: 'SalesLead', label: 'Sales Lead' },
  { id: 'Technical', label: 'Technical' },
]

export const AC_PRIORITIES: AcPriority[] = ['P1', 'P2', 'P3', 'P4']

export function categoryLabel(c: AcCategory): string {
  return AC_CATEGORIES.find((x) => x.id === c)?.label || c
}

export function isIncidentCategory(c: AcCategory): boolean {
  return c === 'Incident' || c === 'Emergency'
}

export const CONTROL_TRACK1_SHORT = 'Track 1'
export const CONTROL_TRACK1_TITLE = 'Control'
export const CONTROL_TRACK1_LABEL = 'Track 1 · Control'

export const CONTROL_TRACK2_SHORT = 'Track 2'
export const CONTROL_TRACK2_TITLE = 'Help Desk'
export const CONTROL_TRACK2_LABEL = 'Track 2 · Help Desk'

export type AcYn = 'Yes' | 'No' | ''

/** Track 1 — Incident Received (Control desk). */
export type AcIncidentReceived = {
  id: string
  dateYmd: string
  occurredAt: string
  clientName: string
  location: string
  receivedFrom: string
  details: string
  branchId: string
  branchName: string
  informedHod: AcYn
  informedHodAt: string
  createdAt: string
  createdByEmail: string
  createdByName: string
  updatedAt: string
}

/** Track 2 — Help Desk night calls from guards. */
export type AcNightCall = {
  id: string
  dateYmd: string
  callTime: string
  clientName: string
  location: string
  guardName: string
  guardMobile: string
  pickedUp: AcYn
  calledBack: AcYn
  informedHod: AcYn
  branchId: string
  branchName: string
  notes: string
  createdAt: string
  createdByEmail: string
  createdByName: string
  updatedAt: string
}

export function acYn(v: unknown): AcYn {
  const s = String(v ?? '').trim().toLowerCase()
  if (s === 'yes' || s === 'y') return 'Yes'
  if (s === 'no' || s === 'n') return 'No'
  return ''
}

/** Control User Management — same role names as MIS User Management. */
export const AC_USER_ROLES = [
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
] as const

export type AcUserRole = (typeof AC_USER_ROLES)[number] | string

export type AcPortalUser = {
  id: string
  name: string
  email: string
  phone: string
  role: AcUserRole
  branchId: string
  branchName: string
  active: boolean
  createdAt: string
  updatedAt: string
}

/** Management-grade roles may delete; HOD / Staff / operators may not. */
export function acRoleCanDelete(role: string): boolean {
  const s = String(role || '').trim().toLowerCase()
  if (!s) return false
  if (s === 'management' || s === 'director' || s === 'admin' || s === 'president') return true
  if (s === 'cgm' || s.startsWith('vice president') || s === 'avp') return true
  if (s.startsWith('general manager')) return true
  return false
}

export function acRoleIsManagementGrade(role: string): boolean {
  return acRoleCanDelete(role)
}
