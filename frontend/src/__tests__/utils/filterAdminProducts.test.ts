import { describe, it, expect } from 'vitest'
import filterAdminProducts from '../../utils/filterAdminProducts'
import type { ProductDto, VariantDto } from '../../types/catalog'

const variant = (overrides: Partial<VariantDto> = {}): VariantDto => ({
  id: 1,
  productId: 1,
  sku: 'TUM-BLK-500',
  attributes: { color: 'Чёрный', size: 'M' },
  priceOverride: null,
  displayPrice: null,
  stockQuantity: 3,
  active: true,
  imageUrls: [],
  status: 'IN_STOCK',
  ...overrides,
})

const product = (overrides: Partial<ProductDto> = {}): ProductDto => ({
  id: 1,
  name: 'Термостакан «Полночь»',
  description: 'Двойная вакуумная стенка',
  category: 'Термостаканы',
  brand: 'Adika',
  basePrice: 1000,
  displayPrice: 1290,
  active: true,
  imageUrl: null,
  labels: ['Limited'],
  variants: [variant()],
  ...overrides,
})

describe('filterAdminProducts', () => {
  const products = [
    product(),
    product({
      id: 2,
      name: 'Худи оверсайз',
      category: 'Одежда',
      brand: 'Nike',
      labels: ['С принтом'],
      variants: [variant({ id: 2, productId: 2, sku: 'HOOD-WHT-L', attributes: { color: 'Белый' } })],
    }),
  ]

  it('returns everything for a blank query', () => {
    expect(filterAdminProducts(products, '')).toEqual(products)
    expect(filterAdminProducts(products, '   ')).toEqual(products)
  })

  it('matches the product name regardless of case', () => {
    expect(filterAdminProducts(products, 'ХУДИ').map((item) => item.id)).toEqual([2])
  })

  it('matches a variant SKU, a colour and a label', () => {
    expect(filterAdminProducts(products, 'HOOD-WHT').map((item) => item.id)).toEqual([2])
    expect(filterAdminProducts(products, 'чёрный').map((item) => item.id)).toEqual([1])
    expect(filterAdminProducts(products, 'limited').map((item) => item.id)).toEqual([1])
  })

  it('matches brand and category', () => {
    expect(filterAdminProducts(products, 'nike').map((item) => item.id)).toEqual([2])
    expect(filterAdminProducts(products, 'термостаканы').map((item) => item.id)).toEqual([1])
  })

  it('requires every word but not their order', () => {
    expect(filterAdminProducts(products, 'белый худи').map((item) => item.id)).toEqual([2])
    expect(filterAdminProducts(products, 'худи чёрный')).toEqual([])
  })

  it('survives a product with no brand, labels or attributes', () => {
    const bare = product({ id: 3, brand: null, labels: undefined, category: null, description: null })
    expect(filterAdminProducts([bare], 'полночь').map((item) => item.id)).toEqual([3])
  })
})
