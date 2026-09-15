import type { ProductDto } from '../../types/catalog'
import formatPrice from '../../utils/formatPrice'
import { VARIANT_STATUS_LABEL, describeAttributes, isArchived } from '../../utils/adminProducts'

type Variant = ProductDto['variants'][number]

type ProductCardListProps = {
  products: ProductDto[]
  onEdit: (product: ProductDto) => void
  onDeleteProduct: (product: ProductDto) => void
  onDeleteVariant: (product: ProductDto, variant: Variant) => void
}

/**
 * Phone layout of the admin product table: one Neo-Y2K card per product with its actions
 * up top and every variant stacked underneath, so nothing hides behind a sideways scroll.
 */
export default function ProductCardList({ products, onEdit, onDeleteProduct, onDeleteVariant }: ProductCardListProps) {
  return (
    <ul className="flex flex-col gap-4 pb-1 pr-1">
      {products.map((product) => (
        <li
          key={product.id}
          className="rounded-2xl border-2 border-black bg-white p-4 shadow-[4px_4px_0_0_#000]"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="min-w-0 break-words font-grotesk text-base font-bold text-ink">{product.name}</h2>
            {isArchived(product) && (
              <span className="rounded-pill border-2 border-black bg-silver px-2 py-0.5 font-grotesk text-[10px] font-bold uppercase tracking-wide text-ink/70">
                В архиве
              </span>
            )}
          </div>
          <p className="mt-1 font-grotesk text-xs font-bold uppercase tracking-wide text-ink/50">
            {product.category ?? 'без категории'} ·{' '}
            {product.variants.length === 0 ? 'без вариантов' : `вариантов: ${product.variants.length}`}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onEdit(product)}
              className="min-h-11 rounded-pill border-2 border-black bg-ink px-4 py-2 font-grotesk text-sm font-bold text-white shadow-[3px_3px_0_0_#E8799F] hover:bg-bubblegum-dark"
            >
              Изменить
            </button>
            <button
              type="button"
              onClick={() => onDeleteProduct(product)}
              className="min-h-11 rounded-pill border-2 border-black bg-white px-4 py-2 font-grotesk text-sm font-bold text-ink hover:bg-bubblegum hover:text-white"
            >
              Удалить товар
            </button>
          </div>

          {product.variants.length > 0 && (
            <ul className="mt-4 flex flex-col gap-2 border-t-2 border-black/10 pt-3">
              {product.variants.map((variant) => (
                <li key={variant.id} className="rounded-xl border-2 border-black/15 bg-silver/50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-grotesk text-sm font-bold text-ink">{variant.sku}</p>
                      {Object.keys(variant.attributes).length > 0 && (
                        <p className="mt-0.5 break-words text-xs text-ink/60">{describeAttributes(variant.attributes)}</p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-pill border-2 border-black bg-white px-2 py-0.5 font-grotesk text-[10px] font-bold uppercase tracking-wide text-ink">
                      {VARIANT_STATUS_LABEL[variant.status] ?? variant.status}
                    </span>
                  </div>

                  <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-ink/50">Цена</dt>
                      <dd className="font-grotesk font-bold text-ink">
                        {formatPrice(variant.displayPrice ?? product.displayPrice)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink/50">Закупка</dt>
                      <dd className="text-ink/70">{formatPrice(variant.priceOverride ?? product.basePrice)}</dd>
                    </div>
                    <div>
                      <dt className="text-ink/50">Остаток</dt>
                      <dd className="text-ink/70">{variant.stockQuantity}</dd>
                    </div>
                  </dl>

                  {product.variants.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => onDeleteVariant(product, variant)}
                      className="mt-2 min-h-11 rounded-pill border-2 border-black/30 bg-white px-4 py-2 font-grotesk text-xs font-bold text-ink/70 hover:border-black hover:text-bubblegum-dark"
                    >
                      Удалить вариант
                    </button>
                  ) : (
                    <p className="mt-2 text-xs text-ink/40">Единственный вариант — удаляется вместе с товаром</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}
