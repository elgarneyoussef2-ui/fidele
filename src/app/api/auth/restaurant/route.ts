import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { signRestaurantSession, RESTAURANT_COOKIE, COOKIE_OPTS } from '@/lib/session'
import { rateLimit } from '@/lib/ratelimit'

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req)
  if (limited) return limited

  const { email, password } = await req.json()
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
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(RESTAURANT_COOKIE, '', { path: '/', maxAge: 0 })
  return response
}
