'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Gift, QrCode } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/generate-qr', label: 'QR Code', icon: QrCode },
  { href: '/rewards', label: 'Récompenses', icon: Gift },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [restaurantName, setRestaurantName] = useState('')

  useEffect(() => {
    fetch('/api/restaurant')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.name) setRestaurantName(d.name) })
  }, [])

  const initials = restaurantName
    ? restaurantName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '…'

  return (
    <div className="flex h-screen bg-background">

      {/* ── Sidebar desktop ── */}
      <aside className="hidden md:flex flex-col w-56 bg-card border-r shrink-0">
        <div className="h-14 flex items-center px-5 border-b">
          <span className="wordmark text-2xl tracking-tight text-foreground">
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
        <header className="md:hidden h-14 bg-card border-b flex items-center px-4 shrink-0">
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
