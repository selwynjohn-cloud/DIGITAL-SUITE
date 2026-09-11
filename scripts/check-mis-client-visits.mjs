#!/usr/bin/env node
/**
 * Lock: MIS Client Visits — Visit schedule (completed), Complete visit (Mobile app),
 * Scheduled List, Visit report (Save/Preview/Send), Review (Open/Review/Save/Send).
 *
 *   npm run check:client-visits
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

const staffMenu = fs.readFileSync(path.join(root, 'api/_lib/mis/staff-layout.ts'), 'utf8')
const mgmtMenu = fs.readFileSync(path.join(root, 'api/_lib/mis/layout.ts'), 'utf8')
if (!staffMenu.includes("['Client Visits', '📍', '/mis-staff-visits']")) {
  fail('HOD menu missing Client Visits')
} else ok('HOD menu has Client Visits')
if (!mgmtMenu.includes("['Client Visits', '📍', '/mis-visits']")) {
  fail('Management menu missing Client Visits')
} else ok('Management menu has Client Visits')

const needed = [
  'api/_lib/mis/client-visit-store.ts',
  'api/_lib/mis/client-visit-handlers.ts',
  'api/_lib/mis/client-visit-ui.ts',
  'api/_lib/mis/client-visit-page.ts',
  'api/mis/staff-visits.ts',
  'api/mis/visits.ts',
]
for (const rel of needed) {
  if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`)
  else ok(`has ${rel}`)
}

const ui = fs.readFileSync(path.join(root, 'api/_lib/mis/client-visit-ui.ts'), 'utf8')
if (!ui.includes('>All Branches</option>')) fail('Client Visits Management must offer All Branches')
else ok('Client Visits has All Branches')

for (const tab of [
  'Visit schedule',
  'Add visit',
  'Scheduled List',
  'Visit report',
  'Review',
  'Complete visit (Mobile app)',
]) {
  if (!ui.includes(tab)) fail(`UI missing: ${tab}`)
  else ok(`UI has ${tab}`)
}

if (ui.includes('>Visit list<') || ui.includes('📋 Visit list')) {
  fail('Visit list must be renamed Scheduled List')
} else ok('Scheduled List replaces Visit list')

if (ui.includes("showTab('sent')") || ui.includes('id="tabSent"') || ui.includes('id="paneSent"')) {
  fail('Sent to client must not be a top tab — use Review')
} else ok('No Sent to client top tab')

if (!ui.includes('saveReviewRow') || !ui.includes('>Save</button>') || !ui.includes('Send to client')) {
  fail('Review must keep Open / Review / Save / Send to client')
} else ok('Review has Open / Review / Save / Send to client')

// Visit report must not use gold Review next to Preview
const reportBlock = ui.slice(ui.indexOf('id="paneReport"'), ui.indexOf('id="paneReview"'))
if (reportBlock.includes("onclick=\"reviewVisit()\"") && reportBlock.includes('m-btn-gold')) {
  fail('Visit report must not show yellow Review next to Preview')
} else ok('Visit report has Save / Preview / Send (no yellow Review)')

if (!ui.includes('renderMgmtReport') || !ui.includes('Branch-wise summary')) {
  fail('Management Visit report must be consolidated')
} else ok('Management Visit report is consolidated')

if (!ui.includes('isVisitCompleted') || !ui.includes('isVisitScheduledOnly')) {
  fail('Schedule vs Scheduled List filters missing')
} else ok('Completed vs scheduled filters present')

if (ui.includes('cv-cal') || ui.includes('calGrid') || ui.includes('function renderCal')) {
  fail('Visit schedule must not be a calendar')
} else ok('Visit schedule is not a calendar')
if (!ui.includes('scheduleTable') || !ui.includes('function renderSchedule')) {
  fail('Visit schedule must be a list/table')
} else ok('Visit schedule is a list/table')

if (!ui.includes('Vehicle Requirement') || !ui.includes('cv_vehicleReq')) {
  fail('Add visit must have Vehicle Requirement toggle')
} else ok('Client Visit Vehicle Requirement toggle')
if (!ui.includes('portal: \'mgmt\'') && !ui.includes("portal: 'mgmt'") && !ui.includes('portal === \'mgmt\'')) {
  // shared UI used by both — ensure mgmt page opts exist
}
if (!fs.readFileSync(path.join(root, 'api/_lib/mis/client-visit-page.ts'), 'utf8').includes("portal: 'mgmt'")) {
  fail('Management Client Visits page must use shared UI')
} else ok('Management Client Visits uses shared UI')
if (!fs.readFileSync(path.join(root, 'api/mis/staff.ts'), 'utf8').includes('clientVisitInnerHtml')) {
  fail('HOD Client Visits must use shared UI')
} else ok('HOD Client Visits uses shared UI')

const cvHandlers = fs.readFileSync(path.join(root, 'api/_lib/mis/client-visit-handlers.ts'), 'utf8')
if (!cvHandlers.includes('copyVehicleRequirementToControl')) {
  fail('Client Visit save must copy Vehicle Requirement to Control')
} else ok('Client Visit copies to Control')

const staffData = fs.readFileSync(path.join(root, 'api/mis/staff-data.ts'), 'utf8')
if (!staffData.includes('handleClientVisitSave') || !staffData.includes('handleClientVisitReview')) {
  fail('HOD must save visits and Review')
} else ok('HOD save + review are wired')
if (!staffData.includes('handleClientVisitSend')) fail('HOD must Send to client')
else ok('HOD send to client is wired')
if (!staffData.includes('handleClientVisitFetchMobile')) fail('HOD must fetch Mobile / Work360 visits')
else ok('HOD fetches Mobile visits into the schedule')
if (!staffData.includes('handleClientVisitSave(body as Record<string, unknown>, userName, bid)')) {
  fail('HOD save must lock visits to the signed-in branch')
} else ok('HOD visit save is branch-locked')

const admin = fs.readFileSync(path.join(root, 'api/mis/admin-data.ts'), 'utf8')
if (
  !admin.includes('handleClientVisitReview') ||
  !admin.includes('handleClientVisitRemind') ||
  !admin.includes('handleClientVisitReopen') ||
  !admin.includes('handleClientVisitSend')
) {
  fail('Management must Review, Reminder, Reopen, Send to client')
} else ok('Management review / reminder / reopen / send are wired')

const vercel = fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')
if (!vercel.includes('"/api/mis/staff-visits"')) {
  fail('vercel.json must point /mis-staff-visits at staff-visits')
} else ok('HOD Client Visits URL is dedicated page')

const handlers = fs.readFileSync(path.join(root, 'api/_lib/mis/client-visit-handlers.ts'), 'utf8')
if (!handlers.includes('purgeAllClientVisitsOnce')) {
  fail('Must purge mixed schedules once')
} else ok('One-time schedule purge present')
if (handlers.includes('visitMatchesBranch(')) {
  fail('Client Visits must not use fuzzy visitMatchesBranch (cross-branch mix)')
} else ok('No fuzzy cross-branch visit matching')
if (!handlers.includes('names.has(cl)')) {
  fail('Mobile merge must use exact Master Directory client names')
} else ok('Exact client-name match for Mobile merge')
if (!handlers.includes('body.autoSync === true')) {
  fail('Boot must not auto-sync Mobile unless asked')
} else ok('No auto Mobile sync on every open')

if (failed) {
  console.error('\ncheck:client-visits FAILED\n')
  process.exit(1)
}
console.log('\ncheck:client-visits OK')
