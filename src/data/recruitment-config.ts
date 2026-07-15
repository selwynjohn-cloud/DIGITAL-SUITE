/** Agile Recruitment (App 01) — dual portal + public apply form. */
export const agileRecruitment = {
  /** Staff / Management portal on agilegroup-digital.co.in */
  staffPortalUrl: '/recruitment/?portal=staff',
  managementPortalUrl: '/recruitment/?portal=management',
  /** Public form — WhatsApp groups, job posters (no login) */
  publicFormUrl: 'https://agile-recruitment.codewords.run/',
  googleSheetId: '1ltqmShB_vLGKmrsRTi8XIlDUyo7Da00PkDJVWyjtVG8',
  googleSheetUrl:
    'https://docs.google.com/spreadsheets/d/1ltqmShB_vLGKmrsRTi8XIlDUyo7Da00PkDJVWyjtVG8/edit',
  helpline: '18005995599',
} as const

export function recruitmentWhatsAppMessage() {
  return (
    'Agile Security Force — Register Your Interest\n\n' +
    agileRecruitment.publicFormUrl +
    '\n\nFor more details call ' +
    agileRecruitment.helpline
  )
}

export function recruitmentWhatsAppDeepLink() {
  return `https://wa.me/?text=${encodeURIComponent(recruitmentWhatsAppMessage())}`
}
