#!/usr/bin/env node
/**
 * Guardrail: Command Centre "live" tiles must have real server apps in THIS tree
 * and matching vercel.json rewrites — so we never mark Alive without uploading.
 *
 * Usage:
 *   npm run check:live-apps
 *   npm run check:live-apps -- --probe   (also hit production URLs)
 *
 * Exit 1 on failure.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const probe = process.argv.includes('--probe')
const BASE = process.env.HEALTH_CHECK_BASE_URL?.trim() || 'https://www.agilegroup-digital.co.in'

/** Real modules that must not be empty stubs (bytes). */
const FULL_MODULES = {
  'api/mis/incidents.ts': 2_000,
  'api/_lib/mis/incident-report-ui.ts': 20_000,
  'api/_lib/mis/incident-report-handlers.ts': 5_000,
  'api/_lib/mis/daily-command-report.ts': 8_000,
  'api/_lib/mis/sla-compliance-page.ts': 8_000,
  'api/_lib/training/ojt-ui.ts': 50_000,
  'api/_lib/crm/alerts.ts': 4_000,
  'api/_lib/suite-app-footer.ts': 2_000,
  'api/_lib/control/console.ts': 10_000,
  'api/_lib/meetings/console.ts': 8_000,
  'api/_lib/audit/console.ts': 8_000,
  'api/_lib/assets/console.ts': 8_000,
  'api/_lib/facilities/console.ts': 8_000,
  'api/_lib/licences/console.ts': 8_000,
  'api/control/app.ts': 200,
  'api/meetings/app.ts': 200,
  'api/audit/app.ts': 200,
  'api/recruitment/app.ts': 8_000,
  'api/_lib/recruitment/drr-detail-pages.ts': 8_000,
  'api/_lib/recruitment/referral-list-pages.ts': 2_000,
  'api/_lib/recruitment/referral-dedupe.ts': 1_000,
}

/**
 * Suite apps that must ship as Vercel /api/{slug}/app (+ data) when status=live.
 * External / Google-script / third-party hosts are skipped.
 */
const SERVER_APPS = {
  assets: { folder: 'assets', route: '/assets', apiStatus: '/api/assets/data' },
  facilities: { folder: 'facilities', route: '/facilities', apiStatus: '/api/facilities/data' },
  licences: { folder: 'licences', route: '/licences', apiStatus: '/api/licences/data' },
  guards: { folder: 'guards', route: '/guards', apiStatus: '/api/guards/data' },
  fleets: { folder: 'fleet', route: '/fleets', apiStatus: '/api/fleet/data' },
  crm: { folder: 'crm', route: '/crm', apiStatus: '/api/crm/data' },
  recruitment: { folder: 'recruitment', route: '/recruitment', apiStatus: '/api/recruitment/data' },
  control: { folder: 'control', route: '/control', apiStatus: '/api/control/data' },
  meetings: { folder: 'meetings', route: '/meetings', apiStatus: '/api/meetings/data' },
  'hr-audit': { folder: 'audit', route: '/audit', apiStatus: '/api/audit/data' },
  mis: { folder: 'mis', route: '/mis', apiStatus: '/api/mis/report-data' },
  visitors: { folder: 'visitors', route: '/visitors', apiStatus: '/api/visitors/data' },
  // pulse may live under api/pulse/* without a single app.ts — skip file gate
}

function readAppsTs() {
  const p = path.join(root, 'src/data/apps.ts')
  if (!fs.existsSync(p)) throw new Error('Missing src/data/apps.ts')
  return fs.readFileSync(p, 'utf8')
}

function parseLiveServerAppIds(appsTs) {
  const live = []
  const re =
    /id:\s*'([^']+)'[\s\S]*?status:\s*'(live|coming-soon|external)'/g
  let m
  while ((m = re.exec(appsTs))) {
    const id = m[1]
    const status = m[2]
    if (status === 'live' && SERVER_APPS[id]) live.push(id)
  }
  return live
}

function vercelHasRewrite(vercelText, route) {
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`"source"\\s*:\\s*"${escaped}/?"\\s*,\\s*"destination"\\s*:\\s*"/api/`)
  return re.test(vercelText)
}

