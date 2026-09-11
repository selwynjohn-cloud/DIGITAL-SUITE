#!/usr/bin/env node
/**
 * Lock: Fleet weekly submission Full View must stay available.
 * Run: npm run check:fleet-weekly
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function read(rel) {
  return readFileSync(resolve(root, rel), 'utf8')
}

function fail(msg) {
  throw new Error(msg)
}

function mustInclude(file, needle, why) {
  if (!read(file).includes(needle)) fail(`${file} missing ${why}: ${needle}`)
}

function mustNotInclude(file, needle, why) {
  if (read(file).includes(needle)) fail(`${file} must not have ${why}: ${needle}`)
}

mustInclude('api/fleet/app.ts', 'function toggleWeeklyFullView', 'Full View toggle')
mustInclude('api/fleet/app.ts', 'function wrFullViewBtn', 'Full View button on weekly form')
mustInclude('api/fleet/app.ts', '⛶ Full View', 'Full View label')
mustInclude('api/fleet/app.ts', 'fleet-wr-full', 'full-width weekly class')
mustInclude('api/fleet/app.ts', "document.body.classList.remove('fleet-wr-full')", 'leave Full View when changing menu')
mustInclude('api/fleet/app.ts', 'wrFullViewBtn()', 'Submit Weekly Report shows Full View')
mustInclude('api/_lib/fleet/brand.ts', '.wr-tbl-wrap{border-radius:10px;overflow-x:auto', 'weekly table can scroll sideways')
mustInclude('api/_lib/fleet/brand.ts', 'body.fleet-wr-full .side{display:none!important}', 'Full View hides the left menu')
mustNotInclude('api/_lib/fleet/brand.ts', '.wr-tbl-wrap{border-radius:10px;overflow:hidden', 'hidden overflow that clips Full View')
mustNotInclude('api/_lib/fleet/brand.ts', '.rpt-sheet{background:#0b1220;border:1px solid #22304f;border-radius:16px;overflow:hidden;', 'sheet clip that hides weekly columns')

console.log('check-fleet-weekly: Full View locked on weekly submission + archive view')
