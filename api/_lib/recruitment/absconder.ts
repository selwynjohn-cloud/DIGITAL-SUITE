import {
  getAttendanceDates,
  getAttendanceMarks,
  getGuards,
  getJoinBacks,
  type GuardAttendanceMark,
  type JoinBackRecord,
} from './store.js'
import {
  formatRecruitBranchDisplay,
  hydZoneCentreFromText,
  RECRUITMENT_BRANCH_META,
} from './branches.js'
import { absconderFollowKey, getAbsconderFollows } from './absconder-followup.js'
import { digMobile, looksLikeEmpId } from './work360-employees.js'
import type { MisBranch, MisClient } from '../mis/store.js'

export type AbsconderRow = {
  key: string
  employeeId: string
  guardName: string
  mobile: string
  client: string
  unit: string
  absentSince: string
  consecutiveDays: number
  branch: string
  branchHint: string
  source?: 'mobile' | 'joinback'
  followStatus: 'pending' | 'joined'
  remindedAt: string
  terminatedAt?: string
}

function guardKey(m: GuardAttendanceMark): string {
  return (m.employeeId || m.guardName).trim().toLowerCase()
}

function addDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

function isAbsentMark(m: GuardAttendanceMark): boolean {
  return m.status === 'absent' || m.status === 'unknown'
}

function rejoinedAfter(joinbacks: JoinBackRecord[], guardName: string, employeeId: string, since: string): boolean {
  const key = (employeeId || guardName).toLowerCase()
  return joinbacks.some((j) => {
    if (!j.active || j.status !== 'rejoined') return false
    const jk = (j.guardName || '').toLowerCase()
    if (jk !== key && jk !== guardName.toLowerCase()) return false
    return (j.rejoinDate || '') >= since
  })
}

function bestSample(marks: GuardAttendanceMark[]): GuardAttendanceMark {
  return marks.slice().sort((a, b) => {
    const score = (m: GuardAttendanceMark) =>
      (m.guardName && !looksLikeEmpId(m.guardName) ? 4 : 0) +
      (m.mobile ? 3 : 0) +
      (m.employeeId ? 2 : 0) +
      (m.unit ? 1 : 0) +
      (m.client ? 1 : 0)
    return score(b) - score(a)
  })[0]
}

/** HDFC Tada is Nellore (Tada book = Premier Energies only). */
function specialSiteBranch(hay: string): string {
  const t = hay.toLowerCase()
  if (/\btada\b/.test(t) && /\bhdfc\b/.test(t)) return 'Nellore'
  if (/\btada\b/.test(t) && /premier/.test(t)) return 'Tada'
  return ''
}

export function resolveAbsconderBranch(
  text: string,
  clients: MisClient[] = [],
  branches: MisBranch[] = [],
): string {
  const hay = String(text || '').trim()
  if (!hay) return 'Unassigned'
  const special = specialSiteBranch(hay)
  if (special) return special
  const hyd = hydZoneCentreFromText(hay)
  if (hyd) return hyd

  const low = hay.toLowerCase()
  const hits = RECRUITMENT_BRANCH_META.filter((m) => {
    if (low.includes(m.id.toLowerCase())) return true
    return m.misNameHints.some((h) => h && low.includes(h.toLowerCase()))
  }).sort((a, b) => b.id.length - a.id.length)
  if (hits[0]) return hits[0].id

  if (clients.length && branches.length) {
    const scored = clients
      .filter((c) => c.active !== false)
      .map((c) => {
        const name = String(c.name || '').toLowerCase()
        const loc = String(c.location || '').toLowerCase()
        if (!name) return { c, n: 0 }
        let n = 0
        if (name && low.includes(name)) n += 3
        if (name && name.includes(low.slice(0, 12))) n += 1
        if (loc && low.includes(loc)) n += 4
        return { c, n }
      })
      .filter((x) => x.n >= 4)
      .sort((a, b) => b.n - a.n)
    const best = scored[0]?.c
    if (best) {
      const b = branches.find((x) => x.id === best.branchId)
      const label = formatRecruitBranchDisplay(b?.name || '', best.branchId)
      if (label && label !== '—') return label
    }
  }

  return 'Unassigned'
}

