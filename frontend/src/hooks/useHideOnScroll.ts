import { useEffect, useState } from 'react'

export default function useHideOnScroll(threshold = 4, revealBelow = 64) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let lastY = window.scrollY

    const onScroll = () => {
      const y = window.scrollY
      if (y <= revealBelow) {
        setHidden(false)
        lastY = Math.max(0, y)
        return
      }
      const diff = y - lastY
      if (diff > threshold) {
        setHidden(true)
        lastY = y
      } else if (diff < -threshold) {
        setHidden(false)
        lastY = y
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold, revealBelow])

  return hidden
}
