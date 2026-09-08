/** Default 10 optional Post Training Test MCQs — one-tap answers, auto marks. */

export type GuardsLinkQuestion = {
  id: string
  text: string
  options: { key: 'A' | 'B' | 'C' | 'D'; label: string }[]
  correct: 'A' | 'B' | 'C' | 'D'
}

export const DEFAULT_GUARDS_LINK_QUESTIONS: GuardsLinkQuestion[] = [
  {
    id: 'q1',
    text: 'On finding an unlocked door at a client site, a guard should first:',
    options: [
      { key: 'A', label: 'Ignore it if the area looks quiet' },
      { key: 'B', label: 'Secure / report as per site SOP and inform control' },
      { key: 'C', label: 'Leave the post to search the whole building alone' },
      { key: 'D', label: 'Wait until the end of the shift' },
    ],
    correct: 'B',
  },
  {
    id: 'q2',
    text: 'Visitor entry without a valid pass or approval should be:',
    options: [
      { key: 'A', label: 'Allowed if the visitor is polite' },
      { key: 'B', label: 'Stopped and handled as per access-control SOP' },
      { key: 'C', label: 'Ignored during busy hours' },
      { key: 'D', label: 'Decided by the visitor' },
    ],
    correct: 'B',
  },
  {
    id: 'q3',
    text: 'In a fire / emergency alarm, the first priority is:',
    options: [
      { key: 'A', label: 'Collect personal belongings' },
      { key: 'B', label: 'Follow emergency SOP — alert, guide, and keep exits clear' },
      { key: 'C', label: 'Switch off all lights only' },
      { key: 'D', label: 'Leave without informing anyone' },
    ],
    correct: 'B',
  },
  {
    id: 'q4',
    text: 'A guard’s ID card / uniform must be:',
    options: [
      { key: 'A', label: 'Worn properly and kept valid while on duty' },
      { key: 'B', label: 'Optional on night shift' },
      { key: 'C', label: 'Shared with another guard if needed' },
      { key: 'D', label: 'Left at home for safety' },
    ],
    correct: 'A',
  },
  {
    id: 'q5',
    text: 'If a suspicious package is found, the guard should:',
    options: [
      { key: 'A', label: 'Open it to check contents' },
      { key: 'B', label: 'Kick it aside' },
      { key: 'C', label: 'Not touch it — cordon / report as per SOP' },
      { key: 'D', label: 'Take it to the office desk' },
    ],
    correct: 'C',
  },
  {
    id: 'q6',
    text: 'Handing over at shift change should include:',
    options: [
      { key: 'A', label: 'Keys, pending issues, and site instructions' },
      { key: 'B', label: 'Only saying “OK” and leaving' },
      { key: 'C', label: 'Nothing if the next guard is late' },
      { key: 'D', label: 'Deleting the occurrence book' },
    ],
    correct: 'A',
  },
  {
    id: 'q7',
    text: 'Mobile phone use at post should be:',
    options: [
      { key: 'A', label: 'Unlimited for personal calls' },
      { key: 'B', label: 'As per site / company policy — duty first' },
      { key: 'C', label: 'Allowed while walking patrols only for games' },
      { key: 'D', label: 'Compulsory for social media updates' },
    ],
    correct: 'B',
  },
  {
    id: 'q8',
    text: 'An incident (theft, fight, accident) must be:',
    options: [
      { key: 'A', label: 'Hidden to avoid trouble' },
      { key: 'B', label: 'Reported promptly with facts as per SOP' },
      { key: 'C', label: 'Discussed only with friends' },
      { key: 'D', label: 'Written next month' },
    ],
    correct: 'B',
  },
  {
    id: 'q9',
    text: 'Patrolling means:',
    options: [
      { key: 'A', label: 'Sitting only at the gate all night' },
      { key: 'B', label: 'Checking assigned areas as per route and timing' },
      { key: 'C', label: 'Leaving the site for tea without informing' },
      { key: 'D', label: 'Watching TV in the pantry' },
    ],
    correct: 'B',
  },
  {
    id: 'q10',
    text: 'Confidential client information should be:',
    options: [
      { key: 'A', label: 'Shared on WhatsApp groups freely' },
      { key: 'B', label: 'Kept confidential — only shared with authorised persons' },
      { key: 'C', label: 'Posted on social media' },
      { key: 'D', label: 'Told to visitors for goodwill' },
    ],
    correct: 'B',
  },
]

export function scoreGuardsAnswers(
  answers: { qId: string; choice: string }[],
  questions: GuardsLinkQuestion[] = DEFAULT_GUARDS_LINK_QUESTIONS,
): { score: number; maxScore: number } {
  const map = new Map(answers.map((a) => [a.qId, String(a.choice || '').toUpperCase()]))
  let score = 0
  for (const q of questions) {
    if (map.get(q.id) === q.correct) score += 1
  }
  return { score, maxScore: questions.length }
}

/** Public payload — no correct answers. */
export function publicQuestions(questions: GuardsLinkQuestion[] = DEFAULT_GUARDS_LINK_QUESTIONS) {
  return questions.map((q) => ({
    id: q.id,
    text: q.text,
    options: q.options,
  }))
}
