import type { VercelRequest, VercelResponse } from '@vercel/node'
import { loadBranchLoginOptionsHtml } from '../_lib/branch-login-options.js'
import { SUITE_GATES } from '../_lib/suite-gate-config.js'
import { gateRoleFromQuery, renderSuiteGatePage, sendSuiteGate } from '../_lib/suite-gate.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const meta = SUITE_GATES.deployment
  const role = gateRoleFromQuery(req)
  const portal = String(req.query.portal ?? '').toLowerCase()
  const effectiveRole = portal === 'staff' || portal === 'management' ? (portal as 'staff' | 'management') : role
  const roleLabel = effectiveRole === 'staff' ? 'HODs / Staff' : 'Management'
  const targetUrl =
    effectiveRole === 'staff' ? '/deployment-staff' : '/deployment-management'
  const branchOptionsHtml =
    effectiveRole === 'staff' ? await loadBranchLoginOptionsHtml('deployment') : undefined
  return sendSuiteGate(
    res,
    renderSuiteGatePage({
      appId: meta.appId,
      title: meta.title,
      appNumber: meta.number,
      accent: meta.accent,
      role: effectiveRole,
      staffBranchPin: effectiveRole === 'staff',
      branchOptionsHtml,
      subtitle: `${roleLabel} portal — Command Centre App ${meta.number}`,
      targetUrl,
    }),
  )
}
