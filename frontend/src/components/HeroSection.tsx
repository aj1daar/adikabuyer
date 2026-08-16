import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-28">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative mx-auto flex max-w-6xl flex-col items-center gap-10 text-center"
      >
        <span className="rounded-pill bg-bubblegum-light px-4 py-1 text-sm font-medium text-bubblegum-dark">
          Под заказ
        </span>

        <h1 className="font-grotesk text-display font-semibold text-ink">
          сделано
          <br />
          для <span className="text-bubblegum">тебя</span>
        </h1>

        <p className="max-w-xl text-lg text-ink/70">
          Термостаканы, одежда, обувь и многое другое. Выбери вариант, мы соберём заказ
          и отправим его прямо в WhatsApp.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/catalog"
            className="rounded-pill bg-ink px-8 py-3 text-sm font-semibold text-white transition hover:bg-bubblegum-dark"
          >
            Смотреть каталог
          </Link>
          <Link
            to="/about"
            className="rounded-pill border border-ink/15 px-8 py-3 text-sm font-semibold text-ink transition hover:border-ink/40"
          >
            Подробнее
          </Link>
        </div>

        <a
          href="https://www.instagram.com/adika.buyer/"
          target="_blank"
          rel="noopener noreferrer"
          className="relative mt-8 block h-56 w-56 sm:h-72 sm:w-72"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-gradient-to-br from-bubblegum via-bubblegum-light to-silver blur-2xl opacity-70"
          />
          <img
            src="/adika-buyer-instagram.jpg"
            alt="Adika Buyer в Instagram"
            className="relative h-full w-full rounded-full object-cover shadow-2xl ring-4 ring-white"
          />
        </a>
      </motion.div>
    </section>
  )
}
