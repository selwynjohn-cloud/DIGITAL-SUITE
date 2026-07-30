import { mapSheetRows, normHeader, sheetRows, cellStr } from '../mis/work360-excel.js'
import {
  isoToWork360Date,
  work360Config,
  work360FetchBlob,
  work360ListClients,
  type Work360Config,
} from '../mis/work360-client.js'
import { saveAttendanceMarks, type GuardAttendanceMark } from './store.js'

function addDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

function normaliseMarkDate(raw: string, fallback: string): string {
  const t = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t
  const dmy = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
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
  employee: 'guardName',
  employeename: 'guardName',
  guardname: 'guardName',
  username: 'guardName',
  user: 'guardName',
  name: 'guardName',
  employeeid: 'employeeId',
  empid: 'employeeId',
  client: 'client',
  clientname: 'client',
  unit: 'unit',
  unitname: 'unit',
  site: 'unit',
  date: 'markDate',
  attendancedate: 'markDate',
  punchdate: 'markDate',
  attendance: 'statusRaw',
  status: 'statusRaw',
  dailystatus: 'statusRaw',
  punchstatus: 'statusRaw',
  mobile: 'mobile',
  phoneno: 'mobile',
  contact: 'mobile',
}

function markFromRow(fallbackDate: string, row: Record<string, string>): GuardAttendanceMark | null {
  const guardName = row.guardName || ''
  const employeeId = row.employeeId || ''
  if (!guardName && !employeeId) return null
  const markDate = normaliseMarkDate(row.markDate || '', fallbackDate)
  return {
    employeeId: employeeId.slice(0, 40),
    guardName: guardName.slice(0, 120),
    client: (row.client || '').slice(0, 120),
    unit: (row.unit || '').slice(0, 120),
    date: markDate,
    status: parseStatus(row.statusRaw || ''),
    mobile: (row.mobile || '').slice(0, 20),
  }
}

function ingestBlob(buf: ArrayBuffer, fallbackDate: string, byDate: Map<string, GuardAttendanceMark[]>) {
  if (!buf.byteLength) return 0
  const rows = mapSheetRows(sheetRows(buf), ATTENDANCE_MAP)
  let n = 0
  for (const row of rows) {
    const mark = markFromRow(fallbackDate, row)
    if (!mark) continue
    const list = byDate.get(mark.date) ?? []
    list.push(mark)
    byDate.set(mark.date, list)
    n++
  }
  if (n > 0) return n
  return ingestSummaryGrid(buf, byDate)
}

/** Attendance summary export — dates across columns, P/A/L per day. */
function ingestSummaryGrid(buf: ArrayBuffer, byDate: Map<string, GuardAttendanceMark[]>) {
  const rows = sheetRows(buf)
  let headerRow = -1
  let nameCol = -1
  let idCol = -1
  const dateCols: { c: number; iso: string }[] = []

  for (let r = 0; r < Math.min(rows.length, 25); r++) {
    const row = rows[r]
    if (!Array.isArray(row)) continue
    const trialDates: { c: number; iso: string }[] = []
    let trialName = -1
    let trialId = -1
    for (let c = 0; c < row.length; c++) {
      const raw = cellStr(row[c])
      const h = normHeader(raw)
      if (['employee', 'employeename', 'guardname', 'username', 'name'].includes(h)) trialName = c
      if (['employeeid', 'empid'].includes(h)) trialId = c
      const iso = normaliseMarkDate(raw, '')
      if (iso && iso !== raw) trialDates.push({ c, iso })
    }
    if (trialName >= 0 && trialDates.length >= 2) {
      headerRow = r
      nameCol = trialName
      idCol = trialId
      dateCols.push(...trialDates)
      break
    }
  }

  if (headerRow < 0) return 0

  let n = 0
  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r]
    if (!Array.isArray(row)) continue
    const guardName = cellStr(row[nameCol])
    if (!guardName) continue
    const employeeId = idCol >= 0 ? cellStr(row[idCol]) : ''
    for (const { c, iso } of dateCols) {
      const statusRaw = cellStr(row[c])
      if (!statusRaw) continue
      const mark: GuardAttendanceMark = {
        employeeId: employeeId.slice(0, 40),
        guardName: guardName.slice(0, 120),
        client: '',
        unit: '',
        date: iso,
        status: parseStatus(statusRaw),
        mobile: '',
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
  { path: '/v1/reports/attendanceindividualblob', dailyStatusExport: true, isAttendanceExport: true },
  { path: '/v1/reports/attendancesummaryblob' },
]

const SYNC_BUDGET_MS = 22_000
const MAX_CLIENTS = 8

async function tryClientAttendance(
  cfg: Work360Config,
  startDate: string,
  endDate: string,
  clientId: string,
  unitId: string,
  byDate: Map<string, GuardAttendanceMark[]>,
  attempts: string[],
  deadline: number,
): Promise<boolean> {
  for (const variant of FETCH_VARIANTS) {
    if (Date.now() > deadline) return false
    try {
      const buf = await fetchAttendanceBlob(cfg, startDate, endDate, {
        ...variant,
        clientId,
        unitId,
        useDmy: false,
      })
      const n = ingestBlob(buf, endDate, byDate)
      const tag = `${clientId} ${variant.path.split('/').pop()}`
      if (n > 0) {
        attempts.push(`${tag}: ${n} rows`)
        return true
      }
      if (buf.byteLength) attempts.push(`${tag}: ${buf.byteLength}B unparseable`)
      else attempts.push(`${tag}: empty`)
    } catch (err) {
      attempts.push(`${clientId}: ${err instanceof Error ? err.message : 'error'}`)
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

    const clientIds = clients
      .map((c) => String(c.id ?? '').trim())
      .filter((id) => id && id !== '-1' && id !== '0')
      .slice(0, MAX_CLIENTS)

    for (const clientId of clientIds) {
      if (Date.now() > deadline) {
        attempts.push('stopped: time limit')
        break
      }
      await tryClientAttendance(cfg, startDate, endDate, clientId, '-1', byDate, attempts, deadline)
      if (byDate.size >= 3) break
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

    let saved = 0
    for (const [date, marks] of byDate) {
      const ok = await saveAttendanceMarks(date, marks.slice(0, 10000))
      if (ok) saved += marks.length
    }

    return { ok: true, endDate, startDate, days, saved, daysWithData: byDate.size, attempts }
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
