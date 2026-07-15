export type RcaResult = {
  summary: string
  rootCauses: string[]
  mistakes: string[]
  competitorEdge: string
  lessons: string[]
  winNextTime: string[]
  earlyWarnings: string[]
  aiUsed: boolean
}

function str(v: unknown, n = 400): string {
  return String(v ?? '').trim().slice(0, n)
}

function parseJsonBlock(raw: string): Record<string, unknown> | null {
  const t = raw.trim()
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(t.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return null
  }
}

async function callLlm(system: string, user: string): Promise<string | null> {
  const openaiKey = process.env.OPENAI_API_KEY?.trim()
  const pplxKey = process.env.PERPLEXITY_API_KEY?.trim()
  const url = openaiKey ? 'https://api.openai.com/v1/chat/completions' : pplxKey ? 'https://api.perplexity.ai/chat/completions' : ''
  const key = openaiKey || pplxKey
  if (!url || !key) return null
  const model = openaiKey ? (process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini') : 'sonar'
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
        temperature: 0.3,
        max_tokens: 3500,
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    return data.choices?.[0]?.message?.content?.trim() || null
  } catch {
    return null
  }
}

function arr(v: unknown, n = 8): string[] {
  if (!Array.isArray(v)) return []
  return v.map((x) => str(x, 500)).filter(Boolean).slice(0, n)
}

function salesContext(data: Record<string, unknown>): string {
  const comps = Array.isArray(data.competitors)
    ? data.competitors.map((c: any) => `${str(c?.name, 80)} @ ${str(c?.quote, 60)}`).filter((x) => x.trim() !== '@').join(' · ')
    : ''
  return [
    `Type: Sales Lead (Lost)`,
    `Company: ${str(data.company, 200)}`,
    `Branch: ${str(data.branch, 80)}`,
    `Location: ${str(data.location, 200)} | ${str(data.city, 80)} | ${str(data.state, 80)}`,
    `Sector: ${str(data.sector, 80)}`,
    `Stage when lost: ${str(data.stage, 60)}`,
    `Requirement: ${str(data.requirement, 300)}`,
    `Manpower: ${str(data.manpower, 40)}`,
    `Our quote (₹/month): ${str(data.estValue, 40)}`,
    `Existing rate client pays: ${str(data.existingRate, 80)}`,
    `Present agency (incumbent): ${str(data.presentAgency, 120)}`,
    `Reason for change: ${str(data.changeReason, 500)}`,
    `Loss reason noted: ${str(data.lossReason, 500)}`,
    `Competitors: ${comps || str(data.competitorSummary, 400)}`,
    `SWOT: ${str(data.swot, 800)}`,
    `Irritants to avoid: ${str(data.irritants, 400)}`,
    `Remarks: ${str(data.remarks, 500)}`,
  ].join('\n')
}

function tenderContext(data: Record<string, unknown>): string {
  const bidders = Array.isArray(data.bidders)
    ? data.bidders.map((b: any) => `${str(b?.rank, 8)}: ${str(b?.name, 80)} @ ${str(b?.quote, 60)}`).join(' · ')
    : str(data.competitorSummary, 400)
  return [
    `Type: Tender (Lost)`,
    `Client / Dept: ${str(data.clientDept, 200)}`,
    `Tender: ${str(data.tenderName, 200)}`,
    `Branch: ${str(data.branch, 80)}`,
    `Location: ${str(data.location, 120)} | ${str(data.state, 80)}`,
    `Portal: ${str(data.portal, 80)}`,
    `Services: ${str(data.typeOfServices, 120)}`,
    `Status when lost: ${str(data.status, 60)}`,
    `Manpower: ${str(data.requiredManpower, 40)}`,
    `Our quote: ${str(data.ourQuote, 60)}`,
    `Our position: ${str(data.ourPosition, 30)}`,
    `Winning quote: ${str(data.winningQuote, 60)}`,
    `Awarded to: ${str(data.awardedTo, 120)}`,
    `EMD: ${str(data.emd, 40)}`,
    `Min turnover condition: ${str(data.minTurnover3yr, 80)}`,
    `Evaluation: ${str(data.evaluationMethod, 120)}`,
    `L1–L4 bidders: ${bidders}`,
    `Remarks: ${str(data.remarks, 500)}`,
  ].join('\n')
}

