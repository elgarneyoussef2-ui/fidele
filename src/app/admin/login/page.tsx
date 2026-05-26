'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldCheck } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Erreur de connexion.')
      setLoading(false)
    } else {
      // Hard redirect so the cookie is included in the next request
      window.location.href = '/admin'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#15101F] p-4">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-lc">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="wordmark text-3xl text-white">Administration</h1>
          <p className="eyebrow text-fidele-violet-soft text-xs mt-2 tracking-widest">Fidèle — Accès restreint</p>
        </div>

        <div className="bg-[#2A2236] border border-white/5 rounded-3xl p-8 space-y-4 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs eyebrow text-fidele-violet-soft ml-1">Nom d&apos;utilisateur</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                required
                autoComplete="username"
                className="w-full bg-[#15101F] border border-white/5 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs eyebrow text-fidele-violet-soft ml-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full bg-[#15101F] border border-white/5 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
            >
              {loading
                ? <><Loader2 className="h-5 w-5 animate-spin" /> Connexion…</>
                : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
