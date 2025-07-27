import { z } from 'zod'

export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required'),
})

export const contactSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
})

export const locationFormSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  address: addressSchema,
  contact: contactSchema.optional(),
  products: z.array(z.string()).min(1, 'At least one product must be selected'),
  salesChannel: z.string().optional(),
  dealOwner: z.string().optional(),
  expirationDate: z.date().optional(),
})

export const locationFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  products: z.array(z.string()).optional(),
  dateRange: z.object({
    start: z.date(),
    end: z.date(),
  }).optional(),
  expirationFilter: z.enum(['all', 'expiring', 'expired']).optional(),
})

export type LocationFormData = z.infer<typeof locationFormSchema>
export type LocationFilters = z.infer<typeof locationFiltersSchema> 