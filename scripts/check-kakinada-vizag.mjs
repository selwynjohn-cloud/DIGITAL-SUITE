#!/usr/bin/env node
/**
 * Lock: Kakinada book (Coromandel, Gemini, Divis, Kaleeswari, NRI site, Godavari HDFC/IDBI; SRMT terminated)
 * must not stay on Visakhapatnam.
 *
 *   npm run check:kakinada-vizag
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

const clientBranch = fs.readFileSync(path.join(root, 'api/_lib/mis/client-branch.ts'), 'utf8')
const geo = fs.readFileSync(path.join(root, 'api/_lib/mis/client-branch-geo-resolve.ts'), 'utf8')
const cron = fs.readFileSync(path.join(root, 'api/mis/cron.ts'), 'utf8')

if (
  !clientBranch.includes('moveKakinadaBookFromVizag') ||
  !clientBranch.includes('isKakinadaBookClient') ||
  !clientBranch.includes('filterDeployRowsForVizag')
) {
  fail('client-branch.ts must export Kakinada-from-Vizag helpers')
} else ok('Kakinada-from-Vizag helpers present')

if (!clientBranch.includes('scopeIsVizag && (isKakinadaBookClient(c) || isSrmtClient(c))')) {
  fail('sitesForBranch / filterClientsForBranch must hide Kakinada book on Vizag')
} else ok('Vizag lists hide the Kakinada book')

if (clientBranch.includes('scopeIsKakinada && isForbiddenOnKakinada')) {
  fail('do not hide the Kakinada book on the Kakinada dropdown')
} else ok('Kakinada dropdown is not hiding its own book')

if (!cron.includes("job === 'move-kakinada-from-vizag'")) {
  fail('mis/cron must expose move-kakinada-from-vizag')
} else ok('cron move-kakinada-from-vizag present')

if (!cron.includes('freezeKakinadaBookFromReport') || !cron.includes('KAKINADA_CLIENT_BOOK_DATE')) {
  fail('kakinada-audit must apply the 12-08-2026 Kakinada book')
} else ok('kakinada-audit applies the 12-08-2026 book')

if (!/group:\s*'KAKINADA'/.test(geo) || !/coromandel/i.test(geo)) {
  fail('geo-resolve must send Coromandel to Kakinada')
} else ok('Coromandel maps to Kakinada')

if (!/sreerama|nri\\s\*site/i.test(geo)) {
  fail('geo-resolve must send the NRI site to Kakinada')
} else ok('NRI site maps to Kakinada')

if (!geo.includes("geoKey === 'VISAKHAPATNAM' && siteLooksLikeKakinadaBook")) {
  fail('reassignClientsBySiteGeo must refuse Kakinada book → Vizag')
} else ok('geo-resolve refuses Kakinada book onto Vizag')

if (
  !clientBranch.includes('evacuateKakinadaLeftovers') ||
  !clientBranch.includes('isKakinadaLeftoverClient') ||
  !clientBranch.includes('scopeIsKakinada && isKakinadaLeftoverClient')
) {
  fail('Kakinada must hide and evacuate Eluru / Bhimavaram / SBI / Divis Telangana')
} else ok('Kakinada leftover hide + evacuate present')

if (!cron.includes("job === 'clean-kakinada-leftovers'")) {
  fail('mis/cron must expose clean-kakinada-leftovers')
} else ok('cron clean-kakinada-leftovers present')

if (/kakinada\|rajahmundry\|eluru\|bhimavaram/.test(geo)) {
  fail('geo-resolve must not dump Eluru / Bhimavaram onto Kakinada')
} else ok('Eluru / Bhimavaram are not mapped to Kakinada')

if (!/divi'?s[\s\S]*HYDERABAD-B|group:\s*'HYDERABAD-B'/.test(geo) || !/telangana|choutuppal/i.test(geo)) {
  fail('geo-resolve must send Divis Telangana to Hyderabad-B')
} else ok('Divis Telangana maps to Hyderabad-B')

if (!clientBranch.includes('isKakinadaNriSite') || !clientBranch.includes('applyKakinadaTerminatedAndNri')) {
  fail('Kakinada must keep the NRI site and drop terminated SRMT')
} else if (!clientBranch.includes('scopeIsKakinada && isSrmtClient')) {
  fail('Kakinada lists must hide SRMT (terminated)')
} else ok('Kakinada keeps NRI site and hides SRMT')

const freezeSrc = fs.readFileSync(path.join(root, 'api/_lib/mis/client-book-freeze.ts'), 'utf8')
if (!freezeSrc.includes("KAKINADA_CLIENT_BOOK_DATE = '2026-08-12'")) {
  fail('Kakinada clients must refer Daily MIS 12-08-2026')
} else ok('Kakinada clients refer 12-08-2026')

if (failed) {
  console.error('\ncheck:kakinada-vizag FAILED\n')
  process.exit(1)
}
console.log('\ncheck:kakinada-vizag OK')
