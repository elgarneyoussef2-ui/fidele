'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // En production, logger l'erreur vers un service de monitoring
    if (process.env.NODE_ENV !== 'development') return
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
      fontFamily: 'var(--font-sans), system-ui, sans-serif',
      background: '#fff',
    }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, color: '#DC2626' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#15101F', marginBottom: 10, letterSpacing: '-0.02em' }}>
        Une erreur est survenue
      </h1>
      <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, maxWidth: 340, marginBottom: 32 }}>
        Quelque chose s&apos;est mal passé. Essayez de recharger la page.
        {error.digest && (
          <span style={{ display: 'block', marginTop: 8, fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' }}>
            Réf : {error.digest}
          </span>
        )}
      </p>

      <button
        onClick={reset}
        style={{
          background: 'linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)',
          color: '#fff', padding: '13px 28px', borderRadius: 14,
          fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(91,33,182,.3)', fontFamily: 'inherit',
        }}
      >
        Réessayer
      </button>
    </div>
  )
}
