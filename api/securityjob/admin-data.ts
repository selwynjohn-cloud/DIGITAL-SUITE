import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import {
  deleteApplicant,
  getApplicants,
  getJobs,
  getSettings,
  normalizeApplicant,
  replaceApplicants,
  saveJobs,
  saveSettings,
  sjStorageOk,
  type SjApplicant,
  type SjJob,
  type SjSettings,
} from '../_lib/securityjob/store.js'

function sanitiseSettings(v: unknown): SjSettings {
  const d = (v ?? {}) as Partial<SjSettings>
  const s = (x: unknown) => String(x ?? '').slice(0, 120)
  return {
    guardsPlaced: s(d.guardsPlaced),
    locations: s(d.locations),
    states: s(d.states),
    whatsapp: s(d.whatsapp),
    email1: s(d.email1),
    email2: s(d.email2),
  }
}

function sanitiseJobs(v: unknown): SjJob[] {
  const arr = Array.isArray(v) ? v : []
  const s = (x: unknown, m = 300) => String(x ?? '').slice(0, m)
  return arr.slice(0, 50).map((j) => {
    const status = String((j as any)?.status ?? 'Active')
    return {
      id: s((j as any)?.id) || `${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
      title: s((j as any)?.title),
      status: (['Active', 'Upcoming', 'Closed'].includes(status) ? status : 'Active') as SjJob['status'],
      locations: s((j as any)?.locations),
      eligibility: s((j as any)?.eligibility),
      wages: s((j as any)?.wages),
      postedDate: s((j as any)?.postedDate, 40),
      closingDate: s((j as any)?.closingDate, 40),
      benefits: Array.isArray((j as any)?.benefits) ? (j as any).benefits.map((b: unknown) => s(b, 120)).slice(0, 40) : [],
    }
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = (req.body ?? {}) as Record<string, unknown>
  const action = String(body.action ?? '')

  if (action === 'status') {
    return res.status(200).json({ ok: true, storage: { ok: sjStorageOk() } })
  }

  const otpSession = await verifyAppSession(String(body.sessionToken ?? ''), 'securityjob')
  if (!otpSession) {
    return res.status(401).json({ error: 'Please sign in with your @agilegroup.co.in email OTP.' })
  }

  if (action === 'login' || action === 'load') {
    const [settings, jobs, applicants] = await Promise.all([getSettings(), getJobs(), getApplicants()])
    return res.status(200).json({ ok: true, settings, jobs, applicants, storageOk: sjStorageOk() })
  }

  if (!sjStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })

  if (action === 'saveSettings') {
    await saveSettings(sanitiseSettings(body.settings))
    return res.status(200).json({ ok: true })
  }

  if (action === 'saveJobs') {
    const jobs = sanitiseJobs(body.jobs)
    await saveJobs(jobs)
    return res.status(200).json({ ok: true, jobs })
  }

  if (action === 'importApplicants') {
    const arr = Array.isArray(body.applicants) ? body.applicants : []
    const st = (x: unknown, m = 200) => String(x ?? '').slice(0, m)
    const list: SjApplicant[] = arr.slice(0, 2000).map((a) =>
      normalizeApplicant({
        id: st((a as any)?.id, 40) || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
        regCode: st((a as any)?.regCode, 60),
        name: st((a as any)?.name),
        phone: st((a as any)?.phone, 20),
        location: st((a as any)?.location),
        role: st((a as any)?.role),
        experience: st((a as any)?.experience, 60),
        education: st((a as any)?.education),
        language: st((a as any)?.language, 60),
        photoId: st((a as any)?.photoId, 60),
        createdAt: st((a as any)?.createdAt, 60),
      }),
    )
    const counter = Number(body.counter) || list.length
    await replaceApplicants(list, counter)
    const applicants = await getApplicants()
    return res.status(200).json({ ok: true, count: applicants.length })
  }

  if (action === 'deleteApplicant') {
    await deleteApplicant(String(body.id ?? ''))
    const applicants = await getApplicants()
    return res.status(200).json({ ok: true, applicants })
  }

  return res.status(400).json({ error: 'Unknown action.' })
}
