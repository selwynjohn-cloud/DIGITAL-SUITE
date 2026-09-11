#!/usr/bin/env node
/**
 * Lock: Agile CRM must keep Security Survey + Tender menus on Staff and Management.
 *   npm run check:crm-menus
 *   npm run check:crm-menus -- --probe
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const probe = process.argv.includes('--probe')
let failed = false

function fail(msg) {
  console.error('FAIL:', msg)
  failed = true
}
function ok(msg) {
  console.log('OK:', msg)
}

const app = fs.readFileSync(path.join(root, 'api/crm/app.ts'), 'utf8')
const data = fs.readFileSync(path.join(root, 'api/crm/data.ts'), 'utf8')

for (const needle of ['Security Survey', 'Tender Lead', 'Tender Reader', 'Tender History', 'function securitySurvey', 'function tenderLeads']) {
  if (!app.includes(needle)) fail(`crm/app.ts missing ${needle}`)
  else ok(`crm/app.ts has ${needle}`)
}

if (app.includes("['m4','m5','m6','m10'].forEach") && app.includes("ROLE==='admin'||ROLE==='coordinator'")) {
  fail('CRM must not hide Tender menus from Staff / HOD')
} else {
  ok('CRM keeps Survey + Tender menus visible')
}

if (!data.includes('getSecuritySurveysNormalized') || !data.includes('getTendersNormalized')) {
  fail('crm/data.ts must load surveys and tenders')
} else {
  ok('crm/data.ts loads surveys and tenders')
}

if (!app.includes("'Tender cancelled'") || !app.includes('Tender cancelled')) {
  fail('Tender Lead Status must include Tender cancelled')
} else {
  ok('Tender Lead Status has Tender cancelled')
}
const store = fs.readFileSync(path.join(root, 'api/_lib/crm/store.ts'), 'utf8')
if (!store.includes("'Tender cancelled'")) {
  fail('crm store TENDER_STATUS must include Tender cancelled')
} else {
  ok('crm store TENDER_STATUS has Tender cancelled')
}

if (probe) {
  const url = 'https://www.agilegroup-digital.co.in/crm/?portal=management&fresh=1'
  try {
    const res = await fetch(url, { redirect: 'follow' })
    const html = await res.text()
    if (!res.ok) fail(`probe ${url} → HTTP ${res.status}`)
    else if (!html.includes('Security Survey') || !html.includes('Tender Lead')) {
      fail('live CRM missing Security Survey or Tender Lead')
    } else ok('probe live CRM has Survey + Tender')
  } catch (e) {
    fail(`probe ${url}: ${e.message}`)
  }
}

if (failed) {
  console.error('\ncheck:crm-menus FAILED\n')
  process.exit(1)
}
console.log('\ncheck:crm-menus OK')
