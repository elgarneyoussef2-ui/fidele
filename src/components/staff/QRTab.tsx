'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { QrCode, Download, Printer, Loader2, ShieldCheck, Plus } from 'lucide-react'

const card: React.CSSProperties = { background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 2px 16px rgba(21,16,31,.07)' }

export default function QRTab({ staffId }: { staffId: string }) {
  const [amount,      setAmount]      = useState('')
  const [qrDataUrl,   setQrDataUrl]   = useState('')
  const [loading,     setLoading]     = useState(false)
  const [madPerPoint, setMadPerPoint] = useState(10)
  const [error,       setError]       = useState('')

  useEffect(() => {
    fetch('/api/restaurant').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.mad_per_point) setMadPerPoint(Number(d.mad_per_point))
    })
  }, [])

  const amountNum = Number(amount)
  const pts       = amountNum > 0 ? Math.floor(amountNum / madPerPoint) : 0

  async function generate() {
    if (amountNum <= 0) return
    setLoading(true); setQrDataUrl(''); setError('')
    try {
      const res  = await fetch('/api/qr-tokens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: amountNum, staffId }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur lors de la génération du QR code')
      const url     = `${window.location.origin}/join?token=${data.id}`
      const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: '#5B21B6', light: '#ffffff' } })
      setQrDataUrl(dataUrl)
    } catch (e: any) { setError(e.message ?? 'Erreur lors de la génération du QR code') }
    finally { setLoading(false) }
  }

  function reset() { setQrDataUrl(''); setAmount(''); setError('') }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="fadein">
      {!qrDataUrl ? (
        <div style={card}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#5B21B6', marginBottom: 14 }}>Montant payé (MAD)</p>
          <input
            type="number" inputMode="numeric" min={1} placeholder="Ex : 150"
            value={amount} onChange={e => { setAmount(e.target.value); setError('') }}
            style={{ width: '100%', border: '1.5px solid rgba(21,16,31,.12)', borderRadius: 14, padding: '16px', fontSize: 28, fontFamily: 'var(--font-mono), monospace', outline: 'none', background: '#FAFAFA', color: '#15101F', letterSpacing: '-0.01em' }}
            autoFocus
          />
          {amountNum > 0 && (
            <div style={{ marginTop: 12, background: '#EDE6FB', borderRadius: 14, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="fadein">
              <div>
                <p style={{ fontSize: 13, color: '#5B21B6', fontWeight: 600 }}>Points à créditer</p>
                <p style={{ fontSize: 11, color: '#7C3AED', opacity: 0.85, marginTop: 2 }}>1 pt = {madPerPoint} MAD</p>
              </div>
              <span style={{ fontSize: 26, fontWeight: 800, color: '#5B21B6', fontFamily: 'var(--font-mono), monospace' }}>{pts} pts</span>
            </div>
          )}
          {error && <p style={{ fontSize: 13, color: '#EF4444', fontWeight: 500, padding: '0 4px', marginTop: 12 }}>{error}</p>}
          <button
            onClick={generate} disabled={amountNum <= 0 || loading}
            style={{ width: '100%', background: '#5B21B6', color: '#fff', borderRadius: 14, padding: '16px', fontSize: 16, fontWeight: 700, opacity: amountNum <= 0 || loading ? .35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, transition: 'opacity .15s' }}
          >
            {loading ? <Loader2 size={18} style={{ animation: 'spin .8s linear infinite' }} aria-hidden /> : <QrCode size={18} aria-hidden />}
            Générer le QR Code
          </button>
        </div>
      ) : (
        <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }} className="popin">
          <div style={{ background: '#fff', padding: 18, borderRadius: 22, border: '2.5px solid #EDE6FB', boxShadow: '0 12px 32px rgba(91,33,182,.12)' }}>
            <img src={qrDataUrl} alt="QR Code" style={{ width: 230, height: 230, display: 'block', borderRadius: 8 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#16A34A', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '7px 14px', borderRadius: 99, fontWeight: 600 }}>
            <ShieldCheck size={13} aria-hidden /> À usage unique
          </div>
          <p style={{ fontSize: 15, color: '#6B7280', textAlign: 'center', fontWeight: 500 }}>
            <strong style={{ color: '#15101F', fontFamily: 'var(--font-mono), monospace' }}>{pts} pts</strong>
            {' '}pour{' '}
            <strong style={{ color: '#15101F', fontFamily: 'var(--font-mono), monospace' }}>{amountNum} MAD</strong>
          </p>
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <a
              href={qrDataUrl} download={`qr-${amount}mad.png`}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#5B21B6', color: '#fff', borderRadius: 14, padding: '13px', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
            >
              <Download size={16} aria-hidden /> Télécharger
            </a>
            <button
              onClick={() => window.print()}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#F3F4F6', color: '#374151', borderRadius: 14, padding: '13px', fontSize: 14, fontWeight: 700 }}
            >
              <Printer size={16} aria-hidden /> Imprimer
            </button>
          </div>
          <button
            onClick={reset}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14, color: '#6B7280', padding: '10px', borderRadius: 12 }}
          >
            <Plus size={14} aria-hidden /> Nouveau QR
          </button>
        </div>
      )}
    </div>
  )
}
