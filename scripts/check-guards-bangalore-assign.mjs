#!/usr/bin/env node
/**
 * Lock: Guards assign — Ops = complaint branch only; Dept = company-wide.
 *   node scripts/check-guards-bangalore-assign.mjs
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

const store = fs.readFileSync(path.join(root, 'api/_lib/guards/store.ts'), 'utf8')
const app = fs.readFileSync(path.join(root, 'api/guards/app.ts'), 'utf8')
const data = fs.readFileSync(path.join(root, 'api/guards/data.ts'), 'utf8')

if (!store.includes("karnataka: 'Bangalore'") || !store.includes("bengaluru: 'Bangalore'")) {
  fail('Guards store must alias Karnataka / Bengaluru → Bangalore')
} else ok('Guards store aliases Karnataka / Bengaluru → Bangalore')

if (!app.includes("if(kind==='dept') return list;")) {
  fail('staffForBranch: Department must be company-wide (same for all branches)')
} else ok('Department staff is company-wide')

if (!app.includes('never fall back to Visakhapatnam') && !app.includes('ONLY the complaint')) {
  fail('Ops staffForBranch must not fall back to other cities')
} else ok('Ops assign stays on complaint branch only')

if (app.includes('return list.slice();') && app.includes('staffForBranch')) {
  // Old bug: Management fell back to all cities when Bangalore Ops empty
  const fn = app.slice(app.indexOf('function staffForBranch'), app.indexOf('function branchLabel'))
  if (fn.includes('return list.slice()')) {
    fail('staffForBranch must not return list.slice() (that showed Visakhapatnam on Bangalore)')
  } else ok('No all-city Ops fallback in staffForBranch')
} else ok('No all-city Ops fallback in staffForBranch')

if (!app.includes('Always refresh lists from this case') && !app.includes('Array.isArray(d.opsStaff)')) {
  fail('openCase must refresh Ops/Dept from caseDetail')
} else ok('openCase refreshes Ops/Dept from caseDetail')

if (!data.includes('Ops = same branch as complaint') && !data.includes('company-wide')) {
  fail('caseDetail must scope Ops by branch and Dept company-wide')
} else ok('caseDetail: Ops branch-only, Dept company-wide')

if (data.includes('Department staff may be from any branch') || data.includes('company-wide list')) {
  ok('assignComplaint allows Dept from any branch')
} else fail('assignComplaint must allow company-wide Department staff')

const dir = fs.readFileSync(path.join(root, 'api/_lib/guards/directory-staff.ts'), 'utf8')
if (!dir.includes('mergeOpsWithDirectory') || !dir.includes('isGuardsDirectoryLeader') || !dir.includes('misops:')) {
  fail('directory-staff must merge User Management HODs / Operation Managers into Ops')
} else ok('User Management HODs / Operation Managers merge into Ops')

if (!data.includes('mergeOpsWithDirectory') || !data.includes('findOpsInDirectoryOrSaved')) {
  fail('guards data must load and assign User Management HODs / Operation Managers')
} else ok('Guards data uses User Management HOD / Operation Manager list')

if (!app.includes('hodMatchesBranch') || !app.includes('HOD / Operation Manager')) {
  fail('Assign / Remind UI must list HOD and Operation Manager')
} else ok('Assign / Remind UI lists HOD and Operation Manager')

const hod = fs.readFileSync(path.join(root, 'api/_lib/guards/hod-contacts.ts'), 'utf8')
if (!hod.includes('isGuardsDirectoryLeader') || !hod.includes('roleLabel')) {
  fail('HOD remind list must come from User Management with role labels')
} else ok('HOD remind list uses User Management')

if (!dir.includes('mergeDeptWithDirectory') || !dir.includes('hr@agilegroup.co.in') || !dir.includes('guardsHrDeptRow')) {
  fail('Department list must always include HR (hr@agilegroup.co.in)')
} else ok('HR is merged into Department assign / remind')

if (!data.includes('mergeDeptWithDirectory') || !data.includes('findDeptInDirectoryOrSaved')) {
  fail('Guards data must load and assign HR / directory Department staff')
} else ok('Guards data uses directory Department list including HR')

if (!app.includes('esc(o.email)') || !app.includes('HOD / Operation Manager')) {
  fail('Assign dropdown must show HOD / staff email')
} else ok('Assign dropdown shows HOD email')

if (!app.includes('esc(hod.email)') && !app.includes("esc(em)")) {
  fail('Remind HOD dropdown must show HOD email')
} else ok('Remind HOD dropdown shows HOD email')

if (store.includes("patch.deptStaffEmail = ''") && store.includes('healComplaintAssignments')) {
  const fn = store.slice(store.indexOf('export async function healComplaintAssignments'), store.indexOf('export function complaintMatchesBranch'))
  if (fn.includes("patch.deptStaffId = ''")) {
    fail('healComplaintAssignments must not strip company-wide Department / HR')
  } else ok('Department / HR assignments are not stripped by branch')
} else ok('Department / HR assignments are not stripped by branch')

if (failed) {
  console.error('\ncheck:guards-bangalore-assign FAILED\n')
  process.exit(1)
}
console.log('\ncheck:guards-bangalore-assign OK')
