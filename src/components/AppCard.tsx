import { useCallback, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { SuiteApp } from '../data/apps'
import { withSuiteEntry } from '../lib/suite-entry-url'

type Props = {
  app: SuiteApp
}

const btnLight =
  'app-tap-btn w-full rounded-lg bg-white px-3 py-2.5 text-xs font-semibold text-slate-900 shadow-sm hover:bg-white/90 sm:text-sm'
const btnLightFlex =
  'app-tap-btn flex-1 rounded-lg bg-white/90 px-3 py-2.5 text-xs font-semibold text-slate-900 shadow-sm hover:bg-white sm:text-sm'
const btnDark =
  'app-tap-btn app-tap-btn--dark flex-1 rounded-lg px-3 py-2.5 text-xs font-semibold text-white shadow-sm hover:brightness-110 sm:text-sm'

export function AppCard({ app }: Props) {
  const { requestAccess } = useAuth()
  const [pressedKey, setPressedKey] = useState<string | null>(null)

  const open = useCallback(
    (url: string, role: 'staff' | 'management', key: string) => {
      setPressedKey(key)
      window.setTimeout(() => setPressedKey(null), 180)
      const targetUrl = withSuiteEntry(url, role)
      // Google apps + training: one login inside the app only (no Command Centre OTP)
      const skipHubLogin =
        app.external ||
        app.opensDirectly ||
        targetUrl.includes('script.google.com') ||
        targetUrl.includes('guard-training-app.vercel.app') ||
        targetUrl.includes('agilegroup-work360') ||
        ['mis', 'reviews', 'pulse', 'training', 'mobile', 'guards', 'recruitment', 'fleets', 'crm'].includes(app.id)
      if (app.external) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer')
        return
      }
      if (skipHubLogin) {
        window.location.href = targetUrl
        return
      }
      requestAccess(app, role, targetUrl)
    },
    [app, requestAccess],
  )

  const pressed = (key: string) => (pressedKey === key ? 'app-tap-btn--pressed' : '')

  return (
    <article
      className="relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl p-6 shadow-lg transition hover:scale-[1.01] hover:shadow-xl sm:min-h-[240px]"
      style={{ backgroundColor: app.color }}
    >
      <div className="relative z-10 flex justify-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-900 shadow">
          {app.number}
        </span>
      </div>

      <div className="relative z-10 mt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold leading-snug text-white sm:text-xl">
            {app.title}
          </h3>
          {app.status === 'live' && (
            <span className="shrink-0 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              Live
            </span>
          )}
          {app.status === 'coming-soon' && (
            <span className="shrink-0 rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-bold uppercase text-white/80">
              Coming Soon
            </span>
          )}
          {app.external && (
            <span className="shrink-0 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              External
            </span>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/90">{app.tagline}</p>
      </div>

      <div className="relative z-10 mt-5 flex flex-col gap-2">
        {app.status === 'coming-soon' ? (
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="app-tap-btn w-full cursor-not-allowed rounded-lg bg-white/20 px-3 py-2.5 text-xs font-semibold text-white/70 sm:text-sm"
          >
            Coming Soon
          </button>
        ) : app.id === 'training' && app.traineeUrl ? (
          <>
            <button
              type="button"
              onClick={() => open(app.traineeUrl!, 'staff', `${app.id}-trainee`)}
              className={`${btnLight} ${pressed(`${app.id}-trainee`)}`}
            >
              Trainees
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => open(app.staffUrl, 'staff', `${app.id}-staff`)}
                className={`${btnLightFlex} ${pressed(`${app.id}-staff`)}`}
              >
                Staff / Lecturer
              </button>
              <button
                type="button"
                onClick={() => open(app.managementUrl, 'management', `${app.id}-mgmt`)}
                className={`${btnDark} ${pressed(`${app.id}-mgmt`)}`}
                style={{ backgroundColor: app.buttonDark }}
              >
                Management
              </button>
            </div>
          </>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => open(app.staffUrl, 'staff', `${app.id}-staff`)}
              className={`${btnLightFlex} ${pressed(`${app.id}-staff`)}`}
            >
              HODs / Staff
            </button>
            <button
              type="button"
              onClick={() => open(app.managementUrl, 'management', `${app.id}-mgmt`)}
              className={`${btnDark} ${pressed(`${app.id}-mgmt`)}`}
              style={{ backgroundColor: app.buttonDark }}
            >
              Management
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
