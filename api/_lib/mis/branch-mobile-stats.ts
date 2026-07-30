import {
  consolidatedCollectionPct,
  fieldMetaAuto,
  fieldMetaManual,
  fieldMetaPrevious,
  isEmptySummaryValue,
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
  getVisits,
  guardRecordEligible,
  type MisClient,
  type MisCollection,
  type MisDutyIncident,
  type MisSummary,
} from './store.js'
import { misWeekStartMonday } from './dates.js'

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
}

export type MobileSyncStatus = {
  configured: boolean
  synced: boolean
  note: string
  stats: BranchMobileStats
}

const MOBILE_NA_INSTRUCTIONS =
  'If this shows NA: (1) Check Agile Mobile / Work360 has data for today. (2) Management can tap Sync on Patrol & Visit Report and Patrol & Duty Exceptions. (3) Enter Late Start / Out of Post manually if still blank. (4) Contact IT if Work360 is down.'

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
    getClients(branchId),
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
  }
}

function isEmptySummaryField(v: unknown): boolean {
  return isEmptySummaryValue(v)
}

/** Guard compliance % from Master Directory guard records. */
export async function guardCompliancePct(
  branchId: string,
): Promise<{ medicalFitnessPct: string; pvcPct: string; psaraPct: string }> {
  const docs = await getGuardDocs(branchId)
  const active = docs.filter(guardRecordEligible)
  const total = active.length
  if (!total) return { medicalFitnessPct: '', pvcPct: '', psaraPct: '' }
  let medical = 0
  let pvc = 0
  let training = 0
  for (const d of active) {
    if (docPresent(d.medical)) medical++
    if (docPresent(d.pvc)) pvc++
    if (docPresent(d.training)) training++
  }
  return {
    medicalFitnessPct: String(Math.round((medical * 100) / total)),
    pvcPct: String(Math.round((pvc * 100) / total)),
    psaraPct: String(Math.round((training * 100) / total)),
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
  opts?: { lite?: boolean; carriedKeys?: string[] },
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
  const [mobile, compliance, hr, complaints, collections] = await Promise.all([
    buildBranchMobileStats(branchId, branchName, dateFor),
    guardCompliancePct(branchId),
    opts?.lite
      ? Promise.resolve({ resignation: 0, recruitment: 0 })
      : buildBranchAckStats(branchId, branchName, dateFor).then((s) => ({
          resignation: s.resigned,
          recruitment: s.recruitmentOpen,
        })),
    getComplaints(branchId),
    getCollections(weekStart),
  ])
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
  const consolidatedPct = consolidatedCollectionPct(colRow)

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
    recruitment: String(summary?.recruitment ?? summary?.mobileActualPct ?? ''),
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
    if (!isEmptySummaryField(base[key])) {
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
    apply('nightChecks', String(mobile.nightChecks), fieldMetaAuto('Agile Mobile / Work360 — Night Checks'), true)
    apply('trainedSites', String(mobile.trainedSites), fieldMetaAuto('Agile Mobile / Work360 — Trained Sites'), true)
  } else {
    for (const k of ['lateStartCases', 'outOfPostCases', 'dayVisits', 'nightChecks', 'trainedSites'] as const) {
      if (isEmptySummaryField(base[k])) fieldMeta[k] = fieldMetaManual('Agile Mobile / Work360')
    }
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
  apply('consolidatedCollectionPct', consolidatedPct, fieldMetaAuto('Finance upload — monthly billing vs outstanding'))

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
