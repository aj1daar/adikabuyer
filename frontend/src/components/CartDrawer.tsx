import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import useCartStore from '../store/useCartStore'
import submitCheckout from '../api/checkout'

export default function CartDrawer() {
  const items = useCartStore((state) => state.items)
  const isOpen = useCartStore((state) => state.isOpen)
  const closeCart = useCartStore((state) => state.closeCart)
  const removeItem = useCartStore((state) => state.removeItem)
  const clearCart = useCartStore((state) => state.clearCart)
  const totalPrice = useCartStore((state) => state.totalPrice())

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [region, setRegion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const canCheckout =
    items.length > 0 && customerName.trim() !== '' && customerPhone.trim() !== '' && region.trim() !== ''

  const handleCheckout = async () => {
    if (!canCheckout) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await submitCheckout({
        customerName,
        customerPhone,
        region,
        items: items.map((item) => ({
          variantId: item.variantId,
          productName: item.productName,
          sku: item.sku,
          attributes: item.attributes,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        })),
      })

      clearCart()
      closeCart()
      window.location.href = response.whatsappUrl
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Не удалось оформить заказ. Попробуйте ещё раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
              <h2 className="font-grotesk text-lg font-semibold text-ink">Корзина</h2>
              <button
                type="button"
                onClick={closeCart}
                className="text-sm text-ink/50 transition hover:text-ink"
              >
                Закрыть
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 && (
                <p className="text-sm text-ink/50">Корзина пуста.</p>
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
                      Удалить
                    </button>
                  </div>
                </div>
              ))}

              {items.length > 0 && (
                <div className="mt-4 flex flex-col gap-3">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Имя и фамилия"
                    className="rounded-xl border border-ink/15 px-4 py-2 text-sm text-ink outline-none focus:border-bubblegum"
                  />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    placeholder="Номер телефона"
                    className="rounded-xl border border-ink/15 px-4 py-2 text-sm text-ink outline-none focus:border-bubblegum"
                  />
                  <input
                    type="text"
                    value={region}
                    onChange={(event) => setRegion(event.target.value)}
                    placeholder="Город"
                    className="rounded-xl border border-ink/15 px-4 py-2 text-sm text-ink outline-none focus:border-bubblegum"
                  />
                  {submitError && <p className="text-xs text-red-500">{submitError}</p>}
                </div>
              )}
            </div>

            <div className="border-t border-ink/10 px-6 py-4">
              <div className="mb-4 flex items-center justify-between text-base font-semibold text-ink">
                <span>Итого</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={!canCheckout || isSubmitting}
                className="w-full rounded-pill bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-bubblegum-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? 'Оформляем заказ...' : 'Оформить заказ'}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
