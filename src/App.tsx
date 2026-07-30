import { AgileLogo } from './components/AgileLogo'
import { AppCard } from './components/AppCard'
import { AppPortalLanding } from './components/AppPortalLanding'
import { DisclaimerFooter } from './components/DisclaimerFooter'
import { ProfitabilityLaunch } from './components/ProfitabilityLaunch'
import { suiteApps } from './data/apps'
import { companyWebsiteDisplay, companyWebsiteTagline, companyWebsiteUrl } from './data/contact'
import { getDeepLinkPortal } from './lib/portal-link'

function CommandCentreHub() {
  return (
    <div className="min-h-svh bg-[#08080c]">
      <header className="px-6 pb-4 pt-10 text-center sm:pt-14">
        <AgileLogo />

        <p
          className="mx-auto mt-6 max-w-4xl text-base font-semibold tracking-[0.2em] text-[#c9a84c] sm:text-lg md:text-xl lg:text-2xl"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          AGILE SECURITY FORCE PRIVATE LIMITED
        </p>

        <h1 className="mx-auto mt-4 max-w-5xl text-center text-2xl font-bold leading-tight whitespace-nowrap sm:text-3xl md:text-4xl lg:text-5xl">
          <span className="text-white">Digital Operations </span>
          <span className="text-[#c9a84c]">Command Centre</span>
        </h1>

        <p className="mx-auto mt-5 max-w-4xl px-2 text-center text-[10px] font-bold uppercase leading-relaxed tracking-wide text-red-500 sm:text-xs md:text-sm">
          This site is intended for the exclusive use of Agile group staff and authorised
          personnel.
          <br />
          Unauthorised access is strictly prohibited.
        </p>

        <p className="mx-auto mt-5 max-w-3xl text-center text-base text-slate-300 sm:text-lg">
          {companyWebsiteTagline}{' '}
          <a
            href={companyWebsiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#c9a84c] underline decoration-[#c9a84c]/50 underline-offset-4 hover:text-[#e2c97e]"
          >
            {companyWebsiteDisplay}
          </a>
        </p>

        <p className="mx-auto mt-2 max-w-3xl text-center text-sm italic text-slate-400 sm:text-base">
          To join our team, explore active openings at{' '}
          <a
            href="https://www.securityjob.co.in"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold not-italic text-[#c9a84c] underline decoration-[#c9a84c]/50 underline-offset-4 hover:text-[#e2c97e]"
          >
            SecurityJob.co.in
          </a>
        </p>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16 pt-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            Integrated Application Suite
          </h2>
          <div className="mx-auto mt-3 h-0.5 w-24 bg-[#c9a84c]" />
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

function isProfitabilityPath() {
  if (typeof window === 'undefined') return false
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/')[0]
  return slug === 'profitability'
}

export default function App() {
  if (isProfitabilityPath()) {
    return <ProfitabilityLaunch />
  }

  const deepLink = getDeepLinkPortal()
  if (deepLink) {
    return <AppPortalLanding app={deepLink.app} role={deepLink.role} />
  }

  return (
    <>
      <CommandCentreHub />
    </>
  )
}
