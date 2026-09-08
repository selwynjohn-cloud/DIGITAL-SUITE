import { guardsSendWhatsAppPing } from '../guards/whatsapp-send.js'
import { FA_ADVISORY_URL, advCopy, faAdvIssueStamp, isAdvLang } from './fa-advisory-i18n.js'
import { faDigitsMobile } from './fa-store.js'
import { trainingBrandWhatsAppHeader } from './training-brand.js'
import type { HdfcFaRecipient } from './fa-advisory-recipients.js'

export function faAdvisoryWhatsAppText(lang: string, mobile = ''): string {
  const code = isAdvLang(lang) ? lang : 'en'
  const copy = advCopy(code)
  const q = new URLSearchParams({ lang: code })
  const m = faDigitsMobile(mobile)
  if (m.length === 10) q.set('m', m)
  const url = `${FA_ADVISORY_URL}?${q.toString()}`
  return [
    trainingBrandWhatsAppHeader(copy.waTitle),
    '',
    copy.seriesClient,
    `${copy.seriesName} · ${faAdvIssueStamp()}`,
    '',
    copy.waBody,
    url,
  ].join('\n')
}

export async function sendFaAdvisoryWhatsApp(opts: {
  recipients: HdfcFaRecipient[]
  lang: string
  skipAcknowledged?: boolean
}): Promise<{ sent: number; failed: number; skipped: number; text: string }> {
  const sample = faAdvisoryWhatsAppText(opts.lang)
  let sent = 0
  let failed = 0
  let skipped = 0
  for (const r of opts.recipients) {
    if (opts.skipAcknowledged !== false && r.acknowledged) {
      skipped += 1
      continue
    }
    const text = faAdvisoryWhatsAppText(opts.lang, r.mobile)
    const res = await guardsSendWhatsAppPing(r.mobile, text)
    if (res.ok) sent += 1
    else failed += 1
  }
  return { sent, failed, skipped, text: sample }
}
