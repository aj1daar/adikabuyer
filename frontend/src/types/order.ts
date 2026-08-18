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

export type OrderDto = {
  id: string
  customerName: string
  customerPhone: string
  region: string
  itemsTotal: number
  deliveryFee: number
  grandTotal: number
  createdAt: string
  items: OrderItemDto[]
}
