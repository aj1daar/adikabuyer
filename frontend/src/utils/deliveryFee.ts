// The shop works in Бишкек only, so the customer picks how the order is handed over,
// not which city it flies to. These two strings are what the cart sends as `region`.
export const COURIER = 'Бишкек'
export const PICKUP = 'Самовывоз'

export const DELIVERY_OPTIONS = [
  { value: COURIER, label: 'Доставка', hint: 'Курьер по Бишкеку' },
  { value: PICKUP, label: 'Самовывоз', hint: 'Адрес и время согласуем в переписке' },
] as const

const COURIER_FEE = 300
const PICKUP_FEE = 0

// Preview only — mirrors order-service's app.delivery config; the checkout response is authoritative.
export default function resolveDeliveryFee(region: string): number {
  return region.trim().toLowerCase() === PICKUP.toLowerCase() ? PICKUP_FEE : COURIER_FEE
}
