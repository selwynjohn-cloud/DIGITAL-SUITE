#!/usr/bin/env node
/**
 * Lock: Agile Recruitment must keep Daily Recruitment Report (DRR) on Staff + Management,
 * and never send the email-PIN gate to the old Google Apps Script.
 *
 *   npm run check:recruitment-drr
 *   npm run check:recruitment-drr -- --probe
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const probe = process.argv.includes('--probe')
let failed = false

function fail(msg) {
  console.error('FAIL:', msg)
  failed = true
}

function ok(msg) {
  console.log('OK:', msg)
}

const appPath = path.join(root, 'api/recruitment/app.ts')
const gatePath = path.join(root, 'api/recruitment/gate.ts')
const cfgPath = path.join(root, 'api/_lib/suite-gate-config.ts')

const app = fs.readFileSync(appPath, 'utf8')
const gate = fs.readFileSync(gatePath, 'utf8')
const cfg = fs.readFileSync(cfgPath, 'utf8')

for (const needle of [
  "Daily Recruitment Report (DRR)',fn:'drrForm'",
  'function drrForm()',
  'function saveDrr()',
  'DRR History',
]) {
  if (!app.includes(needle)) fail(`app.ts missing ${needle}`)
  else ok(`app.ts has ${needle}`)
}

const detailPagePath = path.join(root, 'api/_lib/recruitment/drr-detail-pages.ts')
const detailStorePath = path.join(root, 'api/_lib/recruitment/drr-detail-store.ts')
if (!fs.existsSync(detailPagePath) || !fs.existsSync(detailStorePath)) {
  fail('Recruitment detailed DRR page/store is missing')
} else {
  const detailPage = fs.readFileSync(detailPagePath, 'utf8')
  const detailStore = fs.readFileSync(detailStorePath, 'utf8')
  for (const needle of ['New recruits', 'Transfers', 'Resignations', 'Referred by', 'Vacant position', 'Received Ladies Undertaking', 'nr_gender', 'nr_desig', 'Client Name', 'Male / Female', ">All</option>", ">Agile</option>", ">Sparks</option>"]) {
    if (!detailPage.includes(needle)) fail(`detailed DRR page missing ${needle}`)
    else ok(`detailed DRR has ${needle}`)
  }
  if (!detailPage.includes("DRR_DETAIL_COMPANY='agile'")) {
    fail('DRR must open on Agile so branches see Add + Save')
  } else ok('DRR opens on Agile so branches can submit')
  if (detailPage.includes('Load report') || detailPage.includes('onclick="referralListPage()"')) {
    fail('DRR submission must not show Load report or Cumulative Referral')
  } else ok('DRR submission has no Load report / Cumulative Referral shortcut')
  if (detailPage.includes('var viewAll=') || detailPage.includes("Company is <b>All</b>")) {
    fail('DRR sections 1–3 must stay visible for submission')
  } else ok('DRR New recruits / Transfers / Resignations stay visible')
  if (detailPage.includes('Walk-ins') || detailPage.includes('Screened') || detailPage.includes('Agile / ASFPL')) {
    fail('detailed DRR must not bring back the old Walk-ins form or old company labels')
  } else ok('detailed DRR stays on the new form')
  if (!detailStore.includes("const KEY = 'recruit:drr-detail'")) {
    fail('detailed DRR must use recruit:drr-detail storage')
  } else {
    ok('detailed DRR storage present')
  }
  if (detailPage.includes('drr-lady-sw') || detailPage.includes('drr-lady-knob') || detailPage.includes('drr-lady-box')) {
    fail('DRR must keep Received Ladies Undertaking as a simple Yes/No — no gold banner')
  } else ok('DRR Ladies Undertaking is a simple Yes/No')
  if (!detailStore.includes('ladyGuardUndertaking') || !detailStore.includes('function ladyRecruitMissingUndertaking')) {
    fail('detailed DRR must store lady undertaking and block female recruits without it')
  } else ok('detailed DRR lady undertaking is stored and required')
  if (!detailStore.includes('nilRecruitment') || !detailStore.includes('function drrDetailIsSubmitted')) {
    fail('detailed DRR must store nilRecruitment and drrDetailIsSubmitted')
  } else ok('detailed DRR stores nil recruitment')
  if (!detailPage.includes('Submit nil recruitment') || !detailPage.includes('function saveNilDrr')) {
    fail('DRR form must have Submit nil recruitment')
  } else ok('DRR form has Submit nil recruitment')
  if (!detailPage.includes('drrDetailIsNil') || !detailPage.includes('Save as Nil recruitment')) {
    fail('DRR nil save must confirm and mark Nil')
  } else ok('DRR nil save confirms before write')
}

if (!app.includes('function drrForm(){drrDetailForm();}')) {
  fail('drrForm must open the Recruitment-specific detailed DRR')
} else if (!app.includes('function drrLogs(){drrDetailHistory();}')) {
  fail('DRR History must open detailed Recruitment reports')
} else if (app.includes("PUBLIC_FORM='https://agile-recruitment.codewords.run")) {
  fail('public apply must not use the old codewords form')
} else if (!app.includes("function saveDrr(){drrDetailForm();}")) {
  fail('old Walk-ins/Screened/Selected save must open the detailed DRR')
} else if (app.includes('<th>Walk-ins</th>')) {
  fail('DRR Daily Summary must not show the old Walk-ins / Screened form')
} else {
  ok('DRR menu and history use detailed Recruitment format')
}

const recruitData = fs.readFileSync(path.join(root, 'api/recruitment/data.ts'), 'utf8')
if (app.includes('.drr-lady-sw') || app.includes('.drr-lady-box')) {
  fail('Recruitment page must not keep the gold lady-undertaking banner')
} else ok('Recruitment page has no gold lady-undertaking banner')
if (!recruitData.includes('ladyRecruitMissingUndertaking')) {
  fail('saveDrrDetail must refuse female recruits without the undertaking')
} else ok('saveDrrDetail refuses female recruits without the undertaking')

if (!app.includes("n:'Dashboard',fn:'mgmtDash'")) {
  fail('Management menu must label Dashboard (not Executive Dashboard)')
} else if (app.includes("n:'Executive Dashboard'")) {
  fail('Management menu must not keep Executive Dashboard label')
} else {
  ok('Management Dashboard menu label')
}

if (!app.includes('function shortageTotal()') || !app.includes('Shortages = Vacant + OT')) {
  fail('Shortage must use Shortages = Vacant + OT from Daily MIS')
} else {
  ok('Shortage formula Shortages = Vacant + OT')
}

if (!app.includes('Hyderabad - A') || !app.includes('Hi-Tech City') || !app.includes('Hyderabad - B')) {
  fail('Dashboard centres must include Hyderabad - A, Hyderabad - B, Hi-Tech City')
} else if (app.includes("'Gulbarga'") && /var BRANCHES=\[[^\]]*Gulbarga/.test(app)) {
  fail('Gulbarga must not be a separate recruitment centre (under Bangalore)')
} else {
  ok('Hyd-A / Hyd-B / Hi-Tech listed; Gulbarga not a centre')
}

const recruitStore = fs.readFileSync(path.join(root, 'api/_lib/recruitment/store.ts'), 'utf8')
const deptAuth = fs.readFileSync(path.join(root, 'api/_lib/recruitment/department-auth.ts'), 'utf8')
const misStore = fs.readFileSync(path.join(root, 'api/_lib/mis/store.ts'), 'utf8')
if (!recruitStore.includes("'Lucknow'") || !app.includes("'Lucknow'")) {
  fail('Lucknow must be a Recruitment centre (recruit boys from Lucknow)')
} else {
  ok('Lucknow is a Recruitment centre')
}
if (
  !deptAuth.includes('RECRUIT_ONLY_CENTRE_PREFIX') ||
  !deptAuth.includes('lucknow') ||
  !deptAuth.includes("recruitBranch: 'Lucknow'")
) {
  fail('Lucknow must appear on Recruitment HOD login without being a Daily MIS branch')
} else {
  ok('Lucknow Recruitment login is recruit-only')
}
if (!misStore.includes('^lucknow$') && !misStore.includes('id === \'br-lucknow\'')) {
  fail('Lucknow must stay off Daily MIS reporting')
} else {
  ok('Lucknow is not a Daily MIS reporting branch')
}

if (!app.includes('shareDashboardEmail') || !app.includes('refreshCurrentPage')) {
  fail('Management Dashboard share + every-page refresh required')
} else {
  ok('Share Dashboard + Refresh toolbar')
}

if (!app.includes('Branch DRR Submission') || !app.includes('improveBar')) {
  fail('Management Dashboard must show Branch DRR Submission table with improvement bar')
} else {
  ok('Branch DRR Submission table with improvement analysis')
}

if (!app.includes('Opening (MIS 14 Aug)') || !app.includes('sendBranchShortageReminder') || !app.includes('Reminder Mail')) {
  fail('Dashboard must use MIS 14 Aug opening and Reminder Mail per branch row')
} else {
  ok('MIS 14 Aug opening + Reminder Mail button')
}

if (!app.includes('No improvement') || !app.includes("color=noImprove?'#dc2626':'#16a34a'")) {
  fail('Improvement bar must be red when no improvement, green otherwise')
} else {
  ok('Improvement bar red/green rules')
}

const portalPages = fs.readFileSync(path.join(root, 'api/_lib/recruitment/portal-pages.ts'), 'utf8')
if (!app.includes("n:'Recruitment format',fn:'recruitmentFormats'") || !portalPages.includes('function recruitmentFormats')) {
  fail('Recruitment format required on Management / Staff menus')
} else {
  ok('Recruitment format on menus')
}

if (!app.includes("n:'Referral Incentives',fn:'referralIncentives'") || !portalPages.includes('function referralIncentives')) {
  fail('Referral Incentives required next to Rejoin List')
} else {
  ok('Referral Incentives on menus')
}

const staffMenuBlock = app.match(/var STAFF_MENU=\[([\s\S]*?)\];/)?.[1] || ''
const branchMenuBlock = app.match(/var BRANCH_STAFF_MENU=\[([\s\S]*?)\];/)?.[1] || ''
const mgmtMenuBlock = app.match(/var MGMT_MENU=\[([\s\S]*?)\];/)?.[1] || ''
if (!staffMenuBlock.includes('Daily Recruitment Report (DRR) submission')) {
  fail('HOD/Staff DRR must be named Daily Recruitment Report (DRR) submission')
} else {
  ok('HOD DRR submission label')
}
if (staffMenuBlock.includes('DRR History') || branchMenuBlock.includes('DRR History')) {
  fail('HOD/Staff menus must not include DRR History')
} else {
  ok('HOD menus have no DRR History')
}
if (!mgmtMenuBlock.includes('DRR History')) {
  fail('Management must keep DRR History')
} else {
  ok('Management keeps DRR History')
}
if (!staffMenuBlock.includes("fn:'sourceWalkIn'") || staffMenuBlock.indexOf("fn:'sourceWalkIn'") > staffMenuBlock.indexOf("fn:'sourceReferral'")) {
  fail('Referral menu must sit below Walk-in')
} else {
  ok('Referral below Walk-in')
}
if (!app.includes('function staffDash(){mgmtDash();}')) {
  fail('HOD/Staff Dashboard must use the same Management Dashboard')
} else {
  ok('HOD Dashboard = Management Dashboard')
}

const baselinePath = path.join(root, 'api/_lib/recruitment/shortage-baseline.ts')
const drrMailPath = path.join(root, 'api/_lib/recruitment/drr-mail.ts')
if (!fs.existsSync(baselinePath)) {
  fail('shortage-baseline.ts required (Consolidated MIS 14 Aug opening)')
} else {
  const baseline = fs.readFileSync(baselinePath, 'utf8')
  if (!baseline.includes("SHORTAGE_BASELINE_DATE = '2026-08-14'")) {
    fail('Shortage baseline date must be 2026-08-14')
  } else {
    ok('Shortage baseline locked to Consolidated MIS 2026-08-14')
  }
}
if (!fs.existsSync(drrMailPath) || !fs.readFileSync(drrMailPath, 'utf8').includes('sendShortageReminderForBranch')) {
  fail('sendShortageReminderForBranch required for HOD shortage mail')
} else {
  ok('HOD shortage reminder sender present')
}
const drrMailSrc = fs.existsSync(drrMailPath) ? fs.readFileSync(drrMailPath, 'utf8') : ''
if (/yestReports|misYesterdayIst/.test(drrMailSrc)) {
  fail('loadBranchManpower must not fall back to yesterday vacant')
} else {
  ok('DRR vacant uses today’s Daily MIS only')
}
if (!app.includes("'✓ Nil'") && !app.includes('✓ Nil')) {
  fail('Dashboard must show ✓ Nil for nil recruitment')
} else {
  ok('Dashboard shows ✓ Nil')
}
if (!recruitData.includes('pkg.nilRecruitment = !hasRows') && !recruitData.includes('pkg.nilRecruitment=!hasRows')) {
  fail('saveDrrDetail must mark empty packages as nil recruitment')
} else {
  ok('saveDrrDetail marks empty DRR as nil')
}
if (!recruitData.includes('loadBranchManpower(b.branch, ymd)')) {
  fail('Branch-wise Vacant Rank-wise must use today’s live Daily MIS vacant')
} else {
  ok('Branch-wise Vacant Rank-wise uses today’s live vacant')
}

if (!app.includes("n:'Cumulative Referral Details',fn:'referralListPage'")) {
  fail('Staff + Management menus must include Cumulative Referral Details')
} else {
  ok('Cumulative Referral Details is on the Recruitment menu')
}

if (!app.includes('Branch-wise Vacant (Rank-wise)') || !app.includes('fn:\'branchVacantRankWise\'')) {
  fail('Branch-wise Vacant (Rank-wise) required on menus')
} else {
  ok('Branch-wise Vacant (Rank-wise) on menus')
}

if (!app.includes('fn:\'recruitedList\'') || !app.includes('fn:\'rejoinList\'')) {
  fail('Recruited List and Rejoin List required')
} else {
  ok('Recruited List + Rejoin List on menus')
}

if (!app.includes('TOTAL') || !app.includes('Banner = these totals')) {
  fail('Branch DRR Submission must show TOTAL row matching banner')
} else {
  ok('Branch DRR TOTAL row present')
}

if (!app.includes('— Sourcing Funnel —') || !app.includes('— Recruitment —') || !app.includes('— Recruitment Admin —')) {
  fail('Menus must use Sourcing Funnel / Recruitment / Recruitment Admin headings')
} else {
  ok('Menu section headings present')
}

if (!app.includes('Could not open page')) {
  fail('tab() must show an error card when a menu page fails')
} else {
  ok('Menu tab() has safe error handling')
}

const menuFns = [...app.matchAll(/fn:'([A-Za-z0-9_]+)'/g)].map((m) => m[1])
const openMasterOk = app.includes('OPEN_MASTER_DIRECTORY_JS')
const injected = [
  fs.readFileSync(path.join(root, 'api/_lib/recruitment/registered-candidates-pages.ts'), 'utf8'),
  fs.readFileSync(path.join(root, 'api/_lib/recruitment/security-news-registered-pages.ts'), 'utf8'),
  fs.readFileSync(path.join(root, 'api/_lib/recruitment/walk-in-pages.ts'), 'utf8'),
  fs.readFileSync(path.join(root, 'api/_lib/recruitment/referral-list-pages.ts'), 'utf8'),
  fs.readFileSync(path.join(root, 'api/_lib/recruitment/drr-detail-pages.ts'), 'utf8'),
  fs.readFileSync(path.join(root, 'api/_lib/recruitment/portal-pages.ts'), 'utf8'),
  app,
].join('\n')
const missingFns = [...new Set(menuFns)].filter((fn) => {
  if (fn === 'openMasterDirectory') return !openMasterOk
  if (!fn) return false
  return !injected.includes(`function ${fn}(`) && !injected.includes(`function ${fn}()`)
})
if (missingFns.length) {
  fail('Menu functions missing in app.ts: ' + missingFns.join(', '))
} else {
  ok('All Recruitment menu fn names resolve in app.ts')
}

const sjPages = fs.readFileSync(path.join(root, 'api/_lib/recruitment/registered-candidates-pages.ts'), 'utf8')
const sjBrand = fs.readFileSync(path.join(root, 'api/_lib/recruitment/brand.ts'), 'utf8')
const sjMsg = fs.readFileSync(path.join(root, 'api/_lib/recruitment/message-formats.ts'), 'utf8')
if (
  !sjPages.includes('sj-freeze-wrap') ||
  !sjPages.includes('sj-sl') ||
  !sjPages.includes('sj-name') ||
  !sjPages.includes('sj-mob') ||
  !sjPages.includes('sjShowMobile') ||
  !sjPages.includes('>Sl.<') ||
  !sjPages.includes('sj-act') ||
  !sjBrand.includes('.sj-mob') ||
  !sjBrand.includes('position:sticky')
) {
  fail('Security Job Registered List must show Sl. + Name + visible Mobile')
} else {
  ok('Security Job Registered List shows Sl. + Name + visible Mobile')
}
if (
  !sjPages.includes('How to follow up') ||
  !sjPages.includes('What to say on Call 1') ||
  !sjPages.includes('function sjNextStep') ||
  !sjPages.includes('type="date"') ||
  !sjPages.includes('Call 1') ||
  !sjPages.includes('Tentative date') ||
  !sjPages.includes('Call 2') ||
  !sjPages.includes('WhatsApp invitation') ||
  !sjPages.includes('sjWhatsAppInvite') ||
  !sjPages.includes('>Reminder</button>') ||
  !sjPages.includes('sjShowTab') ||
  !sjPages.includes('sj_invite_to') ||
  !sjPages.includes('optgroup') ||
  !sjPages.includes('Select HOD or Recruitment department') ||
  !sjPages.includes('9500915599') ||
  !sjPages.includes('Call 3') ||
  !sjPages.includes('Joined date') ||
  !sjPages.includes('Hold on') ||
  !sjPages.includes('App team') ||
  !sjPages.includes('Recruitment')
) {
  fail('Security Job Registered List must show Call 1–3, tentative date, WhatsApp invitation, Joined and Hold on')
} else {
  ok('Security Job Registered List has Call 1–2 (App) + Call 3 / Joined / Hold on (Recruitment)')
}
const sjDates = fs.existsSync(path.join(root, 'api/_lib/recruitment/sj-followup-dates.ts'))
  ? fs.readFileSync(path.join(root, 'api/_lib/recruitment/sj-followup-dates.ts'), 'utf8')
  : ''
const sjData = fs.readFileSync(path.join(root, 'api/recruitment/data.ts'), 'utf8')
if (
  !sjPages.includes('SJ_DATE_Q') ||
  !sjPages.includes('saveSjDate') ||
  !sjPages.includes('Save date') ||
  !sjPages.includes('Saved Call 1') ||
  !sjPages.includes('sjMergeBook') ||
  !sjPages.includes('sj_dates_v1') ||
  !sjPages.includes('Call 1 remembered') ||
  !sjPages.includes('cannot be deleted') ||
  !sjPages.includes('data-sj-id') ||
  !sjPages.includes('data-sj-phone') ||
  !sjPages.includes('sjSaveFromBtn') ||
  !sjPages.includes('sjSaveFromEl') ||
  !sjPages.includes('sjSavedPopup') ||
  !sjPages.includes('sj-date-save') ||
  sjPages.includes("sjSaveDate('+sjJsId") ||
  !sjDates.includes('recruit:sj-followup-dates') ||
  !sjDates.includes('rememberSjFollowupDates') ||
  !sjDates.includes('hydrateSjDatesFromPersonKeys') ||
  !sjDates.includes('sjPersonStoreKey') ||
  !sjDates.includes('recruit:sj-date-people') ||
  !sjData.includes("action === 'saveSjDate'") ||
  !sjData.includes('dateBook') ||
  !sjData.includes('rememberSjFollowupDates') ||
  /call1At = value \|\| undefined/.test(sjData)
) {
  fail('Security Job Registered List dates must save with saveSjDate')
} else {
  ok('Security Job Registered List dates save with saveSjDate by mobile')
}
if (
  !sjPages.includes('last come first') ||
  !sjPages.includes('dd/mm/yyyy') ||
  !sjPages.includes("p[2]+'/'+p[1]+'/'+p[0]") ||
  sjPages.includes('overdue uncalled first') ||
  sjPages.includes('YYYY-MM-DD')
) {
  fail('Security Job Registered List must be last-come-first with dd/mm/yyyy dates')
} else {
  ok('Security Job Registered List is last-come-first with dd/mm/yyyy dates')
}
const sjDept = fs.readFileSync(path.join(root, 'api/_lib/recruitment/departments.ts'), 'utf8')
if (
  !sjDept.includes('function isHyderabadSjShareScope') ||
  !sjDept.includes('Hi-Tech City, Hyderabad-A, Hyderabad-B, and Recruitment Department') ||
  !sjPages.includes('Hi-Tech City, Hyderabad-A, Hyderabad-B and Recruitment Department') ||
  sjPages.includes('not zone HODs')
) {
  fail('Hyderabad Security Job list must show on Hi-Tech City, Hyd-A, Hyd-B and Recruitment Department')
} else {
  ok('Hyderabad Security Job list is shared on Hyd-A / Hyd-B / Hi-Tech / Recruitment Department')
}
const sjPos = app.indexOf("n:'Security Job — Registered List',fn:'sjRegisteredList'")
const snPos = app.indexOf("n:'Security News - Registered List',fn:'snRegisteredList'")
const snPage = fs.readFileSync(path.join(root, 'api/_lib/recruitment/security-news-registered-pages.ts'), 'utf8')
if (sjPos < 0 || snPos < 0 || snPos < sjPos) {
  fail('Security News - Registered List must sit immediately below Security Job — Registered List')
} else if (
  !snPage.includes('function snRegisteredList') ||
  !snPage.includes('last come first') ||
  !snPage.includes('dd/mm/yyyy') ||
  !snPage.includes('>Sl.<') ||
  !snPage.includes('snShowMobile') ||
  !snPage.includes('sj-mob')
) {
  fail('Security News - Registered List must show Sl. + Name + visible Mobile')
} else if ((app.match(/n:'Security News - Registered List',fn:'snRegisteredList'/g) || []).length < 3) {
  fail('Security News - Registered List must be on Staff, Branch Staff, and Management menus')
} else {
  ok('Security News - Registered List is below Security Job on all portals')
}
const saveSj = fs.readFileSync(path.join(root, 'scripts/save-securityjob-lists.mjs'), 'utf8')
const exportApi = fs.existsSync(path.join(root, 'api/recruitment/list-export.ts'))
  ? fs.readFileSync(path.join(root, 'api/recruitment/list-export.ts'), 'utf8')
  : ''
if (
  !saveSj.includes("Documents") ||
  !saveSj.includes('SecurityJob List') ||
  !saveSj.includes('Security Job - Registered List.xlsx') ||
  !saveSj.includes('Security News - Registered List.xlsx') ||
  !saveSj.includes('list-export') ||
  !exportApi.includes('SECURITY_JOB_XLSX') ||
  !exportApi.includes('SECURITY_NEWS_XLSX') ||
  !exportApi.includes('wantMail')
) {
  fail('Daily Excel save must write both lists into Documents/SecurityJob List')
} else {
  ok('Daily Excel save writes both lists into Documents/SecurityJob List')
}
const vercelJson = fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')
if (!vercelJson.includes('/api/recruitment/list-export?mail=1') || !vercelJson.includes('"30 1 * * *"')) {
  fail('Daily Excel mail cron must run at 07:00 IST (30 1 UTC)')
} else {
  ok('Daily Excel mail cron is at 07:00 IST')
}
const plist = fs.readFileSync(path.join(root, 'scripts/co.in.agilegroup.securityjob-list.plist'), 'utf8')
if (!plist.includes('save-securityjob-lists.mjs') || !plist.includes('<integer>7</integer>')) {
  fail('Daily Excel launchd must run save-securityjob-lists.mjs at 07:00')
} else {
  ok('Daily Excel launchd runs at 07:00')
}
if (
  !sjPages.includes('CALL TODAY') ||
  !exportApi.includes('sendHoldCallReminders') ||
  !fs.existsSync(path.join(root, 'api/_lib/recruitment/sj-hold-remind.ts'))
) {
  fail('Hold date must remind the team to call again that day')
} else {
  ok('Hold date reminds the team to call again that day')
}
if (!sjPages.includes('sjDownloadExcel()') || !snPage.includes('snDownloadExcel()')) {
  fail('Both registered lists must have Save Excel')
} else {
  ok('Both registered lists have Save Excel')
}
if (
  !sjMsg.includes('function buildSecurityJobWhatsApp') ||
  !sjMsg.includes('Aadhaar, 2 photos')
) {
  fail('Security Job WhatsApp must invite + remind with centre map and documents')
} else {
  ok('Security Job WhatsApp invite + remind messages present')
}
const joinOrderPath = path.join(root, 'api/_lib/recruitment/sj-join-order.ts')
const joinOrder = fs.existsSync(joinOrderPath) ? fs.readFileSync(joinOrderPath, 'utf8') : ''
const pulseWa = fs.readFileSync(path.join(root, 'api/_lib/pulse/whatsapp.ts'), 'utf8')
const pulseHook = fs.readFileSync(path.join(root, 'api/pulse/whatsapp-webhook.ts'), 'utf8')
if (
  !joinOrder.includes('sendSjProvisionalJoinOrder') ||
  !joinOrder.includes('Yes I will come') ||
  !joinOrder.includes('Never Fast2SMS') ||
  joinOrder.includes('fast2sms.com') ||
  joinOrder.includes("from '../fast2sms") ||
  joinOrder.includes("from '../../fast2sms") ||
  !sjData.includes('sendSjProvisionalJoinOrder') ||
  !sjData.includes("field === 'tentativeJoinDate'") ||
  !sjData.includes("action === 'sendSjJoinOrder'") ||
  !sjPages.includes('Send joining letter') ||
  !sjPages.includes('Yes I will come') ||
  !pulseWa.includes('function waSendButtons') ||
  !pulseHook.includes('handleSjJoinOrderReply') ||
  !pulseHook.includes("text !== 'OK' && text !== 'SEND'")
) {
  fail('Tentative date must send Whapi joining letter to the candidate (not Fast2SMS), with Yes / New date / Not now')
} else {
  ok('Joining letter is Whapi-only after Tentative date (no Fast2SMS)')
}
const eveWelcomePath = path.join(root, 'api/_lib/recruitment/sj-eve-welcome.ts')
const eveWelcome = fs.existsSync(eveWelcomePath) ? fs.readFileSync(eveWelcomePath, 'utf8') : ''
const recruitCron = fs.readFileSync(path.join(root, 'api/recruitment/cron.ts'), 'utf8')
if (
  !eveWelcome.includes('sendSjEveWelcomeMessages') ||
  !eveWelcome.includes('Never Fast2SMS') ||
  !eveWelcome.includes('Educational qualification') ||
  !eveWelcome.includes('Police verification') ||
  !eveWelcome.includes('Medical Fitness') ||
  !eveWelcome.includes('PSARA Training Certificate') ||
  !eveWelcome.includes('Bank Account details') ||
  !eveWelcome.includes('By Recruitment Team') ||
  !eveWelcome.includes('waSendText') ||
  eveWelcome.includes('fast2sms.com') ||
  eveWelcome.includes("from '../fast2sms") ||
  !recruitCron.includes("job === 'welcome-daily'") ||
  !recruitCron.includes('sendSjEveWelcomeMessages') ||
  !vercelJson.includes('/api/recruitment/cron?job=welcome-daily') ||
  !sjPages.includes('>Recruited</button>') ||
  !sjPages.includes('>Reopen</button>') ||
  !sjPages.includes('function sjMarkRecruited') ||
  !sjPages.includes('Welcome WhatsApp') ||
  !sjData.includes("act === 'mark_recruited'") ||
  !sjData.includes("act === 'reopen_recruit'") ||
  !sjData.includes('recruitClosed')
) {
  fail('Day-before welcome WhatsApp (Whapi) and Recruited / Reopen must stay on Security Job list')
} else {
  ok('Day-before welcome WhatsApp + Recruited / Reopen on Security Job list (no Fast2SMS)')
}
const askDatePath = path.join(root, 'api/_lib/recruitment/sj-reg-ask-date.ts')
const askDate = fs.existsSync(askDatePath) ? fs.readFileSync(askDatePath, 'utf8') : ''
const sjRegFile = fs.readFileSync(path.join(root, 'api/securityjob/register.ts'), 'utf8')
if (
  !askDate.includes('sendSjRegThankYouAskDate') ||
  !askDate.includes('This week') ||
  !askDate.includes('Next week') ||
  !askDate.includes('Never Fast2SMS') ||
  askDate.includes('fast2sms.com') ||
  !sjRegFile.includes('await sendSjRegThankYouAskDate') ||
  !pulseHook.includes('handleSjRegAskDateReply') ||
  !sjPages.includes('Thank you WhatsApp') ||
  !fs.existsSync(path.join(root, 'api/securityjob/join-date.ts'))
) {
  fail('Registration must send Whapi thank-you buttons for tentative date (not Fast2SMS)')
} else {
  ok('Registration thank-you WhatsApp asks tentative date (Whapi, no Fast2SMS)')
}
const aiCall = fs.existsSync(path.join(root, 'api/_lib/recruitment/sj-ai-call.ts'))
  ? fs.readFileSync(path.join(root, 'api/_lib/recruitment/sj-ai-call.ts'), 'utf8')
  : ''
const aiHook = fs.existsSync(path.join(root, 'api/recruitment/ai-call.ts'))
  ? fs.readFileSync(path.join(root, 'api/recruitment/ai-call.ts'), 'utf8')
  : ''
const sjRegister = fs.readFileSync(path.join(root, 'api/securityjob/register.ts'), 'utf8')
if (
  !aiCall.includes('Polly.Aditi') ||
  !aiCall.includes('queueOrPlaceSjAiCall') ||
  !aiCall.includes('sjAiCallOfficeHours') ||
  !aiCall.includes('Never Fast2SMS') ||
  !aiCall.includes('resolveSjAiVoice') ||
  aiCall.includes('fast2sms.com') ||
  !aiHook.includes('applySjAiCallReply') ||
  !sjRegister.includes('queueOrPlaceSjAiCall') ||
  !sjRegister.includes('language: applicant.language') ||
  !sjPages.includes('AI call') ||
  !sjPages.includes('Primary Language')
) {
  fail('Registration must trigger AI voice call in the form Primary Language (Twilio, not Fast2SMS)')
} else {
  ok('AI voice call uses the registration Primary Language (no Fast2SMS)')
}
const aiVoice = fs.existsSync(path.join(root, 'api/_lib/recruitment/sj-ai-call-voice.ts'))
  ? fs.readFileSync(path.join(root, 'api/_lib/recruitment/sj-ai-call-voice.ts'), 'utf8')
  : ''
if (
  !aiVoice.includes("key: 'Hindi'") ||
  !aiVoice.includes("key: 'Telugu'") ||
  !aiVoice.includes("key: 'Tamil'") ||
  !aiVoice.includes("key: 'Kannada'") ||
  !aiVoice.includes("key: 'Malayalam'") ||
  !aiVoice.includes("key: 'Bengali'") ||
  !aiVoice.includes("key: 'Marathi'")
) {
  fail('AI call must speak Hindi, Telugu, Tamil, Kannada, Malayalam, Bengali and Marathi')
} else {
  ok('AI call has scripts for the form languages')
}

if (!app.includes("n:'Training (EOI) Follow-up',fn:'trainingEoiFollowUp'") && !app.includes("n:'Training EOI Follow-up',fn:'trainingEoiFollowUp'")) {
  fail('Staff / Branch / Management menus must include Training EOI Follow-up')
} else if (!app.includes('function trainingEoiFollowUp()')) {
  fail('trainingEoiFollowUp page function missing')
} else if (!fs.existsSync(path.join(root, 'api/_lib/recruitment/training-eoi-store.ts'))) {
  fail('training-eoi-store.ts missing')
} else {
  ok('Training EOI Follow-up menu + store present (both portals)')
}

const dataPath = path.join(root, 'api/recruitment/data.ts')
const dataSrc = fs.readFileSync(dataPath, 'utf8')
if (!dataSrc.includes("action === 'securityJobListExcel'") || !dataSrc.includes("action === 'securityNewsListExcel'")) {
  fail('recruitment/data.ts must export Security Job and Security News Excel')
} else {
  ok('recruitment data API exports both registered-list Excels')
}
if (
  !dataSrc.includes("action === 'securityNewsRegisteredList'") ||
  !dataSrc.includes('listQuizPeopleForRecruitment') ||
  !dataSrc.includes("action === 'securityNewsWhatsApp'")
) {
  fail('recruitment/data.ts must load Security News quiz name+mobile list')
} else {
  ok('recruitment data API loads Security News registered list')
}
if (!dataSrc.includes('buildSecurityJobWhatsApp') || !dataSrc.includes("act === 'remind_whatsapp'")) {
  fail('recruitment/data.ts must send Security Job invite + remind WhatsApp')
} else {
  ok('recruitment data API sends Security Job invite + remind WhatsApp')
}
if (
  !dataSrc.includes("action === 'sjInvitePreview'") ||
  !dataSrc.includes('listSjInviteRecipients') ||
  !dataSrc.includes('sjInviteAlwaysCopyMobiles') ||
  !fs.existsSync(path.join(root, 'api/_lib/recruitment/sj-invite-recipients.ts'))
) {
  fail('Security Job invitation must preview, go to selected HOD/Recruitment, and copy Director + 9500915599')
} else {
  ok('Security Job invitation preview + HOD/Recruitment send + Director/app copy')
}
if (sjPages.includes('WhatsApp invitation (draft)')) {
  fail('WhatsApp invitation must not say draft')
}
if (!dataSrc.includes("action === 'trainingEoiFollowUps'") || !dataSrc.includes("action === 'syncTrainingEoi'")) {
  fail('recruitment/data.ts must expose trainingEoiFollowUps / syncTrainingEoi')
} else {
  ok('recruitment data API exposes Training EOI follow-up')
}

const funnelPagePath = path.join(root, 'api/_lib/recruitment/funnel-followup-pages.ts')
const funnelStorePath = path.join(root, 'api/_lib/recruitment/funnel-followup-store.ts')
const funnelExtractPath = path.join(root, 'api/_lib/recruitment/funnel-extract.ts')
if (!fs.existsSync(funnelPagePath) || !fs.existsSync(funnelStorePath) || !fs.existsSync(funnelExtractPath)) {
  fail('Sourcing funnel follow-up files missing (EOI / Absconders / Irregular / Recruiters / Security News)')
} else {
  const funnelPage = fs.readFileSync(funnelPagePath, 'utf8')
  const funnelStore = fs.readFileSync(funnelStorePath, 'utf8')
  const portalPages = fs.readFileSync(path.join(root, 'api/_lib/recruitment/portal-pages.ts'), 'utf8')
  const walkPages = fs.readFileSync(path.join(root, 'api/_lib/recruitment/walk-in-pages.ts'), 'utf8')
  if (
    !funnelPage.includes("function funnelFollowUp(") ||
    !funnelPage.includes('Call 1 — App') ||
    !funnelPage.includes('Call 2 — App') ||
    !funnelPage.includes('Call 3 — Recruitment') ||
    !funnelPage.includes('Hold on') ||
    !funnelPage.includes('Save date') ||
    !funnelPage.includes("alert('Saved')") ||
    !funnelPage.includes('ffSaveFromBtn') ||
    !funnelPage.includes('cannot be deleted') ||
    !funnelPage.includes('Show last list') ||
    !funnelStore.includes('recruit:funnel-snap:') ||
    !funnelStore.includes('recruit:funnel-dates:') ||
    !dataSrc.includes("action === 'funnelFollowupList'") ||
    !dataSrc.includes("action === 'saveFunnelDate'") ||
    !app.includes("funnelFollowUp('eoi')") ||
    !app.includes("funnelFollowUp('absconder')") ||
    !portalPages.includes("funnelFollowUp('irregular')") ||
    !walkPages.includes("funnelFollowUp('recruiters')") ||
    !snPage.includes("funnelFollowUp('news')")
  ) {
    fail('Sourcing funnel lists must use Security Job Call 1–3 follow-up and remember the last extract')
  } else if (walkPages.includes("function sourceAcademy(){walkInPipeline('academy');}") === false) {
    fail('Academy / Referral must keep the Walk-in add form')
  } else {
    ok('Sourcing funnel lists use Call 1–3 follow-up and remember the last extract')
  }
}

const refPagePath = path.join(root, 'api/_lib/recruitment/referral-list-pages.ts')
if (!fs.existsSync(refPagePath)) {
  fail('referral-list-pages.ts is missing')
} else {
  const refPage = fs.readFileSync(refPagePath, 'utf8')
  if (!refPage.includes('Cumulative Referral Details')) fail('referral page must be titled Cumulative Referral Details')
  else ok('referral page uses Cumulative Referral Details title')
  if (!refPage.includes('id="ref_from"') || !refPage.includes('id="ref_to"')) {
    fail('Cumulative Referral Details must have From / To date filters')
  } else {
    ok('Cumulative Referral Details From / To filters')
  }
  if (!refPage.includes('one person once') && !refPage.includes('Each person appears once')) {
    fail('Cumulative Referral must keep one person once')
  } else if (!refPage.includes('by[b].length-by[a].length') || !refPage.includes('Staff / SG') || !refPage.includes('refMonthRange')) {
    fail('Cumulative Referral must be Staff / SG name-wise and default 1st to last working day')
  } else {
    ok('Cumulative Referral is Staff / SG name-wise · month 1st to last working day')
  }
}

const refDedupe = path.join(root, 'api/_lib/recruitment/referral-dedupe.ts')
if (!fs.existsSync(refDedupe)) {
  fail('referral-dedupe.ts is missing')
} else {
  const dedupe = fs.readFileSync(refDedupe, 'utf8')
  if (!dedupe.includes('compactStaffKey') || !dedupe.includes('foldReferralStaffNames') || !dedupe.includes('clusterKey')) {
    fail('referral-dedupe must combine the same Staff / SG name (e.g. SARKAR-OM) into one group')
  } else if (!dedupe.includes('looksLikeRejoinOrOldGuard') || !dedupe.includes('dedupeReferralRows') || !dedupe.includes("kind === 'rejoin'")) {
    fail('referral-dedupe must drop rejoins / old guards and keep one row per person')
  } else if (!dedupe.includes('monthReferralRange') || !dedupe.includes('lastWorkingDayOfMonth')) {
    fail('referral period must be 1st of the month to last working day')
  } else if (!dataSrc.includes('dedupeReferralRows') || !dataSrc.includes('isRejoinOrOldGuardRow') || !dataSrc.includes('monthReferralRange')) {
    fail('referralList must use referral-dedupe and the month period')
  } else {
    ok('Cumulative Referral filters rejoins, dedupes, and uses the month period')
  }
}

if (!dataSrc.includes("action === 'saveBranchWage'") || !dataSrc.includes("action === 'previewRecruitFormat'") || !dataSrc.includes("action === 'referralIncentives'")) {
  fail('data.ts must expose wages, recruitment formats, and referral incentives APIs')
} else {
  ok('wages + recruitment formats + referral incentives APIs')
}

if (!app.includes('MGMT_MENU=') || !app.includes("fn:'drrForm'")) {
  fail('Management menu must include drrForm')
} else {
  ok('Management menu includes DRR form')
}

// DRR must stay in Recruitment section (not under Dashboard / Sourcing Funnel)
const staffMenu = app.match(/var STAFF_MENU=\[([\s\S]*?)\];/)?.[1] || ''
const drrPos = staffMenu.indexOf("fn:'drrForm'")
const sourcingHead = staffMenu.indexOf('Sourcing Funnel')
const recruitHead = staffMenu.indexOf('— Recruitment —')
if (drrPos < 0 || recruitHead < 0 || drrPos < recruitHead) {
  fail('Staff menu: DRR must sit under Recruitment heading')
} else if (sourcingHead >= 0 && drrPos < sourcingHead) {
  fail('Staff menu: DRR must not sit above Sourcing Funnel')
} else {
  ok('Staff menu: DRR under Recruitment section')
}

if (gate.includes('script.google.com') || gate.includes('RECRUITMENT_URL')) {
  fail('recruitment/gate.ts must not target Google Apps Script')
} else if (!gate.includes('/recruitment/?portal=staff')) {
  fail('recruitment/gate.ts must open suite /recruitment/?portal=staff')
} else {
  ok('gate opens suite recruitment app')
}

for (const doc of ['manual.ts', 'troubleshooting.ts']) {
  const p = path.join(root, 'api/recruitment', doc)
  if (!fs.existsSync(p)) fail(`missing api/recruitment/${doc}`)
  else {
    const text = fs.readFileSync(p, 'utf8')
    if (!text.includes('Daily Recruitment Report (DRR)')) fail(`${doc} must document DRR`)
    else ok(`${doc} documents DRR`)
  }
}

if (!app.includes('/recruitment/manual') || !app.includes('/recruitment/troubleshooting')) {
  fail('app.ts must link User Guide + Troubleshooting in the sidebar')
} else {
  ok('app.ts links manual + troubleshooting')
}

if (/recruitment:[\s\S]*?targetUrl:\s*RECRUITMENT_URL/.test(cfg)) {
  fail('suite-gate-config recruitment still uses RECRUITMENT_URL (Google)')
} else if (!cfg.includes("targetUrl: '/recruitment/?portal=management'")) {
  fail('suite-gate-config recruitment targetUrl should be suite SPA')
} else {
  ok('suite-gate-config points recruitment to suite SPA')
}

if (probe) {
  const urls = [
    'https://www.agilegroup-digital.co.in/recruitment/?portal=staff',
    'https://www.agilegroup-digital.co.in/recruitment/?portal=management',
    'https://www.agilegroup-digital.co.in/api/recruitment/gate?portal=staff',
    'https://www.agilegroup-digital.co.in/recruitment/manual',
    'https://www.agilegroup-digital.co.in/recruitment/troubleshooting',
  ]
  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: 'follow' })
      const html = await res.text()
      if (!res.ok) fail(`probe ${url} → HTTP ${res.status}`)
      else if (url.includes('gate')) {
        if (html.includes('script.google.com')) fail(`gate still targets Google: ${url}`)
        else if (!html.includes('/recruitment/?portal=staff') && !html.includes('TARGET_URL="/recruitment'))
          fail(`gate TARGET missing suite recruitment: ${url}`)
        else ok(`probe gate OK ${url}`)
      } else if (url.includes('manual') || url.includes('troubleshooting')) {
        if (!html.includes('Daily Recruitment Report (DRR)')) fail(`probe docs missing DRR: ${url}`)
        else ok(`probe docs OK ${url}`)
      } else if (!html.includes('Daily Recruitment Report (DRR)') || !html.includes('drrForm')) {
        fail(`probe missing DRR menu: ${url}`)
      } else if (!html.includes('Cumulative Referral Details')) {
        fail(`probe missing Cumulative Referral Details: ${url}`)
      } else if (!html.includes('Submit nil recruitment') || !html.includes('saveNilDrr')) {
        fail(`probe missing nil recruitment: ${url}`)
      } else {
        ok(`probe DRR OK ${url}`)
      }
    } catch (e) {
      fail(`probe ${url}: ${e.message}`)
    }
  }
}

if (failed) {
  console.error('\ncheck:recruitment-drr FAILED\n')
  process.exit(1)
}
console.log('\ncheck:recruitment-drr OK')
