#!/usr/bin/env node
/**
 * Lock: MIS Site Security Assessment (SSA) sits after Daily MIS on HOD + Management,
 * Industry Type (CRM sectors), HOD suggestions, Final report, Send for approval.
 *
 *   npm run check:special-survey
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

function afterDaily(menuSrc, dailyNeedle, specialNeedle, label) {
  const daily = menuSrc.indexOf(dailyNeedle)
  const special = menuSrc.indexOf(specialNeedle)
  const master = menuSrc.indexOf("['Master Directory'")
  if (daily < 0) fail(`${label} missing Daily MIS Submission`)
  else if (special < 0) fail(`${label} missing Site Security Assessment (SSA)`)
  else if (special < daily) fail(`${label} Site Security Assessment (SSA) must come after Daily MIS Submission`)
  else if (master > 0 && special > master) fail(`${label} Site Security Assessment (SSA) must come before Master Directory`)
  else ok(`${label} Site Security Assessment (SSA) is after Daily MIS Submission`)
}

const staff = fs.readFileSync(path.join(root, 'api/_lib/mis/staff-layout.ts'), 'utf8')
const mgmt = fs.readFileSync(path.join(root, 'api/_lib/mis/layout.ts'), 'utf8')
afterDaily(staff, "['Daily MIS Submission'", "['Site Security Assessment (SSA)'", 'HOD menu')
afterDaily(mgmt, "['Daily MIS Submission'", "['Site Security Assessment (SSA)'", 'Management menu')

if (staff.includes("['Periodical Survey Format'")) {
  fail('HOD menu must not keep Periodical Survey Format as a second survey menu — use Site Security Assessment (SSA)')
} else ok('HOD menu has one survey entry (Site Security Assessment (SSA))')
if (mgmt.includes("['Periodical Survey Format'")) {
  fail('Management menu must not keep Periodical Survey Format as a second survey menu — use Site Security Assessment (SSA)')
} else ok('Management menu has one survey entry (Site Security Assessment (SSA))')

const needed = [
  'api/mis/special-survey.ts',
  'api/mis/staff-special-survey.ts',
  'api/mis/periodical-survey.ts',
  'api/mis/staff-periodical-survey.ts',
  'api/_lib/mis/periodical-survey-page.ts',
  'api/_lib/mis/periodical-survey-ui.ts',
  'api/_lib/mis/periodical-survey-store.ts',
  'api/_lib/mis/periodical-survey-handlers.ts',
  'api/_lib/mis/ssa-directory.ts',
  'api/_lib/mis/hdfc-ssa-state.ts',
  'api/_lib/mis/hdfc-ssa-dashboard.ts',
  'api/_lib/mis/hdfc-ssa-board-ai.ts',
  'api/_lib/mis/hdfc-ssa-board-store.ts',
  'api/_lib/mis/hdfc-ssa-board-risk.ts',
  'api/_lib/mis/hdfc-ssa-board-geo.ts',
  'api/_lib/mis/hdfc-ssa-board-map.ts',
  'public/maps/india-states.geojson',
  'api/mis/hdfc-ssa-board.ts',
]
for (const rel of needed) {
  if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`)
  else ok(`has ${rel}`)
}

const ui = fs.readFileSync(path.join(root, 'api/_lib/mis/periodical-survey-ui.ts'), 'utf8')
const ssaBrand = fs.readFileSync(path.join(root, 'api/_lib/mis/ssa-brand.ts'), 'utf8')
const pub = fs.readFileSync(path.join(root, 'api/_lib/mis/hdfc-survey-public-ui.ts'), 'utf8')
if (!ssaBrand.includes('Site Security Assessment (SSA)') || !ssaBrand.includes('ssaWhatWhereIntroHtml')) {
  fail('ssa-brand must define Site Security Assessment (SSA) intro')
} else ok('SSA brand + What/Where intro present')
if (!ui.includes('ssaWhatWhereIntroHtml') || !pub.includes('ssaWhatWhereIntroHtml')) {
  fail('Opening pages (portal + public HDFC link) must show SSA What/Where description')
} else ok('SSA What/Where on portal and public ops link')
{
  const introAt = ui.indexOf('ssaWhatWhereIntroHtml()')
  const formatAt = ui.indexOf('Periodical Site Security Assessment (SSA) Format')
  if (introAt < 0 || formatAt < 0 || introAt > formatAt) {
    fail('SSA What/Where description must sit just above Periodical Site Security Assessment (SSA) Format')
  } else ok('SSA description is above Periodical Format title')
}
if (ui.includes('Special Survey') || pub.includes('Special Survey') || staff.includes("['Special Survey'")) {
  fail('User-facing Special Survey label must be renamed to Site Security Assessment (SSA)')
} else ok('Special Survey label removed from menus/UI')

for (const tab of [
  'Site Inputs &amp; Photos',
  'Risk Checklist (0–5)',
  'Professional Report',
  'Final report with suggestion',
]) {
  if (!ui.includes(tab)) fail(`UI missing tab: ${tab}`)
  else ok(`UI has ${tab}`)
}
if (!ui.includes("SV_TAB==='hod'") || !ui.includes("hodSuggestions")) {
  fail("UI missing HOD's suggestions tab")
} else ok("UI has HOD's suggestions")
if (ui.includes('>Contract Start<') || ui.includes("SV_TAB==='contract'")) {
  fail('Contract Start tab must be removed from Site Security Assessment (SSA)')
} else ok('Contract Start tab removed')
if (!ui.includes('Industry Type') || !ui.includes('industryOptions') || !ui.includes('openIndustryModal')) {
  fail('UI must ask Industry Type on Add Survey')
} else if (!ui.includes("SV_TAB=sv.surveyKind==='hdfc'?'h1':'checklist'") || !ui.includes("if(sel.value && sel.value!=='Other')confirmAddSurveyIndustry()") || !ui.includes('ssaHomeBlock') || !ui.includes('Assessment questionnaire')) {
  fail('After Industry Type, General SSA must open the Risk Checklist questionnaire (not stay on the home card)')
} else ok('UI asks Industry Type on Add Survey')
if (
  !ui.includes('Start Assessment') ||
  !ui.includes('addHdfcSurvey') ||
  !ui.includes('HDFC SSA submitted List') ||
  !ui.includes('renderHdfcNav') ||
  !ui.includes('Forward for Approval') ||
  !ui.includes('forwardHdfcForApproval') ||
  !ui.includes('Director Approval') ||
  !ui.includes('hdfcBranchProgress') ||
  !ui.includes('Branch code:') ||
  !ui.includes('hdfcTrackBranch') ||
  !ui.includes('hdfcTrackBarHtml') ||
  !ui.includes('Branch Name') ||
  !ui.includes('Submitted')
) {
  fail('UI must have Start Assessment + submitted List (Branch Name dropdown + Submitted 000/000 + Branch code / progress 00/00) + Review/Edit/Forward for Approval + Director Approval')
} else ok('UI has Start Assessment + submitted List + Forward for Approval flow')
if (!ui.includes("hdfcTrackOptionLabel('All Branches'") || !ui.includes('IS_STAFF') || !ui.includes('hdfcTrackSubmitted') || !ui.includes('Total HDFC') || !ui.includes('Not submitted (Draft)') || !ui.includes("span>Total HDFC</span>")) {
  fail('HDFC submitted List must track Branch Name + Submitted + Total HDFC on both portals, and explain Draft')
} else ok('HDFC submitted List has Branch Name + Submitted + Total HDFC, and Draft is labelled')
if (ui.includes('onclick="submitSurvey(') && ui.includes('>Send to HOD</button>')) {
  fail('Portal HDFC must not show Send to HOD button (ops submit; HOD Review / Edit / Forward)')
} else ok('Portal HDFC has no Send to HOD button')
if (!ui.includes('>Review</button>') || !ui.includes('>Edit</button>') || !ui.includes('>Forward for Approval</button>')) {
  fail('HDFC list buttons must be Review → Edit → Forward for Approval')
} else ok('HDFC list buttons Review → Edit → Forward for Approval')
if (!ui.includes('>Re-assessment</button>')) {
  fail('HDFC list must have Re-assessment after Edit')
} else ok('HDFC list has Re-assessment button')
if (
  !ui.includes('Periodical Site Security Assessment (SSA) Format') ||
  !ui.includes('Site Security Assessment (General)') ||
  !ui.includes('HDFC SSA') ||
  !ui.includes('setSsaMode') ||
  !ui.includes('mis-hdfc-survey') ||
  !ui.includes('previewHdfcSsaLink')
) {
  fail('SSA home must split General (yellow) / HDFC SSA (blue) with public link + preview')
} else ok('SSA home has General + HDFC SSA split with link preview')

const hdfcUi = fs.readFileSync(path.join(root, 'api/_lib/mis/periodical-survey-hdfc-ui.ts'), 'utf8')
for (const needle of [
  '1. Location & Identification',
  '2. Basic Information',
  '3. Deployment verification',
  '4. Registers & Compliance',
  '5. Bank Physical security',
  '6. ATM & Lobby',
  '7. Generator & Utility',
  '8. Perimeter & Patrolling',
  '9. Fire safety',
  '10. Emergency communication',
  '11. Electronic Security',
  '12. Risk check list',
  '13. Professional assessment',
  '14. Site Photos & Documents',
  '15. Final Report with suggestions',
  'surroundLeft',
  'wineShopNearby',
  'remoteAtNight',
  'publicMovement24x7',
  'surveyedByPick',
  'faKnowsProcedure',
  'Holiday opening is on the file',
  '1FA',
  'dayShiftStart',
  'afternoonShiftStart',
  'eveningShiftStart',
  'faOnDuty',
  'Name not available',
  'politicalPartyOfficeNearby',
  'airportNearby',
  'Attendance Register',
  'Cash Loading register',
  'Bank Opening and closing Register',
  'faDocPvc',
  'faDocMedical',
  'faDocDeploymentOrder',
  'holidayRegisterKeepPlace',
  'entryPointsToBank',
  'Normal Main door open position',
  'closingBankChecklist',
  'whoLocksBank',
  'whoSealsKeys',
  'feAtmCount',
  'feBankCount',
  'cookingHeatingAvailable',
  'recentFireAudit',
  'hdfcDateOrUnknown',
  'routerInstalled',
  'panicSwitchAtm',
  'agileControlNumber',
  'escalationKnownFa',
  'openPosition',
  'backYardDoor',
  'damagedWindows',
  'fireExtCount',
  'fireExtValidityChecked',
  'fireExtExpired',
  'atmShiftCount',
  'atmKeySets',
  'atmOpenWiring',
  'generatorBattery',
  'generatorStartedBy',
  'outdoorAcUnit',
  'while HOTO & Nights',
  'facilityAttendantsJson',
  'Add FA',
  'openPhotosPreview',
  'Photos Preview',
  'openSendToClient',
  'Send to client',
  'Sent to client by HOD',
  'waiting Director Approval',
  "surveyKind!=='hdfc'",
  'cctvAtmCount',
  'cctvBankCount',
  'localDvrLocation',
  'cctvCableOpen',
  'Fire Safety check - Bank',
  'renderHdfcPhotosDocs',
  'Flip camera',
  'doc_attendance',
  'bank_front',
]) {
  if (!hdfcUi.includes(needle) && !ui.includes(needle)) fail(`HDFC UI missing: ${needle}`)
}
if (hdfcUi.includes("hdfcCard('9. Fire")) {
  fail('Fire Safety sub-headings must not start with 9.')
} else ok('Fire Safety sub-headings have no leading 9.')
if (hdfcUi.includes("hdfcFld('CCTV — Number of Cameras'")) {
  fail('Electronic Security must use ATM/Bank CCTV counts, not single camera count')
} else ok('Electronic Security uses ATM/Bank CCTV counts')
if (hdfcUi.includes("hdfcFld('Strong Room") || hdfcUi.includes("hdfcFld('Emergency Exit'")) {
  fail('HDFC Physical Security must not show Strong Room / Emergency Exit')
} else ok('HDFC Physical Security hides Strong Room / Emergency Exit')
if (hdfcUi.includes("hdfcFld('No. of Fire extinguishers'") || hdfcUi.includes("hdfcFld('Fire Extinguishers — Type'") || hdfcUi.includes("hdfcFld('Quantity'")) {
  fail('HDFC must not keep old Fire extinguisher Type/Quantity on Physical or Fire tabs')
} else ok('HDFC old FE Type/Quantity removed from UI')
if (hdfcUi.includes("hdfcFld('Panic Switches") || hdfcUi.includes("hdfcFld('Burglar Alarm'") || hdfcUi.includes('known to guards')) {
  fail('HDFC Emergency must not show Panic Switches count/status, Burglar Alarm, or guards escalation')
} else ok('HDFC Emergency uses FA-focused fields')
if (hdfcUi.includes("hdfcFld('Visitor register'") || hdfcUi.includes("hdfcFld('Key register'")) {
  fail('HDFC Registers must use the new Director order (not Visitor/Key)')
} else ok('HDFC Registers use new Director order')
if (hdfcUi.includes("hdfcFld('Branch Name'") || hdfcUi.includes("hdfcFld('SOL ID'") || hdfcUi.includes('Surroundings — First Floor')) {
  fail('HDFC Location must not show Branch Name / SOL ID / First Floor')
} else ok('HDFC Location hides Branch Name / SOL ID / First Floor')
if (hdfcUi.includes("hdfcFld('ASO present'") || hdfcUi.includes("hdfcFld('LSG present'") || hdfcUi.includes("hdfcFld('SG present'")) {
  fail('HDFC Deployment must not show ASO/LSG/SG present')
} else ok('HDFC Deployment hides ASO/LSG/SG')
if (hdfcUi.includes("hdfcFld('ATM Guarding',hdfcSel(si,'atmGuarding',['24x7'")) {
  fail('ATM Guarding must be 3 Shift / 2 Shift (1st & 2nd) / 1 shift (G)')
} else if (!hdfcUi.includes('2 Shift (1st & 2nd)') || !hdfcUi.includes('1 shift (G)')) {
  fail('ATM Guarding dropdown must include 3 Shift / 2 Shift (1st & 2nd) / 1 shift (G)')
} else ok('ATM Guarding uses 3 Shift / 2 Shift / 1 shift (G)')
if (hdfcUi.includes("hdfcFld('Generator present'")) {
  fail('Page 7 must use Generator Location, not Generator present')
} else if (
  !hdfcUi.includes("hdfcFld('Generator Location'") ||
  !hdfcUi.includes('Front side') ||
  !hdfcUi.includes("hdfcFld('Visibility from the ATM'") ||
  !hdfcUi.includes("hdfcFld('CCTV coverage to Generator'") ||
  !hdfcUi.includes("hdfcFld('Generator Area Luminated'") ||
  !hdfcUi.includes("hdfcFld('Generator Register Maintained'")
) {
  fail('Page 7 must have Generator Location + visibility / CCTV / luminated + Register Maintained last')
} else ok('Page 7 Generator Location and extra Yes/No fields present')
if (!ui.includes('OPS_TEAM') || !ui.includes('opsTeam')) {
  fail('UI must load opsTeam for Surveyed By dropdown')
} else ok('UI loads opsTeam for Surveyed By')
if (!failed) ok('HDFC 15 headings + surroundings fields present')
if (!ui.includes('renderHdfcFinalSummary') || !hdfcUi.includes('renderHdfcFinalSummary')) {
  fail('Final report must summarise HDFC questionnaire answers')
} else ok('Final report has HDFC summary')
if (!hdfcUi.includes('forwardHdfcForApproval') || !fs.readFileSync(path.join(root, 'api/_lib/mis/periodical-survey-handlers.ts'), 'utf8').includes('handlePeriodicalSurveyForwardApproval')) {
  fail('HOD Forward for Approval handler/UI missing for HDFC')
} else ok('HOD Forward for Approval wired')
if (
  !hdfcUi.includes('requestHdfcReassessment') ||
  !fs.readFileSync(path.join(root, 'api/_lib/mis/periodical-survey-handlers.ts'), 'utf8').includes('handlePeriodicalSurveyReassessment') ||
  !fs.readFileSync(path.join(root, 'api/mis/staff-data.ts'), 'utf8').includes('periodicalSurveyReassessment') ||
  !fs.readFileSync(path.join(root, 'api/mis/admin-data.ts'), 'utf8').includes('periodicalSurveyReassessment')
) {
  fail('Re-assessment must be wired (UI + handler + staff + management)')
} else ok('Re-assessment wired for HOD + Management')
if (!fs.readFileSync(path.join(root, 'api/_lib/mis/periodical-survey-store.ts'), 'utf8').includes('reassessmentAt')) {
  fail('Store must keep reassessmentAt for progress drop')
} else ok('Store has reassessmentAt')
if (
  hdfcUi.includes('hdfcOnSendPages') ||
  hdfcUi.includes(">Send to HOD</button>")
) {
  fail('HDFC portal footer must not use Send to HOD (use Forward for Approval)')
} else ok('HDFC portal footer uses Forward for Approval (no Send to HOD)')
if (
  !hdfcUi.includes("onclick=\"saveSurveys()\">Save</button>") ||
  !hdfcUi.includes('Forward for Approval') ||
  !hdfcUi.includes('forwardHdfcForApproval')
) {
  fail('HDFC footer must have Save + Forward for Approval')
} else ok('HDFC footer has Save + Forward for Approval')
if (!hdfcUi.includes('Forward for Approval after Review')) {
  fail('HDFC footer must note: Forward for Approval after Review / Edit')
} else ok('HDFC footer has Forward after Review note')
if (
  !ui.includes('scheduleHdfcAutoSave') ||
  !ui.includes('hdfcAutoSaveQuiet') ||
  !ui.includes('flushHdfcAutoSave') ||
  !ui.includes('backHdfcList') ||
  !hdfcUi.includes('goHdfcTab') ||
  !hdfcUi.includes('All 15 pages auto-save')
) {
  fail('HDFC must auto-save all 15 pages (schedule + tab flush); goHdfcTab must live in hdfc-ui for public link')
} else ok('HDFC auto-saves all 15 pages')
if (!hdfcUi.includes('mis-hdfc-survey') && !fs.readFileSync(path.join(root, 'api/_lib/mis/hdfc-survey-public-ui.ts'), 'utf8').includes('hdfcSurveyClientScript')) {
  fail('Public HDFC survey must use shared hdfc script (with goHdfcTab)')
} else ok('Public HDFC survey uses shared nav (goHdfcTab)')

if (!fs.readFileSync(path.join(root, 'api/_lib/mis/hdfc-survey-sections.ts'), 'utf8').includes('nearestFireStation')) {
  fail('hdfc-survey-sections must include fire/police/surroundings')
} else ok('HDFC sections module present')
const crmStore = fs.readFileSync(path.join(root, 'api/_lib/crm/store.ts'), 'utf8')
if (!crmStore.includes('Hospitality') || !crmStore.includes('Pharmaceutical') || !crmStore.includes('University Campus')) {
  fail('CRM SECTORS must include Hospitality, Pharmaceutical, University Campus')
} else ok('CRM industry list expanded for Site Security Assessment (SSA)')
if (!ui.includes('Send for approval')) {
  fail('UI must have Send for approval')
} else ok('UI has Send for approval')
if (!ui.includes('Save review') || !ui.includes('Reminder to HOD with suggestion') || !ui.includes('Approved</button>')) {
  fail('Management must have Save review, Reminder to HOD with suggestion, Approved')
} else ok('Management Save review / Reminder / Approved present')
if (!ui.includes('saveReview') || !ui.includes('openAudit')) {
  fail('UI missing saveReview / openAudit')
} else ok('UI has saveReview + openAudit')

if (!ui.includes('generateSystemSuggestion')) {
  fail('UI missing Generate system suggestion')
} else ok('UI has Generate system suggestion')

const store = fs.readFileSync(path.join(root, 'api/_lib/mis/periodical-survey-store.ts'), 'utf8')
if (!store.includes('hodSuggestions') || !store.includes('systemSuggestions')) {
  fail('Store must keep hodSuggestions + systemSuggestions')
} else ok('Store has HOD + system suggestions')
if (!store.includes('mgmtSuggestionsReviewedAt')) {
  fail('Store must keep mgmtSuggestionsReviewedAt for Step I')
} else ok('Store has Management Step I fields')
if (!store.includes('hdfcForm') || !store.includes('emptyHdfcForm') || !store.includes('buildHdfcQuestionnaireHtml')) {
  fail('Store must keep hdfcForm + buildHdfcQuestionnaireHtml')
} else ok('Store has hdfcForm questionnaire')
if (!store.includes('HodApproved') || !store.includes('hodApprovedAt')) {
  fail('Store must keep HodApproved status for HDFC')
} else ok('Store has HodApproved status')
if (
  !store.includes('upsertPeriodicalSurvey') ||
  !store.includes('savePublicHdfcDraft') ||
  !store.includes('getPeriodicalSurveysForBranch') ||
  !store.includes('mis:periodical-survey:') ||
  !store.includes('mis:periodical-survey-extra-ids') ||
  !store.includes('mis:periodical-survey-public-branch:')
) {
  fail('Store must save one SSA draft on its own key and load that branch list without the giant book')
} else ok('Store can auto-save one SSA draft on its own key')

const handlers = fs.readFileSync(path.join(root, 'api/_lib/mis/periodical-survey-handlers.ts'), 'utf8')
if (!handlers.includes('opsTeam')) {
  fail('Boot must return opsTeam')
} else ok('Boot returns opsTeam')
if (
  !handlers.includes('getPeriodicalSurveysForBranch') ||
  !handlers.includes('skipRepair: true') ||
  !ui.includes('ssaHdfcDraftBox') ||
  !ui.includes('Incomplete — not submitted (Draft)') ||
  !ui.includes('hdfcIncomplete') ||
  !ui.includes("setSsaMode('hdfc')") ||
  !ui.includes("var title=loc&&loc!=='—'?loc:")
) {
  fail('HOD SSA must show Incomplete / Not submitted (Draft) and load phone drafts for that branch')
} else ok('HOD SSA shows Incomplete / Not submitted (Draft) and loads phone drafts')
if (!handlers.includes('buildHdfcQuestionnaireHtml')) {
  fail('Client report must include HDFC questionnaire HTML')
} else ok('Client report wires HDFC questionnaire')
if (!handlers.includes('SECTORS') || !handlers.includes('industries')) {
  fail('Handlers must expose CRM SECTORS as industries')
} else ok('Handlers expose CRM industries')
if (!handlers.includes('handlePeriodicalSurveyReviewSuggestions')) {
  fail('Handlers missing Review Suggestions')
} else ok('Handlers have Review Suggestions')

const staffData = fs.readFileSync(path.join(root, 'api/mis/staff-data.ts'), 'utf8')
if (!staffData.includes('handlePeriodicalSurveySave') || !staffData.includes('handlePeriodicalSurveySubmit')) {
  fail('HOD must save drafts and Send for approval (submit)')
} else ok('HOD save + submit are wired')
if (!staffData.includes('handlePeriodicalSurveyForwardApproval') || !staffData.includes('periodicalSurveyForwardApproval')) {
  fail('HOD must have Forward for approval wired')
} else ok('HOD Forward for approval is wired')
if (!staffData.includes('handlePeriodicalSurveySendToClient') || !staffData.includes('periodicalSurveySendToClient')) {
  fail('HOD must have Send to client wired')
} else ok('HOD Send to client is wired')
if (!staffData.includes(', bid)')) {
  fail('HOD save must lock surveys to the signed-in branch')
} else ok('HOD survey save is branch-locked')

const admin = fs.readFileSync(path.join(root, 'api/mis/admin-data.ts'), 'utf8')
if (!admin.includes('periodicalSurveyReviewSuggestions')) {
  fail('admin-data must wire periodicalSurveyReviewSuggestions')
} else ok('admin-data wires Review Suggestions')
if (!admin.includes('handlePeriodicalSurveyApprove') || !admin.includes('handlePeriodicalSurveyRemind') || !admin.includes('handlePeriodicalSurveyReopen')) {
  fail('Management must Review / Reminder / Reopen')
} else ok('Management review / reminder / reopen are wired')
if (!admin.includes('periodicalSurveyDelete') || !admin.includes('handlePeriodicalSurveyDelete')) {
  fail('Management must be able to Delete test surveys')
} else ok('Management Delete survey is wired')
if (!ui.includes('deleteSurvey') || !ui.includes('>Delete<')) {
  fail('UI must show Delete for Management')
} else ok('UI has Management Delete')
if (!admin.includes('Management reviews surveys')) {
  fail('Management must not overwrite HOD survey submissions')
} else ok('Management cannot replace HOD survey list')

if (!ui.includes('Send for approval') || !ui.includes('Reminder to HOD with suggestion') || !ui.includes('Reopen')) {
  fail('UI must split HOD send vs Management review / reminder / reopen')
} else ok('UI has HOD send and Management review actions')

const vercel = fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')
if (!vercel.includes('/mis-staff-special-survey') || !vercel.includes('/mis-special-survey')) {
  fail('vercel.json must rewrite Site Security Assessment (SSA) URLs')
} else ok('vercel.json rewrites Site Security Assessment (SSA)')
if (!vercel.includes('/mis-hdfc-survey') || !vercel.includes('/api/mis/hdfc-survey-public')) {
  fail('vercel.json must rewrite public /mis-hdfc-survey onto the small public SSA program')
} else ok('vercel.json rewrites public HDFC survey')
const staffApi = fs.readFileSync(path.join(root, 'api/mis/staff.ts'), 'utf8')
if (!staffApi.includes('hdfcPublic') || !staffApi.includes('hdfc-survey-public')) {
  fail('api/mis/staff.ts must serve the public HDFC survey')
} else ok('MIS staff program serves public HDFC survey')
const hdfcPubUi = fs.readFileSync(path.join(root, 'api/_lib/mis/hdfc-survey-public-ui.ts'), 'utf8')
if (!hdfcPubUi.includes("var API='/mis-hdfc-survey'")) {
  fail('Public HDFC page must load branches from /mis-hdfc-survey')
} else ok('Public HDFC page loads branches from /mis-hdfc-survey')

if (!fs.existsSync(path.join(root, 'api/mis/hdfc-survey-public.ts'))) {
  fail('missing api/mis/hdfc-survey-public.ts')
} else ok('has public HDFC survey API')
if (!fs.existsSync(path.join(root, 'api/_lib/mis/hdfc-survey-public-ui.ts'))) {
  fail('missing api/_lib/mis/hdfc-survey-public-ui.ts')
} else ok('has public HDFC survey UI')
const pubUi = fs.readFileSync(path.join(root, 'api/_lib/mis/hdfc-survey-public-ui.ts'), 'utf8')
if (
  !pubUi.includes('Submit to HOD') ||
  !pubUi.includes('startPublicSurvey') ||
  !pubUi.includes('Branch *') ||
  pubUi.includes('Branch / City') ||
  !pubUi.includes('No login')
) {
  fail('Public UI must be no-login Branch → HDFC → Submit to HOD')
} else if (!pubUi.includes("onclick=\"hdfcGoPrev()\"") || !pubUi.includes("onclick=\"hdfcGoNext()\"") || !pubUi.includes('isHdfcLastPage') || !hdfcUi.includes('function hdfcGoPrev') || !hdfcUi.includes('function hdfcGoNext')) {
  fail('Public HDFC SSA must use Previous / Next and show Submit to HOD only on page 15')
} else ok('Public UI is no-login Branch → HDFC → Submit to HOD')
if (
  !pubUi.includes('Agile Security Force Private Limited') ||
  !pubUi.includes('HDFC Site Security Assessment (SSA) Format') ||
  !pubUi.includes('Risk Analyst / Operations name') ||
  !pubUi.includes('pubEmail') ||
  !pubUi.includes('pubWa') ||
  !pubUi.includes('pubDateTime') ||
  !pubUi.includes('timeTaken') ||
  !pubUi.includes('Start Assessment') ||
  !pubUi.includes('complete all 15 pages') ||
  !pubUi.includes('m-btn-block') ||
  !pubUi.includes('safe-area-inset-bottom')
) {
  fail('Public link must show company heading, Start Assessment, all-15 instruction, Risk Analyst fields, mobile-friendly CSS')
} else ok('Public link has Start Assessment + 15-page instruction + mobile CSS')
if (
  !pubUi.includes('Write down the continue code') ||
  !pubUi.includes('Write this code down or take a photo') ||
  !pubUi.includes('After page 15 / after Submit to HOD') ||
  !pubUi.includes('HDFC SSA submitted List') ||
  !pubUi.includes('The continue code then stops')
) {
  fail('Public start must tell ops to note the code and what happens after page 15')
} else ok('Public start has note-the-code + after page 15 instructions')
if (!ui.includes('Never show raw ids like br5') && !ui.includes("return '—';")) {
  /* branchNameOf must not dump technical branch ids */
}
if (!ui.includes('STAFF_BRANCH_NAME') || !handlers.includes('.filter((b) => !lockedBranchId || b.id === lockedBranchId)')) {
  fail('HOD boot must load branch name (not raw br5)')
} else ok('HOD list shows branch name (not raw br5)')
if (
  !pubUi.includes('schedulePublicAutoSave') ||
  !pubUi.includes('quietPublicAutoSave') ||
  !pubUi.includes("action:'draft'") ||
  !pubUi.includes('scheduleHdfcAutoSave') ||
  !pubUi.includes('flushHdfcAutoSave') ||
  !pubUi.includes('Draft saved on this branch list') ||
  !pubUi.includes('pubSaveBanner') ||
  !pubUi.includes('savePublicDraftNow')
) {
  fail('Public UI must quiet Draft auto-save (aliases for shared HDFC tabs)')
} else ok('Public UI has Draft auto-save + HDFC aliases')
if (!pubUi.includes('draft=1') || !pubUi.includes('applyPublicDraft') || !pubUi.includes('Resumed your saved draft')) {
  fail('Public UI must resume Draft on Start')
} else ok('Public UI resumes Draft on Start')
if (!pubUi.includes("action:'submit'") || !pubUi.includes('surveyId')) {
  fail('Public Submit must send action submit + surveyId')
} else ok('Public Submit sends action submit + surveyId')
if (
  !pubUi.includes('Review the report') ||
  !pubUi.includes('reviewPublicReport') ||
  !pubUi.includes("action='report'") ||
  !pubUi.includes("SV_TAB==='final'")
) {
  fail('Public page 15 must have Review the report')
} else ok('Public page 15 has Review the report')
if (!ui.includes('Review the report') || !ui.includes('openClientReport')) {
  fail('HOD/Management page 15 must have Review the report')
} else ok('HOD/Management page 15 has Review the report')
if (
  !handlers.includes("action === 'report'") ||
  !handlers.includes('handlePeriodicalSurveyPublicReport')
) {
  fail('Public API must preview report without Submit (action report)')
} else ok('Public API has report preview (does not Submit)')
if (
  !pubUi.includes('generated automatically from your answers') ||
  !pubUi.includes('Tap <b>Next</b> to go to 14. Site Photos') ||
  !pubUi.includes('generatePublicReport') ||
  !pubUi.includes("payload.action='generate'") ||
  !pubUi.includes('page13Filled')
) {
  fail('Public page 13 must auto-generate and tell ops to tap Next')
} else ok('Public page 13 auto-generates; instruction says tap Next')
if (
  !handlers.includes("action === 'generate'") ||
  !handlers.includes('handlePeriodicalSurveyPublicGenerate')
) {
  fail('Public API must generate page 13 without Submit (action generate)')
} else ok('Public API has page 13 generate (does not Submit)')
if (!pubUi.includes('timeTaken')) {
  fail('Public thank-you must quote time taken')
} else ok('Public thank-you quotes time taken')
if (
  !handlers.includes('sendHdfcPublicThankYouNotify') ||
  !handlers.includes('Thank you — HDFC SSA submitted')
) {
  fail('Public submit must email+WhatsApp thank-you to Risk Analyst with CC Director + HOD')
} else ok('Public thank-you mail+WhatsApp to analyst, Director, HOD')
const misStore = fs.readFileSync(path.join(root, 'api/_lib/mis/store.ts'), 'utf8')
if (!handlers.includes('saveClientGeoFromAssessment') || !misStore.includes('geoLat')) {
  fail('Client master must store geoLat/geoLng from HDFC SSA')
} else ok('Client master can save HDFC SSA GPS')
if (!pubUi.includes('capturePublicGeo') || !pubUi.includes('navigator.geolocation') || !ui.includes('GPS:')) {
  fail('Public Start must capture GPS and list must show GPS')
} else ok('HDFC SSA captures GPS and shows on submitted list')
if (pubUi.includes('Will ask for location') || pubUi.includes('needed for HDFC India road map')) {
  fail('Public first page must not mention India road map / GPS plan')
} else ok('Public first page has no road-map wording')
if (
  !pubUi.includes('Ensure the <b>Start Assessment</b> button is only pressed upon arrival at the site') ||
  !pubUi.includes("The system logs the user's geolocation at the time of initiation") ||
  !pubUi.includes('When the permission prompt appears, select <b>Allow</b> to enable HDFC Branch location')
) {
  fail('Public Start must state: press Start only on arrival; geolocation logged; Allow for HDFC Branch location')
} else ok('Public Start states arrival-at-site + geolocation + Allow for HDFC Branch location')
if (pubUi.includes("Enter Risk Analyst (Your Name).")) {
  fail('Public Start must not show Enter Risk Analyst (Your Name). under the button')
} else ok('Public Start error copy is plain')
if (
  !pubUi.includes('m-btn-green m-btn-block') ||
  !ui.includes("m-btn-green\" style=\"min-width:200px;min-height:48px;font-size:15px\" onclick=\"addSurvey()\"") ||
  !ui.includes("m-btn-green\" style=\"min-width:200px;min-height:48px;font-size:15px\" onclick=\"addHdfcSurvey()\"")
) {
  fail('All Start Assessment buttons must be green')
} else ok('All Start Assessment buttons are green')
if (
  !handlers.includes('handlePeriodicalSurveyPublicSubmit') ||
  !handlers.includes('handlePeriodicalSurveyPublicClients') ||
  !handlers.includes("status: 'Completed'")
) {
  fail('Public submit must create Completed (Sent to HOD) surveys')
} else ok('Public submit creates Completed surveys')
if (
  !handlers.includes('handlePeriodicalSurveyPublicDraftSave') ||
  !handlers.includes('handlePeriodicalSurveyPublicDraftLoad') ||
  !handlers.includes("PUBLIC_HDFC_LINK") ||
  !handlers.includes("status: 'Draft'")
) {
  fail('Public handlers must Draft upsert + load (PUBLIC_HDFC_LINK)')
} else ok('Public handlers Draft upsert + load')
const pubApi = fs.readFileSync(path.join(root, 'api/mis/hdfc-survey-public.ts'), 'utf8')
if (
  !pubApi.includes('handlePeriodicalSurveyPublicSubmit') ||
  !pubApi.includes('hdfcPublicSurveyPageHtml')
) {
  fail('Public API must serve page + submit handler')
} else ok('Public API serves page + submit')
if (!pubApi.includes('handlePeriodicalSurveyPublicDraftLoad') || !pubApi.includes('draft')) {
  fail('Public API must load draft via ?draft=1')
} else ok('Public API loads draft via ?draft=1')

