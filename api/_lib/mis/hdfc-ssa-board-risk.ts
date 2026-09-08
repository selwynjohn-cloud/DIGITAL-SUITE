/**
 * HDFC SSA board — deep risk from the assessment + late start / out of post.
 * Location → city (independent branch) → state. Does not mix Tada / Tadipatri.
 */
import { SURVEY_PARTS, surveyPartTotal } from '../crm/survey-template.js'
import { clientNamesForBranch, incidentMatchesBranch } from './branch-mobile-stats.js'
import { rowDeployTotals } from './deploy-math.js'
import { attachSiteGeo, rollupCityGeo } from './hdfc-ssa-board-geo.js'
import {
  buildHdfcSsaBoard,
  type BuildBoardOpts,
  type HdfcSsaBoardSite,
  type HdfcSsaBoardState,
} from './hdfc-ssa-state.js'
import type { MisPeriodicalSurvey } from './periodical-survey-store.js'
import {
  getClients,
  getDutyDates,
  getDutyIncidents,
  getReport,
  getReportDates,
  type MisClient,
  type MisDeployRow,
  type MisDutyIncident,
} from './store.js'

export const HDFC_DUTY_WINDOW_DAYS = 21

export type HdfcRiskPart = {
  id: string
  title: string
  score: number
  max: number
  pct: number
}

export type HdfcHotItem = { label: string; score: number }

const SKIP_TOKENS = new Set([
  'hdfc',
  'bank',
  'atm',
  'limited',
  'ltd',
  'the',
  'and',
  'branch',
  'unit',
  'site',
  'india',
  'pvt',
  'private',
])

export function extractHdfcBankCode(
  sv: Pick<MisPeriodicalSurvey, 'locationName' | 'address' | 'hdfcForm' | 'company'> | null | undefined,
  client?: { name?: string; location?: string; branchCode?: string } | null,
): string {
  const form = (sv?.hdfcForm || {}) as Record<string, string>
  const sol = String(form.solId || '').trim()
  if (sol) return sol
  const blobs = [
    sv?.locationName,
    sv?.address,
    form.fullAddress,
    client?.location,
    client?.name,
    client?.branchCode,
    sv?.company,
  ]
  for (const blob of blobs) {
    const m = String(blob || '').match(/Br\.?\s*Code\s*[:\s]*([0-9A-Za-z]+)/i)
    if (m?.[1]) return m[1]
    const n = String(blob || '').match(/\b(?:SOL|IFSC)?[-\s]?(\d{4,6})\b/i)
    if (n?.[1] && !/20\d{2}/.test(n[1])) return n[1]
  }
  return ''
}

function yes(form: Record<string, string>, key: string): boolean {
  return /^(yes|y|true|1)$/i.test(String(form[key] || '').trim())
}

function no(form: Record<string, string>, key: string): boolean {
  return /^(no|n|false|0)$/i.test(String(form[key] || '').trim())
}

export function hdfcFormRiskFlags(form: Record<string, string> | undefined): string[] {
  const f = form || {}
  const flags: string[] = []
  if (yes(f, 'remoteAtNight')) flags.push('Remote at night')
  if (yes(f, 'wineShopNearby')) flags.push('Wine shop nearby')
  if (yes(f, 'barsNearby')) flags.push('Bars nearby')
  if (yes(f, 'politicalPartyOfficeNearby')) flags.push('Political office nearby')
  if (/damage|broken|open/i.test(String(f.damagedWindows || ''))) flags.push('Damaged windows')
  if (yes(f, 'atmOpenWiring') || yes(f, 'atmOpenPowerSocket') || yes(f, 'atmOpenConnection')) {
    flags.push('Open ATM wiring / power')
  }
  if (no(f, 'surroundNightLighting')) flags.push('Poor night lighting')
  if (no(f, 'generatorLockIntact')) flags.push('Generator lock not intact')
  if (no(f, 'faKnowsProcedure')) flags.push('FA does not know procedure')
  if (no(f, 'escalationKnownFa')) flags.push('Escalation not known to FA')
  if (no(f, 'patrolBeforeTakeover')) flags.push('No patrol before takeover')
  return flags.slice(0, 8)
}

