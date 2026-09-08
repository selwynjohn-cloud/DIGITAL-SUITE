import { mapSheetRows, normHeader, sheetRows, cellStr } from '../mis/work360-excel.js'
import {
  isoToWork360Date,
  work360Config,
  work360FetchBlob,
  work360ListClients,
  type Work360Config,
} from '../mis/work360-client.js'
import { getAttendanceMarks, saveAttendanceMarks, type GuardAttendanceMark } from './store.js'
import {
  digMobile,
  enrichMarkFromDirectory,
  loadWork360EmployeeDirectory,
  looksLikeEmpId,
} from './work360-employees.js'

function addDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

function normaliseMarkDate(raw: string, fallback: string): string {
  const t = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10)
  const dmy = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  }
  return fallback
}

function parseStatus(raw: string): GuardAttendanceMark['status'] {
  const t = raw.toLowerCase()
  if (/present|punch|check.?in|on.?duty|^p$/.test(t)) return 'present'
  if (/late|delay/.test(t)) return 'late'
  if (/leave|holiday|off|^l$/.test(t)) return 'leave'
  if (/absent|abscond|missing|no.?show|not.?present|^a$/.test(t)) return 'absent'
  return 'unknown'
}

const ATTENDANCE_MAP: Record<string, string> = {
  employee: 'employeeId',
  employeeid: 'employeeId',
  empid: 'employeeId',
  empcode: 'employeeId',
  employeecode: 'employeeId',
  employeeno: 'employeeId',
  employeenumber: 'employeeId',
  biometricid: 'employeeId',
  userid: 'employeeId',
  employeename: 'guardName',
  guardname: 'guardName',
  staffname: 'guardName',
  personname: 'guardName',
  username: 'guardName',
  user: 'guardName',
  name: 'guardName',
  client: 'client',
  clientname: 'client',
  unit: 'unit',
  unitname: 'unit',
  site: 'unit',
  sitename: 'unit',
  location: 'unit',
  date: 'markDate',
  attendancedate: 'markDate',
  punchdate: 'markDate',
  attendance: 'statusRaw',
  status: 'statusRaw',
  dailystatus: 'statusRaw',
  punchstatus: 'statusRaw',
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

function markFromRow(
  fallbackDate: string,
  row: Record<string, string>,
  clientLabel = '',
): GuardAttendanceMark | null {
  let guardName = row.guardName || ''
  let employeeId = row.employeeId || ''
  if (looksLikeEmpId(guardName) && !employeeId) {
    employeeId = guardName
    guardName = ''
  }
  if (employeeId && !guardName && !looksLikeEmpId(employeeId)) {
    guardName = employeeId
    employeeId = ''
  }
  if (!guardName && !employeeId) return null
  const markDate = normaliseMarkDate(row.markDate || '', fallbackDate)
  return {
    employeeId: employeeId.slice(0, 40),
    guardName: guardName.slice(0, 120),
    client: (row.client || clientLabel || '').slice(0, 120),
    unit: (row.unit || '').slice(0, 120),
    date: markDate,
    status: parseStatus(row.statusRaw || ''),
    mobile: digMobile(row.mobile || '').slice(0, 20),
  }
}

function ingestBlob(
  buf: ArrayBuffer,
  fallbackDate: string,
  byDate: Map<string, GuardAttendanceMark[]>,
  clientLabel = '',
) {
  if (!buf.byteLength) return 0
  const rows = mapSheetRows(sheetRows(buf), ATTENDANCE_MAP)
  let n = 0
  for (const row of rows) {
    const mark = markFromRow(fallbackDate, row, clientLabel)
    if (!mark) continue
    const list = byDate.get(mark.date) ?? []
    list.push(mark)
    byDate.set(mark.date, list)
    n++
  }
  if (n > 0) return n
  return ingestSummaryGrid(buf, byDate, clientLabel)
}

/** Attendance summary export — dates across columns, P/A/L per day. */
function ingestSummaryGrid(
  buf: ArrayBuffer,
  byDate: Map<string, GuardAttendanceMark[]>,
  clientLabel = '',
) {
  const rows = sheetRows(buf)
  let headerRow = -1
  let nameCol = -1
  let idCol = -1
  let mobileCol = -1
  let clientCol = -1
  let unitCol = -1
  const dateCols: { c: number; iso: string }[] = []

  for (let r = 0; r < Math.min(rows.length, 25); r++) {
    const row = rows[r]
    if (!Array.isArray(row)) continue
    const trialDates: { c: number; iso: string }[] = []
    let trialName = -1
    let trialId = -1
    let trialMobile = -1
    let trialClient = -1
    let trialUnit = -1
    for (let c = 0; c < row.length; c++) {
      const raw = cellStr(row[c])
      const h = normHeader(raw)
      if (['employeename', 'guardname', 'staffname', 'username', 'name'].includes(h)) trialName = c
      if (['employee', 'employeeid', 'empid', 'empcode', 'employeecode'].includes(h) && trialId < 0) {
        trialId = c
      }
      if (['mobile', 'mobileno', 'phoneno', 'phone', 'contact', 'contactno', 'whatsapp'].includes(h)) {
        trialMobile = c
      }
      if (['client', 'clientname'].includes(h)) trialClient = c
      if (['unit', 'unitname', 'site', 'sitename', 'location'].includes(h)) trialUnit = c
      const iso = normaliseMarkDate(raw, '')
      if (iso && iso !== raw) trialDates.push({ c, iso })
    }
    if ((trialName >= 0 || trialId >= 0) && trialDates.length >= 2) {
      headerRow = r
      nameCol = trialName
      idCol = trialId
      mobileCol = trialMobile
      clientCol = trialClient
      unitCol = trialUnit
      dateCols.push(...trialDates)
      break
    }
  }

  if (headerRow < 0) return 0

  let n = 0
  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r]
    if (!Array.isArray(row)) continue
    let guardName = nameCol >= 0 ? cellStr(row[nameCol]) : ''
    let employeeId = idCol >= 0 ? cellStr(row[idCol]) : ''
    if (looksLikeEmpId(guardName) && !employeeId) {
      employeeId = guardName
      guardName = ''
    }
    if (!guardName && !employeeId) continue
    const mobile = mobileCol >= 0 ? digMobile(cellStr(row[mobileCol])) : ''
    const client = (clientCol >= 0 ? cellStr(row[clientCol]) : '') || clientLabel
    const unit = unitCol >= 0 ? cellStr(row[unitCol]) : ''
    for (const { c, iso } of dateCols) {
      const statusRaw = cellStr(row[c])
      if (!statusRaw) continue
      const mark: GuardAttendanceMark = {
        employeeId: employeeId.slice(0, 40),
        guardName: guardName.slice(0, 120),
        client: client.slice(0, 120),
        unit: unit.slice(0, 120),
        date: iso,
        status: parseStatus(statusRaw),
        mobile: mobile.slice(0, 20),
      }
      const list = byDate.get(iso) ?? []
      list.push(mark)
      byDate.set(iso, list)
      n++
    }
  }
  return n
}

