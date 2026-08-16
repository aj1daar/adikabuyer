import type { ReactNode } from 'react'
import NavigationBar from '../components/NavigationBar'

type MainLayoutProps = {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <NavigationBar />
      <main className="flex-1 px-6 pb-20 sm:pb-0">{children}</main>
      <footer
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        className="hidden border-t border-ink/10 px-6 py-4 text-sm text-ink/50 sm:block"
      >
        © {new Date().getFullYear()} Adikabuyer
      </footer>
    </div>
  )
}
