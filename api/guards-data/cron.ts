import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  allRosterToCsv,
  cityRosterToCsv,
  ensureGuardsDataDaily,
  rebuildGuardsDataRoster,
} from '../_lib/guards-data/roster.js'
import { sendSuiteEmail } from '../_lib/suite-mail.js'
import { Resend } from 'resend'

export const maxDuration = 60

function cronAuthorized(req: VercelRequest): boolean {
  if (req.headers['x-vercel-cron'] === '1') return true
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return true
  const auth = String(req.headers.authorization || '')
  if (auth === `Bearer ${secret}`) return true
  if (String(req.query.secret || '') === secret) return true
  return false
}

/** GET /api/guards-data/cron — rebuild city-wise Guards Data roster daily. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!cronAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' })

  const force = String(req.query.force ?? '') === '1'
  const result = await ensureGuardsDataDaily(force)
  const snap = await rebuildGuardsDataRoster()

  // Optional daily mail with master CSV to director / recruitment.
  const mailTo = (
    process.env.GUARDS_DATA_NOTIFY_EMAILS?.trim() ||
    process.env.ADMIN_NOTIFY_EMAIL?.trim() ||
    'director@agilegroup.co.in,recruitment@agilegroup.co.in'
  )
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)

  let mailed = false
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (apiKey && result.ran && mailTo.length) {
    try {
      const resend = new Resend(apiKey)
      const master = allRosterToCsv(snap.all)
      const branchNames = snap.branches || snap.cities || []
      const byB = snap.byBranch || snap.byCity || {}
      const cityPreview = branchNames
        .slice(0, 12)
        .map((c) => `<li><b>${c}</b> — ${byB[c]?.length || 0} people</li>`)
        .join('')
      await sendSuiteEmail(resend, {
        from: process.env.EMAIL_FROM ?? 'Agile Guards Data <onboarding@resend.dev>',
        to: mailTo,
        subject: `Guards Data (branch-wise) — ${result.ymd} — ${snap.total} people`,
        html: `<div style="font-family:Arial,sans-serif;color:#1e293b">
          <h2 style="color:#14224f">Guards Data — daily branch-wise list</h2>
          <p>Updated: <b>${snap.updatedAt}</b></p>
          <p>Total people: <b>${snap.total}</b> across <b>${(snap.branches || snap.cities).length}</b> branches.</p>
          <p>Columns: Sl.No · Name · Contact Mobile · Email · Date of Birth · Age</p>
          <ul>${cityPreview}</ul>
          <p>Full master CSV is attached conceptually in the body below for copy into iCloud
          <b>Agile Digital Suite / Guards Data / by-branch</b>.</p>
          <pre style="font-size:11px;white-space:pre-wrap;background:#f8fafc;padding:12px;border-radius:8px">${master
            .slice(0, 120000)
            .replaceAll('<', '&lt;')}</pre>
        </div>`,
      })
      mailed = true
    } catch {
      mailed = false
    }
  }

  const wantFiles = String(req.query.format ?? '') === 'files'
  const files: Record<string, string> = {}
  const branches = snap.branches || snap.cities
  const byBranch = snap.byBranch || snap.byCity
  if (wantFiles) {
    files['ALL-BRANCHES.csv'] = allRosterToCsv(snap.all)
    files['ALL-CITIES.csv'] = allRosterToCsv(snap.all) // legacy alias
    for (const branch of branches) {
      files[`by-branch/${branch}/roster.csv`] = cityRosterToCsv(byBranch[branch] || [])
    }
  }

  return res.status(200).json({
    ok: true,
    ...result,
    updatedAt: snap.updatedAt,
    branches,
    cities: branches,
    total: snap.total,
    sampleCityCsv: branches[0] ? cityRosterToCsv(byBranch[branches[0]] || []).slice(0, 500) : '',
    mailed,
    files: wantFiles ? files : undefined,
  })
}
