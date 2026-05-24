'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import DashboardNav from '@/components/dashboard/DashboardNav'
import {
  Plus, Pencil, Medal, Award, Trophy,
  X, ToggleLeft, ToggleRight, Gift,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Tier {
  id: number
  name: string
  range: string
  color: string
  bg: string
  border: string
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

// ─── Données mockées ──────────────────────────────────────────────────────────

const INITIAL_TIERS: Tier[] = [
  {
    id: 1,
    name: 'Bronze',
    range: '0 – 500 pts',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: Medal,
    perks: ['Thé à la menthe offert à chaque visite', 'Accès aux offres du mois'],
  },
  {
    id: 2,
    name: 'Argent',
    range: '501 – 1 000 pts',
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    icon: Award,
    perks: ['-10% sur la commande', 'Dessert maison offert', 'File prioritaire le weekend'],
  },
  {
    id: 3,
    name: 'Or',
    range: '1 001 pts et +',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: Trophy,
    perks: ['-20% sur toutes les commandes', 'Table réservée sans attente', 'Plat surprise offert chaque mois', 'Invitation événements exclusifs'],
  },
]

const INITIAL_REWARDS: Reward[] = [
  { id: 1, name: 'Thé à la menthe offert',   description: 'Un verre de thé à la menthe marocaine',   points: 100,  limit: null, used: 38, active: true  },
  { id: 2, name: 'Dessert gratuit',            description: 'Choisir parmi la sélection du chef',       points: 200,  limit: 50,   used: 21, active: true  },
  { id: 3, name: 'Réduction 15%',             description: 'Sur l'ensemble de la commande',            points: 350,  limit: null, used: 15, active: true  },
  { id: 4, name: 'Plat principal offert',      description: 'Un tajine ou couscous au choix',           points: 500,  limit: 20,   used: 7,  active: false },
  { id: 5, name: 'Repas complet pour 2',       description: 'Entrée, plat et dessert pour 2 personnes', points: 1000, limit: 10,   used: 2,  active: true  },
]

// ─── Modale Nouvelle Récompense ───────────────────────────────────────────────

interface ModalProps {
  onClose: () => void
  onSave:  (r: Omit<Reward, 'id' | 'used'>) => void
}

function NewRewardModal({ onClose, onSave }: ModalProps) {
  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [points,      setPoints]      = useState('')
  const [limit,       setLimit]       = useState('')
  const [active,      setActive]      = useState(true)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !points) return
    onSave({
      name,
      description,
      points:  parseInt(points),
      limit:   limit ? parseInt(limit) : null,
      active,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold text-gray-900">Nouvelle récompense</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="r-name">Nom</Label>
            <Input id="r-name" placeholder="Ex: Dessert gratuit" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="r-desc">Description</Label>
            <Input id="r-desc" placeholder="Détails de la récompense" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="r-pts">Points requis</Label>
              <Input id="r-pts" type="number" min={1} placeholder="Ex: 200" value={points} onChange={e => setPoints(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-lim">Limite d'utilisation</Label>
              <Input id="r-lim" type="number" min={1} placeholder="Illimité" value={limit} onChange={e => setLimit(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={() => setActive(a => !a)} className="focus:outline-none">
              {active
                ? <ToggleRight className="h-7 w-7 text-[#185FA5]" />
                : <ToggleLeft  className="h-7 w-7 text-gray-300"  />}
            </button>
            <span className="text-sm text-gray-600">Activer immédiatement</span>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1 bg-[#185FA5] hover:bg-[#124880]">Ajouter</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function RewardsPage() {
  const [rewards,     setRewards]     = useState<Reward[]>(INITIAL_REWARDS)
  const [modalOpen,   setModalOpen]   = useState(false)

  function toggleReward(id: number) {
    setRewards(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r))
  }

  function addReward(r: Omit<Reward, 'id' | 'used'>) {
    setRewards(prev => [...prev, { ...r, id: Date.now(), used: 0 }])
  }

  return (
    <>
      <DashboardNav />

      <div className="p-6 space-y-8 bg-gray-50 min-h-screen max-w-7xl mx-auto">

        {/* En-tête */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Récompenses</h1>
          <p className="text-gray-500 mt-1">Gérez les paliers de fidélité et les récompenses de votre restaurant.</p>
        </div>

        {/* ── Section paliers ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Paliers de fidélité
            </h2>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="h-4 w-4" /> Ajouter un palier
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {INITIAL_TIERS.map(tier => {
              const Icon = tier.icon
              return (
                <Card key={tier.id} className={`border-2 ${tier.border}`}>
                  <CardHeader className={`${tier.bg} rounded-t-xl pb-3`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-full bg-white ${tier.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <CardTitle className={`text-lg ${tier.color}`}>{tier.name}</CardTitle>
                      </div>
                      <button className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-white/70 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                    <p className={`text-sm font-medium ${tier.color} mt-1`}>{tier.range}</p>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Avantages</p>
                    <ul className="space-y-1.5">
                      {tier.perks.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className={`mt-0.5 h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${tier.bg} ${tier.color}`}>✓</span>
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

        {/* ── Section récompenses ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Gift className="h-5 w-5 text-[#185FA5]" />
              Récompenses disponibles
            </h2>
            <Button
              size="sm"
              className="gap-1.5 bg-[#185FA5] hover:bg-[#124880]"
              onClick={() => setModalOpen(true)}
            >
              <Plus className="h-4 w-4" /> Nouvelle récompense
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {/* En-tête tableau */}
              <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide rounded-t-xl">
                <span>Récompense</span>
                <span className="text-right">Points</span>
                <span className="text-right">Utilisations</span>
                <span className="text-center">Statut</span>
                <span></span>
              </div>

              <div className="divide-y">
                {rewards.map(reward => (
                  <div key={reward.id} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto_auto] gap-2 sm:gap-4 items-center px-5 py-4">
                    {/* Nom + description */}
                    <div>
                      <p className="font-medium text-gray-900">{reward.name}</p>
                      {reward.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{reward.description}</p>
                      )}
                    </div>

                    {/* Points */}
                    <div className="flex sm:justify-end items-center gap-1">
                      <span className="text-xs text-gray-400 sm:hidden">Points :</span>
                      <Badge variant="secondary" className="font-semibold">
                        {reward.points.toLocaleString()} pts
                      </Badge>
                    </div>

                    {/* Utilisations */}
                    <div className="text-sm text-gray-600 sm:text-right">
                      <span className="sm:hidden text-xs text-gray-400">Utilisé : </span>
                      {reward.used}
                      {reward.limit && <span className="text-gray-400"> / {reward.limit}</span>}
                    </div>

                    {/* Toggle statut */}
                    <div className="flex items-center gap-2 sm:justify-center">
                      <button
                        onClick={() => toggleReward(reward.id)}
                        className="focus:outline-none"
                        title={reward.active ? 'Désactiver' : 'Activer'}
                      >
                        {reward.active
                          ? <ToggleRight className="h-6 w-6 text-[#185FA5]" />
                          : <ToggleLeft  className="h-6 w-6 text-gray-300"  />}
                      </button>
                      <span className="text-xs sm:hidden">
                        {reward.active
                          ? <Badge variant="success">Actif</Badge>
                          : <Badge variant="secondary">Inactif</Badge>}
                      </span>
                    </div>

                    {/* Bouton modifier */}
                    <button className="text-gray-400 hover:text-[#185FA5] transition-colors sm:justify-self-end">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {modalOpen && (
        <NewRewardModal onClose={() => setModalOpen(false)} onSave={addReward} />
      )}
    </>
  )
}
