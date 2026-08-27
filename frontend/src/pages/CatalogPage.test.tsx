import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CatalogPage from './CatalogPage'
import useCatalog from '../hooks/useCatalog'
import useIsMobileViewport from '../hooks/useIsMobileViewport'
import useCartStore from '../store/useCartStore'
import type { ProductDto } from '../types/catalog'

vi.mock('../hooks/useCatalog')
vi.mock('../hooks/useIsMobileViewport')

const mockedUseCatalog = vi.mocked(useCatalog)
const mockedUseIsMobileViewport = vi.mocked(useIsMobileViewport)

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
  mockedUseCatalog.mockReturnValue({ products: [], totalCount: 0, loading: false, error: null, refetch: vi.fn() })
  mockedUseIsMobileViewport.mockReturnValue(true)
  localStorage.clear()
})

describe('CatalogPage', () => {
  it('shows a loading message while the catalog is loading', () => {
    mockedUseCatalog.mockReturnValue({ products: [], totalCount: 0, loading: true, error: null, refetch: vi.fn() })

    renderCatalogPage()

    expect(screen.getByText('Загрузка товаров...')).toBeInTheDocument()
  })

  it('shows an error message when the catalog fails to load', () => {
    mockedUseCatalog.mockReturnValue({ products: [], totalCount: 0, loading: false, error: 'Network Error', refetch: vi.fn() })

    renderCatalogPage()

    expect(screen.getByText('Network Error')).toBeInTheDocument()
  })

  it('shows an empty state when there are no products', () => {
    renderCatalogPage()

    expect(screen.getByText('Товары не найдены.')).toBeInTheDocument()
  })

  it('renders the product grid once products load', () => {
    mockedUseCatalog.mockReturnValue({ products: [product], totalCount: 1, loading: false, error: null, refetch: vi.fn() })

    renderCatalogPage()

    expect(screen.getByText('Custom Tumbler')).toBeInTheDocument()
  })

  it('fetches with no filters on initial render', () => {
    renderCatalogPage()

    expect(mockedUseCatalog).toHaveBeenCalledWith({ search: '', color: '', size: '', volumeMin: '', volumeMax: '' })
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

      expect(mockedUseCatalog).toHaveBeenLastCalledWith(
        {
          search: 'tumbler',
          category: '',
          color: '',
          size: '',
          volumeMin: '',
          volumeMax: '',
        },
        { page: 0, pageSize: 12 }
      )
    })
  })

  it('applies the selected color filter once Save is clicked', () => {
    renderCatalogPage()

    fireEvent.click(screen.getByRole('button', { name: /цвет/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Чёрный' }))
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(mockedUseCatalog).toHaveBeenLastCalledWith(
      {
        search: '',
        category: '',
        color: 'Чёрный',
        size: '',
        volumeMin: '',
        volumeMax: '',
      },
      { page: 0, pageSize: 12 }
    )
  })

  it('deselects the color filter when the same option is clicked again before saving', () => {
    renderCatalogPage()

    fireEvent.click(screen.getByRole('button', { name: /цвет/i }))
    const option = screen.getByRole('button', { name: 'Чёрный' })
    fireEvent.click(option)
    fireEvent.click(option)
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(mockedUseCatalog).toHaveBeenLastCalledWith(
      {
        search: '',
        category: '',
        color: '',
        size: '',
        volumeMin: '',
        volumeMax: '',
      },
      { page: 0, pageSize: 12 }
    )
  })

  it('applies the entered volume range once Save is clicked', () => {
    renderCatalogPage()

    fireEvent.click(screen.getByRole('button', { name: /объём/i }))
    fireEvent.change(screen.getByPlaceholderText('От'), { target: { value: '300' } })
    fireEvent.change(screen.getByPlaceholderText('До'), { target: { value: '600' } })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(mockedUseCatalog).toHaveBeenLastCalledWith(
      {
        search: '',
        category: '',
        color: '',
        size: '',
        volumeMin: '300',
        volumeMax: '600',
      },
      { page: 0, pageSize: 12 }
    )
  })

  it('shows a category dropdown derived from loaded products and applies the selection', () => {
    mockedUseCatalog.mockReturnValue({
      products: [{ ...product, category: 'Drinkware' }],
      totalCount: 1,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    renderCatalogPage()

    fireEvent.click(screen.getByRole('button', { name: /категория/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Drinkware' }))
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(mockedUseCatalog).toHaveBeenLastCalledWith(
      {
        search: '',
        category: 'Drinkware',
        color: '',
        size: '',
        volumeMin: '',
        volumeMax: '',
      },
      { page: 0, pageSize: 12 }
    )
  })

  it('does not show a category dropdown when no product has a category', () => {
    renderCatalogPage()

    expect(screen.queryByRole('button', { name: /категория/i })).not.toBeInTheDocument()
  })

  it('defaults the mobile column count to 2 and persists a change to localStorage', () => {
    renderCatalogPage()

    expect(screen.getByRole('button', { name: '2', pressed: true })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '3' }))

    expect(localStorage.getItem('catalog-mobile-columns')).toBe('3')
  })

  it('restores the mobile column count from localStorage on mount', () => {
    localStorage.setItem('catalog-mobile-columns', '1')

    renderCatalogPage()

    expect(screen.getByRole('button', { name: '1', pressed: true })).toBeInTheDocument()
  })

  it('requests the next page from useCatalog when a pagination button is clicked', () => {
    mockedUseCatalog.mockReturnValue({ products: [product], totalCount: 36, loading: false, error: null, refetch: vi.fn() })

    renderCatalogPage()

    fireEvent.click(within(screen.getByRole('navigation', { name: 'Страницы' })).getByRole('button', { name: '2' }))

    expect(mockedUseCatalog).toHaveBeenLastCalledWith(
      { search: '', category: '', color: '', size: '', volumeMin: '', volumeMax: '' },
      { page: 1, pageSize: 12 }
    )
  })

  it('resets back to page 0 once a filter changes after paging forward', () => {
    mockedUseCatalog.mockReturnValue({ products: [product], totalCount: 36, loading: false, error: null, refetch: vi.fn() })

    renderCatalogPage()

    fireEvent.click(within(screen.getByRole('navigation', { name: 'Страницы' })).getByRole('button', { name: '2' }))
    fireEvent.click(screen.getByRole('button', { name: /цвет/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Чёрный' }))
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(mockedUseCatalog).toHaveBeenLastCalledWith(
      { search: '', category: '', color: 'Чёрный', size: '', volumeMin: '', volumeMax: '' },
      { page: 0, pageSize: 12 }
    )
  })

  it('does not paginate on a desktop viewport, fetching everything in one page', () => {
    mockedUseIsMobileViewport.mockReturnValue(false)
    mockedUseCatalog.mockReturnValue({ products: [product], totalCount: 36, loading: false, error: null, refetch: vi.fn() })

    renderCatalogPage()

    expect(mockedUseCatalog).toHaveBeenLastCalledWith(
      { search: '', category: '', color: '', size: '', volumeMin: '', volumeMax: '' },
      { page: 0, pageSize: 1000 }
    )
    expect(screen.queryByRole('navigation', { name: 'Страницы' })).not.toBeInTheDocument()
  })
})
