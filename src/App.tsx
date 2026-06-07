import { AgileLogo } from './components/AgileLogo'
import { AppCard } from './components/AppCard'
import { AppPortal } from './components/AppPortal'
import { DisclaimerFooter } from './components/DisclaimerFooter'
import { LoginModal } from './components/LoginModal'
import { useAuth } from './contexts/AuthContext'
import { companyBadges, suiteApps } from './data/apps'

function CommandCentreHub() {
  const { session, logout } = useAuth()
  const liveCount = suiteApps.filter((a) => a.status !== 'coming-soon').length

  return (
    <div className="min-h-svh bg-[#08080c]">
      <header className="px-6 pb-4 pt-10 text-center sm:pt-14">
        <AgileLogo />

        <p
          className="mx-auto mt-6 max-w-2xl text-xs tracking-[0.25em] text-[#c9a84c] sm:text-sm"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          AGILE SECURITY FORCE PRIVATE LIMITED
        </p>

        <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
          <span className="text-white">Digital Operations </span>
          <span className="text-[#c9a84c]">Command Centre</span>
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm text-slate-400">
          Select your application — sign in with your{' '}
          <strong className="text-slate-300">@agilegroup.co.in</strong> email. A PIN
          will be sent to your inbox.
        </p>

        {session && (
          <p className="mx-auto mt-3 max-w-xl text-xs text-emerald-400">
            Signed in as {session.email} ({session.role === 'staff' ? 'HODs / Staff' : 'Management'})
            {' · '}
            <button type="button" onClick={logout} className="underline hover:text-emerald-300">
              Sign out
            </button>
          </p>
        )}

        <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2">
          {companyBadges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-[#c9a84c]/40 bg-[#c9a84c]/5 px-3 py-1 text-[10px] font-medium text-[#e8d5a3] sm:text-xs"
            >
              {badge}
            </span>
          ))}
        </div>

        <p className="mt-5 text-[10px] font-medium tracking-widest text-red-500/90 sm:text-xs">
          UNAUTHORISED ACCESS IS STRICTLY PROHIBITED
        </p>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16 pt-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            Integrated Application Suite
          </h2>
          <div className="mx-auto mt-3 h-0.5 w-24 bg-[#c9a84c]" />
          <p className="mt-3 text-xs text-slate-500">
            {liveCount} live · {suiteApps.length} applications
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {suiteApps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>

        <DisclaimerFooter />
      </main>
    </div>
  )
}

export default function App() {
  const { activePortal } = useAuth()

  return (
    <>
      <LoginModal />
      {activePortal ? <AppPortal /> : <CommandCentreHub />}
    </>
  )
}
