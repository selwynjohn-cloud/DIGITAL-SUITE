import type { VercelRequest, VercelResponse } from '@vercel/node'
import { FA_CORRECT, faCopy, isFaLang } from '../_lib/training/fa-i18n.js'
import { faCertificateHtml, sendFaAckMail } from '../_lib/training/fa-mail.js'
import { sendFaAckWhatsApp } from '../_lib/training/fa-wa.js'
import {
  faDigitsMobile,
  faIstYmd,
  faStorageOk,
  findFaAckById,
  findFaAckToday,
  listFaPublicBranches,
  saveFaAck,
} from '../_lib/training/fa-store.js'

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

  if (action === 'options') {
    const branches = await listFaPublicBranches()
    return json(res, 200, { ok: true, branches })
  }

  if (action === 'certificate') {
    const rec = await findFaAckById(String(body.id ?? ''), {
      branchId: String(body.branchId ?? ''),
      ymd: String(body.ymd ?? ''),
    })
    if (!rec) return json(res, 404, { ok: false, error: 'Certificate not found.' })
    return json(res, 200, { ok: true, html: faCertificateHtml(rec), record: rec })
  }

  if (action !== 'submit') return json(res, 400, { ok: false, error: 'Unknown action.' })
  if (!faStorageOk()) return json(res, 503, { ok: false, error: 'Storage is not configured.' })

  const name = String(body.name ?? '').trim()
  const employeeId = String(body.employeeId ?? '').trim()
  const branchId = String(body.branchId ?? '').trim()
  const hdfcSite = String(body.hdfcSite ?? '').trim() || 'HDFC Bank'
  const mobile = faDigitsMobile(String(body.mobile ?? ''))
  const gps = String(body.gps ?? '').trim()
  const lang = isFaLang(body.lang) ? String(body.lang) : 'en'
  const answers = Array.isArray(body.answers) ? body.answers.map((x) => String(x)) : []
  if (!name || !employeeId || !branchId) {
    return json(res, 400, { ok: false, error: 'Fill Agile Branch Name, Facility Attendant name, Employee ID and Mobile Number.' })
  }
  if (mobile.length !== 10) return json(res, 400, { ok: false, error: 'Enter a 10-digit mobile number.' })
  if (!gpsOk(gps)) return json(res, 400, { ok: false, error: 'Turn on location, then submit again.' })
  if (body.accepted !== true) return json(res, 400, { ok: false, error: 'Please accept the acknowledgement.' })
  if (FA_CORRECT.some((want, i) => answers[i] !== want)) {
    return json(res, 400, { ok: false, error: 'Please answer all three checks correctly.' })
  }

  const branches = await listFaPublicBranches()
  const branch = branches.find((b) => b.id === branchId)
  if (!branch) return json(res, 400, { ok: false, error: 'Pick a valid Agile Branch.' })

  const ymd = faIstYmd()
  const already = await findFaAckToday(mobile, ymd)
  if (already) return json(res, 200, { ok: true, record: already, already: true })

  const copy = faCopy(lang)
  const rec = await saveFaAck({
    name,
    employeeId,
    client: 'HDFC Bank',
    branchId: branch.id,
    branchName: branch.name,
    hdfcSite,
    mobile,
    lang,
    langName: copy.native || copy.name,
    answers: FA_CORRECT,
    score: '3/3',
    gps,
    accepted: true,
    ymd,
    submittedAt: istStamp(),
    submittedAtIso: new Date().toISOString(),
    device: String(body.device ?? '').slice(0, 240),
  })
  void sendFaAckMail(rec).catch(() => undefined)
  void sendFaAckWhatsApp(rec).catch(() => undefined)
  return json(res, 200, { ok: true, record: rec })
}
