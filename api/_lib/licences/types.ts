/**
 * Agile Licenses — branch business licences + client labour licences.
 */

export type LicBranchKind = 'PSARA' | 'ShopEstablishment' | 'Trade'

export type LicLabourAuthority = 'State' | 'Central'

export type LicStatus = 'Active' | 'Expired' | 'Applied' | 'Suspended'

export type LicBranchLicence = {
  id: string
  kind: LicBranchKind
  licenceNo: string
  issuingAuthority: string
  branchId: string
  branchName: string
  state: string
  validFrom: string
  validTo: string
  sanctionedStrength: number
  holderName: string
  documentUrl: string
  status: LicStatus
  notes: string
  responsibleOfficer: string
  createdAt: string
  updatedAt: string
  createdByEmail: string
}

export type LicLabourLicence = {
  id: string
  authority: LicLabourAuthority
  clientId: string
  clientName: string
  siteName: string
  branchId: string
  branchName: string
  licenceNo: string
  licenceFor: string
  sanctionedStrength: number
  validFrom: string
  validTo: string
  issuingAuthority: string
  documentUrl: string
  status: LicStatus
  notes: string
  responsibleOfficer: string
  createdAt: string
  updatedAt: string
  createdByEmail: string
}

export type LicAlert = {
  id: string
  kind: 'branch' | 'labour'
  severity: 'critical' | 'warn' | 'info'
  title: string
  branchName: string
  clientName: string
  licenceNo: string
  dueDate: string
  actionRequired: string
  daysLeft: number
  refId: string
}

export const LIC_BRANCH_KINDS: { id: LicBranchKind; label: string }[] = [
  { id: 'PSARA', label: 'PSARA Licence' },
  { id: 'ShopEstablishment', label: 'Shop & Establishment' },
  { id: 'Trade', label: 'Trade Licence' },
]

export const LIC_LABOUR_AUTH: { id: LicLabourAuthority; label: string }[] = [
  { id: 'State', label: 'State Labour Licence' },
  { id: 'Central', label: 'Central Labour Licence' },
]

export function branchKindLabel(k: LicBranchKind): string {
  return LIC_BRANCH_KINDS.find((x) => x.id === k)?.label || k
}
