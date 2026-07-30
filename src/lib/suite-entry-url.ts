/** Command Centre opens a fresh sign-in screen — protects data from leftover sessions. */
export function withSuiteEntry(url: string, role: 'staff' | 'management'): string {
  if (!url || url.includes('facebook.com') || url.includes('linkedin.com') || url.includes('codewords.run')) {
    return url
  }
  if (url.startsWith('/')) {
    const [pathPart, queryPart] = url.split('?')
    const path = pathPart.replace(/\/+$/, '') || '/'
    const params = new URLSearchParams(queryPart ?? '')
    params.set('fresh', '1')
    params.set('suite_role', role)
    const qs = params.toString()
    return qs ? `${path}?${qs}` : `${path}?fresh=1&suite_role=${role}`
  }
  const sep = url.includes('?') ? '&' : '?'
  let target = `${url}${sep}suite_role=${role}`
  if (url.includes('script.google.com')) {
    target += '&fresh=1'
  }
  return target
}
