import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST /api/client/data  { phone }
export async function POST(req: NextRequest) {
  const body  = await req.json().catch(() => ({}))
  const phone = body.phone as string | undefined
  if (!phone) return NextResponse.json({ error: 'phone requis' }, { status: 400 })

  const sb = adminSupabase()

  // All client records for this phone (one per restaurant)
  const { data: clients, error } = await sb
    .from('clients')
    .select('*, restaurants(id, name, description, logo_url, cover_url, accent_color)')
    .eq('phone', phone)
    .order('points_balance', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // For each client: apply expiry then attach visits
  const withActivity = await Promise.all(
    (clients ?? []).map(async (c: any) => {
      // Find visits whose points just expired and haven't been deducted yet
      const { data: expiredVisits } = await sb
        .from('visits')
        .select('id, points_earned')
        .eq('client_id', c.id)
        .eq('points_expired', false)
        .not('expires_at', 'is', null)
        .lt('expires_at', new Date().toISOString())

      if (expiredVisits && expiredVisits.length > 0) {
        const lostPoints = expiredVisits.reduce((s: number, v: any) => s + (v.points_earned || 0), 0)
        const ids = expiredVisits.map((v: any) => v.id)
        // Mark visits as expired
        await sb.from('visits').update({ points_expired: true }).in('id', ids)
        // Deduct from balance (floor at 0)
        const newBalance = Math.max(0, (c.points_balance || 0) - lostPoints)
        await sb.from('clients').update({ points_balance: newBalance }).eq('id', c.id)
        c = { ...c, points_balance: newBalance }
      }

      // Fetch recent visits for display
      const { data: visits } = await sb
        .from('visits')
        .select('id, amount_paid, points_earned, created_at, expires_at, points_expired')
        .eq('client_id', c.id)
        .order('created_at', { ascending: false })
        .limit(20)

      // Next expiry: earliest future expires_at with non-expired points
      const nextExpiry = (visits ?? [])
        .filter((v: any) => !v.points_expired && v.expires_at && new Date(v.expires_at) > new Date())
        .sort((a: any, b: any) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime())[0]

      return { ...c, visits: visits ?? [], next_expiry: nextExpiry ?? null }
    })
  )

  return NextResponse.json(withActivity, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  })
}
