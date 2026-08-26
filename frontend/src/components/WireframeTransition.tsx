import { useEffect, useState, type CSSProperties } from 'react'
import useCardTransitionStore from '../store/useCardTransitionStore'

function toPx(rect: { top: number; left: number; width: number; height: number }): CSSProperties {
  return {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  }
}

function getContentBounds() {
  const header = document.querySelector('header')
  const headerBottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0

  const tabBar = document.querySelector('[data-mobile-tabbar]')
  const tabBarRect = tabBar?.getBoundingClientRect()
  const bottom = tabBarRect && tabBarRect.height > 0 ? tabBarRect.top : window.innerHeight

  return {
    top: headerBottom,
    left: 0,
    width: window.innerWidth,
    height: Math.max(0, bottom - headerBottom),
  }
}

export default function WireframeTransition() {
  const phase = useCardTransitionStore((state) => state.phase)
  const originRect = useCardTransitionStore((state) => state.originRect)
  const clear = useCardTransitionStore((state) => state.clear)
  const [style, setStyle] = useState<CSSProperties | null>(null)

  useEffect(() => {
    if (!phase || !originRect) {
      setStyle(null)
      return
    }

    const contentBounds = getContentBounds()
    const from = phase === 'expand' ? originRect : contentBounds
    const to = phase === 'expand' ? contentBounds : originRect

    setStyle({ ...toPx(from), transition: 'none' })

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setStyle({
          ...toPx(to),
          transition: 'top 160ms linear, left 160ms linear, width 160ms linear, height 160ms linear',
        })
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [phase, originRect])

  if (!phase || !style) {
    return null
  }

  return (
    <div
      aria-hidden="true"
      onTransitionEnd={(event) => {
        if (event.propertyName === 'width') {
          clear()
        }
      }}
      className="pointer-events-none fixed z-[9999] border-2 border-bubblegum shadow-[0_0_0_1px_#000]"
      style={style}
    />
  )
}
