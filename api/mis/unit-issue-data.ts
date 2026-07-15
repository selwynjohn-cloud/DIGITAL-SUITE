import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import { getBranches, getActiveBranch, getClients, misStorageOk } from '../_lib/mis/store.js'
import { getUnitIssueRegister, saveUnitIssueRegister, type UnitIssueRow } from '../_lib/mis/unit-issue.js'
import {
  buildSlaIndentMailHtml,
  buildStoresIssueMailHtml,
  getSlaIssueRegister,
  groupSlaIndents,
  saveSlaIssueRegister,
  summarizeSlaPending,
  type SlaUnitRow,
} from '../_lib/mis/sla-issue.js'
import { misRequestAuthed } from '../_lib/mis/session.js'
import { sendSlaRepeatedIndentMail } from '../_lib/mis/digest.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = (req.body ?? {}) as Record<string, unknown>
  const action = String(body.action ?? '')

  if (action === 'branches') {
    const branches = await getBranches(true)
    return res.status(200).json({ ok: true, branches: branches.map((b) => ({ id: b.id, name: b.name })) })
  }

  if (action === 'slaPendingAll') {
    if (!misRequestAuthed(req)) return res.status(401).json({ error: 'Please sign in.' })
    const branches = await getBranches(true)
    const rows: { branchId: string; branchName: string; summary: ReturnType<typeof summarizeSlaPending>; units: SlaUnitRow[] }[] = []
    for (const b of branches) {
      const units = await getSlaIssueRegister(b.id, false)
      const summary = summarizeSlaPending(b.id, b.name, units)
      if (summary.pendingUnits || summary.repeatedUnits) rows.push({ branchId: b.id, branchName: b.name, summary, units })
    }
    return res.status(200).json({ ok: true, branches: rows })
  }

  const branchId = String(body.branchId ?? '')
  const sessionToken = String(body.sessionToken ?? '')
  const staffSession = sessionToken ? await verifyAppSession(sessionToken, 'mis-report') : null
  const mgmtAuthed = misRequestAuthed(req)

  if (!staffSession && !mgmtAuthed) {
    return res.status(401).json({ error: 'Please sign in.' })
  }

  const readOnly = mgmtAuthed && !staffSession

  if (staffSession && branchId) {
    const active = await getActiveBranch(branchId)
    if (!active) {
      return res.status(403).json({
        error: 'This branch is deactivated. Only activated branch teams can access the portal. Contact management.',
      })
    }
  }

  if (action === 'load') {
    const rows = await getUnitIssueRegister(branchId, true)
    const branch = (await getBranches(true)).find((b) => b.id === branchId)
    return res.status(200).json({ ok: true, branchName: branch?.name ?? '', rows, readOnly })
  }

  if (action === 'save') {
    if (readOnly) return res.status(403).json({ error: 'Management view is read-only. HODs enter data on Daily Branch Report.' })
    if (!misStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
    const arr = Array.isArray(body.rows) ? body.rows : []
    const ok = await saveUnitIssueRegister(branchId, arr as UnitIssueRow[])
    if (!ok) return res.status(503).json({ error: 'Could not save.' })
    return res.status(200).json({ ok: true, count: arr.length })
  }

  if (action === 'loadSla') {
    const rows = await getSlaIssueRegister(branchId, true)
    const branch = (await getBranches()).find((b) => b.id === branchId)
    return res.status(200).json({ ok: true, branchName: branch?.name ?? '', rows, readOnly })
  }

  if (action === 'saveSla') {
    if (readOnly) return res.status(403).json({ error: 'Management view is read-only. HODs enter data on Daily Branch Report.' })
    if (!misStorageOk()) return res.status(503).json({ error: 'Storage not connected.' })
    const arr = Array.isArray(body.rows) ? body.rows : []
    const ok = await saveSlaIssueRegister(branchId, arr as SlaUnitRow[])
    if (!ok) return res.status(503).json({ error: 'Could not save.' })
    const rows = await getSlaIssueRegister(branchId, false)
    return res.status(200).json({ ok: true, count: rows.length, rows })
  }

  if (action === 'sendSlaIndentMail') {
    if (!mgmtAuthed && !staffSession) return res.status(401).json({ error: 'Please sign in.' })
    const toRaw = String(body.to ?? '').trim()
    const to = toRaw.split(/[,;]+/).map((e) => e.trim()).filter((e) => e.includes('@'))
    if (!to.length) return res.status(400).json({ error: 'Please enter a valid email address.' })

    const rows = await getSlaIssueRegister(branchId, false)
    const clientId = String(body.clientId ?? '')
    const branch = (await getBranches()).find((b) => b.id === branchId)
    const branchName = branch?.name ?? 'Branch'
    let indents = groupSlaIndents(rows)
    let clientName: string | undefined
    if (clientId) {
      indents = indents.filter((g) => g.clientId === clientId)
      clientName = indents[0]?.clientName
    }
    if (!indents.length) return res.status(400).json({ error: 'No repeated SLA issues to share.' })
    const html = await buildSlaIndentMailHtml(branchName, indents)
    const mail = await sendSlaRepeatedIndentMail(to, branchName, html, clientName)
    if (!mail.ok) return res.status(503).json({ error: mail.error ?? 'Could not send email.' })
    return res.status(200).json({ ok: true, to: mail.to })
  }

  if (action === 'sendStoresMail') {
    if (!mgmtAuthed && !staffSession) return res.status(401).json({ error: 'Please sign in.' })
    const toRaw = String(body.to ?? process.env.MIS_STORES_EMAIL ?? 'stores@agilegroup.co.in').trim()
    const to = toRaw.split(/[,;]+/).map((e) => e.trim()).filter((e) => e.includes('@'))
    const idx = Number(body.rowIndex)
    const rows = (body.rows as SlaUnitRow[]) ?? (await getSlaIssueRegister(branchId, false))
    const row = rows[idx]
    if (!row) return res.status(400).json({ error: 'Row not found.' })
    const branch = (await getBranches()).find((b) => b.id === branchId)
    const html = await buildStoresIssueMailHtml(branch?.name ?? '', row)
    const mail = await sendSlaRepeatedIndentMail(to, branch?.name ?? '', html, row.clientName)
    if (!mail.ok) return res.status(503).json({ error: mail.error ?? 'Could not send.' })
    rows[idx] = { ...row, sharedWithStores: true }
    if (!readOnly) await saveSlaIssueRegister(branchId, rows)
    return res.status(200).json({ ok: true, to: mail.to, rows })
  }

  return res.status(400).json({ error: 'Unknown action.' })
}
