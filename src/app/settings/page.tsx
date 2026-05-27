'use client'

import { useEffect, useState, useRef } from 'react'
import AppShell from '@/components/dashboard/AppShell'
import { CheckCircle2, Loader2, Store, Image as ImageIcon, FileText, Phone, Palette } from 'lucide-react'

type RestaurantData = {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
  accent_color: string | null
  phone: string | null
}

const COLORS = ['#5B21B6', '#0369A1', '#065F46', '#B45309', '#BE185D', '#DC2626', '#374151']

export default function SettingsPage() {
  const [data,    setData]    = useState<RestaurantData | null>(null)
  const [name,    setName]    = useState('')
  const [desc,    setDesc]    = useState('')
  const [logo,    setLogo]    = useState('')
  const [cover,   setCover]   = useState('')
  const [color,   setColor]   = useState('#5B21B6')
  const [phone,   setPhone]   = useState('')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    fetch('/api/restaurant')
      .then(r => r.ok ? r.json() : null)
      .then((d: RestaurantData | null) => {
        if (!d) return
        setData(d)
        setName(d.name ?? '')
        setDesc(d.description ?? '')
        setLogo(d.logo_url ?? '')
        setCover(d.cover_url ?? '')
        setColor(d.accent_color ?? '#5B21B6')
        setPhone(d.phone ?? '')
      })
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)
    const res = await fetch('/api/restaurant', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description: desc, logo_url: logo || null, cover_url: cover || null, accent_color: color, phone }),
    })
    setSaving(false)
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erreur'); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const inp  = (extra?: React.CSSProperties): React.CSSProperties => ({
    width: '100%', border: '1.5px solid rgba(21,16,31,.12)', borderRadius: 12,
    padding: '12px 16px', fontSize: 15, fontFamily: 'inherit',
    outline: 'none', background: '#fff', color: '#15101F',
    transition: 'border-color .15s',
    ...extra,
  })

  return (
    <AppShell>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', fontSize: 36, letterSpacing: '-0.02em', color: '#15101F', lineHeight: 1 }}>
            Page restaurant
          </h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 8, fontWeight: 500 }}>
            Personnalisez ce que vos clients voient dans leur portefeuille fidélité.
          </p>
        </div>

        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Preview card */}
          {(logo || cover || name) && (
            <div style={{
              borderRadius: 20, overflow: 'hidden',
              boxShadow: '0 4px 24px -8px rgba(21,16,31,.15)',
              border: '1px solid rgba(21,16,31,.06)',
            }}>
              <div style={{
                height: cover ? 140 : 80,
                background: cover
                  ? `url(${cover}) center/cover no-repeat`
                  : `linear-gradient(135deg, ${color}22, ${color}44)`,
                position: 'relative',
              }}>
                {logo && (
                  <img src={logo} alt={name} style={{
                    position: 'absolute', bottom: -24, left: 20,
                    width: 56, height: 56, borderRadius: 16, objectFit: 'cover',
                    border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,.15)',
                  }} />
                )}
              </div>
              <div style={{ padding: logo ? '36px 20px 20px' : '20px', background: '#fff' }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#15101F' }}>{name || 'Nom du restaurant'}</p>
                {desc && <p style={{ fontSize: 13, color: '#6B7280', marginTop: 6, lineHeight: 1.6 }}>{desc}</p>}
              </div>
            </div>
          )}

          {/* Nom */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5B21B6', marginBottom: 8 }}>
              <Store size={13} /> Nom du restaurant
            </label>
            <input value={name} onChange={e => setName(e.target.value)} style={inp()} placeholder="Ex: Le Palais Andalou" required />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5B21B6', marginBottom: 8 }}>
              <FileText size={13} /> Description
            </label>
            <textarea
              value={desc} onChange={e => setDesc(e.target.value)}
              rows={3} style={{ ...inp(), resize: 'vertical', lineHeight: 1.6 }}
              placeholder="Décrivez votre restaurant, votre cuisine, votre ambiance…"
            />
          </div>

          {/* Téléphone */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5B21B6', marginBottom: 8 }}>
              <Phone size={13} /> Téléphone (affiché aux clients)
            </label>
            <input value={phone} onChange={e => setPhone(e.target.value)} style={inp()} placeholder="Ex: +212 6 00 00 00 00" type="tel" />
          </div>

          {/* Logo URL */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5B21B6', marginBottom: 8 }}>
              <ImageIcon size={13} /> URL du logo
            </label>
            <input value={logo} onChange={e => setLogo(e.target.value)} style={inp()} placeholder="https://…/logo.png" type="url" />
            {logo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <img src={logo} alt="Logo" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(21,16,31,.08)' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <p style={{ fontSize: 12, color: '#9CA3AF' }}>Aperçu du logo</p>
              </div>
            )}
          </div>

          {/* Cover URL */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5B21B6', marginBottom: 8 }}>
              <ImageIcon size={13} /> URL de la photo de couverture
            </label>
            <input value={cover} onChange={e => setCover(e.target.value)} style={inp()} placeholder="https://…/cover.jpg" type="url" />
            {cover && (
              <div style={{ marginTop: 10, borderRadius: 12, overflow: 'hidden', height: 100 }}>
                <img src={cover} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
            )}
          </div>

          {/* Couleur d'accent */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5B21B6', marginBottom: 12 }}>
              <Palette size={13} /> Couleur d'accent
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)} style={{
                  width: 32, height: 32, borderRadius: '50%', background: c, border: 'none',
                  outline: color === c ? `3px solid ${c}` : '3px solid transparent',
                  outlineOffset: 2, cursor: 'pointer', transition: 'all .15s',
                }} />
              ))}
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(21,16,31,.12)', padding: 2, cursor: 'pointer', background: 'none' }} />
            </div>
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#DC2626', fontWeight: 500 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={saving} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: saved ? '#16A34A' : '#5B21B6', color: '#fff',
            borderRadius: 14, padding: '16px 24px', fontSize: 15, fontWeight: 700,
            border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1, transition: 'all .2s',
            boxShadow: '0 8px 20px rgba(91,33,182,.2)',
          }}>
            {saving ? <><Loader2 size={18} style={{ animation: 'spin .8s linear infinite' }} /> Enregistrement…</> :
             saved  ? <><CheckCircle2 size={18} /> Enregistré !</> :
                      'Enregistrer les modifications'}
          </button>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </form>
      </div>
    </AppShell>
  )
}
