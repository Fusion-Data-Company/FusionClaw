'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'

  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLocal, setIsLocal] = useState(false)

  useEffect(() => {
    // If we're on localhost, no auth required — bounce straight in.
    if (typeof window !== 'undefined') {
      const host = window.location.host
      const local =
        host.startsWith('localhost:') ||
        host === 'localhost' ||
        host.startsWith('127.0.0.1:') ||
        host === '127.0.0.1'
      setIsLocal(local)
      if (local) {
        router.replace(next)
      }
    }
  }, [router, next])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Invalid password')
        return
      }
      router.replace(next)
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Localhost — render nothing while we redirect.
  if (isLocal) return null

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-bg px-4"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 50% 30%, rgba(59,130,246,0.08) 0%, transparent 55%)',
      }}
    >
      <div className="w-full max-w-md space-y-8">
        {/* Logo + Branding */}
        <div className="flex flex-col items-center">
          <div
            className="w-20 h-20 rounded-2xl overflow-hidden mb-4"
            style={{ boxShadow: '0 0 40px rgba(59,130,246,0.12)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/fusionclaw-logo.png"
              alt="FusionClaw"
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
          <h1
            className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            FusionClaw
          </h1>
          <p className="text-sm text-text-muted mt-1">Enter your owner password</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-white/10 bg-[#0D0D0D]/80 backdrop-blur-xl p-6 space-y-4"
        >
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-text-muted mb-2">
              Owner password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-3 rounded-lg bg-[#050505] border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-blue-500/40 transition-colors"
              placeholder="••••••••••"
            />
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !password}
            className="w-full h-11 rounded-lg bg-blue-500 hover:bg-blue-400 disabled:bg-blue-500/40 disabled:cursor-not-allowed text-black font-semibold text-sm transition-colors"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-[11px] text-text-muted text-center pt-2">
            FusionClaw is self-hosted. Your password lives in your own <code className="text-cyan-400">OWNER_PASSWORD</code> env
            var. We don&apos;t store it. We don&apos;t track you.
          </p>
        </form>
      </div>
    </div>
  )
}
