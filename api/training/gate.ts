import type { VercelRequest, VercelResponse } from '@vercel/node'
import { loadBranchLoginOptionsHtml } from '../_lib/branch-login-options.js'
import { SUITE_GATES } from '../_lib/suite-gate-config.js'
import { gateRoleFromQuery, renderSuiteGatePage, sendSuiteGate } from '../_lib/suite-gate.js'
import { trainingTargetUrl } from '../_lib/suite-gate-config.js'

/** After email PIN — Track 1 (OJT) and Track 2 (Digital Learning). */
const TRAINING_HUB = '/training/hub'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const meta = SUITE_GATES.training
  const role = gateRoleFromQuery(req)
  const portal = String(req.query.portal ?? '').toLowerCase()
  const isTrainee = portal === 'trainee'
  const isStaffPortal = portal === 'lecturer' || portal === 'staff' || portal === 'hod' || role === 'staff'
  const isMgmt =
    portal === 'management' ||
    portal === 'mgmt' ||
    (!isStaffPortal && !isTrainee && role === 'management')

  if (isTrainee) {
    const lms = trainingTargetUrl('trainee')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader(
      'Location',
      /agilegroup-digital\.co\.in\/training\/?/i.test(lms)
        ? 'https://guard-training-app.vercel.app/?portal=trainee'
        : lms,
    )
    return res.status(302).end()
  }

  if (!isMgmt) {
    const branchOptionsHtml = await loadBranchLoginOptionsHtml('training')
    return sendSuiteGate(
      res,
      renderSuiteGatePage({
        appId: meta.appId,
        title: 'Agile Training — HOD / Staff',
        appNumber: meta.number,
        accent: meta.accent,
        role: 'staff',
        staffBranchPin: true,
        branchOptionsHtml,
        subtitle:
          'Email PIN login. Then choose Track 1 · On Site Tactical Training (OJT) or Track 2 · Digital Learning Program.',
        targetUrl: TRAINING_HUB,
      }),
    )
  }

  return sendSuiteGate(
    res,
    renderSuiteGatePage({
      appId: meta.appId,
      title: 'Agile Training',
      appNumber: meta.number,
      accent: meta.accent,
      role: 'management',
      subtitle:
        'Type training@agilegroup.co.in (or your work email), tap Send PIN. Then Track 1 (OJT) and Track 2 (Digital Learning) open.',
      targetUrl: TRAINING_HUB,
    }),
  )
}
