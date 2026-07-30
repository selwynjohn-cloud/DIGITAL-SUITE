import { Resend } from 'resend'
import { sendSuiteEmail } from '../suite-mail.js'
import { fleetEmailShell } from './brand.js'
import {
  FLEET_BRANCHES,
  fleetNum,
  type FleetDriver,
  type FleetVehicle,
  type FleetWeeklyEntry,
  type FleetWeeklyReport,
} from './store.js'
import { addEntryToStats, aggregateWeekReports, avgMileage, entryFuelType, evKmPerKwh, fmtL, fmtRs, normalizeWeeklyEntry } from './stats.js'

export function branchEmail(branch: string): string {
  const map: Record<string, string> = {
    Hyderabad: 'hyderabad@agilegroup.co.in',
    Kakinada: 'kakinada@agilegroup.co.in',
    Vijayawada: 'vijayawada@agilegroup.co.in',
    Chennai: 'chennai@agilegroup.co.in',
    Mumbai: 'maha.admin@agilegroup.co.in',
    Visakhapatnam: 'vizag@agilegroup.co.in',
    Nellore: 'nellore@agilegroup.co.in',
    Bangalore: 'bangalore@agilegroup.co.in',
    Gulbarga: 'gulbarga@agilegroup.co.in',
    'Corporate Office': 'director@agilegroup.co.in',
  }
  return map[branch] ?? 'director@agilegroup.co.in'
}

