import { describe, it, expect } from 'vitest'
import previewDisplayPrice from '../../utils/priceCommission'

describe('previewDisplayPrice', () => {
  it('adds 15% and rounds to the nearest hundred', () => {
    expect(previewDisplayPrice(2000)).toBe(2300)
  })

  it('rounds down below the midpoint', () => {
    expect(previewDisplayPrice(1500)).toBe(1700)
  })

  it('rounds up on an exact midpoint', () => {
    expect(previewDisplayPrice(1000)).toBe(1200)
  })

  it('returns zero for amounts too small to clear the first hundred', () => {
    expect(previewDisplayPrice(25)).toBe(0)
  })
})
