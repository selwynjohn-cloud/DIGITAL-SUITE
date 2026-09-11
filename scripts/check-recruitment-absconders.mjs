#!/usr/bin/env node
/**
 * Lock: Recruitment Absconder List (7+ days)
 *   node scripts/check-recruitment-absconders.mjs
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

const att = fs.readFileSync(path.join(root, 'api/_lib/recruitment/work360-attendance.ts'), 'utf8')
const app = fs.readFileSync(path.join(root, 'api/recruitment/app.ts'), 'utf8')
const data = fs.readFileSync(path.join(root, 'api/recruitment/data.ts'), 'utf8')
const abs = fs.readFileSync(path.join(root, 'api/_lib/recruitment/absconder.ts'), 'utf8')
const funnel = fs.readFileSync(path.join(root, 'api/_lib/recruitment/funnel-followup-pages.ts'), 'utf8')

if (att.includes('byDate.size >= 3')) fail('Must not stop attendance sync after 3 days (HDFC-only bug)')
else ok('Attendance sync does not stop after first client with 3 days')

if (/MAX_CLIENTS\s*=\s*8\b/.test(att)) fail('MAX_CLIENTS must pull more than 8 Work360 clients')
else ok('Attendance sync pulls many Work360 clients')

if (!att.includes('enrichMarkFromDirectory')) fail('Attendance marks must fill name/mobile from employee directory')
else ok('Name / mobile filled from employee directory')

if (/employee:\s*'guardName'/.test(att)) fail('Employee column must map to Id, not name')
else ok('Employee column maps to Id No.')

if (!app.includes('Sl.No.') || !app.includes('Guards Name') || !app.includes('Id No.') || !app.includes('Mobile Number')) {
  fail('Absconder table missing required columns')
} else ok('Columns include Sl.No., Guards Name, Id No., Mobile Number')

if (!app.includes('Absent since') || !app.includes('>Call<') || !app.includes('WhatsApp') || !app.includes('Reminder') || !app.includes('Joined') || !app.includes('Pending')) {
  fail('Absconder table missing Call / WhatsApp / Reminder / Joined / Pending')
} else ok('Call, WhatsApp, Reminder, Joined, Pending present')

if (!app.includes('shareAbsconderList') || !app.includes('downloadAbsconderPdf') || !data.includes("action === 'shareAbsconders'")) {
  fail('Share list and Download PDF required')
} else ok('Share list and Download PDF wired')

if (
  !abs.includes('TERMINATION NOTICE') ||
  !abs.includes('Identity Card') ||
  !abs.includes('Uniform') ||
  !abs.includes('absconderTerminationNoticeText')
) {
  fail('Termination notice must say they took company Identity Card and Uniform')
} else ok('Termination notice names ID card and Uniform')

if (
  !data.includes("action === 'previewAbsconderTermination'") ||
  !data.includes("action === 'sendAbsconderTermination'") ||
  !data.includes('waSendText')
) {
  fail('Termination Preview + Send WhatsApp required')
} else ok('Termination Preview + Send WhatsApp wired')

if (
  !funnel.includes('ffTerminationPreview') ||
  !funnel.includes('ffTerminationSend') ||
  !funnel.includes('Send termination to this list') ||
  !app.includes('absconderTerminate')
) {
  fail('Termination buttons required on Absconder List (HOD and Management)')
} else ok('Termination buttons on Absconder List')

if (!app.includes('All Branches') || !app.includes("RECRUIT_ROLE==='branch'?'':")) {
  fail('Management All Branches; HOD locked to own branch')
} else ok('Management All Branches; HOD own branch only')

if (!abs.includes('sortAbscondersBranchWise') || !/highest absconder/i.test(abs)) {
  fail('Must sort branch-wise with highest absconders first')
} else ok('Branch-wise, highest absconders first')

if (!abs.includes('lastDateWith') || !abs.includes('daysBetween')) {
  fail('Absconders must use last present/leave date (missing days count as absent)')
} else ok('Last-present absconder count (does not break on missing days)')

/** onclick=' inside the PAGE template becomes a JS syntax error and kills Send PIN. */
if (app.includes("onclick=\\'")) {
  fail("Absconder onclick=\\' breaks the whole Recruitment page script — Send PIN never runs")
} else ok('Absconder buttons do not break the login PIN script')

try {
  const start = app.indexOf('const PAGE = `')
  if (start < 0) throw new Error('PAGE template missing')
  let i = start + 'const PAGE = `'.length
  let out = ''
  while (i < app.length) {
    const ch = app[i]
    if (ch === '\\') {
      out += app[i + 1]
      i += 2
      continue
    }
    if (ch === '`') break
    if (ch === '$' && app[i + 1] === '{') {
      let depth = 1
      i += 2
      while (i < app.length && depth) {
        if (app[i] === '{') depth += 1
        else if (app[i] === '}') depth -= 1
        i += 1
      }
      out += '""'
      continue
    }
    out += ch
    i += 1
  }
  const a = out.indexOf('<script>')
  const b = out.lastIndexOf('</script>')
  const funnel = fs.readFileSync(path.join(root, 'api/_lib/recruitment/funnel-followup-pages.ts'), 'utf8')
  const startF = funnel.indexOf('export const FUNNEL_FOLLOWUP_JS = `')
  const rawFunnel =
    startF >= 0 ? funnel.slice(startF + 'export const FUNNEL_FOLLOWUP_JS = `'.length, funnel.lastIndexOf('`')) : ''
  if (!rawFunnel) throw new Error('FUNNEL_FOLLOWUP_JS missing')
  const funnelJs = new Function('return `' + rawFunnel + '`')()
  if (/onclick="[^"]*getAttribute\('data-ff/.test(funnelJs)) {
    throw new Error('funnel JS has getAttribute single-quotes that break Send PIN')
  }
  const script = out
    .slice(a + 8, b)
    .replace('__RECRUIT_OTP_SCRIPT__', 'function otpSend(){}\nfunction otpBoot(){}\n')
  new Function(script)
  new Function(funnelJs)
  ok('Recruitment page script parses — Send PIN can run')
} catch (err) {
  fail('Recruitment page script is broken (login PIN will not send): ' + (err instanceof Error ? err.message : err))
}

if (failed) process.exit(1)
console.log('Recruitment absconder check passed')
