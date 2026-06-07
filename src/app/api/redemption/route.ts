export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { getRestaurantId } from '@/lib/session'

export async function GET(req: NextRequest) {
  const restaurantId = await getRestaurantId(req)
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const admin = await createAdminClient()
  const { data, error } = await (admin.from('redemption_requests') as any)
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const { clientId, rewardId, rewardName, rewardPoints, clientName } = await req.json()
  if (!clientId || !rewardId)
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })

  const admin = await createAdminClient()

  // Vérifier que le client existe et récupérer son restaurant_id depuis la DB
  const { data: client } = await (admin.from('clients') as any)
    .select('id, points_balance, restaurant_id')
    .eq('id', clientId)
    .single()
  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

  // Vérifier que la récompense appartient au même restaurant que le client
  const { data: reward } = await (admin.from('rewards') as any)
    .select('id, restaurant_id, points_cost, active')
    .eq('id', rewardId)
    .eq('restaurant_id', client.restaurant_id)
    .maybeSingle()
  if (!reward) return NextResponse.json({ error: 'Récompense invalide' }, { status: 404 })
  if (!reward.active) return NextResponse.json({ error: 'Récompense inactive' }, { status: 400 })

  const pointsNeeded = rewardPoints ?? reward.points_cost
  if ((client.points_balance ?? 0) < pointsNeeded)
    return NextResponse.json({ error: 'Solde insuffisant' }, { status: 400 })

  // Vérifier l'absence de demande déjà en attente
  const { data: existing } = await (admin.from('redemption_requests') as any)
    .select('id')
    .eq('client_id', clientId)
    .eq('reward_id', rewardId)
    .eq('status', 'pending')
    .maybeSingle()
  if (existing)
    return NextResponse.json({ error: 'Une demande est déjà en attente pour cette récompense.' }, { status: 409 })

  const { data, error } = await (admin.from('redemption_requests') as any)
    .insert({
      client_id:     clientId,
      restaurant_id: client.restaurant_id,   // toujours depuis la DB
      reward_id:     rewardId,
      reward_name:   rewardName ?? reward.name,
      reward_points: pointsNeeded,
      client_name:   clientName,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
