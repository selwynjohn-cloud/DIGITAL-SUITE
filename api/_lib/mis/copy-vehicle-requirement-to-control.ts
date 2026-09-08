/**
 * When MIS Night Visit / Client Visit has Vehicle Requirement ON,
 * create a new Agile Control case so Operations can allot a vehicle + driver.
 */

import { createAcCase } from '../control/cases.js'
import { saveVehicleReqLink } from './apply-vehicle-allotment-from-control.js'
import { getBranches } from './store.js'

export type VehicleReqCopyInput = {
  kind: 'night' | 'client' | 'training'
  branchId: string
  visitDate: string
  visitTime?: string
  officerName?: string
  officerPhone?: string
  clientName?: string
  location?: string
  purpose?: string
  sourceId: string
  byEmail?: string
  byName: string
  /** Skip create if already linked */
  existingCaseNo?: string
}

export type VehicleReqCopyResult =
  | { ok: true; caseNo: string; caseId: string; skipped?: boolean }
  | { ok: false; error: string }

function monthFromYmd(ymd: string): string {
  const d = String(ymd || '').slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d.slice(0, 7) : ''
}

export async function copyVehicleRequirementToControl(
  input: VehicleReqCopyInput,
): Promise<VehicleReqCopyResult> {
  if (input.existingCaseNo) {
    return { ok: true, caseNo: input.existingCaseNo, caseId: '', skipped: true }
  }
  const branches = await getBranches(true)
  const branch = branches.find((b) => b.id === input.branchId)
  const branchName = branch?.name || input.branchId
  const when = [input.visitDate, input.visitTime].filter(Boolean).join(' · ')
  const kindLabel =
    input.kind === 'night' ? 'Night Visit' : input.kind === 'client' ? 'Client Visit' : 'Training OJT'
  const month = monthFromYmd(input.visitDate)
  const summary = `Vehicle Requirement — ${kindLabel} — ${when || 'date TBD'}${
    input.clientName ? ` — ${input.clientName}` : ''
  }`.slice(0, 240)
  const showsOn =
    input.kind === 'training'
      ? 'it will show on the Training Add schedule page.'
      : 'it will show on MIS Scheduled List.'
  const detail = [
    `Vehicle required for ${kindLabel}.`,
    `Branch: ${branchName}`,
    `Date / time: ${when || '—'}`,
    input.officerName ? `Officer: ${input.officerName}` : '',
    input.officerPhone ? `Officer WhatsApp: ${input.officerPhone}` : '',
    input.clientName ? `Client: ${input.clientName}` : '',
    input.location ? `Location: ${input.location}` : '',
    input.purpose ? `Purpose: ${input.purpose}` : '',
    `${input.kind === 'training' ? 'Training' : 'MIS'} source id: ${input.sourceId}`,
    `Please accept with Driver name + Vehicle number — ${showsOn}`,
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const ac = await createAcCase({
      category: 'Deployment',
      priority: 'P3',
      summary,
      detail,
      callerName: input.officerName || input.byName,
      callerPhone: input.officerPhone || '',
      source: input.kind === 'training' ? 'Training OJT' : `MIS ${kindLabel}`,
      branchId: input.branchId,
      branchName,
      clientName: input.clientName || '',
      siteName: input.location || '',
      byEmail: (input.byEmail || '').trim().toLowerCase() || 'mis@agilegroup.co.in',
      byName: input.byName || 'MIS',
      misSourceKind: input.kind,
      misSourceId: input.sourceId,
      misVisitMonth: month,
    })
    await saveVehicleReqLink({
      kind: input.kind,
      branchId: input.branchId,
      month,
      sourceId: input.sourceId,
      caseNo: ac.caseNo,
    })
    return { ok: true, caseNo: ac.caseNo, caseId: ac.id }
  } catch (err) {
    console.error('[copyVehicleRequirementToControl]', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Could not create Control case.' }
  }
}
