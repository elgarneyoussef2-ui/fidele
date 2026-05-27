'use client'

import { useState, useEffect, useCallback, lazy, Suspense } from 'react'

const ScannerScreen = lazy(() => import('./ScannerScreen'))

// ─── Types ────────────────────────────────────────────────────────────────────

type Visit = { id?: string; amount_paid: number; points_earned: number; created_at: string; expires_at?: string | null; points_expired?: boolean }
type Client = {
  id: string; restaurant_id: string; name: string; phone: string
  points_balance: number; total_visits: number; last_visit_at: string | null
  restaurants: { id: string; name: string; description?: string | null; logo_url?: string | null; cover_url?: string | null; accent_color?: string | null }
  visits: Visit[]
  next_expiry?: { id: string; points_earned: number; expires_at: string } | null
}
type Reward = { id: string; name: string; description: string; points_cost: number }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIERS = [
  { name: 'Bronze', min: 0, max: 500, color: '#B5781F', bg: '#F6F1E7' },
  { name: 'Argent', min: 501, max: 1000, color: '#2A2236', bg: '#EDE6FB' },
  { name: 'Or', min: 1001, max: null, color: '#5B21B6', bg: '#EDE6FB' },
]

const tierFor = (p: number) =>
  TIERS.find(t => p >= t.min && (t.max == null || p <= t.max)) ?? TIERS[0]

const tierProgress = (p: number) => {
  const cur = tierFor(p)
  const idx = TIERS.indexOf(cur)
  const nxt = TIERS[idx + 1] ?? null
  if (!nxt) return { pct: 100, toNext: 0, next: null }
  return {
    pct: Math.min(100, Math.round(((p - cur.min) / (nxt.min - cur.min)) * 100)),
    toNext: nxt.min - p,
    next: nxt,
  }
}

const ago = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'À l\'instant'
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `Il y a ${d}j`
  return `Il y a ${Math.floor(d / 30)} mois`
}

const initials = (s: string) =>
  s.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()

