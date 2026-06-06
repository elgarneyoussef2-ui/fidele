import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

// Nettoie les variables d'env : supprime guillemets et espaces parasites
function e(key: string): string {
  return (process.env[key] ?? '').trim().replace(/^["']|["']$/g, '')
}

const cookieHandlers = () => {
  const cookieStore = cookies()
  return {
    getAll() { return cookieStore.getAll() },
    setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      } catch { }
    },
  }
}

export async function createClient() {
  return createServerClient<Database>(
    e('NEXT_PUBLIC_SUPABASE_URL'),
    e('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    { cookies: cookieHandlers() }
  )
}

export async function createAdminClient() {
  return createServerClient<Database>(
    e('NEXT_PUBLIC_SUPABASE_URL'),
    e('SUPABASE_SERVICE_ROLE_KEY'),
    { cookies: cookieHandlers() }
  )
}
