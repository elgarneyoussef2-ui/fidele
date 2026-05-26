import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { amount } = await req.json()
  if (!amount || Number(amount) <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

  const admin = await createAdminClient()

  const { data: restaurant } = await (admin.from('restaurants') as any)
    .select('id').order('created_at', { ascending: true }).limit(1).single()
  if (!restaurant) return NextResponse.json({ error: 'No restaurant' }, { status: 404 })

  const { data: token, error } = await (admin.from('qr_tokens') as any)
    .insert({ restaurant_id: restaurant.id, amount: Number(amount) })
    .select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: token.id })
}
