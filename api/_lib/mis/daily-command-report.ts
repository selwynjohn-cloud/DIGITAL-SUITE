/**
 * Agile MIS — 4:30 PM IST Command Centre daily report.
 * To Director + all HODs. Same sections every calendar day.
 */

import { Resend } from 'resend'
import { withoutNoMailRecipients } from '../auth.js'
import { sendSuiteEmail } from '../suite-mail.js'
import { withDailyPackDelivery } from '../suite-daily-delivery.js'
import { formatInrFromLacs } from '../inr-money.js'
import { MIS_DIRECTOR_CC_EMAIL, misSelwynGmailCopy } from './branch-mail-cc.js'
import { MIS_BRAND, misAckDateDisplay, misAckFooterHtml } from './brand.js'
import {
  buildConsolidatedMisAckPayload,
  consolidatedBranchTableHtml,
  consolidatedDashboardSectionsHtml,
  getAllHodEmails,
  MIS_DAILY_REPORT_SECTIONS,
  type ConsolidatedBranchRow,
} from './digest.js'
import { VACANCY_RANK_COLUMNS } from './manpower-shortage.js'

function esc(s: unknown) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function dailyMisCommandSubject(dateFor: string) {
  return `AGILE DIGITAL COMMAND CENTER , AGILE MIS - DAILY REPORT ${misAckDateDisplay(dateFor)}-REG`
}

function mailFrom() {
  return (
    process.env.MIS_ACK_FROM?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    process.env.PIN_EMAIL_FROM?.trim() ||
    'Agile MIS <noreply@agilegroup.co.in>'
  )
}

function directorInbox() {
  return (
    process.env.MIS_DIRECTOR_EMAIL?.trim() ||
    MIS_DIRECTOR_CC_EMAIL
  )
    .trim()
    .toLowerCase()
}

function sectionTitle(n: number, title: string) {
  return `<div style="margin:22px 0 10px;padding:10px 12px;background:#14224f;color:#fff;font-size:14px;font-weight:800;border-radius:8px;letter-spacing:.2px">${n}. ${esc(title)}</div>`
}

function rankTable(
  headers: string[],
  rows: string[][],
  empty: string,
  opts?: { compact?: boolean },
): string {
  const fs = opts?.compact ? '9px' : '10px'
  const pad = opts?.compact ? '5px 4px' : '7px 6px'
  const th = headers
    .map(
      (h, i) =>
        `<th style="padding:${pad};font-size:${fs};color:#fff;background:#14224f;border:1px solid #0f1a3d;white-space:nowrap;text-align:${i <= 1 ? 'left' : 'center'}">${esc(h)}</th>`,
    )
    .join('')
  const body = rows.length
    ? rows
        .map(
          (r, ri) =>
            `<tr style="background:${ri % 2 ? '#f8fafc' : '#fff'}">${r
              .map(
                (c, i) =>
                  `<td style="padding:${pad};border:1px solid #e2e8f0;font-size:${opts?.compact ? '10px' : '11px'};white-space:nowrap;text-align:${i <= 1 ? 'left' : 'center'}">${c}</td>`,
              )
              .join('')}</tr>`,
        )
        .join('')
    : `<tr><td colspan="${headers.length}" style="padding:10px;border:1px solid #e2e8f0;text-align:center;color:#64748b;font-size:12px">${esc(empty)}</td></tr>`
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 8px"><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>`
}

function depPct(r: ConsolidatedBranchRow) {
  return r.san ? Math.round((r.dep * 100) / r.san) : 0
}

