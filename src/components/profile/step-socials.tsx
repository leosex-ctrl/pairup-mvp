'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ProfileInput } from '@/lib/validations/profile'

export function StepSocials() {
  const { register, formState: { errors } } = useFormContext<ProfileInput>()

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Connect your socials</h2>
        <p className="text-muted-foreground mt-2">
          Link your accounts to share your pairings (optional)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instagram_handle">Instagram</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
          <Input
            id="instagram_handle"
            placeholder="instagram_handle"
            className="pl-8"
            {...register('instagram_handle')}
          />
        </div>
        {errors.instagram_handle && (
          <p className="text-sm text-destructive">{errors.instagram_handle.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tiktok_handle">TikTok</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
          <Input
            id="tiktok_handle"
            placeholder="tiktok_handle"
            className="pl-8"
            {...register('tiktok_handle')}
          />
        </div>
        {errors.tiktok_handle && (
          <p className="text-sm text-destructive">{errors.tiktok_handle.message}</p>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        You can add or update these later in your profile settings
      </p>
    </div>
  )
}