export function sanctionedFaCount(form: Record<string, string> | undefined): number {
  const s = String(form?.sanctionedGuards || '').toUpperCase()
  if (s === '3FA' || s.includes('3FA')) return 3
  if (s === '2FA' || s.includes('2FA')) return 2
  if (s === '1FA' || s.includes('1FA')) return 1
  return 0
}

function listedFaCount(form: Record<string, string> | undefined): number {
  try {
    const arr = JSON.parse(String(form?.facilityAttendantsJson || '[]')) as Array<{ name?: string }>
    if (!Array.isArray(arr)) return 0
    return arr.filter((x) => String(x?.name || '').trim()).length
  } catch {
    return 0
  }
}

export function ssaDeployRiskPct(form: Record<string, string> | undefined): number {
  const f = form || {}
  let pct = 0
  if (no(f, 'faOnDuty')) pct = Math.max(pct, 85)
  if (no(f, 'deploymentMatch')) pct = Math.max(pct, 70)
  const need = sanctionedFaCount(f)
  const have = listedFaCount(f)
  if (need && have < need) pct = Math.max(pct, Math.round(((need - have) / need) * 100))
  if (String(f.deploymentGapNotes || '').trim()) pct = Math.max(pct, 40)
  return Math.min(100, pct)
}

function dutyPct(cases: number): number {
  return Math.min(100, Math.round((Math.max(0, cases) / HDFC_DUTY_WINDOW_DAYS) * 100))
}

export function fourOpsBars(opts: {
  deployPct: number
  lateStart2fa: number
  outOfPost: number
  vacant: number
  sanctioned: number
}): HdfcRiskPart[] {
  const vacantPct = opts.sanctioned ? Math.round((opts.vacant / opts.sanctioned) * 100) : 0
  const latePct = dutyPct(opts.lateStart2fa)
  const oopPct = dutyPct(opts.outOfPost)
  return [
    { id: 'deploy', title: 'Deployment risk', score: opts.deployPct, max: 100, pct: opts.deployPct },
    {
      id: 'late2fa',
      title: 'Late start (2FA Branch)',
      score: opts.lateStart2fa,
      max: HDFC_DUTY_WINDOW_DAYS,
      pct: latePct,
    },
    { id: 'oop', title: 'Out of post', score: opts.outOfPost, max: HDFC_DUTY_WINDOW_DAYS, pct: oopPct },
    {
      id: 'vacant',
      title: 'Vacant post',
      score: opts.vacant,
      max: Math.max(opts.sanctioned, 1),
      pct: Math.min(100, vacantPct),
    },
  ]
}

function avgFourBars(sites: HdfcSsaBoardSite[]): HdfcRiskPart[] {
  const live = sites.filter((s) => s.status !== 'Draft' && s.parts?.length)
  if (!live.length) {
    return fourOpsBars({ deployPct: 0, lateStart2fa: 0, outOfPost: 0, vacant: 0, sanctioned: 0 })
  }
  const pick = (id: string) => Math.round(live.reduce((n, s) => n + (s.parts.find((p) => p.id === id)?.pct || 0), 0) / live.length)
  const late = live.reduce((n, s) => n + (s.lateStart2fa || 0), 0)
  const oop = live.reduce((n, s) => n + (s.outOfPost || 0), 0)
  const vac = live.reduce((n, s) => n + (s.vacantPosts || 0), 0)
  const san = live.reduce((n, s) => n + (s.sanctionedPosts || 0), 0)
  return fourOpsBars({
    deployPct: pick('deploy'),
    lateStart2fa: late,
    outOfPost: oop,
    vacant: vac,
    sanctioned: san,
  })
}

async function loadLatestDeployRows(branchIds: string[]): Promise<Map<string, MisDeployRow[]>> {
  const dates = (await getReportDates()).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().slice(-5)
  const ids = [...new Set(branchIds.filter(Boolean))]
  const out = new Map<string, MisDeployRow[]>()
  await Promise.all(
    ids.map(async (bid) => {
      for (const d of [...dates].reverse()) {
        const r = await getReport(bid, d)
        if (r?.rows?.length) {
          out.set(bid, r.rows)
          return
        }
      }
    }),
  )
  return out
}

