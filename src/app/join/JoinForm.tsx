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
  const router = useRouter()
  const pts = Math.floor(amount / 10)

  const [step, setStep] = useState<'phone' | 'name' | 'success'>('phone')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pointsEarned, setPointsEarned] = useState(0)
  const [newBalance, setNewBalance] = useState(0)
  const [countdown, setCountdown] = useState(4)

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
    localStorage.setItem('fidele_client_phone', phone)
    localStorage.setItem('fidele_client_name', result.name!)
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
      <Card className="border-none shadow-none text-center space-y-6 py-8 bg-transparent">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-600 shadow-sm border border-green-100">
            <CheckCircle2 size={56} />
          </div>
        </div>
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-bold text-foreground">Bravo, {name} !</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">Vos points ont été ajoutés.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-primary/5 p-8 rounded-[22px] border border-primary/10 shadow-card">
            <p className="eyebrow text-primary mb-2">Points gagnés</p>
            <p className="text-6xl font-black text-primary num-mono">+{pointsEarned}</p>
          </div>
          <div className="pt-2">
            <p className="text-sm text-muted-foreground">Nouveau solde chez {restaurantName}</p>
            <p className="text-2xl font-bold text-foreground num-mono">{newBalance} points</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 px-6">
          <Button className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-sm" onClick={() => window.location.replace('/client')}>
            Voir mon portefeuille →
          </Button>
          <p className="text-xs text-muted-foreground num-mono tracking-widest">Redirection dans {countdown}s…</p>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center mb-2">
          <div className="w-20 h-20 bg-primary/10 rounded-[22px] flex items-center justify-center text-primary shadow-sm border border-primary/5">
            <Star size={40} fill="currentColor" />
          </div>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-3xl font-bold text-foreground">Points Fidélité</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {step === 'phone'
              ? `Entrez votre numéro pour recevoir ${pts} point${pts > 1 ? 's' : ''} chez ${restaurantName}.`
              : `Bienvenue ! Quel est votre nom pour votre compte chez ${restaurantName} ?`}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive font-medium text-center">
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handlePhone} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs eyebrow text-muted-foreground ml-1">Numéro de téléphone</Label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={20} />
                <Input id="phone" className="pl-12 h-14 text-xl rounded-2xl border-border/60 num-mono bg-card" placeholder="0612345678" type="tel"
                  value={phone} onChange={e => setPhone(e.target.value)} required disabled={loading} />
              </div>
            </div>
            <Button type="submit" className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-sm" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <>Continuer <ArrowRight className="ml-2 h-6 w-6" /></>}
            </Button>
          </form>
        ) : (
          <form onSubmit={e => { e.preventDefault(); submit(name) }} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs eyebrow text-muted-foreground ml-1">Votre nom complet</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={20} />
                <Input id="name" className="pl-12 h-14 text-xl rounded-2xl border-border/60 bg-card" placeholder="Ex: Ahmed Alami"
                  value={name} onChange={e => setName(e.target.value)} required disabled={loading} />
              </div>
            </div>
            <Button type="submit" className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-sm" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Créer mon compte & Créditer'}
            </Button>
            <Button type="button" variant="ghost" className="w-full text-muted-foreground hover:text-primary transition-colors h-12" onClick={() => setStep('phone')} disabled={loading}>
              Modifier le numéro
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
