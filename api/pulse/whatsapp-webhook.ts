import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clearPending, getPending, waSendText } from '../_lib/pulse/whatsapp.js'
import { fetchNewsSections, totalNewsItems } from '../_lib/pulse/news.js'
import { handleSjJoinOrderReply } from '../_lib/recruitment/sj-join-order.js'
import { handleSjRegAskDateReply } from '../_lib/recruitment/sj-reg-ask-date.js'

/**
 * Inbound webhook from Whapi.cloud.
 * When the admin replies OK / SEND, distribute the pending edition:
 *   Post 1 -> WhatsApp Channel, Post 2 -> all configured Groups.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true })

  try {
    const body = (req.body ?? {}) as any
    const messages: any[] = Array.isArray(body.messages) ? body.messages : []
    const admin = (process.env.ADMIN_WHATSAPP ?? '').replace(/\D/g, '')

    for (const m of messages) {
      const from = String(m?.from ?? '').replace(/\D/g, '')
      const chat = String(m?.chat_id ?? '').replace(/\D/g, '')
      const textRaw = String(
        m?.text?.body ??
          m?.body ??
          m?.button?.text ??
          m?.reply?.title ??
          m?.interactive?.button_reply?.title ??
          '',
      ).trim()
      const text = textRaw.toUpperCase()
      const buttonId = String(m?.reply?.id ?? m?.button?.id ?? m?.interactive?.button_reply?.id ?? '')
      const isAdmin = (v: string) => Boolean(v && admin && (v.endsWith(admin) || admin.endsWith(v)))

      if (text !== 'OK' && text !== 'SEND') {
        const joinFrom = from || chat
        if (joinFrom) {
          const handled = await handleSjJoinOrderReply({
            from: joinFrom,
            text: textRaw,
            buttonId,
            messageId: String(m?.id ?? ''),
          })
          if (handled) continue
          const asked = await handleSjRegAskDateReply({
            from: joinFrom,
            text: textRaw,
            buttonId,
            messageId: String(m?.id ?? ''),
          })
          if (asked) continue
        }
        continue
      }

      // Accept the OK only from the Director's own chat (works even when the
      // Director messages the connected number itself, i.e. "message yourself").
      if (admin && !(isAdmin(from) || isAdmin(chat))) continue

      const pending = await getPending()
      if (!pending) {
        if (admin) await waSendText(admin, 'No edition is waiting to send right now.')
        continue
      }

      // SAFEGUARD: never distribute a bulletin that currently has no news.
      const sections = await fetchNewsSections()
      if (totalNewsItems(sections) === 0) {
        if (admin) await waSendText(admin, '⚠️ Not sent — there is no fresh news right now. Please try again shortly.')
        continue
      }

      const channel = process.env.WHAPI_CHANNEL_ID?.trim()
      const groups = (process.env.WHAPI_GROUP_IDS ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      if (channel) await waSendText(channel, pending.msg1)
      for (const g of groups) await waSendText(g, pending.msg2)

      await clearPending()
      if (admin) {
        await waSendText(
          admin,
          `✅ Sent! Post 1 to your Channel and Post 2 to ${groups.length} group(s). — ${pending.edition}`,
        )
      }
    }
  } catch {
    /* never fail the webhook */
  }

  return res.status(200).json({ ok: true })
}
