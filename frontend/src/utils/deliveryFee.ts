export const DELIVERY_CITIES = ['Бишкек', 'Ош', 'Талас', 'Баткен', 'Каракол', 'Манас', 'Балыкчы'] as const

const BISHKEK_FEE = 250
const OTHER_CITY_FEE = 500

// Preview only — mirrors order-service's app.delivery config; the checkout response is authoritative.
export default function resolveDeliveryFee(city: string): number {
  return city.trim().toLowerCase() === 'бишкек' ? BISHKEK_FEE : OTHER_CITY_FEE
}
