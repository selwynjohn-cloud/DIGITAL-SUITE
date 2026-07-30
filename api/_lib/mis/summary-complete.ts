import type { MisSummary } from './store.js'
import { filledSummaryField } from './summary-autofill.js'

export const MIS_SUMMARY_LABELS: Record<string, string> = {
  weeklyCollectionPct: 'Weekly Collection %',
  consolidatedCollectionPct: 'Consolidated Collection %',
  collectionPct: 'Collection %',
  dayVisits: 'Operations Visits (Day)',
  nightChecks: 'Night Checks',
  trainedSites: 'Trained Sites',
  medicalFitnessPct: 'Medical Fitness %',
  pvcPct: 'PVC Upload %',
  psaraPct: 'PSARA / Training Cert %',
  resignation: 'Resignations (cases)',
  recruitment: 'Recruitment (open)',
  guardComplaints: 'Guard Complaints (solved / registered)',
  clientComplaints: 'Client Complaints (solved / registered)',
  lateStartCases: 'Late Start (cases)',
  outOfPostCases: 'Out of Post (cases)',
}

const SUMMARY_KEYS = Object.keys(MIS_SUMMARY_LABELS).filter((k) => k !== 'collectionPct')

export function missingMisSummaryFields(opts: {
  summary: Partial<MisSummary>
  submittedBy?: string
  deploySan?: number
  colBudget?: number
  weekCollected?: number
}): string[] {
  const missing: string[] = []
  const s = opts.summary ?? {}

  if (!filledSummaryField(opts.submittedBy)) missing.push('Your name (submitting)')
  if (!(opts.deploySan && opts.deploySan > 0)) missing.push('Deployment — enter Absent/OT for each site')

  const budget = Number(opts.colBudget) || 0
  const wk = Number(opts.weekCollected) || 0
  if (!budget) missing.push('Weekly Budget (Collection)')
  else if (!wk && !filledSummaryField(s.weeklyCollectionPct) && !filledSummaryField(s.collectionPct)) {
    missing.push('Daily collection (Mon–Sat) or Weekly Collection %')
  }

  for (const key of SUMMARY_KEYS) {
    if (!filledSummaryField((s as Record<string, unknown>)[key])) {
      missing.push(MIS_SUMMARY_LABELS[key] ?? key)
    }
  }

  return missing
}

export function normaliseMisSummary(raw: Record<string, unknown>): MisSummary {
  const guard = String(raw.guardComplaints ?? '').trim()
  const client = String(raw.clientComplaints ?? '').trim()
  const legacy = String(raw.complaints ?? '').trim()
  const weekly = String(raw.weeklyCollectionPct ?? raw.collectionPct ?? '').trim()
  const consolidated = String(raw.consolidatedCollectionPct ?? '').trim()
  return {
    collectionPct: weekly,
    weeklyCollectionPct: weekly,
    consolidatedCollectionPct: consolidated,
    dayVisits: String(raw.dayVisits ?? '').trim(),
    nightChecks: String(raw.nightChecks ?? '').trim(),
    trainedSites: String(raw.trainedSites ?? '').trim(),
    medicalFitnessPct: String(raw.medicalFitnessPct ?? '').trim(),
    pvcPct: String(raw.pvcPct ?? '').trim(),
    psaraPct: String(raw.psaraPct ?? '').trim(),
    resignation: String(raw.resignation ?? raw.mobileMentionedPct ?? '').trim(),
    recruitment: String(raw.recruitment ?? raw.mobileActualPct ?? '').trim(),
    guardComplaints: guard,
    clientComplaints: client || legacy,
    complaints: client || legacy || guard,
    remarks: String(raw.remarks ?? '').trim(),
    lateStartCases: String(raw.lateStartCases ?? '').trim(),
    outOfPostCases: String(raw.outOfPostCases ?? '').trim(),
  }
}
