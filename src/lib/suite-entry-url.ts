/** When opening from Command Centre, apps must show their own login (not auto-restore saved session). */
export function withSuiteEntry(url: string, role: 'staff' | 'management'): string {
  if (!url || url.includes('facebook.com') || url.includes('linkedin.com') || url.includes('codewords.run')) {
    return url
  }
  if (url.startsWith('/')) {
    const path = url.split('?')[0].replace(/\/+$/, '') || '/'
    const entryPath = path === '/mis' ? '/mis/login' : path
    return `${entryPath}?fresh=1`
  }
  const sep = url.includes('?') ? '&' : '?'
  let target = `${url}${sep}suite_role=${role}`
  if (url.includes('script.google.com')) {
    target += '&fresh=1'
  }
  return target
}
