# Handoff — Identité de marque **Fidèle**

## Vue d'ensemble

Ce dossier contient l'identité visuelle complète de **Fidèle**, une plateforme de fidélité destinée aux cafés et bistros de quartier. Il est conçu pour qu'un développeur (assisté de Claude Code) puisse l'**appliquer à la codebase existante** (`Taghra`, Next.js 14 + Tailwind + shadcn/ui) — ce qui revient principalement à :

1. Remplacer les tokens de couleur HSL par défaut de shadcn/ui par la palette Fidèle.
2. Installer & câbler les polices Instrument Serif + DM Sans + JetBrains Mono.
3. Renommer les références produit (`Taghra` → `Fidèle`) dans l'UI utilisateur.
4. Mettre à jour les composants existants (boutons, cartes, headers) pour adopter le nouveau ton (serif italique pour les titres, sans pour l'UI).

## À propos des fichiers de design

Le fichier `Fidele - Identite Visuelle.html` inclus dans ce bundle est une **référence de design en HTML** — un prototype qui montre l'apparence attendue, **pas du code à recopier tel quel**. La mission est de **reproduire ce langage visuel dans la codebase Next.js/Tailwind existante**, en réutilisant ses patterns (shadcn/ui, Radix, CVA, etc.).

## Fidélité

**Haute fidélité (hifi)** — les valeurs exactes (couleurs, typographies, espacements) sont à respecter au pixel près. Le prototype représente l'état final souhaité.

---

## 🎨 Design Tokens

### Palette

| Token | Nom | HEX | RGB | HSL | Usage |
|---|---|---|---|---|---|
| `--violet` | Violet Fidèle | `#5B21B6` | 91 · 33 · 182 | `262 70% 42%` | Primaire — boutons, accents, liens actifs |
| `--violet-deep` | Violet profond | `#3F1685` | 63 · 22 · 133 | `263 70% 30%` | Hover du primaire |
| `--violet-soft` | Lilas | `#C7B8F2` | 199 · 184 · 242 | `253 67% 84%` | Bordures actives, sélection |
| `--violet-tint` | Lilas pâle | `#EDE6FB` | 237 · 230 · 251 | `255 67% 94%` | Surface douce, badges |
| `--ink` | Encre | `#15101F` | 21 · 16 · 31 | `260 32% 9%` | Texte principal, fonds sombres |
| `--ink-2` | Encre douce | `#2A2236` | 42 · 34 · 54 | `264 23% 17%` | Texte secondaire |
| `--cream` | Crème | `#F6F1E7` | 246 · 241 · 231 | `40 45% 93%` | Surface principale |
| `--cream-2` | Crème ombré | `#EFE7D6` | 239 · 231 · 214 | `41 41% 89%` | Surface alternée |
| `--paper` | Blanc papier | `#FFFFFF` | 255 · 255 · 255 | `0 0% 100%` | Cartes, dialogues |
| `--honey` | Miel | `#E9A23B` | 233 · 162 · 59 | `34 80% 57%` | Récompense, succès, étoile, prestige |
| `--honey-deep` | Miel profond | `#B5781F` | 181 · 120 · 31 | `34 71% 42%` | Hover de l'accent miel |
| `--line` | Trait | `rgba(21,16,31,.14)` | — | — | Bordures, séparateurs |

### Mapping vers le système shadcn/ui (`globals.css`)

Remplacer le bloc `:root` actuel par ceci :

```css
@layer base {
  :root {
    --background: 40 45% 93%;          /* crème */
    --foreground: 260 32% 9%;          /* encre */
    --card: 0 0% 100%;                  /* paper */
    --card-foreground: 260 32% 9%;
    --popover: 0 0% 100%;
    --popover-foreground: 260 32% 9%;
    --primary: 262 70% 42%;             /* violet */
    --primary-foreground: 40 45% 93%;   /* crème sur violet */
    --secondary: 255 67% 94%;           /* lilas pâle */
    --secondary-foreground: 263 70% 30%;
    --muted: 41 41% 89%;                /* crème ombré */
    --muted-foreground: 264 23% 17%;
    --accent: 34 80% 57%;               /* miel */
    --accent-foreground: 260 32% 9%;
    --destructive: 0 70% 48%;
    --destructive-foreground: 40 45% 93%;
    --border: 260 20% 88%;
    --input: 260 20% 88%;
    --ring: 262 70% 42%;
    --radius: 0.75rem;                  /* 12px — passe de 0.5 à 0.75 pour le ton chaleureux */
  }

  .dark {
    --background: 260 32% 9%;
    --foreground: 40 45% 93%;
    --card: 264 23% 13%;
    --card-foreground: 40 45% 93%;
    --popover: 264 23% 13%;
    --popover-foreground: 40 45% 93%;
    --primary: 253 67% 70%;             /* violet plus clair en dark */
    --primary-foreground: 260 32% 9%;
    --secondary: 264 23% 17%;
    --secondary-foreground: 40 45% 93%;
    --muted: 264 23% 17%;
    --muted-foreground: 253 30% 70%;
    --accent: 34 80% 57%;
    --accent-foreground: 260 32% 9%;
    --destructive: 0 60% 50%;
    --destructive-foreground: 40 45% 93%;
    --border: 264 23% 20%;
    --input: 264 23% 20%;
    --ring: 253 67% 70%;
  }
}
```

### Typographie

Trois familles, chargées via `next/font/google` :

```ts
// app/layout.tsx
import { Instrument_Serif, DM_Sans, JetBrains_Mono } from 'next/font/google'

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
})

// puis dans <html className={`${instrumentSerif.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
```

Étendre `tailwind.config.ts` :

```ts
theme: {
  extend: {
    fontFamily: {
      display: ['var(--font-display)', 'serif'],
      sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      mono: ['var(--font-mono)', 'monospace'],
    },
    // ... reste de la config
  },
}
```

### Échelle typographique

| Token | Famille | Taille | Line-height | Usage |
|---|---|---|---|---|
| `display` | Instrument Serif Italic | `clamp(48px, 8vw, 140px)` | 0.95 | Hero pages, manifestes |
| `h1` | Instrument Serif | `clamp(36px, 5vw, 88px)` | 1.05 | Titres de page |
| `h2` | DM Sans 500 | `clamp(28px, 3.5vw, 56px)` | 1.1 | Titres de section |
| `h3` | DM Sans 500 | `32px` | 1.2 | Sous-titres |
| `body` | DM Sans 400 | `16-18px` | 1.5 | Corps de texte |
| `caps` | DM Sans 500 | `13px` `letter-spacing:.18em` `uppercase` | 1.4 | Eyebrows, labels |
| `mono` | JetBrains Mono | `12-14px` | 1.6 | IDs, codes, montants |

**Règle d'or :** un titre par page utilise Instrument Serif italic en couleur `--primary`. Tout le reste utilise DM Sans. Le mono est réservé aux chiffres exacts, codes QR, identifiants techniques.

### Espacement & radius

- Conserver l'échelle Tailwind par défaut.
- `--radius` passe de `0.5rem` à `0.75rem` (les cartes ont un radius plus généreux dans Fidèle).
- Pour les cartes de fidélité physiques/visuelles : `rounded-[22px]`.

### Ombres

```css
/* Carte standard */
box-shadow: 0 30px 60px -30px rgba(21,16,31,.25), 0 4px 18px -8px rgba(21,16,31,.1);

/* Carte premium / loyalty card */
box-shadow: 0 40px 70px -30px rgba(21,16,31,.45), 0 6px 24px -10px rgba(21,16,31,.18);
```

À ajouter dans `tailwind.config.ts` :

```ts
boxShadow: {
  'card': '0 30px 60px -30px rgba(21,16,31,.25), 0 4px 18px -8px rgba(21,16,31,.1)',
  'lc': '0 40px 70px -30px rgba(21,16,31,.45), 0 6px 24px -10px rgba(21,16,31,.18)',
}
```

---

## 🔵 Logomark

Un cercle ouvert + un point au centre. Le client au centre, la relation autour. Évoque aussi le tampon de carte de fidélité.

**Ratio de construction** : `rayon du point = rayon du cercle / 4`

### SVG (couleur dynamique via `currentColor`)

```tsx
// components/brand/Logomark.tsx
export function Logomark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-label="Fidèle"
    >
      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="50" cy="50" r="11" fill="currentColor" />
    </svg>
  )
}
```

### Wordmark

```tsx
// components/brand/Wordmark.tsx
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display italic tracking-tight ${className}`}>
      Fid<span className="text-primary">è</span>le
    </span>
  )
}
```