function ruleBranchConclusion(r: ConsolidatedBranchRow): string {
  if (!r.submitted) {
    return `${r.name}: Daily MIS not submitted. Follow up before close of day — vacancy, OT, visits and finance cannot be confirmed.`
  }
  const bits: string[] = []
  bits.push(`Deployment ${depPct(r)}% (${r.dep}/${r.san}), vacant ${r.vac}.`)
  if (r.vac > 0) bits.push(`Vacancy needs attention.`)
  if (r.ot > 0) bits.push(`OT ${r.ot}.`)
  if (r.lateStart || r.outOfPost) {
    bits.push(`Late start ${r.lateStart}, out of post ${r.outOfPost}.`)
  }
  bits.push(`Day visits ${r.siteVisits}, night visits ${r.nightChecks}.`)
  const coll = r.collectionPct && r.collectionPct !== '—' ? r.collectionPct : 'not given'
  if (r.over90) {
    bits.push(
      `Collection ${coll}; DSO ${r.dso} days (above 90). Dues ${formatInrFromLacs(r.outstanding)} — chase recovery.`,
    )
  } else {
    bits.push(`Collection ${coll}${r.dso != null ? `; DSO ${r.dso} days` : ''}.`)
  }
  if (r.incidentOpen > 0) bits.push(`${r.incidentOpen} incident(s) still open.`)
  return `${r.name}: ${bits.join(' ')}`
}

async function aiBranchConclusions(rows: ConsolidatedBranchRow[]): Promise<string[]> {
  const fallback = rows.map(ruleBranchConclusion)
  const openaiKey = process.env.OPENAI_API_KEY?.trim()
  const pplxKey = process.env.PERPLEXITY_API_KEY?.trim()
  const url = openaiKey
    ? 'https://api.openai.com/v1/chat/completions'
    : pplxKey
      ? 'https://api.perplexity.ai/chat/completions'
      : ''
  const key = openaiKey || pplxKey
  if (!url || !key) return fallback
  const model = openaiKey ? process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini' : 'sonar'
  const facts = rows
    .map((r) =>
      [
        r.name,
        r.submitted ? 'submitted' : 'NOT SUBMITTED',
        `san ${r.san}`,
        `dep ${r.dep}`,
        `vac ${r.vac}`,
        `ot ${r.ot}`,
        `late ${r.lateStart}`,
        `out ${r.outOfPost}`,
        `day ${r.siteVisits}`,
        `night ${r.nightChecks}`,
        `coll ${r.collectionPct}`,
        `dso ${r.dso ?? '—'}`,
        `over90 ${r.over90 ? 'yes' : 'no'}`,
        `billing ${r.monthlyBilling}`,
        `dues ${r.outstanding}`,
        `openIncidents ${r.incidentOpen}`,
      ].join(' | '),
    )
    .join('\n')
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You write a daily MIS conclusion for a security company. One short paragraph per branch, starting with the branch name. Plain English. Use only the numbers given. Flag vacant posts, OT, late start / out of post, weak visits, collection below target, and DSO above 90 days. Do not invent facts. Do not add a title.',
          },
          { role: 'user', content: facts },
        ],
        temperature: 0.2,
        max_tokens: 1800,
      }),
    })
    if (!res.ok) return fallback
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    const text = data.choices?.[0]?.message?.content?.trim()
    if (!text) return fallback
    const parts = text
      .split(/\n+/)
      .map((s) => s.replace(/^\s*[-*•]\s*/, '').trim())
      .filter(Boolean)
    if (parts.length >= Math.min(3, rows.length)) return parts
    return fallback
  } catch {
    return fallback
  }
}

function dashboardCopyHtml(payload: Awaited<ReturnType<typeof buildConsolidatedMisAckPayload>>) {
  return consolidatedDashboardSectionsHtml(
    {
      san: payload.san,
      dep: payload.dep,
      ot: payload.ot,
      vac: payload.vac,
      depPct: payload.depPct,
      resignation: payload.resignation,
      recruitment: payload.recruitment,
      compliance: payload.compliance,
      incidents: payload.incidents,
      vacantGrouped: payload.vacantGrouped,
      otGrouped: payload.otGrouped,
      dashboard: payload.dashboard,
    },
    { includeBranchHeading: false, includeClientOtVacantTables: false },
  )
}

