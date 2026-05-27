import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { getRestaurantId } from '@/lib/session'

export async function POST(req: NextRequest) {
  const restaurantId = await getRestaurantId(req)
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { amount } = await req.json()
  if (!amount || Number(amount) <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

  const admin = await createAdminClient()

  // Verify the restaurant exists and matches the session
  const { data: restaurant } = await (admin.from('restaurants') as any)
    .select('id').eq('id', restaurantId).maybeSingle()
  if (!restaurant) return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })

  const { data: token, error } = await (admin.from('qr_tokens') as any)
    .insert({ restaurant_id: restaurantId, amount: Number(amount) })
    .select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: token.id })
}
