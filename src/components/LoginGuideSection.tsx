import { suiteAccessNote } from '../data/login-guide'

export function LoginGuideSection() {
  return (
    <section className="mt-12 rounded-2xl border border-[#c9a84c]/25 bg-slate-900/40 p-6">
      <div>
        <h2 className="text-xl font-semibold text-white sm:text-2xl">How to log in</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">{suiteAccessNote}</p>
      </div>

      <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/50 p-4 text-sm text-slate-300">
        <p className="font-semibold text-white">For your team</p>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-slate-400">
          <li>
            Open <strong className="text-slate-200">www.agilegroup-digital.co.in</strong> and click
            your app.
          </li>
          <li>
            Choose <strong className="text-slate-200">Email OTP</strong> (official{' '}
            <strong className="text-slate-200">@agilegroup.co.in</strong> email) or{' '}
            <strong className="text-slate-200">SMS OTP</strong> (your registered mobile number).
          </li>
          <li>
            Tap <strong className="text-slate-200">Send OTP</strong>, enter the 6-digit code, then
            tap <strong className="text-slate-200">Verify & enter</strong>.
          </li>
          <li>
            Some apps may ask you to sign in again inside the app — that is normal. Do not share
            OTPs in WhatsApp or email.
          </li>
          <li>
            <strong className="text-slate-200">Agile Mobile (Work360)</strong> opens directly — use
            the login HR/IT gave you inside that app.
          </li>
          <li>
            If you are not registered yet, contact your branch head or Management.
          </li>
        </ul>
      </div>
    </section>
  )
}
