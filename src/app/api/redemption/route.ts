export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const admin = await createAdminClient()

  const { data: restaurant } = await (admin.from('restaurants') as any)
    .select('id').order('created_at', { ascending: true }).limit(1).single()
  if (!restaurant) return NextResponse.json([])

  const { data, error } = await (admin.from('redemption_requests') as any)
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const { clientId, restaurantId, rewardId, rewardName, rewardPoints, clientName } = await req.json()
  if (!clientId || !restaurantId || !rewardId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const admin = await createAdminClient()

  const { data: client } = await (admin.from('clients') as any)
    .select('points_balance').eq('id', clientId).single()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  if ((client.points_balance ?? 0) < rewardPoints)
    return NextResponse.json({ error: 'Solde insuffisant' }, { status: 400 })

  const { data, error } = await (admin.from('redemption_requests') as any)
    .insert({ client_id: clientId, restaurant_id: restaurantId, reward_id: rewardId, reward_name: rewardName, reward_points: rewardPoints, client_name: clientName })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
