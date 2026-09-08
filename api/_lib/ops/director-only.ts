/**
 * Ops shadow apps (Control / Security / Meeting) — Director-only until public launch.
 * Keeps the build private so field teams keep using live Work360 / MIS.
 */

import { normaliseEmail } from '../auth.js'

const DEFAULT_DIRECTORS = ['director@agilegroup.co.in', 'selwyn.john@gmail.com', 'sai@agilegroup.co.in']

export const OPS_SHADOW_APP_IDS = ['quality', 'meetings', 'ops', 'ops-mobile'] as const

/** Legacy helper — Control (App 06) is Phase-1 live for allowlisted emails; not a shadow wall. */
export function isOpsShadowAppId(appId: string): boolean {
  return (OPS_SHADOW_APP_IDS as readonly string[]).includes(String(appId || '').trim())
}

/** Only these emails may request a PIN or open Ops shadow apps. */
export function isOpsShadowDirectorEmail(email: string): boolean {
  const em = normaliseEmail(email)
  if (!em) return false
  const fromEnv = (process.env.OPS_SHADOW_DIRECTOR_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return new Set([...DEFAULT_DIRECTORS, ...fromEnv]).has(em)
}

export function opsComingSoonPublicMessage(): string {
  return 'Coming Soon'
}
