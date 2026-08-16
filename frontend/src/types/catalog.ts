export type VariantStatus = 'IN_STOCK' | 'PRE_ORDER'

export type VariantDto = {
  id: number
  productId: number
  sku: string
  attributes: Record<string, unknown>
  priceOverride: number | null
  stockQuantity: number
  active: boolean
  status: VariantStatus
}

export type ProductDto = {
  id: number
  name: string
  description: string | null
  category: string | null
  basePrice: number
  active: boolean
  imageUrl: string | null
  variants: VariantDto[]
}