function esc(s: unknown) {
  return String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

export function daysLeft(dt: string): number {
  if (!dt) return 999
  return Math.ceil((new Date(dt).getTime() - Date.now()) / 86400000)
}

/** km per litre when fuel qty is numeric */
export function fuelEfficiency(kmWeek: number, fuelQty: string): number | null {
  const qty = fleetNum(fuelQty)
  if (!qty || !kmWeek) return null
  return Math.round((kmWeek / qty) * 10) / 10
}

export type RenewalAlert = {
  regNo: string
  branchId: string
  driverName: string
  type: 'Insurance' | 'PUC' | 'Driver License'
  validTill: string
  days: number
}

export function collectRenewalAlerts(vehicles: FleetVehicle[], withinDays = 60): RenewalAlert[] {
  const out: RenewalAlert[] = []
  for (const v of vehicles.filter((x) => x.active)) {
    const checks: { type: RenewalAlert['type']; date: string }[] = [
      { type: 'Insurance', date: v.insuranceValid },
      { type: 'PUC', date: v.pucValid },
      { type: 'Driver License', date: v.licenseValid },
    ]
    for (const c of checks) {
      const d = daysLeft(c.date)
      if (c.date && d <= withinDays) {
        out.push({ regNo: v.regNo, branchId: v.branchId, driverName: v.driverName, type: c.type, validTill: c.date, days: d })
      }
    }
  }
  return out.sort((a, b) => a.days - b.days)
}

export type DriverAlert = {
  branchId: string
  name: string
  licenseNo: string
  licenseValid: string
  medicalFitness: string
  licenseType: string
  days: number
  alertType: 'Driver License' | 'Medical Fitness'
}

export function collectDriverAlerts(drivers: FleetDriver[], branchId?: string, withinDays = 60): DriverAlert[] {
  const out: DriverAlert[] = []
  for (const d of drivers.filter((x) => x.active && (!branchId || x.branchId === branchId))) {
    if (d.licenseValid) {
      const days = daysLeft(d.licenseValid)
      if (days <= withinDays) {
        out.push({
          branchId: d.branchId,
          name: d.name,
          licenseNo: d.licenseNo,
          licenseValid: d.licenseValid,
          medicalFitness: d.medicalFitness,
          licenseType: d.licenseType,
          days,
          alertType: 'Driver License',
        })
      }
    }
    if (d.medicalFitness) {
      const days = daysLeft(d.medicalFitness)
      if (days <= withinDays) {
        out.push({
          branchId: d.branchId,
          name: d.name,
          licenseNo: d.licenseNo,
          licenseValid: d.licenseValid,
          medicalFitness: d.medicalFitness,
          licenseType: d.licenseType,
          days,
          alertType: 'Medical Fitness',
        })
      }
    }
  }
  return out.sort((a, b) => a.days - b.days)
}

function driverAlertRow(a: DriverAlert) {
  const color = a.days < 0 ? '#C0392B' : a.days < 30 ? '#E07B00' : '#856404'
  const status = a.days < 0 ? 'EXPIRED' : a.days < 30 ? 'URGENT' : 'Due Soon'
  return `<tr>
    <td>${esc(a.branchId)}</td><td><b>${esc(a.name)}</b></td><td>${esc(a.licenseNo)}</td>
    <td>${esc(a.licenseType)}</td><td>${esc(a.alertType)}</td>
    <td>${esc(a.alertType === 'Medical Fitness' ? a.medicalFitness : a.licenseValid)}</td>
    <td style="color:${color};font-weight:700">${status} (${a.days}d)</td>
  </tr>`
}

function alertRow(a: RenewalAlert) {
  const color = a.days < 0 ? '#C0392B' : a.days < 30 ? '#E07B00' : '#856404'
  const status = a.days < 0 ? 'EXPIRED' : a.days < 30 ? 'URGENT' : 'Due Soon'
  return `<tr>
    <td>${esc(a.branchId)}</td><td><b>${esc(a.regNo)}</b></td><td>${esc(a.driverName)}</td>
    <td>${esc(a.type)}</td><td>${esc(a.validTill)}</td>
    <td style="color:${color};font-weight:700">${status} (${a.days}d)</td>
  </tr>`
}

function analyseEntry(e: FleetWeeklyEntry, prev?: FleetWeeklyEntry): string[] {
  const notes: string[] = []
  const odoStart = fleetNum(e.odoStart)
  const odoEnd = fleetNum(e.odoEnd)
  const km = Number(e.kmWeek) || 0
  if (odoStart && odoEnd && odoEnd < odoStart) {
    notes.push(`Odometer reading ${odoEnd} km is less than start ${odoStart} km — please verify.`)
  } else if (odoStart && odoEnd && km && Math.abs(odoEnd - odoStart - km) > 5) {
    notes.push(`KM this week (${km}) does not match odometer difference (${odoEnd - odoStart} km).`)
  }
  if (prev) {
    const prevEnd = fleetNum(prev.odoEnd)
    if (prevEnd && odoStart && Math.abs(odoStart - prevEnd) > 10) {
      notes.push(`Start reading ${odoStart} km differs from previous week end ${prevEnd} km.`)
    }
  }
  const eff = fuelEfficiency(km, e.fuelQty)
  const ft = entryFuelType(e)
  if (ft === 'Electric') {
    const kwh = fleetNum(e.evChargeKwh)
    if (kwh && km) notes.push(`EV efficiency: ${Math.round((km / kwh) * 10) / 10} km/kWh (${km} km / ${kwh} kWh).`)
    else if (km) notes.push(`Electric vehicle — ${km} km this week (charge on need basis).`)
  } else if (eff !== null) {
    if (eff < 5) notes.push(`Low fuel efficiency: ${eff} km/l this week.`)
    else if (eff > 20) notes.push(`Unusually high efficiency (${eff} km/l) — please verify fuel quantity.`)
    else notes.push(`Fuel efficiency: ${eff} km/l (${km} km / ${e.fuelQty} L).`)
  }
  if (/accident|workshop|repair|damage/i.test(e.remarks || '')) {
    notes.push(`⚠ Remarks flag: ${e.remarks}`)
  }
  if (/accident|workshop|repair|damage/i.test(e.maintenanceDetails || '')) {
    notes.push(`Maintenance note: ${e.maintenanceDetails}`)
  }
  if (daysLeft(e.insuranceValid) < 0) notes.push('Insurance EXPIRED — renew immediately.')
  else if (daysLeft(e.insuranceValid) < 60) notes.push(`Insurance expires in ${daysLeft(e.insuranceValid)} days.`)
  if (daysLeft(e.pucValid) < 0) notes.push('PUC EXPIRED — renew immediately.')
  else if (daysLeft(e.pucValid) < 60 && e.pucValid && e.pucValid.toLowerCase() !== 'electric') {
    notes.push(`PUC expires in ${daysLeft(e.pucValid)} days.`)
  }
  if (daysLeft(e.licenseValid) < 0) notes.push('Driver license EXPIRED.')
  else if (daysLeft(e.licenseValid) < 60) notes.push(`Driver license expires in ${daysLeft(e.licenseValid)} days.`)
  if (e.condition && e.condition.toLowerCase() !== 'good') notes.push(`Vehicle condition: ${e.condition}`)
  return notes
}

export function buildWeeklyAnalysisEmail(
  report: FleetWeeklyReport,
  vehicles: FleetVehicle[],
  drivers: FleetDriver[],
  prevReport?: FleetWeeklyReport,
): { subject: string; html: string } {
  const prevByReg: Record<string, FleetWeeklyEntry> = {}
  if (prevReport) {
    for (const e of prevReport.entries) prevByReg[e.regNo] = e
  }

  let totalKm = 0
  let branchStats = { km: 0, dieselL: 0, petrolL: 0, cngL: 0, fuelCost: 0, fuelCard: 0, evCharge: 0, evKwh: 0, maintenance: 0, vehicles: 0, evCount: 0 }
  const vehicleRows: string[] = []
  const allAlerts: string[] = []

  for (const e of report.entries) {
    const en = normalizeWeeklyEntry(e)
    totalKm += en.kmWeek
    branchStats = addEntryToStats(branchStats, en)
    const notes = analyseEntry(en, prevByReg[e.regNo])
    if (notes.length) allAlerts.push(`<b>${esc(e.regNo)}</b>: ${notes.map(esc).join(' · ')}`)

    const master = vehicles.find((v) => v.regNo === e.regNo && v.active)
    const ft = en.fuelType
    const eff = ft === 'Electric' ? (fleetNum(en.evChargeKwh) && en.kmWeek ? Math.round((en.kmWeek / fleetNum(en.evChargeKwh)) * 10) / 10 + ' km/kWh' : '—') : (() => { const x = fuelEfficiency(en.kmWeek, String(en.fuelLiters || en.fuelQty)); return x !== null ? x + ' km/l' : '—'; })()
    const fuelCell = ft === 'Electric'
      ? `${fmtRs(en.evChargeCost || en.fuelCost)} EV`
      : `${fmtRs(en.fuelCost)} · ${fmtL(en.fuelLiters)} ${ft}`
    vehicleRows.push(`<tr>
      <td><b>${esc(e.regNo)}</b></td><td>${esc(e.makeModel)}</td><td>${esc(e.driverName)}</td>
      <td>${esc(e.odoStart)} / ${esc(e.odoEnd)}</td><td><b>${en.kmWeek}</b></td>
      <td>${fuelCell}${en.fuelCardCharged ? '<br><small>Card ' + fmtRs(en.fuelCardCharged) + '</small>' : ''}</td><td>${eff}</td>
      <td>${fmtRs(en.maintenanceCostNum)}</td><td>${esc(e.condition)}</td>
      <td style="font-size:11px">${esc(e.remarks)}${master?.majorAccident ? '<br><span style="color:#C0392B">Master: ' + esc(master.majorAccident) + '</span>' : ''}</td>
    </tr>`)
  }

  const branchAlerts = collectRenewalAlerts(vehicles.filter((v) => v.branchId === report.branchId))
  const driverAlerts = collectDriverAlerts(drivers, report.branchId)
  const avgEff = avgMileage(branchStats)
  const evEff = evKmPerKwh(branchStats)

  const bodyHtml = `
      <p>Dear HOD,</p>
      <p>Your <b>${esc(report.weekNo)} Weekly Vehicle Report</b> was received from <b>${esc(report.submittedBy)}</b>. Below is your branch dashboard analysis — vehicle efficiency, driver renewals, and action items.</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin:14px 0">
        <div style="background:#E8F5E9;padding:12px 16px;border-radius:8px"><b style="font-size:22px;color:#1A7A4A">${totalKm}</b><br><span style="font-size:11px;color:#555">Total KM (week)</span></div>
        <div style="background:#E3F2FD;padding:12px 16px;border-radius:8px"><b style="font-size:22px;color:#1565C0">${report.entries.length}</b><br><span style="font-size:11px;color:#555">Vehicles Reported</span></div>
        <div style="background:#FFF8E1;padding:12px 16px;border-radius:8px"><b style="font-size:18px;color:#E07B00">${fmtRs(branchStats.fuelCost + branchStats.evCharge)}</b><br><span style="font-size:11px;color:#555">Fuel / EV cost</span></div>
        <div style="background:#F3E5F5;padding:12px 16px;border-radius:8px"><b style="font-size:18px;color:#6A1B9A">${fmtRs(branchStats.maintenance)}</b><br><span style="font-size:11px;color:#555">Maintenance</span></div>
        ${avgEff ? `<div style="background:#FFF8E1;padding:12px 16px;border-radius:8px"><b style="font-size:22px;color:#E07B00">${avgEff}</b><br><span style="font-size:11px;color:#555">Avg km/l (diesel+petrol)</span></div>` : ''}
        ${branchStats.evCount ? `<div style="background:#E0F7FA;padding:12px 16px;border-radius:8px"><b style="font-size:18px;color:#00838F">${branchStats.evCount} EV</b><br><span style="font-size:11px;color:#555">${fmtRs(branchStats.evCharge)} · ${evEff ? evEff + ' km/kWh' : '—'}</span></div>` : ''}
      </div>
      <p style="font-size:12px;color:#555;margin-bottom:12px"><b>Fuel this week:</b> Diesel ${fmtL(branchStats.dieselL)} · Petrol ${fmtL(branchStats.petrolL)}${branchStats.fuelCard ? ' · Fuel card charged ' + fmtRs(branchStats.fuelCard) : ''}</p>
      ${allAlerts.length ? `<div style="background:#FFF3E0;border-left:5px solid #F0A500;padding:14px;margin-bottom:16px;border-radius:0 6px 6px 0">
        <b style="color:#856404">⚠ Action Items &amp; Observations</b><ul style="margin:8px 0 0 18px;font-size:13px">${allAlerts.map((n) => `<li>${n}</li>`).join('')}</ul>
      </div>` : '<p style="color:#1A7A4A;font-weight:700">✓ No critical alerts detected this week.</p>'}
      <h3 style="color:#0C1B33;border-left:4px solid #F0A500;padding-left:8px">Vehicle Summary</h3>
      <table style="border-collapse:collapse;width:100%;font-size:12px;margin-top:8px" border="1" cellpadding="6">
        <thead style="background:#0C1B33;color:#fff"><tr>
          <th>Reg No.</th><th>Model</th><th>Driver</th><th>Odo Start/End</th><th>KM Week</th><th>Fuel / EV</th><th>Efficiency</th><th>Maint. ₹</th><th>Cond.</th><th>Remarks</th>
        </tr></thead>
        <tbody>${vehicleRows.join('')}</tbody>
      </table>
      ${branchAlerts.length ? `<h3 style="color:#0C1B33;border-left:4px solid #F0A500;padding-left:8px;margin-top:18px">Renewals Due (Branch Register)</h3>
      <table style="border-collapse:collapse;width:100%;font-size:12px;margin-top:8px" border="1" cellpadding="6">
        <thead style="background:#0C1B33;color:#fff"><tr><th>Branch</th><th>Reg</th><th>Driver</th><th>Document</th><th>Valid Till</th><th>Status</th></tr></thead>
        <tbody>${branchAlerts.map(alertRow).join('')}</tbody>
      </table>` : ''}
      ${driverAlerts.length ? `<h3 style="color:#0C1B33;border-left:4px solid #F0A500;padding-left:8px;margin-top:18px">Driver Analysis &amp; Renewals</h3>
      <table style="border-collapse:collapse;width:100%;font-size:12px;margin-top:8px" border="1" cellpadding="6">
        <thead style="background:#0C1B33;color:#fff"><tr><th>Branch</th><th>Driver</th><th>License</th><th>Type</th><th>Document</th><th>Valid Till</th><th>Status</th></tr></thead>
        <tbody>${driverAlerts.map(driverAlertRow).join('')}</tbody>
      </table>` : ''}
      <p style="color:#888;font-size:11px;margin-top:16px">Auto-generated on Saturday submission · Director copied for records · Submit every Saturday before 5:00 PM.</p>`

  const html = fleetEmailShell(
    'Weekly Fleet Analysis — Branch HOD',
    `${esc(report.branchId)} · ${esc(report.weekNo)} · ${esc(report.fromDate)} to ${esc(report.toDate)}`,
    bodyHtml,
  )

  return {
    subject: `Agile Fleet — ${report.weekNo} HOD Analysis — ${report.branchId}`,
    html,
  }
}

export async function sendWeeklyAnalysis(
  report: FleetWeeklyReport,
  vehicles: FleetVehicle[],
  drivers: FleetDriver[],
  allReports: FleetWeeklyReport[],
) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }

  const prev = allReports
    .filter((r) => r.active && r.branchId === report.branchId && r.weekNo !== report.weekNo)
    .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''))[0]

  const { subject, html } = buildWeeklyAnalysisEmail(report, vehicles, drivers, prev)
  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile Fleet <noreply@agilegroup.co.in>'
  const director = process.env.FLEET_DIRECTOR_EMAIL?.trim() || 'director@agilegroup.co.in'
  const to = branchEmail(report.branchId)

  const result = await sendSuiteEmail(resend, { from, to, cc: director, subject, html })
  if (result.error) return { ok: false, error: result.error.message ?? 'Send failed' }
  return { ok: true, to, cc: director }
}

