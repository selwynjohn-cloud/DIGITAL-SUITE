import { getAttendanceMarks, getJoinBacks, type GuardAttendanceMark, type JoinBackRecord } from './store.js'

export type AbsconderRow = {
  employeeId: string
  guardName: string
  mobile: string
  client: string
  unit: string
  absentSince: string
  consecutiveDays: number
  branchHint: string
  source?: 'mobile' | 'joinback'
}

function guardKey(m: GuardAttendanceMark): string {
  return (m.employeeId || m.guardName).trim().toLowerCase()
}

function addDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

function isAbsentMark(m: GuardAttendanceMark): boolean {
  return m.status === 'absent' || m.status === 'unknown'
}

function rejoinedAfter(joinbacks: JoinBackRecord[], guardName: string, employeeId: string, since: string): boolean {
  const key = (employeeId || guardName).toLowerCase()
  return joinbacks.some((j) => {
    if (!j.active || j.status !== 'rejoined') return false
    const jk = (j.guardName || '').toLowerCase()
    if (jk !== key && jk !== guardName.toLowerCase()) return false
    return (j.rejoinDate || '') >= since
  })
}

export function computeAbsconders(
  marksByDate: Map<string, GuardAttendanceMark[]>,
  joinbacks: JoinBackRecord[],
  asOf: string,
  minDays = 7,
): AbsconderRow[] {
  const byGuard = new Map<string, GuardAttendanceMark[]>()
  for (const [date, marks] of marksByDate) {
    if (date > asOf) continue
    for (const m of marks) {
      const k = guardKey(m)
      if (!k) continue
      if (!byGuard.has(k)) byGuard.set(k, [])
      byGuard.get(k)!.push({ ...m, date })
    }
  }

  const out: AbsconderRow[] = []

  for (const [, marks] of byGuard) {
    const sample = marks[0]
    let streak = 0
    let absentSince = asOf
    for (let i = 0; i < 30; i++) {
      const day = addDays(asOf, -i)
      const dayMarks = marksByDate.get(day) || []
      const hit = dayMarks.find((m) => guardKey(m) === guardKey(sample))
      if (hit && isAbsentMark(hit)) {
        streak++
        absentSince = day
      } else if (hit && hit.status === 'present') {
        break
      } else if (!hit && streak > 0) {
        break
      } else if (!hit) {
        continue
      } else {
        break
      }
    }

    if (streak < minDays) continue
    if (rejoinedAfter(joinbacks, sample.guardName, sample.employeeId, absentSince)) continue

    out.push({
      employeeId: sample.employeeId,
      guardName: sample.guardName,
      mobile: sample.mobile,
      client: sample.client,
      unit: sample.unit,
      absentSince,
      consecutiveDays: streak,
      branchHint: sample.unit || sample.client,
      source: 'mobile',
    })
  }

  return out.sort((a, b) => b.consecutiveDays - a.consecutiveDays)
}

export async function loadAbsconders(asOf: string, minDays = 7): Promise<AbsconderRow[]> {
  const marksByDate = new Map<string, GuardAttendanceMark[]>()
  for (let i = 0; i < 21; i++) {
    const day = addDays(asOf, -i)
    const marks = await getAttendanceMarks(day)
    if (marks.length) marksByDate.set(day, marks)
  }
  const joinbacks = await getJoinBacks()
  const mobile = computeAbsconders(marksByDate, joinbacks, asOf, minDays)
  const manual = abscondersFromJoinbacks(joinbacks, asOf, minDays)
  const seen = new Set<string>()
  const merged: AbsconderRow[] = []
  for (const g of [...mobile, ...manual]) {
    const k = `${(g.employeeId || g.guardName).toLowerCase()}|${g.mobile}`
    if (seen.has(k)) continue
    seen.add(k)
    merged.push(g)
  }
  return merged.sort((a, b) => b.consecutiveDays - a.consecutiveDays)
}

/** Branch join-back log — guards marked absent with left date 7+ days ago. */
export function abscondersFromJoinbacks(
  joinbacks: JoinBackRecord[],
  asOf: string,
  minDays = 7,
): AbsconderRow[] {
  const asOfMs = new Date(`${asOf}T12:00:00`).getTime()
  const out: AbsconderRow[] = []

  for (const j of joinbacks) {
    if (!j.active || j.status !== 'absent' || !j.leftDate) continue
    const leftMs = new Date(`${j.leftDate}T12:00:00`).getTime()
    if (!Number.isFinite(leftMs)) continue
    const days = Math.floor((asOfMs - leftMs) / 86_400_000) + 1
    if (days < minDays) continue
    out.push({
      employeeId: '',
      guardName: j.guardName,
      mobile: j.mobile,
      client: '',
      unit: j.siteZone,
      absentSince: j.leftDate,
      consecutiveDays: days,
      branchHint: j.branchId || j.siteZone,
      source: 'joinback',
    })
  }

  return out.sort((a, b) => b.consecutiveDays - a.consecutiveDays)
}

