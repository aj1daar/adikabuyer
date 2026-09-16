import type { OrderStatus } from '../types/order'

/** Buyer flow order, mirroring order-service's OrderStatus enum. */
export const ORDER_FLOW: OrderStatus[] = ['NEW', 'CONFIRMED', 'PURCHASED', 'SHIPPED', 'DELIVERED']

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: 'Новый',
  CONFIRMED: 'Подтверждён',
  PURCHASED: 'Выкуплен',
  SHIPPED: 'В пути',
  DELIVERED: 'Доставлен',
  CANCELLED: 'Отменён',
}

/** Wording on the one-tap "advance" button: what the admin is doing, not the state name. */
export const ORDER_NEXT_ACTION: Partial<Record<OrderStatus, string>> = {
  NEW: 'Подтвердить',
  CONFIRMED: 'Выкуплен',
  PURCHASED: 'Отправлен',
  SHIPPED: 'Доставлен',
}

/** Neo-Y2K sticker colours per status: pink for what needs attention, ink for done. */
export const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  NEW: 'bg-bubblegum text-ink',
  CONFIRMED: 'bg-bubblegum-light text-ink',
  PURCHASED: 'bg-silver text-ink',
  SHIPPED: 'bg-white text-ink',
  DELIVERED: 'bg-ink text-white',
  CANCELLED: 'bg-white text-ink/40 line-through',
}

export function isFinalStatus(status: OrderStatus): boolean {
  return status === 'DELIVERED' || status === 'CANCELLED'
}

/** The next step in the buyer flow, or null once the order is delivered or cancelled. */
export function nextStatus(status: OrderStatus): OrderStatus | null {
  if (isFinalStatus(status)) {
    return null
  }
  return ORDER_FLOW[ORDER_FLOW.indexOf(status) + 1] ?? null
}

export type OrderFilter = 'all' | 'new' | 'active' | 'delivered' | 'cancelled'

export const ORDER_FILTERS: { value: OrderFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'new', label: 'Новые' },
  { value: 'active', label: 'В работе' },
  { value: 'delivered', label: 'Доставлены' },
  { value: 'cancelled', label: 'Отменены' },
]

export function matchesOrderFilter(status: OrderStatus, filter: OrderFilter): boolean {
  switch (filter) {
    case 'new':
      return status === 'NEW'
    case 'active':
      return status === 'CONFIRMED' || status === 'PURCHASED' || status === 'SHIPPED'
    case 'delivered':
      return status === 'DELIVERED'
    case 'cancelled':
      return status === 'CANCELLED'
    default:
      return true
  }
}
