import type { ReactNode } from 'react'
import NavigationBar from '../components/NavigationBar'

type MainLayoutProps = {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <NavigationBar />
      <main className="flex-1 px-6 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0">{children}</main>
      <footer
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        className="hidden border-t-2 border-black px-6 py-4 font-grotesk text-sm text-ink/50 sm:block"
      >
        © {new Date().getFullYear()} Adikabuyer
      </footer>
    </div>
  )
}
