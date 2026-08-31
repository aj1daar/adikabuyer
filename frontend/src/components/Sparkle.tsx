import { motion } from 'framer-motion'

type SparkleProps = {
  className?: string
  /** slow infinite spin */
  spin?: boolean
  reduceMotion?: boolean | null
}

/** Four-point Neo-Y2K sparkle, optionally spinning. Decorative only. */
export default function Sparkle({ className, spin, reduceMotion }: SparkleProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      animate={spin && !reduceMotion ? { rotate: 360 } : undefined}
      transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
    >
      <path
        d="M12 0c1.1 8 2.9 9.8 12 11-9.1 1.2-10.9 3-12 11-1.1-8-2.9-9.8-12-11 9.1-1.2 10.9-3 12-11Z"
        fill="currentColor"
      />
    </motion.svg>
  )
}
