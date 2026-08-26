import { Link, NavLink } from 'react-router-dom'
import Logo from './Logo'
import useCartStore from '../store/useCartStore'
import useHideOnScroll from '../hooks/useHideOnScroll'

const navItems = [
  { to: '/catalog', label: 'Каталог' },
  { to: '/about', label: 'О нас' },
]

export default function NavigationBar() {
  const toggleCart = useCartStore((state) => state.toggleCart)
  const totalCount = useCartStore((state) => state.totalCount())
  const hidden = useHideOnScroll()

  const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    `font-grotesk text-sm font-bold transition ${isActive ? 'text-bubblegum-dark' : 'text-ink/60 hover:text-ink'}`

  const tabLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-1 flex-col items-center gap-1 py-3 font-grotesk text-xs font-bold transition ${
      isActive ? 'text-bubblegum-dark' : 'text-ink/50'
    }`

  return (
    <>
      <header
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
        className={`sticky top-0 z-40 border-b-2 border-black bg-white/90 backdrop-blur transition-transform duration-300 ${
          hidden ? '-translate-y-full sm:translate-y-0' : 'translate-y-0'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" aria-label="Adika Buyer">
            <Logo className="h-16 w-auto" />
          </Link>

          <nav className="hidden items-center gap-6 sm:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={desktopLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            onClick={toggleCart}
            className="rounded-pill border-2 border-black bg-silver px-4 py-2 font-grotesk text-sm font-bold tabular-nums text-ink transition hover:bg-bubblegum hover:text-white"
          >
            Корзина ({totalCount})
          </button>
        </div>
      </header>

      <nav
        data-mobile-tabbar
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        className={`fixed inset-x-0 bottom-0 z-40 flex border-t-2 border-black bg-white/95 backdrop-blur transition-transform duration-300 sm:hidden ${
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
