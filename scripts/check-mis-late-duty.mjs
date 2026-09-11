#!/usr/bin/env node
/**
 * Lock: Late Duty / Out of Location show guard mobile + Call + WhatsApp warning.
 *
 *   npm run check:late-duty
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

const helper = path.join(root, 'api/_lib/mis/duty-contact.ts')
if (!fs.existsSync(helper)) fail('missing api/_lib/mis/duty-contact.ts')
else ok('has duty-contact helper')

const contact = fs.readFileSync(helper, 'utf8')
for (const needle of [
  'enrichDutyIncidentsWithMobile',
  'DUTY_CONTACT_JS',
  'WhatsApp Warning',
  'LATE DUTY WARNING',
  'OUT OF DUTY POST - WARNING',
  'Automated Warning Letter, Agile Digital Operations Command Center',
  'Unattended Post Notice',
  'Terms & Conditions',
  'tel:+91',
  'wa.me/91',
  'dutyLateRowsHtml',
  'dutyOutRowsHtml',
]) {
  if (!contact.includes(needle)) fail(`duty-contact missing ${needle}`)
}
if (contact.includes('abscond') || contact.includes('Absconder')) {
  fail('WhatsApp warning must not use absconder wording')
} else ok('warning text is duty/location, not absconder')

const store = fs.readFileSync(path.join(root, 'api/_lib/mis/store.ts'), 'utf8')
if (!/export type MisDutyIncident[\s\S]*mobile\?: string/.test(store)) {
  fail('MisDutyIncident must store guard mobile')
} else ok('duty incident has mobile')

const sync = fs.readFileSync(path.join(root, 'api/_lib/mis/work360-duty.ts'), 'utf8')
if (!sync.includes('resolveMobile') || !sync.includes('dutyMobileDigits') || !sync.includes('mobile: existing.mobile || incoming.mobile')) {
  fail('Work360 duty sync must capture and keep mobile')
} else ok('Work360 sync keeps mobile')

const duty = fs.readFileSync(path.join(root, 'api/mis/duty.ts'), 'utf8')
const staff = fs.readFileSync(path.join(root, 'api/mis/staff.ts'), 'utf8')
const admin = fs.readFileSync(path.join(root, 'api/mis/admin-data.ts'), 'utf8')
const staffData = fs.readFileSync(path.join(root, 'api/mis/staff-data.ts'), 'utf8')
const rows = fs.readFileSync(path.join(root, 'api/_lib/mis/branch-mobile-stats.ts'), 'utf8')
const pdf = fs.readFileSync(path.join(root, 'api/_lib/mis/client-facing-reports.ts'), 'utf8')

function hasSplitTables(src, label) {
  const late = src.includes('<h4') && src.includes('Late Duty') && src.includes('WhatsApp Warning') && src.includes('Start Time')
  const out = src.includes('Out of Location') && src.includes('Left Time') && src.includes('Away Detail')
  const call = src.includes('>Call<') || src.includes('dutyCallCell')
  if (!late || !out || !call) fail(`${label} must split Late Duty and Out of Location with mobile / Call / WhatsApp Warning`)
  else ok(`${label} has split Late Duty + Out of Location tables`)
}

hasSplitTables(duty, 'Management Late Start page')
hasSplitTables(staff, 'HOD Late Start / Dashboard')

if (!duty.includes('DUTY_CONTACT_JS') || !staff.includes('DUTY_CONTACT_JS')) {
  fail('HOD and Management must use shared DUTY_CONTACT_JS')
} else ok('shared contact JS on HOD + Management')

if (!admin.includes('enrichDutyIncidentsWithMobile') || !staffData.includes('enrichDutyIncidentsWithMobile')) {
  fail('list APIs must enrich missing mobiles')
} else ok('HOD + Management APIs enrich mobile')

if (!rows.includes('mobile: d.mobile') || !rows.includes('enrichDutyIncidentsWithMobile')) {
  fail('HOD dashboard duty rows must include mobile')
} else ok('dashboard duty rows include mobile')

if (!pdf.includes('<th>Mobile</th>')) fail('PDF / share report must show Mobile')
else ok('PDF shows Mobile')

if (failed) {
  console.error('\ncheck:late-duty FAILED\n')
  process.exit(1)
}
console.log('\ncheck:late-duty OK')
