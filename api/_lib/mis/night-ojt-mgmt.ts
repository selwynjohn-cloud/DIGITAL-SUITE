import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireMisPageSession } from './session.js'
import { MIS_LAYOUT_CSS, MIS_SESSION_JS, MIS_THEME_CSS, misPageWrap } from './layout.js'
import { trainingOjtInnerHtml, trainingOjtScript, type TrainingOjtPageOpts } from './training-ojt-page.js'
import { nightVisitInnerHtml, nightVisitScript, type NightVisitPageOpts } from './night-visit-ui.js'

function nightPage(opts: NightVisitPageOpts): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — ${opts.title}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:15px}
${MIS_THEME_CSS}
.hidden{display:none!important}
${MIS_LAYOUT_CSS}
.mtbl th,.mtbl td{padding:8px 10px;border-bottom:1px solid #22304f;text-align:left;vertical-align:top;font-size:13px}
.mtbl th{color:#fde68a;font-weight:800}
</style></head>
<body>
${misPageWrap(opts.activePath, opts.title, nightVisitInnerHtml(opts))}
<script>
${MIS_SESSION_JS}
${nightVisitScript(opts)}
misStart();
bootNightVisit();
</script>
</body></html>`
}

function trainingPage(opts: TrainingOjtPageOpts): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — ${opts.title}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:15px}
${MIS_THEME_CSS}
.hidden{display:none!important}
${MIS_LAYOUT_CSS}
</style></head>
<body>
${misPageWrap(opts.activePath, opts.title, trainingOjtInnerHtml(opts))}
<script>
${MIS_SESSION_JS}
${trainingOjtScript(opts)}
misStart();
bootTrainingOjt();
</script>
</body></html>`
}

export function nightVisitMgmtHandler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!requireMisPageSession(req, res)) return
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).send(
      nightPage({
        portal: 'mgmt',
        activePath: '/mis-night-visit',
        title: 'Site Security Visit Report (Day / Night Check)',
      }),
    )
  } catch (err) {
    console.error('[mis/night-visit]', err)
    return res.status(500).send('Night Visit page failed to load. Please refresh.')
  }
}

export function trainingOjtMgmtHandler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!requireMisPageSession(req, res)) return
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).send(
      trainingPage({
        portal: 'mgmt',
        activePath: '/mis-training-ojt',
        title: 'Training (OJT) — Follow-up',
      }),
    )
  } catch (err) {
    console.error('[mis/training-ojt]', err)
    return res.status(500).send('Training page failed to load. Please refresh.')
  }
}
