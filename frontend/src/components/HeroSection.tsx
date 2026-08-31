import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function HeroSection() {
  const reduceMotion = useReducedMotion()

  return (
    <section className="relative flex items-center overflow-hidden bg-white py-16 sm:h-[calc(100dvh-10rem)] sm:py-0">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:gap-10 sm:text-left"
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

          <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
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
          className="group relative mt-8 block h-56 w-56 shrink-0 sm:mt-0 sm:h-64 sm:w-64 lg:h-80 lg:w-80"
          animate={reduceMotion ? undefined : { y: [0, -14, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{ scale: 1.05, rotate: -3 }}
          whileTap={{ scale: 0.96 }}
        >
          <motion.div
            aria-hidden="true"
            className="absolute -inset-4 rounded-full bg-gradient-to-br from-bubblegum via-bubblegum-light to-silver blur-2xl opacity-70"
            animate={reduceMotion ? undefined : { rotate: 360, scale: [1, 1.1, 1] }}
            transition={{
              rotate: { duration: 22, repeat: Infinity, ease: 'linear' },
              scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
          <motion.span
            aria-hidden="true"
            className="absolute -inset-3 rounded-full border-2 border-dashed border-black/40"
            animate={reduceMotion ? undefined : { rotate: -360 }}
            transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
          />
          <img
            src="/adika-buyer-instagram.jpg"
            alt="Adika Buyer в Instagram"
            className="relative h-full w-full rounded-full border-4 border-black object-cover shadow-[8px_8px_0_0_#000] transition-shadow duration-200 group-hover:shadow-[12px_12px_0_0_#000]"
          />
        </motion.a>
      </motion.div>
    </section>
  )
}
