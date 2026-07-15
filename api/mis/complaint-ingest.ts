import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ingestComplaintEmail, ingestComplaintEmails, isAllowedDirectorInboxEmail, type InboxEmailPayload } from '../_lib/mis/complaint-inbox.js'
import { misStorageOk } from '../_lib/mis/store.js'

function ingestAuthed(req: VercelRequest, body: Record<string, unknown>): boolean {
  const secret = process.env.MIS_COMPLAINT_INGEST_SECRET?.trim()
  if (!secret) return false
  const hdr = String(req.headers['x-mis-ingest-secret'] ?? '')
  const bodySecret = String(body.secret ?? '')
  return hdr === secret || bodySecret === secret
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = (req.body ?? {}) as Record<string, unknown>

  if (!ingestAuthed(req, body)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (!misStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })

  const emails = Array.isArray(body.emails) ? body.emails : null
  if (emails) {
    const list = emails.slice(0, 50).map((e: Record<string, unknown>) => ({
      emailId: String(e.emailId ?? e.id ?? ''),
      from: String(e.from ?? ''),
      subject: String(e.subject ?? ''),
      body: String(e.body ?? e.snippet ?? ''),
      date: String(e.date ?? ''),
      to: String(e.to ?? ''),
    })) as InboxEmailPayload[]
    const allowed = list.filter(isAllowedDirectorInboxEmail)
    const result = await ingestComplaintEmails(allowed)
    return res.status(200).json({ ok: true, ...result, scanned: allowed.length, skippedPersonal: list.length - allowed.length })
  }

  const single: InboxEmailPayload = {
    emailId: String(body.emailId ?? body.id ?? ''),
    from: String(body.from ?? ''),
    subject: String(body.subject ?? ''),
    body: String(body.body ?? body.snippet ?? ''),
    date: String(body.date ?? ''),
    to: String(body.to ?? ''),
  }
  if (!isAllowedDirectorInboxEmail(single)) {
    return res.status(200).json({ ok: true, skipped: true, reason: 'Not addressed to director@agilegroup.co.in' })
  }
  const one = await ingestComplaintEmail(single)
  if (!one.ok && !one.skipped) return res.status(400).json({ error: one.reason || 'Could not import' })
  return res.status(200).json({ ok: true, ...one })
}
