/**
 * Client Performance aggregator — deployment, visits (D/N/T), duty exceptions,
 * MW compliant + monthly bill / balance (branch manual on client).
 * Supports from–to date range (week or month).
 */
import { misTodayIst, misWeekStartMonday } from './dates.js'
import { rowDeployTotals } from './deploy-math.js'
import { guardCompliancePcts } from './guard-compliance-math.js'
import {
  getClients,
  getCollections,
  getDutyDates,
  getDutyIncidents,
  getGuardDocsMany,
  getReport,
  getReportDates,
  getVisits,
  getVisitDates,
  type MisClient,
  type MisGuardDoc,
} from './store.js'

export type ClientPerfResult = {
  ok: true
  clientName: string
  from: string
  to: string
  month: string
  rangeLabel: string
  branchName?: string
  branchId?: string
  san: number
  dep: number
  vac: number
  avgDeploy: number
  daysWithData: number
  visits: number
  dayVisits: number
  nightChecks: number
  training: number
  lateStart: number
  outOfPost: number
  /** Minimum Wage compliant — Yes / No / blank (branch manual). */
  mwCompliant: 'yes' | 'no' | ''
  mwCompliantLabel: string
  /** PVC % = valid PVC guards ÷ same sanctioned strength shown in report. null = no register. */
  pvcPct: number | null
  /** Medical Certificate % — same denominator as PVC / sanctioned strength. */
  medicalPct: number | null
  pvcCount: number
  medicalCount: number
  /** Same as `san` — unit sanctioned strength (PVC/MC cannot exceed this). */
  complianceSan: number
  pvcLabel: string
  medicalLabel: string
  /** Client-facing accuracy line for shared reports. */
  accuracyNote: string
  /** Monthly bill amount in ₹ lakhs (client manual, else branch OST billing). */
  monthlyBillLacs: number | null
  /** Balance to be paid in ₹ lakhs (client manual, else branch outstanding). */
  balanceToPayLacs: number | null
  /** Collected = Monthly bill − Balance (for billing vs collection chart). */
  collectedLacs: number | null
  financeNote: string
  slaDayVisit: string
  slaNightCheck: string
}

function norm(s: string): string {
  return String(s ?? '')
    .trim()
    .toUpperCase()
}

function lastDayOfMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  if (!y || !m) return misTodayIst()
  const last = new Date(Date.UTC(y, m, 0))
  return last.toISOString().slice(0, 10)
}

function firstDayOfMonth(ym: string): string {
  return /^\d{4}-\d{2}$/.test(ym) ? `${ym}-01` : misTodayIst().slice(0, 7) + '-01'
}

/** Resolve from/to from explicit dates or month (YYYY-MM). */
export function resolveClientPerfRange(body: {
  from?: unknown
  to?: unknown
  month?: unknown
}): { from: string; to: string; month: string; rangeLabel: string } {
  const today = misTodayIst()
  let from = String(body.from ?? '').trim().slice(0, 10)
  let to = String(body.to ?? '').trim().slice(0, 10)
  const month = String(body.month ?? '').trim().slice(0, 7)

  if ((!from || !to) && /^\d{4}-\d{2}$/.test(month)) {
    from = firstDayOfMonth(month)
    to = lastDayOfMonth(month)
  }
  if (!from) from = firstDayOfMonth(today.slice(0, 7))
  if (!to) to = today
  if (from > to) {
    const t = from
    from = to
    to = t
  }
  const spanDays =
    Math.round((new Date(to + 'T12:00:00').getTime() - new Date(from + 'T12:00:00').getTime()) / 86400000) + 1
  const rangeLabel =
    from === to ? from : spanDays <= 7 ? `Week ${from} → ${to}` : from.slice(0, 7) === to.slice(0, 7) && from.endsWith('-01') && to === lastDayOfMonth(from.slice(0, 7))
      ? from.slice(0, 7)
      : `${from} → ${to}`
  return { from, to, month: from.slice(0, 7), rangeLabel }
}

