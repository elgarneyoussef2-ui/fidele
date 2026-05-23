import type { Client, PointsRule } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import { sendMessage } from '@/lib/whatsapp/client'

// ============================================================
// Calcul des points selon le montant payé et la règle active
// ============================================================
export function calculatePoints(
  amountPaid: number,
  rule: Pick<PointsRule, 'points_per_100mad'>
): number {
  if (amountPaid <= 0) return 0
  // Exemple : 10 pts par tranche de 100 MAD
  return Math.floor((amountPaid / 100) * rule.points_per_100mad)
}

// ============================================================
// Détermine le segment d'un client
// ============================================================
export function getClientSegment(
  client: Pick<Client, 'total_visits' | 'points_balance' | 'last_visit_at' | 'created_at'>
): 'vip' | 'inactive' | 'new' | 'regular' {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const isVip =
    client.total_visits >= 10 || client.points_balance >= 500

  const isInactive =
    client.last_visit_at
      ? new Date(client.last_visit_at) < thirtyDaysAgo
      : new Date(client.created_at) < thirtyDaysAgo

  const isNew = new Date(client.created_at) > sevenDaysAgo

  if (isVip) return 'vip'
  if (isNew) return 'new'
  if (isInactive) return 'inactive'
  return 'regular'
}

// ============================================================
// Données pour créditer une visite
// ============================================================
export interface CreditPointsInput {
  clientId: string
  restaurantId: string
  restaurantName: string
  amountPaid: number
  rule: Pick<PointsRule, 'points_per_100mad'>
}

// ============================================================
// Crédite les points après une visite + notif WhatsApp
// Côté client (browser) — utilise le client Supabase anon
// ============================================================
export async function creditPoints(input: CreditPointsInput): Promise<{
  pointsEarned: number
  newBalance: number
  visitId: string
}> {
  const { clientId, restaurantId, restaurantName, amountPaid, rule } = input
  const supabase = createClient()

  const pointsEarned = calculatePoints(amountPaid, rule)

  // Récupérer le client courant
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('points_balance, total_visits, total_spent, name, phone')
    .eq('id', clientId)
    .single()

  if (clientError || !client) {
    throw new Error('Client introuvable')
  }

  const newBalance = client.points_balance + pointsEarned
  const newVisits = client.total_visits + 1
  const newSpent = Number(client.total_spent) + amountPaid

  // Insérer la visite
  const { data: visit, error: visitError } = await supabase
    .from('visits')
    .insert({
      client_id: clientId,
      restaurant_id: restaurantId,
      amount_paid: amountPaid,
      points_earned: pointsEarned,
    })
    .select('id')
    .single()

  if (visitError || !visit) {
    throw new Error('Erreur lors de l\'enregistrement de la visite')
  }

  // Mettre à jour le solde client
  const { error: updateError } = await supabase
    .from('clients')
    .update({
      points_balance: newBalance,
      total_visits: newVisits,
      total_spent: newSpent,
      last_visit_at: new Date().toISOString(),
    })
    .eq('id', clientId)

  if (updateError) {
    throw new Error('Erreur lors de la mise à jour des points')
  }

  // Notification WhatsApp asynchrone (ne bloque pas si ça échoue)
  sendMessage({
    phone: client.phone,
    templateName: 'points_update',
    variables: {
      name: client.name,
      restaurant: restaurantName,
      earned: pointsEarned,
      balance: newBalance,
    },
  }).catch((err) =>
    console.error('[WhatsApp] Erreur envoi points_update:', err)
  )

  return { pointsEarned, newBalance, visitId: visit.id }
}
