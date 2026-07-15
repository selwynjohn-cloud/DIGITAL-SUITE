import { CONTRACT_START_STEPS, DEFAULT_UNIFORM_REQUIREMENTS, SURVEY_PARTS, riskBand, surveyGrandTotal, surveyPartTotal } from './survey-template.js'
import type { CrmSiteInputs } from './store.js'

export type SurveyAiInput = {
  company: string
  locationName: string
  address: string
  natureOfBusiness: string
  surveyDate: string
  surveyedBy: string
  scores: Record<string, number>
  scoreNotes: Record<string, string>
  siteInputs?: CrmSiteInputs
  siteObservations: string
  deploymentPlan?: string
}

function ruleBasedReport(input: SurveyAiInput): {
  executiveSummary: string
  riskAnalysis: string
  manning: string
  equipment: string
  uniformRequirements: string
  securityRecommendations: string
  recommendations: string
} {
  const total = surveyGrandTotal(input.scores)
  const band = riskBand(total)
  const inp = input.siteInputs
  const partLines = SURVEY_PARTS.map((p) => {
    const t = surveyPartTotal(input.scores, p)
    return `${p.title}: ${t} / ${p.maxTotal}`
  }).join('\n')

  const highItems = SURVEY_PARTS.flatMap((p) =>
    p.items
      .filter((it) => (Number(input.scores[it.id]) || 0) >= 4)
      .map((it) => `- ${it.label} (score ${input.scores[it.id]})${input.scoreNotes[it.id] ? ': ' + input.scoreNotes[it.id] : ''}`),
  )

  const riskAnalysis = [
    `Scientific risk assessment methodology: Agile Security Force 180-point physical security checklist across three domains — (1) Incidence of Crime, (2) Environment & Building, (3) Security Measures.`,
    `Aggregate score ${total}/180 classifies this site as ${band.level} risk.`,
    partLines,
    '',
    inp?.vulnerableAreas ? `Identified vulnerable areas: ${inp.vulnerableAreas}.` : '',
    inp?.criticalAssets ? `Critical assets requiring enhanced protection: ${inp.criticalAssets}.` : '',
    highItems.length ? `Priority mitigation targets:\n${highItems.join('\n')}` : 'No individual checklist item scored 4–5; maintain preventive controls and quarterly review.',
  ]
    .filter(Boolean)
    .join('\n')

  const executiveSummary = [
    `${input.company} invited Agile Security Force Pvt Ltd to conduct a comprehensive Security Survey and Risk Assessment at ${input.locationName || input.address || 'the site'}.`,
    input.natureOfBusiness ? `Nature of business: ${input.natureOfBusiness}.` : '',
    inp?.scopeOfWork ? `Scope: ${inp.scopeOfWork}.` : '',
    `Survey conducted on ${input.surveyDate || '—'} by ${input.surveyedBy || 'Agile survey team'} including day and evening site visits.`,
    `Overall risk classification: ${band.level} (${total}/180).`,
    input.siteObservations ? `Key observations: ${input.siteObservations}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const manning =
    band.level === 'Critical' || band.level === 'High'
      ? 'Recommend 24×7 manned guarding with ASO/LSG/SG mix; minimum 3 shifts (A/B/C); dedicated ASO supervisor per shift; increased perimeter patrolling; access control at all entry points.'
      : band.level === 'Moderate'
        ? 'Recommend manned guarding with day + night coverage; supervisor visit twice per shift; mobile patrolling at vulnerable points; visitor & vehicle register mandatory.'
        : 'Recommend standard guarding per client scope; periodic patrolling; 90-day security review.'

  const equipment: string[] = []
  if ((input.scores.p3_lighting || 0) >= 3) equipment.push('LED perimeter & entrance lighting upgrade')
  if ((input.scores.p3_cctv || 0) >= 3) equipment.push('CCTV cameras at blind spots with 30-day DVR retention')
  if ((input.scores.p2_boundaries || 0) >= 3) equipment.push('Perimeter fencing reinforcement & warning signage')
  if ((input.scores.p3_vehicle_log || 0) >= 3) equipment.push('Visitor & vehicle register / e-log system')
  if ((input.scores.p3_keys || 0) >= 3) equipment.push('Key control cabinet with register')
  equipment.push('Torch, baton, whistle per guard · walkie-talkie for supervisor · first-aid kit at post')
  if (!equipment.length) equipment.push('Standard Agile SOP equipment per post')

  const securityRecommendations = [
    highItems.length ? 'Immediate actions:\n' + highItems.join('\n') : 'Continue existing controls; schedule quarterly audit.',
    '',
    'Professional recommendations:',
    '• Implement layered security: deterrence (uniformed presence) → detection (CCTV/patrol) → delay (locks/fencing) → response (SOP/incident register)',
    '• Complete Agile 12-step Contract Start Process before deployment go-live',
    '• Daily Security Report (DSR) to client · weekly supervisor audit',
    CONTRACT_START_STEPS.slice(0, 4).map((s) => s.title).join(' → '),
  ].join('\n')

  return {
    executiveSummary,
    riskAnalysis,
    manning,
    equipment: equipment.map((e, i) => `${i + 1}. ${e}`).join('\n'),
    uniformRequirements: DEFAULT_UNIFORM_REQUIREMENTS,
    securityRecommendations,
    recommendations: securityRecommendations,
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
        temperature: 0.4,
        max_tokens: 3000,
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    return data.choices?.[0]?.message?.content?.trim() || null
  } catch {
    return null
  }
}

export async function generateSurveyAiReport(input: SurveyAiInput): Promise<{
  executiveSummary: string
  riskAnalysis: string
  manning: string
  equipment: string
  uniformRequirements: string
  securityRecommendations: string
  recommendations: string
  aiUsed: boolean
}> {
  const fallback = ruleBasedReport(input)
  const total = surveyGrandTotal(input.scores)
  const band = riskBand(total)
  const inp = input.siteInputs

  const scoreDetail = SURVEY_PARTS.map((p) => {
    const lines = p.items.map((it) => {
      const sc = Number(input.scores[it.id]) || 0
      const note = input.scoreNotes[it.id] ? ` (${input.scoreNotes[it.id]})` : ''
      return `  ${it.label}: ${sc}/5${note}`
    })
    return `${p.title} [${surveyPartTotal(input.scores, p)}/${p.maxTotal}]\n${lines.join('\n')}`
  }).join('\n\n')

  const system = `You are a senior physical security consultant for Agile Security Force Pvt Ltd, India.
Write professional CLIENT-FACING survey reports. Use scientific risk language. Scores 0=low risk, 5=high risk. Max 180.
Include uniform standards, equipment, manning (ASO/LSG/SG shifts), and actionable mitigation.`

  const user = `Company: ${input.company}
Location: ${input.locationName}
Address: ${input.address}
Business: ${input.natureOfBusiness}
Survey date: ${input.surveyDate}
Surveyed by: ${input.surveyedBy}
Overall score: ${total}/180 (${band.level})

SITE INPUTS (client brief):
Client brief: ${inp?.clientBrief || '—'}
Scope: ${inp?.scopeOfWork || '—'}
Existing security: ${inp?.existingSecurity || '—'}
Shifts: ${inp?.proposedShifts || '—'}
Strength: ${inp?.sanctionedStrength || '—'}
Critical assets: ${inp?.criticalAssets || '—'}
Vulnerable areas: ${inp?.vulnerableAreas || '—'}

Observations: ${input.siteObservations || '—'}
Deployment plan: ${input.deploymentPlan || '—'}

Checklist:
${scoreDetail}

Respond JSON only:
executiveSummary, riskAnalysis (scientific 2-3 paragraphs), manning, equipment (numbered), uniformRequirements (bullet uniform/grooming), securityRecommendations (professional bullets), recommendations (same as securityRecommendations shortened).`

  const raw = await callLlm(system, user)
  if (raw) {
    try {
      const cleaned = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '')
      const j = JSON.parse(cleaned) as Record<string, string>
      if (j.executiveSummary) {
        return {
          executiveSummary: String(j.executiveSummary),
          riskAnalysis: String(j.riskAnalysis || fallback.riskAnalysis),
          manning: String(j.manning || fallback.manning),
          equipment: String(j.equipment || fallback.equipment),
          uniformRequirements: String(j.uniformRequirements || fallback.uniformRequirements),
          securityRecommendations: String(j.securityRecommendations || j.recommendations || fallback.securityRecommendations),
          recommendations: String(j.recommendations || j.securityRecommendations || fallback.recommendations),
          aiUsed: true,
        }
      }
    } catch {
      return {
        executiveSummary: raw.slice(0, 4000),
        riskAnalysis: fallback.riskAnalysis,
        manning: fallback.manning,
        equipment: fallback.equipment,
        uniformRequirements: fallback.uniformRequirements,
        securityRecommendations: fallback.securityRecommendations,
        recommendations: fallback.recommendations,
        aiUsed: true,
      }
    }
  }

  return { ...fallback, aiUsed: false }
}
