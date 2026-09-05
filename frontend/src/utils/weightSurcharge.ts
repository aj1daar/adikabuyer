// The shop's own price list for the weight of a parcel, not a formula: the rate is
// 12 USD per kg at 88.7 KGS/USD, but every step is rounded up by hand, so the numbers
// below are quoted verbatim and must not be recomputed.
export const WEIGHT_RATE_USD_PER_KG = 12
export const USD_RATE = 88.7

export type WeightStep = {
  /** Parcel weight in kilograms. */
  kg: number
  /** What the shop charges for that weight, in KGS. */
  fee: number
}

export const WEIGHT_STEPS: readonly WeightStep[] = [
  { kg: 0.1, fee: 110 },
  { kg: 0.2, fee: 220 },
  { kg: 0.3, fee: 330 },
  { kg: 0.4, fee: 440 },
  { kg: 0.5, fee: 550 },
  { kg: 0.6, fee: 650 },
  { kg: 0.7, fee: 750 },
  { kg: 0.8, fee: 870 },
  { kg: 0.9, fee: 970 },
]

/** From a kilogram up the parcel is priced in conversation, not from the table. */
export const NEGOTIABLE_FROM_KG = 1

export function formatWeight(kg: number): string {
  return `${kg.toFixed(1).replace('.', ',')} кг`
}
