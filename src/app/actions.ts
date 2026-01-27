'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function toggleLike(pairingId: string) {
  const supabase = createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check if user already liked this pairing
  const { data: existingLike, error: fetchError } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('pairing_id', pairingId)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 = no rows returned (not an error for us)
    console.error('Error checking like:', fetchError)
    return { success: false, error: 'Failed to check like status' }
  }

  if (existingLike) {
    // Unlike: delete the row
    const { error: deleteError } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('pairing_id', pairingId)

    if (deleteError) {
      console.error('Error unliking:', deleteError)
      return { success: false, error: 'Failed to unlike' }
    }

    revalidatePath('/')
    revalidatePath('/feed')
    return { success: true, liked: false }
  } else {
    // Like: insert a row
    const { error: insertError } = await supabase
      .from('likes')
      .insert({
        user_id: user.id,
        pairing_id: pairingId,
      })

    if (insertError) {
      console.error('Error liking:', insertError)
      return { success: false, error: 'Failed to like' }
    }

    revalidatePath('/')
    revalidatePath('/feed')
    return { success: true, liked: true }
  }
}
