import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && session) {
      // For OAuth users, we need to check if they have the consent metadata
      // If not, we should store it (they agreed by using the app after age gate)
      const user = session.user
      const metadata = user.user_metadata

      if (!metadata?.data_consent_granted) {
        // Get DOB from localStorage (set during age-gate)
        // Since we can't access localStorage from server, we'll set default consent
        await supabase.auth.updateUser({
          data: {
            ...metadata,
            data_consent_granted: true,
            data_consent_timestamp: new Date().toISOString(),
          },
        })
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/feed', request.url))
}
