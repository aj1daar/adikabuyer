import type { VariantDto } from '../types/catalog'

/** Attribute keys present on any variant, in first-seen order. */
export function attributeKeys(variants: VariantDto[]): string[] {
  const keys: string[] = []
  for (const variant of variants) {
    for (const key of Object.keys(variant.attributes)) {
      if (!keys.includes(key)) {
        keys.push(key)
      }
    }
  }
  return keys
}

/** Distinct values for one attribute key across all variants, in first-seen order. */
export function attributeValues(variants: VariantDto[], key: string): string[] {
  const values: string[] = []
  for (const variant of variants) {
    const raw = variant.attributes[key]
    if (raw === undefined || raw === null) {
      continue
    }
    const value = String(raw)
    if (!values.includes(value)) {
      values.push(value)
    }
  }
  return values
}

/**
 * Best variant for an explicit, possibly partial selection. Empty selection →
 * the first variant. `priorityKey` (the attribute the shopper just touched) is
 * treated as a hard constraint when any variant can honour it; the remaining
 * picks are then matched as closely as possible, first-seen breaking ties.
 */
export function resolveVariant(
  variants: VariantDto[],
  selection: Record<string, string>,
  priorityKey?: string
): VariantDto | undefined {
  if (variants.length === 0) {
    return undefined
  }
  const entries = Object.entries(selection)
  if (entries.length === 0) {
    return variants[0]
  }
  let pool = variants
  if (priorityKey && selection[priorityKey] !== undefined) {
    const hard = variants.filter(
      (variant) => String(variant.attributes[priorityKey] ?? '') === selection[priorityKey]
    )
    if (hard.length > 0) {
      pool = hard
    }
  }
  const score = (variant: VariantDto) =>
    entries.reduce((n, [key, value]) => (String(variant.attributes[key] ?? '') === value ? n + 1 : n), 0)
  return pool.reduce((best, variant) => (score(variant) > score(best) ? variant : best))
}

/**
 * True when some variant has `key === value` while matching every *other* picked
 * attribute — i.e. adding this pick keeps a real variant reachable.
 */
export function isValueAvailable(
  variants: VariantDto[],
  selection: Record<string, string>,
  key: string,
  value: string
): boolean {
  return variants.some((variant) => {
    if (String(variant.attributes[key] ?? '') !== value) {
      return false
    }
    return Object.entries(selection).every(
      ([otherKey, otherValue]) => otherKey === key || String(variant.attributes[otherKey] ?? '') === otherValue
    )
  })
}

