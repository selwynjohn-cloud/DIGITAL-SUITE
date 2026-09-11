import type { VercelRequest, VercelResponse } from '@vercel/node'
import { advCopy, advQuizAnswersOk, isAdvLang } from '../_lib/training/fa-advisory-i18n.js'
import { findFaAdvisoryRosterByMobile } from '../_lib/training/fa-advisory-roster.js'
import {
  faAdvisoryStorageOk,
  findFaAdvisoryByMobile,
  listFaAdvisoryPublicBranches,
  saveFaAdvisoryAck,
} from '../_lib/training/fa-advisory-store.js'
import { faDigitsMobile, faIstYmd } from '../_lib/training/fa-store.js'

function json(res: VercelResponse, status: number, body: Record<string, unknown>) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(status).json(body)
}

function istStamp(): string {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function gpsOk(v: string): boolean {
  return /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(String(v || '').trim())
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' })
  const body = (req.body || {}) as Record<string, unknown>
  const action = String(body.action ?? '').trim()
  if (!faAdvisoryStorageOk()) return json(res, 503, { ok: false, error: 'Storage is not configured.' })

  if (action === 'lookup') {
    const mobile = faDigitsMobile(String(body.mobile ?? ''))
    if (mobile.length !== 10) return json(res, 400, { ok: false, error: 'Enter a 10-digit mobile number.' })
    const already = await findFaAdvisoryByMobile(mobile)
    if (already) return json(res, 200, { ok: true, record: already, already: true })
    const branches = await listFaAdvisoryPublicBranches()
    const hit = await findFaAdvisoryRosterByMobile(
      mobile,
      branches.map((b) => b.id),
    )
    if (!hit) return json(res, 200, { ok: true, found: false })
    const branch = branches.find((b) => b.id === hit.branchId)
    return json(res, 200, {
      ok: true,
      found: true,
      name: hit.name,
      employeeId: hit.employeeId || '',
      branchId: hit.branchId,
      branchName: branch?.name || '',
      hdfcSite: hit.hdfcSite || 'HDFC Bank',
      mobile,
    })
  }

  if (action !== 'submit') return json(res, 400, { ok: false, error: 'Unknown action.' })

  const name = String(body.name ?? '').trim()
  const employeeId = String(body.employeeId ?? '').trim() || '-'
  const branchId = String(body.branchId ?? '').trim()
  const hdfcSite = String(body.hdfcSite ?? '').trim() || 'HDFC Bank'
  const mobile = faDigitsMobile(String(body.mobile ?? ''))
  const gps = String(body.gps ?? '').trim()
  const lang = isAdvLang(body.lang) ? String(body.lang) : 'en'
  const answers = advQuizAnswersOk(body.answers)
  if (!name || !branchId) {
    return json(res, 400, {
      ok: false,
      error: 'Fill Agile Branch Name, Facility Attendant name and Mobile Number.',
    })
  }
  if (mobile.length !== 10) return json(res, 400, { ok: false, error: 'Enter a 10-digit mobile number.' })
  if (!answers) return json(res, 400, { ok: false, error: 'Answer all 3 questions correctly, then submit.' })
  if (!gpsOk(gps)) return json(res, 400, { ok: false, error: 'Turn on location, then submit again.' })
  if (body.accepted !== true) return json(res, 400, { ok: false, error: 'Please accept the acknowledgement.' })

  const branches = await listFaAdvisoryPublicBranches()
  const branch = branches.find((b) => b.id === branchId)
  if (!branch) return json(res, 400, { ok: false, error: 'Pick a valid Agile Branch.' })

  const already = await findFaAdvisoryByMobile(mobile)
  if (already) return json(res, 200, { ok: true, record: already, already: true })

  const copy = advCopy(lang)
  const rec = await saveFaAdvisoryAck({
    name,
    employeeId,
    client: 'HDFC Bank',
    branchId: branch.id,
    branchName: branch.name,
    hdfcSite,
    mobile,
    lang,
    langName: copy.native || copy.name,
    answers,
    score: '3/3',
    gps,
    accepted: true,
    ymd: faIstYmd(),
    submittedAt: istStamp(),
    submittedAtIso: new Date().toISOString(),
    device: String(body.device ?? '').slice(0, 240),
  })
  return json(res, 200, { ok: true, record: rec })
}
