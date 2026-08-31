import { useRef, useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import type { ProductDto } from '../types/catalog'
import useCartStore from '../store/useCartStore'
import useCardTransitionStore from '../store/useCardTransitionStore'
import formatPrice from '../utils/formatPrice'
import { formatAttributeValue } from '../utils/attributeOptions'
import type { MobileColumns } from './MobileColumnsToggle'

type ProductCardProps = {
  product: ProductDto
  mobileColumns?: MobileColumns
}

export default function ProductCard({ product, mobileColumns = 1 }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const playTransition = useCardTransitionStore((state) => state.play)
  const cardRef = useRef<HTMLDivElement>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeColor, setActiveColor] = useState<string | null>(null)
  const hideDescriptionOnMobile = mobileColumns >= 2
  const hideTagsAndVariantsOnMobile = mobileColumns >= 2
  const hideCategoryOnMobile = mobileColumns >= 2
  const hideNameOnMobile = mobileColumns >= 3

  const initials = product.name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  const sellableVariants = product.variants.filter((variant) => variant.status !== 'SOLD_OUT')
  const primaryVariant = sellableVariants[0]
  const sellableColors = new Set(
    sellableVariants.map((variant) => String(variant.attributes.color ?? ''))
  )
  const colorSwatches = product.colorSwatches ?? {}
  const swatchColors = Object.keys(colorSwatches).filter((color) => sellableColors.has(color))
  const activeColorImage = activeColor
    ? (sellableVariants.find(
        (variant) => String(variant.attributes.color ?? '') === activeColor && variant.imageUrls.length > 0
      )?.imageUrls[0] ?? colorSwatches[activeColor])
    : null
  const cardImage =
    activeColorImage ??
    product.imageUrl ??
    sellableVariants.find((variant) => variant.imageUrls.length > 0)?.imageUrls[0] ??
    null
  const attributeTags = primaryVariant
    ? Object.entries(primaryVariant.attributes).map(([key, value]) => formatAttributeValue(key, value))
    : []

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
      unitPrice: primaryVariant.displayPrice ?? product.displayPrice,
      quantity,
      status: primaryVariant.status,
    })
    setQuantity(1)
  }

  const handleCardClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (!cardRef.current || !target.closest('a')) {
      return
    }
    const rect = cardRef.current.getBoundingClientRect()
    playTransition('expand', {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    })
  }

  return (
    <div
      ref={cardRef}
      onClickCapture={handleCardClick}
      className="flex flex-col overflow-hidden rounded-3xl border-2 border-black bg-white shadow-[6px_6px_0_0_#000] transition select-none hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#E8799F] active:scale-[0.98]"
    >
      <Link
        to={`/catalog/${product.id}`}
        className="flex aspect-[4/5] items-center justify-center overflow-hidden border-b-2 border-black bg-silver"
      >
        {cardImage ? (
          <img
            src={cardImage}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-grotesk text-4xl font-semibold text-ink/20">
            {initials}
          </span>
        )}
      </Link>

      <div className={`flex flex-1 flex-col gap-2 p-5 ${mobileColumns >= 2 ? 'max-sm:p-3' : ''}`}>
        {product.category && (
          <span
            className={`font-grotesk text-xs font-bold uppercase tracking-wide text-bubblegum-dark ${
              hideCategoryOnMobile ? 'max-sm:hidden' : ''
            }`}
          >
            {product.category}
          </span>
        )}

        <Link
          to={`/catalog/${product.id}`}
          className={hideNameOnMobile ? 'max-sm:hidden' : ''}
        >
          <h3
            className={`font-grotesk text-lg font-bold text-ink transition hover:text-bubblegum-dark ${
              hideDescriptionOnMobile ? 'max-sm:truncate max-sm:text-xs' : ''
            }`}
          >
            {product.name}
          </h3>
        </Link>

        {product.description && (
          <p
            className={`line-clamp-2 text-sm text-ink/60 ${hideDescriptionOnMobile ? 'max-sm:hidden' : ''}`}
          >
            {product.description}
          </p>
        )}

        {attributeTags.length > 0 && (
          <div className={`flex flex-wrap gap-1 ${hideTagsAndVariantsOnMobile ? 'max-sm:hidden' : ''}`}>
            {attributeTags.map((tag, index) => (
              <span
                key={index}
                className="rounded-pill border-2 border-black bg-silver px-2 py-0.5 font-grotesk text-xs font-bold text-ink"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {swatchColors.length > 0 && (
          <div className={`flex flex-wrap gap-2 ${hideTagsAndVariantsOnMobile ? 'max-sm:hidden' : ''}`}>
            {swatchColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setActiveColor((current) => (current === color ? null : color))}
                aria-label={color}
                aria-pressed={activeColor === color}
                className={`h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 transition ${
                  activeColor === color
                    ? 'border-bubblegum-dark shadow-[2px_2px_0_0_#E8799F]'
                    : 'border-black hover:border-bubblegum-dark'
                }`}
              >
                <img src={colorSwatches[color]} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div
          className={`mt-auto flex items-center justify-between gap-2 pt-3 ${
            hideDescriptionOnMobile ? 'max-sm:mt-0 max-sm:pt-1' : ''
          }`}
        >
          <span
            className={`min-w-0 font-grotesk text-base font-bold text-ink ${
              hideNameOnMobile ? 'max-sm:text-xs' : hideDescriptionOnMobile ? 'max-sm:text-sm' : ''
            }`}
          >
            {formatPrice(product.displayPrice)}
          </span>
        </div>

        {hideDescriptionOnMobile && (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!primaryVariant}
            aria-label="Добавить в корзину"
            className="hidden w-full items-center justify-center rounded-pill border-2 border-black bg-ink py-2 text-white transition hover:bg-bubblegum-dark disabled:cursor-not-allowed disabled:opacity-40 max-sm:flex"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M6 7h12l-1 13H7L6 7z" />
              <path d="M9 7V5a3 3 0 0 1 6 0v2" />
            </svg>
          </button>
        )}

        <div className={`mt-3 flex items-center gap-2 ${hideDescriptionOnMobile ? 'max-sm:hidden' : ''}`}>
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={!primaryVariant || quantity <= 1}
            aria-label="Уменьшить количество"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white font-grotesk text-base font-bold text-ink transition hover:bg-bubblegum hover:text-white active:scale-90 active:bg-bubblegum-dark active:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            −
          </button>
          <span className="min-w-6 text-center font-grotesk text-sm font-bold text-ink">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((current) => current + 1)}
            disabled={!primaryVariant}
            aria-label="Увеличить количество"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white font-grotesk text-base font-bold text-ink transition hover:bg-bubblegum hover:text-white active:scale-90 active:bg-bubblegum-dark active:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!primaryVariant}
            className="flex-1 rounded-pill border-2 border-black bg-ink px-4 py-2 font-grotesk text-sm font-bold text-white transition hover:bg-bubblegum-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            В корзину
          </button>
        </div>
      </div>
    </div>
  )
}