type AttendanceFetchOpts = {
  path: string
  clientId: string
  unitId: string
  useDmy: boolean
  dailyStatusExport?: boolean
  isAttendanceExport?: boolean
}

async function fetchAttendanceBlob(
  cfg: Work360Config,
  startDate: string,
  endDate: string,
  opts: AttendanceFetchOpts,
): Promise<ArrayBuffer> {
  const from = opts.useDmy ? isoToWork360Date(startDate) : startDate
  const to = opts.useDmy ? isoToWork360Date(endDate) : endDate
  const params: Record<string, string> = {
    fromDateStr: from,
    toDateStr: to,
    clientId: opts.clientId,
    unitId: opts.unitId,
    userId: '-1',
  }
  if (opts.isAttendanceExport) params.isAttendanceExport = 'true'
  if (opts.dailyStatusExport) params.dailyStatusExport = 'true'
  return work360FetchBlob(cfg, opts.path, params)
}

const FETCH_VARIANTS: Omit<AttendanceFetchOpts, 'clientId' | 'unitId' | 'useDmy'>[] = [
  { path: '/v1/reports/attendancesummaryblob' },
  { path: '/v1/reports/attendanceindividualblob', dailyStatusExport: true, isAttendanceExport: true },
  { path: '/v1/reports/absenteeblob' },
  { path: '/v1/reports/absentreportblob' },
]

const SYNC_BUDGET_MS = 22_000
const MAX_CLIENTS = 24

function markKey(m: GuardAttendanceMark): string {
  return `${(m.employeeId || m.guardName).trim().toLowerCase()}|${m.date}`
}

function pickBetterName(a: string, b: string): string {
  const an = String(a || '').trim()
  const bn = String(b || '').trim()
  if (an && !looksLikeEmpId(an)) return an
  if (bn && !looksLikeEmpId(bn)) return bn
  return an || bn
}

function mergeMarks(existing: GuardAttendanceMark[], incoming: GuardAttendanceMark[]): GuardAttendanceMark[] {
  const map = new Map<string, GuardAttendanceMark>()
  for (const m of existing) map.set(markKey(m), m)
  for (const m of incoming) {
    const prev = map.get(markKey(m))
    if (!prev) {
      map.set(markKey(m), m)
      continue
    }
    map.set(markKey(m), {
      ...prev,
      ...m,
      employeeId: m.employeeId || prev.employeeId,
      guardName: pickBetterName(m.guardName, prev.guardName),
      mobile: digMobile(m.mobile) || digMobile(prev.mobile),
      client: m.client || prev.client,
      unit: m.unit || prev.unit,
    })
  }
  return [...map.values()]
}

