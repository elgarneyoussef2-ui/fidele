'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Gift, Check, X, Loader2, Bell } from 'lucide-react'

interface Request {
  id: string
  client_name: string
  reward_name: string
  reward_points: number
  created_at: string
}

function timeAgo(iso: string) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'À l\'instant'
  if (min < 60) return `Il y a ${min} min`
  return `Il y a ${Math.floor(min / 60)}h`
}

export default function RedemptionPanel() {
  const [requests,  setRequests]  = useState<Request[]>([])
  const [loading,   setLoading]   = useState(true)
  const [acting,    setActing]    = useState<string | null>(null)

  const load = useCallback(() => {
    fetch('/api/redemption')
      .then(r => r.json())
      .then(data => { setRequests(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [load])

  async function act(id: string, action: 'accept' | 'reject') {
    setActing(id)
    await fetch(`/api/redemption/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setRequests(prev => prev.filter(r => r.id !== id))
    setActing(null)
  }

  if (loading) return null
  if (requests.length === 0) return null

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-orange-500" />
          Demandes de récompenses
          <Badge className="bg-orange-500 text-white ml-1">{requests.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map(req => (
          <div key={req.id} className="bg-white rounded-lg p-3 flex items-center justify-between gap-3 shadow-sm border border-orange-100">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <Gift className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  <span className="font-bold">{req.client_name}</span> — {req.reward_name}
                </p>
                <p className="text-xs text-gray-400">{req.reward_points} pts · {timeAgo(req.created_at)}</p>
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button
                size="sm"
                className="bg-green-500 hover:bg-green-600 h-8 px-3 gap-1"
                onClick={() => act(req.id, 'accept')}
                disabled={acting === req.id}
              >
                {acting === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Accepter
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 gap-1 text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => act(req.id, 'reject')}
                disabled={acting === req.id}
              >
                <X className="h-3 w-3" /> Refuser
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
