import { nid, saveDutyIncidents, type MisDutyIncident } from './store.js'
import type { SyncVisitsResult } from './visit-sync-types.js'
import { cellStr, inferDutyField, mapSheetRows, normHeader, sheetRows } from './work360-excel.js'
import {
  formatKmLabel,
  formatTimeLabel,
  looksLikeEmployeeCode,
  parseWork360Distance,
} from './work360-km.js'
import { loadWork360EmployeeDirectory, type Work360Employee } from '../recruitment/work360-employees.js'
import { dutyMobileDigits } from './duty-contact.js'
import {
  isoToWork360Date,
  work360Config,
  work360DateParams,
  work360FetchBlob,
  work360FetchJson,
  work360ListClients,
  type Work360Config,
} from './work360-client.js'

const OUT_OF_WORK_MAP: Record<string, string> = {
  employee: 'employeeId',
  employeename: 'guardName',
  guardname: 'guardName',
  username: 'guardName',
  user: 'guardName',
  staff: 'guardName',
  staffname: 'guardName',
  employeeid: 'employeeId',
  empid: 'employeeId',
  client: 'client',
  clientname: 'client',
  unit: 'unit',
  unitname: 'unit',
  location: 'unit',
  site: 'unit',
  sitename: 'unit',
  time: 'incidentTime',
  timestamp: 'incidentTime',
  datetime: 'incidentTime',
  outtime: 'incidentTime',
  incidenttime: 'incidentTime',
  violationtime: 'incidentTime',
  detectedtime: 'incidentTime',
  remarks: 'remarks',
  reason: 'remarks',
  comment: 'remarks',
  distance: 'kmFromPost',
  distancefrompost: 'kmFromPost',
  distancefromlocation: 'kmFromPost',
  distancefromsite: 'kmFromPost',
  awayfrompost: 'kmFromPost',
  outoflocationdistance: 'kmFromPost',
  outdistance: 'kmFromPost',
  locationdistance: 'kmFromPost',
  geofencedistance: 'kmFromPost',
  geofenceviolationdistance: 'kmFromPost',
  deviationdistance: 'kmFromPost',
  km: 'kmFromPost',
  kilometers: 'kmFromPost',
  kilometres: 'kmFromPost',
  meters: 'kmFromPost',
  metres: 'kmFromPost',
  distanceinmeters: 'kmFromPost',
  distanceinmetres: 'kmFromPost',
  postname: 'unit',
  shiftname: 'shift',
  latereportingtime: 'dutyStartTime',
  latetime: 'dutyStartTime',
  /** Out-of-work report: From/To = left post / returned — not shift schedule */
  fromtime: 'leftAt',
  totime: 'returnedAt',
  totalmissinghours: 'missingHours',
  leftnotreturned: 'statusRaw',
  leftpost: 'statusRaw',
  mobile: 'mobile',
  mobileno: 'mobile',
  mobilenumber: 'mobile',
  phone: 'mobile',
  phoneno: 'mobile',
  contact: 'mobile',
  contactno: 'mobile',
  whatsapp: 'mobile',
}

const ATTENDANCE_MAP: Record<string, string> = {
  employee: 'employeeId',
  employeename: 'guardName',
  guardname: 'guardName',
  username: 'guardName',
  user: 'guardName',
  staffname: 'guardName',
  employeeid: 'employeeId',
  empid: 'employeeId',
  client: 'client',
  clientname: 'client',
  unit: 'unit',
  unitname: 'unit',
  site: 'unit',
  sitename: 'unit',
  date: 'markDate',
  attendance: 'statusRaw',
  status: 'statusRaw',
  dailystatus: 'statusRaw',
  punchstatus: 'statusRaw',
  attendancestatus: 'statusRaw',
  actualstarttime: 'dutyStartTime',
  actualintime: 'dutyStartTime',
  intimeactual: 'dutyStartTime',
  actualtime: 'dutyStartTime',
  actualpunchtime: 'dutyStartTime',
  actualcheckintime: 'dutyStartTime',
  starttime: 'dutyStartTime',
  intime: 'dutyStartTime',
  punchintime: 'dutyStartTime',
  checkintime: 'dutyStartTime',
  punchtime: 'dutyStartTime',
  dutyintime: 'dutyStartTime',
  reporttime: 'dutyStartTime',
  reportingtime: 'dutyStartTime',
  scheduledtime: 'scheduledTime',
  scheduledintime: 'scheduledTime',
  shifttime: 'scheduledTime',
  shiftstarttime: 'scheduledTime',
  shiftstart: 'scheduledTime',
  expectedtime: 'scheduledTime',
  expectedintime: 'scheduledTime',
  dutytime: 'scheduledTime',
  rosteredtime: 'scheduledTime',
  rosterintime: 'scheduledTime',
  plannedtime: 'scheduledTime',
  time: 'incidentTime',
  timestamp: 'incidentTime',
  datetime: 'incidentTime',
  lateby: 'remarks',
  latebytime: 'remarks',
  delay: 'remarks',
  remarks: 'remarks',
  distance: 'kmFromPost',
  distancefrompost: 'kmFromPost',
  distancefromlocation: 'kmFromPost',
  km: 'kmFromPost',
  kilometers: 'kmFromPost',
  mobile: 'mobile',
  mobileno: 'mobile',
  mobilenumber: 'mobile',
  phone: 'mobile',
  phoneno: 'mobile',
  contact: 'mobile',
  contactno: 'mobile',
  whatsapp: 'mobile',
}

