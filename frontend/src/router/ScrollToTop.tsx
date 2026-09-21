import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

// scroll position per history entry, so the back button returns to where the shopper was
const positions = new Map<string, number>()
// how long to keep retrying while the page (e.g. the catalog grid) is still loading in
const RESTORE_TIMEOUT_MS = 2000

/**
 * New pages open at the top; going back (or forward) returns to the saved scroll
 * position of that history entry. The catalog grid loads after the route renders, so the
 * restore retries each frame until the page is tall enough, and stops at once if the
 * shopper starts scrolling themselves.
 */
export default function ScrollToTop() {
  const { pathname, key } = useLocation()
  const navigationType = useNavigationType()
  const lastPathname = useRef<string | null>(null)

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  // layout effect: the listener must switch entries before the browser fires the scroll
  // event caused by the next page being shorter, or that clamped value would overwrite
  // the position we want to come back to
  useLayoutEffect(() => {
    const save = () => positions.set(key, window.scrollY)
    window.addEventListener('scroll', save, { passive: true })
    return () => window.removeEventListener('scroll', save)
  }, [key])

  useEffect(() => {
    // only a route change moves the scroll position — a catalog filter only rewrites
    // the query string (with a fresh history key) and must leave the page where it is
    if (lastPathname.current === pathname) {
      return
    }
    lastPathname.current = pathname
    const target = navigationType === 'POP' ? positions.get(key) : undefined
    if (!target) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      return
    }

    let frame = 0
    const startedAt = performance.now()
    const stop = () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchstart', stop)
    }
    const attempt = () => {
      window.scrollTo({ top: target, left: 0, behavior: 'instant' })
      const reached = Math.abs(window.scrollY - target) < 2
      if (reached || performance.now() - startedAt > RESTORE_TIMEOUT_MS) {
        stop()
        return
      }
      frame = requestAnimationFrame(attempt)
    }
    window.addEventListener('wheel', stop, { passive: true })
    window.addEventListener('touchstart', stop, { passive: true })
    // no cleanup: the loop ends itself (target reached, timeout or the shopper scrolls), so a
    // query-string-only update or StrictMode's effect re-run can't cut a restore short
    attempt()
  }, [pathname, key, navigationType])

  return null
}
