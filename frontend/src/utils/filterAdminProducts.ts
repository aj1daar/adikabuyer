import type { ProductDto } from '../types/catalog'

/** Everything about a product an admin might reasonably type into the search box. */
function haystack(product: ProductDto): string {
  return [
    product.name,
    product.description ?? '',
    product.category ?? '',
    product.brand ?? '',
    ...(product.labels ?? []),
    ...product.variants.flatMap((variant) => [
      variant.sku,
      ...Object.values(variant.attributes).map((value) => String(value ?? '')),
    ]),
  ]
    .join(' ')
    .toLowerCase()
}

/**
 * Filters the admin product table. Every word of the query has to appear somewhere in the
 * product — order doesn't matter, so "чёрный термос" finds a термостакан with a чёрный
 * variant. A blank query returns the list untouched.
 */
export default function filterAdminProducts(products: ProductDto[], query: string): ProductDto[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) {
    return products
  }
  return products.filter((product) => {
    const text = haystack(product)
    return terms.every((term) => text.includes(term))
  })
}
