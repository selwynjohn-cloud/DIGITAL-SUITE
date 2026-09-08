/**
 * Recruited / Rejoin deployment follow-up (help desk + deployment order).
 */

import { getDrrDetails, type DrrRecruitRow } from './drr-detail-store.js'
import { recruitNid } from './store.js'

const KEY = 'recruit:deploy-followups'

export type DeployFollowup = {
  id: string
  kind: 'new' | 'rejoin'
  recruitDate: string
  name: string
  empId: string
  rank: string
  branch: string
  unit: string
  location: string
  mobile: string
  omContact: string
  mapsUrl: string
  call1Status: string
  call2Status: string
  call3Status: string
  call4Status: string
  call5Status: string
  call6Status: string
  finalRemark: 'Settled' | 'Not settled'
  sourceRecruitId: string
  active: boolean
  updatedAt: string
}

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url, token } : null
}

async function redis(command: unknown[]): Promise<{ result?: unknown } | null> {
  const cfg = redisConfig()
  if (!cfg) return null
  try {
    const res = await fetch(cfg.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    })
    if (!res.ok) return null
    return (await res.json()) as { result?: unknown }
  } catch {
    return null
  }
}

function emptyCalls(): Pick<
  DeployFollowup,
  'call1Status' | 'call2Status' | 'call3Status' | 'call4Status' | 'call5Status' | 'call6Status'
> {
  return {
    call1Status: '',
    call2Status: '',
    call3Status: '',
    call4Status: '',
    call5Status: '',
    call6Status: '',
  }
}

export async function getDeployFollowups(): Promise<DeployFollowup[]> {
  const d = await redis(['GET', KEY])
  if (typeof d?.result !== 'string') return []
  try {
    return JSON.parse(d.result) as DeployFollowup[]
  } catch {
    return []
  }
}

export async function saveDeployFollowups(list: DeployFollowup[]): Promise<boolean> {
  const r = await redis(['SET', KEY, JSON.stringify(list.slice(0, 20000))])
  return r?.result === 'OK'
}

function mapsUrlFor(unit: string, location: string): string {
  const q = [unit, location].filter(Boolean).join(', ')
  if (!q) return ''
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

function fromRecruit(
  p: { reportDate: string; branchId: string },
  r: DrrRecruitRow,
  kind: 'new' | 'rejoin',
): DeployFollowup {
  const unit = String(r.unit || '')
  const location = String(r.location || '')
  return {
    id: recruitNid('df'),
    kind,
    recruitDate: String(r.doj || p.reportDate || '').slice(0, 10),
    name: String(r.name || ''),
    empId: String(r.empId || ''),
    rank: String(r.designation || ''),
    branch: String(p.branchId || ''),
    unit,
    location,
    mobile: String(r.mobile || ''),
    omContact: String(r.informedTo || ''),
    mapsUrl: mapsUrlFor(unit, location),
    ...emptyCalls(),
    finalRemark: 'Not settled',
    sourceRecruitId: String(r.id || ''),
    active: true,
    updatedAt: new Date().toISOString(),
  }
}

/** Pull new/rejoin rows from detailed DRR into follow-up ledger (idempotent by empId+date+kind). */
export async function syncDeployFollowupsFromDrr(
  kind: 'new' | 'rejoin',
): Promise<{ ok: boolean; added: number; total: number }> {
  const [prev, details] = await Promise.all([getDeployFollowups(), getDrrDetails()])
  const keyOf = (x: { empId: string; recruitDate: string; kind: string; branch: string }) =>
    `${x.kind}|${x.branch}|${x.empId}|${x.recruitDate}`.toLowerCase()
  const seen = new Set(prev.filter((p) => p.active !== false).map(keyOf))
  const next = [...prev]
  let added = 0
  for (const p of details) {
    if (p.active === false) continue
    for (const r of p.recruits || []) {
      const rowKind = r.kind === 'rejoin' ? 'rejoin' : 'new'
      if (rowKind !== kind) continue
      const draft = fromRecruit(p, r, rowKind)
      const k = keyOf(draft)
      if (seen.has(k)) continue
      seen.add(k)
      next.push(draft)
      added += 1
    }
  }
  await saveDeployFollowups(next)
  return { ok: true, added, total: next.filter((x) => x.active !== false && x.kind === kind).length }
}

export function buildDeploymentOrderText(row: DeployFollowup): string {
  const maps = row.mapsUrl || mapsUrlFor(row.unit, row.location)
  const control = process.env.RECRUIT_CONTROL_MOBILE?.trim() || '18005995599'
  const helpdesk = process.env.RECRUIT_HELPDESK_MOBILE?.trim() || '18005995599'
  return [
    'Agile Security Force — Deployment Order',
    '',
    `Name: ${row.name}`,
    `ID number: ${row.empId}`,
    `Rank: ${row.rank}`,
    `Branch: ${row.branch}`,
    `Location / Unit: ${row.unit}${row.location ? ' — ' + row.location : ''}`,
    maps ? `GPS / Directions: ${maps}` : 'GPS / Directions: (add unit location)',
    '',
    `Control: ${control}`,
    `Help Desk: ${helpdesk}`,
    `OM name · Mobile: ${row.omContact || '—'}`,
    '',
    'Please keep your mobile alarm on and report as directed.',
    'Agile Recruitment',
  ].join('\n')
}

export function buildDeploymentOrderHtml(row: DeployFollowup): string {
  const maps = row.mapsUrl || mapsUrlFor(row.unit, row.location)
  const control = process.env.RECRUIT_CONTROL_MOBILE?.trim() || '18005995599'
  const helpdesk = process.env.RECRUIT_HELPDESK_MOBILE?.trim() || '18005995599'
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Deployment Order</title></head>
<body style="font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#0f172a">
  <h2 style="color:#1e3a8a">Agile Security Force — Deployment Order</h2>
  <p><b>Name:</b> ${esc(row.name)} &nbsp; <b>ID number:</b> ${esc(row.empId)} &nbsp; <b>Rank:</b> ${esc(row.rank)}</p>
  <p><b>Branch:</b> ${esc(row.branch)}<br><b>Location / Unit:</b> ${esc(row.unit)}${row.location ? ' — ' + esc(row.location) : ''}</p>
  <p><b>Control:</b> ${esc(control)} &nbsp; <b>Help Desk:</b> ${esc(helpdesk)}</p>
  <p><b>OM name · Mobile:</b> ${esc(row.omContact || '—')}</p>
  ${maps ? `<p><b>GPS / Directions:</b> <a href="${esc(maps)}" target="_blank" rel="noopener">${esc(maps)}</a></p>` : '<p><b>GPS / Directions:</b> add unit location</p>'}
  <p style="margin-top:18px;color:#64748b;font-size:13px">Please keep your mobile alarm on and report as directed.</p>
</body></html>`
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function waUrlForText(mobile: string, text: string): string {
  const digits = String(mobile || '').replace(/\D/g, '')
  const phone = digits.length >= 10 ? (digits.length === 10 ? '91' + digits : digits) : ''
  const base = phone ? `https://wa.me/${phone}` : 'https://wa.me/'
  return `${base}?text=${encodeURIComponent(text)}`
}
