import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, CreditCard, Utensils, TrendingUp } from 'lucide-react'
import VisitsChart from '@/components/dashboard/VisitsChart'
import AppShell from '@/components/dashboard/AppShell'

const stats = [
  { label: 'Total Clients',     value: '128',    icon: Users,      color: 'text-blue-600',   bg: 'bg-blue-50',   trend: '+8 ce mois'    },
  { label: 'Visites ce mois',   value: '452',    icon: Utensils,   color: 'text-orange-600', bg: 'bg-orange-50', trend: '+12% vs mois dernier' },
  { label: 'Points distribués', value: '12 450', icon: CreditCard, color: 'text-green-600',  bg: 'bg-green-50',  trend: 'depuis le début' },
  { label: 'Croissance',        value: '+12%',   icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', trend: 'vs mois dernier' },
]

const recentActivity = [
  { initials: 'AO', name: 'Ahmed Ouali',    action: 'A gagné 45 pts',   time: 'Il y a 8 min',  pts: '+45' },
  { initials: 'SB', name: 'Sara Benali',    action: 'A gagné 120 pts',  time: 'Il y a 23 min', pts: '+120' },
  { initials: 'YT', name: 'Youssef Tazi',   action: 'A gagné 60 pts',   time: 'Il y a 1h',     pts: '+60' },
  { initials: 'NM', name: 'Nadia Moussaoui',action: 'A gagné 200 pts',  time: 'Il y a 2h',     pts: '+200' },
]

const topClients = [
  { initials: 'YT', name: 'Youssef Tazi',    visits: 22, pts: 1200 },
  { initials: 'AO', name: 'Ahmed Ouali',      visits: 18, pts: 980  },
  { initials: 'SB', name: 'Sara Benali',      visits: 15, pts: 760  },
]

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">

        {/* En-tête */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Bienvenue sur votre gestionnaire de fidélité.</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className={`inline-flex p-2 rounded-lg ${stat.bg} ${stat.color} mb-3`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.trend}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Graphique */}
        <VisitsChart />

        {/* Activité + Top clients */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Activités récentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#185FA5]/10 text-[#185FA5] flex items-center justify-center text-xs font-bold shrink-0">
                      {item.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.time}</p>
                    </div>
                  </div>
                  <Badge variant="success" className="text-xs">{item.pts} pts</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Top clients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topClients.map((client, i) => (
                <div key={client.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                      {i + 1}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#185FA5]/10 text-[#185FA5] flex items-center justify-center text-xs font-bold shrink-0">
                      {client.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{client.name}</p>
                      <p className="text-xs text-gray-400">{client.visits} visites</p>
                    </div>
                  </div>
                  <p className="font-bold text-sm text-[#185FA5]">{client.pts} pts</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>
    </AppShell>
  )
}