function vacancyRankHtml(rows: ConsolidatedBranchRow[]) {
  const ranked = [...rows].sort(
    (a, b) => (b.vacancyRanks?.total || b.vac) - (a.vacancyRanks?.total || a.vac) || a.name.localeCompare(b.name),
  )
  const headers = ['Sl.No.', 'Branch', ...VACANCY_RANK_COLUMNS.map((c) => c.label), 'Total']
  const sums = emptyVacancySums()
  const body = ranked.map((r, i) => {
    const vr = r.vacancyRanks
    const pending = !r.submitted
    if (!pending) {
      for (const col of VACANCY_RANK_COLUMNS) sums[col.key] += vr?.[col.key] || 0
      sums.total += vr?.total ?? r.vac
    }
    const cells = [String(i + 1), esc(r.name) + (pending ? ' <span style="color:#dc2626">(pending)</span>' : '')]
    for (const col of VACANCY_RANK_COLUMNS) {
      const n = pending ? '—' : String(vr?.[col.key] ?? 0)
      cells.push(
        !pending && (vr?.[col.key] || 0) > 0
          ? `<span style="color:#dc2626;font-weight:700">${n}</span>`
          : n,
      )
    }
    const tot = pending ? '—' : String(vr?.total ?? r.vac)
    cells.push(
      !pending && (vr?.total || r.vac) > 0
        ? `<span style="color:#dc2626;font-weight:800">${tot}</span>`
        : tot,
    )
    return cells
  })
  const totalRow = [
    '',
    '<b>TOTAL</b>',
    ...VACANCY_RANK_COLUMNS.map((c) => `<b>${sums[c.key]}</b>`),
    `<b>${sums.total}</b>`,
  ]
  return rankTable(headers, body.length ? [...body, totalRow] : body, 'No branch vacancy figures.', { compact: true })
}

function emptyVacancySums() {
  const sums: Record<string, number> = { total: 0 }
  for (const col of VACANCY_RANK_COLUMNS) sums[col.key] = 0
  return sums
}

function otBranchWiseHtml(
  rows: ConsolidatedBranchRow[],
  otDetail: Array<{ branch: string; client: string; unit: string; ot: number; abs: number }>,
) {
  const byBranch = new Map<string, Array<{ client: string; unit: string; ot: number; abs: number }>>()
  for (const r of otDetail) {
    if (!(r.ot > 0)) continue
    const list = byBranch.get(r.branch) || []
    list.push(r)
    byBranch.set(r.branch, list)
  }
  const ordered = [...rows]
    .filter((br) => br.ot > 0)
    .sort((a, b) => b.ot - a.ot || a.name.localeCompare(b.name))
  const companyOt = rows.reduce((s, r) => s + (r.ot || 0), 0)
  const blocks = ordered.map((br, i) => {
    const sites = (byBranch.get(br.name) || []).sort((a, b) => b.ot - a.ot)
    const siteRows = sites.length
      ? sites.map((s, si) => [
          String(si + 1),
          esc(s.client || '—'),
          esc(s.unit || '—'),
          `<span style="color:#7c3aed;font-weight:700">${s.ot}</span>`,
          String(s.abs || 0),
        ])
      : [['1', '—', '—', `<span style="color:#7c3aed;font-weight:700">${br.ot}</span>`, String(br.abs || 0)]]
    return `<div style="margin:0 0 16px">
      <div style="padding:8px 10px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:8px 8px 0 0;font-size:13px;font-weight:800;color:#14224f">${i + 1}. ${esc(br.name)} · OT <span style="color:#7c3aed">${br.ot}</span> · Absent ${br.abs}</div>
      ${rankTable(['Sl.No.', 'Client', 'Site', 'OT', 'Absent'], siteRows, 'No overtime at this branch.')}
    </div>`
  })
  const head = `<p style="margin:0 0 10px;font-size:13px;color:#334155">Company OT total: <b style="color:#7c3aed">${companyOt}</b> · Branches with OT: <b>${ordered.length}</b></p>`
  return blocks.length ? head + blocks.join('') : '<p style="font-size:13px;color:#64748b">No overtime reported.</p>'
}

