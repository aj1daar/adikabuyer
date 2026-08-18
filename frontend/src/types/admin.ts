export type VariantPayload = {
  id?: number
  sku: string
  attributes: Record<string, string>
  priceOverride: number | null
  stockQuantity: number
  active: boolean
  imageUrls: string[]
}

export type ProductPayload = {
  id?: number
  name: string
  description: string | null
  category: string | null
  basePrice: number
  active: boolean
  imageUrl: string | null
  variants: VariantPayload[]
}
