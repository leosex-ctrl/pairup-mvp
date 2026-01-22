'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ImagePicker } from './image-picker'
import { BEVERAGE_TYPES, FLAVOR_PRINCIPLES } from '@/lib/validations/pairing'

// Map AI beverage types to our form values
const BEVERAGE_TYPE_MAP: Record<string, string> = {
  'Wine': 'wine',
  'Beer': 'beer',
  'Spirits': 'spirits',
  'Cocktails': 'cocktails',
  'Non-Alcoholic': 'na-beer', // Default NA option
  'None detected': 'none', // Food-only posts
}

export function NewPairingModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [foodName, setFoodName] = useState<string>('')
  const [beverageTag, setBeverageTag] = useState<string>('')
  const [flavorPrinciple, setFlavorPrinciple] = useState<string>('')
  const [reviewText, setReviewText] = useState<string>('')
  const [beverageBrand, setBeverageBrand] = useState<string>('')
  const [foodBrand, setFoodBrand] = useState<string>('')
  const [rating, setRating] = useState<'up' | 'down' | null>(null)

  const [imageError, setImageError] = useState<string | null>(null)

  const resetForm = () => {
    setImageFile(null)
    setFoodName('')
    setBeverageTag('')
    setFlavorPrinciple('')
    setReviewText('')
    setBeverageBrand('')
    setFoodBrand('')
    setRating(null)
    setError(null)
    setHasError(false)
    setImageError(null)
    setIsSubmitting(false)
    setIsAnalyzing(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', file)

      console.log('=== FRONTEND: Analyzing image with AI ===')
      console.log('File:', file.name, file.type, `${(file.size / 1024 / 1024).toFixed(2)} MB`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
        alert('AI Analysis timed out after 60 seconds')
      }, 60000)

      const response = await fetch('/api/analyze-pairing', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log('Response status:', response.status)

      const result = await response.json()
      console.log('Response body:', result)

      if (!response.ok) {
        const errorMsg = result.error || 'AI analysis failed'
        console.error('AI analysis failed:', errorMsg)
        alert(`AI Analysis Error: ${errorMsg}`)
        return
      }

      console.log('AI analysis result:', result.analysis)

      // Auto-fill the form fields
      if (result.analysis) {
        const { food_name, beverage_type, flavor_principle, review_text, beverage_brand, food_brand } = result.analysis

        if (food_name) {
          setFoodName(food_name)
        }

        if (beverage_type) {
          const mappedBeverage = BEVERAGE_TYPE_MAP[beverage_type]
          if (mappedBeverage) {
            setBeverageTag(mappedBeverage)
          }
        }

        if (flavor_principle) {
          // Check if the flavor principle matches one of our options
          const validPrinciple = FLAVOR_PRINCIPLES.find(
            (p) => p.value === flavor_principle
          )
          if (validPrinciple) {
            setFlavorPrinciple(flavor_principle)
          }
        }

        if (review_text) {
          setReviewText(review_text)
        }

        if (beverage_brand) {
          setBeverageBrand(beverage_brand)
        }

        if (food_brand) {
          setFoodBrand(food_brand)
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error('AI analysis error:', err)
      alert(`AI Analysis Exception: ${errorMsg}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleImageSelect = (file: File | null) => {
    setImageFile(file)
    setImageError(null)

    // Trigger AI analysis when image is selected
    if (file) {
      analyzeImage(file)
    } else {
      // Clear fields when image is removed
      setFoodName('')
      setBeverageTag('')
      setFlavorPrinciple('')
      setReviewText('')
      setBeverageBrand('')
      setFoodBrand('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setHasError(false)
    setImageError(null)

    // Validate
    if (!imageFile) {
      setImageError('Please select an image')
      return
    }
    if (!foodName.trim()) {
      setError('Please enter a food name')
      return
    }
    // beverageTag can be empty for food-only posts - will default to 'none'
    if (!rating) {
      setError('Please select a rating')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('food_name', foodName.trim())
      // Default to 'none' for food-only posts
      formData.append('beverage_type', beverageTag || 'none')
      if (flavorPrinciple) {
        formData.append('flavor_principle', flavorPrinciple)
      }
      if (reviewText) {
        formData.append('review_text', reviewText)
      }
      if (beverageBrand) {
        formData.append('beverage_brand', beverageBrand)
      }
      if (foodBrand) {
        formData.append('food_brand', foodBrand)
      }
      formData.append('rating', rating)

      console.log('Submitting pairing:', {
        food_name: foodName.trim(),
        beverage_type: beverageTag,
        flavor_principle: flavorPrinciple || null,
        review_text: reviewText || null,
        beverage_brand: beverageBrand || null,
        food_brand: foodBrand || null,
        rating,
      })

      // Create abort controller for 15 second timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const response = await fetch('/api/pairings', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const result = await response.json()

      if (!response.ok) {
        console.error('Pairing submission failed:', result)
        setError(result.error || 'Failed to create pairing')
        setHasError(true)
        setIsSubmitting(false)
        return
      }

      console.log('Pairing created successfully:', result)
      setOpen(false)
      resetForm()
      // Force full browser reload to guarantee fresh feed data
      setTimeout(() => window.location.reload(), 500)
    } catch (err) {
      console.error('Pairing submission error:', err)
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.')
      } else {
        setError('Something went wrong. Please try again.')
      }
      setHasError(true)
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Pairing
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a Pairing</DialogTitle>
          <DialogDescription>
            Share your food and beverage pairing with the community
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Photo</Label>
            <ImagePicker onImageSelect={handleImageSelect} error={imageError || undefined} />
            {isAnalyzing && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <svg className="animate-spin h-5 w-5 text-amber-600" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    The Chef is thinking...
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Analyzing flavors and finding the perfect pairing
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="food-name">Food Name</Label>
            <Input
              id="food-name"
              placeholder="What are you pairing? (e.g., Grilled Salmon)"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              disabled={isAnalyzing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="beverage-select">Beverage Type</Label>
            <Select value={beverageTag} onValueChange={setBeverageTag} disabled={isAnalyzing}>
              <SelectTrigger id="beverage-select">
                <SelectValue placeholder="Select a beverage type" />
              </SelectTrigger>
              <SelectContent>
                {BEVERAGE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="flavor-select">Flavor Principle (optional)</Label>
            <Select value={flavorPrinciple} onValueChange={setFlavorPrinciple} disabled={isAnalyzing}>
              <SelectTrigger id="flavor-select">
                <SelectValue placeholder="Select a flavor principle" />
              </SelectTrigger>
              <SelectContent>
                {FLAVOR_PRINCIPLES.map((principle) => (
                  <SelectItem key={principle.value} value={principle.value}>
                    {principle.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={rating === 'up' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setRating('up')}
              >
                <svg
                  className="w-5 h-5"
                  fill={rating === 'up' ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
                Thumbs Up
              </Button>
              <Button
                type="button"
                variant={rating === 'down' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setRating('down')}
              >
                <svg
                  className="w-5 h-5 rotate-180"
                  fill={rating === 'down' ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
                Thumbs Down
              </Button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || isAnalyzing}
            variant={hasError ? 'destructive' : 'default'}
          >
            {isSubmitting ? 'Posting...' : hasError ? 'Error - Try Again' : 'Post Pairing'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
