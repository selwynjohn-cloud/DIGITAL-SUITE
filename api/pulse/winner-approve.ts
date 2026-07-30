import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPendingWinner, publishPendingWinner } from '../_lib/pulse/quiz.js'
import { notifyWinnerPublished } from '../_lib/pulse/winner-notify.js'

export const maxDuration = 30

function page(title: string, msg: string, extra = '') {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Agile Pulse — Quiz Winner</title></head>
<body style="font-family:Arial,sans-serif;background:#0f172a;margin:0;padding:40px 16px;color:#fff">
<div style="max-width:440px;margin:0 auto;background:#1e293b;border-radius:16px;padding:28px;text-align:center;border-top:4px solid #c9a84c">
<div style="font-size:22px;font-weight:800;color:#93c5fd;margin-bottom:8px">Agile Pulse</div>
<div style="font-size:18px;font-weight:700;margin-bottom:10px">${title}</div>
<div style="font-size:15px;color:#cbd5e1;line-height:1.5">${msg}</div>
${extra}
</div></body></html>`
}

/**
 * GET /api/pulse/winner-approve?token=SECRET&confirm=1
 * Director taps link from Sunday preview → publish winner + WhatsApp winner.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')

  const token = String(req.query.token ?? '')
  const secret = process.env.PULSE_APPROVE_SECRET?.trim()

  if (!secret || token !== secret) {
    return res.status(401).send(page('Link not valid', 'This approval link is invalid or has expired.'))
  }

  const pending = await getPendingWinner()
  if (!pending) {
    return res.status(200).send(page('Nothing to publish', 'No quiz winner is waiting for approval right now.'))
  }

  const confirm = String(req.query.confirm ?? '') === '1'
  if (!confirm) {
    const confirmLink = `/api/pulse/winner-approve?confirm=1&token=${encodeURIComponent(secret)}`
    const button = `<div style="margin-top:22px">
      <a href="${confirmLink}" style="display:inline-block;background:#16a34a;color:#fff;font-weight:800;padding:16px 30px;border-radius:12px;text-decoration:none;font-size:17px">✅ PUBLISH WINNER</a>
      <div style="margin-top:14px;font-size:13px;color:#94a3b8">This posts the winner's name on the bulletin and sends a congratulations WhatsApp card to the winner.</div>
      <div style="margin-top:10px;font-size:13px;color:#94a3b8">Close this page to skip — nothing is published.</div>
    </div>`
    return res
      .status(200)
      .send(
        page(
          'Publish quiz winner?',
          `<b>${pending.name}</b><br>Week: ${pending.weekKey}<br>Entries: ${pending.entryCount}`,
          button,
        ),
      )
  }

  const published = await publishPendingWinner(pending)
  const notify = await notifyWinnerPublished(pending, published)

  return res.status(200).send(
    page(
      '✅ Winner published!',
      `<b>${published.name}</b> is now on the bulletin winners board (${published.weekKey}).<br><br>` +
        `Winner card WhatsApp: ${notify.winnerSent ? 'sent ✓' : 'could not send'}<br>` +
        `Copy to Director: ${notify.adminSent ? 'sent ✓' : '—'}`,
    ),
  )
}
