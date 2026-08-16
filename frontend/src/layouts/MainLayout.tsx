import type { ReactNode } from 'react'
import useCartStore from '../store/useCartStore'
import Logo from '../components/Logo'

type MainLayoutProps = {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const toggleCart = useCartStore((state) => state.toggleCart)
  const totalCount = useCartStore((state) => state.totalCount())

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <header className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
        <Logo className="h-10 w-auto" />
        <button
          type="button"
          onClick={toggleCart}
          className="rounded-pill bg-silver px-4 py-2 text-sm font-medium text-ink transition hover:bg-silver-dark"
        >
          Корзина ({totalCount})
        </button>
      </header>
      <main className="flex-1 px-6">{children}</main>
      <footer className="border-t border-ink/10 px-6 py-4 text-sm text-ink/50">
        © {new Date().getFullYear()} Adikabuyer
      </footer>
    </div>
  )
}