Le `è` est toujours en `text-primary` (violet) pour porter l'accent de marque.

### Tailles minimales

- Symbole seul : **24 px**
- Lockup horizontal complet : **80 px** de large minimum
- Zone de respiration : ≥ 1× le diamètre du cercle

### Variantes autorisées
| Fond | Symbole | Wordmark |
|---|---|---|
| Crème (`#F6F1E7`) | Violet | Encre + è violet |
| Blanc | Encre | Encre + è violet |
| Encre (`#15101F`) | Crème | Crème + è miel |
| Violet | Crème | Crème + è miel |
| Miel | Encre | Encre + è violet |

### À éviter
- Étirer/écraser le mark
- Ajouter des ombres, des dégradés ou des outlines
- Déplacer ou changer la taille du point
- Utiliser une autre typo pour le wordmark
- Poser le logo sur fond bariolé sans contraste suffisant

---

## 🧩 Composants à mettre à jour

Les composants shadcn/ui existants gagnent automatiquement la nouvelle palette une fois les variables HSL remplacées. Recommandations spécifiques :

### `Button`
- Variante `default` : fond `--primary` (violet), texte `--primary-foreground` (crème). Radius `0.75rem`.
- Variante `secondary` : fond `--secondary` (lilas pâle), texte `--violet-deep`.
- **Variante à ajouter — `prestige`** : fond `--ink`, texte `--cream`, ring miel au focus. Pour les actions premium.
- Hover : `bg-violet-deep` (assombrir le primaire).

