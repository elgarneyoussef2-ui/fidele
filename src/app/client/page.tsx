'use client'

import { useState, useEffect, useCallback, lazy, Suspense } from 'react'

const ScannerScreen = lazy(() => import('./ScannerScreen'))

// ─── Types ────────────────────────────────────────────────────────────────────

type Visit  = { id?: string; amount_paid: number; points_earned: number; created_at: string }
type Client = {
  id: string; restaurant_id: string; name: string; phone: string
  points_balance: number; total_visits: number; last_visit_at: string | null
  restaurants: { id: string; name: string }
  visits: Visit[]
}
type Reward = { id: string; name: string; description: string; points_cost: number }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIERS = [
  { name: 'Bronze', min: 0,    max: 500,  color: '#D97706', bg: '#FEF3C7' },
  { name: 'Argent', min: 501,  max: 1000, color: '#64748B', bg: '#F1F5F9' },
  { name: 'Or',     min: 1001, max: null, color: '#CA8A04', bg: '#FEF9C3' },
]

const tierFor = (p: number) =>
  TIERS.find(t => p >= t.min && (t.max == null || p <= t.max)) ?? TIERS[0]

const tierProgress = (p: number) => {
  const cur = tierFor(p)
  const idx = TIERS.indexOf(cur)
  const nxt = TIERS[idx + 1] ?? null
  if (!nxt) return { pct: 100, toNext: 0, next: null }
  return {
    pct:    Math.min(100, Math.round(((p - cur.min) / (nxt.min - cur.min)) * 100)),
    toNext: nxt.min - p,
    next:   nxt,
  }
}