const pageProg = fs.readFileSync(path.join(root, 'api/_lib/mis/hdfc-page-progress.ts'), 'utf8')
if (
  !pageProg.includes('hdfcPagesProgress') ||
  !pageProg.includes('HDFC_PAGE_TOTAL = 15') ||
  !pageProg.includes('hdfcPagesIncompleteMessage') ||
  !pageProg.includes('agileControlNumber') ||
  !pageProg.includes('hdfcFaValidityOk')
) {
  fail('hdfc-page-progress must count all 15 pages, require page-10 Control Number, and require FA ID validity on page 3')
} else ok('15-page progress helper present')
if (
  !hdfcUi.includes('pickFaValidDate') ||
  !hdfcUi.includes('Pick date') ||
  !hdfcUi.includes('type="date"') ||
  !hdfcUi.includes('faValid_') ||
  !pubUi.includes('color-scheme:dark') ||
  !pubUi.includes('suiteDateInputInitScript') ||
  !pubUi.includes('SUITE_DATE_INPUT')
) {
  fail('Section 3 ID card validity must show a calendar / Pick date on SSA format')
} else ok('Section 3 ID card validity calendar is visible')
if (
  !hdfcUi.includes('hdfcCheckBox') ||
  !hdfcUi.includes('hdfcScoreStep') ||
  !hdfcUi.includes('paintHdfcChecklist') ||
  !hdfcUi.includes('renderHdfcChecklist') ||
  !pubUi.includes('renderHdfcChecklist') ||
  !ui.includes('renderHdfcChecklist')
) {
  fail('Section 12 score 0–5 must paint only the next serial (not rebuild the heading menu)')
} else ok('Section 12 score stays on the next serial number')
if (
  !hdfcUi.includes('harvestHdfcDom') ||
  !hdfcUi.includes('data-hdfc-key') ||
  !ui.includes('harvestHdfcDom') ||
  !ui.includes('SV_AUTO_AGAIN') ||
  !ui.includes('keepLocalHdfcEdit') ||
  !pubUi.includes('harvestHdfcDom') ||
  !pubUi.includes('PUB_LAST_SAVE_OK') ||
  !ui.includes('Stay on this page') ||
  !ui.includes('Incomplete — not submitted')
) {
  fail('Section 10 Save must harvest the screen, queue auto-save, and keep local answers')
} else ok('Save from section 10 stays on the page; draft is not submitted')
if (
  !hdfcUi.includes('hdfcProcessGuideHtml') ||
  !hdfcUi.includes('How to fill this page') ||
  !hdfcUi.includes('hdfcAllProcessGuideHtml') ||
  !hdfcUi.includes('Open — step-by-step for all 15 pages') ||
  !pubUi.includes('hdfcAllGuide') ||
  !pubUi.includes('hdfcProcessGuideHtml') ||
  !ui.includes('hdfcProcessGuideHtml')
) {
  fail('Each HDFC SSA heading must show How to fill this page (field staff process guide)')
} else ok('HDFC SSA process guide on every heading + start screen')
if (
  !ui.includes('Pages completed:') ||
  !hdfcUi.includes('hdfcPagesProgress') ||
  !pubUi.includes('hdfcPagesIncompleteMessage') ||
  !handlers.includes('hdfcPagesIncompleteMessage')
) {
  fail('Submitted list + Submit to HOD must show / enforce Pages completed 15 / 15')
} else ok('Submitted list shows Pages completed; Submit to HOD requires 15 / 15')

