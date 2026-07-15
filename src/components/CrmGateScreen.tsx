import { useState } from 'react'
import { AgileLogo } from './AgileLogo'
import { crmGoogleLoginUrl, type CrmGateRole } from '../lib/crm-gate'
import { canUseEmailLogin, requestPin, verifyPin } from '../lib/auth'

type Props = {
  role: CrmGateRole
}

export function CrmGateScreen({ role }: Props) {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const roleLabel = role === 'management' ? 'Management' : 'HODs / Staff'

  const goToCrmLogin = () => {
    window.location.href = crmGoogleLoginUrl(role)
  }

  const sendOtp = async () => {
    setError('')
    setInfo('')
    const em = email.trim()
    if (!canUseEmailLogin(em)) {
      setError('Use your @agilegroup.co.in work email only.')
      return
    }
    setLoading(true)
    try {
      const result = await requestPin(em, role, 'crm', 'Agile CRM')
      setIdentifier(result.identifier)
      setStep('otp')
      setInfo(result.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send email OTP')
    } finally {
      setLoading(false)
    }
  }

  const verify = async () => {
    setError('')
    if (otp.length !== 6) {
      setError('Enter the 6-digit OTP from your email.')
      return
    }
    setLoading(true)
    try {
      await verifyPin(identifier || email.trim().toLowerCase(), otp, role, 'crm')
      goToCrmLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wrong or expired OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh bg-[#08080c] px-6 py-10">
      <div className="mx-auto max-w-md text-center">
        <AgileLogo />
        <p className="mt-6 text-xs font-semibold tracking-[0.2em] text-[#c9a84c]">
          AGILE CRM · {roleLabel.toUpperCase()}
        </p>
        <h1 className="mt-3 text-2xl font-bold text-white">Sign in first</h1>
        <p className="mt-2 text-sm text-slate-400">
          Email OTP for everyone — Director, Management, and Staff.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-md rounded-2xl border border-[#c9a84c]/30 bg-[#0f1018] p-6 shadow-2xl">
        {step === 'email' && (
          <div className="space-y-4">
            <label className="block text-sm text-slate-300">
              Work email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@agilegroup.co.in"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-[#c9a84c]"
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="button"
              disabled={loading || !email.includes('@')}
              onClick={() => void sendOtp()}
              className="w-full rounded-xl bg-[#c9a84c] py-3 font-semibold text-slate-950 disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send OTP to email'}
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-4">
            {info && <p className="text-sm text-slate-400">{info}</p>}
            <label className="block text-sm text-slate-300">
              6-digit OTP
              <input
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-center text-xl tracking-widest text-white outline-none focus:border-[#c9a84c]"
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="button"
              disabled={loading || otp.length !== 6}
              onClick={() => void verify()}
              className="w-full rounded-xl bg-[#c9a84c] py-3 font-semibold text-slate-950 disabled:opacity-50"
            >
              {loading ? 'Checking…' : 'Continue to Agile CRM'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('email')
                setOtp('')
                setError('')
              }}
              className="w-full text-sm text-[#c9a84c]"
            >
              Change email
            </button>
          </div>
        )}

        <a href="/" className="mt-6 block text-center text-sm text-slate-500 hover:text-white">
          ← Back to Command Centre
        </a>
      </div>
    </div>
  )
}
