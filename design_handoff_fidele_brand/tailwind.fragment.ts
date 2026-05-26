/* ============================================================
   FIDÈLE — fragments à fusionner dans tailwind.config.ts
   ============================================================ */

import type { Config } from 'tailwindcss'

// Ces blocs sont à fusionner dans le `theme.extend` existant
// du fichier tailwind.config.ts.
export const fideleThemeFragment: Partial<Config['theme']> = {
  extend: {
    fontFamily: {
      display: ['var(--font-display)', 'serif'],
      sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      mono: ['var(--font-mono)', 'monospace'],
    },
    colors: {
      // garder les tokens shadcn déjà présents (border, primary, etc.)
      // ces couleurs additionnelles sont disponibles en raw, hors shadcn :
      fidele: {
        violet: '#5B21B6',
        'violet-deep': '#3F1685',
        'violet-soft': '#C7B8F2',
        'violet-tint': '#EDE6FB',
        ink: '#15101F',
        'ink-2': '#2A2236',
        cream: '#F6F1E7',
        'cream-2': '#EFE7D6',
        paper: '#FFFFFF',
        honey: '#E9A23B',
        'honey-deep': '#B5781F',
      },
    },
    boxShadow: {
      card: '0 30px 60px -30px rgba(21,16,31,.25), 0 4px 18px -8px rgba(21,16,31,.1)',
      lc: '0 40px 70px -30px rgba(21,16,31,.45), 0 6px 24px -10px rgba(21,16,31,.18)',
    },
    letterSpacing: {
      eyebrow: '0.18em',
      caps: '0.22em',
      display: '-0.02em',
    },
    borderRadius: {
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)',
      card: '22px',  // pour les loyalty cards
    },
  },
}

/* ============================================================
   Exemple d'intégration dans next/font (à coller dans layout.tsx)
   ============================================================

import { Instrument_Serif, DM_Sans, JetBrains_Mono } from 'next/font/google'

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${instrumentSerif.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
*/
