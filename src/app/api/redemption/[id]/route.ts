import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { action } = await req.json()
  if (action !== 'accept' && action !== 'reject')
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  const admin = await createAdminClient()

  const { data: req_ } = await (admin.from('redemption_requests') as any)
    .select('*').eq('id', params.id).single()
  if (!req_) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'accept') {
    const { data: client } = await (admin.from('clients') as any)
      .select('points_balance').eq('id', req_.client_id).single()
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const newBalance = Math.max(0, (client.points_balance ?? 0) - req_.reward_points)
    await (admin.from('clients') as any)
      .update({ points_balance: newBalance }).eq('id', req_.client_id)
  }

  const { error } = await (admin.from('redemption_requests') as any)
    .update({ status: action === 'accept' ? 'accepted' : 'rejected' }).eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
