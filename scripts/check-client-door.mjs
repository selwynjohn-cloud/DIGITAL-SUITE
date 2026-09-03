#!/usr/bin/env node
/**
 * Client Door — public /client + MIS Client Door (HOD + Management).
 *
 *   npm run check:client-door
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
function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

for (const rel of [
  'api/client/gate.ts',
  'api/client/data.ts',
  'api/_lib/client-door/page.ts',
  'api/_lib/client-door/pin.ts',
  'api/_lib/client-door/metrics.ts',
  'api/_lib/client-door/lookup.ts',
  'api/_lib/client-door/chrome.ts',
  'api/_lib/client-door/report.ts',
  'api/_lib/client-door/opens.ts',
  'api/_lib/client-door/books.ts',
  'api/_lib/mis/client-door-page.ts',
  'api/_lib/mis/client-door-ui.ts',
  'api/_lib/mis/client-door-handlers.ts',
  'api/mis/client-door.ts',
  'api/mis/staff-client-door.ts',
]) {
  if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`)
  else ok(rel)
}

const vercel = read('vercel.json')
if (!vercel.includes('"/client"') || !vercel.includes('/api/client/gate')) {
  fail('vercel.json must rewrite /client → /api/client/gate')
} else ok('/client rewrite')
if (!vercel.includes('/mis-client-door') || !vercel.includes('/mis-staff-client-door')) {
  fail('vercel.json must rewrite Client Door pages')
} else ok('MIS Client Door rewrites')

const staffMenu = read('api/_lib/mis/staff-layout.ts')
const mgmtMenu = read('api/_lib/mis/layout.ts')
if (!staffMenu.includes("['Client Door'") || !staffMenu.includes('/mis-staff-client-door')) {
  fail('HOD menu missing Client Door')
} else ok('HOD Client Door menu')
if (!mgmtMenu.includes("['Client Door'") || !mgmtMenu.includes('/mis-client-door')) {
  fail('Management menu missing Client Door')
} else ok('Management Client Door menu')

const locked = [
  'Client Complaints',
  'Incident Reporting',
  'Daily MIS Submission',
  'Site Security Assessment (SSA)',
  'Master Directory',
]
for (const [src, label] of [
  [staffMenu, 'HOD'],
  [mgmtMenu, 'Management'],
]) {
  let last = -1
  for (const name of locked) {
    const i = src.indexOf(`['${name}'`)
    if (i < 0 || i < last) {
      fail(`${label} bottom menu order broken`)
      last = i
      break
    }
    last = i
  }
}
ok('Bottom menu order still locked')

const store = read('api/_lib/mis/store.ts')
if (!store.includes('clientEmail?: string')) fail('MisClient must store clientEmail')
else ok('Master Directory clientEmail field')

const staff = read('api/mis/staff.ts')
if (!staff.includes('Client email (Client door)') || !staff.includes('addEmail')) {
  fail('HOD Master Directory must collect client email')
} else ok('HOD Master Directory client email')

const lookup = read('api/_lib/client-door/lookup.ts')
if (!lookup.includes('isNamedStrategicClient') && !lookup.includes('matchStrategicGroup')) {
  fail('Client Door must stay on strategic clients only')
} else ok('Strategic client filter')

const pin = read('api/_lib/client-door/pin.ts')
if (pin.includes('canLoginWithEmail') || pin.includes('otpLoginScript')) {
  fail('Client Door PIN must not use suite canLoginWithEmail / otpLoginScript')
} else ok('Client Door PIN is standalone')
if (!pin.includes('skipDirectorCc: true')) fail('Client PIN mail must not CC Director')
else ok('Client PIN skip Director CC')

const page = read('api/_lib/client-door/page.ts')
if (!page.includes('Send PIN') || !page.includes('Open') || !page.includes('/api/client/data')) {
  fail('Public /client must have Send PIN + Open')
} else ok('Public Send PIN + Open')
if (!page.includes('reportHtml')) fail('Opened Client Door must show the professional report')
else ok('Opened page uses professional report')

const chrome = read('api/_lib/client-door/chrome.ts')
if (!chrome.includes('Client Door -') || !chrome.includes('CLIENT_DOOR_SEE_TEXT')) {
  fail('Header must be Client Door - <client name> with yesterday instruction')
} else ok('Client Door header + instruction')
if (!chrome.includes('previous duty completed day')) {
  fail('Instruction must mention previous duty completed day')
} else ok('Yesterday instruction text')

const metrics = read('api/_lib/client-door/metrics.ts')
if (!metrics.includes('misYesterdayIst')) fail('Client Door report date must be yesterday')
else ok('Report date is yesterday')
for (const need of [
  'agileVisits',
  'lastNightCheck',
  'lastTraining',
  'guardsComplaints',
  'clientComplaints',
  'lateStart',
  'outOfPost',
  'onTime',
]) {
  if (!metrics.includes(need)) fail(`metrics missing ${need}`)
}
if (metrics.includes('collectionPct') || metrics.includes('monthlyBill') || metrics.includes('OST')) {
  fail('Client Door must not show money / collection')
} else ok('No money on Client Door')

const report = read('api/_lib/client-door/report.ts')
if (!report.includes('pie3dDonutSvg')) fail('Client Door must have pie diagrams')
else ok('Two pie diagrams')
if (!report.includes('Deployed Strength') || !report.includes('Duty Start on time')) {
  fail('Pies must cover sanctioned / deployed / OT / vacant and on-time / late / out of post')
} else ok('Pie slices locked')

const handlers = read('api/_lib/mis/client-door-handlers.ts')
if (!handlers.includes('isMgmtAllBranches')) fail('Client Door Management must support All Branches')
else ok('Client Door All Branches')
if (!handlers.includes('handleClientDoorAddEmail') || !handlers.includes('handleClientDoorEditEmail') || !handlers.includes('handleClientDoorDeleteEmail')) {
  fail('Client Door must add / edit / delete emails')
} else ok('Add / edit / delete emails')
if (!handlers.includes('saveClientDoorInvite') || !handlers.includes('writeBookEmails')) {
  fail('Preview and Send must remember the book email for Send PIN')
} else ok('Book emails written for Send PIN')
if (handlers.includes('upsertClient')) fail('Client Door must not write book emails into Master Directory')
else ok('Client Door emails stay off Master Directory')

const books = read('api/_lib/client-door/books.ts')
if (!books.includes('CLIENT_DOOR_STATEWISE_KEYS') || !books.includes("'hdfc'") || !books.includes("'canara'") || !books.includes("'idbi'")) {
  fail('HDFC / Canara / IDBI must club state-wise')
} else ok('HDFC / Canara / IDBI state-wise books')
if (!books.includes("stateLabel: 'All sites'")) {
  fail('Other Apex clients must club as one book')
} else ok('Other Apex clients clubbed as one')
if (!books.includes('stateForMisBranch')) fail('State books must reuse existing branch→state map (read only)')
else ok('State map reused, not rewritten')
if (!books.includes('clientDoorStateForBranch') || !books.includes('Hyderabad-A') || !books.includes('Kakinada')) {
  fail('Client Door must club Hyd-A/B as Telangana and AP cities as Andhra Pradesh')
} else ok('Hyd-A/B + Andhra cities clubbed for Client Door only')
if (handlers.includes('sites.some((site) => site.branchId === filterId)') || handlers.includes('return books.filter')) {
  fail('Client Door must show every HDFC / Canara / IDBI state, not only the signed-in branch')
} else ok('All state books visible from Hyderabad-A')
if (!lookup.includes('isSuiteAdminEmail')) fail('Director must be able to test Client Door Send PIN')
else ok('Director test Send PIN allowed')
if (!fs.existsSync(path.join(root, 'api/_lib/client-door/invite.ts'))) fail('missing invite.ts')
else ok('invite ledger present')

const opens = read('api/_lib/client-door/opens.ts')
if (!opens.includes('recordClientDoorOpen') || !opens.includes('sendClientDoorOpenMail')) {
  fail('Opening Client Door must record time and mail HOD + Client')
} else ok('Opened time + HOD/Client mail')

const data = read('api/client/data.ts')
if (!data.includes('recordClientDoorOpen') || !data.includes('sendClientDoorOpenMail')) {
  fail('Public boot must record open and mail HOD + Client')
} else ok('Public open records and mails')

const ui = read('api/_lib/mis/client-door-ui.ts')
if (!ui.includes('suiteMgmtBranchOptionsHtml') || !ui.includes('Preview') || !ui.includes('Add email')) {
  fail('Client Door UI must have All Branches + Preview + email add/edit/delete')
} else ok('Client Door list + emails')
if (!ui.includes('lastOpenedLabel') || !ui.includes('Strategic clients (Apex)')) {
  fail('Strategic list must show opened date/time')
} else ok('Opened date/time on Apex list')
if (!ui.includes('state-wise')) {
  fail('Client Door UI must say HDFC / Canara / IDBI are state-wise')
} else ok('UI states the clubbing rule')

const staffPage = read('api/_lib/mis/client-door-page.ts')
if (!staffPage.includes("otpLoginScript('mis-report'")) {
  fail('HOD Client Door must keep existing MIS PIN (otpLoginScript mis-report)')
} else ok('HOD login unchanged (mis-report PIN)')

const authSend = read('api/auth/send-pin.ts')
if (authSend.includes('client-door') || authSend.includes('/client')) {
  fail('Do not wire Client Door through /api/auth/send-pin')
} else ok('Suite Send PIN untouched')

const staffData = read('api/mis/staff-data.ts')
const adminData = read('api/mis/admin-data.ts')
if (!staffData.includes("action === 'clientDoorSend'") || !staffData.includes('clientDoorAddEmail')) {
  fail('staff-data missing Client Door email actions')
} else ok('HOD Client Door APIs')
if (!adminData.includes("action === 'clientDoorSend'") || !adminData.includes('clientDoorAddEmail')) {
  fail('admin-data missing Client Door email actions')
} else ok('Management Client Door APIs')

if (failed) {
  console.error('\ncheck:client-door FAILED\n')
  process.exit(1)
}
console.log('\ncheck:client-door OK')
