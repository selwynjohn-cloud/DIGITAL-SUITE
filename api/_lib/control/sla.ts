/**
 * Agile Control — SLA clocks and escalation ladder.
 */

import type { AcCase, AcEscalationLevel, AcPriority } from './types.js'

/** Ack / resolve windows in minutes. */
export const AC_SLA_MINUTES: Record<AcPriority, { ack: number; resolve: number }> = {
  P1: { ack: 2, resolve: 60 },
  P2: { ack: 15, resolve: 240 },
  P3: { ack: 120, resolve: 1440 },
  P4: { ack: 480, resolve: 2880 },
}

export function slaDueAts(
  priority: AcPriority,
  fromIso = new Date().toISOString(),
): { slaAckDueAt: string; slaResolveDueAt: string } {
  const base = new Date(fromIso).getTime()
  const cfg = AC_SLA_MINUTES[priority] || AC_SLA_MINUTES.P3
  return {
    slaAckDueAt: new Date(base + cfg.ack * 60_000).toISOString(),
    slaResolveDueAt: new Date(base + cfg.resolve * 60_000).toISOString(),
  }
}

export function nextEscalationLevel(current: AcEscalationLevel, priority: AcPriority): AcEscalationLevel | null {
  if (priority === 'P4') return null
  const ladder: AcEscalationLevel[] =
    priority === 'P1'
      ? ['None', 'Branch', 'Regional', 'Director', 'Leadership']
      : priority === 'P2'
        ? ['None', 'Branch', 'Regional', 'Director']
        : ['None', 'Branch', 'Regional']
  const i = ladder.indexOf(current || 'None')
  if (i < 0 || i >= ladder.length - 1) return null
  return ladder[i + 1]
}

export function needsAckEscalation(c: AcCase, now = Date.now()): boolean {
  if (c.status !== 'Open') return false
  if (!c.slaAckDueAt) return false
  return new Date(c.slaAckDueAt).getTime() <= now
}

export function needsResolveEscalation(c: AcCase, now = Date.now()): boolean {
  if (c.status === 'Closed' || c.status === 'ClientConfirmed' || c.status === 'Resolved') return false
  if (!c.slaResolveDueAt) return false
  return new Date(c.slaResolveDueAt).getTime() <= now
}

export function isSlaBreached(c: AcCase, now = Date.now()): boolean {
  if (c.status === 'Closed' || c.status === 'ClientConfirmed') return false
  if (c.status === 'Open' && c.slaAckDueAt && new Date(c.slaAckDueAt).getTime() < now) return true
  if (
    (c.status === 'Acknowledged' || c.status === 'InProgress') &&
    c.slaResolveDueAt &&
    new Date(c.slaResolveDueAt).getTime() < now
  ) {
    return true
  }
  return false
}

export function incidentAgeMs(c: AcCase, now = Date.now()): number {
  return Math.max(0, now - new Date(c.createdAt).getTime())
}

export function formatAge(ms: number): string {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
