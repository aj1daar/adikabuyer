import { motion, useReducedMotion } from 'framer-motion'
import { Link, NavLink } from 'react-router-dom'
import Logo from './Logo'
import Sparkle from './Sparkle'
import useCartStore from '../store/useCartStore'
import useFilterSheetStore from '../store/useFilterSheetStore'
import useHideOnScroll from '../hooks/useHideOnScroll'

const MotionLink = motion.create(Link)

const navItems = [
  { to: '/catalog', label: 'Каталог' },
  { to: '/about', label: 'О нас' },
]

export default function NavigationBar() {
  const toggleCart = useCartStore((state) => state.toggleCart)
  const totalCount = useCartStore((state) => state.totalCount())
  const scrolledHidden = useHideOnScroll()
  const filterSheetOpen = useFilterSheetStore((state) => state.isOpen)
  const hidden = scrolledHidden || filterSheetOpen
  const reduceMotion = useReducedMotion()

  const springy = reduceMotion
    ? { duration: 0.15 }
    : { type: 'spring' as const, stiffness: 500, damping: 12, mass: 0.6 }
  const logoTween = reduceMotion
    ? { duration: 0.12 }
    : { type: 'spring' as const, stiffness: 240, damping: 26, mass: 1 }

  const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative font-grotesk text-sm font-bold transition after:absolute after:-bottom-1.5 after:left-0 after:h-[3px] after:w-full after:origin-left after:rounded-full after:bg-bubblegum after:transition-transform after:duration-200 after:content-[''] ${
      isActive
        ? 'text-bubblegum-dark after:scale-x-100'
        : 'text-ink/60 hover:text-ink after:scale-x-0 hover:after:scale-x-100'
    }`

  const tabLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-1 flex-col items-center gap-1 py-3 font-grotesk text-xs font-bold transition ${
      isActive ? 'text-bubblegum-dark' : 'text-ink/50'
    }`

  return (
    <>
      <header
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
        className={`sticky top-0 z-40 border-b-2 border-black bg-white/90 backdrop-blur transition-transform duration-150 will-change-transform ${
          hidden ? '-translate-y-full sm:translate-y-0' : 'translate-y-0'
        }`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(212,92,134,0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(212,92,134,0.09) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        />
        <div className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <MotionLink
            to="/"
            aria-label="Adika Buyer"
            className="relative shrink-0"
            whileHover={reduceMotion ? { scale: 1.02 } : { scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={logoTween}
          >
            <span
              aria-hidden="true"
              className="absolute -inset-2 -z-10 rounded-lg border-2 border-dashed border-black/30"
            />
            <Logo className="relative h-16 w-auto" />
          </MotionLink>

          <nav className="hidden items-center gap-6 sm:flex">
            <Sparkle className="h-3.5 w-3.5 text-bubblegum-dark/70" />
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={desktopLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <motion.button
            type="button"
            onClick={toggleCart}
            className="relative rounded-pill border-2 border-black bg-silver px-4 py-2 font-grotesk text-sm font-bold tabular-nums text-ink shadow-[3px_3px_0_0_#000] transition-[background-color,color] hover:bg-bubblegum hover:text-white"
            whileHover={reduceMotion ? { scale: 1.03 } : { y: -3 }}
            whileTap={{ y: 0, scale: 0.95 }}
            transition={springy}
          >
            Корзина ({totalCount})
            {totalCount > 0 && (
              <Sparkle
                spin
                reduceMotion={reduceMotion}
                className="absolute -right-2 -top-2 h-4 w-4 text-bubblegum drop-shadow-[1px_1px_0_#000]"
              />
            )}
          </motion.button>
        </div>
      </header>

      <nav
        data-mobile-tabbar
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        className={`fixed inset-x-0 bottom-0 z-40 flex border-t-2 border-black bg-white/95 backdrop-blur transition-transform duration-150 will-change-transform sm:hidden ${
          hidden ? 'translate-y-full' : 'translate-y-0'
        }`}
      >
        <NavLink to="/" end className={tabLinkClass}>
          Главная
        </NavLink>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={tabLinkClass}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
