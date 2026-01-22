'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ProfileInput } from '@/lib/validations/profile'

export function StepBasicInfo() {
  const { register, formState: { errors } } = useFormContext<ProfileInput>()

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Let&apos;s get to know you</h2>
        <p className="text-muted-foreground mt-2">
          Tell us a bit about yourself
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="display_name">Display Name</Label>
        <Input
          id="display_name"
          placeholder="Your name"
          {...register('display_name')}
        />
        {errors.display_name && (
          <p className="text-sm text-destructive">{errors.display_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
          <Input
            id="username"
            placeholder="username"
            className="pl-8"
            {...register('username')}
          />
        </div>
        {errors.username && (
          <p className="text-sm text-destructive">{errors.username.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio (optional)</Label>
        <Textarea
          id="bio"
          placeholder="Tell us about your taste journey..."
          className="min-h-[100px] resize-none"
          maxLength={500}
          {...register('bio')}
        />
        <p className="text-xs text-muted-foreground text-right">
          Max 500 characters
        </p>
        {errors.bio && (
          <p className="text-sm text-destructive">{errors.bio.message}</p>
        )}
      </div>
    </div>
  )
}
