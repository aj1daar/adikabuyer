import { describe, it, expect } from 'vitest'
import type { VariantDto } from '../../types/catalog'
import {
  attributeKeys,
  attributeValues,
  isCombinationAvailable,
  selectVariant,
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

  it('keeps the other attributes when the picked value is compatible', () => {
    const current = matrix[0] // Чёрный / 591
    expect(selectVariant(matrix, current, 'volume', '414')?.id).toBe(2)
  })

  it('relaxes the other attributes when no exact variant exists', () => {
    const current = matrix[1] // Чёрный / 414
    // Белый has no 414 -> snap to the closest Белый variant
    expect(selectVariant(matrix, current, 'color', 'Белый')?.id).toBe(3)
  })

  it('returns the current variant when the value matches nothing', () => {
    const current = matrix[0]
    expect(selectVariant(matrix, current, 'color', 'Розовый')?.id).toBe(1)
  })

  it('reports whether a value stays compatible with the current selection', () => {
    const current = matrix[1] // Чёрный / 414
    expect(isCombinationAvailable(matrix, current, 'color', 'Чёрный')).toBe(true)
    expect(isCombinationAvailable(matrix, current, 'color', 'Белый')).toBe(false)
  })
})
