const COMMISSION_MULTIPLIER = 1.15

// Preview only — mirrors catalog-service's PriceCalculator; the API response is authoritative.
export default function previewDisplayPrice(original: number): number {
  return Math.round((original * COMMISSION_MULTIPLIER) / 100) * 100
}
