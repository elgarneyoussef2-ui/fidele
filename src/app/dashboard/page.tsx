import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CreditCard, Utensils, TrendingUp } from 'lucide-react'
import VisitsChart from '@/components/dashboard/VisitsChart'
import AppShell from '@/components/dashboard/AppShell'
import RedemptionPanel from '@/components/dashboard/RedemptionPanel'
import LiveActivityFeed from '@/components/dashboard/LiveActivityFeed'

function fmt(n: number) {
  return n.toLocaleString('fr-FR')
}

export default async function DashboardPage() {
  const admin = await createAdminClient()

  const { data: restaurant } = await (admin.from('restaurants') as any)
    .select('id, name')
    .order('created_at', { ascending: true })
    .limit(1)
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
    { label: 'Total Clients',     value: fmt(totalClients ?? 0), icon: Users,      color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { label: 'Visites ce mois',   value: fmt(monthVisits  ?? 0), icon: Utensils,   color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Points distribués', value: fmt(totalPoints),       icon: CreditCard, color: 'text-green-600',  bg: 'bg-green-50'  },
    { label: 'Clients actifs',    value: fmt(totalClients ?? 0), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
          <p className="text-gray-500 text-sm mt-0.5">Tableau de bord fidélité</p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className={`inline-flex p-2 rounded-lg ${stat.bg} ${stat.color} mb-3`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Demandes récompenses */}
        <RedemptionPanel />

        {/* Chart */}
        <VisitsChart />

        {/* Activité live + Top clients */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LiveActivityFeed />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Top clients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(topClients ?? []).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Aucun client encore.</p>
              )}
              {(topClients ?? []).map((client: any, i: number) => {
                const ini = client.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
                return (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                        {i + 1}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#185FA5]/10 text-[#185FA5] flex items-center justify-center text-xs font-bold shrink-0">
                        {ini}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{client.name}</p>
                        <p className="text-xs text-gray-400">{client.total_visits ?? 0} visites</p>
                      </div>
                    </div>
                    <p className="font-bold text-sm text-[#185FA5]">{fmt(client.points_balance ?? 0)} pts</p>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

      </div>
    </AppShell>
  )
}