export function sameRecruitBranch(a: string, b: string): boolean {
  const na = formatRecruitBranchDisplay(a || '', a)
  const nb = formatRecruitBranchDisplay(b || '', b)
  if (!na || !nb || na === '—' || nb === '—') return false
  if (na.toLowerCase() === nb.toLowerCase()) return true
  return na.toLowerCase().includes(nb.toLowerCase()) || nb.toLowerCase().includes(na.toLowerCase())
}

function enrichLocal(
  row: AbsconderRow,
  joinbacks: JoinBackRecord[],
  guards: { name: string; mobile: string; siteZone?: string; deployedSite?: string }[],
): AbsconderRow {
  let guardName = row.guardName
  let mobile = digMobile(row.mobile)
  if (!mobile || !guardName || looksLikeEmpId(guardName)) {
    const nameLow = guardName.toLowerCase()
    const jb = joinbacks.find((j) => {
      if (mobile && digMobile(j.mobile) === mobile) return true
      return nameLow && (j.guardName || '').toLowerCase() === nameLow
    })
    if (jb) {
      if (!guardName || looksLikeEmpId(guardName)) guardName = jb.guardName || guardName
      if (!mobile) mobile = digMobile(jb.mobile)
    }
    const g = guards.find((x) => {
      if (mobile && digMobile(x.mobile) === mobile) return true
      return nameLow && (x.name || '').toLowerCase() === nameLow
    })
    if (g) {
      if (!guardName || looksLikeEmpId(guardName)) guardName = g.name || guardName
      if (!mobile) mobile = digMobile(g.mobile)
    }
  }
  return { ...row, guardName, mobile }
}

