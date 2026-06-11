import type { SuiteApp } from '../data/apps'
import type { AuthRole } from '../lib/auth'

type Props = {
  app: SuiteApp
  role: AuthRole
}

export function AppPortalLanding({ app, role }: Props) {
  const roleLabel = role === 'staff' ? 'HODs / Staff' : 'Management'

  return (
    <div className="min-h-svh bg-[#08080c]">
      <header
        className="border-b border-slate-800 px-6 py-4"
        style={{ borderTopColor: app.color, borderTopWidth: 4 }}
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.2em] text-[#c9a84c]">APP {app.number}</p>
            <h1 className="text-2xl font-bold text-white">{app.title}</h1>
            <p className="text-sm text-slate-400">{roleLabel} portal</p>
          </div>
          <a
            href="/"
            className="rounded-lg bg-[#c9a84c] px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-[#e8d5a3]"
          >
            ← Command Centre
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div
          className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center"
          style={{ boxShadow: `0 0 0 1px ${app.color}33` }}
        >
          <p className="text-sm font-medium text-[#c9a84c]">Agile Digital Suite</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Welcome to {app.title}</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-slate-400">{app.tagline}</p>
          <div className="mt-8 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
            ✓ {roleLabel} portal — modules rolling out
          </div>
        </div>
      </main>
    </div>
  )
}
