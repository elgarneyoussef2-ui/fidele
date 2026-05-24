import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function requireAdmin(req: NextRequest) {
  const cookie = req.cookies.get('taghra_admin')?.value
  if (cookie !== 'authenticated') return false
  return true
}

// GET  /api/admin/restaurants  – list all restaurants + client count
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const sb = adminSupabase()

  const { data: restaurants, error } = await sb
    .from('restaurants')
    .select('id, name, user_id, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Client counts
  const withCounts = await Promise.all(
    (restaurants ?? []).map(async (r: any) => {
      const { count } = await sb
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', r.id)

      // Get email from auth
      const { data: userData } = await sb.auth.admin.getUserById(r.user_id)

      return { ...r, clientCount: count ?? 0, email: userData?.user?.email ?? '' }
    })
  )

  return NextResponse.json(withCounts)
}

// POST /api/admin/restaurants  – create restaurant + auth user
export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { name, email, password, address } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Nom, email et mot de passe requis.' }, { status: 400 })
  }

  const sb = adminSupabase()

  // 1. Create auth user
  const { data: authData, error: authError } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Erreur création utilisateur' }, { status: 400 })
  }

  // 2. Create restaurant record
  const { error: restoError } = await sb.from('restaurants').insert({
    user_id: authData.user.id,
    name,
    address: address ?? null,
  })

  if (restoError) {
    // Rollback auth user
    await sb.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: restoError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/admin/restaurants  – delete by { id, userId }
export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id, userId } = await req.json()
  if (!id || !userId) return NextResponse.json({ error: 'id et userId requis' }, { status: 400 })

  const sb = adminSupabase()

  // Delete restaurant (cascades to clients + visits via FK if set up)
  await sb.from('restaurants').delete().eq('id', id)

  // Delete auth user
  await sb.auth.admin.deleteUser(userId)

  return NextResponse.json({ ok: true })
}
