export type VariantPayload = {
  id?: number
  sku: string
  attributes: Record<string, string>
  priceOverride: number
  stockQuantity: number
  active: boolean
  imageUrls: string[]
  status: 'IN_STOCK' | 'PRE_ORDER'
}

export type ProductPayload = {
  id?: number
  name: string
  description: string | null
  category: string | null
  active: boolean
  colorSwatches: Record<string, string>
  variants: VariantPayload[]
}
