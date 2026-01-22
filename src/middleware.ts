import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that don't require age verification
const PUBLIC_ROUTES = ['/age-gate', '/blocked']

// Routes that require authentication and a complete profile
const PROTECTED_ROUTES = ['/feed']

// Routes that require authentication but not a profile (for onboarding)
const ONBOARDING_ROUTES = ['/setup-profile']

// Auth routes (should redirect to feed if already logged in)
const AUTH_ROUTES = ['/login', '/signup', '/callback']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const pathname = req.nextUrl.pathname

  // Allow public routes without any checks
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return res
  }

  // Check for age verification cookie
  const ageVerified = req.cookies.get('age_verified')?.value

  // If no age verification, redirect to age-gate
  if (!ageVerified || ageVerified !== 'true') {
    return NextResponse.redirect(new URL('/age-gate', req.url))
  }

  // Get the session
  const { data: { session } } = await supabase.auth.getSession()

  // If accessing auth routes while logged in, redirect to feed
  if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    if (session) {
      return NextResponse.redirect(new URL('/feed', req.url))
    }
    return res
  }

  // If accessing onboarding routes
  if (ONBOARDING_ROUTES.some(route => pathname.startsWith(route))) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return res
  }

  // If accessing protected routes without session, redirect to login
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Check if user has a profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', session.user.id)
      .single()

    if (!profile) {
      return NextResponse.redirect(new URL('/setup-profile', req.url))
    }

    return res
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
