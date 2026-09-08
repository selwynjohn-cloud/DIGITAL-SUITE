import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import {
  DEFAULT_SETTINGS,
  deleteApplicant,
  getAcademyVideos,
  getAnthems,
  getApplicants,
  getJobs,
  getSettings,
  normalizeApplicant,
  replaceApplicants,
  saveAcademyVideos,
  saveAnthems,
  saveJobs,
  saveSettings,
  sjStorageOk,
  type SjAcademyVideo,
  type SjAnthem,
  type SjApplicant,
  type SjJob,
  type SjSettings,
} from '../_lib/securityjob/store.js'
import { sjToRegisteredCandidate } from '../_lib/recruitment/registration-store.js'
import {
  custodyExcelPayload,
  ensureCandidateCustody,
  rememberCandidatesInCustody,
} from '../_lib/recruitment/candidate-custody.js'

function sanitiseSettings(v: unknown): SjSettings {
  const d = (v ?? {}) as Partial<SjSettings>
  const s = (x: unknown, m = 200) => String(x ?? '').slice(0, m)
  const show = String(d.adminOpsShow ?? DEFAULT_SETTINGS.adminOpsShow).trim()
  return {
    guardsPlaced: s(d.guardsPlaced, 120),
    locations: s(d.locations, 120),
    states: s(d.states, 120),
    helpline: s(d.helpline, 120) || DEFAULT_SETTINGS.helpline,
    whatsapp: s(d.whatsapp, 120),
    email1: s(d.email1, 120),
    email2: s(d.email2, 120),
    adminOpsShow: show === 'No' ? 'No' : 'Yes',
    adminOpsEyebrow: s(d.adminOpsEyebrow, 120) || DEFAULT_SETTINGS.adminOpsEyebrow,
    adminOpsTitle: s(d.adminOpsTitle, 200) || DEFAULT_SETTINGS.adminOpsTitle,
    adminOpsText: s(d.adminOpsText, 500) || DEFAULT_SETTINGS.adminOpsText,
    adminOpsButton: s(d.adminOpsButton, 80) || DEFAULT_SETTINGS.adminOpsButton,
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
    const [settings, jobs, applicants, anthems, academyVideos] = await Promise.all([
      getSettings(),
      getJobs(),
      getApplicants(),
      getAnthems(),
      getAcademyVideos(),
    ])
    return res.status(200).json({
      ok: true,
      settings,
      jobs,
      applicants,
      anthems,
      academyVideos,
      storageOk: sjStorageOk(),
      blobReady: Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()),
    })
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

  if (action === 'saveAnthems') {
    const arr = Array.isArray(body.anthems) ? (body.anthems as SjAnthem[]) : []
    await saveAnthems(arr)
    const anthems = await getAnthems()
    return res.status(200).json({ ok: true, anthems })
  }

  if (action === 'saveAcademyVideos') {
    const arr = Array.isArray(body.academyVideos) ? (body.academyVideos as SjAcademyVideo[]) : []
    await saveAcademyVideos(arr)
    const academyVideos = await getAcademyVideos()
    return res.status(200).json({ ok: true, academyVideos })
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
        email: st((a as any)?.email, 120).toLowerCase(),
        dob: st((a as any)?.dob, 20),
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
    const existing = await getApplicants()
    await rememberCandidatesInCustody(
      [...existing, ...list].map((a) => sjToRegisteredCandidate(a)),
    )
    await replaceApplicants(list, counter)
    const applicants = await getApplicants()
    return res.status(200).json({ ok: true, count: applicants.length })
  }

  if (action === 'deleteApplicant') {
    const id = String(body.id ?? '')
    const current = await getApplicants()
    const hit = current.find((a) => a.id === id)
    if (hit) await rememberCandidatesInCustody([sjToRegisteredCandidate(hit)])
    await deleteApplicant(id)
    const applicants = await getApplicants()
    return res.status(200).json({ ok: true, applicants })
  }

  if (action === 'downloadCustody') {
    const file = await custodyExcelPayload()
    return res.status(200).json({ ok: true, ...file })
  }

  if (action === 'emailCustody') {
    const result = await ensureCandidateCustody({ forceMail: true })
    if (!result.ok) return res.status(500).json({ error: result.error || 'Could not email the safe copy.' })
    return res.status(200).json({
      ok: true,
      count: result.synced,
      mailed: result.mailed,
      filename: result.filename,
    })
  }

  return res.status(400).json({ error: 'Unknown action.' })
}
