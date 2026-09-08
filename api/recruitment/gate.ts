import type { VercelRequest, VercelResponse } from '@vercel/node'
import { loadBranchLoginOptionsHtml } from '../_lib/branch-login-options.js'
import { SUITE_GATES } from '../_lib/suite-gate-config.js'
import { renderSuiteGatePage, sendSuiteGate } from '../_lib/suite-gate.js'

function recruitGateRole(req: VercelRequest): 'staff' | 'management' {
  const q = req.query || {}
  const portal = String(q.portal ?? q.suite_role ?? '').trim().toLowerCase()
  if (portal === 'staff' || portal === 'hod') return 'staff'
  return 'management'
}

/** After email PIN, open the suite Recruitment app (with DRR) — not the old Google script. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const meta = SUITE_GATES.recruitment
  const role = recruitGateRole(req)
  const roleLabel = role === 'staff' ? 'HODs / Staff' : 'Management'
  const branchOptionsHtml = role === 'staff' ? await loadBranchLoginOptionsHtml('recruitment') : undefined
  const targetUrl =
    role === 'staff' ? '/recruitment/?portal=staff' : '/recruitment/?portal=management'
  return sendSuiteGate(
    res,
    renderSuiteGatePage({
      appId: meta.appId,
      title: meta.title,
      appNumber: meta.number,
      accent: meta.accent,
      role,
      staffBranchPin: role === 'staff',
      branchOptionsHtml,
      subtitle: `${roleLabel} portal — Command Centre App ${meta.number}`,
      targetUrl,
    }),
  )
}
