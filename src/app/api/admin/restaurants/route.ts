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
  return req.cookies.get('taghra_admin')?.value === 'authenticated'
}

// GET — list all restaurants + client count
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const sb = adminSupabase()

    const { data: restaurants, error } = await sb
      .from('restaurants')
      .select('id, name, owner_id')
      .order('name', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const withMeta = await Promise.all(
      (restaurants ?? []).map(async (r: any) => {
        // Client count
        const { count } = await sb
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_id', r.id)

        // Email from auth
        let email = ''
        try {
          const { data } = await sb.auth.admin.getUserById(r.owner_id)
          email = (data as any)?.user?.email ?? ''
        } catch { /* ignore */ }

        return { ...r, user_id: r.owner_id, clientCount: count ?? 0, email }
      })
    )

    return NextResponse.json(withMeta)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST — create restaurant + auth user
export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
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
      owner_id: authData.user.id,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now(),
    })

    if (restoError) {
      await sb.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: restoError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH — update restaurant email and/or password
export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const { userId, email, password } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    if (!email && !password) return NextResponse.json({ error: 'Email ou mot de passe requis' }, { status: 400 })

    const sb = adminSupabase()
    const updates: { email?: string; password?: string } = {}
    if (email)    updates.email    = email
    if (password) updates.password = password

    const { error } = await sb.auth.admin.updateUserById(userId, updates)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE — remove restaurant + auth user
export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const { id, userId } = await req.json()
    if (!id || !userId) return NextResponse.json({ error: 'id et userId requis' }, { status: 400 })

    const sb = adminSupabase()
    await sb.from('restaurants').delete().eq('id', id)
    await sb.auth.admin.deleteUser(userId)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
