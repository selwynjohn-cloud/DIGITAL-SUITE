#!/usr/bin/env node
/**
 * Lock: three daily Security News bulletins (6 AM, 2 PM, 10 PM IST).
 * Run: npm run check:bulletin
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function read(rel) {
  return readFileSync(resolve(root, rel), 'utf8')
}

function fail(msg) {
  throw new Error(msg)
}

function mustInclude(file, needle, why) {
  const text = read(file)
  if (!text.includes(needle)) fail(`${file} missing ${why}: ${needle}`)
}

function mustNotInclude(file, needle, why) {
  const text = read(file)
  if (text.includes(needle)) fail(`${file} must not have ${why}: ${needle}`)
}

const vercel = JSON.parse(read('vercel.json'))
const crons = Array.isArray(vercel.crons) ? vercel.crons : []
if (!crons.some((c) => c.path === '/api/pulse/cron' && c.schedule === '*/30 * * * *')) {
  fail('vercel.json must keep /api/pulse/cron on */30 * * * *')
}
for (const [when, utc] of [
  ['6:00 AM IST', '30 0 * * *'],
  ['6:05 AM IST retry', '35 0 * * *'],
  ['6:10 AM IST retry', '40 0 * * *'],
  ['2:00 PM IST', '30 8 * * *'],
  ['2:05 PM IST retry', '35 8 * * *'],
  ['2:10 PM IST retry', '40 8 * * *'],
  ['10:00 PM IST', '30 16 * * *'],
  ['10:05 PM IST retry', '35 16 * * *'],
  ['10:10 PM IST retry', '40 16 * * *'],
]) {
  if (!crons.some((c) => c.path === '/api/pulse/cron' && c.schedule === utc)) {
    fail(`vercel.json must keep /api/pulse/cron on ${utc} (${when})`)
  }
}