function matchDeployRow(
  site: HdfcSsaBoardSite,
  sv: MisPeriodicalSurvey | undefined,
  client: MisClient | undefined,
  rows: MisDeployRow[],
): MisDeployRow | undefined {
  if (sv?.clientId) {
    const hit = rows.find((r) => r.clientId === sv.clientId)
    if (hit) return hit
  }
  const code = (site.bankCode || '').toLowerCase()
  const loc = norm(site.location)
  for (const r of rows) {
    const hay = norm(`${r.clientName} ${r.location}`)
    if (!hay) continue
    if (code && hay.replace(/\s/g, '').includes(code.replace(/\s/g, ''))) return r
    if (loc && hay.includes(loc)) return r
    if (client && norm(client.name) && hay.includes(norm(client.name))) return r
  }
  return undefined
}

export function analyseHdfcAssessment(sv: MisPeriodicalSurvey): {
  riskRate: number
  parts: HdfcRiskPart[]
  hotItems: HdfcHotItem[]
  formFlags: string[]
  riskNote: string
} {
  const scores = sv.scores || {}
  const parts: HdfcRiskPart[] = SURVEY_PARTS.map((p) => {
    const score = surveyPartTotal(scores, p)
    return {
      id: p.id,
      title: p.title.replace(/^Part \d+ — /, ''),
      score,
      max: p.maxTotal,
      pct: p.maxTotal ? Math.round((score / p.maxTotal) * 100) : 0,
    }
  })
  const hotItems: HdfcHotItem[] = SURVEY_PARTS.flatMap((p) =>
    p.items
      .filter((it) => (Number(scores[it.id]) || 0) >= 4)
      .map((it) => ({ label: it.label, score: Number(scores[it.id]) || 0 })),
  )
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
  const formFlags = hdfcFormRiskFlags(sv.hdfcForm)
  const total = parts.reduce((n, p) => n + p.score, 0)
  const loc = String(sv.locationName || sv.company || 'This unit').replace(/\s*\|\s*Br\.?\s*Code[^|]*/i, '').trim()
  const code = extractHdfcBankCode(sv)
  const fa = sanctionedFaCount(sv.hdfcForm)
  const riskNote = [
    `${loc}${code ? ` (Bank code ${code})` : ''}${fa === 2 ? ' — 2FA Branch' : fa ? ` — ${fa}FA` : ''}. Assessment score ${total}/180.`,
    hotItems.length
      ? `Priority items (score 4–5): ${hotItems.map((x) => x.label).join('; ')}.`
      : 'No checklist item is at score 4–5.',
    formFlags.length ? `Site observations: ${formFlags.join('; ')}.` : '',
  ]
    .filter(Boolean)
    .join(' ')
  return { riskRate: 0, parts: [], hotItems, formFlags, riskNote }
}

export async function assembleHdfcSsaBoard(opts: BuildBoardOpts): Promise<HdfcSsaBoardState[]> {
  const states = buildHdfcSsaBoard(opts)
  const branchIds = [...new Set(opts.surveys.map((sv) => sv.branchId).filter(Boolean))]
  const [incidents, clients, deployByBranch] = await Promise.all([
    loadRecentDutyIncidents(),
    getClients(undefined, { skipRepair: true }),
    loadLatestDeployRows(branchIds),
  ])
  applyDutyAndRiskToBoard({
    states,
    surveys: opts.surveys,
    incidents,
    clients,
    branches: opts.branches,
    deployByBranch,
  })
  return states
}

export async function loadRecentDutyIncidents(days = HDFC_DUTY_WINDOW_DAYS): Promise<MisDutyIncident[]> {
  const dates = (await getDutyDates()).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort()
  const window = dates.slice(-Math.max(7, days))
  const packs = await Promise.all(window.map((d) => getDutyIncidents(d)))
  return packs.flat()
}

