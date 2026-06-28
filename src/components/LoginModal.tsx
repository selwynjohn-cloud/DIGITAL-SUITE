import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  canUseEmailLogin,
  formatLoginLabel,
  isValidMobile,
  requestPin,
  verifyPin,
} from '../lib/auth'

type LoginChannel = 'email' | 'sms'

export function LoginModal() {
  const { pending, closeLogin, completeLogin, openPortal } = useAuth()
  const [channel, setChannel] = useState<LoginChannel>('email')
  const [contact, setContact] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [pin, setPin] = useState('')
  const [step, setStep] = useState<'contact' | 'pin'>('contact')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    if (!pending) {
      setChannel('email')
      setContact('')
      setIdentifier('')
      setPin('')
      setStep('contact')
      setError('')
      setInfo('')
    }
  }, [pending])

  if (!pending) return null

  const roleLabel = pending.role === 'staff' ? 'HODs / Staff' : 'Management'
  const domain = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN ?? 'agilegroup.co.in'

  const validateContact = () => {
    if (channel === 'email') {
      if (!canUseEmailLogin(contact)) {
        setError(`Use your company email ending with @${domain}, or your registered Director email`)
        return false
      }
    } else if (!isValidMobile(contact)) {
      setError('Enter your 10-digit mobile number (India)')
      return false
    }
    return true
  }

  const handleSendPin = async () => {
    setError('')
    setInfo('')
    if (!validateContact()) return

    setLoading(true)
    try {
      const result = await requestPin(
        channel,
        contact,
        pending.role,
        pending.app.id,
        pending.app.title,
      )
      setIdentifier(result.identifier)
      setStep('pin')
      setInfo(result.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setError('')
    if (pin.length !== 6) {
      setError('Enter the 6-digit OTP')
      return
    }
    setLoading(true)
    try {
      const result = await verifyPin(identifier, pin, pending.role, pending.app.id)
      completeLogin({
        email: result.session.email,
        role: result.session.role,
        appId: result.session.appId,
        token: result.token,
      })
      openPortal(pending)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-2xl border border-[#c9a84c]/30 bg-[#0f1018] p-6 shadow-2xl"
        role="dialog"
        aria-labelledby="login-title"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium tracking-[0.2em] text-[#c9a84c]">
              SECURE ACCESS
            </p>
            <h2 id="login-title" className="mt-1 text-xl font-bold text-white">
              {pending.app.title}
            </h2>
            <p className="mt-1 text-sm text-slate-400">{roleLabel} portal</p>
          </div>
          <button
            type="button"
            onClick={closeLogin}
            className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-800 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {step === 'contact' ? (
          <div className="space-y-4">
            <div className="flex rounded-xl border border-slate-700 bg-slate-900 p-1">
              <button
                type="button"
                onClick={() => {
                  setChannel('email')
                  setError('')
                }}
                className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                  channel === 'email'
                    ? 'bg-[#c9a84c] text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Email OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setChannel('sms')
                  setError('')
                }}
                className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                  channel === 'sms'
                    ? 'bg-[#c9a84c] text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                SMS OTP
              </button>
            </div>

            {channel === 'email' ? (
              <label className="block text-sm text-slate-300">
                Email address
                <input
                  type="email"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={`name@${domain}`}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-600"
                  autoComplete="email"
                />
              </label>
            ) : (
              <label className="block text-sm text-slate-300">
                Mobile number
                <input
                  type="tel"
                  inputMode="numeric"
                  value={contact}
                  onChange={(e) => setContact(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-600"
                  autoComplete="tel"
                />
              </label>
            )}

            <p className="text-xs text-slate-500">
              A 6-digit OTP will be sent {channel === 'email' ? 'to your email' : 'by SMS'}. Valid
              for 10 minutes. Same for Director, Management, and Staff.
            </p>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="button"
              disabled={loading}
              onClick={handleSendPin}
              className="app-tap-btn w-full rounded-xl bg-[#c9a84c] py-3 font-semibold text-slate-950 shadow-sm hover:bg-[#e8d5a3] disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Signing in as{' '}
              <span className="text-white">{formatLoginLabel(identifier)}</span>
            </p>
            {info && <p className="text-sm text-emerald-400">{info}</p>}
            <label className="block text-sm text-slate-300">
              6-digit OTP
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white"
                autoComplete="one-time-code"
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="button"
              disabled={loading}
              onClick={handleVerify}
              className="app-tap-btn w-full rounded-xl bg-[#c9a84c] py-3 font-semibold text-slate-950 shadow-sm hover:bg-[#e8d5a3] disabled:opacity-60"
            >
              {loading ? 'Verifying…' : 'Verify & enter'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('contact')
                setPin('')
                setIdentifier('')
                setError('')
                setInfo('')
              }}
              className="w-full text-sm text-slate-500 hover:text-slate-300"
            >
              Use a different email or mobile
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
