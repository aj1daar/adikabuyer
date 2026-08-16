import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'
import useCatalog from './hooks/useCatalog'
import useAuthStore from './store/useAuthStore'
import useCartStore from './store/useCartStore'

vi.mock('./hooks/useCatalog')

const mockedUseCatalog = vi.mocked(useCatalog)

function renderAt(path: string) {
  window.history.pushState({}, '', path)
  return render(<App />)
}

beforeEach(() => {
  mockedUseCatalog.mockReturnValue({ products: [], loading: false, error: null, refetch: vi.fn() })
  useCartStore.setState({ items: [], isOpen: false })
  useAuthStore.setState({ token: null })
})

describe('App routing', () => {
  it('renders the storefront at the root path', () => {
    renderAt('/')

    expect(screen.getByText('Товары не найдены.')).toBeInTheDocument()
  })

  it('renders the login page at /admin/login', () => {
    renderAt('/admin/login')

    expect(screen.getByRole('heading', { name: /вход в админ-панель/i })).toBeInTheDocument()
  })

  it('redirects /admin to the login page when unauthenticated', () => {
    renderAt('/admin')

    expect(screen.getByRole('heading', { name: /вход в админ-панель/i })).toBeInTheDocument()
  })

  it('renders the admin dashboard at /admin when authenticated', () => {
    useAuthStore.setState({ token: 'valid-token' })

    renderAt('/admin')

    expect(screen.getByRole('heading', { name: /админ-панель/i })).toBeInTheDocument()
  })
})
