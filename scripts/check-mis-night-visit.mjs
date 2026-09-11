#!/usr/bin/env node
/**
 * Lock: Night Visit Save schedule is wired (not Unknown action).
 *
 *   npm run check:night-visit
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

const needed = [
  'api/_lib/mis/night-visit-ui.ts',
  'api/_lib/mis/night-visit-session-store.ts',
  'api/_lib/mis/night-visit-handlers.ts',
]
for (const rel of needed) {
  if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`)
  else ok(`has ${rel}`)
}

const ui = fs.readFileSync(path.join(root, 'api/_lib/mis/night-visit-ui.ts'), 'utf8')
if (!ui.includes("api('nightVisitSaveSession'")) fail('UI must call nightVisitSaveSession')
else ok('UI saves with nightVisitSaveSession')
if (!ui.includes('Add Night visit') || !ui.includes('function addNightVisit')) {
  fail('Calendar must have Add Night visit button')
} else ok('Add Night visit button next to calendar')
if (!ui.includes('Vehicle Requirement') || !ui.includes('sf_vehicleReq')) {
  fail('Add Night visit must have Vehicle Requirement toggle')
} else ok('Night Visit Vehicle Requirement toggle')

const handlers = fs.readFileSync(path.join(root, 'api/_lib/mis/night-visit-handlers.ts'), 'utf8')
if (!handlers.includes('copyVehicleRequirementToControl')) {
  fail('Night Visit save must copy Vehicle Requirement to Control')
} else ok('Night Visit copies to Control')

const copyHelper = path.join(root, 'api/_lib/mis/copy-vehicle-requirement-to-control.ts')
if (!fs.existsSync(copyHelper)) fail('missing copy-vehicle-requirement-to-control.ts')
else ok('Control copy helper present')

const handlers2 = fs.readFileSync(path.join(root, 'api/_lib/mis/night-visit-handlers.ts'), 'utf8')
if (!handlers2.includes("case 'nightVisitSaveSession'")) fail('Handler missing nightVisitSaveSession')
else ok('Handler has nightVisitSaveSession')

const staff = fs.readFileSync(path.join(root, 'api/mis/staff-data.ts'), 'utf8')
const admin = fs.readFileSync(path.join(root, 'api/mis/admin-data.ts'), 'utf8')
if (!staff.includes('handleNightVisitAction')) fail('HOD staff-data must wire night visit actions')
else ok('HOD night visit actions are wired')
if (!admin.includes('handleNightVisitAction')) fail('Management admin-data must wire night visit actions')
else ok('Management night visit actions are wired')

const mgmtNv = fs.readFileSync(path.join(root, 'api/_lib/mis/night-ojt-mgmt.ts'), 'utf8')
const staffNv = fs.readFileSync(path.join(root, 'api/_lib/mis/night-ojt-staff.ts'), 'utf8')
if (!mgmtNv.includes('nightVisitInnerHtml') || !staffNv.includes('nightVisitInnerHtml')) {
  fail('Night Visit must use shared UI on HOD and Management')
} else ok('Night Visit shared UI on HOD + Management')

const pubUi = path.join(root, 'api/_lib/mis/site-visit-report-public-ui.ts')
const pubApi = path.join(root, 'api/mis/site-visit-report-public.ts')
const store = path.join(root, 'api/_lib/mis/site-visit-report-store.ts')
for (const rel of [
  'api/_lib/mis/site-visit-report-public-ui.ts',
  'api/_lib/mis/site-visit-report-handlers.ts',
  'api/_lib/mis/site-visit-report-store.ts',
  'api/mis/site-visit-report-public.ts',
]) {
  if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`)
  else ok(`has ${rel}`)
}

const pubHtml = fs.readFileSync(pubUi, 'utf8')
if (
  !pubHtml.includes('Site Security Visit Report: Day / Night Check') ||
  !pubHtml.includes('Start Visit') ||
  !pubHtml.includes('m-btn-green') ||
  !pubHtml.includes('not an assessment') ||
  !pubHtml.includes('Submit to HOD')
) {
  fail('Public page must be Day/Night Check visit report (not assessment) with green Start Visit')
} else ok('Public Day/Night Check visit report page')

if (
  !pubHtml.includes('only pressed upon arrival at the site') ||
  !pubHtml.includes('geolocation at the time of initiation')
) {
  fail('Public Start Visit must require arrival at site + geolocation')
} else ok('Public Start Visit requires site arrival + GPS')

const vercel = fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')
if (!vercel.includes('/mis-site-visit-report') || !vercel.includes('site-visit-report-public')) {
  fail('vercel.json must rewrite /mis-site-visit-report')
} else ok('vercel.json rewrites public site visit report')

const staffMenu = fs.readFileSync(path.join(root, 'api/_lib/mis/staff-layout.ts'), 'utf8')
const mgmtMenu = fs.readFileSync(path.join(root, 'api/_lib/mis/layout.ts'), 'utf8')
if (
  !staffMenu.includes("Site Security Visit Report (Day / Night Check)") ||
  !mgmtMenu.includes("Site Security Visit Report (Day / Night Check)")
) {
  fail('HOD + Management menus must rename Night Visit to Site Security Visit Report')
} else ok('HOD + Management menus show Site Security Visit Report')

if (
  !ui.includes('mis-site-visit-report') ||
  !ui.includes('loadSiteVisitReports') ||
  !ui.includes('nightVisitSiteReportList')
) {
  fail('Portal must show public link + submitted visit report list')
} else ok('Portal has public link + submitted visit report list')

if (!handlers.includes('nightVisitSiteReportList') || !handlers.includes('handleSiteVisitList')) {
  fail('Handlers must list site visit reports')
} else ok('Handlers list site visit reports')

const storeSrc = fs.readFileSync(store, 'utf8')
if (!storeSrc.includes('mis:site-visit-reports') || !fs.readFileSync(path.join(root, 'api/_lib/mis/site-visit-report-handlers.ts'), 'utf8').includes('saveClientGeoFromAssessment')) {
  fail('Visit submit must store reports and can save GPS to client master')
} else ok('Visit reports store + GPS to client master')

const pubH = fs.readFileSync(path.join(root, 'api/_lib/mis/site-visit-report-handlers.ts'), 'utf8')
if (
  !pubHtml.includes('continueVisitByCode') ||
  !pubHtml.includes('Continue on a computer') ||
  !pubHtml.includes('saveVisitDraft') ||
  !pubH.includes('handleSiteVisitPublicDraftLoad') ||
  !pubH.includes('listPublicExternalClients')
) {
  fail('Public site visit must auto-save and continue on a computer for every branch')
} else ok('Public site visit auto-save + computer continue')

if (failed) {
  console.error('\ncheck:night-visit FAILED\n')
  process.exit(1)
}
console.log('\ncheck:night-visit OK')
