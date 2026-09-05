import { describe, it, expect } from 'vitest'
import resolveDeliveryFee, { COURIER, DELIVERY_OPTIONS, PICKUP } from '../../utils/deliveryFee'

describe('resolveDeliveryFee', () => {
  it('charges 300 for a courier inside Bishkek', () => {
    expect(resolveDeliveryFee(COURIER)).toBe(300)
  })

  it('charges nothing for pickup', () => {
    expect(resolveDeliveryFee(PICKUP)).toBe(0)
  })

  it('matches pickup case-insensitively and trims whitespace', () => {
    expect(resolveDeliveryFee('  самовывоз  ')).toBe(0)
    expect(resolveDeliveryFee('САМОВЫВОЗ')).toBe(0)
  })

  it('falls back to the courier fee for anything unrecognised, never to free', () => {
    expect(resolveDeliveryFee('Ош')).toBe(300)
    expect(resolveDeliveryFee('')).toBe(300)
  })

  it('offers exactly the two ways to get an order, courier first', () => {
    expect(DELIVERY_OPTIONS.map((option) => option.value)).toEqual([COURIER, PICKUP])
  })
})
