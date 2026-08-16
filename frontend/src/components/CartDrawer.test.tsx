import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import CartDrawer from './CartDrawer'
import useCartStore, { type CartItem } from '../store/useCartStore'
import submitCheckout from '../api/checkout'

vi.mock('../api/checkout', () => ({
  default: vi.fn(),
}))

const mockedSubmitCheckout = vi.mocked(submitCheckout)

const cartItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  variantId: 1,
  productId: 1,
  productName: 'Custom Tumbler',
  sku: 'TUM-BLK-500',
  attributes: { color: 'black' },
  unitPrice: 25,
  quantity: 2,
  ...overrides,
})

beforeEach(() => {
  mockedSubmitCheckout.mockReset()
  useCartStore.setState({ items: [], isOpen: true })
  Object.defineProperty(window, 'location', {
    value: { href: '' },
    writable: true,
    configurable: true,
  })
})

const fillCheckoutForm = () => {
  fireEvent.change(screen.getByPlaceholderText('Имя и фамилия'), { target: { value: 'John Doe' } })
  fireEvent.change(screen.getByPlaceholderText('Номер телефона'), { target: { value: '996700123456' } })
  fireEvent.change(screen.getByPlaceholderText('Город'), { target: { value: 'Bishkek' } })
}

describe('CartDrawer', () => {
  it('shows an empty cart message and no form when there are no items', () => {
    render(<CartDrawer />)

    expect(screen.getByText('Корзина пуста.')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Имя и фамилия')).not.toBeInTheDocument()
  })

  it('renders cart items with quantity and line total', () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })

    render(<CartDrawer />)

    const itemRow = screen.getByText('Custom Tumbler').closest('div')!.parentElement!
    expect(within(itemRow).getByText('black · x2')).toBeInTheDocument()
    expect(within(itemRow).getByText('50.00 ⃀')).toBeInTheDocument()
  })

  it('removes an item from the store when Remove is clicked', () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })

    render(<CartDrawer />)
    fireEvent.click(screen.getByRole('button', { name: /удалить/i }))

    expect(useCartStore.getState().items).toEqual([])
  })

  it('disables checkout while any field is blank', () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })

    render(<CartDrawer />)

    expect(screen.getByRole('button', { name: /оформить заказ/i })).toBeDisabled()
  })

  it('disables checkout when fields contain only whitespace', () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })

    render(<CartDrawer />)
    fireEvent.change(screen.getByPlaceholderText('Имя и фамилия'), { target: { value: '   ' } })
    fireEvent.change(screen.getByPlaceholderText('Номер телефона'), { target: { value: '   ' } })
    fireEvent.change(screen.getByPlaceholderText('Город'), { target: { value: '   ' } })

    expect(screen.getByRole('button', { name: /оформить заказ/i })).toBeDisabled()
  })

  it('disables checkout when the cart is empty regardless of form state', () => {
    render(<CartDrawer />)

    expect(screen.queryByRole('button', { name: /оформить заказ/i })).toBeDisabled()
  })

  it('enables checkout once the cart has items and all fields are filled', () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })

    render(<CartDrawer />)
    fillCheckoutForm()

    expect(screen.getByRole('button', { name: /оформить заказ/i })).toBeEnabled()
  })

  it('on success calls the api, clears the cart, closes the drawer, and redirects to whatsapp', async () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })
    mockedSubmitCheckout.mockResolvedValueOnce({
      orderId: 'order-1',
      itemsTotal: 50,
      deliveryFee: 150,
      grandTotal: 200,
      whatsappUrl: 'https://wa.me/996707660433?text=hello',
    })

    render(<CartDrawer />)
    fillCheckoutForm()
    fireEvent.click(screen.getByRole('button', { name: /оформить заказ/i }))

    await waitFor(() => expect(useCartStore.getState().items).toEqual([]))

    expect(useCartStore.getState().isOpen).toBe(false)
    expect(window.location.href).toBe('https://wa.me/996707660433?text=hello')
  })

  it('on failure shows an error message and does not clear the cart or redirect', async () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })
    mockedSubmitCheckout.mockRejectedValueOnce(new Error('Server exploded'))

    render(<CartDrawer />)
    fillCheckoutForm()
    fireEvent.click(screen.getByRole('button', { name: /оформить заказ/i }))

    await waitFor(() => expect(screen.getByText('Server exploded')).toBeInTheDocument())

    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().isOpen).toBe(true)
    expect(window.location.href).toBe('')
  })
})
