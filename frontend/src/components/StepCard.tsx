import { motion } from 'framer-motion'

export type StepCloud = {
  text: string
  /** absolute-position utilities, kept to the left of the card so it never leaves the viewport */
  className: string
}

type StepCardProps = {
  index: number
  title: string
  description: string
  clouds: StepCloud[]
  reduceMotion?: boolean | null
  /** stagger this card's pop-in entrance behind the others */
  entranceDelay?: number
}

const hoverSpring = { type: 'spring' as const, stiffness: 320, damping: 22 }

/** Numbered "how to order" card that blooms bubblegum with a few info clouds on hover. */
export default function StepCard({
  index,
  title,
  description,
  clouds,
  reduceMotion,
  entranceDelay = 0,
}: StepCardProps) {
  return (
    <motion.li
      className="group relative flex items-start gap-3 rounded-2xl border-2 border-black bg-white p-4 shadow-[4px_4px_0_0_#E8799F] transition-colors duration-200 hover:bg-bubblegum-light hover:shadow-[6px_6px_0_0_#000]"
      initial={{ opacity: 0, scale: 0.85, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ ...(reduceMotion ? { scale: 1.01 } : { y: -4, scale: 1.02 }), transition: hoverSpring }}
      transition={{ type: 'spring', stiffness: 340, damping: 14, delay: entranceDelay }}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink font-grotesk text-sm font-bold text-white transition-transform duration-200 group-hover:scale-110 group-hover:bg-bubblegum-dark">
        {index}
      </span>
      <div>
        <h3 className="font-grotesk text-base font-bold text-ink">{title}</h3>
        <p className="text-sm text-ink/60">{description}</p>
      </div>

      {clouds.map((cloud, cloudIndex) => (
        <span
          key={cloud.text}
          aria-hidden="true"
          className={`pointer-events-none absolute z-10 hidden translate-x-3 whitespace-nowrap rounded-full border-2 border-black bg-white px-2.5 py-1 font-grotesk text-[11px] font-bold text-ink opacity-0 shadow-[2px_2px_0_0_#000] transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 sm:block ${cloud.className}`}
          style={{ transitionDelay: `${cloudIndex * 60}ms` }}
        >
          {cloud.text}
        </span>
      ))}
    </motion.li>
  )
}
