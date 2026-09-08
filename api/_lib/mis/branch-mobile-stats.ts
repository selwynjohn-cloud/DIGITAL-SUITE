import {
  consolidatedCollectionPct,
  fieldMetaAuto,
  fieldMetaManual,
  fieldMetaPrevious,
  isEmptySummaryValue,
  isGuardServiceCollectionBranch,
  tallyDirectorMailComplaints,
  tallyGuardsAppComplaints,
  weeklyCollectionPct,
  type SummaryFieldMeta,
} from './summary-autofill.js'
import {
  docPresent,
  getClients,
  getComplaints,
  getCollections,
  getDutyIncidents,
  getGuardDocs,
  getReport,
  getVisits,
  guardRecordEligible,
  type MisClient,
  type MisCollection,
  type MisDutyIncident,
  type MisSummary,
  type MisVisit,
} from './store.js'
import { enrichDutyIncidentsWithMobile } from './duty-contact.js'
import { branchSanctionedPosts, guardCompliancePcts } from './guard-compliance-math.js'
import { misWeekStartMonday } from './dates.js'
import { formatKmLabel, parseKmNumber } from './work360-km.js'
import { countNightVisitUnits, loadNightReport } from './night-ojt-store.js'

function branchNameLoose(a: string, b: string): boolean {
  const x = a.trim().toLowerCase()
  const y = b.trim().toLowerCase()
  if (!x || !y) return false
  return x === y || x.includes(y) || y.includes(x)
}

export function clientNamesForBranch(clients: MisClient[]): Set<string> {
  return new Set(
    clients.filter((c) => c.active !== false).map((c) => c.name.trim().toLowerCase()),
  )
}

export function visitMatchesBranch(
  client: string,
  unit: string,
  branchName: string,
  clientNames: Set<string>,
): boolean {
  const cl = client.trim().toLowerCase()
  const un = unit.trim().toLowerCase()
  if (clientNames.size === 0) {
    return branchNameLoose(client, branchName) || branchNameLoose(unit, branchName)
  }
  if (clientNames.has(cl)) return true
  return [...clientNames].some((n) => cl.includes(n) || n.includes(cl)) ||
    branchNameLoose(unit, branchName) ||
    branchNameLoose(client, branchName)
}

export function incidentMatchesBranch(
  incident: MisDutyIncident,
  branchName: string,
  clientNames: Set<string>,
): boolean {
  return visitMatchesBranch(incident.client, incident.unit, branchName, clientNames)
}

export type BranchMobileStats = {
  lateStartCases: number
  outOfPostCases: number
  dayVisits: number
  nightChecks: number
  trainedSites: number
  visitTotal: number
  totalPatrolKm: number
}

export type PatrolDutyRow = {
  user: string
  client: string
  unit: string
  visitTime: string
  patrolPoint: string
  kmTravelled: string
  visitType: string
}

export type LateStartDutyRow = {
  guardName: string
  mobile: string
  client: string
  unit: string
  dutyStartTime: string
  scheduledTime: string
  remarks: string
}

export type OutOfLocationRow = {
  guardName: string
  mobile: string
  client: string
  unit: string
  incidentTime: string
  kmFromPost: string
  remarks: string
}

export type PatrolDutyReport = {
  patrolRows: PatrolDutyRow[]
  lateStartRows: LateStartDutyRow[]
  outOfLocationRows: OutOfLocationRow[]
  totalPatrolKm: number
  patrolCount: number
}

function patrolPointFromRemarks(remarks: string): string {
  const m = String(remarks || '').match(/Patrol:\s*([^·]+)/)
  return m ? m[1].trim() : ''
}

function kmFromPostDisplay(inc: MisDutyIncident): string {
  if (inc.kmFromPost) {
    if (/km/i.test(inc.kmFromPost)) return formatKmLabel(inc.kmFromPost)
    return inc.kmFromPost
  }
  const m = String(inc.remarks || '').match(/([\d.]+)\s*km/i)
  if (m) return `${m[1]} km`
  return ''
}

