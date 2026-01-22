import { z } from 'zod'

export const BEVERAGE_CATEGORIES = [
  { id: 'wine', label: 'Wine' },
  { id: 'beer', label: 'Beer' },
  { id: 'spirits', label: 'Spirits' },
  { id: 'cocktails', label: 'Cocktails' },
  { id: 'cider', label: 'Cider' },
  { id: 'na-wine', label: 'Non-Alcoholic Wine' },
  { id: 'na-beer', label: 'Non-Alcoholic Beer' },
  { id: 'na-spirits', label: 'Non-Alcoholic Spirits' },
  { id: 'mocktails', label: 'Mocktails' },
] as const

export const ALCOHOL_TOGGLE_OPTIONS = [
  { value: 'Show All', label: 'Show All' },
  { value: 'Non-Alcoholic Only', label: 'Non-Alcoholic Only' },
  { value: 'Alcoholic Only', label: 'Alcoholic Only' },
] as const

export type BeverageCategory = typeof BEVERAGE_CATEGORIES[number]['id']
export type AlcoholToggle = typeof ALCOHOL_TOGGLE_OPTIONS[number]['value']

export const basicInfoSchema = z.object({
  display_name: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be at most 50 characters'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  bio: z.string()
    .max(500, 'Bio must be at most 500 characters')
    .optional()
    .or(z.literal('')),
})

export const palateSchema = z.object({
  beverage_preferences: z.array(z.string()).min(1, 'Select at least one beverage preference'),
})

export const alcoholToggleSchema = z.object({
  alcohol_toggle: z.enum(['Show All', 'Non-Alcoholic Only', 'Alcoholic Only']),
})

export const socialsSchema = z.object({
  instagram_handle: z.string()
    .max(30, 'Instagram handle must be at most 30 characters')
    .regex(/^[a-zA-Z0-9._]*$/, 'Invalid Instagram handle format')
    .optional()
    .or(z.literal('')),
  tiktok_handle: z.string()
    .max(24, 'TikTok handle must be at most 24 characters')
    .regex(/^[a-zA-Z0-9._]*$/, 'Invalid TikTok handle format')
    .optional()
    .or(z.literal('')),
})

export const profileSchema = basicInfoSchema
  .merge(palateSchema)
  .merge(alcoholToggleSchema)
  .merge(socialsSchema)

export type BasicInfoInput = z.infer<typeof basicInfoSchema>
export type PalateInput = z.infer<typeof palateSchema>
export type AlcoholToggleInput = z.infer<typeof alcoholToggleSchema>
export type SocialsInput = z.infer<typeof socialsSchema>
export type ProfileInput = z.infer<typeof profileSchema>
