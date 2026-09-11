#!/usr/bin/env node
/**
 * Lock: Management branch dropdowns include All Branches.
 *
 *   npm run check:mgmt-all-branches
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

const helper = path.join(root, 'api/_lib/suite-mgmt-branch-select.ts')
if (!fs.existsSync(helper)) fail('missing suite-mgmt-branch-select.ts')
else {
  const t = fs.readFileSync(helper, 'utf8')
  if (!t.includes('All Branches') || !t.includes("MGMT_ALL_BRANCHES_VALUE = 'ALL'")) {
    fail('helper must define All Branches / ALL')
  } else ok('shared All Branches helper')
}

const doorUi = fs.readFileSync(path.join(root, 'api/_lib/mis/client-door-ui.ts'), 'utf8')
if (!doorUi.includes('suiteMgmtBranchOptionsHtml') && !doorUi.includes('All Branches')) {
  fail('Send client door Management must offer All Branches')
} else ok('Send client door has All Branches')

const doorH = fs.readFileSync(path.join(root, 'api/_lib/mis/client-door-handlers.ts'), 'utf8')
if (!doorH.includes('isMgmtAllBranches')) {
  fail('Send client door boot must support ALL')
} else ok('Send client door API supports All Branches')

const cv = fs.readFileSync(path.join(root, 'api/_lib/mis/client-visit-ui.ts'), 'utf8')
if (!cv.includes(">All Branches</option>") && !cv.includes("'All Branches'")) {
  fail('Client Visits Management must offer All Branches')
} else ok('Client Visits has All Branches')

const nv = fs.readFileSync(path.join(root, 'api/_lib/mis/night-visit-ui.ts'), 'utf8')
if (!nv.includes('All Branches')) fail('Night Visit Management must offer All Branches')
else ok('Night Visit has All Branches')

const ps = fs.readFileSync(path.join(root, 'api/_lib/mis/periodical-survey-ui.ts'), 'utf8')
if (!ps.includes('All Branches') && !ps.includes('All branches')) {
  fail('Site Security Assessment (SSA) Management must offer All Branches')
} else ok('Site Security Assessment (SSA) has All Branches')

const handlers = fs.readFileSync(path.join(root, 'api/_lib/mis/client-visit-handlers.ts'), 'utf8')
if (!handlers.includes('isMgmtAllBranches') || !handlers.includes("branchFilter = 'ALL'")) {
  fail('Client Visit boot must support ALL')
} else ok('Client Visit API supports All Branches')

const nightHandlers = fs.readFileSync(path.join(root, 'api/_lib/mis/night-visit-handlers.ts'), 'utf8')
if (!nightHandlers.includes('isMgmtAllBranches') || !nightHandlers.includes("return 'ALL'")) {
  fail('Night Visit handlers must support ALL')
} else ok('Night Visit API supports All Branches')

const guardsApp = fs.readFileSync(path.join(root, 'api/guards/app.ts'), 'utf8')
if (!guardsApp.includes('suiteMgmtBranchOptionsHtml')) {
  fail('Guards Management dashboard must offer All Branches')
} else ok('Guards Management has All Branches')

const ops = fs.readFileSync(path.join(root, 'api/_lib/ops/shell.ts'), 'utf8')
if (!ops.includes('>All Branches</option>')) fail('Ops Management branchSel must say All Branches')
else ok('Ops has All Branches')

const fleetApp = fs.readFileSync(path.join(root, 'api/fleet/app.ts'), 'utf8')
if (
  !fleetApp.includes('suiteMgmtBranchOptionsHtml') ||
  !fleetApp.includes("n:'Monthly Data'") ||
  !fleetApp.includes("n:'Documents Validity'") ||
  !fleetApp.includes("fn:'dailyTrip'") ||
  !fleetApp.includes("fn:'submittedDaily'")
) {
  fail('Fleet Management must keep HOD Monthly / Documents / Daily Pre & Post Trip / Submitted Daily Report with All Branches')
} else if ((fleetApp.match(/\{n:'Daily Pre & Post Trip',fn:'dailyTrip'/g) || []).length < 2) {
  fail('Fleet Daily Pre & Post Trip must stay on Staff and Management')
} else if ((fleetApp.match(/\{n:'Submitted Daily Report',fn:'submittedDaily'/g) || []).length < 2) {
  fail('Fleet Submitted Daily Report must stay on Staff and Management')
} else ok('Fleet Management HOD menus have All Branches')

const avmApp = fs.readFileSync(path.join(root, 'api/visitors/app.ts'), 'utf8')
if (!avmApp.includes('Client Name (select)')) {
  fail('AVM Management lists are client-wise (Client Name select)')
} else ok('AVM Management is client-wise (no dual portal)')

const liveStaff = fs.readFileSync(path.join(root, 'api/_lib/agile-live/staff-page.ts'), 'utf8')
if (!liveStaff.includes('suiteMgmtBranchOptionsHtml') || !liveStaff.includes('All Branches')) {
  fail('Agile Live Management must offer All Branches')
} else ok('Agile Live Management has All Branches')

const faRec = fs.readFileSync(path.join(root, 'api/_lib/training/fa-records-page.ts'), 'utf8')
if (!faRec.includes('suiteMgmtBranchOptionsHtml') || !faRec.includes('All Branches')) {
  fail('Facility Attendant Training Management must offer All Branches')
} else ok('FA Training Management has All Branches')

const rule = path.join(root, '.cursor/rules/suite-mgmt-all-branches.mdc')
if (!fs.existsSync(rule)) fail('missing suite-mgmt-all-branches rule')
else ok('Cursor rule present')

if (failed) {
  console.error('\ncheck:mgmt-all-branches FAILED\n')
  process.exit(1)
}
console.log('\ncheck:mgmt-all-branches OK')