function datesInRange(all: string[], from: string, to: string): string[] {
  return all.filter((d) => d >= from && d <= to)
}

/** Every calendar day from → to (inclusive), capped for performance. */
function calendarDatesInRange(from: string, to: string, maxDays = 62): string[] {
  const out: string[] = []
  const start = new Date(from + 'T12:00:00')
  const end = new Date(to + 'T12:00:00')
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return out
  const cur = new Date(start)
  while (cur <= end && out.length < maxDays) {
    out.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

function rangeTooWide(from: string, to: string, maxDays = 62): boolean {
  return calendarDatesInRange(from, to, maxDays + 1).length > maxDays
}

async function deployTotalsForDate(
  dateFor: string,
  branchIds: string[],
  target: string,
): Promise<{ san: number; dep: number; vac: number; dayHas: boolean }> {
  let san = 0
  let dep = 0
  let vac = 0
  let dayHas = false
  if (!branchIds.length) return { san, dep, vac, dayHas }
  const reports = await Promise.all(branchIds.map((id) => getReport(id, dateFor)))
  for (const r of reports) {
    if (!r) continue
    for (const row of r.rows) {
      if (norm(row.clientName) !== target) continue
      dayHas = true
      const rt = rowDeployTotals(row as Record<string, unknown>)
      san += rt.san
      dep += rt.dep
      vac += rt.vac
    }
  }
  return { san, dep, vac, dayHas }
}

function mondaysOverlapping(from: string, to: string): string[] {
  let d = misWeekStartMonday(from)
  const out: string[] = []
  while (d <= to) {
    out.push(d)
    const dt = new Date(d + 'T12:00:00')
    dt.setDate(dt.getDate() + 7)
    d = dt.toISOString().slice(0, 10)
  }
  return out
}

function clientMatch(name: string, unit: string, target: string): boolean {
  const cl = norm(name)
  const un = norm(unit)
  if (!target) return false
  if (cl === target) return true
  if (cl.includes(target) || target.includes(cl)) return true
  if (un.includes(target)) return true
  return false
}

/** Generic words that must not alone link a Guard Doc unit to a client (e.g. HOSPITAL). */
const UNIT_STOP_WORDS = new Set([
  'HOSPITAL',
  'HOSP',
  'LTD',
  'PVT',
  'PRIVATE',
  'LIMITED',
  'THE',
  'AND',
  'OF',
  'UNIT',
  'SITE',
  'SECURITY',
  'SERVICES',
  'INDIA',
  'BRANCH',
  'CLIENT',
  'OFFICE',
  'PLANT',
  'FACTORY',
])

function distinctiveTokens(s: string): string[] {
  return norm(s)
    .split(/[^A-Z0-9]+/)
    .filter((t) => t.length >= 3 && !UNIT_STOP_WORDS.has(t))
}

/**
 * Strict Guard Docs → client link.
 * Rejects blank unit names (empty string used to match every client via includes).
 * Requires distinctive tokens (e.g. AIG), not only HOSPITAL / LTD.
 */
function guardDocMatchesClient(doc: MisGuardDoc, target: string, clientRec?: MisClient): boolean {
  const unit = norm(String(doc.unitName ?? ''))
  if (unit.length < 2) return false
  if (unit === target) return true

  const unitTok = distinctiveTokens(unit)
  const clientTok = distinctiveTokens(target)
  // Must have a distinctive client token (e.g. AIG) — never match on HOSPITAL / LTD alone
  if (!clientTok.length) return false

  // Full client name inside unit (e.g. "AIG HOSPITAL - GACHIBOWLI")
  if (target.length >= 6 && unit.includes(target)) return true

  // Every distinctive client token must appear in the unit tokens (AIG HOSPITAL → need AIG)
  if (unitTok.length && clientTok.every((t) => unitTok.includes(t))) return true
  // Or distinctive tokens appear as whole words inside the unit string
  if (clientTok.every((t) => new RegExp(`(?:^|[^A-Z0-9])${t}(?:[^A-Z0-9]|$)`).test(unit))) return true

  // Location alone is not enough — still require a distinctive client token in the unit
  const loc = norm(String(clientRec?.location ?? ''))
  if (loc.length >= 6 && unit.includes(loc) && clientTok.some((t) => unit.includes(t))) return true
  return false
}

/** One row per guard — Excel imports often duplicate the same employee. */
function dedupeGuardDocs(docs: MisGuardDoc[]): MisGuardDoc[] {
  const seen = new Set<string>()
  const out: MisGuardDoc[] = []
  for (const d of docs) {
    const emp = norm(d.employeeId)
    const mob = String(d.mobile ?? '').replace(/\D/g, '')
    const key =
      (emp && emp.length >= 3 ? `e:${emp}` : '') ||
      (mob.length >= 8 ? `m:${mob}` : '') ||
      `n:${norm(d.guardName)}|${norm(d.unitName)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(d)
  }
  return out
}

function clientMasterSan(c?: MisClient): number {
  if (!c) return 0
  return (Number(c.sanA) || 0) + (Number(c.sanG) || 0) + (Number(c.sanB) || 0) + (Number(c.sanC) || 0)
}

function pctBannerLabel(kind: 'PVC' | 'MC', pct: number | null, count: number, san: number): string {
  if (pct == null || san <= 0) {
    return kind === 'PVC'
      ? 'PVC — Guard Docs not linked for this client yet'
      : 'MC (Medical) — Guard Docs not linked for this client yet'
  }
  const title = kind === 'PVC' ? 'PVC Compliant' : 'MC (Medical Fitness)'
  const shown = Math.min(Math.max(0, count), san)
  return `${title} — ${pct}% (${shown} of ${san} sanctioned posts)`
}

async function mapChunked<T, R>(items: T[], fn: (t: T) => Promise<R>, size = 24): Promise<R[]> {
  const out: R[] = []
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size)
    out.push(...(await Promise.all(chunk.map(fn))))
  }
  return out
}

export async function buildClientPerformance(opts: {
  clientName: string
  from: string
  to: string
  /** Staff portal — restrict to one branch. */
  branchId?: string
  branchName?: string
  branchClients?: MisClient[]
}): Promise<ClientPerfResult | { ok: false; error: string }> {
  const clientName = String(opts.clientName ?? '').trim()
  const target = norm(clientName)
  if (!target) return { ok: false, error: 'Select a client.' }

  const { from, to, month, rangeLabel } = resolveClientPerfRange({ from: opts.from, to: opts.to })
  if (rangeTooWide(from, to)) {
    return { ok: false, error: 'Date range too long — please pick up to 2 months (use This week / This month / Last month).' }
  }

  const allClients = opts.branchClients ?? (await getClients())
  const matching = allClients.filter((c) => norm(c.name) === target && c.active !== false)
  if (opts.branchId) {
    const allowed = matching.some((c) => c.branchId === opts.branchId) || allClients.some((c) => c.branchId === opts.branchId && norm(c.name) === target)
    if (!allowed) return { ok: false, error: 'Select a client from your branch list.' }
  }

  const clientRec = matching.find((c) => (!opts.branchId || c.branchId === opts.branchId)) || matching[0]
  const branchIds = opts.branchId
    ? [opts.branchId]
    : [...new Set(matching.map((c) => c.branchId).filter(Boolean))]

  const [reportDates, visitDates, dutyDates] = await Promise.all([
    getReportDates(),
    getVisitDates(),
    getDutyDates(),
  ])
  const reportDateSet = new Set(datesInRange(reportDates, from, to))
  const rDates = calendarDatesInRange(from, to).filter((d) => reportDateSet.has(d))
  const vDates = datesInRange(visitDates, from, to)
  const dDates = datesInRange(dutyDates, from, to)

  const deployBranchIds = opts.branchId ? [opts.branchId] : branchIds
  const deployParts = await mapChunked(rDates, (d) => deployTotalsForDate(d, deployBranchIds, target))
  let san = 0
  let dep = 0
  let vac = 0
  let daysWithData = 0
  /** Latest report-day sanctioned for this client only (not sum of period days). */
  let latestDaySan = 0
  let latestDayDep = 0
  for (const p of deployParts) {
    san += p.san
    dep += p.dep
    vac += p.vac
    if (p.dayHas) {
      daysWithData++
      if (p.san > 0) latestDaySan = p.san
      if (p.dep > 0) latestDayDep = p.dep
    }
  }

  const visitParts = await mapChunked(vDates, async (d) => {
    let dayVisits = 0
    let nightChecks = 0
    let training = 0
    const vs = await getVisits(d)
    for (const v of vs) {
      if (!clientMatch(v.client, v.unit, target)) continue
      if (v.visitType === 'N') nightChecks++
      else if (v.visitType === 'T') training++
      else dayVisits++
    }
    return { dayVisits, nightChecks, training }
  })
  let dayVisits = 0
  let nightChecks = 0
  let training = 0
  for (const p of visitParts) {
    dayVisits += p.dayVisits
    nightChecks += p.nightChecks
    training += p.training
  }
  const visits = dayVisits + nightChecks + training

  const dutyParts = await mapChunked(dDates, async (d) => {
    let lateStart = 0
    let outOfPost = 0
    const list = await getDutyIncidents(d)
    for (const inc of list) {
      if (!clientMatch(inc.client, inc.unit, target)) continue
      if (inc.type === 'late_start') lateStart++
      else if (inc.type === 'out_of_post') outOfPost++
    }
    return { lateStart, outOfPost }
  })
  let lateStart = 0
  let outOfPost = 0
  for (const p of dutyParts) {
    lateStart += p.lateStart
    outOfPost += p.outOfPost
  }

  const colBranchId = opts.branchId || clientRec?.branchId || branchIds[0] || ''
  let branchMonthly = 0
  let branchOutstanding = 0
  if (colBranchId) {
    const weeks = mondaysOverlapping(from, to)
    const weekRows = await Promise.all(weeks.map((w) => getCollections(w)))
    for (const rows of weekRows) {
      const row = rows.find((c) => c.branchId === colBranchId)
      if (!row) continue
      if (Number(row.monthlyBilling)) branchMonthly = Number(row.monthlyBilling)
      if (Number(row.outstanding)) branchOutstanding = Number(row.outstanding)
    }
  }

  const mwCompliant = (clientRec?.mwCompliant === 'yes' || clientRec?.mwCompliant === 'no'
    ? clientRec.mwCompliant
    : '') as 'yes' | 'no' | ''
  const mwCompliantLabel = mwCompliant === 'yes' ? 'Yes' : mwCompliant === 'no' ? 'No' : '—'

  const hasClientBill = clientRec && Number(clientRec.monthlyBillLacs) > 0
  const hasClientBal = clientRec && Number(clientRec.balanceToPayLacs) >= 0 && clientRec.balanceToPayLacs !== undefined && String(clientRec.balanceToPayLacs) !== ''
  // Prefer branch-entered client figures; fall back to branch OST totals if blank.
  const monthlyBillLacs = hasClientBill
    ? Number(clientRec!.monthlyBillLacs)
    : branchMonthly || null
  const balanceToPayLacs =
    clientRec && (clientRec.balanceToPayLacs !== undefined && clientRec.balanceToPayLacs !== null)
      ? Number(clientRec.balanceToPayLacs)
      : branchOutstanding || null
  const collectedLacs =
    monthlyBillLacs != null && balanceToPayLacs != null
      ? Math.max(0, Math.round((monthlyBillLacs - balanceToPayLacs) * 100) / 100)
      : null

  /**
   * Client-facing sanctioned strength (ONE unit figure — never sum of report days).
   * Same number used for Deployment "Sanctioned" KPI and PVC/MC denominator.
   */
  const masterSan = clientMasterSan(clientRec)
  const avgDailySan = daysWithData > 0 ? Math.round(san / daysWithData) : 0
  const avgDailyDep = daysWithData > 0 ? Math.round(dep / daysWithData) : 0
  const avgDailyVac = daysWithData > 0 ? Math.round(vac / daysWithData) : 0
  const unitSan =
    masterSan > 0
      ? masterSan
      : avgDailySan > 0
        ? avgDailySan
        : latestDaySan > 0
          ? latestDaySan
          : latestDayDep > 0
            ? latestDayDep
            : 0
  const unitDep = avgDailyDep > 0 ? avgDailyDep : latestDayDep
  const unitVac =
    avgDailyVac > 0 ? avgDailyVac : unitSan > 0 ? Math.max(0, unitSan - unitDep) : 0
  const avgDeploy = unitSan > 0 ? Math.round((unitDep / unitSan) * 100) : san > 0 ? Math.round((dep / san) * 100) : 0

  /** PVC/MC share the exact same sanctioned strength shown in the report. */
  const complianceSan = unitSan

  let pvcPct: number | null = null
  let medicalPct: number | null = null
  let pvcCount = 0
  let medicalCount = 0
  const docBranchIds = (opts.branchId ? [opts.branchId] : branchIds).filter(Boolean)
  if (docBranchIds.length && complianceSan > 0) {
    const docsMap = await getGuardDocsMany(docBranchIds)
    const matched: MisGuardDoc[] = []
    for (const id of docBranchIds) {
      for (const d of docsMap.get(id) || []) {
        if (guardDocMatchesClient(d, target, clientRec)) matched.push(d)
      }
    }
    const docs = dedupeGuardDocs(matched)
    if (docs.length) {
      const p = guardCompliancePcts(docs, complianceSan)
      // Hard cap: PVC/MC valid count can never exceed sanctioned strength
      pvcCount = Math.min(p.pvc, complianceSan)
      medicalCount = Math.min(p.medical, complianceSan)
      pvcPct = Math.min(100, Math.round((pvcCount * 100) / complianceSan))
      medicalPct = Math.min(100, Math.round((medicalCount * 100) / complianceSan))
    }
  }

  const accuracyNote =
    complianceSan > 0
      ? `Accuracy: Sanctioned strength = ${complianceSan} posts. PVC ${pvcCount} and MC ${medicalCount} are from this client's Guard Docs only, each capped at ${complianceSan} (cannot exceed sanctioned strength; not multiplied by report days).`
      : 'Accuracy: Sanctioned strength not available for this client — PVC/MC held until strength is set in client master or daily report.'

  return {
    ok: true,
    clientName,
    from,
    to,
    month,
    rangeLabel,
    branchName: opts.branchName || undefined,
    branchId: colBranchId || undefined,
    // Report KPIs = unit strength (aligned with PVC/MC) — not period-day totals
    san: unitSan,
    dep: unitDep,
    vac: unitVac,
    avgDeploy,
    daysWithData,
    visits,
    dayVisits,
    nightChecks,
    training,
    lateStart,
    outOfPost,
    mwCompliant,
    mwCompliantLabel,
    pvcPct,
    medicalPct,
    pvcCount,
    medicalCount,
    complianceSan,
    pvcLabel: pctBannerLabel('PVC', pvcPct, pvcCount, complianceSan),
    medicalLabel: pctBannerLabel('MC', medicalPct, medicalCount, complianceSan),
    accuracyNote,
    monthlyBillLacs,
    balanceToPayLacs,
    collectedLacs,
    financeNote: accuracyNote,
    slaDayVisit: clientRec?.slaDayVisit ?? '',
    slaNightCheck: clientRec?.slaNightCheck ?? '',
  }
}
