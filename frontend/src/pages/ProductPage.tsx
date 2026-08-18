import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import catalogClient from '../api/catalogClient'
import useCartStore from '../store/useCartStore'
import { resolveVariantGallery } from '../utils/variantImage'
import usePageTitle from '../hooks/usePageTitle'
import formatPrice from '../utils/formatPrice'
import type { ProductDto, VariantDto } from '../types/catalog'

function variantLabel(variant: VariantDto): string {
  const values = Object.values(variant.attributes)
  return values.length > 0 ? values.join(' · ') : 'Стандарт'
}

export default function ProductPage() {
  const { id } = useParams()
  const addItem = useCartStore((state) => state.addItem)
  const openCart = useCartStore((state) => state.openCart)

  const [product, setProduct] = useState<ProductDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)

  usePageTitle(product?.name)

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
        setSelectedVariantId(response.data.variants[0]?.id ?? null)
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

  const selectedVariant = product?.variants.find((variant) => variant.id === selectedVariantId)
  const gallery = product ? resolveVariantGallery(product, selectedVariant) : []
  const [photoIndex, setPhotoIndex] = useState(0)
  const imageUrl = gallery[Math.min(photoIndex, gallery.length - 1)] ?? null
  const price = selectedVariant?.displayPrice ?? product?.displayPrice ?? 0

  const selectVariant = (variantId: number) => {
    setSelectedVariantId(variantId)
    setPhotoIndex(0)
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
    })
    setQuantity(1)
    openCart()
  }

  return (
    <MainLayout>
        <div className="mx-auto max-w-5xl py-8">
          <Link
            to="/catalog"
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
                {product.category && (
                  <span className="w-fit rounded-pill border-2 border-black bg-gradient-to-r from-bubblegum to-bubblegum-light px-4 py-1 font-grotesk text-xs font-bold uppercase tracking-wider text-ink shadow-[3px_3px_0_0_#000]">
                    {product.category}
                  </span>
                )}

                <h1 className="font-grotesk text-4xl font-bold text-ink sm:text-5xl">{product.name}</h1>

                {product.description && (
                  <p className="text-base leading-relaxed text-ink/70">{product.description}</p>
                )}

                <p className="font-grotesk text-3xl font-bold text-ink">{formatPrice(price)}</p>

                {product.variants.length > 1 && (
                  <div className="flex flex-col gap-2">
                    <span className="font-grotesk text-sm font-bold uppercase tracking-wide text-ink/60">
                      Вариант
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((variant) => (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => selectVariant(variant.id)}
                          aria-pressed={variant.id === selectedVariantId}
                          className={`rounded-pill border-2 border-black px-4 py-2 font-grotesk text-sm font-bold transition ${
                            variant.id === selectedVariantId
                              ? 'bg-ink text-white shadow-[3px_3px_0_0_#E8799F]'
                              : 'bg-white text-ink hover:bg-bubblegum hover:text-white'
                          }`}
                        >
                          {variantLabel(variant)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedVariant && (
                  <p className="text-sm text-ink/50">
                    {selectedVariant.status === 'PRE_ORDER' ? 'Под заказ' : 'В наличии'}
                    {!selectedVariant.sku.startsWith('DEFAULT-') && ` · SKU: ${selectedVariant.sku}`}
                  </p>
                )}

                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    disabled={!selectedVariant || quantity <= 1}
                    aria-label="Уменьшить количество"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white font-grotesk text-lg font-bold text-ink transition hover:bg-bubblegum hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center font-grotesk text-lg font-bold text-ink">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => current + 1)}
                    disabled={!selectedVariant}
                    aria-label="Увеличить количество"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white font-grotesk text-lg font-bold text-ink transition hover:bg-bubblegum hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!selectedVariant}
                    className="flex-1 rounded-pill border-2 border-black bg-ink px-6 py-3 font-grotesk text-sm font-bold text-white shadow-[4px_4px_0_0_#E8799F] transition hover:bg-bubblegum-dark hover:shadow-[6px_6px_0_0_#E8799F] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    В корзину
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
    </MainLayout>
  )
}
