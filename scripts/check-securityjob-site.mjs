#!/usr/bin/env node
/**
 * Freeze: updated SecurityJob public site (19 Aug 2026) — never the old short page
 * or Command Centre. Run: npm run check:securityjob-site
 *                         npm run check:securityjob-site -- --probe
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const probe = process.argv.includes('--probe')

function read(rel) {
  return readFileSync(resolve(root, rel), 'utf8')
}

function fail(msg) {
  throw new Error(msg)
}

function mustInclude(file, needle, why) {
  const text = read(file)
  if (!text.includes(needle)) fail(`${file} missing ${why}: ${needle}`)
}

function mustNotInclude(file, needle, why) {
  const text = read(file)
  if (text.includes(needle)) fail(`${file} must not have ${why}: ${needle}`)
}

function mustExist(rel, why) {
  if (!existsSync(resolve(root, rel))) fail(`missing ${why}: ${rel}`)
}

mustInclude('middleware.ts', "host === 'securityjob.co.in'", 'apex host')
mustInclude('middleware.ts', "host === 'www.securityjob.co.in'", 'www host')
mustInclude('middleware.ts', '/api/securityjob/site', 'public site rewrite')
mustInclude('middleware.ts', '/api/securityjob/admin', 'admin rewrite')
mustInclude('middleware.ts', "p.startsWith('/api/')", 'leave APIs alone')
mustInclude('middleware.ts', '/api/securityjob/bust', 'old Command Centre scripts must not boot')
mustInclude('middleware.ts', "p === '/' || p === '' || p === '/jobs'", 'home page must open the job site, not a cached old page')
mustInclude('middleware.ts', "url.pathname = '/api/securityjob/site'", 'home and /jobs rewrite to the updated site')
mustInclude('api/securityjob/bust.ts', "location.replace('/jobs')", 'bust script opens the job page')

const vercel = JSON.parse(read('vercel.json'))
const rewrites = Array.isArray(vercel.rewrites) ? vercel.rewrites : []
const hostRewrites = rewrites.filter(
  (r) =>
    Array.isArray(r.has) &&
    r.has.some((h) => h.type === 'host' && String(h.value || '').includes('securityjob.co.in')),
)
if (!hostRewrites.some((r) => r.destination === '/api/securityjob/site')) {
  fail('vercel.json must host-rewrite securityjob.co.in to /api/securityjob/site')
}
if (!hostRewrites.some((r) => r.destination === '/api/securityjob/admin')) {
  fail('vercel.json must host-rewrite securityjob.co.in /admin to /api/securityjob/admin')
}
const redirects = Array.isArray(vercel.redirects) ? vercel.redirects : []
if (
  redirects.some(
    (r) =>
      r.destination === '/jobs' &&
      Array.isArray(r.has) &&
      r.has.some((h) => h.type === 'host' && String(h.value || '').includes('securityjob.co.in')),
  )
) {
  fail('securityjob.co.in / must not bounce to /jobs — that opens the page in two stages')
}
mustInclude('api/securityjob/site.ts', 'rel="preload" as="image"', 'preload hero so the page opens in one step')
mustInclude('api/securityjob/site.ts', 'class="hero-bg"', 'one full-bleed hero photo')
mustInclude('api/securityjob/site.ts', 'object-position:center top', 'guard heads sit against the gold line, no zoom')
mustNotInclude('api/securityjob/site.ts', 'transform:scale(1.', 'do not zoom the hero photo')
mustNotInclude('api/securityjob/site.ts', 'hero-photo', 'do not split the hero into a second photo stage')

mustInclude('api/securityjob/site.ts', 'Start Your Career', 'public job hero')
mustInclude('api/securityjob/site.ts', 'Register Now — It\'s Free', 'registration CTA')
mustInclude('api/securityjob/site.ts', 'sj-site', 'version stamp so stale cache is visible')
mustInclude('api/securityjob/site.ts', 'getAnthems', 'updated anthem list')
mustInclude('api/securityjob/site.ts', 'getAcademyVideos', 'updated academy videos')
mustInclude('api/securityjob/site.ts', 'GROSS WAGES', 'updated wage label')
mustInclude('api/securityjob/site.ts', 'm-reg', 'mobile Register button')
mustInclude('api/securityjob/site.ts', 'sj-mobile', 'phone layout version stamp')
mustInclude('api/securityjob/site.ts', 'env(safe-area-inset-top)', 'iPhone notch space')
mustInclude('api/securityjob/site.ts', 'class="m-links"', 'phone section links')
mustInclude('api/securityjob/site.ts', 'class="m-dock"', 'phone Register bar at the bottom')
mustInclude('api/securityjob/site.ts', 'input[type=email]', 'email box sized for phones')
mustInclude('api/securityjob/site.ts', 'input[type=date]', 'date box sized for phones')
mustInclude('api/securityjob/site.ts', 'href="tel:', 'Help Line can be tapped on a phone')
mustInclude('api/securityjob/site.ts', 'Agile Group Recruitment Anthem', 'updated anthem heading')
mustInclude('api/securityjob/admin.ts', 'Our Academy Videos', 'admin can publish academy videos')
mustInclude('api/securityjob/admin.ts', 'Administrative &amp; Operations Banner', 'editable Admin/Ops banner')
mustInclude('api/securityjob/media-upload.ts', "kind === 'academy'", 'academy video upload')
mustInclude('api/_lib/securityjob/store.ts', 'sj:anthems', 'anthem store')
mustInclude('api/_lib/securityjob/store.ts', 'sj:academy-videos', 'academy video store')
mustInclude('api/_lib/securityjob/store.ts', 'song-tamil.mp3', 'Tamil anthem default')
mustInclude('api/_lib/securityjob/store.ts', 'song-malayalam.mp3', 'Malayalam anthem default')
mustInclude('api/securityjob/site.ts', 'Date of Birth', 'DOB on registration form')
mustInclude('api/securityjob/site.ts', 'f_dob', 'DOB field')
mustInclude('api/securityjob/site.ts', '18 years or above', 'form accepts age 18 and above')
mustInclude('api/securityjob/site.ts', 'age<18', 'form blocks under 18')
mustInclude('api/securityjob/register.ts', 'isAdultDob', 'server refuses under-18 registrations')
mustInclude('api/securityjob/register.ts', 'sendSjRegThankYouAskDate', 'registration sends thank-you WhatsApp to ask joining date')
mustInclude('api/securityjob/register.ts', 'await sendSjRegThankYouAskDate', 'WhatsApp ask is sent before the thank-you page closes')
mustInclude('api/securityjob/site.ts', 'When can you come to the Recruitment Centre?', 'thank-you page asks tentative date')
mustInclude('api/securityjob/site.ts', 'saveJoinChoice', 'thank-you page saves This week / Next week / date')
mustInclude('api/securityjob/site.ts', 'join_d', 'thank-you page uses day / month / year lists')
mustInclude('api/securityjob/site.ts', 'Registered List as Tentative date', 'thank-you page says the date goes on the list')
mustExist('api/securityjob/join-date.ts', 'join-date API')
mustInclude('api/securityjob/site.ts', 'within 24 hours', '24-hour contact promise')
mustExist('api/securityjob/media-upload.ts', 'media upload API')
mustExist('public/securityjob/song-tamil.mp3', 'Tamil anthem file')
mustExist('public/securityjob/song-malayalam.mp3', 'Malayalam anthem file')
mustExist('public/securityjob/hero.jpg', 'hero photo with smiling lady guard')
mustInclude('api/securityjob/site.ts', '/securityjob/hero.jpg', 'hero photo on public page')
mustNotInclude('api/securityjob/site.ts', 'TAKE HOME WAGES', 'old wage label')
mustNotInclude('api/securityjob/site.ts', '12 working hours', 'old 12-hour promise')
mustNotInclude('api/_lib/securityjob/store.ts', 'seed-ops-mumbai', 'do not add Mumbai ops as a job card')
mustNotInclude('api/_lib/securityjob/store.ts', 'Operations Team — Mumbai', 'ops requirement stays in the banner only')
mustNotInclude('api/securityjob/site.ts', 'Operations Team requirement', 'do not put ops cards above guard jobs')
mustInclude('api/securityjob/site.ts', 'securityjob-2026-08-19-gold', 'cache-bust version stamp')
mustInclude('api/securityjob/site.ts', '.adminbar .btn-gold{display:block;width:100%', 'gold bar stays inside the purple banner')
mustInclude('api/securityjob/admin.ts', 'Administrative &amp; Operations Banner', 'ops requirement is the editable banner')

if (probe) {
  const paths = ['/', '/jobs', '/login']
  for (const host of ['https://www.securityjob.co.in', 'https://securityjob.co.in']) {
    for (const path of paths) {
      const url = `${host}${path}?fresh=${Date.now()}`
      const res = await fetch(url, { redirect: 'follow', headers: { 'Cache-Control': 'no-cache' } })
      const html = await res.text()
      if (!res.ok) fail(`${url} returned ${res.status}`)
      if (html.includes('AGILEGROUP-DIGITAL — Agile Security Force — Command Centre')) {
        fail(`${url} leaked Command Centre`)
      }
      if (!html.includes('Start Your Career') && !html.includes('Security Guard Jobs')) {
        fail(`${url} is not the public SecurityJob site`)
      }
      if (!html.includes('GROSS WAGES')) fail(`${url} missing updated GROSS WAGES`)
      if (!html.includes('Recruitment Anthem')) fail(`${url} missing updated Recruitment Anthem`)
      if (!html.includes('Date of Birth')) fail(`${url} missing Date of Birth`)
      if (html.includes('Operations Team — Mumbai') || html.includes('Operations Team — Hyderabad')) {
        fail(`${url} must not show Mumbai / Hyderabad as job cards — banner only`)
      }
      if (html.includes('TAKE HOME WAGES')) fail(`${url} restored old TAKE HOME WAGES`)
    }
    const home = await fetch(`${host}/?fresh=${Date.now()}`, { redirect: 'manual', headers: { 'Cache-Control': 'no-cache' } })
    if (home.status >= 300 && home.status < 400) {
      fail(`${host}/ bounced (${home.status}) — page must open in one step`)
    }
    const admin = await fetch(`${host}/admin?fresh=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' } })
    const adminHtml = await admin.text()
    if (!admin.ok) fail(`${host}/admin returned ${admin.status}`)
    if (!adminHtml.includes('SecurityJob') || adminHtml.includes('Command Centre')) {
      fail(`${host}/admin is not the SecurityJob admin page`)
    }
  }
}

console.log('check:securityjob-site OK')
