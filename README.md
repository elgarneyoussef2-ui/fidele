# Fidèle - Système de Fidélité Client

Fidèle est une plateforme moderne de gestion de fidélité pour les restaurants, permettant de récompenser les clients via un système de points automatisé et des notifications WhatsApp.

## 🚀 Fonctionnalités

- **Système de Points** : Calcul automatique des points gagnés en fonction du montant dépensé (ex: 10 points pour 100 MAD).
- **Segmentation Client** : Classification automatique des clients (VIP, Régulier, Nouveau, Inactif) selon leur fréquence de visite et leur solde de points.
- **Intégration WhatsApp** : Envoi de notifications automatiques lors du crédit de points.
- **Authentification Sécurisée** : Gestion des accès via Supabase Auth.
- **Interface Moderne** : UI épurée construite avec Next.js, Tailwind CSS et les composants Radix UI.

## 🛠️ Stack Technique

- **Frontend** : [Next.js 14](https://nextjs.org/) (App Router), TypeScript, Tailwind CSS.
- **Backend/Base de données** : [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime).
- **Composants UI** : [Shadcn/UI](https://ui.shadcn.com/) (basé sur Radix UI).
- **Notifications** : Intégration API WhatsApp.
- **Déploiement** : [Vercel](https://vercel.com/).

## 📁 Structure du Projet

- `src/app/` : Routes et pages de l'application (Next.js App Router).
- `src/components/ui/` : Composants d'interface réutilisables.
- `src/lib/` : Logique métier et utilitaires.
  - `points/` : Moteur de calcul des points et segmentation.
  - `supabase/` : Configuration et types du client Supabase.
  - `whatsapp/` : Client et templates pour les messages WhatsApp.
- `supabase/migrations/` : Scripts SQL pour la structure de la base de données.

## ⚙️ Configuration Locale

1. Clonez le dépôt.
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Copiez le fichier d'exemple des variables d'environnement :
   ```bash
   cp .env.local.example .env.local
   ```
4. Remplissez les clés Supabase dans `.env.local`.
5. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

## 🌐 Déploiement sur Vercel

1. Connectez votre dépôt GitHub à Vercel.
2. Ajoutez les variables d'environnement suivantes dans les paramètres Vercel :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
3. Déployez !

## 🛡️ Sécurité

Le projet utilise les **Row Level Security (RLS)** de Supabase pour garantir que les restaurants ne peuvent accéder qu'à leurs propres données clients et visites.

---
Développé avec ❤️ pour Fidèle.
