#!/usr/bin/env node
/**
 * Lock: Guards dashboard section order
 *   1. Dashboard (KPI cards)
 *   2. Branch-wise breakdown
 *   3. Time per department
 *   4. Complaint categories
 *   node scripts/check-guards-dashboard-order.mjs
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

function assertOrder(label, src, markers) {
  let last = -1
  for (const m of markers) {
    const i = src.indexOf(m)
    if (i < 0) {
      fail(`${label}: missing "${m}"`)
      return
    }
    if (i < last) {
      fail(`${label}: "${m}" is out of order`)
      return
    }
    last = i
  }
  ok(`${label}: ${markers.join(' → ')}`)
}

const app = fs.readFileSync(path.join(root, 'api/guards/app.ts'), 'utf8')
const dashStart = app.indexOf('function rDash()')
const dashEnd = app.indexOf('function regBranchForQr()')
if (dashStart < 0 || dashEnd < 0 || dashEnd <= dashStart) {
  fail('Could not find rDash() in api/guards/app.ts')
} else {
  const rDash = app.slice(dashStart, dashEnd)
  if (!rDash.includes("['total','Total']") || !rDash.includes("['received','Open']")) {
    fail('Dashboard KPI cards missing from rDash()')
  } else ok('Dashboard KPI cards present')
  assertOrder('Guards dashboard', rDash, [
    'class="kgrid"',
    'Branch-wise breakdown',
    'Time per department',
    'Complaint categories',
  ])
}

const poster = fs.readFileSync(path.join(root, 'api/_lib/guards/complaint-poster.ts'), 'utf8')
const register = fs.readFileSync(path.join(root, 'api/guards/register.ts'), 'utf8')
const vercel = fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')
if (
  !poster.includes('GUARDS_COMMON_REGISTER_URL') ||
  !poster.includes('/guards/register') ||
  !poster.includes('AGILE CONNECT') ||
  !poster.includes('Agile Security Force Private Limited') ||
  !poster.includes('Digital Operations Command Centre') ||
  !poster.includes('agile-logo-clear.png') ||
  !poster.includes('Give your Grievances') ||
  !poster.includes('Open Complaints form') ||
  !poster.includes('border:4px solid #c9a227') ||
  !poster.includes('8500915599') ||
  !poster.includes('9248707070') ||
  !poster.includes('securityjob.co.in') ||
  !poster.includes('News Channel') ||
  !poster.includes('www.tinyurl.com/Security-News') ||
  !poster.includes('Honouring Our Guards') ||
  !poster.includes('GUARDS_CONNECT_URL') ||
  poster.includes('One QR code to Agile Connect') ||
  !poster.includes('guards-connect-poster.jpg') ||
  !fs.existsSync(path.join(root, 'public/guards-connect-poster.jpg')) ||
  poster.includes('CONFIDENTIAL &amp; DIRECT SUPPORT') ||
  poster.includes('PROTECTING WHAT MATTERS') ||
  poster.includes('branch=Hyderabad-A') ||
  !app.includes('complaint-poster') ||
  !app.includes('Common QR — all branches') ||
  !vercel.includes('/guards/complaint-poster') ||
  !vercel.includes('"/guards/connect"') ||
  !vercel.includes('/guards/links') ||
  !poster.includes('GUARDS_CONNECT_LINKS_URL') ||
  !poster.includes('function guardsConnectLinksHtml') ||
  !vercel.includes('"/api/guards/register"') ||
  !register.includes('pick your branch')
) {
  fail('Common Guards complaint poster / QR (all branches) missing')
} else ok('Common Guards complaint poster (Agile Connect, all branches)')

const notify = fs.readFileSync(path.join(root, 'api/_lib/guards/notify.ts'), 'utf8')
const mailStart = notify.indexOf('const bodyHtml')
const mailEnd = notify.indexOf('export async function sendDashboardShareMail')
if (mailStart < 0 || mailEnd < 0 || mailEnd <= mailStart) {
  fail('Could not find dashboard share mail in notify.ts')
} else {
  assertOrder('Dashboard share mail', notify.slice(mailStart, mailEnd), [
    '${kpis}',
    'Branch-wise breakdown',
    'Time per department',
    'Complaint categories',
  ])
}

if (failed) process.exit(1)
console.log('Guards dashboard order check passed')
