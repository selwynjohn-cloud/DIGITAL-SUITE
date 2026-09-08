/**
 * Work360 → Ops read-only attendance ingest.
 * Never writes back to Work360.
 */

import { syncWork360Attendance } from '../recruitment/work360-attendance.js'
import { getAttendanceMarks } from '../recruitment/store.js'
import { appendPunches, opsNid, getGuards } from './store.js'
import type { OpsAttendancePunch } from './types.js'

function mapStatus(s: string): OpsAttendancePunch['status'] {
  if (s === 'present') return 'present'
  if (s === 'late') return 'late'
  if (s === 'leave') return 'leave'
  if (s === 'absent') return 'absent'
  return 'unknown'
}

/**
 * Pull Work360 attendance for a date into Ops punches (read-only).
 * Reuses recruitment sync (Excel blobs) then copies marks into ops:punches.
 */
export async function ingestWork360IntoOps(date: string): Promise<{
  ok: boolean
  added: number
  message: string
}> {
  let syncMsg = ''
  try {
    const sync = await syncWork360Attendance(date)
    syncMsg = typeof sync === 'string' ? sync : JSON.stringify(sync ?? '')
  } catch (err) {
    syncMsg = err instanceof Error ? err.message : 'Work360 sync failed'
  }
  const marks = await getAttendanceMarks(date)
  const guards = await getGuards()
  const byEmp = new Map(guards.map((g) => [g.employeeId.toLowerCase(), g]))
  const byName = new Map(guards.map((g) => [g.name.trim().toLowerCase(), g]))

  const punches: OpsAttendancePunch[] = marks.map((m) => {
    const g =
      (m.employeeId && byEmp.get(m.employeeId.toLowerCase())) ||
      byName.get(m.guardName.trim().toLowerCase()) ||
      null
    return {
      id: opsNid('pn'),
      source: 'work360',
      employeeId: m.employeeId || g?.employeeId || '',
      guardName: m.guardName || g?.name || '',
      branchId: g?.branchId || '',
      clientName: m.client || '',
      postName: m.unit || '',
      date: m.date || date,
      status: mapStatus(m.status),
      punchedAt: `${m.date || date}T00:00:00.000Z`,
      lat: g?.lat ?? null,
      lng: g?.lng ?? null,
      photoUrl: '',
      raw: JSON.stringify({ from: 'work360', status: m.status }),
      createdAt: new Date().toISOString(),
    }
  })

  const added = await appendPunches(punches)
  return {
    ok: true,
    added,
    message: `Work360: ${syncMsg || 'ok'}. Ops added ${added} punch rows from ${marks.length} marks.`,
  }
}
