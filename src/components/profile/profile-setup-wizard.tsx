'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StepBasicInfo } from './step-basic-info'
import { StepPalate } from './step-palate'
import { StepAlcoholToggle } from './step-alcohol-toggle'
import { StepSocials } from './step-socials'
import { profileSchema, type ProfileInput } from '@/lib/validations/profile'

const STEPS: Array<{
  id: number
  title: string
  fields: (keyof ProfileInput)[]
}> = [
  { id: 1, title: 'Basic Info', fields: ['display_name', 'username', 'bio'] },
  { id: 2, title: 'Palate', fields: ['beverage_preferences'] },
  { id: 3, title: 'Preferences', fields: ['alcohol_toggle'] },
  { id: 4, title: 'Socials', fields: ['instagram_handle', 'tiktok_handle'] },
]

export function ProfileSetupWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const methods = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: '',
      username: '',
      bio: '',
      beverage_preferences: [],
      alcohol_toggle: 'Show All',
      instagram_handle: '',
      tiktok_handle: '',
    },
    mode: 'onChange',
  })

  const { trigger, handleSubmit, formState: { errors } } = methods

  const currentStepConfig = STEPS[currentStep - 1]

  const validateCurrentStep = async () => {
    const fields = currentStepConfig.fields as (keyof ProfileInput)[]
    const isValid = await trigger(fields)
    return isValid
  }

  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const onSubmit = async (data: ProfileInput) => {
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to save profile')
        return
      }

      router.push('/feed')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepBasicInfo />
      case 2:
        return <StepPalate />
      case 3:
        return <StepAlcoholToggle />
      case 4:
        return <StepSocials />
      default:
        return null
    }
  }

  return (
    <FormProvider {...methods}>
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`h-2 w-12 rounded-full transition-colors ${
                  step.id <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {renderStep()}

            {error && (
              <p className="text-sm text-destructive text-center mt-4">{error}</p>
            )}

            <div className="flex gap-3 mt-8">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
              )}

              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleNext}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating profile...' : 'Complete Setup'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  )
}
