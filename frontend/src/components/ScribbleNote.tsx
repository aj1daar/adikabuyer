import { motion } from 'framer-motion'

type ScribbleNoteProps = {
  text: string
  /** absolute-position utilities for the wrapper (may include translate) */
  className?: string
  /** base tilt in degrees */
  rotate?: number
  /** does the arrow sit under the text pointing down, or over it pointing up */
  direction?: 'down' | 'up'
  /** extra arrow utilities (size, -scale-x-100 to mirror) */
  arrowClassName?: string
  reduceMotion?: boolean | null
}

function ScribbleArrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 52" fill="none" aria-hidden="true" className={className}>
      <path d="M3 8C22 2 46 5 54 33" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M40 27L55 35L45 47"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** GenZ-style hand-drawn callout: a bold pink line plus a scribbled arrow, wiggling. Desktop only. */
export default function ScribbleNote({
  text,
  className,
  rotate = 0,
  direction = 'down',
  arrowClassName,
  reduceMotion,
}: ScribbleNoteProps) {
  const arrow = (
    <ScribbleArrow
      className={`text-ink ${direction === 'up' ? '-scale-y-100' : ''} ${arrowClassName ?? 'h-9 w-12'}`}
    />
  )

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute z-10 hidden select-none sm:block ${className ?? ''}`}>
      <motion.div
        className="flex flex-col items-center gap-1"
        style={{ rotate }}
        animate={reduceMotion ? undefined : { rotate: [rotate - 2.5, rotate + 2.5, rotate - 2.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {direction === 'up' && arrow}
        <span className="whitespace-nowrap font-grotesk text-lg font-extrabold lowercase text-bubblegum-dark drop-shadow-[2px_2px_0_rgba(10,10,10,0.18)]">
          {text}
        </span>
        {direction === 'down' && arrow}
      </motion.div>
    </div>
  )
}
