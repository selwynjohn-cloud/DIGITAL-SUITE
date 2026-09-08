/**
 * PSARA Guard Journey — structured lifecycle (Director Ops / Control).
 * Mobile App does not own recruitment; this office pipeline does.
 */

export const JOURNEY_STAGES = [
  { id: 'recruitment_psara', label: '1. Recruitment (PSARA docs)', group: 'onboard' },
  { id: 'fitness_test', label: '2. Fitness test', group: 'onboard' },
  { id: 'id_card', label: '3. ID card issue', group: 'onboard' },
  { id: 'uniform', label: '4. Uniform issue', group: 'onboard' },
  { id: 'deployment_order', label: '5. Deployment / Posting order (location)', group: 'onboard' },
  { id: 'whatsapp_sent', label: '6. WhatsApp deployment order', group: 'onboard' },
  { id: 'reported_duty', label: '7. Reported for duty', group: 'onboard' },
  { id: 'helpdesk_calls', label: '8. Help desk comfort calls (3 alternate days)', group: 'onboard' },
  { id: 'scheduling', label: '9. Scheduling (name + ID)', group: 'duty' },
  { id: 'duty_message', label: '10. Duty message sent', group: 'duty' },
  { id: 'active_duty', label: '11. On duty', group: 'duty' },
  { id: 'transfer_pending', label: 'Transfer — new posting + HOD approval', group: 'change' },
  { id: 'leave_return', label: 'Long leave return — fresh posting order', group: 'change' },
  { id: 'resignation', label: '12. Resignation started', group: 'exit' },
  { id: 'exit_interview', label: '13. Exit interview', group: 'exit' },
  { id: 'resigned', label: '14. Resignation closed', group: 'exit' },
] as const

/** Standard exit-interview reason categories (PSARA / HR pack). */
export const EXIT_REASON_CATEGORIES = [
  'Better pay / offer',
  'Relocation / hometown',
  'Family reasons',
  'Health',
  'Work conflict / duty issue',
  'Client / post issue',
  'Personal',
  'Other',
] as const

export type JourneyStageId = (typeof JOURNEY_STAGES)[number]['id']

export type JourneyHelpCall = {
  dayNo: 1 | 2 | 3
  /** Planned call date YYYY-MM-DD (alternate days) */
  plannedDate: string
  status: 'planned' | 'done' | 'no_answer' | 'skipped'
  notes: string
  calledBy: string
  calledAt: string
}

export type JourneyEvent = {
  id: string
  at: string
  by: string
  stage: JourneyStageId
  note: string
}

