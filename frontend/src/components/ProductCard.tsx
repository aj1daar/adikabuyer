import type { ProductDto } from '../types/catalog'

type ProductCardProps = {
  product: ProductDto
}

export default function ProductCard({ product }: ProductCardProps) {
  const initials = product.name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex aspect-[4/5] items-center justify-center bg-silver">
        <span className="font-grotesk text-4xl font-semibold text-ink/20">
          {initials}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        {product.category && (
          <span className="text-xs font-medium uppercase tracking-wide text-bubblegum-dark">
            {product.category}
          </span>
        )}

        <h3 className="font-grotesk text-lg font-semibold text-ink">{product.name}</h3>

        {product.description && (
          <p className="line-clamp-2 text-sm text-ink/60">{product.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-base font-semibold text-ink">
            ${product.basePrice.toFixed(2)}
          </span>
          <span className="rounded-pill bg-silver px-3 py-1 text-xs font-medium text-ink/60">
            {product.variants.length} variant{product.variants.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </div>
  )
}
