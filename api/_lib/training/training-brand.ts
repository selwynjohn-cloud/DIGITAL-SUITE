/**
 * Agile Training brand — Track 1 communications & portal header.
 * Source of truth for company / department / tagline under the logo.
 */

import { suiteAppOpenPageFooterInlineHtml } from '../suite-app-footer.js'
import { suiteImportantNumbersHtml } from '../suite-digest-shell.js'
import { TRAINING_TRACK1_TITLE } from './track-labels.js'

/** Clear logo — no white plate (same as suite communications). */
export const TRAINING_LOGO_URL = 'https://www.agilegroup-digital.co.in/agile-logo-clear.png'
/** Fallback wordmark if the clear file is missing on a host. */
export const TRAINING_LOGO_FALLBACK_URL = 'https://www.agilegroup-digital.co.in/agile-logo.png'
/** Google review page after client selects Highly Beneficial. */
export const TRAINING_GOOGLE_REVIEW_URL =
  'https://www.google.com/maps/search/?api=1&query=Agile+Security+Force+Private+Limited'

export const TRAINING_BRAND = {
  company: 'Agile Security Force Private Limited',
  department: 'Department of Security Training & Excellence',
  tagline: 'Empowering Guards. Elevating Security.',
  logoUrl: TRAINING_LOGO_URL,
  track1: TRAINING_TRACK1_TITLE,
} as const

/** Transparent Agile wordmark — no white plate. Used on letters and local previews. */
export function trainingBrandLogoImgHtml(): string {
  return `<img src="${TRAINING_LOGO_URL}" alt="Agile Security Force" height="72" width="auto" style="display:block;margin:0 auto 12px;height:72px;width:auto;max-width:160px;object-fit:contain;background:transparent!important;border:0;padding:0;box-shadow:none" onerror="this.onerror=null;this.src='${TRAINING_LOGO_FALLBACK_URL}'">`
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** Email / letter header — logo + company + department + tagline (+ optional document title). */
export function trainingBrandHeaderHtml(opts?: {
  title?: string
  subtitle?: string
  accentFrom?: string
  accentTo?: string
}): string {
  const from = opts?.accentFrom || '#0f766e'
  const to = opts?.accentTo || '#0369a1'
  const title = String(opts?.title || '').trim()
  const subtitle = String(opts?.subtitle || '').trim()
  return `<div style="background:linear-gradient(135deg,${from} 0%,${to} 100%);padding:0;text-align:center;color:#fff">
      <div style="height:5px;background:linear-gradient(90deg,#c9a84c,#fbbf24,#c9a84c)"></div>
      <div style="padding:22px 18px 20px">
        ${trainingBrandLogoImgHtml()}
        <div style="font-size:15px;font-weight:800;color:#fff;letter-spacing:.02em;line-height:1.35">${esc(TRAINING_BRAND.company)}</div>
        <div style="font-size:13px;font-weight:700;color:#fde68a;margin-top:8px;line-height:1.35">${esc(TRAINING_BRAND.department)}</div>
        <div style="font-size:14px;font-weight:700;font-style:italic;color:#99f6e4;margin-top:8px;line-height:1.35">${esc(TRAINING_BRAND.tagline)}</div>
        ${
          title
            ? `<div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.22)">
          <div style="font-size:18px;font-weight:900;line-height:1.3;color:#fff">${esc(title)}</div>
          ${subtitle ? `<div style="font-size:13px;color:#bae6fd;margin-top:6px">${subtitle}</div>` : ''}
        </div>`
            : subtitle
              ? `<div style="font-size:13px;color:#bae6fd;margin-top:10px">${subtitle}</div>`
              : ''
        }
      </div>
    </div>`
}

/** Track 1 email / letter shell — brand header + body + suite footer. */
export function trainingTrack1EmailShell(opts: {
  title: string
  subtitle: string
  bodyHtml: string
  footerNote?: string
  accentFrom?: string
  accentTo?: string
  includeImportantNumbers?: boolean
}): string {
  const numbers =
    opts.includeImportantNumbers === false ? '' : suiteImportantNumbersHtml()
  return `<div style="font-family:'Segoe UI',Arial,Helvetica,sans-serif;max-width:840px;margin:0 auto;background:#f1f5f9;padding:18px;color:#0f172a;color-scheme:light">
  <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,.12);color:#0f172a">
    ${trainingBrandHeaderHtml({
      title: opts.title,
      subtitle: opts.subtitle,
      accentFrom: opts.accentFrom,
      accentTo: opts.accentTo,
    })}
    <div style="padding:22px 20px;color:#0f172a;font-size:14px;line-height:1.55;background:#ffffff">
      ${opts.bodyHtml}
      ${numbers}
    </div>
    ${suiteAppOpenPageFooterInlineHtml()}
  </div>
</div>`
}

/** Sign-off block for Track 1 emails. */
export function trainingBrandSignOffHtml(): string {
  return `<p style="margin:16px 0 0;color:#0f172a">Regards,<br/><strong>${esc(TRAINING_BRAND.company)}</strong><br/><span style="color:#334155">${esc(TRAINING_BRAND.department)}</span></p>`
}

/** WhatsApp / plain-text brand header (+ optional document title). */
export function trainingBrandWhatsAppHeader(docTitle?: string): string {
  const lines = [TRAINING_BRAND.company, TRAINING_BRAND.department, TRAINING_BRAND.tagline, '────────────────']
  const t = String(docTitle || '').trim()
  if (t) lines.push(t)
  return lines.join('\n')
}

export function trainingBrandSignOffText(): string {
  return `Regards,\n${TRAINING_BRAND.company}\n${TRAINING_BRAND.department}`
}
