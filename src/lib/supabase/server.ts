import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

function extractUrl(raw: string | undefined): string {
  if (!raw) return ''
  const match = raw.match(/https?:\/\/[^\s"'"'`]+/)
  return match ? match[0] : raw.trim()
}

function cleanKey(raw: string | undefined): string {
  return (raw ?? '').trim().replace(/^["'"'`\s]+|["'"'`\s]+$/g, '')
}

const SB_URL   = extractUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
const SB_ANON  = cleanKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const SB_ADMIN = cleanKey(process.env.SUPABASE_SERVICE_ROLE_KEY)

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
