import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useIsMobileViewport from './useIsMobileViewport'

type Listener = () => void

function mockMatchMedia(initialMatches: boolean) {
  let matches = initialMatches
  const listeners = new Set<Listener>()

  const mql = {
    get matches() {
      return matches
    },
    media: '(max-width: 639px)',
    addEventListener: (_event: string, listener: Listener) => listeners.add(listener),
    removeEventListener: (_event: string, listener: Listener) => listeners.delete(listener),
  }

  window.matchMedia = vi.fn().mockReturnValue(mql)

  return {
    setMatches(next: boolean) {
      matches = next
      listeners.forEach((listener) => listener())
    },
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useIsMobileViewport', () => {
  it('reflects the initial media query match', () => {
    mockMatchMedia(true)

    const { result } = renderHook(() => useIsMobileViewport())

    expect(result.current).toBe(true)
  })

  it('updates when the media query match changes', () => {
    const { setMatches } = mockMatchMedia(false)

    const { result } = renderHook(() => useIsMobileViewport())
    expect(result.current).toBe(false)

    act(() => setMatches(true))

    expect(result.current).toBe(true)
  })
})