function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T12:00:00`).getTime()
  const b = new Date(`${to}T12:00:00`).getTime()
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0
  return Math.round((b - a) / 86_400_000)
}

function lastDateWith(
  marks: GuardAttendanceMark[],
  pred: (m: GuardAttendanceMark) => boolean,
): string {
  const dates = marks.filter(pred).map((m) => m.date).sort()
  return dates[dates.length - 1] || ''
}

/** Guard with no present/leave for 7+ days — missing export days count as absent. */
export function computeAbsconders(
  marksByDate: Map<string, GuardAttendanceMark[]>,
  joinbacks: JoinBackRecord[],
  asOf: string,
  minDays = 7,
): AbsconderRow[] {
  const byGuard = new Map<string, GuardAttendanceMark[]>()
  for (const [date, marks] of marksByDate) {
    if (date > asOf) continue
    for (const m of marks) {
      const k = guardKey(m)
      if (!k) continue
      if (!byGuard.has(k)) byGuard.set(k, [])
      byGuard.get(k)!.push({ ...m, date })
    }
  }

  const out: AbsconderRow[] = []

  for (const [, marks] of byGuard) {
    const sample = bestSample(marks)
    const lastOk = lastDateWith(
      marks,
      (m) => m.status === 'present' || m.status === 'late' || m.status === 'leave',
    )
    const firstMark = marks.map((m) => m.date).sort()[0] || asOf
    let consecutiveDays = 0
    let absentSince = asOf
    if (lastOk) {
      consecutiveDays = daysBetween(lastOk, asOf)
      absentSince = addDays(lastOk, 1)
    } else if (marks.some(isAbsentMark) || marks.length) {
      consecutiveDays = daysBetween(firstMark, asOf) + 1
      absentSince = firstMark
    }
    if (consecutiveDays < minDays) continue
    if (rejoinedAfter(joinbacks, sample.guardName, sample.employeeId, absentSince)) continue

    const hay = `${sample.client} ${sample.unit}`
    out.push({
      key: '',
      employeeId: sample.employeeId,
      guardName: looksLikeEmpId(sample.guardName) ? '' : sample.guardName,
      mobile: digMobile(sample.mobile),
      client: sample.client,
      unit: sample.unit,
      absentSince,
      consecutiveDays,
      branch: resolveAbsconderBranch(hay),
      branchHint: sample.unit || sample.client,
      source: 'mobile',
      followStatus: 'pending',
      remindedAt: '',
    })
  }

  return out
}

export function abscondersFromJoinbacks(
  joinbacks: JoinBackRecord[],
  asOf: string,
  minDays = 7,
): AbsconderRow[] {
  const asOfMs = new Date(`${asOf}T12:00:00`).getTime()
  const out: AbsconderRow[] = []

  for (const j of joinbacks) {
    if (!j.active || j.status !== 'absent' || !j.leftDate) continue
    const leftMs = new Date(`${j.leftDate}T12:00:00`).getTime()
    if (!Number.isFinite(leftMs)) continue
    const days = Math.floor((asOfMs - leftMs) / 86_400_000) + 1
    if (days < minDays) continue
    const hay = `${j.branchId} ${j.siteZone}`
    const resolved = resolveAbsconderBranch(hay)
    out.push({
      key: '',
      employeeId: '',
      guardName: j.guardName,
      mobile: digMobile(j.mobile),
      client: '',
      unit: j.siteZone,
      absentSince: j.leftDate,
      consecutiveDays: days,
      branch: resolved !== 'Unassigned' ? resolved : j.branchId || 'Unassigned',
      branchHint: j.branchId || j.siteZone,
      source: 'joinback',
      followStatus: 'pending',
      remindedAt: '',
    })
  }

  return out
}

export function sortAbscondersBranchWise(rows: AbsconderRow[]): AbsconderRow[] {
  const counts = new Map<string, number>()
  for (const r of rows) counts.set(r.branch || 'Unassigned', (counts.get(r.branch || 'Unassigned') || 0) + 1)
  return rows.slice().sort((a, b) => {
    const ba = a.branch || 'Unassigned'
    const bb = b.branch || 'Unassigned'
    if (ba === 'Unassigned' && bb !== 'Unassigned') return 1
    if (bb === 'Unassigned' && ba !== 'Unassigned') return -1
    const ca = counts.get(ba) || 0
    const cb = counts.get(bb) || 0
    if (cb !== ca) return cb - ca
    if (ba !== bb) return ba.localeCompare(bb, 'en', { sensitivity: 'base' })
    return b.consecutiveDays - a.consecutiveDays || a.guardName.localeCompare(b.guardName)
  })
}

export function groupAbscondersByBranch(rows: AbsconderRow[]): { branch: string; rows: AbsconderRow[] }[] {
  const order: string[] = []
  const map = new Map<string, AbsconderRow[]>()
  for (const r of sortAbscondersBranchWise(rows)) {
    const b = r.branch || 'Unassigned'
    if (!map.has(b)) {
      map.set(b, [])
      order.push(b)
    }
    map.get(b)!.push(r)
  }
  return order.map((branch) => ({
    branch,
    rows: (map.get(branch) || []).sort((a, b) => b.consecutiveDays - a.consecutiveDays),
  }))
}

export async function loadAbsconders(asOf: string, minDays = 7): Promise<AbsconderRow[]> {
  const marksByDate = new Map<string, GuardAttendanceMark[]>()
  const stored = (await getAttendanceDates()).filter((d) => d && d <= asOf && d >= addDays(asOf, -30))
  const want = new Set(stored)
  for (let i = 0; i < 21; i++) want.add(addDays(asOf, -i))
  for (const day of want) {
    const marks = await getAttendanceMarks(day)
    if (marks.length) marksByDate.set(day, marks)
  }
  const [joinbacks, guards, follows] = await Promise.all([
    getJoinBacks(),
    getGuards(),
    getAbsconderFollows(),
  ])

  const mobile = computeAbsconders(marksByDate, joinbacks, asOf, minDays)
  const manual = abscondersFromJoinbacks(joinbacks, asOf, minDays)
  const seen = new Set<string>()
  const merged: AbsconderRow[] = []
  for (const g of [...mobile, ...manual]) {
    const filled = enrichLocal(g, joinbacks, guards)
    const hay = `${filled.branch} ${filled.branchHint} ${filled.client} ${filled.unit}`
    const branch = resolveAbsconderBranch(hay)
    const row: AbsconderRow = { ...filled, branch: branch || filled.branch || 'Unassigned' }
    row.key = absconderFollowKey(row)
    const follow = follows.find((f) => f.key === row.key)
    if (follow) {
      row.followStatus = follow.status
      row.remindedAt = follow.remindedAt
      row.terminatedAt = follow.terminatedAt || ''
    }
    if (follow?.status === 'joined') continue
    const k = `${(row.employeeId || row.guardName).toLowerCase()}|${row.mobile}`
    if (seen.has(k)) continue
    seen.add(k)
    merged.push(row)
  }
  return sortAbscondersBranchWise(merged)
}

export type AbsconderNoticeInput = {
  guardName?: string
  employeeId?: string
  mobile?: string
  branch?: string
  unit?: string
  client?: string
  absentSince?: string
  consecutiveDays?: number
  noticeDate?: string
}

function ymdToDmy(iso: string): string {
  const raw = String(iso || '').trim()
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[3]}/${m[2]}/${m[1]}`
  return raw || '—'
}

