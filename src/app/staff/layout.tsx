import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  themeColor: '#15101F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'Fidèle Staff',
  description: 'Générez des QR codes et gérez les demandes de récompenses clients.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Fidèle Staff',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
