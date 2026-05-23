'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2, Star, Smartphone } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

function JoinContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClient()

  const restaurantId = searchParams.get('restaurantId')
  const amount = searchParams.get('amount')
  
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [restaurantName, setRestaurantName] = useState('votre restaurant')

  useEffect(() => {
    async function fetchRestaurant() {
      if (restaurantId) {
        const { data } = await supabase
          .from('restaurants')
          .select('name')
          .eq('id', restaurantId)
          .single()
        if (data) setRestaurantName(data.name)
      }
    }
    fetchRestaurant()
  }, [restaurantId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !name) {
      toast({
        title: "Champs requis",
        description: "Veuillez entrer votre nom et votre numéro de téléphone.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // 1. Chercher ou créer le client
      const { data: client, error: clientError } = await (supabase.from('clients') as any)
        .select('*')
        .eq('phone', phone)
        .eq('restaurant_id', restaurantId)
        .single()

      let currentClient = client

      if (clientError || !client) {
        // Créer nouveau client
        const { data: newClient, error: createError } = await (supabase.from('clients') as any)
          .insert({
            restaurant_id: restaurantId,
            name: name,
            phone: phone,
            points_balance: 0,
            total_visits: 0,
            total_spent: 0
          })
          .select()
          .single()
        
        if (createError) throw createError
        currentClient = newClient
      }

      // 2. Calculer les points (10 points pour 100 MAD par défaut)
      const pointsToEarn = Math.floor(Number(amount) / 10)

      // 3. Enregistrer la visite
      const { error: visitError } = await (supabase.from('visits') as any)
        .insert({
          client_id: currentClient.id,
          restaurant_id: restaurantId,
          amount_paid: Number(amount),
          points_earned: pointsToEarn
        })

      if (visitError) throw visitError

      // 4. Mettre à jour le solde du client
      const { error: updateError } = await (supabase.from('clients') as any)
        .update({
          points_balance: currentClient.points_balance + pointsToEarn,
          total_visits: currentClient.total_visits + 1,
          total_spent: currentClient.total_spent + Number(amount),
          last_visit_at: new Date().toISOString()
        })
        .eq('id', currentClient.id)

      if (updateError) throw updateError

      setCompleted(true)
      toast({
        title: "Succès !",
        description: `Vous avez gagné ${pointsToEarn} points chez ${restaurantName}.`,
      })
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Erreur",
        description: "Impossible de créditer vos points. Veuillez réessayer.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (completed) {
    return (
      <Card className="border-none shadow-none text-center space-y-6 py-8">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <CheckCircle2 size={48} />
          </div>
        </div>
        <CardHeader>
          <CardTitle className="text-2xl">Félicitations {name} !</CardTitle>
          <CardDescription className="text-lg">
            Vos points ont été crédités avec succès.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
            <p className="text-sm text-gray-500 mb-1">Points gagnés aujourd'hui</p>
            <p className="text-4xl font-black text-primary">+{Math.floor(Number(amount) / 10)}</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <p className="text-sm text-gray-500">
            Vous recevrez bientôt une confirmation par WhatsApp.
          </p>
          <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
            Fermer
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Star size={32} fill="currentColor" />
          </div>
        </div>
        <CardTitle className="text-2xl">Bienvenue chez {restaurantName}</CardTitle>
        <CardDescription>
          Entrez vos informations pour récupérer vos points de fidélité pour votre achat de {amount} MAD.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Votre Nom</Label>
            <Input 
              id="name" 
              placeholder="Ex: Ahmed Alami" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Numéro WhatsApp</Label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-3 text-gray-400" size={18} />
              <Input 
                id="phone" 
                className="pl-10" 
                placeholder="0612345678" 
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Récupérer mes points"}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-center w-full text-gray-400">
          En continuant, vous acceptez de recevoir des notifications de fidélité via WhatsApp.
        </p>
      </CardFooter>
    </Card>
  )
}

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-4 pt-12">
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-gray-500">Chargement...</p>
          </div>
        }>
          <JoinContent />
        </Suspense>
      </div>
    </div>
  )
}