const ago = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1)  return 'À l\'instant'
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
  @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: #F2F2F7; -webkit-font-smoothing: antialiased; }
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif; color: #1C1C1E; }
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
    background: rgba(249,249,251,.92); backdrop-filter: saturate(180%) blur(20px);
    border-top: .5px solid rgba(60,60,67,.18);
    display: flex;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .c-tab { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 10px 0 8px; }
  .c-tab-label { font-size: 10px; font-weight: 600; }

  /* sections */
  .section-title { font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: #8E8E93; margin-bottom: 10px; }

  /* cards */
  .card { background: #fff; border-radius: 16px; overflow: hidden; }
  .card-row { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px; }
  .card-row + .card-row { border-top: .5px solid #E5E5EA; }

  @media (min-width: 640px) {
    .c-scroll { padding-bottom: 32px; }
  }
  @media (min-width: 1024px) {
    .c-sidebar {
      display: flex; flex-direction: column; width: 240px; flex-shrink: 0;
      background: #fff; border-right: .5px solid #E5E5EA;
      position: sticky; top: 0; height: 100dvh; overflow-y: auto;
    }
    .c-tabbar  { display: none; }
    .c-scroll  { padding-bottom: 40px; }
  }
`

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IconHome = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>
  </svg>
)
const IconScan = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
)
const IconChevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6"/>
  </svg>
)
const IconBack = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6"/>
  </svg>
)

// ─── Navigation ───────────────────────────────────────────────────────────────

function Sidebar({ onScan, isHome }: { onScan: () => void; isHome: boolean }) {
  const active = { background: '#EBF3FF', color: '#185FA5', fontWeight: 700 }
  const normal = { color: '#6B7280', fontWeight: 500 }
  return (
    <aside className="c-sidebar">
      <div style={{ padding: '28px 20px 16px', borderBottom: '.5px solid #E5E5EA' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#185FA5' }}>Taghra</div>
        <div style={{ fontSize: 12, color: '#8E8E93', marginTop: 3 }}>Portefeuille fidélité</div>
      </div>
      <nav style={{ padding: '12px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, fontSize: 14, ...(isHome ? active : normal) }}>
          <IconHome /> Accueil
        </div>
        <button onClick={onScan} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, fontSize: 14, marginTop: 2, ...normal }}>
          <IconScan /> Scanner
        </button>
      </nav>
    </aside>
  )
}

function TabBar({ onScan, isHome }: { onScan: () => void; isHome: boolean }) {
  return (
    <nav className="c-tabbar">
      <div className="c-tab" style={{ color: isHome ? '#185FA5' : '#8E8E93' }}>
        <IconHome />
        <span className="c-tab-label">Accueil</span>
      </div>
      <button className="c-tab" onClick={onScan} style={{ color: '#8E8E93' }}>
        <IconScan />
        <span className="c-tab-label">Scanner</span>
      </button>
    </nav>
  )
}

// ─── Welcome (no phone stored) ────────────────────────────────────────────────

function WelcomeScreen({ onScan, onPhoneLogin }: { onScan: () => void; onPhoneLogin: (phone: string) => void }) {
  const [phone,  setPhone]  = useState('')
  const [busy,   setBusy]   = useState(false)
  const [err,    setErr]    = useState('')

  async function handlePhone(e: React.FormEvent) {
    e.preventDefault()
    const p = phone.trim()
    if (!p) return
    setBusy(true); setErr('')
    try {
      const res  = await fetch('/api/client/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: p }),
      })
      const data = await res.json()
      if (!Array.isArray(data) || data.length === 0) {
        setErr('Aucun compte trouvé pour ce numéro. Scannez un QR code pour créer votre compte.')
      } else {
        onPhoneLogin(p)
      }
    } catch {
      setErr('Erreur réseau, réessayez.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 28px', background: '#F2F2F7' }}>
      <div style={{ width: 88, height: 88, borderRadius: 28, background: 'linear-gradient(135deg,#185FA5,#0D3E72)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, boxShadow: '0 20px 48px -8px rgba(24,95,165,.4)' }}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </div>
      <h1 style={{ fontSize: 30, fontWeight: 800, color: '#1C1C1E', letterSpacing: '-.02em', marginBottom: 10, textAlign: 'center' }}>Bienvenue sur Taghra</h1>
      <p style={{ fontSize: 15, color: '#8E8E93', lineHeight: 1.6, maxWidth: 280, marginBottom: 36, textAlign: 'center' }}>
        Accédez à votre portefeuille fidélité.
      </p>

      {/* Phone login */}
      <form onSubmit={handlePhone} style={{ width: '100%', maxWidth: 340, marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>J'ai déjà un compte</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="tel" placeholder="Ex: 0612345678" value={phone}
            onChange={e => { setPhone(e.target.value); setErr('') }}
            disabled={busy}
            style={{ flex: 1, border: '1.5px solid #E5E5EA', borderRadius: 14, padding: '13px 16px', fontSize: 16, fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#1C1C1E' }}
          />
          <button type="submit" disabled={busy || !phone.trim()} style={{ background: '#185FA5', color: '#fff', borderRadius: 14, padding: '13px 18px', fontSize: 15, fontWeight: 700, opacity: (!phone.trim() || busy) ? .5 : 1 }}>
            {busy ? '…' : '→'}
          </button>
        </div>
        {err && <p style={{ fontSize: 13, color: '#EF4444', marginTop: 8 }}>{err}</p>}
      </form>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', maxWidth: 340, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 1, background: '#E5E5EA' }} />
        <span style={{ fontSize: 12, color: '#C7C7CC', fontWeight: 600 }}>OU</span>
        <div style={{ flex: 1, height: 1, background: '#E5E5EA' }} />
      </div>

      {/* Scan */}
      <button onClick={onScan} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#185FA5', color: '#fff', borderRadius: 18, padding: '16px 32px', fontSize: 17, fontWeight: 700, boxShadow: '0 10px 28px rgba(24,95,165,.38)' }}>
        <IconScan /> Scanner un QR code
      </button>
      <p style={{ marginTop: 16, fontSize: 13, color: '#C7C7CC', textAlign: 'center' }}>
        Première visite ? Scannez le QR code du restaurant.
      </p>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 20px 0' }}>
        <div>
          <p style={{ fontSize: 14, color: '#8E8E93', fontWeight: 500 }}>Bonjour,</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1C1C1E', letterSpacing: '-.02em', marginTop: 1 }}>{name}</h1>
        </div>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#185FA5,#0D3E72)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
          {initials(name)}
        </div>
      </div>

      {/* Hero card */}
      <div style={{ margin: '18px 20px 0' }}>
        <div style={{ background: 'linear-gradient(145deg,#0D2B57 0%,#185FA5 55%,#2176C4 100%)', borderRadius: 24, padding: '24px', color: '#fff', boxShadow: '0 24px 56px -14px rgba(24,95,165,.5)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -28, right: -28, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -16, right: 20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,.04)', pointerEvents: 'none' }} />
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)' }}>Total fidélité</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 10 }}>
            <span style={{ fontSize: 60, fontWeight: 800, lineHeight: 1, letterSpacing: '-.03em' }}>{total.toLocaleString('fr-FR')}</span>
            <span style={{ fontSize: 18, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>pts</span>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.55)', marginTop: 8 }}>
            {clients.length > 0
              ? `Dans ${clients.length} restaurant${clients.length > 1 ? 's' : ''}`
              : 'Scannez pour commencer'}
          </p>
        </div>
      </div>

      {/* Restaurant list */}
      <div style={{ padding: '28px 20px 0' }}>
        {clients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏪</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#1C1C1E', marginBottom: 6 }}>Aucun restaurant encore</p>
            <p style={{ fontSize: 14, color: '#8E8E93', lineHeight: 1.5, maxWidth: 240, margin: '0 auto 20px' }}>
              Scannez le QR code d'un restaurant pour l'ajouter à votre portefeuille.
            </p>
            <button onClick={onScan} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#185FA5', color: '#fff', borderRadius: 14, padding: '12px 22px', fontSize: 14, fontWeight: 700 }}>
              <IconScan /> Scanner maintenant
            </button>
          </div>
        ) : (
          <>
            <p className="section-title">Mes restaurants</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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

  return (
    <button onClick={onClick} style={{ background: '#fff', borderRadius: 18, padding: '16px', textAlign: 'left', display: 'block', width: '100%', boxShadow: '0 2px 16px rgba(0,0,0,.07)' }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg,#185FA5,#0D3E72)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, flexShrink: 0 }}>
          {name[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#1C1C1E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
          <p style={{ fontSize: 13, color: '#8E8E93', marginTop: 2 }}>{client.total_visits ?? 0} visite{(client.total_visits ?? 0) > 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#1C1C1E', lineHeight: 1, letterSpacing: '-.02em' }}>{pts.toLocaleString('fr-FR')}</p>
            <p style={{ fontSize: 10, color: '#8E8E93', marginTop: 1, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>pts</p>
          </div>
          <div style={{ color: '#C7C7CC', marginTop: 2 }}><IconChevron /></div>
        </div>
      </div>

      {/* Tier & Progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: tier.color, background: tier.bg, padding: '3px 9px', borderRadius: 99 }}>{tier.name}</span>
          {prog.next
            ? <span style={{ fontSize: 11, color: '#8E8E93' }}>encore {prog.toNext} pts → {prog.next.name}</span>
            : <span style={{ fontSize: 11, color: tier.color, fontWeight: 600 }}>Palier maximum ✨</span>}
        </div>
        <div style={{ height: 5, background: '#F2F2F7', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${prog.pct}%`, background: tier.color, borderRadius: 99, transition: 'width .6s cubic-bezier(.4,0,.2,1)' }} />
        </div>
      </div>
    </button>
  )
}