async function tryClientAttendance(
  cfg: Work360Config,
  startDate: string,
  endDate: string,
  clientId: string,
  clientLabel: string,
  unitId: string,
  byDate: Map<string, GuardAttendanceMark[]>,
  attempts: string[],
  deadline: number,
): Promise<boolean> {
  for (const variant of FETCH_VARIANTS) {
    if (Date.now() > deadline) return false
    try {
      for (const useDmy of [false, true]) {
        if (Date.now() > deadline) return false
        const buf = await fetchAttendanceBlob(cfg, startDate, endDate, {
          ...variant,
          clientId,
          unitId,
          useDmy,
        })
        const bucket = new Map<string, GuardAttendanceMark[]>()
        const n = ingestBlob(buf, endDate, bucket, clientLabel)
        const tag = `${clientLabel || clientId} ${variant.path.split('/').pop()}${useDmy ? ' dmy' : ''}`
        if (n > 0) {
          for (const [date, marks] of bucket) {
            const list = byDate.get(date) ?? []
            list.push(...marks)
            byDate.set(date, list)
          }
          attempts.push(`${tag}: ${n} rows`)
          return true
        }
        if (buf.byteLength) attempts.push(`${tag}: ${buf.byteLength}B unparseable`)
        else attempts.push(`${tag}: empty`)
      }
    } catch (err) {
      attempts.push(`${clientLabel || clientId}: ${err instanceof Error ? err.message : 'error'}`)
    }
  }
  return false
}

/** Work360 requires a real client id (not -1) for attendance exports. */
export async function syncWork360AttendanceRange(endDate: string, days = 14) {
  const cfg = work360Config()
  if (!cfg) {
    return {
      ok: false,
      endDate,
      days,
      saved: 0,
      skipped: true,
      error: 'Work360 not configured on server (WORK360_API_BASE_URL, TENANT_ID, USERNAME, PASSWORD).',
    }
  }

  const startDate = addDays(endDate, -(Math.max(1, days) - 1))
  const byDate = new Map<string, GuardAttendanceMark[]>()
  const attempts: string[] = []
  const deadline = Date.now() + SYNC_BUDGET_MS

  try {
    const clients = await work360ListClients(cfg)
    if (!clients.length) {
      return {
        ok: true,
        endDate,
        startDate,
        days,
        saved: 0,
        skipped: true,
        error: 'Work360 returned no clients for this login. Check username/tenant on Vercel, or use Roster & Join-Backs.',
        attempts: ['no clients from /v1/clients'],
      }
    }

    const clientRows = clients
      .map((c) => ({
        id: String(c.id ?? '').trim(),
        name: String(c.name || c.clientName || c.code || c.id || '').trim(),
      }))
      .filter((c) => c.id && c.id !== '-1' && c.id !== '0')
      .slice(0, MAX_CLIENTS)

    if (cfg.tenantId) {
      await tryClientAttendance(
        cfg,
        startDate,
        endDate,
        cfg.tenantId,
        'ALL',
        '-1',
        byDate,
        attempts,
        deadline,
      )
    }

    const markCount = () => [...byDate.values()].reduce((n, x) => n + x.length, 0)
    for (const client of clientRows) {
      if (markCount() >= 400) {
        attempts.push('enough rows from company-wide / early clients')
        break
      }
      if (Date.now() > deadline) {
        attempts.push('stopped: time limit — tap Sync again to pull remaining clients')
        break
      }
      await tryClientAttendance(
        cfg,
        startDate,
        endDate,
        client.id,
        client.name,
        '-1',
        byDate,
        attempts,
        deadline,
      )
    }

    if (!byDate.size) {
      return {
        ok: true,
        endDate,
        startDate,
        days,
        saved: 0,
        skipped: true,
        error:
          'Work360 attendance export returned no data for any client. Use Roster & Join-Backs for absconders, or ask Aititude to enable attendance export for tenant 1000.',
        attempts,
      }
    }

    if (Date.now() < deadline - 4000) {
      const directory = await loadWork360EmployeeDirectory(
        cfg,
        clientRows.map((c) => c.id),
      )
      for (const [date, marks] of byDate) {
        byDate.set(
          date,
          marks.map((m) => {
            const e = enrichMarkFromDirectory(m, directory)
            return { ...m, employeeId: e.employeeId, guardName: e.guardName, mobile: e.mobile }
          }),
        )
      }
    }

    let saved = 0
    for (const [date, marks] of byDate) {
      const existing = await getAttendanceMarks(date)
      const merged = mergeMarks(existing, marks).slice(0, 20000)
      const ok = await saveAttendanceMarks(date, merged)
      if (ok) saved += marks.length
    }

    return {
      ok: true,
      endDate,
      startDate,
      days,
      saved,
      daysWithData: byDate.size,
      clientsTried: clientRows.length,
      attempts,
    }
  } catch (err) {
    return {
      ok: false,
      endDate,
      startDate,
      days,
      saved: 0,
      error: err instanceof Error ? err.message : 'Attendance sync failed',
      attempts,
    }
  }
}

export async function syncWork360Attendance(date: string) {
  return syncWork360AttendanceRange(date, 1)
}