export type OpsGuardJourney = {
  id: string
  /** new_join | transfer | leave_return | resignation */
  kind: 'new_join' | 'transfer' | 'leave_return' | 'resignation'
  stage: JourneyStageId
  branchId: string
  branchName: string
  guardName: string
  employeeId: string
  mobile: string
  /** Face photo id → /api/ops/image?id=… (linked by Employee ID) */
  photoId: string
  /** PSARA recruitment pack */
  psaraDocsOk: boolean
  psaraDocNotes: string
  fitnessOk: boolean
  fitnessDate: string
  idCardIssued: boolean
  idCardNo: string
  uniformIssued: boolean
  uniformItems: string
  /** Deployment / posting */
  orderNo: string
  clientName: string
  postName: string
  location: string
  joiningDate: string
  shift: string
  /** WhatsApp — guard + CC HOD, Ops Manager, IT (app install) */
  waGuard: string
  waHod: string
  waOpsManager: string
  waIt: string
  waMessage: string
  waSentAt: string
  waStatus: 'draft' | 'queued' | 'sent' | 'failed'
  reportedDuty: boolean
  reportedDutyAt: string
  helpCalls: JourneyHelpCall[]
  /** Scheduling */
  scheduled: boolean
  scheduleNote: string
  /** New boys: no night shift in first week */
  firstWeekNoNight: boolean
  dutyMessageSentAt: string
  /** Transfer / leave return */
  hodApproved: boolean
  hodApprovedBy: string
  hodApprovedAt: string
  previousClient: string
  resignationDate: string
  resignationReason: string
  /** Exit interview (after resignation started, before closed) */
  exitInterview: JourneyExitInterview | null
  events: JourneyEvent[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type JourneyExitInterview = {
  interviewDate: string
  interviewedBy: string
  reasonCategory: string
  reasonDetail: string
  wouldRejoin: 'yes' | 'no' | 'maybe' | ''
  idCardReturned: boolean
  uniformReturned: boolean
  outstandingDues: string
  feedback: string
  /** Latest Indian labour codes apply to exit / F&F */
  labourCodeAcknowledged: boolean
  /** Notice period served / paid in lieu (as applicable under labour codes) */
  noticePeriodOk: boolean
  noticePeriodNotes: string
  /** Full & final / wage dues settled or scheduled */
  finalSettlementOk: boolean
  finalSettlementNotes: string
  /** EPF / ESIC / social security continuity note */
  socialSecurityNotes: string
  completed: boolean
  completedAt: string
  completedBy: string
}

/** Short reference shown on Exit Interview (not legal advice). */
export const INDIAN_LABOUR_CODE_NOTE =
  'Latest Indian labour codes apply: Code on Wages 2019; Industrial Relations Code 2020; Code on Social Security 2020; OSHWC Code 2020 — plus PSARA and applicable State rules. Notice, wages, and social-security dues must be handled as per law.'

export function emptyExitInterview(): JourneyExitInterview {
  return {
    interviewDate: '',
    interviewedBy: '',
    reasonCategory: '',
    reasonDetail: '',
    wouldRejoin: '',
    idCardReturned: false,
    uniformReturned: false,
    outstandingDues: '',
    feedback: '',
    labourCodeAcknowledged: false,
    noticePeriodOk: false,
    noticePeriodNotes: '',
    finalSettlementOk: false,
    finalSettlementNotes: '',
    socialSecurityNotes: '',
    completed: false,
    completedAt: '',
    completedBy: '',
  }
}

export function journeyStageLabel(id: string): string {
  return JOURNEY_STAGES.find((s) => s.id === id)?.label || id
}

/** Three alternate calendar days starting tomorrow (IST-ish from ISO date). */
export function planHelpDeskCalls(fromIso: string): JourneyHelpCall[] {
  const start = new Date(`${fromIso}T12:00:00`)
  const out: JourneyHelpCall[] = []
  for (let i = 0; i < 3; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + 1 + i * 2) // alternate days
    out.push({
      dayNo: (i + 1) as 1 | 2 | 3,
      plannedDate: d.toISOString().slice(0, 10),
      status: 'planned',
      notes: '',
      calledBy: '',
      calledAt: '',
    })
  }
  return out
}

export function defaultWaMessage(j: Pick<OpsGuardJourney, 'guardName' | 'employeeId' | 'clientName' | 'postName' | 'location' | 'joiningDate' | 'orderNo'>): string {
  return [
    `AGILE SECURITY FORCE — Deployment Order`,
    `Name: ${j.guardName}`,
    `ID: ${j.employeeId || '(allot)'}`,
    `Order: ${j.orderNo || '(pending)'}`,
    `Client: ${j.clientName}`,
    `Post / Location: ${j.postName} — ${j.location}`,
    `Report date: ${j.joiningDate}`,
    ``,
    `Please install / use Agile Mobile as guided by IT.`,
    `Reply REPORTED when you report for duty.`,
    `CC: HOD, Ops Manager, IT`,
  ].join('\n')
}

/** Block night (C) for new join first 7 days from joiningDate. */
export function allowNightShift(j: OpsGuardJourney, onDate: string): boolean {
  if (j.kind !== 'new_join' || !j.firstWeekNoNight || !j.joiningDate) return true
  const join = new Date(`${j.joiningDate}T12:00:00`).getTime()
  const day = new Date(`${onDate}T12:00:00`).getTime()
  const days = Math.floor((day - join) / 86400000)
  return days >= 7
}

export function nextOnboardStage(current: JourneyStageId): JourneyStageId | null {
  const order: JourneyStageId[] = [
    'recruitment_psara',
    'fitness_test',
    'id_card',
    'uniform',
    'deployment_order',
    'whatsapp_sent',
    'reported_duty',
    'helpdesk_calls',
    'scheduling',
    'duty_message',
    'active_duty',
  ]
  const i = order.indexOf(current)
  if (i < 0 || i >= order.length - 1) return null
  return order[i + 1]
}
