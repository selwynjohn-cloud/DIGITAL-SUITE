const HDFC_SSA_PUBLIC = 'https://www.agilegroup-digital.co.in/mis-hdfc-survey'

export type HdfcBranchRemindRow = {
  company: string
  location: string
  status: string
  pages: string
  surveyedBy: string
}

export function buildHdfcBranchRemindEmail(input: {
  branchName: string
  submitted: number
  totalSites: number
  incomplete: HdfcBranchRemindRow[]
  waitingForward: number
  note: string
  actorEmail: string
}): { subject: string; text: string } {
  const siteLines =
    input.incomplete.length > 0
      ? input.incomplete.map((row) => {
          const title = row.location && row.location !== '—' ? row.location : row.company || 'Site'
          return `- ${title} · ${row.status} · pages ${row.pages} · ${row.surveyedBy || '—'}`
        })
      : ['- No incomplete drafts on file. Please start the HDFC SSA and Submit to HOD (all 15 pages).']
  const waitLine =
    input.waitingForward > 0
      ? `Submitted, waiting HOD Forward for Approval: ${input.waitingForward}`
      : ''
  const noteBlock = input.note.trim()
    ? [`--- Management review / suggestion ---`, input.note.trim(), ``]
    : []
  const text = [
    `Dear Team,`,
    ``,
    `Management reminder: please complete the HDFC Site Security Assessment (SSA) for this branch and Submit to HOD (all 15 pages).`,
    ``,
    `Branch: ${input.branchName}`,
    `Submitted / Total HDFC sites: ${input.submitted} / ${input.totalSites}`,
    `Incomplete (not submitted): ${input.incomplete.length}`,
    waitLine,
    ``,
    `--- Incomplete / not submitted ---`,
    ...siteLines,
    ``,
    ...noteBlock,
    `Public form: ${HDFC_SSA_PUBLIC}`,
    `Open Agile MIS → HOD portal → Site Security Assessment (SSA) → HDFC SSA.`,
    ``,
    `Reminder sent by: ${input.actorEmail}`,
    ``,
    `Regards,`,
    `Agile MIS — Site Security Assessment (SSA)`,
  ]
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n')
  return {
    subject: `[Reminder] HDFC Site Security Assessment (SSA) — ${input.branchName}`,
    text,
  }
}
