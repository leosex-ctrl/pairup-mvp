import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { profileSchema } from '@/lib/validations/profile'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validationResult = profileSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if username is already taken
    const { data: existingUsername } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', data.username)
      .neq('id', session.user.id)
      .single()

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 400 }
      )
    }

    // Build profile data matching Supabase table schema
    const profileData = {
      id: session.user.id,
      display_name: data.display_name,
      username: data.username,
      bio: data.bio || null,
      beverage_preferences: data.beverage_preferences,
      dietary_preferences: [], // Not collected in onboarding, default to empty
      alcohol_toggle: data.alcohol_toggle,
      instagram_handle: data.instagram_handle || null,
      tiktok_handle: data.tiktok_handle || null,
    }

    console.log('Attempting to save profile for user:', session.user.id)
    console.log('Profile data:', JSON.stringify(profileData, null, 2))

    // Insert or update profile
    const { data: upsertData, error: upsertError } = await supabase
      .from('profiles')
      .upsert(profileData)
      .select()

    if (upsertError) {
      console.error('Profile upsert error:', {
        message: upsertError.message,
        details: upsertError.details,
        hint: upsertError.hint,
        code: upsertError.code,
      })
      return NextResponse.json(
        { error: `Failed to save profile: ${upsertError.message}` },
        { status: 500 }
      )
    }

    console.log('Profile saved successfully:', upsertData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
