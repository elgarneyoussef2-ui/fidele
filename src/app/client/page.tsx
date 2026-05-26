'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'

const ScannerScreen = lazy(() => import('./ScannerScreen'))

// ─── Types ────────────────────────────────────────────────────────────────────

type Visit  = { amount_paid: number; points_earned: number; created_at: string }
type Client = {
  id: string; restaurant_id: string; name: string; phone: string
  points_balance: number; total_visits: number; last_visit_at: string | null
  restaurants: { id: string; name: string }
  visits: Visit[]
}
type Reward = { id: string; name: string; description: string; points_cost: number }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIERS = [
  { name: 'Bronze', min: 0,    max: 500,  color: '#D97706', bg: '#FFFBEB', dot: '#D97706' },
  { name: 'Argent', min: 501,  max: 1000, color: '#64748B', bg: '#F8FAFC', dot: '#94A3B8' },
  { name: 'Or',     min: 1001, max: null, color: '#B45309', bg: '#FEFCE8', dot: '#CA8A04' },
]
const tierFor  = (p: number) => TIERS.find(t => p >= t.min && (t.max == null || p <= t.max)) ?? TIERS[0]
const nextTier = (p: number) => { const i = TIERS.indexOf(tierFor(p)); return TIERS[i + 1] ?? null }
const progress = (p: number) => {
  const t = tierFor(p); const n = nextTier(p)
  if (!n) return { pct: 100, toNext: 0, next: null }
  return { pct: Math.round(((p - t.min) / (n.min - t.min)) * 100), toNext: n.min - p, next: n }
}
const ago = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1)  return 'À l\'instant'
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}j`
}
const ini = (name: string) => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

// ─── CSS ──────────────────────────────────────────────────────────────────────

const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: #F5F5F7; -webkit-font-smoothing: antialiased; }
  body { font-family: 'Inter', system-ui, sans-serif; color: #1C1C1E; }
  button { font-family: inherit; cursor: pointer; border: none; background: none; }
  button:active { transform: scale(.97); transition: transform .1s; }

  .app-root    { display: flex; min-height: 100dvh; background: #F5F5F7; }
  .sidebar     { display: none; }
  .main        { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  .scroll-area { flex: 1; overflow-y: auto; padding-bottom: 80px; }
  .tab-bar     {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
    background: rgba(255,255,255,.88); backdrop-filter: blur(24px) saturate(180%);
    border-top: .5px solid rgba(0,0,0,.1);
    display: flex;
    padding: 8px 0 calc(8px + env(safe-area-inset-bottom, 0px));
  }
  .tab-btn     { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 4px 0; }
  .tab-label   { font-size: 10px; font-weight: 600; letter-spacing: .01em; }

  @media (min-width: 1024px) {
    .sidebar { display: flex; flex-direction: column; width: 240px; flex-shrink: 0;
               background: #fff; border-right: 1px solid #E5E5EA;
               position: sticky; top: 0; height: 100dvh; }
    .tab-bar { display: none; }
    .scroll-area { padding-bottom: 32px; }
  }
`

// ─── Sidebar (desktop) ────────────────────────────────────────────────────────

