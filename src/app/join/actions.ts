'use server'

import { createAdminClient } from '@/lib/supabase/server'

export async function processJoinAndCredit(input: {
  restaurantId: string
  phone: string
  name: string
  amount: number
}) {
  const { restaurantId, phone, name, amount } = input
  const supabase = await createAdminClient()

  try {
    // 1. Chercher le client existant
    const { data: existingClient } = await (supabase.from('clients') as any)
      .select('*')
      .eq('phone', phone)
      .eq('restaurant_id', restaurantId)
      .maybeSingle()

    let currentClient = existingClient

    if (!existingClient) {
      // Créer nouveau client si n'existe pas
      const { data: newClient, error: createError } = await (supabase.from('clients') as any)
        .insert({
          restaurant_id: restaurantId,
          name: name,
          phone: phone,
          points_balance: 0,
          total_visits: 0,
          total_spent: 0
        })
        .select()
        .single()

      if (createError) throw createError
      currentClient = newClient
    }

    // 2. Calculer les points (10 points pour 100 MAD par défaut)
    const pointsToEarn = Math.max(0, Math.floor(amount / 10))
    if (pointsToEarn === 0 && amount > 0) {
      // Optionnel : donner au moins 1 point si le montant est petit mais > 0
    }

    const oldBalance = Number(currentClient.points_balance) || 0
    const updatedBalance = oldBalance + pointsToEarn

    // 3. Enregistrer la visite (permet plusieurs visites avec le même lien)
    const { error: visitError } = await (supabase.from('visits') as any).insert({
      client_id: currentClient.id,
      restaurant_id: restaurantId,
      amount_paid: amount,
      points_earned: pointsToEarn
    })

    if (visitError) throw visitError

    // 4. Mettre à jour le solde du client
    const { error: updateError } = await (supabase.from('clients') as any)
      .update({
        points_balance: updatedBalance,
        total_visits: (Number(currentClient.total_visits) || 0) + 1,
        total_spent: (Number(currentClient.total_spent) || 0) + amount,
        last_visit_at: new Date().toISOString()
      })
      .eq('id', currentClient.id)

    if (updateError) throw updateError

    return {
      success: true,
      pointsEarned: pointsToEarn,
      newBalance: updatedBalance,
      name: currentClient.name
    }
  } catch (error: any) {
    console.error('Erreur Action processJoinAndCredit:', error)
    return { success: false, error: error.message }
  }
}

export async function checkExistingClient(phone: string, restaurantId: string) {
  const supabase = await createAdminClient()

  try {
    const { data: client } = await (supabase.from('clients') as any)
      .select('*')
      .eq('phone', phone)
      .eq('restaurant_id', restaurantId)
      .single()

    return { client }
  } catch (error) {
    return { client: null }
  }
}
