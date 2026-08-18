import { describe, it, expect } from 'vitest'
import resolveDeliveryFee, { DELIVERY_CITIES } from './deliveryFee'

describe('resolveDeliveryFee', () => {
  it('charges 250 for Bishkek', () => {
    expect(resolveDeliveryFee('Бишкек')).toBe(250)
  })

  it('is case-insensitive and trims whitespace', () => {
    expect(resolveDeliveryFee('  бишкек  ')).toBe(250)
    expect(resolveDeliveryFee('БИШКЕК')).toBe(250)
  })

  it('charges 500 for every other listed city', () => {
    for (const city of DELIVERY_CITIES) {
      if (city === 'Бишкек') continue
      expect(resolveDeliveryFee(city)).toBe(500)
    }
  })

  it('lists exactly the seven agreed cities, Bishkek first', () => {
    expect(DELIVERY_CITIES).toEqual(['Бишкек', 'Ош', 'Талас', 'Баткен', 'Каракол', 'Манас', 'Балыкчы'])
  })
})
