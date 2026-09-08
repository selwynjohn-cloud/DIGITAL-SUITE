/**
 * Agile Assets — furniture, fittings & office equipment.
 */

export type AaOrgTier = 'Corporate' | 'TrainingAcademy' | 'Recruitment' | 'Branch'

export type AaCategory =
  | 'Furniture'
  | 'Fitting'
  | 'ITHardware'
  | 'SecurityGear'
  | 'Electrical'
  | 'UPS'
  | 'TrainingTool'
  | 'Biometric'
  | 'Other'

export type AaStatus = 'InService' | 'InTransit' | 'UnderRepair' | 'WrittenOff' | 'Disposed'

export type AaAsset = {
  id: string
  assetCode: string
  name: string
  category: AaCategory
  subCategory: string
  brand: string
  serialNo: string
  purchaseDate: string
  invoiceRef: string
  supplier: string
  warrantyExpiry: string
  originalCost: number
  bookValue: number
  orgTier: AaOrgTier
  branchId: string
  branchName: string
  roomFloor: string
  custodianName: string
  custodianEmail: string
  status: AaStatus
  notes: string
  qrPayload: string
  createdAt: string
  updatedAt: string
  createdByEmail: string
}

export type AaTransfer = {
  id: string
  assetId: string
  assetCode: string
  assetName: string
  fromBranchId: string
  fromBranchName: string
  toBranchId: string
  toBranchName: string
  fromCustodian: string
  toCustodian: string
  handedOverAt: string
  handedOverBy: string
  takenOverAt: string
  takenOverBy: string
  status: 'PendingHOTO' | 'Completed' | 'Cancelled'
  notes: string
  createdAt: string
}

export type AaMaintKind = 'Preventive' | 'Breakdown' | 'AMC'

export type AaMaintTicket = {
  id: string
  assetId: string
  assetCode: string
  assetName: string
  branchId: string
  branchName: string
  kind: AaMaintKind
  title: string
  detail: string
  vendorName: string
  cost: number
  amcRef: string
  scheduledDate: string
  completedDate: string
  nextServiceDate: string
  status: 'Raised' | 'InProgress' | 'Resolved' | 'Closed'
  raisedBy: string
  createdAt: string
  updatedAt: string
}

export type AaWriteOff = {
  id: string
  assetId: string
  assetCode: string
  assetName: string
  branchId: string
  branchName: string
  reason: string
  method: 'Condemn' | 'Auction' | 'Scrap' | 'Donate'
  requestedBy: string
  requestedAt: string
  approvedBy: string
  approvedAt: string
  status: 'Pending' | 'Approved' | 'Rejected'
  notes: string
}

export type AaAlert = {
  id: string
  kind: 'warranty' | 'amc' | 'maintenance' | 'writeoff' | 'transfer'
  severity: 'critical' | 'warn' | 'info'
  assetCode: string
  assetName: string
  branchName: string
  dueDate: string
  actionRequired: string
  daysLeft: number
}

export const AA_CATEGORIES: { id: AaCategory; label: string }[] = [
  { id: 'Furniture', label: 'Furniture' },
  { id: 'Fitting', label: 'Fitting / Fixture' },
  { id: 'ITHardware', label: 'IT Hardware' },
  { id: 'SecurityGear', label: 'Security Gear' },
  { id: 'Electrical', label: 'Electrical' },
  { id: 'UPS', label: 'UPS / Power' },
  { id: 'TrainingTool', label: 'Training Tool' },
  { id: 'Biometric', label: 'Biometric' },
  { id: 'Other', label: 'Other' },
]

export const AA_TIERS: { id: AaOrgTier; label: string }[] = [
  { id: 'Corporate', label: 'Corporate Office' },
  { id: 'TrainingAcademy', label: 'Training Academy' },
  { id: 'Recruitment', label: 'Recruitment Department' },
  { id: 'Branch', label: 'Regional / Branch Office' },
]
