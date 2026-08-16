import { AnimatePresence, motion } from 'framer-motion'
import useCartStore from '../store/useCartStore'

export default function CartDrawer() {
  const items = useCartStore((state) => state.items)
  const isOpen = useCartStore((state) => state.isOpen)
  const closeCart = useCartStore((state) => state.closeCart)
  const removeItem = useCartStore((state) => state.removeItem)
  const totalPrice = useCartStore((state) => state.totalPrice())

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="cart-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-40 bg-ink/40"
          />
          <motion.aside
            key="cart-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
              <h2 className="font-grotesk text-lg font-semibold text-ink">Your cart</h2>
              <button
                type="button"
                onClick={closeCart}
                className="text-sm text-ink/50 transition hover:text-ink"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 && (
                <p className="text-sm text-ink/50">Your cart is empty.</p>
              )}
              {items.map((item) => (
                <div
                  key={item.variantId}
                  className="flex items-center justify-between gap-3 border-b border-ink/5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{item.productName}</p>
                    <p className="text-xs text-ink/50">
                      {Object.values(item.attributes).join(', ')} · x{item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-ink">
                      ${(item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.variantId)}
                      className="text-xs text-ink/40 transition hover:text-bubblegum-dark"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-ink/10 px-6 py-4">
              <div className="flex items-center justify-between text-base font-semibold text-ink">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
