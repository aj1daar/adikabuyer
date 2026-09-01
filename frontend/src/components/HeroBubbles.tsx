import { Fragment } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export type HeroBubble = {
  text: string
  tone?: 'white' | 'pink'
  rotate?: number
  /** absolute-position utilities, used only in `overlay` mode */
  className?: string
}

type HeroBubblesProps = {
  bubbles: HeroBubble[]
  className?: string
  /** stick each bubble onto its target (needs a positioned ancestor) instead of a flow row */
  overlay?: boolean
}

const chipClass = (bubble: HeroBubble) =>
  `whitespace-nowrap rounded-full border-2 border-black px-2.5 py-0.5 font-grotesk text-[11px] font-bold lowercase shadow-[2px_2px_0_0_#000] ${
    bubble.tone === 'pink' ? 'bg-bubblegum-light text-ink' : 'bg-white text-bubblegum-dark'
  }`

/**
 * Mobile-only stand-in for the hero's `ScribbleNote` arrows: bubbles that bloom
 * in, either as a flow row or (overlay) stuck onto their target button/icon so
 * a stacked layout can never make them overlap. Mirrors the About info-cloud look.
 */
export default function HeroBubbles({ bubbles, className, overlay }: HeroBubblesProps) {
  const reduceMotion = useReducedMotion()

  const anim = (index: number) => ({
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: 6 },
    animate: reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 },
    transition: reduceMotion
      ? { delay: 0.4 + index * 0.1, duration: 0.2 }
      : ({ delay: 0.5 + index * 0.13, type: 'spring', stiffness: 420, damping: 13 } as const),
  })

  if (overlay) {
    return (
      <>
        {bubbles.map((bubble, index) => (
          <motion.span
            key={`${bubble.text}-${index}`}
            aria-hidden="true"
            {...anim(index)}
            style={{ rotate: bubble.rotate ?? 0 }}
            className={`pointer-events-none absolute z-20 sm:hidden ${chipClass(bubble)} ${bubble.className ?? ''}`}
          >
            {bubble.text}
          </motion.span>
        ))}
      </>
    )
  }

  return (
    <div aria-hidden="true" className={`flex flex-wrap justify-center gap-2 sm:hidden ${className ?? ''}`}>
      {bubbles.map((bubble, index) => (
        <Fragment key={`${bubble.text}-${index}`}>
          <motion.span {...anim(index)} style={{ rotate: bubble.rotate ?? 0 }} className={chipClass(bubble)}>
            {bubble.text}
          </motion.span>
        </Fragment>
      ))}
    </div>
  )
}
