'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Gift, QrCode, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/generate-qr', label: 'QR Code',     icon: QrCode          },
  { href: '/rewards',     label: 'Récompenses', icon: Gift             },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [restaurantName, setRestaurantName] = useState('')
  const [userEmail, setUserEmail]           = useState('')

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/auth/me')
      if (!res.ok) return
      const data = await res.json()
      setRestaurantName(data.name ?? '')
      setUserEmail(data.email ?? '')
    }
    load()
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/login', { method: 'DELETE' })
    window.location.href = '/login'
  }

  const initials = restaurantName
    ? restaurantName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '…'

  return (
    <div className="flex h-screen bg-gray-50">

      {/* ── Sidebar desktop ── */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r shrink-0">
        <div className="h-14 flex items-center px-5 border-b">
          <span className="font-bold text-[#185FA5] text-xl tracking-tight">Taghra</span>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 pt-4">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-[#185FA5] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Bas sidebar */}
        <div className="p-4 border-t space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-full bg-[#185FA5] flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-bold">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">{restaurantName || '…'}</p>
              <p className="text-[10px] text-gray-400 truncate">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Zone principale ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile top bar */}
        <header className="md:hidden h-14 bg-white border-b flex items-center justify-between px-4 shrink-0">
          <span className="font-bold text-[#185FA5] text-lg">Taghra</span>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors p-1">
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden bg-white border-t flex shrink-0">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                pathname === href ? 'text-[#185FA5]' : 'text-gray-400 hover:text-gray-600'
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
