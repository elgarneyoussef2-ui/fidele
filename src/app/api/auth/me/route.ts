import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const restaurantId = req.cookies.get('taghra_resto')?.value
  if (!restaurantId) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data } = await sb
    .from('restaurants')
    .select('id, name, owner_id')
    .eq('id', restaurantId)
    .single()

  if (!data) return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })

  let email = ''
  try {
    const { data: u } = await sb.auth.admin.getUserById(data.owner_id)
    email = (u as any)?.user?.email ?? ''
  } catch { /* ignore */ }

  return NextResponse.json({ id: data.id, name: data.name, email })
}
