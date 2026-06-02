export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getRestaurantId } from '@/lib/session'

// Transforme les colonnes DB (is_active, points_required) vers les noms frontend (active, points_cost)
function toFrontend(row: Record<string, unknown>) {
  return { ...row, active: row.is_active, points_cost: row.points_required }
}

export async function GET(req: NextRequest) {
  const restaurantId = await getRestaurantId(req)
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const admin = await createAdminClient()

  const { data, error } = await (admin.from('rewards') as any)
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .order('points_required', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json((data ?? []).map(toFrontend))
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
      restaurant_id:   restaurantId,
      name,
      description:     description ?? '',
      points_required: Number(points_cost),
      is_active:       active ?? true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(toFrontend(data))
}
