export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const restaurantId = searchParams.get('restaurantId')
  const admin = await createAdminClient()

  let query = (admin.from('rewards') as any)
    .select('*')
    .eq('active', true)
    .order('points_cost', { ascending: true })

  if (restaurantId) query = query.eq('restaurant_id', restaurantId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const restaurantId = req.cookies.get('fidele_restaurant_session')?.value
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { name, description, points_cost, active } = body
  if (!name || !points_cost) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const admin = await createAdminClient()
  const { data, error } = await (admin.from('rewards') as any)
    .insert({ restaurant_id: restaurantId, name, description: description ?? '', points_cost: Number(points_cost), active: active ?? true })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
