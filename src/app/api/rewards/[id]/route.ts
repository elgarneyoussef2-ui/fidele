import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { getRestaurantId } from '@/lib/session'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const restaurantId = await getRestaurantId(req)
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const admin = await createAdminClient()

  // Vérifier que la récompense appartient à ce restaurant
  const { data: existing } = await (admin.from('rewards') as any)
    .select('id')
    .eq('id', params.id)
    .eq('restaurant_id', restaurantId)
    .maybeSingle()

  if (!existing) return NextResponse.json({ error: 'Récompense introuvable' }, { status: 404 })

  const body = await req.json()
  // Colonnes DB réelles : active, points_cost
  const updates: Record<string, unknown> = {}
  if (body.name        !== undefined) updates.name        = body.name
  if (body.description !== undefined) updates.description = body.description
  if (body.points_cost !== undefined) updates.points_cost = Number(body.points_cost)
  if (body.active      !== undefined) updates.active      = body.active

  const { data, error } = await (admin.from('rewards') as any)
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const restaurantId = await getRestaurantId(req)
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const admin = await createAdminClient()

  // Vérifier propriété avant suppression
  const { data: existing } = await (admin.from('rewards') as any)
    .select('id')
    .eq('id', params.id)
    .eq('restaurant_id', restaurantId)
    .maybeSingle()

  if (!existing) return NextResponse.json({ error: 'Récompense introuvable' }, { status: 404 })

  const { error } = await (admin.from('rewards') as any).delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
