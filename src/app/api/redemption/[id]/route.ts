import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { getRestaurantId } from '@/lib/session'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const restaurantId = await getRestaurantId(req)
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { action } = await req.json()
  if (action !== 'accept' && action !== 'reject')
    return NextResponse.json({ error: 'Action invalide' }, { status: 400 })

  const admin = await createAdminClient()

  // Vérifier que la demande appartient à ce restaurant
  const { data: redemption } = await (admin.from('redemption_requests') as any)
    .select('*')
    .eq('id', params.id)
    .eq('restaurant_id', restaurantId)
    .single()

  if (!redemption) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
  if (redemption.status !== 'pending')
    return NextResponse.json({ error: 'Cette demande a déjà été traitée' }, { status: 409 })

  if (action === 'accept') {
    const { data: client } = await (admin.from('clients') as any)
      .select('points_balance').eq('id', redemption.client_id).single()
    if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

    if ((client.points_balance ?? 0) < redemption.reward_points)
      return NextResponse.json({ error: 'Solde insuffisant' }, { status: 400 })

    const newBalance = Math.max(0, (client.points_balance ?? 0) - redemption.reward_points)
    await (admin.from('clients') as any)
      .update({ points_balance: newBalance }).eq('id', redemption.client_id)
  }

  const { error } = await (admin.from('redemption_requests') as any)
    .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
