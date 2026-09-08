/**
 * Send join links for Director-made AGILE-(branch) groups.
 * Does not create groups and does not add members by computer.
 */
import { getBranches, getGuardDocsMany } from '../mis/store.js'
import { redisCommand } from '../pulse/store.js'
import { agileBranchGroupSubject, storeKey } from './branch-wa-groups.js'

const SENT_KEY = 'guards:wa-invite-sent:v1'
const BATCH = 70

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function skipBranchName(name: string): boolean {
  const k = storeKey(name)
  if (!k || k === 'other') return true
  return /corporate-office|training-academy|training-department|recruitment|it-department/.test(k)
}

function norm(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function pickInvite(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const o = data as Record<string, unknown>
  const inner = o.invite && typeof o.invite === 'object' ? (o.invite as Record<string, unknown>) : o
  const link = String(inner.invite_link || inner.inviteLink || inner.link || o.invite_link || o.link || '').trim()
  if (link.startsWith('http')) return link
  const code = String(inner.invite_code || inner.inviteCode || inner.code || o.invite_code || '').trim()
  return code ? `https://chat.whatsapp.com/${code}` : ''
}

function listGroupRows(data: unknown): { id: string; name: string }[] {
  if (!data || typeof data !== 'object') return []
  const o = data as Record<string, unknown>
  const raw = Array.isArray(o.groups) ? o.groups : Array.isArray(o.data) ? o.data : Array.isArray(data) ? data : []
  const out: { id: string; name: string }[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const g = row as Record<string, unknown>
    const id = String(g.id || g.group_id || g.groupId || '').trim()
    const name = String(g.name || g.subject || g.title || '').trim()
    if (id && name) out.push({ id, name })
  }
  return out
}

function inviteText(branchName: string, url: string) {
  return (
    `*Agile Security Force*\n\n` +
    `Please join your *${branchName}* WhatsApp group:\n\n` +
    `${url}\n\n` +
    `— Agile Group`
  )
}

function matchBranch(
  groupName: string,
  branches: { id: string; name: string }[],
): { id: string; name: string } | null {
  const subject = String(groupName || '').trim()
  if (!/^agile[-_\s]/i.test(subject)) return null
  if (/^agile-staff$/i.test(norm(subject))) return null
  const tail = norm(subject.replace(/^agile[-_\s]+/i, '').replace(/\([^)]*\)/g, ''))
  const hits = branches.filter((b) => {
    if (skipBranchName(b.name)) return false
    const subj = norm(agileBranchGroupSubject(b.name))
    const bn = norm(b.name)
    return subj === norm(subject) || bn === tail || norm(b.name.replace(/^agile[-_\s]+/i, '')) === tail
  })
  if (hits.length === 1) return hits[0]
  const exact = hits.find((b) => norm(agileBranchGroupSubject(b.name)) === norm(subject))
  return exact || null
}

export async function sendBranchWaInviteLinks(opts: { preview?: boolean } = {}) {
  const wa = await import('../pulse/whatsapp.js')
  if (!wa.whatsappConfigured()) {
    return { ok: false, error: 'WhatsApp is not configured.' }
  }
  const link = await wa.waLinkStatus()
  if (!link.linked) {
    return { ok: false, error: 'WhatsApp sending phone is not connected.', link }
  }

  const listed = await wa.waListGroups()
  const groups = listGroupRows(listed?.data).filter((g) => /^agile[-_\s]/i.test(g.name))
  const branches = (await getBranches(true)).filter((b) => b.active !== false && !skipBranchName(b.name))

  const matched: {
    branchId: string
    branchName: string
    groupName: string
    groupId: string
    inviteUrl: string
  }[] = []
  const unmatched = groups.map((g) => g.name)

  for (const g of groups) {
    const b = matchBranch(g.name, branches)
    if (!b) continue
    let inviteUrl = ''
    const detail = await wa.waGetGroup(g.id)
    inviteUrl = pickInvite(detail?.data)
    if (!inviteUrl) {
      const inv = await wa.waGroupInvite(g.id)
      inviteUrl = pickInvite(inv?.data)
    }
    matched.push({
      branchId: b.id,
      branchName: b.name,
      groupName: g.name,
      groupId: g.id,
      inviteUrl,
    })
  }

  const unmatchedNames = unmatched.filter((n) => !matched.some((m) => m.groupName === n))
  const docs = await getGuardDocsMany(matched.map((m) => m.branchId))
  let rosterByBranch: Record<string, { mobile?: string; name?: string }[]> = {}
  try {
    const { canonicalizeBranch, getGuardsDataSnapshot } = await import('../guards-data/roster.js')
    const snap = await getGuardsDataSnapshot()
    if (snap) {
      for (const m of matched) {
        rosterByBranch[m.branchId] =
          snap.byBranch[canonicalizeBranch(m.branchName)] || snap.byBranch[m.branchName] || []
      }
    }
  } catch {
    /* roster optional */
  }

  const plan = matched.map((m) => {
    const seen = new Set<string>()
    const mobiles: string[] = []
    const add = (raw: string) => {
      const d = wa.whatsappChatId(raw)
      if (d.length < 12 || seen.has(d) || wa.isItBlockedWhatsApp(d)) return
      if (d.endsWith('9441009091') || d.endsWith('7893692345')) return
      seen.add(d)
      mobiles.push(d)
    }
    for (const g of docs.get(m.branchId) || []) {
      if (g.active === false || !g.mobile) continue
      add(g.mobile)
    }
    for (const p of rosterByBranch[m.branchId] || []) {
      if (!p.mobile || !p.name) continue
      add(p.mobile)
    }
    return { ...m, guardCount: mobiles.length, mobiles }
  })

  const summary = {
    ok: true,
    preview: opts.preview === true,
    groupsFound: groups.length,
    branchesMatched: plan.length,
    unmatchedGroups: unmatchedNames.slice(0, 40),
    missingInvite: plan.filter((p) => !p.inviteUrl).map((p) => p.groupName),
    branches: plan.map((p) => ({
      branch: p.branchName,
      group: p.groupName,
      guards: p.guardCount,
      hasLink: Boolean(p.inviteUrl),
    })),
    sent: 0,
    failed: 0,
    skippedAlready: 0,
    remaining: 0,
  }

  if (opts.preview) return summary

  let sent = 0
  let failed = 0
  let skippedAlready = 0
  let remaining = 0

  for (const p of plan) {
    if (!p.inviteUrl || !p.mobiles.length) continue
    const text = inviteText(p.branchName, p.inviteUrl)
    for (const mobile of p.mobiles) {
      if (sent + failed >= BATCH) {
        remaining += 1
        continue
      }
      const already = await redisCommand(['SISMEMBER', SENT_KEY, mobile])
      if (String(already?.result ?? '') === '1') {
        skippedAlready += 1
        continue
      }
      const r = await wa.waSendText(mobile, text)
      if (r?.ok) {
        sent += 1
        await redisCommand(['SADD', SENT_KEY, mobile])
      } else {
        failed += 1
      }
      await sleep(350)
    }
  }

  summary.sent = sent
  summary.failed = failed
  summary.skippedAlready = skippedAlready
  summary.remaining = remaining

  const admin = process.env.ADMIN_WHATSAPP?.trim() || process.env.DIRECTOR_WHATSAPP?.trim()
  if (admin && (sent || failed || remaining)) {
    await wa.waSendText(
      admin,
      `*Branch group links*\nSent ${sent} · Failed ${failed} · Already sent ${skippedAlready} · Left ${remaining}`,
    )
  }

  return summary
}
