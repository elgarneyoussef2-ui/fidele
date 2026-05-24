'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AppShell from '@/components/dashboard/AppShell'
import { Plus, Pencil, Medal, Award, Trophy, X, Gift, Check, ToggleLeft, ToggleRight } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tier {
  id: number
  name: string
  min: number
  max: number | null
  color: string
  bg: string
  border: string
  textColor: string
  icon: React.ElementType
  perks: string[]
}

interface Reward {
  id: number
  name: string
  description: string
  points: number
  limit: number | null
  used: number
  active: boolean
}

// ─── Données initiales ────────────────────────────────────────────────────────

const INIT_TIERS: Tier[] = [
  {
    id: 1, name: 'Bronze', min: 0, max: 500,
    color: 'border-amber-300', bg: 'bg-amber-50', border: 'border-amber-300', textColor: 'text-amber-700',
    icon: Medal,
    perks: ['Thé à la menthe offert à chaque visite', 'Accès aux offres du mois'],
  },
  {
    id: 2, name: 'Argent', min: 501, max: 1000,
    color: 'border-slate-300', bg: 'bg-slate-50', border: 'border-slate-300', textColor: 'text-slate-600',
    icon: Award,
    perks: ['-10% sur la commande', 'Dessert maison offert', 'File prioritaire le weekend'],
  },
  {
    id: 3, name: 'Or', min: 1001, max: null,
    color: 'border-yellow-400', bg: 'bg-yellow-50', border: 'border-yellow-400', textColor: 'text-yellow-600',
    icon: Trophy,
    perks: ['-20% sur toutes les commandes', 'Table réservée sans attente', 'Plat surprise offert chaque mois'],
  },
]

const INIT_REWARDS: Reward[] = [
  { id: 1, name: 'Thé à la menthe offert',  description: 'Un verre de thé à la menthe marocaine',    points: 100,  limit: null, used: 38, active: true  },
  { id: 2, name: 'Dessert gratuit',           description: "Choisir parmi la sélection du chef",       points: 200,  limit: 50,   used: 21, active: true  },
  { id: 3, name: 'Réduction 15%',            description: "Sur l'ensemble de la commande",             points: 350,  limit: null, used: 15, active: true  },
  { id: 4, name: 'Plat principal offert',     description: 'Un tajine ou couscous au choix',            points: 500,  limit: 20,   used: 7,  active: false },
  { id: 5, name: 'Repas complet pour 2',      description: 'Entrée, plat et dessert pour 2 personnes', points: 1000, limit: 10,   used: 2,  active: true  },
]

// ─── Modale générique ─────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Modale palier ────────────────────────────────────────────────────────────

