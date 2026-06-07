import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { isAgileEmail, requestPin, verifyPin } from '../lib/auth'

export function LoginModal() {
  const { pending, closeLogin, completeLogin, openPortal } = useAuth()
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [step, setStep] = useState<'email' | 'pin'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    if (!pending) {
      setEmail('')
      setPin('')
      setStep('email')
      setError('')
      setInfo('')
    }
  }, [pending])

  if (!pending) return null

  const roleLabel = pending.role === 'staff' ? 'HODs / Staff' : 'Management'
  const domain = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN ?? 'agilegroup.co.in'

  const handleSuperAdminPin = () => {
    setError('')
    setInfo('')
    if (!isAgileEmail(email)) {
      setError(`Use your company email ending with @${domain}`)
      return
    }
    setStep('pin')
    setPin('')
    setInfo('Super Admin: enter your Master PIN (no email sent).')
  }

  const handleSendPin = async () => {
    setError('')
    setInfo('')
    if (!isAgileEmail(email)) {
      setError(`Use your company email ending with @${domain}`)
      return
    }
    setLoading(true)
    try {
      const result = await requestPin(
        email,
        pending.role,
        pending.app.id,
        pending.app.title,
      )
      setStep('pin')
      setInfo(
        result.devPin
          ? `Development mode: your PIN is ${result.devPin}`
          : `PIN sent to ${email}. Check your inbox.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send PIN')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setError('')
    if (pin.length !== 6) {
      setError('Enter the 6-digit PIN from your email')
      return
    }
    setLoading(true)
    try {
      const result = await verifyPin(email, pin, {
        role: pending.role,
        appId: pending.app.id,
      })
      completeLogin({
        email: result.session.email,
        role: result.session.role,
        appId: result.session.appId,
        token: result.token,
      })
      openPortal(pending)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid PIN')
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

        {step === 'email' ? (
          <div className="space-y-4">
            <label className="block text-sm text-slate-300">
              Company email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`name@${domain}`}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-600"
                autoComplete="email"
              />
            </label>
            <p className="text-xs text-slate-500">
              A 6-digit PIN will be sent to your @agilegroup.co.in email. Valid for 10 minutes.
            </p>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="button"
              disabled={loading}
              onClick={handleSendPin}
              className="w-full rounded-xl bg-[#c9a84c] py-3 font-semibold text-slate-950 hover:bg-[#e8d5a3] disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send PIN to email'}
            </button>
            <button
              type="button"
              onClick={handleSuperAdminPin}
              className="w-full text-sm text-slate-400 hover:text-[#e8d5a3]"
            >
              Director — use Master PIN (no email)
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Signing in as <span className="text-white">{email}</span>
            </p>
            {info && <p className="text-sm text-emerald-400">{info}</p>}
            <label className="block text-sm text-slate-300">
              6-digit PIN
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
              className="w-full rounded-xl bg-[#c9a84c] py-3 font-semibold text-slate-950 hover:bg-[#e8d5a3] disabled:opacity-60"
            >
              {loading ? 'Verifying…' : 'Verify & enter'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('email')
                setPin('')
                setError('')
              }}
              className="w-full text-sm text-slate-500 hover:text-slate-300"
            >
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
