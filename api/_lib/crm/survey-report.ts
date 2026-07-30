import { MIS_BRAND } from '../mis/brand.js'
import type { CrmSecuritySurvey, CrmSiteInputs } from './store.js'
import { defaultSurveyInterviews } from './store.js'
import { SURVEY_PARTS, riskBand, surveyGrandTotal, surveyPartTotal } from './survey-template.js'

function esc(s: unknown): string {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function nl2br(s: string): string {
  return esc(s).replace(/\n/g, '<br>')
}

const PHOTO_TYPE_LABELS: Record<string, string> = {
  site_photo: 'Site Photo',
  deployment_chart: 'Deployment Chart',
  perimeter: 'Perimeter',
  entrance: 'Entrance',
  cctv: 'CCTV',
  other: 'Other',
}

function photoHeading(p: { heading?: string; label?: string; type?: string }): string {
  const h = String(p.heading ?? '').trim()
  if (h) return h
  const legacy = String(p.label ?? '').trim()
  if (legacy && !Object.values(PHOTO_TYPE_LABELS).includes(legacy)) return legacy
  return PHOTO_TYPE_LABELS[String(p.type)] || 'Site location'
}

/** Client-facing printable Security Survey & Risk Assessment report. */
export function buildClientSurveyReportHtml(sv: CrmSecuritySurvey): string {
  const total = surveyGrandTotal(sv.scores)
  const band = riskBand(total)
  const inp: CrmSiteInputs = sv.siteInputs ?? {
    clientBrief: '',
    scopeOfWork: '',
    existingSecurity: '',
    proposedShifts: '',
    sanctionedStrength: '',
    criticalAssets: '',
    accessPoints: '',
    vulnerableAreas: '',
    clientExpectations: '',
  }
  const interviews = (sv.interviews ?? defaultSurveyInterviews()).filter(
    (iv) => iv.personName?.trim() || iv.designation?.trim() || iv.notes?.trim(),
  )
  const interviewBlock = interviews.length
    ? `<div class="sec"><h2>3. Site Interviews</h2>${interviews
        .map(
          (iv, i) =>
            `<div class="input-box" style="margin-bottom:12px"><b>Interview ${i + 1}: ${esc(iv.personName || '—')}</b>${iv.designation ? ` · <span class="muted">${esc(iv.designation)}</span>` : ''}<div class="body-text" style="margin-top:8px">${nl2br(iv.notes || '—')}</div></div>`,
        )
        .join('')}</div>`
    : ''
  const photos = (sv.photos ?? []).filter((p) => p.dataUrl && p.active !== false)
  const deployChart = photos.find((p) => p.type === 'deployment_chart')
  const sitePhotos = photos.filter((p) => p.type !== 'deployment_chart')

  const partRows = SURVEY_PARTS.map((p) => {
    const pt = surveyPartTotal(sv.scores, p)
    const pct = Math.round((pt / p.maxTotal) * 100)
    return `<tr><td>${esc(p.title)}</td><td style="text-align:center">${pt}</td><td style="text-align:center">${p.maxTotal}</td><td style="text-align:center;font-weight:700;color:${pct >= 70 ? '#dc2626' : pct >= 50 ? '#d97706' : '#16a34a'}">${pct}%</td></tr>`
  }).join('')

  const highRisk = SURVEY_PARTS.flatMap((p) =>
    p.items
      .filter((it) => (Number(sv.scores[it.id]) || 0) >= 4)
      .map(
        (it) =>
          `<li><b>${esc(it.label)}</b> — score ${sv.scores[it.id]}/5${sv.scoreNotes[it.id] ? ` — ${esc(sv.scoreNotes[it.id])}` : ''}</li>`,
      ),
  ).join('')

  const photoGrid = sitePhotos.length
    ? `<div class="photo-grid">${sitePhotos
        .map((p) => {
          const title = photoHeading(p)
          const cat = PHOTO_TYPE_LABELS[p.type] || p.type
          return `<figure class="photo-card"><div class="photo-head">${esc(title)}</div><img src="${p.dataUrl}" alt="${esc(title)}"><figcaption>${cat !== title ? `<span class="photo-cat">${esc(cat)}</span>` : ''}${p.caption ? `<div class="photo-note">${esc(p.caption)}</div>` : ''}</figcaption></figure>`
        })
        .join('')}</div>`
    : '<p class="muted">Site photographs attached separately.</p>'

  const deployBlock = deployChart
    ? `<div class="deploy-chart"><h3>${esc(photoHeading(deployChart))}</h3><img src="${deployChart.dataUrl}" alt="Deployment Chart">${deployChart.caption ? `<p class="muted">${esc(deployChart.caption)}</p>` : ''}</div>`
    : sv.deploymentPlan
      ? `<div class="deploy-chart"><h3>Proposed Deployment Plan</h3><div class="body-text">${nl2br(sv.deploymentPlan)}</div></div>`
      : ''

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Security Survey — ${esc(sv.company)}</title>
<style>
@page{margin:18mm 14mm}
*{box-sizing:border-box}body{font-family:'Segoe UI',Georgia,serif;color:#1e293b;font-size:13px;line-height:1.55;margin:0;background:#fff}
.wrap{max-width:820px;margin:0 auto;padding:8px 0 40px}
.cover{background:linear-gradient(135deg,#14224f,#1e3a8a);color:#fff;padding:28px 24px;border-radius:12px;margin-bottom:24px;text-align:center}
.cover img{height:56px;margin-bottom:12px}
.cover h1{font-size:22px;color:#fde68a;margin:0 0 6px;font-weight:900;letter-spacing:.02em}
.cover .sub{font-size:14px;color:#cbd5e1}
.cover .meta{margin-top:14px;font-size:12px;color:#94a3b8}
.badge{display:inline-block;margin-top:12px;padding:10px 20px;border-radius:999px;font-weight:900;font-size:15px;background:${band.colour}22;border:2px solid ${band.colour};color:${band.colour}}
.sec{margin-bottom:22px;page-break-inside:avoid}
.sec h2{font-size:15px;color:#14224f;border-bottom:2px solid #c9a84c;padding-bottom:6px;margin-bottom:10px;text-transform:uppercase;letter-spacing:.04em}
.sec h3{font-size:13px;color:#1d4ed8;margin:12px 0 6px}
.body-text{color:#334155;font-size:13px}
.muted{color:#64748b;font-size:12px}
.input-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 16px;margin-bottom:12px}
.input-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px}
.input-box b{display:block;font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:4px}
table.score{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}
table.score th,table.score td{border:1px solid #cbd5e1;padding:8px}
table.score th{background:#f1f5f9;color:#475569;font-size:10px;text-transform:uppercase}
.risk-box{background:#f8fafc;border-left:4px solid ${band.colour};padding:14px 16px;border-radius:0 8px 8px 0;margin:12px 0}
.photo-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px}
.photo-card{margin:0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;background:#f8fafc}
.photo-head{background:linear-gradient(135deg,#14224f,#1e3a8a);color:#fde68a;font-weight:800;font-size:13px;padding:10px 12px;text-align:center}
.photo-card img{width:100%;height:160px;object-fit:cover;display:block}
.photo-card figcaption{padding:8px 10px;font-size:11px;color:#475569}
.photo-cat{display:inline-block;background:#e0e7ff;color:#1d4ed8;font-size:10px;font-weight:700;text-transform:uppercase;padding:2px 8px;border-radius:999px;margin-bottom:4px}
.photo-note{margin-top:4px;color:#64748b}
.deploy-chart{margin:16px 0;text-align:center}
.deploy-chart img{max-width:100%;border:1px solid #cbd5e1;border-radius:8px}
.uniform{background:linear-gradient(135deg,#fefce8,#fffbeb);border:1px solid #c9a84c;border-radius:10px;padding:14px 16px}
.equip li{margin:4px 0}
.footer{margin-top:32px;padding-top:16px;border-top:2px solid #c9a84c;text-align:center;font-size:11px;color:#64748b}
.footer .quote{color:#92700c;font-style:italic;margin-top:8px}
@media print{.noprint{display:none}}
</style></head>
<body>
<div class="wrap">
  <div class="cover">
    <img src="${MIS_BRAND.logoUrl}" alt="Agile">
    <h1>Security Survey &amp; Risk Assessment Report</h1>
    <div class="sub">Prepared for <b>${esc(sv.company)}</b></div>
    <div class="meta">${esc(sv.locationName || sv.address || '')} · Survey Date: ${esc(sv.surveyDate || '—')} · Surveyed by: ${esc(sv.surveyedBy || 'Agile Security Force')}</div>
    <div class="badge">Risk Score ${total} / 180 — ${band.level} Risk</div>
  </div>

  <div class="sec">
    <h2>1. Site Brief &amp; Scope (Client Input)</h2>
    <div class="input-grid">
      <div class="input-box"><b>Client Brief</b>${nl2br(inp.clientBrief || '—')}</div>
      <div class="input-box"><b>Scope of Work</b>${nl2br(inp.scopeOfWork || '—')}</div>
      <div class="input-box"><b>Existing Security Arrangement</b>${nl2br(inp.existingSecurity || '—')}</div>
      <div class="input-box"><b>Proposed Shifts</b>${nl2br(inp.proposedShifts || '—')}</div>
      <div class="input-box"><b>Sanctioned Strength</b>${nl2br(inp.sanctionedStrength || '—')}</div>
      <div class="input-box"><b>Critical Assets</b>${nl2br(inp.criticalAssets || '—')}</div>
      <div class="input-box"><b>Access Points</b>${nl2br(inp.accessPoints || '—')}</div>
      <div class="input-box"><b>Vulnerable Areas</b>${nl2br(inp.vulnerableAreas || '—')}</div>
    </div>
    ${inp.clientExpectations ? `<div class="input-box" style="margin-top:8px"><b>Client Expectations</b>${nl2br(inp.clientExpectations)}</div>` : ''}
  </div>

  <div class="sec">
    <h2>2. Scientific Risk Analysis</h2>
    <div class="risk-box body-text">${nl2br(sv.riskAnalysis || sv.executiveSummary || 'Risk analysis based on on-site survey using Agile Security Force 180-point checklist methodology.')}</div>
    <table class="score">
      <thead><tr><th>Assessment Part</th><th>Score</th><th>Max</th><th>Risk %</th></tr></thead>
      <tbody>${partRows}</tbody>
      <tfoot><tr><td><b>Grand Total</b></td><td style="text-align:center"><b>${total}</b></td><td style="text-align:center">180</td><td style="text-align:center"><b>${band.level}</b></td></tr></tfoot>
    </table>
    ${highRisk ? `<h3>Priority Vulnerabilities (Score 4–5)</h3><ul>${highRisk}</ul>` : ''}
  </div>

  <div class="sec">
    <h2>3. Site Observations</h2>
    <div class="body-text">${nl2br(sv.siteObservations || 'Day and evening site visit conducted. Detailed observations recorded during physical survey.')}</div>
  </div>

  ${interviewBlock}

  <div class="sec">
    <h2>4. Site Photographs</h2>
    ${photoGrid}
  </div>

  ${deployBlock}

  <div class="sec">
    <h2>5. Executive Summary</h2>
    <div class="body-text">${nl2br(sv.executiveSummary || '')}</div>
  </div>

  <div class="sec">
    <h2>6. Recommended Manning &amp; Deployment</h2>
    <div class="body-text">${nl2br(sv.manningSuggestion || '')}</div>
  </div>

  <div class="sec uniform">
    <h2>7. Uniform &amp; Grooming Standards</h2>
    <div class="body-text">${nl2br(sv.uniformRequirements || 'Agile standard uniform as per PSARA and client branding requirements.')}</div>
  </div>

  <div class="sec">
    <h2>8. Equipment &amp; Security Infrastructure</h2>
    <div class="body-text equip">${nl2br(sv.equipmentSuggestions || '')}</div>
  </div>

  <div class="sec">
    <h2>9. Security Professional Recommendations</h2>
    <div class="body-text">${nl2br(sv.securityRecommendations || sv.recommendations || '')}</div>
    ${sv.siteRequirements ? `<h3>Client-Specific Requirements</h3><div class="body-text">${nl2br(sv.siteRequirements)}</div>` : ''}
  </div>

  <div class="footer">
    <b>${esc(MIS_BRAND.shortName)}</b><br>
    <a href="${MIS_BRAND.corporateSite}">${esc(MIS_BRAND.corporateSiteLabel)}</a><br>
    <p style="margin-top:10px">Confidential — Prepared exclusively for ${esc(sv.company)}. © Agile Security Force Pvt. Ltd.</p>
  </div>
</div>
<button class="noprint" onclick="window.print()" style="position:fixed;bottom:20px;right:20px;padding:12px 20px;background:#c9a84c;border:none;border-radius:8px;font-weight:800;cursor:pointer">⬇ Print / Save PDF</button>
</body></html>`
}