function noticeBits(row: AbsconderNoticeInput) {
  const name = String(row.guardName || 'Guard').trim() || 'Guard'
  const empId = String(row.employeeId || '').trim()
  const days = Math.max(7, Number(row.consecutiveDays) || 7)
  const since = ymdToDmy(String(row.absentSince || ''))
  const when = ymdToDmy(String(row.noticeDate || '')) || ymdToDmy(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }))
  return {
    name,
    empId,
    mobile: String(row.mobile || '').replace(/\D/g, '').slice(-10),
    branch: String(row.branch || '').trim(),
    site: String(row.unit || row.client || '').trim(),
    days,
    since,
    when,
  }
}

/** Formal notice: absconded and took company ID card + uniform. */
export function absconderTerminationNoticeText(row: AbsconderNoticeInput): string {
  const n = noticeBits(row)
  return [
    'AGILE SECURITY FORCE PRIVATE LIMITED',
    'TERMINATION NOTICE',
    '',
    `Date: ${n.when}`,
    `To: ${n.name}${n.empId ? `  (Employee ID ${n.empId})` : ''}`,
    n.mobile ? `Mobile: ${n.mobile}` : null,
    n.branch ? `Branch: ${n.branch}` : null,
    n.site ? `Site: ${n.site}` : null,
    '',
    'Subject: Termination of service — you left duty and took company ID card and Uniform',
    '',
    `You have been absent from duty without permission since ${n.since} (${n.days} days). You ran away from your post and took company property:`,
    '1. Company Identity Card',
    '2. Company Uniform',
    '',
    'Your services stand terminated with immediate effect for absconding.',
    '',
    'Return the Identity Card and Uniform to the Branch HOD at once. If you do not return them, the company will recover the cost and may take legal action.',
    '',
    'Help Desk: 18005995599',
    '— Agile Security Force Private Limited',
    'Agile Recruitment',
  ]
    .filter((line): line is string => line !== null)
    .join('\n')
}

