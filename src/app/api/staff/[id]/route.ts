export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const restaurantId = req.cookies.get('fidele_restaurant_session')?.value
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const admin = await createAdminClient()

  // Verify the staff member belongs to this restaurant before deleting
  const { data: member } = await (admin.from('staff') as any)
    .select('id')
    .eq('id', params.id)
    .eq('restaurant_id', restaurantId)
    .maybeSingle()

  if (!member) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const { error } = await (admin.from('staff') as any).delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
