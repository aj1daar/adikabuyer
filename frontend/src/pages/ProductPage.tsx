import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import MainLayout from '../layouts/MainLayout'
import catalogClient from '../api/catalogClient'
import useCartStore from '../store/useCartStore'
import useCardTransitionStore from '../store/useCardTransitionStore'
import { resolveVariantGallery } from '../utils/variantImage'
import usePageTitle from '../hooks/usePageTitle'
import formatPrice from '../utils/formatPrice'
import ProductLabels from '../components/ProductLabels'
import TextBubbleModal from '../components/TextBubbleModal'
import { popIn } from '../utils/motion'
import type { ProductDto, VariantDto } from '../types/catalog'
import { attributeKeyLabel, COLOR_ATTRIBUTE_KEY, formatAttributeValue } from '../utils/attributeOptions'
import {
  attributeKeys,
  attributeValues,
  isValueAvailable,
  resolveVariant,
} from '../utils/variantSelection'

// past this many values a row (colours, sizes, whatever) collapses behind a
// "+N" cell rather than growing the scroll strip indefinitely
const ATTR_VALUE_CAP = 8

function variantLabel(variant: VariantDto, index: number): string {
  if (!variant.sku.startsWith('DEFAULT-')) {
    return variant.sku
  }
  const values = Object.entries(variant.attributes).map(([key, value]) => formatAttributeValue(key, value))
  return values.length > 0 ? values.join(' · ') : `Вариант ${index + 1}`
}

