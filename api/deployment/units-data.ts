import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import { getBranches, getActiveBranch, misStorageOk } from '../_lib/mis/store.js'
import {
  UNIT_ISSUE_ITEMS,
  getUnitIssues,
  normalizeUnitIssueRow,
  saveUnitIssues,
  seedUnitIssuesFromClients,
} from '../_lib/deployment/unit-issue.js'

async function authUnits(sessionToken: string, branchId: string) {
  const session = await verifyAppSession(sessionToken, 'mis-report')
  if (!session) return { error: 'auth' as const }
  const id = String(branchId ?? '').trim()
  if (!id) return { error: 'auth' as const }
  const b = await getActiveBranch(id)
  if (!b) {
    const exists = (await getBranches()).find((x) => x.id === id)
    if (exists && exists.active === false) {
      return { error: 'deactivated' as const }
    }
    return { error: 'auth' as const }
  }
  return { branch: b } as const
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = (req.body ?? {}) as Record<string, unknown>
  const action = String(body.action ?? '')

  if (action === 'branches') {
    const branches = await getBranches(true)
    return res.status(200).json({ ok: true, branches: branches.map((b) => ({ id: b.id, name: b.name })) })
  }

  const branchId = String(body.branchId ?? '')
  const sessionToken = String(body.sessionToken ?? '')
  const auth = await authUnits(sessionToken, branchId)
  if ('error' in auth) {
    if (auth.error === 'deactivated') {
      return res.status(403).json({
        error: 'This branch is deactivated. Only activated branch teams can access the portal. Contact management.',
      })
    }
    return res.status(401).json({ error: 'Please sign in with your @agilegroup.co.in email OTP.' })
  }
  const branch = auth.branch
  if (!misStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })

  if (action === 'load') {
    const seed = body.seed === true
    const rows = seed ? await seedUnitIssuesFromClients(branchId) : await getUnitIssues(branchId)
    return res.status(200).json({ ok: true, branchName: branch.name, items: UNIT_ISSUE_ITEMS, rows })
  }

  if (action === 'save') {
    const arr = Array.isArray(body.rows) ? body.rows : []
    const list = arr.slice(0, 5000).map((r: Record<string, unknown>) => normalizeUnitIssueRow(r, branchId))
    await saveUnitIssues(branchId, list)
    return res.status(200).json({ ok: true, count: list.length })
  }

  return res.status(400).json({ error: 'Unknown action.' })
}
