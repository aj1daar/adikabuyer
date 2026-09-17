import type { Transition } from 'framer-motion'

const SPRING: Transition = { type: 'spring', stiffness: 340, damping: 14 }
/** Critically damped: the pop still grows in, but settles without the overshoot bounce. */
const GENTLE_SPRING: Transition = { type: 'spring', stiffness: 260, damping: 28 }

/** True when the OS asks for less motion (iOS Reduce Motion, Android Remove animations). */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** The springy pop the product-page price sticker made popular: scale + a
 *  little lift + fade, with a slight overshoot bounce. `delay` staggers a
 *  cascade of these across a group of elements. Under reduced motion the pop
 *  stays, just smaller and without the bounce, so pages still feel alive. */
export function popIn(delay = 0) {
  if (prefersReducedMotion()) {
    return {
      initial: { opacity: 0, scale: 0.94, y: 4 },
      animate: { opacity: 1, scale: 1, y: 0 },
      transition: { ...GENTLE_SPRING, delay },
    }
  }
  return {
    initial: { opacity: 0, scale: 0.85, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { ...SPRING, delay },
  }
}

/** Same pop, but plays once as the element scrolls into view instead of on
 *  mount — for long lists (catalog grid) where popping everything in at once
 *  on page load would be a lot on a small screen. */
export function popInView(delay = 0) {
  const reduced = prefersReducedMotion()
  return {
    initial: reduced ? { opacity: 0, scale: 0.95, y: 6 } : { opacity: 0, scale: 0.9, y: 16 },
    whileInView: { opacity: 1, scale: 1, y: 0 },
    viewport: { once: true, margin: '0px 0px -80px 0px' },
    transition: reduced ? { ...GENTLE_SPRING, delay } : { ...SPRING, stiffness: 300, damping: 18, delay },
  }
}
