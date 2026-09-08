import type { GuardComplaint } from './store.js'
import {
  applySla,
  branchDisplayName,
  getCommunications,
  logCommunication,
  logEvent,
  saveComplaints,
} from './store.js'
import { sendDelayedEscalationMail, sendDelayedGuardApologyWhatsApp } from './notify.js'

/** Flag overdue complaints and email / WhatsApp guard + staff when past 24h SLA — once only. */
export async function processDelayedEscalations(
  all: GuardComplaint[],
  branches: { id: string; name: string }[],
  opts?: { sendEmails?: boolean },
): Promise<GuardComplaint[]> {
  const sendEmails = opts?.sendEmails !== false
  const comms = sendEmails ? await getCommunications() : []
  let changed = false
  for (const c of all) {
    const n = applySla(c)
    if (sendEmails && n.isDelayed && n.status !== 'solved') {
      const branchName = branchDisplayName(n.branchId, branches)
      if (!n.delayedNotifiedAt) {
        const mail = await sendDelayedEscalationMail(n, branchName)
        n.delayedNotifiedAt = new Date().toISOString()
        changed = true
        await logEvent(n.id, 'SLA', 'Delayed escalation', `Email sent to Director & HODs.`, 'System')
        if (mail.ok) {
          await logCommunication({
            complaintId: n.id,
            code: n.code,
            channel: 'email',
            type: 'delayed_escalation',
            subject: `DELAYED — ${n.code}`,
            body: `Delayed complaint escalation — ${branchName}`,
            sentTo: (mail.to || []).join(', '),
            sentBy: 'System',
          })
        }
      }

      const alreadyGuardWa =
        Boolean(n.delayedGuardNotifiedAt) ||
        comms.some(
          (x) =>
            x.complaintId === n.id &&
            x.channel === 'whatsapp' &&
            x.type === 'delayed_escalation',
        ) ||
        comms.some(
          (x) =>
            x.code === n.code &&
            x.channel === 'whatsapp' &&
            x.type === 'delayed_escalation' &&
            /delayed apology/i.test(String(x.subject || '')),
        )

      if (alreadyGuardWa) {
        // Back-fill flag so normalize/save never re-triggers (many BAN/MUM/… loops).
        if (!n.delayedGuardNotifiedAt) {
          n.delayedGuardNotifiedAt = new Date().toISOString()
          changed = true
        }
      } else {
        const wa = await sendDelayedGuardApologyWhatsApp(n, branchName)
        // Always stamp after first attempt — apology (WA + staff email CC) goes once only.
        n.delayedGuardNotifiedAt = new Date().toISOString()
        changed = true
        if (wa.whatsappOk) {
          await logCommunication({
            complaintId: n.id,
            code: n.code,
            channel: 'whatsapp',
            type: 'delayed_escalation',
            subject: wa.subject || `Delayed apology — ${n.code}`,
            body: wa.body || '',
            sentTo: wa.sentTo || n.mobile,
            sentBy: 'System',
          })
        }
        if (wa.emailOk) {
          await logCommunication({
            complaintId: n.id,
            code: n.code,
            channel: 'email',
            type: 'delayed_escalation',
            subject: `${wa.subject || `Delayed apology — ${n.code}`} (staff copy)`,
            body: `Apology copy — To: ${(wa.emailTo || []).join(', ')} · CC: ${(wa.emailCc || []).join(', ')}`,
            sentTo: [...(wa.emailTo || []), ...(wa.emailCc || [])].join(', '),
            sentBy: 'System',
          })
        }
        if (wa.whatsappOk || wa.emailOk) {
          await logEvent(
            n.id,
            'SLA',
            'Delayed apology sent once',
            [
              wa.whatsappOk ? `WhatsApp to guard ${n.mobile}` : '',
              wa.emailOk
                ? `Email To ${(wa.emailTo || []).join(', ')} · CC ${(wa.emailCc || []).join(', ')}`
                : '',
            ]
              .filter(Boolean)
              .join(' · '),
            'System',
          )
        } else if (!wa.skipped) {
          await logEvent(
            n.id,
            'SLA',
            'Delayed apology skipped',
            `Not delivered (${wa.error || 'failed'}) — will not re-send automatically.`,
            'System',
          )
        }
      }
    }
    Object.assign(c, n)
  }
  if (changed) await saveComplaints(all)
  return all
}
