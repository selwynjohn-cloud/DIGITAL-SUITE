#!/usr/bin/env node
/**
 * One-off: Branch-wise Name + Mobile Excel on the Desktop.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const XLSX = require('xlsx')
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(homedir(), 'Desktop', 'Branch-wise-Guards-Name-Mobile.xlsx')
const SKIP = /corporate\s*office|training\s*(academy|department|dept)|recruitment\s*(department|dept)|it\s*department/i

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

for (const name of ['.env', '.env.local', '.env.production', '.env.pull']) {
  loadEnvFile(join(root, name))
}

function liveValue(name) {
  const v = String(process.env[name] || '').trim()
  if (!v || v === '[SENSITIVE]') return ''
  return v
}

function mobile10(raw) {
  const d = String(raw || '').replace(/\D/g, '')
  return d.length >= 10 ? d.slice(-10) : ''
}

function legacyIds(branchId, branchName) {
  const ids = new Set([branchId])
  const n = String(branchName || '').trim()
  const lower = n.toLowerCase()
  if (/hyderabad-a|hyd zone a/i.test(n)) ids.add('b_hyderabadzonea')
  if (/hyderabad-b|hyd zone b/i.test(n)) ids.add('b_hyderabadzoneb')
  if (/tirupati/i.test(n)) ids.add('b_tirupathi')
  if (/karnataka/i.test(n)) ids.add('b_karnataka')
  if (/kerala/i.test(n)) ids.add('b_kerala')
  if (/gujarat|surat/i.test(n) && !/mumbai|maharashtra/i.test(n)) ids.add('b_surat')
  if (/madhya/i.test(n)) ids.add('b_madhya')
  if (/maharashtra|mumbai/i.test(n) && !/surat|gujarat/i.test(n)) ids.add('b_maharashtra')
  if (/nellore/i.test(n)) ids.add('b_nellore')
  if (/puducherry|pondicherry/i.test(n)) ids.add('b_puducherry')
  if (/tamil/i.test(n)) ids.add('b_tamilnadu')
  if (/vijayawada/i.test(n)) ids.add('b_vijayawada')
  if (/visakhapatnam|vizag/i.test(n)) ids.add('b_visakhapatnam')
  if (/kakinada/i.test(n)) ids.add('b_kakinada')
  if (/hi-?tech/i.test(n)) ids.add('b_hitech')
  const slug = 'b_' + lower.replace(/[^a-z0-9]+/g, '')
  if (slug.length > 2) ids.add(slug)
  return [...ids]
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
  if (!res.ok) throw new Error('Could not read the guards list.')
  return res.json()
}

function parseJson(raw, fallback) {
  if (raw == null || raw === '') return fallback
  try {
    return JSON.parse(String(raw))
  } catch {
    return fallback
  }
}

const { result: branchesRaw } = await redis(['GET', 'mis:branches'])
const branches = parseJson(branchesRaw, [])
if (!Array.isArray(branches) || !branches.length) throw new Error('No branches found.')

const ops = branches
  .filter((b) => b && b.active !== false && !SKIP.test(String(b.name || '')))
  .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'en', { sensitivity: 'base' }))

const keys = []
const owners = []
for (const b of ops) {
  for (const sid of legacyIds(b.id, b.name)) {
    keys.push(`mis:guarddocs:${sid}`)
    owners.push({ key: `mis:guarddocs:${sid}`, branch: b.name, kind: 'docs' })
    keys.push(`mis:guards:${sid}`)
    owners.push({ key: `mis:guards:${sid}`, branch: b.name, kind: 'guards' })
  }
}

const rowsByBranch = new Map()
for (const b of ops) rowsByBranch.set(b.name, new Map())

const CHUNK = 80
for (let i = 0; i < keys.length; i += CHUNK) {
  const slice = keys.slice(i, i + CHUNK)
  const { result } = await redis(['MGET', ...slice])
  const list = Array.isArray(result) ? result : []
  for (let j = 0; j < slice.length; j++) {
    const meta = owners[i + j]
    const arr = parseJson(list[j], [])
    if (!Array.isArray(arr) || !arr.length) continue
    const dest = rowsByBranch.get(meta.branch)
    if (!dest) continue
    for (const g of arr) {
      if (!g || g.active === false) continue
      const mobile = mobile10(g.mobile)
      const name = String(g.guardName || g.name || '').trim()
      if (!mobile || !name) continue
      if (!dest.has(mobile)) dest.set(mobile, name)
    }
  }
}

const wb = XLSX.utils.book_new()
const all = [['Branch', 'Name', 'Mobile']]
const counts = []

for (const [branch, map] of [...rowsByBranch.entries()].sort((a, b) => a[0].localeCompare(b[0], 'en'))) {
  const people = [...map.entries()]
    .map(([mobile, name]) => ({ name, mobile }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))
  counts.push({ branch, n: people.length })
  const sheetRows = [['Name', 'Mobile'], ...people.map((p) => [p.name, p.mobile])]
  const ws = XLSX.utils.aoa_to_sheet(sheetRows)
  ws['!cols'] = [{ wch: 36 }, { wch: 14 }]
  const safe = branch.replace(/[\\/*?:\[\]]/g, ' ').slice(0, 31)
  XLSX.utils.book_append_sheet(wb, ws, safe || 'Branch')
  for (const p of people) all.push([branch, p.name, p.mobile])
}

const allWs = XLSX.utils.aoa_to_sheet(all)
allWs['!cols'] = [{ wch: 22 }, { wch: 36 }, { wch: 14 }]
XLSX.utils.book_append_sheet(wb, allWs, 'All branches')
XLSX.writeFile(wb, OUT)

const withPeople = counts.filter((c) => c.n)
console.log(JSON.stringify({ file: OUT, branches: withPeople.length, total: all.length - 1, counts: withPeople }, null, 2))
