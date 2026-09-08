import { Resend } from 'resend'
import { sendSuiteEmail } from '../suite-mail.js'
import { branchEmail } from '../fleet/analysis.js'
import { deployPct, filterActiveReportRows, reportDeployTotals, rowDeployTotals } from '../mis/deploy-math.js'
import { misTodayIst } from '../mis/dates.js'
import { sitesForBranch } from '../mis/client-branch.js'
import { getBranches, getClients, getReportsForDate, type MisBranch } from '../mis/store.js'
import { recruitEmailShell } from './brand.js'
import { drrMailMisBranchIds } from './departments.js'
import { hydZoneCentreFromText, isHydZoneCentre, metaForRecruitBranch } from './branches.js'
import { resolveHyderabadRcZones } from './recruitment-centre.js'
import {
  baselineDateLabel,
  ensureShortageBaseline,
  remainingShortage,
  SHORTAGE_BASELINE_DATE,
} from './shortage-baseline.js'
import { drrDetailIsSubmitted, getDrrDetails } from './drr-detail-store.js'
import { RECRUIT_BRANCHES, type DailyRecruitmentReport, type RecruitmentConfig } from './store.js'

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
  clients: { name: string; location: string }[]
}

function resolveMisTargets(branchName: string, branches: MisBranch[]): MisBranch[] {
  const scope = String(branchName || '').trim()
  if (!scope) return []

  /** Physical Hyd zones — one MIS branch each (not the old shared Hyderabad bag). */
  if (isHydZoneCentre(scope)) {
    const zones = resolveHyderabadRcZones(branches)
    const want =
      scope === 'Hi-Tech City'
        ? /hi-?tech/i
        : scope === 'Hyderabad - B'
          ? /hyderabad[\s\-–]*b|zone[\s\-]*b/i
          : /hyderabad[\s\-–]*a|zone[\s\-]*a/i
    const hit = zones.find((z) => want.test(z.label) || want.test(z.misBranchId))
    if (hit) {
      const b = branches.find((x) => x.id === hit.misBranchId)
      if (b) return [b]
    }
    const byName = branches.filter((b) => {
      const n = String(b.name || '')
      if (scope === 'Hi-Tech City') return /hi-?tech/i.test(n)
      if (scope === 'Hyderabad - B') return /hyderabad[\s\-–]*b/i.test(n) || /hyd[\s\-]*zone[\s\-]*b/i.test(n)
      return /hyderabad[\s\-–]*a/i.test(n) || /hyd[\s\-]*zone[\s\-]*a/i.test(n)
    })
    if (byName.length) return byName
  }

  const ids = new Set(drrMailMisBranchIds(scope, branches))
  if (ids.size) return branches.filter((b) => ids.has(b.id))
  const hit = branches.find((b) => b.name === scope || b.id === scope)
  if (hit) return [hit]
  const lower = scope.toLowerCase()
  const exactCi = branches.filter((b) => String(b.name || '').trim().toLowerCase() === lower)
  if (exactCi.length) return exactCi

  if (lower === 'bangalore') {
    return branches.filter((b) => /bangalore|bengaluru|gulbarga|kalaburagi/i.test(String(b.name || '')))
  }
  if (lower === 'tada') {
    return branches.filter((b) => {
      const n = String(b.name || '')
      return /^tada\b/i.test(n.trim()) && !/tadipatri/i.test(n)
    })
  }
  if (lower === 'puducherry') {
    return branches.filter((b) => /puducherry|pondicherry/i.test(String(b.name || '')))
  }
  const meta = metaForRecruitBranch(scope)
  if (!meta) return []
  return branches.filter((b) => {
    const n = String(b.name || '').trim()
    return meta.misNameHints.some((h) => {
      const hint = h.toLowerCase()
      const nl = n.toLowerCase()
      return nl === hint || nl.startsWith(hint + ' ') || nl.startsWith(hint + '-')
    })
  })
}

