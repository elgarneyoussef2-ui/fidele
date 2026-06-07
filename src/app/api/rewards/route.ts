export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getRestaurantId } from '@/lib/session'

// Colonnes DB réelles : active, points_cost

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const queryRestaurantId = searchParams.get('restaurantId')

  // Accès client (pas de cookie) : restaurantId en query param — retourne seulement les actives
  // Accès dashboard (cookie JWT) : restaurantId depuis la session — retourne toutes
  const sessionRestaurantId = await getRestaurantId(req)
  const restaurantId = sessionRestaurantId ?? queryRestaurantId

  if (!restaurantId)
    return NextResponse.json({ error: 'restaurantId requis' }, { status: 400 })

  const admin = await createAdminClient()

  let query = (admin.from('rewards') as any)
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('points_cost', { ascending: true })

  // Si pas de session (client public), ne montrer que les récompenses actives
  if (!sessionRestaurantId) query = query.eq('active', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const restaurantId = await getRestaurantId(req)
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { name, description, points_cost, active } = body
  if (!name || !points_cost)
    return NextResponse.json({ error: 'Champs manquants (name, points_cost)' }, { status: 400 })

  const admin = await createAdminClient()
  const { data, error } = await (admin.from('rewards') as any)
    .insert({
      restaurant_id: restaurantId,
      name,
      description:   description ?? '',
      points_cost:   Number(points_cost),
      active:        active ?? true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
