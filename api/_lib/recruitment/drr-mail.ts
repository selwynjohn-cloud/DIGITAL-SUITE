import { Resend } from 'resend'
import { sendSuiteEmail } from '../suite-mail.js'
import { branchEmail } from '../fleet/analysis.js'
import { deployPct, filterActiveReportRows, reportDeployTotals, rowDeployTotals } from '../mis/deploy-math.js'
import { misTodayIst, misYesterdayIst } from '../mis/dates.js'
import { getBranches, getClients, getReportsForDate } from '../mis/store.js'
import { recruitEmailShell } from './brand.js'
import type { DailyRecruitmentReport, RecruitmentConfig } from './store.js'

function esc(s: unknown): string {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export type BranchManpowerSnapshot = {
  date: string
  branch: string
  misSubmitted: boolean
  san: number
  dep: number
  abs: number
  ot: number
  vac: number
  fillPct: number
  vacantPosts: { client: string; unit: string; san: number; abs: number; ot: number; dep: number; vac: number; fill: number }[]
}

export async function loadBranchManpower(branchName: string): Promise<BranchManpowerSnapshot> {
  const empty: BranchManpowerSnapshot = {
    date: misTodayIst(),
    branch: branchName,
    misSubmitted: false,
    san: 0,
    dep: 0,
    abs: 0,
    ot: 0,
    vac: 0,
    fillPct: 0,
    vacantPosts: [],
  }

  const branches = await getBranches(true)
  const hit = branches.find((b) => b.name === branchName || b.id === branchName)
  if (!hit) return empty

  const clients = await getClients()
  let date = misTodayIst()
  let reports = await getReportsForDate(date)
  let rep = reports.find((r) => r.branchId === hit.id)
  if (!rep) {
    date = misYesterdayIst()
    reports = await getReportsForDate(date)
    rep = reports.find((r) => r.branchId === hit.id)
  }
  if (!rep) return { ...empty, date }

  const rows = filterActiveReportRows(hit.id, rep.rows as Record<string, unknown>[], clients)
  const totals = reportDeployTotals(rows, hit.id, clients)
  const vacantPosts = rows
    .map((row) => {
      const rt = rowDeployTotals(row)
      if (rt.vac <= 0) return null
      return {
        client: String(row.clientName ?? ''),
        unit: String(row.location ?? ''),
        san: rt.san,
        abs: rt.abs,
        ot: rt.ot,
        dep: rt.dep,
        vac: rt.vac,
        fill: deployPct(rt.dep, rt.san),
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.vac - a.vac)
    .slice(0, 12)

  return {
    date,
    branch: hit.name,
    misSubmitted: true,
    san: totals.san,
    dep: totals.dep,
    abs: totals.abs,
    ot: totals.ot,
    vac: totals.vac,
    fillPct: deployPct(totals.dep, totals.san),
    vacantPosts,
  }
}

export function buildDrrThankYouEmail(
  report: DailyRecruitmentReport,
  config: RecruitmentConfig,
  snap: BranchManpowerSnapshot,
): { subject: string; html: string } {
  const shortage = snap.vac > 0 ? snap.vac : config.shortageCount || 0
  const prev = config.previousShortage || shortage
  const delta = shortage - prev
  const trend =
    delta < 0 ? `Improved by ${Math.abs(delta)}` : delta > 0 ? `Increased by ${delta}` : 'Stable'

  const kpi = (val: string | number, label: string, color: string) =>
    `<div style="background:${color};padding:12px 14px;border-radius:8px;min-width:110px;flex:1;text-align:center">
      <b style="font-size:22px;color:#fff;display:block">${esc(val)}</b>
      <span style="font-size:10px;color:rgba(255,255,255,.9);text-transform:uppercase">${esc(label)}</span>
    </div>`

  const vacantRows = snap.vacantPosts
    .map(
      (v, i) => `<tr>
        <td>${i + 1}</td><td><b>${esc(v.client)}</b></td><td>${esc(v.unit || '—')}</td>
        <td>${v.san}</td><td style="color:#C0392B;font-weight:700">${v.abs}</td><td>${v.ot}</td>
        <td>${v.dep}</td><td style="color:#C0392B;font-weight:700">${v.vac}</td><td>${v.fill}%</td>
      </tr>`,
    )
    .join('')

  const bodyHtml = `
    <p>Dear <b>${esc(report.branchId)}</b> Team,</p>
    <p>Thank you — your <b>Daily Recruitment Report (DRR)</b> was received from <b>${esc(report.submittedBy || 'Branch HOD')}</b>.
    Below is your <b>Branch Manpower Dashboard</b> so you can see shortage, absconders, and vacant posts while you deploy new walk-in guards.</p>

    <div style="background:linear-gradient(135deg,#7f1d1d,#dc2626);color:#fff;padding:14px 16px;border-radius:10px;margin:14px 0;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <span style="font-size:13px;font-weight:700">🚨 MANPOWER SHORTAGE</span>
      <b style="font-size:26px">${shortage} guards</b>
      <span style="font-size:12px;opacity:.9">${esc(trend)} · Company target: fill via walk-ins + HQ publicity drives</span>
    </div>

    <h3 style="color:#5b21b6;border-left:4px solid #c9a84c;padding-left:8px;margin:16px 0 8px">Today's Walk-in Report — ${esc(report.reportCode)}</h3>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin:10px 0">
      ${kpi(report.walkIns, 'Walk-ins', '#5b21b6')}
      ${kpi(report.screened, 'Screened', '#0369a1')}
      ${kpi(report.docsComplete, 'Docs Done', '#0f766e')}
      ${kpi(report.selected, 'Selected', '#7c3aed')}
      ${kpi(report.deployed, 'Deployed Today', '#16a34a')}
    </div>

    <h3 style="color:#5b21b6;border-left:4px solid #c9a84c;padding-left:8px;margin:18px 0 8px">Branch Deployment — ${esc(snap.date)}${snap.misSubmitted ? '' : ' (MIS report pending)'}</h3>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin:10px 0">
      ${kpi(snap.san || '—', 'Sanctioned', '#0369a1')}
      ${kpi(snap.dep || '—', 'Deployed', '#16a34a')}
      ${kpi(snap.abs || '—', 'Absent / Absconded', '#dc2626')}
      ${kpi(snap.vac || '—', 'Vacant Posts', '#d97706')}
      ${kpi(snap.san ? snap.fillPct + '%' : '—', 'Fill Rate', '#5b21b6')}
    </div>

    ${vacantRows ? `<h3 style="color:#5b21b6;border-left:4px solid #c9a84c;padding-left:8px;margin:18px 0 8px">Vacant Posts — Priority Sites</h3>
    <table style="border-collapse:collapse;width:100%;font-size:11px;margin-top:8px" border="1" cellpadding="6">
      <thead style="background:#4c1d95;color:#fff"><tr>
        <th>#</th><th>Client</th><th>Location</th><th>San.</th><th>Abs.</th><th>OT</th><th>Dep.</th><th>Vacant</th><th>Fill %</th>
      </tr></thead>
      <tbody>${vacantRows}</tbody>
    </table>` : `<p style="color:#64748b;font-size:12px">No vacant post detail in today's MIS deployment report yet. Submit MIS daily report for live vacant-site list.</p>`}

    ${report.bottlenecks ? `<p style="margin-top:14px;padding:10px 12px;background:#FFF8E1;border-left:4px solid #d97706;font-size:12px"><b>Bottleneck noted:</b> ${esc(report.bottlenecks)}</p>` : ''}
    ${report.notes ? `<p style="margin-top:8px;padding:10px 12px;background:#f1f5f9;border-left:4px solid #7c3aed;font-size:12px"><b>Your notes:</b> ${esc(report.notes)}</p>` : ''}

    <p style="margin-top:16px;font-size:12px;color:#64748b">
      <b>Next step:</b> Continue walk-in recruitment daily. HQ handles WhatsApp, SecurityJob.co.in, news bulletin, and camps.<br>
      Portal: <a href="https://www.agilegroup-digital.co.in/recruitment?portal=staff">www.agilegroup-digital.co.in/recruitment</a> (Staff portal → Daily Recruitment Report)
    </p>`

  const html = recruitEmailShell(
    'Thank You — DRR Received + Branch Dashboard',
    `${esc(report.branchId)} · ${esc(report.reportDate)} · ${esc(report.reportCode)}`,
    bodyHtml,
  )

  return {
    subject: `Agile Recruitment — Thank You — DRR Received — ${report.branchId} (${report.reportDate})`,
    html,
  }
}

export async function sendDrrThankYouEmail(report: DailyRecruitmentReport, config: RecruitmentConfig) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }

  const snap = await loadBranchManpower(report.branchId)
  const { subject, html } = buildDrrThankYouEmail(report, config, snap)
  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile Recruitment <noreply@agilegroup.co.in>'
  const director = process.env.RECRUIT_DIRECTOR_EMAIL?.trim() || process.env.FLEET_DIRECTOR_EMAIL?.trim() || 'director@agilegroup.co.in'
  const to = branchEmail(report.branchId)

  const result = await sendSuiteEmail(resend, { from, to, cc: director, subject, html })
  if (result.error) return { ok: false, error: result.error.message ?? 'Send failed' }
  return { ok: true, to, cc: director }
}
