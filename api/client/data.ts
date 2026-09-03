import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendClientDoorPin, verifyClientDoorPin } from '../_lib/client-door/pin.js'
import { buildClientDoorMetrics } from '../_lib/client-door/metrics.js'
import { clientDoorReportInnerHtml, clientDoorReportWrapHtml } from '../_lib/client-door/report.js'
import { listStrategicDoorSites, sitesForClientEmail } from '../_lib/client-door/lookup.js'
import { expandMatchedSitesToBooks } from '../_lib/client-door/books.js'
import { recordClientDoorOpen, sendClientDoorOpenMail } from '../_lib/client-door/opens.js'
import {
  clearClientDoorCookie,
  issueClientDoorToken,
  readClientDoorEmail,
  setClientDoorCookie,
} from '../_lib/client-door/session.js'

export const maxDuration = 30

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const body = (req.body ?? {}) as Record<string, unknown>
  const action = String(body.action ?? '')

  try {
    if (action === 'sendPin') {
      const out = await sendClientDoorPin(String(body.email ?? ''))
      return res.status(out.status).json(out.json)
    }
    if (action === 'verifyPin') {
      const out = await verifyClientDoorPin(String(body.email ?? ''), String(body.pin ?? ''))
      if (out.status !== 200 || !out.email) return res.status(out.status).json(out.json)
      const token = await issueClientDoorToken(out.email)
      setClientDoorCookie(res, token, req.headers.host)
      return res.status(200).json({ ok: true })
    }
    if (action === 'logout') {
      clearClientDoorCookie(res, req.headers.host)
      return res.status(200).json({ ok: true })
    }
    if (action === 'boot') {
      const email = await readClientDoorEmail(req, body.sessionToken)
      if (!email) return res.status(401).json({ error: 'Please sign in.' })
      const matched = await sitesForClientEmail(email)
      if (!matched.length) {
        clearClientDoorCookie(res, req.headers.host)
        return res.status(403).json({ error: 'This email is not on the Client Door list.' })
      }
      const all = await listStrategicDoorSites()
      const books = expandMatchedSitesToBooks(matched, all)
      if (!books.length) {
        clearClientDoorCookie(res, req.headers.host)
        return res.status(403).json({ error: 'This email is not on the Client Door list.' })
      }
      const cards: string[] = []
      const allSites = books.flatMap((b) => b.sites)
      let firstMetrics = null as Awaited<ReturnType<typeof buildClientDoorMetrics>> | null
      for (const book of books) {
        const metrics = await buildClientDoorMetrics(book.sites)
        metrics.clientLabel = book.name
        if (!firstMetrics) firstMetrics = metrics
        cards.push(
          `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:16px">${clientDoorReportInnerHtml(metrics, book.sites)}</div>`,
        )
      }
      if (!firstMetrics) {
        return res.status(403).json({ error: 'This email is not on the Client Door list.' })
      }
      const inner = cards.join('')
      const reportHtml = clientDoorReportWrapHtml(firstMetrics.clientLabel, inner)
      await recordClientDoorOpen(email, books.map((b) => b.id))
      await sendClientDoorOpenMail({
        email,
        sites: allSites,
        reportHtml,
        metrics: firstMetrics,
      })
      return res.status(200).json({
        ok: true,
        email,
        books: books.map((b) => ({ id: b.id, name: b.name, siteCount: b.siteCount })),
        sites: allSites.map((s) => ({
          id: s.id,
          name: s.name,
          location: s.location,
          branchName: s.branchName,
          groupLabel: s.groupLabel,
        })),
        metrics: firstMetrics,
        reportHtml: inner,
      })
    }
    return res.status(400).json({ error: 'Unknown action.' })
  } catch (err) {
    console.error('[client/data]', err)
    return res.status(500).json({ error: 'Client Door failed. Please try again.' })
  }
}
