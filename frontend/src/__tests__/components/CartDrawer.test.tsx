import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CartDrawer from '../../components/CartDrawer'
import useCartStore, { type CartItem } from '../../store/useCartStore'
import submitCheckout from '../../api/checkout'

vi.mock('../../api/checkout', () => ({
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
  status: 'IN_STOCK',
  ...overrides,
})

beforeEach(() => {
  mockedSubmitCheckout.mockReset()
  useCartStore.setState({ items: [], isOpen: true })
})

const chooseDelivery = (label: string) => {
  fireEvent.click(screen.getByRole('button', { name: label }))
}

const fillCheckoutForm = () => {
  fireEvent.change(screen.getByPlaceholderText('Имя и фамилия'), { target: { value: 'John Doe' } })
  fireEvent.change(screen.getByLabelText('Телефон'), { target: { value: '996700123456' } })
}

describe('CartDrawer', () => {
  it('shows an empty cart message and no form when there are no items', () => {
    render(<CartDrawer />, { wrapper: MemoryRouter })

    expect(screen.getByText('Корзина пуста.')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Имя и фамилия')).not.toBeInTheDocument()
  })

  it('is announced as a dialog and closes on Escape', () => {
    render(<CartDrawer />, { wrapper: MemoryRouter })

    expect(screen.getByRole('dialog', { name: 'Корзина' })).toHaveAttribute('aria-modal', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(useCartStore.getState().isOpen).toBe(false)
  })

  it('closes only the tariff sheet, not the cart, on Escape', async () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })
    render(<CartDrawer />, { wrapper: MemoryRouter })
    fireEvent.click(screen.getByRole('button', { name: /Тариф/ }))
    expect(screen.getByRole('dialog', { name: 'Тариф за вес посылки' })).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Тариф за вес посылки' })).not.toBeInTheDocument())
    expect(useCartStore.getState().isOpen).toBe(true)
  })

  it('offers the catalog from an empty cart and shows no totals or checkout button', () => {
    render(<CartDrawer />, { wrapper: MemoryRouter })

    expect(screen.getByRole('link', { name: 'Смотреть каталог' })).toHaveAttribute('href', '/catalog')
    expect(screen.queryByText('Итого')).not.toBeInTheDocument()
    expect(screen.queryByText(/KGS/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /оформить заказ/i })).not.toBeInTheDocument()
  })

  it('lets a long product name wrap so the price and remove button stay visible', () => {
    useCartStore.setState({
      items: [cartItem({ productName: 'Термостакан «Пастельная мечта» с двойными стенками и крышкой-поилкой' })],
      isOpen: true,
    })
    render(<CartDrawer />, { wrapper: MemoryRouter })

    const name = screen.getByText(/Пастельная мечта/)
    expect(name).toHaveClass('line-clamp-2', 'break-words')
    expect(name.parentElement).toHaveClass('min-w-0', 'flex-1')
    expect(screen.getByRole('button', { name: 'Удалить' }).parentElement).toHaveClass('shrink-0')
  })

  it('renders cart items with quantity and line total', () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })

    render(<CartDrawer />, { wrapper: MemoryRouter })

    const itemRow = screen.getByText('Custom Tumbler').closest('div')!.parentElement!
    expect(within(itemRow).getByText('black')).toBeInTheDocument()
    expect(within(itemRow).getByText('2')).toBeInTheDocument()
    expect(within(itemRow).getByText('50 KGS')).toBeInTheDocument()
  })

  it('changes quantity with plus and minus buttons and disables minus at one', () => {
    useCartStore.setState({ items: [cartItem({ quantity: 2 })], isOpen: true })

    render(<CartDrawer />, { wrapper: MemoryRouter })

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

    render(<CartDrawer />, { wrapper: MemoryRouter })
    fireEvent.click(screen.getByRole('button', { name: /удалить/i }))

    expect(useCartStore.getState().items).toEqual([])
  })

  it('disables checkout while any field is blank', () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })

    render(<CartDrawer />, { wrapper: MemoryRouter })

    expect(screen.getByRole('button', { name: /оформить заказ/i })).toBeDisabled()
  })

  it('disables checkout when fields contain only whitespace', () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })

    render(<CartDrawer />, { wrapper: MemoryRouter })
    fireEvent.change(screen.getByPlaceholderText('Имя и фамилия'), { target: { value: '   ' } })
    fireEvent.change(screen.getByLabelText('Телефон'), { target: { value: '   ' } })

    expect(screen.getByRole('button', { name: /оформить заказ/i })).toBeDisabled()
  })

  it('enables checkout once the cart has items and all fields are filled', () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })

    render(<CartDrawer />, { wrapper: MemoryRouter })
    fillCheckoutForm()

    expect(screen.getByRole('button', { name: /оформить заказ/i })).toBeEnabled()
  })

  it('labels the fields and lets the browser autofill name and phone', () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })
    render(<CartDrawer />, { wrapper: MemoryRouter })

    expect(screen.getByLabelText('Имя')).toHaveAttribute('autocomplete', 'name')
    const phone = screen.getByLabelText('Телефон')
    expect(phone).toHaveAttribute('autocomplete', 'tel')
    expect(phone).toHaveAttribute('inputmode', 'tel')
  })

  it('says what is still missing under the disabled checkout button', () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })
    render(<CartDrawer />, { wrapper: MemoryRouter })

    expect(screen.getByText('Чтобы оформить, укажите имя и телефон.')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'John Doe' } })
    expect(screen.getByText('Чтобы оформить, укажите телефон.')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Телефон'), { target: { value: '996700123456' } })
    expect(screen.queryByText(/Чтобы оформить/)).not.toBeInTheDocument()
  })

  it('jumps to the empty field when Enter is pressed too early', () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })
    render(<CartDrawer />, { wrapper: MemoryRouter })
    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'John Doe' } })

    fireEvent.keyDown(screen.getByLabelText('Имя'), { key: 'Enter' })

    expect(screen.getByLabelText('Телефон')).toHaveFocus()
    expect(mockedSubmitCheckout).not.toHaveBeenCalled()
  })

  it('places the order when the form is submitted with Enter', async () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })
    mockedSubmitCheckout.mockResolvedValue({ orderId: 'order-1', orderNumber: 1042, itemsTotal: 50, deliveryFee: 300, grandTotal: 350 })
    render(<CartDrawer />, { wrapper: MemoryRouter })
    fillCheckoutForm()

    fireEvent.keyDown(screen.getByLabelText('Телефон'), { key: 'Enter' })

    await waitFor(() => expect(mockedSubmitCheckout).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Заказ принят!')).toBeInTheDocument()
  })

  it('shows the delivery-time note and the courier fee straight away', () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })

    render(<CartDrawer />, { wrapper: MemoryRouter })

    expect(screen.getByText(/от 7 до 14 дней/)).toBeInTheDocument()
    expect(screen.getByText('300 KGS')).toBeInTheDocument()
    expect(screen.getByText('350 KGS')).toBeInTheDocument()
  })

  it('drops the fee to nothing when the customer picks the order up', () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })

    render(<CartDrawer />, { wrapper: MemoryRouter })
    chooseDelivery('Самовывоз')

    expect(screen.getByText('0 KGS')).toBeInTheDocument()
    expect(screen.getAllByText('50 KGS').length).toBeGreaterThan(0)
  })

  it('on success clears the cart and shows the in-drawer success screen', async () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })
    mockedSubmitCheckout.mockResolvedValueOnce({
      orderId: 'order-1',
      orderNumber: 1042,
      itemsTotal: 50,
      deliveryFee: 150,
      grandTotal: 200,
    })

    render(<CartDrawer />, { wrapper: MemoryRouter })
    fillCheckoutForm()
    fireEvent.click(screen.getByRole('button', { name: /оформить заказ/i }))

    await waitFor(() => expect(useCartStore.getState().items).toEqual([]))

    expect(screen.getByText('Заказ принят!')).toBeInTheDocument()
    expect(screen.getByText('Номер заказа: №1042')).toBeInTheDocument()
    expect(useCartStore.getState().isOpen).toBe(true)
  })

  it('resets to the empty cart view when Готово is clicked after a successful order', async () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })
    mockedSubmitCheckout.mockResolvedValueOnce({
      orderId: 'order-1',
      orderNumber: 1042,
      itemsTotal: 50,
      deliveryFee: 150,
      grandTotal: 200,
    })

    render(<CartDrawer />, { wrapper: MemoryRouter })
    fillCheckoutForm()
    fireEvent.click(screen.getByRole('button', { name: /оформить заказ/i }))
    await waitFor(() => expect(screen.getByText('Заказ принят!')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Готово' }))

    expect(useCartStore.getState().isOpen).toBe(false)
  })

  it('groups items into В наличии and Под заказ sections when the cart has both', () => {
    useCartStore.setState({
      items: [
        cartItem({ variantId: 1, status: 'IN_STOCK' }),
        cartItem({ variantId: 2, sku: 'MUG-PRE', productName: 'Preorder Mug', status: 'PRE_ORDER', quantity: 1 }),
      ],
      isOpen: true,
    })

    render(<CartDrawer />, { wrapper: MemoryRouter })

    expect(screen.getByText('В наличии')).toBeInTheDocument()
    expect(screen.getByText('Под заказ')).toBeInTheDocument()
    expect(screen.getByText('Custom Tumbler')).toBeInTheDocument()
    expect(screen.getByText('Preorder Mug')).toBeInTheDocument()
  })

  it('does not show group headers or a delivery-mode toggle for a single-status cart', () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })

    render(<CartDrawer />, { wrapper: MemoryRouter })

    expect(screen.queryByText('В наличии')).not.toBeInTheDocument()
    expect(screen.queryByText('Под заказ')).not.toBeInTheDocument()
    expect(screen.queryByText('Вместе')).not.toBeInTheDocument()
    expect(screen.queryByText('Раздельно')).not.toBeInTheDocument()
  })

  it('defaults to a single combined delivery fee for a mixed cart', () => {
    useCartStore.setState({
      items: [
        cartItem({ variantId: 1, status: 'IN_STOCK' }),
        cartItem({ variantId: 2, sku: 'MUG-PRE', productName: 'Preorder Mug', status: 'PRE_ORDER', quantity: 1 }),
      ],
      isOpen: true,
    })

    render(<CartDrawer />, { wrapper: MemoryRouter })

    expect(screen.getByText('300 KGS')).toBeInTheDocument()
    expect(screen.getByText('375 KGS')).toBeInTheDocument()
  })

  it('doubles the delivery fee and submits two checkouts when Раздельно is chosen', async () => {
    useCartStore.setState({
      items: [
        cartItem({ variantId: 1, status: 'IN_STOCK' }),
        cartItem({ variantId: 2, sku: 'MUG-PRE', productName: 'Preorder Mug', status: 'PRE_ORDER', quantity: 1 }),
      ],
      isOpen: true,
    })
    mockedSubmitCheckout.mockResolvedValue({ orderId: 'order-1', orderNumber: 1042, itemsTotal: 50, deliveryFee: 250, grandTotal: 300 })

    render(<CartDrawer />, { wrapper: MemoryRouter })
    fillCheckoutForm()
    fireEvent.click(screen.getByRole('button', { name: 'Раздельно' }))

    expect(screen.getAllByText('300 KGS')).toHaveLength(2)
    expect(screen.getByText('675 KGS')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /оформить заказ/i }))

    await waitFor(() => expect(mockedSubmitCheckout).toHaveBeenCalledTimes(2))
    expect(mockedSubmitCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ items: [expect.objectContaining({ sku: 'TUM-BLK-500' })] })
    )
    expect(mockedSubmitCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ items: [expect.objectContaining({ sku: 'MUG-PRE' })] })
    )
  })

  it('ignores a second click fired before the first checkout request resolves', async () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })
    let resolveCheckout: (value: Awaited<ReturnType<typeof submitCheckout>>) => void = () => {}
    mockedSubmitCheckout.mockReturnValue(
      new Promise((resolve) => {
        resolveCheckout = resolve
      })
    )

    render(<CartDrawer />, { wrapper: MemoryRouter })
    fillCheckoutForm()

    const button = screen.getByRole('button', { name: /оформить заказ/i })
    fireEvent.click(button)
    fireEvent.click(button)

    expect(mockedSubmitCheckout).toHaveBeenCalledTimes(1)

    resolveCheckout({ orderId: 'order-1', orderNumber: 1042, itemsTotal: 50, deliveryFee: 250, grandTotal: 300 })
    await waitFor(() => expect(useCartStore.getState().items).toHaveLength(0))
  })

  it('on failure shows a Russian error message and does not clear the cart', async () => {
    useCartStore.setState({ items: [cartItem()], isOpen: true })
    mockedSubmitCheckout.mockRejectedValueOnce({
      isAxiosError: true,
      message: 'Request failed with status code 409',
      response: { status: 409, data: { message: 'Not enough stock for variant: 1' } },
    })

    render(<CartDrawer />, { wrapper: MemoryRouter })
    fillCheckoutForm()
    fireEvent.click(screen.getByRole('button', { name: /оформить заказ/i }))

    await waitFor(() => expect(screen.getByText('Столько нет в наличии — уменьшите количество в корзине.')).toBeInTheDocument())
    expect(screen.queryByText(/Request failed/)).not.toBeInTheDocument()

    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().isOpen).toBe(true)
  })
})
