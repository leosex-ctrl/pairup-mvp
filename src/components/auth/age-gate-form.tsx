'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { dateOfBirthSchema, type DateOfBirthInput } from '@/lib/validations/auth'
import { isAdult } from '@/lib/utils'

export function AgeGateForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DateOfBirthInput>({
    resolver: zodResolver(dateOfBirthSchema),
  })

  const onSubmit = async (data: DateOfBirthInput) => {
    setError(null)

    const month = parseInt(data.month)
    const day = parseInt(data.day)
    const year = parseInt(data.year)
    const dateOfBirth = new Date(year, month - 1, day)

    if (!isAdult(dateOfBirth)) {
      // Set cookie indicating user is underage (for middleware)
      document.cookie = 'age_verified=false; path=/; max-age=86400'
      router.push('/blocked')
      return
    }

    // Set age verification cookie (30 days)
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 30)
    document.cookie = `age_verified=true; path=/; expires=${expiryDate.toUTCString()}`

    // Store DOB in localStorage for use during signup
    localStorage.setItem('pairup_dob', dateOfBirth.toISOString())

    router.push('/login')
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome to PairUp</CardTitle>
        <CardDescription>
          Please enter your date of birth to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Input
                id="month"
                placeholder="MM"
                maxLength={2}
                {...register('month')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="day">Day</Label>
              <Input
                id="day"
                placeholder="DD"
                maxLength={2}
                {...register('day')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                placeholder="YYYY"
                maxLength={4}
                {...register('year')}
              />
            </div>
          </div>

          {(errors.month || errors.day || errors.year) && (
            <p className="text-sm text-destructive">
              {errors.month?.message || errors.day?.message || errors.year?.message}
            </p>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying...' : 'Continue'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
