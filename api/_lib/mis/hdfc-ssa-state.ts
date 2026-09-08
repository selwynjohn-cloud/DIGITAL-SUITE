/**
 * HDFC SSA — map MIS branches to Indian states.
 * Independent cities stay separate cards even in the same state.
 */
import { formatRecruitBranchDisplay, RECRUITMENT_BRANCH_META } from '../recruitment/branches.js'
import { surveyGrandTotal, riskBand } from '../crm/survey-template.js'
import { districtForCity, indiaCoords } from './hdfc-ssa-board-geo.js'
import { hdfcPagesProgress } from './hdfc-page-progress.js'
import type { MisPeriodicalSurvey } from './periodical-survey-store.js'

export const HDFC_SSA_STATES = [
  'Andhra Pradesh',
  'Telangana',
  'Tamil Nadu',
  'Puducherry',
  'Karnataka',
  'Kerala',
  'Maharashtra',
  'Gujarat',
  'Madhya Pradesh',
] as const

export type HdfcSsaStateName = (typeof HDFC_SSA_STATES)[number] | 'Other'

export type HdfcSsaBoardSite = {
  id: string
  branchId: string
  branchName: string
  state: HdfcSsaStateName
  company: string
  location: string
  bankCode: string
  clientId: string
  score: number
  riskLevel: string
  riskColour: string
  riskRate: number
  parts: { id: string; title: string; score: number; max: number; pct: number }[]
  hotItems: { label: string; score: number }[]
  formFlags: string[]
  riskNote: string
  lateStart: number
  lateStart2fa: number
  outOfPost: number
  vacantPosts: number
  sanctionedPosts: number
  is2Fa: boolean
  status: string
  submittedAt: string
  surveyedBy: string
  summary: string
  pagesLabel: string
  pagesComplete: boolean
  lat: number | null
  lng: number | null
  district: string
}

export type HdfcSsaBoardBranch = {
  branchKey: string
  branchName: string
  state: HdfcSsaStateName
  sites: HdfcSsaBoardSite[]
  avgScore: number
  avgRiskRate: number
  approved: number
  submitted: number
  draft: number
  highRisk: number
  lateStart: number
  lateStart2fa: number
  outOfPost: number
  vacantPosts: number
  sanctionedPosts: number
  parts: { id: string; title: string; score: number; max: number; pct: number }[]
  letter: string
  lat: number | null
  lng: number | null
  district: string
}

export type HdfcSsaBoardState = {
  state: HdfcSsaStateName
  branches: HdfcSsaBoardBranch[]
  approved: number
  submitted: number
  draft: number
  highRisk: number
  avgScore: number
  avgRiskRate: number
  lateStart: number
  lateStart2fa: number
  outOfPost: number
  vacantPosts: number
  sanctionedPosts: number
  parts: { id: string; title: string; score: number; max: number; pct: number }[]
  conclusion: string
}

function escNorm(s: string): string {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_\-–]+/g, ' ')
}

/** Longest-hint first so Tadipatri does not become Tada. */
export function stateForMisBranch(name: string, branchId?: string): HdfcSsaStateName {
  const label = formatRecruitBranchDisplay(name || '', branchId)
  const exact = RECRUITMENT_BRANCH_META.find(
    (b) => b.id === label || b.displayName === label || b.id === String(name || '').trim(),
  )
  if (exact) return exact.state as HdfcSsaStateName

  const hay = escNorm(`${label} ${name || ''} ${branchId || ''}`)
  const ranked = [...RECRUITMENT_BRANCH_META].sort((a, b) => {
    const al = Math.max(a.id.length, ...a.misNameHints.map((h) => h.length))
    const bl = Math.max(b.id.length, ...b.misNameHints.map((h) => h.length))
    return bl - al
  })
  for (const m of ranked) {
    for (const hint of [m.id, ...m.misNameHints]) {
      const needle = escNorm(hint)
      if (needle.length < 3) continue
      if (needle === 'tada' && hay.includes('tadipatri')) continue
      if (hay.includes(needle)) return m.state as HdfcSsaStateName
    }
  }
  return 'Other'
}

