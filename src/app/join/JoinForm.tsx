'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2, Star, Smartphone, User, ArrowRight } from 'lucide-react'
import { processJoinWithToken } from './actions'

interface Props {
  token: string
  restaurantId: string
  restaurantName: string
  amount: number
}

export default function JoinForm({ token, restaurantId, restaurantName, amount }: Props) {
  const router   = useRouter()
  const pts      = Math.floor(amount / 10)

  const [step,         setStep]         = useState<'phone' | 'name' | 'success'>('phone')
  const [phone,        setPhone]        = useState('')
  const [name,         setName]         = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [pointsEarned, setPointsEarned] = useState(0)
  const [newBalance,   setNewBalance]   = useState(0)
  const [countdown,    setCountdown]    = useState(4)

  useEffect(() => {
    if (step !== 'success') return
    if (countdown <= 0) { window.location.replace('/client'); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [step, countdown])

  async function submit(clientName: string) {
    setLoading(true)
    setError('')
    const result = await processJoinWithToken({ token, phone, name: clientName })
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Erreur inconnue')
      return
    }
    setPointsEarned(result.pointsEarned!)
    setNewBalance(result.newBalance!)
    setName(result.name!)
    localStorage.setItem('taghra_client_phone', phone)
    localStorage.setItem('taghra_client_name', result.name!)
    setStep('success')
  }

  async function handlePhone(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    // Check if existing client (just try to credit — server handles both cases)
    // We need a name if new client, so try first and see if server needs it
    // Simpler: just go to name step for all, if existing the server already has the name
    // Actually: do a quick lookup
    try {
      const res = await fetch('/api/client/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      const match = Array.isArray(data) ? data.find((c: any) => c.restaurant_id === restaurantId) : null
      if (match) {
        // Existing client — directly submit with stored name
        await submit(match.name)
      } else {
        setLoading(false)
        setStep('name')
      }
    } catch {
      setLoading(false)
      setStep('name')
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
          <CardTitle className="text-2xl">Bravo, {name} !</CardTitle>
          <CardDescription className="text-lg">Vos points ont été ajoutés.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <p className="text-sm text-gray-500 mb-1">Points gagnés</p>
            <p className="text-4xl font-black text-[#185FA5]">+{pointsEarned}</p>
          </div>
          <div className="pt-2">
            <p className="text-sm text-gray-500">Nouveau solde chez {restaurantName}</p>
            <p className="text-2xl font-bold text-gray-800">{newBalance} points</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full bg-[#185FA5] hover:bg-[#124880]" onClick={() => window.location.replace('/client')}>
            Voir mon portefeuille →
          </Button>
          <p className="text-xs text-gray-400">Redirection dans {countdown}s…</p>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#185FA5]">
            <Star size={32} fill="currentColor" />
          </div>
        </div>
        <CardTitle className="text-2xl">Points Fidélité</CardTitle>
        <CardDescription>
          {step === 'phone'
            ? `Entrez votre numéro pour recevoir ${pts} point${pts > 1 ? 's' : ''} chez ${restaurantName}.`
            : `Bienvenue ! Quel est votre nom pour votre compte chez ${restaurantName} ?`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && <p className="text-sm text-red-500 mb-3 text-center">{error}</p>}

        {step === 'phone' ? (
          <form onSubmit={handlePhone} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-3 text-gray-400" size={18} />
                <Input id="phone" className="pl-10 h-12 text-lg" placeholder="0612345678" type="tel"
                  value={phone} onChange={e => setPhone(e.target.value)} required disabled={loading} />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 text-lg font-bold bg-[#185FA5] hover:bg-[#124880]" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <>Continuer <ArrowRight className="ml-2 h-5 w-5" /></>}
            </Button>
          </form>
        ) : (
          <form onSubmit={e => { e.preventDefault(); submit(name) }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Votre nom complet</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <Input id="name" className="pl-10 h-12 text-lg" placeholder="Ex: Ahmed Alami"
                  value={name} onChange={e => setName(e.target.value)} required disabled={loading} />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 text-lg font-bold bg-[#185FA5] hover:bg-[#124880]" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Créer mon compte & Créditer'}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep('phone')} disabled={loading}>
              Modifier le numéro
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