export async function loadBranchManpower(
  branchName: string,
  dateFor?: string,
): Promise<BranchManpowerSnapshot> {
  const empty: BranchManpowerSnapshot = {
    date: dateFor || misTodayIst(),
    branch: branchName,
    misSubmitted: false,
    san: 0,
    dep: 0,
    abs: 0,
    ot: 0,
    vac: 0,
    fillPct: 0,
    vacantPosts: [],
    clients: [],
  }

  const branches = await getBranches(true)
  const targets = resolveMisTargets(branchName, branches)
  if (!targets.length) return empty

  const clients = await getClients()
  const date = String(dateFor || '').slice(0, 10) || misTodayIst()
  const reports = await getReportsForDate(date)

  let san = 0
  let dep = 0
  let abs = 0
  let ot = 0
  let vac = 0
  let misSubmitted = false
  const vacantPosts: BranchManpowerSnapshot['vacantPosts'] = []

  for (const hit of targets) {
    const rep = reports.find((r) => r.branchId === hit.id)
    if (!rep) continue
    misSubmitted = true
    const rows = filterActiveReportRows(hit.id, rep.rows as Record<string, unknown>[], clients)
    const totals = reportDeployTotals(rows, hit.id, clients)
    san += totals.san
    dep += totals.dep
    abs += totals.abs
    ot += totals.ot
    vac += totals.vac
    for (const row of rows) {
      const rt = rowDeployTotals(row)
      if (rt.vac <= 0) continue
      vacantPosts.push({
        client: String(row.clientName ?? ''),
        unit: String(row.location ?? ''),
        san: rt.san,
        abs: rt.abs,
        ot: rt.ot,
        dep: rt.dep,
        vac: rt.vac,
        fill: deployPct(rt.dep, rt.san),
      })
    }
  }

  vacantPosts.sort((a, b) => b.vac - a.vac)

  const clientMap = new Map<string, string>()
  for (const hit of targets) {
    for (const c of sitesForBranch(clients, hit.id, branches, true)) {
      const name = String(c.name || '').trim()
      if (!name) continue
      if (!clientMap.has(name)) clientMap.set(name, String(c.location || '').trim())
    }
  }
  for (const p of vacantPosts) {
    const name = String(p.client || '').trim()
    if (name && !clientMap.has(name)) clientMap.set(name, String(p.unit || '').trim())
  }
  const branchClients = [...clientMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, location]) => ({ name, location }))

  return {
    date,
    branch: targets.length === 1 ? targets[0].name : branchName,
    misSubmitted,
    san,
    dep,
    abs,
    ot,
    vac,
    fillPct: deployPct(dep, san),
    vacantPosts: vacantPosts.slice(0, 12),
    clients: branchClients,
  }
}

export type RecruitBranchShortageRow = {
  branch: string
  /** From Consolidated MIS baseline (14 Aug) — Vacant. */
  vac: number
  /** From Consolidated MIS baseline (14 Aug) — OT. */
  ot: number
  /** Remaining = opening − recruits registered since baseline. */
  shortage: number
  prevVac: number
  prevOt: number
  prevShortage: number
  openingVac: number
  openingOt: number
  openingShortage: number
  recruitsSinceBaseline: number
  san: number
  dep: number
  misSubmitted: boolean
}

export type RecruitShortageSnapshot = {
  date: string
  vac: number
  ot: number
  shortage: number
  prevVac: number
  prevOt: number
  prevShortage: number
  openingVac: number
  openingOt: number
  openingShortage: number
  openingDate: string
  recruitsSinceBaseline: number
  san: number
  dep: number
  misSubmittedCount: number
  branchCount: number
  source: 'mis' | 'config'
  label: string
  byBranch: RecruitBranchShortageRow[]
  consolidatedOpening?: { vac: number; ot: number; shortage: number }
}