function complaintHtml(
  rows: ConsolidatedBranchRow[],
  kind: 'client' | 'guard',
) {
  const ranked = [...rows].sort((a, b) => {
    const ab = kind === 'client' ? b.clientBalance - a.clientBalance : b.guardBalance - a.guardBalance
    return ab || a.name.localeCompare(b.name)
  })
  let recT = 0
  let solT = 0
  let balT = 0
  const body = ranked.map((r, i) => {
    const rec = kind === 'client' ? r.clientReceived : r.guardReceived
    const sol = kind === 'client' ? r.clientSolved : r.guardSolved
    const bal = kind === 'client' ? r.clientBalance : r.guardBalance
    recT += rec
    solT += sol
    balT += bal
    return [
      String(i + 1),
      esc(r.name),
      String(rec),
      String(sol),
      bal > 0 ? `<span style="color:#dc2626;font-weight:700">${bal}</span>` : String(bal),
    ]
  })
  if (body.length) {
    body.push(['', '<b>TOTAL</b>', `<b>${recT}</b>`, `<b>${solT}</b>`, `<b>${balT}</b>`])
  }
  return rankTable(
    ['Sl.No.', 'Branch', 'Received', 'Solved', 'Balance'],
    body,
    kind === 'client' ? 'No client complaints.' : 'No guard complaints.',
  )
}

function lateOutHtml(rows: ConsolidatedBranchRow[]) {
  const ranked = [...rows].sort(
    (a, b) => b.lateStart + b.outOfPost - (a.lateStart + a.outOfPost) || a.name.localeCompare(b.name),
  )
  const body = ranked.map((r, i) => [
    String(i + 1),
    esc(r.name),
    `<span style="color:${r.lateStart > 0 ? '#b45309' : '#334155'};font-weight:700">${r.lateStart}</span>`,
    `<span style="color:${r.outOfPost > 0 ? '#dc2626' : '#334155'};font-weight:700">${r.outOfPost}</span>`,
    String(r.lateStart + r.outOfPost),
  ])
  return rankTable(
    ['Sl.No.', 'Branch', 'Late start', 'Out of post', 'Total cases'],
    body,
    'No late start or out-of-post cases.',
  )
}

function visitsHtml(rows: ConsolidatedBranchRow[]) {
  const ranked = [...rows].sort(
    (a, b) => a.siteVisits + a.nightChecks - (b.siteVisits + b.nightChecks) || a.name.localeCompare(b.name),
  )
  const body = ranked.map((r, i) => [
    String(i + 1),
    esc(r.name),
    String(r.siteVisits),
    String(r.nightChecks),
    String(r.siteVisits + r.nightChecks),
    String(r.srMgmtVisits),
  ])
  return rankTable(
    ['Sl.No.', 'Branch', 'Day visits', 'Night visits', 'Total', 'Sr. mgmt visits'],
    body,
    'No visit figures.',
  )
}

function financeHtml(rows: ConsolidatedBranchRow[]) {
  const ranked = [...rows].sort((a, b) => b.outstanding - a.outstanding || a.name.localeCompare(b.name))
  const body = ranked.map((r, i) => [
    String(i + 1),
    esc(r.name),
    formatInrFromLacs(r.monthlyBilling),
    formatInrFromLacs(r.outstanding),
    esc(r.collectionPct || '—'),
    r.over90
      ? `<span style="color:#dc2626;font-weight:700">Yes · ${r.dso} days</span>`
      : r.dso != null
        ? `No · ${r.dso} days`
        : '—',
    r.over90 ? formatInrFromLacs(r.outstanding) : '—',
  ])
  return rankTable(
    ['Sl.No.', 'Branch', 'Bill amount', 'Total dues', 'Collection %', 'Above 90 days', 'Dues above 90 days'],
    body,
    'No finance figures.',
  )
}

