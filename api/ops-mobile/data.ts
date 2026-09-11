import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import {
  findGuard,
  findGuardInMis,
  getDutySessions,
  getOpsGuards,
  GUARD_CSV_TEMPLATE,
  maskAadhaar,
  normaliseMobile,
  openDutyForGuard,
  opsNid,
  parseGuardCsv,
  saveDutySessions,
  saveOpsGuards,
  syncOpsGuardsFromMis,
  type OpsDutySession,
  type OpsGuard,
} from '../_lib/ops-mobile/store.js'

async function resolveGuard(idNo: string, mobile: string): Promise<OpsGuard | null> {
  let guards = await getOpsGuards()
  if (!guards.length) {
    await syncOpsGuardsFromMis()
    guards = await getOpsGuards()
  }
  let g = findGuard(guards, idNo, mobile)
  if (g) return g
  g = await findGuardInMis(idNo, mobile)
  if (!g) return null
  // Cache MIS hit so next duty start/end is fast
  const key = `${g.idNo.toLowerCase()}|${normaliseMobile(g.mobile)}`
  const byKey = new Map(guards.map((x) => [`${x.idNo.toLowerCase()}|${normaliseMobile(x.mobile)}`, x]))
  byKey.set(key, g)
  await saveOpsGuards([...byKey.values()])
  return g
}

export const maxDuration = 60

async function adminOk(body: Record<string, unknown>, req: VercelRequest): Promise<boolean> {
  const token = String(body.sessionToken ?? req.query.sessionToken ?? '').trim()
  if (!token) return false
  const s = await verifyAppSession(token, 'ops-mobile')
  if (s) return true
  // Allow guards management session too
  const g = await verifyAppSession(token, 'guards')
  return Boolean(g)
}

