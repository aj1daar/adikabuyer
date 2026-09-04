import type { Transition } from 'framer-motion'

const SPRING: Transition = { type: 'spring', stiffness: 340, damping: 14 }

/** The springy pop the product-page price sticker made popular: scale + a
 *  little lift + fade, with a slight overshoot bounce. `delay` staggers a
 *  cascade of these across a group of elements. */
export function popIn(delay = 0) {
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
  return {
    initial: { opacity: 0, scale: 0.9, y: 16 },
    whileInView: { opacity: 1, scale: 1, y: 0 },
    viewport: { once: true, margin: '0px 0px -80px 0px' },
    transition: { ...SPRING, stiffness: 300, damping: 18, delay },
  }
}
