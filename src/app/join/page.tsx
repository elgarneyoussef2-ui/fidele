'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2, Star, Smartphone, User, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { processJoinAndCredit, checkExistingClient } from './actions'

function JoinContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
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
  const [countdown, setCountdown] = useState(4)

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
    if (!phone || !restaurantId) return

    setLoading(true)
    try {
      const { client } = await checkExistingClient(phone, restaurantId)

      if (client) {
        setName(client.name)
        const result = await processJoinAndCredit({
          restaurantId,
          phone,
          name: client.name,
          amount: Number(amount)
        })

        if (result.success) {
          setPointsEarned(result.pointsEarned!)
          setNewBalance(result.newBalance!)
          setStep('success')
        } else {
          throw new Error(result.error)
        }
      } else {
        setStep('name')
      }
    } catch (error: any) {
      console.error('Erreur checkPhone:', error)
      setStep('name')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterAndCredit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !restaurantId) return

    setLoading(true)
    try {
      const result = await processJoinAndCredit({
        restaurantId,
        phone,
        name,
        amount: Number(amount)
      })

      if (result.success) {
        setPointsEarned(result.pointsEarned!)
        setNewBalance(result.newBalance!)
        setStep('success')
        toast({
          title: "Succès !",
          description: `Compte créé et +${result.pointsEarned} points crédités !`,
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error('Erreur handleRegisterAndCredit:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer votre compte.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (step !== 'success') return
    if (countdown <= 0) { router.push('/client'); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [step, countdown, router])

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
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full bg-[#185FA5] hover:bg-[#124880]" onClick={() => router.push('/client')}>
            Voir mon portefeuille →
          </Button>
          <p className="text-xs text-gray-400">Redirection automatique dans {countdown}s…</p>
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
