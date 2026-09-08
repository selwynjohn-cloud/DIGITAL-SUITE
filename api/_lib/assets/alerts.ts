/**
 * Agile Assets — warranty / AMC / repair / pending HOTO alerts + digest.
 */

import { Resend } from 'resend'
import { LOKESH_CC_EMAIL } from '../mis/branch-mail-cc.js'
import { pinMailFrom, sendSuiteEmail, suiteDirectorEmail } from '../suite-mail.js'
import { getAaAssets, getAaMaint, getAaTransfers, getAaWriteOffs } from './store.js'
import type { AaAlert } from './types.js'

function daysUntil(isoDate: string, now = Date.now()): number {
  const t = new Date(String(isoDate || '').slice(0, 10) + 'T12:00:00+05:30').getTime()
  if (!Number.isFinite(t)) return 9999
  return Math.ceil((t - now) / 86_400_000)
}

export async function collectAaAlerts(): Promise<AaAlert[]> {
  const [assets, maint, transfers, writeoffs] = await Promise.all([
    getAaAssets(),
    getAaMaint(),
    getAaTransfers(),
    getAaWriteOffs(),
  ])
  const out: AaAlert[] = []
  const now = Date.now()

  for (const a of assets) {
    if (a.status === 'WrittenOff' || a.status === 'Disposed') continue
    if (a.warrantyExpiry) {
      const d = daysUntil(a.warrantyExpiry, now)
      if (d <= 30) {
        out.push({
          id: `warr-${a.id}`,
          kind: 'warranty',
          severity: d <= 7 ? 'critical' : 'warn',
          assetCode: a.assetCode,
          assetName: a.name,
          branchName: a.branchName,
          dueDate: a.warrantyExpiry,
          actionRequired: d < 0 ? 'Warranty expired' : `Warranty ends in ${d} days`,
          daysLeft: d,
        })
      }
    }
  }

  for (const m of maint) {
    if (m.status === 'Resolved' || m.status === 'Closed') continue
    const due = m.nextServiceDate || m.scheduledDate
    const d = daysUntil(due, now)
    out.push({
      id: `mnt-${m.id}`,
      kind: m.kind === 'AMC' ? 'amc' : 'maintenance',
      severity: m.status === 'Raised' || d <= 7 ? 'critical' : 'warn',
      assetCode: m.assetCode,
      assetName: m.assetName,
      branchName: m.branchName,
      dueDate: due,
      actionRequired: `${m.kind}: ${m.title} (${m.status})`,
      daysLeft: d,
    })
  }

  for (const t of transfers) {
    if (t.status !== 'PendingHOTO') continue
    out.push({
      id: `tr-${t.id}`,
      kind: 'transfer',
      severity: 'warn',
      assetCode: t.assetCode,
      assetName: t.assetName,
      branchName: `${t.fromBranchName} → ${t.toBranchName}`,
      dueDate: (t.handedOverAt || t.createdAt || '').slice(0, 10),
      actionRequired: 'Pending Handover / Takeover sign-off',
      daysLeft: 0,
    })
  }

  for (const w of writeoffs) {
    if (w.status !== 'Pending') continue
    out.push({
      id: `wo-${w.id}`,
      kind: 'writeoff',
      severity: 'info',
      assetCode: w.assetCode,
      assetName: w.assetName,
      branchName: w.branchName,
      dueDate: (w.requestedAt || '').slice(0, 10),
      actionRequired: `Write-off pending approval (${w.method})`,
      daysLeft: 0,
    })
  }

  return out.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 120)
}

export async function sendAssetsAlertDigest(): Promise<{ ok: boolean; count: number }> {
  const alerts = await collectAaAlerts()
  const hot = alerts.filter((a) => a.severity === 'critical' || a.daysLeft <= 15)
  if (!hot.length) return { ok: true, count: 0 }
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, count: hot.length }
  try {
    const resend = new Resend(apiKey)
    const to = suiteDirectorEmail() || 'director@agilegroup.co.in'
    const cc = [LOKESH_CC_EMAIL].filter((e) => e && e !== to)
    const rows = hot
      .slice(0, 40)
      .map(
        (a) =>
          `<tr><td>${a.kind}</td><td>${a.assetCode}</td><td>${a.assetName}</td><td>${a.branchName}</td><td>${a.dueDate}</td><td>${a.actionRequired}</td></tr>`,
      )
      .join('')
    await sendSuiteEmail(resend, {
      from: pinMailFrom(),
      to,
      cc: cc.length ? cc : undefined,
      subject: `Agile Assets alerts — ${hot.length} action(s)`,
      html: `<div style="font-family:Arial,sans-serif;max-width:720px">
        <h2>Agile Assets — upcoming actions</h2>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:13px;width:100%">
          <thead><tr><th>Kind</th><th>Code</th><th>Asset</th><th>Location</th><th>Due</th><th>Action</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="font-size:12px;color:#64748b">Agile Assets · Director only (IT not copied)</p>
      </div>`,
      skipDirectorCc: true,
    })
    return { ok: true, count: hot.length }
  } catch {
    return { ok: false, count: hot.length }
  }
}
