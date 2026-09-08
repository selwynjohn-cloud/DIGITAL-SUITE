/**
 * Daily Excel copies of Security Job + Security News registered lists.
 * Local folder: Documents/SecurityJob List
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import * as XLSX from 'xlsx'
import { listQuizPeopleForRecruitment } from '../pulse/quiz.js'
import {
  loadAllRegisteredCandidates,
  registrationDay,
  registrationSortTs,
  sjCall1At,
  sjFollowBucket,
  sjFollowTabLabel,
  sjHoldOn,
} from './registration-store.js'

export const SECURITYJOB_LIST_FOLDER_NAME = 'SecurityJob List'
export const SECURITY_JOB_XLSX = 'Security Job - Registered List.xlsx'
export const SECURITY_NEWS_XLSX = 'Security News - Registered List.xlsx'

export function securityJobListDir(): string {
  return join(homedir(), 'Documents', SECURITYJOB_LIST_FOLDER_NAME)
}

function dmy(v: string): string {
  const raw = String(v || '').trim()
  if (!raw) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const p = raw.slice(0, 10).split('-')
    return `${p[2]}/${p[1]}/${p[0]}`
  }
  const dmyHit = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (dmyHit) return `${dmyHit[1].padStart(2, '0')}/${dmyHit[2].padStart(2, '0')}/${dmyHit[3]}`
  const t = Date.parse(raw.replace(',', ''))
  if (!Number.isNaN(t)) {
    return new Date(t).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })
  }
  return ''
}

function showMobile(p: string): string {
  const d = String(p || '').replace(/\D/g, '').slice(-10)
  if (d.length === 10) return `${d.slice(0, 5)} ${d.slice(5)}`
  return String(p || '').trim()
}

function followStatus(c: Parameters<typeof sjFollowBucket>[0]): string {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  return sjFollowTabLabel(sjFollowBucket(c, today))
}

function bookFromRows(sheetName: string, rows: (string | number)[][]): Buffer {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = rows[0]?.map((_, i) => ({ wch: i === 0 ? 6 : i === 2 ? 14 : 18 }))
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31))
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}

export async function buildSecurityJobExcel(): Promise<Buffer> {
  const all = await loadAllRegisteredCandidates()
  const list = all
    .filter((r) => r.active !== false)
    .sort(
      (a, b) =>
        registrationSortTs(b.createdAt, b.regCode) - registrationSortTs(a.createdAt, a.regCode) ||
        String(b.id).localeCompare(String(a.id)),
    )
  const rows: (string | number)[][] = [
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
  list.forEach((c, i) => {
    rows.push([
      i + 1,
      c.name || '',
      showMobile(c.phone),
      c.ownerTeam || '',
      followStatus(c),
      dmy(registrationDay(c.createdAt, c.regCode) || c.createdAt),
      dmy(sjCall1At(c)),
      dmy(c.tentativeJoinDate || ''),
      dmy(c.call2At || ''),
      dmy(c.whatsappInviteAt || ''),
      dmy(c.call3At || ''),
      dmy(c.joinedAt || ''),
      dmy(sjHoldOn(c)),
      c.replyNotes || '',
      c.location || '',
      c.regCode || '',
    ])
  })
  return bookFromRows('Security Job', rows)
}

export async function buildSecurityNewsExcel(): Promise<Buffer> {
  const pack = await listQuizPeopleForRecruitment()
  const rows: (string | number)[][] = [['Sl.', 'Name', 'Mobile', 'Last answered', 'Week', 'Answers']]
  pack.people.forEach((c, i) => {
    rows.push([i + 1, c.name || '', showMobile(c.mobile), c.lastDateDmy || dmy(c.lastDate), c.lastWeek || '', c.answers || 1])
  })
  return bookFromRows('Security News', rows)
}

export async function writeSecurityJobListExcels(dir = securityJobListDir()): Promise<{
  dir: string
  files: string[]
}> {
  mkdirSync(dir, { recursive: true })
  const job = await buildSecurityJobExcel()
  const news = await buildSecurityNewsExcel()
  const jobPath = join(dir, SECURITY_JOB_XLSX)
  const newsPath = join(dir, SECURITY_NEWS_XLSX)
  writeFileSync(jobPath, job)
  writeFileSync(newsPath, news)
  return { dir, files: [jobPath, newsPath] }
}

export function excelAsBase64(buf: Buffer): string {
  return Buffer.from(buf).toString('base64')
}
