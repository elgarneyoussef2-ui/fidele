import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, CreditCard, Utensils, TrendingUp, QrCode } from 'lucide-react'
import Link from 'next/link'
import VisitsChart from '@/components/dashboard/VisitsChart'

export default function DashboardPage() {
  // Données simulées pour le dashboard
  const stats = [
    { label: 'Total Clients', value: '128', icon: Users, color: 'text-blue-600' },
    { label: 'Visites ce mois', value: '452', icon: Utensils, color: 'text-orange-600' },
    { label: 'Points distribués', value: '12,450', icon: CreditCard, color: 'text-green-600' },
    { label: 'Croissance', value: '+12%', icon: TrendingUp, color: 'text-purple-600' },
  ]

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Bienvenue sur votre gestionnaire de fidélité Taghra.</p>
        </div>
        <Button asChild>
          <Link href="/generate-qr">
            <QrCode className="mr-2 h-4 w-4" />
            Générer un QR Code
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <VisitsChart />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Activités Récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      C
                    </div>
                    <div>
                      <p className="font-medium">Client #{item}042</p>
                      <p className="text-xs text-gray-500">Il y a 15 minutes</p>
                    </div>
                  </div>
                  <Badge variant="success">+50 pts</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Ahmed', 'Youssef', 'Sara'].map((name, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold">
                      {name[0]}
                    </div>
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-xs text-gray-500">{15 - i} visites au total</p>
                    </div>
                  </div>
                  <p className="font-bold text-primary">{1200 - (i * 200)} pts</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