export function branchDisplayName(name: string, branchId?: string): string {
  const label = formatRecruitBranchDisplay(name || '', branchId)
  return label && label !== '—' ? label : String(name || '').trim() || 'Unassigned'
}

export function branchGroupKey(name: string, branchId?: string): string {
  return branchDisplayName(name, branchId)
}

function siteLocation(sv: MisPeriodicalSurvey): string {
  const f = sv.hdfcForm || {}
  const loc = String(sv.locationName || f.fullAddress || sv.address || sv.company || '').trim()
  return loc.replace(/\s*\|\s*Br\.?\s*Code[^|]*/i, '').trim() || sv.company || 'HDFC unit'
}

function isHdfcRow(sv: MisPeriodicalSurvey): boolean {
  return sv.surveyKind === 'hdfc' && sv.active !== false
}

export function isBoardSubmitted(sv: MisPeriodicalSurvey): boolean {
  if (!isHdfcRow(sv)) return false
  if (sv.status === 'Draft') return false
  return hdfcPagesProgress(sv).complete || sv.status === 'Completed' || sv.status === 'HodApproved' || sv.status === 'Approved'
}

export function toBoardSite(
  sv: MisPeriodicalSurvey,
  branchName: string,
  state: HdfcSsaStateName,
): HdfcSsaBoardSite {
  const score = surveyGrandTotal(sv.scores || {})
  const band = riskBand(score)
  const pages = hdfcPagesProgress(sv)
  return {
    id: sv.id,
    branchId: sv.branchId,
    branchName,
    state,
    company: sv.company || 'HDFC',
    location: siteLocation(sv),
    bankCode: '',
    clientId: sv.clientId || '',
    score,
    riskLevel: band.level,
    riskColour: band.colour,
    riskRate: Math.round((score / 180) * 100),
    parts: [],
    hotItems: [],
    formFlags: [],
    riskNote: '',
    lateStart: 0,
    lateStart2fa: 0,
    outOfPost: 0,
    vacantPosts: 0,
    sanctionedPosts: 0,
    is2Fa: false,
    status: sv.status,
    submittedAt: sv.submittedAt || sv.updatedAt || sv.createdAt || '',
    surveyedBy: sv.surveyedBy || sv.submittedBy || '',
    summary: String(sv.executiveSummary || '').trim().slice(0, 400),
    pagesLabel: pages.label,
    pagesComplete: pages.complete,
    lat: indiaCoords(sv.geoLat, sv.geoLng)?.lat ?? null,
    lng: indiaCoords(sv.geoLat, sv.geoLng)?.lng ?? null,
    district: districtForCity(branchName),
  }
}

export type BuildBoardOpts = {
  branches: { id: string; name: string }[]
  surveys: MisPeriodicalSurvey[]
  /** Public HDFC view — approved sites only. */
  publicOnly?: boolean
  /** HOD — one MIS branch id. */
  lockedBranchId?: string
  letters?: Record<string, string>
  conclusions?: Record<string, string>
}

