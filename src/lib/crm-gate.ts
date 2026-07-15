const CRM_EXEC =
  'https://script.google.com/macros/s/AKfycbz_UyonvAFhyxtI1dLfUKCOxzUjW7fhFOjeyB5xThIQPsIo_vjoaAzOGVs9CNMwWcA/exec'

export type CrmGateRole = 'staff' | 'management'

export function getCrmGateRole(): CrmGateRole | null {
  if (typeof window === 'undefined') return null
  const path = window.location.pathname.replace(/\/+$/, '')
  if (path !== '/crm') return null
  const role = new URLSearchParams(window.location.search).get('suite_role')
  if (role === 'staff' || role === 'management') return role
  return 'management'
}

export function crmGoogleLoginUrl(role: CrmGateRole) {
  const sep = CRM_EXEC.includes('?') ? '&' : '?'
  return `${CRM_EXEC}${sep}suite_role=${role}&fresh=1`
}