function publicGuard(g: OpsGuard) {
  return {
    id: g.id,
    branch: g.branch,
    clientSite: g.clientSite,
    idNo: g.idNo,
    name: g.name,
    mobile: g.mobile,
    aadhaarMasked: maskAadhaar(g.aadhaar),
    doj: g.doj,
    idCardRenewal: g.idCardRenewal,
    designation: g.designation,
    shift: g.shift,
    active: g.active,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>
  const action = String(body.action ?? '').trim()

  try {
    if (action === 'template') {
      return res.status(200).json({ ok: true, csv: GUARD_CSV_TEMPLATE })
    }

    if (action === 'lookup') {
      const g = await resolveGuard(String(body.idNo ?? ''), String(body.mobile ?? ''))
      if (!g) return res.status(404).json({ error: 'Guard not found. Check ID No. and Mobile.' })
      const sessions = await getDutySessions()
      const open = openDutyForGuard(sessions, g.id)
      return res.status(200).json({
        ok: true,
        guard: publicGuard(g),
        onDuty: Boolean(open),
        duty: open
          ? { id: open.id, startedAt: open.startedAt, shiftHours: open.shiftHours, clientSite: open.clientSite }
          : null,
      })
    }

    if (action === 'dutyStart') {
      const g = await resolveGuard(String(body.idNo ?? ''), String(body.mobile ?? ''))
      if (!g) return res.status(404).json({ error: 'Guard not found. Check ID No. and Mobile.' })
      const sessions = await getDutySessions()
      const open = openDutyForGuard(sessions, g.id)
      if (open) {
        return res.status(400).json({
          error: 'Already on duty. Please end duty first.',
          duty: { id: open.id, startedAt: open.startedAt },
        })
      }
      const hours = Number(body.shiftHours) === 8 ? 8 : 12
      const lat = body.lat != null && body.lat !== '' ? Number(body.lat) : null
      const lng = body.lng != null && body.lng !== '' ? Number(body.lng) : null
      const row: OpsDutySession = {
        id: opsNid('duty'),
        guardId: g.id,
        idNo: g.idNo,
        name: g.name,
        mobile: g.mobile,
        branch: g.branch,
        clientSite: String(body.clientSite ?? g.clientSite ?? '').trim() || g.clientSite,
        shiftHours: hours,
        startedAt: new Date().toISOString(),
        endedAt: '',
        startLat: Number.isFinite(lat) ? lat : null,
        startLng: Number.isFinite(lng) ? lng : null,
        endLat: null,
        endLng: null,
        status: 'on_duty',
      }
      sessions.unshift(row)
      const saved = await saveDutySessions(sessions.slice(0, 5000))
      if (!saved) return res.status(503).json({ error: 'Could not save duty start. Try again.' })
      return res.status(200).json({
        ok: true,
        message: `Duty started — ${g.name}. Shift ${hours} hours.`,
        duty: { id: row.id, startedAt: row.startedAt, shiftHours: row.shiftHours },
      })
    }

    if (action === 'dutyEnd') {
      const g = await resolveGuard(String(body.idNo ?? ''), String(body.mobile ?? ''))
      if (!g) return res.status(404).json({ error: 'Guard not found. Check ID No. and Mobile.' })
      const sessions = await getDutySessions()
      const open = openDutyForGuard(sessions, g.id)
      if (!open) return res.status(400).json({ error: 'No open duty found. Start duty first.' })
      const lat = body.lat != null && body.lat !== '' ? Number(body.lat) : null
      const lng = body.lng != null && body.lng !== '' ? Number(body.lng) : null
      open.status = 'ended'
      open.endedAt = new Date().toISOString()
      open.endLat = Number.isFinite(lat) ? lat : null
      open.endLng = Number.isFinite(lng) ? lng : null
      const saved = await saveDutySessions(sessions)
      if (!saved) return res.status(503).json({ error: 'Could not save duty end. Try again.' })
      return res.status(200).json({
        ok: true,
        message: `Duty ended — ${g.name}. Thank you.`,
        duty: { id: open.id, startedAt: open.startedAt, endedAt: open.endedAt },
      })
    }

    // ---- Admin actions ----
    if (!(await adminOk(body, req))) {
      return res.status(401).json({ error: 'Please sign in (Ops Mobile admin).' })
    }

    if (action === 'syncFromMaster') {
      const result = await syncOpsGuardsFromMis({
        branchFilter: String(body.branchFilter ?? '').trim() || undefined,
      })
      if (!result.ok) return res.status(503).json({ error: result.error || 'Sync failed' })
      return res.status(200).json(result)
    }

    if (action === 'listGuards') {
      const branch = String(body.branch ?? '').trim().toLowerCase()
      let list = await getOpsGuards()
      if (!list.length) {
        await syncOpsGuardsFromMis()
        list = await getOpsGuards()
      }
      if (branch) list = list.filter((g) => g.branch.toLowerCase().includes(branch))
      list = list.slice().sort((a, b) => a.name.localeCompare(b.name))
      return res.status(200).json({
        ok: true,
        count: list.length,
        guards: list.map(publicGuard),
      })
    }

    if (action === 'listOnDuty') {
      const sessions = await getDutySessions()
      const on = sessions.filter((s) => s.status === 'on_duty')
      return res.status(200).json({ ok: true, count: on.length, sessions: on })
    }

    if (action === 'importGuards') {
      const mode = String(body.mode ?? 'merge').trim() // merge | replace
      const parsed = parseGuardCsv(String(body.csv ?? ''))
      if (parsed.error) return res.status(400).json({ error: parsed.error })
      const now = new Date().toISOString()
      const existing = mode === 'replace' ? [] : await getOpsGuards()
      const byKey = new Map(existing.map((g) => [`${g.idNo.toLowerCase()}|${normaliseMobile(g.mobile)}`, g]))
      let added = 0
      let updated = 0
      for (const row of parsed.rows) {
        const key = `${String(row.idNo).toLowerCase()}|${normaliseMobile(String(row.mobile))}`
        const prev = byKey.get(key)
        if (prev) {
          Object.assign(prev, row, { updatedAt: now, active: true })
          updated++
        } else {
          const g: OpsGuard = {
            id: opsNid('og'),
            branch: row.branch || 'Hyderabad-A',
            clientSite: row.clientSite || '',
            idNo: String(row.idNo),
            name: String(row.name),
            mobile: normaliseMobile(String(row.mobile)),
            aadhaar: String(row.aadhaar || ''),
            doj: String(row.doj || ''),
            idCardRenewal: String(row.idCardRenewal || ''),
            designation: String(row.designation || 'Security Guard'),
            shift: String(row.shift || ''),
            active: true,
            createdAt: now,
            updatedAt: now,
          }
          byKey.set(key, g)
          added++
        }
      }
      const list = [...byKey.values()]
      const saved = await saveOpsGuards(list)
      if (!saved) return res.status(503).json({ error: 'Could not save guards.' })
      return res.status(200).json({ ok: true, added, updated, total: list.length })
    }

    return res.status(400).json({ error: 'Unknown action' })
  } catch (err) {
    console.error('[ops-mobile/data]', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Server error' })
  }
}
