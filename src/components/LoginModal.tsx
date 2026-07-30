import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  canUseEmailLogin,
  formatLoginLabel,
  requestPin,
  verifyPin,
} from '../lib/auth'

export function LoginModal() {
  const { pending, closeLogin, completeLogin, openPortal } = useAuth()
  const [contact, setContact] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [pin, setPin] = useState('')
  const [step, setStep] = useState<'contact' | 'pin'>('contact')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    if (!pending) {
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
    if (!canUseEmailLogin(contact)) {
      setError(`Use your official company email ending with @${domain}`)
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
        contact,
        pending.role,
        pending.app.id,
        pending.app.title,
      )
      setIdentifier(result.identifier)
      setStep('pin')
      setInfo(result.message)
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
      const result = await verifyPin(identifier, pin, pending.role, pending.app.id)
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

        {step === 'contact' ? (
          <div className="space-y-4">
            <label className="block text-sm text-slate-300">
              Work email (@{domain})
              <input
                type="email"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={`name@${domain}`}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-600"
                autoComplete="email"
              />
            </label>

            <p className="text-xs text-slate-500">
              A 6-digit PIN is sent to your email (valid 15 minutes). Check spam if you do not see it.
            </p>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="button"
              disabled={loading}
              onClick={handleSendPin}
              className="app-tap-btn w-full rounded-xl bg-[#c9a84c] py-3 font-semibold text-slate-950 shadow-sm hover:bg-[#e8d5a3] disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send PIN to email'}
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
              6-digit PIN from your email
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
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
