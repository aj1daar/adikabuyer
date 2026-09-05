import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AdminDashboard from '../../../pages/admin/AdminDashboard'
import useCatalog from '../../../hooks/useCatalog'
import useAuthStore from '../../../store/useAuthStore'
import { createProduct, deleteProduct, deleteVariant, updateProduct } from '../../../api/adminCatalog'
import getOrders, { deleteOrder } from '../../../api/adminOrders'
import getTelegramAdmins from '../../../api/telegramAdmins'
import type { ProductDto } from '../../../types/catalog'
import type { OrderDto } from '../../../types/order'

vi.mock('../../../hooks/useCatalog')
vi.mock('../../../api/adminCatalog')
vi.mock('../../../api/adminOrders')
vi.mock('../../../api/telegramAdmins')

const mockedUseCatalog = vi.mocked(useCatalog)
const mockedCreateProduct = vi.mocked(createProduct)
const mockedUpdateProduct = vi.mocked(updateProduct)
const mockedDeleteProduct = vi.mocked(deleteProduct)
const mockedDeleteVariant = vi.mocked(deleteVariant)
const mockedGetOrders = vi.mocked(getOrders)
const mockedDeleteOrder = vi.mocked(deleteOrder)
const mockedGetTelegramAdmins = vi.mocked(getTelegramAdmins)

const order: OrderDto = {
  id: 'order-1',
  customerName: 'Jane Doe',
  customerPhone: '996700000000',
  region: 'bishkek',
  itemsTotal: 50,
  deliveryFee: 150,
  grandTotal: 200,
  createdAt: '2026-01-01T00:00:00Z',
  items: [{ variantId: 1, productName: 'Tumbler', sku: 'TUM-1', attributes: {}, unitPrice: 50, quantity: 1 }],
}

const refetch = vi.fn()

