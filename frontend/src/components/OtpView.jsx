import { useEffect, useRef, useState } from 'react'

const CODE_LENGTH = 6

/**
 * 6-digit OTP entry with auto-advance, paste support, resend countdown, and inline errors.
 *
 * Props:
 *  - challenge:   { challengeId, email, intent, expiresInSeconds, resendCooldownSeconds }
 *  - onVerify:    async (code) => void   — throws to display an error
 *  - onResend:    async () => void       — throws to display an error
 *  - onCancel:    () => void
 */
export default function OtpView({ challenge, onVerify, onResend, onCancel }) {
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''))
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(challenge?.resendCooldownSeconds ?? 60)
  const inputsRef = useRef([])

  // Focus first input on mount + when the challenge changes
  useEffect(() => {
    inputsRef.current[0]?.focus()
    setDigits(Array(CODE_LENGTH).fill(''))
    setError('')
    setInfo('')
    setCooldown(challenge?.resendCooldownSeconds ?? 60)
  }, [challenge?.challengeId])

  // Resend cooldown tick
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  const code = digits.join('')
  const complete = code.length === CODE_LENGTH && /^\d{6}$/.test(code)

  const updateDigit = (i, value) => {
    const v = value.replace(/\D/g, '').slice(0, 1)
    setDigits(prev => {
      const next = [...prev]
      next[i] = v
      return next
    })
    if (v && i < CODE_LENGTH - 1) inputsRef.current[i + 1]?.focus()
  }

  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault()
      inputsRef.current[i - 1]?.focus()
    } else if (e.key === 'ArrowRight' && i < CODE_LENGTH - 1) {
      e.preventDefault()
      inputsRef.current[i + 1]?.focus()
    } else if (e.key === 'Enter' && complete) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const onPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
    if (!pasted) return
    e.preventDefault()
    const next = Array(CODE_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setDigits(next)
    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1)
    inputsRef.current[focusIdx]?.focus()
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    if (!complete || busy) return
    setBusy(true)
    setError('')
    setInfo('')
    try {
      await onVerify(code)
    } catch (err) {
      const data = err.response?.data
      let msg = data?.error || err.message || 'Verification failed'
      if (data && typeof data.attemptsRemaining === 'number') {
        msg += ` — ${data.attemptsRemaining} attempt${data.attemptsRemaining === 1 ? '' : 's'} left`
      }
      setError(msg)
      // Clear digits + refocus so they can retry without manual selection
      setDigits(Array(CODE_LENGTH).fill(''))
      inputsRef.current[0]?.focus()
    } finally {
      setBusy(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || resending) return
    setResending(true)
    setError('')
    try {
      await onResend()
      setInfo('A new code was sent. Check your inbox.')
      setCooldown(challenge?.resendCooldownSeconds ?? 60)
      setDigits(Array(CODE_LENGTH).fill(''))
      inputsRef.current[0]?.focus()
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data.retryAfterSeconds === 'number') {
        setCooldown(data.retryAfterSeconds)
      }
      setError(data?.error || err.message || 'Could not resend the code')
    } finally {
      setResending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.5px', marginBottom: 8 }}>
        Check your email
      </h2>
      <p style={{ fontSize: 14, color: 'var(--body)', lineHeight: 1.5, marginBottom: 24 }}>
        We sent a 6-digit code to <strong style={{ color: 'var(--ink)' }}>{challenge.email}</strong>.
        It expires in 5 minutes.
      </p>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => (inputsRef.current[i] = el)}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={d}
            onChange={e => updateDigit(i, e.target.value)}
            onKeyDown={e => onKeyDown(i, e)}
            onPaste={onPaste}
            aria-label={`Digit ${i + 1} of 6`}
            disabled={busy}
            style={{
              width: 48, height: 56,
              textAlign: 'center',
              fontFamily: 'var(--font)',
              fontSize: 22, fontWeight: 700,
              color: 'var(--ink)',
              background: 'var(--canvas)',
              border: `1px solid ${error ? 'var(--negative)' : 'var(--ink)'}`,
              borderRadius: 'var(--radius)',
              outline: 'none',
              transition: 'box-shadow 0.15s, border-color 0.15s',
            }}
            onFocus={e => e.target.style.boxShadow = '0 0 0 3px var(--primary-pale)'}
            onBlur={e => e.target.style.boxShadow = 'none'}
          />
        ))}
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}
      {info && (
        <div style={{
          background: 'var(--primary-pale)', color: 'var(--positive-deep)',
          border: '1px solid var(--primary-neutral)',
          padding: '11px 16px', borderRadius: 'var(--radius)',
          fontSize: 14, fontWeight: 600, marginBottom: 12,
        }}>{info}</div>
      )}

      <button type="submit" className="auth-submit" disabled={!complete || busy}>
        {busy ? 'Verifying…' : 'Verify and continue'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, gap: 8 }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          style={{
            background: 'none', border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
            color: 'var(--mute)', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600,
            padding: '4px 0',
          }}
        >
          ← Use a different email
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending || busy}
          style={{
            background: 'none', border: 'none',
            cursor: (cooldown > 0 || resending || busy) ? 'not-allowed' : 'pointer',
            color: cooldown > 0 ? 'var(--mute)' : 'var(--positive-deep)',
            fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700,
            padding: '4px 0',
          }}
        >
          {resending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </form>
  )
}
