'use client'

import { useState } from 'react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const TIERS = [
  { id: 'bronze', name: 'Bronze', min: 0,    max: 500,  color: '#B45309', soft: '#FEF3C7', deep: '#7C2D12' },
  { id: 'argent', name: 'Argent', min: 501,  max: 1000, color: '#64748B', soft: '#F1F5F9', deep: '#334155' },
  { id: 'or',     name: 'Or',     min: 1001, max: null, color: '#CA8A04', soft: '#FEF9C3', deep: '#713F12' },
]

function tierFor(points: number) {
  return TIERS.find(t => points >= t.min && (t.max == null || points <= t.max)) || TIERS[0]
}
function nextTierFor(points: number) {
  const t = tierFor(points)
  const idx = TIERS.indexOf(t)
  return TIERS[idx + 1] || null
}
function progressInTier(points: number) {
  const t = tierFor(points)
  const nxt = nextTierFor(points)
  if (!nxt) return { pct: 100, toNext: 0, next: null }
  const span = nxt.min - t.min
  const into = points - t.min
  return { pct: Math.min(100, Math.round((into / span) * 100)), toNext: nxt.min - points, next: nxt }
}

const INIT_RESTAURANTS = [
  {
    id: 'cafe-maure', name: 'Café Maure', tagline: 'Cuisine marocaine · Rabat',
    address: 'Kasbah des Oudayas, Rabat', logoChar: 'M',
    accent: '#185FA5', points: 1240, visits: 22, lastVisit: 'Hier, 19:42', joined: 'Membre depuis Mars 2025',
    cover: 'linear-gradient(135deg, #185FA5 0%, #0F4C75 60%, #0A2540 100%)',
  },
  {
    id: 'dar-naji', name: 'Dar Naji', tagline: 'Tajines & couscous · Casablanca',
    address: 'Bd. de la Corniche, Casablanca', logoChar: 'D',
    accent: '#C2410C', points: 680, visits: 9, lastVisit: 'Il y a 4 jours', joined: 'Membre depuis Janvier 2026',
    cover: 'linear-gradient(135deg, #C2410C 0%, #9A3412 60%, #4A1505 100%)',
  },
  {
    id: 'le-riad', name: "Le Riad d'Ahmed", tagline: 'Cuisine fine · Marrakech',
    address: 'Médina, Marrakech', logoChar: 'R',
    accent: '#4D7C0F', points: 320, visits: 4, lastVisit: 'Il y a 2 semaines', joined: 'Membre depuis Février 2026',
    cover: 'linear-gradient(135deg, #4D7C0F 0%, #365314 60%, #1A2E05 100%)',
  },
  {
    id: 'la-sqala', name: 'La Sqala', tagline: 'Grillades · Tanger',
    address: 'Place de la Sqala, Tanger', logoChar: 'S',
    accent: '#A16207', points: 90, visits: 2, lastVisit: 'Il y a 1 mois', joined: 'Membre depuis Avril 2026',
    cover: 'linear-gradient(135deg, #A16207 0%, #713F12 60%, #3F2008 100%)',
  },
]

const COMMON_REWARDS = [
  { id: 'the',      name: 'Thé à la menthe',  desc: 'Un verre offert',              points: 100,  icon: '🍵' },
  { id: 'dessert',  name: 'Dessert maison',    desc: 'Choix parmi la sélection',     points: 200,  icon: '🍮' },
  { id: 'discount', name: 'Réduction -15%',   desc: "Sur l'ensemble de la commande", points: 350,  icon: '%'  },
  { id: 'tajine',   name: 'Plat principal',    desc: 'Tajine ou couscous au choix',  points: 500,  icon: '🍲' },
  { id: 'repas2',   name: 'Repas pour 2',      desc: 'Entrée, plat, dessert',        points: 1000, icon: '🍽️' },
]

