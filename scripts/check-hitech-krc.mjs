#!/usr/bin/env node
/**
 * Lock: Hi-Tech City MIS client lists = KRC family only.
 *
 *   npm run check:hitech-krc
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
let failed = false

function fail(msg) {
  console.error('FAIL:', msg)
  failed = true
}
function ok(msg) {
  console.log('OK:', msg)
}

const clientBranch = fs.readFileSync(path.join(root, 'api/_lib/mis/client-branch.ts'), 'utf8')
const geo = fs.readFileSync(path.join(root, 'api/_lib/mis/client-branch-geo-resolve.ts'), 'utf8')

if (!clientBranch.includes('evacuateNonKrcFromHiTech') || !clientBranch.includes('filterDeployRowsForHiTechKrc')) {
  fail('client-branch.ts must export evacuateNonKrcFromHiTech + filterDeployRowsForHiTechKrc')
} else ok('evacuate helpers present')

const cron = fs.readFileSync(path.join(root, 'api/mis/cron.ts'), 'utf8')
if (!cron.includes("job === 'evacuate-hitech-krc'")) {
  fail('mis/cron must expose evacuate-hitech-krc job')
} else ok('cron evacuate-hitech-krc job present')


if (!clientBranch.includes('scopeIsHiTech && !isKrcHiTechClient')) {
  fail('sitesForBranch / filterClientsForBranch must filter Hi-Tech to KRC only')
} else ok('sitesForBranch filters Hi-Tech to KRC')

if (/branchId === ['\"]br15['\"]/.test(clientBranch)) {
  fail('Do not hardcode br15 as Hi-Tech — live Data Bank uses br15 for Mumbai')
} else ok('Hi-Tech is not hardcoded to br15')

if (!clientBranch.includes("key === 'MUMBAI'") && !clientBranch.includes("key === \"MUMBAI\"")) {
  fail('isHiTechCityBranch must refuse Mumbai (live id br15 must not get the KRC-only filter)')
} else ok('Mumbai is never treated as Hi-Tech / KRC-only')

const m = geo.match(/\{[^}]*group:\s*'HI-TECH CITY'[^}]*\}/)
const block = m ? m[0] : ''
if (!block) {
  fail('geo-resolve HI-TECH CITY rule block not found')
} else if (/gachibowli|madhapur|kondapur|nanakramguda|financial\s\*district|hi\[\\s\\\\-\]\?tech\\s\*city|hitech\\s\*city/i.test(block)) {
  fail('geo-resolve HI-TECH CITY rule must not include Gachibowli / Madhapur / bare hi-tech city')
} else if (!/krc|raheja|mind|sundew|stargaze|pocharam/i.test(block)) {
  fail('geo-resolve HI-TECH CITY rule should match KRC / Mindspace family')
} else if (!geo.includes("geoKey === 'HI-TECH CITY' && !siteLooksLikeKrc")) {
  fail('reassignClientsBySiteGeo must refuse non-KRC → Hi-Tech')
} else ok('geo-resolve Hi-Tech is KRC-family only')

if (/gachibowli/i.test(geo) && !/group: 'HYDERABAD-A'/.test(geo)) {
  fail('gachibowli should map to Hyderabad-A')
} else if (/gachibowli/i.test(geo)) {
  ok('gachibowli present for Hyderabad-A path')
}

// Seed sanity: every br15 site must be KRC-family
try {
  const seed = require(path.join(root, 'api/_lib/mis/clients-seed.json'))
  const br15 = seed.filter((c) => c.branchId === 'br15')
  const bad = br15.filter((c) => {
    const blob = `${c.name || ''} ${c.location || ''}`.toUpperCase()
    return !(
      /\bKRC\b/.test(blob) ||
      /K\s*RAHEJA|RAHEJA\s*CORP|MIND\s*A?SPACE|SUNDEW|STARGAZE|NEWFOUND|POCHARAM|J\.?\s*T\.?\s*HOLD|KRIT/.test(
        blob,
      )
    )
  })
  if (!br15.length) fail('clients-seed has no br15 (Hi-Tech) rows')
  else if (bad.length) fail(`clients-seed br15 has ${bad.length} non-KRC rows`)
  else ok(`clients-seed Hi-Tech (${br15.length}) are all KRC-family`)
} catch (e) {
  fail(`seed check: ${e.message}`)
}

if (failed) {
  console.error('\ncheck:hitech-krc FAILED\n')
  process.exit(1)
}
console.log('\ncheck:hitech-krc OK')
