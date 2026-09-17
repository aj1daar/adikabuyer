import { describe, it, expect, vi, beforeEach } from 'vitest'
import getOrders, { updateOrder } from '../../api/adminOrders'
import orderClient from '../../api/orderClient'
import type { OrderDto } from '../../types/order'

vi.mock('../../api/orderClient', () => ({
  default: { get: vi.fn(), patch: vi.fn() },
}))

const mockedGet = vi.mocked(orderClient.get)

const order: OrderDto = {
  id: 'order-1',
  customerName: 'John Doe',
  customerPhone: '996700123456',
  region: 'bishkek',
  itemsTotal: 50,
  deliveryFee: 150,
  grandTotal: 200,
  createdAt: '2026-01-01T00:00:00Z',
  number: 1042,
  status: 'NEW',
  statusUpdatedAt: null,
  weightFee: null,
  finalTotal: null,
  adminNote: null,
  items: [],
}

beforeEach(() => {
  mockedGet.mockReset()
})

describe('getOrders', () => {
  it('fetches the order list and resolves with the response data', async () => {
    mockedGet.mockResolvedValueOnce({ data: [order] } as never)

    const result = await getOrders()

    expect(mockedGet).toHaveBeenCalledWith('')
    expect(result).toEqual([order])
  })

  it('propagates the error when the request fails', async () => {
    mockedGet.mockRejectedValueOnce(new Error('Network Error'))

    await expect(getOrders()).rejects.toThrow('Network Error')
  })
})

describe('updateOrder', () => {
  it('patches only the fields it is given and resolves with the updated order', async () => {
    const mockedPatch = vi.mocked(orderClient.patch)
    mockedPatch.mockResolvedValueOnce({ data: { ...order, status: 'CONFIRMED', weightFee: 110 } } as never)

    const result = await updateOrder('order-1', { status: 'CONFIRMED', weightFee: 110 })

    expect(mockedPatch).toHaveBeenCalledWith('/order-1', { status: 'CONFIRMED', weightFee: 110 })
    expect(result.status).toBe('CONFIRMED')
  })
})
