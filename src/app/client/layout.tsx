import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  themeColor: '#5B21B6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'Fidèle',
  description: 'Votre portefeuille de points fidélité.',
  manifest: '/client-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Fidèle',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
