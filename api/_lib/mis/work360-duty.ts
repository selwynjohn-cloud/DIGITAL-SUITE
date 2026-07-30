import { nid, saveDutyIncidents, type MisDutyIncident } from './store.js'
import type { SyncVisitsResult } from './visit-sync-types.js'
import { mapSheetRows, sheetRows } from './work360-excel.js'
import {
  work360Config,
  work360DateParams,
  work360FetchBlob,
  work360ListClients,
  type Work360Config,
} from './work360-client.js'

const OUT_OF_WORK_MAP: Record<string, string> = {
  employee: 'guardName',
  employeename: 'guardName',
  guardname: 'guardName',
  username: 'guardName',
  user: 'guardName',
  staff: 'guardName',
  employeeid: 'employeeId',
  empid: 'employeeId',
  client: 'client',
  clientname: 'client',
  unit: 'unit',
  unitname: 'unit',
  location: 'unit',
  site: 'unit',
  time: 'incidentTime',
  timestamp: 'incidentTime',
  datetime: 'incidentTime',
  outtime: 'incidentTime',
  remarks: 'remarks',
  reason: 'remarks',
  distance: 'remarks',
}

const ATTENDANCE_MAP: Record<string, string> = {
  employee: 'guardName',
  employeename: 'guardName',
  guardname: 'guardName',
  username: 'guardName',
  user: 'guardName',
  employeeid: 'employeeId',
  empid: 'employeeId',
  client: 'client',
  clientname: 'client',
  unit: 'unit',
  unitname: 'unit',
  date: 'markDate',
  attendance: 'statusRaw',
  status: 'statusRaw',
  dailystatus: 'statusRaw',
  punchstatus: 'statusRaw',
  intime: 'incidentTime',
  intimeactual: 'incidentTime',
  lateby: 'remarks',
  remarks: 'remarks',
}

function classifyStatus(raw: string): 'late_start' | 'out_of_post' | 'absent' | '' {
  const t = raw.toLowerCase()
  if (!t) return ''
  if (/late|delay|tardy|ls\b|after.?time|check.?in.?late|started.?late/.test(t)) return 'late_start'
  if (/out.?of|left.?post|away|geo|location|absent.*post|oop\b/.test(t)) return 'out_of_post'
  if (/absent|abscond|missing|no.?show|not.?present/.test(t)) return 'absent'
  return ''
}

function toIncident(
  date: string,
  type: MisDutyIncident['type'],
  raw: Record<string, string>,
): MisDutyIncident | null {
  const guardName = raw.guardName || ''
  if (!guardName) return null
  return {
    id: nid('di'),
    date,
    guardName: guardName.slice(0, 120),
    employeeId: (raw.employeeId || '').slice(0, 40),
    client: (raw.client || '').slice(0, 120),
    unit: (raw.unit || '').slice(0, 120),
    shift: (raw.shift || '').slice(0, 20),
    incidentTime: (raw.incidentTime || '').slice(0, 40),
    type,
    remarks: (raw.remarks || '').slice(0, 300),
    fromMobile: true,
  }
}

function incidentKey(i: MisDutyIncident): string {
  return `${i.guardName}|${i.type}|${i.incidentTime}|${i.client}`.toLowerCase()
}

async function clientIdsForDay(cfg: Work360Config): Promise<string[]> {
  const clients = await work360ListClients(cfg)
  const ids = clients
    .map((c) => String(c.id ?? '').trim())
    .filter((id) => id && id !== '-1' && id !== '0')
  if (!ids.length && cfg.tenantId) ids.push(cfg.tenantId)
  return ids.slice(0, 8)
}

/** One calendar day only — same from/to date in ISO (YYYY-MM-DD), per client like Report Portal. */
export async function syncWork360DutyIncidents(date: string): Promise<SyncVisitsResult> {
  const cfg = work360Config()
  if (!cfg) {
    return { ok: true, date, fetched: 0, saved: 0, skipped: true, error: 'Work360 not configured' }
  }

  const dayParams = work360DateParams(date)
  const seen = new Set<string>()
  const incidents: MisDutyIncident[] = []

  try {
    const clientIds = await clientIdsForDay(cfg)

    for (const clientId of clientIds) {
      const lateEndpoints = [
        '/v1/reports/lateattendancereportblob',
        '/v1/reports/latecheckinreportblob',
      ]
      for (const path of lateEndpoints) {
        try {
          const lateBuf = await work360FetchBlob(cfg, path, {
            ...dayParams,
            clientId,
            unitId: '-1',
            userId: '-1',
            dailyStatusExport: 'true',
          })
          if (!lateBuf.byteLength) continue
          for (const row of mapSheetRows(sheetRows(lateBuf), ATTENDANCE_MAP)) {
            const kind = classifyStatus(row.statusRaw || row.remarks || 'late')
            const inc = toIncident(date, kind === 'out_of_post' ? 'out_of_post' : 'late_start', row)
            if (!inc) continue
            const k = incidentKey(inc)
            if (seen.has(k)) continue
            seen.add(k)
            incidents.push(inc)
          }
        } catch {
          /* try next endpoint */
        }
      }

      try {
        const outBuf = await work360FetchBlob(cfg, '/v1/reports/outofworkreportblob', {
          ...dayParams,
          clientId,
          unitId: '-1',
          userId: '-1',
        })
        if (outBuf.byteLength) {
          for (const row of mapSheetRows(sheetRows(outBuf), OUT_OF_WORK_MAP)) {
            const inc = toIncident(date, 'out_of_post', row)
            if (!inc) continue
            const k = incidentKey(inc)
            if (seen.has(k)) continue
            seen.add(k)
            incidents.push(inc)
          }
        }
      } catch {
        /* try next client */
      }

      try {
        const attBuf = await work360FetchBlob(cfg, '/v1/reports/attendanceindividualblob', {
          ...dayParams,
          clientId,
          unitId: '-1',
          userId: '-1',
          dailyStatusExport: 'true',
        })
        if (attBuf.byteLength) {
          for (const row of mapSheetRows(sheetRows(attBuf), ATTENDANCE_MAP)) {
            const kind = classifyStatus(row.statusRaw || row.remarks || '')
            if (kind !== 'late_start' && kind !== 'out_of_post') continue
            const inc = toIncident(date, kind, row)
            if (!inc) continue
            const k = incidentKey(inc)
            if (seen.has(k)) continue
            seen.add(k)
            incidents.push(inc)
          }
        }
      } catch {
        /* try next client */
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
    return {
      ok,
      date,
      fetched: incidents.length,
      saved: incidents.length,
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