function countRecruitsForCentre(
  details: Awaited<ReturnType<typeof getDrrDetails>>,
  centre: string,
  fromDate: string,
  toDate: string,
): number {
  let n = 0
  for (const p of details) {
    if (p.active === false) continue
    const rd = String(p.reportDate || '').slice(0, 10)
    if (rd < fromDate || rd > toDate) continue
    const bid = String(p.branchId || '')
    const rows = p.recruits || []
    if (!rows.length) continue
    if (bid === centre || (centre === 'Bangalore' && /gulbarga|kalaburagi/i.test(bid))) {
      n += rows.length
      continue
    }
    if (isHydZoneCentre(centre)) {
      if (
        bid === centre ||
        hydZoneCentreFromText(bid) === centre ||
        /^(Hyderabad|Recruitment Department|Training Department|Training Academy)$/i.test(bid)
      ) {
        if (bid === centre || hydZoneCentreFromText(bid) === centre) {
          n += rows.length
        } else {
          n += rows.filter((r) => {
            const z = hydZoneCentreFromText(
              `${r.unit || ''} ${r.location || ''} ${r.vacantPosition || ''} ${r.remarks || ''}`,
            )
            return z === centre
          }).length
        }
      }
    }
  }
  return n
}

/**
 * Recruitment shortage from Consolidated MIS baseline (14 Aug 2026).
 * Opening = Vacant + OT on that day (carried until DRR registers recruitment).
 * Remaining Total Shortages = Opening − recruits registered since baseline.
 */
export async function loadRecruitmentShortage(opts?: {
  recruitBranch?: string | null
  configFallback?: number
  centres?: readonly string[]
  saveClosing?: boolean
}): Promise<RecruitShortageSnapshot> {
  const today = misTodayIst()
  const scope = String(opts?.recruitBranch || '').trim()
  const centres = [...(opts?.centres?.length ? opts.centres : RECRUIT_BRANCHES)]
  const centreList = scope && scope !== 'ALL' ? [scope] : centres

  const [baseline, details] = await Promise.all([
    ensureShortageBaseline(centres),
    getDrrDetails(),
  ])

  const openingByBranch = new Map((baseline.byBranch || []).map((b) => [b.branch, b] as const))
  const byBranch: RecruitBranchShortageRow[] = []
  let recruitsTotal = 0

  for (const centre of centreList) {
    const open = openingByBranch.get(centre) || { branch: centre, vac: 0, ot: 0, shortage: 0 }
    const recruits = countRecruitsForCentre(details, centre, SHORTAGE_BASELINE_DATE, today)
    recruitsTotal += recruits
    const remaining = remainingShortage(open.shortage, recruits)
    byBranch.push({
      branch: centre,
      vac: open.vac,
      ot: open.ot,
      shortage: remaining,
      prevVac: open.vac,
      prevOt: open.ot,
      prevShortage: open.shortage,
      openingVac: open.vac,
      openingOt: open.ot,
      openingShortage: open.shortage,
      recruitsSinceBaseline: recruits,
      san: 0,
      dep: 0,
      misSubmitted: open.shortage > 0 || open.vac > 0 || open.ot > 0,
    })
  }

  const openingVac =
    scope && scope !== 'ALL' ? byBranch[0]?.openingVac || 0 : byBranch.reduce((a, b) => a + b.openingVac, 0)
  const openingOt =
    scope && scope !== 'ALL' ? byBranch[0]?.openingOt || 0 : byBranch.reduce((a, b) => a + b.openingOt, 0)
  /** Banner / KPIs match Branch DRR table column totals (centres), not a separate company bag. */
  const openingShortage =
    scope && scope !== 'ALL'
      ? byBranch[0]?.openingShortage || 0
      : byBranch.reduce((a, b) => a + b.openingShortage, 0)
  const vac = openingVac
  const ot = openingOt
  const shortage =
    scope && scope !== 'ALL'
      ? byBranch[0]?.shortage || 0
      : byBranch.reduce((a, b) => a + b.shortage, 0)
  const companyRecruits =
    scope && scope !== 'ALL' ? recruitsTotal : byBranch.reduce((a, b) => a + b.recruitsSinceBaseline, 0)

  const source: 'mis' | 'config' =
    openingShortage > 0 || baseline.byBranch.some((b) => b.shortage > 0) || baseline.shortage > 0
      ? 'mis'
      : 'config'
  const fb = Math.max(0, Math.floor(Number(opts?.configFallback) || 0))

  return {
    date: today,
    vac: source === 'mis' ? vac : 0,
    ot: source === 'mis' ? ot : 0,
    shortage: source === 'mis' ? shortage : fb,
    prevVac: openingVac,
    prevOt: openingOt,
    prevShortage: openingShortage || fb,
    openingVac,
    openingOt,
    openingShortage: openingShortage || fb,
    openingDate: SHORTAGE_BASELINE_DATE,
    recruitsSinceBaseline: companyRecruits,
    san: 0,
    dep: 0,
    misSubmittedCount: byBranch.filter((b) => b.misSubmitted).length,
    branchCount: byBranch.length,
    source,
    label: `Opening from Consolidated MIS ${baselineDateLabel()} · Shortages = Vacant + OT · banner = centre totals`,
    byBranch,
    /** Full consolidated MIS opening (all reporting branches) — for reference only. */
    consolidatedOpening: {
      vac: baseline.vac,
      ot: baseline.ot,
      shortage: baseline.shortage,
    },
  }
}

