'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldCheck } from 'lucide-react'

export default function AdminLoginPage() {
  const router   = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res  = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Erreur de connexion.')
      setLoading(false)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#185FA5] mb-4">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Administration</h1>
          <p className="text-gray-400 text-sm mt-1">Taghra — Accès restreint</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-3 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Nom d&apos;utilisateur</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                required
                autoComplete="username"
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#185FA5] hover:bg-[#124880] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Connexion…</>
                : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
