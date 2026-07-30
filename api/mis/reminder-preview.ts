import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  buildMisBranchReminderHtml,
  buildMisDirectorReminderHtml,
} from '../_lib/mis/digest.js'
import { misTodayIst } from '../_lib/mis/dates.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const date = String(req.query.date ?? misTodayIst())
  const type = String(req.query.type ?? 'all').toLowerCase()
  const slot = String(req.query.slot ?? 'morning').toLowerCase() === 'midday' ? 'midday' : 'morning'

  const samples: { id: string; label: string; html: string }[] = []

  function add(id: string, label: string, html: string) {
    samples.push({ id, label, html })
  }

  if (type === 'all' || type === 'branch') {
    add(
      'branch-morning',
      'Branch reminder — 11:00 AM (sample: Karnataka)',
      buildMisBranchReminderHtml('Karnataka (Bangalore)', date, 'morning'),
    )
    add(
      'branch-midday',
      'Branch reminder — 2:00 PM urgent (sample: Telangana)',
      buildMisBranchReminderHtml('Telangana (Hyderabad)', date, 'midday'),
    )
  }

  if (type === 'branch' && slot) {
    samples.length = 0
    add(
      `branch-${slot}`,
      `Branch reminder — ${slot === 'morning' ? '11:00 AM' : '2:00 PM'}`,
      buildMisBranchReminderHtml('Sample Branch', date, slot),
    )
  }

  if (type === 'all' || type === 'director') {
    add(
      'director-pending',
      'Director reminder — pending branches (11 AM / 2 PM style)',
      buildMisDirectorReminderHtml(date, 'midday', {
        submitted: 14,
        total: 18,
        pending: ['Karnataka (Bangalore)', 'Maharashtra (Mumbai)', 'West Bengal (Kolkata)', 'Tamil Nadu (Chennai)'],
      }),
    )
    add(
      'director-all-done',
      'Director reminder — all branches submitted',
      buildMisDirectorReminderHtml(date, 'morning', {
        submitted: 18,
        total: 18,
        pending: [],
      }),
    )
  }

  if (type === 'director') {
    const pending = req.query.pending !== '0'
    samples.length = 0
    add(
      `director-${slot}`,
      `Director reminder — ${slot === 'morning' ? '11:00 AM' : '2:00 PM'}`,
      buildMisDirectorReminderHtml(date, slot, pending
        ? { submitted: 14, total: 18, pending: ['Karnataka (Bangalore)', 'Telangana (Hyderabad)'] }
        : { submitted: 18, total: 18, pending: [] }),
    )
  }

  if (samples.length === 1) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.status(200).send(samples[0].html)
  }

  const tabs = samples
    .map(
      (s, i) =>
        `<button type="button" class="tab${i === 0 ? ' active' : ''}" data-tab="${s.id}">${s.label}</button>`,
    )
    .join('')
  const panels = samples
    .map(
      (s, i) =>
        `<div class="panel${i === 0 ? ' active' : ''}" id="panel-${s.id}"><iframe title="${s.label}" srcdoc="${s.html.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"></iframe></div>`,
    )
    .join('')

  const page = `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>MIS Reminder Email Preview — Agile</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:Segoe UI,Arial,sans-serif;background:#0f172a;color:#e2e8f0}
  .bar{padding:16px 20px;background:linear-gradient(135deg,#14224f,#1e3a8a);border-bottom:3px solid #c9a84c}
  .bar h1{margin:0;font-size:18px;color:#fde68a}
  .bar p{margin:6px 0 0;font-size:13px;color:#cbd5e1}
  .tabs{display:flex;flex-wrap:wrap;gap:8px;padding:12px 16px;background:#1e293b;border-bottom:1px solid #334155}
  .tab{border:1px solid #475569;background:#0f172a;color:#e2e8f0;padding:10px 14px;border-radius:8px;cursor:pointer;font-size:12px}
  .tab.active{background:#1d4ed8;border-color:#60a5fa;color:#fff;font-weight:700}
  .panel{display:none;height:calc(100vh - 140px)}
  .panel.active{display:block}
  iframe{width:100%;height:100%;border:0;background:#f1f5f9}
</style></head><body>
<div class="bar">
  <h1>MIS Reminder Email — Preview (sample only)</h1>
  <p>Agile logo header · colourful layout · usual footer (no minister quote) · Report date ${date}</p>
</div>
<div class="tabs">${tabs}</div>
${panels}
<script>
document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
  });
});
</script>
</body></html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  return res.status(200).send(page)
}
