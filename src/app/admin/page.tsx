'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2, ShieldCheck, LogOut, Users, Store } from 'lucide-react'

type Restaurant = {
  id: string
  user_id: string
  name: string
  email: string
  clientCount: number
  created_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', address: '' })

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/restaurants')
      if (res.status === 401) { window.location.href = '/admin/login'; return }
      const data = await res.json()
      setRestaurants(Array.isArray(data) ? data : [])
    } catch {
      setRestaurants([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    const res = await fetch('/api/admin/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setFormError(data.error ?? 'Erreur lors de la création.')
      setSaving(false)
    } else {
      setForm({ name: '', email: '', password: '', address: '' })
      setShowForm(false)
      load()
    }
    setSaving(false)
  }

  async function handleDelete(r: Restaurant) {
    if (!confirm(`Supprimer "${r.name}" et son compte ? Cette action est irréversible.`)) return
    setDeleting(r.id)
    await fetch('/api/admin/restaurants', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: r.id, userId: r.user_id }),
    })
    setDeleting(null)
    load()
  }

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-[#15101F] text-white">

      {/* Top bar */}
      <header className="bg-[#2A2236]/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="wordmark text-xl text-white">
              Fid<span className="accent">è</span>le
            </span>
            <span className="eyebrow ml-4 text-[10px] text-fidele-violet-soft tracking-widest">Admin Dashboard</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs eyebrow text-fidele-violet-soft hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" /> Déconnexion
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-[#2A2236] border border-white/5 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold num-mono">{restaurants.length}</p>
                <p className="text-xs eyebrow text-fidele-violet-soft mt-1">Restaurants</p>
              </div>
            </div>
          </div>
          <div className="bg-[#2A2236] border border-white/5 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-3xl font-bold num-mono">{restaurants.reduce((s, r) => s + r.clientCount, 0)}</p>
                <p className="text-xs eyebrow text-fidele-violet-soft mt-1">Clients total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Header + button */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Restaurants partenaires</h2>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-lg active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Nouveau restaurant
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-[#2A2236] border border-white/10 rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-lg font-bold mb-6 text-white">Créer un compte restaurant</h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {formError && (
                <div className="sm:col-span-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold px-4 py-3 rounded-xl text-center">
                  {formError}
                </div>
              )}
              {[
                { key: 'name', label: 'Nom du restaurant', placeholder: 'Café Maure', required: true },
                { key: 'email', label: 'Email de connexion', placeholder: 'contact@cafemaure.ma', required: true, type: 'email' },
                { key: 'password', label: 'Mot de passe', placeholder: '••••••••', required: true, type: 'password' },
                { key: 'address', label: 'Adresse (optionnel)', placeholder: 'Kasbah, Rabat', required: false },
              ].map(f => (
                <div key={f.key} className="space-y-2">
                  <label className="text-xs eyebrow text-fidele-violet-soft ml-1">{f.label}</label>
                  <input
                    type={f.type ?? 'text'}
                    placeholder={f.placeholder}
                    required={f.required}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full bg-[#15101F] border border-white/5 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              ))}
              <div className="sm:col-span-2 flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-4 rounded-xl transition-all disabled:opacity-60 shadow-lg"
                >
                  {saving ? <><Loader2 className="h-5 w-5 animate-spin" /> Création…</> : 'Créer le compte'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-4 rounded-xl border border-white/10 text-fidele-violet-soft hover:text-white hover:bg-white/5 text-sm font-bold transition-all"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="bg-[#2A2236] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-fidele-violet-soft">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="eyebrow text-[10px] tracking-[0.2em]">Chargement…</p>
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-24 text-fidele-violet-soft">
              <Store className="h-16 w-16 mx-auto mb-6 opacity-10" />
              <p className="text-lg font-bold text-white/40">Aucun restaurant encore</p>
              <p className="text-sm mt-2">Créez le premier compte ci-dessus.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="px-6 py-4 eyebrow text-[10px] text-fidele-violet-soft">Restaurant</th>
                    <th className="px-6 py-4 eyebrow text-[10px] text-fidele-violet-soft">Clients</th>
                    <th className="px-6 py-4 eyebrow text-[10px] text-fidele-violet-soft">Inscrit le</th>
                    <th className="px-6 py-4 eyebrow text-[10px] text-fidele-violet-soft text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {restaurants.map(r => (
                    <tr key={r.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                            {r.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-primary transition-colors">{r.name}</p>
                            <p className="text-xs text-fidele-violet-soft mt-1">{r.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className="num-mono font-bold text-lg">{r.clientCount}</span>
                          <span className="text-xs eyebrow text-fidele-violet-soft">fidèles</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-fidele-violet-soft num-mono">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => handleDelete(r)}
                          disabled={deleting === r.id}
                          className="p-3 text-fidele-violet-soft hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                        >
                          {deleting === r.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