### `Card`
- Fond : `bg-card` (blanc).
- Bordure : `border-border` (1px solide, ton lilas froid).
- Radius : `rounded-xl` (12px) par défaut, `rounded-[22px]` pour les cartes de fidélité.
- Shadow : `shadow-card`.

### `Badge`
- Variante `points` : fond `--violet-tint`, texte `--violet-deep`. Police mono. Exemple : `+10 PTS`.
- Variante `tier` : fond `--honey`, texte `--ink`. Pour les segments VIP/Prestige.

### Headers / Page titles
- Toujours en `font-display italic` avec un mot accentué via `text-primary`.
- Exemple : `<h1>Bienvenue, <em className="text-primary">Yasmine.</em></h1>`

### Eyebrows / Section labels
- `font-mono text-xs tracking-[.18em] uppercase text-primary`
- Toujours au-dessus d'un titre, pour orienter le lecteur.

### Loyalty card visuelle (carte client à l'écran)
Trois variantes définies dans le prototype :
1. **Bienvenue** — fond violet, è miel, mention "Membre depuis [date]".
2. **Quotidien** — fond crème, è violet, grille de tampons (5 cercles dont N sont remplis violet).
3. **Prestige** — fond encre, è miel, solde de points en miel.

---

## 🗣️ Voix & ton

- **Tutoiement** par défaut (« Tes 5 derniers cafés sont offerts. »).
- **Français chaleureux**, jamais corporate.
- **Phrases courtes**, beaucoup d'espaces.
- Les chiffres sont importants → toujours en mono, jamais noyés dans le texte.
- Une touche d'éditorial sur les titres (italique, mots accentués) → l'app garde une identité forte.

**Exemples de copywriting :**
- ✅ « Le café te connaît. Maintenant il te récompense. »
- ✅ « Plus qu'une visite avant le café offert. »
- ✅ « Mes habitués reviennent, et ceux qui hésitaient sont devenus des piliers. »
- ❌ « Bienvenue dans votre espace client. »
- ❌ « Votre programme de fidélisation. »

---

## 📁 Fichiers inclus

- `README.md` — ce document
- `Fidele - Identite Visuelle.html` — brand book complet (14 slides)
- `deck-stage.js` — composant nécessaire pour ouvrir le brand book
- `tokens.css` — fichier autonome avec toutes les variables CSS (copier-coller dans `globals.css`)
- `tailwind.fragment.ts` — extrait à fusionner dans `tailwind.config.ts`

### Pour ouvrir le brand book

```bash
# Depuis ce dossier
python3 -m http.server 8000
# puis ouvrir http://localhost:8000/Fidele%20-%20Identite%20Visuelle.html
```

Navigation : flèches ←/→ ou clic.

---

## ✅ Checklist d'implémentation

- [ ] Remplacer les variables HSL dans `src/app/globals.css`
- [ ] Ajouter les trois polices via `next/font/google` dans `src/app/layout.tsx`
- [ ] Étendre `tailwind.config.ts` (fontFamily, boxShadow, radius)
- [ ] Créer `components/brand/Logomark.tsx` et `components/brand/Wordmark.tsx`
- [ ] Remplacer toutes les occurrences de `Taghra` par `Fidèle` dans l'UI utilisateur (laisser le nom du package npm tel quel)
- [ ] Mettre à jour la variante `default` de `<Button>` (radius + couleurs déjà via les variables)
- [ ] Ajouter la variante `prestige` à `<Button>` via CVA
- [ ] Ajouter les variantes `points` et `tier` à `<Badge>`
- [ ] Refaire les titres des pages clés (`/dashboard`, `/join`, `/client`, `/rewards`) en `font-display italic` avec un mot en `text-primary`
- [ ] Refaire l'écran loyalty card du client avec une des trois variantes
- [ ] Vérifier le contraste WCAG AA sur les paires (encre/crème, crème/violet, encre/miel)
- [ ] Mettre à jour le favicon et l'icône PWA avec le logomark
