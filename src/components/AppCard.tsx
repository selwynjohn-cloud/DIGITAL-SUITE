import { useAuth } from '../contexts/AuthContext'
import type { SuiteApp } from '../data/apps'

type Props = {
  app: SuiteApp
}

export function AppCard({ app }: Props) {
  const { requestAccess } = useAuth()

  const open = (url: string, role: 'staff' | 'management') => {
    requestAccess(app, role, url)
  }

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
          {app.external && (
            <span className="shrink-0 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              External
            </span>
          )}
          {app.usesOwnAuth && app.id === 'mis' && (
            <span className="shrink-0 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              Live MIS
            </span>
          )}
          {app.usesOwnAuth && app.id === 'crm' && (
            <span className="shrink-0 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              Live CRM
            </span>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/90">{app.tagline}</p>
      </div>

      <div className="relative z-10 mt-5 flex gap-2">
        <button
          onClick={() => open(app.staffUrl, 'staff')}
          className="flex-1 rounded-lg bg-white px-3 py-2.5 text-xs font-semibold text-slate-900 transition hover:bg-white/90 sm:text-sm"
        >
          HODs / Staff
        </button>
        <button
          onClick={() => open(app.managementUrl, 'management')}
          className="flex-1 rounded-lg px-3 py-2.5 text-xs font-semibold text-white transition hover:brightness-110 sm:text-sm"
          style={{ backgroundColor: app.buttonDark }}
        >
          Management
        </button>
      </div>
    </article>
  )
}