if (!handlers.includes('ssaDirectory') || !handlers.includes('buildSsaDirectory')) {
  fail('Boot must send HOD + operations directory for SSA dropdowns')
} else ok('SSA directory (HOD / operations) on boot')
const ssaDir = fs.readFileSync(path.join(root, 'api/_lib/mis/ssa-directory.ts'), 'utf8')
if (
  !ssaDir.includes('Prathap Kumar') ||
  !ssaDir.includes('vp.blr@agilegroup.co.in') ||
  !ssaDir.includes("branch: 'BANGALORE'") ||
  !ssaDir.includes("branch: 'KOCHI'")
) {
  fail('SSA forms must list Prathap Kumar (vp.blr@agilegroup.co.in) on Bangalore branch and Kochi branch')
} else ok('SSA Bangalore branch + Kochi branch HOD is Prathap Kumar')
if (
  !ssaDir.includes("branch: 'BHOPAL'") ||
  !ssaDir.includes("branch: 'CHENNAI'") ||
  !ssaDir.includes("branch: 'PUDUCHERRY'") ||
  !ssaDir.includes("branch: 'KAKINADA'") ||
  !ssaDir.includes("branch: 'NELLORE'") ||
  !ssaDir.includes("branch: 'TADA'") ||
  !ssaDir.includes("branch: 'TADIPATRI'") ||
  !ssaDir.includes("branch: 'TIRUPATI'") ||
  !ssaDir.includes("branch: 'VIJAYAWADA'") ||
  !ssaDir.includes("branch: 'SURAT'") ||
  !ssaDir.includes("branch: 'VISAKHAPATNAM'") ||
  !ssaDir.includes('Ahmad Salman') ||
  !ssaDir.includes('Col. Selvam') ||
  !ssaDir.includes('Siddharth') ||
  !ssaDir.includes('Sanjay Singh') ||
  !ssaDir.includes('Raghu Ram Raju')
) {
  fail('SSA must list one HOD row per branch (not a city group)')
} else ok('SSA lists one HOD per branch (Nellore ≠ Tada, Chennai ≠ Puducherry)')
if (
  !ssaDir.includes('isSsaAssessorBlocked') ||
  !ssaDir.includes('lokesh@agilegroup.co.in') ||
  !ssaDir.includes('director@agilegroup.co.in') ||
  !ssaDir.includes('control@agilegroup.co.in') ||
  !ssaDir.includes('it@agilegroup.co.in')
) {
  fail('SSA directory must block IT, Control, Director, Lokesh')
} else ok('SSA dropdown blocks IT / Control / Director / Lokesh')
if (
  !ssaDir.includes('rememberSsaBranchAssessor') ||
  !ssaDir.includes('vice president') ||
  !ssaDir.includes('operations manager') ||
  !handlers.includes('rememberSsaBranchAssessor')
) {
  fail('SSA must allow VP/AVP/RM/CGM/OM and save a typed name for the branch')
} else ok('SSA remembers typed names for the branch; VP/AVP/RM/CGM/OM allowed')
if (!pubUi.includes('pick branch first') || !pubUi.includes('saved for this branch')) {
  fail('Public SSA names must wait for Branch and save typed names for that branch')
} else ok('Public SSA names are branch-wise and can be saved')
if (!hdfcUi.includes('hdfcAssessorOnce') || !pubUi.includes('pubNamePick') || !pubUi.includes('pubEmailPick')) {
  fail('Assessor name / email must be dropdowns and asked once')
} else ok('Assessor asked once with HOD / operations dropdowns')
if (!pubUi.includes('id="pubSurveyDate"') || !pubUi.includes('type="date"')) {
  fail('Public Start must have Date of Survey calendar picker')
} else ok('Public Date of Survey is a calendar picker')
const closingBankHits = (hdfcUi.match(/Check list for closing Bank/g) || []).length
if (closingBankHits !== 1) fail('Check list for closing Bank must appear once (page 5 only), found '+closingBankHits)
else ok('Check list for closing Bank is not repeated')
if (hdfcUi.includes('Holiday openings — permission')) {
  fail('Holiday opening must not be asked again on page 5')
} else ok('Holiday opening is only on page 2')
if (!hdfcUi.includes('svRemoveSlotPhoto') || !pubUi.includes('Delete') || !ui.includes('svRemoveSlotPhoto')) {
  fail('Photo gallery must have Delete on public + both portals')
} else ok('Photo Delete on public + HOD + Management')
if (!pubUi.includes("svRemoveSlotPhoto('+si+',\\\\''+slot+'\\\\')")) {
  fail('Public photo Delete quotes must be escaped so the Branch list script can run')
} else ok('Public SSA script quotes keep the Branch list working')
if (!pubUi.includes('BRANCHES.forEach') || pubUi.indexOf('el(\'pubBranch\')') < 0) {
  fail('Public boot must fill Branch from the branch list')
} else ok('Public boot fills Branch')

