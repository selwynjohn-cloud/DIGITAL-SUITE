import { suiteApps, type SuiteApp } from '../data/apps'
import type { AuthRole } from './auth'

export function getDeepLinkPortal(): { app: SuiteApp; role: AuthRole } | null {
  if (typeof window === 'undefined') return null
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/')[0]
  if (!slug) return null
  const portal = new URLSearchParams(window.location.search).get('portal')
  if (portal !== 'staff' && portal !== 'management') return null
  const app = suiteApps.find((a) => a.id === slug)
  if (!app || app.external) return null
  return { app, role: portal }
}