function ruleBasedRca(kind: 'sales' | 'tender', data: Record<string, unknown>): RcaResult {
  const client = str(data.company || data.clientDept, 120) || 'This opportunity'
  const ourQuote = str(data.estValue || data.ourQuote, 60)
  const position = str(data.ourPosition, 30)
  const incumbent = str(data.presentAgency || data.awardedTo, 120)
  const competitors = str(data.competitorSummary, 300)

  const priceIssue =
    kind === 'tender'
      ? position && position !== 'L1' && position !== '—'
        ? `We were ${position} — price or evaluation score was not competitive enough.`
        : 'Price bid or evaluation criteria may not have favoured Agile.'
      : ourQuote
        ? 'Our monthly rate may have been above client budget or incumbent rate.'
        : 'Quote may not have been positioned clearly against incumbent pricing.'

  return {
    summary: `${client} was lost. Review pricing, relationship strength, and tender compliance to improve win rate next time.`,
    rootCauses: [
      priceIssue,
      incumbent ? `Strong incumbent relationship: ${incumbent}.` : 'Incumbent or L1 competitor had stronger client trust.',
      kind === 'tender' ? 'Tender compliance, EMD, turnover or technical score may have been a factor.' : 'Follow-up cadence or site survey depth may have been insufficient.',
    ],
    mistakes: [
      'Confirm decision criteria and budget range earlier in the cycle.',
      kind === 'tender' ? 'Validate L1 price corridor before final bid submission.' : 'Capture competitor rates and incumbent contract terms at first meeting.',
      'Document loss reason immediately while details are fresh.',
    ],
    competitorEdge: competitors || (incumbent ? `${incumbent} likely offered better price or longer track record on site.` : 'Competitor offered stronger commercial or technical proposition.'),
    lessons: [
      'Build relationship before tender release or RFP stage.',
      'Use Security Survey report to justify manning and rate.',
      'Track all competitor quotes in CRM for future benchmarking.',
    ],
    winNextTime: [
      'Start early engagement 60–90 days before renewal / tender.',
      kind === 'tender' ? 'Attend pre-bid meeting and clarify evaluation weightage.' : 'Offer pilot or phased deployment to reduce client risk.',
      'Director review of quote vs L1 corridor before submission.',
      'Assign single owner for follow-ups until decision date.',
    ],
    earlyWarnings: [
      'Client delays meetings or avoids sharing budget.',
      'Incumbent gets contract extension without open competition.',
      'Our quote is >8–10% above known L1 or incumbent rate.',
    ],
    aiUsed: false,
  }
}

export function formatRcaReport(kind: 'sales' | 'tender', client: string, result: RcaResult): string {
  const title = kind === 'tender' ? 'TENDER LOST' : 'SALES LEAD LOST'
  const lines = [
    `ROOT CAUSE ANALYSIS — ${title}`,
    `Client / Opportunity: ${client}`,
    '',
    'EXECUTIVE SUMMARY',
    result.summary,
    '',
    'ROOT CAUSES',
    ...result.rootCauses.map((x, i) => `${i + 1}. ${x}`),
    '',
    'WHAT WE DID WRONG / GAPS',
    ...result.mistakes.map((x, i) => `${i + 1}. ${x}`),
    '',
    'COMPETITOR / L1 ADVANTAGE',
    result.competitorEdge,
    '',
    'LESSONS LEARNED',
    ...result.lessons.map((x, i) => `${i + 1}. ${x}`),
    '',
    'HOW TO WIN NEXT TIME',
    ...result.winNextTime.map((x, i) => `${i + 1}. ${x}`),
    '',
    'EARLY WARNING SIGNS (watch for these)',
    ...result.earlyWarnings.map((x, i) => `${i + 1}. ${x}`),
    '',
    result.aiUsed ? '— AI-assisted RCA (verify with Tender Cell / Branch HOD)' : '— Rule-based RCA (add AI key for deeper analysis)',
  ]
  return lines.join('\n')
}

export async function generateLostOpportunityRca(
  kind: 'sales' | 'tender',
  data: Record<string, unknown>,
): Promise<RcaResult & { reportText: string }> {
  const fallback = ruleBasedRca(kind, data)
  const client = str(data.company || data.clientDept, 200) || 'Opportunity'
  const ctx = kind === 'tender' ? tenderContext(data) : salesContext(data)

  const system = `You are a senior sales & tender strategist for Agile Security Force Pvt Ltd (India security services).
Analyse why this opportunity was LOST. Be specific, practical, and honest — no generic fluff.
Return ONLY valid JSON (no markdown) with keys:
summary (3-4 sentences),
rootCauses (array of 3-5 strings),
mistakes (array of 3-5 strings — what Agile team did wrong or missed),
competitorEdge (paragraph on why competitor/L1 won),
lessons (array of 3-5 strings),
winNextTime (array of 4-6 actionable steps for Agile to win similar deals),
earlyWarnings (array of 3-4 early signals we missed).
Focus on Indian security tender and direct sales context: price, PSARA compliance, manning, incumbent relationships, EMD, turnover, technical score, follow-up discipline.`

  const llm = await callLlm(system, ctx)
  if (!llm) {
    const reportText = formatRcaReport(kind, client, fallback)
    return { ...fallback, reportText }
  }

  const j = parseJsonBlock(llm)
  if (!j) {
    const reportText = formatRcaReport(kind, client, fallback)
    return { ...fallback, reportText }
  }

  const result: RcaResult = {
    summary: str(j.summary, 1200) || fallback.summary,
    rootCauses: arr(j.rootCauses, 6).length ? arr(j.rootCauses, 6) : fallback.rootCauses,
    mistakes: arr(j.mistakes, 6).length ? arr(j.mistakes, 6) : fallback.mistakes,
    competitorEdge: str(j.competitorEdge, 1200) || fallback.competitorEdge,
    lessons: arr(j.lessons, 6).length ? arr(j.lessons, 6) : fallback.lessons,
    winNextTime: arr(j.winNextTime, 8).length ? arr(j.winNextTime, 8) : fallback.winNextTime,
    earlyWarnings: arr(j.earlyWarnings, 6).length ? arr(j.earlyWarnings, 6) : fallback.earlyWarnings,
    aiUsed: true,
  }
  return { ...result, reportText: formatRcaReport(kind, client, result) }
}
