import type { ReactNode } from 'react'

type MainLayoutProps = {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <header className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold">Adikabuyer</h1>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
      <footer className="border-t border-gray-200 px-6 py-4 text-sm text-gray-500">
        © {new Date().getFullYear()} Adikabuyer
      </footer>
    </div>
  )
}
