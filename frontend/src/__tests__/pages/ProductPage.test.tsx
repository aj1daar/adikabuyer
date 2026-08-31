import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProductPage from '../../pages/ProductPage'
import catalogClient from '../../api/catalogClient'
import useCartStore from '../../store/useCartStore'
import type { ProductDto } from '../../types/catalog'

vi.mock('../../api/catalogClient', () => ({
  default: { get: vi.fn() },
  attachAuthHeader: (config: unknown) => config,
  handleAuthError: (error: unknown) => Promise.reject(error),
}))

const mockedGet = vi.mocked(catalogClient.get)

const product: ProductDto = {
  id: 7,
  name: 'Custom Tumbler',
  description: 'Insulated steel tumbler',
  category: 'Drinkware',
  basePrice: 25,
  displayPrice: 25,
  active: true,
  imageUrl: 'product.jpg',
  variants: [
    {
      id: 1,
      productId: 7,
      sku: 'TUM-BLK',
      attributes: { color: 'Black' },
      priceOverride: null,
      displayPrice: 25,
      stockQuantity: 10,
      active: true,
      imageUrls: ['black.jpg', 'black-side.jpg'],
      status: 'IN_STOCK',
    },
    {
      id: 2,
      productId: 7,
      sku: 'TUM-WHT',
      attributes: { color: 'White' },
      priceOverride: 30,
      displayPrice: 30,
      stockQuantity: 5,
      active: true,
      imageUrls: [],
      status: 'PRE_ORDER',
    },
  ],
}

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/catalog/7']}>
      <Routes>
        <Route path="/catalog/:id" element={<ProductPage />} />
      </Routes>
    </MemoryRouter>
  )

beforeEach(() => {
  mockedGet.mockReset()
  useCartStore.setState({ items: [], isOpen: false })
})

describe('ProductPage', () => {
  it('loads the product and shows name, price, and one clickable row per attribute', async () => {
    mockedGet.mockResolvedValue({ data: product })

    renderPage()

    expect(await screen.findByText('Custom Tumbler')).toBeInTheDocument()
    expect(mockedGet).toHaveBeenCalledWith('/products/7', expect.anything())
    expect(screen.getByText('25 KGS')).toBeInTheDocument()
    expect(screen.getByText('Цвет')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Black' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'White' })).toBeInTheDocument()
  })

  it('switches image, price, and status when another attribute value is selected', async () => {
    mockedGet.mockResolvedValue({ data: product })

    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'White' }))

    expect(screen.getByText('30 KGS')).toBeInTheDocument()
    expect(screen.getByText('Под заказ')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'White' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByAltText('Custom Tumbler')).toHaveAttribute('src', 'black.jpg')
  })

  it('adds the selected variant and quantity to the cart', async () => {
    mockedGet.mockResolvedValue({ data: product })

    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'White' }))
    fireEvent.click(screen.getByRole('button', { name: 'Увеличить количество' }))
    fireEvent.click(screen.getByRole('button', { name: 'В корзину' }))

    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ variantId: 2, sku: 'TUM-WHT', unitPrice: 30, quantity: 2, status: 'PRE_ORDER' })
    expect(useCartStore.getState().isOpen).toBe(true)
  })

  it('switches the main photo when a thumbnail is clicked', async () => {
    mockedGet.mockResolvedValue({ data: product })

    renderPage()

    await screen.findByText('Custom Tumbler')
    expect(screen.getByRole('button', { name: 'Фото 2' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Фото 2' }))

    expect(screen.getByAltText('Custom Tumbler')).toHaveAttribute('src', 'black-side.jpg')
  })

  it('shows an error message when loading fails', async () => {
    mockedGet.mockRejectedValue(new Error('boom'))

    renderPage()

    await waitFor(() => expect(screen.getByText('boom')).toBeInTheDocument())
  })

  it('falls back to a flat variant list when variants carry no attributes', async () => {
    const noAttributeProduct: ProductDto = {
      ...product,
      variants: [
        { ...product.variants[0], attributes: {} },
        { ...product.variants[1], attributes: {} },
      ],
    }
    mockedGet.mockResolvedValue({ data: noAttributeProduct })

    renderPage()

    expect(await screen.findByRole('button', { name: 'TUM-BLK' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'TUM-WHT' })).toBeInTheDocument()
  })

  it('hides sold-out variants from the attribute selectors', async () => {
    const partlySoldOut: ProductDto = {
      ...product,
      variants: [
        { ...product.variants[0], id: 1, attributes: { color: 'Black' }, status: 'IN_STOCK' },
        { ...product.variants[0], id: 2, attributes: { color: 'White' }, status: 'IN_STOCK' },
        { ...product.variants[0], id: 3, attributes: { color: 'Red' }, status: 'SOLD_OUT' },
      ],
    }
    mockedGet.mockResolvedValue({ data: partlySoldOut })

    renderPage()

    expect(await screen.findByRole('button', { name: 'Black' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'White' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Red' })).not.toBeInTheDocument()
  })

  it('renders round colour swatches when the product has swatch images', async () => {
    const swatchProduct: ProductDto = {
      ...product,
      colorSwatches: { Black: 'black-swatch.jpg', White: 'white-swatch.jpg' },
    }
    mockedGet.mockResolvedValue({ data: swatchProduct })

    renderPage()

    const blackSwatch = await screen.findByRole('button', { name: 'Black' })
    expect(blackSwatch.querySelector('img')).toHaveAttribute('src', 'black-swatch.jpg')

    fireEvent.click(screen.getByRole('button', { name: 'White' }))
    expect(screen.getByText('30 KGS')).toBeInTheDocument()
  })

  it('keeps the rest of the selection when a compatible value is picked, snaps it otherwise', async () => {
    const matrixProduct: ProductDto = {
      ...product,
      variants: [
        { ...product.variants[0], id: 11, sku: 'DEFAULT-A', attributes: { color: 'Black', volume: '591' }, imageUrls: ['a.jpg'] },
        { ...product.variants[0], id: 12, sku: 'DEFAULT-B', attributes: { color: 'Black', volume: '414' }, imageUrls: ['b.jpg'] },
        { ...product.variants[0], id: 13, sku: 'DEFAULT-C', attributes: { color: 'White', volume: '591' }, imageUrls: ['c.jpg'] },
      ],
    }
    mockedGet.mockResolvedValue({ data: matrixProduct })

    renderPage()

    // start: Black / 591
    fireEvent.click(await screen.findByRole('button', { name: '414 мл' }))
    expect(screen.getByRole('button', { name: 'Black' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '414 мл' })).toHaveAttribute('aria-pressed', 'true')

    // White has no 414 -> snaps volume back to 591
    fireEvent.click(screen.getByRole('button', { name: 'White' }))
    expect(screen.getByRole('button', { name: 'White' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '591 мл' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByAltText('Custom Tumbler')).toHaveAttribute('src', 'c.jpg')
  })
})
