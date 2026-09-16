import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import OrdersTable from '../../../components/admin/OrdersTable'
import type { OrderDto } from '../../../types/order'

const order: OrderDto = {
  id: 'order-1',
  number: 1042,
  customerName: 'Jane Doe',
  customerPhone: '+996 (700) 00-00-00',
  region: 'Бишкек',
  itemsTotal: 50,
  deliveryFee: 150,
  grandTotal: 200,
  createdAt: '2026-01-01T00:00:00Z',
  status: 'NEW',
  statusUpdatedAt: null,
  weightFee: null,
  finalTotal: null,
  adminNote: null,
  items: [{ variantId: 1, productName: 'Tumbler', sku: 'TUM-1', attributes: {}, unitPrice: 25, quantity: 2 }],
}

function renderTable(orders: OrderDto[] = [order], overrides: Partial<Parameters<typeof OrdersTable>[0]> = {}) {
  const props = {
    orders,
    loading: false,
    error: null,
    onUpdate: vi.fn().mockResolvedValue(true),
    onDelete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  render(<OrdersTable {...props} />)
  return props
}

describe('OrdersTable', () => {
  it('shows a loading message on first load', () => {
    renderTable([], { loading: true })

    expect(screen.getByText('Загрузка заказов...')).toBeInTheDocument()
  })

  it('shows an error message', () => {
    renderTable([], { error: 'Network error' })

    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('shows an empty state when there are no orders', () => {
    renderTable([])

    expect(screen.getByText('Заказов пока нет.')).toBeInTheDocument()
  })

  it('renders the number, status, customer with a tap-to-call phone, items and total', () => {
    renderTable()

    expect(screen.getByText('№1042')).toBeInTheDocument()
    expect(screen.getByText('Новый')).toBeInTheDocument()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '+996 (700) 00-00-00' })).toHaveAttribute('href', 'tel:+996700000000')
    expect(screen.getByText('2x Tumbler')).toBeInTheDocument()
    expect(screen.getByText('200 KGS')).toBeInTheDocument()
    expect(screen.getByText('без учёта веса')).toBeInTheDocument()
  })

  it('shows the final total once the weight fee is agreed, plus the admin note', () => {
    renderTable([{ ...order, status: 'CONFIRMED', weightFee: 110, finalTotal: 310, adminNote: 'чёрный вместо белого' }])

    expect(screen.getByText('310 KGS')).toBeInTheDocument()
    expect(screen.getByText('вкл. вес 110 KGS')).toBeInTheDocument()
    expect(screen.getByText('чёрный вместо белого')).toBeInTheDocument()
  })

  it('moves an order to its next step with one tap', async () => {
    const props = renderTable()

    fireEvent.click(screen.getByRole('button', { name: '→ Подтвердить' }))

    await waitFor(() => expect(props.onUpdate).toHaveBeenCalledWith(order, { status: 'CONFIRMED' }))
  })

  it('asks before cancelling, then cancels', async () => {
    const props = renderTable()

    fireEvent.click(screen.getByRole('button', { name: 'Отменить' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/товары вернутся в наличие/)).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Отменить заказ' }))

    await waitFor(() => expect(props.onUpdate).toHaveBeenCalledWith(order, { status: 'CANCELLED' }))
  })

  it('asks before deleting, then deletes', async () => {
    const props = renderTable()

    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Удалить' }))

    await waitFor(() => expect(props.onDelete).toHaveBeenCalledWith(order))
  })

  it('offers no next step or cancel for a delivered order', () => {
    renderTable([{ ...order, status: 'DELIVERED' }])

    expect(screen.queryByRole('button', { name: /^→/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Отменить' })).not.toBeInTheDocument()
  })

  it('filters by status with counts', () => {
    renderTable([order, { ...order, id: 'order-2', number: 1043, customerName: 'Bob', status: 'SHIPPED' }])

    fireEvent.click(screen.getByRole('button', { name: 'В работе (1)' }))

    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Все (2)' })).toBeInTheDocument()
  })

  it('saves the weight fee and note from the inline editor', async () => {
    const props = renderTable()

    fireEvent.click(screen.getByRole('button', { name: 'Вес и заметка' }))
    fireEvent.change(screen.getByPlaceholderText('Согласованная сумма за вес'), { target: { value: '330' } })
    fireEvent.change(screen.getByPlaceholderText('Что договорились с клиентом'), { target: { value: 'самовывоз в пятницу' } })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => expect(props.onUpdate).toHaveBeenCalledWith(order, { weightFee: 330, adminNote: 'самовывоз в пятницу' }))
    await waitFor(() => expect(screen.queryByPlaceholderText('Согласованная сумма за вес')).not.toBeInTheDocument())
  })
})
