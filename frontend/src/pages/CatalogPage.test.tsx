import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CatalogPage from './CatalogPage'
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
  displayPrice: 25,
  active: true,
  imageUrl: null,
  variants: [],
}

function renderCatalogPage() {
  return render(
    <MemoryRouter>
      <CatalogPage />
    </MemoryRouter>
  )
}

beforeEach(() => {
  useCartStore.setState({ items: [], isOpen: false })
  mockedUseCatalog.mockReturnValue({ products: [], loading: false, error: null, refetch: vi.fn() })
})

describe('CatalogPage', () => {
  it('shows a loading message while the catalog is loading', () => {
    mockedUseCatalog.mockReturnValue({ products: [], loading: true, error: null, refetch: vi.fn() })

    renderCatalogPage()

    expect(screen.getByText('Загрузка товаров...')).toBeInTheDocument()
  })

  it('shows an error message when the catalog fails to load', () => {
    mockedUseCatalog.mockReturnValue({ products: [], loading: false, error: 'Network Error', refetch: vi.fn() })

    renderCatalogPage()

    expect(screen.getByText('Network Error')).toBeInTheDocument()
  })

  it('shows an empty state when there are no products', () => {
    renderCatalogPage()

    expect(screen.getByText('Товары не найдены.')).toBeInTheDocument()
  })

  it('renders the product grid once products load', () => {
    mockedUseCatalog.mockReturnValue({ products: [product], loading: false, error: null, refetch: vi.fn() })

    renderCatalogPage()

    expect(screen.getByText('Custom Tumbler')).toBeInTheDocument()
  })

  it('fetches with no filters on initial render', () => {
    renderCatalogPage()

    expect(mockedUseCatalog).toHaveBeenCalledWith({ search: '', color: '', size: '', volume: '' })
  })

  describe('search debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('debounces the search input before fetching', () => {
      renderCatalogPage()

      fireEvent.change(screen.getByPlaceholderText('Искать товары...'), { target: { value: 'tumbler' } })

      expect(mockedUseCatalog).not.toHaveBeenCalledWith(
        expect.objectContaining({ search: 'tumbler' })
      )

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(mockedUseCatalog).toHaveBeenLastCalledWith({
        search: 'tumbler',
        color: '',
        size: '',
        volume: '',
      })
    })
  })

  it('applies the selected color filter once Save is clicked', () => {
    renderCatalogPage()

    fireEvent.click(screen.getByRole('button', { name: /цвет/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Чёрный' }))
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(mockedUseCatalog).toHaveBeenLastCalledWith({
      search: '',
      color: 'black',
      size: '',
      volume: '',
    })
  })

  it('deselects the color filter when the same option is clicked again before saving', () => {
    renderCatalogPage()

    fireEvent.click(screen.getByRole('button', { name: /цвет/i }))
    const option = screen.getByRole('button', { name: 'Чёрный' })
    fireEvent.click(option)
    fireEvent.click(option)
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(mockedUseCatalog).toHaveBeenLastCalledWith({
      search: '',
      color: '',
      size: '',
      volume: '',
    })
  })
})
