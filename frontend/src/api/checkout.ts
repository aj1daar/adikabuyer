import orderClient from './orderClient'
import type { CheckoutRequest, CheckoutResponse } from '../types/order'

export default async function submitCheckout(payload: CheckoutRequest): Promise<CheckoutResponse> {
  const response = await orderClient.post<CheckoutResponse>('/checkout', payload)
  return response.data
}
