export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { hashPassword } from '@/lib/password'

export async function GET(req: NextRequest) {
  const restaurantId = req.cookies.get('fidele_restaurant_session')?.value
  if (!restaurantId) return NextResponse.json([], { status: 401 })

  const admin = await createAdminClient()
  const { data } = await (admin.from('staff') as any)
    .select('id, name, role, created_at')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: true })

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const restaurantId = req.cookies.get('fidele_restaurant_session')?.value
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { name, password, role } = await req.json().catch(() => ({}))
  if (!name || !password) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })

  const admin = await createAdminClient()
  const { data, error } = await (admin.from('staff') as any)
    .insert({ restaurant_id: restaurantId, name, password_hash: await hashPassword(password), role: role ?? 'server' })
    .select('id, name, role').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
