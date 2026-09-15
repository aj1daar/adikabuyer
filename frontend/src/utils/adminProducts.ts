import type { ProductDto } from '../types/catalog'

export const VARIANT_STATUS_LABEL: Record<string, string> = {
  IN_STOCK: 'В наличии',
  PRE_ORDER: 'Предзаказ',
  SOLD_OUT: 'Солдаут',
}

/** A product whose every variant is sold out is hidden from the storefront. */
export const isArchived = (product: ProductDto) =>
  product.variants.length > 0 && product.variants.every((variant) => variant.status === 'SOLD_OUT')

export const describeAttributes = (attributes: Record<string, unknown>) =>
  Object.entries(attributes)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ')
