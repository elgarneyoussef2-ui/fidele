'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2, Star, Smartphone, User, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

function JoinContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClient()

  const restaurantId = searchParams.get('restaurantId')
  const amount = searchParams.get('amount')
  
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'phone' | 'name' | 'success'>('phone')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [restaurantName, setRestaurantName] = useState('votre restaurant')
  const [pointsEarned, setPointsEarned] = useState(0)
  const [newBalance, setNewBalance] = useState(0)

  useEffect(() => {
    async function fetchRestaurant() {
      if (restaurantId) {
        const { data } = await (supabase
          .from('restaurants') as any)
          .select('name')
          .eq('id', restaurantId)
          .single()
        if (data) setRestaurantName(data.name)
      }
    }
    fetchRestaurant()
  }, [restaurantId, supabase])

  const handleCheckPhone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone) return

    setLoading(true)
    try {
      const { data: client, error } = await (supabase.from('clients') as any)
        .select('*')
        .eq('phone', phone)
        .eq('restaurant_id', restaurantId)
        .single()

      if (client) {
        // Client existe, on crédite directement
        setName(client.name)
        await processCredit(client)
      } else {
        // Nouveau client, on demande le nom
        setStep('name')
      }
    } catch (error) {
      setStep('name')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterAndCredit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    setLoading(true)
    try {
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
      await processCredit(newClient)
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de créer votre compte.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const processCredit = async (client: any) => {
    const earned = Math.floor(Number(amount) / 10)
    const updatedBalance = client.points_balance + earned

    try {
      // 1. Enregistrer la visite
      await (supabase.from('visits') as any).insert({
        client_id: client.id,
        restaurant_id: restaurantId,
        amount_paid: Number(amount),
        points_earned: earned
      })

      // 2. Mettre à jour le solde
      await (supabase.from('clients') as any)
        .update({
          points_balance: updatedBalance,
          total_visits: client.total_visits + 1,
          total_spent: client.total_spent + Number(amount),
          last_visit_at: new Date().toISOString()
        })
        .eq('id', client.id)

      setPointsEarned(earned)
      setNewBalance(updatedBalance)
      setStep('success')
      
      toast({
        title: "Succès !",
        description: `+${earned} points crédités !`,
      })
    } catch (error) {
      throw error
    }
  }

  if (step === 'success') {
    return (
      <Card className="border-none shadow-none text-center space-y-6 py-8">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <CheckCircle2 size={48} />
          </div>
        </div>
        <CardHeader>
          <CardTitle className="text-2xl">Ravi de vous revoir, {name} !</CardTitle>
          <CardDescription className="text-lg">
            Vos points ont été ajoutés.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
            <p className="text-sm text-gray-500 mb-1">Points gagnés</p>
            <p className="text-4xl font-black text-primary">+{pointsEarned}</p>
          </div>
          <div className="pt-4">
            <p className="text-sm text-gray-500">Votre nouveau solde</p>
            <p className="text-2xl font-bold text-gray-800">{newBalance} points</p>
          </div>
        </CardContent>
        <CardFooter>
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
        <CardTitle className="text-2xl">Points Fidélité</CardTitle>
        <CardDescription>
          {step === 'phone' 
            ? "Entrez votre numéro pour récupérer vos points." 
            : `Bienvenue ! Quel est votre nom pour votre compte chez ${restaurantName} ?`}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {step === 'phone' ? (
          <form onSubmit={handleCheckPhone} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-3 text-gray-400" size={18} />
                <Input 
                  id="phone" 
                  className="pl-10 h-12 text-lg" 
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
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (
                <>Continuer <ArrowRight className="ml-2 h-5 w-5" /></>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegisterAndCredit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Votre Nom complet</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <Input 
                  id="name" 
                  className="pl-10 h-12 text-lg" 
                  placeholder="Ex: Ahmed Alami" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Créer mon compte & Créditer"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep('phone')} disabled={loading}>
              Modifier le numéro
            </Button>
          </form>
        )}
      </CardContent>
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
