'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wifi } from 'lucide-react'

interface Visit {
  id: string
  points_earned: number
  amount_paid: number
  created_at: string
  clients: { name: string } | null
}

function timeAgo(iso: string) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'À l\'instant'
  if (min < 60) return `Il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Il y a ${h}h`
  return `Il y a ${Math.floor(h / 24)}j`
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function LiveActivityFeed() {
  const [visits,   setVisits]   = useState<Visit[]>([])
  const [notif,    setNotif]    = useState<Visit | null>(null)
  const [newIds,   setNewIds]   = useState<Set<string>>(new Set())
  const latestId   = useRef<string | null>(null)
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    const res  = await fetch('/api/recent-visits')
    if (!res.ok) return
    const data: Visit[] = await res.json()
    if (!data.length) return

    const topId = data[0].id

    if (latestId.current && topId !== latestId.current) {
      // Find all new visits since last fetch
      const oldIdx  = data.findIndex(v => v.id === latestId.current)
      const fresh   = oldIdx >= 0 ? data.slice(0, oldIdx) : data.slice(0, 3)
      const freshIds = new Set(fresh.map(v => v.id))

      setNewIds(freshIds)
      setNotif(fresh[0])
      if (notifTimer.current) clearTimeout(notifTimer.current)
      notifTimer.current = setTimeout(() => setNotif(null), 6000)
    }

    latestId.current = topId
    setVisits(data)
  }, [])

  useEffect(() => {
    load()
    const iv = setInterval(load, 10000)
    return () => { clearInterval(iv); if (notifTimer.current) clearTimeout(notifTimer.current) }
  }, [load])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          Activité en direct
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-0 p-0">
        {/* Notification banner */}
        {notif && (
          <div className="mx-4 mb-3 flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <Wifi className="h-4 w-4 text-green-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-800">
                Nouveau scan — {notif.clients?.name ?? 'Client'}
              </p>
              <p className="text-xs text-green-600">+{notif.points_earned} pts · {notif.amount_paid} MAD</p>
            </div>
          </div>
        )}

        {visits.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Aucune visite encore.</p>
        ) : (
          <div className="divide-y">
            {visits.map(v => {
              const name = v.clients?.name ?? 'Client'
              const isNew = newIds.has(v.id)
              return (
                <div
                  key={v.id}
                  className={`flex items-center justify-between px-4 py-3 transition-colors duration-700 ${isNew ? 'bg-green-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#185FA5]/10 text-[#185FA5] flex items-center justify-center text-xs font-bold shrink-0">
                      {initials(name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{name}</p>
                      <p className="text-xs text-gray-400">{timeAgo(v.created_at)}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    +{v.points_earned} pts
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
