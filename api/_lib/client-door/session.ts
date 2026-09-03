import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createSessionToken, normaliseEmail, verifySessionToken } from '../auth.js'
import { CLIENT_DOOR_APP_ID } from './lookup.js'

export const CLIENT_DOOR_COOKIE = 'client_door'
const MAX_AGE_SEC = 8 * 60 * 60

function cookieDomain(host: string | undefined): string {
  const h = String(host ?? '')
    .toLowerCase()
    .split(':')[0]
  if (
    h === 'agilegroup-digital.co.in' ||
    h === 'www.agilegroup-digital.co.in' ||
    h.endsWith('.agilegroup-digital.co.in')
  ) {
    return '.agilegroup-digital.co.in'
  }
  return ''
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

export async function issueClientDoorToken(email: string): Promise<string> {
  return createSessionToken({
    email: normaliseEmail(email),
    role: 'management',
    appId: CLIENT_DOOR_APP_ID,
  })
}

export async function readClientDoorEmail(req: VercelRequest, bodyToken?: unknown): Promise<string> {
  const fromBody = String(bodyToken ?? '').trim()
  const fromCookie = parseCookies(req.headers.cookie)[CLIENT_DOOR_COOKIE] || ''
  const token = fromBody || fromCookie
  if (!token) return ''
  const payload = await verifySessionToken(token)
  if (!payload || payload.appId !== CLIENT_DOOR_APP_ID) return ''
  return normaliseEmail(payload.email)
}

export function setClientDoorCookie(res: VercelResponse, token: string, host?: string) {
  const dom = cookieDomain(host)
  const domPart = dom ? ` Domain=${dom};` : ''
  res.setHeader(
    'Set-Cookie',
    `${CLIENT_DOOR_COOKIE}=${encodeURIComponent(token)};${domPart} Path=/; Max-Age=${MAX_AGE_SEC}; HttpOnly; Secure; SameSite=Lax`,
  )
}

export function clearClientDoorCookie(res: VercelResponse, host?: string) {
  const dom = cookieDomain(host)
  const domPart = dom ? ` Domain=${dom};` : ''
  res.setHeader(
    'Set-Cookie',
    `${CLIENT_DOOR_COOKIE}=;${domPart} Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
  )
}
