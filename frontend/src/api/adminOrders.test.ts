import { describe, it, expect, vi, beforeEach } from 'vitest'
import getOrders from './adminOrders'
import orderClient from './orderClient'
import type { OrderDto } from '../types/order'

vi.mock('./orderClient', () => ({
  default: { get: vi.fn() },
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
