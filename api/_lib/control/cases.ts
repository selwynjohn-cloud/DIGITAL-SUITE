/**
 * Agile Control — create case helper + logbook mirror.
 */

import { nextAcCaseNo } from './case-id.js'
import { slaDueAts } from './sla.js'
import { acNid, appendAcLog, emptyTimeline, upsertAcCase } from './store.js'
import type { AcCase, AcCategory, AcPriority } from './types.js'
import { isIncidentCategory } from './types.js'

export type CreateAcCaseInput = {
  category: AcCategory
  priority: AcPriority
  summary: string
  detail?: string
  callerName?: string
  callerPhone?: string
  source?: string
  branchId?: string
  branchName?: string
  clientName?: string
  siteName?: string
  ownerEmail?: string
  ownerName?: string
  byEmail: string
  byName: string
  misSourceKind?: '' | 'night' | 'client' | 'training'
  misSourceId?: string
  misVisitMonth?: string
}

export async function createAcCase(input: CreateAcCaseInput): Promise<AcCase> {
  const now = new Date().toISOString()
  const caseNo = await nextAcCaseNo()
  const sla = slaDueAts(input.priority, now)
  const row: AcCase = {
    id: acNid('ac'),
    caseNo,
    createdAt: now,
    updatedAt: now,
    createdByEmail: input.byEmail,
    createdByName: input.byName,
    category: input.category,
    priority: input.priority,
    status: 'Open',
    summary: String(input.summary || '').slice(0, 240),
    detail: String(input.detail || '').slice(0, 4000),
    callerName: String(input.callerName || '').slice(0, 120),
    callerPhone: String(input.callerPhone || '').slice(0, 40),
    source: String(input.source || 'Command Centre').slice(0, 80),
    branchId: String(input.branchId || '').slice(0, 40),
    branchName: String(input.branchName || '').slice(0, 120),
    clientName: String(input.clientName || '').slice(0, 160),
    siteName: String(input.siteName || '').slice(0, 160),
    ownerEmail: String(input.ownerEmail || '').slice(0, 120),
    ownerName: String(input.ownerName || '').slice(0, 120),
    slaAckDueAt: sla.slaAckDueAt,
    slaResolveDueAt: sla.slaResolveDueAt,
    acknowledgedAt: '',
    acknowledgedBy: '',
    resolvedAt: '',
    resolvedBy: '',
    clientConfirmedAt: '',
    closedAt: '',
    closedBy: '',
    escalationLevel: 'None',
    lastEscalatedAt: '',
    clientInformedAt: '',
    policeInformedAt: '',
    managementInformedAt: '',
    nextActionDueAt: isIncidentCategory(input.category) ? sla.slaAckDueAt : '',
    nextActionNote: isIncidentCategory(input.category) ? 'Acknowledge and start incident checklist' : '',
    checklist: isIncidentCategory(input.category)
      ? [
          'Confirm site / location',
          'Classify priority',
          'Notify operations',
          'Client contact status',
          'Attach evidence',
          'External agencies if required',
        ]
      : [],
    evidenceNotes: '',
    timeline: [
      emptyTimeline(input.byEmail, input.byName, 'created', `${input.priority} ${input.category} opened`),
    ],
    vehicleDriverName: '',
    vehicleRegNo: '',
    vehicleAcceptedAt: '',
    misSourceKind:
      input.misSourceKind === 'night' ||
      input.misSourceKind === 'client' ||
      input.misSourceKind === 'training'
        ? input.misSourceKind
        : '',
    misSourceId: String(input.misSourceId || '').slice(0, 40),
    misVisitMonth: String(input.misVisitMonth || '').slice(0, 7),
  }
  await upsertAcCase(row)
  await appendAcLog({
    byEmail: input.byEmail,
    byName: input.byName,
    kind: 'case_created',
    text: `${caseNo} · ${input.priority} · ${input.summary}`,
    caseNo,
    branchId: row.branchId,
  })
  return row
}
