import { describe, it, expect, afterEach } from 'vitest'
import { popIn, popInView, prefersReducedMotion } from '../../utils/motion'

const realMatchMedia = window.matchMedia

function mockReducedMotion(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes('prefers-reduced-motion: reduce'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
}

afterEach(() => {
  window.matchMedia = realMatchMedia
})

describe('motion presets', () => {
  it('pops with an overshooting spring by default', () => {
    mockReducedMotion(false)

    expect(prefersReducedMotion()).toBe(false)
    expect(popIn(0.1)).toMatchObject({ initial: { scale: 0.85 }, transition: { damping: 14, delay: 0.1 } })
  })

  it('still pops under reduced motion, only smaller and without the bounce', () => {
    mockReducedMotion(true)

    expect(prefersReducedMotion()).toBe(true)
    const pop = popIn(0.2)
    expect(pop.initial.scale).toBeGreaterThan(0.85)
    expect(pop.initial.scale).toBeLessThan(1)
    expect(pop.transition).toMatchObject({ type: 'spring', damping: 28, delay: 0.2 })
  })

  it('keeps the scroll-in pop under reduced motion too', () => {
    mockReducedMotion(true)

    const pop = popInView()
    expect(pop.initial.scale).toBeLessThan(1)
    expect(pop.whileInView).toEqual({ opacity: 1, scale: 1, y: 0 })
    expect(pop.transition).toMatchObject({ damping: 28 })
  })
})