export function buildHdfcSsaBoard(opts: BuildBoardOpts): HdfcSsaBoardState[] {
  const nameById = new Map(opts.branches.map((b) => [b.id, b.name]))
  let rows = (opts.surveys || []).filter(isHdfcRow)
  if (opts.lockedBranchId) {
    rows = rows.filter((sv) => sv.branchId === opts.lockedBranchId)
  }
  if (opts.publicOnly) {
    rows = rows.filter((sv) => sv.status === 'Approved')
  }

  const byState = new Map<HdfcSsaStateName, Map<string, HdfcSsaBoardSite[]>>()
  for (const sv of rows) {
    const rawName = nameById.get(sv.branchId) || ''
    const branchName = branchDisplayName(rawName, sv.branchId)
    const state = stateForMisBranch(rawName || branchName, sv.branchId)
    const key = branchGroupKey(rawName || branchName, sv.branchId)
    if (!byState.has(state)) byState.set(state, new Map())
    const bm = byState.get(state)!
    if (!bm.has(key)) bm.set(key, [])
    bm.get(key)!.push(toBoardSite(sv, branchName, state))
  }

  const order = [...HDFC_SSA_STATES, 'Other'] as HdfcSsaStateName[]
  const out: HdfcSsaBoardState[] = []
  for (const state of order) {
    const bm = byState.get(state)
    if (!bm || !bm.size) continue
    const branches: HdfcSsaBoardBranch[] = [...bm.entries()]
      .map(([branchKey, sites]) => {
        const scored = sites.filter((s) => s.status !== 'Draft')
        const avg = scored.length ? Math.round(scored.reduce((n, s) => n + s.score, 0) / scored.length) : 0
        return {
          branchKey,
          branchName: sites[0]?.branchName || branchKey,
          state,
          sites: sites.slice().sort((a, b) => b.score - a.score),
          avgScore: avg,
          avgRiskRate: scored.length
            ? Math.round(scored.reduce((n, s) => n + (s.riskRate || 0), 0) / scored.length)
            : 0,
          approved: sites.filter((s) => s.status === 'Approved').length,
          submitted: sites.filter((s) => s.status !== 'Draft').length,
          draft: sites.filter((s) => s.status === 'Draft').length,
          highRisk: scored.filter((s) => s.riskLevel === 'High' || s.riskLevel === 'Critical').length,
          lateStart: 0,
          lateStart2fa: 0,
          outOfPost: 0,
          vacantPosts: 0,
          sanctionedPosts: 0,
          parts: [],
          letter: String(opts.letters?.[branchKey] || '').trim(),
          lat: null,
          lng: null,
          district: '',
        }
      })
      .sort((a, b) => a.branchName.localeCompare(b.branchName))
    const allSites = branches.flatMap((b) => b.sites)
    const scored = allSites.filter((s) => s.status !== 'Draft')
    out.push({
      state,
      branches,
      approved: allSites.filter((s) => s.status === 'Approved').length,
      submitted: scored.length,
      draft: allSites.filter((s) => s.status === 'Draft').length,
      highRisk: scored.filter((s) => s.riskLevel === 'High' || s.riskLevel === 'Critical').length,
      avgScore: scored.length ? Math.round(scored.reduce((n, s) => n + s.score, 0) / scored.length) : 0,
      avgRiskRate: scored.length
        ? Math.round(scored.reduce((n, s) => n + (s.riskRate || 0), 0) / scored.length)
        : 0,
      lateStart: 0,
      lateStart2fa: 0,
      outOfPost: 0,
      vacantPosts: 0,
      sanctionedPosts: 0,
      parts: [],
      conclusion: String(opts.conclusions?.[state] || '').trim(),
    })
  }
  return out
}

export function indiaBoardKpis(states: HdfcSsaBoardState[]) {
  const approved = states.reduce((n, s) => n + s.approved, 0)
  const submitted = states.reduce((n, s) => n + s.submitted, 0)
  const highRisk = states.reduce((n, s) => n + s.highRisk, 0)
  const drafts = states.reduce((n, s) => n + s.draft, 0)
  const scores = states.filter((s) => s.submitted > 0)
  const avgScore = scores.length
    ? Math.round(scores.reduce((n, s) => n + s.avgScore * s.submitted, 0) / submitted)
    : 0
  const avgRiskRate = scores.length
    ? Math.round(scores.reduce((n, s) => n + (s.avgRiskRate || 0) * s.submitted, 0) / submitted)
    : 0
  const lateStart = states.reduce((n, s) => n + (s.lateStart || 0), 0)
  const lateStart2fa = states.reduce((n, s) => n + (s.lateStart2fa || 0), 0)
  const outOfPost = states.reduce((n, s) => n + (s.outOfPost || 0), 0)
  const vacantPosts = states.reduce((n, s) => n + (s.vacantPosts || 0), 0)
  return {
    approved,
    submitted,
    highRisk,
    draft: drafts,
    avgScore,
    avgRiskRate,
    lateStart,
    lateStart2fa,
    outOfPost,
    vacantPosts,
    states: states.length,
  }
}
