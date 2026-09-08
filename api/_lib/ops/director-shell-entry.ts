/**
 * After Coming Soon PIN verify, open Ops shell without a second login screen.
 */

import type { VercelRequest } from '@vercel/node'
import { otpLoginHtml, otpLoginScript } from '../embedded-otp.js'
import { renderOpsComingSoonPage } from './coming-soon-page.js'
import { renderOpsShell, type OpsShellApp } from './shell.js'

const TITLES: Record<OpsShellApp, string> = {
  control: 'Agile Control',
  quality: 'Agile Security',
  meetings: 'Agile Meeting (War Room)',
}

export function directorAccess(req: VercelRequest): boolean {
  const q = req.query || {}
  return String(q.access ?? '') === '1' || String(q.dir ?? '') === '1'
}

/** True when Coming Soon already verified — do not show the gold login form again. */
export function skipSecondLogin(req: VercelRequest): boolean {
  const q = req.query || {}
  return (
    String(q.open ?? '') === '1' ||
    String(q.skipLogin ?? '') === '1' ||
    String(q.authed ?? '') === '1'
  )
}

function openingLoginHtml(title: string): string {
  return `<div id="login" style="display:none"></div>
<div id="opsOpening" style="max-width:420px;margin:12vh auto;padding:24px;text-align:center;color:#e2e8f0;font-family:Segoe UI,Arial,sans-serif">
  <img src="https://www.agilegroup-digital.co.in/agile-logo.png" alt="Agile" style="height:48px;margin-bottom:14px">
  <h2 style="color:#fff;margin:0 0 8px">${title}</h2>
  <p style="color:#94a3b8;font-size:14px;line-height:1.5;margin:0 0 12px">Opening — please wait a moment…</p>
  <div id="msg" class="msg" style="display:none"></div>
  <p style="margin-top:18px;font-size:13px"><a href="/control/" style="color:#93c5fd">← Back if this takes too long</a></p>
</div>`
}

export function renderDirectorOpsApp(app: OpsShellApp, req: VercelRequest): string {
  if (!directorAccess(req)) {
    return renderOpsComingSoonPage(app)
  }
  const title = TITLES[app]
  const skip = skipSecondLogin(req)
  const login = skip ? openingLoginHtml(title) : otpLoginHtml(title, 'Director access — email PIN only')
  const otp = otpLoginScript(app === 'quality' ? 'quality' : app, title, 'management')
  return renderOpsShell(app, 'management', login, otp)
}
