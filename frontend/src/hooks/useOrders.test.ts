import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import useOrders from './useOrders'
import getOrders from '../api/adminOrders'
import type { OrderDto } from '../types/order'

vi.mock('../api/adminOrders')

const mockedGetOrders = vi.mocked(getOrders)

const order: OrderDto = {
  id: 'order-1',
  customerName: 'Jane Doe',
  customerPhone: '996700000000',
  region: 'bishkek',
  itemsTotal: 50,
  deliveryFee: 150,
  grandTotal: 200,
  createdAt: '2026-01-01T00:00:00Z',
  items: [],
}

beforeEach(() => {
  mockedGetOrders.mockReset()
})

describe('useOrders', () => {
  it('does not fetch when disabled', () => {
    renderHook(() => useOrders(false))

    expect(mockedGetOrders).not.toHaveBeenCalled()
  })

  it('fetches and returns orders when enabled', async () => {
    mockedGetOrders.mockResolvedValueOnce([order])

    const { result } = renderHook(() => useOrders(true))

    await waitFor(() => expect(result.current.orders).toEqual([order]))
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('sets an error message when the fetch fails', async () => {
    mockedGetOrders.mockRejectedValueOnce(new Error('boom'))

    const { result } = renderHook(() => useOrders(true))

    await waitFor(() => expect(result.current.error).toBe('boom'))
    expect(result.current.orders).toEqual([])
  })
})
