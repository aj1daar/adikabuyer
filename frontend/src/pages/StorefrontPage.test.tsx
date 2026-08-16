import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import StorefrontPage from './StorefrontPage'
import useCatalog from '../hooks/useCatalog'
import useCartStore from '../store/useCartStore'
import type { ProductDto } from '../types/catalog'

vi.mock('../hooks/useCatalog')

const mockedUseCatalog = vi.mocked(useCatalog)

const product: ProductDto = {
  id: 1,
  name: 'Custom Tumbler',
  description: null,
  category: null,
  basePrice: 25,
  active: true,
  imageUrl: null,
  variants: [],
}

beforeEach(() => {
  useCartStore.setState({ items: [], isOpen: false })
})

describe('StorefrontPage', () => {
  it('shows a loading message while the catalog is loading', () => {
    mockedUseCatalog.mockReturnValue({ products: [], loading: true, error: null, refetch: vi.fn() })

    render(<StorefrontPage />)

    expect(screen.getByText('Загрузка товаров...')).toBeInTheDocument()
  })

  it('shows an error message when the catalog fails to load', () => {
    mockedUseCatalog.mockReturnValue({ products: [], loading: false, error: 'Network Error', refetch: vi.fn() })

    render(<StorefrontPage />)

    expect(screen.getByText('Network Error')).toBeInTheDocument()
  })

  it('shows an empty state when there are no products', () => {
    mockedUseCatalog.mockReturnValue({ products: [], loading: false, error: null, refetch: vi.fn() })

    render(<StorefrontPage />)

    expect(screen.getByText('Товары не найдены.')).toBeInTheDocument()
  })

  it('renders the product grid once products load', () => {
    mockedUseCatalog.mockReturnValue({ products: [product], loading: false, error: null, refetch: vi.fn() })

    render(<StorefrontPage />)

    expect(screen.getByText('Custom Tumbler')).toBeInTheDocument()
  })
})