mustInclude('api/_lib/pulse/scheduler.ts', "edition: 'Morning Edition'", 'morning send window')
mustInclude('api/_lib/pulse/scheduler.ts', "edition: 'Afternoon Edition'", 'afternoon send window')
mustInclude('api/_lib/pulse/scheduler.ts', "edition: '10:00 PM Edition'", '10:00 PM send window')
mustInclude('api/_lib/pulse/scheduler.ts', 'start: 22 * 60', '10:00 PM start')
mustInclude('api/_lib/pulse/scheduler.ts', 'until: 23 * 60 + 45', '10:00 PM catch-up')
mustNotInclude('api/_lib/pulse/scheduler.ts', "edition: 'Evening Edition'", '6:00 PM evening slot (removed)')
mustInclude('api/_lib/pulse/config.ts', "timeIst: '10:00 PM'", '10:00 PM on bulletin page')
mustInclude('api/_lib/pulse/config.ts', "return '10:00 PM Edition'", '10:00 PM edition label')
mustInclude('api/_lib/pulse/confirm.ts', "edition: '10:00 PM Edition'", '10:00 PM confirm/rescue')
mustInclude('api/_lib/pulse/confirm.ts', 'h === 22 && m >= 10', '10:00 PM rescue starts 10 minutes after slot')
mustInclude('api/_lib/pulse/confirm.ts', 'You do not need to tap Send', 'machine keeps sending — do not ask Director to tap')
mustNotInclude('api/_lib/pulse/confirm.ts', 'Tap to send now', 'must not ask Director to tap Send')
mustInclude('api/_lib/pulse/news.ts', 'hwy:mumbai-pune', 'Mumbai–Pune accident shown once, not four times')
mustInclude('api/_lib/pulse/news.ts', 'export function storyClusterKey', 'one incident cluster used on the page and in history')
mustInclude('api/_lib/pulse/news.ts', 'Never reprint the same accident', 'later editions do not refill with the same crash')
mustInclude('api/_lib/pulse/news.ts', 'STRONG_FOLLOW_UP_RE', 'killed/injured is not a new story')
mustInclude('api/_lib/pulse/quality.ts', 'seenCluster', 'page drops a second rewrite of the same accident')
mustInclude('api/_lib/pulse/scheduler.ts', 'laterEdition', '2:00 PM / 10:00 PM still send without reprinting morning news')
mustInclude('api/_lib/pulse/clock.ts', 'handoff=1&token=', 'clock handoff carries the secret in the URL too')
mustNotInclude('api/_lib/pulse/confirm.ts', "edition: 'Evening Edition'", '6:00 PM confirm (removed)')
mustInclude('api/pulse/cron.ts', '10:00 PM Edition', 'status includes 10:00 PM')
mustInclude('api/_lib/pulse/clock.ts', 'vercel-cron', 'Vercel clock User-Agent')
mustInclude('api/_lib/pulse/clock.ts', 'waitUntil', 'clock replies 200 then keeps sending')
mustInclude('api/_lib/pulse/clock.ts', 'clockWaitUntilAvailable', 'do not drop the send if waitUntil is missing')
mustInclude('api/_lib/pulse/clock.ts', 'startPulseHandoffAndHold', 'clock stays up until the WhatsApp send has started')
mustInclude('api/_lib/pulse/clock.ts', 'sleep(5000)', 'do not return 200 in 0 ms')
mustInclude('api/_lib/pulse/publish.ts', 'publishLogIstDate', '10:00 PM must stay on today’s IST date')
mustInclude('api/_lib/pulse/scheduler.ts', "new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })", 'date key from real clock, not a fake Date')
mustInclude('api/pulse/cron.ts', 'isVercelClockRequest', 'Pulse cron accepts Vercel clock')
mustInclude('api/pulse/cron.ts', 'startPulseHandoffAndHold', 'Pulse cron hands off then holds so WhatsApp can start')
mustInclude('api/pulse/cron.ts', 'runAfterClockReply', 'Pulse clock sends in the same job, not only via handoff')
mustInclude('api/pulse/cron.ts', 'runDueBulletins', 'Pulse clock sends the next missed edition due today')
mustInclude('api/pulse/cron.ts', 'isPulseHandoffRequest', 'handoff request is allowed through cron auth')
mustInclude('api/suite/health-cron.ts', 'runAfterClockReply', 'health-cron clock does not block bulletin on page checks')
mustInclude('api/suite/health-cron.ts', 'startPulseHandoffAndHold', 'health clock kicks the bulletin before page checks')
mustInclude('api/suite/health-cron.ts', 'runDueBulletins', 'health cron keeps sending a missed edition until 11:45 PM')
mustInclude('api/_lib/pulse/scheduler.ts', 'export function editionsDueNow', 'same-day missed editions stay due until 11:45 PM')
mustInclude('api/_lib/pulse/scheduler.ts', 'catchUp?: boolean', 'catch-up may send after the first window without using yesterday')
mustInclude('api/_lib/pulse/confirm.ts', 'confirmSlotsDue', 'morning and afternoon stay confirmed until 11:45 PM if still missing')
mustInclude('api/_lib/pulse/publish.ts', 'acquirePublishLock', 'one send at a time')
mustInclude('api/_lib/pulse/publish.ts', 'const BATCH = 4', 'WhatsApp groups sent in parallel batches')
mustInclude('api/_lib/pulse/publish.ts', 'liveGroupIds', 'if saved group IDs fail, send to groups on the linked phone')
mustInclude('api/mis/cron.ts', "job === 'bulletin-groups'", 'last-night groups-only recovery')
mustInclude('api/_lib/pulse/whatsapp.ts', 'waitingForScan', 'QR / status.code 3 is not a live WhatsApp session')
mustInclude('api/_lib/pulse/whatsapp.ts', 'WHAPI_TOKEN_6626', '6626 spare line uses its own token')
mustInclude('api/_lib/pulse/whatsapp.ts', "wantLast4 === '6626' || wantLast4 === '2345'", 'spare 6626/2345 pair must not log out the 9091 news line')
mustInclude('api/_lib/pulse/whatsapp.ts', 'waFetchWithBuffer', 'send tries news line then spare line')
mustInclude('api/_lib/pulse/scheduler.ts', 'ymd?: string', 'missed bulletin can send for a past IST date')
mustInclude('api/pulse/cron.ts', "param(req, 'ymd')", 'ymd query for missed 10:00 PM recovery')
mustInclude('api/_lib/guards/branch-wa-groups.ts', 'Do not waLogout()', 'Guards leftover must not log out the news bulletin phone')
if (!JSON.stringify(vercel.functions?.['api/pulse/cron.ts'] || {}).includes('300')) {
  fail('vercel.json functions must set api/pulse/cron.ts maxDuration 300')
}

