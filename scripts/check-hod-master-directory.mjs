#!/usr/bin/env node
/**
 * HOD Master Directory — add/edit/deactivate + company search + Director mail.
 *   npm run check:hod-master-directory
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const fail = (m) => {
  console.error('FAIL:', m)
  process.exitCode = 1
}

const staff = readFileSync(join(root, 'api/mis/staff.ts'), 'utf8')
const data = readFileSync(join(root, 'api/mis/staff-data.ts'), 'utf8')
const store = readFileSync(join(root, 'api/_lib/mis/store.ts'), 'utf8')
const alert = readFileSync(join(root, 'api/_lib/mis/directory-change-alert.ts'), 'utf8')
const menu = readFileSync(join(root, 'api/_lib/mis/staff-layout.ts'), 'utf8')
const mgmt = readFileSync(join(root, 'api/_lib/mis/layout.ts'), 'utf8')

if (!menu.includes("['Master Directory'")) fail('Staff menu missing Master Directory')
if (!mgmt.includes("['Master Directory'")) fail('Management menu missing Master Directory')
if (!staff.includes('searchCompany') || !staff.includes('addFromSearch')) {
  fail('Staff Master Directory UI must search company clients and add to branch')
}
if (!data.includes("action === 'searchCompanyClients'")) fail('staff-data missing searchCompanyClients')
if (!data.includes("action === 'addFromMaster'")) fail('staff-data missing addFromMaster')
if (!data.includes("action === 'addSite'") || !data.includes("action === 'saveSite'")) {
  fail('staff-data missing addSite/saveSite')
}
if (!data.includes("action === 'toggleSite'")) fail('staff-data missing toggleSite')
if (!data.includes('confirmed !== true') && !data.includes("body.confirmed !== true")) {
  fail('HOD master changes must require confirmed=true')
}
if (!staff.includes('RECONFIRM')) fail('HOD UI must show RECONFIRM popup')
if (!store.includes('clientEmail')) fail('Master Directory must keep clientEmail for Client door')
if (!staff.includes('Client email (Client door)') && !staff.includes('addEmail')) {
  fail('HOD Master Directory must collect client email for Client door')
}
if (!store.includes('sortClientsAlpha')) fail('store must sort masters alphabetically')
if (!store.includes('allowRestore') || store.includes('Heal missing sites from last report even on Daily MIS')) {
  fail('Daily MIS must not auto-restore / reshape client masters')
}

if (process.exitCode) {
  console.error('\ncheck:hod-master-directory FAILED\n')
  process.exit(1)
}
console.log('\ncheck:hod-master-directory OK')
