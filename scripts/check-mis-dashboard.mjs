#!/usr/bin/env node
/**
 * Management dashboard locks:
 * - Recruitment is people recruited that day (named list), never mobileActualPct
 * - Duty: Deployment 100% = Timely + Late + Not Started (vacant)
 * - DSO / outstanding tiles use a smaller font
 *
 *   npm run check:mis-dashboard
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
let failed = false
function fail(msg) {
  console.error('FAIL:', msg)
  failed = true
}
function ok(msg) {
  console.log('OK:', msg)
}

const fields = fs.readFileSync(path.join(root, 'api/_lib/mis/summary-fields.ts'), 'utf8')
const stats = fs.readFileSync(path.join(root, 'api/_lib/mis/dashboard-stats.ts'), 'utf8')
const home = fs.readFileSync(path.join(root, 'api/mis/dashboard-home.ts'), 'utf8')
const admin = fs.readFileSync(path.join(root, 'api/mis/admin-data.ts'), 'utf8')
const daily = fs.readFileSync(path.join(root, 'api/_lib/mis/daily-recruits.ts'), 'utf8')
const md = fs.readFileSync(path.join(root, 'api/mis/md.ts'), 'utf8')
const staff = fs.readFileSync(path.join(root, 'api/mis/staff.ts'), 'utf8')

if (/s\?\.recruitment \?\? s\?\.mobileActualPct|s\.recruitment \?\? s\.mobileActualPct/.test(fields)) {
  fail('summaryRecruitment must not fall back to a mobile percentage')
} else ok('recruitment is not a mobile %')

if (!daily.includes('export async function listDailyRecruits') || !admin.includes("action === 'recruitList'")) {
  fail('dashboard must load the named recruit list on a separate action (not inside mdsummary)')
} else if (/getDutyIncidents\(range\.anchorDate\),\s*listDailyRecruits/.test(admin)) {
  fail('do not block mdsummary on the recruit name list')
} else ok('recruit list is separate from dashboard load')

if (!stats.includes('latestByBranch') || !stats.includes("d.type === 'late_start'")) {
  fail('duty tiles must use one report per branch and typed late_start')
} else if (!stats.includes('notStartedPct') || !stats.includes('Timely Start % + Late Start % + Not Started %')) {
  fail('duty formula must be Timely + Late + Not Started = 100%')
} else ok('duty start uses Timely + Late + Not Started')

if (!home.includes('Not Started') || !home.includes('recruitRows')) {
  fail('dashboard must show Not Started % and the recruit name list')
} else ok('dashboard shows Not Started and recruit list')

if (!home.includes('#kRecv .kcard .v')) {
  fail('DSO / outstanding banner must use a smaller font')
} else ok('DSO / outstanding font is reduced')

if (home.includes("kc('pu tap',t.recruitment") || home.includes('kc("pu tap",t.recruitment')) {
  fail('Recruitment tile must not use MIS open-posts (t.recruitment) — that was the false 63')
} else if (!home.includes('paintRecruitTile') || !home.includes('rejoinTile') || !daily.includes("kind === 'rejoin'")) {
  fail('dashboard must show Recruitment and Rejoin as two named counts')
} else if (!staff.includes('>Rejoin<') && !staff.includes('>Rejoin</span>')) {
  fail('HOD dashboard must also show a Rejoin number next to Recruitment')
} else ok('Recruitment and Rejoin tiles use named people, not open posts')

if (daily.includes('deployed +=') || /from '\.\.\/recruitment\/store\.js'/.test(daily)) {
  fail('do not count slim DRR deployed totals or join-back dumps as people recruited')
} else ok('daily recruit count is named new joiners only')

const importFile = fs.readFileSync(path.join(root, 'api/_lib/mis/collection-import.ts'), 'utf8')
const statsFile = fs.readFileSync(path.join(root, 'api/_lib/mis/dashboard-stats.ts'), 'utf8')
const store = fs.readFileSync(path.join(root, 'api/_lib/mis/store.ts'), 'utf8')
if (/for \(const ver of \[5, 6, 7\]/.test(store)) {
  fail('do not serve old mdsummary cache versions — that hid the new collection %')
} else ok('dashboard cache rebuilds instead of serving an old copy')

const autofill = fs.readFileSync(path.join(root, 'api/_lib/mis/summary-autofill.ts'), 'utf8')
const dailyMail = fs.readFileSync(path.join(root, 'api/_lib/mis/daily-command-report.ts'), 'utf8')
const digestOst = fs.readFileSync(path.join(root, 'api/_lib/mis/digest.ts'), 'utf8')
if (!importFile.includes('LATEST_OST_FOOTER') || !importFile.includes("July'26")) {
  fail('OST parser must read the Friday July sheet, not only June')
} else if (statsFile.includes('ostCollectedL + colCollected') || autofill.includes('ostCollected + weekCollected') || fs.readFileSync(path.join(root, 'api/mis/collection.ts'), 'utf8').includes('ostCollected+week')) {
  fail('month collection % must not add weekly cash on top of OST collected (that became 100%)')
} else if (!autofill.includes('export function ostMonthCollectionPct') || !digestOst.includes('ostMonthCollectionPct(col)')) {
  fail('consolidated MIS Collection % must use Friday OST, not weekly summary.collectionPct')
} else if (!statsFile.includes('getLatestOstBaseline') || !store.includes('export async function getLatestOstBaseline')) {
  fail('month collection % must read the latest Friday OST, not this week only')
} else if (!home.includes('as on ') || !home.includes('Month Collection %')) {
  fail('dashboard must show Month Collection % as on the Friday OST date')
} else if (dailyMail.includes('LOKESH_CC_EMAIL') && !dailyMail.includes('[director, gmail, ...hodTo]')) {
  fail('4:30 PM MIS mail must put Director on To, not only CC')
} else ok('month collection % is Friday OST only (10th–10th); weekly does not change it')

if (!md.includes('applyMdRecruits') || !md.includes('Rejoin') || !daily.includes('applyDailyRecruitsToDeployment')) {
  fail('MD Sir deployment must use named Recruitment and Rejoin, not open posts')
} else ok('MD Sir deployment includes named Recruitment and Rejoin')

const period = fs.readFileSync(path.join(root, 'api/_lib/mis/dashboard-period.ts'), 'utf8')
const match = fs.readFileSync(path.join(root, 'api/_lib/mis/branch-match.ts'), 'utf8')
if (!period.includes('buildBranchReportMap') || !period.includes('pickLatestBranchReports')) {
  fail('MD Sir / dashboard must match Daily MIS by branch group, not only exact id')
} else if (!match.includes('preferReport') || !match.includes('export function isSubmitted')) {
  fail('legacy Hyderabad submit must win over an empty draft on a new branch id')
} else if (!period.includes("!String(r.submittedAt ?? '').trim()") && !period.includes('isSubmitted(r)')) {
  fail('pickLatest must ignore Daily MIS drafts')
} else ok('MD Sir picks Hyderabad Daily MIS even when the branch id changed')

const digest = fs.readFileSync(path.join(root, 'api/_lib/mis/digest.ts'), 'utf8')
if (!admin.includes('if (!isSubmitted(r))') || !digest.includes('if (!isSubmitted(r))')) {
  fail('draft Daily MIS must not count as submitted on MD / status / reminders')
} else if (!md.includes('No Daily MIS submitted yet') || !home.includes('filter(function(x){return x.submitted;}') || !fs.readFileSync(path.join(root, 'api/mis/submission.ts'), 'utf8').includes('filter(function(a){return a.submitted;}')) {
  fail('MD Sir Report, dashboard and Submission Status must hide branches that have not submitted today')
} else {
  const ver = Number((store.match(/MD_SUMMARY_CACHE_VERSION = (\d+)/) || [])[1] || 0)
  if (ver < 13) fail('bump MD summary cache after changing collection % / today\'s deployment list')
  else ok('today\'s MD / dashboard list only real Daily MIS submits')
}

if (/onclick="el\('\\?'/.test(home) || /onclick="el\('recruitList'\)/.test(home)) {
  fail('Recruitment tile onclick must not nest quotes (breaks the whole dashboard script)')
} else if (!home.includes('jumpRecruit()')) {
  fail('Recruitment tile must call jumpRecruit() so the page script can parse')
} else ok('Recruitment tile click does not break the page script')

const scriptMatch = home.match(/<script>\n([\s\S]*?)<\/script>/)
if (!scriptMatch) {
  fail('dashboard page must include a script block')
} else {
  const js = scriptMatch[1].replace(/\$\{[^}]+\}/g, 'void 0;')
  const tmp = path.join(root, 'scripts', '.tmp-mis-dash.js')
  fs.writeFileSync(tmp, js)
  try {
    const { spawnSync } = await import('node:child_process')
    const chk = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' })
    if (chk.status !== 0) fail('dashboard page script has a syntax error: ' + (chk.stderr || chk.stdout || '').trim())
    else ok('dashboard page script parses')
  } finally {
    try { fs.unlinkSync(tmp) } catch { /* ignore */ }
  }
}

