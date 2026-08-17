import type { ProductDto, VariantDto } from '../types/catalog'

function similarity(a: VariantDto, b: VariantDto): number {
  return Object.entries(a.attributes).reduce(
    (score, [key, value]) => (b.attributes[key] === value ? score + 1 : score),
    0
  )
}

export default function resolveVariantImage(
  product: ProductDto,
  variant: VariantDto | undefined
): string | null {
  if (!variant) {
    return product.imageUrl
  }
  if (variant.imageUrl) {
    return variant.imageUrl
  }

  const candidates = product.variants.filter(
    (other) => other.id !== variant.id && other.imageUrl
  )
  if (candidates.length > 0) {
    const best = candidates.reduce((closest, other) =>
      similarity(variant, other) > similarity(variant, closest) ? other : closest
    )
    return best.imageUrl
  }

  return product.imageUrl
}
