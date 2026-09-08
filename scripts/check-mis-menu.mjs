#!/usr/bin/env node
/**
 * Lock MIS bottom menu order (HOD + Management):
 * Client Complaints → Incident Reporting → Daily MIS Submission → Site Security Assessment (SSA) → Master Directory
 *
 *   npm run check:mis-menu
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
let failed = false
function fail(msg) {
  console.error('FAIL:', msg)
  failed = true
}
function ok(msg) {
  console.log('OK:', msg)
}

function orderOk(src, labels, label) {
  let last = -1
  for (const name of labels) {
    const i = src.indexOf(`['${name}'`)
    if (i < 0) {
      fail(`${label} missing ${name}`)
      return
    }
    if (i < last) {
      fail(`${label} ${name} is out of order`)
      return
    }
    last = i
  }
  ok(`${label} bottom order locked`)
}

const locked = [
  'Client Complaints',
  'Incident Reporting',
  'Daily MIS Submission',
  'Site Security Assessment (SSA)',
  'Master Directory',
]
orderOk(fs.readFileSync(path.join(root, 'api/_lib/mis/staff-layout.ts'), 'utf8'), locked, 'HOD')
orderOk(fs.readFileSync(path.join(root, 'api/_lib/mis/layout.ts'), 'utf8'), locked, 'Management')

for (const [file, label] of [
  ['api/_lib/mis/staff-layout.ts', 'HOD'],
  ['api/_lib/mis/layout.ts', 'Management'],
]) {
  const src = fs.readFileSync(path.join(root, file), 'utf8')
  if (src.includes("On Site Tactical Training (OJT)")) {
    fail(`${label} still has On Site Tactical Training (OJT) menu — must be removed`)
  } else {
    ok(`${label} On Site Tactical Training menu removed`)
  }
}

const controlConsole = fs.readFileSync(path.join(root, 'api/_lib/control/console.ts'), 'utf8')
if (!controlConsole.includes('nightvehicles') || !controlConsole.includes('acceptVehicle')) {
  fail('Control missing Night Visit Vehicles / acceptVehicle')
} else {
  ok('Control Night Visit Vehicles + acceptVehicle present')
}
const controlData = fs.readFileSync(path.join(root, 'api/control/data.ts'), 'utf8')
if (!controlData.includes('acceptVehicleAllotment') || !controlData.includes('listNightVisitVehicles')) {
  fail('Control data missing acceptVehicleAllotment / listNightVisitVehicles')
} else {
  ok('Control vehicle allotment API present')
}
const applyFile = path.join(root, 'api/_lib/mis/apply-vehicle-allotment-from-control.ts')
if (!fs.existsSync(applyFile)) {
  fail('Missing apply-vehicle-allotment-from-control.ts')
} else {
  ok('MIS vehicle allotment from Control present')
}

const extra = spawnSync(process.execPath, [path.join(root, 'scripts/check-mis-special-survey.mjs')], {
  stdio: 'inherit',
})
if (extra.status !== 0) failed = true

const visits = spawnSync(process.execPath, [path.join(root, 'scripts/check-mis-client-visits.mjs')], {
  stdio: 'inherit',
})
if (visits.status !== 0) failed = true

const night = spawnSync(process.execPath, [path.join(root, 'scripts/check-mis-night-visit.mjs')], {
  stdio: 'inherit',
})
if (night.status !== 0) failed = true

const lateDuty = spawnSync(process.execPath, [path.join(root, 'scripts/check-mis-late-duty.mjs')], {
  stdio: 'inherit',
})
if (lateDuty.status !== 0) failed = true

if (failed) {
  console.error('\ncheck:mis-menu FAILED\n')
  process.exit(1)
}
console.log('\ncheck:mis-menu OK')
