'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Gift, QrCode } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logomark } from '@/components/brand/Logomark'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/generate-qr', label: 'QR Code', icon: QrCode },
  { href: '/rewards', label: 'Récompenses', icon: Gift },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [restaurantName, setRestaurantName] = useState('')
  const [splash, setSplash] = useState(true)
  const [splashVisible, setSplashVisible] = useState(true)

  useEffect(() => {
    fetch('/api/restaurant')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.name) setRestaurantName(d.name)
        // start fade-out
        setSplashVisible(false)
        setTimeout(() => setSplash(false), 500)
      })
      .catch(() => {
        setSplashVisible(false)
        setTimeout(() => setSplash(false), 500)
      })
  }, [])

  const initials = restaurantName
    ? restaurantName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '…'

  return (
    <div className="flex h-screen bg-background">
      {splash && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: '#fff',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
          opacity: splashVisible ? 1 : 0, transition: 'opacity 0.5s ease',
          pointerEvents: splashVisible ? 'auto' : 'none',
        }}>
          <style>{`
            @keyframes pulse-ring {
              0%   { transform: scale(0.92); opacity: 0.6; }
              50%  { transform: scale(1.08); opacity: 1; }
              100% { transform: scale(0.92); opacity: 0.6; }
            }
            @keyframes dot-pop {
              0%, 100% { transform: scale(1); }
              50%       { transform: scale(1.3); }
            }
            .splash-ring { animation: pulse-ring 1.6s ease-in-out infinite; }
            .splash-dot  { animation: dot-pop  1.6s ease-in-out infinite; }
          `}</style>
          <div style={{ color: '#5B21B6' }}>
            <svg viewBox="0 0 100 100" width="72" height="72" aria-hidden>
              <circle className="splash-ring" cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="3" style={{ transformOrigin: '50px 50px' }} />
              <circle className="splash-dot"  cx="50" cy="50" r="11" fill="currentColor"  style={{ transformOrigin: '50px 50px' }} />
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', fontSize: 28, letterSpacing: '-0.02em', color: '#15101F' }}>
            Fid<span style={{ color: '#5B21B6' }}>è</span>le
          </span>
        </div>
      )}

      {/* ── Sidebar desktop ── */}
      <aside className="hidden md:flex flex-col w-56 bg-card border-r shrink-0">
        <div className="h-14 flex items-center gap-2.5 px-5 border-b">
          <Logomark size={28} className="text-primary" />
          <span className="wordmark text-2xl text-foreground">
            Fid<span className="accent">è</span>le
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 pt-4">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Bas sidebar */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground text-[10px] font-bold">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{restaurantName || '…'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Zone principale ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile top bar */}
        <header className="md:hidden h-14 bg-card border-b flex items-center gap-2.5 px-4 shrink-0">
          <Logomark size={24} className="text-primary" />
          <span className="wordmark text-xl text-foreground">
            Fid<span className="accent">è</span>le
          </span>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden bg-card border-t flex shrink-0">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                pathname === href ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
