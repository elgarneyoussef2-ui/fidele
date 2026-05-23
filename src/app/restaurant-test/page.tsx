import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function RestaurantPage() {
  const restaurant = {
    id: "867d37b9-065f-46af-b1e7-4a837f4881fa",
    name: "Restaurant Test",
    slug: "restaurant-test",
    phone: "+212600000000",
    logo_url: null,
    owner_id: "032ef02d-4258-4fe4-83a1-4f62599451ce",
    created_at: "2026-05-23 12:08:06.500077+00"
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary text-3xl font-bold">
              {restaurant.name.charAt(0)}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">{restaurant.name}</CardTitle>
          <Badge variant="outline" className="mt-2">{restaurant.slug}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-b pb-2">
            <p className="text-sm text-gray-500">ID du Restaurant</p>
            <p className="font-mono text-xs text-gray-700 break-all">{restaurant.id}</p>
          </div>
          <div className="border-b pb-2">
            <p className="text-sm text-gray-500">Téléphone</p>
            <p className="font-medium text-gray-800">{restaurant.phone}</p>
          </div>
          <div className="border-b pb-2">
            <p className="text-sm text-gray-500">ID Propriétaire</p>
            <p className="font-mono text-xs text-gray-700 break-all">{restaurant.owner_id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Date de création</p>
            <p className="font-medium text-gray-800">
              {new Date(restaurant.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
