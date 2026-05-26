export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const admin = await createAdminClient()
  const { data } = await (admin.from('restaurants') as any)
    .select('id, name')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}
