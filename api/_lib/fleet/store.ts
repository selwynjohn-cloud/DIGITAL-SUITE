/**
 * Agile Fleet storage (Upstash Redis).
 * Vehicle master, users, weekly branch reports, pre-trip / daily inspections.
 * Records are deactivated — never deleted.
 */

import { matchesSuiteAdminPassword, matchesSuiteBranchPin, suiteAdminPassword, suiteBranchPin } from '../suite-credentials.js'

export type FleetUserRole = 'admin' | 'branch'
export type FleetUserType = 'director' | 'admin' | 'hod' | 'staff'

/** Login accounts — management (admin) or branch HOD/staff portal. */
export type FleetUser = {
  id: string
  name: string
  email: string
  mobile: string
  role: FleetUserRole
  /** Director / Admin → management portal; HOD / Staff → branch portal */
  userType: FleetUserType
  /** Branch name for HOD/Staff; empty for Director/Admin */
  branchId: string
  /** Admin password or branch PIN */
  password: string
  active: boolean
  deactivateReason: string
  remarks: string
  createdAt: string
}

export type FleetDriver = {
  id: string
  branchId: string
  name: string
  mobile: string
  licenseNo: string
  licenseIssueDate: string
  licenseValid: string // YYYY-MM-DD
  licenseType: string // LMV / HMV / MCWG etc.
  medicalFitness: string
  trafficPenaltyWeek: string
  badgeNo: string
  active: boolean
  deactivateReason: string
  remarks: string
  createdAt: string
}

export type FleetVehicle = {
  id: string
  branchId: string
  /** Display name e.g. Scorpio N / Fortuner */
  vehicleName: string
  regNo: string
  chassisNo: string
  engineNo: string
  vehicleType: string // 4-Wheeler | 2-Wheeler | EV
  makeModel: string
  manufacturer: string
  fuelType: string // Diesel | Petrol | Electric | CNG
  driverName: string
  driverMobile: string
  licenseNo: string
  licenseValid: string // YYYY-MM-DD
  insuranceValid: string
  insuranceIssueDate: string
  insurancePolicyNo: string
  insuranceCompany: string
  insuranceClaim: string
  pucValid: string
  pucIssueDate: string
  dateOfPurchase: string
  tyresCondition: string
  batteryCondition: string
  vehicleCondition: string
  damageNote: string
  lastServiceDate: string
  nextServiceDue: string
  nextServiceKm: string
  lastOdoReading: string
  majorAccident: string
  /** Reason if deactivated e.g. Sold, Written Off */
  deactivateReason: string
  active: boolean
  remarks: string
  createdAt: string
}

export type FleetWeeklyEntry = {
  vehicleId: string
  regNo: string
  makeModel: string
  driverName: string
  driverMobile: string
  licenseNo: string
  licenseValid: string
  odoStart: string
  odoEnd: string
  kmWeek: number
  kmMonth: number
  lastFuelDate: string
  /** Diesel | Petrol | Electric | CNG */
  fuelType: string
  fuelLiters: number
  fuelCost: number
  fuelCardCharged: number
  evChargeCost: number
  evChargeKwh: string
  fuelAmount: string
  fuelQty: string
  maintenanceDetails: string
  maintenanceCost: string
  maintenanceCostNum: number
  insuranceValid: string
  pucValid: string
  condition: string
  nextServiceKm: string
  trafficPenaltyRs: string
  tyreChangeKm: string
  batteryChangeKm: string
  remarks: string
}

export type FleetWeeklyReport = {
  id: string
  /** Human-readable archive code e.g. WR-HYD-2026-W27-a1b2 */
  reportCode: string
  branchId: string
  weekNo: string // e.g. Week-18
  fromDate: string
  toDate: string
  submittedBy: string
  submittedAt: string
  entries: FleetWeeklyEntry[]
  active: boolean
}

export type FleetInspectionItem = { item: string; status: string; remarks: string }