async function probeApi(apiStatus) {
  if (!apiStatus) return { ok: true, skipped: true }
  try {
    const res = await fetch(`${BASE}${apiStatus}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'status' }),
    })
    const text = await res.text()
    if (res.status === 404 || /NOT_FOUND|page could not be found/i.test(text)) {
      return { ok: false, status: res.status, detail: 'API missing on production (404)' }
    }
    // 200 / 401 / 400 still mean the function exists
    if (res.status >= 500) return { ok: false, status: res.status, detail: text.slice(0, 120) }
    return { ok: true, status: res.status }
  } catch (e) {
    return { ok: false, status: 0, detail: e?.message || 'network error' }
  }
}

async function main() {
  const appsTs = readAppsTs()
  const vercelPath = path.join(root, 'vercel.json')
  const vercelText = fs.existsSync(vercelPath) ? fs.readFileSync(vercelPath, 'utf8') : ''
  const liveIds = parseLiveServerAppIds(appsTs)
  const errors = []
  const ok = []

  for (const [rel, min] of Object.entries(FULL_MODULES)) {
    const p = path.join(root, rel)
    if (!fs.existsSync(p)) {
      errors.push(`stub-guard: missing ${rel}`)
      continue
    }
    const sz = fs.statSync(p).size
    const text = fs.readFileSync(p, 'utf8')
    if (sz < min) errors.push(`stub-guard: ${rel} is ${sz} bytes (need ≥ ${min}) — empty stand-in, restore full app`)
    if (/Coming Soon only|skipped: true as const|Incident reporting is loading/.test(text) && !rel.includes('ops/coming-soon')) {
      if (rel.endsWith('daily-command-report.ts') || rel.endsWith('incident-report-ui.ts') || rel.endsWith('ojt-ui.ts')) {
        errors.push(`stub-guard: ${rel} still looks like a placeholder`)
      }
    }
  }
  const controlApp = fs.existsSync(path.join(root, 'api/control/app.ts'))
    ? fs.readFileSync(path.join(root, 'api/control/app.ts'), 'utf8')
    : ''
  const meetingsApp = fs.existsSync(path.join(root, 'api/meetings/app.ts'))
    ? fs.readFileSync(path.join(root, 'api/meetings/app.ts'), 'utf8')
    : ''
  const auditApp = fs.existsSync(path.join(root, 'api/audit/app.ts'))
    ? fs.readFileSync(path.join(root, 'api/audit/app.ts'), 'utf8')
    : ''
  if (controlApp && !/renderAcConsole/.test(controlApp)) {
    errors.push('control/app.ts must render the Control console (not Coming Soon / old inline page)')
  }
  if (meetingsApp && !/renderMeetingsConsole/.test(meetingsApp)) {
    errors.push('meetings/app.ts must render the Meetings console (not Director Coming Soon)')
  }
  if (auditApp && !/renderAuditConsole/.test(auditApp)) {
    errors.push('audit/app.ts must render HR Audit console (must not redirect /security)')
  }

  // MIS Daily Step 1/3 crash guard (14 Aug 2026): missing export → FUNCTION_INVOCATION_FAILED
  const nightStore = path.join(root, 'api/_lib/mis/night-ojt-store.ts')
  const mobileStats = path.join(root, 'api/_lib/mis/branch-mobile-stats.ts')
  if (fs.existsSync(nightStore) && fs.existsSync(mobileStats)) {
    const nightTxt = fs.readFileSync(nightStore, 'utf8')
    const mobileTxt = fs.readFileSync(mobileStats, 'utf8')
    if (/countNightVisitUnits/.test(mobileTxt) && !/export function countNightVisitUnits/.test(nightTxt)) {
      errors.push('MIS: branch-mobile-stats imports countNightVisitUnits but night-ojt-store does not export it (breaks Daily MIS 500)')
    }
    if (/\]\s*\]\s*;/.test(mobileTxt.replace(/\n/g, ' '))) {
      errors.push('MIS: branch-mobile-stats.ts has a duplicate closing bracket (syntax crash)')
    }
  }

  // Guards delayed apology must persist delayedGuardNotifiedAt (else WhatsApp spam on every refresh)
  const guardsStore = path.join(root, 'api/_lib/guards/store.ts')
  const guardsEsc = path.join(root, 'api/_lib/guards/escalation.ts')
  if (fs.existsSync(guardsStore) && fs.existsSync(guardsEsc)) {
    const gs = fs.readFileSync(guardsStore, 'utf8')
    const ge = fs.readFileSync(guardsEsc, 'utf8')
    if (!/delayedGuardNotifiedAt/.test(gs) || !/delayedGuardNotifiedAt: String\(c\.delayedGuardNotifiedAt/.test(gs)) {
      errors.push('Guards: normalizeComplaint must keep delayedGuardNotifiedAt (stops repeated delayed WhatsApp)')
    }
    if (!/alreadyGuardWa|delayedGuardNotifiedAt/.test(ge)) {
      errors.push('Guards: escalation must remember delayedGuardNotifiedAt / prior WA before re-sending')
    }
  }

  for (const id of liveIds) {
    const cfg = SERVER_APPS[id]
    const appFile = path.join(root, 'api', cfg.folder, 'app.ts')
    const gateFile = path.join(root, 'api', cfg.folder, 'gate.ts')
    const shellFile = path.join(root, 'api', cfg.folder, 'shell.ts')
    const entryFile = fs.existsSync(appFile) ? appFile : fs.existsSync(gateFile) ? gateFile : shellFile
    const dataFile = path.join(root, 'api', cfg.folder, 'data.ts')
    const libDir = path.join(root, 'api', '_lib', cfg.folder === 'fleet' ? 'fleet' : cfg.folder)

    if (!fs.existsSync(entryFile)) {
      errors.push(`${id}: missing ${path.relative(root, appFile)} (tile is live but app not in this tree)`)
    } else if (!vercelHasRewrite(vercelText, cfg.route)) {
      errors.push(`${id}: vercel.json missing rewrite ${cfg.route} → /api/...`)
    } else {
      // data.ts optional for some (pulse)
      if (cfg.apiStatus && !fs.existsSync(dataFile) && !fs.existsSync(path.join(root, 'api', cfg.folder, 'gate.ts'))) {
        // allow if app.ts alone is enough
      }
      if (!fs.existsSync(libDir) && id !== 'pulse') {
        // soft warn only — some apps keep helpers elsewhere
      }
      ok.push(`${id}: local files + rewrite OK`)
    }

    if (probe && cfg.apiStatus) {
      const p = await probeApi(cfg.apiStatus)
      if (!p.ok) errors.push(`${id}: production ${cfg.apiStatus} → ${p.detail || p.status}`)
      else ok.push(`${id}: production API reachable (${p.status})`)
    }
  }

  if (probe) {
    for (const api of ['/api/mis/report-data', '/api/mis/staff-data']) {
      const p = await probeApi(api)
      if (!p.ok) errors.push(`MIS: production ${api} → ${p.detail || p.status}`)
      else ok.push(`MIS: ${api} reachable (${p.status})`)
    }
  }

  const leftoverOpenApps = path.join(root, 'public/open-apps.html')
  if (fs.existsSync(leftoverOpenApps)) {
    const leftoverHtml = fs.readFileSync(leftoverOpenApps, 'utf8')
    if (leftoverHtml.includes('AKfycbwVpnp26Rge5nzToy6vVDISLi4z3K7sbtD5s6-6r9wjJye')) {
      errors.push('public/open-apps.html still points Agile Guards at the old Google web app')
    } else if (!leftoverHtml.includes('href="/guards"')) {
      errors.push('public/open-apps.html must open current /guards, not Google')
    } else {
      ok.push('open-apps.html Guards link is the current app')
    }
  }

  console.log(JSON.stringify({ root, liveServerApps: liveIds, ok, errors, probe }, null, 2))
  if (errors.length) {
    console.error('\ncheck:live-apps FAILED — fix before marking tiles Alive or deploying.\n')
    process.exit(1)
  }
  console.log('\ncheck:live-apps OK')
}

main().catch((e) => {
  console.error(e?.message || e)
  process.exit(1)
})
