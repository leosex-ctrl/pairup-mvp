import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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

    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null
    const foodName = formData.get('food_name') as string | null
    const beverageType = formData.get('beverage_type') as string | null
    const flavorPrinciple = formData.get('flavor_principle') as string | null
    const reviewText = formData.get('review_text') as string | null
    const beverageBrand = formData.get('beverage_brand') as string | null
    const foodBrand = formData.get('food_brand') as string | null
    const rating = formData.get('rating') as string | null

    // Validate inputs
    if (!imageFile) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      )
    }

    if (!foodName?.trim()) {
      return NextResponse.json(
        { error: 'Food name is required' },
        { status: 400 }
      )
    }

    if (!beverageType) {
      return NextResponse.json(
        { error: 'Beverage type is required' },
        { status: 400 }
      )
    }

    if (!rating || !['up', 'down'].includes(rating)) {
      return NextResponse.json(
        { error: 'Valid rating is required' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${session.user.id}/${Date.now()}.${fileExt}`

    console.log('Uploading image:', fileName)

    // Upload image to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pairings')
      .upload(fileName, imageFile, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', {
        message: uploadError.message,
        name: uploadError.name,
      })
      return NextResponse.json(
        { error: `Failed to upload image: ${uploadError.message}` },
        { status: 500 }
      )
    }

    console.log('Upload successful:', uploadData)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('pairings')
      .getPublicUrl(fileName)

    console.log('Public URL:', publicUrl)

    // Insert pairing record
    const { data: pairingData, error: insertError } = await supabase
      .from('pairings')
      .insert({
        user_id: session.user.id,
        image_url: publicUrl,
        food_name: foodName.trim(),
        beverage_type: beverageType,
        flavor_principle: flavorPrinciple || null,
        review_text: reviewText || null,
        beverage_brand: beverageBrand || null,
        food_brand: foodBrand || null,
        rating: rating,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      })
      // Try to clean up uploaded image if insert fails
      await supabase.storage.from('pairings').remove([fileName])
      return NextResponse.json(
        { error: `Failed to save pairing: ${insertError.message}` },
        { status: 500 }
      )
    }

    console.log('Pairing created:', pairingData)

    return NextResponse.json({ success: true, pairing: pairingData })
  } catch (error) {
    console.error('Pairing API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
