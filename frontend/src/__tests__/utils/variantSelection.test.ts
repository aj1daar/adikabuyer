import { describe, it, expect } from 'vitest'
import type { VariantDto } from '../../types/catalog'
import {
  attributeKeys,
  attributeValues,
  isValueAvailable,
  resolveVariant,
} from '../../utils/variantSelection'

const base: Omit<VariantDto, 'id' | 'sku' | 'attributes' | 'imageUrls'> = {
  productId: 1,
  priceOverride: null,
  displayPrice: 10,
  stockQuantity: 5,
  active: true,
  status: 'IN_STOCK',
}

const variant = (id: number, attributes: Record<string, string>): VariantDto => ({
  ...base,
  id,
  sku: `SKU-${id}`,
  attributes,
  imageUrls: [],
})

const matrix: VariantDto[] = [
  variant(1, { color: 'Чёрный', volume: '591' }),
  variant(2, { color: 'Чёрный', volume: '414' }),
  variant(3, { color: 'Белый', volume: '591' }),
]

describe('variantSelection', () => {
  it('lists attribute keys in first-seen order', () => {
    expect(attributeKeys(matrix)).toEqual(['color', 'volume'])
  })

  it('lists distinct values for a key in first-seen order', () => {
    expect(attributeValues(matrix, 'color')).toEqual(['Чёрный', 'Белый'])
    expect(attributeValues(matrix, 'volume')).toEqual(['591', '414'])
  })

  it('returns the first variant for an empty selection', () => {
    expect(resolveVariant(matrix, {})?.id).toBe(1)
  })

  it('matches an exact combination', () => {
    expect(resolveVariant(matrix, { color: 'Чёрный', volume: '414' }, 'volume')?.id).toBe(2)
  })

  it('honours the just-touched attribute and relaxes the rest', () => {
    // volume 414 kept from before, colour Белый just picked, no Белый/414 exists
    expect(resolveVariant(matrix, { color: 'Белый', volume: '414' }, 'color')?.id).toBe(3)
  })

  it('reports whether a value keeps a real variant reachable', () => {
    expect(isValueAvailable(matrix, { volume: '414' }, 'color', 'Чёрный')).toBe(true)
    expect(isValueAvailable(matrix, { volume: '414' }, 'color', 'Белый')).toBe(false)
  })
})
