'use client'

import { useFormContext } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { BEVERAGE_CATEGORIES, type ProfileInput } from '@/lib/validations/profile'

export function StepPalate() {
  const { watch, setValue, formState: { errors } } = useFormContext<ProfileInput>()
  const selectedPreferences = watch('beverage_preferences') || []

  const togglePreference = (id: string) => {
    const current = selectedPreferences
    if (current.includes(id)) {
      setValue('beverage_preferences', current.filter((p) => p !== id), { shouldValidate: true })
    } else {
      setValue('beverage_preferences', [...current, id], { shouldValidate: true })
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">What&apos;s your palate?</h2>
        <p className="text-muted-foreground mt-2">
          Select the beverages you&apos;re interested in
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {BEVERAGE_CATEGORIES.map((category) => {
          const isSelected = selectedPreferences.includes(category.id)
          return (
            <label
              key={category.id}
              htmlFor={category.id}
              className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Checkbox
                id={category.id}
                checked={isSelected}
                onCheckedChange={() => togglePreference(category.id)}
              />
              <span className="flex-1 font-medium">
                {category.label}
              </span>
            </label>
          )
        })}
      </div>

      {errors.beverage_preferences && (
        <p className="text-sm text-destructive text-center">
          {errors.beverage_preferences.message}
        </p>
      )}
    </div>
  )
}
