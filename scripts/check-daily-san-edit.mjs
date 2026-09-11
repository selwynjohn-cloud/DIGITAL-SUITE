#!/usr/bin/env node
/**
 * HOD Daily MIS: editable Sanctioned + remember + auto-save steps 1–3.
 *
 *   npm run check:daily-san-edit
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

const staff = fs.readFileSync(path.join(root, 'api/mis/staff.ts'), 'utf8')
const reportData = fs.readFileSync(path.join(root, 'api/mis/report-data.ts'), 'utf8')

if (!staff.includes('san-inp') || !staff.includes('remembered next time')) {
  fail('Step 1 San must be an editable input (san-inp)')
} else ok('Step 1 San is editable')

if (!staff.includes('scheduleDeployAutoSave') || !staff.includes('quietSaveDeploy')) {
  fail('Step 1 must auto-save quietly')
} else ok('Step 1 auto-save present')

if (!staff.includes('scheduleShortageAutoSave') || !staff.includes('quietSaveShortage')) {
  fail('Step 2 must auto-save quietly')
} else ok('Step 2 auto-save present')

if (!staff.includes('scheduleSummaryAutoSave') || !staff.includes('quietSaveSummary')) {
  fail('Step 3 must auto-save quietly')
} else ok('Step 3 auto-save present')

if (!staff.includes('syncSanctioned:true')) {
  fail('Step 1 save must request syncSanctioned')
} else ok('Step 1 requests syncSanctioned')

if (!reportData.includes('syncSanctionedPostsToMaster') || !reportData.includes('masterSanUpdated')) {
  fail('saveDraft must sync Sanctioned to Master Directory')
} else ok('saveDraft syncs Sanctioned to master')

if (!reportData.includes('const sanA = num(d.sanA)')) {
  fail('Draft overlay must prefer draft San (not master-only)')
} else ok('Draft San preferred on reload')

if (!reportData.includes('Object.prototype.hasOwnProperty.call(prev, key)')) {
  fail('Previous-day San (including 0) must be remembered')
} else ok('Previous San remembered including zero')

if (failed) {
  console.error('\ncheck:daily-san-edit FAILED')
  process.exit(1)
}
console.log('\ncheck:daily-san-edit OK')
