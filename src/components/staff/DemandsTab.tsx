'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, CheckCircle2, XCircle, Clock, Loader2, Search } from 'lucide-react'
import type { Demand } from './types'

function ago(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'À l\'instant'
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  return h < 24 ? `Il y a ${h}h` : `Il y a ${Math.floor(h / 24)}j`
}

type ActionError = { message: string; action: 'accept' | 'reject' }

export default function DemandsTab({ staffId, onCountChange }: { staffId: string; onCountChange: (n: number) => void }) {
  const [demands,     setDemands]     = useState<Demand[]>([])
  const [loading,     setLoading]     = useState(true)
  const [loadError,   setLoadError]   = useState('')
  const [acting,      setActing]      = useState<string | null>(null)
  const [done,        setDone]        = useState<Record<string, 'accepted' | 'rejected'>>({})
  const [actionError, setActionError] = useState<Record<string, ActionError>>({})
  const [confirming,  setConfirming]  = useState<{ id: string; action: 'accept' | 'reject' } | null>(null)
  const [query,       setQuery]       = useState('')

  const load = useCallback(async () => {
    setLoading(true); setLoadError('')
    try {
      const res  = await fetch(`/api/redemption?staffId=${staffId}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur de chargement')
      const list = Array.isArray(data) ? data : []
      setDemands(list)
      onCountChange(list.length)
    } catch (e: any) {
      setLoadError(e.message ?? 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [staffId, onCountChange])

  useEffect(() => { load() }, [load])

  async function act(id: string, action: 'accept' | 'reject') {
    setActing(id)
    setActionError(prev => {
      if (!(id in prev)) return prev
      const next = { ...prev }; delete next[id]; return next
    })
    try {
      const res  = await fetch(`/api/redemption/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, staffId }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Action impossible')
      setDone(prev => ({ ...prev, [id]: action === 'accept' ? 'accepted' : 'rejected' }))
      setTimeout(load, 1000)
    } catch (e: any) {
      setActionError(prev => ({ ...prev, [id]: { message: e.message ?? 'Action impossible', action } }))
    } finally {
      setActing(null)
      setConfirming(null)
    }
  }

  const pending  = demands.filter(d => !done[d.id])
  const resolved = demands.filter(d =>  done[d.id])
  const trimmedQuery = query.trim()
  const filtered = trimmedQuery
    ? pending.filter(d => d.client_name.toLowerCase().includes(trimmedQuery.toLowerCase()))
    : pending

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="fadein">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#5B21B6' }}>
          {pending.length} demande{pending.length !== 1 ? 's' : ''} en attente
        </p>
        <button
          onClick={load}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#6B7280', padding: '6px 10px', borderRadius: 8, fontWeight: 500 }}
        >
          <RefreshCw size={13} aria-hidden /> Actualiser
        </button>
      </div>

      {pending.length > 0 && (
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'rgba(21,16,31,.3)', pointerEvents: 'none' }} aria-hidden />
          <input
            type="text" placeholder="Rechercher un client…" aria-label="Rechercher un client"
            value={query} onChange={e => setQuery(e.target.value)}
            style={{ width: '100%', border: '1.5px solid rgba(21,16,31,.12)', borderRadius: 14, padding: '12px 14px 12px 42px', fontSize: 14, outline: 'none', background: '#fff', color: '#15101F' }}
          />
        </div>
      )}

      {loadError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }} className="fadein">
          <p style={{ fontSize: 13, color: '#EF4444', fontWeight: 600 }}>{loadError}</p>
          <button onClick={load} style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: '#EF4444', padding: '6px 12px', borderRadius: 8, flexShrink: 0 }}>Réessayer</button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#C4B5FD' }}>
          <Loader2 size={28} style={{ animation: 'spin .8s linear infinite', margin: '0 auto' }} aria-hidden />
        </div>
      )}

      {!loading && !loadError && pending.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 24, padding: '52px 24px', textAlign: 'center', boxShadow: '0 2px 16px rgba(21,16,31,.06)' }}>
          <Clock size={36} style={{ color: '#E5E7EB', margin: '0 auto 12px' }} aria-hidden />
          <p style={{ fontSize: 15, fontWeight: 600, color: '#6B7280' }}>Aucune demande en attente</p>
        </div>
      )}

      {!loading && !loadError && pending.length > 0 && filtered.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 24, padding: '40px 24px', textAlign: 'center', boxShadow: '0 2px 16px rgba(21,16,31,.06)' }} className="fadein">
          <Search size={32} style={{ color: '#E5E7EB', margin: '0 auto 12px' }} aria-hidden />
          <p style={{ fontSize: 15, fontWeight: 600, color: '#6B7280' }}>Aucun résultat pour « {trimmedQuery} »</p>
          <button onClick={() => setQuery('')} style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: '#5B21B6', padding: '8px 14px', borderRadius: 10, background: '#EDE6FB' }}>
            Effacer la recherche
          </button>
        </div>
      )}

      {filtered.map(d => (
        <div key={d.id} style={{ background: '#fff', borderRadius: 20, padding: 18, boxShadow: '0 2px 12px rgba(21,16,31,.07)', display: 'flex', flexDirection: 'column', gap: 12 }} className="fadein">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: '#EDE6FB', color: '#5B21B6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }} aria-hidden>🎁</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#15101F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.reward_name}</p>
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{d.client_name} · {ago(d.created_at)}</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#5B21B6', marginTop: 3, fontFamily: 'var(--font-mono), monospace' }}>{d.reward_points} pts</p>
            </div>
            {acting === d.id ? (
              <Loader2 size={22} style={{ animation: 'spin .8s linear infinite', color: '#C4B5FD', flexShrink: 0 }} aria-hidden />
            ) : done[d.id] === 'accepted' ? (
              <CheckCircle2 size={28} style={{ color: '#16A34A', flexShrink: 0 }} aria-hidden />
            ) : done[d.id] === 'rejected' ? (
              <XCircle size={28} style={{ color: '#EF4444', flexShrink: 0 }} aria-hidden />
            ) : confirming?.id !== d.id ? (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => setConfirming({ id: d.id, action: 'reject' })} aria-label="Refuser la demande" style={{ width: 44, height: 44, borderRadius: 14, background: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <XCircle size={20} aria-hidden />
                </button>
                <button onClick={() => setConfirming({ id: d.id, action: 'accept' })} aria-label="Accepter la demande" style={{ width: 44, height: 44, borderRadius: 14, background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={20} aria-hidden />
                </button>
              </div>
            ) : null}
          </div>

          {confirming?.id === d.id && (
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: confirming.action === 'accept' ? '#F0FDF4' : '#FEF2F2', borderRadius: 14, padding: '10px 14px' }}
              className="popin"
            >
              <p style={{ fontSize: 13, fontWeight: 600, color: confirming.action === 'accept' ? '#16A34A' : '#EF4444' }}>
                Confirmer {confirming.action === 'accept' ? "l'acceptation" : 'le refus'} ?
              </p>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => setConfirming(null)} style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', padding: '7px 12px', borderRadius: 10 }}>
                  Annuler
                </button>
                <button
                  onClick={() => act(d.id, confirming.action)}
                  style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: confirming.action === 'accept' ? '#16A34A' : '#EF4444', padding: '7px 14px', borderRadius: 10 }}
                >
                  Confirmer
                </button>
              </div>
            </div>
          )}

          {actionError[d.id] && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: '#FEF2F2', borderRadius: 14, padding: '10px 14px' }} className="fadein">
              <p style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>{actionError[d.id].message}</p>
              <button onClick={() => act(d.id, actionError[d.id].action)} style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', flexShrink: 0 }}>Réessayer</button>
            </div>
          )}
        </div>
      ))}

      {resolved.length > 0 && (
        <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 4 }}>
          {resolved.length} demande{resolved.length !== 1 ? 's' : ''} traitée{resolved.length !== 1 ? 's' : ''} cette session
        </p>
      )}
    </div>
  )
}