// ─── Global styles ────────────────────────────────────────────────────────────

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: #fff; -webkit-font-smoothing: antialiased; }
  body { font-family: var(--font-sans), -apple-system, BlinkMacSystemFont, system-ui, sans-serif; color: #15101F; }
  button { font-family: inherit; cursor: pointer; border: none; background: none; -webkit-tap-highlight-color: transparent; }
  button:active { opacity: .75; }
  a  { color: inherit; text-decoration: none; }

  /* layout */
  .c-root    { display: flex; min-height: 100dvh; }
  .c-sidebar { display: none; }
  .c-main    { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .c-scroll  { flex: 1; overflow-y: auto; padding-bottom: 72px; }
  .c-tabbar  {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
    background: rgba(255,255,255,.8); backdrop-filter: saturate(180%) blur(20px);
    border-top: .5px solid rgba(21, 16, 31, 0.14);
    display: flex;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .c-tab { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 10px 0 8px; transition: color 0.2s; }
  .c-tab-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }

  /* sections */
  .section-title { font-family: var(--font-sans); font-size: 11px; font-weight: 600; letter-spacing: .18em; text-transform: uppercase; color: #5B21B6; margin-bottom: 12px; }

  /* cards */
  .card { background: #fff; border-radius: 22px; overflow: hidden; box-shadow: 0 4px 18px -8px rgba(21,16,31,.1); }
  .card-row { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; }
  .card-row + .card-row { border-top: .5px solid rgba(21, 16, 31, 0.08); }

  .num-mono { font-family: var(--font-mono), monospace; font-variant-numeric: tabular-nums; letter-spacing: 0.02em; }
  .wordmark { font-family: var(--font-display), serif; font-style: italic; letter-spacing: -0.02em; }
  .wordmark .accent { color: #5B21B6; }

  @media (min-width: 640px) {
    .c-scroll { padding-bottom: 32px; }
  }
  @media (min-width: 1024px) {
    .c-sidebar {
      display: flex; flex-direction: column; width: 260px; flex-shrink: 0;
      background: #fff; border-right: .5px solid rgba(21, 16, 31, 0.14);
      position: sticky; top: 0; height: 100dvh; overflow-y: auto;
    }
    .c-tabbar  { display: none; }
    .c-scroll  { padding-bottom: 40px; }
  }
`

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IconHome = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z" />
  </svg>
)
const IconScan = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
)
const IconChevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
)
const IconBack = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
)

// ─── Navigation ───────────────────────────────────────────────────────────────

function Sidebar({ onScan, isHome }: { onScan: () => void; isHome: boolean }) {
  const active = { background: '#EDE6FB', color: '#5B21B6', fontWeight: 700 }
  const normal = { color: '#2A2236', fontWeight: 500 }
  return (
    <aside className="c-sidebar">
      <div style={{ padding: '32px 24px 20px', borderBottom: '.5px solid rgba(21, 16, 31, 0.08)' }}>
        <div className="wordmark" style={{ fontSize: 26, color: '#15101F' }}>
          Fid<span className="accent">è</span>le
        </div>
        <div className="eyebrow" style={{ fontSize: 10, color: '#5B21B6', marginTop: 4 }}>Portefeuille fidélité</div>
      </div>
      <nav style={{ padding: '16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, fontSize: 15, transition: 'all 0.2s', ...(isHome ? active : normal) }}>
          <IconHome /> Accueil
        </div>
        <button onClick={onScan} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, fontSize: 15, marginTop: 4, transition: 'all 0.2s', ...normal }}>
          <IconScan /> Scanner
        </button>
      </nav>
    </aside>
  )
}

function TabBar({ onScan, isHome }: { onScan: () => void; isHome: boolean }) {
  return (
    <nav className="c-tabbar">
      <div className="c-tab" style={{ color: isHome ? '#5B21B6' : '#2A2236' }}>
        <IconHome />
        <span className="c-tab-label">Accueil</span>
      </div>
      <button className="c-tab" onClick={onScan} style={{ color: '#2A2236' }}>
        <IconScan />
        <span className="c-tab-label">Scanner</span>
      </button>
    </nav>
  )
}

// ─── Welcome (no phone stored) ────────────────────────────────────────────────

function WelcomeScreen({ onScan, onPhoneLogin }: { onScan: () => void; onPhoneLogin: (phone: string, name: string) => void }) {
  const [step,     setStep]     = useState<'phone' | 'password'>('phone')
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [busy,     setBusy]     = useState(false)
  const [err,      setErr]      = useState('')

  async function handlePhone(e: React.FormEvent) {
    e.preventDefault()
    const p = phone.trim(); if (!p) return
    setBusy(true); setErr('')
    try {
      const res  = await fetch('/api/client/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: p }) })
      const data = await res.json()
      if (!Array.isArray(data) || data.length === 0) setErr('Aucun compte trouvé. Scannez un QR code pour créer votre compte.')
      else setStep('password')
    } catch { setErr('Erreur réseau, réessayez.') }
    finally   { setBusy(false) }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      const res  = await fetch('/api/client/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: phone.trim(), password }) })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Mot de passe incorrect.'); return }
      onPhoneLogin(phone.trim(), data.name ?? '')
    } catch { setErr('Erreur réseau, réessayez.') }
    finally   { setBusy(false) }
  }

  const inputSt: React.CSSProperties = { width: '100%', border: '1.5px solid rgba(21,16,31,.14)', borderRadius: 16, padding: '14px 18px', fontSize: 18, fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#15101F' }
  const btnSt   = (off: boolean): React.CSSProperties => ({ background: '#5B21B6', color: '#fff', borderRadius: 16, padding: '14px 20px', fontSize: 16, fontWeight: 700, opacity: off ? .4 : 1, transition: 'all .2s', whiteSpace: 'nowrap' as const, flexShrink: 0 })

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 28px', background: '#fff' }}>
      <div style={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, color: '#5B21B6' }}>
        <svg viewBox="0 0 100 100" width="80" height="80" aria-label="Fidèle">
          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="50" cy="50" r="11" fill="currentColor" />
        </svg>
      </div>
      <h1 className="hero-display text-center mb-3">Fid<span className="accent">è</span>le</h1>
      <p style={{ fontSize: 15, color: 'var(--fidele-ink-2)', opacity: .55, lineHeight: 1.6, maxWidth: 260, marginBottom: 40, textAlign: 'center' }}>
        {step === 'phone' ? 'Accédez à votre portefeuille fidélité.' : 'Entrez votre mot de passe pour continuer.'}
      </p>

      {step === 'phone' ? (
        <>
          <form onSubmit={handlePhone} style={{ width: '100%', maxWidth: 340, marginBottom: 24 }}>
            <p className="eyebrow" style={{ fontSize: 10, color: '#5B21B6', marginBottom: 10 }}>J'ai déjà un compte</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <input type="tel" placeholder="Ex: 0612345678" value={phone} onChange={e => { setPhone(e.target.value); setErr('') }}
                disabled={busy} className="num-mono" style={inputSt} />
              <button type="submit" disabled={busy || !phone.trim()} style={btnSt(busy || !phone.trim())}>
                {busy ? '…' : '→'}
              </button>
            </div>
            {err && <p style={{ fontSize: 13, color: '#EF4444', marginTop: 10, fontWeight: 500 }}>{err}</p>}
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', maxWidth: 340, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(21,16,31,.08)' }} />
            <span className="eyebrow" style={{ fontSize: 10, color: 'rgba(21,16,31,.2)' }}>OU</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(21,16,31,.08)' }} />
          </div>

          <button onClick={onScan} style={{ width: '100%', maxWidth: 340, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#5B21B6', color: '#fff', borderRadius: 18, padding: '18px 32px', fontSize: 17, fontWeight: 700, boxShadow: '0 12px 32px rgba(91,33,182,.3)' }}>
            <IconScan /> Scanner un QR code
          </button>
          <p style={{ marginTop: 16, fontSize: 13, color: 'rgba(21,16,31,.3)', textAlign: 'center', fontWeight: 500 }}>
            Première visite ? Scannez le QR code du restaurant.
          </p>
        </>
      ) : (
        <form onSubmit={handlePassword} style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input type="password" placeholder="Mot de passe" value={password} onChange={e => { setPassword(e.target.value); setErr('') }}
              disabled={busy} style={{ ...inputSt, flex: 1, letterSpacing: '0.2em' }} autoFocus />
            <button type="submit" disabled={busy || !password} style={btnSt(busy || !password)}>
              {busy ? '…' : '→'}
            </button>
          </div>
          {err && <p style={{ fontSize: 13, color: '#EF4444', fontWeight: 500 }}>{err}</p>}
          <button type="button" onClick={() => { setStep('phone'); setPassword(''); setErr('') }}
            style={{ fontSize: 13, color: 'rgba(21,16,31,.4)', fontWeight: 500, padding: '8px 0' }}>
            ← Modifier le numéro
          </button>
        </form>
      )}
    </div>
  )
}

// ─── Home screen ──────────────────────────────────────────────────────────────

function HomeScreen({ clients, name, onOpen, onScan }: {
  clients: Client[]; name: string
  onOpen: (id: string) => void; onScan: () => void
}) {
  const total = clients.reduce((s, c) => s + (c.points_balance || 0), 0)

  return (
    <div style={{ paddingBottom: 8 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '32px 24px 0' }}>
        <div>
          <p className="eyebrow" style={{ fontSize: 10, color: '#5B21B6' }}>Bonjour,</p>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#15101F', letterSpacing: '-.02em', marginTop: 4 }}>{name}</h1>
        </div>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#5B21B6,#3F1685)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0, boxShadow: '0 8px 20px rgba(91,33,182,0.2)' }}>
          {initials(name)}
        </div>
      </div>

      {/* Hero card */}
      <div style={{ margin: '24px 20px 0' }}>
        <div style={{
          borderRadius: 22, padding: 28, display: 'flex', flexDirection: 'column', gap: 24,
          background: 'var(--fidele-ink)', color: 'var(--fidele-cream)', border: 'none', position: 'relative', overflow: 'hidden',
          boxShadow: '0 40px 70px -30px rgba(21,16,31,.45), 0 6px 24px -10px rgba(21,16,31,.18)',
        }}>
          {/* Background logo */}
          <svg viewBox="0 0 100 100" aria-hidden style={{
            position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)',
            width: 160, height: 160, color: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
          }}>
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="3" />
            <circle cx="50" cy="50" r="11" fill="currentColor" />
          </svg>

          <div>
            <p className="eyebrow" style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Total fidélité</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
              <span className="num-mono" style={{ fontSize: 56, fontWeight: 800, lineHeight: 1, letterSpacing: '-.03em' }}>{total.toLocaleString('fr-FR')}</span>
              <span style={{ fontSize: 18, color: 'rgba(255,255,255,.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>pts</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', fontWeight: 500 }}>
              {clients.length > 0
                ? `Dans ${clients.length} restaurant${clients.length > 1 ? 's' : ''}`
                : 'Scannez pour commencer'}
            </p>
            <div className="wordmark" style={{ fontSize: 20, opacity: 0.5 }}>
              Fid<span className="accent">è</span>le
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant list */}
      <div style={{ padding: '32px 24px 0' }}>
        {clients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#15101F', marginBottom: 8 }}>Aucun restaurant encore</p>
            <p style={{ fontSize: 14, color: '#2A2236', opacity: 0.6, lineHeight: 1.6, maxWidth: 240, margin: '0 auto 24px' }}>
              Scannez le QR code d'un restaurant pour l'ajouter à votre portefeuille.
            </p>
            <button onClick={onScan} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#5B21B6', color: '#fff', borderRadius: 16, padding: '14px 28px', fontSize: 15, fontWeight: 700, boxShadow: '0 8px 20px rgba(91,33,182,0.2)' }}>
              <IconScan /> Scanner maintenant
            </button>
          </div>
        ) : (
          <>
            <p className="section-title">Mes restaurants</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {clients.map(c => <RestoCard key={c.id} client={c} onClick={() => onOpen(c.id)} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function RestoCard({ client, onClick }: { client: Client; onClick: () => void }) {
  const tier = tierFor(client.points_balance)
  const prog = tierProgress(client.points_balance)
  const name = client.restaurants?.name ?? '—'
  const pts  = client.points_balance || 0

  const expiry = client.next_expiry ?? null
  const daysLeft = expiry ? Math.ceil((new Date(expiry.expires_at).getTime() - Date.now()) / 86400000) : null
  const urgent   = daysLeft !== null && daysLeft <= 30

  return (
    <button onClick={onClick} className="shadow-card" style={{ background: '#fff', borderRadius: 24, padding: '20px', textAlign: 'left', display: 'block', width: '100%', border: 'none' }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{ width: 52, height: 52, borderRadius: 18, background: 'var(--fidele-violet-tint)', color: 'var(--fidele-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 24, flexShrink: 0, overflow: 'hidden' }}>
          {client.restaurants?.logo_url
            ? <img src={client.restaurants.logo_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : name[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--fidele-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
          <p style={{ fontSize: 13, color: 'var(--fidele-ink-2)', opacity: 0.5, marginTop: 2, fontWeight: 500 }}>{client.total_visits ?? 0} visite{(client.total_visits ?? 0) > 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <p className="num-mono" style={{ fontSize: 28, fontWeight: 800, color: 'var(--fidele-ink)', lineHeight: 1, letterSpacing: '-.02em' }}>{pts.toLocaleString('fr-FR')}</p>
            <p className="eyebrow" style={{ fontSize: 9, color: 'var(--fidele-violet)', marginTop: 4 }}>pts</p>
          </div>
          <div style={{ color: 'rgba(21, 16, 31, 0.2)', marginTop: 2 }}><IconChevron /></div>
        </div>
      </div>

      {/* Tier & Progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span className="eyebrow" style={{ fontSize: 9, color: tier.color, background: tier.bg, padding: '4px 10px', borderRadius: 99, border: `1px solid ${tier.color}20` }}>{tier.name}</span>
          {prog.next
            ? <span style={{ fontSize: 11, color: '#2A2236', opacity: 0.5, fontWeight: 500 }}>encore <span className="num-mono" style={{ fontWeight: 700, color: '#15101F' }}>{prog.toNext}</span> pts → {prog.next.name}</span>
            : <span style={{ fontSize: 11, color: tier.color, fontWeight: 700 }}>Palier maximum ✨</span>}
        </div>
        <div style={{ height: 6, background: '#F0EEF8', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${prog.pct}%`, background: tier.color, borderRadius: 99, transition: 'width .6s cubic-bezier(.4,0,.2,1)' }} />
        </div>
      </div>

      {/* Expiry pill */}
      {expiry && daysLeft !== null && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10, background: urgent ? '#FEF2F2' : '#FFFBEB', border: `1px solid ${urgent ? '#FECACA' : '#FDE68A'}` }}>
          <span style={{ fontSize: 13 }}>{urgent ? '⚠️' : '⏳'}</span>
          <p style={{ fontSize: 12, fontWeight: 600, color: urgent ? '#DC2626' : '#B45309' }}>
            {expiry.points_earned} pt{expiry.points_earned > 1 ? 's' : ''} expirent dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}
          </p>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: urgent ? '#EF4444' : '#D97706', fontWeight: 500 }}>
            {new Date(expiry.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      )}
    </button>
  )
}

