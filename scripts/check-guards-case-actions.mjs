#!/usr/bin/env node
/**
 * Lock: Guards Received — Open & assign, Save, Submit reports, Preview before WhatsApp.
 *   node scripts/check-guards-case-actions.mjs
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

const app = fs.readFileSync(path.join(root, 'api/guards/app.ts'), 'utf8')
const data = fs.readFileSync(path.join(root, 'api/guards/data.ts'), 'utf8')
const completion = fs.readFileSync(path.join(root, 'api/_lib/guards/completion.ts'), 'utf8')

{
  const letter = app.slice(app.indexOf('Send completion letter to guard'))
  const block = letter.slice(0, 900)
  const previewAt = block.indexOf('previewComplete()')
  const waAt = block.indexOf('sendComplete(')
  if (previewAt < 0 || waAt < 0 || !block.includes('>Preview</button>') || previewAt > waAt) {
    fail('Case page must show Preview immediately before WhatsApp')
  } else ok('Preview sits before WhatsApp')
}

if (!app.includes('function previewComplete()') || !app.includes("action:'previewCompletion'")) {
  fail('previewComplete must call previewCompletion (no send)')
} else ok('Preview opens the letter without sending')

if (!data.includes("action === 'previewCompletion'") || !data.includes('completionLetterPreviewHtml')) {
  fail('data.ts must serve previewCompletion HTML')
} else ok('previewCompletion API present')

if (!completion.includes('export function completionLetterPreviewHtml')) {
  fail('completion.ts must export completionLetterPreviewHtml')
} else ok('Preview letter helper present')

if (!app.includes('function assignCase()') || !app.includes('Assignment saved.') || !app.includes('.catch(function(e){alert((e&&e.message)||\'Could not save assignment\');})')) {
  fail('Save assignment must confirm and show errors')
} else ok('Save assignment reports success / error')

if (!app.includes('Ops report saved.') || !app.includes('Dept report saved.')) {
  fail('Submit ops / dept must confirm save')
} else ok('Ops and Dept submit confirm save')

if (!app.includes('Opening complaint…') || !app.includes('Could not open complaint')) {
  fail('Open & assign must show opening / error')
} else ok('Open & assign shows progress and errors')

if (!app.includes('Open &amp; assign') || !app.includes('Open & assign')) {
  fail('Open & assign must stay on Received (cards and table)')
} else ok('Open & assign on HOD table and Management cards')

const clickGuard = data.includes('Open / Assign / Submit must not wait') &&
  data.includes('isLoad') &&
  data.includes("action === 'escalateDelayed'")
if (!clickGuard) {
  fail('Click actions must skip delayed WhatsApp / full-book heal-save')
} else ok('Click actions skip delayed send and full-book heal-save')

if (data.includes('sendEmails: !isLoad')) {
  fail('User clicks must not run processDelayedEscalations with emails')
} else ok('User clicks do not send delayed emails')

if (app.includes("otpLoginScript") && app.includes("__GUARDS_OTP_SCRIPT__")) {
  ok('Guards login script placeholder unchanged')
} else fail('Do not drop otpLoginScript / __GUARDS_OTP_SCRIPT__')

if (failed) {
  console.error('\ncheck:guards-case-actions FAILED\n')
  process.exit(1)
}
console.log('\ncheck:guards-case-actions OK')
