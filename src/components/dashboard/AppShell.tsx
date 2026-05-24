'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Gift, QrCode } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/generate-qr', label: 'QR Code',     icon: QrCode          },
  { href: '/rewards',     label: 'Récompenses', icon: Gift             },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

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
        <div className="p-4 border-t">
          <p className="text-xs text-gray-400">Restaurant Test</p>
          <p className="text-xs text-gray-400">v1.0</p>
        </div>
      </aside>

      {/* ── Zone principale ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden h-14 bg-white border-b flex items-center px-4 shrink-0">
          <span className="font-bold text-[#185FA5] text-lg">Taghra</span>
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
