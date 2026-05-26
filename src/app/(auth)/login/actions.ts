'use server'

import { createClient } from '@/lib/supabase/server'

export async function signInAction(email: string, password: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
