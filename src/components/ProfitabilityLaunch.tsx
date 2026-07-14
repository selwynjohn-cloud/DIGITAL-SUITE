import { useEffect, useMemo, useState } from 'react'
import { AgileLogo } from './AgileLogo'

const COMMAND_CENTRE = 'https://www.agilegroup-digital.co.in/'

function resolveProfitabilityBase(): string {
  const fromEnv = (import.meta.env.VITE_PROFITABILITY_URL as string | undefined)?.replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:5175'
  }
  return ''
}

function portalFromQuery(): 'accounts' | 'management' {
  const p = new URLSearchParams(window.location.search).get('portal')
  if (p === 'management') return 'management'
  // staff / accounts / default → Accounts portal
  return 'accounts'
}

/**
 * Bridge from Command Centre → Client & Branch Profitability app.
 * URL: /profitability/?portal=staff|management
 */
export function ProfitabilityLaunch() {
  const [base] = useState(() => resolveProfitabilityBase())
  const portal = useMemo(() => portalFromQuery(), [])
  const target = base ? `${base}/login/${portal}` : ''

  useEffect(() => {
    if (!target) return
    const t = window.setTimeout(() => {
      window.location.replace(target)
    }, 400)
    return () => window.clearTimeout(t)
  }, [target])

  return (
    <div className="min-h-svh bg-[#08080c] text-white">
      <header className="border-b border-slate-800 px-6 py-4" style={{ borderTop: '4px solid #0b3d6e' }}>
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.2em] text-[#c9a84c]">APP 19</p>
            <h1 className="text-xl font-bold sm:text-2xl">Client & Branch Profitability</h1>
            <p className="text-sm text-slate-400">
              Opening {portal === 'management' ? 'Management' : 'Accounts'} portal…
            </p>
          </div>
          <a
            href="/"
            className="rounded-lg bg-[#c9a84c] px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-[#e8d5a3]"
          >
            ← Command Centre
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 text-center">
        <AgileLogo />
        {target ? (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
            <p className="text-sm text-[#c9a84c]">Redirecting to Profitability</p>
            <p className="mt-2 break-all text-sm text-slate-300">{target}</p>
            <a
              href={target}
              className="mt-6 inline-block rounded-lg bg-[#0b3d6e] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110"
            >
              Continue now
            </a>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-left">
            <h2 className="text-lg font-semibold text-amber-200">Deployment URL not set</h2>
            <p className="mt-3 text-sm text-slate-300">
              Set <code className="text-[#c9a84c]">VITE_PROFITABILITY_URL</code> in the Command Centre
              Vercel project to your Profitability app URL (e.g. your Vercel / Railway host), then redeploy.
            </p>
            <p className="mt-3 text-sm text-slate-400">
              Local demo: run the Profitability app on port 5175 and open Command Centre on localhost — this
              bridge auto-targets http://localhost:5175.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`${COMMAND_CENTRE}`}
                className="rounded-lg bg-[#c9a84c] px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Back to Command Centre
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
