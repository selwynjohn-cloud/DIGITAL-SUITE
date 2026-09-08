#!/usr/bin/env node
/**
 * Lock: Agile Live phone door — essential guard/staff only, no suite copies.
 *
 *   npm run check:agile-live
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
  const p = path.join(root, rel)
  if (!fs.existsSync(p)) {
    fail(`missing ${rel}`)
    return ''
  }
  return fs.readFileSync(p, 'utf8')
}

const files = {
  types: read('api/_lib/agile-live/types.ts'),
  duty: read('api/_lib/agile-live/duty-window.ts'),
  mod: read('api/_lib/agile-live/moderation.ts'),
  store: read('api/_lib/agile-live/store.ts'),
  guard: read('api/_lib/agile-live/guard-page.ts'),
  staff: read('api/_lib/agile-live/staff-page.ts'),
  i18n: read('api/_lib/agile-live/i18n.ts'),
  i18nMajor: read('api/_lib/agile-live/i18n-major.ts'),
  app: read('api/live/app.ts'),
  data: read('api/live/data.ts'),
  media: read('api/_lib/agile-live/media.ts'),
  chatUi: read('api/_lib/agile-live/chat-ui.ts'),
  shell: read('api/_lib/agile-live/shell.ts'),
  post: read('api/_lib/agile-live/duty-post.ts'),
  week: read('api/_lib/agile-live/weekly-roster.ts'),
  wage: read('api/_lib/agile-live/wage-slip.ts'),
  mail: read('api/_lib/agile-live/exception-mail.ts'),
  vercel: read('vercel.json'),
  apps: read('src/data/apps.ts'),
  liveRule: read('.cursor/rules/suite-agile-live.mdc'),
}

if (files.types.includes("LIVE_APP_NAME = 'Agile Live'") && files.types.includes('REPORT_EARLY_MIN = 30')) {
  ok('name is Agile Live · report 30 minutes early')
} else fail('types must lock Agile Live and 30-minute report')

if (!files.types.includes("LIVE_DEMO_ID = 'LIVEDEMO'") || !files.types.includes("LIVE_DEMO_MOBILE = '9000000001'") || !files.data.includes('liveDemoGuard')) {
  fail('dummy phone login LIVEDEMO / 9000000001 must stay')
} else ok('dummy Guard ID LIVEDEMO is allowed')

for (const needle of ['Start Duty', 'End Duty']) {
  if (!files.guard.includes(needle)) fail(`phone missing: ${needle}`)
}
if (files.guard.includes('id="btnLate"') || files.guard.includes('id="btnOutPost"')) {
  fail('phone must not have Late Start or Out of Post buttons')
} else if (
  !files.guard.includes('id="btnInDuty"') ||
  !files.guard.includes('id="btnOutDuty"') ||
  files.guard.includes("if(act && can) doDuty") ||
  files.guard.includes('placeholder="Search"')
) {
  fail('first page must keep Start Duty and End Duty; calendar must not start duty; no phone search')
} else ok('Start / End Duty on first page · calendar is view only')
if (
  !files.chatUi.includes('Type a message') ||
  !files.guard.includes('liveComposerInnerHtml') ||
  !files.guard.includes('chat stays open')
) {
  fail('guard chat must stay open like WhatsApp after sign-in')
} else ok('guard chat stays open after register')

if (
  !files.media.includes('.mp4') ||
  !files.media.includes('.mp3') ||
  !files.media.includes('.pdf') ||
  !files.media.includes('.docx') ||
  !files.media.includes('.xlsx') ||
  !files.media.includes('.pptx')
) {
  fail('group chat must allow image, Word, PDF, Excel, PowerPoint, MP3, MP4')
} else ok('group chat allows image / Word / PDF / Excel / PPT / MP3 / MP4')
if (
  !files.chatUi.includes('btnAttach') ||
  !files.guard.includes('liveComposerInnerHtml') ||
  !files.staff.includes('liveComposerInnerHtml')
) {
  fail('guard and staff must have attach (+)')
} else ok('attach button on guard and staff chat')

if (!files.mod.includes('strike') || !files.mod.includes('LIVE_CHAT_BLOCKED')) {
  fail('moderation must block strike / unlawful chat')
} else ok('strike / unlawful chat filter present')

if (
  !files.mod.includes('LIVE_CHAT_RULE_MGMT') ||
  !files.mod.includes('sent to your Management') ||
  !files.mod.includes('Union') ||
  !files.mod.includes('Association') ||
  !files.mod.includes("don't go for duty")
) {
  fail('Management chat rule must name Union, Association, and do not go for duty')
} else ok('Management company-duty chat rule present')

if (!files.staff.includes('toMobile') || !files.staff.includes('btnFindMob')) {
  fail('Staff/Management must offer a mobile field when sending a message')
} else ok('Staff/Management can send to one mobile')

if (!files.data.includes('lookupMobile') || !files.data.includes('filterLiveChatForGuard') || !files.store.includes('toMobile')) {
  fail('API must look up mobile and hide other-guard DMs from the guard phone')
} else ok('mobile lookup + guard-only DMs')

if (
  files.data.includes('This mobile is not in the Master Directory') ||
  !files.data.includes('saveMobile') ||
  !files.staff.includes('btnAddMob') ||
  !files.store.includes('live:extra-mobiles:v1')
) {
  fail('Director / Staff mobiles must be addable — do not require Master Directory')
} else ok('extra mobiles (Director / Staff) can be added')

if (!files.staff.includes('suiteMgmtBranchOptionsHtml') || !files.staff.includes('All Branches')) {
  fail('Management Agile Live must offer All Branches')
} else ok('Management has All Branches')

if (
  files.staff.includes('Hyderabad trial') ||
  files.guard.includes('Hyderabad trial') ||
  files.staff.includes('Report 30 minutes early ·')
) {
  fail('header must not show Report 30 minutes early / Hyderabad trial')
} else ok('trial line removed from header')

if (
  !files.shell.includes('agile-logo') ||
  !files.staff.includes('liveOpenHeadHtml') ||
  !files.guard.includes('liveOpenHeadHtml') ||
  !files.staff.includes('livePersonHeadHtml') ||
  !files.guard.includes('livePersonHeadHtml') ||
  !files.staff.includes('btnOps') ||
  !files.guard.includes('btnOps') ||
  !files.staff.includes('id="people"') ||
  !files.guard.includes('id="chat"') ||
  !files.guard.includes('liveComposerInnerHtml') ||
  !files.staff.includes('liveComposerInnerHtml') ||
  !files.chatUi.includes('id="btnVoice"') ||
  !files.media.includes('audio/webm')
) {
  fail('first page must keep the chat box + voice · Staff keeps the people list')
} else ok('first-page chat box + voice · Staff people list')

if (
  !files.chatUi.includes('Your message is sent.') ||
  !files.chatUi.includes('Your voice is sent.') ||
  !files.chatUi.includes('Your video is sent.') ||
  !files.chatUi.includes('Your image including selfie is sent.') ||
  !files.chatUi.includes('Your document (Word, PDF, Excel, PPT) is sent.') ||
  !files.chatUi.includes('id="btnEmoji"') ||
  !files.chatUi.includes('id="btnVoice"') ||
  !files.chatUi.includes('id="btnSend"') ||
  files.chatUi.indexOf('id="btnVoice"') > files.chatUi.indexOf('id="btnSend"') ||
  !files.chatUi.includes('id="voiceRec"') ||
  !files.chatUi.includes('data-act="copy"') ||
  !files.chatUi.includes('data-act="forward"') ||
  !files.chatUi.includes('data-act="save"') ||
  !files.chatUi.includes('data-act="delete"') ||
  !files.guard.includes('liveComposerInnerHtml') ||
  !files.staff.includes('liveComposerInnerHtml') ||
  !files.guard.includes('liveChatExtrasScript') ||
  !files.staff.includes('liveChatExtrasScript') ||
  !files.guard.includes('liveShowSent') ||
  !files.staff.includes('liveShowSent') ||
  !files.data.includes("action === 'chatDelete'") ||
  !files.shell.includes('live-rec-wave') ||
  !files.shell.includes('live-emoji') ||
  !files.chatUi.includes('liveSyncThread') ||
  !files.chatUi.includes('liveHoldBub') ||
  !files.chatUi.includes('.bub') ||
  files.guard.includes('<p class="rule">') ||
  files.staff.includes('<p class="rule">') ||
  !files.guard.includes('liveDisclaimerHtml') ||
  !files.staff.includes('liveDisclaimerHtml') ||
  !files.guard.includes('btnToLogin') ||
  !files.staff.includes('btnToLogin') ||
  !files.shell.includes('By order.') ||
  !files.shell.includes('internal Agile Security Force operations')
) {
  fail('chat must keep voice steady, hold-menu, login arrow, disclaimer, and no on-screen duty-chat line')
} else ok('steady voice · hold menu · login arrow · disclaimer · no duty-chat line')

if (
  !files.shell.includes('100dvh') ||
  !files.shell.includes('min-height:76px') ||
  !files.shell.includes('font-size:16px') ||
  !files.shell.includes('min-width:1100px')
) {
  fail('Agile Live must stay phone-first for Android (big rows, 16px type, laptop only from 1100px)')
} else ok('phone-first Android layout')

if (!files.staff.includes("otpLoginScript(LIVE_APP_ID, LIVE_APP_NAME, portal)")) {
  fail('staff page must use email PIN for appId live')
} else ok('staff / management use email PIN (appId live)')

if (files.data.includes("verifyAppSession(token, LIVE_APP_ID)") === false) {
  fail('API must verify live session only')
} else ok('staff API scoped to live')

if (!files.data.includes('sharedChat && guardTok')) {
  fail('staff/management chatSend must not require Guard ID')
} else ok('staff chat does not use Guard ID lookup')

if (!files.data.includes('Work360 stays the official attendance')) {
  fail('punch must stay shadow — Work360 remains official')
} else ok('Work360 remains official attendance')

if (!files.data.includes('do not dump the full HDFC') || !files.staff.includes('not the full HDFC')) {
  fail('duty board must not dump the Master Directory / HDFC list')
} else ok('duty board is today only, not the full book')

if (!files.vercel.includes('"/live"') || !files.vercel.includes('/api/live/app')) {
  fail('vercel.json must rewrite /live')
} else ok('/live rewrite present')

if (/id:\s*'live'/.test(files.apps)) {
  fail('do not add a Command Centre tile for Agile Live')
} else ok('no extra Command Centre tile')

if (files.guard.includes('drrDetailForm') || files.staff.includes('Daily Recruitment Report')) {
  fail('do not copy Recruitment into Agile Live')
} else ok('Recruitment portal not copied')

if (files.guard.includes('Guard ID No.') || files.guard.includes('>Guards<') || files.guard.includes("'Guards'")) {
  fail('phone must say Security Staff — not guard / Guards')
} else if (!files.guard.includes('Security Staff') || !files.guard.includes('ID No.')) {
  fail('phone must use Security Staff and ID No.')
} else ok('phone says Security Staff · ID No.')

if (!files.guard.includes('meDesig') || !files.guard.includes('meWho') || !files.guard.includes('dashShifts') || !files.data.includes('clientName')) {
  fail('header must show name, ID, and designation; dashboard keeps today’s / tomorrow’s shift')
} else ok('header · name · ID · designation · shift line')

if (
  !files.types.includes('OUT_OF_POST_M = 100') ||
  !files.types.includes('OUT_OF_POST_KM = 0.1') ||
  !files.post.includes('matchLiveDutyPost') ||
  !files.guard.includes('dutyMap') ||
  !files.staff.includes('Map')
) {
  fail('duty post fence must be 100 metres with Map on phone and board')
} else ok('100 metre duty-post fence + Map')

if (!files.mail.includes('CONTROL_EMAIL') || !files.mail.includes('getHodEmailsForBranch') || !files.data.includes('sendLiveDutyExceptionMail')) {
  fail('Late Start / Out of Post must mail OM / HOD / Control / Director')
} else ok('exception mail only on Late Start / Out of Post')

if (
  files.guard.includes('<h3>Duties this month</h3>') ||
  files.guard.includes('<h3>Vacant Post duty</h3>') ||
  !files.staff.includes('This month') ||
  !files.data.includes('dutyMonth') ||
  !files.data.includes('monthDuties')
) {
  fail('phone Operations must not list Duties this month / Vacant Post; Staff board still lists the month')
} else ok('phone Operations has no month/vacant list · Staff board keeps This month')

if (
  !files.duty.includes('You have started the duty late today') ||
  !files.types.includes('You are leaving the assigned duty') ||
  !files.types.includes('Bathroom') ||
  !files.data.includes('dutyWatch') ||
  !files.mail.includes('break_duty')
) {
  fail('late hours message, leaving-post alarm, and Break Duty reason must stay')
} else ok('late duty hours · leaving-post alarm · Break Duty reason')

if (
  files.guard.includes('capture="environment"') ||
  files.guard.includes('id="cam"') ||
  !files.guard.includes('Take selfie') ||
  !files.guard.includes('facingMode') ||
  !files.data.includes('Turn on location to start duty') ||
  !files.duty.includes('You have ended duty early')
) {
  fail('Start/End Duty must use a live selfie + site location, and early End Duty must show hours')
} else ok('selfie + site location · early End Duty hours')

if (
  files.guard.includes('id="btnBreak"') ||
  !files.guard.includes('tickPatrol') ||
  !files.guard.includes('tickTakeover') ||
  !files.guard.includes('tickReliever') ||
  !files.guard.includes('tickHandover') ||
  !files.guard.includes('bothTicked') ||
  !files.data.includes('relieverOk')
) {
  fail('Start/End Duty must tick both boxes before the selfie')
} else ok('Start/End Duty tick both boxes · then selfie · no Break Duty on Dashboard')

if (
  !files.duty.includes('autoLiveShift') ||
  !files.duty.includes("label: 'Shift A'") ||
  !files.duty.includes("label: 'Shift G'") ||
  !files.duty.includes("label: 'Shift B'") ||
  !files.duty.includes("label: 'Shift C'") ||
  !files.data.includes('shiftLabel') ||
  !files.guard.includes('shiftLabel') ||
  !files.staff.includes('shiftLabel') ||
  !files.mail.includes('shiftLabel')
) {
  fail('after selfie + site GPS, client · location · Shift A/B/C/G must fill automatically')
} else ok('auto client · location · Shift A/B/C/G after verify')

if (
  files.data.includes('Agile Live trial is Hyderabad only') ||
  files.data.includes('Hyderabad-A, Hyderabad-B, and Hi-Tech City only')
) {
  fail('Agile Live must be open for all branches')
} else if (!files.data.includes('liveBranchOptions')) {
  fail('all-branch picker helper missing')
} else ok('all branches may open Agile Live')

if (
  !files.week.includes('duty changes every Sunday') &&
  !files.week.includes('livePersonWeek')
) {
  fail('weekly roster helper missing')
} else if (
  !files.week.includes('Facility Attendant') ||
  !files.week.includes('Armed Guard') ||
  !files.week.includes('Lady Guard') ||
  !files.week.includes('Weekly off') ||
  !files.guard.includes('weekCard') ||
  !files.staff.includes('weekRoster') ||
  !files.data.includes('weekRoster') ||
  !files.guard.includes('id="homeWeek"') ||
  !files.guard.includes('homeWeekDays') ||
  !files.guard.includes('paintHomeWeek') ||
  !files.liveRule.includes('attendance to this week')
) {
  fail('first page must show week schedule, Sunday change, weekly off, and site ranks')
} else ok('first-page week schedule · Sunday change · weekly off · HDFC Facility Attendant')

{
  const opsBlock = files.data.slice(
    files.data.indexOf('LIVE_OPS_STAFF_ACTIONS'),
    files.data.indexOf('LIVE_OPS_STAFF_DENIED'),
  )
  if (
    !files.guard.includes('id="offExtraBox"') ||
    !files.guard.includes('Schedule extra duty') ||
    !files.guard.includes('scheduleOffExtra') ||
    !files.data.includes("action === 'scheduleOffExtra'") ||
    opsBlock.includes('scheduleOffExtra') ||
    !files.store.includes('live:off-extra:v1') ||
    !files.week.includes('liveUpcomingOffDates') ||
    !files.week.includes('todayExtra') ||
    !files.liveRule.includes('schedule extra duty on the weekly off')
  ) {
    fail('Security Staff must be able to schedule extra duty on weekly off (same site or another location)')
  } else ok('weekly off extra duty — same site or another location, then Start Duty')
}

{
  const opsHeadings = [
    'Sanctioned post',
    'Shiftwise deployment',
    'Day wise deployment',
    'Unit attendance',
    'Free from this unit',
    'Unit Security Staff',
    'Emergency numbers',
    'Operations Team',
    'Command Centre',
    'Helpdesk',
  ]
  const staffMissing = opsHeadings.filter((h) => !files.staff.includes(h))
  if (
    staffMissing.length ||
    !files.staff.includes('id="opsPhoneLists"') ||
    !files.staff.includes('id="opsContacts"') ||
    !files.staff.includes('id="opsVacantList"') ||
    !files.staff.includes('opsPhoneLists') ||
    !files.data.includes('opsPhoneLists') ||
    !files.data.includes('LIVE_OPS_STAFF_ACTIONS') ||
    !files.data.includes('Security Staff have no access to operations reports or processes.') ||
    !files.liveRule.includes('Security Staff have no access to operations reports or processes') ||
    !files.liveRule.includes('attendance to this week')
  ) {
    fail(
      `Staff + Management Live must show ops reports + separate contacts; API/rule must lock the Security Staff boundary${staffMissing.length ? ` (missing: ${staffMissing.join(', ')})` : ''}`,
    )
  } else ok('operations phone · sanctioned / shift / day · contacts groups · Security Staff boundary locked')

  const guardOpsLeak = [
    'Sanctioned post',
    'Shiftwise deployment',
    'Day wise deployment',
    'Unit attendance',
    'Free from this unit',
    'Unit Security Staff',
    'id="opsContacts"',
    'id="opsPhoneLists"',
    'id="btnVacant"',
    'id="btnPortal"',
    'Allot Vacant Post duty',
    'Mark present today',
    'Send duty reminder',
    "action === 'portalAttend'",
    "action === 'opsPhoneLists'",
  ].filter((n) => files.guard.includes(n))
  if (guardOpsLeak.length) {
    fail(`Security Staff phone must not show operations reports or processes (${guardOpsLeak.join(', ')})`)
  } else if (
    !files.guard.includes('id="homeWeek"') ||
    !files.guard.includes('Start Duty') ||
    !files.guard.includes('End Duty')
  ) {
    fail('Security Staff first page must keep homeWeek + Start Duty / End Duty')
  } else ok('Security Staff phone has no ops reports · week + Start/End stay')
}

if (
  files.guard.includes('id="btnRecruit"') ||
  files.guard.includes('>Recruit<') ||
  files.guard.includes('>Deploy<')
) {
  fail('phone must not have Recruit or Deploy buttons')
} else ok('phone has no Recruit / Deploy buttons')

if (
  !files.liveRule.includes('Do not connect WhatsApp for anything for Agile Live mobile use') ||
  files.guard.includes('wa.me') ||
  files.guard.includes('api.whatsapp.com') ||
  files.guard.toLowerCase().includes('whapi') ||
  files.staff.includes('wa.me') ||
  files.staff.includes('api.whatsapp.com') ||
  files.staff.toLowerCase().includes('whapi')
) {
  fail('Agile Live mobile must not open WhatsApp (wa.me / Whapi); rule must lock the ban')
} else ok('Agile Live mobile has no WhatsApp open/send')

if (
  !files.week.includes('LIVE_DEFAULT_WEEKLY_OFF') ||
  !files.data.includes('setUnitWeekOff') ||
  !files.data.includes('portalAttend') ||
  !files.data.includes('attReports') ||
  !files.staff.includes('Portal attendance') ||
  !files.staff.includes('Absent more than 7 days') ||
  !read('api/_lib/agile-live/attendance-reports.ts').includes('present < 13')
) {
  fail('unit weekly off, portal attendance, and attendance reports must stay')
} else ok('Sunday weekly off + OM unit day · portal attendance · 7-day / 13-day reports')

if (
  !files.types.includes('On the way') ||
  !files.types.includes('Will report') ||
  !files.types.includes('Leave informed') ||
  !files.types.includes('Traffic delay') ||
  !files.data.includes('sendReminder') ||
  !files.data.includes('allotVacant') ||
  !files.data.includes('remindReply') ||
  !files.guard.includes('Wage Slip') ||
  !files.guard.includes('Vacant Post duty') ||
  !files.guard.includes('Off Duty') ||
  !files.staff.includes('Send duty reminder') ||
  !files.staff.includes('Send training (OJT) reminder') ||
  !files.staff.includes('Allot Vacant Post duty') ||
  !files.week.includes('liveMonthOffDates') ||
  !files.wage.includes('liveWageSlip') ||
  !files.guard.includes('if(added) beep()')
) {
  fail('phone inbox must keep weekly offs, vacant post, duty/OJT reminder, Wage Slip, reply list, and sound')
} else ok('phone inbox · vacant post · duty/OJT reminder · Wage Slip · sound alarm')

if (
  files.guard.includes('Highly Beneficial') ||
  files.guard.includes('drrDetailForm') ||
  files.staff.includes('Completion report')
) {
  fail('do not copy Training completion or Recruitment into Agile Live reminders')
} else ok('OJT reminder is notify only — Training / Recruitment screens not copied')

if (
  !files.shell.includes('live-foot') ||
  !files.shell.includes('footChat') ||
  !files.shell.includes('type="date"') ||
  !files.guard.includes('liveFooterHtml') ||
  !files.staff.includes('liveFooterHtml') ||
  !files.guard.includes('Call & Video') ||
  !files.guard.includes('Security News') ||
  !files.guard.includes('Weather & Traffic') ||
  !files.guard.includes('Emergency Number') ||
  !files.guard.includes('Site Instructions') ||
  !files.guard.includes('Profile & Documents') ||
  !files.guard.includes('Important Links') ||
  !files.guard.includes('Soft Skill') ||
  !files.staff.includes('Save site instruction') ||
  !files.staff.includes('Save soft skill') ||
  !files.guard.includes('dashLate') ||
  !files.guard.includes('Duties</span>') ||
  !files.guard.includes('Patrolling completed') ||
  !files.guard.includes('Taken over') ||
  !files.guard.includes('Reliever Reported') ||
  !files.guard.includes('Handed over') ||
  !files.guard.includes('Low Risk') ||
  !files.guard.includes('High Risk') ||
  !files.guard.includes('Left Post') ||
  !files.guard.includes('Today’s shift') ||
  !files.shell.includes('live-crest') ||
  !files.shell.includes('#c9a84c') ||
  !files.guard.includes('live-cal') ||
  !files.staff.includes('live-cal') ||
  !files.data.includes('saveIdCard') ||
  !read('api/_lib/agile-live/month-calendar.ts').includes('buildLiveMonthCalendar') ||
  !files.data.includes('liveWeatherReport')
) {
  fail('first page footer (Chat / Security News / Training / Profile), matching headers, and month calendar must stay')
} else ok('four-tab footer · matching headers · Duty dashboard · month calendar')

{
  const gGate = files.guard.indexOf('id="gate"')
  const gHome = files.guard.indexOf('id="home"')
  const gFoot = files.guard.indexOf("liveFooterHtml('Chat')")
  const gateBlock = gGate >= 0 && gHome > gGate ? files.guard.slice(gGate, gHome) : ''
  const sApp = files.staff.indexOf('id="app"')
  const sFoot = files.staff.indexOf("liveFooterHtml('Chat')")
  const staffLogin = sApp >= 0 ? files.staff.slice(0, sApp) : files.staff
  if (
    gFoot < 0 ||
    gHome < 0 ||
    gFoot < gHome ||
    gateBlock.includes("liveFooterHtml('Chat')") ||
    gateBlock.includes('footChat') ||
    sFoot < 0 ||
    sApp < 0 ||
    sFoot < sApp ||
    staffLogin.includes("liveFooterHtml('Chat')") ||
    staffLogin.includes('footChat')
  ) {
    fail('Open / PIN login page must not show Chat / Call & Video or the four-tab footer')
  } else ok('Open page has no chat footer · four tabs stay after sign-in')
  if (
    files.guard.includes('langPickGate') ||
    gateBlock.includes("liveLangBarHtml(") ||
    staffLogin.includes("liveLangBarHtml(") ||
    !gateBlock.includes('liveHonourBannerHtml') ||
    !gateBlock.includes('suiteAppOpenPageFooterHtml') ||
    !gateBlock.includes('liveOpenHeadHtml') ||
    gateBlock.includes('livePersonHeadHtml') ||
    !staffLogin.includes('liveHonourBannerHtml') ||
    !staffLogin.includes('suiteAppOpenPageFooterHtml') ||
    !staffLogin.includes('liveOpenHeadHtml') ||
    !files.shell.includes('Honouring our Guards who protect the dreams of many') ||
    !files.shell.includes('white-space:nowrap') ||
    !files.shell.includes('p.scrollWidth') ||
    !files.shell.includes('.live-disclaimer .by-order{') ||
    !files.shell.includes('text-align:right') ||
    !files.shell.includes('live-open-head') ||
    !files.shell.includes('Agile Security Force Private Limited') ||
    !files.shell.includes('www.AgileGroup.co.in') ||
    !files.shell.includes('Job Website,') ||
    !files.shell.includes('www.SecurityJob.co.in') ||
    !files.shell.includes('AGILE LIVE') ||
    !files.shell.includes('Central Control -') ||
    !files.shell.includes('9248707070') ||
    !files.guard.includes('liveIconHeadHtml') ||
    !files.staff.includes('liveIconHeadHtml') ||
    !files.media.includes('liveVoiceIsApple') ||
    !files.media.includes('liveVoiceBindMic') ||
    !files.media.includes('Tap the mic to start') ||
    !files.media.includes('liveVoiceStart') ||
    !files.guard.includes("pending.kind==='audio'") ||
    files.shell.includes('class="live-app-icon"') ||
    files.shell.includes('live-open-logo') ||
    !files.shell.includes('live-open-head .live-crest') ||
    !files.chatUi.includes('btnVoiceSend') ||
    !files.i18nMajor.includes('संदेश लिखें') ||
    !files.i18n.includes('LIVE_I18N_MAJOR')
  ) {
    fail('Open page must keep regular logo header, company lines, honour (one line), centred disclaimer, By order right, Cursor footer; no language; inner pages must translate major words')
  } else ok('Open regular header · company lines · honour one line · disclaimer centre · By order right')

  if (
    !fs.existsSync(path.join(root, 'public/agile-live-icon.png')) ||
    !fs.existsSync(path.join(root, 'public/agile-live-icon-32.png')) ||
    !fs.existsSync(path.join(root, 'public/agile-live-icon-180.png')) ||
    !fs.existsSync(path.join(root, 'public/agile-live-icon-192.png')) ||
    !read('public/live-manifest.webmanifest').includes('/agile-live-icon.png') ||
    !read('api/_lib/agile-live/shell.ts').includes('apple-touch-icon') ||
    !read('api/_lib/agile-live/shell.ts').includes('agile-live-icon-32.png')
  ) {
    fail('Agile Live must have a square app icon for phone and desktop')
  } else ok('Agile Live app icon + home-screen manifest')
}

if (
  files.guard.includes("['banner','gateBanner']") ||
  !files.guard.includes("paintMsg('gateBanner'")
) {
  fail('Open page must not keep the home location banner after they tap back to login')
} else ok('Open page banners stay off the login door')

if (
  !files.guard.includes('ID card validity') ||
  !files.guard.includes('timeToday') ||
  !files.guard.includes("branchId: 'meBr'") ||
  !files.guard.includes("branchId: 'opsBr'") ||
  !files.shell.includes('live-br') ||
  !files.guard.includes('id="btnAlarm"') ||
  !files.guard.includes('id="btnConnect"') ||
  !files.guard.includes('/guards/register') ||
  !files.guard.includes('langPickHome') ||
  !files.i18n.includes("'hi'") ||
  !files.i18n.includes("'gu'") ||
  !files.i18n.includes("'te'") ||
  !files.i18n.includes("'ur'") ||
  !files.guard.includes('id="alarmHigh"') ||
  !files.data.includes("action === 'staffAlarm'") ||
  !files.mail.includes('staff_alarm') ||
  files.guard.includes('Follow the Security News Channel') ||
  files.staff.includes('Follow the Security News Channel') ||
  !files.guard.includes('Off Duty') ||
  !files.guard.includes('Reliever took over') ||
  !files.guard.includes('monthLabel') ||
  !files.week.includes('isLiveHdfc2fa') ||
  !files.week.includes('7:00 AM') ||
  !files.data.includes('relieverOk') ||
  !files.data.includes('hdfcNightBlocked') ||
  !read('api/_lib/agile-live/duty-continue.ts').includes('Duty continuation') ||
  !files.mail.includes('duty_continue') ||
  files.guard.includes('Weekly off this month:')
) {
  fail('header Branch, first-page Alarm, News menu, ID card, reliever tick, HDFC 2FA, and continuation mail must stay')
} else ok('header Branch · Alarm + Agile Connect · languages · no News Channel line · reliever · HDFC 2FA')

if (
  !files.guard.includes('id="banner"') ||
  files.guard.indexOf('id="gate"') > files.guard.indexOf('id="banner"') ||
  files.staff.includes('<div id="banner" class="msg"></div>\n  <div class="live-desk">')
) {
  fail('location banner must sit under the first-page header, not over Operations')
} else ok('front-page banner under header · Operations has no top red bar')

const rule = path.join(root, '.cursor/rules/suite-agile-live.mdc')
if (!fs.existsSync(rule)) fail('missing suite-agile-live Cursor rule')
else ok('Cursor rule present')

if (failed) {
  console.error('\ncheck:agile-live FAILED\n')
  process.exit(1)
}
console.log('\ncheck:agile-live OK')