function looksLikeEmpId(s: string): boolean {
  const t = s.trim()
  return /^[A-Z0-9]{6,}$/i.test(t) && /\d/.test(t)
}

function classifyOutOfWorkRow(raw: Record<string, string>): Array<'late_start' | 'out_of_post'> {
  const types: Array<'late_start' | 'out_of_post'> = []
  const left = String(raw.statusRaw || '').toLowerCase()
  const lateTime = pickTime(raw.dutyStartTime, raw.incidentTime)
  if (lateTime) types.push('late_start')
  if (/left|not.?returned|not returned|away|out.?of/.test(left)) types.push('out_of_post')
  return types
}

function classifyStatus(raw: string): 'late_start' | 'out_of_post' | 'absent' | '' {
  const t = raw.toLowerCase()
  if (!t) return ''
  if (/late|delay|tardy|ls\b|after.?time|check.?in.?late|started.?late/.test(t)) return 'late_start'
  if (/out.?of|left.?post|away|geo|location|absent.*post|oop\b|outside.?post/.test(t)) return 'out_of_post'
  if (/absent|abscond|missing|no.?show|not.?present/.test(t)) return 'absent'
  return ''
}

function pickTime(...vals: (string | undefined)[]): string {
  for (const v of vals) {
    if (!v || /^n\/a$|^invalid$/i.test(String(v).trim())) continue
    const t = formatTimeLabel(v)
    if (t && /\d{1,2}:\d{2}/.test(t) && !/^n\/a$/i.test(t)) return t
  }
  return ''
}

function scanRecordTimes(raw: Record<string, string>): { duty: string; scheduled: string; incident: string } {
  let duty = pickTime(raw.dutyStartTime)
  let scheduled = pickTime(raw.scheduledTime)
  let incident = pickTime(raw.incidentTime)
  for (const [key, val] of Object.entries(raw)) {
    if (!val || key === 'statusRaw' || key === 'remarks' || key === 'markDate') continue
    const t = formatTimeLabel(val)
    if (!/\d{1,2}:\d{2}/.test(t)) continue
    const k = key.toLowerCase()
    if (/scheduled|shift|expected|roster|planned|dutytime/.test(k)) {
      if (!scheduled) scheduled = t
    } else if (/actual|intime|punch|checkin|start|report/.test(k)) {
      if (!duty) duty = t
    } else if (!incident) {
      incident = t
    }
  }
  return { duty, scheduled, incident }
}

function kmFromRaw(raw: Record<string, string>): string {
  if (raw.kmFromPost) {
    const km = parseWork360Distance(raw.kmFromPost)
    if (km) return km
  }
  const m = String(raw.remarks || '').match(/([\d.]+)\s*(km|m(?:eters?|etres?)?)/i)
  if (m) {
    const unit = m[2].toLowerCase()
    const assumeMeters = unit.startsWith('m') && unit !== 'km'
    return formatKmLabel(m[1], assumeMeters)
  }
  return ''
}