export type FleetInspection = {
  id: string
  branchId: string
  formType: string // pre-trip-4w | post-trip-4w | pre-trip-2w | daily
  date: string
  regNo: string
  location: string
  riderName: string
  licenseNo: string
  shift: string
  odoStart: string
  odoEnd: string
  battery: string
  items: FleetInspectionItem[]
  checkedBy: string
  active: boolean
  createdAt: string
}

export const FLEET_BRANCHES = [
  'Visakhapatnam',
  'Nellore',
  'Bangalore',
  'Gulbarga',
  'Hyderabad',
  'Kakinada',
  'Vijayawada',
  'Chennai',
  'Mumbai',
  'Corporate Office',
] as const

export const VEHICLE_TYPES = ['4-Wheeler', '2-Wheeler', 'EV'] as const
export const FUEL_TYPES = ['Diesel', 'Petrol', 'Electric', 'CNG'] as const
export const CHECK_STATUS = ['OK', 'NOT OK', 'NA'] as const
export const SHIFTS = ['Morning', 'Afternoon', 'Night'] as const

/** Pre-trip 4W checklist (Form PTC-01) — condensed from AGILW vehicle check template. */
export const PRETRIP_4W_ITEMS = [
  'Tyre Condition – Front Left',
  'Tyre Condition – Front Right',
  'Tyre Condition – Rear Left',
  'Tyre Condition – Rear Right',
  'Tyre Pressure (All 4 + Spare)',
  'Spare Tyre Availability & Condition',
  'Jack & Tool Kit',
  'Body Damage / Dents / Scratches',
  'Windshield & Window Glass',
  'Wiper Blades (Front & Rear)',
  'Mirrors – ORVM & IRVM',
  'Number Plates (Front & Rear)',
  'Headlights (Low & High Beam)',
  'Tail Lights / Brake Lights',
  'Indicators / Turn Signals',
  'Reverse Light & Camera',
  'Horn',
  'Battery / Alternator Warning Light',
  'Engine Oil Level',
  'Coolant Level',
  'Brake Fluid Level',
  'Power Steering Fluid',
  'Windshield Washer Fluid',
  'Seat Belts (All Seats)',
  'Fire Extinguisher',
  'First Aid Kit',
  'Documents – RC, Insurance, PUC, License',
  'Vehicle Cleanliness',
]

export const PRETRIP_2W_ITEMS = [
  'Tyre Condition – Front & Rear',
  'Tyre Pressure',
  'Brakes (Front & Rear)',
  'Headlight & Tail Light',
  'Indicators',
  'Horn',
  'Mirrors',
  'Chain / Drive Belt',
  'Engine Oil Level',
  'Fuel Level',
  'Helmet (Rider & Pillion)',
  'Documents – RC, Insurance, License',
]

export const POSTTRIP_4W_ITEMS = [
  'Trip End Odometer Recorded',
  'Fuel / Battery Level After Trip',
  'New Damage or Dents Noticed',
  'Tyre Condition After Trip',
  'Lights & Indicators Working',
  'Brakes Responsive After Trip',
  'Windshield & Mirrors Clear',
  'Interior Cleanliness',
  'Documents in Vehicle (RC/Insurance/PUC)',
  'Fire Extinguisher & First Aid Present',
  'Keys & Vehicle Secured',
  'Any Incident During Trip',
  'Vehicle Parked Safely',
  'Post-Trip Cleanliness',
  'Rider Fit to Drive (Return)',
]

const VEHICLES_KEY = 'fleet:vehicles'
const DRIVERS_KEY = 'fleet:drivers'
const USERS_KEY = 'fleet:users'
const REPORTS_KEY = 'fleet:reports'
const INSPECTIONS_KEY = 'fleet:inspections'

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url, token } : null
}

export function fleetStorageOk(): boolean {
  return redisConfig() !== null
}

async function redis(command: unknown[]): Promise<{ result?: unknown } | null> {
  const cfg = redisConfig()
  if (!cfg) return null
  try {
    const res = await fetch(cfg.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    })
    if (!res.ok) return null
    return (await res.json()) as { result?: unknown }
  } catch {
    return null
  }
}

