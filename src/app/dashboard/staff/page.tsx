'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/dashboard/AppShell'
import { UserPlus, Trash2, Loader2, Users } from 'lucide-react'

type Member = { id: string; name: string; role: string; created_at: string }

export default function StaffPage() {
  const [members,  setMembers]  = useState<Member[]>([])
  const [loading,  setLoading]  = useState(true)
  const [name,     setName]     = useState('')
  const [password, setPassword] = useState('')
  const [role,     setRole]     = useState('server')
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error,    setError]    = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/staff')
    const data = await res.json()
    setMembers(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    const res = await fetch('/api/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, password, role }) })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Erreur'); return }
    setName(''); setPassword(''); setRole('server')
    load()
  }

  async function remove(id: string) {
    setDeleting(id)
    await fetch(`/api/staff/${id}`, { method: 'DELETE' })
    setDeleting(null)
    load()
  }

  const inp: React.CSSProperties = { width: '100%', border: '1.5px solid rgba(21,16,31,.12)', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', background: '#fff', color: '#15101F' }
  const roleLabel: Record<string, string> = { server: 'Serveur', cashier: 'Caissier', manager: 'Manager' }

  return (
    <AppShell>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', fontSize: 36, letterSpacing: '-0.02em', color: '#15101F', lineHeight: 1 }}>
            Équipe
          </h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 8, fontWeight: 500 }}>
            Gérez les accès serveurs et caissiers à l'espace staff.
          </p>
          <div style={{ marginTop: 12 }}>
            <a href="/staff" target="_blank" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#5B21B6', fontWeight: 600, textDecoration: 'none', background: '#EDE6FB', padding: '6px 14px', borderRadius: 8 }}>
              Ouvrir l'espace serveur →
            </a>
          </div>
        </div>

        {/* Add form */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 4px 18px -8px rgba(21,16,31,.1)', marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5B21B6', marginBottom: 16 }}>
            Ajouter un membre
          </p>
          <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input value={name} onChange={e => setName(e.target.value)} style={inp} placeholder="Nom complet" required />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inp} placeholder="Mot de passe" required />
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <select value={role} onChange={e => setRole(e.target.value)} style={{ ...inp, flex: 1 }}>
                <option value="server">Serveur</option>
                <option value="cashier">Caissier</option>
              </select>
              <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#5B21B6', color: '#fff', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', opacity: saving ? .6 : 1 }}>
                {saving ? <Loader2 size={16} style={{ animation: 'spin .8s linear infinite' }} /> : <UserPlus size={16} />}
                Ajouter
              </button>
            </div>
            {error && <p style={{ fontSize: 13, color: '#EF4444', fontWeight: 500 }}>{error}</p>}
          </form>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

        {/* List */}
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 18px -8px rgba(21,16,31,.1)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(21,16,31,.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} style={{ color: '#5B21B6' }} />
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5B21B6' }}>
              {members.length} membre{members.length !== 1 ? 's' : ''}
            </p>
          </div>

          {loading && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
              <Loader2 size={24} style={{ animation: 'spin .8s linear infinite', margin: '0 auto' }} />
            </div>
          )}

          {!loading && members.length === 0 && (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 500 }}>Aucun membre dans l'équipe.</p>
            </div>
          )}

          {members.map((m, i) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderTop: i === 0 ? 'none' : '1px solid rgba(21,16,31,.06)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EDE6FB', color: '#5B21B6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                {m.name[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#15101F' }}>{m.name}</p>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>{roleLabel[m.role] ?? m.role}</p>
              </div>
              <button onClick={() => remove(m.id)} disabled={deleting === m.id} style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: deleting === m.id ? .5 : 1 }}>
                {deleting === m.id ? <Loader2 size={15} style={{ animation: 'spin .8s linear infinite' }} /> : <Trash2 size={15} />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
