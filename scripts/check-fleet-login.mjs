#!/usr/bin/env node
/**
 * Lock: Fleet HOD + Management login must stay open (Director can use HOD portal).
 *
 *   node scripts/check-fleet-login.mjs
 *   node scripts/check-fleet-login.mjs --probe
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const probe = process.argv.includes('--probe')
const BASE = process.env.HEALTH_CHECK_BASE_URL?.trim() || 'https://www.agilegroup-digital.co.in'
let failed = false

function read(rel) {
  return readFileSync(resolve(root, rel), 'utf8')
}

function fail(msg) {
  console.error('FAIL:', msg)
  failed = true
}

function ok(msg) {
  console.log('OK:', msg)
}

function mustInclude(file, needle, why) {
  if (!read(file).includes(needle)) fail(`${file} missing ${why}: ${needle}`)
  else ok(`${why}`)
}

function mustNotInclude(file, needle, why) {
  if (read(file).includes(needle)) fail(`${file} must not have ${why}: ${needle}`)
  else ok(`no ${why}`)
}

mustInclude('api/fleet/app.ts', 'loadBranchLoginOptionsHtml', 'HOD branch list preloaded like Guards')
mustInclude('api/fleet/app.ts', 'function directorPickHodBranch', 'Director pick-branch on HOD door')
mustInclude('api/fleet/app.ts', 'function directorOpenHodBranch', 'Director can open a branch HOD view')
mustInclude('api/fleet/app.ts', "otpLoginScript('fleet', 'Agile Fleet', portal)", 'Fleet uses shared email PIN')
mustInclude('api/fleet/app.ts', "{n:'Monthly Data',fn:'monthly'", 'Management Monthly Data menu')
mustInclude('api/fleet/app.ts', "{n:'Documents Validity',fn:'docs'", 'Management Documents Validity menu')
mustInclude('api/fleet/app.ts', "{n:'Daily Pre & Post Trip',fn:'dailyTrip'", 'combined Daily Pre & Post Trip menu')
mustInclude('api/fleet/app.ts', "{n:'Submitted Daily Report',fn:'submittedDaily'", 'Submitted Daily Report menu')
mustInclude('api/fleet/app.ts', "function dailyTrip", 'combined daily trip form')
mustInclude('api/fleet/app.ts', "function submittedDaily", 'submitted daily report list')
mustInclude('api/fleet/app.ts', "function savePreTrip", 'Pre-Trip saved on its own')
mustInclude('api/fleet/app.ts', "function savePostTrip", 'Post-Trip saved on its own')
mustInclude('api/fleet/app.ts', "saveTripKind('pre-trip-4w')", 'Pre-Trip form type')
mustInclude('api/fleet/app.ts', "saveTripKind('post-trip-4w')", 'Post-Trip form type')
mustInclude('api/fleet/app.ts', 'notifyId:rec.id', 'each trip save asks for HOD mail')
mustInclude('api/fleet/app.ts', 'function driverShareBox', 'Daily page shows driver phone link')
mustInclude('api/fleet/app.ts', 'DRIVER_TRIP_URL', 'share uses the one common driver link')
mustInclude('api/fleet/app.ts', 'function rememberLoadDailyTrip', 'portal reloads saved Pre-Trip so it can be seen')
mustInclude('api/fleet/app.ts', 'You cannot change it. Fill Post-Trip only', 'saved Pre-Trip is view only on portal')
mustInclude('api/fleet/app.ts', 'You do not type the trip code', 'portal does not ask for the trip code')
mustInclude('api/fleet/app.ts', 'function editDaily', 'HOD/Management can edit a submitted daily report')
mustInclude('api/fleet/app.ts', 'function delDaily', 'HOD/Management can delete a submitted daily report')
mustInclude('api/fleet/app.ts', 'Confirm again — the submitted report will be changed', 'edit asks for a second confirm')
mustInclude('api/fleet/app.ts', 'Confirm again — this report will be removed', 'delete asks for a second confirm')
mustInclude('api/fleet/app.ts', 'function sendDashWeeklyReminder', 'dashboard can send weekly vehicle report reminder')
mustInclude('api/fleet/app.ts', 'Send weekly vehicle report reminder', 'dashboard reminder button')
mustInclude('api/fleet/data.ts', "action === 'sendWeeklyReminder'", 'server sends weekly reminder from dashboard')
mustInclude('api/fleet/data.ts', "action === 'deleteInspection'", 'server deletes a submitted daily report')
mustInclude('api/fleet/data.ts', 'hodEdit', 'HOD edit can change a saved Pre-Trip')
mustInclude('api/_lib/fleet/analysis.ts', 'CONTROL_EMAIL', 'weekly reminder copies Control')
mustInclude('api/_lib/fleet/analysis.ts', 'suiteDirectorEmail', 'weekly reminder copies Director')
mustInclude('api/_lib/fleet/analysis.ts', 'Dear HOD', 'weekly reminder is addressed to HOD')
mustInclude('api/fleet/app.ts', 'function fldRo', 'saved Pre-Trip fields are read-only')
mustInclude('api/fleet/app.ts', 'function lastCloseForVeh', 'portal opening KM uses last closing KM')
mustInclude('api/fleet/app.ts', 'function shareDriverTrip', 'share driver link by WhatsApp or mail')
mustNotInclude('api/fleet/app.ts', 'function fleetTripBranchUrl', 'per-branch share links')
mustNotInclude('api/fleet/app.ts', 'function driverShareBranches', 'branch-by-branch share list')
mustNotInclude('api/fleet/app.ts', 'HOD Driver Register', 'PIN register on driver share box')
mustNotInclude('api/fleet/app.ts', 'DRIVER_REG_URL', 'fleet-drivers URL on Daily share box')
mustInclude('api/fleet/app.ts', 'function dailyTripVehBox', 'vehicle dropdown plus type-in')
mustInclude('api/fleet/app.ts', 'function dailyTripDrvBox', 'driver dropdown plus type-in')
mustInclude('api/fleet/app.ts', '>Other Vehicle</option>', 'Other Vehicle on portal form')
mustInclude('api/fleet/app.ts', '>New Driver</option>', 'New Driver on portal form')
mustInclude('api/fleet/app.ts', 'placeholder="Vehicle Number"', 'Vehicle Number type-in (no emergency)')
mustInclude('api/fleet/app.ts', 'placeholder="New driver name"', 'Driver name type-in (no emergency)')
mustInclude('api/fleet/app.ts', 'License Expiry date', 'License Expiry date on portal trip')
mustInclude('api/fleet/app.ts', 'Start time (Auto)', 'Start time Auto on portal Pre-Trip')
mustInclude('api/fleet/app.ts', '00.00hrs', 'start time 00.00hrs format')
mustInclude('api/fleet/app.ts', 'End time (Auto)', 'End time Auto on portal Post-Trip')
mustInclude('api/fleet/app.ts', 'function nowDateHrs', 'End time auto date + time')
mustInclude('api/fleet/app.ts', 'Total KM (Auto)', 'Total KM auto on portal')
mustInclude('api/fleet/app.ts', 'id="kmRun"', 'Total KM is calculated, not typed')
mustInclude('api/fleet/app.ts', 'Diesel Level', 'Diesel Level on portal Pre-Trip')
mustNotInclude('api/fleet/app.ts', 'type for emergency', 'emergency wording on trip form')
mustNotInclude('api/fleet/app.ts', 'emergency change', 'emergency placeholder on trip form')
mustNotInclude('api/fleet/app.ts', "fld('License No.','licenseNo'", 'License No. on Daily trip form')
mustInclude('api/fleet/trip.ts', '>Other Vehicle</option>', 'Other Vehicle on phone form')
mustInclude('api/fleet/trip.ts', '>New Driver</option>', 'New Driver on phone form')
mustInclude('api/fleet/trip.ts', 'placeholder="Vehicle Number"', 'phone Vehicle Number type-in')
mustInclude('api/fleet/trip.ts', 'placeholder="New driver name"', 'phone Driver name type-in')
mustInclude('api/fleet/trip.ts', 'License Expiry date', 'License Expiry date on phone form')
mustInclude('api/fleet/trip.ts', 'id="licExp"', 'License Expiry is a date picker')
mustInclude('api/fleet/trip.ts', 'Start time (Auto)', 'Start time Auto on phone Pre-Trip')
mustInclude('api/fleet/trip.ts', '00.00hrs', 'phone start time 00.00hrs')
mustInclude('api/fleet/trip.ts', 'End time (Auto)', 'End time Auto on phone Post-Trip')
mustInclude('api/fleet/trip.ts', 'function nowDateHrs', 'phone End time auto date + time')
mustInclude('api/fleet/trip.ts', 'Total KM (Auto)', 'Total KM auto on phone')
mustNotInclude('api/fleet/trip.ts', 'id="endTime" type="time"', 'clock picker on End time')
mustInclude('api/fleet/trip.ts', 'Diesel Level', 'Diesel Level on phone Pre-Trip')
mustInclude('api/fleet/trip.ts', 'less than half tank', 'diesel less than half tank')
mustNotInclude('api/fleet/trip.ts', 'emergency', 'emergency wording on phone trip form')
mustNotInclude('api/fleet/trip.ts', 'id="license"', 'License No. box on phone trip form')
mustInclude('api/fleet/data.ts', "action === 'shareDriverLink'", 'server can send driver link')
mustInclude('api/fleet/trip.ts', 'No password — one common link', 'public driver page has no password')
mustInclude('api/fleet/trip.ts', 'Branch name *', 'public form has branch dropdown')
mustInclude('api/fleet/trip.ts', "id=\"branch\"", 'branch is a dropdown on the common form')
mustInclude('api/fleet/trip.ts', 'function recallTrip', 'last Pre-Trip is loaded so it can be seen')
mustInclude('api/fleet/trip.ts', 'HAS_PRE', 'phone locks saved Pre-Trip')
mustInclude('api/fleet/trip.ts', 'You do not type the trip code', 'phone does not ask for the trip code')
mustInclude('api/fleet/trip.ts', 'Pre-Trip already saved. You can see it, but you cannot change it', 'phone blocks editing saved Pre-Trip')
mustNotInclude('api/fleet/trip.ts', 'you can edit and Save again', 'phone must not invite Pre-Trip edit')
mustInclude('api/fleet/trip.ts', 'function rememberTrip', 'phone remembers last branch and vehicle')
mustInclude('api/fleet/trip.ts', 'Trip no.', 'public form has Trip 1 / 2 / 3')
mustInclude('api/fleet/trip.ts', 'Come back after this trip to fill Post-Trip', 'pre-trip can be filled first, post later')
mustInclude('api/fleet/trip.ts', 'lastCloseKm', 'opening KM uses last closing KM')
mustInclude('api/fleet/app.ts', 'function changeTripNo', 'portal Trip 1 / 2 / 3')
mustInclude('api/_lib/fleet/daily-trip-save.ts', 'function tripNoOf', 'trip number on the save key')
mustNotInclude('api/fleet/trip.ts', 'id="dir"', 'common page must not be a branch-link list')
mustInclude('api/fleet/trip.ts', "replace(/[/]+$/,'')", 'path regex safe inside PAGE template')
mustNotInclude('api/fleet/trip.ts', 'replace(/\\/+$/', 'broken // comment inside PAGE template')
mustInclude('api/fleet/trip-data.ts', "action === 'save'", 'public driver save')
mustInclude('api/fleet/trip-data.ts', "action === 'recall'", 'public last-report recall')
mustInclude('api/_lib/fleet/daily-trip-save.ts', 'function lastClosingKm', 'shared last closing KM helper')
mustInclude('api/_lib/fleet/daily-trip-save.ts', 'PRE_TRIP_LOCKED_MSG', 'server refuses a second Pre-Trip save')
mustInclude('api/_lib/fleet/daily-trip-save.ts', 'endTime: s(i.endTime, 40)', 'End time can store date and time')
mustInclude('vercel.json', '"/fleet-trip"', 'live /fleet-trip rewrite')
mustInclude('api/fleet/data.ts', 'sendDailyTripMail', 'server sends HOD mail after trip save')
mustInclude('api/_lib/fleet/daily-trip-mail.ts', 'CONTROL_EMAIL', 'Control is copied on trip mail')
mustInclude('api/_lib/fleet/daily-trip-mail.ts', 'suiteDirectorEmail', 'Director is copied on trip mail')
mustNotInclude('api/fleet/app.ts', "formType:'daily-trip'", 'single combined daily-trip save')
mustInclude('api/fleet/app.ts', 'function branchVehicles', 'HOD Vehicle Data page')
mustInclude('api/fleet/app.ts', "V.push(vehTemplate());EXP=V.length-1;branchVehicles()", 'HOD can add vehicles')
mustInclude('api/fleet/data.ts', 'others.concat(mine)', 'HOD vehicle/driver save merges and does not wipe other branches')
mustInclude('api/fleet/app.ts', 'function branchHasActiveVeh', 'branches with no vehicles are not marked Not Submitted')
mustInclude('api/fleet/app.ts', 'No vehicles allotted', 'no-vehicle branches stay off the pending list')
mustInclude('api/fleet/app.ts', "onclick=\"delVeh('+i+')\"", 'Vehicle Data has Delete on both portals')
mustInclude('api/fleet/app.ts', "onclick=\"delDr('+realIdx+')\"", 'Drivers Data has Delete on both portals')
mustInclude('api/fleet/app.ts', 'function deactVeh', 'Vehicle Data has Deactivate')
mustInclude('api/fleet/app.ts', 'function deactDr', 'Drivers Data has Deactivate')
mustNotInclude('api/fleet/app.ts', 'Deactivate the vehicle instead', 'HOD blocked from deleting a vehicle')
mustInclude('api/_lib/fleet/store.ts', 'function branchesWithActiveVehicles', 'shared no-vehicle helper')
mustInclude('api/fleet/cron.ts', 'branchesWithActiveVehicles', 'Saturday reminder skips branches with no vehicles')
mustInclude('api/_lib/fleet/analysis.ts', 'branchesWithActiveVehicles', 'Sunday mail skips branches with no vehicles')
mustInclude('api/_lib/fleet/store.ts', 'function isHyderabadFleetBranch', 'Hyderabad books are not on the weekly pending list')
mustNotInclude("api/_lib/fleet/store.ts", "  'Hyderabad',\n", 'leftover combined Hyderabad on Fleet branch list')
mustInclude('api/_lib/fleet/trip-code.ts', 'CHE', 'Chennai trip letters example in helper file')
mustInclude('api/_lib/fleet/trip-code.ts', 'function formatTripCode', 'trip code CHE/0001/date')
mustInclude('api/_lib/fleet/trip-code.ts', 'please renew your license', 'expired licence popup wording')
mustInclude('api/fleet/app.ts', 'function isHydFleet', 'HOD/Management skip Hyderabad on weekly status')
mustInclude('api/fleet/app.ts', 'Trip report code', 'portal shows auto trip code')
mustInclude('api/fleet/app.ts', 'handover the vehicle key to HOD', 'expired licence popup on portal')
mustInclude('api/fleet/trip.ts', 'Trip report code', 'phone form shows auto trip code')
mustInclude('api/fleet/trip.ts', 'handover the vehicle key to HOD', 'expired licence popup on phone')
mustInclude('api/_lib/fleet/daily-trip-mail.ts', 'function sendExpiredLicenseMail', 'expired licence mail to HOD')
mustInclude('api/fleet/trip-data.ts', "action === 'licenseAlert'", 'phone can mail HOD on expired licence')
mustInclude('api/fleet/data.ts', "action === 'licenseAlert'", 'portal can mail HOD on expired licence')
mustInclude('api/_lib/fleet/daily-trip-mail.ts', 'function sendNewDriverMail', 'new driver name and expiry mailed to HOD')
mustInclude('api/fleet/app.ts', 'Enter the new driver name and license expiry date', 'portal asks for new driver expiry')
mustInclude('api/fleet/trip.ts', 'Enter the new driver name and license expiry date', 'phone asks for new driver expiry')
mustNotInclude('api/fleet/data.ts', 'Driver data is maintained in Management Portal only', 'HOD blocked from saving drivers')
mustNotInclude('api/fleet/app.ts', 'Vehicle master data is maintained in the <b>Management Portal</b> only', 'HOD vehicle page still view-only')
mustInclude('api/fleet/app.ts', 'function tripViewPicker', 'Management trip view has All Branches')
mustInclude('api/fleet/app.ts', 'suiteMgmtBranchOptionsHtml', 'Fleet Management uses shared All Branches helper')
mustNotInclude(
  'api/fleet/app.ts',
  "if(FLEET_ROLE==='admin'&&PORTAL==='staff'){PORTAL='management'",
  'Director HOD login flipped to Management',
)
mustInclude(
  'api/fleet/data.ts',
  'sessionBranchId || requestedBranch',
  'Director on HOD keeps the selected branch',
)
mustInclude(
  'api/auth/app-otp.ts',
  '!isSuiteAdminEmail(email)',
  'Director / Sai PIN verify does not require a branch row',
)
mustInclude(
  'api/_lib/embedded-otp.ts',
  "em==='director@agilegroup.co.in'||em==='selwyn.john@gmail.com'",
  'Director can tap Send PIN on HOD without a branch',
)
mustInclude(
  'api/_lib/embedded-otp.ts',
  "em==='sai@agilegroup.co.in'",
  'Sai can tap Send PIN on HOD without a branch',
)

const app = read('api/fleet/app.ts')
if (!app.includes('__FLEET_OTP_SCRIPT__') || !app.includes('hodLoginHtml(')) {
  fail('Fleet page must keep HOD login + PIN script')
} else {
  ok('Fleet page keeps HOD login + PIN script')
}

const staffMenu = app.match(/var STAFF_MENU=\[([\s\S]*?)\];/)?.[1] || ''
const mgmtMenu = app.match(/var MGMT_MENU=\[([\s\S]*?)\];/)?.[1] || ''
const hodShared = [
  'Weekly Reports',
  'Communication Formats',
  'Monthly Data',
  'Vehicle Data',
  'Drivers Data',
  'Documents Validity',
  'Daily Pre & Post Trip',
  'Submitted Daily Report',
  'Submit Weekly Report',
  'User Management',
]
for (const name of hodShared) {
  if (!staffMenu.includes(`n:'${name}'`)) fail(`HOD menu missing ${name}`)
  else if (!mgmtMenu.includes(`n:'${name}'`)) fail(`Management menu missing HOD item ${name}`)
  else ok(`both portals have ${name}`)
}

try {
  const start = app.indexOf('const PAGE = `')
  if (start < 0) throw new Error('PAGE template missing')
  let i = start + 'const PAGE = `'.length
  let out = ''
  while (i < app.length) {
    const ch = app[i]
    if (ch === '\\') {
      out += app[i + 1]
      i += 2
      continue
    }
    if (ch === '`') break
    if (ch === '$' && app[i + 1] === '{') {
      let depth = 1
      i += 2
      while (i < app.length && depth) {
        if (app[i] === '{') depth += 1
        else if (app[i] === '}') depth -= 1
        i += 1
      }
      out += '0'
      continue
    }
    out += ch
    i += 1
  }
  const a = out.indexOf('<script>')
  const b = out.lastIndexOf('</script>')
  if (a < 0 || b < 0) throw new Error('PAGE <script> missing')
  const script = out
    .slice(a + 8, b)
    .replace(
      '__FLEET_OTP_SCRIPT__',
      'function otpSend(){}\nfunction otpVerify(){}\nfunction otpBoot(){}\nvar OTP_SESSION="",OTP_EMAIL="",OTP_ROLE="staff",OTP_BRANCH_NAME="";\n',
    )
  if (!script.includes('function applyLogin')) throw new Error('applyLogin missing')
  if (!script.includes('function directorPickHodBranch')) throw new Error('directorPickHodBranch missing from page script')
  new Function(script)
  ok('Fleet page script parses — Send PIN can run')
} catch (err) {
  fail('Fleet page script is broken (login will not open): ' + (err instanceof Error ? err.message : err))
}

try {
  const trip = read('api/fleet/trip.ts')
  const start = trip.indexOf('const PAGE = `')
  if (start < 0) throw new Error('trip PAGE missing')
  const scriptOpen = trip.indexOf('<script>', start)
  const scriptClose = trip.lastIndexOf('</script>')
  if (scriptOpen < 0 || scriptClose < 0) throw new Error('trip script missing')
  const raw = trip.slice(scriptOpen + 8, scriptClose).replace(/\$\{[^}]+\}/g, '0')
  new Function(raw)
  ok('Public /fleet-trip script parses — no password page can run')
} catch (err) {
  fail('Public /fleet-trip script is broken: ' + (err instanceof Error ? err.message : err))
}

if (probe) {
  const urls = [
    {
      url: `${BASE}/fleets?portal=staff&fresh=1`,
      must: ['function otpSend', 'otpEmailBranch', 'Send 6-digit PIN', 'Agile Fleet'],
    },
    {
      url: `${BASE}/fleets?portal=management&fresh=1`,
      must: ['function otpSend', 'Send 6-digit PIN', 'Management Portal'],
    },
    {
      url: `${BASE}/fleet-trip?fresh=1`,
      must: ['No password', 'Branch name', 'Select branch', 'Save Pre-Trip Report', 'Other Vehicle', 'New Driver', 'License Expiry date', 'Start time (Auto)', '00.00hrs', 'End time (Auto)', 'Total KM (Auto)', 'Diesel Level', 'less than half tank', 'Trip report code', 'You do not type the trip code', 'You cannot change it'],
      mustNot: ['Send 6-digit PIN', 'otpSend', 'Branch password', 'id="dir"', 'emergency', 'License No.'],
    },
    {
      url: `${BASE}/fleet-trip/Hyderabad-A?fresh=1`,
      must: ['Save Pre-Trip Report', 'Save Post-Trip Report', 'Vehicle No.', 'Driver name'],
      mustNot: ['Send 6-digit PIN', 'otpSend'],
    },
  ]
  for (const row of urls) {
    try {
      const html = await fetch(row.url, { cache: 'no-store' }).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((x) => x[1])
      if (!scripts.length) fail(`probe ${row.url}: no script`)
      else if (html.includes('function otpSend') || html.includes('function applyLogin')) {
        new Function(scripts[scripts.length - 1])
        ok(`probe script parses ${row.url}`)
      } else {
        ok(`probe public page ${row.url}`)
      }
      for (const needle of row.must) {
        if (!html.includes(needle)) fail(`probe ${row.url} missing ${needle}`)
        else ok(`probe ${needle}`)
      }
      for (const needle of row.mustNot || []) {
        if (html.includes(needle)) fail(`probe ${row.url} must not have ${needle}`)
        else ok(`probe no ${needle}`)
      }
    } catch (err) {
      fail(`probe ${row.url}: ${err instanceof Error ? err.message : err}`)
    }
  }
}

if (failed) {
  console.error('\ncheck:fleet-login FAILED — do not upload\n')
  process.exit(1)
}
console.log('\ncheck:fleet-login OK')
