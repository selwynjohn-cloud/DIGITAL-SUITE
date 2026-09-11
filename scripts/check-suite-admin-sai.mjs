#!/usr/bin/env node
/**
 * Lock: Sai (sai@agilegroup.co.in) may open Staff / HOD and Management
 * of every suite app. He is not Master PIN.
 *
 *   npm run check:suite-admin
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
  if (!read(file).includes(needle)) fail(`${file} missing ${why}: ${needle}`)
}

function mustNotInclude(file, needle, why) {
  if (read(file).includes(needle)) fail(`${file} must not have ${why}: ${needle}`)
}

mustInclude('api/_lib/auth.ts', 'export function isSuiteAdminEmail', 'suite admin helper')
mustInclude('api/_lib/auth.ts', "const SUITE_PORTAL_ADMIN_EMAILS = ['sai@agilegroup.co.in']", 'Sai is suite admin')
mustInclude(
  'api/_lib/auth.ts',
  "const SUITE_MASTER_PIN_EMAILS = [\n  'director@agilegroup.co.in',\n  'selwyn.john@gmail.com',\n  'md@agilegroup.co.in',\n]",
  'Master PIN list stays Director / MD only',
)
{
  const auth = read('api/_lib/auth.ts')
  const master = auth.match(/const SUITE_MASTER_PIN_EMAILS = \[([\s\S]*?)\]/)
  if (!master) fail('api/_lib/auth.ts missing SUITE_MASTER_PIN_EMAILS')
  if (master[1].includes('sai@agilegroup.co.in')) {
    fail('Sai must not be on the Master PIN list')
  }
}

mustNotInclude('api/_lib/super-admin-login.ts', 'isSuiteAdminEmail', 'Master PIN stays Director-only')
mustInclude('api/_lib/super-admin-login.ts', 'isSuperAdminEmail', 'Master PIN still uses Director list')

mustInclude('api/_lib/embedded-otp.ts', "em==='sai@agilegroup.co.in'", 'Sai Send PIN without a branch')
mustInclude('api/auth/app-otp.ts', '!isSuiteAdminEmail(email)', 'Sai PIN verify does not need a branch row')
mustInclude('api/auth/app-otp.ts', 'pickedBranch', 'Sai selected branch is kept on the session')

mustInclude('api/fleet/data.ts', 'isSuiteAdminEmail', 'Fleet resolve allows Sai')
mustInclude('api/recruitment/data.ts', 'isSuiteAdminEmail', 'Recruitment resolve allows Sai')
mustInclude('api/guards/data.ts', 'isSuiteAdminEmail', 'Guards resolve allows Sai')
mustInclude('api/crm/data.ts', 'isSuiteAdminEmail', 'CRM resolve allows Sai')
mustInclude('api/training/ojt-data.ts', 'isSuiteAdminEmail(session.email)', 'Training dual-admin includes Sai')
mustInclude('api/mis/admin-data.ts', 'isSuiteAdminEmail(email)', 'MIS User Management allows Sai')
mustInclude('api/_lib/control/auth.ts', 'isSuiteAdminEmail', 'Control allowlist includes Sai')
mustInclude('api/_lib/control/auth.ts', "'sai@agilegroup.co.in'", 'Control default list includes Sai')
mustInclude('api/_lib/ops/director-only.ts', "'sai@agilegroup.co.in'", 'Coming Soon / Ops shadow allows Sai')
mustInclude('api/assets/data.ts', 'isSuiteAdminEmail', 'Assets allows Sai')
mustInclude('api/meetings/data.ts', 'isSuiteAdminEmail', 'Meetings allows Sai')
mustInclude('api/audit/data.ts', 'isSuiteAdminEmail', 'Audit allows Sai')
mustInclude('api/licences/data.ts', 'isSuiteAdminEmail', 'Licences allows Sai')
mustInclude('api/facilities/data.ts', 'isSuiteAdminEmail', 'Facilities allows Sai')

console.log('OK: Sai is suite admin on both portals (not Master PIN)')
