import { motion, useReducedMotion } from 'framer-motion'

export type HeroBubble = { text: string; tone?: 'white' | 'pink'; rotate?: number }

type HeroBubblesProps = {
  bubbles: HeroBubble[]
  className?: string
}

/**
 * Mobile-only stand-in for the hero's `ScribbleNote` arrows: bubbles that bloom
 * in, laid out in normal flow so a stacked layout can never make them overlap.
 * Mirrors the About page's info-cloud look.
 */
export default function HeroBubbles({ bubbles, className }: HeroBubblesProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div aria-hidden="true" className={`flex flex-wrap justify-center gap-2 sm:hidden ${className ?? ''}`}>
      {bubbles.map((bubble, index) => (
        <motion.span
          key={bubble.text}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: 8 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          transition={
            reduceMotion
              ? { delay: 0.4 + index * 0.1, duration: 0.2 }
              : { delay: 0.5 + index * 0.13, type: 'spring', stiffness: 420, damping: 13 }
          }
          style={{ rotate: bubble.rotate ?? 0 }}
          className={`whitespace-nowrap rounded-full border-2 border-black px-3 py-1 font-grotesk text-xs font-bold lowercase shadow-[2px_2px_0_0_#000] ${
            bubble.tone === 'pink' ? 'bg-bubblegum-light text-ink' : 'bg-white text-bubblegum-dark'
          }`}
        >
          {bubble.text}
        </motion.span>
      ))}
    </div>
  )
}
