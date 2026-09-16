export type CheckoutItemPayload = {
  variantId: number
  productName: string
  sku: string
  attributes: Record<string, unknown>
  unitPrice: number
  quantity: number
}

export type CheckoutRequest = {
  customerName: string
  customerPhone: string
  region: string
  items: CheckoutItemPayload[]
}

export type CheckoutResponse = {
  orderId: string
  /** short number the customer can quote when we call ("№1042") */
  orderNumber: number
  itemsTotal: number
  deliveryFee: number
  grandTotal: number
}

export type OrderItemDto = {
  variantId: number
  productName: string
  sku: string
  attributes: Record<string, unknown>
  unitPrice: number
  quantity: number
}

export type OrderStatus = 'NEW' | 'CONFIRMED' | 'PURCHASED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

/** Admin edit of an order; only the fields sent are changed (empty adminNote clears it). */
export type OrderUpdatePayload = {
  status?: OrderStatus
  weightFee?: number
  adminNote?: string
}

export type OrderDto = {
  id: string
  number: number
  customerName: string
  customerPhone: string
  region: string
  itemsTotal: number
  deliveryFee: number
  grandTotal: number
  createdAt: string
  status: OrderStatus
  statusUpdatedAt: string | null
  /** parcel-weight surcharge agreed at confirmation; null until known */
  weightFee: number | null
  /** grandTotal + weightFee; null until the weight fee is known */
  finalTotal: number | null
  adminNote: string | null
  items: OrderItemDto[]
}
