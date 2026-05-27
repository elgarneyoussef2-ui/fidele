export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { createHash } from 'crypto'

const hash = (p: string) => createHash('sha256').update(p).digest('hex')

// GET  — list staff for the restaurant
export async function GET() {
  const admin = await createAdminClient()
  const { data: restaurant } = await (admin.from('restaurants') as any)
    .select('id').order('created_at', { ascending: true }).limit(1).single()
  if (!restaurant) return NextResponse.json([])

  const { data } = await (admin.from('staff') as any)
    .select('id, name, role, created_at')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: true })

  return NextResponse.json(data ?? [])
}

// POST — create staff member
export async function POST(req: NextRequest) {
  const { name, password, role } = await req.json().catch(() => ({}))
  if (!name || !password) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })

  const admin = await createAdminClient()
  const { data: restaurant } = await (admin.from('restaurants') as any)
    .select('id').order('created_at', { ascending: true }).limit(1).single()
  if (!restaurant) return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })

  const { data, error } = await (admin.from('staff') as any)
    .insert({ restaurant_id: restaurant.id, name, password_hash: hash(password), role: role ?? 'server' })
    .select('id, name, role').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
