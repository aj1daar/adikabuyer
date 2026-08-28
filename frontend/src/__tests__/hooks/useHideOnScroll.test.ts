import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useHideOnScroll from '../../hooks/useHideOnScroll'

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, writable: true, configurable: true })
  window.dispatchEvent(new Event('scroll'))
}

beforeEach(() => {
  Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true })
})

describe('useHideOnScroll', () => {
  it('hides after scrolling down past the reveal zone and shows again on scroll up', () => {
    const { result } = renderHook(() => useHideOnScroll(12, 64))

    expect(result.current).toBe(false)

    act(() => scrollTo(300))
    expect(result.current).toBe(true)

    act(() => scrollTo(250))
    expect(result.current).toBe(false)
  })

  it('always shows near the top of the page', () => {
    const { result } = renderHook(() => useHideOnScroll(12, 64))

    act(() => scrollTo(300))
    expect(result.current).toBe(true)

    act(() => scrollTo(10))
    expect(result.current).toBe(false)
  })

  it('ignores jitter below the threshold', () => {
    const { result } = renderHook(() => useHideOnScroll(12, 64))

    act(() => scrollTo(300))
    expect(result.current).toBe(true)

    act(() => scrollTo(295))
    expect(result.current).toBe(true)
  })
})
