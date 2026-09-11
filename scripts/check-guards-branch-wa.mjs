#!/usr/bin/env node
/**
 * Lock: Branch WhatsApp Groups removed — WhatsApp was blocking.
 *   node scripts/check-guards-branch-wa.mjs
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
const lib = fs.readFileSync(path.join(root, 'api/_lib/guards/branch-wa-groups.ts'), 'utf8')
const help = fs.readFileSync(path.join(root, 'api/_lib/guards/page-help.ts'), 'utf8')

if (app.includes('Branch WhatsApp Groups') || app.includes('rWaGroups') || app.includes('waConnectQr')) {
  fail('Guards menus must not show Branch WhatsApp Groups or Connect')
} else ok('Branch WhatsApp Groups is off the Guards menus')

if (help.includes('Branch WhatsApp Groups')) {
  fail('Guards page help must not mention Branch WhatsApp Groups')
} else ok('Page help no longer mentions branch groups')

if (data.includes('createOrUpdateBranchWaGroup') || data.includes('waLoginQr')) {
  fail('guards/data.ts must not create groups or ask WhatsApp to Connect')
} else ok('Create / Connect APIs are gone')

if (!data.includes('Branch WhatsApp groups have been removed') || !data.includes('disconnectUnofficialWhatsAppOnce')) {
  fail('leftover group actions must refuse and disconnect the computer WhatsApp')
} else ok('Leftover group actions refuse and disconnect')

if (!lib.includes('WA_GROUP_AUTOMATION_HALTED = true') || !lib.includes('disconnectUnofficialWhatsAppOnce')) {
  fail('WhatsApp group automation must stay halted')
} else ok('Group automation stays halted')

const invite = fs.readFileSync(path.join(root, 'api/_lib/guards/branch-wa-invite-send.ts'), 'utf8')
if (invite.includes('waCreateGroup') || invite.includes('waAddGroupParticipants')) {
  fail('branch invite send must not create groups or add members by computer')
} else ok('Branch invite send is join-link only')

if (failed) {
  console.error('\ncheck:guards-branch-wa FAILED\n')
  process.exit(1)
}
console.log('\ncheck:guards-branch-wa OK')
