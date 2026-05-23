import { redirect } from 'next/navigation'

// La page racine redirige vers le dashboard (ou login via middleware)
export default function RootPage() {
  redirect('/dashboard')
}
