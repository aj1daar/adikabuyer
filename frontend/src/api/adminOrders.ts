import orderClient from './orderClient'
import type { OrderDto } from '../types/order'

export default async function getOrders(): Promise<OrderDto[]> {
  const response = await orderClient.get<OrderDto[]>('')
  return response.data
}
