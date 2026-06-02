import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
      background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(91,33,182,.06) 0%, #fff 70%)',
      fontFamily: 'var(--font-sans), system-ui, sans-serif',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40 }}>
        <svg viewBox="0 0 100 100" width="24" height="24" style={{ color: '#5B21B6' }}>
          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6"/>
          <circle cx="50" cy="50" r="13" fill="currentColor"/>
        </svg>
        <span style={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', fontSize: 20, letterSpacing: '-0.02em', color: '#15101F' }}>
          Fid<span style={{ color: '#5B21B6' }}>è</span>le
        </span>
      </div>

      {/* 404 */}
      <div style={{ fontSize: 96, fontWeight: 900, color: '#F3F4F6', lineHeight: 1, marginBottom: 24, letterSpacing: '-0.05em' }}>
        404
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#15101F', letterSpacing: '-0.02em', marginBottom: 12 }}>
        Page introuvable
      </h1>
      <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.6, maxWidth: 360, marginBottom: 36 }}>
        Cette page n&apos;existe pas ou a été déplacée. Vérifiez l&apos;URL ou retournez à l&apos;accueil.
      </p>

      <Link href="/" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)',
        color: '#fff', padding: '14px 28px', borderRadius: 14,
        fontWeight: 700, fontSize: 15, textDecoration: 'none',
        boxShadow: '0 4px 20px rgba(91,33,182,.3)',
      }}>
        Retour à l&apos;accueil
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </Link>
    </div>
  )
}
