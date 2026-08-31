import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import ScribbleNote from './ScribbleNote'

export default function HeroSection() {
  const reduceMotion = useReducedMotion()

  return (
    <section className="relative flex items-center overflow-hidden py-16 sm:h-[calc(100dvh-10rem)] sm:py-0">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:gap-10 sm:text-left"
      >
        <div className="flex flex-col items-center gap-5 sm:items-start">
          <span className="rounded-pill border-2 border-black bg-gradient-to-r from-bubblegum to-bubblegum-light px-5 py-1.5 font-grotesk text-sm font-bold uppercase tracking-wider text-ink shadow-[3px_3px_0_0_#000]">
            Под заказ
          </span>

          <h1 className="font-grotesk text-display font-semibold leading-[0.95] tracking-[-0.03em] text-ink sm:text-[clamp(3rem,6.5vw,5rem)]">
            сделано
            <br />
            для <span className="text-bubblegum">тебя</span>
          </h1>

          <p className="max-w-xl text-lg text-ink/70">
            Термостаканы, одежда, обувь и многое другое. Выбери вариант, мы соберём заказ
            и свяжемся с вами как можно скорее.
          </p>

          <div className="relative flex flex-wrap items-center justify-center gap-4 sm:justify-start">
            <ScribbleNote
              text="жми сюда 🔥"
              className="left-8 top-full"
              rotate={-5}
              direction="up"
              reduceMotion={reduceMotion}
            />
            <ScribbleNote
              text="а тут инфа 👀"
              className="left-full top-1/2 ml-1 -translate-y-1/2"
              rotate={5}
              direction="left"
              reduceMotion={reduceMotion}
            />
            <Link
              to="/catalog"
              className="rounded-pill border-2 border-black bg-ink px-8 py-3 font-grotesk text-sm font-bold text-white shadow-[4px_4px_0_0_#E8799F] transition hover:bg-bubblegum-dark hover:shadow-[6px_6px_0_0_#E8799F]"
            >
              Смотреть каталог
            </Link>
            <Link
              to="/about"
              className="rounded-pill border-2 border-black bg-white px-8 py-3 font-grotesk text-sm font-bold text-ink transition hover:bg-bubblegum hover:text-white"
            >
              Подробнее
            </Link>
          </div>
        </div>

        <motion.a
          href="https://www.instagram.com/adika.buyer/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Adika Buyer в Instagram"
          className="relative mt-8 block h-56 w-56 shrink-0 sm:mt-0 sm:h-64 sm:w-64 lg:h-80 lg:w-80"
          animate={reduceMotion ? undefined : { y: [0, -14, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{ scale: 1.05, rotate: -3 }}
          whileTap={{ scale: 0.96 }}
        >
          <ScribbleNote
            text="залетай к нам ✨"
            className="bottom-full left-1/2 -translate-x-1/2"
            rotate={-4}
            direction="down"
            reduceMotion={reduceMotion}
          />
          <motion.div
            aria-hidden="true"
            className="absolute -inset-4 rounded-full bg-gradient-to-br from-bubblegum via-bubblegum-light to-silver blur-2xl opacity-70"
            animate={reduceMotion ? undefined : { rotate: 360, scale: [1, 1.1, 1] }}
            transition={{
              rotate: { duration: 22, repeat: Infinity, ease: 'linear' },
              scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
          <motion.svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute -inset-3 h-[calc(100%+1.5rem)] w-[calc(100%+1.5rem)] text-black/40"
            animate={reduceMotion ? undefined : { rotate: -360 }}
            transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
          >
            <circle
              cx="50"
              cy="50"
              r="49"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.7"
              pathLength={100}
              strokeDasharray="1.5 2.5"
              strokeLinecap="round"
            />
          </motion.svg>
          <img
            src="/adika-buyer-instagram.jpg"
            alt="Adika Buyer в Instagram"
            className="relative h-full w-full rounded-full border-4 border-black object-cover"
          />
        </motion.a>
      </motion.div>
    </section>
  )
}
