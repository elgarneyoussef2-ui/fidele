import { redirect } from 'next/navigation'

// La page racine redirige vers le dashboard
export default function RootPage() {
  redirect('/dashboard')
}
