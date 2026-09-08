/**
 * Agile HR Audit — strategic clients, monthly/quarterly SLA audits,
 * statutory document packs (PF, ESIC, wages…), checklist points, issue closure.
 */

export type HraCadence = 'Monthly' | 'Quarterly'

export type HraAuditStatus = 'Planned' | 'InProgress' | 'Submitted' | 'Closed'

export type HraPointStatus = 'Pending' | 'Compliant' | 'NonCompliant' | 'NA'

export type HraDocStatus = 'Pending' | 'Submitted' | 'Accepted' | 'Rejected'

export type HraIssueStatus = 'Open' | 'InProgress' | 'Closed'

export type HraIssueSeverity = 'High' | 'Medium' | 'Low'

/** Standard statutory / supporting documents for HR audit packs. */
export type HraDocKind =
  | 'PF'
  | 'ESIC'
  | 'Wages'
  | 'MusterRoll'
  | 'WorkmenRegister'
  | 'MinWages'
  | 'PT'
  | 'Attendance'
  | 'AppointmentLetters'
  | 'LabourLicence'
  | 'Bonus'
  | 'Other'

export type HraDocItem = {
  kind: HraDocKind
  label: string
  status: HraDocStatus
  fileUrl: string
  periodLabel: string
  remarks: string
}

export type HraCheckPoint = {
  id: string
  title: string
  required: boolean
  status: HraPointStatus
  remarks: string
}

/** Reference packs from real Agile submissions (structure only — no live payroll data in repo). */
export type HraSampleFormat = {
  id: string
  title: string
  usedFor: string
  forms: string[]
  sheets: string[]
  keyColumns: string[]
  notes: string
}

export const HRA_SAMPLE_FORMATS: HraSampleFormat[] = [
  {
    id: 'jth-contract-labour-pack',
    title: 'Contract Labour statutory pack (e.g. JTH)',
    usedFor: 'Principal-employer audits under T.S. Contract Labour (R&A) Rules — full register set',
    forms: [
      'Form XIII — Register of Workmen Employed by Contractor (Rule 75)',
      'Form XVI — Muster Roll (Rule 78(1)(a)(i))',
      'Form XVII — Register of Wages',
      'Register of Advances / Fines / Damage · Employment Card · DOJ–DOL',
    ],
    sheets: [
      'WORKMAN F-13',
      'MUSTEROLL',
      'REGISTER OF WAGES',
      'REGISTER OF ADVANCES',
      'REGISTER OF FINES',
      'DED DAMAGE',
      'EMPLOYMNET CARD',
      'DOJ- DOL',
    ],
    keyColumns: [
      'Emp ID',
      'Name',
      'Sex / DOB',
      "Father's name",
      'Designation',
      'Mobile',
      'Aadhaar',
      'UAN',
      'ESIC No',
      'Bank account',
      'Daily attendance marks',
      'Wage components',
    ],
    notes:
      'Sample file pattern: “JTH - WAGE REGISTER FORMAT.xls”. Submit the full workbook for the audit month with contractor + principal employer details filled.',
  },
  {
    id: 'hdfc-muster-form-d',
    title: 'Attendance / Muster — Form D (e.g. HDFC)',
    usedFor: 'Quarterly / monthly client HR audit — attendance register by site / district',
    forms: ['FORM D — Format of Attendance Register'],
    sheets: ['By region / city (e.g. HDFC HYD, TS DIST, AP)'],
    keyColumns: [
      'Sr No',
      'Emp ID',
      'Name',
      'Place of work (site)',
      'Days In/Out',
      'Date-wise P / W/O marks',
      'Period From–To',
    ],
    notes:
      'Sample file pattern: “MUSTER ROLL … HYD&AP&TS …xls”. One sheet per geography; period must match the audit month.',
  },
  {
    id: 'hdfc-wages-form-b',
    title: 'Wage Register — Form B (e.g. HDFC)',
    usedFor: 'Client wage register with MW rates, earnings & statutory deductions',
    forms: ['FORM B — Format for Wages Register'],
    sheets: ['Wage register for period (city / client)'],
    keyColumns: [
      'Area / site name',
      'Emp ID',
      'Name',
      'Rate of wage (Basic / DA)',
      'Days worked',
      'OT hours',
      'Basic / DA / Leave / NH / Bonus',
      'PF',
      'ESIC',
      'PT',
      'Other recoveries',
      'Net payable',
    ],
    notes:
      'Sample file pattern: “WAGEREGISTER … JUNE …xls”. Must reconcile to muster days and to PF / ESIC challans for the same period.',
  },
]

export const HRA_DOC_CATALOG: { kind: HraDocKind; label: string }[] = [
  { kind: 'PF', label: 'PF ECR / Challan' },
  { kind: 'ESIC', label: 'ESIC Contribution challan' },
  { kind: 'Wages', label: 'Wage Register (Form B / Form XVII)' },
  { kind: 'MusterRoll', label: 'Muster Roll / Attendance (Form D / Form XVI)' },
  { kind: 'WorkmenRegister', label: 'Register of Workmen (Form XIII)' },
  { kind: 'MinWages', label: 'Minimum wages rate sheet' },
  { kind: 'PT', label: 'Professional Tax remittance' },
  { kind: 'LabourLicence', label: 'Labour licence copy' },
  { kind: 'AppointmentLetters', label: 'Appointment / engagement letters' },
  { kind: 'Bonus', label: 'Bonus / other statutory payments' },
  { kind: 'Other', label: 'Other supporting document' },
]

