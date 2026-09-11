#!/usr/bin/env node
/**
 * Lock: Recruitment Send PIN must still run after any page change.
 * Assembles the same script the live login page uses, then parses it.
 *
 *   node scripts/check-recruitment-login-pin.mjs
 *   node scripts/check-recruitment-login-pin.mjs --probe
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

const JS_CHUNKS = [
  ['api/_lib/master-directory.ts', 'OPEN_MASTER_DIRECTORY_JS'],
  ['api/_lib/recruitment/registered-candidates-pages.ts', 'REGISTERED_CANDIDATES_JS'],
  ['api/_lib/recruitment/security-news-registered-pages.ts', 'SECURITY_NEWS_REGISTERED_JS'],
  ['api/_lib/recruitment/walk-in-pages.ts', 'WALK_IN_PAGES_JS'],
  ['api/_lib/recruitment/funnel-followup-pages.ts', 'FUNNEL_FOLLOWUP_JS'],
  ['api/_lib/recruitment/referral-list-pages.ts', 'REFERRAL_LIST_PAGES_JS'],
  ['api/_lib/recruitment/drr-detail-pages.ts', 'DRR_DETAIL_PAGES_JS'],
  ['api/_lib/recruitment/portal-pages.ts', 'RECRUIT_PORTAL_PAGES_JS'],
]

function extractTemplate(src, exportName) {
  const needle = `export const ${exportName} = \``
  const start = src.indexOf(needle)
  if (start < 0) throw new Error(`${exportName} missing`)
  let i = start + needle.length
  let raw = ''
  while (i < src.length) {
    if (src[i] === '\\') {
      raw += src[i] + src[i + 1]
      i += 2
      continue
    }
    if (src[i] === '`') break
    raw += src[i]
    i += 1
  }
  return raw
}

function evalChunk(raw) {
  return new Function('MASTER_DIRECTORY_PATH', 'return `' + raw + '`')('/mis')
}

function extractPageScript(appSrc, chunks) {
  const start = appSrc.indexOf('const PAGE = `')
  if (start < 0) throw new Error('PAGE template missing')
  let i = start + 'const PAGE = `'.length
  let out = ''
  while (i < appSrc.length) {
    const ch = appSrc[i]
    if (ch === '\\') {
      out += appSrc[i + 1]
      i += 2
      continue
    }
    if (ch === '`') break
    if (ch === '$' && appSrc[i + 1] === '{') {
      let depth = 1
      i += 2
      const exprStart = i
      while (i < appSrc.length && depth) {
        if (appSrc[i] === '{') depth += 1
        else if (appSrc[i] === '}') depth -= 1
        i += 1
      }
      const expr = appSrc.slice(exprStart, i - 1).trim()
      out += chunks[expr] || ''
      continue
    }
    out += ch
    i += 1
  }
  const a = out.indexOf('<script>')
  const b = out.lastIndexOf('</script>')
  if (a < 0 || b < 0) throw new Error('PAGE <script> missing')
  return out
    .slice(a + 8, b)
    .replace(
      '__RECRUIT_OTP_SCRIPT__',
      'function otpSend(){}\nfunction otpVerify(){}\nfunction otpBoot(){}\n',
    )
}

const chunks = {}
for (const [rel, name] of JS_CHUNKS) {
  const file = path.join(root, rel)
  if (!fs.existsSync(file)) {
    fail(`${rel} missing — Recruitment page would lose a menu`)
    continue
  }
  try {
    chunks[name] = evalChunk(extractTemplate(fs.readFileSync(file, 'utf8'), name))
  } catch (err) {
    fail(`${name} could not be read: ${err instanceof Error ? err.message : err}`)
  }
}

const app = fs.readFileSync(path.join(root, 'api/recruitment/app.ts'), 'utf8')
if (!app.includes('__RECRUIT_OTP_SCRIPT__') || !app.includes('otpLoginScript(')) {
  fail('Recruitment login PIN script must stay on the page')
} else {
  ok('Recruitment page still loads the email PIN script')
}

try {
  const script = extractPageScript(app, chunks)
  if (!script.includes('function otpSend')) fail('Assembled page is missing Send PIN (otpSend)')
  if (/onclick="[^"]*getAttribute\('data-ff/.test(script) || /onclick="[^"]*getAttribute\('data-sj/.test(script)) {
    fail('Follow-up buttons use quotes that break Send PIN')
  }
  new Function(script)
  ok('Full Recruitment page script parses — Send PIN can run')
} catch (err) {
  fail('Recruitment page script is broken (login PIN will not send): ' + (err instanceof Error ? err.message : err))
}

if (probe) {
  const urls = [
    'https://www.agilegroup-digital.co.in/recruitment/?portal=management',
    'https://www.agilegroup-digital.co.in/recruitment/?portal=staff',
  ]
  for (const url of urls) {
    try {
      const html = await fetch(url, { cache: 'no-store' }).then((r) => r.text())
      const m = html.match(/<script>([\s\S]*?)<\/script>/)
      if (!m) {
        fail(`probe ${url}: no script`)
        continue
      }
      if (!m[1].includes('function otpSend')) fail(`probe ${url}: Send PIN missing`)
      new Function(m[1])
      ok(`probe login script OK ${url}`)
    } catch (err) {
      fail(`probe ${url}: ${err instanceof Error ? err.message : err}`)
    }
  }
}

if (failed) {
  console.error('\ncheck:recruitment-login-pin FAILED — do not upload\n')
  process.exit(1)
}
console.log('\ncheck:recruitment-login-pin OK')
