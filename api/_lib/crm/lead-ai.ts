export type LeadAiInput = {
  company: string
  webAddress: string
  location: string
  city: string
  state: string
  sector: string
}

function ruleBasedLeadResearch(input: LeadAiInput): { aiResearch: string; swot: string } {
  const co = input.company || 'This client'
  const loc = [input.location, input.city, input.state].filter(Boolean).join(', ') || 'India'
  const web = input.webAddress ? `Website: ${input.webAddress}` : 'Website: not provided'
  const aiResearch = [
    `${co} — preliminary research (rule-based; add OpenAI/Perplexity key for live web research).`,
    `Sector: ${input.sector || '—'}.`,
    `Site location: ${loc}.`,
    web,
    '',
    'India presence: Verify factories, branches and regional offices via company website and MCA filings.',
    'Headquarters: Check About Us / Contact page on client website.',
    'Security opportunity: Manned guarding, access control, and facility management may apply based on sector.',
  ].join('\n')
  const swot = [
    'STRENGTHS: Agile local branch presence; PSARA-licensed operations; multi-sector experience.',
    'WEAKNESSES: Confirm incumbent agency contract terms and notice period before bid.',
    'OPPORTUNITIES: New site / contract renewal / dissatisfaction with present agency.',
    'THREATS: L1 competitors on price; long incumbent relationships; delayed decision cycle.',
  ].join('\n')
  return { aiResearch, swot }
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
        temperature: 0.35,
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

export async function generateLeadAiResearch(input: LeadAiInput): Promise<{
  aiResearch: string
  swot: string
  aiUsed: boolean
}> {
  const fallback = ruleBasedLeadResearch(input)
  const system = `You are a B2B sales intelligence analyst for Agile Security Force Pvt Ltd (India security services).
Research the client company using the details given. Write concise factual sections:
1) COMPANY OVERVIEW
2) INDIA PRESENCE (cities, plants, offices)
3) HEADQUARTERS
4) SECTOR & SECURITY NEEDS
5) KEY FACTS FOR SALES TEAM
Then a SWOT analysis tailored to winning a manned guarding / facility security contract with Agile Security Force.
If website URL is given, use it. If information is uncertain, say "verify on site".`

  const user = `Company: ${input.company}
Website: ${input.webAddress || '—'}
Full address: ${input.location || '—'}
City: ${input.city || '—'}
State: ${input.state || '—'}
Sector: ${input.sector || '—'}

Format response exactly as:
===RESEARCH===
(company research text)
===SWOT===
(SWOT text)`

  const raw = await callLlm(system, user)
  if (!raw) return { ...fallback, aiUsed: false }

  const researchMatch = raw.match(/===RESEARCH===\s*([\s\S]*?)(?:===SWOT===|$)/i)
  const swotMatch = raw.match(/===SWOT===\s*([\s\S]*)/i)
  if (researchMatch || swotMatch) {
    return {
      aiResearch: (researchMatch?.[1] || raw).trim().slice(0, 6000),
      swot: (swotMatch?.[1] || fallback.swot).trim().slice(0, 800),
      aiUsed: true,
    }
  }
  return { aiResearch: raw.slice(0, 6000), swot: fallback.swot, aiUsed: true }
}
