#!/usr/bin/env node
/**
 * HDFC SSA branch reminder — email copy + Management UI hooks.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildHdfcBranchRemindEmail } from '../api/_lib/mis/hdfc-ssa-branch-remind.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
let failed = false
function fail(msg) {
  console.error('FAIL:', msg)
  failed = true
}
function ok(msg) {
  console.log('OK:', msg)
}

const mail = buildHdfcBranchRemindEmail({
  branchName: 'Hyderabad-A',
  submitted: 2,
  totalSites: 10,
  incomplete: [
    {
      company: 'HDFC BANK LIMITED',
      location: 'Gachibowli',
      status: 'Draft',
      pages: '4 / 15',
      surveyedBy: 'Ravi',
    },
  ],
  waitingForward: 1,
  note: 'Please finish this week.',
  actorEmail: 'director@agilegroup.co.in',
})
if (!mail.subject.includes('Hyderabad-A') || !mail.subject.startsWith('[Reminder] HDFC')) {
  fail('branch remind subject must name the branch')
} else ok('branch remind subject names the branch')
if (
  !mail.text.includes('one email') &&
  !mail.text.includes('Submit to HOD') &&
  !mail.text.includes('Gachibowli')
) {
  fail('branch remind body must list incomplete sites and Submit to HOD')
} else if (!mail.text.includes('Gachibowli') || !mail.text.includes('Submit to HOD')) {
  fail('branch remind body must list incomplete sites and Submit to HOD')
} else ok('branch remind body lists incomplete sites')
if (!mail.text.includes('/mis-hdfc-survey') || !mail.text.includes('Please finish this week.')) {
  fail('branch remind body must include public form + management note')
} else ok('branch remind body has public form + note')

const empty = buildHdfcBranchRemindEmail({
  branchName: 'Nellore',
  submitted: 0,
  totalSites: 5,
  incomplete: [],
  waitingForward: 0,
  note: '',
  actorEmail: 'director@agilegroup.co.in',
})
if (!empty.text.includes('No incomplete drafts on file')) {
  fail('empty branch remind must still ask the team to start')
} else ok('empty branch remind still asks the team to start')

const ui = fs.readFileSync(path.join(root, 'api/_lib/mis/periodical-survey-ui.ts'), 'utf8')
if (!ui.includes('function remindHdfcBranch') || !ui.includes("surveyKind:'hdfc'")) {
  fail('UI must send periodicalSurveyRemind with surveyKind hdfc')
} else ok('UI sends periodicalSurveyRemind for one HDFC branch')

if (failed) process.exit(1)
console.log('check:hdfc-ssa-branch-remind OK')
