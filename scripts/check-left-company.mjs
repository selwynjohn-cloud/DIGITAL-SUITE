#!/usr/bin/env node
/**
 * Lock: people who left (Prabhakar / it@) must not get OTP or admin access.
 *   npm run check:left-company
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

mustInclude('api/_lib/auth.ts', 'LEFT_COMPANY_EMAILS', 'left-company denylist')
mustInclude('api/_lib/auth.ts', "'it@agilegroup.co.in'", 'IT mailbox revoked')
mustInclude('api/_lib/auth.ts', "'app@agilegroup.co.in'", 'app@ mailbox denied on all Command Centre apps')
mustInclude('api/_lib/auth.ts', 'if (isLeftCompanyEmail(email)) return false', 'canLoginWithEmail blocks left company')
mustInclude('api/_lib/auth.ts', 'if (isLeftCompanyEmail(email)) return null', 'JWT session dies for left company')
mustInclude('api/_lib/email.ts', 'isLeftCompanyEmail(userEmail)', 'PIN mail never goes to left-company mailbox')
mustInclude(
  'api/_lib/auth.ts',
  '!isLeftCompanyEmail(e)',
  'report / suite mail lists drop left-company mailbox',
)
{
  const digest = read('api/_lib/suite-digest-shell.ts')
  if (digest.includes('MIS_IT_CC_EMAIL')) {
    fail('Daily report CC must not include it@ (left the company)')
  }
}
{
  const mail = read('api/_lib/suite-mail.ts')
  if (mail.includes('if (!allowItOwnMail)')) {
    fail('suite mail must never send To it@ even as own-mail')
  }
}
mustInclude('api/auth/send-pin.ts', 'loginEmailBlockError', 'Send PIN refuses left-company mailbox')
mustInclude('api/auth/verify-pin.ts', 'loginEmailBlockError', 'Verify PIN refuses left-company mailbox')
mustInclude('api/auth/app-otp.ts', 'loginEmailBlockError', 'app OTP refuses left-company mailbox')
mustInclude('api/auth/branch-login.ts', 'loginEmailBlockError', 'branch login refuses left-company mailbox')
mustInclude('api/_lib/pulse/admin-auth.ts', 'isLeftCompanyEmail', 'Pulse admin rejects left-company mailbox')
mustInclude('api/pulse/admin.ts', 'no longer authorised', 'Pulse admin page says IT mailbox is closed')
mustInclude('api/training/ojt-data.ts', "['director@agilegroup.co.in', 'sai@agilegroup.co.in']", 'Training dual-admin without IT')

{
  const pulseAuth = read('api/_lib/pulse/admin-auth.ts')
  const allow = pulseAuth.match(/export const PULSE_ADMIN_EMAILS = \[([\s\S]*?)\] as const/)
  if (!allow) fail('api/_lib/pulse/admin-auth.ts missing PULSE_ADMIN_EMAILS')
  if (allow[1].includes('it@agilegroup.co.in')) {
    fail('Pulse admin allowlist must not include it@agilegroup.co.in (left the company)')
  }
}

{
  const ojtUi = read('api/_lib/training/ojt-ui.ts')
  if (ojtUi.includes("em==='it@agilegroup.co.in'")) {
    fail('Training dual-admin UI must not treat it@ as admin (left the company)')
  }
}

console.log('OK: denied-login ban (it@ / Prabhakar · app@ all Command Centre apps)')
