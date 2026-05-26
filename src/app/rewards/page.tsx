'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AppShell from '@/components/dashboard/AppShell'
import { Plus, Pencil, X, Gift, Check, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'

interface Reward {
  id: string
  name: string
  description: string
  points_cost: number
  active: boolean
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function RewardModal({ reward, onClose, onSave }: {
  reward: Reward | null
  onClose: () => void
  onSave: (data: Omit<Reward, 'id'> & { id?: string }) => Promise<void>
}) {
  const [name,        setName]        = useState(reward?.name        ?? '')
  const [description, setDescription] = useState(reward?.description ?? '')
  const [points_cost, setPointsCost]  = useState(reward?.points_cost != null ? String(reward.points_cost) : '')
  const [active,      setActive]      = useState(reward?.active ?? true)
  const [saving,      setSaving]      = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({ id: reward?.id, name, description, points_cost: Number(points_cost), active })
    setSaving(false)
    onClose()
  }

  return (
    <Modal title={reward ? 'Modifier la récompense' : 'Nouvelle récompense'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="space-y-1.5">
          <Label>Nom</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Dessert gratuit" required />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Détails de la récompense" />
        </div>
        <div className="space-y-1.5">
          <Label>Points requis</Label>
          <Input type="number" min={1} value={points_cost} onChange={e => setPointsCost(e.target.value)} placeholder="Ex: 200" required />
        </div>
        <button type="button" onClick={() => setActive(a => !a)} className="flex items-center gap-2.5 w-full text-left">
          {active ? <ToggleRight className="h-6 w-6 text-[#185FA5]" /> : <ToggleLeft className="h-6 w-6 text-gray-300" />}
          <span className="text-sm text-gray-700">{active ? 'Récompense active' : 'Récompense inactive'}</span>
        </button>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
          <Button type="submit" className="flex-1 bg-[#185FA5] hover:bg-[#124880]" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1.5" />} Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default function RewardsPage() {
  const [rewards,     setRewards]     = useState<Reward[]>([])
  const [loading,     setLoading]     = useState(true)
  const [modal,       setModal]       = useState<{ open: boolean; reward: Reward | null }>({ open: false, reward: null })

  useEffect(() => {
    fetch('/api/rewards')
      .then(r => r.json())
      .then(data => { setRewards(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function saveReward(data: Omit<Reward, 'id'> & { id?: string }) {
    if (data.id) {
      const res = await fetch(`/api/rewards/${data.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, description: data.description, points_cost: data.points_cost, active: data.active }),
      })
      const updated = await res.json()
      setRewards(prev => prev.map(r => r.id === data.id ? updated : r))
    } else {
      const res = await fetch('/api/rewards', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const created = await res.json()
      setRewards(prev => [...prev, created])
    }
  }

  async function toggleReward(reward: Reward) {
    const res = await fetch(`/api/rewards/${reward.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !reward.active }),
    })
    const updated = await res.json()
    setRewards(prev => prev.map(r => r.id === reward.id ? updated : r))
  }

  async function deleteReward(id: string) {
    await fetch(`/api/rewards/${id}`, { method: 'DELETE' })
    setRewards(prev => prev.filter(r => r.id !== id))
  }

  return (
    <AppShell>
      <div className="p-6 space-y-8 max-w-4xl mx-auto">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Récompenses</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gérez les récompenses visibles par vos clients.</p>
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Gift className="h-4 w-4 text-[#185FA5]" /> Récompenses disponibles
            </h2>
            <Button size="sm" className="gap-1.5 text-xs bg-[#185FA5] hover:bg-[#124880]"
              onClick={() => setModal({ open: true, reward: null })}>
              <Plus className="h-3.5 w-3.5" /> Nouvelle récompense
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
              ) : rewards.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">Aucune récompense. Créez-en une !</div>
              ) : (
                <div className="divide-y">
                  {rewards.map(reward => (
                    <div key={reward.id} className="flex items-center gap-4 px-5 py-3.5">
                      <button onClick={() => toggleReward(reward)} className="shrink-0">
                        {reward.active ? <ToggleRight className="h-6 w-6 text-[#185FA5]" /> : <ToggleLeft className="h-6 w-6 text-gray-300" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium truncate ${!reward.active ? 'text-gray-400' : 'text-gray-900'}`}>{reward.name}</p>
                          {!reward.active && <Badge variant="secondary" className="text-[10px] shrink-0">Inactif</Badge>}
                        </div>
                        {reward.description && <p className="text-xs text-gray-400 truncate">{reward.description}</p>}
                      </div>
                      <Badge variant="secondary" className="font-semibold shrink-0">{reward.points_cost.toLocaleString()} pts</Badge>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => setModal({ open: true, reward })}
                          className="p-1.5 text-gray-400 hover:text-[#185FA5] rounded hover:bg-blue-50 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deleteReward(reward.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {modal.open && (
        <RewardModal
          reward={modal.reward}
          onClose={() => setModal({ open: false, reward: null })}
          onSave={saveReward}
        />
      )}
    </AppShell>
  )
}
