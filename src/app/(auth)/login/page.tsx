'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Token stocké dans document.cookie par createBrowserClient
    // Full reload pour que le middleware lise les cookies
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 p-4">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center">
          <div className="inline-block bg-[#185FA5] text-white font-bold text-2xl px-5 py-2 rounded-xl tracking-tight mb-3">
            Taghra
          </div>
          <p className="text-gray-500 text-sm">Fidélisation pour restaurants marocains</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-800">Connexion restaurant</h2>

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
            <Button
              type="submit"
              className="w-full bg-[#185FA5] hover:bg-[#124880] h-11"
              disabled={loading}
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Connexion…</>
                : 'Se connecter'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400">
          Accès réservé aux restaurants partenaires Taghra.
        </p>
      </div>
    </div>
  )
}
