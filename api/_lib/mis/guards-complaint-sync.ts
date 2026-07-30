/**
 * Sync Agile Guards welfare complaints into MIS branch complaint registers.
 */
import { getComplaints as getGuardComplaints } from '../guards/store.js'
import { resolveBranchId } from '../guards/store.js'
import {
  getBranches,
  getComplaints,
  saveComplaints,
  type MisComplaint,
} from './store.js'

function guardMisId(guardId: string): string {
  return `guards:${guardId}`
}

function mapStatus(g: { status: string; isDelayed: boolean }): string {
  if (g.status === 'solved') return 'Closed'
  if (g.isDelayed) return 'Delayed'
  return 'Open'
}

export async function syncGuardsComplaintsToMis(): Promise<{
  ok: boolean
  imported: number
  updated: number
  skipped: number
  errors: string[]
}> {
  const [guardList, misBranches] = await Promise.all([getGuardComplaints(), getBranches(true)])
  let imported = 0
  let updated = 0
  let skipped = 0
  const errors: string[] = []
  const byBranch = new Map<string, MisComplaint[]>()

  for (const g of guardList) {
    if (g.active === false) continue
    try {
      const resolved = resolveBranchId(g.branchId, misBranches)
      if (!resolved) {
        skipped++
        continue
      }
      const branchId = resolved.id
      if (!byBranch.has(branchId)) byBranch.set(branchId, await getComplaints(branchId))
      const list = byBranch.get(branchId)!
      const misId = guardMisId(g.id)
      const idx = list.findIndex((m) => m.id === misId || (m.source === 'guards' && m.code === g.code))
      const delayedNote = g.isDelayed ? ' [DELAYED — SLA breached]' : ''
      const description = `Guard: ${g.guardName} (${g.idNo})\n${g.category} — ${g.subCategory}\n${g.complaintNote}${delayedNote}`.slice(
        0,
        500,
      )
      const row: MisComplaint = {
        id: idx >= 0 ? list[idx].id : misId,
        code: g.code || list[idx]?.code,
        branchId,
        clientName: g.clientName || 'Guard Welfare',
        location: g.location || resolved.name,
        incidentDate: String(g.registeredAt || '').slice(0, 10),
        type: 'Guard',
        description,
        actionTaken: [g.opsResolution, g.deptResolution, g.hodReplyToGuard].filter(Boolean).join(' · ').slice(0, 300),
        momWithin24h: !g.isDelayed,
        status: mapStatus(g),
        reportedBy: g.guardName,
        source: 'guards',
        channel: 'Agile Guards',
        registeredAt: g.registeredAt,
        active: true,
      }
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...row }
        updated++
      } else {
        list.push(row)
        imported++
      }
      byBranch.set(branchId, list)
    } catch (e) {
      errors.push(e instanceof Error ? e.message : 'Sync failed')
    }
  }

  for (const [branchId, list] of byBranch) {
    await saveComplaints(branchId, list)
  }

  return { ok: true, imported, updated, skipped, errors }
}