const REWARDS_BY_RESTO: Record<string, typeof COMMON_REWARDS> = {
  'cafe-maure': COMMON_REWARDS,
  'dar-naji':   [...COMMON_REWARDS.filter(r => r.id !== 'repas2'), { id: 'harira', name: 'Harira & dattes', desc: 'Soupe traditionnelle', points: 250, icon: '🥣' }],
  'le-riad':    [COMMON_REWARDS[0], COMMON_REWARDS[1], { id: 'mech', name: 'Méchoui partagé', desc: 'Pour 4 personnes', points: 1500, icon: '🍖' }, COMMON_REWARDS[2]],
  'la-sqala':   [COMMON_REWARDS[0], COMMON_REWARDS[1], { id: 'grill', name: 'Mixed grill', desc: 'Brochettes assorties', points: 600, icon: '🥩' }, COMMON_REWARDS[2]],
}

const ACTIVITY: Record<string, { date: string; label: string; delta: string }[]> = {
  'cafe-maure': [
    { date: 'Hier · 19:42',    label: 'Visite — 320 MAD',           delta: '+32'  },
    { date: '14 Mai · 13:20',  label: 'Visite — 180 MAD',           delta: '+18'  },
    { date: '02 Mai · 20:14',  label: 'Échangé · Dessert maison',   delta: '−200' },
    { date: '28 Avr · 21:05',  label: 'Visite — 450 MAD',           delta: '+45'  },
  ],
  'dar-naji':   [
    { date: 'Il y a 4 jours',  label: 'Visite — 240 MAD',           delta: '+24'  },
    { date: '12 Mai',          label: 'Échangé · Thé à la menthe',  delta: '−100' },
    { date: '03 Mai',          label: 'Visite — 380 MAD',           delta: '+38'  },
  ],
  'le-riad':    [
    { date: 'Il y a 2 semaines', label: 'Visite — 520 MAD',         delta: '+52'  },
    { date: '20 Avr',            label: 'Visite — 280 MAD',         delta: '+28'  },
  ],
  'la-sqala':   [
    { date: 'Il y a 1 mois',   label: 'Visite — 190 MAD',           delta: '+19'  },
  ],
}

type Resto = typeof INIT_RESTAURANTS[number]
type Reward = typeof COMMON_REWARDS[number]

// ─── Atoms ────────────────────────────────────────────────────────────────────

function ProgressBar({ pct, color = '#185FA5', track = '#E5E7EB', height = 6 }: { pct: number; color?: string; track?: string; height?: number }) {
  return (
    <div style={{ height, background: track, borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width .6s cubic-bezier(.4,0,.2,1)' }} />
    </div>
  )
}

function TierBadge({ points, size = 'sm' }: { points: number; size?: 'sm' | 'lg' }) {
  const tier = tierFor(points)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: size === 'lg' ? '6px 12px' : '3px 9px',
      borderRadius: 999, fontSize: size === 'lg' ? 13 : 11, fontWeight: 700,
      background: tier.soft, color: tier.deep, border: `1px solid ${tier.color}33`,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: 99, background: tier.color, display: 'inline-block' }} />
      {tier.name}
    </span>
  )
}

function RestoAvatar({ resto, size = 44 }: { resto: Resto; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 14, background: resto.cover, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Source Serif 4", Georgia, serif', fontWeight: 600,
      fontSize: size * 0.46, flexShrink: 0,
      boxShadow: '0 6px 14px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.18)',
    }}>{resto.logoChar}</div>
  )
}

// ─── Wallet screen ────────────────────────────────────────────────────────────

