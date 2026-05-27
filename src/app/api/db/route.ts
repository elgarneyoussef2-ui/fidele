export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

function requireAdmin(req: NextRequest) {
  return req.cookies.get('taghra_admin')?.value === 'authenticated'
}

const ALLOWED: Record<string, string> = {
  restaurants:          'id,name,description,phone,mad_per_point,points_expiry_months,accent_color,created_at',
  clients:              'id,restaurant_id,name,phone,points_balance,total_visits,total_spent,last_visit_at,created_at',
  visits:               'id,client_id,restaurant_id,amount_paid,points_earned,expires_at,points_expired,created_at',
  rewards:              'id,restaurant_id,name,description,points_cost,active,created_at',
  staff:                'id,restaurant_id,name,role,created_at',
  qr_tokens:            'id,restaurant_id,amount,used_at,created_at',
  redemption_requests:  'id,client_id,reward_id,reward_name,reward_points,client_name,status,created_at',
}
const DELETABLE = new Set(['clients', 'rewards', 'staff', 'qr_tokens', 'redemption_requests', 'visits'])
const SEARCHABLE = new Set(['clients', 'staff', 'rewards'])

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const action = searchParams.get('action')
  const admin  = await createAdminClient()

  if (action === 'stats') {
    const counts: Record<string, number> = {}
    await Promise.all(
      Object.keys(ALLOWED).map(async t => {
        const { count } = await (admin.from(t) as any).select('*', { count: 'exact', head: true })
        counts[t] = count ?? 0
      })
    )
    return NextResponse.json(counts)
  }

  if (action === 'rows') {
    const table  = searchParams.get('table') ?? ''
    if (!ALLOWED[table]) return NextResponse.json({ error: 'Invalid table' }, { status: 400 })

    const page   = Math.max(0, Number(searchParams.get('page') ?? 0))
    const limit  = 20
    const search = searchParams.get('search') ?? ''

    let q = (admin.from(table) as any)
      .select(ALLOWED[table], { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * limit, page * limit + limit - 1)

    if (search && SEARCHABLE.has(table)) q = q.ilike('name', `%${search}%`)

    const { data, count, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ rows: data ?? [], total: count ?? 0 })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const table = searchParams.get('table') ?? ''
  const id    = searchParams.get('id')
  if (!DELETABLE.has(table) || !id) return NextResponse.json({ error: 'Not allowed' }, { status: 400 })

  const admin = await createAdminClient()
  const { error } = await (admin.from(table) as any).delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
