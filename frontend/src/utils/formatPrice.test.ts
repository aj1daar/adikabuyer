import { describe, it, expect } from 'vitest'
import formatPrice from './formatPrice'

describe('formatPrice', () => {
  it('renders two decimals with the KGS code', () => {
    expect(formatPrice(25)).toBe('25.00 KGS')
    expect(formatPrice(2200.5)).toBe('2200.50 KGS')
  })

  it('handles zero', () => {
    expect(formatPrice(0)).toBe('0.00 KGS')
  })
})
