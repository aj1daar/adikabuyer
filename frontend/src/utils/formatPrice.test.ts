import { describe, it, expect } from 'vitest'
import formatPrice from './formatPrice'

const NBSP = ' '

describe('formatPrice', () => {
  it('groups thousands with a non-breaking space', () => {
    expect(formatPrice(2200)).toBe(`2${NBSP}200${NBSP}KGS`)
    expect(formatPrice(1234567)).toBe(`1${NBSP}234${NBSP}567${NBSP}KGS`)
  })

  it('leaves values below a thousand ungrouped', () => {
    expect(formatPrice(25)).toBe(`25${NBSP}KGS`)
    expect(formatPrice(999)).toBe(`999${NBSP}KGS`)
  })

  it('rounds away the kopecks', () => {
    expect(formatPrice(2200.4)).toBe(`2${NBSP}200${NBSP}KGS`)
    expect(formatPrice(2200.5)).toBe(`2${NBSP}201${NBSP}KGS`)
  })

  it('handles zero', () => {
    expect(formatPrice(0)).toBe(`0${NBSP}KGS`)
  })
})
