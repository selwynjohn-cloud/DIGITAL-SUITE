import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAppSession } from '../_lib/app-session.js'
import { isSuiteAdminEmail } from '../_lib/auth.js'
import { getBranches } from '../_lib/mis/store.js'
import { isMgmtAllBranches } from '../_lib/suite-mgmt-branch-select.js'
import { FA_ADVISORY_URL, advLangOptions, isAdvLang } from '../_lib/training/fa-advisory-i18n.js'
import { parseClientEmails, sendFaClientAckListMail } from '../_lib/training/fa-advisory-mail.js'
import { ackListRows, listHdfcFaRecipients } from '../_lib/training/fa-advisory-recipients.js'
import {
  faHdfcEffectiveStatus,
  faHdfcReportLink,
  faHdfcStatusLabel,
  loadFaHdfcPack,
  saveFaHdfcHodApprove,
  saveFaHdfcOmReview,
  saveFaHdfcSent,
} from '../_lib/training/fa-hdfc-pack.js'
import { faHdfcReportMailHtml, faHdfcReportPageHtml } from '../_lib/training/fa-hdfc-report.js'
import {
  formatFaAdvisoryRosterText,
  loadFaAdvisoryRoster,
  loadFaAdvisoryRosters,
  parseFaAdvisoryRosterText,
  saveFaAdvisoryRoster,
  type FaAdvisoryRosterRow,
} from '../_lib/training/fa-advisory-roster.js'
import {
  listFaAdvisoryIndexBranchIds,
  loadFaAdvisoryAcksRange,
} from '../_lib/training/fa-advisory-store.js'
import { sendFaAdvisoryWhatsApp } from '../_lib/training/fa-advisory-wa.js'
import { faCertificateHtml } from '../_lib/training/fa-mail.js'
import {
  faIstYmd,
  faStorageOk,
  findFaAckById,
  isFaPublicBranch,
  listFaIndexBranchIds,
  listFaPublicBranches,
  loadFaAcksRange,
} from '../_lib/training/fa-store.js'
import { isTrainingDeptManagerEmail } from '../_lib/training/ojt-training-dept.js'

export const maxDuration = 60

function json(res: VercelResponse, status: number, body: Record<string, unknown>) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(status).json(body)
}