/** Work360 out-of-work export has no distance — show Left / Not Returned + away duration. */
function leftPostDetail(raw: Record<string, string>): string {
  const km = kmFromRaw(raw)
  if (km) return km
  const status = String(raw.statusRaw || '').trim()
  const missing = String(raw.missingHours || '').trim()
  const back = pickTime(raw.returnedAt)
  const parts: string[] = []
  if (/not.?returned/i.test(status)) parts.push('Not Returned')
  else if (/^left$/i.test(status)) parts.push('Left')
  else if (status) parts.push(status)
  if (missing && !/^n\/a$|^invalid$/i.test(missing)) parts.push(`away ${missing}`)
  if (back && /left/i.test(status)) parts.push(`back ${back}`)
  return parts.join(' · ')
}

function resolveGuardName(raw: Record<string, string>, directory?: Map<string, Work360Employee>): string {
  let name = String(raw.guardName || '').trim()
  let empId = String(raw.employeeId || '').trim()
  if (name && looksLikeEmployeeCode(name)) {
    if (!empId) empId = name
    name = ''
  }
  if (directory && empId) {
    const hit = directory.get(empId)
    if (hit?.guardName) name = hit.guardName
  }
  if (name && looksLikeEmpId(name) && empId && !looksLikeEmpId(empId)) return empId
  if (!name && empId && directory?.get(empId)?.guardName) return directory.get(empId)!.guardName
  if (!name && empId) return empId
  if (name && looksLikeEmpId(name)) return name
  return name
}

function resolveMobile(raw: Record<string, string>, directory?: Map<string, Work360Employee>): string {
  const fromRow = dutyMobileDigits(raw.mobile || '')
  if (fromRow) return fromRow
  let empId = String(raw.employeeId || '').trim()
  const name = String(raw.guardName || '').trim()
  if (!empId && looksLikeEmployeeCode(name)) empId = name
  if (directory && empId) {
    const hit = directory.get(empId)
    const fromDir = dutyMobileDigits(hit?.mobile || '')
    if (fromDir) return fromDir
  }
  return ''
}

function toIncident(
  date: string,
  type: MisDutyIncident['type'],
  raw: Record<string, string>,
  directory?: Map<string, Work360Employee>,
): MisDutyIncident | null {
  const guardName = resolveGuardName(raw, directory)
  if (!guardName) return null
  const times = scanRecordTimes(raw)
  const dutyStartTime = pickTime(raw.dutyStartTime) || times.duty
  const leftAt = pickTime(raw.leftAt, raw.incidentTime)
  const returnedAt = pickTime(raw.returnedAt)
  const missing = String(raw.missingHours || '').trim()
  const status = String(raw.statusRaw || '').trim()
  const mobile = resolveMobile(raw, directory)

  if (type === 'late_start') {
    const start = dutyStartTime || times.incident
    if (!start) return null
    return {
      id: nid('di'),
      date,
      guardName: guardName.slice(0, 120),
      employeeId: String(raw.employeeId || '').slice(0, 40),
      mobile: mobile || undefined,
      client: (raw.client || '').slice(0, 120),
      unit: (raw.unit || '').slice(0, 120),
      shift: (raw.shift || '').slice(0, 20),
      incidentTime: start,
      type,
      remarks: [status, missing && !/^n\/a$|^invalid$/i.test(missing) ? `missing ${missing}` : '']
        .filter(Boolean)
        .join(' · ')
        .slice(0, 300),
      dutyStartTime: start,
      scheduledTime: pickTime(raw.scheduledTime) || times.scheduled || undefined,
      fromMobile: true,
    }
  }

  // out_of_post — Work360 out-of-work report has leave/return times, not kilometres
  const incidentTime = leftAt || returnedAt || times.incident
  const detail = leftPostDetail(raw)
  const remarkParts = [
    status,
    missing && !/^n\/a$|^invalid$/i.test(missing) ? `missing ${missing}` : '',
    returnedAt ? `returned ${returnedAt}` : '',
    raw.remarks,
  ].filter(Boolean)
  return {
    id: nid('di'),
    date,
    guardName: guardName.slice(0, 120),
    employeeId: String(raw.employeeId || '').slice(0, 40),
    mobile: mobile || undefined,
    client: (raw.client || '').slice(0, 120),
    unit: (raw.unit || '').slice(0, 120),
    shift: (raw.shift || '').slice(0, 20),
    incidentTime,
    type,
    remarks: remarkParts.join(' · ').slice(0, 300),
    kmFromPost: detail || undefined,
    fromMobile: true,
  }
}