export async function sendPendingReminder(branch: string, weekNo: string, urgent = false) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }
  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile Fleet <noreply@agilegroup.co.in>'
  const director = process.env.FLEET_DIRECTOR_EMAIL?.trim() || 'director@agilegroup.co.in'
  const to = branchEmail(branch)
  const subject = urgent
    ? `URGENT — ${weekNo} Weekly Vehicle Report NOT Received — ${branch}`
    : `Agile Fleet — ${weekNo} Weekly Vehicle Report Reminder — ${branch}`

  const result = await sendSuiteEmail(resend, {
    from,
    to,
    bcc: director,
    subject,
    html: fleetEmailShell(
      urgent ? 'URGENT — Weekly Report Not Received' : 'Weekly Vehicle Report Reminder',
      `${esc(branch)} · ${esc(weekNo)}`,
      `<p>Dear ${esc(branch)} Team,</p>
      <p>${urgent ? '<b style="color:#C0392B">Your weekly vehicle report has NOT been received.</b> Please submit immediately.' : `This is a reminder to submit your <b>${esc(weekNo)} Weekly Vehicle Report</b>.`}</p>
      <p><b>Deadline: Every Saturday before 5:00 PM IST.</b></p>
      <p>Submit online now:<br><a href="https://www.agilegroup-digital.co.in/fleets?portal=staff">www.agilegroup-digital.co.in/fleets</a> (Staff / HOD portal → Weekly Reports)<br>
      Branch: <b>${esc(branch)}</b></p>`,
    ),
  })
  if (result.error) return { ok: false, error: result.error.message ?? 'Send failed' }
  return { ok: true, to }
}

