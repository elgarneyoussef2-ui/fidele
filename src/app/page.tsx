import { redirect } from 'next/navigation'

// La page racine redirige vers la page de test du restaurant
export default function RootPage() {
  redirect('/restaurant-test')
}