function TierModal({ tier, onClose, onSave }: {
  tier: Tier | null
  onClose: () => void
  onSave: (t: Partial<Tier> & { id?: number }) => void
}) {
  const [name,  setName]  = useState(tier?.name  ?? '')
  const [min,   setMin]   = useState(String(tier?.min  ?? ''))
  const [max,   setMax]   = useState(tier?.max != null ? String(tier.max) : '')
  const [perks, setPerks] = useState<string[]>(tier?.perks ?? [''])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ id: tier?.id, name, min: Number(min), max: max ? Number(max) : null, perks: perks.filter(Boolean) })
    onClose()
  }

  return (
    <Modal title={tier ? 'Modifier le palier' : 'Nouveau palier'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="space-y-1.5">
          <Label>Nom du palier</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Platine" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Points min</Label>
            <Input type="number" min={0} value={min} onChange={e => setMin(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Points max</Label>
            <Input type="number" min={0} value={max} onChange={e => setMax(e.target.value)} placeholder="Illimité" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Avantages</Label>
          {perks.map((perk, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={perk}
                onChange={e => setPerks(prev => prev.map((p, j) => j === i ? e.target.value : p))}
                placeholder={`Avantage ${i + 1}`}
              />
              {perks.length > 1 && (
                <button type="button" onClick={() => setPerks(prev => prev.filter((_, j) => j !== i))}
                  className="text-gray-400 hover:text-red-500 transition-colors shrink-0">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setPerks(prev => [...prev, ''])}
            className="text-xs text-[#185FA5] hover:underline">
            + Ajouter un avantage
          </button>
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
          <Button type="submit" className="flex-1 bg-[#185FA5] hover:bg-[#124880]">
            <Check className="h-4 w-4 mr-1.5" /> Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Modale récompense ────────────────────────────────────────────────────────

function RewardModal({ reward, onClose, onSave }: {
  reward: Reward | null
  onClose: () => void
  onSave: (r: Omit<Reward, 'id' | 'used'> & { id?: number }) => void
}) {
  const [name,        setName]        = useState(reward?.name        ?? '')
  const [description, setDescription] = useState(reward?.description ?? '')
  const [points,      setPoints]      = useState(reward?.points != null ? String(reward.points) : '')
  const [limit,       setLimit]       = useState(reward?.limit  != null ? String(reward.limit)  : '')
  const [active,      setActive]      = useState(reward?.active ?? true)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ id: reward?.id, name, description, points: Number(points), limit: limit ? Number(limit) : null, active })
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
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Points requis</Label>
            <Input type="number" min={1} value={points} onChange={e => setPoints(e.target.value)} placeholder="Ex: 200" required />
          </div>
          <div className="space-y-1.5">
            <Label>Limite d'utilisation</Label>
            <Input type="number" min={1} value={limit} onChange={e => setLimit(e.target.value)} placeholder="Illimité" />
          </div>
        </div>
        <button type="button" onClick={() => setActive(a => !a)}
          className="flex items-center gap-2.5 w-full text-left">
          {active
            ? <ToggleRight className="h-6 w-6 text-[#185FA5] shrink-0" />
            : <ToggleLeft  className="h-6 w-6 text-gray-300 shrink-0" />}
          <span className="text-sm text-gray-700">{active ? 'Récompense active' : 'Récompense inactive'}</span>
        </button>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
          <Button type="submit" className="flex-1 bg-[#185FA5] hover:bg-[#124880]">
            <Check className="h-4 w-4 mr-1.5" /> Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RewardsPage() {
  const [tiers,        setTiers]        = useState<Tier[]>(INIT_TIERS)
  const [rewards,      setRewards]      = useState<Reward[]>(INIT_REWARDS)
  const [tierModal,    setTierModal]    = useState<{ open: boolean; tier: Tier | null }>({ open: false, tier: null })
  const [rewardModal,  setRewardModal]  = useState<{ open: boolean; reward: Reward | null }>({ open: false, reward: null })

  function saveTier(data: Partial<Tier> & { id?: number }) {
    if (data.id) {
      setTiers(prev => prev.map(t => t.id === data.id ? { ...t, ...data } : t))
    } else {
      const colors = ['border-blue-300', 'border-purple-300', 'border-pink-300']
      const bgs    = ['bg-blue-50', 'bg-purple-50', 'bg-pink-50']
      const texts  = ['text-blue-600', 'text-purple-600', 'text-pink-600']
      const icons  = [Medal, Award, Trophy]
      const idx    = tiers.length % 3
      setTiers(prev => [...prev, {
        id: Date.now(), color: colors[idx], bg: bgs[idx], border: colors[idx], textColor: texts[idx],
        icon: icons[idx], perks: [],
        name: data.name ?? '', min: data.min ?? 0, max: data.max ?? null,
        ...data,
      } as Tier])
    }
  }

  function saveReward(data: Omit<Reward, 'id' | 'used'> & { id?: number }) {
    if (data.id) {
      setRewards(prev => prev.map(r => r.id === data.id ? { ...r, ...data } : r))
    } else {
      setRewards(prev => [...prev, { ...data, id: Date.now(), used: 0 }])
    }
  }

  function toggleReward(id: number) {
    setRewards(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r))
  }

  function deleteReward(id: number) {
    setRewards(prev => prev.filter(r => r.id !== id))
  }

  return (
    <AppShell>
      <div className="p-6 space-y-8 max-w-5xl mx-auto">

        {/* En-tête */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Récompenses</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gérez les paliers et récompenses de fidélité.</p>
        </div>

        {/* ── Paliers ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" /> Paliers de fidélité
            </h2>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs"
              onClick={() => setTierModal({ open: true, tier: null })}>
              <Plus className="h-3.5 w-3.5" /> Ajouter un palier
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map(tier => {
              const Icon = tier.icon
              return (
                <Card key={tier.id} className={`border-2 ${tier.border} overflow-hidden`}>
                  <div className={`${tier.bg} px-4 py-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${tier.textColor}`} />
                      <span className={`font-semibold ${tier.textColor}`}>{tier.name}</span>
                    </div>
                    <button
                      onClick={() => setTierModal({ open: true, tier })}
                      className={`${tier.textColor} opacity-60 hover:opacity-100 transition-opacity`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-3">
                      {tier.min.toLocaleString()} – {tier.max != null ? `${tier.max.toLocaleString()} pts` : '∞'}
                    </p>
                    <ul className="space-y-1.5">
                      {tier.perks.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${tier.textColor}`} />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* ── Récompenses ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Gift className="h-4 w-4 text-[#185FA5]" /> Récompenses disponibles
            </h2>
            <Button size="sm" className="gap-1.5 text-xs bg-[#185FA5] hover:bg-[#124880]"
              onClick={() => setRewardModal({ open: true, reward: null })}>
              <Plus className="h-3.5 w-3.5" /> Nouvelle récompense
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {rewards.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  Aucune récompense. Créez-en une !
                </div>
              ) : (
                <div className="divide-y">
                  {rewards.map(reward => (
                    <div key={reward.id} className="flex items-center gap-4 px-5 py-3.5">
                      {/* Toggle */}
                      <button onClick={() => toggleReward(reward.id)} className="shrink-0">
                        {reward.active
                          ? <ToggleRight className="h-6 w-6 text-[#185FA5]" />
                          : <ToggleLeft  className="h-6 w-6 text-gray-300" />}
                      </button>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium truncate ${!reward.active ? 'text-gray-400' : 'text-gray-900'}`}>
                            {reward.name}
                          </p>
                          {!reward.active && <Badge variant="secondary" className="text-[10px] shrink-0">Inactif</Badge>}
                        </div>
                        {reward.description && (
                          <p className="text-xs text-gray-400 truncate">{reward.description}</p>
                        )}
                      </div>

                      {/* Points */}
                      <Badge variant="secondary" className="font-semibold shrink-0 hidden sm:flex">
                        {reward.points.toLocaleString()} pts
                      </Badge>

                      {/* Utilisations */}
                      <p className="text-xs text-gray-400 shrink-0 hidden md:block">
                        {reward.used}{reward.limit ? `/${reward.limit}` : ''} utilisations
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setRewardModal({ open: true, reward })}
                          className="p-1.5 text-gray-400 hover:text-[#185FA5] rounded hover:bg-blue-50 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteReward(reward.id)}
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

      {/* Modales */}
      {tierModal.open && (
        <TierModal
          tier={tierModal.tier}
          onClose={() => setTierModal({ open: false, tier: null })}
          onSave={saveTier}
        />
      )}
      {rewardModal.open && (
        <RewardModal
          reward={rewardModal.reward}
          onClose={() => setRewardModal({ open: false, reward: null })}
          onSave={saveReward}
        />
      )}
    </AppShell>
  )
}