function baseIncidentKey(i: MisDutyIncident): string {
  return `${i.guardName}|${i.type}|${i.client}|${i.unit}`.toLowerCase()
}

function incidentKey(i: MisDutyIncident): string {
  const t = i.dutyStartTime || i.incidentTime || ''
  return t ? `${baseIncidentKey(i)}|${t}` : baseIncidentKey(i)
}

function findExistingIndex(inc: MisDutyIncident, incidents: MisDutyIncident[]): number {
  const incTime = inc.dutyStartTime || inc.incidentTime || ''
  const incGuard = inc.guardName.toLowerCase()
  for (let i = 0; i < incidents.length; i++) {
    const ex = incidents[i]
    if (ex.type !== inc.type || ex.guardName.toLowerCase() !== incGuard) continue
    if (inc.client && ex.client && inc.client.toLowerCase() !== ex.client.toLowerCase()) continue
    if (inc.unit && ex.unit && inc.unit.toLowerCase() !== ex.unit.toLowerCase()) continue
    const exTime = ex.dutyStartTime || ex.incidentTime || ''
    if (!exTime || !incTime || exTime === incTime) return i
  }
  return -1
}

async function clientIdsForDay(cfg: Work360Config): Promise<string[]> {
  const clients = await work360ListClients(cfg)
  const ids = clients
    .map((c) => String(c.id ?? '').trim())
    .filter((id) => id && id !== '-1' && id !== '0')
  if (!ids.length && cfg.tenantId) ids.push(cfg.tenantId)
  return ids.slice(0, 20)
}

type DateFmt = Record<string, string>

function dateFormats(date: string): DateFmt[] {
  const iso = work360DateParams(date)
  const dmy = { fromDateStr: isoToWork360Date(date), toDateStr: isoToWork360Date(date) }
  return iso.fromDateStr === dmy.fromDateStr ? [iso] : [iso, dmy]
}

async function fetchDutyBlob(
  cfg: Work360Config,
  path: string,
  clientId: string,
  fmt: DateFmt,
  extra: Record<string, string> = {},
): Promise<ArrayBuffer> {
  return work360FetchBlob(cfg, path, {
    ...fmt,
    clientId,
    unitId: '-1',
    userId: '-1',
    dailyStatusExport: 'true',
    ...extra,
  })
}

function mergeIncident(existing: MisDutyIncident, incoming: MisDutyIncident): MisDutyIncident {
  return {
    ...existing,
    employeeId: existing.employeeId || incoming.employeeId,
    mobile: existing.mobile || incoming.mobile,
    client: existing.client || incoming.client,
    unit: existing.unit || incoming.unit,
    shift: existing.shift || incoming.shift,
    incidentTime: existing.incidentTime || incoming.incidentTime,
    remarks: existing.remarks || incoming.remarks,
    dutyStartTime: existing.dutyStartTime || incoming.dutyStartTime,
    scheduledTime: existing.scheduledTime || incoming.scheduledTime,
    kmFromPost: existing.kmFromPost || incoming.kmFromPost,
  }
}

function ingestRows(
  date: string,
  rows: Record<string, string>[],
  type: MisDutyIncident['type'] | 'auto' | 'out_of_work_report',
  seen: Map<string, number>,
  incidents: MisDutyIncident[],
  directory?: Map<string, Work360Employee>,
) {
  for (const row of rows) {
    let types: Array<'late_start' | 'out_of_post'> = []
    if (type === 'out_of_work_report') {
      types = classifyOutOfWorkRow(row)
    } else if (type === 'auto') {
      const resolved = classifyStatus(row.statusRaw || row.remarks || '')
      if (resolved === 'late_start' || resolved === 'out_of_post') types = [resolved]
    } else {
      types = [type]
    }
    for (const resolvedType of types) {
      const inc = toIncident(date, resolvedType, row, directory)
      if (!inc) continue
      const k = incidentKey(inc)
      const existingIdx = findExistingIndex(inc, incidents)
      if (existingIdx >= 0) {
        incidents[existingIdx] = mergeIncident(incidents[existingIdx], inc)
        seen.set(incidentKey(incidents[existingIdx]), existingIdx)
        continue
      }
      seen.set(k, incidents.length)
      incidents.push(inc)
    }
  }
}