function WalletScreen({ restos, onOpen }: { restos: Resto[]; onOpen: (id: string) => void }) {
  const total = restos.reduce((s, r) => s + r.points, 0)

  return (
    <div style={{ background: '#F2F2F7', minHeight: '100%', paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ padding: '24px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: '#8E8E93', fontWeight: 500 }}>Bonjour</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-.01em' }}>Yassine</div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: 99,
          background: 'linear-gradient(135deg, #185FA5, #0F4C75)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 13,
        }}>YI</div>
      </div>

      {/* Hero card */}
      <div style={{ padding: '8px 20px 0' }}>
        <div style={{
          background: 'linear-gradient(135deg, #0F2A5C 0%, #185FA5 55%, #2A75C2 100%)',
          borderRadius: 24, padding: '22px 22px 20px', color: '#fff',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 24px 36px -16px rgba(24,95,165,.4)',
        }}>
          <div style={{ position: 'absolute', right: -40, top: -40, width: 140, height: 140, borderRadius: 99, background: 'radial-gradient(circle, #F2C84B 0%, transparent 70%)', opacity: .35, pointerEvents: 'none' }} />
          <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.65)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: '#F2C84B', display: 'inline-block' }} />
            Portefeuille fidélité
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1, fontFamily: '"Source Serif 4", Georgia, serif', letterSpacing: '-.02em' }}>
              {total.toLocaleString('fr-FR')}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', fontWeight: 500 }}>points</div>
          </div>
          <div style={{ marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,.7)' }}>
            cumulés dans <strong style={{ color: '#fff', fontWeight: 600 }}>{restos.length} restaurants</strong>
          </div>
        </div>
      </div>

      {/* Liste restaurants */}
      <div style={{ padding: '24px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-.01em' }}>Mes restaurants</div>
        <div style={{ fontSize: 13, color: '#185FA5', fontWeight: 600 }}>{restos.length}</div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {restos.map(r => <RestoCard key={r.id} resto={r} onClick={() => onOpen(r.id)} />)}
      </div>

      {/* Découvrir */}
      <div style={{ padding: '14px 20px 0' }}>
        <button style={{
          width: '100%', background: '#fff', border: '1.5px dashed #C7C7CC',
          borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, color: '#185FA5', fontWeight: 600, fontSize: 14, cursor: 'pointer',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
          </svg>
          Découvrir d'autres restaurants
        </button>
      </div>
    </div>
  )
}

function RestoCard({ resto, onClick }: { resto: Resto; onClick: () => void }) {
  const tier = tierFor(resto.points)
  const prog = progressInTier(resto.points)

  return (
    <button onClick={onClick} style={{
      background: '#fff', borderRadius: 20, padding: 16,
      border: '1px solid rgba(0,0,0,.06)', cursor: 'pointer',
      boxShadow: '0 1px 2px rgba(0,0,0,.04), 0 4px 14px rgba(0,0,0,.04)',
      textAlign: 'left', display: 'block', width: '100%',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <RestoAvatar resto={resto} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0A0A0A', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resto.name}</span>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: tier.color, flexShrink: 0, display: 'inline-block' }} />
          </div>
          <div style={{ fontSize: 12, color: '#8E8E93', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resto.tagline}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0A0A0A', lineHeight: 1, fontFamily: '"Source Serif 4", Georgia, serif' }}>
            {resto.points.toLocaleString('fr-FR')}
          </div>
          <div style={{ fontSize: 10, color: '#8E8E93', marginTop: 3, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600 }}>pts</div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <TierBadge points={resto.points} />
          <div style={{ fontSize: 11, color: '#8E8E93', fontWeight: 500 }}>
            {prog.next
              ? <span>+{prog.toNext} pts → <span style={{ color: prog.next.deep, fontWeight: 600 }}>{prog.next.name}</span></span>
              : 'Palier maximum'}
          </div>
        </div>
        <ProgressBar pct={prog.pct} color={tier.color} track="#F2F2F7" height={5} />
      </div>
    </button>
  )
}

// ─── Restaurant detail ────────────────────────────────────────────────────────

function RestoScreen({ resto, onBack, onRedeem }: { resto: Resto; onBack: () => void; onRedeem: (r: Reward) => void }) {
  const tier  = tierFor(resto.points)
  const prog  = progressInTier(resto.points)
  const [tab, setTab] = useState<'rewards' | 'activity'>('rewards')
  const rewards  = REWARDS_BY_RESTO[resto.id] || []
  const activity = ACTIVITY[resto.id] || []

  return (
    <div style={{ background: '#F2F2F7', minHeight: '100%', paddingBottom: 90 }}>
      {/* Hero */}
      <div style={{ background: resto.cover, padding: '24px 20px 22px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 0%, rgba(255,255,255,.14), transparent 50%)', pointerEvents: 'none' }} />

        {/* Back */}
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 99,
          background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,.2)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        {/* Info resto */}
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.25)', backdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            fontFamily: '"Source Serif 4", Georgia, serif', fontWeight: 600, fontSize: 28,
          }}>{resto.logoChar}</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.01em', fontFamily: '"Source Serif 4", Georgia, serif' }}>{resto.name}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginTop: 2 }}>{resto.address}</div>
          </div>
        </div>

        {/* Points + progression */}
        <div style={{
          marginTop: 20, background: 'rgba(255,255,255,.12)', backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,.18)', borderRadius: 18, padding: '16px 18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.65)', fontWeight: 600 }}>Votre solde</div>
              <div style={{ fontSize: 44, fontWeight: 700, lineHeight: 1, marginTop: 6, fontFamily: '"Source Serif 4", Georgia, serif' }}>
                {resto.points.toLocaleString('fr-FR')}
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', fontWeight: 500, marginLeft: 6 }}>pts</span>
              </div>
            </div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
              background: '#fff', color: tier.deep,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: tier.color, display: 'inline-block' }} />
              {tier.name}
            </span>
          </div>
          <div style={{ marginTop: 14 }}>
            <ProgressBar pct={prog.pct} color="#F2C84B" track="rgba(255,255,255,.18)" height={6} />
            <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,.8)' }}>
              {prog.next
                ? <>Plus que <strong style={{ color: '#fff' }}>{prog.toNext} pts</strong> avant le palier <strong style={{ color: '#F2C84B' }}>{prog.next.name}</strong></>
                : 'Vous êtes au palier maximum ✨'}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            { k: 'Visites',  v: resto.visits },
            { k: 'Dernière', v: resto.lastVisit.replace('Il y a ', '').replace('Hier, ', 'Hier') },
            { k: 'Cadeaux',  v: rewards.filter(r => resto.points >= r.points).length },
          ].map(s => (
            <div key={s.k} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{s.v}</div>
              <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', fontWeight: 600, marginTop: 2 }}>{s.k}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '14px 20px 0', display: 'flex', gap: 6 }}>
        {(['rewards', 'activity'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '9px 12px', borderRadius: 12, border: 'none',
            background: tab === t ? '#0A0A0A' : '#fff',
            color: tab === t ? '#fff' : '#0A0A0A',
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
            boxShadow: tab === t ? 'none' : '0 1px 2px rgba(0,0,0,.04)',
          }}>
            {t === 'rewards' ? 'Cadeaux' : 'Activité'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'rewards' && (
        <div style={{ padding: '14px 20px 0' }}>
          <div style={{ fontSize: 12, color: '#8E8E93', marginBottom: 10 }}>Échangez vos points contre des cadeaux.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rewards.map(r => <RewardCard key={r.id} reward={r} balance={resto.points} accent={resto.accent} onRedeem={() => onRedeem(r)} />)}
          </div>
        </div>
      )}

      {tab === 'activity' && (
        <div style={{ padding: '14px 20px 0' }}>
          <div style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}>
            {activity.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: i === activity.length - 1 ? 'none' : '1px solid #F2F2F7',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>{a.label}</div>
                  <div style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>{a.date}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: a.delta.startsWith('+') ? '#16A34A' : '#DC2626' }}>
                  {a.delta} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RewardCard({ reward, balance, accent, onRedeem }: { reward: Reward; balance: number; accent: string; onRedeem: () => void }) {
  const canRedeem = balance >= reward.points
  const missing = reward.points - balance
  const pct = Math.min(100, Math.round((balance / reward.points) * 100))

  return (
    <div style={{
      background: '#fff', borderRadius: 18, padding: 14,
      border: '1px solid rgba(0,0,0,.05)',
      boxShadow: '0 1px 2px rgba(0,0,0,.04)',
      opacity: canRedeem ? 1 : 0.92,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: canRedeem ? `${accent}14` : '#F2F2F7',
          color: canRedeem ? accent : '#8E8E93',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
          border: canRedeem ? `1px solid ${accent}22` : '1px solid transparent',
        }}>{reward.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A' }}>{reward.name}</div>
          <div style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>{reward.desc}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0A0A0A', fontFamily: '"Source Serif 4", Georgia, serif' }}>{reward.points}</div>
          <div style={{ fontSize: 10, color: '#8E8E93', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, marginTop: 2 }}>pts</div>
        </div>
      </div>

      {canRedeem ? (
        <button onClick={onRedeem} style={{
          marginTop: 12, width: '100%', padding: '10px', borderRadius: 12,
          background: accent, color: '#fff', border: 'none',
          fontWeight: 700, fontSize: 13, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          Échanger
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7"/>
          </svg>
        </button>
      ) : (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: '#8E8E93' }}>Encore <strong style={{ color: '#0A0A0A' }}>{missing} pts</strong></span>
            <span style={{ fontSize: 11, color: '#8E8E93' }}>{pct}%</span>
          </div>
          <ProgressBar pct={pct} color="#C7C7CC" track="#F2F2F7" height={4} />
        </div>
      )}
    </div>
  )
}

// ─── Redeem flow ──────────────────────────────────────────────────────────────

function RedeemSheet({ reward, resto, onClose, onConfirm }: { reward: Reward; resto: Resto; onClose: () => void; onConfirm: () => void }) {
  const newBal = resto.points - reward.points
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div style={{ width: '100%', background: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: '8px 18px 40px', maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: '#D1D1D6' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: '0 auto',
            background: `${resto.accent}14`, color: resto.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, border: `1px solid ${resto.accent}22`,
          }}>{reward.icon}</div>
          <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: '#8E8E93', fontWeight: 600, marginTop: 14 }}>Confirmer l'échange</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0A0A0A', marginTop: 6, fontFamily: '"Source Serif 4", Georgia, serif' }}>{reward.name}</div>
          <div style={{ fontSize: 13, color: '#8E8E93', marginTop: 4 }}>chez <strong style={{ color: '#0A0A0A' }}>{resto.name}</strong></div>
        </div>

        <div style={{ marginTop: 18, padding: '14px 16px', borderRadius: 14, background: '#F2F2F7', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Coût',         value: `−${reward.points} pts`, color: '#DC2626', weight: 600 },
            { label: 'Solde actuel', value: `${resto.points} pts`,   color: '#0A0A0A', weight: 600 },
            { label: 'Après échange',value: `${newBal} pts`,         color: '#0A0A0A', weight: 700 },
            { label: 'Valide',       value: '24 heures',             color: '#0A0A0A', weight: 600 },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8E8E93', fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 14, color: s.color, fontWeight: s.weight, marginTop: 3 }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, fontSize: 12, color: '#8E8E93', lineHeight: 1.5, textAlign: 'center' }}>
          Présentez le code généré au serveur. L'échange est définitif une fois validé.
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: 14, background: '#F2F2F7', color: '#0A0A0A', border: 'none', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Annuler</button>
          <button onClick={onConfirm} style={{ flex: 1.4, padding: '14px', borderRadius: 14, background: resto.accent, color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: `0 8px 20px ${resto.accent}33` }}>Confirmer</button>
        </div>
      </div>
    </div>
  )
}

