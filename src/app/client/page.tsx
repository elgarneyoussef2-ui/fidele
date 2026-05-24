'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'

const ScannerScreen = lazy(() => import('./ScannerScreen'))

// ─── Types ───────────────────────────────────────────────────────────────────

type Visit = { amount_paid: number; points_earned: number; created_at: string }
type ClientRecord = {
  id: string
  restaurant_id: string
  name: string
  phone: string
  points_balance: number
  total_visits: number
  last_visit_at: string | null
  restaurants: { id: string; name: string }
  visits: Visit[]
}

// ─── Tier helpers ─────────────────────────────────────────────────────────────

const TIERS = [
  { id: 'bronze', name: 'Bronze', min: 0,    max: 500,  color: '#B45309', soft: '#FEF3C7', deep: '#7C2D12' },
  { id: 'argent', name: 'Argent', min: 501,  max: 1000, color: '#64748B', soft: '#F1F5F9', deep: '#334155' },
  { id: 'or',     name: 'Or',     min: 1001, max: null, color: '#CA8A04', soft: '#FEF9C3', deep: '#713F12' },
]

function tierFor(pts: number) {
  return TIERS.find(t => pts >= t.min && (t.max == null || pts <= t.max)) || TIERS[0]
}
function nextTierFor(pts: number) {
  const t = tierFor(pts); const idx = TIERS.indexOf(t); return TIERS[idx + 1] || null
}
function progressInTier(pts: number) {
  const t = tierFor(pts); const nxt = nextTierFor(pts)
  if (!nxt) return { pct: 100, toNext: 0, next: null }
  return { pct: Math.min(100, Math.round(((pts - t.min) / (nxt.min - t.min)) * 100)), toNext: nxt.min - pts, next: nxt }
}
function timeAgo(iso: string) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'À l\'instant'
  if (min < 60) return `Il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `Il y a ${d}j`
  return `Il y a ${Math.floor(d / 30)} mois`
}

// ─── Atoms ───────────────────────────────────────────────────────────────────

function ProgressBar({ pct, color = '#185FA5', track = '#E5E7EB', height = 6 }: { pct: number; color?: string; track?: string; height?: number }) {
  return (
    <div style={{ height, background: track, borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width .6s cubic-bezier(.4,0,.2,1)' }} />
    </div>
  )
}

function TierBadge({ points }: { points: number }) {
  const tier = tierFor(points)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: tier.soft, color: tier.deep, border: `1px solid ${tier.color}33` }}>
      <span style={{ width: 7, height: 7, borderRadius: 99, background: tier.color, display: 'inline-block' }} />
      {tier.name}
    </span>
  )
}

// ─── Welcome / scan prompt ────────────────────────────────────────────────────

function WelcomeScreen({ onScan }: { onScan: () => void }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center', background: '#F2F2F7' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🌟</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-.01em', fontFamily: '"Source Serif 4", Georgia, serif' }}>Bienvenue sur Taghra</div>
      <div style={{ fontSize: 15, color: '#8E8E93', marginTop: 10, lineHeight: 1.6, maxWidth: 280 }}>
        Scannez le QR code affiché par votre restaurant pour commencer à cumuler des points.
      </div>
      <button onClick={onScan} style={{ marginTop: 32, background: '#185FA5', color: '#fff', border: 'none', borderRadius: 16, padding: '16px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        Scanner un QR code
      </button>
      <div style={{ marginTop: 16, fontSize: 12, color: '#C7C7CC' }}>
        Votre historique apparaîtra ici après votre première visite.
      </div>
    </div>
  )
}

// ─── Wallet screen ────────────────────────────────────────────────────────────

function WalletScreen({ clients, clientName, onOpen }: { clients: ClientRecord[]; clientName: string; onOpen: (id: string) => void }) {
  const total = clients.reduce((s, c) => s + (c.points_balance || 0), 0)

  return (
    <div className="fidele-content" style={{ background: '#F2F2F7', minHeight: '100%' }}>
      <div style={{ padding: '24px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: '#8E8E93', fontWeight: 500 }}>Bonjour</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-.01em' }}>{clientName}</div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 99, background: 'linear-gradient(135deg, #185FA5, #0F4C75)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
          {clientName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding: '8px 20px 0' }}>
        <div style={{ background: 'linear-gradient(135deg, #0F2A5C 0%, #185FA5 55%, #2A75C2 100%)', borderRadius: 24, padding: '22px 22px 20px', color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 36px -16px rgba(24,95,165,.4)' }}>
          <div style={{ position: 'absolute', right: -40, top: -40, width: 140, height: 140, borderRadius: 99, background: 'radial-gradient(circle, #F2C84B 0%, transparent 70%)', opacity: .35, pointerEvents: 'none' }} />
          <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.65)', fontWeight: 600 }}>Portefeuille fidélité</div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1, fontFamily: '"Source Serif 4", Georgia, serif', letterSpacing: '-.02em' }}>
              {total.toLocaleString('fr-FR')}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', fontWeight: 500 }}>points</div>
          </div>
          <div style={{ marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,.7)' }}>
            cumulés dans <strong style={{ color: '#fff' }}>{clients.length} restaurant{clients.length > 1 ? 's' : ''}</strong>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-.01em' }}>Mes restaurants</div>
        <div style={{ fontSize: 13, color: '#185FA5', fontWeight: 600 }}>{clients.length}</div>
      </div>

      <div className="resto-grid" style={{ padding: '0 20px' }}>
        {clients.map(c => <RestoCard key={c.id} client={c} onClick={() => onOpen(c.id)} />)}
      </div>
    </div>
  )
}

function RestoCard({ client, onClick }: { client: ClientRecord; onClick: () => void }) {
  const tier = tierFor(client.points_balance)
  const prog = progressInTier(client.points_balance)
  const name = client.restaurants?.name ?? '—'

  return (
    <button onClick={onClick} style={{ background: '#fff', borderRadius: 20, padding: 16, border: '1px solid rgba(0,0,0,.06)', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,.04), 0 4px 14px rgba(0,0,0,.04)', textAlign: 'left', display: 'block', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #185FA5, #0F4C75)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Source Serif 4", Georgia, serif', fontWeight: 600, fontSize: 20, flexShrink: 0 }}>
          {name[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0A0A0A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          <div style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>{client.total_visits ?? 0} visite{(client.total_visits ?? 0) > 1 ? 's' : ''}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0A0A0A', lineHeight: 1, fontFamily: '"Source Serif 4", Georgia, serif' }}>{(client.points_balance || 0).toLocaleString('fr-FR')}</div>
          <div style={{ fontSize: 10, color: '#8E8E93', marginTop: 3, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600 }}>pts</div>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <TierBadge points={client.points_balance} />
          <div style={{ fontSize: 11, color: '#8E8E93', fontWeight: 500 }}>
            {prog.next ? <span>+{prog.toNext} pts → <span style={{ color: prog.next.deep, fontWeight: 600 }}>{prog.next.name}</span></span> : 'Palier maximum'}
          </div>
        </div>
        <ProgressBar pct={prog.pct} color={tier.color} track="#F2F2F7" height={5} />
      </div>
    </button>
  )
}

// ─── Restaurant detail ────────────────────────────────────────────────────────

function RestoScreen({ client, onBack }: { client: ClientRecord; onBack: () => void }) {
  const tier = tierFor(client.points_balance)
  const prog = progressInTier(client.points_balance)
  const name = client.restaurants?.name ?? '—'

  return (
    <div className="fidele-content" style={{ background: '#F2F2F7', minHeight: '100%' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #185FA5 0%, #0F4C75 60%, #0A2540 100%)', padding: '24px 20px 22px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 0%, rgba(255,255,255,.14), transparent 50%)', pointerEvents: 'none' }} />
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 99, background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.25)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: '"Source Serif 4", Georgia, serif', fontWeight: 600, fontSize: 28 }}>
            {name[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.01em', fontFamily: '"Source Serif 4", Georgia, serif' }}>{name}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginTop: 2 }}>{client.total_visits ?? 0} visite{(client.total_visits ?? 0) > 1 ? 's' : ''}</div>
          </div>
        </div>

        <div style={{ marginTop: 20, background: 'rgba(255,255,255,.12)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 18, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.65)', fontWeight: 600 }}>Votre solde</div>
              <div style={{ fontSize: 44, fontWeight: 700, lineHeight: 1, marginTop: 6, fontFamily: '"Source Serif 4", Georgia, serif' }}>
                {(client.points_balance || 0).toLocaleString('fr-FR')}
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', fontWeight: 500, marginLeft: 6 }}>pts</span>
              </div>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: '#fff', color: tier.deep }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: tier.color, display: 'inline-block' }} />
              {tier.name}
            </span>
          </div>
          <div style={{ marginTop: 14 }}>
            <ProgressBar pct={prog.pct} color="#F2C84B" track="rgba(255,255,255,.18)" height={6} />
            <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,.8)' }}>
              {prog.next ? <>Plus que <strong style={{ color: '#fff' }}>{prog.toNext} pts</strong> avant le palier <strong style={{ color: '#F2C84B' }}>{prog.next.name}</strong></> : 'Vous êtes au palier maximum ✨'}
            </div>
          </div>
        </div>
      </div>

      {/* Activity */}
      <div style={{ padding: '20px' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', marginBottom: 12 }}>Historique des visites</div>
        {(client.visits ?? []).length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 18, padding: '24px', textAlign: 'center', color: '#8E8E93', fontSize: 14 }}>Aucune visite enregistrée.</div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}>
            {client.visits.map((v, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: i === client.visits.length - 1 ? 'none' : '1px solid #F2F2F7' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>Visite — {v.amount_paid} MAD</div>
                  <div style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>{timeAgo(v.created_at)}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#16A34A' }}>+{v.points_earned} pts</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────

function TabBar({ active, onScan }: { active: 'home' | 'resto'; onScan: () => void }) {
  const tabs = [
    { id: 'home',    label: 'Accueil', icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/> },
    { id: 'scan',    label: 'Scanner', icon: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></> },
    { id: 'profile', label: 'Profil',  icon: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></> },
  ]
  return (
    <div className="fidele-tabbar">
      {tabs.map(t => (
        <button key={t.id} onClick={t.id === 'scan' ? onScan : undefined} style={{ flex: 1, padding: '6px 4px', background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: active === t.id ? '#185FA5' : '#8E8E93', cursor: 'pointer' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{t.icon}</svg>
          <span style={{ fontSize: 10, fontWeight: 600 }}>{t.label}</span>
        </button>
      ))}
    </div>
  )
}

function DesktopSidebar({ active, onScan }: { active: 'home' | 'resto'; onScan: () => void }) {
  const items = [
    { id: 'home', label: 'Accueil',  icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/> },
    { id: 'scan', label: 'Scanner',  icon: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></> },
    { id: 'profile', label: 'Profil', icon: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></> },
  ]
  return (
    <div className="fidele-sidebar">
      <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid #F2F2F7' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#0A0A0A', fontFamily: '"Source Serif 4", Georgia, serif' }}>Taghra</div>
        <div style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>Portefeuille fidélité</div>
      </div>
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        {items.map(item => (
          <button key={item.id} onClick={item.id === 'scan' ? onScan : undefined} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, border: 'none', marginBottom: 2, background: active === item.id ? '#185FA514' : 'transparent', color: active === item.id ? '#185FA5' : '#6B7280', fontWeight: active === item.id ? 600 : 500, fontSize: 14, cursor: 'pointer', textAlign: 'left' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ClientApp() {
  const router = useRouter()
  const [clients,      setClients]      = useState<ClientRecord[]>([])
  const [clientName,   setClientName]   = useState('')
  const [screen,       setScreen]       = useState<{ name: 'wallet' } | { name: 'resto'; id: string }>({ name: 'wallet' })
  const [showScanner,  setShowScanner]  = useState(false)
  const [loading,      setLoading]      = useState(true)
  const [hasPhone,     setHasPhone]     = useState(false)

  useEffect(() => {
    const phone = localStorage.getItem('taghra_client_phone')
    const name  = localStorage.getItem('taghra_client_name') ?? ''
    if (!phone) { setLoading(false); return }
    setHasPhone(true)
    setClientName(name)

    fetch(`/api/client/data?phone=${encodeURIComponent(phone)}`)
      .then(r => r.json())
      .then((data: ClientRecord[]) => {
        setClients(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const currentClient = screen.name === 'resto' ? clients.find(c => c.id === screen.id) : null
  const activeTab     = screen.name === 'wallet' ? 'home' : 'resto'

  if (loading) {
    return (
      <>
        <style>{`* { box-sizing: border-box; } html, body { margin: 0; padding: 0; background: #F2F2F7; }`}</style>
        <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F2F2F7' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 99, border: '3px solid #E5E7EB', borderTopColor: '#185FA5', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ marginTop: 16, fontSize: 14, color: '#8E8E93' }}>Chargement…</div>
          </div>
        </div>
      </>
    )
  }

  if (!hasPhone) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700&display=swap'); * { box-sizing: border-box; } html, body { margin: 0; padding: 0; background: #F2F2F7; -webkit-font-smoothing: antialiased; } button { font-family: inherit; }`}</style>
        <WelcomeScreen onScan={() => setShowScanner(true)} />
        {showScanner && <Suspense fallback={null}><ScannerScreen onClose={() => setShowScanner(false)} /></Suspense>}
      </>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: #F2F2F7; -webkit-font-smoothing: antialiased; }
        button { transition: transform .1s; font-family: inherit; }
        button:active { transform: scale(.97); }
        .fidele-outer  { display: flex; flex-direction: row; min-height: 100dvh; }
        .fidele-sidebar { display: none; }
        .fidele-app    { flex: 1; min-width: 0; font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif; }
        .fidele-content { padding-bottom: 90px; }
        .resto-grid  { display: flex; flex-direction: column; gap: 12px; }
        .fidele-tabbar {
          position: fixed; bottom: 0; left: 0; right: 0;
          padding-bottom: env(safe-area-inset-bottom, 16px);
          padding-top: 8px; padding-left: 8px; padding-right: 8px;
          background: rgba(255,255,255,.86); backdrop-filter: blur(20px);
          border-top: 0.5px solid rgba(0,0,0,.08);
          display: flex; justify-content: space-around; z-index: 50;
        }
        @media (min-width: 640px) {
          .resto-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        }
        @media (min-width: 1024px) {
          html, body { background: #EAECF0; }
          .fidele-outer { background: #EAECF0; max-width: 1400px; margin: 0 auto; }
          .fidele-sidebar { display: flex; flex-direction: column; width: 260px; flex-shrink: 0; background: #fff; border-right: 1px solid rgba(0,0,0,.06); position: sticky; top: 0; height: 100dvh; overflow-y: auto; }
          .fidele-app { background: #F2F2F7; }
          .fidele-tabbar { display: none; }
          .fidele-content { padding-bottom: 48px; }
          .resto-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      <div className="fidele-outer">
        <DesktopSidebar active={activeTab} onScan={() => setShowScanner(true)} />
        <div className="fidele-app">
          {screen.name === 'wallet' && <WalletScreen clients={clients} clientName={clientName} onOpen={id => setScreen({ name: 'resto', id })} />}
          {screen.name === 'resto'  && currentClient && <RestoScreen client={currentClient} onBack={() => setScreen({ name: 'wallet' })} />}
          <TabBar active={activeTab} onScan={() => setShowScanner(true)} />
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
