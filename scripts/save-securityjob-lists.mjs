#!/usr/bin/env node
/**
 * Save Security Job + Security News registered lists as Excel
 * into Documents/SecurityJob List (overwritten every day).
 *
 *   node scripts/save-securityjob-lists.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const XLSX = require('xlsx')
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const FOLDER = 'SecurityJob List'
const DIR = join(homedir(), 'Documents', FOLDER)
const JOB_FILE = 'Security Job - Registered List.xlsx'
const NEWS_FILE = 'Security News - Registered List.xlsx'

function loadEnvFile(p) {
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 1) continue
    const k = t.slice(0, i).trim()
    let v = t.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (!k || !v || v === '[SENSITIVE]') continue
    if (process.env[k] == null) process.env[k] = v
  }
}

function loadEnv() {
  for (const name of ['.env', '.env.local', '.env.production', '.env.pull']) {
    loadEnvFile(join(root, name))
  }
}

function liveValue(name) {
  const v = String(process.env[name] || '').trim()
  if (!v || v === '[SENSITIVE]') return ''
  return v
}

async function redis(command) {
  const url = liveValue('UPSTASH_REDIS_REST_URL')
  const token = liveValue('UPSTASH_REDIS_REST_TOKEN')
  if (!url || !token) throw new Error('Redis is not configured on this computer.')
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  })
  if (!res.ok) throw new Error('Could not read the registered lists.')
  return res.json()
}

function dmy(v) {
  const raw = String(v || '').trim()
  if (!raw) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const p = raw.slice(0, 10).split('-')
    return `${p[2]}/${p[1]}/${p[0]}`
  }
  const hit = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (hit) return `${hit[1].padStart(2, '0')}/${hit[2].padStart(2, '0')}/${hit[3]}`
  const t = Date.parse(raw.replace(',', ''))
  if (!Number.isNaN(t)) return new Date(t).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })
  return ''
}

function showMobile(p) {
  const d = String(p || '').replace(/\D/g, '').slice(-10)
  if (d.length === 10) return `${d.slice(0, 5)} ${d.slice(5)}`
  return String(p || '').trim()
}

function sortTs(createdAt, regCode) {
  const t = Date.parse(String(createdAt || ''))
  if (!Number.isNaN(t)) return t
  const m = String(regCode || '').match(/\/(\d{2})(\d{2})(\d{4})-(\d{2})(\d{2})$/)
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]).getTime()
  return 0
}

function statusLabel(c) {
  if (c.status === 'joined' && String(c.joinedAt || '').trim()) return 'Joined'
  if (c.status === 'rejected') return 'Rejected'
  if (c.status === 'not_willing') return 'Not willing'
  const doj = String(c.tentativeJoinDate || '').slice(0, 10)
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  if (doj && doj <= today) return 'Follow-up due'
  if (c.status === 'new' && !c.calledAt && !doj && !c.waitingListAt) return 'Registered'
  return 'Waiting list'
}

function writeBook(name, rows, file) {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31))
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  writeFileSync(join(DIR, file), buf)
}

async function loadJobRows() {
  const recruit = await redis(['GET', 'recruit:registrations'])
  let list = []
  if (recruit?.result && typeof recruit.result === 'string') {
    try {
      list = JSON.parse(recruit.result)
    } catch {
      list = []
    }
  }
  if (!Array.isArray(list)) list = []
  const sj = await redis(['LRANGE', 'sj:applicants', 0, -1])
  const arr = Array.isArray(sj?.result) ? sj.result : []
  const seen = new Set(
    list.map((r) => String(r.phone || '').replace(/\D/g, '').slice(-10)).filter((p) => p.length >= 10),
  )
  for (const s of arr) {
    let a
    try {
      a = typeof s === 'string' ? JSON.parse(s) : s
    } catch {
      continue
    }
    const mob = String(a.phone || '').replace(/\D/g, '').slice(-10)
    if (mob.length >= 10 && seen.has(mob)) continue
    if (mob.length >= 10) seen.add(mob)
    list.push({
      name: a.name || '',
      phone: a.phone || '',
      ownerTeam: '',
      status: 'new',
      createdAt: a.createdAt || '',
      regCode: a.regCode || '',
      calledAt: '',
      tentativeJoinDate: '',
      joinedAt: '',
      rejectedAt: '',
      replyNotes: '',
      location: a.location || '',
      active: true,
    })
  }
  return list
    .filter((r) => r && r.active !== false)
    .sort((a, b) => sortTs(b.createdAt, b.regCode) - sortTs(a.createdAt, a.regCode))
}

function weekKey(base) {
  const d = base || new Date(Date.now() + (5 * 60 + 30) * 60000)
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNr = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNr + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const week =
    1 +
    Math.round(((target.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

async function loadNewsPeople() {
  const scanned = await redis(['KEYS', 'pulse:quiz:entries:*'])
  const raw = Array.isArray(scanned?.result) ? scanned.result : []
  const weeks = [
    ...new Set(
      raw
        .map((k) => String(k).replace(/^pulse:quiz:entries:/, ''))
        .filter((k) => /^20\d{2}-W\d{2}$/.test(k)),
    ),
  ]
  const start = new Date()
  for (let i = 0; i < 26; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() - i * 7)
    const key = weekKey(d)
    if (!weeks.includes(key)) weeks.push(key)
  }
  const map = new Map()
  for (const week of weeks) {
    const data = await redis(['LRANGE', `pulse:quiz:entries:${week}`, 0, -1])
    const arr = Array.isArray(data?.result) ? data.result : []
    for (const s of arr) {
      let e
      try {
        e = typeof s === 'string' ? JSON.parse(s) : s
      } catch {
        continue
      }
      const mobile = String(e.mobile || '').replace(/\D/g, '').slice(-10)
      if (mobile.length < 10) continue
      const ts = Date.parse(String(e.date || '')) || 0
      const prev = map.get(mobile)
      if (!prev) {
        map.set(mobile, {
          name: String(e.name || '').trim() || '—',
          mobile,
          lastDate: e.date || '',
          lastWeek: week,
          answers: 1,
          sortTs: ts,
        })
      } else {
        prev.answers += 1
        if (ts >= prev.sortTs) {
          prev.name = String(e.name || '').trim() || prev.name
          prev.lastDate = e.date || prev.lastDate
          prev.lastWeek = week
          prev.sortTs = ts
        }
      }
    }
  }
  return [...map.values()].sort((a, b) => b.sortTs - a.sortTs)
}

function exportKey() {
  const fromEnv = liveValue('SECURITYJOB_LIST_EXPORT_KEY')
  if (fromEnv) return fromEnv
  const p = join(DIR, '.export-key')
  if (!existsSync(p)) return ''
  return readFileSync(p, 'utf8').trim()
}

async function downloadLiveExcel(file, destName) {
  const key = exportKey()
  if (!key) throw new Error('The daily Excel key is missing on this computer.')
  const res = await fetch(`https://www.agilegroup-digital.co.in/api/recruitment/list-export?file=${file}`, {
    headers: { 'x-securityjob-list-key': key },
  })
  if (!res.ok) throw new Error(`Could not download ${destName}.`)
  writeFileSync(join(DIR, destName), Buffer.from(await res.arrayBuffer()))
}

async function saveFromRedis() {
  const jobs = await loadJobRows()
  const jobRows = [
    [
      'Sl.',
      'Name',
      'Mobile',
      'Owner',
      'Status',
      'Registered on',
      'Call 1 (App)',
      'Tentative date',
      'Call 2 (App)',
      'WhatsApp invitation',
      'Call 3 (Recruitment)',
      'Joined date',
      'Hold on (remind)',
      'Notes',
      'Location',
      'Reg code',
    ],
  ]
  jobs.forEach((c, i) => {
    jobRows.push([
      i + 1,
      c.name || '',
      showMobile(c.phone),
      c.ownerTeam || '',
      statusLabel(c),
      dmy(c.createdAt),
      dmy(c.call1At || c.calledAt || ''),
      dmy(c.tentativeJoinDate || ''),
      dmy(c.call2At || ''),
      dmy(c.whatsappInviteAt || ''),
      dmy(c.call3At || ''),
      dmy(c.joinedAt || ''),
      dmy(c.holdRemindOn || c.waitingListAt || ''),
      c.replyNotes || '',
      c.location || '',
      c.regCode || '',
    ])
  })
  writeBook('Security Job', jobRows, JOB_FILE)

  const people = await loadNewsPeople()
  const newsRows = [['Sl.', 'Name', 'Mobile', 'Last answered', 'Week', 'Answers']]
  people.forEach((c, i) => {
    newsRows.push([i + 1, c.name, showMobile(c.mobile), dmy(c.lastDate), c.lastWeek, c.answers])
  })
  writeBook('Security News', newsRows, NEWS_FILE)

  const stamp = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })
  writeFileSync(
    join(DIR, 'update.log'),
    `Updated ${stamp} · Security Job ${jobs.length} · Security News ${people.length}\n`,
    { flag: 'a' },
  )
  console.log(`OK: ${DIR}`)
  console.log(` - ${JOB_FILE} (${jobs.length} names)`)
  console.log(` - ${NEWS_FILE} (${people.length} names)`)
}

async function main() {
  loadEnv()
  mkdirSync(DIR, { recursive: true })
  if (liveValue('UPSTASH_REDIS_REST_URL') && liveValue('UPSTASH_REDIS_REST_TOKEN')) {
    await saveFromRedis()
    return
  }
  await downloadLiveExcel('job', JOB_FILE)
  await downloadLiveExcel('news', NEWS_FILE)
  const stamp = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })
  writeFileSync(join(DIR, 'update.log'), `Updated ${stamp} · downloaded both Excel files\n`, { flag: 'a' })
  console.log(`OK: ${DIR}`)
  console.log(` - ${JOB_FILE}`)
  console.log(` - ${NEWS_FILE}`)
}

main().catch((err) => {
  console.error('FAIL:', err && err.message ? err.message : err)
  process.exit(1)
})
