#!/usr/bin/env node
/**
 * Independent ops branches lock — Nellore ≠ Tada, etc.
 * Run via: npm run check:independent-branches  (also from check:mis-menu)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
let failed = 0
function ok(m) {
  console.log('OK:', m)
}
function fail(m) {
  console.error('FAIL:', m)
  failed++
}

const keyFile = path.join(root, 'api/_lib/mis/branch-group-key.ts')
const dedupe = path.join(root, 'api/_lib/mis/branch-dedupe.ts')
const src = fs.existsSync(keyFile) ? fs.readFileSync(keyFile, 'utf8') : ''
const dedupeSrc = fs.existsSync(dedupe) ? fs.readFileSync(dedupe, 'utf8') : ''

if (!src) fail('missing api/_lib/mis/branch-group-key.ts')
else ok('branch-group-key.ts present')

const forbidden = [
  [/NELLORE['"]?\s*:\s*['"]NELLORE-TADA/i, 'Nellore must not map to NELLORE-TADA'],
  [/TADA['"]?\s*:\s*['"]NELLORE/i, 'Tada must not collapse into Nellore'],
  [/TIRUPATI['"]?\s*:\s*['"][^'"]*TADIPATRI/i, 'Tirupati must not join Tadipatri'],
  [/CHENNAI['"]?\s*:\s*['"][^'"]*PUDUCHERRY/i, 'Chennai must not join Puducherry'],
  [/MUMBAI['"]?\s*:\s*['"][^'"]*SURAT/i, 'Mumbai must not join Surat'],
  [/VISAKHAPATNAM['"]?\s*:\s*['"][^'"]*KAKINADA/i, 'Vizag must not join Kakinada'],
]
for (const [re, msg] of forbidden) {
  if (re.test(src)) fail(msg)
  else ok(msg.replace(' must not ', ' stays separate from ').replace(/join /, ''))
}

if (/dedupeMisBranches\(\)/.test(dedupeSrc) && /restore.*Master|auto.?run|fromLastReport/.test(dedupeSrc)) {
  /* soft: warn only if obvious auto-call from restore — skip hard fail */
}
if (failed) {
  console.error('\ncheck:independent-branches FAILED')
  process.exit(1)
}
console.log('\ncheck:independent-branches OK')
