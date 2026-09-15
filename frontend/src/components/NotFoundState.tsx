import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { popIn } from '../utils/motion'

type NotFoundStateProps = {
  /** first heading line, set in ink */
  title?: string
  /** second heading line, set in bubblegum */
  accent?: string
  message?: string
}

/**
 * Neo-Y2K "nothing here" block shared by unknown routes and missing products: sticker tag,
 * display heading with a bubblegum accent, and the same pill CTAs as the hero.
 */
export default function NotFoundState({
  title = 'тут',
  accent = 'пусто',
  message = 'Такой страницы нет — возможно, ссылка устарела. Загляните в каталог или вернитесь на главную.',
}: NotFoundStateProps) {
  return (
    <section className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-5 py-16 text-center sm:py-24">
      <motion.span
        {...popIn(0)}
        className="rotate-[-4deg] rounded-pill border-2 border-black bg-gradient-to-r from-bubblegum to-bubblegum-light px-5 py-1.5 font-grotesk text-sm font-bold uppercase tracking-wider text-ink shadow-[3px_3px_0_0_#000]"
      >
        404
      </motion.span>

      <motion.h1
        {...popIn(0.06)}
        className="font-grotesk text-display font-semibold leading-[0.95] tracking-[-0.03em] text-ink sm:text-[clamp(3rem,6.5vw,5rem)]"
      >
        {title}
        <br />
        <span className="text-bubblegum">{accent}</span>
      </motion.h1>

      <motion.p {...popIn(0.12)} className="max-w-md text-lg text-ink/70">
        {message}
      </motion.p>

      <motion.div {...popIn(0.18)} className="flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/catalog"
          className="flex min-h-11 items-center rounded-pill border-2 border-black bg-ink px-8 py-3 font-grotesk text-sm font-bold text-white shadow-[4px_4px_0_0_#E8799F] transition-[background-color,box-shadow] hover:bg-bubblegum-dark hover:shadow-[6px_6px_0_0_#E8799F]"
        >
          В каталог
        </Link>
        <Link
          to="/"
          className="flex min-h-11 items-center rounded-pill border-2 border-black bg-white px-8 py-3 font-grotesk text-sm font-bold text-ink transition-[background-color,color] hover:bg-bubblegum hover:text-white"
        >
          На главную
        </Link>
      </motion.div>
    </section>
  )
}
