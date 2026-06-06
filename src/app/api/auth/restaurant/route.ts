import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { signRestaurantSession, RESTAURANT_COOKIE, COOKIE_OPTS } from '@/lib/session'
import { rateLimit } from '@/lib/ratelimit'

// DEBUG TEMPORAIRE — à supprimer après diagnostic
const RAW_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '__UNDEFINED__'
console.log('[ENV DEBUG] NEXT_PUBLIC_SUPABASE_URL raw:', JSON.stringify(RAW_URL))

const SB_URL   = RAW_URL.trim().replace(/^["']+|["']+$/g, '')
const SB_ANON  = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim().replace(/^["']+|["']+$/g, '')
const SB_ADMIN = (process.env.SUPABASE_SERVICE_ROLE_KEY  ?? '').trim().replace(/^["']+|["']+$/g, '')

function anonClient() {
  return createClient(SB_URL, SB_ANON, { auth: { persistSession: false, autoRefreshToken: false } })
}

function adminClient() {
  return createClient(SB_URL, SB_ADMIN, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req)
    if (limited) return limited

    const body = await req.json().catch(() => ({}))
    const { email, password } = body
    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis.' }, { status: 400 })
    }

    const { data: authData, error } = await anonClient().auth.signInWithPassword({ email, password })
    if (error || !authData.user) {
      return NextResponse.json({ error: 'Identifiants incorrects.' }, { status: 401 })
    }

    const { data: restaurant } = await adminClient()
      .from('restaurants')
      .select('id')
      .eq('owner_id', authData.user.id)
      .single()

    if (!restaurant) {
      return NextResponse.json({ error: 'Aucun restaurant associé à ce compte.' }, { status: 404 })
    }

    const jwt = await signRestaurantSession(restaurant.id)
    const response = NextResponse.json({ ok: true })
    response.cookies.set(RESTAURANT_COOKIE, jwt, COOKIE_OPTS)
    return response
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne'
    console.error('[POST /api/auth/restaurant]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(RESTAURANT_COOKIE, '', { path: '/', maxAge: 0 })
  return response
}