function mapDutyBlob(buf: ArrayBuffer, map: Record<string, string>): Record<string, string>[] {
  const rows = sheetRows(buf)
  return mapSheetRows(rows, map, 1)
}

type JsonDutyRow = Record<string, unknown>

function unwrapJsonRows(data: unknown): JsonDutyRow[] {
  if (Array.isArray(data)) return data.filter((x) => x && typeof x === 'object') as JsonDutyRow[]
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    for (const k of ['content', 'data', 'items', 'records', 'list', 'rows']) {
      const arr = o[k]
      if (Array.isArray(arr)) return arr.filter((x) => x && typeof x === 'object') as JsonDutyRow[]
    }
  }
  return []
}

function pickJson(row: JsonDutyRow, keys: string[]): string {
  for (const k of keys) {
    const v = row[k]
    if (v != null && String(v).trim()) return String(v).trim()
  }
  return ''
}

function jsonRowToRecord(row: JsonDutyRow): Record<string, string> {
  const rec: Record<string, string> = {
    guardName: pickJson(row, [
      'employeeName',
      'employeename',
      'guardName',
      'userName',
      'user',
      'employee',
      'staffName',
      'name',
    ]),
    employeeId: pickJson(row, ['employeeId', 'empId', 'employeeCode', 'biometricId']),
    mobile: pickJson(row, [
      'mobile',
      'mobileNo',
      'mobileNumber',
      'phone',
      'phoneNo',
      'contact',
      'contactNo',
      'whatsapp',
    ]),
    client: pickJson(row, ['client', 'clientName', 'company']),
    unit: pickJson(row, ['unit', 'unitName', 'site', 'location', 'siteName']),
    dutyStartTime: pickJson(row, [
      'actualStartTime',
      'actualInTime',
      'actualTime',
      'inTime',
      'inTimeActual',
      'punchInTime',
      'checkInTime',
      'startTime',
      'reportTime',
      'reportingTime',
      'dutyInTime',
      'punchTime',
    ]),
    scheduledTime: pickJson(row, [
      'scheduledTime',
      'scheduledInTime',
      'shiftTime',
      'shiftStartTime',
      'expectedTime',
      'expectedInTime',
      'dutyTime',
      'rosterTime',
      'rosterInTime',
      'plannedTime',
      'shiftStart',
    ]),
    incidentTime: pickJson(row, ['time', 'timestamp', 'dateTime', 'outTime', 'violationTime', 'eventTime']),
    kmFromPost: pickJson(row, [
      'distance',
      'distanceFromPost',
      'distanceFromLocation',
      'distanceFromSite',
      'kmFromPost',
      'geoFenceDistance',
      'outOfLocationDistance',
      'deviationDistance',
      'awayFromPostDistance',
      'distanceInMeters',
      'distanceInMetres',
      'distanceInMeter',
      'meters',
      'metres',
      'meter',
    ]),
    statusRaw: pickJson(row, ['status', 'attendance', 'dailyStatus', 'punchStatus', 'attendanceStatus']),
    remarks: pickJson(row, ['remarks', 'reason', 'comment', 'lateBy', 'lateByTime', 'delay']),
  }
  for (const [key, val] of Object.entries(row)) {
    if (val == null) continue
    const field =
      inferDutyField(key) ||
      OUT_OF_WORK_MAP[normHeader(key)] ||
      ATTENDANCE_MAP[normHeader(key)]
    if (!field || rec[field]) continue
    const s = cellStr(val)
    if (s) rec[field] = s
  }
  return rec
}

async function fetchDutyJson(
  cfg: Work360Config,
  paths: string[],
  clientId: string,
  fmt: DateFmt,
): Promise<Record<string, string>[]> {
  const out: Record<string, string>[] = []
  for (const path of paths) {
    try {
      const data = await work360FetchJson<unknown>(cfg, path, {
        ...fmt,
        clientId,
        unitId: '-1',
        userId: '-1',
        pageNumber: '1',
        pageSize: '500',
        dailyStatusExport: 'true',
      })
      for (const row of unwrapJsonRows(data)) {
        const rec = jsonRowToRecord(row)
        if (rec.guardName || rec.employeeId) out.push(rec)
      }
      if (out.length) return out
    } catch {
      /* try next */
    }
  }
  return out
}

export type DutySyncResult = SyncVisitsResult & {
  sample?: Array<{
    type: string
    guardName: string
    dutyStartTime?: string
    scheduledTime?: string
    kmFromPost?: string
    incidentTime: string
  }>
}

