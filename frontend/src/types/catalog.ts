export type VariantDto = {
  id: number
  productId: number
  sku: string
  attributes: Record<string, unknown>
  priceOverride: number | null
  stockQuantity: number
  active: boolean
}

export type ProductDto = {
  id: number
  name: string
  description: string | null
  category: string | null
  basePrice: number
  active: boolean
  variants: VariantDto[]
}
