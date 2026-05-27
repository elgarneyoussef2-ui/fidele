'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'who' | 'registered' | 'login' | 'register' | 'success'

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; -webkit-font-smoothing: antialiased; }
  body { font-family: var(--font-sans), system-ui, sans-serif; color: #15101F; }
  button, input { font-family: inherit; }
  button { cursor: pointer; border: none; background: none; -webkit-tap-highlight-color: transparent; }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(24px) scale(.98); }
    to   { opacity: 1; transform: translateY(0)    scale(1);   }
  }
  @keyframes slideDown {
    from { opacity: 1; transform: translateY(0)     scale(1);   }
    to   { opacity: 0; transform: translateY(-16px) scale(.98); }
  }
  @keyframes popIn {
    0%   { transform: scale(0);   opacity: 0; }
    60%  { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1);   opacity: 1; }
  }
  @keyframes checkDraw {
    from { stroke-dashoffset: 40; }
    to   { stroke-dashoffset: 0; }
  }
  .step-in  { animation: slideUp   .45s cubic-bezier(.22,1,.36,1) both; }
  .step-out { animation: slideDown .22s ease both; }
  .pop-in   { animation: popIn     .5s  cubic-bezier(.34,1.56,.64,1) both; }

  .choice-card {
    display: flex; align-items: center; gap: 16px;
    width: 100%; padding: 18px 20px; border-radius: 18px;
    border: 1.5px solid rgba(21,16,31,.1);
    background: #fff;
    text-align: left; cursor: pointer;
    transition: border-color .18s, box-shadow .18s, transform .15s;
    -webkit-tap-highlight-color: transparent;
  }
  .choice-card:hover  { border-color: #5B21B6; box-shadow: 0 4px 20px rgba(91,33,182,.12); transform: translateY(-1px); }
  .choice-card:active { transform: scale(.98); }

  .inp-wrap {
    position: relative; width: 100%;
  }
  .inp-wrap svg {
    position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
    color: #9CA3AF; pointer-events: none;
  }
  .inp-field {
    width: 100%; padding: 15px 16px 15px 46px;
    border: 1.5px solid rgba(21,16,31,.1); border-radius: 14px;
    background: #F9F8FF; color: #15101F; font-size: 15px; outline: none;
    transition: border-color .18s, box-shadow .18s;
    -webkit-appearance: none;
  }
  .inp-field::placeholder { color: #9CA3AF; }
  .inp-field:focus {
    border-color: #5B21B6;
    box-shadow: 0 0 0 3px rgba(91,33,182,.1);
    background: #fff;
  }

  .primary-btn {
    width: 100%; padding: 16px; border-radius: 16px;
    font-size: 15px; font-weight: 700; color: #fff;
    background: linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%);
    box-shadow: 0 4px 16px rgba(91,33,182,.35);
    transition: opacity .2s, transform .15s, box-shadow .2s;
    border: none; cursor: pointer;
  }
  .primary-btn:hover  { box-shadow: 0 6px 24px rgba(91,33,182,.45); transform: translateY(-1px); }
  .primary-btn:active { transform: scale(.98); opacity: .9; }
  .primary-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }

  .back-btn {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    width: 100%; padding: 10px; font-size: 13px; color: #9CA3AF;
    transition: color .15s;
  }
  .back-btn:hover { color: #6B7280; }
`

export default function LandingPage() {
  const router = useRouter()
  const [step,    setStep]    = useState<Step>('who')
  const [animOut, setAnimOut] = useState(false)
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [rName,     setRName]     = useState('')
  const [rEmail,    setREmail]    = useState('')
  const [rPhone,    setRPhone]    = useState('')
  const [rLocation, setRLocation] = useState('')
  const [busy, setBusy] = useState(false)

  function goTo(next: Step) {
    setAnimOut(true)
    setTimeout(() => { setStep(next); setAnimOut(false) }, 240)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setLoginErr('')
    const res = await fetch('/api/auth/restaurant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (res.ok) {
      window.location.href = '/dashboard'
    } else {
      const d = await res.json()
      setLoginErr(d.error ?? 'Identifiants incorrects.')
      setBusy(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: rName, email: rEmail, phone: rPhone, location: rLocation }),
    }).catch(() => {})
    setBusy(false)
    goTo('success')
  }

  // ── Step meta ─────────────────────────────────────────────────────────────────
  const STEP_META: Partial<Record<Step, { label: string; index: number; total: number }>> = {
    registered: { label: 'Votre compte', index: 1, total: 2 },
    login:      { label: 'Connexion',    index: 2, total: 2 },
    register:   { label: 'Inscription',  index: 2, total: 2 },
  }
  const meta = STEP_META[step]

  // ── Icon helpers ──────────────────────────────────────────────────────────────
  const IconUser = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )
  const IconStore = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
  const IconMail = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  )
  const IconLock = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
  const IconPhone = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6.09 6.09l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  )
  const IconPin = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  )
  const IconTag = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>
    </svg>
  )

  // ── Steps ─────────────────────────────────────────────────────────────────────
  const content: Record<Step, React.ReactNode> = {

    who: (
      <div>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg,#EDE6FB,#D8B4FE)', marginBottom: 20 }}>
            <svg viewBox="0 0 100 100" width="32" height="32" aria-hidden style={{ color: '#5B21B6' }}>
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6"/>
              <circle cx="50" cy="50" r="13" fill="currentColor"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#15101F', letterSpacing: '-.03em', lineHeight: 1.15, marginBottom: 10 }}>
            Bienvenue sur<br />
            <span style={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', color: '#5B21B6' }}>Fidèle</span>
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
            Le programme de fidélité intelligent<br />pour les restaurants marocains.
          </p>
        </div>

        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#9CA3AF', textAlign: 'center', marginBottom: 14 }}>
          Vous êtes ?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button className="choice-card" onClick={() => router.push('/client')}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: '#EDE6FB', color: '#5B21B6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconUser />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#15101F' }}>Client</p>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Accéder à ma carte fidélité</p>
            </div>
            <svg style={{ marginLeft: 'auto', color: '#D1D5DB', flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
          </button>

          <button className="choice-card" onClick={() => goTo('registered')}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconStore />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#15101F' }}>Restaurant</p>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Gérer mon programme de fidélité</p>
            </div>
            <svg style={{ marginLeft: 'auto', color: '#D1D5DB', flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    ),

    registered: (
      <div>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#15101F', letterSpacing: '-.02em', lineHeight: 1.2, marginBottom: 8 }}>
            Vous avez déjà<br />un compte Fidèle ?
          </p>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>Un compte créé par notre équipe</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button className="choice-card" onClick={() => goTo('login')} style={{ background: '#5B21B6', borderColor: '#5B21B6' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Oui, me connecter</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>Accéder à mon dashboard</p>
            </div>
            <svg style={{ marginLeft: 'auto', color: 'rgba(255,255,255,.4)', flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
          </button>

          <button className="choice-card" onClick={() => goTo('register')}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#15101F' }}>Non, créer un espace</p>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Rejoindre Fidèle gratuitement</p>
            </div>
            <svg style={{ marginLeft: 'auto', color: '#D1D5DB', flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>

        <button className="back-btn" onClick={() => goTo('who')} style={{ marginTop: 24 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
          Retour
        </button>
      </div>
    ),

    login: (
      <div>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: '#EDE6FB', color: '#5B21B6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#15101F', letterSpacing: '-.02em', marginBottom: 6 }}>Connexion</p>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>Entrez vos identifiants Fidèle</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="inp-wrap">
            <IconMail />
            <input className="inp-field" type="email" placeholder="Adresse email" value={email}
              onChange={e => { setEmail(e.target.value); setLoginErr('') }}
              required autoFocus autoComplete="email" />
          </div>
          <div className="inp-wrap">
            <IconLock />
            <input className="inp-field" type="password" placeholder="Mot de passe" value={password}
              onChange={e => { setPassword(e.target.value); setLoginErr('') }}
              required autoComplete="current-password" />
          </div>

          {loginErr && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#DC2626', fontWeight: 500 }}>
              {loginErr}
            </div>
          )}

          <button className="primary-btn" type="submit" disabled={busy} style={{ marginTop: 8 }}>
            {busy ? 'Connexion…' : 'Accéder au dashboard →'}
          </button>
        </form>

        <button className="back-btn" onClick={() => goTo('registered')} style={{ marginTop: 16 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
          Retour
        </button>
      </div>
    ),

    register: (
      <div>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <IconStore />
          </div>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#15101F', letterSpacing: '-.02em', marginBottom: 6 }}>Créons votre espace</p>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>Notre équipe vous contactera sous 24h</p>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="inp-wrap">
            <IconTag />
            <input className="inp-field" placeholder="Nom du restaurant / café" value={rName}
              onChange={e => setRName(e.target.value)} required autoFocus />
          </div>
          <div className="inp-wrap">
            <IconMail />
            <input className="inp-field" type="email" placeholder="Email" value={rEmail}
              onChange={e => setREmail(e.target.value)} required />
          </div>
          <div className="inp-wrap">
            <IconPhone />
            <input className="inp-field" type="tel" placeholder="Numéro de téléphone" value={rPhone}
              onChange={e => setRPhone(e.target.value)} required />
          </div>
          <div className="inp-wrap">
            <IconPin />
            <input className="inp-field" placeholder="Ville / Emplacement" value={rLocation}
              onChange={e => setRLocation(e.target.value)} required />
          </div>

          <button className="primary-btn" type="submit" disabled={busy} style={{ marginTop: 8 }}>
            {busy ? 'Envoi…' : 'Envoyer la demande →'}
          </button>
        </form>

        <button className="back-btn" onClick={() => goTo('registered')} style={{ marginTop: 16 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
          Retour
        </button>
      </div>
    ),

    success: (
      <div style={{ textAlign: 'center' }}>
        <div className="pop-in" style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg,#D1FAE5,#A7F3D0)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 40, strokeDashoffset: 0, animation: 'checkDraw .4s .3s cubic-bezier(.22,1,.36,1) both' }} />
          </svg>
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#15101F', letterSpacing: '-.02em', marginBottom: 12 }}>
          Demande envoyée !
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 8 }}>
          Merci pour votre intérêt.<br />
          Notre équipe vous contactera<br />
          <strong style={{ color: '#15101F' }}>dans les 24 heures</strong> pour créer<br />
          votre espace Fidèle.
        </p>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F3F4F6', borderRadius: 99, padding: '8px 16px', marginTop: 8, marginBottom: 36 }}>
          <span style={{ fontSize: 12 }}>📧</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>{rEmail || 'Vérifiez vos emails'}</span>
        </div>

        <button className="primary-btn" onClick={() => goTo('who')}
          style={{ background: 'transparent', color: '#9CA3AF', boxShadow: 'none', border: '1.5px solid rgba(21,16,31,.1)' }}>
          Retour à l'accueil
        </button>
      </div>
    ),
  }

  // ── Progress bar for restaurant flow ──────────────────────────────────────────
  const restaurantFlow: Step[] = ['registered', 'login', 'register']
  const flowIndex = restaurantFlow.indexOf(step)

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px 60px',
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(91,33,182,.06) 0%, #fff 70%)',
      }}>

        {/* Logo */}
        <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg viewBox="0 0 100 100" width="24" height="24" aria-hidden style={{ color: '#5B21B6' }}>
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6"/>
            <circle cx="50" cy="50" r="13" fill="currentColor"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', fontSize: 20, letterSpacing: '-0.02em', color: '#15101F' }}>
            Fid<span style={{ color: '#5B21B6' }}>è</span>le
          </span>
        </div>

        {/* Step progress (restaurant flow only) */}
        {meta && (
          <div style={{ position: 'absolute', top: 72, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {[1, 2].map(i => (
              <div key={i} style={{
                height: 3, borderRadius: 99,
                width: i <= meta.index ? 28 : 16,
                background: i <= meta.index ? '#5B21B6' : 'rgba(21,16,31,.1)',
                transition: 'all .35s cubic-bezier(.34,1.56,.64,1)',
              }} />
            ))}
            <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginLeft: 4 }}>
              {meta.index}/{meta.total}
            </span>
          </div>
        )}

        {/* Content card */}
        <div
          key={step}
          className={animOut ? 'step-out' : 'step-in'}
          style={{
            width: '100%', maxWidth: 380,
            background: '#fff', borderRadius: 28,
            padding: '32px 28px',
            boxShadow: '0 8px 40px rgba(21,16,31,.08), 0 1px 2px rgba(21,16,31,.04)',
            border: '1px solid rgba(21,16,31,.06)',
          }}
        >
          {content[step]}
        </div>

        {/* Tagline bottom */}
        {step === 'who' && (
          <p style={{ marginTop: 24, fontSize: 12, color: '#D1D5DB', textAlign: 'center' }}>
            Déjà +50 restaurants partenaires au Maroc
          </p>
        )}
      </div>
    </>
  )
}
