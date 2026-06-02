import type { Metadata } from 'next'
import { Instrument_Serif, DM_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

const APP_URL = 'https://fidele-steel.vercel.app'

export const metadata: Metadata = {
  title: 'Fidèle — Programme de fidélité pour restaurants marocains',
  description:
    'Fidèle transforme chaque repas en relation durable. Points, récompenses et analytics pour fidéliser vos clients. Lancé en 24h.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='42' fill='none' stroke='%235B21B6' stroke-width='8'/><circle cx='50' cy='50' r='14' fill='%235B21B6'/></svg>",
  },
  openGraph: {
    type:        'website',
    locale:      'fr_FR',
    url:         APP_URL,
    siteName:    'Fidèle',
    title:       'Fidèle — Programme de fidélité pour restaurants marocains',
    description: 'Fidèle transforme chaque repas en relation durable. Points, récompenses et analytics pour fidéliser vos clients.',
  },
  twitter: {
    card:        'summary',
    title:       'Fidèle — Programme de fidélité pour restaurants marocains',
    description: 'Points, récompenses et analytics pour fidéliser les clients de votre restaurant.',
  },
  metadataBase: new URL(APP_URL),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="fr"
      className={`${instrumentSerif.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans">{children}</body>
    </html>
  )
}
