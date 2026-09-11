/* Command Centre — install as a Mac/phone app. Do not cache pages (keeps login and apps fresh). */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
