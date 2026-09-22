import { useEffect, type ReactNode } from 'react'
import useScrollFade from '../hooks/useScrollFade'

type ScrollFadeRowProps = {
  className?: string
  children: ReactNode
}

/** A sideways-scrolling row whose edges fade while more content hides past them. */
export default function ScrollFadeRow({ className, children }: ScrollFadeRowProps) {
  const { ref, style, edges, remeasure } = useScrollFade<HTMLDivElement>()
  // new children ("+N" expanded, a different colour picked) can change the width to scroll
  useEffect(() => {
    remeasure()
  })
  return (
    <div
      ref={ref}
      style={style}
      data-fade={edges.left && edges.right ? 'both' : edges.left ? 'left' : edges.right ? 'right' : undefined}
      className={className}
    >
      {children}
    </div>
  )
}