function kmTravelledDisplay(v: MisVisit): string {
  if (v.kmTravelled) return formatKmLabel(v.kmTravelled)
  return ''
}

export async function buildPatrolDutyReport(
  branchId: string,
  branchName: string,
  dateFor: string,
): Promise<PatrolDutyReport> {
  const [clients, visits, dutyRaw] = await Promise.all([
    getClients(branchId, { skipRepair: true }),
    getVisits(dateFor),
    getDutyIncidents(dateFor),
  ])
  const duty = await enrichDutyIncidentsWithMobile(dutyRaw, { branchId })
  const clientNames = clientNamesForBranch(clients)

  const patrolRows: PatrolDutyRow[] = []
  let totalPatrolKm = 0
  for (const v of visits) {
    if (!visitMatchesBranch(v.client, v.unit, branchName, clientNames)) continue
    const kmLabel = kmTravelledDisplay(v)
    totalPatrolKm += parseKmNumber(kmLabel)
    patrolRows.push({
      user: v.user,
      client: v.client,
      unit: v.unit,
      visitTime: v.visitTime,
      patrolPoint: v.patrolPoint || patrolPointFromRemarks(v.remarks),
      kmTravelled: kmLabel,
      visitType: v.visitType || 'D',
    })
  }
  patrolRows.sort((a, b) => String(b.visitTime).localeCompare(String(a.visitTime)))

  const lateStartRows: LateStartDutyRow[] = []
  const outOfLocationRows: OutOfLocationRow[] = []
  for (const d of duty) {
    if (!incidentMatchesBranch(d, branchName, clientNames)) continue
    if (d.type === 'late_start') {
      lateStartRows.push({
        guardName: d.guardName,
        mobile: d.mobile || '',
        client: d.client,
        unit: d.unit,
        dutyStartTime: d.dutyStartTime || d.incidentTime || '',
        scheduledTime: d.scheduledTime || '',
        remarks: d.remarks,
      })
    } else if (d.type === 'out_of_post') {
      outOfLocationRows.push({
        guardName: d.guardName,
        mobile: d.mobile || '',
        client: d.client,
        unit: d.unit,
        incidentTime: d.incidentTime || '',
        kmFromPost: kmFromPostDisplay(d),
        remarks: d.remarks,
      })
    }
  }

  return {
    patrolRows,
    lateStartRows,
    outOfLocationRows,
    totalPatrolKm: Math.round(totalPatrolKm * 100) / 100,
    patrolCount: patrolRows.length,
  }
}

export type MobileSyncStatus = {
  configured: boolean
  synced: boolean
  note: string
  stats: BranchMobileStats
}

const MOBILE_NA_INSTRUCTIONS =
  'If this shows NA: (1) Check Agile Mobile / Work360 has data for today. (2) Management can tap Sync on Patrol & Visit Report and Late Start & Out of Post. (3) Enter Late Start / Out of Post manually if still blank. (4) Contact IT if Work360 is down.'

export function mobileSyncNote(
  configured: boolean,
  stats: BranchMobileStats,
  synced: boolean,
): string {
  if (!configured) {
    return `Mobile app sync: NA — Work360 not connected on server. ${MOBILE_NA_INSTRUCTIONS}`
  }
  if (!synced) {
    return `Mobile app sync: could not refresh just now — using last saved data. ${MOBILE_NA_INSTRUCTIONS}`
  }
  if (!stats.visitTotal && !stats.lateStartCases && !stats.outOfPostCases) {
    return `Mobile app sync: NA for today — no visits or duty exceptions recorded yet for this branch. ${MOBILE_NA_INSTRUCTIONS}`
  }
  const parts: string[] = []
  if (stats.visitTotal) {
    parts.push(
      `${stats.dayVisits} day visits · ${stats.nightChecks} night checks` +
        (stats.trainedSites ? ` · ${stats.trainedSites} trained sites` : ''),
    )
  }
  if (stats.lateStartCases || stats.outOfPostCases) {
    parts.push(`Late start: ${stats.lateStartCases} · Out of post: ${stats.outOfPostCases}`)
  }
  return `From Agile Mobile (auto): ${parts.join(' · ')}`
}

