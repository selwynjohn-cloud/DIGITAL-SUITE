#!/usr/bin/env node
/**
 * Lock: Agile Control User management on Staff + Management;
 * HOD/Staff can assign; HOD cannot delete.
 *   node scripts/check-control-user-mgmt.mjs
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

const consoleTs = fs.readFileSync(path.join(root, 'api/_lib/control/console.ts'), 'utf8')
const dataTs = fs.readFileSync(path.join(root, 'api/control/data.ts'), 'utf8')
const storeTs = fs.readFileSync(path.join(root, 'api/_lib/control/store.ts'), 'utf8')
const authTs = fs.readFileSync(path.join(root, 'api/_lib/control/auth.ts'), 'utf8')

if (!consoleTs.includes('Regional Manager (RM)') || !consoleTs.includes('AC_USERS_VERSION')) {
  fail('Role dropdown must use company roles + version stamp')
} else ok('Company role list + version stamp on User management')

if (!consoleTs.includes('function renderUsers') || !consoleTs.includes("id==='users'")) {
  fail('nav must open renderUsers')
} else ok('User management screen wired')

if (!consoleTs.includes('setAcUserBranch') || consoleTs.includes("text:\\'\\'")) {
  fail('Branch assign onchange must use setAcUserBranch (no broken quote escape)')
} else ok('Branch assign helper safe for login page script')

if (!consoleTs.includes('CTX.canDelete') || !consoleTs.includes('HOD / Staff cannot delete')) {
  fail('HOD must be blocked from Delete in UI')
} else ok('HOD delete blocked in UI')

if (!dataTs.includes("action === 'loadUsers'") || !dataTs.includes("action === 'saveUsers'")) {
  fail('data API must support loadUsers / saveUsers')
} else ok('loadUsers / saveUsers API present')

if (!dataTs.includes("action === 'deleteUser'") || !dataTs.includes('cannot delete any data')) {
  fail('deleteUser must reject HOD/Staff')
} else ok('deleteUser rejects HOD/Staff')

if (!dataTs.includes('HOD / Staff cannot delete users')) {
  fail('saveUsers must reject silent user removal by HOD')
} else ok('saveUsers blocks HOD deletions')

if (!storeTs.includes('ac:users') && !storeTs.includes("users: `${PREFIX}users`")) {
  fail('Redis key ac:users required')
} else ok('ac:users store present')

if (!authTs.includes('isAcAuthorisedEmail')) {
  fail('auth must accept User Management active emails')
} else ok('Authorised via User Management list')

if (!authTs.includes('aap@agilegroup.co.in') || !authTs.includes('canAcAccessPortal')) {
  fail('Abhishek (aap@) must be allowed both portals; UM staff get Staff portal')
} else ok('Abhishek both portals; User Management staff → Staff portal')

const otpTs = fs.readFileSync(path.join(root, 'api/auth/app-otp.ts'), 'utf8')
if (otpTs.includes("appId === 'control' && !isAcAllowedEmail")) {
  fail('PIN login must accept User Management emails, not only the short allowlist')
} else if (!otpTs.includes('isAcAuthorisedEmail') || !otpTs.includes('canAcAccessPortal')) {
  fail('Control PIN send/verify must use User Management + portal check')
} else ok('Control Send PIN accepts User Management staff')

if (failed) {
  console.error('\ncheck:control-user-mgmt FAILED\n')
  process.exit(1)
}
console.log('\ncheck:control-user-mgmt OK')
