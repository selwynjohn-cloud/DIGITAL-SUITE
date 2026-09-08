/**
 * Agile Control — escalation + strategic check generation (used by API + cron).
 */

import { Resend } from 'resend'
import { LOKESH_CC_EMAIL } from '../mis/branch-mail-cc.js'
import { pinMailFrom, sendSuiteEmail, suiteDirectorEmail } from '../suite-mail.js'
import { createAcCase } from './cases.js'
import { nextEscalationLevel, needsAckEscalation } from './sla.js'
import {
  acNid,
  appendAcLog,
  emptyTimeline,
  getAcCases,
  getAcClientChecks,
  getAcStrategicSites,
  saveAcClientChecks,
  upsertAcCase,
} from './store.js'
import type { AcCase, AcClientCheck, AcStrategicSite } from './types.js'

function directorTo(): string {
  return suiteDirectorEmail() || 'director@agilegroup.co.in'
}

async function mailEscalation(c: AcCase, level: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return
  try {
    const resend = new Resend(apiKey)
    const to = directorTo()
    const cc = [LOKESH_CC_EMAIL].filter((e) => e && e !== to)
    await sendSuiteEmail(resend, {
      from: pinMailFrom(),
      to,
      cc: cc.length ? cc : undefined,
      subject: `Agile Control escalate ${level} — ${c.caseNo} — ${c.priority}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px">
        <h2>Escalation — ${c.caseNo}</h2>
        <p><b>Priority:</b> ${c.priority}<br>
        <b>Level:</b> ${level}<br>
        <b>Category:</b> ${c.category}<br>
        <b>Summary:</b> ${c.summary}<br>
        <b>Branch / Client / Site:</b> ${c.branchName || '—'} / ${c.clientName || '—'} / ${c.siteName || '—'}<br>
        <b>Owner:</b> ${c.ownerName || c.ownerEmail || 'Unassigned'}</p>
        <p style="font-size:12px;color:#64748b">Agile Control — automatic escalation (Director only; IT not copied)</p>
      </div>`,
      skipDirectorCc: true,
    })
  } catch {
    /* ignore mail errors */
  }
}

/** Escalate open cases that missed ack SLA. Returns count escalated. */
export async function runAcEscalations(): Promise<{ checked: number; escalated: number }> {
  const all = await getAcCases()
  let escalated = 0
  const now = Date.now()
  for (const c of all) {
    if (!needsAckEscalation(c, now)) continue
    const next = nextEscalationLevel(c.escalationLevel, c.priority)
    if (!next) continue
    // Avoid re-escalating same level within 10 minutes
    if (c.lastEscalatedAt && now - new Date(c.lastEscalatedAt).getTime() < 10 * 60_000) continue
    c.escalationLevel = next
    c.lastEscalatedAt = new Date().toISOString()
    c.updatedAt = c.lastEscalatedAt
    c.timeline = [
      emptyTimeline('system@agilecontrol', 'Agile Control', 'escalated', `Auto-escalated to ${next}`),
      ...(c.timeline || []),
    ].slice(0, 200)
    await upsertAcCase(c)
    await appendAcLog({
      byEmail: 'system@agilecontrol',
      byName: 'Agile Control',
      kind: 'escalated',
      text: `${c.caseNo} escalated to ${next}`,
      caseNo: c.caseNo,
      branchId: c.branchId,
    })
    await mailEscalation(c, next)
    escalated++
  }
  return { checked: all.length, escalated }
}

function randomWindowTonight(): { windowStart: string; windowEnd: string } {
  const now = new Date()
  // Pick a window between 22:00–05:00 IST roughly as UTC+5:30 offset handling via locale
  const startHour = 22 + Math.floor(Math.random() * 5) // 22-26 → wrap
  const h = startHour % 24
  const d = new Date(now)
  if (h < 12) d.setDate(d.getDate() + 1)
  d.setHours(h, Math.floor(Math.random() * 50), 0, 0)
  const end = new Date(d.getTime() + 2 * 60 * 60_000)
  return { windowStart: d.toISOString(), windowEnd: end.toISOString() }
}

/** Create pending CONTROL CHECK tasks for active strategic sites (randomized). */
export async function generateAcClientChecks(opts?: {
  force?: boolean
}): Promise<{ created: number; sites: number }> {
  const sites = (await getAcStrategicSites()).filter((s) => s.active !== false)
  const checks = await getAcClientChecks()
  const today = new Date().toISOString().slice(0, 10)
  let created = 0
  for (const site of sites) {
    const already = checks.some(
      (c) =>
        c.siteId === site.id &&
        c.status === 'Pending' &&
        String(c.assignedAt || '').slice(0, 10) === today,
    )
    if (already && !opts?.force) continue
    // Frequency: Platinum ~ daily, Gold ~ 3/week, Silver ~ weekly — simple random gate
    const roll = Math.random()
    const due =
      opts?.force ||
      site.tier === 'Platinum' ||
      (site.tier === 'Gold' && roll < 0.45) ||
      (site.tier === 'Silver' && roll < 0.2) ||
      roll < 0.15
    if (!due) continue
    const win = randomWindowTonight()
    const row: AcClientCheck = {
      id: acNid('ck'),
      siteId: site.id,
      branchId: site.branchId,
      branchName: site.branchName,
      clientName: site.clientName,
      siteName: site.siteName,
      contactName: site.contactName,
      windowStart: win.windowStart,
      windowEnd: win.windowEnd,
      status: 'Pending',
      assignedAt: new Date().toISOString(),
      completedAt: '',
      completedByEmail: '',
      completedByName: '',
      guardAttendance: '',
      alertness: '',
      supervisorVisit: '',
      anyIncident: '',
      clientSatisfaction: '',
      immediateAttention: '',
      notes: '',
      caseNo: '',
    }
    checks.unshift(row)
    created++
  }
  if (created) await saveAcClientChecks(checks.slice(0, 3000))
  return { created, sites: sites.length }
}

export async function ensureSampleStrategicSites(): Promise<AcStrategicSite[]> {
  const existing = await getAcStrategicSites()
  if (existing.length) return existing
  const seed: AcStrategicSite[] = [
    {
      id: acNid('st'),
      branchId: '',
      branchName: 'Hyderabad-A',
      clientName: 'Sample Platinum Client',
      siteName: 'HQ Campus',
      contactName: 'Security Manager',
      contactPhone: '',
      tier: 'Platinum',
      frequencyPerWeek: 7,
      active: true,
      lastCheckAt: '',
    },
  ]
  const { saveAcStrategicSites } = await import('./store.js')
  await saveAcStrategicSites(seed)
  return seed
}

export async function completeClientCheckAsCase(
  check: AcClientCheck,
  byEmail: string,
  byName: string,
): Promise<AcCase | null> {
  if (String(check.immediateAttention || '').toLowerCase().includes('yes')) {
    return createAcCase({
      category: 'CriticalClientCheck',
      priority: 'P2',
      summary: `Client check needs attention — ${check.clientName} / ${check.siteName}`,
      detail: [
        `Immediate attention: ${check.immediateAttention}`,
        `Attendance: ${check.guardAttendance}`,
        `Alertness: ${check.alertness}`,
        `Supervisor visit: ${check.supervisorVisit}`,
        `Incident: ${check.anyIncident}`,
        `Satisfaction: ${check.clientSatisfaction}`,
        check.notes,
      ]
        .filter(Boolean)
        .join('\n'),
      branchId: check.branchId,
      branchName: check.branchName,
      clientName: check.clientName,
      siteName: check.siteName,
      source: 'Strategic Client Check',
      byEmail,
      byName,
    })
  }
  return null
}
