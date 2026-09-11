import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applySjRegAskChoice, sjAskDatePhone } from '../_lib/recruitment/sj-reg-ask-date.js'
import { getApplicants, sjStorageOk } from '../_lib/securityjob/store.js'

/** POST /api/securityjob/join-date — tentative date from the thank-you page. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!sjStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })

  const body = (req.body ?? {}) as Record<string, unknown>
  const phone = sjAskDatePhone(String(body.phone ?? ''))
  const regCode = String(body.regCode ?? '').trim()
  const rawChoice = String(body.choice ?? '').trim().toLowerCase()
  const dateText = String(body.date ?? body.dateText ?? '').trim()
  const choice =
    rawChoice === 'week' ||
    rawChoice === 'next' ||
    rawChoice === 'tomorrow' ||
    rawChoice === 'hold' ||
    rawChoice === 'date'
      ? rawChoice
      : dateText
        ? 'date'
        : ''

  if (phone.length < 10 || !regCode) {
    return res.status(400).json({ error: 'Please use the same mobile and registration code.' })
  }
  if (!choice) return res.status(400).json({ error: 'Please tap This week, Next week, Not now, or pick a date.' })

  const all = await getApplicants()
  const hit = all.find(
    (a) => sjAskDatePhone(a.phone) === phone && String(a.regCode || '').trim() === regCode,
  )
  if (!hit) return res.status(404).json({ error: 'Registration not found. Please register again.' })

  const saved = await applySjRegAskChoice({
    phone: hit.phone,
    id: hit.id,
    name: hit.name,
    regCode: hit.regCode,
    location: hit.location,
    choice,
    dateText,
    notifyWhatsApp: true,
  })
  if (!saved.ok) return res.status(400).json({ error: saved.error || 'Could not save the date.' })
  const iso = saved.tentativeJoinDate || ''
  const parts = iso.split('-')
  const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : iso
  return res.status(200).json({
    ok: true,
    hold: Boolean(saved.hold),
    tentativeJoinDate: iso,
    displayDate,
  })
}