export async function buildBranchMobileStats(
  branchId: string,
  branchName: string,
  dateFor: string,
): Promise<BranchMobileStats> {
  const [clients, visits, duty] = await Promise.all([
    getClients(branchId, { skipRepair: true }),
    getVisits(dateFor),
    getDutyIncidents(dateFor),
  ])
  const clientNames = clientNamesForBranch(clients)

  let dayVisits = 0
  let nightChecks = 0
  let trainedSites = 0
  for (const v of visits) {
    if (!visitMatchesBranch(v.client, v.unit, branchName, clientNames)) continue
    if (v.visitType === 'N') nightChecks++
    else if (v.visitType === 'T') trainedSites++
    else dayVisits++
  }

  let lateStartCases = 0
  let outOfPostCases = 0
  let totalPatrolKm = 0
  for (const v of visits) {
    if (!visitMatchesBranch(v.client, v.unit, branchName, clientNames)) continue
    totalPatrolKm += parseKmNumber(kmTravelledDisplay(v))
  }
  for (const d of duty) {
    if (!incidentMatchesBranch(d, branchName, clientNames)) continue
    if (d.type === 'late_start') lateStartCases++
    else if (d.type === 'out_of_post') outOfPostCases++
  }

  return {
    lateStartCases,
    outOfPostCases,
    dayVisits,
    nightChecks,
    trainedSites,
    visitTotal: dayVisits + nightChecks + trainedSites,
    totalPatrolKm: Math.round(totalPatrolKm * 100) / 100,
  }
}

function isEmptySummaryField(v: unknown): boolean {
  return isEmptySummaryValue(v)
}

/** Guard compliance % — numerator from guard register, denominator = sanctioned posts. */
export async function guardCompliancePct(
  branchId: string,
  sanctioned = 0,
): Promise<{ medicalFitnessPct: string; pvcPct: string; psaraPct: string }> {
  const docs = await getGuardDocs(branchId)
  if (!sanctioned) {
    const clients = await getClients(branchId, { skipRepair: true })
    sanctioned = branchSanctionedPosts(branchId, null, clients)
  }
  const p = guardCompliancePcts(docs, sanctioned)
  if (!p.pvc && !p.medical && !p.training && !sanctioned) {
    return { medicalFitnessPct: '', pvcPct: '', psaraPct: '' }
  }
  return {
    medicalFitnessPct: String(p.medicalPct),
    pvcPct: String(p.pvcPct),
    psaraPct: String(p.trainingPct),
  }
}

function weekCollected(c: MisCollection): number {
  return (
    (Number(c.mon) || 0) +
    (Number(c.tue) || 0) +
    (Number(c.wed) || 0) +
    (Number(c.thu) || 0) +
    (Number(c.fri) || 0) +
    (Number(c.sat) || 0)
  )
}