// ─── Detail screen ────────────────────────────────────────────────────────────

function DetailScreen({ client, clientName, onBack }: {
  client: Client; clientName: string; onBack: () => void
}) {
  const tier  = tierFor(client.points_balance)
  const prog  = tierProgress(client.points_balance)
  const rName = client.restaurants?.name ?? '—'
  const pts   = client.points_balance || 0

  const [rewards,    setRewards]    = useState<Reward[]>([])
  const [rewardsLoaded, setRewardsLoaded] = useState(false)
  const [confirming, setConfirming] = useState<Reward | null>(null)
  const [sent,       setSent]       = useState<Set<string>>(new Set())
  const [sending,    setSending]    = useState(false)
  const [reqError,   setReqError]   = useState('')

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
      <div style={{ background: 'linear-gradient(160deg,#0D2B57 0%,#185FA5 100%)', padding: '20px 20px 28px', color: '#fff' }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.25)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconBack />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18, marginBottom: 22 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 28, flexShrink: 0 }}>
            {rName[0]?.toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em' }}>{rName}</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', marginTop: 3 }}>
              {client.total_visits ?? 0} visite{(client.total_visits ?? 0) > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Balance card */}
        <div style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 20, padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>Votre solde</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                <span style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, letterSpacing: '-.03em' }}>{pts.toLocaleString('fr-FR')}</span>
                <span style={{ fontSize: 16, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>pts</span>
              </div>
            </div>
            <span style={{ background: '#fff', color: tier.color, fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 99, marginTop: 4 }}>{tier.name}</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,.2)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${prog.pct}%`, background: '#FCD34D', borderRadius: 99, transition: 'width .6s ease' }} />
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', marginTop: 10 }}>
            {prog.next
              ? <>Encore <strong style={{ color: '#fff' }}>{prog.toNext} pts</strong> pour atteindre <strong style={{ color: '#FCD34D' }}>{prog.next.name}</strong></>
              : 'Vous êtes au palier maximum ✨'}
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '24px 20px' }}>

        {/* Rewards */}
        {rewardsLoaded && (
          <div style={{ marginBottom: 28 }}>
            <p className="section-title">Récompenses disponibles</p>
            {rewards.length === 0 ? (
              <div className="card" style={{ padding: '24px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>🎁</p>
                <p style={{ fontSize: 14, color: '#8E8E93' }}>Aucune récompense disponible pour ce restaurant.</p>
              </div>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rewards.map(r => {
                const canAfford = pts >= r.points_cost
                const isSent    = sent.has(r.id)
                return (
                  <div key={r.id} className="card" style={{ opacity: canAfford ? 1 : .6 }}>
                    <div className="card-row" style={{ gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: canAfford ? '#EBF3FF' : '#F2F2F7', color: canAfford ? '#185FA5' : '#8E8E93', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>
                        🎁
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1E' }}>{r.name}</p>
                        {r.description && <p style={{ fontSize: 12, color: '#8E8E93', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</p>}
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#185FA5', marginTop: 3 }}>{r.points_cost.toLocaleString('fr-FR')} pts</p>
                      </div>
                      {isSent ? (
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', background: '#F0FDF4', padding: '7px 12px', borderRadius: 99, whiteSpace: 'nowrap', flexShrink: 0 }}>Envoyé ✓</span>
                      ) : (
                        <button
                          onClick={() => canAfford && !isSent && setConfirming(r)}
                          disabled={!canAfford}
                          style={{ background: canAfford ? '#185FA5' : '#E5E7EB', color: canAfford ? '#fff' : '#9CA3AF', borderRadius: 10, padding: '9px 15px', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
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
            <div className="card" style={{ padding: '28px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>🧾</p>
              <p style={{ fontSize: 14, color: '#8E8E93' }}>Aucune visite enregistrée.</p>
            </div>
          ) : (
            <div className="card">
              {client.visits.map((v, i) => (
                <div key={v.id ?? i} className="card-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: '#F2F2F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
                      🛒
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#1C1C1E' }}>{v.amount_paid} MAD</p>
                      <p style={{ fontSize: 12, color: '#8E8E93', marginTop: 1 }}>{ago(v.created_at)}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#16A34A' }}>+{v.points_earned} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm modal */}
      {confirming && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'flex-end', zIndex: 200, padding: '0 16px 40px' }}>
          <div style={{ background: '#fff', borderRadius: 28, padding: '32px 24px', width: '100%', maxWidth: 440, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🎁</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1C1C1E', marginBottom: 8 }}>{confirming.name}</h3>
            {reqError && <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 8 }}>{reqError}</p>}
            <p style={{ fontSize: 15, color: '#8E8E93', lineHeight: 1.6, marginBottom: 28 }}>
              Vous allez utiliser <strong style={{ color: '#185FA5' }}>{confirming.points_cost} pts</strong>.<br/>
              Le restaurant doit valider votre demande.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setConfirming(null); setReqError('') }}
                style={{ flex: 1, padding: '14px', borderRadius: 14, border: '1.5px solid #E5E7EB', fontSize: 15, fontWeight: 600, color: '#6B7280' }}>
                Annuler
              </button>
              <button onClick={() => requestReward(confirming)} disabled={sending}
                style={{ flex: 1, padding: '14px', borderRadius: 14, background: '#185FA5', color: '#fff', fontSize: 15, fontWeight: 700 }}>
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
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F2F2F7' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #E5E5EA', borderTopColor: '#185FA5', animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ─── App root ─────────────────────────────────────────────────────────────────

export default function ClientApp() {
  const [clients,     setClients]     = useState<Client[]>([])
  const [clientName,  setClientName]  = useState('')
  const [phone,       setPhone]       = useState('')
  const [screen,      setScreen]      = useState<'home' | string>('home')
  const [showScanner, setShowScanner] = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [hasPhone,    setHasPhone]    = useState(false)

  // Extracted so it can be called after scan too
  const loadData = useCallback(async (p: string) => {
    try {
      const res = await fetch('/api/client/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: p }),
      })
      const d   = await res.json()
      if (Array.isArray(d)) {
        setClients(d)
        // Sync name from DB if available
        if (d.length > 0 && d[0].name) {
          setClientName(d[0].name)
          localStorage.setItem('taghra_client_name', d[0].name)
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    const p = localStorage.getItem('taghra_client_phone')
    const n = localStorage.getItem('taghra_client_name') ?? ''
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

  function handlePhoneLogin(p: string) {
    localStorage.setItem('taghra_client_phone', p)
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
        const p = localStorage.getItem('taghra_client_phone')
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
