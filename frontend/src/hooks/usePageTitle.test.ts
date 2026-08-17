import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import usePageTitle from './usePageTitle'

describe('usePageTitle', () => {
  it('sets a suffixed title and restores the default on unmount', () => {
    const { unmount } = renderHook(() => usePageTitle('Каталог'))

    expect(document.title).toBe('Каталог — Adika Buyer')

    unmount()
    expect(document.title).toBe('Adika Buyer — вещи под заказ')
  })

  it('uses the default title when none is given', () => {
    renderHook(() => usePageTitle())

    expect(document.title).toBe('Adika Buyer — вещи под заказ')
  })
})
