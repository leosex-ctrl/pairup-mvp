import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

// Disable caching - always fetch fresh data
export const revalidate = 0

export default async function Home() {
  const cookieStore = cookies()
  const ageVerified = cookieStore.get('age_verified')?.value

  // If not age verified, redirect to age gate
  if (!ageVerified || ageVerified !== 'true') {
    redirect('/age-gate')
  }

  // Check if user is logged in
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/feed')
  } else {
    redirect('/login')
  }
}
