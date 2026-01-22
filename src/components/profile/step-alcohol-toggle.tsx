'use client'

import { useFormContext } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { ALCOHOL_TOGGLE_OPTIONS, type ProfileInput, type AlcoholToggle } from '@/lib/validations/profile'

export function StepAlcoholToggle() {
  const { watch, setValue, formState: { errors } } = useFormContext<ProfileInput>()
  const selectedToggle = watch('alcohol_toggle')

  const handleSelect = (value: AlcoholToggle) => {
    setValue('alcohol_toggle', value, { shouldValidate: true })
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Content preferences</h2>
        <p className="text-muted-foreground mt-2">
          What kind of content do you want to see?
        </p>
      </div>

      <div className="space-y-3">
        {ALCOHOL_TOGGLE_OPTIONS.map((option) => {
          const isSelected = selectedToggle === option.value
          return (
            <div
              key={option.value}
              className={`flex items-center justify-center p-4 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handleSelect(option.value)}
            >
              <Label className="cursor-pointer font-medium text-lg">
                {option.label}
              </Label>
            </div>
          )
        })}
      </div>

      {errors.alcohol_toggle && (
        <p className="text-sm text-destructive text-center">
          {errors.alcohol_toggle.message}
        </p>
      )}

      <p className="text-xs text-muted-foreground text-center mt-4">
        You can change this anytime in your settings
      </p>
    </div>
  )
}