const fmt = fs.readFileSync(path.join(root, 'api/_lib/mis/hdfc-ssa-format-pdf.ts'), 'utf8')
const publicApi = fs.readFileSync(path.join(root, 'api/mis/hdfc-survey-public.ts'), 'utf8')
if (
  !fmt.includes("section('1', 'Location & Identification'") ||
  !fmt.includes("section('15', 'Final Report with suggestions'") ||
  !fmt.includes('Risk check list') ||
  !fmt.includes('SURVEY_PARTS') ||
  !fmt.includes('ATM Guarding') ||
  !fmt.includes('Generator Register Maintained') ||
  !fmt.includes('Submit to HOD') ||
  !fmt.includes('Facility Attendants') ||
  !fmt.includes('Scientific Risk Analysis') ||
  !fmt.includes('Selfie (surveyor on site)') ||
  !fmt.includes('CONFIDENTIAL') ||
  !fmt.includes('Prepared for HDFC Bank') ||
  !fmt.includes('www.agilegroup.co.in') ||
  !fmt.includes('www.SecurityJob.co.in') ||
  !fmt.includes('www.AgileGroup-digital.co.in') ||
  !fmt.includes('SUITE_APP_FOOTER_LINE') ||
  !fmt.includes('External link:') ||
  !fmt.includes('/mis-hdfc-survey')
) {
  fail('HDFC SSA format PDF must include all 15 sections and opening-link questions')
} else ok('HDFC SSA 15-section format PDF present')
const footerSrc = fmt.slice(fmt.indexOf('<footer class="doc-footer">'))
if (footerSrc.includes('Uma Enclave') || footerSrc.includes('Banjara Hills') || footerSrc.includes('CORPORATE_OFFICE_ADDRESS_LINES')) {
  fail('HDFC SSA format PDF footer must not show Corporate Office address')
} else ok('HDFC SSA format PDF footer has no Corporate Office address')
if (!vercel.includes('/mis-hdfc-survey-format') || !publicApi.includes('hdfcSsaFormatHtml')) {
  fail('Public format PDF must be served at /mis-hdfc-survey-format without changing the ops link')
} else ok('Format PDF URL is separate from the live ops survey link')

