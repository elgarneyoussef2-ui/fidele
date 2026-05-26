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
    <div className="fixed inset-0 bg-fidele-ink/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-lc w-full max-w-md border border-border/50" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="font-semibold text-foreground eyebrow">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-5 w-5" /></button>
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
  const [name, setName] = useState(reward?.name ?? '')
  const [description, setDescription] = useState(reward?.description ?? '')
  const [points_cost, setPointsCost] = useState(reward?.points_cost != null ? String(reward.points_cost) : '')
  const [active, setActive] = useState(reward?.active ?? true)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({ id: reward?.id, name, description, points_cost: Number(points_cost), active })
    setSaving(false)
    onClose()
  }

  return (
    <Modal title={reward ? 'Modifier la récompense' : 'Nouvelle récompense'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs eyebrow text-muted-foreground">Nom de la récompense</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Dessert gratuit" required className="rounded-xl border-border/60" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs eyebrow text-muted-foreground">Description</Label>
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Détails de la récompense" className="rounded-xl border-border/60" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs eyebrow text-muted-foreground">Points requis</Label>
          <Input type="number" min={1} value={points_cost} onChange={e => setPointsCost(e.target.value)} placeholder="Ex: 200" required className="rounded-xl border-border/60 num-mono" />
        </div>
        <button type="button" onClick={() => setActive(a => !a)} className="flex items-center gap-3 w-full text-left py-2 group">
          {active ? <ToggleRight className="h-7 w-7 text-primary transition-colors" /> : <ToggleLeft className="h-7 w-7 text-muted-foreground/30 transition-colors" />}
          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{active ? 'Récompense active' : 'Récompense inactive'}</span>
        </button>
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="ghost" className="flex-1 rounded-xl" onClick={onClose}>Annuler</Button>
          <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1.5" />} Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; reward: Reward | null }>({ open: false, reward: null })

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
          <h1 className="text-3xl font-display italic text-foreground leading-none">Récompenses</h1>
          <p className="eyebrow mt-1 text-primary">Gérez les récompenses visibles par vos clients.</p>
        </div>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" /> Récompenses disponibles
            </h2>
            <Button size="sm" className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm"
              onClick={() => setModal({ open: true, reward: null })}>
              <Plus className="h-3.5 w-3.5" /> Nouvelle récompense
            </Button>
          </div>

          <Card className="shadow-card border-none overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary/20" /></div>
              ) : rewards.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">Aucune récompense. Créez-en une !</div>
              ) : (
                <div className="divide-y divide-border/50">
                  {rewards.map(reward => (
                    <div key={reward.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                      <button onClick={() => toggleReward(reward)} className="shrink-0 transition-opacity hover:opacity-80">
                        {reward.active ? <ToggleRight className="h-7 w-7 text-primary" /> : <ToggleLeft className="h-7 w-7 text-muted-foreground/30" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold truncate ${!reward.active ? 'text-muted-foreground' : 'text-foreground'}`}>{reward.name}</p>
                          {!reward.active && <Badge variant="secondary" className="text-[10px] shrink-0 uppercase tracking-widest font-bold">Inactif</Badge>}
                        </div>
                        {reward.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{reward.description}</p>}
                      </div>
                      <Badge variant="outline" className="font-bold shrink-0 num-mono bg-primary/5 text-primary border-primary/10 px-3 py-1 rounded-full">{reward.points_cost.toLocaleString()} pts</Badge>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button onClick={() => setModal({ open: true, reward })}
                          className="p-2 text-muted-foreground hover:text-primary rounded-xl hover:bg-primary/5 transition-all">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteReward(reward.id)}
                          className="p-2 text-muted-foreground hover:text-destructive rounded-xl hover:bg-destructive/5 transition-all">
                          <X className="h-4 w-4" />
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