/** One calendar day only — same from/to date in ISO (YYYY-MM-DD), per client like Report Portal. */
export async function syncWork360DutyIncidents(date: string): Promise<DutySyncResult> {
  const cfg = work360Config()
  if (!cfg) {
    return { ok: true, date, fetched: 0, saved: 0, skipped: true, error: 'Work360 not configured' }
  }

  const seen = new Map<string, number>()
  const incidents: MisDutyIncident[] = []

  try {
    const clientIds = await clientIdsForDay(cfg)
    const fmts = dateFormats(date)
    const directory = await loadWork360EmployeeDirectory(cfg, clientIds)

    for (const clientId of clientIds) {
      for (const fmt of fmts) {
        const lateEndpoints = [
          '/v1/reports/lateattendancereportblob',
          '/v1/reports/latecheckinreportblob',
        ]
        for (const path of lateEndpoints) {
          try {
            const lateBuf = await fetchDutyBlob(cfg, path, clientId, fmt)
            if (!lateBuf.byteLength) continue
            ingestRows(date, mapDutyBlob(lateBuf, ATTENDANCE_MAP), 'late_start', seen, incidents, directory)
          } catch {
            /* try next endpoint */
          }
        }

        const outEndpoints = [
          '/v1/reports/outofworkreportblob',
          '/v1/reports/outoflocationreportblob',
          '/v1/reports/geofenceviolationreportblob',
        ]
        for (const path of outEndpoints) {
          try {
            const outBuf = await fetchDutyBlob(cfg, path, clientId, fmt)
            if (!outBuf.byteLength) continue
            ingestRows(date, mapDutyBlob(outBuf, OUT_OF_WORK_MAP), 'out_of_work_report', seen, incidents, directory)
          } catch {
            /* try next endpoint */
          }
        }

        try {
          const attBuf = await fetchDutyBlob(cfg, '/v1/reports/attendanceindividualblob', clientId, fmt, {
            isAttendanceExport: 'true',
          })
          if (attBuf.byteLength) {
            ingestRows(date, mapDutyBlob(attBuf, ATTENDANCE_MAP), 'auto', seen, incidents, directory)
          }
        } catch {
          /* try next format */
        }

        const lateJson = await fetchDutyJson(
          cfg,
          ['/v1/lateattendance', '/v1/lateattendances', '/v1/latecheckin', '/v1/lateattendanceread'],
          clientId,
          fmt,
        )
        ingestRows(date, lateJson, 'late_start', seen, incidents, directory)

        const outJson = await fetchDutyJson(
          cfg,
          ['/v1/outofwork', '/v1/outoflocation', '/v1/geofenceviolations', '/v1/outofworkread'],
          clientId,
          fmt,
        )
        ingestRows(date, outJson, 'out_of_post', seen, incidents, directory)
      }
    }

    if (!incidents.length) {
      return {
        ok: true,
        date,
        fetched: 0,
        saved: 0,
        skipped: true,
        error: `No late start / left post rows for ${date}`,
      }
    }

    const ok = await saveDutyIncidents(date, incidents)
    const lateSample = incidents.find((i) => i.type === 'late_start')
    const outSample = incidents.find((i) => i.type === 'out_of_post')
    const sampleRows = [lateSample, outSample, ...incidents.slice(0, 3)].filter(Boolean) as MisDutyIncident[]
    const sampleSeen = new Set<string>()
    const sample = sampleRows
      .filter((i) => {
        const k = `${i.type}|${i.guardName}`
        if (sampleSeen.has(k)) return false
        sampleSeen.add(k)
        return true
      })
      .slice(0, 5)
      .map((i) => ({
        type: i.type,
        guardName: i.guardName,
        dutyStartTime: i.dutyStartTime,
        scheduledTime: i.scheduledTime,
        kmFromPost: i.kmFromPost,
        incidentTime: i.incidentTime,
      }))
    return {
      ok,
      date,
      fetched: incidents.length,
      saved: incidents.length,
      counts: dutyCounts(incidents),
      sample,
      error: ok ? undefined : 'Could not save duty incidents',
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Work360 duty sync failed'
    return { ok: false, date, fetched: 0, saved: 0, error: msg }
  }
}

export function dutyCounts(incidents: MisDutyIncident[]) {
  let late = 0
  let out = 0
  for (const i of incidents) {
    if (i.type === 'late_start') late++
    else if (i.type === 'out_of_post') out++
  }
  return { late, out }
}

export function formatLateStartDisplay(inc: MisDutyIncident): string {
  const actual = inc.dutyStartTime || inc.incidentTime || ''
  const shift = inc.scheduledTime || ''
  if (actual && shift) return `${actual} (shift ${shift})`
  return actual || shift || '—'
}

export function formatLeftPostDisplay(inc: MisDutyIncident): string {
  if (inc.kmFromPost) return inc.kmFromPost
  const m = String(inc.remarks || '').match(/([\d.]+)\s*(km|m(?:eters?|etres?)?)/i)
  if (m) return parseWork360Distance(m[1])
  return '—'
}

/** Inspect Work360 export columns — used by cron job duty-headers for production debugging. */
export async function debugWork360DutyHeaders(date: string) {
  const cfg = work360Config()
  if (!cfg) return { ok: false, error: 'Work360 not configured' }

  const clientIds = await clientIdsForDay(cfg)
  const clientId = clientIds[0] || cfg.tenantId
  const fmt = dateFormats(date)[0]
  const out: Record<string, unknown> = { clientId, date }

  async function probeBlob(
    path: string,
    map: Record<string, string>,
    label: string,
    extra: Record<string, string> = {},
  ) {
    try {
      const buf = await fetchDutyBlob(cfg!, path, clientId, fmt, extra)
      if (!buf.byteLength) return { label, path, empty: true }
      const rows = sheetRows(buf)
      const headers: string[][] = []
      for (let r = 0; r < Math.min(rows.length, 4); r++) {
        const row = rows[r]
        if (!Array.isArray(row)) continue
        headers.push(row.map((c) => cellStr(c)).filter(Boolean))
      }
      const mapped = mapSheetRows(rows, map, 1)
      return {
        label,
        path,
        headerRows: headers,
        mappedCount: mapped.length,
        mappedSample: mapped.slice(0, 2),
      }
    } catch (err) {
      return { label, path, error: err instanceof Error ? err.message : 'failed' }
    }
  }

  async function probeJson(paths: string[], label: string) {
    for (const path of paths) {
      try {
        const data = await work360FetchJson<unknown>(cfg!, path, {
          ...fmt,
          clientId,
          unitId: '-1',
          userId: '-1',
          pageNumber: '1',
          pageSize: '5',
        })
        const rows = unwrapJsonRows(data)
        if (!rows.length) continue
        return {
          label,
          path,
          keys: Object.keys(rows[0]),
          rawSample: rows[0],
          mappedSample: jsonRowToRecord(rows[0]),
        }
      } catch {
        /* try next */
      }
    }
    return { label, empty: true }
  }

  out.outBlob = await probeBlob('/v1/reports/outofworkreportblob', OUT_OF_WORK_MAP, 'out-of-work')
  out.outLocBlob = await probeBlob('/v1/reports/outoflocationreportblob', OUT_OF_WORK_MAP, 'out-of-location')
  out.lateBlob = await probeBlob('/v1/reports/lateattendancereportblob', ATTENDANCE_MAP, 'late-attendance')
  out.attBlob = await probeBlob('/v1/reports/attendanceindividualblob', ATTENDANCE_MAP, 'attendance', {
    isAttendanceExport: 'true',
  })
  const altPaths = [
    '/v1/reports/geofenceviolationsblob',
    '/v1/reports/outofpostreportblob',
    '/v1/reports/locationviolationreportblob',
    '/v1/reports/outofworklocationblob',
    '/v1/reports/employeelocationreportblob',
  ]
  out.altBlobs = []
  for (const path of altPaths) {
    out.altBlobs.push(await probeBlob(path, OUT_OF_WORK_MAP, path.split('/').pop() || path))
  }
  out.outJson = await probeJson(
    ['/v1/outofwork', '/v1/outoflocation', '/v1/geofenceviolations'],
    'out-json',
  )
  out.geoBlob = await probeBlob(
    '/v1/reports/geofenceviolationreportblob',
    OUT_OF_WORK_MAP,
    'geofence',
  )
  out.lateJson = await probeJson(
    ['/v1/lateattendance', '/v1/latecheckin'],
    'late-json',
  )

  return { ok: true, ...out }
}
