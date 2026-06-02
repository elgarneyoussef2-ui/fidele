'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { hashPassword } from '@/lib/password'

const QR_EXPIRY_MINUTES = 15

export async function getTokenData(token: string) {
  const admin = await createAdminClient()
  const { data } = await (admin.from('qr_tokens') as any)
    .select('id, amount, used_at, created_at, restaurant_id, restaurants(name)')
    .eq('id', token)
    .single()

  if (!data) return null

  // Vérifier l'expiration temporelle (15 minutes)
  const createdAt  = new Date(data.created_at as string)
  const expiresAt  = new Date(createdAt.getTime() + QR_EXPIRY_MINUTES * 60 * 1000)
  const isExpired  = new Date() > expiresAt

  return {
    ...(data as { id: string; amount: number; used_at: string | null; created_at: string; restaurant_id: string; restaurants: { name: string } }),
    expired: isExpired,
  }
}

export async function processJoinWithToken(input: { token: string; phone: string; name: string; password?: string }) {
  const { token, phone, name, password } = input
  const admin = await createAdminClient()

  const { data: qrToken } = await (admin.from('qr_tokens') as any)
    .select('*').eq('id', token).single()

  if (!qrToken) return { success: false, error: 'QR invalide' }
  if (qrToken.used_at) return { success: false, error: 'QR déjà utilisé' }

  // Vérifier expiration 15 min
  const createdAt = new Date(qrToken.created_at as string)
  const expiresAt = new Date(createdAt.getTime() + QR_EXPIRY_MINUTES * 60 * 1000)
  if (new Date() > expiresAt)
    return { success: false, error: 'Ce QR code a expiré. Demandez-en un nouveau au serveur.' }

  const restaurantId = qrToken.restaurant_id as string
  const amount       = Number(qrToken.amount)

  try {
    // Récupérer la config du restaurant (expiry + ratio points)
    const { data: resto } = await (admin.from('restaurants') as any)
      .select('points_expiry_months, mad_per_point').eq('id', restaurantId).single()
    const expiryMonths: number | null = resto?.points_expiry_months ?? null
    const madPerPoint: number         = Math.max(1, Number(resto?.mad_per_point ?? 10))

    const { data: existing } = await (admin.from('clients') as any)
      .select('*').eq('phone', phone).eq('restaurant_id', restaurantId).maybeSingle()

    let currentClient = existing
    if (!existing) {
      const passwordHash = password ? await hashPassword(password) : null
      const { data: newClient, error: ce } = await (admin.from('clients') as any)
        .insert({
          restaurant_id: restaurantId,
          name,
          phone,
          points_balance: 0,
          total_visits:   0,
          total_spent:    0,
          password_hash:  passwordHash,
        })
        .select()
        .single()
      if (ce) throw ce
      currentClient = newClient
    }

    const pointsToEarn   = Math.max(0, Math.floor(amount / madPerPoint))
    const oldBalance     = Number(currentClient.points_balance) || 0
    const updatedBalance = oldBalance + pointsToEarn

    // Calculer expires_at pour cette visite
    let visitExpiresAt: string | null = null
    if (expiryMonths) {
      const d = new Date()
      d.setMonth(d.getMonth() + expiryMonths)
      visitExpiresAt = d.toISOString()
    }

    const { error: ve } = await (admin.from('visits') as any).insert({
      client_id:      currentClient.id,
      restaurant_id:  restaurantId,
      amount_paid:    amount,
      points_earned:  pointsToEarn,
      expires_at:     visitExpiresAt,
    })
    if (ve) throw ve

    await (admin.from('clients') as any).update({
      points_balance: updatedBalance,
      total_visits:   (Number(currentClient.total_visits) || 0) + 1,
      total_spent:    (Number(currentClient.total_spent)  || 0) + amount,
      last_visit_at:  new Date().toISOString(),
    }).eq('id', currentClient.id)

    // Marquer le token comme utilisé
    await (admin.from('qr_tokens') as any)
      .update({ used_at: new Date().toISOString() }).eq('id', token)

    return {
      success:      true,
      pointsEarned: pointsToEarn,
      newBalance:   updatedBalance,
      name:         currentClient.name as string,
    }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' }
  }
}