const incidentsPage = path.join(root, 'api/mis/incidents.ts')
const vercel = fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')
if (!fs.existsSync(incidentsPage)) {
  fail('api/mis/incidents.ts is missing — Management Incident Reporting becomes 404')
} else {
  const inc = fs.readFileSync(incidentsPage, 'utf8')
  if (!inc.includes("MIS_ACTIVE = '/mis-incidents'") || !inc.includes('incidentReportsOverview')) {
    fail('api/mis/incidents.ts must serve /mis-incidents and load incidentReportsOverview')
  } else if (!vercel.includes('"/mis-incidents"') || !vercel.includes('"/api/mis/incidents"')) {
    fail('vercel.json must rewrite /mis-incidents to /api/mis/incidents')
  } else ok('Incident Reporting page file is present')
}

const reportData = fs.readFileSync(path.join(root, 'api/mis/report-data.ts'), 'utf8')
const shortage = fs.readFileSync(path.join(root, 'api/_lib/mis/manpower-shortage.ts'), 'utf8')
const deployMath = fs.readFileSync(path.join(root, 'api/_lib/mis/deploy-math.ts'), 'utf8')
if (!reportData.includes('const absA = picked.fromLast ? 0 : p ? p.absA : 0')) {
  fail('new day must not copy yesterday Absent (that showed Mumbai as vacant with no OT)')
} else if (!reportData.includes('Absent and OT start at zero')) {
  fail('carry note must say Absent and OT start at zero')
} else ok('new day does not copy Absent onto a zero-OT vacancy')