function norm(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function tokensOf(...parts: string[]): string[] {
  const out = new Set<string>()
  for (const p of parts) {
    for (const t of norm(p).split(/\s+/)) {
      if (t.length < 5 || SKIP_TOKENS.has(t)) continue
      if (t === 'tada') continue
      out.add(t)
    }
  }
  return [...out]
}

function isHdfcDuty(inc: MisDutyIncident): boolean {
  return /hdfc/i.test(`${inc.client} ${inc.unit}`)
}

function hayOf(inc: MisDutyIncident): string {
  return norm(`${inc.client} ${inc.unit} ${inc.remarks}`)
}

export function applyDutyAndRiskToBoard(opts: {
  states: HdfcSsaBoardState[]
  surveys: MisPeriodicalSurvey[]
  incidents: MisDutyIncident[]
  clients: MisClient[]
  branches: { id: string; name: string }[]
  deployByBranch?: Map<string, MisDeployRow[]>
}): void {
  const svById = new Map(opts.surveys.map((sv) => [sv.id, sv]))
  const clientById = new Map(opts.clients.map((c) => [c.id, c]))
  const namesByBranch = new Map<string, Set<string>>()
  for (const b of opts.branches) {
    const mine = opts.clients.filter((c) => c.branchId === b.id)
    namesByBranch.set(b.id, clientNamesForBranch(mine))
  }

  for (const st of opts.states) {
    for (const city of st.branches) {
      for (const site of city.sites) {
        const sv = svById.get(site.id)
        if (!sv) continue
        const client = sv.clientId ? clientById.get(sv.clientId) : undefined
        const a = analyseHdfcAssessment(sv)
        site.bankCode = extractHdfcBankCode(sv, client)
        site.clientId = sv.clientId || ''
        attachSiteGeo(site, sv, client)
        site.riskRate = a.riskRate
        site.parts = a.parts
        site.hotItems = a.hotItems
        site.formFlags = a.formFlags
        site.riskNote = a.riskNote
        site.lateStart = 0
        site.lateStart2fa = 0
        site.outOfPost = 0
        site.vacantPosts = 0
        site.sanctionedPosts = 0
        site.is2Fa = sanctionedFaCount(sv.hdfcForm) === 2
      }
      city.lateStart = 0
      city.lateStart2fa = 0
      city.outOfPost = 0
      city.vacantPosts = 0
      city.sanctionedPosts = 0
    }
    st.lateStart = 0
    st.lateStart2fa = 0
    st.outOfPost = 0
    st.vacantPosts = 0
    st.sanctionedPosts = 0
  }

  const used = new Set<string>()
  const hdfcDuty = opts.incidents.filter(isHdfcDuty)

  const allSites: HdfcSsaBoardSite[] = opts.states.flatMap((s) => s.branches.flatMap((b) => b.sites))

  const matchSite = (inc: MisDutyIncident): HdfcSsaBoardSite | null => {
    const hay = hayOf(inc)
    if (!hay) return null
    let best: HdfcSsaBoardSite | null = null
    let bestScore = 0
    for (const site of allSites) {
      const sv = svById.get(site.id)
      const client = sv?.clientId ? clientById.get(sv.clientId) : undefined
      const code = (site.bankCode || '').toLowerCase()
      if (code && hay.replace(/\s/g, '').includes(code.toLowerCase())) {
        return site
      }
      let score = 0
      if (sv?.clientId && client) {
        const cn = norm(client.name)
        const cl = norm(client.location)
        if (cn && hay.includes(cn)) score += 6
        if (cl && hay.includes(cl)) score += 5
      }
      for (const tok of tokensOf(site.location, sv?.locationName || '', sv?.address || '', client?.location || '')) {
        if (hay.includes(tok)) score += tok.length >= 8 ? 4 : 2
      }
      if (score > bestScore) {
        bestScore = score
        best = site
      }
    }
    return bestScore >= 4 ? best : null
  }

  for (const inc of hdfcDuty) {
    const site = matchSite(inc)
    if (!site) continue
    used.add(inc.id)
    if (inc.type === 'late_start') site.lateStart += 1
    else if (inc.type === 'out_of_post') site.outOfPost += 1
  }

  for (const st of opts.states) {
    for (const city of st.branches) {
      const leftover = hdfcDuty.filter((inc) => {
        if (used.has(inc.id)) return false
        const hay = hayOf(inc)
        const cityN = norm(city.branchName)
        if (cityN === 'tada' && hay.includes('tadipatri')) return false
        if (cityN === 'tadipatri' && hay.includes('tada') && !hay.includes('tadipatri')) return false
        const names = namesByBranch.get(city.sites[0]?.branchId || '') || new Set<string>()
        return incidentMatchesBranch(inc, city.branchName, names)
      })
      for (const inc of leftover) {
        used.add(inc.id)
        if (inc.type === 'late_start') city.lateStart += 1
        else if (inc.type === 'out_of_post') city.outOfPost += 1
      }
      city.lateStart += city.sites.reduce((n, s) => n + s.lateStart, 0)
      city.outOfPost += city.sites.reduce((n, s) => n + s.outOfPost, 0)
    }
    st.lateStart = st.branches.reduce((n, b) => n + b.lateStart, 0)
    st.outOfPost = st.branches.reduce((n, b) => n + b.outOfPost, 0)
  }

  for (const st of opts.states) {
    for (const city of st.branches) {
      for (const site of city.sites) {
        const sv = svById.get(site.id)
        const client = sv?.clientId ? clientById.get(sv.clientId) : undefined
        const rows = opts.deployByBranch?.get(site.branchId) || []
        const row = matchDeployRow(site, sv, client, rows)
        const form = sv?.hdfcForm || {}
        const is2 = sanctionedFaCount(form) === 2
        site.is2Fa = is2
        site.lateStart2fa = is2 ? site.lateStart : 0
        let vac = 0
        let san = sanctionedFaCount(form)
        if (row) {
          const t = rowDeployTotals(row)
          vac = t.vac
          san = t.san || san
        } else {
          vac = Math.max(0, san - listedFaCount(form))
        }
        site.vacantPosts = vac
        site.sanctionedPosts = san
        const deployPct = Math.max(ssaDeployRiskPct(form), san ? Math.round((vac / san) * 100) : 0)
        site.parts = fourOpsBars({
          deployPct,
          lateStart2fa: site.lateStart2fa,
          outOfPost: site.outOfPost,
          vacant: vac,
          sanctioned: san,
        })
        site.riskRate = Math.round(site.parts.reduce((n, p) => n + p.pct, 0) / 4)
        site.riskNote = [
          site.riskNote,
          `Risk rate ${site.riskRate}% from four bars: Deployment ${deployPct}% · Late start (2FA Branch) ${site.lateStart2fa} · Out of post ${site.outOfPost} · Vacant post ${vac}${san ? `/${san}` : ''}.`,
        ]
          .filter(Boolean)
          .join(' ')
      }
      city.lateStart2fa = city.sites.reduce((n, s) => n + (s.lateStart2fa || 0), 0)
      city.vacantPosts = city.sites.reduce((n, s) => n + (s.vacantPosts || 0), 0)
      city.sanctionedPosts = city.sites.reduce((n, s) => n + (s.sanctionedPosts || 0), 0)
      city.parts = avgFourBars(city.sites)
      const scored = city.sites.filter((s) => s.status !== 'Draft')
      city.avgRiskRate = scored.length
        ? Math.round(scored.reduce((n, s) => n + (s.riskRate || 0), 0) / scored.length)
        : 0
      rollupCityGeo(city)
    }
    st.lateStart2fa = st.branches.reduce((n, b) => n + (b.lateStart2fa || 0), 0)
    st.vacantPosts = st.branches.reduce((n, b) => n + (b.vacantPosts || 0), 0)
    st.sanctionedPosts = st.branches.reduce((n, b) => n + (b.sanctionedPosts || 0), 0)
    const allSites = st.branches.flatMap((b) => b.sites)
    st.parts = avgFourBars(allSites)
    const scored = st.branches.filter((b) => b.submitted > 0)
    st.avgRiskRate = scored.length
      ? Math.round(scored.reduce((n, b) => n + b.avgRiskRate * b.submitted, 0) / st.submitted)
      : 0
  }
}
