import type { VercelRequest, VercelResponse } from '@vercel/node'

/** Communication Formats moved to Agile CRM. */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Location', '/crm')
  return res.status(302).end()
}
