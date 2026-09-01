import { motion } from 'framer-motion'

type Direction = 'up' | 'down' | 'left' | 'right'

type ScribbleNoteProps = {
  text: string
  /** absolute-position utilities for the wrapper (may include translate) */
  className?: string
  /** base tilt in degrees */
  rotate?: number
  /** which way the arrow points, toward the target */
  direction?: Direction
  /** flex gap utility between the text and the arrow */
  gap?: string
  reduceMotion?: boolean | null
}

/** degrees to rotate the base (downward) arrow so its head points `direction` */
const ARROW_ROTATE: Record<Direction, number> = { down: 0, up: 180, left: 90, right: -90 }
/** flex layout so the arrow sits on the target-facing side of the text */
const LAYOUT: Record<Direction, string> = {
  down: 'flex-col',
  up: 'flex-col-reverse',
  right: 'flex-row',
  left: 'flex-row-reverse',
}

function Arrow({ rotate }: { rotate: number }) {
  return (
    <svg
      viewBox="0 0 40 52"
      fill="none"
      aria-hidden="true"
      /* opacity on the <svg> flattens the group, so the two strokes don't darken where they meet */
      className="h-10 w-8 shrink-0 text-ink opacity-30"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path
        d="M20 4C10 15 30 26 20 42M12 34L20 45L28 34"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** GenZ hand-drawn callout: a bold pink line plus a scribbled arrow aimed at a nearby CTA. Desktop only —
 *  the mobile hero uses `HeroBubbles` instead so the callouts never overlap in a stacked layout. */
export default function ScribbleNote({
  text,
  className,
  rotate = 0,
  direction = 'down',
  gap = 'gap-0.5',
  reduceMotion,
}: ScribbleNoteProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-10 hidden select-none sm:block ${className ?? ''}`}
    >
      <motion.div
        className={`flex items-center ${gap} ${LAYOUT[direction]}`}
        style={{ rotate }}
        animate={reduceMotion ? undefined : { rotate: [rotate - 1.5, rotate + 1.5, rotate - 1.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="whitespace-nowrap font-grotesk text-lg font-extrabold lowercase text-bubblegum-dark drop-shadow-[2px_2px_0_rgba(10,10,10,0.18)]">
          {text}
        </span>
        <Arrow rotate={ARROW_ROTATE[direction]} />
      </motion.div>
    </div>
  )
}
