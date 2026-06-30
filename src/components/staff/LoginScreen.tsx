'use client'

import { useState } from 'react'
import { Loader2, User, Lock } from 'lucide-react'
import type { Staff } from './types'

export default function LoginScreen({ onLogin }: { onLogin: (s: Staff) => void }) {
  const [name,     setName]     = useState('')
  const [password, setPassword] = useState('')
  const [busy,     setBusy]     = useState(false)
  const [err,      setErr]      = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('')
    const res  = await fetch('/api/staff/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, password }) })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) { setErr(data.error ?? 'Erreur'); return }
    onLogin(data)
  }

  const inp: React.CSSProperties = {
    width: '100%', border: '1.5px solid rgba(21,16,31,.12)', borderRadius: 14,
    padding: '14px 18px 14px 48px', fontSize: 16, outline: 'none',
    background: '#fff', color: '#15101F',
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#fff' }}>
      <div style={{ color: '#5B21B6', marginBottom: 24 }}>
        <svg viewBox="0 0 100 100" width="64" height="64" aria-hidden>
          <circle className="sp-ring" cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle className="sp-dot"  cx="50" cy="50" r="11" fill="currentColor" />
        </svg>
      </div>
      <h1 style={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', fontSize: 32, letterSpacing: '-0.02em', color: '#15101F', marginBottom: 4 }}>
        Fid<span style={{ color: '#5B21B6' }}>è</span>le
      </h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 40, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Espace serveur</p>

      <form onSubmit={submit} style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <User size={18} style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'rgba(21,16,31,.3)', pointerEvents: 'none' }} aria-hidden />
          <input type="text" placeholder="Votre nom" value={name} onChange={e => { setName(e.target.value); setErr('') }} style={inp} required autoFocus />
        </div>
        <div style={{ position: 'relative' }}>
          <Lock size={18} style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'rgba(21,16,31,.3)', pointerEvents: 'none' }} aria-hidden />
          <input type="password" placeholder="Mot de passe" value={password} onChange={e => { setPassword(e.target.value); setErr('') }} style={inp} required />
        </div>
        {err && <p style={{ fontSize: 13, color: '#EF4444', fontWeight: 500, padding: '0 4px' }}>{err}</p>}
        <button
          type="submit" disabled={busy}
          style={{ background: '#5B21B6', color: '#fff', borderRadius: 14, padding: '15px', fontSize: 16, fontWeight: 700, opacity: busy ? .6 : 1, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {busy ? <><Loader2 size={18} style={{ animation: 'spin .8s linear infinite' }} aria-hidden /> Connexion…</> : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
