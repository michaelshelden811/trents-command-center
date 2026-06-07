'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const C = {
  bg: '#020408', bg2: '#060d12', bg3: '#0a1520',
  cyan: '#00f5ff', green: '#39ff14', pink: '#ff2d78',
  tb: '#a0d8e8', tm: '#5a8a9a', td: '#2a4a5a',
  borderCyan: 'rgba(0,245,255,0.18)',
}
const mono = "'Share Tech Mono', monospace"
const orb = "'Orbitron', monospace"

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const redirectTo = process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      : `${window.location.origin}/auth/callback`

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })

    if (authError) {
      setError(authError.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;500;700&display=swap');`}</style>

      <div style={{ width: 360, background: C.bg2, border: `1px solid ${C.borderCyan}`, padding: 32, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)` }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)` }} />

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: orb, fontSize: 14, fontWeight: 700, color: C.cyan, letterSpacing: '0.15em', textShadow: `0 0 12px rgba(0,245,255,0.6)`, marginBottom: 4 }}>
            TRENT<span style={{ color: C.green, textShadow: `0 0 10px rgba(57,255,20,0.6)` }}> //</span> CC
          </div>
          <div style={{ fontSize: 9, color: C.td, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Command Center · Operator Access</div>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, color: C.green, marginBottom: 12, textShadow: `0 0 8px ${C.green}` }}>⬡</div>
            <div style={{ fontSize: 11, color: C.tm, lineHeight: 1.6 }}>Access link sent to<br /><span style={{ color: C.cyan }}>{email}</span></div>
            <div style={{ fontSize: 9, color: C.td, marginTop: 10, letterSpacing: '0.06em' }}>CHECK YOUR INBOX · LINK EXPIRES IN 1 HOUR</div>
          </div>
        ) : (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 8, color: C.td, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>OPERATOR EMAIL</div>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                style={{ width: '100%', background: C.bg3, border: `1px solid ${C.borderCyan}`, padding: '8px 10px', fontFamily: mono, fontSize: 11, color: C.tb, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {error && (
              <div style={{ fontSize: 9, color: C.pink, letterSpacing: '0.06em' }}>⚠ {error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              style={{ padding: '9px', border: `1px solid rgba(57,255,20,0.5)`, background: 'transparent', fontFamily: mono, fontSize: 10, color: C.green, cursor: 'pointer', letterSpacing: '0.1em', boxShadow: '0 0 8px rgba(57,255,20,0.15)', textTransform: 'uppercase' }}
            >
              {loading ? 'SENDING...' : 'SEND ACCESS LINK ↗'}
            </button>

            <div style={{ fontSize: 8, color: C.td, textAlign: 'center', letterSpacing: '0.06em', lineHeight: 1.5 }}>
              Magic link sent to your email.<br />No password required.
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
