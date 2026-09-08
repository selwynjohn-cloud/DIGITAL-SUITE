/**
 * Control accepts vehicle + driver → write back to MIS Night Visit / Client Visit.
 * Link key: mis:vehicle-req:{caseNo}
 */

import {
  getClientVisits,
  normalizeClientVisit,
  saveClientVisits,
} from './client-visit-store.js'
import {
  loadNightSessions,
  normalizeSession,
  saveNightSessions,
} from './night-visit-session-store.js'

export type VehicleReqKind = 'night' | 'client' | 'training'

export type VehicleReqLink = {
  kind: VehicleReqKind
  branchId: string
  month: string
  sourceId: string
  caseNo: string
}

const LINK_PREFIX = 'mis:vehicle-req:'

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url, token } : null
}

async function redis(command: unknown[]): Promise<{ result?: unknown } | null> {
  const cfg = redisConfig()
  if (!cfg) return null
  try {
    const res = await fetch(cfg.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    })
    if (!res.ok) return null
    return (await res.json()) as { result?: unknown }
  } catch {
    return null
  }
}

export async function saveVehicleReqLink(link: VehicleReqLink): Promise<boolean> {
  const caseNo = String(link.caseNo || '').trim()
  if (!caseNo) return false
  const r = await redis(['SET', `${LINK_PREFIX}${caseNo}`, JSON.stringify(link)])
  return r?.result === 'OK'
}

export async function getVehicleReqLink(caseNo: string): Promise<VehicleReqLink | null> {
  const key = String(caseNo || '').trim()
  if (!key) return null
  const d = await redis(['GET', `${LINK_PREFIX}${key}`])
  if (d?.result && typeof d.result === 'string') {
    try {
      const row = JSON.parse(d.result) as VehicleReqLink
      if (row && (row.kind === 'night' || row.kind === 'client' || row.kind === 'training') && row.sourceId) {
        return row
      }
    } catch {
      /* ignore */
    }
  }
  return null
}

export type ApplyVehicleAllotmentInput = {
  caseNo: string
  driverName: string
  vehicleRegNo: string
  /** Fallback if Redis link missing */
  kind?: VehicleReqKind
  branchId?: string
  month?: string
  sourceId?: string
}

export type ApplyVehicleAllotmentResult =
  | { ok: true; kind: VehicleReqKind; sourceId: string }
  | { ok: false; error: string }

export async function applyVehicleAllotmentFromControl(
  input: ApplyVehicleAllotmentInput,
): Promise<ApplyVehicleAllotmentResult> {
  const driverName = String(input.driverName || '').trim().slice(0, 120)
  const vehicleRegNo = String(input.vehicleRegNo || '').trim().slice(0, 40)
  if (!driverName) return { ok: false, error: 'Enter driver name.' }

  const linked =
    (await getVehicleReqLink(input.caseNo)) ||
    (input.kind && input.sourceId
      ? {
          kind: input.kind,
          branchId: String(input.branchId || ''),
          month: String(input.month || ''),
          sourceId: String(input.sourceId),
          caseNo: input.caseNo,
        }
      : null)

  if (!linked) {
    return { ok: false, error: 'Vehicle request link not found for this Control case.' }
  }

  const now = new Date().toISOString()

  if (linked.kind === 'client') {
    const list = await getClientVisits()
    const i = list.findIndex((v) => v.id === linked.sourceId || v.controlCaseNo === input.caseNo)
    if (i < 0) return { ok: false, error: 'Client Visit not found in MIS.' }
    list[i] = normalizeClientVisit({
      ...list[i],
      driverName,
      vehicleRegNo,
      controlCaseNo: list[i].controlCaseNo || input.caseNo,
      vehicleRequired: true,
      updatedAt: now,
    })
    const ok = await saveClientVisits(list)
    if (!ok) return { ok: false, error: 'Could not update MIS Client Visit.' }
    return { ok: true, kind: 'client', sourceId: list[i].id }
  }

  if (linked.kind === 'training') {
    const { findSession, findSessionAcrossBranches, upsertSession } = await import(
      '../training/ojt-store.js'
    )
    const monthHints = [linked.month, String(input.month || '')].filter(Boolean)
    let found = linked.branchId
      ? await findSession(linked.branchId, linked.sourceId, monthHints)
      : null
    if (!found) {
      const { getBranches } = await import('./store.js')
      const branches = await getBranches(true)
      const ids = linked.branchId
        ? [linked.branchId]
        : branches.map((b) => b.id)
      found = await findSessionAcrossBranches(linked.sourceId, ids, linked.month)
      if (found) found = { session: found.session, month: found.month }
    }
    if (!found) return { ok: false, error: 'Training schedule not found.' }
    const next = {
      ...found.session,
      vehicleRequired: true,
      controlCaseNo: found.session.controlCaseNo || input.caseNo,
      vehicleDriverName: driverName,
      vehicleRegNo,
      vehicleAcceptedAt: now,
    }
    const saved = await upsertSession(next)
    if (!saved.ok) return { ok: false, error: 'Could not update Training schedule.' }
    await saveVehicleReqLink({
      ...linked,
      branchId: saved.session.branchId,
      month: found.month,
      caseNo: input.caseNo,
    })
    try {
      const { sendTrainingVehicleConfirmedMail } = await import('../training/ojt-vehicle-mail.js')
      await sendTrainingVehicleConfirmedMail(saved.session)
    } catch {
      /* schedule already updated */
    }
    return { ok: true, kind: 'training', sourceId: saved.session.id }
  }

  const branchId = linked.branchId
  if (!branchId) return { ok: false, error: 'Branch missing on vehicle link.' }

  const months: string[] = []
  if (linked.month && /^\d{4}-\d{2}$/.test(linked.month)) months.push(linked.month)
  const nowD = new Date()
  for (const off of [0, -1, 1]) {
    const d = new Date(Date.UTC(nowD.getUTCFullYear(), nowD.getUTCMonth() + off, 1))
    const m = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    if (!months.includes(m)) months.push(m)
  }

  for (const m of months) {
    const sessions = await loadNightSessions(branchId, m)
    const found = sessions.find((s) => s.id === linked.sourceId || s.controlCaseNo === input.caseNo)
    if (!found) continue
    found.driverName = driverName
    found.vehicleRegNo = vehicleRegNo
    found.controlCaseNo = found.controlCaseNo || input.caseNo
    found.vehicleRequired = true
    found.updatedAt = now
    const next = sessions.map((s) => (s.id === found.id ? normalizeSession(found) : s))
    const ok = await saveNightSessions(branchId, m, next)
    if (!ok) return { ok: false, error: 'Could not update MIS Night Visit.' }
    await saveVehicleReqLink({ ...linked, month: m, caseNo: input.caseNo })
    return { ok: true, kind: 'night', sourceId: found.id }
  }
  return { ok: false, error: 'Night Visit schedule not found in MIS.' }
}