// ─── Detail screen ────────────────────────────────────────────────────────────

function DetailScreen({ client, clientName, onBack }: {
  client: Client; clientName: string; onBack: () => void
}) {
  const tier    = tierFor(client.points_balance)
  const prog    = tierProgress(client.points_balance)
  const rName   = client.restaurants?.name ?? '—'
  const pts     = client.points_balance || 0
  const accent  = client.restaurants?.accent_color ?? '#15101F'
  const logoUrl = client.restaurants?.logo_url
  const coverUrl = client.restaurants?.cover_url
  const desc    = client.restaurants?.description

  const [rewards, setRewards] = useState<Reward[]>([])
  const [rewardsLoaded, setRewardsLoaded] = useState(false)
  const [confirming, setConfirming] = useState<Reward | null>(null)
  const [sent, setSent] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState(false)
  const [reqError, setReqError] = useState('')

  useEffect(() => {
    fetch(`/api/rewards?restaurantId=${client.restaurant_id}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setRewards(Array.isArray(d) ? d : []); setRewardsLoaded(true) })
      .catch(() => setRewardsLoaded(true))
  }, [client.restaurant_id])

  async function requestReward(r: Reward) {
    setSending(true)
    setReqError('')
    try {
      const res = await fetch('/api/redemption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id, restaurantId: client.restaurant_id,
          rewardId: r.id, rewardName: r.name, rewardPoints: r.points_cost, clientName,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setReqError(d.error ?? 'Erreur')
        setSending(false)
        return
      }
      setSent(prev => new Set(prev).add(r.id))
      setConfirming(null)
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      {/* Hero */}
      <div style={{ color: '#fff', position: 'relative' }}>
        {/* Cover */}
        <div style={{
          height: coverUrl ? 180 : 120,
          background: coverUrl
            ? `url(${coverUrl}) center/cover no-repeat`
            : `linear-gradient(160deg, ${accent} 0%, ${accent}cc 100%)`,
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
          <button onClick={onBack} style={{ position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <IconBack />
          </button>
        </div>

        {/* Identity row */}
        <div style={{ background: '#15101F', padding: '0 24px 24px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, transform: 'translateY(-28px)' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20, flexShrink: 0, overflow: 'hidden',
              border: '3px solid #15101F', boxShadow: '0 4px 16px rgba(0,0,0,.3)',
              background: logoUrl ? '#fff' : `${accent}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: '#fff',
              marginTop: -28,
            }}>
              {logoUrl
                ? <img src={logoUrl} alt={rName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : rName[0]?.toUpperCase()}
            </div>
            <div style={{ paddingBottom: 4 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em', color: '#fff' }}>{rName}</h2>
              <p className="eyebrow" style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>
                {client.total_visits ?? 0} visite{(client.total_visits ?? 0) > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {desc && (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', lineHeight: 1.6, marginTop: 14, fontWeight: 400 }}>{desc}</p>
          )}
        </div>

        <div style={{ background: '#15101F', padding: '0 24px 32px' }}>

        {/* Balance card */}
        <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 24, padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <p className="eyebrow" style={{ fontSize: 9, color: 'rgba(255,255,255,.4)' }}>Votre solde</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
                <span className="num-mono" style={{ fontSize: 56, fontWeight: 800, lineHeight: 1, letterSpacing: '-.03em' }}>{pts.toLocaleString('fr-FR')}</span>
                <span style={{ fontSize: 18, color: 'rgba(255,255,255,.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>pts</span>
              </div>
            </div>
            <span style={{ background: '#fff', color: tier.color, fontSize: 11, fontWeight: 800, padding: '6px 14px', borderRadius: 99, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tier.name}</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,.1)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${prog.pct}%`, background: '#E9A23B', borderRadius: 99, transition: 'width .6s ease' }} />
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginTop: 14, fontWeight: 500 }}>
            {prog.next
              ? <>Encore <strong className="num-mono" style={{ color: '#fff' }}>{prog.toNext} pts</strong> pour atteindre <strong style={{ color: '#E9A23B' }}>{prog.next.name}</strong></>
              : 'Vous êtes au palier maximum ✨'}
          </p>
        </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '32px 24px' }}>

        {/* Expiry warning */}
        {client.next_expiry && (() => {
          const daysLeft = Math.ceil((new Date(client.next_expiry.expires_at).getTime() - Date.now()) / 86400000)
          const urgent = daysLeft <= 30
          return (
            <div style={{ marginBottom: 20, background: urgent ? '#FEF2F2' : '#FFFBEB', border: `1px solid ${urgent ? '#FECACA' : '#FDE68A'}`, borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>{urgent ? '⚠️' : '⏳'}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: urgent ? '#DC2626' : '#B45309' }}>
                  {client.next_expiry.points_earned} pt{client.next_expiry.points_earned > 1 ? 's' : ''} expirent dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}
                </p>
                <p style={{ fontSize: 12, color: urgent ? '#EF4444' : '#D97706', marginTop: 2 }}>
                  Utilisez vos points avant le {new Date(client.next_expiry.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          )
        })()}

        {/* Rewards */}
        {rewardsLoaded && (
          <div style={{ marginBottom: 36 }}>
            <p className="section-title">Récompenses disponibles</p>
            {rewards.length === 0 ? (
              <div className="card" style={{ padding: '32px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 32, marginBottom: 12 }}>🎁</p>
                <p style={{ fontSize: 14, color: '#2A2236', opacity: 0.5, fontWeight: 500 }}>Aucune récompense disponible pour ce restaurant.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {rewards.map(r => {
                  const canAfford = pts >= r.points_cost
                  const isSent = sent.has(r.id)
                  return (
                    <div key={r.id} className="card" style={{ opacity: canAfford ? 1 : .5 }}>
                      <div className="card-row" style={{ gap: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: canAfford ? '#EDE6FB' : '#F5F5F5', color: canAfford ? '#5B21B6' : '#2A2236', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>
                          🎁
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 15, fontWeight: 700, color: '#15101F' }}>{r.name}</p>
                          {r.description && <p style={{ fontSize: 12, color: '#2A2236', opacity: 0.5, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</p>}
                          <p className="num-mono" style={{ fontSize: 13, fontWeight: 700, color: '#5B21B6', marginTop: 4 }}>{r.points_cost.toLocaleString('fr-FR')} pts</p>
                        </div>
                        {isSent ? (
                          <span className="eyebrow" style={{ fontSize: 10, fontWeight: 700, color: '#16A34A', background: '#F0FDF4', padding: '8px 14px', borderRadius: 99, whiteSpace: 'nowrap', flexShrink: 0, border: '1px solid #16A34A20' }}>Envoyé ✓</span>
                        ) : (
                          <button
                            onClick={() => canAfford && !isSent && setConfirming(r)}
                            disabled={!canAfford}
                            style={{ background: canAfford ? '#5B21B6' : 'rgba(21, 16, 31, 0.05)', color: canAfford ? '#fff' : 'rgba(21, 16, 31, 0.3)', borderRadius: 12, padding: '10px 18px', fontSize: 14, fontWeight: 700, flexShrink: 0, transition: 'all 0.2s' }}>
                            Utiliser
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Visit history */}
        <div>
          <p className="section-title">Historique des visites</p>
          {(client.visits ?? []).length === 0 ? (
            <div className="card" style={{ padding: '32px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 36, marginBottom: 12 }}>🧾</p>
              <p style={{ fontSize: 14, color: '#2A2236', opacity: 0.5, fontWeight: 500 }}>Aucune visite enregistrée.</p>
            </div>
          ) : (
            <div className="card">
              {client.visits.map((v, i) => (
                <div key={v.id ?? i} className="card-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 14, background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>
                      🛒
                    </div>
                    <div>
                      <p className="num-mono" style={{ fontSize: 15, fontWeight: 700, color: '#15101F' }}>{v.amount_paid} MAD</p>
                      <p style={{ fontSize: 12, color: '#2A2236', opacity: 0.5, marginTop: 2, fontWeight: 500 }}>{ago(v.created_at)}</p>
                    </div>
                  </div>
                  <span className="num-mono" style={{ fontSize: 15, fontWeight: 800, color: '#16A34A' }}>+{v.points_earned} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm modal */}
      {confirming && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(21, 16, 31, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', zIndex: 200, padding: '0 16px 40px' }}>
          <div style={{ background: '#fff', borderRadius: 32, padding: '40px 28px', width: '100%', maxWidth: 440, margin: '0 auto', textAlign: 'center', boxShadow: '0 32px 64px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🎁</div>
            <h3 style={{ fontSize: 24, fontWeight: 800, color: '#15101F', marginBottom: 12 }}>{confirming.name}</h3>
            {reqError && <div style={{ fontSize: 13, color: '#EF4444', marginBottom: 16, background: '#FEF2F2', padding: '10px', borderRadius: 12, fontWeight: 500 }}>{reqError}</div>}
            <p style={{ fontSize: 16, color: '#2A2236', opacity: 0.6, lineHeight: 1.6, marginBottom: 36 }}>
              Vous allez utiliser <strong className="num-mono" style={{ color: '#5B21B6' }}>{confirming.points_cost} pts</strong>.<br />
              Le restaurant doit valider votre demande.
            </p>
            <div style={{ display: 'flex', gap: 14 }}>
              <button onClick={() => { setConfirming(null); setReqError('') }}
                style={{ flex: 1, padding: '16px', borderRadius: 16, border: '1.5px solid rgba(21, 16, 31, 0.1)', fontSize: 16, fontWeight: 700, color: '#2A2236', transition: 'all 0.2s' }}>
                Annuler
              </button>
              <button onClick={() => requestReward(confirming)} disabled={sending}
                style={{ flex: 1, padding: '16px', borderRadius: 16, background: '#5B21B6', color: '#fff', fontSize: 16, fontWeight: 700, transition: 'all 0.2s', boxShadow: '0 8px 20px rgba(91,33,182,0.2)' }}>
                {sending ? '…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Loading ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, background: '#fff' }}>
      <style>{`
        @keyframes pulse-ring { 0%,100%{transform:scale(0.92);opacity:.6} 50%{transform:scale(1.08);opacity:1} }
        @keyframes dot-pop    { 0%,100%{transform:scale(1)}              50%{transform:scale(1.3)} }
        .sp-ring{animation:pulse-ring 1.6s ease-in-out infinite;transform-origin:50px 50px}
        .sp-dot {animation:dot-pop   1.6s ease-in-out infinite;transform-origin:50px 50px}
      `}</style>
      <div style={{ color: '#5B21B6' }}>
        <svg viewBox="0 0 100 100" width="72" height="72" aria-hidden>
          <circle className="sp-ring" cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle className="sp-dot"  cx="50" cy="50" r="11" fill="currentColor" />
        </svg>
      </div>
      <span style={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', fontSize: 28, letterSpacing: '-0.02em', color: '#15101F' }}>
        Fid<span style={{ color: '#5B21B6' }}>è</span>le
      </span>
    </div>
  )
}

// ─── App root ─────────────────────────────────────────────────────────────────

export default function ClientApp() {
  const [clients, setClients] = useState<Client[]>([])
  const [clientName, setClientName] = useState('')
  const [phone, setPhone] = useState('')
  const [screen, setScreen] = useState<'home' | string>('home')
  const [showScanner, setShowScanner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasPhone, setHasPhone] = useState(false)

  // Extracted so it can be called after scan too
  const loadData = useCallback(async (p: string) => {
    try {
      const res = await fetch('/api/client/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: p }),
      })
      const d = await res.json()
      if (Array.isArray(d)) {
        setClients(d)
        // Sync name from DB if available
        if (d.length > 0 && d[0].name) {
          setClientName(d[0].name)
          localStorage.setItem('fidele_client_name', d[0].name)
        }
      }
    } catch { }
  }, [])

  useEffect(() => {
    const p = localStorage.getItem('fidele_client_phone')
    const n = localStorage.getItem('fidele_client_name') ?? ''
    if (!p) { setLoading(false); return }
    setPhone(p)
    setHasPhone(true)
    setClientName(n)
    loadData(p).finally(() => setLoading(false))
  }, [loadData])

  // If screen points to a client that no longer exists, go back home
  const activeClient = screen !== 'home' ? (clients.find(c => c.id === screen) ?? null) : null
  useEffect(() => {
    if (screen !== 'home' && clients.length > 0 && !activeClient) setScreen('home')
  }, [screen, clients, activeClient])

  function handleScannerClose() {
    setShowScanner(false)
    if (phone) loadData(phone)
  }

  if (loading) return <><style>{CSS}</style><Spinner /></>

  function handlePhoneLogin(p: string, n: string) {
    localStorage.setItem('fidele_client_phone', p)
    if (n) { localStorage.setItem('fidele_client_name', n); setClientName(n) }
    setPhone(p)
    setHasPhone(true)
    loadData(p)
  }

  if (!hasPhone) return (
    <>
      <style>{CSS}</style>
      <WelcomeScreen onScan={() => setShowScanner(true)} onPhoneLogin={handlePhoneLogin} />
      {showScanner && <Suspense fallback={null}><ScannerScreen onClose={() => {
        setShowScanner(false)
        const p = localStorage.getItem('fidele_client_phone')
        if (p) { setPhone(p); setHasPhone(true); loadData(p) }
      }} /></Suspense>}
    </>
  )

  const isHome = screen === 'home'

  return (
    <>
      <style>{CSS}</style>
      <div className="c-root">
        <Sidebar isHome={isHome} onScan={() => setShowScanner(true)} />
        <div className="c-main">
          <div className="c-scroll">
            {isHome
              ? <HomeScreen clients={clients} name={clientName} onOpen={id => setScreen(id)} onScan={() => setShowScanner(true)} />
              : activeClient
                ? <DetailScreen client={activeClient} clientName={clientName} onBack={() => setScreen('home')} />
                : null}
          </div>
          <TabBar isHome={isHome} onScan={() => setShowScanner(true)} />
        </div>
      </div>
      {showScanner && (
        <Suspense fallback={null}>
          <ScannerScreen onClose={handleScannerClose} />
        </Suspense>
      )}
    </>
  )
}