const productWithVariant: ProductDto = {
  id: 1,
  name: 'Custom Tumbler',
  description: null,
  category: 'Drinkware',
  basePrice: 25,
  displayPrice: 25,
  active: true,
  imageUrl: null,
  variants: [
    {
      id: 10,
      productId: 1,
      sku: 'TUM-BLK-500',
      imageUrls: [],
      attributes: { color: 'black' },
      priceOverride: null,
      displayPrice: 25,
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
  displayPrice: 10,
  active: true,
  imageUrl: null,
  variants: [],
}

const twoVariantProduct: ProductDto = {
  id: 2,
  name: 'Two Variant Tumbler',
  description: null,
  category: 'Drinkware',
  basePrice: 25,
  displayPrice: 25,
  active: true,
  imageUrl: null,
  variants: [
    {
      id: 20,
      productId: 2,
      sku: 'TWO-A',
      imageUrls: [],
      attributes: { color: 'black' },
      priceOverride: null,
      displayPrice: 25,
      stockQuantity: 3,
      active: true,
      status: 'IN_STOCK',
    },
    {
      id: 21,
      productId: 2,
      sku: 'TWO-B',
      imageUrls: [],
      attributes: { color: 'white' },
      priceOverride: null,
      displayPrice: 30,
      stockQuantity: 2,
      active: true,
      status: 'IN_STOCK',
    },
  ],
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
  mockedDeleteVariant.mockReset()
  mockedGetOrders.mockReset()
  mockedDeleteOrder.mockReset()
  mockedGetTelegramAdmins.mockReset()
  useAuthStore.setState({ token: 'valid-token' })
  mockedUseCatalog.mockReturnValue({
    products: [productWithVariant, productWithoutVariants],
    totalCount: 2,
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

  it('marks a fully sold-out product as archived and labels the status', () => {
    mockedUseCatalog.mockReturnValue({
      products: [
        {
          ...productWithVariant,
          name: 'Sold Out Mug',
          variants: [{ ...productWithVariant.variants[0], status: 'SOLD_OUT' }],
        },
      ],
      totalCount: 1,
      loading: false,
      error: null,
      refetch,
    })

    renderDashboard()

    expect(screen.getByText('В архиве')).toBeInTheDocument()
    expect(screen.getByText('Солдаут')).toBeInTheDocument()
  })

  it('asks the catalog hook to include archived products', () => {
    renderDashboard()

    expect(mockedUseCatalog).toHaveBeenCalledWith({ includeArchived: true })
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

  it('asks for confirmation before deleting a product, and says how many variants go with it', () => {
    renderDashboard()

    fireEvent.click(screen.getAllByRole('button', { name: /удалить товар/i })[0])

    expect(screen.getByRole('dialog', { name: /удалить товар\?/i })).toBeInTheDocument()
    expect(screen.getByText(/и все его варианты \(1\)/i)).toBeInTheDocument()
    expect(mockedDeleteProduct).not.toHaveBeenCalled()
  })

  it('does not delete anything when the confirmation is cancelled', () => {
    renderDashboard()

    fireEvent.click(screen.getAllByRole('button', { name: /удалить товар/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /отмена/i }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mockedDeleteProduct).not.toHaveBeenCalled()
  })

  it('deletes a product and refetches once the delete is confirmed', async () => {
    mockedDeleteProduct.mockResolvedValueOnce(undefined)
    renderDashboard()

    fireEvent.click(screen.getAllByRole('button', { name: /удалить товар/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /^удалить$/i }))

    await waitFor(() => expect(mockedDeleteProduct).toHaveBeenCalledWith(1))
    expect(refetch).toHaveBeenCalled()
  })

  it('shows an error message when delete fails', async () => {
    mockedDeleteProduct.mockRejectedValueOnce(new Error('Cannot delete'))
    renderDashboard()

    fireEvent.click(screen.getAllByRole('button', { name: /удалить товар/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /^удалить$/i }))

    await waitFor(() => expect(screen.getByText('Cannot delete')).toBeInTheDocument())
  })

  it('groups variants under one product header instead of listing them as separate products', () => {
    mockedUseCatalog.mockReturnValue({
      products: [twoVariantProduct],
      totalCount: 1,
      loading: false,
      error: null,
      refetch,
    })
    renderDashboard()

    // the product name appears once, as the group header — not once per variant
    expect(screen.getAllByText('Two Variant Tumbler')).toHaveLength(1)
    expect(screen.getByText(/вариантов: 2/i)).toBeInTheDocument()
    // one product-level delete, one per-variant delete for each of the two variants
    expect(screen.getAllByRole('button', { name: /удалить товар/i })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: /удалить вариант/i })).toHaveLength(2)
  })

  it('deletes just the one variant once confirmed, leaving the product', async () => {
    mockedUseCatalog.mockReturnValue({
      products: [twoVariantProduct],
      totalCount: 1,
      loading: false,
      error: null,
      refetch,
    })
    mockedDeleteVariant.mockResolvedValueOnce(twoVariantProduct)
    renderDashboard()

    fireEvent.click(screen.getAllByRole('button', { name: /удалить вариант/i })[0])
    expect(screen.getByText(/вариант «TWO-A» товара «Two Variant Tumbler»/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^удалить$/i }))

    await waitFor(() => expect(mockedDeleteVariant).toHaveBeenCalledWith(2, 20))
    expect(mockedDeleteProduct).not.toHaveBeenCalled()
    expect(refetch).toHaveBeenCalled()
  })

  it('offers no variant delete when the product has only one', () => {
    renderDashboard()

    expect(screen.queryByRole('button', { name: /удалить вариант/i })).not.toBeInTheDocument()
    expect(screen.getByText(/единственный вариант/i)).toBeInTheDocument()
  })

  it('creates a product, closes the form, and refetches on successful submit', async () => {
    mockedCreateProduct.mockResolvedValueOnce(productWithoutVariants)
    renderDashboard()

    fireEvent.click(screen.getByRole('button', { name: /добавить товар/i }))
    fireEvent.change(screen.getByPlaceholderText('Название'), { target: { value: 'Brand New' } })
    fireEvent.click(screen.getByRole('button', { name: /добавить вариант/i }))
    fireEvent.change(screen.getByPlaceholderText('Артикул / SKU (необязательно)'), {
      target: { value: 'NEW-SKU' },
    })
    fireEvent.change(screen.getByPlaceholderText('Цена для клиента, KGS'), { target: { value: '9' } })
    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }))

    await waitFor(() => expect(mockedCreateProduct).toHaveBeenCalled())
    expect(refetch).toHaveBeenCalled()
    expect(screen.queryByRole('heading', { name: /новый товар/i })).not.toBeInTheDocument()
  })

  it('updates a product when submitting the edit form', async () => {
    mockedUpdateProduct.mockResolvedValueOnce(productWithVariant)
    renderDashboard()

    fireEvent.click(screen.getAllByRole('button', { name: /изменить/i })[0])
    fireEvent.change(screen.getByPlaceholderText('Цена для клиента, KGS'), { target: { value: '25' } })
    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }))

    await waitFor(() => expect(mockedUpdateProduct).toHaveBeenCalledWith(1, expect.any(Object)))
  })

  it('does not fetch orders until the Заказы tab is opened', () => {
    renderDashboard()

    expect(mockedGetOrders).not.toHaveBeenCalled()
  })

  it('switches to the orders tab, fetches, and renders orders', async () => {
    mockedGetOrders.mockResolvedValueOnce([order])
    renderDashboard()

    fireEvent.click(screen.getByRole('button', { name: 'Заказы' }))

    await waitFor(() => expect(screen.getByText('Jane Doe')).toBeInTheDocument())
    expect(mockedGetOrders).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: /добавить товар/i })).not.toBeInTheDocument()
  })

  it('shows an error when fetching orders fails', async () => {
    mockedGetOrders.mockRejectedValueOnce(new Error('Orders down'))
    renderDashboard()

    fireEvent.click(screen.getByRole('button', { name: 'Заказы' }))

    await waitFor(() => expect(screen.getByText('Orders down')).toBeInTheDocument())
  })

  it('deletes an order and refetches on success', async () => {
    mockedGetOrders.mockResolvedValue([order])
    mockedDeleteOrder.mockResolvedValueOnce(undefined)
    renderDashboard()

    fireEvent.click(screen.getByRole('button', { name: 'Заказы' }))
    await waitFor(() => expect(screen.getByText('Jane Doe')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /удалить/i }))

    await waitFor(() => expect(mockedDeleteOrder).toHaveBeenCalledWith('order-1'))
    expect(mockedGetOrders).toHaveBeenCalledTimes(2)
  })

  it('shows an error message when order deletion fails', async () => {
    mockedGetOrders.mockResolvedValue([order])
    mockedDeleteOrder.mockRejectedValueOnce(new Error('Cannot delete order'))
    renderDashboard()

    fireEvent.click(screen.getByRole('button', { name: 'Заказы' }))
    await waitFor(() => expect(screen.getByText('Jane Doe')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /удалить/i }))

    await waitFor(() => expect(screen.getByText('Cannot delete order')).toBeInTheDocument())
  })

  it('does not fetch telegram admins until the Telegram tab is opened', () => {
    renderDashboard()

    expect(mockedGetTelegramAdmins).not.toHaveBeenCalled()
  })

  it('filters the table by name, SKU or attribute as the admin types', () => {
    renderDashboard()
    const search = screen.getByLabelText('Поиск по товарам')

    fireEvent.change(search, { target: { value: 'no variant' } })
    expect(screen.getByText('No Variant Product')).toBeInTheDocument()
    expect(screen.queryByText('Custom Tumbler')).not.toBeInTheDocument()
    expect(screen.getByText('Найдено: 1 из 2')).toBeInTheDocument()

    fireEvent.change(search, { target: { value: 'TUM-BLK' } })
    expect(screen.getByText('Custom Tumbler')).toBeInTheDocument()
    expect(screen.queryByText('No Variant Product')).not.toBeInTheDocument()
  })

  it('says so when a search matches nothing, and clears back to the full list', () => {
    renderDashboard()
    const search = screen.getByLabelText('Поиск по товарам')

    fireEvent.change(search, { target: { value: 'ничего' } })
    expect(screen.getByText('По запросу «ничего» ничего не нашлось.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Очистить поиск' }))
    expect(screen.getByText('Custom Tumbler')).toBeInTheDocument()
    expect(screen.getByText('No Variant Product')).toBeInTheDocument()
  })

  it('offers no product search outside the products tab', () => {
    renderDashboard()
    fireEvent.click(screen.getByRole('button', { name: 'Заказы' }))

    expect(screen.queryByLabelText('Поиск по товарам')).not.toBeInTheDocument()
  })

  it('switches to the Telegram tab, fetches, and renders subscribers', async () => {
    mockedGetTelegramAdmins.mockResolvedValueOnce([
      { chatId: 42, username: 'shop_owner', registeredAt: '2026-01-01T00:00:00Z' },
    ])
    renderDashboard()

    fireEvent.click(screen.getByRole('button', { name: 'Telegram' }))

    await waitFor(() => expect(screen.getByText('shop_owner')).toBeInTheDocument())
    expect(mockedGetTelegramAdmins).toHaveBeenCalledTimes(1)
  })
})
