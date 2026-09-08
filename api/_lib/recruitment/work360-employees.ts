/**
 * Work360 employee directory — names + mobiles keyed by employee id.
 * Attendance exports often only have employee codes; this fills the gaps.
 */
import { mapSheetRows, sheetRows } from '../mis/work360-excel.js'
import { work360FetchBlob, work360FetchJson, type Work360Config } from '../mis/work360-client.js'

export type Work360Employee = {
  employeeId: string
  guardName: string
  mobile: string
}

const EMP_MAP: Record<string, string> = {
  employeeid: 'employeeId',
  empid: 'employeeId',
  empcode: 'employeeId',
  employeecode: 'employeeId',
  employeeno: 'employeeId',
  employeenumber: 'employeeId',
  biometricid: 'employeeId',
  userid: 'employeeId',
  id: 'employeeId',
  employee: 'employeeId',
  employeename: 'guardName',
  guardname: 'guardName',
  staffname: 'guardName',
  personname: 'guardName',
  username: 'guardName',
  name: 'guardName',
  firstname: 'firstName',
  lastname: 'lastName',
  mobile: 'mobile',
  mobileno: 'mobile',
  mobilenumber: 'mobile',
  phoneno: 'mobile',
  phone: 'mobile',
  contact: 'mobile',
  contactno: 'mobile',
  contactnumber: 'mobile',
  whatsapp: 'mobile',
}

function digMobile(raw: string): string {
  const d = String(raw ?? '').replace(/\D/g, '')
  if (d.length >= 10) return d.slice(-10)
  return d
}

function looksLikeEmpId(s: string): boolean {
  const t = String(s ?? '').trim()
  if (!t) return false
  if (/^\d{6,}$/.test(t)) return true
  if (/^[A-Z]{0,3}\d{6,}$/i.test(t)) return true
  return false
}

function fromRow(row: Record<string, string>): Work360Employee | null {
  let employeeId = String(row.employeeId || '').trim()
  let guardName = String(row.guardName || '').trim()
  const first = String(row.firstName || '').trim()
  const last = String(row.lastName || '').trim()
  if (!guardName && (first || last)) guardName = `${first} ${last}`.trim()
  if (looksLikeEmpId(guardName) && !employeeId) {
    employeeId = guardName
    guardName = ''
  }
  if (looksLikeEmpId(guardName) && employeeId && guardName === employeeId) {
    guardName = ''
  }
  const mobile = digMobile(row.mobile || '')
  if (!employeeId && !guardName) return null
  if (!employeeId && looksLikeEmpId(guardName)) {
    employeeId = guardName
    guardName = ''
  }
  return {
    employeeId: employeeId.slice(0, 40),
    guardName: guardName.slice(0, 120),
    mobile: mobile.slice(0, 20),
  }
}

const REPORT_PATHS = [
  '/v1/reports/employeereportblob',
  '/v1/reports/employeesblob',
  '/v1/reports/employeemasterblob',
  '/v1/reports/userreportblob',
  '/v1/reports/staffreportblob',
]

function ingestEmployees(buf: ArrayBuffer, into: Map<string, Work360Employee>) {
  if (!buf.byteLength) return 0
  const rows = mapSheetRows(sheetRows(buf), EMP_MAP, 2)
  let n = 0
  for (const row of rows) {
    const emp = fromRow(row)
    if (!emp?.employeeId) continue
    const prev = into.get(emp.employeeId)
    into.set(emp.employeeId, {
      employeeId: emp.employeeId,
      guardName: emp.guardName || prev?.guardName || '',
      mobile: emp.mobile || prev?.mobile || '',
    })
    n++
  }
  return n
}

function fromJsonList(data: unknown, into: Map<string, Work360Employee>): number {
  const list = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { data?: unknown[] }).data)
      ? (data as { data: unknown[] }).data
      : []
  let n = 0
  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue
    const o = raw as Record<string, unknown>
    const emp = fromRow({
      employeeId: String(o.employeeId ?? o.empId ?? o.empCode ?? o.employeeCode ?? o.id ?? ''),
      guardName: String(o.employeeName ?? o.name ?? o.userName ?? o.guardName ?? ''),
      firstName: String(o.firstName ?? ''),
      lastName: String(o.lastName ?? ''),
      mobile: String(o.mobile ?? o.mobileNo ?? o.phone ?? o.contactNo ?? ''),
    })
    if (!emp?.employeeId) continue
    const prev = into.get(emp.employeeId)
    into.set(emp.employeeId, {
      employeeId: emp.employeeId,
      guardName: emp.guardName || prev?.guardName || '',
      mobile: emp.mobile || prev?.mobile || '',
    })
    n++
  }
  return n
}

/** Build employeeId → name/mobile map (best effort; empty map if Work360 has no directory export). */
export async function loadWork360EmployeeDirectory(
  cfg: Work360Config,
  clientIds: string[],
): Promise<Map<string, Work360Employee>> {
  const into = new Map<string, Work360Employee>()

  for (const path of ['/v1/employees', '/v1/users', '/v1/staff']) {
    try {
      const data = await work360FetchJson<unknown>(cfg, path)
      fromJsonList(data, into)
      if (into.size >= 20) return into
    } catch {
      /* try next */
    }
  }

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  for (const clientId of clientIds.slice(0, 6)) {
    for (const path of REPORT_PATHS) {
      try {
        const buf = await work360FetchBlob(cfg, path, {
          clientId,
          unitId: '-1',
          userId: '-1',
          fromDateStr: today,
          toDateStr: today,
        })
        ingestEmployees(buf, into)
        if (into.size >= 50) return into
      } catch {
        /* try next */
      }
    }
    if (into.size >= 50) break
  }

  return into
}

export function enrichMarkFromDirectory(
  mark: { employeeId: string; guardName: string; mobile: string },
  dir: Map<string, Work360Employee>,
): { employeeId: string; guardName: string; mobile: string } {
  let employeeId = String(mark.employeeId || '').trim()
  let guardName = String(mark.guardName || '').trim()
  let mobile = digMobile(mark.mobile || '')

  if (looksLikeEmpId(guardName) && !employeeId) {
    employeeId = guardName
    guardName = ''
  }
  if (looksLikeEmpId(guardName) && employeeId) {
    guardName = ''
  }

  const hit = employeeId ? dir.get(employeeId) : undefined
  if (hit) {
    if (!guardName || looksLikeEmpId(guardName)) guardName = hit.guardName || guardName
    if (!mobile) mobile = digMobile(hit.mobile)
  }

  if (!guardName && employeeId) guardName = '' // keep empty — UI shows ID line
  return { employeeId, guardName, mobile }
}

export { looksLikeEmpId, digMobile }
