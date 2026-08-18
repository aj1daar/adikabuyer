import { describe, it, expect, vi, beforeEach } from 'vitest'
import submitCheckout from './checkout'
import orderClient from './orderClient'
import type { CheckoutRequest, CheckoutResponse } from '../types/order'

vi.mock('./orderClient', () => ({
  default: { post: vi.fn() },
}))

const mockedPost = vi.mocked(orderClient.post)

const payload: CheckoutRequest = {
  customerName: 'John Doe',
  customerPhone: '996700123456',
  region: 'bishkek',
  items: [
    {
      variantId: 1,
      productName: 'Custom Tumbler',
      sku: 'TUM-BLK-500',
      attributes: { color: 'black' },
      unitPrice: 25,
      quantity: 2,
    },
  ],
}

const response: CheckoutResponse = {
  orderId: 'order-1',
  itemsTotal: 50,
  deliveryFee: 150,
  grandTotal: 200,
}

beforeEach(() => {
  mockedPost.mockReset()
})

describe('submitCheckout', () => {
  it('posts the cart payload to the checkout endpoint', async () => {
    mockedPost.mockResolvedValueOnce({ data: response } as never)

    await submitCheckout(payload)

    expect(mockedPost).toHaveBeenCalledWith('/checkout', payload)
  })

  it('resolves with the response data', async () => {
    mockedPost.mockResolvedValueOnce({ data: response } as never)

    const result = await submitCheckout(payload)

    expect(result).toEqual(response)
  })

  it('propagates the error when the request fails', async () => {
    mockedPost.mockRejectedValueOnce(new Error('Network Error'))

    await expect(submitCheckout(payload)).rejects.toThrow('Network Error')
  })
})
