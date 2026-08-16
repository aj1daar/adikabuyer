import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AdminDashboard from './AdminDashboard'
import useCatalog from '../../hooks/useCatalog'
import useAuthStore from '../../store/useAuthStore'
import { createProduct, deleteProduct, updateProduct } from '../../api/adminCatalog'
import type { ProductDto } from '../../types/catalog'

vi.mock('../../hooks/useCatalog')
vi.mock('../../api/adminCatalog')

const mockedUseCatalog = vi.mocked(useCatalog)
const mockedCreateProduct = vi.mocked(createProduct)
const mockedUpdateProduct = vi.mocked(updateProduct)
const mockedDeleteProduct = vi.mocked(deleteProduct)

const refetch = vi.fn()

const productWithVariant: ProductDto = {
  id: 1,
  name: 'Custom Tumbler',
  description: null,
  category: 'Drinkware',
  basePrice: 25,
  active: true,
  imageUrl: null,
  variants: [
    {
      id: 10,
      productId: 1,
      sku: 'TUM-BLK-500',
      attributes: { color: 'black' },
      priceOverride: null,
      stockQuantity: 0,
      active: true,
      status: 'PRE_ORDER',
    },
  ],
}

const productWithoutVariants: ProductDto = {
  id: 2,
  name: 'No Variant Product',
  description: null,
  category: null,
  basePrice: 10,
  active: true,
  imageUrl: null,
  variants: [],
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>
  )
}

beforeEach(() => {
  refetch.mockReset()
  mockedCreateProduct.mockReset()
  mockedUpdateProduct.mockReset()
  mockedDeleteProduct.mockReset()
  useAuthStore.setState({ token: 'valid-token' })
  mockedUseCatalog.mockReturnValue({
    products: [productWithVariant, productWithoutVariants],
    loading: false,
    error: null,
    refetch,
  })
})

describe('AdminDashboard', () => {
  it('renders a row per variant with translated stock status', () => {
    renderDashboard()

    expect(screen.getByText('Custom Tumbler')).toBeInTheDocument()
    expect(screen.getByText('TUM-BLK-500')).toBeInTheDocument()
    expect(screen.getByText('Предзаказ')).toBeInTheDocument()
  })

  it('renders a placeholder row for a product with no variants', () => {
    renderDashboard()

    expect(screen.getByText('No Variant Product')).toBeInTheDocument()
    expect(screen.getByText('Нет вариантов')).toBeInTheDocument()
  })

  it('logs out and clears the token when Logout is clicked', () => {
    renderDashboard()

    fireEvent.click(screen.getByRole('button', { name: /выйти/i }))

    expect(useAuthStore.getState().token).toBeNull()
  })

  it('opens the create form when Add product is clicked', () => {
    renderDashboard()

    fireEvent.click(screen.getByRole('button', { name: /добавить товар/i }))

    expect(screen.getByRole('heading', { name: /новый товар/i })).toBeInTheDocument()
  })

  it('opens the edit form prefilled when Edit is clicked', () => {
    renderDashboard()

    fireEvent.click(screen.getAllByRole('button', { name: /изменить/i })[0])

    expect(screen.getByRole('heading', { name: /редактировать товар/i })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Custom Tumbler')).toBeInTheDocument()
  })

  it('deletes a product and refetches on success', async () => {
    mockedDeleteProduct.mockResolvedValueOnce(undefined)
    renderDashboard()

    fireEvent.click(screen.getAllByRole('button', { name: /удалить$/i })[0])

    await waitFor(() => expect(mockedDeleteProduct).toHaveBeenCalledWith(1))
    expect(refetch).toHaveBeenCalled()
  })

  it('shows an error message when delete fails', async () => {
    mockedDeleteProduct.mockRejectedValueOnce(new Error('Cannot delete'))
    renderDashboard()

    fireEvent.click(screen.getAllByRole('button', { name: /удалить$/i })[0])

    await waitFor(() => expect(screen.getByText('Cannot delete')).toBeInTheDocument())
  })

  it('creates a product, closes the form, and refetches on successful submit', async () => {
    mockedCreateProduct.mockResolvedValueOnce(productWithoutVariants)
    renderDashboard()

    fireEvent.click(screen.getByRole('button', { name: /добавить товар/i }))
    fireEvent.change(screen.getByPlaceholderText('Название'), { target: { value: 'Brand New' } })
    fireEvent.change(screen.getByPlaceholderText('Базовая цена'), { target: { value: '9' } })
    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }))

    await waitFor(() => expect(mockedCreateProduct).toHaveBeenCalled())
    expect(refetch).toHaveBeenCalled()
    expect(screen.queryByRole('heading', { name: /новый товар/i })).not.toBeInTheDocument()
  })

  it('updates a product when submitting the edit form', async () => {
    mockedUpdateProduct.mockResolvedValueOnce(productWithVariant)
    renderDashboard()

    fireEvent.click(screen.getAllByRole('button', { name: /изменить/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }))

    await waitFor(() => expect(mockedUpdateProduct).toHaveBeenCalledWith(1, expect.any(Object)))
  })
})