const pubLink = fs.readFileSync(path.join(root, 'api/_lib/mis/public-external-link.ts'), 'utf8')
if (
  !pubLink.includes('listPublicExternalClients') ||
  !pubLink.includes('newPublicResumeCode') ||
  !pubLink.includes('sameOpsBranch') ||
  !pubLink.includes('skipRepair: true')
) {
  fail('Public external helper must list same-city units (Kochi) and issue a continue code')
} else ok('Public external helper lists same-city units + continue code')
if (
  !pubUi.includes('continuePublicByCode') ||
  !pubUi.includes('Continue on a computer') ||
  !pubUi.includes('keepPhotos') ||
  !pubUi.includes('Save draft') ||
  !handlers.includes('keepPhotos') ||
  !handlers.includes('findPublicHdfcDraftByCode') ||
  !handlers.includes('listPublicExternalClients') ||
  !handlers.includes('upsertPeriodicalSurvey') ||
  !handlers.includes('savePublicHdfcDraft') ||
  !handlers.includes('listPublicHdfcDraftsForBranch')
) {
  fail('Public HDFC SSA must auto-save, continue on computer, and Submit to HOD for every branch')
} else ok('Public HDFC SSA auto-save + computer continue + all-branch Submit to HOD')

{
  const stateMod = fs.readFileSync(path.join(root, 'api/_lib/mis/hdfc-ssa-state.ts'), 'utf8')
  const boardApi = fs.readFileSync(path.join(root, 'api/mis/hdfc-ssa-board.ts'), 'utf8')
  const boardStore = fs.readFileSync(path.join(root, 'api/_lib/mis/hdfc-ssa-board-store.ts'), 'utf8')
  const boardAi = fs.readFileSync(path.join(root, 'api/_lib/mis/hdfc-ssa-board-ai.ts'), 'utf8')
  const boardDash = fs.readFileSync(path.join(root, 'api/_lib/mis/hdfc-ssa-dashboard.ts'), 'utf8')
  if (
    !stateMod.includes('stateForMisBranch') ||
    !stateMod.includes('tadipatri') ||
    !stateMod.includes("needle === 'tada'") ||
    !stateMod.includes('publicOnly') ||
    !stateMod.includes('Andhra Pradesh')
  ) {
    fail('HDFC SSA board must group by state without mixing Tada into Tadipatri')
  } else ok('HDFC SSA state grouping keeps independent cities separate')
  if (
    !ui.includes('HDFC State Dashboard') ||
    !ui.includes('Build / Refresh AI pack') ||
    !ui.includes('Copy HDFC view link') ||
    !ui.includes('HOD does not send unit-by-unit as the HDFC delivery path') ||
    !ui.includes('openHdfcStateDashboard') ||
    !ui.includes('hdfcSsaBoardBoot')
  ) {
    fail('SSA HDFC panel must have State Dashboard + AI pack + view link (not a new left-menu item)')
  } else ok('SSA HDFC panel has State Dashboard / AI pack / view link')
  if (!ui.includes("SV_VIEW==='board'") || !ui.includes('pickBoardState')) {
    fail('Portal must open the visual State dashboard on the existing SSA HDFC panel')
  } else ok('Portal State dashboard view is on the HDFC panel')
  if (
    !handlers.includes('handleHdfcSsaBoardBoot') ||
    !handlers.includes('handleHdfcSsaBoardRefreshAi') ||
    !handlers.includes('handleHdfcSsaBoardLink') ||
    !handlers.includes('handleHdfcSsaBoardPublicBoot') ||
    !handlers.includes('Management builds the AI pack')
  ) {
    fail('Handlers must boot the board, refresh AI (Management only), and issue a view code')
  } else ok('HDFC SSA board handlers present (Management AI, HOD scoped)')
  if (
    !staffData.includes('hdfcSsaBoardBoot') ||
    !staffData.includes('hdfcSsaBoardLink') ||
    !admin.includes('hdfcSsaBoardRefreshAi') ||
    !admin.includes('handleHdfcSsaBoardRefreshAi')
  ) {
    fail('HOD + Management data APIs must wire the HDFC SSA board actions')
  } else ok('HOD + Management APIs wire HDFC SSA board')
  if (
    !vercel.includes('/mis-hdfc-ssa-board') ||
    !vercel.includes('/api/mis/hdfc-ssa-board') ||
    !boardApi.includes('hdfcSsaDashboardPageHtml') ||
    !boardApi.includes('handleHdfcSsaBoardPublicBoot')
  ) {
    fail('Public HDFC view must be /mis-hdfc-ssa-board (separate from the 15-page ops form)')
  } else ok('Public /mis-hdfc-ssa-board is separate from /mis-hdfc-survey')
  if (
    !boardStore.includes('mis:hdfc-ssa-board-view') ||
    !boardStore.includes('mis:hdfc-ssa-board-ai') ||
    !boardStore.includes('viewCodesMatch') ||
    !boardAi.includes('refreshHdfcSsaBoardAi') ||
    !boardAi.includes('generateSurveyAiReport') ||
    !boardDash.includes('Pick a State') ||
    !boardDash.includes('Go by City') ||
    !boardDash.includes('Go by Bank code') ||
    !boardDash.includes('Pick from map') ||
    !boardDash.includes('ssaIndiaMap') ||
    !boardDash.includes('political map') ||
    !boardDash.includes('pickBoardDistrict') ||
    !boardDash.includes('riskRate') ||
    !boardDash.includes('Late start (2FA Branch)') ||
    !boardDash.includes('Out of post') ||
    !boardDash.includes('Vacant post') ||
    !boardDash.includes('Deployment risk')
  ) {
    fail('Board must store view code + AI pack and jump State / City / Bank code with four risk bars')
  } else ok('Board has State / City / Bank code jump + four risk bars')
  const boardRisk = fs.readFileSync(path.join(root, 'api/_lib/mis/hdfc-ssa-board-risk.ts'), 'utf8')
  const boardGeo = fs.readFileSync(path.join(root, 'api/_lib/mis/hdfc-ssa-board-geo.ts'), 'utf8')
  const boardMap = fs.readFileSync(path.join(root, 'api/_lib/mis/hdfc-ssa-board-map.ts'), 'utf8')
  if (
    !boardGeo.includes('Tada') ||
    !boardGeo.includes('Tirupati') ||
    !boardGeo.includes('SPSR Nellore') ||
    !boardGeo.includes("city: 'Nellore'") ||
    !boardGeo.includes("city: 'Tadipatri'") ||
    !boardGeo.includes('attachSiteGeo') ||
    !boardRisk.includes('attachSiteGeo') ||
    !stateMod.includes('district') ||
    !stateMod.includes('lat:') ||
    !boardMap.includes('leaflet') ||
    !boardMap.includes('/maps/india-states.geojson') ||
    !boardMap.includes('pickBoardDistrict') ||
    !boardMap.includes('ssaIndiaMap') ||
    !ui.includes('ssaPaintBoard') ||
    !ui.includes('pickBoardDistrict')
  ) {
    fail('HDFC board must plot GPS on the India political map (State → District → City → Branch)')
  } else ok('India political map uses HDFC GPS; Tada is not Nellore')
  if (
    !boardRisk.includes('analyseHdfcAssessment') ||
    !boardRisk.includes('applyDutyAndRiskToBoard') ||
    !boardRisk.includes('fourOpsBars') ||
    !boardRisk.includes('Late start (2FA Branch)') ||
    !boardRisk.includes('Vacant post') ||
    !boardRisk.includes('Deployment risk') ||
    !boardRisk.includes('tada') ||
    !handlers.includes('assembleHdfcSsaBoard') ||
    !stateMod.includes('riskRate') ||
    !stateMod.includes('lateStart2fa') ||
    !stateMod.includes('vacantPosts') ||
    !stateMod.includes('bankCode')
  ) {
    fail('Board must show four bars: Deployment · Late start 2FA · Out of post · Vacant post')
  } else ok('Four risk bars + late start / vacant roll-up present')
  if (ui.includes("['HDFC State Dashboard'") || staff.includes("['HDFC State Dashboard'")) {
    fail('Do not add a new left-menu item for the HDFC State Dashboard')
  } else ok('No new left-menu item for the State dashboard')
}

if (failed) {
  console.error('\ncheck:special-survey FAILED\n')
  process.exit(1)
}
console.log('\ncheck:special-survey OK')
