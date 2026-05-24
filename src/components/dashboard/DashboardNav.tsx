'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Gift, QrCode } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/rewards',   label: 'Récompenses', icon: Gift             },
  { href: '/generate-qr', label: 'QR Code',  icon: QrCode           },
]

export default function DashboardNav() {
  const pathname = usePathname()
  return (
    <nav className="bg-white border-b sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 h-14">
        <span className="font-bold text-lg text-[#185FA5] mr-6">Taghra</span>
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-blue-50 text-[#185FA5]'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
