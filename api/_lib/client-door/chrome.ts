/**
 * Client Door letterhead — same header / footer on the link mail and the opened report.
 */
import { branchLetterheadAddressLines } from '../mis/branch-letterhead.js'
import { MIS_BRAND, misLetterPrintFooter } from '../mis/brand.js'

export const CLIENT_DOOR_SEE_TEXT =
  "You will see your dashboard for the previous duty completed day (yesterday's) — Sanctioned Post, Absent, OT, Deployed Strength, Vacant, Agile Visits, Last Night Check, Last Training, Guards Complaints, Clients Complaints, Incident, Late Start, Out Of Post (numbers only)."

export function clientDoorTitle(clientName: string): string {
  const name = String(clientName || '').trim() || 'Client'
  return `Client Door - ${name}`
}

export function escDoor(s: unknown): string {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function fmtDoorDate(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd ?? '').trim())
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(ymd ?? '')
}

export function clientDoorHeaderHtml(opts: {
  clientName: string
  subtitle: string
  branchName?: string
}): string {
  const title = clientDoorTitle(opts.clientName)
  const addr = branchLetterheadAddressLines(opts.branchName || '')
    .map((line) => escDoor(line))
    .join('<br>')
  return (
    `<div style="background:linear-gradient(135deg,#14224f 0%,#1e3a8a 58%,#0f172a 100%);padding:18px 20px 16px;border-radius:12px 12px 0 0;border-bottom:4px solid #c9a84c">` +
    `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">` +
    `<tr>` +
    `<td width="72" style="vertical-align:middle;padding-right:14px">` +
    `<img src="${MIS_BRAND.logoUrl}" alt="Agile" width="64" height="64" style="display:block;border-radius:10px;background:transparent;padding:4px" />` +
    `</td>` +
    `<td style="vertical-align:middle">` +
    `<div style="font-size:17px;font-weight:800;color:#ffffff;line-height:1.35">${escDoor(MIS_BRAND.company)}</div>` +
    `<div style="font-size:20px;font-weight:900;color:#c9a84c;margin-top:8px">${escDoor(title)}</div>` +
    `<div style="font-size:13px;color:#e2e8f0;margin-top:6px;line-height:1.45">${escDoor(opts.subtitle)}</div>` +
    `</td>` +
    `</tr>` +
    `</table>` +
    `<div style="margin-top:14px;padding:10px 12px;background:rgba(255,255,255,.1);border-radius:8px;border-left:4px solid #c9a84c">` +
    `<div style="font-size:12px;color:#e2e8f0;line-height:1.5">${addr}</div>` +
    `</div>` +
    `</div>`
  )
}

export function clientDoorFooterHtml(): string {
  return misLetterPrintFooter()
}
