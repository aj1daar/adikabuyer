import useCartStore from '../store/useCartStore'
import type { VariantDto } from '../types/catalog'

/**
 * How many more units of a variant the shopper may still add. In-stock variants are capped
 * at their stock minus what is already in the cart; pre-order has no cap (`maxQuantity`
 * undefined, `remaining` Infinity). Stops the «+» before checkout would refuse the order.
 */
export default function useStockLimit(variant: VariantDto | undefined) {
  const inCart = useCartStore(
    (state) => state.items.find((item) => item.variantId === variant?.id)?.quantity ?? 0,
  )
  const maxQuantity = variant?.status === 'IN_STOCK' ? variant.stockQuantity : undefined
  const remaining = maxQuantity != null ? Math.max(0, maxQuantity - inCart) : Infinity
  return { maxQuantity, remaining, inCart }
}
