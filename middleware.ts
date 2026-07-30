export const config = { matcher: '/:path*' }

/**
 * Host-based routing:
 * - agilegroup-digital*.vercel.app → official site (login cookies need co.in)
 * - securityjob.co.in → SecurityJob site
 */
export default function middleware(request: Request) {
  const host = (request.headers.get('host') || '').toLowerCase().split(':')[0]
  const url = new URL(request.url)

  if (host.includes('agilegroup-digital') && host.endsWith('.vercel.app')) {
    url.hostname = 'www.agilegroup-digital.co.in'
    url.protocol = 'https:'
    return Response.redirect(url.toString(), 308)
  }

  if (host === 'agilegroup-digital.co.in') {
    url.hostname = 'www.agilegroup-digital.co.in'
    url.protocol = 'https:'
    return Response.redirect(url.toString(), 308)
  }

  const isSecurityJob = host === 'securityjob.co.in' || host === 'www.securityjob.co.in'

  if (isSecurityJob) {
    let dest = ''
    if (url.pathname === '/') dest = '/api/securityjob/site'
    else if (url.pathname === '/admin' || url.pathname === '/admin/') dest = '/api/securityjob/admin'
    if (dest) {
      url.pathname = dest
      return new Response(null, { headers: { 'x-middleware-rewrite': url.toString() } })
    }
  }

  return new Response(null, { headers: { 'x-middleware-next': '1' } })
}