export function absconderTerminationNoticeHtml(row: AbsconderNoticeInput): string {
  const n = noticeBits(row)
  const esc = (v: unknown) =>
    String(v ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
  const meta = [
    n.empId ? `<p><b>Employee ID:</b> ${esc(n.empId)}</p>` : '',
    n.mobile ? `<p><b>Mobile:</b> ${esc(n.mobile)}</p>` : '',
    n.branch ? `<p><b>Branch:</b> ${esc(n.branch)}</p>` : '',
    n.site ? `<p><b>Site:</b> ${esc(n.site)}</p>` : '',
  ].join('')
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Termination Notice — ${esc(n.name)}</title>
<style>
body{margin:0;background:#e8eef6;font-family:'Times New Roman',Times,serif;color:#111}
.paper{max-width:720px;margin:18px auto;background:#fff;border:1px solid #c9a84c;box-shadow:0 8px 28px rgba(15,23,42,.18)}
.gold{height:5px;background:linear-gradient(90deg,#c9a84c,#fbbf24,#c9a84c)}
.hdr{text-align:center;padding:22px 22px 12px;background:linear-gradient(135deg,#4c1d95 0%,#7c3aed 45%,#0ea5e9 100%);color:#fff}
.hdr img{height:58px;background:transparent;display:block;margin:0 auto 10px}
.co{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#ddd6fe;font-weight:700}
.h1{margin:8px 0 0;font-size:22px;font-weight:900}
.sub{margin:6px 0 0;font-size:13px;color:#e0f2fe}
.body{padding:22px 26px 10px;line-height:1.55;font-size:16px}
.date{text-align:right;font-weight:700;margin:0 0 14px}
.to p{margin:3px 0}
.subj{margin:16px 0;font-weight:800}
.box{background:#fff7ed;border:1px solid #f59e0b;border-radius:8px;padding:12px 14px;margin:12px 0}
.box ol{margin:8px 0 0 22px;padding:0}
.ftr{text-align:center;padding:14px 18px 20px;font-size:13px;color:#334155}
.help{font-weight:800;color:#5b21b6}
</style></head><body>
<div class="paper">
  <div class="gold"></div>
  <div class="hdr">
    <img src="https://www.agilegroup-digital.co.in/agile-logo-clear.png" alt="Agile" style="background:transparent">
    <div class="co">Agile Security Force Private Limited</div>
    <h1 class="h1">TERMINATION NOTICE</h1>
    <p class="sub">Absconding — company ID card and Uniform not returned</p>
  </div>
  <div class="body">
    <p class="date">Date: ${esc(n.when)}</p>
    <div class="to">
      <p><b>To:</b> ${esc(n.name)}</p>
      ${meta}
    </div>
    <p class="subj">Subject: Termination of service — you left duty and took company ID card and Uniform</p>
    <p>You have been absent from duty without permission since <b>${esc(n.since)}</b> (<b>${esc(n.days)}</b> days). You ran away from your post and took company property:</p>
    <div class="box">
      <b>Company property taken</b>
      <ol>
        <li>Company Identity Card</li>
        <li>Company Uniform</li>
      </ol>
    </div>
    <p>Your services stand <b>terminated with immediate effect</b> for absconding.</p>
    <p>Return the Identity Card and Uniform to the Branch HOD at once. If you do not return them, the company will recover the cost and may take legal action.</p>
    <p class="help">Help Desk: 18005995599</p>
    <p style="margin-top:28px">For Agile Security Force Private Limited<br><b>Agile Recruitment</b></p>
  </div>
  <div class="ftr">Confidential · For the named employee and company records</div>
</div>
</body></html>`
}

export function absconderReminderText(row: AbsconderRow): string {
  const name = row.guardName || 'Guard'
  const id = row.employeeId ? ` (ID ${row.employeeId})` : ''
  return [
    'Agile Security Force — Absconder reminder',
    `Dear ${name}${id},`,
    `You have been absent for ${row.consecutiveDays} day(s) since ${row.absentSince}.`,
    row.branch && row.branch !== 'Unassigned' ? `Branch: ${row.branch}` : '',
    row.unit ? `Site: ${row.unit}` : '',
    'Please contact your branch HOD immediately.',
    '— Agile Recruitment',
  ]
    .filter(Boolean)
    .join('\n')
}

export function absconderShareHtml(asOf: string, groups: { branch: string; rows: AbsconderRow[] }[]): string {
  const esc = (v: unknown) =>
    String(v ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
  const total = groups.reduce((n, g) => n + g.rows.length, 0)
  const blocks = groups
    .map((g) => {
      const rows = g.rows
        .map(
          (r, i) => `<tr>
          <td>${i + 1}</td>
          <td>${esc(r.guardName || '—')}</td>
          <td>${esc(r.employeeId || '—')}</td>
          <td>${esc(r.mobile || '—')}</td>
          <td>${r.consecutiveDays}</td>
          <td>${esc(r.absentSince)}</td>
          <td>${r.followStatus === 'joined' ? 'Joined' : 'Pending'}</td>
        </tr>`,
        )
        .join('')
      return `<h3 style="margin:18px 0 8px;color:#4c1d95">${esc(g.branch)} (${g.rows.length})</h3>
        <table style="border-collapse:collapse;width:100%;font-size:12px" border="1" cellpadding="6">
          <thead style="background:#4c1d95;color:#fff"><tr>
            <th>Sl.No.</th><th>Guards Name</th><th>Id No.</th><th>Mobile Number</th><th>Days</th><th>Absent since</th><th>Status</th>
          </tr></thead>
          <tbody>${rows || '<tr><td colspan="7">Nil</td></tr>'}</tbody>
        </table>`
    })
    .join('')
  return `<p>Branch-wise absconders (7+ days) as of <b>${esc(asOf)}</b>. Highest absconder branches first. Total <b>${total}</b>.</p>${blocks || '<p>No 7+ day absconders.</p>'}`
}
