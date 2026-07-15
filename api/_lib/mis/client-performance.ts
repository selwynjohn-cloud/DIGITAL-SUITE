/**
 * Client Performance aggregator — deployment, visits (D/N/T), duty exceptions,
 * MW compliant + monthly bill / balance (branch manual on client).
 * Supports from–to date range (week or month).
 */
import { misTodayIst, misWeekStartMonday } from './dates.js'
import { rowDeployTotals } from './deploy-math.js'
import {
  getClients,
  getCollections,
  getDutyDates,
  getDutyIncidents,
  getReport,
  getReportDates,
  getVisits,
  getVisitDates,
  type MisClient,
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
  for (const p of deployParts) {
    san += p.san
    dep += p.dep
    vac += p.vac
    if (p.dayHas) daysWithData++
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

  const avgDeploy = san ? Math.round((dep / san) * 100) : 0

  return {
    ok: true,
    clientName,
    from,
    to,
    month,
    rangeLabel,
    branchName: opts.branchName || undefined,
    branchId: colBranchId || undefined,
    san,
    dep,
    vac,
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
    monthlyBillLacs,
    balanceToPayLacs,
    collectedLacs,
    financeNote:
      'MW Compliant, Monthly bill and Balance are entered by the branch. Collected = Monthly bill − Balance.',
    slaDayVisit: clientRec?.slaDayVisit ?? '',
    slaNightCheck: clientRec?.slaNightCheck ?? '',
  }
}
