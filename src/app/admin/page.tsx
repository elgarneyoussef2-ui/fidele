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
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [deleting,    setDeleting]    = useState<string | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [formError,   setFormError]   = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', address: '' })

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/restaurants')
    if (res.status === 401) { router.push('/admin/login'); return }
    const data = await res.json()
    setRestaurants(data)
    setLoading(false)
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
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Top bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#185FA5] flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-lg">Taghra Admin</span>
            <span className="ml-3 text-xs text-gray-500 font-medium">Gestion des restaurants</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" /> Déconnexion
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Store className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{restaurants.length}</p>
                <p className="text-sm text-gray-400">Restaurants</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{restaurants.reduce((s, r) => s + r.clientCount, 0)}</p>
                <p className="text-sm text-gray-400">Clients total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Header + button */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Restaurants partenaires</h2>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 bg-[#185FA5] hover:bg-[#124880] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouveau restaurant
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <h3 className="font-semibold mb-4 text-gray-200">Créer un compte restaurant</h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {formError && (
                <div className="sm:col-span-2 bg-red-900/40 border border-red-700 text-red-300 text-sm px-3 py-2 rounded-lg">
                  {formError}
                </div>
              )}
              {[
                { key: 'name',     label: 'Nom du restaurant', placeholder: 'Café Maure', required: true },
                { key: 'email',    label: 'Email de connexion', placeholder: 'contact@cafemaure.ma', required: true, type: 'email' },
                { key: 'password', label: 'Mot de passe',       placeholder: '••••••••', required: true, type: 'password' },
                { key: 'address',  label: 'Adresse (optionnel)', placeholder: 'Kasbah, Rabat', required: false },
              ].map(f => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">{f.label}</label>
                  <input
                    type={f.type ?? 'text'}
                    placeholder={f.placeholder}
                    required={f.required}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5]"
                  />
                </div>
              ))}
              <div className="sm:col-span-2 flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-[#185FA5] hover:bg-[#124880] text-white font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
                >
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Création…</> : 'Créer le compte'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <Store className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Aucun restaurant encore.</p>
              <p className="text-sm mt-1">Créez le premier compte ci-dessus.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-3">Restaurant</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3 text-center">Clients</th>
                  <th className="px-6 py-3">Créé le</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {restaurants.map(r => (
                  <tr key={r.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#185FA5]/20 flex items-center justify-center text-[#185FA5] font-bold text-sm shrink-0">
                          {r.name[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-white">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{r.email}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-800 text-sm font-bold text-white">
                        {r.clientCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(r)}
                        disabled={deleting === r.id}
                        className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40"
                      >
                        {deleting === r.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Trash2 className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  )
}