export const HRA_DEFAULT_CHECKLIST: { title: string; required: boolean }[] = [
  { title: 'Wage Register (Form B / XVII) submitted for the audit period', required: true },
  { title: 'Muster Roll / Attendance (Form D / XVI) matches wage days', required: true },
  { title: 'PF ECR / challan matches wage register PF column', required: true },
  { title: 'ESIC contribution matches wage register ESIC column', required: true },
  { title: 'Minimum wages (Basic + DA) rates correctly applied', required: true },
  { title: 'Professional tax deducted and remitted (where applicable)', required: false },
  { title: 'Register of Workmen (Form XIII) updated (contract labour clients)', required: false },
  { title: 'Previous audit observations / pending issues closed', required: true },
  { title: 'Client-specific SLA HR clauses complied (e.g. KRC monthly / HDFC quarterly)', required: true },
]

export function defaultDocuments(): HraDocItem[] {
  const core: HraDocKind[] = ['PF', 'ESIC', 'Wages', 'MusterRoll', 'WorkmenRegister', 'MinWages', 'PT', 'LabourLicence']
  return HRA_DOC_CATALOG.filter((d) => core.includes(d.kind)).map((d) => ({
    kind: d.kind,
    label: d.label,
    status: 'Pending' as HraDocStatus,
    fileUrl: '',
    periodLabel: '',
    remarks: '',
  }))
}

export function defaultChecklist(): HraCheckPoint[] {
  return HRA_DEFAULT_CHECKLIST.map((p, i) => ({
    id: `cp${i + 1}`,
    title: p.title,
    required: p.required,
    status: 'Pending' as HraPointStatus,
    remarks: '',
  }))
}

/** SLA profile — which strategic client, monthly (defined day) or quarterly. */
export type HraClientProfile = {
  id: string
  clientId: string
  clientName: string
  branchId: string
  branchName: string
  cadence: HraCadence
  /** For Monthly (e.g. KRC): day of month 1–28 when SLA / audit falls. */
  slaDay: number
  /** Optional short code e.g. KRC, HDFC */
  clientCode: string
  active: boolean
  notes: string
  responsibleOfficer: string
  /** Next expected audit / SLA date YYYY-MM-DD */
  nextAuditDate: string
  createdAt: string
  updatedAt: string
  createdByEmail: string
}

export type HraAudit = {
  id: string
  profileId: string
  clientId: string
  clientName: string
  clientCode: string
  branchId: string
  branchName: string
  cadence: HraCadence
  auditDate: string
  periodFrom: string
  periodTo: string
  status: HraAuditStatus
  checklist: HraCheckPoint[]
  documents: HraDocItem[]
  agenda: string
  minutes: string
  submittedAt: string
  submittedBy: string
  createdAt: string
  updatedAt: string
  createdByEmail: string
}

export type HraIssue = {
  id: string
  auditId: string
  clientId: string
  clientName: string
  branchId: string
  branchName: string
  title: string
  pointRef: string
  severity: HraIssueSeverity
  status: HraIssueStatus
  dueDate: string
  ownerName: string
  ownerEmail: string
  closureNotes: string
  closedAt: string
  createdAt: string
  updatedAt: string
  createdByEmail: string
}

export type HraAlert = {
  id: string
  kind: 'audit' | 'document' | 'issue'
  severity: 'critical' | 'warn' | 'info'
  title: string
  branchName: string
  clientName: string
  dueDate: string
  actionRequired: string
  daysLeft: number
  refId: string
}

export function addMonthsIso(isoDate: string, months: number): string {
  const d = new Date(String(isoDate || '').slice(0, 10) + 'T12:00:00+05:30')
  if (!Number.isFinite(d.getTime())) return ''
  d.setMonth(d.getMonth() + months)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Next monthly SLA date from a defined day-of-month (1–28). */
export function nextMonthlySlaDate(slaDay: number, fromIso?: string): string {
  const day = Math.min(28, Math.max(1, Math.round(slaDay) || 1))
  const base = fromIso
    ? new Date(String(fromIso).slice(0, 10) + 'T12:00:00+05:30')
    : new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  if (!Number.isFinite(base.getTime())) return ''
  let y = base.getFullYear()
  let m = base.getMonth()
  const candidate = new Date(y, m, day, 12, 0, 0)
  const todayStart = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12, 0, 0)
  if (candidate.getTime() < todayStart.getTime()) {
    m += 1
    if (m > 11) {
      m = 0
      y += 1
    }
  }
  const out = new Date(y, m, day, 12, 0, 0)
  const yy = out.getFullYear()
  const mm = String(out.getMonth() + 1).padStart(2, '0')
  const dd = String(out.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export function nextDueAfterAudit(auditDate: string, cadence: HraCadence, slaDay?: number): string {
  if (cadence === 'Monthly') {
    const after = addMonthsIso(auditDate, 1)
    if (slaDay) return nextMonthlySlaDate(slaDay, after)
    return after
  }
  return addMonthsIso(auditDate, 3)
}
