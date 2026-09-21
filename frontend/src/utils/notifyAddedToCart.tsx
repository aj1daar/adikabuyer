import toast from 'react-hot-toast'
import useCartStore from '../store/useCartStore'
import truncate from './truncate'

/**
 * The one "added to cart" confirmation, used by the catalog card and the product page
 * alike: a sticker toast naming the product with an «Открыть» button that opens the cart.
 * The drawer itself never pops open on its own, so adding a second size stays one tap.
 * Keyed by variant, so repeat taps refresh one toast instead of stacking.
 */
export default function notifyAddedToCart(productName: string, variantId: number) {
  toast.success(
    (t) => (
      <span className="flex items-center gap-3">
        <span className="min-w-0">В корзине: {truncate(productName, 40)}</span>
        <button
          type="button"
          onClick={() => {
            useCartStore.getState().openCart()
            toast.dismiss(t.id)
          }}
          className="min-h-9 shrink-0 rounded-pill border-2 border-black bg-ink px-3 text-xs font-bold text-white hover:bg-bubblegum-dark"
        >
          Открыть
        </button>
      </span>
    ),
    { id: `cart-${variantId}` },
  )
}
