import { describe, it, expect } from 'vitest'
import { formatAttributeValue } from './attributeOptions'

describe('formatAttributeValue', () => {
  it('appends мл to the volume attribute', () => {
    expect(formatAttributeValue('volume', 500)).toBe('500 мл')
  })

  it('returns other attribute values as plain strings', () => {
    expect(formatAttributeValue('color', 'Чёрный')).toBe('Чёрный')
    expect(formatAttributeValue('size', 'M')).toBe('M')
  })
})
