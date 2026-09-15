import orderClient from './orderClient'
import type { CheckoutRequest, CheckoutResponse } from '../types/order'

export default async function submitCheckout(payload: CheckoutRequest): Promise<CheckoutResponse> {
  // CartDrawer shows the failure inside the drawer, so no toast on top of it.
  const response = await orderClient.post<CheckoutResponse>('/checkout', payload, { skipErrorToast: true })
  return response.data
}
