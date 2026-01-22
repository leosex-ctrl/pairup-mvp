import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

// Configure body size limit for large images (10MB)


const SYSTEM_PROMPT = `You are a friendly but knowledgeable sommelier and food pairing expert.

IMPORTANT - STRICT INVENTORY CHECK:
First, carefully examine the image to determine what is ACTUALLY visible:
- Is there FOOD in the image? (meals, snacks, dishes, ingredients)
- Is there a BEVERAGE in the image? (drinks, bottles, cans, glasses with liquid)

DO NOT hallucinate or assume items exist if they are not clearly visible in the photo.

Analyze the image and return a JSON object with exactly these fields:

1. food_name:
   - If food IS visible: A short, descriptive name (e.g., "Grilled Salmon", "Margherita Pizza")
   - If NO food is visible: Return "None detected"

2. beverage_type:
   - If a beverage IS visible, identify it as EXACTLY one of: "Wine", "Beer", "Spirits", "Cocktails", "Non-Alcoholic"
   - If NO beverage is visible: Return "None detected"
   - If only food is visible (no beverage), suggest the best pairing type from the list above

3. flavor_principle: Must be EXACTLY one of these values:
   - "Acid + Umami"
   - "Sweet + Spicy"
   - "Fat + Tannin"
   - "Bitter + Sweet"
   - "Effervescence + Fried"
   - "Complement"
   - "Contrast"
   Choose the flavor principle that best describes the pairing (actual or suggested).

4. review_text: A 3-4 sentence grounded analysis in a friendly sommelier tone.
   - If BOTH food and beverage are visible: Explain how their flavors interact.
   - If ONLY FOOD is visible: Describe the food's flavor profile and suggest what beverage would pair well with it.
   - If ONLY BEVERAGE is visible: Describe the beverage's characteristics and suggest what foods would complement it (e.g., "This hoppy IPA would pair beautifully with spicy wings or a sharp cheddar...").
   - NEVER pretend a pairing exists in the photo if it doesn't. Be honest about what you see.

5. beverage_brand: If a beverage brand/logo is visible (e.g., "Duvel", "Heineken"), return it. Otherwise return null.

6. food_brand: If a food brand/logo is visible (e.g., "Doritos", "Lay's"), return it. Otherwise return null.

Return ONLY valid JSON, no markdown, no explanation.

Example with both items:
{"food_name":"Grilled Ribeye Steak","beverage_type":"Wine","flavor_principle":"Fat + Tannin","review_text":"This beautifully marbled ribeye is calling for a bold red wine. The rich fat content and savory char will be perfectly balanced by the tannins in a Cabernet Sauvignon or Malbec.","beverage_brand":null,"food_brand":null}

Example with only beverage:
{"food_name":"None detected","beverage_type":"Beer","flavor_principle":"Bitter + Sweet","review_text":"This golden Belgian ale has complex fruity esters and a dry finish. It would pair wonderfully with creamy cheeses, mussels, or crispy frites. The carbonation cuts through rich, fatty foods beautifully.","beverage_brand":"Duvel","food_brand":null}`

export async function POST(request: Request) {
  console.log('=== ANALYZE PAIRING API ===')
  console.log('Received request')

  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    console.log('Key configured?', apiKey ? 'YES (length: ' + apiKey.length + ')' : 'NO')

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.log('ERROR: API key not configured')
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please add your key to .env.local' },
        { status: 500 }
      )
    }

    console.log('Parsing form data...')
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile) {
      console.log('ERROR: No image in request')
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      )
    }

    console.log('Image received:', {
      name: imageFile.name,
      type: imageFile.type,
      size: `${(imageFile.size / 1024 / 1024).toFixed(2)} MB`,
    })

    // Convert file to base64
    console.log('Converting to base64...')
    const bytes = await imageFile.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = imageFile.type || 'image/jpeg'
    console.log('Base64 length:', base64.length)

    // Initialize Gemini
    console.log('Initializing Gemini...')
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    console.log('Sending to Gemini API...')

    // Analyze the image
    const result = await model.generateContent([
      SYSTEM_PROMPT,
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
    ])

    const response = result.response
    const text = response.text()

    console.log('Gemini response received')
    console.log('=== GEMINI RESPONSE ===')
    console.log(text)
    console.log('=== END RESPONSE ===')

    // Parse the JSON response
    let analysis
    try {
      // Clean up the response in case it has markdown code blocks
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      console.log('Cleaned text:', cleanedText)
      analysis = JSON.parse(cleanedText)
      console.log('Parsed analysis:', analysis)
    } catch (parseError) {
      console.error('ERROR: Failed to parse Gemini response')
      console.error('Parse error:', parseError)
      console.error('Raw text was:', text)
      return NextResponse.json(
        { error: `Failed to parse AI response: ${text.substring(0, 100)}...` },
        { status: 500 }
      )
    }

    // Validate the response has required fields
    if (!analysis.food_name || !analysis.beverage_type || !analysis.flavor_principle || !analysis.review_text) {
      console.error('ERROR: Invalid AI response structure')
      console.error('Missing fields in:', analysis)
      return NextResponse.json(
        { error: `AI response missing required fields. Got: ${JSON.stringify(analysis)}` },
        { status: 500 }
      )
    }

    console.log('SUCCESS! Returning analysis:', analysis)

    return NextResponse.json({
      success: true,
      analysis: {
        food_name: analysis.food_name,
        beverage_type: analysis.beverage_type,
        flavor_principle: analysis.flavor_principle,
        review_text: analysis.review_text,
        beverage_brand: analysis.beverage_brand || null,
        food_brand: analysis.food_brand || null,
      },
    })
  } catch (error) {
    console.error('=== ANALYZE PAIRING ERROR ===')
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Full error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: `Failed to analyze image: ${errorMessage}` },
      { status: 500 }
    )
  }
}
