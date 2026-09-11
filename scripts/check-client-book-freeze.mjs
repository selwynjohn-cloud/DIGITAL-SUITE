#!/usr/bin/env node
/**
 * Director lock: client lists are the Daily MIS submitted on 14-08-2026.
 *
 *   npm run check:client-books
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

const freeze = fs.readFileSync(path.join(root, 'api/_lib/mis/client-book-freeze.ts'), 'utf8')
const store = fs.readFileSync(path.join(root, 'api/_lib/mis/store.ts'), 'utf8')
const cron = fs.readFileSync(path.join(root, 'api/mis/cron.ts'), 'utf8')
const clientBranch = fs.readFileSync(path.join(root, 'api/_lib/mis/client-branch.ts'), 'utf8')
const geo = fs.readFileSync(path.join(root, 'api/_lib/mis/client-branch-geo-resolve.ts'), 'utf8')

if (!freeze.includes("CLIENT_BOOK_FREEZE_DATE = '2026-08-14'") || !freeze.includes('freezeClientBooksFromReport')) {
  fail('client-book-freeze must lock lists from Daily MIS 2026-08-14')
} else if (!freeze.includes('lockRank') || !freeze.includes('nameKey')) {
  fail('freeze must match each branch report first (Tada / Hi-Tech before neighbours)')
} else if (!freeze.includes('Kakinada left unchanged') || !freeze.includes('Do not run applyKakinadaBookFromReport')) {
  fail('All-branch freeze must leave Kakinada unchanged')
} else if (!freeze.includes('strictRealignHydFamilyBooks') || !freeze.includes('Hyd family realigned')) {
  fail('Freeze must strictly realign Hyderabad-A / B / Hi-Tech from the freeze-date reports')
} else if (!freeze.includes('resolveBranchFromSiteGeo') || !freeze.includes('(zone B)')) {
  fail('Hyd realign must move clear Hyd-B localities off Hyderabad-A')
} else ok('freeze uses Daily MIS 14-08-2026 (Hyd protected; Kakinada unchanged)')

if (!store.includes('CLIENT_BOOK_FREEZE_KEY') || !store.includes('branchFrozen')) {
  fail('store must persist the freeze stamp and branchFrozen flag')
} else ok('store keeps the freeze stamp')

if (!store.includes('HODs may add / edit / deactivate') || store.includes('otherwise Hyd-A kept showing Hyd-B leftovers forever')) {
  fail('restore must not auto-prune HOD Master Directory extras off the freeze list')
} else ok('frozen restore does not wipe HOD Master Directory edits')

if (!store.includes('if (!frozen?.date)') || !store.includes('freezeClientBooksFromReport')) {
  fail('restoreMasterDirectoryIfNeeded must freeze once and then skip geo moves')
} else ok('directory restore freezes then skips geo')

if (!store.includes('12-08 Kakinada file is NRI/SRMT only')) {
  fail('Kakinada restore must not rebuild the plant book from the thin 12-08 file')
} else ok('Kakinada restore leaves the frozen plant book alone')

if (!cron.includes("job === 'freeze-client-books'")) {
  fail('mis/cron must expose freeze-client-books')
} else ok('cron freeze-client-books present')

if (!freeze.includes('applyKakinadaTerminatedAndNri')) {
  fail('freeze must drop terminated SRMT and keep the NRI site on Kakinada')
} else ok('freeze applies Kakinada SRMT/NRI lock')

if (!freeze.includes("KAKINADA_CLIENT_BOOK_DATE = '2026-08-12'") || !freeze.includes('applyKakinadaBookFromReport')) {
  fail('Kakinada book must freeze from Daily MIS 2026-08-12')
} else ok('Kakinada book uses Daily MIS 12-08-2026')

if (
  !clientBranch.includes('isTadaBookClient') ||
  !clientBranch.includes('evacuateNonTadaBookFromTada') ||
  !clientBranch.includes('scopeIsTada && !isTadaBookClient')
) {
  fail('Tada must show only Premier Energies, Naidupetta')
} else ok('Tada list is Premier Energies, Naidupetta only')

if (!/group:\s*'TADA'/.test(geo) || !/premier\\s\*energies/i.test(geo)) {
  fail('geo-resolve must send Premier Energies Naidupeta to Tada')
} else if (/tada\|sri\\s\*city[\s\S]*group:\s*'TADA'/.test(geo)) {
  fail('HDFC Tada / Sri City must not geo-map onto Tada')
} else ok('only Premier Energies Naidupeta maps to Tada')

if (failed) {
  console.error('\ncheck:client-books FAILED\n')
  process.exit(1)
}
console.log('\ncheck:client-books OK')
