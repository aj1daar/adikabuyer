import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'

const FADE = '28px'

/**
 * Scrollbars are hidden site-wide, so a sideways strip (sizes, colours, thumbnails) gives
 * no sign that it continues. This fades whichever edge still has content past it — right
 * at the start, both in the middle, left at the end — and nothing when everything fits.
 */
export default function useScrollFade<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [edges, setEdges] = useState({ left: false, right: false })

  const measure = useCallback(() => {
    const element = ref.current
    if (!element) {
      return
    }
    const left = element.scrollLeft > 1
    const right = element.scrollLeft + element.clientWidth < element.scrollWidth - 1
    setEdges((current) => (current.left === left && current.right === right ? current : { left, right }))
  }, [])

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }
    measure()
    element.addEventListener('scroll', measure, { passive: true })
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    observer?.observe(element)
    return () => {
      element.removeEventListener('scroll', measure)
      observer?.disconnect()
    }
  }, [measure])

  let style: CSSProperties | undefined
  if (edges.left || edges.right) {
    const mask = `linear-gradient(to right, ${edges.left ? 'transparent' : 'black'}, black ${FADE}, black calc(100% - ${FADE}), ${edges.right ? 'transparent' : 'black'})`
    style = { maskImage: mask, WebkitMaskImage: mask }
  }

  return { ref, style, edges, remeasure: measure }
}
