import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import NavigationBar from '../components/NavigationBar'
import CartDrawer from '../components/CartDrawer'
import SiteBackdrop from '../components/SiteBackdrop'

type MainLayoutProps = {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation()

  return (
    <div className="relative flex min-h-screen flex-col text-ink">
      <SiteBackdrop />
      <NavigationBar />
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative z-10 flex-1 px-6 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0"
      >
        {children}
      </motion.main>
      <footer
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        className="relative z-10 hidden border-t-2 border-black bg-white px-6 py-4 font-grotesk text-sm text-ink/50 sm:block"
      >
        © {new Date().getFullYear()} Adikabuyer
      </footer>
      <CartDrawer />
    </div>
  )
}
