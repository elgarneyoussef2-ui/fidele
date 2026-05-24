'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ScannerScreen({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const regionId = 'qr-reader-region'
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'scanning' | 'found'>('scanning')
  const scannerRef = useRef<InstanceType<typeof import('html5-qrcode').Html5Qrcode> | null>(null)

  useEffect(() => {
    let cancelled = false

    async function start() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (cancelled) return

        const qr = new Html5Qrcode(regionId)
        scannerRef.current = qr

        await qr.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            if (cancelled) return
            cancelled = true
            setStatus('found')
            qr.stop().catch(() => {})

            // Navigate to the decoded URL if it's a /join link, else open external
            try {
              const url = new URL(decodedText)
              if (url.pathname.startsWith('/join')) {
                router.push(url.pathname + url.search)
              } else {
                window.location.href = decodedText
              }
            } catch {
              setError('QR code non reconnu.')
              setStatus('scanning')
              cancelled = false
            }
          },
          () => {},
        )
      } catch (e: unknown) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : String(e)
          setError(msg.includes('permission') || msg.includes('NotAllowed')
            ? 'Accès à la caméra refusé. Autorisez la caméra dans les paramètres.'
            : 'Impossible d\'ouvrir la caméra.')
        }
      }
    }

    start()

    return () => {
      cancelled = true
      scannerRef.current?.stop().catch(() => {})
    }
  }, [router])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: '#000', display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(10px)',
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
      }}>
        <button onClick={onClose} style={{
          color: '#fff', background: 'rgba(255,255,255,.15)', border: 'none',
          borderRadius: 99, padding: '8px 16px', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Retour
        </button>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Scanner le QR</span>
        <div style={{ width: 80 }} />
      </div>

      {/* Camera region */}
      <div id={regionId} style={{ flex: 1, width: '100%' }} />

      {/* Overlay frame */}
      {status === 'scanning' && !error && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
        }}>
          <div style={{ position: 'relative', width: 220, height: 220 }}>
            {/* Corner marks */}
            {[
              { top: 0, left: 0, borderTop: '3px solid #185FA5', borderLeft: '3px solid #185FA5' },
              { top: 0, right: 0, borderTop: '3px solid #185FA5', borderRight: '3px solid #185FA5' },
              { bottom: 0, left: 0, borderBottom: '3px solid #185FA5', borderLeft: '3px solid #185FA5' },
              { bottom: 0, right: 0, borderBottom: '3px solid #185FA5', borderRight: '3px solid #185FA5' },
            ].map((s, i) => (
              <div key={i} style={{ position: 'absolute', width: 28, height: 28, borderRadius: 2, ...s }} />
            ))}
          </div>
          <p style={{ color: 'rgba(255,255,255,.8)', marginTop: 24, fontSize: 14, textAlign: 'center', padding: '0 32px' }}>
            Pointez la caméra vers le QR code du restaurant
          </p>
        </div>
      )}

      {/* Found state */}
      {status === 'found' && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,.7)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 99,
            background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>QR code détecté !</p>
          <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 14 }}>Redirection en cours…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          position: 'absolute', bottom: 40, left: 20, right: 20,
          background: '#DC2626', borderRadius: 16, padding: '16px 20px',
        }}>
          <p style={{ color: '#fff', fontSize: 14, margin: 0, textAlign: 'center' }}>{error}</p>
          <button onClick={onClose} style={{
            marginTop: 10, width: '100%', background: 'rgba(255,255,255,.2)',
            border: 'none', borderRadius: 10, padding: '10px', color: '#fff',
            fontWeight: 600, cursor: 'pointer',
          }}>Fermer</button>
        </div>
      )}
    </div>
  )
}
