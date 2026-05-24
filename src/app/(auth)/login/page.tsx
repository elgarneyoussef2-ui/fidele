'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [demoLoad, setDemoLoad] = useState(false)

  async function handleDemo() {
    setDemoLoad(true)
    await fetch('/api/auth/demo', { method: 'POST' })
    router.push('/dashboard')
    router.refresh()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    // Placeholder — brancher Supabase auth ici
    await new Promise(r => setTimeout(r, 800))
    setError('Connexion Supabase non configurée. Utilisez le compte démo.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 p-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center">
          <div className="inline-block bg-[#185FA5] text-white font-bold text-2xl px-5 py-2 rounded-xl tracking-tight mb-3">
            Taghra
          </div>
          <p className="text-gray-500 text-sm">Fidélisation pour restaurants marocains</p>
        </div>

        {/* Carte */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5">

          {/* Bouton démo */}
          <Button
            type="button"
            onClick={handleDemo}
            disabled={demoLoad}
            className="w-full bg-[#185FA5] hover:bg-[#124880] h-11 text-base gap-2"
          >
            {demoLoad
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Chargement...</>
              : <><Zap className="h-4 w-4" /> Essayer avec le compte démo</>}
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">ou se connecter</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2.5 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@restaurant.ma"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" variant="outline" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Connexion...</> : 'Se connecter'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400">
          Le compte démo donne accès à toutes les fonctionnalités avec des données fictives.
        </p>
      </div>
    </div>
  )
}
