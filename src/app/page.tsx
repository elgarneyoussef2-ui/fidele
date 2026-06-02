'use client'

import Link from 'next/link'

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  html, body { -webkit-font-smoothing: antialiased; }
  body { font-family: var(--font-sans), system-ui, sans-serif; color: #15101F; background: #fff; }
  a { text-decoration: none; color: inherit; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fu   { animation: fadeUp 0.75s cubic-bezier(0.22,1,0.36,1) both; }
  .fu-1 { animation: fadeUp 0.75s 0.08s cubic-bezier(0.22,1,0.36,1) both; }
  .fu-2 { animation: fadeUp 0.75s 0.16s cubic-bezier(0.22,1,0.36,1) both; }
  .fu-3 { animation: fadeUp 0.75s 0.24s cubic-bezier(0.22,1,0.36,1) both; }

  .nav-link {
    font-size: 14px; font-weight: 500; color: #6B7280;
    transition: color 0.15s; -webkit-tap-highlight-color: transparent;
  }
  .nav-link:hover { color: #15101F; }

  .btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 15px 28px; border-radius: 14px;
    font-size: 15px; font-weight: 700; color: #fff;
    background: linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%);
    box-shadow: 0 4px 20px rgba(91,33,182,.35);
    border: none; cursor: pointer; text-decoration: none;
    transition: transform 0.15s, box-shadow 0.2s;
    -webkit-tap-highlight-color: transparent;
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(91,33,182,.45); }
  .btn-primary:active { transform: scale(0.98); }

  .btn-soft {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 15px 28px; border-radius: 14px;
    font-size: 15px; font-weight: 600; color: #5B21B6;
    background: #EDE6FB; border: none; cursor: pointer; text-decoration: none;
    transition: background 0.15s, transform 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .btn-soft:hover { background: #DDD6F3; transform: translateY(-1px); }
  .btn-soft:active { transform: scale(0.98); }

  .btn-ghost {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 18px; border-radius: 10px;
    font-size: 13px; font-weight: 600; color: #5B21B6;
    background: transparent; text-decoration: none;
    border: 1.5px solid rgba(91,33,182,.25);
    transition: background 0.15s, border-color 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .btn-ghost:hover { background: rgba(91,33,182,.05); border-color: #5B21B6; }

  .feat-card {
    background: #fff;
    border: 1.5px solid rgba(21,16,31,.07);
    border-radius: 24px; padding: 32px;
    transition: box-shadow 0.25s, transform 0.2s, border-color 0.2s;
  }
  .feat-card:hover {
    box-shadow: 0 12px 40px rgba(21,16,31,.08);
    transform: translateY(-4px);
    border-color: rgba(91,33,182,.2);
  }

  .step-dot {
    width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
    background: linear-gradient(135deg, #6D28D9, #5B21B6);
    color: #fff; display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 800;
  }

  .cta-white-btn {
    display: inline-flex; align-items: center; gap: 8px;
    background: #fff; color: #5B21B6;
    padding: 16px 32px; border-radius: 16px;
    font-weight: 800; font-size: 16px; text-decoration: none;
    box-shadow: 0 8px 40px rgba(0,0,0,.2);
    transition: transform 0.15s, box-shadow 0.2s;
    -webkit-tap-highlight-color: transparent;
  }
  .cta-white-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 48px rgba(0,0,0,.25); }
  .cta-white-btn:active { transform: scale(0.98); }

  @media (max-width: 768px) {
    .nav-center { display: none !important; }
    .hero-btns { flex-direction: column !important; align-items: stretch !important; }
    .hero-btns a { justify-content: center; }
    .feat-grid { grid-template-columns: 1fr !important; }
    .steps-grid { grid-template-columns: 1fr !important; }
    .steps-grid .step-line { display: none !important; }
    .stats-row { grid-template-columns: repeat(3, 1fr) !important; }
  }
`

const FEATURES = [
  {
    bg: '#EDE6FB', ic: '#5B21B6',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    title: 'Points automatiques',
    desc: 'Chaque visite est récompensée sans friction. Vos clients accumulent des points naturellement, sans rien faire de plus.',
  },
  {
    bg: '#FEF3C7', ic: '#D97706',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    title: 'QR Code instantané',
    desc: 'Un QR code unique par restaurant. Vos clients scannent et rejoignent le programme en moins de 30 secondes.',
  },
  {
    bg: '#DCFCE7', ic: '#16A34A',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    title: 'Analytics en temps réel',
    desc: 'Dashboard complet : visites, revenus, rétention. Prenez les bonnes décisions grâce à vos vraies données.',
  },
  {
    bg: '#FEE2E2', ic: '#DC2626',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    title: 'Récompenses sur-mesure',
    desc: 'Café offert, réduction, plat gratuit — créez des récompenses à votre image et fidélisez à votre façon.',
  },
]

const STEPS = [
  { n: '1', title: 'Créez votre espace', desc: 'Remplissez un formulaire simple. Notre équipe configure tout votre programme en moins de 24h.' },
  { n: '2', title: 'Partagez le QR code', desc: 'Affichez votre QR code en caisse. Vos clients scannent et rejoignent le programme instantanément.' },
  { n: '3', title: 'Fidélisez et grandissez', desc: 'Suivez vos métriques, ajustez vos récompenses et regardez votre base client se développer.' },
]

export default function LandingPage() {
  return (
    <>
      <style>{CSS}</style>

      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(21,16,31,.06)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg viewBox="0 0 100 100" width="22" height="22" style={{ color: '#5B21B6' }}>
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6"/>
              <circle cx="50" cy="50" r="13" fill="currentColor"/>
            </svg>
            <span style={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', fontSize: 19, letterSpacing: '-0.02em' }}>
              Fid<span style={{ color: '#5B21B6' }}>è</span>le
            </span>
          </div>

          <div className="nav-center" style={{ display: 'flex', gap: 32 }}>
            <a href="#features" className="nav-link">Fonctionnalités</a>
            <a href="#how" className="nav-link">Comment ça marche</a>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link href="/onboarding" className="btn-ghost">Se connecter</Link>
            <Link href="/onboarding" className="btn-primary" style={{ padding: '9px 18px', fontSize: 13 }}>Commencer</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 24px 80px', textAlign: 'center',
        background: 'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(91,33,182,.09) 0%, #fff 65%)',
      }}>
        {/* Badge */}
        <div className="fu" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: '#EDE6FB', borderRadius: 99, padding: '6px 14px', marginBottom: 28,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5B21B6', display: 'inline-block' }}/>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#5B21B6', letterSpacing: '.07em', textTransform: 'uppercase' }}>
            +50 restaurants partenaires au Maroc
          </span>
        </div>

        {/* Headline */}
        <h1 className="fu-1" style={{
          fontSize: 'clamp(38px, 6.5vw, 76px)',
          fontWeight: 800, color: '#15101F',
          letterSpacing: '-0.04em', lineHeight: 1.06,
          marginBottom: 24, maxWidth: 820,
        }}>
          Le programme de fidélité qui fait{' '}
          <span style={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', color: '#5B21B6' }}>revenir</span>
          {' '}vos clients
        </h1>

        {/* Sub */}
        <p className="fu-2" style={{
          fontSize: 18, color: '#6B7280', lineHeight: 1.7,
          maxWidth: 520, marginBottom: 40,
        }}>
          Fidèle transforme chaque repas en relation durable. Points, récompenses et analytics — tout ce qu'il faut pour fidéliser vos clients.
        </p>

        {/* CTAs */}
        <div className="fu-3 hero-btns" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 64 }}>
          <Link href="/onboarding" className="btn-primary">
            Démarrer gratuitement
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
          </Link>
          <a href="#how" className="btn-soft">Comment ça marche</a>
        </div>

        {/* Stats */}
        <div className="fu-3 stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48, maxWidth: 440 }}>
          {[
            { v: '+50',  l: 'restaurants' },
            { v: '3×',   l: 'taux de retour' },
            { v: '24h',  l: 'mise en place' },
          ].map(s => (
            <div key={s.l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#5B21B6', letterSpacing: '-0.03em' }}>{s.v}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section id="features" style={{ padding: '100px 24px', background: '#FAFAFA' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 12 }}>Fonctionnalités</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, color: '#15101F', letterSpacing: '-0.03em', marginBottom: 16, lineHeight: 1.1 }}>
              Tout ce qu'il vous faut,{' '}
              <span style={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', color: '#5B21B6' }}>rien de superflu</span>
            </h2>
            <p style={{ fontSize: 16, color: '#6B7280', maxWidth: 460, margin: '0 auto' }}>
              Une plateforme pensée pour les restaurateurs marocains — simple à prendre en main, puissante à l'usage.
            </p>
          </div>

          <div className="feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="feat-card">
                <div style={{ width: 50, height: 50, borderRadius: 15, background: f.bg, color: f.ic, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#15101F', marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section id="how" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 12 }}>Comment ça marche</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, color: '#15101F', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Lancé en{' '}
              <span style={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', color: '#5B21B6' }}>3 étapes</span>
            </h2>
          </div>

          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {STEPS.map((s, i) => (
              <div key={s.title} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="step-dot">{s.n}</div>
                  {i < 2 && (
                    <div className="step-line" style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(91,33,182,.3), rgba(91,33,182,.05))' }}/>
                  )}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#15101F' }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial ────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: '#F9F8FF' }}>
        <div style={{ maxWidth: 660, margin: '0 auto', textAlign: 'center' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="#C4B5F4" stroke="none" style={{ marginBottom: 24 }}>
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
          </svg>
          <blockquote style={{
            fontSize: 'clamp(18px, 2.5vw, 23px)',
            fontFamily: 'var(--font-display), serif', fontStyle: 'italic',
            color: '#15101F', lineHeight: 1.5, marginBottom: 28,
          }}>
            "Depuis Fidèle, nos clients reviennent deux fois plus souvent. Le QR code a vraiment simplifié les choses pour toute l'équipe."
          </blockquote>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#6D28D9,#5B21B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>R</div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#15101F' }}>Rachid B.</p>
              <p style={{ fontSize: 12, color: '#9CA3AF' }}>Restaurant La Mamounia, Casablanca</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ────────────────────────────────────── */}
      <section style={{
        padding: '100px 24px', textAlign: 'center',
        background: 'linear-gradient(135deg, #3B0764 0%, #5B21B6 55%, #6D28D9 100%)',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 20 }}>
            Prêt à commencer ?
          </p>
          <h2 style={{
            fontSize: 'clamp(28px, 4.5vw, 50px)', fontWeight: 800, color: '#fff',
            letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: 20,
          }}>
            Rejoignez les restaurants qui fidélisent mieux
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.65)', marginBottom: 44, lineHeight: 1.65 }}>
            Notre équipe vous configure en moins de 24h.<br />Aucun engagement, résultats dès la première semaine.
          </p>
          <Link href="/onboarding" className="cta-white-btn">
            Démarrer gratuitement
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer style={{ padding: '40px 24px', background: '#0D0A14', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <svg viewBox="0 0 100 100" width="18" height="18" style={{ color: '#7C3AED' }}>
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6"/>
            <circle cx="50" cy="50" r="13" fill="currentColor"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', fontSize: 18, color: '#fff', letterSpacing: '-0.02em' }}>
            Fid<span style={{ color: '#7C3AED' }}>è</span>le
          </span>
        </div>
        <p style={{ fontSize: 12, color: '#4B5563' }}>
          © 2025 Fidèle · Programme de fidélité pour restaurants marocains
        </p>
      </footer>
    </>
  )
}
