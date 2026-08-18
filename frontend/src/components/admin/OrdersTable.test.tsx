import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OrdersTable from './OrdersTable'
import type { OrderDto } from '../../types/order'

const order: OrderDto = {
  id: 'order-1',
  customerName: 'Jane Doe',
  customerPhone: '996700000000',
  region: 'bishkek',
  itemsTotal: 50,
  deliveryFee: 150,
  grandTotal: 200,
  createdAt: '2026-01-01T00:00:00Z',
  items: [{ variantId: 1, productName: 'Tumbler', sku: 'TUM-1', attributes: {}, unitPrice: 50, quantity: 2 }],
}

const noop = () => {}

describe('OrdersTable', () => {
  it('shows a loading message on first load', () => {
    render(<OrdersTable orders={[]} loading error={null} onDelete={noop} />)

    expect(screen.getByText('Загрузка заказов...')).toBeInTheDocument()
  })

  it('shows an error message', () => {
    render(<OrdersTable orders={[]} loading={false} error="Network error" onDelete={noop} />)

    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('shows an empty state when there are no orders', () => {
    render(<OrdersTable orders={[]} loading={false} error={null} onDelete={noop} />)

    expect(screen.getByText('Заказов пока нет.')).toBeInTheDocument()
  })

  it('renders order details and item summary', () => {
    render(<OrdersTable orders={[order]} loading={false} error={null} onDelete={noop} />)

    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('996700000000')).toBeInTheDocument()
    expect(screen.getByText('bishkek')).toBeInTheDocument()
    expect(screen.getByText('2x Tumbler')).toBeInTheDocument()
    expect(screen.getByText('200 KGS')).toBeInTheDocument()
  })

  it('calls onDelete with the order when Удалить is clicked', () => {
    const onDelete = vi.fn()
    render(<OrdersTable orders={[order]} loading={false} error={null} onDelete={onDelete} />)

    fireEvent.click(screen.getByRole('button', { name: /удалить/i }))

    expect(onDelete).toHaveBeenCalledWith(order)
  })
})
