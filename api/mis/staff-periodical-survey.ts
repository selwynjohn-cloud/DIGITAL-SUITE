import type { VercelRequest, VercelResponse } from '@vercel/node'
import { specialSurveyStaffHandler } from '../_lib/mis/periodical-survey-page.js'

/** Old Periodical Survey Format URL — same Site Security Assessment (SSA) pages. */
export default function handler(req: VercelRequest, res: VercelResponse) {
  return specialSurveyStaffHandler(req, res)
}
