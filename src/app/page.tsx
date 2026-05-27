'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'who' | 'registered' | 'login' | 'register' | 'success'

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: #fff; -webkit-font-smoothing: antialiased; }
  body { font-family: var(--font-sans), system-ui, sans-serif; color: #15101F; }
  button, input { font-family: inherit; }
  button { cursor: pointer; border: none; background: none; -webkit-tap-highlight-color: transparent; }
  button:active { opacity: .8; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to   { opacity: 0; transform: translateY(-12px); }
  }
  .step-in  { animation: fadeUp  .4s cubic-bezier(.22,1,.36,1) both; }
  .step-out { animation: fadeOut .25s ease both; }
`

const DOTS: Step[] = ['who', 'registered', 'login']

export default function LandingPage() {
  const router = useRouter()

  const [step,    setStep]    = useState<Step>('who')
  const [animOut, setAnimOut] = useState(false)

  // login
  const [password, setPassword] = useState('')
  const [loginErr, setLoginErr] = useState('')

  // register
  const [rName,     setRName]     = useState('')
  const [rEmail,    setREmail]    = useState('')
  const [rPhone,    setRPhone]    = useState('')
  const [rLocation, setRLocation] = useState('')

  const [busy, setBusy] = useState(false)

  function goTo(next: Step, delay = 320) {
    setAnimOut(true)
    setTimeout(() => { setStep(next); setAnimOut(false) }, delay)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setLoginErr('')
    const res  = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password }),
    })
    if (res.ok) {
      router.push('/dashboard')
    } else {
      const d = await res.json()
      setLoginErr(d.error ?? 'Identifiants incorrects.')
      setBusy(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    // Store lead
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: rName, email: rEmail, phone: rPhone, location: rLocation }),
    }).catch(() => {})
    setBusy(false)
    goTo('success')
  }

  // ── Shared styles ────────────────────────────────────────────────────────────

  const inp: React.CSSProperties = {
    width: '100%', padding: '14px 0', fontSize: 17,
    border: 'none', borderBottom: '1.5px solid rgba(21,16,31,.15)',
    outline: 'none', background: 'transparent', color: '#15101F',
    transition: 'border-color .2s',
  }
  const choiceBtn = (active?: boolean): React.CSSProperties => ({
    padding: '14px 36px', borderRadius: 99, fontSize: 16, fontWeight: 600,
    border: '1.5px solid rgba(21,16,31,.14)',
    background: active ? '#5B21B6' : '#fff',
    color:      active ? '#fff'    : '#15101F',
    transition: 'all .2s',
    minWidth: 140, textAlign: 'center' as const,
  })
  const nextBtn: React.CSSProperties = {
    width: '100%', padding: '15px', borderRadius: 16, fontSize: 16, fontWeight: 700,
    background: '#5B21B6', color: '#fff', marginTop: 28,
    opacity: busy ? .5 : 1, transition: 'opacity .2s',
  }

  // ── Question label ───────────────────────────────────────────────────────────

  const Q = ({ children }: { children: React.ReactNode }) => (
    <p style={{ fontSize: 26, fontWeight: 700, color: '#15101F', letterSpacing: '-.02em', lineHeight: 1.25, marginBottom: 40, textAlign: 'center' }}>
      {children}
    </p>
  )

  // ── Steps ────────────────────────────────────────────────────────────────────

  const content: Record<Step, React.ReactNode> = {

    who: (
      <>
        <Q>Vous êtes ?</Q>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button style={choiceBtn()} onClick={() => router.push('/client')}>
            Client
          </button>
          <button style={choiceBtn()} onClick={() => goTo('registered')}>
            Restaurant
          </button>
        </div>
      </>
    ),

    registered: (
      <>
        <Q>Vous avez déjà un compte ?</Q>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button style={choiceBtn()} onClick={() => goTo('login')}>Oui</button>
          <button style={choiceBtn()} onClick={() => goTo('register')}>Non</button>
        </div>
      </>
    ),

    login: (
      <>
        <Q>Connectez-vous</Q>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            type="password" placeholder="Mot de passe" value={password}
            onChange={e => { setPassword(e.target.value); setLoginErr('') }}
            style={inp} required autoFocus
          />
          {loginErr && <p style={{ fontSize: 13, color: '#EF4444', marginTop: 6, fontWeight: 500 }}>{loginErr}</p>}
          <button type="submit" style={nextBtn} disabled={busy}>
            {busy ? 'Connexion…' : 'Accéder au dashboard →'}
          </button>
        </form>
        <button onClick={() => goTo('registered')} style={{ width: '100%', marginTop: 14, fontSize: 14, color: '#9CA3AF', padding: '8px 0' }}>
          ← Retour
        </button>
      </>
    ),

    register: (
      <>
        <Q>Créons votre espace</Q>
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input placeholder="Nom du restaurant / café" value={rName}     onChange={e => setRName(e.target.value)}     style={inp} required autoFocus />
          <input placeholder="Email"                    value={rEmail}    onChange={e => setREmail(e.target.value)}    style={{ ...inp, marginTop: 8 }} type="email" required />
          <input placeholder="Numéro de téléphone"      value={rPhone}    onChange={e => setRPhone(e.target.value)}    style={{ ...inp, marginTop: 8 }} type="tel" required />
          <input placeholder="Ville / Emplacement"      value={rLocation} onChange={e => setRLocation(e.target.value)} style={{ ...inp, marginTop: 8 }} required />
          <button type="submit" style={nextBtn} disabled={busy}>
            {busy ? 'Envoi…' : 'Envoyer la demande →'}
          </button>
        </form>
        <button onClick={() => goTo('registered')} style={{ width: '100%', marginTop: 14, fontSize: 14, color: '#9CA3AF', padding: '8px 0' }}>
          ← Retour
        </button>
      </>
    ),

    success: (
      <>
        <div style={{ fontSize: 52, textAlign: 'center', marginBottom: 24 }}>✉️</div>
        <Q>Demande reçue !</Q>
        <p style={{ fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 1.6, marginTop: -20 }}>
          Nous vous contacterons dans les plus brefs délais pour créer votre espace Fidèle.
        </p>
        <button onClick={() => goTo('who')} style={{ ...nextBtn, marginTop: 40, background: 'transparent', color: '#9CA3AF', border: '1.5px solid rgba(21,16,31,.1)' }}>
          Retour à l'accueil
        </button>
      </>
    ),
  }

  const dotSteps: Step[] = ['who', 'registered', 'login']
  const dotIndex = dotSteps.indexOf(step)

  return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#fff' }}>

        {/* Logo */}
        <div style={{ position: 'absolute', top: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg viewBox="0 0 100 100" width="26" height="26" aria-hidden style={{ color: '#5B21B6' }}>
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" />
            <circle cx="50" cy="50" r="13" fill="currentColor" />
          </svg>
          <span style={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', fontSize: 22, letterSpacing: '-0.02em', color: '#15101F' }}>
            Fid<span style={{ color: '#5B21B6' }}>è</span>le
          </span>
        </div>

        {/* Step content */}
        <div
          key={step}
          className={animOut ? 'step-out' : 'step-in'}
          style={{ width: '100%', maxWidth: 400 }}
        >
          {content[step]}
        </div>

        {/* Progress dots */}
        {dotIndex >= 0 && (
          <div style={{ position: 'absolute', bottom: 36, display: 'flex', gap: 8 }}>
            {dotSteps.map((s, i) => (
              <div key={s} style={{
                width: i === dotIndex ? 20 : 6, height: 6,
                borderRadius: 99,
                background: i === dotIndex ? '#5B21B6' : 'rgba(21,16,31,.12)',
                transition: 'all .35s cubic-bezier(.34,1.56,.64,1)',
              }} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
