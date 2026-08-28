import { describe, it, expect } from 'vitest'
import resolveVariantImage, { resolveVariantGallery } from '../../utils/variantImage'
import type { ProductDto, VariantDto } from '../../types/catalog'

const variant = (overrides: Partial<VariantDto>): VariantDto => ({
  id: 1,
  productId: 1,
  sku: 'SKU-1',
  attributes: {},
  priceOverride: null,
  displayPrice: null,
  stockQuantity: 10,
  active: true,
  imageUrls: [],
  status: 'IN_STOCK',
  ...overrides,
})

const product = (variants: VariantDto[], imageUrl: string | null = null): ProductDto => ({
  id: 1,
  name: 'Tumbler',
  description: null,
  category: null,
  basePrice: 25,
  displayPrice: 25,
  active: true,
  imageUrl,
  variants,
})

describe('resolveVariantGallery', () => {
  it('returns the variant own gallery when present', () => {
    const selected = variant({ id: 1, imageUrls: ['a.jpg', 'b.jpg'] })
    expect(resolveVariantGallery(product([selected]), selected)).toEqual(['a.jpg', 'b.jpg'])
  })

  it('falls back to the most similar variant with images', () => {
    const selected = variant({ id: 1, attributes: { color: 'black', size: 'M' } })
    const distant = variant({ id: 2, attributes: { color: 'white', size: 'S' }, imageUrls: ['white.jpg'] })
    const close = variant({ id: 3, attributes: { color: 'black', size: 'S' }, imageUrls: ['black.jpg'] })

    expect(resolveVariantGallery(product([selected, distant, close]), selected)).toEqual(['black.jpg'])
  })

  it('falls back to the product image when no variant has photos', () => {
    const selected = variant({ id: 1 })
    expect(resolveVariantGallery(product([selected], 'product.jpg'), selected)).toEqual(['product.jpg'])
  })

  it('returns empty gallery when nothing has an image', () => {
    const selected = variant({ id: 1 })
    expect(resolveVariantGallery(product([selected]), selected)).toEqual([])
  })

  it('returns the product image when no variant is selected', () => {
    expect(resolveVariantGallery(product([], 'product.jpg'), undefined)).toEqual(['product.jpg'])
  })
})

describe('resolveVariantImage', () => {
  it('returns the first gallery image or null', () => {
    const selected = variant({ id: 1, imageUrls: ['first.jpg', 'second.jpg'] })
    expect(resolveVariantImage(product([selected]), selected)).toBe('first.jpg')
    expect(resolveVariantImage(product([]), undefined)).toBeNull()
  })
})
