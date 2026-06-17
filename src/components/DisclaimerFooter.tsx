import { disclaimerText } from '../data/apps'
import { commandCentreHelpDeskDisplay, commandCentreHelpDeskTel } from '../data/contact'

export function DisclaimerFooter() {
  return (
    <section className="mx-auto mt-10 max-w-6xl rounded-2xl border border-amber-500/20 bg-[#0f0f14] px-6 py-6 text-center">
      <div className="flex flex-col items-center">
        <span className="text-2xl" aria-hidden>
          ⚠️
        </span>
        <h3 className="mt-3 text-sm font-semibold text-amber-400">
          Authorised User Notice & Disclaimer
        </h3>
        <p className="mx-auto mt-3 max-w-3xl whitespace-pre-line text-xs leading-relaxed text-slate-400">
          {disclaimerText}
        </p>
      </div>
      <div className="mt-6 border-t border-white/10 pt-4 text-center">
        <a
          href={commandCentreHelpDeskTel}
          className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-300 transition hover:bg-sky-500/20"
        >
          <span aria-hidden>📞</span>
          {commandCentreHelpDeskDisplay}
        </a>
      </div>
      <div className="mt-4 text-center text-xs text-slate-500">
        <p>agilegroup-digital.co.in · Agile Security Force Private Limited</p>
        <p className="mt-1">© {new Date().getFullYear()} All rights reserved.</p>
      </div>
    </section>
  )
}
