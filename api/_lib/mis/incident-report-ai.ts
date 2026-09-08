/**
 * AI suggestions — how to avoid recurrence of a reported site incident.
 */
import type { MisIncidentReport } from './incident-report-store.js'

async function callLlm(system: string, user: string): Promise<string | null> {
  const openaiKey = process.env.OPENAI_API_KEY?.trim()
  const pplxKey = process.env.PERPLEXITY_API_KEY?.trim()
  const url = openaiKey
    ? 'https://api.openai.com/v1/chat/completions'
    : pplxKey
      ? 'https://api.perplexity.ai/chat/completions'
      : ''
  const key = openaiKey || pplxKey
  if (!url || !key) return null
  const model = openaiKey ? process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini' : 'sonar'
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.35,
        max_tokens: 1200,
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    return data.choices?.[0]?.message?.content?.trim() || null
  } catch {
    return null
  }
}

function ruleBasedSuggestions(r: Pick<
  MisIncidentReport,
  'typeOfIncident' | 'briefDescription' | 'findings' | 'actionTaken' | 'clientName' | 'placeOfIncident'
>): string {
  const type = (r.typeOfIncident || '').toLowerCase()
  const lines: string[] = []
  lines.push(
    'Awareness and counselling: Conduct a special session for deployed personnel on workplace discipline, professional conduct, and client-specific SOPs.',
  )
  lines.push(
    'Enhanced supervision: Operations Managers / Regional Managers shall conduct surprise inspections across shifts (including night) to verify alertness and post discipline.',
  )
  lines.push(
    'Fitness-for-duty checks: Supervisors shall assess personnel at the start of every shift for fitness, alertness, grooming, and readiness before posting.',
  )
  if (/sleep|intoxic|alcohol|drunk|under the influence/.test(type + ' ' + (r.briefDescription || ''))) {
    lines.push(
      'Alcohol / substance control: Reiterate zero-tolerance for alcohol before or during duty; random fitness checks and immediate withdrawal from post on suspicion.',
    )
  }
  if (/absent|desert|left post|out of post|missing/.test(type + ' ' + (r.briefDescription || ''))) {
    lines.push(
      'Post manning discipline: Strengthen relief / replacement protocol and require OM confirmation before any guard change at the client site.',
    )
  }
  if (/theft|loss|property|fire|assault|fight/.test(type + ' ' + (r.briefDescription || ''))) {
    lines.push(
      'Site controls: Review access control, visitor registers, CCTV coverage, and escalate any property-related risk to the client SPOC within the agreed timeline.',
    )
  }
  lines.push(
    'Periodic refresher training: Cover security responsibilities, fire safety, professional ethics, and this client’s standing instructions.',
  )
  lines.push(
    `Client coordination (${r.clientName || r.placeOfIncident || 'site'}): Share corrective actions with the client SPOC and confirm replacement / deployment paperwork is on file.`,
  )
  return lines.map((l) => `• ${l}`).join('\n')
}

/** Deepen suggestion text from incident facts — for letter section 12. */
export async function suggestIncidentRecurrenceAvoidance(
  r: Pick<
    MisIncidentReport,
    | 'typeOfIncident'
    | 'briefDescription'
    | 'findings'
    | 'actionTaken'
    | 'personnelInvolved'
    | 'clientName'
    | 'placeOfIncident'
    | 'lossOfProperty'
  >,
): Promise<{ ok: true; suggestion: string; source: 'ai' | 'rules' } | { ok: false; error: string }> {
  const fallback = ruleBasedSuggestions(r)
  const system = `You are a senior Operations Director for Agile Security Force Pvt Ltd (India). You write the ADDITIONAL "Alerts & suggestions" block that appears AFTER the human Inquiry Officer has already written Findings, Action Taken, and their own Suggestion.

Rules:
- Write 4–7 practical bullet points on how to AVOID RECURRENCE of THIS specific incident.
- Do NOT rewrite or replace the human report — only add alerts and extra recommendations.
- Base suggestions on the facts given — do not invent unrelated events.
- Tone: professional, constructive, client-facing (no internal blame language).
- Each bullet one clear action (supervision, training, fitness-for-duty, replacement protocol, client SOP, documentation).
- Output plain text bullets starting with "• " only. No preamble or closing.`

  const user = `Client / place: ${r.clientName || '—'} · ${r.placeOfIncident || '—'}
Type of incident: ${r.typeOfIncident || '—'}
Personnel involved: ${r.personnelInvolved || '—'}
Loss of property: ${r.lossOfProperty || 'Nil'}
Brief description:
${r.briefDescription || '—'}

Findings:
${r.findings || '—'}

Action already taken:
${r.actionTaken || '—'}

Write additional alerts & suggestions to appear AFTER the human suggestion section.`

  const ai = await callLlm(system, user)
  if (ai && ai.length > 40) {
    const cleaned = ai
      .replace(/\r/g, '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => (l.startsWith('•') || l.startsWith('-') || l.startsWith('*') ? l.replace(/^[-*]\s*/, '• ') : `• ${l}`))
      .join('\n')
    return { ok: true, suggestion: cleaned.slice(0, 5000), source: 'ai' }
  }
  if (!process.env.OPENAI_API_KEY?.trim() && !process.env.PERPLEXITY_API_KEY?.trim()) {
    return { ok: true, suggestion: fallback, source: 'rules' }
  }
  return { ok: true, suggestion: fallback, source: 'rules' }
}
