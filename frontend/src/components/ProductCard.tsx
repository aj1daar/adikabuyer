import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { ProductDto } from '../types/catalog'
import useCartStore from '../store/useCartStore'
import useCardTransitionStore from '../store/useCardTransitionStore'
import formatPrice from '../utils/formatPrice'
import truncate from '../utils/truncate'
import notifyAddedToCart from '../utils/notifyAddedToCart'
import useIsMobileViewport from '../hooks/useIsMobileViewport'
import useStockLimit from '../hooks/useStockLimit'
import { COLOR_ATTRIBUTE_KEY, formatAttributeValue } from '../utils/attributeOptions'
import { resolveVariantGallery } from '../utils/variantImage'
import type { MobileColumns } from './MobileColumnsToggle'
import ProductLabels from './ProductLabels'

const MAX_SWATCHES_DESKTOP = 4
const MAX_SWATCHES_MOBILE = 3
// keep the card blurb short — the full text lives on the product page
const CARD_DESCRIPTION_CHARS = 110

type ProductCardProps = {
  product: ProductDto
  mobileColumns?: MobileColumns
}

export default function ProductCard({ product, mobileColumns = 1 }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const navigate = useNavigate()
  const playTransition = useCardTransitionStore((state) => state.play)
  const cardRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobileViewport()
  const [quantity, setQuantity] = useState(1)
  const [activeColor, setActiveColor] = useState<string | null>(null)
  const [imageIndex, setImageIndex] = useState(0)
  const hideDescriptionOnMobile = mobileColumns >= 2
  const hideTagsAndVariantsOnMobile = mobileColumns >= 2
  const hideCategoryOnMobile = mobileColumns >= 2
  const tinyTextOnMobile = mobileColumns >= 3
  // 3-col mobile: the card is too narrow for swatches — hide the row entirely.
  const hideSwatchRow = isMobile && mobileColumns >= 3
  // smaller swatches in the cramped 2-col mobile card so a full row + "+N" never wraps
  const swatchSizeClass = mobileColumns >= 2 ? 'max-sm:h-6 max-sm:w-6' : 'max-sm:h-7 max-sm:w-7'

  const initials = product.name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  const sellableVariants = product.variants.filter((variant) => variant.status !== 'SOLD_OUT')
  const sellableColors = new Set(
    sellableVariants.map((variant) => String(variant.attributes[COLOR_ATTRIBUTE_KEY] ?? ''))
  )
  const colorSwatches = product.colorSwatches ?? {}
  const swatchColors = Object.keys(colorSwatches).filter((color) => sellableColors.has(color))
  const maxSwatches = isMobile ? MAX_SWATCHES_MOBILE : MAX_SWATCHES_DESKTOP
  const visibleSwatches = swatchColors.slice(0, maxSwatches)
  const hiddenSwatchCount = swatchColors.length - visibleSwatches.length

  const distinctValueCount = (key: string) =>
    new Set(
      sellableVariants.map((variant) => String(variant.attributes[key] ?? '')).filter((value) => value !== '')
    ).size

  const activeVariant = activeColor
    ? sellableVariants.find((variant) => String(variant.attributes[COLOR_ATTRIBUTE_KEY] ?? '') === activeColor)
    : undefined
  const shownVariant = activeVariant ?? sellableVariants[0]
  // the card may only add straight to the cart when the shopper can't mean anything else:
  // one sellable variant, or a picked colour that has exactly one. Otherwise (sizes, or
  // several colours with none picked) the button opens the product page to choose.
  const candidateVariants = activeColor
    ? sellableVariants.filter((variant) => String(variant.attributes[COLOR_ATTRIBUTE_KEY] ?? '') === activeColor)
    : sellableVariants
  const needsChoice = candidateVariants.length > 1
  const { maxQuantity, remaining } = useStockLimit(shownVariant)
  // the whole stock of this variant is already in the cart
  const soldOutForShopper = !needsChoice && remaining === 0
  // «Под заказ» when everything the shopper could pick right now is pre-order (the picked
  // colour, or the whole product) — a 7–14 day wait they should see before opening the card
  const isPreOrder = candidateVariants.length > 0 && candidateVariants.every((variant) => variant.status === 'PRE_ORDER')

  // the gallery for the current view: the shown variant's own photos (borrowing the
  // closest sibling's if it has none, same rule the product page uses) — never every
  // variant's photos merged into one long strip. Only when NOTHING at all is available
  // for a colour the shopper actively picked do we fall back to that colour's swatch.
  const standardGallery = resolveVariantGallery(product, shownVariant)
  const cardImages: string[] = [
    ...new Set(
      standardGallery.length > 0
        ? standardGallery
        : activeColor && colorSwatches[activeColor]
          ? [colorSwatches[activeColor]]
          : [],
    ),
  ]
  const safeImageIndex = cardImages.length ? imageIndex % cardImages.length : 0
  const cardImage = cardImages[safeImageIndex] ?? null

  // reset to the first photo whenever the gallery changes under us
  useEffect(() => {
    setImageIndex(0)
  }, [activeColor])

  const stepImage = (delta: number) => (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setImageIndex((current) => (current + delta + cardImages.length) % cardImages.length)
  }
  const tagKeys = (attributes: Record<string, unknown>) =>
    Object.entries(attributes).filter(([key]) => !(key === COLOR_ATTRIBUTE_KEY && swatchColors.length > 0))
  const attributeTags = shownVariant
    ? tagKeys(shownVariant.attributes).map(([key, value]) => {
        const more = distinctValueCount(key) - 1
        return `${formatAttributeValue(key, value)}${more > 0 ? ` +${more}` : ''}`
      })
    : []
  // no colour picked → the product's "from" (cheapest) price; picked → that colour's price
  const shownPrice = activeVariant?.displayPrice ?? product.displayPrice

  // "Новинка" rides in front of the admin's own labels; the backend sets isNew
  // for two weeks after a product is added (skip it if the admin already typed one).
  const labelsWithNew =
    product.isNew && !(product.labels ?? []).includes('Новинка')
      ? ['Новинка', ...(product.labels ?? [])]
      : (product.labels ?? [])
  // «Под заказ» leads the sticker stack: it changes when the order arrives, which matters
  // more than any marketing label (the stack is vertical, so it never collides on 3 columns)
  const cardLabels = isPreOrder ? ['Под заказ', ...labelsWithNew.filter((label) => label !== 'Под заказ')] : labelsWithNew

  const playExpand = () => {
    if (!cardRef.current) {
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

  const handleAddToCart = () => {
    if (!shownVariant) {
      return
    }
    if (needsChoice) {
      playExpand()
      navigate(`/catalog/${product.id}`)
      return
    }
    addItem({
      variantId: shownVariant.id,
      productId: product.id,
      productName: product.name,
      sku: shownVariant.sku,
      attributes: shownVariant.attributes,
      unitPrice: shownVariant.displayPrice ?? product.displayPrice,
      quantity,
      status: shownVariant.status,
      maxQuantity,
    })
    setQuantity(1)
    notifyAddedToCart(product.name, shownVariant.id)
  }

  const handleCardClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (!target.closest('a') || target.closest('button')) {
      return
    }
    playExpand()
  }

  return (
    <div
      ref={cardRef}
      onClickCapture={handleCardClick}
      className="relative flex flex-col overflow-hidden rounded-3xl border-2 border-black bg-white shadow-[6px_6px_0_0_#000] transition select-none hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#E8799F] active:scale-[0.98]"
    >
      <ProductLabels labels={cardLabels} max={3} className="absolute left-3 top-3 z-10 max-sm:left-2 max-sm:top-2" />

      <Link
        to={`/catalog/${product.id}`}
        className="relative flex aspect-[4/5] items-center justify-center overflow-hidden border-b-2 border-black bg-silver"
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

        {cardImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={stepImage(-1)}
              aria-label="Предыдущее фото"
              className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 after:absolute after:-inset-3 after:content-[''] items-center justify-center rounded-full border-2 border-black bg-white text-ink shadow-[2px_2px_0_0_#000] transition hover:bg-bubblegum-dark hover:text-white active:scale-90 max-sm:h-7 max-sm:w-7"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={stepImage(1)}
              aria-label="Следующее фото"
              className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 after:absolute after:-inset-3 after:content-[''] items-center justify-center rounded-full border-2 border-black bg-white text-ink shadow-[2px_2px_0_0_#000] transition hover:bg-bubblegum-dark hover:text-white active:scale-90 max-sm:h-7 max-sm:w-7"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
            <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
              {cardImages.map((_, dot) => (
                <span
                  key={dot}
                  className={`h-1.5 w-1.5 rounded-full border border-black transition ${
                    dot === safeImageIndex ? 'bg-ink' : 'bg-white'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </Link>

      <div className={`flex flex-1 flex-col gap-2 p-5 ${mobileColumns >= 2 ? 'max-sm:p-3' : ''}`}>
        {/* every row below reserves its own height whether or not this particular
            product has that content, so cards never stagger to different sizes */}
        <div
          className={`flex h-6 items-center gap-1.5 overflow-hidden ${hideCategoryOnMobile ? 'max-sm:hidden' : ''}`}
        >
          {product.brand && (
            <span className="shrink-0 rounded-pill border-2 border-black bg-ink px-2 py-0.5 font-grotesk text-[10px] font-bold uppercase leading-none tracking-wide text-white">
              {product.brand}
            </span>
          )}
          {product.category && (
            <span className="truncate font-grotesk text-xs font-bold uppercase tracking-wide text-bubblegum-dark">
              {product.category}
            </span>
          )}
        </div>

        <Link
          to={`/catalog/${product.id}`}
          className="relative block after:absolute after:-inset-y-3.5 after:inset-x-0 after:content-['']"
        >
          {/* compact phone grids keep the name on two small lines (height reserved so
              cards line up) — one truncated line, or none at 3 columns, made products
              impossible to tell apart */}
          <h3
            className={`line-clamp-2 min-h-[3.5rem] break-words hyphens-auto font-grotesk text-lg font-bold text-ink transition hover:text-bubblegum-dark ${
              tinyTextOnMobile
                ? 'max-sm:min-h-6 max-sm:text-[10px] max-sm:leading-3'
                : hideDescriptionOnMobile
                  ? 'max-sm:min-h-8 max-sm:text-xs max-sm:leading-4'
                  : ''
            }`}
          >
            {product.name}
          </h3>
        </Link>

        <p
          className={`line-clamp-2 min-h-[2.5rem] text-sm text-ink/60 ${hideDescriptionOnMobile ? 'max-sm:hidden' : ''}`}
        >
          {product.description ? truncate(product.description, CARD_DESCRIPTION_CHARS) : ''}
        </p>

        <div
          className={`flex h-9 shrink-0 items-center gap-1 overflow-x-hidden ${
            hideTagsAndVariantsOnMobile ? 'max-sm:hidden' : ''
          }`}
        >
          {attributeTags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex shrink-0 items-center whitespace-nowrap rounded-pill border-2 border-black bg-silver px-2 py-1 font-grotesk text-[11px] font-bold leading-none text-ink"
            >
              {tag}
            </span>
          ))}
        </div>

        {!hideSwatchRow && (
          <div
            className={`flex h-9 items-center gap-2 max-sm:gap-1.5 ${
              mobileColumns >= 2 ? 'max-sm:h-6' : 'max-sm:h-7'
            }`}
          >
            {visibleSwatches.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setActiveColor((current) => (current === color ? null : color))}
                aria-label={color}
                title={color}
                aria-pressed={activeColor === color}
                className={`relative h-9 w-9 shrink-0 rounded-full border-2 transition after:absolute after:-inset-x-[3px] after:-inset-y-3.5 after:content-[''] active:scale-90 ${swatchSizeClass} ${
                  activeColor === color
                    ? 'border-bubblegum-dark shadow-[2px_2px_0_0_#E8799F]'
                    : 'border-black hover:border-bubblegum-dark'
                }`}
              >
                <img src={colorSwatches[color]} alt="" className="h-full w-full rounded-full object-cover" />
              </button>
            ))}
            {hiddenSwatchCount > 0 && (
              <Link
                to={`/catalog/${product.id}`}
                aria-label={`Ещё ${hiddenSwatchCount} цвет(а/ов)`}
                className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-black bg-silver font-grotesk after:absolute after:-inset-x-[3px] after:-inset-y-3.5 after:content-[''] text-xs font-bold text-ink transition hover:border-bubblegum-dark hover:bg-bubblegum-dark hover:text-white max-sm:text-[10px] ${swatchSizeClass}`}
              >
                +{hiddenSwatchCount}
              </Link>
            )}
          </div>
        )}

        <div
          className={`mt-auto flex items-center justify-between gap-2 pt-3 ${
            hideDescriptionOnMobile ? 'max-sm:mt-0 max-sm:pt-1' : ''
          }`}
        >
          <span
            className={`min-w-0 truncate font-grotesk text-base font-bold tabular-nums text-ink ${
              tinyTextOnMobile ? 'max-sm:text-[10px]' : hideDescriptionOnMobile ? 'max-sm:text-sm' : ''
            }`}
          >
            {formatPrice(shownPrice)}
          </span>
        </div>

        {hideDescriptionOnMobile && (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!shownVariant || soldOutForShopper}
            aria-label={needsChoice ? 'Выбрать вариант' : 'Добавить в корзину'}
            className="relative hidden w-full items-center justify-center gap-1 rounded-pill border-2 border-black bg-ink py-2 text-white transition after:absolute after:inset-x-0 after:-inset-y-2 after:content-[''] hover:bg-bubblegum-dark disabled:cursor-not-allowed disabled:opacity-40 max-sm:flex"
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
            {needsChoice && (
              <span aria-hidden="true" className="font-grotesk text-sm font-bold leading-none">
                ›
              </span>
            )}
          </button>
        )}

        <div className={`mt-3 flex items-center gap-2 ${hideDescriptionOnMobile ? 'max-sm:hidden' : ''}`}>
          {!needsChoice && (
            <>
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                disabled={!shownVariant || quantity <= 1}
                aria-label="Уменьшить количество"
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white font-grotesk text-base font-bold text-ink transition after:absolute after:-inset-2 after:content-[''] hover:bg-bubblegum-dark hover:text-white active:scale-90 active:bg-bubblegum-dark active:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                −
              </button>
              <span className="min-w-6 text-center font-grotesk text-sm font-bold text-ink">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((current) => current + 1)}
                disabled={!shownVariant || quantity >= remaining}
                aria-label="Увеличить количество"
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white font-grotesk text-base font-bold text-ink transition after:absolute after:-inset-2 after:content-[''] hover:bg-bubblegum-dark hover:text-white active:scale-90 active:bg-bubblegum-dark active:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                +
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!shownVariant || soldOutForShopper}
            className="flex-1 rounded-pill border-2 border-black bg-ink px-4 py-2 font-grotesk text-sm font-bold text-white transition hover:bg-bubblegum-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {needsChoice ? 'Выбрать' : soldOutForShopper ? 'Всё в корзине' : 'В корзину'}
          </button>
        </div>
      </div>
    </div>
  )
}
