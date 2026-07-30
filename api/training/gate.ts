import type { VercelRequest, VercelResponse } from '@vercel/node'
import { SUITE_GATES, trainingTargetUrl } from '../_lib/suite-gate-config.js'
import { gateRoleFromQuery, renderSuiteGatePage, sendSuiteGate } from '../_lib/suite-gate.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const meta = SUITE_GATES.training
  const role = gateRoleFromQuery(req)
  const portal = String(req.query.portal ?? '')
  const isTrainee = portal === 'trainee'
  const roleLabel = isTrainee ? 'Trainees' : role === 'staff' ? 'Staff / Lecturer' : 'Management'
  const otpRole = isTrainee ? 'staff' : role
  return sendSuiteGate(
    res,
    renderSuiteGatePage({
      appId: meta.appId,
      title: meta.title,
      appNumber: meta.number,
      accent: meta.accent,
      role: otpRole,
      subtitle: `${roleLabel} portal — Command Centre App ${meta.number}`,
      targetUrl: trainingTargetUrl(portal || (role === 'management' ? 'management' : 'lecturer')),
    }),
  )
}
