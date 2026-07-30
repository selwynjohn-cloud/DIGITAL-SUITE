import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clearPending, getPending, waSendText } from '../_lib/pulse/whatsapp.js'
import { fetchNewsSections, totalNewsItems } from '../_lib/pulse/news.js'

export const maxDuration = 60

function page(title: string, msg: string, extra = '') {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Agile Pulse</title></head>
<body style="font-family:Arial,sans-serif;background:#0f172a;margin:0;padding:40px 16px;color:#fff">
<div style="max-width:440px;margin:0 auto;background:#1e293b;border-radius:16px;padding:28px;text-align:center;border-top:4px solid #c9a84c">
<div style="font-size:22px;font-weight:800;color:#93c5fd;margin-bottom:8px">Agile Pulse</div>
<div style="font-size:18px;font-weight:700;margin-bottom:10px">${title}</div>
<div style="font-size:15px;color:#cbd5e1;line-height:1.5">${msg}</div>
${extra}
</div></body></html>`
}

/**
 * GET /api/pulse/approve?token=SECRET&mode=test|all
 * Tapping the link (from the preview) distributes the pending edition:
 *  - mode=test  -> Post 2 to the first group only (HOD) for a safe check
 *  - mode=all   -> Post 1 to the Channel + Post 2 to all groups
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')

  const token = String(req.query.token ?? '')
  const mode = String(req.query.mode ?? 'all')
  const secret = process.env.PULSE_APPROVE_SECRET?.trim()

  if (!secret || token !== secret) {
    return res.status(401).send(page('Link not valid', 'This approval link is invalid or has expired.'))
  }

  const pending = await getPending()
  if (!pending) {
    return res.status(200).send(page('Nothing to send', 'No edition is waiting to be sent right now.'))
  }

  const channel = process.env.WHAPI_CHANNEL_ID?.trim()
  const groups = (process.env.WHAPI_GROUP_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (mode === 'test') {
    const director = (process.env.ADMIN_WHATSAPP ?? '').replace(/\D/g, '')
    if (!director) return res.status(200).send(page('No number set', 'No Director number is configured yet.'))
    await waSendText(director, pending.msg2)
    return res
      .status(200)
      .send(
        page(
          '✅ Test sent to you',
          'Post 2 was sent to the Director only (your WhatsApp). No groups were touched. If it looks good, go back to the preview and tap <b>SEND TO ALL</b>.',
        ),
      )
  }

  // SAFETY: require a confirmation tap before blasting everyone, so a single
  // accidental tap of "SEND TO ALL" never publishes to all groups + channel.
  const confirm = String(req.query.confirm ?? '') === '1'
  if (!confirm) {
    const confirmLink = `/api/pulse/approve?mode=all&confirm=1&token=${encodeURIComponent(secret)}`
    const button = `<div style="margin-top:22px">
      <a href="${confirmLink}" style="display:inline-block;background:#16a34a;color:#fff;font-weight:800;padding:16px 30px;border-radius:12px;text-decoration:none;font-size:17px">✅ YES — SEND TO EVERYONE</a>
      <div style="margin-top:14px;font-size:13px;color:#94a3b8">If you did not mean to, just close this page — nothing is sent.</div>
    </div>`
    return res
      .status(200)
      .send(
        page(
          'Send to everyone?',
          `This will post <b>Post 1</b> to your WhatsApp Channel and <b>Post 2</b> to all groups (Team Agile + Security Job groups). — <b>${pending.edition}</b>`,
          button,
        ),
      )
  }

  // SAFEGUARD: never distribute a bulletin that currently has no news.
  const sections = await fetchNewsSections()
  if (totalNewsItems(sections) === 0) {
    return res
      .status(200)
      .send(
        page(
          'Not sent — no news yet',
          'The bulletin has no fresh news at this moment, so nothing was sent to the Channel or groups. Please try again in a little while.',
        ),
      )
  }

  if (channel) await waSendText(channel, pending.msg1)
  let sent = 0
  for (const g of groups) {
    await waSendText(g, pending.msg2)
    sent++
  }
  await clearPending()

  // Confirmation back to the Director on WhatsApp.
  const director = (process.env.ADMIN_WHATSAPP ?? '').replace(/\D/g, '')
  if (director) {
    await waSendText(
      director,
      `✅ Sent, sir! Post 1 → Channel, and Post 2 → ${sent} groups (Team Agile + Security Job groups). — ${pending.edition}`,
    )
  }

  return res
    .status(200)
    .send(
      page('✅ Sent!', `Post 1 went to your Channel and Post 2 went to ${sent} group(s). Well done, sir.`),
    )
}