/** Merge mobile + master-directory figures into branch summary (does not overwrite typed values). */
export async function enrichBranchSummary(
  branchId: string,
  branchName: string,
  dateFor: string,
  summary: Partial<MisSummary> | null | undefined,
  opts?: { lite?: boolean; carriedKeys?: string[]; forceSystem?: boolean },
): Promise<{
  summary: MisSummary
  mobile: BranchMobileStats
  fromMobile: boolean
  mobileNote: string
  mobileConfigured: boolean
  autoFilled: string[]
  fieldMeta: Record<string, SummaryFieldMeta>
}> {
  const { buildBranchAckStats } = await import('./ack-stats.js')
  const weekStart = misWeekStartMonday(dateFor)
  const [mobile, report, clients, hr, complaints, collections, nightReport] = await Promise.all([
    buildBranchMobileStats(branchId, branchName, dateFor),
    getReport(branchId, dateFor),
    getClients(branchId, { skipRepair: true }),
    opts?.lite
      ? Promise.resolve({ resignation: 0, recruitment: 0 })
      : buildBranchAckStats(branchId, branchName, dateFor).then((s) => ({
          resignation: s.resigned,
          recruitment: s.recruitmentOpen,
        })),
    getComplaints(branchId),
    getCollections(weekStart),
    loadNightReport(branchId, dateFor),
  ])
  const sanctioned = branchSanctionedPosts(branchId, report, clients)
  const compliance = await guardCompliancePct(branchId, sanctioned)
  const colRow =
    collections.find((c) => c.branchId === branchId) ||
    ({
      id: `${branchId}:${weekStart}`,
      branchId,
      weekStart,
      monthlyBilling: 0,
      budget: 0,
      mon: 0,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      outstanding: 0,
      remarks: '',
    } satisfies MisCollection)
  const collected = weekCollected(colRow)
  const guardCr = tallyGuardsAppComplaints(complaints)
  const clientCr = tallyDirectorMailComplaints(complaints)
  const weeklyPct = weeklyCollectionPct(colRow, collected)
  const consolidatedPct = isGuardServiceCollectionBranch(branchName)
    ? consolidatedCollectionPct(colRow)
    : ''

  const mobileConfigured = Boolean(process.env.WORK360_API_BASE_URL?.trim())
  const autoFilled: string[] = []
  const fieldMeta: Record<string, SummaryFieldMeta> = {}
  const carried = new Set(opts?.carriedKeys ?? [])

  const base: MisSummary = {
    collectionPct: String(summary?.collectionPct ?? summary?.weeklyCollectionPct ?? ''),
    weeklyCollectionPct: String(summary?.weeklyCollectionPct ?? summary?.collectionPct ?? ''),
    consolidatedCollectionPct: String(summary?.consolidatedCollectionPct ?? ''),
    dayVisits: String(summary?.dayVisits ?? ''),
    nightChecks: String(summary?.nightChecks ?? ''),
    trainedSites: String(summary?.trainedSites ?? ''),
    medicalFitnessPct: String(summary?.medicalFitnessPct ?? ''),
    pvcPct: String(summary?.pvcPct ?? ''),
    psaraPct: String(summary?.psaraPct ?? ''),
    resignation: String(summary?.resignation ?? summary?.mobileMentionedPct ?? ''),
    recruitment: String(summary?.recruitment ?? ''),
    guardComplaints: String(summary?.guardComplaints ?? ''),
    clientComplaints: String(summary?.clientComplaints ?? summary?.complaints ?? ''),
    complaints: String(summary?.clientComplaints ?? summary?.complaints ?? ''),
    remarks: String(summary?.remarks ?? ''),
    lateStartCases: String(summary?.lateStartCases ?? ''),
    outOfPostCases: String(summary?.outOfPostCases ?? ''),
  }

  let fromMobile = false

  const apply = (
    key: keyof MisSummary,
    value: string,
    meta: SummaryFieldMeta,
    mobileField = false,
  ) => {
    const hasValue = !isEmptySummaryField(base[key])
    const canForce = Boolean(opts?.forceSystem) && value !== ''
    // forceSystem: overwrite with today's live figure (used on Step 4 review / final submit).
    if (hasValue && !canForce) {
      if (carried.has(key)) fieldMeta[key] = fieldMetaPrevious()
      return
    }
    if (value !== '') {
      ;(base as Record<string, string>)[key] = value
      fieldMeta[key] = meta
      autoFilled.push(key)
      if (mobileField) fromMobile = true
      return
    }
    fieldMeta[key] = fieldMetaManual(meta.source)
  }

  if (mobileConfigured) {
    apply('lateStartCases', String(mobile.lateStartCases), fieldMetaAuto('Agile Mobile / Work360 — Late Start'), true)
    apply('outOfPostCases', String(mobile.outOfPostCases), fieldMetaAuto('Agile Mobile / Work360 — Out of Post'), true)
    apply('dayVisits', String(mobile.dayVisits), fieldMetaAuto('Agile Mobile / Work360 — Day Visits'), true)
    apply('trainedSites', String(mobile.trainedSites), fieldMetaAuto('Agile Mobile / Work360 — Trained Sites'), true)
  } else {
    for (const k of ['lateStartCases', 'outOfPostCases', 'dayVisits', 'trainedSites'] as const) {
      if (isEmptySummaryField(base[k])) fieldMeta[k] = fieldMetaManual('Agile Mobile / Work360')
    }
  }

  const misNight = countNightVisitUnits(nightReport)
  const nightVal = Math.max(misNight, mobileConfigured ? mobile.nightChecks : 0)
  if (misNight > 0 || mobileConfigured) {
    base.nightChecks = String(nightVal)
    fieldMeta.nightChecks = fieldMetaAuto(
      misNight > 0
        ? 'Night Visit (check) — units visited today'
        : 'Agile Mobile / Work360 — Night Checks',
    )
    autoFilled.push('nightChecks')
    if (misNight > 0) fromMobile = true
  } else if (isEmptySummaryField(base.nightChecks)) {
    fieldMeta.nightChecks = fieldMetaManual('Night Visit (check)')
  }

  apply('medicalFitnessPct', compliance.medicalFitnessPct, fieldMetaAuto('Guard Docs register'))
  apply('pvcPct', compliance.pvcPct, fieldMetaAuto('Guard Docs register'))
  apply('psaraPct', compliance.psaraPct, fieldMetaAuto('Guard Docs register — Training / PSARA'))

  if (!opts?.lite) {
    apply('resignation', String(hr.resignation), fieldMetaAuto('Guard Docs + Recruitment'))
    apply('recruitment', String(hr.recruitment), fieldMetaAuto('Recruitment app'))
  } else {
    if (isEmptySummaryField(base.resignation)) fieldMeta.resignation = fieldMetaManual('Recruitment / Guard Docs')
    if (isEmptySummaryField(base.recruitment)) fieldMeta.recruitment = fieldMetaManual('Recruitment app')
  }

  apply('guardComplaints', guardCr, fieldMetaAuto('Agile Guards — solved / registered'))
  apply('clientComplaints', clientCr, fieldMetaAuto('Director mail @agilegroup.co.in — solved / registered'))
  if (!isEmptySummaryField(base.clientComplaints)) base.complaints = base.clientComplaints

  apply('weeklyCollectionPct', weeklyPct, fieldMetaAuto('Weekly collection entry (Mon–Sat ÷ budget)'))
  if (!isEmptySummaryField(base.weeklyCollectionPct)) base.collectionPct = base.weeklyCollectionPct
  if (weeklyPct) {
    base.weeklyCollectionPct = weeklyPct
    base.collectionPct = weeklyPct
    fieldMeta.weeklyCollectionPct = fieldMetaAuto('Weekly collection entry (Mon–Sat ÷ budget)')
  }
  if (consolidatedPct !== '') {
    base.consolidatedCollectionPct = consolidatedPct
    fieldMeta.consolidatedCollectionPct = fieldMetaAuto(
      'Friday OST current-month billing (10th–10th). Weekly does not change this.',
    )
  } else {
    apply('consolidatedCollectionPct', consolidatedPct, fieldMetaAuto('Friday OST current-month billing'))
  }

  for (const key of Object.keys(base) as (keyof MisSummary)[]) {
    if (fieldMeta[key]) continue
    if (carried.has(key)) fieldMeta[key] = fieldMetaPrevious()
    else if (!isEmptySummaryField(base[key])) fieldMeta[key] = fieldMetaAuto('Saved report')
    else fieldMeta[key] = fieldMetaManual('Manual entry')
  }

  return {
    summary: base,
    mobile,
    fromMobile,
    mobileNote: mobileSyncNote(mobileConfigured, mobile, true),
    mobileConfigured,
    autoFilled,
    fieldMeta,
  }
}