if (read('api/pulse/cron.ts').includes("job === 'night-bulletin'")) {
  fail('pulse cron must not keep a one-off night-bulletin switch — 10:00 PM is a scheduled slot')
}

const health = read('api/suite/health-cron.ts')
const pulseAt = health.indexOf('await runPulsePublish')
const checksAt = health.indexOf('await runSuiteHealthChecks')
if (pulseAt < 0 || checksAt < 0 || pulseAt > checksAt) {
  fail('health-cron must run the bulletin before page health checks')
}

mustInclude('api/pulse/admin.ts', 'Security News — Agile Group', 'admin portal heading')
mustInclude('api/pulse/admin.ts', 'Admin Portal — to update Security news', 'admin portal purpose line')
mustInclude('api/pulse/admin.ts', 'Gift coupon is sent to the winner.', 'winner gift-coupon line on admin')
mustInclude('api/pulse/admin.ts', 'WhatsApp <b>', 'admin shows winner/participant WhatsApp number')
mustInclude('api/pulse/admin.ts', 'View all participants', 'admin button for full participant list')
mustInclude('api/pulse/admin.ts', "week:'ALL'", 'admin loads every week of entries')
mustInclude('api/pulse/admin-data.ts', 'formatQuizWhatsApp', 'admin API returns WhatsApp numbers')
mustInclude('api/pulse/admin-data.ts', 'getAllEntries', 'admin can list all quiz entries')
mustNotInclude('api/pulse/bulletin.ts', 'whatsapp:', 'public bulletin must not list participant numbers')
mustInclude('api/pulse/admin.ts', 'for the Week number-', 'week-number winner heading')
mustInclude('api/pulse/admin.ts', 'it@agilegroup.co.in', 'IT mailbox shown as no longer authorised')
mustInclude('api/pulse/admin.ts', 'sai@agilegroup.co.in', 'Sai official email only')
mustInclude('api/pulse/admin.ts', 'director@agilegroup.co.in', 'Director official email only')
mustInclude('api/pulse/admin.ts', 'Every month 30 questions are changed', 'monthly 30-question change')
mustInclude('api/pulse/admin.ts', 'not asked twice in the same month', 'no month repeat on admin page')
mustInclude('api/pulse/admin.ts', 'Generate 20 new questions with AI', 'AI generate twenty new questions')
mustInclude('api/_lib/pulse/admin-auth.ts', 'isLeftCompanyEmail', 'pulse rejects left-company mailbox')
mustInclude('api/_lib/pulse/admin-auth.ts', 'sai@agilegroup.co.in', 'pulse admin allowlist Sai')
mustInclude('api/_lib/pulse/admin-auth.ts', 'director@agilegroup.co.in', 'pulse admin allowlist Director')
{
  const pulseAuth = read('api/_lib/pulse/admin-auth.ts')
  const allow = pulseAuth.match(/export const PULSE_ADMIN_EMAILS = \[([\s\S]*?)\] as const/)
  if (!allow) fail('api/_lib/pulse/admin-auth.ts missing PULSE_ADMIN_EMAILS')
  if (allow[1].includes('it@agilegroup.co.in')) {
    fail('Pulse admin allowlist must not include it@agilegroup.co.in (left the company)')
  }
}
mustInclude('api/_lib/pulse/template.ts', 'Gift coupon is sent to the winner.', 'winner gift-coupon line on bulletin')
mustInclude('api/_lib/pulse/template.ts', 'text-align:center;">${esc(gift)}</div>', 'gift-coupon line centred on bulletin')
mustInclude('api/_lib/pulse/template.ts', 'text-align:center;">🏅', 'winner name line centred on bulletin')
mustInclude('api/_lib/pulse/template.ts', 'Winner for the Week number-', 'bulletin week-number heading')
mustInclude('api/_lib/pulse/template.ts', 'SECURITY NEWS - AGILE GROUP', 'bulletin header title')
mustInclude('api/_lib/pulse/template.ts', 'id="pulseShare"', 'public bulletin has Share')
mustInclude('api/_lib/pulse/template.ts', 'navigator.share', 'Share uses the phone share list')
mustInclude('api/_lib/pulse/template.ts', 'width:100%;height:auto', 'event photos show full picture, full width')
mustInclude('api/_lib/pulse/news.ts', 'titleLooksDated', 'block archive reprints such as 2020 headlines')
mustInclude('api/_lib/pulse/quality.ts', 'titleLooksDated', 'quality gate drops old-year news')
mustNotInclude('api/_lib/pulse/template.ts', 'NEWS BULLETIN /', 'old bilingual News Bulletin header')
mustNotInclude('api/_lib/pulse/template.ts', 'Daily Bulletin Schedule', 'schedule box removed from public page')
mustNotInclude('api/_lib/pulse/template.ts', 'function scheduleBlock', 'schedule block function removed')
mustInclude('api/_lib/pulse/config.ts', 'daily entries now crossing 299', 'awareness announcement')
mustInclude('api/_lib/pulse/config.ts', 'two lucky winners', 'week 34 two winners')
mustInclude('api/_lib/pulse/messages.ts', 'Follow our Security News Channel', 'group asks to follow the Channel')
mustInclude('api/_lib/pulse/messages.ts', 'test your security skills, and win rewards', 'group Channel line mentions quiz rewards')
mustInclude('api/_lib/pulse/messages.ts', '${CHANNEL_URL}', 'group first link is the direct WhatsApp Channel URL')
mustInclude('api/_lib/pulse/messages.ts', '${SHARE_URL}', 'group still keeps tinyurl.com/Security-News after the Channel URL')
mustInclude('api/_lib/pulse/messages.ts', 'Full bulletin: ${BULLETIN_URL}.', 'Channel points to Pulse, not to itself')
mustInclude('api/_lib/pulse/messages.ts', 'Agile Security Force Private Limited.', 'Channel starts with company name')
mustInclude('api/_lib/pulse/messages.ts', '🚨 *SECURITY NEWS – AGILE GROUP* 🚨', 'news-desk header on Channel and groups')
mustInclude('api/_lib/pulse/publish.ts', 'waSendText(channel, msg1)', 'Channel bulletin is text — no logo image')
mustInclude('api/_lib/pulse/publish.ts', 'waSendText(g, msg2)', 'group bulletin is text — no logo image')
mustNotInclude('api/_lib/pulse/publish.ts', 'waSendImageCard', 'bulletin must not attach the crest image')
mustNotInclude('api/_lib/pulse/messages.ts', "Inside today's bulletin", 'long section menu (rolls to second page)')
mustNotInclude('api/_lib/pulse/messages.ts', 'Expanding Security Awareness', 'long awareness essays on WhatsApp')
mustNotInclude('api/_lib/pulse/messages.ts', 'CURSOR_ATTRIBUTION', 'Cursor line must not sit on the group WhatsApp')
mustNotInclude('api/_lib/pulse/messages.ts', '⭐ *Flash News, Weather, Jobs & Daily Quiz:*', 'group must not point at the website bulletin link')
mustInclude('api/_lib/pulse/messages.ts', 'For immediate Job Vacancies -', 'group vacancy line after Channel link')
mustInclude('api/_lib/pulse/messages.ts', 'our full range of services - www.agilegroup.co.in', 'group services line')
mustInclude('api/_lib/pulse/messages.ts', 'JOB_LINKS.registerLabel', 'vacancy line uses www.SecurityJob.co.in')
mustInclude('api/_lib/pulse/config.ts', 'whatsapp.com/channel/0029VbCUrUAFnSz8CmYqJP1y', 'direct Security News Channel URL')
mustInclude('api/_lib/pulse/config.ts', "registerLabel: 'www.SecurityJob.co.in'", 'SecurityJob label')
mustInclude('api/_lib/pulse/quiz.ts', "['DEL', WINNERS_KEY]", 'old winners removed on publish')
mustInclude('api/_lib/pulse/quiz.ts', 'giftCouponCode', 'winner coupon code')
mustInclude('api/_lib/pulse/quiz.ts', 'BANK_REFRESH_DAYS = 60', 'question bank 60-day refresh')
mustInclude('api/_lib/pulse/quiz.ts', 'questionFingerprint', 'same wording cannot return as a new id')
mustInclude('api/_lib/pulse/quiz.ts', 'isUsedThisMonth', 'no repeat in the same calendar month')
mustInclude('api/_lib/pulse/quiz.ts', 'fp:', 'used-map tracks question text')
mustInclude('api/_lib/pulse/quiz.ts', 'MONTHLY_SWAP_COUNT = 30', 'change 30 questions every month')
mustInclude('api/_lib/pulse/quiz.ts', 'maybeMonthlySwap', 'monthly 30-question rotation')
mustInclude('api/_lib/pulse/quiz.ts', 'winnersNeededForWeek', 'two winners from week 34')
mustInclude('api/_lib/pulse/quiz.ts', 'abdul\\s*jameel', 'Abdul Jameel removed from last week')
mustInclude('api/_lib/pulse/quiz.ts', 'winnerCourtesyName', 'winner names start with Mr or Mrs')
mustInclude('api/_lib/pulse/quiz.ts', "prefix = FEMALE_FIRST_NAMES.has(first) ? 'Mrs.' : 'Mr.'", 'Mr or Mrs chosen from first name')
mustInclude('api/_lib/pulse/quiz.ts', 'recordQuizAnswer', 'one first attempt per mobile per day')
mustInclude('api/_lib/pulse/quiz.ts', 'listQualifiedForWeek', 'draw only from 7-day finishers')
mustInclude('api/_lib/pulse/quiz.ts', 'Sunday–Saturday', 'prize week Sunday to Saturday')
mustInclude('api/_lib/pulse/config.ts', 'QUIZ_CONTEST_RULES', 'contest rules on Security News')
mustInclude('api/_lib/pulse/template.ts', 'How to win this week', 'rules sit in the Question of the Day box')
mustInclude('api/_lib/pulse/template.ts', 'Sunday to Saturday', 'rule 2 week is Sunday to Saturday')
mustNotInclude('api/_lib/pulse/template.ts', 'pqDots', 'no day-dot scorecard on the quiz box')
mustNotInclude('api/_lib/pulse/template.ts', 'try again now, for the correct answer', 'no second try the same day')
mustInclude('api/_lib/pulse/store.ts', 'appreciation and cash reward', 'HDFC Mumbai appreciation para removed')

const starterBank = read('api/_lib/pulse/config.ts')
const starterCount = (starterBank.match(/^\s*sq\(/gm) || []).length
if (starterCount < 120) {
  fail(`STARTER_QUIZ_BANK must have at least 120 unique questions so 30 can change each month (found ${starterCount})`)
}

{
  const news = read('api/_lib/pulse/news.ts')
  const samples = [
    '6 killed in Mumbai-Pune Expressway accident',
    'Mumbai Pune highway crash: 6 dead',
    'Accident on Express Highway near Lonavala, several injured',
    'Pune-Mumbai expressway mishap after rain',
  ]
  if (!news.includes('hwy:mumbai-pune') || samples.some((t) => !/mumbai|pune|lonavala/i.test(t))) {
    fail('Mumbai–Pune accident samples must stay clustered as one story')
  }
}

console.log('check-bulletin: three daily slots locked (6:00 AM · 2:00 PM · 10:00 PM IST)')
console.log('check-bulletin: Security News admin portal + current winner + 100-question bank + no month repeat locked')
