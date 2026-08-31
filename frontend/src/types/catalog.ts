export type VariantStatus = 'IN_STOCK' | 'PRE_ORDER' | 'SOLD_OUT'

export type VariantDto = {
  id: number
  productId: number
  sku: string
  attributes: Record<string, unknown>
  priceOverride: number | null
  displayPrice: number | null
  stockQuantity: number
  active: boolean
  imageUrls: string[]
  status: VariantStatus
}

export type ProductDto = {
  id: number
  name: string
  description: string | null
  category: string | null
  basePrice: number
  displayPrice: number
  active: boolean
  imageUrl: string | null
  colorSwatches?: Record<string, string>
  variants: VariantDto[]
}

export type ProductPageResponse = {
  items: ProductDto[]
  totalCount: number
  page: number
  pageSize: number
}