async function getJson<T>(key: string, fallback: T): Promise<T> {
  const d = await redis(['GET', key])
  if (d?.result && typeof d.result === 'string') {
    try {
      return JSON.parse(d.result) as T
    } catch {
      /* ignore */
    }
  }
  return fallback
}

async function setJson(key: string, value: unknown): Promise<boolean> {
  const r = await redis(['SET', key, JSON.stringify(value)])
  return r?.result === 'OK'
}

export const getVehicles = () => getJson<FleetVehicle[]>(VEHICLES_KEY, [])
export const saveVehicles = (v: FleetVehicle[]) => setJson(VEHICLES_KEY, v)
export const getDrivers = () => getJson<FleetDriver[]>(DRIVERS_KEY, [])
export const saveDrivers = (d: FleetDriver[]) => setJson(DRIVERS_KEY, d)
export const getUsers = () => getJson<FleetUser[]>(USERS_KEY, [])
export const saveUsers = (u: FleetUser[]) => setJson(USERS_KEY, u)
export const getReports = () => getJson<FleetWeeklyReport[]>(REPORTS_KEY, [])
export const saveReports = (r: FleetWeeklyReport[]) => setJson(REPORTS_KEY, r)
export const getInspections = () => getJson<FleetInspection[]>(INSPECTIONS_KEY, [])
export const saveInspections = (i: FleetInspection[]) => setJson(INSPECTIONS_KEY, i)

