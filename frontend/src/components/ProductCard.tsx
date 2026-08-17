import type { ProductDto } from '../types/catalog'
import useCartStore from '../store/useCartStore'

type ProductCardProps = {
  product: ProductDto
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)

  const initials = product.name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  const primaryVariant = product.variants[0]
  const attributeSummary = primaryVariant
    ? Object.values(primaryVariant.attributes).join(', ')
    : null

  const handleAddToCart = () => {
    if (!primaryVariant) {
      return
    }
    addItem({
      variantId: primaryVariant.id,
      productId: product.id,
      productName: product.name,
      sku: primaryVariant.sku,
      attributes: primaryVariant.attributes,
      unitPrice: primaryVariant.priceOverride ?? product.basePrice,
      quantity: 1,
    })
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border-2 border-black bg-white shadow-[6px_6px_0_0_#000] transition select-none hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#E8799F] active:scale-[0.98]">
      <div className="flex aspect-[4/5] items-center justify-center overflow-hidden border-b-2 border-black bg-silver">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-grotesk text-4xl font-semibold text-ink/20">
            {initials}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        {product.category && (
          <span className="font-grotesk text-xs font-bold uppercase tracking-wide text-bubblegum-dark">
            {product.category}
          </span>
        )}

        <h3 className="font-grotesk text-lg font-bold text-ink">{product.name}</h3>

        {product.description && (
          <p className="line-clamp-2 text-sm text-ink/60">{product.description}</p>
        )}

        {attributeSummary && <p className="text-xs text-ink/50">{attributeSummary}</p>}

        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-grotesk text-base font-bold text-ink">
            {product.basePrice.toFixed(2)} ⃀
          </span>
          <span className="rounded-pill border-2 border-black bg-silver px-3 py-1 font-grotesk text-xs font-bold text-ink">
            Вариантов: {product.variants.length}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!primaryVariant}
          className="mt-3 rounded-pill border-2 border-black bg-ink px-4 py-2 font-grotesk text-sm font-bold text-white transition hover:bg-bubblegum-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          В корзину
        </button>
      </div>
    </div>
  )
}