function readToken(req: VercelRequest): string {
  return (
    String(req.headers['x-suite-token'] ?? '').trim() ||
    String((req.body as { token?: string })?.token ?? '').trim() ||
    String(req.query.suite_token ?? '').trim()
  )
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' })
  if (!faStorageOk()) return json(res, 503, { ok: false, error: 'Storage is not configured.' })
  const session = await verifyAppSession(readToken(req), 'training')
  if (!session) return json(res, 401, { ok: false, error: 'Please sign in again.' })

  const body = (req.body || {}) as Record<string, unknown>
  const action = String(body.action ?? '').trim()
  const isMgmt = session.role === 'management'
  const isTd = isTrainingDeptManagerEmail(session.email)
  const isAdmin = isSuiteAdminEmail(session.email)
  const sessionBranchId = String(session.branchId ?? '').trim()
  const canAll = isMgmt || isTd || isAdmin
  const branches = await listFaPublicBranches()

  async function resolveBranchIds(wantedRaw: string): Promise<string[] | { error: string }> {
    const wanted = String(wantedRaw || '').trim()
    if (!canAll) {
      if (!sessionBranchId) return { error: 'Branch is required.' }
      return [sessionBranchId]
    }
    if (isMgmtAllBranches(wanted) || !wanted) {
      const indexed = await listFaIndexBranchIds()
      const advIndexed = await listFaAdvisoryIndexBranchIds()
      const all = await getBranches(true)
      const publicIds = new Set(branches.map((b) => b.id))
      return [...new Set([...indexed, ...advIndexed, ...all.filter(isFaPublicBranch).map((b) => b.id)])].filter(
        (id) => publicIds.has(id) || indexed.includes(id) || advIndexed.includes(id),
      )
    }
    return [wanted]
  }

  if (action === 'boot') {
    return json(res, 200, {
      ok: true,
      showBranchPick: canAll,
      branches,
      langs: advLangOptions(),
      publicUrl: 'https://www.agilegroup-digital.co.in/training/fa',
      advisoryUrl: FA_ADVISORY_URL,
    })
  }

  if (action === 'certificate') {
    const rec = await findFaAckById(String(body.id ?? ''), {
      branchId: String(body.branchId ?? ''),
      ymd: String(body.ymd ?? ''),
    })
    if (!rec) return json(res, 404, { ok: false, error: 'Certificate not found.' })
    if (!canAll && rec.branchId !== sessionBranchId) {
      return json(res, 403, { ok: false, error: 'This record is not for your branch.' })
    }
    return json(res, 200, { ok: true, html: faCertificateHtml(rec), record: rec })
  }

  if (action === 'advisoryLoadRoster' || action === 'advisorySaveRoster') {
    const wanted = String(body.branchId ?? '').trim()
    if (canAll && isMgmtAllBranches(wanted)) {
      if (action === 'advisorySaveRoster') {
        return json(res, 400, { ok: false, error: 'Pick one branch first, then save the phone list.' })
      }
      const allIds = await resolveBranchIds('ALL')
      if (!Array.isArray(allIds)) return json(res, 400, { ok: false, error: allIds.error })
      const roster = await loadFaAdvisoryRosters(allIds)
      return json(res, 200, { ok: true, roster, text: '', pickBranch: true, count: roster.length })
    }
    const bid = canAll ? wanted : sessionBranchId
    if (!bid) return json(res, 400, { ok: false, error: 'Pick one branch first, then save the phone list.' })
    if (action === 'advisorySaveRoster') {
      const text = String(body.text ?? '')
      const fromRows = Array.isArray(body.rows)
        ? (body.rows as FaAdvisoryRosterRow[])
        : parseFaAdvisoryRosterText(text)
      const saved = await saveFaAdvisoryRoster(bid, fromRows)
      if (!saved.length) {
        return json(res, 400, { ok: false, error: 'No names with a 10-digit mobile found. Paste Name, Mobile — one person per line.' })
      }
      return json(res, 200, {
        ok: true,
        roster: saved,
        text: formatFaAdvisoryRosterText(saved),
        count: saved.length,
        pickBranch: false,
      })
    }
    const roster = await loadFaAdvisoryRoster(bid)
    return json(res, 200, {
      ok: true,
      roster,
      text: formatFaAdvisoryRosterText(roster),
      count: roster.length,
      pickBranch: false,
    })
  }

  const branchIds = await resolveBranchIds(String(body.branchId ?? ''))
  if (!Array.isArray(branchIds)) return json(res, 400, { ok: false, error: branchIds.error })
  const from = String(body.from ?? '').slice(0, 10) || faIstYmd().slice(0, 8) + '01'
  const to = String(body.to ?? '').slice(0, 10) || faIstYmd()
  const period = `${from} to ${to}`
  const branchLabel =
    !canAll || (!isMgmtAllBranches(String(body.branchId ?? '')) && String(body.branchId ?? '').trim())
      ? branches.find((b) => b.id === branchIds[0])?.name || 'Branch'
      : 'All Branches'

  if (action === 'list') {
    const rows = await loadFaAcksRange({ branchIds, fromYmd: from, toYmd: to })
    return json(res, 200, { ok: true, rows })
  }

  if (action === 'advisoryList') {
    const rows = await loadFaAdvisoryAcksRange({ branchIds, fromYmd: from, toYmd: to })
    const trainRows = branchIds.length === 1 ? await loadFaAcksRange({ branchIds, fromYmd: from, toYmd: to }) : []
    const recipients = await listHdfcFaRecipients(branchIds)
    const roster = await loadFaAdvisoryRosters(branchIds)
    const oneId = branchIds.length === 1 ? branchIds[0] : ''
    const pack = oneId ? await loadFaHdfcPack(oneId) : null
    const status = faHdfcEffectiveStatus(pack, rows.length, trainRows.length)
    return json(res, 200, {
      ok: true,
      rows,
      trainCount: trainRows.length,
      recipientCount: recipients.length,
      pendingCount: recipients.filter((r) => !r.acknowledged).length,
      ackCount: recipients.filter((r) => r.acknowledged).length,
      rosterCount: roster.length,
      pickBranch: branchIds.length !== 1,
      pack: pack
        ? {
            status,
            statusLabel: faHdfcStatusLabel(status),
            omName: pack.omName,
            omAt: pack.omAt,
            hodName: pack.hodName,
            hodAt: pack.hodAt,
            sentAt: pack.sentAt,
            sentTo: pack.sentTo,
            reportUrl: pack.token ? faHdfcReportLink(pack.token) : '',
            grew: status === 'collecting' && Boolean(pack.omName || pack.hodName || pack.sentAt),
          }
        : null,
    })
  }

  if (action === 'advisoryPreviewRecipients') {
    const recipients = await listHdfcFaRecipients(branchIds)
    return json(res, 200, {
      ok: true,
      count: recipients.length,
      pending: recipients.filter((r) => !r.acknowledged).length,
      acknowledged: recipients.filter((r) => r.acknowledged).length,
    })
  }

  if (action === 'advisorySendWa') {
    const lang = isAdvLang(body.lang) ? String(body.lang) : 'en'
    const recipients = await listHdfcFaRecipients(branchIds)
    if (!recipients.length) {
      return json(res, 400, {
        ok: false,
        error: 'No mobile numbers found. Paste your collected Name + mobile list and tap Save list first.',
      })
    }
    const result = await sendFaAdvisoryWhatsApp({ recipients, lang, skipAcknowledged: true })
    return json(res, 200, { ok: result.sent > 0 || result.skipped === recipients.length, ...result, total: recipients.length })
  }

  const wantedBranch = String(body.branchId ?? '').trim()
  const oneBranch =
    branchIds.length === 1 && !(canAll && (isMgmtAllBranches(wantedBranch) || !wantedBranch))
      ? branchIds[0]
      : ''
  const oneBranchName = oneBranch ? branches.find((b) => b.id === oneBranch)?.name || branchLabel : ''

  if (action === 'packReviewOm') {
    if (!oneBranch) return json(res, 400, { ok: false, error: 'Pick one branch first.' })
    const omName = String(body.omName ?? '').trim()
    if (omName.length < 2) return json(res, 400, { ok: false, error: 'Type the OM name, then tap OM Review.' })
    const advRows = await loadFaAdvisoryAcksRange({ branchIds: [oneBranch], fromYmd: from, toYmd: to })
    const trainRows = await loadFaAcksRange({ branchIds: [oneBranch], fromYmd: from, toYmd: to })
    if (!advRows.length && !trainRows.length) {
      return json(res, 400, { ok: false, error: 'No acknowledgements in this period to review.' })
    }
    const pack = await saveFaHdfcOmReview({
      branchId: oneBranch,
      branchName: oneBranchName,
      omName,
      fromYmd: from,
      toYmd: to,
      advCount: advRows.length,
      trainCount: trainRows.length,
    })
    return json(res, 200, { ok: true, pack, statusLabel: faHdfcStatusLabel(pack.status) })
  }

  if (action === 'packApproveHod') {
    if (!oneBranch) return json(res, 400, { ok: false, error: 'Pick one branch first.' })
    const hodName = String(body.hodName ?? '').trim()
    if (hodName.length < 2) return json(res, 400, { ok: false, error: 'Type the HOD name, then tap HOD Approve.' })
    const advRows = await loadFaAdvisoryAcksRange({ branchIds: [oneBranch], fromYmd: from, toYmd: to })
    const trainRows = await loadFaAcksRange({ branchIds: [oneBranch], fromYmd: from, toYmd: to })
    const pack = await saveFaHdfcHodApprove({
      branchId: oneBranch,
      hodName,
      fromYmd: from,
      toYmd: to,
      advCount: advRows.length,
      trainCount: trainRows.length,
    })
    if ('error' in pack) return json(res, 400, { ok: false, error: pack.error })
    return json(res, 200, { ok: true, pack, statusLabel: faHdfcStatusLabel(pack.status) })
  }

  if (action === 'hdfcPreviewReport' || action === 'advisoryPreviewList' || action === 'trainingPreviewList') {
    if (!oneBranch) return json(res, 400, { ok: false, error: 'Pick one branch first, then preview the HDFC report.' })
    const advRaw = await loadFaAdvisoryAcksRange({ branchIds: [oneBranch], fromYmd: from, toYmd: to })
    const trainRaw = await loadFaAcksRange({ branchIds: [oneBranch], fromYmd: from, toYmd: to })
    const pack = await loadFaHdfcPack(oneBranch)
    const html = faHdfcReportPageHtml({
      advRows: ackListRows(advRaw),
      trainRows: trainRaw,
      branchLabel: oneBranchName,
      period,
      pack,
    })
    return json(res, 200, { ok: true, html, count: advRaw.length + trainRaw.length })
  }

  if (action === 'hdfcSendReport' || action === 'advisorySendClient' || action === 'trainingSendClient') {
    if (!oneBranch) return json(res, 400, { ok: false, error: 'Pick one branch first, then send the HDFC report link.' })
    const clientTo = parseClientEmails(body.clientEmails || body.to)
    if (!clientTo.length) {
      return json(res, 400, { ok: false, error: 'Enter HDFC Admin / RSO email IDs (up to 5).' })
    }
    const advRaw = await loadFaAdvisoryAcksRange({ branchIds: [oneBranch], fromYmd: from, toYmd: to })
    const trainRaw = await loadFaAcksRange({ branchIds: [oneBranch], fromYmd: from, toYmd: to })
    if (!advRaw.length && !trainRaw.length) {
      return json(res, 400, { ok: false, error: 'No acknowledgements in this period to send.' })
    }
    const marked = await saveFaHdfcSent({
      branchId: oneBranch,
      sentTo: clientTo,
      sentBy: String(body.hodName ?? session.email ?? '').trim(),
      fromYmd: from,
      toYmd: to,
      advCount: advRaw.length,
      trainCount: trainRaw.length,
    })
    if ('error' in marked) return json(res, 400, { ok: false, error: marked.error })
    const reportUrl = faHdfcReportLink(marked.token)
    const html = faHdfcReportMailHtml({
      reportUrl,
      branchLabel: oneBranchName,
      period,
      advCount: advRaw.length,
      trainCount: trainRaw.length,
      omName: marked.omName,
      hodName: marked.hodName,
    })
    const sent = await sendFaClientAckListMail({
      to: clientTo,
      html,
      subject: `HDFC Bank — FA advisory & training report · ${oneBranchName} · ${period}`,
      branchIds: [oneBranch],
    })
    if (!sent.ok) return json(res, 400, { ok: false, error: sent.error || 'Mail failed.' })
    return json(res, 200, {
      ok: true,
      sent: advRaw.length + trainRaw.length,
      to: sent.to,
      cc: sent.cc,
      reportUrl,
    })
  }

  return json(res, 400, { ok: false, error: 'Unknown action.' })
}
