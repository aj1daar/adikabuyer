import type { VariantDto } from '../types/catalog'

export function stringifyAttributes(attributes: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(attributes).map(([key, value]) => [key, String(value)])
  )
}

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

function matchCount(variant: VariantDto, target: Record<string, string>): number {
  return Object.entries(target).reduce(
    (count, [key, value]) => (String(variant.attributes[key] ?? '') === value ? count + 1 : count),
    0
  )
}

/**
 * Pick the variant that best matches the current selection with `key` overridden to
 * `value`. Always returns a variant that actually has `key === value`; other
 * attributes are relaxed to whichever real variant is closest.
 */
export function selectVariant(
  variants: VariantDto[],
  current: VariantDto | undefined,
  key: string,
  value: string
): VariantDto | undefined {
  const candidates = variants.filter((variant) => String(variant.attributes[key] ?? '') === value)
  if (candidates.length === 0) {
    return current
  }
  const target = { ...(current ? stringifyAttributes(current.attributes) : {}), [key]: value }
  return candidates.reduce((best, variant) =>
    matchCount(variant, target) > matchCount(best, target) ? variant : best
  )
}

/**
 * True when some variant has `key === value` while still matching every other
 * attribute of the current selection — i.e. picking it changes nothing else.
 */
export function isCombinationAvailable(
  variants: VariantDto[],
  current: VariantDto | undefined,
  key: string,
  value: string
): boolean {
  const rest = current ? stringifyAttributes(current.attributes) : {}
  return variants.some((variant) => {
    if (String(variant.attributes[key] ?? '') !== value) {
      return false
    }
    return Object.entries(rest).every(
      ([otherKey, otherValue]) => otherKey === key || String(variant.attributes[otherKey] ?? '') === otherValue
    )
  })
}
