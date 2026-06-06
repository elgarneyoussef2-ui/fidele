import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

// Notation dotée obligatoire pour que Next.js puisse inliner les NEXT_PUBLIC_*
const SB_URL   = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '').trim().replace(/^["']|["']$/g, '')
const SB_ANON  = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim().replace(/^["']|["']$/g, '')
const SB_ADMIN = (process.env.SUPABASE_SERVICE_ROLE_KEY  ?? '').trim().replace(/^["']|["']$/g, '')

function cookieHandlers() {
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
  return createServerClient<Database>(SB_URL, SB_ANON, { cookies: cookieHandlers() })
}

export async function createAdminClient() {
  return createServerClient<Database>(SB_URL, SB_ADMIN, { cookies: cookieHandlers() })
}
