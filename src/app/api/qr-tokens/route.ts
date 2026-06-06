import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { getRestaurantId } from '@/lib/session'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { amount, staffId } = body

  if (!amount || Number(amount) <= 0)
    return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })

  const admin = await createAdminClient()

  // Auth 1 : cookie JWT restaurateur (dashboard)
  let restaurantId = await getRestaurantId(req)

  // Auth 2 : staffId fourni par la page /staff (le serveur)
  if (!restaurantId && staffId) {
    const { data: member } = await (admin.from('staff') as any)
      .select('restaurant_id')
      .eq('id', staffId)
      .maybeSingle()
    if (member) restaurantId = member.restaurant_id as string
  }

  if (!restaurantId)
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Vérifier que le restaurant existe
  const { data: restaurant } = await (admin.from('restaurants') as any)
    .select('id').eq('id', restaurantId).maybeSingle()
  if (!restaurant)
    return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })

  const { data: token, error } = await (admin.from('qr_tokens') as any)
    .insert({ restaurant_id: restaurantId, amount: Number(amount) })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: token.id })
}
