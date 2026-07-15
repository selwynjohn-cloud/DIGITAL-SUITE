import type { MisCollection, MisComplaint, MisSummary } from './store.js'

export const MANUAL_ATTENTION =
  'Kind attention — system could not get the data. Please enter manually.'

export type FieldFetchStatus = 'auto' | 'previous' | 'manual'

export type SummaryFieldMeta = {
  status: FieldFetchStatus
  source: string
  hint: string
}

const SUMMARY_CARRY_KEYS: (keyof MisSummary)[] = [
  'collectionPct',
  'weeklyCollectionPct',
  'consolidatedCollectionPct',
  'dayVisits',
  'nightChecks',
  'trainedSites',
  'medicalFitnessPct',
  'pvcPct',
  'psaraPct',
  'resignation',
  'recruitment',
  'guardComplaints',
  'clientComplaints',
  'complaints',
  'lateStartCases',
  'outOfPostCases',
  'remarks',
]

export function isEmptySummaryValue(v: unknown): boolean {
  const s = String(v ?? '').trim()
  return !s
}

/** Keep typed values; fill blanks from the branch's previous submission. */
export function mergePreviousSummary(
  current: Partial<MisSummary> | null | undefined,
  previous: Partial<MisSummary> | null | undefined,
): Partial<MisSummary> {
  const out: Partial<MisSummary> = { ...(current ?? {}) }
  if (!previous) return out
  for (const key of SUMMARY_CARRY_KEYS) {
    if (isEmptySummaryValue(out[key]) && !isEmptySummaryValue(previous[key])) {
      ;(out as Record<string, string>)[key] = String(previous[key])
    }
  }
  return out
}

export function complaintSolvedRegistered(solved: number, registered: number): string {
  if (!registered && !solved) return ''
  return `${solved}/${registered}`
}

function isSolvedComplaint(c: MisComplaint): boolean {
  const st = String(c.status ?? '').trim().toLowerCase()
  return st === 'closed' || st === 'solved' || st === 'resolved' || Boolean(c.actionTaken?.trim())
}

/** Guard complaints — Agile Guards app only (solved / registered). */
export function tallyGuardsAppComplaints(list: MisComplaint[]): string {
  const filtered = list.filter(
    (c) =>
      c.active !== false &&
      (c.source === 'guards' || String(c.channel ?? '').toLowerCase().includes('agile guards')),
  )
  const registered = filtered.length
  const solved = filtered.filter(isSolvedComplaint).length
  return complaintSolvedRegistered(solved, registered)
}

/** Client complaints — Director @agilegroup.co.in mail inbox (solved / registered). */
export function tallyDirectorMailComplaints(list: MisComplaint[]): string {
  const filtered = list.filter((c) => {
    if (c.active === false) return false
    if (c.source === 'inbox' || c.emailId) return true
    const ch = String(c.channel ?? '').toLowerCase()
    if (ch.includes('mail') || ch.includes('email')) return true
    const t = String(c.type ?? '').toLowerCase()
    return t.includes('client') && c.source !== 'guards'
  })
  const registered = filtered.length
  const solved = filtered.filter(isSolvedComplaint).length
  return complaintSolvedRegistered(solved, registered)
}

export function weeklyCollectionPct(row: MisCollection, collected: number): string {
  return row.budget > 0 ? String(Math.round((collected * 100) / row.budget)) : ''
}

/** Consolidated collection % — monthly billing vs outstanding (finance OST / CC upload). */
export function consolidatedCollectionPct(row: MisCollection): string {
  const billing = Number(row.monthlyBilling) || 0
  const outstanding = Number(row.outstanding) || 0
  if (!billing) return ''
  const recovered = Math.max(0, billing - outstanding)
  return String(Math.round((recovered * 100) / billing))
}

export function fieldMetaAuto(source: string): SummaryFieldMeta {
  return { status: 'auto', source, hint: `✓ Auto-filled from ${source}` }
}

export function fieldMetaPrevious(): SummaryFieldMeta {
  return {
    status: 'previous',
    source: 'Previous submission',
    hint: '✓ Carried from your last submitted report — you may edit',
  }
}

export function fieldMetaManual(source: string): SummaryFieldMeta {
  return { status: 'manual', source, hint: MANUAL_ATTENTION }
}

export function filledSummaryField(v: unknown): boolean {
  return !isEmptySummaryValue(v)
}
