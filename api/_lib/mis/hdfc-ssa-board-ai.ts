/**
 * HDFC SSA State dashboard — branch letter + state conclusion.
 * Called only on Management Build / Refresh. Dashboard reads Redis after that.
 */
import { generateSurveyAiReport } from '../crm/survey-ai.js'
import { upsertPeriodicalSurvey, type MisPeriodicalSurvey } from './periodical-survey-store.js'
import {
  type HdfcSsaBoardAiPack,
  saveHdfcSsaBoardAi,
} from './hdfc-ssa-board-store.js'
import { assembleHdfcSsaBoard } from './hdfc-ssa-board-risk.js'
import { isBoardSubmitted, type HdfcSsaBoardBranch, type HdfcSsaBoardState } from './hdfc-ssa-state.js'

const MAX_SITE_AI = 6

async function callBoardLlm(system: string, user: string): Promise<string | null> {
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
        max_tokens: 900,
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    return data.choices?.[0]?.message?.content?.trim() || null
  } catch {
    return null
  }
}

function ruleBranchLetter(b: HdfcSsaBoardBranch): string {
  const lines = [
    `HDFC Site Security Assessment — ${b.branchName}, ${b.state}.`,
    `This city pack covers ${b.submitted} submitted unit${b.submitted === 1 ? '' : 's'} (${b.approved} Director-approved). Risk rate ${b.avgRiskRate}% (four bars: Deployment · Late start 2FA · Out of post · Vacant). Late start (2FA) ${b.lateStart2fa} · Out of post ${b.outOfPost} · Vacant ${b.vacantPosts}.`,
    '',
    'Units:',
  ]
  for (const s of b.sites.filter((x) => x.status !== 'Draft').slice(0, 12)) {
    const bit = s.summary ? ` — ${s.summary.slice(0, 160)}` : ''
    lines.push(
      `• ${s.location}${s.bankCode ? ` · Bank code ${s.bankCode}` : ''} — ${s.score}/180 · risk ${s.riskRate}% · ${s.riskLevel} · late start ${s.lateStart} · out of post ${s.outOfPost}${bit}`,
    )
  }
  lines.push('')
  lines.push(
    b.highRisk
      ? 'Recommended focus: close High / Critical items first (access, lighting, ATM lobby, emergency communication), then reassess those units.'
      : 'Recommended focus: keep monthly patrol and register discipline; schedule the next periodical check on the lowest-scoring units.',
  )
  return lines.join('\n')
}

function ruleStateConclusion(st: HdfcSsaBoardState): string {
  const names = st.branches.map((b) => b.branchName).join(', ')
  return [
    `${st.state} — HDFC SSA conclusion.`,
    `${st.approved} Director-approved sites · ${st.submitted} submitted · average ${st.avgScore}/180 · risk rate ${st.avgRiskRate}% · High / Critical ${st.highRisk}. Late start ${st.lateStart} · Out of post ${st.outOfPost} (last 21 days).`,
    `Independent branch cards (not combined): ${names}.`,
    st.highRisk
      ? 'State action: treat High / Critical units as the first conversation with HDFC; branch HODs close those gaps and return for a fresh score.'
      : 'State action: scores are within a manageable band. Continue the periodical cycle and keep approved sites on this dashboard.',
  ].join('\n')
}

async function fillEmptySiteReports(surveys: MisPeriodicalSurvey[]): Promise<number> {
  let filled = 0
  for (const sv of surveys) {
    if (filled >= MAX_SITE_AI) break
    if (!isBoardSubmitted(sv)) continue
    if (String(sv.executiveSummary || '').trim()) continue
    const report = await generateSurveyAiReport({
      company: sv.company || 'HDFC',
      locationName: sv.locationName || sv.address || '',
      address: sv.address || '',
      natureOfBusiness: sv.natureOfBusiness || 'Banking — HDFC',
      surveyDate: sv.surveyDate || '',
      surveyedBy: sv.surveyedBy || '',
      scores: sv.scores || {},
      scoreNotes: sv.scoreNotes || {},
      siteInputs: sv.siteInputs,
      siteObservations: sv.siteObservations || '',
      deploymentPlan: sv.deploymentPlan || '',
      industry: sv.industry === 'Other' ? sv.industryOther || 'Other' : sv.industry || 'Banking',
      hodSuggestions: '',
    })
    sv.executiveSummary = report.executiveSummary
    sv.riskAnalysis = report.riskAnalysis || sv.riskAnalysis
    sv.manningSuggestion = report.manning || sv.manningSuggestion
    sv.equipmentSuggestions = report.equipment || sv.equipmentSuggestions
    sv.uniformRequirements = report.uniformRequirements || sv.uniformRequirements
    sv.securityRecommendations = report.securityRecommendations || sv.securityRecommendations
    sv.recommendations = report.recommendations || sv.recommendations
    await upsertPeriodicalSurvey(sv)
    filled += 1
  }
  return filled
}

export async function refreshHdfcSsaBoardAi(opts: {
  branches: { id: string; name: string }[]
  surveys: MisPeriodicalSurvey[]
}): Promise<{ pack: HdfcSsaBoardAiPack; sitesFilled: number }> {
  const sitesFilled = await fillEmptySiteReports(opts.surveys)
  const states = await assembleHdfcSsaBoard({
    branches: opts.branches,
    surveys: opts.surveys,
    publicOnly: false,
  })
  const letters: Record<string, string> = {}
  const conclusions: Record<string, string> = {}
  const allBranches = states.flatMap((st) => st.branches.filter((b) => b.submitted))
  for (const b of allBranches) letters[b.branchKey] = ruleBranchLetter(b)
  for (const st of states) {
    if (st.submitted) conclusions[st.state] = ruleStateConclusion(st)
  }

  const polishBranches = allBranches.slice().sort((a, b) => b.submitted - a.submitted).slice(0, 6)
  const branchChunks: HdfcSsaBoardBranch[][] = []
  for (let i = 0; i < polishBranches.length; i += 3) branchChunks.push(polishBranches.slice(i, i + 3))
  for (const chunk of branchChunks) {
    const polished = await Promise.all(
      chunk.map((b) =>
        callBoardLlm(
          'You write short professional security letters for HDFC Bank. Client-facing. No HQ names. No internal HOD notes. 120–180 words. Plain paragraphs.',
          `Write one branch pack letter for Agile Security Force.\n${letters[b.branchKey]}`,
        ),
      ),
    )
    chunk.forEach((b, i) => {
      if (polished[i]) letters[b.branchKey] = polished[i]!.slice(0, 2200)
    })
  }

  const polishStates = states.filter((st) => st.submitted).slice(0, 6)
  const stateBits = await Promise.all(
    polishStates.map((st) =>
      callBoardLlm(
        'You write a short state-level security conclusion for HDFC Bank in India. Client-facing. Name each independent city separately (Nellore is not Tada; Chennai is not Puducherry; Vizag is not Kakinada). 90–140 words.',
        `Compile this state from the branch packs.\n${conclusions[st.state]}\n\nBranch letters:\n${st.branches
          .map((b) => letters[b.branchKey] || '')
          .filter(Boolean)
          .join('\n---\n')}`,
      ),
    ),
  )
  polishStates.forEach((st, i) => {
    if (stateBits[i]) conclusions[st.state] = stateBits[i]!.slice(0, 2200)
  })

  const pack: HdfcSsaBoardAiPack = {
    updatedAt: new Date().toISOString(),
    letters,
    conclusions,
  }
  await saveHdfcSsaBoardAi(pack)
  return { pack, sitesFilled }
}
