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
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-card border-none">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center mb-2">
            <div className="w-24 h-24 bg-primary/10 rounded-[22px] flex items-center justify-center text-primary text-4xl font-bold border border-primary/5">
              {restaurant.name.charAt(0)}
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-foreground wordmark">{restaurant.name}</CardTitle>
          <Badge variant="secondary" className="mt-2 eyebrow text-[10px] tracking-widest">{restaurant.slug}</Badge>
        </CardHeader>
        <CardContent className="space-y-6 px-8 py-6">
          <div className="space-y-1">
            <p className="eyebrow text-[10px] text-muted-foreground">ID du Restaurant</p>
            <p className="num-mono text-xs text-foreground break-all">{restaurant.id}</p>
          </div>
          <div className="space-y-1 border-t border-border/40 pt-4">
            <p className="eyebrow text-[10px] text-muted-foreground">Téléphone</p>
            <p className="font-bold text-foreground num-mono">{restaurant.phone}</p>
          </div>
          <div className="space-y-1 border-t border-border/40 pt-4">
            <p className="eyebrow text-[10px] text-muted-foreground">ID Propriétaire</p>
            <p className="num-mono text-xs text-foreground break-all">{restaurant.owner_id}</p>
          </div>
          <div className="space-y-1 border-t border-border/40 pt-4">
            <p className="eyebrow text-[10px] text-muted-foreground">Date de création</p>
            <p className="font-bold text-foreground num-mono">
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
