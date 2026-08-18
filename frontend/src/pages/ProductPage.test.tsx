import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProductPage from './ProductPage'
import catalogClient from '../api/catalogClient'
import useCartStore from '../store/useCartStore'
import type { ProductDto } from '../types/catalog'

vi.mock('../api/catalogClient', () => ({
  default: { get: vi.fn() },
}))

const mockedGet = vi.mocked(catalogClient.get)

const product: ProductDto = {
  id: 7,
  name: 'Custom Tumbler',
  description: 'Insulated steel tumbler',
  category: 'Drinkware',
  basePrice: 25,
  active: true,
  imageUrl: 'product.jpg',
  variants: [
    {
      id: 1,
      productId: 7,
      sku: 'TUM-BLK',
      attributes: { color: 'Black' },
      priceOverride: null,
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
  it('loads the product and shows name, price, and variant pills', async () => {
    mockedGet.mockResolvedValue({ data: product })

    renderPage()

    expect(await screen.findByText('Custom Tumbler')).toBeInTheDocument()
    expect(mockedGet).toHaveBeenCalledWith('/products/7', expect.anything())
    expect(screen.getByText('25 KGS')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Black' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'White' })).toBeInTheDocument()
  })

  it('switches image, price, and status when another variant is selected', async () => {
    mockedGet.mockResolvedValue({ data: product })

    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'White' }))

    expect(screen.getByText('30 KGS')).toBeInTheDocument()
    expect(screen.getByText(/Под заказ · SKU: TUM-WHT/)).toBeInTheDocument()
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
    expect(items[0]).toMatchObject({ variantId: 2, sku: 'TUM-WHT', unitPrice: 30, quantity: 2 })
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
})