function branchStatsRow(label: string, s: ReturnType<typeof aggregateWeekReports>['total'], extra = '') {
  const mil = avgMileage(s)
  const ev = evKmPerKwh(s)
  return `<tr>
    <td><b>${esc(label)}</b>${extra}</td>
    <td>${(s.km || 0).toLocaleString('en-IN')} km</td>
    <td>${fmtL(s.dieselL)}</td>
    <td>${fmtL(s.petrolL)}</td>
    <td>${fmtRs(s.fuelCost + s.evCharge)}</td>
    <td>${fmtRs(s.fuelCard)}</td>
    <td>${fmtRs(s.maintenance)}</td>
    <td>${mil ?? '—'}</td>
    <td>${s.evCount ? `${s.evCount} · ${fmtRs(s.evCharge)}` : '—'}</td>
    <td>${ev ?? '—'}</td>
  </tr>`
}

/** All-India consolidated weekly report for Director — sent every Sunday 10:00 AM IST. */
export function buildConsolidatedDirectorReport(
  weekNo: string,
  reports: FleetWeeklyReport[],
  vehicles: FleetVehicle[],
  drivers: FleetDriver[],
  dateLabel: string,
): { subject: string; html: string } {
  const weekReports = reports.filter((r) => r.active && r.weekNo === weekNo)
  const reported = new Set(weekReports.map((r) => r.branchId))
  const { total, byBranch } = aggregateWeekReports(reports, weekNo, FLEET_BRANCHES)
  const renewals = collectRenewalAlerts(vehicles)
  const driverAlerts = collectDriverAlerts(drivers)

  const cards = FLEET_BRANCHES.map((b) => {
    const r = weekReports.find((x) => x.branchId === b)
    if (r) {
      return `<div style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:8px;padding:10px"><b style="color:#1A7A4A">✓ ${esc(b)}</b><div style="font-size:11px;color:#555;margin-top:4px">${esc(r.submittedBy)} — ${r.entries.length} vehicle(s)</div></div>`
    }
    return `<div style="background:#FFF3E0;border:1px solid #FFCC80;border-radius:8px;padding:10px"><b style="color:#E07B00">⚠ ${esc(b)}</b><div style="font-size:11px;color:#555;margin-top:4px">Not received by Saturday 5 PM</div></div>`
  }).join('')

  const branchRows = byBranch
    .map((b) => branchStatsRow(b.branchId + (b.reported ? ' ✓' : ' (pending)'), b, b.reported ? '' : ' <span style="color:#E07B00;font-size:10px">MISSING</span>'))
    .join('')
  const allRow = branchStatsRow('ALL BRANCHES (Total)', total)

  const detailRows = weekReports
    .flatMap((r) =>
      r.entries.map((e) => {
        const en = normalizeWeeklyEntry(e)
        const ft = en.fuelType
        const fuel =
          ft === 'Electric'
            ? `${fmtRs(en.evChargeCost || en.fuelCost)} EV`
            : `${fmtRs(en.fuelCost)} · ${fmtL(en.fuelLiters)} ${ft}`
        const eff =
          ft === 'Electric'
            ? fleetNum(en.evChargeKwh) && en.kmWeek
              ? Math.round((en.kmWeek / fleetNum(en.evChargeKwh)) * 10) / 10 + ' km/kWh'
              : '—'
            : (() => {
                const x = fuelEfficiency(en.kmWeek, String(en.fuelLiters || en.fuelQty))
                return x !== null ? x + ' km/l' : '—'
              })()
        const pen = en.trafficPenaltyRs || '—'
        return `<tr><td>${esc(r.branchId)}</td><td><b>${esc(en.regNo)}</b></td><td>${esc(en.makeModel)}</td><td>${esc(en.driverName)}</td><td><b>${en.kmWeek}</b></td><td>${fuel}</td><td>${eff}</td><td>${fmtRs(en.maintenanceCostNum)}</td><td>${pen}</td><td>${esc(en.condition)}</td></tr>`
      }),
    )
    .join('')

  const renewalRows = renewals
    .slice(0, 30)
    .map((a) => alertRow(a))
    .join('')

  const bodyHtml = `<div style="display:flex;background:linear-gradient(135deg,#0369a1,#0ea5e9);color:#fff;text-align:center;font-size:13px;flex-wrap:wrap;border-radius:8px;overflow:hidden;margin-bottom:14px">
      <div style="flex:1;min-width:120px;padding:12px;border-right:1px solid rgba(255,255,255,.2)"><b style="font-size:22px">${reported.size}</b><br>Branches Reported</div>
      <div style="flex:1;min-width:120px;padding:12px;border-right:1px solid rgba(255,255,255,.2)"><b style="font-size:22px">${FLEET_BRANCHES.length - reported.size}</b><br>Pending</div>
      <div style="flex:1;min-width:120px;padding:12px;border-right:1px solid rgba(255,255,255,.2)"><b style="font-size:22px">${vehicles.filter((v) => v.active).length}</b><br>Active Vehicles</div>
      <div style="flex:1;min-width:120px;padding:12px;border-right:1px solid rgba(255,255,255,.2)"><b style="font-size:22px">${total.km.toLocaleString('en-IN')}</b><br>Total KM</div>
      <div style="flex:1;min-width:120px;padding:12px"><b style="font-size:18px">${fmtRs(total.fuelCost + total.evCharge)}</b><br>Fuel + EV</div>
    </div>
      <p>Dear Director / Management,</p>
      <p>Please find the <b>consolidated fleet report</b> for <b>${esc(weekNo)}</b> — all branches combined. Each branch HOD received their own analysis when they submitted on Saturday.</p>
      <h3 style="color:#0C1B33;border-left:4px solid #F0A500;padding-left:8px">Branch Submission Status</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin:12px 0">${cards}</div>
      <h3 style="color:#0C1B33;border-left:4px solid #F0A500;padding-left:8px;margin-top:18px">Fleet Summary — Branch-wise + All Together</h3>
      <table style="border-collapse:collapse;width:100%;font-size:11px;margin-top:8px" border="1" cellpadding="5">
        <thead style="background:#0C1B33;color:#fff"><tr>
          <th>Branch</th><th>KM</th><th>Diesel</th><th>Petrol</th><th>Fuel + EV ₹</th><th>Fuel Card</th><th>Maintenance</th><th>Avg km/l</th><th>EV</th><th>EV km/kWh</th>
        </tr></thead>
        <tbody>${branchRows}${allRow}</tbody>
      </table>
      <h3 style="color:#0C1B33;border-left:4px solid #F0A500;padding-left:8px;margin-top:18px">All Vehicles — Efficiency &amp; Penalties</h3>
      <table style="border-collapse:collapse;width:100%;font-size:11px;margin-top:8px" border="1" cellpadding="5">
        <thead style="background:#0C1B33;color:#fff"><tr><th>Branch</th><th>Reg No.</th><th>Model</th><th>Driver</th><th>KM</th><th>Fuel / EV</th><th>Efficiency</th><th>Maint. ₹</th><th>Traffic Penalty ₹</th><th>Cond.</th></tr></thead>
        <tbody>${detailRows || '<tr><td colspan="10" style="color:#888">No vehicle data submitted this week yet.</td></tr>'}</tbody>
      </table>
      ${driverAlerts.length ? `<h3 style="color:#0C1B33;border-left:4px solid #F0A500;padding-left:8px;margin-top:18px">Driver Analysis &amp; Renewal Alerts (All Branches)</h3>
      <table style="border-collapse:collapse;width:100%;font-size:11px;margin-top:8px" border="1" cellpadding="5">
        <thead style="background:#0C1B33;color:#fff"><tr><th>Branch</th><th>Driver</th><th>License</th><th>Type</th><th>Document</th><th>Valid Till</th><th>Status</th></tr></thead>
        <tbody>${driverAlerts.slice(0, 40).map(driverAlertRow).join('')}</tbody>
      </table>` : ''}
      ${renewals.length ? `<h3 style="color:#0C1B33;border-left:4px solid #F0A500;padding-left:8px;margin-top:18px">Renewals Due (60 days)</h3>
      <table style="border-collapse:collapse;width:100%;font-size:11px;margin-top:8px" border="1" cellpadding="5">
        <thead style="background:#0C1B33;color:#fff"><tr><th>Branch</th><th>Reg</th><th>Driver</th><th>Document</th><th>Valid Till</th><th>Status</th></tr></thead>
        <tbody>${renewalRows}</tbody>
      </table>` : ''}
      <p style="color:#888;font-size:11px;margin-top:16px">Agile Fleet · Management: www.agilegroup-digital.co.in/fleets?portal=management · HOD portal: /fleets?portal=staff</p>`

  const html = fleetEmailShell(
    'Consolidated Weekly Report — Director',
    `${esc(weekNo)} · ${dateLabel} · Sunday 10:00 AM IST`,
    bodyHtml,
  )

  return {
    subject: `Agile Fleet — ${weekNo} Consolidated Report — All Branches (${dateLabel})`,
    html,
  }
}

export async function sendConsolidatedDirectorReport(
  weekNo: string,
  reports: FleetWeeklyReport[],
  vehicles: FleetVehicle[],
  drivers: FleetDriver[],
  dateLabel: string,
) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }

  const { subject, html } = buildConsolidatedDirectorReport(weekNo, reports, vehicles, drivers, dateLabel)
  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile Fleet <noreply@agilegroup.co.in>'
  const director = process.env.FLEET_DIRECTOR_EMAIL?.trim() || 'director@agilegroup.co.in'

  const result = await sendSuiteEmail(resend, { from, to: director, subject, html })
  if (result.error) return { ok: false, error: result.error.message ?? 'Send failed' }
  return { ok: true, to: director }
}
