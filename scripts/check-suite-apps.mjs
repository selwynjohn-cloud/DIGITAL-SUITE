#!/usr/bin/env node
/**
 * Probe every Command Centre app (Director’s 20) on the live site.
 *   npm run check:suite-apps
 */
const BASE = process.env.HEALTH_CHECK_BASE_URL?.trim() || 'https://www.agilegroup-digital.co.in'
let failed = false
function fail(msg) {
  console.error('FAIL:', msg)
  failed = true
}
function ok(msg) {
  console.log('OK:', msg)
}

const PAGES = [
  { id: '01 CRM', url: '/crm/?portal=management&fresh=1', must: ['Security Survey', 'Tender Lead'] },
  { id: '02 Recruitment', url: '/recruitment/?portal=management&fresh=1', must: ['Daily Recruitment Report', 'Cumulative Referral Details'] },
  { id: '03 Training', url: '/training/?portal=management&fresh=1', must: ['Agile Training', 'Send PIN'] },
  { id: '04 Deployment', url: '/deployment/', must: ['Deployment'] },
  { id: '05 Meetings', url: '/meetings/?portal=management&fresh=1', must: ['Meeting'] },
  { id: '06 Control', url: '/control/?portal=management&fresh=1', must: ['Control'] },
  { id: '07 MIS', url: '/mis-staff', must: ['MIS'] },
  { id: '08 Guards', url: '/guards/?portal=management&fresh=1', must: ['Guards'] },
  { id: '09 Reviews', url: '/reviews/', must: ['Review'] },
  { id: '10 Licenses', url: '/licences/?portal=management&fresh=1', must: ['Licen'] },
  { id: '11 Fleet', url: '/fleets/?portal=management&fresh=1', must: ['Fleet', 'Send PIN'] },
  { id: '11 Fleet HOD', url: '/fleets/?portal=staff&fresh=1', must: ['Fleet', 'Send PIN', 'Your branch'] },
  { id: '12 Facilities', url: '/facilities/?portal=management&fresh=1', must: ['Facilit'] },
  { id: '13 Assets', url: '/assets/?portal=management&fresh=1', must: ['Asset'] },
  { id: '15 HR Audit', url: '/audit/?portal=management&fresh=1', must: ['Audit'] },
  { id: '16 Security News', url: '/pulse', must: ['SECURITY NEWS - AGILE GROUP'] },
  { id: '16 Security News Manager', url: '/pulse/admin', must: ['Admin Portal', 'it@agilegroup.co.in', 'Send PIN'] },
]

const HOME_TITLES = [
  'Agile CRM',
  'Agile Recruitment',
  'Agile Training',
  'Agile Deployment',
  'Agile Meeting',
  'Agile Control',
  'Agile MIS',
  'Agile Guards',
  'Agile Reviews',
  'Agile Licenses',
  'Agile Fleet',
  'Agile Facilities',
  'Agile Assets',
  'Agile Insights',
  'Agile HR Audit',
  'Agile Security News',
  'Agile LinkedIn',
  'Agile Facebook',
  'Agile YouTube',
  'Agile Mobile',
]

async function fetchText(path) {
  const res = await fetch(BASE + path, { redirect: 'follow', headers: { 'Cache-Control': 'no-cache' } })
  const text = await res.text()
  return { res, text }
}

const home = await fetchText('/')
if (!home.res.ok) fail(`Command Centre home HTTP ${home.res.status}`)
const jsSrc = home.text.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1]
if (!jsSrc) fail('Command Centre missing app bundle')
else {
  const js = await fetchText(jsSrc)
  for (const title of HOME_TITLES) {
    if (!js.text.includes(title)) fail(`Command Centre missing tile: ${title}`)
    else ok(`tile ${title}`)
  }
  if (!js.text.includes('client-branch-profitability')) fail('Agile Insights URL missing from Command Centre')
  else ok('14 Insights points at profitability app')
  if (!js.text.includes('agilegroup-work360.aititude.in')) fail('Agile Mobile URL missing')
  else ok('20 Mobile points at Work360')
}

for (const p of PAGES) {
  try {
    const { res, text } = await fetchText(p.url)
    if (!res.ok) {
      fail(`${p.id} HTTP ${res.status}`)
      continue
    }
    if (/<title>[^<]*Coming Soon/.test(text) && !p.id.includes('Quality')) {
      fail(`${p.id} live title is Coming Soon`)
      continue
    }
    const miss = p.must.filter((m) => !text.toLowerCase().includes(m.toLowerCase()))
    if (miss.length) fail(`${p.id} missing: ${miss.join(', ')}`)
    else ok(`${p.id} live`)
  } catch (e) {
    fail(`${p.id}: ${e.message}`)
  }
}

try {
  const insights = await fetch('https://client-branch-profitability.vercel.app/', { redirect: 'follow' })
  if (!insights.ok) fail(`14 Insights host HTTP ${insights.status}`)
  else ok('14 Insights host reachable')
} catch (e) {
  fail(`14 Insights host: ${e.message}`)
}

if (failed) {
  console.error('\ncheck:suite-apps FAILED\n')
  process.exit(1)
}
console.log('\ncheck:suite-apps OK — all 20 Command Centre apps present')
