import type { VercelRequest, VercelResponse } from '@vercel/node'

/** Old Command Centre files must not boot on securityjob.co.in. */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  return res.status(200).send(
    `try{if(navigator.serviceWorker){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister()});});}}catch(e){}
try{if(window.caches){caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k);});});}}catch(e){}
location.replace('/jobs');`,
  )
}
