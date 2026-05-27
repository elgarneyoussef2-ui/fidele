'use client'

import { useState, useEffect, useCallback } from 'react'
import QRCode from 'qrcode'
import { QrCode, RefreshCw, CheckCircle2, XCircle, Clock, Download, Printer, Loader2, LogOut, ShieldCheck, User, Lock } from 'lucide-react'

type Staff  = { id: string; name: string; role: string }
type Demand = { id: string; client_name: string; reward_name: string; reward_points: number; created_at: string }

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: #fff; -webkit-font-smoothing: antialiased; }
  body { font-family: var(--font-sans), system-ui, sans-serif; color: #15101F; }
  button { font-family: inherit; cursor: pointer; border: none; background: none; -webkit-tap-highlight-color: transparent; }
  button:active { opacity: .8; }
  input { font-family: inherit; }
  @keyframes spin { to { transform: rotate(360deg) } }
  @keyframes fadein { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
  .fadein { animation: fadein .25s ease both; }
  @keyframes pulse-ring { 0%,100%{transform:scale(0.92);opacity:.6} 50%{transform:scale(1.08);opacity:1} }
  @keyframes dot-pop    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }
  .sp-ring { animation:pulse-ring 1.6s ease-in-out infinite; transform-origin:50px 50px }
  .sp-dot  { animation:dot-pop   1.6s ease-in-out infinite; transform-origin:50px 50px }
`

function ago(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'À l\'instant'
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  return h < 24 ? `Il y a ${h}h` : `Il y a ${Math.floor(h / 24)}j`
}

// ── Login ────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (s: Staff) => void }) {
  const [name,    setName]    = useState('')
  const [password, setPassword] = useState('')
  const [busy,    setBusy]    = useState(false)
  const [err,     setErr]     = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('')
    const res  = await fetch('/api/staff/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, password }) })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) { setErr(data.error ?? 'Erreur'); return }
    onLogin(data)
  }

  const inp: React.CSSProperties = { width: '100%', border: '1.5px solid rgba(21,16,31,.14)', borderRadius: 14, padding: '14px 18px 14px 48px', fontSize: 16, outline: 'none', background: '#fff', color: '#15101F' }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#fff' }}>
      <style>{CSS}</style>
      <div style={{ color: '#5B21B6', marginBottom: 24 }}>
        <svg viewBox="0 0 100 100" width="60" height="60" aria-hidden>
          <circle className="sp-ring" cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="50" cy="50" r="11" fill="currentColor" />
        </svg>
      </div>
      <h1 style={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', fontSize: 32, letterSpacing: '-0.02em', color: '#15101F', marginBottom: 6 }}>
        Fid<span style={{ color: '#5B21B6' }}>è</span>le
      </h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 40, fontWeight: 500 }}>Espace serveur</p>

      <form onSubmit={submit} style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ position: 'relative' }}>
          <User size={18} style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'rgba(21,16,31,.3)', pointerEvents: 'none' }} />
          <input type="text" placeholder="Votre nom" value={name} onChange={e => { setName(e.target.value); setErr('') }} style={inp} required autoFocus />
        </div>
        <div style={{ position: 'relative' }}>
          <Lock size={18} style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'rgba(21,16,31,.3)', pointerEvents: 'none' }} />
          <input type="password" placeholder="Mot de passe" value={password} onChange={e => { setPassword(e.target.value); setErr('') }} style={{ ...inp }} required />
        </div>
        {err && <p style={{ fontSize: 13, color: '#EF4444', fontWeight: 500 }}>{err}</p>}
        <button type="submit" disabled={busy} style={{ background: '#5B21B6', color: '#fff', borderRadius: 14, padding: '15px', fontSize: 16, fontWeight: 700, opacity: busy ? .6 : 1, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {busy ? <><Loader2 size={18} style={{ animation: 'spin .8s linear infinite' }} /> Connexion…</> : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}

// ── QR Tab ───────────────────────────────────────────────────────────────────

function QRTab() {
  const [amount,    setAmount]    = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [loading,   setLoading]   = useState(false)

  const amountNum = Number(amount)
  const pts       = amountNum > 0 ? Math.floor(amountNum / 10) : 0

  async function generate() {
    if (amountNum <= 0) return
    setLoading(true); setQrDataUrl('')
    try {
      const res  = await fetch('/api/qr-tokens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: amountNum }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const url    = `${window.location.origin}/join?token=${data.id}`
      const dataUrl = await QRCode.toDataURL(url, { width: 280, margin: 2, color: { dark: '#5B21B6', light: '#ffffff' } })
      setQrDataUrl(dataUrl)
    } catch (e: any) { alert(e.message) }
    finally { setLoading(false) }
  }

  function reset() { setQrDataUrl(''); setAmount('') }

  const card: React.CSSProperties = { background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 4px 18px -8px rgba(21,16,31,.1)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="fadein">
      {!qrDataUrl ? (
        <div style={card}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5B21B6', marginBottom: 16 }}>Montant payé (MAD)</p>
          <input
            type="number" min={1} placeholder="Ex: 150" value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ width: '100%', border: '1.5px solid rgba(21,16,31,.12)', borderRadius: 12, padding: '14px 16px', fontSize: 22, fontFamily: 'var(--font-mono), monospace', outline: 'none', background: '#fff', color: '#15101F' }}
            autoFocus
          />
          <button onClick={generate} disabled={amountNum <= 0 || loading} style={{ width: '100%', background: '#5B21B6', color: '#fff', borderRadius: 12, padding: '15px', fontSize: 16, fontWeight: 700, opacity: amountNum <= 0 || loading ? .4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 }}>
            {loading ? <Loader2 size={18} style={{ animation: 'spin .8s linear infinite' }} /> : <QrCode size={18} />}
            Générer le QR Code
          </button>
          {amountNum > 0 && (
            <div style={{ marginTop: 14, background: '#EDE6FB', borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#5B21B6', fontWeight: 500 }}>Points à créditer</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#5B21B6', fontFamily: 'var(--font-mono), monospace' }}>{pts} pts</span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }} className="fadein">
          <div style={{ background: '#fff', padding: 20, borderRadius: 20, border: '2px solid #EDE6FB', boxShadow: '0 8px 24px rgba(91,33,182,.1)' }}>
            <img src={qrDataUrl} alt="QR Code" style={{ width: 220, height: 220, display: 'block' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#16A34A', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '8px 16px', borderRadius: 99 }}>
            <ShieldCheck size={14} /> À usage unique
          </div>
          <p style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', fontWeight: 500 }}>
            <strong style={{ color: '#15101F', fontFamily: 'var(--font-mono), monospace' }}>{pts} pts</strong> pour <strong style={{ color: '#15101F', fontFamily: 'var(--font-mono), monospace' }}>{amountNum} MAD</strong>
          </p>
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <a href={qrDataUrl} download={`qr-${amount}mad.png`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#5B21B6', color: '#fff', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              <Download size={16} /> Télécharger
            </a>
            <button onClick={() => window.print()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#F3F4F6', color: '#15101F', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700 }}>
              <Printer size={16} /> Imprimer
            </button>
          </div>
          <button onClick={reset} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14, color: '#9CA3AF', padding: '10px', borderRadius: 12 }}>
            <RefreshCw size={14} /> Nouveau QR
          </button>
        </div>
      )}
    </div>
  )
}

// ── Demands Tab ──────────────────────────────────────────────────────────────

function DemandsTab() {
  const [demands,  setDemands]  = useState<Demand[]>([])
  const [loading,  setLoading]  = useState(true)
  const [acting,   setActing]   = useState<string | null>(null)
  const [done,     setDone]     = useState<Record<string, 'accepted' | 'rejected'>>({})

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/redemption', { cache: 'no-store' })
    const data = await res.json()
    setDemands(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function act(id: string, action: 'accept' | 'reject') {
    setActing(id)
    await fetch(`/api/redemption/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
    setDone(prev => ({ ...prev, [id]: action === 'accept' ? 'accepted' : 'rejected' }))
    setActing(null)
    setTimeout(() => load(), 1200)
  }

  const pending = demands.filter(d => !done[d.id])
  const resolved = demands.filter(d => done[d.id])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="fadein">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5B21B6' }}>
          {pending.length} demande{pending.length !== 1 ? 's' : ''} en attente
        </p>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9CA3AF', padding: '6px 10px', borderRadius: 8 }}>
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
          <Loader2 size={28} style={{ animation: 'spin .8s linear infinite', margin: '0 auto' }} />
        </div>
      )}

      {!loading && pending.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 20, padding: '48px 24px', textAlign: 'center', boxShadow: '0 4px 18px -8px rgba(21,16,31,.08)' }}>
          <Clock size={40} style={{ color: '#D1D5DB', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: '#9CA3AF' }}>Aucune demande en attente</p>
        </div>
      )}

      {pending.map(d => (
        <div key={d.id} style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 18px -8px rgba(21,16,31,.1)', display: 'flex', alignItems: 'center', gap: 16 }} className="fadein">
          <div style={{ width: 48, height: 48, borderRadius: 16, background: '#EDE6FB', color: '#5B21B6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🎁</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#15101F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.reward_name}</p>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{d.client_name} · {ago(d.created_at)}</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#5B21B6', marginTop: 3, fontFamily: 'var(--font-mono), monospace' }}>{d.reward_points} pts</p>
          </div>
          {acting === d.id ? (
            <Loader2 size={22} style={{ animation: 'spin .8s linear infinite', color: '#9CA3AF', flexShrink: 0 }} />
          ) : done[d.id] === 'accepted' ? (
            <CheckCircle2 size={28} style={{ color: '#16A34A', flexShrink: 0 }} />
          ) : done[d.id] === 'rejected' ? (
            <XCircle size={28} style={{ color: '#EF4444', flexShrink: 0 }} />
          ) : (
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={() => act(d.id, 'reject')} style={{ width: 40, height: 40, borderRadius: 12, background: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <XCircle size={20} />
              </button>
              <button onClick={() => act(d.id, 'accept')} style={{ width: 40, height: 40, borderRadius: 12, background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={20} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff | null>(null)
  const [tab,   setTab]   = useState<'qr' | 'demands'>('qr')

  useEffect(() => {
    const s = localStorage.getItem('fidele_staff')
    if (s) { try { setStaff(JSON.parse(s)) } catch {} }
  }, [])

  function onLogin(s: Staff) {
    localStorage.setItem('fidele_staff', JSON.stringify(s))
    setStaff(s)
  }

  function logout() {
    localStorage.removeItem('fidele_staff')
    setStaff(null)
  }

  if (!staff) return <><style>{CSS}</style><LoginScreen onLogin={onLogin} /></>

  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '12px 0', fontSize: 14, fontWeight: 700, borderRadius: 12,
    background: active ? '#5B21B6' : 'transparent',
    color: active ? '#fff' : '#9CA3AF',
    transition: 'all .2s',
  })

  return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ background: '#15101F', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg viewBox="0 0 100 100" width="28" height="28" style={{ color: 'rgba(255,255,255,.5)' }} aria-hidden>
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="3" />
              <circle cx="50" cy="50" r="11" fill="currentColor" />
            </svg>
            <div>
              <p style={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', fontSize: 18, color: '#fff', letterSpacing: '-0.02em' }}>
                Fid<span style={{ color: '#C7B8F2' }}>è</span>le
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 500, marginTop: 1 }}>{staff.name}</p>
            </div>
          </div>
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,.4)', padding: '8px 12px', borderRadius: 10 }}>
            <LogOut size={15} /> Quitter
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ background: '#fff', padding: '10px 16px', display: 'flex', gap: 6, borderBottom: '1px solid rgba(21,16,31,.06)' }}>
          <button style={tabBtn(tab === 'qr')} onClick={() => setTab('qr')}>
            <QrCode size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />QR Code
          </button>
          <button style={tabBtn(tab === 'demands')} onClick={() => setTab('demands')}>
            <CheckCircle2 size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />Demandes
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '20px 16px', overflowY: 'auto', maxWidth: 560, width: '100%', margin: '0 auto' }}>
          {tab === 'qr'     ? <QRTab />     : null}
          {tab === 'demands' ? <DemandsTab /> : null}
        </div>
      </div>
    </>
  )
}