export function buildDrrThankYouEmail(
  report: DailyRecruitmentReport,
  config: RecruitmentConfig,
  snap: BranchManpowerSnapshot,
): { subject: string; html: string } {
  const shortage = snap.vac + snap.ot > 0 ? snap.vac + snap.ot : config.shortageCount || 0
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
    Below is your <b>Branch Manpower Dashboard</b>. <b>Total Shortages = Vacant + OT</b> from Daily MIS.</p>

    <div style="background:linear-gradient(135deg,#7f1d1d,#dc2626);color:#fff;padding:14px 16px;border-radius:10px;margin:14px 0;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <span style="font-size:13px;font-weight:700">🚨 TOTAL SHORTAGES</span>
      <b style="font-size:26px">${shortage}</b>
      <span style="font-size:12px;opacity:.9">${esc(trend)} · Vacant ${snap.vac} + OT ${snap.ot} · From Daily MIS</span>
    </div>

    <h3 style="color:#5b21b6;border-left:4px solid #c9a84c;padding-left:8px;margin:16px 0 8px">Daily Recruitment Report — ${esc(report.reportCode || report.reportDate)}</h3>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin:10px 0">
      ${kpi((report as { recruitCount?: number }).recruitCount ?? report.deployed ?? 0, 'New recruits', '#5b21b6')}
      ${kpi((report as { transferCount?: number }).transferCount ?? 0, 'Transfers', '#0369a1')}
      ${kpi((report as { resignationCount?: number }).resignationCount ?? 0, 'Resignations', '#0f766e')}
      ${kpi(snap.vac || '—', 'Vacant positions', '#d97706')}
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

/**
 * Daily shortage reminder — To: Branch HOD · CC: Director.
 * Opening = Consolidated MIS baseline (14 Aug 2026); remaining = opening − recruits since then.
 */
export function buildShortageReminderEmail(opts: {
  branch: string
  date: string
  openingShortage: number
  openingVac: number
  openingOt: number
  vac: number
  ot: number
  shortage: number
  recruitsSinceBaseline?: number
  recruitedToday?: number
  rejoinsToday?: number
  resignationsToday?: number
  drrSubmitted?: boolean
}): { subject: string; html: string } {
  const gap = opts.shortage
  const recruits = opts.recruitsSinceBaseline ?? 0
  const trend =
    recruits > 0
      ? `Reduced by ${recruits} since opening (Consolidated MIS ${baselineDateLabel()})`
      : `No recruitment registered since Consolidated MIS ${baselineDateLabel()} — shortage still open`

  const bodyHtml = `
    <p>Dear <b>${esc(opts.branch)}</b> HOD,</p>
    <p>This is your <b>Manpower Shortage Reminder</b> from Agile Recruitment.
    Opening shortages are from <b>Consolidated MIS ${baselineDateLabel()}</b> (Vacant + OT) and stay open until you register recruitment on the Daily Recruitment Report (DRR).</p>

    <div style="background:linear-gradient(135deg,#7f1d1d,#dc2626);color:#fff;padding:14px 16px;border-radius:10px;margin:14px 0">
      <div style="font-size:12px;font-weight:700;opacity:.95">OPENING BALANCE — Consolidated MIS ${baselineDateLabel()}</div>
      <b style="font-size:28px;display:block;margin:4px 0">${opts.openingShortage}</b>
      <span style="font-size:12px;opacity:.9">Vacant ${opts.openingVac} + OT ${opts.openingOt} — carried until recruitment is registered</span>
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin:12px 0">
      <div style="background:#d97706;padding:12px 14px;border-radius:8px;min-width:100px;flex:1;text-align:center;color:#fff">
        <b style="font-size:22px;display:block">${opts.vac}</b><span style="font-size:10px;text-transform:uppercase">Vacant (opening)</span>
      </div>
      <div style="background:#0369a1;padding:12px 14px;border-radius:8px;min-width:100px;flex:1;text-align:center;color:#fff">
        <b style="font-size:22px;display:block">${opts.ot}</b><span style="font-size:10px;text-transform:uppercase">OT (opening)</span>
      </div>
      <div style="background:#dc2626;padding:12px 14px;border-radius:8px;min-width:100px;flex:1;text-align:center;color:#fff">
        <b style="font-size:22px;display:block">${opts.shortage}</b><span style="font-size:10px;text-transform:uppercase">Remaining Shortages</span>
      </div>
    </div>

    <p style="font-size:13px;color:#334155"><b>Status:</b> ${esc(trend)}.
    Recruits since ${baselineDateLabel()}: <b>${recruits}</b> ·
    DRR today: <b>${opts.drrSubmitted ? 'Submitted' : 'Pending'}</b> ·
    Recruited today: <b>${opts.recruitedToday || 0}</b> ·
    Rejoin today: <b>${opts.rejoinsToday || 0}</b> ·
    Resignations today: <b>${opts.resignationsToday || 0}</b>.</p>

    <div style="margin:16px 0;padding:12px 14px;background:#FFF8E1;border-left:4px solid #d97706;font-size:13px;line-height:1.55">
      <b>Action required today</b>
      <ol style="margin:8px 0 0;padding-left:18px">
        <li>Submit / update your <b>Daily Recruitment Report (DRR)</b> — new recruits, rejoins, resignations.</li>
        <li>Prioritise filling <b>${Math.max(0, gap)}</b> remaining shortage posts.</li>
        <li>Use walk-ins, referrals, recruiters, SecurityJob and Training Academy sources — log the source on every recruit.</li>
        <li>Confirm vacant posts and OT cover with Operations before night shift.</li>
      </ol>
    </div>

    <p style="font-size:12px;color:#64748b">Portal:
      <a href="https://www.agilegroup-digital.co.in/recruitment?portal=staff">www.agilegroup-digital.co.in/recruitment</a>
      (Staff → Daily Recruitment Report)</p>
    <p style="font-size:11px;color:#94a3b8">This reminder is copied to the Director for follow-up.</p>`

  const html = recruitEmailShell(
    'Shortage & Recruitment Reminder',
    `${esc(opts.branch)} · ${esc(opts.date)} · Opening ${opts.openingShortage} → Remaining ${opts.shortage}`,
    bodyHtml,
  )

  return {
    subject: `Agile Recruitment — Shortage Reminder — ${opts.branch} — ${opts.date} (Opening ${opts.openingShortage} · Remaining ${opts.shortage})`,
    html,
  }
}

async function resolveRecruitHodEmails(centre: string): Promise<string[]> {
  const fallback = branchEmail(centre)
  try {
    const { getHodEmailsForBranch } = await import('../mis/digest.js')
    const { getBranches, getUsers } = await import('../mis/store.js')
    const [branches, users] = await Promise.all([getBranches(true), getUsers()])
    const targets = resolveMisTargets(centre, branches)
    const emails = new Set<string>()
    for (const hit of targets) {
      for (const em of await getHodEmailsForBranch(hit.id, users, branches)) {
        if (em.includes('@')) emails.add(em.trim().toLowerCase())
      }
    }
    if (emails.size) return [...emails]
  } catch {
    /* use branch inbox */
  }
  return fallback.includes('@') ? [fallback.toLowerCase()] : ['director@agilegroup.co.in']
}

export async function sendShortageReminderForBranch(
  branchId: string,
  opts?: { force?: boolean },
): Promise<{ ok: boolean; skipped?: boolean; reason?: string; to?: string[]; error?: string }> {
  const centre = String(branchId || '').trim()
  if (!centre) return { ok: false, error: 'Branch required' }
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }

  const ymd = misTodayIst()
  const { wasShortageReminded, markShortageReminded } = await import('./shortage-ledger.js')
  if (!opts?.force && (await wasShortageReminded(centre, ymd))) {
    return { ok: true, skipped: true, reason: 'Already reminded today' }
  }

  const [details, shortage] = await Promise.all([
    getDrrDetails(),
    loadRecruitmentShortage({ recruitBranch: centre, centres: RECRUIT_BRANCHES, saveClosing: false }),
  ])
  const row = shortage.byBranch.find((b) => b.branch === centre) || shortage.byBranch[0]
  const opening = row?.openingShortage ?? shortage.openingShortage
  const remaining = row?.shortage ?? shortage.shortage
  const recruitsSince = row?.recruitsSinceBaseline ?? 0

  if (opening <= 0 && remaining <= 0) {
    return { ok: true, skipped: true, reason: 'No shortage for this branch' }
  }
  if (!opts?.force && recruitsSince > 0) {
    return { ok: true, skipped: true, reason: 'Recruitment already registered since baseline' }
  }

  const pkgs = details.filter((p) => p.active !== false && p.reportDate === ymd && p.branchId === centre)
  let recruits = 0
  let rejoins = 0
  let resignations = 0
  for (const p of pkgs) {
    for (const r of p.recruits || []) {
      if (r.kind === 'rejoin') rejoins += 1
      else recruits += 1
    }
    resignations += (p.resignations || []).length
  }

  const { subject, html } = buildShortageReminderEmail({
    branch: centre,
    date: ymd,
    openingShortage: opening,
    openingVac: row?.openingVac ?? shortage.openingVac,
    openingOt: row?.openingOt ?? shortage.openingOt,
    vac: row?.vac ?? shortage.vac,
    ot: row?.ot ?? shortage.ot,
    shortage: remaining,
    recruitsSinceBaseline: recruitsSince,
    recruitedToday: recruits,
    rejoinsToday: rejoins,
    resignationsToday: resignations,
    drrSubmitted: pkgs.some(drrDetailIsSubmitted),
  })

  const to = await resolveRecruitHodEmails(centre)
  const director =
    process.env.RECRUIT_DIRECTOR_EMAIL?.trim() ||
    process.env.FLEET_DIRECTOR_EMAIL?.trim() ||
    'director@agilegroup.co.in'
  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile Recruitment <noreply@agilegroup.co.in>'
  const result = await sendSuiteEmail(resend, { from, to, cc: director, subject, html })
  if (result.error) return { ok: false, error: result.error.message ?? 'Send failed', to }
  await markShortageReminded(centre, ymd)
  return { ok: true, to }
}