function VoucherScreen({ reward, resto, onClose }: { reward: Reward; resto: Resto; onClose: () => void }) {
  const code = `FID-${Math.random().toString(36).slice(2,6).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`
  const widths = [3,1,2,1,3,2,1,1,3,1,2,3,1,2,1,3,2,1,1,2,3,1,2,1,3,1,2]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div style={{ width: '100%', background: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: resto.cover, color: '#fff', padding: '28px 20px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,.2), transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14, position: 'relative' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 99,
              background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(20px)',
              border: '2px solid rgba(255,255,255,.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7"/>
              </svg>
            </div>
          </div>
          <div style={{ textAlign: 'center', position: 'relative' }}>
            <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.7)', fontWeight: 600 }}>Cadeau échangé</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 5, fontFamily: '"Source Serif 4", Georgia, serif' }}>{reward.name}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginTop: 4 }}>chez {resto.name}</div>
          </div>
        </div>

        {/* Voucher */}
        <div style={{ padding: '20px', background: '#fff' }}>
          <div style={{
            border: '2px dashed #D1D1D6', borderRadius: 16, padding: 18,
            background: 'repeating-linear-gradient(45deg, #FAFAFA, #FAFAFA 10px, #fff 10px, #fff 20px)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: '#8E8E93', fontWeight: 700 }}>Code à présenter</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#0A0A0A', marginTop: 8, fontFamily: '"SF Mono", "JetBrains Mono", Menlo, monospace', letterSpacing: '.04em' }}>{code}</div>
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 1.5 }}>
              {widths.map((w, i) => <div key={i} style={{ width: w, height: 38, background: '#0A0A0A' }} />)}
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: '#8E8E93' }}>Expire dans <strong style={{ color: '#0A0A0A' }}>23h 59min</strong></div>
          </div>

          <div style={{ marginTop: 14, padding: '10px 14px', background: '#FEF9C3', borderRadius: 10, fontSize: 12, color: '#713F12', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            Montrez ce code au serveur avant de payer. Une seule utilisation.
          </div>

          <button onClick={onClose} style={{ marginTop: 14, width: '100%', padding: '14px', borderRadius: 14, background: '#0A0A0A', color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            Terminé
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Bottom tab bar ────────────────────────────────────────────────────────────

function TabBar({ active }: { active: 'home' | 'gifts' }) {
  const tabs = [
    { id: 'home',    label: 'Accueil', icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/> },
    { id: 'scan',    label: 'Scanner', icon: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></> },
    { id: 'gifts',   label: 'Cadeaux', icon: <><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></> },
    { id: 'profile', label: 'Profil',  icon: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></> },
  ]
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      paddingBottom: 'env(safe-area-inset-bottom, 16px)', paddingTop: 8, paddingLeft: 8, paddingRight: 8,
      background: 'rgba(255,255,255,.86)', backdropFilter: 'blur(20px)',
      borderTop: '0.5px solid rgba(0,0,0,.08)',
      display: 'flex', justifyContent: 'space-around', zIndex: 50,
    }}>
      {tabs.map(t => (
        <button key={t.id} style={{
          flex: 1, padding: '6px 4px', background: 'none', border: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          color: active === t.id ? '#185FA5' : '#8E8E93', cursor: 'pointer',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {t.icon}
          </svg>
          <span style={{ fontSize: 10, fontWeight: 600 }}>{t.label}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Main app ─────────────────────────────────────────────────────────────────

export default function ClientApp() {
  const [restos,      setRestos]      = useState(INIT_RESTAURANTS)
  const [screen,      setScreen]      = useState<{ name: 'wallet' } | { name: 'resto'; id: string }>({ name: 'wallet' })
  const [redeemFlow,  setRedeemFlow]  = useState<{ step: 'confirm' | 'voucher'; reward: Reward; restoId: string } | null>(null)

  const currentResto = screen.name === 'resto' ? restos.find(r => r.id === screen.id) : null

  function openResto(id: string)  { setScreen({ name: 'resto', id }) }
  function back()                  { setScreen({ name: 'wallet' }) }
  function startRedeem(r: Reward)  { if (screen.name === 'resto') setRedeemFlow({ step: 'confirm', reward: r, restoId: screen.id }) }
  function confirmRedeem() {
    if (!redeemFlow) return
    setRestos(prev => prev.map(r => r.id === redeemFlow.restoId ? { ...r, points: r.points - redeemFlow.reward.points } : r))
    setRedeemFlow(f => f ? { ...f, step: 'voucher' } : null)
  }
  function closeRedeem() { setRedeemFlow(null) }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: #F2F2F7; -webkit-font-smoothing: antialiased; }
        button { transition: transform .1s; font-family: inherit; }
        button:active { transform: scale(.97); }
      `}</style>

      <div style={{ minHeight: '100dvh', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif', maxWidth: 430, margin: '0 auto' }}>
        {screen.name === 'wallet' && <WalletScreen restos={restos} onOpen={openResto} />}
        {screen.name === 'resto' && currentResto && <RestoScreen resto={currentResto} onBack={back} onRedeem={startRedeem} />}

        <TabBar active={screen.name === 'wallet' ? 'home' : 'gifts'} />

        {redeemFlow?.step === 'confirm' && (
          <RedeemSheet
            reward={redeemFlow.reward}
            resto={restos.find(r => r.id === redeemFlow.restoId)!}
            onClose={closeRedeem}
            onConfirm={confirmRedeem}
          />
        )}
        {redeemFlow?.step === 'voucher' && (
          <VoucherScreen
            reward={redeemFlow.reward}
            resto={restos.find(r => r.id === redeemFlow.restoId)!}
            onClose={closeRedeem}
          />
        )}
      </div>
    </>
  )
}
