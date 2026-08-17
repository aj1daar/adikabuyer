import { describe, it, expect } from 'vitest'
import resolveVariantImage from './variantImage'
import type { ProductDto, VariantDto } from '../types/catalog'

const variant = (overrides: Partial<VariantDto>): VariantDto => ({
  id: 1,
  productId: 1,
  sku: 'SKU-1',
  attributes: {},
  priceOverride: null,
  stockQuantity: 10,
  active: true,
  imageUrl: null,
  status: 'IN_STOCK',
  ...overrides,
})

const product = (variants: VariantDto[], imageUrl: string | null = null): ProductDto => ({
  id: 1,
  name: 'Tumbler',
  description: null,
  category: null,
  basePrice: 25,
  active: true,
  imageUrl,
  variants,
})

describe('resolveVariantImage', () => {
  it('returns the variant own image when present', () => {
    const selected = variant({ id: 1, imageUrl: 'own.jpg' })
    expect(resolveVariantImage(product([selected]), selected)).toBe('own.jpg')
  })

  it('falls back to the most similar variant with an image', () => {
    const selected = variant({ id: 1, attributes: { color: 'black', size: 'M' } })
    const distant = variant({ id: 2, attributes: { color: 'white', size: 'S' }, imageUrl: 'white.jpg' })
    const close = variant({ id: 3, attributes: { color: 'black', size: 'S' }, imageUrl: 'black.jpg' })

    expect(resolveVariantImage(product([selected, distant, close]), selected)).toBe('black.jpg')
  })

  it('falls back to the product image when no variant has one', () => {
    const selected = variant({ id: 1 })
    expect(resolveVariantImage(product([selected], 'product.jpg'), selected)).toBe('product.jpg')
  })

  it('returns the product image when no variant is selected', () => {
    expect(resolveVariantImage(product([], 'product.jpg'), undefined)).toBe('product.jpg')
  })
})