export default function ProductPage() {
  const { id } = useParams()
  const addItem = useCartStore((state) => state.addItem)
  const openCart = useCartStore((state) => state.openCart)
  const playTransition = useCardTransitionStore((state) => state.play)

  const [product, setProduct] = useState<ProductDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
  // explicit attribute picks; a second click on an active value drops it
  const [selection, setSelection] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [descOpen, setDescOpen] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  // attribute keys whose value strip has been expanded past ATTR_VALUE_CAP
  const [expandedAttrs, setExpandedAttrs] = useState<Set<string>>(new Set())

  usePageTitle(product?.name)

  useEffect(() => {
    if (!justAdded) {
      return
    }
    const timer = setTimeout(() => setJustAdded(false), 1400)
    return () => clearTimeout(timer)
  }, [justAdded])

  useEffect(() => {
    if (!product) {
      return
    }
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description ?? undefined,
      image: product.imageUrl ?? undefined,
      offers: {
        '@type': 'Offer',
        price: product.displayPrice,
        priceCurrency: 'KGS',
        availability: 'https://schema.org/InStock',
      },
    })
    document.head.appendChild(script)
    return () => script.remove()
  }, [product])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    catalogClient
      .get<ProductDto>(`/products/${id}`, { signal: controller.signal })
      .then((response) => {
        setProduct(response.data)
        const firstSellable = response.data.variants.find((variant) => variant.status !== 'SOLD_OUT')
        setSelectedVariantId(firstSellable?.id ?? null)
        setSelection({})
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Не удалось загрузить товар')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })
    return () => controller.abort()
  }, [id])

  const sellableVariants = product
    ? product.variants.filter((variant) => variant.status !== 'SOLD_OUT')
    : []
  const selectedVariant = sellableVariants.find((variant) => variant.id === selectedVariantId)
  const gallery = product ? resolveVariantGallery(product, selectedVariant) : []
  const [photoIndex, setPhotoIndex] = useState(0)
  const imageUrl = gallery.length ? gallery[photoIndex % gallery.length] : null
  const stepPhoto = (delta: number) =>
    setPhotoIndex((current) => (current + delta + gallery.length) % gallery.length)
  const price = selectedVariant?.displayPrice ?? product?.displayPrice ?? 0

  const chooseVariant = (variantId: number) => {
    setSelectedVariantId(variantId)
    setPhotoIndex(0)
  }

  const keys = attributeKeys(sellableVariants)

  const chooseAttribute = (key: string, value: string) => {
    const nextSelection = { ...selection }
    if (nextSelection[key] === value) {
      delete nextSelection[key]
    } else {
      nextSelection[key] = value
    }
    setSelection(nextSelection)
    const next = resolveVariant(sellableVariants, nextSelection, key)
    if (next) {
      chooseVariant(next.id)
    }
  }

  const toggleAttrExpanded = (key: string) => {
    setExpandedAttrs((current) => {
      const next = new Set(current)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const initials = (product?.name ?? '')
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  const handleAddToCart = () => {
    if (!product || !selectedVariant) {
      return
    }
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      sku: selectedVariant.sku,
      attributes: selectedVariant.attributes,
      unitPrice: selectedVariant.displayPrice ?? product.displayPrice,
      quantity,
      status: selectedVariant.status,
    })
    setQuantity(1)
    setJustAdded(true)
    openCart()
  }

  return (
    <MainLayout>
        <div className="mx-auto max-w-5xl py-8">
          <Link
            to="/catalog"
            onClick={() => playTransition('collapse')}
            className="inline-flex items-center gap-2 rounded-pill border-2 border-black bg-white px-4 py-2 font-grotesk text-sm font-bold text-ink transition hover:bg-bubblegum hover:text-white"
          >
            ← Каталог
          </Link>

          {loading && <p className="mt-8 text-ink/60">Загрузка товара...</p>}
          {error && <p className="mt-8 text-red-500">{error}</p>}

          {!loading && !error && product && (
            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="absolute -left-6 -top-6 h-40 w-40 rounded-full bg-gradient-to-br from-bubblegum via-bubblegum-light to-silver blur-2xl opacity-60"
                />
                <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-3xl border-2 border-black bg-silver shadow-[8px_8px_0_0_#000]">
                  {imageUrl ? (
                    <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-grotesk text-6xl font-semibold text-ink/20">{initials}</span>
                  )}

                  {gallery.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => stepPhoto(-1)}
                        aria-label="Предыдущее фото"
                        className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-black bg-white text-ink shadow-[3px_3px_0_0_#000] transition hover:bg-bubblegum hover:text-white active:scale-90"
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => stepPhoto(1)}
                        aria-label="Следующее фото"
                        className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-black bg-white text-ink shadow-[3px_3px_0_0_#000] transition hover:bg-bubblegum hover:text-white active:scale-90"
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      </button>
                      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                        {gallery.map((_, dot) => (
                          <span
                            key={dot}
                            className={`h-2 w-2 rounded-full border-2 border-black transition ${
                              dot === photoIndex % gallery.length ? 'bg-ink' : 'bg-white'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {gallery.length > 1 && (
                  <div className="relative mt-4 flex gap-3 overflow-x-auto pb-2">
                    {gallery.map((url, index) => (
                      <button
                        key={url + index}
                        type="button"
                        onClick={() => setPhotoIndex(index)}
                        aria-label={`Фото ${index + 1}`}
                        aria-pressed={index === photoIndex}
                        className={`h-20 w-16 shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                          index === photoIndex
                            ? 'border-black shadow-[3px_3px_0_0_#E8799F]'
                            : 'border-black/30 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-5">
                <motion.div {...popIn(0)} className="flex flex-wrap items-center gap-2">
                  {product.brand && (
                    <span className="w-fit rounded-pill border-2 border-black bg-ink px-4 py-1 font-grotesk text-xs font-bold uppercase tracking-wider text-white shadow-[3px_3px_0_0_#000]">
                      {product.brand}
                    </span>
                  )}
                  {product.category && (
                    <span className="w-fit rounded-pill border-2 border-black bg-gradient-to-r from-bubblegum to-bubblegum-light px-4 py-1 font-grotesk text-xs font-bold uppercase tracking-wider text-ink shadow-[3px_3px_0_0_#000]">
                      {product.category}
                    </span>
                  )}
                  <ProductLabels labels={product.labels} size="page" />
                </motion.div>

                <motion.h1 {...popIn(0.05)} className="font-grotesk text-4xl font-bold text-ink sm:text-5xl">
                  {product.name}
                </motion.h1>

                {product.description && (
                  <>
                    <motion.button
                      type="button"
                      onClick={() => setDescOpen(true)}
                      initial={{ opacity: 0, scale: 0.85, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      whileTap={{ scale: 0.95, rotate: -1, transition: { type: 'spring', stiffness: 500, damping: 12 } }}
                      transition={{ type: 'spring', stiffness: 500, damping: 12, delay: 0.1 }}
                      className="group w-full rounded-2xl border-2 border-black bg-white px-4 py-3 text-left shadow-[4px_4px_0_0_#000] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#E8799F]"
                    >
                      <p className="line-clamp-2 text-base leading-relaxed text-ink/70">
                        {product.description}
                      </p>
                      <span className="mt-1.5 inline-flex items-center gap-1 font-grotesk text-[11px] font-bold uppercase tracking-wide text-bubblegum-dark">
                        Развернуть
                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 transition-transform group-hover:translate-x-0.5">
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      </span>
                    </motion.button>
                    <TextBubbleModal
                      open={descOpen}
                      title={product.name}
                      text={product.description}
                      onClose={() => setDescOpen(false)}
                    />
                  </>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <motion.div
                    key={price}
                    initial={{ scale: 0.7, rotate: -8, opacity: 0 }}
                    animate={{ scale: 1, rotate: -2, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 340, damping: 14 }}
                    className="w-fit rounded-2xl border-2 border-black bg-bubblegum px-5 py-2 shadow-[4px_4px_0_0_#000]"
                  >
                    <span className="font-grotesk text-3xl font-black tracking-tight text-white sm:text-4xl">
                      {formatPrice(price)}
                    </span>
                  </motion.div>
                  {selectedVariant && (
                    <motion.span
                      key={selectedVariant.id}
                      initial={{ opacity: 0, scale: 0.7, rotate: 6 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 340, damping: 14, delay: 0.05 }}
                      className={`rounded-pill border-2 border-black px-3 py-1.5 font-grotesk text-xs font-bold uppercase tracking-wide ${
                        selectedVariant.status === 'PRE_ORDER' ? 'bg-silver text-ink' : 'bg-white text-ink'
                      }`}
                    >
                      {selectedVariant.status === 'PRE_ORDER' ? 'Под заказ' : 'В наличии'}
                    </motion.span>
                  )}
                </div>

                {/* up to 5 attributes (backend cap) — every row reserves the same
                    height (label line + one non-wrapping, horizontally scrollable
                    value strip) so picking a value, or moving between products
                    with a different attribute count, never reflows the page */}
                {sellableVariants.length > 1 && keys.length > 0 && (
                  <div className="flex flex-col gap-4">
                    {keys.map((key, rowIndex) => {
                      const swatches = product.colorSwatches ?? {}
                      const useSwatches = key === COLOR_ATTRIBUTE_KEY && Object.keys(swatches).length > 0
                      const pickedValue = selectedVariant?.attributes[key]
                      const allValues = attributeValues(sellableVariants, key)
                      const isExpanded = expandedAttrs.has(key)
                      const collapsed = allValues.length > ATTR_VALUE_CAP && !isExpanded
                      const shownValues = collapsed ? allValues.slice(0, ATTR_VALUE_CAP - 1) : allValues
                      const hiddenCount = allValues.length - shownValues.length
                      return (
                        <motion.div key={key} {...popIn(0.15 + rowIndex * 0.06)} className="flex flex-col gap-2">
                          <div className="flex h-5 items-baseline justify-between gap-2">
                            <span className="truncate font-grotesk text-sm font-bold uppercase tracking-wide text-ink/60">
                              {attributeKeyLabel(key)}
                            </span>
                            {pickedValue != null && (
                              <span className="shrink-0 truncate font-grotesk text-sm font-bold text-ink">
                                {formatAttributeValue(key, pickedValue)}
                              </span>
                            )}
                          </div>
                          {/* capped + horizontally scrollable (no visible scrollbar) so 16
                              colours never blow out the row — "+N" pops the rest in place.
                              -mx-2 px-2: the selected-value pop (scale 1.06-1.1 + lift) needs
                              room to grow into: without it, the first pill sits flush against
                              the scroll container's left edge, so its own growth animation gets
                              clipped by the container's overflow-x boundary (can't scroll to
                              negative offsets to reveal it) instead of scaling smoothly */}
                          <div className="-mx-2 flex h-14 items-center gap-2 overflow-x-auto overscroll-contain px-2">
                            {shownValues.map((value, valueIndex) => {
                              const selected = selection[key] === value
                              const available = isValueAvailable(sellableVariants, selection, key, value)
                              const swatch = useSwatches ? swatches[value] : undefined
                              const popDelay = Math.min(valueIndex, 10) * 0.03
                              if (swatch) {
                                return (
                                  <motion.div
                                    key={value}
                                    initial={{ opacity: 0, scale: 0.5, y: 8 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ type: 'spring', stiffness: 420, damping: 15, delay: popDelay }}
                                    className="flex shrink-0"
                                  >
                                    <motion.button
                                      type="button"
                                      onClick={() => chooseAttribute(key, value)}
                                      aria-pressed={selected}
                                      aria-label={value}
                                      title={value}
                                      animate={{
                                        scale: selected ? 1.1 : 1,
                                        y: selected ? -2 : 0,
                                        // snappier + more damped than the row's mount pop-in spring
                                        // so the select toggle settles quickly and consistently even
                                        // when tapped again mid-animation, instead of a slow wobble
                                        transition: { type: 'spring', stiffness: 600, damping: 32 },
                                      }}
                                      whileTap={{ scale: 0.88, transition: { type: 'spring', stiffness: 600, damping: 32 } }}
                                      className={`h-11 w-11 overflow-hidden rounded-full border-2 ${
                                        selected
                                          ? 'border-bubblegum-dark shadow-[3px_3px_0_0_#E8799F]'
                                          : available
                                            ? 'border-black hover:border-bubblegum-dark'
                                            : 'border-black/30 opacity-40 hover:opacity-100'
                                      }`}
                                    >
                                      <img src={swatch} alt="" className="h-full w-full object-cover" />
                                    </motion.button>
                                  </motion.div>
                                )
                              }
                              return (
                                <motion.div
                                  key={value}
                                  initial={{ opacity: 0, scale: 0.5, y: 8 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  transition={{ type: 'spring', stiffness: 420, damping: 15, delay: popDelay }}
                                  className="flex shrink-0"
                                >
                                  <motion.button
                                    type="button"
                                    onClick={() => chooseAttribute(key, value)}
                                    aria-pressed={selected}
                                    animate={{
                                      scale: selected ? 1.06 : 1,
                                      y: selected ? -2 : 0,
                                      // snappier + more damped than the row's mount pop-in spring
                                      // so the select toggle settles quickly and consistently even
                                      // when tapped again mid-animation, instead of a slow wobble
                                      transition: { type: 'spring', stiffness: 600, damping: 32 },
                                    }}
                                    whileTap={{ scale: 0.9, transition: { type: 'spring', stiffness: 600, damping: 32 } }}
                                    className={`h-11 whitespace-nowrap rounded-pill border-2 border-black px-4 font-grotesk text-sm font-bold ${
                                      selected
                                        ? 'bg-ink text-white shadow-[3px_3px_0_0_#E8799F]'
                                        : available
                                          ? 'bg-white text-ink hover:bg-bubblegum hover:text-white'
                                          : 'bg-white text-ink/40 line-through hover:bg-bubblegum hover:text-white hover:no-underline'
                                    }`}
                                  >
                                    {formatAttributeValue(key, value)}
                                  </motion.button>
                                </motion.div>
                              )
                            })}
                            {collapsed && (
                              <motion.button
                                type="button"
                                onClick={() => toggleAttrExpanded(key)}
                                aria-label={`Показать ещё ${hiddenCount}`}
                                initial={{ opacity: 0, scale: 0.5, y: 8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                whileTap={{ scale: 0.88 }}
                                transition={{
                                  type: 'spring',
                                  stiffness: 420,
                                  damping: 15,
                                  delay: Math.min(shownValues.length, 10) * 0.03,
                                }}
                                className={
                                  useSwatches
                                    ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-black bg-silver font-grotesk text-xs font-bold text-ink transition hover:border-bubblegum-dark hover:bg-bubblegum hover:text-white'
                                    : 'flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-pill border-2 border-black bg-silver px-4 font-grotesk text-sm font-bold text-ink transition hover:border-bubblegum-dark hover:bg-bubblegum hover:text-white'
                                }
                              >
                                +{hiddenCount}
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}

                {sellableVariants.length > 1 && keys.length === 0 && (
                  <motion.div {...popIn(0.15)} className="flex flex-col gap-2">
                    <span className="h-5 font-grotesk text-sm font-bold uppercase tracking-wide text-ink/60">
                      Вариант
                    </span>
                    <div className="flex h-14 items-center gap-2 overflow-x-auto overscroll-contain">
                      {sellableVariants.map((variant, index) => (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => chooseVariant(variant.id)}
                          aria-pressed={variant.id === selectedVariantId}
                          className={`h-11 shrink-0 whitespace-nowrap rounded-pill border-2 border-black px-4 font-grotesk text-sm font-bold transition ${
                            variant.id === selectedVariantId
                              ? 'bg-ink text-white shadow-[3px_3px_0_0_#E8799F]'
                              : 'bg-white text-ink hover:bg-bubblegum hover:text-white'
                          }`}
                        >
                          {variantLabel(variant, index)}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* buy box — last thing in the column, sticks near the bottom of
                    the viewport as you scroll (clears the mobile tab bar) */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + keys.length * 0.06, type: 'spring', stiffness: 260, damping: 20 }}
                  className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom)+0.5rem)] z-20 mt-2 flex items-center gap-3 rounded-2xl border-2 border-black bg-white p-3 shadow-[4px_4px_0_0_#000] sm:bottom-4"
                >
                  <motion.button
                    type="button"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    disabled={!selectedVariant || quantity <= 1}
                    aria-label="Уменьшить количество"
                    whileTap={{ scale: 0.85 }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white font-grotesk text-lg font-bold text-ink transition hover:bg-bubblegum hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    −
                  </motion.button>
                  <span className="min-w-8 shrink-0 text-center font-grotesk text-lg font-bold text-ink">
                    {quantity}
                  </span>
                  <motion.button
                    type="button"
                    onClick={() => setQuantity((current) => current + 1)}
                    disabled={!selectedVariant}
                    aria-label="Увеличить количество"
                    whileTap={{ scale: 0.85 }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white font-grotesk text-lg font-bold text-ink transition hover:bg-bubblegum hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    +
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!selectedVariant}
                    whileTap={{ scale: 0.93, rotate: -1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 14 }}
                    className="flex-1 overflow-hidden rounded-pill border-2 border-black bg-ink px-6 py-3 font-grotesk text-sm font-bold text-white shadow-[4px_4px_0_0_#E8799F] transition hover:bg-bubblegum-dark hover:shadow-[6px_6px_0_0_#E8799F] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={justAdded ? 'added' : 'idle'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.16 }}
                        className="block"
                      >
                        {justAdded ? '✓ Добавлено' : 'В корзину'}
                      </motion.span>
                    </AnimatePresence>
                  </motion.button>
                </motion.div>
              </div>
            </div>
          )}
        </div>
    </MainLayout>
  )
}
