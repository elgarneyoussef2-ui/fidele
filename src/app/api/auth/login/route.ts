import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password)
    return NextResponse.json({ error: 'Email et mot de passe requis.' }, { status: 400 })

  // Vérifier les credentials via Supabase Auth
  const { createClient: createBrowserClient } = await import('@supabase/supabase-js')
  const authClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: authData, error: authError } = await authClient.auth.signInWithPassword({ email, password })

  if (authError || !authData.user)
    return NextResponse.json({ error: authError?.message ?? 'Identifiants incorrects.' }, { status: 400 })

  // Trouver le restaurant lié
  const sb = adminClient()
  const { data: restaurant } = await sb
    .from('restaurants')
    .select('id, name')
    .eq('owner_id', authData.user.id)
    .single()

  if (!restaurant)
    return NextResponse.json({ error: 'Aucun restaurant associé à ce compte.' }, { status: 404 })

  // Cookie simple avec l'ID du restaurant (pas de Supabase SSR)
  const response = NextResponse.json({ ok: true, restaurantId: restaurant.id })
  response.cookies.set('taghra_resto', restaurant.id, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 jours
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set('taghra_resto', '', { path: '/', maxAge: 0 })
  return response
}
