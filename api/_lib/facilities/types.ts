/**
 * Agile Facilities — property, lease, tax & maintenance types.
 */

export type FacPropertyStatus = 'Active' | 'Vacant' | 'UnderRenovation' | 'Disposed'
export type FacTenure = 'Owned' | 'Leased' | 'Rented'
export type FacUsage =
  | 'BranchOffice'
  | 'HO'
  | 'TrainingAcademy'
  | 'Quarters'
  | 'Godown'
  | 'Other'

export type FacProperty = {
  id: string
  propertyCode: string
  name: string
  address: string
  city: string
  areaSqFt: number
  tenure: FacTenure
  usage: FacUsage
  status: FacPropertyStatus
  landlordName: string
  landlordPhone: string
  landlordEmail: string
  ownerName: string
  branchId: string
  branchName: string
  notes: string
  createdAt: string
  updatedAt: string
  createdByEmail: string
}

export type FacLease = {
  id: string
  propertyId: string
  propertyName: string
  branchId: string
  branchName: string
  startDate: string
  expiryDate: string
  monthlyRent: number
  securityDeposit: number
  escalationPct: number
  noticePeriodDays: number
  landlordName: string
  landlordPhone: string
  landlordEmail: string
  documentUrl: string
  documentNote: string
  status: 'Active' | 'Expired' | 'Terminated' | 'Draft'
  responsibleOfficer: string
  responsibleEmail: string
  createdAt: string
  updatedAt: string
}

export type FacTaxKind =
  | 'PropertyTax'
  | 'MunicipalCharges'
  | 'LandRevenue'
  | 'WaterUtility'
  | 'Electricity'
  | 'Other'

export type FacTaxItem = {
  id: string
  propertyId: string
  propertyName: string
  branchId: string
  branchName: string
  kind: FacTaxKind
  authority: string
  amountDue: number
  dueDate: string
  paidAt: string
  status: 'Pending' | 'Paid' | 'Overdue'
  responsibleOfficer: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type FacMaintKind =
  | 'UPS'
  | 'Electrical'
  | 'HVAC'
  | 'Plumbing'
  | 'Structural'
  | 'Sanitation'
  | 'AMC'
  | 'Other'

export type FacWorkOrder = {
  id: string
  propertyId: string
  propertyName: string
  branchId: string
  branchName: string
  kind: FacMaintKind
  title: string
  detail: string
  vendorName: string
  vendorBillRef: string
  cost: number
  scheduledDate: string
  completedDate: string
  recurring: '' | 'Quarterly' | 'Annual'
  nextServiceDate: string
  status: 'Open' | 'InProgress' | 'Closed'
  responsibleOfficer: string
  createdAt: string
  updatedAt: string
}

export const FAC_USAGES: { id: FacUsage; label: string }[] = [
  { id: 'BranchOffice', label: 'Branch Office' },
  { id: 'HO', label: 'Head Office' },
  { id: 'TrainingAcademy', label: 'Training Academy' },
  { id: 'Quarters', label: 'Quarters' },
  { id: 'Godown', label: 'Godown / Store' },
  { id: 'Other', label: 'Other' },
]

export const FAC_TAX_KINDS: { id: FacTaxKind; label: string }[] = [
  { id: 'PropertyTax', label: 'Property Tax' },
  { id: 'MunicipalCharges', label: 'Municipal Charges' },
  { id: 'LandRevenue', label: 'Land Revenue' },
  { id: 'WaterUtility', label: 'Water / Utility' },
  { id: 'Electricity', label: 'Electricity' },
  { id: 'Other', label: 'Other' },
]

export const FAC_MAINT_KINDS: { id: FacMaintKind; label: string }[] = [
  { id: 'UPS', label: 'UPS' },
  { id: 'Electrical', label: 'Electrical' },
  { id: 'HVAC', label: 'HVAC' },
  { id: 'Plumbing', label: 'Plumbing' },
  { id: 'Structural', label: 'Structural' },
  { id: 'Sanitation', label: 'Sanitation' },
  { id: 'AMC', label: 'AMC / Contract' },
  { id: 'Other', label: 'Other' },
]

export type FacAlert = {
  id: string
  kind: 'lease' | 'tax' | 'maintenance'
  severity: 'critical' | 'warn' | 'info'
  propertyName: string
  branchName: string
  dueDate: string
  actionRequired: string
  responsibleOfficer: string
  refId: string
  daysLeft: number
}
