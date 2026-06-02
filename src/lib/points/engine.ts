import type { Client } from '@/lib/supabase/types'

// ============================================================
// Calcul de points : 1 point par `madPerPoint` MAD dépensés
// madPerPoint vient de restaurants.mad_per_point (config par restaurant)
// ============================================================
export function calculatePoints(amountPaid: number, madPerPoint: number): number {
  if (amountPaid <= 0 || madPerPoint <= 0) return 0
  return Math.max(0, Math.floor(amountPaid / madPerPoint))
}

// ============================================================
// Détermine le segment d'un client
// ============================================================
export function getClientSegment(
  client: Pick<Client, 'total_visits' | 'points_balance' | 'last_visit_at' | 'created_at'>
): 'vip' | 'inactive' | 'new' | 'regular' {
  const now            = new Date()
  const thirtyDaysAgo  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo   = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)

  const isVip = client.total_visits >= 10 || client.points_balance >= 500

  const isInactive = client.last_visit_at
    ? new Date(client.last_visit_at) < thirtyDaysAgo
    : new Date(client.created_at)    < thirtyDaysAgo

  const isNew = new Date(client.created_at) > sevenDaysAgo

  if (isVip)     return 'vip'
  if (isNew)     return 'new'
  if (isInactive) return 'inactive'
  return 'regular'
}

// NOTE : Le crédit de points (insertion en DB) se fait uniquement côté serveur
// via src/app/join/actions.ts (processJoinWithToken) — jamais depuis le browser.
