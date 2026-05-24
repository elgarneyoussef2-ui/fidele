'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ScannerScreen({ onClose }: { onClose: () => void }) {
  const router    = useRouter()
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef    = useRef<number>(0)

  const [phase, setPhase] = useState<'requesting' | 'scanning' | 'found' | 'error'>('requesting')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let dead = false

    function stopStream() {
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }

    async function scanLoop() {
      if (dead || !videoRef.current || !canvasRef.current) return
      const video  = videoRef.current
      const canvas = canvasRef.current

      if (video.readyState >= video.HAVE_ENOUGH_DATA) {
        canvas.width  = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!
        ctx.drawImage(video, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        const jsQR = (await import('jsqr')).default
        const code = jsQR(imageData.data, imageData.width, imageData.height)

        if (code && !dead) {
          dead = true
          setPhase('found')
          stopStream()

          setTimeout(() => {
            try {
              const url = new URL(code.data)
              if (url.pathname.startsWith('/join')) {
                router.push(url.pathname + url.search)
              } else {
                window.location.href = code.data
              }
            } catch {
              setErrorMsg('QR code non reconnu.')
              setPhase('error')
            }
          }, 700)
          return
        }
      }

      rafRef.current = requestAnimationFrame(scanLoop)
    }

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        if (dead) { stream.getTracks().forEach(t => t.stop()); return }

        streamRef.current = stream
        const video = videoRef.current!
        video.srcObject = stream
        await video.play()
        setPhase('scanning')
        rafRef.current = requestAnimationFrame(scanLoop)
      } catch (e: unknown) {
        if (!dead) {
          const name = (e as DOMException).name
          setErrorMsg(
            name === 'NotAllowedError'
              ? 'Accès caméra refusé. Autorisez la caméra dans les paramètres du navigateur puis réessayez.'
              : 'Impossible d\'accéder à la caméra sur cet appareil.',
          )
          setPhase('error')
        }
      }
    }

    start()

    return () => {
      dead = true
      cancelAnimationFrame(rafRef.current)
      stopStream()
    }
  }, [router])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: '#000', display: 'flex', flexDirection: 'column',
    }}>
      {/* Live camera feed */}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        paddingTop: 'calc(20px + env(safe-area-inset-top, 0px))',
        background: 'linear-gradient(to bottom, rgba(0,0,0,.75) 0%, transparent 100%)',
      }}>
        <button onClick={onClose} style={{
          color: '#fff', background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,.2)', borderRadius: 99,
          padding: '8px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Retour
        </button>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Scanner</span>
        <div style={{ width: 80 }} />
      </div>

      {/* Requesting camera */}
      {phase === 'requesting' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 99,
            border: '3px solid rgba(255,255,255,.3)',
            borderTopColor: '#185FA5',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>Activation de la caméra…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Scanning overlay */}
      {phase === 'scanning' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          {/* Dim surround */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />

          {/* Clear window */}
          <div style={{
            position: 'relative', width: 240, height: 240,
            background: 'transparent',
            boxShadow: '0 0 0 9999px rgba(0,0,0,.45)',
            borderRadius: 16,
          }}>
            {/* Corners */}
            {[
              { top: 0,   left: 0,  borderTop: '3px solid #185FA5', borderLeft: '3px solid #185FA5',  borderRadius: '12px 0 0 0' },
              { top: 0,   right: 0, borderTop: '3px solid #185FA5', borderRight: '3px solid #185FA5', borderRadius: '0 12px 0 0' },
              { bottom: 0, left: 0, borderBottom: '3px solid #185FA5', borderLeft: '3px solid #185FA5',  borderRadius: '0 0 0 12px' },
              { bottom: 0, right: 0, borderBottom: '3px solid #185FA5', borderRight: '3px solid #185FA5', borderRadius: '0 0 12px 0' },
            ].map((s, i) => (
              <div key={i} style={{ position: 'absolute', width: 32, height: 32, ...s }} />
            ))}

            {/* Scan line */}
            <div style={{
              position: 'absolute', top: 0, left: 8, right: 8, height: 2,
              background: 'linear-gradient(to right, transparent, #185FA5, transparent)',
              animation: 'scan 2s ease-in-out infinite',
            }} />
            <style>{`@keyframes scan { 0%,100% { top: 0; opacity: 1; } 50% { top: calc(100% - 2px); opacity: .8; } }`}</style>
          </div>

          <p style={{
            position: 'relative', color: 'rgba(255,255,255,.9)', fontSize: 14, fontWeight: 500,
            marginTop: 24, textAlign: 'center', padding: '0 40px',
            textShadow: '0 1px 4px rgba(0,0,0,.8)',
          }}>
            Pointez vers le QR code affiché par le serveur
          </p>
        </div>
      )}

      {/* Found */}
      {phase === 'found' && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 99, background: '#16A34A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>QR détecté !</p>
          <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 14 }}>Redirection…</p>
        </div>
      )}

      {/* Error */}
      {phase === 'error' && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,.7)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '0 32px', gap: 16, textAlign: 'center',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 99, background: '#DC2626',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
            </svg>
          </div>
          <p style={{ color: '#fff', fontSize: 15, fontWeight: 600, lineHeight: 1.5 }}>{errorMsg}</p>
          <button onClick={onClose} style={{
            background: '#fff', color: '#0A0A0A', border: 'none',
            borderRadius: 14, padding: '13px 32px', fontWeight: 700, fontSize: 15, cursor: 'pointer',
          }}>Fermer</button>
        </div>
      )}
    </div>
  )
}