function Sidebar({ tab, onScan }: { tab: 'home' | 'scan'; onScan: () => void }) {
  const items = [
    { id: 'home', label: 'Accueil',  path: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z' },
    { id: 'scan', label: 'Scanner',  path: null },
  ]
  return (
    <div className="sidebar">
      <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid #F2F2F7' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#185FA5' }}>Taghra</div>
        <div style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>Portefeuille fidélité</div>
      </div>
      <nav style={{ padding: '12px 10px', flex: 1 }}>
        {items.map(item => (
          <button key={item.id}
            onClick={item.id === 'scan' ? onScan : undefined}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, marginBottom: 2, background: tab === item.id ? '#EBF3FF' : 'transparent', color: tab === item.id ? '#185FA5' : '#6B7280', fontWeight: tab === item.id ? 600 : 500, fontSize: 14, textAlign: 'left' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {item.path
                ? <path d={item.path}/>
                : <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>}
            </svg>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

// ─── Tab bar (mobile) ─────────────────────────────────────────────────────────

function TabBar({ tab, onScan }: { tab: 'home' | 'scan'; onScan: () => void }) {
  const tabs = [
    { id: 'home',  label: 'Accueil',  onClick: undefined,
      icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/> },
    { id: 'scan',  label: 'Scanner',  onClick: onScan,
      icon: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></> },
  ]
  return (
    <nav className="tab-bar">
      {tabs.map(t => (
        <button key={t.id} className="tab-btn" onClick={t.onClick}
          style={{ color: tab === t.id ? '#185FA5' : '#8E8E93' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{t.icon}</svg>
          <span className="tab-label">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}

// ─── Welcome ──────────────────────────────────────────────────────────────────

function WelcomeScreen({ onScan }: { onScan: () => void }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg, #185FA5, #0F4C75)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 16px 40px rgba(24,95,165,.3)' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1C1C1E', marginBottom: 10, letterSpacing: '-.02em' }}>Bienvenue sur Taghra</h1>
      <p style={{ fontSize: 15, color: '#8E8E93', lineHeight: 1.6, maxWidth: 260, marginBottom: 36 }}>
        Scannez le QR code de votre restaurant pour commencer à cumuler des points fidélité.
      </p>
      <button onClick={onScan} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#185FA5', color: '#fff', borderRadius: 16, padding: '15px 28px', fontSize: 16, fontWeight: 700, boxShadow: '0 8px 24px rgba(24,95,165,.35)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        Scanner un QR code
      </button>
    </div>
  )
}

// ─── Home / Wallet ────────────────────────────────────────────────────────────

function HomeScreen({ clients, name, onOpen }: { clients: Client[]; name: string; onOpen: (id: string) => void }) {
  const total = clients.reduce((s, c) => s + (c.points_balance || 0), 0)

  return (
    <div style={{ padding: '0 0 8px' }}>
      {/* Header */}
      <div style={{ padding: '24px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 13, color: '#8E8E93', fontWeight: 500 }}>Bonjour</p>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1C1C1E', letterSpacing: '-.02em', marginTop: 1 }}>{name}</h2>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #185FA5, #0F4C75)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
          {ini(name)}
        </div>
      </div>

      {/* Balance card */}
      <div style={{ margin: '16px 20px 0' }}>
        <div style={{ background: 'linear-gradient(135deg, #0F2A5C 0%, #185FA5 60%, #2176C2 100%)', borderRadius: 22, padding: '22px', color: '#fff', boxShadow: '0 20px 48px -12px rgba(24,95,165,.5)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
          <div style={{ position: 'absolute', bottom: -20, right: 30, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)' }}>Total fidélité</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 56, fontWeight: 800, lineHeight: 1, letterSpacing: '-.03em' }}>{total.toLocaleString('fr-FR')}</span>
            <span style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', fontWeight: 500 }}>pts</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginTop: 6 }}>
            dans {clients.length} restaurant{clients.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Restaurant list */}
      <div style={{ padding: '24px 20px 0' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 12 }}>Mes restaurants</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {clients.map(c => <RestoCard key={c.id} client={c} onClick={() => onOpen(c.id)} />)}
        </div>
      </div>
    </div>
  )
}

function RestoCard({ client, onClick }: { client: Client; onClick: () => void }) {
  const tier  = tierFor(client.points_balance)
  const prog  = progress(client.points_balance)
  const rName = client.restaurants?.name ?? '—'

  return (
    <button onClick={onClick} style={{ background: '#fff', borderRadius: 18, padding: '16px', border: '1px solid rgba(0,0,0,.06)', textAlign: 'left', display: 'block', width: '100%', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg, #185FA5, #0F4C75)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20, flexShrink: 0 }}>
          {rName[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1C1C1E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rName}</p>
          <p style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>{client.total_visits ?? 0} visite{(client.total_visits ?? 0) > 1 ? 's' : ''}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#1C1C1E', lineHeight: 1, letterSpacing: '-.02em' }}>{(client.points_balance || 0).toLocaleString('fr-FR')}</p>
          <p style={{ fontSize: 10, color: '#8E8E93', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>pts</p>
        </div>
      </div>
      {/* Progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: tier.color, background: tier.bg, padding: '2px 8px', borderRadius: 99 }}>{tier.name}</span>
          {prog.next && <span style={{ fontSize: 11, color: '#8E8E93' }}>+{prog.toNext} pts → {prog.next.name}</span>}
        </div>
        <div style={{ height: 4, background: '#F2F2F7', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${prog.pct}%`, background: tier.color, borderRadius: 99, transition: 'width .6s ease' }} />
        </div>
      </div>
    </button>
  )
}

// ─── Restaurant detail ────────────────────────────────────────────────────────

function DetailScreen({ client, clientName, onBack }: { client: Client; clientName: string; onBack: () => void }) {
  const tier  = tierFor(client.points_balance)
  const prog  = progress(client.points_balance)
  const rName = client.restaurants?.name ?? '—'

  const [rewards,    setRewards]    = useState<Reward[]>([])
  const [confirming, setConfirming] = useState<Reward | null>(null)
  const [sent,       setSent]       = useState<Set<string>>(new Set())
  const [sending,    setSending]    = useState(false)

  useEffect(() => {
    fetch(`/api/rewards?restaurantId=${client.restaurant_id}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setRewards(Array.isArray(d) ? d : []))
  }, [client.restaurant_id])

  async function requestReward(r: Reward) {
    setSending(true)
    await fetch('/api/redemption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: client.id, restaurantId: client.restaurant_id, rewardId: r.id, rewardName: r.name, rewardPoints: r.points_cost, clientName }),
    })
    setSent(prev => new Set(prev).add(r.id))
    setConfirming(null)
    setSending(false)
  }

  return (
    <div>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg, #0F2A5C 0%, #185FA5 100%)', padding: '20px 20px 24px', color: '#fff' }}>
        <button onClick={onBack} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16, marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 26, flexShrink: 0 }}>
            {rName[0]?.toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' }}>{rName}</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', marginTop: 2 }}>{client.total_visits ?? 0} visite{(client.total_visits ?? 0) > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Balance */}
        <div style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 18, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)' }}>Solde</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, letterSpacing: '-.03em' }}>{(client.points_balance || 0).toLocaleString('fr-FR')}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,.55)', fontWeight: 500 }}>pts</span>
              </div>
            </div>
            <span style={{ background: '#fff', color: tier.color, fontSize: 12, fontWeight: 700, padding: '5px 11px', borderRadius: 99 }}>{tier.name}</span>
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,.2)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${prog.pct}%`, background: '#FCD34D', borderRadius: 99, transition: 'width .6s ease' }} />
          </div>
          {prog.next && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 8 }}>
              Encore <strong style={{ color: '#fff' }}>{prog.toNext} pts</strong> avant {prog.next.name}
            </p>
          )}
        </div>
      </div>

      <div style={{ padding: '20px' }}>

        {/* Rewards */}
        {rewards.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 12 }}>Récompenses</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rewards.map(r => {
                const canAfford = client.points_balance >= r.points_cost
                const isSent    = sent.has(r.id)
                return (
                  <div key={r.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(0,0,0,.06)', opacity: canAfford ? 1 : .55 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1E' }}>{r.name}</p>
                      {r.description && <p style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>{r.description}</p>}
                      <p style={{ fontSize: 12, color: '#185FA5', fontWeight: 700, marginTop: 4 }}>{r.points_cost} pts</p>
                    </div>
                    {isSent ? (
                      <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 700, background: '#F0FDF4', padding: '6px 12px', borderRadius: 99, whiteSpace: 'nowrap' }}>Envoyé ✓</span>
                    ) : (
                      <button onClick={() => canAfford && setConfirming(r)} disabled={!canAfford}
                        style={{ background: canAfford ? '#185FA5' : '#E5E7EB', color: canAfford ? '#fff' : '#9CA3AF', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        Utiliser
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Visit history */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 12 }}>Historique</p>
          {(client.visits ?? []).length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, padding: '24px', textAlign: 'center', color: '#8E8E93', fontSize: 14, border: '1px solid rgba(0,0,0,.06)' }}>Aucune visite encore.</div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(0,0,0,.06)' }}>
              {client.visits.map((v, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderBottom: i < client.visits.length - 1 ? '1px solid #F5F5F7' : 'none' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1C1C1E' }}>{v.amount_paid} MAD</p>
                    <p style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>{ago(v.created_at)}</p>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#16A34A' }}>+{v.points_earned} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm modal */}
      {confirming && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100, padding: '0 16px 32px' }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: '28px 24px', width: '100%', maxWidth: 420, textAlign: 'center' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🎁</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1C1C1E', marginBottom: 8 }}>{confirming.name}</h3>
            <p style={{ fontSize: 14, color: '#8E8E93', lineHeight: 1.6, marginBottom: 24 }}>
              Utiliser <strong style={{ color: '#185FA5' }}>{confirming.points_cost} pts</strong> pour cette récompense ?<br/>
              Le restaurant devra valider votre demande.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirming(null)} style={{ flex: 1, padding: '13px', borderRadius: 14, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 15, fontWeight: 600, color: '#6B7280' }}>Annuler</button>
              <button onClick={() => requestReward(confirming)} disabled={sending}
                style={{ flex: 1, padding: '13px', borderRadius: 14, background: '#185FA5', color: '#fff', fontSize: 15, fontWeight: 700 }}>
                {sending ? '…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #E5E5EA', borderTopColor: '#185FA5', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function ClientApp() {
  const router = useRouter()

  const [clients,     setClients]     = useState<Client[]>([])
  const [clientName,  setClientName]  = useState('')
  const [screen,      setScreen]      = useState<'home' | string>('home')
  const [showScanner, setShowScanner] = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [hasPhone,    setHasPhone]    = useState(false)

  useEffect(() => {
    const phone = localStorage.getItem('taghra_client_phone')
    const name  = localStorage.getItem('taghra_client_name') ?? ''
    if (!phone) { setLoading(false); return }
    setHasPhone(true)
    setClientName(name)
    fetch(`/api/client/data?phone=${encodeURIComponent(phone)}`)
      .then(r => r.json())
      .then((d: Client[]) => { setClients(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const activeClient = screen !== 'home' ? clients.find(c => c.id === screen) : null
  const tab          = screen === 'home' ? 'home' : 'home'

  if (loading) return <><style>{BASE_CSS}</style><LoadingScreen /></>

  if (!hasPhone) return (
    <>
      <style>{BASE_CSS}</style>
      <WelcomeScreen onScan={() => setShowScanner(true)} />
      {showScanner && <Suspense fallback={null}><ScannerScreen onClose={() => setShowScanner(false)} /></Suspense>}
    </>
  )

  return (
    <>
      <style>{BASE_CSS}</style>
      <div className="app-root">
        <Sidebar tab={tab} onScan={() => setShowScanner(true)} />
        <div className="main">
          <div className="scroll-area">
            {screen === 'home' && <HomeScreen clients={clients} name={clientName} onOpen={id => setScreen(id)} />}
            {activeClient      && <DetailScreen client={activeClient} clientName={clientName} onBack={() => setScreen('home')} />}
          </div>
          <TabBar tab={tab} onScan={() => setShowScanner(true)} />
        </div>
      </div>
      {showScanner && (
        <Suspense fallback={null}>
          <ScannerScreen onClose={() => { setShowScanner(false); router.refresh() }} />
        </Suspense>
      )}
    </>
  )
}
