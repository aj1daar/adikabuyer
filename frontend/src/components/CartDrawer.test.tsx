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
})

const selectCity = (city: string) => {
  fireEvent.click(screen.getByRole('button', { expanded: false }))
  fireEvent.click(screen.getByRole('button', { name: city }))
}

const fillCheckoutForm = () => {
  fireEvent.change(screen.getByPlaceholderText('Имя и фамилия'), { target: { value: 'John Doe' } })
  fireEvent.change(screen.getByPlaceholderText('Номер телефона'), { target: { value: '996700123456' } })
  selectCity('Бишкек')
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
    expect(within(itemRow).getByText('black')).toBeInTheDocument()
    expect(within(itemRow).getByText('2')).toBeInTheDocument()
    expect(within(itemRow).getByText('50 KGS')).toBeInTheDocument()
  })

  it('changes quantity with plus and minus buttons and disables minus at one', () => {
    useCartStore.setState({ items: [cartItem({ quantity: 2 })], isOpen: true })

    render(<CartDrawer />)

    fireEvent.click(screen.getByRole('button', { name: 'Увеличить количество' }))
    expect(useCartStore.getState().items[0].quantity).toBe(3)

    const minus = screen.getByRole('button', { name: 'Уменьшить количество' })
    fireEvent.click(minus)
    fireEvent.click(minus)
    expect(useCartStore.getState().items[0].quantity).toBe(1)
    expect(minus).toBeDisabled()
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
    selectCity('Бишкек')

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

  it('shows the delivery-time note and a placeholder fee until a city is picked', () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })

    render(<CartDrawer />)

    expect(screen.getByText(/от 7 до 14 дней/)).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows 250 KGS delivery for Bishkek and updates the grand total', () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })

    render(<CartDrawer />)
    selectCity('Бишкек')

    expect(screen.getByText('250 KGS')).toBeInTheDocument()
    expect(screen.getByText('300 KGS')).toBeInTheDocument()
  })

  it('shows 500 KGS delivery for any other listed city', () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })

    render(<CartDrawer />)
    selectCity('Ош')

    expect(screen.getByText('500 KGS')).toBeInTheDocument()
    expect(screen.getByText('550 KGS')).toBeInTheDocument()
  })

  it('on success clears the cart and shows the in-drawer success screen', async () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })
    mockedSubmitCheckout.mockResolvedValueOnce({
      orderId: 'order-1',
      itemsTotal: 50,
      deliveryFee: 150,
      grandTotal: 200,
    })

    render(<CartDrawer />)
    fillCheckoutForm()
    fireEvent.click(screen.getByRole('button', { name: /оформить заказ/i }))

    await waitFor(() => expect(useCartStore.getState().items).toEqual([]))

    expect(screen.getByText('Заказ принят!')).toBeInTheDocument()
    expect(useCartStore.getState().isOpen).toBe(true)
  })

  it('resets to the empty cart view when Готово is clicked after a successful order', async () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })
    mockedSubmitCheckout.mockResolvedValueOnce({
      orderId: 'order-1',
      itemsTotal: 50,
      deliveryFee: 150,
      grandTotal: 200,
    })

    render(<CartDrawer />)
    fillCheckoutForm()
    fireEvent.click(screen.getByRole('button', { name: /оформить заказ/i }))
    await waitFor(() => expect(screen.getByText('Заказ принят!')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Готово' }))

    expect(useCartStore.getState().isOpen).toBe(false)
  })

  it('on failure shows an error message and does not clear the cart', async () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })
    mockedSubmitCheckout.mockRejectedValueOnce(new Error('Server exploded'))

    render(<CartDrawer />)
    fillCheckoutForm()
    fireEvent.click(screen.getByRole('button', { name: /оформить заказ/i }))

    await waitFor(() => expect(screen.getByText('Server exploded')).toBeInTheDocument())

    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().isOpen).toBe(true)
  })
})
