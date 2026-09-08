/**
 * Incident close SLA — same deadline for every open incident.
 * Default: 24 hours from date & time of incident (full report to client).
 */
import type { MisIncidentReport } from './incident-report-store.js'

export const INCIDENT_CLOSE_HOURS = Math.min(
  168,
  Math.max(1, Number(process.env.MIS_INCIDENT_CLOSE_HOURS || 24) || 24),
)

export type IncidentSlaLevel = 'ok' | 'warn' | 'urgent' | 'overdue' | 'closed_ok' | 'closed_late'

export type IncidentSla = {
  closeHours: number
  startedAt: string
  dueAt: string
  dueLabel: string
  pct: number
  level: IncidentSlaLevel
  label: string
  closed: boolean
  hoursLeft: number
  overdueHours: number
}

function fmtDueIst(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return iso.slice(0, 16).replace('T', ' ')
  }
}

function reportStartMs(r: MisIncidentReport): number {
  const date = String(r.incidentDate || '').trim()
  const time = String(r.incidentTime || '').trim().slice(0, 5)
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const hm = /^(\d{1,2}):(\d{2})$/.exec(time)
    const h = hm ? Number(hm[1]) : 0
    const m = hm ? Number(hm[2]) : 0
    const iso = `${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+05:30`
    const t = Date.parse(iso)
    if (Number.isFinite(t)) return t
    const dayStart = Date.parse(`${date}T00:00:00+05:30`)
    if (Number.isFinite(dayStart)) return dayStart
  }
  const raw = String(r.createdAt || '').trim()
  const t = Date.parse(raw)
  return Number.isFinite(t) ? t : Date.now()
}

export function incidentCloseDueAt(r: MisIncidentReport): Date {
  return new Date(reportStartMs(r) + INCIDENT_CLOSE_HOURS * 3600_000)
}

export function incidentSlaForReport(r: MisIncidentReport, now = Date.now()): IncidentSla {
  const closeHours = INCIDENT_CLOSE_HOURS
  const startedAt = new Date(reportStartMs(r)).toISOString()
  const due = incidentCloseDueAt(r)
  const dueAt = due.toISOString()
  const dueLabel = fmtDueIst(dueAt)

  if (r.status === 'submitted') {
    const closedAt = Date.parse(String(r.submittedAt || r.updatedAt || ''))
    const onTime = Number.isFinite(closedAt) ? closedAt <= due.getTime() : true
    return {
      closeHours,
      startedAt,
      dueAt,
      dueLabel,
      pct: 100,
      level: onTime ? 'closed_ok' : 'closed_late',
      label: onTime ? 'Closed on time' : 'Closed after deadline',
      closed: true,
      hoursLeft: 0,
      overdueHours: onTime
        ? 0
        : Math.max(0, Math.round((closedAt - due.getTime()) / 3600_000)),
    }
  }

  const elapsedMs = Math.max(0, now - reportStartMs(r))
  const totalMs = closeHours * 3600_000
  const pct = Math.round((elapsedMs / totalMs) * 100)
  const msLeft = due.getTime() - now
  const hoursLeft = Math.max(0, Math.ceil(msLeft / 3600_000))
  const overdueHours = msLeft < 0 ? Math.ceil(Math.abs(msLeft) / 3600_000) : 0

  let level: IncidentSlaLevel = 'ok'
  if (pct >= 100) level = 'overdue'
  else if (pct >= 75) level = 'urgent'
  else if (pct >= 50) level = 'warn'

  let label = `${hoursLeft}h left · due ${dueLabel}`
  if (level === 'overdue') label = `Overdue ${overdueHours}h · was due ${dueLabel}`

  return {
    closeHours,
    startedAt,
    dueAt,
    dueLabel,
    pct: Math.min(150, pct),
    level,
    label,
    closed: false,
    hoursLeft,
    overdueHours,
  }
}

export function incidentSlaBarColor(level: IncidentSlaLevel): string {
  if (level === 'closed_ok') return '#4ade80'
  if (level === 'closed_late') return '#94a3b8'
  if (level === 'overdue') return '#f87171'
  if (level === 'urgent') return '#fb923c'
  if (level === 'warn') return '#fbbf24'
  return '#4ade80'
}

export function withIncidentSla<T extends MisIncidentReport>(r: T): T & { sla: IncidentSla } {
  return { ...r, sla: incidentSlaForReport(r) }
}
