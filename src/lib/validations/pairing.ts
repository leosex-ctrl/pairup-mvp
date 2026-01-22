import { z } from 'zod'

export const BEVERAGE_TYPES = [
  { value: 'wine', label: 'Wine' },
  { value: 'beer', label: 'Beer' },
  { value: 'spirits', label: 'Spirits' },
  { value: 'cocktails', label: 'Cocktails' },
  { value: 'cider', label: 'Cider' },
  { value: 'na-wine', label: 'Non-Alcoholic Wine' },
  { value: 'na-beer', label: 'Non-Alcoholic Beer' },
  { value: 'na-spirits', label: 'Non-Alcoholic Spirits' },
  { value: 'mocktails', label: 'Mocktails' },
] as const

export const FLAVOR_PRINCIPLES = [
  { value: 'Acid + Umami', label: 'Acid + Umami' },
  { value: 'Sweet + Spicy', label: 'Sweet + Spicy' },
  { value: 'Fat + Tannin', label: 'Fat + Tannin' },
  { value: 'Bitter + Sweet', label: 'Bitter + Sweet' },
  { value: 'Effervescence + Fried', label: 'Effervescence + Fried' },
  { value: 'Complement', label: 'Complement' },
  { value: 'Contrast', label: 'Contrast' },
] as const

export type BeverageType = typeof BEVERAGE_TYPES[number]['value']
export type FlavorPrinciple = typeof FLAVOR_PRINCIPLES[number]['value']

export const pairingSchema = z.object({
  beverage_tag: z.string().min(1, 'Please select a beverage type'),
  flavor_principle: z.string().optional(),
  rating: z.enum(['up', 'down'], { required_error: 'Please select a rating' }),
})

export type PairingInput = z.infer<typeof pairingSchema>