export function fleetNid(p = ''): string {
  return `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

const BRANCH_ABBR: Record<string, string> = {
  Visakhapatnam: 'VSK',
  Nellore: 'NEL',
  Bangalore: 'BLR',
  Gulbarga: 'GLB',
  Hyderabad: 'HYD',
  Kakinada: 'KKD',
  Vijayawada: 'VJA',
  Chennai: 'CHN',
  Mumbai: 'MUM',
  'Corporate Office': 'CO',
}

/** Archive report code — stored with each weekly submission. */
export function fleetReportCode(branchId: string, weekNo: string, id?: string): string {
  const abbr = BRANCH_ABBR[branchId] || branchId.slice(0, 3).toUpperCase().replace(/\s/g, '')
  const year = new Date().getFullYear()
  const wk = String(weekNo || '').replace(/^Week-?/i, '') || '0'
  const tail = (id || fleetNid('')).slice(-4).toUpperCase()
  return `WR-${abbr}-${year}-W${wk}-${tail}`
}

export function normalizeReport(r: Partial<FleetWeeklyReport> & { id?: string }): FleetWeeklyReport {
  const id = String(r.id || fleetNid('wr'))
  const branchId = String(r.branchId || '')
  const weekNo = String(r.weekNo || currentWeekLabel())
  return {
    id,
    reportCode: String(r.reportCode || fleetReportCode(branchId, weekNo, id)),
    branchId,
    weekNo,
    fromDate: String(r.fromDate || ''),
    toDate: String(r.toDate || ''),
    submittedBy: String(r.submittedBy || ''),
    submittedAt: String(r.submittedAt || new Date().toISOString()),
    entries: Array.isArray(r.entries) ? r.entries : [],
    active: r.active !== false,
  }
}

export function fleetNum(v: unknown): number {
  const n = Number(String(v ?? '').replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

export function fleetAdminPassword(): string {
  return suiteAdminPassword()
}

export function fleetBranchPin(): string {
  return suiteBranchPin()
}

export type FleetAuth = { role: 'admin' | 'branch' | null; branch: string | null }

export function fleetAuth(
  password: string,
  branchId: string,
  pin: string,
  users: FleetUser[] = [],
): FleetAuth {
  const active = users.filter((u) => u.active)

  if (password) {
    const admin = active.find((u) => u.role === 'admin' && u.password === password)
    if (admin) return { role: 'admin', branch: null }
    if (matchesSuiteAdminPassword(password)) return { role: 'admin', branch: null }
    return { role: null, branch: null }
  }

  const cred = pin
  if (
    branchId &&
    cred &&
    FLEET_BRANCHES.includes(branchId as (typeof FLEET_BRANCHES)[number])
  ) {
    const branchUser = active.find((u) => u.role === 'branch' && u.branchId === branchId && u.password === cred)
    if (branchUser) return { role: 'branch', branch: branchId }
    if (matchesSuiteBranchPin(cred)) return { role: 'branch', branch: branchId }
  }
  return { role: null, branch: null }
}

/** ISO week number label e.g. Week-18 */
export function currentWeekLabel(d = new Date()): string {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = x.getUTCDay() || 7
  x.setUTCDate(x.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(x.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((x.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `Week-${week}`
}

export function weekDateRange(d = new Date()): { from: string; to: string } {
  const x = new Date(d)
  const wd = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - wd)
  const from = x.toISOString().slice(0, 10)
  x.setDate(x.getDate() + 6)
  return { from, to: x.toISOString().slice(0, 10) }
}

/** Vehicle master — no driver assignment (drivers are branch pool, filled in weekly report only). */
export function normalizeVehicle(v: Partial<FleetVehicle> & { id?: string }): FleetVehicle {
  const name = String(v.vehicleName || v.makeModel || '')
  return {
    id: String(v.id || fleetNid('vh')),
    branchId: String(v.branchId || ''),
    vehicleName: name,
    regNo: String(v.regNo || ''),
    chassisNo: String(v.chassisNo || ''),
    engineNo: String(v.engineNo || ''),
    vehicleType: String(v.vehicleType || '4-Wheeler'),
    makeModel: String(v.makeModel || name),
    manufacturer: String(v.manufacturer || ''),
    fuelType: String(v.fuelType || (v.vehicleType === 'EV' ? 'Electric' : 'Diesel')),
    driverName: String(v.driverName || ''),
    driverMobile: String(v.driverMobile || ''),
    licenseNo: String(v.licenseNo || ''),
    licenseValid: String(v.licenseValid || ''),
    insuranceValid: String(v.insuranceValid || ''),
    insuranceIssueDate: String(v.insuranceIssueDate || ''),
    insurancePolicyNo: String(v.insurancePolicyNo || ''),
    insuranceCompany: String(v.insuranceCompany || ''),
    insuranceClaim: String(v.insuranceClaim || ''),
    pucValid: String(v.pucValid || ''),
    pucIssueDate: String(v.pucIssueDate || ''),
    dateOfPurchase: String(v.dateOfPurchase || ''),
    tyresCondition: String(v.tyresCondition || ''),
    batteryCondition: String(v.batteryCondition || ''),
    vehicleCondition: String(v.vehicleCondition || 'Good'),
    damageNote: String(v.damageNote || ''),
    lastServiceDate: String(v.lastServiceDate || ''),
    nextServiceDue: String(v.nextServiceDue || ''),
    nextServiceKm: String(v.nextServiceKm || ''),
    lastOdoReading: String(v.lastOdoReading || ''),
    majorAccident: String(v.majorAccident || ''),
    deactivateReason: String(v.deactivateReason || ''),
    active: v.active !== false,
    remarks: String(v.remarks || ''),
    createdAt: String(v.createdAt || new Date().toISOString()),
  }
}

export function normalizeDriver(d: Partial<FleetDriver> & { id?: string }): FleetDriver {
  return {
    id: String(d.id || fleetNid('dr')),
    branchId: String(d.branchId || ''),
    name: String(d.name || ''),
    mobile: String(d.mobile || ''),
    licenseNo: String(d.licenseNo || ''),
    licenseIssueDate: String(d.licenseIssueDate || ''),
    licenseValid: String(d.licenseValid || ''),
    licenseType: String(d.licenseType || 'LMV'),
    medicalFitness: String(d.medicalFitness || ''),
    trafficPenaltyWeek: String(d.trafficPenaltyWeek || ''),
    badgeNo: String(d.badgeNo || ''),
    active: d.active !== false,
    deactivateReason: String(d.deactivateReason || ''),
    remarks: String(d.remarks || ''),
    createdAt: String(d.createdAt || new Date().toISOString()),
  }
}

export function normalizeUser(u: Partial<FleetUser> & { id?: string }): FleetUser {
  const rawType = String(u.userType || '')
  let userType: FleetUserType =
    rawType === 'director' || rawType === 'admin' || rawType === 'hod' || rawType === 'staff'
      ? (rawType as FleetUserType)
      : u.role === 'admin'
        ? 'admin'
        : 'hod'
  const role: FleetUserRole = userType === 'director' || userType === 'admin' ? 'admin' : 'branch'
  return {
    id: String(u.id || fleetNid('us')),
    name: String(u.name || ''),
    email: String(u.email || ''),
    mobile: String(u.mobile || ''),
    role,
    userType,
    branchId: role === 'branch' ? String(u.branchId || '') : '',
    password: String(u.password || ''),
    active: u.active !== false,
    deactivateReason: String(u.deactivateReason || ''),
    remarks: String(u.remarks || ''),
    createdAt: String(u.createdAt || new Date().toISOString()),
  }
}

export function defaultSeedUsers(): FleetUser[] {
  const now = new Date().toISOString()
  return [
    normalizeUser({
      name: 'Fleet Administrator',
      email: 'director@agilegroup.co.in',
      mobile: '',
      role: 'admin',
      userType: 'director',
      branchId: '',
      password: fleetAdminPassword(),
      active: true,
      deactivateReason: '',
      remarks: 'Default management login',
      createdAt: now,
    }),
  ]
}

/** Branch driver pool — from Corporate Office Week-05 report (reference data). */
export function defaultSeedDrivers(): FleetDriver[] {
  const branch = 'Corporate Office'
  const now = new Date().toISOString()
  const rows = [
    { name: 'T.Somnath', mobile: '9704105158', licenseNo: 'TS13420180001128', licenseValid: '2038-04-11' },
    { name: 'G.Kondal Rao', mobile: '9908323907', licenseNo: 'TS11520040001622', licenseValid: '2035-10-15' },
    { name: 'Mohd Afzaluddin', mobile: '8639726856', licenseNo: 'AP01320120013772', licenseValid: '2032-11-20' },
    { name: 'B.Venkatesh Goud', mobile: '9703568305', licenseNo: 'AP00920130020183', licenseValid: '2033-09-10' },
    { name: 'A. Mahender Reddy', mobile: '9030729238', licenseNo: 'AP036182882008', licenseValid: '2026-07-05' },
    { name: 'Taiseen Ali', mobile: '9542867866', licenseNo: 'NT892271998', licenseValid: '2034-03-20' },
    { name: 'S.Shravan Kumar', mobile: '9908033927', licenseNo: 'AP009348602006', licenseValid: '2026-09-15' },
  ]
  return rows.map((r) =>
    normalizeDriver({ branchId: branch, ...r, licenseType: 'LMV', badgeNo: '', active: true, deactivateReason: '', remarks: '', createdAt: now }),
  )
}

/** Seed Corporate Office vehicles from imported Week-05 data (safeguarded copy). */
export function defaultSeedVehicles(): FleetVehicle[] {
  const branch = 'Corporate Office'
  const now = new Date().toISOString()
  const rows: Omit<FleetVehicle, 'id' | 'createdAt'>[] = [
    { branchId: branch, vehicleName: 'Scorpio N', regNo: 'TG09G1357', chassisNo: '', engineNo: '', vehicleType: '4-Wheeler', makeModel: 'Scorpio N', fuelType: 'Diesel', driverName: 'T.Somnath', driverMobile: '9704105158', licenseNo: 'TS13420180001128', licenseValid: '2038-04-11', insuranceValid: '2027-03-15', insurancePolicyNo: '', insuranceCompany: '', insuranceClaim: '', pucValid: '2026-10-01', lastServiceDate: '', nextServiceDue: '', lastOdoReading: '35714', majorAccident: '', deactivateReason: '', active: true, remarks: 'Vehicle at the Academy' },
    { branchId: branch, vehicleName: 'Harrier EV', regNo: 'TG09BA1235', chassisNo: '', engineNo: '', vehicleType: 'EV', makeModel: 'Harrier EV', fuelType: 'Electric', driverName: 'G.Kondal Rao', driverMobile: '9908323907', licenseNo: 'TS11520040001622', licenseValid: '2035-10-15', insuranceValid: '2027-03-14', insurancePolicyNo: '', insuranceCompany: '', insuranceClaim: '', pucValid: '', lastServiceDate: '', nextServiceDue: '', lastOdoReading: '4651', majorAccident: '', deactivateReason: '', active: true, remarks: 'Electric — charged on need basis' },
    { branchId: branch, vehicleName: 'Fortuner', regNo: 'MH02FR3579', chassisNo: '', engineNo: '', vehicleType: '4-Wheeler', makeModel: 'Fortuner', fuelType: 'Diesel', driverName: 'Mohd Afzaluddin', driverMobile: '8639726856', licenseNo: 'AP01320120013772', licenseValid: '2032-11-20', insuranceValid: '2026-12-31', insurancePolicyNo: '', insuranceCompany: '', insuranceClaim: '', pucValid: '2027-05-15', lastServiceDate: '', nextServiceDue: '', lastOdoReading: '', majorAccident: '', deactivateReason: '', active: true, remarks: 'Currently with Lokesh Saxena Sir' },
    { branchId: branch, vehicleName: 'Harrier EV', regNo: 'TG09BA1236', chassisNo: '', engineNo: '', vehicleType: 'EV', makeModel: 'Harrier EV', fuelType: 'Electric', driverName: 'B.Venkatesh Goud', driverMobile: '9703568305', licenseNo: 'AP00920130020183', licenseValid: '2033-09-10', insuranceValid: '2027-03-14', insurancePolicyNo: '', insuranceCompany: '', insuranceClaim: '', pucValid: '', lastServiceDate: '', nextServiceDue: '', lastOdoReading: '6677', majorAccident: '', deactivateReason: '', active: true, remarks: '' },
    { branchId: branch, vehicleName: 'Scorpio', regNo: 'TS09FX1235', chassisNo: '', engineNo: '', vehicleType: '4-Wheeler', makeModel: 'Scorpio', fuelType: 'Diesel', driverName: 'A. Mahender Reddy', driverMobile: '9030729238', licenseNo: 'AP036182882008', licenseValid: '2026-07-05', insuranceValid: '2027-03-25', insurancePolicyNo: '', insuranceCompany: '', insuranceClaim: '', pucValid: '2026-10-01', lastServiceDate: '', nextServiceDue: '', lastOdoReading: '122200', majorAccident: '', deactivateReason: '', active: true, remarks: '' },
    { branchId: branch, vehicleName: 'Ertiga', regNo: 'TS02FD1234', chassisNo: '', engineNo: '', vehicleType: '4-Wheeler', makeModel: 'Ertiga', fuelType: 'Petrol', driverName: 'Taiseen Ali', driverMobile: '9542867866', licenseNo: 'NT892271998', licenseValid: '2034-03-20', insuranceValid: '2026-12-21', insurancePolicyNo: '', insuranceCompany: '', insuranceClaim: '', pucValid: '2026-09-29', lastServiceDate: '', nextServiceDue: '', lastOdoReading: '95456', majorAccident: '', deactivateReason: '', active: true, remarks: '' },
    { branchId: branch, vehicleName: 'Fortuner', regNo: 'TS08GB1234', chassisNo: '', engineNo: '', vehicleType: '4-Wheeler', makeModel: 'Fortuner', fuelType: 'Diesel', driverName: 'S.Shravan Kumar', driverMobile: '9908033927', licenseNo: 'AP009348602006', licenseValid: '2026-09-15', insuranceValid: '2027-03-18', insurancePolicyNo: '', insuranceCompany: '', insuranceClaim: 'Pending — Kurnool accident', pucValid: '2026-10-01', lastServiceDate: '', nextServiceDue: '', lastOdoReading: '198426', majorAccident: 'Accident in Kurnool — at workshop (Jul 2026)', deactivateReason: '', active: true, remarks: 'At workshop after Kurnool accident' },
  ]
  return rows.map((r) => normalizeVehicle({ ...r, createdAt: now }))
}
