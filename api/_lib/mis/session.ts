import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createHmac, timingSafeEqual } from 'crypto'
import { SUITE_MANAGEMENT_OTP_SESSION_KEYS } from '../management-suite.js'

export const MIS_SESSION_COOKIE = 'mis_session'
/** Matches OTP session length — avoids save failing while still editing. */
const MAX_AGE_SEC = 8 * 60 * 60

/** Cookie Domain only on production host — omit on *.vercel.app so the browser accepts the cookie. */
function misCookieDomain(host: string | undefined): string {
  const h = String(host ?? '').toLowerCase().split(':')[0]
  if (h === 'agilegroup-digital.co.in' || h === 'www.agilegroup-digital.co.in' || h.endsWith('.agilegroup-digital.co.in')) {
    return '.agilegroup-digital.co.in'
  }
  return ''
}

function sessionSecret(): string {
  const key = process.env.AUTH_SECRET?.trim() || process.env.MIS_SESSION_SECRET?.trim()
  if (!key) throw new Error('AUTH_SECRET is not configured')
  return key
}

function sessionPayload(exp: number, email = ''): string {
  const em = email.trim().toLowerCase()
  return em ? `mis:${exp}:${em}` : `mis:${exp}`
}

export function createMisSessionToken(email = ''): string {
  const exp = Date.now() + MAX_AGE_SEC * 1000
  const payload = sessionPayload(exp, email)
  const sig = createHmac('sha256', sessionSecret()).update(payload).digest('hex')
  const em = email.trim().toLowerCase()
  // Pipe separator — dots in email domains break the old exp.email.sig format.
  return em ? `${exp}|${em}|${sig}` : `${exp}|${sig}`
}

function parseMisSessionToken(token: string | undefined): { exp: number; email: string } | null {
  if (!token) return null
  const raw = token.trim()
  // Legacy: exp.email.sig (broken for addresses with dots in domain)
  if (raw.includes('|')) {
    const parts = raw.split('|')
    if (parts.length < 2) return null
    const exp = Number(parts[0])
    if (!Number.isFinite(exp) || Date.now() > exp) return null
    const email = parts.length >= 3 ? (parts[1] || '').trim().toLowerCase() : ''
    const sig = parts.length >= 3 ? parts[2] || '' : parts[1] || ''
    const payload = sessionPayload(exp, email)
    const expected = createHmac('sha256', sessionSecret()).update(payload).digest('hex')
    try {
      const a = Buffer.from(sig, 'hex')
      const b = Buffer.from(expected, 'hex')
      if (a.length !== b.length || !timingSafeEqual(a, b)) return null
      return { exp, email }
    } catch {
      return null
    }
  }
  const parts = raw.split('.')
  if (parts.length < 2) return null
  const exp = Number(parts[0])
  if (!Number.isFinite(exp) || Date.now() > exp) return null
  let email = ''
  let sig = ''
  if (parts.length === 2) {
    sig = parts[1]
  } else if (parts.length === 3) {
    email = decodeURIComponent(parts[1] || '').trim().toLowerCase()
    sig = parts[2] || ''
  } else {
    return null
  }
  const payload = sessionPayload(exp, email)
  const expected = createHmac('sha256', sessionSecret()).update(payload).digest('hex')
  try {
    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
    return { exp, email }
  } catch {
    return null
  }
}

export function verifyMisSessionToken(token: string | undefined): boolean {
  return parseMisSessionToken(token) !== null
}

export function misSessionEmail(token: string | undefined): string {
  return parseMisSessionToken(token)?.email ?? ''
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i < 1) continue
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

export function misSessionFromRequest(req: VercelRequest): string | undefined {
  return parseCookies(req.headers.cookie)[MIS_SESSION_COOKIE]
}

export function misRequestAuthed(req: VercelRequest): boolean {
  return verifyMisSessionToken(misSessionFromRequest(req))
}

export function misRequestEmail(req: VercelRequest): string {
  return misSessionEmail(misSessionFromRequest(req))
}

export function misSessionSetCookie(host?: string, email = ''): string {
  const token = createMisSessionToken(email)
  const dom = misCookieDomain(host)
  const domPart = dom ? ` Domain=${dom};` : ''
  return `${MIS_SESSION_COOKIE}=${encodeURIComponent(token)};${domPart} Path=/; Max-Age=${MAX_AGE_SEC}; HttpOnly; Secure; SameSite=Lax`
}

export function misSessionClearCookie(host?: string): string {
  const dom = misCookieDomain(host)
  const domPart = dom ? ` Domain=${dom};` : ''
  return `${MIS_SESSION_COOKIE}=;${domPart} Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`
}

function misBridgeMessage(redirectPath: string): string {
  const p = redirectPath.toLowerCase()
  if (p.includes('mis-admin')) return 'Opening Master Directory…'
  if (p.includes('mis-dashboard')) return 'Opening MIS Dashboard…'
  if (p.includes('mis-users')) return 'Opening User Management…'
  return 'Signing in to Agile MIS…'
}

/** Browser page that sets mis_session from sessionStorage when the cookie was not stored. */
export function misSessionBridgeHtml(redirectPath: string): string {
  const dest = redirectPath.replace(/'/g, "\\'")
  const destEnc = encodeURIComponent(redirectPath)
  const otpKeys = JSON.stringify([...SUITE_MANAGEMENT_OTP_SESSION_KEYS])
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agile MIS — Signing in</title>
<style>body{font-family:'Segoe UI',Arial,sans-serif;background:#0b1220;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.box{text-align:center;padding:32px;max-width:420px}.box p{color:#94a3b8;font-size:15px;line-height:1.5}</style></head><body>
<div class="box"><p id="msg">${misBridgeMessage(redirectPath)}</p></div>
<script>
(function(){
  var keys=${otpKeys};
  var t=null;
  for(var i=0;i<keys.length&&!t;i++){t=sessionStorage.getItem(keys[i]);}
  if(!t){location.replace('/mis?fresh=1&dest=${destEnc}');return;}
  var tries=Number(sessionStorage.getItem('mis_bridge_try')||'0')+1;
  sessionStorage.setItem('mis_bridge_try',String(tries));
  if(tries>3){
    sessionStorage.removeItem('mis_bridge_try');
    var m=document.getElementById('msg');
    if(m)m.innerHTML='Could not open this page with your current sign-in.<br><br>Tap <a href="/mis?fresh=1&dest=${destEnc}" style="color:#fde68a;font-weight:800">Sign in — Management</a> (App 05 → gold Management button).<br><span style="font-size:13px">Do not use HODs / Staff for Master Directory.</span>';
    return;
  }
  fetch('/api/mis/login',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionToken:t})})
    .then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});})
    .then(function(res){
      if(res.s===200){
        sessionStorage.removeItem('mis_bridge_try');
        location.replace('${dest}');
      } else location.replace('/mis?fresh=1&dest=${destEnc}');
    })
    .catch(function(){location.replace('/mis?fresh=1&dest=${destEnc}');});
})();
</script></body></html>`
}

export function requireMisPageSession(req: VercelRequest, res: VercelResponse): boolean {
  if (verifyMisSessionToken(misSessionFromRequest(req))) return true
  const path = String(req.url ?? '/mis-dashboard').split('?')[0] || '/mis-dashboard'
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).send(misSessionBridgeHtml(path))
  return false
}
