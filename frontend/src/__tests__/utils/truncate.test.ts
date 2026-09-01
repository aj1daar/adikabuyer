import { describe, it, expect } from 'vitest'
import truncate from '../../utils/truncate'

describe('truncate', () => {
  it('leaves text shorter than the limit untouched', () => {
    expect(truncate('Короткое описание', 160)).toBe('Короткое описание')
  })

  it('cuts on a word boundary and appends an ellipsis', () => {
    const text = 'Плотный хлопковый шоппер с принтом на двух сторонах, унисекс модель на каждый день'
    const result = truncate(text, 40)
    expect(result.length).toBeLessThanOrEqual(41)
    expect(result.endsWith('…')).toBe(true)
    expect(result).not.toMatch(/\s…$/)
  })

  it('hard-cuts when there is no nearby space', () => {
    expect(truncate('a'.repeat(200), 10)).toBe(`${'a'.repeat(10)}…`)
  })
})
