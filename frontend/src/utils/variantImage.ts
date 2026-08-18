import type { ProductDto, VariantDto } from '../types/catalog'

function similarity(a: VariantDto, b: VariantDto): number {
  return Object.entries(a.attributes).reduce(
    (score, [key, value]) => (b.attributes[key] === value ? score + 1 : score),
    0
  )
}

export function resolveVariantGallery(
  product: ProductDto,
  variant: VariantDto | undefined
): string[] {
  if (!variant) {
    return product.imageUrl ? [product.imageUrl] : []
  }
  if (variant.imageUrls.length > 0) {
    return variant.imageUrls
  }

  const candidates = product.variants.filter(
    (other) => other.id !== variant.id && other.imageUrls.length > 0
  )
  if (candidates.length > 0) {
    const best = candidates.reduce((closest, other) =>
      similarity(variant, other) > similarity(variant, closest) ? other : closest
    )
    return best.imageUrls
  }

  return product.imageUrl ? [product.imageUrl] : []
}

export default function resolveVariantImage(
  product: ProductDto,
  variant: VariantDto | undefined
): string | null {
  return resolveVariantGallery(product, variant)[0] ?? null
}
