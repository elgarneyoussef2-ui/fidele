'use server'

import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'

const hashPassword = (p: string) => createHash('sha256').update(p).digest('hex')

export async function getTokenData(token: string) {
  const admin = await createAdminClient()
  const { data } = await (admin.from('qr_tokens') as any)
    .select('id, amount, used_at, restaurant_id, restaurants(name)')
    .eq('id', token)
    .single()
  return data as { id: string; amount: number; used_at: string | null; restaurant_id: string; restaurants: { name: string } } | null
}

export async function processJoinWithToken(input: { token: string; phone: string; name: string; password?: string }) {
  const { token, phone, name, password } = input
  const admin = await createAdminClient()

  const { data: qrToken } = await (admin.from('qr_tokens') as any)
    .select('*').eq('id', token).single()

  if (!qrToken) return { success: false, error: 'QR invalide' }
  if (qrToken.used_at) return { success: false, error: 'QR déjà utilisé' }

  const restaurantId = qrToken.restaurant_id
  const amount       = Number(qrToken.amount)

  try {
    const { data: existing } = await (admin.from('clients') as any)
      .select('*').eq('phone', phone).eq('restaurant_id', restaurantId).maybeSingle()

    let currentClient = existing
    if (!existing) {
      const { data: newClient, error: ce } = await (admin.from('clients') as any)
        .insert({ restaurant_id: restaurantId, name, phone, points_balance: 0, total_visits: 0, total_spent: 0, password_hash: password ? hashPassword(password) : null })
        .select().single()
      if (ce) throw ce
      currentClient = newClient
    }

    const pointsToEarn  = Math.max(0, Math.floor(amount / 10))
    const oldBalance    = Number(currentClient.points_balance) || 0
    const updatedBalance = oldBalance + pointsToEarn

    const { error: ve } = await (admin.from('visits') as any).insert({
      client_id: currentClient.id, restaurant_id: restaurantId,
      amount_paid: amount, points_earned: pointsToEarn,
    })
    if (ve) throw ve

    await (admin.from('clients') as any).update({
      points_balance: updatedBalance,
      total_visits:   (Number(currentClient.total_visits) || 0) + 1,
      total_spent:    (Number(currentClient.total_spent)  || 0) + amount,
      last_visit_at:  new Date().toISOString(),
    }).eq('id', currentClient.id)

    // Mark token as used
    await (admin.from('qr_tokens') as any)
      .update({ used_at: new Date().toISOString() }).eq('id', token)

    return { success: true, pointsEarned: pointsToEarn, newBalance: updatedBalance, name: currentClient.name }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
