import type { VariantStatus } from './catalog'

export type VariantPayload = {
  id?: number
  sku: string
  attributes: Record<string, string>
  priceOverride: number
  stockQuantity: number
  active: boolean
  imageUrls: string[]
  status: VariantStatus
}

export type ProductPayload = {
  id?: number
  name: string
  description: string | null
  category: string | null
  brand: string | null
  active: boolean
  colorSwatches: Record<string, string>
  labels: string[]
  variants: VariantPayload[]
}
