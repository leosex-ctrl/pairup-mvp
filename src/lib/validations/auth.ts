import { z } from 'zod'

export const dateOfBirthSchema = z.object({
  month: z.string().min(1, 'Month is required'),
  day: z.string().min(1, 'Day is required'),
  year: z.string().min(1, 'Year is required'),
}).refine(
  (data) => {
    const month = parseInt(data.month)
    const day = parseInt(data.day)
    const year = parseInt(data.year)

    if (isNaN(month) || isNaN(day) || isNaN(year)) return false
    if (month < 1 || month > 12) return false
    if (day < 1 || day > 31) return false
    if (year < 1900 || year > new Date().getFullYear()) return false

    const date = new Date(year, month - 1, day)
    return date.getMonth() === month - 1
  },
  { message: 'Please enter a valid date' }
)

export const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  dataConsent: z.boolean().refine(val => val === true, {
    message: 'You must agree to the data consent to create an account',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type DateOfBirthInput = z.infer<typeof dateOfBirthSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
