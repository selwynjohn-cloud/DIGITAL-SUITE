/**
 * Recruitment message formats — Thank you · Deployment order · Branch shortage mail.
 */

export function controlHelpdeskNumbers() {
  return {
    control: process.env.RECRUIT_CONTROL_MOBILE?.trim() || '18005995599',
    helpdesk: process.env.RECRUIT_HELPDESK_MOBILE?.trim() || '18005995599',
  }
}

export function buildRecruitThankYouText(opts: {
  name: string
  empId: string
  branch: string
  unit?: string
  omMobile?: string
  hodMobile?: string
}): string {
  const { control, helpdesk } = controlHelpdeskNumbers()
  return [
    'Agile Security Force — Thank You for Joining',
    '',
    `Dear ${opts.name},`,
    `Welcome to Agile. Your ID number is ${opts.empId}.`,
    `Branch: ${opts.branch}${opts.unit ? ' · Unit: ' + opts.unit : ''}`,
    '',
    `Control: ${control}`,
    `Help Desk: ${helpdesk}`,
    `OM mobile: ${opts.omMobile || '—'}`,
    `HOD mobile: ${opts.hodMobile || '—'}`,
    '',
    'Please save these numbers. Keep your mobile alarm on for duty calls.',
    'Agile Recruitment',
  ].join('\n')
}

export function buildDeployOrderFormatText(opts: {
  name: string
  empId: string
  branch: string
  unit: string
  location?: string
  mapsUrl?: string
  omMobile?: string
  hodMobile?: string
}): string {
  const { control, helpdesk } = controlHelpdeskNumbers()
  const loc = [opts.unit, opts.location].filter(Boolean).join(' — ')
  return [
    'Agile Security Force — Deployment Order',
    '',
    `Name: ${opts.name}`,
    `ID number: ${opts.empId}`,
    `Branch: ${opts.branch}`,
    `Location / Unit: ${loc || '—'}`,
    opts.mapsUrl ? `GPS / Directions: ${opts.mapsUrl}` : 'GPS / Directions: (see unit address)',
    '',
    `Control: ${control}`,
    `Help Desk: ${helpdesk}`,
    `OM mobile: ${opts.omMobile || '—'}`,
    `HOD mobile: ${opts.hodMobile || '—'}`,
    '',
    'Please keep your mobile alarm on and report as directed.',
    'Agile Recruitment',
  ].join('\n')
}

export function buildSecurityJobWhatsApp(opts: {
  kind: 'invite' | 'remind'
  name: string
  regCode: string
  centreCity: string
  mapsUrl: string
  helpDesk: string
  centralCommand: string
  tentativeJoinDate?: string
}): string {
  const name = String(opts.name || 'Candidate').trim() || 'Candidate'
  const doj = String(opts.tentativeJoinDate || '').slice(0, 10)
  const dojLabel = doj
    ? (() => {
        const p = doj.split('-')
        return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : doj
      })()
    : ''
  const lines = [
    `Namaste ${name},`,
    `Agile Security Force — you registered on Security Job (${opts.regCode || '—'}).`,
    '',
  ]
  if (opts.kind === 'remind' && dojLabel) {
    lines.push(`Reminder: please come on ${dojLabel} to join.`)
  } else {
    lines.push('We have a security job. Please come to our Recruitment Centre.')
  }
  lines.push(
    `Centre: ${opts.centreCity}`,
    `Map: ${opts.mapsUrl}`,
    '',
    'Please bring: Aadhaar, 2 photos, bank passbook / account details.',
    `Help Desk: ${opts.helpDesk}`,
    `Command: ${opts.centralCommand}`,
  )
  if (opts.kind === 'invite') {
    lines.push('', 'Please reply with the date you will come (tentative joining date).')
  } else {
    lines.push('', 'If you cannot come, please reply with a new date.')
  }
  return lines.join('\n')
}

export function buildSecurityNewsWhatsApp(opts: { name: string }): string {
  const name = String(opts.name || 'Candidate').trim() || 'Candidate'
  return [
    `Namaste ${name},`,
    'Thank you for answering the Security News question.',
    '',
    'Agile Security Force has security job openings.',
    'Please reply YES if you want to join. We will call you.',
    '',
    'Help Desk: 18005995599',
    'Apply also at www.securityjob.co.in',
    'Agile Recruitment',
  ].join('\n')
}

export function waUrl(mobile: string, text: string): string {
  const digits = String(mobile || '').replace(/\D/g, '')
  const phone = digits.length >= 10 ? (digits.length === 10 ? '91' + digits : digits) : ''
  const base = phone ? `https://wa.me/${phone}` : 'https://wa.me/'
  return `${base}?text=${encodeURIComponent(text)}`
}
