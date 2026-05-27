export const dynamic = 'force-dynamic'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { createHash } from 'crypto'

const hash = (p: string) => createHash('sha256').update(p).digest('hex')

async function getRestaurantId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = await createAdminClient()
  const { data: restaurant } = await (admin.from('restaurants') as any)
    .select('id').eq('owner_id', user.id).single()
  return restaurant?.id ?? null
}

export async function GET() {
  const rid = await getRestaurantId()
  if (!rid) return NextResponse.json([], { status: 401 })

  const admin = await createAdminClient()
  const { data } = await (admin.from('staff') as any)
    .select('id, name, role, created_at')
    .eq('restaurant_id', rid)
    .order('created_at', { ascending: true })

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const { name, password, role } = await req.json().catch(() => ({}))
  if (!name || !password) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })

  const rid = await getRestaurantId()
  if (!rid) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const admin = await createAdminClient()
  const { data, error } = await (admin.from('staff') as any)
    .insert({ restaurant_id: rid, name, password_hash: hash(password), role: role ?? 'server' })
    .select('id, name, role').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
