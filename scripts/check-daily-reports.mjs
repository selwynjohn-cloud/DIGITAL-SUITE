#!/usr/bin/env node
/**
 * Lock Command Centre daily packs + Guards 5:00 PM delayed list.
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

const vercel = read('vercel.json')
const delivery = read('api/_lib/suite-daily-delivery.ts')
const delayed = read('api/_lib/guards/delayed-daily.ts')
const cron = read('api/guards/cron.ts')
const auth = read('api/_lib/auth.ts')
const mail = read('api/_lib/suite-mail.ts')

if (!vercel.includes('/api/control/cron?job=daily-report') || !vercel.includes('30 2 * * *')) {
  fail('Control 08:00 IST cron missing')
} else ok('Control 08:00 IST cron')

if (!vercel.includes('/api/training/cron?job=ojt-morning') || !vercel.includes('0 4 * * *')) {
  fail('Training 09:30 IST cron missing')
} else ok('Training 09:30 IST cron')

if (!vercel.includes('/api/guards/cron?job=daily-complaints') || !vercel.includes('0 4 * * *')) {
  fail('Guards morning 09:30 IST cron missing')
} else ok('Guards morning 09:30 IST cron')

if (!vercel.includes('/api/guards/cron?job=delayed-daily') || !vercel.includes('30 11 * * *')) {
  fail('Guards delayed 5:00 PM IST cron missing (30 11 UTC)')
} else ok('Guards delayed 5:00 PM IST cron')

if (!vercel.includes('/api/mis/cron?job=daily-report') || !vercel.includes('0 11 * * *')) {
  fail('MIS 16:30 IST cron missing')
} else ok('MIS 16:30 IST cron')

const misDaily = read('api/_lib/mis/daily-command-report.ts')
const misDigest = read('api/_lib/mis/digest.ts')
const shortage = read('api/_lib/mis/manpower-shortage.ts')
if (!misDaily.includes('[director, gmail, ...hodTo]') && !misDaily.includes('director, gmail')) {
  fail('4:30 PM MIS mail must put Director on To so he receives the consolidated report')
} else ok('4:30 PM MIS mail includes Director on To')

const sectionNeed = [
  "'1. Dashboard'",
  "'2. Consolidated MIS report'",
  "'3. Vacancy report — branch-wise (rank)'",
  "'4. OT report — branch-wise'",
  "'5. Late start — out of post report'",
  "'6. Day visit — Night visit report'",
  "'7. Finance report'",
  "'8. Client Complaints'",
  "'9. Guards Complaints'",
  "'10. Conclusion — AI report (branch-wise)'",
]
if (!sectionNeed.every((s) => misDigest.includes(s))) {
  fail('MIS daily mail must keep numbered sections 1–10 in order')
} else ok('MIS daily mail sections 1–10')

if (!shortage.includes("label: 'SO'") || !shortage.includes("label: 'ASO'") || !shortage.includes("label: 'LSG'") || !shortage.includes("label: 'Pantry Boy'") || !shortage.includes('VACANCY_RANK_COLUMNS')) {
  fail('Vacancy table must use SO, ASO, LSG, SG, Driver, HK, HK-Supervisor, Escorts, SPO, SPA, Pantry Boy, STF')
} else if (!misDaily.includes('VACANCY_RANK_COLUMNS') || !misDaily.includes('vacancyRankHtml')) {
  fail('4:30 PM vacancy section must use the rank columns')
} else ok('Vacancy report is branch-wise rank columns')

if (!misDaily.includes('otBranchWiseHtml') || !misDigest.includes('otDetail')) {
  fail('OT report must list clients under each branch')
} else if (misDaily.includes("'6. Overtime (OT)'") || misDaily.includes("'7. Vacant Posts")) {
  fail('Do not number OT / vacant inside Dashboard — they are sections 3 and 4')
} else ok('OT is branch-wise; Dashboard is not re-numbered 6–7')

if (!misDaily.includes("complaintHtml(payload.branchRows, 'client')") || !misDaily.includes("complaintHtml(payload.branchRows, 'guard')")) {
  fail('Daily mail must include Client Complaints and Guards Complaints')
} else ok('Client Complaints and Guards Complaints are in the daily mail')

if (!misDaily.includes('agile-logo-clear.png') || !misDaily.includes('background:transparent')) {
  fail('Daily mail header logo must be the clear Agile logo with no white plate')
} else if (!misDaily.includes('For Internal Circulation Only')) {
  fail('Daily mail header must say For Internal Circulation Only')
} else ok('Daily mail header uses clear logo + For Internal Circulation Only')

if (!delivery.includes("id: 'mis'") || !/catchUntilHour:\s*22/.test(delivery)) {
  fail('MIS daily pack catch-up must run until 22:00 IST')
} else ok('MIS catch-up until 22:00 IST')

const director430 = read('api/_lib/mis/director-430-report.ts')
const misCron = read('api/mis/cron.ts')
if (!delivery.includes("id: 'mis-director'") || !director430.includes('function hodToDirectorCc')) {
  fail('4:30 PM pack (Consolidated MIS + Guards Complaints) is missing')
} else ok('4:30 PM pack is wired')
if (!director430.includes('Consolidated MIS report') || !director430.includes('Branch-wise Registered Guards Complaints')) {
  fail('4:30 PM pack must include Consolidated MIS and Registered Guards Complaints')
} else ok('4:30 PM pack has both reports')
if (!director430.includes('getAllHodEmails') || !director430.includes('All HODs · CC Director')) {
  fail('4:30 PM pack must go To all HODs with CC Director')
} else if (director430.includes('Director only') || director430.includes('function directorOnlyTo')) {
  fail('4:30 PM pack must not stay Director-only')
} else ok('4:30 PM pack is To HODs · CC Director')
if (!misCron.includes("ids: ['mis', 'mis-director']") || !misCron.includes('sendMisDirectorDailyPack')) {
  fail('MIS cron must send and catch up the 4:30 PM HOD pack')
} else ok('MIS cron sends 4:30 PM HOD pack')

if (!delivery.includes("id: 'guards-delayed-am'") || !delivery.includes("label: 'Agile Guards delayed complaints (9:30 AM)'")) {
  fail('suite-daily-delivery must include guards-delayed-am at 09:30 IST')
} else ok('Daily pack list includes 9:30 AM delayed list')

if (!delivery.includes("id: 'guards-delayed'") || !delivery.includes('hour: 17')) {
  fail('suite-daily-delivery must include guards-delayed at 17:00 IST')
} else ok('Daily pack list includes 5:00 PM delayed list')

if (!delivery.includes('sendDailyGuardsDelayedMail')) {
  fail('ensureSuiteDailyReports must send the delayed pack')
} else ok('Health catch-up can send delayed pack')

if (!delayed.includes('suiteColourEmailShell') || !delayed.includes('Nil delayed complaints')) {
  fail('Delayed mail must use regular header/footer and send nil reports')
} else ok('Delayed mail uses header/footer and nil reports')

if (!delayed.includes('Branch-wise Delayed Complaints')) {
  fail('Delayed mail heading missing')
} else ok('Delayed mail heading')
if (!delayed.includes('9:30 AM IST') || !delayed.includes('guards-delayed-am')) {
  fail('Delayed mail must send a 9:30 AM IST branch-wise list')
} else ok('Delayed mail has 9:30 AM branch-wise slot')

if (!cron.includes("ids: ['guards', 'guards-delayed-am']")) {
  fail('Guards cron must catch up morning status + 9:30 AM delayed list only')
} else ok('Guards cron catch-up is 9:30 AM delayed only')
if (!cron.includes('Evening delayed mail stopped') || !cron.includes("slot: 'am'")) {
  fail('Guards must stop 5:00 PM delayed mail and keep 9:30 AM only')
} else ok('Guards 5:00 PM delayed mail is stopped')
if (!delayed.includes('Held up at') || !delayed.includes('timeBarRow')) {
  fail('Delayed mail must show colourful time bars and where it is held up')
} else ok('Delayed mail has time bars + held-up line')
if (!delayed.includes('9:30 AM only')) {
  fail('Delayed sender must stay 9:30 AM only')
} else ok('Delayed sender is 9:30 AM only')
const guardsApp = read('api/guards/app.ts')
const guardsData = read('api/guards/data.ts')
if (!guardsApp.includes('previewDelayedMail') || !guardsApp.includes('View 9:30 AM mail draft')) {
  fail('Guards Management must have View 9:30 AM mail draft')
} else ok('Guards Management can open the 9:30 AM draft')
if (!guardsData.includes("action === 'previewDelayedMail'")) {
  fail('guards/data.ts must expose previewDelayedMail')
} else ok('previewDelayedMail API is wired')

if (!auth.includes('lokesh@agilegroup.co.in')) {
  fail('lokesh@agilegroup.co.in must be on the never-mail list')
} else ok('Lokesh is blocked from outbound mail')

if (!mail.includes('withoutNoMailRecipients(emailList(to))')) {
  fail('sendSuiteEmail must strip blocked addresses from To')
} else ok('sendSuiteEmail strips blocked To addresses')

const sjRegs = read('api/_lib/recruitment/daily-registrations-mail.ts')
const recruitCron = read('api/recruitment/cron.ts')
if (!vercel.includes('/api/recruitment/cron?job=daily-registrations') || !vercel.includes('30 11 * * *')) {
  fail('SecurityJob daily registrations 5:00 PM IST cron missing (30 11 UTC)')
} else ok('SecurityJob daily registrations 5:00 PM IST cron')
if (!delivery.includes("id: 'securityjob-regs'") || !delivery.includes("hour: 17")) {
  fail('suite-daily-delivery must include securityjob-regs at 17:00 IST')
} else ok('Daily pack list includes SecurityJob 5:00 PM registrations')
if (!delivery.includes('sendDailySecurityJobRegistrationsMail')) {
  fail('ensureSuiteDailyReports must send the SecurityJob registrations pack')
} else ok('Health catch-up can send SecurityJob registrations pack')
if (!recruitCron.includes("ids: ['securityjob-regs']") || !recruitCron.includes('sendDailySecurityJobRegistrationsMail')) {
  fail('Recruitment cron must send and catch up the 5:00 PM SecurityJob list')
} else ok('Recruitment cron sends 5:00 PM SecurityJob list')
if (!sjRegs.includes('getAllHodEmails') || !sjRegs.includes('All HODs · CC Director')) {
  fail('5:00 PM SecurityJob list must go To all HODs with CC Director')
} else ok('5:00 PM SecurityJob list is To HODs · CC Director')
if (sjRegs.includes('misSelwynGmailCopy') || sjRegs.includes('selwyn.john@gmail.com')) {
  fail('5:00 PM SecurityJob list must not go to personal Gmail')
} else ok('5:00 PM SecurityJob list excludes personal Gmail')
if (!sjRegs.includes('Nil registrations on www.securityjob.co.in') || !sjRegs.includes('suiteColourEmailShell')) {
  fail('5:00 PM SecurityJob list must use regular header/footer and send nil reports')
} else ok('5:00 PM SecurityJob list uses header/footer and nil reports')
if (!sjRegs.includes('Reg code') || !sjRegs.includes('Date of Birth') || !sjRegs.includes('Registered on')) {
  fail('5:00 PM SecurityJob list must include full registration details')
} else ok('5:00 PM SecurityJob list has full candidate details')
if (!vercel.includes('/api/recruitment/list-export?mail=1') || !vercel.includes('30 1 * * *')) {
  fail('07:00 IST SecurityJob Excel to Director must stay')
} else ok('07:00 IST SecurityJob Excel to Director stays')

if (failed) {
  console.error('\ncheck:daily-reports FAILED\n')
  process.exit(1)
}
console.log('\ncheck:daily-reports OK')
