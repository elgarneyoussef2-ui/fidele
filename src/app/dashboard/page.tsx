import { createAdminClient, createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Utensils, CreditCard, TrendingUp } from 'lucide-react'
import VisitsChart from '@/components/dashboard/VisitsChart'
import AppShell from '@/components/dashboard/AppShell'
import LiveActivityFeed from '@/components/dashboard/LiveActivityFeed'

function fmt(n: number) {
  return n.toLocaleString('fr-FR')
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const admin = await createAdminClient()

  const { data: restaurant } = await (admin.from('restaurants') as any)
    .select('id, name')
    .eq('owner_id', user.id)
    .single()

  if (!restaurant) return <div className="p-8 text-gray-500">Aucun restaurant trouvé.</div>

  const rid = restaurant.id

  const [
    { count: totalClients },
    { data: pointsData },
  ] = await Promise.all([
    (admin.from('clients') as any).select('*', { count: 'exact', head: true }).eq('restaurant_id', rid),
    (admin.from('visits') as any).select('points_earned').eq('restaurant_id', rid),
  ])

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const { count: monthVisits } = await (admin.from('visits') as any)
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', rid)
    .gte('created_at', startOfMonth)

  const totalPoints = (pointsData ?? []).reduce((s: number, v: any) => s + (v.points_earned || 0), 0)

  const { data: topClients } = await (admin.from('clients') as any)
    .select('name, points_balance, total_visits')
    .eq('restaurant_id', rid)
    .order('points_balance', { ascending: false })
    .limit(5)

  const stats = [
    { label: 'Total Clients',     value: fmt(totalClients ?? 0), icon: Users,       color: '#5B21B6', bg: '#EDE6FB' },
    { label: 'Visites ce mois',   value: fmt(monthVisits  ?? 0), icon: Utensils,    color: '#B5781F', bg: '#FEF3C7' },
    { label: 'Points distribués', value: fmt(totalPoints),       icon: CreditCard,  color: '#16A34A', bg: '#DCFCE7' },
    { label: 'Clients actifs',    value: fmt(totalClients ?? 0), icon: TrendingUp,  color: '#0369A1', bg: '#E0F2FE' },
  ]

  return (
    <AppShell>
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">

        {/* ── Hero header ── */}
        <div style={{
          position: 'relative', overflow: 'hidden', borderRadius: 24,
          background: '#15101F', color: '#fff', padding: '32px 36px',
        }}>
          {/* Logo watermark */}
          <svg viewBox="0 0 100 100" aria-hidden style={{
            position: 'absolute', right: -24, top: '50%', transform: 'translateY(-50%)',
            width: 220, height: 220, color: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
          }}>
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="3" />
            <circle cx="50" cy="50" r="11" fill="currentColor" />
          </svg>

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Logomark + label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <svg viewBox="0 0 100 100" width="28" height="28" style={{ color: 'rgba(255,255,255,0.4)' }} aria-hidden>
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="3" />
                <circle cx="50" cy="50" r="11" fill="currentColor" />
              </svg>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                Fidèle — Tableau de bord
              </span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', fontSize: 42, letterSpacing: '-0.02em', lineHeight: 1, color: '#fff', marginBottom: 8 }}>
              {restaurant.name}
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
              Programme de fidélité · Vue en temps réel
            </p>
          </div>
        </div>

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} style={{
                background: '#fff', borderRadius: 20, padding: '24px 20px',
                boxShadow: '0 4px 18px -8px rgba(21,16,31,.1)',
                display: 'flex', flexDirection: 'column', gap: 16,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} />
                </div>
                <div>
                  <p style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 32, fontWeight: 800, color: '#15101F', lineHeight: 1, letterSpacing: '-0.03em' }}>{stat.value}</p>
                  <p style={{ fontSize: 12, color: '#6B7280', marginTop: 6, fontWeight: 500 }}>{stat.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Chart ── */}
        <VisitsChart />

        {/* ── Activity + Top clients ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LiveActivityFeed />

          <div style={{ background: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 4px 18px -8px rgba(21,16,31,.1)' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#5B21B6', marginBottom: 20 }}>
              Top clients
            </p>
            {(topClients ?? []).length === 0 && (
              <p style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', padding: '32px 0' }}>Aucun client encore.</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(topClients ?? []).map((client: any, i: number) => {
                const ini = client.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#6B7280', flexShrink: 0 }}>
                        {i + 1}
                      </span>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EDE6FB', color: '#5B21B6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {ini}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#15101F' }}>{client.name}</p>
                        <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>{client.total_visits ?? 0} visite{(client.total_visits ?? 0) > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <p style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 14, fontWeight: 800, color: '#5B21B6' }}>{fmt(client.points_balance ?? 0)} pts</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  )
}
