import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import CatalogPage from '../../pages/CatalogPage'
import useCatalog from '../../hooks/useCatalog'
import useCategories from '../../hooks/useCategories'
import useIsMobileViewport from '../../hooks/useIsMobileViewport'
import useCartStore from '../../store/useCartStore'
import type { ProductDto } from '../../types/catalog'

vi.mock('../../hooks/useCatalog')
vi.mock('../../hooks/useCategories')
vi.mock('../../hooks/useIsMobileViewport')

const mockedUseCatalog = vi.mocked(useCatalog)
const mockedUseCategories = vi.mocked(useCategories)
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

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname + location.search}</output>
}

function renderCatalogPage(url = '/catalog') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <CatalogPage />
      <LocationProbe />
    </MemoryRouter>
  )
}

const currentUrl = () => decodeURIComponent(screen.getByTestId('location').textContent ?? '')

beforeEach(() => {
  useCartStore.setState({ items: [], isOpen: false })
  mockedUseCatalog.mockReturnValue({ products: [], totalCount: 0, loading: false, error: null, refetch: vi.fn() })
  mockedUseCategories.mockReturnValue([])
  mockedUseIsMobileViewport.mockReturnValue(true)
  localStorage.clear()
})

describe('CatalogPage', () => {
  it('shows a loading message while the catalog is loading', () => {
    mockedUseCatalog.mockReturnValue({ products: [], totalCount: 0, loading: true, error: null, refetch: vi.fn() })

    renderCatalogPage()

    expect(screen.getByRole('status', { name: 'Загрузка товаров...' })).toBeInTheDocument()
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

    expect(mockedUseCatalog).toHaveBeenCalledWith(
      { search: '', category: '', color: '', size: '', volumeMin: '', volumeMax: '' },
      { page: 0, pageSize: 12 }
    )
  })

  it('requests category options with the current non-category filters', () => {
    renderCatalogPage()

    expect(mockedUseCategories).toHaveBeenCalledWith({ search: '', color: '', size: '', volumeMin: '', volumeMax: '' })
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

  it('applies the selected color filter as soon as it is picked', () => {
    renderCatalogPage()

    fireEvent.click(screen.getByRole('button', { name: /цвет/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Чёрный' }))

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

  it('clears the color filter when the active option is picked again', () => {
    renderCatalogPage()

    fireEvent.click(screen.getByRole('button', { name: /цвет/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Чёрный' }))
    fireEvent.click(screen.getByRole('button', { name: 'Цвет: Чёрный' }))
    fireEvent.click(screen.getByRole('button', { name: 'Чёрный' }))

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
    mockedUseCategories.mockReturnValue([{ label: 'Drinkware', value: 'Drinkware' }])

    renderCatalogPage()

    fireEvent.click(screen.getByRole('button', { name: /категория/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Drinkware' }))

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

    expect(mockedUseCatalog).toHaveBeenLastCalledWith(
      { search: '', category: '', color: 'Чёрный', size: '', volumeMin: '', volumeMax: '' },
      { page: 0, pageSize: 12 }
    )
  })

  it('pages the desktop catalog 24 at a time instead of fetching it all at once', () => {
    mockedUseIsMobileViewport.mockReturnValue(false)
    mockedUseCatalog.mockReturnValue({ products: [product], totalCount: 60, loading: false, error: null, refetch: vi.fn() })

    renderCatalogPage()

    expect(mockedUseCatalog).toHaveBeenLastCalledWith(
      { search: '', category: '', color: '', size: '', volumeMin: '', volumeMax: '' },
      { page: 0, pageSize: 24 }
    )
    expect(within(screen.getByRole('navigation', { name: 'Страницы' })).getByRole('button', { name: '3' })).toBeInTheDocument()
  })

  describe('URL state', () => {
    it('restores search, filters and page from the URL, e.g. after going back from a product', () => {
      mockedUseCatalog.mockReturnValue({ products: [product], totalCount: 36, loading: false, error: null, refetch: vi.fn() })

      renderCatalogPage('/catalog?q=tumbler&color=Чёрный&vmin=300&page=3')

      expect(screen.getByPlaceholderText('Искать товары...')).toHaveValue('tumbler')
      expect(mockedUseCatalog).toHaveBeenLastCalledWith(
        { search: 'tumbler', category: '', color: 'Чёрный', size: '', volumeMin: '300', volumeMax: '' },
        { page: 2, pageSize: 12 }
      )
    })

    it('writes a picked filter to the URL and drops the page number', () => {
      mockedUseCatalog.mockReturnValue({ products: [product], totalCount: 36, loading: false, error: null, refetch: vi.fn() })
      renderCatalogPage('/catalog?page=2')

      fireEvent.click(screen.getByRole('button', { name: /цвет/i }))
      fireEvent.click(screen.getByRole('button', { name: 'Чёрный' }))

      expect(currentUrl()).toBe('/catalog?color=Чёрный')
    })

    it('writes the page number to the URL when paging', () => {
      mockedUseCatalog.mockReturnValue({ products: [product], totalCount: 36, loading: false, error: null, refetch: vi.fn() })
      renderCatalogPage()

      fireEvent.click(within(screen.getByRole('navigation', { name: 'Страницы' })).getByRole('button', { name: '2' }))

      expect(currentUrl()).toBe('/catalog?page=2')
    })

    it('falls back to the first page for a nonsense page number', () => {
      renderCatalogPage('/catalog?page=abc')

      expect(mockedUseCatalog).toHaveBeenLastCalledWith(expect.anything(), { page: 0, pageSize: 12 })
    })
  })
})
