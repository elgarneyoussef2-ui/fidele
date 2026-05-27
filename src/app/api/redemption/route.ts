export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const restaurantId = req.cookies.get('fidele_restaurant_session')?.value
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
  const { clientId, restaurantId, rewardId, rewardName, rewardPoints, clientName } = await req.json()
  if (!clientId || !restaurantId || !rewardId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const admin = await createAdminClient()

  const { data: client } = await (admin.from('clients') as any)
    .select('points_balance').eq('id', clientId).single()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  if ((client.points_balance ?? 0) < rewardPoints)
    return NextResponse.json({ error: 'Solde insuffisant' }, { status: 400 })

  const { data: existing } = await (admin.from('redemption_requests') as any)
    .select('id').eq('client_id', clientId).eq('reward_id', rewardId).eq('status', 'pending').maybeSingle()
  if (existing) return NextResponse.json({ error: 'Une demande est déjà en attente pour cette récompense.' }, { status: 409 })

  const { data, error } = await (admin.from('redemption_requests') as any)
    .insert({ client_id: clientId, restaurant_id: restaurantId, reward_id: rewardId, reward_name: rewardName, reward_points: rewardPoints, client_name: clientName })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
