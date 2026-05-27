import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const RESTAURANT_COOKIE = 'fidele_restaurant_session'

const COOKIE_OPTS = {
  httpOnly: true,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 8, // 8h
}

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
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Email et mot de passe requis.' }, { status: 400 })
  }

  // Verify credentials
  const { data: authData, error } = await anonClient().auth.signInWithPassword({ email, password })
  if (error || !authData.user) {
    return NextResponse.json({ error: 'Identifiants incorrects.' }, { status: 401 })
  }

  // Find linked restaurant
  const { data: restaurant } = await adminClient()
    .from('restaurants')
    .select('id')
    .eq('owner_id', authData.user.id)
    .single()

  if (!restaurant) {
    return NextResponse.json({ error: 'Aucun restaurant associé à ce compte.' }, { status: 404 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(RESTAURANT_COOKIE, restaurant.id, COOKIE_OPTS)
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(RESTAURANT_COOKIE, '', { path: '/', maxAge: 0 })
  return response
}
