/**
 * Company link → Gate + Officer portal. No email PIN.
 * Marks the Management menu-5 row as verified on first open.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clientPortalPage } from '../_lib/visitors/client-portal-page.js'
import { ensureHqClientTenant, getHqClientByToken, markClientLinkVerified } from '../_lib/visitors/hq-store.js'

function esc(s: string) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function failPage(title: string, body: string) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
body{font-family:'Segoe UI',Arial,sans-serif;background:#0b1220;color:#e2e8f0;padding:22px}
.card{max-width:520px;margin:8vh auto;background:#111a30;border:1px solid #22304f;border-radius:14px;padding:28px;text-align:center}
</style></head><body><div class="card"><h1 style="color:#fff">${esc(title)}</h1><p>${body}</p></div></body></html>`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  const token = String(req.query?.token ?? '').trim()
  if (!token) {
    return res.status(400).send(failPage('Visitor Management', 'This company link is missing. Ask Agile for a new link.'))
  }
  const found = await getHqClientByToken(token)
  if (!found) {
    return res.status(404).send(failPage('Visitor Management', 'This company link is not on our list. Ask Agile to send it again.'))
  }
  await markClientLinkVerified(token)
  await ensureHqClientTenant(found)
  return res.status(200).send(clientPortalPage(found))
}