/**
 * Auto-mail HODs for centres that still have opening shortage and zero recruits since MIS 14 Aug.
 * Once per branch per day (Redis ledger). Safe to call on Management Dashboard load.
 */
export async function autoSendShortageReminders(opts?: {
  centres?: readonly string[]
}): Promise<{ ok: boolean; sent: string[]; skipped: string[]; errors: string[] }> {
  const centres = [...(opts?.centres?.length ? opts.centres : RECRUIT_BRANCHES)]
  const snap = await loadRecruitmentShortage({ centres, saveClosing: false })
  const sent: string[] = []
  const skipped: string[] = []
  const errors: string[] = []
  for (const row of snap.byBranch) {
    if (row.openingShortage <= 0) {
      skipped.push(`${row.branch}:no-opening`)
      continue
    }
    if (row.recruitsSinceBaseline > 0) {
      skipped.push(`${row.branch}:has-recruits`)
      continue
    }
    const r = await sendShortageReminderForBranch(row.branch, { force: false })
    if (r.skipped) skipped.push(`${row.branch}:${r.reason || 'skipped'}`)
    else if (r.ok) sent.push(row.branch)
    else errors.push(`${row.branch}:${r.error || 'failed'}`)
  }
  return { ok: errors.length === 0, sent, skipped, errors }
}
