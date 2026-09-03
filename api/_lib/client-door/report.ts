/**
 * Professional Client Door report — yesterday’s numbers + two pie diagrams.
 */
import { pie3dDonutSvg } from '../mis/client-perf-charts.js'
import {
  CLIENT_DOOR_SEE_TEXT,
  clientDoorFooterHtml,
  clientDoorHeaderHtml,
  escDoor,
} from './chrome.js'
import type { ClientDoorMetrics } from './metrics.js'
import type { ClientDoorSite } from './lookup.js'

function kpi(n: string | number, label: string): string {
  return (
    `<td style="padding:8px 6px;text-align:center;vertical-align:top;width:16%">` +
    `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 6px">` +
    `<div style="font-size:22px;font-weight:900;color:#14224f;line-height:1.1">${escDoor(n)}</div>` +
    `<div style="font-size:11px;font-weight:700;color:#64748b;margin-top:5px;line-height:1.3">${escDoor(label)}</div>` +
    `</div></td>`
  )
}

function piesHtml(m: ClientDoorMetrics): string {
  const pie1 = pie3dDonutSvg(
    [
      { label: 'Sanctioned Post', value: m.sanctioned, light: '#93c5fd', dark: '#1d4ed8' },
      { label: 'Deployed Strength', value: m.deployed, light: '#86efac', dark: '#15803d' },
      { label: 'OT', value: m.ot, light: '#fde68a', dark: '#b45309' },
      { label: 'Vacant', value: m.vacant, light: '#fca5a5', dark: '#b91c1c' },
    ],
    'No duty figures for yesterday',
    { centerValue: String(m.sanctioned), centerLabel: 'Sanctioned' },
  )
  const pie2 = pie3dDonutSvg(
    [
      { label: 'Sanctioned posts', value: m.sanctioned, light: '#93c5fd', dark: '#1d4ed8' },
      { label: 'Duty Start on time', value: m.onTime, light: '#86efac', dark: '#15803d' },
      { label: 'Late start', value: m.lateStart, light: '#fde68a', dark: '#b45309' },
      { label: 'Out of post', value: m.outOfPost, light: '#fca5a5', dark: '#b91c1c' },
    ],
    'No duty-start occasions for yesterday',
    { centerValue: String(m.sanctioned), centerLabel: 'Sanctioned' },
  )
  return (
    `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:12px 0 6px">` +
    `<tr>` +
    `<td style="width:50%;vertical-align:top;padding:6px;text-align:center">` +
    `<div style="font-size:13px;font-weight:800;color:#14224f;margin-bottom:8px">Sanctioned Post · Deployed · OT · Vacant</div>` +
    pie1 +
    `</td>` +
    `<td style="width:50%;vertical-align:top;padding:6px;text-align:center">` +
    `<div style="font-size:13px;font-weight:800;color:#14224f;margin-bottom:8px">Sanctioned · On time · Late start · Out of post</div>` +
    pie2 +
    `</td>` +
    `</tr></table>`
  )
}

export function clientDoorReportInnerHtml(m: ClientDoorMetrics, sites: ClientDoorSite[]): string {
  const branchName = sites[0]?.branchName || ''
  return (
    clientDoorHeaderHtml({
      clientName: m.clientLabel,
      subtitle: `Report date ${m.dateLabel} · previous duty completed day`,
      branchName,
    }) +
    `<div style="padding:18px 20px 8px;background:#fff">` +
    `<div style="font-size:12px;color:#64748b;line-height:1.5;margin-bottom:12px">${escDoor(CLIENT_DOOR_SEE_TEXT)}</div>` +
    `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>` +
    kpi(m.sanctioned, 'Sanctioned Post') +
    kpi(m.absent, 'Absent') +
    kpi(m.ot, 'OT') +
    kpi(m.deployed, 'Deployed Strength') +
    kpi(m.vacant, 'Vacant') +
    `</tr></table>` +
    `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:8px"><tr>` +
    kpi(m.agileVisits, 'Agile Visits') +
    kpi(m.lastNightCheck, 'Last Night Check') +
    kpi(m.lastTraining, 'Last Training') +
    kpi(m.guardsComplaints, 'Guards Complaints') +
    kpi(m.clientComplaints, 'Clients Complaints') +
    `</tr></table>` +
    `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:8px"><tr>` +
    kpi(m.incidents, 'Incident') +
    kpi(m.lateStart, 'Late Start') +
    kpi(m.outOfPost, 'Out Of Post') +
    kpi(m.onTime, 'Duty Start on time') +
    kpi(m.siteCount, 'Sites') +
    `</tr></table>` +
    piesHtml(m) +
    `<div style="text-align:center;margin:18px 0 8px;padding:12px;border-top:2px solid #c9a84c">` +
    `<div style="font-size:18px;font-weight:900;color:#14224f">${escDoor(m.clientLabel)}</div>` +
    `<div style="font-size:12px;color:#64748b;margin-top:4px">Client Door report · ${escDoor(m.dateLabel)}</div>` +
    `</div>` +
    clientDoorFooterHtml() +
    `</div>`
  )
}

export function clientDoorReportWrapHtml(title: string, inner: string): string {
  return (
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>Client Door - ${escDoor(title)}</title></head>` +
    `<body style="margin:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;color:#0f172a">` +
    `<div style="max-width:820px;margin:0 auto;padding:16px 12px 28px">${inner}</div></body></html>`
  )
}

export function clientDoorReportHtml(m: ClientDoorMetrics, sites: ClientDoorSite[]): string {
  return clientDoorReportWrapHtml(
    m.clientLabel,
    `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">${clientDoorReportInnerHtml(m, sites)}</div>`,
  )
}
