#!/usr/bin/env node
/**
 * Guardrail: Agile Training must keep Track 1 (OJT) and Track 2 (Digital Learning)
 * after email PIN. Never ship a login that skips the hub, or a missing OJT app.
 *
 * Usage: node scripts/check-training-tracks.mjs
 *        node scripts/check-training-tracks.mjs --probe
 */

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const probe = process.argv.includes('--probe')
const BASE = process.env.HEALTH_CHECK_BASE_URL?.trim() || 'https://www.agilegroup-digital.co.in'
const errors = []

function read(rel) {
  const p = path.join(root, rel)
  if (!fs.existsSync(p)) {
    errors.push(`Missing ${rel}`)
    return ''
  }
  return fs.readFileSync(p, 'utf8')
}

const gate = read('api/training/gate.ts')
const hub = read('api/training/hub.ts')
const ojt = read('api/training/ojt.ts')
const ojtUi = read('api/_lib/training/ojt-ui.ts')
const labels = read('api/_lib/training/track-labels.ts')
const vercel = read('vercel.json')

if (gate && !/TRAINING_HUB\s*=\s*'\/training\/hub'/.test(gate) && !/targetUrl:\s*TRAINING_HUB/.test(gate)) {
  errors.push('api/training/gate.ts must send email PIN to /training/hub (Track 1 / Track 2 chooser)')
}
if (gate && /trainingTargetUrl\('management'\)/.test(gate) && /targetUrl:\s*trainingTargetUrl/.test(gate)) {
  errors.push('api/training/gate.ts must not dump Management login straight into the LMS')
}
if (hub && !/TRAINING_TRACK1_SHORT/.test(hub)) {
  errors.push('api/training/hub.ts must show Track 1 label')
}
if (hub && !/TRAINING_TRACK2_SHORT/.test(hub)) {
  errors.push('api/training/hub.ts must show Track 2 label')
}
if (labels && !/Track 1/.test(labels)) errors.push('track-labels.ts missing Track 1')
if (labels && !/Track 2/.test(labels)) errors.push('track-labels.ts missing Track 2')
if (ojt && !/ojtPageHtml/.test(ojt)) errors.push('api/training/ojt.ts must render the OJT app')
if (ojtUi && ojtUi.length < 50_000) {
  errors.push(`api/_lib/training/ojt-ui.ts is too small (${ojtUi.length} bytes) — full OJT app is missing`)
}
if (ojtUi && !/sClientEmail2/.test(ojtUi)) {
  errors.push('ojt-ui.ts must allow up to 3 client emails on the schedule (sClientEmail2)')
}
if (ojtUi && !/btnSaveAfterReview/.test(ojtUi)) {
  errors.push('ojt-ui.ts must Save after Review and return to the completion report (btnSaveAfterReview)')
}
if (ojtUi && !/ojtGalleryWidgetHtml/.test(ojtUi)) {
  errors.push('ojt-ui.ts must include the always-visible album dock (ojtGalleryWidgetHtml)')
}
if (ojtUi && !/for="ojtGalFile"/.test(ojtUi)) {
  errors.push('ojt-ui.ts Upload from gallery must point at ojtGalFile')
}
const galW = read('api/_lib/training/ojt-gallery-widget.ts')
if (galW && !/id="ojtGalFile"/.test(galW)) {
  errors.push('ojt-gallery-widget.ts must have a visible album file box (ojtGalFile)')
}
if (galW && /id="ojtGalFile"[^>]*accept=/.test(galW)) {
  errors.push('ojtGalFile must not set accept= (iPhone album photos are refused)')
}
if (galW && !/ojt-gal-del/.test(galW)) {
  errors.push('ojt-gallery-widget.ts must keep Delete on each photo')
}
if (ojtUi && !/function removeCompletionPhoto/.test(ojtUi)) {
  errors.push('ojt-ui.ts must keep Delete on gallery / camera photos (removeCompletionPhoto)')
}
if (ojtUi && !/data-rm-photo/.test(ojtUi)) {
  errors.push('ojt-ui.ts photo cards must keep a Delete button (data-rm-photo)')
}
if (ojtUi && !/completionMissingColumns/.test(ojtUi)) {
  errors.push('ojt-ui.ts must require all completion columns before Review')
}
if (ojtUi && !/window\.open/.test(ojtUi)) {
  errors.push('ojt-ui.ts must open completion Preview in a new window')
}
/** Nested quotes inside the page script break every menu — catch the logo helper pattern. */
if (ojtUi && /function brandLogoHtml\(\)\{[\s\S]{0,500}this\.src=\\'/.test(ojtUi)) {
  errors.push('ojt-ui.ts brandLogoHtml has broken quote escaping (breaks all Training menus)')
}
if (ojtUi && /font-weight:800">Choose a format</.test(ojtUi)) {
  errors.push('ojt-ui.ts must not show the “Choose a format” stub — open a real letter')
}
if (ojtUi && !/pendingFormatSessionId/.test(ojtUi)) {
  errors.push('ojt-ui.ts Preview format must keep pendingFormatSessionId so the session letter opens')
}
if (ojtUi && !/showScheduleSub\('format',\{sessionId:/.test(ojtUi)) {
  errors.push('ojt-ui.ts Preview format must open session intimation via showScheduleSub(..., {sessionId})')
}
if (ojtUi && /formatPreviewFrame[^>]*sandbox=/.test(ojtUi)) {
  errors.push('ojt-ui.ts format preview iframe must not use sandbox (causes blank preview)')
}
if (ojtUi && /In the link choose:/.test(ojtUi)) {
  errors.push('ojt-ui.ts intimation preview must not show “In the link choose…” — only Open confirmation link')
}
const mail = read('api/_lib/training/ojt-mail.ts')
if (mail && /In the link choose:/.test(mail)) {
  errors.push('ojt-mail.ts intimation must not show “In the link choose…” — only Open confirmation link')
}
const waMsg = read('api/_lib/training/ojt-wa-messages.ts')
if (waMsg && !/EOI DOJ DD\/MM\/YYYY/.test(waMsg)) {
  errors.push('ojt-wa-messages.ts must ask absentees to reply EOI DOJ DD/MM/YYYY')
}
if (waMsg && !/If you are ON DUTY/.test(waMsg)) {
  errors.push('ojt-wa-messages.ts must separate ON DUTY EOI vs absentee EOI DOJ')
}
if (waMsg && !/reply: ATTENDANCE|Reply with the word: ATTENDANCE|reply: ATTENDANCE/.test(waMsg)) {
  errors.push('ojt-wa-messages.ts must keep ATTENDANCE confirmation wording')
}
if (waMsg && !/buildTopicQuizQuestionWa/.test(waMsg)) {
  errors.push('ojt-wa-messages.ts must send topic Yes/No questions (buildTopicQuizQuestionWa)')
}
if (waMsg && !/Reply YES or NO/.test(waMsg)) {
  errors.push('ojt-wa-messages.ts must ask guards to reply YES or NO')
}
if (waMsg && !/Training schedule Intimation/.test(waMsg)) {
  errors.push('ojt-wa-messages.ts must keep Training schedule Intimation title')
}
if (waMsg && !/Attendance request/.test(waMsg)) {
  errors.push('ojt-wa-messages.ts must keep Attendance request title')
}
if (waMsg && !/Your marks:/.test(waMsg)) {
  errors.push('ojt-wa-messages.ts must keep Training marks wording')
}
const quiz = read('api/_lib/training/ojt-attendance-quiz.ts')
if (quiz && !/pickSessionYesNoQuestions/.test(quiz)) {
  errors.push('ojt-attendance-quiz.ts must pick 5 questions from session topics')
}
if (quiz && !/findTopicQuestionBank/.test(quiz)) {
  errors.push('ojt-attendance-quiz.ts must use the topic question bank')
}
const waReply = read('api/_lib/training/ojt-wa-reply.ts')
if (waReply && !/handleTrainingConfirmWaReply/.test(waReply)) {
  errors.push('ojt-wa-reply.ts must export handleTrainingConfirmWaReply')
}
if (waReply && !/parseYesNoReply/.test(waReply)) {
  errors.push('ojt-wa-reply.ts must collect YES/NO answers (parseYesNoReply)')
}
if (waReply && !/startTopicQuizForGuard/.test(waReply)) {
  errors.push('ojt-wa-reply.ts must start the 5 topic questions after attendance')
}
const waHook = read('api/training/whatsapp-webhook.ts')
if (!waHook || !/handleTrainingConfirmWaReply|processTrainingInbound/.test(waHook)) {
  errors.push('api/training/whatsapp-webhook.ts must run Training inbound replies')
}
const f2sHook = read('api/guards/fast2sms-webhook.ts')
if (!f2sHook || !/processTrainingInbound/.test(f2sHook)) {
  errors.push('api/guards/fast2sms-webhook.ts must run Training inbound first')
}
if (f2sHook && !/forwardUnmatched/.test(f2sHook)) {
  errors.push('api/guards/fast2sms-webhook.ts must keep optional Recruitment forward after Training')
}
if (mail && !/function ojtSecurityObsRecipients/.test(mail)) {
  errors.push('ojt-mail.ts must keep ojtSecurityObsRecipients (HOD + Training Staff + Director)')
}
if (mail && /function ojtSecurityObsRecipients[\s\S]{0,600}clientEmail/.test(mail)) {
  errors.push('ojt-mail.ts Security Observations must never add the client email')
}
const glPage = read('api/_lib/training/ojt-guards-link-page.ts')
if (glPage && !/EOI — I will attend/.test(glPage)) {
  errors.push('guards-link page must use EOI / ATTENDANCE process (same as WhatsApp)')
}
if (glPage && /On duty \(working now\)/.test(glPage)) {
  errors.push('guards-link page must not use the old 4-status duty grid')
}
if (ojtUi && !/btnConfirmOpenLink/.test(ojtUi)) {
  errors.push('ojt-ui.ts must offer Open confirmation link button after Preview')
}
if (ojtUi && !/btnConfirmLoadUnits/.test(ojtUi)) {
  errors.push('ojt-ui.ts must Show client units first (btnConfirmLoadUnits)')
}
if (ojtUi && !/btnConfirmLoadGuards/.test(ojtUi)) {
  errors.push('ojt-ui.ts must Load guards for selected units (btnConfirmLoadGuards)')
}
if (ojtUi && !/Client-wise units/.test(ojtUi)) {
  errors.push('ojt-ui.ts must label Client-wise units (locations)')
}
if (ojtUi && !/Send WhatsApp intimation to all Guards/.test(ojtUi)) {
  errors.push('ojt-ui.ts must label Send WhatsApp intimation to all Guards')
}
if (ojtUi && !/Attendance request WhatsApp to all responded/.test(ojtUi)) {
  errors.push('ojt-ui.ts must have Attendance request WhatsApp to all responded')
}
if (ojtUi && !/btnConfirmSendQuiz/.test(ojtUi)) {
  errors.push('ojt-ui.ts must have Send 5 questions to attended (btnConfirmSendQuiz)')
}
if (ojtUi && !/Send 5 questions to attended/.test(ojtUi)) {
  errors.push('ojt-ui.ts must label Send 5 questions to attended')
}
if (ojtUi && !/CC Training Staff and Director/.test(ojtUi)) {
  errors.push('ojt-ui.ts Security Observations must go to Branch HOD, Training Staff, Director')
}
if (ojtUi && !/btnConfirmDeselectAll/.test(ojtUi)) {
  errors.push('ojt-ui.ts must have Deselect all guards (btnConfirmDeselectAll)')
}
if (ojtUi && !/Guards by unit/.test(ojtUi)) {
  errors.push('ojt-ui.ts must group guards by unit so KRC buildings are clear')
}
if (ojtUi && !/Select for Training/.test(ojtUi)) {
  errors.push('ojt-ui.ts guards table must include Select for Training column')
}
if (ojtUi && !/listTrainingGuards/.test(ojtUi)) {
  errors.push('ojt-ui.ts must call listTrainingGuards')
}
if (ojtUi && !/listTrainingUnits/.test(ojtUi)) {
  errors.push('ojt-ui.ts must call listTrainingUnits before guards')
}
if (ojtUi && !/Branch clients list is never changed/.test(ojtUi)) {
  errors.push('ojt-ui.ts confirmAttend must state Branch clients list is never changed')
}
const guardScope = read('api/_lib/training/ojt-guard-scope.ts')
if (!guardScope) {
  errors.push('ojt-guard-scope.ts missing — Training invite scope')
} else {
  if (!/Never create \/ edit \/ move Branch clients/.test(guardScope)) {
    errors.push('ojt-guard-scope.ts must keep the hard rule: never edit Branch clients')
  }
  if (!/listGuardsGroupedByUnit/.test(guardScope)) {
    errors.push('ojt-guard-scope.ts must group guards unit-wise (listGuardsGroupedByUnit)')
  }
  if (!/isKrcFamily/.test(guardScope)) {
    errors.push('ojt-guard-scope.ts must recognise KRC / K Raheja family units')
  }
  if (!/guardMatchesTrainingInvite/.test(guardScope)) {
    errors.push('ojt-guard-scope.ts must export guardMatchesTrainingInvite')
  }
}
const waSend = read('api/_lib/training/ojt-guards-wa-send.ts')
if (waSend && !/ojt-guard-scope/.test(waSend)) {
  errors.push('ojt-guards-wa-send.ts must use ojt-guard-scope for guard lists')
}
if (waSend && !/sendTopicQuizToAttended/.test(waSend)) {
  errors.push('ojt-guards-wa-send.ts must send 5 questions to attended (sendTopicQuizToAttended)')
}
const ojtData = read('api/training/ojt-data.ts')
if (ojtData && !/sendTopicQuizWa/.test(ojtData)) {
  errors.push('ojt-data.ts must expose sendTopicQuizWa after attendance list')
}
if (ojtData && !/listTrainingUnits/.test(ojtData)) {
  errors.push('ojt-data.ts must expose listTrainingUnits (units before guards)')
}
if (ojtData && !/listTrainingGuards/.test(ojtData)) {
  errors.push('ojt-data.ts must expose listTrainingGuards')
}
if (ojtData && !/saveTrainingInviteUnits/.test(ojtData)) {
  errors.push('ojt-data.ts must expose saveTrainingInviteUnits (Training session only)')
}
if (ojtUi && !/addTrainingGuardRow/.test(ojtUi)) {
  errors.push('ojt-ui.ts must offer Add guard below the list (addTrainingGuardRow)')
}
if (ojtUi && !/Add guard to list/.test(ojtUi)) {
  errors.push('ojt-ui.ts must show Add guard to list below the guards table')
}
if (ojtData && !/addTrainingGuardRow/.test(ojtData)) {
  errors.push('ojt-data.ts must expose addTrainingGuardRow (Training list only)')
}
const store = read('api/_lib/training/ojt-store.ts')
if (store && !/trainingInviteUnits/.test(store)) {
  errors.push('ojt-store.ts must keep trainingInviteUnits on the session (not on Branch clients)')
}
if (store && !/ojtClientEmailsFromSession/.test(store)) {
  errors.push('ojt-store.ts must collect up to 3 client emails (ojtClientEmailsFromSession)')
}
if (store && !/completionReportMissingColumns/.test(store)) {
  errors.push('ojt-store.ts must list missing completion columns before send')
}
const brand = read('api/_lib/training/training-brand.ts')
if (brand && !/TRAINING_GOOGLE_REVIEW_URL/.test(brand)) {
  errors.push('training-brand.ts must keep TRAINING_GOOGLE_REVIEW_URL for Highly Beneficial feedback')
}
if (brand && !/agile-logo-clear\.png/.test(brand)) {
  errors.push('training-brand.ts must use the clear Agile logo (no white plate)')
}
const fbPage = read('api/_lib/training/ojt-client-feedback-page.ts')
if (fbPage && !/Want to give Google review/.test(fbPage)) {
  errors.push('client feedback page must ask “Want to give Google review” after Highly Beneficial')
}
const clearLogo = path.join(root, 'public/agile-logo-clear.png')
if (!fs.existsSync(clearLogo)) {
  errors.push('public/agile-logo-clear.png is missing — completion preview logo will be blank')
}
if (vercel && !/"source"\s*:\s*"\/training\/ojt"/.test(vercel)) {
  errors.push('vercel.json missing /training/ojt rewrite')
}
if (vercel && !/"source"\s*:\s*"\/training\/hub"/.test(vercel)) {
  errors.push('vercel.json missing /training/hub rewrite')
}

const td = read('api/_lib/training/ojt-training-dept.ts')
if (td && !/TRAINING_DEPT_COVERED_NAMES/.test(td)) {
  errors.push('ojt-training-dept.ts must list Hyd-A / Hyd-B / Hi-Tech covered branches')
}
if (td && !/filterClientsForTrainingDept|loadTrainingDeptClientPicks/.test(td)) {
  errors.push('ojt-training-dept.ts must load Training Department client picks from Hyd books')
}
if (td && !/CLIENT_BOOK_FREEZE_DATE/.test(td)) {
  errors.push('ojt-training-dept.ts must load Training clients from 14-08-2026 Daily MIS (CLIENT_BOOK_FREEZE_DATE)')
}
if (td && !/getReport/.test(td)) {
  errors.push('ojt-training-dept.ts must read freeze-date getReport for Hyd-A / Hyd-B / Hi-Tech')
}
if (td && !/filterClientsForTrainingDept/.test(td)) {
  errors.push('ojt-training-dept.ts must keep filterClientsForTrainingDept for Hyd books')
}
if (td && !/TRAINING_DEPT_EXTRA_CLIENTS/.test(td)) {
  errors.push('ojt-training-dept.ts must keep TRAINING_DEPT_EXTRA_CLIENTS for Training-only adds')
}
if (td && !/Capitaland/.test(td)) {
  errors.push('Training Department extras must include Capitaland')
}
if (td && !/Kondapur/.test(td)) {
  errors.push('Training Department extras must include Kondapur for Capitaland')
}
if (td && !/appendTrainingDeptExtraPicks/.test(td)) {
  errors.push('ojt-training-dept.ts must append extras without rewriting other client picks')
}
if (td && !/Never written to Master Directory|FROZEN 23 Aug 2026/.test(td)) {
  errors.push('Training extras must stay frozen off Master Directory / other branch books')
}
const extraIds = td ? td.match(/id:\s*'ojt-extra-[^']+'/g) || [] : []
if (extraIds.length !== 1 || !extraIds[0].includes('capitaland-kondapur')) {
  errors.push('Training Department extras are frozen — keep only Capitaland Kondapur')
}
if (!td || !/Hyderabad-A/.test(td) || !/Hyderabad-B/.test(td) || !/Hi-Tech City/.test(td)) {
  errors.push('ojt-training-dept.ts must cover Hyd-A / Hyd-B / Hi-Tech')
}
if (ojtUi && !/Hyderabad-A · Hyderabad-B · Hi-Tech City/.test(ojtUi)) {
  errors.push('ojt-ui.ts Make schedule must say clients come from Hyd-A / Hyd-B / Hi-Tech')
}
if (ojtUi && !/loadTrainingDeptClientPicks|clientScope.*training-dept|isTrainingDeptScope/.test(ojtUi)) {
  errors.push('ojt-ui.ts must use Training Department client scope for the schedule picker')
}
if (ojtUi && !/id="sVehicleReq"/.test(ojtUi)) {
  errors.push('ojt-ui.ts Add schedule must keep Ask Control for a vehicle (sVehicleReq)')
}
if (ojtUi && !/Ask Control for a vehicle/.test(ojtUi)) {
  errors.push('ojt-ui.ts must keep the Ask Control for a vehicle wording')
}
const vehMail = read('api/_lib/training/ojt-vehicle-mail.ts')
if (!vehMail) {
  errors.push('missing api/_lib/training/ojt-vehicle-mail.ts')
} else if (!/sendTrainingVehicleAskMail/.test(vehMail) || !/sendTrainingVehicleConfirmedMail/.test(vehMail)) {
  errors.push('ojt-vehicle-mail.ts must mail Control on ask and trainer on confirm')
}
if (ojtData && !/kind:\s*'training'/.test(ojtData)) {
  errors.push('ojt-data.ts saveSession must copy vehicle ask to Control as kind training')
}
if (store && !/vehicleRequired: boolean/.test(store)) {
  errors.push('ojt-store.ts must keep optional vehicleRequired on the session (additive only)')
}
if (mail && /<th[^>]*>Vehicle/.test(mail)) {
  errors.push('ojt-mail.ts monthly schedule sheet must not add a Vehicle column')
}
const ctrlConsole = read('api/_lib/control/console.ts')
if (ctrlConsole && !/misSourceKind==='training'/.test(ctrlConsole)) {
  errors.push('Control console must accept Training vehicle cases')
}

const faPage = read('api/_lib/training/fa-page.ts')
const faPub = read('api/training/fa.ts')
const faData = read('api/training/fa-data.ts')
const faRec = read('api/_lib/training/fa-records-page.ts')
const faRecApi = read('api/training/fa-records-data.ts')
const faStore = read('api/_lib/training/fa-store.ts')
const faMail = read('api/_lib/training/fa-mail.ts')
if (!faPage || !faPub || !faData || !faRec || !faRecApi || !faStore || !faMail) {
  errors.push('Facility Attendant Training files are missing (fa-page / fa / fa-data / fa-records / store / mail)')
}
if (faPage && /trainingRequireLogin/.test(faPage)) {
  errors.push('FA public page must not require Training PIN login')
}
if (faPage && !/What you must do|doRight/.test(faPage)) {
  errors.push('FA lessons must show What you must do')
}
if (faPage && !/r\.example|Example\./.test(faPage)) {
  errors.push('FA lessons must show an Example on each rule')
}
if (faPage && !/speakChunks|talkRate|forSpeech|talkGap|talkShape/.test(faPage)) {
  errors.push('FA Listen must speak with natural gaps and modulation')
}
if (faPage && /forSpeech[\s\S]{0,400}replace\(\/\\s/.test(faPage)) {
  errors.push('FA Listen forSpeech must not use \\s regex inside the PAGE template (it breaks Listen)')
}
if (faPage && !/Do not be a victim of crime|victimLine/.test(faPage)) {
  errors.push('FA punishment board must say Do not be a victim of crime')
}
if (faPage && /position:fixed/.test(faPage) && /#nav/.test(faPage)) {
  errors.push('FA Back / Start buttons must sit above the footer, not fixed over it')
}
if (faData && !/FA_CORRECT/.test(faData)) {
  errors.push('fa-data.ts must check the three answers on the server (FA_CORRECT)')
}
if (faMail && !/getHodEmailsForBranch/.test(faMail)) {
  errors.push('FA acknowledgement mail must go To Branch HOD')
}
if (faMail && !/sridhar\.m@agilegroup\.co\.in|SRIDHAR_M_CC_EMAIL/.test(faMail)) {
  errors.push('FA acknowledgement mail must copy Sridhar')
}
const faWa = read('api/_lib/training/fa-wa.ts')
if (!faWa || !/sendFaAckWhatsApp/.test(faWa)) {
  errors.push('FA submit must WhatsApp the Facility Attendant and Branch HOD')
}
if (faData && !/sendFaAckWhatsApp/.test(faData)) {
  errors.push('fa-data.ts must send WhatsApp on submit (sendFaAckWhatsApp)')
}
if (faRec && !/All Branches|suiteMgmtBranchOptionsHtml/.test(faRec)) {
  errors.push('FA records Management must offer All Branches')
}
if (faRecApi && !/isMgmtAllBranches/.test(faRecApi)) {
  errors.push('fa-records-data.ts must support All Branches for Management')
}
if (ojtUi && !/href="\/training\/fa-records"/.test(ojtUi)) {
  errors.push('ojt-ui.ts must keep Facility Attendant Training on Staff and Management menus')
}
if (hub && /Track 3/.test(hub)) {
  errors.push('training hub must stay Track 1 + Track 2 only (no Track 3 card)')
}
if (vercel && !/"source"\s*:\s*"\/training\/fa"/.test(vercel)) {
  errors.push('vercel.json missing /training/fa rewrite')
}
if (vercel && !/"source"\s*:\s*"\/training\/fa-records"/.test(vercel)) {
  errors.push('vercel.json missing /training/fa-records rewrite')
}
const faAdvPage = read('api/_lib/training/fa-advisory-page.ts')
const faAdvPub = read('api/training/fa-advisory.ts')
const faAdvData = read('api/training/fa-advisory-data.ts')
const faAdvStore = read('api/_lib/training/fa-advisory-store.ts')
const faAdvMail = read('api/_lib/training/fa-advisory-mail.ts')
const faAdvRoster = read('api/_lib/training/fa-advisory-roster.ts')
const faAdvWa = read('api/_lib/training/fa-advisory-wa.ts')
const faAdvI18n = read('api/_lib/training/fa-advisory-i18n.ts')
if (!faAdvPage || !faAdvPub || !faAdvData || !faAdvStore || !faAdvMail || !faAdvRoster) {
  errors.push('HDFC FA advisory files are missing (page / public / data / store / mail / roster)')
}
if (faAdvPage && /trainingRequireLogin/.test(faAdvPage)) {
  errors.push('FA advisory public page must not require Training PIN login')
}
if (faAdvPage && !/quizOk|data-ans|3\/3/.test(faAdvPage)) {
  errors.push('FA advisory public page must collect 3 quiz answers before acknowledgement')
}
if (faAdvPage && !/poster-hero|item p0|qbox q0/.test(faAdvPage)) {
  errors.push('FA advisory poster must keep the hero band, numbered rule cards, and quiz cards')
}
if (faAdvPage && !/adv-series|issue-bar|hdfc-kicker/.test(faAdvPage)) {
  errors.push('FA advisory must stay a standing HDFC strategic-client series (dated masthead)')
}
if (faAdvPage && !/kicker-row|Control Mobile - \+91 9248707070/.test(faAdvPage)) {
  errors.push('FA advisory must centre the HDFC Strategic Client kicker and show Control Mobile below the header')
}
if (faAdvI18n && !/Integrity at Work'|All Facility Attendants working at HDFC Bank/.test(faAdvI18n)) {
  errors.push('FA advisory English title/intro must use the locked Integrity at Work wording')
}
if (faAdvI18n && !/Open Infographic/.test(faAdvI18n)) {
  errors.push('FA advisory English button must say Open Infographic')
}
if (faAdvI18n && !/I have completed the Integrity at Work training/.test(faAdvI18n)) {
  errors.push('FA advisory must use the Integrity at Work undertaking')
}
if (faAdvI18n && !/\['no', 'no', 'no'\]/.test(faAdvI18n)) {
  errors.push('FA advisory quiz key must be 3 questions, all No')
}
if (faAdvPage && /5\/5/.test(faAdvPage)) {
  errors.push('FA advisory must not keep the old 5/5 quiz')
}
if (faAdvPage && !/it\.example/.test(faAdvPage)) {
  errors.push('FA advisory poster must show an Example on each of the 3 points')
}
if (faAdvI18n && /r1\.example \|\| EN_ADV\.itemsP\[0\]\.example/.test(faAdvI18n)) {
  errors.push('FA advisory must not put English examples on other languages')
}
{
  const nativePack = read('api/_lib/training/fa-advisory-native.ts')
  if (!nativePack || !/NATIVE_PACK/.test(nativePack)) {
    errors.push('FA advisory native pack is missing')
  } else {
    for (const lang of ['te', 'ta', 'kn', 'ml', 'mr', 'as', 'gu', 'bn', 'pa', 'or']) {
      if (!new RegExp('(?:^|\\n)\\s+' + lang + ':').test(nativePack)) {
        errors.push('FA advisory native pack missing language ' + lang)
      }
    }
    if (nativePack.includes('\uFFFD')) {
      errors.push('FA advisory native pack has broken letters')
    }
  }
}
if (faAdvPage && !/sameLang|exampleWord/.test(faAdvPage)) {
  errors.push('FA advisory Listen must use the same-language voice and native Example label')
}
if (faAdvPage && /H D F C/.test(faAdvPage)) {
  errors.push('FA advisory Listen must not spell HDFC as letters')
}
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fa-js-'))
  for (const [rel, label] of [
    ['api/_lib/training/fa-advisory-page.ts', 'FA advisory page script'],
    ['api/_lib/training/fa-page.ts', 'FA lesson page script'],
  ]) {
    const src = read(rel)
    const m = src.match(/<script>([\s\S]*?)<\/script>/)
    if (!m) {
      errors.push(label + ' is missing')
      continue
    }
    const js = m[1].replace(/\$\{[^}]+\}/g, 'X')
    const tmp = path.join(dir, label.replace(/\s+/g, '-') + '.js')
    fs.writeFileSync(tmp, js)
    const chk = spawnSync('node', ['--check', tmp], { encoding: 'utf8' })
    if (chk.status !== 0) errors.push(label + ' has a JavaScript error')
  }
}
if (faAdvPage && !/btnListenPts|listenPoints|talkRate/.test(faAdvPage)) {
  errors.push('FA advisory must let the Facility Attendant listen to the 3 points')
}
if (faAdvPage && !/info-btn|infoOpen|fa-integrity-infographic/.test(faAdvPage)) {
  errors.push('FA advisory must keep an Open Infographic button after consequences')
}
if (faAdvPage && !/infoView|infoShare|infoDl/.test(faAdvPage)) {
  errors.push('FA advisory must open the picture first, then allow Share and Download')
}
if (!fs.existsSync(path.join(root, 'public/fa-integrity-infographic.jpg'))) {
  errors.push('public/fa-integrity-infographic.jpg is missing')
}
{
  const headAt = faAdvPage.indexOf('id="pageHead"')
  const langAt = faAdvPage.indexOf('class="langbar"')
  if (headAt < 0 || langAt < 0 || headAt > langAt) {
    errors.push('FA advisory header (logo / HDFC series) must sit above the language picker')
  }
}
if (faAdvI18n && !/faAdvIssueStamp|Strategic Client|Compliance Advisory Series/.test(faAdvI18n)) {
  errors.push('FA advisory must carry the HDFC strategic-client series date stamp')
}
if (faAdvData && !/advQuizAnswersOk|ADV_QUIZ_CORRECT/.test(faAdvData)) {
  errors.push('fa-advisory-data.ts must require the 3 correct quiz answers on the server')
}
if (faAdvMail && !/Sample quiz|HDFC Admin \/ RSO|Q1/.test(faAdvMail)) {
  errors.push('FA advisory client letter must include sample quiz, Admin/RSO label, and Q1–Q3')
}
if (faAdvWa && !/q\.set\('m'|m=/.test(faAdvWa)) {
  errors.push('FA advisory WhatsApp must include the quiz/ack link with mobile prefill')
}
if (faRec && !/Send WhatsApp to all HDFC FAs|OM Review|HOD Approve|Send report link to HDFC/.test(faRec)) {
  errors.push('FA records must WhatsApp FAs, then OM Review → HOD Approve → Send report link to HDFC')
}
if (faRec && !/Save list|HDFC Admin \/ RSO|Q1/.test(faRec)) {
  errors.push('FA records must Save the collected phone list and show Q1–Q3 / Admin/RSO send')
}
if (faRec && !/Strategic Client|Standing send/.test(faRec)) {
  errors.push('FA records must frame the advisory as a standing HDFC strategic-client series')
}
if (faRec && !/Common advisory link|not Client Door/.test(faRec)) {
  errors.push('FA records must keep the common FA advisory link and send from Training, not Client Door')
}
if (faRecApi && !/packReviewOm|packApproveHod|hdfcSendReport|advisorySendWa/.test(faRecApi)) {
  errors.push('fa-records-data.ts must OM-review, HOD-approve, send the HDFC report link, and WhatsApp FAs')
}
const faHdfcPack = read('api/_lib/training/fa-hdfc-pack.ts')
const faHdfcReport = read('api/_lib/training/fa-hdfc-report.ts')
const faHdfcPub = read('api/training/fa-hdfc-report.ts')
if (!faHdfcPack || !faHdfcReport || !faHdfcPub) {
  errors.push('HDFC Training report pack / page / public handler are missing')
}
if (faHdfcPub && /trainingRequireLogin|verifyAppSession/.test(faHdfcPub)) {
  errors.push('HDFC Training report link must be public (no Training PIN)')
}
if (faHdfcReport && !/Open Infographic|Advisory quiz results|Training completion/.test(faHdfcReport)) {
  errors.push('HDFC Training report must show open quiz results, training acknowledgements, and Open Infographic')
}
if (vercel && !/"source"\s*:\s*"\/training\/fa-hdfc-report"/.test(vercel)) {
  errors.push('vercel.json missing /training/fa-hdfc-report rewrite')
}
if (faRecApi && !/advisorySaveRoster|advisoryLoadRoster/.test(faRecApi)) {
  errors.push('fa-records-data.ts must save and load the advisory phone list')
}
if (faRecApi && !/Pick one branch first/.test(faRecApi)) {
  errors.push('Management must not save the advisory phone list under All Branches')
}
if (vercel && !/"source"\s*:\s*"\/training\/fa-advisory"/.test(vercel)) {
  errors.push('vercel.json missing /training/fa-advisory rewrite')
}
if (faAdvI18n && /fromFaChrome/.test(faAdvI18n)) {
  errors.push('FA advisory must not fall back to the English poster for other languages')
}
if (faAdvI18n && !/langAdvFromTraining/.test(faAdvI18n)) {
  errors.push('FA advisory must show the full poster and 3 questions in every language')
}

if (probe) {
  const checks = [
    ['/training/hub', /Track 1|On Site Tactical/i],
    ['/training/ojt', /On Site Tactical Training|Training schedule|Make Schedule/i],
    ['/training/fa', /Facility Attendant|HDFC Bank Safety|Choose your language/i],
    ['/training/fa-advisory', /HDFC Bank Compliance Advisory|Choose your language|Facility Attendant/i],
  ]
  for (const [route, re] of checks) {
    try {
      const res = await fetch(`${BASE}${route}`, { redirect: 'follow' })
      const text = await res.text()
      if (res.status === 404 || /page could not be found/i.test(text)) {
        errors.push(`LIVE ${route} is 404 — Track app missing on production`)
      } else if (!re.test(text)) {
        errors.push(`LIVE ${route} did not contain expected Track copy`)
      }
    } catch (err) {
      errors.push(`LIVE ${route} probe failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
}

if (errors.length) {
  console.error('check-training-tracks FAILED:')
  for (const e of errors) console.error(' -', e)
  process.exit(1)
}
console.log('check-training-tracks OK — Track 1 OJT + Track 2 hub present')
