import type { VercelRequest, VercelResponse } from '@vercel/node'
import { SUITE_GATES } from '../_lib/suite-gate-config.js'
import { gateRoleFromQuery, renderSuiteGatePage, sendSuiteGate } from '../_lib/suite-gate.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const meta = SUITE_GATES.recruitment
  const role = gateRoleFromQuery(req)
  const roleLabel = role === 'staff' ? 'HODs / Staff' : 'Management'
  return sendSuiteGate(
    res,
    renderSuiteGatePage({
      appId: meta.appId,
      title: meta.title,
      appNumber: meta.number,
      accent: meta.accent,
      role,
      subtitle: `${roleLabel} portal — Command Centre App ${meta.number}`,
      targetUrl: meta.targetUrl!,
    }),
  )
}