if (!shortage.includes('if (vacant <= 0) return emptyVacancyRanks(0)')) {
  fail('vacancy rank table must be empty when Absent − OT is 0')
} else ok('vacancy ranks follow today Absent − OT, not leftover shortage')

if (!deployMath.includes('export function undoCarriedAbsentWithoutOt') || /mumbaiTicket/.test(store)) {
  fail('false vacancy repair must run for every branch, not Mumbai only')
} else if (!store.includes('undoCarriedAbsentWithoutOt') || !store.includes('getReportsBefore') || !store.includes('VACANCY_CARRY_LOOKBACK_DAYS = 7')) {
  fail('saved reports must unwrap copied Absent on every branch (7-day lookback)')
} else if (!store.includes('repairReportMap')) {
  fail('week/month dashboard must repair every branch, not only today')
} else ok('every branch is protected from copied Absent + zero OT')

if (!deployMath.includes('for (const lastByKey of dayMaps)') || !deployMath.includes('if (absL !== absT || otL <= 0) continue')) {
  fail('carry unwrap must walk recent days on the same site only')
} else {
  const shifts = ['A', 'G', 'B', 'C']
  const siteKey = (row) => {
    const id = String(row.clientId || '').trim()
    return id ? `id:${id}` : `nm:${String(row.clientName || '').trim().toUpperCase()}|${String(row.location || '').trim().toUpperCase()}`
  }
  const clampOt = (san, abs, ot) => {
    const s = Math.max(0, Math.floor(Number(san) || 0))
    if (s <= 0) return 0
    return Math.min(Math.max(0, Math.floor(Number(ot) || 0)), Math.max(0, Math.floor(Number(abs) || 0)), s)
  }
  const undo = (todayRows, priorDaysRows) => {
    const days = !priorDaysRows.length ? [] : Array.isArray(priorDaysRows[0]) ? priorDaysRows : [priorDaysRows]
    const dayMaps = days.map((lastRows) => {
      const lastByKey = new Map()
      for (const r of lastRows) lastByKey.set(siteKey(r), r)
      return lastByKey
    })
    let changed = false
    const rows = todayRows.map((row) => {
      const key = siteKey(row)
      const next = { ...row }
      let rowChanged = false
      for (const s of shifts) {
        const absT = Math.max(0, Math.floor(Number(next[`abs${s}`]) || 0))
        const otT = Math.max(0, Math.floor(Number(next[`ot${s}`]) || 0))
        if (otT > 0 || absT <= 0) continue
        for (const lastByKey of dayMaps) {
          const last = lastByKey.get(key)
          if (!last) continue
          const absL = Math.max(0, Math.floor(Number(last[`abs${s}`]) || 0))
          const otL = clampOt(last[`san${s}`] || next[`san${s}`] || 0, absL, last[`ot${s}`] || 0)
          if (absL !== absT || otL <= 0) continue
          const realVac = Math.max(0, absL - otL)
          if (absT === realVac) break
          next[`abs${s}`] = realVac
          rowChanged = true
          break
        }
      }
      if (!rowChanged) return row
      changed = true
      return next
    })
    return { rows, changed }
  }
  const covered = undo([{ clientId: 'c1', sanA: 10, absA: 4, otA: 0 }], [[{ clientId: 'c1', sanA: 10, absA: 4, otA: 4 }]])
  const partial = undo([{ clientId: 'c1', sanA: 10, absA: 5, otA: 0 }], [[{ clientId: 'c1', sanA: 10, absA: 5, otA: 2 }]])
  const real = undo([{ clientId: 'c1', sanA: 10, absA: 5, otA: 0 }], [[{ clientId: 'c1', sanA: 10, absA: 5, otA: 0 }]])
  const chain = undo(
    [{ clientId: 'c1', sanA: 10, absA: 4, otA: 0 }],
    [[{ clientId: 'c1', sanA: 10, absA: 4, otA: 0 }], [{ clientId: 'c1', sanA: 10, absA: 4, otA: 4 }]],
  )
  const other = undo([{ clientId: 'hyd', sanA: 8, absA: 3, otA: 0 }], [[{ clientId: 'mum', sanA: 8, absA: 3, otA: 3 }]])
  if (!covered.changed || covered.rows[0].absA !== 0) fail('covered OT must not stay as vacant')
  else if (partial.rows[0].absA !== 3) fail('keep yesterday real vacant (Absent − OT)')
  else if (real.changed) fail('real vacant (no OT on those days) must stay')
  else if (chain.rows[0].absA !== 0) fail('weekend copy chain must unwrap on every branch')
  else if (other.changed) fail('must not mix another site or branch row')
  else ok('copied Absent unwraps on every branch; real vacant stays')
}

if (failed) {
  console.error('\ncheck:mis-dashboard FAILED\n')
  process.exit(1)
}
console.log('\ncheck:mis-dashboard OK')