function buildHtml(
  date: string,
  payload: Awaited<ReturnType<typeof buildConsolidatedMisAckPayload>>,
  conclusions: string[],
) {
  const display = misAckDateDisplay(date)
  const pendingLine = payload.pending.length
    ? `<div style="margin:0 0 14px;padding:12px 14px;border-radius:10px;background:#fef2f2;border:1px solid #fecaca;color:#991b1b;font-size:13px"><b>MIS not received:</b> ${esc(payload.pending.join(', '))}</div>`
    : `<div style="margin:0 0 14px;padding:12px 14px;border-radius:10px;background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;font-weight:700">All branches have submitted MIS for today.</div>`
  const conclusionHtml = conclusions
    .map(
      (c) =>
        `<p style="margin:0 0 10px;font-size:13px;line-height:1.55;color:#1e293b">${esc(c)}</p>`,
    )
    .join('')

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f1f5f9">
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:1100px;margin:0 auto;background:#ffffff;color:#1e293b">
  <div style="background:linear-gradient(135deg,#14224f 0%,#1e3a8a 58%,#0f172a 100%);padding:22px 24px 18px;border-radius:12px 12px 0 0;border-bottom:4px solid #c9a84c">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      <tr>
        <td width="72" style="vertical-align:middle;padding-right:14px">
          <img src="https://www.agilegroup-digital.co.in/agile-logo-clear.png" alt="Agile" width="64" height="64" style="display:block;background:transparent;border:none;padding:0" />
        </td>
        <td style="vertical-align:middle">
          <div style="font-size:17px;font-weight:800;color:#ffffff;line-height:1.35">${esc(MIS_BRAND.company)}</div>
          <div style="font-size:12px;color:#cbd5e1;margin-top:4px">Agile Digital Command Centre · MIS Daily Report</div>
          <div style="margin-top:8px;font-size:13px;font-weight:800;letter-spacing:.3px;color:#c9a84c">For Internal Circulation Only</div>
        </td>
      </tr>
    </table>
    <div style="margin-top:16px;padding:12px 14px;background:rgba(255,255,255,.1);border-radius:8px;border-left:4px solid #c9a84c">
      <div style="font-size:16px;font-weight:800;color:#c9a84c;line-height:1.3">AGILE MIS — DAILY REPORT ${esc(display)}</div>
      <div style="font-size:12px;color:#e2e8f0;margin-top:4px">Generated at 4:30 PM IST · All reports branch-wise · Every day including Saturday and Sunday</div>
      <div style="font-size:12px;font-weight:800;color:#fde68a;margin-top:6px">For Internal Circulation Only</div>
    </div>
  </div>
  <div style="padding:22px 24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
    <p style="margin:0 0 8px;font-size:14px">Dear All HODs,</p>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.55;color:#475569">Please find the <b>Agile MIS Daily Report</b> for <b>${esc(display)}</b>. Branches submitted: <b>${payload.submitted} of ${payload.branchCount}</b> · Deployment <b>${payload.depPct}%</b>.</p>
    ${pendingLine}
    <div style="margin:0 0 18px;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
      <div style="font-size:12px;font-weight:800;color:#14224f;margin:0 0 8px">Reports in this mail (in order)</div>
      <ol style="margin:0;padding-left:20px;font-size:12px;line-height:1.7;color:#334155">${MIS_DAILY_REPORT_SECTIONS.map((s) => `<li>${esc(s.replace(/^\d+\.\s*/, ''))}</li>`).join('')}</ol>
    </div>

    ${sectionTitle(1, 'Dashboard')}
    ${dashboardCopyHtml(payload)}

    ${sectionTitle(2, 'Consolidated MIS report')}
    ${consolidatedBranchTableHtml(payload.branchRows, { monthCollectionPct: payload.collDisplay })}

    ${sectionTitle(3, 'Vacancy report — branch-wise (rank)')}
    <p style="margin:0 0 8px;font-size:12px;color:#64748b">Highest vacant total first. Columns: Sl.No. · Branch · SO · ASO · LSG · SG · Driver · HK · HK-Supervisor · Escorts · SPO · SPA · Pantry Boy · STF · Total.</p>
    ${vacancyRankHtml(payload.branchRows)}

    ${sectionTitle(4, 'OT report — branch-wise')}
    <p style="margin:0 0 8px;font-size:12px;color:#64748b">Each branch first (highest OT first). Clients of that branch are listed under it.</p>
    ${otBranchWiseHtml(payload.branchRows, payload.otDetail || [])}

    ${sectionTitle(5, 'Late start — out of post report')}
    <p style="margin:0 0 8px;font-size:12px;color:#64748b">Highest combined cases first.</p>
    ${lateOutHtml(payload.branchRows)}

    ${sectionTitle(6, 'Day visit — Night visit report')}
    <p style="margin:0 0 8px;font-size:12px;color:#64748b">Lowest total visits first so weak coverage is visible.</p>
    ${visitsHtml(payload.branchRows)}

    ${sectionTitle(7, 'Finance report')}
    <p style="margin:0 0 8px;font-size:12px;color:#64748b">Bill amount, total dues, month collection % from Friday OST (10th–10th billing). Weekly collection does not change this %. Highest dues first.</p>
    ${financeHtml(payload.branchRows)}

    ${sectionTitle(8, 'Client Complaints')}
    <p style="margin:0 0 8px;font-size:12px;color:#64748b">Branch-wise received, solved and balance. Highest balance first.</p>
    ${complaintHtml(payload.branchRows, 'client')}

    ${sectionTitle(9, 'Guards Complaints')}
    <p style="margin:0 0 8px;font-size:12px;color:#64748b">Branch-wise received, solved and balance. Highest balance first.</p>
    ${complaintHtml(payload.branchRows, 'guard')}

    ${sectionTitle(10, 'Conclusion — AI report (branch-wise)')}
    <div style="margin:0 0 8px;padding:14px 16px;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px">${conclusionHtml}</div>

    <p style="margin:18px 0 6px;font-size:14px;line-height:1.6">Regards,</p>
    <p style="margin:0;font-size:14px;line-height:1.6">
      <b>Director — Security Division</b><br>
      ${esc(MIS_BRAND.company)}
    </p>
    <p style="margin:18px 0 0;font-size:12px;color:#64748b">
      <a href="https://www.agilegroup-digital.co.in/mis-dashboard" style="color:#1d4ed8">Open MIS Dashboard</a>
    </p>
    ${misAckFooterHtml()}
  </div>
</div>
</body></html>`
}

export async function sendMisDailyCommandReport(
  date: string,
  opts?: { preview?: boolean; sampleOnly?: boolean; force?: boolean; _direct?: boolean },
) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false as const, error: 'Email not configured' }
  if (!opts?.preview && !opts?.sampleOnly && !opts?._direct) {
    return withDailyPackDelivery(
      'mis',
      () => sendMisDailyCommandReport(date, { ...opts, _direct: true }),
      { force: opts?.force, ymd: date },
    )
  }

  const payload = await buildConsolidatedMisAckPayload(date)
  const conclusions = await aiBranchConclusions(payload.branchRows)
  const html = buildHtml(date, payload, conclusions)
  const subject = dailyMisCommandSubject(date)
  const director = directorInbox()
  const hodTo = withoutNoMailRecipients(await getAllHodEmails())
  const gmail = misSelwynGmailCopy()

  let to: string[]
  let cc: string[] = []
  if (opts?.sampleOnly) {
    to = withoutNoMailRecipients([gmail, director].filter((e) => e.includes('@')))
    if (!to.length) to = [director]
  } else {
    to = withoutNoMailRecipients(
      Array.from(
        new Set(
          [director, gmail, ...hodTo]
            .map((e) => e.trim().toLowerCase())
            .filter((e) => e.includes('@')),
        ),
      ),
    )
    if (!to.length) to = [director]
    cc = withoutNoMailRecipients(
      Array.from(
        new Set(
          [MIS_DIRECTOR_CC_EMAIL]
            .map((e) => e.trim().toLowerCase())
            .filter((e) => e.includes('@') && !to.includes(e)),
        ),
      ),
    )
  }

  if (opts?.preview) {
    return {
      ok: true as const,
      preview: true,
      subject,
      to,
      cc,
      date,
      submitted: payload.submitted,
      branchCount: payload.branchCount,
      pending: payload.pending,
      depPct: payload.depPct,
      conclusions: conclusions.slice(0, 8),
    }
  }

  const resend = new Resend(apiKey)
  const from = mailFrom()
  const result = await sendSuiteEmail(resend, {
    from,
    to,
    cc: cc.length ? cc : undefined,
    replyTo: director,
    subject,
    html,
    skipDirectorCc: true,
  })
  if (result.error) {
    return { ok: false as const, error: result.error.message ?? 'Send failed', to, cc, subject }
  }

  return {
    ok: true as const,
    subject,
    to,
    cc,
    from,
    submitted: payload.submitted,
    branchCount: payload.branchCount,
    pending: payload.pending,
    depPct: payload.depPct,
  }
}
