import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ackListRows } from '../_lib/training/fa-advisory-recipients.js'
import { loadFaAdvisoryAcksRange } from '../_lib/training/fa-advisory-store.js'
import { findFaHdfcPackByToken } from '../_lib/training/fa-hdfc-pack.js'
import { faHdfcMissingReportHtml, faHdfcReportPageHtml } from '../_lib/training/fa-hdfc-report.js'
import { faIstYmd, loadFaAcksRange } from '../_lib/training/fa-store.js'

/** Public HDFC Training report — no PIN. Branch token only. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  const token = String(req.query.t ?? req.query.token ?? '').trim()
  const pack = await findFaHdfcPackByToken(token)
  if (!pack) return res.status(404).send(faHdfcMissingReportHtml())
  const from = pack.fromYmd || faIstYmd().slice(0, 8) + '01'
  const to = pack.toYmd || faIstYmd()
  const [advRaw, trainRaw] = await Promise.all([
    loadFaAdvisoryAcksRange({ branchIds: [pack.branchId], fromYmd: from, toYmd: to }),
    loadFaAcksRange({ branchIds: [pack.branchId], fromYmd: from, toYmd: to }),
  ])
  const html = faHdfcReportPageHtml({
    advRows: ackListRows(advRaw),
    trainRows: trainRaw,
    branchLabel: pack.branchName || 'Branch',
    period: `${from} to ${to}`,
    pack,
  })
  return res.status(200).send(html)
}
